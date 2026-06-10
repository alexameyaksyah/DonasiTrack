/**
 * Hapus semua data dummy dari localStorage
 * Hanya pertahankan: session token dan user account info
 */
export function clearDummyData() {
  if (typeof window === "undefined") return;

  const keysToKeep = [
    "donasi-track-session-token",
    "donasi-track-session-user",
  ];

  const keysToRemove: string[] = [];

  // Iterate semua localStorage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !keysToKeep.includes(key)) {
      keysToRemove.push(key);
    }
  }

  // Hapus semua keys yang tidak perlu
  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
  });

  console.log(`Cleared ${keysToRemove.length} dummy data keys from localStorage`);
}

/**
 * Clear semua localStorage (gunakan hanya di development/reset)
 */
export function clearAllStorage() {
  if (typeof window === "undefined") return;
  localStorage.clear();
  console.log("All localStorage cleared");
}
