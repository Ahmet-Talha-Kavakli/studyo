"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Package } from "lucide-react";

/**
 * Vitrin sahnesi: "Bir bağlantı, N reklam" başlığının sözünü sahnede tutar — seçilen varyant sayısı kadar
 * telefon, hepsi AYNI ürünün farklı reklamları. Ürün yokken gece serumu için gerçek bir set; ürün varken
 * ürünün görselleri + seçili formatın kareleri.
 */
export type SahneVaryant = { etiket: string; kareler: string[]; video?: string; altyazi?: string };

const P = (ad: string) => `/gercek/paz/${ad}.webp`;
export const SERUM_SETI: SahneVaryant[] = [
  { etiket: "UGC", kareler: [P("paz-ugc-1"), P("paz-selfie-2"), P("urun-serum")], altyazi: "Bunu denemeden önce bilmen gereken tek şey" },
  { etiket: "Ürün filmi", kareler: ["/gercek/panel/gal-pazarlama-1.webp"], video: "/gercek/paz-video/gal-pazarlama-1.mp4", altyazi: "Gece onarır, sabah belli olur" },
  { etiket: "Gece rutini", kareler: [P("ref-lumea"), P("paz-selfie-3"), P("ref-serum")], altyazi: "Rutinimde kalan tek adım" },
  { etiket: "Önce ve sonra", kareler: [P("paz-oncesonra-1"), P("paz-selfie-1"), P("urun-serum-2")], altyazi: "Yedi gecede fark" },
];

/* Telefonların yerleşimi: soldan sağa x, eğim, ölçek; hangi varyantın nerede durduğu (tek sayıda V1 ortada). */
const YERLESIM: Record<number, { x: number; r: number; s: number; v: number }[]> = {
  1: [{ x: 0, r: 0, s: 1, v: 0 }],
  2: [{ x: -118, r: -5, s: 0.94, v: 0 }, { x: 118, r: 5, s: 0.94, v: 1 }],
  3: [{ x: -172, r: -8, s: 0.82, v: 2 }, { x: 0, r: 0, s: 1, v: 0 }, { x: 172, r: 8, s: 0.82, v: 1 }],
  4: [{ x: -222, r: -9, s: 0.76, v: 3 }, { x: -76, r: -3, s: 0.88, v: 0 }, { x: 76, r: 3, s: 0.88, v: 1 }, { x: 222, r: 9, s: 0.76, v: 2 }],
};
const TEL_EN = 220;
const TEL_BOY = (TEL_EN * 19) / 9;

export function VitrinSahne({ adet, varyantlar, urunAd, urunGorsel, sure }: {
  adet: number; varyantlar: SahneVaryant[]; urunAd: string; urunGorsel?: string; sure: string;
}) {
  const n = Math.min(4, Math.max(1, adet));
  const yer = YERLESIM[n];
  const kapRef = useRef<HTMLDivElement>(null);
  const [olcek, setOlcek] = useState(1);
  /* Sahne sütuna sığsın: gereken genişlik = en dış telefonun kenarı. */
  const gerekli = Math.max(...yer.map((p) => Math.abs(p.x) * 2 + TEL_EN * p.s)) + 40;
  useLayoutEffect(() => {
    const el = kapRef.current; if (!el) return;
    const ol = () => setOlcek(Math.min(1, el.clientWidth / gerekli));
    ol(); const ro = new ResizeObserver(ol); ro.observe(el); return () => ro.disconnect();
  }, [gerekli]);

  return (
    <div ref={kapRef} className="relative w-full" style={{ height: TEL_BOY * olcek + 24 }}>
      {/* Ambiyans: ilk varyantın karesi bulanık arka ışık olur; sahne ürünün renginde parlar. */}
      <AnimatePresence>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <motion.img key={varyantlar[0]?.kareler[0]} src={varyantlar[0]?.kareler[0]} alt="" aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 0.32 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}
          className="pointer-events-none absolute left-1/2 top-1/2 h-[80%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover blur-[90px] saturate-150" />
      </AnimatePresence>
      <div aria-hidden className="pointer-events-none absolute inset-x-[10%] inset-y-0 rounded-full bg-[radial-gradient(closest-side,rgba(85,214,253,0.1),transparent)]" />
      <div className="absolute left-1/2 top-3 grid place-items-center" style={{ width: TEL_EN, height: TEL_BOY, transform: `translateX(-50%) scale(${olcek})`, transformOrigin: "top center" }}>
        <AnimatePresence initial={false}>
          {yer.map((p, i) => {
            const v = varyantlar[p.v % varyantlar.length];
            return (
              <motion.div key={p.v} className="[grid-area:1/1]" style={{ zIndex: 10 - Math.round(Math.abs(p.x) / 50) }}
                initial={{ opacity: 0, x: 0, rotate: 0, scale: 0.8 }} animate={{ opacity: 1, x: p.x, rotate: p.r, scale: p.s }} exit={{ opacity: 0, scale: 0.8, x: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 28, delay: i * 0.03 }}>
                <Telefon v={v} no={p.v + 1} urunAd={urunAd} urunGorsel={urunGorsel} sure={sure} gecikme={p.v * 550} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Telefon({ v, no, urunAd, urunGorsel, sure, gecikme }: { v: SahneVaryant; no: number; urunAd: string; urunGorsel?: string; sure: string; gecikme: number }) {
  const [kare, setKare] = useState(0);
  const kareler = v.kareler;
  useEffect(() => {
    setKare(0);
    if (v.video || kareler.length < 2) return;
    let t: ReturnType<typeof setInterval>;
    const b = setTimeout(() => { t = setInterval(() => setKare((k) => (k + 1) % kareler.length), 2200); }, gecikme);
    return () => { clearTimeout(b); clearInterval(t); };
  }, [kareler, v.video, gecikme]);
  return (
    <div className="relative aspect-[9/19] rounded-[38px] bg-[#0b0b0d] p-[7px] ring-1 ring-white/15" style={{ width: TEL_EN }}>
      <div className="relative h-full w-full overflow-hidden rounded-[31px] bg-black">
        {v.video ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={kareler[0]} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <video src={v.video} poster={kareler[0]} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
          </>
        ) : (
          <AnimatePresence initial={false}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img key={kareler[kare]} src={kareler[kare]} alt="" initial={{ clipPath: "inset(0 0 0 100%)" }} animate={{ clipPath: "inset(0 0 0 0%)", scale: [1.05, 1] }} exit={{ opacity: 0.99, transition: { duration: 0.6 } }}
              transition={{ clipPath: { duration: 0.55, ease: [0.22, 1, 0.36, 1] }, scale: { duration: 2.4, ease: "linear" } }} className="absolute inset-0 h-full w-full object-cover" />
          </AnimatePresence>
        )}
        <span className="absolute left-1/2 top-2.5 h-[18px] w-[64px] -translate-x-1/2 rounded-full bg-black" />
        {!v.video && kareler.length > 1 && (
          <span className="absolute inset-x-3.5 top-9 flex gap-1">
            {kareler.map((_, i) => (
              <span key={i} className="h-[2.5px] flex-1 overflow-hidden rounded-full bg-white/30">
                <motion.span key={`${i}-${kare}`} className="block h-full bg-white" initial={{ width: i < kare ? "100%" : "0%" }} animate={{ width: i <= kare ? "100%" : "0%" }} transition={{ duration: i === kare ? 2.2 : 0, ease: "linear" }} />
              </span>
            ))}
          </span>
        )}
        <span className="absolute left-3.5 top-[50px] flex items-center gap-1.5 rounded-full bg-black/55 py-0.5 pl-0.5 pr-2.5 text-[11px] font-semibold text-white backdrop-blur-md">
          <span className="rounded-full bg-white px-1.5 text-[10.5px] font-bold leading-[17px] text-black">V{no}</span>{v.etiket} · {sure}
        </span>
        <span className="absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
        {v.altyazi && (
          <span className="absolute inset-x-5 bottom-[74px] text-center text-[15px] font-extrabold leading-tight text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">{v.altyazi}</span>
        )}
        <span className="absolute inset-x-3 bottom-3.5 flex items-center gap-2 rounded-[16px] bg-white/[0.14] p-1.5 backdrop-blur-md">
          <span className="h-9 w-9 shrink-0 overflow-hidden rounded-[10px] bg-white/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {urunGorsel ? <img src={urunGorsel} alt="" className="h-full w-full object-cover" /> : <Package className="m-2.5 h-4 w-4 text-white/80" />}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[12px] font-semibold text-white">{urunAd}</span>
            <span className="block text-[10.5px] text-white/70">Sponsorlu</span>
          </span>
          <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-black">Satın al</span>
        </span>
      </div>
    </div>
  );
}
