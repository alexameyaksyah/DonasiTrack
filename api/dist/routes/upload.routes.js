"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRouter = void 0;
const node_path_1 = __importDefault(require("node:path"));
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, node_path_1.default.join(process.cwd(), "uploads"));
    },
    filename: (_req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
        cb(null, `${Date.now()}-${safeName}`);
    },
});
const upload = (0, multer_1.default)({ storage });
exports.uploadRouter = (0, express_1.Router)();
exports.uploadRouter.post("/proof", auth_1.requireAuth, upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }
    const host = `${req.protocol}://${req.get("host")}`;
    const fileUrl = `${host}/uploads/${req.file.filename}`;
    return res.status(201).json({
        message: "Upload success",
        url: fileUrl,
    });
});
