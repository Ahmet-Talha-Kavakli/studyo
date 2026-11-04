"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HIKAYELER, SEKTORLER } from "@/lib/kurumsal/musteriler";
import { cn } from "@/lib/utils";

/** Sektöre göre süzülebilen müşteri hikâyeleri. İlk öne çıkan geniş kart olarak gösterilir. */
export function HikayeIzgarasi() {
  const [sektor, setSektor] = useState<(typeof SEKTORLER)[number]>("Tümü");
  const liste = sektor === "Tümü" ? HIKAYELER : HIKAYELER.filter((h) => h.sektor === sektor);
  const [ilk, ...diger] = liste;

  return (
    <div>
      <div role="tablist" aria-label="Sektör" className="-mx-4 mb-8 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
        {SEKTORLER.map((s) => (
          <button key={s} role="tab" aria-selected={sektor === s} onClick={() => setSektor(s)}
            className={cn("shrink-0 rounded-full px-4 py-2 text-[13.5px] font-medium transition-colors", sektor === s ? "bg-white text-zemin" : "border border-white/[0.1] text-metin-2 hover:text-white")}>{s}</button>
        ))}
      </div>

      {ilk && (
        <Link href={`/referanslar/${ilk.slug}`} className="group grid overflow-hidden rounded-[26px] border border-white/[0.07] bg-yuzey transition-colors hover:border-white/[0.16] lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[420px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ilk.kapak} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
          </div>
          <div className="flex flex-col p-7 sm:p-9">
            <p className="text-[12.5px] font-medium text-vurgu">{ilk.sektor} · {ilk.konum}</p>
            <h2 className="mt-3 text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-white sm:text-[32px]">{ilk.baslik}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-metin-2">{ilk.ozet}</p>
            <dl className="mt-auto grid grid-cols-3 gap-4 border-t border-white/[0.07] pt-6">
              {ilk.metrikler.map((m) => (
                <div key={m.etiket}><dt className="text-[26px] font-semibold tabular-nums tracking-[-0.03em] text-white">{m.deger}</dt><dd className="mt-1 text-[12.5px] leading-snug text-metin-3">{m.etiket}</dd></div>
              ))}
            </dl>
          </div>
        </Link>
      )}

      {diger.length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {diger.map((h) => (
            <Link key={h.slug} href={`/referanslar/${h.slug}`} className="group flex flex-col overflow-hidden rounded-[22px] border border-white/[0.07] bg-yuzey transition-colors hover:border-white/[0.16]">
              <div className="relative aspect-[16/10] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={h.kapak} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                <p className="absolute bottom-4 left-5 text-[36px] font-semibold leading-none tracking-[-0.04em] text-white">{h.metrikler[0].deger}</p>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-[12.5px] text-metin-3">{h.sirket} · {h.sektor}</p>
                <p className="mt-2 flex-1 text-[16px] font-semibold leading-snug text-white">{h.baslik}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-metin-2 group-hover:text-white">Hikâyeyi oku <ArrowRight className="h-3.5 w-3.5" /></span>
              </div>
            </Link>
          ))}
        </div>
      )}
      {!liste.length && <p className="rounded-[22px] border border-dashed border-white/[0.1] py-16 text-center text-[14px] text-metin-2">Bu sektörde henüz yayınlanmış bir hikâye yok.</p>}
    </div>
  );
}
