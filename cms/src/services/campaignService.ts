import { API_URL, authHeaders } from "../lib/api";
import { CampaignCreateInput } from "../types/campaign";

// Mengirim data kampanye baru ke server melalui API
export async function createCampaign(body: CampaignCreateInput, token: string) {
  const response = await fetch(`${API_URL}/campaigns`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Gagal membuat kampanye");
  }

  return response.json();
}