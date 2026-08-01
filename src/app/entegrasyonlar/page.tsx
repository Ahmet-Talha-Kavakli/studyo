"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, ArrowRight, Check } from "lucide-react";
import { SayfaKabuk, SayfaHero } from "@/components/site/SayfaKabuk";
import { Reveal } from "@/components/site/Reveal";
import { ENTEGRASYONLAR, ENTEGRASYON_KATEGORILERI } from "@/lib/entegrasyonlar";
import { cn } from "@/lib/utils";

export default function EntegrasyonlarPage() {
  const [kategori, setKategori] = useState("Tümü");
  const [bagli, setBagli] = useState<string[]>([]);

  const liste = ENTEGRASYONLAR.filter((e) => kategori === "Tümü" || e.kategori === kategori);
  const bagla = (ad: string) => setBagli((v) => v.includes(ad) ? v.filter((x) => x !== ad) : [...v, ad]);

  return (
    <SayfaKabuk>
      <SayfaHero
        ustBaslik="Entegrasyonlar"
        baslik="Sevdiğin araçlarla birleş"
        aciklama="Photoshop'tan TikTok'a, Figma'dan Zapier'e — Vayra tüm iş akışına bağlanır. 16+ entegrasyon, sürekli artıyor."
      />

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {ENTEGRASYON_KATEGORILERI.map((k) => (
            <button key={k} onClick={() => setKategori(k)}
              className={cn("rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors",
                kategori === k ? "border-vayra-400/50 bg-vayra-500/15 text-white" : "border-white/10 text-white/60 hover:border-white/20")}>
              {k}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {liste.map((e, i) => {
            const isBagli = bagli.includes(e.ad);
            return (
              <Reveal key={e.ad} i={i % 3}>
                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-yuzey p-5 transition-colors hover:border-white/20">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${e.renk} text-sm font-bold text-white`}>
                    {e.harf}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{e.ad}</h3>
                      <span className="rounded-full bg-white/6 px-1.5 py-0.5 text-[10px] text-white/50">{e.kategori}</span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-white/55">{e.ozet}</p>
                  </div>
                  <button onClick={() => bagla(e.ad)}
                    className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                      isBagli ? "bg-emerald-400/15 text-emerald-400" : "bg-white/8 text-white/60 hover:bg-white/12 hover:text-white")}
                    title={isBagli ? "Bağlı" : "Bağla"}>
                    {isBagli ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </button>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Kendi entegrasyonun */}
        <Reveal>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-3xl border border-cyan-glow/25 bg-gradient-to-r from-cyan-glow/8 to-transparent p-8 sm:flex-row">
            <div>
              <h3 className="text-xl font-bold">Kendi entegrasyonunu kur</h3>
              <p className="mt-1 text-white/60">API, Webhook veya MCP ile Vayra'yı istediğin sisteme bağla.</p>
            </div>
            <Link href="/kayit" className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-cyan-glow px-6 font-semibold text-ink-950 transition-all hover:-translate-y-0.5 hover:brightness-110">
              API dokümanları <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </section>
    </SayfaKabuk>
  );
}
