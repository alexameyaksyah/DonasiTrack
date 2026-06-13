import "dotenv/config";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import { signToken } from "./utils/jwt";
import bcrypt from "bcryptjs";
import { env } from "./config/env";

const app = express();
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

type User = { id: string; name: string; email: string; passwordHash: string; role: string };
const users = new Map<string, User>();

function genId() {
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 10000).toString(36)}`;
}

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
    if (!email || !password) return res.status(400).json({ message: "Email dan password wajib diisi" });
    if (!email.includes("@")) return res.status(400).json({ message: "email: Invalid email" });
    if (password.length < 6) return res.status(400).json({ message: "password: Password minimal 6 karakter" });

    for (const u of users.values()) {
      if (u.email === email) return res.status(409).json({ message: "Email already registered" });
    }

    const id = genId();
    const passwordHash = await bcrypt.hash(password, 10);
    const user = { id, name: name || email.split("@")[0], email, passwordHash, role: "DONOR" };
    users.set(id, user);

    const token = signToken({ id: user.id, email: user.email, role: user.role as any });
    return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) return res.status(400).json({ message: "Email dan password wajib diisi" });

    const found = Array.from(users.values()).find((u) => u.email === email);
    if (!found) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, found.passwordHash);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken({ id: found.id, email: found.email, role: found.role as any });
    return res.json({ token, user: { id: found.id, name: found.name, email: found.email, role: found.role } });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(env.port, () => {
  console.log(`Mock API running on http://localhost:${env.port}`);
});
