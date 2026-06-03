"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsRouter = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
exports.statsRouter = (0, express_1.Router)();
exports.statsRouter.get("/dashboard", auth_1.requireAuth, (0, auth_1.requireRole)(client_1.Role.ADMIN), async (_req, res, next) => {
    try {
        const [donationAgg, campaigns, campaignDistributedAgg, inventoryAgg, pendingVerifications, donationStatusAgg, latestDonations,] = await Promise.all([
            db_1.prisma.donation.aggregate({
                where: { verificationStatus: client_1.VerificationStatus.VERIFIED, type: "MONEY" },
                _sum: { amount: true },
            }),
            db_1.prisma.campaign.findMany({ orderBy: { createdAt: "desc" } }),
            db_1.prisma.campaign.aggregate({
                _sum: { distributedAmount: true },
            }),
            db_1.prisma.inventoryItem.aggregate({
                _sum: { quantity: true },
            }),
            db_1.prisma.donation.count({
                where: { verificationStatus: client_1.VerificationStatus.PENDING },
            }),
            db_1.prisma.donation.groupBy({
                by: ["verificationStatus"],
                _count: { _all: true },
            }),
            db_1.prisma.donation.findMany({
                orderBy: { createdAt: "desc" },
                take: 5,
                include: {
                    campaign: {
                        select: {
                            title: true,
                        },
                    },
                    donor: {
                        select: {
                            name: true,
                        },
                    },
                },
            }),
        ]);
        const distributedAgg = await db_1.prisma.aidShipment.aggregate({
            where: { status: "DELIVERED" },
            _sum: { quantity: true },
        });
        const statusCountMap = new Map(donationStatusAgg.map((entry) => [entry.verificationStatus, entry._count._all]));
        const verifiedCount = statusCountMap.get(client_1.VerificationStatus.VERIFIED) || 0;
        const pendingCount = statusCountMap.get(client_1.VerificationStatus.PENDING) || 0;
        const rejectedCount = statusCountMap.get(client_1.VerificationStatus.REJECTED) || 0;
        const totalStatusCount = verifiedCount + pendingCount + rejectedCount;
        const toPercent = (value) => {
            if (totalStatusCount === 0) {
                return 0;
            }
            return Math.round((value / totalStatusCount) * 100);
        };
        return res.json({
            totalDonationVerified: donationAgg._sum.amount || 0,
            totalDistributedAmount: campaignDistributedAgg._sum.distributedAmount || 0,
            totalDistributedItems: distributedAgg._sum.quantity || 0,
            totalInventoryItems: inventoryAgg._sum.quantity || 0,
            pendingVerifications,
            donationStatusCounts: {
                verified: verifiedCount,
                pending: pendingCount,
                rejected: rejectedCount,
                total: totalStatusCount,
            },
            donationStatusPercentages: {
                verified: toPercent(verifiedCount),
                pending: toPercent(pendingCount),
                rejected: toPercent(rejectedCount),
            },
            latestDonations: latestDonations.map((donation) => ({
                id: donation.id,
                donorName: donation.donor.name,
                campaignTitle: donation.campaign.title,
                verificationStatus: donation.verificationStatus,
                amount: donation.amount || 0,
                itemName: donation.itemName,
                quantity: donation.quantity,
                createdAt: donation.createdAt,
            })),
            campaigns: campaigns.map((campaign) => ({
                id: campaign.id,
                title: campaign.title,
                collectedAmount: campaign.collectedAmount,
                distributedAmount: campaign.distributedAmount,
                status: campaign.status,
            })),
        });
    }
    catch (error) {
        return next(error);
    }
});
