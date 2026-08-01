import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

/* Kurumsal ortak UI — AÇIK/BEYAZ dil. Tüm sayfalar bunları paylaşır.
   Renkler .kurumsal-kapsam token'larından gelir; lime yalnızca aksan. */

export const cn = (...s: (string | false | undefined | null)[]) => s.filter(Boolean).join(" ");

/** Üst rozet — lime yumuşak zemin + koyu-lime metin. */
export function Rozet({ children, ikon: Ikon }: { children: ReactNode; ikon?: LucideIcon }) {
  return (
    <span className="kr-rozet inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold">
      {Ikon && <Ikon className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}

/** Beyaz kart primitifi (hairline + minimal gölge). */
export function Kart({ children, className, hover, tikla }: { children: ReactNode; className?: string; hover?: boolean; tikla?: () => void }) {
  return (
    <div onClick={tikla} className={cn("kr-kart p-6", hover && "kr-kart-hover", tikla && "cursor-pointer", className)}>
      {children}
    </div>
  );
}

/** Apple-glass benzeri lime ikon kutusu (beyaz varyant). */
export function KrIkon({ ikon: Ikon, boyut = 48 }: { ikon: LucideIcon; boyut?: number }) {
  return (
    <span className="kr-ikon flex shrink-0 items-center justify-center rounded-2xl" style={{ width: boyut, height: boyut }}>
      <Ikon style={{ width: boyut * 0.42, height: boyut * 0.42 }} />
    </span>
  );
}

/** Sayfa hero — beyaz, ortalı; opsiyonel üst rozet + CTA'lar. */
export function Hero({
  ustBaslik, baslik, aciklama, cta, izgara = true,
}: {
  ustBaslik?: string;
  baslik: string;
  aciklama?: string;
  cta?: ReactNode;
  izgara?: boolean;
}) {
  return (
    <section className="relative overflow-hidden px-4 pt-16 pb-10 text-center md:pt-20">
      {izgara && (
        <div className="kr-izgara-arka pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_40%,transparent_100%)]" />
      )}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-64 w-[520px] -translate-x-1/2 rounded-full bg-[#dafd55]/25 blur-[130px]" />
      <div className="mx-auto max-w-3xl">
        {ustBaslik && <div className="mb-4 flex justify-center"><Rozet>{ustBaslik}</Rozet></div>}
        <h1 className="text-balance text-4xl font-bold tracking-tight text-[color:var(--color-metin)] md:text-[52px] md:leading-[1.05]">{baslik}</h1>
        {aciklama && <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[color:var(--color-metin-2)]">{aciklama}</p>}
        {cta && <div className="mt-8 flex flex-wrap justify-center gap-3">{cta}</div>}
      </div>
    </section>
  );
}

/** Dolu lime CTA butonu (beyaz üstünde koyu metin). */
export function CTAButon({ href, children, onClick }: { href?: string; children: ReactNode; onClick?: () => void }) {
  const cls = "kr-cta inline-flex h-12 items-center gap-2 rounded-xl px-6 text-[15px] font-semibold";
  return href ? <Link href={href as never} className={cls}>{children}</Link> : <button onClick={onClick} className={cls}>{children}</button>;
}

/** İkincil (ghost) buton — hairline çerçeveli. */
export function GhostButon({ href, children }: { href?: string; children: ReactNode }) {
  const cls = "inline-flex h-12 items-center gap-2 rounded-xl border border-[color:var(--color-kenar-2)] px-6 text-[15px] font-semibold text-[color:var(--color-metin)] transition-colors hover:bg-[color:var(--color-yuzey-2)]";
  return href ? <Link href={href as never} className={cls}>{children}</Link> : <span className={cls}>{children}</span>;
}

/** Değer/özellik kartı: ikon + başlık + özet. */
export function DegerKart({ ikon, ad, ozet }: { ikon: LucideIcon; ad: string; ozet: string }) {
  return (
    <div className="kr-kart kr-kart-hover flex gap-4 p-6">
      <KrIkon ikon={ikon} boyut={46} />
      <div>
        <h3 className="font-semibold text-[color:var(--color-metin)]">{ad}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--color-metin-2)]">{ozet}</p>
      </div>
    </div>
  );
}

/** İstatistik bandı — sayı + etiket ızgarası. */
export function IstatistikBandi({ ogeler }: { ogeler: { ikon?: LucideIcon; deger: string; etiket: string }[] }) {
  return (
    <div className="kr-kart grid grid-cols-2 divide-y divide-[color:var(--color-kenar)] sm:grid-cols-4 sm:divide-y-0 sm:divide-x">
      {ogeler.map((o) => (
        <div key={o.etiket} className="flex flex-col items-center px-4 py-6 text-center">
          {o.ikon && <o.ikon className="mb-2 h-5 w-5 text-[color:var(--kr-lime-metin)]" />}
          <div className="text-[30px] font-bold leading-none text-[color:var(--color-metin)]">{o.deger}</div>
          <div className="mt-1.5 text-[13px] text-[color:var(--color-metin-2)]">{o.etiket}</div>
        </div>
      ))}
    </div>
  );
}

/** Bölüm başlığı (ortalı). */
export function BolumBaslik({ ustBaslik, baslik, ozet }: { ustBaslik?: string; baslik: string; ozet?: string }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      {ustBaslik && <div className="mb-3 flex justify-center"><Rozet>{ustBaslik}</Rozet></div>}
      <h2 className="text-3xl font-bold tracking-tight text-[color:var(--color-metin)]">{baslik}</h2>
      {ozet && <p className="mt-3 text-[color:var(--color-metin-2)]">{ozet}</p>}
    </div>
  );
}

/** Numaralı süreç adımları (başvuru/ortaklık akışı). */
export function SurecAdimlari({ adimlar }: { adimlar: { no: number; ad: string; aciklama: string; sure: string }[] }) {
  return (
    <div className="relative space-y-3 border-l-2 border-[color:var(--color-kenar)] pl-8">
      {adimlar.map((a) => (
        <div key={a.no} className="relative">
          <span className="absolute -left-[41px] top-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#dafd55] text-sm font-bold text-[#14160b] ring-4 ring-white">{a.no}</span>
          <div className="kr-kart p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-[color:var(--color-metin)]">{a.ad}</h3>
              <span className="shrink-0 text-xs font-medium text-[color:var(--color-metin-3)]">{a.sure}</span>
            </div>
            <p className="mt-1 text-sm text-[color:var(--color-metin-2)]">{a.aciklama}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Basit SSS listesi (sayfa içi mini akordeon — kurumsal beyaz). */
export function MiniSSS({ maddeler }: { maddeler: { s: string; c: string }[] }) {
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {maddeler.map((m) => (
        <details key={m.s} className="kr-kart group overflow-hidden [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 font-semibold text-[color:var(--color-metin)]">
            {m.s}
            <span className="shrink-0 text-[color:var(--color-metin-3)] transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="px-5 pb-5 text-sm leading-relaxed text-[color:var(--color-metin-2)]">{m.c}</p>
        </details>
      ))}
    </div>
  );
}

/** Alt CTA şeridi — koyu ink kutu (beyaz sayfa içinde kontrast vurgu). */
export function CTASerit({ baslik, ozet, birincil, ikincil }: {
  baslik: string; ozet?: string;
  birincil: { ad: string; href: string };
  ikincil?: { ad: string; href: string };
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="relative overflow-hidden rounded-3xl bg-[#0a0a0b] px-6 py-14 text-center md:px-12">
        <div className="pointer-events-none absolute left-1/2 top-0 h-56 w-[480px] -translate-x-1/2 rounded-full bg-[#dafd55]/20 blur-[120px]" />
        <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">{baslik}</h2>
        {ozet && <p className="mx-auto mt-3 max-w-xl text-white/60">{ozet}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={birincil.href as never} className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#dafd55] px-6 text-[15px] font-semibold text-[#14160b] transition-transform hover:scale-[1.03]">
            {birincil.ad} <ArrowRight className="h-4 w-4" />
          </Link>
          {ikincil && (
            <Link href={ikincil.href as never} className="inline-flex h-12 items-center rounded-xl border border-white/15 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-white/8">
              {ikincil.ad}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
