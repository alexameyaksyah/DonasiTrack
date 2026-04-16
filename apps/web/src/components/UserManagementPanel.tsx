"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { API_URL, authHeaders } from "../lib/api";

const SESSION_TOKEN_KEY = "donasi-track-session-token";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: "DONOR" | "ADMIN";
  createdAt: string;
  blocked: boolean;
  blockedReason: string | null;
  blockedAt: string | null;
  canDelete: boolean;
  isSelf: boolean;
  relations: {
    campaigns: number;
    donations: number;
    verifications: number;
    assignedOperationalShipments: number;
    createdShipments: number;
    trackingEvents: number;
  };
};

function dateLabel(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function UserManagementPanel() {
  const [token] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(SESSION_TOKEN_KEY) || "";
  });
  const [users, setUsers] = useState<UserItem[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState("");

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q));
  }, [query, users]);

  const loadUsers = useCallback(async () => {
    if (!token) {
      setMessage("Sesi admin tidak ditemukan. Silakan login ulang.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: authHeaders(token),
      });

      const payload = (await response.json()) as UserItem[] | { message?: string };
      if (!response.ok) {
        setMessage((payload as { message?: string }).message || "Gagal memuat data pengguna");
        return;
      }

      const userList = payload as UserItem[];
      setUsers(userList);
      setMessage(userList.length > 0 ? `${userList.length} akun dimuat.` : "Belum ada data akun.");
    } catch {
      setMessage("Gagal terhubung ke server API");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function toggleBlock(user: UserItem) {
    if (!token) {
      setMessage("Sesi admin tidak ditemukan. Silakan login ulang.");
      return;
    }

    setProcessingId(user.id);
    try {
      const response = await fetch(`${API_URL}/admin/users/${user.id}/block`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(token),
        },
        body: JSON.stringify({
          blocked: !user.blocked,
          reason: user.blocked ? "Akun dibuka kembali oleh admin" : "Akun diblokir oleh admin",
        }),
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        setMessage(payload.message || "Gagal memperbarui status blokir");
        return;
      }

      setMessage(payload.message || "Status akun diperbarui");
      await loadUsers();
    } catch {
      setMessage("Gagal terhubung ke server API");
    } finally {
      setProcessingId("");
    }
  }

  async function deleteUser(user: UserItem) {
    if (!token) {
      setMessage("Sesi admin tidak ditemukan. Silakan login ulang.");
      return;
    }

    if (!window.confirm(`Hapus akun ${user.name}? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    setProcessingId(user.id);
    try {
      const response = await fetch(`${API_URL}/admin/users/${user.id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });

      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        setMessage(payload.message || "Gagal menghapus akun");
        return;
      }

      setMessage(payload.message || "Akun berhasil dihapus");
      await loadUsers();
    } catch {
      setMessage("Gagal terhubung ke server API");
    } finally {
      setProcessingId("");
    }
  }

  return (
    <div className="verification-console">
      <div className="verification-header">
        <h3>Daftar Akun</h3>
        <div className="verification-header-right">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama/email"
            style={{ maxWidth: 220 }}
          />
          <button className="console-btn info" type="button" onClick={loadUsers} disabled={isLoading}>
            {isLoading ? "Memuat..." : "Refresh"}
          </button>
        </div>
      </div>

      {message ? <p className="status-line">{message}</p> : null}

      {filteredUsers.length === 0 && !isLoading ? (
        <div className="campaign-empty-state" style={{ marginTop: 8 }}>
          <div className="campaign-empty-icon">US</div>
          <h3>Tidak ada akun yang cocok</h3>
          <p className="console-muted">Coba kata kunci lain atau refresh data.</p>
        </div>
      ) : null}

      <div className="verification-list">
        {filteredUsers.map((user) => {
          const relationCount =
            user.relations.campaigns +
            user.relations.donations +
            user.relations.verifications +
            user.relations.assignedOperationalShipments +
            user.relations.createdShipments +
            user.relations.trackingEvents;

          return (
            <article className="verification-item" key={user.id}>
              <div className="verification-avatar">{user.name.slice(0, 2).toUpperCase()}</div>

              <div className="verification-meta">
                <h4>{user.name}</h4>
                <p>{user.email}</p>
                <p className="verification-campaign">Role: {user.role} • Dibuat: {dateLabel(user.createdAt)}</p>
              </div>

              <div className="verification-amount-wrap">
                <span className={`verification-pending-chip ${user.blocked ? "danger" : "ok"}`}>
                  {user.blocked ? "DIBLOKIR" : "AKTIF"}
                </span>
                <p className="console-muted">Relasi data: {relationCount}</p>
                {user.blocked ? <p className="console-muted">Blokir: {dateLabel(user.blockedAt)}</p> : null}
                {user.blockedReason ? <p className="console-muted">Alasan: {user.blockedReason}</p> : null}
              </div>

              <div className="verification-actions">
                <button
                  className={`console-btn ${user.blocked ? "info" : "danger"}`}
                  type="button"
                  onClick={() => void toggleBlock(user)}
                  disabled={processingId === user.id || user.isSelf || user.role === "ADMIN"}
                >
                  {processingId === user.id ? "Memproses..." : user.blocked ? "Buka Blokir" : "Blokir"}
                </button>
                <button
                  className="console-btn danger"
                  type="button"
                  onClick={() => void deleteUser(user)}
                  disabled={processingId === user.id || !user.canDelete || user.isSelf || user.role === "ADMIN"}
                >
                  {processingId === user.id ? "Memproses..." : "Hapus"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
