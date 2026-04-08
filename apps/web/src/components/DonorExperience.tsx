"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { API_URL, authHeaders } from "../lib/api";

type Campaign = {
  id: string;
  title: string;
  disasterType: string;
  location: string;
  targetAmount: number;
  collectedAmount: number;
  status: "OPEN" | "CLOSED";
};

const CACHE_KEY = "donasi-track-campaigns";

export function DonorExperience() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [trackingCode, setTrackingCode] = useState("");

  useEffect(() => {
    const cache = localStorage.getItem(CACHE_KEY);
    if (cache) {
      setCampaigns(JSON.parse(cache));
    }

    fetch(`${API_URL}/campaigns`)
      .then((res) => res.json())
      .then((data: Campaign[]) => {
        setCampaigns(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      })
      .catch(() => {
        setMessage("Mode cache aktif: menampilkan kampanye dari data lokal.");
      });
  }, []);

  async function onDonation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const body = {
      campaignId: String(formData.get("campaignId")),
      type: String(formData.get("type")),
      amount: Number(formData.get("amount")) || undefined,
      itemName: String(formData.get("itemName")) || undefined,
      quantity: Number(formData.get("quantity")) || undefined,
      transferProofUrl: String(formData.get("transferProofUrl")) || undefined,
    };

    try {
      const response = await fetch(`${API_URL}/donations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(token),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        setMessage(data.message || "Donasi gagal diproses");
        return;
      }

      setMessage("Donasi berhasil dikirim, menunggu verifikasi admin.");
      event.currentTarget.reset();
    } catch {
      const queue = JSON.parse(localStorage.getItem("donation-queue") || "[]") as unknown[];
      queue.push(body);
      localStorage.setItem("donation-queue", JSON.stringify(queue));
      setMessage("Jaringan tidak stabil. Donasi disimpan lokal dan bisa dikirim ulang nanti.");
    }
  }

  return (
    <div className="grid">
      <div className="card">
        <h3>Eksplorasi Kampanye</h3>
        <p className="muted">Data disimpan cache lokal agar tetap cepat di jaringan tidak stabil.</p>
        <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
          {campaigns.map((campaign) => (
            <div className="panel" key={campaign.id}>
              <strong>{campaign.title}</strong>
              <p className="muted">{campaign.disasterType} - {campaign.location}</p>
              <p className="muted">Terkumpul {campaign.collectedAmount} / {campaign.targetAmount}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Form Donasi</h3>
        <form className="form" onSubmit={onDonation} style={{ marginTop: 8 }}>
          <input placeholder="JWT Donatur" value={token} onChange={(event) => setToken(event.target.value)} required />
          <input name="campaignId" placeholder="Campaign ID" required />
          <select name="type" defaultValue="MONEY">
            <option value="MONEY">Uang</option>
            <option value="GOODS">Barang</option>
          </select>
          <input name="amount" type="number" placeholder="Nominal uang (opsional untuk GOODS)" />
          <input name="itemName" placeholder="Nama barang" />
          <input name="quantity" type="number" placeholder="Jumlah barang" />
          <input name="transferProofUrl" placeholder="URL bukti transfer/foto" />
          <button className="btn brand" type="submit">
            Kirim Donasi
          </button>
        </form>
        {message ? <p className="muted" style={{ marginTop: 8 }}>{message}</p> : null}
      </div>

      <div className="card">
        <h3>Tracking Bantuan</h3>
        <p className="muted">Masukkan kode tracking untuk melihat timeline bantuan.</p>
        <div className="form" style={{ marginTop: 8 }}>
          <input value={trackingCode} onChange={(event) => setTrackingCode(event.target.value)} placeholder="Contoh: DNT-123456-ABCD" />
          <Link className="btn" href={`/tracking/${trackingCode || "demo"}`}>
            Lihat Timeline
          </Link>
        </div>
      </div>
    </div>
  );
}
