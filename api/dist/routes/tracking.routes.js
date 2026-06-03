"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackingRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
exports.trackingRouter = (0, express_1.Router)();
exports.trackingRouter.get("/:trackingCode", async (req, res, next) => {
    try {
        const shipment = await db_1.prisma.aidShipment.findUnique({
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
    }
    catch (error) {
        return next(error);
    }
});
