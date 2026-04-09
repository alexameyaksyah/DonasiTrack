"use client";

import { useState } from "react";
import { API_URL, authHeaders } from "../lib/api";

const SESSION_TOKEN_KEY = "donasi-track-session-token";

type PendingDonation = {
  id: string;
  type: "MONEY" | "GOODS";
  amount?: number | null;
  itemName?: string | null;
  quantity?: number | null;
  donor: { name: string; email: string };
  campaign: { title: string };
};

export function VerificationPanel() {
  const [token] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return localStorage.getItem(SESSION_TOKEN_KEY) || "";
  });
  const [items, setItems] = useState<PendingDonation[]>([]);
  const [message, setMessage] = useState("");

  async function loadPending() {
    if (!token) {
      setMessage("Sesi admin tidak ditemukan. Silakan login ulang.");
      return;
    }

    const response = await fetch(`${API_URL}/admin/verifications/pending`, {
      headers: authHeaders(token),
    });

    if (!response.ok) {
      setMessage("Gagal memuat data verifikasi. Pastikan token admin valid.");
      return;
    }

    const data = (await response.json()) as PendingDonation[];
    setItems(data);
    setMessage(`Pending: ${data.length} donasi`);
  }

  async function updateStatus(id: string, status: "VERIFIED" | "REJECTED") {
    if (!token) {
      setMessage("Sesi admin tidak ditemukan. Silakan login ulang.");
      return;
    }

    const response = await fetch(`${API_URL}/admin/verifications/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({ status, note: status === "REJECTED" ? "Bukti tidak valid" : "Terverifikasi" }),
    });

    if (!response.ok) {
      setMessage("Gagal memperbarui status");
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
    setMessage("Status verifikasi berhasil diperbarui");
  }

  return (
    <div className="panel">
      <h3>Validasi Bukti Donasi</h3>
      <p className="muted">Token admin diambil otomatis dari sesi login.</p>
      <div className="form" style={{ marginTop: 8 }}>
        <button className="btn" onClick={loadPending} type="button">
          Muat Pending
        </button>
      </div>
      {message ? <p className="muted" style={{ marginTop: 8 }}>{message}</p> : null}
      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {items.map((item) => (
          <div className="card" key={item.id}>
            <h4>{item.campaign.title}</h4>
            <p className="muted">Donatur: {item.donor.name} ({item.donor.email})</p>
            <p className="muted">
              Tipe: {item.type} {item.type === "MONEY" ? `- Rp ${item.amount}` : `- ${item.itemName} (${item.quantity})`}
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="btn brand" onClick={() => updateStatus(item.id, "VERIFIED")} type="button">
                Verifikasi
              </button>
              <button className="btn warn" onClick={() => updateStatus(item.id, "REJECTED")} type="button">
                Tolak
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
