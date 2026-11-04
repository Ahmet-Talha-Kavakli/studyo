"use client";

import { useProjeler, type Uretim } from "@/store/useProjeler";

/**
 * Silmeden ÖNCE çağır: verilen üretimlerin anlık kopyasını alır ve onları
 * eski sıralarına geri koyan fonksiyonu döndürür ("Geri al" toast eylemi için).
 */
export function uretimGeriAl(idler: string[]): () => void {
  const once = useProjeler.getState().uretimler;
  const kayit = idler
    .map((id) => ({ sira: once.findIndex((u) => u.id === id), u: once.find((u) => u.id === id) }))
    .filter((k): k is { sira: number; u: Uretim } => !!k.u)
    .sort((a, b) => a.sira - b.sira);
  return () =>
    useProjeler.setState((s) => {
      const l = [...s.uretimler];
      for (const k of kayit) if (!l.some((x) => x.id === k.u.id)) l.splice(Math.min(k.sira, l.length), 0, k.u);
      return { uretimler: l };
    });
}
