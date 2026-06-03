"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.campaignRouter = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const campaignSchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    description: zod_1.z.string().min(10),
    disasterType: zod_1.z.string().min(3),
    location: zod_1.z.string().min(3),
    targetAmount: zod_1.z.number().int().positive(),
    status: zod_1.z.nativeEnum(client_1.CampaignStatus).optional(),
    endDate: zod_1.z.string().datetime().optional(),
});
exports.campaignRouter = (0, express_1.Router)();
exports.campaignRouter.get("/", async (req, res, next) => {
    try {
        const status = req.query.status;
        const campaigns = await db_1.prisma.campaign.findMany({
            where: status ? { status } : undefined,
            orderBy: { createdAt: "desc" },
        });
        return res.json(campaigns);
    }
    catch (error) {
        return next(error);
    }
});
exports.campaignRouter.post("/", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res, next) => {
    try {
        const body = campaignSchema.parse(req.body);
        const campaign = await db_1.prisma.campaign.create({
            data: {
                ...body,
                endDate: body.endDate ? new Date(body.endDate) : null,
                createdById: req.user.id,
            },
        });
        return res.status(201).json(campaign);
    }
    catch (error) {
        return next(error);
    }
});
exports.campaignRouter.put("/:id", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const body = campaignSchema.partial().parse(req.body);
        const campaign = await db_1.prisma.campaign.update({
            where: { id },
            data: {
                ...body,
                endDate: body.endDate ? new Date(body.endDate) : undefined,
            },
        });
        return res.json(campaign);
    }
    catch (error) {
        return next(error);
    }
});
exports.campaignRouter.patch("/:id/close", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const campaign = await db_1.prisma.campaign.update({
            where: { id },
            data: { status: client_1.CampaignStatus.INACTIVE },
        });
        return res.json(campaign);
    }
    catch (error) {
        return next(error);
    }
});
exports.campaignRouter.get("/:id/donations", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const donations = await db_1.prisma.donation.findMany({
            where: { campaignId: id },
            include: {
                donor: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        let totalMoney = 0;
        const goodsMap = new Map();
        for (const donation of donations) {
            if (donation.type === "MONEY" && donation.amount) {
                totalMoney += donation.amount;
            }
            if (donation.type === "GOODS" && donation.itemName && donation.quantity) {
                goodsMap.set(donation.itemName, (goodsMap.get(donation.itemName) ?? 0) + donation.quantity);
            }
        }
        const goods = Array.from(goodsMap.entries()).map(([name, quantity]) => ({
            name,
            quantity,
        }));
        return res.json({
            campaignId: id,
            totalMoney,
            goods,
            donations,
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.campaignRouter.delete("/:id", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const campaign = await db_1.prisma.campaign.findUnique({
            where: { id },
            select: {
                id: true,
                donations: {
                    select: { id: true },
                },
                shipments: {
                    select: { id: true },
                },
            },
        });
        if (!campaign) {
            return res.status(404).json({ message: "Kampanye tidak ditemukan" });
        }
        const donationIds = campaign.donations.map((donation) => donation.id);
        const shipmentIds = campaign.shipments.map((shipment) => shipment.id);
        await db_1.prisma.$transaction(async (tx) => {
            if (shipmentIds.length > 0) {
                await tx.trackingEvent.deleteMany({
                    where: { shipmentId: { in: shipmentIds } },
                });
                await tx.aidShipment.deleteMany({
                    where: { id: { in: shipmentIds } },
                });
            }
            if (donationIds.length > 0) {
                await tx.inventoryItem.deleteMany({
                    where: { sourceDonationId: { in: donationIds } },
                });
                await tx.donation.deleteMany({
                    where: { id: { in: donationIds } },
                });
            }
            await tx.campaign.delete({ where: { id } });
        });
        return res.json({ message: "Kampanye berhasil dihapus" });
    }
    catch (error) {
        return next(error);
    }
});
