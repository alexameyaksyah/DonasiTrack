"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const jwt_1 = require("../utils/jwt");
const db_1 = require("../db");
async function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const token = header.split(" ")[1];
        const payload = (0, jwt_1.verifyToken)(token);
        const user = await db_1.prisma.user.findUnique({
            where: { id: payload.id },
            select: {
                id: true,
                email: true,
                role: true,
            },
        });
        if (!user) {
            return res.status(401).json({ message: "Session expired, silakan login ulang" });
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
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
        };
        return next();
    }
    catch {
        return res.status(401).json({ message: "Invalid token" });
    }
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        return next();
    };
}
