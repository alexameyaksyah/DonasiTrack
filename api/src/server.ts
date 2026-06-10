import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error";
import { adminRouter } from "./routes/admin.routes";
import { authRouter } from "./routes/auth.routes";
import { campaignRouter } from "./routes/campaign.routes";
import { donationRouter } from "./routes/donation.routes";
import { inventoryRouter } from "./routes/inventory.routes";
import { logisticsRouter } from "./routes/logistics.routes";
import { paymentRouter } from "./routes/payment.routes";
import { statsRouter } from "./routes/stats.routes";
import { trackingRouter } from "./routes/tracking.routes";
import { uploadRouter } from "./routes/upload.routes";
import { swaggerSpec } from "./swagger";

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "5mb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", authRouter);
app.use("/api/campaigns", campaignRouter);
app.use("/api/donations", donationRouter);
app.use("/api/admin", adminRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/logistics", logisticsRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/tracking", trackingRouter);
app.use("/api/stats", statsRouter);
app.use("/api/uploads", uploadRouter);

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`API running on http://localhost:${env.port}`);
  console.log(`Swagger docs on http://localhost:${env.port}/docs`);
});
