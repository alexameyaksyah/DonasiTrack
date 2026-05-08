"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

// Import Utilities & Types
import { rupiah } from "../lib/format";
import { progressPercent, visualStatus, toForm } from "../lib/campaign-utils";
import {
  Campaign,
  CampaignFormData,
  FilterKey,
  SortBy,
  ToastKind,
  ToastState,
} from "../types/campaign";

// Import Services & Hooks
import * as campaignService from "../services/campaignService";
import { useCampaignManagement } from "../hooks/useCampaignManagement";
import { authHeaders } from "../lib/api";

const SESSION_TOKEN_KEY = "donasi-track-session-token";
const SESSION_USER_KEY = "donasi-track-session-user";
const PAGE_SIZE = 6;

export function CampaignManagementConsole() {
  const router = useRouter();

  // --- STATE UTAMA (Data Mentah) ---
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // --- STATE UI (Modal, Toast, Loading Action) ---
  const [toast, setToast] = useState<ToastState>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState("");
  const [isBulkClosing, setIsBulkClosing] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Campaign | null>(null);
  const [form, setForm] = useState<CampaignFormData>(toForm());

  // --- MENGGUNAKAN CUSTOM HOOK (The Brain) ---
  const {
    filter,
    setFilter,
    search,
    setSearch,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    selectedIds,
    setSelectedIds,
    currentPage,
    setCurrentPage,
    processedData,
  } = useCampaignManagement(campaigns);

  // --- HANDLERS DASAR ---
  const notify = useCallback((kind: ToastKind, text: string) => {
    setToast({ kind, text });
  }, []);

  const resetExpiredSession = useCallback(
    (message?: string) => {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      localStorage.removeItem(SESSION_USER_KEY);
      setToken("");
      notify("error", message || "Sesi admin berakhir, silakan login ulang.");
      router.push("/auth");
    },
    [notify, router],
  );

  const loadCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await campaignService.fetchCampaigns();
      setCampaigns(data);
    } catch {
      notify("error", "Gagal memuat data kampanye.");
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  // --- EFFECTS ---
  useEffect(() => {
    setToken(localStorage.getItem(SESSION_TOKEN_KEY) || "");
  }, []);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  useEffect(() => {
    if (toast) {
      const timer = window.setTimeout(() => setToast(null), 3000);
      return () => window.clearTimeout(timer);
    }
  }, [toast]);

  // Reset pagination saat filter/search berubah
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [filter, search, setCurrentPage, setSelectedIds]);

  // --- LOGIKA PERHITUNGAN DASHBOARD ---
  const counts = useMemo(
    () => ({
      all: campaigns.length,
      active: campaigns.filter((c) => visualStatus(c) === "active").length,
      pending: campaigns.filter((c) => visualStatus(c) === "pending").length,
      closed: campaigns.filter((c) => visualStatus(c) === "closed").length,
    }),
    [campaigns],
  );

  const totalPages = Math.max(1, Math.ceil(processedData.length / PAGE_SIZE));
  const pagedCampaigns = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return processedData.slice(start, start + PAGE_SIZE);
  }, [currentPage, processedData]);

  // --- SELECTION HANDLERS ---
  const selectedCount = selectedIds.length;
  const selectedOnPageCount = pagedCampaigns.filter((item) =>
    selectedIds.includes(item.id),
  ).length;
  const allPageSelected =
    pagedCampaigns.length > 0 && selectedOnPageCount === pagedCampaigns.length;

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  }

  function toggleSelectAllOnPage() {
    if (allPageSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !pagedCampaigns.some((item) => item.id === id)),
      );
    } else {
      const pageIds = pagedCampaigns.map((item) => item.id);
      setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
    }
  }

  // --- CRUD & BULK ACTIONS ---
  async function saveCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return notify("error", "Token admin tidak ditemukan.");

    setIsSaving(true);
    try {
      if (editing) {
        await campaignService.updateCampaign(editing.id, form, token);
      } else {
        await campaignService.createCampaign(form, token);
      }
      notify(
        "success",
        editing
          ? "Kampanye berhasil diupdate."
          : "Kampanye baru berhasil dibuat.",
      );
      setEditorOpen(false);
      await loadCampaigns();
    } catch (err) {
      // Hapus ': any', biarkan TypeScript menganggapnya 'unknown'
      // Lakukan pengecekan apakah 'err' adalah objek Error resmi
      const errorMessage =
        err instanceof Error ? err.message : "Gagal menyimpan data.";
      notify("error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDeleteCampaign() {
    if (!deleteCandidate || !token) return;
    setIsDeletingId(deleteCandidate.id);
    try {
      await campaignService.deleteCampaign(deleteCandidate.id, token);
      notify("success", "Kampanye berhasil dihapus.");
      setDeleteCandidate(null);
      await loadCampaigns();
    } catch {
      notify("error", "Gagal menghapus kampanye.");
    } finally {
      setIsDeletingId("");
    }
  }

  async function bulkCloseSelected() {
    if (!token) return;
    const targets = campaigns.filter(
      (c) => selectedIds.includes(c.id) && c.status === "OPEN",
    );
    if (targets.length === 0)
      return notify("info", "Tidak ada kampanye OPEN yang bisa ditutup.");

    setIsBulkClosing(true);
    try {
      const results = await Promise.allSettled(
        targets.map((c) => campaignService.closeCampaign(c.id, token)),
      );
      notify("success", "Proses penutupan massal selesai.");
      await loadCampaigns();
      setSelectedIds([]);
    } finally {
      setIsBulkClosing(false);
    }
  }

  async function bulkDeleteSelected() {
    if (!token || selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      await Promise.allSettled(
        selectedIds.map((id) => campaignService.deleteCampaign(id, token)),
      );
      notify("success", "Proses penghapusan massal selesai.");
      await loadCampaigns();
      setSelectedIds([]);
    } finally {
      setIsBulkDeleting(false);
    }
  }

  // --- RENDER ---
  return (
    <section className="console-surface">
      {/* TOOLBAR */}
      <div className="campaign-toolbar">
        <h2>Manajemen Kampanye</h2>
        <button
          className="console-btn success"
          onClick={() => {
            setEditing(null);
            setForm(toForm());
            setEditorOpen(true);
          }}
        >
          + Buat Kampanye Baru
        </button>
      </div>

      {/* TABS */}
      <div className="campaign-tabs">
        {(["all", "active", "pending", "closed"] as FilterKey[]).map((key) => (
          <button
            key={key}
            className={`campaign-tab ${filter === key ? "active" : ""}`}
            onClick={() => setFilter(key)}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)} ({counts[key]})
          </button>
        ))}
      </div>

      {/* SEARCH & SORT */}
      <div className="campaign-search-row">
        <input
          className="campaign-search-input"
          placeholder="Cari kampanye, kategori, atau lokasi"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="campaign-sort-controls">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
          >
            <option value="title">Sort Nama</option>
            <option value="target">Sort Target</option>
            <option value="collected">Sort Terkumpul</option>
            <option value="status">Sort Status</option>
          </select>
          <button
            className="campaign-page-btn"
            onClick={() =>
              setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))
            }
          >
            {sortDir === "asc" ? "Asc" : "Desc"}
          </button>
        </div>
      </div>

      {/* BULK BAR */}
      <div className="campaign-bulk-bar">
        <span>{selectedCount} dipilih</span>
        <button
          className="console-btn warning"
          onClick={bulkCloseSelected}
          disabled={selectedCount === 0 || isBulkClosing}
        >
          {isBulkClosing ? "Closing..." : "Close Terpilih"}
        </button>
        <button
          className="console-btn danger"
          onClick={bulkDeleteSelected}
          disabled={selectedCount === 0 || isBulkDeleting}
        >
          {isBulkDeleting ? "Menghapus..." : "Hapus Terpilih"}
        </button>
      </div>

      {isLoading ? (
        <p className="console-muted">Memuat data kampanye...</p>
      ) : (
        <>
          {campaigns.length === 0 ? (
            <div className="campaign-empty-state">
              <div className="campaign-empty-icon">+</div>
              <h3>Belum ada kampanye</h3>
              <p className="console-muted">Mulai buat kampanye pertama untuk mengaktifkan dashboard penggalangan.</p>
              <button className="console-btn success" type="button" onClick={openCreate}>
                Buat Kampanye Baru
              </button>
            </div>
          ) : null}

          <div className="console-table-wrap" style={{ marginTop: 8 }}>
            <table className="console-table">
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAllOnPage} />
                  </th>
                  <th>Nama Kampanye</th>
                  <th>Kategori</th>
                  <th>Target Dana</th>
                  <th>Terkumpul</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pagedCampaigns.map((campaign) => {
                  const status = visualStatus(campaign);
                  const progress = progressPercent(campaign);
                  const isSelected = selectedIds.includes(campaign.id);

                  return (
                    <tr key={campaign.id}>
                      <td>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelectOne(campaign.id)} />
                      </td>
                      <td>
                        <strong>{campaign.title}</strong>
                      </td>
                      <td>
                        <span className="campaign-chip">{campaign.disasterType}</span>
                      </td>
                      <td>{rupiah(campaign.targetAmount)}</td>
                      <td>{rupiah(campaign.collectedAmount)}</td>
                      <td>
                        <div className="console-inline-progress">
                          <span
                            style={{
                              width: `${progress}%`,
                              background:
                                status === "active"
                                  ? "linear-gradient(90deg, #20be93 0%, #3fd1a6 100%)"
                                  : status === "pending"
                                    ? "linear-gradient(90deg, #e7aa38 0%, #f7bf5e 100%)"
                                    : "linear-gradient(90deg, #6f7890 0%, #8a93ad 100%)",
                            }}
                          />
                        </div>
                      </td>
                      <td>
                        <span className={`console-status ${status === "active" ? "ok" : status === "pending" ? "pending" : "closed"}`}>
                          {status === "active" ? "Active" : status === "pending" ? "Pending" : "Closed"}
                        </span>
                      </td>
                      <td>
                        <div className="campaign-actions">
                          <button className="console-btn info" onClick={() => openEdit(campaign)} type="button">
                            Edit
                          </button>
                          <button
                            className="console-btn danger"
                            onClick={() => requestDelete(campaign)}
                            type="button"
                            disabled={isDeletingId === campaign.id}
                          >
                            {isDeletingId === campaign.id ? "Menghapus..." : "Hapus"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {campaigns.length > 0 && pagedCampaigns.length === 0 ? (
            <p className="campaign-empty">Tidak ada kampanye yang cocok dengan filter atau pencarian saat ini.</p>
          ) : null}

          <div className="campaign-pagination">
            <button
              className="campaign-page-btn"
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Sebelumnya
            </button>
            <span>
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              className="campaign-page-btn"
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Berikutnya
            </button>
          </div>
        </>
      )}

      {editorOpen ? (
        <div className="campaign-modal-backdrop" role="dialog" aria-modal="true">
          <div className="campaign-modal">
            <div className="campaign-toolbar">
              <h3>{editing ? "Edit Kampanye" : "Buat Kampanye Baru"}</h3>
              <button className="console-btn neutral" onClick={closeEditor} type="button">
                Tutup
              </button>
            </div>

            <form className="form" onSubmit={saveCampaign}>
              <input
                placeholder="Judul kampanye"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                required
                minLength={3}
              />
              <textarea
                placeholder="Deskripsi"
                rows={3}
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                required
                minLength={10}
              />
              <input
                placeholder="Kategori bencana"
                value={form.disasterType}
                onChange={(event) => setForm((prev) => ({ ...prev, disasterType: event.target.value }))}
                required
                minLength={3}
              />
              <input
                placeholder="Lokasi"
                value={form.location}
                onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                required
                minLength={3}
              />
              <input
                type="number"
                placeholder="Target dana"
                value={form.targetAmount || ""}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    targetAmount: Number(event.target.value),
                  }))
                }
                required
                min={1}
              />

              <button className="btn success" type="submit" disabled={isSaving}>
                {isSaving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Buat Kampanye"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {deleteCandidate ? (
        <div className="campaign-modal-backdrop" role="dialog" aria-modal="true">
          <div className="campaign-modal">
            <h3>Konfirmasi Hapus</h3>
            <p className="console-muted">
              Apakah kamu yakin ingin menghapus kampanye <strong>{deleteCandidate.title}</strong>? Aksi ini tidak bisa dibatalkan.
            </p>
            <div className="campaign-actions" style={{ marginTop: 14 }}>
              <button className="console-btn neutral" onClick={closeDeleteModal} type="button" disabled={isDeletingId === deleteCandidate.id}>
                Batal
              </button>
              <button className="console-btn danger" onClick={confirmDeleteCampaign} type="button" disabled={isDeletingId === deleteCandidate.id}>
                {isDeletingId === deleteCandidate.id ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? <div className={`campaign-toast ${toast.kind}`}>{toast.text}</div> : null}
    </section>
  );
}
