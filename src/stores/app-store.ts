"use client";

import { create } from "zustand";
import { parseHash, buildHash, type PublicUser } from "@/types";

interface AppState {
  // current parsed route
  hash: string;
  segments: string[];
  query: Record<string, string>;
  // auth
  user: PublicUser | null;
  authLoading: boolean;
  // helpers
  setHashFromWindow: () => void;
  navigate: (segments: string[], query?: Record<string, string | undefined>) => void;
  setUser: (u: PublicUser | null) => void;
  setAuthLoading: (b: boolean) => void;
  refreshUser: () => Promise<void>;
}

function readHash(): string {
  if (typeof window === "undefined") return "";
  return window.location.hash.replace(/^#/, "");
}

export const useAppStore = create<AppState>((set, get) => ({
  hash: "",
  segments: [],
  query: {},
  user: null,
  authLoading: true,
  setHashFromWindow: () => {
    const h = readHash();
    const parsed = parseHash(h);
    set({ hash: parsed.hash, segments: parsed.segments, query: parsed.query });
  },
  navigate: (segments, query) => {
    const newHash = buildHash(segments, query);
    if (typeof window !== "undefined") {
      window.location.hash = newHash;
    }
    const parsed = parseHash(newHash);
    set({ hash: parsed.hash, segments: parsed.segments, query: parsed.query });
  },
  setUser: (u) => set({ user: u }),
  setAuthLoading: (b) => set({ authLoading: b }),
  refreshUser: async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) {
        set({ user: null });
        return;
      }
      const data = await res.json();
      set({ user: data.user ?? null });
    } catch {
      set({ user: null });
    } finally {
      set({ authLoading: false });
    }
  },
}));

// Helper hook for components to read the current route key
export function useRouteKey(): string {
  const segments = useAppStore((s) => s.segments);
  return segments.join("/");
}
