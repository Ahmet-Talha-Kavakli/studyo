/**
 * Ses Stüdyosu verisi — Higgsfield Audio birebir Türkçe.
 * Sesler, diller, modlar, modeller. SSR güvenli (statik).
 */

export type SesMod = "seslendirme" | "sesdegistir" | "ceviri";

export interface SesModel {
  ad: string;
  cinsiyet: "Kadın" | "Erkek";
  renk: string;   // gradyan blok rengi
  dil: string;
}

/** Ses modeli (Higgsfield birebir: ad + açıklama). */
export interface SesUretimModeli { ad: string; ozet: string }

/** Ses kütüphanesi — Higgsfield birebir 40+ ses (her biri farklı renk bloğu).
 *  cyan/mavi ton kalmadı; renkler çeşitli sıcak/soğuk (Higgsfield gibi). */
export const SESLER: SesModel[] = [
  { ad: "ROXIE", cinsiyet: "Kadın", renk: "#34d399", dil: "İngilizce" },
  { ad: "ARTHUR", cinsiyet: "Erkek", renk: "#fb923c", dil: "İngilizce" },
  { ad: "CILLIAN", cinsiyet: "Erkek", renk: "#f87171", dil: "İngilizce" },
  { ad: "BROOKS", cinsiyet: "Erkek", renk: "#a3e635", dil: "İngilizce" },
  { ad: "TALLULAH", cinsiyet: "Kadın", renk: "#4ade80", dil: "İngilizce" },
  { ad: "HANA", cinsiyet: "Kadın", renk: "#2dd4bf", dil: "Japonca" },
  { ad: "GIDEON", cinsiyet: "Erkek", renk: "#e11d8f", dil: "İngilizce" },
  { ad: "ROMAN", cinsiyet: "Erkek", renk: "#a78bfa", dil: "İngilizce" },
  { ad: "SKYE", cinsiyet: "Kadın", renk: "#facc15", dil: "İngilizce" },
  { ad: "MABEL", cinsiyet: "Kadın", renk: "#f472b6", dil: "İngilizce" },
  { ad: "STERLING", cinsiyet: "Erkek", renk: "#94a3b8", dil: "İngilizce" },
  { ad: "MAYA", cinsiyet: "Kadın", renk: "#fbbf24", dil: "İngilizce" },
  { ad: "QUINN", cinsiyet: "Kadın", renk: "#c084fc", dil: "İngilizce" },
  { ad: "HARRISON", cinsiyet: "Erkek", renk: "#22c55e", dil: "İngilizce" },
  { ad: "HUGO", cinsiyet: "Erkek", renk: "#fb7185", dil: "İngilizce" },
  { ad: "LEO", cinsiyet: "Erkek", renk: "#fbbf24", dil: "İngilizce" },
  { ad: "IMOGEN", cinsiyet: "Kadın", renk: "#a3e635", dil: "İngilizce" },
  { ad: "ZOE", cinsiyet: "Kadın", renk: "#f9a8d4", dil: "İngilizce" },
  { ad: "ALISTAIR", cinsiyet: "Erkek", renk: "#facc15", dil: "İngilizce" },
  { ad: "KEVIN", cinsiyet: "Erkek", renk: "#84cc16", dil: "İngilizce" },
  { ad: "HARPER", cinsiyet: "Kadın", renk: "#fdba74", dil: "İngilizce" },
  { ad: "GIA", cinsiyet: "Kadın", renk: "#f472b6", dil: "İngilizce" },
  { ad: "SLOANE", cinsiyet: "Kadın", renk: "#e879f9", dil: "İngilizce" },
  { ad: "CASPIAN", cinsiyet: "Erkek", renk: "#4ade80", dil: "İngilizce" },
  { ad: "LUNA", cinsiyet: "Kadın", renk: "#c4b5fd", dil: "İngilizce" },
  { ad: "JULIAN", cinsiyet: "Erkek", renk: "#fb923c", dil: "İngilizce" },
  { ad: "VESPER", cinsiyet: "Kadın", renk: "#f43f5e", dil: "İngilizce" },
  { ad: "MARK", cinsiyet: "Erkek", renk: "#a3e635", dil: "İngilizce" },
  { ad: "AVA", cinsiyet: "Kadın", renk: "#fde047", dil: "İngilizce" },
  { ad: "ZANE", cinsiyet: "Erkek", renk: "#f87171", dil: "İngilizce" },
  { ad: "ORION", cinsiyet: "Erkek", renk: "#4ade80", dil: "İngilizce" },
  { ad: "ANDRE", cinsiyet: "Erkek", renk: "#fbbf24", dil: "İngilizce" },
  { ad: "ISABELLA", cinsiyet: "Kadın", renk: "#f9a8d4", dil: "İngilizce" },
  { ad: "VLAD", cinsiyet: "Erkek", renk: "#94a3b8", dil: "İngilizce" },
  { ad: "XAVIER", cinsiyet: "Erkek", renk: "#a78bfa", dil: "İngilizce" },
  { ad: "ELENA", cinsiyet: "Kadın", renk: "#fb7185", dil: "İngilizce" },
  { ad: "NORA", cinsiyet: "Kadın", renk: "#bef264", dil: "İngilizce" },
  { ad: "TASHA", cinsiyet: "Kadın", renk: "#fbbf24", dil: "İngilizce" },
  { ad: "WILDER", cinsiyet: "Erkek", renk: "#84cc16", dil: "İngilizce" },
  { ad: "SIENNA", cinsiyet: "Kadın", renk: "#fdba74", dil: "İngilizce" },
  // Türkçe eklemeler
  { ad: "ELIF", cinsiyet: "Kadın", renk: "#a3e635", dil: "Türkçe" },
  { ad: "KEREM", cinsiyet: "Erkek", renk: "#84cc16", dil: "Türkçe" },
  { ad: "DEFNE", cinsiyet: "Kadın", renk: "#f472b6", dil: "Türkçe" },
  { ad: "MERT", cinsiyet: "Erkek", renk: "#facc15", dil: "Türkçe" },
];

/** Ses adı → ascii slug (gerçek görsel dosya adı için). */
function sesSlug(ad: string): string {
  return ad.toLowerCase()
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/İ/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-");
}
/** Sesin GERÇEK avatar portresi (cinsiyet+dile uygun üretildi): /gercek/ses/<slug>.webp */
export function sesGorsel(ad: string): string {
  return `/gercek/ses/${sesSlug(ad)}.webp`;
}

/** Diller — Higgsfield birebir 22 dil (bayrak + ad). */
export const DILLER = [
  { ad: "İNGİLİZCE", bayrak: "🇺🇸" },
  { ad: "TÜRKÇE", bayrak: "🇹🇷" },
  { ad: "ÇİNCE", bayrak: "🇨🇳" },
  { ad: "FRANSIZCA", bayrak: "🇫🇷" },
  { ad: "HİNTÇE", bayrak: "🇮🇳" },
  { ad: "İTALYANCA", bayrak: "🇮🇹" },
  { ad: "JAPONCA", bayrak: "🇯🇵" },
  { ad: "KORECE", bayrak: "🇰🇷" },
  { ad: "PORTEKİZCE", bayrak: "🇵🇹" },
  { ad: "RUSÇA", bayrak: "🇷🇺" },
  { ad: "İSPANYOLCA", bayrak: "🇪🇸" },
  { ad: "ALMANCA", bayrak: "🇩🇪" },
  { ad: "ARAPÇA", bayrak: "🇸🇦" },
  { ad: "LEHÇE", bayrak: "🇵🇱" },
  { ad: "ENDONEZCE", bayrak: "🇮🇩" },
  { ad: "FİLİPİNCE", bayrak: "🇵🇭" },
  { ad: "İSVEÇÇE", bayrak: "🇸🇪" },
  { ad: "FİNCE", bayrak: "🇫🇮" },
  { ad: "HOLLANDACA", bayrak: "🇳🇱" },
  { ad: "UKRAYNACA", bayrak: "🇺🇦" },
  { ad: "YUNANCA", bayrak: "🇬🇷" },
  { ad: "ÇEKÇE", bayrak: "🇨🇿" },
];

export const SES_MODLARI: { id: SesMod; ad: string; ozet: string }[] = [
  { id: "seslendirme", ad: "Seslendirme", ozet: "Metinden konuşma üret" },
  { id: "sesdegistir", ad: "Ses Değiştir", ozet: "Bir sesi başka bir sese dönüştür" },
  { id: "ceviri", ad: "Çeviri", ozet: "Videonun sesini başka dile çevir" },
];

/** Ses üretim modelleri — Higgsfield birebir (ad + açıklama). */
export const SES_URETIM_MODELLERI: SesUretimModeli[] = [
  { ad: "Seed Audio 1.0", ozet: "Konuşma + ortam sesli çok-konuşmacılı sahneler" },
  { ad: "Eleven v3", ozet: "Satır-içi etiketlerle duygu ve tonlama kontrolü" },
  { ad: "MiniMax Speech 2.8 HD", ozet: "Yüksek sadakatli tek-ses anlatım" },
  { ad: "VibeVoice", ozet: "Sesli kitap ve podcast için uzun-form anlatım" },
  { ad: "Seed Speech", ozet: "30+ dilde çok dilli konuşma" },
];
// Geriye dönük uyumluluk (eski sadece ad listesi).
export const SES_MODELLERI = SES_URETIM_MODELLERI.map((m) => m.ad);
