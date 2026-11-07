"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, ChevronUp, Eye, EyeOff, Layers, Link2, Loader2, Redo2, RotateCcw, Ruler, Trash2, Undo2, Unlink2, Wand2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { hexe } from "./kaynak";
import type { Secim } from "./Onizleme";

const yay = { type: "spring" as const, stiffness: 460, damping: 38 };

/** Köprünün "tBilgi" yanıtı: katman yolu (seçiliden body'ye), çocuklar, geniş stil özeti. */
export type TBilgi = {
  secici: string;
  yol: { secici: string; etiket: string; sinif: string; metin: string }[];
  cocuklar: { secici: string; etiket: string; sinif: string; metin: string; cocuk: number }[];
  stil: Record<string, string>;
  ayni: number;
};

/** Bekleyen (henüz kaynağa yazılmamış) görsel düzenleme: öğe başına stiller ya da silme. */
export type BekleyenOge = { sayfa: string; secici: string; etiket: string; metin?: string; stiller: Record<string, string>; sil?: boolean };
type Islem = { anahtar: string; ozellik: string; onceki?: string; yeni?: string; oge: Omit<BekleyenOge, "stiller" | "sil"> };

const anahtarOf = (sayfa: string, secici: string) => `${sayfa}|${secici}`;

/**
 * Bekleyen düzenlemeler: her değişiklik önizlemeye anında uygulanır (köprü "stil"), kaynak dosyaya ancak "Uygula" ile
 * TEK sürüm olarak yazılır. Geri al ve yinele bu yığın üzerinde çalışır (v0 Design Mode ve Figma Make modeli).
 */
export function useBekleyen(ilet: (m: Record<string, unknown>) => void) {
  const [ogeler, setOgeler] = useState<Record<string, BekleyenOge>>({});
  const [geri, setGeri] = useState<Islem[]>([]);
  const [ileri, setIleri] = useState<Islem[]>([]);

  const yaz = useCallback((i: Islem, deger: string | undefined) => {
    setOgeler((x) => {
      const eski = x[i.anahtar] ?? { ...i.oge, stiller: {} };
      const o: BekleyenOge = { ...eski, stiller: { ...eski.stiller } };
      if (i.ozellik === "__sil") { if (deger) o.sil = true; else delete o.sil; }
      else if (deger === undefined) delete o.stiller[i.ozellik];
      else o.stiller[i.ozellik] = deger;
      const y = { ...x };
      if (!Object.keys(o.stiller).length && !o.sil) delete y[i.anahtar]; else y[i.anahtar] = o;
      return y;
    });
    if (i.ozellik === "__sil") ilet({ tur: "tGizle", secici: i.oge.secici, gizli: !!deger });
    else ilet({ tur: "stil", secici: i.oge.secici, ozellik: i.ozellik, deger: deger ?? "" });
  }, [ilet]);

  const degis = useCallback((oge: Islem["oge"], ozellik: string, yeni: string | undefined) => {
    const a = anahtarOf(oge.sayfa, oge.secici);
    const onceki = ozellik === "__sil" ? (ogeler[a]?.sil ? "1" : undefined) : ogeler[a]?.stiller[ozellik];
    if (onceki === yeni) return;
    const i: Islem = { anahtar: a, ozellik, onceki, yeni, oge };
    // Aynı özelliğin art arda değişimini (kaydırıcı sürükleme) tek adımda birleştir.
    setGeri((l) => { const s = l.at(-1); if (s && s.anahtar === a && s.ozellik === ozellik && ozellik !== "__sil") return [...l.slice(0, -1), { ...s, yeni }]; return [...l, i].slice(-200); });
    setIleri([]);
    yaz(i, yeni);
  }, [ogeler, yaz]);

  const geriAl = useCallback(() => { const s = geri.at(-1); if (!s) return; setGeri((l) => l.slice(0, -1)); setIleri((l) => [...l, s]); yaz(s, s.onceki); }, [geri, yaz]);
  const yinele = useCallback(() => { const s = ileri.at(-1); if (!s) return; setIleri((l) => l.slice(0, -1)); setGeri((l) => [...l, s]); yaz(s, s.yeni); }, [ileri, yaz]);
  /** Bütün bekleyenleri önizlemeden geri çeker (kaynak hiç değişmemişti). */
  const sifirla = useCallback((yeniden = true) => {
    if (yeniden) for (const o of Object.values(ogeler)) { for (const k of Object.keys(o.stiller)) ilet({ tur: "stil", secici: o.secici, ozellik: k, deger: "" }); if (o.sil) ilet({ tur: "tGizle", secici: o.secici, gizli: false }); }
    setOgeler({}); setGeri([]); setIleri([]);
  }, [ogeler, ilet]);
  const ogeSifirla = useCallback((sayfa: string, secici: string) => {
    const a = anahtarOf(sayfa, secici), o = ogeler[a];
    if (!o) return;
    for (const k of Object.keys(o.stiller)) ilet({ tur: "stil", secici, ozellik: k, deger: "" });
    if (o.sil) ilet({ tur: "tGizle", secici, gizli: false });
    setOgeler((x) => { const y = { ...x }; delete y[a]; return y; });
    setGeri((l) => l.filter((i) => i.anahtar !== a)); setIleri((l) => l.filter((i) => i.anahtar !== a));
  }, [ogeler, ilet]);
  /** Önizleme yeniden yüklendiğinde bekleyenleri yeniden uygular. */
  const yeniden = useCallback((sayfa: string) => {
    for (const o of Object.values(ogeler)) if (o.sayfa === sayfa) { for (const [k, v] of Object.entries(o.stiller)) ilet({ tur: "stil", secici: o.secici, ozellik: k, deger: v }); if (o.sil) ilet({ tur: "tGizle", secici: o.secici, gizli: true }); }
  }, [ogeler, ilet]);
  const sayi = useMemo(() => Object.values(ogeler).reduce((t, o) => t + Object.keys(o.stiller).length + (o.sil ? 1 : 0), 0), [ogeler]);
  return { ogeler, degis, geriAl, yinele, sifirla, ogeSifirla, yeniden, sayi, geriVar: geri.length > 0, ileriVar: ileri.length > 0 };
}
export type Bekleyen = ReturnType<typeof useBekleyen>;

const YAZI_TIPLERI = ["Inter", "DM Sans", "Manrope", "Poppins", "Space Grotesk", "Fraunces", "Playfair Display", "Lora", "Instrument Serif", "JetBrains Mono"];
const GOLGELER: [string, string][] = [["Yok", "none"], ["Hafif", "0 1px 3px rgba(0,0,0,0.12)"], ["Orta", "0 8px 24px rgba(0,0,0,0.14)"], ["Güçlü", "0 20px 50px rgba(0,0,0,0.25)"]];
const px = (v?: string) => { const n = parseFloat(v ?? ""); return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0; };
const ilkAile = (v: string) => (v ?? "").split(",")[0].replace(/["']/g, "").trim();

function Bolum({ ad, children, sag }: { ad: string; children: React.ReactNode; sag?: React.ReactNode }) {
  return (
    <section className="border-b border-white/[0.06] px-4 py-3.5 last:border-0">
      <div className="mb-2.5 flex items-center justify-between"><p className="text-[12.5px] font-semibold text-white/85">{ad}</p>{sag}</div>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

function Satir({ ad, degisti, children }: { ad: string; degisti?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex w-[84px] shrink-0 items-center gap-1.5 text-[12px] text-white/60">{ad}{degisti && <span className="h-1.5 w-1.5 rounded-full bg-[#55d6fd]" />}</span>
      <div className="flex min-w-0 flex-1 items-center gap-1.5">{children}</div>
    </div>
  );
}

function Sayi({ deger, set, birim = "px", min, max, adim = 1, genis }: { deger: number; set: (n: number) => void; birim?: string; min?: number; max?: number; adim?: number; genis?: boolean }) {
  const [yazi, setYazi] = useState(String(deger));
  useEffect(() => setYazi(String(deger)), [deger]);
  const bitir = (v: string) => { const n = parseFloat(v.replace(",", ".")); if (Number.isFinite(n)) set(Math.min(max ?? 9999, Math.max(min ?? -9999, n))); else setYazi(String(deger)); };
  return (
    <span className={cn("flex h-8 items-center rounded-[9px] bg-white/[0.05] pr-2 ring-1 ring-inset ring-white/[0.07] focus-within:ring-white/30", genis ? "w-full" : "w-[72px]")}>
      <input value={yazi} inputMode="decimal" onChange={(e) => setYazi(e.target.value)} onBlur={(e) => bitir(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") bitir((e.target as HTMLInputElement).value); if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); const d = (e.key === "ArrowUp" ? 1 : -1) * adim * (e.shiftKey ? 10 : 1); set(Math.min(max ?? 9999, Math.max(min ?? -9999, Math.round((deger + d) * 100) / 100))); } }}
        className="h-full min-w-0 flex-1 bg-transparent pl-2 text-[12px] tabular-nums text-white outline-none" />
      <span className="text-[11px] text-white/40">{birim}</span>
    </span>
  );
}

function Renk({ deger, set }: { deger: string; set: (v: string) => void }) {
  const h = hexe(deger);
  return (
    <span className="flex h-8 w-full items-center gap-2 rounded-[9px] bg-white/[0.05] px-1.5 ring-1 ring-inset ring-white/[0.07]">
      <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded-[6px] ring-1 ring-inset ring-white/20" style={{ background: h || "transparent" }}>
        <input type="color" aria-label="Renk seç" value={h || "#000000"} onChange={(e) => set(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
      </span>
      <input key={h} defaultValue={h || "saydam"} onBlur={(e) => /^#[0-9a-f]{6}$/i.test(e.target.value) && set(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} className="h-full min-w-0 flex-1 bg-transparent font-mono text-[11.5px] text-white/80 outline-none" />
    </span>
  );
}

function Segment<T extends string>({ deger, set, l }: { deger: string; set: (v: T) => void; l: [T, string][] }) {
  return (
    <span className="flex w-full rounded-[9px] bg-white/[0.05] p-0.5 ring-1 ring-inset ring-white/[0.07]">
      {l.map(([v, a]) => <button key={v} type="button" onClick={() => set(v)} className={cn("h-7 min-w-0 flex-1 truncate rounded-[7px] px-1 text-[11.5px] transition-colors", deger === v ? "bg-white text-black" : "text-white/60 hover:text-white")}>{a}</button>)}
    </span>
  );
}

/** Kutu modeli: dışta 4 dış boşluk, içte 4 iç boşluk; "bağla" açıkken dördü birlikte değişir. */
function KutuModeli({ oku, yaz, degisti }: { oku: (k: string) => string; yaz: (k: string, v: string) => void; degisti: (k: string) => boolean }) {
  const [bagli, setBagli] = useState<{ margin: boolean; padding: boolean }>({ margin: false, padding: false });
  const YON = ["Top", "Right", "Bottom", "Left"] as const;
  const kutu = (tur: "margin" | "padding", y: (typeof YON)[number]) => {
    const k = `${tur}-${y.toLowerCase()}`;
    return (
      <input key={k} aria-label={`${tur === "margin" ? "Dış" : "İç"} boşluk ${({ Top: "üst", Right: "sağ", Bottom: "alt", Left: "sol" })[y]}`} value={px(oku(k))}
        onChange={(e) => { const n = e.target.value.replace(/[^\d.-]/g, ""); if (n === "" || n === "-") return; (bagli[tur] ? YON.map((x) => `${tur}-${x.toLowerCase()}`) : [k]).forEach((z) => yaz(z, `${n}px`)); }}
        onKeyDown={(e) => { if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return; e.preventDefault(); const n = px(oku(k)) + (e.key === "ArrowUp" ? 1 : -1) * (e.shiftKey ? 10 : 1); (bagli[tur] ? YON.map((x) => `${tur}-${x.toLowerCase()}`) : [k]).forEach((z) => yaz(z, `${tur === "padding" ? Math.max(0, n) : n}px`)); }}
        className={cn("h-6 w-10 rounded-[6px] bg-transparent text-center text-[11.5px] tabular-nums outline-none focus:bg-white/[0.08]", degisti(k) ? "text-[#8be6ff]" : "text-white/80")} />
    );
  };
  return (
    <div className="space-y-2">
      <div className="rounded-[12px] bg-[#ffa348]/[0.07] p-1.5 ring-1 ring-inset ring-[#ffa348]/20">
        <div className="flex items-center justify-between px-1"><span className="text-[10.5px] text-[#ffc58d]">Dış boşluk</span>
          <button type="button" title={bagli.margin ? "Dört yönü ayır" : "Dört yönü birlikte değiştir"} onClick={() => setBagli((b) => ({ ...b, margin: !b.margin }))} className={cn("flex h-5 w-5 items-center justify-center rounded-[5px]", bagli.margin ? "bg-white text-black" : "text-white/45 hover:text-white")}>{bagli.margin ? <Link2 className="h-3 w-3" /> : <Unlink2 className="h-3 w-3" />}</button></div>
        <div className="flex justify-center">{kutu("margin", "Top")}</div>
        <div className="flex items-center gap-1">
          {kutu("margin", "Left")}
          <div className="flex-1 rounded-[9px] bg-[#6ee7a0]/[0.08] p-1 ring-1 ring-inset ring-[#6ee7a0]/25">
            <div className="flex items-center justify-between px-1"><span className="text-[10.5px] text-[#9df0be]">İç boşluk</span>
              <button type="button" title={bagli.padding ? "Dört yönü ayır" : "Dört yönü birlikte değiştir"} onClick={() => setBagli((b) => ({ ...b, padding: !b.padding }))} className={cn("flex h-5 w-5 items-center justify-center rounded-[5px]", bagli.padding ? "bg-white text-black" : "text-white/45 hover:text-white")}>{bagli.padding ? <Link2 className="h-3 w-3" /> : <Unlink2 className="h-3 w-3" />}</button></div>
            <div className="flex justify-center">{kutu("padding", "Top")}</div>
            <div className="flex items-center justify-between">{kutu("padding", "Left")}<span className="h-5 flex-1 rounded-[5px] bg-white/[0.06] mx-1" />{kutu("padding", "Right")}</div>
            <div className="flex justify-center">{kutu("padding", "Bottom")}</div>
          </div>
          {kutu("margin", "Right")}
        </div>
        <div className="flex justify-center">{kutu("margin", "Bottom")}</div>
      </div>
    </div>
  );
}

/**
 * Tasarım paneli (v0 Design Mode derinliğinde, kredisiz): katman yolu ve çocuklar, yazı (tip, boyut, kalınlık, satır ve harf
 * aralığı, hiza, biçem), renk ve görünüm (zemin, saydamlık, köşe, gölge), kutu modeli (her yön için iç ve dış boşluk),
 * kenarlık, yerleşim (esnek kutu yönü, hiza, aralık), katman sırası. Değişiklikler bekler; Uygula hepsini tek sürüm yapar.
 */
export function TasarimPaneli({ secim, bilgi, b, sec, ustSec, olcu, setOlcu, uygula, ajanaSor, kapat, gorselPanel }: {
  secim: Secim; bilgi: TBilgi | null; b: Bekleyen; sec: (secici: string) => void; ustSec: () => void; olcu: boolean; setOlcu: (v: boolean) => void;
  uygula: () => Promise<{ ok: boolean; yazilamayan: number }>; ajanaSor: () => void; kapat: () => void; gorselPanel?: React.ReactNode;
}) {
  const [durum, setDurum] = useState<"" | "yaziliyor" | "bitti">("");
  const [uyari, setUyari] = useState("");
  const [katmanAcik, setKatmanAcik] = useState(false);
  const anahtar = `${secim.sayfa}|${secim.secici}`;
  const bekleyen = b.ogeler[anahtar];
  const s = { ...secim.stil, ...(bilgi?.secici === secim.secici ? bilgi.stil : {}) };
  const deve = (k: string) => k.replace(/-([a-z])/g, (_, h: string) => h.toUpperCase());
  const oku = (k: string) => bekleyen?.stiller[k] ?? s[deve(k)] ?? "";
  const degisti = (k: string) => bekleyen?.stiller[k] !== undefined;
  const yaz = (k: string, v: string) => { setDurum(""); setUyari(""); b.degis({ sayfa: secim.sayfa, secici: secim.secici, etiket: secim.etiket, metin: secim.metin }, k, v); };
  const kap = bilgi?.secici === secim.secici ? bilgi : null;
  const yol = kap ? [...kap.yol].reverse() : [];
  const kapsayici = (kap?.cocuklar.length ?? 0) > 0;
  const esnek = /flex|grid/.test(oku("display"));
  const satir = () => { const v = oku("line-height"); if (!v || v === "normal") return 1.4; if (v.endsWith("px")) return Math.round((parseFloat(v) / (parseFloat(oku("font-size")) || 16)) * 100) / 100; return parseFloat(v) || 1.4; };

  /* Ctrl+Z / Ctrl+Shift+Z (yazı alanında değilken) */
  useEffect(() => {
    const t = (e: KeyboardEvent) => {
      const h = e.target as HTMLElement | null;
      if (h && (h.tagName === "INPUT" || h.tagName === "TEXTAREA" || h.isContentEditable)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) b.yinele(); else b.geriAl(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") { e.preventDefault(); b.yinele(); }
    };
    addEventListener("keydown", t); return () => removeEventListener("keydown", t);
  }, [b]);

  const golgeAdi = GOLGELER.find(([, v]) => v === oku("box-shadow"))?.[0] ?? (oku("box-shadow") === "none" || !oku("box-shadow") ? "Yok" : "Özel");

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={yay}
      className="absolute bottom-3 right-3 top-3 z-20 flex w-[300px] flex-col overflow-hidden rounded-[20px] bg-[#17181b] ring-1 ring-inset ring-white/[0.1] max-sm:inset-x-2 max-sm:top-auto max-sm:h-[64%] max-sm:w-auto">
      {/* başlık */}
      <div className="border-b border-white/[0.06] px-3 pb-2.5 pt-3">
        <div className="flex items-center gap-1.5">
          <div className="min-w-0 flex-1 pl-1"><p className="text-[13.5px] font-semibold text-white">Tasarım</p><p className="truncate text-[11.5px] text-white/50">{secim.etiket}{kap?.yol[0]?.sinif ?? ""}{secim.metin ? ` · ${secim.metin.slice(0, 26)}` : ""}</p></div>
          <button type="button" title="Üst öğeyi seç (Yukarı ok)" aria-label="Üst öğeyi seç" disabled={yol.length < 2} onClick={ustSec} className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
          <button type="button" title="Boşluk ölçüsünü göster" aria-label="Boşluk ölçüsü" aria-pressed={olcu} onClick={() => setOlcu(!olcu)} className={cn("flex h-8 w-8 items-center justify-center rounded-full", olcu ? "bg-white text-black" : "text-white/60 hover:bg-white/[0.07] hover:text-white")}><Ruler className="h-4 w-4" /></button>
          <button type="button" title="Katmanlar" aria-label="Katmanlar" aria-pressed={katmanAcik} onClick={() => setKatmanAcik((x) => !x)} className={cn("flex h-8 w-8 items-center justify-center rounded-full", katmanAcik ? "bg-white text-black" : "text-white/60 hover:bg-white/[0.07] hover:text-white")}><Layers className="h-4 w-4" /></button>
          <button type="button" onClick={kapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        {/* katman yolu */}
        {yol.length > 1 && (
          <div className="mt-2 flex flex-wrap items-center gap-0.5 pl-1">
            {yol.slice(-5).map((y, i, l) => (
              <span key={y.secici} className="flex items-center">
                {i > 0 && <ChevronRight className="h-3 w-3 text-white/25" />}
                <button type="button" onClick={() => i < l.length - 1 && sec(y.secici)} className={cn("rounded-[6px] px-1.5 py-0.5 text-[11px]", i === l.length - 1 ? "bg-white/[0.1] text-white" : "text-white/50 hover:bg-white/[0.06] hover:text-white")}>{y.etiket}{y.sinif}</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
        <AnimatePresence initial={false}>
          {katmanAcik && kap && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-white/[0.06]">
              <div className="px-2 py-2">
                {yol.map((y, i) => (
                  <button key={y.secici} type="button" onClick={() => sec(y.secici)} style={{ paddingLeft: 8 + i * 10 }} className={cn("flex w-full items-center gap-1.5 rounded-[8px] py-1.5 pr-2 text-left text-[12px]", y.secici === secim.secici ? "bg-white/[0.1] text-white" : "text-white/55 hover:bg-white/[0.05] hover:text-white")}>
                    <span className="shrink-0">{y.etiket}{y.sinif}</span>{y.metin && <span className="truncate text-white/35">{y.metin}</span>}
                  </button>
                ))}
                {kap.cocuklar.map((c) => (
                  <button key={c.secici} type="button" onClick={() => sec(c.secici)} style={{ paddingLeft: 8 + yol.length * 10 }} className="flex w-full items-center gap-1.5 rounded-[8px] py-1.5 pr-2 text-left text-[12px] text-white/55 hover:bg-white/[0.05] hover:text-white">
                    <span className="shrink-0">{c.etiket}{c.sinif}</span><span className="truncate text-white/35">{c.metin}</span>{c.cocuk > 0 && <span className="ml-auto shrink-0 text-[10.5px] tabular-nums text-white/30">{c.cocuk}</span>}
                  </button>
                ))}
                {!kap.cocuklar.length && <p className="px-2 py-1 text-[11.5px] text-white/35">Bu öğenin alt katmanı yok.</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {gorselPanel && <div className="border-b border-white/[0.06] p-4">{gorselPanel}</div>}

        <Bolum ad="Yazı">
          <div className="flex flex-wrap gap-1">
            {YAZI_TIPLERI.map((y) => <button key={y} type="button" onClick={() => yaz("font-family", `"${y}", sans-serif`)} style={{ fontFamily: y }} className={cn("h-7 rounded-[8px] px-2 text-[11.5px] transition-colors", ilkAile(oku("font-family")) === y ? "bg-white text-black" : "bg-white/[0.05] text-white/70 hover:text-white")}>{y}</button>)}
          </div>
          <input key={ilkAile(oku("font-family"))} defaultValue={YAZI_TIPLERI.includes(ilkAile(oku("font-family"))) ? "" : ilkAile(oku("font-family"))} onBlur={(e) => e.target.value.trim() && yaz("font-family", `"${e.target.value.trim()}", sans-serif`)} placeholder="Özel: Google Fonts adı" className="h-8 w-full rounded-[9px] bg-white/[0.05] px-2.5 text-[12px] text-white outline-none ring-1 ring-inset ring-white/[0.07] placeholder:text-white/35 focus:ring-white/30" />
          <Satir ad="Boyut" degisti={degisti("font-size")}><Sayi deger={px(oku("font-size"))} set={(n) => yaz("font-size", `${n}px`)} min={6} max={200} /><input type="range" min={8} max={96} value={px(oku("font-size"))} onChange={(e) => yaz("font-size", `${e.target.value}px`)} className="h-1 min-w-0 flex-1 accent-white" /></Satir>
          <Satir ad="Kalınlık" degisti={degisti("font-weight")}><Segment deger={String(oku("font-weight"))} set={(v) => yaz("font-weight", v)} l={[["300", "İnce"], ["400", "Normal"], ["500", "Orta"], ["600", "Yarı"], ["700", "Kalın"], ["800", "Siyah"]]} /></Satir>
          <Satir ad="Satır aralığı" degisti={degisti("line-height")}><Sayi deger={satir()} set={(n) => yaz("line-height", String(n))} birim="kat" adim={0.05} min={0.6} max={4} /><input type="range" min={0.8} max={3} step={0.05} value={satir()} onChange={(e) => yaz("line-height", e.target.value)} className="h-1 min-w-0 flex-1 accent-white" /></Satir>
          <Satir ad="Harf aralığı" degisti={degisti("letter-spacing")}><Sayi deger={oku("letter-spacing") === "normal" ? 0 : px(oku("letter-spacing"))} set={(n) => yaz("letter-spacing", `${n}px`)} adim={0.1} min={-10} max={40} /><input type="range" min={-4} max={12} step={0.1} value={oku("letter-spacing") === "normal" ? 0 : px(oku("letter-spacing"))} onChange={(e) => yaz("letter-spacing", `${e.target.value}px`)} className="h-1 min-w-0 flex-1 accent-white" /></Satir>
          <Satir ad="Hiza" degisti={degisti("text-align")}><Segment deger={oku("text-align") === "start" ? "left" : oku("text-align")} set={(v) => yaz("text-align", v)} l={[["left", "Sol"], ["center", "Orta"], ["right", "Sağ"], ["justify", "İki yana"]]} /></Satir>
          <Satir ad="Biçem" degisti={degisti("font-style") || degisti("text-decoration-line") || degisti("text-transform")}>
            <button type="button" onClick={() => yaz("font-style", oku("font-style") === "italic" ? "normal" : "italic")} className={cn("h-8 flex-1 rounded-[9px] text-[12px] italic", oku("font-style") === "italic" ? "bg-white text-black" : "bg-white/[0.05] text-white/70")}>Eğik</button>
            <button type="button" onClick={() => yaz("text-decoration-line", oku("text-decoration-line") === "underline" ? "none" : "underline")} className={cn("h-8 flex-1 rounded-[9px] text-[12px] underline", oku("text-decoration-line") === "underline" ? "bg-white text-black" : "bg-white/[0.05] text-white/70")}>Altı çizili</button>
            <button type="button" onClick={() => yaz("text-transform", oku("text-transform") === "uppercase" ? "none" : "uppercase")} className={cn("h-8 flex-1 rounded-[9px] text-[12px]", oku("text-transform") === "uppercase" ? "bg-white text-black" : "bg-white/[0.05] text-white/70")}>Büyük</button>
          </Satir>
          <Satir ad="Yazı rengi" degisti={degisti("color")}><Renk deger={oku("color")} set={(v) => yaz("color", v)} /></Satir>
        </Bolum>

        <Bolum ad="Görünüm">
          <Satir ad="Zemin" degisti={degisti("background-color")}><Renk deger={oku("background-color")} set={(v) => yaz("background-color", v)} /></Satir>
          <Satir ad="Saydamlık" degisti={degisti("opacity")}><input type="range" min={0} max={100} value={Math.round((parseFloat(oku("opacity")) || (oku("opacity") === "0" ? 0 : 1)) * 100)} onChange={(e) => yaz("opacity", String(Number(e.target.value) / 100))} className="h-1 min-w-0 flex-1 accent-white" /><span className="w-[62px] text-right text-[11.5px] tabular-nums text-white/65">yüzde {Math.round((parseFloat(oku("opacity")) || (oku("opacity") === "0" ? 0 : 1)) * 100)}</span></Satir>
          <Satir ad="Köşe" degisti={degisti("border-radius")}><Sayi deger={px(oku("border-radius"))} set={(n) => yaz("border-radius", `${n}px`)} min={0} max={999} /><input type="range" min={0} max={64} value={Math.min(64, px(oku("border-radius")))} onChange={(e) => yaz("border-radius", `${e.target.value}px`)} className="h-1 min-w-0 flex-1 accent-white" /></Satir>
          <Satir ad="Gölge" degisti={degisti("box-shadow")}><Segment deger={golgeAdi} set={(a) => yaz("box-shadow", GOLGELER.find(([x]) => x === a)?.[1] ?? "none")} l={GOLGELER.map(([a]) => [a, a] as [string, string])} /></Satir>
          <input key={oku("box-shadow")} defaultValue={golgeAdi === "Özel" ? oku("box-shadow") : ""} onBlur={(e) => e.target.value.trim() && yaz("box-shadow", e.target.value.trim())} placeholder="Özel gölge: 0 4px 12px rgba(0,0,0,0.2)" className="h-8 w-full rounded-[9px] bg-white/[0.05] px-2.5 font-mono text-[11px] text-white outline-none ring-1 ring-inset ring-white/[0.07] placeholder:font-sans placeholder:text-white/35 focus:ring-white/30" />
        </Bolum>

        <Bolum ad="Boşluk"><KutuModeli oku={oku} yaz={yaz} degisti={degisti} /></Bolum>

        <Bolum ad="Kenarlık">
          <Satir ad="Kalınlık" degisti={degisti("border-width")}><Sayi deger={px(bekleyen?.stiller["border-width"] ?? s.borderTopWidth)} set={(n) => { yaz("border-width", `${n}px`); if (n > 0 && (oku("border-style") === "none" || !oku("border-style"))) yaz("border-style", "solid"); }} min={0} max={40} /></Satir>
          <Satir ad="Çizgi" degisti={degisti("border-style")}><Segment deger={bekleyen?.stiller["border-style"] ?? s.borderTopStyle ?? "none"} set={(v) => yaz("border-style", v)} l={[["none", "Yok"], ["solid", "Düz"], ["dashed", "Kesik"], ["dotted", "Nokta"]]} /></Satir>
          <Satir ad="Renk" degisti={degisti("border-color")}><Renk deger={bekleyen?.stiller["border-color"] ?? s.borderTopColor ?? ""} set={(v) => yaz("border-color", v)} /></Satir>
        </Bolum>

        {(kapsayici || esnek) && (
          <Bolum ad="Yerleşim">
            <Satir ad="Düzen" degisti={degisti("display")}><Segment deger={/flex/.test(oku("display")) ? "flex" : /grid/.test(oku("display")) ? "grid" : "block"} set={(v) => yaz("display", v)} l={[["block", "Blok"], ["flex", "Esnek"], ["grid", "Izgara"]]} /></Satir>
            {/flex/.test(oku("display")) && <>
              <Satir ad="Yön" degisti={degisti("flex-direction")}><Segment deger={oku("flex-direction").startsWith("column") ? "column" : "row"} set={(v) => yaz("flex-direction", v)} l={[["row", "Yatay"], ["column", "Dikey"]]} /></Satir>
              <Satir ad="Hizalama" degisti={degisti("align-items")}><Segment deger={oku("align-items")} set={(v) => yaz("align-items", v)} l={[["flex-start", "Baş"], ["center", "Orta"], ["flex-end", "Son"], ["stretch", "Ger"]]} /></Satir>
              <Satir ad="Dağılım" degisti={degisti("justify-content")}><Segment deger={oku("justify-content")} set={(v) => yaz("justify-content", v)} l={[["flex-start", "Baş"], ["center", "Orta"], ["space-between", "Ara"], ["flex-end", "Son"]]} /></Satir>
            </>}
            {esnek && <Satir ad="Aralık" degisti={degisti("gap")}><Sayi deger={oku("gap") === "normal" ? 0 : px(oku("gap"))} set={(n) => yaz("gap", `${n}px`)} min={0} max={200} /><input type="range" min={0} max={96} value={oku("gap") === "normal" ? 0 : Math.min(96, px(oku("gap")))} onChange={(e) => yaz("gap", `${e.target.value}px`)} className="h-1 min-w-0 flex-1 accent-white" /></Satir>}
          </Bolum>
        )}

        <Bolum ad="Öğe">
          <Satir ad="Katman sırası" degisti={degisti("z-index")}><Sayi deger={Number(oku("z-index")) || 0} set={(n) => { yaz("z-index", String(Math.round(n))); if (oku("position") === "static") yaz("position", "relative"); }} birim="" min={-10} max={9999} /></Satir>
          <div className="flex gap-1.5">
            <button type="button" onClick={() => yaz("__sil", bekleyen?.sil ? (undefined as unknown as string) : "1")} className={cn("inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full text-[12px] ring-1 ring-inset", bekleyen?.sil ? "bg-rose-500/15 text-rose-200 ring-rose-400/30" : "bg-white/[0.05] text-white/70 ring-white/[0.08] hover:text-white")}>{bekleyen?.sil ? <Eye className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}{bekleyen?.sil ? "Silmeyi geri al" : "Öğeyi sil"}</button>
            {bekleyen && <button type="button" onClick={() => b.ogeSifirla(secim.sayfa, secim.secici)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.05] px-3 text-[12px] text-white/70 ring-1 ring-inset ring-white/[0.08] hover:text-white"><RotateCcw className="h-3.5 w-3.5" />Bu öğeyi sıfırla</button>}
          </div>
          {bekleyen?.sil && <p className="flex items-center gap-1.5 text-[11.5px] text-white/50"><EyeOff className="h-3.5 w-3.5" />Önizlemede gizlendi; Uygula ile koddan silinir.</p>}
        </Bolum>
      </div>

      {/* bekleyenler + uygula */}
      <div className="space-y-2 border-t border-white/[0.06] p-3">
        {uyari && <p className="text-[12px] leading-snug text-amber-200/85">{uyari}</p>}
        <div className="flex items-center gap-1.5">
          <button type="button" title="Geri al (Ctrl Z)" aria-label="Geri al" disabled={!b.geriVar} onClick={b.geriAl} className="flex h-9 w-9 items-center justify-center rounded-full text-white/65 hover:bg-white/[0.07] hover:text-white disabled:opacity-30"><Undo2 className="h-4 w-4" /></button>
          <button type="button" title="Yinele (Ctrl Shift Z)" aria-label="Yinele" disabled={!b.ileriVar} onClick={b.yinele} className="flex h-9 w-9 items-center justify-center rounded-full text-white/65 hover:bg-white/[0.07] hover:text-white disabled:opacity-30"><Redo2 className="h-4 w-4" /></button>
          <span className="min-w-0 flex-1 truncate text-[11.5px] text-white/50">{b.sayi ? `${b.sayi} değişiklik bekliyor` : durum === "bitti" ? "Uygulandı, yeni sürüm oluştu" : "Kredi harcamaz"}</span>
          {b.sayi > 0 && <button type="button" title="Bütün bekleyenleri bırak" onClick={() => b.sifirla()} className="h-9 rounded-full px-2.5 text-[12px] text-white/55 hover:bg-white/[0.07] hover:text-white">Bırak</button>}
        </div>
        <div className="flex gap-2">
          <button type="button" disabled={!b.sayi || durum === "yaziliyor"} onClick={async () => { setDurum("yaziliyor"); const r = await uygula(); setDurum(r.ok ? "bitti" : ""); if (r.yazilamayan) setUyari(`${r.yazilamayan} öğe sayfa açıldıktan sonra kodla oluşuyor; kaynağa yazılamadı. Ajana yaptırabilirsin.`); }}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-semibold text-black disabled:opacity-35">
            {durum === "yaziliyor" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : durum === "bitti" && !b.sayi ? <Check className="h-3.5 w-3.5" /> : null}{b.sayi ? `Uygula (${b.sayi})` : "Uygula"}
          </button>
          <button type="button" onClick={ajanaSor} title="Bu öğe için ajana istek yaz" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[13px] text-white ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.12]"><Wand2 className="h-3.5 w-3.5" />Ajana</button>
        </div>
      </div>
    </motion.div>
  );
}
