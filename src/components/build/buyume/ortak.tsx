"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ChevronDown, Loader2, Mail, PenLine, PlugZap, Sparkles, X } from "lucide-react";
import { planKanali, say, type PlanKanalId } from "@/lib/build/buyumeTipler";
import { cn } from "@/lib/utils";

export const yay = { type: "spring" as const, stiffness: 460, damping: 38 };

/**
 * Bölümlü seçici (beyaz kayan zemin). Ajanlar düzenleyicisindekiyle aynı görünüm; Büyüme o modülü içe aktarmasın diye
 * burada (ajanlar modüllerindeki döngüsel içe aktarma, Büyüme önce yüklenince başlatma hatası veriyordu).
 */
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
export const alan = "w-full rounded-[12px] bg-white/[0.05] px-3.5 text-[13.5px] text-white outline-none ring-1 ring-inset ring-white/[0.08] transition-shadow placeholder:text-white/35 focus:ring-white/30";
export const ikincil = "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 text-[13px] font-medium text-white ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.11] disabled:opacity-40";
export const birincil = "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-35";
export const simgeDugme = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-35";

/** Başlığı içinde kart. */
export function Kart({ baslik, aciklama, sag, children, className, ust }: { baslik?: React.ReactNode; aciklama?: React.ReactNode; sag?: React.ReactNode; children?: React.ReactNode; className?: string; ust?: React.ReactNode }) {
  return (
    <motion.section layout="position" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} className={cn("rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.08] sm:p-5", className)}>
      {ust}
      {(baslik || sag) && (
        <div className={cn("flex flex-wrap items-start justify-between gap-x-3 gap-y-2", children ? "mb-3.5" : "")}>
          <div className="min-w-0 flex-1 basis-[160px]">{baslik && <h3 className="text-[14.5px] font-semibold tracking-[-0.01em] text-white">{baslik}</h3>}{aciklama && <div className="mt-0.5 text-[12.5px] leading-relaxed text-white/55">{aciklama}</div>}</div>
          {sag && <div className="flex shrink-0 flex-wrap items-center gap-1.5">{sag}</div>}
        </div>
      )}
      {children}
    </motion.section>
  );
}

/** Kanalın resmî logosu (e-posta ve özel kanalda simge). */
export function KanalLogo({ kanal, boyut = 28, className }: { kanal: PlanKanalId | string; boyut?: number; className?: string }) {
  const k = planKanali(kanal);
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-[9px] bg-white/[0.07] ring-1 ring-inset ring-white/[0.06]", className)} style={{ width: boyut, height: boyut }}>
      {k.logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={k.logo} alt={k.ad} width={Math.round(boyut * 0.6)} height={Math.round(boyut * 0.6)} decoding="sync" className="shrink-0 object-contain" style={{ width: Math.round(boyut * 0.6), height: Math.round(boyut * 0.6) }} />
        : k.simge === "posta" ? <Mail className="text-white/80" style={{ width: boyut * 0.55, height: boyut * 0.55 }} /> : <Sparkles className="text-white/70" style={{ width: boyut * 0.5, height: boyut * 0.5 }} />}
    </span>
  );
}

/** İşaret: beyaz halka; tamamlanınca içi dolu nokta (tik yok). */
export function Halka({ dolu, boyut = 20 }: { dolu: boolean; boyut?: number }) {
  return (
    <span className={cn("relative flex shrink-0 items-center justify-center rounded-full transition-[box-shadow,background-color]", dolu ? "ring-2 ring-white" : "ring-[1.5px] ring-white/30")} style={{ width: boyut, height: boyut }}>
      <AnimatePresence>{dolu && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={yay} className="rounded-full bg-white" style={{ width: boyut * 0.42, height: boyut * 0.42 }} />}</AnimatePresence>
    </span>
  );
}

/** Karakter sayacı; sınırı aşınca kırmızı. */
export function Sayac({ n, sinir, className }: { n: number; sinir: number; className?: string }) {
  return <span className={cn("shrink-0 tabular-nums text-[11.5px]", n > sinir ? "font-semibold text-rose-300" : n > sinir * 0.9 ? "text-amber-200/90" : "text-white/40", className)}>{n.toLocaleString("tr-TR")} / {sinir.toLocaleString("tr-TR")}</span>;
}
export const asildi = (s: string, sinir: number) => say(s) > sinir;

/** Kısa yuvarlak hap (sayı, durum). */
export function Rozet({ children, ton = "notr", className }: { children: React.ReactNode; ton?: "notr" | "aksan" | "amber" | "rose" | "soluk"; className?: string }) {
  return <span className={cn("inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[11.5px] font-medium tabular-nums",
    ton === "aksan" ? "bg-[#55d6fd]/[0.12] text-[#8be6ff]" : ton === "amber" ? "bg-amber-400/[0.1] text-amber-200" : ton === "rose" ? "bg-rose-500/[0.12] text-rose-200" : ton === "soluk" ? "bg-white/[0.04] text-white/45" : "bg-white/[0.07] text-white/75", className)}>{children}</span>;
}

/** Sağdan açılan panel (Build YanPanel düzeni), sayfa kaydırmasından bağımsız. */
export function YanPanel({ acik, kapat, baslik, alt, children, alt2, genis }: { acik: boolean; kapat: () => void; baslik: React.ReactNode; alt?: React.ReactNode; children: React.ReactNode; alt2?: React.ReactNode; genis?: boolean }) {
  const [hazir, setHazir] = useState(false);
  useEffect(() => { setHazir(true); }, []);
  useEffect(() => { if (!acik) return; const t = (e: KeyboardEvent) => e.key === "Escape" && kapat(); addEventListener("keydown", t); return () => removeEventListener("keydown", t); }, [acik, kapat]);
  if (!hazir) return null;
  return createPortal(
    <AnimatePresence>
      {acik && (
        <>
          <motion.div key="perde" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={kapat} className="fixed inset-0 z-[120] bg-black/40" />
          <motion.aside key="panel" data-yan-panel initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={yay} className={cn("bd-panel fixed inset-y-0 right-0 z-[121] flex w-full flex-col sm:rounded-l-[20px]", genis ? "sm:w-[640px]" : "sm:w-[480px]")}>
            <header className="flex items-start gap-3 border-b border-white/[0.07] px-5 py-4">
              <div className="min-w-0 flex-1"><div className="truncate text-[15px] font-semibold text-white">{baslik}</div>{alt && <div className="mt-0.5 text-[12.5px] text-white/50">{alt}</div>}</div>
              <button type="button" onClick={kapat} aria-label="Kapat" className={simgeDugme}><X className="h-4 w-4" /></button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 [scrollbar-width:thin]">{children}</div>
            {alt2 && <footer className="flex flex-wrap items-center gap-2 border-t border-white/[0.07] px-5 py-3">{alt2}</footer>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Etiketli alan (panellerdeki formlar için). */
export function Etiket({ ad, sag, children, className }: { ad: string; sag?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-center justify-between gap-2 text-[12.5px] text-white/60">{ad}{sag}</span>
      {children}
    </label>
  );
}

/**
 * Sabit konumlu açılır menü: düğmenin altında (yer yoksa üstünde) açılır, dar sütunda kesilmez. tetik bir render
 * fonksiyonu alır; içerik kapat() ile kapanır.
 */
export function AcilirMenu({ tetik, children, genislik = 300, hiza = "sol" }: { tetik: (ac: () => void, acik: boolean) => React.ReactNode; children: (kapat: () => void) => React.ReactNode; genislik?: number; hiza?: "sol" | "sag" }) {
  const [acik, setAcik] = useState(false);
  const [konum, setKonum] = useState<{ sol: number; ust?: number; alt?: number; boy: number }>({ sol: 0, boy: 360 });
  const kok = useRef<HTMLSpanElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const hesapla = () => {
    const r = kok.current?.getBoundingClientRect();
    if (!r) return;
    const en = Math.min(genislik, innerWidth - 16);
    const sol = Math.max(8, Math.min(innerWidth - en - 8, hiza === "sag" ? r.right - en : r.left));
    const asagi = innerHeight - r.bottom - 12, yukari = r.top - 12;
    const yk = asagi < 280 && yukari > asagi;
    setKonum({ sol, ...(yk ? { alt: innerHeight - r.top + 6 } : { ust: r.bottom + 6 }), boy: Math.min(440, Math.max(180, yk ? yukari : asagi)) });
  };
  useLayoutEffect(() => { if (acik) hesapla(); }, [acik]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!acik) return;
    const f = (e: MouseEvent) => { const t = e.target as Node; if (!kok.current?.contains(t) && !menu.current?.contains(t)) setAcik(false); };
    const t = (e: KeyboardEvent) => { if (e.key === "Escape") setAcik(false); };
    const k = () => setAcik(false);
    addEventListener("mousedown", f); addEventListener("keydown", t); addEventListener("resize", k);
    return () => { removeEventListener("mousedown", f); removeEventListener("keydown", t); removeEventListener("resize", k); };
  }, [acik]);
  return (
    <span ref={kok} className="relative inline-flex">
      {tetik(() => setAcik((x) => !x), acik)}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {acik && (
            <motion.div ref={menu} initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.14 }}
              style={{ left: konum.sol, top: konum.ust, bottom: konum.alt, maxHeight: konum.boy, width: Math.min(genislik, typeof innerWidth === "number" ? innerWidth - 16 : genislik) }}
              className="bd-panel fixed z-[140] overflow-y-auto rounded-[16px] p-1.5 [scrollbar-width:thin]">
              {children(() => setAcik(false))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </span>
  );
}

export type Secenek = { id: string; ad: string; alt?: string; logo?: React.ReactNode };
/**
 * Seçenek menüsü: her satırda görsel ya da simge, ad ve amaç satırı; seçili satır beyaz halka; en altta Özel satırı
 * (seçilince kendi değerini yazacağı alan açılır).
 */
export function SecenekMenusu({ l, deger, sec, ozel, tetik, genislik = 320, baslik, hiza }: {
  l: Secenek[]; deger: string; sec: (id: string) => void; tetik: (ac: () => void, acik: boolean) => React.ReactNode; genislik?: number; baslik?: string; hiza?: "sol" | "sag";
  ozel?: { deger: string; set: (v: string) => void; yer: string; alt?: string; ek?: React.ReactNode };
}) {
  return (
    <AcilirMenu genislik={genislik} tetik={tetik} hiza={hiza}>
      {(kapat) => (
        <div>
          {baslik && <p className="px-2.5 pb-1.5 pt-1 text-[12px] font-medium text-white/45">{baslik}</p>}
          {l.map((x) => (
            <button key={x.id} type="button" onClick={() => { sec(x.id); kapat(); }} className={cn("flex w-full items-center gap-2.5 rounded-[11px] px-2.5 py-2 text-left transition-colors", deger === x.id ? "bg-white/[0.07] ring-2 ring-inset ring-white" : "hover:bg-white/[0.06]")}>
              {x.logo}
              <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] text-white">{x.ad}</span>{x.alt && <span className="block truncate text-[12px] text-white/50">{x.alt}</span>}</span>
            </button>
          ))}
          {ozel && (
            <div className={cn("mt-1 rounded-[11px] px-2.5 py-2", deger === "ozel" ? "bg-white/[0.07] ring-2 ring-inset ring-white" : "")}>
              <button type="button" onClick={() => sec("ozel")} className="flex w-full items-center gap-2.5 text-left">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-white/[0.07]"><PenLine className="h-3.5 w-3.5 text-white/75" /></span>
                <span className="min-w-0 flex-1"><span className="block text-[13.5px] text-white">Özel</span><span className="block truncate text-[12px] text-white/50">{ozel.alt ?? "Kendin yaz"}</span></span>
              </button>
              {deger === "ozel" && (
                <div className="mt-2 space-y-2">
                  <input autoFocus value={ozel.deger} onChange={(e) => ozel.set(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); kapat(); } }} placeholder={ozel.yer} maxLength={160} className={cn(alan, "h-9")} />
                  {ozel.ek}
                  <button type="button" onClick={kapat} className={cn(birincil, "h-8 w-full justify-center")}>Tamam</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </AcilirMenu>
  );
}

/** Komut kutusundaki çip düğmesi. */
export function Cip({ onClick, acik, children, className, title }: { onClick: () => void; acik?: boolean; children: React.ReactNode; className?: string; title?: string }) {
  return (
    <button type="button" title={title} onClick={onClick} className={cn("inline-flex h-8 max-w-full shrink-0 items-center gap-1.5 rounded-full bg-white/[0.06] pl-1.5 pr-2.5 text-[12.5px] text-white/85 ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1]", acik && "bg-white/[0.1] ring-white/25", className)}>
      {children}<ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-white/45 transition-transform", acik && "rotate-180")} />
    </button>
  );
}

/** Model bağlı değil: dürüst durum kartı (sahte içerik gösterilmez). */
export function ModelYokKart({ tekrar }: { tekrar?: () => void }) {
  return (
    <div className="rounded-[16px] bg-amber-400/[0.05] p-4 ring-1 ring-inset ring-amber-300/15">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-amber-300/[0.1]"><PlugZap className="h-4 w-4 text-amber-200" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold text-white">Yapay zekâ modeli bağlı değil</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-white/65">Büyüme ajanı yazmak için bir modele ihtiyaç duyar. Yöneticinin sunucuya <code className="rounded-[6px] bg-white/[0.08] px-1.5 py-0.5 sc-kod text-[11.5px] text-white">ANTHROPIC_API_KEY</code> ya da <code className="rounded-[6px] bg-white/[0.08] px-1.5 py-0.5 sc-kod text-[11.5px] text-white">OPENROUTER_API_KEY</code> eklemesi gerekiyor. O zamana kadar hazır metinleri elle düzenleyebilir, takvimi ve kontrol listesini kullanabilirsin.</p>
          {tekrar && <button type="button" onClick={tekrar} className={cn(ikincil, "mt-3 h-8")}>Yeniden dene</button>}
        </div>
      </div>
    </div>
  );
}

export function HataSatiri({ mesaj, kapat }: { mesaj: string; kapat?: () => void }) {
  return (
    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2 rounded-[12px] bg-rose-500/[0.08] px-3 py-2 text-[12.5px] leading-relaxed text-rose-200 ring-1 ring-inset ring-rose-400/15">
      <span className="min-w-0 flex-1">{mesaj}</span>{kapat && <button type="button" onClick={kapat} aria-label="Kapat" className="shrink-0 text-rose-200/60 hover:text-rose-100"><X className="h-3.5 w-3.5" /></button>}
    </motion.p>
  );
}

/** Üretim sürüyor satırı: geçen süre ile (sahte ilerleme yok). */
export function Suruyor({ metin, alt, className }: { metin: string; alt?: React.ReactNode; className?: string }) {
  const [bas] = useState(() => Date.now());
  const [s, setS] = useState(0);
  useEffect(() => { const t = setInterval(() => setS(Math.floor((Date.now() - bas) / 1000)), 1000); return () => clearInterval(t); }, [bas]);
  return (
    <div className={cn("flex items-center gap-3 rounded-[14px] bg-white/[0.03] px-3.5 py-3 ring-1 ring-inset ring-white/[0.07]", className)}>
      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#55d6fd]" />
      <div className="min-w-0 flex-1"><p className="build-parilti text-[13px] font-medium text-white/85">{metin}</p>{alt && <div className="mt-0.5 text-[12px] text-white/45">{alt}</div>}</div>
      <span className="shrink-0 tabular-nums text-[12px] text-white/40">{s} sn</span>
    </div>
  );
}

export function indir(ad: string, icerik: string | Blob, tur = "text/plain;charset=utf-8") {
  const b = typeof icerik === "string" ? new Blob([icerik], { type: tur }) : icerik;
  const u = URL.createObjectURL(b);
  const a = document.createElement("a");
  a.href = u; a.download = ad; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 2000);
}

/** Kopyala düğmesi durumu: bir an "Kopyalandı" gösterir. */
export function useKopyala(): [string | null, (anahtar: string, metin: string) => void] {
  const [k, setK] = useState<string | null>(null);
  const kopyala = (anahtar: string, metin: string) => { navigator.clipboard?.writeText(metin).then(() => { setK(anahtar); setTimeout(() => setK((x) => (x === anahtar ? null : x)), 1400); }).catch(() => {}); };
  return [k, kopyala];
}

export const turkceTarih = (iso: string, g: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", weekday: "long" }) => new Date(iso + "T12:00:00Z").toLocaleDateString("tr-TR", { ...g, timeZone: "UTC" });
export const tl = (n: number) => `${n.toLocaleString("tr-TR")} TL`;

/** Panel formlarında bölümlü seçici: içeriği kadar geniş (tam satıra yayılmaz). */
export function SatirSecici<T extends string>(p: Parameters<typeof Secici<T>>[0]) {
  return <div className="flex max-w-full overflow-x-auto [scrollbar-width:none]"><Secici {...p} /></div>;
}
