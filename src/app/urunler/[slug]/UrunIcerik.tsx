"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { katalogIkon } from "@/lib/ikonlar";
import { SayfaKabuk } from "@/components/site/SayfaKabuk";
import { Reveal } from "@/components/site/Reveal";
import type { UrunSayfa } from "@/lib/urunler";

function DinamikIkon({ ad, className }: { ad: string; className?: string }) {
  const Ikon = katalogIkon(ad);
  return <Ikon className={className} />;
}

export function UrunIcerik({ urun }: { urun: UrunSayfa }) {
  return (
    <SayfaKabuk>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-16 text-center">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className={`absolute left-1/2 top-0 h-80 w-[560px] -translate-x-1/2 rounded-full bg-gradient-to-r ${urun.renk} opacity-20 blur-[120px]`} />
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className={`text-sm font-semibold uppercase tracking-widest ${urun.vurgu}`}>{urun.ustBaslik}</span>
          {urun.fark && <span className="rounded-full bg-cyan-glow/15 px-2 py-0.5 text-[11px] font-semibold text-cyan-glow">Vayra Farkı</span>}
        </div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-3 max-w-3xl text-balance text-4xl font-bold tracking-tight md:text-6xl">
          {urun.baslik}
        </motion.h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-white/60">{urun.aciklama}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/kayit" className={`inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r ${urun.renk} px-7 font-semibold text-ink-950 shadow-lg transition-all hover:-translate-y-0.5`}>
            {urun.cta} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/kesfet" className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/15 px-7 font-medium transition-colors hover:bg-white/8">
            Örnekleri gör
          </Link>
        </div>

        {/* Görsel placeholder */}
        <Reveal>
          <div className={`mx-auto mt-14 aspect-video w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${urun.renk} opacity-90 shadow-2xl`}>
            <div className="flex h-full items-center justify-center">
              <DinamikIkon ad={urun.ozellikler[0].ikon} className="h-24 w-24 text-white/40" />
            </div>
          </div>
        </Reveal>
      </section>

      {/* Özellikler */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-5 sm:grid-cols-2">
          {urun.ozellikler.map((o, i) => (
            <Reveal key={o.baslik} i={i}>
              <div className="flex gap-4 rounded-2xl border border-white/10 bg-yuzey p-6">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${urun.renk} shadow-lg`}>
                  <DinamikIkon ad={o.ikon} className="h-6 w-6 text-white" />
                </span>
                <div>
                  <h3 className="font-semibold">{o.baslik}</h3>
                  <p className="mt-1 text-sm text-white/60">{o.aciklama}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Akış */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal>
          <h2 className="mb-12 text-center text-3xl font-bold">Nasıl çalışır</h2>
        </Reveal>
        <div className="relative grid gap-8 md:grid-cols-4">
          <div className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent md:block" />
          {urun.akis.map((a, i) => (
            <Reveal key={a.adim} i={i}>
              <div className="text-center">
                <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${urun.renk} font-bold text-ink-950`}>
                  {i + 1}
                </div>
                <h3 className="mt-4 font-semibold">{a.adim}</h3>
                <p className="mt-1 text-sm text-white/55">{a.ozet}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-yuzey p-12 text-center">
            <div className={`pointer-events-none absolute left-1/2 top-0 h-40 w-80 -translate-x-1/2 rounded-full bg-gradient-to-r ${urun.renk} opacity-20 blur-3xl`} />
            <h2 className="relative text-3xl font-bold">Hazır mısın?</h2>
            <p className="relative mx-auto mt-3 max-w-lg text-white/60">Ücretsiz kredilerle hemen dene, farkı kendin gör.</p>
            <Link href="/kayit" className={`relative mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r ${urun.renk} px-7 font-semibold text-ink-950 shadow-lg transition-all hover:-translate-y-0.5`}>
              {urun.cta} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </section>
    </SayfaKabuk>
  );
}
