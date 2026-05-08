import { Router } from "express";
import { prisma } from "../db";

export const trackingRouter = Router();

trackingRouter.get("/:trackingCode", async (req, res, next) => {
  try {
    const shipment = await prisma.aidShipment.findUnique({
      where: { trackingCode: req.params.trackingCode },
      include: {
        campaign: true,
        item: true,
        trackingEvents: {
          include: { createdBy: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!shipment) {
      return res.status(404).json({ message: "Tracking code not found" });
    }

    return res.json(shipment);
  } catch (error) {
    return next(error);
  }
});
