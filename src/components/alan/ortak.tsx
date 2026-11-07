"use client";

import { IskeletGrup } from "@/components/ui/Iskelet";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Crown, Eye, Shield, UserRound } from "lucide-react";
import * as A from "@/lib/alan/istemci";
import { ROL_AD, type AlanAyrinti, type AlanRol } from "@/lib/alan/tipler";
import { alanDegisinceDinle, useAlan } from "@/store/useAlan";
import { cn } from "@/lib/utils";

/** Alan logosu: yüklenen görsel ya da alan renginde baş harf karosu. */
export function AlanLogo({ ad, logo, renk, boyut = 28, className }: { ad: string; logo?: string; renk?: string; boyut?: number; className?: string }) {
  const r = Math.round(boyut * 0.28);
  if (logo) return <img src={logo} alt="" className={cn("shrink-0 bg-white/[0.06] object-cover", className)} style={{ width: boyut, height: boyut, borderRadius: r }} />;
  return (
    <span aria-hidden className={cn("flex shrink-0 items-center justify-center font-semibold text-[#0b0b0c]", className)}
      style={{ width: boyut, height: boyut, borderRadius: r, fontSize: Math.round(boyut * 0.46), background: `linear-gradient(140deg, ${renk ?? "#55d6fd"}, color-mix(in oklab, ${renk ?? "#55d6fd"} 62%, #0b0b0c))` }}>
      {ad.trim().slice(0, 1).toLocaleUpperCase(DIL) || "A"}
    </span>
  );
}

export const ROL_IKON: Record<AlanRol, typeof Crown> = { sahip: Crown, yonetici: Shield, uye: UserRound, izleyici: Eye };

export function RolHap({ rol, className }: { rol: AlanRol; className?: string }) {
  const I = ROL_IKON[rol];
  return (
    <span className={cn("inline-flex h-[22px] shrink-0 items-center gap-1 rounded-full px-2 text-[11.5px] font-semibold",
      rol === "sahip" ? "bg-[#55d6fd]/12 text-[#55d6fd]" : rol === "yonetici" ? "bg-white/[0.09] text-white/85" : "bg-white/[0.05] text-white/60", className)}>
      <I className="h-3 w-3" strokeWidth={2.2} />{ROL_AD[rol]}
    </span>
  );
}

/**
 * Biçim dili: arayüz metniyle aynı dil (şimdilik Türkçe). Ürün global; dil değişince yalnız bu sabit değişir.
 * Tarihler kullanıcının tarayıcı saat diliminde gösterilir, sunucu bir ülke saatine sabitlenmez.
 */
export const DIL = "tr-TR";
export const saatDilimi = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; } };
export const sayiYaz = (n: number) => new Intl.NumberFormat(DIL).format(Math.round(n));
export const tarihYaz = (t: number) => new Date(t).toLocaleDateString(DIL, { day: "numeric", month: "long", year: "numeric" });
export const kisaTarih = (t: number) => new Date(t).toLocaleDateString(DIL, { day: "numeric", month: "short" });
/** Para tutarı (en küçük birimden): para birimi sunucudan gelir (TRY, USD …). */
export const paraYaz = (birim: number, para: string) => new Intl.NumberFormat(DIL, { style: "currency", currency: para, maximumFractionDigits: 2 }).format(birim / 100);
export function goreliZaman(t: number) {
  const s = Math.max(0, Date.now() - t) / 1000;
  if (s < 60) return "az önce";
  if (s < 3600) return `${Math.floor(s / 60)} dk önce`;
  if (s < 86400) return `${Math.floor(s / 3600)} sa önce`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} gün önce`;
  return kisaTarih(t);
}

/** Etkin alanın ayrıntısı: alan değişince ve odaklanınca yenilenir. */
export function useAlanAyrinti() {
  const etkin = useAlan((s) => s.etkin);
  const yuklendi = useAlan((s) => s.yuklendi);
  const [alan, setAlan] = useState<AlanAyrinti | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const id = etkin?.id ?? null;
  const yenile = useCallback(async () => {
    if (!id) { setAlan(null); setYukleniyor(false); return; }
    const r = await A.alanGetir(id);
    setYukleniyor(false);
    if (r.ok) { setAlan(r.alan); setHata(null); } else setHata(r.hata);
  }, [id]);
  useEffect(() => { setYukleniyor(true); void yenile(); }, [yenile]);
  useEffect(() => alanDegisinceDinle(() => void yenile()), [yenile]);
  useEffect(() => { if (!yuklendi) void useAlan.getState().yukle(); }, [yuklendi]);
  return { alan, setAlan, hata, yukleniyor: yukleniyor || !yuklendi, yenile, id };
}

/** Seçenek menüsü: düğmede seçili değer; menüde seçenekler (seçili satır beyaz halka) ve en altta "Özel" girişi. */
export function SecimMenusu<T extends string | number | null>({ deger, secenekler, onSec, ozel, etiket, genislik = 240, disabled, className }: {
  deger: T; secenekler: { deger: T; ad: string; alt?: string }[]; onSec: (v: T) => void;
  /** "Özel" satırı: sayı girişi. */
  ozel?: { ad?: string; birim?: string; onSec: (n: number) => void; en?: number; enCok?: number };
  etiket: string; genislik?: number; disabled?: boolean; className?: string;
}) {
  const [acik, setAcik] = useState(false);
  const [ozelDeger, setOzelDeger] = useState("");
  const ref = useRef<HTMLButtonElement>(null);
  const [konum, setKonum] = useState({ x: 0, y: 0, yukari: false });
  useEffect(() => {
    if (!acik) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setAcik(false); };
    const kapat = () => setAcik(false);
    addEventListener("keydown", k); addEventListener("resize", kapat);
    return () => { removeEventListener("keydown", k); removeEventListener("resize", kapat); };
  }, [acik]);
  const ac = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) {
      const yukari = innerHeight - r.bottom < 340 && r.top > innerHeight - r.bottom;
      setKonum({ x: Math.max(8, Math.min(innerWidth - genislik - 8, r.right - genislik)), y: yukari ? innerHeight - r.top + 6 : r.bottom + 6, yukari });
    }
    setOzelDeger("");
    setAcik((v) => !v);
  };
  const secili = secenekler.find((s) => s.deger === deger);
  const ozelUygula = () => {
    const n = Math.floor(Number(ozelDeger.replace(/\./g, "").replace(",", ".")));
    if (!ozel || !Number.isFinite(n) || n < (ozel.en ?? 0) || n > (ozel.enCok ?? 10_000_000)) return;
    ozel.onSec(n); setAcik(false);
  };
  return (
    <>
      <button ref={ref} type="button" disabled={disabled} onClick={ac} aria-haspopup="listbox" aria-expanded={acik} aria-label={etiket}
        className={cn("inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.06] pl-3.5 pr-2.5 text-[13.5px] font-medium text-white ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1] disabled:pointer-events-none disabled:opacity-40", className)}>
        <span className="truncate">{secili?.ad ?? (typeof deger === "number" ? `${sayiYaz(deger)}${ozel?.birim ? ` ${ozel.birim}` : ""}` : String(deger ?? ""))}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-white/50 transition-transform", acik && "rotate-180")} />
      </button>
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {acik && (
            <>
              <div className="fixed inset-0 z-[130]" onMouseDown={() => setAcik(false)} />
              <motion.div role="listbox" aria-label={etiket} initial={{ opacity: 0, y: konum.yukari ? 6 : -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: konum.yukari ? 4 : -4 }} transition={{ duration: 0.14 }}
                className="bd-panel fixed z-[131] overflow-hidden rounded-[16px] p-1.5" style={{ width: genislik, left: konum.x, ...(konum.yukari ? { bottom: konum.y } : { top: konum.y }) }}>
                {secenekler.map((s) => {
                  const sec = s.deger === deger;
                  return (
                    <button key={String(s.deger)} type="button" role="option" aria-selected={sec} onClick={() => { onSec(s.deger); setAcik(false); }}
                      className={cn("flex w-full flex-col items-start rounded-[11px] px-3 py-2 text-left transition-colors hover:bg-white/[0.06]", sec && "outline outline-[1.5px] -outline-offset-[1.5px] outline-white")}>
                      <span className="text-[13.5px] font-medium text-white">{s.ad}</span>
                      {s.alt && <span className="mt-0.5 text-[12px] leading-snug text-white/50">{s.alt}</span>}
                    </button>
                  );
                })}
                {ozel && (
                  <form onSubmit={(e) => { e.preventDefault(); ozelUygula(); }} className="mt-1 flex items-center gap-1.5 border-t border-white/[0.06] px-1.5 pb-0.5 pt-2">
                    <input value={ozelDeger} onChange={(e) => setOzelDeger(e.target.value.replace(/[^\d.,]/g, ""))} inputMode="numeric" placeholder={ozel.ad ?? "Özel"} aria-label={ozel.ad ?? "Özel değer"}
                      className="h-8 min-w-0 flex-1 rounded-[9px] bg-white/[0.05] px-2.5 text-[13px] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/45 focus:ring-[#55d6fd]/60" />
                    <button type="submit" disabled={!ozelDeger} className="h-8 shrink-0 rounded-[9px] bg-white px-3 text-[12.5px] font-semibold text-black disabled:opacity-35">Uygula</button>
                  </form>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

/** Ayar sayfasında etkin alan yoksa: alan seçme ya da oluşturma çağrısı. */
export function AlanYok({ baslik, metin, children }: { baslik: string; metin: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-[18px] bg-[#121214] p-6 ring-1 ring-inset ring-white/[0.08] sm:flex-row sm:items-center">
      <div className="flex -space-x-2">
        {["#55d6fd", "#a78bfa", "#34d399"].map((r, i) => (
          <motion.span key={r} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
            className="flex h-10 w-10 items-center justify-center rounded-[12px] text-[16px] font-semibold text-[#0b0b0c] ring-2 ring-[#121214]" style={{ background: r }}>{["E", "T", "S"][i]}</motion.span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15.5px] font-semibold text-white">{baslik}</p>
        <p className="mt-1 text-[13.5px] leading-relaxed text-white/55">{metin}</p>
      </div>
      {children && <div className="flex shrink-0 flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Yukleniyor() {
  return (
    <div className="space-y-4">
      <IskeletGrup satir={2} />
      <IskeletGrup satir={3} />
    </div>
  );
}
