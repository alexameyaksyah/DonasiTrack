import { AdminNav } from "../../../components/AdminNav";
import { LogisticsPanel } from "../../../components/LogisticsPanel";
import { getJson } from "../../../lib/api";

type Inventory = {
  id: string;
  name: string;
  quantity: number;
  warehouse: string;
};

type Campaign = {
  id: string;
  title: string;
};

export default async function AdminLogisticsPage() {
  const [inventory, campaigns] = await Promise.all([
    getJson<Inventory[]>("/inventory", {
      headers: { Authorization: `Bearer ${process.env.ADMIN_DASHBOARD_TOKEN || ""}` },
    }).catch(() => []),
    getJson<Campaign[]>("/campaigns"),
  ]);

  return (
    <main className="container section fade-up">
      <div className="header-stack">
        <p className="badge">Logistics Flow</p>
        <h1>Manajemen Logistik</h1>
      </div>
      <AdminNav />
      <section className="grid">
        <LogisticsPanel />
        <div className="card">
          <h3>Referensi Data</h3>
          <p className="status-line">Gunakan ID berikut saat membuat alokasi logistik.</p>
          <div style={{ marginTop: 10 }}>
            <strong>Kampanye</strong>
            <ul className="timeline">
              {campaigns.map((campaign) => (
                <li key={campaign.id}>
                  {campaign.title}
                  <div className="muted">{campaign.id}</div>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ marginTop: 10 }}>
            <strong>Inventaris</strong>
            <ul className="timeline">
              {inventory.map((item) => (
                <li key={item.id}>
                  {item.name} ({item.quantity})
                  <div className="muted">{item.id}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
