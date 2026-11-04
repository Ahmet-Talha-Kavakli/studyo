"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { KULLANIM, PRESETLER } from "./veri";
import { BolumBaslik, Belir, GorunurVideo, Kap, butonSinif, useHoverVideo } from "./ortak";
import { cn } from "@/lib/utils";

/** Kullanım alanları — üç dikey kart + bir geniş film kartı. */
export function KullanimAlanlari() {
  return (
    <section className="py-16 sm:py-20">
      <Kap>
        <BolumBaslik ust="Kullanım alanları"
          baslik="Ürün çekiminden viral reklama."
          alt="Markaların ihtiyaç duyduğu her şey: kampanyalar, ürün fotoğrafları ve sinema kalitesinde film. Her formatta, her seferinde."
          sag={<Link href="/panel/pazarlama" className={butonSinif("beyaz")}>Pazarlama Stüdyosu <ArrowRight className="h-4 w-4" /></Link>} />

        <div className="grid gap-3 sm:grid-cols-3">
          {KULLANIM.map((k, i) => (
            <Belir key={k.ad} gecikme={i * 0.06} className={cn(k.genis && "sm:col-span-3")}>
              <Link href={k.href}
                className={cn("group relative block overflow-hidden rounded-[24px] border border-white/[0.07] bg-yuzey",
                  k.genis ? "aspect-[4/5] sm:aspect-[21/8]" : "aspect-[4/5]")}>
                <GorunurVideo src={k.video} poster={k.poster} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.04]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 sm:p-7">
                  <div className="max-w-[420px]">
                    <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-white sm:text-[24px]">{k.ad}</h3>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-white/70">{k.ozet}</p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors group-hover:bg-white group-hover:text-zemin">
                    <ArrowUpRight className="h-[18px] w-[18px]" />
                  </span>
                </div>
              </Link>
            </Belir>
          ))}
        </div>
      </Kap>
    </section>
  );
}

/** Viral presetler — dikey video kartları, üzerine gelince oynar. */
export function Presetler() {
  return (
    <section className="py-16 sm:py-20">
      <Kap>
        <BolumBaslik ust="Viral presetler"
          baslik="Büyük bütçeli efektler, tek tıkla."
          alt="Bir fotoğraf yükle, preseti seç. Patlamalardan gerçeküstü dönüşümlere, sosyal medyada en çok paylaşılan efektler."
          sag={<Link href="/panel/presetler" className="group inline-flex items-center gap-1.5 text-[14px] font-medium text-white/80 transition-colors hover:text-white">Tüm presetler <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>} />
      </Kap>
      <div className="gizli-scroll flex snap-x gap-3 overflow-x-auto pb-2 kesfet-tasma">
        {PRESETLER.map((p) => <PresetKart key={p.ad} {...p} />)}
        <span className="w-1 shrink-0" aria-hidden />
      </div>
    </section>
  );
}

function PresetKart({ ad, video }: { ad: string; video: string }) {
  const { ref, oynat, durdur } = useHoverVideo();
  return (
    <Link href="/panel/presetler" onMouseEnter={oynat} onMouseLeave={durdur} onFocus={oynat} onBlur={durdur}
      className="group relative aspect-[9/14] w-[200px] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/[0.07] bg-yuzey sm:w-[220px]">
      <video ref={ref} src={`${video}#t=0.5`} muted loop playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
      <p className="absolute inset-x-0 bottom-0 p-4 text-[14px] font-semibold uppercase tracking-wide text-white">{ad}</p>
      <span className="absolute right-3 top-3 rounded-full bg-black/45 px-2 py-0.5 text-[10.5px] font-medium text-white/85 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">Dene →</span>
    </Link>
  );
}
