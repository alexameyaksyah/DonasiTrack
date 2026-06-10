"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRouter = void 0;
const node_crypto_1 = require("node:crypto");
const client_1 = require("@prisma/client");
const express_1 = require("express");
const zod_1 = require("zod");
const env_1 = require("../config/env");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const paymentMethodSchema = zod_1.z.enum(["bca", "bni", "bri", "permata", "qris"]);
const createPaymentSchema = zod_1.z.object({
    campaignId: zod_1.z.string().cuid(),
    amount: zod_1.z.number().int().positive(),
    method: paymentMethodSchema.default("bca"),
    bank: zod_1.z.enum(["bca", "bni", "bri", "permata"]).optional(),
});
const midtransNotificationSchema = zod_1.z.object({
    order_id: zod_1.z.string(),
    status_code: zod_1.z.string(),
    gross_amount: zod_1.z.string(),
    signature_key: zod_1.z.string(),
    transaction_status: zod_1.z.string(),
    transaction_id: zod_1.z.string().optional(),
    payment_type: zod_1.z.string().optional(),
    fraud_status: zod_1.z.string().optional(),
    settlement_time: zod_1.z.string().optional(),
    expiry_time: zod_1.z.string().optional(),
    va_numbers: zod_1.z
        .array(zod_1.z.object({
        bank: zod_1.z.string().optional(),
        va_number: zod_1.z.string().optional(),
    }))
        .optional(),
    permata_va_number: zod_1.z.string().optional(),
});
exports.paymentRouter = (0, express_1.Router)();
function requireMidtransConfig(res) {
    if (!env_1.env.midtransServerKey) {
        res.status(500).json({ message: "MIDTRANS_SERVER_KEY belum dikonfigurasi" });
        return false;
    }
    return true;
}
function midtransAuthHeader() {
    return `Basic ${Buffer.from(`${env_1.env.midtransServerKey}:`).toString("base64")}`;
}
function verifyMidtransSignature(payload) {
    const raw = `${payload.order_id}${payload.status_code}${payload.gross_amount}${env_1.env.midtransServerKey}`;
    const expected = (0, node_crypto_1.createHash)("sha512").update(raw).digest("hex");
    return expected === payload.signature_key;
}
function normalizeMidtransStatus(transactionStatus, fraudStatus) {
    if (transactionStatus === "capture") {
        return fraudStatus === "challenge" ? "challenge" : "settlement";
    }
    return transactionStatus || "unknown";
}
function extractPaymentData(payload) {
    const paymentStatus = normalizeMidtransStatus(payload.transaction_status);
    const va = payload.va_numbers?.[0];
    const qrCodeUrl = payload.actions?.find((action) => action.name === "generate-qr-code")?.url;
    const paidAt = payload.transaction_status === "settlement" && "settlement_time" in payload
        ? new Date(String(payload.settlement_time))
        : undefined;
    return {
        paymentStatus,
        verificationStatus: paymentStatus === "settlement" ? client_1.VerificationStatus.VERIFIED : undefined,
        paidAt,
        expiredAt: payload.expiry_time ? new Date(payload.expiry_time) : undefined,
        transactionId: payload.transaction_id,
        paymentType: payload.payment_type,
        bank: va?.bank || payload.acquirer,
        vaNumber: va?.va_number || payload.permata_va_number,
        qrCodeUrl,
        qrString: payload.qr_string,
    };
}
async function applyPaymentStatus(orderId, rawPayload, data) {
    const donation = await db_1.prisma.donation.findUnique({
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
    const shouldVerify = data.verificationStatus === client_1.VerificationStatus.VERIFIED &&
        donation.verificationStatus !== client_1.VerificationStatus.VERIFIED &&
        donation.type === client_1.DonationType.MONEY &&
        donation.amount;
    await db_1.prisma.$transaction(async (tx) => {
        await tx.donation.update({
            where: { id: donation.id },
            data: {
                paymentStatus: data.paymentStatus,
                paymentType: data.paymentType,
                midtransTransactionId: data.transactionId,
                bank: data.bank,
                vaNumber: data.vaNumber,
                paymentPayload: {
                    ...rawPayload,
                    qrCodeUrl: data.qrCodeUrl,
                    qrString: data.qrString,
                },
                paidAt: data.paidAt,
                expiredAt: data.expiredAt,
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
    return db_1.prisma.donation.findUnique({
        where: { id: donation.id },
        include: { campaign: true },
    });
}
const createMidtransPayment = async (req, res, next) => {
    try {
        if (!requireMidtransConfig(res)) {
            return;
        }
        const body = createPaymentSchema.parse(req.body);
        const selectedBank = body.method === "qris" ? undefined : body.bank || body.method;
        const campaign = await db_1.prisma.campaign.findUnique({
            where: { id: body.campaignId },
            select: { id: true, title: true },
        });
        if (!campaign) {
            return res.status(404).json({ message: "Campaign tidak ditemukan" });
        }
        const donation = await db_1.prisma.donation.create({
            data: {
                campaignId: body.campaignId,
                donorId: req.user.id,
                type: client_1.DonationType.MONEY,
                amount: body.amount,
                paymentProvider: "MIDTRANS",
                paymentStatus: "creating",
                paymentType: body.method === "qris" ? "qris" : "bank_transfer",
                bank: selectedBank,
            },
        });
        const orderId = `donasi-${donation.id}`;
        await db_1.prisma.donation.update({
            where: { id: donation.id },
            data: { midtransOrderId: orderId },
        });
        const midtransPayload = body.method === "qris"
            ? {
                payment_type: "qris",
                transaction_details: {
                    order_id: orderId,
                    gross_amount: body.amount,
                },
                custom_field1: donation.id,
                custom_field2: body.campaignId,
            }
            : {
                payment_type: "bank_transfer",
                transaction_details: {
                    order_id: orderId,
                    gross_amount: body.amount,
                },
                bank_transfer: {
                    bank: selectedBank,
                },
                custom_field1: donation.id,
                custom_field2: body.campaignId,
            };
        const midtransResponse = await fetch(env_1.env.midtransChargeUrl, {
            method: "POST",
            headers: {
                Accept: "application/json",
                Authorization: midtransAuthHeader(),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(midtransPayload),
        });
        const payment = (await midtransResponse.json());
        const paymentData = extractPaymentData(payment);
        await db_1.prisma.donation.update({
            where: { id: donation.id },
            data: {
                paymentStatus: paymentData.paymentStatus,
                paymentType: paymentData.paymentType || (body.method === "qris" ? "qris" : "bank_transfer"),
                midtransTransactionId: paymentData.transactionId,
                bank: paymentData.bank || selectedBank,
                vaNumber: paymentData.vaNumber,
                expiredAt: paymentData.expiredAt,
                paymentPayload: {
                    ...payment,
                    qrCodeUrl: paymentData.qrCodeUrl,
                    qrString: paymentData.qrString,
                },
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
            method: body.method,
            paymentType: paymentData.paymentType || (body.method === "qris" ? "qris" : "bank_transfer"),
            bank: paymentData.bank || selectedBank,
            vaNumber: paymentData.vaNumber,
            qrCodeUrl: paymentData.qrCodeUrl,
            qrString: paymentData.qrString,
            paymentStatus: paymentData.paymentStatus,
            expiryTime: payment.expiry_time,
            raw: payment,
        });
    }
    catch (error) {
        return next(error);
    }
};
exports.paymentRouter.post("/midtrans/create", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.Role.DONOR), createMidtransPayment);
exports.paymentRouter.post("/midtrans/bank-transfer", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.Role.DONOR), async (req, res, next) => {
    req.body = {
        ...req.body,
        method: req.body?.bank || "bca",
    };
    return createMidtransPayment(req, res, next);
});
exports.paymentRouter.post("/midtrans/notification", async (req, res, next) => {
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
    }
    catch (error) {
        return next(error);
    }
});
exports.paymentRouter.post("/midtrans/:orderId/sync", auth_1.requireAuth, async (req, res, next) => {
    try {
        if (!requireMidtransConfig(res)) {
            return;
        }
        const orderId = String(req.params.orderId);
        const donation = await db_1.prisma.donation.findUnique({
            where: { midtransOrderId: orderId },
            select: { donorId: true },
        });
        if (!donation) {
            return res.status(404).json({ message: "Donation untuk order_id ini tidak ditemukan" });
        }
        if (req.user.role !== client_1.Role.ADMIN && donation.donorId !== req.user.id) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const midtransResponse = await fetch(`${env_1.env.midtransStatusUrl}/${encodeURIComponent(orderId)}/status`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: midtransAuthHeader(),
            },
        });
        const payment = (await midtransResponse.json());
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
    }
    catch (error) {
        return next(error);
    }
});
exports.paymentRouter.get("/donations/:donationId", auth_1.requireAuth, async (req, res, next) => {
    try {
        const donation = await db_1.prisma.donation.findUnique({
            where: { id: String(req.params.donationId) },
            include: { campaign: true },
        });
        if (!donation) {
            return res.status(404).json({ message: "Donation tidak ditemukan" });
        }
        if (req.user.role !== client_1.Role.ADMIN && donation.donorId !== req.user.id) {
            return res.status(403).json({ message: "Forbidden" });
        }
        return res.json(donation);
    }
    catch (error) {
        return next(error);
    }
});
