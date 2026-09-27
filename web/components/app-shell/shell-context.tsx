"use client";

import { createContext, useContext } from "react";

/**
 * What a slot rendered inside the shell may read: whether the desktop
 * sidebar is the 64 px icon rail. The primary action uses it to draw a full
 * pill or an icon button (phase B's Add video trigger does the same).
 */
export const ShellSidebarContext = createContext<{ collapsed: boolean }>({ collapsed: false });

export function useShellSidebar(): { collapsed: boolean } {
  return useContext(ShellSidebarContext);
}
