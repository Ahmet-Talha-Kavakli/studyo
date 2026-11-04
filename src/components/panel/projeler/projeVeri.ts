"use client";

/**
 * Projeler sayfasının veri katmanı. Ayrı bir liste YOK: proje = useProje (useSinema),
 * varlık = useProjeler.uretimler (projeId ya da proje.uretimIdler/shortsKlipleri referansı).
 */

import { useMemo } from "react";
import { useProje, type Proje } from "@/store/useSinema";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { saltUrl } from "@/lib/utils";

export type ProjeDurum = "uretiliyor" | "yayinda" | "taslak" | "normal";

export interface ProjeOzet {
  p: Proje;
  kareler: string[];      // kapak + üretimlerden en yeni 8 gerçek görsel
  gorsel: number;
  video: number;
  ses: number;
  toplam: number;
  sahne: [number, number]; // [biten, toplam] çekim
  durum: ProjeDurum;
  demo: boolean;           // varlığı var ama hiçbiri gerçek sağlayıcıdan değil
  zaman: number;           // son hareket (ms) — 0 ise bilinmiyor
}

/* Eski kayıtlarda olusturma/guncelleme sayaçtı (0, 1, 2…); bunlar zaman damgası sayılmaz. */
const EN_ESKI = Date.UTC(2020, 0, 1);
export const gercekZaman = (t?: number) => (t && t > EN_ESKI ? t : 0);

export const gorselMi = (u?: string) => {
  const g = saltUrl(u);
  return g && /^(https?:|data:image|blob:|\/)/.test(g) ? g : undefined;
};

export function projeOzetiCikar(p: Proje, uretimler: Uretim[]): ProjeOzet {
  const ref = new Set([...(p.uretimIdler ?? []), ...(p.shortsKlipleri ?? [])]);
  const ait = uretimler.filter((u) => u.projeId === p.id || ref.has(u.id)).sort((a, b) => b.olusturma - a.olusturma);
  const kareler: string[] = [];
  const ekle = (u?: string) => { const g = gorselMi(u); if (g && !kareler.includes(g) && kareler.length < 8) kareler.push(g); };
  ekle(p.kapakUrl);
  for (const u of ait) ekle(u.gorselUrl ?? u.thumbnailUrl ?? u.muzik?.kapak);
  for (const c of p.cekimler) ekle(c.gorselUrl);

  let gorsel = 0, video = 0, ses = 0, gercek = 0, suruyor = false;
  for (const u of ait) {
    if (u.tur === "video") video++;
    else if (u.tur === "ses" || u.tur === "muzik") ses++;
    else gorsel++;
    if (u.gercek) gercek++;
    if (u.durum === "kuyrukta" || u.durum === "isleniyor") suruyor = true;
  }
  const biten = p.cekimler.filter((c) => c.durum === "tamam").length;
  const zaman = Math.max(gercekZaman(p.guncelleme), gercekZaman(p.olusturma), gercekZaman(ait[0]?.olusturma));
  const durum: ProjeDurum = suruyor ? "uretiliyor" : p.yayinda ? "yayinda" : ait.length === 0 ? "taslak" : "normal";
  return { p, kareler, gorsel, video, ses, toplam: ait.length, sahne: [biten, p.cekimler.length], durum, demo: ait.length > 0 && gercek === 0, zaman };
}

export function useProjeOzetleri() {
  const projeler = useProje((s) => s.projeler);
  const uretimler = useProjeler((s) => s.uretimler);
  return useMemo(() => projeler.filter((p) => !p.klasor).map((p) => projeOzetiCikar(p, uretimler)), [projeler, uretimler]);
}

/** "12 dk önce" — bilinmeyen zamanda boş döner. */
export function gorece(t: number) {
  if (!t) return "";
  const dk = (Date.now() - t) / 60000;
  if (dk < 1) return "az önce";
  if (dk < 60) return `${Math.floor(dk)} dk önce`;
  if (dk < 1440) return `${Math.floor(dk / 60)} sa önce`;
  const g = Math.floor(dk / 1440);
  if (g === 1) return "dün";
  if (g < 7) return `${g} gün önce`;
  if (g < 30) return `${Math.floor(g / 7)} hafta önce`;
  return new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}
