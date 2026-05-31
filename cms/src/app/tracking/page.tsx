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
