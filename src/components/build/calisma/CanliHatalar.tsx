"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ChevronDown, Wrench, X } from "lucide-react";
import { api } from "@/lib/build/istemci";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";

type Kayit = { z: number; m?: string; y?: string; c?: string; k?: string };

/**
 * Yayındaki sitede ziyaretçilerin tarayıcısında oluşan hatalar (son yayından sonra). Komut kutusunun üstünde
 * küçük bir uyarı olarak çıkar; "Ajana düzelt" hataları tek istekte ajana gönderir. Gizlenen uyarı yeni hata gelene dek gizli kalır.
 */
export function CanliHatalar({ p, duzelt }: { p: Proje; duzelt: (metin: string) => void }) {
  const [l, setL] = useState<Kayit[]>([]);
  const [acik, setAcik] = useState(false);
  const [gizli, setGizli] = useState<number>(0);
  const anahtar = `vayra-build-canli-hata-${p.id}`;
  useEffect(() => { try { setGizli(Number(localStorage.getItem(anahtar)) || 0); } catch { /* yok */ } }, [anahtar]);
  const yayinZamani = p.yayin?.zaman ?? 0;
  useEffect(() => {
    if (!yayinZamani) { setL([]); return; }
    const getir = () => api<{ gunlukler: Kayit[] }>(`/api/build/bulut/${p.id}/gunluk?tur=hata&gun=3`).then((v) => setL(v.gunlukler.filter((x) => x.k === "istemci" && x.z > yayinZamani))).catch(() => {});
    getir();
    const t = setInterval(getir, 60_000);
    return () => clearInterval(t);
  }, [p.id, yayinZamani]);
  const yeni = l.filter((x) => x.z > gizli);
  const gruplar = Object.entries(yeni.reduce<Record<string, { adet: number; sayfa: Set<string>; mobil: number }>>((o, x) => {
    const m = x.m ?? "Bilinmeyen hata";
    const g = (o[m] ??= { adet: 0, sayfa: new Set(), mobil: 0 });
    g.adet++; if (x.y) g.sayfa.add(x.y); if (x.c === "mobil") g.mobil++;
    return o;
  }, {})).sort((a, b) => b[1].adet - a[1].adet);
  if (!gruplar.length) return null;
  const gizle = () => { const z = Math.max(...yeni.map((x) => x.z)); setGizli(z); try { localStorage.setItem(anahtar, String(z)); } catch { /* yok */ } };
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="mb-2 overflow-hidden rounded-[16px] bg-rose-500/[0.07] ring-1 ring-inset ring-rose-400/20">
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-rose-500/[0.15] text-rose-200"><AlertTriangle className="h-3.5 w-3.5" /></span>
          <button type="button" onClick={() => setAcik((x) => !x)} className="min-w-0 flex-1 text-left">
            <span className="block truncate text-[13px] font-medium text-rose-50">Canlı sitede {yeni.length} hata</span>
            <span className="block truncate text-[12px] text-rose-100/60">{gruplar.length} farklı hata, ziyaretçilerde</span>
          </button>
          <button type="button" onClick={() => setAcik((x) => !x)} aria-label="Ayrıntı" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-rose-100/60 hover:bg-white/[0.06]"><ChevronDown className={cn("h-3.5 w-3.5 transition-transform", acik && "rotate-180")} /></button>
          <button type="button" onClick={() => { duzelt(`Yayındaki sitede ziyaretçilerin tarayıcısında şu hatalar görüldü, kök nedenini bulup düzelt:\n${gruplar.slice(0, 8).map(([m, g]) => `- ${m} (${g.adet} kez; sayfa: ${[...g.sayfa].join(", ") || "bilinmiyor"}${g.mobil ? `; ${g.mobil} mobil` : ""})`).join("\n")}`); gizle(); }}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black"><Wrench className="h-3.5 w-3.5" />Düzelt</button>
          <button type="button" onClick={gizle} aria-label="Gizle" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-rose-100/50 hover:bg-white/[0.06] hover:text-white"><X className="h-3.5 w-3.5" /></button>
        </div>
        {acik && (
          <div className="space-y-1.5 border-t border-rose-300/10 px-3 py-2.5">
            {gruplar.slice(0, 6).map(([m, g]) => (
              <p key={m} className="text-[12px] leading-relaxed text-rose-50/80"><span className="font-medium">{g.adet} kez</span> · {m}<span className="text-rose-100/45"> · {[...g.sayfa].slice(0, 3).join(", ")}</span></p>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
