"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildKrediUygula } from "@/lib/build/istemciKredi";
import { sahipAnahtari } from "@/lib/build/istemci";
import type { BuyumeVeri } from "@/lib/build/buyumeTipler";
import { useAuth } from "@/store/useAuth";
import { useKrediModal } from "@/store/useKrediModal";

export class ModelYokHatasi extends Error { constructor(m = "Yapay zekâ modeli bağlı değil.") { super(m); } }

type Yanit = { ok?: boolean; hata?: string; veri?: BuyumeVeri; modelYok?: boolean; model?: string | null; suren?: string[]; kredi?: number } & Record<string, unknown>;

async function istek(yol: string, method: string, govde?: unknown): Promise<{ durum: number; j: Yanit }> {
  const r = await fetch(yol, { method, headers: { "x-build-sahip": sahipAnahtari(), ...(govde ? { "Content-Type": "application/json" } : {}) }, body: govde ? JSON.stringify(govde) : undefined, cache: "no-store" });
  let j: Yanit = {};
  try { j = await r.json(); } catch { /* boş */ }
  return { durum: r.status, j };
}

/**
 * Büyüme sekmesinin veri kancası. Düzenlemeler önce ekranda uygulanır, sonra kaydedilir (hata olursa sunucudan
 * yeniden okunur). Üretimler sunucuda sürerken sekme kapansa da biter; dönüşte "suren" listesi yoklanır.
 */
export function useBuyume(projeId: string) {
  const [veri, setVeri] = useState<BuyumeVeri | null>(null);
  const [model, setModel] = useState<string | null | undefined>(undefined);
  const [suren, setSuren] = useState<string[]>([]);
  const [yerel, setYerel] = useState<string[]>([]);
  const [hata, setHata] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(0);
  const yol = `/api/build/buyume/${projeId}`;
  const veriRef = useRef<BuyumeVeri | null>(null);
  veriRef.current = veri;

  const yukle = useCallback(async () => {
    try {
      const { durum, j } = await istek(yol, "GET");
      if (!j.ok || !j.veri) { setHata(j.hata ?? `Büyüme verisi okunamadı (${durum}).`); return; }
      setVeri(j.veri); setModel(j.model ?? null); setSuren(j.suren ?? []);
    } catch { setHata("Büyüme verisi okunamadı."); }
  }, [yol]);
  useEffect(() => { yukle(); }, [yukle]);

  /* Başka bir sekmede başlamış ya da sekme kapanırken süren üretimleri yokla. */
  useEffect(() => {
    const disarida = suren.filter((s) => !yerel.includes(s));
    if (!disarida.length) return;
    const t = setTimeout(yukle, 3000);
    return () => clearTimeout(t);
  }, [suren, yerel, yukle]);

  /** Düzenleme: f ekranda hemen uygulanır, govde PATCH ile gider. */
  const degistir = useCallback(async (f: ((v: BuyumeVeri) => void) | null, govde: Record<string, unknown>) => {
    const v0 = veriRef.current;
    if (v0 && f) { const v = structuredClone(v0); f(v); setVeri(v); }
    setKaydediliyor((n) => n + 1);
    try {
      const { j } = await istek(yol, "PATCH", govde);
      if (!j.ok || !j.veri) { setHata(j.hata ?? "Kaydedilemedi."); await yukle(); return false; }
      setVeri(j.veri);
      return true;
    } catch { setHata("Kaydedilemedi; bağlantını kontrol et."); await yukle(); return false; }
    finally { setKaydediliyor((n) => n - 1); }
  }, [yol, yukle]);

  /** Üretim: model yoksa ModelYokHatasi, başka hatada Error atar; başarıda krediyi düşer. */
  const uret = useCallback(async (islem: string, govde: Record<string, unknown> = {}, anahtar = islem): Promise<Yanit> => {
    if (islem === "gorsel") {
      const k = useAuth.getState().kullanici;
      if (k && k.krediler < 2) { useKrediModal.getState().ac("kredi"); throw new Error("Görsel için 2 kredi gerekiyor."); }
    }
    setYerel((l) => [...l, anahtar]);
    setSuren((l) => (l.includes(anahtar) ? l : [...l, anahtar]));
    try {
      const { durum, j } = await istek(yol, "POST", { islem, ...govde });
      if (j.veri) setVeri(j.veri);
      if (durum === 424 || j.modelYok) { setModel(null); throw new ModelYokHatasi(j.hata); }
      if (!j.ok) throw new Error(j.hata ?? "Üretim tamamlanamadı.");
      buildKrediUygula(j);
      return j;
    } finally {
      setYerel((l) => { const i = l.indexOf(anahtar); return i < 0 ? l : [...l.slice(0, i), ...l.slice(i + 1)]; });
      setSuren((l) => l.filter((x) => x !== anahtar));
    }
  }, [yol]);

  const suruyor = useCallback((anahtar: string) => suren.includes(anahtar), [suren]);
  return { veri, model, hata, setHata, yukle, degistir, uret, suruyor, suren, kaydediliyor: kaydediliyor > 0 };
}
export type BuyumeKanca = ReturnType<typeof useBuyume>;
