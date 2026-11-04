"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { VITRIN } from "./veri";
import { BolumBaslik, Belir, GorunurVideo, Kap } from "./ortak";
import { cn } from "@/lib/utils";
import { IKON_KARO, IKON_KARO_HOVER, METIN_RENK, type RenkTuru } from "@/lib/renk";

const SURE_MS = 8000;

/**
 * Ürün vitrini — solda tür akordeonu (ilerleme çubuklu, otomatik geçer),
 * ortada büyük medya, sağda o türün araç paneli. Fare kartın üstündeyken durur.
 */
export function UrunVitrini() {
  const [aktif, setAktif] = useState(0);
  const [duraklat, setDuraklat] = useState(false);
  const azHareket = useReducedMotion(); // "hareketi azalt" açıksa otomatik döngü yok
  const sekme = VITRIN[aktif];

  useEffect(() => {
    if (duraklat || azHareket) return;
    const t = setTimeout(() => setAktif((a) => (a + 1) % VITRIN.length), SURE_MS);
    return () => clearTimeout(t);
  }, [aktif, duraklat, azHareket]);

  return (
    <section className="py-16 sm:py-20">
      <Kap>
        <BolumBaslik ortala ust="Tek platform"
          baslik="Üretmek istediğin her şey, tek yerde."
          alt="Bir fikirle başla, sahneyi kur, sesini ekle. Her araç, her model, her format aynı çalışma alanında." />

        <Belir>
          {/* Yalnız fare duraklatır — dokunmatikte taklit mouseenter döngüyü kalıcı durdurmasın */}
          <div onPointerEnter={(e) => { if (e.pointerType === "mouse") setDuraklat(true); }}
            onPointerLeave={(e) => { if (e.pointerType === "mouse") setDuraklat(false); }}
            className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-[28px] border border-white/[0.07] bg-yuzey p-3 sm:p-4 lg:grid-cols-[300px_minmax(0,1fr)]">
            {/* Tür akordeonu */}
            <div className="flex min-w-0 flex-col p-2 sm:p-4">
              <div className="gizli-scroll -mx-2 flex gap-1 overflow-x-auto px-2 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0">
                {VITRIN.map((s, i) => {
                  const secili = i === aktif;
                  return (
                    <div key={s.id} className="shrink-0 lg:border-b lg:border-white/[0.06]">
                      <button onClick={() => setAktif(i)} aria-expanded={secili}
                        className={cn(
                          "group flex w-full items-center gap-2.5 text-left text-[14px] font-medium transition-colors lg:py-4 lg:text-[16px]",
                          "rounded-full px-3.5 py-2 lg:rounded-none lg:px-0",
                          secili ? "bg-white/[0.08] text-white lg:bg-transparent" : "text-metin-2 hover:bg-white/[0.04] hover:text-white lg:hover:bg-transparent",
                        )}>
                        <s.ikon className={cn("h-[18px] w-[18px]", METIN_RENK[s.id as RenkTuru])} strokeWidth={1.9} />
                        {s.ad}
                      </button>
                      {/* Açıklama + ilerleme yalnız masaüstü akordeonda (butonun dışında) */}
                      <AnimatePresence initial={false}>
                        {secili && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="hidden overflow-hidden lg:block">
                            <p className="-mt-2 pb-4 text-[13.5px] leading-relaxed text-metin-2">{s.ozet}</p>
                            <span className="mb-4 block h-[2px] overflow-hidden rounded-full bg-white/[0.08]">
                              <motion.span key={`${aktif}-${duraklat}`} className="block h-full bg-vurgu"
                                initial={{ width: duraklat ? "100%" : "0%" }} animate={{ width: "100%" }}
                                transition={{ duration: duraklat ? 0 : SURE_MS / 1000, ease: "linear" }} />
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-[13.5px] leading-relaxed text-metin-2 lg:hidden">{sekme.ozet}</p>
            </div>

            {/* Medya + araç paneli */}
            <div className="relative overflow-hidden rounded-[20px] bg-black">
              <div className="relative aspect-[4/3] sm:aspect-[16/10]">
                <AnimatePresence initial={false}>
                  <motion.div key={sekme.id} className="absolute inset-0"
                    initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                    {sekme.medya.tur === "video"
                      ? <GorunurVideo src={sekme.medya.src} preload="auto" className="h-full w-full object-cover" />
                      : /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={sekme.medya.src} alt="" className="h-full w-full object-cover" />}
                  </motion.div>
                </AnimatePresence>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-black/55 via-transparent to-transparent" />
              </div>

              {/* Araç paneli — masaüstünde medyanın üstünde yüzer, mobilde altında */}
              <div className="border-t border-white/[0.06] bg-yuzey p-2 md:absolute md:right-4 md:top-4 md:max-h-[calc(100%-2rem)] md:w-[264px] md:overflow-y-auto md:rounded-2xl md:border md:border-white/[0.08] md:bg-yuzey/85 md:backdrop-blur-xl">
                <p className="px-2.5 pb-1.5 pt-2 text-[11px] font-medium uppercase tracking-[0.12em] text-metin-3">{sekme.ad} araçları</p>
                <AnimatePresence mode="wait">
                  <motion.ul key={sekme.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
                    className="grid grid-cols-2 gap-0.5 md:grid-cols-1">
                    {sekme.araclar.map((a, i) => (
                      <motion.li key={a.ad + a.href} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
                        <Link href={a.href} className="group flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/[0.06]">
                          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ring-1 ring-inset transition-colors", IKON_KARO[sekme.id as RenkTuru], IKON_KARO_HOVER[sekme.id as RenkTuru])}>
                            <a.ikon className="h-[17px] w-[17px]" strokeWidth={1.9} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13.5px] font-medium text-white">{a.ad}</span>
                            <span className="block truncate text-[12px] text-metin-3">{a.aciklama}</span>
                          </span>
                          <ArrowUpRight className="hidden h-3.5 w-3.5 shrink-0 text-metin-3 opacity-0 transition-opacity group-hover:opacity-100 md:block" />
                        </Link>
                      </motion.li>
                    ))}
                  </motion.ul>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </Belir>
      </Kap>
    </section>
  );
}
