"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Info, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOdakTuzagi } from "@/hooks/useOdakTuzagi";
import { Tooltip } from "@/components/ui/Tooltip";
import { ModelLogo, modelLogoUrl } from "@/components/kitaplik/Simgeler";

/**
 * Stüdyo ortak "Higgsfield" parçaları — Ses ve Müzik stüdyoları aynı denetim dilini konuşur:
 * rozetler, logo kutuları, ⓘ ipuçları, başlıklı kartlar, ikonlu anahtar/bilgi kartları,
 * değer haplı kaydırıcı, ikonlu karo seçici ve mobil alt sayfa.
 */
type Mic = LucideIcon;

/** YENİ / DEMO / YAKINDA rozetleri (Görsel/Video model menüleriyle aynı). */
export function Rozet({ tur }: { tur: "yeni" | "demo" | "yakinda" | "kilit" }) {
  if (tur === "kilit") return <span title="Bu araç gerçek sağlayıcı bağlantısı ister" className="rounded-full bg-amber-300/15 px-1.5 py-px text-[10.5px] font-medium text-amber-200">Bağlantı gerekli</span>;
  if (tur === "yeni") return <span className="rounded-full bg-aksan/15 px-1.5 py-px text-[10.5px] font-medium text-aksan">Yeni</span>;
  if (tur === "demo") return null;
  return <span className="rounded-full bg-white/10 px-1.5 py-px text-[10.5px] font-medium text-metin-2">Yakında</span>;
}

/** Marka logosu cam kutuda. */
export function MarkaKare({ ad, boyut = 36 }: { ad: string; boyut?: number }) {
  // Logosu olmayan üçüncü taraf modelde Vayra işareti yanıltıcı olur: harf monogramı çizilir.
  const monogram = !modelLogoUrl(ad) && !/vayra|ruh|auto|demo|yükleme/i.test(ad);
  const renk = ["#55d6fd", "#a78bfa", "#f472b6", "#fbbf24", "#34d399", "#fb923c"][[...ad].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7) % 6];
  return (
    <span className="glass-ikon flex shrink-0 items-center justify-center rounded-lg" style={{ width: boyut, height: boyut }}>
      {monogram
        ? <span className="font-bold tracking-tight" style={{ fontSize: Math.round(boyut * 0.38), color: renk }}>{ad.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 2)}</span>
        : <ModelLogo ad={ad} boyut={Math.round(boyut * 0.5)} />}
    </span>
  );
}

/** ⓘ ipucu. */
export function Ipucu({ metin }: { metin: string }) {
  return (
    <Tooltip label={metin} side="top">
      {/* span: düğmelerin içinde de kullanılabilsin (iç içe <button> geçersiz HTML) */}
      <span role="img" tabIndex={0} className="inline-flex cursor-help rounded-full outline-none focus-visible:ring-1 focus-visible:ring-aksan" aria-label={metin} onClick={(e) => e.stopPropagation()}><Info className="h-3 w-3 text-metin-3 hover:text-metin-2" /></span>
    </Tooltip>
  );
}

/** Başlıklı ayar kartı: başlık + ikon + sağ eylem. */
export function KartBolum({ baslik, ikon, sag, children }: { baslik: string; ikon?: React.ReactNode; sag?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="panel-ic space-y-4 rounded-2xl p-3.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-metin [&_svg]:text-metin-3">{ikon}{baslik}</span>
        {sag}
      </div>
      {children}
    </section>
  );
}

/** iOS anahtarı (Video ile aynı). */
export function Anahtar({ acik, onClick, etiket }: { acik: boolean; onClick: () => void; etiket: string }) {
  return (
    <button onClick={onClick} role="switch" aria-checked={acik} aria-label={etiket}
      className={cn("relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors", acik ? "bg-white" : "bg-white/20 hover:bg-white/25")}>
      <motion.span layout transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className={cn("absolute top-[3px] h-4 w-4 rounded-full transition-colors", acik ? "bg-[#0a0a0b]" : "bg-white")} style={{ left: acik ? 19 : 3 }} />
    </button>
  );
}

export type IkonRenk = "cyan" | "lime" | "mor" | "gok" | "gul" | "kehribar" | "yesil";
/** Renkli ikon kutulu anahtar kartı (ⓘ ipuçlu). */
export function AnahtarKart({ ikon, renk, baslik, ipucu, acik, onDegis }: { ikon: React.ReactNode; renk: IkonRenk; baslik: string; ipucu?: string; acik: boolean; onDegis: () => void }) {
  return (
    // Kartın tamamı tıklanabilir (anahtar ve ipucu kendi tıklamasını yönetir)
    <div className="panel-ic flex cursor-pointer select-none items-center gap-3 rounded-xl px-3 py-2.5" onClick={(e) => { if (!(e.target as HTMLElement).closest("button")) onDegis(); }}>
      <span className={cn("glass-ikon flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg", `glass-ikon-${renk}`)}>{ikon}</span>
      <span className="flex min-w-0 flex-1 items-center gap-1.5 text-[13.5px] font-medium text-metin">{baslik}{ipucu && <Ipucu metin={ipucu} />}</span>
      <Anahtar acik={acik} onClick={onDegis} etiket={baslik} />
    </div>
  );
}

/** Bilgi kartı — açıklamalar düz paragraf değil, ikonlu kart. */
export function BilgiKart({ ikon, renk, baslik, metin }: { ikon: React.ReactNode; renk: IkonRenk; baslik: string; metin: string }) {
  return (
    <div className="panel-ic flex gap-3 rounded-xl p-3">
      <span className={cn("glass-ikon flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg", `glass-ikon-${renk}`)}>{ikon}</span>
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-metin">{baslik}</span>
        <span className="block text-[12px] leading-snug text-metin-3">{metin}</span>
      </span>
    </div>
  );
}

/** Değer haplı kaydırıcı: etiket + ⓘ + değer hapı; parlak tutamaç; uç açıklamaları. */
export function HapKaydirici({ ad, deger, min, max, adim, onDegis, solUc, sagUc, yaz, ipucu }: {
  ad: string; deger: number; min: number; max: number; adim: number; onDegis: (v: number) => void; solUc: string; sagUc: string; yaz: (n: number) => string; ipucu?: string;
}) {
  const o = ((deger - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[13px] font-medium text-metin">{ad}{ipucu && <Ipucu metin={ipucu} />}</span>
        <span className="glass-cip rounded-full px-2 py-0.5 text-[11.5px] font-semibold tabular-nums text-aksan">{yaz(deger)}</span>
      </div>
      <div className="relative mt-3 h-5">
        <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/[0.08] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]" />
        <span className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-aksan/50 to-aksan" style={{ width: `${o}%` }} />
        <input type="range" min={min} max={max} step={adim} value={deger} onChange={(e) => onDegis(Number(e.target.value))} aria-label={ad} aria-valuetext={yaz(deger)}
          className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0" />
        <span className="pointer-events-none absolute top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-aksan bg-white shadow-[0_0_12px_var(--color-aksan)] peer-focus-visible:ring-2 peer-focus-visible:ring-aksan peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-zemin" style={{ left: `${o}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-metin-3"><span>{solUc}</span><span>{sagUc}</span></div>
    </div>
  );
}

/**
 * İkonlu karo seçici — birkaç belirgin seçenek için. Her karo: cam ikon kutusu, ad ve (≤4 sütunda)
 * görünür alt satır; seçili karo camgöbeği cama ve ikon kutusu renge geçer. Etiket küçük başlıktır.
 */
export function KaroSecici<T extends number | string>({ etiket, deger, onDegis, secenekler, altYazi, devreDisi }: {
  etiket: string; deger: T; onDegis: (v: T) => void; secenekler: [T, string, Mic, string][]; altYazi?: boolean; devreDisi?: T[];
}) {
  const alt = altYazi ?? secenekler.length <= 4;
  return (
    <div>
      {etiket && <p className="mb-2 text-[12.5px] font-medium text-metin-2">{etiket}</p>}
      <div role="radiogroup" aria-label={etiket || undefined} className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${secenekler.length}, minmax(0, 1fr))` }}>
        {secenekler.map(([v, a, I, ipucu]) => {
          const sec = deger === v;
          return (
            <button key={String(v)} role="radio" aria-checked={sec} onClick={() => onDegis(v)} title={ipucu} disabled={devreDisi?.includes(v)}
              className={cn("hf-btn flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-1 pb-2 pt-2.5 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                sec ? "glass-cip-aktif" : "bg-white/[0.025] ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.05]")}>
              <span className={cn("glass-ikon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", sec && "glass-ikon-cyan")}>
                <I className={cn("h-4 w-4", sec ? "text-aksan" : "text-metin-2")} />
              </span>
              <span className={cn("w-full truncate text-[12px] font-semibold leading-tight", sec ? "text-metin" : "text-metin-2")}>{a}</span>
              {alt && ipucu && <span className={cn("-mt-1 w-full truncate text-[10px] leading-tight", sec ? "text-aksan/80" : "text-metin-3")}>{ipucu}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Mobil alt sayfa. */
export function AltSayfa({ acik, baslik, onKapat, children }: { acik: boolean; baslik: string; onKapat: () => void; children: React.ReactNode }) {
  const odakRef = useOdakTuzagi(acik);
  return (
    <AnimatePresence>
      {acik && (
        <div ref={odakRef} className="fixed inset-0 z-[80] flex items-end" role="dialog" aria-modal="true" aria-label={baslik}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="perde absolute inset-0 bg-black/60" onClick={onKapat} />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 38 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.4 }} onDragEnd={(_, i) => { if (i.offset.y > 90) onKapat(); }}
            className="hf-kart relative flex max-h-[86vh] w-full flex-col !rounded-b-none rounded-t-[24px] bg-yuzey pb-[env(safe-area-inset-bottom)]">
            <span className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-white/20" />
            <div className="flex items-center justify-between px-4 pb-1 pt-2">
              <h3 className="text-[16px] font-semibold text-metin">{baslik}</h3>
              <button onClick={onKapat} aria-label="Kapat" className="hf-btn glass-cip flex h-8 w-8 items-center justify-center rounded-full text-metin-2"><X className="h-4 w-4" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
