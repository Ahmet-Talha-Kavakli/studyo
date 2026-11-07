"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Check, Loader2, Monitor, Smartphone, X } from "lucide-react";
import { create } from "zustand";
import { Secici } from "@/components/build/ajanlar/AjanDuzenleyici";
import { alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api } from "@/lib/build/istemci";
import { useAuth } from "@/store/useAuth";
import { cn } from "@/lib/utils";

export const yay = { type: "spring" as const, stiffness: 460, damping: 38 };
export const birincil = "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black transition-opacity disabled:opacity-40";
export const ikincil = "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-white/[0.13] disabled:opacity-40";
export const sayiYaz = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

/**
 * Sağdan açılan panel (Veritabanı YanPanel deseni): bd-panel zemin, başlık + alt satır, kaydırılan gövde, isteğe bağlı alt
 * şerit. Sayfanın üstünde durması için gövdeye taşınır; Esc ve dış tıklama kapatır, telefonda tam genişlik.
 */
export function YanPanel({ acik, kapat, baslik, alt, durum, children, alt2, genislik = 480 }: {
  acik: boolean; kapat: () => void; baslik: React.ReactNode; alt?: React.ReactNode; durum?: React.ReactNode; children: React.ReactNode; alt2?: React.ReactNode; genislik?: number;
}) {
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  useEffect(() => { if (!acik) return; const t = (e: KeyboardEvent) => e.key === "Escape" && kapat(); addEventListener("keydown", t); return () => removeEventListener("keydown", t); }, [acik, kapat]);
  if (!hazir) return null;
  return createPortal(
    <AnimatePresence>
      {acik && (
        <div className="fixed inset-0 z-[125]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={kapat} className="absolute inset-0 bg-black/45" />
          <motion.aside role="dialog" aria-modal="true" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={yay} style={{ ["--yp-w" as string]: `${genislik}px` }}
            className="bd-panel absolute inset-y-0 right-0 flex w-full flex-col sm:w-[var(--yp-w)] sm:rounded-l-[22px]">
            <header className="flex items-start gap-3 border-b border-white/[0.07] px-5 py-4">
              <div className="min-w-0 flex-1"><div className="text-[15.5px] font-semibold text-white">{baslik}</div>{alt && <div className="mt-0.5 text-[12.5px] text-white/50">{alt}</div>}</div>
              {durum}
              <button type="button" onClick={kapat} aria-label="Kapat" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 [scrollbar-width:thin]">{children}</div>
            {alt2 && <footer className="flex flex-wrap items-center gap-2 border-t border-white/[0.07] px-5 py-3">{alt2}</footer>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Başlıktaki anında kayıt durumu: "Kaydediliyor" / "Kaydedildi". */
export function KayitDurumu({ d }: { d: "bos" | "kaydediliyor" | "kaydedildi" }) {
  return (
    <AnimatePresence mode="wait">
      {d !== "bos" && (
        <motion.span key={d} initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1.5 flex shrink-0 items-center gap-1 text-[12px] text-white/50">
          {d === "kaydediliyor" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-[#55d6fd]" />}{d === "kaydediliyor" ? "Kaydediliyor" : "Kaydedildi"}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/** Yuvarlak, çizgiyle bölünmüş ayar grubu ve satırı. */
export function Grup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("divide-y divide-white/[0.06] overflow-hidden rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.08]", className)}>{children}</div>;
}
export function Satir({ baslik, alt, children, alt3 }: { baslik: React.ReactNode; alt?: React.ReactNode; children?: React.ReactNode; alt3?: React.ReactNode }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium text-white">{baslik}</span>{alt && <span className="mt-0.5 block text-[12px] leading-relaxed text-white/50">{alt}</span>}</span>
        {children}
      </div>
      {alt3 && <div className="mt-2.5">{alt3}</div>}
    </div>
  );
}

/* ── Cihaz seçici ve önizleme çerçevesi ── */
export type Cihaz = "masaustu" | "telefon";
export function CihazSecici({ id, deger, set }: { id: string; deger: Cihaz; set: (c: Cihaz) => void }) {
  return (
    <LayoutGroup id={id}>
      <div className="flex shrink-0 rounded-full bg-white/[0.08] p-0.5">
        {([["masaustu", Monitor, "Masaüstü"], ["telefon", Smartphone, "Telefon"]] as const).map(([c, I, ad]) => (
          <button key={c} type="button" onClick={() => set(c)} title={ad} aria-label={ad} aria-pressed={deger === c} className={cn("relative flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition-colors", deger === c ? "text-black" : "text-white/60 hover:text-white")}>
            {deger === c && <motion.span layoutId={`${id}-z`} transition={yay} className="absolute inset-0 rounded-full bg-white" />}
            <I className="relative h-3.5 w-3.5" /><span className="relative max-md:hidden">{ad}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}

/** Kum havuzlu canlı önizleme: masaüstünde tam genişlik, telefonda 390 px çerçeve. allow-same-origin YOK (Vayra deposuna erişemez). */
export function OnizlemeCercevesi({ src, baslik, cihaz, className }: { src: string; baslik: string; cihaz: Cihaz; className?: string }) {
  const [yuklendi, setYuklendi] = useState(false);
  useEffect(() => setYuklendi(false), [src]);
  const tel = cihaz === "telefon";
  return (
    <div className={cn("relative flex h-full w-full justify-center overflow-hidden bg-[#0e0f11]", tel && "py-5", className)}>
      <motion.div layout transition={yay} className={cn("relative h-full overflow-hidden bg-white", tel && "rounded-[38px] ring-[10px] ring-black")} style={{ width: tel ? 390 : "100%", maxWidth: "100%", height: tel ? "min(820px, calc(100% - 4px))" : "100%" }}>
        <iframe src={src} title={baslik} onLoad={() => setYuklendi(true)} sandbox="allow-scripts allow-forms allow-modals allow-popups allow-pointer-lock" className="h-full w-full border-0 bg-white" />
        <AnimatePresence>{!yuklendi && <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center bg-[#0e0f11]"><Loader2 className="h-5 w-5 animate-spin text-white/35" /></motion.div>}</AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ── Görünen ad: Anonim, hesabındaki ad ya da Özel ── */
const YAZAR_ANAHTARI = "vayra-build-yazar";
export const sonYazar = () => { try { return localStorage.getItem(YAZAR_ANAHTARI) ?? ""; } catch { return ""; } };
export const yazarHatirla = (y: string) => { try { localStorage.setItem(YAZAR_ANAHTARI, y); } catch { /* yok */ } };

export function YazarSecici({ id, deger, set }: { id: string; deger: string; set: (v: string) => void }) {
  const hesap = useAuth((s) => s.kullanici?.ad?.trim() ?? "");
  const tur: "anonim" | "hesap" | "ozel" = !deger ? "anonim" : hesap && deger === hesap ? "hesap" : "ozel";
  const [ozel, setOzel] = useState(tur === "ozel" ? deger : "");
  const [ozelAcik, setOzelAcik] = useState(tur === "ozel");
  useEffect(() => { if (tur === "ozel") { setOzel(deger); setOzelAcik(true); } }, [tur, deger]);
  const secim = ozelAcik ? "ozel" : tur;
  return (
    <div className="space-y-2">
      <Secici id={id} deger={secim} set={(v) => { if (v === "ozel") { setOzelAcik(true); if (ozel.trim()) set(ozel.trim()); } else { setOzelAcik(false); set(v === "hesap" ? hesap : ""); } }}
        l={[{ id: "anonim" as const, ad: "Anonim" }, ...(hesap ? [{ id: "hesap" as const, ad: hesap }] : []), { id: "ozel" as const, ad: "Özel" }]} />
      <AnimatePresence initial={false}>
        {ozelAcik && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <input value={ozel} maxLength={40} autoFocus={!deger} onChange={(e) => { setOzel(e.target.value); set(e.target.value.trim()); }} placeholder="Görünecek ad, ör. Lumen Stüdyo" className={cn(alanSinif, "h-10")} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Sahibin paylaşım ve topluluk durumu (projeler sayfasındaki haplar, menü satırları) ── */
type Durum = { paylasilan: Record<string, string>; toplulukta: Record<string, string>; yuklendi: boolean; yukle: () => Promise<void> };
let sonYukleme = 0;
export const usePaylasimDurumu = create<Durum>((set) => ({
  paylasilan: {}, toplulukta: {}, yuklendi: false,
  yukle: async () => {
    if (Date.now() - sonYukleme < 1200) return;
    sonYukleme = Date.now();
    try {
      const v = await api<{ paylasimlar: { id: string; projeId: string }[]; topluluk: { id: string; projeId: string }[] }>("/api/build/paylasim");
      set({ paylasilan: Object.fromEntries(v.paylasimlar.map((x) => [x.projeId, x.id])), toplulukta: Object.fromEntries(v.topluluk.map((x) => [x.projeId, x.id])), yuklendi: true });
    } catch { set({ yuklendi: true }); }
  },
}));
export const paylasimDurumuYenile = () => { sonYukleme = 0; return usePaylasimDurumu.getState().yukle(); };

/** "Paylaşılıyor" hapı (kapak üstü). */
export function PaylasiliyorHapi({ className }: { className?: string }) {
  return <span className={cn("flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full bg-black/60 px-2.5 text-[11.5px] font-medium text-[#a8ecff] backdrop-blur", className)}><span className="h-1.5 w-1.5 rounded-full bg-[#55d6fd]" />Paylaşılıyor</span>;
}

/** Görselin data adresi: kapak için en fazla 1600 px genişlik, webp (tarayıcı desteklemiyorsa png). */
export async function kapakGorseli(f: File): Promise<string | null> {
  if (!f.type.startsWith("image/")) return null;
  const u = URL.createObjectURL(f);
  try {
    const img = await new Promise<HTMLImageElement>((ok, red) => { const i = new Image(); i.onload = () => ok(i); i.onerror = red; i.src = u; });
    const o = Math.min(1, 1600 / img.width);
    const c = document.createElement("canvas"); c.width = Math.round(img.width * o); c.height = Math.round(img.height * o);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    const w = c.toDataURL("image/webp", 0.86);
    return w.startsWith("data:image/webp") ? w : c.toDataURL("image/png");
  } catch { return null; } finally { URL.revokeObjectURL(u); }
}
