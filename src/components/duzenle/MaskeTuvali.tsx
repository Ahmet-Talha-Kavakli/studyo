"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

export type MaskeArac = "firca" | "silgi" | "kutu" | "kement" | "akilli" | "el";
export type MaskeTuvaliRef = {
  /** `yumusat` (px): kenarları bulanıklaştırarak yumuşak geçişli maske verir. */
  maskeAl: (yumusat?: number) => string | null; temizle: () => void; tersCevir: () => void; geriAl: () => void; ileriAl: () => void;
  yakinlas: (k: number) => void; sigdir: () => void; maskeUygula: (url: string, cikar?: boolean) => Promise<void>; genislet: (px: number) => void;
};
type Props = {
  src: string; arac: MaskeArac; boyut: number; kapali?: boolean; sonuc?: string | null; karsilastir?: number;
  onDurum?: (d: { alan: number; geri: boolean; ileri: boolean; zoom: number; w: number; h: number }) => void;
  onAkilliTik?: (x: number, y: number, cikar: boolean) => void; akilliMesgul?: boolean;
  /** Sonuç gösterilirken görselin üzerinde sürüklenen karşılaştırma çizgisi. */
  onKarsilastir?: (yuzde: number) => void;
  /** Üstte yüzen arayüzün kapladığı kenar payları (px) — görsel kalan alana sığdırılır ve ortalanır. */
  pay?: { ust: number; alt: number; sol: number; sag: number };
  /** Seçim katmanını gizle (yalnız görünüm; maske korunur). */
  maskeGizli?: boolean;
  /** Üretim sürüyor: seçili alanın (yoksa tüm görselin) üzerinde tarama ışığı. */
  isleniyor?: boolean;
  /** Değişince fırça boyutu tuvalin ortasında kısa süre önizlenir. */
  boyutOnizle?: number;
};

const RENK = "rgb(85,214,253)";
const MAKS_GECMIS = 30;

/**
 * Maske tuvali: görselin GERÇEK çözünürlüğünde maske tutar (beyaz = düzenlenecek alan olarak dışa
 * verilir). Fırça, silgi, dikdörtgen, akıllı seçim (dışarıdan gelen maske), yakınlaştırma ve kaydırma.
 */
export const MaskeTuvali = forwardRef<MaskeTuvaliRef, Props>(function MaskeTuvali({ src, arac, boyut, kapali, sonuc, karsilastir = 50, onDurum, onAkilliTik, akilliMesgul, onKarsilastir, pay, maskeGizli, isleniyor, boyutOnizle }, ref) {
  const kap = useRef<HTMLDivElement>(null);
  const tuval = useRef<HTMLCanvasElement>(null);
  const [dogal, setDogal] = useState<{ w: number; h: number } | null>(null);
  const [sigdirOlcek, setSigdirOlcek] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [kaydir, setKaydir] = useState({ x: 0, y: 0 });
  const [imlec, setImlec] = useState<{ x: number; y: number } | null>(null);
  const [kutu, setKutu] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  // Kement: serbest çizilen kapalı yol; bırakınca içi doldurulur (Alt basılıysa çıkarılır).
  const [kement, setKement] = useState<{ x: number; y: number }[] | null>(null);
  const kementCikar = useRef(false);
  const [bosluk, setBosluk] = useState(false);
  const gecmis = useRef<ImageData[]>([]);
  const ileri = useRef<ImageData[]>([]);
  const son = useRef<{ x: number; y: number } | null>(null);
  const surukle = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [alan, setAlan] = useState(0);
  /** Seçimin küçültülmüş hâli — üstte kayan çizgili desen için CSS maskesi. */
  const [desen, setDesen] = useState<string | null>(null);
  const cizgiSurukle = useRef(false);
  const [boyutGoster, setBoyutGoster] = useState(false);
  const ilkOnizle = useRef(true);
  useEffect(() => {
    if (ilkOnizle.current) { ilkOnizle.current = false; return; }
    if (boyutOnizle === undefined) return;
    setBoyutGoster(true);
    const t = setTimeout(() => setBoyutGoster(false), 700);
    return () => clearTimeout(t);
  }, [boyutOnizle]);

  // Görsel boyutu
  useEffect(() => {
    setDogal(null);
    const i = new Image(); i.crossOrigin = "anonymous";
    i.onload = () => setDogal({ w: i.naturalWidth, h: i.naturalHeight });
    i.src = src;
  }, [src]);
  // Tuvali gerçek boyuta kur
  useEffect(() => {
    if (!dogal || !tuval.current) return;
    tuval.current.width = dogal.w; tuval.current.height = dogal.h;
    gecmis.current = []; ileri.current = []; setAlan(0); setDesen(null);
  }, [dogal]);
  // Sığdırma ölçeği
  const olc = useCallback(() => {
    const k = kap.current; if (!k || !dogal) return;
    const p = pay ?? { ust: 24, alt: 24, sol: 24, sag: 24 };
    setSigdirOlcek(Math.max(0.05, Math.min((k.clientWidth - p.sol - p.sag) / dogal.w, (k.clientHeight - p.ust - p.alt) / dogal.h, 4)));
  }, [dogal, pay?.ust, pay?.alt, pay?.sol, pay?.sag]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { olc(); const r = new ResizeObserver(olc); if (kap.current) r.observe(kap.current); return () => r.disconnect(); }, [olc]);
  useEffect(() => {
    const d = (e: KeyboardEvent) => { if (e.code === "Space" && !/^(INPUT|TEXTAREA)$/.test((e.target as HTMLElement).tagName)) { e.preventDefault(); setBosluk(true); } };
    const u = (e: KeyboardEvent) => { if (e.code === "Space") setBosluk(false); };
    window.addEventListener("keydown", d); window.addEventListener("keyup", u);
    return () => { window.removeEventListener("keydown", d); window.removeEventListener("keyup", u); };
  }, []);

  const olcek = sigdirOlcek * zoom;
  const ctx = () => tuval.current?.getContext("2d", { willReadFrequently: true }) ?? null;
  const alanHesapla = useCallback(() => {
    const c = tuval.current; if (!c || !c.width) return;
    const k = Math.min(1, 160 / Math.max(c.width, c.height));
    const o = document.createElement("canvas"); o.width = Math.max(1, Math.round(c.width * k)); o.height = Math.max(1, Math.round(c.height * k));
    const x = o.getContext("2d")!; x.drawImage(c, 0, 0, o.width, o.height);
    const d = x.getImageData(0, 0, o.width, o.height).data;
    let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++;
    setAlan(n / (o.width * o.height));
    // Desen maskesi (en uzun kenar 900 px) — yalnız fırça bırakılınca üretilir, çizim sırasında değil.
    if (!n) { setDesen(null); return; }
    const k2 = Math.min(1, 900 / Math.max(c.width, c.height));
    const m = document.createElement("canvas"); m.width = Math.max(1, Math.round(c.width * k2)); m.height = Math.max(1, Math.round(c.height * k2));
    m.getContext("2d")!.drawImage(c, 0, 0, m.width, m.height);
    setDesen(m.toDataURL("image/png"));
  }, []);
  useEffect(() => { onDurum?.({ alan, geri: gecmis.current.length > 0, ileri: ileri.current.length > 0, zoom, w: dogal?.w ?? 0, h: dogal?.h ?? 0 }); }, [alan, zoom, dogal, onDurum]);

  const kaydet = () => {
    const c = ctx(); if (!c || !tuval.current) return;
    gecmis.current.push(c.getImageData(0, 0, tuval.current.width, tuval.current.height));
    if (gecmis.current.length > MAKS_GECMIS) gecmis.current.shift();
    ileri.current = [];
  };
  const nokta = (e: React.PointerEvent) => {
    const r = tuval.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * tuval.current!.width, y: ((e.clientY - r.top) / r.height) * tuval.current!.height };
  };
  const ciz = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const c = ctx(); if (!c) return;
    c.globalCompositeOperation = arac === "silgi" ? "destination-out" : "source-over";
    c.strokeStyle = RENK; c.fillStyle = RENK; c.lineCap = "round"; c.lineJoin = "round"; c.lineWidth = boyut;
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    c.beginPath(); c.arc(b.x, b.y, boyut / 2, 0, Math.PI * 2); c.fill();
  };

  const kaydirMi = arac === "el" || bosluk;
  const cizgiKonum = (e: React.PointerEvent) => {
    const r = tuval.current?.getBoundingClientRect(); if (!r) return;
    onKarsilastir?.(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)));
  };
  const asagi = (e: React.PointerEvent) => {
    if (sonuc && onKarsilastir && !kaydirMi) { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); cizgiSurukle.current = true; cizgiKonum(e); return; }
    if (kapali || !dogal) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    if (kaydirMi || e.button === 1) { surukle.current = { x: e.clientX, y: e.clientY, ox: kaydir.x, oy: kaydir.y }; return; }
    const p = nokta(e);
    if (arac === "akilli") { if (!akilliMesgul) onAkilliTik?.(p.x, p.y, e.altKey || e.button === 2); return; }
    kaydet();
    if (arac === "kutu") { setKutu({ x0: p.x, y0: p.y, x1: p.x, y1: p.y }); return; }
    if (arac === "kement") { kementCikar.current = e.altKey; setKement([p]); return; }
    son.current = p; ciz(p, p);
  };
  const hareket = (e: React.PointerEvent) => {
    if (cizgiSurukle.current) { cizgiKonum(e); return; }
    if (dogal && tuval.current) { const r = tuval.current.getBoundingClientRect(); setImlec({ x: e.clientX - r.left, y: e.clientY - r.top }); }
    if (surukle.current) { setKaydir({ x: surukle.current.ox + e.clientX - surukle.current.x, y: surukle.current.oy + e.clientY - surukle.current.y }); return; }
    if (!e.buttons || kapali) return;
    const p = nokta(e);
    if (kutu) { setKutu({ ...kutu, x1: p.x, y1: p.y }); return; }
    if (kement) { const l = kement[kement.length - 1]; if (Math.hypot(p.x - l.x, p.y - l.y) > 3 / olcek) setKement([...kement, p]); return; }
    if (son.current) { ciz(son.current, p); son.current = p; }
  };
  const yukari = () => {
    if (cizgiSurukle.current) { cizgiSurukle.current = false; return; }
    if (surukle.current) { surukle.current = null; return; }
    if (kutu) {
      const c = ctx();
      if (c) { c.globalCompositeOperation = "source-over"; c.fillStyle = RENK; c.fillRect(Math.min(kutu.x0, kutu.x1), Math.min(kutu.y0, kutu.y1), Math.abs(kutu.x1 - kutu.x0), Math.abs(kutu.y1 - kutu.y0)); }
      setKutu(null);
    }
    if (kement) {
      const c = ctx();
      if (c && kement.length > 2) {
        c.globalCompositeOperation = kementCikar.current ? "destination-out" : "source-over"; c.fillStyle = RENK;
        c.beginPath(); c.moveTo(kement[0].x, kement[0].y); kement.slice(1).forEach((q) => c.lineTo(q.x, q.y)); c.closePath(); c.fill();
        c.globalCompositeOperation = "source-over";
      }
      setKement(null);
    }
    if (son.current || kutu || kement) alanHesapla();
    son.current = null;
  };

  useImperativeHandle(ref, () => ({
    maskeAl: (yumusat = 0) => {
      const c = tuval.current; if (!c || !c.width || alan <= 0) return null;
      const o = document.createElement("canvas"); o.width = c.width; o.height = c.height;
      const x = o.getContext("2d")!; x.fillStyle = "#000"; x.fillRect(0, 0, o.width, o.height);
      x.globalCompositeOperation = "destination-out"; x.drawImage(c, 0, 0);
      x.globalCompositeOperation = "destination-over"; x.fillStyle = "#fff"; x.fillRect(0, 0, o.width, o.height);
      if (yumusat <= 0) return o.toDataURL("image/png");
      // Kenar yumuşatma: maskeyi bulanıklaştır (beyaz alan siyaha yumuşak geçer).
      const y = document.createElement("canvas"); y.width = o.width; y.height = o.height;
      const yx = y.getContext("2d")!; yx.fillStyle = "#000"; yx.fillRect(0, 0, y.width, y.height);
      yx.filter = `blur(${yumusat}px)`; yx.drawImage(o, 0, 0);
      return y.toDataURL("image/png");
    },
    temizle: () => { const c = ctx(); if (!c || !tuval.current) return; kaydet(); c.clearRect(0, 0, tuval.current.width, tuval.current.height); alanHesapla(); },
    tersCevir: () => {
      const c = ctx(); if (!c || !tuval.current) return; kaydet();
      const { width: w, height: h } = tuval.current;
      const d = c.getImageData(0, 0, w, h);
      for (let i = 0; i < d.data.length; i += 4) { const dolu = d.data[i + 3] > 40; d.data[i] = 85; d.data[i + 1] = 214; d.data[i + 2] = 253; d.data[i + 3] = dolu ? 0 : 255; }
      c.putImageData(d, 0, 0); alanHesapla();
    },
    geriAl: () => { const c = ctx(); const p = gecmis.current.pop(); if (!c || !p || !tuval.current) return; ileri.current.push(c.getImageData(0, 0, tuval.current.width, tuval.current.height)); c.putImageData(p, 0, 0); alanHesapla(); },
    ileriAl: () => { const c = ctx(); const p = ileri.current.pop(); if (!c || !p || !tuval.current) return; gecmis.current.push(c.getImageData(0, 0, tuval.current.width, tuval.current.height)); c.putImageData(p, 0, 0); alanHesapla(); },
    yakinlas: (k) => setZoom((z) => Math.max(0.25, Math.min(8, z * k))),
    sigdir: () => { setZoom(1); setKaydir({ x: 0, y: 0 }); },
    genislet: (px) => {
      const c = ctx(); if (!c || !tuval.current || px <= 0) return; kaydet();
      const o = document.createElement("canvas"); o.width = tuval.current.width; o.height = tuval.current.height;
      const x = o.getContext("2d")!; x.filter = `blur(${px}px)`; x.drawImage(tuval.current, 0, 0);
      const d = x.getImageData(0, 0, o.width, o.height);
      for (let i = 0; i < d.data.length; i += 4) { const dolu = d.data[i + 3] > 8; d.data[i] = 85; d.data[i + 1] = 214; d.data[i + 2] = 253; d.data[i + 3] = dolu ? 255 : 0; }
      c.putImageData(d, 0, 0); alanHesapla();
    },
    maskeUygula: async (url, cikar) => {
      const c = ctx(); if (!c || !tuval.current) return;
      const m = await new Promise<HTMLImageElement>((coz, red) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => coz(i); i.onerror = red; i.src = url; }).catch(() => null);
      if (!m) return void toast.error("Seçim maskesi okunamadı", { description: "Maske görseli açılamadı. Yeniden seç ya da fırçayla boya." });
      kaydet();
      const o = document.createElement("canvas"); o.width = tuval.current.width; o.height = tuval.current.height;
      const x = o.getContext("2d")!; x.drawImage(m, 0, 0, o.width, o.height);
      const d = x.getImageData(0, 0, o.width, o.height);
      for (let i = 0; i < d.data.length; i += 4) {
        const secili = d.data[i + 3] > 40 && (d.data[i] + d.data[i + 1] + d.data[i + 2]) / 3 > 127;
        d.data[i] = 85; d.data[i + 1] = 214; d.data[i + 2] = 253; d.data[i + 3] = secili ? 255 : 0;
      }
      x.putImageData(d, 0, 0);
      c.globalCompositeOperation = cikar ? "destination-out" : "source-over";
      c.drawImage(o, 0, 0);
      alanHesapla();
    },
  }));

  const W = (dogal?.w ?? 0) * olcek, H = (dogal?.h ?? 0) * olcek;
  const imlecCap = boyut * olcek;
  return (
    <div ref={kap} className={cn("relative h-full w-full overflow-hidden bg-[radial-gradient(ellipse_at_center,#16171a_0%,#0d0e10_70%)]", sonuc && onKarsilastir && !kaydirMi ? "cursor-ew-resize" : kaydirMi ? "cursor-grab active:cursor-grabbing" : kapali ? "cursor-default" : arac === "akilli" ? "cursor-crosshair" : arac === "kutu" || arac === "kement" ? "cursor-crosshair" : "cursor-none")}
      onWheel={(e) => {
        if (!dogal || !kap.current) return;
        // Tekerlek: imlecin bulunduğu noktaya doğru yakınlaştır (nokta yerinde kalır).
        const z2 = Math.max(0.25, Math.min(8, zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
        if (z2 === zoom) return;
        const r0 = kap.current.getBoundingClientRect();
        const cx = r0.left + r0.width / 2 + ((pay?.sol ?? 0) - (pay?.sag ?? 0)) / 2;
        const cy = r0.top + r0.height / 2 + ((pay?.ust ?? 0) - (pay?.alt ?? 0)) / 2;
        const px = e.clientX - cx - kaydir.x, py = e.clientY - cy - kaydir.y;
        const k = z2 / zoom;
        setZoom(z2);
        setKaydir(z2 === 1 && zoom > 1 && Math.abs(kaydir.x) < 4 ? { x: 0, y: 0 } : { x: kaydir.x + px * (1 - k), y: kaydir.y + py * (1 - k) });
      }}
      onContextMenu={(e) => arac === "akilli" && e.preventDefault()}>
      {!dogal && <span className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-metin-3" /></span>}
      {dogal && (
        <div className="absolute left-1/2 top-1/2 touch-none select-none" style={{ width: W, height: H, transform: `translate(calc(-50% + ${kaydir.x + ((pay?.sol ?? 0) - (pay?.sag ?? 0)) / 2}px), calc(-50% + ${kaydir.y + ((pay?.ust ?? 0) - (pay?.alt ?? 0)) / 2}px))` }}
          onPointerDown={asagi} onPointerMove={hareket} onPointerUp={yukari} onPointerCancel={yukari} onPointerLeave={() => { setImlec(null); }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-md bg-[#1b1c1f] bg-[repeating-conic-gradient(#ffffff0a_0%_25%,transparent_0%_50%)] bg-[length:14px_14px] ring-1 ring-white/[0.08]" />
          <img src={src} alt="Düzenlenecek görsel" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full rounded-md" />
          <canvas ref={tuval} className={cn("pointer-events-none absolute inset-0 h-full w-full opacity-30 transition-opacity", (sonuc || kapali || maskeGizli) && "opacity-0")} />
          {desen && !sonuc && !kapali && !maskeGizli && (
            <span className="maske-desen pointer-events-none absolute inset-0"
              style={{ WebkitMaskImage: `url(${desen})`, maskImage: `url(${desen})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" }} />
          )}
          {sonuc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sonuc} alt="Sonuç" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full rounded-md object-cover" style={{ clipPath: `inset(0 0 0 ${karsilastir}%)` }} />
          )}
          {sonuc && (
            <>
              <span className="pointer-events-none absolute inset-y-0 w-[2px] -translate-x-1/2 bg-white" style={{ left: `${karsilastir}%` }} />
              <span className="pointer-events-none absolute top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-0.5 rounded-full bg-white text-[#0a0a0b]" style={{ left: `${karsilastir}%` }}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6-6 6 6 6M15 6l6 6-6 6" /></svg>
              </span>
              <span className={cn("pointer-events-none absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11.5px] font-semibold text-white backdrop-blur transition-opacity", karsilastir < 12 && "opacity-0")}>Önce</span>
              <span className={cn("pointer-events-none absolute right-3 top-3 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-semibold text-black transition-opacity", karsilastir > 88 && "opacity-0")}>Sonra</span>
            </>
          )}
          {isleniyor && !sonuc && (
            <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-md"
              style={desen && !kapali ? { WebkitMaskImage: `url(${desen})`, maskImage: `url(${desen})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" } : undefined}>
              <span className="absolute inset-0 bg-aksan/10" />
              <span className="uy-tara" />
            </span>
          )}
          {kement && kement.length > 1 && (
            <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${dogal.w} ${dogal.h}`} preserveAspectRatio="none">
              <polygon points={kement.map((q) => `${q.x},${q.y}`).join(" ")} fill="rgba(85,214,253,0.2)" stroke="#fff" strokeWidth={2 / olcek} strokeDasharray={`${6 / olcek} ${4 / olcek}`} />
            </svg>
          )}
          {kutu && (
            <span className="pointer-events-none absolute border-2 border-dashed border-white bg-aksan/20"
              style={{ left: Math.min(kutu.x0, kutu.x1) * olcek, top: Math.min(kutu.y0, kutu.y1) * olcek, width: Math.abs(kutu.x1 - kutu.x0) * olcek, height: Math.abs(kutu.y1 - kutu.y0) * olcek }} />
          )}
          {imlec && !kaydirMi && (arac === "firca" || arac === "silgi") && !kapali && (
            <span className={cn("pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px]", arac === "silgi" ? "border-rose-300 bg-rose-300/10" : "border-white bg-aksan/15")}
              style={{ left: imlec.x, top: imlec.y, width: Math.max(6, imlecCap), height: Math.max(6, imlecCap), boxShadow: "0 0 0 1px rgba(0,0,0,.55), inset 0 0 0 1px rgba(0,0,0,.35)" }}>
              <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
            </span>
          )}
        </div>
      )}
      {boyutGoster && dogal && (
        <span className="pointer-events-none absolute left-1/2 top-1/2 flex items-center justify-center rounded-full border-2 border-white bg-aksan/20 shadow-[0_0_0_1px_rgba(0,0,0,.5)]"
          style={{ width: Math.max(6, imlecCap), height: Math.max(6, imlecCap), transform: `translate(calc(-50% + ${((pay?.sol ?? 0) - (pay?.sag ?? 0)) / 2}px), calc(-50% + ${((pay?.ust ?? 0) - (pay?.alt ?? 0)) / 2}px))` }}>
          <span className="rounded-full bg-black/60 px-1.5 py-px text-[10.5px] font-semibold tabular-nums text-white">{boyut}px</span>
        </span>
      )}
      {akilliMesgul && <span className="absolute left-1/2 top-16 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-[12px] text-white backdrop-blur"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Nesne seçiliyor</span>}
    </div>
  );
});
