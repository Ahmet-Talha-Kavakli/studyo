"use client";

import { motion } from "framer-motion";
import { User, MapPin, Package, Palette, Plus } from "lucide-react";
import { useElements, type ElementTur } from "@/store/useElements";
import { onizlemeArka } from "@/lib/utils";

const turIkon: Record<ElementTur, typeof User> = {
  karakter: User,
  mekan: MapPin,
  obje: Package,
  stil: Palette,
};
const turEtiket: Record<ElementTur, string> = {
  karakter: "Karakter",
  mekan: "Mekan",
  obje: "Obje",
  stil: "Stil",
};

/**
 * @mention Element seçici — prompt çubuğunda "@" yazınca açılır. Kayıtlı
 * karakter/mekan/obje/stil varlıklarını jenerasyonlar arası tutarlı kullanmayı
 * sağlar. Higgsfield Elements desenini takip eder; içerik özgün.
 */
export function ElementSecici({
  filtre,
  onSec,
  onYeni,
  yukariAc = false,
}: {
  filtre: string;
  onSec: (ad: string) => void;
  onYeni: () => void;
  /** Girişin ÜSTÜNE aç. Sayfanın en altındaki composer'larda şart:
      aşağı açılınca menü ekranı taşıp kırpılıyordu (ölçüm: alt kenar
      1074px, ekran 900px → 174px kesik, son elementler görünmüyordu). */
  yukariAc?: boolean;
}) {
  const elementler = useElements((s) => s.elementler);
  const q = filtre.toLowerCase();
  const liste = elementler.filter((e) => e.ad.toLowerCase().includes(q) || e.aciklama.toLowerCase().includes(q)).slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: yukariAc ? -8 : 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: yukariAc ? -8 : 8, scale: 0.98 }}
      transition={{ duration: 0.14 }}
      className={
        "menu-surface absolute left-0 z-[60] w-80 rounded-2xl p-2 shadow-2xl shadow-black/50 " +
        (yukariAc ? "bottom-full mb-2" : "top-full mt-2")
      }
    >
      <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/35">Elementler · @{filtre}</p>
      <div className="max-h-64 space-y-0.5 overflow-y-auto">
        {liste.map((e) => {
          const Ikon = turIkon[e.tur];
          return (
            <button key={e.id} onMouseDown={(ev) => { ev.preventDefault(); onSec(e.ad); }}
              className="group flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors hover:bg-white/8">
              <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg" style={{ background: onizlemeArka(e.tohum, "portre") }} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-medium">@{e.ad}</span>
                  <span className="flex items-center gap-0.5 rounded-full bg-white/8 px-1.5 py-0.5 text-[9px] text-white/50">
                    <Ikon className="h-2.5 w-2.5" /> {turEtiket[e.tur]}
                  </span>
                </span>
                <span className="block truncate text-xs text-white/45">{e.aciklama}</span>
              </span>
            </button>
          );
        })}
        {liste.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-white/40">Eşleşen element yok.</p>
        )}
      </div>
      <button onMouseDown={(ev) => { ev.preventDefault(); onYeni(); }}
        className="mt-1 flex w-full items-center gap-2 rounded-xl border border-dashed border-white/15 p-2 text-sm text-white/60 transition-colors hover:border-cyan-glow/40 hover:text-white">
        <Plus className="h-4 w-4" /> Yeni element oluştur
      </button>
    </motion.div>
  );
}
