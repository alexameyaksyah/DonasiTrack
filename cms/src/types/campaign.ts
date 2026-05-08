// Struktur data input untuk pembuatan kampanye
export type CampaignCreateInput = {
  title: string;
  description: string;
  disasterType: string;
  location: string;
  targetAmount: number;
};

// Struktur data kampanye yang diterima dari server
export type CampaignStatus = "OPEN" | "CLOSED";

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
};
