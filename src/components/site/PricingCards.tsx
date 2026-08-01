"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "./Reveal";
import { PLANLAR } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function PricingCards({ baslikGoster = true }: { baslikGoster?: boolean }) {
  const [yillik, setYillik] = useState(true);
  const [segment, setSegment] = useState<"bireysel" | "kurumsal">("bireysel");

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-20">
      {baslikGoster && (
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-vayra-300">
              Fiyatlandırma
            </span>
            <h2 className="hf-baslik mt-3 text-4xl md:text-5xl">
              Her ölçek için basit planlar
            </h2>
            <p className="mt-4 text-lg text-white/60">
              Kredi tabanlı. İstediğin modeli, istediğin kadar kullan.
            </p>
          </div>
        </Reveal>
      )}

      {/* Bireysel / Kurumsal segment */}
      <div className="mt-8 flex justify-center">
        <div className="inline-flex gap-1 rounded-2xl border border-white/10 bg-yuzey p-1">
          {([["bireysel", "Bireysel planlar"], ["kurumsal", "Kurumsal planlar"]] as const).map(([id, ad]) => (
            <button key={id} onClick={() => setSegment(id)}
              className={cn("relative rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                segment === id ? "text-ink-950" : "text-white/60 hover:text-white")}>
              {segment === id && <motion.span layoutId="pricingSegment" className="absolute inset-0 rounded-xl bg-white" />}
              <span className="relative">{ad}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Kurumsal bilgi bandı */}
      {segment === "kurumsal" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-between gap-4 rounded-2xl border border-vayra-400/25 bg-gradient-to-r from-vayra-500/10 to-transparent p-5">
          <div>
            <div className="font-semibold">Ekipler ve stüdyolar için</div>
            <p className="mt-0.5 text-sm text-white/55">Merkezi faturalandırma, ekip koltukları, SSO, öncelikli işleme ve özel model kotaları.</p>
          </div>
          <Link href="/iletisim" className="shrink-0 rounded-xl bg-vayra-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-vayra-400">Satış ekibiyle görüş</Link>
        </motion.div>
      )}

      {/* Yıllık/aylık geçiş */}
      <div className="mt-8 flex items-center justify-center gap-3">
        <span className={cn("text-sm", !yillik ? "text-white" : "text-white/50")}>Aylık</span>
        <button
          onClick={() => setYillik((v) => !v)}
          className="relative h-7 w-13 rounded-full bg-white/10 p-1 transition-colors"
          aria-label="Faturalama dönemi"
        >
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={cn(
              "block h-5 w-5 rounded-full bg-vayra-400 shadow",
              yillik && "translate-x-6",
            )}
          />
        </button>
        <span className={cn("text-sm", yillik ? "text-white" : "text-white/50")}>
          Yıllık <span className="text-rose-400">(%20 indirim)</span>
        </span>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-4">
        {PLANLAR.map((p, i) => (
          <Reveal key={p.id} i={i}>
            <div
              className={cn(
                "relative flex h-full flex-col rounded-3xl border p-7 transition-all",
                p.populer
                  ? "border-vayra-500/50 bg-gradient-to-b from-vayra-900/40 to-ink-850 shadow-2xl shadow-vayra-500/20"
                  : "border-white/10 bg-yuzey hover:border-white/20",
              )}
            >
              {p.populer && (
                <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-vayra-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                  <Sparkles className="h-3 w-3" /> En popüler
                </span>
              )}
              <h3 className="text-lg font-semibold">{p.ad}</h3>
              <p className="mt-1 text-sm text-white/50">{p.ozet}</p>
              <div className="mt-5 flex items-baseline gap-2">
                {p.fiyatUSD > 0 ? (
                  <>
                    {yillik && (
                      <span className="text-lg font-medium text-white/30 line-through">${p.fiyatUSD}</span>
                    )}
                    <span className="text-4xl font-bold">
                      ${yillik ? Math.round(p.fiyatUSD * 0.8) : p.fiyatUSD}
                    </span>
                    <span className="text-sm text-white/50">/ay</span>
                    {yillik && (
                      <span className="ml-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-400">%20 indirim</span>
                    )}
                  </>
                ) : (
                  <span className="text-3xl font-bold">Özel</span>
                )}
              </div>
              {p.fiyatTRY > 0 && (
                <p className="mt-1 text-xs text-white/40">
                  ≈ ₺{new Intl.NumberFormat("tr-TR").format(yillik ? Math.round(p.fiyatTRY * 0.8) : p.fiyatTRY)}/ay
                </p>
              )}
              <Link href={p.id === "kurumsal" ? "/iletisim" : "/kayit"} className="mt-6">
                <Button variant={p.populer ? "primary" : "outline"} size="md" className="w-full">
                  {p.cta}
                </Button>
              </Link>
              <ul className="mt-7 space-y-3">
                {p.ozellikler.map((o) => (
                  <li key={o} className="flex items-start gap-2.5 text-sm text-white/70">
                    <Check className={cn("mt-0.5 h-4 w-4 shrink-0", p.populer ? "text-vayra-300" : "text-emerald-400")} />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
