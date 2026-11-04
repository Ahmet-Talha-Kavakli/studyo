"use client";

/**
 * Varyant önizlemesi: telefon çerçevesinde seçili oyuncu + ürün; kanca, gövde cümleleri ve kapanış sırayla
 * altyazı olarak akar. Sağda yalnız zaman çizelgesi (bölüm adı + saniye), metin tekrarlanmaz.
 */

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/Tooltip";
import { KrediYildiz } from "@/components/ui/KrediHap";

type Parca = { tur: "Kanca" | "Gövde" | "Kapanış"; metin: string; sn: number };
const ease = [0.22, 1, 0.36, 1] as const;
const sure = (m: string) => Math.max(1.4, m.split(/\s+/).filter(Boolean).length / 2.4);

export function UgcOnizleme({ varyantlar, urun, govde, cta, mekanAd, oran, birim, kapali, onUret, uretAd = "Bu varyantı üret", dikey, secili, onSecili }: {
  varyantlar: { anahtar: string; aktorId?: string; kancaId?: string; aktorAd: string; aktorGorsel: string; harf: string; kanca: string }[];
  urun: string; govde: string; cta: string; mekanAd: string; oran: string;
  birim?: number; kapali?: boolean; onUret?: (aktorId: string, kancaId: string) => void; uretAd?: string;
  /** Dar sütun: telefon üstte, denetimler altta. */
  dikey?: boolean;
  /** Dışarıdan denetlenen seçili varyant. */
  secili?: number; onSecili?: (n: number) => void;
}) {
  const [vIc, setVIc] = useState(0);
  const v = secili ?? vIc;
  const setV = (f: (x: number) => number) => { const n = f(v); setVIc(n); onSecili?.(n); };
  const [i, setI] = useState(0);
  const [oynuyor, setOynuyor] = useState(true);
  const V = varyantlar[Math.min(v, varyantlar.length - 1)];
  const parcalar: Parca[] = useMemo(() => {
    const govdeL = govde.split(/(?<=[.!?…])\s+/).filter((x) => x.trim());
    return [{ tur: "Kanca" as const, metin: V?.kanca ?? "", sn: sure(V?.kanca ?? "") }, ...govdeL.map((m) => ({ tur: "Gövde" as const, metin: m, sn: sure(m) })), ...(cta ? [{ tur: "Kapanış" as const, metin: cta, sn: sure(cta) }] : [])];
  }, [V?.kanca, govde, cta]);
  useEffect(() => { setI(0); }, [v, govde, cta]);
  useEffect(() => {
    if (!oynuyor || !parcalar.length) return;
    const t = setTimeout(() => setI((x) => (x + 1) % parcalar.length), parcalar[i % parcalar.length].sn * 1000);
    return () => clearTimeout(t);
  }, [i, oynuyor, parcalar]);
  if (!V) return null;
  const P = parcalar[i % parcalar.length];
  const bas = parcalar.slice(0, i).reduce((a, x) => a + x.sn, 0);
  const toplam = parcalar.reduce((a, x) => a + x.sn, 0);
  const bolumler = (["Kanca", "Gövde", "Kapanış"] as const).map((t) => {
    const ilk = parcalar.findIndex((x) => x.tur === t);
    if (ilk < 0) return null;
    const b = parcalar.slice(0, ilk).reduce((a, x) => a + x.sn, 0), s = parcalar.filter((x) => x.tur === t).reduce((a, x) => a + x.sn, 0);
    return { t, b, s };
  }).filter(Boolean) as { t: string; b: number; s: number }[];
  const git = (d: number) => setV((x) => (x + d + varyantlar.length) % varyantlar.length);

  return (
    <div className={cn("flex gap-4", dikey ? "flex-col" : "max-sm:flex-col")}>
      {/* Telefon */}
      <div className={cn("relative mx-auto aspect-[9/16] shrink-0 overflow-hidden rounded-[30px] bg-black p-[6px] ring-1 ring-white/15", dikey ? "h-[440px] max-sm:h-[420px]" : "h-[460px] max-sm:h-[420px]")}>
        <div className="relative h-full w-full overflow-hidden rounded-[24px]">
          <AnimatePresence initial={false}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img key={V.aktorGorsel} src={V.aktorGorsel} alt="" initial={{ clipPath: "inset(0 100% 0 0)" }} animate={{ clipPath: "inset(0 0% 0 0)" }} transition={{ duration: 0.6, ease }}
              className="absolute inset-0 h-full w-full object-cover object-top" />
          </AnimatePresence>
          <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urun} alt="" className="absolute bottom-[30%] right-3 h-[18%] w-[34%] rounded-[12px] bg-white object-cover ring-2 ring-white/80" />
          <span className="absolute left-3 right-3 top-3 flex items-center gap-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11.5px] font-semibold text-black">{V.harf}</span>
            <span className="truncate text-[12.5px] font-semibold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">{V.aktorAd}</span>
            <span className="ml-auto rounded-full bg-black/45 px-2 py-0.5 text-[11px] text-white/90 backdrop-blur">{mekanAd} · {oran}</span>
          </span>
          <AnimatePresence mode="wait">
            <motion.p key={`${v}-${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.28, ease }}
              className={cn("absolute inset-x-4 text-center font-extrabold leading-tight text-white [paint-order:stroke_fill] [-webkit-text-stroke:3px_#000]", P.tur === "Kanca" ? "top-[16%] text-[19px]" : "bottom-[12%] text-[15.5px]")}>
              {P.metin}
            </motion.p>
          </AnimatePresence>
          <span className="absolute inset-x-3 bottom-3 h-[3px] overflow-hidden rounded-full bg-white/20">
            <motion.span key={`${v}-${i}-${oynuyor}`} className="block h-full bg-white" initial={{ width: `${(bas / toplam) * 100}%` }} animate={{ width: oynuyor ? `${((bas + P.sn) / toplam) * 100}%` : `${(bas / toplam) * 100}%` }} transition={{ duration: oynuyor ? P.sn : 0, ease: "linear" }} />
          </span>
        </div>
      </div>
      {/* Zaman çizelgesi + varyant gezinme */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => git(-1)} aria-label="Önceki varyant" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-metin transition hover:bg-white/[0.12] active:scale-90"><ChevronLeft className="h-4 w-4" /></button>
          <span className="min-w-0 flex-1 text-center leading-tight"><span className="block truncate text-[14px] font-semibold text-metin">{V.aktorAd} · Kanca {V.harf}</span><span className="block text-[12px] tabular-nums text-metin-3">{Math.min(v, varyantlar.length - 1) + 1} / {varyantlar.length} varyant</span></span>
          <button onClick={() => git(1)} aria-label="Sonraki varyant" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-metin transition hover:bg-white/[0.12] active:scale-90"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className={cn(dikey ? "grid grid-cols-3 gap-1.5" : "space-y-1.5")}>
          {bolumler.map((b) => {
            const a = P.tur === b.t;
            return (
              <button key={b.t} onClick={() => setI(parcalar.findIndex((x) => x.tur === b.t))} className={cn("flex w-full rounded-[12px] text-left ring-1 ring-inset transition-colors", dikey ? "flex-col gap-0.5 px-2.5 py-2" : "items-center gap-3 px-3 py-2.5", a ? "bg-white/[0.08] ring-white/40" : "ring-white/[0.06] hover:bg-white/[0.04]")}>
                {!dikey && <span className={cn("h-2 w-2 shrink-0 rounded-full transition-colors", a ? "bg-white" : "bg-white/25")} />}
                <span className={cn("flex-1 text-[13px] font-medium", a ? "text-metin" : "text-metin-2")}>{b.t}</span>
                <span className="text-[11.5px] tabular-nums text-metin-3">{b.b.toFixed(0)}–{(b.b + b.s).toFixed(0)} sn</span>
              </button>
            );
          })}
        </div>
        <div className="mt-auto flex items-center gap-2">
          <Tooltip side="top" label="Taslak önizleme: gerçek ses, mimik ve hareket üretimde gelir.">
            <button onClick={() => setOynuyor((x) => !x)} className="flex h-10 items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[13px] font-medium text-metin transition hover:bg-white/[0.12] active:scale-95">{oynuyor ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}{oynuyor ? "Duraklat" : "Oynat"}</button>
          </Tooltip>
          {onUret && V.aktorId && V.kancaId && (
            <button onClick={() => onUret(V.aktorId!, V.kancaId!)} disabled={kapali} className="ml-auto flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black transition active:scale-95 disabled:bg-white/[0.1] disabled:text-metin-3">
              <Sparkles className="h-3.5 w-3.5" />{uretAd}{birim !== undefined && <span className="flex items-center gap-0.5 rounded-full bg-black/10 px-1.5 text-[11.5px] tabular-nums"><KrediYildiz className="h-2.5 w-2.5" />{birim}</span>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
