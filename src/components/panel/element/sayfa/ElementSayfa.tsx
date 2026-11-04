"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { ArrowDownWideNarrow, AtSign, Check, ChevronDown, Plus, Search, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { Yuzen } from "@/components/ui/Yuzen";
import { useElements, type ElementTur, type VElement } from "@/store/useElements";
import { useSinema } from "@/store/useSinema";
import { SIRALAMALAR, TUR_META, TUR_SIRA, sirala, type Siralama } from "../elementMeta";

import { ElementVitrin, TurRafi } from "./Raflar";
import { HAZIR_ELEMENTLER } from "./Vitrin";

/**
 * /panel/element (2026-11-03, "C · Vitrin + raflar"): başlık kartı (arama, sıralama, Yeni), mekanizma vitrini, her tür için
 * yatay kayan raf (kolaj kartlar, aynı türün hazır elementleri, Yeni karosu). Kart tıklanınca sağdan detay paneli açılır.
 */
const ease = [0.22, 1, 0.36, 1] as const;
const yay = { type: "spring", stiffness: 420, damping: 36 } as const;
const BEYAZ = "flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition hover:bg-white/90";
const HAP = "flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] ring-1 ring-inset transition-colors";
const MENU = "rounded-[14px] border border-white/[0.08] bg-[#18191c] p-1.5";
const MSATIR = "flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[13px] text-white/85 transition-colors hover:bg-white/[0.075] hover:text-white";

export function ElementSayfa({ onDetay, onYeni, onDuzenle, onKullan }: {
  onDetay: (e: VElement) => void;
  onYeni: (p?: { tur?: ElementTur; gorsel?: string; projeId?: string }) => void;
  onDuzenle: (e: VElement) => void;
  onKullan: (e: VElement, h: "gorsel" | "video") => void;
}) {
  const elementler = useElements((s) => s.elementler);
  const projeler = useSinema((s) => s.projeler);
  const [tur, setTur] = useState<"tumu" | ElementTur>("tumu");
  const [sabit, setSabit] = useState(false);
  const [projeId, setProjeId] = useState<string | null>(null);
  const [ara, setAra] = useState("");
  const [siralama, setSiralama] = useState<Siralama>("kullanim");
  const [siraAcik, setSiraAcik] = useState(false);
  const [projeAcik, setProjeAcik] = useState(false);
  const [birakma, setBirakma] = useState(false);
  const araRef = useRef<HTMLInputElement>(null);

  /* "/" ile aramaya odaklan */
  useEffect(() => {
    const t = (e: KeyboardEvent) => { const h = e.target as HTMLElement; if (e.key === "/" && !/^(INPUT|TEXTAREA)$/.test(h.tagName) && !h.isContentEditable) { e.preventDefault(); araRef.current?.focus(); } };
    window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t);
  }, []);

  const projeKapsamlari = useMemo(() => {
    const say = new Map<string, number>();
    for (const e of elementler) if (e.projeId) say.set(e.projeId, (say.get(e.projeId) ?? 0) + 1);
    return projeler.filter((p) => say.has(p.id)).map((p) => ({ id: p.id, ad: p.ad, n: say.get(p.id)! }));
  }, [elementler, projeler]);
  const projeAd = (id?: string) => (id ? projeler.find((p) => p.id === id)?.ad : undefined);
  const say = (t: "tumu" | ElementTur) => elementler.filter((e) => t === "tumu" || e.tur === t).length;
  const gorunen = useMemo(() => {
    const q = ara.trim().toLocaleLowerCase("tr");
    return sirala(elementler.filter((e) => (tur === "tumu" || e.tur === tur) && (!sabit || e.sabitli) && (!projeId || e.projeId === projeId)
      && (!q || `${e.ad} ${e.aciklama} ${TUR_META[e.tur].ad}`.toLocaleLowerCase("tr").includes(q))), siralama)
      .sort((a, b) => Number(!!b.sabitli) - Number(!!a.sabitli));
  }, [elementler, tur, sabit, projeId, ara, siralama]);
  const filtreli = tur !== "tumu" || sabit || !!projeId || !!ara.trim();
  const temizle = () => { setTur("tumu"); setSabit(false); setProjeId(null); setAra(""); };

  const dosyaBirak = (e: React.DragEvent) => {
    e.preventDefault(); setBirakma(false);
    const f = [...e.dataTransfer.files].find((x) => /^image\/(png|jpeg|webp)$/.test(x.type));
    if (f) onYeni({ gorsel: URL.createObjectURL(f), ...(tur !== "tumu" ? { tur } : {}) });
  };
  const raflar = TUR_SIRA.filter((t) => tur === "tumu" || t === tur).map((t) => ({ t, l: gorunen.filter((e) => e.tur === t) })).filter((r) => r.l.length > 0);

  return (
    <MotionConfig reducedMotion="user">
      <div data-mikro className="relative min-h-[calc(100dvh-var(--ust-nav))] bg-[#0b0b0c] text-white"
        onDragOver={(e) => { if ([...e.dataTransfer.types].includes("Files") && !(e.target as HTMLElement).closest("[data-element-kart]")) { e.preventDefault(); setBirakma(true); } }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setBirakma(false); }} onDrop={dosyaBirak}>
        <div className="mx-auto max-w-[1480px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          {/* Başlık */}
          <div className="flex min-h-[64px] flex-wrap items-center gap-3 rounded-[22px] px-3 py-2.5 ring-1 ring-inset ring-white/[0.07] sm:px-4" style={{ background: "rgba(255,255,255,0.03)" }}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-white" style={{ background: "rgba(255,255,255,0.085)" }}><AtSign className="h-5 w-5" /></span>
            <span className="min-w-0">
              <h1 className="flex items-center gap-2 text-[15.5px] font-semibold tracking-[-0.01em] text-white">Elementler{elementler.length > 0 && <motion.span key={elementler.length} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-full px-2 py-0.5 text-[11.5px] font-semibold tabular-nums text-white/75" style={{ background: "rgba(255,255,255,0.085)" }}>{elementler.length}</motion.span>}</h1>
              <span className="block truncate text-[12.5px] text-white/50 max-sm:hidden">Karakter, mekân, nesne ve stil; istemde @ad ile çağır</span>
            </span>
            <span className="flex-1" />
            {elementler.length > 0 && (
              <label className="group flex h-10 w-[300px] items-center gap-2 rounded-full bg-white/[0.055] px-3.5 ring-1 ring-inset ring-white/[0.07] transition focus-within:bg-white/[0.085] focus-within:ring-white/25 max-sm:order-last max-sm:w-full">
                <Search className="h-4 w-4 shrink-0 text-white/45 group-focus-within:text-white" />
                <input ref={araRef} value={ara} onChange={(e) => setAra(e.target.value)} onKeyDown={(e) => e.key === "Escape" && (setAra(""), e.currentTarget.blur())} placeholder="Ad ya da tarif ara" aria-label="Element ara" className="min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/35" />
                {ara ? <button onClick={() => setAra("")} aria-label="Aramayı temizle" className="text-white/50 hover:text-white"><X className="h-3.5 w-3.5" /></button> : <kbd className="rounded-md bg-white/[0.085] px-1.5 text-[11px] text-white/50">/</kbd>}
              </label>
            )}
            {elementler.length > 0 && (
              <div className="relative">
                <button onClick={() => setSiraAcik((v) => !v)} aria-expanded={siraAcik} className={cn(HAP, "h-10 px-3.5 text-white/80 ring-white/[0.08] hover:bg-white/[0.065] hover:text-white", siraAcik && "bg-white/[0.075]")}>
                  <ArrowDownWideNarrow className="h-4 w-4 text-white/55" /><span className="hidden sm:inline">{SIRALAMALAR.find((s) => s.id === siralama)?.ad}</span><ChevronDown className={cn("h-3.5 w-3.5 text-white/45 transition-transform", siraAcik && "rotate-180")} />
                </button>
                <Yuzen acik={siraAcik} onKapat={() => setSiraAcik(false)} yerlesim="alt-sag" bosluk={6} etiket="Sırala" className={cn(MENU, "w-[200px]")}>
                  {SIRALAMALAR.map((s) => <button key={s.id} onClick={() => { setSiralama(s.id); setSiraAcik(false); }} className={cn(MSATIR, "justify-between")}>{s.ad}{siralama === s.id && <Check className="h-4 w-4" />}</button>)}
                </Yuzen>
              </div>
            )}
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => onYeni(tur !== "tumu" ? { tur } : undefined)} className={BEYAZ}><Plus className="h-4 w-4" />Yeni element</motion.button>
          </div>

          <div className="mt-4 space-y-4">
            <ElementVitrin bos={elementler.length === 0} onYeni={() => onYeni()} />
            {ara.trim() ? (
              gorunen.length ? (
                <section className="overflow-hidden rounded-[24px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
                  <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-3"><Search className="h-4 w-4 text-white/60" /><span className="flex-1 text-[15px] font-semibold text-white">&quot;{ara.trim()}&quot; için {gorunen.length} element</span><button onClick={() => setAra("")} className="flex h-8 items-center gap-1 rounded-full bg-white/[0.085] px-3 text-[12.5px] text-white"><X className="h-3.5 w-3.5" />Temizle</button></div>
                  <div className="p-3 sm:p-4"><TurRafiDuz liste={gorunen} onDetay={onDetay} onKullan={onKullan} /></div>
                </section>
              ) : (
                <div className="flex items-center gap-3 rounded-[20px] px-4 py-4 ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.085]"><Search className="h-4 w-4 text-white" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-white">Eşleşen element yok</span><span className="block text-[12.5px] text-white/55">&quot;{ara.trim()}&quot; için sonuç bulunamadı.</span></span>
                  <button onClick={() => setAra("")} className="flex h-9 items-center gap-1 rounded-full bg-white/[0.085] px-3.5 text-[13px] text-white"><X className="h-3.5 w-3.5" />Aramayı temizle</button>
                </div>
              )
            ) : (() => {
              const top = (t: ElementTur) => gorunen.filter((e) => e.tur === t).length + HAZIR_ELEMENTLER.filter((h) => h.tur === t && !elementler.some((e) => e.ad.toLocaleLowerCase("tr") === h.ad.toLocaleLowerCase("tr"))).length;
              let genis = TUR_SIRA.filter((t) => top(t) > 1), dar = TUR_SIRA.filter((t) => top(t) <= 1);
              if (dar.length === 1) { genis = TUR_SIRA; dar = []; }
              const raf = (t: ElementTur, i: number, k?: boolean) => <TurRafi key={t} t={t} i={i} kompakt={k} liste={gorunen.filter((e) => e.tur === t)} onDetay={onDetay} onKullan={onKullan} onYeni={(x) => onYeni({ tur: x })} />;
              return <>{genis.map((t, i) => raf(t, i))}{dar.length > 0 && <div className={cn("grid gap-4", dar.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3")}>{dar.map((t, i) => raf(t, genis.length + i, true))}</div>}</>;
            })()}
          </div>
        </div>

        {/* Sayfaya görsel bırakma perdesi */}
        <AnimatePresence>
          {birakma && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none fixed inset-x-3 bottom-3 top-[calc(var(--ust-nav)+12px)] z-50 flex flex-col items-center justify-center gap-2 rounded-[26px] border-2 border-dashed border-[#ffffff]/60 bg-[#0b0b0c]/85">
              <Upload className="h-7 w-7 text-[#ffffff]" /><p className="text-[16px] font-semibold">Bırak, yeni element olsun</p><p className="text-[13px] text-white/55">Var olan bir elemente açı eklemek için görseli onun kartına bırak</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

function TurRafiDuz({ liste, onDetay, onKullan }: { liste: VElement[]; onDetay: (e: VElement) => void; onKullan: (e: VElement, h: "gorsel" | "video") => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {liste.map((e) => {
        const m = TUR_META[e.tur]; const g = e.gorseller.filter(Boolean) as string[];
        return (
          <button key={e.id} onClick={() => onDetay(e)} className="group relative aspect-[4/5] overflow-hidden rounded-[20px] bg-black text-left ring-1 ring-inset ring-white/[0.08] hover:ring-white/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {g[0] && <img src={g[0]} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />}
            <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
            <span className="absolute inset-x-3 bottom-3"><span className="block truncate text-[15px] font-semibold text-white">@{e.ad}</span><span className="block text-[12px]" style={{ color: m.hex }}>{m.ad}</span></span>
            <span onClick={(x) => { x.stopPropagation(); onKullan(e, "gorsel"); }} className="absolute right-2.5 top-2.5 rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-black opacity-0 transition-opacity group-hover:opacity-100">Kullan</span>
          </button>
        );
      })}
    </div>
  );
}
