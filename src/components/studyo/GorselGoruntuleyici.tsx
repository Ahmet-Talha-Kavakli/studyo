"use client";

import { useYorumlar, useYorumIsaret } from "@/store/useYorumlar";
import { KenarTutamac, useKenarStili } from "@/components/ui/KenarTutamac";
import { KrediHap, KrediYildiz } from "@/components/ui/KrediHap";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, X, Maximize2, Pencil, Info, Wand2, MessageCircle, Palette, Sun, Scissors, Crop, Eraser,
  RotateCcw, Check, MapPin, Download, Save, Loader2, Brush, Undo2, Expand,
  Shuffle,
  Box,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { upscaleAdresi } from "@/lib/upscaleVeri";
import { saltUrl, cn } from "@/lib/utils";

/* ───────────────────────────────────────────────────────────────────────────
   Görsel görüntüleyici — büyük görsel + sağ panel (Bilgi · Düzenle · Yorumlar).
   Düzenleme araçları kaynak görselin KENDİSİYLE çalışır:
    • Renk ayarı tarayıcıda anında uygulanır, önizleme = çıktı, kredi düşmez.
    • Diğer araçlar seçilen ayarları üretim isteğine işler; bedel tek tablodan gelir.
   ─────────────────────────────────────────────────────────────────────────── */

export type AracIstegi = {
  arac: string;          // üretim aracı adı (kitaplıkta görünür)
  baslik: string;        // sonucun başlığı
  not: string;           // modele giden düzenleme talimatı (ayarlar dahil)
  kredi: number;
  oran?: string;         // hedef oran (yeniden çerçevele)
  /** Sağlayıcıdaki işlem: talimatla düzenleme, maskeli düzenleme, arka plan, genişletme. */
  islem: "duzenle" | "maske" | "arkaplan" | "genislet";
  zemin?: string;        // arka plan: "seffaf" | "beyaz" | "#rrggbb"
  maske?: string;        // bölgesel düzenleme maskesi (data URL)
};

type AracId = "varyasyon" | "renk" | "upscale" | "uc" | "iyilestir" | "isik" | "inpaint" | "reframe" | "arkaplan" | "acilar";
const ARACLAR: { id: AracId; ad: string; aciklama: string; ikon: typeof Palette; kredi: string }[] = [
  { id: "varyasyon", ad: "Varyasyon", aciklama: "Aynı görselden hafif ya da güçlü farklılaşma", ikon: Shuffle, kredi: "2" },
  { id: "renk", ad: "Renk ayarı", aciklama: "Ön ayarlar ve ince ayar", ikon: Palette, kredi: "Ücretsiz" },
  { id: "upscale", ad: "Büyüt", aciklama: "Büyüt stüdyosunda aç: 10×'a kadar, karşılaştırmalı", ikon: Expand, kredi: "Değişken" },
  { id: "uc", ad: "3D'ye çevir", aciklama: "3D stüdyosunda bu görselden model üret", ikon: Box, kredi: "Değişken" },
  { id: "iyilestir", ad: "Cilt ve doku iyileştir", aciklama: "Portrelerde doğal, net ten", ikon: Wand2, kredi: "2" },
  { id: "isik", ad: "Yeniden ışıklandır", aciklama: "Işığın yönünü ve sertliğini değiştir", ikon: Sun, kredi: "2" },
  { id: "inpaint", ad: "Bölgeyi düzenle", aciklama: "Bir alanı boya, ne olacağını yaz", ikon: Scissors, kredi: "3" },
  { id: "reframe", ad: "Yeniden çerçevele", aciklama: "Yeni orana genişlet, kenarları doldur", ikon: Crop, kredi: "2" },
  { id: "arkaplan", ad: "Arka planı kaldır", aciklama: "Özneyi ayır, zemini değiştir", ikon: Eraser, kredi: "2" },
  { id: "acilar", ad: "Kamera açısı", aciklama: "Aynı sahneyi başka açıdan gör", ikon: RotateCcw, kredi: "2" },
];

/* ── Renk ayarı ── */
type Renk = { parlaklik: number; kontrast: number; doygunluk: number; sicaklik: number; ton: number; yumusat: number; vinyet: number; grain: number };
const RENK_SIFIR: Renk = { parlaklik: 0, kontrast: 0, doygunluk: 0, sicaklik: 0, ton: 0, yumusat: 0, vinyet: 0, grain: 0 };
const RENK_ONAYAR: { ad: string; d: Partial<Renk> }[] = [
  { ad: "Orijinal", d: {} },
  { ad: "Doğal", d: { kontrast: 6, doygunluk: 8 } },
  { ad: "S&B film", d: { doygunluk: -100, kontrast: 22, grain: 25 } },
  { ad: "Sıcak", d: { sicaklik: 35, doygunluk: 6 } },
  { ad: "Soğuk", d: { sicaklik: -35, kontrast: 6 } },
  { ad: "Sinematik", d: { kontrast: 20, doygunluk: -12, sicaklik: -12, vinyet: 35 } },
  { ad: "16mm", d: { grain: 45, kontrast: 10, sicaklik: 15, vinyet: 25 } },
  { ad: "Soluk", d: { kontrast: -22, parlaklik: 8, doygunluk: -25 } },
  { ad: "Canlı", d: { doygunluk: 40, kontrast: 12 } },
];
const RENK_AYAR: { k: keyof Renk; ad: string; min: number; max: number }[] = [
  { k: "parlaklik", ad: "Parlaklık", min: -50, max: 50 },
  { k: "kontrast", ad: "Kontrast", min: -50, max: 50 },
  { k: "doygunluk", ad: "Doygunluk", min: -100, max: 100 },
  { k: "sicaklik", ad: "Sıcaklık", min: -100, max: 100 },
  { k: "ton", ad: "Renk tonu", min: -50, max: 50 },
  { k: "yumusat", ad: "Yumuşatma", min: 0, max: 40 },
  { k: "vinyet", ad: "Vinyet", min: 0, max: 100 },
  { k: "grain", ad: "Film greni", min: 0, max: 100 },
];
/** Önizlemede ve çıktıda AYNI süzgeç kullanılır (önizleme = sonuç). */
function renkSuzgeci(r: Renk) {
  const p = [
    `brightness(${(1 + r.parlaklik / 100).toFixed(3)})`,
    `contrast(${(1 + r.kontrast / 100).toFixed(3)})`,
    `saturate(${Math.max(0, 1 + r.doygunluk / 100).toFixed(3)})`,
  ];
  if (r.sicaklik > 0) p.push(`sepia(${(r.sicaklik / 250).toFixed(3)})`);
  const ton = r.ton * 1.8 + (r.sicaklik < 0 ? r.sicaklik * -0.25 : 0);
  if (ton) p.push(`hue-rotate(${ton.toFixed(1)}deg)`);
  if (r.yumusat) p.push(`blur(${(r.yumusat / 40).toFixed(2)}px)`);
  return p.join(" ");
}
const vinyetArka = (v: number) => `radial-gradient(ellipse at center, transparent ${Math.max(20, 70 - v * 0.4)}%, rgba(0,0,0,${(v / 100) * 0.75}) 100%)`;
let greniDokusu: string | null = null;
function grenDokusu() {
  if (greniDokusu || typeof document === "undefined") return greniDokusu;
  const c = document.createElement("canvas"); c.width = c.height = 160;
  const x = c.getContext("2d")!; const d = x.createImageData(160, 160);
  for (let i = 0; i < d.data.length; i += 4) { const g = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = g; d.data[i + 3] = 255; }
  x.putImageData(d, 0, 0);
  greniDokusu = c.toDataURL("image/png");
  return greniDokusu;
}

function gorselYukle(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, hata) => {
    const img = new Image();
    if (/^https?:/.test(src) && !src.startsWith(location.origin)) img.crossOrigin = "anonymous";
    img.onload = () => ok(img);
    img.onerror = () => hata(new Error("görsel yüklenemedi"));
    img.src = src;
  });
}

/** Renk ayarını tam çözünürlükte uygular ve PNG data URL döndürür. */
async function renkUygula(src: string, r: Renk, tur: "image/webp" | "image/png" = "image/webp"): Promise<string> {
  const img = await gorselYukle(src);
  // Tarayıcı depolamasını şişirmemek için en uzun kenar 2048 px, WebP.
  const olcek = Math.min(1, 2048 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * olcek); c.height = Math.round(img.naturalHeight * olcek);
  const x = c.getContext("2d");
  if (!x || !("filter" in x)) throw new Error("tarayıcı desteklemiyor");
  x.filter = renkSuzgeci(r);
  x.drawImage(img, 0, 0, c.width, c.height);
  x.filter = "none";
  if (r.vinyet) {
    const g = x.createRadialGradient(c.width / 2, c.height / 2, Math.min(c.width, c.height) * Math.max(0.2, 0.7 - r.vinyet * 0.004) / 2,
      c.width / 2, c.height / 2, Math.hypot(c.width, c.height) / 2);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${(r.vinyet / 100) * 0.75})`);
    x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
  }
  if (r.grain) {
    const doku = await gorselYukle(grenDokusu()!);
    x.globalAlpha = (r.grain / 100) * 0.22; x.globalCompositeOperation = "overlay";
    x.fillStyle = x.createPattern(doku, "repeat")!; x.fillRect(0, 0, c.width, c.height);
    x.globalAlpha = 1; x.globalCompositeOperation = "source-over";
  }
  return c.toDataURL(tur, 0.9);
}

/* ─────────────────────────────── Bileşen ─────────────────────────────── */
export function GorselGoruntuleyici({
  url, ad, altBaslik, onAdKaydet, sira, onGez, onKapat, bilgi, yorumlar, yorumSayisi,
  onAracCalistir, onYerelKaydet, onIndir, krediler, ustKatmanAcik = false, uretimId,
}: {
  /** Kitaplıktaki üretim (Büyüt stüdyosu sonucu kaynağa bağlar). */
  uretimId?: string;
  /** Görüntüleyicinin üstünde başka bir pencere açıkken klavye kısayolları devre dışı. */
  ustKatmanAcik?: boolean;
  url: string; ad: string; altBaslik: string; onAdKaydet: (yeni: string) => void;
  sira: { i: number; n: number } | null; onGez: (yon: 1 | -1) => void; onKapat: () => void;
  bilgi: ReactNode; yorumlar: ReactNode; yorumSayisi: number;
  onAracCalistir: (i: AracIstegi) => boolean;
  onYerelKaydet: (dataUrl: string, baslik: string) => void;
  onIndir: (src: string, ad: string) => void;
  krediler: number;
}) {
  const yanBoy = useKenarStili("goruntuleyici-gorsel", 360);
  const kaynak = saltUrl(url) ?? url;
  const router = useRouter();
  const [sekme, setSekme] = useState<"bilgi" | "duzenle" | "yorumlar">("bilgi");
  const [arac, setArac] = useState<AracId | null>(null);
  const [adDuzen, setAdDuzen] = useState(false);
  const [adTaslak, setAdTaslak] = useState(ad);
  const [yuklendi, setYuklendi] = useState(false);
  const [boyut, setBoyut] = useState<{ w: number; h: number } | null>(null);
  const [renk, setRenk] = useState<Renk>(RENK_SIFIR);
  const [onayar, setOnayar] = useState("Orijinal");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const kutuRef = useRef<HTMLDivElement>(null);
  // Yakınlaştırma/kaydırma (çift tık · tekerlek · sürükle). Maske ve renk aracında kapalı (çizim/önizleme sığdır'da).
  const [yak, setYak] = useState(1);
  const [kay, setKay] = useState({ x: 0, y: 0 });
  const surukle = useRef<{ x: number; y: number; kx: number; ky: number } | null>(null);
  const zoomKapali = arac === "inpaint" || arac === "renk";
  const yakAyarla = (y: number) => { const v = Math.min(8, Math.max(1, y)); setYak(v); if (v === 1) setKay({ x: 0, y: 0 }); };
  /** Gerçek piksel (%100): görselin doğal genişliği / ekrandaki genişliği. */
  const birebir = () => { const i = imgRef.current; if (i && i.clientWidth) yakAyarla(i.naturalWidth / i.clientWidth); };
  useEffect(() => { setYak(1); setKay({ x: 0, y: 0 }); }, [kaynak, zoomKapali]);

  // Görsel değişince düzenleme durumu sıfırlanır (başka görsele taşınmasın).
  useEffect(() => { setYuklendi(false); setBoyut(null); setRenk(RENK_SIFIR); setOnayar("Orijinal"); setArac(null); setAdDuzen(false); }, [kaynak]);
  useEffect(() => { setAdTaslak(ad); }, [ad]);

  // Klavye: ← → gezin (yazı alanı dışındayken), Esc üst katmandan kapanır.
  useEffect(() => {
    const t = (e: KeyboardEvent) => {
      if (ustKatmanAcik) return;
      // Esc yazı alanındayken de çalışır (önce açık aracı, sonra görüntüleyiciyi kapatır).
      if (e.key === "Escape") { e.preventDefault(); if (arac) setArac(null); else onKapat(); return; }
      const h = e.target as HTMLElement;
      if (/INPUT|TEXTAREA|SELECT/.test(h.tagName) || h.isContentEditable) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); onGez(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); onGez(1); }
    };
    window.addEventListener("keydown", t);
    return () => window.removeEventListener("keydown", t);
  }, [onGez, onKapat, arac, ustKatmanAcik]);

  // Yorum işaretleri (yorum sekmesi açıkken görüntüleyici çizer)
  const isaret = useYorumIsaret();
  const tumYorum = useYorumlar((s) => s.yorumlar);
  const isaretliYorumlar = useMemo(() => tumYorum.filter((y) => y.konuId === isaret.konuId && y.nokta && !y.yanitId).sort((a, b) => a.zaman - b.zaman), [tumYorum, isaret.konuId]);

  const renkDegisti = useMemo(() => Object.keys(RENK_SIFIR).some((k) => renk[k as keyof Renk] !== 0), [renk]);
  const tamEkran = () => {
    const el = kutuRef.current;
    if (!el) return;
    if (document.fullscreenElement) { void document.exitFullscreen?.(); return; }
    (el.requestFullscreen?.() ?? Promise.reject()).catch(() => toast.error("Tam ekran açılamadı", { description: "Tarayıcın tam ekrana izin vermedi. F11 ile tarayıcının tam ekranını deneyebilirsin." }));
  };
  const adKaydet = () => { setAdDuzen(false); const y = adTaslak.trim(); if (y && y !== ad) onAdKaydet(y); else setAdTaslak(ad); };

  /* ── Bölgesel düzenleme maskesi ── */
  const maskeRef = useRef<HTMLCanvasElement>(null);
  const [firca, setFirca] = useState(40);
  const [silgi, setSilgi] = useState(false);
  const [maskeVar, setMaskeVar] = useState(false);
  const cizimGecmis = useRef<ImageData[]>([]);
  const maskeHazirla = useCallback(() => {
    const c = maskeRef.current, img = imgRef.current;
    if (!c || !img) return;
    const r = img.getBoundingClientRect();
    c.width = Math.round(r.width); c.height = Math.round(r.height);
    setMaskeVar(false); cizimGecmis.current = [];
  }, []);
  useEffect(() => { if (arac === "inpaint" && yuklendi) maskeHazirla(); }, [arac, yuklendi, maskeHazirla]);
  const ciz = (e: React.PointerEvent<HTMLCanvasElement>, basla = false) => {
    const c = maskeRef.current; if (!c) return;
    if (!basla && !(e.buttons & 1)) return;
    const x = c.getContext("2d")!; const r = c.getBoundingClientRect();
    if (basla) { cizimGecmis.current.push(x.getImageData(0, 0, c.width, c.height)); if (cizimGecmis.current.length > 20) cizimGecmis.current.shift(); }
    x.globalCompositeOperation = silgi ? "destination-out" : "source-over";
    x.fillStyle = "rgba(109,107,255,0.55)";
    x.beginPath(); x.arc(e.clientX - r.left, e.clientY - r.top, firca / 2, 0, Math.PI * 2); x.fill();
    if (!silgi) setMaskeVar(true);
  };
  const maskeGeriAl = () => {
    const c = maskeRef.current; const son = cizimGecmis.current.pop();
    if (!c || !son) return;
    c.getContext("2d")!.putImageData(son, 0, 0);
    const d = son.data; let dolu = false; for (let i = 3; i < d.length; i += 4) if (d[i]) { dolu = true; break; }
    setMaskeVar(dolu);
  };
  const maskeTemizle = () => { const c = maskeRef.current; if (c) c.getContext("2d")!.clearRect(0, 0, c.width, c.height); setMaskeVar(false); cizimGecmis.current = []; };
  const maskeAl = () => {
    const c = maskeRef.current; if (!c) return undefined;
    const o = document.createElement("canvas"); o.width = c.width; o.height = c.height;
    const x = o.getContext("2d")!; x.fillStyle = "#000"; x.fillRect(0, 0, o.width, o.height);
    x.globalCompositeOperation = "destination-out"; x.drawImage(c, 0, 0);
    x.globalCompositeOperation = "destination-over"; x.fillStyle = "#fff"; x.fillRect(0, 0, o.width, o.height);
    return o.toDataURL("image/png");
  };

  const renkKaydet = async (indir: boolean) => {
    setKaydediliyor(true);
    try {
      const sonuc = await renkUygula(kaynak, renk, indir ? "image/png" : "image/webp");
      if (indir) onIndir(sonuc, `${ad} - renk`);
      else { onYerelKaydet(sonuc, `${ad} · ${onayar !== "Orijinal" && onayar !== "Özel" ? onayar : "renk ayarı"}`); setSekme("bilgi"); }
    } catch {
      toast.error("Renk ayarı uygulanamadı", { description: "Bu görsel tarayıcıda işlenemiyor ya da tarayıcın bu özelliği desteklemiyor. Başka bir tarayıcıda dene." });
    }
    setKaydediliyor(false);
  };

  const oranMetni = boyut ? (() => { const g = (a: number, b: number): number => (b ? g(b, a % b) : a); const k = g(boyut.w, boyut.h); const a = boyut.w / k, b = boyut.h / k; return a <= 32 && b <= 32 ? `${a}:${b}` : (boyut.w / boyut.h).toFixed(2); })() : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }} transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[60] flex bg-black/85 backdrop-blur-sm max-md:flex-col max-md:overflow-y-auto" role="dialog" aria-modal="true" aria-label={ad} onClick={onKapat}>
      {/* ── Sahne ── */}
      <div ref={kutuRef} className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden bg-black/40 p-8 max-md:h-[50dvh] max-md:flex-none max-md:px-3 max-md:pb-3 max-md:pt-16" onClick={(e) => e.stopPropagation()}>
        <div key={"b-" + kaynak} className="pointer-events-none absolute inset-0 scale-125" style={{ backgroundImage: `url("${kaynak}")`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(60px) saturate(1.4) brightness(0.5)" }} />
        <div className="pointer-events-none absolute inset-0 bg-black/30" />

        <button onClick={onKapat} className="glass-ikon absolute left-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full text-white" aria-label="Kapat (Esc)"><X className="h-5 w-5" /></button>
        {sira && sira.n > 1 && (
          <span className="glass-cip absolute left-1/2 top-5 z-10 -translate-x-1/2 rounded-full px-3 py-1 text-[12px] tabular-nums text-white/85">{sira.i + 1} / {sira.n}</span>
        )}
        {sira && sira.i > 0 && (
          <button onClick={() => onGez(-1)} className="hf-btn glass-ikon absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white" aria-label="Önceki görsel (←)"><ChevronLeft className="h-6 w-6" /></button>
        )}
        {sira && sira.i < sira.n - 1 && (
          <button onClick={() => onGez(1)} className="hf-btn glass-ikon absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white" aria-label="Sonraki görsel (→)"><ChevronRight className="h-6 w-6" /></button>
        )}

        <div className="relative z-[5] flex max-h-full max-w-full items-center justify-center">
          {!yuklendi && <Loader2 className="absolute h-7 w-7 animate-spin text-white/70" />}
          <div className={cn("relative", !zoomKapali && yak > 1 && (surukle.current ? "cursor-grabbing" : "cursor-grab"), !zoomKapali && yak === 1 && "cursor-zoom-in")}
            style={zoomKapali ? undefined : { transform: `translate(${kay.x}px, ${kay.y}px) scale(${yak})`, transition: surukle.current ? "none" : "transform 160ms ease-out" }}
            onDoubleClick={() => { if (!zoomKapali && !isaret.mod) { if (yak > 1) yakAyarla(1); else yakAyarla(2.5); } }}
            onWheel={(e) => { if (!zoomKapali) yakAyarla(yak * (e.deltaY < 0 ? 1.15 : 1 / 1.15)); }}
            onPointerDown={(e) => { if (zoomKapali || yak === 1 || e.button !== 0) return; e.currentTarget.setPointerCapture(e.pointerId); surukle.current = { x: e.clientX, y: e.clientY, kx: kay.x, ky: kay.y }; }}
            onPointerMove={(e) => { const s0 = surukle.current; if (s0) setKay({ x: s0.kx + e.clientX - s0.x, y: s0.ky + e.clientY - s0.y }); }}
            onPointerUp={() => { surukle.current = null; }} onPointerCancel={() => { surukle.current = null; }}>
            <motion.img
              ref={imgRef} key={kaynak} src={kaynak} alt={ad}
              initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: yuklendi ? 1 : 0 }} transition={{ duration: 0.22, ease: "easeOut" }}
              onLoad={(e) => { setYuklendi(true); setBoyut({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight }); }}
              className="block max-h-[calc(100vh-128px)] max-w-full select-none max-md:max-h-[calc(50dvh-76px)] rounded-xl object-contain"
              style={{ filter: arac === "renk" ? renkSuzgeci(renk) : undefined }} draggable={false}
            />
            {arac === "renk" && renk.vinyet > 0 && <span className="pointer-events-none absolute inset-0 rounded-xl" style={{ background: vinyetArka(renk.vinyet) }} />}
            {arac === "renk" && renk.grain > 0 && <span className="pointer-events-none absolute inset-0 rounded-xl mix-blend-overlay" style={{ backgroundImage: `url(${grenDokusu()})`, opacity: (renk.grain / 100) * 0.22 }} />}
            {/* Yorum işaretleri: yorum sekmesi açıkken numaralı noktalar; işaret modunda tıklanan yere taslak nokta */}
            {!arac && isaret.konuId && yuklendi && (
              <div className={cn("absolute inset-0 rounded-xl", isaret.mod && "cursor-crosshair")}
                onClick={(e) => {
                  if (!isaret.mod) return;
                  e.stopPropagation();
                  const r0 = e.currentTarget.getBoundingClientRect();
                  isaret.ayarla({ taslak: { x: Math.min(1, Math.max(0, (e.clientX - r0.left) / r0.width)), y: Math.min(1, Math.max(0, (e.clientY - r0.top) / r0.height)) }, mod: false });
                }}
                onDoubleClick={(e) => { if (isaret.mod) e.stopPropagation(); }}
                style={{ pointerEvents: isaret.mod ? "auto" : "none" }}>
                {isaretliYorumlar.map((y, i) => (
                  <span key={y.id} title={y.metin}
                    onMouseEnter={() => isaret.ayarla({ vurgu: y.id })} onMouseLeave={() => isaret.ayarla({ vurgu: null })}
                    className={cn("pointer-events-auto absolute flex h-7 min-w-7 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full rounded-bl-none px-1.5 text-[12px] font-bold ring-2 transition-transform",
                      y.cozuldu ? "bg-white/80 text-[#0a0a0b] ring-black/30" : "bg-aksan text-[#03141a] ring-black/40",
                      isaret.vurgu === y.id && "z-10 scale-125")}
                    style={{ left: `${y.nokta!.x * 100}%`, top: `${y.nokta!.y * 100}%`, transformOrigin: "bottom left" }}>
                    {y.cozuldu ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                  </span>
                ))}
                {isaret.taslak && (
                  <span className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full rounded-bl-none bg-white text-[#0a0a0b] ring-2 ring-aksan"
                    style={{ left: `${isaret.taslak.x * 100}%`, top: `${isaret.taslak.y * 100}%` }}>
                    <MapPin className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            )}
            {arac === "inpaint" && (
              <canvas ref={maskeRef} className="absolute inset-0 h-full w-full cursor-crosshair rounded-xl touch-none"
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); ciz(e, true); }} onPointerMove={(e) => ciz(e)} aria-label="Düzenlenecek alanı boya" />
            )}
          </div>
        </div>

        <button onClick={tamEkran} className="glass-ikon absolute bottom-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-white" aria-label="Tam ekran"><Maximize2 className="h-5 w-5" /></button>
        {!zoomKapali && yuklendi && (
          <div className="glass-cip absolute bottom-4 right-4 z-10 flex items-center gap-0.5 rounded-full p-1 text-[12px] text-white/90" role="group" aria-label="Yakınlaştırma">
            <button onClick={() => yakAyarla(yak / 1.4)} disabled={yak <= 1} aria-label="Uzaklaştır" className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-40">−</button>
            <span className="min-w-[42px] text-center tabular-nums">{Math.round(yak * 100)}%</span>
            <button onClick={() => yakAyarla(yak * 1.4)} disabled={yak >= 8} aria-label="Yakınlaştır" className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-40">+</button>
            <button onClick={birebir} title="Gerçek piksel boyutu" className="rounded-full px-2 py-1 hover:bg-white/10">1:1</button>
            {yak > 1 && <button onClick={() => yakAyarla(1)} className="rounded-full px-2 py-1 hover:bg-white/10">Sığdır</button>}
          </div>
        )}
        {arac === "renk" && renkDegisti && (
          <span className="glass-cip absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full px-3 py-1 text-[12px] text-white/85">Önizleme · kaydedince yeni görsel olarak eklenir</span>
        )}
        {arac === "inpaint" && (
          <span className="glass-cip absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full px-3 py-1 text-[12px] text-white/85">{maskeVar ? "Boyadığın alan düzenlenecek" : "Düzenlemek istediğin alanı boya"}</span>
        )}
      </div>

      {/* ── Sağ panel ── */}
      <motion.aside initial={{ x: 360, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 360, opacity: 0, transition: { duration: 0.15, ease: "easeIn" } }} transition={{ type: "spring", stiffness: 380, damping: 38 }}
        onClick={(e) => e.stopPropagation()} style={yanBoy.stil} className="flex relative w-[var(--yan-en)] shrink-0 flex-col border-l border-white/10 bg-yuzey max-md:min-h-[50dvh] max-md:w-full max-md:border-l-0 max-md:border-t">
        <KenarTutamac en={yanBoy.en} anahtar={yanBoy.anahtar} varsayilan={yanBoy.varsayilan} min={yanBoy.min} max={yanBoy.max} etiket="Panelin genişliği" />
        {/* Başlık */}
        <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
          <div className="min-w-0 flex-1">
            {adDuzen ? (
              <input autoFocus value={adTaslak} maxLength={60} onChange={(e) => setAdTaslak(e.target.value)} onBlur={adKaydet}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); adKaydet(); } if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setAdTaslak(ad); setAdDuzen(false); } }}
                aria-label="Görsel adı" className="w-full rounded-lg bg-white/8 px-2 py-1 text-sm font-semibold text-white outline-none ring-1 ring-white/40" />
            ) : (
              <button onClick={() => setAdDuzen(true)} className="group/ad flex w-full min-w-0 items-center gap-1.5 rounded-lg px-1 py-0.5 text-left hover:bg-white/6" title="Adı düzenle (indirme dosya adı olur)">
                <span className="line-clamp-2 text-sm font-semibold leading-snug text-white">{ad}</span>
                <Pencil className="h-3 w-3 shrink-0 text-metin-3 group-hover/ad:text-metin" />
              </button>
            )}
            <p className="px-1 text-[11.5px] leading-snug text-metin-3">{altBaslik}{boyut ? ` · ${boyut.w}×${boyut.h}${oranMetni ? ` · ${oranMetni}` : ""}` : ""}</p>
          </div>
          <button onClick={onKapat} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-metin-2 hover:bg-white/8 hover:text-metin" aria-label="Kapat"><X className="h-4 w-4" /></button>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {arac ? (
            <AracPaneli key={arac} id={arac} onGeri={() => setArac(null)} kaynak={kaynak} boyut={boyut} krediler={krediler}
              renk={renk} setRenk={setRenk} onayar={onayar} setOnayar={setOnayar} renkDegisti={renkDegisti} kaydediliyor={kaydediliyor} onRenkKaydet={renkKaydet}
              firca={firca} setFirca={setFirca} silgi={silgi} setSilgi={setSilgi} maskeVar={maskeVar} onMaskeGeriAl={maskeGeriAl} onMaskeTemizle={maskeTemizle} maskeAl={maskeAl}
              onCalistir={(i) => { if (onAracCalistir(i)) setArac(null); }} />
          ) : (
            <motion.div key="ana" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }} className="flex min-h-0 flex-1 flex-col">
              <div className="border-b border-white/8 p-2.5"><div role="tablist" className="isolate grid grid-cols-3 gap-0.5 rounded-full p-[3px] ring-1 ring-inset ring-white/[0.08]" style={{ background: "rgba(255,255,255,0.04)" }}>
                {([["bilgi", "Bilgi", Info, 0], ["duzenle", "Düzenle", Wand2, 0], ["yorumlar", "Yorumlar", MessageCircle, yorumSayisi]] as const).map(([id, a, I, n]) => (
                  <button key={id} role="tab" aria-selected={sekme === id} onClick={() => setSekme(id)}
                    className={cn("relative flex h-8 items-center justify-center gap-1.5 rounded-full text-[13px] font-medium transition-colors", sekme === id ? "text-black" : "text-metin-2 hover:text-metin")}>
                    {sekme === id && <motion.span layoutId="gg-sekme" transition={{ type: "spring", stiffness: 480, damping: 36 }} className="absolute inset-0 -z-10 rounded-full bg-white" />}
                    <I className="h-3.5 w-3.5" />{a}{n > 0 && <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", sekme === id ? "bg-black/10" : "bg-white/[0.08]")}>{n}</span>}
                  </button>
                ))}
              </div></div>
              <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
                {sekme === "bilgi" && bilgi}
                {sekme === "duzenle" && (
                  <div className="p-2">
                    <p className="px-3 pb-1 pt-2 text-[12px] text-metin-3">Araçlar bu görseli kaynak alır; sonuç yeni bir görsel olarak Üretimlerim'e eklenir.</p>
                    {ARACLAR.map((a) => (
                      <button key={a.id} onClick={() => (a.id === "upscale" ? router.push(upscaleAdresi(kaynak, uretimId)) : a.id === "uc" ? router.push(`/panel/3d?gorsel=${encodeURIComponent(kaynak)}`) : setArac(a.id))} className="group flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors hover:bg-white/6">
                        <span className="glass-ikon flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"><a.ikon className="h-[17px] w-[17px] text-metin-2 group-hover:text-metin" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13.5px] font-medium text-metin">{a.ad}</span>
                          <span className="block text-[12px] leading-snug text-metin-3">{a.aciklama}</span>
                        </span>
                        <KrediHap deger={a.kredi} baslik={a.kredi === "Değişken" ? "Bedel çıktı boyutuna (MP) göre hesaplanır" : undefined} />
                      </button>
                    ))}
                  </div>
                )}
                {sekme === "yorumlar" && yorumlar}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </motion.div>
  );
}

/* ─────────────────────────────── Araç panelleri ─────────────────────────────── */
function AracPaneli(p: {
  id: AracId; onGeri: () => void; kaynak: string; boyut: { w: number; h: number } | null; krediler: number;
  renk: Renk; setRenk: (r: Renk) => void; onayar: string; setOnayar: (s: string) => void; renkDegisti: boolean; kaydediliyor: boolean; onRenkKaydet: (indir: boolean) => void;
  firca: number; setFirca: (n: number) => void; silgi: boolean; setSilgi: (b: boolean) => void; maskeVar: boolean; onMaskeGeriAl: () => void; onMaskeTemizle: () => void; maskeAl: () => string | undefined;
  onCalistir: (i: AracIstegi) => void;
}) {
  const tanim = ARACLAR.find((a) => a.id === p.id)!;
  // Yapay zekâ araçlarının ayarları
  const [ten, setTen] = useState("Doğal");
  const [varyasyonGuc, setVaryasyonGuc] = useState<"Hafif" | "Güçlü">("Hafif");
  const [isikYon, setIsikYon] = useState("Sol");
  const [isikSert, setIsikSert] = useState("Yumuşak");
  const [isikRenk, setIsikRenk] = useState("Gün ışığı");
  const [inpaintNot, setInpaintNot] = useState("");
  const [hedefOran, setHedefOran] = useState("16:9");
  const [zemin, setZemin] = useState<"seffaf" | "beyaz" | "renk">("seffaf");
  const [zeminRenk, setZeminRenk] = useState("#6d6bff");
  const [donme, setDonme] = useState(0);
  const [egim, setEgim] = useState(0);
  const [yakin, setYakin] = useState(0);
  const padRef = useRef<HTMLDivElement>(null);

  const kredi = p.id === "inpaint" ? 3 : p.id === "renk" ? 0 : 2;
  const istek: AracIstegi | null = (() => {
    switch (p.id) {
      case "varyasyon": return { islem: "duzenle", arac: "Varyasyon", baslik: `Varyasyon · ${varyasyonGuc.toLocaleLowerCase("tr-TR")}`, kredi,
        not: varyasyonGuc === "Hafif"
          ? "Bu görselin hafif bir varyasyonunu üret: kompozisyonu, özneyi, stili ve ışığı koru; yalnız küçük ayrıntıları (ifade, kumaş kıvrımı, arka plandaki küçük öğeler) değiştir."
          : "Bu görselin güçlü bir varyasyonunu üret: aynı özneyi ve stili koru, ama kompozisyonu, pozu, kamera açısını ve kadrajı belirgin biçimde değiştir." };
      case "iyilestir": return { islem: "duzenle", arac: "İyileştirici", baslik: `Cilt iyileştirme · ${ten}`, kredi, not: `Ten ve doku iyileştirme: ${ten.toLocaleLowerCase("tr-TR")} görünüm. Kimliği ve ifadeyi koru.` };
      case "isik": return { islem: "duzenle", arac: "Yeniden Işıklandır", baslik: `Işık · ${isikYon}`, kredi, not: `Yeniden ışıklandır: ana ışık ${isikYon.toLocaleLowerCase("tr-TR")} taraftan, ${isikSert.toLocaleLowerCase("tr-TR")}, ${isikRenk.toLocaleLowerCase("tr-TR")} rengi. Sahneyi ve kişiyi değiştirme.` };
      case "inpaint": return inpaintNot.trim().length >= 3 && p.maskeVar ? { islem: "maske", arac: "Bölgesel Düzenleme", baslik: `Düzenleme · ${inpaintNot.trim().slice(0, 30)}`, kredi, not: `İşaretli alanda: ${inpaintNot.trim()}. Maskenin dışını değiştirme.` } : null;
      case "reframe": return { islem: "genislet", arac: "Yeniden Çerçevele", baslik: `Yeniden çerçeve · ${hedefOran}`, kredi, oran: hedefOran, not: `Görseli ${hedefOran} orana genişlet (outpaint); mevcut içeriği koru, yeni kenarları doğal doldur.` };
      case "arkaplan": return { islem: "arkaplan", zemin: zemin === "renk" ? zeminRenk : zemin, arac: "Arka Plan Kaldır", baslik: `Arka plan · ${zemin === "seffaf" ? "şeffaf" : zemin === "beyaz" ? "beyaz" : zeminRenk}`, kredi, not: `Özneyi ayır, arka planı ${zemin === "seffaf" ? "şeffaf yap (PNG)" : zemin === "beyaz" ? "düz beyaz yap" : `düz ${zeminRenk} renk yap`}.` };
      case "acilar": return { islem: "duzenle", arac: "Kamera Açısı", baslik: `Açı · ${donme}° / ${egim}°`, kredi, not: `Aynı sahneyi kamera ${donme}° döndürülmüş, ${egim}° eğilmiş${yakin ? `, %${yakin} yakınlaştırılmış` : ""} açıdan göster.` };
      default: return null;
    }
  })();

  const padAyarla = (e: React.PointerEvent) => {
    const r = padRef.current?.getBoundingClientRect(); if (!r) return;
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    setDonme(Math.round((x - 0.5) * 360)); setEgim(Math.round((0.5 - y) * 180));
  };

  const yetmiyor = kredi > 0 && p.krediler < kredi;
  const altButon = p.id === "renk" ? (
    <div className="flex items-center gap-2">
      <button onClick={() => { p.setRenk(RENK_SIFIR); p.setOnayar("Orijinal"); }} disabled={!p.renkDegisti} className="glass-ikon flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-metin-2 hover:text-metin disabled:opacity-40" aria-label="Sıfırla"><RotateCcw className="h-4 w-4" /></button>
      <button onClick={() => p.onRenkKaydet(true)} disabled={!p.renkDegisti || p.kaydediliyor} className="glass-ikon flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-metin-2 hover:text-metin disabled:opacity-40" aria-label="Ayarlı hâlini indir"><Download className="h-4 w-4" /></button>
      <button onClick={() => p.onRenkKaydet(false)} disabled={!p.renkDegisti || p.kaydediliyor} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-[14px] font-semibold text-black transition active:scale-[0.98] disabled:opacity-50">
        {p.kaydediliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Yeni görsel olarak kaydet
      </button>
    </div>
  ) : (
    <>
      <button onClick={() => istek && p.onCalistir(p.id === "inpaint" ? { ...istek, maske: p.maskeAl() } : istek)} disabled={!istek || yetmiyor}
        className="flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-white text-[14px] font-semibold text-black transition active:scale-[0.98] disabled:opacity-50">
        {tanim.ad} <KrediYildiz className="h-4 w-4" /> {kredi}
      </button>
      <p className="mt-1.5 text-center text-[11.5px] text-metin-3">
        {yetmiyor ? `Kredin yetmiyor · bakiye ${p.krediler.toLocaleString("tr-TR")}` : p.id === "inpaint" && !istek ? (p.maskeVar ? "Ne olacağını en az birkaç kelimeyle yaz" : "Önce görselde bir alan boya") : `Bakiye ${p.krediler.toLocaleString("tr-TR")} · sonuç Üretimlerim'e eklenir`}
      </p>
    </>
  );

  const Baslik = ({ children }: { children: ReactNode }) => <p className="mb-2 text-[12.5px] font-medium text-metin-2">{children}</p>;
  const Secim = ({ deger, secili, onSec, children }: { deger: string; secili: string; onSec: (s: string) => void; children?: ReactNode }) => (
    <button onClick={() => onSec(deger)} aria-pressed={secili === deger}
      className={cn("rounded-lg border px-2 py-2 text-[12.5px] transition-colors", secili === deger ? "border-white bg-white text-black" : "border-kenar text-metin-2 hover:border-kenar-2 hover:text-metin")}>{children ?? deger}</button>
  );

  return (
    <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 14 }} transition={{ duration: 0.16 }} className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2.5 border-b border-white/8 px-3 py-3">
        <button onClick={p.onGeri} className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 hover:bg-white/8 hover:text-metin" aria-label="Araçlara dön"><ChevronLeft className="h-5 w-5" /></button>
        <span className="glass-ikon flex h-8 w-8 items-center justify-center rounded-full"><tanim.ikon className="h-4 w-4 text-metin" /></span>
        <span className="min-w-0 flex-1"><span className="block text-[14.5px] font-semibold">{tanim.ad}</span><span className="block text-[11.5px] leading-snug text-metin-3">{tanim.aciklama}</span></span>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3 [scrollbar-width:thin]">
        {p.id === "renk" && (
          <>
            <div>
              <Baslik>Ön ayarlar</Baslik>
              <div className="grid grid-cols-3 gap-2">
                {RENK_ONAYAR.map((o) => {
                  const r = { ...RENK_SIFIR, ...o.d };
                  return (
                    <button key={o.ad} onClick={() => { p.setRenk(r); p.setOnayar(o.ad); }} aria-pressed={p.onayar === o.ad}
                      className={cn("overflow-hidden rounded-lg text-left ring-inset transition-shadow", p.onayar === o.ad ? "ring-2 ring-white" : "ring-1 ring-white/10 hover:ring-white/25")}>
                      <span className="relative block aspect-square overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.kaynak} alt="" className="h-full w-full object-cover" style={{ filter: renkSuzgeci(r) }} />
                        {r.vinyet > 0 && <span className="absolute inset-0" style={{ background: vinyetArka(r.vinyet) }} />}
                      </span>
                      <span className="block truncate px-1.5 py-1 text-[11px] text-metin">{o.ad}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-3">
              <Baslik>İnce ayar</Baslik>
              {RENK_AYAR.map((a) => (
                <label key={a.k} className="block">
                  <span className="mb-1 flex items-center justify-between text-[12px]">
                    <span className="text-metin-2">{a.ad}</span>
                    <button type="button" onClick={() => p.setRenk({ ...p.renk, [a.k]: 0 })} className={cn("tabular-nums", p.renk[a.k] ? "text-metin hover:text-metin" : "text-metin-3")} title="Sıfırla">{p.renk[a.k] > 0 && a.min < 0 ? "+" : ""}{p.renk[a.k]}</button>
                  </span>
                  <input type="range" min={a.min} max={a.max} value={p.renk[a.k]} onChange={(e) => { p.setRenk({ ...p.renk, [a.k]: Number(e.target.value) }); p.setOnayar("Özel"); }}
                    className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/12 accent-white" aria-label={a.ad} />
                </label>
              ))}
            </div>
          </>
        )}

        {p.id === "varyasyon" && (
          <div>
            <Baslik>Ne kadar farklı olsun?</Baslik>
            <div className="grid grid-cols-2 gap-2">
              {(["Hafif", "Güçlü"] as const).map((t) => <Secim key={t} deger={t} secili={varyasyonGuc} onSec={(v) => setVaryasyonGuc(v as "Hafif" | "Güçlü")} />)}
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-metin-3">{varyasyonGuc === "Hafif" ? "Kompozisyon aynı kalır; küçük ayrıntılar değişir." : "Aynı özne ve stil; yeni kadraj, poz ve açı."}</p>
          </div>
        )}

        {p.id === "iyilestir" && (
          <div>
            <Baslik>Ten görünümü</Baslik>
            <div className="grid grid-cols-3 gap-2">
              {["Yumuşak", "Doğal", "Gerçekçi"].map((t) => <Secim key={t} deger={t} secili={ten} onSec={setTen} />)}
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-metin-3">{ten === "Yumuşak" ? "Pürüzsüz, rötuşlu bir cilt." : ten === "Doğal" ? "Gözenekler korunur, kusurlar azalır." : "Doku ve ayrıntı tam korunur, yalnız netlik artar."}</p>
          </div>
        )}

        {p.id === "isik" && (
          <>
            <div>
              <Baslik>Işığın yönü</Baslik>
              <div className="grid grid-cols-3 gap-1.5">
                {["Sol üst", "Üst", "Sağ üst", "Sol", "Ön", "Sağ", "Sol alt", "Arka", "Sağ alt"].map((y) => <Secim key={y} deger={y} secili={isikYon} onSec={setIsikYon} />)}
              </div>
            </div>
            <div>
              <Baslik>Sertlik</Baslik>
              <div className="grid grid-cols-2 gap-2">{["Yumuşak", "Sert"].map((s) => <Secim key={s} deger={s} secili={isikSert} onSec={setIsikSert} />)}</div>
            </div>
            <div>
              <Baslik>Işık rengi</Baslik>
              <div className="grid grid-cols-2 gap-2">{["Gün ışığı", "Altın saat", "Soğuk mavi", "Neon"].map((s) => <Secim key={s} deger={s} secili={isikRenk} onSec={setIsikRenk} />)}</div>
            </div>
          </>
        )}

        {p.id === "inpaint" && (
          <>
            <div className="glass-cip flex items-center gap-1 rounded-full p-1">
              <button onClick={() => p.setSilgi(false)} aria-pressed={!p.silgi} className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-[12.5px]", !p.silgi ? "glass-cip-aktif text-metin" : "text-metin-2")}><Brush className="h-3.5 w-3.5" /> Fırça</button>
              <button onClick={() => p.setSilgi(true)} aria-pressed={p.silgi} className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-[12.5px]", p.silgi ? "glass-cip-aktif text-metin" : "text-metin-2")}><Eraser className="h-3.5 w-3.5" /> Silgi</button>
            </div>
            <label className="block">
              <span className="mb-1 flex justify-between text-[12px] text-metin-2">Fırça boyutu<span className="tabular-nums text-metin">{p.firca} px</span></span>
              <input type="range" min={8} max={120} value={p.firca} onChange={(e) => p.setFirca(Number(e.target.value))} className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/12 accent-white" aria-label="Fırça boyutu" />
            </label>
            <div className="flex gap-2">
              <button onClick={p.onMaskeGeriAl} className="glass-cip flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[12.5px] text-metin-2 hover:text-metin"><Undo2 className="h-3.5 w-3.5" /> Geri al</button>
              <button onClick={p.onMaskeTemizle} disabled={!p.maskeVar} className="glass-cip flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[12.5px] text-metin-2 hover:text-metin disabled:opacity-40"><X className="h-3.5 w-3.5" /> Temizle</button>
            </div>
            <label className="block">
              <span className="mb-1 block text-[12px] text-metin-2">Boyadığın alan neye dönüşsün?</span>
              <textarea value={inpaintNot} onChange={(e) => setInpaintNot(e.target.value.slice(0, 240))} rows={3} placeholder="ör. kırmızı bir şapka ekle, yazıyı kaldır"
                className="glass-cip w-full resize-none rounded-xl p-2.5 text-[13px] outline-none placeholder:text-metin-3" />
            </label>
          </>
        )}

        {p.id === "reframe" && (
          <>
            <div>
              <Baslik>Hedef oran</Baslik>
              <div className="grid grid-cols-3 gap-2">
                {["16:9", "9:16", "1:1", "4:5", "3:2", "21:9"].map((o) => {
                  const [a, b] = o.split(":").map(Number);
                  return (
                    <Secim key={o} deger={o} secili={hedefOran} onSec={setHedefOran}>
                      <span className="mx-auto mb-1 block rounded-[3px] border-2 border-current" style={{ width: a >= b ? 26 : (26 * a) / b, height: a >= b ? (26 * b) / a : 26 }} />
                      {o}
                    </Secim>
                  );
                })}
              </div>
            </div>
            {p.boyut && (() => {
              const [a, b] = hedefOran.split(":").map(Number);
              const hedef = a / b, mevcut = p.boyut.w / p.boyut.h;
              const ic = mevcut > hedef ? { w: 100, h: (hedef / mevcut) * 100 } : { w: (mevcut / hedef) * 100, h: 100 };
              return (
                <div>
                  <Baslik>Önizleme</Baslik>
                  <div className="mx-auto overflow-hidden rounded-lg border border-dashed border-white/50 bg-white/[0.03]" style={{ aspectRatio: `${a} / ${b}`, width: hedef >= 1 ? "100%" : `${hedef * 100}%` }}>
                    <div className="relative h-full w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.kaynak} alt="" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-cover" style={{ width: `${ic.w}%`, height: `${ic.h}%` }} />
                    </div>
                  </div>
                  <p className="mt-1.5 text-[11.5px] text-metin-3">Kesikli alan yapay zekâyla doldurulur.</p>
                </div>
              );
            })()}
          </>
        )}

        {p.id === "arkaplan" && (
          <div>
            <Baslik>Yeni zemin</Baslik>
            <div className="space-y-1.5">
              {([["seffaf", "Şeffaf (PNG)"], ["beyaz", "Beyaz"], ["renk", "Düz renk"]] as const).map(([id, a]) => (
                <button key={id} onClick={() => setZemin(id)} aria-pressed={zemin === id}
                  className={cn("flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-[13px] transition-colors", zemin === id ? "border-white bg-white/[0.08] text-metin" : "border-kenar text-metin-2 hover:border-kenar-2")}>
                  <span className={cn("h-5 w-5 shrink-0 rounded-md ring-1 ring-white/20", id === "seffaf" && "hf-dama", id === "beyaz" && "bg-white")} style={id === "renk" ? { background: zeminRenk } : undefined} />
                  <span className="flex-1 text-left">{a}</span>
                  {id === "renk" && zemin === "renk" && <input type="color" value={zeminRenk} onChange={(e) => setZeminRenk(e.target.value)} onClick={(e) => e.stopPropagation()} className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent" aria-label="Zemin rengi" />}
                  {zemin === id && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {p.id === "acilar" && (
          <>
            <div>
              <Baslik>Sürükleyerek açıyı seç</Baslik>
              <div ref={padRef} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); padAyarla(e); }} onPointerMove={(e) => { if (e.buttons & 1) padAyarla(e); }}
                className="glass-cip relative aspect-square w-full cursor-crosshair touch-none overflow-hidden rounded-xl" role="slider" aria-label="Kamera açısı" aria-valuetext={`Döndürme ${donme}°, eğim ${egim}°`}>
                <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-white/10" />
                <span className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-white/10" />
                <span className="pointer-events-none absolute inset-6 rounded-full border border-dashed border-white/15" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.kaynak} alt="" className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-lg object-cover opacity-80" style={{ transform: `translate(-50%,-50%) perspective(300px) rotateY(${donme / 4}deg) rotateX(${egim / 4}deg)` }} />
                <span className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black bg-white" style={{ left: `${(donme / 360 + 0.5) * 100}%`, top: `${(0.5 - egim / 180) * 100}%` }} />
                <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-[10.5px] text-metin-3">Yatay: döndürme · Dikey: eğim</span>
              </div>
            </div>
            {([["Döndürme", donme, setDonme, -180, 180, "°"], ["Eğim", egim, setEgim, -90, 90, "°"], ["Yakınlaştır", yakin, setYakin, 0, 100, "%"]] as const).map(([a, d, set, mn, mx, b]) => (
              <label key={a} className="block">
                <span className="mb-1 flex justify-between text-[12px] text-metin-2">{a}<span className="tabular-nums text-metin">{d}{b}</span></span>
                <input type="range" min={mn} max={mx} value={d} onChange={(e) => set(Number(e.target.value))} className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/12 accent-white" aria-label={a} />
              </label>
            ))}
            <button onClick={() => { setDonme(0); setEgim(0); setYakin(0); }} className="text-[12px] text-metin-3 hover:text-metin">Sıfırla</button>
          </>
        )}
      </div>

      <div className="border-t border-white/8 p-3">{altButon}</div>
    </motion.div>
  );
}
