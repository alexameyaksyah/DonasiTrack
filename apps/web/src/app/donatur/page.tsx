import { DonorExperience } from "../../components/DonorExperience";

export default function DonorPage() {
  return (
    <main className="container section">
      <h1 style={{ fontFamily: "var(--font-heading)", marginBottom: 10 }}>Interface Donatur</h1>
      <p className="muted" style={{ marginBottom: 10 }}>
        Eksplorasi kampanye, kirim donasi, dan pantau timeline bantuan secara visual.
      </p>
      <DonorExperience />
    </main>
  );
}
