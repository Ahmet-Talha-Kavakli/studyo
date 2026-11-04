"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useElements } from "@/store/useElements";
import { ElementKapak, TurRozeti } from "./element/elementMeta";

/**
 * İstemdeki element çipi: kapak + @ad + kaldır. Üzerine gelince büyük önizleme (portal ile —
 * taşması kırpılan composer'larda da tam görünür).
 */
export function ElementCip({ ad, onKaldir }: { ad: string; onKaldir: () => void }) {
  const [hover, setHover] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const element = useElements((s) => s.elementler.find((e) => e.ad.toLocaleLowerCase("tr") === ad.toLocaleLowerCase("tr")));
  if (!element) return null;
  const r = hover ? ref.current?.getBoundingClientRect() : undefined;

  return (
    <span ref={ref} className="relative inline-flex" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {hover && r && (
            <motion.span initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }} transition={{ duration: 0.14 }}
              className="menu-surface pointer-events-none fixed z-[300] w-60 overflow-hidden rounded-2xl"
              // Konum `bottom` ile verilir: framer `y` animasyonu transform'u ezdiği için translateY(-100%) kart aşağı düşüyordu.
              // Üstte yer yoksa (çip ekranın üstündeyse) alta açılır.
              style={r.top > 380
                ? { left: Math.max(8, Math.min(r.left, window.innerWidth - 252)), bottom: window.innerHeight - r.top + 8 }
                : { left: Math.max(8, Math.min(r.left, window.innerWidth - 252)), top: r.bottom + 8 }}>
              <ElementKapak e={element} className="aspect-[4/5] w-full" ikonBoyut={44} oynat />
              <span className="block p-3">
                <span className="flex items-center gap-1.5"><span className="truncate text-[13.5px] font-semibold text-metin">@{element.ad}</span><TurRozeti tur={element.tur} kucuk /></span>
                {element.aciklama && <span className="mt-1 line-clamp-3 text-[12px] leading-relaxed text-metin-2">{element.aciklama}</span>}
              </span>
            </motion.span>
          )}
        </AnimatePresence>,
        document.body,
      )}
      <span className="group inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] py-0.5 pl-0.5 pr-1.5 transition-colors hover:border-aksan/40 hover:bg-white/[0.1]">
        <ElementKapak e={element} className="h-5 w-5 shrink-0 rounded-full" ikonBoyut={10} />
        <span className="text-[12px] font-semibold text-aksan">@{element.ad}</span>
        <button onClick={onKaldir} aria-label={`@${element.ad} kaldır`} className="flex h-4 w-4 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/15 hover:text-white">
          <X className="h-3 w-3" />
        </button>
      </span>
    </span>
  );
}
