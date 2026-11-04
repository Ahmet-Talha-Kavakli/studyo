"use client";

/* Montaj stüdyosunun sade denetim parçaları: düz bölümler, ince kaydırıcı, bölmeli seçici,
   anahtar satırı ve renk örnekleri. Renkli ikon kutusu ya da büyük harfli küçük başlık yok. */

import { useId } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { RotateCcw, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Panel içi bölüm: başlık şeritli kart (havada başlık yok); kartlar arası 12px. */
export function Bolum({ baslik, sag, children, className }: { baslik?: string; sag?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("mx-3 mt-3 overflow-hidden rounded-[16px] bg-white/[0.045] ring-1 ring-inset ring-white/[0.07] last:mb-3", className)}>
      {(baslik || sag) && (
        <div className="flex min-h-[42px] items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2">
          {baslik && <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-white">{baslik}</h3>}
          {sag}
        </div>
      )}
      <div className="space-y-3 p-3">{children}</div>
    </section>
  );
}

/** Küçük alt başlık (bölüm içinde). */
export const AltBaslik = ({ children, sag }: { children: React.ReactNode; sag?: React.ReactNode }) => (
  <div className="flex items-center justify-between"><span className="text-[12px] font-medium text-white/60">{children}</span>{sag}</div>
);

/** "Sıfırla" bağlantısı. */
export const Sifirla = ({ fn, etiket = "Sıfırla" }: { fn: () => void; etiket?: string }) => (
  <button onClick={fn} className="flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium text-white/60 transition hover:bg-white/[0.07] hover:text-white active:scale-95"><RotateCcw className="h-3 w-3" />{etiket}</button>
);

/** İnce kaydırıcı: solda ad, sağda değer; çift tıkla varsayılana döner. */
export function Kaydirici({ ad, deger, min, max, adim, onDegis, yaz, varsayilan, sag, aciklama }: {
  ad: string; deger: number; min: number; max: number; adim: number; onDegis: (v: number) => void; yaz: (n: number) => string;
  varsayilan?: number; sag?: React.ReactNode; aciklama?: string;
}) {
  const o = Math.max(0, Math.min(100, ((deger - min) / (max - min)) * 100));
  // Varsayılan ortadaysa (ör. renk ayarı) dolgu ortadan başlar
  const merkez = varsayilan !== undefined && varsayilan > min && varsayilan < max ? ((varsayilan - min) / (max - min)) * 100 : 0;
  const [sol, gen] = o >= merkez ? [merkez, o - merkez] : [o, merkez - o];
  return (
    <div onDoubleClick={() => varsayilan !== undefined && onDegis(varsayilan)}>
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-[13px] text-metin-2">{ad}</span>
        {sag}
        <span className="min-w-[44px] text-right text-[12.5px] font-medium tabular-nums text-metin">{yaz(deger)}</span>
      </div>
      <div className="relative mt-2 h-4">
        <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/[0.09]" />
        <span className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-white" style={{ left: `${sol}%`, width: `${gen}%` }} />
        <input type="range" min={min} max={max} step={adim} value={deger} onChange={(e) => onDegis(Number(e.target.value))} aria-label={ad} aria-valuetext={yaz(deger)}
          className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0" />
        <span className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-1 ring-black/20 peer-focus-visible:ring-2 peer-focus-visible:ring-white/60" style={{ left: `${o}%` }} />
      </div>
      {aciklama && <p className="mt-1 text-[11.5px] leading-snug text-metin-3">{aciklama}</p>}
    </div>
  );
}

/** Bölmeli seçici (segmented control). */
export function Segment<T extends string | number>({ deger, secenekler, onDegis, etiket, kapali }: {
  deger: T; secenekler: (readonly [T, string] | readonly [T, string, LucideIcon])[]; onDegis: (v: T) => void; etiket?: string; kapali?: T[];
}) {
  const id = useId();
  return (
    <LayoutGroup id={id}>
    <div role="radiogroup" aria-label={etiket} className="grid gap-0.5 rounded-full bg-white/[0.085] p-1 ring-1 ring-inset ring-white/[0.06]" style={{ gridTemplateColumns: `repeat(${secenekler.length}, minmax(0,1fr))` }}>
      {secenekler.map(([v, a, I]) => {
        const sec = v === deger;
        return (
          <button key={String(v)} role="radio" aria-checked={sec} onClick={() => onDegis(v)} disabled={kapali?.includes(v)}
            className={cn("relative flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-full px-1.5 text-[12.5px] font-medium transition-colors active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35",
              sec ? "text-black" : "text-metin-2 hover:text-metin")}>
            {sec && <motion.span layoutId={`${id}-z`} className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            {I && <I className="relative h-3.5 w-3.5 shrink-0" />}<span className="relative truncate">{a}</span>
          </button>
        );
      })}
    </div>
    </LayoutGroup>
  );
}

/** Anahtar (switch). */
export function Anahtar({ acik, onDegis, etiket }: { acik: boolean; onDegis: () => void; etiket: string }) {
  return (
    <button onClick={onDegis} role="switch" aria-checked={acik} aria-label={etiket} className={cn("relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-200", acik ? "bg-white" : "bg-white/15 hover:bg-white/20")}>
      <span className={cn("absolute top-[3px] h-4 w-4 rounded-full transition-[left,background-color] duration-200", acik ? "left-[19px] bg-black" : "left-[3px] bg-white")} />
    </button>
  );
}

/** Ad + açıklama + anahtar satırı. */
export function AnahtarSatir({ ad, alt, acik, onDegis }: { ad: string; alt?: string; acik: boolean; onDegis: () => void }) {
  return (
    <div className="flex cursor-pointer items-center gap-3" onClick={(e) => { if (!(e.target as HTMLElement).closest("button")) onDegis(); }}>
      <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-metin">{ad}</span>{alt && <span className="mt-0.5 block text-[11.5px] leading-snug text-metin-3">{alt}</span>}</span>
      <Anahtar acik={acik} onDegis={onDegis} etiket={ad} />
    </div>
  );
}

export const TEMEL_RENKLER = ["#ffffff", "#000000", "#55d6fd", "#facc15", "#f472b6", "#a3e635", "#f97316"];

/** Renk örnekleri + özel renk. */
export function Renkler({ deger, onDegis, renkler = TEMEL_RENKLER, etiket = "Renk" }: { deger: string; onDegis: (c: string) => void; renkler?: string[]; etiket?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {renkler.map((c) => (
        <button key={c} onClick={() => onDegis(c)} aria-label={`${etiket} ${c}`} aria-pressed={deger.toLowerCase() === c.toLowerCase()}
          className={cn("h-7 w-7 rounded-full ring-1 ring-inset ring-white/15 transition-transform hover:scale-110", deger.toLowerCase() === c.toLowerCase() && "outline outline-2 outline-offset-2 outline-white")} style={{ background: c }} />
      ))}
      <label className="relative h-7 w-7 cursor-pointer overflow-hidden rounded-full ring-1 ring-inset ring-white/15 transition-transform hover:scale-110" title="Özel renk"
        style={{ background: "conic-gradient(#f43f5e,#facc15,#4ade80,#55d6fd,#818cf8,#e879f9,#f43f5e)" }}>
        <input type="color" value={/^#[0-9a-f]{6}/i.test(deger) ? deger.slice(0, 7) : "#ffffff"} onChange={(e) => onDegis(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label={`Özel ${etiket.toLocaleLowerCase("tr")}`} />
      </label>
    </div>
  );
}

/** Seçenek kartı (görselli ızgaralar için): seçiliyken beyaz halka. */
export const kartSinif = (sec: boolean) => cn("overflow-hidden rounded-[12px] text-left ring-1 transition-shadow", sec ? "ring-2 ring-white" : "ring-white/[0.08] hover:ring-white/25");

/** Sol kütüphane paneli başlık şeridi: simge dairesi + başlık + tek satır alt yazı (havada başlık yok). */
export function PanelSerit({ baslik, alt, ikon: I, sag }: { baslik: string; alt?: string; ikon?: LucideIcon; sag?: React.ReactNode }) {
  return (
    <div className="mb-3 flex shrink-0 items-center gap-3 border-b border-white/[0.06] py-3 pl-3.5 pr-12">
      {I && <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.085]"><I className="h-4 w-4 text-white" /></span>}
      <span className="min-w-0 flex-1 leading-tight"><span className="block truncate text-[14.5px] font-semibold text-metin">{baslik}</span>{alt && <span className="mt-0.5 block truncate text-[12px] text-metin-3">{alt}</span>}</span>
      {sag}
    </div>
  );
}

/** Panel başlığı (sol kütüphane). */
export function PanelUst({ baslik, alt, sag }: { baslik: string; alt?: string; sag?: React.ReactNode }) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-2 px-4 pb-3 pt-4">
      <span className="min-w-0"><span className="block text-[15px] font-semibold text-metin">{baslik}</span>{alt && <span className="mt-0.5 block text-[12px] leading-snug text-metin-3">{alt}</span>}</span>
      {sag}
    </div>
  );
}

/** Panel kartı: başlık şeridi (simge + başlık + isteğe bağlı sağ öğe) ve gövde. Yan panellerde havada başlık bırakmaz. */
export function PKart({ baslik, ikon: I, sag, alt, children, govde, className }: { baslik: React.ReactNode; ikon?: LucideIcon; sag?: React.ReactNode; alt?: React.ReactNode; children: React.ReactNode; govde?: string; className?: string }) {
  return (
    <section className={cn("overflow-hidden rounded-[16px] bg-white/[0.045] ring-1 ring-inset ring-white/[0.07]", className)}>
      <header className="flex min-h-[42px] items-center gap-2 border-b border-white/[0.06] px-3 py-2">
        {I && <I className="h-3.5 w-3.5 shrink-0 text-white/60" />}
        <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold text-white">{baslik}</span>{alt && <span className="block truncate text-[11.5px] text-white/50">{alt}</span>}</span>
        {sag && <span className="flex shrink-0 items-center gap-1">{sag}</span>}
      </header>
      <div className={cn("p-2.5", govde)}>{children}</div>
    </section>
  );
}

/** Sayı hapı (başlığın yanında). */
export const SayiHap = ({ n }: { n: number }) => <span className="rounded-full bg-white/[0.08] px-1.5 py-px text-[11px] font-semibold tabular-nums text-white/70">{n}</span>;

/** Nötr ikon kutusu (renkli cam yerine). */
export const IkonKutu = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.075] text-metin-2", className)}>{children}</span>
);
