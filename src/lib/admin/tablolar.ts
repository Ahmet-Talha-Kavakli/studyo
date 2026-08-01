/**
 * Admin sabit referans tabloları. Plan/model kaynağı = @/lib/catalog (tek doğruluk).
 * Provider/coğrafi/kaynak/kimlik havuzları seed'i besler.
 */
import { MODELLER as CATALOG_MODELLER, PLANLAR as CATALOG_PLANLAR } from "@/lib/catalog";

/* ── PLANLAR — catalog'tan türetilir, admin görünümüne uyarlanır. ──
   Not: useAuth plan enum'u (baslangic/arti/ultra/kurumsal) = catalog id'leri. */
export type PlanId = "baslangic" | "arti" | "ultra" | "kurumsal";

export interface AdminPlan {
  id: PlanId;
  ad: string;
  fiyatTRY: number;
  fiyatUSD: number;
  kredi: number;
}
export const PLANLAR: AdminPlan[] = CATALOG_PLANLAR.map((p) => ({
  id: p.id as PlanId,
  ad: p.ad,
  fiyatTRY: p.fiyatTRY,
  fiyatUSD: p.fiyatUSD,
  kredi: p.kredi,
}));

/* ── MODELLER — catalog + admin overlay (maliyet/durum). Kredi=catalog, maliyet türetilir. ── */
export interface AdminModel {
  id: string;
  ad: string;
  saglayici: string;
  tur: string;
  kredi: number; // üretim başına kredi (kullanıcıdan alınan)
  maliyetUsd: number; // provider birim maliyeti (bizim ödediğimiz)
  acik: boolean;
  rozet?: string;
}
/** Kredi başına ~0,08₺ maliyet varsayımıyla türetilmiş provider maliyeti (USD). */
export const MODELLER: AdminModel[] = CATALOG_MODELLER.map((m, i) => ({
  id: m.id,
  ad: m.ad,
  saglayici: m.saglayici,
  tur: m.tur,
  kredi: m.kredi,
  // maliyet ~ kredinin %40-70'i arası (deterministik, id uzunluğuna göre)
  maliyetUsd: +(m.kredi * (0.4 + ((m.id.length * 7) % 30) / 100) * 0.03).toFixed(3),
  acik: i % 17 !== 0, // birkaç model kapalı (gerçekçi)
  rozet: m.rozet,
}));

/* ── PROVIDERLAR ── */
export interface AdminProvider {
  id: string;
  ad: string;
  bakiyeUsd: number;
  alarmEsigiUsd: number;
  oncelik: number;
}
export const PROVIDERLAR: AdminProvider[] = [
  { id: "fal", ad: "fal.ai", bakiyeUsd: 1840, alarmEsigiUsd: 500, oncelik: 1 },
  { id: "kie", ad: "kie.ai", bakiyeUsd: 620, alarmEsigiUsd: 300, oncelik: 2 },
  { id: "replicate", ad: "Replicate", bakiyeUsd: 2450, alarmEsigiUsd: 800, oncelik: 3 },
  { id: "google", ad: "Google (Veo/Gemini)", bakiyeUsd: 3900, alarmEsigiUsd: 1000, oncelik: 1 },
  { id: "openai", ad: "OpenAI (Sora)", bakiyeUsd: 1520, alarmEsigiUsd: 600, oncelik: 2 },
  { id: "elevenlabs", ad: "ElevenLabs", bakiyeUsd: 410, alarmEsigiUsd: 200, oncelik: 1 },
];

/* ── KAYNAKLAR (UTM / edinim) ── */
export const KAYNAKLAR = [
  { id: "organik", ad: "Organik", kanal: "organic" },
  { id: "meta", ad: "Meta Ads", kanal: "paid" },
  { id: "tiktok", ad: "TikTok Ads", kanal: "paid" },
  { id: "google", ad: "Google Ads", kanal: "paid" },
  { id: "youtube", ad: "YouTube", kanal: "sosyal" },
  { id: "instagram", ad: "Instagram", kanal: "sosyal" },
  { id: "referans", ad: "Referans", kanal: "referral" },
  { id: "influencer", ad: "Influencer", kanal: "affiliate" },
] as const;

/* ── ÜLKELER (kullanıcı/gelir dağılımı ağırlıklı) ── */
export const ULKELER = [
  { kod: "TR", ad: "Türkiye", agirlik: 42, sehir: ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya"] },
  { kod: "US", ad: "ABD", agirlik: 14, sehir: ["New York", "Los Angeles", "Austin", "Miami"] },
  { kod: "DE", ad: "Almanya", agirlik: 8, sehir: ["Berlin", "Münih", "Hamburg"] },
  { kod: "GB", ad: "Birleşik Krallık", agirlik: 6, sehir: ["Londra", "Manchester"] },
  { kod: "FR", ad: "Fransa", agirlik: 5, sehir: ["Paris", "Lyon"] },
  { kod: "NL", ad: "Hollanda", agirlik: 4, sehir: ["Amsterdam", "Rotterdam"] },
  { kod: "AE", ad: "BAE", agirlik: 4, sehir: ["Dubai", "Abu Dabi"] },
  { kod: "SA", ad: "Suudi Arabistan", agirlik: 3, sehir: ["Riyad", "Cidde"] },
  { kod: "BR", ad: "Brezilya", agirlik: 3, sehir: ["São Paulo", "Rio"] },
  { kod: "IN", ad: "Hindistan", agirlik: 3, sehir: ["Mumbai", "Delhi", "Bangalore"] },
  { kod: "ES", ad: "İspanya", agirlik: 3, sehir: ["Madrid", "Barcelona"] },
  { kod: "IT", ad: "İtalya", agirlik: 2, sehir: ["Roma", "Milano"] },
] as const;

export const CIHAZLAR = ["Masaüstü", "Mobil", "Tablet"] as const;
export const TARAYICILAR = ["Chrome", "Safari", "Firefox", "Edge", "Samsung"] as const;
export const DILLER = ["tr", "en", "de", "fr", "es", "ar"] as const;
export const ISLETIM = ["macOS", "Windows", "iOS", "Android", "Linux"] as const;

/* ── Kimlik havuzları (deterministik kullanıcı üretimi) ── */
export const ADLAR = [
  "Ahmet", "Mehmet", "Elif", "Zeynep", "Can", "Deniz", "Aylin", "Burak", "Selin", "Kaan",
  "Ece", "Emre", "Merve", "Onur", "Nihan", "Berk", "İrem", "Mert", "Aslı", "Cem",
  "Liam", "Emma", "Noah", "Olivia", "Lucas", "Sophia", "Mateo", "Mia", "Leon", "Yuki",
  "Hana", "Omar", "Fatima", "Diego", "Luca", "Sofia", "Anna", "Max", "Nora", "Ali",
];
export const SOYADLAR = [
  "Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Aydın", "Öztürk", "Arslan", "Doğan", "Kılıç",
  "Smith", "Johnson", "Müller", "Rossi", "Dubois", "Silva", "Garcia", "Kim", "Tanaka", "Ali",
];

export const TICKET_KATEGORI = ["Ödeme", "Teknik", "Kredi", "Hesap", "Öneri", "Diğer"] as const;
export const FLAG_SEBEP = ["NSFW", "Şiddet", "Ünlü yüzü", "Telif", "Çocuk içeriği", "Blocklist"] as const;
export const IPTAL_SEBEP = ["Çok pahalı", "Yeterince kullanmadım", "Kalite yetersiz", "Rakibe geçtim", "Geçici ara", "Diğer"] as const;
