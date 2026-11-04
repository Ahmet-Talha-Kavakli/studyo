"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import {
  AudioLines, Check, ChevronDown, ChevronLeft, Dices, Film, History, Languages, Lightbulb, Loader2, Mic,
  Play, Plus, Repeat, SlidersHorizontal, Sparkles, Upload, X, Pause, MessagesSquare, Waves, Tags,
  Trash2, Square, Lock, Megaphone, Newspaper, Moon, Globe2, RotateCcw, ArrowUp, ArrowDown, Infinity as InfinityIcon, Clock, Target, Search,
  CloudRain, Coffee, Zap, DoorOpen, Rocket, Flame, Car, Trees, BellRing, PartyPopper, Copy, Users, Wind, Heart, Fingerprint, Smile, Laugh, Frown, Angry, Activity, HelpCircle, Annoyed, Leaf, Ear, Feather, Drama, Snail, CircleAlert, MessageCircle, Droplets, DoorClosed, Footprints, Bomb, Timer, Eraser, Captions, Link2, Scissors, ArrowRight, Keyboard, Undo2, Code2, ListChecks, ClipboardPaste, BookOpen, Library, Wand2, Download, Settings2, type LucideIcon,
} from "lucide-react";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { Tooltip } from "@/components/ui/Tooltip";
import { Bayrak } from "@/components/ui/Bayrak";
import { Rozet, MarkaKare, AltSayfa } from "./hf";
import { KCip } from "./Cip";
import { Segment, Kaydirici, AnahtarSatir } from "@/components/montaj/ui";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { begeniBildir, neden, uretimGeriYukle } from "@/components/studyo/bildirim";
import { yerelDepo } from "@/lib/yerelDepo";
import { cn } from "@/lib/utils";
import { uretimIndir } from "@/lib/gercekEylem";
import { useIstemParametresi } from "@/lib/useIstemParametresi";
import { useAktifProje } from "@/lib/useAktifProje";
import { useScrollKilit } from "@/hooks/useScrollKilit";
import { useOdakTuzagi } from "@/hooks/useOdakTuzagi";
import { useMasaustu } from "@/hooks/useMasaustu";
import { uretimBaslat as uretimBaslatHam, uretimHataToast, uretimIptal } from "@/lib/uretimMotoru";
import { icerikDenetle, kategoriEtiket } from "@/lib/moderasyon";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useSecim } from "@/store/useSecim";
import { useYorumlar } from "@/store/useYorumlar";
import { useOzelSesler } from "@/store/useOzelSesler";
import { useSesSaglayici } from "@/lib/useSesSaglayici";
import { sesCalici, useCalici, sureYaz } from "@/lib/sesCalici";
import {
  DILLER, SESLER, SES_ETIKET_GRUPLARI, SES_MODLARI, SES_URETIM_MODELLERI, KAYNAK_MB, CIKTI_BICIMLERI,
  DIYALOG_KARAKTER, DIYALOG_SES, DIYALOG_ORNEKLERI, EFEKT_ORNEKLERI, ETIKET_GRUP_RENK, DILLER_SIRALI, etiketRengi, aksanBayrak, type SesMod,
} from "@/lib/sesVeri";
import { Yuzen } from "@/components/ui/Yuzen";
import { YorumSekmesi } from "@/components/studyo/YorumSekmesi";
import type { StudyoGomuluProps } from "@/components/studyo/tipler";
import { SesKutuphanesi, hazirdanSes, ozeldenSes, type SecilenSes } from "./ses/SesKutuphanesi";
import { KlonModal } from "./ses/KlonModal";
import { TasarimModal } from "./ses/TasarimModal";
import { SesGoruntuleyici, uretimKaynagi, bicimUzantisi } from "./ses/SesGoruntuleyici";
import { SonSerit } from "./ses/SonSerit";
import { GecmisSatiri } from "./ses/GecmisSatiri";
import { OynaticiCubugu } from "./ses/OynaticiCubugu";
import { Dalga, SesAvatar } from "./ses/ortak";
import { Dalga as SDalga } from "@/components/speak/SesSecici";

/**
 * Ses Stüdyosu — Seslendirme · Diyalog · Efekt · Ses Değiştir · Çeviri · Temizle · Transkript.
 * Ortada belge gibi metin sayfası, altta yüzen komut kutusu (ses, model, okuma çipleri + Üret),
 * sağda açılır Sonuçlar çekmecesi.
 * Ses sağlayıcısı bağlıyken (ElevenLabs) çıktılar gerçek dosyadır. Bağlı değilken
 * seslendirme tarayıcının konuşma motoruyla demo olarak çalınır; ses değiştirme,
 * çeviri ve klonlama taklit edilemeyeceği için kredi düşmeden engellenir.
 */

/** Seslendirme ve diyalog bedeli metin uzunluğuyla: 1.000 karakter başına 1 kredi (en az 1). */
const ttsKredi = (karakter: number) => Math.max(1, Math.ceil(karakter / 1000));
/** Ses efekti: otomatik süre 2 kredi; süre seçilirse 10 sn başına 1 kredi (en az 1). */
const efektKredi = (sn: number | null) => (sn === null ? 2 : Math.max(1, Math.ceil(sn / 10)));
/** Ses değiştirme / temizleme / transkript dakika başına 1, çeviri dakika başına 12 kredi (başlayan her dakika). */
const dakikaKredi = (sn: number, birim: number) => birim * Math.max(1, Math.ceil(sn / 60));
/** Model etiketleri (kitaplıkta ve ayrıntıda görünür). */
const MOD_MODELI: Record<"efekt" | "sesdegistir" | "ceviri" | "temizle" | "transkript", string> = { efekt: "Eleven Sound Effects", sesdegistir: "Eleven Speech to Speech", ceviri: "Eleven Dubbing", temizle: "Eleven Voice Isolator", transkript: "Eleven Scribe" };
const MOD_IKON: Record<SesMod, typeof Mic> = { seslendirme: Mic, diyalog: MessagesSquare, efekt: Waves, sesdegistir: Repeat, ceviri: Languages, temizle: Eraser, transkript: Captions };
/** Gerçek sağlayıcı olmadan hiç çalışmayan modlar (tarayıcı önizlemesi yok). */
const KILITLI_MODLAR: SesMod[] = ["efekt", "sesdegistir", "ceviri", "temizle", "transkript"];
/** Kaynak dosyayla çalışan modlar. */
const KAYNAKLI_MODLAR: SesMod[] = ["sesdegistir", "ceviri", "temizle", "transkript"];
/** Konuşma süresi tahmini (yaklaşık 15 karakter/sn; etiketler sayılmaz). */
const sureTahmin = (t: string) => Math.max(1, Math.round(t.replace(/\[[^\]\n]{1,40}\]|<break[^>]*\/?>/g, "").length / 15));
/** Metni sınırı aşmayacak parçalara böler: önce paragraf, gerekirse cümle sınırından. */
function parcalara(metin: string, sinir: number): string[] {
  const parcalar: string[] = [];
  let gecerli = "";
  const ekle = (p: string) => { if (p.trim()) parcalar.push(p.trim()); };
  for (const parag of metin.split(/\n{2,}/)) {
    const aday = gecerli ? `${gecerli}\n\n${parag}` : parag;
    if (aday.length <= sinir) { gecerli = aday; continue; }
    ekle(gecerli); gecerli = "";
    if (parag.length <= sinir) { gecerli = parag; continue; }
    let cumleGrubu = "";
    for (const cumle of parag.split(/(?<=[.!?…])\s+/)) {
      if ((cumleGrubu + " " + cumle).trim().length > sinir) { ekle(cumleGrubu); cumleGrubu = cumle.slice(0, sinir); }
      else cumleGrubu = (cumleGrubu + " " + cumle).trim();
    }
    gecerli = cumleGrubu;
  }
  ekle(gecerli);
  return parcalar;
}
/** i. paragrafın (boş satırla ayrılan blok) metin içindeki başlangıç konumu. */
const paragrafOfset = (metin: string, i: number) => metin.split("\n\n").slice(0, i).reduce((n, p) => n + p.length + 2, 0);
const DIYALOG_MODELLERI = SES_URETIM_MODELLERI.filter((m) => m.diyalog);
type Satir = { id: string; ses: SecilenSes; metin: string };

/** Ayar ön kümeleri: yalnız sağlayıcıya giden üç değeri birlikte ayarlar. */
const HAZIR_STILLER: { ad: string; ikon: LucideIcon; hiz: number; kararlilik: number; stil: number; not: string }[] = [
  { ad: "Anlatıcı", ikon: BookOpen, hiz: 1, kararlilik: 0.6, stil: 0, not: "Sakin, net belgesel anlatımı" },
  { ad: "Reklam", ikon: Megaphone, hiz: 1.05, kararlilik: 0.35, stil: 0.4, not: "Enerjik, vurgulu" },
  { ad: "Podcast", ikon: Mic, hiz: 1, kararlilik: 0.45, stil: 0.15, not: "Samimi sohbet tonu" },
  { ad: "Sesli kitap", ikon: Library, hiz: 0.95, kararlilik: 0.7, stil: 0.05, not: "Uzun dinlemeye uygun, dingin" },
  { ad: "Haber", ikon: Newspaper, hiz: 1.05, kararlilik: 0.8, stil: 0, not: "Tarafsız, tutarlı" },
  { ad: "Masal", ikon: Moon, hiz: 0.9, kararlilik: 0.4, stil: 0.3, not: "Sıcak, canlandırmalı" },
];
const yeniId = () => Math.random().toString(36).slice(2, 9);

const dilAdi = (kod: string) => {
  const d = DILLER.find((x) => x.kod === kod);
  return d ? d.ad.toLocaleLowerCase("tr").replace(/^\p{L}/u, (c) => c.toLocaleUpperCase("tr")) : kod;
};

/** Boş sayfada tek tıkla doldurulan örnekler (metin + uygun ses). */
const ORNEKLER: { baslik: string; etiket: string; ses: string; metin: string }[] = [
  { baslik: "Reklam spotu", etiket: "Reklam", ses: "Jessica", metin: "Yeni sezon burada. Hafif, nefes alan kumaşlar ve sana özel kesimler. Bu hafta sonuna kadar tüm koleksiyonda yüzde otuz indirim seni bekliyor." },
  { baslik: "Belgesel anlatımı", ses: "George", etiket: "Anlatım", metin: "Kapadokya'nın vadilerinde güneş doğarken, binlerce yıllık peribacaları sabahın ilk ışığıyla altın rengine bürünür. Bu topraklar, rüzgârın ve zamanın birlikte yonttuğu bir hikâye anlatır." },
  { baslik: "Podcast girişi", etiket: "Sohbet", ses: "Eric", metin: "Herkese merhaba, yeni bölüme hoş geldiniz. Bugün üretkenliği gerçekten artıran küçük alışkanlıkları konuşacağız ve sonunda size üç basit öneri bırakacağız." },
  { baslik: "Haber bülteni", etiket: "Haber", ses: "Daniel", metin: "İyi akşamlar. Günün öne çıkan gelişmeleriyle karşınızdayız. Meteoroloji, hafta sonu için yurdun büyük bölümünde sağanak yağış uyarısında bulundu." },
  { baslik: "Uyku masalı", etiket: "Anlatım", ses: "Lily", metin: "Bir zamanlar, ormanın en yaşlı ağacının kovuğunda küçük bir baykuş yaşardı. Her gece yıldızları sayar, hiçbirini atlamadan hepsine iyi geceler derdi." },
  { baslik: "Sosyal medya", etiket: "Sosyal", ses: "Laura", metin: "Bunu kimse sana söylemedi ama sabah rutinini değiştirmek için tek bir şey yeter. Videonun sonuna kadar izle, ikinci madde hayatını kolaylaştıracak." },
];

/** Başlangıç çipleri ve efekt kutucukları için çizgi simgeler (ses küreleri yalnız sesler içindir). */
const EFEKT_IKON: Record<string, typeof Mic> = { "Yağmur ve gök gürültüsü": CloudRain, "Şömine çıtırtısı": Flame, "Sinematik vuruş": Zap, "Fırtınalı deniz": Waves, "Uzay gemisi": Rocket, "Orman sabahı": Trees, "Arayüz sesi": BellRing, "Şehir trafiği": Car };

/** Başlangıç ve efekt kartlarının fotoğrafları (projedeki gerçek görseller). */
const ORNEK_GORSEL: Record<string, string> = {
  "Reklam spotu": "/gercek/kesfet/editorial-moda1.webp", "Belgesel anlatımı": "/gercek/galeri/manzara1.webp", "Podcast girişi": "/gercek/kesfet/blog-ses.webp",
  "Haber bülteni": "/gercek/kesfet/deniz-feneri-firtinasiveo-3-1.webp", "Uyku masalı": "/gercek/kesfet/mistik-orman-perisiframe-by-frame.webp", "Sosyal medya": "/gercek/sc/sc-ugc.webp",
};
const EFEKT_GORSEL: Record<string, string> = {
  "Yağmur ve gök gürültüsü": "/gercek/kesfet/yagmurlu-tokyoauralab.webp", "Şömine çıtırtısı": "/gercek/gorsel/mood-sicak-ambiyans.webp", "Sinematik vuruş": "/gercek/arac/vfx-patlama.webp",
  "Fırtınalı deniz": "/gercek/kesfet/deniz-feneri-firtinasiveo-3-1.webp", "Uzay gemisi": "/gercek/kesfet/uzay-istasyonuauralab.webp", "Orman sabahı": "/gercek/galeri/manzara5.webp",
  "Arayüz sesi": "/gercek/kesfet/elevenlabsses.webp", "Şehir trafiği": "/gercek/paz/ortam-sokak.webp",
};
const ETIKET_IKON: Record<string, typeof Mic> = {
  "[excited]": Sparkles, "[happy]": Smile, "[sad]": Frown, "[angry]": Angry, "[nervous]": Activity, "[curious]": HelpCircle, "[sarcastic]": Annoyed, "[calm]": Leaf,
  "[whispers]": Ear, "[shouts]": Megaphone, "[softly]": Feather, "[dramatic]": Drama, "[rushed]": Zap, "[slowly]": Snail,
  "[laughs]": Laugh, "[chuckles]": Smile, "[sighs]": Wind, "[gasps]": CircleAlert, "[clears throat]": MessageCircle, "[crying]": Droplets,
  "[applause]": PartyPopper, "[door slams]": DoorClosed, "[footsteps]": Footprints, "[explosion]": Bomb,
  "[short pause]": Pause, "[long pause]": Timer, '<break time="0.5s" />': Pause, '<break time="1.5s" />': Timer,
};

/** Dosya ile çalışan araçların adımları ve ipuçları (boş sayfa yerine işe yarar rehber). */
const KAYNAK_ADIM: Partial<Record<SesMod, { alt: string; adimlar: [LucideIcon, string, string][]; ipuclari: [boolean, string][] }>> = {
  sesdegistir: {
    alt: "Konuşmanın ritmi ve duygusu kalır, yalnız ses rengi değişir",
    adimlar: [[Mic, "Kaydet ya da yükle", "Tek konuşmacı, en fazla 5 dakika"], [AudioLines, "Hedef sesi seç", "Hazır, klonlanmış ya da tasarlanmış ses"], [Repeat, "Dönüştür", "Vurgu, duraklama ve duygu korunur"]],
    ipuclari: [[true, "Sessiz bir odada, mikrofona yakın kayıt"], [true, "Doğal tonda, net konuşma"], [false, "Arka planda müzik ya da ikinci bir ses"], [false, "Çok kısa (2 saniyeden az) kayıt"]],
  },
  ceviri: {
    alt: "Her konuşmacı kendi ses rengiyle hedef dilde konuşur",
    adimlar: [[Upload, "Klibi ekle", "Dosya ya da YouTube, TikTok, X bağlantısı"], [Languages, "Hedef dilleri seç", "Bir seferde 8 dile kadar"], [Users, "Konuşmacılar korunur", "Her biri kendi sesiyle çevrilir"]],
    ipuclari: [[true, "Konuşmanın net duyulduğu kayıt"], [true, "Konuşmacı sayısını biliyorsan seç"], [false, "Üst üste binen konuşmalar"], [false, "Yüksek sesli fon müziği"]],
  },
  temizle: {
    alt: "Rüzgâr, uğultu, müzik ve oda yankısı ayıklanır",
    adimlar: [[Upload, "Kaydı ekle", "Ses ya da video, en fazla 20 MB"], [Wind, "Gürültü ayıklanır", "Konuşma dışındaki her şey"], [AudioLines, "Net konuşmayı indir", "Aynı uzunlukta temiz kayıt"]],
    ipuclari: [[true, "Röportaj, vlog ve telefon kayıtları"], [true, "Kalabalık ortamda tek konuşmacı"], [false, "Şarkı vokali ayırma (müzik aracı daha iyi)"], [false, "Konuşmanın tamamen boğulduğu kayıt"]],
  },
  transkript: {
    alt: "Konuşmacılar ayrılır, her satır zamanıyla yazılır",
    adimlar: [[Upload, "Kaydı ekle", "Ses ya da video"], [Users, "Konuşmacılar ayrılır", "Kim ne zaman konuştu"], [Captions, "Altyazıyı al", "TXT, SRT ya da VTT olarak indir"]],
    ipuclari: [[true, "Dili biliyorsan seç, doğruluk artar"], [true, "Toplantı, ders, podcast kayıtları"], [false, "Çok uzak mikrofonla alınmış kayıt"], [false, "Aynı anda konuşan çok kişi"]],
  },
};

function gunEtiketi(t: number) {
  const g = new Date(t), bugun = new Date(), dun = new Date(Date.now() - 86_400_000);
  if (g.toDateString() === bugun.toDateString()) return "Bugün";
  if (g.toDateString() === dun.toDateString()) return "Dün";
  return g.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: g.getFullYear() === bugun.getFullYear() ? undefined : "numeric" });
}

function dosyaDataUrl(f: File): Promise<string> {
  return new Promise((ok, hata) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => hata(r.error); r.readAsDataURL(f); });
}
function medyaSuresi(f: File): Promise<number> {
  return new Promise((ok) => {
    const el = document.createElement(f.type.startsWith("video/") ? "video" : "audio");
    const url = URL.createObjectURL(f);
    el.preload = "metadata";
    el.onloadedmetadata = () => { URL.revokeObjectURL(url); ok(isFinite(el.duration) ? el.duration : 0); };
    el.onerror = () => { URL.revokeObjectURL(url); ok(0); };
    el.src = url;
  });
}

type Kaynak = { ad: string; dataUrl: string; mb: number; sn: number; video: boolean; onizleme: string };

const UCRETSIZ_HAK = 2;

const YAY = { type: "spring", stiffness: 420, damping: 32 } as const;
const POP = "rounded-[18px] border border-white/[0.09] bg-[#1b1c1f]";
const ARAC = "flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12.5px] font-medium text-metin-2 transition-colors hover:bg-white/[0.075] hover:text-metin";
const IKON = "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/[0.085] hover:text-metin disabled:pointer-events-none disabled:opacity-30";

export function SesStudyo({ gomulu, projeId, onUretildi }: StudyoGomuluProps = {}) {
  const uretimBaslat: typeof uretimBaslatHam = (istek) => {
    const s = uretimBaslatHam(gomulu && projeId ? { ...istek, projeId } : istek);
    if (s.ok && s.id) onUretildi?.(s.id);
    return s;
  };
  const router = useRouter();
  // Panel parçaları (açılır menüler, satır referansları) yalnız görünen düzende kurulur.
  const masaustu = useMasaustu() || !!gomulu;
  const aramaParam = useSearchParams();
  const { aktifProjeId } = useAktifProje();
  const gercek = useSesSaglayici();
  const tumUretimler = useProjeler((s) => s.uretimler);
  const silUretim = useProjeler((s) => s.sil);
  const guncelle = useProjeler((s) => s.guncelle);
  const favoriToggle = useProjeler((s) => s.favoriToggle);
  const tumYorumlar = useYorumlar((s) => s.yorumlar);
  const ozelSesler = useOzelSesler((s) => s.sesler);
  const secimTemizle = useSecim((s) => s.temizle);
  useEffect(() => () => secimTemizle(), [secimTemizle]);
  // Sayfadan ayrılınca çalan ses durur.
  useEffect(() => () => sesCalici.durdur(), []);

  /* ── Üretim ayarları ── */
  const [mod, setMod] = useState<SesMod>("seslendirme");
  const [metin, setMetin] = useState("");
  useIstemParametresi(setMetin);
  const [model, setModel] = useState("Eleven v4");
  const [ses, setSes] = useState<SecilenSes>(() => hazirdanSes(SESLER[0]));
  const [dil, setDil] = useState(""); // "" = otomatik
  const [adet, setAdet] = useState(1);
  const [hiz, setHiz] = useState(1);
  const [kararlilik, setKararlilik] = useState(0.5);
  const [benzerlik, setBenzerlik] = useState(0.75);
  const [stil, setStil] = useState(0);
  const [kaynak, setKaynak] = useState<Kaynak | null>(null);
  const [kaynakYukleniyor, setKaynakYukleniyor] = useState(false);
  const [gurultu, setGurultu] = useState(true);
  const [kaynakDil, setKaynakDil] = useState("");
  const [hedefDil, setHedefDil] = useState("en");
  const [konusmaci, setKonusmaci] = useState(0);
  const [istemAcik, setIstemAcik] = useState(false);
  const [sesSecici, setSesSecici] = useState(false);
  const [klon, setKlon] = useState<null | { klonlanacak?: Parameters<typeof KlonModal>[0]["klonlanacak"] }>(null);
  const [uretiliyor, setUretiliyor] = useState(false);
  /** Bu oturumda en son başlatılan üretim — editörün altındaki şeritte çalınır. */
  const [sonId, setSonId] = useState<string | null>(null);
  /** Sonuçlar çekmecesi: kullanıcı açıp kapatana dek sonuç varsa açık. */
  const [cekmece, setCekmece] = useState<boolean | null>(null);
  const [bicim, setBicim] = useState(CIKTI_BICIMLERI[0].id);
  const [tohum, setTohum] = useState<number | null>(null);
  const [etiketAcik, setEtiketAcik] = useState(false);
  const [tasarim, setTasarim] = useState<false | { remixSesId?: string }>(false);
  // Diyalog
  const [diyalogModel, setDiyalogModel] = useState(DIYALOG_MODELLERI[0].ad);
  const [satirlar, setSatirlar] = useState<Satir[]>(() => [
    { id: yeniId(), ses: hazirdanSes(SESLER.find((x) => x.ad === "Jessica")!), metin: "" },
    { id: yeniId(), ses: hazirdanSes(SESLER.find((x) => x.ad === "Eric")!), metin: "" },
  ]);
  const [satirSesAcik, setSatirSesAcik] = useState<string | null>(null);
  const [diyalogOrnekAcik, setDiyalogOrnekAcik] = useState(false);
  const odakSatir = useRef<string | null>(null);
  const satirRefler = useRef<Record<string, HTMLTextAreaElement | null>>({});
  // Efekt
  const [efektTarif, setEfektTarif] = useState("");
  const [efektSn, setEfektSn] = useState<number | null>(null);
  // Ses ayarları (sağlayıcıya gerçekten giden)
  const [normalizasyon, setNormalizasyon] = useState<"auto" | "on" | "off">("auto");
  const [konusmaciGuclendir, setKonusmaciGuclendir] = useState(true);
  const [telaffuz, setTelaffuz] = useState<{ kelime: string; okunus: string }[]>([]);
  const [ortam, setOrtam] = useState<{ filtre?: string; gurultu?: string; mekan?: string; mesafe?: number }>({});
  const [uzunBol, setUzunBol] = useState(false);
  // Çeviri: çoklu hedef dil + bağlantıdan kaynak
  const [hedefDiller, setHedefDiller] = useState<string[]>(["en"]);
  const [kaynakBaglanti, setKaynakBaglanti] = useState("");
  // Geçmiş: arama, mod süzgeci, toplu seçim
  const [gecmisAra, setGecmisAra] = useState("");
  const [gecmisMod, setGecmisMod] = useState<SesMod | "tumu">("tumu");
  const [secimModu, setSecimModu] = useState(false);
  const [secilenler, setSecilenler] = useState<string[]>([]);
  // Metin geliştirici (Gemini) + geri alma, kısayol ve kod paneli
  const [gelistirHazir, setGelistirHazir] = useState<boolean | null>(null);
  const [gelistiriliyor, setGelistiriliyor] = useState(false);
  const [gelistirOnce, setGelistirOnce] = useState<string | null>(null);
  const [kisayolAcik, setKisayolAcik] = useState(false);
  const [kodAcik, setKodAcik] = useState(false);
  const [kodDil, setKodDil] = useState<"curl" | "js">("curl");
  const [dongu, setDongu] = useState(false);
  const [istemEtkisi, setIstemEtkisi] = useState(0.3);
  // Mikrofon kaydı (ses değiştirme kaynağı)
  const [kayitta, setKayitta] = useState(false);
  const [kayitSn, setKayitSn] = useState(0);
  const kayitci = useRef<MediaRecorder | null>(null);
  const kayitBas = useRef(0);
  const metinRef = useRef<HTMLTextAreaElement>(null);
  /** Seslendirme paragraf blokları: odaktaki blok ve blok alanları. */
  const odakParagraf = useRef<number | null>(null);
  const paragrafRefler = useRef<(HTMLTextAreaElement | null)[]>([]);
  const [odakBlok, setOdakBlok] = useState<number | null>(null);
  const dosyaRef = useRef<HTMLInputElement>(null);

  // ?model= (kataloğun "Üret" bağlantısı) ve ?prompt=
  useEffect(() => {
    const m = aramaParam.get("model");
    if (m && SES_URETIM_MODELLERI.some((x) => x.ad === m)) setModel(m);
    const p = aramaParam.get("prompt");
    if (p) setMetin(p);
  }, [aramaParam]);

  const modelTanim = SES_URETIM_MODELLERI.find((m) => m.ad === model) ?? SES_URETIM_MODELLERI[0];
  const sinir = modelTanim.karakterSiniri;
  const karakter = metin.length;
  const diyalogKarakter = satirlar.reduce((n, x) => n + x.metin.length, 0);
  const doluSatirlar = satirlar.filter((x) => x.metin.trim());
  const diyalogSesSayisi = new Set(doluSatirlar.map((x) => x.ses.ad)).size;
  const diyalogTanim = SES_URETIM_MODELLERI.find((m) => m.ad === diyalogModel)!;
  const birimKredi = mod === "seslendirme" ? ttsKredi(karakter) : mod === "diyalog" ? ttsKredi(diyalogKarakter) : mod === "efekt" ? efektKredi(efektSn)
    : dakikaKredi(kaynak?.sn ?? 0, mod === "ceviri" ? 12 : 1);
  const kac = mod === "seslendirme" || mod === "efekt" ? adet : mod === "ceviri" ? Math.max(1, hedefDiller.length) : 1;
  const toplamKredi = birimKredi * kac;
  const etkinModel = mod === "seslendirme" ? model : mod === "diyalog" ? diyalogModel : MOD_MODELI[mod];
  const ozelKullanilamaz = (x: SecilenSes) => x.ozel && !x.sesId;

  const eksik: string | null =
    mod === "seslendirme"
      ? metin.trim().length < 2 ? "Seslendirilecek metni yaz"
        : karakter > sinir && !uzunBol ? `Metin ${model} için çok uzun (${karakter.toLocaleString("tr-TR")}/${sinir.toLocaleString("tr-TR")}) — "Paragraflara böl" ile üretebilirsin`
        : ozelKullanilamaz(ses) ? "Bu özel ses henüz klonlanmadı"
        : !modelTanim.saglayici ? `${model} yakında`
        : null
      : mod === "diyalog"
        ? doluSatirlar.length < 2 ? "Diyalog için en az iki dolu satır yaz"
          : diyalogKarakter > DIYALOG_KARAKTER ? `Diyalog çok uzun (${diyalogKarakter.toLocaleString("tr-TR")}/${DIYALOG_KARAKTER.toLocaleString("tr-TR")})`
          : diyalogSesSayisi > DIYALOG_SES ? `En fazla ${DIYALOG_SES} farklı ses kullanılabilir`
          : doluSatirlar.some((x) => ozelKullanilamaz(x.ses)) ? "Klonlanmamış bir özel ses seçili"
          : null
      : mod === "efekt"
        ? efektTarif.trim().length < 3 ? "Üretilecek sesi tarif et"
          : gercek === null ? "Ses sağlayıcısı durumu kontrol ediliyor"
          : !gercek ? "Ses efekti için ses sağlayıcısı bağlantısı gerekli"
          : null
      : gercek === null ? "Ses sağlayıcısı durumu kontrol ediliyor"
      : !gercek ? `${{ sesdegistir: "Ses değiştirme", ceviri: "Çeviri", temizle: "Temizleme", transkript: "Transkript" }[mod as "sesdegistir"]} için ses sağlayıcısı bağlantısı gerekli`
      : mod === "ceviri" && !kaynak && kaynakBaglanti.trim() ? (/^https?:\/\/\S+$/.test(kaynakBaglanti.trim()) ? (hedefDiller.length ? null : "En az bir hedef dil seç") : "Geçerli bir bağlantı yapıştır")
      : !kaynak ? ({ sesdegistir: "Dönüştürülecek kaydı yükle", ceviri: "Çevrilecek klibi yükle ya da bağlantı yapıştır", temizle: "Temizlenecek kaydı yükle", transkript: "Yazıya dökülecek kaydı yükle" }[mod as "sesdegistir"])
      : mod === "ceviri" && !hedefDiller.length ? "En az bir hedef dil seç"
      : mod === "ceviri" && kaynakDil && hedefDiller.includes(kaynakDil) ? "Kaynak dil hedef dillerde olamaz"
      : null;

  useEffect(() => {
    let iptal = false;
    fetch("/api/ses/gelistir").then((x) => x.json()).then((j: { hazir?: boolean }) => { if (!iptal) setGelistirHazir(!!j.hazir); }).catch(() => { if (!iptal) setGelistirHazir(false); });
    return () => { iptal = true; };
  }, []);
  // Metin elle değişince "Geri al" anlamını yitirir.
  const metinGelistir = async () => {
    const t = metin.trim();
    if (t.length < 2 || gelistiriliyor) return;
    setGelistiriliyor(true);
    try {
      const x = await fetch("/api/ses/gelistir", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ metin: t }) });
      const j = (await x.json()) as { ok?: boolean; metin?: string; hata?: string };
      if (!j.ok || !j.metin) return void toast.error("Metin geliştirilemedi", { description: `${neden(j.hata, "Yanıt alınamadı.")} Biraz sonra yeniden dene.` });
      const onceki = metin;
      setGelistirOnce(onceki); setMetin(j.metin);
      toast.success("Ton etiketleri eklendi", { description: "Kelimeler aynı kaldı.", action: { label: "Geri al", onClick: () => { setMetin(onceki); setGelistirOnce(null); } } });
    } catch { mesaj.baglantiHatasi(); } finally { setGelistiriliyor(false); }
  };

  /* ── Akış ── */
  const [filtre, setFiltre] = useState<"tumu" | "favori">("tumu");
  const sesUretimleri = useMemo(
    // Tanıtım (seed_) kayıtları kullanıcının üretimi değildir.
    () => tumUretimler.filter((u) => u.tur === "ses" && !u.id.startsWith("seed_") && ["tamam", "isleniyor", "kuyrukta", "hata"].includes(u.durum)),
    [tumUretimler],
  );
  const gorunen = useMemo(() => {
    const q = gecmisAra.trim().toLocaleLowerCase("tr");
    return sesUretimleri.filter((u) => (filtre !== "favori" || u.favori)
      && (gecmisMod === "tumu" || ((u.meta?.mod as SesMod | undefined) ?? "seslendirme") === gecmisMod)
      && (!q || [u.baslik, u.prompt, u.meta?.ses, u.model, u.meta?.transkript].filter(Boolean).join(" ").toLocaleLowerCase("tr").includes(q)));
  }, [sesUretimleri, filtre, gecmisAra, gecmisMod]);
  const gruplar = useMemo(() => {
    const g: { etiket: string; oge: Uretim[] }[] = [];
    for (const u of gorunen) {
      const e = gunEtiketi(u.olusturma);
      const son = g[g.length - 1];
      if (son && son.etiket === e) son.oge.push(u); else g.push({ etiket: e, oge: [u] });
    }
    return g;
  }, [gorunen]);
  const aktifIs = sesUretimleri.filter((u) => u.durum === "kuyrukta" || u.durum === "isleniyor").length;
  const sonMetinler = useMemo(() => {
    const goruldu = new Set<string>(); const l: string[] = [];
    for (const u of sesUretimleri) {
      const p = ((u.meta?.hamIstem as string | undefined) ?? "").trim();
      if (p.length < 3 || goruldu.has(p)) continue;
      goruldu.add(p); l.push(p); if (l.length >= 5) break;
    }
    return l;
  }, [sesUretimleri]);

  /* ── Görüntüleyici ── */
  const [seciliId, setSeciliId] = useState<string | null>(null);
  const [yorum, setYorum] = useState("");
  const gezListe = useMemo(() => gorunen.filter((u) => u.durum === "tamam"), [gorunen]);
  const secili = seciliId ? tumUretimler.find((u) => u.id === seciliId) : undefined;
  const lbIndex = secili ? gezListe.findIndex((u) => u.id === secili.id) : -1;
  useEffect(() => { if (seciliId && !secili) setSeciliId(null); }, [seciliId, secili]);
  // ?u=<id> — paylaşılan/bildirimden gelen bağlantı ayrıntıyı açar.
  useEffect(() => {
    const id = aramaParam.get("u");
    if (id && tumUretimler.some((u) => u.id === id && u.tur === "ses")) setSeciliId(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aramaParam]);
  useScrollKilit(!!secili || sesSecici || !!klon || !!tasarim);
  // Esc en üstteki katmanı kapatır: klon / tasarım → ses seçici.
  useEffect(() => {
    if (!sesSecici && !klon && !tasarim) return;
    const f = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (klon) setKlon(null);
      else if (tasarim) setTasarim(false);
      else { setSesSecici(false); setSesHedef(null); }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [sesSecici, klon, tasarim]);

  /* ── Eylemler ── */
  const kaynakSec = async (f?: File, bilinenSn?: number) => {
    if (!f) return;
    if (!/^(audio|video)\//.test(f.type)) return void mesaj.desteklenmeyenDosya("MP3, WAV, M4A, MP4, MOV ya da WebM");
    const mb = f.size / 1024 / 1024;
    if (mb > KAYNAK_MB) return void toast.error("Dosya çok büyük", { description: `Bu dosya ${mb.toFixed(1).replace(".", ",")} MB, en çok ${KAYNAK_MB} MB yükleyebilirsin. Daha küçük bir dosya seç.` });
    setKaynakYukleniyor(true);
    try {
      const [dataUrl, olculen] = await Promise.all([dosyaDataUrl(f), bilinenSn ? Promise.resolve(bilinenSn) : medyaSuresi(f)]);
      const sn = olculen || bilinenSn || 0;
      if (kaynak) URL.revokeObjectURL(kaynak.onizleme);
      setKaynak({ ad: f.name, dataUrl, mb, sn, video: f.type.startsWith("video/"), onizleme: URL.createObjectURL(f) });
    } catch {
      mesaj.dosyaOkunamadi();
    } finally {
      setKaynakYukleniyor(false);
    }
  };
  const kaynakKaldir = () => {
    if (kaynak) URL.revokeObjectURL(kaynak.onizleme);
    if (sesCalici.durum().id === "kaynak") sesCalici.durdur();
    setKaynak(null);
  };

  const etiketEkle = (etiket: string) => {
    const satirId = mod === "diyalog" ? (odakSatir.current && satirlar.some((x) => x.id === odakSatir.current) ? odakSatir.current : satirlar[satirlar.length - 1]?.id) : null;
    const el = satirId ? satirRefler.current[satirId] : metinRef.current;
    const deger = satirId ? satirlar.find((x) => x.id === satirId)?.metin ?? "" : metin;
    // Seslendirme paragraf bloklarından oluşur: imleç odaktaki paragrafa göredir.
    const ofs = !satirId && el ? paragrafOfset(metin, odakParagraf.current ?? 0) : 0;
    let bas = el ? el.selectionStart + ofs : deger.length, son = el ? el.selectionEnd + ofs : deger.length;
    if (bas === son) { while (bas < deger.length && /[\p{L}\p{N}]/u.test(deger[bas]) && bas > 0 && /[\p{L}\p{N}]/u.test(deger[bas - 1])) bas++; son = bas; }
    const once = deger.slice(0, bas), sonra = deger.slice(son);
    const ek = `${once && !/\s$/.test(once) ? " " : ""}${etiket}${/^\s/.test(sonra) ? "" : " "}`;
    if (satirId) setSatirlar((l) => l.map((x) => (x.id === satirId ? { ...x, metin: once + ek + sonra } : x)));
    else setMetin(once + ek + sonra);
    requestAnimationFrame(() => { el?.focus(); const k = (once + ek).length - ofs; el?.setSelectionRange(k, k); });
  };
  /** Duraklama sözdizimi modele göre: v3/v4 etiket, v2/Flash SSML. */
  const etkinTanim = mod === "diyalog" ? diyalogTanim : modelTanim;
  const duraklamalar = etkinTanim.duraklama === "ssml"
    ? [{ etiket: '<break time="0.5s" />', ad: "Kısa duraklama" }, { etiket: '<break time="1.5s" />', ad: "Uzun duraklama" }]
    : [{ etiket: "[short pause]", ad: "Kısa duraklama" }, { etiket: "[long pause]", ad: "Uzun duraklama" }];

  /* ── Diyalog ── */
  const satirGuncelle = (id: string, d: Partial<Satir>) => setSatirlar((l) => l.map((x) => (x.id === id ? { ...x, ...d } : x)));
  const satirEkle = () => {
    // Sıradaki konuşmacı: iki satır önceki ses (A-B-A-B akışı).
    const onceki = satirlar[satirlar.length - 2]?.ses ?? satirlar[satirlar.length - 1]?.ses ?? ses;
    const id = yeniId();
    setSatirlar((l) => [...l, { id, ses: onceki, metin: "" }]);
    requestAnimationFrame(() => satirRefler.current[id]?.focus());
  };
  /** "Ayşe: Merhaba" satırlarını konuşmacılara ayırır; aynı ad aynı sesi alır. */
  const senaryoYapistir = (e: React.ClipboardEvent<HTMLTextAreaElement>, buradan: string) => {
    const satir = e.clipboardData.getData("text").split(/\r?\n/).map((t) => t.trim()).filter(Boolean);
    const es = satir.map((t) => t.match(/^([^:\[\]]{1,24}):\s*(.+)$/));
    if (satir.length < 2 || es.some((m) => !m)) return;
    e.preventDefault();
    const havuz = [...new Map([...satirlar.map((y) => y.ses), ...menuSesleri].map((v) => [v.ad, v])).values()];
    const atanan = new Map<string, SecilenSes>();
    const yeni: Satir[] = es.map((m) => {
      const ad = m![1].trim();
      if (!atanan.has(ad)) {
        const eslesen = havuz.find((v) => v.ad.toLocaleLowerCase("tr") === ad.toLocaleLowerCase("tr"));
        atanan.set(ad, eslesen ?? havuz.find((v) => ![...atanan.values()].includes(v)) ?? ses);
      }
      return { id: yeniId(), ses: atanan.get(ad)!, metin: m![2].slice(0, 2000) };
    });
    setSatirlar((l) => {
      const i = l.findIndex((x) => x.id === buradan);
      const bos = l.every((x) => !x.metin.trim());
      return bos ? yeni : [...l.slice(0, i + 1).filter((x) => x.id !== buradan || x.metin.trim()), ...yeni, ...l.slice(i + 1)];
    });
    toast.success(`${yeni.length} satır eklendi`, { description: `${atanan.size} konuşmacı: ${[...atanan].map(([a, v]) => `${a} → ${v.ad}`).join(", ")}.` });
  };
  const satirSil = (id: string) => setSatirlar((l) => (l.length > 1 ? l.filter((x) => x.id !== id) : l));
  const satirTasi = (id: string, yon: -1 | 1) => setSatirlar((l) => {
    const i = l.findIndex((x) => x.id === id), j = i + yon;
    if (i < 0 || j < 0 || j >= l.length) return l;
    const k = [...l]; [k[i], k[j]] = [k[j], k[i]]; return k;
  });
  const diyalogOrnekSec = (o: (typeof DIYALOG_ORNEKLERI)[number]) => {
    setMod("diyalog");
    setSatirlar(o.satirlar.map((x) => ({ id: yeniId(), ses: hazirdanSes(SESLER.find((v) => v.ad === x.ses) ?? SESLER[0]), metin: x.metin })));
    setDiyalogOrnekAcik(false);
  };

  /* ── Efekt ── */
  const efektRef = useRef<HTMLTextAreaElement>(null);
  const efektOrnekSec = (o: (typeof EFEKT_ORNEKLERI)[number]) => {
    setMod("efekt"); setEfektTarif(o.tarif); setEfektSn(o.sn ?? null); setDongu(!!o.dongu);
    setTimeout(() => efektRef.current?.focus(), 50);
  };

  /* ── Mikrofon kaydı (ses değiştirme) ── */
  useEffect(() => {
    if (!kayitta) return;
    const t = setInterval(() => {
      const sn = (performance.now() - kayitBas.current) / 1000;
      setKayitSn(sn);
      if (sn >= 300 && kayitci.current?.state === "recording") kayitci.current.stop();
    }, 200);
    return () => clearInterval(t);
  }, [kayitta]);
  useEffect(() => () => { if (kayitci.current?.state === "recording") kayitci.current.stop(); }, []);
  const kayitBaslat = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return void toast.error("Ses kaydı desteklenmiyor", { description: "Tarayıcın kayıt yapamıyor. Bunun yerine bir dosya yükleyebilirsin." });
    let akis: MediaStream;
    try { akis = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false } }); }
    catch { return void mesaj.izinGerekli("Mikrofon"); }
    const tip = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
    const kayit = new MediaRecorder(akis, tip ? { mimeType: tip } : undefined);
    const parcalar: Blob[] = [];
    kayit.ondataavailable = (e) => { if (e.data.size) parcalar.push(e.data); };
    kayit.onstop = () => {
      akis.getTracks().forEach((t) => t.stop());
      setKayitta(false);
      const sn = (performance.now() - kayitBas.current) / 1000;
      if (sn < 1) return void toast.error("Kayıt çok kısa", { description: "En az 1 saniye konuş ve yeniden kaydet." });
      const mime = kayit.mimeType || "audio/webm";
      void kaynakSec(new File(parcalar, `kayit-${new Date().toLocaleTimeString("tr-TR").replace(/:/g, "-")}.${mime.includes("mp4") ? "m4a" : "webm"}`, { type: mime.split(";")[0] }), sn);
    };
    kayitci.current = kayit;
    kayitBas.current = performance.now();
    setKayitSn(0); setKayitta(true);
    kayit.start(1000);
  };

  const ornekSec = (o: (typeof ORNEKLER)[number]) => {
    setMod("seslendirme");
    setMetin(o.metin);
    const s = SESLER.find((x) => x.ad === o.ses);
    if (s) setSes(hazirdanSes(s));
    setTimeout(() => metinRef.current?.focus(), 50);
  };

  const uret = () => {
    if (uretiliyor) return;
    if (gercek === null) return void toast.info("Bağlantı kontrol ediliyor", { description: "Bir saniye sonra yeniden dene." });
    if (eksik) return void toast.error("Ses üretimi başlatılamadı", { description: neden(eksik, "Eksik ayar var.") });
    const diyalogMetni = doluSatirlar.map((x) => `${x.ses.ad}: ${x.metin.trim()}`).join("\n");
    const kaynakAd = kaynak?.ad ?? kaynakBaglanti.trim();
    const istem = mod === "seslendirme" ? metin.trim() : mod === "diyalog" ? diyalogMetni : mod === "efekt" ? efektTarif.trim()
      : mod === "sesdegistir" ? `${kaynakAd} → ${ses.ad} sesi` : mod === "ceviri" ? `${kaynakAd} → ${hedefDiller.map(dilAdi).join(", ")}`
      : mod === "temizle" ? `${kaynakAd} · gürültü temizleme` : `${kaynakAd} · transkript`;
    const denetim = icerikDenetle(istem);
    if (!denetim.izin) return void toast.error(`İçerik engellendi · ${kategoriEtiket(denetim.kategori)}`, { description: denetim.mesaj });
    const temiz = (t: string) => t.replace(/\[[a-z ]{2,20}\]/gi, "").replace(/<break[^>]*\/?>/gi, "").replace(/\s+/g, " ").trim();
    const baslik = mod === "seslendirme" ? temiz(istem).slice(0, 48)
      : mod === "diyalog" ? `Diyalog · ${[...new Set(doluSatirlar.map((x) => x.ses.ad))].join(", ")}`.slice(0, 48)
      : mod === "efekt" ? (EFEKT_ORNEKLERI.find((o) => o.tarif === istem)?.ad ?? istem).slice(0, 48)
      : mod === "sesdegistir" ? `${ses.ad} sesine dönüştürme` : mod === "ceviri" ? `${hedefDiller.map(dilAdi).join(", ")} çeviri`
      : mod === "temizle" ? `${kaynakAd.replace(/\.[a-z0-9]+$/i, "")} · temiz` : `${kaynakAd.replace(/\.[a-z0-9]+$/i, "")} · transkript`;
    setUretiliyor(true);
    setTimeout(() => setUretiliyor(false), 600);
    let basarili = 0;
    let ilkId: string | undefined;
    // Uzun metin: sınırı aşan metin paragraflara bölünüp sıralı parçalar olarak üretilir.
    const metinParcalari = mod === "seslendirme" && karakter > sinir ? parcalara(metin.trim(), sinir) : null;
    const isler = metinParcalari ? metinParcalari.length : kac;
    const grupId = isler > 1 ? yeniId() : undefined;
    for (let i = 0; i < isler; i++) {
      const parcaMetni = metinParcalari?.[i];
      const hedef = mod === "ceviri" ? hedefDiller[i] : hedefDil;
      const sonuc = uretimBaslat({
        // Yalnız gerçek sağlayıcıda kredi düşer; demo (tarayıcı sesi) ücretsizdir — iade akışına bile girmez.
        baslik: (metinParcalari ? `${(baslik || "Ses").slice(0, 40)} · ${i + 1}/${isler}` : mod === "ceviri" && isler > 1 ? `${dilAdi(hedef)} çeviri` : baslik) || "Ses",
        tur: "ses", model: etkinModel, prompt: parcaMetni ?? istem,
        kredi: gercek === true ? (parcaMetni ? ttsKredi(parcaMetni.length) : birimKredi) : 0,
        arac: "Ses Stüdyosu", projeId: aktifProjeId ?? undefined,
        meta: {
          mod, ...(grupId ? { grupId } : {}),
          ...(mod === "seslendirme" || mod === "sesdegistir" ? {
            ses: ses.ad, ...(ses.sesId ? { sesId: ses.sesId } : {}), ...(ses.paylasimSahibi ? { paylasimSahibi: ses.paylasimSahibi } : {}),
          } : {}),
          ...(mod === "seslendirme" ? {
            hamIstem: parcaMetni ?? istem, karakter: (parcaMetni ?? istem).length, bicim, ...(tohum !== null ? { tohum } : {}),
            // Tek parça, MP3 ve gerçek sağlayıcı: ses üretilirken çalmaya başlar (akışlı uç nokta).
            ...(gercek === true && !metinParcalari && isler === 1 && bicim.startsWith("mp3") && sesCalici.akisDestek() ? { akis: true } : {}),
            ...(dil ? { dil } : {}),
            ...(modelTanim.ayrintiliAyar ? { hiz, benzerlik, stil, konusmaciGuclendir } : {}),
            kararlilik,
            ...(normalizasyon !== "auto" ? { normalizasyon } : {}),
            ...(telaffuz.some((t) => t.kelime.trim() && t.okunus.trim()) ? { telaffuz: telaffuz.filter((t) => t.kelime.trim() && t.okunus.trim()) } : {}),
            ...(ortam.filtre || ortam.gurultu || ortam.mekan || typeof ortam.mesafe === "number" ? { ortam } : {}),
          } : {}),
          ...(mod === "diyalog" ? {
            hamIstem: istem, karakter: diyalogKarakter, bicim, kararlilik, ...(tohum !== null ? { tohum } : {}), ...(dil ? { dil } : {}),
            diyalog: doluSatirlar.map((x) => ({ metin: x.metin.trim(), sesId: x.ses.sesId ?? "", ses: x.ses.ad, ...(x.ses.paylasimSahibi ? { sahip: x.ses.paylasimSahibi } : {}) })),
          } : {}),
          ...(mod === "efekt" ? { hamIstem: istem, bicim, dongu, istemEtkisi, ...(efektSn !== null ? { efektSn } : {}) } : {}),
          ...(KAYNAKLI_MODLAR.includes(mod) ? { kaynakAd } : {}),
          ...(mod === "sesdegistir" ? { gurultuTemizle: gurultu, kararlilik, benzerlik, stil, bicim, ...(tohum !== null ? { tohum } : {}) } : {}),
          ...(mod === "ceviri" ? { hedefDil: hedef, ...(kaynakDil ? { kaynakDil } : {}), konusmaciSayisi: konusmaci, ...(!kaynak && kaynakBaglanti.trim() ? { kaynakUrl: kaynakBaglanti.trim() } : {}) } : {}),
          ...(mod === "transkript" && kaynakDil ? { kaynakDil } : {}),
        },
        ...(KAYNAKLI_MODLAR.includes(mod) && kaynak ? { girdi: { kaynak: kaynak.dataUrl } } : {}),
      });
      if (!sonuc.ok) { if (!basarili) uretimHataToast(sonuc); break; }
      ilkId ??= sonuc.id;
      basarili++;
    }
    if (!basarili) return;
    // İlerleme bildirimle değil, editör şeridinde ve geçmişte gösterilir.
    setFiltre("tumu"); setSonId(ilkId ?? null);
    if (basarili > 1) setCekmece(true);
  };

  const ayarlariYukle = (u: Uretim) => {
    const m = u.meta ?? {};
    const md = (m.mod as SesMod | undefined) ?? "seslendirme";
    setMod(md);
    if (md === "seslendirme") {
      setMetin(((m.hamIstem as string | undefined) ?? "").trim());
      if (SES_URETIM_MODELLERI.some((x) => x.ad === u.model)) setModel(u.model);
      setDil(m.dil ?? "");
      if (typeof m.hiz === "number") setHiz(m.hiz);
      if (typeof m.kararlilik === "number") setKararlilik(m.kararlilik);
      if (typeof m.benzerlik === "number") setBenzerlik(m.benzerlik);
      if (typeof m.stil === "number") setStil(m.stil);
    }
    if (md === "diyalog" && m.diyalog?.length) {
      if (DIYALOG_MODELLERI.some((x) => x.ad === u.model)) setDiyalogModel(u.model);
      setDil(m.dil ?? ""); if (typeof m.kararlilik === "number") setKararlilik(m.kararlilik);
      setSatirlar(m.diyalog.map((x) => {
        const h = SESLER.find((s) => s.ad === x.ses); const o = ozelSesler.find((s) => s.ad === x.ses);
        const sv: SecilenSes = h ? hazirdanSes(h) : o ? ozeldenSes(o) : { ad: x.ses ?? "Ses", cinsiyet: "Nötr", renk: "#8b7bff", sesId: x.sesId, paylasimSahibi: x.sahip };
        return { id: yeniId(), ses: sv, metin: x.metin };
      }));
    }
    if (md === "efekt") {
      setEfektTarif(((m.hamIstem as string | undefined) ?? "").trim()); setEfektSn(typeof m.efektSn === "number" ? m.efektSn : null);
      setDongu(!!m.dongu); if (typeof m.istemEtkisi === "number") setIstemEtkisi(m.istemEtkisi);
    }
    if ((md === "seslendirme" || md === "diyalog" || md === "efekt") && m.bicim) setBicim(m.bicim);
    if (md === "seslendirme" || md === "diyalog") setTohum(typeof m.tohum === "number" ? m.tohum : null);
    if (md === "ceviri") { if (m.hedefDil) setHedefDil(m.hedefDil); setKaynakDil(m.kaynakDil ?? ""); setKonusmaci(m.konusmaciSayisi ?? 0); }
    if (md === "sesdegistir" && typeof m.gurultuTemizle === "boolean") setGurultu(m.gurultuTemizle);
    const hazir = SESLER.find((s) => s.ad === m.ses);
    const ozel = ozelSesler.find((o) => o.ad === m.ses);
    if (hazir) setSes(hazirdanSes(hazir)); else if (ozel) setSes(ozeldenSes(ozel));
    setSeciliId(null);
    toast.success("Ayarlar yüklendi", { description: md === "diyalog" ? "Satırları düzenleyip Üret'e basabilirsin." : md === "efekt" ? "Tarifi düzenleyip Üret'e basabilirsin." : md === "seslendirme" ? "Metni düzenleyip Üret'e basabilirsin." : "Kaynak dosya saklanmadı. Dosyayı yeniden yükleyip üret." });
  };

  /**
   * Ücretsiz yeniden üretim (ElevenLabs'teki gibi): ücretli her seslendirme/diyalog, aynı metin, ses ve ayarla
   * UCRETSIZ_HAK kez ücretsiz yeniden üretilebilir. Haklar kök üretime bağlıdır; hatalı denemeler hak yemez.
   */
  const ucretsizHak = (u: Uretim) => {
    const m = u.meta ?? {};
    if (gercek !== true || (m.mod && m.mod !== "seslendirme" && m.mod !== "diyalog")) return 0;
    const kok = m.yenidenKok ?? u.id;
    const kokU = m.yenidenKok ? tumUretimler.find((x) => x.id === kok) : u;
    if (!kokU || !(kokU.kredi > 0)) return 0;
    const kullanilan = tumUretimler.filter((x) => x.meta?.yenidenKok === kok && x.meta?.ucretsiz && x.durum !== "hata").length;
    return Math.max(0, UCRETSIZ_HAK - kullanilan);
  };

  const yenidenUret = (u: Uretim) => {
    const m = u.meta ?? {};
    if (gercek === null) return void toast.info("Bağlantı kontrol ediliyor", { description: "Bir saniye sonra yeniden dene." });
    if (m.mod && KAYNAKLI_MODLAR.includes(m.mod as SesMod)) return void toast.error("Yeniden üretilemedi", { description: "Kaynak dosya saklanmıyor. Dosyayı yeniden yükleyip üret." });
    if (m.mod === "efekt" && gercek !== true) return void toast.error("Ses efekti üretilemedi", { description: "Bunun için ses sağlayıcısı bağlantısı gerekli. Bağlantı kurulunca yeniden dene." });
    const istem = ((m.hamIstem as string | undefined) ?? u.prompt ?? "").trim();
    const kredi = m.mod === "efekt" ? efektKredi(typeof m.efektSn === "number" ? m.efektSn : null)
      : ttsKredi(m.mod === "diyalog" ? (m.diyalog ?? []).reduce((n, x) => n + x.metin.length, 0) : istem.length);
    const { kelimeler: _k, sureSn: _s, transkript: _t, ucretsiz: _u, ...temiz } = m; // eski zaman damgaları yeni sese ait değil
    const hak = ucretsizHak(u);
    const sonuc = uretimBaslat({ baslik: u.baslik, tur: "ses", model: u.model, prompt: istem, kredi: gercek === true && !hak ? kredi : 0, arac: "Ses Stüdyosu", projeId: aktifProjeId ?? undefined,
      meta: { ...temiz, kaynakId: u.id, yenidenKok: m.yenidenKok ?? u.id, ...(hak ? { ucretsiz: true } : {}) } });
    if (!sonuc.ok) return uretimHataToast(sonuc);
    if (hak) toast.success("Ücretsiz yeniden üretim başladı", { description: hak - 1 ? `Bu ses için ${hak - 1} ücretsiz hak kaldı.` : "Bu sesin ücretsiz hakları bitti. Sonraki yeniden üretim kredili." });
    setSeciliId(null); setSonId(sonuc.id ?? null);
  };

  const sesiSil = (u: Uretim, sessiz = false) => {
    if (sesCalici.durum().id === u.id) sesCalici.durdur();
    if (seciliId === u.id) { const s = gezListe[lbIndex + 1] ?? gezListe[lbIndex - 1]; setSeciliId(s && s.id !== u.id ? s.id : null); }
    silUretim(u.id);
    if (!sessiz) mesaj.silindi("Ses", () => uretimGeriYukle(u));
  };

  const sesSecildi = (s: SecilenSes) => {
    if (sesHedef) { satirGuncelle(sesHedef, { ses: s }); setSesHedef(null); }
    else setSes(s);
    setSesSecici(false);
  };

  const calici = useCalici();
  const kaynakCaliyor = calici.id === "kaynak" && calici.calisiyor;
  const sesTanim = SESLER.find((s) => s.ad === ses.ad);

  /* ═══════════════════════ ARAYÜZ ═══════════════════════
     Metin sayfası + yüzen komut kutusu: ortada belge gibi geniş yazı alanı, altta ses / model /
     okuma çipleri ve Üret; sonuçlar sağdan açılan çekmecede (dalga satırları). */
  const [sesHedef, setSesHedef] = useState<string | null>(null);
  const [cip, setCip] = useState<string | null>(null);
  const [mobilGecmis, setMobilGecmis] = useState(false);
  const [etiketAra, setEtiketAra] = useState("");
  const [etiketGrup, setEtiketGrup] = useState("Duygu");
  const [sesAra, setSesAra] = useState("");
  const [sesCins, setSesCins] = useState<"tumu" | "Kadın" | "Erkek">("tumu");
  const [dilAra, setDilAra] = useState("");
  const [filtreAcik, setFiltreAcik] = useState(false);
  const [mac, setMac] = useState(false);
  useEffect(() => { setMac(/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent)); }, []);
  useEffect(() => { setCip(null); }, [mod]);
  const demo = gercek === false;
  const menuSesleri: SecilenSes[] = [
    ...ozelSesler.filter((o) => o.durum === "klonlandi" && gercek).map(ozeldenSes),
    ...SESLER.map(hazirdanSes),
  ];
  const son = sonId ? tumUretimler.find((u) => u.id === sonId) : undefined;
  const cekmeceAcik = cekmece ?? sesUretimleri.length > 0;
  const ac = (k: string) => ({ acik: cip === k, setAcik: (v: boolean) => setCip(v ? k : null) });

  // Boşluk: odak bir girdide değilken çalan ya da son üretimi çalar/duraklatır.
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (secili || sesSecici || klon || tasarim || mobilGecmis) return;
      const h = e.target as HTMLElement;
      const girdide = /^(INPUT|TEXTAREA|SELECT)$/.test(h.tagName) || h.isContentEditable;
      if (e.key === "?" && !girdide) { e.preventDefault(); return setKisayolAcik((v) => !v); }
      if (e.key === "Escape" && (kisayolAcik || kodAcik)) { setKisayolAcik(false); setKodAcik(false); return; }
      if (girdide || e.ctrlKey || e.metaKey || e.altKey) return;
      const tus = e.key.toLowerCase();
      if ((tus === "d" || tus === "f" || tus === "r") && son && son.durum === "tamam") {
        e.preventDefault();
        if (tus === "d") return uretimIndir(son);
        if (tus === "f") { begeniBildir(son.favori); return favoriToggle(son.id); }
        if (KAYNAKLI_MODLAR.includes(son.meta?.mod as SesMod)) return void toast.error("Yeniden üretilemedi", { description: "Kaynak dosya saklanmıyor. Dosyayı yeniden yükleyip üret." });
        return yenidenUret(son);
      }
      if (e.key !== " " || /^(BUTTON|A)$/.test(h.tagName) || h.getAttribute("role") === "slider") return;
      const d = sesCalici.durum();
      const hedef = (d.id ? sesUretimleri.find((u) => u.id === d.id) : undefined) ?? son;
      if (!hedef || hedef.durum !== "tamam") return;
      e.preventDefault();
      if (d.id === hedef.id && d.calisiyor) return sesCalici.duraklat();
      const k = uretimKaynagi(hedef); if (k) void sesCalici.cal(hedef.id, k);
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  });

  /* ── Ses önizleme (hazır sesler sağlayıcının örneğiyle, özel sesler kayıtlı örnekle) ── */
  const onizleKimlik = (v: SecilenSes) => {
    const h = !v.ozel ? SESLER.find((s) => s.ad === v.ad) : undefined;
    if (h) return "onizleme-" + h.sesId;
    const o = v.ozel ? ozelSesler.find((x) => x.ad === v.ad) : undefined;
    return o ? "ornek-" + o.id : "";
  };
  const onizle = async (v: SecilenSes) => {
    const id = onizleKimlik(v);
    if (!id) return;
    if (calici.id === id && calici.calisiyor) return sesCalici.duraklat();
    const h = !v.ozel ? SESLER.find((s) => s.ad === v.ad) : undefined;
    if (h) return void sesCalici.cal(id, { tur: "dosya", url: `/api/ses/onizleme/${h.sesId}` });
    const o = ozelSesler.find((x) => x.ad === v.ad);
    if (!o) return;
    const b = await yerelDepo.oku(o.ornekAnahtar).catch(() => undefined);
    if (!b) return void toast.error("Ses örneği bulunamadı", { description: "Bu sesin örneği bu tarayıcıda kayıtlı değil. Örneği kaydettiğin cihazdan dinleyebilirsin." });
    void sesCalici.cal(id, { tur: "dosya", url: URL.createObjectURL(b) });
  };
  const sesAlt = (v: SecilenSes) => (v.ozel ? "Kendi sesin" : v.paylasimSahibi ? "Topluluk sesi" : SESLER.find((h) => h.ad === v.ad)?.tanim ?? v.cinsiyet);
  const bayrakOf = (v: SecilenSes) => { const b = v.ozel || v.paylasimSahibi ? null : aksanBayrak(SESLER.find((h) => h.ad === v.ad)?.aksan); return b && b !== "🌐" ? b : null; };

  /* ── Popover içerikleri ── */
  const sesListesi = (secili: string, onSec: (s: SecilenSes) => void) => {
    const q = sesAra.trim().toLocaleLowerCase("tr");
    const l = menuSesleri.filter((v) => (sesCins === "tumu" || v.cinsiyet === sesCins)
      && (!q || `${v.ad} ${sesAlt(v)} ${SESLER.find((h) => h.ad === v.ad)?.kullanim ?? ""}`.toLocaleLowerCase("tr").includes(q)));
    return (
      <>
        <div className="mb-2"><MenuKart baslik="Daha fazla ses" sag={<span className="text-[11.5px] text-metin-3">Kendi sesini ekle</span>}>
        <div className="grid grid-cols-3 gap-1.5 p-1.5">
          {([["Kütüphane", Library, () => setSesSecici(true)], ["Klonla", Fingerprint, () => setKlon({})], ["Tasarla", Wand2, () => setTasarim({})]] as const).map(([a, I, f]) => (
            <button key={a} onClick={() => { setCip(null); setSatirSesAcik(null); f(); }} className="flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] px-1.5 py-2 text-[12.5px] font-medium text-metin-2 ring-1 ring-inset ring-white/[0.06] transition hover:bg-white/[0.065] hover:text-metin active:scale-95">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.08]"><I className="h-4 w-4" /></span>{a}
            </button>
          ))}
        </div>
        </MenuKart></div>
        <div className="space-y-2 px-1 pb-2">
          <label className="flex h-9 items-center gap-2 rounded-full bg-white/[0.065] px-3 ring-1 ring-inset ring-white/[0.06] focus-within:ring-white/20">
            <Search className="h-4 w-4 shrink-0 text-metin-2" />
            <input value={sesAra} onChange={(e) => setSesAra(e.target.value)} placeholder="Ses, tarz ya da kullanım ara" aria-label="Ses ara" spellCheck={false}
              className="min-w-0 flex-1 bg-transparent text-[13.5px] text-metin outline-none placeholder:text-metin-2" />
          </label>
          <Segment deger={sesCins} onDegis={setSesCins} etiket="Cinsiyet" secenekler={[["tumu", "Tümü"], ["Kadın", "Kadın"], ["Erkek", "Erkek"]]} />
        </div>
        <MenuKart baslik={sesCins === "tumu" ? "Sesler" : sesCins === "Kadın" ? "Kadın sesler" : "Erkek sesler"} sag={<span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] tabular-nums text-metin-2">{l.length}</span>}>
        <div className="grid grid-cols-2 gap-1.5 p-1.5 max-sm:grid-cols-1">
        {l.map((v) => {
          const id = onizleKimlik(v);
          const caliyor = !!id && calici.id === id && calici.calisiyor;
          const sec = secili === v.ad;
          const b = bayrakOf(v);
          const hazir = SESLER.find((h) => h.ad === v.ad);
          return (
            <div key={v.ad} className={cn("group relative flex min-w-0 flex-col overflow-hidden rounded-[14px] p-2.5 ring-inset transition-[box-shadow,transform] duration-200 hover:-translate-y-px", sec ? "ring-2 ring-white" : "ring-1 ring-white/[0.07] hover:ring-white/25")}
              style={{ background: `radial-gradient(120% 90% at 0% 0%, ${v.renk}${sec ? "33" : "1f"}, transparent 60%), rgba(255,255,255,0.03)` }}>
              <button onClick={() => onSec(v)} aria-label={`${v.ad} sesini seç`} className="absolute inset-0 rounded-[14px]" />
              <span className="pointer-events-none relative flex items-center gap-2.5">
                <button onClick={(e) => { e.stopPropagation(); void onizle(v); }} disabled={!id} aria-label={caliyor ? "Önizlemeyi durdur" : `${v.ad} sesini dinle`}
                  className="group/orb pointer-events-auto relative block h-10 w-10 shrink-0 rounded-full transition-transform hover:scale-105 active:scale-90 disabled:cursor-default">
                  <SesAvatar ad={v.ad} renk={v.renk} boyut={40} aktif={caliyor} />
                  <span className={cn("absolute inset-0 flex items-center justify-center rounded-full bg-black/40 transition-opacity", caliyor ? "opacity-100" : "opacity-0 group-hover/orb:opacity-100 group-hover:opacity-100")}>
                    {caliyor ? <Pause className="h-4 w-4 fill-current text-white" /> : <Play className="h-4 w-4 translate-x-px fill-current text-white" />}
                  </span>
                </button>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="flex items-center gap-1.5"><span className="truncate text-[14px] font-semibold tracking-[-0.01em] text-metin">{v.ad}</span>{b && <Bayrak b={b} boyut={13} />}{v.ozel && <span className="shrink-0 rounded-full bg-white/[0.12] px-1.5 py-px text-[10.5px] font-medium text-metin">Senin</span>}</span>
                  <span className="mt-1 block truncate text-[11.5px] text-metin-3">{[v.cinsiyet, hazir?.kullanim].filter(Boolean).join(" · ")}</span>
                </span>
              </span>
              <span className="pointer-events-none relative mt-2 line-clamp-1 text-[12px] text-metin-2">{sesAlt(v) || " "}</span>
              <SDalga ad={v.ad} renk={v.renk} adet={30} yukseklik={16} canli={caliyor} className="pointer-events-none relative mt-1.5 w-full justify-between" />
            </div>
          );
        })}
        {!l.length && <p className="col-span-full px-3 py-6 text-center text-[13px] text-metin-3">Eşleşen ses yok</p>}
        </div>
        </MenuKart>
      </>
    );
  };

  const modelListesi = (deger: string, onSec: (v: string) => void, yalniz?: (m: (typeof SES_URETIM_MODELLERI)[number]) => boolean) => {
    const liste = SES_URETIM_MODELLERI.filter((m) => !yalniz || yalniz(m));
    const satir = (m: (typeof SES_URETIM_MODELLERI)[number]) => {
      const kapali = !m.saglayici;
      return (
        <button key={m.ad} disabled={kapali} onClick={() => { onSec(m.ad); setCip(null); }} aria-pressed={deger === m.ad}
          className={cn("flex w-full items-center gap-3 rounded-[12px] p-2 text-left ring-1 ring-inset transition-colors disabled:cursor-not-allowed", deger === m.ad ? "bg-white/[0.085] ring-2 ring-white" : "ring-transparent hover:bg-white/[0.065]", kapali && "opacity-45")}>
          <MarkaKare ad={m.ad} boyut={32} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-[13.5px] font-medium text-metin"><span className="truncate">{m.ad}</span>{m.rozet === "Yeni" && !kapali && <span className="rounded-full bg-white/[0.08] px-2 py-px text-[11px] font-medium text-metin-2">Yeni</span>}</span>
            <span className="block text-[12px] leading-snug text-metin-3">{m.ozet}</span>
          </span>
        </button>
      );
    };
    return (
      <div className="space-y-2">
        <MenuKart baslik="Kullanılabilir" sag={<span className="text-[11.5px] text-metin-3">Kredi karakter başına</span>}><div className="space-y-0.5 p-1.5">{liste.filter((m) => m.saglayici).map(satir)}</div></MenuKart>
      </div>
    );
  };

  const dilListesi = (deger: string, onSec: (k: string) => void, otomatik?: string, haric?: string) => {
    const q = dilAra.trim().toLocaleLowerCase("tr");
    const l = DILLER_SIRALI.filter((d) => d.kod !== haric && (!q || `${dilAdi(d.kod)} ${d.kod}`.toLocaleLowerCase("tr").includes(q)));
    const satir = (id: string, ad: React.ReactNode, ikon: React.ReactNode, alt?: string) => (
      <button key={id || "oto"} onClick={() => { onSec(id); setCip(null); }} aria-pressed={deger === id}
        className={cn("flex min-w-0 items-center gap-2.5 rounded-[12px] p-2 text-left ring-1 ring-inset transition-colors", deger === id ? "bg-white/[0.085] ring-2 ring-white" : "ring-white/[0.05] hover:bg-white/[0.065]", !id && "col-span-2")}>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center">{ikon}</span>
        <span className="min-w-0 flex-1 leading-tight"><span className="block truncate text-[13px] font-medium text-metin">{ad}</span>{alt && <span className="block truncate text-[11.5px] text-metin-3">{alt}</span>}</span>
      </button>
    );
    return (
      <>
        <label className="mx-1 mb-1.5 flex h-9 items-center gap-2 rounded-full bg-white/[0.065] px-3 ring-1 ring-inset ring-white/[0.06] focus-within:ring-white/20">
          <Search className="h-4 w-4 shrink-0 text-metin-2" />
          <input value={dilAra} onChange={(e) => setDilAra(e.target.value)} placeholder="Dil ara" aria-label="Dil ara" spellCheck={false} className="min-w-0 flex-1 bg-transparent text-[13.5px] text-metin outline-none placeholder:text-metin-2" />
        </label>
        <MenuKart baslik="Diller" sag={<span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] tabular-nums text-metin-2">{l.length}</span>}>
          <div className="grid grid-cols-2 gap-1.5 p-1.5">
            {otomatik && !q && satir("", otomatik, <Globe2 className="h-4 w-4 text-metin-2" />, etkinTanim.dilSayisi ? `${etkinTanim.dilSayisi} ve üstü dil metinden algılanır` : "Metnin dilinden algılanır")}
            {l.map((d) => satir(d.kod, dilAdi(d.kod), <Bayrak b={d.bayrak} boyut={20} />))}
          </div>
          {!l.length && <p className="px-3 pb-4 text-center text-[13px] text-metin-3">Eşleşen dil yok</p>}
        </MenuKart>
      </>
    );
  };

  const bicimListesi = (
    <div className="space-y-0.5 p-1.5">
      {CIKTI_BICIMLERI.map((b) => (
        <button key={b.id} onClick={() => setBicim(b.id)} aria-pressed={bicim === b.id} className={cn("flex w-full items-center gap-3 rounded-[12px] p-2 text-left ring-1 ring-inset transition-colors", bicim === b.id ? "bg-white/[0.085] ring-2 ring-white" : "ring-transparent hover:bg-white/[0.065]")}>
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors", bicim === b.id ? "bg-white text-black" : "bg-white/[0.085] text-metin-2")}><AudioLines className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-metin">{b.ad}</span><span className="block text-[11.5px] text-metin-3">{b.not ?? "Standart"}</span></span>
        </button>
      ))}
    </div>
  );
  const bicimAd = CIKTI_BICIMLERI.find((b) => b.id === bicim)?.ad.split(" · ")[0] ?? "MP3";

  const tohumSatiri = (
    <div className="flex items-center gap-2">
      <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-metin">Tohum</span><span className="block text-[11.5px] text-metin-3">Aynı tohum ve ayarlar benzer sonucu verir</span></span>
      <input inputMode="numeric" value={tohum ?? ""} placeholder="Rastgele" aria-label="Tohum" spellCheck={false}
        onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 10); setTohum(v === "" ? null : Math.min(4294967295, Number(v))); }}
        className="h-8 w-[104px] rounded-[9px] bg-white/[0.065] px-2.5 text-right text-[13px] tabular-nums text-metin outline-none ring-1 ring-inset ring-white/[0.07] placeholder:text-metin-2 focus:ring-white/20" />
      <button onClick={() => setTohum(Math.floor(Math.random() * 4294967295))} aria-label="Rastgele tohum" title="Zar at" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/[0.075] hover:text-metin"><Dices className="h-4 w-4" /></button>
    </div>
  );

  const yuzde = (n: number) => `%${Math.round(n * 100)}`;

  /* ── Okuma tarzı (seslendirme): hazır tarzlar 2 sütun + kaydırıcılar ── */
  const hazirTarz = HAZIR_STILLER.find((h) => hiz === h.hiz && kararlilik === h.kararlilik && stil === h.stil);
  const varsayilanAyar = hiz === 1 && kararlilik === 0.5 && benzerlik === 0.75 && stil === 0;
  const okumaIcerik = (
    <div className="space-y-2">
      <MenuKart baslik="Tarzlar" sag={<span className="text-[11.5px] text-metin-3">Hız ve tonu birlikte ayarlar</span>}>
      <div className="grid grid-cols-2 gap-1.5 p-1.5">
        {([["Doğal", "Sesin kendi tonu, varsayılan", Mic, varsayilanAyar, () => { setHiz(1); setKararlilik(0.5); setBenzerlik(0.75); setStil(0); }], ["Özel", "Aşağıdaki ince ayarla kendi tarzın", SlidersHorizontal, !varsayilanAyar && !hazirTarz, () => { if (varsayilanAyar || hazirTarz) { setKararlilik(0.4); setStil(0.2); } }]] as const).map(([ad, not, I, a, f]) => (
          <button key={ad} onClick={f} aria-pressed={a}
            className={cn("flex items-center gap-2.5 rounded-[12px] p-2 text-left ring-1 ring-inset transition-colors", a ? "bg-white/[0.085] ring-2 ring-white" : "ring-white/[0.05] hover:bg-white/[0.065]")}>
            <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors", a ? "bg-white text-black" : "bg-white/[0.085] text-metin-2")}><I className="h-3.5 w-3.5" /></span>
            <span className="min-w-0 flex-1 leading-tight"><span className="block text-[13px] font-medium text-metin">{ad}</span><span className="mt-0.5 block text-[11.5px] leading-snug text-metin-3">{not}</span></span>
          </button>
        ))}
        {HAZIR_STILLER.map((h) => {
          const a = hazirTarz?.ad === h.ad;
          return (
            <button key={h.ad} onClick={() => { setHiz(h.hiz); setKararlilik(h.kararlilik); setStil(h.stil); }} aria-pressed={a}
              className={cn("flex items-center gap-2.5 rounded-[12px] p-2 text-left ring-1 ring-inset transition-colors", a ? "bg-white/[0.085] ring-2 ring-white" : "ring-white/[0.05] hover:bg-white/[0.065]")}>
              <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors", a ? "bg-white text-black" : "bg-white/[0.085] text-metin-2")}><h.ikon className="h-3.5 w-3.5" /></span>
              <span className="min-w-0 flex-1 leading-tight"><span className="block text-[13px] font-medium text-metin">{h.ad}</span><span className="mt-0.5 block text-[11.5px] leading-snug text-metin-3">{h.not}</span></span>
            </button>
          );
        })}
      </div>
      </MenuKart>
      <MenuKart baslik="İnce ayar" sag={<Sifirla fn={() => { setHiz(1); setKararlilik(0.5); setBenzerlik(0.75); setStil(0); }} kapali={varsayilanAyar} />}>
      <div className="space-y-3.5 p-3">
        {model === "Eleven v3" ? (
          <div className="space-y-1.5">
            <span className="text-[13px] text-metin-2">Kararlılık</span>
            <Segment deger={kararlilik <= 0.25 ? 0 : kararlilik >= 0.75 ? 1 : 0.5} onDegis={setKararlilik} etiket="Kararlılık" secenekler={[[0, "Yaratıcı"], [0.5, "Doğal"], [1, "Sağlam"]]} />
          </div>
        ) : (
          <Kaydirici ad="Kararlılık" deger={kararlilik} min={0} max={1} adim={0.05} onDegis={setKararlilik} yaz={yuzde} varsayilan={0.5} aciklama="Düşük değer daha duygulu ama her seferinde farklı okur" />
        )}
        {modelTanim.ayrintiliAyar && (
          <>
            <div className="space-y-1.5">
              <span className="text-[13px] text-metin-2">Hız</span>
              <Segment deger={hiz} onDegis={setHiz} etiket="Konuşma hızı" secenekler={[[0.7, "0,7×"], [0.85, "0,85×"], [1, "1×"], [1.1, "1,1×"], [1.2, "1,2×"]]} />
            </div>
            <Kaydirici ad="Benzerlik" deger={benzerlik} min={0} max={1} adim={0.05} onDegis={setBenzerlik} yaz={yuzde} varsayilan={0.75} aciklama="Sesin aslına ne kadar sadık kalınacağı" />
            <Kaydirici ad="Stil abartısı" deger={stil} min={0} max={1} adim={0.05} onDegis={setStil} yaz={yuzde} varsayilan={0} />
          </>
        )}
      </div>
      </MenuKart>
    </div>
  );

  /* ── Gelişmiş (seslendirme): biçim, okuma, telaffuz, ortam, tohum ── */
  const ortamSayisi = [ortam.filtre, ortam.gurultu, ortam.mekan].filter(Boolean).length + (ortam.mesafe ? 1 : 0);
  const kuralSayisi = telaffuz.filter((t) => t.kelime.trim()).length;
  const gelismisIcerik = (
    <div className="space-y-2">
      <MenuKart baslik="Çıktı biçimi">{bicimListesi}</MenuKart>
      <MenuKart baslik="Okuma">
      <div className="space-y-3 p-3">
        <div className="space-y-1.5">
          <span className="text-[13px] text-metin-2">Sayı ve tarihleri yazıya çevir</span>
          <Segment deger={normalizasyon} onDegis={setNormalizasyon} etiket="Sayı ve tarihler" secenekler={[["auto", "Otomatik"], ["on", "Açık"], ["off", "Kapalı"]]} />
        </div>
        {modelTanim.ayrintiliAyar && <AnahtarSatir ad="Konuşmacı güçlendirme" alt="Sesi aslına yaklaştırır; gecikmeyi biraz artırır" acik={konusmaciGuclendir} onDegis={() => setKonusmaciGuclendir((v) => !v)} />}
      </div>
      </MenuKart>
      <MenuKart baslik="Telaffuz sözlüğü" sag={kuralSayisi > 0 ? <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] tabular-nums text-metin-2">{kuralSayisi} kural</span> : <span className="text-[11.5px] text-metin-3">Marka ve kısaltmalar</span>}>
      <div className="space-y-2 p-3">
        <AnimatePresence initial={false}>
          {telaffuz.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.16 }} className="flex items-center gap-1.5">
              <input value={t.kelime} onChange={(e) => setTelaffuz((l) => l.map((x, j) => (j === i ? { ...x, kelime: e.target.value.slice(0, 60) } : x)))} placeholder="Vayra" aria-label="Kelime" spellCheck={false}
                className="h-8 min-w-0 flex-1 rounded-[9px] bg-white/[0.065] px-2.5 text-[13px] text-metin outline-none ring-1 ring-inset ring-white/[0.07] placeholder:text-metin-2 focus:ring-white/20" />
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-metin-3" />
              <input value={t.okunus} onChange={(e) => setTelaffuz((l) => l.map((x, j) => (j === i ? { ...x, okunus: e.target.value.slice(0, 60) } : x)))} placeholder="vay-ra" aria-label="Okunuş" spellCheck={false}
                className="h-8 min-w-0 flex-1 rounded-[9px] bg-white/[0.065] px-2.5 text-[13px] text-metin outline-none ring-1 ring-inset ring-white/[0.07] placeholder:text-metin-2 focus:ring-white/20" />
              <button onClick={() => setTelaffuz((l) => l.filter((_, j) => j !== i))} aria-label="Kuralı sil" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-metin-3 transition-colors hover:bg-white/[0.075] hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
            </motion.div>
          ))}
        </AnimatePresence>
        <button onClick={() => setTelaffuz((l) => [...l, { kelime: "", okunus: "" }].slice(0, 100))} className="flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-medium text-metin-2 transition-colors hover:bg-white/[0.075] hover:text-metin">
          <Plus className="h-3.5 w-3.5" />Kural ekle
        </button>
      </div>
      </MenuKart>
      <MenuKart baslik="Ortam ve efekt" sag={<span className="rounded-full bg-white/[0.08] px-2 py-px text-[11px] font-medium text-metin-2">Yeni</span>}>
      <div className="space-y-3 p-3">
        {([["Filtre", "filtre", [["", "Yok"], ["telephone", "Telefon"], ["radio", "Radyo"], ["robot", "Robot"]]],
          ["Arka plan", "gurultu", [["", "Yok"], ["cafe", "Kafe"], ["city", "Şehir"]]],
          ["Mekân", "mekan", [["", "Yok"], ["room", "Oda"], ["hall", "Salon"], ["outdoors", "Dış mekân"]]]] as const).map(([ad, k, s]) => (
          <div key={k} className="space-y-1.5">
            <span className="text-[13px] text-metin-2">{ad}</span>
            <Segment deger={ortam[k] ?? ""} onDegis={(v: string) => setOrtam((o) => ({ ...o, [k]: v || undefined }))} etiket={ad} secenekler={s.map(([v, a]) => [v, a] as const)} />
          </div>
        ))}
        <Kaydirici ad="Mesafe" deger={ortam.mesafe ?? 0} min={0} max={1} adim={0.1} onDegis={(v) => setOrtam((o) => ({ ...o, mesafe: v }))} yaz={(n) => (n < 0.34 ? "Yakın" : n < 0.67 ? "Orta" : "Uzak")} varsayilan={0} />
      </div>
      </MenuKart>
      <MenuKart baslik="Tekrarlanabilirlik"><div className="p-3">{tohumSatiri}</div></MenuKart>
    </div>
  );

  /* ── Ton etiketi menüsü ("İfade ekle") ── */
  const etiketGruplari = [
    ...(etkinTanim.etiketler ? SES_ETIKET_GRUPLARI.map((g) => ({ grup: g.grup, renk: ETIKET_GRUP_RENK[g.grup], etiketler: g.etiketler })) : []),
    { grup: "Duraklama", renk: ETIKET_GRUP_RENK["Anlatım"], etiketler: duraklamalar },
  ].map((g) => {
    const q = etiketAra.trim().toLocaleLowerCase("tr");
    return { ...g, etiketler: q ? g.etiketler.filter((t) => `${t.ad} ${t.etiket}`.toLocaleLowerCase("tr").includes(q)) : g.etiketler };
  }).filter((g) => g.etiketler.length);
  const aramaVar = etiketAra.trim().length > 0;
  const etkinGrup = etiketGruplari.find((g) => g.grup === etiketGrup) ?? etiketGruplari[0];
  const gosterilen = aramaVar ? etiketGruplari.flatMap((g) => g.etiketler.map((t) => ({ ...t, renk: g.renk }))) : (etkinGrup?.etiketler ?? []).map((t) => ({ ...t, renk: etkinGrup!.renk }));
  const etiketMenusu = (
    <div className="relative">
      <button onClick={() => { setEtiketAcik((v) => !v); setEtiketAra(""); }} aria-expanded={etiketAcik} className={cn(ARAC, etiketAcik && "bg-white/[0.08] text-metin")}>
        <Tags className="h-4 w-4" />{etkinTanim.etiketler ? "İfade ekle" : "Duraklama ekle"}
      </button>
      <AnimatePresence>
        <Yuzen acik={etiketAcik} onKapat={() => setEtiketAcik(false)} yerlesim="ust-sol" bosluk={10} etiket="İfade ekle" className={cn(POP, "flex max-h-[min(520px,70vh)] flex-col overflow-hidden")} style={{ width: "min(600px, calc(100vw - 24px))" }}>
          <div className="flex items-center gap-2 border-b border-white/[0.06] p-2.5">
            <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full bg-white/[0.065] px-3.5 ring-1 ring-inset ring-white/[0.06] focus-within:ring-white/25">
              <Search className="h-4 w-4 shrink-0 text-metin-2" />
              <input autoFocus value={etiketAra} onChange={(e) => setEtiketAra(e.target.value)} placeholder="Ara: fısıltı, gülme, duraklama" aria-label="İfade ara" spellCheck={false}
                onKeyDown={(e) => { if (e.key === "Enter" && gosterilen[0]) { e.preventDefault(); etiketEkle(gosterilen[0].etiket); setEtiketAcik(false); } }}
                className="min-w-0 flex-1 bg-transparent text-[13.5px] text-metin outline-none placeholder:text-metin-2" />
              {aramaVar && <button onClick={() => setEtiketAra("")} aria-label="Aramayı temizle" className="text-metin-3 hover:text-metin"><X className="h-3.5 w-3.5" /></button>}
            </label>
            <span className="hidden shrink-0 items-center gap-1 rounded-full bg-white/[0.065] px-2.5 py-1.5 text-[11.5px] text-metin-3 sm:flex">Metinde <kbd className="rounded-[5px] bg-white/[0.1] px-1.5 font-sans text-[11px] font-semibold text-metin">[</kbd> yaz</span>
          </div>
          <div className="flex min-h-0 flex-1 max-sm:flex-col">
            {!aramaVar && etiketGruplari.length > 1 && (
              <div role="tablist" aria-label="İfade türü" aria-orientation="vertical" className="isolate flex shrink-0 gap-0.5 overflow-y-auto border-r border-white/[0.06] p-1.5 [scrollbar-width:none] max-sm:flex-wrap max-sm:border-b max-sm:border-r-0 sm:w-[150px] sm:flex-col">
                {etiketGruplari.map((g) => {
                  const a = etkinGrup?.grup === g.grup;
                  return (
                    <button key={g.grup} role="tab" aria-selected={a} onClick={() => setEtiketGrup(g.grup)}
                      className={cn("relative flex h-9 shrink-0 items-center gap-2 rounded-[10px] px-2.5 text-left text-[13px] font-medium transition-colors", a ? "text-metin" : "text-metin-2 hover:bg-white/[0.055] hover:text-metin")}>
                      {a && <motion.span layoutId="ses-ifade-grup" transition={YAY} className="absolute inset-0 -z-10 rounded-[10px] bg-white/[0.09] ring-1 ring-inset ring-white/20" />}
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: g.renk }} />
                      <span className="min-w-0 flex-1 truncate">{g.grup}</span>
                      <span className="text-[11.5px] tabular-nums text-metin-3 max-sm:hidden">{g.etiketler.length}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto p-2 [scrollbar-width:thin]">
              {!etkinTanim.etiketler && <p className="mb-2 rounded-[12px] bg-white/[0.055] px-3 py-2 text-[12px] leading-relaxed text-metin-2 ring-1 ring-inset ring-white/[0.06]">Ton ifadeleri Eleven v4 ve v3&apos;te çalışır; bu modelde yalnız duraklama eklenir.</p>}
              {gosterilen.length === 0 && <p className="py-10 text-center text-[13px] text-metin-3">Eşleşen ifade yok. Köşeli parantezle kendin yaz: [korkmuş]</p>}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={aramaVar ? "ara" : etkinGrup?.grup} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.14 }} className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {gosterilen.map((t) => {
                    const I = ETIKET_IKON[t.etiket] ?? Tags;
                    return (
                      <button key={t.etiket} onClick={() => { etiketEkle(t.etiket); setEtiketAcik(false); }} title={`${t.etiket} ekle`}
                        className="group flex min-w-0 flex-col items-start gap-2 rounded-[14px] p-2.5 text-left ring-1 ring-inset ring-white/[0.06] transition-[background-color,box-shadow,transform] hover:bg-white/[0.065] hover:ring-white/25 active:scale-[0.97]">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full transition-transform group-hover:scale-110" style={{ background: `color-mix(in srgb, ${t.renk} 20%, transparent)`, color: t.renk }}><I className="h-[18px] w-[18px]" /></span>
                        <span className="w-full min-w-0 leading-tight">
                          <span className="block truncate text-[13.5px] font-semibold text-metin">{t.ad}</span>
                          <span className="mt-0.5 block truncate text-[11.5px] text-metin-3">{t.etiket.length > 22 ? "duraklama" : t.etiket}</span>
                        </span>
                      </button>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Yuzen>
      </AnimatePresence>
    </div>
  );

  const sonMetinMenusu = sonMetinler.length > 0 && (
    <div className="relative">
      <button onClick={() => setIstemAcik((v) => !v)} aria-expanded={istemAcik} className={cn(ARAC, istemAcik && "bg-white/[0.08] text-metin")}><History className="h-4 w-4" />Son metinler</button>
      <AnimatePresence>
        <Yuzen acik={istemAcik} onKapat={() => setIstemAcik(false)} yerlesim="ust-sol" bosluk={10} etiket="Son metinler" className={cn(POP, "p-1.5")} style={{ width: "min(360px, calc(100vw - 24px))" }}>
          <p className="px-2 pb-1 pt-1.5 text-[13px] font-semibold text-metin">Son metinlerin</p>
          {sonMetinler.map((p) => (
            <button key={p} onClick={() => { setMetin(p); setIstemAcik(false); metinRef.current?.focus(); }} className="flex w-full items-start gap-2.5 rounded-[10px] px-2 py-2 text-left transition-colors hover:bg-white/[0.065]">
              <History className="mt-0.5 h-3.5 w-3.5 shrink-0 text-metin-3" /><span className="line-clamp-2 text-[13px] leading-snug text-metin">{p}</span>
            </button>
          ))}
        </Yuzen>
      </AnimatePresence>
    </div>
  );

  const senaryoMenusu = (
    <div className="relative">
      <button onClick={() => setDiyalogOrnekAcik((v) => !v)} aria-expanded={diyalogOrnekAcik} className={cn(ARAC, diyalogOrnekAcik && "bg-white/[0.08] text-metin")}><Lightbulb className="h-4 w-4" />Hazır senaryo</button>
      <AnimatePresence>
        <Yuzen acik={diyalogOrnekAcik} onKapat={() => setDiyalogOrnekAcik(false)} yerlesim="ust-sol" bosluk={10} etiket="Hazır senaryolar" className={cn(POP, "p-1.5")} style={{ width: "min(330px, calc(100vw - 24px))" }}>
          <MenuKart baslik="Hazır senaryolar"><div className="p-1">{DIYALOG_ORNEKLERI.map((o) => <SenaryoSatiri key={o.baslik} o={o} onClick={() => diyalogOrnekSec(o)} />)}</div></MenuKart>
        </Yuzen>
      </AnimatePresence>
    </div>
  );

  /* ── Sayaç ve süre ── */
  const sure = mod === "seslendirme" ? (metin.trim() ? sureTahmin(metin) : 0) : mod === "diyalog" ? (doluSatirlar.length ? sureTahmin(doluSatirlar.map((x) => x.metin).join(" ")) : 0) : 0;
  const sayac = mod === "seslendirme" ? (
    <span className={cn("tabular-nums", karakter > sinir ? "font-medium text-rose-300" : karakter > sinir * 0.9 ? "text-amber-200" : "text-metin-3")}>{karakter.toLocaleString("tr-TR")} / {sinir.toLocaleString("tr-TR")}</span>
  ) : mod === "diyalog" ? (
    <span className={cn("tabular-nums", diyalogKarakter > DIYALOG_KARAKTER ? "font-medium text-rose-300" : "text-metin-3")}>{diyalogKarakter.toLocaleString("tr-TR")} / {DIYALOG_KARAKTER.toLocaleString("tr-TR")}</span>
  ) : mod === "efekt" ? <span className="tabular-nums text-metin-3">{efektTarif.length} / 1.000</span> : null;
  const surePill = sure > 0 && (
    <span title="Tahmini okuma süresi" className="flex h-7 items-center gap-1 rounded-full bg-white/[0.065] px-2.5 text-[12px] font-medium tabular-nums text-metin-2">
      <Clock className="h-3.5 w-3.5" /><motion.span key={sure} initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={YAY}>{sureYaz(sure)}</motion.span>
    </span>
  );

  /* ── Komut kutusu: üst araç satırı ── */
  const araclar = mod === "seslendirme" ? (
    <>
      {etiketMenusu}
      {sonMetinMenusu}
      {etkinTanim.etiketler && (gelistirOnce !== null ? (
        <button onClick={() => { setMetin(gelistirOnce); setGelistirOnce(null); }} className={ARAC}><Undo2 className="h-4 w-4" />Geri al</button>
      ) : (
        <Tooltip label={gelistirHazir === false ? "Metne uygun ton ifadeleri ekler" : "Metne uygun ton ifadeleri ekler; kelimelere dokunmaz. Kredi düşmez."} side="top">
          <button onClick={() => void metinGelistir()} disabled={gelistirHazir !== true || metin.trim().length < 2 || gelistiriliyor} className={cn(ARAC, "disabled:pointer-events-none disabled:opacity-40")}>
            {gelistiriliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}Geliştir
          </button>
        </Tooltip>
      ))}
      <span className="flex-1" />
      {surePill}
      <span className="px-1.5 text-[12px] max-sm:hidden">{sayac}</span>
      <AnimatePresence>
        {metin && (
          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={YAY}
            onClick={() => { setMetin(""); setGelistirOnce(null); metinRef.current?.focus(); }} aria-label="Metni temizle" title="Metni temizle"
            className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/[0.075] hover:text-metin"><Eraser className="h-4 w-4" /></motion.button>
        )}
      </AnimatePresence>
    </>
  ) : mod === "diyalog" ? (
    <>
      {etiketMenusu}
      {gomulu && senaryoMenusu}
      <span className="flex-1" />
      {surePill}
      <span className="px-1.5 text-[12px] max-sm:hidden">{sayac}</span>
    </>
  ) : mod === "efekt" && efektTarif ? (
    <>
      <span className="flex-1" />
      <span className="px-1.5 text-[12px]">{sayac}</span>
      <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={YAY} onClick={() => { setEfektTarif(""); efektRef.current?.focus(); }} aria-label="Tarifi temizle" title="Tarifi temizle"
        className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/[0.075] hover:text-metin"><Eraser className="h-4 w-4" /></motion.button>
    </>
  ) : null;

  /* ── Komut kutusu: çipler ── */
  const sabitModel = (ad: string) => (
    <span title="Bu aracın modeli" className="flex h-12 items-center gap-2.5 rounded-full bg-white/[0.055] pl-1.5 pr-4 text-[13.5px] ring-1 ring-inset ring-white/[0.06]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.08]"><MarkaKare ad={ad} boyut={26} /></span>
      <span className="flex flex-col items-start leading-tight"><span className="text-[11px] text-metin-3">Model</span><span className="whitespace-nowrap font-medium text-metin">{ad.replace(/^Eleven /, "")}</span></span>
    </span>
  );
  const sesCipi = (baslik: string) => (
    <KCip buyuk {...ac("ses")} etiket={baslik} genislik={560} ikon={<SesAvatar ad={ses.ad} renk={ses.renk} boyut={24} />} deger={ses.ad}>
      {sesListesi(ses.ad, (s) => { setSes(s); setCip(null); })}
    </KCip>
  );
  const dilCipi = (k: string, baslik: string, deger: string, onSec: (v: string) => void, otomatik?: string, haric?: string) => (
    <KCip buyuk {...ac(k)} etiket={baslik} genislik={400} ikon={deger ? <Bayrak b={DILLER.find((d) => d.kod === deger)?.bayrak} boyut={15} /> : <Globe2 className="h-3.5 w-3.5" />} deger={deger ? dilAdi(deger) : otomatik ?? "Seç"}>
      {dilListesi(deger, onSec, otomatik, haric)}
    </KCip>
  );
  const adetCipi = (
    <KCip buyuk {...ac("adet")} etiket="Varyasyon" genislik={320} ikon={<Copy className="h-3.5 w-3.5" />} deger={<><motion.span key={adet} initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={YAY} className="inline-block tabular-nums">{adet}</motion.span> sürüm</>}>
      <MenuKart baslik="Kaç sürüm" sag={<span className="text-[11.5px] text-metin-3">En iyisini seçersin</span>}>
        <div className="p-2"><Segment deger={adet} onDegis={setAdet} etiket="Varyasyon sayısı" secenekler={[[1, "1"], [2, "2"], [3, "3"], [4, "4"]]} /></div>
      </MenuKart>
    </KCip>
  );
  const bicimCipi = (
    <KCip buyuk {...ac("bicim")} etiket="Çıktı biçimi" genislik={300} ikon={<AudioLines className="h-4 w-4" />} deger={bicimAd}><MenuKart baslik="Dosya biçimi">{bicimListesi}</MenuKart></KCip>
  );

  const cipler = mod === "seslendirme" ? (
    <>
      {sesCipi("Ses")}
      <KCip buyuk {...ac("model")} etiket="Model" genislik={420} ikon={<MarkaKare ad={model} boyut={24} />} deger={model.replace(/^Eleven /, "")}>
        {modelListesi(model, setModel)}
      </KCip>
      {modelTanim.dilZorla && dilCipi("dil", "Dil", dil, setDil, "Otomatik")}
      <KCip buyuk {...ac("okuma")} etiket="Okuma tarzı" genislik={440} ikon={hazirTarz ? <hazirTarz.ikon className="h-3.5 w-3.5" /> : <SlidersHorizontal className="h-3.5 w-3.5" />} deger={hazirTarz?.ad ?? (varsayilanAyar ? "Doğal" : "Özel")}>
        {okumaIcerik}
      </KCip>
      {adetCipi}
      <KCip buyuk {...ac("gelismis")} etiket="Gelişmiş" genislik={400} ikon={<Settings2 className="h-3.5 w-3.5" />}
        deger={<span className="flex items-center gap-1.5">{bicimAd}{(kuralSayisi > 0 || ortamSayisi > 0 || tohum !== null) && <span className="h-1.5 w-1.5 rounded-full bg-white" />}</span>}>
        {gelismisIcerik}
      </KCip>
    </>
  ) : mod === "diyalog" ? (
    <>
      <KCip buyuk {...ac("model")} etiket="Model" genislik={420} ikon={<MarkaKare ad={diyalogModel} boyut={24} />} deger={diyalogModel.replace(/^Eleven /, "")}>
        {modelListesi(diyalogModel, setDiyalogModel, (m) => !!m.diyalog)}
      </KCip>
      {dilCipi("dil", "Dil", dil, setDil, "Otomatik")}
      <KCip buyuk {...ac("okuma")} etiket="Kararlılık" genislik={360} ikon={<SlidersHorizontal className="h-3.5 w-3.5" />} deger={yuzde(kararlilik)}>
        <MenuKart baslik="Okuma"><div className="grid grid-cols-3 gap-1.5 p-1.5">
          {([[0.25, "Duygulu", "Her seferinde farklı"], [0.5, "Doğal", "Dengeli, önerilen"], [0.8, "Sabit", "Hep aynı okur"]] as const).map(([v, ad, not]) => {
            const a = Math.abs(kararlilik - v) < 0.03;
            return (
              <button key={ad} onClick={() => setKararlilik(v)} aria-pressed={a} className={cn("flex flex-col items-start rounded-[12px] p-2.5 text-left ring-inset transition-colors", a ? "bg-white/[0.085] ring-2 ring-white" : "ring-1 ring-white/[0.06] hover:bg-white/[0.065]")}>
                <span className="text-[13px] font-semibold text-metin">{ad}</span>
                <span className="mt-0.5 text-[11px] leading-snug text-metin-3">{not}</span>
                <span className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-white/[0.1]"><span className="block h-full rounded-full bg-white" style={{ width: `${Math.round(v * 100)}%` }} /></span>
              </button>
            );
          })}
        </div></MenuKart>
        <div className="mt-2"><MenuKart baslik="Özel"><div className="p-3"><Kaydirici ad="Kararlılık" deger={kararlilik} min={0} max={1} adim={0.05} onDegis={setKararlilik} yaz={yuzde} varsayilan={0.5} /></div></MenuKart></div>
      </KCip>
      <KCip buyuk {...ac("gelismis")} etiket="Gelişmiş" genislik={340} ikon={<Settings2 className="h-3.5 w-3.5" />} deger={bicimAd}>
        <div className="space-y-2"><MenuKart baslik="Çıktı biçimi">{bicimListesi}</MenuKart><MenuKart baslik="Tekrarlanabilirlik"><div className="p-3">{tohumSatiri}</div></MenuKart></div>
      </KCip>
    </>
  ) : mod === "efekt" ? (
    <>
      {sabitModel("Eleven Sound Effects")}
      <KCip buyuk {...ac("sure")} etiket="Süre" genislik={340} ikon={<Clock className="h-3.5 w-3.5" />} deger={efektSn === null ? "Otomatik" : `${String(efektSn).replace(".", ",")} sn`}>
        <MenuKart baslik="Efekt süresi" sag={<span className="text-[11.5px] text-metin-3">En çok 30 sn</span>}>
          <div className="space-y-3 p-3">
            <div className="grid grid-cols-3 gap-1.5">
              {([null, 2, 5, 10, 20, 30] as const).map((n) => {
                const a = efektSn === n;
                return <button key={String(n)} onClick={() => setEfektSn(n)} aria-pressed={a} className={cn("flex h-11 flex-col items-center justify-center rounded-[12px] ring-inset transition-colors", a ? "bg-white/[0.085] ring-2 ring-white" : "ring-1 ring-white/[0.06] hover:bg-white/[0.065]")}><span className="text-[13px] font-semibold tabular-nums text-metin">{n === null ? "Otomatik" : `${n} sn`}</span>{n === null && <span className="text-[10.5px] text-metin-3">Tariften</span>}</button>;
              })}
            </div>
            {efektSn !== null && <Kaydirici ad="Özel uzunluk" deger={efektSn} min={0.5} max={30} adim={0.5} onDegis={setEfektSn} yaz={(n) => `${String(n).replace(".", ",")} sn`} />}
          </div>
        </MenuKart>
      </KCip>
      <AcKapaCip acik={dongu} onDegis={() => setDongu((v) => !v)} ikon={InfinityIcon} etiket="Döngü" title="Başı ve sonu birleşir; ortam sesleri için" />
      <KCip buyuk {...ac("baglilik")} etiket="Tarife bağlılık" genislik={360} ikon={<Target className="h-3.5 w-3.5" />} deger={yuzde(istemEtkisi)}>
        <MenuKart baslik="Ne kadar sıkı uysun"><div className="grid grid-cols-3 gap-1.5 p-1.5">
          {([[0.3, "Yaratıcı", "Tarifi yorumlar"], [0.6, "Dengeli", "Çoğunlukla uyar"], [0.9, "Birebir", "Tarife sıkı uyar"]] as const).map(([v, ad, not]) => {
            const a = Math.abs(istemEtkisi - v) < 0.03;
            return (
              <button key={ad} onClick={() => setIstemEtkisi(v)} aria-pressed={a} className={cn("flex flex-col items-start rounded-[12px] p-2.5 text-left ring-inset transition-colors", a ? "bg-white/[0.085] ring-2 ring-white" : "ring-1 ring-white/[0.06] hover:bg-white/[0.065]")}>
                <span className="text-[13px] font-semibold text-metin">{ad}</span>
                <span className="mt-0.5 text-[11px] leading-snug text-metin-3">{not}</span>
                <span className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-white/[0.1]"><span className="block h-full rounded-full bg-white" style={{ width: `${Math.round(v * 100)}%` }} /></span>
              </button>
            );
          })}
        </div></MenuKart>
        <div className="mt-2"><MenuKart baslik="Özel"><div className="p-3"><Kaydirici ad="Bağlılık" deger={istemEtkisi} min={0} max={1} adim={0.05} onDegis={setIstemEtkisi} yaz={yuzde} varsayilan={0.3} /></div></MenuKart></div>
      </KCip>
      {adetCipi}
      {bicimCipi}
    </>
  ) : mod === "sesdegistir" ? (
    <>
      {sesCipi("Hedef ses")}
      <AcKapaCip acik={gurultu} onDegis={() => setGurultu((v) => !v)} ikon={Wind} etiket="Gürültü temizleme" title="Kayıttaki arka plan gürültüsü dönüştürmeden önce ayıklanır" />
      <KCip buyuk {...ac("okuma")} etiket="Ses ayarları" genislik={320} ikon={<SlidersHorizontal className="h-3.5 w-3.5" />} deger={kararlilik === 0.5 && benzerlik === 0.75 && stil === 0 ? "Varsayılan" : "Özel"}>
        <div className="space-y-2">
          <MenuKart baslik="Dönüşüm" sag={<Sifirla fn={() => { setKararlilik(0.5); setBenzerlik(0.75); setStil(0); }} kapali={kararlilik === 0.5 && benzerlik === 0.75 && stil === 0} />}>
            <div className="space-y-3.5 p-3">
              <Kaydirici ad="Kararlılık" deger={kararlilik} min={0} max={1} adim={0.05} onDegis={setKararlilik} yaz={yuzde} varsayilan={0.5} />
              <Kaydirici ad="Benzerlik" deger={benzerlik} min={0} max={1} adim={0.05} onDegis={setBenzerlik} yaz={yuzde} varsayilan={0.75} aciklama="Hedef sese ne kadar sadık kalınacağı" />
              <Kaydirici ad="Stil abartısı" deger={stil} min={0} max={1} adim={0.05} onDegis={setStil} yaz={yuzde} varsayilan={0} />
            </div>
          </MenuKart>
          <MenuKart baslik="Tekrarlanabilirlik"><div className="p-3">{tohumSatiri}</div></MenuKart>
        </div>
      </KCip>
      {bicimCipi}
    </>
  ) : mod === "ceviri" ? (
    <>
      {dilCipi("kdil", "Kaynak dil", kaynakDil, setKaynakDil, "Otomatik")}
      {masaustu && <ArrowRight className="h-4 w-4 shrink-0 text-metin-3" />}
      <KCip buyuk {...ac("hedef")} etiket="Hedef diller" genislik={420} ikon={hedefDiller[0] ? <Bayrak b={DILLER.find((d) => d.kod === hedefDiller[0])?.bayrak} boyut={15} /> : <Languages className="h-3.5 w-3.5" />}
        deger={hedefDiller.length === 0 ? "Seç" : hedefDiller.length === 1 ? dilAdi(hedefDiller[0]) : `${dilAdi(hedefDiller[0])} +${hedefDiller.length - 1}`}>
        <MenuKart baslik="Çevrilecek diller" sag={<span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[12px] font-medium tabular-nums text-metin">{hedefDiller.length} / 8</span>}>
          <div className="grid grid-cols-2 gap-1.5 p-1.5">
            {DILLER_SIRALI.filter((d) => d.kod !== kaynakDil).map((d) => {
              const sec = hedefDiller.includes(d.kod), no = hedefDiller.indexOf(d.kod) + 1;
              return (
                <button key={d.kod} role="checkbox" aria-checked={sec} onClick={() => setHedefDiller((l) => (sec ? l.filter((x) => x !== d.kod) : [...l, d.kod].slice(0, 8)))}
                  className={cn("flex min-w-0 items-center gap-2.5 rounded-[12px] p-2 text-left ring-1 ring-inset transition-colors active:scale-[0.97]", sec ? "bg-white/[0.085] ring-2 ring-white" : "ring-white/[0.05] hover:bg-white/[0.065]")}>
                  <Bayrak b={d.bayrak} boyut={20} /><span className="min-w-0 flex-1 truncate text-[13px] font-medium text-metin">{dilAdi(d.kod)}</span>
                  <AnimatePresence>{sec && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={YAY} className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold tabular-nums text-black">{no}</motion.span>}</AnimatePresence>
                </button>
              );
            })}
          </div>
        </MenuKart>
      </KCip>
      <KCip buyuk {...ac("konusmaci")} etiket="Konuşmacı" genislik={340} ikon={<Users className="h-3.5 w-3.5" />} deger={konusmaci === 0 ? "Otomatik" : `${konusmaci >= 5 ? "5+" : konusmaci} kişi`}>
        <MenuKart baslik="Kaç kişi konuşuyor" sag={<span className="text-[11.5px] text-metin-3">Her biri kendi sesiyle</span>}>
          <div className="grid grid-cols-3 gap-1.5 p-1.5">
            {([0, 1, 2, 3, 4, 5] as const).map((n) => {
              const a = Math.min(konusmaci, 5) === n;
              return (
                <button key={n} onClick={() => setKonusmaci(n)} aria-pressed={a} className={cn("flex flex-col items-center gap-1.5 rounded-[12px] px-1 py-2.5 ring-inset transition-colors", a ? "bg-white/[0.085] ring-2 ring-white" : "ring-1 ring-white/[0.06] hover:bg-white/[0.065]")}>
                  <span className="flex h-5 items-center -space-x-1.5">{n === 0 ? <Sparkles className="h-4 w-4 text-white/80" /> : Array.from({ length: Math.min(n, 4) }, (_, i) => <span key={i} className="h-4 w-4 rounded-full ring-2 ring-[#1b1c1f]" style={{ background: ["#55d6fd", "#f472b6", "#facc15", "#a78bfa"][i] }} />)}</span>
                  <span className="text-[12.5px] font-semibold text-metin">{n === 0 ? "Otomatik" : n >= 5 ? "5 ve üstü" : `${n} kişi`}</span>
                </button>
              );
            })}
          </div>
        </MenuKart>
      </KCip>
    </>
  ) : mod === "temizle" ? sabitModel("Eleven Voice Isolator")
    : (
      <>
        {sabitModel("Eleven Scribe")}
        {dilCipi("kdil", "Konuşma dili", kaynakDil, setKaynakDil, "Otomatik")}
      </>
    );

  /* ── Üret ── */
  const ctaEtiket = ({ seslendirme: "Seslendir", diyalog: "Seslendir", efekt: "Üret", sesdegistir: "Dönüştür", ceviri: "Çevir", temizle: "Temizle", transkript: "Yazıya dök" } as Record<SesMod, string>)[mod];
  const kilitli = demo && KILITLI_MODLAR.includes(mod);
  const parcaSayisi = mod === "seslendirme" && karakter > sinir && uzunBol ? parcalara(metin.trim(), sinir).length : 0;
  const isSayisi = parcaSayisi || kac;
  const uretDugmesi = (
    <motion.button whileTap={{ scale: 0.97 }} onClick={uret} disabled={uretiliyor} aria-busy={uretiliyor} title={eksik ?? `${ctaEtiket} (${mac ? "⌘" : "Ctrl"}+Enter)`}
      className="group ml-auto flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-5 text-[14.5px] font-semibold text-black transition active:scale-95 max-sm:ml-0 max-sm:w-full">
      {uretiliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />}
      <span>{ctaEtiket}{isSayisi > 1 && <> <motion.span key={isSayisi} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={YAY} className="inline-block tabular-nums">{isSayisi}</motion.span> {parcaSayisi ? "parça" : mod === "ceviri" ? "dil" : "sürüm"}</>}</span>
      {gercek === true && !kilitli && <span className="flex items-center gap-0.5 rounded-full bg-black/10 px-2 py-0.5 text-[12px] tabular-nums"><KrediYildiz className="h-3 w-3" />{toplamKredi}</span>}
    </motion.button>
  );

  const girdiVar = mod === "seslendirme" ? metin.trim().length > 0 : mod === "diyalog" ? doluSatirlar.length > 0 : mod === "efekt" ? efektTarif.trim().length > 0 : !!kaynak || !!kaynakBaglanti.trim();
  // Tek durum hapı: önce engel, sonra eksik, sonra demo bilgisi; aynı bilgi başka yerde tekrarlanmaz.
  const hapMetni = eksik && girdiVar && !/sağlayıcı/i.test(eksik) ? eksik : null;
  const durumHap = hapMetni && (
    <span title={hapMetni} className="max-w-[340px] shrink-0 truncate rounded-full bg-amber-300/[0.08] px-2.5 py-1 text-[11.5px] text-amber-200/90 ring-1 ring-inset ring-amber-300/20 max-sm:hidden">{hapMetni}</span>
  );
  const durum = null;

  const komut = (
    <div className={cn("pointer-events-auto relative w-full min-w-0", gomulu ? "pt-1" : "cam-istemci rounded-[26px] p-3")}
      onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); uret(); } }}>
      {araclar && <div className="mb-2.5 flex items-center gap-1 border-b border-white/[0.08] pb-2.5 max-sm:-mx-3 max-sm:overflow-x-auto max-sm:px-3 max-sm:[scrollbar-width:none]">{araclar}{durumHap}</div>}
      <div className="flex items-center gap-2 max-sm:flex-col max-sm:items-stretch">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&>*]:shrink-0 max-sm:grid max-sm:grid-cols-2 max-sm:overflow-visible max-sm:[&>*:last-child:nth-child(odd)]:col-span-2 max-sm:[&>*>button]:w-full max-sm:[&>*>button>span:nth-child(2)]:min-w-0 max-sm:[&>*>button>span:nth-child(2)]:flex-1 max-sm:[&_.whitespace-nowrap]:block max-sm:[&_.whitespace-nowrap]:max-w-full max-sm:[&_.whitespace-nowrap]:truncate">{cipler}</div>
        {!araclar && durumHap}
        {uretDugmesi}
      </div>
    </div>
  );

  const sonGrup = son?.meta?.grupId ? sesUretimleri.filter((u) => u.meta?.grupId === son.meta?.grupId).sort((a, b) => a.olusturma - b.olusturma) : undefined;
  const sonSeridi = (mobil: boolean) => son && ((son.meta?.mod as SesMod | undefined) ?? "seslendirme") === mod && (
    <motion.div key="son" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={YAY} className="pointer-events-auto mb-2">
      <SonSerit u={son} mobil={mobil} onAc={() => setSeciliId(son.id)} grup={sonGrup} onSec={setSonId} onIptal={() => uretimIptal(son.id)}
        onYenidenUret={KAYNAKLI_MODLAR.includes(son.meta?.mod as SesMod) ? undefined : () => yenidenUret(son)} ucretsizHak={ucretsizHak(son)} onBegen={() => { begeniBildir(son.favori); favoriToggle(son.id); }} onIndir={() => uretimIndir(son)}
        onKapat={() => { if (sesCalici.durum().id === son.id) sesCalici.durdur(); setSonId(null); }} onYenidenDene={() => yenidenUret(son)} />
    </motion.div>
  );

  /* ── Belge: uyarılar ── */
  const etiketVar = /\[[^\]\n]{1,40}\]/.test(metin);
  const kucukDugme = (aktif?: boolean) => cn("h-8 rounded-full px-3 text-[12.5px] font-medium transition-colors", aktif ? "bg-white text-black" : "bg-white/[0.085] text-metin hover:bg-white/[0.12]");
  const uyarilar = (
    <div className="space-y-2 empty:hidden">
      {mod === "seslendirme" && etiketVar && !modelTanim.etiketler && (
        <Uyari ikon={Tags} eylem={<>
          <button onClick={() => setMetin((t) => t.replace(/\[[^\]\n]{1,40}\]\s*/g, "").replace(/[ \t]{2,}/g, " "))} className={kucukDugme()}>İfadeleri kaldır</button>
          <button onClick={() => setModel("Eleven v4")} className={kucukDugme(true)}>Eleven v4&apos;e geç</button>
        </>}>
          <b className="font-semibold text-metin">{model} ton ifadelerini anlamaz.</b> Gönderirken çıkarılır.
        </Uyari>
      )}
      {mod === "seslendirme" && karakter > sinir && (
        <Uyari ikon={Scissors} eylem={<button onClick={() => setUzunBol((v) => !v)} aria-pressed={uzunBol} className={kucukDugme(uzunBol)}>{uzunBol ? "Bölünecek" : "Paragraflara böl"}</button>}>
          <b className="font-semibold text-metin">Metin {sinir.toLocaleString("tr-TR")} karakteri aşıyor.</b> Paragraflara bölüp sırayla üretebilirsin ({parcalara(metin.trim(), sinir).length} parça).
        </Uyari>
      )}
    </div>
  );

  /* ── Belge: mod içerikleri ── */
  const ornekBaslik = (metin: string, sag?: React.ReactNode) => (
    <div className="mb-3 flex items-center justify-between gap-3"><p className="text-[14px] font-semibold text-metin">{metin}</p>{sag}</div>
  );
  /* ── Seslendirme: paragraf blokları (ElevenLabs Studio deseni) ──
     Metin tek dize olarak tutulur; boş satırla ayrılan her paragraf ayrı bir bloktur.
     Enter imleçten yeni paragraf açar, baştaki Backspace öncekiyle birleştirir. */
  const bloklar = metin.split("\n\n");
  const blokYaz = (l: string[]) => { setMetin(l.join("\n\n")); setGelistirOnce(null); };
  const blokOdakla = (i: number, k?: number) => requestAnimationFrame(() => {
    const el = paragrafRefler.current[i];
    if (!el) return;
    el.focus();
    const n = k ?? el.value.length;
    el.setSelectionRange(n, n);
  });
  const blokTus = (i: number) => (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    if (e.key === "[" && !e.ctrlKey && !e.metaKey) { e.preventDefault(); setEtiketAra(""); setEtiketAcik(true); return; }
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const l = [...bloklar];
      l.splice(i, 1, l[i].slice(0, el.selectionStart).trimEnd(), l[i].slice(el.selectionEnd).trimStart());
      blokYaz(l); blokOdakla(i + 1, 0);
      return;
    }
    if (e.key === "Backspace" && i > 0 && el.selectionStart === 0 && el.selectionEnd === 0) {
      e.preventDefault();
      const l = [...bloklar];
      const onceki = l[i - 1];
      l.splice(i - 1, 2, onceki + (onceki && l[i] ? " " : "") + l[i]);
      blokYaz(l); blokOdakla(i - 1, onceki.length + (onceki && bloklar[i] ? 1 : 0));
      return;
    }
    if (e.key === "ArrowUp" && i > 0 && el.selectionStart === 0) { e.preventDefault(); blokOdakla(i - 1); }
    if (e.key === "ArrowDown" && i < bloklar.length - 1 && el.selectionEnd === el.value.length) { e.preventDefault(); blokOdakla(i + 1, 0); }
  };
  const taslakId = (i: number) => `taslak-${i}`;
  const taslakDinle = (i: number) => {
    const id = taslakId(i);
    if (calici.id === id && calici.calisiyor) return sesCalici.duraklat();
    const t = bloklar[i].replace(/\[[^\]\n]{1,40}\]\s*/g, "").replace(/<break[^>]*\/?>/g, " ").replace(/\s+/g, " ").trim();
    if (!t) return;
    void sesCalici.cal(id, { tur: "tarayici", metin: t, dil: dil || undefined, cinsiyet: ses.cinsiyet, hiz });
  };
  const toplamSure = metin.trim() ? sureTahmin(metin) : 0;
  const doluBlok = bloklar.filter((b) => b.trim()).length;
  const seslendirmeBelge = (
    <div className="space-y-8">
      <div>
        <div className="overflow-hidden rounded-[22px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-metin"><BookOpen className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1 leading-tight"><span className="block text-[14.5px] font-semibold text-metin">Metin</span><span className="block truncate text-[12.5px] text-metin-3">Her paragrafın solundaki küreyle taslağını dinle</span></span>
            <AnimatePresence>{doluBlok > 0 && <motion.span key={doluBlok} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={YAY} className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[12px] tabular-nums text-metin-2">{doluBlok} paragraf</motion.span>}</AnimatePresence>
          </div>
          <AnimatePresence initial={false}>
            {bloklar.map((b, i) => {
              const odak = odakBlok === i;
              const caliyor = calici.id === taslakId(i) && calici.calisiyor;
              const dolu = !!b.trim();
              return (
                <motion.div key={i} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={YAY}
                  className={cn("group/blok relative border-white/[0.06] transition-colors [&+&]:border-t", odak ? "bg-white/[0.035]" : "hover:bg-white/[0.035]")}>
                  {odak && <motion.span layoutId="ses-blok-odak" transition={YAY} className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-white" />}
                  <div className="flex gap-3.5 px-4 py-3.5 max-sm:gap-2.5 max-sm:px-3">
                    <button onClick={() => taslakDinle(i)} disabled={!dolu} aria-label={caliyor ? "Taslağı durdur" : `${i + 1}. paragrafı dinle`}
                      title="Taslağı dinle · tarayıcı sesiyle, kredi düşmez"
                      className="relative mt-1 h-8 w-8 shrink-0 rounded-full disabled:cursor-default disabled:opacity-40">
                      <SesAvatar ad={ses.ad} renk={ses.renk} boyut={32} aktif={caliyor} />
                      {dolu && (
                        <span className={cn("absolute inset-0 flex items-center justify-center rounded-full transition-colors", caliyor ? "bg-black/45" : "bg-black/25 group-hover/blok:bg-black/45")}>
                          {caliyor ? <Pause className="h-3 w-3 fill-white text-white" /> : <Play className="ml-0.5 h-3 w-3 fill-white text-white" />}
                        </span>
                      )}
                    </button>
                    <EtiketliMetin deger={b} onDegis={(v) => { const l = [...bloklar]; l[i] = v; blokYaz(l); }} taRef={{ current: null }}
                      kayit={(el) => { paragrafRefler.current[i] = el; if (i === (odakParagraf.current ?? 0)) metinRef.current = el; }}
                      onOdak={() => { odakParagraf.current = i; metinRef.current = paragrafRefler.current[i]; setOdakBlok(i); }}
                      etiket={`${i + 1}. paragraf`} onTus={blokTus(i)}
                      yerTutucu={i === 0 && bloklar.length === 1 ? (etkinTanim.etiketler ? "Okunmasını istediğin metni yaz ya da yapıştır. Ton eklemek için [ yaz." : "Okunmasını istediğin metni yaz ya da yapıştır.") : "Yeni paragraf…"}
                      className="min-w-0 flex-1 pt-0.5 text-[18px] max-sm:text-[16px]" />
                    <span className="w-9 shrink-0 pt-2 text-right text-[12px] tabular-nums text-metin-3">{dolu ? sureYaz(sureTahmin(b)) : ""}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <button onClick={() => { const son = bloklar[bloklar.length - 1]; if (!son.trim()) return blokOdakla(bloklar.length - 1); blokYaz([...bloklar, ""]); blokOdakla(bloklar.length, 0); }}
            className="flex w-full items-center gap-2 border-t border-white/[0.06] px-4 py-3 text-[13px] font-medium text-metin-2 transition-colors hover:bg-white/[0.045] hover:text-metin">
            <Plus className="h-4 w-4" />Paragraf ekle<span className="ml-auto text-[12px] font-normal text-metin-3 max-sm:hidden">Enter yeni paragraf, Shift+Enter alt satır</span>
          </button>
        </div>
      </div>
      {metin.trim() && !gomulu && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Kart ikon={AudioLines} baslik="Bu metni başka sesle" alt="Küreye bas, sesin örneğini dinle; ada bas, seç" sag={<button onClick={() => setSesSecici(true)} className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.085] px-3 text-[12.5px] font-medium text-metin-2 transition hover:bg-white/[0.12] hover:text-metin active:scale-95"><Library className="h-3.5 w-3.5" />Tüm sesler</button>}>
            <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
              {SESLER.slice(0, 8).map((h, i) => {
                const v = hazirdanSes(h), id = onizleKimlik(v), caliyor = calici.id === id && calici.calisiyor, sec = ses.ad === h.ad, b = bayrakOf(v);
                return (
                  <motion.div key={h.ad} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className={cn("group flex min-w-0 items-center gap-2.5 rounded-[14px] p-2 ring-1 ring-inset transition-colors", sec ? "bg-white/[0.085] ring-2 ring-white" : "ring-white/[0.06] hover:bg-white/[0.055]")}>
                    <button onClick={() => void onizle(v)} aria-label={caliyor ? "Durdur" : `${h.ad} sesini dinle`} className="relative shrink-0 rounded-full">
                      <SesAvatar ad={h.ad} renk={h.renk} boyut={36} aktif={caliyor} />
                      <span className={cn("absolute inset-0 flex items-center justify-center rounded-full bg-black/40 transition-opacity", caliyor ? "opacity-100" : "opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100")}>{caliyor ? <Pause className="h-3.5 w-3.5 fill-white text-white" /> : <Play className="ml-0.5 h-3.5 w-3.5 fill-white text-white" />}</span>
                    </button>
                    <button onClick={() => setSes(v)} aria-pressed={sec} className="min-w-0 flex-1 text-left leading-tight">
                      <span className="flex items-center gap-1.5 text-[13.5px] font-medium text-metin"><span className="truncate">{h.ad}</span>{b && <Bayrak b={b} boyut={13} />}</span>
                      <span className="mt-0.5 line-clamp-2 block text-[12px] leading-snug text-metin-3">{h.tanim}</span>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </Kart>
        </motion.div>
      )}
      <AnimatePresence initial={false}>
        {!metin && !gomulu && (
          <motion.section key="ornek" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.18 }}>
            <Kart ikon={Sparkles} baslik="Bir örnekle başla" alt="Metin ve ona uygun ses birlikte gelir" sag={<span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[12px] tabular-nums text-metin-2">{ORNEKLER.length}</span>}>
              <div className="grid grid-cols-3 gap-3 p-3.5 max-sm:grid-cols-2">
                {ORNEKLER.map((o, i) => <OrnekKart key={o.baslik} o={o} i={i} onClick={() => ornekSec(o)} />)}
              </div>
            </Kart>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
  const efektBelge = (
    <div className="space-y-8">
      <Kart ikon={Waves} baslik="Ses tarifi" alt="Kaynak, ortam, mesafe ve yoğunluğu yaz" sag={<span className="rounded-full bg-white/[0.075] px-2.5 py-0.5 text-[11.5px] text-metin-2 max-sm:hidden">İngilizce tarif daha iyi sonuç verir</span>}>
        <textarea ref={efektRef} value={efektTarif} onChange={(e) => setEfektTarif(e.target.value.slice(0, 1000))} aria-label="Ses efekti tarifi" spellCheck={false}
          placeholder="Örneğin: boş bir koridorda yavaşça açılan eski ahşap kapı"
          className={cn("block w-full resize-none bg-transparent px-5 py-4 text-[18px] leading-relaxed text-metin outline-none [field-sizing:content] placeholder:text-metin-2 max-sm:text-[16px]", efektTarif ? "min-h-[180px]" : "min-h-[96px]")} />
      </Kart>
      <AnimatePresence initial={false}>
        {!gomulu && (
          <motion.section key="efekt" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.18 }}>
            <Kart ikon={Sparkles} baslik="Örnek sesler" alt="Tıkla, tarif ve süre ayarı birlikte gelsin" sag={<span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[12px] tabular-nums text-metin-2">{EFEKT_ORNEKLERI.length}</span>}>
              <div className="grid grid-cols-4 gap-3 p-3.5 max-sm:grid-cols-2">
                {EFEKT_ORNEKLERI.map((o, i) => <EfektKart key={o.ad} o={o} i={i} onClick={() => efektOrnekSec(o)} />)}
              </div>
            </Kart>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
  const konusmacilar = [...new Map(satirlar.map((x) => [x.ses.ad, x.ses])).values()];
  const diyalogBelge = (mobil: boolean) => (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[22px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-3">
        <span className="flex shrink-0 -space-x-2">{konusmacilar.slice(0, 5).map((v) => <SesAvatar key={v.ad} ad={v.ad} renk={v.renk} boyut={30} className="ring-2 ring-[#17181b]" />)}</span>
        <span className="min-w-0 flex-1 leading-tight"><span className="block text-[14.5px] font-semibold text-metin">Senaryo</span><span className="block text-[12.5px] text-metin-3">{konusmacilar.length} konuşmacı, {satirlar.length} satır</span></span>
        <span className="rounded-full bg-white/[0.075] px-2.5 py-0.5 text-[11.5px] tabular-nums text-metin-2 max-sm:hidden">En fazla {DIYALOG_SES} ses</span>
      </div>
      <div className="space-y-1 p-2">
        <AnimatePresence initial={false}>
          {satirlar.map((x, i) => (
            <motion.div key={x.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={YAY}
              className="group/satir relative flex gap-3 rounded-[16px] px-2 py-2 transition-colors focus-within:bg-white/[0.045] hover:bg-white/[0.025] max-sm:flex-col max-sm:gap-1.5">
              <div className="relative w-[150px] shrink-0 pt-0.5 max-sm:w-auto">
                <button onClick={() => { setSesAra(""); setSatirSesAcik((v) => (v === x.id ? null : x.id)); }} aria-expanded={satirSesAcik === x.id} aria-label={`Satır ${i + 1} sesi: ${x.ses.ad}, değiştir`}
                  className={cn("flex h-8 max-w-full items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-white/[0.085]", satirSesAcik === x.id && "bg-white/[0.08]")}>
                  <SesAvatar ad={x.ses.ad} renk={x.ses.renk} boyut={24} />
                  <span className="truncate text-[13.5px] font-semibold" style={{ color: `color-mix(in srgb, ${x.ses.renk} 55%, white)` }}>{x.ses.ad}</span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-metin-3" />
                </button>
                <AnimatePresence>
                  <Yuzen acik={satirSesAcik === x.id} onKapat={() => setSatirSesAcik(null)} yerlesim="alt-sol" bosluk={6} etiket="Konuşmacı" className={cn(POP, "max-h-[min(440px,60vh)] overflow-y-auto p-2 [scrollbar-width:thin]")} style={{ width: "min(360px, calc(100vw - 24px))" }}>
                    {sesListesi(x.ses.ad, (v) => { satirGuncelle(x.id, { ses: v }); setSatirSesAcik(null); })}
                  </Yuzen>
                </AnimatePresence>
              </div>
              <EtiketliMetin deger={x.metin} onDegis={(v) => satirGuncelle(x.id, { metin: v })} taRef={{ current: null }} kayit={(el) => { satirRefler.current[x.id] = el; }}
                etiket={`Satır ${i + 1} metni`} onOdak={() => { odakSatir.current = x.id; }} onYapistir={(e) => senaryoYapistir(e, x.id)}
                onTus={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey && i === satirlar.length - 1 && x.metin.trim()) { e.preventDefault(); satirEkle(); } }}
                yerTutucu={i === 0 ? "İlk konuşmacının sözü…" : i === satirlar.length - 1 ? "Yanıt… (Enter yeni satır açar)" : "Yanıt…"}
                className="min-w-0 flex-1 text-[17px]" />
              <div className={cn("flex shrink-0 items-start gap-0.5 transition-opacity max-sm:absolute max-sm:right-1 max-sm:top-1.5", mobil ? "opacity-100" : "opacity-0 focus-within:opacity-100 group-hover/satir:opacity-100")}>
                {etkinTanim.etiketler && (
                  <button onClick={() => { odakSatir.current = x.id; satirRefler.current[x.id]?.focus(); setEtiketAra(""); setEtiketAcik(true); }} aria-label={`Satır ${i + 1} için ifade ekle`} title="İfade ekle" className={IKON}><Tags className="h-3.5 w-3.5" /></button>
                )}
                <button onClick={() => satirTasi(x.id, -1)} disabled={i === 0} aria-label={`Satır ${i + 1} yukarı`} title="Yukarı" className={IKON}><ArrowUp className="h-3.5 w-3.5" /></button>
                <button onClick={() => satirTasi(x.id, 1)} disabled={i === satirlar.length - 1} aria-label={`Satır ${i + 1} aşağı`} title="Aşağı" className={IKON}><ArrowDown className="h-3.5 w-3.5" /></button>
                <button onClick={() => satirSil(x.id)} disabled={satirlar.length <= 1} aria-label={`Satır ${i + 1} sil`} title="Sil" className={cn(IKON, "hover:text-rose-300")}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.06] px-4 py-3">
          <motion.button whileTap={{ scale: 0.97 }} onClick={satirEkle} className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.085] px-3.5 text-[13px] font-medium text-metin transition-colors hover:bg-white/[0.12]">
            <Plus className="h-4 w-4" />Satır ekle
          </motion.button>
          <span className="flex min-w-0 items-center gap-1.5 rounded-full bg-white/[0.055] px-3 py-1.5 text-[12px] text-metin-2"><ClipboardPaste className="h-3.5 w-3.5 shrink-0" /><span className="truncate">Ayşe: Merhaba! biçimindeki senaryoyu yapıştır, satırlar ayrılır</span></span>
        </div>
      </div>
      {!gomulu && (
        <Kart ikon={Sparkles} baslik="Hazır senaryolar" alt="Tıkla, satırlar ve sesler birlikte gelsin" sag={<span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[12px] tabular-nums text-metin-2">{DIYALOG_ORNEKLERI.length}</span>}>
          <div className="grid grid-cols-3 gap-2 p-3.5 max-sm:grid-cols-1">
            {DIYALOG_ORNEKLERI.map((o) => <SenaryoSatiri key={o.baslik} o={o} kart onClick={() => diyalogOrnekSec(o)} />)}
          </div>
        </Kart>
      )}
    </div>
  );

  const KAYNAK_METIN: Record<string, { baslik: string; alt: string }> = {
    sesdegistir: { baslik: "Kaydet ya da bir ses yükle", alt: "Ritim ve duygu korunur; yalnız ses rengi seçtiğin sese dönüşür. Başlayan her dakika 1 kredi." },
    ceviri: { baslik: "Çevrilecek klibi ekle", alt: "Her konuşmacı kendi sesiyle hedef dilde konuşur. Dil başına, başlayan her dakika 12 kredi." },
    temizle: { baslik: "Temizlenecek kaydı ekle", alt: "Rüzgâr, uğultu, müzik ve oda yankısı ayıklanır. Başlayan her dakika 1 kredi." },
    transkript: { baslik: "Yazıya dökülecek kaydı ekle", alt: "Konuşmacılar ayrılır; TXT, SRT ya da VTT indir. Başlayan her dakika 1 kredi." },
  };
  const mikrofonlu = mod === "sesdegistir" || mod === "temizle";
  const kaynakBelge = (
    <div className="space-y-5">
    <div className={cn("flex justify-center", gomulu ? "[&>*]:max-w-none" : "")}>
      <AnimatePresence mode="wait" initial={false}>
        {kaynak ? (
          <motion.div key="dosya" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={YAY}
            className="w-full rounded-[20px] bg-white/[0.045] p-4 ring-1 ring-inset ring-white/[0.07]">
            <div className="flex items-center gap-3.5">
              <motion.button whileTap={{ scale: 0.92 }} onClick={() => (kaynakCaliyor ? sesCalici.duraklat() : void sesCalici.cal("kaynak", { tur: "dosya", url: kaynak.onizleme }))}
                aria-label={kaynakCaliyor ? "Kaynağı duraklat" : "Kaynağı dinle"} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#0b0c0e]">
                {kaynakCaliyor ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
              </motion.button>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[14.5px] font-medium text-metin">{kaynak.video ? <Film className="h-4 w-4 shrink-0 text-metin-2" /> : <AudioLines className="h-4 w-4 shrink-0 text-metin-2" />}<span className="truncate">{kaynak.ad}</span></span>
                <span className="mt-0.5 block text-[12.5px] tabular-nums text-metin-3">{sureYaz(kaynak.sn)} · {kaynak.mb.toFixed(1).replace(".", ",")} MB · {kaynak.video ? "Video" : "Ses"}</span>
              </span>
              <button onClick={() => dosyaRef.current?.click()} className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-metin-2 transition-colors hover:bg-white/[0.075] hover:text-metin max-sm:hidden"><Upload className="h-3.5 w-3.5" />Değiştir</button>
              <button onClick={kaynakKaldir} aria-label="Kaynağı kaldır" title="Kaldır" className={cn(IKON, "h-8 w-8 hover:text-rose-300")}><Trash2 className="h-4 w-4" /></button>
            </div>
            <Dalga url={kaynak.onizleme} tohum={kaynak.ad} n={120} oran={kaynakCaliyor && calici.toplam ? calici.an / calici.toplam : 0} className="mt-4 h-14 w-full" />
          </motion.div>
        ) : kayitta ? (
          <motion.div key="kayit" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={YAY}
            className="flex w-full items-center gap-4 rounded-[20px] bg-rose-500/[0.06] p-4 ring-1 ring-inset ring-rose-400/25">
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-rose-500/25" />
              <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 text-white"><Mic className="h-5 w-5" /></span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[22px] font-light tabular-nums text-metin">{sureYaz(kayitSn)}</span>
              <span className="block text-[12.5px] text-metin-3">Kaydediliyor · en fazla 5 dakika</span>
            </span>
            <button onClick={() => kayitci.current?.state === "recording" && kayitci.current.stop()} className="flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[13.5px] font-semibold text-[#0b0c0e]">
              <Square className="h-3.5 w-3.5 fill-current" />Bitir
            </button>
          </motion.div>
        ) : (
          <motion.div key="bos" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={YAY}
            onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) e.preventDefault(); }} onDrop={(e) => { e.preventDefault(); void kaynakSec(e.dataTransfer.files[0]); }}
            className="w-full overflow-hidden rounded-[20px] bg-white/[0.045] ring-1 ring-inset ring-white/[0.07]">
            <div className="flex items-center gap-4 p-5 max-sm:flex-col max-sm:items-start">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/[0.075] text-metin">
                {kaynakYukleniyor ? <Loader2 className="h-5 w-5 animate-spin" /> : mikrofonlu ? <Mic className="h-5 w-5" /> : mod === "transkript" ? <Captions className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-semibold text-metin">{KAYNAK_METIN[mod]?.baslik}</span>
                <span className="mt-0.5 block text-[13px] leading-snug text-metin-2">{KAYNAK_METIN[mod]?.alt}</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] px-5 py-3.5">
              {mikrofonlu && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => void kayitBaslat()} disabled={kaynakYukleniyor} className="flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-[#0b0c0e] disabled:opacity-50">
                  <Mic className="h-4 w-4" />Mikrofonla kaydet
                </motion.button>
              )}
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => dosyaRef.current?.click()} disabled={kaynakYukleniyor}
                className={cn("flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold disabled:opacity-50", mikrofonlu ? "bg-white/[0.085] text-metin ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.12]" : "bg-white text-[#0b0c0e]")}>
                <Upload className="h-4 w-4" />Dosya seç
              </motion.button>
              <span className="text-[12.5px] text-metin-3">ya da buraya sürükle · {mod === "sesdegistir" ? "MP3, WAV, M4A" : "MP3, WAV, M4A, MP4, MOV"} · en fazla {KAYNAK_MB} MB</span>
            </div>
            {mod === "ceviri" && (
              <label className="flex items-center gap-2.5 border-t border-white/[0.06] px-5 py-3 focus-within:bg-white/[0.035]">
                <Link2 className="h-4 w-4 shrink-0 text-metin-2" />
                <input value={kaynakBaglanti} onChange={(e) => setKaynakBaglanti(e.target.value.slice(0, 500))} placeholder="ya da bağlantı yapıştır: YouTube, TikTok, X, doğrudan medya" aria-label="Kaynak bağlantısı" spellCheck={false}
                  className="min-w-0 flex-1 bg-transparent text-[13.5px] text-metin outline-none placeholder:text-metin-2" />
                {kaynakBaglanti && <button onClick={() => setKaynakBaglanti("")} aria-label="Bağlantıyı temizle" className="text-metin-3 hover:text-metin"><X className="h-4 w-4" /></button>}
              </label>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    {!gomulu && KAYNAK_ADIM[mod] && (
      <>
        <Kart ikon={Lightbulb} baslik="Nasıl çalışır" alt={KAYNAK_ADIM[mod].alt}>
          <ol className="grid gap-2 p-3 sm:grid-cols-3">
            {KAYNAK_ADIM[mod].adimlar.map(([I, b, a], i) => (
              <motion.li key={b} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...YAY, delay: i * 0.05 }}
                className="flex items-start gap-3 rounded-[16px] p-3.5 ring-1 ring-inset ring-white/[0.06]" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-metin"><I className="h-[18px] w-[18px]" />
                  <span className="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white text-[10.5px] font-bold tabular-nums text-black">{i + 1}</span></span>
                <span className="min-w-0 leading-snug"><span className="block text-[14px] font-semibold text-metin">{b}</span><span className="mt-0.5 block text-[12.5px] text-metin-2">{a}</span></span>
              </motion.li>
            ))}
          </ol>
        </Kart>
        <Kart ikon={Check} baslik="İyi sonuç için">
          <ul className="grid gap-x-6 gap-y-2.5 p-4 sm:grid-cols-2">
            {KAYNAK_ADIM[mod].ipuclari.map(([iyi, m]) => (
              <li key={m} className="flex items-center gap-2.5 text-[13px] text-metin-2">
                <span className={cn("flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full", iyi ? "bg-emerald-400 text-[#052e1b]" : "bg-rose-500 text-white")}>{iyi ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" strokeWidth={3} />}</span>{m}
              </li>
            ))}
          </ul>
        </Kart>
      </>
    )}
    </div>
  );
  const belge = (mobil: boolean) => (
    <div className="space-y-5">
      {uyarilar}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={mod} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
          {mod === "seslendirme" ? seslendirmeBelge : mod === "efekt" ? efektBelge : mod === "diyalog" ? diyalogBelge(mobil) : kaynakBelge}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  /* ── Mod seçici: kayan arka planlı bölmeli düğme ── */
  const modSecici = (
    <div role="radiogroup" aria-label="Ses işlemi" className="isolate inline-flex max-w-full gap-0.5 overflow-x-auto rounded-full p-[3px] ring-1 ring-inset ring-white/[0.08] [scrollbar-width:none]" style={{ background: "rgba(255,255,255,0.04)" }}>
      {SES_MODLARI.map((m) => {
        const I = MOD_IKON[m.id];
        const a = mod === m.id;
        return (
          <button key={m.id} role="radio" aria-checked={a} onClick={() => setMod(m.id)} title={m.ozet}
            className={cn("relative flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13.5px] font-medium transition-colors max-sm:h-8 max-sm:px-3 max-sm:text-[13px]", a ? "text-black" : "text-metin-2 hover:text-metin")}>
            {a && <motion.span layoutId="ses-mod" transition={{ type: "spring", stiffness: 480, damping: 36 }} className="absolute inset-0 -z-10 rounded-full bg-white" />}
            <I className="h-4 w-4" />{m.ad}
          </button>
        );
      })}
    </div>
  );
  const demoRozet = null;

  /* ── Sonuçlar çekmecesi ── */
  const modSayilari = SES_MODLARI.map((m) => ({ ...m, n: sesUretimleri.filter((u) => ((u.meta?.mod as SesMod | undefined) ?? "seslendirme") === m.id).length })).filter((m) => m.n > 0);
  const sonuclar = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-2 px-3 pb-2">
        <label className="flex h-9 items-center gap-2 rounded-full bg-white/[0.065] px-3 ring-1 ring-inset ring-white/[0.06] focus-within:ring-white/20">
          <Search className="h-4 w-4 shrink-0 text-metin-2" />
          <input value={gecmisAra} onChange={(e) => setGecmisAra(e.target.value)} placeholder="Metin, ses ya da model ara" aria-label="Sonuçlarda ara" spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-metin outline-none placeholder:text-metin-2" />
          {gecmisAra && <button onClick={() => setGecmisAra("")} aria-label="Aramayı temizle" className="text-metin-3 hover:text-metin"><X className="h-3.5 w-3.5" /></button>}
        </label>
        <div className="flex items-center gap-1">
          <div className="relative">
            <button onClick={() => setFiltreAcik((v) => !v)} aria-expanded={filtreAcik} className={cn(ARAC, "bg-white/[0.055]", filtreAcik && "bg-white/[0.08] text-metin")}>
              {(() => { const I = gecmisMod === "tumu" ? AudioLines : MOD_IKON[gecmisMod]; return <I className="h-4 w-4" />; })()}
              {gecmisMod === "tumu" ? "Tüm türler" : SES_MODLARI.find((m) => m.id === gecmisMod)!.ad}<ChevronDown className="h-3.5 w-3.5 text-metin-3" />
            </button>
            <AnimatePresence>
              <Yuzen acik={filtreAcik} onKapat={() => setFiltreAcik(false)} yerlesim="alt-sol" bosluk={6} etiket="Tür" className={cn(POP, "w-[230px] p-1.5")}>
                {[{ id: "tumu" as const, ad: "Tüm türler", n: sesUretimleri.length }, ...modSayilari].map((m) => {
                  const I = m.id === "tumu" ? AudioLines : MOD_IKON[m.id];
                  return (
                    <button key={m.id} onClick={() => { setGecmisMod(m.id); setFiltreAcik(false); }} className={cn("flex w-full items-center gap-2.5 rounded-[10px] px-2 py-2 text-left text-[13px] ring-inset transition-colors", gecmisMod === m.id ? "bg-white/[0.085] ring-2 ring-white" : "hover:bg-white/[0.065]")}>
                      <I className="h-4 w-4 text-metin-2" /><span className="flex-1 text-metin">{m.ad}</span><span className="tabular-nums text-metin-3">{m.n}</span>
                    </button>
                  );
                })}
              </Yuzen>
            </AnimatePresence>
          </div>
          <button onClick={() => setFiltre((f) => (f === "favori" ? "tumu" : "favori"))} aria-pressed={filtre === "favori"} aria-label="Yalnız beğenilenler" title="Yalnız beğenilenler"
            className={cn(IKON, "h-8 w-8", filtre === "favori" && "bg-rose-400/10 text-rose-300")}><Heart className={cn("h-4 w-4", filtre === "favori" && "fill-current")} /></button>
          <span className="flex-1" />
          {secimModu && <button onClick={() => setSecilenler(secilenler.length === gorunen.length ? [] : gorunen.map((u) => u.id))} className={ARAC}>{secilenler.length === gorunen.length ? "Hiçbiri" : "Tümü"}</button>}
          <button onClick={() => { setSecimModu((v) => !v); setSecilenler([]); }} aria-pressed={secimModu} className={cn(ARAC, secimModu && "bg-white/[0.08] text-metin")}>
            <ListChecks className="h-4 w-4" />{secimModu ? "Bitti" : "Seç"}
          </button>
        </div>
        <AnimatePresence>
          {secimModu && secilenler.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.16 }} className="overflow-hidden">
              <div className="flex items-center gap-1.5 rounded-[12px] bg-white/[0.065] p-1.5 pl-3">
                <span className="flex-1 text-[13px] font-medium text-metin">{secilenler.length} seçili</span>
                <button onClick={() => { const l = sesUretimleri.filter((u) => secilenler.includes(u.id) && u.durum === "tamam"); l.forEach((u, i) => setTimeout(() => uretimIndir(u), i * 350)); toast.success(`${l.length} ses indiriliyor`, { description: "Tarayıcı indirmeleri sırayla başlatır." }); }} className={ARAC}><Download className="h-4 w-4" />İndir</button>
                <button onClick={() => { const l = sesUretimleri.filter((x) => secilenler.includes(x.id)); l.forEach((u) => sesiSil(u, true)); setSecilenler([]); setSecimModu(false); mesaj.silindi(`${l.length} ses`, () => uretimGeriYukle(l)); }}
                  className={cn(ARAC, "text-rose-300 hover:text-rose-200")}><Trash2 className="h-4 w-4" />Sil</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:thin]">
        {sesUretimleri.length === 0 ? (
          <div className="rounded-[16px] bg-white/[0.045] p-4 ring-1 ring-inset ring-white/[0.06]">
            <p className="text-[14px] font-semibold text-metin">Henüz ses yok</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-metin-2">Ürettiğin her ses burada listelenir: dinle, indir, beğen ya da aynı ayarlarla yeniden üret.</p>
          </div>
        ) : gorunen.length === 0 ? (
          <p className="px-4 py-10 text-center text-[13px] text-metin-3">{gecmisAra || gecmisMod !== "tumu" ? "Bu süzgece uyan ses yok." : "Beğendiğin ses yok; kalp ile beğenebilirsin."}</p>
        ) : gruplar.map((g) => (
          <div key={g.etiket} className="mt-3 first:mt-1">
            <p className="pb-1.5"><span className="inline-flex rounded-full bg-white/[0.075] px-2.5 py-0.5 text-[12px] font-medium text-metin-2">{g.etiket}</span></p>
            <div className="space-y-1.5">
              <AnimatePresence initial={false}>
                {g.oge.map((u) => (
                  <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={YAY}>
                    <GecmisSatiri u={u} onAc={() => (secimModu ? setSecilenler((l) => (l.includes(u.id) ? l.filter((x) => x !== u.id) : [...l, u.id])) : (setSeciliId(u.id), setMobilGecmis(false)))}
                      secimModu={secimModu} secili={secilenler.includes(u.id)} onSecim={() => setSecilenler((l) => (l.includes(u.id) ? l.filter((x) => x !== u.id) : [...l, u.id]))}
                      onIptal={() => uretimIptal(u.id)} onYenidenUret={KAYNAKLI_MODLAR.includes(u.meta?.mod as SesMod) ? undefined : () => yenidenUret(u)} ucretsizHak={ucretsizHak(u)}
                      onBegen={() => { begeniBildir(u.favori); favoriToggle(u.id); }} onIndir={() => uretimIndir(u)} onAyar={() => { ayarlariYukle(u); setMobilGecmis(false); }}
                      onYenidenDene={() => yenidenUret(u)} onSil={() => sesiSil(u)} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
      <OynaticiCubugu uretimler={sesUretimleri} haric={son?.id} onAc={setSeciliId} onIndir={uretimIndir} />
    </div>
  );

  /* ── Kısayollar ve API kodu ── */
  const apiGovde = mod === "seslendirme"
    ? { model: "eleven-tts", input: { prompt: metin.trim() || "Merhaba, Vayra'ya hoş geldin.", voice_id: sesTanim ? sesTanim.ad.toLocaleLowerCase("tr") : ses.sesId ?? "brian", ...(["tr", "en", "de", "fr", "es", "ar", "ru"].includes(dil) ? { language: dil } : {}), stability: kararlilik } }
    : null;
  const apiKod = apiGovde && (kodDil === "curl"
    ? `curl -X POST ${typeof location !== "undefined" ? location.origin : ""}/api/v1/generations \\\n  -H "Authorization: Bearer $VAYRA_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(apiGovde, null, 2).replace(/'/g, "'\\''")}'`
    : `const yanit = await fetch("${typeof location !== "undefined" ? location.origin : ""}/api/v1/generations", {\n  method: "POST",\n  headers: {\n    Authorization: \`Bearer \${process.env.VAYRA_API_KEY}\`,\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify(${JSON.stringify(apiGovde, null, 2).replace(/\n/g, "\n  ")}),\n});\nconst { id } = await yanit.json(); // GET /api/v1/generations/{id} ile durumu sorgula`);
  const KISAYOLLAR: [string[], string][] = [
    [[mac ? "⌘" : "Ctrl", "↵"], ctaEtiket],
    [["Boşluk"], "Son sesi çal / duraklat"],
    [["D"], "Son sesi indir"],
    [["F"], "Son sesi beğen"],
    [["R"], "Son sesi yeniden üret"],
    [["["], "İfade menüsü (metin alanında)"],
    [["↵"], "Diyalogda son satırdan yeni satır"],
    [["←", "→"], "Ayrıntıda önceki / sonraki ses"],
    [["Esc"], "Açık pencereyi kapat"],
    [["?"], "Bu listeyi aç / kapat"],
  ];
  const yardimOdak = useOdakTuzagi(kisayolAcik || kodAcik);
  const seciciOdak = useOdakTuzagi(sesSecici);
  const modallar = (
    <>
      <AnimatePresence>
        {(kisayolAcik || kodAcik) && (
          <div ref={yardimOdak} className="fixed inset-0 z-[75] flex justify-end" role="dialog" aria-modal="true" aria-label={kodAcik ? "API kodu" : "Klavye kısayolları"}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="perde absolute inset-0 bg-black/70" onClick={() => { setKisayolAcik(false); setKodAcik(false); }} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%", transition: { duration: 0.2 } }} transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className={cn("relative flex h-full w-full flex-col overflow-y-auto border-l border-white/[0.08] bg-[#151618]", kodAcik ? "max-w-[640px]" : "max-w-[440px]")}>
              <div className="mb-3 flex items-center gap-3 border-b border-white/[0.06] px-5 py-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-white">{kodAcik ? <Code2 className="h-[18px] w-[18px]" /> : <Keyboard className="h-[18px] w-[18px]" />}</span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block text-[16px] font-semibold text-metin">{kodAcik ? "Bu ayarlarla API'den üret" : "Klavye kısayolları"}</span>
                  <span className="block text-[12.5px] text-metin-3">{kodAcik ? "Formdaki değerler isteğe aktarılır" : "Fareye uzanmadan çalış"}</span>
                </span>
                <button onClick={() => { setKisayolAcik(false); setKodAcik(false); }} aria-label="Kapat" className={cn(IKON, "h-9 w-9")}><X className="h-4 w-4" /></button>
              </div>
              {kodAcik ? (
                <div className="space-y-3 px-5 pb-5">
                  {apiKod ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-[200px]"><Segment deger={kodDil} onDegis={setKodDil} etiket="Dil" secenekler={[["curl", "cURL"], ["js", "JavaScript"]]} /></div>
                        <span className="flex-1" />
                        <button onClick={() => { void mesaj.kopyala(apiKod, "Kod"); }} className={cn(ARAC, "bg-white/[0.075] text-metin")}><Copy className="h-4 w-4" />Kopyala</button>
                      </div>
                      <pre style={{ fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace" }} className="max-h-[48vh] overflow-auto whitespace-pre-wrap break-words rounded-[14px] bg-black/30 p-4 text-[12px] leading-relaxed text-metin-2 ring-1 ring-inset ring-white/[0.06] [scrollbar-width:thin]">{apiKod}</pre>
                      <a href="/gelistirici" className="flex items-center gap-1.5 text-[12.5px] text-aksan hover:underline">API anahtarı al ve belgelere git <ArrowRight className="h-3.5 w-3.5" /></a>
                    </>
                  ) : (
                    <p className="rounded-[14px] bg-white/[0.055] p-4 text-[13px] leading-relaxed text-metin-2"><b className="font-semibold text-metin">Bu araç henüz API&apos;de yok.</b> Genel API şimdilik yalnız seslendirme (eleven-tts) sunar.</p>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-white/[0.06] px-5 pb-4">
                  {KISAYOLLAR.map(([tuslar, ne]) => (
                    <div key={ne} className="flex items-center justify-between gap-3 py-2.5">
                      <span className="text-[13px] text-metin-2">{ne}</span>
                      <span className="flex gap-1">{tuslar.map((t) => <kbd key={t} className="min-w-[26px] rounded-md bg-white/[0.085] px-1.5 py-0.5 text-center font-sans text-[11.5px] font-medium text-metin ring-1 ring-inset ring-white/[0.08]">{t}</kbd>)}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <input ref={dosyaRef} type="file" accept="audio/*,video/*" hidden onChange={(e) => { void kaynakSec(e.target.files?.[0]); e.target.value = ""; }} />
      <AnimatePresence>
        {sesSecici && (
          <div ref={seciciOdak} className="fixed inset-0 z-[70] flex justify-end" role="dialog" aria-modal="true" aria-label="Ses kütüphanesi">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="perde absolute inset-0 bg-black/60" onClick={() => { setSesSecici(false); setSesHedef(null); }} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%", transition: { duration: 0.2 } }} transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="relative flex h-full w-full max-w-[880px] flex-col overflow-hidden border-l border-white/[0.08] bg-[#151618]">
              <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-white"><Library className="h-[18px] w-[18px]" /></span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block text-[16px] font-semibold text-metin">{sesHedef ? `Satır ${satirlar.findIndex((x) => x.id === sesHedef) + 1} için ses` : mod === "sesdegistir" ? "Hedef ses" : "Ses kütüphanesi"}</span>
                  <span className="block text-[12.5px] text-metin-3">Dinle, seç ya da kendi sesini oluştur</span>
                </span>
                <button onClick={() => { setSesSecici(false); setSesHedef(null); }} className={cn(IKON, "h-9 w-9")} aria-label="Kapat"><X className="h-4 w-4" /></button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-4 [scrollbar-width:thin]">
                <SesKutuphanesi kompakt secili={sesHedef ? satirlar.find((x) => x.id === sesHedef)?.ses.ad : ses.ad} gercek={gercek} onSec={sesSecildi} onSesEkle={() => setKlon({})} onTasarla={() => setTasarim({})} onKlonla={(o) => setKlon({ klonlanacak: o })}
                  onRemix={(o) => { if (o.sesId) setTasarim({ remixSesId: o.sesId }); }} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {klon && <KlonModal gercek={gercek} klonlanacak={klon.klonlanacak} onKapat={() => setKlon(null)}
          onKlonlandi={(ad) => { const o = useOzelSesler.getState().sesler.find((x) => x.ad === ad); if (o) setSes(ozeldenSes(o)); setSesSecici(false); }} />}
      </AnimatePresence>
      <AnimatePresence>
        {tasarim && <TasarimModal gercek={gercek} remixSesId={tasarim.remixSesId} onKapat={() => setTasarim(false)}
          onKaydedildi={(ad) => { const o = useOzelSesler.getState().sesler.find((x) => x.ad === ad); if (o && !sesHedef) setSes(ozeldenSes(o)); }} />}
      </AnimatePresence>
      <AnimatePresence>
        {secili && (
          <SesGoruntuleyici key="ses-goruntuleyici" u={secili} sira={lbIndex >= 0 ? { i: lbIndex, n: gezListe.length } : null}
            onGez={(y) => { const n = gezListe[lbIndex + y]; if (n) setSeciliId(n.id); }} onKapat={() => setSeciliId(null)}
            onAdKaydet={(ad) => { guncelle(secili.id, { baslik: ad }); toast.success("Ad değiştirildi", { description: `${ad}.${bicimUzantisi(secili.meta)} olarak inecek.` }); }}
            onSeslendir={(t) => { setSeciliId(null); setMod("seslendirme"); setMetin(t.slice(0, 40000)); setGelistirOnce(null); requestAnimationFrame(() => metinRef.current?.focus()); }}
            yorumlar={<YorumSekmesi yorum={yorum} setYorum={setYorum} konuId={secili.id} />} yorumSayisi={tumYorumlar.filter((y) => y.konuId === secili.id).length}
            ustKatmanAcik={sesSecici || !!klon || !!tasarim}
            onAyarlariYukle={() => ayarlariYukle(secili)} onYenidenUret={() => yenidenUret(secili)} ucretsizHak={ucretsizHak(secili)}
            yenidenUretilemez={KAYNAKLI_MODLAR.includes(secili.meta?.mod as SesMod) ? "Kaynak dosya saklanmadı; dosyayı yeniden yükleyip üret" : undefined}
            onIndir={() => uretimIndir(secili)} onBegen={() => { favoriToggle(secili.id); toast.success(secili.favori ? "Beğenilerden çıkarıldı" : "Beğenilere eklendi"); }} onSil={() => sesiSil(secili)} />
        )}
      </AnimatePresence>
    </>
  );

  const sayiRozet = (n: number) => n > 0 && <span className="rounded-full bg-white/[0.08] px-1.5 text-[11.5px] tabular-nums text-metin-2">{n}</span>;

  /* ═══ GÖMÜLÜ (proje Varlıklar'ının alt kutusu) ═══ */
  if (gomulu) {
    return (
      <MotionConfig reducedMotion="user">
        <div className="cam-istemci space-y-2.5 rounded-[26px] p-3">
          <div className="flex items-center gap-2">
            <div className="min-w-0">{modSecici}</div>
            <span className="min-w-0 flex-1" />
            {demoRozet}
            <button onClick={() => setSesSecici(true)} aria-label="Ses kütüphanesi" title="Ses kütüphanesi" className={cn(IKON, "h-8 w-8 shrink-0")}><Library className="h-4 w-4" /></button>
          </div>
          <div className="max-h-[min(150px,18vh)] overflow-y-auto rounded-[18px] bg-black/15 px-4 py-3 ring-1 ring-inset ring-white/[0.06] [scrollbar-width:thin]">{belge(false)}</div>
          <AnimatePresence>{sonSeridi(false)}</AnimatePresence>
          {komut}
          {durum}
        </div>
        {modallar}
      </MotionConfig>
    );
  }

  /* ═══ MOBİL ═══ */
  if (!masaustu) {
    return (
      <MotionConfig reducedMotion="user">
        <div className="flex min-h-[100dvh] flex-col overflow-x-hidden bg-zemin pb-[env(safe-area-inset-bottom)]">
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-1.5 bg-zemin/90 px-2 backdrop-blur-md">
            <button onClick={() => router.push("/panel")} aria-label="Geri" className="flex h-10 w-10 items-center justify-center rounded-full text-metin"><ChevronLeft className="h-5 w-5" /></button>
            <h1 className="flex-1 text-[18px] font-semibold tracking-[-0.01em] text-metin">Ses</h1>
            {demoRozet}
            <button onClick={() => setSesSecici(true)} aria-label="Ses kütüphanesi" className={cn(IKON, "h-9 w-9")}><Library className="h-4 w-4" /></button>
            <button onClick={() => setMobilGecmis(true)} aria-label="Sonuçlar" className={cn(IKON, "relative h-9 w-9")}>
              <History className="h-4 w-4" />
              {aktifIs > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-white" />}
            </button>
          </header>
          <div className="shrink-0 px-3 pb-3 pt-1">{modSecici}</div>
          <main className="flex-1 px-4 pb-6">{belge(true)}</main>
          <div className="sticky bottom-0 z-30 bg-gradient-to-t from-zemin via-zemin to-zemin/0 px-2 pb-2 pt-4">
            <AnimatePresence>{sonSeridi(true)}</AnimatePresence>
            {komut}
            {durum}
          </div>
          <AltSayfa acik={mobilGecmis} baslik="Sonuçlar" onKapat={() => setMobilGecmis(false)}><div className="h-[70vh]">{sonuclar}</div></AltSayfa>
          {modallar}
        </div>
      </MotionConfig>
    );
  }

  /* ═══ MASAÜSTÜ ═══ */
  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("relative flex w-full bg-zemin", gomulu ? "h-[760px] overflow-hidden rounded-2xl" : "h-[calc(100dvh-var(--ust-nav))]")}>
        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="shrink-0 px-6 pt-4">
            <div className="flex min-h-[60px] items-center gap-2 rounded-[22px] bg-[#121315] py-2 pl-2 pr-2.5 ring-1 ring-inset ring-white/[0.07]">
              <span className="ml-1 mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.085] text-white max-[1500px]:hidden"><AudioLines className="h-5 w-5" /></span>
              <div className="min-w-0">{modSecici}</div>
              <span className="min-w-0 flex-1" />
              <Tooltip label="Klavye kısayolları (?)" side="bottom">
                <button onClick={() => setKisayolAcik(true)} aria-label="Klavye kısayolları" className={cn(IKON, "h-9 w-9 shrink-0")}><Keyboard className="h-4 w-4" /></button>
              </Tooltip>
              {!!apiKod && <Tooltip label="Bu ayarlarla API kodu" side="bottom">
                <button onClick={() => setKodAcik(true)} aria-label="API kodu" className={cn(IKON, "h-9 w-9 shrink-0")}><Code2 className="h-4 w-4" /></button>
              </Tooltip>}
              <button onClick={() => setSesSecici(true)} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.075] px-3.5 text-[13px] font-medium text-metin ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.1] active:scale-95"><Library className="h-4 w-4" />Sesler</button>
              <AnimatePresence initial={false}>
                {!cekmeceAcik && (
                  <motion.button initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={YAY} onClick={() => setCekmece(true)}
                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.075] px-3.5 text-[13px] font-medium text-metin ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.1] active:scale-95">
                    <History className="h-4 w-4" />Sonuçlar{sayiRozet(sesUretimleri.length)}{aktifIs > 0 && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
            <div className="mx-auto max-w-[880px] px-8 pb-[300px] pt-6">{belge(false)}</div>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center px-6 pb-5">
            <motion.div initial={{ y: 28, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...YAY, delay: 0.05 }} className="w-full max-w-[1040px]">
              <AnimatePresence>{sonSeridi(false)}</AnimatePresence>
              {komut}
              {durum}
            </motion.div>
          </div>
        </div>
        <AnimatePresence initial={false}>
          {cekmeceAcik && (
            <motion.aside key="cekmece" initial={{ width: 0, opacity: 0 }} animate={{ width: 360, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={YAY}
              className="shrink-0 overflow-hidden border-l border-white/[0.06] bg-[#111214]">
              <div className="flex h-full w-[360px] flex-col">
                <div className="mb-3 flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.085] text-metin"><History className="h-4 w-4" /></span><h2 className="text-[15px] font-semibold text-metin">Sonuçlar</h2>
                  {sayiRozet(sesUretimleri.length)}
                  {aktifIs > 0 && <span className="flex items-center gap-1 rounded-full bg-white/[0.085] px-2 py-0.5 text-[12px] text-metin-2"><Loader2 className="h-3.5 w-3.5 animate-spin" />{aktifIs} sürüyor</span>}
                  <span className="flex-1" />
                  <button onClick={() => setCekmece(false)} aria-label="Sonuçları kapat" className={cn(IKON, "h-8 w-8")}><X className="h-4 w-4" /></button>
                </div>
                <div className="min-h-0 flex-1">{sonuclar}</div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
      {modallar}
    </MotionConfig>
  );
}

/* ═══════════════════════ Küçük parçalar ═══════════════════════ */

/** Başlık şeritli kart: kartsız yüzen başlık yok. */
function Kart({ ikon: I, baslik, alt, sag, children, className }: { ikon: LucideIcon; baslik: React.ReactNode; alt?: React.ReactNode; sag?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("overflow-hidden rounded-[22px] ring-1 ring-inset ring-white/[0.07]", className)} style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-metin"><I className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1 leading-tight"><span className="block text-[14.5px] font-semibold text-metin">{baslik}</span>{alt && <span className="block text-[12.5px] text-metin-3">{alt}</span>}</span>
        {sag}
      </div>
      {children}
    </section>
  );
}
/** Açılır menü içindeki başlık şeritli küçük kart. */
function MenuKart({ baslik, sag, children }: { baslik: React.ReactNode; sag?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex min-h-[38px] items-center gap-2 border-b border-white/[0.06] px-3 py-2"><span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-metin">{baslik}</span>{sag}</div>
      {children}
    </div>
  );
}
/** Aç/kapa ayarı: büyük çip boyunda, açıkken beyaz ikon dairesi ve beyaz çerçeve. */
function AcKapaCip({ acik, onDegis, ikon: I, etiket, title }: { acik: boolean; onDegis: () => void; ikon: LucideIcon; etiket: string; title?: string }) {
  return (
    <button onClick={onDegis} aria-pressed={acik} title={title}
      className={cn("flex h-12 items-center gap-2.5 rounded-full pl-1.5 pr-4 text-[13.5px] ring-1 ring-inset transition-[background-color,box-shadow,transform] active:scale-[0.97]", acik ? "bg-white/[0.1] ring-white/40" : "bg-white/[0.075] ring-white/[0.08] hover:bg-white/[0.1]")}>
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors", acik ? "bg-white text-black" : "bg-white/[0.08] text-metin-2")}><I className="h-4 w-4" /></span>
      <span className="flex flex-col items-start leading-tight"><span className="text-[11px] text-metin-3">{etiket}</span><span className="whitespace-nowrap font-medium text-metin">{acik ? "Açık" : "Kapalı"}</span></span>
    </button>
  );
}

/* Popover başlığı, Sıfırla ve uyarı şeridi */
const Baslik = ({ children, sag }: { children: React.ReactNode; sag?: React.ReactNode }) => (
  <div className="flex min-h-6 items-center justify-between gap-2"><span className="text-[13px] font-semibold text-metin">{children}</span>{sag}</div>
);
const Sifirla = ({ fn, kapali }: { fn: () => void; kapali: boolean }) => (
  <button onClick={fn} disabled={kapali} className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] text-metin-3 transition-colors hover:bg-white/[0.075] hover:text-metin disabled:pointer-events-none disabled:opacity-40"><RotateCcw className="h-3 w-3" />Sıfırla</button>
);
const Uyari = ({ ikon: I, children, eylem }: { ikon: LucideIcon; children: React.ReactNode; eylem?: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={YAY} className="flex flex-wrap items-center gap-3 rounded-[14px] bg-amber-300/[0.06] px-3.5 py-2.5 ring-1 ring-inset ring-amber-300/20">
    <I className="h-4 w-4 shrink-0 text-amber-200" />
    <span className="min-w-0 flex-1 text-[13px] leading-snug text-metin-2">{children}</span>
    {eylem && <span className="flex gap-1.5">{eylem}</span>}
  </motion.div>
);

/** Başlangıç örneği: fotoğraf, örneğin sesi, başlık; üzerine gelince metinden alıntı. */
function OrnekKart({ o, i, onClick }: { o: (typeof ORNEKLER)[number]; i: number; onClick: () => void }) {
  const v = SESLER.find((s) => s.ad === o.ses);
  return (
    <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...YAY, delay: i * 0.04 }} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}
      onClick={onClick} className="group relative aspect-[16/10] overflow-hidden rounded-[16px] bg-white/[0.055] text-left outline outline-1 -outline-offset-1 outline-white/[0.08] hover:outline-white/25">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ORNEK_GORSEL[o.baslik]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
      <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/0" />
      <span className="absolute inset-x-3 bottom-2.5">
        <span className="block text-[15px] font-semibold leading-tight text-white">{o.baslik}</span>
        <span className="mt-1 flex items-center gap-1.5 text-[12px] text-white/75">{v && <SesAvatar ad={v.ad} renk={v.renk} boyut={16} />}{o.ses} · {o.etiket}</span>
        <span className="mt-1 hidden text-[12px] leading-snug text-white/80 group-hover:line-clamp-2">“{o.metin}”</span>
      </span>
    </motion.button>
  );
}

/** Ses efekti örneği: fotoğraf, süre ve döngü bilgisi. */
function EfektKart({ o, i, onClick }: { o: (typeof EFEKT_ORNEKLERI)[number]; i: number; onClick: () => void }) {
  const I = EFEKT_IKON[o.ad] ?? Waves;
  return (
    <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...YAY, delay: i * 0.035 }} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}
      onClick={onClick} title={o.tarif} className="group flex min-w-0 flex-col self-start text-left">
      <span className="relative block aspect-[4/3] overflow-hidden rounded-[14px] bg-white/[0.055] outline outline-1 -outline-offset-1 outline-white/[0.08] group-hover:outline-white/25">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={EFEKT_GORSEL[o.ad]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
        <span className="absolute left-2 top-2 flex h-6 items-center gap-1 rounded-full bg-black/55 px-2 text-[11px] font-medium tabular-nums text-white backdrop-blur-sm">
          <I className="h-3 w-3" />{o.sn ? `${String(o.sn).replace(".", ",")} sn` : "Oto"}{o.dongu && <InfinityIcon className="h-3 w-3" />}
        </span>
      </span>
      <span className="mt-1.5 block truncate text-[13.5px] font-medium text-metin">{o.ad}</span>
      <span className="line-clamp-2 block text-[12px] leading-snug text-metin-3">{o.aciklama}</span>
    </motion.button>
  );
}

/** Hazır diyalog senaryosu: üst üste ses küreleri, başlık, satır sayısı. */
function SenaryoSatiri({ o, onClick, kart }: { o: (typeof DIYALOG_ORNEKLERI)[number]; onClick: () => void; kart?: boolean }) {
  const sesler = [...new Set(o.satirlar.map((x) => x.ses))];
  return (
    <button onClick={onClick} className={cn("flex w-full items-center gap-3 text-left transition-colors", kart ? "rounded-[16px] bg-white/[0.045] p-3 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.075]" : "rounded-[10px] px-2 py-2 hover:bg-white/[0.065]")}>
      <span className="flex shrink-0 -space-x-2">{sesler.slice(0, 3).map((a) => { const v = SESLER.find((s) => s.ad === a)!; return <SesAvatar key={a} ad={v.ad} renk={v.renk} boyut={26} className="ring-2 ring-[#1b1c1f]" />; })}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-medium text-metin">{o.baslik}</span>
        <span className="block truncate text-[12px] text-metin-3">{o.satirlar.length} satır · {sesler.join(", ")}</span>
      </span>
      {kart && <ArrowRight className="h-4 w-4 shrink-0 text-metin-3" />}
    </button>
  );
}

/**
 * Ton ifadeleri ([excited]) ve duraklamalar (<break …/>) grubunun rengiyle vurgulanan metin alanı:
 * arkada aynı yazı tipiyle çizilen ayna katmanı etiketleri renklendirir, üstteki şeffaf textarea
 * yazmayı ve imleci taşır (ElevenLabs v3 editör deseni).
 */
function EtiketliMetin({ deger, onDegis, taRef, kayit, etiket, yerTutucu, className, onOdak, onTus, onYapistir }: {
  deger: string; onDegis: (v: string) => void; taRef: React.RefObject<HTMLTextAreaElement | null>; kayit?: (el: HTMLTextAreaElement | null) => void;
  etiket: string; yerTutucu: string; className?: string; onOdak?: () => void; onTus?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onYapistir?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
}) {
  const parcalar = deger.split(/(\[[^\]\n]{1,30}\]|<break[^>]*\/?>)/g);
  const ortak = "col-start-1 row-start-1 w-full whitespace-pre-wrap break-words leading-[1.7]";
  return (
    <div className={cn("grid", className)}>
      <div aria-hidden className={cn(ortak, "pointer-events-none text-metin")}>
        {parcalar.map((p, i) => (i % 2 === 1
          ? <span key={i} className="rounded-[5px] px-0.5" style={{ color: etiketRengi(p), background: `color-mix(in srgb, ${etiketRengi(p)} 14%, transparent)` }}>{p}</span>
          : <span key={i}>{p}</span>))}
        {"​"}
      </div>
      <textarea ref={(el) => { (taRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el; kayit?.(el); }} value={deger}
        onChange={(e) => onDegis(e.target.value)} onFocus={onOdak} onKeyDown={onTus} onPaste={onYapistir} aria-label={etiket} placeholder={yerTutucu} spellCheck={false} rows={1}
        className={cn(ortak, "resize-none overflow-hidden bg-transparent text-transparent caret-white outline-none placeholder:text-metin-2 selection:bg-white/25 selection:text-transparent")} />
    </div>
  );
}
