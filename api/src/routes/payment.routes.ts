import { createHash } from "node:crypto";
import { DonationType, Role, VerificationStatus } from "@prisma/client";
import { Response, Router } from "express";
import { z } from "zod";
import { env } from "../config/env";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";

const bankTransferSchema = z.object({
  campaignId: z.string().cuid(),
  amount: z.number().int().positive(),
  bank: z.enum(["bca", "bni", "bri", "permata"]).default("bca"),
});

const midtransNotificationSchema = z.object({
  order_id: z.string(),
  status_code: z.string(),
  gross_amount: z.string(),
  signature_key: z.string(),
  transaction_status: z.string(),
  transaction_id: z.string().optional(),
  payment_type: z.string().optional(),
  fraud_status: z.string().optional(),
  settlement_time: z.string().optional(),
  expiry_time: z.string().optional(),
  va_numbers: z
    .array(
      z.object({
        bank: z.string().optional(),
        va_number: z.string().optional(),
      }),
    )
    .optional(),
  permata_va_number: z.string().optional(),
});

type MidtransChargeResponse = {
  transaction_id?: string;
  transaction_status?: string;
  payment_type?: string;
  gross_amount?: string;
  expiry_time?: string;
  settlement_time?: string;
  va_numbers?: Array<{ bank?: string; va_number?: string }>;
  permata_va_number?: string;
};

type ParsedPaymentData = {
  paymentStatus: string;
  verificationStatus?: VerificationStatus;
  paidAt?: Date;
  expiredAt?: Date;
  transactionId?: string;
  paymentType?: string;
  bank?: string;
  vaNumber?: string;
};

export const paymentRouter = Router();

function requireMidtransConfig(res: Response) {
  if (!env.midtransServerKey) {
    res.status(500).json({ message: "MIDTRANS_SERVER_KEY belum dikonfigurasi" });
    return false;
  }

  return true;
}

function midtransAuthHeader() {
  return `Basic ${Buffer.from(`${env.midtransServerKey}:`).toString("base64")}`;
}

function verifyMidtransSignature(payload: z.infer<typeof midtransNotificationSchema>) {
  const raw = `${payload.order_id}${payload.status_code}${payload.gross_amount}${env.midtransServerKey}`;
  const expected = createHash("sha512").update(raw).digest("hex");
  return expected === payload.signature_key;
}

function normalizeMidtransStatus(transactionStatus?: string, fraudStatus?: string) {
  if (transactionStatus === "capture") {
    return fraudStatus === "challenge" ? "challenge" : "settlement";
  }

  return transactionStatus || "unknown";
}

function extractPaymentData(payload: MidtransChargeResponse): ParsedPaymentData {
  const paymentStatus = normalizeMidtransStatus(payload.transaction_status);
  const va = payload.va_numbers?.[0];
  const paidAt = payload.transaction_status === "settlement" && "settlement_time" in payload
    ? new Date(String(payload.settlement_time))
    : undefined;

  return {
    paymentStatus,
    verificationStatus: paymentStatus === "settlement" ? VerificationStatus.VERIFIED : undefined,
    paidAt,
    expiredAt: payload.expiry_time ? new Date(payload.expiry_time) : undefined,
    transactionId: payload.transaction_id,
    paymentType: payload.payment_type,
    bank: va?.bank,
    vaNumber: va?.va_number || payload.permata_va_number,
  };
}

async function applyPaymentStatus(orderId: string, rawPayload: unknown, data: ParsedPaymentData) {
  const donation = await prisma.donation.findUnique({
    where: { midtransOrderId: orderId },
    select: {
      id: true,
      campaignId: true,
      amount: true,
      type: true,
      verificationStatus: true,
    },
  });

  if (!donation) {
    return null;
  }

  const shouldVerify =
    data.verificationStatus === VerificationStatus.VERIFIED &&
    donation.verificationStatus !== VerificationStatus.VERIFIED &&
    donation.type === DonationType.MONEY &&
    donation.amount;

  await prisma.$transaction(async (tx) => {
    await tx.donation.update({
      where: { id: donation.id },
      data: {
        paymentStatus: data.paymentStatus,
        paymentType: data.paymentType,
        midtransTransactionId: data.transactionId,
        bank: data.bank,
        vaNumber: data.vaNumber,
        paidAt: data.paidAt,
        expiredAt: data.expiredAt,
        paymentPayload: rawPayload as object,
        verificationStatus: data.verificationStatus,
      },
    });

    if (shouldVerify) {
      await tx.campaign.update({
        where: { id: donation.campaignId },
        data: {
          collectedAmount: {
            increment: donation.amount || 0,
          },
        },
      });
    }
  });

  return prisma.donation.findUnique({
    where: { id: donation.id },
    include: { campaign: true },
  });
}

paymentRouter.post("/midtrans/bank-transfer", requireAuth, requireRole(Role.DONOR), async (req, res, next) => {
  try {
    if (!requireMidtransConfig(res)) {
      return;
    }

    const body = bankTransferSchema.parse(req.body);
    const campaign = await prisma.campaign.findUnique({
      where: { id: body.campaignId },
      select: { id: true, title: true },
    });

    if (!campaign) {
      return res.status(404).json({ message: "Campaign tidak ditemukan" });
    }

    const donation = await prisma.donation.create({
      data: {
        campaignId: body.campaignId,
        donorId: req.user!.id,
        type: DonationType.MONEY,
        amount: body.amount,
        paymentProvider: "MIDTRANS",
        paymentStatus: "creating",
        paymentType: "bank_transfer",
        bank: body.bank,
      },
    });

    const orderId = `donasi-${donation.id}`;
    await prisma.donation.update({
      where: { id: donation.id },
      data: { midtransOrderId: orderId },
    });

    const midtransResponse = await fetch(env.midtransChargeUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: midtransAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment_type: "bank_transfer",
        transaction_details: {
          order_id: orderId,
          gross_amount: body.amount,
        },
        bank_transfer: {
          bank: body.bank,
        },
        custom_field1: donation.id,
        custom_field2: body.campaignId,
      }),
    });

    const payment = (await midtransResponse.json()) as MidtransChargeResponse;
    const paymentData = extractPaymentData(payment);

    await prisma.donation.update({
      where: { id: donation.id },
      data: {
        paymentStatus: paymentData.paymentStatus,
        paymentType: paymentData.paymentType || "bank_transfer",
        midtransTransactionId: paymentData.transactionId,
        bank: paymentData.bank || body.bank,
        vaNumber: paymentData.vaNumber,
        expiredAt: paymentData.expiredAt,
        paymentPayload: payment as object,
      },
    });

    if (!midtransResponse.ok) {
      return res.status(midtransResponse.status).json({
        message: "Gagal membuat transaksi Midtrans",
        donationId: donation.id,
        orderId,
        payment,
      });
    }

    return res.status(201).json({
      donationId: donation.id,
      orderId,
      amount: body.amount,
      bank: paymentData.bank || body.bank,
      vaNumber: paymentData.vaNumber,
      paymentStatus: paymentData.paymentStatus,
      expiryTime: payment.expiry_time,
      raw: payment,
    });
  } catch (error) {
    return next(error);
  }
});

paymentRouter.post("/midtrans/notification", async (req, res, next) => {
  try {
    if (!requireMidtransConfig(res)) {
      return;
    }

    const payload = midtransNotificationSchema.parse(req.body);

    if (!verifyMidtransSignature(payload)) {
      return res.status(403).json({ message: "Invalid Midtrans signature" });
    }

    const paymentData = extractPaymentData(payload);
    const donation = await applyPaymentStatus(payload.order_id, payload, paymentData);

    if (!donation) {
      return res.status(404).json({ message: "Donation untuk order_id ini tidak ditemukan" });
    }

    return res.json({
      message: "Midtrans notification processed",
      donationId: donation.id,
      paymentStatus: donation.paymentStatus,
      verificationStatus: donation.verificationStatus,
    });
  } catch (error) {
    return next(error);
  }
});

paymentRouter.post("/midtrans/:orderId/sync", requireAuth, async (req, res, next) => {
  try {
    if (!requireMidtransConfig(res)) {
      return;
    }

    const orderId = String(req.params.orderId);
    const donation = await prisma.donation.findUnique({
      where: { midtransOrderId: orderId },
      select: { donorId: true },
    });

    if (!donation) {
      return res.status(404).json({ message: "Donation untuk order_id ini tidak ditemukan" });
    }

    if (req.user!.role !== Role.ADMIN && donation.donorId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const midtransResponse = await fetch(`${env.midtransStatusUrl}/${encodeURIComponent(orderId)}/status`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: midtransAuthHeader(),
      },
    });

    const payment = (await midtransResponse.json()) as MidtransChargeResponse;

    if (!midtransResponse.ok) {
      return res.status(midtransResponse.status).json({
        message: "Gagal mengambil status Midtrans",
        payment,
      });
    }

    const updated = await applyPaymentStatus(orderId, payment, extractPaymentData(payment));

    return res.json({
      message: "Payment status synced",
      donation: updated,
      payment,
    });
  } catch (error) {
    return next(error);
  }
});

paymentRouter.get("/donations/:donationId", requireAuth, async (req, res, next) => {
  try {
    const donation = await prisma.donation.findUnique({
      where: { id: String(req.params.donationId) },
      include: { campaign: true },
    });

    if (!donation) {
      return res.status(404).json({ message: "Donation tidak ditemukan" });
    }

    if (req.user!.role !== Role.ADMIN && donation.donorId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.json(donation);
  } catch (error) {
    return next(error);
  }
});
