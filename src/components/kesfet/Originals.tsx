"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import { ORIGINALS } from "./veri";
import { BolumBaslik, Kap, butonSinif } from "./ortak";
import { cn } from "@/lib/utils";

/**
 * Vayra Originals — ortadaki slayt büyük, komşuları kenarlardan görünür.
 * 7 sn'de bir ilerler; fare üstündeyken durur.
 */
export function Originals() {
  const [i, setI] = useState(0);
  const [duraklat, setDuraklat] = useState(false);
  const azHareket = useReducedMotion(); // "hareketi azalt" açıksa otomatik döngü yok
  const n = ORIGINALS.length;
  // Slayt adımı (genişlik + boşluk) piksel olarak ölçülür; ekran değişince güncellenir.
  const slaytRef = useRef<HTMLAnchorElement>(null);
  const [adim, setAdim] = useState(0);
  useEffect(() => {
    const olc = () => setAdim((slaytRef.current?.offsetWidth ?? 0) + 16);
    olc();
    window.addEventListener("resize", olc);
    return () => window.removeEventListener("resize", olc);
  }, []);
  const git = (d: number) => setI((x) => (x + d + n) % n);

  useEffect(() => {
    if (duraklat || azHareket) return;
    const t = setTimeout(() => git(1), 7000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, duraklat, azHareket]);

  return (
    <section className="overflow-hidden py-16 sm:py-20">
      <Kap>
        <BolumBaslik ust="Vayra Originals" baslik="Vayra ile çekildi."
          alt="Yaratıcıların baştan sona Vayra ile ürettiği diziler ve kısa filmler. Kamera yok, set yok; sadece fikir."
          sag={<Link href="/panel/originals" className={butonSinif("beyaz")}>Originals&apos;ı izle <ArrowRight className="h-4 w-4" /></Link>} />
      </Kap>

      <div className="relative"
        onPointerEnter={(e) => { if (e.pointerType === "mouse") setDuraklat(true); }}
        onPointerLeave={(e) => { if (e.pointerType === "mouse") setDuraklat(false); }}>
        {/* Yan boşluk = (kapsayıcı - slayt) / 2 → aktif slayt tam ortada (100vw kaydırma çubuğunu da sayardı) */}
        <motion.div className="flex gap-4" style={{ paddingInline: "calc((100% - min(78vw, 1040px)) / 2)" }}
          animate={{ x: -i * adim }}
          transition={{ type: "spring", stiffness: 120, damping: 24 }}>
          {ORIGINALS.map((o, k) => (
            <Link key={o.ad} ref={k === 0 ? slaytRef : undefined} href={o.href} onClick={(e) => { if (k !== i) { e.preventDefault(); setI(k); } }}
              className={cn("group relative aspect-[16/10] shrink-0 overflow-hidden rounded-[24px] transition-opacity duration-500 sm:aspect-[16/8]",
                k === i ? "opacity-100" : "opacity-40 hover:opacity-60")}
              style={{ width: "min(78vw, 1040px)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={o.gorsel} alt={o.ad} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.5s] group-hover:scale-[1.03]" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 max-w-[460px] p-6 sm:p-10">
                <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-white/60"><span className="hidden sm:inline">Vayra Originals · </span>{o.tur}</p>
                <h3 className="mt-2 text-[30px] font-semibold tracking-[-0.03em] text-white sm:text-[44px]">{o.ad}</h3>
                <p className="mt-2 hidden text-[14.5px] leading-relaxed text-white/75 sm:block">{o.ozet}</p>
                <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-[13px] font-semibold text-white backdrop-blur-md transition-colors group-hover:bg-white group-hover:text-zemin">
                  <Play className="h-3.5 w-3.5 fill-current" /> İzle
                </span>
              </div>
            </Link>
          ))}
        </motion.div>

        <Kap className="mt-6 flex items-center justify-between">
          <div className="flex gap-1.5">
            {ORIGINALS.map((o, k) => (
              <button key={o.ad} onClick={() => setI(k)} aria-label={`${o.ad} slaytı`}
                className={cn("h-1.5 rounded-full transition-all duration-300", k === i ? "w-8 bg-white" : "w-1.5 bg-white/25 hover:bg-white/50")} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => git(-1)} aria-label="Önceki" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.12] text-white transition-colors hover:bg-white/[0.06]"><ArrowLeft className="h-4 w-4" /></button>
            <button onClick={() => git(1)} aria-label="Sonraki" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.12] text-white transition-colors hover:bg-white/[0.06]"><ArrowRight className="h-4 w-4" /></button>
          </div>
        </Kap>
      </div>
    </section>
  );
}
