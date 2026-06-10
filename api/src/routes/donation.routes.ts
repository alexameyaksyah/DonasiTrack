import { DonationType, Role, VerificationStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";

const donationSchema = z.object({
  campaignId: z.string().cuid(),
  type: z.nativeEnum(DonationType),
  amount: z.number().int().positive().optional(),
  itemName: z.string().min(2).optional(),
  quantity: z.number().int().positive().optional(),
  transferProofUrl: z.string().url().optional(),
});

const bcaMidtransDonationSchema = z.object({
  campaignId: z.string().cuid(),
  amount: z.number().int().positive(),
});

export const donationRouter = Router();

donationRouter.post("/", requireAuth, requireRole(Role.DONOR), async (req, res, next) => {
  try {
    const body = donationSchema.parse(req.body);

    if (body.type === DonationType.MONEY && !body.amount) {
      return res.status(400).json({ message: "amount is required for MONEY donation" });
    }

    if (body.type === DonationType.GOODS && (!body.itemName || !body.quantity)) {
      return res.status(400).json({ message: "itemName and quantity are required for GOODS donation" });
    }

    const donation = await prisma.donation.create({
      data: {
        ...body,
        donorId: req.user!.id,
        verificationStatus: body.type === DonationType.MONEY ? VerificationStatus.VERIFIED : undefined,
      },
    });

    return res.status(201).json(donation);
  } catch (error) {
    return next(error);
  }
});

donationRouter.post("/midtrans/bca", requireAuth, requireRole(Role.DONOR), async (req, res, next) => {
  try {
    if (!env.midtransServerKey) {
      return res.status(500).json({ message: "MIDTRANS_SERVER_KEY belum dikonfigurasi" });
    }

    const body = bcaMidtransDonationSchema.parse(req.body);

    const campaign = await prisma.campaign.findUnique({
      where: { id: body.campaignId },
      select: { id: true },
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
        verificationStatus: VerificationStatus.VERIFIED,
      },
    });

    const orderId = `donasi-${donation.id}`;
    const authString = Buffer.from(`${env.midtransServerKey}:`).toString("base64");

    const midtransResponse = await fetch(env.midtransChargeUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${authString}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment_type: "bank_transfer",
        transaction_details: {
          order_id: orderId,
          gross_amount: body.amount,
        },
        bank_transfer: {
          bank: "bca",
        },
        custom_field1: donation.id,
      }),
    });

    const payment = (await midtransResponse.json()) as unknown;

    if (!midtransResponse.ok) {
      return res.status(midtransResponse.status).json({
        message: "Gagal membuat transaksi Midtrans",
        donation,
        payment,
      });
    }

    return res.status(201).json({
      donation,
      orderId,
      payment,
    });
  } catch (error) {
    return next(error);
  }
});

donationRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const donations = await prisma.donation.findMany({
      where: { donorId: req.user!.id },
      include: { campaign: true },
      orderBy: { createdAt: "desc" },
    });

    return res.json(donations);
  } catch (error) {
    return next(error);
  }
});
