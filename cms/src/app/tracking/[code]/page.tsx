import { getJson } from "../../../lib/api";
import { dateTime } from "../../../lib/format";

type TrackingData = {
  trackingCode: string;
  status: string;
  campaign: { title: string };
  item: { name: string; quantity: number };
  trackingEvents: Array<{
    id: string;
    status: string;
    note?: string;
    latitude?: string;
    longitude?: string;
    photoUrl?: string;
    createdAt: string;
    createdBy: { name: string; role: string };
  }>;
};

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  let data: TrackingData | null = null;
  let error = "";

  try {
    data = await getJson<TrackingData>(`/tracking/${code}`);
  } catch (err) {
    error =
      err instanceof Error ? err.message : "Data tracking tidak ditemukan";
  }

  return (
    <main className="container section fade-up">
      <div className="header-stack">
        <p className="badge">Realtime Tracking</p>
        <h1>Tracking Bantuan</h1>
      </div>
      <div className="card">
        {error ? <p>{error}</p> : null}
        {data ? (
          <>
            <p className="badge">{data.status}</p>
            <h2 style={{ marginTop: 8 }}>{data.campaign.title}</h2>
            <p className="muted">Kode: {data.trackingCode}</p>
            <div
              style={{
                padding: "12px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                borderLeft: "4px solid #4ade80",
                margin: "12px 0",
              }}
            >

            <ul className="timeline" style={{ marginTop: 12 }}>
              {data.trackingEvents.map((event) => (
                <li key={event.id}>
                  <strong>{event.status}</strong>
                  <p className="muted">{event.note || "Tanpa catatan"}</p>
                  <p className="muted">{dateTime(event.createdAt)} - {event.createdBy.name} ({event.createdBy.role})</p>
                  {event.latitude && event.longitude ? (
                    <p className="muted">Koordinat: {event.latitude}, {event.longitude}</p>
                  ) : null}
                  {event.photoUrl ? (
                    <a className="muted" href={event.photoUrl} target="_blank" rel="noreferrer">
                      Lihat foto bukti
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </main>
  );
}
