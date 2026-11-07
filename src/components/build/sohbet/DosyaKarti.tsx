"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Download, Eye, FileSpreadsheet, FileText, History, Loader2, Presentation, StickyNote, X } from "lucide-react";
import { KenarTutamac, useKenarStili } from "@/components/ui/KenarTutamac";
import {
  BICIM_ADI, BICIM_RENGI, satirParcala, sutunHarfi, type BelgeBlok, type BelgeGirdi, type DosyaBicim, type DosyaBilgisi, type DosyaOnizleme,
  type KucukOnizleme, type Slayt, type Tema, type TabloOnizlemeSayfa,
} from "@/lib/build/belgeTipler";
import { cn } from "@/lib/utils";
import { SagPanel, SurumGecis, boyutYaz, yay } from "./ortak";

/**
 * Sohbette üretilen ya da yüklenen Office dosyaları: sohbet kartı (gerçek içerikten küçük resim, ad, boyut, sürüm,
 * Önizle, İndir), sağ önizleme paneli (Word: sayfa görünümü, Excel: sekmeli tablo ve formül çubuğu, PowerPoint: 16:9
 * slaytlar ve konuşmacı notları) ve sürümler arasında geçiş. Önizleme dosyanın üretildiği JSON'dan çizilir.
 */
export const BICIM_IKON: Record<DosyaBicim, typeof FileText> = { docx: FileText, xlsx: FileSpreadsheet, pptx: Presentation };
const hex = (h: string) => `#${h.replace(/^#/, "")}`;

export function BicimSimge({ bicim, boyut = 32 }: { bicim: DosyaBicim; boyut?: number }) {
  const I = BICIM_IKON[bicim];
  return (
    <span style={{ width: boyut, height: boyut, background: `${BICIM_RENGI[bicim]}26`, color: BICIM_RENGI[bicim] }} className="flex shrink-0 items-center justify-center rounded-[9px]">
      <I style={{ width: boyut * 0.5, height: boyut * 0.5 }} />
    </span>
  );
}

/** Satır içi **kalın** / *italik* / `kod`. */
function Satir({ m }: { m: string }) {
  return <>{satirParcala(m).map((p, i) => p.k ? <code key={i} className="rounded bg-black/[0.06] px-1 font-mono text-[0.92em]">{p.t}</code> : p.b || p.i ? <span key={i} className={cn(p.b && "font-bold", p.i && "italic")}>{p.t}</span> : <Fragment key={i}>{p.t}</Fragment>)}</>;
}

/* ═════════════ PowerPoint slaydı (1280 x 720 tasarım, ölçeklenir) ═════════════ */
const PT = 96 / 72;
function SlaytIcerik({ s, t, no, ad, bolum }: { s: Slayt; t: Tema; no: number; ad: string; bolum?: number }) {
  const c = { zemin: hex(t.zemin), yuzey: hex(t.yuzey), metin: hex(t.metin), soluk: hex(t.soluk), vurgu: hex(t.vurgu) };
  const yazi: React.CSSProperties = { fontFamily: "Calibri, 'Segoe UI', system-ui, sans-serif", color: c.metin };
  const madde = (l: string[] | undefined, pt: number) => (
    <ul style={{ fontSize: pt * PT, lineHeight: 1.18 }} className="space-y-[0.5em]">
      {(l ?? []).map((m, i) => <li key={i} className="flex gap-[0.6em]"><span style={{ background: c.metin }} className="mt-[0.5em] h-[0.3em] w-[0.3em] shrink-0 rounded-full" /><span className="min-w-0"><Satir m={m} /></span></li>)}
    </ul>
  );
  const baslik = (b?: string) => b ? (
    <>
      <span style={{ left: 72, top: 59, width: 53, height: 6, background: c.vurgu }} className="absolute" />
      <p style={{ left: 72, top: 75, width: 1136, fontSize: 30 * PT, lineHeight: 1.12 }} className="absolute line-clamp-2 font-bold">{b}</p>
    </>
  ) : null;
  const gorsel = s.duzen === "gorsel" && s.gorsel;
  const duzen = s.duzen === "gorsel" && !gorsel ? "madde" : s.duzen;
  return (
    <div style={{ ...yazi, background: c.zemin, width: 1280, height: 720 }} className="relative overflow-hidden">
      {duzen === "kapak" && <>
        <span style={{ left: 0, top: 0, width: 17, height: 720, background: c.vurgu }} className="absolute" />
        <div style={{ left: 106, top: 211, width: 1067, height: 182 }} className="absolute flex items-end"><p style={{ fontSize: 46 * PT, lineHeight: 1.06 }} className="line-clamp-3 font-bold tracking-[-0.01em]">{s.baslik ?? ad}</p></div>
        {s.alt_baslik && <p style={{ left: 106, top: 408, width: 1067, fontSize: 20 * PT, color: c.soluk }} className="absolute line-clamp-2">{s.alt_baslik}</p>}
      </>}
      {duzen === "bolum" && <>
        <p style={{ left: 106, top: 240, fontSize: 16 * PT, color: c.vurgu }} className="absolute font-bold">Bölüm {bolum ?? 1}</p>
        <p style={{ left: 106, top: 288, width: 1067, fontSize: 40 * PT, lineHeight: 1.1 }} className="absolute line-clamp-2 font-bold">{s.baslik}</p>
        {s.alt_baslik && <p style={{ left: 106, top: 422, width: 1067, fontSize: 18 * PT, color: c.soluk }} className="absolute">{s.alt_baslik}</p>}
      </>}
      {duzen === "madde" && <>
        {baslik(s.baslik)}
        {s.alt_baslik && <p style={{ left: 72, top: 168, width: 1136, fontSize: 16 * PT, color: c.soluk }} className="absolute truncate">{s.alt_baslik}</p>}
        <div style={{ left: 72, top: s.alt_baslik ? 230 : 197, width: 1136, height: 440 }} className="absolute overflow-hidden">{madde(s.maddeler, 20)}</div>
      </>}
      {duzen === "iki_sutun" && <>
        {baslik(s.baslik)}
        {[s.sol, s.sag].map((k, i) => (
          <div key={i} style={{ left: 72 + i * (549 + 38), top: 187, width: 549, height: 466, background: c.yuzey }} className="absolute overflow-hidden rounded-[12px] px-[34px] py-[24px]">
            {k?.baslik && <p style={{ fontSize: 20 * PT, color: c.vurgu }} className="mb-[16px] font-bold">{k.baslik}</p>}
            {madde(k?.maddeler, 17)}
          </div>
        ))}
      </>}
      {duzen === "gorsel" && gorsel && <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={s.gorsel} alt="" style={{ left: s.gorsel_konum === "sol" ? 0 : 640, top: 0, width: 640, height: 720 }} className="absolute object-cover" />
        <div style={{ left: s.gorsel_konum === "sol" ? 693 : 72, top: 82, width: 515 }} className="absolute">
          {s.baslik && <p style={{ fontSize: 30 * PT, lineHeight: 1.12 }} className="mb-[28px] line-clamp-3 font-bold">{s.baslik}</p>}
          {madde(s.maddeler, 18)}
        </div>
      </>}
      {duzen === "alinti" && <>
        <p style={{ left: 96, top: 60, fontSize: 120 * PT, color: c.vurgu, fontFamily: "Georgia, serif", lineHeight: 1 }} className="absolute">{"“"}</p>
        <div style={{ left: 154, top: 211, width: 973, height: 269 }} className="absolute flex items-center"><p style={{ fontSize: 30 * PT, fontFamily: "Georgia, serif", lineHeight: 1.25 }} className="line-clamp-4 italic">{s.alinti ?? s.baslik}</p></div>
        {s.alinti_sahibi && <p style={{ left: 154, top: 499, fontSize: 16 * PT, color: c.soluk }} className="absolute">{s.alinti_sahibi}</p>}
      </>}
      {duzen === "rakamlar" && <>
        {baslik(s.baslik)}
        {(s.rakamlar ?? []).map((r, i, l) => {
          const w = (1136 - 29 * (l.length - 1)) / Math.max(1, l.length);
          return (
            <div key={i} style={{ left: 72 + i * (w + 29), top: 221, width: w, height: 307, background: c.yuzey }} className="absolute rounded-[12px] px-[29px] pt-[38px]">
              <p style={{ fontSize: 48 * PT, color: c.vurgu, lineHeight: 1 }} className="truncate font-bold">{r.deger}</p>
              <p style={{ fontSize: 16 * PT, color: c.soluk }} className="mt-[24px] line-clamp-3">{r.etiket}</p>
            </div>
          );
        })}
        {s.alt_baslik && <p style={{ left: 72, top: 566, width: 1136, fontSize: 15 * PT, color: c.soluk }} className="absolute">{s.alt_baslik}</p>}
      </>}
      {no > 1 && <>
        <p style={{ left: 72, top: 672, fontSize: 10 * PT, color: c.soluk }} className="absolute">{ad}</p>
        <p style={{ right: 72, top: 672, fontSize: 10 * PT, color: c.soluk }} className="absolute">{no}</p>
      </>}
    </div>
  );
}

/** Kabın genişliğine ölçeklenen 16:9 slayt. */
export function SlaytCiz({ s, tema, no, ad, className, bolum }: { s: Slayt; tema: Tema; no: number; ad: string; className?: string; bolum?: number }) {
  const kap = useRef<HTMLDivElement>(null);
  const [olcek, setOlcek] = useState(0);
  useLayoutEffect(() => {
    const k = kap.current; if (!k) return;
    const f = () => setOlcek(k.clientWidth / 1280);
    f();
    const r = new ResizeObserver(f); r.observe(k);
    return () => r.disconnect();
  }, []);
  return (
    <div ref={kap} className={cn("relative aspect-video w-full overflow-hidden", className)} style={{ background: hex(tema.zemin) }}>
      {olcek > 0 && <div style={{ transform: `scale(${olcek})`, transformOrigin: "0 0" }} className="absolute left-0 top-0"><SlaytIcerik s={s} t={tema} no={no} ad={ad} bolum={bolum} /></div>}
    </div>
  );
}

/* ═════════════ Küçük resim (kart, kitaplık) ═════════════ */
export function DosyaKucuk({ k, ad, buyuk }: { k?: KucukOnizleme; ad: string; buyuk?: boolean }) {
  if (!k) return <span className="flex h-full w-full items-center justify-center bg-white/[0.04]"><FileText className="h-6 w-6 text-white/40" /></span>;
  if (k.bicim === "pptx") return <div className="flex h-full w-full items-center justify-center bg-[#0e0f11] p-[6%]"><SlaytCiz s={k.slayt} tema={k.tema} no={1} ad={ad} className="rounded-[4px] ring-1 ring-white/10" /></div>;
  if (k.bicim === "docx") return (
    <div className="flex h-full w-full justify-center overflow-hidden bg-[#0e0f11] pt-[9%]">
      <div className={cn("w-[66%] rounded-t-[3px] bg-white text-[#1f2328]", buyuk ? "px-[9%] pt-[9%]" : "px-[8%] pt-[8%]")} style={{ fontFamily: "Calibri, 'Segoe UI', system-ui, sans-serif" }}>
        {k.baslik && <p className={cn("mb-[6%] line-clamp-2 font-bold leading-tight text-[#0f2a40]", buyuk ? "text-[13px]" : "text-[7px]")}>{k.baslik}</p>}
        {k.satirlar.map((x, i) => (
          <p key={i} className={cn("leading-[1.35]", buyuk ? "text-[8px]" : "text-[4.5px]", x.t === "b" ? cn("font-bold text-[#12324a]", buyuk ? "mt-[5%] text-[10px]" : "mt-[4%] text-[5.5px]") : "text-[#4b5563]", x.t === "l" && "pl-[6%]", x.t === "p" && "line-clamp-3")}>{x.t === "l" ? `• ${x.m}` : x.m}</p>
        ))}
      </div>
    </div>
  );
  return (
    <div className="h-full w-full overflow-hidden bg-white" style={{ fontFamily: "Calibri, 'Segoe UI', system-ui, sans-serif" }}>
      <table className={cn("w-full table-fixed border-collapse", buyuk ? "text-[9px]" : "text-[5px]")}>
        <thead><tr>{k.basliklar.slice(0, buyuk ? 6 : 4).map((b, i) => <th key={i} className="truncate border-r border-white/20 bg-[#17324d] px-[3px] py-[2px] text-left font-semibold text-white">{b}</th>)}</tr></thead>
        <tbody>{k.satirlar.slice(0, buyuk ? 9 : 6).map((r, i) => <tr key={i} className={i % 2 ? "bg-[#f6f8fa]" : "bg-white"}>{r.slice(0, buyuk ? 6 : 4).map((v, j) => <td key={j} className="truncate border-b border-r border-[#e5e7eb] px-[3px] py-[2px] text-[#1f2328]">{v}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

/* ═════════════ Sohbet kartı ═════════════ */
export function DosyaKarti({ d, kaynakAd, onizle, yuklenen }: { d: DosyaBilgisi; kaynakAd?: string; onizle?: (d: DosyaBilgisi) => void; yuklenen?: boolean }) {
  const [acik, setAcik] = useState(false);
  const ac = () => (onizle ? onizle(d) : setAcik(true));
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      className="group/dosya my-3 flex max-w-[560px] items-stretch gap-3.5 overflow-hidden rounded-[18px] bg-white/[0.04] p-2.5 ring-1 ring-inset ring-white/[0.09] max-sm:gap-3">
      <button type="button" onClick={ac} aria-label={`${d.ad} önizle`} className="relative h-[92px] w-[124px] shrink-0 overflow-hidden rounded-[12px] ring-1 ring-inset ring-white/[0.08] max-sm:h-[84px] max-sm:w-[92px]">
        <span className="block h-full w-full transition-transform duration-500 group-hover/dosya:scale-[1.03]"><DosyaKucuk k={d.kucuk} ad={d.ad.replace(/\.\w+$/, "")} /></span>
      </button>
      <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5 pr-1">
        <span className="flex min-w-0 items-center gap-2">
          <BicimSimge bicim={d.bicim} boyut={22} />
          <span className="truncate text-[14.5px] font-semibold text-white">{d.ad}</span>
        </span>
        <span className="mt-1 block truncate text-[12.5px] text-white/50">{BICIM_ADI[d.bicim]} · {boyutYaz(d.boyut)}{d.ozet ? ` · ${d.ozet}` : ""}</span>
        <span className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={ac} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black transition-transform active:scale-[0.97]"><Eye className="h-3.5 w-3.5" />Önizle</button>
          <a href={d.url} download className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.13]"><Download className="h-3.5 w-3.5" />İndir</a>
          {d.surum > 1 && <span title={kaynakAd ? `${kaynakAd} dosyasının yeni sürümü` : undefined} className="inline-flex h-7 items-center gap-1 rounded-full bg-[#55d6fd]/[0.12] px-2.5 text-[12px] font-medium text-[#8be6ff]"><History className="h-3 w-3" />Sürüm {d.surum}</span>}
          {yuklenen && d.surum === 1 && <span className="inline-flex h-7 items-center rounded-full bg-white/[0.06] px-2.5 text-[12px] text-white/60">Sürüm 1</span>}
        </span>
      </div>
      {!onizle && <SagPanel acik={acik} kapat={() => setAcik(false)} baslik={d.ad} alt={`${BICIM_ADI[d.bicim]} · ${boyutYaz(d.boyut)}`} ikon={<BicimSimge bicim={d.bicim} boyut={22} />} genislik={880}
        ust={<a href={d.url} download className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black"><Download className="h-3.5 w-3.5" /><span className="max-sm:hidden">İndir</span></a>}>
        <DosyaOnizlemeGovde id={d.id} />
      </SagPanel>}
    </motion.div>
  );
}

/* ═════════════ Önizleme gövdesi ═════════════ */
type Yanit = { dosya: DosyaBilgisi; onizleme: DosyaOnizleme; surumler: DosyaBilgisi[] };
const onbellek = new Map<string, Promise<Yanit>>();
export function onizlemeGetir(id: string): Promise<Yanit> {
  let p = onbellek.get(id);
  if (!p) {
    p = fetch(`/api/build/sohbet/belge/${id}.json`).then(async (r) => { const v = await r.json(); if (!r.ok || !v.ok) throw new Error(v.hata ?? "Önizleme açılamadı."); return v as Yanit; });
    p.catch(() => onbellek.delete(id));
    onbellek.set(id, p);
  }
  return p;
}

function BelgeSayfalari({ g }: { g: BelgeGirdi }) {
  const sayfalar: BelgeBlok[][] = [[]];
  for (const b of g.bloklar) { if (b.tur === "sayfa_sonu") sayfalar.push([]); else sayfalar[sayfalar.length - 1].push(b); }
  return (
    <div className="space-y-4">
      {sayfalar.map((l, si) => (
        <div key={si} className="relative mx-auto min-h-[420px] w-full max-w-[760px] rounded-[6px] bg-white px-6 pb-14 pt-8 text-[14.5px] leading-[1.62] text-[#1f2328] sm:px-[68px] sm:pt-[60px]" style={{ fontFamily: "Calibri, Carlito, 'Segoe UI', system-ui, sans-serif" }}>
          {si === 0 && g.baslik && <h1 className="mb-1.5 text-[28px] font-bold leading-tight tracking-[-0.01em] text-[#0f2a40] sm:text-[32px]"><Satir m={g.baslik} /></h1>}
          {si === 0 && g.alt_baslik && <p className="mb-7 text-[16px] text-[#57606a]"><Satir m={g.alt_baslik} /></p>}
          {l.map((b, i) => {
            switch (b.tur) {
              case "baslik": return b.seviye === 1 ? <h2 key={i} className="mb-2 mt-6 text-[21px] font-bold text-[#12324a] first:mt-0"><Satir m={b.metin} /></h2> : b.seviye === 2 ? <h3 key={i} className="mb-1.5 mt-5 text-[17.5px] font-bold text-[#1c5d7f]"><Satir m={b.metin} /></h3> : <h4 key={i} className="mb-1 mt-4 text-[15.5px] font-bold text-[#2b6f92]"><Satir m={b.metin} /></h4>;
              case "paragraf": return <p key={i} className={cn("mb-3", b.hiza === "orta" && "text-center", b.hiza === "sag" && "text-right", b.hiza === "iki" && "text-justify")}><Satir m={b.metin} /></p>;
              case "liste": { const L = b.sirali ? "ol" : "ul"; return <L key={i} className={cn("mb-3 space-y-1 pl-7", b.sirali ? "list-decimal" : "list-disc")}>{b.maddeler.map((m, j) => <li key={j}><Satir m={m} /></li>)}</L>; }
              case "alinti": return <blockquote key={i} className="my-3 border-l-[3px] border-[#2b9cc4] pl-4 italic text-[#424a53]"><Satir m={b.metin} /></blockquote>;
              case "ayrac": return <hr key={i} className="my-5 border-[#d0d7de]" />;
              case "tablo": return (
                <div key={i} className="my-4 overflow-x-auto">
                  <table className="w-full border-collapse text-[13.5px]">
                    <thead><tr>{b.basliklar.map((h, j) => <th key={j} className="border border-[#d0d7de] bg-[#17324d] px-3 py-1.5 text-left font-bold text-white"><Satir m={h} /></th>)}</tr></thead>
                    <tbody>{b.satirlar.map((r, j) => <tr key={j} className={j % 2 ? "bg-[#f6f8fa]" : ""}>{r.map((v, k) => <td key={k} className="border border-[#d0d7de] px-3 py-1.5 align-top"><Satir m={v} /></td>)}</tr>)}</tbody>
                  </table>
                </div>
              );
              default: return null;
            }
          })}
          <span className="absolute bottom-5 left-0 right-0 text-center text-[11px] text-[#8c959f]">{si + 1}</span>
        </div>
      ))}
    </div>
  );
}

function TabloGorunumu({ sayfalar }: { sayfalar: TabloOnizlemeSayfa[] }) {
  const [sec, setSec] = useState(0);
  const [hucre, setHucre] = useState<{ r: number; c: number } | null>(null);
  const s = sayfalar[Math.min(sec, sayfalar.length - 1)];
  useEffect(() => setHucre(null), [sec]);
  if (!s) return null;
  const satirlar = s.toplam ? [...s.satirlar, s.toplam] : s.satirlar;
  const secili = hucre ? (hucre.r === 0 ? { m: s.sutunlar[hucre.c]?.baslik ?? "" } : satirlar[hucre.r - 1]?.[hucre.c]) : null;
  return (
    <div className="flex h-full min-h-0 flex-col">
      {sayfalar.length > 1 && (
        <LayoutGroup id="tablo-sekme">
          <div className="mb-2.5 flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none]">
            {sayfalar.map((x, i) => (
              <button key={x.ad} type="button" onClick={() => setSec(i)} className={cn("relative h-8 shrink-0 rounded-full px-3.5 text-[12.5px] font-medium", sec === i ? "text-black" : "bg-white/[0.05] text-white/65 hover:text-white")}>
                {sec === i && <motion.span layoutId="tablo-sekme-z" transition={yay} className="absolute inset-0 rounded-full bg-white" />}<span className="relative">{x.ad}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
      )}
      <div className="mb-2 flex h-9 shrink-0 items-center gap-2 rounded-[10px] bg-white/[0.05] px-3 text-[12.5px] ring-1 ring-inset ring-white/[0.07]">
        <span className="w-12 shrink-0 font-medium text-white/80 tabular-nums">{hucre ? `${sutunHarfi(hucre.c)}${hucre.r + 1}` : "Hücre"}</span>
        <span className="h-4 w-px bg-white/10" />
        <span className="min-w-0 flex-1 truncate text-white/75">{secili ? (secili.f ? <><span className="text-[#8be6ff]">Formül</span> <span className="font-mono text-[12px]">{secili.f}</span> <span className="text-white/40">sonuç</span> {secili.m}</> : secili.m || " ") : "Bir hücreye tıkla"}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto rounded-[8px] bg-white [scrollbar-width:thin]" style={{ fontFamily: "Calibri, Carlito, 'Segoe UI', system-ui, sans-serif" }}>
        <table className="border-collapse text-[13px] text-[#1f2328]">
          <thead className="sticky top-0 z-[2]">
            <tr>
              <th className="sticky left-0 z-[3] h-6 w-10 min-w-10 border-b border-r border-[#d1d5db] bg-[#f3f4f6]" />
              {s.sutunlar.map((c, i) => <th key={i} style={{ minWidth: Math.max(64, c.genislik * 7.4) }} className={cn("h-6 border-b border-r border-[#d1d5db] bg-[#f3f4f6] px-2 text-center text-[11.5px] font-normal text-[#6b7280]", hucre?.c === i && "bg-[#e0f2fe] text-[#0c4a6e]")}>{sutunHarfi(i)}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="sticky left-0 z-[1] border-b border-r border-[#d1d5db] bg-[#f3f4f6] text-center text-[11.5px] text-[#6b7280]">1</td>
              {s.sutunlar.map((c, i) => <td key={i} onClick={() => setHucre({ r: 0, c: i })} className={cn("cursor-cell whitespace-nowrap border-b border-r border-[#0e1f30] bg-[#17324d] px-2 py-1 font-bold text-white", hucre?.r === 0 && hucre.c === i && "outline outline-2 -outline-offset-2 outline-white")}>{c.baslik}</td>)}
            </tr>
            {satirlar.map((r, ri) => {
              const toplam = !!s.toplam && ri === satirlar.length - 1;
              return (
                <tr key={ri} className={toplam ? "bg-[#eaf2f8] font-bold" : ri % 2 ? "bg-[#f6f8fa]" : "bg-white"}>
                  <td className={cn("sticky left-0 z-[1] border-b border-r border-[#d1d5db] bg-[#f3f4f6] text-center text-[11.5px] font-normal text-[#6b7280]", hucre?.r === ri + 1 && "bg-[#e0f2fe] text-[#0c4a6e]")}>{ri + 2}</td>
                  {r.map((v, ci) => (
                    <td key={ci} onClick={() => setHucre({ r: ri + 1, c: ci })} title={v.f ? `Formül: ${v.f}` : undefined}
                      className={cn("max-w-[360px] cursor-cell truncate border-b border-r border-[#e5e7eb] px-2 py-1", (v.s || s.sutunlar[ci]?.sag) && "text-right tabular-nums", toplam && "border-t-2 border-t-[#17324d]", hucre?.r === ri + 1 && hucre.c === ci && "outline outline-2 -outline-offset-2 outline-[#0b0b0c]")}>
                      {v.m}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!!s.kesildi && <p className="mt-2 text-[12px] text-white/45">Önizlemede ilk 500 satır var; dosyada {s.kesildi} satır daha var.</p>}
    </div>
  );
}

function Slaytlar({ g, tema }: { g: { ad: string; slaytlar: Slayt[] }; tema: Tema }) {
  return (
    <div className="mx-auto max-w-[820px] space-y-5">
      {g.slaytlar.map((s, i) => (
        <motion.figure key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}>
          <figcaption className="mb-1.5 flex items-center gap-2 text-[12px] text-white/45"><span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/[0.07] px-1.5 text-[11px] tabular-nums text-white/70">{i + 1}</span>{s.baslik ?? s.alinti?.slice(0, 60) ?? ""}</figcaption>
          <SlaytCiz s={s} tema={tema} no={i + 1} bolum={g.slaytlar.slice(0, i + 1).filter((x) => x.duzen === "bolum").length} ad={g.ad} className="rounded-[10px] ring-1 ring-inset ring-white/[0.08]" />
          {s.notlar && <p className="mt-2 flex gap-2 rounded-[12px] bg-white/[0.04] px-3 py-2 text-[12.5px] leading-relaxed text-white/65"><StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/40" /><span className="whitespace-pre-wrap">{s.notlar}</span></p>}
        </motion.figure>
      ))}
    </div>
  );
}

export function OnizlemeCiz({ o }: { o: DosyaOnizleme }) {
  if (o.bicim === "docx") return <BelgeSayfalari g={o.girdi} />;
  if (o.bicim === "xlsx") return <TabloGorunumu sayfalar={o.sayfalar} />;
  return <Slaytlar g={o.girdi} tema={o.tema} />;
}

/** Önizleme (sürüm geçişli). surumDegisti: panel başlığını güncellemek için. */
export function DosyaOnizlemeGovde({ id, surumDegisti, gizliSurum }: { id: string; surumDegisti?: (d: DosyaBilgisi, l: DosyaBilgisi[]) => void; gizliSurum?: boolean }) {
  const [aktif, setAktif] = useState(id);
  const [v, setV] = useState<Yanit | null>(null);
  const [hata, setHata] = useState("");
  useEffect(() => setAktif(id), [id]);
  useEffect(() => {
    let iptal = false;
    setHata("");
    onizlemeGetir(aktif).then((x) => { if (!iptal) { setV(x); surumDegisti?.(x.dosya, x.surumler); } }).catch((e: Error) => { if (!iptal) setHata(e.message); });
    return () => { iptal = true; };
  }, [aktif]); // eslint-disable-line react-hooks/exhaustive-deps
  if (hata) return <p className="rounded-[14px] bg-rose-500/[0.07] px-3.5 py-3 text-[13px] text-rose-200">{hata}</p>;
  if (!v || v.dosya.id !== aktif) return <div className="flex h-60 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>;
  const sira = v.surumler.findIndex((x) => x.id === aktif);
  return (
    <div className="flex h-full min-h-0 flex-col">
      {!gizliSurum && v.surumler.length > 1 && (
        <div className="mb-3 flex shrink-0 items-center gap-2 rounded-[12px] bg-white/[0.04] px-3 py-1.5 text-[12.5px] text-white/60 ring-1 ring-inset ring-white/[0.06]">
          <History className="h-3.5 w-3.5 text-[#8be6ff]" /><span>Sürüm</span>
          <SurumGecis sira={sira} toplam={v.surumler.length} sec={(i) => setAktif(v.surumler[i].id)} />
          <span className="ml-auto truncate">{v.surumler[sira]?.zaman ? new Date(v.surumler[sira].zaman!).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</span>
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.div key={aktif} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="min-h-0 flex-1">
          <OnizlemeCiz o={v.onizleme} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ═════════════ Sağ panel (sohbet ekranında, HTML önizleme paneliyle aynı yer) ═════════════ */
export function DosyaPaneli({ d, kapat }: { d: DosyaBilgisi; kapat: () => void }) {
  const kenar = useKenarStili("build-sohbet-dosya", 640, 400, 1100);
  const [gorunen, setGorunen] = useState<DosyaBilgisi>(d);
  const [surumler, setSurumler] = useState<DosyaBilgisi[]>([]);
  const [aktif, setAktif] = useState(d.id);
  useEffect(() => { setGorunen(d); setAktif(d.id); }, [d]);
  const sira = surumler.findIndex((x) => x.id === aktif);
  return (
    <motion.aside initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 38 }} style={kenar.stil}
      className="fixed inset-y-2 right-2 z-40 flex w-[min(760px,calc(100vw-16px))] flex-col overflow-hidden rounded-[20px] bg-[#111214] ring-1 ring-inset ring-white/[0.09] xl:relative xl:inset-auto xl:right-auto xl:h-[calc(100vh-16px)] xl:w-[var(--yan-en)] xl:shrink-0">
      <KenarTutamac en={kenar.en} anahtar={kenar.anahtar} varsayilan={kenar.varsayilan} min={kenar.min} max={kenar.max} etiket="Dosya önizleme panelinin genişliği" className="max-xl:hidden" />
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-white/[0.06] pl-3 pr-2">
        <BicimSimge bicim={gorunen.bicim} boyut={30} />
        <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold text-white">{gorunen.ad}</span><span className="block truncate text-[12px] text-white/45">{BICIM_ADI[gorunen.bicim]} · {boyutYaz(gorunen.boyut)}{gorunen.ozet ? ` · ${gorunen.ozet}` : ""}</span></span>
        {surumler.length > 1 && <span className="flex shrink-0 items-center rounded-full bg-white/[0.05] pl-2.5 text-[12px] text-white/55"><span className="max-sm:hidden">Sürüm</span><SurumGecis sira={sira} toplam={surumler.length} sec={(i) => setAktif(surumler[i].id)} /></span>}
        <a href={gorunen.url} download className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black"><Download className="h-3.5 w-3.5" /><span className="max-sm:hidden">İndir</span></a>
        <button type="button" title="Kapat" aria-label="Kapat" onClick={kapat} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <div className={cn("min-h-0 flex-1 overflow-y-auto bg-[#0d0e10] p-3 [scrollbar-width:thin] sm:p-5", gorunen.bicim === "xlsx" && "flex flex-col overflow-hidden")}>
        <DosyaOnizlemeGovde id={aktif} gizliSurum surumDegisti={(x, l) => { setGorunen(x); setSurumler(l); }} />
      </div>
    </motion.aside>
  );
}
