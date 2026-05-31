"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { API_URL, authHeaders } from "../lib/api";
import Link from "next/link";

const SESSION_TOKEN_KEY = "donasi-track-session-token";

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  warehouse: string;
};

type Campaign = {
  id: string;
  title: string;
};

type Operator = {
  id: string;
  name: string;
  email: string;
};

function emojiByItem(name: string) {
  const key = name.toLowerCase();
  if (key.includes("selimut")) return "🧣";
  if (key.includes("air")) return "💧";
  if (key.includes("p3k") || key.includes("kit")) return "🩹";
  if (key.includes("sembako") || key.includes("makanan")) return "📦";
  if (key.includes("semen")) return "🏗️";
  if (key.includes("pasir")) return "⏳";
  return "📦";
}

function initial(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "RL";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function LogisticsPanel() {
  const [token] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(SESSION_TOKEN_KEY) || "";
  });

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedOperatorId, setSelectedOperatorId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [destinationLocation, setDestinationLocation] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(10);
  const [newItemWarehouse, setNewItemWarehouse] = useState("Gudang Pusat");
  const [isCreatingItem, setIsCreatingItem] = useState(false);

  // Fitur baru untuk Tracking
  const [lastTrackingCode, setLastTrackingCode] = useState("");

  function isCuid(value: string) {
    return /^c[^\s-]{8,}$/i.test(value);
  }

  function toErrorMessage(payload: unknown, fallback: string) {
    if (!payload || typeof payload !== "object") return fallback;
    const map = payload as {
      message?: string;
      errors?: Array<{ message?: string }>;
    };
    if (map.message) return map.message;
    return map.errors?.[0]?.message || fallback;
  }

  const selectedItem = useMemo(
    () => inventory.find((item) => item.id === selectedItemId),
    [inventory, selectedItemId],
  );

  useEffect(() => {
    async function loadData() {
      setIsLoadingData(true);
      if (!token) {
        setMessage("Sesi admin tidak ditemukan.");
        setIsLoadingData(false);
        return;
      }

      try {
        const [inventoryRes, campaignRes, operatorRes] = await Promise.all([
          fetch(`${API_URL}/inventory`, { headers: authHeaders(token) }),
          fetch(`${API_URL}/campaigns`),
          fetch(`${API_URL}/admin/operators`, { headers: authHeaders(token) }),
        ]);

        const inventoryData = (await inventoryRes.json()) as InventoryItem[];
        const campaignData = (await campaignRes.json()) as Campaign[];
        const operatorData = (await operatorRes.json()) as Operator[];

        setInventory(inventoryData);
        setCampaigns(campaignData);
        setOperators(operatorData);
        setSelectedItemId(inventoryData[0]?.id || "");
        setSelectedOperatorId(operatorData[0]?.id || "");
        setCampaignId(campaignData[0]?.id || "");
      } catch {
        setMessage("Gagal terhubung ke server.");
      } finally {
        setIsLoadingData(false);
      }
    }
    void loadData();
  }, [token]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    if (
      !isCuid(campaignId) ||
      !isCuid(selectedItemId) ||
      !destinationLocation.trim()
    ) {
      setMessage("Pastikan semua data (Kampanye, Item, Lokasi) sudah terisi.");
      setIsSubmitting(false);
      return;
    }

    const body = {
      campaignId,
      itemId: selectedItemId,
      quantity,
      fromWarehouse: selectedItem?.warehouse || "Gudang Pusat",
      destinationLocation,
      assignedAdminId: selectedOperatorId || undefined,
    };

    try {
      const response = await fetch(`${API_URL}/logistics`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as { trackingCode?: string };

      if (!response.ok) {
        setMessage(toErrorMessage(data, "Gagal membuat alokasi"));
        return;
      }

      // SIMPAN KODE TRACKING UNTUK UI
      setLastTrackingCode(data.trackingCode || "");
      setMessage(`Alokasi berhasil dibuat!`);

      setDestinationLocation("");
      setQuantity(1);

      // Refresh Stok
      const inventoryRes = await fetch(`${API_URL}/inventory`, {
        headers: authHeaders(token),
      });
    } catch {
      setMessage("Gagal terhubung ke server.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onCreateInventoryItem() {
    if (!token) {
      setMessage("Sesi admin tidak ditemukan. Silakan login ulang.");
      return;
    }

    setIsCreatingItem(true);

    try {
      const response = await fetch(`${API_URL}/inventory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(token),
        },
        body: JSON.stringify({
          name: newItemName.trim(),
          quantity: Number(newItemQty),
          warehouse: newItemWarehouse.trim() || "Gudang Pusat",
          unit: "pcs",
        }),
      });

      const data = (await response.json()) as unknown;
      if (!response.ok) {
        setMessage(toErrorMessage(data, "Gagal menambah item stok"));
        return;
      }

      const created = data as InventoryItem;
      setInventory((prev) => [created, ...prev]);
      setSelectedItemId(created.id);
      setNewItemName("");
      setNewItemQty(10);
      setMessage(`Item stok ${created.name} berhasil ditambahkan.`);
    } catch {
      setMessage("Gagal terhubung ke server.");
    } finally {
      setIsCreatingItem(false);
    }
  }

  return (
    <section className="console-surface">
      <div className="logistics-header">
        <h2>Logistik & Alokasi</h2>
        <button className="console-btn success" type="submit" form="logistics-allocation-form" disabled={isSubmitting || isLoadingData}>
          {isSubmitting ? "Menyimpan..." : "Simpan Alokasi"}
        </button>
      </div>

      {message ? <p className="status-line">{message}</p> : null}

      {isLoadingData ? (
        <p className="console-muted">Memuat data logistik...</p>
      ) : (
        <form id="logistics-allocation-form" onSubmit={onSubmit} className="logistics-board">
          <div className="logistics-column">
            <h3>Stok Gudang Pusat</h3>
            <div className="form" style={{ marginBottom: 10 }}>
              <input
                placeholder="Nama item baru"
                value={newItemName}
                onChange={(event) => setNewItemName(event.target.value)}
                minLength={2}
                required
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <input
                  type="number"
                  min={1}
                  value={newItemQty}
                  onChange={(event) => setNewItemQty(Number(event.target.value))}
                  required
                />
                <input
                  placeholder="Gudang"
                  value={newItemWarehouse}
                  onChange={(event) => setNewItemWarehouse(event.target.value)}
                  required
                />
              </div>
              <button className="console-btn neutral" type="button" onClick={onCreateInventoryItem} disabled={isCreatingItem}>
                {isCreatingItem ? "Menambah..." : "Tambah Stok"}
              </button>
            </div>
            <div className="logistics-list">
              {inventory.length === 0 ? <p className="console-muted">Belum ada stok. Tambahkan item terlebih dulu.</p> : null}
              {inventory.map((item) => {
                const active = selectedItemId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`logistics-card ${active ? "active" : ""}`}
                    onClick={() => setSelectedItemId(item.id)}
                  >
                    <span className="logistics-icon">{emojiByItem(item.name)}</span>
                    <span className="logistics-title-wrap">
                      <strong>{item.name}</strong>
                      <small>
                        {item.quantity} {item.name.toLowerCase().includes("air") ? "galon" : "paket"}
                      </small>
                    </span>
                    <span className="logistics-pill">Stok</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="logistics-column">
            <h3>Kurir / Relawan</h3>
            <div className="logistics-list">
              {operators.map((operator) => {
                const active = selectedOperatorId === operator.id;
                return (
                  <button
                    key={operator.id}
                    type="button"
                    className={`logistics-card ${active ? "active" : ""}`}
                    onClick={() => setSelectedOperatorId(operator.id)}
                  >
                    <span className="logistics-icon">{initial(operator.name)}</span>
                    <span className="logistics-title-wrap">
                      <strong>{operator.name}</strong>
                      <small>{operator.email}</small>
                    </span>
                    <span className="logistics-pill ok">Kurir</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="logistics-config">
            <div className="form">
              <select value={campaignId} onChange={(event) => setCampaignId(event.target.value)} required>
                <option value="">Pilih Kampanye</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.title}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={selectedItem?.quantity || 1}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                placeholder="Jumlah alokasi"
                required
              />
              <input
                value={destinationLocation}
                onChange={(event) => setDestinationLocation(event.target.value)}
                placeholder="Lokasi distribusi"
                required
              />
            </div>
            <p className="console-muted">Drag item dari gudang ke sini untuk mengalokasikan (mode klik aktif).</p>
          </div>
        </form>
      )}
    </section>
  );
}
