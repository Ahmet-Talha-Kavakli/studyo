"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";
import { katalogIkon } from "@/lib/ikonlar";
import { SayfaKabuk, SayfaHero } from "@/components/site/SayfaKabuk";
import { Reveal } from "@/components/site/Reveal";
import { UYGULAMALAR, UYGULAMA_KATEGORILERI } from "@/lib/catalog";
import { cn } from "@/lib/utils";

function DinamikIkon({ ad, className }: { ad: string; className?: string }) {
  const Ikon = katalogIkon(ad);
  return <Ikon className={className} />;
}

export default function UygulamalarPublicPage() {
  const [kategori, setKategori] = useState("Tümü");
  const liste = UYGULAMALAR.filter((u) => kategori === "Tümü" || u.kategori === kategori);

  return (
    <SayfaKabuk>
      <SayfaHero
        ustBaslik="Uygulamalar"
        baslik={`${UYGULAMALAR.length}+ tek-tık yaratıcı araç`}
        aciklama="Yüz değiştirmeden ürün reklamına, vesikalıktan viral şablonlara — hepsi hazır ve çalışır."
      />

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {UYGULAMA_KATEGORILERI.map((k) => (
            <button key={k} onClick={() => setKategori(k)}
              className={cn("rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors",
                kategori === k ? "border-vayra-400/50 bg-vayra-500/15 text-white" : "border-white/10 text-white/60 hover:border-white/20")}>
              {k}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {liste.map((u, i) => (
            <Reveal key={u.id} i={i % 4}>
              <Link href="/kayit"
                className="group flex h-full flex-col rounded-2xl border border-white/10 bg-yuzey p-5 transition-all hover:-translate-y-1 hover:border-white/20 hover:bg-yuzey-3">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl glass-ikon glass-ikon-cyan text-vayra-300 transition-colors group-hover:bg-vayra-500/25">
                  <DinamikIkon ad={u.ikon} className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold">{u.ad}</h3>
                <p className="mt-1 line-clamp-2 flex-1 text-xs text-white/50">{u.ozet}</p>
                <span className="mt-3 flex items-center gap-1 text-xs font-medium text-amber-glow"><Zap className="h-3 w-3" /> {u.kredi} kredi</span>
              </Link>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/kayit" className="inline-flex h-12 items-center gap-2 rounded-xl bg-vayra-500 px-7 font-medium text-ink-950 transition-all hover:-translate-y-0.5 hover:bg-vayra-400">
            Ücretsiz denemeye başla <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </SayfaKabuk>
  );
}
