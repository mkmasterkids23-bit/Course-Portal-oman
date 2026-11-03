"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * useApiFetch — fetch with manual re-run support.
 */
export function useApiFetch<T>(
  url: string | null,
  options?: { skip?: boolean }
): ApiState<T> & { refetch: () => void; setData: (d: T | null) => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(!options?.skip);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!url || options?.skip) {
      return;
    }
    let cancelled = false;
    // Standard data-fetching pattern: synchronously mark loading + clear error
    // before kicking off the async request. The set-state-in-effect rule is
    // intentionally suppressed here because the subsequent state updates all
    // happen inside async callbacks (then/catch/finally), not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    fetch(url, { cache: "no-store", credentials: "include" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
        if (!cancelled) setData(json);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message || "Network error");
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [url, nonce]);

  return { data, loading, error, refetch, setData };
}

/**
 * apiPost — POST/PUT/DELETE helper with JSON body.
 */
export async function apiPost<T = any>(
  url: string,
  body?: any,
  opts?: { method?: string; rawBody?: boolean }
): Promise<T> {
  const method = opts?.method || (body ? "POST" : "GET");
  const res = await fetch(url, {
    method,
    headers: opts?.rawBody ? undefined : { "Content-Type": "application/json" },
    body: opts?.rawBody ? (body as BodyInit) : body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) {
    const msg = json.error || `Request failed (${res.status})`;
    toast({ title: "Error", description: msg, variant: "destructive" });
    throw new Error(msg);
  }
  return json as T;
}

/**
 * apiUpload — FormData upload helper.
 */
export async function apiUpload<T = any>(url: string, formData: FormData): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) {
    const msg = json.error || `Upload failed (${res.status})`;
    toast({ title: "Error", description: msg, variant: "destructive" });
    throw new Error(msg);
  }
  return json as T;
}
