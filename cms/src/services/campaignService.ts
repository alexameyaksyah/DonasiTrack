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

// Menghapus kampanye tunggal
export async function deleteCampaign(id: string, token: string) {
  const res = await fetch(`${API_URL}/campaigns/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Gagal menghapus kampanye");
}

// Menutup kampanye (Set status ke CLOSED)
export async function closeCampaign(id: string, token: string) {
  const res = await fetch(`${API_URL}/campaigns/${id}/close`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Gagal menutup kampanye");
}
