// Struktur data input untuk pembuatan kampanye
export type CampaignCreateInput = {
  title: string;
  description: string;
  disasterType: string;
  location: string;
  targetAmount: number;
  status?: CampaignStatus;
};

// Struktur data kampanye yang diterima dari server
export type CampaignStatus = "PENDING" | "ACTIVE" | "INACTIVE";

// Struktur data kampanye lengkap dengan ID dan status
export type Campaign = {
  id: string;
  title: string;
  description: string;
  disasterType: string;
  location: string;
  collectedAmount: number;
  targetAmount: number;
  status: CampaignStatus;
};

// Struktur data untuk filter dan sorting di UI
export type CampaignFormData = {
  title: string;
  description: string;
  disasterType: string;
  location: string;
  targetAmount: number;
  status?: CampaignStatus;
};

// Tipe pendukung UI Dashboard
export type FilterKey = "all" | "active" | "pending" | "inactive";
export type SortBy = "title" | "target" | "collected" | "status";

// Tipe untuk notifikasi toast di UI
export type ToastKind = "success" | "error" | "info";
export type ToastState = { kind: ToastKind; text: string } | null;

// Tipe untuk data chart di dashboard
export type CampaignChartData = {
  title: string;
  collectedAmount: number;
  distributedAmount: number;
};