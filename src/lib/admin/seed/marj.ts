/**
 * Model maliyet & marj analizi — her model için kullanım/gelir/maliyet/net katkı,
 * model başına 30 günlük istatistik, provider harcama serisi.
 */
import { prng, tohumla, normal } from "../cekirdek";
import { MODELLER, PLANLAR, type AdminModel, type PlanId } from "../tablolar";
import type { AdminEvren } from "./index";

const USD_TRY = 33;

export interface ModelStat {
  model: AdminModel;
  kullanim30: number;
  gelir: number; // ₺ (kredi × 0.33₺ varsay)
  maliyet: number; // ₺ (provider USD × kur)
  netKatki: number;
  marj: number; // %
  basariOran: number;
  ortSureSn: number;
}

/** Model başına 30 günlük istatistik (job dilimi + override kredi/maliyet). */
export function modelStatlar(
  evren: AdminEvren,
  override: (id: string) => { kredi?: number; maliyetUsd?: number },
): ModelStat[] {
  const jobSay = new Map<string, number>();
  for (const j of evren.joblar) jobSay.set(j.modelId, (jobSay.get(j.modelId) ?? 0) + 1);

  return MODELLER.map((m) => {
    const o = override(m.id);
    const kredi = o.kredi ?? m.kredi;
    const maliyetUsd = o.maliyetUsd ?? m.maliyetUsd;
    const kullanim = jobSay.get(m.id) ?? 0;
    const r = prng(tohumla(`mstat-${m.id}`));
    const kullanim30 = Math.round(kullanim * (0.28 + normal(r) * 0.1));
    const gelir = Math.round(kullanim30 * kredi * 0.33); // 1 kredi ≈ 0,33₺ gelir
    const maliyet = Math.round(kullanim30 * maliyetUsd * USD_TRY);
    const netKatki = gelir - maliyet;
    return {
      model: { ...m, kredi, maliyetUsd },
      kullanim30,
      gelir,
      maliyet,
      netKatki,
      marj: gelir ? (netKatki / gelir) * 100 : 0,
      basariOran: +(92 + normal(r) * 8).toFixed(1),
      ortSureSn: Math.round(8 + normal(r) * 40),
    };
  }).sort((a, b) => b.kullanim30 - a.kullanim30);
}

/** What-if: bir provider fiyatı %x artarsa toplam marj ne olur. */
export function whatIf(statlar: ModelStat[], saglayici: string, artisYuzde: number): { eskiMarj: number; yeniMarj: number; kayip: number } {
  let toplamGelir = 0, eskiMaliyet = 0, yeniMaliyet = 0;
  for (const s of statlar) {
    toplamGelir += s.gelir;
    eskiMaliyet += s.maliyet;
    const carpan = s.model.saglayici === saglayici ? 1 + artisYuzde / 100 : 1;
    yeniMaliyet += s.maliyet * carpan;
  }
  const eskiMarj = toplamGelir ? ((toplamGelir - eskiMaliyet) / toplamGelir) * 100 : 0;
  const yeniMarj = toplamGelir ? ((toplamGelir - yeniMaliyet) / toplamGelir) * 100 : 0;
  return { eskiMarj, yeniMarj, kayip: yeniMaliyet - eskiMaliyet };
}

/** Provider 30 günlük harcama serisi (grafik için). */
export function providerHarcamaSeri(saglayici: string): number[] {
  return Array.from({ length: 30 }, (_, i) => {
    const r = prng(tohumla(`provharcama-${saglayici}-${i}`));
    return Math.round(200 + normal(r) * 400);
  });
}

/* ──────────────────────────────────────────────────────────────
   Model × Tier marj matrisi + ağır kullanıcılar + COGS trend.
   Modül 6.3 (marj analizi) — hangi model hangi planda para kaybettiriyor.
   ────────────────────────────────────────────────────────────── */

/** Plan (tier) başına toplam kullanım payı — üst planlar daha ağır tüketir. */
const TIER_PAY: Record<PlanId, number> = { baslangic: 0.16, arti: 0.34, ultra: 0.36, kurumsal: 0.14 };
/** Plan başına efektif kredi-gelir çarpanı (üst planlar kredi başına daha ucuz → daha düşük birim gelir). */
const TIER_GELIR_CARPAN: Record<PlanId, number> = { baslangic: 0.42, arti: 0.34, ultra: 0.27, kurumsal: 0.2 };

export interface MatrisHucre {
  kullanim: number;
  gelir: number;
  maliyet: number;
  net: number;
  marj: number; // %
  zarar: boolean;
}
export interface MatrisSatir {
  model: AdminModel;
  toplamNet: number;
  hucreler: MatrisHucre[]; // PLANLAR sırasıyla
}
export interface ModelTierMatris {
  tierler: { id: PlanId; ad: string }[];
  satirlar: MatrisSatir[];
  tierToplam: { net: number; zararSay: number }[]; // sütun altı toplamı
}

/**
 * Model × Tier marj matrisi. Her hücre = o modelin o plandaki kullanıcılarca
 * kullanımının kâr/zararı (kullanım × gelir − kullanım × maliyet). Zarar hücreler işaretli.
 */
export function modelTierMatris(statlar: ModelStat[]): ModelTierMatris {
  const tierler = PLANLAR.map((p) => ({ id: p.id, ad: p.ad }));
  const satirlar: MatrisSatir[] = statlar
    .filter((s) => s.kullanim30 > 0)
    .map((s) => {
      let toplamNet = 0;
      const hucreler = PLANLAR.map((p) => {
        const r = prng(tohumla(`matris-${s.model.id}-${p.id}`));
        const pay = TIER_PAY[p.id] * (0.82 + normal(r) * 0.36);
        const kullanim = Math.round(s.kullanim30 * pay);
        const gelir = Math.round(kullanim * s.model.kredi * TIER_GELIR_CARPAN[p.id]);
        const maliyet = Math.round(kullanim * s.model.maliyetUsd * USD_TRY);
        const net = gelir - maliyet;
        toplamNet += net;
        return { kullanim, gelir, maliyet, net, marj: gelir ? (net / gelir) * 100 : 0, zarar: net < 0 && kullanim > 0 };
      });
      return { model: s.model, toplamNet, hucreler };
    })
    .sort((a, b) => a.toplamNet - b.toplamNet); // en çok zarar en üstte

  const tierToplam = PLANLAR.map((_, ci) => {
    let net = 0, zararSay = 0;
    for (const sat of satirlar) { net += sat.hucreler[ci].net; if (sat.hucreler[ci].zarar) zararSay++; }
    return { net, zararSay };
  });

  return { tierler, satirlar, tierToplam };
}

export interface AgirKullanici {
  id: string;
  ad: string;
  plan: string;
  ulke: string;
  odenen: number; // ₺ ödediği (abonelik/paket)
  maliyet: number; // ₺ ürettiği provider maliyeti
  fark: number; // maliyet − ödenen (pozitif = zarar)
  jobSayisi: number;
}

/**
 * Ağır kullanıcılar — provider maliyeti ödediğinden fazla olanlar (zarar ettirenler).
 * toplamHarcanan = harcanan kredi ₺-karşılığı; maliyet ~ bunun %62'si (provider payı).
 */
export function agirKullanicilar(evren: AdminEvren, limit = 25): AgirKullanici[] {
  return evren.kullanicilar
    .map((k) => {
      const r = prng(tohumla(`agir-${k.id}`));
      const maliyet = Math.round(k.toplamHarcanan * (0.58 + normal(r) * 0.12));
      return {
        id: k.id, ad: k.ad, plan: k.plan, ulke: k.ulke,
        odenen: k.toplamOdenen, maliyet, fark: maliyet - k.toplamOdenen, jobSayisi: k.jobSayisi,
      };
    })
    .filter((k) => k.fark > 0 && k.maliyet > 0)
    .sort((a, b) => b.fark - a.fark)
    .slice(0, limit);
}

export interface CogsGun {
  gun: number; // ms
  gelir: number;
  maliyet: number;
  oran: number; // COGS % = maliyet / gelir
}

/** Aylık (30 gün) COGS oranı serisi — provider maliyeti / gelir. */
export function cogsTrend(evren: AdminEvren): CogsGun[] {
  return evren.seri.slice(-30).map((g) => ({
    gun: g.gun,
    gelir: g.gelir,
    maliyet: g.maliyet,
    oran: g.gelir ? (g.maliyet / g.gelir) * 100 : 0,
  }));
}
