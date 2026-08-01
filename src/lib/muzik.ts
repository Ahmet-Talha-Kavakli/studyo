/**
 * Müzik / Şarkı stüdyosu veri katmanı (Suno / Udio / MusicGPT rakibi — Vayra tarzı).
 * Türler, ruh halleri, vokal profilleri, şarkı yapı etiketleri, AI modelleri,
 * örnek istemler, deterministik dalga formu üreticisi. SSR güvenli.
 */

/** Üretim modu — Basit (tek istem) veya Özel (söz + stil + gelişmiş kontrol). */
export type MuzikMod = "basit" | "ozel";

/** Müzik türleri — geniş, uluslararası + Türkçe/yerel. Her biri renk + emoji. */
export const MUZIK_TURLERI: { id: string; ad: string; emoji: string; renk: string }[] = [
  { id: "pop", ad: "Pop", emoji: "🎤", renk: "#ff5fa2" },
  { id: "rock", ad: "Rock", emoji: "🎸", renk: "#ef4444" },
  { id: "lofi", ad: "Lo-Fi", emoji: "🌙", renk: "#a78bfa" },
  { id: "hiphop", ad: "Hip-Hop", emoji: "🎧", renk: "#f59e0b" },
  { id: "trap", ad: "Trap", emoji: "🔥", renk: "#f97316" },
  { id: "elektronik", ad: "Elektronik", emoji: "⚡", renk: "#22d3ee" },
  { id: "house", ad: "House", emoji: "🏠", renk: "#38bdf8" },
  { id: "jazz", ad: "Jazz", emoji: "🎷", renk: "#eab308" },
  { id: "klasik", ad: "Klasik", emoji: "🎻", renk: "#c4b5fd" },
  { id: "akustik", ad: "Akustik", emoji: "🪕", renk: "#84cc16" },
  { id: "rnb", ad: "R&B", emoji: "💜", renk: "#c084fc" },
  { id: "metal", ad: "Metal", emoji: "🤘", renk: "#71717a" },
  { id: "reggae", ad: "Reggae", emoji: "🌴", renk: "#22c55e" },
  { id: "funk", ad: "Funk", emoji: "🕺", renk: "#fb923c" },
  { id: "sinematik", ad: "Sinematik", emoji: "🎬", renk: "#60a5fa" },
  { id: "arabesk", ad: "Arabesk", emoji: "🥀", renk: "#e11d48" },
  { id: "turkce-pop", ad: "Türkçe Pop", emoji: "⭐", renk: "#f472b6" },
  { id: "anadolu-rock", ad: "Anadolu Rock", emoji: "🪗", renk: "#d97706" },
  { id: "ambient", ad: "Ambient", emoji: "🌫️", renk: "#94a3b8" },
  { id: "kpop", ad: "K-Pop", emoji: "🌸", renk: "#f9a8d4" },
];

/** Ruh halleri (mood) — birden fazla seçilebilir. */
export const RUH_HALLERI = [
  "Enerjik", "Melankolik", "Romantik", "Hüzünlü", "Neşeli", "Epik", "Sakin",
  "Karanlık", "Rüya gibi", "Öfkeli", "Umutlu", "Nostaljik", "Gizemli", "Motive edici",
];

/** Vokal profilleri. */
export const VOKALLER = [
  { id: "kadin", ad: "Kadın vokal", ikon: "♀" },
  { id: "erkek", ad: "Erkek vokal", ikon: "♂" },
  { id: "duet", ad: "Düet", ikon: "⚥" },
  { id: "koro", ad: "Koro", ikon: "♪♪" },
  { id: "enstrumantal", ad: "Enstrümantal", ikon: "🎹" },
];

/** Şarkı yapı etiketleri — söz editörüne eklenen bölüm işaretleyicileri (Suno metadata). */
export const YAPI_ETIKETLERI = [
  "[Intro]", "[Verse]", "[Pre-Chorus]", "[Chorus]", "[Post-Chorus]",
  "[Bridge]", "[Verse 2]", "[Drop]", "[Hook]", "[Solo]", "[Guitar Solo]",
  "[Instrumental Break]", "[Breakdown]", "[Spoken Word]", "[Whisper]", "[Outro]",
];

/** Performans/vokal yönlendirme etiketleri (Suno tarzı satır-içi). */
export const VOKAL_ETIKETLERI = ["[Male]", "[Female]", "[Duet]", "[Choir]", "[Whisper]", "[Belt]", "[Rap]", "[Harmony]"];

/** Şarkı süreleri. */
export const SURELER = [
  { id: "kisa", ad: "Kısa", saniye: 30, ipucu: "~30 sn snippet" },
  { id: "orta", ad: "Standart", saniye: 120, ipucu: "~2 dk tam şarkı" },
  { id: "uzun", ad: "Uzun", saniye: 200, ipucu: "~3.5 dk uzatılmış" },
];

/** AI müzik modelleri (kendi markamız). */
export const MUZIK_MODELLERI = [
  { id: "vayra-muse-2", ad: "Vayra Muse 2", ipucu: "En yüksek kalite · vokal + enstrüman", rozet: "Yeni", kredi: 20 },
  { id: "vayra-muse-lite", ad: "Vayra Muse Lite", ipucu: "Hızlı taslak · düşük kredi", kredi: 8 },
  { id: "vayra-instrumental", ad: "Vayra Enstrümantal", ipucu: "Yalnızca enstrümantal · vokalsiz", kredi: 12 },
];

/** Tempo (BPM) aralıkları — hızlı seçim çipleri. */
export const TEMPOLAR = [
  { id: "yavas", ad: "Yavaş", bpm: 70 },
  { id: "orta", ad: "Orta", bpm: 100 },
  { id: "hizli", ad: "Hızlı", bpm: 128 },
  { id: "cok-hizli", ad: "Çok Hızlı", bpm: 160 },
];

/** Diller. */
export const MUZIK_DILLERI = ["Türkçe", "İngilizce", "İspanyolca", "Korece", "Japonca", "Fransızca", "Almanca", "Arapça"];

/** Örnek istemler (Basit mod ilham kartları). */
export const MUZIK_ORNEKLERI: { ad: string; istem: string; tur: string }[] = [
  { ad: "Gece sürüşü", istem: "gece şehir sürüşü için synthwave, nostaljik synth'ler, sabit 4/4 ritim", tur: "elektronik" },
  { ad: "Yağmurlu lo-fi", istem: "ders çalışmak için sakin lo-fi hip-hop, yağmur sesi, sıcak piyano", tur: "lofi" },
  { ad: "Yaz aşkı", istem: "neşeli türkçe pop, yaz aşkı sözleri, akustik gitar ve el çırpma", tur: "turkce-pop" },
  { ad: "Epik yükseliş", istem: "sinematik epik orkestra, koro, kahramanca yükseliş, davullar", tur: "sinematik" },
  { ad: "Karanlık trap", istem: "karanlık atmosferik trap, 808 bass, hi-hat roll, kasvetli melodi", tur: "trap" },
  { ad: "Akustik itiraf", istem: "hüzünlü akustik gitar baladı, kadın vokal, samimi kayıt", tur: "akustik" },
];

/** Şarkı sözü şablonu (Özel mod başlangıcı). */
export const SOZ_SABLONU = `[Verse]
Buraya ilk dize sözlerini yaz

[Chorus]
Nakarat sözlerini buraya yaz

[Verse 2]
İkinci bölüm sözleri`;

/**
 * Deterministik dalga formu (waveform) çubuk yükseklikleri — bir tohumdan (id/prompt)
 * SSR-güvenli üretilir. Çalar bileşeni bunu görselleştirir. 0..1 aralığında `adet` değer.
 */
export function dalgaFormu(tohum: string, adet = 64): number[] {
  let h = 2166136261;
  for (let i = 0; i < tohum.length; i++) { h ^= tohum.charCodeAt(i); h = Math.imul(h, 16777619); }
  const cikti: number[] = [];
  for (let i = 0; i < adet; i++) {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    const r = ((h >>> 0) % 1000) / 1000;
    // Ortada daha yüksek, uçlarda alçalan doğal zarf + rastgelelik.
    const zarf = Math.sin((i / adet) * Math.PI);
    cikti.push(Math.max(0.12, Math.min(1, 0.25 + r * 0.75 * (0.4 + zarf * 0.6))));
  }
  return cikti;
}

/** Süreyi 2:05 biçimine çevir. */
export function sureBicim(saniye: number): string {
  const d = Math.floor(saniye / 60);
  const s = Math.floor(saniye % 60);
  return `${d}:${String(s).padStart(2, "0")}`;
}

/** Nota (key) seçenekleri — gelişmiş/Studio kontrol. */
export const NOTA_KEYLERI = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** Enstrüman çipleri — Style/Studio panelinde seçilir. */
export const ENSTRUMANLAR = [
  "Piyano", "Akustik gitar", "Elektro gitar", "Bass", "Davul", "Synth", "Yaylılar",
  "Saksafon", "Trompet", "808", "Org", "Bağlama", "Ud", "Kanun", "Ney", "Vurmalılar",
];

/** Stem katmanları (ayırma / mikser). */
export const STEMLER: { id: "vokal" | "davul" | "bass" | "akor" | "melodi"; ad: string; ikon: string }[] = [
  { id: "vokal", ad: "Vokal", ikon: "mic" },
  { id: "melodi", ad: "Melodi / Lead", ikon: "music" },
  { id: "akor", ad: "Akorlar / Pad", ikon: "layers" },
  { id: "bass", ad: "Bass", ikon: "activity" },
  { id: "davul", ad: "Davul / Ritim", ikon: "drum" },
];

/** Şarkı düzenleme aksiyonları (post-üretim suite). */
export const DUZENLE_ARACLARI: { id: string; ad: string; ipucu: string; ikon: string; kredi: number }[] = [
  { id: "extend", ad: "Uzat", ipucu: "Şarkıyı +30 sn devam ettir", ikon: "repeat", kredi: 6 },
  { id: "cover", ad: "Cover", ipucu: "Aynı melodi, yeni stil", ikon: "shuffle", kredi: 10 },
  { id: "remix", ad: "Remix", ipucu: "Yeni bir varyasyon üret", ikon: "wand", kredi: 10 },
  { id: "replace", ad: "Bölüm Değiştir", ipucu: "Seçili bölümü yeniden üret", ikon: "replace", kredi: 8 },
  { id: "inpaint", ad: "Söz Düzelt", ipucu: "Ortadaki sözü değiştir (inpaint)", ikon: "edit", kredi: 8 },
  { id: "crop", ad: "Kırp", ipucu: "Baş/son kırp", ikon: "scissors", kredi: 0 },
  { id: "remaster", ad: "Remaster", ipucu: "Kaliteyi yükselt", ikon: "sparkles", kredi: 4 },
  { id: "stem", ad: "Stem Ayır", ipucu: "Vokal/bass/davul ayrı indir", ikon: "layers", kredi: 6 },
];

/** Ruh hali → enerji (yoğunluk) ve parlaklık eşlemesi (motor için). */
export function ruhEnerji(ruhHali: string[]): { yogunluk: number; parlaklik: number; minor: boolean } {
  const set = new Set(ruhHali);
  let yog = 0.5, par = 0.5;
  if (set.has("Enerjik") || set.has("Epik") || set.has("Öfkeli") || set.has("Motive edici")) yog += 0.3;
  if (set.has("Sakin") || set.has("Melankolik") || set.has("Rüya gibi") || set.has("Nostaljik")) yog -= 0.25;
  if (set.has("Neşeli") || set.has("Umutlu") || set.has("Romantik")) par += 0.25;
  if (set.has("Karanlık") || set.has("Gizemli") || set.has("Hüzünlü")) par -= 0.25;
  const minor = set.has("Melankolik") || set.has("Hüzünlü") || set.has("Karanlık") || set.has("Gizemli") || set.has("Öfkeli");
  return { yogunluk: Math.max(0.1, Math.min(1, yog)), parlaklik: Math.max(0.1, Math.min(1, par)), minor };
}

/** Tür → tipik BPM ve key önerisi (deterministik). */
export function turParametre(turId: string): { bpm: number; minor: boolean } {
  const map: Record<string, { bpm: number; minor: boolean }> = {
    lofi: { bpm: 78, minor: true }, ambient: { bpm: 70, minor: true }, jazz: { bpm: 96, minor: true },
    trap: { bpm: 140, minor: true }, hiphop: { bpm: 92, minor: true }, house: { bpm: 124, minor: false },
    elektronik: { bpm: 128, minor: false }, pop: { bpm: 112, minor: false }, rock: { bpm: 120, minor: false },
    metal: { bpm: 150, minor: true }, klasik: { bpm: 80, minor: true }, arabesk: { bpm: 88, minor: true },
    "turkce-pop": { bpm: 108, minor: false }, "anadolu-rock": { bpm: 118, minor: true }, sinematik: { bpm: 84, minor: true },
    reggae: { bpm: 90, minor: false }, funk: { bpm: 112, minor: false }, rnb: { bpm: 84, minor: true }, kpop: { bpm: 120, minor: false },
    akustik: { bpm: 96, minor: false },
  };
  return map[turId] ?? { bpm: 110, minor: false };
}

/** Persona — kaydedilmiş ses/stil kimliği (Suno Personas). */
export interface Persona {
  id: string;
  ad: string;
  tur: string;
  vokal: string;
  ruhHali: string[];
  key: string;
  bpm: number;
  aciklama?: string;
}

/** Başlangıç örnek personaları. */
export const HAZIR_PERSONALAR: Persona[] = [
  { id: "p-neon", ad: "Neon Gece", tur: "elektronik", vokal: "kadin", ruhHali: ["Nostaljik", "Rüya gibi"], key: "A", bpm: 118, aciklama: "Synthwave · retro kadın vokal" },
  { id: "p-arabesk", ad: "Yaralı Kalp", tur: "arabesk", vokal: "erkek", ruhHali: ["Hüzünlü", "Melankolik"], key: "D", bpm: 88, aciklama: "Klasik arabesk · dokunaklı erkek vokal" },
  { id: "p-trap", ad: "Sokak Kralı", tur: "trap", vokal: "erkek", ruhHali: ["Karanlık", "Öfkeli"], key: "F", bpm: 140, aciklama: "808 trap · agresif flow" },
];
