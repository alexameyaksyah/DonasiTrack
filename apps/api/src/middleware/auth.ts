import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { verifyToken } from "../utils/jwt";
import { prisma } from "../db";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const token = header.split(" ")[1];
    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
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

    const accountState = await prisma.notificationLog.findFirst({
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
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
}
