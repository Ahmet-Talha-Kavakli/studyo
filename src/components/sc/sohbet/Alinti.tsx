"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Quote, X } from "lucide-react";

/**
 * Yanıttan metin seçilince seçimin üstünde "Alıntıla" düğmesi çıkar (Claude / ChatGPT gibi).
 * Tıklanınca seçili metin komut kutusunun üstüne alıntı olarak eklenir; sonraki soru o parçaya dair sorulur.
 * Yalnız `[data-alintilanabilir]` içindeki seçimler dikkate alınır (kullanıcı mesajları, düğmeler hariç).
 */
export function SecimAlinti({ kapsam, onAlinti }: { kapsam: React.RefObject<HTMLElement | null>; onAlinti: (metin: string) => void }) {
  const [konum, setKonum] = useState<{ x: number; y: number; metin: string } | null>(null);

  useEffect(() => {
    const kok = kapsam.current; if (!kok) return;
    const oku = () => {
      const s = window.getSelection();
      const metin = s?.toString().replace(/\s+\n/g, "\n").trim() ?? "";
      if (!s || s.isCollapsed || metin.length < 2 || !s.rangeCount) { setKonum(null); return; }
      const r = s.getRangeAt(0);
      const el = (r.commonAncestorContainer instanceof Element ? r.commonAncestorContainer : r.commonAncestorContainer.parentElement)?.closest("[data-alintilanabilir]");
      if (!el || !kok.contains(el)) { setKonum(null); return; }
      const d = r.getBoundingClientRect();
      setKonum({ x: Math.min(window.innerWidth - 70, Math.max(70, d.left + d.width / 2)), y: d.top, metin: metin.slice(0, 1500) });
    };
    const birak = () => setTimeout(oku, 0);
    const degisti = () => { if (window.getSelection()?.isCollapsed) setKonum(null); };
    const gizle = () => setKonum(null);
    kok.addEventListener("mouseup", birak); kok.addEventListener("keyup", birak); kok.addEventListener("touchend", birak);
    document.addEventListener("selectionchange", degisti); kok.addEventListener("scroll", gizle, { passive: true });
    return () => {
      kok.removeEventListener("mouseup", birak); kok.removeEventListener("keyup", birak); kok.removeEventListener("touchend", birak);
      document.removeEventListener("selectionchange", degisti); kok.removeEventListener("scroll", gizle);
    };
  }, [kapsam]);

  return (
    <AnimatePresence>
      {konum && (
        <motion.button key="alinti" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => { onAlinti(konum.metin); window.getSelection()?.removeAllRanges(); setKonum(null); }}
          style={{ left: konum.x, top: Math.max(8, konum.y - 44) }}
          className="fixed z-[90] flex h-9 -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#1c1c1f] px-3.5 text-[13px] font-medium text-[var(--sc-metin)] ring-1 ring-inset ring-white/[0.14] hover:bg-[#26303d]">
          <Quote className="h-3.5 w-3.5 text-[var(--sc-aksan)]" />Alıntıla
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/** Komut kutusunun üstünde bekleyen alıntı. */
export function AlintiKutusu({ metin, onKaldir }: { metin: string; onKaldir: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mx-1 mb-1 flex items-start gap-2.5 rounded-[14px] bg-white/[0.04] py-2 pl-3 pr-1.5 ring-1 ring-inset ring-white/[0.08]">
      <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--sc-aksan)]" />
      <p className="line-clamp-2 min-w-0 flex-1 text-[13px] leading-relaxed text-[var(--sc-metin-2)]">{metin}</p>
      <button onClick={onKaldir} aria-label="Alıntıyı kaldır" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--sc-metin-3)] hover:bg-white/[0.07] hover:text-[var(--sc-metin)]"><X className="h-3.5 w-3.5" /></button>
    </motion.div>
  );
}

/** Gönderilmiş kullanıcı mesajının üstündeki alıntı. */
export function MesajAlintisi({ metin }: { metin: string }) {
  return (
    <div className="mb-1.5 flex max-w-[560px] items-start gap-2 rounded-[14px] px-3 py-1.5 text-[13px] leading-relaxed text-[var(--sc-metin-3)]">
      <Quote className="mt-1 h-3 w-3 shrink-0" /><p className="line-clamp-3">{metin}</p>
    </div>
  );
}
