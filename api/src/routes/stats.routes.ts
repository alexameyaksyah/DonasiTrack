import { Role, VerificationStatus } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";

export const statsRouter = Router();

statsRouter.get("/dashboard", requireAuth, requireRole(Role.ADMIN), async (_req, res, next) => {
  try {
    const [
      donationAgg,
      campaigns,
      campaignDistributedAgg,
      inventoryAgg,
      pendingVerifications,
      donationStatusAgg,
      latestDonations,
    ] = await Promise.all([
      prisma.donation.aggregate({
        where: { verificationStatus: VerificationStatus.VERIFIED, type: "MONEY" },
        _sum: { amount: true },
      }),
      prisma.campaign.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.campaign.aggregate({
        _sum: { distributedAmount: true },
      }),
      prisma.inventoryItem.aggregate({
        _sum: { quantity: true },
      }),
      prisma.donation.count({
        where: { verificationStatus: VerificationStatus.PENDING },
      }),
      prisma.donation.groupBy({
        by: ["verificationStatus"],
        _count: { _all: true },
      }),
      prisma.donation.findMany({
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

    const distributedAgg = await prisma.aidShipment.aggregate({
      where: { status: "DELIVERED" },
      _sum: { quantity: true },
    });

    const statusCountMap = new Map(
      donationStatusAgg.map((entry) => [entry.verificationStatus, entry._count._all]),
    );
    const verifiedCount = statusCountMap.get(VerificationStatus.VERIFIED) || 0;
    const pendingCount = statusCountMap.get(VerificationStatus.PENDING) || 0;
    const rejectedCount = statusCountMap.get(VerificationStatus.REJECTED) || 0;
    const totalStatusCount = verifiedCount + pendingCount + rejectedCount;
    const toPercent = (value: number) => {
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
  } catch (error) {
    return next(error);
  }
});
