"use client";

import { FormEvent, useState } from "react";
import { API_URL, authHeaders } from "../lib/api";

export function LogisticsPanel() {
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const body = {
      campaignId: String(formData.get("campaignId")),
      itemId: String(formData.get("itemId")),
      quantity: Number(formData.get("quantity")),
      fromWarehouse: String(formData.get("fromWarehouse")),
      destinationLocation: String(formData.get("destinationLocation")),
      assignedVolunteerId: String(formData.get("assignedVolunteerId")) || undefined,
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
      <h3>Alokasi Gudang ke Relawan/Kurir</h3>
      <form className="form" onSubmit={onSubmit} style={{ marginTop: 8 }}>
        <input placeholder="JWT Admin" value={token} onChange={(event) => setToken(event.target.value)} />
        <input name="campaignId" placeholder="Campaign ID" required />
        <input name="itemId" placeholder="Inventory Item ID" required />
        <input name="quantity" type="number" placeholder="Jumlah" required />
        <input name="fromWarehouse" placeholder="Gudang asal" defaultValue="Gudang Pusat" required />
        <input name="destinationLocation" placeholder="Lokasi tujuan" required />
        <input name="assignedVolunteerId" placeholder="Volunteer ID (opsional)" />
        <button className="btn brand" type="submit">
          Buat Pengiriman
        </button>
      </form>
      {message ? <p className="muted" style={{ marginTop: 8 }}>{message}</p> : null}
    </div>
  );
}
