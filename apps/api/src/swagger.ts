import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Donasi Track API",
      version: "1.0.0",
      description: "API untuk autentikasi, kampanye, donasi, logistik, tracking, dan admin panel.",
    },
    servers: [
      {
        url: "http://localhost:4000/api",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    paths: {
      "/auth/register": {
        post: {
          summary: "Registrasi pengguna donatur",
        },
      },
      "/auth/login": {
        post: {
          summary: "Login dan mendapatkan JWT",
        },
      },
      "/campaigns": {
        get: { summary: "List kampanye bencana" },
        post: {
          summary: "Buat kampanye (admin)",
          security: [{ bearerAuth: [] }],
        },
      },
      "/campaigns/{id}/close": {
        patch: {
          summary: "Tutup kampanye (admin)",
          security: [{ bearerAuth: [] }],
        },
      },
      "/donations": {
        post: {
          summary: "Buat transaksi donasi uang/barang (donatur)",
          security: [{ bearerAuth: [] }],
        },
      },
      "/admin/verifications/pending": {
        get: {
          summary: "Daftar donasi pending verifikasi (admin)",
          security: [{ bearerAuth: [] }],
        },
      },
      "/admin/users": {
        get: {
          summary: "Daftar user untuk manajemen role (admin)",
          security: [{ bearerAuth: [] }],
        },
      },
      "/admin/users/{id}/role": {
        patch: {
          summary: "Ubah role user menjadi DONOR atau ADMIN (admin)",
          security: [{ bearerAuth: [] }],
        },
      },
      "/admin/verifications/{id}": {
        patch: {
          summary: "Validasi atau tolak bukti donasi (admin)",
          security: [{ bearerAuth: [] }],
        },
      },
      "/inventory": {
        get: {
          summary: "List inventaris barang",
          security: [{ bearerAuth: [] }],
        },
      },
      "/logistics": {
        post: {
          summary: "Alokasi barang dari gudang oleh admin operasional",
          security: [{ bearerAuth: [] }],
        },
      },
      "/logistics/{id}/status": {
        patch: {
          summary: "Update status bantuan dan catat tracking event",
          security: [{ bearerAuth: [] }],
        },
      },
      "/uploads/proof": {
        post: {
          summary: "Upload foto bukti serah terima (multipart/form-data)",
          security: [{ bearerAuth: [] }],
        },
      },
      "/tracking/{trackingCode}": {
        get: {
          summary: "Lihat timeline tracking bantuan berdasarkan kode",
        },
      },
      "/stats/dashboard": {
        get: {
          summary: "Ringkasan statistik dashboard admin",
          security: [{ bearerAuth: [] }],
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
});
