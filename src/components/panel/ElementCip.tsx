"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, MapPin, Package, Palette } from "lucide-react";
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
 * Higgsfield birebir element çipi: küçük avatar + @isim (yeşil) + × kaldır.
 * Üzerine gelince büyük referans önizleme kartı açılır (avatar + tür + açıklama).
 */
export function ElementCip({ ad, onKaldir }: { ad: string; onKaldir: () => void }) {
  const [hover, setHover] = useState(false);
  const element = useElements((s) => s.elementler.find((e) => e.ad === ad));
  if (!element) return null;
  const Ikon = turIkon[element.tur];
  const arka = onizlemeArka(element.tohum, "portre");

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Büyük referans önizleme — Higgsfield birebir: yukarıda açılan kart */}
      <AnimatePresence>
        {hover && (
          <motion.span
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.14 }}
            className="menu-surface pointer-events-none absolute bottom-full left-0 z-[70] mb-2 w-64 overflow-hidden rounded-2xl shadow-2xl shadow-black/60"
          >
            <span className="relative block aspect-[4/5] w-full" style={{ background: arka }}>
              <span className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/85 to-transparent p-3 pt-8">
                <Ikon className="h-3.5 w-3.5 text-white/80" />
                <span className="text-sm font-semibold text-white">@{element.ad}</span>
                <span className="ml-auto rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] text-white/80">
                  {turEtiket[element.tur]}
                </span>
              </span>
            </span>
            <span className="block px-3 py-2 text-xs text-white/55">{element.aciklama}</span>
          </motion.span>
        )}
      </AnimatePresence>

      {/* Çip — @isim AKSAN renginde. Eskiden `text-lime-300` (sarımsı yeşil)
          idi; marka rengi cyan'a geçtiğinde burada eski renk kalmıştı. */}
      <span className="group inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] py-0.5 pl-0.5 pr-2 transition-colors hover:border-aksan/40 hover:bg-white/[0.1]">
        <span
          className="h-5 w-5 shrink-0 overflow-hidden rounded-full ring-1 ring-white/15"
          style={{ background: arka }}
        />
        <span className="text-xs font-semibold text-aksan">@{element.ad}</span>
        <button
          onClick={onKaldir}
          aria-label={`@${element.ad} kaldır`}
          className="flex h-4 w-4 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/15 hover:text-white"
        >
          <X className="h-3 w-3" />
        </button>
      </span>
    </span>
  );
}
