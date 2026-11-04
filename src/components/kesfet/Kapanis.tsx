"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Plus } from "lucide-react";
import { FOOTER_KOLONLAR, SSS } from "./veri";
import { Belir, Kap, butonSinif } from "./ortak";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { XIcon, InstagramIcon, YoutubeIcon, GithubIcon } from "@/components/site/SocialIcons";
import { SIRKET, SOSYAL, TR_SIRKET } from "@/lib/kurumsal/site";
import { cn } from "@/lib/utils";

/** SSS — solda başlık, sağda akordeon. Aynı anda tek soru açık. */
export function SikSorulanlar({ sorular = SSS, baslik = "Aklındaki sorular." }: { sorular?: { s: string; c: string }[]; baslik?: string } = {}) {
  const [acik, setAcik] = useState<number | null>(0);
  return (
    <section className="py-16 sm:py-20">
      <Kap className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
        <Belir>
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-vurgu">SSS</p>
          <h2 className="text-balance text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-[44px]">{baslik}</h2>
          <p className="mt-4 max-w-[340px] text-[15px] leading-relaxed text-metin-2">Cevabını bulamadın mı? Ekibimiz yardıma hazır.</p>
          <Link href="/iletisim" className={cn(butonSinif("ikincil"), "mt-7")}>Destekle iletişime geç</Link>
        </Belir>
        <Belir gecikme={0.05}>
          <div className="border-t border-white/[0.07]">
            {sorular.map((q, i) => {
              const a = acik === i;
              return (
                <div key={q.s} className="border-b border-white/[0.07]">
                  <button onClick={() => setAcik(a ? null : i)} aria-expanded={a}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left">
                    <span className={cn("text-[16px] font-medium transition-colors sm:text-[17px]", a ? "text-white" : "text-white/80 hover:text-white")}>{q.s}</span>
                    <Plus className={cn("h-5 w-5 shrink-0 text-metin-2 transition-transform duration-300", a && "rotate-45 text-aksan")} />
                  </button>
                  <AnimatePresence initial={false}>
                    {a && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                        <p className="max-w-[640px] pb-6 text-[15px] leading-relaxed text-metin-2">{q.c}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </Belir>
      </Kap>
    </section>
  );
}

/** Kapanış çağrısı — tam genişlik görsel, tek net eylem. */
export function KapanisCTA({ onBasla, baslik = "Sıradaki sahne senin." }: { onBasla: () => void; baslik?: string }) {
  return (
    <section className="relative isolate overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/gercek/orig/banner-atlas-creative.webp" alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-zemin via-zemin/55 to-zemin/80" />
      <Kap className="flex min-h-[560px] flex-col items-center justify-center py-28 text-center">
        <Belir className="flex flex-col items-center">
          <h2 className="text-balance text-[44px] font-semibold leading-[1.02] tracking-[-0.035em] text-white sm:text-[76px]">{baslik}</h2>
          <p className="mt-5 max-w-[480px] text-[16px] leading-relaxed text-white/75">Bir cümle yaz, gerisini Vayra halletsin. Ücretsiz başla, kart bilgisi gerekmez.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <button onClick={onBasla} className={butonSinif("birincil")}>Üretmeye başla <ArrowRight className="h-4 w-4" /></button>
            <Link href="/fiyatlandirma" className={cn(butonSinif("ikincil"), "bg-black/20 backdrop-blur-md")}>Fiyatları gör</Link>
          </div>
        </Belir>
      </Kap>
    </section>
  );
}

/** Sayfa altbilgisi. */
export function Altbilgi() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#0e0e10]">
      <Kap className="py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,3fr)]">
          <div>
            <Link href="/panel" className="inline-flex items-center gap-2">
              <VayraIsaret size={30} />
              <span className="text-[17px] font-semibold text-white">Vayra</span>
            </Link>
            <p className="mt-4 max-w-[280px] text-[13.5px] leading-relaxed text-metin-2">Video, görsel, ses, müzik ve 3D için yapay zekâ yaratım platformu. Amsterdam ve İstanbul&apos;dan dünyaya.</p>
            <div className="mt-6 flex gap-2">
              {[
                { I: XIcon, ad: "X", url: SOSYAL.x },
                { I: InstagramIcon, ad: "Instagram", url: SOSYAL.instagram },
                { I: YoutubeIcon, ad: "YouTube", url: SOSYAL.youtube },
                { I: GithubIcon, ad: "GitHub", url: SOSYAL.github },
              ].map(({ I, ad, url }) => (
                <a key={ad} href={url} target="_blank" rel="noopener noreferrer" aria-label={ad}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] text-metin-2 transition-colors hover:border-white/20 hover:text-white">
                  <I className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
            {FOOTER_KOLONLAR.map((k) => (
              <div key={k.baslik}>
                <p className="text-[13px] font-semibold text-white">{k.baslik}</p>
                <ul className="mt-4 space-y-2.5">
                  {k.linkler.map(([ad, href]) => (
                    <li key={ad}><Link href={href} className="text-[13.5px] text-metin-2 transition-colors hover:text-white">{ad}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-white/[0.06] pt-8 text-[12.5px] text-metin-3 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {SIRKET.yasalAd} · Türkiye&apos;de {TR_SIRKET.kisaAd}</p>
          <p>Fiyatlar Türk lirası cinsindendir · KVKK ve GDPR uyumlu</p>
        </div>
      </Kap>
    </footer>
  );
}
