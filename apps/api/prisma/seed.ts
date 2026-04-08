import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import {
  CampaignStatus,
  DonationType,
  PrismaClient,
  Role,
  ShipmentStatus,
  VerificationStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for seeding");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  const passwordHash = await bcrypt.hash("Password123!", 10);

  await prisma.trackingEvent.deleteMany();
  await prisma.aidShipment.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: "Admin Donasi Track",
      email: "admin@donasitrack.local",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const donor = await prisma.user.create({
    data: {
      name: "Donatur Demo",
      email: "donor@donasitrack.local",
      passwordHash,
      role: Role.DONOR,
    },
  });

  const volunteer = await prisma.user.create({
    data: {
      name: "Relawan Demo",
      email: "relawan@donasitrack.local",
      passwordHash,
      role: Role.VOLUNTEER,
    },
  });

  const campaignA = await prisma.campaign.create({
    data: {
      title: "Banjir Bandang Cianjur",
      description: "Pengadaan makanan darurat, selimut, dan logistik kesehatan.",
      disasterType: "BANJIR",
      location: "Cianjur, Jawa Barat",
      targetAmount: 250000000,
      collectedAmount: 90000000,
      distributedAmount: 45000000,
      status: CampaignStatus.OPEN,
      createdById: admin.id,
    },
  });

  const campaignB = await prisma.campaign.create({
    data: {
      title: "Gempa Sumbar",
      description: "Bantuan tenda, perlengkapan bayi, dan paket kebersihan.",
      disasterType: "GEMPA",
      location: "Padang Pariaman, Sumatera Barat",
      targetAmount: 180000000,
      collectedAmount: 120000000,
      distributedAmount: 80000000,
      status: CampaignStatus.OPEN,
      createdById: admin.id,
    },
  });

  const donationMoney = await prisma.donation.create({
    data: {
      donorId: donor.id,
      campaignId: campaignA.id,
      type: DonationType.MONEY,
      amount: 500000,
      transferProofUrl: "https://example.com/proof/transfer-001.jpg",
      verificationStatus: VerificationStatus.VERIFIED,
      verifiedById: admin.id,
      verificationNote: "Bukti transfer valid",
    },
  });

  const donationGoods = await prisma.donation.create({
    data: {
      donorId: donor.id,
      campaignId: campaignB.id,
      type: DonationType.GOODS,
      itemName: "Selimut Tebal",
      quantity: 120,
      transferProofUrl: "https://example.com/proof/goods-001.jpg",
      verificationStatus: VerificationStatus.VERIFIED,
      verifiedById: admin.id,
      verificationNote: "Barang diterima gudang",
    },
  });

  const inventoryA = await prisma.inventoryItem.create({
    data: {
      name: "Paket Makanan Siap Saji",
      quantity: 300,
      unit: "pak",
      warehouse: "Gudang Pusat Jakarta",
    },
  });

  const inventoryB = await prisma.inventoryItem.create({
    data: {
      name: donationGoods.itemName || "Selimut",
      quantity: donationGoods.quantity || 100,
      unit: "pcs",
      warehouse: "Gudang Pusat Jakarta",
      sourceDonationId: donationGoods.id,
    },
  });

  const shipmentA = await prisma.aidShipment.create({
    data: {
      trackingCode: "DNT-DEMO-0001",
      campaignId: campaignA.id,
      itemId: inventoryA.id,
      quantity: 120,
      fromWarehouse: "Gudang Pusat Jakarta",
      destinationLocation: "Posko Utama Cianjur",
      assignedVolunteerId: volunteer.id,
      status: ShipmentStatus.IN_TRANSIT,
      createdById: admin.id,
    },
  });

  const shipmentB = await prisma.aidShipment.create({
    data: {
      trackingCode: "DNT-DEMO-0002",
      campaignId: campaignB.id,
      itemId: inventoryB.id,
      quantity: 60,
      fromWarehouse: "Gudang Pusat Jakarta",
      destinationLocation: "Posko Padang Pariaman",
      assignedVolunteerId: volunteer.id,
      status: ShipmentStatus.DELIVERED,
      createdById: admin.id,
    },
  });

  await prisma.trackingEvent.createMany({
    data: [
      {
        shipmentId: shipmentA.id,
        status: ShipmentStatus.CREATED,
        note: "Pengiriman dibuat admin",
        createdById: admin.id,
      },
      {
        shipmentId: shipmentA.id,
        status: ShipmentStatus.PICKED_UP,
        note: "Relawan mengambil logistik dari gudang",
        createdById: volunteer.id,
        latitude: -6.21462,
        longitude: 106.84513,
      },
      {
        shipmentId: shipmentA.id,
        status: ShipmentStatus.IN_TRANSIT,
        note: "Dalam perjalanan menuju posko Cianjur",
        createdById: volunteer.id,
        latitude: -6.816,
        longitude: 107.142,
      },
      {
        shipmentId: shipmentB.id,
        status: ShipmentStatus.CREATED,
        note: "Pengiriman dibuat admin",
        createdById: admin.id,
      },
      {
        shipmentId: shipmentB.id,
        status: ShipmentStatus.DELIVERED,
        note: "Bantuan diterima koordinator posko",
        createdById: volunteer.id,
        latitude: -0.604,
        longitude: 100.179,
        photoUrl: "https://example.com/proof/serah-terima-001.jpg",
      },
    ],
  });

  await prisma.notificationLog.createMany({
    data: [
      {
        userId: donor.id,
        channel: "FCM",
        title: "Donasi Diverifikasi",
        body: "Donasi uang Anda untuk Cianjur telah diverifikasi.",
        status: "stored",
      },
      {
        userId: volunteer.id,
        channel: "FCM",
        title: "Tugas Logistik Baru",
        body: "Anda mendapat pengiriman dengan kode DNT-DEMO-0001.",
        status: "stored",
      },
    ],
  });

  console.log("Seed selesai.");
  console.log("Admin    : admin@donasitrack.local / Password123!");
  console.log("Donatur  : donor@donasitrack.local / Password123!");
  console.log("Relawan  : relawan@donasitrack.local / Password123!");
  console.log("Tracking : DNT-DEMO-0001, DNT-DEMO-0002");
  console.log("Sample donation id (money):", donationMoney.id);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
