"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type PaletKomutu = { id: string; grup: string; ad: string; alt?: string; ikon: React.ComponentType<{ className?: string }>; kisayol?: string; anahtar?: string; calistir: () => void };

const kucuk = (s: string) => s.toLocaleLowerCase("tr-TR");

/**
 * Çalışma alanı komut paleti (Ctrl K): sekmeler, eylemler, dosyalar, sürümler ve hazır istekler tek arama kutusunda.
 * Ok tuşlarıyla gezilir, Enter çalıştırır, Esc kapatır. Ekranın üst ortasında açılır; arkasında karartma yok.
 */
export function KomutPaleti({ acik, kapat, komutlar }: { acik: boolean; kapat: () => void; komutlar: PaletKomutu[] }) {
  const [ara, setAra] = useState("");
  const [i, setI] = useState(0);
  const kutu = useRef<HTMLInputElement>(null);
  const liste = useRef<HTMLDivElement>(null);
  useEffect(() => { if (acik) { setAra(""); setI(0); setTimeout(() => kutu.current?.focus(), 30); } }, [acik]);
  const l = useMemo(() => {
    const q = kucuk(ara.trim());
    const s = q ? komutlar.filter((k) => kucuk(`${k.ad} ${k.alt ?? ""} ${k.grup} ${k.anahtar ?? ""}`).includes(q)) : komutlar.filter((k) => k.grup !== "Dosyalar" && k.grup !== "Sürümler");
    return s.slice(0, 60);
  }, [ara, komutlar]);
  useEffect(() => setI(0), [ara]);
  useEffect(() => { liste.current?.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ block: "nearest" }); }, [i]);
  const calistir = (k?: PaletKomutu) => { if (!k) return; kapat(); setTimeout(k.calistir, 10); };
  let son = "";
  return (
    <AnimatePresence>
      {acik && (
        <>
          <div className="fixed inset-0 z-[90]" onMouseDown={kapat} />
          <motion.div role="dialog" aria-label="Komut paleti" initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ type: "spring", stiffness: 460, damping: 36 }}
            className="fixed left-1/2 top-[64px] z-[91] flex max-h-[min(560px,calc(100vh-96px))] w-[min(600px,calc(100vw-24px))] -translate-x-1/2 flex-col overflow-hidden rounded-[20px] bg-[#17181b] ring-1 ring-inset ring-white/[0.12]">
            <div className="flex items-center gap-2.5 border-b border-white/[0.07] px-4">
              <Search className="h-4 w-4 shrink-0 text-white/45" />
              <input ref={kutu} value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Komut, dosya, sürüm ya da istek ara"
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setI((x) => Math.min(l.length - 1, x + 1)); }
                  else if (e.key === "ArrowUp") { e.preventDefault(); setI((x) => Math.max(0, x - 1)); }
                  else if (e.key === "Enter") { e.preventDefault(); calistir(l[i]); }
                  else if (e.key === "Escape") { e.preventDefault(); kapat(); }
                }}
                className="h-12 min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/40" />
              <kbd className="rounded-[6px] bg-white/[0.07] px-1.5 py-0.5 text-[10.5px] text-white/50">Esc</kbd>
            </div>
            <div ref={liste} className="min-h-0 flex-1 overflow-y-auto p-1.5 [scrollbar-width:thin]">
              {!l.length && <p className="px-3 py-8 text-center text-[13px] text-white/45">Sonuç yok. Başka bir kelime dene.</p>}
              {l.map((k, n) => {
                const baslik = k.grup !== son ? k.grup : null; son = k.grup;
                return (
                  <div key={k.id}>
                    {baslik && <p className="px-3 pb-1 pt-2.5 text-[11.5px] text-white/40">{baslik}</p>}
                    <button type="button" data-i={n} onMouseMove={() => setI(n)} onClick={() => calistir(k)} className={cn("flex w-full items-center gap-3 rounded-[11px] px-3 py-2 text-left", n === i ? "bg-white/[0.08]" : "")}>
                      <k.ikon className="h-4 w-4 shrink-0 text-white/55" />
                      <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{k.ad}</span>{k.alt && <span className="block truncate text-[11.5px] text-white/45">{k.alt}</span>}</span>
                      {k.kisayol && <kbd className="shrink-0 rounded-[6px] bg-white/[0.07] px-1.5 py-0.5 text-[10.5px] text-white/50">{k.kisayol}</kbd>}
                      {n === i && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-white/40" />}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/[0.07] px-4 py-2 text-[11.5px] text-white/40">
              <span><kbd className="text-white/60">Ctrl K</kbd> palet</span><span><kbd className="text-white/60">Ctrl B</kbd> sohbeti gizle</span><span><kbd className="text-white/60">Ctrl Z</kbd> görsel düzenlemeyi geri al</span><span className="max-sm:hidden"><kbd className="text-white/60">Yukarı ok</kbd> üst öğe</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
