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
      schemas: {
        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", minLength: 2 },
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
            fcmToken: { type: "string" },
          },
        },
        CampaignCreateRequest: {
          type: "object",
          required: ["title", "description", "disasterType", "location", "targetAmount"],
          properties: {
            title: { type: "string", minLength: 3 },
            description: { type: "string", minLength: 10 },
            disasterType: { type: "string", minLength: 3 },
            location: { type: "string", minLength: 3 },
            targetAmount: { type: "integer", minimum: 1 },
            status: { type: "string", enum: ["PENDING", "ACTIVE", "INACTIVE"] },
            endDate: { type: "string", format: "date-time" },
          },
        },
        CampaignUpdateRequest: {
          allOf: [{ $ref: "#/components/schemas/CampaignCreateRequest" }],
        },
        DonationCreateRequest: {
          type: "object",
          required: ["campaignId", "type"],
          properties: {
            campaignId: { type: "string", format: "cuid" },
            type: { type: "string", enum: ["MONEY", "GOODS"] },
            amount: { type: "integer", minimum: 1 },
            itemName: { type: "string", minLength: 2 },
            quantity: { type: "integer", minimum: 1 },
            transferProofUrl: { type: "string", format: "uri" },
          },
        },
        VerificationUpdateRequest: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["VERIFIED", "REJECTED"] },
            note: { type: "string", minLength: 3 },
          },
        },
        InventoryCreateRequest: {
          type: "object",
          required: ["name", "quantity"],
          properties: {
            name: { type: "string", minLength: 2 },
            quantity: { type: "integer", minimum: 1 },
            unit: { type: "string", default: "pcs" },
            warehouse: { type: "string", default: "Gudang Pusat" },
          },
        },
        InventoryUpdateQuantityRequest: {
          type: "object",
          required: ["quantity"],
          properties: {
            quantity: { type: "integer", minimum: 0 },
          },
        },
        LogisticsCreateShipmentRequest: {
          type: "object",
          required: ["campaignId", "itemId", "quantity", "fromWarehouse", "destinationLocation"],
          properties: {
            campaignId: { type: "string", format: "cuid" },
            itemId: { type: "string", format: "cuid" },
            quantity: { type: "integer", minimum: 1 },
            fromWarehouse: { type: "string", minLength: 2 },
            destinationLocation: { type: "string", minLength: 2 },
            assignedAdminId: { type: "string", format: "cuid" },
          },
        },
        LogisticsUpdateStatusRequest: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["CREATED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "FAILED"] },
            note: { type: "string" },
            latitude: { type: "number" },
            longitude: { type: "number" },
            photoUrl: { type: "string", format: "uri" },
          },
        },
        BlockUserRequest: {
          type: "object",
          required: ["blocked"],
          properties: {
            blocked: { type: "boolean" },
            reason: { type: "string", minLength: 3, maxLength: 200 },
          },
        },
      },
    },
    tags: [
      { name: "Auth" },
      { name: "Campaigns" },
      { name: "Donations" },
      { name: "Admin" },
      { name: "Inventory" },
      { name: "Logistics" },
      { name: "Uploads" },
      { name: "Tracking" },
      { name: "Stats" },
    ],
    paths: {
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Registrasi pengguna donatur",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterRequest" },
              },
            },
          },
          responses: {
            "201": { description: "User created" },
            "409": { description: "Email already registered" },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login dan mendapatkan JWT",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginRequest" },
              },
            },
          },
          responses: {
            "200": { description: "Login success" },
            "401": { description: "Invalid credentials" },
            "403": { description: "Account blocked" },
          },
        },
      },
      "/campaigns": {
        get: {
          tags: ["Campaigns"],
          summary: "List kampanye bencana",
          parameters: [
            {
              name: "status",
              in: "query",
              schema: { type: "string", enum: ["PENDING", "ACTIVE", "INACTIVE"] },
            },
          ],
          responses: {
            "200": { description: "List campaigns" },
          },
        },
        post: {
          tags: ["Campaigns"],
          summary: "Buat kampanye (admin)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CampaignCreateRequest" },
              },
            },
          },
          responses: {
            "201": { description: "Campaign created" },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
          },
        },
      },
      "/campaigns/{id}": {
        put: {
          tags: ["Campaigns"],
          summary: "Update kampanye (admin)",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CampaignUpdateRequest" },
              },
            },
          },
          responses: {
            "200": { description: "Campaign updated" },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
            "404": { description: "Campaign not found" },
          },
        },
        delete: {
          tags: ["Campaigns"],
          summary: "Hapus kampanye (admin)",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Campaign deleted" },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
            "404": { description: "Campaign not found" },
          },
        },
      },
      "/campaigns/{id}/close": {
        patch: {
          tags: ["Campaigns"],
          summary: "Tutup kampanye (admin)",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Campaign closed" },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
            "404": { description: "Campaign not found" },
          },
        },
      },
      "/campaigns/{id}/donations": {
        get: {
          tags: ["Campaigns"],
          summary: "List donasi per kampanye (admin)",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "List campaign donations" },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
            "404": { description: "Campaign not found" },
          },
        },
      },
      "/donations": {
        post: {
          tags: ["Donations"],
          summary: "Buat transaksi donasi uang/barang (donatur)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DonationCreateRequest" },
              },
            },
          },
          responses: {
            "201": { description: "Donation created" },
            "400": { description: "Validation error" },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
          },
        },
      },
      "/donations/me": {
        get: {
          tags: ["Donations"],
          summary: "List donasi saya",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "List my donations" },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/admin/operators": {
        get: {
          tags: ["Admin"],
          summary: "List admin operator",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "List operators" },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
          },
        },
      },
      "/admin/verifications": {
        get: {
          tags: ["Admin"],
          summary: "List donasi berdasarkan status verifikasi",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "status",
              in: "query",
              schema: { type: "string", description: "VerificationStatus enum" },
            },
          ],
          responses: {
            "200": { description: "List verifications" },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
          },
        },
      },
      "/admin/verifications/pending": {
        get: {
          tags: ["Admin"],
          summary: "Daftar donasi pending verifikasi (admin)",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "List pending verifications" },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
          },
        },
      },
      "/admin/verifications/{id}": {
        patch: {
          tags: ["Admin"],
          summary: "Validasi atau tolak bukti donasi (admin)",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
              schema: { type: "string", enum: ["PENDING", "VERIFIED", "REJECTED"] },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VerificationUpdateRequest" },
              },
            },
          },
          responses: {
            "200": { description: "Verification updated" },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
            "404": { description: "Donation not found" },
          },
        },
      },
      "/admin/users": {
        get: {
          tags: ["Admin"],
          summary: "List semua user",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "List users" },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
          },
        },
      },
      "/admin/users/{id}/block": {
        patch: {
          tags: ["Admin"],
          summary: "Blokir atau buka blokir user",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BlockUserRequest" },
              },
            },
          },
          responses: {
            "200": { description: "User block status updated" },
            "400": { description: "Invalid request" },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
            "404": { description: "User not found" },
          },
        },
      },
      "/admin/users/{id}": {
        delete: {
          tags: ["Admin"],
          summary: "Hapus user",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "User deleted" },
            "400": { description: "Invalid request" },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
            "404": { description: "User not found" },
            "409": { description: "User has relations" },
          },
        },
      },
      "/inventory": {
        get: {
          tags: ["Inventory"],
          summary: "List inventaris barang",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "List inventory items" },
            "401": { description: "Unauthorized" },
          },
        },
        post: {
          tags: ["Inventory"],
          summary: "Tambah inventaris barang (admin)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/InventoryCreateRequest" },
              },
            },
          },
          responses: {
            "201": { description: "Inventory created" },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
          },
        },
      },
      "/inventory/{id}/quantity": {
        patch: {
          tags: ["Inventory"],
          summary: "Update jumlah inventaris (admin)",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/InventoryUpdateQuantityRequest" },
              },
            },
          },
          responses: {
            "200": { description: "Inventory updated" },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
            "404": { description: "Item not found" },
          },
        },
      },
      "/logistics": {
        post: {
          tags: ["Logistics"],
          summary: "Alokasi barang dari gudang oleh admin operasional",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LogisticsCreateShipmentRequest" },
              },
            },
          },
          responses: {
            "201": { description: "Shipment created" },
            "400": { description: "Validation error" },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
          },
        },
      },
      "/logistics/{id}/status": {
        patch: {
          tags: ["Logistics"],
          summary: "Update status bantuan dan catat tracking event",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LogisticsUpdateStatusRequest" },
              },
            },
          },
          responses: {
            "200": { description: "Status updated" },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
            "404": { description: "Shipment not found" },
          },
        },
      },
      "/logistics/mine": {
        get: {
          tags: ["Logistics"],
          summary: "List pengiriman yang ditugaskan ke saya",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "List my shipments" },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
          },
        },
      },
      "/logistics/{id}": {
        get: {
          tags: ["Logistics"],
          summary: "Detail pengiriman",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Shipment detail" },
            "401": { description: "Unauthorized" },
            "404": { description: "Shipment not found" },
          },
        },
      },
      "/uploads/proof": {
        post: {
          tags: ["Uploads"],
          summary: "Upload foto bukti serah terima (multipart/form-data)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["file"],
                  properties: {
                    file: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Upload success" },
            "400": { description: "No file uploaded" },
            "401": { description: "Unauthorized" },
          },
        },
      },
      "/tracking/{trackingCode}": {
        get: {
          tags: ["Tracking"],
          summary: "Lihat timeline tracking bantuan berdasarkan kode",
          parameters: [
            {
              name: "trackingCode",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": { description: "Tracking detail" },
            "404": { description: "Tracking code not found" },
          },
        },
      },
      "/stats/dashboard": {
        get: {
          tags: ["Stats"],
          summary: "Ringkasan statistik dashboard admin",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Stats summary" },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
});
