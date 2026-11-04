"use client";

/**
 * Fans stüdyosu: tek karakter, her gün yeni içerik (konuşma, foto seti, kişiye özel mesaj, trend).
 * Stüdyo kalıbı: başlık kartı + kayan beyaz sekmeler, oynayan hero + cam mekanizma paneli, kartlı bölümler,
 * alttan yüzen .cam-istemci komut kutusu. Sonuçlar ortak UretimGoruntuleyici ile açılır.
 */

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  MessageCircle, Images, Gift, Music4, Plus, Sparkles, Loader2, Pencil, Check, X, Film, AlertTriangle, Wand2, Trash2, Download,
  MapPin, Smile, Laugh, Flame, Heart, Zap, Coffee, Clock, Lightbulb, Users, Play, RotateCcw, ScanFace, Maximize, Upload, UserRound,
} from "lucide-react";
import { cn, saltUrl } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { useMasaustu } from "@/hooks/useMasaustu";
import { useSaglayicilar } from "@/hooks/useSaglayicilar";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { videoKrediHesap } from "@/lib/videoModelVeri";
import { useAuth } from "@/store/useAuth";
import { useElements, type VElement } from "@/store/useElements";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { ElementKapak } from "@/components/panel/element/elementMeta";
import { ElementDuzenleModal } from "@/components/panel/element/ElementDuzenleModal";
import { UretimGoruntuleyici } from "@/components/studyo/UretimGoruntuleyici";
import { MarkaKare } from "@/components/studyo/hf";
import { Tooltip } from "@/components/ui/Tooltip";
import { KCip } from "@/components/studyo/Cip";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { Bayrak } from "@/components/ui/Bayrak";
import { useRouter } from "next/navigation";
import { OzelGirdi, OranSimge } from "@/components/film/ortak";
import { Yuzen } from "@/components/ui/Yuzen";
import { Segment } from "@/components/montaj/ui";
import { DILLER } from "@/components/speak/speakVeri";
import { konuAnlamli } from "@/components/shorts/konuSenaryo";
import { FansVitrin } from "./FansVitrin";
import { CINSIYET, YAS, KOKEN, SAC_STIL, SAC_RENK, GOZ, VUCUT, TARZ, TEN_DETAY, AKSESUAR, type Secenek } from "@/components/influencer/veri";

const ARAC_ADI = "Fans Stüdyosu";
type Tur = "konus" | "foto" | "mesaj" | "trend";
type Gorunum = "studyo" | "karakter" | "icerik";

const TURLER: { id: Tur; ad: string; ikon: typeof MessageCircle; alt: string; kapak: string; video?: string }[] = [
  { id: "konus", ad: "Konuşma", ikon: MessageCircle, alt: "Kameraya konuşur, istediğin dillerde", kapak: "/gercek/video-hareket/ugc-handheld-poster.webp", video: "/gercek/video-hareket/ugc-handheld.mp4" },
  { id: "foto", ad: "Foto seti", ikon: Images, alt: "Aynı yüz, aynı gün, çok kare", kapak: "/gercek/gorsel/mood-y2k-studyo.webp" },
  { id: "mesaj", ad: "Kişiye özel", ikon: Gift, alt: "Her hayrana adıyla ayrı video", kapak: "/gercek/video-hareket/emotion-zoom-poster.webp", video: "/gercek/video-hareket/emotion-zoom.mp4" },
  { id: "trend", ad: "Trend", ikon: Music4, alt: "Popüler bir akımı karakterine uygula", kapak: "/gercek/video-hareket/k-pop-poster.webp", video: "/gercek/video-hareket/k-pop.mp4" },
];

/** Örnek karakterler (hazır görsellerle element olarak eklenir; kullanıcının kendi fotoğrafı değil). */
const ORNEK_KARAKTERLER = [
  { ad: "Aria", aciklama: "Yirmili yaşlarda, uzun dalgalı kahverengi saçlı, sıcak gülüşlü kadın içerik üreticisi", tarz: "Güzellik, gündelik" },
  { ad: "Kai", aciklama: "Kısa siyah saçlı, sportif tarzlı, enerjik genç erkek", tarz: "Spor, teknoloji" },
  { ad: "Sofia", aciklama: "Koyu dalgalı saçlı, zarif ve yaratıcı kadın", tarz: "Moda, seyahat" },
  { ad: "Leo", aciklama: "Kısa kahverengi saçlı, sıcak gülüşlü, rahat tavırlı erkek", tarz: "Yemek, yaşam" },
  { ad: "Emma", aciklama: "Sarı saçlı, mavi gözlü, neşeli kadın", tarz: "Eğlence, müzik" },
];
const ornekGorsel = (ad: string) => `/gercek/gorsel/gorsel-karakter-${ad}.webp`;

const CEKIMLER: { deger: string; ad: string; alt: string; en: string; kapak: string; video?: string }[] = [
  { deger: "selfie", ad: "Selfie", alt: "Elde telefon, yakın", en: "handheld selfie shot, phone at arm's length", kapak: "/gercek/video-hareket/ugc-handheld-poster.webp", video: "/gercek/video-hareket/ugc-handheld.mp4" },
  { deger: "vlog", ad: "Vlog", alt: "Yürürken konuşur", en: "walking vlog shot, camera slightly ahead", kapak: "/gercek/video-hareket/skate-cruise-poster.webp", video: "/gercek/video-hareket/skate-cruise.mp4" },
  { deger: "podcast", ad: "Podcast", alt: "Mikrofon başında", en: "seated podcast shot with a studio microphone", kapak: "/gercek/video-hareket/commercial-poster.webp", video: "/gercek/video-hareket/commercial.mp4" },
  { deger: "yakin", ad: "Yakın plan", alt: "Yüz odaklı, samimi", en: "intimate close-up on the face", kapak: "/gercek/video-hareket/emotion-zoom-poster.webp", video: "/gercek/video-hareket/emotion-zoom.mp4" },
  { deger: "ayna", ad: "Ayna selfie", alt: "Boy aynası, tam boy", en: "mirror selfie, full body, phone visible", kapak: "/gercek/paz/ortam-banyo.webp" },
  { deger: "masa", ad: "Masa başı", alt: "Sabit kamera, oturur", en: "static desk-mounted camera, seated, talking to camera", kapak: "/gercek/paz/ortam-ofis.webp" },
  { deger: "araba", ad: "Arabada", alt: "Ön koltuk, gün ışığı", en: "selfie from the driver's seat of a parked car, daylight", kapak: "/gercek/paz/ortam-araba.webp" },
  { deger: "tripod", ad: "Tripod, bel üstü", alt: "Ellerle anlatır", en: "medium shot on a tripod, waist up, gesturing with hands", kapak: "/gercek/video-hareket/commercial-poster.webp" },
  { deger: "pov", ad: "POV", alt: "Kamera izleyici gözü", en: "point of view shot, talking directly as if face to face", kapak: "/gercek/video-hareket/ugc-handheld-poster.webp" },
];
const MEKANLAR: { deger: string; ad: string; alt: string; en: string; kapak: string }[] = [
  { deger: "kendi", ad: "Görseldeki", alt: "Kendi arka planı", en: "", kapak: "" },
  { deger: "oda", ad: "Yatak odası", alt: "Sıcak, loş", en: "in a cozy warmly lit bedroom", kapak: "/gercek/paz/ortam-yatak.webp" },
  { deger: "mutfak", ad: "Mutfak", alt: "Gün ışığı", en: "in a bright home kitchen", kapak: "/gercek/paz/ortam-mutfak.webp" },
  { deger: "sokak", ad: "Sokak", alt: "Şehir, gündüz", en: "on a stylish city street in daylight", kapak: "/gercek/paz/ortam-sokak.webp" },
  { deger: "doga", ad: "Doğa", alt: "Açık hava", en: "outdoors in nature at golden hour", kapak: "/gercek/paz/ortam-doga.webp" },
  { deger: "ofis", ad: "Ofis", alt: "Masa başı", en: "at a modern office desk", kapak: "/gercek/paz/ortam-ofis.webp" },
  { deger: "studyo", ad: "Stüdyo", alt: "Renkli fon", en: "in a colorful creator studio with ring light", kapak: "/gercek/gorsel/mood-y2k-studyo.webp" },
  { deger: "neon", ad: "Neon gece", alt: "Şehir ışıkları", en: "at night under neon city lights", kapak: "/gercek/gorsel/mood-y2k-sokak.webp" },
  { deger: "kafe", ad: "Kafe", alt: "Sabah kahvesi", en: "in a cozy cafe by the window, morning light", kapak: "/gercek/galeri/sinematik1.webp" },
  { deger: "plaj", ad: "Plaj", alt: "Gün batımı", en: "on a beach at sunset", kapak: "/gercek/galeri/manzara1.webp" },
  { deger: "spor", ad: "Spor salonu", alt: "Enerjik", en: "in a modern gym", kapak: "/gercek/paz/ortam-spor.webp" },
  { deger: "cati", ad: "Çatı katı", alt: "Şehir manzarası", en: "on a rooftop overlooking the city skyline at dusk", kapak: "/gercek/paz/ortam-cati.webp" },
];
const DUYGULAR = [
  { deger: "samimi", ad: "Samimi", alt: "Sıcak, içten", ikon: Smile, en: "warm and friendly" },
  { deger: "enerjik", ad: "Enerjik", alt: "Coşkulu", ikon: Zap, en: "excited and energetic" },
  { deger: "komik", ad: "Esprili", alt: "Oyunbaz", ikon: Laugh, en: "playful and funny" },
  { deger: "duygusal", ad: "Duygusal", alt: "Dokunaklı", ikon: Heart, en: "heartfelt and emotional" },
  { deger: "rahat", ad: "Rahat", alt: "Sakin", ikon: Coffee, en: "calm and relaxed" },
  { deger: "iddiali", ad: "İddialı", alt: "Kendinden emin", ikon: Flame, en: "confident and bold" },
];
const KANCALAR = [
  "Bunu kimse sana söylemedi ama…", "Bugün size bir sır vereceğim.", "Yorumlarda en çok sorulan soruyu yanıtlıyorum.",
  "Üç saniyeniz var mı? Şunu izleyin.", "Geçen hafta başıma gelenler inanılmaz.", "Herkese teşekkür etmek istedim!",
];
const TRENDLER = [
  { deger: "k-pop", ad: "K-pop dansı", alt: "Senkron koreografi" }, { deger: "viral-spin", ad: "Viral dönüş", alt: "Kameraya dönüş" },
  { deger: "soul-jump", ad: "Ruh zıplaması", alt: "Havada süzülme" }, { deger: "jojo", ad: "JoJo pozu", alt: "Dramatik poz" },
  { deger: "anime-fx", ad: "Anime efekt", alt: "Enerji patlaması" }, { deger: "slow-motion", ad: "Ağır çekim", alt: "Sinematik an" },
  { deger: "giant-grab", ad: "Dev el", alt: "Gerçeküstü" }, { deger: "animalization", ad: "Hayvana dönüş", alt: "Dönüşüm" },
];
const trendKapak = (d: string) => `/gercek/video-hareket/${d}-poster.webp`;
const trendVideo = (d: string) => `/gercek/video-hareket/${d}.mp4`;
const FOTO_PAKETLER = [
  { ad: "Kafe sabahı", alt: "Sıcak ışık, kahve", tema: "kafede sabah kahvesi, rahat şık kombin, sıcak ışık", kapak: "/gercek/gorsel/mood-sicak-ambiyans.webp", ornek: ["/gercek/gorsel/mood-sicak-ambiyans.webp", "/gercek/gorsel/mood-sicak-canli-film.webp", "/gercek/paz/ortam-mutfak.webp"] },
  { ad: "Şehir gecesi", alt: "Neon, deri ceket", tema: "şehirde gece gezmesi, neon ışıklar, siyah deri ceket", kapak: "/gercek/gorsel/mood-y2k-sokak.webp", ornek: ["/gercek/gorsel/mood-y2k-sokak.webp", "/gercek/gorsel/mood-swag-donemi.webp", "/gercek/paz/ortam-sokak.webp"] },
  { ad: "Tatil", alt: "Keten, hasır şapka", tema: "tatilde açık havada, beyaz keten gömlek, hasır şapka", kapak: "/gercek/gorsel/mood-doga-isigi.webp", ornek: ["/gercek/gorsel/mood-doga-isigi.webp", "/gercek/paz/ortam-doga.webp", "/gercek/gorsel/mood-notr-pastel-film.webp"] },
  { ad: "Stüdyo", alt: "Ring ışık, renkli fon", tema: "renkli stüdyo çekimi, ring ışık, trend kombin", kapak: "/gercek/gorsel/mood-y2k-studyo.webp", ornek: ["/gercek/gorsel/mood-y2k-studyo.webp", "/gercek/gorsel/mood-frutiger-aero.webp", "/gercek/gorsel/mood-2000ler-grup.webp"] },
  { ad: "Analog film", alt: "Flaşlı, gündelik", tema: "tek kullanımlık kamera estetiği, flaşlı, gündelik anlar", kapak: "/gercek/gorsel/mood-tek-kullanimlik-kamera.webp", ornek: ["/gercek/gorsel/mood-tek-kullanimlik-kamera.webp", "/gercek/gorsel/mood-yeni-indie.webp", "/gercek/gorsel/mood-sicak-canli-film.webp"] },
  { ad: "Sokak modası", alt: "Editoryel pozlar", tema: "sokak modası, editoryel pozlar, gün ışığı", kapak: "/gercek/gorsel/mood-editoryel-sokak.webp", ornek: ["/gercek/gorsel/mood-editoryel-sokak.webp", "/gercek/gorsel/mood-swag-donemi.webp", "/gercek/paz/ortam-cati.webp"] },
];
const FOTO_HAVUZ = ["/gercek/gorsel/mood-sicak-ambiyans.webp", "/gercek/gorsel/mood-editoryel-sokak.webp", "/gercek/gorsel/mood-doga-isigi.webp", "/gercek/gorsel/mood-y2k-studyo.webp", "/gercek/gorsel/mood-yeni-indie.webp", "/gercek/gorsel/mood-notr-pastel-film.webp"];
const KARELER: [string, string][] = [
  ["mirror selfie", "Ayna selfiesi"], ["candid laughing moment", "Gülüş anı"], ["close-up portrait", "Yakın portre"], ["full body outfit shot", "Boy çekimi"],
  ["over-the-shoulder look back", "Omuz üstü bakış"], ["detail shot with hands", "El detayı"], ["sitting casually", "Rahat oturuş"], ["walking toward camera", "Yürürken"],
];
const KONUS_FIKIR = [
  { ad: "Günaydın", metin: "Günaydın! Bugün size harika bir haberim var, sonuna kadar izleyin.", kapak: "/gercek/paz/ortam-yatak.webp" },
  { ad: "Favorilerim", metin: "Son bir aydır her gün kullandığım üç şeyi anlatıyorum; üçüncüsü beni çok şaşırttı!", kapak: "/gercek/paz/ortam-mutfak.webp" },
  { ad: "Soru cevap", metin: "Yorumlarda en çok sorulan soruyu yanıtlıyorum: bu tarzı nasıl yakalıyorum?", kapak: "/gercek/paz/ortam-ofis.webp" },
  { ad: "Duyuru", metin: "Büyük bir duyurum var: yeni seri bu cuma başlıyor, sakın kaçırmayın!", kapak: "/gercek/paz/ortam-cati.webp" },
  { ad: "Teşekkür", metin: "Hepinize çok teşekkür ederim, bu topluluk benim için her şey demek.", kapak: "/gercek/gorsel/mood-sicak-ambiyans.webp" },
];
const MESAJ_FIKIR = [
  { ad: "Teşekkür", metin: "Selam {isim}! Desteğin için çok teşekkür ederim, seni gerçekten çok seviyorum.", kapak: "/gercek/gorsel/mood-sicak-canli-film.webp" },
  { ad: "Doğum günü", metin: "İyi ki doğdun {isim}! Yeni yaşın sana bol kahkaha ve güzel sürprizler getirsin.", kapak: "/gercek/gorsel/mood-2000ler-grup.webp" },
  { ad: "Hoş geldin", metin: "Aramıza hoş geldin {isim}! Burada seni çok güzel içerikler bekliyor.", kapak: "/gercek/gorsel/mood-notr-pastel-film.webp" },
  { ad: "Tebrik", metin: "{isim}, başardın! Seninle gurur duyuyorum, böyle devam et.", kapak: "/gercek/gorsel/mood-yeni-indie.webp" },
  { ad: "Bayram", metin: "{isim}, bayramın kutlu olsun! Sevdiklerinle güzel bir gün geçirmeni dilerim.", kapak: "/gercek/gorsel/mood-sicak-ambiyans.webp" },
];
const VIDEO_MODELLER = [
  { deger: "Kling 3.0", ad: "Kling 3.0", alt: "Akıcı mimik, sesli", rozet: "Önerilen" },
  { deger: "Seedance 2.5", ad: "Seedance 2.5", alt: "Sesli, 30 sn'ye kadar" },
  { deger: "Seedance 2.0", ad: "Seedance 2.0", alt: "Sinematik, 4K'ya kadar" },
  { deger: "Kling 2.6", ad: "Kling 2.6", alt: "Sesli, dengeli" },
  { deger: "Gemini Omni Flash", ad: "Gemini Omni Flash", alt: "Google, hızlı" },
  { deger: "Kling 3.0 Turbo", ad: "Kling 3.0 Turbo", alt: "Hızlı, 1080p" },
  { deger: "Seedance 2.0 Fast", ad: "Seedance 2.0 Fast", alt: "Hızlı Seedance" },
  { deger: "Minimax Hailuo 2.3", ad: "Hailuo 2.3", alt: "Hızlı ve uygun", rozet: "Ekonomik" },
];
const FOTO_MODELLER = [
  { deger: "Nano Banana Pro", ad: "Nano Banana Pro", alt: "Karakter tutarlılığı en iyi", rozet: "Önerilen", kredi: 5 },
  { deger: "Seedream 5.0 Pro", ad: "Seedream 5.0 Pro", alt: "Yüksek detay", kredi: 7 },
  { deger: "GPT Image 2", ad: "GPT Image 2", alt: "İsteme sadık", kredi: 6 },
  { deger: "Seedream 4.5", ad: "Seedream 4.5", alt: "Hızlı, dengeli", kredi: 5 },
  { deger: "FLUX.2 Pro", ad: "FLUX.2 Pro", alt: "Gerçekçi ten ve ışık", kredi: 6 },
  { deger: "Flux Kontext Max", ad: "Flux Kontext Max", alt: "Referansa en sadık", kredi: 8 },
];
const ORANLAR = ["9:16", "4:5", "1:1", "16:9"] as const;
const ORAN_AMAC: Record<string, string> = { "9:16": "Reels, TikTok, Shorts", "4:5": "Instagram akışı", "1:1": "Kare gönderi", "16:9": "YouTube" };
const EN_COK_ISIM = 20;
const KONUSAN_DEMO = { video: "/gercek/video-hareket/ugc-handheld.mp4", poster: "/gercek/video-hareket/ugc-handheld-poster.webp" };

const VIDEO_HAZIR = (s: Record<string, boolean> | null) => !!s && ["kling", "seedance", "minimax", "omni"].some((k) => s[k]);
const GORSEL_HAZIR = (s: Record<string, boolean> | null) => !!s && ["gemini", "seedream", "openai", "fal"].some((k) => s[k]);
const YAY = { type: "spring", stiffness: 420, damping: 32 } as const;
const KAYAN = { type: "spring", stiffness: 480, damping: 36 } as const;
const EASE = [0.22, 1, 0.36, 1] as const;
const ARAC = "flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-white/[0.06] px-3 text-[12.5px] font-medium text-metin-2 transition-[color,background-color,transform] hover:bg-white/[0.1] hover:text-metin active:scale-95";

type FMeta = { fansTur?: Tur; fansEtiket?: string; fansDil?: string; karakterId?: string; karakterKapak?: string; karakterAd?: string; fansMetin?: string; grupId?: string; sira?: number; hamIstem?: string; gorselUrl?: string; oran?: string };
const fm = (u: Uretim) => (u.meta ?? {}) as FMeta;
const grupTur = (u: Uretim): Tur => fm(u).fansTur ?? (u.tur === "gorsel" ? "foto" : u.baslik.includes(" → ") ? "mesaj" : u.meta?.hareket ? "trend" : "konus");
/** Kart etiketi: dil, hayran adı, kare adı ya da akım (eski kayıtlarda hamIstem). */
const etiketAl = (u: Uretim) => fm(u).fansEtiket ?? fm(u).hamIstem;
/** Tur başlığı: tür adı + o tura özgü bilgi (tekrar etmeden). */
const grupBaslik = (g: Uretim[]) => {
  const t = grupTur(g[0]), e = etiketAl(g[0]);
  return t === "trend" ? `Trend, ${e ?? "akım"}` : t === "foto" ? `Foto seti, ${g.length} kare` : t === "mesaj" ? `Kişiye özel, ${g.length} hayran` : g.length > 1 ? `Konuşma, ${g.length} dil` : `Konuşma, ${e ?? "tek dil"}`;
};
const kapakAl = (u: Uretim) => (u.durum === "tamam" ? saltUrl(u.gorselUrl) ?? fm(u).karakterKapak ?? u.meta?.gorselUrl : fm(u).karakterKapak ?? u.meta?.gorselUrl);

export function FansStudyo() {
  const router = useRouter();
  const masaustu = useMasaustu();
  const sag = useSaglayicilar();
  const krediBakiye = useAuth((s) => s.kullanici?.krediler ?? 0);
  const elementler = useElements((s) => s.elementler);
  const karakterler = useMemo(() => elementler.filter((e) => e.tur === "karakter"), [elementler]);
  const uretimler = useProjeler((s) => s.uretimler);
  const sonuclar = useMemo(() => uretimler.filter((u) => u.arac === ARAC_ADI).sort((a, b) => b.olusturma - a.olusturma), [uretimler]);
  const [gorunum, setGorunum] = useState<Gorunum>("studyo");
  const [tur, setTur] = useState<Tur>("konus");
  const [karakterId, setKarakterId] = useState<string | null>(() => useElements.getState().elementler.find((e) => e.tur === "karakter")?.id ?? null);
  const karakter = karakterler.find((k) => k.id === karakterId) ?? null;
  // Her türün kendi metni (konuşma, mesaj şablonu, trend notu birbirine karışmasın)
  const [metinler, setMetinler] = useState<Record<Tur, string>>({ konus: "", foto: "", mesaj: MESAJ_FIKIR[0].metin, trend: "" });
  const [diller, setDiller] = useState<string[]>(["tr"]);
  const [duygu, setDuygu] = useState("samimi");
  const [cekim, setCekim] = useState("selfie");
  const [mekan, setMekan] = useState("kendi");
  const [model, setModel] = useState("Kling 3.0");
  const [ozelCekim, setOzelCekim] = useState("");
  const [ozelMekan, setOzelMekan] = useState("");
  const [ozelKanca, setOzelKanca] = useState("");
  const [ozelTrend, setOzelTrend] = useState("");
  const [fotoModel, setFotoModel] = useState("Nano Banana Pro");
  const [fotoAdet, setFotoAdet] = useState(4);
  const [oran, setOran] = useState<(typeof ORANLAR)[number]>("9:16");
  const [isimler, setIsimler] = useState<string[]>([]);
  const [isimGir, setIsimGir] = useState("");
  const [trend, setTrend] = useState("k-pop");
  const [riza, setRiza] = useState(false);
  const [duzenle, setDuzenle] = useState<VElement | "yeni" | null>(null);
  const [cip, setCip] = useState<string | null>(null);
  const [acik, setAcik] = useState<Uretim | null>(null);
  const [mesgul, setMesgul] = useState(false);
  const metinRef = useRef<HTMLTextAreaElement>(null);
  const cipAc = (id: string) => (v: boolean) => setCip(v ? id : null);

  const metin = metinler[tur];
  const setMetin = (v: string | ((m: string) => string)) => setMetinler((o) => ({ ...o, [tur]: typeof v === "function" ? v(o[tur]) : v }));
  const videoTur = tur !== "foto";
  const birim = videoTur ? videoKrediHesap(model) : FOTO_MODELLER.find((x) => x.deger === fotoModel)?.kredi ?? 5;
  const adet = tur === "konus" ? diller.length : tur === "foto" ? fotoAdet : tur === "mesaj" ? isimler.length : 1;
  const kredi = birim * Math.max(1, adet);
  const demo = sag !== null && !(videoTur ? VIDEO_HAZIR(sag) : GORSEL_HAZIR(sag));
  const rizaGerek = !!karakter && !karakter.ornek;
  const sozSayisi = metin.trim().split(/\s+/).filter(Boolean).length;
  const konusma = Math.max(1, Math.round(sozSayisi / 2.4));
  const C = cekim === "ozel" ? { deger: "ozel", ad: ozelCekim, alt: "Kendi tarifin", en: ozelCekim, kapak: CEKIMLER[0].kapak } : CEKIMLER.find((x) => x.deger === cekim)!;
  const M = mekan === "ozel" ? { deger: "ozel", ad: ozelMekan, alt: "Kendi tarifin", en: `in ${ozelMekan}`, kapak: "" } : MEKANLAR.find((x) => x.deger === mekan)!;
  const D = DUYGULAR.find((x) => x.deger === duygu)!;
  const Tr = trend === "ozel" ? { deger: "ozel", ad: ozelTrend, alt: "Kendi akımın" } : TRENDLER.find((x) => x.deger === trend)!;
  const trendGorsel = trend === "ozel" ? "k-pop" : trend;
  const T = TURLER.find((x) => x.id === tur)!;
  const ilkDil = DILLER.find((d) => d.deger === diller[0]) ?? DILLER[0];
  const sade = metin.replaceAll("{isim}", " ").trim();
  const yeterli = demo || krediBakiye >= kredi;
  const calisan = sonuclar.filter((u) => u.durum === "kuyrukta" || u.durum === "isleniyor").length;

  const engel = !karakter ? "Önce bir karakter seç"
    : !karakter.gorseller.length ? "Karakterin görseli yok; düzenleyip bir görsel ekle"
    : (tur === "konus" || tur === "mesaj") && sade.length < 3 ? (tur === "mesaj" ? "Mesaj şablonunu yaz" : "Karakterin ne söyleyeceğini yaz")
    : tur === "foto" && sade.length < 3 ? "Görünümü yaz ya da bir paket seç"
    : sade.length >= 3 && !konuAnlamli(sade) ? "Metin anlamlı görünmüyor; gerçek bir cümle yaz"
    : tur === "konus" && !diller.length ? "En az bir dil seç"
    : tur === "mesaj" && !isimler.length ? "En az bir hayran adı ekle"
    : tur === "mesaj" && !metin.includes("{isim}") ? "Şablona {isim} ekle"
    : rizaGerek && !riza ? "Görüntü kullanım iznini onayla"
    : !yeterli ? `Yetersiz kredi: ${kredi} gerekli` : null;

  const ornekTekEkle = (ad: string) => {
    const o = ORNEK_KARAKTERLER.find((x) => x.ad === ad)!;
    const st = useElements.getState();
    const var_ = st.elementler.find((e) => e.ad.toLocaleLowerCase("tr") === ad.toLocaleLowerCase("tr"));
    if (var_) { karakterSec(var_.id); return; }
    const r = st.ekle({ ad: o.ad, tur: "karakter", aciklama: o.aciklama, gorseller: [ornekGorsel(o.ad)], ornek: true });
    if (r.id) { karakterSec(r.id); toast.success(`@${o.ad} eklendi`, { description: "Elementlerinde de görünür; @Ad yazarak her stüdyoda kullanabilirsin." }); }
    else if (r.hata) toast.error("Karakter eklenemedi", { description: r.hata });
  };
  const eklenmemis = ORNEK_KARAKTERLER.filter((o) => !karakterler.some((k) => k.ad.toLocaleLowerCase("tr") === o.ad.toLocaleLowerCase("tr")));
  function karakterSec(id: string) { setKarakterId(id); setRiza(false); setCip(null); }
  const isimEkle = (ham: string) => {
    const yeni = ham.split(/[,\n;]/).map((x) => x.trim()).filter(Boolean);
    if (!yeni.length) return;
    setIsimler((l) => [...new Set([...l, ...yeni])].slice(0, EN_COK_ISIM));
    setIsimGir("");
  };
  const imlecEkle = (parca: string) => {
    const el = metinRef.current;
    if (!el) return setMetin((m) => m + parca);
    const a = el.selectionStart ?? metin.length, b = el.selectionEnd ?? a;
    setMetin(metin.slice(0, a) + parca + metin.slice(b));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + parca.length, a + parca.length); });
  };
  const odakla = () => requestAnimationFrame(() => metinRef.current?.focus());
  const turSec = (t: Tur) => { setTur(t); setCip(null); };

  const uret = () => {
    if (engel || !karakter) {
      if (!karakter) setCip("karakter"); else if (!sade) odakla();
      return void toast.error("Üretim başlatılamadı", { description: `${engel ?? "Önce bir karakter seç"}.` });
    }
    setMesgul(true);
    const grupId = `fans_${Date.now().toString(36)}`;
    const kapak = karakter.gorseller[0];
    const sahne = [C.en, M.en].filter(Boolean).join(", ");
    const isler: { baslik: string; prompt: string; tur: "video" | "gorsel"; etiket: string; ozet: string; ek?: Record<string, unknown> }[] = [];
    if (tur === "konus") {
      for (const d of diller) {
        const L = DILLER.find((x) => x.deger === d)!;
        isler.push({ baslik: `@${karakter.ad} · ${L.ad} · ${metin.trim().slice(0, 28)}`, etiket: L.deger.startsWith("en") ? `${L.ad} (${L.aksan})` : L.ad, ozet: `${L.ad}: ${metin.trim()}`, tur: "video",
          prompt: `@${karakter.ad} ${sahne}. Speaking directly to the camera with a ${D.en} expression and natural gestures, in ${L.en}${d === "tr" ? "" : " (translate the line naturally)"}, saying: "${metin.trim()}". Accurate lip-sync, natural voice that fits the character, vertical social video.`,
          ek: { demoKlip: KONUSAN_DEMO, fansDil: d } });
      }
    } else if (tur === "mesaj") {
      for (const isim of isimler) {
        const satir = metin.trim().replaceAll("{isim}", isim);
        isler.push({ baslik: `@${karakter.ad} → ${isim}`, etiket: isim, ozet: satir, tur: "video", prompt: `@${karakter.ad} ${sahne}. Records a personal ${D.en} video message to a fan named ${isim}, looking into the camera and saying: "${satir}". Says the name ${isim} clearly. Accurate lip-sync, natural voice.`, ek: { demoKlip: KONUSAN_DEMO } });
      }
    } else if (tur === "trend") {
      isler.push({ baslik: `@${karakter.ad} · ${Tr.ad}`, etiket: Tr.ad, ozet: `${Tr.ad} akımı${metin.trim() ? `, ${metin.trim()}` : ""}`, tur: "video", prompt: `@${karakter.ad} ${M.en ? `${M.en}, ` : ""}performs the viral "${Tr.ad}" (${trend === "ozel" ? Tr.ad : trend.replace("-", " ")}) trend move with ${D.en} energy${metin.trim() ? `. ${metin.trim()}` : ""}. Keep the character's face and outfit identical.`, ek: { hareket: Tr.ad, demoKlip: { video: trendVideo(trendGorsel), poster: trendKapak(trendGorsel) } } });
    } else {
      const tema = metin.trim();
      const paket = FOTO_PAKETLER.find((p) => p.tema === tema);
      const havuz = [...new Set([...(paket?.ornek ?? []), ...FOTO_HAVUZ])];
      for (let i = 0; i < fotoAdet; i++) {
        const [en, tr] = KARELER[i % KARELER.length];
        isler.push({ baslik: `@${karakter.ad} · ${tema.slice(0, 28)} · ${i + 1}/${fotoAdet}`, etiket: tr, ozet: `${tr}, ${tema}`, tur: "gorsel",
          prompt: `@${karakter.ad}, ${tema}${M.en ? `, ${M.en}` : ""}. Candid social media photo dump shot ${i + 1} of ${fotoAdet}: ${en}. Same face, same outfit and same day across the set, natural lighting, shot on phone.`,
          ek: { demoOrnek: havuz[i % havuz.length], referanslar: [kapak] } });
      }
    }
    let ok = 0;
    for (const [i, is] of isler.entries()) {
      const meta = { hamIstem: is.ozet, fansEtiket: is.etiket, grupId, sira: i, fansTur: tur, fansMetin: metin.trim(), karakterId: karakter.id, karakterKapak: kapak, karakterAd: karakter.ad, ...is.ek };
      const r = is.tur === "video"
        ? uretimBaslat({ baslik: is.baslik.slice(0, 60), tur: "video", model, prompt: is.prompt, kredi: birim, arac: ARAC_ADI, meta: { ...meta, gorselUrl: kapak, oran: oran === "4:5" ? "9:16" : oran, sure: "8sn" } as never })
        : uretimBaslat({ baslik: is.baslik.slice(0, 60), tur: "gorsel", model: fotoModel, prompt: is.prompt, kredi: birim, arac: ARAC_ADI, meta: { ...meta, oran } as never });
      if (!r.ok) { uretimHataToast(r); break; }
      ok++;
    }
    setMesgul(false);
    if (!ok) return;
    setGorunum("studyo");
    toast.success(`${ok} ${videoTur ? "video" : "kare"} üretiliyor`, { description: `@${karakter.ad}, ${T.ad.toLocaleLowerCase("tr")}. ${demo ? "Kredi düşmez." : `${birim * ok} kredi.`}` });
  };
  const uretRef = useRef(uret); uretRef.current = uret;

  /** Bir üretim turunun ayarlarını komut kutusuna geri yükler. */
  const ayarlariKullan = (g: Uretim[]) => {
    const u = g[0], m = fm(u), t = grupTur(u);
    setTur(t);
    if (m.karakterId && karakterler.some((k) => k.id === m.karakterId)) setKarakterId(m.karakterId);
    if (m.fansMetin) setMetinler((o) => ({ ...o, [t]: m.fansMetin! }));
    if (t === "mesaj") setIsimler(g.map((x) => etiketAl(x) ?? "").filter(Boolean));
    if (t === "konus") { const dl = g.map((x) => fm(x).fansDil).filter(Boolean) as string[]; if (dl.length) setDiller([...new Set(dl)]); }
    if (t === "foto") setFotoAdet([2, 4, 6, 8].includes(g.length) ? g.length : 4);
    if (u.tur === "video") setModel(u.model); else setFotoModel(u.model);
    setGorunum("studyo"); setCip(null);
    toast("Ayarlar komut kutusuna alındı", { description: "Değiştirip yeniden üretebilirsin." });
    odakla();
  };

  /* ═════════ Üretim grupları ═════════ */
  const gruplar = useMemo(() => {
    const m = new Map<string, Uretim[]>();
    for (const u of sonuclar) { const g = fm(u).grupId ?? u.id; m.set(g, [...(m.get(g) ?? []), u]); }
    return [...m.values()].map((l) => [...l].sort((a, b) => (fm(a).sira ?? 0) - (fm(b).sira ?? 0)));
  }, [sonuclar]);

  /* ═════════ KOMUT KUTUSU: çipler ═════════ */
  const dilCip = (
    <KCip buyuk etiket="Diller" ikon={<Bayrak b={ilkDil.bayrak} boyut={18} />} deger={diller.length > 1 ? `${ilkDil.ad} ve ${diller.length - 1} dil` : diller.length ? ilkDil.ad : "Dil seç"} acik={cip === "dil"} setAcik={cipAc("dil")} genislik={440} vurgu={!diller.length}>
      <MenuKart baslik="Konuşma dilleri" sag={<span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[12px] font-medium tabular-nums text-metin">{diller.length} video</span>}>
        <div className="grid grid-cols-2 gap-1.5 p-1.5">
          {DILLER.map((d) => {
            const a = diller.includes(d.deger), no = diller.indexOf(d.deger) + 1;
            return (
              <button key={d.deger} onClick={() => setDiller((l) => (a ? l.filter((x) => x !== d.deger) : [...l, d.deger]))} aria-pressed={a}
                className={cn("relative flex min-w-0 items-center gap-2.5 rounded-[12px] p-2 text-left ring-1 ring-inset transition-[background-color,box-shadow,transform] active:scale-[0.97]", a ? "bg-white/[0.08] ring-white/40" : "ring-white/[0.05] hover:bg-white/[0.05]")}>
                <Bayrak b={d.bayrak} boyut={22} />
                <span className="min-w-0 flex-1 leading-tight"><span className="block truncate text-[13px] font-medium text-metin">{d.ad}</span><span className="block truncate text-[11.5px] text-metin-3">{d.aksan}</span></span>
                <AnimatePresence>{a && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={YAY} className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold tabular-nums text-black">{no}</motion.span>}</AnimatePresence>
              </button>
            );
          })}
        </div>
      </MenuKart>
    </KCip>
  );
  const cekimCip = (
    <KCip buyuk etiket="Çekim" ikon={/* eslint-disable-next-line @next/next/no-img-element */ <img src={C.kapak} alt="" className="h-full w-full object-cover" />} deger={C.ad} acik={cip === "cekim"} setAcik={cipAc("cekim")} genislik={540}>
      <OzelGirdi deger={ozelCekim} set={setOzelCekim} secili={cekim === "ozel"} ph="Ör. salıncakta otururken, alt açıdan" uygula={() => { setCekim("ozel"); setCip(null); }} />
      <div className="grid grid-cols-3 gap-2 p-0.5">{CEKIMLER.map((x) => <GorselSec key={x.deger} sec={cekim === x.deger} ad={x.ad} alt={x.alt} kapak={x.kapak} video={x.video} onClick={() => { setCekim(x.deger); setCip(null); }} />)}</div>
    </KCip>
  );
  const mekanKapak = M.kapak || karakter?.gorseller[0] || ornekGorsel("Aria");
  const mekanCip = (
    <KCip buyuk etiket="Mekân" ikon={M.kapak ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={M.kapak} alt="" className="h-full w-full object-cover" /> : <MapPin className="h-4 w-4" />} deger={M.ad} acik={cip === "mekan"} setAcik={cipAc("mekan")} genislik={480}>
      <OzelGirdi deger={ozelMekan} set={setOzelMekan} secili={mekan === "ozel"} ph="Ör. İstanbul'da bir vapurun güvertesi" uygula={() => { setMekan("ozel"); setCip(null); }} />
      <div className="grid grid-cols-4 gap-2 p-0.5 max-sm:gap-1.5">{MEKANLAR.map((x) => <GorselSec key={x.deger} sec={mekan === x.deger} ad={x.ad} alt={x.alt} kapak={x.kapak || mekanKapak} oran="aspect-[3/4]" onClick={() => { setMekan(x.deger); setCip(null); }} />)}</div>
    </KCip>
  );
  const duyguCip = (
    <KCip buyuk etiket="Duygu" ikon={<D.ikon className="h-4 w-4" />} deger={D.ad} acik={cip === "duygu"} setAcik={cipAc("duygu")} genislik={380}>
      <MenuKart baslik="Yüz ifadesi ve ses tonu">
        <div className="grid grid-cols-3 gap-1.5 p-1.5">
          {DUYGULAR.map((d) => {
            const sec = duygu === d.deger;
            return (
              <button key={d.deger} onClick={() => { setDuygu(d.deger); setCip(null); }} aria-pressed={sec}
                className={cn("flex flex-col items-center gap-1.5 rounded-[12px] px-1.5 pb-2.5 pt-3 text-center ring-1 ring-inset transition-[background-color,box-shadow,transform] active:scale-95", sec ? "bg-white/[0.08] ring-white/40" : "ring-white/[0.06] hover:bg-white/[0.05]")}>
                <span className={cn("flex h-9 w-9 items-center justify-center rounded-full transition-colors", sec ? "bg-white text-black" : "bg-white/[0.07] text-metin-2")}><d.ikon className="h-[18px] w-[18px]" /></span>
                <span className="text-[13px] font-medium leading-tight text-metin">{d.ad}</span>
                <span className="-mt-1 text-[11.5px] leading-tight text-metin-3">{d.alt}</span>
              </button>
            );
          })}
        </div>
      </MenuKart>
    </KCip>
  );
  const modelListe = videoTur ? VIDEO_MODELLER.map((m) => ({ ...m, kredi: videoKrediHesap(m.deger) })) : FOTO_MODELLER;
  const seciliModel = videoTur ? model : fotoModel;
  const modelCip = (
    <KCip buyuk etiket="Model ve oran" ikon={<MarkaKare ad={seciliModel} boyut={26} />} deger={<>{seciliModel}<span className="max-sm:hidden"> · {oran}</span></>} acik={cip === "model"} setAcik={cipAc("model")} genislik={500}>
      <div className="space-y-2 p-0.5">
        <MenuKart baslik={videoTur ? "Video modeli" : "Görsel modeli"} sag={<span className="text-[11.5px] text-metin-3">Kredi {videoTur ? "video" : "kare"} başına</span>}>
          <div className="grid grid-cols-2 gap-1.5 p-1.5">
            {modelListe.map((m, k) => {
              const sec = seciliModel === m.deger;
              return (
                <motion.button key={m.deger} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.025 * k }} whileTap={{ scale: 0.98 }}
                  onClick={() => (videoTur ? setModel(m.deger) : setFotoModel(m.deger))} aria-pressed={sec}
                  className={cn("flex flex-col gap-2 rounded-[14px] p-2.5 text-left ring-1 ring-inset transition-[background-color,box-shadow]", sec ? "bg-white/[0.08] ring-white/70" : "bg-white/[0.025] ring-white/[0.06] hover:bg-white/[0.05] hover:ring-white/20")}>
                  <span className="flex items-center gap-2">
                    <MarkaKare ad={m.deger} boyut={30} />
                    <span className={cn("ml-auto flex h-6 items-center gap-1 rounded-full px-2 text-[11.5px] font-semibold tabular-nums", sec ? "bg-white text-black" : "bg-white/[0.06] text-metin-2")}><KrediYildiz className="h-3 w-3" />{m.kredi}</span>
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className="flex items-center gap-1.5"><span className="truncate text-[13.5px] font-semibold text-metin">{m.ad}</span>{"rozet" in m && m.rozet && <span className="shrink-0 rounded-full bg-white/[0.08] px-1.5 py-px text-[10.5px] font-medium text-metin-2">{m.rozet}</span>}</span>
                    <span className="mt-0.5 block truncate text-[11.5px] text-metin-3">{m.alt}</span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        </MenuKart>
        <MenuKart baslik="En-boy oranı" sag={<span className="text-[11.5px] text-metin-3">{ORAN_AMAC[oran]}</span>}>
          <div className="p-2"><Segment etiket="Oran" deger={oran} onDegis={setOran} secenekler={ORANLAR.map((o) => [o, o] as const)} /></div>
        </MenuKart>
      </div>
    </KCip>
  );
  const trendCip = (
    <KCip buyuk etiket="Akım" ikon={/* eslint-disable-next-line @next/next/no-img-element */ <img src={trendKapak(trendGorsel)} alt="" className="h-full w-full object-cover" />} deger={Tr.ad} acik={cip === "trend"} setAcik={cipAc("trend")} genislik={560}>
      <OzelGirdi deger={ozelTrend} set={setOzelTrend} secili={trend === "ozel"} ph="Ör. robot dansı, ağır çekim saç savurma" alt="Listede olmayan akımı tarif et" uygula={() => { setTrend("ozel"); setCip(null); }} />
      <div className="grid grid-cols-4 gap-2 p-0.5 max-sm:gap-1.5">{TRENDLER.map((x) => <GorselSec key={x.deger} sec={trend === x.deger} ad={x.ad} alt={x.alt} kapak={trendKapak(x.deger)} video={trendVideo(x.deger)} oran="aspect-[3/4]" onClick={() => { setTrend(x.deger); setCip(null); }} />)}</div>
    </KCip>
  );
  const adetCip = (
    <KCip buyuk etiket="Kare sayısı" ikon={<Images className="h-4 w-4" />} deger={`${fotoAdet} kare`} acik={cip === "adet"} setAcik={cipAc("adet")} genislik={340}>
      <div className="space-y-2 p-0.5">
        <MenuKart baslik="Kaç kare"><div className="p-2"><Segment etiket="Kare sayısı" deger={fotoAdet} onDegis={setFotoAdet} secenekler={[2, 4, 6, 8].map((n) => [n, `${n} kare`] as const)} /></div></MenuKart>
        <MenuKart baslik="Her kare farklı poz">
          <div className="grid grid-cols-2 gap-1 p-1.5">
            {KARELER.map(([, tr], i) => (
              <motion.span key={tr} animate={{ opacity: i < fotoAdet ? 1 : 0.35 }} className="flex items-center gap-2 rounded-[10px] px-2 py-1.5 text-[12.5px] text-metin">
                <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums transition-colors", i < fotoAdet ? "bg-white text-black" : "bg-white/[0.08] text-metin-3")}>{i + 1}</span>{tr}
              </motion.span>
            ))}
          </div>
        </MenuKart>
      </div>
    </KCip>
  );
  const cipler = tur === "konus" ? <>{dilCip}{cekimCip}{mekanCip}{duyguCip}{modelCip}</>
    : tur === "mesaj" ? <>{cekimCip}{mekanCip}{duyguCip}{modelCip}</>
    : tur === "foto" ? <>{adetCip}{mekanCip}{modelCip}</>
    : <>{trendCip}{mekanCip}{duyguCip}{modelCip}</>;

  /* Karakter yuvası + seçici */
  const yeniKaro = (
    <button key="yeni" onClick={() => { setCip(null); setDuzenle("yeni"); }} className="flex aspect-[3/4] min-w-0 flex-col items-center justify-center gap-1.5 rounded-[12px] bg-white/[0.05] text-metin-2 ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.09] hover:text-metin active:scale-95">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08]"><Plus className="h-4 w-4" /></span><span className="text-[12px] font-medium">Kendi karakterin</span>
    </button>
  );
  const hazirKaro = (o: (typeof ORNEK_KARAKTERLER)[number]) => (
    <button key={o.ad} onClick={() => ornekTekEkle(o.ad)} title={`@${o.ad} ekle`} className="group relative block aspect-[3/4] min-w-0 overflow-hidden rounded-[12px] bg-black text-left ring-1 ring-inset ring-white/10 hover:ring-white/35">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ornekGorsel(o.ad)} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition group-hover:bg-white group-hover:text-black"><Plus className="h-3.5 w-3.5" /></span>
      <span className="absolute inset-x-1.5 bottom-1.5 truncate text-[12px] font-semibold text-white/90">@{o.ad}</span>
    </button>
  );
  const karakterIzgara = (sutun: string, kapat: boolean, hazirlarla = false) => (
    <div className={cn("grid gap-2", sutun)}>
      {karakterler.map((k) => {
        const s = k.id === karakterId;
        return (
          <button key={k.id} onClick={() => { karakterSec(k.id); if (!kapat) setGorunum("studyo"); }} aria-pressed={s} title={`@${k.ad}`} className="group relative block aspect-[3/4] min-w-0 overflow-hidden rounded-[12px] bg-black text-left">
            <ElementKapak e={k} className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-105" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <span className={cn("pointer-events-none absolute inset-0 rounded-[12px] ring-inset transition", s ? "ring-2 ring-white" : "ring-1 ring-white/10 group-hover:ring-white/35")} />
            <span className={cn("absolute inset-x-1.5 bottom-1.5 truncate text-[12px] font-semibold", s ? "text-white" : "text-white/80")}>@{k.ad}</span>
          </button>
        );
      })}
      {yeniKaro}
      {hazirlarla && eklenmemis.map(hazirKaro)}
    </div>
  );
  const hazirIzgara = (sutun: string, yeni: boolean) => (
    <div className={cn("grid gap-2", sutun)}>
      {eklenmemis.map(hazirKaro)}
      {yeni && yeniKaro}
    </div>
  );
  const karakterCip = (
    <div className="relative shrink-0">
      <button onClick={() => setCip(cip === "karakter" ? null : "karakter")} aria-expanded={cip === "karakter"} aria-label={karakter ? `Karakter: ${karakter.ad}, değiştir` : "Karakter seç"} title="Karakter"
        className={cn("relative block h-[92px] w-[70px] overflow-hidden rounded-[16px] transition active:scale-95 max-sm:h-[76px] max-sm:w-[58px]", karakter ? "bg-black" : "bg-amber-300/[0.08]")}>
        {karakter ? <motion.span key={karakter.id} initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} transition={YAY} className="absolute inset-0"><ElementKapak e={karakter} className="h-full w-full" /></motion.span>
          : <span className="flex h-full flex-col items-center justify-center gap-1 text-amber-100"><UserRound className="h-5 w-5" /><span className="text-[11px] font-medium">Karakter</span></span>}
        {karakter && <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/85 to-transparent px-1 pb-1 pt-5 text-center text-[11px] font-semibold text-white">@{karakter.ad}</span>}
        <span className={cn("pointer-events-none absolute inset-0 rounded-[16px] ring-inset transition", cip === "karakter" ? "ring-2 ring-white" : karakter ? "ring-1 ring-white/15" : "ring-1 ring-amber-300/35")} />
      </button>
      <Yuzen acik={cip === "karakter"} onKapat={() => setCip(null)} yerlesim="ust-sol" bosluk={10} etiket="Karakter" className="flex max-h-[min(70vh,600px)] flex-col overflow-hidden rounded-[18px] border border-white/[0.09] bg-[#1b1c1f]" style={{ width: "min(460px, calc(100vw - 24px))" }}>
        <div className="flex items-center gap-2 px-3.5 pb-1 pt-3"><p className="flex-1 text-[13px] font-semibold text-metin">Karakter</p>
          <button onClick={() => { setCip(null); router.push(karakterId ? `/panel/karakter/${karakterId}` : "/panel/karakter"); }} className="flex h-7 items-center rounded-full bg-white/[0.07] px-3 text-[12px] font-medium text-metin-2 transition hover:bg-white/[0.12] hover:text-metin">Yönet</button></div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2 [scrollbar-width:thin]">
          {karakterler.length > 0 && (
            <MenuKart baslik="Karakterlerin" sag={<span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] tabular-nums text-metin-2">{karakterler.length}</span>}>
              <div className="p-2">{karakterIzgara("grid-cols-5 max-sm:grid-cols-4", true)}</div>
            </MenuKart>
          )}
          {eklenmemis.length > 0 && <MenuKart baslik={karakterler.length ? "Hazır karakterler" : "Bir karakter seç ya da oluştur"} sag={<span className="text-[11.5px] text-metin-3">Hazırlar izin istemez</span>}><div className="p-2">{hazirIzgara(karakterler.length ? "grid-cols-5 max-sm:grid-cols-4" : "grid-cols-3", !karakterler.length)}</div></MenuKart>}
        </div>
      </Yuzen>
    </div>
  );

  /* Metnin altındaki araçlar (türe göre) */
  const sureHap = (tur === "konus" || tur === "mesaj") && sozSayisi > 0 && (
    <span className={cn("flex h-8 shrink-0 items-center whitespace-nowrap gap-1.5 rounded-full px-3 text-[12.5px] font-medium tabular-nums", konusma > 8 ? "bg-amber-300/[0.1] text-amber-200" : "bg-white/[0.06] text-metin-2")} title="Tahmini konuşma süresi; video 8 sn">
      <Clock className="h-3.5 w-3.5" />{konusma} sn<span className="max-sm:hidden"> / 8 sn</span>
    </span>
  );
  const metinAraclari = (
    <div className="mt-1 flex items-center gap-1.5">
      {tur === "konus" && (
        <div className="relative">
          <button onClick={() => setCip(cip === "kanca" ? null : "kanca")} aria-expanded={cip === "kanca"} className={cn(ARAC, cip === "kanca" && "bg-white/[0.12] text-metin")}><Lightbulb className="h-3.5 w-3.5" />Açılış cümlesi</button>
          <Yuzen acik={cip === "kanca"} onKapat={() => setCip(null)} yerlesim="ust-sol" bosluk={8} etiket="Açılış cümlesi" className="rounded-[18px] border border-white/[0.09] bg-[#1b1c1f] p-2" style={{ width: "min(380px, calc(100vw - 24px))" }}>
            <MenuKart baslik="Açılış cümlesi" sag={<span className="text-[11.5px] text-metin-3">Metnin başına eklenir</span>}>
              <div className="p-2 pb-0"><OzelGirdi deger={ozelKanca} set={setOzelKanca} secili={false} ph="Ör. Bunu ilk kez anlatıyorum…" alt="Kendi açılış cümleni yaz"
                uygula={() => { const k = ozelKanca.trim(); setMetin((m) => (m.startsWith(k) ? m : k + (m ? ` ${m}` : ""))); setOzelKanca(""); setCip(null); odakla(); }} /></div>
              <div className="space-y-0.5 p-1.5">
                {KANCALAR.map((k) => (
                  <button key={k} onClick={() => { setMetin((m) => (m.startsWith(k) ? m : k + (m ? ` ${m}` : ""))); setCip(null); odakla(); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2 py-2 text-left text-[13.5px] text-metin transition-colors hover:bg-white/[0.05]">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-metin-2"><Lightbulb className="h-3.5 w-3.5" /></span>{k}
                  </button>
                ))}
              </div>
            </MenuKart>
          </Yuzen>
        </div>
      )}
      {tur === "mesaj" && <button onClick={() => imlecEkle("{isim}")} title="Metne, her hayranın adının geleceği yeri ekler" className={ARAC}><Users className="h-3.5 w-3.5" />Metne ad ekle</button>}
      {tur === "foto" && (
        <div className="relative">
          <button onClick={() => setCip(cip === "paket" ? null : "paket")} aria-expanded={cip === "paket"} className={cn(ARAC, cip === "paket" && "bg-white/[0.12] text-metin")}><Wand2 className="h-3.5 w-3.5" />Hazır paket</button>
          <Yuzen acik={cip === "paket"} onKapat={() => setCip(null)} yerlesim="ust-sol" bosluk={8} etiket="Hazır paket" className="rounded-[18px] border border-white/[0.09] bg-[#1b1c1f] p-2" style={{ width: "min(460px, calc(100vw - 24px))" }}>
            <MenuKart baslik="Hazır paket" sag={<span className="text-[11.5px] text-metin-3">Tema metne yazılır</span>}>
              <div className="grid grid-cols-3 gap-2 p-2">{FOTO_PAKETLER.map((x) => <GorselSec key={x.ad} sec={metin === x.tema} ad={x.ad} kapak={x.kapak} oran="aspect-[3/4]" onClick={() => { setMetin(x.tema); setCip(null); }} />)}</div>
            </MenuKart>
          </Yuzen>
        </div>
      )}
      
      <span className="flex-1" />
      {metin && <button onClick={() => { setMetin(""); odakla(); }} aria-label="Metni temizle" title="Temizle" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-3 transition hover:bg-white/[0.06] hover:text-metin active:scale-90"><X className="h-4 w-4" /></button>}
      {sureHap}
    </div>
  );

  const isimAlani = tur === "mesaj" && (
    <div className="mt-2.5 overflow-hidden rounded-[18px] bg-white/[0.035] ring-1 ring-inset ring-white/[0.08]">
      <div className="flex flex-wrap items-center gap-1.5 p-1.5">
        <span className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.07] pl-1 pr-2.5 text-[12.5px] font-semibold text-metin">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.1]"><Users className="h-3.5 w-3.5" /></span>Hayranlar<span className="font-medium tabular-nums text-metin-3">{isimler.length}/{EN_COK_ISIM}</span>
        </span>
        <AnimatePresence initial={false}>
          {isimler.map((n) => (
            <motion.span key={n} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.18 }}
              className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] pl-1 pr-1 text-[13px] font-medium text-metin ring-1 ring-inset ring-white/[0.08]">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px] font-bold text-black">{n.charAt(0).toLocaleUpperCase("tr")}</span>{n}
              <button onClick={() => setIsimler((l) => l.filter((x) => x !== n))} aria-label={`${n} kaldır`} className="flex h-6 w-6 items-center justify-center rounded-full text-metin-3 transition hover:bg-white/10 hover:text-metin"><X className="h-3 w-3" /></button>
            </motion.span>
          ))}
        </AnimatePresence>
        <input value={isimGir} onChange={(e) => setIsimGir(e.target.value)} placeholder={isimler.length ? "Bir ad daha ekle" : "Hayranın adını yaz, Enter ile ekle (ör. Ayşe, Mert)"} aria-label="Hayran adı"
          onPaste={(e) => { const t = e.clipboardData.getData("text"); if (/[,\n;]/.test(t)) { e.preventDefault(); isimEkle(t); } }}
          onBlur={() => isimGir.trim() && isimEkle(isimGir)}
          onKeyDown={(e) => { if ((e.key === "Enter" || e.key === ",") && isimGir.trim()) { e.preventDefault(); isimEkle(isimGir); } else if (e.key === "Backspace" && !isimGir && isimler.length) setIsimler((l) => l.slice(0, -1)); }}
          className="h-8 min-w-[180px] flex-1 bg-transparent px-1.5 text-[13px] text-metin outline-none placeholder:text-metin-3" />
        <AnimatePresence>{isimGir.trim() && <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={() => isimEkle(isimGir)} className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black active:scale-95"><Plus className="h-3.5 w-3.5" />Ekle</motion.button>}</AnimatePresence>
        {isimler.length > 1 && <button onClick={() => setIsimler([])} className="h-8 shrink-0 rounded-full px-2.5 text-[12px] font-medium text-metin-3 transition-colors hover:bg-white/[0.06] hover:text-metin">Temizle</button>}
      </div>
      <AnimatePresence initial={false}>
        {isimler.length > 0 && metin.includes("{isim}") && (
          <motion.div key="onizle" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <span className="flex items-start gap-2.5 border-t border-white/[0.06] px-3 py-2.5 text-[12.5px] leading-snug text-metin-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.08]"><Play className="h-3 w-3 fill-current text-metin" /></span>
              <span className="min-w-0"><b className="font-semibold text-metin">{isimler[0]}</b> duyacak: “{metin.replaceAll("{isim}", isimler[0]).slice(0, 160)}”</span>
            </span>
          </motion.div>
        )}
        {isimler.length > 0 && !metin.includes("{isim}") && (
          <motion.button key="uyari" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} onClick={() => imlecEkle("{isim}")}
            className="flex w-full items-center gap-2 overflow-hidden border-t border-white/[0.06] px-3 py-2.5 text-left text-[12.5px] text-amber-100/90 hover:bg-white/[0.03]">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />Metne hayranın adını koymak için dokun
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );

  // Tek durum hapı: kullanıcı bir şey yazdıysa eksik olanı, yoksa demo ya da bakiye.
  const durumHap = engel && (sade || karakter) && engel !== "Karakterin ne söyleyeceğini yaz" && engel !== "Görünümü yaz ya da bir paket seç"
    ? <span className="max-w-[360px] truncate rounded-full bg-amber-300/[0.08] px-2.5 py-1 text-[11.5px] text-amber-200/90 ring-1 ring-inset ring-amber-300/20 max-sm:hidden">{engel}</span>
    : demo ? null
    : <span className="rounded-full px-2.5 py-1 text-[11.5px] tabular-nums text-metin-2 ring-1 ring-inset ring-white/[0.1] max-sm:hidden">Bakiye {krediBakiye.toLocaleString("tr-TR")}</span>;

  const komut = (
    <div className="pointer-events-auto w-full">
      <div className="mb-2 flex items-center gap-2 max-sm:flex-col max-sm:items-stretch">
        <div role="radiogroup" aria-label="İçerik türü" className="cam-istemci isolate grid grid-cols-4 gap-0.5 rounded-full p-1 max-sm:w-full">
          {TURLER.map((x) => (
            <button key={x.id} role="radio" aria-checked={tur === x.id} onClick={() => turSec(x.id)}
              className={cn("relative flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors max-sm:px-1 max-sm:text-[11.5px]", tur === x.id ? "text-black" : "text-metin-2 hover:text-metin")}>
              {tur === x.id && <motion.span layoutId="fa-tur" transition={KAYAN} className="absolute inset-0 -z-10 rounded-full bg-white" />}
              <x.ikon className="h-3.5 w-3.5 max-sm:hidden" />{x.ad}
            </button>
          ))}
        </div>
        <span className="flex-1 max-sm:hidden" />
      </div>
    <div className="cam-istemci relative w-full rounded-[26px] p-3">
      <div className="flex gap-3 max-sm:gap-2.5">
        {karakterCip}
        <div className="min-w-0 flex-1">
          <textarea ref={metinRef} value={metin} onChange={(e) => setMetin(e.target.value.slice(0, 400))} rows={2} aria-label="Metin"
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); uret(); } }}
            placeholder={tur === "konus" ? (masaustu ? "Karakterin ne söylesin? Örneğin: Bugün size en sevdiğim üç ürünü göstereceğim!" : "Karakterin ne söylesin?") : tur === "mesaj" ? "Selam {isim}! Desteğin için teşekkürler." : tur === "foto" ? (masaustu ? "Görünüm ve tema: beyaz keten gömlek, hasır şapka, tatil havası" : "Görünüm ve tema") : "Ek not: sonunda kameraya göz kırpsın"}
            className="block max-h-[120px] min-h-[52px] w-full resize-none bg-transparent px-1 py-1 text-[15.5px] leading-relaxed text-metin outline-none placeholder:text-metin-2 [field-sizing:content] [scrollbar-width:thin]" />
          {metinAraclari}
        </div>
      </div>
      {isimAlani}
      <AnimatePresence initial={false}>
        {rizaGerek && (
          <motion.div key="riza" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <button onClick={() => setRiza((v) => !v)} aria-pressed={riza} className={cn("mt-2 flex w-full items-start gap-2.5 rounded-[14px] px-3 py-2.5 text-left ring-1 ring-inset transition-colors", riza ? "bg-white/[0.04] ring-white/[0.08]" : "bg-amber-300/[0.06] ring-amber-300/25")}>
              <span className={cn("mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] ring-1 transition-colors", riza ? "bg-white text-black ring-white" : "ring-white/30")}>{riza && <Check className="h-3 w-3" strokeWidth={3} />}</span>
              <span className="text-[12.5px] leading-snug text-metin-2"><b className="font-semibold text-metin">Görüntü kullanım izni.</b> Bu karakter gerçek bir kişiyse açık izni var; içeriğin yapay zekâyla üretildiğini belirterek paylaşacağım.</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-2.5 flex items-center gap-2 border-t border-white/[0.08] pt-2.5 max-sm:flex-col max-sm:items-stretch">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] max-sm:grid max-sm:grid-cols-2 max-sm:overflow-visible max-sm:[&>*:last-child:nth-child(odd)]:col-span-2 [&>*]:shrink-0 max-sm:[&>*>button]:w-full max-sm:[&>*>button>span:nth-child(2)]:min-w-0 max-sm:[&>*>button>span:nth-child(2)]:flex-1 max-sm:[&_.whitespace-nowrap]:block max-sm:[&_.whitespace-nowrap]:max-w-full max-sm:[&_.whitespace-nowrap]:truncate">{cipler}</div>
        {durumHap}
        <button onClick={uret} disabled={mesgul} title={engel ?? "Ctrl+Enter"} className="group flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 text-[14.5px] font-semibold text-black transition active:scale-95 max-sm:w-full">
          {mesgul ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />}
          <span>Üret{adet > 1 && <> <motion.span key={adet} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={YAY} className="inline-block tabular-nums">{adet}</motion.span> {videoTur ? "video" : "kare"}</>}</span>
          {!demo && <span className="flex items-center gap-0.5 rounded-full bg-black/10 px-2 py-0.5 text-[12px] tabular-nums"><KrediYildiz className="h-3 w-3" />{kredi}</span>}
        </button>
      </div>
    </div>
    </div>
  );

  /* ═════════ BAŞLIK KARTI ═════════ */
  const ust = (
    <div className="flex min-h-[64px] items-center gap-3 rounded-[22px] bg-[#121315] px-3 py-2.5 ring-1 ring-inset ring-white/[0.07] sm:px-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.07] text-white max-sm:hidden"><Heart className="h-5 w-5" /></span>
      <span className="min-w-0 max-sm:hidden"><span className="block truncate text-[15.5px] font-semibold tracking-[-0.01em] text-white">Fans stüdyosu</span><span className="block truncate text-[12.5px] text-white/50">Tek karakter, her gün yeni içerik</span></span>
      <span className="flex-1" />
      <div role="tablist" className="isolate flex gap-0.5 rounded-full p-[3px] ring-1 ring-inset ring-white/[0.08] max-sm:w-full" style={{ background: "rgba(255,255,255,0.04)" }}>
        {([["studyo", "Stüdyo", Sparkles, 0], ["icerik", "İçeriklerim", Film, sonuclar.length]] as const).map(([id, ad, I, n]) => (
          <button key={id} role="tab" aria-selected={gorunum === id} onClick={() => setGorunum(id)} className={cn("relative flex h-9 items-center justify-center gap-1.5 rounded-full px-4 text-[13.5px] font-medium transition-colors max-sm:flex-1 max-sm:px-2 max-sm:text-[12.5px]", gorunum === id ? "text-black" : "text-metin-2 hover:text-metin")}>
            {gorunum === id && <motion.span layoutId="fa-ust" transition={KAYAN} className="absolute inset-0 -z-10 rounded-full bg-white" />}
            <I className="h-4 w-4 max-sm:hidden" />{ad}
            {id === "icerik" && calisan > 0 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : n > 0 && <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", gorunum === id ? "bg-black/10" : "bg-white/[0.08]")}>{n}</span>}
          </button>
        ))}
      </div>
    </div>
  );

  /* ═════════ STÜDYO: hero ═════════ */
  const heroGorsel = karakter?.gorseller[0] ?? ornekGorsel("Aria");
  const heroAd = karakter?.ad ?? "Aria";
  // Kendi karakterlerin önce; yer kalırsa eklenmemiş hazır karakterler (artı rozetiyle) doldurur.
  const balonlar = [
    ...karakterler.slice(0, 6).map((k) => ({ key: k.id, ad: k.ad, el: k as VElement | null, gorsel: k.gorseller[0], sec: k.id === karakterId, tikla: () => karakterSec(k.id) })),
    ...eklenmemis.slice(0, Math.max(0, 6 - karakterler.length)).map((o) => ({ key: o.ad, ad: o.ad, el: null as VElement | null, gorsel: ornekGorsel(o.ad), sec: false, tikla: () => ornekTekEkle(o.ad) })),
  ];
  const hero = (
    <section className="relative isolate overflow-hidden rounded-[28px] bg-[#0b0c0e] ring-1 ring-inset ring-white/[0.08] lg:min-h-[480px]">
      <AnimatePresence initial={false}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <motion.img key={`bg-${heroGorsel}`} src={heroGorsel} alt="" aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 0.85 }} exit={{ opacity: 0 }} transition={{ duration: 1, ease: EASE }}
          className="absolute inset-0 -z-10 h-full w-full scale-110 object-cover object-[50%_25%] blur-[26px] saturate-[1.15]" />
      </AnimatePresence>
      <span aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#0b0c0e_0%,rgba(11,12,14,0.9)_32%,rgba(11,12,14,0.5)_65%,rgba(11,12,14,0.35)_100%)] max-lg:bg-[linear-gradient(180deg,rgba(11,12,14,0.55)_0%,rgba(11,12,14,0.85)_55%,#0b0c0e_100%)]" />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 px-5 py-7 sm:px-10 lg:min-h-[480px] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12 lg:py-10">
        <div className="min-w-0">
          <h2 className="text-[40px] font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-[58px]">Tek yüz.<br /><span className="hero-isilti">Her gün yeni içerik.</span></h2>
          <p className="mt-4 max-w-[470px] text-[15.5px] leading-relaxed text-white/70">Karakterini bir kez kur; konuşan videolar, foto setleri, hayranlarına adıyla mesajlar ve trend akımlar hep aynı yüzle üretilsin.</p>
          <ol className="mt-6 flex flex-wrap gap-2">
            {([["Karakterini seç", UserRound], ["Türü ve metni seç", Wand2], ["İçeriğin hazır", Film]] as const).map(([a, I], i) => (
              <motion.li key={a} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.06 }} className="flex h-9 items-center gap-2 rounded-full bg-white/[0.07] pl-1 pr-3.5 text-[12.5px] text-white/85 ring-1 ring-inset ring-white/[0.1] backdrop-blur-xl">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.1] text-[12px] font-semibold tabular-nums text-white">{i + 1}</span><I className="h-3.5 w-3.5 text-white/60" />{a}
              </motion.li>
            ))}
          </ol>
          <div className="mt-7 flex flex-wrap items-center gap-2">
            {balonlar.map((b, i) => (
              <motion.button key={b.key} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + i * 0.04, type: "spring", stiffness: 380, damping: 26 }} whileHover={{ y: -2 }} whileTap={{ scale: 0.92 }}
                onClick={b.tikla} title={b.el ? `@${b.ad}` : `@${b.ad} ekle`} aria-pressed={b.sec}
                className="relative h-12 w-12">
                <span className={cn("absolute inset-0 overflow-hidden rounded-full ring-2 transition-[box-shadow]", b.sec ? "ring-white" : "ring-white/15 hover:ring-white/40", !b.el && "opacity-75")}>
                  {b.el ? <ElementKapak e={b.el} className="h-full w-full" /> : /* eslint-disable-next-line @next/next/no-img-element */ <img src={b.gorsel} alt="" className="h-full w-full object-cover object-top" />}
                </span>
                {!b.el && <span className="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white text-black ring-2 ring-[#0b0c0e]"><Plus className="h-3 w-3" strokeWidth={3} /></span>}
              </motion.button>
            ))}
            <button onClick={() => setDuzenle("yeni")} aria-label="Kendi karakterini oluştur" title="Kendi karakterini oluştur" className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08] text-white ring-1 ring-inset ring-white/[0.12] backdrop-blur-xl transition hover:bg-white/[0.14] active:scale-95"><Upload className="h-[18px] w-[18px]" /></button>
            <button onClick={() => router.push(karakterId ? `/panel/karakter/${karakterId}` : "/panel/karakter")} className="flex h-12 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] font-medium text-white ring-1 ring-inset ring-white/[0.12] backdrop-blur-xl transition hover:bg-white/[0.14] active:scale-95">Tümü<span className="tabular-nums text-white/55">{karakterler.length + eklenmemis.length}</span></button>
          </div>
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE, delay: 0.1 }} className="cam-istemci relative mx-auto rounded-[24px] p-3 max-lg:w-fit max-sm:w-full">
          <FansVitrin ad={heroAd} gorsel={heroGorsel} />
        </motion.div>
      </div>
    </section>
  );

  /* Son içerik: en yeni tur büyük, yanında bilgisi, eylemleri ve sıradaki adım */
  const sonG = gruplar[0];
  const sonKart = sonG && (() => {
    const u0 = sonG[0], t = TURLER.find((x) => x.id === grupTur(u0))!, hazirlar = sonG.filter((u) => u.durum === "tamam");
    const video = u0.tur === "video";
    const ilerleme = Math.round(sonG.reduce((a, u) => a + (u.durum === "tamam" ? 100 : u.ilerleme ?? 0), 0) / sonG.length);
    const m = fm(u0), demoU = hazirlar.some((u) => u.gercek === false);
    const baslik = grupBaslik(sonG);
    const ana = hazirlar[0] ?? u0;
    const anaKapak = kapakAl(ana);
    const digerTurler = TURLER.filter((x) => x.id !== t.id);
    return (
      <Kart ikon={t.ikon} baslik="Son içerik" alt={calisan ? `${calisan} içerik üretiliyor` : "En son ürettiğin tur burada"}
        sag={<span className="flex items-center gap-2">{gruplar.length > 1 && <button onClick={() => setGorunum("icerik")} className="flex h-8 items-center rounded-full bg-white/[0.07] px-3 text-[12.5px] font-medium text-metin-2 transition hover:bg-white/[0.12] hover:text-metin">Tümü</button>}<SayiRozet n={sonuclar.length} /></span>}>
        <div className="grid gap-4 p-3.5 sm:grid-cols-[auto_minmax(0,1fr)] sm:p-4">
          <button onClick={() => ana.durum === "tamam" && setAcik(ana)} className="group relative mx-auto block aspect-[9/16] h-[360px] overflow-hidden rounded-[18px] bg-black ring-1 ring-inset ring-white/[0.1] max-sm:h-[320px]">
            {!video && hazirlar.length > 1 ? (
              <span className="absolute inset-0 grid grid-cols-2 gap-[2px]">{hazirlar.slice(0, 4).map((u) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={u.id} src={kapakAl(u)} alt="" className="h-full w-full object-cover" />)}</span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              anaKapak && <img src={anaKapak} alt="" className={cn("absolute inset-0 h-full w-full object-cover object-top", ana.durum !== "tamam" && "opacity-40 blur-[2px]")} />
            )}
            {ana.durum === "tamam" && video && ana.videoUrl && <video key={ana.videoUrl} src={ana.videoUrl} poster={anaKapak} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />}
            {ana.durum !== "tamam" && (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-[13px] font-medium text-white">
                {ana.durum === "hata" ? <AlertTriangle className="h-5 w-5 text-rose-300" /> : <Loader2 className="h-5 w-5 animate-spin" />}
                {ana.durum === "hata" ? "Başarısız" : `%${ilerleme}`}
                {ana.durum !== "hata" && <span className="h-1 w-28 overflow-hidden rounded-full bg-white/15"><motion.span className="block h-full rounded-full bg-white" animate={{ width: `${Math.max(3, ilerleme)}%` }} transition={{ duration: 0.4 }} /></span>}
              </span>
            )}
            {ana.durum === "tamam" && <span className="absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-xl transition group-hover:opacity-100"><Play className="h-4 w-4 fill-current" /></span>}
          </button>
          <div className="flex min-w-0 flex-col gap-3">
            <MenuKart baslik={baslik} sag={<span className="flex items-center gap-0.5 rounded-full bg-white/[0.05] p-0.5 ring-1 ring-inset ring-white/[0.08]"><span className="flex h-7 items-center gap-1.5 rounded-full bg-white/[0.07] pl-0.5 pr-2.5 text-[12.5px] font-semibold text-metin"><span className="[&>span]:!h-6 [&>span]:!w-6 [&>span]:!rounded-full"><MarkaKare ad={u0.model} boyut={24} /></span>{u0.model}</span>{m.oran && <span className="flex h-7 items-center gap-1.5 px-2.5 text-[12.5px] font-medium tabular-nums text-metin-2 max-sm:hidden"><OranSimge o={m.oran} boy={13} />{m.oran}</span>}</span>}>
              <div className="flex items-start gap-3 p-4">
                {m.karakterKapak && /* eslint-disable-next-line @next/next/no-img-element */ <img src={m.karakterKapak} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover object-top ring-1 ring-white/15" />}
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium text-metin-2">@{m.karakterAd ?? u0.baslik.split(" ")[0].replace("@", "")}</span>
                  <span className="mt-0.5 line-clamp-3 block text-[17px] font-medium leading-snug tracking-[-0.01em] text-metin"><SablonMetin m={m.fansMetin || (t.id === "trend" ? `${etiketAl(u0) ?? "Trend"} akımı` : u0.baslik)} /></span>
                </span>
              </div>
              {sonG.length > 1 && (video || sonG.length > 4) && (
                <div className="flex gap-2 overflow-x-auto border-t border-white/[0.06] p-2.5 [scrollbar-width:none]">
                  {sonG.map((u) => (
                    <button key={u.id} onClick={() => u.durum === "tamam" && setAcik(u)} title={etiketAl(u)} className="group relative aspect-[3/4] h-[92px] shrink-0 overflow-hidden rounded-[10px] bg-black ring-1 ring-inset ring-white/[0.08] transition hover:-translate-y-0.5 hover:ring-white/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={kapakAl(u)} alt="" className={cn("absolute inset-0 h-full w-full object-cover object-top", u.durum !== "tamam" && "opacity-40")} />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      {u.durum === "isleniyor" || u.durum === "kuyrukta" ? <Loader2 className="absolute inset-0 m-auto h-4 w-4 animate-spin text-white" /> : u.durum === "hata" ? <AlertTriangle className="absolute inset-0 m-auto h-4 w-4 text-rose-300" /> : null}
                      <span className="absolute inset-x-1 bottom-1 truncate text-center text-[11px] font-medium text-white">{etiketAl(u)}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] px-3 py-2.5">
                {ana.durum === "tamam" && <button onClick={() => setAcik(ana)} className="flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition active:scale-95"><Play className="h-3.5 w-3.5 fill-current" />{video ? "Büyük izle" : "Büyük gör"}</button>}
                {hazirlar.length > 0 && <button onClick={() => indir(sonG)} className="flex h-10 items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[13.5px] font-medium text-metin transition hover:bg-white/[0.12] active:scale-95"><Download className="h-3.5 w-3.5" />{hazirlar.length > 1 ? "Tümünü indir" : "İndir"}</button>}
                <button onClick={() => ayarlariKullan(sonG)} className="flex h-10 items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[13.5px] font-medium text-metin transition hover:bg-white/[0.12] active:scale-95"><RotateCcw className="h-3.5 w-3.5" />Düzenleyip yeniden</button>
              </div>
            </MenuKart>
            <MenuKart baslik={`@${m.karakterAd ?? heroAd} ile devam et`} sag={<span className="text-[12px] text-metin-3 max-sm:hidden">Tıkla, kutu hazırlansın</span>}>
              <div className="grid grid-cols-3 gap-1.5 p-1.5">
                {digerTurler.map((x, i) => (
                  <motion.button key={x.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} onClick={() => { turSec(x.id); odakla(); }}
                    className="group flex items-center gap-3 rounded-[14px] p-2.5 text-left transition-colors hover:bg-white/[0.05] active:scale-[0.98]">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-metin transition-colors group-hover:bg-white group-hover:text-black"><x.ikon className="h-4 w-4" /></span>
                    <span className="min-w-0 leading-tight"><span className="block text-[13.5px] font-semibold text-metin">{x.ad}</span><span className="mt-0.5 block truncate text-[12px] text-metin-3 max-sm:hidden">{x.alt}</span></span>
                  </motion.button>
                ))}
              </div>
            </MenuKart>
          </div>
        </div>
      </Kart>
    );
  })();

  /* Fikirler: seçili türe göre tıklanınca kutuya yazılan başlangıçlar */
  const fikirKart = (
    <Kart ikon={T.ikon} baslik={`${T.ad} fikirleri`} alt={tur === "trend" ? "Tıkla, akım seçilsin; üzerine gelince oynar" : tur === "foto" ? "Tıkla, tema kutuya yazılsın" : "Tıkla, metin kutuya yazılsın"}
      sag={<SayiRozet n={tur === "konus" ? KONUS_FIKIR.length : tur === "mesaj" ? MESAJ_FIKIR.length : tur === "foto" ? FOTO_PAKETLER.length : TRENDLER.length} />}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tur} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
          className={cn("grid gap-3 p-3.5", tur === "trend" ? "grid-cols-2 sm:grid-cols-4 lg:grid-cols-8" : tur === "foto" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5")}>
          {(tur === "konus" || tur === "mesaj") && (tur === "konus" ? KONUS_FIKIR : MESAJ_FIKIR).map((x, i) => (
            <motion.button key={x.ad} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}
              onClick={() => { setMetin(x.metin); odakla(); }}
              className={cn("group relative block aspect-[4/5] overflow-hidden rounded-[18px] bg-black text-left ring-1 ring-inset transition-[box-shadow]", metin === x.metin ? "ring-2 ring-white" : "ring-white/[0.08] hover:ring-white/30")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={x.kapak} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/30" />
              <span className="absolute inset-x-3 top-3 flex items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroGorsel} alt="" className="h-6 w-6 rounded-full object-cover object-top ring-1 ring-white/70" />
                <span className="truncate text-[12px] font-semibold text-white">@{heroAd}</span>
                <span className="ml-auto rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">{x.ad}</span>
              </span>
              <span className="absolute inset-x-3 bottom-3.5 line-clamp-4 text-center text-[14px] font-extrabold leading-tight text-white [paint-order:stroke_fill] [-webkit-text-stroke:3px_#000]">{x.metin.replaceAll("{isim}", "Ayşe")}</span>
            </motion.button>
          ))}
          {tur === "foto" && FOTO_PAKETLER.map((x, i) => (
            <motion.div key={x.ad} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} whileHover={{ y: -3 }}>
              <GorselSec sec={metin === x.tema} ad={x.ad} alt={x.alt} kapak={x.kapak} oran="aspect-[3/4]" buyuk onClick={() => { setMetin(x.tema); odakla(); }} />
            </motion.div>
          ))}
          {tur === "trend" && TRENDLER.map((x, i) => (
            <motion.div key={x.deger} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} whileHover={{ y: -3 }}>
              <GorselSec sec={trend === x.deger} ad={x.ad} alt={x.alt} kapak={trendKapak(x.deger)} video={trendVideo(x.deger)} oran="aspect-[9/16]" buyuk onClick={() => setTrend(x.deger)} />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </Kart>
  );
  const studyoGovde = <div className="space-y-4">{sonKart}{hero}{fikirKart}</div>;

  /* ═════════ KARAKTERLER ═════════ */
  /* ═════════ KARAKTERLER: solda raf, sağda kimlik ═════════ */
  const kSonuc = karakter ? sonuclar.filter((u) => fm(u).karakterId === karakter.id || u.baslik.startsWith(`@${karakter.ad} `)) : [];
  const icerikSay = (k: VElement) => sonuclar.filter((u) => fm(u).karakterId === k.id || u.baslik.startsWith(`@${k.ad} `)).length;
  const ozellik = karakter ? tariftenOzellik(karakter.aciklama) : [];
  const ingilizce = !!karakter && ingilizceMi(karakter.aciklama);
  const refEksik = karakter ? REF_YUVA.slice(Math.min(karakter.gorseller.length, 4), 4) : [];
  const raf = (
    <Kart ikon={Users} baslik="Karakterler" alt={`${karakterler.length} karakter`} sag={<button onClick={() => setDuzenle("yeni")} className="flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-black transition active:scale-95"><Plus className="h-4 w-4" />Yeni</button>}>
      <div className="p-2 max-lg:flex max-lg:gap-2 max-lg:overflow-x-auto max-lg:[scrollbar-width:none] lg:max-h-[calc(100dvh-260px)] lg:space-y-0.5 lg:overflow-y-auto lg:[scrollbar-width:thin]">
        {karakterler.map((k) => {
          const s = k.id === karakterId, n = icerikSay(k);
          return (
            <button key={k.id} onClick={() => karakterSec(k.id)} aria-pressed={s}
              className={cn("relative flex shrink-0 items-center gap-3 rounded-[14px] p-2 text-left transition-colors max-lg:w-[76px] max-lg:flex-col max-lg:gap-1.5 max-lg:p-1.5 lg:w-full", s ? "text-metin" : "text-metin-2 hover:bg-white/[0.04]")}>
              {s && <motion.span layoutId="fa-raf" transition={KAYAN} className="absolute inset-0 -z-10 rounded-[14px] bg-white/[0.08] ring-1 ring-inset ring-white/25" />}
              <span className="relative block h-14 w-11 shrink-0 overflow-hidden rounded-[10px] bg-black ring-1 ring-inset ring-white/10 max-lg:h-[78px] max-lg:w-[60px]"><ElementKapak e={k} ikonBoyut={18} className="absolute inset-0 h-full w-full" /></span>
              <span className="min-w-0 flex-1 leading-tight max-lg:w-full max-lg:text-center">
                <span className="block truncate text-[13.5px] font-semibold max-lg:text-[12px]">@{k.ad}</span>
                <span className={cn("block truncate text-[12px] max-lg:hidden", !k.gorseller.length ? "text-amber-200/90" : "text-metin-3")}>{!k.gorseller.length ? "Görsel yok" : `${k.ornek ? "Hazır" : "Kendi"} · ${n ? `${n} içerik` : "içerik yok"}`}</span>
              </span>
            </button>
          );
        })}
        {eklenmemis.length > 0 && <p className="px-2 pb-1 pt-3 text-[12px] font-medium text-metin-3 max-lg:hidden">Hazır karakterler</p>}
        {eklenmemis.map((o) => (
          <button key={o.ad} onClick={() => ornekTekEkle(o.ad)} title={`@${o.ad} ekle`} className="group flex shrink-0 items-center gap-3 rounded-[14px] p-2 text-left text-metin-2 transition-colors hover:bg-white/[0.04] max-lg:w-[76px] max-lg:flex-col max-lg:gap-1.5 max-lg:p-1.5 lg:w-full">
            <span className="relative block h-14 w-11 shrink-0 overflow-hidden rounded-[10px] bg-black opacity-80 ring-1 ring-inset ring-white/10 max-lg:h-[78px] max-lg:w-[60px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ornekGorsel(o.ad)} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute bottom-1 right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white text-black lg:hidden"><Plus className="h-3 w-3" strokeWidth={3} /></span>
            </span>
            <span className="min-w-0 flex-1 leading-tight max-lg:w-full max-lg:text-center"><span className="block truncate text-[13.5px] font-semibold max-lg:text-[12px]">@{o.ad}</span><span className="block truncate text-[12px] text-metin-3 max-lg:hidden">{o.tarz}</span></span>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-metin-2 transition group-hover:bg-white group-hover:text-black max-lg:hidden"><Plus className="h-3.5 w-3.5" /></span>
          </button>
        ))}
      </div>
    </Kart>
  );
  const kimlik = karakter ? (
    <div className="min-w-0 space-y-4">
      <Kart ikon={UserRound} baslik={`@${karakter.ad}`} alt={<><span className="max-sm:hidden">{karakter.ornek ? "Hazır karakter; izin onayı gerekmez" : "Kendi karakterin; gerçek bir kişiyse izni gerekir"}</span><span className="sm:hidden">{karakter.ornek ? "Hazır karakter" : "Kendi karakterin"}</span></>}
        sag={<span className="flex items-center gap-2">
          {karakter.gorseller.length > 0 && <button onClick={() => { setGorunum("studyo"); odakla(); }} className="flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black transition active:scale-95"><Sparkles className="h-3.5 w-3.5" />Üret</button>}
          <button onClick={() => setDuzenle(karakter)} className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[13px] font-medium text-metin transition hover:bg-white/[0.12] active:scale-95"><Pencil className="h-3.5 w-3.5" /><span className="max-sm:hidden">Düzenle</span></button>
          <button onClick={() => { const e = karakter; useElements.getState().sil(e.id); setKarakterId(karakterler.find((k) => k.id !== e.id)?.id ?? null); toast(`@${e.ad} kaldırıldı`, { action: { label: "Geri al", onClick: () => { useElements.getState().geriYukle(e); setKarakterId(e.id); } } }); }} aria-label="Karakteri kaldır" title="Kaldır" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-metin-2 transition hover:bg-rose-500/15 hover:text-rose-300 active:scale-90"><Trash2 className="h-4 w-4" /></button>
        </span>}>
        <div className="grid gap-4 p-3.5 sm:grid-cols-[auto_minmax(0,1fr)] sm:p-4">
          <motion.div key={karakter.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={YAY} className="relative mx-auto aspect-[3/4] h-[300px] overflow-hidden rounded-[20px] bg-black ring-1 ring-inset ring-white/[0.1] sm:aspect-auto sm:h-auto sm:min-h-[340px] sm:w-[280px] sm:self-stretch xl:w-[320px]">
            <ElementKapak e={karakter} ikonBoyut={40} className="absolute inset-0 h-full w-full" />
            {!karakter.gorseller.length && (
              <button onClick={() => setDuzenle(karakter)} className="absolute inset-x-4 bottom-4 flex h-10 items-center justify-center gap-1.5 rounded-full bg-white text-[13.5px] font-semibold text-black transition active:scale-95"><Upload className="h-4 w-4" />Görsel ekle</button>
            )}
          </motion.div>
          <div className="flex min-w-0 flex-col gap-3">
            <dl className="grid grid-cols-3 gap-2">
              {([["İçerik", `${kSonuc.length}`], ["Referans", `${karakter.gorseller.length}`], ["Oluşturma", new Date(karakter.olusturma).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })]] as const).map(([a, v]) => (
                <div key={a} className="rounded-[14px] px-3.5 py-2.5 ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
                  <dt className="text-[12px] text-metin-3">{a}</dt><dd className="mt-0.5 text-[20px] font-semibold tabular-nums tracking-[-0.01em] text-metin">{v}</dd>
                </div>
              ))}
            </dl>
            <MenuKart baslik="Görünüş" sag={<span className="text-[11.5px] text-metin-3">Modeller bu tarife göre çizer</span>}>
              {ozellik.length >= 2 ? (
                <div className="grid grid-cols-2 gap-2 p-2.5 sm:grid-cols-3 xl:grid-cols-4">
                  {ozellik.map((o) => (
                    <div key={o.ad} className="flex min-w-0 items-center gap-2.5 rounded-[12px] p-1.5 pr-2.5 ring-1 ring-inset ring-white/[0.06]" style={{ background: "rgba(255,255,255,0.02)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={o.kapak} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-[9px] object-cover" />
                      <span className="min-w-0 leading-tight"><span className="block text-[11.5px] text-metin-3">{o.ad}</span><span className="block truncate text-[13px] font-medium text-metin">{o.deger}</span></span>
                    </div>
                  ))}
                </div>
              ) : karakter.aciklama && !ingilizce ? (
                <p className="p-3.5 text-[15px] leading-relaxed text-metin">{karakter.aciklama}</p>
              ) : (
                <div className="flex items-center gap-3 p-3.5">
                  <span className="min-w-0 flex-1 text-[13.5px] text-metin-2">{karakter.aciklama ? "Tarif modele gidecek biçimde kayıtlı." : "Tarif yok. Saç, yaş ve tarz gibi ayrıntılar karakteri daha tutarlı çizdirir."}</span>
                  <button onClick={() => setDuzenle(karakter)} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[13px] font-medium text-metin transition hover:bg-white/[0.12] active:scale-95"><Pencil className="h-3.5 w-3.5" />{karakter.aciklama ? "Düzenle" : "Tarif ekle"}</button>
                </div>
              )}
            </MenuKart>
            <MenuKart baslik="Referans görseller" sag={karakter.gorseller.length < 3 ? <span className="rounded-full bg-amber-300/[0.1] px-2.5 py-0.5 text-[11.5px] text-amber-200">Farklı açılar tutarlılığı artırır</span> : undefined}>
              <div className="grid gap-2 p-2.5 xl:grid-cols-[auto_minmax(0,1fr)]">
              <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
                {karakter.gorseller.map((g, i) => (
                  <span key={g} className="relative aspect-[3/4] h-[112px] shrink-0 overflow-hidden rounded-[12px] ring-1 ring-inset ring-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
                    {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-black/55 px-1.5 text-[10.5px] font-medium text-white backdrop-blur">Kapak</span>}
                  </span>
                ))}
                {refEksik.map((r) => (
                  <button key={r.ad} onClick={() => setDuzenle(karakter)} className="flex aspect-[3/4] h-[112px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-[12px] bg-white/[0.04] px-1 text-center text-metin-2 ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.08] hover:text-metin active:scale-95">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08]"><r.ikon className="h-4 w-4" /></span>
                    <span className="text-[12px] font-medium leading-tight">{r.ad}</span><span className="-mt-1 text-[11px] text-metin-3">Ekle</span>
                  </button>
                ))}
              </div>
              <ul className="grid content-center gap-1.5 rounded-[12px] p-2.5 ring-1 ring-inset ring-white/[0.06] max-xl:grid-cols-2 max-sm:grid-cols-1">
                {([[true, "Yüz net, ışık iyi"], [true, "Farklı açı ve ifadeler"], [false, "Gözlük, şapka, sert gölge"], [false, "Kalabalık ya da uzak çekim"]] as const).map(([iyi, m]) => (
                  <li key={m} className="flex items-center gap-2 text-[12.5px] text-metin-2">
                    <span className={cn("flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full", iyi ? "bg-emerald-400 text-[#052e1b]" : "bg-rose-500 text-white")}>{iyi ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" strokeWidth={3} />}</span>{m}
                  </li>
                ))}
              </ul>
              </div>
            </MenuKart>
          </div>
        </div>
      </Kart>
      {karakter.gorseller.length > 0 && <Kart ikon={Wand2} baslik={`@${karakter.ad} ne üretsin`} alt="Tıkla, stüdyoda o tür hazırlansın">
        <div className="grid grid-cols-2 gap-3 p-3.5 lg:grid-cols-4">
          {TURLER.map((x, i) => <TurOnizleme key={x.id} t={x} gorsel={karakter.gorseller[0]} sira={i} onClick={() => { turSec(x.id); setGorunum("studyo"); odakla(); }} />)}
        </div>
      </Kart>}
      {kSonuc.length > 0 && (
        <Kart ikon={Film} baslik="İçerikleri" alt={`@${karakter.ad} ile ürettiklerin`} sag={<span className="flex items-center gap-2"><button onClick={() => setGorunum("icerik")} className="flex h-8 items-center rounded-full bg-white/[0.07] px-3 text-[12.5px] font-medium text-metin-2 transition hover:bg-white/[0.12] hover:text-metin">Tümü</button></span>}>
          <div className="grid grid-cols-3 gap-2.5 p-3.5 sm:grid-cols-5 xl:grid-cols-8">
            {kSonuc.slice(0, 16).map((u, i) => <SonucKart key={u.id} u={u} sira={i} onAc={() => setAcik(u)} />)}
          </div>
        </Kart>
      )}
    </div>
  ) : (
    <Kart ikon={UserRound} baslik="Karakter seç" alt="Soldan bir karakter seç ya da hazır bir karakter ekle">
      <div className="grid grid-cols-2 gap-3 p-3.5 sm:grid-cols-3 lg:grid-cols-5">{eklenmemis.map((o) => <GorselSec key={o.ad} sec={false} ad={`@${o.ad}`} alt={o.tarz} kapak={ornekGorsel(o.ad)} oran="aspect-[3/4]" buyuk onClick={() => ornekTekEkle(o.ad)} />)}</div>
    </Kart>
  );
  const karakterGovde = <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[290px_minmax(0,1fr)] lg:items-start"><div className="lg:sticky lg:top-0">{raf}</div>{kimlik}</div>;

  /* ═════════ İÇERİKLERİM ═════════ */
  const icerikGovde = <IcerikPanel gruplar={gruplar} onAc={setAcik} onKullan={ayarlariKullan} onIndir={indir} onTur={(t) => { turSec(t); setGorunum("studyo"); odakla(); }} />;

  const govde = gorunum === "studyo" ? studyoGovde : gorunum === "karakter" ? karakterGovde : icerikGovde;
  const bitenler = sonuclar.filter((x) => x.durum === "tamam");
  const modallar = (
    <>
      <AnimatePresence>
        {duzenle && <ElementDuzenleModal key="duzenle" element={duzenle === "yeni" ? null : duzenle} tohumDeger={{ tur: "karakter" }} onKapat={() => setDuzenle(null)}
          onOlustu={(id) => { karakterSec(id); setDuzenle(null); toast.success("Karakter oluşturuldu"); }} />}
      </AnimatePresence>
      <AnimatePresence>{acik && <UretimGoruntuleyici key="d" u={sonuclar.find((x) => x.id === acik.id) ?? acik} liste={bitenler} onSec={(id) => { const u = sonuclar.find((x) => x.id === id); if (u) setAcik(u); }} onKapat={() => setAcik(null)} />}</AnimatePresence>
    </>
  );
  const gecis = <AnimatePresence mode="wait" initial={false}><motion.div key={gorunum} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>{govde}</motion.div></AnimatePresence>;

  if (!masaustu) {
    return (
      <MotionConfig reducedMotion="user">
        <div className="min-h-[calc(100dvh-var(--ust-nav))] space-y-3 overflow-x-hidden bg-zemin px-3 pb-10 pt-3">
          {ust}
          {gorunum === "studyo" && komut}
          {gecis}
          {modallar}
        </div>
      </MotionConfig>
    );
  }
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex h-[calc(100dvh-var(--ust-nav))] flex-col overflow-hidden bg-zemin">
        <div className="mx-auto w-full max-w-[1440px] shrink-0 px-6 pt-4">{ust}</div>
        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
          <div className={cn("mx-auto max-w-[1440px] px-6 pt-4", gorunum === "studyo" ? "pb-[300px]" : "pb-10")}>{gecis}</div>
        </div>
        <AnimatePresence>
          {gorunum === "studyo" && (
            <motion.div key="komut" initial={{ y: 28, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 28, opacity: 0 }} transition={{ type: "spring", stiffness: 420, damping: 34 }} className="pointer-events-none absolute inset-x-0 bottom-0 z-40">
              <div className="flex justify-center px-6 pb-5 pt-6"><div className="w-full max-w-[1120px]">{komut}</div></div>
            </motion.div>
          )}
        </AnimatePresence>
        {modallar}
      </div>
    </MotionConfig>
  );
}

/* ─────────── Parçalar ─────────── */

/* Karakter tarifinden Türkçe görselli özellikler (Influencer tarifi İngilizce kaydedilir; kullanıcıya Türkçesi gösterilir). */
const OZ_GRUP: [string, Secenek[]][] = [["Cinsiyet", CINSIYET], ["Yaş", YAS], ["Köken", KOKEN], ["Saç", SAC_STIL], ["Saç rengi", SAC_RENK], ["Göz", GOZ], ["Vücut", VUCUT], ["Tarz", TARZ], ["Ten", TEN_DETAY], ["Aksesuar", AKSESUAR]];
function tariftenOzellik(t: string): { ad: string; deger: string; kapak: string }[] {
  const k = ` ${t.toLowerCase()} `;
  const sonuc: { ad: string; deger: string; kapak: string }[] = [];
  for (const [ad, liste] of OZ_GRUP) {
    // en uzun eşleşen İngilizce ifade kazanır ("woman" ile "androgynous person" karışmasın)
    // Saç rengi yalnız saç biçiminin hemen önündeyse sayılır ("warm brown eyes" saç rengi değil).
    const bulunan = liste.filter((x) => (ad === "Saç rengi" ? SAC_STIL.some((s) => kelimeVar(k, `${x.en} ${s.en}`)) : kelimeVar(k, x.en))).sort((a, b) => b.en.length - a.en.length);
    if (!bulunan.length) continue;
    const coklu = ad === "Ten" || ad === "Aksesuar";
    sonuc.push({ ad, deger: (coklu ? bulunan : bulunan.slice(0, 1)).map((x) => x.ad).join(", "), kapak: bulunan[0].kapak });
  }
  return sonuc;
}
/** İfade, harf olmayan karakterlerle çevrili olarak geçiyor mu ("man", "woman" içinde eşleşmesin). */
function kelimeVar(metin: string, ifade: string) {
  const m = metin.toLowerCase(), f = ifade.toLowerCase();
  const harf = (c: string | undefined) => !!c && c.toLowerCase() !== c.toUpperCase();
  for (let i = m.indexOf(f); i >= 0; i = m.indexOf(f, i + 1)) if (!harf(m[i - 1]) && !harf(m[i + f.length])) return true;
  return false;
}
const INGILIZCE_IZ = ["the", "with", "and", "woman", "man", "hair", "eyes", "style", "in their"];
const ingilizceMi = (t: string) => !/[çğıöşüÇĞİÖŞÜ]/.test(t) && INGILIZCE_IZ.filter((w) => kelimeVar(t, w)).length >= 2;
const REF_YUVA = [
  { ad: "Önden", ikon: ScanFace }, { ad: "Yandan", ikon: UserRound }, { ad: "Gülümserken", ikon: Smile }, { ad: "Tam boy", ikon: Maximize },
];

/** Tür karosu: başka kişilerin görselleri yerine karakterin kendi yüzüyle türü canlandırır. */
function TurOnizleme({ t, gorsel, sira, onClick }: { t: (typeof TURLER)[number]; gorsel?: string; sira: number; onClick: () => void }) {
  const [ust, setUst] = useState(false);
  const img = (cls: string, stil?: React.CSSProperties) => (gorsel ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={gorsel} alt="" className={cn("absolute inset-0 h-full w-full object-cover", cls)} style={stil} /> : /* eslint-disable-next-line @next/next/no-img-element */ <img src={t.kapak} alt="" className="absolute inset-0 h-full w-full object-cover" />);
  return (
    <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: sira * 0.05 }} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} onClick={onClick}
      onPointerEnter={() => setUst(true)} onPointerLeave={() => setUst(false)}
      className="group relative block aspect-[4/5] overflow-hidden rounded-[16px] bg-black text-left ring-1 ring-inset ring-white/[0.08] hover:ring-white/35">
      {t.id === "foto" && gorsel ? (
        <span className="absolute inset-0 grid grid-cols-2 gap-[2px]">
          {[["50% 15%", 1, "none"], ["50% 30%", 1.5, "sepia(0.2) saturate(1.2)"], ["35% 20%", 1.2, "grayscale(1)"], ["60% 25%", 1.3, "saturate(1.3) hue-rotate(-10deg)"]].map(([pos, o, f], i) => (
            <span key={i} className="relative overflow-hidden">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={gorsel} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" style={{ objectPosition: pos as string, transform: `scale(${o})`, filter: f as string }} /></span>
          ))}
        </span>
      ) : img("object-[50%_20%] transition-transform duration-700 group-hover:scale-105", t.id === "trend" ? { filter: "saturate(1.3) contrast(1.05)" } : undefined)}
      {t.id === "trend" && <span className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(85,214,253,0.35),transparent_55%),radial-gradient(circle_at_20%_80%,rgba(236,72,153,0.3),transparent_50%)] mix-blend-screen" />}
      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
      {(t.id === "konus" || t.id === "mesaj") && (
        <span className="absolute inset-x-3 top-[46%] text-center text-[14px] font-extrabold leading-tight text-white [paint-order:stroke_fill] [-webkit-text-stroke:2.5px_#000]">{t.id === "konus" ? "Bugün size bir sır vereceğim!" : <>Selam <span className="text-[#55d6fd]">Ayşe</span>, iyi ki varsın!</>}</span>
      )}
      {t.id === "trend" && <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur"><Music4 className="h-3 w-3" />Akım</span>}
      <span className="absolute inset-x-3 bottom-3 leading-tight">
        <span className="flex items-center gap-1.5 text-[15px] font-semibold text-white"><t.ikon className="h-4 w-4" />{t.ad}</span>
        <span className="mt-0.5 block text-[12px] text-white/65">{t.alt}</span>
      </span>
      <span className={cn("absolute right-2.5 top-2.5 flex h-8 items-center gap-1 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black transition duration-300", t.id === "trend" && "top-10", ust ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0 [@media(hover:none)]:opacity-0")}><Sparkles className="h-3.5 w-3.5" />Üret</span>
    </motion.button>
  );
}


function indir(g: Uretim[]) {
  let n = 0;
  for (const u of g.filter((x) => x.durum === "tamam")) {
    const video = u.tur === "video", url = video ? u.videoUrl : saltUrl(u.gorselUrl); if (!url) continue;
    const a = document.createElement("a"); a.href = url; a.download = `${u.baslik.replace(/[\\/:*?"<>|]+/g, "-")}.${video ? "mp4" : "png"}`; a.click();
    n++;
  }
  if (n) toast.success(n > 1 ? `${n} dosya indiriliyor` : "Dosya indiriliyor", { description: "Dosyalar indirilenler klasörüne kaydedilir." });
  else mesaj.indirilemedi("İndirilecek hazır dosya yok.");
}

/** Metni büyük harfle başlatır; {isim} yer tutucusunu ham göstermez, küçük bir "hayran adı" hapına çevirir. */
function SablonMetin({ m }: { m: string }) {
  const s = m.charAt(0).toLocaleUpperCase("tr") + m.slice(1);
  return <>{s.split("{isim}").map((p, i) => <span key={i}>{i > 0 && <span className="mx-0.5 inline-block rounded-full bg-white/[0.1] px-2 align-[1px] text-[0.8em] font-medium text-metin-2">hayran adı</span>}{p}</span>)}</>;
}

/** Başlık şeritli kart: kartsız yüzen başlık yok. */
function Kart({ ikon: I, baslik, alt, sag, children }: { ikon: typeof Film; baslik: React.ReactNode; alt?: React.ReactNode; sag?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[24px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-5 py-3.5 max-sm:px-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07]"><I className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1 leading-tight"><span className="block text-[15px] font-semibold text-metin">{baslik}</span>{alt && <span className="block text-[12.5px] text-metin-3">{alt}</span>}</span>
        {sag}
      </div>
      {children}
    </section>
  );
}
/** Açılır menü içindeki başlık şeritli küçük kart. */
function MenuKart({ baslik, sag, children }: { baslik: string; sag?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex min-h-[38px] items-center gap-2 border-b border-white/[0.06] px-3 py-2"><span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-metin">{baslik}</span>{sag}</div>
      {children}
    </div>
  );
}
const SayiRozet = ({ n }: { n: number }) => <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[12px] font-medium tabular-nums text-metin-2">{n}</span>;

/** Görselli seçenek: ad görselin içinde, seçim yalnız beyaz çerçeve (ayrıca tik yok), video üzerine gelince oynar. */
function GorselSec({ sec, ad, alt, kapak, video, onClick, oran = "aspect-[4/3]", buyuk }: { sec: boolean; ad: string; alt?: string; kapak: string; video?: string; onClick: () => void; oran?: string; buyuk?: boolean }) {
  const [oyna, setOyna] = useState(false);
  return (
    <button onClick={onClick} aria-pressed={sec} onPointerEnter={(e) => e.pointerType === "mouse" && setOyna(true)} onPointerLeave={() => setOyna(false)}
      className={cn("group relative block w-full min-w-0 overflow-hidden bg-black text-left transition-transform active:scale-[0.97]", oran, buyuk ? "rounded-[16px]" : "rounded-[12px]")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={kapak} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      {video && oyna && <video src={video} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />}
      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
      <span className={cn("pointer-events-none absolute inset-0 ring-inset transition", buyuk ? "rounded-[16px]" : "rounded-[12px]", sec ? "ring-2 ring-white" : "ring-1 ring-white/10 group-hover:ring-white/35")} />
      <span className={cn("absolute leading-tight", buyuk ? "inset-x-3 bottom-2.5" : "inset-x-2 bottom-1.5")}>
        <span className={cn("block truncate font-semibold", buyuk ? "text-[14px]" : "text-[12.5px] max-sm:line-clamp-2 max-sm:whitespace-normal max-sm:text-[11.5px] max-sm:leading-tight", sec ? "text-white" : "text-white/90")}>{ad}</span>
        {alt && <span className={cn("block truncate text-white/60", buyuk ? "text-[12px]" : "text-[11px] max-sm:hidden")}>{alt}</span>}
      </span>
    </button>
  );
}

/** İçeriklerim: tür süzgeci + üretim turları (her tur: başlık şeridi, karakter, eylemler, kareler). */
function IcerikPanel({ gruplar, onAc, onKullan, onIndir, onTur }: { gruplar: Uretim[][]; onAc: (u: Uretim) => void; onKullan: (g: Uretim[]) => void; onIndir: (g: Uretim[]) => void; onTur: (t: Tur) => void }) {
  const [f, setF] = useState<"tumu" | Tur>("tumu");
  if (!gruplar.length) return (
    <Kart ikon={Film} baslik="Henüz içerik yok" alt="Bir tür seç; komut kutusu ona göre hazırlanır">
      <div className="grid grid-cols-2 gap-3 p-3.5 lg:grid-cols-4">
        {TURLER.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -3 }}>
            <GorselSec sec={false} ad={t.ad} alt={t.alt} kapak={t.kapak} video={t.video} oran="aspect-[4/5]" buyuk onClick={() => onTur(t.id)} />
          </motion.div>
        ))}
      </div>
    </Kart>
  );
  const liste = gruplar.filter((g) => f === "tumu" || grupTur(g[0]) === f);
  const sayi = (t: Tur) => gruplar.filter((g) => grupTur(g[0]) === t).reduce((a, g) => a + g.length, 0);
  return (
    <Kart ikon={Film} baslik="İçeriklerim" alt="Her üretim turu ayrı; kareye tıkla, büyük açılsın"
      sag={
        <div role="tablist" aria-label="Tür süzgeci" className="isolate flex max-w-full gap-0.5 overflow-x-auto rounded-full p-[3px] ring-1 ring-inset ring-white/[0.08] [scrollbar-width:none] max-sm:w-full" style={{ background: "rgba(255,255,255,0.04)" }}>
          {([["tumu", "Tümü", Film, gruplar.reduce((a, g) => a + g.length, 0)], ...TURLER.map((t) => [t.id, t.ad, t.ikon, sayi(t.id)] as const)] as const).map(([id, ad, I, n]) => (
            <button key={id} role="tab" aria-selected={f === id} onClick={() => setF(id)} className={cn("relative flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[12.5px] font-medium transition-colors", f === id ? "text-black" : "text-metin-2 hover:text-metin")}>
              {f === id && <motion.span layoutId="fa-suzgec" transition={KAYAN} className="absolute inset-0 -z-10 rounded-full bg-white" />}
              <I className="h-3.5 w-3.5" />{ad}{n > 0 && <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", f === id ? "bg-black/10" : "bg-white/[0.08]")}>{n}</span>}
            </button>
          ))}
        </div>}>
      <div className="space-y-3 p-3.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {liste.length ? liste.map((g, i) => <Grup key={fm(g[0]).grupId ?? g[0].id} g={g} sira={i} onAc={onAc} onKullan={() => onKullan(g)} onIndir={() => onIndir(g)} />)
            : <motion.div key="bos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between gap-3 rounded-[16px] px-4 py-3 ring-1 ring-inset ring-white/[0.07]">
                <span className="text-[13.5px] text-metin-2">Bu türde içerik yok.</span>
                {f !== "tumu" && <button onClick={() => onTur(f)} className="flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black transition active:scale-95"><Sparkles className="h-3.5 w-3.5" />{TURLER.find((t) => t.id === f)!.ad} üret</button>}
              </motion.div>}
        </AnimatePresence>
      </div>
    </Kart>
  );
}

/** Bir üretim turu: solda kareler (yatay kayar), sağda metin ve künye; başlık şeridinde eylemler. */
function Grup({ g, sira, onAc, onKullan, onIndir }: { g: Uretim[]; sira: number; onAc: (u: Uretim) => void; onKullan: () => void; onIndir: () => void }) {
  const t = TURLER.find((x) => x.id === grupTur(g[0])) ?? TURLER[0];
  const m = fm(g[0]);
  const hazir = g.filter((u) => u.durum === "tamam").length, tek = g.length === 1;
  const demoU = g.some((u) => u.durum === "tamam" && u.gercek === false);
  const tarih = new Date(g[0].olusturma).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const metin = t.id === "foto" ? m.fansMetin : m.fansMetin || (t.id === "trend" ? `${etiketAl(g[0]) ?? "Trend"} akımı` : undefined);
  const bilgi = (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-metin"><t.ikon className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[14px] font-semibold text-metin">{grupBaslik(g)}</span>
          <span className="block text-[12px] tabular-nums text-metin-3">{tarih}</span>
        </span>
        {hazir < g.length && <span className="flex items-center gap-1.5 rounded-full bg-white/[0.07] px-2.5 py-1 text-[12px] tabular-nums text-metin-2"><Loader2 className="h-3 w-3 animate-spin" />{hazir}/{g.length} hazır</span>}
        <Tooltip label="Bu ayarlarla yeniden" side="top"><button onClick={onKullan} aria-label="Bu ayarlarla yeniden" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-metin-2 transition hover:bg-white/[0.12] hover:text-metin active:scale-95"><RotateCcw className="h-4 w-4" /></button></Tooltip>
        {hazir > 0 && <Tooltip label={hazir > 1 ? "Tümünü indir" : "İndir"} side="top"><button onClick={onIndir} aria-label="İndir" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-metin-2 transition hover:bg-white/[0.12] hover:text-metin active:scale-95"><Download className="h-4 w-4" /></button></Tooltip>}
      </div>
      <div className="flex items-start gap-3 rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.05]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {m.karakterKapak ? <img src={m.karakterKapak} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover object-top ring-1 ring-white/15" /> : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07]"><UserRound className="h-4 w-4" /></span>}
        <span className="min-w-0 leading-snug">
          <span className="block text-[12px] font-medium text-metin-3">@{m.karakterAd ?? g[0].baslik.split(" ")[0].replace("@", "")}</span>
          {metin && <span className="mt-0.5 line-clamp-3 block text-[14.5px] font-medium text-metin"><SablonMetin m={metin} /></span>}
        </span>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-1.5">
        <span className="flex h-7 items-center gap-1.5 rounded-full bg-white/[0.05] pl-0.5 pr-2.5 text-[12px] font-medium text-metin-2 ring-1 ring-inset ring-white/[0.06]"><span className="[&>span]:!h-6 [&>span]:!w-6 [&>span]:!rounded-full"><MarkaKare ad={g[0].model} boyut={24} /></span>{g[0].model}</span>
        <span className="flex h-7 items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 text-[12px] font-medium tabular-nums text-metin-2 ring-1 ring-inset ring-white/[0.06]"><OranSimge o={m.oran ?? "9:16"} boy={12} />{m.oran ?? "9:16"}</span>
        {g.length > 1 && <span className="flex h-7 items-center rounded-full bg-white/[0.05] px-2.5 text-[12px] font-medium tabular-nums text-metin-2 ring-1 ring-inset ring-white/[0.06]">{g.length} {g[0].tur === "video" ? "video" : "kare"}</span>}
      </div>
    </div>
  );
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ ...YAY, delay: Math.min(sira, 5) * 0.05 }}
      className="overflow-hidden rounded-[18px] bg-white/[0.02] p-3 ring-1 ring-inset ring-white/[0.07]">
      {tek ? (
        <div className="flex gap-4 max-sm:flex-col">
          <div className="w-[132px] shrink-0 max-sm:w-[150px]"><SonucKart u={g[0]} sira={0} onAc={() => onAc(g[0])} /></div>
          {bilgi}
        </div>
      ) : (
        <div className="space-y-3">
          {bilgi}
          <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
            {g.map((u, i) => <div key={u.id} className="w-[132px] shrink-0 max-sm:w-[118px]"><SonucKart u={u} sira={i} onAc={() => onAc(u)} /></div>)}
          </div>
        </div>
      )}
    </motion.section>
  );
}

function SonucKart({ u, sira, onAc }: { u: Uretim; sira: number; onAc: () => void }) {
  const bitti = u.durum === "tamam";
  const kapak = kapakAl(u);
  const etiket = etiketAl(u);
  return (
    <motion.button initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ ...YAY, delay: Math.min(sira, 8) * 0.04 }} whileHover={{ y: -3 }} onClick={() => bitti && onAc()}
      className="group relative block aspect-[3/4] w-full overflow-hidden rounded-[14px] bg-black text-left ring-1 ring-inset ring-white/[0.08] hover:ring-white/30">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {kapak && <img src={kapak} alt="" className={cn("absolute inset-0 h-full w-full object-cover object-top", !bitti && "opacity-40 blur-[2px]")} />}
      {bitti && u.tur === "video" && u.videoUrl && <video src={u.videoUrl} muted loop playsInline preload="none" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity group-hover:opacity-100" onMouseEnter={(e) => void e.currentTarget.play().catch(() => {})} onMouseLeave={(e) => e.currentTarget.pause()} />}
      {!bitti && <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-[12.5px] font-medium text-white">{u.durum === "hata" ? <AlertTriangle className="h-5 w-5 text-rose-300" /> : <Loader2 className="h-5 w-5 animate-spin" />}{u.durum === "hata" ? "Başarısız" : `%${Math.round(u.ilerleme ?? 0)}`}</span>}
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
      {bitti && u.tur === "video" && <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur"><Play className="h-3 w-3 translate-x-px fill-current" /></span>}
      {etiket && <span className="absolute inset-x-2.5 bottom-2.5 line-clamp-2 text-[12.5px] font-semibold leading-snug text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">{etiket}</span>}
    </motion.button>
  );
}
