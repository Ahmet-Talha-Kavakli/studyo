"use client";

/**
 * API panel grafikleri — bağımlılıksız HTML.
 * Renkler (koyu yüzey): başarılı Vayra camgöbeği #55d6fd, başarısız #f43f5e.
 * Degrade dolgulu yığılmış sütunlar, yuvarlak tepe, üzerine gelince sütun bandı + cam ipucu (genel bakış grafiğiyle aynı dil).
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const SERI_RENK = { basarili: "#55d6fd", basarisiz: "#f43f5e" };

export interface Cubuk { anahtar: string; etiket: string; uzunEtiket: string; parcalar: { ad: string; deger: number; renk: string }[] }

const yuvarla = (n: number) => {
  if (n <= 5) return 5;
  const us = Math.pow(10, Math.floor(Math.log10(n)));
  return [1, 2, 2.5, 5, 10].map((k) => k * us).find((v) => v >= n) ?? n;
};

export function CubukGrafik({ veri, birim, yukseklik = 200, bosMetin = "Bu aralıkta veri yok" }: { veri: Cubuk[]; birim: string; yukseklik?: number; bosMetin?: string }) {
  const [ust, setUst] = useState<number | null>(null);
  const toplamlar = veri.map((c) => c.parcalar.reduce((t, p) => t + p.deger, 0));
  const tepe = yuvarla(Math.max(0, ...toplamlar));
  const bos = toplamlar.every((t) => t === 0);
  const etiketAdim = Math.max(1, Math.ceil(veri.length / 8));
  const seriler = Array.from(new Map(veri.flatMap((c) => c.parcalar.map((p) => [p.ad, p.renk] as const))).entries());
  const bosluk = veri.length > 40 ? "gap-[2px]" : veri.length > 14 ? "gap-[3px]" : "gap-1.5";

  return (
    <div>
      {seriler.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-4 text-[12.5px] text-white/70">
          {seriler.map(([ad, renk]) => <span key={ad} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: renk }} />{ad}</span>)}
        </div>
      )}
      <div className="relative flex" style={{ height: yukseklik }}>
        {/* Y ekseni */}
        <div className="flex w-10 shrink-0 flex-col justify-between pb-6 pr-2.5 text-right text-[11px] tabular-nums text-white/40">
          {[tepe, tepe / 2, 0].map((v) => <span key={v} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">{v.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}</span>)}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="absolute inset-x-0 bottom-6 top-0 flex flex-col justify-between">
            {[0, 1, 2].map((i) => <div key={i} className={cn("border-t", i === 2 ? "border-white/[0.12]" : "border-white/[0.05]")} />)}
          </div>
          {bos && (
            <div className="absolute inset-x-0 bottom-6 top-0 flex items-center justify-center">
              <span className="rounded-full bg-white/[0.05] px-3.5 py-1.5 text-[13px] text-white/65 ring-1 ring-white/[0.07]">{bosMetin}</span>
            </div>
          )}
          <div className={cn("absolute inset-x-0 bottom-6 top-0 flex items-end", bosluk)} onMouseLeave={() => setUst(null)}>
            {veri.map((c, i) => {
              const t = toplamlar[i];
              const dolu = c.parcalar.filter((p) => p.deger > 0);
              return (
                <div key={c.anahtar} className="relative flex h-full min-w-0 flex-1 flex-col justify-end" onMouseEnter={() => setUst(i)}>
                  <span className={cn("pointer-events-none absolute inset-y-0 -inset-x-[1px] rounded-[7px] bg-white/[0.04] opacity-0 transition-opacity", ust === i && "opacity-100")} />
                  {t > 0 ? (
                    <motion.div initial={{ height: 0 }} animate={{ height: `${tepe ? Math.max(2, (t / tepe) * 100) : 0}%` }} transition={{ delay: Math.min(i * 0.015, 0.4), duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                      className={cn("relative mx-auto flex w-full max-w-[44px] flex-col-reverse gap-[2px] transition-opacity duration-200", ust !== null && ust !== i && "opacity-40")}>
                      {dolu.map((p, j) => (
                        <div key={p.ad} style={{ flexGrow: p.deger, background: `linear-gradient(180deg, ${p.renk}, ${p.renk}b0)`, boxShadow: ust === i ? `0 0 16px ${p.renk}50` : undefined }}
                          className={cn("min-h-[2px]", j === dolu.length - 1 && "rounded-t-[6px]", j === 0 && "rounded-b-[2px]")} />
                      ))}
                    </motion.div>
                  ) : <span className="mx-auto h-[2px] w-full max-w-[44px] rounded-full bg-white/[0.06]" />}
                </div>
              );
            })}
          </div>
          <AnimatePresence>
            {ust !== null && !bos && (
              <motion.div key="ipucu" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
                className="pointer-events-none absolute z-10 min-w-[170px] rounded-[16px] bg-[#17181c]/95 px-3.5 py-3 text-[12.5px] ring-1 ring-white/[0.12] backdrop-blur-xl"
                style={{ left: `clamp(0px, calc(${((ust + 0.5) / veri.length) * 100}% - 85px), calc(100% - 170px))`, bottom: `calc(${tepe ? (toplamlar[ust] / tepe) * (yukseklik - 24) : 0}px + 34px)` }}>
                <p className="text-white/60">{veri[ust].uzunEtiket}</p>
                <p className="mb-1.5 mt-0.5 text-[15px] font-semibold tabular-nums text-white">{toplamlar[ust].toLocaleString("tr-TR")} {birim}</p>
                {veri[ust].parcalar.length > 1 && veri[ust].parcalar.map((p) => (
                  <p key={p.ad} className="mt-1 flex items-center justify-between gap-4 text-white/70">
                    <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-[3px]" style={{ background: p.renk }} />{p.ad}</span>
                    <span className="tabular-nums text-white">{p.deger.toLocaleString("tr-TR")}</span>
                  </p>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <div className={cn("absolute inset-x-0 bottom-0 flex h-5", bosluk)}>
            {veri.map((c, i) => {
              const dar = i % Math.max(1, Math.ceil(veri.length / 4)) === 0;
              return (
                <span key={c.anahtar} className={cn("relative min-w-0 flex-1 text-[11px] transition-colors", ust === i ? "text-white" : "text-white/45")}>
                  {/* Etiket çubuk genişliğinden taşabilir; ortalanmış ve kırpılmadan gösterilir */}
                  <span className={cn("absolute left-1/2 -translate-x-1/2 whitespace-nowrap", dar ? "inline" : "hidden", i % etiketAdim === 0 ? "sm:inline" : "sm:hidden")}>{c.etiket}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Yatay sıralama çubukları (model / anahtar kırılımı). Tek seri, etiketler doğrudan. */
export function SiraCubuklari({ satirlar, birim, bos = "Veri yok", renk = "#55d6fd" }: { satirlar: { ad: string; deger: number; alt?: string; onEk?: React.ReactNode }[]; birim: string; bos?: string; renk?: string }) {
  const tepe = Math.max(1, ...satirlar.map((s) => s.deger));
  const toplam = satirlar.reduce((t, s) => t + s.deger, 0);
  if (!satirlar.length) return <p className="flex h-[120px] items-center justify-center text-center text-[13px] text-white/55">{bos}</p>;
  return (
    <ul className="space-y-3.5">
      {satirlar.map((s, i) => (
        <li key={s.ad}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-[13px]">
            <span className="flex min-w-0 items-center gap-2.5 font-medium text-white">{s.onEk}<span className="truncate">{s.ad}</span></span>
            <span className="shrink-0 whitespace-nowrap tabular-nums text-white/60"><span className="font-semibold text-white">{s.deger.toLocaleString("tr-TR")}</span> {birim}{toplam > 0 && <span className="text-white/45"> · %{Math.round((s.deger / toplam) * 100)}</span>}{s.alt && <span> · {s.alt}</span>}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(2, (s.deger / tepe) * 100)}%` }} transition={{ delay: i * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${renk}80, ${renk})` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Günlük kovalar. */
export function gunKovalari(gun: number) {
  const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
  return Array.from({ length: gun }, (_, i) => {
    const d = new Date(bugun.getTime() - (gun - 1 - i) * 86400_000);
    return { bas: d.getTime(), bit: d.getTime() + 86400_000, etiket: d.toLocaleDateString("tr-TR", { day: "numeric", month: "numeric" }), uzun: d.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" }) };
  });
}
