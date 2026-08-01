"use client";

import { create } from "zustand";
import { alanlariKoru } from "./gocHelper";
import { persist } from "zustand/middleware";

/* ============================================================
   useEarn — EARN.VAYRA kazanç platformunun BEYNİ.

   7 kazanç yolu (flow performans, sosyal paylaşım, referans, affiliate,
   bounty görev, marketplace, yarışma), tier/XP sistemi, bağlı hesaplar,
   başvuru/gönderim durum makineleri, cüzdan (kredi + ₺), çekim, destek.

   Ödül birimi: KREDI. Eşik üstü NAKİT çekim (₺). Her şey persist + gerçek.
   Admin (/admin/earn) moderasyon kuyruğunu bu store'dan okur/onaylar.
   ============================================================ */

// ── zaman/sabitler ──
export const KREDI_TL = 0.01;                 // 1 kredi = 0,01 ₺ (100 kredi = 1 ₺)
export const MIN_CEKIM = 50000;               // min çekim: 50.000 kredi = 500 ₺
export const now = () => Date.now();

// ── Tier sistemi ──
export type TierId = "tohum" | "yukselen" | "uretici" | "elit" | "efsane";
export interface Tier { id: TierId; ad: string; minXp: number; carpan: number; cekimLimiti: number; renk: string; rozet: string; }
export const TIERLER: Tier[] = [
  { id: "tohum",    ad: "Tohum",    minXp: 0,      carpan: 1.0,  cekimLimiti: 100000,  renk: "#86efac", rozet: "🌱" },
  { id: "yukselen", ad: "Yükselen", minXp: 25000,  carpan: 1.15, cekimLimiti: 250000,  renk: "#4ade80", rozet: "🌿" },
  { id: "uretici",  ad: "Üretici",  minXp: 100000, carpan: 1.35, cekimLimiti: 500000,  renk: "#22c55e", rozet: "🍀" },
  { id: "elit",     ad: "Elit",     minXp: 300000, carpan: 1.6,  cekimLimiti: 1000000, renk: "#16a34a", rozet: "🌳" },
  { id: "efsane",   ad: "Efsane",   minXp: 800000, carpan: 2.0,  cekimLimiti: 5000000, renk: "#15803d", rozet: "👑" },
];
export function tierBul(xp: number): Tier {
  let t = TIERLER[0];
  for (const x of TIERLER) if (xp >= x.minXp) t = x;
  return t;
}
export function sonrakiTier(xp: number): Tier | null {
  const i = TIERLER.findIndex((t) => xp < t.minXp);
  return i === -1 ? null : TIERLER[i];
}

// ── Ortak durum ──
export type Durum = "taslak" | "inceleniyor" | "onaylandi" | "reddedildi" | "odendi";
export type Platform = "instagram" | "tiktok" | "youtube" | "facebook";
export const PLATFORMLAR: { id: Platform; ad: string; renk: string }[] = [
  { id: "instagram", ad: "Instagram", renk: "#E1306C" },
  { id: "tiktok", ad: "TikTok", renk: "#00f2ea" },
  { id: "youtube", ad: "YouTube", renk: "#FF0000" },
  { id: "facebook", ad: "Facebook", renk: "#1877F2" },
];

// ── Görüntülenme paketleri (sosyal paylaşım tier'ları) ──
export interface GoruntulenmePaket { esik: number; ad: string; kredi: number; }
export const GORUNTULENME_PAKETLERI: GoruntulenmePaket[] = [
  { esik: 1000, ad: "1K", kredi: 500 },
  { esik: 10000, ad: "10K", kredi: 3000 },
  { esik: 100000, ad: "100K", kredi: 20000 },
  { esik: 1000000, ad: "1M", kredi: 150000 },
];
export function paketBul(goruntulenme: number): GoruntulenmePaket | null {
  let p: GoruntulenmePaket | null = null;
  for (const x of GORUNTULENME_PAKETLERI) if (goruntulenme >= x.esik) p = x;
  return p;
}

// ── Kayıt tipleri ──
export interface EarnHareket { id: string; tur: string; baslik: string; kredi: number; durum: Durum; tarih: number; not?: string; }
export interface BagliHesap { platform: Platform; kullaniciAdi: string; dogrulandi: boolean; takipci: number; tarih: number; }
export interface Paylasim { id: string; platform: Platform; link: string; kanitUrl: string | null; goruntulenme: number; kredi: number; durum: Durum; tarih: number; redNedeni?: string; }
export interface Referans { id: string; kod: string; davetEdilen: string; durum: "beklemede" | "katildi" | "uretti"; kredi: number; seviye: 1 | 2; tarih: number; }
export interface AffiliateSatis { id: string; musteri: string; plan: string; tutar: number; komisyon: number; durum: Durum; tarih: number; }
export interface Gorev { id: string; baslik: string; aciklama: string; odul: number; xp: number; sonTarih: number; kategori: string; kotaKalan: number; }
export interface GorevBasvuru { id: string; gorevId: string; baslik: string; teslimLink: string | null; durum: Durum; odul: number; tarih: number; redNedeni?: string; }
/** Marketplace preset — kullanım-başı gelir modeli.
 *  Biri preseti kullandığında: satisFiyati öder → Vayra %50 komisyon + model maliyeti düşülür → kalan üreticiye.
 *  ureticiPay = satisFiyati − (satisFiyati × KOMISYON) − modelMaliyet. */
export interface Preset {
  id: string; ad: string; aciklama: string; modelId: string; modelAd: string; modelMaliyet: number;
  satisFiyati: number; kullanim: number; kazanc: number; durum: "aktif" | "beklemede" | "pasif"; tarih: number; kategori: string;
}
export const MARKETPLACE_KOMISYON = 0.5; // Vayra %50
/** Bir kullanımda üreticiye kalan (negatifse fiyat yetersiz). */
export function ureticiPay(satisFiyati: number, modelMaliyet: number): number {
  return Math.round(satisFiyati - satisFiyati * MARKETPLACE_KOMISYON - modelMaliyet);
}
export interface Yarisma { id: string; ad: string; tema: string; odulHavuzu: number; bitis: number; katilimci: number; durum: "aktif" | "bitti"; }
export interface YarismaKatilim { id: string; yarismaId: string; ad: string; icerikLink: string; oy: number; siralama: number | null; durum: Durum; tarih: number; }
export interface Cekim { id: string; kredi: number; tl: number; yontem: "IBAN" | "PayPal" | "Papara"; hesap: string; durum: "inceleniyor" | "onaylandi" | "odendi" | "reddedildi"; tarih: number; redNedeni?: string; }
export interface DestekTalep { id: string; konu: string; kategori: string; mesaj: string; durum: "acik" | "yanitlandi" | "kapandi"; tarih: number; yanitlar: { kimden: "ben" | "ekip"; metin: string; tarih: number }[]; }

interface EarnState {
  xp: number;
  bagliHesaplar: BagliHesap[];
  paylasimlar: Paylasim[];
  referanslar: Referans[];
  affiliateSatislar: AffiliateSatis[];
  gorevBasvurular: GorevBasvuru[];
  presetler: Preset[];
  yarismaKatilimlar: YarismaKatilim[];
  cekimler: Cekim[];
  hareketler: EarnHareket[];
  destekTalepler: DestekTalep[];
  referansKodu: string;
  affiliateKodu: string;
  onboardTamam: boolean;
  flowAktarilan: number;   // Flow'dan hesaba aktarılan toplam kredi (tekrar aktarım engeli)

  // aksiyonlar
  hesapBagla: (platform: Platform, kullaniciAdi: string) => void;
  hesapDogrula: (platform: Platform) => void;
  hesapKaldir: (platform: Platform) => void;
  paylasimGonder: (p: { platform: Platform; link: string; kanitUrl: string | null; goruntulenme: number }) => string;
  referansOlustur: (davetEdilen: string) => void;
  gorevBasvur: (gorev: Gorev) => void;
  gorevTeslim: (basvuruId: string, link: string) => void;
  presetEkle: (p: { ad: string; aciklama: string; modelId: string; modelAd: string; modelMaliyet: number; satisFiyati: number; kategori: string }) => void;
  presetKaldir: (id: string) => void;
  presetDurumDegistir: (id: string) => void;
  yarismaKatil: (yarisma: Yarisma, link: string) => void;
  cekimTalep: (kredi: number, yontem: Cekim["yontem"], hesap: string) => boolean;
  destekAc: (konu: string, kategori: string, mesaj: string) => void;
  destekYanitla: (id: string, metin: string) => void;
  onboardBitir: () => void;
  kodGaranti: () => void;   // ilk mount'ta benzersiz referans/affiliate kodu üretir (SSR-güvenli)
  flowKazancAktar: (kredi: number) => void;   // Flow performans kazancını hesaba onaylı olarak aktarır

  // admin köprüsü (moderasyon)
  moderasyonOnayla: (kayitTur: "paylasim" | "gorev" | "cekim" | "yarisma", id: string) => void;
  moderasyonReddet: (kayitTur: "paylasim" | "gorev" | "cekim" | "yarisma", id: string, neden: string) => void;
}

let sc = 0;
const uid = (p: string) => { sc += 1; return `${p}_${sc}_${now().toString(36)}`; };
// SSR-güvenli sabit başlangıç kodu (Math.random SSR/hydration uyumsuzluğu yapıyordu).
// Gerçek benzersiz kod ilk mount'ta kodGaranti() ile üretilir.
const VARSAYILAN_KOD = "VAYRA1";
function rastKod() { return Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join(""); }

// örnek presetler (kullanıcının satıştaki ürünleri) — platform dolu görünsün
function seedPresetler(): Preset[] {
  return [
    { id: "pr_seed1", ad: "Altın Saat Portre", aciklama: "Sıcak ışıklı editorial portre presetim.", modelId: "ruh-2", modelAd: "Ruh 2", modelMaliyet: 4, satisFiyati: 40, kullanim: 128, kazanc: 128 * ureticiPay(40, 4), durum: "aktif", tarih: now() - 12 * 864e5, kategori: "Portre" },
    { id: "pr_seed2", ad: "Neon Şehir Estetiği", aciklama: "Siberpunk neon şehir sahnesi.", modelId: "flux-2", modelAd: "Flux 2", modelMaliyet: 5, satisFiyati: 60, kullanim: 74, kazanc: 74 * ureticiPay(60, 5), durum: "aktif", tarih: now() - 6 * 864e5, kategori: "Sahne" },
  ];
}

export const useEarn = create<EarnState>()(
  persist(
    (set, get) => ({
      xp: 42000, // demo: Yükselen tier'da başla ki platform dolu görünsün
      bagliHesaplar: [],
      paylasimlar: [],
      referanslar: [],
      affiliateSatislar: [],
      gorevBasvurular: [],
      presetler: seedPresetler(),
      yarismaKatilimlar: [],
      cekimler: [],
      hareketler: [
        { id: uid("hr"), tur: "flow", baslik: "Flow içerik performansı — Temmuz", kredi: 8400, durum: "onaylandi", tarih: now() - 3 * 864e5 },
        { id: uid("hr"), tur: "referans", baslik: "Referans bonusu · @mehmet3d", kredi: 2000, durum: "onaylandi", tarih: now() - 5 * 864e5 },
      ],
      destekTalepler: [],
      referansKodu: VARSAYILAN_KOD,
      affiliateKodu: VARSAYILAN_KOD,
      onboardTamam: false,
      flowAktarilan: 0,

      hesapBagla: (platform, kullaniciAdi) => set((s) => ({
        bagliHesaplar: [...s.bagliHesaplar.filter((h) => h.platform !== platform),
          { platform, kullaniciAdi: kullaniciAdi.replace("@", ""), dogrulandi: false, takipci: 1000 + Math.floor(Math.random() * 90000), tarih: now() }],
      })),
      hesapDogrula: (platform) => set((s) => ({
        bagliHesaplar: s.bagliHesaplar.map((h) => h.platform === platform ? { ...h, dogrulandi: true } : h),
      })),
      hesapKaldir: (platform) => set((s) => ({ bagliHesaplar: s.bagliHesaplar.filter((h) => h.platform !== platform) })),

      paylasimGonder: (p) => {
        const paket = paketBul(p.goruntulenme);
        const t = get();
        const tier = tierBul(t.xp);
        const kredi = paket ? Math.round(paket.kredi * tier.carpan) : 0;
        const id = uid("py");
        set((s) => ({
          paylasimlar: [{ id, platform: p.platform, link: p.link, kanitUrl: p.kanitUrl, goruntulenme: p.goruntulenme, kredi, durum: "inceleniyor", tarih: now() }, ...s.paylasimlar],
          hareketler: [{ id: uid("hr"), tur: "paylasim", baslik: `${p.platform} paylaşımı`, kredi, durum: "inceleniyor", tarih: now() }, ...s.hareketler],
        }));
        return id;
      },

      referansOlustur: (davetEdilen) => {
        const rid = uid("rf");
        set((s) => ({
          referanslar: [{ id: rid, kod: s.referansKodu, davetEdilen, durum: "beklemede", kredi: 2500, seviye: 1, tarih: now() }, ...s.referanslar],
        }));
        // demo: davet edilen kısa süre sonra katılır, sonra üretim yapar → kazanç hesaba düşer
        setTimeout(() => set((s) => ({ referanslar: s.referanslar.map((r) => r.id === rid ? { ...r, durum: "katildi" as const } : r) })), 4000);
        setTimeout(() => set((s) => ({
          referanslar: s.referanslar.map((r) => r.id === rid ? { ...r, durum: "uretti" as const } : r),
          hareketler: [{ id: uid("hr"), tur: "referans", baslik: `Referans kazancı · ${davetEdilen}`, kredi: 2500, durum: "onaylandi" as Durum, tarih: now() }, ...s.hareketler],
          xp: s.xp + 2500,
        })), 8000);
      },

      gorevBasvur: (gorev) => set((s) => ({
        gorevBasvurular: [{ id: uid("gb"), gorevId: gorev.id, baslik: gorev.baslik, teslimLink: null, durum: "taslak", odul: gorev.odul, tarih: now() }, ...s.gorevBasvurular],
      })),
      gorevTeslim: (basvuruId, link) => set((s) => ({
        gorevBasvurular: s.gorevBasvurular.map((b) => b.id === basvuruId ? { ...b, teslimLink: link, durum: "inceleniyor" } : b),
        hareketler: [{ id: uid("hr"), tur: "gorev", baslik: "Görev teslimi", kredi: s.gorevBasvurular.find((b) => b.id === basvuruId)?.odul ?? 0, durum: "inceleniyor", tarih: now() }, ...s.hareketler],
      })),

      presetEkle: (p) => set((s) => ({
        presetler: [{ id: uid("pr"), ad: p.ad, aciklama: p.aciklama, modelId: p.modelId, modelAd: p.modelAd, modelMaliyet: p.modelMaliyet, satisFiyati: p.satisFiyati, kullanim: 0, kazanc: 0, durum: "beklemede", tarih: now(), kategori: p.kategori }, ...s.presetler],
      })),
      presetKaldir: (id) => set((s) => ({ presetler: s.presetler.filter((p) => p.id !== id) })),
      presetDurumDegistir: (id) => set((s) => ({ presetler: s.presetler.map((p) => p.id === id ? { ...p, durum: p.durum === "aktif" ? "pasif" : "aktif" } : p) })),

      yarismaKatil: (yarisma, link) => set((s) => ({
        yarismaKatilimlar: [{ id: uid("yk"), yarismaId: yarisma.id, ad: yarisma.ad, icerikLink: link, oy: 0, siralama: null, durum: "inceleniyor", tarih: now() }, ...s.yarismaKatilimlar],
      })),

      cekimTalep: (kredi, yontem, hesap) => {
        const t = get();
        const kazanc = t.hareketler.filter((h) => h.durum === "onaylandi" && h.kredi > 0).reduce((a, h) => a + h.kredi, 0);
        const cekilen = t.cekimler.filter((c) => c.durum !== "reddedildi").reduce((a, c) => a + c.kredi, 0);
        const mevcut = Math.max(0, kazanc - cekilen);
        const tier = tierBul(t.xp);
        if (kredi < MIN_CEKIM || kredi > mevcut || kredi > tier.cekimLimiti) return false;
        const id = uid("ck");
        set((s) => ({
          cekimler: [{ id, kredi, tl: kredi * KREDI_TL, yontem, hesap, durum: "inceleniyor", tarih: now() }, ...s.cekimler],
          hareketler: [{ id: uid("hr"), tur: "cekim", baslik: `Çekim · ${yontem}`, kredi: -kredi, durum: "inceleniyor", tarih: now() }, ...s.hareketler],
        }));
        return true;
      },

      destekAc: (konu, kategori, mesaj) => {
        const tid = uid("dt");
        set((s) => ({
          destekTalepler: [{ id: tid, konu, kategori, mesaj, durum: "acik", tarih: now(), yanitlar: [{ kimden: "ben", metin: mesaj, tarih: now() }] }, ...s.destekTalepler],
        }));
        // demo: ekip kısa süre sonra karşılama yanıtı verir → durum "yanitlandi"
        setTimeout(() => set((s) => ({
          destekTalepler: s.destekTalepler.map((t) => t.id === tid ? {
            ...t, durum: "yanitlandi" as const,
            yanitlar: [...t.yanitlar, { kimden: "ekip" as const, metin: "Merhaba! Talebini aldık, ekibimiz inceliyor. En kısa sürede detaylı dönüş yapacağız. 💚", tarih: now() }],
          } : t),
        })), 3000);
      },
      destekYanitla: (id, metin) => set((s) => ({
        destekTalepler: s.destekTalepler.map((t) => t.id === id ? { ...t, durum: "acik", yanitlar: [...t.yanitlar, { kimden: "ben", metin, tarih: now() }] } : t),
      })),

      onboardBitir: () => set({ onboardTamam: true }),
      flowKazancAktar: (kredi) => set((s) => ({
        hareketler: [{ id: uid("hr"), tur: "flow", baslik: "Flow içerik kazancı hesaba aktarıldı", kredi, durum: "onaylandi" as Durum, tarih: now() }, ...s.hareketler],
        xp: s.xp + kredi,
        flowAktarilan: s.flowAktarilan + kredi,
      })),
      kodGaranti: () => set((s) => ({
        referansKodu: s.referansKodu === VARSAYILAN_KOD ? rastKod() : s.referansKodu,
        affiliateKodu: s.affiliateKodu === VARSAYILAN_KOD ? rastKod() : s.affiliateKodu,
      })),

      // ── admin moderasyonu (gerçek onay → kullanıcı tarafı güncellenir) ──
      moderasyonOnayla: (kayitTur, id) => set((s) => {
        if (kayitTur === "paylasim") return {
          paylasimlar: s.paylasimlar.map((p) => p.id === id ? { ...p, durum: "onaylandi" as Durum } : p),
          hareketler: s.hareketler.map((h) => h.tur === "paylasim" && h.durum === "inceleniyor" ? { ...h, durum: "onaylandi" as Durum } : h),
          xp: s.xp + (s.paylasimlar.find((p) => p.id === id)?.kredi ?? 0),
        };
        if (kayitTur === "cekim") return { cekimler: s.cekimler.map((c) => c.id === id ? { ...c, durum: "odendi" as const } : c) };
        if (kayitTur === "gorev") return { gorevBasvurular: s.gorevBasvurular.map((b) => b.id === id ? { ...b, durum: "onaylandi" as Durum } : b) };
        return { yarismaKatilimlar: s.yarismaKatilimlar.map((y) => y.id === id ? { ...y, durum: "onaylandi" as Durum } : y) };
      }),
      moderasyonReddet: (kayitTur, id, neden) => set((s) => {
        if (kayitTur === "paylasim") return { paylasimlar: s.paylasimlar.map((p) => p.id === id ? { ...p, durum: "reddedildi" as Durum, redNedeni: neden } : p) };
        if (kayitTur === "cekim") return { cekimler: s.cekimler.map((c) => c.id === id ? { ...c, durum: "reddedildi" as const, redNedeni: neden } : c) };
        if (kayitTur === "gorev") return { gorevBasvurular: s.gorevBasvurular.map((b) => b.id === id ? { ...b, durum: "reddedildi" as Durum, redNedeni: neden } : b) };
        return { yarismaKatilimlar: s.yarismaKatilimlar.map((y) => y.id === id ? { ...y, durum: "reddedildi" as Durum } : y) };
      }),
    }),
    { name: "vayra-earn", version: 1, migrate: alanlariKoru },
  ),
);

// ── türetilmiş hesaplar ──
/** Çekilebilir bakiye = onaylı kazanç − (inceleniyor/odendi çekimler). */
export function bakiye(hareketler: EarnHareket[], cekimler: Cekim[]): number {
  const kazanc = hareketler.filter((h) => h.durum === "onaylandi" && h.kredi > 0).reduce((a, h) => a + h.kredi, 0);
  const cekilen = cekimler.filter((c) => c.durum !== "reddedildi").reduce((a, c) => a + c.kredi, 0);
  return Math.max(0, kazanc - cekilen);
}
export function bekleyen(hareketler: EarnHareket[]): number {
  return hareketler.filter((h) => h.durum === "inceleniyor" && h.kredi > 0).reduce((a, h) => a + h.kredi, 0);
}
export function toplamKazanc(hareketler: EarnHareket[]): number {
  return hareketler.filter((h) => h.durum === "onaylandi" && h.kredi > 0).reduce((a, h) => a + h.kredi, 0);
}
export function tl(kredi: number): string {
  return (kredi * KREDI_TL).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
}
export function krediBic(n: number): string {
  return n.toLocaleString("tr-TR");
}
