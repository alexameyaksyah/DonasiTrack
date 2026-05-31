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

