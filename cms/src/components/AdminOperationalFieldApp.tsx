"use client";

import { FormEvent, useState } from "react";
import { useGeolocation } from "../hooks/useGeolocation";
import { useOfflineQueue } from "../hooks/useOfflineQueue";
import { QRScanner } from "./QRScanner";
import { sendTrackingData } from "../services/logisticsService";
import { SHIPMENT_STATUS, ShipmentStatus, QueueItem } from "../types/logistics";

export function AdminOperationalFieldApp({ authToken }: { authToken: string }) {
  // State lokal untuk form
  const [shipmentId, setShipmentId] = useState("");
  const [status, setStatus] = useState<ShipmentStatus>(SHIPMENT_STATUS.PICKED_UP);
  const [note, setNote] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Mengambil fungsi dan data dari custom hooks
  const { latitude, longitude, captureLocation, isGeoLoading } = useGeolocation();
  const { queueCount, addToQueue, getQueue, clearQueue } = useOfflineQueue();

  // Handle submit form tracking 
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const body: QueueItem = {
      shipmentId,
      status,
      note: note || undefined,
      latitude,
      longitude,
      photoUrl: photoUrl || undefined,
    };

    try {
      // Coba kirim data ke server
      await sendTrackingData(body, authToken);
      setMessage("Berhasil: Tracking terkirim ke server");
    } catch (error) {
      // Jika gagal (kemungkinan offline), simpan ke antrean lokal
      addToQueue(body);
      setMessage("Offline: Data disimpan lokal dan akan disinkronkan nanti");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle sinkronisasi data yang tertunda di local storage 
  async function handleSync() {
    setIsSyncing(true);
    const queue = getQueue();
    const remaining: QueueItem[] = [];

    for (const item of queue) {
      try {
        await sendTrackingData(item, authToken);
      } catch {
        remaining.push(item);
      }
    }

    clearQueue(remaining);
    setMessage(remaining.length === 0 
      ? "Semua data offline berhasil disinkronkan" 
      : `${remaining.length} data gagal disinkronkan, mencoba lagi nanti`
    );
    setIsSyncing(false);
  }

  return (
    <div className="grid">
      {/* Bagian Scanner */}
      <QRScanner onScan={(text) => {
        setShipmentId(text);
        setMessage(`QR Terbaca: ${text}`);
      }} />

      {/* Bagian Form Update */}
      <div className="card">
        <h3>Update Status Lapangan</h3>
        <form className="form" onSubmit={onSubmit} style={{ marginTop: 8 }}>
          <input 
            placeholder="Shipment ID (otomatis dari QR)" 
            value={shipmentId} 
            onChange={(e) => setShipmentId(e.target.value)} 
            required 
          />
          
          <select value={status} onChange={(e) => setStatus(e.target.value as ShipmentStatus)}>
            {Object.values(SHIPMENT_STATUS).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <textarea 
            placeholder="Catatan tambahan (opsional)" 
            value={note} 
            onChange={(e) => setNote(e.target.value)} 
            rows={3} 
          />
          
          <input 
            placeholder="URL Foto Bukti" 
            value={photoUrl} 
            onChange={(e) => setPhotoUrl(e.target.value)} 
          />

          <button className="btn info" type="button" onClick={() => captureLocation(setMessage)} disabled={isGeoLoading}>
            {isGeoLoading ? "Mengambil Lokasi..." : " Ambil Lokasi GPS"}
          </button>

          <button className="btn success" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Mengirim..." : " Kirim Tracking"}
          </button>

          <button className="btn neutral" type="button" onClick={handleSync} disabled={isSyncing || queueCount === 0}>
            {isSyncing ? "Sinkronisasi..." : ` Sinkronkan Data Offline (${queueCount})`}
          </button>
        </form>

        <p className="status-line" style={{ marginTop: 10, fontSize: "0.9rem" }}>
          <b>Koordinat:</b> {latitude ?? "-"}, {longitude ?? "-"}
        </p>
        
        {message && <p className="status-line" style={{ color: "blue" }}>{message}</p>}
      </div>
    </div>
  );
}