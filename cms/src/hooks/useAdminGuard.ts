"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "DONOR" | "ADMIN";
};

type SessionState = {
  token: string;
  user: SessionUser | null;
};

const SESSION_TOKEN_KEY = "donasi-track-session-token";
const SESSION_USER_KEY = "donasi-track-session-user";

function readSession(): SessionState {
  if (typeof window === "undefined") {
    return { token: "", user: null };
  }

  const token = localStorage.getItem(SESSION_TOKEN_KEY) || "";
  const userRaw = localStorage.getItem(SESSION_USER_KEY);

  if (!token || !userRaw) {
    return { token: "", user: null };
  }

  try {
    return { token, user: JSON.parse(userRaw) as SessionUser };
  } catch {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
    return { token: "", user: null };
  }
}

export function useAdminGuard() {
  const router = useRouter();
  const [session] = useState<SessionState>(() => readSession());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!session.token || !session.user) {
      router.replace("/auth");
      return;
    }

    if (session.user.role !== "ADMIN") {
      router.replace("/donatur");
      return;
    }

    setReady(true);
  }, [router, session.token, session.user]);

  return { session, ready };
}
