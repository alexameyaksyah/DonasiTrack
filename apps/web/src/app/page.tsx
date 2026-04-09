import Link from "next/link";

export default function Home() {
  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <div className="brand">Donasi Track</div>
          <nav className="nav-links">
            <Link className="nav-chip" href="/admin">
              Dashboard Admin
            </Link>
            <Link className="nav-chip" href="/donatur">
              Interface Donatur
            </Link>
            <Link className="nav-chip" href="/admin-operasional">
              Operasional Admin
            </Link>
          </nav>
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <div className="hero-card">
            <span className="badge">MVP Siap Demo</span>
            <h1>Transparansi Donasi Bencana Dari Gudang Sampai Lokasi</h1>
            <p>
              Platform ini menggabungkan API backend, dashboard admin SSR, serta interface donatur-admin
              dengan tracking real-time untuk memastikan bantuan benar-benar sampai.
            </p>
            <div className="grid">
              <div className="card">
                <h3>API & Database</h3>
                <p className="muted">JWT Auth, campaign, donasi, inventaris, logistik, tracking, dan Swagger docs.</p>
              </div>
              <div className="card">
                <h3>Panel Admin SSR</h3>
                <p className="muted">Statistik, verifikasi donasi, manajemen kampanye, dan alokasi logistik.</p>
              </div>
              <div className="card">
                <h3>Aplikasi Lapangan</h3>
                <p className="muted">Timeline tracking, pemindaian QR, upload bukti foto, geolocation, dan caching lokal.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
