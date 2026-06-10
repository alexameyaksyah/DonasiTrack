"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logisticsRouter = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const notification_service_1 = require("../services/notification.service");
const createShipmentSchema = zod_1.z.object({
    campaignId: zod_1.z.string().cuid(),
    itemId: zod_1.z.string().cuid(),
    quantity: zod_1.z.number().int().positive(),
    fromWarehouse: zod_1.z.string().min(2),
    destinationLocation: zod_1.z.string().min(2),
    assignedAdminId: zod_1.z.string().cuid().optional(),
});
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.ShipmentStatus),
    note: zod_1.z.string().optional(),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
    photoUrl: zod_1.z.string().url().optional(),
});
function createTrackingCode() {
    const stamp = Date.now().toString().slice(-6);
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `DNT-${stamp}-${rand}`;
}
exports.logisticsRouter = (0, express_1.Router)();
exports.logisticsRouter.use(auth_1.requireAuth);
exports.logisticsRouter.post("/", (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res, next) => {
    try {
        const body = createShipmentSchema.parse(req.body);
        const shipment = await db_1.prisma.$transaction(async (tx) => {
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
                    assignedOperatorId: body.assignedAdminId,
                    createdById: req.user.id,
                },
            });
            await tx.trackingEvent.create({
                data: {
                    shipmentId: created.id,
                    status: client_1.ShipmentStatus.CREATED,
                    note: "Pengiriman dibuat oleh admin",
                    createdById: req.user.id,
                },
            });
            return created;
        });
        if (shipment.assignedOperatorId) {
            const assignedAdmin = await db_1.prisma.user.findUnique({ where: { id: shipment.assignedOperatorId } });
            await (0, notification_service_1.sendNotification)({
                userId: assignedAdmin?.id,
                token: assignedAdmin?.fcmToken || undefined,
                title: "Tugas Operasional Logistik",
                body: `Anda mendapat pengiriman operasional dengan kode ${shipment.trackingCode}`,
                payload: { shipmentId: shipment.id },
            });
        }
        return res.status(201).json(shipment);
    }
    catch (error) {
        return next(error);
    }
});
exports.logisticsRouter.patch("/:id/status", (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res, next) => {
    try {
        const shipmentId = String(req.params.id);
        const body = updateStatusSchema.parse(req.body);
        const shipment = await db_1.prisma.aidShipment.findUnique({ where: { id: shipmentId } });
        if (!shipment) {
            return res.status(404).json({ message: "Shipment not found" });
        }
        await db_1.prisma.$transaction(async (tx) => {
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
                    createdById: req.user.id,
                },
            });
        });
        return res.json({ message: "Status updated" });
    }
    catch (error) {
        return next(error);
    }
});
exports.logisticsRouter.get("/mine", (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res, next) => {
    try {
        const shipments = await db_1.prisma.aidShipment.findMany({
            where: { assignedOperatorId: req.user.id },
            include: { campaign: true, item: true },
            orderBy: { createdAt: "desc" },
        });
        return res.json(shipments);
    }
    catch (error) {
        return next(error);
    }
});
exports.logisticsRouter.get("/:id", async (req, res, next) => {
    try {
        const shipmentId = String(req.params.id);
        const shipment = await db_1.prisma.aidShipment.findUnique({
            where: { id: shipmentId },
            include: {
                campaign: true,
                item: true,
                assignedOperator: true,
                trackingEvents: { orderBy: { createdAt: "asc" } },
            },
        });
        if (!shipment) {
            return res.status(404).json({ message: "Shipment not found" });
        }
        return res.json(shipment);
    }
    catch (error) {
        return next(error);
    }
});
