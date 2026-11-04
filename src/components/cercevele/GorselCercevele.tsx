"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { KenarTutamac, useKenarGenisligi } from "@/components/ui/KenarTutamac";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Crop, Upload, Images, Loader2, X, Check, Download, Maximize2, Wand2, Ban, Monitor, Smartphone, ShoppingBag, Film,
  RotateCcw, ZoomOut, ChevronLeft, ChevronDown, Keyboard, PanelRightClose, History, Repeat2, Move, Link2, Unlink2,
  Expand, Sparkles, Eye, Image as ImageIcon, Grid3x3, ShieldCheck, ArrowLeftRight, Layers, Clapperboard, SplitSquareHorizontal,
  Square, Trash2, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { useMasaustu } from "@/hooks/useMasaustu";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useAktifProje } from "@/lib/useAktifProje";
import { uretimBaslat, uretimHataToast, uretimIptal } from "@/lib/uretimMotoru";
import { icerikDenetle, kategoriEtiket } from "@/lib/moderasyon";
import { uretimIndir } from "@/lib/gercekEylem";
import { medyaBoyutu } from "@/store/useUpscale";
import { GIRDI_MAX_MB } from "@/lib/upscaleVeri";
import { modelLogoUrl } from "@/components/kitaplik/Simgeler";
import { Yuzen } from "@/components/ui/Yuzen";
import { Tooltip } from "@/components/ui/Tooltip";
import { KrediHap, KrediYildiz } from "@/components/ui/KrediHap";
import { KitaplikPaneli } from "@/components/studyo/KitaplikPaneli";
import { OranSekli, useGorselBaglanti, dosyaOku, gorselOlcu, gorselYukle, uretimGorseli, GORSEL_TURLERI, krediYaz } from "@/components/arac/kit";

const ARAC = "Reframe";
type Tur = "gorsel" | "video";
const ORANLAR = ["1:1", "4:5", "3:4", "2:3", "9:16", "9:21", "16:9", "3:2", "4:3", "21:9"];
const ORAN_AD: Record<string, string> = { "1:1": "Kare", "4:5": "Gönderi", "3:4": "Portre", "2:3": "Afiş", "9:16": "Dikey", "9:21": "Uzun", "16:9": "Geniş", "3:2": "Fotoğraf", "4:3": "Klasik", "21:9": "Sinema" };
type Marka = { id: string; ad: string; logo?: string; ikon?: LucideIcon; zemin: string };
const MARKALAR: Marka[] = [
  { id: "instagram", ad: "Instagram", logo: "/marka/instagram.svg", zemin: "linear-gradient(45deg,#FEDA75 0%,#FA7E1E 25%,#D62976 50%,#962FBF 75%,#4F5BD5 100%)" },
  { id: "tiktok", ad: "TikTok", logo: "/marka/tiktok.svg", zemin: "#000" },
  { id: "youtube", ad: "YouTube", logo: "/marka/youtube-data.svg", zemin: "#FF0033" },
  { id: "pinterest", ad: "Pinterest", logo: "/marka/pinterest.svg", zemin: "#E60023" },
  { id: "linkedin", ad: "LinkedIn", logo: "/marka/linkedin-in.svg", zemin: "#0A66C2" },
  { id: "x", ad: "X", logo: "/marka/x.svg", zemin: "#000" },
  { id: "facebook", ad: "Facebook", logo: "/marka/facebook.svg", zemin: "#0866FF" },
  { id: "diger", ad: "Diğer", ikon: Monitor, zemin: "#26262a" },
];
type Bicim = { id: string; marka: string; ad: string; w: number; h: number; ikon?: LucideIcon };
const BICIMLER: Bicim[] = [
  { id: "ig-gonderi", marka: "instagram", ad: "Gönderi", w: 1080, h: 1350 }, { id: "ig-kare", marka: "instagram", ad: "Kare gönderi", w: 1080, h: 1080 },
  { id: "ig-story", marka: "instagram", ad: "Story ve Reels", w: 1080, h: 1920 },
  { id: "tt-video", marka: "tiktok", ad: "Video", w: 1080, h: 1920 },
  { id: "yt-kapak", marka: "youtube", ad: "Video kapağı", w: 1280, h: 720 }, { id: "yt-shorts", marka: "youtube", ad: "Shorts", w: 1080, h: 1920 },
  { id: "yt-banner", marka: "youtube", ad: "Kanal görseli", w: 2560, h: 1440 },
  { id: "pin", marka: "pinterest", ad: "Pin", w: 1000, h: 1500 },
  { id: "li-gonderi", marka: "linkedin", ad: "Gönderi", w: 1200, h: 627 }, { id: "li-kapak", marka: "linkedin", ad: "Profil kapağı", w: 1584, h: 396 },
  { id: "x-gonderi", marka: "x", ad: "Gönderi", w: 1600, h: 900 }, { id: "x-baslik", marka: "x", ad: "Başlık", w: 1500, h: 500 },
  { id: "fb-gonderi", marka: "facebook", ad: "Gönderi", w: 1200, h: 630 }, { id: "fb-kapak", marka: "facebook", ad: "Kapak", w: 1640, h: 624 },
  { id: "masaustu", marka: "diger", ad: "Masaüstü", w: 2560, h: 1440, ikon: Monitor }, { id: "sinema", marka: "diger", ad: "Sinema 21:9", w: 2520, h: 1080, ikon: Film },
  { id: "urun", marka: "diger", ad: "E-ticaret ürün", w: 2000, h: 2000, ikon: ShoppingBag }, { id: "telefon", marka: "diger", ad: "Telefon duvar kâğıdı", w: 1290, h: 2796, ikon: Smartphone },
];
const MIN_KENAR = 256;
type Motor = "bria" | "ideogram" | "luma" | "yaratici";
const MOTORLAR: { id: Motor; ad: string; logo: string; not: string; etiket: string[]; kredi: number; konum: boolean }[] = [
  { id: "bria", ad: "Bria Expand", logo: "Bria", not: "Kaynağa en sadık genişletme", etiket: ["Konum", "Kenarlar", "Olmasın"], kredi: 1, konum: true },
  { id: "ideogram", ad: "Ideogram 3 Reframe", logo: "Ideogram 3", not: "Hızlı, her boyut; istem almaz", etiket: ["Her oran", "Hızlı"], kredi: 1, konum: false },
  { id: "luma", ad: "Luma Photon Reframe", logo: "Luma", not: "Sinema oranlarında güçlü", etiket: ["21:9 ve 9:21", "İstemli"], kredi: 1, konum: false },
  { id: "yaratici", ad: "Nano Banana 2.1", logo: "Nano Banana 2.1", not: "Talimatla sahneyi yeniden kurgular", etiket: ["Konum", "Talimatlı", "Yaratıcı"], kredi: 3, konum: true },
];
const VIDEO_MODEL = "Luma Ray Reframe";
const VIDEO_MAX_SN = 10;
const videoKredi = (sn: number) => Math.max(4, Math.ceil(sn * 2));
const LUMA_ORAN = ["1:1", "16:9", "9:16", "4:3", "3:4", "21:9", "9:21"];
const ORNEKLER: { ad: string; not: string; gorsel: string; oran: string; tur: Tur; poster?: string; w?: number; h?: number }[] = [
  { ad: "Portre", not: "Story 9:16", gorsel: "/gercek/galeri/portre1.webp", oran: "9:16", tur: "gorsel" },
  { ad: "Manzara", not: "Sinema 21:9", gorsel: "/gercek/galeri/sinematik1.webp", oran: "21:9", tur: "gorsel" },
  { ad: "Ürün", not: "Gönderi 4:5", gorsel: "/gercek/galeri/urun1.webp", oran: "4:5", tur: "gorsel" },
  { ad: "Dağlar", not: "YouTube 16:9", gorsel: "/gercek/galeri/manzara1.webp", oran: "16:9", tur: "gorsel" },
  { ad: "Drone çekimi", not: "YouTube 16:9", gorsel: "/gercek/video-hareket/drone-orbit.mp4", poster: "/gercek/video-hareket/drone-orbit-poster.webp", oran: "16:9", tur: "video", w: 720, h: 1280 },
  { ad: "Reklam", not: "Kare 1:1", gorsel: "/gercek/video-hareket/commercial.mp4", poster: "/gercek/video-hareket/commercial-poster.webp", oran: "1:1", tur: "video", w: 720, h: 1280 },
];
/** Sosyal paket: tek tıkla seçilen hedefler. */
const SOSYAL_PAKET = ["9:16", "4:5", "1:1", "16:9"];
const PAKET_MAX = 6;
const sayiOran = (o: string) => { const [a, b] = o.split(":").map(Number); return a && b ? a / b : 1; };
const MAKS_MP = 24_000_000, MAKS_KENAR = 5000;
const YUZEY = "cam-istemci bg-[rgba(34,35,40,0.8)] ring-1 ring-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[14px] backdrop-saturate-[1.25]";
const POP = "rounded-[18px] border border-white/[0.09] bg-[#1b1c1f]";
/** Üretilecek yeni alanın deseni: koyu zemin üstünde ince beyaz çizgiler. */
const YENI_ALAN = "bg-[#141518] bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.07)_0_1.5px,transparent_1.5px_9px)]";
const SECILI = "bg-white/[0.1] outline-white/80";
const SECILI_DEGIL = "bg-white/[0.03] outline-white/[0.07] hover:bg-white/[0.06] hover:outline-white/20";

type Kanvas = { w: number; h: number; x: number; y: number; gw: number; gh: number };
type Gorunum = { id: string; url: string; video?: boolean; kanvas: Kanvas; etiket: string; yerel?: boolean; demo?: boolean };
type Kaynak = { tur: Tur; url: string; goster: string; poster?: string; w: number; h: number; sure?: number; durum: "yukleniyor" | "hazir"; uretimId?: string; ad?: string };
/** Bir çerçeveleme hedefi: oran ya da platform boyutu. */
type Hedef = { anahtar: string; oran: string; serbest?: { w: number; h: number }; bicimId?: string };
type Konum = { x: number; y: number; z: number };
type Guvenli = "yok" | "tiktok" | "reels" | "shorts";

/** Hedef tuval geometrisi (kaynak pikseli cinsinden). */
function geometri(sw: number, sh: number, oran: string, serbest: { w: number; h: number }, zoom: number, ax: number, ay: number) {
  let W: number, H: number, gw: number, gh: number;
  if (oran === "serbest") {
    W = serbest.w; H = serbest.h;
    const s0 = Math.min(W / sw, H / sh);
    gw = (sw * s0) / zoom; gh = (sh * s0) / zoom;
  } else {
    const r = oran === "orijinal" ? sw / sh : sayiOran(oran);
    const W0 = Math.max(sw, sh * r), H0 = W0 / r;
    W = W0 * zoom; H = H0 * zoom; gw = sw; gh = sh;
  }
  let f = 1;
  if (W * H > MAKS_MP) f = Math.sqrt(MAKS_MP / (W * H));
  if (Math.max(W, H) * f > MAKS_KENAR) f = MAKS_KENAR / Math.max(W, H);
  W *= f; H *= f; gw *= f; gh *= f;
  return { w: Math.round(W), h: Math.round(H), gw: Math.round(gw), gh: Math.round(gh), x: Math.round((W - gw) * ax), y: Math.round((H - gh) * ay), yeni: 1 - (gw * gh) / (W * H) };
}

const oranYaz = (w: number, h: number) => {
  const r = w / h;
  const l = [...ORANLAR, "5:4", "1.91:1"];
  const en = l.reduce((a, o) => (Math.abs(sayiOran(o) - r) < Math.abs(sayiOran(a) - r) ? o : a), "1:1");
  return Math.abs(sayiOran(en) - r) < 0.012 ? en : `${(r >= 1 ? r : 1 / r).toFixed(2).replace(".", ",")}${r >= 1 ? ":1" : " dikey"}`;
};
const KOSE = ["n", "s", "e", "w", "ne", "nw", "se", "sw"] as const;
type Kose = (typeof KOSE)[number];
const hedefAnahtar = (oran: string, bicimId: string | null) => (oran === "serbest" ? (bicimId ? `p:${bicimId}` : "serbest") : oran);
const varsayilanKonum = (oran: string): Konum => ({ x: 0.5, y: 0.5, z: oran === "orijinal" ? 1.4 : 1 });
const sureYaz = (s?: number) => (s ? `${Math.round(s)} sn` : "");

export function GorselCercevele() {
  const router = useRouter();
  const ara = useSearchParams();
  const masaustu = useMasaustu();
  const { aktifProjeId } = useAktifProje();
  const b = useGorselBaglanti();
  const dosyaRef = useRef<HTMLInputElement>(null);
  const alanRef = useRef<HTMLDivElement>(null);
  const [tur, setTur] = useState<Tur>("gorsel");
  const [kaynak, setKaynak] = useState<Kaynak | null>(null);
  const [oran, setOran] = useState("16:9");
  const [serbest, setSerbest] = useState({ w: 1920, h: 1080 });
  const [kilitli, setKilitli] = useState(true);
  const [konumlar, setKonumlar] = useState<Record<string, Konum>>({});
  const [istem, setIstem] = useState("");
  const [negatif, setNegatif] = useState("");
  const [olmasinAcik, setOlmasinAcik] = useState(false);
  const [motor, setMotor] = useState<Motor>("bria");
  const [adet, setAdet] = useState(1);
  const [paketMod, setPaketMod] = useState(false);
  const [paket, setPaket] = useState<Hedef[]>([]);
  const [seciliSonuc, setSeciliSonuc] = useState<string | null>(null);
  const [onceGoster, setOnceGoster] = useState(false);
  const [gorunumMod, setGorunumMod] = useState<"sonuc" | "karsilastir">("sonuc");
  const [sinirGoster, setSinirGoster] = useState(false);
  const [kesit, setKesit] = useState(50);
  const [onizlemeler, setOnizlemeler] = useState<Gorunum[]>([]);
  const [onizlemeSecili, setOnizlemeSecili] = useState<string | null>(null);
  const [onizleniyor, setOnizleniyor] = useState(false);
  const [alan, setAlan] = useState({ w: 800, h: 600 });
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [kitaplikAcik, setKitaplikAcik] = useState(false);
  const [oranAcik, setOranAcik] = useState(false);
  const [oranSekme, setOranSekme] = useState<"oran" | "platform" | "kenar">("oran");
  const [bicimId, setBicimId] = useState<string | null>(null);
  const [markaSec, setMarkaSec] = useState("instagram");
  const [motorAcik, setMotorAcik] = useState(false);
  const [kisayolAcik, setKisayolAcik] = useState(false);
  const [guvenliAcik, setGuvenliAcik] = useState(false);
  const [guvenli, setGuvenli] = useState<Guvenli>("yok");
  const [izgara, setIzgara] = useState(false);
  const [surumAcik, setSurumAcik] = useState(true);
  const surumEn = useKenarGenisligi("cercevele-surum", 268);
  const yanEn = useKenarGenisligi("cercevele-yan", 300, 240);
  const [suruklen, setSuruklen] = useState(false);
  const [rehber, setRehber] = useState<{ x: boolean; y: boolean } | null>(null);
  const [kenarAktif, setKenarAktif] = useState(false);
  const surukle = useRef<{ x: number; y: number; kx: number; ky: number } | null>(null);
  const kenar = useRef<{ yon: Kose; x: number; y: number; ds: number; g: Kanvas } | null>(null);
  const uretKilit = useRef(0);

  const video = (kaynak?.tur ?? tur) === "video";
  // Sağlayıcıya göre varsayılan motor
  useEffect(() => { if (b.hazir && !b.fal && b.herhangi && motor !== "yaratici") setMotor("yaratici"); }, [b.hazir, b.fal, b.herhangi]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = alanRef.current; if (!el) return;
    const o = () => setAlan((a) => (a.w === el.clientWidth && a.h === el.clientHeight ? a : { w: el.clientWidth, h: el.clientHeight }));
    o(); const r = new ResizeObserver(o); r.observe(el); return () => r.disconnect();
  }, [kaynak, masaustu]);

  const sifirla = () => { setSeciliSonuc(null); setOnizlemeler([]); setOnizlemeSecili(null); setGorunumMod("sonuc"); };
  const turSec = (t: Tur) => {
    setTur(t);
    if (t === "video") { if (!LUMA_ORAN.includes(oran)) { setOran("9:16"); setBicimId(null); } setPaket((p) => p.filter((h) => LUMA_ORAN.includes(h.oran))); }
  };
  const kaynakAyarla = (k: Kaynak) => {
    setKaynak(k); turSec(k.tur); sifirla(); setKonumlar({});
    if (k.tur === "video" && !k.poster) void kareAl(k.goster).then((p) => p && setKaynak((x) => (x && x.goster === k.goster ? { ...x, poster: p } : x)));
  };
  const videoYukle = async (d: File) => {
    if (d.size > GIRDI_MAX_MB.video * 1024 * 1024) return void mesaj.desteklenmeyenDosya(`MP4, WebM ya da MOV (en fazla ${GIRDI_MAX_MB.video} MB)`);
    const onizleme = URL.createObjectURL(d);
    const o = await medyaBoyutu(onizleme, "video");
    if (!o) return void mesaj.yuklenemedi("Video", "Video okunamadı; başka bir dosya dene.");
    kaynakAyarla({ tur: "video", url: onizleme, goster: onizleme, w: o.w, h: o.h, sure: o.sure, durum: "yukleniyor", ad: d.name.replace(/\.[^.]+$/, "") });
    try {
      const fd = new FormData(); fd.append("dosya", d);
      const r = await fetch("/api/upscale/yukle", { method: "POST", body: fd }).then((x) => x.json()) as { ok: boolean; url?: string; hata?: string };
      if (!r.ok || !r.url) throw new Error(r.hata);
      setKaynak((k) => (k && k.goster === onizleme ? { ...k, url: r.url!, durum: "hazir" } : k));
    } catch (e) { setKaynak(null); mesaj.yuklenemedi("Video", e instanceof Error ? e.message : undefined); }
  };
  const kaynakSec = async (d?: File) => {
    if (!d) return;
    if (/^video\/(mp4|webm|quicktime)$/.test(d.type)) return void videoYukle(d);
    if (!GORSEL_TURLERI.includes(d.type)) return void mesaj.desteklenmeyenDosya("PNG, JPG, WebP görsel ya da MP4, WebM, MOV video");
    const dataUrl = await dosyaOku(d);
    const { w, h } = await gorselOlcu(dataUrl);
    kaynakAyarla({ tur: "gorsel", url: dataUrl, goster: dataUrl, w, h, durum: "yukleniyor", ad: d.name.replace(/\.[^.]+$/, "") });
    gorselYukle(dataUrl).then((url) => setKaynak((k) => (k && k.goster === dataUrl ? { ...k, url, durum: "hazir" } : k))).catch((e: Error) => { setKaynak(null); mesaj.yuklenemedi("Görsel", e.message || undefined); });
  };
  const urlAc = async (url: string, t: Tur, ek: Partial<Kaynak> = {}) => {
    const o = await medyaBoyutu(url, t);
    if (!o?.w) return void mesaj.yuklenemedi(t === "video" ? "Video" : "Görsel", "Dosyaya ulaşılamadı.");
    kaynakAyarla({ tur: t, url, goster: url, w: o.w, h: o.h, sure: o.sure, durum: "hazir", ...ek });
  };
  const ornekAc = (o: (typeof ORNEKLER)[number]) => void urlAc(o.gorsel, o.tur, { ad: o.ad }).then(() => { setOran(o.oran); setBicimId(null); setPaketMod(false); });
  // Başka sayfalardan gelen kaynak: ?kaynak=<url>&uretim=<id>
  useEffect(() => {
    const k = ara.get("kaynak");
    if (!k || !/^\/(api\/dosya|gercek)\//.test(k)) return;
    const id = ara.get("uretim") ?? undefined;
    const u = id ? useProjeler.getState().uretimler.find((x) => x.id === id) : undefined;
    void urlAc(k, u?.tur === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(k) ? "video" : "gorsel", { uretimId: id, ad: u?.baslik?.slice(0, 60) });
  }, [ara]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const f = (e: ClipboardEvent) => {
      const h = e.target as HTMLElement | null;
      if (h && /^(INPUT|TEXTAREA)$/.test(h.tagName)) return;
      const d = [...(e.clipboardData?.files ?? [])].find((x) => GORSEL_TURLERI.includes(x.type));
      if (d) { e.preventDefault(); void kaynakSec(d); }
    };
    window.addEventListener("paste", f); return () => window.removeEventListener("paste", f);
  });

  const mt = MOTORLAR.find((m) => m.id === motor)!;
  const konumVar = !video && mt.konum;
  const anahtar = hedefAnahtar(oran, bicimId);
  const kz = konumlar[anahtar] ?? varsayilanKonum(oran);
  const konum = { x: kz.x, y: kz.y };
  const zoom = kz.z;
  const konumYaz = (f: (k: Konum) => Konum, a = anahtar) => setKonumlar((m) => ({ ...m, [a]: f(m[a] ?? varsayilanKonum(a === "orijinal" ? "orijinal" : "")) }));
  const setKonum = (k: { x: number; y: number }) => konumYaz((o) => ({ ...o, ...k }));
  const setZoom = (z: number | ((z: number) => number)) => konumYaz((o) => ({ ...o, z: typeof z === "function" ? z(o.z) : z }));
  const geoHedef = (h: Hedef) => {
    if (!kaynak) return null;
    const k = konumlar[h.anahtar] ?? varsayilanKonum(h.oran);
    return geometri(kaynak.w, kaynak.h, h.oran, h.serbest ?? serbest, konumVar ? k.z : 1, konumVar ? k.x : 0.5, konumVar ? k.y : 0.5);
  };
  const aktifHedef: Hedef = { anahtar, oran, serbest: oran === "serbest" ? serbest : undefined, bicimId: bicimId ?? undefined };
  const g = geoHedef(aktifHedef);
  const oranDestekli = (o: string) => (video || motor === "luma" ? LUMA_ORAN.includes(o) : true);
  const ayni = !!g && g.yeni < 0.005;
  const oranEtiket = oran === "serbest" ? "Serbest" : oran === "orijinal" ? "Uzaklaştır" : oran;
  const platform = oran === "serbest" ? BICIMLER.find((p) => p.id === bicimId && p.w === serbest.w && p.h === serbest.h) : undefined;
  const platformMarka = platform && MARKALAR.find((m) => m.id === platform.marka);
  const platformAd = platform ? (platform.marka === "diger" ? platform.ad : `${platformMarka?.ad} ${platform.ad.toLocaleLowerCase("tr")}`) : null;
  const hedefAd = (h: Hedef) => { const p = h.bicimId && BICIMLER.find((x) => x.id === h.bicimId); return p ? `${MARKALAR.find((m) => m.id === p.marka)!.ad === "Diğer" ? "" : `${MARKALAR.find((m) => m.id === p.marka)!.ad} `}${p.ad.toLocaleLowerCase("tr")}` : h.oran; };
  const hedefler: Hedef[] = paketMod && paket.length ? paket : [aktifHedef];

  // Sürümler
  const uretimler = useProjeler((s) => s.uretimler);
  const kaynakUrl = (u: Uretim) => (u.meta?.videoUrl ?? u.meta?.gorselUrl) as string | undefined;
  const sonuclar = useMemo(() => (kaynak ? uretimler.filter((u) => u.arac === ARAC && kaynakUrl(u) === kaynak.url).sort((a, c) => a.olusturma - c.olusturma) : []), [uretimler, kaynak]);
  const tumSonuclar = useMemo(() => uretimler.filter((u) => u.arac === ARAC && u.durum === "tamam").sort((a, c) => c.olusturma - a.olusturma), [uretimler]);
  const secili = sonuclar.find((u) => u.id === seciliSonuc);
  const surer = sonuclar.filter((u) => u.durum === "kuyrukta" || u.durum === "isleniyor");
  useEffect(() => { const son = sonuclar[sonuclar.length - 1]; if (son && son.durum === "tamam" && !seciliSonuc && Date.now() - son.olusturma < 120_000) { setSeciliSonuc(son.id); setOnizlemeSecili(null); } }, [sonuclar]); // eslint-disable-line react-hooks/exhaustive-deps

  const kilit = video ? false : !b.herhangi ? false : motor !== "yaratici" && !b.fal;
  const demo = b.hazir && (video ? !b.fal : !b.herhangi);
  const birimKredi = () => (demo ? 0 : video ? videoKredi(kaynak?.sure ?? 5) : mt.kredi);
  const toplamKredi = hedefler.length * birimKredi() * (video ? 1 : adet);
  const eksik = !kaynak ? "Önce bir görsel ya da video seç" : kaynak.durum !== "hazir" ? (video ? "Video yükleniyor" : "Görsel yükleniyor")
    : paketMod && paket.length < 2 ? "Sosyal pakette en az 2 hedef seç"
    : video && (kaynak.sure ?? 0) > VIDEO_MAX_SN + 0.4 ? `Video en fazla ${VIDEO_MAX_SN} sn olabilir; kısaltıp yeniden yükle`
    : hedefler.some((h) => !oranDestekli(h.oran)) ? (video ? "Video yalnız 1:1, 16:9, 9:16, 4:3, 3:4, 21:9 ve 9:21 oranlarına genişler" : "Luma yalnız 1:1, 16:9, 9:16, 4:3, 3:4, 21:9 ve 9:21 oranlarını destekler")
    : hedefler.some((h) => (geoHedef(h)?.yeni ?? 0) < 0.005) ? (paketMod ? `Paketteki bir hedef zaten ${video ? "videonun" : "görselin"} oranında; onu çıkar` : video ? "Video zaten bu oranda; başka bir oran seç" : "Görsel zaten bu oranda; uzaklaştır ya da başka bir oran seç")
    : !paketMod && oran === "serbest" && (serbest.w < MIN_KENAR || serbest.h < MIN_KENAR) ? `Serbest boyutta her kenar en az ${MIN_KENAR} px olmalı`
    : kilit ? `${mt.ad} için fal.ai bağlantısı gerekli` : null;

  const calistir = () => {
    if (eksik || !kaynak) return void toast.error("Çerçeveleme başlatılamadı", { description: `${eksik ?? "Önce bir görsel seç"}.` });
    if (istem.trim()) { const d = icerikDenetle(istem); if (!d.izin) return void toast.error("İçerik engellendi", { description: `${kategoriEtiket(d.kategori)}. ${d.mesaj}` }); }
    setGonderiliyor(true);
    let n = 0;
    dis: for (const h of hedefler) {
      const gg = geoHedef(h)!;
      const etiket = h.bicimId ? hedefAd(h) : h.oran === "serbest" ? `${gg.w}×${gg.h}` : h.oran === "orijinal" ? "uzaklaştır" : h.oran;
      for (let i = 0; i < (video ? 1 : adet); i++) {
        const r = video
          ? uretimBaslat({
            baslik: `Çerçevele · ${etiket}`, tur: "video", model: VIDEO_MODEL, prompt: istem.trim() || "Videoyu genişlet", kredi: birimKredi(), arac: ARAC, projeId: aktifProjeId ?? undefined,
            meta: { islem: "genislet", videoUrl: kaynak.url, oran: h.oran, kanvas: { w: gg.w, h: gg.h, x: gg.x, y: gg.y, gw: gg.gw, gh: gg.gh }, hamIstem: istem.trim() || "Videoyu genişlet", ...(istem.trim() ? {} : { istemsiz: true }), ...(kaynak.uretimId ? { kaynakId: kaynak.uretimId } : {}) },
          })
          : uretimBaslat({
            baslik: `Çerçevele · ${etiket}`, tur: "gorsel", model: mt.ad, prompt: istem.trim() || "Görseli genişlet", kredi: birimKredi(), arac: ARAC, projeId: aktifProjeId ?? undefined,
            meta: { islem: "genislet", gorselUrl: kaynak.url, oran: h.oran === "serbest" || h.oran === "orijinal" ? enYakinOran(gg.w / gg.h) : h.oran, kanvas: { w: gg.w, h: gg.h, x: gg.x, y: gg.y, gw: gg.gw, gh: gg.gh }, motor,
              hamIstem: istem.trim() || "Görseli genişlet", ...(istem.trim() ? {} : { istemsiz: true }), ...(negatif.trim() && motor === "bria" ? { negatif: negatif.trim() } : {}), ...(kaynak.uretimId ? { kaynakId: kaynak.uretimId } : {}) },
          });
        if (!r.ok) { if (!n) uretimHataToast(r); break dis; }
        n++;
      }
    }
    setGonderiliyor(false);
    if (n) { setSeciliSonuc(null); setOnizlemeSecili(null); toast.success(n > 1 ? `${n} sonuç üretiliyor` : "Çerçeveleniyor", { description: `${video ? VIDEO_MODEL : mt.ad} · ${toplamKredi ? `${krediYaz(toplamKredi)} kredi.` : "Kredi düşmez."}` }); }
  };

  /** Sağlayıcı yokken: tarayıcıda bulanık kenar dolgusu (AI değil, kredi düşmez). Video için canlı CSS önizlemesi. */
  const yerelOnizle = async () => {
    if (!kaynak) return;
    if (eksik && !kilit) return void toast.error("Önizleme yapılamadı", { description: `${eksik}.` });
    setOnizleniyor(true);
    const yeni: Gorunum[] = [];
    if (video) {
      for (const h of hedefler) { const gg = geoHedef(h)!; yeni.push({ id: `oz-${h.anahtar}-${Date.now()}`, url: kaynak.goster, video: true, kanvas: gg, etiket: h.bicimId ? hedefAd(h) : h.oran, yerel: true }); }
    } else {
      const i = await new Promise<HTMLImageElement>((coz, red) => { const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => coz(im); im.onerror = red; im.src = kaynak.goster; }).catch(() => null);
      if (!i) { setOnizleniyor(false); return void toast.error("Görsel okunamadı", { description: "Görsel bozuk olabilir ya da erişime kapalı. Başka bir görselle dene." }); }
      for (const h of hedefler) {
        const gg = geoHedef(h)!;
        const k = Math.min(1, 2048 / Math.max(gg.w, gg.h));
        const c = document.createElement("canvas"); c.width = Math.round(gg.w * k); c.height = Math.round(gg.h * k);
        const x = c.getContext("2d")!;
        const s = Math.max(c.width / i.naturalWidth, c.height / i.naturalHeight);
        x.filter = "blur(36px) saturate(1.1)"; x.drawImage(i, (c.width - i.naturalWidth * s) / 2, (c.height - i.naturalHeight * s) / 2, i.naturalWidth * s, i.naturalHeight * s);
        x.filter = "none"; x.fillStyle = "rgba(0,0,0,0.12)"; x.fillRect(0, 0, c.width, c.height);
        x.drawImage(i, gg.x * k, gg.y * k, gg.gw * k, gg.gh * k);
        yeni.push({ id: `oz-${h.anahtar}-${Date.now()}`, url: c.toDataURL("image/jpeg", 0.9), kanvas: gg, etiket: h.bicimId ? hedefAd(h) : h.oran === "serbest" ? oranYaz(gg.w, gg.h) : h.oran === "orijinal" ? "Uzaklaştır" : h.oran, yerel: true });
      }
    }
    // Kısa bir bekleme: tek karede atlayan sonuç yerine geçiş görünsün.
    await new Promise((r) => setTimeout(r, 450));
    setOnizlemeler((l) => [...yeni, ...l].slice(0, 12));
    setOnizlemeSecili(yeni[0].id); setSeciliSonuc(null); setOnizleniyor(false); setGorunumMod("sonuc");
  };
  const uret = () => {
    if (Date.now() - uretKilit.current < 800) return;
    uretKilit.current = Date.now();
    if (demo) void yerelOnizle(); else calistir();
  };

  /* ── Görünüm: düzenleme çerçevesi mi, sonuç mu ── */
  const sonucMedya = secili && secili.durum === "tamam" ? (secili.tur === "video" ? secili.videoUrl : uretimGorseli(secili)) : null;
  const gorunum: Gorunum | null = sonucMedya && secili
    ? { id: secili.id, url: sonucMedya, video: secili.tur === "video", kanvas: (secili.meta?.kanvas as Kanvas | undefined) ?? (g ?? { w: 1, h: 1, x: 0, y: 0, gw: 1, gh: 1 }), etiket: String(secili.meta?.oran ?? ""), demo: secili.gercek === false }
    : onizlemeler.find((o) => o.id === onizlemeSecili) ?? null;
  const duzenleme = !gorunum;
  const cerceveyeDon = () => { setSeciliSonuc(null); setOnizlemeSecili(null); setGorunumMod("sonuc"); };

  // Konum ve kenar sürükleme
  const kv = gorunum?.kanvas ?? g;
  const ds = kv ? Math.max(0.01, Math.min((alan.w - 24) / kv.w, (alan.h - 44) / kv.h)) : 1;
  const sur = (e: React.PointerEvent) => {
    if (!konumVar || !g || !duzenleme) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    surukle.current = { x: e.clientX, y: e.clientY, kx: konum.x, ky: konum.y };
    setRehber({ x: false, y: false });
  };
  const tasi = (e: React.PointerEvent) => {
    const s = surukle.current; if (!s || !g) return;
    const bosX = (g.w - g.gw) * ds, bosY = (g.h - g.gh) * ds;
    let x = bosX > 1 ? Math.max(0, Math.min(1, s.kx + (e.clientX - s.x) / bosX)) : 0.5;
    let y = bosY > 1 ? Math.max(0, Math.min(1, s.ky + (e.clientY - s.y) / bosY)) : 0.5;
    // Ortaya yapışma: 6 px içinde merkez çizgisi belirir
    const yx = bosX > 1 && Math.abs(x - 0.5) * bosX < 6, yy = bosY > 1 && Math.abs(y - 0.5) * bosY < 6;
    if (yx) x = 0.5; if (yy) y = 0.5;
    setRehber({ x: yx, y: yy });
    setKonum({ x, y });
  };
  const birak = () => { surukle.current = null; setRehber(null); };

  /** Kenar payları (çıktı pikseli) → serbest tuval; görsel yerinde kalır. Sürükleme ve kenar kutuları ortak kullanır. */
  const kenarlariUygula = (o: Kanvas, L: number, R: number, T: number, B: number) => {
    if (!kaynak) return;
    L = Math.max(0, L); R = Math.max(0, R); T = Math.max(0, T); B = Math.max(0, B);
    const W = Math.min(MAKS_KENAR, Math.round(o.gw + L + R)), H = Math.min(MAKS_KENAR, Math.round(o.gh + T + B));
    setOran("serbest"); setSerbest({ w: W, h: H }); setBicimId(null);
    if (konumVar) {
      const z = Math.max(1, (kaynak.w * Math.min(W / kaynak.w, H / kaynak.h)) / o.gw);
      setKonumlar((m) => ({ ...m, serbest: { x: W - o.gw > 1 ? Math.min(1, L / (W - o.gw)) : 0.5, y: H - o.gh > 1 ? Math.min(1, T / (H - o.gh)) : 0.5, z } }));
    }
  };
  const kenarBas = (yon: Kose) => (e: React.PointerEvent) => {
    if (!g) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    kenar.current = { yon, x: e.clientX, y: e.clientY, ds, g: { w: g.w, h: g.h, x: g.x, y: g.y, gw: g.gw, gh: g.gh } };
    setKenarAktif(true);
  };
  const kenarTasi = (e: React.PointerEvent) => {
    const k = kenar.current; if (!k) return;
    const dx = (e.clientX - k.x) / k.ds, dy = (e.clientY - k.y) / k.ds;
    const es = !konumVar || e.altKey;
    const { g: o, yon } = k;
    let L = o.x, R = o.w - o.x - o.gw, T = o.y, B = o.h - o.y - o.gh;
    if (yon.includes("e")) { R += dx; if (es) L += dx; }
    if (yon.includes("w")) { L -= dx; if (es) R -= dx; }
    if (yon.includes("s")) { B += dy; if (es) T += dy; }
    if (yon.includes("n")) { T -= dy; if (es) B -= dy; }
    kenarlariUygula(o, L, R, T, B);
  };
  const kenarBirak = () => { kenar.current = null; setKenarAktif(false); };

  // Klavye: kısayol tek yerde ve yalnız keydown'da dinlenir (keyup'ta da çalışırsa iş iki kez başlar).
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      const h = e.target as HTMLElement | null;
      const yazi = !!h && (/^(INPUT|TEXTAREA|SELECT)$/.test(h.tagName) || h.isContentEditable);
      if (e.key === "\\" && !yazi && kaynak) { e.preventDefault(); setOnceGoster(e.type === "keydown"); return; }
      if (e.type !== "keydown") return;
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && kaynak) { e.preventDefault(); if (!e.repeat) uret(); return; }
      if (yazi || !kaynak) return;
      if (e.key === "Escape" && !duzenleme) { cerceveyeDon(); return; }
      if (e.key === "?") { setKisayolAcik((v) => !v); return; }
      if (e.key.toLowerCase() === "g") { setIzgara((v) => !v); return; }
      if (!duzenleme) { if (e.key.toLowerCase() === "c") setGorunumMod((m) => (m === "sonuc" ? "karsilastir" : "sonuc")); return; }
      const adim = e.shiftKey ? 0.1 : 0.02;
      if (konumVar && e.key.startsWith("Arrow")) {
        e.preventDefault();
        setKonum({
          x: Math.max(0, Math.min(1, konum.x + (e.key === "ArrowLeft" ? -adim : e.key === "ArrowRight" ? adim : 0))),
          y: Math.max(0, Math.min(1, konum.y + (e.key === "ArrowUp" ? -adim : e.key === "ArrowDown" ? adim : 0))),
        });
      } else if (e.key.toLowerCase() === "r") konumYaz(() => varsayilanKonum(oran));
      else if (konumVar && (e.key === "+" || e.key === "=")) setZoom((z) => Math.min(Math.max(2.5, z), +(z + 0.1).toFixed(2)));
      else if (konumVar && (e.key === "-" || e.key === "_")) setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)));
    };
    window.addEventListener("keydown", f); window.addEventListener("keyup", f);
    return () => { window.removeEventListener("keydown", f); window.removeEventListener("keyup", f); };
  });

  // Alttaki komut kutusunun yüksekliği → tuval altta o kadar pay bırakır.
  const komutRef = useRef<HTMLDivElement>(null);
  const [komutH, setKomutH] = useState(132);
  useEffect(() => {
    const el = komutRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setKomutH(el.offsetHeight)); ro.observe(el);
    return () => ro.disconnect();
  }, [kaynak, masaustu]);

  /* ═════════════ Seçiciler ═════════════ */

  /** Pakette hedefi ekler/çıkarır ve onu tuvalde etkin yapar. */
  const paketDegistir = (h: Hedef) => {
    const var_ = paket.some((x) => x.anahtar === h.anahtar);
    if (!var_ && paket.length >= PAKET_MAX) return void toast.error("Paket dolu", { description: `Bir pakette en fazla ${PAKET_MAX} hedef olabilir. Önce birini çıkar.` });
    const yeni = var_ ? paket.filter((x) => x.anahtar !== h.anahtar) : [...paket, h];
    setPaket(yeni);
    const etkin = var_ ? (anahtar === h.anahtar ? yeni[0] : null) : h;
    if (etkin) hedefEtkin(etkin);
  };
  const hedefEtkin = (h: Hedef) => { setOran(h.oran); if (h.serbest) setSerbest(h.serbest); setBicimId(h.bicimId ?? null); };
  const oranSec = (o: string) => {
    if (paketMod) return paketDegistir({ anahtar: o, oran: o });
    setOran(o); setBicimId(null);
  };
  const bicimSec = (p: Bicim) => {
    const h: Hedef = { anahtar: `p:${p.id}`, oran: "serbest", serbest: { w: p.w, h: p.h }, bicimId: p.id };
    if (paketMod) return paketDegistir(h);
    hedefEtkin(h);
  };
  const paketAc = (ac: boolean) => {
    setPaketMod(ac);
    if (ac && paket.length < 2) {
      const l = [...SOSYAL_PAKET, "3:4"].filter((o) => (!video || LUMA_ORAN.includes(o)) && (!kaynak || Math.abs(sayiOran(o) - kaynak.w / kaynak.h) > 0.02)).slice(0, 4).map((o) => ({ anahtar: o, oran: o }));
      setPaket(l); hedefEtkin(l[0]);
    } else if (ac && paket[0]) hedefEtkin(paket[0]);
  };
  const cevir = () => {
    if (oran === "serbest") { setSerbest((s) => ({ w: s.h, h: s.w })); setBicimId(null); return; }
    const [a, c] = oran.split(":");
    const t = `${c}:${a}`;
    if (ORANLAR.includes(t) && oranDestekli(t)) setOran(t);
  };
  const cevrilebilir = oran === "serbest" ? !video && motor !== "luma" : oran !== "orijinal" && oran !== "1:1" && ORANLAR.includes(oran.split(":").reverse().join(":")) && oranDestekli(oran.split(":").reverse().join(":"));
  /** Kaynağın bu hedefte nasıl duracağı (önizleme kutuları için). */
  const hedefGeo = (o: string, s = serbest) => kaynak ? geometri(kaynak.w, kaynak.h, o, s, 1, 0.5, 0.5) : geometri(1, 1, o, s, 1, 0.5, 0.5);
  const onizSrc = kaynak?.tur === "gorsel" ? kaynak.goster : (kaynak?.poster ?? ORNEKLER.find((o) => o.gorsel === kaynak?.goster)?.poster ?? "/gercek/galeri/manzara1.webp");
  const paketteMi = (a: string) => paket.some((h) => h.anahtar === a);
  const secimRozeti = (sec: boolean, sira?: number) => sec && (
    <motion.span initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[10.5px] font-bold tabular-nums text-black">
      {sira ? sira : <Check className="h-2.5 w-2.5" strokeWidth={3.5} />}
    </motion.span>
  );

  const oranIzgara = (sutun = "grid-cols-5") => (
    <div className={cn("grid gap-1.5", sutun)}>
      {ORANLAR.map((o) => {
        const kapali = !oranDestekli(o);
        const sec = paketMod ? paketteMi(o) : oran === o;
        const sira = paketMod ? paket.findIndex((h) => h.anahtar === o) + 1 : 0;
        return (
          <button key={o} onClick={() => !kapali && oranSec(o)} aria-pressed={sec} disabled={kapali} title={kapali ? (video ? "Video bu oranda genişletilemez" : "Luma bu oranı desteklemez") : undefined}
            className={cn("group relative flex flex-col items-center gap-1.5 rounded-[14px] p-1.5 pb-2 outline outline-1 -outline-offset-1 transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-25", sec ? SECILI : SECILI_DEGIL)}>
            <KadrajOnizleme src={onizSrc} g={hedefGeo(o)} className="h-[72px] w-full" />
            <span className="flex flex-col items-center leading-tight">
              <span className="text-[13px] font-semibold tabular-nums text-metin">{o}</span>
              <span className="text-[11px] text-metin-2">{ORAN_AD[o]}</span>
            </span>
            {secimRozeti(sec, sira || undefined)}
          </button>
        );
      })}
    </div>
  );
  const ozelOranlar = !paketMod && !video && (
    <div className="grid grid-cols-2 gap-1.5">
      {([["orijinal", "Uzaklaştır", "Aynı oran, daha geniş kadraj", ZoomOut], ["serbest", "Serbest boyut", "Genişlik ve yüksekliği sen gir", Expand]] as const).map(([id, ad, alt, I]) => {
        const kapali = motor === "luma";
        const sec = oran === id && !(id === "serbest" && platform);
        return (
          <button key={id} onClick={() => { if (kapali) return; setBicimId(null); setOran(id); }} aria-pressed={sec} disabled={kapali} title={kapali ? "Luma bu modu desteklemez" : undefined}
            className={cn("flex items-center gap-3 rounded-[14px] p-2 text-left outline outline-1 -outline-offset-1 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-25", sec ? SECILI : SECILI_DEGIL)}>
            <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", sec ? "bg-white text-black" : "bg-white/[0.07] text-metin-2")}><I className="h-4 w-4" /></span>
            <span className="min-w-0 leading-tight"><span className="block text-[13px] font-semibold text-metin">{ad}</span><span className="mt-0.5 block truncate text-[11.5px] text-metin-2">{alt}</span></span>
          </button>
        );
      })}
    </div>
  );
  const serbestGirdi = !paketMod && oran === "serbest" && !platform && (
    <div className="flex items-center gap-1.5">
      {(["w", "h"] as const).map((k) => (
        <label key={k} className="flex h-10 flex-1 items-center gap-2 rounded-[12px] bg-white/[0.05] px-3 outline outline-1 -outline-offset-1 outline-white/[0.07] focus-within:outline-white/50">
          <span className="text-[12px] font-medium text-metin-2">{k === "w" ? "Genişlik" : "Yükseklik"}</span>
          <input inputMode="numeric" value={serbest[k] || ""} aria-label={k === "w" ? "Genişlik" : "Yükseklik"}
            onChange={(e) => {
              const v = Math.min(MAKS_KENAR, Number(e.target.value.replace(/\D/g, "")) || 0);
              setSerbest((s) => {
                if (!kilitli || !s.w || !s.h || !v) return { ...s, [k]: v };
                const r = s.w / s.h;
                return k === "w" ? { w: v, h: Math.min(MAKS_KENAR, Math.round(v / r)) } : { h: v, w: Math.min(MAKS_KENAR, Math.round(v * r)) };
              });
            }}
            className="min-w-0 flex-1 bg-transparent text-right text-[13.5px] font-medium tabular-nums text-metin outline-none" />
          <span className="text-[12px] text-metin-2">px</span>
        </label>
      ))}
      <Tooltip label={kilitli ? "Oran bağlı: biri değişince diğeri de değişir" : "Oran serbest"} side="top">
        <button onClick={() => setKilitli((v) => !v)} aria-pressed={kilitli} aria-label="En-boy oranını bağla"
          className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] transition active:scale-95", kilitli ? "bg-white text-black" : "bg-white/[0.06] text-metin-2 hover:text-metin")}>
          {kilitli ? <Link2 className="h-4 w-4" /> : <Unlink2 className="h-4 w-4" />}
        </button>
      </Tooltip>
    </div>
  );
  const bicimKarti = (p: Bicim, genis?: string) => {
    const a = paketMod ? paketteMi(`p:${p.id}`) : platform?.id === p.id;
    const sira = paketMod ? paket.findIndex((h) => h.anahtar === `p:${p.id}`) + 1 : 0;
    const kapali = motor === "luma";
    const m = MARKALAR.find((x) => x.id === p.marka)!;
    return (
      <button key={p.id} onClick={() => !kapali && bicimSec(p)} aria-pressed={a} disabled={kapali} title={kapali ? "Luma serbest boyutu desteklemez" : undefined}
        className={cn("relative flex flex-col gap-2 rounded-[14px] p-1.5 pb-2 text-left outline outline-1 -outline-offset-1 transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-25", genis, a ? SECILI : SECILI_DEGIL)}>
        <KadrajOnizleme src={onizSrc} g={hedefGeo("serbest", { w: p.w, h: p.h })} className="h-[86px] w-full" />
        <span className="flex items-center gap-2 px-1">
          <MarkaLogo m={m} boyut={20} ikon={p.ikon} />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[12.5px] font-semibold text-metin">{p.ad}</span>
            <span className="block text-[11px] tabular-nums text-metin-2">{p.w}×{p.h}</span>
          </span>
        </span>
        {secimRozeti(a, sira || undefined)}
      </button>
    );
  };
  const platformPaneli = (
    <div className="flex gap-3">
      <div className="isolate flex w-[138px] shrink-0 flex-col gap-0.5" role="tablist" aria-label="Platform">
        {MARKALAR.map((m) => {
          const sec = markaSec === m.id;
          const secili = paketMod ? paket.some((h) => h.bicimId && BICIMLER.find((p) => p.id === h.bicimId)?.marka === m.id) : platform?.marka === m.id;
          return (
            <button key={m.id} role="tab" aria-selected={sec} onClick={() => setMarkaSec(m.id)}
              className={cn("relative flex h-10 items-center gap-2.5 rounded-[11px] px-1.5 text-left text-[13px] font-medium transition-colors", sec ? "text-metin" : "text-metin-2 hover:text-metin")}>
              {sec && <motion.span layoutId="rfMarka" className="absolute inset-0 -z-10 rounded-[11px] bg-white/[0.09]" transition={{ type: "spring", stiffness: 480, damping: 38 }} />}
              <MarkaLogo m={m} boyut={26} />
              <span className="flex-1 truncate">{m.ad}</span>
              {secili && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-white" />}
            </button>
          );
        })}
      </div>
      <div className="grid min-w-0 flex-1 auto-rows-min grid-cols-2 gap-1.5">
        {BICIMLER.filter((p) => p.marka === markaSec).map((p) => bicimKarti(p))}
      </div>
    </div>
  );
  /** Kenar başına genişletme: üst/alt/sol/sağ piksel. */
  const kenarPaneli = g && (() => {
    const L = g.x, R = g.w - g.x - g.gw, T = g.y, B = g.h - g.y - g.gh;
    const deg = { T, B, L, R };
    const yaz = (k: keyof typeof deg, v: number) => { const d = { ...deg, [k]: v }; kenarlariUygula(g, d.L, d.R, d.T, d.B); };
    return (
      <div className="space-y-2.5">
        <div className="relative mx-auto flex h-[170px] w-full items-center justify-center rounded-[14px] bg-white/[0.03] outline outline-1 -outline-offset-1 outline-white/[0.06]">
          <KadrajOnizleme src={onizSrc} g={g} className="h-[150px] w-full bg-transparent" />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {([["T", "Üst"], ["B", "Alt"], ["L", "Sol"], ["R", "Sağ"]] as const).map(([k, ad]) => (
            <label key={k} className="flex h-10 items-center gap-2 rounded-[12px] bg-white/[0.05] px-3 outline outline-1 -outline-offset-1 outline-white/[0.07] focus-within:outline-white/50">
              <span className="w-8 text-[12px] font-medium text-metin-2">{ad}</span>
              <input inputMode="numeric" value={Math.round(deg[k])} aria-label={`${ad} kenar`} disabled={!konumVar}
                onChange={(e) => yaz(k, Math.min(MAKS_KENAR, Number(e.target.value.replace(/\D/g, "")) || 0))}
                className="min-w-0 flex-1 bg-transparent text-right text-[13.5px] font-medium tabular-nums text-metin outline-none disabled:opacity-40" />
              <span className="text-[12px] text-metin-2">px</span>
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[128, 256, 512].map((n) => (
            <button key={n} disabled={!konumVar} onClick={() => kenarlariUygula(g, L + n, R + n, T + n, B + n)} className="h-8 rounded-full bg-white/[0.07] px-3 text-[12.5px] font-medium tabular-nums text-metin transition hover:bg-white/[0.12] active:scale-95 disabled:opacity-35">Her yana +{n}</button>
          ))}
        </div>
        {!konumVar && <p className="rounded-full bg-amber-300/10 px-3 py-1.5 text-[12px] text-amber-100 ring-1 ring-inset ring-amber-300/20">Kenar payı Bria ve Nano Banana ile ayarlanır</p>}
      </div>
    );
  })();
  const sekmeler: [typeof oranSekme, string][] = video ? [["oran", "Oran"]] : paketMod ? [["oran", "Oran"], ["platform", "Platform"]] : [["oran", "Oran"], ["platform", "Platform"], ["kenar", "Kenarlar"]];
  const oranPaneli = (
    <div className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/[0.07] px-3 py-2.5">
        <div role="tablist" aria-label="Hedef" className="isolate flex items-center gap-0.5 rounded-full bg-white/[0.06] p-[3px]">
          {sekmeler.map(([id, ad]) => (
            <button key={id} role="tab" aria-selected={oranSekme === id} onClick={() => setOranSekme(id)}
              className={cn("relative h-8 rounded-full px-3.5 text-[13px] font-medium transition-colors", oranSekme === id ? "text-black" : "text-metin-2 hover:text-metin")}>
              {oranSekme === id && <motion.span layoutId="rfSekme" className="absolute inset-0 -z-10 rounded-full bg-white" transition={{ type: "spring", stiffness: 480, damping: 36 }} />}
              {ad}
            </button>
          ))}
        </div>
        <span className="flex-1" />
        <button onClick={() => paketAc(!paketMod)} aria-pressed={paketMod} className={cn("flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition active:scale-95", paketMod ? "bg-white text-black" : "bg-white/[0.07] text-metin hover:bg-white/[0.12]")}>
          <Layers className="h-3.5 w-3.5" />Sosyal paket{paketMod && <span className="rounded-full bg-black/10 px-1.5 text-[11px] tabular-nums">{paket.length}</span>}
        </button>
      </div>
      <div className="p-3">
        {paketMod && (
          <p className="mb-2.5 flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-[12px] text-metin-2"><Layers className="h-3.5 w-3.5" />Seçtiğin her oran için ayrı sonuç üretilir; konumu her biri için ayrı ayarlayabilirsin</p>
        )}
        <motion.div key={oranSekme + String(paketMod)} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>
          {oranSekme === "platform" && !video ? platformPaneli : oranSekme === "kenar" && !video && !paketMod ? kenarPaneli : (
            <div className="space-y-1.5">
              {oranIzgara()}
              {ozelOranlar}
              {serbestGirdi && <div className="pt-1">{serbestGirdi}</div>}
            </div>
          )}
        </motion.div>
      </div>
      {(motor === "luma" || video) && (
        <p className="mx-3 mb-3 rounded-full bg-amber-300/10 px-3 py-1.5 text-[12px] text-amber-100 ring-1 ring-inset ring-amber-300/20">{video ? "Video 7 sabit orana genişler, görüntü ortada kalır" : "Luma 7 sabit oranla çalışır; platform ve serbest boyut için başka motor seç"}</p>
      )}
    </div>
  );

  const motorSatiri = (m: (typeof MOTORLAR)[number]) => {
    const sec = motor === m.id;
    const bagliDegil = b.hazir && !demo && (m.id === "yaratici" ? !b.herhangi : !b.fal);
    return (
      <button key={m.id} onClick={() => { setMotor(m.id); setMotorAcik(false); }} aria-pressed={sec}
        className={cn("relative flex w-full items-center gap-3 rounded-[12px] p-2 text-left transition-colors hover:bg-white/[0.05]")}>
        {sec && <motion.span layoutId="rfMotor" className="absolute inset-0 rounded-[12px] bg-white/[0.08]" transition={{ type: "spring", stiffness: 480, damping: 38 }} />}
        <span className="relative"><ModelLogoDaire ad={m.logo} boyut={38} /></span>
        <span className="relative min-w-0 flex-1">
          <span className="block text-[13.5px] font-medium text-metin">{m.ad}</span>
          <span className="block truncate text-[12px] text-metin-2">{m.not}</span>
          <span className="mt-1 flex flex-wrap gap-1">{m.etiket.map((x) => <span key={x} className="rounded-full bg-white/[0.07] px-1.5 py-px text-[10.5px] font-medium text-metin-2">{x}</span>)}</span>
        </span>
        <span className="relative flex shrink-0 flex-col items-end gap-1">
          {bagliDegil
            ? <span title="Sağlayıcı bağlanınca açılır" className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-metin-2"><span className="h-1.5 w-1.5 rounded-full bg-white/30" />Bağlı değil</span>
            : !demo && <KrediHap deger={m.kredi} secili={sec} />}
          {sec && <Check className="h-4 w-4 text-white" />}
        </span>
      </button>
    );
  };

  /* ═════════════ Komut kutusu ═════════════ */
  const CIP = "flex h-9 shrink-0 items-center gap-2 rounded-full bg-white/[0.08] pl-1.5 pr-3 text-[13px] font-medium text-metin transition hover:bg-white/[0.13] active:scale-[0.98]";
  const istemKapali = !video && motor === "ideogram";
  const durumHap = !kaynak ? null
    : eksik && kaynak.durum === "hazir" && !(demo && kilit) ? { metin: eksik, uyari: true }
    : null;
  const oranCipEtiket = paketMod ? `${paket.length} hedef` : platformAd ?? oranEtiket;

  const komut = (
    <div className={cn("w-full rounded-[22px] p-2", YUZEY)}>
      <div className="flex items-start gap-2.5 px-2 pt-1">
        <Wand2 className={cn("mt-[7px] h-4 w-4 shrink-0", istemKapali ? "text-metin-3/50" : "text-metin-2")} />
        <textarea value={istem} onChange={(e) => setIstem(e.target.value.slice(0, 400))} rows={1} aria-label="Genişletme istemi" spellCheck={false} disabled={istemKapali}
          onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = `${Math.min(t.scrollHeight, 96)}px`; }}
          placeholder={istemKapali ? "Ideogram Reframe istem almaz; sahneyi kendisi tamamlar" : video ? "Yeni alanda ne olsun? İsteğe bağlı" : "Yeni alanda ne olsun? İsteğe bağlı"}
          className="block min-h-[30px] w-full resize-none bg-transparent py-1 text-[14px] leading-relaxed text-metin outline-none placeholder:text-metin-2 disabled:cursor-not-allowed disabled:placeholder:text-metin-3" />
        {istem && !istemKapali && <span className="mt-1.5 shrink-0 rounded-full bg-white/[0.07] px-1.5 text-[11px] tabular-nums text-metin-2">{istem.length}/400</span>}
      </div>
      <AnimatePresence initial={false}>
        {!video && motor === "bria" && olmasinAcik && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <label className="mx-1 mt-1.5 flex items-center gap-2.5 rounded-[12px] bg-white/[0.05] px-3 py-2 outline outline-1 -outline-offset-1 outline-white/[0.06] focus-within:outline-white/40">
              <Ban className="h-4 w-4 text-metin-2" />
              <input value={negatif} onChange={(e) => setNegatif(e.target.value.slice(0, 200))} placeholder="Yeni alanda olmasın: yazı, insan, çerçeve, filigran" aria-label="Kaçınılacaklar" autoFocus
                className="min-w-0 flex-1 bg-transparent text-[13.5px] text-metin outline-none placeholder:text-metin-2" />
              {negatif && <button onClick={() => setNegatif("")} aria-label="Temizle" className="text-metin-2 hover:text-metin"><X className="h-3.5 w-3.5" /></button>}
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-2 flex items-center gap-1.5 max-sm:flex-wrap">
        {masaustu && (
          <div className="relative">
            <button onClick={() => setOranAcik((v) => !v)} aria-expanded={oranAcik} aria-label="Hedef oran" className={cn(CIP, oranAcik && "bg-white/[0.13]")}>
              {paketMod ? <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black"><Layers className="h-3.5 w-3.5" /></span>
                : platform && platformMarka ? <MarkaLogo m={platformMarka} boyut={24} ikon={platform.ikon} />
                : <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.1]">{oran === "orijinal" ? <ZoomOut className="h-3.5 w-3.5" /> : <OranSekli oran={g && oran === "serbest" ? `${g.w}:${g.h}` : oran} boyut={14} />}</span>}
              <span className="max-w-[170px] truncate">{oranCipEtiket}</span>
              {g && !paketMod && <span className={cn("tabular-nums text-metin-2", platform && "hidden xl:inline")}>{g.w}×{g.h}</span>}
              <ChevronDown className={cn("-mr-1 h-3.5 w-3.5 text-metin-2 transition-transform", oranAcik && "rotate-180")} />
            </button>
            <Yuzen acik={oranAcik} onKapat={() => setOranAcik(false)} yerlesim="ust-sol" bosluk={10} etiket="Hedef oran" className={cn("max-h-[74vh] w-[560px] overflow-y-auto [scrollbar-width:thin]", POP)}>
              {oranPaneli}
            </Yuzen>
          </div>
        )}
        {masaustu && cevrilebilir && !paketMod && (
          <Tooltip label="Yönü çevir: dikey ve yatay" side="top">
            <button onClick={cevir} aria-label="Yönü çevir" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-metin transition hover:bg-white/[0.13] active:scale-90"><ArrowLeftRight className="h-4 w-4" /></button>
          </Tooltip>
        )}
        {video ? (
          <span className={cn(CIP, "pointer-events-none")}><ModelLogoDaire ad="Luma" boyut={24} />{VIDEO_MODEL}</span>
        ) : (
          <div className="relative">
            <button onClick={() => setMotorAcik((v) => !v)} aria-expanded={motorAcik} aria-label="Motor" className={cn(CIP, motorAcik && "bg-white/[0.13]")}>
              <ModelLogoDaire ad={mt.logo} boyut={24} />
              <span className="max-w-[160px] truncate">{mt.ad}</span>
              <ChevronDown className={cn("-mr-1 h-3.5 w-3.5 text-metin-2 transition-transform", motorAcik && "rotate-180")} />
            </button>
            <Yuzen acik={motorAcik} onKapat={() => setMotorAcik(false)} yerlesim="ust-sol" bosluk={10} etiket="Motor" className={cn("isolate w-[min(400px,calc(100vw-24px))] overflow-hidden", POP)}>
              <div className="flex items-center gap-2 border-b border-white/[0.07] px-3.5 py-2.5"><Sparkles className="h-4 w-4 text-metin-2" /><span className="text-[13.5px] font-semibold text-metin">Genişletme motoru</span></div>
              <div className="p-1.5">{MOTORLAR.map(motorSatiri)}</div>
            </Yuzen>
          </div>
        )}
        {!video && motor === "bria" && (
          <button onClick={() => setOlmasinAcik((v) => !v)} aria-pressed={olmasinAcik || !!negatif} title="Yeni alanda olmasını istemediklerin"
            className={cn(CIP, "pl-3", (olmasinAcik || negatif) && "bg-white/[0.14]")}>
            <Ban className="h-3.5 w-3.5 text-metin-2" /><span className="max-sm:hidden">Olmasın</span>
            {negatif && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
          </button>
        )}
        {!video && (
          <div role="radiogroup" aria-label="Sonuç sayısı" className="isolate flex h-9 shrink-0 items-center gap-0.5 rounded-full bg-white/[0.08] p-[3px]">
            <Images className="mx-1.5 h-3.5 w-3.5 text-metin-2 max-sm:hidden" />
            {[1, 2, 3, 4].map((n) => (
              <button key={n} role="radio" aria-checked={adet === n} aria-label={`${n} sonuç`} onClick={() => setAdet(n)} disabled={demo && n > 1} title={demo && n > 1 ? "Tarayıcı önizlemesi tek sonuç verir" : undefined}
                className={cn("relative h-[30px] w-[30px] rounded-full text-[13px] font-semibold tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-30", adet === n ? "text-black" : "text-metin-2 hover:text-metin")}>
                {adet === n && <motion.span layoutId="rfAdet" className="absolute inset-0 -z-10 rounded-full bg-white" transition={{ type: "spring", stiffness: 480, damping: 36 }} />}{n}
              </button>
            ))}
          </div>
        )}
        <span className="flex-1 max-sm:hidden" />
        <button onClick={() => (kaynak ? uret() : dosyaRef.current?.click())} disabled={gonderiliyor || onizleniyor} title={kaynak ? eksik ?? "Ctrl+Enter" : undefined}
          className={cn("flex h-10 shrink-0 items-center gap-2 rounded-full bg-white pl-4 pr-1.5 text-[14px] font-semibold text-black transition active:scale-95 disabled:opacity-70 max-sm:h-11 max-sm:w-full max-sm:justify-center", kaynak && eksik && !(demo && kilit) && "opacity-55")}>
          {gonderiliyor || onizleniyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crop className="h-4 w-4" strokeWidth={2.4} />}
          {!kaynak ? "Dosya seç" : demo ? "Önizle" : "Çerçevele"}
          {kaynak && (demo
            ? <span className="rounded-full bg-black/10 px-2.5 py-1 text-[12px] leading-none">Ücretsiz</span>
            : !kilit && toplamKredi > 0 ? <motion.span key={toplamKredi} initial={{ scale: 0.85 }} animate={{ scale: 1 }} className="flex items-center gap-1 rounded-full bg-black/10 px-2.5 py-1 text-[12px] leading-none tabular-nums"><KrediYildiz className="h-3 w-3" />{krediYaz(toplamKredi)}</motion.span> : <span className="w-1" />)}
        </button>
      </div>
      <AnimatePresence initial={false}>
        {durumHap && (
          <motion.div key={durumHap.metin} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="mx-1 mt-2 flex w-fit max-w-full items-center gap-1.5 rounded-full bg-amber-300/10 px-3 py-1 text-[12px] text-amber-100 ring-1 ring-inset ring-amber-300/20">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" /><span className="truncate">{durumHap.metin}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  /* ═════════════ Tuval ═════════════ */
  const isleniyor = surer.length > 0 || onizleniyor;
  const yuzde = surer.length ? Math.round(surer[0].ilerleme ?? 0) : null;
  const dikey = !!kv && kv.w / kv.h < 0.7;
  const kesitRef = useRef<HTMLDivElement>(null);
  const kesitTasi = (cx: number) => { const r = kesitRef.current?.getBoundingClientRect(); if (r) setKesit(Math.max(0, Math.min(100, ((cx - r.left) / r.width) * 100))); };

  const cerceve = kaynak && g && kv ? (() => {
    const W = kv.w * ds, H = kv.h * ds;
    const k = gorunum?.kanvas ?? g;
    const resim = { left: k.x * ds, top: k.y * ds, width: k.gw * ds, height: k.gh * ds };
    const kaynakKatman = (
      <>
        <span className={cn("absolute inset-0 overflow-hidden rounded-[6px]", YENI_ALAN)} />
        <Medya src={kaynak.goster} video={kaynak.tur === "video"} className="absolute rounded-[3px] object-cover" style={resim} />
      </>
    );
    const ustBilgi = gorunum ? `${gorunum.yerel ? "Önizleme" : "Sonuç"} ${gorunum.etiket}`.trim() : paketMod ? hedefAd(aktifHedef) : platformAd ?? oranEtiket;
    return (
      <div className="relative" style={{ width: W, height: H }}>
        <div className="pointer-events-none absolute -top-9 left-1/2 flex w-max -translate-x-1/2 items-center gap-1.5 whitespace-nowrap text-[12px] tabular-nums">
          <span className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-white", YUZEY)}>{ustBilgi}<span className="text-white/45">·</span>{kv.w}×{kv.h}</span>
          {duzenleme && <motion.span key={Math.round(g.yeni * 100)} initial={{ opacity: 0.6, y: -2 }} animate={{ opacity: 1, y: 0 }} className={cn("rounded-full px-2.5 py-1 font-medium text-white", YUZEY)}>%{Math.round(g.yeni * 100)} yeni alan</motion.span>}
          {(gorunum?.yerel || gorunum?.demo) && <span className="rounded-full bg-amber-300/15 px-2.5 py-1 font-medium text-amber-100 ring-1 ring-inset ring-amber-300/30 backdrop-blur">{gorunum.yerel ? "AI değil" : "Genişletme uygulanmadı"}</span>}
        </div>

        {gorunum ? (
          <div ref={kesitRef} className={cn("absolute inset-0 overflow-hidden rounded-[6px] ring-1 ring-white/10", gorunumMod === "karsilastir" && !onceGoster && "cursor-ew-resize touch-none select-none")}
            onPointerDown={(e) => { if (gorunumMod !== "karsilastir") return; (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); kesitTasi(e.clientX); }}
            onPointerMove={(e) => { if (gorunumMod === "karsilastir" && e.buttons) kesitTasi(e.clientX); }}>
            {gorunum.yerel && gorunum.video
              ? <><Medya src={gorunum.url} video className="absolute inset-0 h-full w-full scale-110 object-cover blur-[28px] saturate-[1.1]" /><span className="absolute inset-0 bg-black/10" /><Medya src={gorunum.url} video className="absolute object-cover" style={resim} /></>
              : <Medya src={gorunum.url} video={gorunum.video} className="absolute inset-0 h-full w-full object-cover" />}
            {(onceGoster || gorunumMod === "karsilastir") && (
              <span className="absolute inset-0" style={onceGoster ? undefined : { clipPath: `inset(0 ${100 - kesit}% 0 0)` }}>{kaynakKatman}</span>
            )}
            {gorunumMod === "karsilastir" && !onceGoster && (
              <>
                <span className="pointer-events-none absolute inset-y-0 w-[2px] -translate-x-1/2 bg-white" style={{ left: `${kesit}%` }} />
                <span className="pointer-events-none absolute top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black" style={{ left: `${kesit}%` }}><ArrowLeftRight className="h-4 w-4" /></span>
                <span className="pointer-events-none absolute bottom-2.5 left-2.5 rounded-full bg-black/60 px-2.5 py-1 text-[11.5px] font-medium text-white backdrop-blur">Önce</span>
                <span className="pointer-events-none absolute bottom-2.5 right-2.5 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-semibold text-black">Sonra</span>
              </>
            )}
            {sinirGoster && <span className="pointer-events-none absolute rounded-[3px] border border-dashed border-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]" style={resim} />}
          </div>
        ) : (
          <div className="absolute inset-0 touch-none select-none" onPointerMove={(e) => { tasi(e); kenarTasi(e); }} onPointerUp={() => { birak(); kenarBirak(); }} onPointerCancel={() => { birak(); kenarBirak(); }}>
            <span className={cn("absolute inset-0 overflow-hidden rounded-[6px]", YENI_ALAN)}>
              {isleniyor && <span className="rf-tara absolute inset-0" />}
            </span>
            <span className="pointer-events-none absolute inset-0 rounded-[6px] border border-dashed border-white/45" />
            {(rehber || kenarAktif) && !izgara && <Ucler />}
            {rehber?.x && <span className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-px -translate-x-1/2 bg-white" />}
            {rehber?.y && <span className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-px -translate-y-1/2 bg-white" />}
            <Medya src={kaynak.goster} video={kaynak.tur === "video"} onPointerDown={sur}
              className={cn("absolute rounded-[3px] object-cover shadow-[0_0_0_1px_rgba(255,255,255,.45)] transition-[filter]", konumVar ? "cursor-grab active:cursor-grabbing" : "", isleniyor && "brightness-[0.85]")}
              style={resim} />
            {kaynak.durum === "yukleniyor" && (
              <span className="pointer-events-none absolute flex items-center justify-center" style={resim}><span className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] text-white", YUZEY)}><Loader2 className="h-3.5 w-3.5 animate-spin" />Yükleniyor</span></span>
            )}
            {!isleniyor && masaustu && !paketMod && !video && KOSE.map((y) => {
              const kose = y.length === 2;
              const pos: React.CSSProperties = { left: y.includes("w") ? 0 : y.includes("e") ? "100%" : "50%", top: y.includes("n") ? 0 : y.includes("s") ? "100%" : "50%" };
              const imlec = { n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize", ne: "nesw-resize", sw: "nesw-resize", nw: "nwse-resize", se: "nwse-resize" }[y];
              return (
                <span key={y} onPointerDown={kenarBas(y)} title="Çekerek tuvali genişlet · Alt: iki yana" style={{ ...pos, cursor: imlec }}
                  className="absolute z-20 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                  <span className={cn("block bg-white ring-1 ring-black/20", kose ? "h-3 w-3 rounded-[3px]" : y === "n" || y === "s" ? "h-1.5 w-5 rounded-full" : "h-5 w-1.5 rounded-full")} />
                </span>
              );
            })}
          </div>
        )}
        {izgara && <Ucler />}
        {guvenli !== "yok" && dikey && <GuvenliAlan p={guvenli} />}

        {isleniyor && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
            <div className={cn("pointer-events-auto flex items-center gap-2.5 rounded-full py-2 pl-4 pr-2 text-[13px] font-medium text-white", YUZEY)}>
              <Loader2 className="h-4 w-4 animate-spin" />
              {onizleniyor ? "Tarayıcıda dolduruluyor" : surer[0].durum === "kuyrukta" ? "Sırada" : video ? "Video genişletiliyor" : "Genişletiliyor"}
              {yuzde != null && yuzde > 0 && <span className="tabular-nums text-white/60">%{yuzde}</span>}
              {surer.length > 1 && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] tabular-nums">{surer.length} iş</span>}
              {surer[0] && <button onClick={() => uretimIptal(surer[0].id)} aria-label="İptal" className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"><X className="h-3.5 w-3.5" /></button>}
              {!surer[0] && <span className="w-1.5" />}
            </div>
          </div>
        )}
      </div>
    );
  })() : null;

  const grupDugme = "relative flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition active:scale-95";
  const konumAraclari = duzenleme && konumVar && g && (
    <div className={cn("flex items-center gap-1 rounded-full p-0.5 pl-1.5", YUZEY)}>
      <span className="grid grid-cols-3 gap-[3px] p-1" role="group" aria-label="Hizalama">
        {[0, 0.5, 1].flatMap((y) => [0, 0.5, 1].map((x) => {
          const a = Math.abs(konum.x - x) < 0.02 && Math.abs(konum.y - y) < 0.02;
          return <button key={`${x}${y}`} onClick={() => setKonum({ x, y })} aria-label={`Hizala ${["sol", "orta", "sağ"][x * 2]} ${["üst", "orta", "alt"][y * 2]}`} aria-pressed={a} className={cn("h-[7px] w-[7px] rounded-[2px] transition-colors", a ? "bg-white" : "bg-white/25 hover:bg-white/60")} />;
        }))}
      </span>
      {masaustu && <>
      <span className="mx-1 h-5 w-px bg-white/15" />
      <Tooltip label="Uzaklaştır: görseli küçültüp çevresine daha çok alan üretir" side="bottom">
        <span className="flex items-center gap-2 px-1.5">
          <ZoomOut className="h-3.5 w-3.5 text-white/60" />
          <input type="range" min={1} max={Math.max(2.5, zoom)} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} aria-label="Uzaklaştır"
            className="vy-aralik-beyaz w-24 cursor-pointer appearance-none rounded-full" style={{ ["--d" as string]: `${((zoom - 1) / (Math.max(2.5, zoom) - 1)) * 100}%` }} />
          <span className="w-9 text-right text-[12px] tabular-nums text-white/80">%{Math.round(100 / zoom)}</span>
        </span>
      </Tooltip>
      </>}
      <span className="mx-0.5 h-5 w-px bg-white/15" />
      <Tooltip label="Ortala ve sıfırla · R" side="bottom">
        <button onClick={() => konumYaz(() => varsayilanKonum(oran))} aria-label="Sıfırla" className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white active:scale-90"><RotateCcw className="h-3.5 w-3.5" /></button>
      </Tooltip>
    </div>
  );
  /** Pakette etkin hedefi seçme şeridi (tuvalin üstünde). */
  const paketSeridi = paketMod && paket.length > 0 && duzenleme && (
    <div className={cn("isolate flex items-center gap-0.5 rounded-full p-[3px]", YUZEY)} role="tablist" aria-label="Paketteki hedefler">
      {paket.map((h) => {
        const a = h.anahtar === anahtar;
        const p = h.bicimId ? BICIMLER.find((x) => x.id === h.bicimId) : undefined;
        return (
          <button key={h.anahtar} role="tab" aria-selected={a} onClick={() => hedefEtkin(h)} className={cn("relative flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-medium tabular-nums transition-colors", a ? "text-black" : "text-white/75 hover:text-white")}>
            {a && <motion.span layoutId="rfPaket" className="absolute inset-0 -z-10 rounded-full bg-white" transition={{ type: "spring", stiffness: 480, damping: 36 }} />}
            {p ? <MarkaLogo m={MARKALAR.find((m) => m.id === p.marka)!} boyut={16} ikon={p.ikon} /> : <OranSekli oran={h.oran} boyut={12} />}
            {p ? p.ad : h.oran}
          </button>
        );
      })}
    </div>
  );
  const sonucEylemleri = (u: Uretim | undefined) => u && u.durum === "tamam" && (
    <div className={cn("flex items-center gap-0.5 rounded-full p-0.5", YUZEY)}>
      {([
        ["Sonucu kaynak yap: bir kez daha genişlet", Repeat2, () => { const gg = u.tur === "video" ? u.videoUrl : uretimGorseli(u); if (gg) void urlAc(gg, u.tur === "video" ? "video" : "gorsel", { uretimId: u.id, ad: "Önceki sonuç" }); }],
        ["Büyüt", Maximize2, () => { const gg = u.tur === "video" ? u.videoUrl : uretimGorseli(u); if (gg) router.push(`/panel/upscale?kaynak=${encodeURIComponent(gg)}&uretim=${u.id}`); }],
        ...(u.tur === "video" ? [] : [
          ["Düzenle", Wand2, () => { const gg = uretimGorseli(u); if (gg) router.push(`/panel/inpaint?kaynak=${encodeURIComponent(gg)}&uretim=${u.id}`); }],
          ["Videoya çevir", Clapperboard, () => { const gg = uretimGorseli(u); if (gg) { sessionStorage.setItem("vayra-animate-ref", gg); router.push("/panel/video"); } }],
        ]),
      ] as [string, LucideIcon, () => void][]).map(([ad, I, f]) => (
        <Tooltip key={ad} label={u.gercek === false ? "Örnek sonuçta kullanılamaz" : ad} side="bottom">
          <button onClick={f} disabled={u.gercek === false} aria-label={ad} className="flex h-8 w-8 items-center justify-center rounded-full text-white/75 transition hover:bg-white/10 hover:text-white active:scale-90 disabled:opacity-30"><I className="h-4 w-4" /></button>
        </Tooltip>
      ))}
      <button onClick={() => uretimIndir(u)} className="ml-0.5 flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black transition active:scale-95"><Download className="h-3.5 w-3.5" />İndir</button>
    </div>
  );
  const guvenliMenu = dikey && (
    <div className="relative">
        <button onClick={() => setGuvenliAcik((v) => !v)} title="Platform arayüzünün kapattığı alanlar" aria-expanded={guvenliAcik} className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition active:scale-95", YUZEY, guvenli !== "yok" ? "!bg-white text-black" : "text-white/80 hover:text-white")}>
          <ShieldCheck className="h-4 w-4" /><span className="max-sm:hidden">{guvenli === "yok" ? "Güvenli alan" : GUVENLI[guvenli].ad}</span>
        </button>
      <Yuzen acik={guvenliAcik} onKapat={() => setGuvenliAcik(false)} yerlesim="alt-sag" bosluk={8} etiket="Güvenli alan" className={cn("isolate w-[270px] overflow-hidden", POP)}>
        <div className="flex items-center gap-2 border-b border-white/[0.07] px-3.5 py-2.5"><ShieldCheck className="h-4 w-4 text-metin-2" /><span className="text-[13.5px] font-semibold text-metin">Güvenli alan</span></div>
        <div className="p-1.5">
          {(["yok", "tiktok", "reels", "shorts"] as const).map((p) => {
            const sec = guvenli === p;
            const m = p === "yok" ? null : MARKALAR.find((x) => x.id === GUVENLI[p].marka)!;
            return (
              <button key={p} onClick={() => { setGuvenli(p); setGuvenliAcik(false); }} className="relative flex w-full items-center gap-2.5 rounded-[12px] px-2 py-2 text-left transition-colors hover:bg-white/[0.05]">
                {sec && <motion.span layoutId="rfGuvenli" className="absolute inset-0 rounded-[12px] bg-white/[0.08]" transition={{ type: "spring", stiffness: 480, damping: 38 }} />}
                <span className="relative">{m ? <MarkaLogo m={m} boyut={28} /> : <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-white/[0.08]"><Square className="h-3.5 w-3.5 text-metin-2" /></span>}</span>
                <span className="relative min-w-0 flex-1 leading-tight"><span className="block text-[13px] font-medium text-metin">{p === "yok" ? "Kapalı" : GUVENLI[p].ad}</span><span className="block text-[11.5px] text-metin-2">{p === "yok" ? "Kaplama gösterilmez" : "Yazı ve yüzleri bu alanların dışında tut"}</span></span>
                {sec && <Check className="relative h-4 w-4 text-white" />}
              </button>
            );
          })}
        </div>
      </Yuzen>
    </div>
  );
  const ustAraclar = kaynak && (
    <div className={cn("pointer-events-none z-30 flex flex-wrap items-start justify-between gap-2", masaustu && "absolute inset-x-3 top-3")}>
      <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
        {gorunum ? (
          <>
            <div className={cn("flex items-center gap-0.5 rounded-full p-0.5", YUZEY)}>
              <button onClick={cerceveyeDon} className={cn(grupDugme, "text-white/80 hover:bg-white/10 hover:text-white")}><Crop className="h-3.5 w-3.5" /><span className="max-sm:hidden">Çerçeveye dön</span></button>
            </div>
            <div className={cn("isolate flex items-center gap-0.5 rounded-full p-[3px]", YUZEY)} role="radiogroup" aria-label="Görünüm">
              {([["sonuc", "Sonuç", ImageIcon], ["karsilastir", "Karşılaştır", SplitSquareHorizontal]] as const).map(([id, ad, I]) => (
                <button key={id} role="radio" aria-checked={gorunumMod === id} onClick={() => setGorunumMod(id)} className={cn(grupDugme, gorunumMod === id ? "text-black" : "text-white/75 hover:text-white")}>
                  {gorunumMod === id && <motion.span layoutId="rfGorunum" className="absolute inset-0 -z-10 rounded-full bg-white" transition={{ type: "spring", stiffness: 480, damping: 36 }} />}<I className="h-3.5 w-3.5" />{ad}
                </button>
              ))}
            </div>
              <button onClick={() => setSinirGoster((v) => !v)} title="Kaynağın durduğu yeri göster" aria-pressed={sinirGoster} className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition active:scale-95", YUZEY, sinirGoster ? "!bg-white text-black" : "text-white/80 hover:text-white")}><Square className="h-3.5 w-3.5" strokeDasharray="3 2" /><span className="max-sm:hidden">Sınır</span></button>
          </>
        ) : konumAraclari || paketSeridi || (
          <span className={cn("flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] text-white/80", YUZEY)}><Move className="h-3.5 w-3.5" />{video ? "Video ortada kalır, kenarlar üretilir" : `${mt.ad} görseli ortada tutar`}</span>
        )}
        {duzenleme && konumAraclari && paketSeridi}
      </div>
      <div className="pointer-events-auto flex items-center gap-1.5">
        {guvenliMenu}
        <Tooltip label="Üçler kuralı ızgarası · G" side="bottom">
          <button onClick={() => setIzgara((v) => !v)} aria-pressed={izgara} aria-label="Izgara" className={cn("flex h-9 w-9 items-center justify-center rounded-full transition active:scale-90", YUZEY, izgara ? "!bg-white text-black" : "text-white/75 hover:text-white")}><Grid3x3 className="h-4 w-4" /></button>
        </Tooltip>
        {masaustu && (
          <div className="relative">
            <button onClick={() => setKisayolAcik((v) => !v)} aria-label="Klavye kısayolları" title="Kısayollar · ?" className={cn("flex h-9 w-9 items-center justify-center rounded-full transition active:scale-90", YUZEY, kisayolAcik ? "text-white" : "text-white/75 hover:text-white")}><Keyboard className="h-4 w-4" /></button>
            <Yuzen acik={kisayolAcik} onKapat={() => setKisayolAcik(false)} yerlesim="alt-sag" bosluk={8} etiket="Kısayollar" className={cn("w-[310px] overflow-hidden", POP)}>
              <div className="flex items-center gap-2 border-b border-white/[0.07] px-3.5 py-2.5"><Keyboard className="h-4 w-4 text-metin-2" /><span className="text-[13.5px] font-semibold text-metin">Klavye kısayolları</span></div>
              <div className="p-3 pt-2">
                {([["Çerçevele", ["Ctrl", "Enter"]], ["Görseli kaydır", ["←", "→", "↑", "↓"]], ["Büyük adım", ["Shift", "Ok"]], ["Uzaklaştır, yaklaştır", ["−", "+"]], ["Ortala ve sıfırla", ["R"]], ["Izgara", ["G"]], ["Önceyi göster (basılı tut)", ["\\"]], ["Karşılaştır", ["C"]], ["Kenarı iki yana çek", ["Alt", "Sürükle"]], ["Çerçeveye dön", ["Esc"]]] as const).map(([ad, t]) => (
                  <div key={ad} className="flex items-center justify-between gap-2 py-1 text-[12.5px]"><span className="text-metin-2">{ad}</span><span className="flex gap-1">{t.map((k) => <kbd key={k}>{k}</kbd>)}</span></div>
                ))}
              </div>
            </Yuzen>
          </div>
        )}
        {gorunum && !gorunum.yerel && sonucEylemleri(secili)}
        {gorunum?.yerel && !gorunum.video && <a href={gorunum.url} download="vayra-cercevele-onizleme.jpg" className={cn("flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-medium text-white transition active:scale-95", YUZEY)}><Download className="h-3.5 w-3.5" /><span className="max-sm:hidden">Önizlemeyi indir</span></a>}
      </div>
    </div>
  );

  const birakma = {
    onDragOver: (e: React.DragEvent) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setSuruklen(true); } },
    onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setSuruklen(false); },
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setSuruklen(false); void kaynakSec(e.dataTransfer.files[0]); },
  };
  const birakPerde = (metin: string) => suruklen && (
    <div className="pointer-events-none absolute inset-3 z-40 flex items-center justify-center rounded-[22px] border-2 border-dashed border-white/70 bg-black/55 backdrop-blur-sm">
      <span className="flex items-center gap-2 text-[16px] font-semibold text-white"><Upload className="h-5 w-5" />{metin}</span>
    </div>
  );

  const goruntuleyici = kaynak && (
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(ellipse_at_center,#16171a_0%,#0d0e10_70%)]" {...birakma}>
      <div className="absolute inset-0" style={{ padding: masaustu ? `92px 28px ${komutH + 30}px` : "40px 10px 14px" }}>
        <div ref={alanRef} className="flex h-full w-full items-center justify-center pt-5">{cerceve}</div>
      </div>
      {masaustu && ustAraclar}
      {birakPerde("Yeni kaynak olarak aç")}
    </div>
  );

  /* ═════════════ Sürümler ═════════════ */
  const surumOgesi = (o: { id: string; url?: string | null; video?: boolean; baslik: string; alt: string; secili: boolean; durum: "tamam" | "suruyor" | "hata"; rozet?: string; onAc: () => void; onIndir?: () => void; onSil?: () => void; hata?: string }, yatay: boolean) => (
    <motion.div key={o.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn("group relative flex items-center gap-2.5 rounded-[12px] p-1.5 outline outline-1 -outline-offset-1 transition-colors", yatay && "w-[220px] shrink-0",
      o.secili ? "bg-white/[0.09] outline-white/60" : "bg-white/[0.02] outline-white/[0.06] hover:bg-white/[0.05]")}>
      <button onClick={o.onAc} disabled={o.durum !== "tamam"} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[9px] bg-white/[0.04] ring-1 ring-white/[0.08]">
          {o.durum === "tamam" && o.url ? <Medya src={o.url} video={o.video} className="h-full w-full object-cover" />
            : o.durum === "hata" ? <X className="h-4 w-4 text-rose-300" /> : <Loader2 className="h-4 w-4 animate-spin" />}
          {o.video && o.durum === "tamam" && <Film className="absolute bottom-1 left-1 h-3 w-3 text-white/85" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-1.5 text-[12.5px] font-semibold text-metin"><span className="truncate">{o.baslik}</span>{o.rozet && <span className="shrink-0 whitespace-nowrap rounded-full bg-amber-300/15 px-1.5 py-px text-[10.5px] font-medium text-amber-100">{o.rozet}</span>}</span>
          <span className={cn("block truncate text-[11.5px] tabular-nums", o.durum === "hata" ? "text-rose-300/90" : "text-metin-2")} title={o.hata}>{o.alt}</span>
        </span>
      </button>
      {o.durum !== "suruyor" && (o.onIndir || o.onSil) && (
        <span className="flex shrink-0 gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
          {o.onIndir && o.durum === "tamam" && <button onClick={o.onIndir} aria-label="İndir" className="flex h-7 w-7 items-center justify-center rounded-[8px] text-metin-2 hover:bg-white/[0.08] hover:text-metin"><Download className="h-3.5 w-3.5" /></button>}
          {o.onSil && <button onClick={o.onSil} aria-label="Kaldır" className="flex h-7 w-7 items-center justify-center rounded-[8px] text-metin-2 hover:bg-white/[0.08] hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>}
        </span>
      )}
    </motion.div>
  );
  const surumListesi = (yatay: boolean) => (
    <div className={cn(yatay ? "gizli-scroll flex gap-2 overflow-x-auto pb-1" : "space-y-1.5")}>
      <AnimatePresence initial={false}>
        {onizlemeler.map((o) => surumOgesi({ id: o.id, url: o.url, video: o.video, baslik: o.etiket, rozet: "AI değil", alt: `Önizleme · ${o.kanvas.w}×${o.kanvas.h}`, secili: onizlemeSecili === o.id, durum: "tamam",
          onAc: () => { setOnizlemeSecili(o.id); setSeciliSonuc(null); }, onSil: () => { setOnizlemeler((l) => l.filter((x) => x.id !== o.id)); if (onizlemeSecili === o.id) setOnizlemeSecili(null); } }, yatay))}
        {[...sonuclar].reverse().map((u) => {
          const i = sonuclar.indexOf(u);
          const kn = u.meta?.kanvas as Kanvas | undefined;
          const durum = u.durum === "tamam" ? "tamam" : u.durum === "hata" ? "hata" : "suruyor";
          return surumOgesi({
            id: u.id, url: u.tur === "video" ? u.videoUrl : uretimGorseli(u), video: u.tur === "video", baslik: `V${i + 1} · ${u.baslik.replace(/^Çerçevele · /, "")}`, rozet: u.gercek === false && u.durum === "tamam" ? "Önizleme" : undefined, secili: seciliSonuc === u.id, durum, hata: u.hata,
            alt: durum === "hata" ? (u.hata ?? "Başarısız") : durum === "suruyor" ? `${u.durum === "kuyrukta" ? "Sırada" : "Genişletiliyor"}${u.ilerleme ? ` · %${Math.round(u.ilerleme)}` : ""}` : `${u.model.replace(/ (Expand|Reframe)$/, "")} · ${kn ? `${kn.w}×${kn.h}` : String(u.meta?.oran ?? "")}`,
            onAc: () => { setSeciliSonuc(u.id); setOnizlemeSecili(null); }, onIndir: () => uretimIndir(u),
          }, yatay);
        })}
      </AnimatePresence>
    </div>
  );
  const surumSayisi = sonuclar.length + onizlemeler.length;

  /* ═════════════ Tür sekmesi ═════════════ */
  const turSekmesi = (
    <div role="tablist" aria-label="Kaynak türü" className={cn("isolate flex items-center gap-0.5 rounded-full p-[3px]", masaustu ? "bg-white/[0.06]" : YUZEY)}>
      {([["gorsel", "Görsel", ImageIcon], ["video", "Video", Film]] as const).map(([id, ad, I]) => {
        const a = (kaynak?.tur ?? tur) === id;
        return (
          <button key={id} role="tab" aria-selected={a} onClick={() => { if (kaynak && kaynak.tur !== id) { setKaynak(null); sifirla(); } turSec(id); }}
            className={cn("relative flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors", a ? "text-black" : "text-metin-2 hover:text-metin")}>
            {a && <motion.span layoutId="rfTur" className="absolute inset-0 -z-10 rounded-full bg-white" transition={{ type: "spring", stiffness: 480, damping: 36 }} />}
            <I className="h-4 w-4" />{ad}
          </button>
        );
      })}
    </div>
  );

  /* ═════════════ Boş ekran (Büyüt ve Düzenle ile aynı dil) ═════════════ */
  const acmaKarti = (
    <section className={cn("w-full overflow-hidden rounded-[24px]", YUZEY)}>
      <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-3">
        <Crop className="h-4 w-4 text-metin-2" /><span className="text-[14px] font-semibold text-metin">{tur === "video" ? "Çerçevelenecek videoyu aç" : "Çerçevelenecek görseli aç"}</span>
        <span className="ml-auto rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] text-metin-2 max-sm:hidden">{tur === "video" ? `MP4, WebM, MOV · ${VIDEO_MAX_SN} sn` : "PNG, JPG, WebP"}</span>
      </div>
      <div className={cn("m-3 flex flex-col items-center gap-4 rounded-[18px] border border-dashed px-4 py-8 text-center transition-colors", suruklen ? "border-white/60 bg-white/[0.06]" : "border-white/15")}>
        <motion.span animate={suruklen ? { y: -4, scale: 1.08 } : { y: 0, scale: 1 }} className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.08]">{tur === "video" ? <Film className="h-6 w-6" /> : <Upload className="h-6 w-6" />}</motion.span>
        <span className="text-[15px] font-medium text-metin">{suruklen ? "Bırak, çerçevelemeye başla" : tur === "video" ? "Videoyu buraya bırak" : "Görseli buraya bırak"}</span>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button onClick={() => dosyaRef.current?.click()} className="flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-black transition active:scale-95"><Upload className="h-4 w-4" />{tur === "video" ? "Video yükle" : "Görsel yükle"}</button>
          <button onClick={() => setKitaplikAcik(true)} className="flex h-11 items-center gap-2 rounded-full bg-white/[0.08] px-5 text-[14px] font-medium text-metin transition hover:bg-white/[0.13] active:scale-95"><Images className="h-4 w-4" />Kitaplıktan</button>
        </div>
        {tur === "gorsel" && <span className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-[12px] text-metin-2 max-sm:hidden">Yapıştır <kbd>Ctrl</kbd><kbd>V</kbd></span>}
      </div>
      <div className="grid grid-cols-3 border-t border-white/[0.07] max-sm:grid-cols-1">
        {(tur === "video"
          ? [[Film, "7 oran", "Dikeyden sinemaya"], [Sparkles, "Kenarlar üretilir", "Hareket korunur"], [Layers, "Sosyal paket", "Çok oran birden"]]
          : [[Crop, "10 oran, 18 boyut", "Platformlara hazır"], [Move, "Konum ve kenar", "Sürükle, piksel gir"], [Layers, "Sosyal paket", "Çok oran birden"]]
        ).map(([I, ad, alt], k) => {
          const C = I as LucideIcon;
          return (
            <span key={ad as string} className={cn("flex items-center gap-2.5 px-4 py-3", k > 0 && "border-white/[0.07] max-sm:border-t sm:border-l")}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.07]"><C className="h-4 w-4 text-metin-2" /></span>
              <span className="min-w-0 leading-tight"><span className="block truncate text-[12.5px] font-semibold text-metin">{ad as string}</span><span className="block truncate text-[11.5px] text-metin-2">{alt as string}</span></span>
            </span>
          );
        })}
      </div>
    </section>
  );
  const ornekBolumu = (sutun: string) => (
    <section className={cn("overflow-hidden rounded-[20px]", YUZEY)}>
      <div className="flex items-center gap-2 border-b border-white/[0.07] px-3.5 py-2.5"><Sparkles className="h-4 w-4 text-metin-2" /><span className="text-[13.5px] font-semibold text-metin">Örnekle dene</span><span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11px] text-metin-2">Hedef oranla açılır</span></div>
      <div className={cn("grid gap-2 p-2.5", sutun)}>
        {ORNEKLER.filter((o) => o.tur === tur).map((o, i) => {
          const og = geometri(o.w ?? 1000, o.h ?? 1000, o.oran, { w: 1, h: 1 }, 1, 0.5, 0.5);
          const r = og.w / og.h, kart = 4 / 5;
          return (
            <motion.button key={o.ad} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }} onClick={() => ornekAc(o)} className="group min-w-0 text-left">
              <span className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[14px] bg-white/[0.03] p-3 outline outline-1 -outline-offset-1 outline-white/[0.08] transition group-hover:outline-white/30">
                <span className={cn("relative overflow-hidden rounded-[4px] outline outline-1 -outline-offset-1 outline-white/30", YENI_ALAN)} style={{ aspectRatio: `${og.w} / ${og.h}`, ...(r >= kart ? { width: "100%" } : { height: "100%" }) }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={o.poster ?? o.gorsel} alt="" loading="lazy" className="absolute object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    style={{ left: `${(og.x / og.w) * 100}%`, top: `${(og.y / og.h) * 100}%`, width: `${(og.gw / og.w) * 100}%`, height: `${(og.gh / og.h) * 100}%` }} />
                </span>
                <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 py-0.5 pl-1.5 pr-2 text-[11px] font-medium text-white backdrop-blur"><Crop className="h-3 w-3" />{o.not}</span>
              </span>
              <span className="mt-1.5 block truncate text-[12.5px] font-medium text-metin-2 group-hover:text-metin">{o.ad}</span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
  const sonBolumu = tumSonuclar.length > 0 && (
    <section className={cn("overflow-hidden rounded-[20px]", YUZEY)}>
      <div className="flex items-center gap-2 border-b border-white/[0.07] px-3.5 py-2.5"><History className="h-4 w-4 text-metin-2" /><span className="text-[13.5px] font-semibold text-metin">Kaldığın yerden</span><span className="rounded-full bg-white/[0.08] px-1.5 text-[11px] tabular-nums text-metin-2">{tumSonuclar.length}</span></div>
      <div className="space-y-1.5 p-2">
        {tumSonuclar.slice(0, 4).map((u) => {
          const ku = kaynakUrl(u);
          const kn = u.meta?.kanvas as Kanvas | undefined;
          return surumOgesi({ id: u.id, url: u.tur === "video" ? u.videoUrl : uretimGorseli(u), video: u.tur === "video", baslik: u.baslik.replace(/^Çerçevele · /, ""), rozet: u.gercek === false ? "Önizleme" : undefined, secili: false, durum: "tamam",
            alt: `${u.model.replace(/ (Expand|Reframe)$/, "")}${kn ? ` · ${kn.w}×${kn.h}` : ""}`,
            onAc: () => { if (ku) void urlAc(ku, u.tur === "video" ? "video" : "gorsel", { ad: "Önceki kaynak" }).then(() => setSeciliSonuc(u.id)); }, onIndir: () => uretimIndir(u) }, false);
        })}
      </div>
    </section>
  );
  const ornekKarsilastir = (
    <section className={cn("overflow-hidden rounded-[20px]", YUZEY)}>
      <div className="flex items-center gap-2 border-b border-white/[0.07] px-3.5 py-2.5"><SplitSquareHorizontal className="h-4 w-4 text-metin-2" /><span className="text-[13.5px] font-semibold text-metin">Nasıl çalışır</span><span className="rounded-full bg-amber-300/10 px-2 py-0.5 text-[11px] text-amber-100 ring-1 ring-inset ring-amber-300/25">Örnek</span></div>
      <div className="p-2.5"><CerceveDemo /></div>
    </section>
  );
  /** Telefon */
  const bos = (
    <div {...birakma} className="relative space-y-3 px-3 pb-8 pt-1">
      <div className="w-fit">{turSekmesi}</div>
      {acmaKarti}
      {sonBolumu}
      {ornekBolumu("grid-cols-2")}
      {birakPerde("Bırak, çerçevelemeye başla")}
    </div>
  );
  const baslikSol = (geri: () => void, ust: React.ReactNode) => (
    <div className="flex min-w-0 items-center gap-2.5">
      <button onClick={geri} aria-label="Geri" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-metin-2 transition hover:bg-white/[0.06] hover:text-metin active:scale-90"><ChevronLeft className="h-5 w-5" /></button>
      {ust}
    </div>
  );
  /** Masaüstü */
  const bosMasaustu = (
    <>
      <header className="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-white/[0.06] bg-[#0f0f11] px-3">
        {baslikSol(() => router.push("/panel/gorsel"), (
          <div className="flex min-w-0 items-center gap-2.5 rounded-[14px] bg-white/[0.04] py-1.5 pl-1.5 pr-3.5 ring-1 ring-inset ring-white/[0.07]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.07] text-metin"><Crop className="h-4 w-4" /></span>
            <span className="min-w-0 leading-tight">
              <span className="block whitespace-nowrap text-[13.5px] font-semibold text-metin">Çerçevele</span>
              <span className="block whitespace-nowrap text-[11.5px] text-metin-2">{tur === "video" ? "Videoyu yeni orana genişlet" : "Görselini her orana taşı, eksik kenarları üret"}</span>
            </span>
          </div>
        ))}
        {turSekmesi}
        <span />
      </header>
      <div className="flex min-h-0 flex-1">
        <div {...birakma} className="relative min-w-0 flex-1 bg-[radial-gradient(ellipse_at_center,#16171a_0%,#0d0e10_70%)]">
          <div className="absolute inset-x-0 top-[44%] flex -translate-y-1/2 justify-center px-6">
            <motion.div key={tur} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full max-w-[560px]">{acmaKarti}</motion.div>
          </div>
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
            <div className={cn("flex w-full max-w-[880px] items-center gap-2 rounded-[22px] p-2 opacity-55", YUZEY)}>
              <span className="px-2 text-[14px] text-metin-2">Önce bir {tur === "video" ? "video" : "görsel"} aç, sonra oranı seç</span>
              <span className="flex-1" />
              <span className="flex h-10 items-center gap-2 rounded-full bg-white/70 px-4 text-[14px] font-semibold text-black"><Crop className="h-4 w-4" />Çerçevele</span>
            </div>
          </div>
          {birakPerde("Bırak, çerçevelemeye başla")}
        </div>
        <motion.div style={{ width: yanEn }} className="relative shrink-0 border-l border-white/[0.06] bg-[#111113]">
          <KenarTutamac en={yanEn} anahtar="cercevele-yan" varsayilan={300} min={240} etiket="Yan panelin genişliği" />
          <aside className="h-full space-y-3 overflow-y-auto p-3 [scrollbar-width:thin]">
          {sonBolumu}
          {ornekBolumu("grid-cols-2")}
          {ornekKarsilastir}
          </aside>
        </motion.div>
      </div>
    </>
  );

  const dosyaGirdisi = <input ref={dosyaRef} type="file" accept={tur === "video" ? "video/mp4,video/webm,video/quicktime" : GORSEL_TURLERI.join(",")} hidden onChange={(e) => { void kaynakSec(e.target.files?.[0]); e.target.value = ""; }} />;
  const kaynakKapat = () => { setKaynak(null); sifirla(); };
  const kitaplikPaneli = (
    <AnimatePresence>
      {kitaplikAcik && (
        <KitaplikPaneli tur={tur} alt="Çerçevelemek istediğin üretimi seç" eylem="Çerçevele" eylemIkon={Crop} onKapat={() => setKitaplikAcik(false)} onYukle={() => dosyaRef.current?.click()}
          onSec={(u) => { setKitaplikAcik(false); const url = u.tur === "video" ? u.videoUrl : uretimGorseli(u); if (url) void urlAc(url, u.tur === "video" ? "video" : "gorsel", { uretimId: u.id, ad: u.baslik.slice(0, 60) }); }} />
      )}
    </AnimatePresence>
  );
  const kaynakBilgi = kaynak && `${kaynak.w}×${kaynak.h} · ${oranYaz(kaynak.w, kaynak.h)}${kaynak.sure ? ` · ${sureYaz(kaynak.sure)}` : ""}`;

  /* ═════════════ MOBİL ═════════════ */
  if (!masaustu) {
    const mobilOranlar = ORANLAR.filter(oranDestekli);
    return (
      <div data-kendi-kisayol className="flex min-h-[100dvh] flex-col bg-[#0d0e10]">
        {dosyaGirdisi}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-1.5 bg-[#0d0e10]/95 px-2 backdrop-blur-md">
          <button onClick={() => (kaynak ? kaynakKapat() : router.push("/panel/gorsel"))} aria-label="Geri" className="flex h-10 w-10 items-center justify-center rounded-full text-metin"><ChevronLeft className="h-5 w-5" /></button>
          <h1 className="flex-1 text-[17px] font-semibold text-metin">Çerçevele</h1>
          {surer.length > 0 && <span className="flex items-center gap-1.5 rounded-full bg-white/[0.08] px-2.5 py-1 text-[12px] text-metin"><Loader2 className="h-3 w-3 animate-spin" />{surer.length}</span>}
          {kaynak && <button onClick={() => dosyaRef.current?.click()} className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] font-medium text-metin active:scale-95"><Upload className="h-4 w-4" />Değiştir</button>}
        </header>
        {!kaynak ? bos : (
          <>
            <div className="relative mx-3 h-[50vh] min-h-[300px] overflow-hidden rounded-[18px] ring-1 ring-white/[0.07]">{goruntuleyici}</div>
            <div className="mx-3 mt-2">{ustAraclar}</div>
            {g && (
              <div className="mx-3 mt-2 flex flex-wrap items-center gap-1.5 text-[12px]">
                <span className="rounded-full bg-white/[0.07] px-2.5 py-1 tabular-nums text-metin-2">{kaynak.w}×{kaynak.h} <ChevronLeft className="inline h-3 w-3 rotate-180" /> <span className="font-semibold text-metin">{g.w}×{g.h}</span></span>
                <span className="rounded-full bg-white/[0.07] px-2.5 py-1 tabular-nums text-metin-2">%{Math.round(g.yeni * 100)} yeni alan</span>
              </div>
            )}
            <section className={cn("mx-3 mt-3 overflow-hidden rounded-[20px]", YUZEY)}>
              <div className="flex items-center gap-2 border-b border-white/[0.07] px-3.5 py-2.5">
                <Crop className="h-4 w-4 text-metin-2" /><span className="text-[13.5px] font-semibold text-metin">Hedef</span>
                <span className="flex-1" />
                <button onClick={() => paketAc(!paketMod)} aria-pressed={paketMod} className={cn("flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition active:scale-95", paketMod ? "bg-white text-black" : "bg-white/[0.08] text-metin")}><Layers className="h-3.5 w-3.5" />Sosyal paket</button>
              </div>
              <div className="gizli-scroll flex gap-1.5 overflow-x-auto p-2.5">
                {mobilOranlar.map((o) => {
                  const sec = paketMod ? paketteMi(o) : oran === o;
                  const sira = paketMod ? paket.findIndex((h) => h.anahtar === o) + 1 : 0;
                  return (
                    <button key={o} onClick={() => oranSec(o)} aria-pressed={sec}
                      className={cn("relative flex w-[84px] shrink-0 flex-col items-center gap-1.5 rounded-[14px] p-1.5 pb-2 outline outline-1 -outline-offset-1 transition active:scale-95", sec ? SECILI : SECILI_DEGIL)}>
                      <KadrajOnizleme src={onizSrc} g={hedefGeo(o)} className="h-[60px] w-full" />
                      <span className="flex flex-col items-center leading-tight"><span className="text-[12.5px] font-semibold tabular-nums text-metin">{o}</span><span className="text-[11px] text-metin-2">{ORAN_AD[o]}</span></span>
                      {secimRozeti(sec, sira || undefined)}
                    </button>
                  );
                })}
              </div>
              {!video && motor !== "luma" && <div className="gizli-scroll flex gap-2 overflow-x-auto border-t border-white/[0.07] p-2.5">{BICIMLER.filter((p) => p.marka !== "diger" || p.id === "masaustu").map((p) => bicimKarti(p, "w-[132px] shrink-0"))}</div>}
              {konumVar && duzenleme && (
                <div className="flex items-center gap-3 border-t border-white/[0.07] px-3.5 py-2.5">
                  <ZoomOut className="h-4 w-4 text-metin-2" />
                  <span className="text-[12.5px] text-metin-2">Uzaklaştır</span>
                  <input type="range" min={1} max={Math.max(2.5, zoom)} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} aria-label="Uzaklaştır"
                    className="vy-aralik-beyaz flex-1 appearance-none rounded-full" style={{ ["--d" as string]: `${((zoom - 1) / (Math.max(2.5, zoom) - 1)) * 100}%` }} />
                  <span className="w-9 text-right text-[12px] tabular-nums text-metin">%{Math.round(100 / zoom)}</span>
                </div>
              )}
            </section>
            {surumSayisi > 0 && (
              <section className={cn("mx-3 mt-3 overflow-hidden rounded-[20px]", YUZEY)}>
                <div className="flex items-center gap-2 border-b border-white/[0.07] px-3.5 py-2.5"><History className="h-4 w-4 text-metin-2" /><span className="text-[13.5px] font-semibold text-metin">Sürümler</span><span className="rounded-full bg-white/[0.08] px-1.5 text-[11px] tabular-nums text-metin-2">{surumSayisi}</span></div>
                <div className="p-2.5">{surumListesi(true)}</div>
              </section>
            )}
            <div className="h-40" />
            <div className="flex-1" />
            <div className="sticky bottom-0 z-30 p-2 pb-[calc(8px+env(safe-area-inset-bottom))]">{komut}</div>
          </>
        )}
        {kitaplikPaneli}
      </div>
    );
  }

  /* ═════════════ MASAÜSTÜ ═════════════ */
  return (
    <div data-kendi-kisayol className="flex h-[calc(100vh-var(--ust-nav))] w-full flex-col bg-[#0d0e10]">
      {dosyaGirdisi}
      {!kaynak ? bosMasaustu : (
        <>
          <header className="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-white/[0.06] bg-[#0f0f11] px-3">
            {baslikSol(kaynakKapat, (
              <>
                <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-[9px] ring-1 ring-white/10">
                  <Medya src={kaynak.goster} video={kaynak.tur === "video"} className="h-full w-full object-cover" />
                  {kaynak.durum === "yukleniyor" && <span className="absolute inset-0 flex items-center justify-center bg-black/55"><Loader2 className="h-3.5 w-3.5 animate-spin text-white" /></span>}
                </span>
                <div className="min-w-0">
                  <p className="max-w-[200px] truncate text-[13.5px] font-semibold text-metin">{kaynak.ad ?? (video ? "Kaynak video" : "Kaynak görsel")}</p>
                  <p className="truncate text-[11.5px] tabular-nums text-metin-2">{kaynakBilgi}</p>
                </div>
                <button onClick={() => dosyaRef.current?.click()} className="ml-1 flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-metin transition hover:bg-white/[0.12] active:scale-95"><Upload className="h-3.5 w-3.5" />Değiştir</button>
              </>
            ))}
            {turSekmesi}
            <div className="flex items-center justify-end gap-2">
              {g && !paketMod && (
                <span className="hidden items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1.5 text-[12.5px] tabular-nums xl:flex">
                  <OranSekli oran={`${kaynak.w}:${kaynak.h}`} boyut={13} className="text-metin-2" /><span className="text-metin-2">{kaynak.w}×{kaynak.h}</span>
                  <ChevronLeft className="h-3.5 w-3.5 rotate-180 text-metin-2" />
                  <OranSekli oran={`${g.w}:${g.h}`} boyut={13} className="text-metin" /><span className="font-semibold text-metin">{g.w}×{g.h}</span>
                </span>
              )}
              {!surumAcik && surumSayisi > 0 && (
                <button onClick={() => setSurumAcik(true)} className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-metin-2 transition hover:bg-white/[0.06] hover:text-metin active:scale-95">
                  <History className="h-4 w-4" />Sürümler<span className="rounded-full bg-white/[0.1] px-1.5 text-[11px] font-semibold tabular-nums text-metin">{surumSayisi}</span>
                </button>
              )}
            </div>
          </header>
          <div className="flex min-h-0 flex-1">
            <div className="relative min-w-0 flex-1">
              {goruntuleyici}
              <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center px-4">
                <div ref={komutRef} className="pointer-events-auto w-full max-w-[880px]">{komut}</div>
              </div>
            </div>
            <AnimatePresence initial={false}>
              {surumAcik && surumSayisi > 0 && (
                <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="relative shrink-0 overflow-hidden border-l border-white/[0.06] bg-[#111113]">
                  <KenarTutamac en={surumEn} anahtar="cercevele-surum" varsayilan={268} etiket="Sürümler panelinin genişliği" />
                  <motion.div style={{ width: surumEn }} className="flex h-full flex-col">
                  <div className="flex h-12 shrink-0 items-center justify-between px-3">
                    <span className="flex items-center gap-2 text-[13.5px] font-semibold text-metin">Sürümler <span className="rounded-full bg-white/[0.08] px-1.5 text-[11px] font-semibold tabular-nums text-metin-2">{surumSayisi}</span>
                      {surer.length > 0 && <span className="flex items-center gap-1 rounded-full bg-white/[0.08] px-2 py-0.5 text-[11px] font-medium text-metin"><Loader2 className="h-3 w-3 animate-spin" />{surer.length} sürüyor</span>}</span>
                    <button onClick={() => setSurumAcik(false)} aria-label="Sürümleri gizle" className="flex h-8 w-8 items-center justify-center rounded-[9px] text-metin-2 hover:bg-white/[0.06] hover:text-metin"><PanelRightClose className="h-4 w-4" /></button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 [scrollbar-width:thin]">{surumListesi(false)}</div>
                  <button onClick={() => router.push("/panel/kitaplik")} className="m-3 mt-0 flex h-9 items-center justify-center gap-1.5 rounded-full bg-white/[0.06] text-[12.5px] text-metin-2 transition hover:bg-white/[0.1] hover:text-metin active:scale-[0.98]"><Images className="h-3.5 w-3.5" />Kitaplıkta aç</button>
                  </motion.div>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
      {kitaplikPaneli}
    </div>
  );
}

/** Videonun ilk saniyesinden kare (oran önizlemeleri için). */
function kareAl(url: string): Promise<string | null> {
  return new Promise((coz) => {
    const v = document.createElement("video");
    v.muted = true; v.preload = "auto"; v.crossOrigin = "anonymous"; v.src = url;
    const bitir = (d: string | null) => { v.removeAttribute("src"); v.load(); coz(d); };
    v.onloadeddata = () => { v.currentTime = Math.min(0.5, (v.duration || 1) / 2); };
    v.onseeked = () => {
      try {
        const k = Math.min(1, 640 / Math.max(v.videoWidth, v.videoHeight));
        const c = document.createElement("canvas"); c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k);
        c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
        bitir(c.toDataURL("image/jpeg", 0.8));
      } catch { bitir(null); }
    };
    v.onerror = () => bitir(null);
    setTimeout(() => coz(null), 8000);
  });
}

/** Görsel ya da sessiz, döngülü video (önizlemeler ve küçük resimler). */
function Medya({ src, video, className, style, onPointerDown }: { src: string; video?: boolean; className?: string; style?: React.CSSProperties; onPointerDown?: (e: React.PointerEvent) => void }) {
  return video
    ? <video src={src} muted loop autoPlay playsInline draggable={false} onPointerDown={onPointerDown} className={className} style={style} />
    // eslint-disable-next-line @next/next/no-img-element
    : <img src={src} alt="" draggable={false} onPointerDown={onPointerDown} className={className} style={style} />;
}

/** Üçler kuralı ızgarası. */
function Ucler() {
  return (
    <span className="pointer-events-none absolute inset-0 z-10">
      {[1, 2].map((i) => <span key={`v${i}`} className="absolute inset-y-0 w-px bg-white/25" style={{ left: `${(i * 100) / 3}%` }} />)}
      {[1, 2].map((i) => <span key={`h${i}`} className="absolute inset-x-0 h-px bg-white/25" style={{ top: `${(i * 100) / 3}%` }} />)}
    </span>
  );
}

/**
 * Dikey video platformlarının arayüz katmanları (yüzde, 9:16 kareye göre). Platformların yayımladığı
 * güvenli alan rehberlerinden yuvarlanmış değerler: üst sekmeler, alt açıklama ve sağdaki eylem düğmeleri.
 */
const GUVENLI: Record<Exclude<Guvenli, "yok">, { ad: string; marka: string; ust: number; alt: number; sag: number; sagUst: number; sagAlt: number }> = {
  tiktok: { ad: "TikTok", marka: "tiktok", ust: 8, alt: 20, sag: 13, sagUst: 40, sagAlt: 80 },
  reels: { ad: "Instagram Reels", marka: "instagram", ust: 11, alt: 18, sag: 12, sagUst: 48, sagAlt: 82 },
  shorts: { ad: "YouTube Shorts", marka: "youtube", ust: 8, alt: 22, sag: 14, sagUst: 42, sagAlt: 78 },
};
function GuvenliAlan({ p }: { p: Exclude<Guvenli, "yok"> }) {
  const d = GUVENLI[p];
  const bolge = "absolute bg-rose-500/[0.16] bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.08)_0_1px,transparent_1px_7px)] outline outline-1 -outline-offset-1 outline-rose-300/40";
  return (
    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pointer-events-none absolute inset-0 z-[15] overflow-hidden rounded-[6px]">
      <span className={bolge} style={{ left: 0, right: 0, top: 0, height: `${d.ust}%` }} />
      <span className={bolge} style={{ left: 0, right: 0, bottom: 0, height: `${d.alt}%` }} />
      <span className={bolge} style={{ right: 0, width: `${d.sag}%`, top: `${d.sagUst}%`, height: `${d.sagAlt - d.sagUst}%` }} />
      <span className="absolute left-2 rounded-full bg-black/65 px-2 py-0.5 text-[10.5px] font-medium text-white backdrop-blur" style={{ top: `calc(${d.ust}% + 6px)` }}>{d.ad} arayüzü</span>
    </motion.span>
  );
}

/**
 * Boş ekran demosu: kare kaynak 9:16'ya genişler. Kaynak, uzun görselin ortasındaki karedir;
 * üst ve alt şeritler çizgili "üretilecek alan" olarak başlar, tarama çizgileriyle açılır.
 */
function CerceveDemo() {
  return (
    <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[14px] bg-[#0f1012]">
      <div className="relative h-[88%]" style={{ aspectRatio: "768 / 1344" }}>
        <span className={cn("absolute inset-0 rounded-[6px]", YENI_ALAN)} />
        <span className="rf-demo-cerceve pointer-events-none absolute inset-0 rounded-[6px] border border-dashed border-white/50" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/gercek/arac/gorsel-ilham-manzara.webp" alt="9:16'ya genişletilmiş görsel" className="rf-demo-ac absolute inset-0 h-full w-full rounded-[6px] object-cover" />
        <span className="rf-demo-kaynak pointer-events-none absolute inset-x-0 top-[21.43%] bottom-[21.43%] rounded-[3px] shadow-[0_0_0_1px_rgba(255,255,255,.55)]" />
        <span className="rf-demo-tara-ust pointer-events-none absolute inset-x-0 h-[2px] bg-white shadow-[0_0_12px_2px_rgba(255,255,255,0.45)]" />
        <span className="rf-demo-tara-alt pointer-events-none absolute inset-x-0 h-[2px] bg-white shadow-[0_0_12px_2px_rgba(255,255,255,0.45)]" />
      </div>
      <span className="rf-demo-once absolute left-2.5 top-2.5 rounded-full bg-black/60 px-2.5 py-1 text-[11.5px] font-medium text-white backdrop-blur">Kaynak · 1:1</span>
      <span className="rf-demo-sonra absolute left-2.5 top-2.5 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-semibold text-black">Story · 9:16</span>
    </div>
  );
}

/** Model logosu: yuvarlak, resmî logo (harf karosu yok). */
function ModelLogoDaire({ ad, boyut = 32 }: { ad: string; boyut?: number }) {
  const logo = modelLogoUrl(ad);
  return (
    <span className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-inset ring-white/[0.08]", /bria/i.test(ad) ? "bg-white" : "bg-white/[0.1]")} style={{ width: boyut, height: boyut }}>
      {logo
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={logo} alt="" aria-hidden className="object-contain" style={{ width: boyut * 0.56, height: boyut * 0.56, borderRadius: boyut * 0.12 }} />
        : <Sparkles className="text-metin-2" style={{ width: boyut * 0.44, height: boyut * 0.44 }} />}
    </span>
  );
}

/** Platform logosu: markanın kendi zemin renginde, beyaz gerçek logo (SVG maske). */
function MarkaLogo({ m, boyut = 24, ikon: Ikon }: { m: Marka; boyut?: number; ikon?: LucideIcon }) {
  const I = Ikon ?? m.ikon;
  return (
    <span className="relative flex shrink-0 items-center justify-center overflow-hidden" style={{ width: boyut, height: boyut, background: m.zemin, borderRadius: Math.round(boyut * 0.3) }} aria-hidden>
      {m.logo && !Ikon
        ? <span className="block bg-white" style={{ width: "58%", height: "58%", WebkitMask: `url(${m.logo}) center / contain no-repeat`, mask: `url(${m.logo}) center / contain no-repeat` }} />
        : I && <I className="text-white/85" style={{ width: "55%", height: "55%" }} strokeWidth={2} />}
    </span>
  );
}

/** Küçük kadraj önizlemesi: hedef çerçeve (çizgili yeni alan) ve içinde kaynağın duracağı yer. */
function KadrajOnizleme({ src, g, className }: { src: string; g: Kanvas; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [kutu, setKutu] = useState(1.4);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const o = () => { if (el.clientHeight) setKutu(el.clientWidth / el.clientHeight); };
    o(); const r = new ResizeObserver(o); r.observe(el); return () => r.disconnect();
  }, []);
  const r = g.w / g.h;
  return (
    <span ref={ref} className={cn("relative flex items-center justify-center overflow-hidden rounded-[10px] bg-black/30 p-1.5", className)}>
      <span className={cn("relative block overflow-hidden rounded-[3px] outline outline-1 -outline-offset-1 outline-white/30", YENI_ALAN)} style={{ aspectRatio: `${g.w} / ${g.h}`, ...(r >= kutu ? { width: "100%" } : { height: "100%" }) }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" loading="lazy" draggable={false} className="absolute object-cover"
          style={{ left: `${(g.x / g.w) * 100}%`, top: `${(g.y / g.h) * 100}%`, width: `${(g.gw / g.w) * 100}%`, height: `${(g.gh / g.h) * 100}%` }} />
      </span>
    </span>
  );
}

/** Bria/Gemini oran listesine en yakın oran (serbest boyutun yedek yolu için). */
function enYakinOran(r: number): string {
  const l = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];
  return l.reduce((en, o) => (Math.abs(sayiOran(o) - r) < Math.abs(sayiOran(en) - r) ? o : en), "1:1");
}
