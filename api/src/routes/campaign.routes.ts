import { CampaignStatus, Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";

const campaignSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  disasterType: z.string().min(3),
  location: z.string().min(3),
  targetAmount: z.number().int().positive(),
  status: z.nativeEnum(CampaignStatus).optional(),
  endDate: z.string().datetime().optional(),
});

export const campaignRouter = Router();

campaignRouter.get("/", async (req, res, next) => {
  try {
    const status = req.query.status as CampaignStatus | undefined;
    const campaigns = await prisma.campaign.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return res.json(campaigns);
  } catch (error) {
    return next(error);
  }
});

campaignRouter.post("/", requireAuth, requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const body = campaignSchema.parse(req.body);
    const campaign = await prisma.campaign.create({
      data: {
        ...body,
        endDate: body.endDate ? new Date(body.endDate) : null,
        createdById: req.user!.id,
      },
    });

    return res.status(201).json(campaign);
  } catch (error) {
    return next(error);
  }
});

campaignRouter.put("/:id", requireAuth, requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const body = campaignSchema.partial().parse(req.body);
    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        ...body,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
      },
    });

    return res.json(campaign);
  } catch (error) {
    return next(error);
  }
});

campaignRouter.patch("/:id/close", requireAuth, requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const campaign = await prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.INACTIVE },
    });

    return res.json(campaign);
  } catch (error) {
    return next(error);
  }
});

campaignRouter.get("/:id/donations", requireAuth, requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const donations = await prisma.donation.findMany({
      where: { campaignId: id },
      include: {
        donor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    let totalMoney = 0;
    const goodsMap = new Map<string, number>();

    for (const donation of donations) {
      if (donation.type === "MONEY" && donation.amount) {
        totalMoney += donation.amount;
      }
      if (donation.type === "GOODS" && donation.itemName && donation.quantity) {
        goodsMap.set(
          donation.itemName,
          (goodsMap.get(donation.itemName) ?? 0) + donation.quantity,
        );
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
  } catch (error) {
    return next(error);
  }
});

campaignRouter.delete("/:id", requireAuth, requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const id = String(req.params.id);

    const campaign = await prisma.campaign.findUnique({
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

    await prisma.$transaction(async (tx) => {
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
  } catch (error) {
    return next(error);
  }
});
