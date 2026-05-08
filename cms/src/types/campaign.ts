// Struktur data input untuk pembuatan kampanye
export type CampaignCreateInput = {
  title: string;
  description: string;
  disasterType: string;
  location: string;
  targetAmount: number;
};