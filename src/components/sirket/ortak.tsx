import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Belir, BolumBaslik, Kap } from "@/components/kesfet/ortak";
import { butonSinif } from "@/lib/buton";
import { cn } from "@/lib/utils";

/* Şirket sayfalarının ortak yapı taşları — ana sayfa / fiyatlandırma ile aynı dil:
   koyu zemin, Geist başlıklar, elektrik vurgu, numaralı listeler, sayı şeritleri. */

export { Kap, Belir, BolumBaslik, butonSinif };

/** Sayfa girişi. `medya` verilirse sağda (masaüstü) gösterilir. */
export function SirketHero({ ust, baslik, alt, children, medya, ortala }: {
  ust: string; baslik: React.ReactNode; alt?: React.ReactNode; children?: React.ReactNode; medya?: React.ReactNode; ortala?: boolean;
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.06]">
      <Kap className={cn("grid items-center gap-12 pb-16 pt-14 sm:pb-20 sm:pt-20", medya && "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]", ortala && "text-center")}>
        <Belir className={cn(ortala && "flex flex-col items-center")}>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-vurgu">{ust}</p>
          <h1 className="mt-5 max-w-[860px] text-balance text-[40px] font-semibold leading-[1.02] tracking-[-0.04em] text-white sm:text-[62px]">{baslik}</h1>
          {alt && <p className={cn("mt-6 max-w-[620px] text-pretty text-[16.5px] leading-relaxed text-metin-2", ortala && "mx-auto")}>{alt}</p>}
          {children && <div className={cn("mt-8 flex flex-wrap gap-3", ortala && "justify-center")}>{children}</div>}
        </Belir>
        {medya && <Belir gecikme={0.08}>{medya}</Belir>}
      </Kap>
    </section>
  );
}

export function Bolum({ id, ust, baslik, alt, sag, ortala, children, className }: {
  id?: string; ust?: string; baslik?: React.ReactNode; alt?: React.ReactNode; sag?: React.ReactNode; ortala?: boolean; children: React.ReactNode; className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-20 py-16 sm:py-24", className)}>
      <Kap>
        {baslik && <BolumBaslik ust={ust} baslik={baslik} alt={alt} sag={sag} ortala={ortala} />}
        {children}
      </Kap>
    </section>
  );
}

/** 3–5 somut sayı. */
export function SayiSeridi({ ogeler, className }: { ogeler: { deger: string; etiket: string }[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-px overflow-hidden rounded-[22px] border border-white/[0.07] bg-white/[0.06]", ogeler.length >= 4 ? "lg:grid-cols-4" : "sm:grid-cols-3", className)}>
      {ogeler.map((o) => (
        <div key={o.etiket} className="bg-zemin px-6 py-7">
          <p className="text-[34px] font-semibold leading-none tabular-nums tracking-[-0.03em] text-white sm:text-[42px]">{o.deger}</p>
          <p className="mt-2 text-[13.5px] text-metin-2">{o.etiket}</p>
        </div>
      ))}
    </div>
  );
}

/** 01–06 numaralı ilke / değer ızgarası. */
export function NumaraliIzgara({ ogeler, sutun = 3 }: { ogeler: { baslik: string; metin: string }[]; sutun?: 2 | 3 }) {
  return (
    <div className={cn("grid gap-x-10 gap-y-10 sm:grid-cols-2", sutun === 3 && "lg:grid-cols-3")}>
      {ogeler.map((o, i) => (
        <Belir key={o.baslik} gecikme={i * 0.03}>
          <div className="border-t border-white/[0.1] pt-5">
            <p className="text-[13px] font-semibold tabular-nums text-vurgu">{String(i + 1).padStart(2, "0")}</p>
            <h3 className="mt-3 text-[19px] font-semibold tracking-[-0.01em] text-white">{o.baslik}</h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-metin-2">{o.metin}</p>
          </div>
        </Belir>
      ))}
    </div>
  );
}

/** Süreç: yatay adımlar (masaüstü), dikey (mobil). */
export function SurecAdimlari({ adimlar }: { adimlar: { ad: string; aciklama: string; sure?: string }[] }) {
  return (
    <ol className={cn("grid gap-3", adimlar.length >= 5 ? "md:grid-cols-5" : adimlar.length === 4 ? "md:grid-cols-4" : "md:grid-cols-3")}>
      {adimlar.map((a, i) => (
        <li key={a.ad} className="relative rounded-[20px] border border-white/[0.07] bg-yuzey p-5">
          <div className="flex items-center justify-between">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-vurgu/15 text-[12px] font-bold text-vurgu">{i + 1}</span>
            {a.sure && <span className="text-[12px] text-metin-3">{a.sure}</span>}
          </div>
          <p className="mt-4 text-[15px] font-semibold text-white">{a.ad}</p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-metin-2">{a.aciklama}</p>
        </li>
      ))}
    </ol>
  );
}

/** Sayfa sonu çağrısı: görselli bant, bir birincil bir ikincil eylem. */
export function KapanisBandi({ baslik, alt, birincil, ikincil, gorsel = "/gercek/orig/banner-atlas-creative.webp" }: {
  baslik: React.ReactNode; alt?: string; birincil: { ad: string; href: string }; ikincil?: { ad: string; href: string }; gorsel?: string;
}) {
  return (
    <section className="py-16 sm:py-24">
      <Kap>
        <div className="relative isolate overflow-hidden rounded-[28px] border border-white/[0.08] px-6 py-16 text-center sm:px-12 sm:py-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gorsel} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/80 via-black/60 to-black/85" />
          <h2 className="mx-auto max-w-[720px] text-balance text-[32px] font-semibold leading-[1.06] tracking-[-0.035em] text-white sm:text-[48px]">{baslik}</h2>
          {alt && <p className="mx-auto mt-4 max-w-[520px] text-[15.5px] leading-relaxed text-white/75">{alt}</p>}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={birincil.href} className={butonSinif("beyaz")}>{birincil.ad} <ArrowRight className="h-4 w-4" /></Link>
            {ikincil && <Link href={ikincil.href} className={cn(butonSinif("ikincil"), "bg-black/20 backdrop-blur-md")}>{ikincil.ad}</Link>}
          </div>
        </div>
      </Kap>
    </section>
  );
}

/** Form alanı sınıfları — tüm şirket formlarında aynı. */
export const girdiSinif = "h-11 w-full rounded-xl border border-white/[0.1] bg-zemin px-3.5 text-[14px] text-white outline-none transition-colors placeholder:text-metin-3 focus:border-white/30";
export const etiketSinif = "mb-1.5 block text-[12.5px] font-medium text-metin-2";
