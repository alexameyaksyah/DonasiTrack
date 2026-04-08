const requiredKeys = ["DATABASE_URL", "JWT_SECRET"] as const;

for (const key of requiredKeys) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  fcmServerKey: process.env.FCM_SERVER_KEY || "",
};
