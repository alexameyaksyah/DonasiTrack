import { useState } from "react";
import { createCampaign } from "../services/campaignService";
import { CampaignCreateInput } from "../types/campaign";

const SESSION_TOKEN_KEY = "donasi-track-session-token";

export function useCampaignForm() {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fungsi internal untuk mengambil token dari storage 
  const getSessionToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(SESSION_TOKEN_KEY) || "";
    }
    return "";
  };

  // Logika utama untuk memproses pembuatan kampanye 
  const submitCampaign = async (data: CampaignCreateInput) => {
    setIsSubmitting(true);
    setMessage("");
    const token = getSessionToken();

    try {
      await createCampaign(data, token);
      setMessage("Kampanye berhasil dibuat. Silakan reload halaman.");
      return true; 
    } catch (err: unknown) {
      /** Kita gunakan 'unknown' daripada 'any'. 
       * Lalu kita cek apakah 'err' adalah instance dari Error agar bisa akses '.message' dengan aman.
       */
      const errorMessage = err instanceof Error ? err.message : "Gagal terhubung ke server";
      setMessage(`${errorMessage}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { message, isSubmitting, submitCampaign };
}