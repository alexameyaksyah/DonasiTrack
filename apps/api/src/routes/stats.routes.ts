import { Role, VerificationStatus } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";

export const statsRouter = Router();

statsRouter.get("/dashboard", requireAuth, requireRole(Role.ADMIN), async (_req, res, next) => {
  try {
    const [donationAgg, campaigns, inventoryAgg, pendingVerifications] = await Promise.all([
      prisma.donation.aggregate({
        where: { verificationStatus: VerificationStatus.VERIFIED, type: "MONEY" },
        _sum: { amount: true },
      }),
      prisma.campaign.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.inventoryItem.aggregate({
        _sum: { quantity: true },
      }),
      prisma.donation.count({
        where: { verificationStatus: VerificationStatus.PENDING },
      }),
    ]);

    const distributedAgg = await prisma.aidShipment.aggregate({
      where: { status: "DELIVERED" },
      _sum: { quantity: true },
    });

    return res.json({
      totalDonationVerified: donationAgg._sum.amount || 0,
      totalDistributedItems: distributedAgg._sum.quantity || 0,
      totalInventoryItems: inventoryAgg._sum.quantity || 0,
      pendingVerifications,
      campaigns: campaigns.map((campaign) => ({
        id: campaign.id,
        title: campaign.title,
        collectedAmount: campaign.collectedAmount,
        distributedAmount: campaign.distributedAmount,
        status: campaign.status,
      })),
    });
  } catch (error) {
    return next(error);
  }
});
