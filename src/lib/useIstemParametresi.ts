"use client";

import { useEffect } from "react";

/**
 * Stüdyo açılırken adresteki `?istem=` değerini istem alanına yazar
 * (Earn kampanya kiti, presetler, paylaşılan bağlantılar). Bir kez çalışır.
 */
export function useIstemParametresi(yaz: (istem: string) => void) {
  useEffect(() => {
    const istem = new URLSearchParams(window.location.search).get("istem");
    if (istem?.trim()) yaz(istem.trim().slice(0, 2000));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
