import { VolunteerFieldApp } from "../../components/VolunteerFieldApp";

export default function VolunteerPage() {
  return (
    <main className="container section">
      <h1 style={{ fontFamily: "var(--font-heading)", marginBottom: 10 }}>Interface Relawan</h1>
      <p className="muted" style={{ marginBottom: 10 }}>
        Scan QR, update status bantuan dari lapangan, ambil geolocation, dan sinkronkan data offline.
      </p>
      <VolunteerFieldApp />
    </main>
  );
}
