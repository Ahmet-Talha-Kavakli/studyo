"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

/**
 * Hata sahnesi — 404 ve çalışma hataları için ortak ekran.
 * Arka planda Vayra ile üretilmiş gerçek bir sinematik plan döner; üstünde kısa
 * bir başlık, en fazla iki eylem ve altta hızlı bağlantı şeridi. "Hareketi azalt"
 * tercihinde video oynatılmaz, ilk karede durur.
 */
export type HizliBaglanti = { ad: string; href: string; ikon: LucideIcon };

export function HataSahnesi({
  kod, baslik, aciklama, video, poster, eylemler, ek, baglantilar, yukseklik = "calc(100svh - var(--ust-nav))",
}: {
  kod: string; baslik: ReactNode; aciklama: ReactNode; video: string; poster?: string;
  eylemler: ReactNode; ek?: ReactNode; baglantilar?: HizliBaglanti[]; yukseklik?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { v.pause(); v.currentTime = 1.2; }
    else void v.play().catch(() => {});
  }, []);

  return (
    <section className="relative isolate flex flex-col overflow-hidden bg-[#050506]" style={{ minHeight: yukseklik }}>
      <video ref={ref} src={video} poster={poster} muted loop playsInline preload="auto" aria-hidden
        className="absolute inset-0 -z-10 h-full w-full object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(5,5,6,0.35)_0%,rgba(5,5,6,0.75)_70%)]" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-56 bg-gradient-to-t from-[#050506] to-transparent" />

      <div className="flex flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <p className="text-[14px] font-medium text-white/60">{kod}</p>
        <h1 className="mt-4 max-w-[860px] text-balance text-[40px] font-semibold leading-[1.02] tracking-[-0.035em] text-white sm:text-[64px]">{baslik}</h1>
        <div className="mt-5 max-w-[540px] text-pretty text-[15.5px] leading-relaxed text-white/70">{aciklama}</div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">{eylemler}</div>
        {ek && <div className="mt-6 w-full max-w-[540px]">{ek}</div>}
      </div>

      {baglantilar && baglantilar.length > 0 && (
        <nav aria-label="Hızlı bağlantılar" className="px-5 pb-[calc(84px+env(safe-area-inset-bottom))] sm:pb-8">
          <ul className="mx-auto flex max-w-[960px] flex-wrap items-center justify-center gap-2">
            {baglantilar.map((b) => (
              <li key={b.href}>
                <Link href={b.href} className="group inline-flex h-9 items-center gap-2 rounded-full border border-white/[0.12] bg-black/30 px-3.5 text-[13px] text-white/80 backdrop-blur-md transition-colors hover:border-white/25 hover:bg-black/45 hover:text-white">
                  <b.ikon className="h-3.5 w-3.5 text-white/55 group-hover:text-white" />{b.ad}
                  <ArrowUpRight className="h-3 w-3 text-white/35 transition-transform group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-white/70" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </section>
  );
}

export const anaBtn = "inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-[#0b0b0d] transition-opacity hover:opacity-90";
export const ikinciBtn = "inline-flex h-11 items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-5 text-[14px] font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/[0.12]";
