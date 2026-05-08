import { Campaign, CampaignFormData } from "../types/campaign";

// Menghitung persentase donasi terkumpul
export function progressPercent(campaign: Campaign) {
  if (campaign.targetAmount <= 0) return 0;
  return Math.max(
    0,
    Math.min(
      100,
      Math.round((campaign.collectedAmount / campaign.targetAmount) * 100),
    ),
  );
}
