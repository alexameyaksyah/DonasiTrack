"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const db_1 = require("../db");
const jwt_1 = require("../utils/jwt");
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    fcmToken: zod_1.z.string().optional(),
});
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post("/register", async (req, res, next) => {
    try {
        const body = registerSchema.parse(req.body);
        const exists = await db_1.prisma.user.findUnique({ where: { email: body.email } });
        if (exists) {
            return res.status(409).json({ message: "Email already registered" });
        }
        const user = await db_1.prisma.user.create({
            data: {
                name: body.name,
                email: body.email,
                passwordHash: await bcryptjs_1.default.hash(body.password, 10),
                role: "DONOR",
            },
        });
        const token = (0, jwt_1.signToken)({ id: user.id, email: user.email, role: user.role });
        return res.status(201).json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        });
    }
    catch (error) {
        return next(error);
    }
});
exports.authRouter.post("/login", async (req, res, next) => {
    try {
        const body = loginSchema.parse(req.body);
        const user = await db_1.prisma.user.findUnique({ where: { email: body.email } });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const accountState = await db_1.prisma.notificationLog.findFirst({
            where: {
                userId: user.id,
                channel: "ACCOUNT",
            },
            orderBy: { createdAt: "desc" },
            select: { status: true, body: true },
        });
        if (accountState?.status === "BLOCKED") {
            return res.status(403).json({
                message: accountState.body || "Akun Anda sedang diblokir oleh admin",
            });
        }
        const valid = await bcryptjs_1.default.compare(body.password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        if (body.fcmToken) {
            await db_1.prisma.user.update({
                where: { id: user.id },
                data: { fcmToken: body.fcmToken },
            });
        }
        const token = (0, jwt_1.signToken)({ id: user.id, email: user.email, role: user.role });
        return res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        });
    }
    catch (error) {
        return next(error);
    }
});
