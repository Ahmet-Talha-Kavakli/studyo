"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, ChartColumn, Clock3, Coins, Gauge, LayoutGrid, Loader2, Minus, Plus, ShieldAlert, Timer, Workflow } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Anahtar, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { DURUM_SINIF, Segment, SistemSekmeleri, sureYaz } from "./ortak";

/* Renkler: koyu yüzeyde (#121315) doğrulanmış kategorik çift (OKLCH açıklık bandı, renk körlüğü ayrımı ve karşıtlık geçti). */
const RENK = { basarili: "#1d9fc6", basarisiz: "#d9576f", diger: "rgba(255,255,255,0.28)", izgara: "rgba(255,255,255,0.06)", eksen: "rgba(255,255,255,0.42)" };
type Toplam = { calisma: number; basarili: number; basarisiz: number; sure: number; kredi: number; kazanilanDk: number; hataOrani: number; ortSure: number };
type Gun = { gun: string; calisma: number; basarili: number; basarisiz: number; sure: number; kredi: number; kazanilanDk: number };
type SistemSatir = Toplam & { id: string; ad: string; durum: "taslak" | "acik" | "duraklatildi"; dakika: number | null; etiketler: string[]; onceki: Toplam; seri: { gun: string; basarili: number; basarisiz: number; calisma: number }[] };
type Yanit = { aralik: { bas: string; son: string; gun: number }; onceki: { bas: string; son: string }; toplam: Toplam; oncekiToplam: Toplam; gunluk: Gun[]; sistemler: SistemSatir[] };
type Donem = "7" | "30" | "90" | "ozel";

const sayiYaz = (n: number, k = 0) => n.toLocaleString("tr-TR", { maximumFractionDigits: k });
const kisaSayi = (n: number) => (n >= 10_000 ? `${sayiYaz(n / 1000, 1)} B` : sayiYaz(n));
export function dakikaYaz(dk: number): string {
  const d = Math.round(dk);
  if (d < 60) return `${d} dk`;
  if (d < 1440) return `${Math.floor(d / 60)} sa${d % 60 ? ` ${d % 60} dk` : ""}`;
  return `${Math.floor(d / 1440)} gün${Math.floor((d % 1440) / 60) ? ` ${Math.floor((d % 1440) / 60)} sa` : ""}`;
}
const AY = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const gunKisa = (g: string) => `${Number(g.slice(8, 10))} ${AY[Number(g.slice(5, 7)) - 1]}`;
const gunUzun = (g: string) => new Date(`${g}T12:00:00Z`).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const bugunTr = () => new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);
const gunEkle = (g: string, n: number) => new Date(Date.parse(`${g}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
/** Temiz eksen adımları (0 dahil, 3 ya da 4 çizgi). */
function eksen(maks: number): number[] {
  if (maks <= 0) return [0, 1];
  const ham = maks / 3, us = 10 ** Math.floor(Math.log10(ham)), oran = ham / us;
  const adim = (oran <= 1 ? 1 : oran <= 2 ? 2 : oran <= 2.5 ? 2.5 : oran <= 5 ? 5 : 10) * us;
  const l: number[] = [];
  for (let v = 0; v <= maks + adim * 0.001; v += adim) l.push(Math.round(v * 100) / 100);
  if (l.at(-1)! < maks) l.push(Math.round((l.at(-1)! + adim) * 100) / 100);
  return l;
}

function useGenislik<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [en, setEn] = useState(0);
  useLayoutEffect(() => { const e = ref.current; if (!e) return; const o = new ResizeObserver(() => setEn(e.clientWidth)); o.observe(e); setEn(e.clientWidth); return () => o.disconnect(); }, []);
  return [ref, en];
}

/** İpucu kutusu: değer önde, seri adı arkada; satır başında serinin kısa çizgisi. */
function Ipucu({ x, y, en, baslik, satirlar }: { x: number; y: number; en: number; baslik: string; satirlar: { renk: string; ad: string; deger: string }[] }) {
  const sol = Math.min(Math.max(8, x - 90), en - 188);
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} style={{ left: sol, top: Math.max(0, y) }}
      className="bd-panel pointer-events-none absolute z-10 w-[180px] rounded-[12px] px-3 py-2.5">
      <p className="text-[11.5px] text-white/55">{baslik}</p>
      <div className="mt-1 space-y-1">{satirlar.map((s) => <div key={s.ad} className="flex items-center gap-2 text-[12px]"><span className="h-[2px] w-3 shrink-0 rounded-full" style={{ background: s.renk }} /><span className="font-semibold tabular-nums text-white">{s.deger}</span><span className="truncate text-white/55">{s.ad}</span></div>)}</div>
    </motion.div>
  );
}

/** Günlük çalışmalar: yığılmış sütun (başarılı, başarısız, diğer); sütun başına ipucu. */
function CalismaGrafigi({ l }: { l: Gun[] }) {
  const [ref, en] = useGenislik<HTMLDivElement>();
  const [ust, setUst] = useState<number | null>(null);
  const boy = 220, sol = 34, alt = 24, ustBos = 10;
  const maks = Math.max(0, ...l.map((g) => g.calisma));
  const t = eksen(maks), tepe = t.at(-1)!;
  const w = Math.max(0, en - sol - 4), bant = l.length ? w / l.length : 0, kalin = Math.max(2, Math.min(24, bant * 0.62));
  const y = (v: number) => ustBos + (boy - ustBos - alt) * (1 - v / tepe);
  const etiketAdim = Math.max(1, Math.ceil(l.length / Math.max(2, Math.floor(w / 64))));
  const g = ust !== null ? l[ust] : null;
  return (
    <div ref={ref} className="relative" onPointerLeave={() => setUst(null)}>
      {en > 0 && (
        <svg width={en} height={boy} role="img" aria-label="Günlük çalışma sayıları, başarılı, başarısız ve diğer">
          {t.map((v) => <g key={v}><line x1={sol} x2={en} y1={y(v)} y2={y(v)} stroke={RENK.izgara} strokeWidth={1} /><text x={sol - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill={RENK.eksen} className="tabular-nums">{kisaSayi(v)}</text></g>)}
          {l.map((d, i) => {
            const x = sol + i * bant + (bant - kalin) / 2;
            const diger = Math.max(0, d.calisma - d.basarili - d.basarisiz);
            const parca = [{ v: d.basarili, r: RENK.basarili }, { v: d.basarisiz, r: RENK.basarisiz }, { v: diger, r: RENK.diger }].filter((p) => p.v > 0);
            let taban = 0;
            return (
              <g key={d.gun} opacity={ust === null || ust === i ? 1 : 0.45} style={{ transition: "opacity 120ms" }}>
                {parca.map((p, j) => {
                  // Alttan üste: dilimler arasında 2 piksel yüzey boşluğu, yalnız en üst dilimin ucu yuvarlak.
                  const alt0 = y(taban) - (j > 0 ? 2 : 0), ust0 = Math.min(alt0 - 1, y(taban + p.v)); taban += p.v;
                  const r = j === parca.length - 1 ? Math.min(4, kalin / 2, alt0 - ust0) : 0;
                  return <path key={j} fill={p.r} d={`M${x},${alt0} L${x},${ust0 + r} Q${x},${ust0} ${x + r},${ust0} L${x + kalin - r},${ust0} Q${x + kalin},${ust0} ${x + kalin},${ust0 + r} L${x + kalin},${alt0} Z`} />;
                })}
                <rect x={sol + i * bant} y={0} width={bant} height={boy - alt} fill="transparent" onPointerEnter={() => setUst(i)} onFocus={() => setUst(i)} tabIndex={0} aria-label={`${gunKisa(d.gun)}: ${d.calisma} çalışma`} />
              </g>
            );
          })}
          <line x1={sol} x2={en} y1={y(0)} y2={y(0)} stroke="rgba(255,255,255,0.14)" strokeWidth={1} />
          {l.map((d, i) => (i % etiketAdim === 0 || i === l.length - 1) && (i === l.length - 1 || l.length - 1 - i >= etiketAdim) ? <text key={d.gun} x={i === l.length - 1 ? en - 2 : i === 0 ? sol : sol + i * bant + bant / 2} y={boy - 6} textAnchor={i === l.length - 1 ? "end" : i === 0 ? "start" : "middle"} fontSize={11} fill={RENK.eksen}>{gunKisa(d.gun)}</text> : null)}
        </svg>
      )}
      <AnimatePresence>{g && ust !== null && <Ipucu x={sol + ust * bant + bant / 2} y={8} en={en} baslik={gunUzun(g.gun)} satirlar={[{ renk: RENK.basarili, ad: "başarılı", deger: sayiYaz(g.basarili) }, { renk: RENK.basarisiz, ad: "başarısız", deger: sayiYaz(g.basarisiz) }, ...(g.calisma - g.basarili - g.basarisiz > 0 ? [{ renk: RENK.diger, ad: "durdu ya da iptal", deger: sayiYaz(g.calisma - g.basarili - g.basarisiz) }] : []), { renk: "transparent", ad: "toplam", deger: sayiYaz(g.calisma) }]} />}</AnimatePresence>
    </div>
  );
}

/** Tek seri alan grafiği (kazanılan süre ya da kredi): 2 piksel çizgi, yüzde 10 dolgu, imleç çizgisi. */
function AlanGrafigi({ l, deger, bicim, ad }: { l: Gun[]; deger: (g: Gun) => number; bicim: (v: number) => string; ad: string }) {
  const [ref, en] = useGenislik<HTMLDivElement>();
  const [ust, setUst] = useState<number | null>(null);
  const boy = 220, sol = 46, alt = 24, ustBos = 12;
  const v = l.map(deger);
  const t = eksen(Math.max(0, ...v)), tepe = t.at(-1)!;
  const w = Math.max(0, en - sol - 8);
  const x = (i: number) => sol + (l.length > 1 ? (i / (l.length - 1)) * w : w / 2);
  const y = (d: number) => ustBos + (boy - ustBos - alt) * (1 - d / tepe);
  const yol = v.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d).toFixed(1)}`).join(" ");
  const etiketAdim = Math.max(1, Math.ceil(l.length / Math.max(2, Math.floor(w / 64))));
  const sec = (e: React.PointerEvent<SVGRectElement>) => { const r = e.currentTarget.getBoundingClientRect(); const i = Math.round(((e.clientX - r.left) / Math.max(1, r.width)) * (l.length - 1)); setUst(Math.max(0, Math.min(l.length - 1, i))); };
  const sonI = v.length - 1;
  return (
    <div ref={ref} className="relative" onPointerLeave={() => setUst(null)}>
      {en > 0 && (
        <svg width={en} height={boy} role="img" aria-label={`Günlük ${ad}`}>
          {t.map((d) => <g key={d}><line x1={sol} x2={en} y1={y(d)} y2={y(d)} stroke={RENK.izgara} strokeWidth={1} /><text x={sol - 8} y={y(d) + 4} textAnchor="end" fontSize={11} fill={RENK.eksen}>{bicim(d)}</text></g>)}
          {l.length > 1 && <path d={`${yol} L${x(sonI)},${y(0)} L${x(0)},${y(0)} Z`} fill={RENK.basarili} opacity={0.1} />}
          <path d={yol} fill="none" stroke={RENK.basarili} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <line x1={sol} x2={en} y1={y(0)} y2={y(0)} stroke="rgba(255,255,255,0.14)" strokeWidth={1} />
          {sonI >= 0 && <circle cx={x(sonI)} cy={y(v[sonI])} r={4} fill={RENK.basarili} stroke="#121315" strokeWidth={2} />}
          {ust !== null && <><line x1={x(ust)} x2={x(ust)} y1={ustBos - 4} y2={y(0)} stroke="rgba(255,255,255,0.35)" strokeWidth={1} /><circle cx={x(ust)} cy={y(v[ust])} r={4.5} fill={RENK.basarili} stroke="#121315" strokeWidth={2} /></>}
          {l.map((d, i) => (i % etiketAdim === 0 || i === sonI) && (i === sonI || sonI - i >= etiketAdim) ? <text key={d.gun} x={x(i)} y={boy - 6} textAnchor={i === 0 ? "start" : i === sonI ? "end" : "middle"} fontSize={11} fill={RENK.eksen}>{gunKisa(d.gun)}</text> : null)}
          <rect x={sol} y={0} width={w} height={boy - alt} fill="transparent" onPointerMove={sec} onPointerDown={sec} />
        </svg>
      )}
      <AnimatePresence>{ust !== null && l[ust] && <Ipucu x={x(ust)} y={8} en={en} baslik={gunUzun(l[ust].gun)} satirlar={[{ renk: RENK.basarili, ad, deger: bicim(v[ust]) }]} />}</AnimatePresence>
    </div>
  );
}

/** Küçük eğilim çizgisi: soluk seri, son nokta vurgulu. */
function Kivrim({ l }: { l: number[] }) {
  const n = Math.min(30, l.length), k = Math.ceil(l.length / n);
  const b: number[] = [];
  for (let i = 0; i < l.length; i += k) b.push(l.slice(i, i + k).reduce((t, x) => t + x, 0));
  const m = Math.max(1, ...b), w = 84, h = 24;
  const p = b.map((v, i) => `${(b.length > 1 ? (i / (b.length - 1)) * (w - 6) : w / 2) + 3},${h - 3 - (v / m) * (h - 6)}`);
  const son = p.at(-1)?.split(",").map(Number);
  return <svg width={w} height={h} aria-hidden className="shrink-0"><polyline points={p.join(" ")} fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth={1.5} strokeLinejoin="round" />{son && <circle cx={son[0]} cy={son[1]} r={2.5} fill={RENK.basarili} />}</svg>;
}

/** Önceki döneme göre değişim (yön ve iyi mi kötü mü). */
function Degisim({ simdi, once, iyi, puan, kucuk }: { simdi: number; once: number; iyi: "artis" | "azalis" | "notr"; puan?: boolean; kucuk?: boolean }) {
  if (!once && !simdi) return <span className="text-[11.5px] text-white/35">Veri yok</span>;
  if (!once) return <span className={cn("text-white/45", kucuk ? "text-[11.5px]" : "text-[12px]")}>Önceki dönemde yoktu</span>;
  const fark = puan ? (simdi - once) * 100 : ((simdi - once) / once) * 100;
  const yon = Math.abs(fark) < 0.5 ? 0 : fark > 0 ? 1 : -1;
  const iyiMi = iyi === "notr" || yon === 0 ? null : (yon > 0) === (iyi === "artis");
  const I = yon > 0 ? ArrowUpRight : yon < 0 ? ArrowDownRight : Minus;
  const metin = yon === 0 ? "Değişmedi" : puan ? `${sayiYaz(Math.abs(fark), 1)} puan ${yon > 0 ? "artış" : "düşüş"}` : `yüzde ${sayiYaz(Math.abs(fark))} ${yon > 0 ? "artış" : "azalış"}`;
  return <span className={cn("inline-flex items-center gap-1 font-medium", kucuk ? "text-[11.5px]" : "text-[12px]", iyiMi === null ? "text-white/55" : iyiMi ? "text-emerald-300" : "text-rose-300")}><I className="h-3.5 w-3.5" />{metin}</span>;
}

function DakikaGir({ s, kaydet }: { s: SistemSatir; kaydet: (dk: number) => void }) {
  const [acik, setAcik] = useState(false);
  const [v, setV] = useState(String(s.dakika ?? ""));
  if (!acik) return s.dakika ? <button type="button" onClick={() => setAcik(true)} title="Çalışma başı dakikayı değiştir" className="text-[13px] tabular-nums text-white hover:underline">{dakikaYaz(s.kazanilanDk)}</button>
    : <button type="button" onClick={() => setAcik(true)} className="inline-flex h-7 items-center gap-1 rounded-full bg-[#55d6fd]/[0.1] px-2.5 text-[12px] font-medium text-[#8be6ff] hover:bg-[#55d6fd]/[0.16]"><Plus className="h-3 w-3" />Dakika gir</button>;
  return (
    <span className="inline-flex items-center gap-1">
      <input autoFocus type="number" min={0.5} max={10000} step={0.5} value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { kaydet(Number(v) || 0); setAcik(false); } if (e.key === "Escape") setAcik(false); }} onBlur={() => { if (v !== String(s.dakika ?? "")) kaydet(Number(v) || 0); setAcik(false); }} aria-label="Çalışma başı dakika" className={cn(alanSinif, "h-8 w-16 px-2 text-[12.5px]")} />
      <span className="text-[11.5px] text-white/45">dk</span>
    </span>
  );
}

/** İçgörüler panosu: dönem seçimi, özet kutuları, günlük grafikler ve sistem başına tablo. */
export function Icgoruler() {
  const [donem, setDonem] = useState<Donem>("30");
  const [bas, setBas] = useState(gunEkle(bugunTr(), -29));
  const [son, setSon] = useState(bugunTr());
  const [deneme, setDeneme] = useState(false);
  const [v, setV] = useState<Yanit | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [gorunum, setGorunum] = useState<"grafik" | "tablo">("grafik");
  const [ikinci, setIkinci] = useState<"sure" | "kredi">("sure");
  const istek = useRef(0);
  const sorgu = donem === "ozel" ? `bas=${bas}&son=${son}` : `gun=${donem}`;
  const yukle = () => {
    const n = ++istek.current;
    setYukleniyor(true);
    api<Yanit>(`/api/build/sistemler/icgoruler?${sorgu}${deneme ? "&deneme=1" : ""}`).then((x) => { if (n === istek.current) setV(x); }).catch(() => {}).finally(() => { if (n === istek.current) setYukleniyor(false); });
  };
  useEffect(yukle, [sorgu, deneme]); // eslint-disable-line react-hooks/exhaustive-deps
  const dakikaKaydet = async (id: string, dk: number) => { await api(`/api/build/sistemler/${id}`, { method: "PATCH", govde: { ayar: { dakika: dk || 0 } } }).catch(() => {}); yukle(); };
  const t = v?.toplam, o = v?.oncekiToplam;
  const eksikDk = (v?.sistemler ?? []).filter((s) => s.calisma > 0 && !s.dakika).length;
  const aktifler = useMemo(() => (v?.sistemler ?? []).filter((s) => s.calisma > 0 || s.onceki.calisma > 0), [v]);
  const pasif = (v?.sistemler.length ?? 0) - aktifler.length;
  const donemAdi = v ? `${gunKisa(v.aralik.bas)} ile ${gunKisa(v.aralik.son)} arası, ${v.aralik.gun} gün` : "";
  const kutular = t && o ? [
    { ad: "Çalışma", ikon: Workflow, deger: sayiYaz(t.calisma), alt: `${sayiYaz(t.basarili)} başarılı`, d: <Degisim simdi={t.calisma} once={o.calisma} iyi="notr" /> },
    { ad: "Hata oranı", ikon: ShieldAlert, deger: t.calisma ? `yüzde ${sayiYaz(t.hataOrani * 100, 1)}` : "Yok", alt: `${sayiYaz(t.basarisiz)} başarısız`, d: <Degisim simdi={t.hataOrani} once={o.hataOrani} iyi="azalis" puan /> },
    { ad: "Ortalama süre", ikon: Timer, deger: t.calisma ? sureYaz(t.ortSure) : "Yok", alt: "çalışma başına", d: <Degisim simdi={t.ortSure} once={o.ortSure} iyi="azalis" /> },
    { ad: "Harcanan kredi", ikon: Coins, deger: sayiYaz(t.kredi, 1), alt: t.calisma ? `çalışma başına ${sayiYaz(t.kredi / t.calisma, 2)}` : "kredi", d: <Degisim simdi={t.kredi} once={o.kredi} iyi="notr" /> },
    { ad: "Kazanılan süre", ikon: Clock3, deger: t.kazanilanDk ? dakikaYaz(t.kazanilanDk) : "Yok", alt: eksikDk ? `${eksikDk} sistemde dakika ayarlı değil` : "başarılı çalışmalardan", d: <Degisim simdi={t.kazanilanDk} once={o.kazanilanDk} iyi="artis" /> },
  ] : [];
  return (
    <div className="mx-auto max-w-[1320px] space-y-5 px-4 pb-24 pt-16 sm:px-6 md:pt-8">
      <SistemSekmeleri />
      <Kart ikon={ChartColumn} baslik="İçgörüler" alt={v ? `${donemAdi}; değişimler önceki eşit dönemle (${gunKisa(v.onceki.bas)} ile ${gunKisa(v.onceki.son)}) karşılaştırılır` : "Sistemlerinin çalışma, hata, süre, kredi ve kazandırdığı zaman"} govde="p-4 sm:p-5"
        sag={yukleniyor && v ? <Loader2 className="h-4 w-4 animate-spin text-white/40" /> : undefined}>
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <Segment id="icgoru-donem" kucuk deger={donem} set={setDonem} l={[{ id: "7", ad: "7 gün" }, { id: "30", ad: "30 gün" }, { id: "90", ad: "90 gün" }, { id: "ozel", ad: "Özel" }]} />
          <AnimatePresence initial={false}>
            {donem === "ozel" && (
              <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="flex items-center gap-2 overflow-hidden">
                <input type="date" value={bas} max={son} onChange={(e) => e.target.value && setBas(e.target.value)} aria-label="Başlangıç" className={cn(alanSinif, "h-9 w-[150px] text-[13px] [color-scheme:dark]")} />
                <span className="text-[12.5px] text-white/45">ile</span>
                <input type="date" value={son} min={bas} max={bugunTr()} onChange={(e) => e.target.value && setSon(e.target.value)} aria-label="Bitiş" className={cn(alanSinif, "h-9 w-[150px] text-[13px] [color-scheme:dark]")} />
              </motion.div>
            )}
          </AnimatePresence>
          <label className="flex h-9 items-center gap-2.5 rounded-full bg-white/[0.03] px-3.5 text-[12.5px] text-white/70 ring-1 ring-inset ring-white/[0.07] lg:ml-auto">Denemeleri de say<Anahtar acik={deneme} etiket="Denemeleri say" set={setDeneme} /></label>
        </div>
        {!v ? <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-[104px] animate-pulse rounded-[18px] bg-white/[0.03]" />)}</div> : (
          <dl className={cn("mt-4 grid grid-cols-2 gap-2 transition-opacity lg:grid-cols-5", yukleniyor && "opacity-60")}>
            {kutular.map((k, i) => { const I = k.ikon; return (
              <motion.div key={k.ad} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className={cn("rounded-[18px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.07]", i === 4 && "col-span-2 lg:col-span-1")}>
                <dt className="flex items-center gap-1.5 text-[12px] text-white/55"><I className="h-3.5 w-3.5" />{k.ad}</dt>
                <dd className="mt-1.5 truncate text-[22px] font-semibold tabular-nums tracking-[-0.02em] text-white">{k.deger}</dd>
                <dd className="mt-0.5 truncate text-[11.5px] text-white/45">{k.alt}</dd>
                <dd className="mt-1.5">{k.d}</dd>
              </motion.div>
            ); })}
          </dl>
        )}
      </Kart>

      {v && !t?.calisma && !o?.calisma ? (
        <div className="flex flex-col gap-3 rounded-[22px] bg-[#121315] p-4 ring-1 ring-inset ring-white/[0.07] sm:flex-row sm:items-center sm:p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#55d6fd]/[0.1] text-[#8be6ff]"><Gauge className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1"><p className="text-[14.5px] font-semibold text-white">Bu dönemde çalışma yok</p><p className="text-[12.5px] leading-relaxed text-white/50">Bir sistemi açıp tetik geldikçe grafikler dolar. Denemeleri görmek için Denemeleri de say anahtarını aç ya da dönemi genişlet.</p></div>
          <div className="flex shrink-0 gap-2"><Link href="/panel/build/sistemler" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><Workflow className="h-3.5 w-3.5" />Sistemlerim</Link><Link href="/panel/build/sistemler#hazir" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[13px] text-white/85 hover:bg-white/[0.12]"><LayoutGrid className="h-3.5 w-3.5" />Hazır sistemler</Link></div>
        </div>
      ) : v && (<>
        <div className={cn("grid gap-4 transition-opacity lg:grid-cols-2", yukleniyor && "opacity-60")}>
          <Kart ikon={Workflow} baslik="Günlük çalışmalar" alt="Başarılı, başarısız ve durdu ya da iptal" govde="p-4 sm:p-5"
            sag={<Segment id="icgoru-gorunum" kucuk deger={gorunum} set={setGorunum} l={[{ id: "grafik", ad: "Grafik" }, { id: "tablo", ad: "Tablo" }]} />}>
            {gorunum === "grafik" ? (<>
              <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-white/65">{[["Başarılı", RENK.basarili], ["Başarısız", RENK.basarisiz], ["Durdu ya da iptal", RENK.diger]].map(([a, r]) => <span key={a} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: r }} />{a}</span>)}</div>
              <CalismaGrafigi l={v.gunluk} />
            </>) : (
              <div className="max-h-[262px] overflow-y-auto rounded-[14px] ring-1 ring-inset ring-white/[0.07] [scrollbar-width:thin]">
                <table className="w-full text-left text-[12.5px]">
                  <thead className="sticky top-0 bg-[#16171a] text-[11.5px] text-white/45"><tr><th className="px-3 py-2 font-medium">Gün</th><th className="px-3 py-2 text-right font-medium">Çalışma</th><th className="px-3 py-2 text-right font-medium">Başarılı</th><th className="px-3 py-2 text-right font-medium">Başarısız</th><th className="px-3 py-2 text-right font-medium">Kredi</th></tr></thead>
                  <tbody className="divide-y divide-white/[0.05]">{[...v.gunluk].reverse().map((g) => <tr key={g.gun} className="tabular-nums text-white/80"><td className="px-3 py-1.5">{gunKisa(g.gun)}</td><td className="px-3 py-1.5 text-right">{g.calisma}</td><td className="px-3 py-1.5 text-right">{g.basarili}</td><td className="px-3 py-1.5 text-right">{g.basarisiz}</td><td className="px-3 py-1.5 text-right">{sayiYaz(g.kredi, 1)}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </Kart>
          <Kart ikon={ikinci === "sure" ? Clock3 : Coins} baslik={ikinci === "sure" ? "Kazanılan süre" : "Harcanan kredi"} alt={ikinci === "sure" ? "Başarılı çalışma sayısı çarpı çalışma başı dakika" : "Model ve araç kredileri, gün gün"} govde="p-4 sm:p-5"
            sag={<Segment id="icgoru-ikinci" kucuk deger={ikinci} set={setIkinci} l={[{ id: "sure", ad: "Süre" }, { id: "kredi", ad: "Kredi" }]} />}>
            {ikinci === "sure" && !t?.kazanilanDk ? (
              <div className="flex h-[248px] flex-col items-start justify-center gap-2 rounded-[16px] bg-white/[0.02] p-5 ring-1 ring-inset ring-white/[0.06]">
                <p className="text-[14px] font-semibold text-white">Kazanılan süre için dakika gir</p>
                <p className="max-w-[420px] text-[12.5px] leading-relaxed text-white/50">Her sistem için bir başarılı çalışmanın elle kaç dakika sürdüğünü yaz; aşağıdaki tabloda Dakika gir düğmesi ya da sistem ayarlarındaki Çalışma başı kazanılan süre.</p>
              </div>
            ) : <AlanGrafigi key={ikinci} l={v.gunluk} deger={(g) => (ikinci === "sure" ? g.kazanilanDk : g.kredi)} bicim={(d) => (ikinci === "sure" ? dakikaYaz(d) : sayiYaz(d, 1))} ad={ikinci === "sure" ? "kazanılan süre" : "kredi"} />}
          </Kart>
        </div>

        <Kart ikon={Gauge} baslik={<span className="flex items-center gap-2">Sistem başına<span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[12px] font-medium tabular-nums text-white/70">{aktifler.length}</span></span>} alt={pasif ? `${pasif} sistem bu iki dönemde hiç çalışmadı` : "Çalışma sayısına göre sıralı"} className={cn("transition-opacity", yukleniyor && "opacity-60")}>
          <div className="hidden grid-cols-[minmax(0,1.6fr)_150px_110px_110px_90px_130px] gap-3 border-b border-white/[0.05] px-5 py-2 text-[11.5px] text-white/40 lg:grid"><span>Sistem</span><span>Çalışma</span><span>Hata oranı</span><span>Ortalama süre</span><span>Kredi</span><span>Kazanılan süre</span></div>
          <div className="divide-y divide-white/[0.05]">
            {aktifler.map((s) => { const D = DURUM_SINIF[s.durum]; return (
              <div key={s.id} className="grid grid-cols-2 items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-5 lg:grid-cols-[minmax(0,1.6fr)_150px_110px_110px_90px_130px]">
                <div className="col-span-2 min-w-0 lg:col-span-1">
                  <Link href={`/panel/build/sistemler/${s.id}`} className="flex min-w-0 items-center gap-2 hover:underline"><span className="truncate text-[14px] font-semibold text-white">{s.ad}</span><span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", D.sinif)}>{D.ad}</span></Link>
                  <Degisim simdi={s.calisma} once={s.onceki.calisma} iyi="notr" kucuk />
                </div>
                <div className="flex items-center gap-2"><span className="w-10 text-[13px] font-medium tabular-nums text-white">{sayiYaz(s.calisma)}</span><Kivrim l={s.seri.map((x) => x.calisma)} /></div>
                <div><span className={cn("text-[13px] tabular-nums", s.hataOrani > 0.2 ? "text-rose-200" : "text-white")}>{s.calisma ? `yüzde ${sayiYaz(s.hataOrani * 100, 1)}` : "Yok"}</span><span className="block text-[11px] text-white/40 lg:hidden">hata oranı</span></div>
                <div><span className="text-[13px] tabular-nums text-white">{s.calisma ? sureYaz(s.ortSure) : "Yok"}</span><span className="block text-[11px] text-white/40 lg:hidden">ortalama süre</span></div>
                <div><span className="text-[13px] tabular-nums text-white">{sayiYaz(s.kredi, 1)}</span><span className="block text-[11px] text-white/40 lg:hidden">kredi</span></div>
                <div><DakikaGir s={s} kaydet={(dk) => dakikaKaydet(s.id, dk)} />{s.dakika ? <span className="block text-[11px] text-white/40">çalışma başı {sayiYaz(s.dakika, 1)} dk</span> : null}</div>
              </div>
            ); })}
          </div>
        </Kart>
      </>)}
    </div>
  );
}
