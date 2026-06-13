import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = "admin@donasitrack.id";
const ADMIN_PASSWORD = "donasi123";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for seeding");
  }

  const prisma = new PrismaClient();

  await prisma.trackingEvent.deleteMany();
  await prisma.aidShipment.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await prisma.user.create({
    data: {
      name: "Admin DonasiTrack",
      email: ADMIN_EMAIL,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Database direset. Data donasi sebelumnya dihapus.");
  console.log(`Admin login: ${ADMIN_EMAIL}`);
  console.log(`Admin password: ${ADMIN_PASSWORD}`);
  console.log("Belum ada campaign/donation. Buat campaign baru lalu lakukan donasi dari akun user.");

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
