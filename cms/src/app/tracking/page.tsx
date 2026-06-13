"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminConsoleSidebar } from "../../components/AdminConsoleSidebar";
import { API_URL, authHeaders } from "@/lib/api";


interface TrackingEvent {
  id: string;
  status: string;
  location: string;
  createdAt: string;
  createdBy: {
    name: string;
    role: string;
  };
}

interface ShipmentData {
  id: string;
  trackingCode: string;
  destinationLocation: string;
  quantity: number;
  createdAt: string;
  item?: {
    name: string;
  };
  campaign?: {
    title: string;
  };
  trackingEvents: TrackingEvent[];
}

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "DONOR" | "ADMIN";
};

const SESSION_TOKEN_KEY = "donasi-track-session-token";
const SESSION_USER_KEY = "donasi-track-session-user";

function readTrackingSession(): { token: string; user: SessionUser | null } {
  if (typeof window === "undefined") {
    return { token: "", user: null };
  }

  const token = localStorage.getItem(SESSION_TOKEN_KEY) || "";
  const userRaw = localStorage.getItem(SESSION_USER_KEY);

  if (!token || !userRaw) {
    return { token: "", user: null };
  }

  try {
    return { token, user: JSON.parse(userRaw) as SessionUser };
  } catch {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
    return { token: "", user: null };
  }
}

const EMPTY_SESSION = { token: "", user: null };

export default function TrackingPage() {
  const [session, setSession] = useState(EMPTY_SESSION);
  const [code, setCode] = useState<string>("");
  const [data, setData] = useState<ShipmentData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isReady, setIsReady] = useState(false);

  // STATE MANAGEMENT
  const [activeTab, setActiveTab] = useState<"proses" | "selesai">("proses");
  const [allShipments, setAllShipments] = useState<ShipmentData[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(false);

  // Read session & fetch list on mount
  useEffect(() => {
    Promise.resolve().then(() => {
      const sessionData = readTrackingSession();
      setSession(sessionData);
      setIsReady(true);

      fetchAllShipments();
    });
  }, []);

  const roleLabel = useMemo(() => {
    if (!isReady) return "Loading...";
    if (session.user?.role === "ADMIN") {
      return "Admin Mode";
    }
    if (session.user?.role === "DONOR") {
      return "Donor Mode";
    }
    return "Mode Tamu";
  }, [isReady, session.user?.role]);

  // Ambil semua data tracking dari server
  const fetchAllShipments = async () => {
    setLoadingList(true);
    try {
      const token = localStorage.getItem("donasi-track-session-token") || "";
      const res = await fetch(`${API_URL}/tracking`, {
        headers: authHeaders(token),
      });
      if (res.ok) {
        const result = await res.json();
        if (Array.isArray(result)) {
          setAllShipments(result);
        }
      }
    } catch (err) {
      console.error("Gagal memuat daftar tracking:", err);
    } finally {
      setLoadingList(false);
    }
  };

  // FUNGSI CARI DATA
  const handleSearch = async (forcedCode?: string) => {
    const targetCode = forcedCode || code;
    if (!targetCode) return;

    setLoading(true);
    setError("");
    setData(null);

    try {
      const token = localStorage.getItem("donasi-track-session-token") || "";
      const res = await fetch(`${API_URL}/tracking/${targetCode}`, {
        headers: authHeaders(token),
      });

      if (!res.ok) {
        throw new Error(
          "Kode tracking tidak ditemukan atau server bermasalah.",
        );
      }

      const result: ShipmentData = await res.json();
      setData(result);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan yang tidak diketahui.");
      }
    } finally {
      setLoading(false);
    }
  };

  // LOGIKA FILTER TAB
  const filteredShipments = useMemo(() => {
    return allShipments.filter((shipment) => {
      const latestEvent = shipment.trackingEvents?.[0];
      const statusText = latestEvent?.status?.toLowerCase() || "";

      const isDone =
        statusText.includes("selesai") ||
        statusText.includes("diterima") ||
        statusText.includes("tiba");

      return activeTab === "selesai" ? isDone : !isDone;
    });
  }, [allShipments, activeTab]);

  return (
    <main className="admin-shell fade-up">
      {session.user?.role === "ADMIN" ? (
        <AdminConsoleSidebar active="tracking" />
      ) : (
        <aside className="console-sidebar">
          <div className="console-brand">DonasiTrack</div>
          <p className="console-caption">Menu Donatur</p>
          <nav className="console-menu">
            <Link href="/donatur" className="console-link">
              <span className="console-link-icon">DB</span>
              Donasi
            </Link>
            <Link href="/tracking" className="console-link active">
              <span className="console-link-icon">TR</span>
              Tracking
            </Link>
          </nav>
        </aside>
      )}

      <section className="console-main">
        <div className="console-topbar">
          <div>
            <h1>Tracking Logistik</h1>
            <p>Pantau posisi dan status distribusi bantuan secara real-time.</p>
          </div>
          <div className="console-user-pill">{roleLabel}</div>
        </div>

        {/* SECTION PENCARIAN */}
        <section
          className="console-surface"
          style={{
            marginBottom: "20px",
            padding: "20px",
            borderRadius: "12px",
          }}
        >
          <div style={{ display: "flex", gap: "12px" }}>
            <input
              type="text"
              placeholder="Masukkan Kode Tracking (Contoh: DNT-xxxx)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: "8px",
                backgroundColor: "#ffffff",
                border: "1px solid #cbd5e1",
                color: "#0f172a",
                outline: "none",
                fontSize: "1rem",
                transition: "all 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#991b1b")}
              onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
            />
            <button 
              onClick={handleSearch}
              className="console-btn info"
              disabled={loading}
            >
              {loading ? "Mencari..." : "Cari Data 🔎"}
            </button>
          </div>
        </section>

        <section className="console-surface" style={{ padding: "2rem" }}>
          {error && <p style={{ color: "#ef4444" }}>❌ {error}</p>}

          {!data && !error && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📦</div>
              <h2 style={{ marginBottom: "8px" }}>Siap Melacak</h2>
              <p className="console-muted">Masukkan nomor resi untuk melihat riwayat perjalanan barang.</p>
            </div>
          )}

          {data && (
            <div style={{ textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", backgroundColor: "#0f172a", padding: "15px", borderRadius: "10px", marginBottom: "25px" }}>
                <div>
                  <h3 style={{ color: "#3b82f6", margin: "0 0 5px 0" }}>{data.trackingCode}</h3>
                  <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: "bold" }}>{data.item?.name || "Paket Bantuan"}</p>
                  <p className="console-muted" style={{ fontSize: "0.85rem" }}>Tujuan: {data.destinationLocation}</p>
                </div>
              </div>

              {/* Tampilan Timeline Ala Shopee */}
              <div style={{ position: "relative", paddingLeft: "30px", marginTop: "20px" }}>
                {data.trackingEvents && data.trackingEvents.length > 0 ? (
                  data.trackingEvents.map((event, index) => (
                    <div key={event.id} style={{ position: "relative", marginBottom: "30px" }}>
                      
                      {/* Garis Vertikal */}
                      {index !== data.trackingEvents.length - 1 && (
                        <div style={{ position: "absolute", left: "-21px", top: "20px", bottom: "-30px", width: "2px", backgroundColor: "#334155" }} />
                      )}

                      {/* Titik Indikator */}
                      <div style={{
                        position: "absolute", left: "-26px", top: "5px", width: "12px", height: "12px", borderRadius: "50%",
                        backgroundColor: index === 0 ? "#3b82f6" : "#475569",
                        border: index === 0 ? "4px solid #1e293b" : "none",
                        zIndex: 2
                      }} />

                      <div>
                        <div style={{ fontSize: "0.85rem", color: index === 0 ? "#3b82f6" : "#64748b", fontWeight: index === 0 ? "bold" : "normal" }}>
                          {new Date(event.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                        <div style={{ fontSize: "1rem", marginTop: "4px", color: index === 0 ? "#f8fafc" : "#94a3b8", fontWeight: index === 0 ? "bold" : "500" }}>
                          {event.status}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#475569", marginTop: "2px" }}>
                          📍 {event.location} | Oleh: {event.createdBy?.name}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="console-muted">Belum ada riwayat perjalanan.</p>
                )}
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}