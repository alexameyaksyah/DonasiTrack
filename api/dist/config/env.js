"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const requiredKeys = ["DATABASE_URL", "JWT_SECRET"];
for (const key of requiredKeys) {
    if (!process.env[key]) {
        throw new Error(`Missing required env var: ${key}`);
    }
}
exports.env = {
    port: Number(process.env.PORT || 4000),
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    fcmServerKey: process.env.FCM_SERVER_KEY || "",
    midtransServerKey: process.env.MIDTRANS_SERVER_KEY || "",
    midtransClientKey: process.env.MIDTRANS_CLIENT_KEY || "",
    midtransIsProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    midtransChargeUrl: process.env.MIDTRANS_CHARGE_URL || "https://api.sandbox.midtrans.com/v2/charge",
    midtransStatusUrl: process.env.MIDTRANS_STATUS_URL || "https://api.sandbox.midtrans.com/v2",
};
