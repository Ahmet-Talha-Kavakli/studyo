"use client";

import { Yuzen } from "@/components/ui/Yuzen";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sliders, Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AyarSecenek {
  ad: string;
  secenekler: string[];
}

/**
 * Higgsfield tarzı gelişmiş ayar popover'ı.
 * Prompt bar pill'inden açılır: Aspect / Kalite / Süre satırları,
 * her satır seçenekli alt-menü. Opak arka plan (okunabilir).
 */
export function AyarPopover({
  ayarlar,
  degerler,
  onDegis,
}: {
  ayarlar: AyarSecenek[];
  degerler: Record<string, string>;
  onDegis: (ad: string, deger: string) => void;
}) {
  const [acik, setAcik] = useState(false);
  const [altMenu, setAltMenu] = useState<string | null>(null);

  return (
    <div className="relative">
      <button
        onClick={() => setAcik((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
          acik ? "bg-cyan-glow/20 text-cyan-glow" : "bg-white/6 text-white/70 hover:bg-white/12 hover:text-white",
        )}
      >
        <Sliders className="h-3.5 w-3.5" /> Ayarlar
      </button>

      <AnimatePresence>
        <Yuzen acik={!!(acik)} onKapat={() => { setAcik(false); setAltMenu(null); }} alt={"tam"} sol={0} bosluk={8}><motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              className="menu-surface w-60 rounded-2xl p-1.5"
            >
              {ayarlar.map((a) => (
                <div key={a.ad} className="relative">
                  <button
                    onClick={() => setAltMenu((v) => (v === a.ad ? null : a.ad))}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-white/8"
                  >
                    <span className="text-white/70">{a.ad}</span>
                    <span className="flex items-center gap-1 font-medium text-white">
                      {degerler[a.ad] ?? a.secenekler[0]}
                      <ChevronRight className={cn("h-3.5 w-3.5 text-white/40 transition-transform", altMenu === a.ad && "rotate-90")} />
                    </span>
                  </button>
                  <AnimatePresence>
                    {altMenu === a.ad && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-1 px-1.5 py-1">
                          {a.secenekler.map((s) => {
                            const secili = (degerler[a.ad] ?? a.secenekler[0]) === s;
                            return (
                              <button
                                key={s}
                                onClick={() => { onDegis(a.ad, s); setAltMenu(null); }}
                                className={cn(
                                  "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                                  secili ? "bg-cyan-glow/20 text-cyan-glow" : "bg-white/5 text-white/70 hover:bg-white/10",
                                )}
                              >
                                {s}
                                {secili && <Check className="h-3 w-3" />}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </motion.div></Yuzen>
      </AnimatePresence>
    </div>
  );
}
