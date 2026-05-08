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

// Menentukan status visual berdasarkan progress
export function visualStatus(
  campaign: Campaign,
): "active" | "pending" | "closed" {
  if (campaign.status === "CLOSED") return "closed";
  return progressPercent(campaign) >= 65 ? "active" : "pending";
}

// Mapper data untuk form editor
export function toForm(campaign?: Campaign | null): CampaignFormData {
  return {
    title: campaign?.title ?? "",
    description: campaign?.description ?? "",
    disasterType: campaign?.disasterType ?? "",
    location: campaign?.location ?? "",
    targetAmount: campaign?.targetAmount ?? 0,
  };
}
