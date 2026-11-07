"use client";

import { useCallback, useEffect, useState, useLayoutEffect } from "react";

/** İstemcide çizimden önce çalışır; sunucuda uyarı vermesin diye useEffect. */
const useOlcumEtkisi = typeof window !== "undefined" ? useLayoutEffect : useEffect;
import { GORUNUM_OLAYI, VARSAYILAN_GORUNUM, gorunumOku, gorunumYaz, type Gorunum } from "@/lib/galeri/gorunum";

/**
 * Sayfanın galeri görünüm ayarı. İlk çizim varsayılanla yapılır (SSR ile aynı), bağlanınca
 * localStorage'daki kayıt okunur. Değişiklik hemen yazılır ve aynı sayfadaki diğer
 * okuyuculara (ızgara, ayar düğmesi, komut kutusu) olayla iletilir.
 */
export function useGorunum(sayfa: string, taban: Partial<Gorunum> = {}): [Gorunum, (p: Partial<Gorunum>) => void] {
  const tabanAnahtar = JSON.stringify(taban);
  // Kayıtlı görünüm ilk çizimden önce okunur (önce varsayılanla çizip sonra yeniden dizmek "zıplayan kutular" yapıyordu).
  const [g, setG] = useState<Gorunum>(() => gorunumOku(sayfa, taban));

  useEffect(() => {
    setG(gorunumOku(sayfa, JSON.parse(tabanAnahtar) as Partial<Gorunum>));
    const dinle = (e: Event) => {
      const d = (e as CustomEvent<{ sayfa: string; g: Gorunum }>).detail;
      if (d?.sayfa === sayfa) setG(d.g);
    };
    window.addEventListener(GORUNUM_OLAYI, dinle);
    return () => window.removeEventListener(GORUNUM_OLAYI, dinle);
  }, [sayfa, tabanAnahtar]);

  const ayarla = useCallback((p: Partial<Gorunum>) => {
    const yeni = { ...gorunumOku(sayfa, JSON.parse(tabanAnahtar) as Partial<Gorunum>), ...p };
    setG(yeni);
    gorunumYaz(sayfa, yeni);
  }, [sayfa, tabanAnahtar]);

  return [g, ayarla];
}

/** Alanın genişliğini izler (sütun sayısı için). */
export function useAlanGenisligi<T extends HTMLElement>(ilk = 1200): [React.RefCallback<T>, number] {
  const [en, setEn] = useState(ilk);
  const [el, setEl] = useState<T | null>(null);
  // Ölçüm ekran çizilmeden önce yapılır: ilk görünen kare gerçek sütun sayısıyla çizilir.
  useOlcumEtkisi(() => {
    if (!el) return;
    setEn(el.clientWidth || ilk);
    const ro = new ResizeObserver(([e]) => setEn(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [el, ilk]);
  return [setEl, en];
}
