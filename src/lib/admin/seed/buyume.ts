/**
 * Büyüme & İçerik verileri — referans ağacı, affiliate/influencer, kupon/promo,
 * kampanya (email/push), preset/showcase, landing/blog/SEO, duyuru, yasal metin.
 */
import { prng, tohumla, tamsayi, sec, agirlikliSec, normal, BUGUN, GUN } from "../cekirdek";
import type { AdminEvren } from "./index";

/* ── Referans ── */
export interface ReferansDugum {
  kullaniciId: string;
  ad: string;
  getirdigi: number;
  kazanilanKredi: number;
  fraudSkoru: number;
}

export function referansAgaci(evren: AdminEvren): ReferansDugum[] {
  const getirenSay = new Map<string, number>();
  for (const k of evren.kullanicilar) if (k.referansEden) getirenSay.set(k.referansEden, (getirenSay.get(k.referansEden) ?? 0) + 1);
  return [...getirenSay.entries()]
    .map(([id, getirdigi]) => {
      const k = evren.kullanicilar.find((x) => x.id === id);
      const r = prng(tohumla(`ref-${id}`));
      return { kullaniciId: id, ad: k?.ad ?? id, getirdigi, kazanilanKredi: getirdigi * 100, fraudSkoru: +(normal(r) * (r() > 0.85 ? 1 : 0.3)).toFixed(2) };
    })
    .sort((a, b) => b.getirdigi - a.getirdigi).slice(0, 20);
}

export function referansMetrik() {
  return { toplamReferans: 4820, kFactor: 0.42, referansliLtv: 2340, organikLtv: 1680, bekleyenOdul: 68 };
}

/* Viral katsayı (K-Factor) — deterministik 30 günlük zaman serisi.
   Yavaş yükselen trend + tohumlu dalgalanma, 2 basamak. */
let _kFactor: { seri: number[]; etiketler: string[] } | null = null;
export function kFactorSeri(): { seri: number[]; etiketler: string[] } {
  if (_kFactor) return _kFactor;
  const r = prng(tohumla("kfactor-30g"));
  const seri: number[] = [];
  const etiketler: string[] = [];
  let taban = 0.31;
  for (let i = 29; i >= 0; i--) {
    taban += (r() - 0.42) * 0.02; // hafif yukarı eğilim
    const deger = Math.max(0.2, Math.min(0.6, taban + (normal(r) - 0.5) * 0.05));
    seri.push(+deger.toFixed(2));
    const gun = new Date(BUGUN - i * GUN);
    etiketler.push(i % 6 === 0 ? `${gun.getUTCDate()}` : "");
  }
  _kFactor = { seri, etiketler };
  return _kFactor;
}

/* Kampanya segmentleri — her biri deterministik tahmini kişi sayısı ile. */
export interface Segment {
  ad: string;
  kisi: number;
}
let _segmentler: Segment[] | null = null;
export function segmentler(): Segment[] {
  if (_segmentler) return _segmentler;
  const tanim: [string, number, number][] = [
    ["Tüm kullanıcılar", 48000, 62000],
    ["Ücretsiz plan", 32000, 41000],
    ["Ultra", 3200, 5400],
    ["Kredi bitenler", 6800, 11000],
    ["30g inaktif", 9200, 14000],
    ["Yeni kayıt", 2400, 4200],
  ];
  _segmentler = tanim.map(([ad, min, max], i) => {
    const r = prng(tohumla(`seg-${i}`));
    return { ad, kisi: tamsayi(r, min, max) };
  });
  return _segmentler;
}

/* A/B test örnekleri — store başlangıç dışı, referans/gösterim amaçlı. */
export interface AbTestOrnek {
  id: string;
  ad: string;
  tur: "thumbnail" | "prompt" | "landing";
  varyantA: string;
  varyantB: string;
  gorunumA: number;
  gorunumB: number;
  donusumA: number;
  donusumB: number;
}
let _abOrnek: AbTestOrnek[] | null = null;
export function abTestOrnekleri(): AbTestOrnek[] {
  if (_abOrnek) return _abOrnek;
  const tanim: [string, AbTestOrnek["tur"], string, string][] = [
    ["Fiyat sayfası CTA", "landing", "Hemen başla", "Ücretsiz dene"],
    ["Reel şablon kapağı", "thumbnail", "Sade minimal", "Hareketli önizleme"],
    ["Video prompt ipucu", "prompt", "Tek satır ipucu", "Örnekli rehber"],
  ];
  _abOrnek = tanim.map(([ad, tur, va, vb], i) => {
    const r = prng(tohumla(`abx-${i}`));
    const gorunumA = tamsayi(r, 4000, 14000);
    const gorunumB = gorunumA + tamsayi(r, -600, 600);
    return {
      id: `abx_${i}`, ad, tur, varyantA: va, varyantB: vb, gorunumA, gorunumB,
      donusumA: Math.round(gorunumA * (0.06 + normal(r) * 0.1)),
      donusumB: Math.round(gorunumB * (0.06 + normal(r) * 0.1)),
    };
  });
  return _abOrnek;
}

/* ── Affiliate / Influencer ── */
export interface Affiliate {
  id: string;
  ad: string;
  platform: string;
  takipci: number;
  komisyon: number; // %
  tiklama: number;
  kayit: number;
  odeme: number;
  gelir: number;
  odenecek: number;
  roi: number;
}

export function affiliateler(): Affiliate[] {
  const isimler = ["@creativemind", "@aivideos", "@designpro", "@techreview", "@artdaily", "@motionlab", "@studiogram"];
  const platform = ["YouTube", "Instagram", "TikTok", "Twitter/X"];
  return isimler.map((ad, i) => {
    const r = prng(tohumla(`aff-${i}`));
    const gelir = tamsayi(r, 5000, 80000);
    const komisyon = tamsayi(r, 15, 35);
    return {
      id: `aff_${i}`, ad, platform: sec(r, platform), takipci: tamsayi(r, 10000, 900000),
      komisyon, tiklama: tamsayi(r, 500, 12000), kayit: tamsayi(r, 40, 800), odeme: tamsayi(r, 10, 200),
      gelir, odenecek: Math.round((gelir * komisyon) / 100), roi: +(gelir / (gelir * komisyon / 100)).toFixed(1),
    };
  }).sort((a, b) => b.gelir - a.gelir);
}

/* ── Kampanyalar (email/push) ── */
export interface Kampanya {
  id: string;
  ad: string;
  tur: "email" | "push" | "in-app";
  segment: string;
  gonderim: number;
  acilma: number;
  tiklama: number;
  donusum: number;
  gelir: number;
  durum: "aktif" | "tamamlandi" | "taslak" | "zamanlandi";
}

export function kampanyalar(): Kampanya[] {
  const adlar = [
    ["Hoşgeldin serisi", "in-app", "Yeni kayıt"], ["Kredi bitti hatırlatması", "email", "Düşük bakiye"],
    ["Win-back", "email", "Churn riski"], ["Trial bitiyor", "push", "Deneme kullanıcı"],
    ["Ultra upsell", "email", "Ağır kullanıcı"], ["Yeni model duyurusu", "push", "Tüm aktif"],
  ] as const;
  return adlar.map(([ad, tur, segment], i) => {
    const r = prng(tohumla(`kmp-${i}`));
    const gonderim = tamsayi(r, 800, 12000);
    return {
      id: `kmp_${i}`, ad, tur: tur as Kampanya["tur"], segment,
      gonderim, acilma: Math.round(gonderim * (0.3 + normal(r) * 0.3)), tiklama: Math.round(gonderim * (0.08 + normal(r) * 0.1)),
      donusum: Math.round(gonderim * (0.02 + normal(r) * 0.03)), gelir: tamsayi(r, 2000, 40000),
      durum: agirlikliSec(r, [["aktif", 40], ["tamamlandi", 35], ["zamanlandi", 15], ["taslak", 10]] as const),
    };
  });
}

/* ── CMS: Presetler ── */
export interface Preset {
  id: string;
  ad: string;
  kategori: string;
  model: string;
  tier: string;
  kullanim: number;
  donusum: number;
  durum: "yayında" | "taslak" | "zamanlandı";
}

export function presetler(): Preset[] {
  const adlar = ["Sinematik Portre", "Neon Cyberpunk", "Ürün Stüdyo", "Moda Editoryal", "3D Karakter", "Explainer Video", "Viral Hook", "Estetik Reel"];
  const kat = ["Portre", "Sinematik", "Ürün", "Moda", "3D", "Video"];
  return adlar.map((ad, i) => {
    const r = prng(tohumla(`preset-${i}`));
    return {
      id: `pr_${i}`, ad, kategori: sec(r, kat), model: sec(r, ["Seedance 2.0", "Veo 3.1", "Ruh 2.0", "Nano Banana Pro"]),
      tier: sec(r, ["Tümü", "Artı+", "Ultra"]), kullanim: tamsayi(r, 500, 45000), donusum: +(2 + normal(r) * 8).toFixed(1),
      durum: agirlikliSec(r, [["yayında", 70], ["taslak", 20], ["zamanlandı", 10]] as const),
    };
  }).sort((a, b) => b.kullanim - a.kullanim);
}

/* ── CMS: Blog/SEO sayfaları ── */
export interface BlogSayfa {
  id: string;
  baslik: string;
  dil: string;
  durum: "yayında" | "taslak";
  goruntulenme: number;
  seoSkor: number;
}

export function blogSayfalar(): BlogSayfa[] {
  const basliklar = ["AI Video Üretmenin 10 Yolu", "Sinematik İçerik Rehberi", "Yapay Zeka ile Reklam", "3D Modelleme Başlangıç", "Ses Klonlama Nedir?", "Prompt Yazma Sanatı"];
  return basliklar.map((baslik, i) => {
    const r = prng(tohumla(`blog-${i}`));
    return { id: `bl_${i}`, baslik, dil: sec(r, ["TR", "EN"]), durum: agirlikliSec(r, [["yayında", 75], ["taslak", 25]] as const), goruntulenme: tamsayi(r, 500, 24000), seoSkor: tamsayi(r, 65, 98) };
  });
}

/* ── CMS: Duyurular ── */
export interface Duyuru {
  id: string;
  metin: string;
  hedef: string;
  tur: "banner" | "changelog" | "bakim";
  aktif: boolean;
  baslangic: number;
  bitis: number;
}

export function duyurular(): Duyuru[] {
  return [
    { id: "d1", metin: "Yeni model: Seedance 2.0 4K yayında!", hedef: "Tüm kullanıcılar", tur: "banner", aktif: true, baslangic: BUGUN - 3 * GUN, bitis: BUGUN + 7 * GUN },
    { id: "d2", metin: "v2.4 sürüm notları — 3D Stüdyo iyileştirmeleri", hedef: "Aktif kullanıcılar", tur: "changelog", aktif: true, baslangic: BUGUN - GUN, bitis: BUGUN + 30 * GUN },
    { id: "d3", metin: "Planlı bakım: 28 Tem 03:00-04:00", hedef: "Tüm kullanıcılar", tur: "bakim", aktif: false, baslangic: BUGUN + GUN, bitis: BUGUN + GUN },
  ];
}

/* ── Showcase ── */
export function showcase(evren: AdminEvren): { id: string; kullanici: string; etkilesim: number; secili: boolean }[] {
  return Array.from({ length: 9 }, (_, i) => {
    const r = prng(tohumla(`show-${i}`));
    const k = sec(r, evren.kullanicilar);
    return { id: `sc_${i}`, kullanici: k.ad, etkilesim: tamsayi(r, 1000, 50000), secili: r() > 0.6 };
  }).sort((a, b) => b.etkilesim - a.etkilesim);
}
