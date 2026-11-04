"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, HelpCircle, Lock, Plus, Search, Sparkles, X } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";
import { HAREKETLER, HAREKET_KATLARI, KARISIM_EN_FAZLA, hareketAdi, hareketBul, klipYolu, posterYolu, type Hareket, type HareketKat } from "./veri";

/** Poster; fareyle üzerine gelince klip oynar (onlarca video aynı anda yüklenmez). */
function Klip({ klip }: { klip: string }) {
  const [oyna, setOyna] = useState(false);
  return (
    <span className="absolute inset-0" onPointerEnter={(e) => { if (e.pointerType === "mouse") setOyna(true); }} onPointerLeave={() => setOyna(false)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={posterYolu(klip)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
      {oyna && <video src={klipYolu(klip)} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />}
    </span>
  );
}

/**
 * Hareket kütüphanesi: kategori sekmeleri, arama ve üzerine gelince oynayan kartlar.
 * `engel` bir hareketin seçili modelde neden kullanılamadığını döner (ör. bitiş karesi yok);
 * kilitli kart seçilemez ve nedenini söyler.
 */
export function HareketGalerisi({ secili, onSec, onEkle, engel, kompakt }: {
  /** Seçili hareketler (karışımda sıralı). Boş = serbest. */
  secili: string[];
  onSec: (h: Hareket | null) => void;
  /** Kamera hareketini karışıma ekler / çıkarır. */
  onEkle?: (h: Hareket) => void;
  engel: (h: Hareket) => string | null;
  /** Pencere içinde: daha sık ızgara. */
  kompakt?: boolean;
}) {
  const [kat, setKat] = useState<HareketKat | "tumu">("tumu");
  const karisabilir = secili.length > 0 && secili.length < KARISIM_EN_FAZLA && secili.every((a) => hareketBul(a)?.kat === "kamera");
  const [ara, setAra] = useState("");
  const liste = useMemo(() => {
    const q = ara.trim().toLocaleLowerCase("tr");
    return HAREKETLER.filter((h) => (kat === "tumu" || h.kat === kat) && (!q || h.ad.toLowerCase().includes(q) || h.not.toLocaleLowerCase("tr").includes(q)));
  }, [kat, ara]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Hareket türü" className="gizli-scroll -mx-1 flex max-w-full items-center gap-1.5 overflow-x-auto px-1 py-0.5">
          {HAREKET_KATLARI.map((k) => {
            const grup = k.id === "tumu" ? HAREKETLER : HAREKETLER.filter((h) => h.kat === k.id);
            const ornek = (k.id === "tumu" ? [HAREKETLER[0], HAREKETLER.find((h) => h.kat === "efekt")!] : grup.slice(0, 2));
            const a = kat === k.id;
            return (
              <button key={k.id} role="tab" aria-selected={a} onClick={() => setKat(k.id)}
                className={cn("flex h-11 shrink-0 items-center gap-2.5 rounded-full py-1 pl-1 pr-4 transition-all duration-300",
                  a ? "bg-white text-[#0a0a0b] shadow-[0_8px_24px_-12px_rgba(255,255,255,0.45)]" : "bg-white/[0.04] text-metin-2 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.07] hover:text-metin")}>
                <span className="flex -space-x-2.5">
                  {ornek.map((h, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={h.ad} src={posterYolu(h.klip)} alt="" className={cn("h-9 w-9 rounded-full object-cover ring-2", a ? "ring-white" : "ring-[#151517]", i === 1 && "scale-90")} />
                  ))}
                </span>
                <span className="text-[13.5px] font-semibold">{k.ad}</span>
                <span className={cn("text-[12px] font-medium tabular-nums", a ? "text-black/45" : "text-metin-3")}>{grup.length}</span>
              </button>
            );
          })}
        </div>
        <span className="flex-1" />
        <div className="hidden items-center gap-3 text-[11.5px] text-metin-3 lg:flex">
          <span className="flex items-center gap-1.5"><span className="rounded-full bg-black/55 px-1.5 py-px text-[10px] font-medium text-white/90 ring-1 ring-inset ring-white/15">Kareyle</span>başlangıç karesi ister</span>
          <span className="flex items-center gap-1.5"><span className="rounded-full bg-black/55 px-1.5 py-px text-[10px] font-medium text-white/90 ring-1 ring-inset ring-white/15">İki kare</span>başlangıç + bitiş</span>
        </div>
        <Tooltip label={`Seçtiğin hareket istemine net bir kamera talimatı olarak eklenir. Kamera hareketlerinden ${KARISIM_EN_FAZLA} tanesini karıştırabilirsin.`} side="bottom">
          <span tabIndex={0} aria-label="Nasıl çalışır" className="flex h-9 w-9 shrink-0 cursor-help items-center justify-center rounded-full text-metin-3 ring-1 ring-inset ring-white/[0.07] transition-colors hover:text-metin"><HelpCircle className="h-4 w-4" /></span>
        </Tooltip>
        <label className="group/ara relative flex h-9 items-center max-sm:flex-1">
          <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-metin-3 transition-colors group-focus-within/ara:text-metin" />
          <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ara" aria-label="Hareket ara"
            className="h-9 w-full rounded-full bg-white/[0.04] pl-8 pr-8 text-[13px] text-metin outline-none ring-1 ring-inset ring-white/[0.07] transition-[width,box-shadow] duration-300 placeholder:text-metin-3 focus:ring-white/25 sm:w-[150px] sm:focus:w-[240px]" />
          {ara && <button onClick={() => setAra("")} aria-label="Aramayı temizle" className="absolute right-2 flex h-5 w-5 items-center justify-center rounded-full text-metin-3 hover:text-metin"><X className="h-3.5 w-3.5" /></button>}
        </label>
      </div>

      <div className={cn("grid gap-3", kompakt ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5")}>
        {/* Serbest: hareketi istem yönetir */}
        {kat === "tumu" && !ara && (
          <button onClick={() => onSec(null)} aria-pressed={!secili.length} className="group block text-left">
            <span className={cn("relative flex aspect-[4/5] flex-col items-center justify-center overflow-hidden rounded-[18px] ring-inset transition-shadow", !secili.length ? "bg-white/[0.06] outline outline-2 -outline-offset-2 outline-white" : "bg-white/[0.025] ring-1 ring-white/[0.08] group-hover:ring-white/25")}>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] text-metin ring-1 ring-inset ring-white/10 transition-transform group-hover:scale-105"><Sparkles className="h-5 w-5" /></span>
              <span className="mt-3 text-[14px] font-semibold text-metin">Serbest</span>
              <span className="mt-0.5 px-4 text-center text-[12px] text-metin-3">Hareketi istemin yönetir</span>
              {!secili.length && <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#0a0a0b]"><Check className="h-3 w-3" strokeWidth={3.5} /></span>}
            </span>
          </button>
        )}
        {liste.map((h, i) => {
          const sira = secili.indexOf(h.ad);
          const s = sira >= 0;
          const kilit = engel(h);
          const ekle = onEkle && h.kat === "kamera" && !kilit && (s ? secili.length > 1 : karisabilir);
          return (
            <motion.div key={h.ad} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: Math.min(i, 12) * 0.015 }} className="group relative">
            <button onClick={() => !kilit && onSec(h)} aria-pressed={s} aria-disabled={!!kilit} title={kilit ?? undefined}
              className={cn("block w-full text-left", kilit && "cursor-not-allowed")}>
              <span className={cn("relative block aspect-[4/5] overflow-hidden rounded-[18px] bg-[#111113] ring-inset transition-shadow", s ? "outline outline-2 -outline-offset-2 outline-white" : "ring-1 ring-white/[0.08] group-hover:ring-white/25")}>
                <Klip klip={h.klip} />
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-transparent" />
                <span className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
                  {h.rozet && <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold", h.rozet === "Yeni" ? "bg-white text-[#0a0a0b]" : "bg-white/90 text-[#0a0a0b]")}>{h.rozet}</span>}
                  {h.baslaBitir && <span className="rounded-full bg-black/55 px-2 py-0.5 text-[10.5px] font-medium text-white/90 backdrop-blur-md">İki kare</span>}
                  {h.kareGerekli && <span className="rounded-full bg-black/55 px-2 py-0.5 text-[10.5px] font-medium text-white/90 backdrop-blur-md">Kareyle</span>}
                </span>
                {s && <span className="absolute right-2.5 top-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10.5px] font-bold tabular-nums text-[#03141a]">{secili.length > 1 ? sira + 1 : <Check className="h-3 w-3" strokeWidth={3.5} />}</span>}
                {kilit && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <span className="mx-3 flex items-start gap-1.5 rounded-[12px] bg-black/70 px-2.5 py-2 text-[11.5px] leading-snug text-white/90"><Lock className="mt-px h-3.5 w-3.5 shrink-0" />{kilit}</span>
                  </span>
                )}
                <span className="absolute inset-x-3 bottom-3">
                  <span className="block truncate text-[14.5px] font-semibold tracking-[-0.01em] text-white">{hareketAdi(h.ad)}</span>
                  <span className="mt-0.5 block truncate text-[12px] text-white/65">{h.not}</span>
                </span>
              </span>
            </button>
            {ekle && (
              <button onClick={() => onEkle!(h)} aria-label={s ? `${hareketAdi(h.ad)} karışımdan çıkar` : `${hareketAdi(h.ad)} karışıma ekle`}
                className={cn("absolute bottom-[54px] right-2.5 flex h-7 items-center gap-1 rounded-full px-2.5 text-[11.5px] font-semibold backdrop-blur-md transition-opacity",
                  s ? "bg-black/60 text-white ring-1 ring-inset ring-white/20 opacity-0 group-hover:opacity-100 focus-visible:opacity-100" : "bg-white text-[#0a0a0b] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100")}>
                {s ? <><X className="h-3 w-3" />Çıkar</> : <><Plus className="h-3 w-3" strokeWidth={3} />Karışıma ekle</>}
              </button>
            )}
            </motion.div>
          );
        })}
      </div>
      {!liste.length && <p className="py-12 text-center text-[13px] text-metin-3">“{ara}” ile eşleşen hareket yok.</p>}
    </div>
  );
}
