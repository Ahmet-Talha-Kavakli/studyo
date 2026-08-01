"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, X, Check, Pin } from "lucide-react";
import type { PresetGrubu, Preset } from "@/lib/presetler";
import { onizlemeArka } from "@/lib/utils";
import { kesfetArka } from "@/lib/gercekVeri";

/**
 * Preset galeri modalı — kategori filtresi + arama + kart ızgarası + pin.
 * Higgsfield'ın Style/Hook/Setting preset UX desenini takip eder; içerik özgün.
 */
export function PresetGaleri({
  grup,
  secili,
  onSec,
  onKapat,
}: {
  grup: PresetGrubu;
  secili?: string;
  onSec: (p: Preset) => void;
  onKapat: () => void;
}) {
  const [kategori, setKategori] = useState("Tümü");
  const [arama, setArama] = useState("");
  const [pinli, setPinli] = useState<string[]>([]);

  const liste = useMemo(() => {
    let l = grup.presetler;
    if (kategori !== "Tümü") l = l.filter((p) => p.kategori === kategori);
    if (arama.trim()) {
      const q = arama.toLowerCase();
      l = l.filter((p) => p.ad.toLowerCase().includes(q) || p.ozet.toLowerCase().includes(q));
    }
    // Pinliler önce
    return [...l].sort((a, b) => Number(pinli.includes(b.id)) - Number(pinli.includes(a.id)));
  }, [grup, kategori, arama, pinli]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-ink-950/85 backdrop-blur-md" onClick={onKapat} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="menu-surface relative flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h2 className="font-semibold">{grup.etiket} kütüphanesi</h2>
          <button onClick={onKapat} className="text-white/50 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        {/* Arama + kategoriler */}
        <div className="space-y-3 border-b border-white/10 p-4">
          <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-3">
            <Search className="h-4 w-4 text-white/40" />
            <input value={arama} onChange={(e) => setArama(e.target.value)} placeholder={`${grup.etiket} ara…`}
              className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-white/30" />
          </div>
          <div className="flex flex-wrap gap-2">
            {grup.kategoriler.map((k) => (
              <button key={k} onClick={() => setKategori(k)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${kategori === k ? "bg-cyan-glow text-ink-950" : "bg-white/6 text-white/60 hover:bg-white/12"}`}>
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Izgara */}
        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3">
          {liste.map((p) => (
            <button key={p.id} onClick={() => { onSec(p); onKapat(); }}
              className={`group relative overflow-hidden rounded-2xl border text-left transition-colors ${secili === p.id ? "border-cyan-glow" : "border-white/10 hover:border-white/25"}`}>
              <div className="aspect-video w-full" style={{ background: kesfetArka(p.tohum, "sinematik") }} />
              <div className="p-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-medium">{p.ad}</span>
                  {secili === p.id && <Check className="h-3.5 w-3.5 shrink-0 text-cyan-glow" />}
                </div>
                <p className="mt-0.5 truncate text-xs text-white/45">{p.ozet}</p>
              </div>
              {/* Pin mikro-aksiyon */}
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); setPinli((v) => v.includes(p.id) ? v.filter((x) => x !== p.id) : [...v, p.id]); }}
                className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-md transition-all ${pinli.includes(p.id) ? "bg-cyan-glow text-ink-950" : "bg-ink-950/50 text-white/70 opacity-0 group-hover:opacity-100"}`}
                aria-label="Sabitle"
              >
                <Pin className="h-3.5 w-3.5" />
              </span>
            </button>
          ))}
          {liste.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-white/40">Sonuç bulunamadı.</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
