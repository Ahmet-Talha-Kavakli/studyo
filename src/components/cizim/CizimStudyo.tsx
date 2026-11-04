"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { KenarTutamac, useKenarGenisligi } from "@/components/ui/KenarTutamac";
import { AnimatePresence, motion } from "framer-motion";
import {
  Clapperboard, Wand2, PencilRuler, MousePointer2, Hand, Pencil, MoveUpRight, Square, Circle, Type, Eraser, Undo2, Redo2, Trash2, ZoomIn, ZoomOut, Maximize,
  Upload, Images, Sparkles, Loader2, Play, Pause, Check, X, AlertTriangle, Camera, Clock, Eye, Film, Image as ImageIcon, RotateCcw, Keyboard,
  Frame, PencilLine, Lock, Scale, Feather, ChevronUp, ChevronDown, PanelRightOpen, PanelRightClose, Palette, SlidersHorizontal,
  Layers, Minus, Plus, Volume2, VolumeX,
} from "lucide-react";
import { videoErisim } from "@/lib/videoSaglayici";
import { videoKredi } from "@/components/studyo/video/veri";
import { gorselModelBul } from "@/lib/gorselModelVeri";
import { MenuKart } from "@/components/kitaplik/Katmanlar";
import { OzelGirdi, OranSimge } from "@/components/film/ortak";
import { UretimSecici as UretimPaneli } from "@/components/studyo/video/UretimSecici";
import { MarkaKare } from "@/components/studyo/hf";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { KCip, IzgaraSec } from "@/components/studyo/Cip";
import { cn, saltUrl } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { Tooltip } from "@/components/ui/Tooltip";
import { Yuzen } from "@/components/ui/Yuzen";
import { useMasaustu } from "@/hooks/useMasaustu";
import { useSaglayicilar } from "@/hooks/useSaglayicilar";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useCizim } from "@/store/useCizim";
import {
  ROLLER, ROL_SIRA, KAMERALAR, nesneTalimati, istemDerle, uyarilar, kareCikar, artboardBoyut, ORAN_BOYUT, gorselYukle, cId, okKontrol, sinirlar,
  type CizimArac, type Mod, type CizimNesne,
} from "@/lib/cizimMotor";
import { dosyaYukle } from "@/components/montaj/ortak";
import { CizimTuval, type TuvalTutamak } from "./CizimTuval";
import { CizimSonuc } from "./CizimSonuc";

const ARAC_ADI = "Çizim Stüdyosu";

const MODLAR: { id: Mod; ad: string; ikon: typeof Clapperboard }[] = [
  { id: "video", ad: "Video", ikon: Clapperboard },
  { id: "duzenle", ad: "Düzenle", ikon: Wand2 },
  { id: "eskiz", ad: "Eskiz", ikon: PencilRuler },
];

const ARACLAR: { id: CizimArac; ad: string; ikon: typeof Pencil; tus: string }[] = [
  { id: "sec", ad: "Seç / taşı", ikon: MousePointer2, tus: "V" },
  { id: "el", ad: "Kaydır", ikon: Hand, tus: "H" },
  { id: "ok", ad: "Ok · hareket yolu", ikon: MoveUpRight, tus: "A" },
  { id: "kalem", ad: "Kalem", ikon: Pencil, tus: "B" },
  { id: "kare", ad: "Kutu", ikon: Square, tus: "R" },
  { id: "daire", ad: "Daire", ikon: Circle, tus: "O" },
  { id: "metin", ad: "Not yaz", ikon: Type, tus: "T" },
  { id: "silgi", ad: "Silgi", ikon: Eraser, tus: "E" },
];
const TUR_IKON = { ok: MoveUpRight, kare: Square, daire: Circle, metin: Type, kalem: Pencil } as const;
const TUR_AD = { ok: "Ok", kare: "Kutu", daire: "Daire", metin: "Not", kalem: "Çizgi" } as const;

/** Video: başlangıç karesinden üreten, sağlayıcısı bağlı modeller (kapanan Veo/Sora yok). */
const VIDEO_MODELLER = ([
  { deger: "Kling 3.0", ad: "Kling 3.0", alt: "Okları en iyi izler, sesli", rozet: "Önerilen" },
  { deger: "Kling 4.0", ad: "Kling 4.0", alt: "En yeni Kling, 4K", rozet: "Yeni" },
  { deger: "Seedance 2.5", ad: "Seedance 2.5", alt: "30 sn'ye kadar, sesli" },
  { deger: "Seedance 2.0", ad: "Seedance 2.0", alt: "Sinematik, dinamik" },
  { deger: "MiniMax H3 Max", ad: "MiniMax H3 Max", alt: "Güçlü hareket ve fizik", rozet: "Yeni" },
  { deger: "Gemini Omni Flash", ad: "Gemini Omni Flash", alt: "Google, hızlı" },
  { deger: "Luma Ray 3", ad: "Luma Ray 3", alt: "Sinematik ışık" },
  { deger: "Wan 3.0 Prime", ad: "Wan 3.0 Prime", alt: "Kamera kontrollü, sesli" },
  { deger: "Kling 3.0 Turbo", ad: "Kling 3.0 Turbo", alt: "Hızlı Kling" },
  { deger: "Minimax Hailuo 2.3", ad: "Hailuo 2.3", alt: "Hızlı ve uygun", rozet: "Hızlı" },
] as { deger: string; ad: string; alt: string; rozet?: string }[]).filter((m) => videoErisim(m.deger).durum === "gercek");
/** Görsel: çizimli kareyi talimat olarak okuyabilen düzenleme modelleri (katalogdaki adlarıyla). */
const GORSEL_MODELLER = ([
  { deger: "Nano Banana Pro", ad: "Nano Banana Pro", alt: "Ok, daire ve notları en iyi anlar", rozet: "Önerilen" },
  { deger: "Nano Banana 2.1", ad: "Nano Banana 2.1", alt: "Google'ın en yenisi, 4K", rozet: "Yeni" },
  { deger: "GPT Image 2", ad: "GPT Image 2", alt: "Talimata sıkı bağlılık" },
  { deger: "Seedream 5.0 Pro", ad: "Seedream 5.0 Pro", alt: "Tutarlı, yüksek detay" },
  { deger: "FLUX.2 Pro", ad: "FLUX.2 Pro", alt: "Fotogerçekçi doku" },
  { deger: "Flux Kontext Max", ad: "Kontext Max", alt: "Hassas, yerel düzenleme" },
] as { deger: string; ad: string; alt: string; rozet?: string }[]).map((m) => ({ ...m, kredi: gorselModelBul(m.deger)?.kredi ?? 4 }));
const STILLER: { ad: string; alt: string; kapak: string }[] = [
  { ad: "Fotoğraf", alt: "Gerçekçi, doğal ışık", kapak: "/gercek/gorsel/mood-doga-isigi.webp" },
  { ad: "Sinematik", alt: "Dramatik film ışığı", kapak: "/gercek/gorsel/mood-teatral-isik.webp" },
  { ad: "3D render", alt: "Parlak, yumuşak", kapak: "/gercek/explainer-video/ex-3dmix.webp" },
  { ad: "Çizgi film", alt: "Düz renk, sıcak", kapak: "/gercek/explainer-video/ex-2dillustrator.webp" },
  { ad: "Kâğıt sanat", alt: "Katmanlı kâğıt", kapak: "/gercek/explainer-video/ex-papercraft.webp" },
  { ad: "Konsept sanat", alt: "Boyalı, atmosferik", kapak: "/gercek/gorsel/mood-dunya-disi.webp" },
  { ad: "Kil", alt: "Stop-motion dokusu", kapak: "/gercek/explainer-video/ex-claymotion.webp" },
  { ad: "İzometrik", alt: "Teknik vektör", kapak: "/gercek/explainer-video/ex-isometric.webp" },
  { ad: "Piksel", alt: "Retro oyun", kapak: "/gercek/explainer-video/ex-pixelart.webp" },
];
const SADAKAT = [
  { deger: "siki", ad: "Sıkı", alt: "Çizgiler birebir korunur", ikon: Lock },
  { deger: "dengeli", ad: "Dengeli", alt: "Kompozisyon korunur, detay eklenir", ikon: Scale },
  { deger: "serbest", ad: "Serbest", alt: "Çizim ilham olur, model yorumlar", ikon: Feather },
] as const;
/** Düzenle: işaretlenmeyen yerin ne kadar korunacağı (sunucuda talimata dönüşür). */
const DEGISIM = [
  { deger: "siki", ad: "Yalnız işaretli yer", alt: "Geri kalan piksel piksel aynı", ikon: Lock },
  { deger: "dengeli", ad: "Dengeli", alt: "İşaretli yer değişir, gerisi korunur", ikon: Scale },
  { deger: "serbest", ad: "Uyumlu", alt: "Işık ve gölge de değişikliğe uyar", ikon: Feather },
] as const;
const ORANLAR = ["16:9", "9:16", "1:1", "4:3", "3:4"] as const;

/** Hazır başlangıçlar: görsel + çizimler + istem birlikte yüklenir. */
type Sablon = { ad: string; mod: Mod; kapak?: string; oran?: "16:9" | "9:16" | "1:1"; istem: string; kamera?: string; nesneler: Omit<CizimNesne, "id">[] };
const SABLONLAR: Sablon[] = [
  { ad: "Kaykaycı kameraya gelsin", mod: "video", kapak: "/gercek/video-hareket/skate-cruise-poster.webp", istem: "Gün batımında akıcı bir kaykay sürüşü", kamera: "uzaklas",
    nesneler: [{ tur: "ok", rol: "hareket", noktalar: [{ x: 0.5, y: 0.5 }, { x: 0.52, y: 0.82 }], kalinlik: 0.01, not: "kaykaycı kameraya doğru gelir" }, { tur: "kare", rol: "sabit", noktalar: [{ x: 0.05, y: 0.05 }, { x: 0.95, y: 0.28 }], kalinlik: 0.006 }] },
  { ad: "Bulutlar zirveyi sarsın", mod: "video", kapak: "/gercek/video-hareket/drone-orbit-poster.webp", istem: "Karlı zirve, altın saat", kamera: "yorunge",
    nesneler: [{ tur: "ok", rol: "hareket", noktalar: [{ x: 0.12, y: 0.62 }, { x: 0.45, y: 0.55 }], egri: { x: 0.28, y: 0.48 }, kalinlik: 0.01, not: "bulutlar zirveye doğru akar" }, { tur: "metin", rol: "not", noktalar: [{ x: 0.6, y: 0.18 }], kalinlik: 0.006, metin: "güneş yavaşça batsın" }] },
  { ad: "Çantayı kırmızıya çevir", mod: "duzenle", kapak: "/gercek/gorsel/mood-editoryel-sokak.webp", istem: "Doğal ışığı ve dokuyu koru",
    nesneler: [{ tur: "daire", rol: "degistir", noktalar: [{ x: 0.5, y: 0.5 }, { x: 0.76, y: 0.63 }], kalinlik: 0.007, not: "kırmızı rugan çanta" }, { tur: "kare", rol: "kaldir", noktalar: [{ x: 0.0, y: 0.04 }, { x: 0.25, y: 0.45 }], kalinlik: 0.006, not: "soldaki kadın" }] },
  { ad: "Mantar ormanı eskizi", mod: "eskiz", oran: "16:9", istem: "Büyülü dev mantar ormanı, sisli sabah ışığı, kıvrılan patika",
    nesneler: [
      { tur: "kalem", rol: "not", kalinlik: 0.004, noktalar: [{ x: 0.42, y: 1 }, { x: 0.47, y: 0.85 }, { x: 0.43, y: 0.72 }, { x: 0.5, y: 0.6 }, { x: 0.47, y: 0.5 }] },
      { tur: "kalem", rol: "not", kalinlik: 0.004, noktalar: [{ x: 0.58, y: 1 }, { x: 0.6, y: 0.86 }, { x: 0.55, y: 0.72 }, { x: 0.6, y: 0.6 }, { x: 0.53, y: 0.5 }] },
      { tur: "kalem", rol: "not", kalinlik: 0.005, noktalar: [{ x: 0.2, y: 0.75 }, { x: 0.21, y: 0.45 }, { x: 0.12, y: 0.42 }, { x: 0.2, y: 0.3 }, { x: 0.34, y: 0.33 }, { x: 0.38, y: 0.42 }, { x: 0.27, y: 0.45 }, { x: 0.27, y: 0.75 }] },
      { tur: "kalem", rol: "not", kalinlik: 0.005, noktalar: [{ x: 0.74, y: 0.7 }, { x: 0.75, y: 0.4 }, { x: 0.66, y: 0.38 }, { x: 0.74, y: 0.24 }, { x: 0.88, y: 0.27 }, { x: 0.9, y: 0.37 }, { x: 0.8, y: 0.4 }, { x: 0.8, y: 0.7 }] },
      { tur: "daire", rol: "not", kalinlik: 0.004, noktalar: [{ x: 0.62, y: 0.08 }, { x: 0.7, y: 0.22 }] },
    ] },
];

const GORSEL_HAZIR = (s: Record<string, boolean> | null) => !!s && ["gemini", "seedream", "openai", "fal"].some((k) => s[k]);
const VIDEO_HAZIR = (s: Record<string, boolean> | null) => !!s && ["kling", "seedance", "minimax", "omni"].some((k) => s[k]);
const PANEL = "rounded-[16px] bg-[#1b1c1f]/95 ring-1 ring-inset ring-white/[0.08] backdrop-blur-xl";
const IKON_BTN = "flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] text-metin-2 transition-colors hover:bg-white/[0.08] hover:text-metin disabled:opacity-30 disabled:hover:bg-transparent";

export function CizimStudyo() {
  const masaustu = useMasaustu();
  const sag = useSaglayicilar();
  const mod = useCizim((s) => s.mod);
  const taban = useCizim((s) => s.taban);
  const tabanAd = useCizim((s) => s.tabanAd);
  const boyut = useCizim((s) => s.boyut);
  const nesneler = useCizim((s) => s.nesneler);
  const istem = useCizim((s) => s.istem);
  const ayar = useCizim((s) => s.ayar);
  const arac = useCizim((s) => s.arac);
  const rol = useCizim((s) => s.rol);
  const kalinlik = useCizim((s) => s.kalinlik);
  const secili = useCizim((s) => s.secili);
  const geriVar = useCizim((s) => s.geri.length > 0);
  const ileriVar = useCizim((s) => s.ileri.length > 0);
  const st = useCizim.getState;
  const tuval = useRef<TuvalTutamak>(null);
  const dosyaRef = useRef<HTMLInputElement>(null);
  const [akis, setAkis] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [uretiliyor, setUretiliyor] = useState(false);
  const [cekmece, setCekmece] = useState<"isaret" | "sonuc" | null>("isaret");
  const [mobilSekme, setMobilSekme] = useState<"isaret" | "sonuc">("isaret");
  const [cip, setCip] = useState<string | null>(null);
  const [secici, setSecici] = useState(false);
  const [acik, setAcik] = useState<Uretim | null>(null);
  const [surukle, setSurukle] = useState(false);
  const [zoomYuzde, setZoomYuzde] = useState(100);
  const [adet, setAdet] = useState(1);
  const [ozelStil, setOzelStil] = useState("");
  const uretimler = useProjeler((s) => s.uretimler);
  const sonuclar = useMemo(() => uretimler.filter((u) => u.arac === ARAC_ADI), [uretimler]);
  const calisan = sonuclar.filter((u) => u.durum !== "tamam" && u.durum !== "hata").length;
  const cipAc = (id: string) => (v: boolean) => setCip(v ? id : null);

  /* Eskiz modunda taban yoksa oran boyutu */
  useEffect(() => { if (!taban) st().boyutAyarla(ORAN_BOYUT[ayar.oran]); }, [taban, ayar.oran]); // eslint-disable-line react-hooks/exhaustive-deps

  const gModel = GORSEL_MODELLER.find((x) => x.deger === ayar.gorselModel) ?? GORSEL_MODELLER[0];
  const vModel = VIDEO_MODELLER.find((x) => x.deger === ayar.videoModel) ?? VIDEO_MODELLER[0];
  const vErisim = videoErisim(vModel.deger);
  const vSureler = vErisim.durum === "gercek" ? vErisim.sureler : [];
  const sesVar = vErisim.durum === "gercek" && vErisim.ses === "toggle";
  /* Eski taslaktaki kapanmış model ya da modelin izin vermediği süre kendiliğinden düzelir. */
  useEffect(() => {
    const p: Partial<typeof ayar> = {};
    if (ayar.videoModel !== vModel.deger) p.videoModel = vModel.deger;
    if (ayar.gorselModel !== gModel.deger) p.gorselModel = gModel.deger;
    if (vSureler.length && !vSureler.includes(ayar.sure)) p.sure = vSureler.includes(5) ? 5 : vSureler[0];
    if (Object.keys(p).length) st().ayarGuncelle(p);
  }, [ayar.videoModel, ayar.gorselModel, ayar.sure, vModel.deger, gModel.deger]); // eslint-disable-line react-hooks/exhaustive-deps
  const birim = mod === "video" ? videoKredi(vModel.deger, { sure: vSureler.length ? ayar.sure : undefined, ses: sesVar && ayar.ses !== false }) : gModel.kredi;
  const kredi = birim * adet;
  const demo = sag !== null && !(mod === "video" ? VIDEO_HAZIR(sag) : GORSEL_HAZIR(sag));
  const tanim = useMemo(() => nesneler.map((n, i) => nesneTalimati(n, i + 1)), [nesneler]);
  const lint = useMemo(() => uyarilar(nesneler, { mod, tabanVar: !!taban, istem }), [nesneler, mod, taban, istem]);
  const engel = lint.find((l) => l.seviye === "hata");
  const uyari = lint.find((l) => l.seviye === "uyari");
  const K = ayar.kamera === "ozel" ? { id: "ozel" as const, ad: ayar.kameraOzel?.trim() || "Özel", tr: "Kendi tarifin", en: ayar.kameraOzel ?? "", klip: "" } : KAMERALAR.find((k) => k.id === ayar.kamera) ?? KAMERALAR[0];
  const stilOzel = !STILLER.some((x) => x.ad === ayar.stil);
  const bosDurum = !taban && mod !== "eskiz";

  /* ── Görsel ekleme ── */
  const tabanKoy = async (url: string, ad?: string) => {
    try {
      const img = await gorselYukle(url);
      st().tabanAyarla(url, artboardBoyut(img.naturalWidth, img.naturalHeight), ad);
      requestAnimationFrame(() => tuval.current?.sigdir());
    } catch { toast.error("Görsel açılamadı", { description: "Görsel bozuk olabilir ya da erişime kapalı. Başka bir görselle dene." }); }
  };
  const dosyaKoy = async (d: File) => {
    if (!d.type.startsWith("image/")) return void mesaj.desteklenmeyenDosya("PNG, JPG ya da WebP");
    if (d.size > 25 * 1024 * 1024) return void mesaj.dosyaCokBuyuk(25);
    setYukleniyor(true);
    try { const url = await dosyaYukle(d, d.type); await tabanKoy(url, d.name); toast.success("Görsel tuvale yerleşti", { description: mod === "eskiz" ? "Eskizini üstüne çizebilirsin." : "Şimdi üstüne çiz: ok hareketi, kutu bölgeyi gösterir." }); }
    catch { mesaj.yuklenemedi("Görsel"); } finally { setYukleniyor(false); }
  };
  useEffect(() => {
    const f = (e: ClipboardEvent) => { const d = [...(e.clipboardData?.files ?? [])].find((x) => x.type.startsWith("image/")); if (d) { e.preventDefault(); void dosyaKoy(d); } };
    window.addEventListener("paste", f); return () => window.removeEventListener("paste", f);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const sablonYukle = async (s: Sablon) => {
    setCip(null);
    st().modAyarla(s.mod);
    st().istemAyarla(s.istem);
    if (s.kamera) st().ayarGuncelle({ kamera: s.kamera as never });
    if (s.kapak && s.mod !== "eskiz") await tabanKoy(s.kapak, s.ad);
    else { st().tabanAyarla(null, ORAN_BOYUT[s.oran ?? "16:9"]); st().ayarGuncelle({ oran: s.oran ?? "16:9" }); }
    st().nesneleriYaz(s.nesneler.map((n) => ({ ...n, id: cId() })), true);
    st().aracSec("sec");
    if (masaustu) setCekmece("isaret"); else setMobilSekme("isaret");
    toast.success(`"${s.ad}" yüklendi`, { description: "İşaretleri ve notlarını dilediğin gibi düzenleyebilirsin." });
  };

  /* ── Kısayollar ── */
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      const h = e.target as HTMLElement;
      if (h && (/^(INPUT|TEXTAREA|SELECT)$/.test(h.tagName) || h.isContentEditable)) return;
      const k = e.key.toLowerCase(), kts = e.ctrlKey || e.metaKey;
      if (kts && k === "z") { e.preventDefault(); if (e.shiftKey) st().yinele(); else st().geriAl(); return; }
      if (kts && k === "enter") { e.preventDefault(); void uret(); return; }
      if (kts) return;
      const a = ARACLAR.find((x) => x.tus.toLowerCase() === k);
      if (a) { e.preventDefault(); st().aracSec(a.id); return; }
      if (/^[1-6]$/.test(k) && mod !== "eskiz") { st().rolSec(ROL_SIRA[Number(k) - 1]); return; }
      if (k === "[" || k === "]") { st().kalinlikAyarla(st().kalinlik * (k === "]" ? 1.25 : 0.8)); return; }
      if ((k === "delete" || k === "backspace") && st().secili) { e.preventDefault(); st().nesneSil(st().secili!); return; }
      if (k === "f") { tuval.current?.sigdir(); return; }
      if (k === "escape") st().sec(null);
    };
    window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f);
  }); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const z = setInterval(() => setZoomYuzde(Math.round((tuval.current?.olcek() ?? 1) * 100)), 300); return () => clearInterval(z); }, []);

  /* ── Üret ── */
  const uret = async () => {
    if (uretiliyor) return;
    if (engel) return void toast.error("Üretim başlatılamadı", { description: `${engel.metin.replace(/\.$/, "")}.` });
    setUretiliyor(true);
    try {
      const cizimli = mod !== "video" || ayar.cizimliKare;
      const blob = await kareCikar({ W: boyut.W, H: boyut.H, taban: taban ?? undefined, zemin: mod === "eskiz" && !taban ? "#f8f7f4" : "#16181b", nesneler, cizimli, murekkep: mod === "eskiz" && !taban ? "#1f2328" : undefined });
      const kare = await dosyaYukle(blob, "image/jpeg");
      const prompt = istemDerle(nesneler, { mod, istem, kamera: ayar.kamera, kameraOzel: ayar.kameraOzel, stil: ayar.stil, cizimliKare: cizimli });
      const oran = mod === "eskiz" && !taban ? ayar.oran : boyut.W >= boyut.H * 1.2 ? "16:9" : boyut.H >= boyut.W * 1.2 ? "9:16" : "1:1";
      const baslik = (istem.trim() || tanim[0]?.tr || "Çizim").slice(0, 48);
      // Demo çıktı alakasız bir klip olmasın: örnek görselin kendi klibi varsa o gösterilir
      const ornekKlip = taban && /\/gercek\/video-hareket\/[^/]+-poster\.webp$/.test(taban) ? { video: taban.replace(/-poster\.webp$/, ".mp4"), poster: taban } : undefined;
      let ok = 0;
      for (let i = 0; i < adet; i++) {
        const r = mod === "video"
          ? uretimBaslat({ baslik, tur: "video", model: vModel.deger, prompt, kredi: birim, arac: ARAC_ADI, meta: { ...(ornekKlip ? { demoKlip: ornekKlip } : {}), gorselUrl: kare, ...(vSureler.length ? { sure: `${ayar.sure}sn` } : {}), ...(sesVar && ayar.ses !== false ? { ses: "Açık" } : {}), oran, hamIstem: istem, hareket: K.ad } })
          : uretimBaslat({ baslik, tur: "gorsel", model: gModel.deger, prompt, kredi: birim, arac: ARAC_ADI, meta: { gorselUrl: kare, islem: mod === "eskiz" ? "eskiz" : "cizim", sadakat: ayar.sadakat, oran, hamIstem: istem, ...(taban ? { demoOrnek: taban } : {}) } });
        if (!r.ok) { uretimHataToast(r); break; }
        ok++;
      }
      if (!ok) return;
      if (masaustu) setCekmece("sonuc"); else setMobilSekme("sonuc");
      toast.success(mod === "video" ? (ok > 1 ? `${ok} video üretiliyor` : "Video üretiliyor") : mod === "eskiz" ? (ok > 1 ? `${ok} eskiz görsele dönüşüyor` : "Eskiz görsele dönüşüyor") : (ok > 1 ? `${ok} düzenleme uygulanıyor` : "Düzenleme uygulanıyor"), { description: `${mod === "video" ? vModel.ad : gModel.ad} · ${demo ? "Kredi düşmez." : `${birim * ok} kredi.`} Sonuçlar sağ panelde.` });
    } catch (e) { toast.error("Kare hazırlanamadı", { description: e instanceof Error ? e.message : "Tuval görsele dönüştürülemedi. Yeniden dene." }); }
    finally { setUretiliyor(false); }
  };

  /* ═════════ ARAÇ ÇUBUĞU ═════════ */
  const okVar = mod === "video" && nesneler.some((n) => n.tur === "ok");
  const aracCubugu = (
    <div className={cn("pointer-events-auto flex max-w-full items-center gap-0.5 overflow-x-auto p-1 [scrollbar-width:none]", PANEL)}>
      {ARACLAR.map((a) => (
        <Tooltip key={a.id} label={`${a.ad} · ${a.tus}`}>
          <button onClick={() => st().aracSec(a.id)} aria-pressed={arac === a.id} aria-label={a.ad}
            className={cn(IKON_BTN, arac === a.id && "bg-white text-[#0b0c0e] hover:bg-white hover:text-[#0b0c0e]")}>
            <a.ikon className="h-[17px] w-[17px]" />
          </button>
        </Tooltip>
      ))}
      <span className="mx-1 h-5 w-px shrink-0 bg-white/10" />
      <Tooltip label="Kalınlık · [ ]">
        <label className="flex h-9 shrink-0 items-center gap-2 px-1.5 max-sm:hidden">
          <span className="flex h-4 w-4 items-center justify-center"><span className="rounded-full bg-metin" style={{ width: Math.max(3, kalinlik * 520), height: Math.max(3, kalinlik * 520) }} /></span>
          <input type="range" min={3} max={30} value={Math.round(kalinlik * 1000)} onChange={(e) => st().kalinlikAyarla(Number(e.target.value) / 1000)} aria-label="Kalınlık" className="h-1 w-16 cursor-pointer accent-white" />
        </label>
      </Tooltip>
      <span className="mx-1 h-5 w-px shrink-0 bg-white/10 max-sm:hidden" />
      <Tooltip label="Geri al · Ctrl+Z"><button onClick={() => st().geriAl()} disabled={!geriVar} aria-label="Geri al" className={IKON_BTN}><Undo2 className="h-4 w-4" /></button></Tooltip>
      <Tooltip label="Yinele · Ctrl+Shift+Z"><button onClick={() => st().yinele()} disabled={!ileriVar} aria-label="Yinele" className={IKON_BTN}><Redo2 className="h-4 w-4" /></button></Tooltip>
      <Tooltip label="Çizimleri temizle"><button onClick={() => { st().temizle(); toast("Çizimler temizlendi", { action: { label: "Geri al", onClick: () => st().geriAl() } }); }} disabled={!nesneler.length} aria-label="Çizimleri temizle" className={cn(IKON_BTN, "hover:text-rose-300")}><Trash2 className="h-4 w-4" /></button></Tooltip>
      {okVar && (
        <>
          <span className="mx-1 h-5 w-px shrink-0 bg-white/10" />
          <button onClick={() => setAkis((v) => !v)} aria-pressed={akis} className={cn("flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[11px] px-3 text-[13px] font-medium transition-colors", akis ? "bg-white text-black" : "text-metin hover:bg-white/[0.08]")}>
            {akis ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}<span className="max-sm:hidden">Hareketi önizle</span>
          </button>
        </>
      )}
    </div>
  );

  /* Renk = anlam şeridi */
  const aktifRol = (secili && nesneler.find((n) => n.id === secili)?.rol) || rol;
  const rolSeridi = mod !== "eskiz" && !bosDurum && (
    <div className={cn("pointer-events-auto flex flex-col gap-0.5 p-1", PANEL)}>
      {ROL_SIRA.map((r, i) => (
        <Tooltip key={r} label={`${ROLLER[r].aciklama} · ${i + 1}`} side="right">
          <button onClick={() => st().rolSec(r)} aria-pressed={aktifRol === r} aria-label={`Anlam: ${ROLLER[r].ad}`}
            className={cn("flex h-9 items-center gap-2 rounded-[11px] px-2 text-left transition-colors", aktifRol === r ? "bg-white/[0.1]" : "hover:bg-white/[0.06]")}>
            <span className={cn("h-4 w-4 shrink-0 rounded-full", aktifRol === r ? "ring-2 ring-white ring-offset-2 ring-offset-[#1b1c1f]" : "")} style={{ background: ROLLER[r].renk }} />
            <span className={cn("w-[60px] text-[12.5px] font-medium max-xl:hidden", aktifRol === r ? "text-metin" : "text-metin-2")}>{ROLLER[r].ad}</span>
          </button>
        </Tooltip>
      ))}
    </div>
  );

  const tabanCip = taban && (
    <div className={cn("pointer-events-auto flex shrink-0 items-center gap-1 p-1 pr-1.5", PANEL)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={taban} alt="" className="h-8 w-8 shrink-0 rounded-[9px] object-cover" />
      <span className="max-w-[130px] truncate px-1 text-[12.5px] font-medium text-metin-2 max-[1500px]:hidden">{tabanAd ?? "Görsel"}</span>
      <Tooltip label="Görseli değiştir"><button onClick={() => dosyaRef.current?.click()} aria-label="Görseli değiştir" className={cn(IKON_BTN, "h-8 w-8")}><RotateCcw className="h-3.5 w-3.5" /></button></Tooltip>
      <Tooltip label="Görseli kaldır"><button onClick={() => st().tabanAyarla(null, ORAN_BOYUT[ayar.oran])} aria-label="Görseli kaldır" className={cn(IKON_BTN, "h-8 w-8 hover:text-rose-300")}><X className="h-3.5 w-3.5" /></button></Tooltip>
    </div>
  );

  const zoom = (
    <div className={cn("pointer-events-auto inline-flex items-center gap-0.5 p-1", PANEL)}>
      <button onClick={() => tuval.current?.yakinlas(1 / 1.2)} aria-label="Uzaklaş" className={cn(IKON_BTN, "h-8 w-8")}><ZoomOut className="h-4 w-4" /></button>
      <span className="w-11 text-center text-[12.5px] font-medium tabular-nums text-metin-2">{zoomYuzde}%</span>
      <button onClick={() => tuval.current?.yakinlas(1.2)} aria-label="Yakınlaş" className={cn(IKON_BTN, "h-8 w-8")}><ZoomIn className="h-4 w-4" /></button>
      <Tooltip label="Sığdır · F"><button onClick={() => tuval.current?.sigdir()} aria-label="Sığdır" className={cn(IKON_BTN, "h-8 w-8")}><Maximize className="h-4 w-4" /></button></Tooltip>
      <div className="relative">
        <Tooltip label="Kısayollar"><button onClick={() => setCip(cip === "kisayol" ? null : "kisayol")} aria-label="Kısayollar" className={cn(IKON_BTN, "h-8 w-8", cip === "kisayol" && "bg-white/[0.08] text-metin")}><Keyboard className="h-4 w-4" /></button></Tooltip>
        <Yuzen acik={cip === "kisayol"} onKapat={() => setCip(null)} yerlesim="ust-sol" bosluk={10} etiket="Kısayollar" className="w-[340px] overflow-hidden rounded-[18px] border border-white/[0.09] bg-[#1b1c1f]">
          <div className="flex min-h-[44px] items-center gap-2 border-b border-white/[0.06] px-3.5 py-2"><Keyboard className="h-4 w-4 text-metin-2" /><span className="flex-1 text-[13.5px] font-semibold text-metin">Kısayollar</span></div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-3.5 text-[12.5px]">
            {[...ARACLAR.map((a) => [a.tus, a.ad.split(" · ")[0]] as const), ["1–6", "Anlam rengi"], ["[ ]", "Kalınlık"], ["Boşluk", "Geçici kaydır"], ["Del", "Seçiliyi sil"], ["Ctrl+Z", "Geri al"], ["Ctrl+Enter", "Üret"], ["F", "Sığdır"], ["Çift tık", "Oku düzleştir"]].map(([t, a]) => (
              <span key={t} className="flex items-center justify-between gap-2"><span className="truncate text-metin-2">{a}</span><kbd className="rounded-[6px] bg-white/[0.08] px-1.5 py-px text-[11.5px] font-medium text-metin">{t}</kbd></span>
            ))}
          </div>
        </Yuzen>
      </div>
    </div>
  );

  /* Seçili işaretin yanında yüzen düzenleme çubuğu */
  const seciliN = nesneler.find((n) => n.id === secili);
  const seciliNo = seciliN ? nesneler.indexOf(seciliN) + 1 : 0;
  const katman = (ekran: (q: { x: number; y: number }) => { x: number; y: number }) => {
    if (!seciliN || arac !== "sec" || mod === "eskiz" || akis) return null;
    const b = sinirlar(seciliN), a = ekran({ x: (b.x1 + b.x2) / 2, y: b.y2 });
    const notVar = seciliN.tur === "metin" || seciliN.rol !== "sabit";
    return (
      <div onPointerDown={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()} className={cn("absolute z-20 flex -translate-x-1/2 items-center gap-1 p-1 cursor-default", PANEL, "rounded-full")} style={{ left: a.x, top: a.y + 12 }}>
        <span className="flex h-7 min-w-7 items-center justify-center rounded-full text-[12px] font-semibold text-[#0b0c0e]" style={{ background: ROLLER[seciliN.rol].renk }}>{seciliNo}</span>
        <RolSec n={seciliN} acik={cip === "rol-yuzen"} setAcik={cipAc("rol-yuzen")} />
        {notVar && (
          <input key={seciliN.id} autoFocus={!(seciliN.tur === "metin" ? seciliN.metin : seciliN.not)} value={(seciliN.tur === "metin" ? seciliN.metin : seciliN.not) ?? ""} aria-label="İşaret talimatı"
            onChange={(e) => st().nesneGuncelle(seciliN.id, seciliN.tur === "metin" ? { metin: e.target.value.slice(0, 80) } : { not: e.target.value.slice(0, 80) })}
            onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter" || e.key === "Escape") { (e.target as HTMLInputElement).blur(); if (e.key === "Escape") st().sec(null); } }}
            placeholder={seciliN.rol === "hareket" ? "Ne hareket eder?" : seciliN.rol === "ekle" ? "Ne eklensin?" : seciliN.rol === "kaldir" ? "Ne silinsin?" : seciliN.rol === "degistir" ? "Neye dönüşsün?" : "Not"}
            className="h-7 w-[260px] rounded-full bg-white/[0.06] px-3 text-[13px] text-metin outline-none placeholder:text-metin-2/70 focus:bg-white/[0.09]" />
        )}
        <Tooltip label="Sil · Del"><button onClick={() => st().nesneSil(seciliN.id)} aria-label="İşareti sil" className={cn(IKON_BTN, "h-7 w-7 rounded-full hover:text-rose-300")}><Trash2 className="h-3.5 w-3.5" /></button></Tooltip>
      </div>
    );
  };

  /* ═════════ BOŞ TUVAL ═════════ */
  const bos = bosDurum && (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-auto w-full max-w-[760px] overflow-hidden rounded-[24px] bg-[#17181b]/95 ring-1 ring-inset ring-white/[0.08] backdrop-blur-xl max-sm:rounded-[20px]">
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07]"><PencilRuler className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1 leading-tight"><span className="block text-[15px] font-semibold text-metin">{mod === "video" ? "Hareket ettireceğin görseli ekle" : "Düzenleyeceğin görseli ekle"}</span><span className="block text-[12.5px] text-metin-3">Üstüne ok, kutu ve not çiz; model çizimi okur</span></span>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-3 rounded-[16px] bg-white/[0.04] p-2.5 ring-1 ring-inset ring-white/[0.08] max-sm:flex-col max-sm:items-stretch">
          <span className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-metin">{yukleniyor ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}</span>
            <span className="min-w-0"><span className="block text-[15px] font-medium text-metin">Görselini sürükle ya da seç</span><span className="block text-[12.5px] text-metin-3">PNG, JPG, WebP; Ctrl+V ile yapıştırabilirsin</span></span>
          </span>
          <span className="flex-1" />
          <span className="flex flex-wrap gap-1.5">
            <button onClick={() => dosyaRef.current?.click()} className="flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition active:scale-95 max-sm:flex-1 max-sm:justify-center"><Upload className="h-4 w-4" />Bilgisayardan</button>
            <button onClick={() => setSecici(true)} className="flex h-10 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[13.5px] font-medium text-metin transition hover:bg-white/[0.12] active:scale-95 max-sm:flex-1 max-sm:justify-center"><Images className="h-4 w-4" />Üretimlerimden</button>
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 border-y border-white/[0.06] px-4 py-2.5">
        <span className="min-w-0 flex-1 text-[13.5px] font-semibold text-metin">Bir örnekle başla</span>
        <span className="text-[12px] text-metin-3 max-sm:hidden">Tıkla, görsel ve çizimiyle yüklensin</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-4">{SABLONLAR.map((s, i) => <motion.div key={s.ad} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}><OrnekKart s={s} onClick={() => void sablonYukle(s)} /></motion.div>)}</div>
    </motion.section>
  );

  /* ═════════ ÇİPLER ═════════ */
  const modelSatir = (m: { deger: string; ad: string; alt: string; rozet?: string }, sec: boolean, kr: number, onSec: () => void, ek?: string) => (
    <button key={m.deger} onClick={onSec} aria-pressed={sec} className={cn("flex flex-col gap-2 rounded-[14px] p-2.5 text-left ring-1 ring-inset transition-[background-color,box-shadow]", sec ? "bg-white/[0.08] ring-white/70" : "ring-white/[0.06] hover:bg-white/[0.05] hover:ring-white/20")} style={sec ? undefined : { background: "rgba(255,255,255,0.025)" }}>
      <span className="flex items-center gap-2">
        <MarkaKare ad={m.deger} boyut={30} />
        {ek && <span className="whitespace-nowrap rounded-full bg-white/[0.08] px-2 py-0.5 text-[11px] font-medium tabular-nums text-metin-2 max-sm:hidden">{ek}</span>}
        <span className={cn("ml-auto flex h-6 items-center gap-1 rounded-full px-2 text-[11.5px] font-semibold tabular-nums", sec ? "bg-white text-black" : "bg-white/[0.08] text-metin-2")}><KrediYildiz className="h-3 w-3" />{kr}</span>
      </span>
      <span className="min-w-0 leading-tight">
        <span className="flex items-center gap-1.5"><span className="truncate text-[13.5px] font-semibold text-metin">{m.ad}</span>{m.rozet && <span className="shrink-0 rounded-full bg-white/[0.08] px-1.5 py-px text-[10.5px] font-medium text-metin-2">{m.rozet}</span>}</span>
        <span className="mt-0.5 block truncate text-[11.5px] text-metin-3">{m.alt}</span>
      </span>
    </button>
  );
  const sureAralik = (ad: string) => { const e = videoErisim(ad); return e.durum === "gercek" && e.sureler.length ? `${e.sureler[0]}–${e.sureler[e.sureler.length - 1]} sn` : undefined; };
  const adetCip = (
    <div className="flex h-12 shrink-0 items-center gap-0.5 rounded-full bg-white/[0.08] pl-1.5 pr-1 text-[13.5px] text-metin">
      <span className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.1] text-white/85"><Layers className="h-4 w-4" /></span>
      <span className="flex flex-col items-start pl-0.5 leading-tight"><span className="text-[11px] text-white/55">Adet</span><span className="whitespace-nowrap font-medium tabular-nums">{adet}</span></span>
      <button onClick={() => setAdet(Math.max(1, adet - 1))} disabled={adet <= 1} aria-label="Azalt" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition hover:bg-white/[0.1] hover:text-metin active:scale-90 disabled:opacity-30"><Minus className="h-3.5 w-3.5" /></button>
      <button onClick={() => setAdet(Math.min(4, adet + 1))} disabled={adet >= 4} aria-label="Artır" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition hover:bg-white/[0.1] hover:text-metin active:scale-90 disabled:opacity-30"><Plus className="h-3.5 w-3.5" /></button>
    </div>
  );
  const satir = (sec: boolean, I: typeof Lock, ad: string, alt: string, onSec: () => void, rozet?: string) => (
    <button key={ad} onClick={onSec} aria-pressed={sec} className={cn("flex w-full items-center gap-3 rounded-[12px] p-2 text-left ring-1 ring-inset transition-colors", sec ? "bg-white/[0.08] ring-white/40" : "ring-transparent hover:bg-white/[0.05]")}>
      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors", sec ? "bg-white text-black" : "bg-white/[0.06] text-metin-2")}><I className="h-4 w-4" /></span>
      <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5 text-[13.5px] font-medium text-metin">{ad}{rozet && <span className="rounded-full bg-white/[0.08] px-2 py-px text-[11px] font-medium text-metin-2">{rozet}</span>}</span><span className="block text-[12px] text-metin-3">{alt}</span></span>
    </button>
  );
  const cipler = mod === "video" ? (
    <>
      <KCip buyuk okGizli etiket="Model" ikon={<MarkaKare ad={vModel.deger} boyut={26} />} deger={vModel.ad} acik={cip === "model"} setAcik={cipAc("model")} genislik={500}>
        <div className="grid grid-cols-2 gap-1.5 p-0.5">{VIDEO_MODELLER.map((m) => modelSatir(m, vModel.deger === m.deger, videoKredi(m.deger, {}), () => { st().ayarGuncelle({ videoModel: m.deger }); setCip(null); }, sureAralik(m.deger)))}</div>
      </KCip>
      {vSureler.length > 0 && (
        <KCip buyuk okGizli etiket="Süre" ikon={<Clock className="h-4 w-4" />} deger={`${ayar.sure} sn`} acik={cip === "sure"} setAcik={cipAc("sure")} genislik={vSureler.length > 8 ? 380 : 300}
          sag={<span className="text-[11.5px] text-metin-3">{vModel.ad}</span>}>
          <div className={cn("grid gap-1.5 p-0.5", vSureler.length > 8 ? "grid-cols-5" : "grid-cols-4")}>
            {vSureler.map((n) => {
              const sec = ayar.sure === n;
              return (
                <button key={n} onClick={() => { st().ayarGuncelle({ sure: n }); setCip(null); }} aria-pressed={sec}
                  className={cn("flex h-14 flex-col items-center justify-center rounded-[12px] ring-1 ring-inset transition-colors", sec ? "bg-white text-black ring-white" : "text-metin ring-white/[0.06] hover:bg-white/[0.06]")} style={sec ? undefined : { background: "rgba(255,255,255,0.025)" }}>
                  <span className="text-[15px] font-semibold tabular-nums">{n}</span><span className={cn("text-[11px]", sec ? "text-black/55" : "text-metin-3")}>saniye</span>
                </button>
              );
            })}
          </div>
        </KCip>
      )}
      <KCip buyuk okGizli etiket="Kamera" ikon={ayar.kamera === "ozel" ? <Camera className="h-4 w-4" /> : /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/gercek/video-hareket/${K.klip}-poster.webp`} alt="" className="h-full w-full object-cover" />} deger={K.ad.length > 14 ? `${K.ad.slice(0, 13).trim()}…` : K.ad} acik={cip === "kamera"} setAcik={cipAc("kamera")} genislik={460}>
        <OzelGirdi deger={ayar.kameraOzel ?? ""} set={(v) => st().ayarGuncelle({ kameraOzel: v })} secili={ayar.kamera === "ozel"} ph="Ör. yerden yavaşça yükselip kuşbakışına geç" alt="Listede yoksa kamera hareketini tarif et" uygula={() => { st().ayarGuncelle({ kamera: "ozel" }); setCip(null); }} />
        <div className="grid grid-cols-3 gap-2 p-1">{KAMERALAR.map((k) => <IzgaraSec key={k.id} sec={ayar.kamera === k.id} ad={k.ad} alt={k.tr} kapak={`/gercek/video-hareket/${k.klip}-poster.webp`} video={`/gercek/video-hareket/${k.klip}.mp4`} onClick={() => { st().ayarGuncelle({ kamera: k.id }); setCip(null); }} />)}</div>
      </KCip>
      <KCip buyuk okGizli etiket="İlk kare" ikon={<Frame className="h-4 w-4" />} deger={ayar.cizimliKare ? "Çizimli" : "Temiz"} acik={cip === "kare"} setAcik={cipAc("kare")} genislik={320}>
        {satir(ayar.cizimliKare, PencilLine, "Çizimli", "Model çizimi görür, sonra siler", () => { st().ayarGuncelle({ cizimliKare: true }); setCip(null); }, "Önerilen")}
        {satir(!ayar.cizimliKare, ImageIcon, "Temiz", "Kare temiz gider; çizimler yazıya döner", () => { st().ayarGuncelle({ cizimliKare: false }); setCip(null); })}
      </KCip>
      {sesVar && (
        <Tooltip side="top" label={ayar.ses !== false ? "Ses açık: model sesiyle üretir" : "Ses kapalı: sessiz video"}>
          <button onClick={() => st().ayarGuncelle({ ses: ayar.ses === false })} aria-pressed={ayar.ses !== false} aria-label="Ses"
            className="flex h-12 w-12 shrink-0 items-center justify-center gap-2 max-sm:w-full rounded-full bg-white/[0.08] text-metin transition hover:bg-white/[0.13] active:scale-[0.95]">
            {ayar.ses !== false ? <Volume2 className="h-[18px] w-[18px]" /> : <VolumeX className="h-[18px] w-[18px] text-metin-3" />}<span className="text-[13.5px] font-medium sm:hidden">{ayar.ses !== false ? "Ses açık" : "Ses kapalı"}</span>
          </button>
        </Tooltip>
      )}
      {adetCip}
    </>
  ) : (
    <>
      <KCip buyuk okGizli etiket="Model" ikon={<MarkaKare ad={gModel.deger} boyut={26} />} deger={gModel.ad} acik={cip === "model"} setAcik={cipAc("model")} genislik={480}>
        <div className="grid grid-cols-2 gap-1.5 p-0.5">{GORSEL_MODELLER.map((m) => modelSatir(m, gModel.deger === m.deger, m.kredi, () => { st().ayarGuncelle({ gorselModel: m.deger }); setCip(null); }))}</div>
      </KCip>
      {mod === "duzenle" && (
        <KCip buyuk okGizli etiket="Değişim payı" ikon={<SlidersHorizontal className="h-4 w-4" />} deger={DEGISIM.find((x) => x.deger === ayar.sadakat)?.ad ?? "Dengeli"} acik={cip === "degisim"} setAcik={cipAc("degisim")} genislik={340}>
          {DEGISIM.map((x) => satir(ayar.sadakat === x.deger, x.ikon, x.ad, x.alt, () => { st().ayarGuncelle({ sadakat: x.deger }); setCip(null); }, x.deger === "dengeli" ? "Önerilen" : undefined))}
        </KCip>
      )}
      {mod === "eskiz" && (
        <>
          <KCip buyuk okGizli etiket="Stil" ikon={stilOzel ? <Palette className="h-4 w-4" /> : /* eslint-disable-next-line @next/next/no-img-element */ <img src={STILLER.find((x) => x.ad === ayar.stil)?.kapak ?? STILLER[0].kapak} alt="" className="h-full w-full object-cover" />} deger={ayar.stil.length > 14 ? `${ayar.stil.slice(0, 13).trim()}…` : ayar.stil} acik={cip === "stil"} setAcik={cipAc("stil")} genislik={460}>
            <OzelGirdi deger={stilOzel ? (ozelStil || ayar.stil) : ozelStil} set={setOzelStil} secili={stilOzel} ph="Ör. suluboya, pastel tonlar, yumuşak kenarlar" alt="Listede yoksa stili tarif et" uygula={() => { st().ayarGuncelle({ stil: (ozelStil || ayar.stil).trim() }); setCip(null); }} />
            <div className="grid grid-cols-3 gap-2 p-1">{STILLER.map((x) => <IzgaraSec key={x.ad} sec={ayar.stil === x.ad} ad={x.ad} alt={x.alt} kapak={x.kapak} onClick={() => { st().ayarGuncelle({ stil: x.ad }); setCip(null); }} />)}</div>
          </KCip>
          <KCip buyuk okGizli etiket="Çizime bağlılık" ikon={<SlidersHorizontal className="h-4 w-4" />} deger={SADAKAT.find((x) => x.deger === ayar.sadakat)?.ad ?? "Dengeli"} acik={cip === "sadakat"} setAcik={cipAc("sadakat")} genislik={320}>
            {SADAKAT.map((x) => satir(ayar.sadakat === x.deger, x.ikon, x.ad, x.alt, () => { st().ayarGuncelle({ sadakat: x.deger }); setCip(null); }, x.deger === "dengeli" ? "Önerilen" : undefined))}
          </KCip>
          {!taban && (
            <KCip buyuk okGizli etiket="Oran" ikon={<OranSimge o={ayar.oran} boy={18} />} deger={ayar.oran} acik={cip === "oran"} setAcik={cipAc("oran")} genislik={340}>
              <div className="grid grid-cols-5 gap-1.5 p-0.5">
                {ORANLAR.map((o) => {
                  const sec = ayar.oran === o;
                  return (
                    <button key={o} onClick={() => { st().ayarGuncelle({ oran: o }); setCip(null); }} aria-pressed={sec}
                      className={cn("flex h-[72px] flex-col items-center justify-center gap-2 rounded-[12px] ring-1 ring-inset transition-colors", sec ? "bg-white/[0.1] ring-white/70" : "ring-white/[0.06] hover:bg-white/[0.06]")} style={sec ? undefined : { background: "rgba(255,255,255,0.025)" }}>
                      <OranSimge o={o} boy={22} /><span className="text-[12px] font-medium tabular-nums text-metin">{o}</span>
                    </button>
                  );
                })}
              </div>
            </KCip>
          )}
        </>
      )}
      {adetCip}
    </>
  );

  /* Durum hapı: eksik varsa onu, yoksa uyarıyı, yoksa demo durumunu bir kez söyler */
  const hapMetin = (!bosDurum && engel?.metin) || (!bosDurum && uyari?.metin) || null;
  const durumHap = hapMetin && (
    <Tooltip side="top" label={hapMetin}>
      <span className="flex h-8 max-w-[300px] items-center gap-1.5 rounded-full bg-amber-300/[0.08] px-3 text-[12px] text-amber-200/90 ring-1 ring-inset ring-amber-300/20 max-sm:hidden"><AlertTriangle className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{hapMetin}</span></span>
    </Tooltip>
  );

  /* ═════════ KOMUT KUTUSU ═════════ */
  const modSecici = (
    <div role="radiogroup" aria-label="Mod" className="cam-istemci pointer-events-auto isolate mb-2 inline-grid grid-cols-3 gap-0.5 self-start rounded-full p-1 max-sm:grid max-sm:w-full">
      {MODLAR.map((x) => (
        <button key={x.id} role="radio" aria-checked={mod === x.id} onClick={() => { st().modAyarla(x.id); setAkis(false); }}
          className={cn("relative flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[13px] font-medium transition-colors max-sm:px-2", mod === x.id ? "text-black" : "text-metin-2 hover:text-metin")}>
          {mod === x.id && <motion.span layoutId="cz-mod" transition={{ type: "spring", stiffness: 480, damping: 36 }} className="absolute inset-0 -z-10 rounded-full bg-white" />}
          <x.ikon className="h-3.5 w-3.5" />{x.ad}
        </button>
      ))}
    </div>
  );
  const ornekMenu = !bosDurum && (
    <div className="relative max-sm:hidden">
      <button onClick={() => setCip(cip === "ornek" ? null : "ornek")} aria-expanded={cip === "ornek"} className={cn("flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[12.5px] font-medium transition-colors", cip === "ornek" ? "bg-white/[0.14] text-metin" : "bg-white/[0.08] text-metin-2 hover:bg-white/[0.12] hover:text-metin")}><Wand2 className="h-3.5 w-3.5" />Örnekler</button>
      <Yuzen acik={cip === "ornek"} onKapat={() => setCip(null)} yerlesim="ust-sag" bosluk={10} etiket="Örnekler" className="w-[420px] max-w-[calc(100vw-24px)] overflow-hidden rounded-[18px] border border-white/[0.09] bg-[#1b1c1f]">
        <MenuKart className="rounded-none ring-0" baslik="Örnekle başla" sag={<span className="text-[11.5px] text-metin-3">Görsel, çizim ve talimat birlikte yüklenir</span>}>
          <div className="grid grid-cols-2 gap-2 p-2.5">{SABLONLAR.map((x) => <OrnekKart key={x.ad} s={x} onClick={() => void sablonYukle(x)} kucuk />)}</div>
        </MenuKart>
      </Yuzen>
    </div>
  );
  const komut = (
    <div className="pointer-events-auto flex w-full min-w-0 flex-col">
      {modSecici}
      <div className="cam-istemci relative w-full min-w-0 rounded-[26px] p-3">
        <div className="relative">
          <textarea value={istem} onChange={(e) => st().istemAyarla(e.target.value.slice(0, 600))} rows={1} aria-label="Talimat"
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void uret(); } }}
            placeholder={mod === "video" ? "Genel talimat (isteğe bağlı): akşam ışığı, sinematik, yavaş tempo…" : mod === "duzenle" ? "Genel talimat (isteğe bağlı): ışığı ve dokuyu koru…" : "Ne çiziyorsun? Örn. dağların arasında küçük ahşap kulübe, kış sabahı"}
            className={cn("block max-h-[120px] min-h-[44px] w-full resize-none bg-transparent px-2 py-1.5 text-[16px] leading-relaxed text-metin outline-none placeholder:text-metin-2 [field-sizing:content] [scrollbar-width:thin]", !bosDurum && "sm:pr-[300px]")} />
          <span className="absolute right-0 top-0.5 flex items-center gap-1.5 max-sm:hidden">{durumHap}{ornekMenu}</span>
        </div>
        <div className="mt-2.5 flex items-center gap-1 border-t border-white/[0.08] pt-2.5 max-sm:grid max-sm:grid-cols-2 max-sm:[&>*>button]:w-full max-sm:[&>*]:min-w-0">
          {cipler}
          <button onClick={() => (bosDurum ? dosyaRef.current?.click() : void uret())} disabled={uretiliyor} title={engel?.metin ?? "Ctrl+Enter"} className="group ml-auto flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 text-[14.5px] font-semibold text-black transition active:scale-95 max-sm:col-span-2 max-sm:w-full">
            {uretiliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{bosDurum ? "Görsel ekle" : "Üret"}
            {!demo && !bosDurum && <span className="flex items-center gap-0.5 rounded-full bg-black/10 px-2 py-0.5 text-[12px] tabular-nums"><KrediYildiz className="h-3 w-3" />{kredi}</span>}
          </button>
        </div>
      </div>
    </div>
  );

  /* ═════════ İŞARETLER ═════════ */
  const tasiSira = (i: number, d: -1 | 1) => {
    const l = [...nesneler]; const j = i + d; if (j < 0 || j >= l.length) return;
    [l[i], l[j]] = [l[j], l[i]]; st().nesneleriYaz(l, true);
  };
  const anlayacagi = (nesneler.length > 0 || mod === "video") && !bosDurum && (
    <div className="overflow-hidden rounded-[16px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <p className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2.5 text-[13px] font-semibold text-metin"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.07]"><Eye className="h-3.5 w-3.5" /></span>Modelin anlayacağı</p>
      <ol className="space-y-1.5 p-3">
        {mod !== "eskiz" && tanim.map((t, i) => (
          <li key={i} className="flex gap-2 text-[12.5px] leading-snug text-metin-2"><span className="mt-px flex h-[18px] min-w-[18px] items-center justify-center rounded-full text-[10.5px] font-semibold text-[#0b0c0e]" style={{ background: ROLLER[nesneler[i].rol].renk }}>{i + 1}</span><span className="first-letter:uppercase">{t.tr}</span></li>
        ))}
        {mod === "eskiz" && <li className="text-[12.5px] text-metin-2">{nesneler.length} çizgi · kompozisyon {ayar.sadakat === "siki" ? "birebir" : ayar.sadakat === "serbest" ? "serbestçe" : "sadakatle"} izlenir · {ayar.stil}</li>}
        {mod === "video" && <li className="flex gap-2 text-[12.5px] text-metin-2"><Camera className="mt-0.5 h-3.5 w-3.5 shrink-0 text-metin-3" />Kamera: {K.ad.toLocaleLowerCase("tr")}</li>}
      </ol>
      {lint.filter((l) => l.seviye === "uyari").map((l, i) => <p key={i} className="mx-3 mb-3 flex items-start gap-1.5 rounded-[10px] bg-amber-300/[0.06] px-2.5 py-2 text-[12px] leading-snug text-amber-200 ring-1 ring-inset ring-amber-300/20"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{l.metin}</p>)}
    </div>
  );
  const isaretListe = (
    <div className="space-y-3">
      {anlayacagi}
      {nesneler.length ? (
        <div className="space-y-1.5">
          {nesneler.map((n, i) => {
            const R = ROLLER[n.rol], Ik = TUR_IKON[n.tur];
            return (
              <div key={n.id} onClick={() => { st().sec(n.id); st().aracSec("sec"); }}
                className={cn("group rounded-[14px] p-2 transition-colors", secili === n.id ? "bg-white/[0.07] outline outline-1 -outline-offset-1 outline-white/50" : "bg-white/[0.025] hover:bg-white/[0.05]")}>
                <div className="flex items-center gap-1.5">
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full text-[11.5px] font-semibold text-[#0b0c0e]" style={{ background: mod === "eskiz" ? "#e4e4e7" : R.renk }}>{i + 1}</span>
                  <Ik className="ml-0.5 h-3.5 w-3.5 text-metin-3" />
                  {mod !== "eskiz" ? <RolSec n={n} acik={cip === `rol-${n.id}`} setAcik={cipAc(`rol-${n.id}`)} /> : <span className="text-[13px] font-medium text-metin-2">{TUR_AD[n.tur]}</span>}
                  <span className="flex-1" />
                  <button onClick={(e) => { e.stopPropagation(); tasiSira(i, -1); }} disabled={i === 0} aria-label="Yukarı taşı" title="Sırayı öne al" className={cn(IKON_BTN, "h-7 w-7 rounded-[8px]")}><ChevronUp className="h-4 w-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); tasiSira(i, 1); }} disabled={i === nesneler.length - 1} aria-label="Aşağı taşı" title="Sırayı sona al" className={cn(IKON_BTN, "h-7 w-7 rounded-[8px]")}><ChevronDown className="h-4 w-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); st().nesneSil(n.id); }} aria-label="İşareti sil" className={cn(IKON_BTN, "h-7 w-7 rounded-[8px] hover:text-rose-300")}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                {mod !== "eskiz" && (n.tur === "metin" || n.rol !== "sabit") && (
                  <input value={(n.tur === "metin" ? n.metin : n.not) ?? ""} onClick={(e) => e.stopPropagation()} aria-label={n.tur === "metin" ? "Not metni" : "İşaret talimatı"}
                    onChange={(e) => st().nesneGuncelle(n.id, n.tur === "metin" ? { metin: e.target.value.slice(0, 80) } : { not: e.target.value.slice(0, 80) })}
                    placeholder={n.rol === "hareket" ? "Ne hareket eder? Örn. araba" : n.rol === "ekle" ? "Ne eklensin?" : n.rol === "kaldir" ? "Ne silinsin? (isteğe bağlı)" : n.rol === "degistir" ? "Neye dönüşsün?" : "Not"}
                    className="mt-2 h-9 w-full rounded-[10px] bg-black/25 px-3 text-[13px] text-metin outline-none ring-1 ring-inset ring-white/[0.06] placeholder:text-metin-2/70 focus:ring-white/30" />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[16px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
          <p className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2.5 text-[13px] font-semibold text-metin"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.07]"><PencilLine className="h-3.5 w-3.5" /></span>{bosDurum ? "Görsel ekleyince" : "Nasıl işaretlenir"}</p>
          <div className="p-1.5">
          {(mod === "video" ? [[MoveUpRight, "A", "Ok çiz", "Ok yönünde hareket eder; sırayı numara belirler"], [Square, "R", "Gri kutu", "Kutunun içi kıpırdamaz"], [Type, "T", "Not yaz", "Kısa, net bir talimat"]]
            : mod === "duzenle" ? [[Square, "R", "Kutu ya da daire", "Değişecek yeri işaretle"], [Palette, "1–6", "Renk seç", "Ekle, kaldır ya da değiştir"], [Type, "T", "Not yaz", "Ne olacağını yaz"]]
            : [[Pencil, "B", "Kalemle çiz", "Kaba çizgiler yeter"], [Circle, "O", "Daire", "Güneş, ay, yuvarlak şekiller"], [Eraser, "E", "Silgi", "Çizgiyi sil"]]).map(([I, t, a, b]) => {
            const Ik = I as typeof Pencil;
            return (
              <div key={a as string} className="flex items-center gap-3 rounded-[12px] px-2 py-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06]"><Ik className="h-4 w-4 text-metin-2" /></span>
                <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-metin">{a as string}</span><span className="block text-[12px] text-metin-3">{b as string}</span></span>
                <kbd className="rounded-[6px] bg-white/[0.08] px-1.5 py-px text-[11.5px] font-medium text-metin">{t as string}</kbd>
              </div>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );

  const sonucListe = sonuclar.length ? (
    <div className="grid grid-cols-2 gap-2">
      {sonuclar.map((u, sira) => {
        const bitti = u.durum === "tamam";
        const kapak = saltUrl(u.gorselUrl) ?? u.meta?.gorselUrl;
        return (
          <button key={u.id} onClick={() => setAcik(u)} className={cn("group min-w-0 text-left", sira === 0 && "col-span-2")}>
            <span className={cn("relative block overflow-hidden rounded-[12px] bg-black outline outline-1 -outline-offset-1 outline-white/[0.08] group-hover:outline-white/25", sira === 0 ? "aspect-[4/3]" : "aspect-square")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {kapak && <img src={bitti ? kapak : u.meta?.gorselUrl ?? kapak} alt="" className={cn("absolute inset-0 -z-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105", !bitti && "opacity-40 blur-[2px]")} />}
              {!bitti && <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-[12px] font-medium text-white">{u.durum === "hata" ? <AlertTriangle className="h-5 w-5 text-rose-300" /> : <Loader2 className="h-5 w-5 animate-spin" />}{u.durum === "hata" ? "Başarısız" : `%${Math.round(u.ilerleme ?? 0)}`}</span>}
              <span className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60">{u.tur === "video" ? <Film className="h-3.5 w-3.5 text-white" /> : <ImageIcon className="h-3.5 w-3.5 text-white" />}</span>
              
            </span>
            <span className="mt-1 block truncate text-[12.5px] font-medium text-metin-2">{u.baslik}</span>
            <span className="block truncate text-[11.5px] text-metin-3">{u.model}{u.meta?.sure ? ` · ${String(u.meta.sure).replace("sn", " sn")}` : ""}</span>
          </button>
        );
      })}
    </div>
  ) : (
    <div className="flex flex-col items-center gap-3 rounded-[16px] px-3 py-8 text-center ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex -space-x-4">
        {SABLONLAR.slice(0, 3).map((s, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={s.ad} src={s.kapak ?? "/gercek/gorsel/cizim-tuval.webp"} alt="" className="h-16 w-16 rounded-[12px] object-cover ring-[3px] ring-[#18191c]" style={{ transform: `rotate(${(i - 1) * 6}deg)`, zIndex: i === 1 ? 2 : 1 }} />
        ))}
      </div>
      <div><p className="text-[14px] font-semibold text-metin">Henüz sonuç yok</p><p className="mt-0.5 text-[12.5px] text-metin-3">Ürettiklerin burada birikir; aç, karşılaştır, tuvale geri al.</p></div>
      <button onClick={() => void sablonYukle(SABLONLAR[0])} className="flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black transition active:scale-95"><Wand2 className="h-4 w-4" />Örnekle dene</button>
    </div>
  );

  const sekmeler = (deger: "isaret" | "sonuc", setDeger: (v: "isaret" | "sonuc") => void) => (
    <div role="tablist" className="isolate grid flex-1 grid-cols-2 gap-0.5 rounded-full p-[3px] ring-1 ring-inset ring-white/[0.08]" style={{ background: "rgba(255,255,255,0.04)" }}>
      {([["isaret", "İşaretler", nesneler.length], ["sonuc", "Sonuçlar", sonuclar.length]] as const).map(([id, ad, n]) => (
        <button key={id} role="tab" aria-selected={deger === id} onClick={() => setDeger(id)} className={cn("relative flex h-9 items-center justify-center gap-1.5 rounded-full text-[13.5px] font-medium transition-colors", deger === id ? "text-black" : "text-metin-2 hover:text-metin")}>
          {deger === id && <motion.span layoutId="cz-sekme" transition={{ type: "spring", stiffness: 480, damping: 36 }} className="absolute inset-0 -z-10 rounded-full bg-white" />}
          {ad}{n > 0 && <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", deger === id ? "bg-black/10" : "bg-white/[0.08]")}>{n}</span>}{id === "sonuc" && calisan > 0 && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        </button>
      ))}
    </div>
  );

  const modallar = (
    <AnimatePresence>
      {acik && <CizimSonuc key="sonuc" u={sonuclar.find((x) => x.id === acik.id) ?? acik} onKapat={() => setAcik(null)}
        onTuvale={(url) => { void tabanKoy(url, "Sonuç"); st().temizle(); setAcik(null); if (masaustu) setCekmece("isaret"); else setMobilSekme("isaret"); toast.success("Sonuç tuvale taşındı", { description: "Üstüne yeniden çizebilirsin." }); }}
        onVideoya={(url) => { st().modAyarla("video"); void tabanKoy(url, "Sonuç"); st().temizle(); setAcik(null); if (masaustu) setCekmece("isaret"); else setMobilSekme("isaret"); toast.success("Video moduna geçildi", { description: "Ok çizerek hareketi yönet." }); }} />}
      {secici && <UretimPaneli key="secici" hedef="bas" baslik="Tuvale görsel seç" alt="Bir görsel ya da bir videonun son karesi tuvale yerleşir." uretimler={uretimler} onKapat={() => setSecici(false)} onKare={(url) => { void tabanKoy(url, "Üretimden"); setSecici(false); }} onVideo={() => {}} />}
    </AnimatePresence>
  );

  const surukleOlay = {
    onDragOver: (e: React.DragEvent) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setSurukle(true); } },
    onDragLeave: () => setSurukle(false),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setSurukle(false); const d = e.dataTransfer.files[0]; if (d) void dosyaKoy(d); },
  };
  const eskizIpucu = mod === "eskiz" && !nesneler.length && !taban && (
    <span className="flex flex-col items-center gap-2 text-center text-[#8a8d93]">
      <PencilRuler className="h-7 w-7" strokeWidth={1.5} />
      <span className="text-[15px] font-medium text-[#55585e]">Kâğıda kaba bir eskiz çiz</span>
      <span className="text-[13px]">Şekiller ve yerleşim yeter, detayı model tamamlar · <button className="pointer-events-auto font-semibold text-[#1f2328] underline decoration-[#1f2328]/30 underline-offset-2 hover:decoration-[#1f2328]" onClick={() => void sablonYukle(SABLONLAR[3])}>örnek eskizi yükle</button></span>
    </span>
  );
  const tuvalArka = "bg-[#131416] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:22px_22px]";
  const dosyaGirdi = <input ref={dosyaRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { const d = e.target.files?.[0]; e.target.value = ""; if (d) void dosyaKoy(d); }} />;

  /* ═════════ MOBİL ═════════ */
  if (!masaustu) {
    return (
      <div className="flex min-h-[calc(100dvh-var(--ust-nav))] flex-col gap-2 bg-zemin p-2 pb-[max(env(safe-area-inset-bottom),12px)]">
        {bos ? <div className="py-2 [&>div]:px-1">{bos}</div> : (
        <div className={cn("relative h-[56vh] shrink-0 overflow-hidden rounded-[20px]", tuvalArka, " ring-1 ring-white/[0.06]", surukle && "ring-2 ring-white")} {...surukleOlay}>
          {!bosDurum && <CizimTuval ref={tuval} akis={akis} solPay={rolSeridi ? 48 : 0} ustPay={60} altPay={56} katman={katman} className={cn("absolute inset-0", tuvalArka)} />}
          <div className="pointer-events-none absolute inset-x-2 top-2 z-10 flex justify-center">{aracCubugu}</div>
          {rolSeridi && <div className="pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-1/2">{rolSeridi}</div>}
          {!bosDurum && <div className="pointer-events-none absolute bottom-2 left-2 z-10 flex gap-2">{tabanCip}</div>}
          {eskizIpucu && <div className="pointer-events-none absolute inset-x-0 bottom-14 top-14 z-[5] flex items-center justify-center px-6">{eskizIpucu}</div>}
        </div>
        )}
        <div>{komut}</div>
        <div className="flex">{sekmeler(mobilSekme, setMobilSekme)}</div>
        <div className="px-1">{mobilSekme === "isaret" ? isaretListe : sonucListe}</div>
        {dosyaGirdi}
        {modallar}
      </div>
    );
  }

  /* ═════════ MASAÜSTÜ ═════════ */
  const cekmeceEn = useKenarGenisligi("cizim-cekmece", 340, 280, 600);
  const [CEKMECE, setCekmeceGen] = useState(340);
  useEffect(() => { let z: ReturnType<typeof setTimeout>; setCekmeceGen(cekmeceEn.get()); const k = cekmeceEn.on("change", (v) => { clearTimeout(z); z = setTimeout(() => setCekmeceGen(v), 120); }); return () => { clearTimeout(z); k(); }; }, [cekmeceEn]);
  const sagBosluk = cekmece ? CEKMECE + 24 : 16;
  return (
    <div className={cn("relative h-[calc(100dvh-var(--ust-nav))] overflow-hidden", tuvalArka, surukle && "ring-2 ring-inset ring-white")} {...surukleOlay}>
      {!bosDurum && <CizimTuval ref={tuval} akis={akis} solPay={rolSeridi ? 110 : 0} sagPay={cekmece ? CEKMECE + 12 : 0} ustPay={76} altPay={230} katman={katman} className={cn("absolute inset-0", tuvalArka)} />}

      {/* Üst sıra */}
      <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2" style={{ right: sagBosluk }}>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className={cn("pointer-events-auto flex h-11 shrink-0 items-center gap-2.5 pl-1.5 pr-3.5", PANEL)}>
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/[0.08] text-white"><PencilRuler className="h-4 w-4" /></span>
            <h1 className={cn("text-[14.5px] font-semibold tracking-[-0.01em] text-white", taban ? "max-[1700px]:hidden" : "max-[1300px]:hidden")}>Çizim stüdyosu</h1>
          </div>
          {tabanCip}
        </div>
        <div className="flex min-w-0 shrink justify-center">{aracCubugu}</div>
        <div className="flex flex-1 justify-end">
          {!cekmece && (
            <button onClick={() => setCekmece("isaret")} className={cn("pointer-events-auto flex h-11 items-center gap-2 px-3.5 text-[13px] font-medium text-metin", PANEL)}>
              <PanelRightOpen className="h-4 w-4" />İşaretler{nesneler.length > 0 && <span className="tabular-nums text-metin-3">{nesneler.length}</span>}
              {calisan > 0 && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            </button>
          )}
        </div>
      </div>

      {rolSeridi && <div className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2">{rolSeridi}</div>}
      {eskizIpucu && <div className="pointer-events-none absolute left-0 top-[76px] z-[5] flex items-center justify-center" style={{ right: sagBosluk, bottom: 230 }}>{eskizIpucu}</div>}
      {bos && <div className="pointer-events-none absolute inset-x-0 bottom-[150px] top-[76px] z-[5] flex items-center justify-center" style={{ right: sagBosluk }}>{bos}</div>}

      {/* Alt: yakınlaştırma + komut kutusu */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-10 flex items-end gap-3" style={{ right: sagBosluk }}>
        <div className="w-[196px] shrink-0">{!bosDurum && zoom}</div>
        <div className="mx-auto flex w-full max-w-[880px] min-w-0 flex-col items-center">
          {komut}
        </div>
        <div className="w-[196px] shrink-0 max-[1600px]:hidden" />
      </div>

      {/* Sağ çekmece */}
      <AnimatePresence>
        {cekmece && (
          <motion.aside initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.18 }}
            className="absolute bottom-3 right-3 top-3 z-20 flex flex-col overflow-hidden rounded-[22px] bg-[#17181b]/95 ring-1 ring-inset ring-white/[0.08] backdrop-blur-xl" style={{ width: cekmeceEn }}>
            <KenarTutamac en={cekmeceEn} anahtar="cizim-cekmece" varsayilan={340} min={280} max={600} etiket="Panelin genişliği" />
            <div className="flex shrink-0 items-center gap-2 p-3">
              {sekmeler(cekmece, setCekmece)}
              <Tooltip label="Paneli kapat"><button onClick={() => setCekmece(null)} aria-label="Paneli kapat" className={IKON_BTN}><PanelRightClose className="h-4 w-4" /></button></Tooltip>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 [scrollbar-width:thin]">{cekmece === "isaret" ? isaretListe : sonucListe}</div>
          </motion.aside>
        )}
      </AnimatePresence>
      {dosyaGirdi}
      {modallar}
    </div>
  );
}

/* ─────────── Parçalar ─────────── */

/** İşaret anlamı seçici: renk noktası + ad; listeden seçilir. */
function RolSec({ n, acik, setAcik }: { n: CizimNesne; acik: boolean; setAcik: (v: boolean) => void }) {
  const st = useCizim.getState;
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setAcik(!acik)} aria-expanded={acik} aria-label="İşaret anlamı" className={cn("flex h-7 items-center gap-1.5 rounded-full pl-2 pr-1.5 text-[13px] font-medium text-metin transition-colors hover:bg-white/[0.07]", acik && "bg-white/[0.07]")}>
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: ROLLER[n.rol].renk }} />{ROLLER[n.rol].ad}<ChevronDown className="h-3.5 w-3.5 text-metin-3" />
      </button>
      <Yuzen acik={acik} onKapat={() => setAcik(false)} yerlesim="alt-sol" bosluk={6} etiket="İşaret anlamı" className="w-[250px] rounded-[14px] border border-white/[0.09] bg-[#1b1c1f] p-1.5">
        {ROL_SIRA.map((r) => (
          <button key={r} onClick={() => { st().anlik(); st().nesneGuncelle(n.id, { rol: r }); setAcik(false); }} className={cn("flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left ring-1 ring-inset transition-colors", n.rol === r ? "bg-white/[0.07] ring-white/60" : "ring-transparent hover:bg-white/[0.05]")}>
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: ROLLER[r].renk }} />
            <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-metin">{ROLLER[r].ad}</span><span className="block truncate text-[11.5px] text-metin-3">{ROLLER[r].aciklama}</span></span>
          </button>
        ))}
      </Yuzen>
    </div>
  );
}

/** Örnek kartı: gerçek görsel + üstünde çizimleri (tuvaldeki gibi). */
function OrnekKart({ s, onClick, kucuk }: { s: Sablon; onClick: () => void; kucuk?: boolean }) {
  const [oran, setOran] = useState<{ w: number; h: number } | null>(s.kapak && s.mod !== "eskiz" ? null : { w: 16, h: 9 });
  const W = oran ? oran.w : 16, H = oran ? oran.h : 9, m = Math.min(W, H), eskiz = s.mod === "eskiz";
  const MOD = { video: "Video", duzenle: "Düzenle", eskiz: "Eskiz" }[s.mod];
  const renk = (n: Omit<CizimNesne, "id">) => (eskiz ? "#1f2328" : ROLLER[n.rol].renk);
  return (
    <button onClick={onClick} className="group block w-full min-w-0 text-left">
      <span className={cn("relative flex w-full items-center justify-center overflow-hidden rounded-[14px] transition-transform duration-300 group-hover:-translate-y-0.5 outline outline-1 -outline-offset-1 outline-white/[0.1] group-hover:outline-white/30", kucuk ? "aspect-[16/10]" : "aspect-[4/3]", eskiz ? "bg-[#f8f7f4]" : "bg-black")}>
        {s.kapak && !eskiz && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.kapak} alt="" onLoad={(e) => setOran({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            {oran && <Cizimler s={s} W={W} H={H} m={m} renk={renk} kirp />}
          </>
        )}
        {eskiz && <Cizimler s={s} W={16} H={9} m={9} renk={renk} />}
        <span className={cn("absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium", eskiz ? "bg-black/70 text-white" : "bg-black/60 text-white")}>{MOD}</span>
      </span>
      <span className="mt-1.5 block truncate text-[12.5px] font-medium text-metin-2 group-hover:text-metin">{s.ad}</span>
    </button>
  );
}

function Cizimler({ s, W, H, m, renk, kirp }: { s: Sablon; W: number; H: number; m: number; renk: (n: Omit<CizimNesne, "id">) => string; kirp?: boolean }) {
  const p = (q: { x: number; y: number }) => [q.x * W, q.y * H] as const;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio={kirp ? "xMidYMid slice" : "xMidYMid meet"} className="absolute inset-0 h-full w-full" aria-hidden>
      {s.nesneler.map((n, i) => {
        const c = renk(n), sw = Math.max(n.kalinlik, 0.006) * m * 1.4;
        if (n.tur === "ok") {
          const [a, b] = n.noktalar; const k = okKontrol({ ...n, id: "" });
          const [ax, ay] = p(a), [bx, by] = p(b), [kx, ky] = p(k);
          const ang = Math.atan2(by - ky, bx - kx), L = m * 0.06;
          const uc = `${bx},${by} ${bx - L * Math.cos(ang - 0.45)},${by - L * Math.sin(ang - 0.45)} ${bx - L * Math.cos(ang + 0.45)},${by - L * Math.sin(ang + 0.45)}`;
          return <g key={i}><path d={`M${ax},${ay} Q${kx},${ky} ${bx},${by}`} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" /><polygon points={uc} fill={c} /></g>;
        }
        if (n.tur === "kare" || n.tur === "daire") {
          const [ax, ay] = p(n.noktalar[0]), [bx, by] = p(n.noktalar[1]);
          const x = Math.min(ax, bx), y = Math.min(ay, by), w = Math.abs(bx - ax), h = Math.abs(by - ay);
          const dolgu = eskizMi(c) ? "none" : `${c}22`;
          return n.tur === "kare" ? <rect key={i} x={x} y={y} width={w} height={h} rx={m * 0.015} fill={dolgu} stroke={c} strokeWidth={sw} /> : <ellipse key={i} cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} fill={dolgu} stroke={c} strokeWidth={sw} />;
        }
        if (n.tur === "kalem") return <polyline key={i} points={n.noktalar.map((q) => p(q).join(",")).join(" ")} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />;
        const [x, y] = p(n.noktalar[0]);
        return <text key={i} x={x} y={y} fill="#fff" fontSize={m * 0.065} fontWeight={700} stroke="#000" strokeWidth={m * 0.008} paintOrder="stroke">{n.metin}</text>;
      })}
    </svg>
  );
}
const eskizMi = (c: string) => c === "#1f2328";

/* Üretimlerden seçim: ortak sağ panel (studyo/video/UretimSecici). */
