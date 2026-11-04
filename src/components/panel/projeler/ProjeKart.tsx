"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Globe, Image as ImageIcon, Link2, Loader2, Mic, MoreHorizontal, Pencil, Pin, PinOff, Plus, Trash2, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Yuzen } from "@/components/ui/Yuzen";
import { gorece, type ProjeOzet } from "./projeVeri";

export type ProjeIslem = { onSabitle: () => void; onAdDuzenle: () => void; onLink: () => void; onSil: () => void };

/** Kolaj kapak: en yeni üretim büyük, sonraki iki kare sağda; fazlası "+N". */
export function Mozaik({ o, className, fazla = true }: { o: ProjeOzet; className?: string; fazla?: boolean }) {
  const k = o.kareler;
  if (!k.length) return <BosKapak renk={o.p.renk} className={className} />;
  const [a, ...ek] = k;
  return (
    <div className={cn("grid gap-[3px]", ek.length ? "grid-cols-[1.6fr_1fr]" : "grid-cols-1", className)}>
      <div className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a} alt="" loading="lazy" draggable={false} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
      </div>
      {ek.length > 0 && (
        <div className="grid gap-[3px]" style={{ gridTemplateRows: `repeat(${Math.min(2, ek.length)}, 1fr)` }}>
          {ek.slice(0, 2).map((s, i) => (
            <div key={s + i} className="relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s} alt="" loading="lazy" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
              {fazla && i === 1 && ek.length > 2 && <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-[13px] font-semibold text-white">+{ek.length - 2}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* Üretimi olmayan proje: stok foto yerine proje renginde sakin zemin + ne yapılacağı. */
function BosKapak({ renk = "#55d6fd", className }: { renk?: string; className?: string }) {
  return (
    <div className={cn("relative flex flex-col items-center justify-center gap-2.5 overflow-hidden bg-[#15171a]", className)}
      style={{ backgroundImage: `radial-gradient(70% 70% at 30% 15%, color-mix(in srgb, ${renk} 22%, transparent), transparent 70%), radial-gradient(60% 60% at 85% 90%, color-mix(in srgb, ${renk} 10%, transparent), transparent 70%)` }}>
      <span className="flex -space-x-2">
        {[ImageIcon, Video, Mic].map((I, i) => (
          <span key={i} className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/[0.07] text-white/75 ring-1 ring-white/[0.1] backdrop-blur-sm transition-transform duration-300 group-hover:-translate-y-0.5" style={{ transitionDelay: `${i * 40}ms`, rotate: `${(i - 1) * 6}deg` }}><I className="h-4 w-4" /></span>
        ))}
      </span>
      <span className="text-[12.5px] text-white/70">İlk üretimi yap</span>
    </div>
  );
}

function Sayilar({ o }: { o: ProjeOzet }) {
  const s = [[ImageIcon, o.gorsel, "görsel"], [Video, o.video, "video"], [Mic, o.ses, "ses"]] as const;
  if (!o.toplam) return <span>Boş</span>;
  return (
    <span className="flex items-center gap-2 tabular-nums">
      {s.filter(([, n]) => n > 0).map(([I, n, ad]) => <span key={ad} className="flex items-center gap-1" title={`${n} ${ad}`}><I className="h-3.5 w-3.5 opacity-80" />{n}</span>)}
    </span>
  );
}

export function Ilerleme({ o, acik }: { o: ProjeOzet; acik?: boolean }) {
  const [a, b] = o.sahne;
  if (!o.toplam || b < 2) return null;
  return (
    <span className="flex items-center gap-2">
      <span className={cn("h-1 w-16 overflow-hidden rounded-full", acik ? "bg-white/10" : "bg-white/20")}><motion.span initial={{ width: 0 }} animate={{ width: `${(a / b) * 100}%` }} transition={{ duration: 0.6, ease: "easeOut" }} className="block h-full rounded-full bg-aksan" /></span>
      <span className={cn("text-[11.5px] tabular-nums", acik ? "text-metin-2" : "text-white/70")}>{a}/{b} sahne</span>
    </span>
  );
}

export function DurumRozet({ o }: { o: ProjeOzet }) {
  if (o.durum === "uretiliyor") return <span className="flex h-6 items-center gap-1 rounded-full bg-black/60 px-2 text-[11px] font-medium text-white backdrop-blur-sm"><Loader2 className="h-3 w-3 animate-spin text-aksan" />Üretiliyor</span>;
  if (o.durum === "yayinda") return <span className="flex h-6 items-center gap-1 rounded-full bg-emerald-400/90 px-2 text-[11px] font-semibold text-[#052e1c]"><Globe className="h-3 w-3" />Yayında</span>;
  return null;
}

export function ProjeMenu({ o, islem, className, acikHep }: { o: ProjeOzet; islem: ProjeIslem; className?: string; acikHep?: boolean }) {
  const [menu, setMenu] = useState(false);
  const satir = [
    [o.p.sabit ? PinOff : Pin, o.p.sabit ? "Sabitlemeyi kaldır" : "Sabitle", islem.onSabitle],
    [Pencil, "Yeniden adlandır", islem.onAdDuzenle],
    [Link2, "Bağlantıyı kopyala", islem.onLink],
  ] as const;
  return (
    <div className={cn("transition-opacity", menu || acikHep ? "opacity-100" : "opacity-0 focus-within:opacity-100 group-hover:opacity-100", className)}>
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenu((v) => !v); }} aria-label={`${o.p.ad} eylemleri`} aria-expanded={menu}
        className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-colors", acikHep ? "text-metin-2 hover:bg-white/[0.07] hover:text-white" : "bg-black/55 text-white backdrop-blur-sm hover:bg-black/75")}>
        <MoreHorizontal className="h-4 w-4" />
      </button>
      <AnimatePresence>
        <Yuzen acik={menu} onKapat={() => setMenu(false)} ust="tam" sag={0} bosluk={6} etiket="Proje eylemleri" className="menu-surface w-[200px] rounded-[14px] p-1">
          {satir.map(([I, ad, fn]) => (
            <button key={ad} onClick={() => { setMenu(false); fn(); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] text-metin hover:bg-white/[0.06]"><I className="h-4 w-4 text-metin-2" />{ad}</button>
          ))}
          <div className="my-1 h-px bg-white/[0.08]" />
          <button onClick={() => { setMenu(false); islem.onSil(); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" />Sil</button>
        </Yuzen>
      </AnimatePresence>
    </div>
  );
}

export function ProjeKart({ o, islem }: { o: ProjeOzet; islem: ProjeIslem }) {
  const { p } = o;
  const zaman = gorece(o.zaman);
  return (
    <motion.article initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -3 }} transition={{ duration: 0.22, ease: "easeOut" }}
      className="group relative aspect-[16/11] overflow-hidden rounded-[18px] bg-yuzey-2 ring-1 ring-white/[0.07] transition-[box-shadow] duration-200 hover:ring-white/[0.16]">
      <Link href={`/panel/projeler/${p.id}`} aria-label={`${p.ad} projesini aç`} className="absolute inset-0 block"><Mozaik o={o} className="h-full" fazla={false} /></Link>

      <div className="pointer-events-none absolute left-2.5 top-2.5 flex gap-1.5">
        {p.sabit && <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm" title="Sabitlendi"><Pin className="h-3 w-3 fill-current" /></span>}
        <DurumRozet o={o} />
        
      </div>
      <ProjeMenu o={o} islem={islem} className="absolute right-2.5 top-2.5" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent p-3.5 pt-16">
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 truncate text-[15.5px] font-semibold text-white"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.renk ?? "#55d6fd" }} /><span className="truncate">{p.ad}</span></p>
            <p className="mt-1 flex min-w-0 items-center gap-2 text-[11.5px] text-white/70">
              <span className="truncate">{p.tur}</span><span className="text-white/30">·</span><Sayilar o={o} />
              {zaman && <><span className="text-white/30">·</span><span className="shrink-0">{zaman}</span></>}
            </p>
            <div className="mt-2 empty:hidden"><Ilerleme o={o} /></div>
          </div>
          <span className="flex h-8 shrink-0 translate-y-1 items-center gap-1 rounded-full bg-white px-3 text-[12.5px] font-semibold text-[#111] opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">Aç<ArrowRight className="h-3.5 w-3.5" /></span>
        </div>
      </div>
    </motion.article>
  );
}

export function ProjeSatir({ o, islem }: { o: ProjeOzet; islem: ProjeIslem }) {
  const { p } = o;
  const zaman = gorece(o.zaman);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group relative flex items-center gap-3.5 rounded-[14px] px-2.5 py-2 transition-colors hover:bg-white/[0.04]">
      <Link href={`/panel/projeler/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3.5">
        <span className="relative h-12 w-[72px] shrink-0 overflow-hidden rounded-[10px] ring-1 ring-white/[0.08]"><Mozaik o={{ ...o, kareler: o.kareler.slice(0, 1) }} className="h-full [&_span]:hidden" /></span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 truncate text-[14px] font-semibold text-white">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.renk ?? "#55d6fd" }} />
            <span className="truncate">{p.ad}</span>
            {p.sabit && <Pin className="h-3 w-3 shrink-0 fill-current text-metin-2" />}
          </span>
          <span className="mt-0.5 flex items-center gap-2 text-[12.5px] text-metin-2"><span className="truncate">{p.tur}</span><span className="text-white/20">·</span><Sayilar o={o} /></span>
        </span>
        <span className="hidden w-40 sm:block"><Ilerleme o={o} acik /></span>
        <span className="hidden w-24 md:block">{o.durum === "yayinda" ? <span className="flex items-center gap-1 text-[12.5px] text-emerald-300"><Globe className="h-3.5 w-3.5" />Yayında</span> : o.durum === "uretiliyor" ? <span className="flex items-center gap-1 text-[12.5px] text-aksan"><Loader2 className="h-3.5 w-3.5 animate-spin" />Üretiliyor</span> : o.demo ? <span className="text-[12.5px] text-amber-300">Örnek</span> : null}</span>
        <span className="hidden w-24 text-right text-[12.5px] text-metin-2 sm:block">{zaman}</span>
      </Link>
      <ProjeMenu o={o} islem={islem} acikHep />
    </motion.div>
  );
}

/** Izgaranın ilk karesi: yeni proje. */
export function YeniKart({ onClick }: { onClick: () => void }) {
  return (
    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileTap={{ scale: 0.98 }} onClick={onClick}
      className="group hidden aspect-[16/11] flex-col sm:flex items-center justify-center gap-3 rounded-[18px] border border-dashed border-white/[0.14] bg-white/[0.02] text-metin-2 transition-colors hover:border-aksan/50 hover:bg-aksan/[0.04] hover:text-white">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/[0.1] transition-transform duration-300 group-hover:rotate-90 group-hover:bg-aksan group-hover:text-[#06222b]"><Plus className="h-5 w-5" /></span>
      <span className="text-[14px] font-medium">Yeni proje</span>
    </motion.button>
  );
}
