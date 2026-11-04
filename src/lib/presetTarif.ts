/* Preset stüdyosu — yapılandırılmış tarifin parçaları ve derleyicisi.
   Kullanıcı özneye ne olduğunu kendi cümlesiyle yazar; kamera, atmosfer, tempo ve kimlik koruma
   seçimleri modelin iyi anladığı sabit İngilizce kalıplarla eklenir. Derlenen metin olduğu gibi gösterilir. */
import type { TarifYapisi } from "@/store/usePresetler";

export const KAMERALAR = [
  { id: "sabit", ad: "Sabit", ipucu: "Kamera kıpırdamaz", en: "Locked-off static camera." },
  { id: "yaklas", ad: "Yavaş yaklaş", ipucu: "Özneye doğru süzülür", en: "The camera slowly pushes in toward the subject." },
  { id: "uzaklas", ad: "Uzaklaş", ipucu: "Geri çekilip ortamı açar", en: "The camera slowly pulls back to reveal the surroundings." },
  { id: "yorunge", ad: "360° yörünge", ipucu: "Öznenin etrafında döner", en: "The camera orbits 360 degrees around the subject." },
  { id: "crash", ad: "Crash zoom", ipucu: "Ani, sert yakınlaşma", en: "A sudden crash zoom onto the subject's face." },
  { id: "fpv", ad: "FPV dalış", ipucu: "Drone gibi hızla dalar", en: "A fast FPV drone dive that swoops in toward the subject." },
  { id: "el", ad: "El kamerası", ipucu: "Hafif sarsıntılı, belgesel", en: "Handheld camera with subtle natural shake." },
  { id: "vinc", ad: "Vinç yukarı", ipucu: "Aşağıdan yukarı yükselir", en: "A crane shot rising from low angle to high above the subject." },
  { id: "dolly-zoom", ad: "Dolly zoom", ipucu: "Arka plan esner (vertigo)", en: "A dolly zoom where the background stretches while the subject stays the same size." },
] as const;

export const ATMOSFERLER = [
  { id: "sinematik", ad: "Sinematik ışık", en: "cinematic lighting" },
  { id: "altin", ad: "Altın saat", en: "warm golden-hour light" },
  { id: "neon", ad: "Neon gece", en: "neon-lit night atmosphere" },
  { id: "karanlik", ad: "Karanlık, gerilimli", en: "dark, tense mood" },
  { id: "ruya", ad: "Rüya gibi", en: "dreamy, ethereal haze" },
  { id: "studyo", ad: "Temiz stüdyo", en: "clean studio background" },
  { id: "vfx", ad: "Parçacık ve VFX", en: "particles and polished VFX" },
  { id: "retro", ad: "Retro film", en: "retro film grain look" },
] as const;

export const TEMPOLAR = [
  { id: "agir", ad: "Ağır çekim", en: "slow motion" },
  { id: "dogal", ad: "Doğal", en: "smooth natural motion" },
  { id: "enerjik", ad: "Hızlı, enerjik", en: "fast energetic pacing" },
] as const;

export const KIMLIK_CUMLESI = "Keep the subject's original face, hairstyle, skin tone, body proportions and identity unchanged.";

/** Yapıdan modele giden tarifi derler (elle düzenleme varsa o kullanılır). */
export function tarifDerle(y: TarifYapisi): string {
  if (y.elle?.trim()) return y.elle.trim();
  const eylem = y.eylem.trim().replace(/\s+/g, " ");
  if (!eylem) return "";
  const parca = [/[.!?]$/.test(eylem) ? eylem : `${eylem}.`];
  const k = KAMERALAR.find((x) => x.id === y.kamera);
  if (k) parca.push(k.en);
  const atm = y.atmosfer.map((a) => ATMOSFERLER.find((x) => x.id === a)?.en).filter(Boolean);
  const t = TEMPOLAR.find((x) => x.id === y.tempo);
  const stil = [...atm, t?.en].filter(Boolean);
  if (stil.length) parca.push(`Style: ${stil.join(", ")}.`);
  if (y.kimlik) parca.push(KIMLIK_CUMLESI);
  parca.push("8 seconds.");
  return parca.join(" ");
}

export const BOS_YAPI: TarifYapisi = { eylem: "", kamera: "yaklas", atmosfer: ["sinematik"], tempo: "dogal", kimlik: true };

/**
 * Özneyi tanımlayan kelimeler: preset her fotoğrafa uymalı. PixVerse şablon rehberindeki
 * kural: "özneyi değil, öznenin ne yaptığını tarif et".
 */
const OZNE_KELIMELERI = /\b(kadın|kadin|adam|erkek|kız|kiz|oğlan|oglan|sarışın|sarisin|esmer|kızıl|gözlüklü|gozluklu|sakallı|sakalli|kel|uzun saçlı|kısa saçlı|woman|man|girl|boy|blonde|bearded)\b/i;
export function ozneUyarisi(metin: string): string | null {
  const m = metin.match(OZNE_KELIMELERI);
  return m ? m[0] : null;
}

/** Fikir şablonları — sıfırdan başlamak istemeyenler için. */
export const FIKIRLER: { ad: string; ozet: string; kategori: string; kapak: string; yapi: TarifYapisi }[] = [
  {
    ad: "Neon Yağmur", ozet: "Yağmurlu neon sokakta kameraya doğru yürüyüş", kategori: "SİNEMATİK", kapak: "/gercek/kesfet/cyberpunk-sokak-yagmurusora-2.webp",
    yapi: { eylem: "Özne yağmurlu, neon ışıklı bir sokakta kameraya doğru kendinden emin yürür, ışıklar ıslak zemine yansır", kamera: "uzaklas", atmosfer: ["neon", "sinematik"], tempo: "dogal", kimlik: true },
  },
  {
    ad: "Süper Kahraman", ozet: "Gökten iner, etrafa enerji dalgası yayılır", kategori: "AKSİYON", kapak: "/gercek/sinema/ps-bullet.webp",
    yapi: { eylem: "Özne zırhlı bir kahraman olarak gökyüzünden yere iner, çevresine enerji dalgası yayılır ve kameraya doğru ilerler", kamera: "vinc", atmosfer: ["sinematik", "vfx"], tempo: "agir", kimlik: true },
  },
  {
    ad: "Kristal Dönüşüm", ozet: "Ayaktan başlayıp buz kristaline dönüşür", kategori: "DÖNÜŞÜM", kapak: "/gercek/sinema/ps-freezing.webp",
    yapi: { eylem: "Özne ayaklarından başlayarak parıldayan buz kristaline dönüşür, kristaller yukarı tırmanır ve son anda gözlerini açar", kamera: "yorunge", atmosfer: ["vfx", "ruya"], tempo: "agir", kimlik: true },
  },
  {
    ad: "Retro Klip", ozet: "90'lar müzik klibi gibi ritimle poz verir", kategori: "VIRAL", kapak: "/gercek/sinema/ps-rapflex.webp",
    yapi: { eylem: "Özne 90'lar müzik klibi tarzında kameraya poz verir, ritme uygun el hareketleri yapar, arkada renkli ışıklar yanıp söner", kamera: "el", atmosfer: ["retro", "neon"], tempo: "enerjik", kimlik: true },
  },
  {
    ad: "Uzayda Süzülüş", ozet: "Astronot olarak yıldızların arasında süzülür", kategori: "UZAY", kapak: "/gercek/sinema/ps-earthzoom.webp",
    yapi: { eylem: "Özne astronot kıyafetiyle uzayda ağır çekimde süzülür, arkada Dünya ve gezegenler görünür, sonra kameraya döner", kamera: "yaklas", atmosfer: ["sinematik", "ruya"], tempo: "agir", kimlik: true },
  },
  {
    ad: "Işık Festivali", ozet: "Gece festivalinde fenerler göğe yükselir", kategori: "VIRAL", kapak: "/gercek/kesfet/isik-festivaliechostudio.webp",
    yapi: { eylem: "Özne gece bir ışık festivalinde durur, etrafındaki fenerler yavaşça göğe yükselir ve renkli ışıklar yüzüne vurur", kamera: "yaklas", atmosfer: ["sinematik", "ruya"], tempo: "dogal", kimlik: true },
  },
];

/** Test fotoğrafları — farklı yüzlerle tutarlılığı denemek için hazır set. */
export const TEST_FOTOLARI = ["Aria", "Emma", "Kai", "Leo", "Sofia", "Talha"].map((ad) => ({ ad, url: `/gercek/gorsel/gorsel-karakter-${ad}.webp` }));
