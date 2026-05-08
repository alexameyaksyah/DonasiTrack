import { useState, useEffect } from "react";
import { QueueItem } from "../types/logistics";

const QUEUE_KEY = "admin-operational-tracking-queue";

export function useOfflineQueue() {
  // Inisialisasi jumlah antrean dari LocalStorage
  const [queueCount, setQueueCount] = useState(() => {
    if (typeof window !== "undefined") {
      const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
      return queue.length;
    }
    return 0;
  });

  // Menyimpan data ke LocalStorage jika offline
  const addToQueue = (item: QueueItem) => {
    const queue = getQueue();
    queue.push(item);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    setQueueCount(queue.length);
  };

  // Mengambil seluruh daftar antrean
  const getQueue = (): QueueItem[] => JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  
  // Menghapus/update antrean setelah sinkronisasi
  const clearQueue = (remaining: QueueItem[]) => {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    setQueueCount(remaining.length);
  };

  return { queueCount, addToQueue, getQueue, clearQueue };
}