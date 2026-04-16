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

const blockUserSchema = z.object({
  blocked: z.boolean(),
  reason: z.string().min(3).max(200).optional(),
});

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(Role.ADMIN));

adminRouter.get("/operators", async (_req, res, next) => {
  try {
    const operators = await prisma.user.findMany({
      where: { role: Role.ADMIN },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
    });

    return res.json(operators);
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/verifications", async (req, res, next) => {
  try {
    const status = req.query.status as VerificationStatus | undefined;
    const verifications = await prisma.donation.findMany({
      where: status ? { verificationStatus: status } : undefined,
      include: { donor: true, campaign: true },
      orderBy: { createdAt: "desc" },
    });

    return res.json(verifications);
  } catch (error) {
    return next(error);
  }
});

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

adminRouter.get("/users", async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
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
      ? await prisma.notificationLog.findMany({
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

    const latestAccountState = new Map<string, (typeof accountLogs)[number]>();
    for (const log of accountLogs) {
      if (!log.userId || latestAccountState.has(log.userId)) {
        continue;
      }
      latestAccountState.set(log.userId, log);
    }

    return res.json(
      users.map((user) => {
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
          canDelete:
            user.role !== Role.ADMIN &&
            user._count.campaigns === 0 &&
            user._count.donations === 0 &&
            user._count.verifications === 0 &&
            user._count.assignedOperationalShipments === 0 &&
            user._count.createdShipments === 0 &&
            user._count.trackingEvents === 0,
          isSelf: user.id === req.user!.id,
        };
      }),
    );
  } catch (error) {
    return next(error);
  }
});

adminRouter.patch("/users/:id/block", async (req, res, next) => {
  try {
    const body = blockUserSchema.parse(req.body);
    const userId = String(req.params.id);

    if (userId === req.user!.id) {
      return res.status(400).json({ message: "Tidak bisa memblokir akun sendiri" });
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true },
    });

    if (!target) {
      return res.status(404).json({ message: "Akun tidak ditemukan" });
    }

    if (target.role === Role.ADMIN) {
      return res.status(403).json({ message: "Akun admin tidak bisa diblokir" });
    }

    await prisma.notificationLog.create({
      data: {
        userId,
        channel: "ACCOUNT",
        title: body.blocked ? "Akun diblokir" : "Akun diaktifkan kembali",
        body: body.reason || (body.blocked ? "Diblokir oleh admin" : "Status blokir dicabut oleh admin"),
        status: body.blocked ? "BLOCKED" : "UNBLOCKED",
        payload: {
          actedBy: req.user!.id,
        },
      },
    });

    return res.json({
      message: body.blocked ? "Akun berhasil diblokir" : "Blokir akun berhasil dicabut",
    });
  } catch (error) {
    return next(error);
  }
});

adminRouter.delete("/users/:id", async (req, res, next) => {
  try {
    const userId = String(req.params.id);

    if (userId === req.user!.id) {
      return res.status(400).json({ message: "Tidak bisa menghapus akun sendiri" });
    }

    const user = await prisma.user.findUnique({
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

    if (user.role === Role.ADMIN) {
      return res.status(403).json({ message: "Akun admin tidak bisa dihapus" });
    }

    const hasRelations =
      user._count.campaigns > 0 ||
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

    await prisma.$transaction(async (tx) => {
      await tx.notificationLog.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    return res.json({ message: "Akun berhasil dihapus" });
  } catch (error) {
    return next(error);
  }
});
