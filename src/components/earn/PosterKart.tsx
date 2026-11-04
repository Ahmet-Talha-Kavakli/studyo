"use client";

/**
 * Earn poster kampanya kartı (Higgsfield Earn deseni): 5:4 kapak (üzerine gelince video),
 * platform hapı, başlık + özet, büyük Ödeme ve Bitiş. Genel bakış ve kampanya listesi paylaşır.
 */

import { useState } from "react";
import Link from "next/link";
import { Check, Play } from "lucide-react";
import { kisaSayi, platformBul, tl, type Kampanya } from "@/lib/earn/kampanyalar";
import { PlatformLogo } from "./ortak";
import { cn } from "@/lib/utils";

export const tarihMetni = (t: number) => new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "long" });

/** Kampanyanın ana ödülü: değer + birim. */
export function kampanyaOdul(k: Kampanya) {
  return k.tur === "goruntulenme" ? { deger: tl(k.oran!), birim: "1.000 izlenme başına" } : k.tur === "gorev" ? { deger: tl(k.odul!), birim: "teslim başına" } : { deger: tl(k.havuz!), birim: "ödül havuzu" };
}

/** Kapak görseli; oynat açıkken üstünde kampanya videosu. */
export function KampanyaKapak({ k, oynat, className }: { k: Kampanya; oynat?: boolean; className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={k.kapak} alt="" draggable={false} className={cn("absolute inset-0 h-full w-full select-none object-cover", className)} />
      {k.video && oynat && <video key={k.video} src={k.video} poster={k.kapak} autoPlay muted loop playsInline className={cn("absolute inset-0 h-full w-full object-cover", className)} />}
    </>
  );
}

export function PosterKart({ k, katildi, bitti }: { k: Kampanya; katildi?: boolean; bitti?: boolean }) {
  const [ust, setUst] = useState(false);
  const o = kampanyaOdul(k);
  const p = platformBul(k.platformlar[0]);
  return (
    <Link href={`/earn/kampanyalar/${k.id}`} onMouseEnter={() => setUst(true)} onMouseLeave={() => setUst(false)} onFocus={() => setUst(true)} onBlur={() => setUst(false)}
      className={cn("group block overflow-hidden rounded-[24px] bg-[#101114] ring-1 ring-white/[0.07] transition duration-300 hover:-translate-y-1 hover:ring-white/[0.18]", bitti && "opacity-55 hover:opacity-90")}>
      <div className="relative aspect-[5/4] overflow-hidden">
        <KampanyaKapak k={k} oynat={ust && !bitti} className={cn("transition-transform duration-[900ms] group-hover:scale-[1.05]", bitti && "grayscale-[60%]")} />
        <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#101114] to-transparent" />
        {bitti ? <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11.5px] font-medium text-white/85 backdrop-blur-md">Sona erdi</span>
          : katildi && <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-[#55d6fd] px-2.5 py-1 text-[11.5px] font-semibold text-[#06222b]"><Check className="h-3 w-3" strokeWidth={3} />Katıldın</span>}
        {k.video && !bitti && <span className={cn("absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition-opacity duration-300", ust && "opacity-0")}><Play className="h-3 w-3 fill-current" /></span>}
      </div>
      <div className="relative -mt-6 px-5 pb-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] py-1 pl-1.5 pr-2.5 text-[12px] font-medium text-white ring-1 ring-white/[0.1] backdrop-blur-md">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.08]"><PlatformLogo id={p.id} boyut={12} /></span>{p.ad}{k.platformlar.length > 1 && <span className="text-white/50">ve {k.platformlar.length - 1} platform</span>}
        </span>
        <p className="mt-3 line-clamp-1 text-[17px] font-semibold tracking-[-0.01em] text-white">{k.ad}</p>
        <p className="mt-1 line-clamp-2 min-h-[40px] text-[13.5px] leading-[1.5] text-white/55">{k.ozet}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-4">
          <div><p className="text-[12px] text-white/50">Ödeme</p><p className="mt-1 text-[22px] font-semibold leading-none tracking-[-0.02em] text-white">{o.deger}</p><p className="mt-1 text-[11.5px] text-white/45">{o.birim}</p></div>
          <div><p className="text-[12px] text-white/50">{bitti ? "Bitti" : "Bitiş"}</p><p className="mt-1 text-[22px] font-semibold leading-none tracking-[-0.02em] text-white">{tarihMetni(k.bitis)}</p><p className="mt-1 text-[11.5px] text-white/45">{kisaSayi(k.katilimci)} katılımcı</p></div>
        </div>
      </div>
    </Link>
  );
}
