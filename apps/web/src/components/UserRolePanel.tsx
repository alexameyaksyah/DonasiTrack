"use client";

import { useState } from "react";
import { API_URL, authHeaders } from "../lib/api";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: "DONOR" | "ADMIN";
  createdAt: string;
};

export function UserRolePanel() {
  const [token, setToken] = useState("");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadUsers() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: authHeaders(token),
      });

      const data = (await response.json()) as UserItem[] | { message?: string };
      if (!response.ok || !Array.isArray(data)) {
        const errorMessage = !Array.isArray(data) && data.message ? data.message : "Gagal memuat daftar user";
        setMessage(errorMessage);
        return;
      }

      setUsers(data);
      setMessage(`Berhasil memuat ${data.length} user`);
    } catch {
      setMessage("Tidak dapat terhubung ke API");
    } finally {
      setLoading(false);
    }
  }

  async function updateRole(userId: string, role: "DONOR" | "ADMIN") {
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(token),
        },
        body: JSON.stringify({ role }),
      });

      const data = (await response.json()) as { message?: string; user?: UserItem };
      if (!response.ok) {
        setMessage(data.message || "Gagal memperbarui role user");
        return;
      }

      setUsers((prev) => prev.map((item) => (item.id === userId ? { ...item, role } : item)));
      setMessage(data.message || "Role user berhasil diperbarui");
    } catch {
      setMessage("Tidak dapat terhubung ke API");
    }
  }

  return (
    <div className="card">
      <h3>Kelola Role User</h3>
      <p className="muted" style={{ marginTop: 8 }}>
        Gunakan token admin untuk melihat user, lalu ubah role DONOR/ADMIN langsung dari dashboard.
      </p>

      <div className="form" style={{ marginTop: 10 }}>
        <input
          placeholder="JWT Admin"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          required
        />
        <button className="btn brand" onClick={loadUsers} type="button" disabled={loading}>
          {loading ? "Memuat..." : "Muat User"}
        </button>
      </div>

      {message ? <p className="muted" style={{ marginTop: 8 }}>{message}</p> : null}

      <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
        {users.map((user) => (
          <div className="panel" key={user.id}>
            <strong>{user.name}</strong>
            <p className="muted">{user.email}</p>
            <p className="muted">ID: {user.id}</p>
            <p className="muted">Dibuat: {new Date(user.createdAt).toLocaleString()}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button
                className="btn"
                type="button"
                disabled={user.role === "DONOR"}
                onClick={() => updateRole(user.id, "DONOR")}
              >
                Jadikan DONOR
              </button>
              <button
                className="btn secondary"
                type="button"
                disabled={user.role === "ADMIN"}
                onClick={() => updateRole(user.id, "ADMIN")}
              >
                Jadikan ADMIN
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
