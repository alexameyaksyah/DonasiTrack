"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { API_URL, authHeaders } from "../lib/api";
import { rupiah } from "../lib/format";

type Campaign = {
  id: string;
  title: string;
  disasterType: string;
  location: string;
  targetAmount: number;
  collectedAmount: number;
  status: "PENDING" | "ACTIVE" | "INACTIVE";
};

const CACHE_KEY = "donasi-track-campaigns";

type DonorExperienceProps = {
  authToken: string;
};

type DonationType = "MONEY" | "GOODS";
type BankTransferOption = "bca" | "bni" | "bri" | "permata";
type PaymentMethodOption = BankTransferOption | "qris";

type PaymentResult = {
  donationId: string;
  orderId: string;
  amount: number;
  method: PaymentMethodOption;
  paymentType: "bank_transfer" | "qris";
  bank?: BankTransferOption | string;
  vaNumber?: string;
  qrCodeUrl?: string;
  qrString?: string;
  paymentStatus: string;
  expiryTime?: string;
};

const MIDTRANS_SIMULATORS: Record<BankTransferOption, string> = {
  bca: "https://simulator.sandbox.midtrans.com/bca/va/index",
  bni: "https://simulator.sandbox.midtrans.com/bni/va/index",
  bri: "https://simulator.sandbox.midtrans.com/openapi/va/index",
  permata: "https://simulator.sandbox.midtrans.com/openapi/va/index",
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethodOption, string> = {
  bca: "BCA Virtual Account",
  bni: "BNI Virtual Account",
  bri: "BRI Virtual Account",
  permata: "Permata Virtual Account",
  qris: "QRIS",
};

function isBankTransfer(method?: string): method is BankTransferOption {
  return method === "bca" || method === "bni" || method === "bri" || method === "permata";
}

export function DonorExperience({ authToken }: DonorExperienceProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [message, setMessage] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncingPayment, setIsSyncingPayment] = useState(false);
  const [donationType, setDonationType] = useState<DonationType>("MONEY");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  useEffect(() => {
    try {
      const cache = localStorage.getItem(CACHE_KEY);
      if (cache) {
        const cachedCampaigns = JSON.parse(cache) as Campaign[];
        setCampaigns(cachedCampaigns);
        setSelectedCampaignId((current) => current || cachedCampaigns[0]?.id || "");
      }
    } catch {
      // ignore invalid cache and continue with network fetch
    }

    fetch(`${API_URL}/campaigns`)
      .then((res) => res.json())
      .then((data: Campaign[]) => {
        const activeOnly = data.filter((campaign) => campaign.status === "ACTIVE");
        setCampaigns(activeOnly);
        setSelectedCampaignId((current) => current || activeOnly[0]?.id || "");
        localStorage.setItem(CACHE_KEY, JSON.stringify(activeOnly));
      })
      .catch(() => {
        setMessage("Mode cache aktif: menampilkan kampanye dari data lokal.");
      });
  }, []);

  async function onDonation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setPaymentResult(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const type = String(formData.get("type")) as DonationType;
    const body = {
      campaignId: String(formData.get("campaignId")),
      type,
      amount: Number(formData.get("amount")) || undefined,
      itemName: String(formData.get("itemName")) || undefined,
      quantity: Number(formData.get("quantity")) || undefined,
      transferProofUrl: String(formData.get("transferProofUrl")) || undefined,
    };

    try {
      if (type === "MONEY") {
        if (!body.amount) {
          setMessage("Nominal donasi uang wajib diisi.");
          return;
        }

        const method = String(formData.get("paymentMethod") || "bca") as PaymentMethodOption;
        const response = await fetch(`${API_URL}/payments/midtrans/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(authToken),
          },
          body: JSON.stringify({
            campaignId: body.campaignId,
            amount: body.amount,
            method,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.message || "Pembayaran Midtrans gagal dibuat");
          return;
        }

        const payment = data as PaymentResult;
        setPaymentResult(payment);
        setMessage(
          payment.paymentType === "qris"
            ? "QRIS Midtrans Sandbox berhasil dibuat."
            : "Virtual account Midtrans Sandbox berhasil dibuat.",
        );

        const simulatorWindow =
          isBankTransfer(method) ? window.open(MIDTRANS_SIMULATORS[method], "_blank", "noopener,noreferrer") : null;
        if (isBankTransfer(method) && !simulatorWindow) {
          setMessage("Virtual account dibuat. Klik tombol Buka Simulator Midtrans untuk melanjutkan pembayaran sandbox.");
        }
        return;
      }

      const response = await fetch(`${API_URL}/donations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(authToken),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        setMessage(data.message || "Donasi gagal diproses");
        return;
      }

      setMessage("Donasi berhasil dikirim, menunggu verifikasi admin.");
      form.reset();
      setDonationType("MONEY");
    } catch {
      const queue = JSON.parse(localStorage.getItem("donation-queue") || "[]") as unknown[];
      queue.push(body);
      localStorage.setItem("donation-queue", JSON.stringify(queue));
      setMessage("Jaringan tidak stabil. Donasi disimpan lokal dan bisa dikirim ulang nanti.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function syncPayment() {
    if (!paymentResult) {
      return;
    }

    setIsSyncingPayment(true);
    try {
      const response = await fetch(`${API_URL}/payments/midtrans/${paymentResult.orderId}/sync`, {
        method: "POST",
        headers: authHeaders(authToken),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Gagal mengecek status pembayaran Midtrans.");
        return;
      }

      setPaymentResult((current) =>
        current
          ? {
              ...current,
              paymentStatus: data.donation?.paymentStatus || current.paymentStatus,
              vaNumber: data.donation?.vaNumber || current.vaNumber,
            }
          : current,
      );
      setMessage(`Status pembayaran: ${data.donation?.paymentStatus || paymentResult.paymentStatus}`);
    } catch {
      setMessage("Gagal terhubung ke server API saat mengecek pembayaran.");
    } finally {
      setIsSyncingPayment(false);
    }
  }

  return (
    <div className="grid">
      <div className="card">
        <h3>Eksplorasi Kampanye</h3>
        <p className="status-line">Data disimpan cache lokal agar tetap cepat di jaringan tidak stabil.</p>
        <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
          {campaigns.map((campaign) => (
            <div className="panel" key={campaign.id}>
              <strong>{campaign.title}</strong>
              <p className="muted">{campaign.disasterType} - {campaign.location}</p>
              <p className="muted">Terkumpul {campaign.collectedAmount} / {campaign.targetAmount}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Form Donasi</h3>
        <form className="form" onSubmit={onDonation} style={{ marginTop: 8 }}>
          <select
            name="campaignId"
            required
            value={selectedCampaignId}
            onChange={(event) => setSelectedCampaignId(event.target.value)}
          >
            <option value="" disabled>Pilih kampanye aktif</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.title}
              </option>
            ))}
          </select>
          <select
            name="type"
            value={donationType}
            onChange={(event) => setDonationType(event.target.value as DonationType)}
          >
            <option value="MONEY">Uang</option>
            <option value="GOODS">Barang</option>
          </select>
          {donationType === "MONEY" ? (
            <>
              <input name="amount" type="number" min={1} placeholder="Nominal donasi" required />
              <select name="paymentMethod" defaultValue="bca">
                <option value="bca">BCA Virtual Account</option>
                <option value="bni">BNI Virtual Account</option>
                <option value="bri">BRI Virtual Account</option>
                <option value="permata">Permata Virtual Account</option>
                <option value="qris">QRIS</option>
              </select>
            </>
          ) : (
            <>
              <input name="itemName" placeholder="Nama barang" required />
              <input name="quantity" type="number" min={1} placeholder="Jumlah barang" required />
              <input name="transferProofUrl" placeholder="URL foto barang" />
            </>
          )}
          <button className="btn success" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Mengirim..." : donationType === "MONEY" ? "Bayar via Midtrans" : "Kirim Donasi"}
          </button>
        </form>
        {message ? <p className="muted" style={{ marginTop: 8 }}>{message}</p> : null}
        {paymentResult ? (
          <div className="payment-summary">
            <div>
              <span className="payment-label">Order ID</span>
              <strong>{paymentResult.orderId}</strong>
            </div>
            <div>
              <span className="payment-label">Metode</span>
              <strong>{PAYMENT_METHOD_LABELS[paymentResult.method]}</strong>
            </div>
            {paymentResult.paymentType === "qris" ? (
              <div>
                <span className="payment-label">QRIS</span>
                {paymentResult.qrCodeUrl ? (
                  // Midtrans returns a generated QR image URL that is best displayed directly.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={paymentResult.qrCodeUrl}
                    alt="QRIS pembayaran Midtrans"
                    style={{ width: 180, height: 180, objectFit: "contain", background: "#fff", padding: 8 }}
                  />
                ) : (
                  <strong>{paymentResult.qrString || "-"}</strong>
                )}
              </div>
            ) : (
              <div>
                <span className="payment-label">Virtual Account</span>
                <strong>{paymentResult.vaNumber || "-"}</strong>
              </div>
            )}
            {paymentResult.bank ? (
              <div>
                <span className="payment-label">Bank/Acquirer</span>
                <strong>{paymentResult.bank.toUpperCase()}</strong>
              </div>
            ) : null}
            <div>
              <span className="payment-label">Tahap</span>
              <strong>Konfirmasi Pembayaran</strong>
            </div>
            <div>
              <span className="payment-label">Nominal</span>
              <strong>{rupiah(paymentResult.amount)}</strong>
            </div>
            <div>
              <span className="payment-label">Status</span>
              <strong>{paymentResult.paymentStatus}</strong>
            </div>
            <div className="payment-actions">
              {isBankTransfer(paymentResult.method) ? (
                <a
                  className="btn info"
                  href={MIDTRANS_SIMULATORS[paymentResult.method]}
                  target="_blank"
                  rel="noreferrer"
                >
                  Buka Simulator Midtrans
                </a>
              ) : null}
              <button className="btn neutral" type="button" onClick={syncPayment} disabled={isSyncingPayment}>
                {isSyncingPayment ? "Mengecek..." : "Cek Status"}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="card">
        <h3>Tracking Bantuan</h3>
        <p className="status-line">Masukkan kode tracking untuk melihat timeline bantuan.</p>
        <div className="form" style={{ marginTop: 8 }}>
          <input value={trackingCode} onChange={(event) => setTrackingCode(event.target.value)} placeholder="Contoh: DNT-123456-ABCD" />
          <Link className="btn info" href={`/tracking/${trackingCode || "demo"}`}>
            Lihat Timeline
          </Link>
        </div>
      </div>
    </div>
  );
}
