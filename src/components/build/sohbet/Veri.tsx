"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowDown, ArrowUp, BarChart3, ChevronDown, ChevronLeft, ChevronRight, Code2, Copy, Check, Download, FileSpreadsheet, ImageDown, LineChart, Loader2, PieChart, ScatterChart, Search, Sigma, Table2, AreaChart } from "lucide-react";
import { api } from "@/lib/build/istemci";
import type { AnalizGrafik, AnalizSonucu, AnalizTablo, GrafikTur, Hucre } from "@/lib/build/sohbetTipler";
import { cn } from "@/lib/utils";
import { indir, sayi } from "./ortak";

/** Kategorik renkler (koyu zemin #121315 için doğrulandı: CVD ve normal görüş ayrımı, 3:1 karşıtlık). Sırayla atanır. */
const RENK = ["#1898c6", "#d95926", "#199e70", "#c98500", "#d55181", "#9085e9"];
const TURLER: { id: GrafikTur; ad: string; I: typeof BarChart3 }[] = [
  { id: "cubuk", ad: "Çubuk", I: BarChart3 }, { id: "cizgi", ad: "Çizgi", I: LineChart }, { id: "alan", ad: "Alan", I: AreaChart }, { id: "pasta", ad: "Pasta", I: PieChart }, { id: "sacilim", ad: "Saçılım", I: ScatterChart },
];
const kisa = (n: number) => { const a = Math.abs(n); return a >= 1e9 ? `${(n / 1e9).toFixed(1).replace(".", ",")} Mr` : a >= 1e6 ? `${(n / 1e6).toFixed(1).replace(".", ",")} Mn` : a >= 1e4 ? `${(n / 1e3).toFixed(0)} bin` : new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(n); };
const tam = (n: number) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 4 }).format(n);
function guzelAdim(maks: number, min: number) {
  const aralik = maks - min || Math.abs(maks) || 1;
  const kaba = aralik / 4, us = 10 ** Math.floor(Math.log10(kaba)), o = kaba / us;
  const adim = (o >= 5 ? 10 : o >= 2 ? 5 : o >= 1 ? 2 : 1) * us;
  const alt = Math.floor(min / adim) * adim, ust = Math.ceil(maks / adim) * adim;
  const l: number[] = [];
  for (let v = alt; v <= ust + adim / 2; v += adim) l.push(Math.round(v * 1e6) / 1e6);
  return { alt, ust: ust === alt ? alt + adim : ust, l };
}
const csvHucre = (v: Hucre) => { const s = v === null ? "" : String(v); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csvYap = (sutunlar: string[], satirlar: Hucre[][]) => `﻿${[sutunlar, ...satirlar].map((r) => r.map(csvHucre).join(";")).join("\r\n")}`;

/** SVG grafik: çubuk (gruplu), çizgi, alan, pasta, saçılım; üzerine gelince değer; tür değiştirme, PNG ve CSV. */
export function Grafik({ g }: { g: AnalizGrafik }) {
  const [tur, setTur] = useState<GrafikTur>(g.tur);
  const [ip, setIp] = useState<{ x: number; y: number; baslik: string; satirlar: { ad: string; deger: number; renk: string }[] } | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const kap = useRef<HTMLDivElement>(null);
  // Dar ekranda çizim alanı küçülür ki yazılar okunur boyutta kalsın.
  const [W, setW] = useState(640);
  useEffect(() => { const k = kap.current; if (!k) return; const o = new ResizeObserver(() => setW(Math.max(340, Math.min(640, Math.round(k.clientWidth))))); o.observe(k); return () => o.disconnect(); }, []);
  const H = W < 480 ? (tur === "pasta" ? 290 : 260) : 300, P = { l: 48, r: 12, t: 14, b: 44 };
  const seriler = g.seriler.slice(0, RENK.length);
  const n = g.etiketler.length;
  const tum = seriler.flatMap((s) => s.veriler);
  const olcek = guzelAdim(Math.max(0, ...tum), Math.min(0, ...tum));
  const y = (v: number) => P.t + (H - P.t - P.b) * (1 - (v - olcek.alt) / (olcek.ust - olcek.alt));
  const genis = (W - P.l - P.r) / Math.max(1, n);
  const x = (i: number) => P.l + genis * (i + 0.5);
  const etiketAdim = Math.max(1, Math.ceil(n / (W < 480 ? 5 : 10)));
  const pngIndir = async () => {
    const s = svg.current;
    if (!s) return;
    const k = s.cloneNode(true) as SVGSVGElement;
    k.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(k)], { type: "image/svg+xml" }));
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = W * 2; c.height = H * 2;
      const ctx = c.getContext("2d")!; ctx.fillStyle = "#121315"; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
      const a = document.createElement("a"); a.href = c.toDataURL("image/png"); a.download = `${(g.baslik || "grafik").replace(/[^\p{L}\p{N}]+/gu, "-")}.png`; a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };
  const isaret = (e: React.MouseEvent, i: number) => {
    const r = svg.current!.getBoundingClientRect();
    setIp({ x: e.clientX - r.left, y: e.clientY - r.top, baslik: g.etiketler[i] ?? "", satirlar: seriler.map((s, k) => ({ ad: s.ad, deger: s.veriler[i] ?? 0, renk: RENK[k] })) });
  };
  const pasta = useMemo(() => {
    const v = (seriler[0]?.veriler ?? []).map((d, i) => ({ d: Math.max(0, d), i }));
    const top = v.reduce((t, a) => t + a.d, 0) || 1;
    const sirali = [...v].sort((a, b) => b.d - a.d);
    const ana = sirali.slice(0, 5), diger = sirali.slice(5).reduce((t, a) => t + a.d, 0);
    const dilimler = [...ana.map((a, k) => ({ ad: g.etiketler[a.i] ?? "", d: a.d, renk: RENK[k] })), ...(diger > 0 ? [{ ad: "Diğer", d: diger, renk: "#5b5f66" }] : [])];
    let aci = -Math.PI / 2;
    return dilimler.map((s) => { const a0 = aci, a1 = aci + (s.d / top) * Math.PI * 2; aci = a1; return { ...s, a0, a1, oran: s.d / top }; });
  }, [seriler, g.etiketler]);
  const yay = (a0: number, a1: number) => {
    const cx = W < 480 ? W / 2 : 170, cy = W < 480 ? 105 : H / 2, R = W < 480 ? 92 : 112, r = W < 480 ? 52 : 62;
    const p = (a: number, rr: number) => `${cx + rr * Math.cos(a)} ${cy + rr * Math.sin(a)}`;
    const buyuk = a1 - a0 > Math.PI ? 1 : 0;
    return `M ${p(a0, R)} A ${R} ${R} 0 ${buyuk} 1 ${p(a1, R)} L ${p(a1, r)} A ${r} ${r} 0 ${buyuk} 0 ${p(a0, r)} Z`;
  };

  return (
    <div className="rounded-[16px] bg-[#121315] p-3 ring-1 ring-inset ring-white/[0.07]">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <p className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-white">{g.baslik || seriler.map((s) => s.ad).join(", ")}</p>
        <div className="flex rounded-full bg-white/[0.06] p-0.5">
          {TURLER.map((t) => <button key={t.id} type="button" title={t.ad} aria-label={t.ad} aria-pressed={tur === t.id} onClick={() => { setTur(t.id); setIp(null); }} className={cn("flex h-7 w-7 items-center justify-center rounded-full transition-colors", tur === t.id ? "bg-white text-black" : "text-white/55 hover:text-white")}><t.I className="h-3.5 w-3.5" /></button>)}
        </div>
        <button type="button" onClick={pngIndir} title="PNG indir" aria-label="PNG indir" className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"><ImageDown className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => indir(`${g.baslik || "grafik"}.csv`, csvYap([g.xAd || "Etiket", ...seriler.map((s) => s.ad)], g.etiketler.map((e, i) => [e, ...seriler.map((s) => s.veriler[i] ?? null)])), "text/csv;charset=utf-8")} title="Verisini CSV indir" aria-label="CSV indir" className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"><Download className="h-3.5 w-3.5" /></button>
      </div>
      {seriler.length > 1 && tur !== "pasta" && (
        <div className="mb-1.5 flex flex-wrap gap-x-3.5 gap-y-1 px-1">{seriler.map((s, k) => <span key={s.ad} className="flex items-center gap-1.5 text-[12px] text-white/70"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: RENK[k] }} />{s.ad}</span>)}</div>
      )}
      <div ref={kap} className="relative" onMouseLeave={() => setIp(null)}>
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={g.baslik || "Grafik"} fontFamily="-apple-system, Segoe UI, Roboto, sans-serif">
          {tur === "pasta" ? (
            <>
              {pasta.map((s, k) => <path key={k} d={yay(s.a0, Math.max(s.a0 + 0.001, s.a1 - 0.012))} fill={s.renk} stroke="#121315" strokeWidth={2} onMouseMove={(e) => { const r = svg.current!.getBoundingClientRect(); setIp({ x: e.clientX - r.left, y: e.clientY - r.top, baslik: s.ad, satirlar: [{ ad: `yüzde ${String(Math.round(s.oran * 1000) / 10).replace(".", ",")}`, deger: s.d, renk: s.renk }] }); }} />)}
              {pasta.map((s, k) => (
                <g key={`e${k}`} transform={W < 480 ? `translate(${12 + (k % 2) * (W / 2)} ${214 + Math.floor(k / 2) * 20})` : `translate(330 ${48 + k * 34})`}>
                  <rect width={11} height={11} rx={3} fill={s.renk} y={-9} />
                  <text x={20} fontSize={13} fill="rgba(255,255,255,0.85)">{s.ad.slice(0, W < 480 ? 10 : 26)}</text>
                  <text x={W < 480 ? W / 2 - 24 : 290} textAnchor="end" fontSize={13} fill="rgba(255,255,255,0.6)">{`yüzde ${String(Math.round(s.oran * 1000) / 10).replace(".", ",")}`}</text>
                </g>
              ))}
            </>
          ) : (
            <>
              {olcek.l.map((v) => <g key={v}><line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.07)" /><text x={P.l - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill="rgba(255,255,255,0.45)">{kisa(v)}</text></g>)}
              {olcek.alt < 0 && <line x1={P.l} x2={W - P.r} y1={y(0)} y2={y(0)} stroke="rgba(255,255,255,0.25)" />}
              {g.etiketler.map((e, i) => i % etiketAdim === 0 && <text key={i} x={x(i)} y={H - P.b + 18} textAnchor="middle" fontSize={11} fill="rgba(255,255,255,0.5)">{e.length > 12 ? `${e.slice(0, 11)}…` : e}</text>)}
              {g.xAd && <text x={(W + P.l) / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="rgba(255,255,255,0.4)">{g.xAd}</text>}
              {tur === "cubuk" && seriler.map((s, k) => {
                const bw = Math.max(2, (genis * 0.72) / seriler.length - 2);
                return s.veriler.map((v, i) => {
                  const bx = x(i) - (genis * 0.72) / 2 + k * (bw + 2), y0 = y(Math.max(0, olcek.alt)), yv = y(v);
                  const h = Math.abs(y0 - yv), ust = Math.min(y0, yv), r = Math.min(4, bw / 2, h);
                  return <path key={`${k}-${i}`} d={v >= 0 ? `M${bx} ${y0} V${ust + r} Q${bx} ${ust} ${bx + r} ${ust} H${bx + bw - r} Q${bx + bw} ${ust} ${bx + bw} ${ust + r} V${y0} Z` : `M${bx} ${y0} V${ust + h - r} Q${bx} ${ust + h} ${bx + r} ${ust + h} H${bx + bw - r} Q${bx + bw} ${ust + h} ${bx + bw} ${ust + h - r} V${y0} Z`} fill={RENK[k]} opacity={ip && ip.baslik !== g.etiketler[i] ? 0.55 : 1} />;
                });
              })}
              {(tur === "cizgi" || tur === "alan") && seriler.map((s, k) => {
                const d = s.veriler.map((v, i) => `${i ? "L" : "M"}${x(i)} ${y(v)}`).join(" ");
                return <g key={k}>{tur === "alan" && <path d={`${d} L${x(s.veriler.length - 1)} ${y(Math.max(0, olcek.alt))} L${x(0)} ${y(Math.max(0, olcek.alt))} Z`} fill={RENK[k]} opacity={0.18} />}<path d={d} fill="none" stroke={RENK[k]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />{n <= 40 && s.veriler.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={4} fill={RENK[k]} stroke="#121315" strokeWidth={2} />)}</g>;
              })}
              {tur === "sacilim" && seriler.map((s, k) => s.veriler.map((v, i) => <circle key={`${k}-${i}`} cx={x(i)} cy={y(v)} r={5} fill={RENK[k]} fillOpacity={0.85} stroke="#121315" strokeWidth={2} />))}
              {ip && (tur === "cizgi" || tur === "alan") && <line x1={x(g.etiketler.indexOf(ip.baslik))} x2={x(g.etiketler.indexOf(ip.baslik))} y1={P.t} y2={H - P.b} stroke="rgba(255,255,255,0.25)" strokeDasharray="3 3" />}
              {g.etiketler.map((_, i) => <rect key={`h${i}`} x={x(i) - genis / 2} y={P.t} width={genis} height={H - P.t - P.b} fill="transparent" onMouseMove={(e) => isaret(e, i)} />)}
            </>
          )}
        </svg>
        {ip && (
          <div className="pointer-events-none absolute z-10 min-w-[140px] rounded-[12px] bg-[#1c1d20] px-3 py-2 text-[12px] ring-1 ring-white/[0.12]" style={{ left: Math.min(ip.x + 12, 9999), top: ip.y + 12, transform: ip.x > 380 ? "translateX(calc(-100% - 24px))" : undefined }}>
            <p className="mb-1 font-semibold text-white">{ip.baslik}</p>
            {ip.satirlar.map((s) => <p key={s.ad} className="flex items-center gap-2 text-white/70"><span className="h-2 w-2 rounded-[2px]" style={{ background: s.renk }} /><span className="flex-1">{s.ad}</span><span className="tabular-nums text-white">{tam(s.deger)}</span></p>)}
          </div>
        )}
      </div>
    </div>
  );
}

/** Etkileşimli tablo: sırala, ara, sayfala, kopyala, CSV indir. */
export function EtkilesimliTablo({ t, ozet, sayfaBoyu = 12 }: { t: AnalizTablo; ozet?: { ad: string; tur: string; bos: number; benzersiz: number; min?: number; max?: number; ortalama?: number }[]; sayfaBoyu?: number }) {
  const [sirala, setSirala] = useState<{ j: number; azalan: boolean } | null>(null);
  const [ara, setAra] = useState("");
  const [sayfa, setSayfa] = useState(0);
  const [kopya, setKopya] = useState(false);
  const satirlar = useMemo(() => {
    const q = ara.trim().toLocaleLowerCase("tr");
    let l = q ? t.satirlar.filter((r) => r.some((h) => String(h ?? "").toLocaleLowerCase("tr").includes(q))) : t.satirlar;
    if (sirala) l = [...l].sort((a, b) => { const p = a[sirala.j], r = b[sirala.j]; const s = typeof p === "number" && typeof r === "number" ? p - r : String(p ?? "").localeCompare(String(r ?? ""), "tr", { numeric: true }); return sirala.azalan ? -s : s; });
    return l;
  }, [t.satirlar, ara, sirala]);
  useEffect(() => setSayfa(0), [ara, sirala]);
  const sayfaSay = Math.max(1, Math.ceil(satirlar.length / sayfaBoyu));
  const gorunen = satirlar.slice(sayfa * sayfaBoyu, (sayfa + 1) * sayfaBoyu);
  const sayisal = t.sutunlar.map((_, j) => t.satirlar.slice(0, 50).filter((r) => r[j] !== null && r[j] !== "").every((r) => typeof r[j] === "number"));
  return (
    <div className="overflow-hidden rounded-[16px] bg-[#121315] ring-1 ring-inset ring-white/[0.07]">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-3 py-2">
        <span className="flex min-w-0 items-center gap-1.5 text-[13px] font-semibold text-white"><Table2 className="h-3.5 w-3.5 shrink-0 text-[#8be6ff]" /><span className="truncate">{t.ad || "Tablo"}</span></span>
        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11.5px] tabular-nums text-white/55">{sayi(t.toplam ?? t.satirlar.length)} satır · {t.sutunlar.length} sütun</span>
        <label className="ml-auto flex h-8 w-[160px] items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 text-white/45 ring-1 ring-inset ring-white/[0.07] max-sm:w-full"><Search className="h-3.5 w-3.5" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Tabloda ara" className="h-full min-w-0 flex-1 bg-transparent text-[12.5px] text-white outline-none placeholder:text-white/40" /></label>
        <button type="button" title={kopya ? "Kopyalandı" : "Kopyala (tablolara yapışır)"} aria-label="Kopyala" onClick={() => { navigator.clipboard?.writeText([t.sutunlar, ...satirlar].map((r) => r.map((h) => h ?? "").join("\t")).join("\n")); setKopya(true); setTimeout(() => setKopya(false), 1300); }} className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white">{kopya ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>
        <button type="button" title="CSV indir" aria-label="CSV indir" onClick={() => indir(`${t.ad || "tablo"}.csv`, csvYap(t.sutunlar, satirlar), "text/csv;charset=utf-8")} className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"><Download className="h-3.5 w-3.5" /></button>
      </div>
      <div className="overflow-x-auto [scrollbar-width:thin]">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr>
              {t.sutunlar.map((s, j) => (
                <th key={j} className="whitespace-nowrap border-b border-white/[0.06] bg-white/[0.025] px-3 py-2 text-left font-semibold text-white/85">
                  <button type="button" onClick={() => setSirala((x) => (x?.j === j ? (x.azalan ? null : { j, azalan: true }) : { j, azalan: false }))} className={cn("inline-flex items-center gap-1 hover:text-white", sayisal[j] && "flex-row-reverse")}>
                    {s}{sirala?.j === j ? (sirala.azalan ? <ArrowDown className="h-3 w-3 text-[#8be6ff]" /> : <ArrowUp className="h-3 w-3 text-[#8be6ff]" />) : null}
                  </button>
                  {ozet?.[j] && <span className="block text-[10.5px] font-normal text-white/40">{ozet[j].tur === "sayi" ? `ort. ${kisa(ozet[j].ortalama ?? 0)} · ${kisa(ozet[j].min ?? 0)} ile ${kisa(ozet[j].max ?? 0)}` : `${sayi(ozet[j].benzersiz)} farklı`}{ozet[j].bos ? ` · ${ozet[j].bos} boş` : ""}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gorunen.map((r, i) => <tr key={i} className="hover:bg-white/[0.025]">{t.sutunlar.map((_, j) => <td key={j} className={cn("max-w-[260px] truncate border-b border-white/[0.04] px-3 py-1.5 text-white/75", sayisal[j] && "text-right tabular-nums")} title={String(r[j] ?? "")}>{r[j] === null ? <span className="text-white/25">boş</span> : typeof r[j] === "number" ? tam(r[j] as number) : String(r[j])}</td>)}</tr>)}
            {!gorunen.length && <tr><td colSpan={t.sutunlar.length} className="px-3 py-6 text-center text-white/45">Eşleşen satır yok.</td></tr>}
          </tbody>
        </table>
      </div>
      {sayfaSay > 1 && (
        <div className="flex items-center justify-end gap-1 px-3 py-1.5 text-[12px] tabular-nums text-white/50">
          <button type="button" disabled={!sayfa} onClick={() => setSayfa(sayfa - 1)} aria-label="Önceki sayfa" className="flex h-7 w-7 items-center justify-center rounded-full enabled:hover:bg-white/[0.07] disabled:opacity-30"><ChevronLeft className="h-3.5 w-3.5" /></button>
          {sayfa + 1} / {sayfaSay}
          <button type="button" disabled={sayfa >= sayfaSay - 1} onClick={() => setSayfa(sayfa + 1)} aria-label="Sonraki sayfa" className="flex h-7 w-7 items-center justify-center rounded-full enabled:hover:bg-white/[0.07] disabled:opacity-30"><ChevronRight className="h-3.5 w-3.5" /></button>
        </div>
      )}
    </div>
  );
}

/** Veri analizi aracının kartı: açıklama, grafikler, sonuç tabloları, dönüş değeri, kod ve günlük (katlanır). */
export function AnalizKarti({ a }: { a: AnalizSonucu }) {
  const [kod, setKod] = useState(false);
  return (
    <div className="my-3 space-y-2.5">
      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><Sigma className="h-3.5 w-3.5" /></span>
        <span className="font-medium text-white">{a.aciklama || "Veri analizi"}</span>
        {a.kaynaklar?.length ? <span className="text-white/45">{a.kaynaklar.join(", ")}</span> : null}
        <button type="button" onClick={() => setKod((x) => !x)} className="ml-auto inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] text-white/55 hover:bg-white/[0.06] hover:text-white"><Code2 className="h-3.5 w-3.5" />{kod ? "Kodu gizle" : "Kodu gör"}<ChevronDown className={cn("h-3 w-3 transition-transform", kod && "rotate-180")} /></button>
      </div>
      <AnimatePresence initial={false}>
        {kod && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <pre className="sc-kod max-h-[300px] overflow-auto rounded-[12px] bg-[#0c0d0f] p-3 text-[12px] leading-relaxed text-white/80 ring-1 ring-inset ring-white/[0.07] [scrollbar-width:thin]">{a.kod}</pre>
            {a.loglar?.length ? <pre className="sc-kod mt-1.5 max-h-[160px] overflow-auto rounded-[12px] bg-[#0c0d0f] p-3 text-[12px] text-white/60 ring-1 ring-inset ring-white/[0.07]">{a.loglar.join("\n")}</pre> : null}
            {a.sure !== undefined && <p className="mt-1 text-[11.5px] text-white/35">Kum havuzunda {a.sure} ms sürdü</p>}
          </motion.div>
        )}
      </AnimatePresence>
      {a.hata && <p className="flex items-start gap-2 rounded-[14px] bg-amber-400/[0.07] px-3 py-2.5 text-[12.5px] text-amber-100 ring-1 ring-inset ring-amber-300/15"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />Kod hata verdi: {a.hata}</p>}
      {a.grafikler.map((g, i) => <Grafik key={i} g={g} />)}
      {a.tablolar.map((t, i) => <EtkilesimliTablo key={i} t={t} sayfaBoyu={8} />)}
      {a.deger && !a.tablolar.length && !a.grafikler.length && <pre className="sc-kod max-h-[240px] overflow-auto whitespace-pre-wrap rounded-[14px] bg-[#121315] p-3 text-[12.5px] text-white/80 ring-1 ring-inset ring-white/[0.07]">{a.deger}</pre>}
    </div>
  );
}

type VeriOnizleme = { ad: string; sutunlar: string[]; satirlar: Hucre[][]; toplam: number; kesildi?: boolean; ozet: { ad: string; tur: string; bos: number; benzersiz: number; min?: number; max?: number; ortalama?: number }[] };

/** Yüklenen CSV ya da Excel'in sohbetteki kartı: dosya, satır ve sütun sayısı; açınca etkileşimli tablo ve hızlı analizler. */
export function VeriKarti({ url, ad, sor }: { url: string; ad: string; sor?: (metin: string) => void }) {
  const [acik, setAcik] = useState(false);
  const [v, setV] = useState<VeriOnizleme[] | null>(null);
  const [hata, setHata] = useState("");
  const [sekme, setSekme] = useState(0);
  useEffect(() => {
    api<{ tablolar: VeriOnizleme[] }>(`/api/build/sohbet/veri?url=${encodeURIComponent(url)}&ad=${encodeURIComponent(ad)}`).then((x) => setV(x.tablolar)).catch((e) => setHata(e instanceof Error ? e.message : "Tablo okunamadı."));
  }, [url, ad]);
  const t = v?.[sekme];
  const HIZLI = ["Bu tablonun genel bir özetini çıkar", "Eksik ve hatalı değerleri bul", "En önemli eğilimi bir grafikle göster"];
  return (
    <div className="w-full max-w-[680px] text-left">
      <button type="button" onClick={() => setAcik((x) => !x)} className="flex w-full items-center gap-3 rounded-[16px] bg-white/[0.06] p-2.5 pr-3 ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.09]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[#1f9d5a]/[0.18] text-[#7fe0a8]"><FileSpreadsheet className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-white">{ad}</span><span className="block truncate text-[12px] text-white/50">{hata ? hata : !v ? "Okunuyor" : `${v.length > 1 ? `${v.length} sayfa · ` : ""}${sayi(v[0].toplam)} satır · ${v[0].sutunlar.length} sütun`}</span></span>
        {!v && !hata ? <Loader2 className="h-4 w-4 animate-spin text-white/40" /> : <span className="inline-flex h-8 items-center gap-1 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white">{acik ? "Gizle" : "Tabloyu aç"}<ChevronDown className={cn("h-3.5 w-3.5 transition-transform", acik && "rotate-180")} /></span>}
      </button>
      <AnimatePresence initial={false}>
        {acik && t && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-2 space-y-2">
              {v!.length > 1 && <div className="flex flex-wrap gap-1">{v!.map((x, i) => <button key={x.ad} type="button" onClick={() => setSekme(i)} className={cn("h-7 rounded-full px-3 text-[12px]", i === sekme ? "bg-white text-black" : "bg-white/[0.06] text-white/70 hover:text-white")}>{x.ad.split(" / ").pop()}</button>)}</div>}
              <EtkilesimliTablo t={{ ad: t.ad, sutunlar: t.sutunlar, satirlar: t.satirlar, toplam: t.toplam }} ozet={t.ozet} />
              {t.kesildi && <p className="text-[12px] text-white/45">Önizlemede ilk {sayi(t.satirlar.length)} satır gösteriliyor; analiz ilk 20.000 satırla çalışır.</p>}
              {sor && <div className="flex flex-wrap gap-1.5">{HIZLI.map((h) => <button key={h} type="button" onClick={() => sor(h)} className="h-8 rounded-full bg-[#55d6fd]/[0.1] px-3 text-[12.5px] text-[#8be6ff] ring-1 ring-inset ring-[#55d6fd]/20 hover:bg-[#55d6fd]/[0.16]">{h}</button>)}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
