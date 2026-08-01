"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { katalogIkon } from "@/lib/ikonlar";
import type { MegaMenu as MegaMenuTip } from "@/lib/megaMenu";

function DinamikIkon({ ad, className }: { ad: string; className?: string }) {
  const Ikon = katalogIkon(ad);
  return <Ikon className={className} />;
}

// Rozetler de cam dilinde — düz renkli zemin yerine kendi renginden tint + halka.
const rozetSinif: Record<string, string> = {
  Yeni: "glass-ikon glass-ikon-cyan",
  Pro: "glass-ikon glass-ikon-mor",
  Top: "glass-ikon glass-ikon-gul",
};

/** Higgsfield tarzı 2-sütun mega-menü: Özellikler + Modeller. */
export function MegaMenu({ menu, onGit }: { menu: MegaMenuTip; onGit: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.16 }}
      className="menu-surface absolute left-0 top-full z-50 mt-1 w-[620px] rounded-2xl p-3 shadow-2xl shadow-black/50"
    >
      <div className="grid grid-cols-2 gap-2">
        {/* Özellikler */}
        <div>
          <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/35">Özellikler</p>
          <div className="space-y-0.5">
            {menu.ozellikler.map((o) => (
              <Link key={o.ad + o.href} href={o.href} onClick={onGit}
                className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/8">
                {/* Özellikler = cyan (birincil eylem). Renkli cam kendi tint'ini taşıdığı
                    için ayrıca group-hover zemini gerekmiyor — üstüne binince camı bozuyordu. */}
                <span className="glass-ikon glass-ikon-cyan flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                  <DinamikIkon ad={o.ikon} className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">{o.ad}</span>
                    {o.rozet && <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${rozetSinif[o.rozet]}`}>{o.rozet}</span>}
                  </span>
                  <span className="block truncate text-xs text-white/45">{o.ozet}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
        {/* Modeller */}
        <div className="border-l border-white/8 pl-2">
          <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/35">Modeller</p>
          <div className="space-y-0.5">
            {menu.modeller.map((o) => (
              <Link key={o.ad + o.href} href={o.href} onClick={onGit}
                className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/8">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg glass-ikon text-white/70 transition-colors">
                  <DinamikIkon ad={o.ikon} className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">{o.ad}</span>
                    {o.rozet && <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${rozetSinif[o.rozet]}`}>{o.rozet}</span>}
                  </span>
                  <span className="block truncate text-xs text-white/45">{o.ozet}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
