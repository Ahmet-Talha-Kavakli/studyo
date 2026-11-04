"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Film, Image as ImageIcon, Music, AudioLines, Box, Clapperboard, ShoppingBag, Scissors, Play } from "lucide-react";
import type { KatalogTur } from "@/lib/modelKatalogu";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { TURLER, turModelleri } from "./Komut";
import { cn } from "@/lib/utils";
import { OrtamIsigi } from "./performans";

const G = "/gercek";
const ease = [0.22, 1, 0.36, 1] as const;

/** Bir türün farklı ailelerden ilk modelleri (logo sırası için). */
function aileModelleri(tur: KatalogTur, adet = 3) {
  const t = TURLER.find((x) => x.id === tur)!;
  const l: string[] = []; const aile = new Set<string>();
  for (const m of turModelleri(t, 40)) {
    if (!aile.has(m.aile)) { aile.add(m.aile); l.push(m.ad); }
    if (l.length === adet) break;
  }
  return l;
}

type Arac = {
  id: string; ad: string; ikon: LucideIcon; href: string; aciklama: string;
  /** Sahnenin üstündeki istem. */
  istem: string;
  modeller?: string[];
  ek?: string;
  /** Çalınmayan, canlandırılmış örnek (ses ve müzik): Demo rozeti gösterilir. */
  demo?: boolean;
  Sahne: (p: { aktif: boolean }) => React.ReactElement;
};

/* ─────────────────────────── Sahneler ───────────────────────────
   Her sahne aracın ne yaptığını gerçek çıktılarla gösterir.
   Hepsi Vayra'da üretilmiş gerçek görsel/video; ses ve müzik çalınmaz. */

function Rozet({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("flex h-8 items-center gap-1.5 rounded-full bg-black/45 px-3 text-[12.5px] font-medium text-white/90 ring-1 ring-white/[0.1] backdrop-blur-xl", className)}>{children}</span>;
}

function VideoSahne() {
  const ref = useRef<HTMLVideoElement>(null);
  const [o, setO] = useState(0);
  return (
    <div className="absolute inset-0">
      <video ref={ref} src={`${G}/hero-video/hero-video.mp4`} poster={`${G}/hero-video/hero-video-poster.webp`} autoPlay muted loop playsInline
        onTimeUpdate={(e) => setO(e.currentTarget.currentTime / (e.currentTarget.duration || 1))} className="h-full w-full object-cover" />
      <div className="absolute inset-x-5 bottom-[84px] flex items-center gap-3 sm:bottom-[88px]">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.16] backdrop-blur-md"><Play className="h-3 w-3 fill-white text-white" /></span>
        <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/20"><span className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: `${o * 100}%` }} /></span>
        <span className="text-[12px] tabular-nums text-white/80">0:0{Math.min(7, Math.floor(o * 7))}</span>
      </div>
    </div>
  );
}

function GorselSahne() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.img src={`${G}/panel/gal-gpt-0.webp`} alt="" initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 7, ease: "linear" }} className="h-full w-full object-cover" />
      <div className="absolute bottom-[84px] right-5 flex gap-2 sm:bottom-[88px]">
        <Rozet>1:1</Rozet><Rozet>4K</Rozet>
      </div>
    </div>
  );
}

const KARELER = [0, 1, 2, 3].map((i) => `${G}/orig/orig-kokboru-asset-vid-${i}.webp`).concat(`${G}/orig/orig-kokboru-oynatici.webp`);
const ELEMANLAR = [
  { ad: "Nine", g: `${G}/orig/orig-kokboru-asset-img-0.webp` },
  { ad: "Börü", g: `${G}/orig/orig-kokboru-asset-img-3.webp` },
  { ad: "Okçu", g: `${G}/orig/orig-kokboru-asset-img-4.webp` },
];
function FilmSahne({ aktif }: { aktif: boolean }) {
  const [k, setK] = useState(0);
  useEffect(() => { if (!aktif) return; const t = setInterval(() => setK((x) => (x + 1) % KARELER.length), 1300); return () => clearInterval(t); }, [aktif]);
  return (
    <div className="absolute inset-0">
      <AnimatePresence initial={false}>
        <motion.img key={k} src={KARELER[k]} alt="" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-0 h-full w-full object-cover" />
      </AnimatePresence>
      <div className="absolute left-5 top-[64px] flex flex-col gap-1.5">
        {ELEMANLAR.map((e, i) => (
          <motion.span key={e.ad} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1, ease }}
            className="flex h-8 items-center gap-2 rounded-full bg-black/45 pl-1 pr-3 text-[12.5px] font-medium text-white ring-1 ring-white/[0.1] backdrop-blur-xl">
            <img src={e.g} alt="" className="h-6 w-6 rounded-full object-cover" />@{e.ad}
          </motion.span>
        ))}
      </div>
      <div className="absolute inset-x-5 bottom-[80px] flex gap-1.5 sm:bottom-[84px]">
        {KARELER.map((g, i) => (
          <button key={g} onClick={() => setK(i)} aria-label={`${i + 1}. sahne`}
            className={cn("relative aspect-video flex-1 overflow-hidden rounded-[8px] ring-2 transition-all duration-300", i === k ? "ring-white" : "opacity-60 ring-transparent")}>
            <img src={g} alt="" className="h-full w-full object-cover" />
            <span className="absolute bottom-0.5 left-1 text-[10px] font-semibold text-white">{i + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ReklamSahne() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_70%_40%,#14262d_0%,#0e0f11_65%)]">
      <div className="absolute inset-0 flex items-center justify-center gap-4 pb-14 sm:gap-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease }} className="w-[34%] max-w-[200px]">
          <div className="overflow-hidden rounded-[18px] ring-1 ring-white/[0.12]"><img src={`${G}/panel/gal-pazarlama-0.webp`} alt="" className="aspect-[4/5] w-full object-cover" /></div>
          <p className="mt-2 text-center text-[12px] text-white/50">Ürün fotoğrafı</p>
        </motion.div>
        <svg viewBox="0 0 80 12" className="w-[12%] max-w-[80px] shrink-0" aria-hidden>
          <line x1="0" y1="6" x2="70" y2="6" stroke="#55d6fd" strokeWidth="2" strokeDasharray="4 5" className="kesfet-akis" />
          <path d="M70 1 L78 6 L70 11" fill="none" stroke="#55d6fd" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, delay: 0.25, ease }} className="w-[30%] max-w-[190px]">
          <div className="overflow-hidden rounded-[26px] bg-black p-1.5 ring-1 ring-white/[0.15]">
            <video src={`${G}/paz-video/gal-pazarlama-0.mp4`} poster={`${G}/panel/gal-pazarlama-0.webp`} autoPlay muted loop playsInline className="aspect-[9/16] w-full rounded-[20px] object-cover" />
          </div>
          <p className="mt-2 text-center text-[12px] text-white/50">Reklam videosu · 9:16</p>
        </motion.div>
      </div>
    </div>
  );
}

const CUBUK = Array.from({ length: 56 }, (_, i) => 18 + Math.round(Math.abs(Math.sin(i * 1.3) * 52 + Math.cos(i * 0.45) * 26)));
function Dalga({ ilerleme, aktif }: { ilerleme: number; aktif: boolean }) {
  // Çubuklar CSS ile dalgalanır (GPU'da, JS'siz); yalnız renk ilerlemeye göre değişir.
  return (
    <div className="flex h-14 items-center gap-[3px]">
      {CUBUK.map((h, i) => (
        <span key={i} className={cn("w-[3px] flex-1 origin-center rounded-full transition-colors duration-300", i / CUBUK.length < ilerleme ? "bg-[#55d6fd]" : "bg-white/30", aktif && "arac-dalga")}
          style={{ height: `${h}%`, animationDuration: `${0.8 + (i % 5) * 0.13}s`, animationDelay: `${(i % 7) * 0.06}s` }} />
      ))}
    </div>
  );
}
/** 0→1 döngüsel ilerleme; saniyede 12 kez güncellenir (her karede yeniden çizim yok). */
function useIlerleme(aktif: boolean, sure = 6) {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!aktif) return;
    const t0 = performance.now();
    const iv = setInterval(() => setP(((performance.now() - t0) / 1000 / sure) % 1), 80);
    return () => clearInterval(iv);
  }, [aktif, sure]);
  return p;
}

function MuzikSahne({ aktif }: { aktif: boolean }) {
  const p = useIlerleme(aktif, 9);
  const sn = Math.floor(p * 168);
  return (
    <div className="absolute inset-0 overflow-hidden">
      <OrtamIsigi src={`${G}/muzik/ms-neon.webp`} opaklik={0.75} className="inset-0 [--olcek:34]" />
      <div className="absolute inset-0 bg-black/35" />
      <div className="absolute inset-0 flex items-center justify-center px-6 pb-16">
        <div className="flex w-full max-w-[460px] items-center gap-5">
          <motion.img src={`${G}/muzik/ms-neon.webp`} alt="" initial={{ scale: 0.9, rotate: -4, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ duration: 0.7, ease }}
            className="aspect-square w-[38%] shrink-0 rounded-[18px] object-cover ring-1 ring-white/20" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[20px] font-semibold tracking-[-0.02em] text-white">Neon Otoban</p>
            <p className="text-[13.5px] text-white/60">Synthwave · Vokalli</p>
            <div className="mt-3"><Dalga ilerleme={p} aktif={aktif} /></div>
            <p className="mt-1 flex justify-between text-[11.5px] tabular-nums text-white/50"><span>{Math.floor(sn / 60)}:{String(sn % 60).padStart(2, "0")}</span><span>2:48</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

const SES_METIN = "Merhaba, ben Kuzey. Bugün sana yeni ürünümüzü birkaç cümleyle anlatmak istiyorum.".split(" ");
function SesSahne({ aktif }: { aktif: boolean }) {
  const p = useIlerleme(aktif, 6);
  const n = Math.floor(p * (SES_METIN.length + 3));
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_50%_30%,#123039_0%,#0e0f11_60%)]">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8 pb-16 text-center">
        <div className="relative">
          {[0, 1, 2].map((i) => (
            <motion.span key={i} className="absolute inset-0 rounded-full ring-2 ring-[#55d6fd]/40" animate={aktif ? { scale: [1, 1.7], opacity: [0.6, 0] } : {}} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }} />
          ))}
          <img src={`${G}/muzik/vs-kuzey.webp`} alt="" className="relative h-24 w-24 rounded-full object-cover ring-2 ring-white/20 sm:h-28 sm:w-28" />
        </div>
        <p className="max-w-[520px] text-[19px] font-medium leading-snug tracking-[-0.01em] sm:text-[24px]">
          {SES_METIN.map((k, i) => <span key={i} className={cn("transition-colors duration-200", i < n ? "text-white" : "text-white/25")}>{k} </span>)}
        </p>
        <div className="flex gap-2"><Rozet>Türkçe</Rozet><Rozet>Doğal ton</Rozet></div>
      </div>
    </div>
  );
}

function UcBoyutSahne() {
  const [hazir, setHazir] = useState(false);
  useEffect(() => { import("@google/model-viewer").then(() => setHazir(true)).catch(() => {}); }, []);
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_50%_45%,#2a3036_0%,#111214_70%)]">
      <div className="absolute inset-x-0 bottom-[22%] mx-auto h-6 w-[40%] rounded-[50%] bg-black/50 blur-xl" />
      {hazir ? (
        // @ts-expect-error model-viewer bir web bileşeni
        <model-viewer src={`${G}/3d/robot.glb`} poster={`${G}/3d/robot-poster.png`} alt="3D robot" auto-rotate rotation-per-second="28deg" camera-controls disable-zoom interaction-prompt="none" shadow-intensity="1" exposure="1.05"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", paddingBottom: 64, background: "transparent" }} />
      ) : (
        <img src={`${G}/3d/robot-poster.png`} alt="" className="absolute inset-0 m-auto h-[70%] object-contain pb-16" />
      )}
      <div className="absolute bottom-[84px] right-5 flex gap-2 sm:bottom-[88px]"><Rozet>GLB</Rozet><Rozet>İndirilebilir</Rozet></div>
      <p className="absolute bottom-[90px] left-5 text-[12px] text-white/50 sm:bottom-[94px]">Sürükleyip çevir</p>
    </div>
  );
}

const SHORTS = [`${G}/shorts/sp-boldcaption.webp`, `${G}/shorts/sp-neonpop.webp`, `${G}/shorts/sp-stickertype.webp`];
/** Uzun videonun kare şeridi: vurgulanan karelerden klipler çıkar. */
const SERIT = [1, 0, 1, 2, 1, 1, 2, 0, 1, 2, 2, 0];
const SECILEN = [1, 5, 9];
function ShortsSahne() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_50%_30%,#1b1f24_0%,#0e0f11_70%)]">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-5 pb-16 pt-14">
        <div className="w-full max-w-[560px]">
          <p className="mb-2 text-[12px] text-white/50">Uzun video</p>
          <div className="flex gap-1">
            {SERIT.map((g, i) => {
              const s = SECILEN.indexOf(i);
              return (
                <motion.div key={i} className={cn("relative aspect-[9/14] flex-1 overflow-hidden rounded-[6px]", s < 0 && "opacity-40")}
                  animate={s >= 0 ? { y: [0, -4, 0] } : {}} transition={{ delay: 0.3 + s * 0.15, duration: 0.5 }}>
                  <img src={SHORTS[g]} alt="" className="h-full w-full object-cover object-top" />
                  {s >= 0 && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + s * 0.15 }} className="absolute inset-0 rounded-[6px] ring-2 ring-inset ring-[#55d6fd]" />}
                </motion.div>
              );
            })}
          </div>
        </div>
        <div className="flex gap-3">
          {SECILEN.map((k, i) => (
            <motion.div key={k} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.12, duration: 0.6, ease }}
              className="w-[88px] overflow-hidden rounded-[14px] ring-1 ring-white/[0.15] sm:w-[118px]">
              <img src={SHORTS[SERIT[k]]} alt="" className="aspect-[9/16] w-full object-cover" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

const ARACLAR: Arac[] = [
  { id: "video", ad: "Video çek", ikon: Film, href: "/panel/video", aciklama: "Bir cümleden ya da bir görselden sinematik video. Kamera hareketi, ses ve süre senin elinde.", istem: "Gece yağmurunda neon şehirde ilerleyen dev yaratık, takip çekimi", modeller: aileModelleri("video"), ek: "16:9 · 5 sn", Sahne: VideoSahne },
  { id: "gorsel", ad: "Görsel üret", ikon: ImageIcon, href: "/panel/gorsel", aciklama: "Portre, ürün, sahne ya da afiş. 4K çözünürlük ve referansla tutarlı sonuçlar.", istem: "Islak mermerde parfüm şişesi, su sıçraması, lüks ürün çekimi", modeller: aileModelleri("gorsel"), Sahne: GorselSahne },
  { id: "sinema", ad: "Film çek", ikon: Clapperboard, href: "/panel/sinema", aciklama: "Karakterlerini bir kez tanımla, sahneleri kur, kamerayı ve ışığı yönet. Kısa filmden diziye.", modeller: aileModelleri("video"), istem: "Kök Börü · 1. bölüm: bozkırda kayıp sürünün izinde", ek: "5 sahne", Sahne: FilmSahne },
  { id: "pazarlama", ad: "Ürün reklamı", ikon: ShoppingBag, href: "/panel/pazarlama", aciklama: "Ürününün fotoğrafını yükle; sosyal medyaya hazır dikey reklam videoları al.", modeller: aileModelleri("video", 2), istem: "Bu ayakkabı için enerjik, renkli bir reklam videosu", Sahne: ReklamSahne },
  { id: "muzik", ad: "Müzik yap", ikon: Music, href: "/panel/muzik", aciklama: "Tarzı ve ruh hâlini yaz; vokalli şarkı, beat ya da sahne müziği gelsin.", istem: "Neon şehir için synthwave, güçlü bas ve 80'ler davulu", modeller: aileModelleri("muzik"), demo: true, Sahne: MuzikSahne },
  { id: "ses", ad: "Seslendir", ikon: AudioLines, href: "/panel/ses", aciklama: "Metnini doğal Türkçe seslerle seslendir ya da kendi sesini klonla.", istem: "Ürün tanıtımı, sıcak ve samimi bir erkek sesiyle", modeller: aileModelleri("ses", 2), demo: true, Sahne: SesSahne },
  { id: "3d", ad: "3D model", ikon: Box, href: "/panel/3d", aciklama: "Bir cümleden ya da görselden indirilebilir, dokulu 3D model. Oyun, baskı ve AR için hazır.", istem: "Sevimli robot, oyuncak tarzı, sade gri kaplama", modeller: aileModelleri("3d", 2), Sahne: UcBoyutSahne },
  { id: "shorts", ad: "Shorts çıkar", ikon: Scissors, href: "/panel/shorts", aciklama: "Uzun videonu yükle; en güçlü anları bulup altyazılı dikey kliplere çevirelim.", istem: "Podcast'imden en çok konuşulacak 3 anı çıkar", ek: "3 klip", Sahne: ShortsSahne },
];
const SURE_MS = 6500;

/** Sahnenin üstündeki istem: sahne açılınca yazılır. */
function IstemCipi({ metin }: { metin: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const t = setInterval(() => setN((x) => { if (x >= metin.length) { clearInterval(t); return x; } return x + 1; }), 22);
    return () => clearInterval(t);
  }, [metin]);
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-full bg-black/50 py-1.5 pl-1.5 pr-4 ring-1 ring-white/[0.1] backdrop-blur-xl">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#55d6fd] text-[#06141a]"><ArrowRight className="h-3.5 w-3.5 -rotate-90" strokeWidth={2.6} /></span>
      <span className="truncate text-[13px] text-white">{metin.slice(0, n)}{n < metin.length && <span className="ml-px inline-block h-3.5 w-px translate-y-0.5 bg-[#55d6fd]" />}</span>
    </div>
  );
}

/**
 * "Ne yapmak istiyorsun?" — solda araç listesi, sağda seçilen aracın canlı sahnesi.
 * Liste kendiliğinden ilerler; üzerine gelince durur.
 */
export function Araclar() {
  const [i, setI] = useState(0);
  const [dur, setDur] = useState(false);
  const [gorunur, setGorunur] = useState(false);
  const kok = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = kok.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setGorunur(e.isIntersecting), { threshold: 0.3 });
    io.observe(el); return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (dur || !gorunur) return;
    const t = setTimeout(() => setI((x) => (x + 1) % ARACLAR.length), SURE_MS);
    return () => clearTimeout(t);
  }, [i, dur, gorunur]);
  const a = ARACLAR[i];
  // Mobilde seçili çip yatay şeritte görünür kalsın (sayfa kaymadan).
  const serit = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const k = serit.current; if (!k || matchMedia("(min-width: 1024px)").matches) return;
    const el = k.children[i] as HTMLElement | undefined; if (!el) return;
    k.scrollTo({ left: el.offsetLeft - (k.clientWidth - el.offsetWidth) / 2, behavior: "smooth" });
  }, [i]);
  const sec = (j: number) => { setI(j); setDur(true); };

  return (
    <section ref={kok} className="mx-auto max-w-[1280px] px-4 py-20 sm:px-8 sm:py-28" onMouseLeave={() => setDur(false)}>
      <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, ease }}
        className="mb-10 flex flex-col gap-4 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[34px] font-semibold leading-[1.04] tracking-[-0.045em] text-white sm:text-[56px]">Ne yapmak istiyorsun?</h2>
          <p className="mt-3 max-w-[520px] text-[16px] leading-relaxed text-white/60 sm:text-[17px]">Her iş için doğru araç ve doğru model, tek hesapta.</p>
        </div>
        <Link href="/panel" className="group inline-flex h-10 items-center gap-1.5 self-start rounded-full bg-white/[0.07] px-4 text-[14px] font-medium text-white ring-1 ring-white/[0.1] transition-colors hover:bg-white/[0.12] sm:self-auto">
          Tüm araçlar<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-12">
        {/* Liste */}
        <div ref={serit} role="tablist" aria-label="Araçlar" aria-orientation="vertical"
          className="gizli-scroll -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0"
          onKeyDown={(e) => { if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); sec((i + 1) % ARACLAR.length); } if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); sec((i - 1 + ARACLAR.length) % ARACLAR.length); } }}>
          {ARACLAR.map((x, j) => {
            const s = j === i;
            return (
              <div key={x.id} className="relative shrink-0 lg:border-b lg:border-white/[0.07]">
                <button role="tab" aria-selected={s} tabIndex={s ? 0 : -1} onClick={() => sec(j)} onMouseEnter={() => { if (matchMedia("(min-width: 1024px)").matches) sec(j); }}
                  className={cn("group relative flex w-full items-center gap-3 text-left transition-colors",
                    "max-lg:h-11 max-lg:rounded-full max-lg:pl-1.5 max-lg:pr-4 lg:py-[14px]",
                    s ? "max-lg:bg-white max-lg:text-black" : "max-lg:bg-white/[0.06]")}>
                  {s && <motion.span layoutId="arac-zemin" transition={{ type: "spring", stiffness: 420, damping: 36 }} className="absolute -inset-x-3 inset-y-1 hidden rounded-[16px] bg-white/[0.04] lg:block" />}
                  <span className={cn("relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors lg:h-10 lg:w-10 lg:rounded-[12px]",
                    s ? "bg-[#55d6fd] text-[#06141a] max-lg:bg-black max-lg:text-white" : "bg-white/[0.06] text-white/55 group-hover:text-white/80")}>
                    <x.ikon className="h-4 w-4 lg:h-[19px] lg:w-[19px]" />
                  </span>
                  <span className={cn("relative whitespace-nowrap text-[14px] font-medium transition-colors lg:text-[24px] lg:font-semibold lg:tracking-[-0.03em]",
                    s ? "lg:text-white" : "text-white/70 lg:text-white/40 lg:group-hover:text-white/70")}>{x.ad}</span>
                </button>
                <AnimatePresence initial={false}>
                  {s && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease }}
                      className="relative hidden overflow-hidden lg:block">
                      <div className="pb-5 pl-[52px] pr-2">
                        <p className="text-[15px] leading-relaxed text-white/60">{x.aciklama}</p>
                        {x.modeller && (
                          <div className="mt-3.5 flex items-center gap-2.5">
                            <span className="flex -space-x-1.5">
                              {x.modeller.map((m) => <span key={m} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1c1c1e] ring-2 ring-[#0b0b0c]"><ModelLogo ad={m} boyut={15} /></span>)}
                            </span>
                            <span className="truncate text-[13px] text-white/45">{x.modeller.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {s && !dur && gorunur && (
                  <motion.span key={`${i}-ilerleme`} className="absolute -bottom-px left-0 hidden h-px w-full origin-left bg-[#55d6fd] lg:block" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: SURE_MS / 1000, ease: "linear" }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Sahne */}
        <div className="lg:sticky lg:top-[calc(var(--ust-nav)+24px)] lg:self-start" onMouseEnter={() => setDur(true)}>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[30px] bg-[#0e0f11] ring-1 ring-white/[0.08] sm:aspect-[16/11]">
            <AnimatePresence initial={false}>
              <motion.div key={a.id} className="absolute inset-0" initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.99 }} transition={{ duration: 0.6, ease }}>
                <a.Sahne aktif={gorunur} />
              </motion.div>
            </AnimatePresence>
            {!dur && gorunur && (
              <span className="absolute inset-x-0 top-0 z-10 h-[2px] lg:hidden"><motion.span key={`${i}-m`} className="block h-full w-full origin-left bg-[#55d6fd]" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: SURE_MS / 1000, ease: "linear" }} /></span>
            )}
            <span className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent" />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent" />

            <div className="absolute inset-x-4 top-4 flex items-center gap-2 sm:inset-x-5 sm:top-5">
              <IstemCipi key={a.id} metin={a.istem} />
              
            </div>
            <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 sm:inset-x-5 sm:bottom-5">
              <div className="flex min-w-0 items-center gap-2">
                {a.modeller?.[0] && <Rozet className="shrink-0"><ModelLogo ad={a.modeller[0]} boyut={15} />{a.modeller[0]}</Rozet>}
                {a.ek && <Rozet className="hidden shrink-0 sm:flex">{a.ek}</Rozet>}
              </div>
              <Link href={a.href} className="group/cta flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-white px-5 text-[14.5px] font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.97]">
                {a.ad}<ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5" />
              </Link>
            </div>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p key={a.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
              className="mt-3 min-h-[42px] px-1 text-[14px] leading-relaxed text-white/55 lg:hidden">{a.aciklama}</motion.p>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
