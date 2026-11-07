"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const yay = { type: "spring" as const, stiffness: 460, damping: 38 };
export const sn = (ms?: number) => { if (!ms || ms < 1000) return ""; const s = Math.round(ms / 1000); return s < 60 ? `${s} sn` : `${Math.floor(s / 60)} dk ${s % 60} sn`; };
export const alanAdi = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };
export const favicon = (u: string) => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(alanAdi(u))}&sz=64`;
export const boyutYaz = (b?: number) => (!b ? "" : b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} MB`);
export const sayi = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

/** Sağdan açılan panel (Build kalıbı: perde, kenarda kart, Esc ile kapanır). Telefonda tam ekran. */
export function SagPanel({ acik, kapat, baslik, alt, ikon, children, alt2, genislik = 560, ust }: {
  acik: boolean; kapat: () => void; baslik: React.ReactNode; alt?: React.ReactNode; ikon?: React.ReactNode; children: React.ReactNode; alt2?: React.ReactNode; genislik?: number; ust?: React.ReactNode;
}) {
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  useEffect(() => { if (!acik) return; const t = (e: KeyboardEvent) => { if (e.key === "Escape") kapat(); }; addEventListener("keydown", t); return () => removeEventListener("keydown", t); }, [acik, kapat]);
  if (!hazir) return null;
  return createPortal(
    <AnimatePresence>
      {acik && (
        <motion.div key="perde" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="perde fixed inset-0 z-[120] flex justify-end sm:p-3" onMouseDown={(e) => { if (e.target === e.currentTarget) kapat(); }}>
          <motion.div role="dialog" aria-modal="true" initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 38 }}
            style={{ maxWidth: genislik }} className="flex h-full w-full flex-col overflow-hidden bg-[#141416] ring-1 ring-white/[0.1] sm:rounded-[24px]">
            <div className="flex min-h-[62px] items-center gap-3 border-b border-white/[0.06] px-4 py-3">
              {ikon && <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.07] text-white">{ikon}</span>}
              <div className="min-w-0 flex-1"><p className="truncate text-[16px] font-semibold tracking-[-0.01em] text-white">{baslik}</p>{alt && <div className="truncate text-[12.5px] text-white/50">{alt}</div>}</div>
              {ust}
              <button type="button" onClick={kapat} aria-label="Kapat" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-width:thin]">{children}</div>
            {alt2 && <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] p-3 sm:p-4">{alt2}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/**
 * Bir düğmeye bağlı açılır menü: ekrana sabit konumlanır (dar sütunda kesilmez), aşağıda yer yoksa yukarı açılır,
 * dışarı tıklayınca ve Esc ile kapanır.
 */
export function useAcilir(en = 300, tercih: "yukari" | "asagi" = "asagi") {
  const [acik, setAcik] = useState(false);
  const [konum, setKonum] = useState<{ left: number; top?: number; bottom?: number; maxHeight: number }>({ left: 0, maxHeight: 400 });
  const kok = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const hesapla = () => {
    const r = kok.current?.getBoundingClientRect();
    if (!r) return;
    const asagi = innerHeight - r.bottom - 12, yukari = r.top - 12;
    const yk = tercih === "yukari" ? yukari > 220 || yukari > asagi : asagi < 260 && yukari > asagi;
    const w = Math.min(en, innerWidth - 16);
    setKonum({ left: Math.max(8, Math.min(r.left, innerWidth - w - 8)), ...(yk ? { bottom: innerHeight - r.top + 6 } : { top: r.bottom + 6 }), maxHeight: Math.max(180, Math.min(560, (yk ? yukari : asagi) - 6)) });
  };
  useLayoutEffect(() => { if (acik) hesapla(); }, [acik]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!acik) return;
    const f = (e: MouseEvent) => { const t = e.target as Node; if (!kok.current?.contains(t) && !menu.current?.contains(t)) setAcik(false); };
    const t = (e: KeyboardEvent) => { if (e.key === "Escape") setAcik(false); };
    const r = () => setAcik(false);
    addEventListener("mousedown", f); addEventListener("keydown", t); addEventListener("resize", r);
    return () => { removeEventListener("mousedown", f); removeEventListener("keydown", t); removeEventListener("resize", r); };
  }, [acik]);
  return { acik, setAcik, kok, menu, stil: { ...konum, width: Math.min(en, typeof window === "undefined" ? en : innerWidth - 16) } };
}

/** Açılır menü kabuğu (bd-panel, gölgesiz). */
export function Acilir({ a, children, className }: { a: ReturnType<typeof useAcilir>; children: React.ReactNode; className?: string }) {
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  if (!hazir) return null;
  return createPortal(
    <AnimatePresence>
      {a.acik && (
        <motion.div ref={a.menu} initial={{ opacity: 0, y: 4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.98 }} transition={{ duration: 0.14 }}
          style={a.stil} className={cn("bd-panel fixed z-[130] overflow-y-auto rounded-[18px] p-1.5 [scrollbar-width:thin]", className)}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function MenuSatir({ ikon, ad, alt, sag, onClick, secili, tehlike, disabled, title }: { ikon?: React.ReactNode; ad: React.ReactNode; alt?: React.ReactNode; sag?: React.ReactNode; onClick?: () => void; secili?: boolean; tehlike?: boolean; disabled?: boolean; title?: string }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title}
      className={cn("flex w-full items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-left transition-colors disabled:opacity-40", secili ? "bg-white/[0.08] ring-1 ring-inset ring-white/70" : "enabled:hover:bg-white/[0.06]", tehlike && "text-rose-300")}>
      {ikon && <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06]", tehlike ? "text-rose-300" : "text-white/80")}>{ikon}</span>}
      <span className="min-w-0 flex-1"><span className={cn("block truncate text-[13.5px]", tehlike ? "text-rose-200" : "text-white")}>{ad}</span>{alt && <span className="block truncate text-[12px] text-white/50">{alt}</span>}</span>
      {sag}
    </button>
  );
}

/** "2 / 3" sürüm geçişi (oklarla). */
export function SurumGecis({ sira, toplam, sec }: { sira: number; toplam: number; sec: (i: number) => void }) {
  if (toplam < 2) return null;
  return (
    <span className="inline-flex h-7 items-center rounded-full text-[12px] tabular-nums text-white/55">
      <button type="button" aria-label="Önceki sürüm" disabled={sira <= 0} onClick={() => sec(sira - 1)} className="flex h-7 w-6 items-center justify-center rounded-full enabled:hover:bg-white/[0.07] enabled:hover:text-white disabled:opacity-30"><ChevronLeft className="h-3.5 w-3.5" /></button>
      <span className="min-w-[36px] text-center">{sira + 1} / {toplam}</span>
      <button type="button" aria-label="Sonraki sürüm" disabled={sira >= toplam - 1} onClick={() => sec(sira + 1)} className="flex h-7 w-6 items-center justify-center rounded-full enabled:hover:bg-white/[0.07] enabled:hover:text-white disabled:opacity-30"><ChevronRight className="h-3.5 w-3.5" /></button>
    </span>
  );
}

/** Mesaj altındaki simge düğmesi. */
export function Eylem({ title, onClick, children, aktif, className }: { title: string; onClick?: () => void; children: React.ReactNode; aktif?: boolean; className?: string }) {
  return <button type="button" title={title} aria-label={title} onClick={onClick} className={cn("flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/[0.07] hover:text-white", aktif ? "text-[#8be6ff]" : "text-white/45", className)}>{children}</button>;
}

/** Dosyayı indir (istemcide üretilmiş metin). */
export function indir(ad: string, icerik: string, tur = "text/markdown;charset=utf-8") {
  const u = URL.createObjectURL(new Blob([icerik], { type: tur }));
  const a = document.createElement("a"); a.href = u; a.download = ad; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 2000);
}
export const dosyaAdi = (s: string) => (s.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase().slice(0, 60) || "sohbet");

/** Anahtarlı menü satırı: bütün satır tek düğmedir (iç içe düğme yok); sağda Anahtar görünümü. */
export function MenuAnahtar({ ikon, ad, alt, acik, set, disabled }: { ikon: React.ReactNode; ad: React.ReactNode; alt?: React.ReactNode; acik: boolean; set: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={acik} disabled={disabled} onClick={() => set(!acik)}
      className="flex w-full items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-left transition-colors enabled:hover:bg-white/[0.06] disabled:opacity-40">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-white/80">{ikon}</span>
      <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] text-white">{ad}</span>{alt && <span className="block truncate text-[12px] text-white/50">{alt}</span>}</span>
      <span className={cn("relative h-[24px] w-[40px] shrink-0 rounded-full transition-colors duration-300", acik ? "bg-[#55d6fd]" : "bg-white/[0.14]")}>
        <motion.span layout transition={yay} className={cn("absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white", acik ? "right-[3px]" : "left-[3px]")} />
      </span>
    </button>
  );
}

/*
 * Sohbet bölümünün kendi küçük denetimleri (Ajanlar düzenleyicisindekilerle aynı görünüm). Sohbet sayfaları ajan
 * düzenleyicisinin bütün modül ağacını yüklemesin ve oradaki döngüsel içe aktarmalardan etkilenmesin diye buradadır.
 */
export const alanSinif = "w-full rounded-[14px] bg-white/[0.05] px-3.5 text-[14px] text-white outline-none ring-1 ring-inset ring-white/[0.08] transition-shadow placeholder:text-white/30 focus:ring-white/30";

/** Açma kapama anahtarı. */
export function Anahtar({ acik, set, etiket }: { acik: boolean; set: (v: boolean) => void; etiket: string }) {
  return (
    <button type="button" role="switch" aria-checked={acik} aria-label={etiket} onClick={() => set(!acik)} className={cn("relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#55d6fd]", acik ? "bg-[#55d6fd]" : "bg-white/[0.14] hover:bg-white/[0.2]")}>
      <motion.span layout transition={yay} className={cn("absolute top-[3px] h-5 w-5 rounded-full bg-white", acik ? "right-[3px]" : "left-[3px]")} />
    </button>
  );
}

/** Kayan beyaz seçimli küçük bölümlü düğme grubu. */
export function Secici<T extends string>({ id, deger, set, l, kucuk }: { id: string; deger: T; set: (v: T) => void; l: { id: T; ad: string; ipucu?: string; kapali?: boolean }[]; kucuk?: boolean }) {
  return (
    <LayoutGroup id={id}>
      <div className="flex shrink-0 rounded-full bg-white/[0.07] p-0.5">
        {l.map((x) => (
          <button key={x.id} type="button" title={x.ipucu} disabled={x.kapali} onClick={() => set(x.id)}
            className={cn("relative rounded-full font-medium transition-colors disabled:opacity-30", kucuk ? "h-7 px-2.5 text-[12px]" : "h-8 px-3 text-[12.5px]", deger === x.id ? "text-black" : "text-white/60 enabled:hover:text-white")}>
            {deger === x.id && <motion.span layoutId={`${id}-z`} transition={yay} className="absolute inset-0 rounded-full bg-white" />}
            <span className="relative whitespace-nowrap">{x.ad}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}
