/**
 * Vayra Build ekip çalışması: istemci ve sunucunun ortak tipleri ve yardımcıları.
 * Kişiler istemciye sahip özetinin kendisiyle değil, ondan türetilen genel kimlikle gider (oz alanı).
 */
import type { EkipRol, ProjeErisim, ProjeTur } from "./tipler";

export const ROL_AD: Record<ProjeErisim, string> = { sahip: "Sahip", duzenleyici: "Düzenleyici", izleyici: "İzleyici" };
export const ROL_ACIKLAMA: Record<ProjeErisim, string> = {
  sahip: "Her şeyi yapar: ekibi, alan adlarını, GitHub bağlantısını ve ödeme anahtarlarını yönetir, projeyi siler.",
  duzenleyici: "Ajanla çalışır, kodu ve ayarları değiştirir, yayınlar.",
  izleyici: "Önizlemeyi, kodu ve sohbeti görür; değişiklik yapamaz.",
};
export const IZLEYICI_HATASI = "Bu projede yalnız görüntüleme iznin var.";

/** Davet süresi seçenekleri (gün). */
export const DAVET_SURELERI = [1, 7, 30] as const;
export const DAVET_SURE_SINIRI = 90;
export const davetYolu = (kod: string) => `/panel/build/davet/${kod}`;

export type EkipKisi = { oz: string; ad: string; rol: ProjeErisim; eklenme?: number; sen?: boolean };
export type EkipDavetGorunum = { kod: string; rol: EkipRol; olusturma: number; sonKullanma: number; tekKullanim?: boolean; kullanildi?: boolean; kullanim?: number };
export type EkipBilgisi = { rol: ProjeErisim; sen: string; sahip: EkipKisi; uyeler: EkipKisi[]; davetler?: EkipDavetGorunum[] };

export type DavetDurum = "gecerli" | "uye" | "sahip";
export type DavetHataKodu = "gecersiz" | "suresi-doldu" | "kullanildi";
export type DavetOnizleme = { proje: { id: string; ad: string; tur: ProjeTur; kapak?: string }; sahipAd: string; rol: EkipRol; sonKullanma: number; tekKullanim?: boolean; durum: DavetDurum; uyeSayisi: number };

/** Çalışma alanında şu an kim var. */
export type VarlikKisi = { oz: string; ad: string; sekme: string; rol: ProjeErisim; zaman: number; sen?: boolean };
export const VARLIK_ARALIK = 15_000;
export const VARLIK_SURE = 40_000;
export const SEKME_ADI: Record<string, string> = { sohbet: "Sohbet", onizleme: "Önizleme", kod: "Kod", veriler: "Bulut", buyume: "Büyüme", ayarlar: "Ayarlar" };
export const sekmeYeri = (s: string) => `${SEKME_ADI[s] ?? "Çalışma alanı"} sekmesinde`;

/** Görünen ad: boşlukları toparlar, 40 karakter. */
export function adTemizle(x: unknown): string {
  return typeof x === "string" ? x.replace(/\s+/g, " ").trim().slice(0, 40) : "";
}
/** Ajan rotası için: gövdedeki yazar alanı (boşsa hiç eklenmez). */
export function yazarAlani(g: unknown): { yazar?: string } {
  const y = adTemizle((g as { yazar?: unknown } | null)?.yazar);
  return y ? { yazar: y } : {};
}

/** "Ahmet Talha" → "AT", "ahmet" → "A". */
export function basHarfler(ad: string): string {
  const p = ad.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  const h = (s: string) => s.charAt(0).toLocaleUpperCase("tr-TR");
  return p.length === 1 ? h(p[0]) : h(p[0]) + h(p[p.length - 1]);
}

/** Kişiye sabit, yumuşak bir renk (kimlikten). Zemin ve yazı rengi çifti. */
const RENKLER: [string, string][] = [
  ["#16384a", "#9fe6ff"], ["#2f2450", "#cdb8ff"], ["#3d2a14", "#ffd59a"], ["#3e1b2a", "#ffb3cc"],
  ["#143a2c", "#9ff0c8"], ["#1d2c4f", "#a9c4ff"], ["#3a2418", "#ffbf9a"], ["#2d3814", "#d6f29a"],
];
export function kisiRengi(oz: string): { zemin: string; yazi: string } {
  let h = 0;
  for (let i = 0; i < oz.length; i++) h = (h * 31 + oz.charCodeAt(i)) >>> 0;
  const [zemin, yazi] = RENKLER[h % RENKLER.length];
  return { zemin, yazi };
}

/** "6 gün kaldı", "3 saat kaldı", "süresi doldu". */
export function kalanSure(son: number, simdi = Date.now()): string {
  const s = son - simdi;
  if (s <= 0) return "Süresi doldu";
  if (s >= 86_400_000) return `${Math.max(1, Math.round(s / 86_400_000))} gün kaldı`;
  const saat = Math.round(s / 3_600_000);
  if (saat >= 1) return `${saat} saat kaldı`;
  return `${Math.max(1, Math.round(s / 60_000))} dakika kaldı`;
}
