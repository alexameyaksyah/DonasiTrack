export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) {
        message = payload.message;
      }
    } catch {
      // Ignore non-JSON payload and keep default message.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}
