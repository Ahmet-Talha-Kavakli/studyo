"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Lightbulb, MessageCircleQuestion, Quote, X } from "lucide-react";

/**
 * Seçime sor (ChatGPT ve Claude gibi): asistan yanıtında metin seçilince seçimin üstünde yüzen mini menü.
 * Sor: menü küçük bir soru kutusuna dönüşür, alıntıyla birlikte gönderir. Açıkla: alıntıyı hemen açıklatır.
 * Alıntıla: besteciye alıntı ekler. Yalnız [data-alintilanabilir] içindeki seçimler sayılır.
 */
type Konum = { x: number; y: number; alt: boolean; metin: string };

export function SecimMenusu({ kapsam, sor, acikla, alintila, kilitli }: {
  kapsam: React.RefObject<HTMLElement | null>; sor: (alinti: string, soru: string) => void; acikla: (alinti: string) => void; alintila: (alinti: string) => void; kilitli?: boolean;
}) {
  const [k, setK] = useState<Konum | null>(null);
  const [soru, setSoru] = useState<string | null>(null);
  const [hazir, setHazir] = useState(false);
  const kutu = useRef<HTMLDivElement>(null);
  const soruRef = useRef<string | null>(null);
  soruRef.current = soru;
  useEffect(() => setHazir(true), []);

  useEffect(() => {
    const kok = kapsam.current;
    if (!kok) return;
    const oku = () => {
      if (soruRef.current !== null) return;
      const s = window.getSelection();
      const metin = s?.toString().replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim() ?? "";
      if (!s || s.isCollapsed || metin.length < 2 || !s.rangeCount) { setK(null); return; }
      const r = s.getRangeAt(0);
      const el = (r.commonAncestorContainer instanceof Element ? r.commonAncestorContainer : r.commonAncestorContainer.parentElement)?.closest("[data-alintilanabilir]");
      if (!el || !kok.contains(el)) { setK(null); return; }
      const d = r.getBoundingClientRect();
      const dokunmatik = matchMedia("(pointer: coarse)").matches;
      const alt = dokunmatik || d.top < 70;
      setK({ x: Math.min(innerWidth - 150, Math.max(150, d.left + d.width / 2)), y: alt ? d.bottom + 10 : d.top - 10, alt, metin: metin.slice(0, 2000) });
    };
    let zaman: ReturnType<typeof setTimeout>;
    const birak = () => { clearTimeout(zaman); zaman = setTimeout(oku, 10); };
    const degisti = () => {
      if (soruRef.current !== null) return;
      const s = window.getSelection();
      if (!s || s.isCollapsed) { setK(null); return; }
      if (matchMedia("(pointer: coarse)").matches) { clearTimeout(zaman); zaman = setTimeout(oku, 350); }
    };
    const kaydir = () => { if (soruRef.current === null) setK(null); };
    kok.addEventListener("mouseup", birak); kok.addEventListener("keyup", birak);
    document.addEventListener("selectionchange", degisti);
    kok.addEventListener("scroll", kaydir, { passive: true });
    return () => {
      clearTimeout(zaman);
      kok.removeEventListener("mouseup", birak); kok.removeEventListener("keyup", birak);
      document.removeEventListener("selectionchange", degisti); kok.removeEventListener("scroll", kaydir);
    };
  }, [kapsam]);

  useEffect(() => {
    if (soru === null) return;
    const f = (e: MouseEvent) => { if (!kutu.current?.contains(e.target as Node)) { setSoru(null); setK(null); } };
    const t = (e: KeyboardEvent) => { if (e.key === "Escape") { setSoru(null); setK(null); } };
    addEventListener("mousedown", f); addEventListener("keydown", t);
    return () => { removeEventListener("mousedown", f); removeEventListener("keydown", t); };
  }, [soru]);

  const bitir = () => { window.getSelection()?.removeAllRanges(); setK(null); setSoru(null); };
  if (!hazir) return null;
  const dugme = "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-white/85 transition-colors hover:bg-white/[0.1] hover:text-white disabled:opacity-40";
  return createPortal(
    <AnimatePresence>
      {k && (
        <motion.div ref={kutu} key="secim" initial={{ opacity: 0, y: k.alt ? -4 : 4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.13 }}
          onMouseDown={(e) => { if (soru === null) e.preventDefault(); }}
          style={{ left: k.x, top: k.y, translate: k.alt ? "-50% 0" : "-50% -100%" }}
          className="cam-istemci fixed z-[95] rounded-[20px] p-1">
          {soru === null ? (
            <div className="flex items-center gap-0.5">
              <button type="button" disabled={kilitli} onClick={() => setSoru("")} className={dugme}><MessageCircleQuestion className="h-3.5 w-3.5 text-[#8be6ff]" />Sor</button>
              <button type="button" disabled={kilitli} onClick={() => { acikla(k.metin); bitir(); }} className={dugme}><Lightbulb className="h-3.5 w-3.5 text-[#8be6ff]" />Açıkla</button>
              <button type="button" onClick={() => { alintila(k.metin); bitir(); }} className={dugme}><Quote className="h-3.5 w-3.5 text-[#8be6ff]" />Alıntıla</button>
            </div>
          ) : (
            <form className="w-[min(340px,calc(100vw-24px))]" onSubmit={(e) => { e.preventDefault(); if (soru.trim() && !kilitli) { sor(k.metin, soru.trim()); bitir(); } }}>
              <div className="flex items-start gap-2 px-2.5 pb-1 pt-2 text-[12px] leading-snug text-white/55"><Quote className="mt-0.5 h-3 w-3 shrink-0 text-[#8be6ff]" /><span className="line-clamp-2 min-w-0 flex-1">{k.metin}</span>
                <button type="button" onClick={() => setSoru(null)} aria-label="Geri" className="-mr-1 -mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-white/10"><X className="h-3 w-3" /></button>
              </div>
              <div className="flex items-center gap-1.5 p-1">
                <input autoFocus value={soru} onChange={(e) => setSoru(e.target.value)} placeholder="Bu kısım hakkında sor" className="h-9 min-w-0 flex-1 bg-transparent px-2 text-[14px] text-white outline-none placeholder:text-white/45" />
                <button type="submit" disabled={!soru.trim() || kilitli} aria-label="Gönder" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
              </div>
            </form>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
