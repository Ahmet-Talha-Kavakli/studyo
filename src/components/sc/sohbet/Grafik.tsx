"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, Download, LineChart, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Yanıt içi etkileşimli grafik (Claude "inline charts"). Model ```grafik bloğuna JSON yazar:
 * { "tur": "cubuk" | "cizgi", "baslik": "...", "birim": "₺", "etiketler": ["Oca", ...], "seriler": [{ "ad": "2025", "degerler": [..] }] }
 * Kurallar (dataviz): tek eksen, sabit sıralı kategorik renkler (koyu zemin için doğrulanmış), ince işaretler,
 * 2 px boşluk, ≥2 seride gösterge, üzerine gelince değer kutusu, tablo görünümü.
 */
export type GrafikVeri = { tur?: "cubuk" | "cizgi"; baslik?: string; birim?: string; etiketler: string[]; seriler: { ad: string; degerler: number[] }[] };

/** Koyu zemin (#151517) için doğrulanmış kategorik sıra: mavi, turuncu, su yeşili, sarı, pembe, yeşil. */
const RENK = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300"];
const Y = 240, UST = 12, ALT = 28, SOL_MIN = 36;

export function grafikCoz(kod: string): GrafikVeri | null {
  try {
    const j = JSON.parse(kod) as GrafikVeri;
    if (!Array.isArray(j.etiketler) || !Array.isArray(j.seriler) || !j.etiketler.length || !j.seriler.length) return null;
    const n = j.etiketler.length;
    const seriler = j.seriler.slice(0, RENK.length).map((s) => ({ ad: String(s.ad ?? ""), degerler: Array.from({ length: n }, (_, i) => Number(s.degerler?.[i] ?? NaN)) }));
    if (seriler.every((s) => s.degerler.every((d) => !Number.isFinite(d)))) return null;
    return { tur: j.tur === "cizgi" ? "cizgi" : "cubuk", baslik: j.baslik ? String(j.baslik) : undefined, birim: j.birim ? String(j.birim) : undefined, etiketler: j.etiketler.slice(0, 60).map(String), seriler };
  } catch { return null; }
}

const bicim = (v: number, birim?: string) => {
  const s = Math.abs(v) >= 1e6 ? `${(v / 1e6).toLocaleString("tr", { maximumFractionDigits: 1 })} mn` : Math.abs(v) >= 1e4 ? `${(v / 1e3).toLocaleString("tr", { maximumFractionDigits: 1 })} b` : v.toLocaleString("tr", { maximumFractionDigits: 2 });
  return birim ? (/^[₺$€£]/.test(birim) ? `${birim}${s}` : `${s} ${birim}`) : s;
};

/** Okunur eksen adımları (1, 2, 2.5, 5 × 10^n). */
function adimlar(min: number, max: number) {
  if (min === max) { max = min + 1; }
  const ham = (max - min) / 4;
  const us = Math.pow(10, Math.floor(Math.log10(ham)));
  const adim = [1, 2, 2.5, 5, 10].map((k) => k * us).find((k) => k >= ham) ?? 10 * us;
  const a = Math.floor(min / adim) * adim, b = Math.ceil(max / adim) * adim;
  const l: number[] = []; for (let v = a; v <= b + adim / 2; v += adim) l.push(Number(v.toFixed(10)));
  return l;
}

export function Grafik({ veri }: { veri: GrafikVeri }) {
  const kap = useRef<HTMLDivElement>(null);
  const [gen, setGen] = useState(640);
  const [tur, setTur] = useState(veri.tur ?? "cubuk");
  const [tablo, setTablo] = useState(false);
  const [uzerinde, setUzerinde] = useState<number | null>(null);
  useEffect(() => {
    const el = kap.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setGen(Math.max(260, e.contentRect.width)));
    ro.observe(el); return () => ro.disconnect();
  }, [tablo]);

  const { etiketler, seriler, birim } = veri;
  const n = etiketler.length;
  const tum = seriler.flatMap((s) => s.degerler.filter(Number.isFinite));
  const tik = useMemo(() => adimlar(Math.min(0, ...tum), Math.max(0, ...tum)), [tum.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
  const ymin = tik[0], ymax = tik[tik.length - 1];
  const sol = Math.max(SOL_MIN, ...tik.map((t) => bicim(t, birim).length * 6.4 + 10));
  const cizimG = gen - sol - 8, cizimY = Y - UST - ALT;
  const yKon = (v: number) => UST + cizimY - ((v - ymin) / (ymax - ymin)) * cizimY;
  const bant = cizimG / n;
  const xOrta = (i: number) => sol + bant * i + bant / 2;
  const etiketAdim = Math.ceil(n / Math.max(1, Math.floor(cizimG / 64)));

  /* Çubuk geometrisi: grup genişliği bandın %72'si, çubuklar arası 2 px. */
  const grup = Math.min(bant * 0.72, 30 * seriler.length + 2 * (seriler.length - 1));
  const cubukG = Math.max(2, (grup - 2 * (seriler.length - 1)) / seriler.length);

  const csv = () => {
    const satir = [["", ...seriler.map((s) => s.ad)], ...etiketler.map((e, i) => [e, ...seriler.map((s) => (Number.isFinite(s.degerler[i]) ? String(s.degerler[i]) : ""))])];
    const u = URL.createObjectURL(new Blob(["﻿" + satir.map((r) => r.map((h) => `"${h.replace(/"/g, '""')}"`).join(";")).join("\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = u; a.download = `${(veri.baslik ?? "grafik").replace(/[^\p{L}\p{N}]+/gu, "-").toLocaleLowerCase("tr")}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(u), 800);
  };

  const ipucuX = uzerinde !== null ? xOrta(uzerinde) : 0;
  const dugme = (aktif: boolean) => cn("flex h-7 items-center gap-1 rounded-md px-2 text-[12px] transition-colors", aktif ? "bg-white/[0.09] text-[var(--sc-metin)]" : "text-[var(--sc-metin-3)] hover:bg-white/[0.05] hover:text-[var(--sc-metin)]");

  return (
    <figure className="not-prose my-4 rounded-[14px] bg-[#151517] p-3.5 font-sans ring-1 ring-inset ring-white/[0.08]">
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {veri.baslik && <figcaption className="min-w-0 flex-1 text-[14px] font-semibold text-[var(--sc-metin)]">{veri.baslik}</figcaption>}
        <div className="ml-auto flex items-center gap-0.5">
          <button onClick={() => { setTur("cubuk"); setTablo(false); }} aria-pressed={!tablo && tur === "cubuk"} className={dugme(!tablo && tur === "cubuk")} title="Çubuk"><BarChart3 className="h-3.5 w-3.5" /><span className="max-sm:sr-only">Çubuk</span></button>
          <button onClick={() => { setTur("cizgi"); setTablo(false); }} aria-pressed={!tablo && tur === "cizgi"} className={dugme(!tablo && tur === "cizgi")} title="Çizgi"><LineChart className="h-3.5 w-3.5" /><span className="max-sm:sr-only">Çizgi</span></button>
          <button onClick={() => setTablo(true)} aria-pressed={tablo} className={dugme(tablo)} title="Tablo"><Table2 className="h-3.5 w-3.5" /><span className="max-sm:sr-only">Tablo</span></button>
          <button onClick={csv} className={dugme(false)} aria-label="CSV indir" title="CSV indir"><Download className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      {seriler.length > 1 && !tablo && (
        <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-[var(--sc-metin-2)]">
          {seriler.map((s, k) => <span key={k} className="flex items-center gap-1.5"><span className={cn("shrink-0", tur === "cizgi" ? "h-[3px] w-3.5 rounded-full" : "h-2.5 w-2.5 rounded-[3px]")} style={{ background: RENK[k] }} />{s.ad}</span>)}
        </div>
      )}
      {tablo ? (
        <div className="overflow-x-auto [scrollbar-width:thin]">
          <table className="w-full border-collapse text-[13px]">
            <thead><tr className="text-left text-[var(--sc-metin-3)]"><th className="px-2.5 py-1.5 font-medium" />{seriler.map((s, k) => <th key={k} className="px-2.5 py-1.5 text-right font-medium">{s.ad || "Değer"}</th>)}</tr></thead>
            <tbody>{etiketler.map((e, i) => <tr key={i} className="border-t border-white/[0.06]"><td className="px-2.5 py-1.5 text-[var(--sc-metin-2)]">{e}</td>{seriler.map((s, k) => <td key={k} className="px-2.5 py-1.5 text-right tabular-nums text-[var(--sc-metin)]">{Number.isFinite(s.degerler[i]) ? bicim(s.degerler[i], birim) : "—"}</td>)}</tr>)}</tbody>
          </table>
        </div>
      ) : (
        <div ref={kap} className="relative" onMouseLeave={() => setUzerinde(null)}>
          <svg width={gen} height={Y} role="img" aria-label={`${veri.baslik ?? "Grafik"}: ${seriler.map((s) => s.ad).join(", ")}`} className="block overflow-visible">
            {tik.map((t) => (
              <g key={t}>
                <line x1={sol} x2={gen - 8} y1={yKon(t)} y2={yKon(t)} stroke={t === 0 ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.06)"} />
                <text x={sol - 8} y={yKon(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="#8e8e95" className="tabular-nums">{bicim(t, birim)}</text>
              </g>
            ))}
            {etiketler.map((e, i) => i % etiketAdim === 0 && (
              <text key={i} x={xOrta(i)} y={Y - 8} textAnchor="middle" fontSize={11} fill="#8e8e95">{e.length > 12 ? e.slice(0, 11) + "…" : e}</text>
            ))}
            {uzerinde !== null && <rect x={sol + bant * uzerinde} y={UST} width={bant} height={cizimY} fill="rgba(255,255,255,0.035)" />}
            {tur === "cubuk" ? seriler.map((s, k) => s.degerler.map((d, i) => {
              if (!Number.isFinite(d)) return null;
              const x = xOrta(i) - grup / 2 + k * (cubukG + 2);
              const y1 = yKon(Math.max(d, 0)), y2 = yKon(Math.min(d, 0));
              const h = Math.max(1, y2 - y1), r = Math.min(4, cubukG / 2, h);
              /* Yalnızca veri ucu yuvarlak; taban düz. */
              const yol = d >= 0
                ? `M${x},${y2} V${y1 + r} Q${x},${y1} ${x + r},${y1} H${x + cubukG - r} Q${x + cubukG},${y1} ${x + cubukG},${y1 + r} V${y2} Z`
                : `M${x},${y1} V${y2 - r} Q${x},${y2} ${x + r},${y2} H${x + cubukG - r} Q${x + cubukG},${y2} ${x + cubukG},${y2 - r} V${y1} Z`;
              return <path key={`${k}-${i}`} d={yol} fill={RENK[k]} opacity={uzerinde === null || uzerinde === i ? 1 : 0.55} />;
            })) : seriler.map((s, k) => {
              const nokta = s.degerler.map((d, i) => (Number.isFinite(d) ? `${xOrta(i)},${yKon(d)}` : null));
              const parca: string[][] = [[]]; nokta.forEach((p) => { if (p) parca[parca.length - 1].push(p); else parca.push([]); });
              return (
                <g key={k}>
                  {parca.filter((p) => p.length).map((p, j) => <polyline key={j} points={p.join(" ")} fill="none" stroke={RENK[k]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />)}
                  {uzerinde !== null && Number.isFinite(s.degerler[uzerinde]) && <circle cx={xOrta(uzerinde)} cy={yKon(s.degerler[uzerinde])} r={4.5} fill={RENK[k]} stroke="#151517" strokeWidth={2} />}
                  {n === 1 && Number.isFinite(s.degerler[0]) && <circle cx={xOrta(0)} cy={yKon(s.degerler[0])} r={4} fill={RENK[k]} />}
                </g>
              );
            })}
            {tur === "cizgi" && uzerinde !== null && <line x1={ipucuX} x2={ipucuX} y1={UST} y2={UST + cizimY} stroke="rgba(255,255,255,0.18)" strokeDasharray="3 3" />}
            {/* Geniş tıklama/üzerine gelme alanları (işaretten büyük). */}
            {etiketler.map((_, i) => <rect key={i} x={sol + bant * i} y={UST} width={bant} height={cizimY + ALT} fill="transparent" onMouseEnter={() => setUzerinde(i)} onTouchStart={() => setUzerinde(i)} />)}
          </svg>
          {uzerinde !== null && (
            <div className="pointer-events-none absolute top-1 z-10 min-w-[140px] rounded-[10px] bg-[#1f1f23] px-3 py-2 text-[12.5px] ring-1 ring-inset ring-white/[0.1]"
              style={ipucuX > gen / 2 ? { right: gen - ipucuX + 12 } : { left: ipucuX + 12 }}>
              <p className="mb-1 font-medium text-[var(--sc-metin)]">{etiketler[uzerinde]}</p>
              {seriler.map((s, k) => (
                <p key={k} className="flex items-center gap-2 text-[var(--sc-metin-2)]">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: RENK[k] }} />
                  <span className="min-w-0 flex-1 truncate">{s.ad || "Değer"}</span>
                  <span className="tabular-nums text-[var(--sc-metin)]">{Number.isFinite(s.degerler[uzerinde]) ? bicim(s.degerler[uzerinde], birim) : "—"}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </figure>
  );
}
