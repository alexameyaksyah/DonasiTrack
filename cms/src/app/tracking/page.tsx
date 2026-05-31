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
