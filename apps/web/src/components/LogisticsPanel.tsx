"use client";

import { FormEvent, useState } from "react";
import { API_URL, authHeaders } from "../lib/api";

const SESSION_TOKEN_KEY = "donasi-track-session-token";

export function LogisticsPanel() {
  const [token] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return localStorage.getItem(SESSION_TOKEN_KEY) || "";
  });
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setMessage("Sesi admin tidak ditemukan. Silakan login ulang.");
      return;
    }

    const formData = new FormData(event.currentTarget);

    const body = {
      campaignId: String(formData.get("campaignId")),
      itemId: String(formData.get("itemId")),
      quantity: Number(formData.get("quantity")),
      fromWarehouse: String(formData.get("fromWarehouse")),
      destinationLocation: String(formData.get("destinationLocation")),
      assignedAdminId: String(formData.get("assignedAdminId")) || undefined,
    };

    const response = await fetch(`${API_URL}/logistics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Gagal membuat alokasi logistik");
      return;
    }

    setMessage(`Alokasi dibuat. Tracking code: ${data.trackingCode}`);
  }

  return (
    <div className="panel">
      <h3>Alokasi Gudang ke Admin Operasional</h3>
      <p className="status-line">Token admin diambil otomatis dari sesi login.</p>
      <form className="form" onSubmit={onSubmit} style={{ marginTop: 8 }}>
        <input name="campaignId" placeholder="Campaign ID" required />
        <input name="itemId" placeholder="Inventory Item ID" required />
        <input name="quantity" type="number" placeholder="Jumlah" required />
        <input name="fromWarehouse" placeholder="Gudang asal" defaultValue="Gudang Pusat" required />
        <input name="destinationLocation" placeholder="Lokasi tujuan" required />
        <input name="assignedAdminId" placeholder="Admin ID penanggung jawab (opsional)" />
        <button className="btn brand" type="submit">
          Buat Pengiriman
        </button>
      </form>
      {message ? <p className="status-line">{message}</p> : null}
    </div>
  );
}
