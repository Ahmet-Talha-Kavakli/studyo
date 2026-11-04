"use client";

import { useSyncExternalStore } from "react";

const SORGU = "(min-width: 640px)";

/** Masaüstü düzeni (sm ve üstü) etkin mi. Sunucuda masaüstü varsayılır. */
export function useMasaustu(): boolean {
  return useSyncExternalStore(
    (f) => { const m = window.matchMedia(SORGU); m.addEventListener("change", f); return () => m.removeEventListener("change", f); },
    () => window.matchMedia(SORGU).matches,
    () => true,
  );
}
