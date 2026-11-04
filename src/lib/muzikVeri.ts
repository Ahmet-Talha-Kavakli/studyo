/**
 * Müzik Stüdyosu verisi — modeller, bölüm planı, stil önerileri, örnekler. SSR güvenli.
 *
 * Modeller sağlayıcı belgeleriyle doğrulandı:
 *  • ElevenLabs Music — POST /v1/music/detailed (music_v1 · music_v2 · music_v2_5),
 *    süre 3 sn–10 dk, bölüm planı (/v1/music/plan, ücretsiz), stem ayırma.
 *  • Google Lyria — Gemini API /v1beta/interactions (lyria-3-clip-preview: 30 sn,
 *    lyria-3.5: tam şarkı). Süre ve yapı istem metniyle yönlendirilir.
 */

export type MuzikSaglayici = "eleven" | "lyria";

export interface MuzikModeli {
  ad: string;
  saglayici: MuzikSaglayici;
  ozet: string;
  /** Süre seçimi: aralık (sn) ya da sabit. Lyria 3.5'te süre istemle yönlendirilir. */
  sure: { tur: "aralik"; min: number; max: number } | { tur: "sabit"; sn: number } | { tur: "istem" };
  /** Bölüm planı (her bölüm için süre, söz ve stil) destekliyor mu. */
  plan?: boolean;
  /** Hariç tutulacak stilleri ayrı parametre olarak alıyor mu (yoksa istem metnine yazılır). */
  negatif?: boolean;
  rozet?: "Yeni";
}

export const MUZIK_MODELLERI: MuzikModeli[] = [
  { ad: "Eleven Music v2.5", saglayici: "eleven", ozet: "En iyi kalite; vokal, söz ve bölüm planı", sure: { tur: "aralik", min: 3, max: 600 }, plan: true, negatif: true, rozet: "Yeni" },
  { ad: "Eleven Music v2", saglayici: "eleven", ozet: "Dengeli kalite ve hız; bölüm planı", sure: { tur: "aralik", min: 3, max: 600 }, plan: true, negatif: true },
  { ad: "Eleven Music v1", saglayici: "eleven", ozet: "İlk sürüm; bölüm süreleri esnetilebilir", sure: { tur: "aralik", min: 3, max: 600 }, plan: true, negatif: true },
  { ad: "Lyria 3.5", saglayici: "lyria", ozet: "Google · tam şarkı, vokal ve söz", sure: { tur: "istem" } },
  { ad: "Lyria 3 Clip", saglayici: "lyria", ozet: "Google · 30 saniyelik hızlı klip", sure: { tur: "sabit", sn: 30 } },
];
export const modelBul = (ad: string) => MUZIK_MODELLERI.find((m) => m.ad === ad) ?? MUZIK_MODELLERI[0];

/** Bölüm planı — Vayra'nın iç biçimi (sağlayıcı biçimine sunucuda çevrilir). */
export interface PlanBolumu { id: string; ad: string; sureMs: number; satirlar: string[]; pozitif: string[]; negatif: string[] }
export interface MuzikPlan { pozitif: string[]; negatif: string[]; bolumler: PlanBolumu[] }
export const BOLUM_MIN_MS = 3000;
export const BOLUM_MAX_MS = 120000;
export const PLAN_MAX_BOLUM = 30;
export const planSuresi = (p: MuzikPlan) => p.bolumler.reduce((n, b) => n + b.sureMs, 0);

/** Hazır şarkı yapıları (bölüm planı başlangıcı). */
export const YAPI_SABLONLARI: { ad: string; bolumler: [string, number][] }[] = [
  { ad: "Pop şarkı", bolumler: [["Intro", 8], ["Verse 1", 24], ["Pre-Chorus", 10], ["Chorus", 20], ["Verse 2", 24], ["Chorus", 20], ["Bridge", 16], ["Chorus", 20], ["Outro", 10]] },
  { ad: "Kısa reklam", bolumler: [["Intro", 4], ["Hook", 16], ["Outro", 6]] },
  { ad: "Enstrümantal yükseliş", bolumler: [["Intro", 15], ["Build", 25], ["Drop", 30], ["Breakdown", 20], ["Outro", 15]] },
  { ad: "Sosyal medya", bolumler: [["Hook", 6], ["Chorus", 15], ["Outro", 5]] },
];

/** Bölüm adına göre renk (zaman çizelgesi blokları). */
export function bolumRengi(ad: string): string {
  const a = ad.toLowerCase();
  if (a.includes("chorus") || a.includes("nakarat") || a.includes("hook") || a.includes("drop")) return "#f472b6";
  if (a.includes("pre")) return "#c084fc";
  if (a.includes("verse") || a.includes("kıta")) return "#60a5fa";
  if (a.includes("bridge") || a.includes("köprü") || a.includes("breakdown")) return "#fbbf24";
  if (a.includes("intro") || a.includes("giriş")) return "#34d399";
  if (a.includes("outro") || a.includes("çıkış")) return "#2dd4bf";
  if (a.includes("solo") || a.includes("build")) return "#fb923c";
  return "#94a3b8";
}

/** Söz editörü yapı etiketleri. */
export const SOZ_ETIKETLERI: { grup: string; etiketler: string[] }[] = [
  { grup: "Bölüm", etiketler: ["[Intro]", "[Verse]", "[Pre-Chorus]", "[Chorus]", "[Post-Chorus]", "[Bridge]", "[Hook]", "[Drop]", "[Breakdown]", "[Instrumental Break]", "[Solo]", "[Outro]"] },
  { grup: "Vokal", etiketler: ["[Male Vocal]", "[Female Vocal]", "[Duet]", "[Choir]", "[Whisper]", "[Rap]", "[Spoken Word]", "[Harmony]", "[Ad-lib]"] },
];

/** Stil öneri çipleri — kategorili (İngilizce stil adları sağlayıcıda daha isabetli). */
export const STIL_ONERILERI: { grup: string; stiller: string[] }[] = [
  { grup: "Tür", stiller: ["pop", "rock", "hip hop", "trap", "r&b", "lo-fi", "house", "techno", "synthwave", "jazz", "classical", "cinematic", "folk", "metal", "reggaeton", "afrobeats", "k-pop", "ambient", "drum and bass", "anatolian rock", "turkish pop", "arabesque"] },
  { grup: "Ruh hali", stiller: ["energetic", "melancholic", "romantic", "dark", "uplifting", "dreamy", "epic", "chill", "nostalgic", "aggressive", "playful", "mysterious"] },
  { grup: "Enstrüman", stiller: ["acoustic guitar", "electric guitar", "piano", "strings", "808 bass", "synth pads", "brass", "saz", "ney", "darbuka", "violin", "choir"] },
  { grup: "Vokal", stiller: ["female vocals", "male vocals", "duet", "raspy voice", "soft vocals", "powerful belting", "rap verses", "auto-tune"] },
  { grup: "Tempo / Ton", stiller: ["slow tempo", "mid tempo", "fast tempo", "90 bpm", "120 bpm", "140 bpm", "minor key", "major key"] },
];

/** Boş sayfadaki ilham kartları (gerçek kapak görselleriyle). */
export const MUZIK_ORNEKLERI: { ad: string; kapak: string; not: string; istem: string; stiller: string[]; enstrumantal?: boolean; sozler?: string }[] = [
  { ad: "Anadolu Psychedelia", not: "Fuzz gitar, saz ve 70'lerden kalma bir groove. Plak cızırtısı dahil.", kapak: "/gercek/muzik/ms-anadolu.webp", istem: "1970'lerin Anadolu rock'ından ilham alan psikedelik bir şarkı; fuzz gitar, saz ve groove'lu davul.", stiller: ["anatolian rock", "psychedelic", "saz", "fuzz guitar", "male vocals"] },
  { ad: "Neon Otoyol", not: "Gece yarısı, boş otoban, sonsuz synth. Hız sınırı yok.", kapak: "/gercek/muzik/ms-neon.webp", istem: "Gece şehir sürüşü için nostaljik synthwave; parlak synth'ler ve sabit 4/4 ritim.", stiller: ["synthwave", "retro", "driving", "synth pads", "110 bpm"], enstrumantal: true },
  { ad: "Yağmurlu Pencere", not: "Cama vuran yağmur, sıcak piyano. Ders çalışmanın en iyi bahanesi.", kapak: "/gercek/muzik/ms-rain.webp", istem: "Ders çalışmak için sakin lo-fi hip hop; yağmur sesi, sıcak piyano ve vinil cızırtısı.", stiller: ["lo-fi", "chill", "piano", "vinyl crackle", "80 bpm"], enstrumantal: true },
  { ad: "Gece Yarısı Kadife", not: "Kadife bir vokal, loş ışık. Mesajı yazıp silmelik.", kapak: "/gercek/muzik/ms-velvet.webp", istem: "Gece yarısı geçen yumuşak bir R&B baladı; kadife kadın vokal ve ince klavyeler.", stiller: ["r&b", "soul", "female vocals", "romantic", "slow tempo"] },
  { ad: "Kadeh Sesi", not: "Yaylılar ağlar, bağlama cevap verir. Dertli ama onurlu.", kapak: "/gercek/muzik/ms-kadeh.webp", istem: "Hüzünlü bir arabesk şarkı; yaylılar, bağlama ve dokunaklı erkek vokal.", stiller: ["arabesque", "turkish", "strings", "melancholic", "male vocals"] },
  { ad: "Durdurulamaz Enerji", not: "Drop gelmeden ısınma bitmez. Son sete kadar.", kapak: "/gercek/muzik/ms-unstoppable.webp", istem: "Spor salonu için yüksek enerjili elektronik bir parça; güçlü drop ve yükselişler.", stiller: ["edm", "energetic", "big room", "128 bpm"], enstrumantal: true },
  { ad: "Yaz Balkonu", not: "Soğuk çay, sıcak akşam, el çırpan bir nakarat.", kapak: "/gercek/muzik/ms-summer.webp", istem: "Neşeli bir Türkçe pop; yaz aşkı sözleri, akustik gitar ve el çırpma.", stiller: ["turkish pop", "upbeat", "acoustic guitar", "female vocals"], sozler: "[Verse]\nBalkonda güneş, elinde soğuk çay\nBu yaz bizimdir, unutma bunu ay\n\n[Chorus]\nYaz gelsin, gönül eğlensin\nSeninle her gün bayram olsun" },
  { ad: "Buz Salonu", not: "Uzak çanlar, geniş pad'ler. Zaman yavaşlar.", kapak: "/gercek/muzik/ms-ice.webp", istem: "Geniş ve soğuk bir ambient atmosfer; uzun pad'ler, uzak çanlar ve ince dokular.", stiller: ["ambient", "atmospheric", "ethereal", "slow tempo"], enstrumantal: true },
];
/** Stil kapakları — parçaya stil sözcüklerinden uygun görsel. */
export const KAPAKLAR = ["ms-amp", "ms-anadolu", "ms-brass", "ms-dust", "ms-ice", "ms-kadeh", "ms-neon", "ms-rain", "ms-street", "ms-summer", "ms-unstoppable", "ms-velvet"].map((k) => `/gercek/muzik/${k}.webp`);
const KAPAK_ESLEME: [RegExp, string][] = [
  [/anatolian|anadolu|saz|psychedel/i, "ms-anadolu"], [/synthwave|retro|neon|80s/i, "ms-neon"], [/lo-?fi|rain|yağmur/i, "ms-rain"],
  [/r&b|soul|velvet/i, "ms-velvet"], [/arabesk|arabesque/i, "ms-kadeh"], [/edm|house|techno|drop|energetic/i, "ms-unstoppable"],
  [/turkish pop|summer|yaz|pop/i, "ms-summer"], [/ambient|ethereal|ice/i, "ms-ice"], [/jazz|brass|swing/i, "ms-brass"],
  [/rock|metal|guitar/i, "ms-amp"], [/hip ?hop|trap|rap|street/i, "ms-street"], [/country|folk|western/i, "ms-dust"],
];
export function kapakSec(metin: string, tohum: number): string {
  const e = KAPAK_ESLEME.find(([r]) => r.test(metin));
  return e ? `/gercek/muzik/${e[1]}.webp` : KAPAKLAR[Math.abs(tohum) % KAPAKLAR.length];
}

/** Çıktı biçimleri (ElevenLabs output_format; Lyria MP3 döner). */
export const MUZIK_BICIMLERI: { id: string; ad: string; not: string }[] = [
  { id: "mp3_44100_128", ad: "MP3 · 128 kbps", not: "Standart" },
  { id: "mp3_48000_192", ad: "MP3 · 192 kbps", not: "Yüksek kalite" },
  { id: "mp3_48000_320", ad: "MP3 · 320 kbps", not: "En yüksek MP3" },
  { id: "opus_48000_128", ad: "Opus · 128 kbps", not: "Web için küçük" },
];

/**
 * Kredi: Eleven Music için başlayan her 30 sn 2 kredi (süre otomatikse 2 dk varsayılır);
 * Lyria 3 Clip 2, Lyria 3.5 6 kredi. Stem ayırma dakika başına 3 kredi.
 */
export function muzikKredi(model: string, sureSn: number | null): number {
  const m = modelBul(model);
  if (m.saglayici === "lyria") return m.sure.tur === "sabit" ? 2 : 6;
  return 2 * Math.max(1, Math.ceil((sureSn ?? 120) / 30));
}
export const stemKredi = (sn: number) => 3 * Math.max(1, Math.ceil(sn / 60));
export const MUZIK_KAYNAK_MB = 25;

/** İstemden okunur stil etiketleri — kullanıcı stil girmediğinde liste satırında başlığı
 *  tekrarlamak yerine tür/ruh hali/enstrüman gösterilir. Yalnız metinde geçenler döner. */
const TR_STIL: [RegExp, string][] = [
  [/akustik/, "acoustic"], [/balad/, "ballad"], [/hüzün|melankol|duygusal/, "melancholic"], [/neşeli|coşkulu|eğlenceli/, "upbeat"],
  [/sakin|huzur|rahatla/, "chill"], [/enerji/, "energetic"], [/epik|destansı/, "epic"], [/romantik|aşk/, "romantic"],
  [/karanlık|kasvet/, "dark"], [/nostalji/, "nostalgic"], [/piyano/, "piano"], [/gitar/, "guitar"], [/yaylı|keman/, "strings"],
  [/orkestra|sinematik/, "cinematic"], [/arabesk/, "arabesque"], [/türkçe pop|türk pop/, "turkish pop"], [/rap\b|hip.?hop/, "hip hop"],
  [/kadın vokal/, "female vocals"], [/erkek vokal/, "male vocals"], [/elektronik/, "electronic"], [/caz/, "jazz"], [/rock/, "rock"],
];
export function istemdenStiller(istem: string, max = 4): string[] {
  const t = istem.toLocaleLowerCase("tr");
  const bulunan = new Set<string>();
  for (const g of STIL_ONERILERI) for (const s of g.stiller) if (s.length > 2 && t.includes(s)) bulunan.add(s);
  for (const [r, s] of TR_STIL) if (r.test(t)) bulunan.add(s);
  return [...bulunan].slice(0, max);
}

/** Stil etiketlerinin Türkçe görünen adları — sağlayıcıya İngilizce gider (daha isabetli),
 *  arayüzde Türkçe görünür. Listede olmayan (kullanıcının yazdığı) etiket olduğu gibi gösterilir. */
const STIL_TR: Record<string, string> = {
  corporate: "Kurumsal", suspense: "Gerilim", trailer: "Fragman", documentary: "Belgesel", inspiring: "İlham verici", tension: "Gerilim",
  pop: "Pop", rock: "Rock", "hip hop": "Hip hop", trap: "Trap", "r&b": "R&B", "lo-fi": "Lo-fi", house: "House", techno: "Tekno",
  synthwave: "Synthwave", jazz: "Caz", classical: "Klasik", cinematic: "Sinematik", folk: "Folk", metal: "Metal", reggaeton: "Reggaeton",
  afrobeats: "Afrobeats", "k-pop": "K-pop", ambient: "Ambiyans", "drum and bass": "Drum & bass", "anatolian rock": "Anadolu rock",
  "turkish pop": "Türkçe pop", arabesque: "Arabesk", energetic: "Enerjik", melancholic: "Hüzünlü", romantic: "Romantik", dark: "Karanlık",
  uplifting: "Umut veren", dreamy: "Rüya gibi", epic: "Epik", chill: "Sakin", nostalgic: "Nostaljik", aggressive: "Sert", playful: "Oyuncu",
  mysterious: "Gizemli", "acoustic guitar": "Akustik gitar", "electric guitar": "Elektro gitar", piano: "Piyano", strings: "Yaylılar",
  "808 bass": "808 bas", "synth pads": "Synth pad", brass: "Nefesliler", saz: "Saz", ney: "Ney", darbuka: "Darbuka", violin: "Keman",
  choir: "Koro", "female vocals": "Kadın vokal", "male vocals": "Erkek vokal", duet: "Düet", "raspy voice": "Boğuk ses",
  "soft vocals": "Yumuşak vokal", "powerful belting": "Güçlü vokal", "rap verses": "Rap kıtaları", "auto-tune": "Auto-tune",
  "slow tempo": "Yavaş tempo", "mid tempo": "Orta tempo", "fast tempo": "Hızlı tempo", "minor key": "Minör", "major key": "Majör",
  acoustic: "Akustik", ballad: "Balad", upbeat: "Neşeli", guitar: "Gitar", electronic: "Elektronik", psychedelic: "Psikedelik",
  "fuzz guitar": "Fuzz gitar", retro: "Retro", driving: "Sürüş", "vinyl crackle": "Plak cızırtısı", soul: "Soul",
  turkish: "Türkçe", "big room": "Big room", atmospheric: "Atmosferik", ethereal: "Eterik",
};
export const stilEtiketi = (s: string) => STIL_TR[s.toLowerCase()] ?? s.replace(/ bpm$/i, " BPM");
