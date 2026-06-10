"use client";

import { useState } from "react";
import { API_URL } from "../lib/api";
import { rupiah } from "../lib/format";

interface DonationFormProps {
  campaignId: string;
  campaignTitle: string;
  targetAmount: number;
  onClose: () => void;
  sessionToken: string;
}

export function DonationForm({
  campaignId,
  campaignTitle,
  targetAmount,
  onClose,
  sessionToken,
}: DonationFormProps) {
  const [amount, setAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!amount || amount <= 0) {
      setError("Jumlah donasi harus lebih dari 0");
      return;
    }

    if (amount > 1000000000) {
      setError("Jumlah donasi terlalu besar");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          campaignId,
          amount: Math.round(amount),
          method: "bca",
          bank: "bca",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Gagal membuat pembayaran");
      }

      const paymentData = await response.json();

      // Redirect to payment page with order details
      const params = new URLSearchParams({
        amount: amount.toString(),
        orderId: paymentData.orderId || "",
        method: "bca",
      });

      window.location.href = `/donatur/payment?${params.toString()}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setIsSubmitting(false);
    }
  }

  const percentOfTarget = targetAmount ? Math.round((amount / targetAmount) * 100) : 0;

  return (
    <div className="campaign-modal-backdrop" onClick={onClose}>
      <div className="campaign-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: "#ffffff" }}>Donasi untuk "{campaignTitle}"</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#ffffff",
              fontSize: "24px",
              cursor: "pointer",
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {error ? <div style={{ color: "#ef4444", fontSize: "14px", padding: 8, backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: 8 }}>{error}</div> : null}

          <div>
            <label style={{ display: "block", marginBottom: 8, color: "#d1d5db", fontSize: "14px" }}>
              Jumlah Donasi (IDR)
            </label>
            <input
              type="number"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Masukkan jumlah donasi"
              required
              min="1"
              disabled={isSubmitting}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "#ffffff",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
            {amount > 0 && (
              <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: 8 }}>
                {percentOfTarget}% dari target kampanye ({rupiah(targetAmount)})
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                backgroundColor: "transparent",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                opacity: isSubmitting ? 0.5 : 1,
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: "8px",
                border: "none",
                background: isSubmitting ? "rgba(220, 38, 38, 0.5)" : "linear-gradient(135deg, #b71c1c 0%, #dc2626 100%)",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? "Memproses..." : `Lanjutkan Donasi`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
