import { useState } from "react";

export function useGeolocation() {
  const [coords, setCoords] = useState({ latitude: undefined as number | undefined, longitude: undefined as number | undefined });
  const [isGeoLoading, setIsGeoLoading] = useState(false);

  function captureLocation(callback?: (msg: string) => void) {
    setIsGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        callback?.("Lokasi berhasil diambil");
        setIsGeoLoading(false);
      },
      () => {
        callback?.("Gagal mengambil lokasi");
        setIsGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return { ...coords, isGeoLoading, captureLocation };
}