"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  paymentUrl?: string;
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
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncingPayment, setIsSyncingPayment] = useState(false);
  const [donationType, setDonationType] = useState<DonationType>("MONEY");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/campaigns`)
      .then((res) => res.json())
      .then((data: Campaign[]) => {
        const activeOnly = data.filter((campaign) => campaign.status === "ACTIVE");
        setCampaigns(activeOnly);
        setSelectedCampaignId((current) => current || activeOnly[0]?.id || "");
      })
      .catch(() => {
        setMessage("Gagal memuat kampanye dari server.");
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
        // Use Snap endpoint to create a Snap token for real Midtrans payment
        const response = await fetch(`${API_URL}/payments/midtrans/snap`, {
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

        const payment = data as PaymentResult & { snapToken?: string; snapScriptUrl?: string; clientKey?: string };
        setPaymentResult(payment);
        setMessage(
          payment.paymentType === "qris"
            ? "QRIS Midtrans Sandbox berhasil dibuat."
            : "Virtual account Midtrans Sandbox berhasil dibuat.",
        );

        // If server returned a Snap token and script url, load snap.js and invoke
        if ((payment as any).snapToken && (payment as any).snapScriptUrl) {
          const token = (payment as any).snapToken as string;
          const scriptSrc = (payment as any).snapScriptUrl as string;
          // load snap script if not present
          if (!document.querySelector(`script[src^="${scriptSrc.split("?")[0]}"]`)) {
            const s = document.createElement("script");
            s.src = scriptSrc;
            s.async = true;
            document.body.appendChild(s);
            s.onload = () => {
              // @ts-ignore
              if ((window as any).snap) {
                // @ts-ignore
                (window as any).snap.pay(token, {
                  onSuccess: () => setMessage("Pembayaran berhasil."),
                  onPending: () => setMessage("Pembayaran menunggu konfirmasi."),
                  onError: () => setMessage("Terjadi kesalahan saat pembayaran."),
                });
              }
            };
          } else {
            // @ts-ignore
            (window as any).snap.pay(token, {
              onSuccess: () => setMessage("Pembayaran berhasil."),
              onPending: () => setMessage("Pembayaran menunggu konfirmasi."),
              onError: () => setMessage("Terjadi kesalahan saat pembayaran."),
            });
          }
          return;
        }

        // fallback: if backend provided paymentUrl (core API), redirect
        if (payment.paymentUrl) {
          window.location.href = payment.paymentUrl;
          return;
        }

        // legacy fallback: open simulator for bank transfer
        if (isBankTransfer(method)) {
          const simulatorWindow = window.open(MIDTRANS_SIMULATORS[method], "_blank", "noopener,noreferrer");
          if (!simulatorWindow) {
            setMessage("Virtual account dibuat. Klik tombol Buka Simulator Midtrans untuk melanjutkan pembayaran sandbox.");
          }
          return;
        }

        router.push(`/donatur/payment?amount=${encodeURIComponent(payment.amount.toString())}&orderId=${encodeURIComponent(payment.orderId)}&method=${encodeURIComponent(payment.method)}`);
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
                if (payment.paymentUrl) {
                  window.location.href = payment.paymentUrl;
                  return;
                }
                if (isBankTransfer(method)) {
                  const simulatorWindow = window.open(MIDTRANS_SIMULATORS[method], "_blank", "noopener,noreferrer");
                  if (!simulatorWindow) {
                    setMessage("Virtual account dibuat. Klik tombol Buka Simulator Midtrans untuk melanjutkan pembayaran sandbox.");
                  }
                  return;
                }
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Eksplorasi Kampanye</h3>
          <Link href="/donatur/kampanye" className="see-all-link">
            Lihat semua →
          </Link>
        </div>
        <div style={{ marginTop: 8 }}>
          <div className="grid">
            {campaigns.slice(0, 3).map((campaign) => {
              const pct = campaign.targetAmount ? Math.min(100, Math.round((campaign.collectedAmount / campaign.targetAmount) * 100)) : 0;
              const img = (campaign as any).photoUrl || `https://picsum.photos/seed/${encodeURIComponent(campaign.id)}/640/360`;
              return (
                <div className="campaign-card-panel" key={campaign.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="campaign-cover" src={img} alt={campaign.title} />
                  <div className="campaign-body card">
                    <h4 style={{ margin: 0 }}>{campaign.title}</h4>
                    <p className="muted" style={{ marginTop: 6 }}>{campaign.disasterType} - {campaign.location}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
                      <small style={{ color: '#7b7b7b' }}>{rupiah(campaign.collectedAmount)}</small>
                      <small className="muted">dari {rupiah(campaign.targetAmount)}</small>
                    </div>
                    <div className="progress-outer">
                      <div className="progress-inner" style={{ width: `${pct}%` }} />
                    </div>
                    <Link
                      href={`/donatur/kampanye/${campaign.id}`}
                      className="donate-now"
                      style={{ textDecoration: 'none' }}
                    >
                      Donasi Sekarang
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
