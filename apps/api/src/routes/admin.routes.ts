import { DonationType, Role, VerificationStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";
import { sendNotification } from "../services/notification.service";

const verificationSchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED"]),
  note: z.string().min(3).optional(),
});

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(Role.ADMIN));

adminRouter.get("/verifications/pending", async (_req, res, next) => {
  try {
    const pending = await prisma.donation.findMany({
      where: { verificationStatus: VerificationStatus.PENDING },
      include: { donor: true, campaign: true },
      orderBy: { createdAt: "asc" },
    });

    return res.json(pending);
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/verifications/:id", async (req, res, next) => {
  try {
    const body = verificationSchema.parse(req.body);
    const donation = await prisma.donation.findUnique({
      where: { id: req.params.id },
      include: { donor: true },
    });

    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.donation.update({
        where: { id: donation.id },
        data: {
          verificationStatus: body.status,
          verificationNote: body.note,
          verifiedById: req.user!.id,
        },
      });

      if (body.status === "VERIFIED" && donation.type === DonationType.MONEY && donation.amount) {
        await tx.campaign.update({
          where: { id: donation.campaignId },
          data: {
            collectedAmount: {
              increment: donation.amount,
            },
          },
        });
      }

      if (body.status === "VERIFIED" && donation.type === DonationType.GOODS) {
        await tx.inventoryItem.create({
          data: {
            name: donation.itemName || "Item Donasi",
            quantity: donation.quantity || 1,
            sourceDonationId: donation.id,
          },
        });
      }
    });

    await sendNotification({
      userId: donation.donorId,
      token: donation.donor.fcmToken || undefined,
      title: "Status Donasi Diperbarui",
      body:
        body.status === "VERIFIED"
          ? "Donasi Anda berhasil diverifikasi admin."
          : "Donasi Anda ditolak. Silakan cek catatan admin.",
      payload: {
        donationId: donation.id,
        status: body.status,
      },
    });

    return res.json({ message: "Verification updated" });
  } catch (error) {
    return next(error);
  }
});
