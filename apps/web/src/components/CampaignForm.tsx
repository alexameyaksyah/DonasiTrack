"use client";

import { FormEvent, useState } from "react";
import { API_URL, authHeaders } from "../lib/api";

export function CampaignForm() {
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const body = {
      title: String(formData.get("title")),
      description: String(formData.get("description")),
      disasterType: String(formData.get("disasterType")),
      location: String(formData.get("location")),
      targetAmount: Number(formData.get("targetAmount")),
    };

    const response = await fetch(`${API_URL}/campaigns`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const data = await response.json();
      setMessage(data.message || "Gagal membuat kampanye");
      return;
    }

    setMessage("Kampanye berhasil dibuat. Reload halaman untuk melihat data baru.");
    event.currentTarget.reset();
  }

  return (
    <div className="panel">
      <h3 style={{ marginBottom: 8 }}>Buat Kampanye</h3>
      <form className="form" onSubmit={onSubmit}>
        <input placeholder="JWT Admin" value={token} onChange={(event) => setToken(event.target.value)} />
        <input name="title" placeholder="Judul kampanye" required />
        <textarea name="description" placeholder="Deskripsi" required rows={3} />
        <input name="disasterType" placeholder="Jenis bencana" required />
        <input name="location" placeholder="Lokasi" required />
        <input name="targetAmount" type="number" placeholder="Target (angka)" required />
        <button className="btn brand" type="submit">
          Simpan Kampanye
        </button>
      </form>
      {message ? <p className="muted" style={{ marginTop: 8 }}>{message}</p> : null}
    </div>
  );
}
