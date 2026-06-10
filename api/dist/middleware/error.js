"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
function errorHandler(err, _req, res, _next) {
    if (err instanceof zod_1.ZodError) {
        const first = err.issues[0];
        const field = first?.path?.join(".") || "payload";
        const message = first?.message || "Validasi data gagal";
        return res.status(400).json({
            message: `${field}: ${message}`,
            errors: err.issues,
        });
    }
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2025") {
            return res.status(404).json({ message: "Data tidak ditemukan" });
        }
        if (err.code === "P2002") {
            return res.status(409).json({ message: "Data duplikat (melanggar unique constraint)" });
        }
        if (err.code === "P2003") {
            return res.status(400).json({ message: "Relasi data tidak valid" });
        }
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({ message });
}
