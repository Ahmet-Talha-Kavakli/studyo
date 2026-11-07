"use client";

import { useEffect, useRef } from "react";

/**
 * Stüdyo açılırken adresteki `?istem=` değerini istem alanına yazar (Earn kampanya kiti, presetler,
 * paylaşılan bağlantılar, üst çubuktaki komut paleti). Aynı stüdyo zaten açıkken komut paleti
 * "vayra-istem" olayı gönderir; istem sayfa yeniden kurulmadan yazılır.
 */
export function useIstemParametresi(yaz: (istem: string) => void) {
  const son = useRef(yaz);
  son.current = yaz;
  useEffect(() => {
    const istem = new URLSearchParams(window.location.search).get("istem");
    if (istem?.trim()) son.current(istem.trim().slice(0, 2000));
    const olay = (e: Event) => {
      const v = (e as CustomEvent<string>).detail;
      if (typeof v === "string" && v.trim()) son.current(v.trim().slice(0, 2000));
    };
    window.addEventListener("vayra-istem", olay);
    return () => window.removeEventListener("vayra-istem", olay);
  }, []);
}
