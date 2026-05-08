import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage });

export const uploadRouter = Router();

uploadRouter.post("/proof", requireAuth, upload.single("file"), (req, res) => {
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
