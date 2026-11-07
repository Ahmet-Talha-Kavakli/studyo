"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, BookOpen, ChevronDown, Download, FileSearch, Globe, ListChecks, Loader2, Maximize2, Plus, RotateCcw, Search, Square, Telescope, X } from "lucide-react";
import { modelBul, VARSAYILAN_MODEL } from "@/lib/build/modeller";
import { cn } from "@/lib/utils";
import { kaynakDizini, metinGruplari, type KaynakDizini } from "./Kaynaklar";
import { Md } from "./Metin";
import { SagPanel, alanAdi, dosyaAdi, favicon, indir, sn } from "./ortak";
import type { AracParca, Mesaj, PlanParca } from "./tipler";

/** Araştırmayı yürüten model: seçili model Claude değilse Opus 5.5 (web araçları Claude'un). */
export const arastirmaModeli = (model?: string) => { const m = modelBul(model); return m.saglayici === "anthropic" ? m : modelBul(VARSAYILAN_MODEL); };
export const arastirmaModelAdi = (model?: string) => arastirmaModeli(model).ad;

/** Düzenlenebilir araştırma planı (ChatGPT/Gemini gibi): başlat, yeniden çıkar; çalışırken salt okunur. */
export function PlanKarti({ p, beklemede, baslat, yenile, model, bagli }: { p: PlanParca; beklemede: boolean; baslat?: (plan: { baslik: string; adimlar: string[] }) => void; yenile?: () => void; model?: string; bagli?: (id: string) => boolean }) {
  const [baslik, setBaslik] = useState(p.baslik);
  const [adimlar, setAdimlar] = useState(p.adimlar);
  const [acik, setAcik] = useState(false);
  const [gidiyor, setGidiyor] = useState(false);
  useEffect(() => { setBaslik(p.baslik); setAdimlar(p.adimlar); }, [p.baslik, p.adimlar]);
  if (p.durum === "hazirlaniyor") return (
    <div className="my-2 flex max-w-[620px] items-center gap-3 rounded-[18px] bg-white/[0.04] px-4 py-3.5 ring-1 ring-inset ring-white/[0.08]">
      <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><Telescope className="h-4 w-4" /></span>
      <span className="build-parilti text-[14px] text-white/80">Araştırma planı hazırlanıyor</span>
    </div>
  );
  const duzen = p.durum === "bekliyor" && beklemede && !!baslat;
  if (!duzen) return (
    <div className="my-2 max-w-[620px] overflow-hidden rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
      <button type="button" onClick={() => setAcik((x) => !x)} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left">
        <ListChecks className="h-4 w-4 text-[#8be6ff]" /><span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-white">{p.baslik}</span>
        <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11.5px] text-white/60">{p.adimlar.length} adım</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-white/45 transition-transform", acik && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {acik && <motion.ol initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-t border-white/[0.06]">
          {p.adimlar.map((a, i) => <li key={i} className="flex gap-2.5 px-3.5 py-2 text-[13px] text-white/70"><span className="text-white/35">{i + 1}.</span>{a}</li>)}
        </motion.ol>}
      </AnimatePresence>
    </div>
  );
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="my-2 max-w-[640px] overflow-hidden rounded-[20px] bg-white/[0.04] ring-1 ring-inset ring-[#55d6fd]/25">
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><Telescope className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-white">Araştırma planı</span><span className="block text-[12px] text-white/50">Adımları düzenle, ekle ya da sil; sonra başlat</span></span>
      </div>
      <div className="space-y-2 p-3.5">
        <input value={baslik} onChange={(e) => setBaslik(e.target.value)} maxLength={160} aria-label="Plan başlığı" className="h-10 w-full rounded-[12px] bg-white/[0.05] px-3 text-[14px] font-medium text-white outline-none ring-1 ring-inset ring-white/[0.08] focus:ring-white/30" />
        <AnimatePresence initial={false}>
          {adimlar.map((a, i) => (
            <motion.div key={i} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-start gap-2">
              <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-[11.5px] font-semibold text-white/70">{i + 1}</span>
              <textarea value={a} rows={1} onChange={(e) => setAdimlar(adimlar.map((x, j) => (j === i ? e.target.value : x)))} aria-label={`${i + 1}. adım`}
                className="min-h-[40px] flex-1 resize-none rounded-[12px] bg-white/[0.04] px-3 py-2.5 text-[13.5px] leading-snug text-white/90 outline-none ring-1 ring-inset ring-white/[0.06] [field-sizing:content] focus:ring-white/30" />
              <button type="button" onClick={() => setAdimlar(adimlar.filter((_, j) => j !== i))} aria-label="Adımı sil" className="mt-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/40 hover:bg-white/[0.06] hover:text-white"><X className="h-3.5 w-3.5" /></button>
            </motion.div>
          ))}
        </AnimatePresence>
        {adimlar.length < 10 && <button type="button" onClick={() => setAdimlar([...adimlar, ""])} className="ml-8 inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-white/60 hover:bg-white/[0.06] hover:text-white"><Plus className="h-3.5 w-3.5" />Adım ekle</button>}
      </div>
      {bagli && !bagli(arastirmaModeli(model).id) && (
        <p className="flex items-start gap-2 border-t border-amber-300/15 bg-amber-400/[0.06] px-3.5 py-2.5 text-[12.5px] leading-snug text-amber-100/85"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />Araştırma {arastirmaModelAdi(model)} ile web&apos;de arayarak yapılır ama bu sunucuda Claude bağlı değil. Yönetici ANTHROPIC_API_KEY anahtarını ekleyince başlatabilirsin.</p>
      )}
      <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] px-3.5 py-3">
        <button type="button" disabled={gidiyor || !adimlar.some((x) => x.trim()) || (!!bagli && !bagli(arastirmaModeli(model).id))} onClick={() => { setGidiyor(true); baslat!({ baslik: baslik.trim() || "Araştırma", adimlar: adimlar.map((x) => x.trim()).filter(Boolean) }); }}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-50">{gidiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Telescope className="h-3.5 w-3.5" />}Araştırmayı başlat</button>
        {yenile && <button type="button" onClick={yenile} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-white/60 hover:bg-white/[0.06] hover:text-white"><RotateCcw className="h-3.5 w-3.5" />Planı yeniden çıkar</button>}
        {(!bagli || bagli(arastirmaModeli(model).id)) && <span className="ml-auto text-[12px] text-white/45">{arastirmaModelAdi(model)} web&apos;de arayıp sayfaları okur; birkaç dakika sürebilir</span>}
      </div>
    </motion.div>
  );
}

/** Araştırma ilerlemesi: aramalar ve okunan sayfalar canlı; süre; durdur. */
export function ArastirmaIlerleme({ m, canli, durdur }: { m: Mesaj; canli: boolean; durdur?: () => void }) {
  const [simdi, setSimdi] = useState(Date.now());
  useEffect(() => { if (!canli) return; const t = setInterval(() => setSimdi(Date.now()), 1000); return () => clearInterval(t); }, [canli]);
  const araclar = (m.parcalar ?? []).filter((p): p is AracParca => p.tur === "arac" && (p.ad === "web_search" || p.ad === "web_fetch"));
  const aramalar = araclar.filter((a) => a.ad === "web_search");
  const okumalar = araclar.filter((a) => a.ad === "web_fetch" && a.durum !== "hata");
  const siteler = [...new Set(araclar.flatMap((a) => a.sonuc?.tur === "arama" ? a.sonuc.kaynaklar.map((k) => k.url) : a.sonuc?.tur === "sayfa" ? [a.sonuc.url] : []).map(alanAdi))];
  const [acik, setAcik] = useState(false);
  if (!araclar.length && !canli) return null;
  const son = araclar.slice(-5).reverse();
  const pl = m.parcalar ?? [];
  let sonArac = -1;
  pl.forEach((x, i) => { if (x.tur === "arac") sonArac = i; });
  const yaziyor = canli && pl.some((x, i) => x.tur === "metin" && x.metin.trim() && i > sonArac);
  return (
    <div className="my-2 max-w-[640px] overflow-hidden rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.08]">
      <div className="flex items-center gap-3 px-3.5 py-3">
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#55d6fd]/[0.12] text-[#8be6ff]">{canli ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}</span>
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-[13.5px] font-semibold text-white", canli && "build-parilti")}>{canli ? (yaziyor ? "Rapor yazılıyor" : son[0]?.baslik ?? "Araştırma başlıyor") : "Araştırma tamamlandı"}</span>
          <span className="block text-[12px] text-white/50">{aramalar.length} arama · {okumalar.length} sayfa okundu · {siteler.length} site · {sn((canli ? simdi : m.zaman + (m.sureMs ?? 0)) - m.zaman) || "0 sn"}</span>
        </span>
        {canli && durdur && <button type="button" onClick={durdur} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.14]"><Square className="h-3 w-3 fill-current" />Durdur</button>}
        {araclar.length > 0 && <button type="button" onClick={() => setAcik((x) => !x)} aria-label="Ayrıntılar" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.06] hover:text-white"><ChevronDown className={cn("h-4 w-4 transition-transform", acik && "rotate-180")} /></button>}
      </div>
      {siteler.length > 0 && (
        <div className="flex items-center gap-1 overflow-hidden border-t border-white/[0.05] px-3.5 py-2">
          <AnimatePresence initial={false}>
            {siteler.slice(0, 14).map((s) => <motion.span key={s} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} title={s} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={favicon(`https://${s}`)} alt="" className="h-3.5 w-3.5 rounded-[3px]" /></motion.span>)}
          </AnimatePresence>
          {siteler.length > 14 && <span className="ml-1 text-[11.5px] text-white/45">ve {siteler.length - 14} site daha</span>}
        </div>
      )}
      <AnimatePresence initial={false}>
        {(acik || (canli && !yaziyor)) && araclar.length > 0 && (
          <motion.ol initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="max-h-[260px] overflow-y-auto border-t border-white/[0.05] [scrollbar-width:thin]">
            {(acik ? [...araclar].reverse() : son).map((a) => (
              <li key={a.id} className="flex items-center gap-2.5 px-3.5 py-1.5 text-[12.5px]">
                {a.durum === "suruyor" ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#55d6fd]" /> : a.ad === "web_search" ? <Search className="h-3.5 w-3.5 shrink-0 text-white/45" /> : <Globe className="h-3.5 w-3.5 shrink-0 text-white/45" />}
                <span className="min-w-0 flex-1 truncate text-white/70">{a.ad === "web_search" ? (a.girdi?.Sorgu ? `"${a.girdi.Sorgu}"` : a.baslik) : a.sonuc?.tur === "sayfa" ? a.sonuc.baslik || alanAdi(a.sonuc.url) : a.girdi?.Adres ? alanAdi(a.girdi.Adres) : a.baslik}</span>
                {a.sonuc?.tur === "arama" && <span className="shrink-0 text-white/40">{a.sonuc.kaynaklar.length} sonuç</span>}
                {a.sonuc?.tur === "sayfa" && <span className="shrink-0 text-white/40">{alanAdi(a.sonuc.url)}</span>}
              </li>
            ))}
          </motion.ol>
        )}
      </AnimatePresence>
    </div>
  );
}

const basliklar = (md: string) => md.split("\n").map((l) => /^(#{1,3})\s+(.+)$/.exec(l)).filter((x): x is RegExpExecArray => !!x).map((x) => ({ d: x[1].length, ad: x[2].replace(/\[(\d+)\]\(#kaynak-\d+\)/g, "").replace(/[*_`]/g, "").trim() }));

/** Rapor üst kartı (tamamlanan araştırma): başlık, kaynak sayısı, tam ekran ve indirme. */
export function RaporKarti({ m, onizle }: { m: Mesaj; onizle: (h: string) => void }) {
  const [acik, setAcik] = useState(false);
  const d = useMemo(() => kaynakDizini(m.parcalar ?? []), [m.parcalar]);
  const md = useMemo(() => metinGruplari(m.parcalar ?? [], d).filter((x) => x.tur === "metin").map((x) => (x as { metin: string }).metin).join("\n\n"), [m.parcalar, d]);
  if (!md.trim()) return null;
  const b = basliklar(md);
  const ad = b.find((x) => x.d === 1)?.ad ?? (m.parcalar?.find((p) => p.tur === "plan") as PlanParca | undefined)?.baslik ?? "Araştırma raporu";
  const kelime = md.split(/\s+/).filter(Boolean).length;
  return (
    <>
      <div className="my-3 flex max-w-[640px] items-center gap-3 rounded-[18px] bg-gradient-to-br from-[#55d6fd]/[0.10] to-white/[0.02] p-3.5 ring-1 ring-inset ring-[#55d6fd]/20">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#55d6fd]/[0.16] text-[#8be6ff]"><BookOpen className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1"><span className="block truncate text-[14.5px] font-semibold text-white">{ad}</span><span className="block text-[12.5px] text-white/55">{b.filter((x) => x.d === 2).length} bölüm · {d.liste.length} kaynak · {kelime.toLocaleString("tr-TR")} kelime</span></span>
        <button type="button" onClick={() => indir(`${dosyaAdi(ad)}.md`, raporMarkdown(md, d))} title="Markdown olarak indir" aria-label="Markdown olarak indir" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.08] hover:text-white"><Download className="h-4 w-4" /></button>
        <button type="button" onClick={() => setAcik(true)} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black"><Maximize2 className="h-3.5 w-3.5" />Tam ekran</button>
      </div>
      <RaporPaneli acik={acik} kapat={() => setAcik(false)} ad={ad} md={md} d={d} onizle={onizle} />
    </>
  );
}

function raporMarkdown(md: string, d: KaynakDizini) {
  const t = md.replace(/\[(\d+)\]\(#kaynak-(\d+)\)/g, "[$1]");
  return d.liste.length ? `${t}\n\n## Kaynaklar\n\n${d.liste.map((k) => `${k.no}. [${k.baslik}](${k.url})`).join("\n")}\n` : t;
}

/** Tam ekran rapor: solda ana hat, ortada rapor, sağda kaynaklar. */
function RaporPaneli({ acik, kapat, ad, md, d, onizle }: { acik: boolean; kapat: () => void; ad: string; md: string; d: KaynakDizini; onizle: (h: string) => void }) {
  const govde = useRef<HTMLDivElement>(null);
  const b = basliklar(md).filter((x) => x.d > 1 || basliklar(md).filter((y) => y.d === 1).length > 1);
  const git = (i: number) => {
    const l = govde.current?.querySelectorAll("h2, h3, h4");
    const hepsi = basliklar(md);
    const k = hepsi.indexOf(b[i]);
    (l?.[k] as HTMLElement | undefined)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <SagPanel acik={acik} kapat={kapat} baslik={ad} alt={`${d.liste.length} kaynak`} ikon={<BookOpen className="h-[18px] w-[18px]" />} genislik={1240}
      ust={<button type="button" onClick={() => indir(`${dosyaAdi(ad)}.md`, raporMarkdown(md, d))} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[12.5px] text-white hover:bg-white/[0.12]"><Download className="h-3.5 w-3.5" /><span className="max-sm:hidden">Markdown indir</span></button>}>
      <div className="grid gap-5 lg:grid-cols-[200px_minmax(0,1fr)_240px]">
        <nav className="hidden lg:block">
          <div className="sticky top-0 space-y-0.5">
            <p className="px-2 pb-1 text-[12px] font-medium text-white/45">Ana hat</p>
            {b.map((x, i) => <button key={i} type="button" onClick={() => git(i)} className={cn("block w-full truncate rounded-[8px] px-2 py-1 text-left text-[12.5px] text-white/65 hover:bg-white/[0.05] hover:text-white", x.d === 3 && "pl-5 text-white/50")}>{x.ad}</button>)}
          </div>
        </nav>
        <div ref={govde} className="min-w-0 max-w-[760px]"><Md metin={md} onizle={onizle} kaynaklar={d.liste} /></div>
        <aside className="hidden lg:block">
          <div className="sticky top-0">
            <p className="px-1 pb-1.5 text-[12px] font-medium text-white/45">Kaynaklar</p>
            <ol className="space-y-1">
              {d.liste.map((k) => (
                <li key={k.url}><a href={k.url} target="_blank" rel="noopener noreferrer" className="flex gap-2 rounded-[10px] p-1.5 hover:bg-white/[0.05]">
                  <span className="mt-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#55d6fd]/[0.14] px-1 text-[10.5px] font-semibold text-[#8be6ff]">{k.no}</span>
                  <span className="min-w-0"><span className="line-clamp-2 block text-[12.5px] leading-snug text-white/85">{k.baslik}</span><span className="flex items-center gap-1 text-[11px] text-white/45">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={favicon(k.url)} alt="" className="h-3 w-3 rounded-[2px]" />{alanAdi(k.url)}</span></span>
                </a></li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </SagPanel>
  );
}
