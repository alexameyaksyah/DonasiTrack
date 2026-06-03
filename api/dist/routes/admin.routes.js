"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const notification_service_1 = require("../services/notification.service");
const verificationSchema = zod_1.z.object({
    status: zod_1.z.enum(["VERIFIED", "REJECTED"]),
    note: zod_1.z.string().min(3).optional(),
});
const blockUserSchema = zod_1.z.object({
    blocked: zod_1.z.boolean(),
    reason: zod_1.z.string().min(3).max(200).optional(),
});
exports.adminRouter = (0, express_1.Router)();
exports.adminRouter.use(auth_1.requireAuth, (0, auth_1.requireRole)(client_1.Role.ADMIN));
exports.adminRouter.get("/operators", async (_req, res, next) => {
    try {
        const operators = await db_1.prisma.user.findMany({
            where: { role: client_1.Role.ADMIN },
            select: {
                id: true,
                name: true,
                email: true,
            },
            orderBy: { name: "asc" },
        });
        return res.json(operators);
    }
    catch (error) {
        return next(error);
    }
});
exports.adminRouter.get("/verifications", async (req, res, next) => {
    try {
        const status = req.query.status;
        const verifications = await db_1.prisma.donation.findMany({
            where: status ? { verificationStatus: status } : undefined,
            include: { donor: true, campaign: true },
            orderBy: { createdAt: "desc" },
        });
        return res.json(verifications);
    }
    catch (error) {
        return next(error);
    }
});
exports.adminRouter.get("/verifications/pending", async (_req, res, next) => {
    try {
        const pending = await db_1.prisma.donation.findMany({
            where: { verificationStatus: client_1.VerificationStatus.PENDING },
            include: { donor: true, campaign: true },
            orderBy: { createdAt: "asc" },
        });
        return res.json(pending);
    }
    catch (error) {
        return next(error);
    }
});
exports.adminRouter.patch("/verifications/:id", async (req, res, next) => {
    try {
        const body = verificationSchema.parse(req.body);
        const donation = await db_1.prisma.donation.findUnique({
            where: { id: req.params.id },
            include: { donor: true },
        });
        if (!donation) {
            return res.status(404).json({ message: "Donation not found" });
        }
        await db_1.prisma.$transaction(async (tx) => {
            await tx.donation.update({
                where: { id: donation.id },
                data: {
                    verificationStatus: body.status,
                    verificationNote: body.note,
                    verifiedById: req.user.id,
                },
            });
            if (body.status === "VERIFIED" && donation.type === client_1.DonationType.MONEY && donation.amount) {
                await tx.campaign.update({
                    where: { id: donation.campaignId },
                    data: {
                        collectedAmount: {
                            increment: donation.amount,
                        },
                    },
                });
            }
            if (body.status === "VERIFIED" && donation.type === client_1.DonationType.GOODS) {
                await tx.inventoryItem.create({
                    data: {
                        name: donation.itemName || "Item Donasi",
                        quantity: donation.quantity || 1,
                        sourceDonationId: donation.id,
                    },
                });
            }
        });
        await (0, notification_service_1.sendNotification)({
            userId: donation.donorId,
            token: donation.donor.fcmToken || undefined,
            title: "Status Donasi Diperbarui",
            body: body.status === "VERIFIED"
                ? "Donasi Anda berhasil diverifikasi admin."
                : "Donasi Anda ditolak. Silakan cek catatan admin.",
            payload: {
                donationId: donation.id,
                status: body.status,
            },
        });
        return res.json({ message: "Verification updated" });
    }
    catch (error) {
        return next(error);
    }
});
exports.adminRouter.get("/users", async (req, res, next) => {
    try {
        const users = await db_1.prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                _count: {
                    select: {
                        campaigns: true,
                        donations: true,
                        verifications: true,
                        assignedOperationalShipments: true,
                        createdShipments: true,
                        trackingEvents: true,
                    },
                },
            },
        });
        const userIds = users.map((user) => user.id);
        const accountLogs = userIds.length
            ? await db_1.prisma.notificationLog.findMany({
                where: {
                    userId: { in: userIds },
                    channel: "ACCOUNT",
                },
                orderBy: { createdAt: "desc" },
                select: {
                    userId: true,
                    status: true,
                    createdAt: true,
                    body: true,
                },
            })
            : [];
        const latestAccountState = new Map();
        for (const log of accountLogs) {
            if (!log.userId || latestAccountState.has(log.userId)) {
                continue;
            }
            latestAccountState.set(log.userId, log);
        }
        return res.json(users.map((user) => {
            const accountState = latestAccountState.get(user.id);
            const blocked = accountState?.status === "BLOCKED";
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                blocked,
                blockedReason: blocked ? accountState?.body || null : null,
                blockedAt: blocked ? accountState?.createdAt || null : null,
                relations: user._count,
                canDelete: user.role !== client_1.Role.ADMIN &&
                    user._count.campaigns === 0 &&
                    user._count.donations === 0 &&
                    user._count.verifications === 0 &&
                    user._count.assignedOperationalShipments === 0 &&
                    user._count.createdShipments === 0 &&
                    user._count.trackingEvents === 0,
                isSelf: user.id === req.user.id,
            };
        }));
    }
    catch (error) {
        return next(error);
    }
});
exports.adminRouter.patch("/users/:id/block", async (req, res, next) => {
    try {
        const body = blockUserSchema.parse(req.body);
        const userId = String(req.params.id);
        if (userId === req.user.id) {
            return res.status(400).json({ message: "Tidak bisa memblokir akun sendiri" });
        }
        const target = await db_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, role: true },
        });
        if (!target) {
            return res.status(404).json({ message: "Akun tidak ditemukan" });
        }
        if (target.role === client_1.Role.ADMIN) {
            return res.status(403).json({ message: "Akun admin tidak bisa diblokir" });
        }
        await db_1.prisma.notificationLog.create({
            data: {
                userId,
                channel: "ACCOUNT",
                title: body.blocked ? "Akun diblokir" : "Akun diaktifkan kembali",
                body: body.reason || (body.blocked ? "Diblokir oleh admin" : "Status blokir dicabut oleh admin"),
                status: body.blocked ? "BLOCKED" : "UNBLOCKED",
                payload: {
                    actedBy: req.user.id,
                },
            },
        });
        return res.json({
            message: body.blocked ? "Akun berhasil diblokir" : "Blokir akun berhasil dicabut",
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.adminRouter.delete("/users/:id", async (req, res, next) => {
    try {
        const userId = String(req.params.id);
        if (userId === req.user.id) {
            return res.status(400).json({ message: "Tidak bisa menghapus akun sendiri" });
        }
        const user = await db_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
                _count: {
                    select: {
                        campaigns: true,
                        donations: true,
                        verifications: true,
                        assignedOperationalShipments: true,
                        createdShipments: true,
                        trackingEvents: true,
                    },
                },
            },
        });
        if (!user) {
            return res.status(404).json({ message: "Akun tidak ditemukan" });
        }
        if (user.role === client_1.Role.ADMIN) {
            return res.status(403).json({ message: "Akun admin tidak bisa dihapus" });
        }
        const hasRelations = user._count.campaigns > 0 ||
            user._count.donations > 0 ||
            user._count.verifications > 0 ||
            user._count.assignedOperationalShipments > 0 ||
            user._count.createdShipments > 0 ||
            user._count.trackingEvents > 0;
        if (hasRelations) {
            return res.status(409).json({
                message: "Akun tidak bisa dihapus karena masih memiliki relasi data. Gunakan blokir akun.",
            });
        }
        await db_1.prisma.$transaction(async (tx) => {
            await tx.notificationLog.deleteMany({ where: { userId } });
            await tx.user.delete({ where: { id: userId } });
        });
        return res.json({ message: "Akun berhasil dihapus" });
    }
    catch (error) {
        return next(error);
    }
});
