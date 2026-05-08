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
