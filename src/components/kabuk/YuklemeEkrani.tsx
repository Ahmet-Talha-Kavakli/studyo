"use client";

/**
 * Yükleme ekranı "Akış" (kullanıcı seçimi, 2026-11-07; logosuz).
 * Derinlik katmanlı ince ışık şeritleri ekranın iki ucuna uzanarak akar, birbirinin üstünden ipek gibi kıvrılır;
 * üzerlerinden soldan sağa geçen ışık ilerlemeyi anlatır. bitis=true olunca şeritler tek parlak kıvrımda toplanır,
 * ekran o çizgiden açılır ve onBitti çağrılır (marka açılışı). Sayfa geçişinde (kompakt) toplanma yok.
 * Tuval tek katmanda çizilir, ışıma için ayrı bir keskin katman bulanıklaştırılarak üstüne eklenir.
 * Hareketi azalt açıkken tek bir durgun kare çizilir.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const VARSAYILAN = ["Çalışma alanın hazırlanıyor", "Projelerin getiriliyor", "Modeller bağlanıyor"];

const kis = (v: number) => Math.max(0, Math.min(1, v));
const yum = (t: number) => t * t * (3 - 2 * t);
const kolay = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Deterministik rastgele: her şeridin karakteri her açılışta aynı. */
const rs = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

type Serit = { k: number; z: number; f1: number; f2: number; s1: number; s2: number; p: number };

function seritler(n: number): Serit[] {
  return Array.from({ length: n }, (_, i) => ({
    k: i / (n - 1), z: 0.35 + 0.65 * rs(i + 3),
    f1: 0.75 + rs(i + 11) * 0.6, f2: 1.6 + rs(i + 19) * 0.9,
    s1: 0.32 + rs(i + 23) * 0.3, s2: 0.22 + rs(i + 29) * 0.25, p: rs(i + 41) * 6.283,
  }));
}

/** Şeridin y değeri: ortak kıvrım + şeride özgü dalga + ipek dönüşü (şeritler birbirinin üstünden geçer). */
function yDegeri(s: Serit, u: number, t: number, g: number, cy: number, H: number) {
  const zarf = Math.pow(Math.sin(Math.PI * u), 0.85);
  const ana = Math.sin(6.283 * u * 0.85 + t * 0.45) * H * 0.07 + Math.sin(6.283 * u * 0.35 - t * 0.3) * H * 0.04;
  const dalga = (Math.sin(6.283 * u * s.f1 + t * s.s1 + s.p) * 0.62 + Math.sin(6.283 * u * s.f2 - t * s.s2 + s.p * 1.7) * 0.38) * H * 0.13 * zarf;
  const genis = (s.k - 0.5) * 2 * Math.cos(Math.PI * u * 1.6 + t * 0.55 + 0.6) * H * 0.16 * zarf;
  return cy + ana * zarf + (dalga + genis) * (1 - g);
}

export function AkisTuvali({ kompakt = false, bitis = false, onBitti, merkez = 0.46, className }: {
  kompakt?: boolean; bitis?: boolean; onBitti?: () => void; merkez?: number; className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const bitisRef = useRef<number | null>(null);
  const bittiRef = useRef(onBitti);
  bittiRef.current = onBitti;
  useEffect(() => { if (bitis && bitisRef.current === null) bitisRef.current = performance.now(); }, [bitis]);

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const x = c.getContext("2d"); if (!x) return;
    const k = document.createElement("canvas"), kx = k.getContext("2d"); if (!kx) return;
    const azalt = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("hareket-azalt");
    const S = seritler(kompakt ? 24 : 44);
    const KV = Array.from({ length: kompakt ? 10 : 24 }, (_, i) => ({ s: Math.floor(rs(i + 71) * S.length), u: rs(i + 83), h: 0.035 + rs(i + 97) * 0.05, b: 0.6 + rs(i + 101) * 0.8 }));
    let w = 0, h = 0, o = 1, kare = 0, bittiCagrildi = false;
    const t0 = performance.now();
    const boyut = () => {
      const r = c.getBoundingClientRect(); o = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      for (const cv of [c, k]) { cv.width = Math.max(1, Math.round(w * o)); cv.height = Math.max(1, Math.round(h * o)); }
    };
    const ro = new ResizeObserver(boyut); ro.observe(c); boyut();

    const ciz = (simdi: number) => {
      if (!w || !h) return;
      const t = azalt ? 2.4 : (simdi - t0) / 1000;
      const bt = bitisRef.current === null ? -1 : (simdi - bitisRef.current) / 1000;
      const H = Math.min(h, w * 0.75), cy = h * merkez;
      const belir = yum(kis(t / (kompakt ? 0.5 : 0.8)));
      const g = bt < 0 || kompakt ? 0 : kolay(kis(bt / 0.85));
      const acil = bt < 0 || kompakt ? 0 : kis((bt - 0.75) / 0.85);
      const son = bt < 0 ? 1 : kompakt ? 1 - yum(kis(bt / 0.3)) : 1 - yum(kis((bt - 0.95) / 0.6));
      const tarama = ((t * 0.55) % 1.35) - 0.17;

      kx.setTransform(o, 0, 0, o, 0, 0);
      kx.clearRect(0, 0, w, h);
      kx.globalCompositeOperation = "lighter";
      kx.lineCap = "round";
      const adim = Math.max(3, w / 260);
      for (const s of S) {
        const merkezlik = 1 - Math.abs(s.k - 0.5) * 2;
        const al = (0.06 + 0.3 * merkezlik) * s.z * belir * son * (1 + g * 1.6) * (kompakt ? 0.85 : 1);
        if (al < 0.004) continue;
        const lg = kx.createLinearGradient(0, 0, w, 0);
        const yogun = Math.sin(Math.PI * kis(tarama)) * (1 - g);
        const duraklar: [number, string][] = [[0, "rgba(40,150,190,0)"], [0.08, `rgba(45,160,200,${al * 0.75})`]];
        for (const [d, r] of [[tarama - 0.16, `rgba(85,214,253,${al})`], [tarama, `rgba(232,250,255,${Math.min(1, al * (1 + 1.5 * yogun))})`], [tarama + 0.16, `rgba(85,214,253,${al})`]] as [number, string][])
          if (d > 0.09 && d < 0.91) duraklar.push([d, r]);
        duraklar.push([0.92, `rgba(45,160,200,${al * 0.75})`], [1, "rgba(40,150,190,0)"]);
        let onceki = -1;
        for (const [d, r] of duraklar) { const dd = Math.max(onceki + 0.0005, d); lg.addColorStop(Math.min(1, dd), r); onceki = dd; }
        kx.strokeStyle = lg;
        kx.lineWidth = (0.55 + s.z * 0.9) * (kompakt ? 0.8 : 1) * (1 + g * 0.4);
        const tt = t * (0.75 + s.z * 0.5);
        kx.beginPath();
        let px = 0, py = yDegeri(s, 0, tt, g, cy, H);
        kx.moveTo(px, py);
        for (let X = adim; X <= w + adim; X += adim) {
          const nx = Math.min(X, w), ny = yDegeri(s, nx / w, tt, g, cy, H);
          kx.quadraticCurveTo(px, py, (px + nx) / 2, (py + ny) / 2);
          px = nx; py = ny;
        }
        kx.lineTo(px, py);
        kx.stroke();
      }
      for (const q of KV) {
        const s = S[q.s], u = (q.u + t * q.h) % 1, zarf = Math.sin(Math.PI * u);
        const a = zarf * zarf * belir * son * (1 - g) * 0.9 * q.b * s.z;
        if (a < 0.02) continue;
        const qx = u * w, qy = yDegeri(s, u, t * (0.75 + s.z * 0.5), g, cy, H), r = 2.2 + s.z * 2.4;
        const rg = kx.createRadialGradient(qx, qy, 0, qx, qy, r * 3);
        rg.addColorStop(0, `rgba(240,252,255,${a})`); rg.addColorStop(0.35, `rgba(85,214,253,${a * 0.5})`); rg.addColorStop(1, "rgba(85,214,253,0)");
        kx.fillStyle = rg; kx.fillRect(qx - r * 3, qy - r * 3, r * 6, r * 6);
      }

      x.setTransform(1, 0, 0, 1, 0, 0);
      x.globalCompositeOperation = "source-over";
      x.clearRect(0, 0, c.width, c.height);
      const zg = x.createRadialGradient(c.width / 2, cy * o, 0, c.width / 2, cy * o, Math.max(c.width, c.height) * 0.55);
      zg.addColorStop(0, `rgba(30,110,140,${0.14 * belir * son * (1 + g)})`); zg.addColorStop(1, "rgba(30,110,140,0)");
      x.fillStyle = zg; x.fillRect(0, 0, c.width, c.height);
      x.globalCompositeOperation = "lighter";
      x.filter = `blur(${Math.round(10 * o)}px)`; x.globalAlpha = 0.95; x.drawImage(k, 0, 0);
      if (!kompakt) { x.filter = `blur(${Math.round(28 * o)}px)`; x.globalAlpha = 0.6; x.drawImage(k, 0, 0); }
      x.filter = "none"; x.globalAlpha = 1; x.drawImage(k, 0, 0);
      if (acil > 0) {
        const a = Math.sin(Math.PI * Math.min(1, acil * 1.1));
        const yari = c.width * (0.55 + kolay(acil) * 0.35), dik = Math.max(0.02, kolay(acil) * 1.25);
        x.save();
        x.translate(c.width / 2, cy * o); x.scale(1, dik * (c.height / yari));
        const eg = x.createRadialGradient(0, 0, 0, 0, 0, yari);
        eg.addColorStop(0, `rgba(230,250,255,${0.42 * a})`); eg.addColorStop(0.35, `rgba(85,214,253,${0.22 * a})`); eg.addColorStop(1, "rgba(85,214,253,0)");
        x.fillStyle = eg; x.beginPath(); x.arc(0, 0, yari, 0, 6.283); x.fill();
        x.restore();
      }
      x.globalCompositeOperation = "source-over";
      if (bt >= 0 && !bittiCagrildi && bt > (kompakt ? 0.3 : 1.5)) { bittiCagrildi = true; bittiRef.current?.(); }
    };

    const dongu = (s: number) => { ciz(s); if (!azalt || bitisRef.current !== null) kare = requestAnimationFrame(dongu); };
    kare = requestAnimationFrame(dongu);
    return () => { cancelAnimationFrame(kare); ro.disconnect(); };
  }, [kompakt, merkez]);

  return <canvas ref={ref} aria-hidden className={cn("pointer-events-none absolute inset-0 h-full w-full", className)} />;
}

/** Sırayla değişen durum cümlesi (yumuşak bulanık geçişle). */
function DurumYazisi({ durumlar, kucuk }: { durumlar: string[]; kucuk?: boolean }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (durumlar.length < 2) return;
    const t = setInterval(() => setI((v) => Math.min(v + 1, durumlar.length - 1)), 1600);
    return () => clearInterval(t);
  }, [durumlar.length]);
  return (
    <div className={cn("relative w-72 overflow-hidden text-center", kucuk ? "h-5" : "h-6")}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={i} initial={{ y: 8, opacity: 0, filter: "blur(3px)" }} animate={{ y: 0, opacity: 1, filter: "blur(0px)" }} exit={{ y: -8, opacity: 0, filter: "blur(3px)" }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className={cn("absolute inset-x-0 font-medium tracking-[-0.01em] text-white/70", kucuk ? "text-[13px]" : "text-[14.5px]")}>
          {durumlar[i]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/** Akış + durum yazısı; bulunduğu kutuyu doldurur. */
export function YuklemeIsigi({ durumlar = VARSAYILAN, kucuk = false, bitis = false, onBitti }: { durumlar?: string[]; kucuk?: boolean; bitis?: boolean; onBitti?: () => void }) {
  return (
    <div role="status" aria-live="polite" aria-label="Yükleniyor" className="absolute inset-0">
      <AkisTuvali kompakt={kucuk} bitis={bitis} onBitti={onBitti} merkez={0.45} />
      <motion.div animate={{ opacity: bitis ? 0 : 1 }} transition={{ duration: 0.35 }} className="absolute inset-x-0 top-[calc(45%+min(26vh,230px))] flex justify-center">
        <DurumYazisi durumlar={durumlar} kucuk={kucuk} />
      </motion.div>
    </div>
  );
}

/**
 * Sayfa geçişi: ekranın tamamına sabitlenir (üst çubuk ve kenar çubuğu üstte kalır), zemini sayfanın zeminidir;
 * böylece kutu kenarı ya da renk farkı oluşmaz ve şeritler her sayfada ekranın tam ortasında durur.
 */
export function YuklemeEkrani({ durumlar, className }: { durumlar?: string[]; className?: string }) {
  return (
    <>
      <div className="min-h-[70vh] w-full flex-1" aria-hidden />
      <div className={cn("pointer-events-none fixed inset-0 z-[5] bg-zemin", className)}>
        <YuklemeIsigi durumlar={durumlar} kucuk />
      </div>
    </>
  );
}

/** Uygulama hazırlanırken (hesap okunurken) tam ekran; açılış ekranıyla aynı görünüm. */
export function TamEkranYukleme() {
  return (
    <div className="fixed inset-0 z-[199] bg-zemin">
      <YuklemeIsigi durumlar={["Çalışma alanın hazırlanıyor"]} />
    </div>
  );
}
