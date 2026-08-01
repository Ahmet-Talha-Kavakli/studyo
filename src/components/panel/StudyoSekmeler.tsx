"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Sparkles, History, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type StudyoSekmeAnahtar = "presetler" | "gecmis" | "nasil";

/**
 * Studio ortak 3-sekme deseni: Presetler / Geçmiş / Nasıl çalışır.
 * Higgsfield'ın her studio'da tekrarlanan Presets/History/How-it-works desenini
 * takip eder; içerik çağıran sayfadan gelir. Tutarlı derinlik katar.
 */
export function StudyoSekmeler({
  presetler,
  gecmis,
  nasil,
  vurgu = "cyan",
}: {
  presetler: ReactNode;
  gecmis: ReactNode;
  nasil: ReactNode;
  vurgu?: "cyan" | "amber" | "emerald" | "iris" | "vayra";
}) {
  const [aktif, setAktif] = useState<StudyoSekmeAnahtar>("presetler");

  const vurguSinif = {
    cyan: "text-cyan-glow",
    amber: "text-amber-glow",
    emerald: "text-emerald-400",
    iris: "text-iris-300",
    vayra: "text-vayra-400",
  }[vurgu];

  const sekmeler: { id: StudyoSekmeAnahtar; ad: string; ikon: typeof Sparkles }[] = [
    { id: "presetler", ad: "Hazır ayarlar", ikon: Sparkles },
    { id: "gecmis", ad: "Geçmiş", ikon: History },
    { id: "nasil", ad: "Nasıl çalışır?", ikon: HelpCircle },
  ];

  return (
    <div>
      <div className="mb-4 flex gap-1 border-b border-white/10">
        {sekmeler.map((s) => (
          <button
            key={s.id}
            onClick={() => setAktif(s.id)}
            className={cn(
              "relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors",
              aktif === s.id ? "text-white" : "text-white/50 hover:text-white/80"
            )}
          >
            <s.ikon className={cn("h-4 w-4", aktif === s.id && vurguSinif)} />
            {s.ad}
            {aktif === s.id && (
              <motion.span layoutId="studyoSekmeAlt" className={cn("absolute inset-x-0 -bottom-px h-0.5 rounded-full",
                vurgu === "cyan" ? "bg-cyan-glow" : vurgu === "amber" ? "bg-amber-glow" : vurgu === "emerald" ? "bg-emerald-400" : vurgu === "iris" ? "bg-iris-400" : "bg-vayra-400")} />
            )}
          </button>
        ))}
      </div>
      <motion.div key={aktif} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
        {aktif === "presetler" ? presetler : aktif === "gecmis" ? gecmis : nasil}
      </motion.div>
    </div>
  );
}

/** "Nasıl çalışır?" için tekrar kullanılabilir adım listesi. */
export function NasilCalisir({ adimlar }: { adimlar: { baslik: string; aciklama: string }[] }) {
  return (
    <ol className="space-y-3">
      {adimlar.map((a, i) => (
        <li key={i} className="flex gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full glass-ikon text-sm font-semibold text-white/70">
            {i + 1}
          </span>
          <div>
            <div className="text-sm font-semibold">{a.baslik}</div>
            <p className="mt-0.5 text-sm text-white/50">{a.aciklama}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
