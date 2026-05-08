import { Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";

const itemSchema = z.object({
  name: z.string().min(2),
  quantity: z.number().int().positive(),
  unit: z.string().default("pcs"),
  warehouse: z.string().default("Gudang Pusat"),
});

export const inventoryRouter = Router();

inventoryRouter.use(requireAuth);

inventoryRouter.get("/", async (_req, res, next) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return res.json(items);
  } catch (error) {
    return next(error);
  }
});

inventoryRouter.post("/", requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const body = itemSchema.parse(req.body);
    const item = await prisma.inventoryItem.create({ data: body });
    return res.status(201).json(item);
  } catch (error) {
    return next(error);
  }
});

inventoryRouter.patch("/:id/quantity", requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const body = z.object({ quantity: z.number().int().nonnegative() }).parse(req.body);
    const item = await prisma.inventoryItem.update({
      where: { id },
      data: { quantity: body.quantity },
    });

    return res.json(item);
  } catch (error) {
    return next(error);
  }
});
