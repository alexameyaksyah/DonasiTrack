import { AdminNav } from "../../../components/AdminNav";
import { CampaignForm } from "../../../components/CampaignForm";
import { getJson } from "../../../lib/api";
import { rupiah } from "../../../lib/format";

type Campaign = {
  id: string;
  title: string;
  disasterType: string;
  location: string;
  collectedAmount: number;
  targetAmount: number;
  status: "OPEN" | "CLOSED";
};

export default async function AdminCampaignsPage() {
  const campaigns = await getJson<Campaign[]>("/campaigns");

  return (
    <main className="container section fade-up">
      <div className="header-stack">
        <p className="badge">Campaign Studio</p>
        <h1>Manajemen Kampanye</h1>
      </div>
      <AdminNav />
      <section className="grid">
        <CampaignForm />
        <div className="card">
          <h3>Daftar Kampanye</h3>
          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            {campaigns.map((campaign) => (
              <div className="panel" key={campaign.id}>
                <strong>{campaign.title}</strong>
                <p className="muted">{campaign.disasterType} - {campaign.location}</p>
                <p className="muted">
                  {rupiah(campaign.collectedAmount)} / {rupiah(campaign.targetAmount)} - {campaign.status}
                </p>
                <p className="muted">ID: {campaign.id}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
