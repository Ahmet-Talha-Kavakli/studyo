"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Download, Link2, Loader2, MoreHorizontal, Pencil, Pin, PinOff, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Yuzen } from "@/components/ui/Yuzen";
import { useElements, type VElement } from "@/store/useElements";
import { ElementKapak, TUR_META, elementiCogalt, elementiIndir, elementiPaylas, elementiSil } from "../elementMeta";

/** "3 gün önce" gibi kısa göreli zaman. */
export function goreliZaman(t: number) {
  const dk = (Date.now() - t) / 60000;
  if (dk < 1) return "şimdi";
  if (dk < 60) return `${Math.floor(dk)} dk önce`;
  if (dk < 1440) return `${Math.floor(dk / 60)} sa önce`;
  const g = Math.floor(dk / 1440);
  if (g === 1) return "dün";
  if (g < 7) return `${g} gün önce`;
  if (g < 30) return `${Math.floor(g / 7)} hafta önce`;
  return new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

/** Kolaj kapak (Kling düzeni): ana görsel büyük, ek açılar sağda üst üste. Görsel yoksa tür işareti. */
export function Kolaj({ e }: { e: VElement }) {
  const g = e.gorseller.filter(Boolean);
  if (!g.length) return <ElementKapak e={e} className="h-full w-full" ikonBoyut={40} />;
  const [a, ...ek] = g;
  return (
    <div className={cn("grid h-full gap-[3px]", ek.length ? "grid-cols-[1.55fr_1fr]" : "grid-cols-1")}>
      <div className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      </div>
      {ek.length > 0 && (
        <div className="grid gap-[3px]" style={{ gridTemplateRows: `repeat(${Math.min(2, ek.length)}, 1fr)` }}>
          {ek.slice(0, 2).map((src, i) => (
            <div key={src + i} className="relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
              {i === 1 && ek.length > 2 && <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-[13px] font-semibold text-white">+{ek.length - 2}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ElementKart({ e, onDetay, onKullan, onDuzenle }: { e: VElement; onDetay: () => void; onKullan: () => void; onDuzenle: () => void }) {
  const [menu, setMenu] = useState(false);
  const guncelle = useElements((s) => s.guncelle);
  const m = TUR_META[e.tur];
  const n = e.gorseller.filter(Boolean).length;
  const alt = [m.ad, e.kullanim ? `${e.kullanim} üretim` : n ? `${n} görsel` : "görselsiz", goreliZaman(e.sonKullanim ?? e.guncelleme ?? e.olusturma)].join(" · ");
  return (
    <motion.article initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -3 }} transition={{ duration: 0.22, ease: "easeOut" }}
      className="group relative aspect-[4/3] overflow-hidden rounded-[18px] bg-yuzey-2 ring-1 ring-white/[0.07] transition-[box-shadow] duration-200 hover:ring-white/[0.16]">
      <button onClick={onDetay} aria-label={`@${e.ad} ayrıntı`} className="absolute inset-0 block text-left"><Kolaj e={e} /></button>

      <div className="pointer-events-none absolute left-2.5 top-2.5 flex gap-1.5">
        {e.sabitli && <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm" title="Sabitlendi"><Pin className="h-3 w-3 fill-current" /></span>}
        {e.lora?.durum === "hazir" && <span className="flex h-6 items-center gap-1 rounded-full bg-aksan/90 px-2 text-[11px] font-semibold text-[#06222b]"><Sparkles className="h-3 w-3" />Eğitildi</span>}
        {(e.lora?.durum === "egitiliyor" || e.lora?.durum === "sirada") && <span className="flex h-6 items-center gap-1 rounded-full bg-black/60 px-2 text-[11px] font-medium text-white backdrop-blur-sm"><Loader2 className="h-3 w-3 animate-spin" />Eğitiliyor</span>}
        {e.ornek && <span className="flex h-6 items-center rounded-full bg-black/55 px-2 text-[11px] font-medium text-white/90 backdrop-blur-sm">Örnek</span>}
      </div>

      <div className={cn("absolute right-2.5 top-2.5 transition-opacity", menu ? "opacity-100" : "opacity-0 focus-within:opacity-100 group-hover:opacity-100")}>
        <button onClick={() => setMenu((v) => !v)} aria-label={`@${e.ad} eylemleri`} aria-expanded={menu} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-black/75"><MoreHorizontal className="h-4 w-4" /></button>
        <AnimatePresence>
          <Yuzen acik={menu} onKapat={() => setMenu(false)} ust="tam" sag={0} bosluk={6} etiket="Element eylemleri" className="menu-surface w-[200px] rounded-[14px] p-1">
            {([
              [e.sabitli ? PinOff : Pin, e.sabitli ? "Sabitlemeyi kaldır" : "Sabitle", () => guncelle(e.id, { sabitli: !e.sabitli })],
              [Copy, "Çoğalt", () => elementiCogalt(e)],
              [Download, "Görselleri indir", () => elementiIndir(e)],
              [Link2, "Bağlantıyı kopyala", () => void elementiPaylas(e)],
            ] as const).map(([I, ad, fn]) => (
              <button key={ad} onClick={() => { setMenu(false); fn(); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] text-metin hover:bg-white/[0.06]"><I className="h-4 w-4 text-metin-2" />{ad}</button>
            ))}
            <div className="my-1 h-px bg-white/[0.08]" />
            <button onClick={() => { setMenu(false); elementiSil(e); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" />Sil</button>
          </Yuzen>
        </AnimatePresence>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-3.5 pt-14">
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15.5px] font-semibold text-white">@{e.ad}</p>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px] text-white/70"><span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: m.hex }} /><span className="truncate">{alt}</span></p>
          </div>
          <div className="pointer-events-auto flex translate-y-1 gap-1 opacity-0 transition-all duration-200 focus-within:translate-y-0 focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100">
            <button onClick={onKullan} className="flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-semibold text-[#111] transition-transform active:scale-95"><Sparkles className="h-3.5 w-3.5" />Kullan</button>
            <button onClick={onDuzenle} aria-label="Düzenle" title="Düzenle" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"><Pencil className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
