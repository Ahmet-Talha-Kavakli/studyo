"use client";

/**
 * Fans hero mekanizması: tek karakter, dört içerik türü. Telefon çerçevesinde sırayla oynar:
 * Konuşma (aynı cümle üç dilde), Foto seti (aynı yüz, dört kare), Kişiye özel (her hayrana adıyla), Trend (akım klibi).
 * Sağdaki liste hangi türün oynadığını ilerleme çubuğuyla gösterir.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gift, Images, MessageCircle, Music4 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Bayrak } from "@/components/ui/Bayrak";

const ADIM = 1200; // alt adım (dil, kare, isim) süresi
const ALT = 3; // her türde alt adım sayısı
const ease = [0.22, 1, 0.36, 1] as const;

const DIL_ORNEK = [
  { b: "TR", ad: "Türkçe", m: "Bugün size bir sır vereceğim!" },
  { b: "US", ad: "İngilizce", m: "Today I'm sharing a secret!" },
  { b: "ES", ad: "İspanyolca", m: "¡Hoy os cuento un secreto!" },
];
const ISIMLER = ["Ayşe", "Mert", "Zeynep"];
const KARE = [
  { pos: "50% 18%", olcek: 1, filtre: "none" },
  { pos: "50% 30%", olcek: 1.55, filtre: "saturate(1.25) sepia(0.18)" },
  { pos: "30% 20%", olcek: 1.2, filtre: "grayscale(1) contrast(1.1)" },
  { pos: "60% 25%", olcek: 1.35, filtre: "hue-rotate(-12deg) saturate(1.3)" },
];

export const VITRIN_TURLER = [
  { id: "konus", ad: "Konuşma", alt: "Aynı cümle, üç dilde", ikon: MessageCircle },
  { id: "foto", ad: "Foto seti", alt: "Aynı yüz, dört kare", ikon: Images },
  { id: "mesaj", ad: "Kişiye özel", alt: "Her hayrana adıyla", ikon: Gift },
  { id: "trend", ad: "Trend", alt: "Akımı karakterine uygula", ikon: Music4 },
] as const;

export function FansVitrin({ ad, gorsel }: { ad: string; gorsel: string }) {
  const [tik, setTik] = useState(0);
  useEffect(() => { const t = setInterval(() => setTik((v) => v + 1), ADIM); return () => clearInterval(t); }, []);
  const sahne = Math.floor(tik / ALT) % VITRIN_TURLER.length;
  const alt = tik % ALT;
  const T = VITRIN_TURLER[sahne];

  return (
    <div className="flex items-stretch gap-3 max-sm:flex-col max-sm:items-center">
      {/* Telefon */}
      <div className="relative aspect-[9/16] h-[400px] shrink-0 overflow-hidden rounded-[30px] bg-black p-[5px] ring-1 ring-white/15 max-sm:h-[340px]">
        <div className="relative h-full w-full overflow-hidden rounded-[25px] bg-[#0b0c0e]">
          <AnimatePresence initial={false}>
            <motion.div key={`${T.id}-${gorsel}`} initial={{ clipPath: "inset(0 100% 0 0)" }} animate={{ clipPath: "inset(0 0% 0 0)" }} transition={{ duration: 0.6, ease }} className="absolute inset-0">
              {T.id === "trend" ? (
                <video src="/gercek/video-hareket/k-pop.mp4" poster="/gercek/video-hareket/k-pop-poster.webp" autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
              ) : T.id === "foto" ? (
                <div className="absolute inset-0 grid grid-cols-2 gap-[3px] bg-black p-[3px] pt-12">
                  {KARE.map((k, i) => (
                    <motion.span key={i} initial={false} animate={{ opacity: i <= alt + 1 ? 1 : 0.18, scale: i <= alt + 1 ? 1 : 0.96 }} transition={{ duration: 0.4, ease }} className="relative overflow-hidden rounded-[10px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={gorsel} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: k.pos, transform: `scale(${k.olcek})`, filter: k.filtre }} />
                    </motion.span>
                  ))}
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <motion.img src={gorsel} alt="" initial={{ scale: 1.04 }} animate={{ scale: 1.12 }} transition={{ duration: (ADIM * ALT) / 1000, ease: "linear" }} className="absolute inset-0 h-full w-full object-cover object-[50%_20%]" />
              )}
            </motion.div>
          </AnimatePresence>
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/45" />
          {/* Üst: karakter + türe özgü hap */}
          <span className="absolute inset-x-2.5 top-2.5 flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={gorsel} alt="" className="h-6 w-6 rounded-full object-cover object-top ring-1 ring-white/70" />
            <span className="min-w-0 truncate text-[12px] font-semibold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">@{ad}</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={`${T.id}-${T.id === "konus" ? alt : 0}`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.22 }}
                className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
                {T.id === "konus" ? <><Bayrak b={DIL_ORNEK[alt].b} boyut={12} />{DIL_ORNEK[alt].ad}</> : T.id === "foto" ? `${Math.min(alt + 2, 4)} / 4 kare` : T.id === "mesaj" ? `${alt + 1} / 3 hayran` : "K-pop dansı"}
              </motion.span>
            </AnimatePresence>
          </span>
          {/* Alt: altyazı */}
          {(T.id === "konus" || T.id === "mesaj") && (
            <AnimatePresence mode="wait">
              <motion.p key={`${T.id}-${alt}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.26, ease }}
                className="absolute inset-x-3 bottom-6 text-center text-[16px] font-extrabold leading-tight text-white [paint-order:stroke_fill] [-webkit-text-stroke:3px_#000] max-sm:text-[14px]">
                {T.id === "konus" ? DIL_ORNEK[alt].m : <>Selam <span className="text-[#55d6fd]">{ISIMLER[alt]}</span>, iyi ki varsın!</>}
              </motion.p>
            </AnimatePresence>
          )}
          <span className="absolute inset-x-3 bottom-2.5 h-[3px] overflow-hidden rounded-full bg-white/20">
            <motion.span key={tik} className="block h-full bg-white" initial={{ width: `${(alt / ALT) * 100}%` }} animate={{ width: `${((alt + 1) / ALT) * 100}%` }} transition={{ duration: ADIM / 1000, ease: "linear" }} />
          </span>
        </div>
      </div>
      {/* Tür listesi */}
      <div className="flex w-[244px] flex-col gap-2 max-sm:w-full">
        <div className="flex items-center gap-2.5 rounded-[16px] bg-white/[0.05] p-2.5 ring-1 ring-inset ring-white/[0.08] max-sm:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gorsel} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover object-top ring-2 ring-white/20" />
          <span className="min-w-0 leading-tight"><span className="block truncate text-[13.5px] font-semibold text-white">@{ad}</span><span className="block text-[11.5px] text-white/50">Tek yüz, dört içerik türü</span></span>
        </div>
        <div className="flex flex-1 flex-col gap-1.5 max-sm:grid max-sm:grid-cols-4">
          {VITRIN_TURLER.map((x, i) => {
            const a = i === sahne;
            return (
              <div key={x.id} className={cn("relative flex flex-1 items-center overflow-hidden rounded-[16px] px-3 py-2.5 ring-1 ring-inset transition-[background-color,box-shadow] duration-300 max-sm:px-1.5 max-sm:py-2", a ? "bg-white/[0.1] ring-white/40" : "bg-white/[0.02] ring-white/[0.06]")}>
                <span className="flex w-full items-center gap-3 max-sm:flex-col max-sm:gap-1">
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300", a ? "bg-white text-black" : "bg-white/[0.08] text-white/70")}><x.ikon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1 leading-tight max-sm:text-center">
                    <span className={cn("block text-[14px] font-semibold transition-colors max-sm:text-[11.5px]", a ? "text-white" : "text-white/75")}>{x.ad}</span>
                    <span className="mt-0.5 block text-[12px] text-white/50 max-sm:hidden">{x.alt}</span>
                  </span>
                  <span className={cn("shrink-0 text-[11px] font-semibold tabular-nums transition-colors max-sm:hidden", a ? "text-white/80" : "text-white/30")}>{String(i + 1).padStart(2, "0")}</span>
                </span>
                {a && <motion.span key={`p${sahne}-${Math.floor(tik / (ALT * VITRIN_TURLER.length))}`} className="absolute inset-x-0 bottom-0 block h-[2px] bg-white" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: (ADIM * ALT) / 1000, ease: "linear" }} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
