"use client";

import { useState } from "react";
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

export default function TrackingPage() {
  const [code, setCode] = useState<string>("");
  const [data, setData] = useState<ShipmentData | null>(null); // State sudah punya tipe data
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSearch = async () => {
    if (!code) return;
    
    setLoading(true);
    setError("");
    setData(null);

    try {
      const token = localStorage.getItem("donasi-track-session-token") || "";
      const res = await fetch(`${API_URL}/tracking/${code}`, {
        headers: authHeaders(token),
      });

      if (!res.ok) {
        throw new Error("Kode tracking tidak ditemukan atau server bermasalah.");
      }

      const result: ShipmentData = await res.json(); // Casting data ke interface
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

  return (
    <main className="admin-shell fade-up">
      <AdminConsoleSidebar active="tracking" />

      <section className="console-main">
        <div className="console-topbar">
          <div>
            <h1>Tracking Logistik</h1>
            <p>Pantau posisi dan status distribusi bantuan secara real-time.</p>
          </div>
          <div className="console-user-pill">Admin Mode</div>
        </div>

        <section className="console-surface" style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <input
              type="text"
              placeholder="Masukkan Kode Tracking (Contoh: DNT-xxxx)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{
                flex: 1, padding: "12px 16px", borderRadius: "8px",
                backgroundColor: "#1e293b", border: "1px solid #334155",
                color: "white", outline: "none"
              }}
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
                      
