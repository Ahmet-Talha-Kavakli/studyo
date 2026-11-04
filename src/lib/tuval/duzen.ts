import { create } from "zustand";
import { persist } from "zustand/middleware";
import { KATALOG } from "./katalog";
import type { Dugum, Kenar, Tuval } from "@/store/useTuval";

/**
 * Tuval yerleşim yardımcıları: düğüm boyutu tahmini, otomatik düzen (katmanlı, soldan sağa),
 * taşırken hizalama kılavuzları ve kullanıcının kendi şablonları.
 */
export const genislik = (d: Pick<Dugum, "tur">) => KATALOG[d.tur].genislik;
export const yukseklikTahmin = (d: Pick<Dugum, "tur" | "kucuk">) =>
  d.kucuk ? 64 : d.tur === "istem" || d.tur === "liste" ? 170 : d.tur === "not" ? 150 : d.tur === "video" || d.tur === "videoYukle" ? 330 : d.tur === "ses" || d.tur === "muzik" || d.tur === "efekt" || d.tur === "sesYukle" ? 220 : d.tur === "gorsel" || d.tur === "duzenle" ? 380 : 260;

/** Katmanlı otomatik düzen: her düğüm en uzun giriş yolunun derinliğine göre sütuna, sütun içinde eski y sırasına göre dizilir. */
export function otoDuzen(t: Tuval, ids?: string[]): Map<string, { x: number; y: number }> {
  const l = t.dugumler.filter((d) => !ids || ids.includes(d.id));
  const kume = new Set(l.map((d) => d.id));
  const kenar = t.kenarlar.filter((e) => kume.has(e.kaynak) && kume.has(e.hedef));
  const derin = new Map<string, number>();
  const hesap = (id: string, yol = new Set<string>()): number => {
    if (derin.has(id)) return derin.get(id)!;
    if (yol.has(id)) return 0; yol.add(id);
    const g = kenar.filter((e) => e.hedef === id).map((e) => hesap(e.kaynak, yol) + 1);
    const v = g.length ? Math.max(...g) : 0; derin.set(id, v); return v;
  };
  l.forEach((d) => hesap(d.id));
  const x0 = Math.min(...l.map((d) => d.x)), y0 = Math.min(...l.map((d) => d.y));
  const sutun = new Map<number, Dugum[]>();
  l.forEach((d) => { const k = derin.get(d.id)!; sutun.set(k, [...(sutun.get(k) ?? []), d]); });
  const sonuc = new Map<string, { x: number; y: number }>();
  let x = x0;
  [...sutun.keys()].sort((a, b) => a - b).forEach((k) => {
    const s = sutun.get(k)!.sort((a, b) => a.y - b.y);
    let y = y0;
    s.forEach((d) => { sonuc.set(d.id, { x, y }); y += yukseklikTahmin(d) + 48; });
    x += Math.max(...s.map(genislik)) + 120;
  });
  return sonuc;
}

export type Kilavuz = { yon: "x" | "y"; deger: number; a: number; b: number };

/** Taşınan kutuyu diğer düğümlerin kenar/orta hatlarına yapıştırır (eşik dünya biriminde). */
export function hizala(kutu: { x: number; y: number; w: number; h: number }, digerleri: Dugum[], esik: number): { dx: number; dy: number; kilavuz: Kilavuz[] } {
  let enX: { f: number; deger: number; d: Dugum } | null = null, enY: { f: number; deger: number; d: Dugum } | null = null;
  const kx = [kutu.x, kutu.x + kutu.w / 2, kutu.x + kutu.w], ky = [kutu.y, kutu.y + kutu.h / 2, kutu.y + kutu.h];
  for (const d of digerleri) {
    const w = genislik(d), h = yukseklikTahmin(d);
    const dx = [d.x, d.x + w / 2, d.x + w], dy = [d.y, d.y + h / 2, d.y + h];
    kx.forEach((a, i) => dx.forEach((b, j) => { if ((i === 1) !== (j === 1)) return; const f = b - a; if (Math.abs(f) <= esik && (!enX || Math.abs(f) < Math.abs(enX.f))) enX = { f, deger: b, d }; }));
    ky.forEach((a, i) => dy.forEach((b, j) => { if ((i === 1) !== (j === 1)) return; const f = b - a; if (Math.abs(f) <= esik && (!enY || Math.abs(f) < Math.abs(enY.f))) enY = { f, deger: b, d }; }));
  }
  const kilavuz: Kilavuz[] = [];
  const X = enX as { f: number; deger: number; d: Dugum } | null, Y = enY as { f: number; deger: number; d: Dugum } | null;
  if (X) kilavuz.push({ yon: "x", deger: X.deger, a: Math.min(kutu.y, X.d.y) - 24, b: Math.max(kutu.y + kutu.h, X.d.y + yukseklikTahmin(X.d)) + 24 });
  if (Y) kilavuz.push({ yon: "y", deger: Y.deger, a: Math.min(kutu.x, Y.d.x) - 24, b: Math.max(kutu.x + kutu.w, Y.d.x + genislik(Y.d)) + 24 });
  return { dx: X ? X.f : 0, dy: Y ? Y.f : 0, kilavuz };
}

/* ── Kullanıcı şablonları ── */
export type KendiSablon = { id: string; ad: string; zaman: number; dugumler: Dugum[]; kenarlar: Kenar[]; kapak?: string };

export const useKendiSablon = create<{ liste: KendiSablon[]; ekle: (s: KendiSablon) => void; sil: (id: string) => void }>()(
  persist((set) => ({
    liste: [],
    ekle: (s) => set((o) => ({ liste: [s, ...o.liste].slice(0, 40) })),
    sil: (id) => set((o) => ({ liste: o.liste.filter((x) => x.id !== id) })),
  }), { name: "vayra-tuval-sablonlarim" }),
);

/** Şablon için düğümleri temizler: sonuçlar atılır (yüklenen girdiler kalır), konumlar sola-üste çekilir. */
export function sablonHazirla(dugumler: Dugum[], kenarlar: Kenar[]): { dugumler: Dugum[]; kenarlar: Kenar[] } {
  const x0 = Math.min(...dugumler.map((d) => d.x)), y0 = Math.min(...dugumler.map((d) => d.y));
  const ids = new Set(dugumler.map((d) => d.id));
  return {
    dugumler: dugumler.map((d) => ({ ...d, x: d.x - x0, y: d.y - y0, durum: KATALOG[d.tur].calisir ? "bos" : d.durum, surumler: KATALOG[d.tur].calisir ? [] : d.surumler, aktif: KATALOG[d.tur].calisir ? 0 : d.aktif, eski: false, hata: undefined })),
    kenarlar: kenarlar.filter((e) => ids.has(e.kaynak) && ids.has(e.hedef)),
  };
}
