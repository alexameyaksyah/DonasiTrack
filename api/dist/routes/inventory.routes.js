"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryRouter = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const itemSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    quantity: zod_1.z.number().int().positive(),
    unit: zod_1.z.string().default("pcs"),
    warehouse: zod_1.z.string().default("Gudang Pusat"),
});
exports.inventoryRouter = (0, express_1.Router)();
exports.inventoryRouter.use(auth_1.requireAuth);
exports.inventoryRouter.get("/", async (_req, res, next) => {
    try {
        const items = await db_1.prisma.inventoryItem.findMany({
            orderBy: { updatedAt: "desc" },
        });
        return res.json(items);
    }
    catch (error) {
        return next(error);
    }
});
exports.inventoryRouter.post("/", (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res, next) => {
    try {
        const body = itemSchema.parse(req.body);
        const item = await db_1.prisma.inventoryItem.create({ data: body });
        return res.status(201).json(item);
    }
    catch (error) {
        return next(error);
    }
});
exports.inventoryRouter.patch("/:id/quantity", (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const body = zod_1.z.object({ quantity: zod_1.z.number().int().nonnegative() }).parse(req.body);
        const item = await db_1.prisma.inventoryItem.update({
            where: { id },
            data: { quantity: body.quantity },
        });
        return res.json(item);
    }
    catch (error) {
        return next(error);
    }
});
