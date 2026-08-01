"use client";

import Link from "next/link";
import { Reveal } from "./Reveal";
import { Button } from "@/components/ui/Button";
import { UYGULAMALAR } from "@/lib/catalog";
import { katalogIkon } from "@/lib/ikonlar";

function DinamikIkon({ ad, className }: { ad: string; className?: string }) {
  const Ikon = katalogIkon(ad);
  return <Ikon className={className} />;
}

export function AppsPreview() {
  const secili = UYGULAMALAR.slice(0, 12);
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-28">
      <Reveal>
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-vayra-300">
            Uygulamalar
          </span>
          <h2 className="hf-baslik text-4xl md:text-5xl">
            80+ tek-tık aracı
          </h2>
          <p className="max-w-2xl text-lg text-white/60">
            Yüz değiştirmeden ürün reklamına, vesikalıktan viral şablonlara — hepsi hazır.
          </p>
        </div>
      </Reveal>

      <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {secili.map((u, i) => (
          <Reveal key={u.id} i={i % 4}>
            <Link
              href="/uygulamalar"
              className="group flex h-full flex-col rounded-2xl border border-white/10 bg-yuzey p-5 transition-all hover:-translate-y-1 hover:border-white/20 hover:bg-yuzey-3"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl glass-ikon glass-ikon-cyan text-vayra-300 transition-colors group-hover:bg-vayra-500/25">
                <DinamikIkon ad={u.ikon} className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold">{u.ad}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-white/50">{u.ozet}</p>
            </Link>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="mt-10 text-center">
          <Link href="/uygulamalar">
            <Button variant="outline" size="md">Tüm uygulamaları gör</Button>
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
