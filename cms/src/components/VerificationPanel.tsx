"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { API_URL, authHeaders } from "../lib/api";
import { rupiah } from "../lib/format";

const SESSION_TOKEN_KEY = "donasi-track-session-token";

type VerificationItem = {
  id: string;
  type: "MONEY" | "GOODS";
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  amount?: number | null;
  itemName?: string | null;
  quantity?: number | null;
  transferProofUrl?: string | null;
  createdAt: string;
  donor: { name: string; email: string };
  campaign: { title: string };
};

type VerificationTab = "PENDING" | "VERIFIED" | "REJECTED";

function donorBankHint(donation: VerificationItem) {
  const source = donation.transferProofUrl?.toLowerCase() || donation.donor.email.toLowerCase();
  if (source.includes("bri")) return "BRI";
  if (source.includes("bca")) return "BCA";
  if (source.includes("bni")) return "BNI";
  if (source.includes("mandiri")) return "Mandiri";
  return "Transfer";
}

function timeLabel(dateString: string) {
  const date = new Date(dateString);
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `Hari ini ${hour}:${minute}`;
}

export function VerificationPanel() {
  const [token] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return localStorage.getItem(SESSION_TOKEN_KEY) || "";
  });
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<VerificationTab>("PENDING");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string>("");

  const tabCounts = useMemo(() => {
    return {
      PENDING: items.filter((item) => item.verificationStatus === "PENDING").length,
      VERIFIED: items.filter((item) => item.verificationStatus === "VERIFIED").length,
      REJECTED: items.filter((item) => item.verificationStatus === "REJECTED").length,
    };
  }, [items]);

  const loadVerifications = useCallback(async () => {
    setIsLoading(true);
    if (!token) {
      setMessage("Sesi admin tidak ditemukan. Silakan login ulang.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/verifications`, {
        headers: authHeaders(token),
      });

      if (!response.ok) {
        setMessage("Gagal memuat data verifikasi. Pastikan token admin valid.");
        return;
      }

      const data = (await response.json()) as VerificationItem[];
      setItems(data);
      setMessage(data.length > 0 ? `${data.length} data verifikasi dimuat` : "Belum ada data verifikasi.");
    } catch {
      setMessage("Gagal terhubung ke server.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadVerifications();
  }, [loadVerifications]);

  async function updateStatus(id: string, status: "VERIFIED" | "REJECTED") {
    setProcessingId(id);
    if (!token) {
      setMessage("Sesi admin tidak ditemukan. Silakan login ulang.");
      setProcessingId("");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/verifications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(token),
        },
        body: JSON.stringify({ status, note: status === "REJECTED" ? "Bukti tidak valid" : "Terverifikasi" }),
      });

      if (!response.ok) {
        setMessage("Gagal memperbarui status");
        return;
      }

      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, verificationStatus: status } : item)));
      setMessage(status === "VERIFIED" ? "Donasi berhasil diverifikasi." : "Donasi berhasil ditolak.");
    } catch {
      setMessage("Gagal terhubung ke server.");
    } finally {
      setProcessingId("");
    }
  }

  const entries = useMemo(() => {
    return items
      .filter((item) => item.verificationStatus === activeTab)
      .map((item) => ({
      ...item,
      bank: donorBankHint(item),
      amountLabel: item.type === "MONEY" ? rupiah(item.amount || 0) : `${item.itemName || "Barang"} (${item.quantity || 1})`,
      timeText: timeLabel(item.createdAt),
    }));
  }, [activeTab, items]);

  return (
    <div className="verification-console">
      <div className="verification-header">
        <h3>Daftar Bukti Transfer</h3>
        <div className="verification-header-right">
          <span className="verification-count">{tabCounts.PENDING} menunggu persetujuan</span>
          <button className="console-btn info" onClick={loadVerifications} type="button" disabled={isLoading}>
            {isLoading ? "Memuat..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="campaign-tabs" style={{ marginTop: 10 }}>
        <button className={`campaign-tab ${activeTab === "PENDING" ? "active" : ""}`} type="button" onClick={() => setActiveTab("PENDING")}>
          Menunggu ({tabCounts.PENDING})
        </button>
        <button className={`campaign-tab ${activeTab === "VERIFIED" ? "active" : ""}`} type="button" onClick={() => setActiveTab("VERIFIED")}>
          Terverifikasi ({tabCounts.VERIFIED})
        </button>
        <button className={`campaign-tab ${activeTab === "REJECTED" ? "active" : ""}`} type="button" onClick={() => setActiveTab("REJECTED")}>
          Ditolak ({tabCounts.REJECTED})
        </button>
      </div>

      {message ? <p className="status-line">{message}</p> : null}

      {entries.length === 0 && !isLoading ? (
        <div className="campaign-empty-state" style={{ marginTop: 8 }}>
          <div className="campaign-empty-icon">✓</div>
          <h3>Tidak ada data pada tab ini</h3>
          <p className="console-muted">Coba pindah tab status atau klik refresh untuk sinkronisasi data terbaru.</p>
        </div>
      ) : null}

      <div className="verification-list">
        {entries.map((item) => (
          <article className="verification-item" key={item.id}>
            <div className="verification-avatar" aria-label="avatar-user">
              <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                <path
                  d="M12 12c2.49 0 4.5-2.01 4.5-4.5S14.49 3 12 3 7.5 5.01 7.5 7.5 9.51 12 12 12zm0 2.25c-3 0-9 1.5-9 4.5V21h18v-2.25c0-3-6-4.5-9-4.5z"
                  fill="currentColor"
                />
              </svg>
            </div>

            <div className="verification-meta">
              <h4>{item.donor.name}</h4>
              <p>
                {item.timeText} - {item.bank}
              </p>
              <p className="verification-campaign">{item.campaign.title}</p>
            </div>

            <div className="verification-amount-wrap">
              <p className="verification-amount">{item.amountLabel}</p>
              <span
                className={`verification-pending-chip ${
                  item.verificationStatus === "VERIFIED"
                    ? "ok"
                    : item.verificationStatus === "REJECTED"
                      ? "danger"
                      : ""
                }`}
              >
                {item.verificationStatus === "PENDING"
                  ? "Menunggu"
                  : item.verificationStatus === "VERIFIED"
                    ? "Terverifikasi"
                    : "Ditolak"}
              </span>
              {item.transferProofUrl ? (
                <a className="verification-proof-link" href={item.transferProofUrl} target="_blank" rel="noreferrer">
                  Lihat Bukti
                </a>
              ) : (
                <span className="verification-proof-link muted">Bukti tidak tersedia</span>
              )}
            </div>

            <div className="verification-actions">
              <button
                className="console-btn success"
                onClick={() => updateStatus(item.id, "VERIFIED")}
                type="button"
                disabled={processingId === item.id || item.verificationStatus !== "PENDING"}
              >
                {processingId === item.id ? "Memproses..." : "Verifikasi"}
              </button>
              <button
                className="console-btn danger"
                onClick={() => updateStatus(item.id, "REJECTED")}
                type="button"
                disabled={processingId === item.id || item.verificationStatus !== "PENDING"}
              >
                {processingId === item.id ? "Memproses..." : "Tolak"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
