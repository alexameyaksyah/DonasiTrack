import { DonationType, Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
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
      },
    });

    return res.status(201).json(donation);
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
