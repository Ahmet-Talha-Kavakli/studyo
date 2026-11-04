"use client";

/* Elementler · C düzeni: üstte mekanizma vitrini, altında her tür için yatay kayan raf (kolaj kartlar + hazırlar + Yeni). */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AtSign, ChevronLeft, ChevronRight, Copy, Film, Image as ImageIcon, Pin, Plus, Sparkles, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useElements, type ElementTur, type VElement } from "@/store/useElements";
import { TUR_META } from "../elementMeta";
import { HAZIR_ELEMENTLER } from "./Vitrin";

const E = "/gercek/element";
const ease = [0.22, 1, 0.36, 1] as const;
const img = (s: string, c = "") => /* eslint-disable-next-line @next/next/no-img-element */ <img src={s} alt="" draggable={false} className={cn("absolute inset-0 h-full w-full object-cover", c)} />;
const TUR_ALT: Record<ElementTur, string> = { karakter: "Yüz, saç ve kıyafet her sahnede aynı", mekan: "Aynı yer, farklı açı ve ışık", obje: "Ürün ve nesne birebir korunur", stil: "Renk, ışık ve doku dili" };
type Hazir = (typeof HAZIR_ELEMENTLER)[number];

/* ── Vitrin: element → @istem → aynı karakterli sahneler, sırayla döner ── */
const SAHNE = [
  { g: `${E}/kael-aksiyon.webp`, istem: "fırtınalı surlarda kılıcını çekiyor" },
  { g: `${E}/kael-cokme.webp`, istem: "diz çökmüş, kılıcı yerde, sinematik" },
];
export function ElementVitrin({ bos, onYeni }: { bos: boolean; onYeni: () => void }) {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((v) => (v + 1) % SAHNE.length), 3200); return () => clearInterval(t); }, []);
  const s = SAHNE[i];
  return (
    <section className="relative isolate overflow-hidden rounded-[28px] ring-1 ring-inset ring-white/[0.08]" style={{ background: "#0c0d0f" }}>
      <AnimatePresence initial={false}>
        <motion.span key={s.g} initial={{ opacity: 0 }} animate={{ opacity: 0.32 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="absolute inset-0 -z-10">{img(s.g, "scale-110 blur-2xl")}</motion.span>
      </AnimatePresence>
      <span aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#0c0d0f_0%,rgba(12,13,15,0.92)_38%,rgba(12,13,15,0.55)_100%)] max-lg:bg-[linear-gradient(180deg,rgba(12,13,15,0.6),#0c0d0f)]" />
      <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-7 px-5 py-7 sm:px-9 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)] lg:py-8">
        <div className="min-w-0">
          <h2 className="text-[36px] font-semibold leading-[1.04] tracking-[-0.045em] text-white max-sm:text-[29px]">Bir kez tanımla,<br /><span className="hero-isilti">her sahnede aynı kalsın</span></h2>
          <p className="mt-3 max-w-[440px] text-[14.5px] leading-relaxed text-white/65">Karakterini, mekânını, ürününü ya da stilini 1 ile 4 görselle kaydet. İstemde @ad yazınca görseller referans olarak modele gider.</p>
          <ol className="mt-5 flex flex-wrap gap-2">
            {([[Upload, "Görsel ekle"], [AtSign, "Adlandır"], [Sparkles, "İstemde çağır"]] as const).map(([I, a], k) => (
              <motion.li key={a} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + k * 0.06 }} className="flex h-9 items-center gap-2 rounded-full pl-1 pr-3.5 text-[12.5px] text-white/85 ring-1 ring-inset ring-white/[0.1] backdrop-blur-xl" style={{ background: "rgba(255,255,255,0.06)" }}>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.1] text-[12px] font-semibold tabular-nums text-white">{k + 1}</span><I className="h-3.5 w-3.5 text-white/60" />{a}
              </motion.li>
            ))}
          </ol>
          {bos && (
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <button onClick={onYeni} className="flex h-12 items-center gap-2 rounded-full bg-white px-5 text-[14.5px] font-semibold text-black transition active:scale-[0.97]"><Plus className="h-[18px] w-[18px]" />İlk elementini oluştur</button>
              <span className="flex h-12 items-center gap-1.5 px-2 text-[13px] text-white/55"><Upload className="h-4 w-4" />ya da görseli sayfaya bırak</span>
            </div>
          )}
        </div>
        {/* Mekanizma */}
        <div className="cam-istemci relative rounded-[24px] p-3.5 max-sm:p-2.5">
          <div className="grid grid-cols-[minmax(0,0.8fr)_auto_minmax(0,1fr)] items-center gap-3 max-sm:gap-2">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[16px] ring-1 ring-white/[0.12]">
              <span className="absolute inset-0 grid grid-rows-[1.5fr_1fr] gap-[3px]">
                <span className="relative overflow-hidden">{img(`${E}/kael-portre.webp`)}</span>
                <span className="relative overflow-hidden">{img(`${E}/kael-yan.webp`)}</span>
              </span>
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2.5 pt-8">
                <span className="block text-[15px] font-semibold text-white">@Kael</span>
                <span className="block text-[11.5px] text-white/65">Karakter · 2 açı</span>
              </span>
            </div>
            <svg aria-hidden viewBox="0 0 40 20" className="h-5 w-10 text-white/55 max-sm:w-6"><motion.path d="M0 10 H32" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" fill="none" animate={{ strokeDashoffset: [0, -16] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} /><path d="M28 5 L34 10 L28 15" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
            <div className="min-w-0 space-y-2.5">
              <div className="rounded-[14px] px-3 py-2.5 text-[13px] leading-snug text-white ring-1 ring-inset ring-white/[0.12]" style={{ background: "rgba(255,255,255,0.07)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <span className="mr-1 inline-flex items-center gap-1 rounded-full bg-white/[0.16] py-0.5 pl-0.5 pr-2 align-middle text-[12px] font-semibold"><img src={`${E}/kael-portre.webp`} alt="" className="h-5 w-5 rounded-full object-cover" />Kael</span>
                <AnimatePresence mode="wait"><motion.span key={s.istem} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>{s.istem}</motion.span></AnimatePresence>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[16px] ring-1 ring-white/[0.12]">
                <AnimatePresence initial={false}>
                  <motion.span key={s.g} initial={{ clipPath: "inset(0 100% 0 0)" }} animate={{ clipPath: "inset(0 0% 0 0)" }} exit={{ opacity: 0.999 }} transition={{ duration: 0.8, ease }} className="absolute inset-0">{img(s.g)}</motion.span>
                </AnimatePresence>
                <span className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">Aynı yüz, yeni sahne</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Kolaj kart: ana görsel + açılar; @ad ve tür kart içinde; üzerine gelince Görsel / Video / @ad ── */
function ElementKolaj({ e, onDetay, onKullan }: { e: VElement; onDetay: () => void; onKullan: (h: "gorsel" | "video") => void }) {
  const m = TUR_META[e.tur]; const I = m.ikon; const g = e.gorseller.filter(Boolean) as string[]; const ek = g.slice(1, 3);
  const kopyala = () => { void navigator.clipboard?.writeText(`@${e.ad}`); toast.success(`@${e.ad} kopyalandı`, { description: "İsteme yapıştırınca bu element kullanılır." }); };
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="group relative aspect-[4/5] w-[228px] shrink-0 overflow-hidden rounded-[20px] bg-black ring-1 ring-inset ring-white/[0.08] transition-shadow hover:ring-white/30 max-sm:w-[176px]">
      <button onClick={onDetay} aria-label={`@${e.ad} ayrıntıları`} className="absolute inset-0">
        <span className={cn("absolute inset-0 grid gap-[3px]", ek.length ? "grid-cols-[1.7fr_1fr]" : "grid-cols-1")}>
          <span className="relative overflow-hidden">{g[0] ? img(g[0], "transition-transform duration-700 group-hover:scale-[1.05]") : <span className="flex h-full items-center justify-center"><I className="h-8 w-8" style={{ color: m.hex }} /></span>}</span>
          {ek.length > 0 && <span className="grid gap-[3px]" style={{ gridTemplateRows: `repeat(${ek.length}, 1fr)` }}>{ek.map((x) => <span key={x} className="relative overflow-hidden">{img(x)}</span>)}</span>}
        </span>
        <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
      </button>
      {e.sabitli && <span className="pointer-events-none absolute left-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur"><Pin className="h-3 w-3 fill-current" /></span>}
      <span className="pointer-events-none absolute right-2.5 top-2.5 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium tabular-nums text-white backdrop-blur">{g.length} / 4</span>
      <div className="pointer-events-none absolute inset-x-3 bottom-3">
        <p className="truncate text-[16px] font-semibold text-white">@{e.ad}</p>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-white/70"><I className="h-3.5 w-3.5 shrink-0" style={{ color: m.hex }} />{e.kullanim ? `${e.kullanim} üretimde` : m.ad}</p>
        <div className="pointer-events-auto mt-2.5 grid grid-cols-[1fr_1fr_auto] gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 [@media(hover:none)]:hidden">
          <button onClick={() => onKullan("gorsel")} className="flex h-9 items-center justify-center gap-1 rounded-full bg-white text-[12.5px] font-semibold text-black active:scale-95"><ImageIcon className="h-3.5 w-3.5" /><span className="max-sm:hidden">Görsel</span></button>
          <button onClick={() => onKullan("video")} className="flex h-9 items-center justify-center gap-1 rounded-full bg-white/[0.2] text-[12.5px] font-semibold text-white backdrop-blur active:scale-95"><Film className="h-3.5 w-3.5" /><span className="max-sm:hidden">Video</span></button>
          <button onClick={kopyala} aria-label={`@${e.ad} kopyala`} title={`@${e.ad} kopyala`} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.2] text-white backdrop-blur active:scale-95"><Copy className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </motion.div>
  );
}

function HazirKart({ h, onEkle }: { h: Hazir; onEkle: () => void }) {
  const m = TUR_META[h.tur]; const I = m.ikon; const ek = h.gorseller.slice(1, 3);
  return (
    <motion.button whileHover={{ y: -3 }} transition={{ duration: 0.2 }} onClick={onEkle} title={`@${h.ad} kitaplığına ekle`}
      className="group relative aspect-[4/5] w-[228px] shrink-0 overflow-hidden rounded-[20px] bg-black text-left ring-1 ring-inset ring-white/[0.08] transition-shadow hover:ring-white/30 max-sm:w-[176px]">
      <span className={cn("absolute inset-0 grid gap-[3px]", ek.length ? "grid-cols-[1.7fr_1fr]" : "grid-cols-1")}>
        <span className="relative overflow-hidden">{img(h.gorseller[0], "transition-transform duration-700 group-hover:scale-[1.05]")}</span>
        {ek.length > 0 && <span className="grid gap-[3px]" style={{ gridTemplateRows: `repeat(${ek.length}, 1fr)` }}>{ek.map((x) => <span key={x} className="relative overflow-hidden">{img(x)}</span>)}</span>}
      </span>
      <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
      <span className="absolute left-2.5 top-2.5 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">Hazır</span>
      <span className="absolute inset-x-3 bottom-3">
        <span className="block truncate text-[16px] font-semibold text-white">@{h.ad}</span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-white/70"><I className="h-3.5 w-3.5" style={{ color: m.hex }} />{m.ad} · {h.gorseller.length} açı</span>
        <span className="mt-2.5 flex h-9 items-center justify-center gap-1 rounded-full bg-white text-[12.5px] font-semibold text-black opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100"><Plus className="h-3.5 w-3.5" />Kitaplığa ekle</span>
      </span>
    </motion.button>
  );
}

/* ── Tür rafı ── */
export function TurRafi({ t, liste, i, onDetay, onKullan, onYeni, kompakt }: {
  t: ElementTur; liste: VElement[]; i: number; kompakt?: boolean;
  onDetay: (e: VElement) => void; onKullan: (e: VElement, h: "gorsel" | "video") => void; onYeni: (t: ElementTur) => void;
}) {
  const m = TUR_META[t]; const I = m.ikon;
  const elementler = useElements((s) => s.elementler);
  const hazirlar = HAZIR_ELEMENTLER.filter((h) => h.tur === t && !elementler.some((e) => e.ad.toLocaleLowerCase("tr") === h.ad.toLocaleLowerCase("tr")));
  const kay = useRef<HTMLDivElement>(null);
  const [uc, setUc] = useState({ sol: false, sag: false });
  const olc = () => { const el = kay.current; if (el) setUc({ sol: el.scrollLeft > 4, sag: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 }); };
  useEffect(() => { olc(); const el = kay.current; if (!el) return; const ro = new ResizeObserver(olc); ro.observe(el); return () => ro.disconnect(); }, [liste.length, hazirlar.length]);
  const git = (y: number) => kay.current?.scrollBy({ left: y * (kay.current.clientWidth * 0.8), behavior: "smooth" });
  const ekle = (h: Hazir) => {
    const r = useElements.getState().ekle({ ...h, ornek: true });
    if (r.hata || !r.id) return void toast.error("Element eklenemedi", { description: r.hata ? `${r.hata}.` : "Yeniden dene." });
    toast.success(`@${h.ad} kitaplığına eklendi`, { description: `İstemde @${h.ad} yazarak kullanabilirsin.` });
  };
  const ok = (y: number, a: boolean) => (
    <button onClick={() => git(y)} disabled={!a} aria-label={y < 0 ? "Sola kaydır" : "Sağa kaydır"} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.085] text-white ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.14] disabled:opacity-30 max-sm:hidden">
      {y < 0 ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
    </button>
  );
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.4, ease }}
      className="overflow-hidden rounded-[24px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: `color-mix(in srgb, ${m.hex} 16%, transparent)` }}><I className="h-4 w-4" style={{ color: m.hex }} /></span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="flex items-center gap-2 text-[15.5px] font-semibold text-white">{m.cogul}<span className="rounded-full bg-white/[0.085] px-2 py-0.5 text-[11.5px] font-semibold tabular-nums text-white/70">{liste.length}</span></span>
          <span className="block truncate text-[12.5px] text-white/50">{TUR_ALT[t]}</span>
        </span>
        {!kompakt && <>{ok(-1, uc.sol)}{ok(1, uc.sag)}</>}
        <button onClick={() => onYeni(t)} className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.085] px-3.5 text-[13px] font-medium text-white ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.14]"><Plus className="h-4 w-4" /><span className="max-sm:hidden">Yeni {m.ad.toLocaleLowerCase("tr")}</span></button>
      </div>
      <div ref={kay} onScroll={olc} className="flex gap-3 overflow-x-auto scroll-smooth p-3 [scrollbar-width:none] sm:p-4">
        {liste.map((e) => <ElementKolaj key={e.id} e={e} onDetay={() => onDetay(e)} onKullan={(h) => onKullan(e, h)} />)}
        {hazirlar.map((h) => <HazirKart key={h.ad} h={h} onEkle={() => ekle(h)} />)}
        <button onClick={() => onYeni(t)} className="group flex min-w-[228px] flex-1 flex-col items-center justify-center gap-3 rounded-[20px] px-6 text-center ring-1 ring-inset ring-white/[0.08] transition hover:ring-white/25 max-sm:min-w-[176px]" style={{ background: "rgba(255,255,255,0.03)" }}>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black transition-transform duration-300 group-hover:scale-105"><Plus className="h-5 w-5" /></span>
          <span><span className="block text-[14.5px] font-semibold text-white">Yeni {m.ad.toLocaleLowerCase("tr")}</span><span className="mt-1 block text-[12px] leading-snug text-white/50">1 ile 4 görsel; ya da görseli buraya bırak</span></span>
        </button>
      </div>
    </motion.section>
  );
}
