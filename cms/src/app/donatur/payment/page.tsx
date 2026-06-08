"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { rupiah } from "../../../lib/format";
import { API_URL, authHeaders } from "../../../lib/api";

interface PaymentDetail {
  id: string;
  amount: number;
  paymentStatus: string;
  paymentType?: string;
  vaNumber?: string;
  qrString?: string;
  qrCodeUrl?: string;
  bank?: string;
  expiryTime?: string;
  campaign: {
    id: string;
    title: string;
  };
}

export default function DonorPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const amount = searchParams.get("amount");
  const orderId = searchParams.get("orderId");
  const method = searchParams.get("method");

  const [paymentDetail, setPaymentDetail] = useState<PaymentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        if (!orderId) {
          setError("Order ID tidak ditemukan");
          setIsLoading(false);
          return;
        }

        const sessionToken = localStorage.getItem("donasi-track-session-token");
        if (!sessionToken) {
          router.push("/auth");
          return;
        }

        // Extract donationId from orderId (format: donasi-{donationId})
        const donationId = orderId.replace("donasi-", "");
        
        // Fetch payment/donation details
        const response = await fetch(
          `${API_URL}/payments/donations/${donationId}`,
          {
            headers: authHeaders(sessionToken),
          }
        );

        if (!response.ok) {
          throw new Error("Gagal memuat detail pembayaran");
        }

        const data = await response.json();
        setPaymentDetail(data);

        // If there's a redirect URL in payment payload, set it
        if (data.paymentPayload?.redirect_url) {
          setRedirectUrl(data.paymentPayload.redirect_url);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [orderId, router]);

  if (isLoading) {
    return (
      <main className="admin-shell fade-up">
        <section className="console-main" style={{ padding: "24px" }}>
          <div className="console-surface">
            <h2>Memproses Pembayaran...</h2>
            <p>Memuat detail pembayaran Anda</p>
          </div>
        </section>
      </main>
    );
  }

  if (error || !paymentDetail) {
    return (
      <main className="admin-shell fade-up">
        <section className="console-main" style={{ padding: "24px" }}>
          <div className="console-surface">
            <h2 style={{ color: "#ef4444" }}>Kesalahan Pembayaran</h2>
            <p>{error || "Data pembayaran tidak ditemukan"}</p>
            <div style={{ marginTop: "20px", display: "flex", gap: "12px" }}>
              <Link href="/donatur/kampanye" className="console-btn neutral">
                Kembali ke Kampanye
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const isQRIS = method === "qris" || paymentDetail.paymentType === "qris";
  const isBankTransfer = method !== "qris" && paymentDetail.paymentType === "bank_transfer";

  return (
    <main className="admin-shell fade-up">
      <aside className="console-sidebar">
        <div className="console-brand">DonasiTrack</div>
        <p className="console-caption">Satu donasi dari hati</p>
        <nav className="console-menu">
          <Link href="/donatur" className="console-link">
            <span className="console-link-icon">DB</span>
            Dashboard
          </Link>
          <Link href="/donatur/kampanye" className="console-link active">
            <span className="console-link-icon">CP</span>
            Kampanye
          </Link>
        </nav>
      </aside>

      <section className="console-main">
        <div className="console-topbar">
          <div>
            <h1>Pembayaran Donasi</h1>
            <p>{paymentDetail.campaign.title}</p>
          </div>
        </div>

        <div className="card">
          {/* Status */}
          <div className="console-surface" style={{ marginBottom: "24px" }}>
            <p className="console-label">Status Pembayaran</p>
            <p
              style={{
                display: "inline-block",
                padding: "6px 12px",
                borderRadius: "6px",
                backgroundColor:
                  paymentDetail.paymentStatus === "settlement"
                    ? "rgba(34, 197, 94, 0.1)"
                    : "rgba(245, 158, 11, 0.1)",
                color:
                  paymentDetail.paymentStatus === "settlement"
                    ? "#22c55e"
                    : "#f59e0b",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {paymentDetail.paymentStatus === "settlement"
                ? "Terbayar"
                : paymentDetail.paymentStatus === "pending"
                  ? "Menunggu Pembayaran"
                  : paymentDetail.paymentStatus}
            </p>
          </div>

          {/* Amount */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "24px" }}>
            <article className="console-surface">
              <p className="console-label">Jumlah Donasi</p>
              <p className="console-value" style={{ fontSize: "1.6rem" }}>
                {rupiah(paymentDetail.amount)}
              </p>
            </article>
            <article className="console-surface">
              <p className="console-label">Metode Pembayaran</p>
              <p className="console-value" style={{ fontSize: "1.2rem" }}>
                {isQRIS ? "QRIS" : paymentDetail.bank?.toUpperCase() || method?.toUpperCase()}
              </p>
            </article>
          </div>

          {/* Payment Instructions */}
          {isBankTransfer && paymentDetail.vaNumber && (
            <div
              className="console-surface"
              style={{
                backgroundColor: "rgba(59, 130, 246, 0.05)",
                borderLeft: "4px solid #3b82f6",
                padding: "16px",
                marginBottom: "24px",
                borderRadius: "8px",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "12px", color: "#0f172a" }}>
                Nomor Virtual Account
              </h3>
              <p style={{ margin: 0, color: "#374151", marginBottom: "12px", fontSize: "14px" }}>
                Silakan transfer ke nomor virtual account berikut:
              </p>
              <div
                style={{
                  backgroundColor: "#ffffff",
                  padding: "12px",
                  borderRadius: "8px",
                  fontFamily: "monospace",
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#0f172a",
                  textAlign: "center",
                  letterSpacing: "2px",
                }}
              >
                {paymentDetail.vaNumber}
              </div>
              <p style={{ margin: "12px 0 0 0", color: "#6b7280", fontSize: "12px" }}>
                {paymentDetail.expiryTime
                  ? `Kadaluarsa: ${new Date(paymentDetail.expiryTime).toLocaleString("id-ID")}`
                  : ""}
              </p>
            </div>
          )}

          {/* QR Code */}
          {isQRIS && paymentDetail.qrString && (
            <div
              className="console-surface"
              style={{
                backgroundColor: "rgba(34, 197, 94, 0.05)",
                borderLeft: "4px solid #22c55e",
                padding: "16px",
                marginBottom: "24px",
                borderRadius: "8px",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "12px", color: "#0f172a" }}>
                Kode QRIS
              </h3>
              <p style={{ margin: 0, color: "#374151", marginBottom: "12px", fontSize: "14px" }}>
                Scan QR code berikut dengan aplikasi pembayaran Anda:
              </p>
              <div style={{ textAlign: "center" }}>
                <svg
                  width="200"
                  height="200"
                  style={{ margin: "0 auto" }}
                  dangerouslySetInnerHTML={{
                    __html: paymentDetail.qrString || "",
                  }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {redirectUrl && (
              <a
                href={redirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="console-btn success"
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                Bayar Sekarang
              </a>
            )}
            <Link
              href="/donatur/kampanye"
              className="console-btn neutral"
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              Kembali ke Kampanye
            </Link>
          </div>

          {/* Info */}
          <div
            style={{
              marginTop: "24px",
              padding: "16px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
              fontSize: "14px",
              color: "#6b7280",
              lineHeight: "1.6",
            }}
          >
            <p style={{ marginTop: 0 }}>
              <strong>Catatan:</strong> Pembayaran Anda akan diverifikasi dalam waktu hingga 1x24 jam. Setelah pembayaran dikonfirmasi, dana akan langsung ditambahkan ke total donasi kampanye.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
