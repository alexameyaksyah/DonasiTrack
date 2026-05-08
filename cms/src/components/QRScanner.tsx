import { useEffect } from "react";
import type { Html5QrcodeScanner } from "html5-qrcode";

export function QRScanner({ onScan }: { onScan: (text: string) => void }) {
  const qrElementId = "qr-reader";

  useEffect(() => {
    // Memberikan tipe data yang spesifik, bukan 'any'
    let scanner: Html5QrcodeScanner | null = null;

    // Load library secara dinamis
    import("html5-qrcode").then((lib) => {
      scanner = new lib.Html5QrcodeScanner(qrElementId, { fps: 8, qrbox: 210 }, false);
      
      /** * Memberikan tipe string pada 'err' untuk menghilangkan error 'implicitly any'.
       * Dalam html5-qrcode, error scan biasanya bertipe string (pesan error).
       */
      scanner.render(onScan, (err: string) => { 
        // Scan terus berjalan, kita abaikan error pembacaan frame per frame
      });
    });

    // Cleanup scanner saat komponen dilepas
    return () => {
      if (scanner) {
        scanner.clear().catch((error: unknown) => console.error("Gagal menghentikan scanner:", error));
      }
    };
  }, [onScan]);

  return (
    <div className="card">
      <h3>Pemindai QR Admin Operasional</h3>
      <p className="status-line">Arahkan kamera ke kode QR bantuan.</p>
      <div id={qrElementId} style={{ marginTop: 10 }} />
    </div>
  );
}