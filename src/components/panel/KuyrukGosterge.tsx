"use client";

import { Yuzen } from "@/components/ui/Yuzen";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Loader2, CheckCircle2, Clock } from "lucide-react";
import { useProjeler } from "@/store/useProjeler";
import { cn } from "@/lib/utils";

/**
 * Batch üretim kuyruğu göstergesi — nav'da aktif üretimlerin canlı ilerleme özeti.
 * Kuyrukta/işlenen üretim varken belirir; tıklayınca detay dökümü açılır.
 */
export function KuyrukGosterge() {
  const uretimler = useProjeler((s) => s.uretimler);
  const [acik, setAcik] = useState(false);

  const aktifler = uretimler.filter((u) => u.durum === "kuyrukta" || u.durum === "isleniyor");
  if (aktifler.length === 0) return null;

  const ortalama = Math.round(aktifler.reduce((a, u) => a + u.ilerleme, 0) / aktifler.length);

  return (
    <div className="relative">
      <button
        onClick={() => setAcik((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-cyan-glow/25 bg-cyan-glow/8 px-2.5 py-1.5 text-xs transition-colors hover:bg-cyan-glow/14"
        title="Aktif üretim kuyruğu"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-glow" />
        <span className="font-medium text-cyan-glow">{aktifler.length} üretiliyor</span>
        <span className="text-white/40">%{ortalama}</span>
      </button>

      <AnimatePresence>
        <Yuzen acik={!!(acik)} onKapat={() => setAcik(false)} sag={0} ust={"tam"} bosluk={8}><motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="menu-surface w-72 rounded-2xl p-3"
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/35">Üretim kuyruğu</p>
                <span className="text-[11px] text-white/40">{aktifler.length} aktif</span>
              </div>
              <div className="max-h-64 space-y-1.5 overflow-y-auto">
                {aktifler.map((u) => (
                  <div key={u.id} className="rounded-xl bg-white/[0.03] p-2.5">
                    <div className="flex items-center gap-2">
                      {u.durum === "kuyrukta"
                        ? <Clock className="h-3.5 w-3.5 shrink-0 text-white/40" />
                        : <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-cyan-glow" />}
                      <span className="min-w-0 flex-1 truncate text-sm">{u.baslik}</span>
                      <span className="text-xs text-white/45">%{u.ilerleme}</span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                      <motion.div className={cn("h-full rounded-full", u.durum === "kuyrukta" ? "bg-white/30" : "bg-cyan-glow")}
                        animate={{ width: `${u.ilerleme}%` }} transition={{ ease: "easeOut" }} />
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/panel/kitaplik" onClick={() => setAcik(false)}
                className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 py-2 text-xs text-white/60 transition-colors hover:bg-white/6 hover:text-white">
                <CheckCircle2 className="h-3.5 w-3.5" /> Tüm üretimleri gör
              </Link>
            </motion.div></Yuzen>
      </AnimatePresence>
    </div>
  );
}
