"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle, Brain, Check, ChevronDown, Copy, Database, FileCode2, History, MessageSquare, MessagesSquare, FileMinus2, FilePen, FilePlus2, ImageIcon, Info, KeyRound, Loader2, MousePointer2,
  Monitor, Paintbrush, PenLine, PlugZap, RotateCcw, Smartphone, Sparkles, ThumbsDown, ThumbsUp, Wrench, X, Target, Workflow } from "lucide-react";
import { KrediJeton } from "@/components/ui/KrediHap";
import { modelBul, SAGLAYICILAR } from "@/lib/build/modeller";
import type { Adim, BuildMesaj, PlanKart, Proje, SoruKart, TasarimKart } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { SaglayiciLogo } from "../ModelSecici";
import { KisiAvatari } from "../ekip/ortak";
import type { CanliMesaj } from "./useProje";

const sn = (ms?: number) => {
  if (!ms || ms < 1000) return "";
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s} sn` : `${Math.floor(s / 60)} dk ${s % 60 ? `${s % 60} sn` : ""}`.trim();
};

/* ── Markdown (sohbet ölçüsünde) ── */
export const Md = memo(function Md({ metin, akiyor }: { metin: string; akiyor?: boolean }) {
  return (
    <div className={cn("build-md text-[14px] leading-[1.65] text-white/85", akiyor && "build-md-akiyor")}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5 marker:text-white/30">{children}</ul>,
        ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5 marker:text-white/40">{children}</ol>,
        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
        h1: ({ children }) => <p className="mb-1.5 mt-3 font-semibold text-white">{children}</p>,
        h2: ({ children }) => <p className="mb-1.5 mt-3 font-semibold text-white">{children}</p>,
        h3: ({ children }) => <p className="mb-1 mt-2.5 font-semibold text-white">{children}</p>,
        code: ({ children }) => <code className="rounded-[6px] bg-white/[0.08] px-1.5 py-0.5 font-mono text-[12.5px] text-white">{children}</code>,
        pre: ({ children }) => <pre className="my-2 overflow-x-auto rounded-[12px] bg-black/40 p-3 text-[12.5px] [&_code]:bg-transparent [&_code]:p-0">{children}</pre>,
        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#55d6fd] underline decoration-[#55d6fd]/30 underline-offset-2">{children}</a>,
      }}>{metin}</ReactMarkdown>
    </div>
  );
});

/* ── Adımlar ── */
function DusunceSatiri({ a }: { a: Adim }) {
  const [acik, setAcik] = useState(false);
  const suruyor = a.durum === "suruyor";
  return (
    <div>
      <button type="button" onClick={() => setAcik((x) => !x)} className="flex items-center gap-2 text-[13px] text-white/50 transition-colors hover:text-white/80">
        <Brain className={cn("h-3.5 w-3.5", suruyor && "animate-pulse")} />
        {suruyor ? <span className="build-parilti">Düşünüyor</span> : <span>{a.sure ? `${a.sure} sn düşündü` : "Düşündü"}</span>}
        <ChevronDown className={cn("h-3 w-3 transition-transform", acik && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {acik && a.ayrinti && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-1.5 max-h-[260px] overflow-y-auto border-l border-white/10 pl-3 text-[12.5px] leading-relaxed text-white/45 whitespace-pre-wrap">{a.ayrinti}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const DOSYA_IKON = { "dosya-yaz": FilePlus2, "dosya-duzenle": FilePen, "dosya-sil": FileMinus2 } as const;

function DosyaGrubu({ l, dosyaAc }: { l: Adim[]; dosyaAc?: (yol: string) => void }) {
  const tek = new Set(l.map((a) => a.yol)).size === 1;
  const [acik, setAcik] = useState(!tek && l.length <= 4);
  const ekle = l.reduce((t, a) => t + (a.ekle ?? 0), 0), sil = l.reduce((t, a) => t + (a.sil ?? 0), 0);
  const yollar = [...new Set(l.map((a) => a.yol))];
  return (
    <div className="overflow-hidden rounded-[14px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
      <button type="button" onClick={() => (tek ? l[0].yol && l[0].tur !== "dosya-sil" && dosyaAc?.(l[0].yol) : setAcik((x) => !x))} title={tek ? "Kodda aç" : undefined} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-white/[0.03]">
        <FileCode2 className="h-4 w-4 shrink-0 text-white/50" />
        <span className="flex-1 text-white/85">{yollar.length === 1 ? `${yollar[0]} ${l[0].tur === "dosya-yaz" && l[0].sil === 0 ? "oluşturuldu" : l[0].tur === "dosya-sil" ? "silindi" : "düzenlendi"}` : `${yollar.length} dosya değişti`}</span>
        <span className="shrink-0 text-[11.5px] tabular-nums"><span className="text-emerald-300/80">{ekle} ekleme</span>{sil > 0 && <span className="text-rose-300/70"> · {sil} silme</span>}</span>
        {!tek && <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-white/35 transition-transform", acik && "rotate-180")} />}
      </button>
      <AnimatePresence initial={false}>
        {acik && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="space-y-0.5 border-t border-white/[0.05] px-1.5 py-1.5">
              {l.map((a) => {
                const I = DOSYA_IKON[a.tur as keyof typeof DOSYA_IKON] ?? FileCode2;
                return (
                  <button key={a.id} type="button" onClick={() => a.yol && a.tur !== "dosya-sil" && dosyaAc?.(a.yol)} className="flex w-full items-center gap-2.5 rounded-[9px] px-2 py-1.5 text-left text-[12.5px] text-white/65 transition-colors hover:bg-white/[0.05] hover:text-white">
                    <I className="h-3.5 w-3.5 shrink-0 text-white/40" />
                    <span className="min-w-0 flex-1 truncate font-mono text-[12px]">{a.yol}</span>
                    <span className="shrink-0 tabular-nums text-[11px]">{(a.ekle ?? 0) > 0 && <span className="text-emerald-300/70">{a.ekle}</span>}{(a.sil ?? 0) > 0 && <span className="text-rose-300/60"> / {a.sil}</span>}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Tarayıcı testi kartı: adım adım ekran görüntüleri; tıklayınca sağdan büyük görüntüleyici açılır. */
function TestKarti({ a }: { a: Adim }) {
  const [acik, setAcik] = useState<number | null>(null);
  const l = a.testAdimlari ?? [];
  const mobil = a.cihaz === "mobil";
  const sec = acik !== null ? l[acik] : null;
  useEffect(() => {
    if (acik === null) return;
    const t = (e: KeyboardEvent) => { if (e.key === "Escape") setAcik(null); if (e.key === "ArrowRight") setAcik((i) => (i === null ? i : Math.min(l.length - 1, i + 1))); if (e.key === "ArrowLeft") setAcik((i) => (i === null ? i : Math.max(0, i - 1))); };
    addEventListener("keydown", t); return () => removeEventListener("keydown", t);
  }, [acik, l.length]);
  const Ikon = mobil ? Smartphone : Monitor;
  return (
    <div className="overflow-hidden rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px]", a.durum === "suruyor" ? "bg-white/[0.06] text-white/70" : a.durum === "hata" ? "bg-rose-500/[0.12] text-rose-200" : "bg-[#55d6fd]/[0.12] text-[#8be6ff]")}>
          {a.durum === "suruyor" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ikon className="h-3.5 w-3.5" />}
        </span>
        <span className={cn("min-w-0 flex-1 truncate text-[13px] text-white/85", a.durum === "suruyor" && "build-parilti")}>{a.baslik}</span>
      </div>
      {l.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-3 pb-3 [scrollbar-width:thin]">
          {l.map((x, i) => (
            <button key={i} type="button" onClick={() => setAcik(i)} title={x.ad} className="group w-[112px] shrink-0 text-left">
              <span className={cn("relative block overflow-hidden rounded-[10px] bg-white/[0.04] ring-1 ring-inset", mobil ? "aspect-[9/16]" : "aspect-[16/10]", x.durum === "kaldi" ? "ring-rose-400/70" : "ring-white/[0.1] group-hover:ring-white/40")}>
                {x.gorsel && /* eslint-disable-next-line @next/next/no-img-element */ <img src={x.gorsel} alt="" className="h-full w-full object-cover object-top" />}
                <span className={cn("absolute left-1.5 top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10.5px] font-semibold tabular-nums", x.durum === "kaldi" ? "bg-rose-500 text-white" : "bg-black/70 text-white")}>{i + 1}</span>
              </span>
              <span className={cn("mt-1 block truncate text-[11.5px]", x.durum === "kaldi" ? "text-rose-200" : "text-white/55")}>{x.ad}</span>
            </button>
          ))}
        </div>
      )}
      {a.ayrinti && <p className="whitespace-pre-wrap border-t border-white/[0.06] px-3 py-2 text-[12px] leading-relaxed text-amber-100/70">{a.ayrinti}</p>}
      <AnimatePresence>
        {sec && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAcik(null)} className="fixed inset-0 z-[120] bg-black/50" />
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 420, damping: 40 }} className="bd-panel fixed inset-y-0 right-0 z-[121] flex w-[min(760px,100vw)] flex-col rounded-l-[22px]">
              <header className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
                <div className="min-w-0 flex-1"><p className="truncate text-[15px] font-semibold text-white">{a.baslik}</p><p className="text-[12.5px] text-white/50">{acik! + 1}. adım, toplam {l.length} · {mobil ? "Mobil görünüm" : "Masaüstü görünüm"} · ok tuşlarıyla gez</p></div>
                <button type="button" aria-label="Kapat" onClick={() => setAcik(null)} className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto p-5 [scrollbar-width:thin]">
                <div className={cn("mx-auto overflow-hidden rounded-[14px] bg-white/[0.04] ring-1 ring-inset", mobil ? "max-w-[330px]" : "", sec.durum === "kaldi" ? "ring-rose-400/70" : "ring-white/[0.1]")}>
                  {sec.gorsel ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={sec.gorsel} alt={sec.ad} className="w-full" /> : <p className="p-10 text-center text-[13px] text-white/45">Bu adımda ekran görüntüsü yok</p>}
                </div>
                <p className={cn("mt-3 text-[14px] font-medium", sec.durum === "kaldi" ? "text-rose-200" : "text-white")}>{sec.ad}</p>
                {sec.hata && <p className="mt-1 text-[12.5px] leading-relaxed text-rose-200/80">{sec.hata}</p>}
                <div className="mt-4 space-y-1">
                  {l.map((x, i) => (
                    <button key={i} type="button" onClick={() => setAcik(i)} className={cn("flex w-full items-center gap-2.5 rounded-[11px] px-2.5 py-2 text-left text-[13px] transition-colors", i === acik ? "bg-white/[0.07] ring-1 ring-inset ring-white/70" : "hover:bg-white/[0.04]")}>
                      <span className={cn("flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10.5px] font-semibold tabular-nums", x.durum === "kaldi" ? "bg-rose-500 text-white" : "bg-white/[0.1] text-white/80")}>{i + 1}</span>
                      <span className={cn("min-w-0 flex-1 truncate", x.durum === "kaldi" ? "text-rose-200" : "text-white/80")}>{x.ad}</span>
                      <span className={cn("shrink-0 text-[11.5px]", x.durum === "kaldi" ? "text-rose-300" : "text-[#8be6ff]")}>{x.durum === "kaldi" ? "Kaldı" : "Geçti"}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Adımları sırayla çizer; ardışık dosya adımları tek kartta toplanır. */
function Adimlar({ adimlar, yaziliyor, dosyaAc }: { adimlar: Adim[]; yaziliyor?: CanliMesaj["yaziliyor"]; dosyaAc?: (yol: string) => void }) {
  const gruplar = useMemo(() => {
    const g: (Adim | Adim[])[] = [];
    for (const a of adimlar) {
      if (a.tur.startsWith("dosya")) { const son = g.at(-1); if (Array.isArray(son)) son.push(a); else g.push([a]); }
      else g.push(a);
    }
    return g;
  }, [adimlar]);
  return (
    <div className="space-y-2.5">
      {gruplar.map((x, i) => {
        if (Array.isArray(x)) return <DosyaGrubu key={x[0].id} l={x} dosyaAc={dosyaAc} />;
        if (x.tur === "dusunce") return <DusunceSatiri key={x.id} a={x} />;
        if (x.tur === "bilgi") {
          if (x.durum === "hata") return <p key={x.id} className="flex items-start gap-2 text-[12.5px] text-amber-200/70"><Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{x.baslik}{x.yol ? ` · ${x.yol}` : ""}</span></p>;
          return <Md key={x.id} metin={x.baslik} />;
        }
        if (x.tur === "test" && x.testAdimlari) return <TestKarti key={x.id} a={x} />;
        if (x.tur === "sistem") {
          return (
            <div key={x.id} className="rounded-[14px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
              <div className="flex items-center gap-2.5 px-3 py-2.5 text-[13px]">
                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px]", x.durum === "hata" ? "bg-rose-500/[0.12] text-rose-200" : "bg-[#55d6fd]/[0.12] text-[#8be6ff]")}>{x.durum === "suruyor" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Workflow className="h-3.5 w-3.5" />}</span>
                <span className="min-w-0 flex-1 truncate text-white/85">{x.baslik}</span>
                {x.baglanti && <a href={x.baglanti} className="inline-flex h-7 shrink-0 items-center rounded-full bg-white px-3 text-[12px] font-semibold text-black">Sistemi aç</a>}
              </div>
              {x.ayrinti && x.durum !== "suruyor" && <pre className="whitespace-pre-wrap border-t border-white/[0.06] px-3 py-2.5 font-sans text-[12.5px] leading-relaxed text-white/60">{x.ayrinti}</pre>}
            </div>
          );
        }
        if (x.tur === "veri") {
          return (
            <details key={x.id} className="group rounded-[14px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
              <summary className="flex cursor-pointer list-none items-center gap-2.5 px-3 py-2.5 text-[13px] [&::-webkit-details-marker]:hidden">
                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px]", x.durum === "hata" ? "bg-rose-500/[0.12] text-rose-200" : "bg-[#55d6fd]/[0.12] text-[#8be6ff]")}><Database className="h-3.5 w-3.5" /></span>
                <span className="min-w-0 flex-1 truncate text-white/85">{x.baslik}</span>
                {x.ayrinti && <ChevronDown className="h-3.5 w-3.5 shrink-0 text-white/40 transition-transform group-open:rotate-180" />}
              </summary>
              {x.ayrinti && <pre className="whitespace-pre-wrap border-t border-white/[0.06] px-3 py-2.5 font-sans text-[12.5px] leading-relaxed text-white/60">{x.ayrinti}</pre>}
            </details>
          );
        }
        if (x.tur === "gorsel") {
          return (
            <div key={x.id} className="flex items-center gap-3 rounded-[14px] bg-white/[0.03] p-2 pr-3 ring-1 ring-inset ring-white/[0.07]">
              {x.gorsel ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={x.gorsel} alt="" className="h-11 w-11 rounded-[10px] object-cover" /> : <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-white/[0.05]"><Loader2 className="h-4 w-4 animate-spin text-white/50" /></span>}
              <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5 text-[13px] text-white/85"><ImageIcon className="h-3.5 w-3.5 text-white/45" />{x.baslik}</span>{x.ayrinti && <span className="block truncate text-[12px] text-white/40">{x.ayrinti}</span>}</span>
            </div>
          );
        }
        return <p key={x.id ?? i} className="text-[13px] text-white/60">{x.baslik}</p>;
      })}
      {yaziliyor && (
        <div className="flex items-center gap-2.5 rounded-[14px] bg-white/[0.03] px-3 py-2.5 text-[13px] ring-1 ring-inset ring-white/[0.07]">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#55d6fd]" />
          <span className="build-parilti min-w-0 flex-1 truncate">
            {yaziliyor.arac === "dosya_yaz" || yaziliyor.arac === "dosya_duzenle" ? (yaziliyor.yol ? <><span className="font-mono text-[12px]">{yaziliyor.yol}</span> {yaziliyor.arac === "dosya_yaz" ? "yazılıyor" : "düzenleniyor"}</> : "Dosya hazırlanıyor")
              : yaziliyor.arac === "gorsel_uret" ? "Görsel hazırlanıyor" : yaziliyor.arac === "dosya_oku" ? "Dosyalar okunuyor" : yaziliyor.arac === "plan_sun" ? "Plan hazırlanıyor" : yaziliyor.arac === "soru_sor" ? "Sorular hazırlanıyor" : yaziliyor.arac === "veritabani" ? "Veritabanı hazırlanıyor" : yaziliyor.arac === "tarayici_testi" ? "Test adımları hazırlanıyor" : "Çalışıyor"}
          </span>
          {yaziliyor.karakter > 0 && <span className="shrink-0 text-[11.5px] tabular-nums text-white/40">{(yaziliyor.karakter / 1024).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} KB</span>}
        </div>
      )}
    </div>
  );
}

/* ── Plan kartı ── */
function PlanKarti({ plan, onayla, duzenle, canli, belge }: { plan: PlanKart; onayla?: () => void; duzenle?: () => void; canli?: boolean; belge?: () => void }) {
  return (
    <div className="rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.08]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[14px] font-semibold text-white">{plan.baslik}</p>
        <span className="flex shrink-0 items-center gap-1.5">{!!plan.onceki?.length && <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] tabular-nums text-white/55">Sürüm {plan.onceki.length + 1}</span>}{plan.durum === "onaylandi" && <span className="flex items-center gap-1 rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] text-white/80"><Check className="h-3 w-3" />Onaylandı</span>}</span>
      </div>
      {plan.neden && <p className="mt-1.5 text-[13px] leading-relaxed text-white/60">{plan.neden}</p>}
      <ol className="mt-3 space-y-1.5 text-[13px] text-white/75">
        {plan.adimlar.map((s, i) => <li key={i} className="flex gap-2.5"><span className="w-4 shrink-0 text-right tabular-nums text-white/35">{i + 1}</span><span>{s}</span></li>)}
      </ol>
      <div className="mt-3 space-y-1 border-t border-white/[0.06] pt-3 text-[12.5px] text-white/50">
        {plan.bitti && <p><span className="text-white/70">Bitti sayılır:</span> {plan.bitti}</p>}
        {plan.kapsamDisi && <p><span className="text-white/70">Kapsam dışı:</span> {plan.kapsamDisi}</p>}
        <p className="flex items-center gap-1"><span className="text-white/70">Tahmini maliyet:</span> <KrediJeton boyut={11} />{plan.tahmin.toLocaleString("tr-TR")} kredi</p>
      </div>
      {plan.durum === "bekliyor" && !canli && (
        <div className="mt-3.5 flex gap-2">
          <button type="button" onClick={onayla} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black transition-opacity hover:opacity-90"><Sparkles className="h-3.5 w-3.5" />Onayla ve yap</button>
          <button type="button" onClick={belge ?? duzenle} className="inline-flex h-9 items-center rounded-full bg-white/[0.07] px-4 text-[13px] font-medium text-white ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.12]">Belgeyi aç</button>
        </div>
      )}
      {plan.durum !== "bekliyor" && belge && !canli && <button type="button" onClick={belge} className="mt-3 text-[12.5px] text-white/55 underline-offset-2 hover:text-white hover:underline">Plan belgesini aç</button>}
    </div>
  );
}

/* ── Görselli soru kartı ── */
const yuklenenFontlar = new Set<string>();
function fontYukle(ad?: string) {
  if (!ad || yuklenenFontlar.has(ad) || typeof document === "undefined") return;
  yuklenenFontlar.add(ad);
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(ad).replace(/%20/g, "+")}:wght@400;600&display=swap`;
  document.head.appendChild(l);
}

/** Tek dosyalık tasarımı kutu genişliğine göre ölçekleyen küçük önizleme (1280 genişlikte çizilir). */
function KucukOnizleme({ html }: { html: string }) {
  const kutu = useRef<HTMLSpanElement>(null);
  const [o, setO] = useState(0.3);
  useEffect(() => { const k = kutu.current; if (!k) return; const r = new ResizeObserver(() => setO(k.offsetWidth / 1280)); r.observe(k); return () => r.disconnect(); }, []);
  return <span ref={kutu} className="absolute inset-0 overflow-hidden"><iframe title="Tasarım önizlemesi" srcDoc={html} sandbox="" loading="lazy" style={{ width: 1280, height: 800, transform: "scale(" + o + ")", transformOrigin: "0 0" }} className="pointer-events-none absolute left-0 top-0 border-0 bg-white" /></span>;
}

/** Tasarım yönleri: önizlemeler alt alta; tıklayınca büyük görünüm, "Bunu seç" ile ajan o yönde kurar. */
function TasarimKarti({ t, sec }: { t: TasarimKart; sec?: (i: number) => void }) {
  const [buyuk, setBuyuk] = useState<number | null>(null);
  const bitti = t.durum === "secildi";
  return (
    <div className="rounded-[18px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.08]">
      <p className="flex items-center gap-2 text-[13.5px] font-semibold text-white"><Paintbrush className="h-4 w-4 text-[#8be6ff]" />{bitti ? "Tasarım seçildi" : "Bir tasarım yönü seç"}</p>
      <div className="mt-3 grid gap-2.5">
        {t.secenekler.map((x, i) => (
          <div key={i} className={cn("overflow-hidden rounded-[14px] ring-inset transition-opacity", t.secilen === i ? "ring-2 ring-white" : "ring-1 ring-white/[0.1]", bitti && t.secilen !== i && "opacity-45")}>
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-white"><KucukOnizleme html={x.html} /><button type="button" onClick={() => setBuyuk(i)} className="absolute inset-0 cursor-zoom-in" aria-label={x.ad + " önizlemesini büyüt"} /></div>
            <div className="flex items-center gap-2 px-3 py-2.5">
              <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium text-white">{x.ad}</span><span className="block text-[12px] leading-snug text-white/50">{x.aciklama}</span></span>
              {!bitti && sec && <button type="button" onClick={() => sec(i)} className="h-8 shrink-0 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black">Bunu seç</button>}
            </div>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {buyuk !== null && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setBuyuk(null)} className="fixed inset-0 z-[120] bg-black/55" />
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 420, damping: 40 }} className="bd-panel fixed inset-y-0 right-0 z-[121] flex w-[min(1000px,100vw)] flex-col rounded-l-[22px]">
              <header className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
                <div className="min-w-0 flex-1"><p className="truncate text-[15px] font-semibold text-white">{t.secenekler[buyuk].ad}</p><p className="truncate text-[12.5px] text-white/50">{t.secenekler[buyuk].aciklama}</p></div>
                {!bitti && sec && <button type="button" onClick={() => { sec(buyuk); setBuyuk(null); }} className="h-9 rounded-full bg-white px-4 text-[13px] font-semibold text-black">Bunu seç</button>}
                <button type="button" aria-label="Kapat" onClick={() => setBuyuk(null)} className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>
              </header>
              <div className="min-h-0 flex-1 overflow-hidden p-4"><iframe title="Tasarım" srcDoc={t.secenekler[buyuk].html} sandbox="" className="h-full w-full rounded-[14px] border-0 bg-white" /></div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Hedef kipi şeridi: hedef, harcanan ve tavan kredi, durum. */
function HedefSeridi({ h }: { h: NonNullable<BuildMesaj["hedef"]> }) {
  const oran = Math.min(1, h.harcanan / Math.max(1, h.tavan));
  const durum = h.durum === "tamam" ? "Hedef tamamlandı" : h.durum === "tavan" ? "Kredi tavanına gelindi" : h.durum === "durdu" ? "Hedef durdu" : "Hedef üzerinde çalışıyor";
  return (
    <div className="rounded-[14px] bg-[#55d6fd]/[0.05] px-3 py-2.5 ring-1 ring-inset ring-[#55d6fd]/15">
      <p className="flex items-center gap-2 text-[12.5px] text-white/85"><Target className="h-3.5 w-3.5 shrink-0 text-[#8be6ff]" /><span className="font-medium">{durum}</span><span className="ml-auto tabular-nums text-white/50">{h.harcanan} / {h.tavan} kredi</span></p>
      <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-white/50">{h.metin}</p>
      <span className="mt-2 block h-1 overflow-hidden rounded-full bg-white/[0.08]"><span className={cn("block h-full rounded-full transition-[width] duration-500", h.durum === "tavan" ? "bg-amber-300/80" : "bg-[#55d6fd]")} style={{ width: `${Math.max(3, oran * 100)}%` }} /></span>
    </div>
  );
}

/** Ajan izin kartı: tek tıkla izin ver, her zaman izin ver ya da reddet (Ayarlar, Ajan izinleri). */
function IzinKarti({ soru, gonder }: { soru: SoruKart; gonder?: (c: Record<string, string>) => void }) {
  const s = soru.sorular[0];
  const bitti = soru.durum === "cevaplandi";
  const sec = (c: string) => gonder?.({ [s.id]: c });
  return (
    <div className="rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.1]">
      <p className="flex items-center gap-2 text-[13.5px] font-semibold text-white"><span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-amber-300/[0.12] text-amber-200"><KeyRound className="h-3.5 w-3.5" /></span>İzin gerekiyor</p>
      <p className="mt-2 text-[13.5px] leading-relaxed text-white/75">{s.soru.replace(" İzin veriyor musun?", "")}</p>
      {bitti ? <p className="mt-3 text-[12.5px] text-white/50">Cevabın: <span className="text-white/80">{s.cevap}</span></p> : (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button type="button" disabled={!gonder} onClick={() => sec("İzin ver")} className="h-9 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-40">İzin ver</button>
          <button type="button" disabled={!gonder} onClick={() => sec("Her zaman izin ver")} className="h-9 rounded-full bg-white/[0.08] px-4 text-[13px] text-white ring-1 ring-inset ring-white/[0.1] hover:bg-white/[0.12] disabled:opacity-40">Her zaman izin ver</button>
          <button type="button" disabled={!gonder} onClick={() => sec("İzin verme")} className="h-9 rounded-full px-3.5 text-[13px] text-white/60 hover:bg-white/[0.06] hover:text-white disabled:opacity-40">İzin verme</button>
        </div>
      )}
    </div>
  );
}

function SoruKarti(p: { soru: SoruKart; gonder?: (c: Record<string, string>) => void; canli?: boolean }) {
  return p.soru.sorular.length === 1 && p.soru.sorular[0].id.startsWith("izin:") ? <IzinKarti soru={p.soru} gonder={p.gonder} /> : <SecenekKarti {...p} />;
}

function SecenekKarti({ soru, gonder, canli }: { soru: SoruKart; gonder?: (c: Record<string, string>) => void; canli?: boolean }) {
  const [secim, setSecim] = useState<Record<string, string>>(() => Object.fromEntries(soru.sorular.filter((s) => s.cevap).map((s) => [s.id, s.cevap!])));
  const [ozel, setOzel] = useState<Record<string, string>>({});
  useEffect(() => { soru.sorular.forEach((s) => s.secenekler.forEach((o) => fontYukle(o.font))); }, [soru]);
  const bitti = soru.durum === "cevaplandi";
  const hazir = soru.sorular.every((s) => secim[s.id] || ozel[s.id]?.trim());
  return (
    <div className="rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.08]">
      <p className="mb-3 flex items-center gap-2 text-[13.5px] font-semibold text-white"><Paintbrush className="h-4 w-4 text-white/55" />{bitti ? "Tercihlerin" : "Başlamadan önce birkaç tercih"}</p>
      <div className="space-y-4">
        {soru.sorular.map((s) => (
          <div key={s.id}>
            <p className="mb-2 text-[13px] text-white/70">{s.soru}</p>
            <div className="grid grid-cols-2 gap-2">
              {s.secenekler.map((o) => {
                const sec = (secim[s.id] ?? s.cevap) === o.ad;
                return (
                  <button key={o.ad} type="button" disabled={bitti || canli} onClick={() => { setSecim((x) => ({ ...x, [s.id]: o.ad })); setOzel((x) => ({ ...x, [s.id]: "" })); }}
                    className={cn("rounded-[12px] bg-white/[0.04] p-2.5 text-left ring-1 ring-inset transition-[box-shadow,background-color]", sec ? "bg-white/[0.07] ring-white/80" : "ring-white/[0.07] hover:bg-white/[0.06]", (bitti || canli) && !sec && "opacity-45")}>
                    {o.renkler?.length ? <span className="flex gap-1">{o.renkler.map((r) => <span key={r} className="h-5 w-5 rounded-full ring-1 ring-inset ring-white/10" style={{ background: r }} />)}</span> : null}
                    {o.font ? <span className="block text-[20px] leading-none text-white" style={{ fontFamily: `'${o.font}', system-ui` }}>Aa</span> : null}
                    <span className={cn("block text-[12.5px] text-white/75", (o.renkler?.length || o.font) && "mt-1.5")}>{o.ad}</span>
                  </button>
                );
              })}
            </div>
            {!bitti && !canli && (
              <input value={ozel[s.id] ?? ""} onChange={(e) => { setOzel((x) => ({ ...x, [s.id]: e.target.value })); if (e.target.value) setSecim((x) => { const y = { ...x }; delete y[s.id]; return y; }); }}
                placeholder="Özel: kendin yaz" className={cn("mt-2 h-9 w-full rounded-[10px] bg-white/[0.04] px-3 text-[12.5px] text-white outline-none ring-1 ring-inset placeholder:text-white/30", ozel[s.id] ? "ring-white/80" : "ring-white/[0.07] focus:ring-white/25")} />
            )}
          </div>
        ))}
      </div>
      {!bitti && !canli && (
        <div className="mt-4 flex items-center gap-2">
          <button type="button" disabled={!hazir} onClick={() => gonder?.(Object.fromEntries(soru.sorular.map((s) => [s.id, ozel[s.id]?.trim() || secim[s.id]])))} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black transition-opacity disabled:opacity-35">Devam et</button>
          <button type="button" onClick={() => gonder?.(Object.fromEntries(soru.sorular.map((s) => [s.id, "Sen karar ver"])))} className="inline-flex h-9 items-center rounded-full px-3 text-[13px] font-medium text-white/60 hover:bg-white/[0.06] hover:text-white">Sen karar ver</button>
        </div>
      )}
    </div>
  );
}

/* ── Bağlantı gerekli (dürüst durum) ── */
export function AnahtarYok({ modelId, tekrar, modelDegistir, sohbet }: { modelId: string; tekrar: () => void; modelDegistir: () => void; sohbet?: boolean }) {
  const m = modelBul(modelId);
  const s = SAGLAYICILAR[m.saglayici];
  const anahtar = m.saglayici === "anthropic" ? "ANTHROPIC_API_KEY" : s.anahtar ? `${s.anahtar} ya da OPENROUTER_API_KEY` : "OPENROUTER_API_KEY";
  return (
    <div className="rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.08]">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-white/[0.06]"><PlugZap className="h-4 w-4 text-white/70" /></span>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-white">{m.ad} bu sunucuya bağlı değil</p>
          <p className="text-[12.5px] text-white/50">İsteğin kaydedildi, kaybolmadı.</p>
        </div>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-white/65">{sohbet ? "Bu modelin cevap verebilmesi için" : "Ajanın çalışması için"} yöneticinin sunucuya <code className="rounded-[6px] bg-white/[0.08] px-1.5 py-0.5 font-mono text-[12px] text-white">{anahtar}</code> anahtarını eklemesi gerekiyor. Eklendiğinde aynı isteği tek tuşla yeniden gönderebilirsin. {sohbet ? "Bu sırada bağlı başka bir modelle devam edebilirsin." : "Bu sırada şablonları, kod düzenleyiciyi, yayınlamayı ve alan adı bağlamayı kullanabilirsin."}</p>
      <div className="mt-3.5 flex flex-wrap gap-2">
        <button type="button" onClick={tekrar} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black hover:opacity-90"><RotateCcw className="h-3.5 w-3.5" />Tekrar gönder</button>
        <button type="button" onClick={modelDegistir} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[13px] font-medium text-white ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.12]"><KeyRound className="h-3.5 w-3.5" />Başka model seç</button>
      </div>
    </div>
  );
}

/* ── Mesajlar ── */
type Eylemler = {
  dosyaAc: (yol: string) => void;
  surumAc: (surumId: string) => void;
  geriAl: (surumId: string) => void;
  planOnayla: (m: BuildMesaj) => void;
  planDegistir: (m: BuildMesaj) => void;
  /** Plan belgesini sağ panelde aç (düzenle, sürümler, seçili kısma yorum). */
  planBelge?: (m: BuildMesaj) => void;
  soruCevapla: (m: BuildMesaj, c: Record<string, string>) => void;
  tasarimSec?: (m: BuildMesaj, i: number) => void;
  tekrar: (m: BuildMesaj) => void;
  modelDegistir: () => void;
  oneri: (s: string) => void;
  ogeVurgula: (secici: string) => void;
  /** Son kullanıcı mesajını düzenle: o turun değişikliklerini geri alır ve yeni metinle yeniden gönderir. */
  duzenle: (m: BuildMesaj, metin: string) => void;
  /** Bu mesaja geri dön: sonrakiler silinir; kod açıksa dosyalar da o noktaya döner. */
  geriDon?: (m: BuildMesaj, kod: boolean) => Promise<void>;
  /** Seçili öğenin kaynak satırını Kod sekmesinde aç. */
  kodSatiri?: (dosya: string, satir: number) => void;
};

function KullaniciMesaji({ m, ogeVurgula, duzenle, yazarGoster, kodSatiri }: { m: BuildMesaj; ogeVurgula: (s: string) => void; duzenle?: (metin: string) => void; yazarGoster?: boolean; kodSatiri?: (dosya: string, satir: number) => void }) {
  const [taslak, setTaslak] = useState<string | null>(null);
  if (taslak !== null) {
    return (
      <div className="ml-8 rounded-[18px] bg-white/[0.06] p-2 ring-1 ring-inset ring-white/25">
        <textarea autoFocus value={taslak} onChange={(e) => setTaslak(e.target.value)} rows={Math.min(8, Math.max(2, taslak.split(String.fromCharCode(10)).length))}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (taslak.trim()) { duzenle?.(taslak.trim()); setTaslak(null); } } if (e.key === "Escape") setTaslak(null); }}
          className="block w-full resize-none bg-transparent px-2 py-1 text-[14px] leading-relaxed text-white outline-none" />
        <div className="mt-1 flex items-center justify-end gap-1.5">
          <span className="mr-auto px-2 text-[11.5px] text-white/40">Bu turun değişiklikleri geri alınır</span>
          <button type="button" onClick={() => setTaslak(null)} className="h-8 rounded-full px-3 text-[12.5px] text-white/65 hover:bg-white/[0.07] hover:text-white">Vazgeç</button>
          <button type="button" disabled={!taslak.trim()} onClick={() => { duzenle?.(taslak.trim()); setTaslak(null); }} className="h-8 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black disabled:opacity-35">Geri al ve gönder</button>
        </div>
      </div>
    );
  }
  return (
    <div className="group/m ml-8 flex flex-col items-end gap-1.5">
      {yazarGoster && m.yazar && <span className="flex max-w-full items-center gap-1.5 pr-1 text-[11.5px] text-white/50"><KisiAvatari ad={m.yazar} boyut={16} /><span className="truncate">{m.yazar}</span></span>}
      {m.ekler?.length ? <div className="flex flex-wrap justify-end gap-1.5">{m.ekler.map((e, i) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={i} src={e.url} alt={e.ad} className="h-20 w-20 rounded-[12px] object-cover ring-1 ring-inset ring-white/10" />)}</div> : null}
      {m.belgeler?.length ? <div className="flex flex-wrap justify-end gap-1.5">{m.belgeler.map((b, i) => (
        <a key={i} href={b.url} target="_blank" rel="noopener noreferrer" className="flex h-11 max-w-[220px] items-center gap-2 rounded-[12px] bg-white/[0.06] pl-2 pr-3 ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.09]">
          <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px]", b.tur === "pdf" ? "bg-rose-400/15 text-rose-200" : "bg-[#55d6fd]/[0.14] text-[#8be6ff]")}><FileCode2 className="h-3.5 w-3.5" /></span>
          <span className="min-w-0"><span className="block truncate text-[12.5px] text-white">{b.ad}</span><span className="block text-[11px] text-white/45">{b.tur === "pdf" ? "PDF" : "Metin"}</span></span>
        </a>
      ))}</div> : null}
      {m.oge && (
        <span className="flex max-w-full flex-wrap justify-end gap-1">
          <button type="button" onClick={() => ogeVurgula(m.oge!.secici)} className="flex max-w-full items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 py-1 text-[12px] text-white/55 hover:text-white"><MousePointer2 className="h-3 w-3 shrink-0" /><span className="truncate">{m.oge.etiket}{m.oge.metin ? ` · ${m.oge.metin.slice(0, 36)}` : ""}</span></button>
          {m.oge.konum && <button type="button" title="Kodda aç" onClick={() => kodSatiri?.(m.oge!.konum!.dosya, m.oge!.konum!.satir)} className="flex items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 py-1 font-mono text-[11.5px] text-white/55 hover:text-white"><FileCode2 className="h-3 w-3 shrink-0" />{m.oge.konum.dosya} satır {m.oge.konum.satir}{m.oge.konum.sonSatir && m.oge.konum.sonSatir !== m.oge.konum.satir ? `-${m.oge.konum.sonSatir}` : ""}</button>}
        </span>
      )}
      {m.duzeltme ? (
        <div className="flex items-center gap-2 rounded-[18px] rounded-tr-[6px] bg-white/[0.08] px-4 py-2.5 text-[14px] text-white"><Wrench className="h-3.5 w-3.5 text-white/60" />Hatayı düzelt</div>
      ) : m.metin ? (
        <div className="flex min-w-0 max-w-full items-start gap-1">
          {duzenle && <button type="button" title="Düzenle ve yeniden gönder" onClick={() => setTaslak(m.metin)} className="mt-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/40 opacity-0 transition-opacity hover:bg-white/[0.07] hover:text-white group-hover/m:opacity-100 max-md:opacity-100"><PenLine className="h-3.5 w-3.5" /></button>}
          <div className="min-w-0 whitespace-pre-wrap break-words [overflow-wrap:anywhere] rounded-[18px] rounded-tr-[6px] bg-white/[0.08] px-4 py-2.5 text-[14px] leading-relaxed text-white">{m.metin}</div>
        </div>
      ) : null}
    </div>
  );
}

function AsistanMesaji({ m, canli, sonMu, proje, e, geriDonulebilir }: { m: BuildMesaj | CanliMesaj; canli?: boolean; sonMu: boolean; proje: Proje; e: Eylemler; geriDonulebilir?: boolean }) {
  const [kopyalandi, setKopyalandi] = useState(false);
  const [geriKart, setGeriKart] = useState(false);
  const [geriGidiyor, setGeriGidiyor] = useState<"" | "mesaj" | "kod">("");
  const [oy, setOy] = useState<1 | -1 | 0>(0);
  const c = canli ? (m as CanliMesaj) : null;
  const surum = m.surumId ? proje.surumler.find((s) => s.id === m.surumId) : null;
  const onceki = surum ? proje.surumler[proje.surumler.findIndex((s) => s.id === surum.id) - 1] : null;
  const model = m.model ? modelBul(m.model) : null;

  if (m.durum === "anahtar-yok") return <AnahtarYok modelId={m.metin || m.model || ""} tekrar={() => e.tekrar(m)} modelDegistir={e.modelDegistir} />;

  return (
    <div className="space-y-3">
      {(m.adimlar?.length || c?.yaziliyor) ? <Adimlar adimlar={m.adimlar ?? []} yaziliyor={c?.yaziliyor} dosyaAc={e.dosyaAc} /> : null}
      {canli && !m.adimlar?.length && !c?.canliMetin && !c?.yaziliyor && (
        <p className="flex items-center gap-2 text-[13px] text-white/50"><span className="build-nokta" /><span className="build-parilti">{model ? `${model.ad} başlıyor` : "Başlıyor"}</span></p>
      )}
      {(m.plan || m.soru) && (c?.canliMetin || m.metin) && <Md metin={c?.canliMetin || m.metin} akiyor={canli} />}
      {m.plan && <PlanKarti plan={m.plan} canli={canli} onayla={() => e.planOnayla(m)} duzenle={() => e.planDegistir(m)} belge={e.planBelge ? () => e.planBelge!(m) : undefined} />}
      {m.soru && <SoruKarti soru={m.soru} canli={canli} gonder={(cv) => e.soruCevapla(m, cv)} />}
      {m.hedef && <HedefSeridi h={m.hedef} />}
      {m.tasarim && <TasarimKarti t={m.tasarim} sec={canli || !e.tasarimSec ? undefined : (i) => e.tasarimSec!(m, i)} />}
      {!m.plan && !m.soru && (c?.canliMetin || m.metin) && <Md metin={c?.canliMetin || m.metin} akiyor={canli} />}
      {m.durum === "hata" && (
        <div className="flex items-start gap-2.5 rounded-[14px] bg-rose-500/[0.07] px-3.5 py-3 text-[13px] text-rose-200/90 ring-1 ring-inset ring-rose-400/15">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{m.hata ?? "Bir sorun çıktı."}</span>
          {sonMu && <button type="button" onClick={() => e.tekrar(m)} className="shrink-0 rounded-full bg-white/[0.08] px-2.5 py-1 text-[12px] text-white hover:bg-white/[0.14]">Tekrar dene</button>}
        </div>
      )}
      {m.durum === "durduruldu" && <p className="flex items-center gap-1.5 text-[12.5px] text-white/45"><Info className="h-3.5 w-3.5" />Durduruldu. Bu ana kadar yapılanlar kaydedildi.</p>}
      {!canli && m.durum !== "suruyor" && (
        <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5 text-[12px] text-white/40">
          {model && <span className="mr-1 flex items-center gap-1.5"><SaglayiciLogo m={model} boyut={12} />{model.ad}</span>}
          {sn(m.sureMs) ? <span>· {sn(m.sureMs)}</span> : null}
          {m.kredi != null && <span className="flex items-center gap-1">· {m.duzeltme ? "Ücretsiz düzeltme" : <><KrediJeton boyut={10} />{m.kredi.toLocaleString("tr-TR")} kredi</>}</span>}
          <span className="ml-auto flex items-center">
            {surum && onceki && sonMu && <button type="button" title={`Bu değişikliği geri al (Sürüm ${onceki.no}'e dön)`} onClick={() => e.geriAl(onceki.id)} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/[0.06] hover:text-white"><RotateCcw className="h-3.5 w-3.5" /></button>}
            {m.metin && <button type="button" title="Kopyala" onClick={() => { navigator.clipboard?.writeText(m.metin); setKopyalandi(true); setTimeout(() => setKopyalandi(false), 1400); }} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/[0.06] hover:text-white">{kopyalandi ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>}
            <button type="button" title="İyi" onClick={() => setOy(oy === 1 ? 0 : 1)} className={cn("flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/[0.06] hover:text-white", oy === 1 && "text-white")}><ThumbsUp className="h-3.5 w-3.5" /></button>
            <button type="button" title="Kötü" onClick={() => setOy(oy === -1 ? 0 : -1)} className={cn("flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/[0.06] hover:text-white", oy === -1 && "text-white")}><ThumbsDown className="h-3.5 w-3.5" /></button>
            {geriDonulebilir && e.geriDon && <button type="button" title="Sohbeti bu noktaya geri al" aria-pressed={geriKart} onClick={() => setGeriKart((x) => !x)} className={cn("flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/[0.06] hover:text-white", geriKart && "text-white ring-1 ring-inset ring-white/60")}><History className="h-3.5 w-3.5" /></button>}
            {surum && <button type="button" onClick={() => e.surumAc(surum.id)} className="ml-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] text-white/70 transition-colors hover:bg-white/[0.1] hover:text-white">Sürüm {surum.no}</button>}
          </span>
        </div>
      )}
      <AnimatePresence initial={false}>
        {geriKart && e.geriDon && (() => {
          const l = proje.mesajlar; const i = l.findIndex((x) => x.id === m.id);
          const sonraki = i >= 0 ? l.slice(i + 1).filter((x) => !x.ayrac).length : 0;
          const sid = [...l.slice(0, i + 1)].reverse().find((x) => x.surumId)?.surumId;
          const hedef = (sid ? proje.surumler.find((x) => x.id === sid) : null) ?? proje.surumler[0];
          const kodAyni = !hedef || hedef.id === proje.surumler.at(-1)?.id;
          const git = async (kod: boolean) => { setGeriGidiyor(kod ? "kod" : "mesaj"); try { await e.geriDon!(m as BuildMesaj, kod); setGeriKart(false); } finally { setGeriGidiyor(""); } };
          return (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="rounded-[16px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.1]">
                <p className="text-[13px] font-semibold text-white">Bu noktaya geri dön</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-white/50">Sonraki {sonraki} mesaj silinir. Ajan konuşmayı bu noktadan itibaren hatırlar.</p>
                <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
                  <button type="button" disabled={!!geriGidiyor} onClick={() => git(false)} className="rounded-[12px] bg-white/[0.04] p-2.5 text-left ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.07] disabled:opacity-50">
                    <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-white">{geriGidiyor === "mesaj" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5 text-white/55" />}Yalnız mesajlar</span>
                    <span className="mt-0.5 block text-[11.5px] leading-snug text-white/45">Kod olduğu gibi kalır; yalnız sohbet geri alınır.</span>
                  </button>
                  <button type="button" disabled={!!geriGidiyor || kodAyni} onClick={() => git(true)} className="rounded-[12px] bg-white/[0.04] p-2.5 text-left ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.07] disabled:opacity-50">
                    <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-white">{geriGidiyor === "kod" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5 text-white/55" />}Mesajlar ve kod</span>
                    <span className="mt-0.5 block text-[11.5px] leading-snug text-white/45">{kodAyni ? "Kod zaten bu noktadaki hâlinde." : `Dosyalar Sürüm ${hedef!.no} hâline döner; yeni sürüm olarak kaydedilir.`}</span>
                  </button>
                </div>
                <button type="button" onClick={() => setGeriKart(false)} className="mt-2 text-[12px] text-white/50 hover:text-white">Vazgeç</button>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
      {sonMu && !canli && m.oneriler?.length ? (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {m.oneriler.map((s) => <button key={s} type="button" onClick={() => e.oneri(s)} className="rounded-full bg-white/[0.04] px-3 py-1.5 text-[12.5px] text-white/75 ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.08] hover:text-white">{s}</button>)}
        </div>
      ) : null}
    </div>
  );
}

/** Sohbet ayracı: yeni sohbet ya da bir noktaya geri dönüş. */
function Ayrac({ m }: { m: BuildMesaj }) {
  const a = m.ayrac!;
  const metin = a.tur === "yeni-sohbet" ? "Yeni sohbet başladı. Ajan önceki konuşmayı görmez; proje, dosyalar ve hafıza aynen duruyor."
    : `Bu noktaya geri dönüldü${a.silinen ? `, ${a.silinen} mesaj silindi` : ""}. ${a.kod ? `Kod Sürüm ${a.surumNo ?? ""} hâline döndü.` : "Kod olduğu gibi kaldı."}`;
  return (
    <div className="flex items-center gap-3 py-1 text-[12px] text-white/45">
      <span className="h-px flex-1 bg-white/[0.08]" />
      <span className="flex max-w-[85%] items-center gap-1.5 text-center leading-snug">{a.tur === "yeni-sohbet" ? <MessagesSquare className="h-3.5 w-3.5 shrink-0 text-[#8be6ff]" /> : <History className="h-3.5 w-3.5 shrink-0 text-[#8be6ff]" />}{metin}</span>
      <span className="h-px flex-1 bg-white/[0.08]" />
    </div>
  );
}

export function SohbetAkisi({ proje, canli, eylemler, bos, calisiyor }: { proje: Proje; canli: CanliMesaj | null; eylemler: Eylemler; bos?: React.ReactNode; calisiyor?: boolean }) {
  const kutu = useRef<HTMLDivElement>(null);
  const dipte = useRef(true);
  const tum = proje.mesajlar;
  // Yeni sohbetten önceki mesajlar katlanır (istenirse açılır); ajan onları zaten görmez.
  const ayracI = tum.map((m) => m.ayrac?.tur).lastIndexOf("yeni-sohbet");
  const [eskiAcik, setEskiAcik] = useState(false);
  const mesajlar = ayracI > 0 && !eskiAcik ? tum.slice(ayracI) : tum;
  const gizli = ayracI > 0 && !eskiAcik ? tum.slice(0, ayracI).filter((m) => !m.ayrac).length : 0;
  const sonAsistan = [...mesajlar].reverse().find((m) => m.rol === "asistan" && !m.ayrac)?.id;
  const sonKullanici = [...mesajlar].reverse().find((m) => m.rol === "kullanici")?.id;
  // Ekipte birden çok kişi varsa kullanıcı mesajlarının üstünde yazarın adı görünür; izleyici mesaj düzenleyemez.
  const yazarGoster = (proje.ekipSayisi ?? 0) > 0 || new Set(mesajlar.map((m) => m.yazar).filter(Boolean)).size > 1;
  const izleyici = proje.ekipRol === "izleyici";

  useEffect(() => {
    const k = kutu.current;
    if (k && dipte.current) k.scrollTop = k.scrollHeight;
  });

  return (
    <div ref={kutu} onScroll={(ev) => { const k = ev.currentTarget; dipte.current = k.scrollHeight - k.scrollTop - k.clientHeight < 80; }} className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4 [scrollbar-width:thin]">
      {!tum.filter((m) => !m.ayrac).length && !canli && bos}
      <div className="space-y-6">
        {gizli > 0 && <button type="button" onClick={() => setEskiAcik(true)} className="mx-auto flex h-8 items-center gap-1.5 rounded-full bg-white/[0.05] px-3 text-[12px] text-white/60 ring-1 ring-inset ring-white/[0.08] hover:text-white"><History className="h-3.5 w-3.5" />Önceki sohbeti göster ({gizli} mesaj)</button>}
        {mesajlar.map((m) => m.ayrac ? <Ayrac key={m.id} m={m} /> : m.rol === "kullanici"
          ? <KullaniciMesaji key={m.id} m={m} yazarGoster={yazarGoster} ogeVurgula={eylemler.ogeVurgula} kodSatiri={eylemler.kodSatiri} duzenle={m.id === sonKullanici && !calisiyor && !izleyici && !m.duzeltme && !m.id.startsWith("gecici-") ? (t) => eylemler.duzenle(m, t) : undefined} />
          : (canli && m.id === canli.id) ? null
            : <AsistanMesaji key={m.id} m={m} sonMu={m.id === sonAsistan && !canli} proje={proje} e={eylemler} geriDonulebilir={!calisiyor && !izleyici && m.id !== sonAsistan && m.durum !== "suruyor" && m.durum !== "anahtar-yok"} />)}
        {canli && <AsistanMesaji m={canli} canli sonMu proje={proje} e={eylemler} />}
      </div>
    </div>
  );
}
