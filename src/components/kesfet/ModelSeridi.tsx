"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { MODELLER, type ModelKart } from "./veri";
import { BolumBaslik, Kap } from "./ortak";
import { cn } from "@/lib/utils";
import { METIN_RENK, type RenkTuru } from "@/lib/renk";

const TUR_ANAHTAR: Record<ModelKart["tur"], RenkTuru> = { Video: "video", "Görsel": "gorsel", Ses: "ses", "3D": "3d" };

/** Sonsuz kayan iki model şeridi (zıt yönler). Üzerine gelince durur. */
export function ModelSeridi({ ust = "Modeller", baslik = "En yeni modeller, ilk gün Vayra'da.", alt = "Dünyanın önde gelen laboratuvarlarının modellerini ayrı ayrı abone olmadan kullan. Hangisi işine en uygunsa onu seç." }: { ust?: string; baslik?: string; alt?: string } = {}) {
  const yarim = Math.ceil(MODELLER.length / 2);
  const ustSerit = MODELLER.slice(0, yarim), altSerit = MODELLER.slice(yarim);
  return (
    <section className="overflow-hidden py-16 sm:py-20">
      <Kap>
        <BolumBaslik ust={ust}
          baslik={baslik}
          alt={alt}
          sag={<Link href="/modeller" className="group inline-flex items-center gap-1.5 text-[14px] font-medium text-white/80 transition-colors hover:text-white">Tüm modeller <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>} />
      </Kap>
      <div className="kesfet-serit-maske flex flex-col gap-3">
        <Serit modeller={ustSerit} />
        <Serit modeller={altSerit} ters />
      </div>
    </section>
  );
}

function Serit({ modeller, ters }: { modeller: ModelKart[]; ters?: boolean }) {
  // Kesintisiz döngü için liste dört kez basılır; animasyon -%50'ye kayar.
  const liste = [...modeller, ...modeller, ...modeller, ...modeller];
  return (
    <div className="group flex w-max">
      <div className={cn("flex gap-3 pr-3 group-hover:[animation-play-state:paused]", ters ? "kesfet-kay-ters" : "kesfet-kay")}>
        {liste.map((m, i) => (
          <Link key={i} href="/modeller" tabIndex={i >= modeller.length ? -1 : undefined} aria-hidden={i >= modeller.length}
            className="flex h-[92px] w-[300px] shrink-0 items-center gap-4 rounded-2xl border border-white/[0.07] bg-yuzey px-4 transition-colors hover:border-white/[0.16] hover:bg-yuzey-2">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.06]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.logo} alt="" className="h-7 w-7" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate text-[16px] font-semibold tracking-[-0.01em] text-white">{m.ad}</span>
                {m.yeni && <span className="shrink-0 rounded-full bg-vurgu px-1.5 py-px text-[10px] font-bold text-vurgu-ust">YENİ</span>}
              </span>
              <span className="mt-1 flex items-center gap-1.5 text-[12.5px] text-metin-3">
                <span className="truncate">{m.saglayici}</span>
                <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-metin-3" />
                <span className={cn("shrink-0 font-medium", METIN_RENK[TUR_ANAHTAR[m.tur]])}>{m.tur}</span>
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
