import {
  Smile, Zap, Laugh, Heart, Coffee, Flame, Briefcase, Hand, HandMetal, Minus, Pause, Wind, Sparkles, Volume2, MessageCircle, type LucideIcon,
} from "lucide-react";
import { videoErisim } from "@/lib/videoSaglayici";

/** Speak (konuşan avatar) stüdyosunun statik verisi. Görseller public/gercek altındaki gerçek karelerdir. */

export const ARAC_ADI = "Konuştur";

export type Cinsiyet = "Kadın" | "Erkek";
export type Avatar = { id: string; ad: string; gorsel: string; cinsiyet: Cinsiyet; cekim: "portre" | "boy"; tarz: "is" | "gundelik" };

const K = (ad: string, tarz: Avatar["tarz"] = "gundelik", cekim: Avatar["cekim"] = "portre"): Avatar => ({ id: `av-${ad}`, ad: ad[0].toUpperCase() + ad.slice(1), gorsel: `/gercek/paz/av-${ad}.webp`, cinsiyet: "Kadın", cekim, tarz });
const E = (ad: string, tarz: Avatar["tarz"] = "gundelik", cekim: Avatar["cekim"] = "portre"): Avatar => ({ ...K(ad, tarz, cekim), cinsiyet: "Erkek" });

/** Hazır avatarlar — izin onayı gerekmez (sentetik kişiler). */
export const AVATARLAR: Avatar[] = [
  K("emma"), E("malik", "is"), K("hana", "is"), E("kai"), K("sofia"), E("ryu", "is"), K("valentina"), E("stefan", "is"),
  K("priya"), E("lucas"), K("mei", "is"), E("marco", "is"), K("naomi"), E("omar", "is"), K("scarlett", "is"), E("liam"),
  K("zara"), E("tae"), K("lily"), E("niko"), K("amara"), E("erik"), K("jia", "is"), E("jayden", "is"), K("margot", "is"),
  E("ren", "is"), K("clara"), E("jin"), K("maria", "is"), K("minji"), K("nia"), K("yuki"), K("yuna"), K("audrey"),
  K("adriana"), K("elena"), K("miso"), K("sora"), E("felix", "gundelik", "boy"), E("joon", "gundelik", "boy"),
];

/** Senaryo performans etiketleri — modele yönerge olarak gider, sesli okunmaz. */
export const ETIKETLER: { etiket: string; ad: string; ikon: LucideIcon }[] = [
  { etiket: "[duraksar]", ad: "Duraksa", ikon: Pause },
  { etiket: "[gülümser]", ad: "Gülümse", ikon: Smile },
  { etiket: "[güler]", ad: "Gül", ikon: Laugh },
  { etiket: "[fısıldar]", ad: "Fısılda", ikon: Wind },
  { etiket: "[heyecanla]", ad: "Heyecan", ikon: Sparkles },
  { etiket: "[vurgulu]", ad: "Vurgula", ikon: Volume2 },
  { etiket: "[iç çeker]", ad: "İç çek", ikon: MessageCircle },
];

export const SENARYO_SABLON: { ad: string; kapak: string; metin: string }[] = [
  { ad: "Ürün tanıtımı", kapak: "/gercek/paz/paz-inceleme-1.webp", metin: "Selam! [gülümser] Size bugün hayatımı kolaylaştıran bir şeyi göstereceğim. [duraksar] Üç haftadır kullanıyorum ve fark gerçekten çok net." },
  { ad: "Kurs girişi", kapak: "/gercek/paz/paz-egitim-1.webp", metin: "Hoş geldiniz! Bu derste temel kavramları adım adım öğreneceğiz. [duraksar] Hazırsanız başlayalım." },
  { ad: "Duyuru", kapak: "/gercek/paz/paz-tv-1.webp", metin: "[heyecanla] Büyük bir haberimiz var! Yeni özelliğimiz bugünden itibaren herkesin kullanımına açık." },
  { ad: "Karşılama", kapak: "/gercek/paz/paz-selfie-1.webp", metin: "Merhaba, ben sizin dijital asistanınızım. [gülümser] Size nasıl yardımcı olabilirim?" },
  { ad: "Hikâye", kapak: "/gercek/paz/paz-gizem-1.webp", metin: "Yıllar önce, küçük bir kasabada [fısıldar] kimsenin bilmediği bir sır saklıydı. [duraksar] Bugün o sırrı anlatacağım." },
];

export const DUYGULAR: { deger: string; ad: string; ikon: LucideIcon; en: string; alt: string }[] = [
  { deger: "samimi", ad: "Samimi", ikon: Smile, en: "warm and friendly", alt: "Sıcak, içten" },
  { deger: "enerjik", ad: "Enerjik", ikon: Zap, en: "excited and energetic", alt: "Coşkulu" },
  { deger: "esprili", ad: "Esprili", ikon: Laugh, en: "playful and humorous", alt: "Oyunbaz" },
  { deger: "duygusal", ad: "Duygusal", ikon: Heart, en: "heartfelt and emotional", alt: "Dokunaklı" },
  { deger: "sakin", ad: "Sakin", ikon: Coffee, en: "calm and soothing", alt: "Yumuşak" },
  { deger: "kararli", ad: "Kararlı", ikon: Flame, en: "confident and assertive", alt: "Otoriter" },
];

export const JESTLER: [string, string, LucideIcon, string][] = [
  ["yok", "Sabit", Minus, "Yalnız yüz"],
  ["dogal", "Doğal", Hand, "Hafif el"],
  ["anlatici", "Anlatıcı", Briefcase, "Sunum jestleri"],
  ["coskulu", "Coşkulu", HandMetal, "Geniş hareket"],
];
export const JEST_EN: Record<string, string> = {
  yok: "no hand gestures, only subtle head movement", dogal: "natural, subtle hand gestures", anlatici: "presenter-style explanatory hand gestures that follow the speech", coskulu: "big, expressive hand and body gestures",
};

/** Kamera kurgusu — gerçek örnek hareket klipleriyle. */
export const KAMERALAR = [
  { deger: "sabit", ad: "Sabit çekim", alt: "Tripod, yüz odaklı", en: "locked-off static camera, framed portrait", kapak: "/gercek/video-hareket/focus-pull-poster.webp", video: "/gercek/video-hareket/focus-pull.mp4" },
  { deger: "vlog", ad: "Selfie vlog", alt: "Elde telefon", en: "handheld phone selfie at arm's length with natural slight shake", kapak: "/gercek/video-hareket/ugc-handheld-poster.webp", video: "/gercek/video-hareket/ugc-handheld.mp4" },
  { deger: "yaklas", ad: "Yavaş yaklaşma", alt: "Dolly in", en: "slow dolly push-in toward the face", kapak: "/gercek/video-hareket/dolly-in-poster.webp", video: "/gercek/video-hareket/dolly-in.mp4" },
  { deger: "yakin", ad: "Duygusal yakın", alt: "Zoom, yakın plan", en: "slow emotional zoom into an intimate close-up", kapak: "/gercek/video-hareket/emotion-zoom-poster.webp", video: "/gercek/video-hareket/emotion-zoom.mp4" },
  { deger: "kavis", ad: "Kavisli", alt: "Yarım tur", en: "gentle arc shot around the speaker", kapak: "/gercek/video-hareket/arc-shot-poster.webp", video: "/gercek/video-hareket/arc-shot.mp4" },
  { deger: "el", ad: "Belgesel", alt: "Omuz kamerası", en: "documentary-style handheld shoulder camera", kapak: "/gercek/video-hareket/handheld-poster.webp", video: "/gercek/video-hareket/handheld.mp4" },
];

export const ARKAPLANLAR = [
  { deger: "orijinal", ad: "Orijinal", alt: "Fotoğraftaki gibi", en: "", kapak: "" },
  { deger: "ofis", ad: "Modern ofis", alt: "Masa, doğal ışık", en: "in a bright modern office", kapak: "/gercek/paz/ortam-ofis.webp" },
  { deger: "mutfak", ad: "Mutfak", alt: "Ev, sıcak", en: "in a bright home kitchen", kapak: "/gercek/paz/ortam-mutfak.webp" },
  { deger: "sokak", ad: "Şehir sokağı", alt: "Dış mekân", en: "on a busy city street", kapak: "/gercek/paz/ortam-sokak.webp" },
  { deger: "yatak", ad: "Yatak odası", alt: "Rahat, samimi", en: "in a cozy bedroom", kapak: "/gercek/paz/ortam-yatak.webp" },
  { deger: "araba", ad: "Araba içi", alt: "Vlog klasiği", en: "sitting in a parked car", kapak: "/gercek/paz/ortam-araba.webp" },
  { deger: "doga", ad: "Doğa", alt: "Sahil, yeşil", en: "outdoors on a green coastal path", kapak: "/gercek/paz/ortam-doga.webp" },
  { deger: "cati", ad: "Çatı katı", alt: "Gün batımı", en: "on a rooftop at golden hour", kapak: "/gercek/paz/ortam-cati.webp" },
  { deger: "spor", ad: "Spor salonu", alt: "Dinamik", en: "in a gym", kapak: "/gercek/paz/ortam-spor.webp" },
];

export type Dil = { deger: string; ad: string; aksan: string; bayrak: string; en: string };
export const DILLER: Dil[] = [
  { deger: "tr", ad: "Türkçe", aksan: "İstanbul", bayrak: "TR", en: "Turkish" },
  { deger: "en-us", ad: "İngilizce", aksan: "Amerikan", bayrak: "US", en: "American English" },
  { deger: "en-gb", ad: "İngilizce", aksan: "İngiliz", bayrak: "GB", en: "British English" },
  { deger: "en-au", ad: "İngilizce", aksan: "Avustralya", bayrak: "AU", en: "Australian English" },
  { deger: "de", ad: "Almanca", aksan: "Standart", bayrak: "DE", en: "German" },
  { deger: "fr", ad: "Fransızca", aksan: "Paris", bayrak: "FR", en: "French" },
  { deger: "es", ad: "İspanyolca", aksan: "Kastilya", bayrak: "ES", en: "Spanish" },
  { deger: "it", ad: "İtalyanca", aksan: "Standart", bayrak: "IT", en: "Italian" },
  { deger: "pt", ad: "Portekizce", aksan: "Lizbon", bayrak: "PT", en: "Portuguese" },
  { deger: "ar", ad: "Arapça", aksan: "Körfez", bayrak: "SA", en: "Arabic" },
  { deger: "ru", ad: "Rusça", aksan: "Moskova", bayrak: "RU", en: "Russian" },
  { deger: "ja", ad: "Japonca", aksan: "Tokyo", bayrak: "JP", en: "Japanese" },
  { deger: "ko", ad: "Korece", aksan: "Seul", bayrak: "KR", en: "Korean" },
  { deger: "hi", ad: "Hintçe", aksan: "Delhi", bayrak: "IN", en: "Hindi" },
];

/** Konuşma + doğal sesi birlikte üreten (dudak senkronlu) ve gerçek sağlayıcısı olan modeller. */
/** Konuşan video: görselden üreten ve sesi (dudak senkronu) açılabilen, sağlayıcısı bağlı modeller. */
export const MODELLER = ([
  { deger: "Kling 3.0", ad: "Kling 3.0", alt: "Canlı mimik, dudak senkronu", rozet: "Önerilen" },
  { deger: "Kling 4.0", ad: "Kling 4.0", alt: "En yeni Kling, 4K", rozet: "Yeni" },
  { deger: "Seedance 2.5", ad: "Seedance 2.5", alt: "30 sn'ye kadar konuşma", rozet: "Uzun" },
  { deger: "Seedance 2.0", ad: "Seedance 2.0", alt: "Sinematik, doğal ses" },
  { deger: "MiniMax H3 Max", ad: "MiniMax H3 Max", alt: "Güçlü mimik ve hareket", rozet: "Yeni" },
  { deger: "Kling 2.6", ad: "Kling 2.6", alt: "Dengeli, 5 ya da 10 sn" },
  { deger: "Seedance 1.5 Pro", ad: "Seedance 1.5 Pro", alt: "Dengeli, uygun fiyatlı" },
  { deger: "Seedance 2.0 Fast", ad: "Seedance 2.0 Fast", alt: "Hızlı ve uygun", rozet: "Hızlı" },
] as { deger: string; ad: string; alt: string; rozet?: string }[])
  .filter((m) => { const e = videoErisim(m.deger); return e.durum === "gercek" && e.ses === "toggle" && (!e.fal || !!e.fal.gorsel); })
  .map((m) => { const e = videoErisim(m.deger); return { ...m, saglayici: e.durum === "gercek" ? e.saglayici : "" }; });

export type ModelAd = string;

export function modelSinir(model: string) {
  const e = videoErisim(model);
  if (e.durum !== "gercek") return { sureler: [5, 10], cozler: ["720p"], oranlar: ["9:16", "1:1", "16:9"] };
  const oranlar = ["9:16", "1:1", "16:9", "3:4", "4:3"].filter((o) => e.oranlar.includes(o));
  return { sureler: e.sureler.length ? e.sureler : [8], cozler: e.cozler.filter((c) => c !== "4K"), oranlar };
}

/** Konuşma süresi tahmini (sn): sözcük / hız. Etiketler sayılmaz; [duraksar] ~0,6 sn ekler. */
export function konusmaSuresi(metin: string, hiz = 1) {
  const duraklama = (metin.match(/\[duraksar\]/g) ?? []).length * 0.6;
  const sozcuk = metin.replace(/\[[^\]]*\]/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.round(((sozcuk / 2.5) / hiz + duraklama) * 10) / 10;
}

export const temizSoz = (m: string) => m.replace(/\[[^\]]*\]/g, " ").replace(/\s+/g, " ").trim();
