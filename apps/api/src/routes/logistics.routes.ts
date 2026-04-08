import { Role, ShipmentStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";
import { sendNotification } from "../services/notification.service";

const createShipmentSchema = z.object({
  campaignId: z.string().cuid(),
  itemId: z.string().cuid(),
  quantity: z.number().int().positive(),
  fromWarehouse: z.string().min(2),
  destinationLocation: z.string().min(2),
  assignedVolunteerId: z.string().cuid().optional(),
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(ShipmentStatus),
  note: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  photoUrl: z.string().url().optional(),
});

function createTrackingCode() {
  const stamp = Date.now().toString().slice(-6);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DNT-${stamp}-${rand}`;
}

export const logisticsRouter = Router();

logisticsRouter.use(requireAuth);

logisticsRouter.post("/", requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const body = createShipmentSchema.parse(req.body);

    const shipment = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id: body.itemId } });
      if (!item || item.quantity < body.quantity) {
        throw new Error("Stok barang tidak mencukupi");
      }

      await tx.inventoryItem.update({
        where: { id: body.itemId },
        data: { quantity: { decrement: body.quantity } },
      });

      const created = await tx.aidShipment.create({
        data: {
          trackingCode: createTrackingCode(),
          campaignId: body.campaignId,
          itemId: body.itemId,
          quantity: body.quantity,
          fromWarehouse: body.fromWarehouse,
          destinationLocation: body.destinationLocation,
          assignedVolunteerId: body.assignedVolunteerId,
          createdById: req.user!.id,
        },
      });

      await tx.trackingEvent.create({
        data: {
          shipmentId: created.id,
          status: ShipmentStatus.CREATED,
          note: "Pengiriman dibuat oleh admin",
          createdById: req.user!.id,
        },
      });

      return created;
    });

    if (shipment.assignedVolunteerId) {
      const volunteer = await prisma.user.findUnique({ where: { id: shipment.assignedVolunteerId } });
      await sendNotification({
        userId: volunteer?.id,
        token: volunteer?.fcmToken || undefined,
        title: "Tugas Logistik Baru",
        body: `Anda mendapat pengiriman baru dengan kode ${shipment.trackingCode}`,
        payload: { shipmentId: shipment.id },
      });
    }

    return res.status(201).json(shipment);
  } catch (error) {
    return next(error);
  }
});

logisticsRouter.patch("/:id/status", async (req, res, next) => {
  try {
    const body = updateStatusSchema.parse(req.body);
    const shipment = await prisma.aidShipment.findUnique({ where: { id: req.params.id } });

    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    if (
      req.user!.role === Role.VOLUNTEER &&
      shipment.assignedVolunteerId &&
      shipment.assignedVolunteerId !== req.user!.id
    ) {
      return res.status(403).json({ message: "Bukan tugas relawan ini" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.aidShipment.update({
        where: { id: shipment.id },
        data: { status: body.status },
      });

      await tx.trackingEvent.create({
        data: {
          shipmentId: shipment.id,
          status: body.status,
          note: body.note,
          latitude: body.latitude,
          longitude: body.longitude,
          photoUrl: body.photoUrl,
          createdById: req.user!.id,
        },
      });
    });

    return res.json({ message: "Status updated" });
  } catch (error) {
    return next(error);
  }
});

logisticsRouter.get("/mine", requireRole(Role.VOLUNTEER), async (req, res, next) => {
  try {
    const shipments = await prisma.aidShipment.findMany({
      where: { assignedVolunteerId: req.user!.id },
      include: { campaign: true, item: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(shipments);
  } catch (error) {
    return next(error);
  }
});

logisticsRouter.get("/:id", async (req, res, next) => {
  try {
    const shipment = await prisma.aidShipment.findUnique({
      where: { id: req.params.id },
      include: {
        campaign: true,
        item: true,
        assignedVolunteer: true,
        trackingEvents: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    return res.json(shipment);
  } catch (error) {
    return next(error);
  }
});
