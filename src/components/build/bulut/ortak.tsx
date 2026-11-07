"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const yay = { type: "spring" as const, stiffness: 420, damping: 40 };

/**
 * Sağdan açılan panel (Veritabanı YanPanel düzeni): bütün pencere ve açılır içerik bununla açılır. Sayfa kaydırmasından
 * bağımsız olsun diye body'ye taşınır (fixed); Escape ve arka plana tıklama kapatır.
 */
export function YanPanel({ acik, kapat, baslik, alt, children, alt2, genis }: { acik: boolean; kapat: () => void; baslik: React.ReactNode; alt?: React.ReactNode; children: React.ReactNode; alt2?: React.ReactNode; genis?: boolean }) {
  const [hazir, setHazir] = useState(false);
  useEffect(() => { setHazir(true); }, []);
  useEffect(() => { if (!acik) return; const t = (e: KeyboardEvent) => e.key === "Escape" && kapat(); addEventListener("keydown", t); return () => removeEventListener("keydown", t); }, [acik, kapat]);
  if (!hazir) return null;
  return createPortal(
    <AnimatePresence>
      {acik && (
        <>
          <motion.div key="perde" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={kapat} className="fixed inset-0 z-[120] bg-black/40" />
          <motion.aside key="panel" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={yay} className={cn("bd-panel fixed inset-y-0 right-0 z-[121] flex w-full flex-col sm:rounded-l-[20px]", genis ? "sm:w-[620px]" : "sm:w-[480px]")}>
            <header className="flex items-start gap-3 border-b border-white/[0.07] px-5 py-4">
              <div className="min-w-0 flex-1"><div className="truncate text-[15px] font-semibold text-white">{baslik}</div>{alt && <div className="mt-0.5 text-[12.5px] text-white/50">{alt}</div>}</div>
              <button type="button" onClick={kapat} aria-label="Kapat" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 [scrollbar-width:thin]">{children}</div>
            {alt2 && <footer className="flex flex-wrap items-center gap-2 border-t border-white/[0.07] px-5 py-3">{alt2}</footer>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Seçilebilir küçük hap: seçili hâl beyaz çerçeve (tik yok). */
export function Hap({ secili, onClick, children, sayi, className }: { secili: boolean; onClick: () => void; children: React.ReactNode; sayi?: number; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={secili} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] transition-colors", secili ? "bg-white/[0.08] text-white ring-1 ring-inset ring-white" : "bg-white/[0.05] text-white/65 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.08] hover:text-white", className)}>
      {children}{sayi != null && <span className="tabular-nums text-white/45">{sayi.toLocaleString("tr-TR")}</span>}
    </button>
  );
}

/** Yüzey satırı (süzgeç kenar çubuğu): ad + sayı, seçili hâl beyaz çerçeve. */
export function YuzeySatiri({ secili, onClick, ad, sayi, nokta }: { secili: boolean; onClick: () => void; ad: React.ReactNode; sayi?: number; nokta?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={secili} className={cn("flex w-full items-center gap-2 rounded-[10px] px-2.5 py-1.5 text-left text-[12.5px] transition-colors", secili ? "bg-white/[0.07] text-white ring-1 ring-inset ring-white" : "text-white/65 hover:bg-white/[0.04] hover:text-white")}>
      {nokta && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: nokta }} />}
      <span className="min-w-0 flex-1 truncate">{ad}</span>
      {sayi != null && <span className="shrink-0 tabular-nums text-white/40">{sayi.toLocaleString("tr-TR")}</span>}
    </button>
  );
}

export type Seri = { anahtar: string; ad: string; renk: string };
/** Doğrulanmış koyu zemin sırası (alttan üste): hata, başarılı, uyarı. */
export const SEVIYE_SERI: Seri[] = [{ anahtar: "hata", ad: "Hata", renk: "#e8546c" }, { anahtar: "basarili", ad: "Başarılı", renk: "#1e9fcf" }, { anahtar: "uyari", ad: "Uyarı", renk: "#b8801c" }];
const kisa = (n: number) => (n >= 10_000 ? `${Math.round(n / 1000)} B` : n.toLocaleString("tr-TR"));

/**
 * Yığılmış çubuk grafiği: ince çubuklar, 2 px boşluk, tek eksen, silik ızgara, üzerine gelince ipucu.
 * İki ve daha çok seride açıklama gösterilir. onSec verilirse çubuğa tıklamak o aralığa yaklaşır.
 */
export function YiginCubuk({ veri, seriler, etiket, ipucuBaslik, yukseklik = 150, onSec, birim = "" }: {
  veri: ({ z: number } & Record<string, number>)[]; seriler: Seri[]; etiket: (z: number) => string; ipucuBaslik: (z: number) => string; yukseklik?: number; onSec?: (i: number) => void; birim?: string;
}) {
  const [ust, setUst] = useState<number | null>(null);
  const toplam = (x: Record<string, number>) => seriler.reduce((t, s) => t + (x[s.anahtar] ?? 0), 0);
  const en = Math.max(1, ...veri.map(toplam));
  const adim = en <= 4 ? 1 : Math.pow(10, Math.floor(Math.log10(en / 2)));
  const tavan = Math.max(4, Math.ceil(en / (adim * 2)) * adim * 2);
  const izgara = [0, tavan / 2, tavan];
  const n = veri.length;
  const etiketler = n ? [0, Math.floor(n / 2), n - 1] : [];
  return (
    <div>
      {seriler.length > 1 && (
        <div className="mb-2 flex flex-wrap justify-end gap-x-3 gap-y-1">
          {[...seriler].reverse().map((s) => <span key={s.anahtar} className="inline-flex items-center gap-1.5 text-[11.5px] text-white/55"><span className="h-2 w-2 rounded-[2px]" style={{ background: s.renk }} />{s.ad}</span>)}
        </div>
      )}
      <div className="flex">
        <div className="flex w-9 shrink-0 flex-col justify-between pr-2 text-right text-[11px] tabular-nums text-white/35" style={{ height: yukseklik }}>{[...izgara].reverse().map((v, i) => <span key={i} className={cn(i === 1 && "-translate-y-1/2", i === 0 && "-translate-y-1", i === 2 && "translate-y-1")}>{kisa(v)}</span>)}</div>
        <div className="relative flex-1" style={{ height: yukseklik }} onMouseLeave={() => setUst(null)}>
          {izgara.map((v, i) => <span key={i} className="absolute inset-x-0 border-t border-white/[0.06]" style={{ bottom: `${(v / tavan) * 100}%` }} />)}
          <div className="absolute inset-0 flex items-end gap-[2px]">
            {veri.map((x, i) => {
              const dolu = seriler.filter((s) => (x[s.anahtar] ?? 0) > 0);
              return (
                <div key={x.z} onMouseEnter={() => setUst(i)} onClick={() => onSec?.(i)} className={cn("relative flex h-full min-w-0 flex-1 flex-col-reverse gap-[2px]", onSec && toplam(x) > 0 && "cursor-zoom-in")}>
                  {dolu.map((s, j) => (
                    <span key={s.anahtar} className={cn("w-full shrink-0 transition-opacity", j === dolu.length - 1 && "rounded-t-[4px]", ust !== null && ust !== i && "opacity-60")} style={{ height: `max(2px, calc(${((x[s.anahtar] ?? 0) / tavan) * 100}% - 2px))`, background: s.renk }} />
                  ))}
                </div>
              );
            })}
          </div>
          {ust !== null && veri[ust] && (
            <div className="pointer-events-none absolute -top-2 z-10 rounded-[12px] bg-[#1b1c1f] px-3 py-2 text-[12px] ring-1 ring-inset ring-white/[0.1]" style={{ left: `${((ust + 0.5) / n) * 100}%`, transform: `translate(${ust > n * 0.7 ? "-100%" : ust < n * 0.3 ? "0" : "-50%"}, -100%)` }}>
              <p className="whitespace-nowrap font-medium text-white">{ipucuBaslik(veri[ust].z)}</p>
              {[...seriler].reverse().map((s) => <p key={s.anahtar} className="flex items-center gap-2 whitespace-nowrap text-white/65"><span className="h-2 w-2 rounded-[2px]" style={{ background: s.renk }} /><span className="flex-1">{s.ad}</span><span className="tabular-nums text-white">{(veri[ust][s.anahtar] ?? 0).toLocaleString("tr-TR")}{birim}</span></p>)}
              {onSec && toplam(veri[ust]) > 0 && <p className="mt-1 whitespace-nowrap text-[11px] text-white/40">Yaklaşmak için tıkla</p>}
            </div>
          )}
        </div>
      </div>
      {n > 0 && <div className="ml-9 mt-1.5 flex justify-between text-[11px] text-white/35">{etiketler.map((i, k) => <span key={k}>{etiket(veri[i].z)}</span>)}</div>}
    </div>
  );
}

/** Tanım listesi satırı (ayrıntı panelleri). */
export function Alan({ ad, children, mono }: { ad: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex gap-3 py-2 text-[13px]">
      <dt className="w-[120px] shrink-0 text-white/45">{ad}</dt>
      <dd className={cn("min-w-0 flex-1 break-words text-white/85", mono && "font-mono text-[12.5px]")}>{children}</dd>
    </div>
  );
}

/** Ajana düzelt isteği: gömülüyse doğrudan sohbete, değilse çalışma alanına ilk istek olarak taşınır. */
export function ajanaTasi(projeId: string, metin: string, git: (yol: string) => void) {
  try { sessionStorage.setItem(`vayra-build-ilk-${projeId}`, JSON.stringify({ istem: metin, mod: "yap", ekler: [] })); } catch { /* yok */ }
  git(`/panel/build/${projeId}`);
}

/** Süreyi okunur yazar. */
export const sureYaz = (ms?: number) => (ms == null ? "" : ms < 1000 ? `${ms} ms` : `${(ms / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} sn`);
/** Saat:dakika ya da gün ay etiketi (kova boyuna göre). */
export const zamanEtiketi = (z: number, kova: number) => kova >= 3 * 3600_000 ? new Date(z).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }) : new Date(z).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
