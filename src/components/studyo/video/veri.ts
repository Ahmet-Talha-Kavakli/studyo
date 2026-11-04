/* Video stüdyosunun verisi ve saf yardımcıları: hareket kütüphanesi, hızlı başlangıçlar,
   kredi hesabı, model eşleme. Bileşenlerden ayrı tutulur ki arayüz dosyası yalnız arayüz olsun. */

import { TUM_VARYANTLAR, videoKrediHesap, videoModelBul, videoModelOzellik } from "@/lib/videoModelVeri";
import { videoErisim } from "@/lib/videoSaglayici";

/* ── Hareket kütüphanesi ─────────────────────────────────────────────── */

export type HareketKat = "kamera" | "aksiyon" | "efekt";
export type Hareket = {
  ad: string;
  /** Dosya adı: public/gercek/video-hareket/{klip}.mp4 ve -poster.webp */
  klip: string;
  kat: HareketKat;
  /** Kısa Türkçe açıklama (kartta). */
  not: string;
  /** Modele giden net talimat (İngilizce kamera terimleri modellerde daha tutarlı). */
  en: string;
  rozet?: "Yeni" | "Popüler";
  /** Başlangıç VE bitiş karesi ister (geçişler). */
  baslaBitir?: boolean;
  /** Başlangıç karesi ister (efekt bir özneye uygulanır). */
  kareGerekli?: boolean;
};

const h = (ad: string, kat: HareketKat, not: string, en: string, ek: Partial<Hareket> = {}): Hareket => ({
  ad, klip: ad.toLowerCase().replace(/\s+/g, "-"), kat, not, en, ...ek,
});

export const HAREKETLER: Hareket[] = [
  // Kamera
  h("DOLLY IN", "kamera", "Özneye yavaşça yaklaşır", "slow dolly-in camera move toward the subject", { rozet: "Popüler" }),
  h("DOLLY OUT", "kamera", "Özneden geriye çekilir", "slow dolly-out camera move away from the subject, revealing the scene"),
  h("PUSH TO GLASS", "kamera", "Cama doğru itilir, arkası bulanık", "camera pushes in toward glass with shallow depth of field", { rozet: "Popüler" }),
  h("ZOOM OUT", "kamera", "Geniş plana açılır", "smooth zoom out from close-up to a wide shot"),
  h("CRASH ZOOM", "kamera", "Ani ve sert yakınlaşma", "sudden fast crash zoom into the subject"),
  h("VERTIGO", "kamera", "Dolly zoom, arka plan esner", "dolly zoom vertigo effect, background stretches while subject stays the same size", { rozet: "Popüler" }),
  h("EMOTION ZOOM", "kamera", "Duyguya doğru yavaş zoom", "slow emotional zoom into the subject's face"),
  h("FOCUS PULL", "kamera", "Odak önden arkaya kayar", "rack focus from foreground to the subject"),
  h("ORBIT LEFT", "kamera", "Öznenin etrafında sola döner", "camera orbits around the subject to the left"),
  h("ORBIT RIGHT", "kamera", "Öznenin etrafında sağa döner", "camera orbits around the subject to the right"),
  h("CAMERA ORBIT", "kamera", "360° yörünge", "full 360 degree camera orbit around the subject"),
  h("ARC SHOT", "kamera", "Yay çizerek yan geçer", "smooth arc shot moving sideways around the subject"),
  h("DRONE ORBIT", "kamera", "Havadan geniş yörünge", "aerial drone orbit high above the scene"),
  h("FPV DIVE", "kamera", "FPV drone ile hızlı dalış", "fast FPV drone dive through the environment", { rozet: "Yeni" }),
  h("OVERHEAD DROP", "kamera", "Tepeden aşağı iner", "overhead top-down camera dropping toward the subject"),
  h("CRANE UP", "kamera", "Vinçle yükselir", "crane shot rising up to reveal the scene"),
  h("JIB UP", "kamera", "Kol kamera yukarı süzülür", "jib camera moving smoothly upward"),
  h("JIB DOWN", "kamera", "Kol kamera aşağı süzülür", "jib camera moving smoothly downward"),
  h("TILT UP", "kamera", "Aşağıdan yukarı tilt", "camera tilts up from the ground to the subject"),
  h("WHIP PAN", "kamera", "Hızlı savrulan pan", "fast whip pan with motion blur"),
  h("DUTCH ANGLE", "kamera", "Eğik, gerilimli kadraj", "tilted dutch angle camera"),
  h("HANDHELD", "kamera", "Elde, doğal sarsıntı", "handheld camera with natural subtle shake"),
  h("UGC HANDHELD", "kamera", "Telefonla çekilmiş his", "smartphone handheld UGC style footage"),
  h("CAMERA MOVE", "kamera", "Serbest sinematik hareket", "cinematic smooth camera movement"),
  // Aksiyon ve stil
  h("BULLET TIME", "aksiyon", "Zaman durur, kamera döner", "bullet time effect, time freezes while the camera circles the subject", { rozet: "Popüler" }),
  h("SLOW MOTION", "aksiyon", "Ağır çekim", "dramatic slow motion"),
  h("LOW SHUTTER", "aksiyon", "Uzun pozlama izleri", "low shutter speed with motion trails and light streaks"),
  h("ACTION RUN", "aksiyon", "Koşan özneyi takip", "tracking shot following the subject running"),
  h("SOUL JUMP", "aksiyon", "Yüksek, sinematik zıplama", "subject jumps high in a cinematic moment", { rozet: "Yeni" }),
  h("SKATE CRUISE", "aksiyon", "Kaykayla süzülme", "smooth skateboard cruising tracking shot"),
  h("SKATEBOARD OLLIE", "aksiyon", "Kaykay ollie anı", "skateboard ollie trick captured mid-air"),
  h("SNOWBOARD CARVE", "aksiyon", "Karda keskin dönüş", "snowboarder carving through powder snow"),
  h("COMMERCIAL", "aksiyon", "Parlak reklam filmi", "high-end commercial product shot with polished lighting"),
  h("VIRAL SPIN", "aksiyon", "Kendi etrafında dönüş", "subject spins around playfully"),
  h("K-POP", "aksiyon", "K-pop dans koreografisi", "energetic k-pop dance choreography", { rozet: "Yeni" }),
  h("JOJO", "aksiyon", "Anime pozu ve dramatik duruş", "dramatic anime-style stand pose"),
  h("ANIME FX", "aksiyon", "Anime efektleri", "anime style energy effects"),
  h("EFFECTS", "aksiyon", "Görsel efekt patlaması", "dynamic visual effects burst"),
  // Efekt ve geçiş
  h("EXPLODE", "efekt", "Özne parçalara ayrılır", "the subject explodes into fragments", { kareGerekli: true, rozet: "Yeni" }),
  h("AIR BENDING", "efekt", "Hava akımlarını büker", "the subject bends swirling air currents", { kareGerekli: true }),
  h("WATER BENDING", "efekt", "Suyu yönetir", "the subject controls flowing water", { kareGerekli: true }),
  h("GIANT GRAB", "efekt", "Dev bir el uzanır", "a giant hand reaches in and grabs the subject", { kareGerekli: true }),
  h("PIZZA FALL", "efekt", "Gökten pizza yağar", "pizzas fall from the sky around the subject", { kareGerekli: true }),
  h("ANIMALIZATION", "efekt", "Hayvana dönüşür", "the subject transforms into an animal", { baslaBitir: true }),
  h("MORPH", "efekt", "Bir kareden diğerine dönüşüm", "seamless morph transition from the first frame to the last frame", { baslaBitir: true, rozet: "Popüler" }),
  h("LOGO TRANSFORM", "efekt", "Logoya dönüşür", "the scene transforms into the logo in the last frame", { baslaBitir: true }),
  h("RAVEN TRANSITION", "efekt", "Kuzgun sürüsüyle geçiş", "a flock of ravens sweeps across to transition to the last frame", { baslaBitir: true, rozet: "Popüler" }),
  h("SMOKE TRANSITION", "efekt", "Duman perdesiyle geçiş", "smoke fills the frame and clears to reveal the last frame", { baslaBitir: true }),
  h("HAND TRANSITION", "efekt", "El kadrajı kapatır, açar", "a hand covers the lens and reveals the last frame", { baslaBitir: true }),
  h("HOLE TRANSITION", "efekt", "Delikten geçerek sahne değişir", "camera flies through a hole into the last frame", { baslaBitir: true }),
];

export const HAREKET_KATLARI: { id: HareketKat | "tumu"; ad: string }[] = [
  { id: "tumu", ad: "Tümü" }, { id: "kamera", ad: "Kamera" }, { id: "aksiyon", ad: "Aksiyon ve stil" }, { id: "efekt", ad: "Efekt ve geçiş" },
];
export const hareketBul = (ad?: string) => (ad ? HAREKETLER.find((x) => x.ad === ad) : undefined);
/** Karışımda en fazla bu kadar kamera hareketi birleşir (yalnız "kamera" türü karışır). */
export const KARISIM_EN_FAZLA = 3;
/** Kayıtlı hareket değeri ("DOLLY IN + ORBIT LEFT") → hareket listesi. */
export const hareketListesi = (deger?: string) => (deger ? deger.split(" + ").map((x) => hareketBul(x.trim())).filter((x): x is Hareket => !!x) : []);
export const klipYolu = (klip: string) => `/gercek/video-hareket/${klip}.mp4`;
export const posterYolu = (klip: string) => `/gercek/video-hareket/${klip}-poster.webp`;
/** Kartta görünen ad: "PUSH TO GLASS" → "Push to Glass". */
export const hareketAdi = (ad: string) => ad.toLowerCase().replace(/(^|\s|-)(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase()).replace(/\bTo\b/g, "to").replace(/\bUgc\b/, "UGC").replace(/\bFpv\b/, "FPV").replace(/\bK-Pop\b/i, "K-Pop").replace(/\bFx\b/, "FX");

/* ── Hızlı başlangıçlar ──────────────────────────────────────────────── */

export const HIZLI_BASLANGIC: { baslik: string; etiket: string; hareket: string; model: string; istem: string }[] = [
  { baslik: "Sinematik manzara", etiket: "Drone", hareket: "DRONE ORBIT", model: "Kling 3.0", istem: "Gün doğumunda karlı dağ zirvelerinin etrafında yavaşça dönen drone çekimi, altın ışık, sinematik derinlik" },
  { baslik: "Portre", etiket: "Karakter", hareket: "FOCUS PULL", model: "Gemini Omni Flash", istem: "Kafede kupasını tutan genç bir kadın, odak ön plandan yüzüne kayar, sıcak pencere ışığı" },
  { baslik: "Aksiyon", etiket: "Takip", hareket: "FPV DIVE", model: "Seedance 2.0", istem: "Kızıl kayalık bir kanyonun içinden hızla dalan FPV drone, dar geçitler, yüksek enerji" },
  { baslik: "Ürün reklamı", etiket: "Reklam", hareket: "ORBIT LEFT", model: "Kling 3.0", istem: "Showroomdaki kırmızı spor arabanın etrafında yavaş yörünge çekimi, parlak stüdyo ışıkları, yansımalar" },
  { baslik: "Şehir gecesi", etiket: "Atmosfer", hareket: "PUSH TO GLASS", model: "Seedance 2.5", istem: "Yağmur damlalı cama doğru ilerleyen kamera, arkada bulanık neon şehir ışıkları, gece" },
  { baslik: "Belgesel", etiket: "Sokak", hareket: "HANDHELD", model: "Minimax Hailuo 2.3", istem: "Kalabalık bir baharat pazarında yürüyen yaşlı bir adam, omuz kamerası, doğal ışık, belgesel hissi" },
];

/* ── Kredi ───────────────────────────────────────────────────────────── */

const KALITE_KATSAYI: Record<string, number> = { "360p": 0.5, "480p": 0.6, "512p": 0.6, "540p": 0.65, "720p": 0.8, "768p": 0.85, "1080p": 1, "2K": 1.4, "4K": 2 };
/** Katalog kredisinin karşılık geldiği süre: 5 sn (modelin en kısa süresi daha uzunsa o). */
export const referansSure = (model: string) => Math.max(5, Math.min(...(videoModelOzellik(model).sureler.length ? videoModelOzellik(model).sureler : [5])));

/**
 * Bir videonun kredisi. Katalogdaki fiyat, modelin varsayılan kalitesinde ve referans süresinde
 * (5 sn) bir videodur; süre, kalite ve ses buna göre ölçeklenir. Böylece 4 sn 480p ile 30 sn 1080p
 * aynı fiyata gelmez.
 */
export function videoKredi(model: string, o: { sure?: number; coz?: string; ses?: boolean } = {}): number {
  const taban = videoKrediHesap(model);
  const varsayilanCoz = videoModelBul(model)?.coz ?? videoModelOzellik(model).coz;
  const sureKat = o.sure ? o.sure / referansSure(model) : 1;
  const kaliteKat = o.coz ? (KALITE_KATSAYI[o.coz] ?? 1) / (KALITE_KATSAYI[varsayilanCoz] ?? 1) : 1;
  const sesKat = o.ses ? 1.25 : 1;
  return Math.max(1, Math.ceil(taban * sureKat * kaliteKat * sesKat));
}

/* ── Sınırsız erişim ─────────────────────────────────────────────────── */

/** Stüdyo model adı → sınırsız erişim teklifinin kimliği (yoksa bu model için paket yok). */
export function sinirsizKimligi(ad: string): string | null {
  const a = ad.toLowerCase();
  if (/^kling 3\.0( turbo| omni)?$/.test(a)) return "kling-3";
  if (/^seedance 2\.0( fast| mini)?$/.test(a)) return "seedance-2";
  if (/^minimax hailuo 2\.3( fast)?$/.test(a)) return "hailuo-23";
  return null;
}
const KALITE_SIRA = ["360p", "480p", "512p", "540p", "720p", "768p", "1080p", "2K", "4K"];
export const kaliteSira = (k: string) => { const i = KALITE_SIRA.indexOf(k); return i < 0 ? KALITE_SIRA.length : i; };

/* ── Model eşleme (?model=) ──────────────────────────────────────────── */

/** Hub ve keşif kartlarının gönderdiği kısa adlar → katalogdaki gerçek model. */
const MODEL_TAKMA: Record<string, string> = {
  "kling-3": "Kling 3.0", "kling-30": "Kling 3.0", "kling-3-turbo": "Kling 3.0 Turbo", "kling-26": "Kling 2.6",
  "seedance-2": "Seedance 2.0", "seedance-20": "Seedance 2.0", "seedance-25": "Seedance 2.5", "seedance-2-fast": "Seedance 2.0 Fast",
  "veo-31": "Gemini Omni Flash", "veo-3": "Gemini Omni Flash", "gemini-omni": "Gemini Omni Flash", "omni": "Gemini Omni Flash",
  "hailuo-23": "Minimax Hailuo 2.3", "hailuo": "Minimax Hailuo 2.3", "minimax": "Minimax Hailuo 2.3",
};
/**
 * İstenen model adını katalogdaki modele çözer: önce takma ad, sonra tam ad eşleşmesi.
 * Gevşek "içerir" eşleşmesi kullanılmaz (seedance-2 → Seedance 2.5 gibi yanlış seçimler oluyordu).
 */
export function modelCoz(istenen: string): string | null {
  const t = istenen.trim().toLowerCase();
  if (MODEL_TAKMA[t]) return MODEL_TAKMA[t];
  const norm = (x: string) => x.toLowerCase().replace(/vayra\s*|google\s*/g, "").replace(/[^a-z0-9]/g, "");
  const n = norm(istenen);
  return TUM_VARYANTLAR.find((v) => norm(v.ad) === n)?.ad ?? null;
}

/** Kullanılabilir (sağlayıcısı tanımlı) modeller, katalog sırasıyla ve tekrarsız. */
export function kullanilabilirModeller(): string[] {
  return [...new Set(TUM_VARYANTLAR.map((v) => v.ad))].filter((ad) => videoErisim(ad).durum === "gercek");
}
export function kapaliModeller(): { ad: string; durum: "kapandi" | "yakinda"; neden: string }[] {
  return [...new Set(TUM_VARYANTLAR.map((v) => v.ad))].flatMap((ad) => {
    const e = videoErisim(ad);
    return e.durum === "gercek" ? [] : [{ ad, durum: e.durum, neden: e.neden }];
  });
}

/* ── Küçük yardımcılar ───────────────────────────────────────────────── */

/** "Bugün", "Dün" ya da tarih — üretim akışında gün grupları. */
export function gunEtiketi(t: number) {
  const g = new Date(t);
  const bugun = new Date();
  const dun = new Date(Date.now() - 86_400_000);
  if (g.toDateString() === bugun.toDateString()) return "Bugün";
  if (g.toDateString() === dun.toDateString()) return "Dün";
  return g.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: g.getFullYear() === bugun.getFullYear() ? undefined : "numeric" });
}
/** Kartın en-boy oranı (Auto ya da bilinmeyen → 16:9). */
export function oranDegeri(oran?: string): number {
  const m = oran?.match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  return m ? Number(m[1]) / Number(m[2]) : 16 / 9;
}
export const ORAN_KULLANIM: Record<string, string> = {
  "16:9": "YouTube · yatay", "9:16": "Reels · TikTok", "1:1": "Gönderi", "4:3": "Klasik", "3:4": "Portre", "21:9": "Sinema", "4:5": "Instagram", Auto: "Kareye göre",
};
export const KALITE_NOT: Record<string, string> = {
  "360p": "Taslak · en hızlı", "480p": "Taslak · hızlı", "512p": "Taslak · hızlı", "720p": "HD · hızlı", "768p": "HD · hızlı",
  "1080p": "Full HD · önerilen", "2K": "QHD · keskin", "4K": "Ultra HD · en iyi",
};

/* ── Model göstergeleri (seçicide hız ve kalite noktaları) ─────────────── */

/** 1–3: üretim hızı (ad ve kademeden). */
export const modelHiz = (ad: string) => (/fast|turbo|flash|mini|lite/i.test(ad) ? 3 : /4k|pro|omni(?! flash)/i.test(ad) ? 1 : 2);
/** 1–3: görüntü kalitesi (modelin en iyi çözünürlüğünden). */
export function modelKalite(ad: string) {
  const c = videoModelOzellik(ad).cozler;
  return c.includes("4K") ? 3 : c.includes("1080p") ? 2 : 1;
}
