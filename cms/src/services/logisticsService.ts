import { API_URL, authHeaders } from "../lib/api";
import { QueueItem } from "../types/logistics";

/** Mengirim data tracking ke server melalui API */
export async function sendTrackingData(body: QueueItem, authToken: string) {
  const response = await fetch(`${API_URL}/logistics/${body.shipmentId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(authToken),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error("Gagal mengirim data");
  return response.json();
}