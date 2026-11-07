"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Search, AlertTriangle, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPRING, useSayac } from "@/lib/admin/animasyon";

/* Admin apple-glass UI kit — temel primitifler. Renkler .admin-kapsam token'larından.
   Emoji YOK → lucide ikon. Mikro animasyonlar (hover/spring/count-up) gömülü. */

export const AD = {
  metin: "text-[color:var(--ad-metin)]",
  metin2: "text-[color:var(--ad-metin-2)]",
  metin3: "text-[color:var(--ad-metin-3)]",
  aksan: "text-[color:var(--ad-aksan)]",
};

/** Apple-glass ikon kutusu. */
export function AdIkon({ ikon: Ikon, boyut = 40 }: { ikon: LucideIcon; boyut?: number }) {
  return (
    <span className="ad-ikon shrink-0" style={{ width: boyut, height: boyut }}>
      <Ikon style={{ width: boyut * 0.44, height: boyut * 0.44 }} />
    </span>
  );
}

/** Apple-glass kart. */
export function Kart({ children, className, hover, tikla }: { children: ReactNode; className?: string; hover?: boolean; tikla?: () => void }) {
  return (
    <div onClick={tikla} className={cn("ad-glass p-5", hover && "ad-glass-hover", tikla && "cursor-pointer", className)}>
      {children}
    </div>
  );
}

/** Animasyonlu giriş kartı (stagger içinde). */
export function KartMotion({ children, className, i = 0 }: { children: ReactNode; className?: string; i?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: i * 0.04 }}
      className={cn("ad-glass ad-glass-hover p-5", className)}
    >
      {children}
    </motion.div>
  );
}

/** Metrik kartı — etiket + count-up değer + delta + sparkline slot + ikon. */
export function MetrikKart({
  etiket, deger, birim, delta, ikon, alt, sayacHedef, renk = "aksan",
}: {
  etiket: string;
  deger: string | number;
  birim?: string;
  delta?: number;
  ikon?: LucideIcon;
  alt?: ReactNode;
  sayacHedef?: number; // sayı ise count-up
  renk?: "aksan" | "basari" | "uyari" | "tehlike" | "mor";
}) {
  const sayac = useSayac(sayacHedef ?? 0);
  const gosterilen = sayacHedef !== undefined
    ? Math.round(sayac).toLocaleString("tr-TR")
    : deger;
  void renk;
  return (
    <div className="ad-glass ad-glass-hover p-4">
      <div className="flex items-center justify-between">
        <span className={cn("text-xs", AD.metin2)}>{etiket}</span>
        {ikon && <AdIkon ikon={ikon} boyut={30} />}
      </div>
      <div className="mt-2.5 flex items-baseline gap-1.5">
        <span className={cn("text-[26px] font-bold leading-none tabular-nums", AD.metin)}>{gosterilen}</span>
        {birim && <span className={cn("text-sm", AD.metin3)}>{birim}</span>}
      </div>
      {(delta !== undefined || alt) && (
        <div className="mt-2 flex items-center gap-2 text-[12px]">
          {delta !== undefined && (
            <span style={{ color: delta >= 0 ? "var(--ad-basari)" : "var(--ad-tehlike)" }} className="font-semibold tabular-nums">
              {delta >= 0 ? "artış" : "düşüş"} yüzde {Math.abs(delta).toFixed(1).replace(".", ",").replace(/,0$/, "")}
            </span>
          )}
          {alt && <span className={AD.metin3}>{alt}</span>}
        </div>
      )}
    </div>
  );
}

/** Rozet. */
export function Rozet({ children, ton = "notr" }: { children: ReactNode; ton?: "notr" | "aksan" | "basari" | "uyari" | "tehlike" | "mor" }) {
  const s: Record<string, string> = {
    notr: "border-white/12 bg-white/[0.05] text-[color:var(--ad-metin-2)]",
    aksan: "border-[color:var(--ad-aksan)]/30 bg-[color:var(--ad-aksan)]/12 text-[color:var(--ad-aksan)]",
    basari: "border-emerald-400/30 bg-emerald-500/12 text-emerald-300",
    uyari: "border-amber-400/30 bg-amber-500/12 text-amber-300",
    tehlike: "border-rose-400/30 bg-rose-500/12 text-rose-300",
    mor: "border-violet-400/30 bg-violet-500/12 text-violet-300",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", s[ton])}>{children}</span>;
}

/** Durum noktası (renkli). */
export function DurumNokta({ ton = "basari", nabiz }: { ton?: "basari" | "uyari" | "tehlike" | "notr"; nabiz?: boolean }) {
  const renk = { basari: "bg-emerald-400", uyari: "bg-amber-400", tehlike: "bg-rose-400", notr: "bg-white/30" }[ton];
  return (
    <span className="relative inline-flex h-2 w-2">
      {nabiz && <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", renk)} />}
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", renk)} />
    </span>
  );
}

/** Dolu/glass buton. */
export function Dugme({
  children, onClick, disabled, tur = "aksan", boyut = "md", className, ikon: Ikon,
}: {
  children: ReactNode; onClick?: () => void; disabled?: boolean;
  tur?: "aksan" | "glass" | "tehlike"; boyut?: "sm" | "md"; className?: string; ikon?: LucideIcon;
}) {
  const boy = boyut === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-sm";
  const t = tur === "aksan" ? "ad-btn-aksan" : tur === "tehlike" ? "bg-rose-500/90 text-white hover:bg-rose-500" : "ad-btn-glass";
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn("inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40", boy, t, className)}>
      {Ikon && <Ikon className="h-4 w-4" />}
      {children}
    </button>
  );
}

/** Bölüm başlığı. */
export function BolumBaslik({ baslik, ozet, sag, ikon }: { baslik: string; ozet?: string; sag?: ReactNode; ikon?: LucideIcon }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {ikon && <AdIkon ikon={ikon} boyut={38} />}
        <div>
          <h2 className={cn("text-lg font-bold tracking-tight", AD.metin)}>{baslik}</h2>
          {ozet && <p className={cn("text-sm", AD.metin3)}>{ozet}</p>}
        </div>
      </div>
      {sag}
    </div>
  );
}

/** Sekmeler (layoutId animasyonlu). */
export function Sekmeler({ sekmeler, aktif, sec }: { sekmeler: { id: string; ad: string; sayi?: number }[]; aktif: string; sec: (id: string) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto ad-ince-scroll">
      {sekmeler.map((s) => (
        <button key={s.id} onClick={() => sec(s.id)}
          className={cn("relative shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
            aktif === s.id ? AD.metin : cn(AD.metin3, "hover:text-[color:var(--ad-metin-2)]"))}>
          {aktif === s.id && <motion.span layoutId="adSekme" className="absolute inset-0 rounded-lg bg-white/[0.06]" transition={SPRING} />}
          <span className="relative flex items-center gap-1.5">
            {s.ad}
            {s.sayi !== undefined && <span className="rounded-full bg-white/10 px-1.5 text-[11px] tabular-nums">{s.sayi}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

/** Arama kutusu. */
export function AramaKutu({ deger, degis, yer = "Ara…", className }: { deger: string; degis: (v: string) => void; yer?: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ad-metin-3)]" />
      <input value={deger} onChange={(e) => degis(e.target.value)} placeholder={yer}
        className="h-9 w-full rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] pl-9 pr-3 text-sm text-[color:var(--ad-metin)] outline-none placeholder:text-[color:var(--ad-metin-3)] focus:border-[color:var(--ad-aksan)]/40" />
    </div>
  );
}

/** Filtre çipi. */
export function FiltreCip({ aktif, onClick, children }: { aktif?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick}
      className={cn("shrink-0 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors",
        aktif ? "border-[color:var(--ad-aksan)]/40 bg-[color:var(--ad-aksan)]/10 text-[color:var(--ad-aksan)]"
              : "border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-2)] hover:text-[color:var(--ad-metin)]")}>
      {children}
    </button>
  );
}

/** Boş durum. */
export function Bos({ ikon: Ikon, baslik, ozet }: { ikon?: LucideIcon; baslik: string; ozet?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[color:var(--ad-kenar)] py-14 text-center">
      {Ikon && <AdIkon ikon={Ikon} boyut={48} />}
      <div className={cn("text-[15px] font-semibold", AD.metin)}>{baslik}</div>
      {ozet && <p className={cn("max-w-sm text-sm", AD.metin3)}>{ozet}</p>}
    </div>
  );
}

/** Yükleniyor iskeleti. */
export function Yukleniyor({ satir = 3, className }: { satir?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)} aria-busy="true" aria-label="Yükleniyor">
      {Array.from({ length: satir }, (_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl border border-[color:var(--ad-kenar)] bg-white/[0.025]" />)}
    </div>
  );
}

/** Veri okunamadı kutusu (yeniden dene düğmeli). */
export function HataKutusu({ hata, yenile }: { hata: string; yenile?: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-rose-400/25 bg-rose-500/[0.06] px-4 py-3">
      <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-rose-300" />
      <span className={cn("min-w-0 flex-1 text-sm", AD.metin2)}>{hata}</span>
      {yenile && <button onClick={yenile} className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--ad-kenar)] px-2.5 py-1.5 text-[13px] text-[color:var(--ad-metin)] hover:bg-white/[0.05]"><RotateCw className="h-3.5 w-3.5" /> Yeniden dene</button>}
    </div>
  );
}

/** Küçük bilgi satırı: etiket solda, değer sağda. */
export function BilgiSatir({ etiket, children }: { etiket: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[color:var(--ad-kenar)] py-2 text-[13px] last:border-0">
      <span className={cn("shrink-0", AD.metin3)}>{etiket}</span>
      <span className={cn("min-w-0 break-words text-right", AD.metin)}>{children}</span>
    </div>
  );
}

/** Kart başlığı. */
export function KartBaslik({ children, sag, ikon: Ikon }: { children: ReactNode; sag?: ReactNode; ikon?: LucideIcon }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className={cn("flex min-w-0 items-center gap-2 text-sm font-bold", AD.metin)}>{Ikon && <Ikon className="h-4 w-4 shrink-0 text-[color:var(--ad-aksan)]" />}<span className="truncate">{children}</span></h3>
      {sag}
    </div>
  );
}
