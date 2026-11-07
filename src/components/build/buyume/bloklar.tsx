"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Heading1, Image as ImageIcon, Minus, MousePointerClick, Pilcrow, Plus, X } from "lucide-react";
import { BLOKLAR, kimlikUret, type Blok, type BlokTur } from "@/lib/build/buyumeEkTipler";
import { cn } from "@/lib/utils";
import { alan, ikincil, simgeDugme } from "./ortak";

export const BLOK_SIMGE: Record<BlokTur, typeof Pilcrow> = { baslik: Heading1, metin: Pilcrow, dugme: MousePointerClick, gorsel: ImageIcon, ayirici: Minus };

/** E-posta blok düzenleyicisi (kampanya ve otomasyon e-postaları ortak). */
export function BlokListesi({ bloklar, set, duzenlenebilir = true, site, gorselSec }: { bloklar: Blok[]; set: (l: Blok[]) => void; duzenlenebilir?: boolean; site: string; gorselSec?: (id: string) => void }) {
  const degis = (id: string, y: Partial<Blok>) => set(bloklar.map((x) => (x.id === id ? { ...x, ...y } : x)));
  const tasi = (i: number, n: number) => { const l = [...bloklar]; const [x] = l.splice(i, 1); l.splice(i + n, 0, x); set(l); };
  return (
    <div>
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {bloklar.map((x, i) => {
            const I = BLOK_SIMGE[x.tur];
            return (
              <motion.li key={x.id} layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="rounded-[14px] bg-white/[0.03] p-2.5 ring-1 ring-inset ring-white/[0.07]">
                <div className="mb-2 flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-white/[0.07]"><I className="h-3.5 w-3.5 text-white/75" /></span><span className="flex-1 text-[12px] text-white/55">{BLOKLAR.find((y) => y.id === x.tur)?.ad}</span>
                  {duzenlenebilir && <><button type="button" disabled={i === 0} onClick={() => tasi(i, -1)} className={cn(simgeDugme, "h-7 w-7")} aria-label="Yukarı"><ArrowUp className="h-3.5 w-3.5" /></button><button type="button" disabled={i === bloklar.length - 1} onClick={() => tasi(i, 1)} className={cn(simgeDugme, "h-7 w-7")} aria-label="Aşağı"><ArrowDown className="h-3.5 w-3.5" /></button><button type="button" onClick={() => set(bloklar.filter((y) => y.id !== x.id))} className={cn(simgeDugme, "h-7 w-7 hover:text-rose-200")} aria-label="Bloğu sil"><X className="h-3.5 w-3.5" /></button></>}
                </div>
                {x.tur === "baslik" && <input disabled={!duzenlenebilir} value={x.metin ?? ""} onChange={(y) => degis(x.id, { metin: y.target.value })} placeholder="Başlık" className={cn(alan, "h-10 text-[15px] font-semibold")} />}
                {x.tur === "metin" && <textarea disabled={!duzenlenebilir} value={x.metin ?? ""} onChange={(y) => degis(x.id, { metin: y.target.value })} rows={Math.min(10, Math.max(3, (x.metin ?? "").split("\n").length + 1))} className={cn(alan, "resize-y py-2.5 leading-relaxed")} />}
                {x.tur === "dugme" && <div className="grid gap-2 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"><input disabled={!duzenlenebilir} value={x.metin ?? ""} onChange={(y) => degis(x.id, { metin: y.target.value })} placeholder="Düğme yazısı" className={cn(alan, "h-9")} /><input disabled={!duzenlenebilir} value={x.adres ?? ""} onChange={(y) => degis(x.id, { adres: y.target.value })} placeholder="https://" className={cn(alan, "h-9")} /></div>}
                {x.tur === "gorsel" && (
                  <div className="flex items-center gap-2.5">
                    <span className="h-14 w-20 shrink-0 overflow-hidden rounded-[9px] bg-white/[0.05] ring-1 ring-inset ring-white/[0.08]">{x.gorsel && /* eslint-disable-next-line @next/next/no-img-element */ <img src={x.gorsel} alt="" className="h-full w-full object-cover" />}</span>
                    <div className="min-w-0 flex-1 space-y-1.5"><input disabled={!duzenlenebilir} value={x.metin ?? ""} onChange={(y) => degis(x.id, { metin: y.target.value })} placeholder="Görsel açıklaması" className={cn(alan, "h-8 text-[12.5px]")} /><input disabled={!duzenlenebilir} value={x.gorsel ?? ""} onChange={(y) => degis(x.id, { gorsel: y.target.value || undefined })} placeholder="Görsel adresi (https)" className={cn(alan, "h-8 text-[12.5px]")} /></div>
                    {duzenlenebilir && gorselSec && <button type="button" onClick={() => gorselSec(x.id)} className={cn(ikincil, "h-8 px-3 text-[12px]")}>Seç</button>}
                  </div>
                )}
                {x.tur === "ayirici" && <div className="h-px bg-white/10" />}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      {duzenlenebilir && <div className="mt-2.5 flex flex-wrap gap-1">{BLOKLAR.map((x) => { const I = BLOK_SIMGE[x.id]; return <button key={x.id} type="button" title={x.alt} onClick={() => set([...bloklar, { id: kimlikUret(), tur: x.id, metin: x.id === "dugme" ? "Siteye git" : "", adres: x.id === "dugme" ? site : undefined }])} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.04] px-3 text-[12.5px] text-white/70 ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.08] hover:text-white"><Plus className="h-3 w-3" /><I className="h-3.5 w-3.5" />{x.ad}</button>; })}</div>}
    </div>
  );
}

/** Küçük sayı kutucukları satırı (istatistik). */
export function SayiSatiri({ l, sutun = 4, className }: { l: [string, React.ReactNode][]; sutun?: 2 | 3 | 4 | 5; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-px overflow-hidden rounded-[14px] bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]", sutun === 3 ? "sm:grid-cols-3" : sutun === 5 ? "sm:grid-cols-5" : sutun === 4 ? "sm:grid-cols-4" : "", className)}>
      {l.map(([a, v]) => <div key={a} className="min-w-0 bg-[#141518] px-3 py-2.5"><dt className="truncate text-[11px] text-white/45">{a}</dt><dd className="mt-0.5 truncate text-[14.5px] font-semibold tabular-nums text-white">{v}</dd></div>)}
    </dl>
  );
}
export const oranYaz = (a: number, b: number) => (b ? `yüzde ${Math.round((a / b) * 100)}` : "yok");
