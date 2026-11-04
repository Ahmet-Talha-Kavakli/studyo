"use client";

/**
 * Ayarlar arayüz dili (2026-10-28, "A · Rafine ray").
 * Linear / Claude / Apple ayarlarından süzülen kurallar:
 * - Sayfa başlığı başlık kartında; bölüm başlığı kartın içinde, satırlar ince çizgiyle ayrılır.
 * - Satır: solda ad + tek satır açıklama, sağda kompakt kontrol. Simge kutusu yok.
 * - Anahtar, seçici ve segmentler anında kaydeder; başlıkta "Kaydedildi" belirir.
 *   Yazı alanları alttaki kaydet çubuğuyla kaydedilir.
 * - Renk: nötr zemin, imza camgöbeği (#55d6fd). Koyu gölge yok.
 */

import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { create } from "zustand";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const CAMGOBEGI = "#55d6fd";
export const yay = { type: "spring" as const, stiffness: 520, damping: 38 };
export const akis = [0.22, 1, 0.36, 1] as const;

/* ── Anında kayıt işareti ── */
const useKayit = create<{ n: number; kaydet: () => void }>((set) => ({ n: 0, kaydet: () => set((s) => ({ n: s.n + 1 })) }));
/** Anında kaydedilen her değişiklikten sonra çağrılır; sayfa başlığında "Kaydedildi" belirir. */
export const kaydedildi = () => useKayit.getState().kaydet();

function KayitIsareti() {
  const n = useKayit((s) => s.n);
  const ilk = useRef(n);
  return (
    <AnimatePresence mode="wait">
      {n !== ilk.current && (
        <motion.span key={n} initial={{ opacity: 0, y: 4, scale: 0.96 }} animate={{ opacity: [0, 1, 1, 0], y: 0, scale: 1 }} transition={{ duration: 2.4, times: [0, 0.08, 0.82, 1] }}
          className="flex h-8 items-center gap-1.5 rounded-full bg-[#55d6fd]/10 px-3 text-[12.5px] font-medium text-[#55d6fd]">
          <Check className="h-3.5 w-3.5" strokeWidth={2.6} />Kaydedildi
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/* ── Sayfa ── */
/**
 * Sayfa: başlık, altında iki sütun. Solda Vercel kartları, sağda (geniş ekranda yapışkan) o sayfaya özel
 * canlı önizleme paneli (`yan`). Mobilde yan panel kartların üstüne geçer.
 */
export function Sayfa({ baslik, aciklama, sag, children, ust, yan }: { baslik: string; aciklama?: ReactNode; sag?: ReactNode; children: ReactNode; ust?: ReactNode; yan?: ReactNode }) {
  return (
    <div>
      {/* Başlık kartı: başlık havada durmaz (site kuralı); sağda anında kayıt işareti + sayfa bağlantısı. */}
      <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: akis }}
        className="mb-6 flex items-center justify-between gap-4 rounded-[22px] bg-[#121214] px-5 py-[18px] ring-1 ring-inset ring-white/[0.08] sm:px-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-semibold leading-[1.2] tracking-[-0.025em] text-white sm:text-[24px]">{baslik}</h1>
          {aciklama && <p className="mt-1 max-w-[680px] text-[14px] leading-relaxed text-white/55">{aciklama}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2"><KayitIsareti /><span className="hidden sm:contents">{sag}</span></div>
      </motion.header>
      {ust && <div className="mb-6">{ust}</div>}
      <div className={cn(yan && "grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]")}>
        <motion.div initial="gizli" animate="acik" variants={{ acik: { transition: { staggerChildren: 0.05, delayChildren: 0.06 } } }} className="min-w-0 space-y-6">
          {children}
        </motion.div>
        {yan && (
          <motion.aside initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: akis }}
            className="order-first space-y-4 xl:sticky xl:top-[calc(var(--ust-nav)+24px)] xl:order-none">
            {yan}
          </motion.aside>
        )}
      </div>
    </div>
  );
}

const grupHareket = { gizli: { opacity: 0, y: 10 }, acik: { opacity: 1, y: 0, transition: { duration: 0.45, ease: akis } } };

/**
 * Vercel kartı: başlık ve açıklama kartın içinde, altında satırlar ya da serbest içerik,
 * en altta gri şerit (not solda, eylem sağda).
 */
export function Grup({ baslik, aciklama, sag, children, id, tehlike, alt, govde, className }: {
  baslik?: ReactNode; aciklama?: ReactNode; sag?: ReactNode; children?: ReactNode; id?: string; tehlike?: boolean; alt?: ReactNode;
  /** Satır listesi yerine serbest içerik (padding'li). */
  govde?: boolean; className?: string;
}) {
  const ust = baslik || sag;
  return (
    <motion.section id={id} variants={grupHareket}
      className={cn("scroll-mt-28 overflow-hidden rounded-[18px] ring-1 ring-inset", tehlike ? "bg-rose-500/[0.03] ring-rose-500/25" : "bg-[#121214] ring-white/[0.08]", className)}>
      {ust && (
        <div className={cn("flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-6 pt-6", aciklama ? "pb-5" : "pb-4")}>
          <div className="min-w-0 flex-1 basis-[240px]">
            {baslik && <h2 className={cn("text-[18px] font-semibold tracking-[-0.015em]", tehlike ? "text-rose-200" : "text-white")}>{baslik}</h2>}
            {aciklama && <p className="mt-1.5 text-[14px] leading-relaxed text-white/55">{aciklama}</p>}
          </div>
          {sag && <div className="flex shrink-0 items-center gap-2">{sag}</div>}
        </div>
      )}
      {children !== undefined && children !== false && (
        <div className={cn(govde ? cn("px-6 pb-6", !ust && "pt-6") : cn("divide-y", tehlike ? "divide-rose-500/15" : "divide-white/[0.06]", ust && (tehlike ? "border-t border-rose-500/15" : "border-t border-white/[0.06]")))}>{children}</div>
      )}
      {alt && <div className={cn("flex min-h-[56px] flex-wrap items-center justify-between gap-3 border-t px-6 py-3 text-[13px]", tehlike ? "border-rose-500/20 bg-rose-500/[0.05] text-rose-200/70" : "border-white/[0.06] bg-white/[0.02] text-white/45")}>{alt}</div>}
    </motion.section>
  );
}

/** Satır: solda ad + açıklama, sağda kontrol. `id` ayar aramasından gelinince satırı parlatır. */
export function Satir({ id, ad, alt, on, children, dikey, genis, className }: {
  id?: string; ad: ReactNode; alt?: ReactNode; on?: ReactNode; children?: ReactNode;
  /** Kontrol (yazı alanı) mobilde tam genişlik alt satıra iner. */
  genis?: boolean;
  /** Kontrol açıklamanın altına geçer (geniş içerik). */
  dikey?: boolean; className?: string;
}) {
  return (
    <div id={id} className={cn("ayar-satir scroll-mt-28 px-6 py-4 transition-colors", dikey ? "flex flex-col gap-3.5" : "flex flex-wrap items-center gap-x-8 gap-y-3", className)}>
      <div className={cn("flex min-w-0 flex-1 items-center gap-3.5", !dikey && "basis-[260px]")}>
        {on}
        <div className="min-w-0 flex-1">
          <div className="text-[14.5px] font-medium leading-snug text-white">{ad}</div>
          {alt && <div className="mt-0.5 text-[13px] leading-relaxed text-white/50">{alt}</div>}
        </div>
      </div>
      {children !== undefined && <div className={cn("flex min-w-0 max-w-full items-center gap-2", !dikey && "ml-auto shrink-0", genis && "w-full sm:w-auto")}>{children}</div>}
    </div>
  );
}

/* ── Kontroller ── */
export function Anahtar({ acik, onDegis, etiket, kayit = true, disabled }: { acik: boolean; onDegis: (v: boolean) => void; etiket: string; kayit?: boolean; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={acik} aria-label={etiket} disabled={disabled}
      onClick={() => { onDegis(!acik); if (kayit) kaydedildi(); }}
      className={cn("relative h-[28px] w-[46px] shrink-0 rounded-full transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#55d6fd] disabled:opacity-40", acik ? "bg-[#55d6fd]" : "bg-white/[0.14] hover:bg-white/[0.2]")}>
      <motion.span layout transition={yay} className={cn("absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white", acik ? "right-[3px]" : "left-[3px]")} />
    </button>
  );
}

export type SegSecenek<T extends string> = { deger: T; ad: ReactNode; ikon?: ReactNode; etiket?: string };
export function Segment<T extends string>({ secenekler, deger, onSec, kucuk, kayit = true, className, tam }: {
  secenekler: SegSecenek<T>[]; deger: T; onSec: (v: T) => void; kucuk?: boolean; kayit?: boolean; className?: string; tam?: boolean;
}) {
  const id = useId();
  return (
    <div role="radiogroup" className={cn("flex shrink-0 rounded-[12px] bg-white/[0.06] p-[3px]", tam && "w-full", className)}>
      {secenekler.map((s) => {
        const sec = s.deger === deger;
        return (
          <button key={s.deger} type="button" role="radio" aria-checked={sec} aria-label={s.etiket}
            onClick={() => { if (!sec) { onSec(s.deger); if (kayit) kaydedildi(); } }}
            className={cn("relative flex items-center justify-center gap-1.5 rounded-[9px] font-medium tabular-nums transition-colors", kucuk ? "h-7 px-2.5 text-[12.5px]" : "h-8 px-3 text-[13px]", tam && "flex-1", sec ? "font-semibold text-black" : "text-white/55 hover:text-white")}>
            {sec && <motion.span layoutId={`seg-${id}`} transition={yay} className="absolute inset-0 rounded-[9px] bg-white" />}
            {s.ikon && <span className="relative">{s.ikon}</span>}
            <span className="relative whitespace-nowrap">{s.ad}</span>
          </button>
        );
      })}
    </div>
  );
}

export type SeciciSecenek<T extends string> = { deger: T; ad: string; alt?: string; on?: ReactNode; sag?: ReactNode; kapali?: boolean };
/** Açılır seçici: düğmede seçili değer (önünde küçük görsel/logo), menüde ad + açıklama; seçili satır beyaz çerçeveli (tik yok). */
export function Secici<T extends string>({ deger, secenekler, onSec, genislik = 280, kayit = true, baslik }: {
  deger: T; secenekler: SeciciSecenek<T>[]; onSec: (v: T) => void; genislik?: number; kayit?: boolean; baslik?: string;
}) {
  const [acik, setAcik] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [yukari, setYukari] = useState(false);
  /* Menü sabit konumlu: kart overflow-hidden olduğundan absolute menü kartın kenarında kesiliyordu. */
  const [konum, setKonum] = useState<{ ust: number; alt: number; sag: number; boy: number }>({ ust: 0, alt: 0, sag: 0, boy: 340 });
  useEffect(() => {
    if (!acik) return;
    const f = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setAcik(false); };
    const t = (e: KeyboardEvent) => { if (e.key === "Escape") setAcik(false); };
    const acilis = performance.now();
    const kapat = (e: Event) => { if (performance.now() - acilis < 400) return; if (e.target instanceof Node && ref.current?.contains(e.target)) return; setAcik(false); };
    addEventListener("mousedown", f); addEventListener("keydown", t); addEventListener("scroll", kapat, true); addEventListener("resize", kapat);
    return () => { removeEventListener("mousedown", f); removeEventListener("keydown", t); removeEventListener("scroll", kapat, true); removeEventListener("resize", kapat); };
  }, [acik]);
  const ac = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) {
      // Telefonda alt sekme çubuğu (yaklaşık 84px) ve üst çubuk menünün altında kalmasın.
      const altPay = innerWidth < 1024 ? 96 : 16, ustPay = 72;
      const asagi = innerHeight - r.bottom - altPay, yukariAlan = r.top - ustPay;
      const yk = asagi < 340 && yukariAlan > asagi;
      setYukari(yk);
      setKonum({ ust: r.bottom + 6, alt: innerHeight - r.top + 6, sag: Math.max(8, innerWidth - r.right), boy: Math.min(340, Math.max(160, yk ? yukariAlan : asagi)) });
    }
    setAcik((v) => !v);
  };
  const sec = secenekler.find((s) => s.deger === deger);
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-haspopup="listbox" aria-expanded={acik}
        onClick={ac}
        className={cn("flex h-9 max-w-[260px] items-center gap-2 rounded-[11px] bg-white/[0.06] pr-2.5 text-[13.5px] font-medium text-white ring-1 ring-inset ring-white/[0.06] transition-colors hover:bg-white/[0.1]", sec?.on ? "pl-1.5" : "pl-3", acik && "bg-white/[0.1]")}>
        {sec?.on}
        <span className="truncate">{sec?.ad ?? "Seç"}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-white/45 transition-transform duration-200", acik && "rotate-180")} />
      </button>
      <AnimatePresence>
        {acik && (
          <motion.div role="listbox" initial={{ opacity: 0, y: yukari ? 6 : -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: yukari ? 4 : -4, scale: 0.98 }} transition={{ duration: 0.16, ease: akis }}
            style={{ width: Math.min(genislik, (typeof window === "undefined" ? genislik : innerWidth - 16)), right: konum.sag, maxHeight: konum.boy, ...(yukari ? { bottom: konum.alt } : { top: konum.ust }) }}
            className={cn("bd-panel fixed z-[60] overflow-y-auto rounded-[16px] p-1.5 [scrollbar-width:thin]", yukari ? "origin-bottom-right" : "origin-top-right")}>
            {baslik && <p className="px-2.5 pb-1 pt-1.5 text-[12px] text-white/40">{baslik}</p>}
            {secenekler.map((s) => (
              <button key={s.deger} type="button" role="option" aria-selected={s.deger === deger} disabled={s.kapali}
                onClick={() => { if (s.deger !== deger) { onSec(s.deger); if (kayit) kaydedildi(); } setAcik(false); }}
                className={cn("flex w-full items-center gap-2.5 rounded-[10px] px-2 py-2 text-left transition-colors disabled:opacity-40 disabled:hover:bg-transparent", s.deger === deger ? "bg-white/[0.08] ring-1 ring-inset ring-white/60" : "hover:bg-white/[0.06]")}>
                {s.on}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] text-white">{s.ad}</span>
                  {s.alt && <span className="block truncate text-[12px] text-white/45">{s.alt}</span>}
                </span>
                {s.sag}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Düğmeler ve alanlar ── */
export const dugme = {
  birincil: "inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition-[transform,opacity] hover:opacity-90 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-35",
  /** Ana eylem: sitede ana düğmeler beyaz (kullanıcı kuralı); eski vurgu adı korunur. */
  vurgu: "inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition-[transform,opacity] hover:opacity-90 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-35",
  ikincil: "inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[13.5px] font-medium text-white ring-1 ring-inset ring-white/[0.08] transition-[transform,background-color] hover:bg-white/[0.12] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-35",
  hayalet: "inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-[13.5px] font-medium text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white disabled:pointer-events-none disabled:opacity-35",
  tehlike: "inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-rose-500/12 px-4 text-[13.5px] font-semibold text-rose-300 ring-1 ring-inset ring-rose-500/25 transition-[transform,background-color] hover:bg-rose-500/20 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-35",
  tehlikeDolu: "inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-rose-500 px-4 text-[13.5px] font-semibold text-white transition-[transform,filter] hover:brightness-110 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-35",
};
export const alan = "h-10 w-full rounded-[12px] bg-white/[0.05] px-3.5 text-[14px] text-white outline-none ring-1 ring-inset ring-white/[0.08] transition-[box-shadow,background-color] placeholder:text-white/35 hover:bg-white/[0.07] focus:bg-white/[0.07] focus:ring-[#55d6fd]/60";

/** Küçük durum hapı. */
export function Hap({ children, ton = "notr", className }: { children: ReactNode; ton?: "notr" | "vurgu" | "yesil" | "sari" | "kirmizi"; className?: string }) {
  const t = { notr: "bg-white/[0.07] text-white/70", vurgu: "bg-[#55d6fd]/12 text-[#55d6fd]", yesil: "bg-emerald-400/12 text-emerald-300", sari: "bg-amber-400/12 text-amber-300", kirmizi: "bg-rose-500/12 text-rose-300" }[ton];
  return <span className={cn("inline-flex h-[22px] shrink-0 items-center gap-1 rounded-full px-2 text-[11.5px] font-semibold", t, className)}>{children}</span>;
}

/** Demo olduğu açıkça belirtilen işlev. */
export function Demo({ className }: { className?: string }) {
  return <span title="Bu işlev şimdilik örnek veriyle çalışır" className={cn("inline-flex h-[20px] shrink-0 items-center rounded-full bg-amber-400/15 px-1.5 text-[11px] font-semibold text-amber-300", className)}>Örnek</span>;
}

/** İnce ilerleme çubuğu (ölçeklenir, yeniden düzen yok). */
export function Cubuk({ oran, renk = CAMGOBEGI, className }: { oran: number; renk?: string; className?: string }) {
  return (
    <span className={cn("block h-[6px] overflow-hidden rounded-full bg-white/[0.08]", className)}>
      <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: Math.max(0, Math.min(1, oran)) }} transition={{ duration: 0.9, ease: akis }}
        className="block h-full origin-left rounded-full" style={{ background: renk }} />
    </span>
  );
}

/* ── Pencere: sağdan açılan panel (site kuralı: açılır pencereler sağ panel); telefonda alttan çıkar. ── */
const PencereBaglam = createContext<() => void>(() => {});
export const usePencereKapat = () => useContext(PencereBaglam);

export function Pencere({ acik, onKapat, baslik, aciklama, children, alt, genislik = 480 }: {
  acik: boolean; onKapat: () => void; baslik: ReactNode; aciklama?: ReactNode; children?: ReactNode; alt?: ReactNode; genislik?: number;
}) {
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  useEffect(() => {
    if (!acik) return;
    const t = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onKapat(); } };
    addEventListener("keydown", t, true);
    const eski = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { removeEventListener("keydown", t, true); document.body.style.overflow = eski; };
  }, [acik, onKapat]);
  if (!hazir) return null;
  return createPortal(
    <AnimatePresence>
      {acik && (
        <motion.div key="perde" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 sm:items-stretch sm:justify-end sm:bg-transparent sm:p-3" onMouseDown={(e) => { if (e.target === e.currentTarget) onKapat(); }}>
          <motion.div role="dialog" aria-modal="true" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 32, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 38 }}
            className="kesfet-tema flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[28px] bg-[#161618] ring-1 ring-white/[0.1] sm:max-h-none sm:rounded-[24px]" style={{ maxWidth: genislik, background: "#161618" }}>
            <div className="flex items-start justify-between gap-4 px-6 pb-1 pt-6">
              <div className="min-w-0">
                <h2 className="text-[19px] font-semibold tracking-[-0.015em] text-white">{baslik}</h2>
                {aciklama && <p className="mt-1.5 text-[14px] leading-relaxed text-white/55">{aciklama}</p>}
              </div>
              <button type="button" onClick={onKapat} aria-label="Kapat" className="-mr-2 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/60 transition-colors hover:bg-white/[0.12] hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <PencereBaglam.Provider value={onKapat}>
              {children && <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-4">{children}</div>}
              {alt && <div className="mt-auto flex flex-wrap justify-end gap-2 border-t border-white/[0.06] px-6 py-4">{alt}</div>}
            </PencereBaglam.Provider>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Kaydedilmemiş değişiklik çubuğu — içerik sütununun altında yüzer. */
export function KaydetCubugu({ gorunur, onKaydet, onSifirla, hata }: { gorunur: boolean; onKaydet: () => void; onSifirla: () => void; hata?: string | null }) {
  useEffect(() => {
    if (!gorunur) return;
    const u = (e: BeforeUnloadEvent) => e.preventDefault();
    addEventListener("beforeunload", u); return () => removeEventListener("beforeunload", u);
  }, [gorunur]);
  return (
    <AnimatePresence>
      {gorunur && (
        <motion.div initial={{ y: 40, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0, scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 32 }}
          className="fixed inset-x-0 bottom-[calc(84px+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 sm:bottom-6 lg:pl-[264px]">
          <div role="region" aria-label="Kaydedilmemiş değişiklikler"
            className="flex h-[56px] w-full max-w-[560px] items-center gap-3 rounded-full bg-[linear-gradient(180deg,#202023,#161618)] pl-5 pr-2 [box-shadow:inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(255,255,255,0.1)]">
            <span className={cn("h-2 w-2 shrink-0 rounded-full", hata ? "bg-rose-400" : "bg-amber-400")} />
            <p className="min-w-0 flex-1 truncate text-[14px] text-white/75">{hata ?? "Kaydedilmemiş değişiklikler var"}</p>
            <button type="button" onClick={onSifirla} className={dugme.hayalet}>Geri al</button>
            <button type="button" onClick={onKaydet} disabled={!!hata} className={cn(dugme.birincil, "h-10 px-5")}>Kaydet</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
