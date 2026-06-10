"use client";

import { FormEvent } from "react";
import { useCampaignForm } from "../hooks/useCampaignForm";
import { CampaignStatus } from "../types/campaign";

// Komponen form untuk membuat kampanye baru, menggunakan hook useCampaignForm untuk logika bisnisnya
export function CampaignForm() {
  const { message, isSubmitting, submitCampaign } = useCampaignForm();
  // Handle submit form, mengumpulkan data dan memanggil fungsi submitCampaign dari hook
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // Membuat objek data sesuai dengan tipe CampaignCreateInput
    const body = {
      title: String(formData.get("title")),
      description: String(formData.get("description")),
      disasterType: String(formData.get("disasterType")),
      location: String(formData.get("location")),
      targetAmount: Number(formData.get("targetAmount")),
      status: String(formData.get("status") || "PENDING") as CampaignStatus,
    };

    // Memanggil fungsi submitCampaign dan menunggu hasilnya untuk menentukan apakah form bisa di-reset
    const success = await submitCampaign(body);
    if (success) {
      event.currentTarget.reset();
    }
  }

  // Render form dengan input untuk setiap field kampanye
  return (
    <div className="panel">
      <h3 style={{ marginBottom: 8 }}>Buat Kampanye Baru</h3>
      <p className="status-line">Lengkapi formulir di bawah untuk merilis kampanye donasi.</p>
      
      <form className="form" onSubmit={onSubmit}>
        <select name="status" defaultValue="PENDING">
          <option value="PENDING">PENDING</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
        <input name="title" placeholder="Judul kampanye" required />
        <textarea name="description" placeholder="Deskripsi kampanye" required rows={3} />
        <input name="disasterType" placeholder="Jenis bencana (cth: Banjir, Gempa)" required />
        <input name="location" placeholder="Lokasi terdampak" required />
        <input name="targetAmount" type="number" placeholder="Target Dana (IDR)" required />
        
        <button className="btn success" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan Kampanye"}
        </button>
      </form>

      {message && (
        <p className={`status-line ${message ? "success-text" : "error-text"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
