"use client";

import { useEffect, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";

export function QRScanner({ onScan }: { onScan: (text: string) => void }) {
  const qrElementId = "qr-reader";
  const [errorMessage, setErrorMessage] = useState("");
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let scanner: Html5Qrcode | null = null;
    let isStarted = false;
    let active = true;

    async function stopScanner(currentScanner: Html5Qrcode) {
      try {
        if (isStarted || currentScanner.isScanning) {
          await currentScanner.stop();
        }
      } catch {
        // Scanner may already be stopped when React dev mode remounts the component.
      }

      try {
        currentScanner.clear();
      } catch {
        // Element can already be gone during route changes or hot reloads.
      }
    }

    // Load library secara dinamis
    import("html5-qrcode").then(async (lib) => {
      if (!active) {
        return;
      }

      scanner = new lib.Html5Qrcode(qrElementId);

      try {
        setErrorMessage("");
        const cameras = await lib.Html5Qrcode.getCameras();

        if (!cameras || cameras.length === 0) {
          setErrorMessage("Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.");
          return;
        }

        const preferredCamera = cameras[0];

        await scanner.start(
          preferredCamera.id,
          {
            fps: 8,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.8);
              const boundedSize = Math.max(180, Math.min(size, 280));

              return { width: boundedSize, height: boundedSize };
            },
          },
          (text) => onScanRef.current(text),
          () => {
            // Abaikan error pembacaan frame per frame
          },
        );
        isStarted = true;

        if (!active) {
          await stopScanner(scanner);
        }
      } catch (error) {
        if (!active) {
          return;
        }

        const message = error instanceof Error ? error.message : String(error);
        const isTimeout = message.toLowerCase().includes("timeout");

        setErrorMessage(
          isTimeout
            ? "Kamera belum siap. Tutup aplikasi lain yang memakai kamera, lalu muat ulang halaman."
            : "Tidak bisa mengakses kamera. Izinkan permission kamera di browser.",
        );
      }
    });

    // Cleanup scanner saat komponen dilepas
    return () => {
      active = false;
      if (scanner) {
        void stopScanner(scanner);
      }
    };
  }, []);

  return (
    <div className="card">
      <h3>Pemindai QR Admin Operasional</h3>
      <p className="status-line">Arahkan kamera ke kode QR bantuan.</p>
      {errorMessage ? <p className="status-line" style={{ color: "#ef4444" }}>{errorMessage}</p> : null}
      <div
        id={qrElementId}
        style={{
          marginTop: 10,
          width: "100%",
          maxWidth: 340,
          height: 340,
          borderRadius: 12,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f0f13",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      />
      <style jsx global>{`
        #${qrElementId} video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover;
        }

        #${qrElementId} canvas {
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
}
