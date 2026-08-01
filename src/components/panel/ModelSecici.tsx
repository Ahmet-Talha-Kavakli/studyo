"use client";

import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";
import { MODELLER, type ModelTur, type AIModel } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function ModelSecici({
  tur,
  secili,
  onSec,
}: {
  tur: ModelTur;
  secili: string;
  onSec: (m: AIModel) => void;
}) {
  const liste = MODELLER.filter((m) => m.tur === tur);

  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {liste.map((m) => {
        const aktif = m.id === secili;
        return (
          <button
            key={m.id}
            onClick={() => onSec(m)}
            className={cn(
              "relative flex flex-col rounded-xl border p-3.5 text-left transition-all",
              aktif
                ? "border-vayra-400/60 bg-vayra-500/10"
                : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold">{m.ad}</span>
                  {m.rozet && (
                    <span className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                      m.rozet === "Vayra" ? "bg-cyan-glow/15 text-cyan-glow" :
                      m.rozet === "Yeni" ? "bg-emerald-400/15 text-emerald-400" :
                      m.rozet === "Hızlı" ? "bg-amber-glow/15 text-amber-glow" :
                      "bg-iris-500/15 text-iris-400",
                    )}>{m.rozet}</span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-white/45">{m.saglayici}</p>
              </div>
              {aktif && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-vayra-400">
                  <Check className="h-3 w-3 text-ink-950" strokeWidth={3} />
                </motion.span>
              )}
            </div>
            <p className="mt-2 line-clamp-2 text-xs text-white/55">{m.aciklama}</p>
            <div className="mt-2.5 flex items-center gap-1 text-xs font-medium text-amber-glow">
              <Zap className="h-3 w-3" /> {m.kredi} kredi
            </div>
          </button>
        );
      })}
    </div>
  );
}
