"use client";

/**
 * /modeller — "3 · Logo rayı + geniş ayrıntı" (2026-10-29).
 *  Solda türlere göre gruplu yuvarlak gerçek logolar (camgöbeği halka + kayan kenar çizgisi; mobilde yatay şerit)
 *  Sağda geniş sinema başlık (ses ailelerinde canlı dalga), örnek şeridi ve sürüm panosu:
 *  sürüm sekmeleri, büyük kredi, ikonlu özellik ızgarası, Üret, Karşılaştır, API kimliği. Altta önceki/sonraki aile.
 *  Karşılaştırma çubuğu + tablo. Adres: ?tur=, ?q=, ?aile=<tur|aile>, ?model=<slug>.
 */

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion, MotionConfig } from "framer-motion";
import { ArrowLeft, ArrowRight, AudioLines, Box, Check, ChevronRight, Clock, Copy, GitCompare, ImageIcon, Info, Monitor, Music, RectangleHorizontal, Search, Sparkles, Upload, Video, Volume2, X } from "lucide-react";
import { kesfetFont } from "@/components/kesfet/font";
import { Altbilgi } from "@/components/kesfet/Kapanis";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { KATALOG, TUR_AD, TUR_SIRASI, type KatalogModel, type KatalogTur } from "@/lib/modelKatalogu";
import { aileGorselleri } from "@/lib/modelGorsel";
import { kopyala } from "@/lib/gercekEylem";
import { cn } from "@/lib/utils";

const TUR_IKON: Record<KatalogTur, React.ElementType> = { video: Video, gorsel: ImageIcon, ses: AudioLines, muzik: Music, "3d": Box };
const sade = (s: string) => s.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");
const ROZET: Record<string, string> = { Yeni: "bg-[#55d6fd]/15 text-[#a8ecff]", Hızlı: "bg-amber-400/15 text-amber-200", "Bağlı değil": "bg-white/[0.08] text-white/65", Kapandı: "bg-rose-500/15 text-rose-300" };
const yay = { type: "spring", stiffness: 420, damping: 34 } as const;
const EASE = [0.22, 1, 0.36, 1] as const;

type Aile = { anahtar: string; aile: string; tur: KatalogTur; saglayici: string; modeller: KatalogModel[]; min: number; max: number; yeni: boolean };
const AILELER: Aile[] = (() => {
  const g = new Map<string, KatalogModel[]>();
  for (const m of KATALOG) { const k = `${m.tur}|${m.aile}`; g.set(k, [...(g.get(k) ?? []), m]); }
  return [...g.entries()].map(([k, l]) => ({
    anahtar: k, aile: l[0].aile, tur: l[0].tur, saglayici: l[0].saglayici, modeller: l,
    min: Math.min(...l.map((m) => m.kredi)), max: Math.max(...l.map((m) => m.kredi)), yeni: l.some((m) => m.rozet === "Yeni"),
  })).sort((a, b) => TUR_SIRASI.indexOf(a.tur) - TUR_SIRASI.indexOf(b.tur));
})();
for (const a of AILELER) aileGorselleri(a.aile, a.tur);
const SAY = Object.fromEntries(TUR_SIRASI.map((t) => [t, KATALOG.filter((m) => m.tur === t).length])) as Record<KatalogTur, number>;
const krediMetni = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
const aralik = (a: Aile) => (a.min === a.max ? krediMetni(a.min) : `${krediMetni(a.min)}–${krediMetni(a.max)}`);
const aramaMetni = (a: Aile) => sade(`${a.aile} ${a.saglayici} ${a.modeller.map((m) => `${m.ad} ${m.ozet} ${m.etiketler.join(" ")}`).join(" ")}`);
const kapali = (m: KatalogModel) => m.rozet === "Kapandı" || m.rozet === "Bağlı değil";

function Logo({ ad, k = 32, className }: { ad: string; k?: number; className?: string }) {
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-[10px] bg-white/[0.08] ring-1 ring-inset ring-white/10", className)} style={{ width: k, height: k }}>
      <ModelLogo ad={ad} boyut={Math.round(k * 0.56)} />
    </span>
  );
}

export default function ModellerSayfa() {
  return (
    <div className={cn("kesfet-tema bg-zemin", kesfetFont.variable)}>
      <Suspense><Modeller /></Suspense>
      <Altbilgi />
    </div>
  );
}

function Modeller() {
  const p = useSearchParams();
  const [tur, setTur] = useState<KatalogTur | "tumu">("tumu");
  const [q, setQ] = useState("");
  const [secAnahtar, setSecAnahtar] = useState<string>(AILELER[0].anahtar);
  const [vurgu, setVurgu] = useState<string | null>(null);
  const [kiyas, setKiyas] = useState<string[]>([]);
  const [kiyasAcik, setKiyasAcik] = useState(false);
  const detayRef = useRef<HTMLDivElement>(null);
  const listeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = p.get("tur") as KatalogTur | null;
    if (t && TUR_SIRASI.includes(t)) setTur(t);
    if (p.get("q")) setQ(p.get("q")!);
    const ms = p.get("model");
    const m = ms ? KATALOG.find((x) => x.slug === ms) : null;
    const a = m ? AILELER.find((x) => x.modeller.includes(m)) : AILELER.find((x) => x.anahtar === p.get("aile"));
    if (a) { setSecAnahtar(a.anahtar); setVurgu(m?.slug ?? null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const s = new URLSearchParams();
    if (tur !== "tumu") s.set("tur", tur);
    if (q.trim()) s.set("q", q.trim());
    s.set("aile", secAnahtar);
    window.history.replaceState(null, "", `${window.location.pathname}?${s.toString()}`);
  }, [tur, q, secAnahtar]);

  const liste = useMemo(() => {
    const t = sade(q.trim());
    return AILELER.filter((a) => (tur === "tumu" || a.tur === tur) && (!t || aramaMetni(a).includes(t)));
  }, [tur, q]);
  // Filtre seçili aileyi dışarıda bırakırsa listenin ilkine geç
  useEffect(() => { if (liste.length && !liste.some((a) => a.anahtar === secAnahtar)) setSecAnahtar(liste[0].anahtar); }, [liste, secAnahtar]);
  const sec = AILELER.find((a) => a.anahtar === secAnahtar) ?? AILELER[0];
  // Seçili aile listede görünmüyorsa liste kendi içinde ona kayar (sayfa kaymaz)
  useEffect(() => {
    const kap = listeRef.current; if (!kap) return;
    const el = kap.querySelector<HTMLElement>(`[data-aile="${CSS.escape(secAnahtar)}"]`); if (!el) return;
    const k = kap.getBoundingClientRect(), e = el.getBoundingClientRect();
    if (e.top < k.top + 8 || e.bottom > k.bottom - 8) kap.scrollTo({ top: kap.scrollTop + (e.top - k.top) - k.height / 3, behavior: "smooth" });
  }, [secAnahtar]);
  const sira = liste.findIndex((a) => a.anahtar === sec.anahtar);

  const sec2 = (a: Aile) => {
    setSecAnahtar(a.anahtar); setVurgu(null);
    requestAnimationFrame(() => {
      const el = detayRef.current; if (!el) return;
      const ust = el.getBoundingClientRect().top;
      if (ust < 0 || window.innerWidth < 1024) window.scrollTo({ top: window.scrollY + ust - 90, behavior: "smooth" });
    });
  };
  const kiyasModeller = kiyas.map((s) => KATALOG.find((m) => m.slug === s)!).filter(Boolean);
  const kiyasDegis = (slug: string) => setKiyas((k) => (k.includes(slug) ? k.filter((x) => x !== slug) : k.length < 3 ? [...k, slug] : k));

  return (
    <MotionConfig reducedMotion="user">
      <main className="mx-auto max-w-[1280px] px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
        {/* Başlık + arama + tür */}
        <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[38px] font-semibold leading-[1.03] tracking-[-0.04em] text-white sm:text-[56px]">{KATALOG.length} model, <span className="bg-gradient-to-r from-[#55d6fd] to-[#a8ecff] bg-clip-text text-transparent">tek kredi bakiyesi</span></h1>
            <p className="mt-3 max-w-xl text-[15.5px] leading-relaxed text-white/70">Stüdyolarda kullanabildiğin her model burada. Bedeller, çözünürlük, süre ve oranlar stüdyodakiyle birebir.</p>
          </div>
          <Link href="/fiyatlandirma" className="group flex shrink-0 items-center gap-1 text-[14px] text-white/65 transition hover:text-white">Kredi fiyatları<ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></Link>
        </section>

        <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center">
          <LayoutGroup id="model-tur">
            <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
              <div role="tablist" aria-label="Tür" className="flex w-max gap-1 rounded-full bg-white/[0.04] p-1 ring-1 ring-inset ring-white/[0.07]">
                {(["tumu", ...TUR_SIRASI] as (KatalogTur | "tumu")[]).map((t) => {
                  const I = t === "tumu" ? null : TUR_IKON[t];
                  return (
                    <button key={t} role="tab" aria-selected={tur === t} onClick={() => setTur(t)} className={cn("relative flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] transition-colors", tur === t ? "font-semibold text-black" : "text-white/70 hover:text-white")}>
                      {tur === t && <motion.span layoutId="model-tur-z" className="absolute inset-0 rounded-full bg-white" transition={yay} />}
                      {I && <I className="relative h-3.5 w-3.5" />}<span className="relative">{t === "tumu" ? "Tümü" : TUR_AD[t]}</span>
                      <span className={cn("relative text-[12px] tabular-nums", tur === t ? "text-black/55" : "text-white/45")}>{t === "tumu" ? KATALOG.length : SAY[t]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </LayoutGroup>
          <label className="flex h-11 items-center gap-2 rounded-full bg-white/[0.05] px-4 ring-1 ring-inset ring-white/[0.09] transition focus-within:bg-white/[0.07] focus-within:ring-[#55d6fd]/60 lg:ml-auto lg:w-80">
            <Search className="h-4 w-4 shrink-0 text-white/55" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Model, sağlayıcı, 4K, sesli" aria-label="Modellerde ara" className="min-w-0 flex-1 bg-transparent text-[14.5px] text-white outline-none placeholder:text-white/45" />
            {q && <button onClick={() => setQ("")} aria-label="Aramayı temizle" className="text-white/55 hover:text-white"><X className="h-3.5 w-3.5" /></button>}
          </label>
        </div>

        {liste.length ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-[104px_minmax(0,1fr)]">
            {/* Logo rayı: türlere göre gruplu yuvarlak gerçek logolar */}
            <aside className="min-w-0 lg:sticky lg:top-[calc(var(--ust-nav)+16px)] lg:max-h-[calc(100vh-var(--ust-nav)-32px)] lg:self-start">
              <LayoutGroup id="model-aile">
                {/* Mobil: yatay logo şeridi */}
                <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:hidden">
                  {liste.map((a) => {
                    const on = a.anahtar === sec.anahtar;
                    return (
                      <button key={a.anahtar} onClick={() => sec2(a)} className="flex w-[72px] shrink-0 flex-col items-center gap-1.5 py-1">
                        <span className={cn("rounded-full transition-all duration-300", on ? "ring-2 ring-[#55d6fd] ring-offset-2 ring-offset-zemin" : "opacity-70")}><Logo ad={a.modeller[0].ad} k={48} className="rounded-full" /></span>
                        <span className={cn("w-full truncate text-center text-[11.5px]", on ? "font-semibold text-white" : "text-white/55")}>{a.aile}</span>
                      </button>
                    );
                  })}
                </div>
                {/* Masaüstü: dikey ray */}
                <div ref={listeRef} className="hidden overflow-y-auto rounded-[28px] lg:max-h-[calc(100vh-var(--ust-nav)-32px)] bg-[#111113] py-2 ring-1 ring-white/[0.08] [scrollbar-width:none] lg:block">
                  {TUR_SIRASI.map((t) => {
                    const l = liste.filter((a) => a.tur === t);
                    if (!l.length) return null;
                    const I = TUR_IKON[t];
                    return (
                      <div key={t}>
                        <p title={TUR_AD[t]} className="mx-auto mb-1 mt-2 flex w-fit items-center gap-1 rounded-full bg-white/[0.05] px-2 py-0.5 text-[11px] font-medium text-white/55"><I className="h-3 w-3" />{TUR_AD[t]}</p>
                        {l.map((a) => {
                          const on = a.anahtar === sec.anahtar;
                          return (
                            <button key={a.anahtar} data-aile={a.anahtar} onClick={() => sec2(a)} aria-current={on} aria-label={`${a.aile} · ${TUR_AD[a.tur]}`}
                              className="group relative flex w-full flex-col items-center gap-1.5 px-1.5 py-2.5">
                              {on && <motion.span layoutId="model-aile-cizgi" transition={yay} className="absolute left-0 top-1/2 h-10 w-[3px] -translate-y-1/2 rounded-r-full bg-[#55d6fd]" />}
                              {on && <motion.span layoutId="model-aile-z" transition={yay} className="absolute inset-x-2 inset-y-1 rounded-[18px] bg-white/[0.06]" />}
                              <span className="relative">
                                <motion.span whileHover={{ scale: 1.08 }} transition={yay} className={cn("block rounded-full transition-[box-shadow,opacity] duration-300", on ? "ring-2 ring-[#55d6fd] ring-offset-2 ring-offset-[#151517]" : "opacity-70 group-hover:opacity-100")}>
                                  <Logo ad={a.modeller[0].ad} k={46} className="rounded-full" />
                                </motion.span>
                                {a.yeni && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#55d6fd] ring-2 ring-[#111113]" title="Yeni model var" />}
                              </span>
                              <span className={cn("relative w-full truncate text-center text-[11.5px] leading-tight", on ? "font-semibold text-white" : "text-white/55 group-hover:text-white/85")}>{a.aile}</span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </LayoutGroup>
            </aside>

            {/* Ayrıntı */}
            <div ref={detayRef} className="min-w-0 scroll-mt-24">
              <AnimatePresence mode="wait">
                <motion.div key={sec.anahtar} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: EASE }}>
                  <Ayrinti a={sec} vurgu={vurgu} kiyas={kiyas} onKiyas={kiyasDegis} />
                  {/* Önceki / sonraki aile */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {[sira - 1, sira + 1].map((j, k) => {
                      const a = liste[j];
                      if (!a) return <span key={k} />;
                      return (
                        <button key={a.anahtar} onClick={() => sec2(a)} className={cn("group flex items-center gap-3 rounded-[18px] bg-[#111113] p-3 ring-1 ring-white/[0.08] transition-colors hover:bg-[#151517]", k === 1 && "flex-row-reverse text-right")}>
                          {k === 0 ? <ArrowLeft className="h-4 w-4 shrink-0 text-white/50 transition-transform group-hover:-translate-x-0.5" /> : <ArrowRight className="h-4 w-4 shrink-0 text-white/50 transition-transform group-hover:translate-x-0.5" />}
                          <Logo ad={a.modeller[0].ad} k={30} />
                          <span className="min-w-0 flex-1"><span className="block text-[12px] text-white/50">{k === 0 ? "Önceki" : "Sonraki"}</span><span className="block truncate text-[14px] font-medium text-white">{a.aile}</span></span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-[24px] bg-[#111113] px-6 py-14 text-center ring-1 ring-white/[0.08]">
            <p className="text-[16px] font-semibold text-white">Bu aramaya uyan model yok</p>
            <button onClick={() => { setQ(""); setTur("tumu"); }} className="mt-3 h-9 rounded-full bg-white/[0.08] px-4 text-[13.5px] font-medium text-white transition hover:bg-white/[0.14]">Filtreleri temizle</button>
          </div>
        )}
      </main>

      {/* Karşılaştırma çubuğu */}
      <AnimatePresence>
        {kiyas.length > 0 && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={yay}
            className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] left-1/2 z-40 flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-2 rounded-full bg-[#1a1b1e] py-2 pl-2.5 pr-2 ring-1 ring-white/[0.14] sm:bottom-6">
            <span className="flex -space-x-1.5">{kiyasModeller.map((m) => <span key={m.slug} className="rounded-[10px] ring-2 ring-[#1a1b1e]"><Logo ad={m.ad} k={30} /></span>)}</span>
            <span className="whitespace-nowrap px-1.5 text-[13.5px] text-white"><b className="font-semibold">{kiyas.length}</b> / 3 model</span>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => setKiyasAcik(true)} disabled={kiyas.length < 2} className="flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition disabled:bg-white/[0.1] disabled:text-white/40"><GitCompare className="h-3.5 w-3.5" />Karşılaştır</motion.button>
            <button onClick={() => setKiyas([])} aria-label="Karşılaştırmayı temizle" className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white"><X className="h-4 w-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Karşılaştırma penceresi */}
      <AnimatePresence>
        {kiyasAcik && kiyasModeller.length > 1 && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setKiyasAcik(false)} className="perde absolute inset-0" />
            <motion.div role="dialog" aria-label="Model karşılaştırma" initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
              className="kesfet-tema relative max-h-[85vh] w-full max-w-[900px] overflow-auto rounded-[26px] bg-[#131315] ring-1 ring-white/[0.1]">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.07] bg-[#131315] px-6 py-4">
                <p className="text-[18px] font-semibold text-white">Karşılaştırma</p>
                <button onClick={() => setKiyasAcik(false)} aria-label="Kapat" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-white/70 hover:bg-white/[0.12] hover:text-white"><X className="h-4 w-4" /></button>
              </div>
              <Kiyas modeller={kiyasModeller} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}

/* ── Ses aileleri için canlı dalga (aynı dalga görselini tekrarlamak yerine) ── */
function SesDalgasi({ renk = "#55d6fd" }: { renk?: string }) {
  const cubuklar = useMemo(() => Array.from({ length: 56 }, (_, i) => 0.25 + Math.abs(Math.sin(i * 0.55) * Math.cos(i * 0.21)) * 0.75), []);
  return (
    <div className="flex h-full items-center justify-center gap-[3px] bg-[radial-gradient(70%_80%_at_50%_50%,rgba(85,214,253,0.14),transparent_70%),#0e0f11] px-6">
      {cubuklar.map((h, i) => (
        <motion.span key={i} className="w-[4px] rounded-full" style={{ background: renk, opacity: 0.35 + h * 0.65 }}
          animate={{ height: [`${h * 40}%`, `${h * 85}%`, `${h * 40}%`] }} transition={{ duration: 1.4 + (i % 5) * 0.18, repeat: Infinity, ease: "easeInOut", delay: (i % 9) * 0.07 }} />
      ))}
    </div>
  );
}

const OZ_IKON: Record<string, React.ElementType> = { "Çözünürlük": Monitor, "Süre": Clock, "En-boy oranı": RectangleHorizontal, "Ses": Volume2, "Girdi": Upload };

function Ayrinti({ a, vurgu, kiyas, onKiyas }: { a: Aile; vurgu: string | null; kiyas: string[]; onKiyas: (s: string) => void }) {
  const g = aileGorselleri(a.aile, a.tur);
  const I = TUR_IKON[a.tur];
  const ses = a.tur === "ses";
  const [i, setI] = useState(() => Math.max(0, vurgu ? a.modeller.findIndex((m) => m.slug === vurgu) : a.modeller.findIndex((m) => !kapali(m))));
  const m = a.modeller[Math.min(i, a.modeller.length - 1)];
  const secili = kiyas.includes(m.slug);
  const oz = m.ozellikler.filter((o) => o.ad !== "Not");
  const not = m.ozellikler.find((o) => o.ad === "Not")?.deger;
  const ilk = a.modeller.find((x) => !kapali(x));
  const yan = g.liste.slice(1, 3);
  const serit = g.liste.slice(3, 7).length >= 2 ? g.liste.slice(3, 7) : [];
  const kisaAd = (x: KatalogModel) => x.ad.replace(a.aile, "").replace(/^[\s·-]+/, "").trim() || x.ad;

  return (
    <div>
      {/* Sinema başlık */}
      <div className="relative h-[380px] overflow-hidden rounded-[28px] ring-1 ring-white/[0.08] sm:h-[460px]">
        {ses ? <SesDalgasi /> : (
          <motion.img key={g.liste[0]} src={g.liste[0]} alt="" initial={{ scale: 1.08, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.9, ease: EASE }} className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,10,.15)_0%,rgba(8,8,10,0)_30%,rgba(8,8,10,.92)_100%)]" />
        {!ses && yan.length > 0 && (
          <div className="absolute right-4 top-4 hidden gap-2 sm:flex">
            {yan.map((y, k) => (
              // eslint-disable-next-line @next/next/no-img-element
              <motion.img key={y} src={y} alt="" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + k * 0.08 }} className="h-[78px] w-[116px] rounded-[14px] object-cover ring-1 ring-white/25" />
            ))}
          </div>
        )}
        {!g.gercek && !ses && <span className="absolute left-4 top-4 rounded-full bg-black/50 px-2.5 py-1 text-[12px] text-white/80 ring-1 ring-inset ring-white/15 backdrop-blur-md">Türün genel örnekleri</span>}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:p-7">
          <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, ...yay }} className="block w-fit rounded-[18px] bg-black/50 p-1 ring-1 ring-inset ring-white/15 backdrop-blur-md">
            <Logo ad={a.modeller[0].ad} k={60} className="rounded-[15px] bg-transparent ring-0" />
          </motion.span>
          <div className="min-w-0 flex-1">
            <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.45, ease: EASE }} className="text-[34px] font-semibold leading-none tracking-[-0.04em] text-white sm:text-[46px]">{a.aile}</motion.h2>
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {[a.saglayici, TUR_AD[a.tur], `${a.modeller.length} model`, `${aralik(a)} kredi`].map((t, k) => (
                <motion.span key={t} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + k * 0.05 }} className="flex items-center gap-1 rounded-full bg-black/45 px-3 py-1 text-[13px] text-white ring-1 ring-inset ring-white/15 backdrop-blur-md">{k === 1 && <I className="h-3.5 w-3.5" />}{t}</motion.span>
              ))}
            </div>
          </div>
          {ilk && <Link href={ilk.href} className="group flex h-12 w-fit shrink-0 items-center gap-1.5 rounded-full bg-white px-6 text-[15px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.98]">Bu aileyle üret<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></Link>}
        </div>
      </div>

      {/* Örnek şeridi */}
      {!ses && serit.length > 0 && (
        <div className={cn("mt-3 grid gap-2", serit.length >= 4 ? "grid-cols-2 sm:grid-cols-4" : serit.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
          {serit.map((y, k) => (
            <motion.div key={y} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + k * 0.05 }} className="group aspect-[4/3] overflow-hidden rounded-[18px] ring-1 ring-white/[0.08]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={y} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
            </motion.div>
          ))}
        </div>
      )}

      {/* Sürüm panosu */}
      <div className="mt-3 overflow-hidden rounded-[28px] bg-[#111113] ring-1 ring-white/[0.08]">
        <LayoutGroup id={`surum-${a.anahtar}`}>
          <div role="tablist" aria-label="Model sürümleri" className="flex gap-1 overflow-x-auto border-b border-white/[0.07] p-2 [scrollbar-width:none]">
            {a.modeller.map((x, k) => (
              <button key={x.slug} role="tab" aria-selected={i === k} onClick={() => setI(k)}
                className={cn("relative h-11 shrink-0 rounded-[14px] px-4 text-[14px] transition-colors", i === k ? "font-semibold text-black" : "text-white/70 hover:bg-white/[0.04] hover:text-white", kapali(x) && i !== k && "text-white/40")}>
                {i === k && <motion.span layoutId={`surum-z-${a.anahtar}`} transition={yay} className="absolute inset-0 rounded-[14px] bg-white" />}
                <span className="relative flex items-center gap-1.5">{kisaAd(x)}{x.rozet === "Yeni" && <span className="h-1.5 w-1.5 rounded-full bg-[#55d6fd]" />}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={m.slug} id={`m-${m.slug}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.22, ease: EASE }} className="p-5 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-[24px] font-semibold tracking-[-0.03em] text-white">{m.ad}{m.rozet && <span className={cn("rounded-full px-2.5 py-0.5 text-[12px] font-medium", ROZET[m.rozet] ?? "bg-white/[0.08] text-white/70")}>{m.rozet}</span>}</p>
                <p className="mt-1.5 text-[15.5px] leading-relaxed text-white/70">{m.ozet}</p>
              </div>
              <div className="shrink-0 sm:text-right">
                <p className="text-[34px] font-semibold leading-none tracking-[-0.04em] text-white tabular-nums">{krediMetni(m.kredi)}<span className="ml-1.5 text-[15px] font-normal tracking-normal text-white/55">kredi</span></p>
                <p className="mt-1.5 text-[13px] text-white/55">{m.bedel}</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2 lg:grid-cols-3">
              {oz.slice(0, 6).map((o, k) => {
                const OI = OZ_IKON[o.ad] ?? Sparkles;
                return (
                  <motion.div key={o.ad} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + k * 0.04 }} className="rounded-[18px] bg-white/[0.04] p-4 ring-1 ring-inset ring-white/[0.06]">
                    <p className="flex items-center gap-1.5 text-[12.5px] text-white/55"><OI className="h-3.5 w-3.5" />{o.ad}</p>
                    <p className="mt-1.5 text-[15px] font-medium leading-snug text-white">{o.deger}</p>
                  </motion.div>
                );
              })}
            </div>
            {not && <p className="mt-4 flex gap-2 rounded-[14px] bg-white/[0.03] px-4 py-3 text-[13.5px] leading-relaxed text-white/65 ring-1 ring-inset ring-white/[0.05]"><Info className="mt-0.5 h-4 w-4 shrink-0" />{not}</p>}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {kapali(m)
                ? <span className="flex h-12 items-center rounded-full px-5 text-[14.5px] text-white/65 ring-1 ring-inset ring-white/[0.12]">{m.rozet}</span>
                : <Link href={m.href} className="group flex h-12 items-center gap-1.5 rounded-full bg-white px-6 text-[15px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.98]">{m.ad} ile üret<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></Link>}
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => onKiyas(m.slug)} disabled={!secili && kiyas.length >= 3} aria-pressed={secili}
                className={cn("flex h-12 items-center gap-1.5 rounded-full px-5 text-[14px] ring-1 ring-inset transition disabled:opacity-40", secili ? "bg-[#55d6fd]/15 font-medium text-[#a8ecff] ring-[#55d6fd]/40" : "bg-white/[0.06] text-white ring-white/[0.1] hover:bg-white/[0.1]")}>
                {secili ? <Check className="h-4 w-4" /> : <GitCompare className="h-4 w-4" />}{secili ? "Karşılaştırmada" : "Karşılaştır"}
              </motion.button>
              {m.api && (
                <button onClick={() => void kopyala(m.api!.id, "Model kimliği kopyalandı")} title="API model kimliğini kopyala" className="flex h-12 min-w-0 items-center gap-1.5 rounded-full px-4 text-[13.5px] text-white/65 ring-1 ring-inset ring-white/[0.1] transition hover:text-white">
                  <Copy className="h-4 w-4 shrink-0" /><span className="truncate">API · {m.api.id}</span>
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Kiyas({ modeller }: { modeller: KatalogModel[] }) {
  const adlar = Array.from(new Set(modeller.flatMap((m) => m.ozellikler.map((o) => o.ad)).filter((a) => a !== "Not")));
  return (
    <table className="w-full min-w-[560px] text-left text-[14px]">
      <thead>
        <tr className="border-b border-white/[0.07]">
          <th className="px-6 py-4 font-normal text-white/55" />
          {modeller.map((m) => <th key={m.slug} className="px-6 py-4 font-semibold text-white"><span className="flex items-center gap-2.5"><Logo ad={m.ad} k={28} />{m.ad}</span></th>)}
        </tr>
      </thead>
      <tbody className="divide-y divide-white/[0.05]">
        <tr><td className="px-6 py-3.5 text-white/55">Bedel</td>{modeller.map((m) => <td key={m.slug} className="px-6 py-3.5 font-semibold tabular-nums text-white">{m.bedel}</td>)}</tr>
        {adlar.map((a) => <tr key={a}><td className="px-6 py-3.5 text-white/55">{a}</td>{modeller.map((m) => <td key={m.slug} className="px-6 py-3.5 text-white/85">{m.ozellikler.find((o) => o.ad === a)?.deger ?? "—"}</td>)}</tr>)}
        <tr><td className="px-6 py-4" />{modeller.map((m) => <td key={m.slug} className="px-6 py-4">{kapali(m) ? <span className="text-white/55">{m.rozet}</span> : <Link href={m.href} className="inline-flex h-9 items-center gap-1 rounded-full bg-white px-4 text-[13px] font-semibold text-black transition hover:bg-white/90">Üret<ArrowRight className="h-3.5 w-3.5" /></Link>}</td>)}</tr>
      </tbody>
    </table>
  );
}
