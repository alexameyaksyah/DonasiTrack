"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.donationRouter = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const zod_1 = require("zod");
const env_1 = require("../config/env");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const donationSchema = zod_1.z.object({
    campaignId: zod_1.z.string().cuid(),
    type: zod_1.z.nativeEnum(client_1.DonationType),
    amount: zod_1.z.number().int().positive().optional(),
    itemName: zod_1.z.string().min(2).optional(),
    quantity: zod_1.z.number().int().positive().optional(),
    transferProofUrl: zod_1.z.string().url().optional(),
});
const bcaMidtransDonationSchema = zod_1.z.object({
    campaignId: zod_1.z.string().cuid(),
    amount: zod_1.z.number().int().positive(),
});
exports.donationRouter = (0, express_1.Router)();
exports.donationRouter.post("/", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.Role.DONOR), async (req, res, next) => {
    try {
        const body = donationSchema.parse(req.body);
        if (body.type === client_1.DonationType.MONEY && !body.amount) {
            return res.status(400).json({ message: "amount is required for MONEY donation" });
        }
        if (body.type === client_1.DonationType.GOODS && (!body.itemName || !body.quantity)) {
            return res.status(400).json({ message: "itemName and quantity are required for GOODS donation" });
        }
        const donation = await db_1.prisma.donation.create({
            data: {
                ...body,
                donorId: req.user.id,
            },
        });
        return res.status(201).json(donation);
    }
    catch (error) {
        return next(error);
    }
});
exports.donationRouter.post("/midtrans/bca", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.Role.DONOR), async (req, res, next) => {
    try {
        if (!env_1.env.midtransServerKey) {
            return res.status(500).json({ message: "MIDTRANS_SERVER_KEY belum dikonfigurasi" });
        }
        const body = bcaMidtransDonationSchema.parse(req.body);
        const campaign = await db_1.prisma.campaign.findUnique({
            where: { id: body.campaignId },
            select: { id: true },
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
            },
        });
        const orderId = `donasi-${donation.id}`;
        const authString = Buffer.from(`${env_1.env.midtransServerKey}:`).toString("base64");
        const midtransResponse = await fetch(env_1.env.midtransChargeUrl, {
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
        const payment = (await midtransResponse.json());
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
    }
    catch (error) {
        return next(error);
    }
});
exports.donationRouter.get("/me", auth_1.requireAuth, async (req, res, next) => {
    try {
        const donations = await db_1.prisma.donation.findMany({
            where: { donorId: req.user.id },
            include: { campaign: true },
            orderBy: { createdAt: "desc" },
        });
        return res.json(donations);
    }
    catch (error) {
        return next(error);
    }
});
