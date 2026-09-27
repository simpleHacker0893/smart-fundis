"use client";

import { useState, useSyncExternalStore } from "react";

export const COLLAPSED_KEY = "sf.sidebar.collapsed";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/** The saved choice, or null when there is none or storage is blocked. */
function readSaved(): boolean | null {
  try {
    const value = window.localStorage.getItem(COLLAPSED_KEY);
    return value === null ? null : value === "1";
  } catch {
    return null;
  }
}

/**
 * The desktop sidebar's collapsed state, saved in localStorage when it can
 * be (private modes and blocked storage throw). The server renders it
 * expanded; a toggle in this tab wins over the saved value.
 */
export function useCollapsed(): [boolean, () => void] {
  const saved = useSyncExternalStore(subscribe, readSaved, () => null);
  const [chosen, setChosen] = useState<boolean | null>(null);
  const collapsed = chosen ?? saved ?? false;

  function toggle() {
    const next = !collapsed;
    setChosen(next);
    try {
      window.localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      // Storage is blocked: the choice lasts for this visit only.
    }
  }

  return [collapsed, toggle];
}
