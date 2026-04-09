# Donasi Track (Monorepo)

Platform donasi bencana dengan tracking logistik end-to-end.

## Struktur Proyek

- `apps/api`: Backend REST API (Express + TypeScript + Prisma + PostgreSQL)
- `apps/web`: Frontend Next.js (Admin SSR + Donatur + Relawan)
- `apps/mobile`: Frontend Flutter (Donatur + Relawan + Tracking)
- `packages/shared`: Ruang untuk shared package ke depan

## Fitur yang Sudah Diimplementasikan

### Backend
- Desain database PostgreSQL untuk entitas User (Donatur/Admin/Relawan), Campaign, Donation, Inventory, AidShipment, TrackingEvent, NotificationLog.
- REST API untuk:
  - JWT auth (`/api/auth/register`, `/api/auth/login`)
  - Campaign management (`/api/campaigns`)
  - Donation flow + riwayat (`/api/donations`)
  - Admin verification (`/api/admin/verifications/*`)
  - Inventory (`/api/inventory`)
  - Logistics + tracking real-time (`/api/logistics`, `/api/tracking/:trackingCode`)
  - Dashboard stats (`/api/stats/dashboard`)
- Notification service terintegrasi ke FCM legacy endpoint (opsional via `FCM_SERVER_KEY`) + log notifikasi.
- Swagger docs di `/docs`.

### Frontend (Next.js)
- **Dashboard Admin (SSR)**: statistik + grafik donasi masuk vs tersalurkan.
- **Manajemen Kampanye**: daftar kampanye + form buat kampanye.
- **Sistem Verifikasi**: validasi donasi pending.
- **Manajemen Logistik**: alokasi barang dari gudang ke relawan.
- **Interface Donatur**: eksplorasi kampanye, form donasi, dan akses tracking timeline.
- **Interface Relawan**: scanner QR, update status lapangan, geolocation, dan offline queue sync.
- **Tracking Visual**: halaman timeline per kode tracking.

### Flutter App
- **Auth JWT**: login/registrasi role Donor, Volunteer, Admin.
- **Donatur**: eksplorasi kampanye, kirim donasi, queue offline untuk donasi gagal kirim.
- **Relawan**: scan QR, update status logistik, geolocation, kamera + upload bukti foto, queue offline tracking.
- **Tracking**: lihat timeline status bantuan per tracking code.

## Konfigurasi Environment

### API (`apps/api/.env`)
Copy dari `.env.example`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/donasi_track?schema=public"
JWT_SECRET="ganti_dengan_secret_sendiri"
JWT_EXPIRES_IN="7d"
PORT=4000
FCM_SERVER_KEY=""
```

### Web (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
ADMIN_DASHBOARD_TOKEN="isi_jwt_admin_untuk_ssr_dashboard"
```

## Menjalankan Proyek

1. Install dependency root

```bash
npm install
```

2. Generate Prisma client dan migrate database

```bash
npm --workspace @donasi-track/api run prisma:generate
npm --workspace @donasi-track/api run prisma:migrate
```

Alternatif cepat untuk setup schema + seed demo:

```bash
npm --workspace @donasi-track/api run db:setup
```

3. Jalankan backend

```bash
npm run dev:api
```

4. Jalankan frontend (terminal baru)

```bash
npm run dev:web
```

5. Jalankan Flutter (terminal baru)

```bash
npm run dev:mobile
```

Atau langsung dari folder Flutter:

```bash
cd apps/mobile
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api
```

Catatan API URL Flutter:
- Android Emulator: `http://10.0.2.2:4000/api`
- iOS Simulator/Web/Desktop: `http://localhost:4000/api`
- Device fisik: gunakan IP lokal laptop, contoh `http://192.168.1.10:4000/api`

## Build Check

```bash
npm run build:api
npm run build:web
npm run build:mobile
```

## Login Donatur dan Relawan (Web)

- Halaman `http://localhost:3000/donatur` hanya menerima akun dengan role `DONOR`.
- Halaman `http://localhost:3000/relawan` hanya menerima akun dengan role `VOLUNTEER`.
- Masing-masing halaman menyimpan sesi login terpisah di browser, jadi donatur dan relawan tidak saling menimpa token.

## Integrasi Prisma Studio Untuk Ubah Role User

1. Jalankan Prisma Studio dari root monorepo:

```bash
npm run studio
```

2. Buka model `User`.
3. Ubah kolom `role` user menjadi `DONOR` atau `VOLUNTEER`.
4. Simpan perubahan di Prisma Studio.
5. Login ulang di halaman web sesuai role terbaru.

## Endpoint Penting

- API Base: `http://localhost:4000/api`
- Swagger: `http://localhost:4000/docs`
- Frontend: `http://localhost:3000`
- Upload Proof API: `http://localhost:4000/api/uploads/proof`

## Akun Demo Seed

- Admin: `admin@donasitrack.local` / `Password123!`
- Donatur: `donor@donasitrack.local` / `Password123!`
- Relawan: `relawan@donasitrack.local` / `Password123!`
- Tracking code demo: `DNT-DEMO-0001`, `DNT-DEMO-0002`

## Catatan Implementasi Lapangan

- Offline caching: campaign cache dan queue tracking di localStorage.
- Geolocation: Web via browser API, Flutter via `geolocator`.
- Integrasi kamera:
  - Web: input URL foto bukti.
  - Flutter: kamera + upload multipart ke endpoint `/api/uploads/proof`.
- QR scanner:
  - Web: `html5-qrcode`.
  - Flutter: `mobile_scanner`.

