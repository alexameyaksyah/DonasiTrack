"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { API_URL, authHeaders } from "../lib/api";
import { rupiah } from "../lib/format";

type Campaign = {
  id: string;
  title: string;
  description: string;
  disasterType: string;
  location: string;
  collectedAmount: number;
  targetAmount: number;
  status: "OPEN" | "CLOSED";
};

type CampaignFormData = {
  title: string;
  description: string;
  disasterType: string;
  location: string;
  targetAmount: number;
};

type FilterKey = "all" | "active" | "pending" | "closed";
type ToastKind = "success" | "error" | "info";
type ToastState = { kind: ToastKind; text: string } | null;
type SortBy = "title" | "target" | "collected" | "status";

const SESSION_TOKEN_KEY = "donasi-track-session-token";
const PAGE_SIZE = 6;

function progressPercent(campaign: Campaign) {
  if (campaign.targetAmount <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((campaign.collectedAmount / campaign.targetAmount) * 100)));
}

function visualStatus(campaign: Campaign): "active" | "pending" | "closed" {
  if (campaign.status === "CLOSED") {
    return "closed";
  }

  return progressPercent(campaign) >= 65 ? "active" : "pending";
}

function toForm(campaign?: Campaign): CampaignFormData {
  if (!campaign) {
    return {
      title: "",
      description: "",
      disasterType: "",
      location: "",
      targetAmount: 0,
    };
  }

  return {
    title: campaign.title,
    description: campaign.description,
    disasterType: campaign.disasterType,
    location: campaign.location,
    targetAmount: campaign.targetAmount,
  };
}

export function CampaignManagementConsole() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("title");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [token, setToken] = useState("");
  const [toast, setToast] = useState<ToastState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState("");
  const [isBulkClosing, setIsBulkClosing] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Campaign | null>(null);
  const [form, setForm] = useState<CampaignFormData>(toForm());

  const notify = useCallback((kind: ToastKind, text: string) => {
    setToast({ kind, text });
  }, []);

  const loadCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/campaigns`, { cache: "no-store" });
      const payload = (await response.json()) as Campaign[];
      if (!response.ok) {
        notify("error", "Gagal memuat data kampanye.");
        return;
      }

      setCampaigns(payload);
    } catch {
      notify("error", "Gagal terhubung ke server API.");
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    setToken(localStorage.getItem(SESSION_TOKEN_KEY) || "");
  }, []);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [filter, search]);

  const counts = useMemo(() => {
    const active = campaigns.filter((item) => visualStatus(item) === "active").length;
    const pending = campaigns.filter((item) => visualStatus(item) === "pending").length;
    const closed = campaigns.filter((item) => visualStatus(item) === "closed").length;

    return {
      all: campaigns.length,
      active,
      pending,
      closed,
    };
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    if (filter === "all") {
      return campaigns;
    }

    return campaigns.filter((item) => visualStatus(item) === filter);
  }, [campaigns, filter]);

  const searchedCampaigns = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return filteredCampaigns;
    }

    return filteredCampaigns.filter((item) => {
      return (
        item.title.toLowerCase().includes(query) ||
        item.disasterType.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query)
      );
    });
  }, [filteredCampaigns, search]);

  const sortedCampaigns = useMemo(() => {
    const sorted = [...searchedCampaigns];

    sorted.sort((a, b) => {
      let value = 0;

      if (sortBy === "title") {
        value = a.title.localeCompare(b.title);
      } else if (sortBy === "target") {
        value = a.targetAmount - b.targetAmount;
      } else if (sortBy === "collected") {
        value = a.collectedAmount - b.collectedAmount;
      } else {
        value = visualStatus(a).localeCompare(visualStatus(b));
      }

      return sortDir === "asc" ? value : -value;
    });

    return sorted;
  }, [searchedCampaigns, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedCampaigns.length / PAGE_SIZE));
  const pagedCampaigns = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedCampaigns.slice(start, start + PAGE_SIZE);
  }, [currentPage, sortedCampaigns]);

  const selectedCount = selectedIds.length;
  const selectedOnPageCount = pagedCampaigns.filter((item) => selectedIds.includes(item.id)).length;
  const canSelectAllOnPage = pagedCampaigns.length > 0;
  const allPageSelected = canSelectAllOnPage && selectedOnPageCount === pagedCampaigns.length;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function toggleSortDir() {
    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  }

  function toggleSelectAllOnPage() {
    if (!canSelectAllOnPage) {
      return;
    }

    if (allPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pagedCampaigns.some((item) => item.id === id)));
      return;
    }

    const pageIds = pagedCampaigns.map((item) => item.id);
    setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
  }

  async function bulkCloseSelected() {
    if (!token) {
      notify("error", "Token admin tidak ditemukan. Silakan login ulang.");
      return;
    }

    const targets = campaigns.filter((item) => selectedIds.includes(item.id) && item.status === "OPEN");
    if (targets.length === 0) {
      notify("info", "Tidak ada kampanye OPEN yang bisa ditutup.");
      return;
    }

    setIsBulkClosing(true);

    try {
      const results = await Promise.allSettled(
        targets.map((item) =>
          fetch(`${API_URL}/campaigns/${item.id}/close`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders(token),
            },
          }),
        ),
      );

      const successCount = results.filter((result) => result.status === "fulfilled" && result.value.ok).length;
      const failedCount = results.length - successCount;

      notify(
        failedCount > 0 ? "info" : "success",
        failedCount > 0
          ? `${successCount} kampanye ditutup, ${failedCount} gagal.`
          : `${successCount} kampanye berhasil ditutup.`,
      );

      await loadCampaigns();
      setSelectedIds([]);
    } catch {
      notify("error", "Gagal menutup kampanye terpilih.");
    } finally {
      setIsBulkClosing(false);
    }
  }

  async function bulkDeleteSelected() {
    if (!token) {
      notify("error", "Token admin tidak ditemukan. Silakan login ulang.");
      return;
    }

    if (selectedIds.length === 0) {
      return;
    }

    setIsBulkDeleting(true);

    try {
      const results = await Promise.allSettled(
        selectedIds.map((id) =>
          fetch(`${API_URL}/campaigns/${id}`, {
            method: "DELETE",
            headers: {
              ...authHeaders(token),
            },
          }),
        ),
      );

      const successCount = results.filter((result) => result.status === "fulfilled" && result.value.ok).length;
      const failedCount = results.length - successCount;

      notify(
        failedCount > 0 ? "info" : "success",
        failedCount > 0
          ? `${successCount} kampanye dihapus, ${failedCount} gagal.`
          : `${successCount} kampanye berhasil dihapus.`,
      );

      await loadCampaigns();
      setSelectedIds([]);
    } catch {
      notify("error", "Gagal menghapus kampanye terpilih.");
    } finally {
      setIsBulkDeleting(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(toForm());
    setEditorOpen(true);
  }

  function openEdit(campaign: Campaign) {
    setEditing(campaign);
    setForm(toForm(campaign));
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditing(null);
    setForm(toForm());
  }

  async function saveCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      notify("error", "Token admin tidak ditemukan. Silakan login ulang.");
      return;
    }

    setIsSaving(true);

    const method = editing ? "PUT" : "POST";
    const endpoint = editing ? `${API_URL}/campaigns/${editing.id}` : `${API_URL}/campaigns`;

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(token),
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          disasterType: form.disasterType,
          location: form.location,
          targetAmount: Number(form.targetAmount),
        }),
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        notify("error", data.message || "Gagal menyimpan kampanye.");
        return;
      }

      notify("success", editing ? "Kampanye berhasil diupdate." : "Kampanye baru berhasil dibuat.");
      closeEditor();
      await loadCampaigns();
    } catch {
      notify("error", "Gagal terhubung ke server API.");
    } finally {
      setIsSaving(false);
    }
  }

  function requestDelete(campaign: Campaign) {
    setDeleteCandidate(campaign);
  }

  function closeDeleteModal() {
    setDeleteCandidate(null);
  }

  async function confirmDeleteCampaign() {
    if (!deleteCandidate) {
      return;
    }

    if (!token) {
      notify("error", "Token admin tidak ditemukan. Silakan login ulang.");
      return;
    }

    setIsDeletingId(deleteCandidate.id);

    try {
      const response = await fetch(`${API_URL}/campaigns/${deleteCandidate.id}`, {
        method: "DELETE",
        headers: {
          ...authHeaders(token),
        },
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        notify("error", payload.message || "Gagal menghapus kampanye.");
        return;
      }

      notify("success", "Kampanye berhasil dihapus.");
      closeDeleteModal();
      await loadCampaigns();
    } catch {
      notify("error", "Gagal terhubung ke server API.");
    } finally {
      setIsDeletingId("");
    }
  }

  return (
    <section className="console-surface">
      <div className="campaign-toolbar">
        <h2>Manajemen Kampanye</h2>
        <button className="console-btn success" onClick={openCreate} type="button">
          + Buat Kampanye Baru
        </button>
      </div>

      <div className="campaign-tabs">
        <button className={`campaign-tab ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")} type="button">
          Semua ({counts.all})
        </button>
        <button className={`campaign-tab ${filter === "active" ? "active" : ""}`} onClick={() => setFilter("active")} type="button">
          Aktif ({counts.active})
        </button>
        <button className={`campaign-tab ${filter === "pending" ? "active" : ""}`} onClick={() => setFilter("pending")} type="button">
          Pending ({counts.pending})
        </button>
        <button className={`campaign-tab ${filter === "closed" ? "active" : ""}`} onClick={() => setFilter("closed")} type="button">
          Closed ({counts.closed})
        </button>
      </div>

      <div className="campaign-search-row">
        <input
          className="campaign-search-input"
          placeholder="Cari kampanye, kategori, atau lokasi"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="campaign-sort-controls">
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)}>
            <option value="title">Sort Nama</option>
            <option value="target">Sort Target</option>
            <option value="collected">Sort Terkumpul</option>
            <option value="status">Sort Status</option>
          </select>
          <button className="campaign-page-btn" type="button" onClick={toggleSortDir}>
            {sortDir === "asc" ? "Asc" : "Desc"}
          </button>
        </div>
      </div>

      <div className="campaign-bulk-bar">
        <span>{selectedCount} dipilih</span>
        <button className="console-btn warning" type="button" onClick={bulkCloseSelected} disabled={selectedCount === 0 || isBulkClosing}>
          {isBulkClosing ? "Closing..." : "Close Terpilih"}
        </button>
        <button className="console-btn danger" type="button" onClick={bulkDeleteSelected} disabled={selectedCount === 0 || isBulkDeleting}>
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
