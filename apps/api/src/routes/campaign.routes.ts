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
      data: { status: CampaignStatus.CLOSED },
    });

    return res.json(campaign);
  } catch (error) {
    return next(error);
  }
});
