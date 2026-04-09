"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { API_URL, authHeaders } from "../lib/api";

type ShipmentStatus = "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "FAILED";

const SHIPMENT_STATUS = {
  PICKED_UP: "PICKED_UP" as ShipmentStatus,
  IN_TRANSIT: "IN_TRANSIT" as ShipmentStatus,
  DELIVERED: "DELIVERED" as ShipmentStatus,
  FAILED: "FAILED" as ShipmentStatus,
};

type QueueItem = {
  shipmentId: string;
  status: ShipmentStatus;
  note?: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
};

const QUEUE_KEY = "volunteer-tracking-queue";

type VolunteerFieldAppProps = {
  authToken: string;
};

export function VolunteerFieldApp({ authToken }: VolunteerFieldAppProps) {
  const [shipmentId, setShipmentId] = useState("");
  const [status, setStatus] = useState<ShipmentStatus>(SHIPMENT_STATUS.PICKED_UP);
  const [note, setNote] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [photoUrl, setPhotoUrl] = useState("");
  const [message, setMessage] = useState("");
  const [queueCount, setQueueCount] = useState(0);

  const qrElementId = useMemo(() => "qr-reader", []);

  useEffect(() => {
    setQueueCount((JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]") as QueueItem[]).length);

    let cleanup: (() => void) | undefined;

    (async () => {
      const { Html5QrcodeScanner } = await import("html5-qrcode");

      const scanner = new Html5QrcodeScanner(
        qrElementId,
        {
          fps: 8,
          qrbox: { width: 210, height: 210 },
        },
        false,
      );

      scanner.render(
        (decodedText) => {
          setShipmentId(decodedText);
          setMessage(`QR terbaca: ${decodedText}`);
        },
        () => {
          // Ignore continuous scan errors.
        },
      );

      cleanup = () => {
        void scanner.clear();
      };
    })();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [qrElementId]);

  function captureLocation() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setMessage("Lokasi berhasil diambil");
      },
      () => setMessage("Gagal mengambil lokasi"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function sendTracking(body: QueueItem) {
    const response = await fetch(`${API_URL}/logistics/${body.shipmentId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(authToken),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error("Request failed");
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const body: QueueItem = {
      shipmentId,
      status,
      note,
      latitude,
      longitude,
      photoUrl: photoUrl || undefined,
    };

    try {
      await sendTracking(body);
      setMessage("Tracking terkirim ke server");
    } catch {
      const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]") as QueueItem[];
      queue.push(body);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      setQueueCount(queue.length);
      setMessage("Offline: data tracking disimpan lokal dan bisa sync nanti");
    }
  }

  async function syncQueue() {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]") as QueueItem[];
    const remaining: QueueItem[] = [];

    for (const item of queue) {
      try {
        await sendTracking(item);
      } catch {
        remaining.push(item);
      }
    }

    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    setQueueCount(remaining.length);
    setMessage(remaining.length ? "Sebagian data masih antri" : "Semua data offline berhasil disinkronkan");
  }

  return (
    <div className="grid">
      <div className="card">
        <h3>Pemindai QR Relawan</h3>
        <p className="muted">Scan QR untuk mengambil ID pengiriman saat serah terima bantuan.</p>
        <div id={qrElementId} style={{ marginTop: 10 }} />
      </div>

      <div className="card">
        <h3>Update Status Lapangan</h3>
        <form className="form" onSubmit={onSubmit} style={{ marginTop: 8 }}>
          <input placeholder="Shipment ID (dari QR)" value={shipmentId} onChange={(event) => setShipmentId(event.target.value)} required />
          <select value={status} onChange={(event) => setStatus(event.target.value as ShipmentStatus)}>
            <option value={SHIPMENT_STATUS.PICKED_UP}>PICKED_UP</option>
            <option value={SHIPMENT_STATUS.IN_TRANSIT}>IN_TRANSIT</option>
            <option value={SHIPMENT_STATUS.DELIVERED}>DELIVERED</option>
            <option value={SHIPMENT_STATUS.FAILED}>FAILED</option>
          </select>
          <textarea placeholder="Catatan lapangan" value={note} onChange={(event) => setNote(event.target.value)} rows={3} />
          <input placeholder="URL foto bukti (hasil upload kamera)" value={photoUrl} onChange={(event) => setPhotoUrl(event.target.value)} />
          <button className="btn secondary" type="button" onClick={captureLocation}>
            Ambil Geolocation
          </button>
          <button className="btn brand" type="submit">
            Kirim Tracking
          </button>
          <button className="btn" type="button" onClick={syncQueue}>
            Sinkronkan Data Offline ({queueCount})
          </button>
        </form>
        <p className="muted" style={{ marginTop: 8 }}>
          Lokasi: {latitude ?? "-"}, {longitude ?? "-"}
        </p>
        {message ? <p className="muted">{message}</p> : null}
      </div>
    </div>
  );
}
