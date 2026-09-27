"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const BACK_ONLINE_MS = 3000;

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

export type Connection = { kind: "online" } | { kind: "offline"; since: number } | { kind: "back" };

/**
 * The browser's connection (D9): offline since when, and "back" for 3 s
 * after it reconnects. The server and hydration assume online.
 */
export function useConnection(): Connection {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  const [mountedAt] = useState(() => Date.now());
  const [offlineAt, setOfflineAt] = useState<number | null>(null);
  const [back, setBack] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const goneOffline = () => {
      clearTimeout(timer);
      setBack(false);
      setOfflineAt(Date.now());
    };
    const backOnline = () => {
      clearTimeout(timer);
      setBack(true);
      timer = setTimeout(() => setBack(false), BACK_ONLINE_MS);
    };
    window.addEventListener("offline", goneOffline);
    window.addEventListener("online", backOnline);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("offline", goneOffline);
      window.removeEventListener("online", backOnline);
    };
  }, []);

  if (!online) return { kind: "offline", since: offlineAt ?? mountedAt };
  return back ? { kind: "back" } : { kind: "online" };
}
