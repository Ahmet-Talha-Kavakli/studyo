"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight, Clock, ImageIcon, Wand2 } from "lucide-react";
import { RESMI_PRESETLER, KATEGORI_AD, type KatalogPreset } from "@/lib/presetKatalog";
import { KrediJeton } from "@/components/ui/KrediHap";
import { cn } from "@/lib/utils";
import { OrtamIsigi, useYumusak } from "./performans";

const ease = [0.22, 1, 0.36, 1] as const;
const VH = "/gercek/video-hareket";

/** Gerçek örnek videosu olan presetler. Kamera hareketi presetleri aynı hareketin Vayra'daki gerçek çıktısını kullanır. */
const KAMERA: Record<string, string> = { "bullet-time": "bullet-time", "fpv-dive": "fpv-dive", vertigo: "vertigo", "crash-zoom": "crash-zoom" };
type Kart = KatalogPreset & { video: string };
const SIRA = ["earth-zoom", "action-figure", "selfie-twin", "bullet-time", "fairytale-castle", "elevate", "moonwalk", "fpv-dive", "sticker-peel", "sketch-to-fabric", "vertigo", "orbit-360", "float-spin", "crash-zoom", "cardboard-cutout"];
const PRESETLER: Kart[] = SIRA.map((s) => {
  const p = RESMI_PRESETLER.find((x) => x.slug === s);
  if (!p) return null;
  if (p.video) return p as Kart;
  const k = KAMERA[s];
  return k ? { ...p, video: `${VH}/${k}.mp4`, kapak: `${VH}/${k}-poster.webp` } : null;
}).filter(Boolean) as Kart[];
const N = PRESETLER.length;
const TOPLAM = RESMI_PRESETLER.length;
const kat = (p: KatalogPreset) => KATEGORI_AD[p.kategoriler[0]] ?? p.kategoriler[0];

/** Kategoriler: her çip o kategorinin ilk kartına götürür. */
const KATEGORILER = (() => {
  const g: { ad: string; ilk: number }[] = [];
  PRESETLER.forEach((p, i) => { const a = kat(p); if (!g.some((x) => x.ad === a)) g.push({ ad: a, ilk: i }); });
  return g;
})();

function Rozet({ p }: { p: KatalogPreset }) {
  if (!p.etiket) return null;
  return <span className={cn("rounded-full px-2 py-0.5 text-[11.5px] font-semibold", p.etiket === "Yeni" ? "bg-[#55d6fd] text-[#06141a]" : "bg-white text-black")}>{p.etiket}</span>;
}

/** Ortadaki kart: önce fotoğraf, sonra efektli video daire şeklinde açılır; köşede asıl fotoğraf küçük ekranda kalır. */
function OnceSonra({ p }: { p: Kart }) {
  const [video, setVideo] = useState(false);
  useEffect(() => { setVideo(false); const t = setTimeout(() => setVideo(true), 900); return () => clearTimeout(t); }, [p.slug]);
  return (
    <div className="absolute inset-0">
      <img src={p.kapak} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <AnimatePresence>
        {video && (
          <motion.video key={p.slug} src={p.video} poster={p.kapak} autoPlay muted loop playsInline
            initial={{ clipPath: "circle(0% at 50% 55%)" }} animate={{ clipPath: "circle(150% at 50% 55%)" }}
            transition={{ duration: 1.2, ease }} className="absolute inset-0 h-full w-full object-cover" />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <motion.span key={String(video)} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.3 }}
          className="absolute left-3 top-3 flex items-center gap-1.5 whitespace-nowrap rounded-full bg-black/50 px-2.5 py-1 text-[11.5px] font-medium text-white backdrop-blur-xl">
          {video ? <><Wand2 className="h-3 w-3 text-[#55d6fd]" />Efekt uygulandı</> : <><ImageIcon className="h-3 w-3" />Fotoğrafın</>}
        </motion.span>
      </AnimatePresence>
      <AnimatePresence>
        {video && (
          <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.5, duration: 0.5, ease }}
            className="absolute bottom-3 right-3 w-[30%] overflow-hidden rounded-[12px] ring-2 ring-white/80">
            <img src={p.kapak} alt="Asıl fotoğraf" className="aspect-[9/16] w-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center text-[9.5px] font-medium text-white">Önce</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Arka plan katmanı: opaklığı presetin ortaya uzaklığından hesaplanır (yumuşak eğri).
 * Aynı anda en fazla iki katman görünür; diğerleri gizli kalır, maliyet üretmez.
 */
function ArkaIsik({ src, j, p }: { src: string; j: number; p: MotionValue<number> }) {
  const op = useTransform(p, (v) => {
    const t = Math.max(0, 1 - Math.abs(j - v * (N - 1)));
    return t * t * (3 - 2 * t);
  });
  const gor = useTransform(op, (o) => (o > 0.002 ? "visible" : "hidden"));
  return (
    <motion.div style={{ opacity: op, visibility: gor }} className="absolute inset-0 [will-change:opacity]">
      <OrtamIsigi src={src} opaklik={0.34} className="inset-0 [--olcek:46]" />
    </motion.div>
  );
}

/** Akıştaki kart: konumuna göre 3D döner, küçülür ve söner; ortadaki oynar. */
function AkisKart({ x, j, p, onSec }: { x: Kart; j: number; p: MotionValue<number>; onSec: (j: number) => void }) {
  const d = useTransform(p, (v) => j - v * (N - 1));
  const tx = useTransform(d, (v) => `${Math.sign(v) * Math.min(Math.abs(v), 1) * 70 + (Math.abs(v) > 1 ? Math.sign(v) * (Math.abs(v) - 1) * 42 : 0)}%`);
  const ry = useTransform(d, (v) => Math.max(-58, Math.min(58, -v * 52)));
  const sc = useTransform(d, (v) => 1 - Math.min(1, Math.abs(v)) * 0.2);
  const op = useTransform(d, (v) => 1 - Math.min(1, Math.max(0, Math.abs(v) - 2.4) * 0.8));
  const karart = useTransform(d, (v) => Math.min(0.55, Math.abs(v) * 0.45));
  const z = useTransform(d, (v) => 100 - Math.round(Math.abs(v) * 10));
  const [orta, setOrta] = useState(j === 0);
  useMotionValueEvent(d, "change", (v) => setOrta(Math.abs(v) < 0.5));
  return (
    <motion.div style={{ x: tx, rotateY: ry, scale: sc, opacity: op, zIndex: z }}
      className="absolute left-1/2 top-0 -ml-[88px] w-[176px] [will-change:transform] sm:-ml-[104px] sm:w-[208px] min-[1700px]:-ml-[130px] min-[1700px]:w-[260px]">
      <button type="button" onClick={() => onSec(j)} aria-label={x.ad} tabIndex={orta ? -1 : 0}
        className={cn("relative block w-full overflow-hidden rounded-[28px] bg-black ring-1 transition-[box-shadow] duration-500", orta ? "ring-white/40" : "ring-white/[0.1]")}>
        <div className="relative aspect-[9/16]">
          {orta ? <OnceSonra p={x} /> : <img src={x.kapak} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />}
          <motion.span style={{ opacity: karart }} className="pointer-events-none absolute inset-0 bg-black" />
        </div>
      </button>
    </motion.div>
  );
}

/**
 * Presetler — 3D kapak akışı. Bölüm sabitlenir; kaydırdıkça presetler ortadan geçer,
 * ortadaki fotoğraftan efektli videoya dönüşür, arka plan o presetin rengini alır.
 */
export function Presetler() {
  const kok = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: kok, offset: ["start start", "end end"] });
  const p = useYumusak(scrollYProgress, kok, { stiffness: 50, damping: 20, mass: 0.7 });
  // Arka plan kartlardan biraz daha ağır yayla akar: renk geçişi kartları takip eder, hiç sıçramaz.
  const arkaP = useYumusak(scrollYProgress, kok, { stiffness: 22, damping: 18, mass: 1 });
  const [i, setI] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setI(Math.min(N - 1, Math.max(0, Math.round(v * (N - 1))))));
  const a = PRESETLER[i];
  const aktifKat = kat(a);
  const cubuk = useTransform(p, [0, 1], [0, 1]);

  // Bir karta/çipe tıklayınca sayfayı o kartın konumuna kaydırır.
  const git = (j: number) => {
    const el = kok.current; if (!el) return;
    const ust = el.getBoundingClientRect().top + scrollY;
    scrollTo({ top: ust + (el.offsetHeight - innerHeight) * (j / (N - 1)), behavior: "smooth" });
  };

  return (
    <section ref={kok} className="relative" style={{ height: `${N * 42 + 80}vh` }}>
      <div className="sticky top-[var(--ust-nav)] isolate flex h-[calc(100svh-var(--ust-nav))] flex-col justify-center overflow-hidden pb-24">
        {/* Ortam ışığı: her presetin rengi kaydırmayla sürekli karışır; iki preset arasında yumuşakça erir */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          {PRESETLER.map((x, j) => <ArkaIsik key={x.slug} src={x.kapak} j={j} p={arkaP} />)}
        </div>
        {/* Zemin parıltısı: ortadaki kartın altında yumuşak ışık (yansıma yerine, maliyetsiz) */}
        <span aria-hidden className="pointer-events-none absolute left-1/2 top-[66%] -z-10 h-24 w-[420px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,255,255,0.07),transparent)]" />

        <div className="mx-auto w-full max-w-[1280px] px-4 text-center sm:px-8">
          <h2 className="text-[28px] font-semibold leading-[1.04] tracking-[-0.045em] text-white sm:text-[48px]">Bir fotoğraf, <span className="hero-isilti">viral bir video.</span></h2>
          <p className="mx-auto mt-2 hidden max-w-[540px] text-[15px] leading-relaxed text-white/60 sm:block sm:text-[16.5px]">{TOPLAM} hazır efekt. Fotoğrafını yükle, efekti seç, gerisini Vayra yapsın.</p>
          {/* Kategori çipleri: ortadaki presetin kategorisi seçili görünür */}
          <div className="gizli-scroll -mx-4 mt-4 flex justify-start gap-1.5 overflow-x-auto px-4 sm:justify-center">
            {KATEGORILER.map((k) => {
              const s = k.ad === aktifKat;
              return (
                <button key={k.ad} onClick={() => git(k.ilk)}
                  className={cn("relative h-9 shrink-0 rounded-full px-4 text-[13.5px] font-medium transition-colors", s ? "text-black" : "bg-white/[0.05] text-white/60 ring-1 ring-white/[0.08] hover:text-white")}>
                  {s && <motion.span layoutId="preset-kat" transition={{ type: "spring", stiffness: 420, damping: 36 }} className="absolute inset-0 rounded-full bg-white" />}
                  <span className="relative">{k.ad}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative mt-6 h-[313px] shrink-0 [perspective:1300px] sm:h-[370px] min-[1700px]:h-[462px]">
          {PRESETLER.map((x, j) => <AkisKart key={x.slug} x={x} j={j} p={p} onSec={git} />)}
        </div>

        <div className="mx-auto mt-8 flex w-full max-w-[720px] shrink-0 flex-col items-center gap-3.5 px-4 sm:mt-10">
          <AnimatePresence mode="wait">
            <motion.div key={a.slug} initial={{ opacity: 0, y: 10, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -8, filter: "blur(6px)" }} transition={{ duration: 0.35 }}
              className="text-center">
              <p className="flex items-center justify-center gap-2.5"><span className="text-[22px] font-semibold tracking-[-0.03em] text-white sm:text-[26px]">{a.ad}</span><Rozet p={a} /></p>
              <p className="mt-2 flex items-center justify-center gap-3 text-[13px] text-white/50">
                <span>{kat(a)}</span><span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{a.sureSn} sn</span>
                <span className="flex items-center gap-1"><KrediJeton boyut={12} />{a.kredi} kredi</span>
              </p>
            </motion.div>
          </AnimatePresence>
          <div className="flex items-center gap-2">
            <Link href={`/panel/presetler/${a.slug}`} className="group flex h-11 items-center gap-1.5 rounded-full bg-white px-5 text-[14.5px] font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.97]">
              <Wand2 className="h-4 w-4" />Bu efekti dene
            </Link>
            <Link href="/panel/presetler" className="group flex h-11 items-center gap-1.5 rounded-full bg-white/[0.07] px-5 text-[14.5px] font-medium text-white ring-1 ring-white/[0.1] transition-colors hover:bg-white/[0.12]">
              Tüm presetler<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          {/* Küçük resim şeridi: konum + tıklayınca o presete git */}
          <div className="mt-1 hidden w-full items-center gap-1 min-[1700px]:flex">
            {PRESETLER.map((x, j) => (
              <button key={x.slug} onClick={() => git(j)} aria-label={x.ad}
                className={cn("relative h-9 flex-1 overflow-hidden rounded-[8px] transition-all duration-300", j === i ? "flex-[1.8] ring-2 ring-white" : "opacity-40 hover:opacity-80")}>
                <img src={x.kapak} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          <div className="relative h-[3px] w-full max-w-[420px] overflow-hidden rounded-full bg-white/[0.1] min-[1700px]:hidden">
            <motion.span className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-[#55d6fd]" style={{ scaleX: cubuk }} />
          </div>
        </div>
      </div>
    </section>
  );
}
