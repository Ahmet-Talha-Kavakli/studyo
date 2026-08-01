"use client";

import { type ReactNode } from "react";

/* Earn ortak UI — m62: platformun İMZA rengine (aksan = cyan #55d6fd) hizalandı.
   Eskiden kendi yeşil (emerald) temasını kuruyordu; kullanıcı "kalite/tasarım
   platformun geri kalanına uymuyor" dedi → aksan'a geçildi. Emoji yok → lucide. */

export const YESIL = "#55d6fd";
export const cn = (...s: (string | false | undefined | null)[]) => s.filter(Boolean).join(" ");

/** Apple-glass ikon kutusu — emoji yerine lucide ikon, cam efektli. */
export function GlassIkon({ children, boyut = 44, aktif }: { children: ReactNode; boyut?: number; aktif?: boolean }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md",
        aktif ? "border-sky-400/30 bg-sky-500/[0.14] text-sky-300" : "border-white/[0.1] bg-white/[0.05] text-white/75",
      )}
      style={{ width: boyut, height: boyut }}
    >
      {children}
    </span>
  );
}

/** Apple-glass kart: koyu yarı-saydam yüzey + blur + üstten hafif ışık kenarı. */
export const GLASS = "rounded-2xl border border-white/[0.07] bg-[#14151799] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_24px_-8px_rgba(0,0,0,0.5)] backdrop-blur-xl";

export function Kart({ children, className, tikla }: { children: ReactNode; className?: string; tikla?: () => void }) {
  return (
    <div onClick={tikla} className={cn(GLASS, "p-5", tikla && "cursor-pointer transition-colors hover:border-white/[0.14]", className)}>
      {children}
    </div>
  );
}

export function MetrikKart({ etiket, deger, alt, ikon, vurgu }: { etiket: string; deger: string; alt?: ReactNode; ikon?: ReactNode; vurgu?: boolean }) {
  return (
    <div className={cn(GLASS, "p-4")}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/50">{etiket}</span>
        {ikon && <GlassIkon boyut={30} aktif={vurgu}>{ikon}</GlassIkon>}
      </div>
      <div className={cn("mt-2 text-[26px] font-bold leading-none", vurgu ? "text-sky-300" : "text-white")}>{deger}</div>
      {alt && <div className="mt-1.5 text-[12px] text-white/45">{alt}</div>}
    </div>
  );
}

export function Rozet({ children, ton = "notr" }: { children: ReactNode; ton?: "notr" | "yesil" | "sari" | "kirmizi" | "mavi" }) {
  const s = {
    notr: "border-white/12 bg-white/[0.05] text-white/60",
    yesil: "border-sky-400/30 bg-sky-500/12 text-sky-300",
    sari: "border-amber-400/30 bg-amber-500/12 text-amber-300",
    kirmizi: "border-rose-400/30 bg-rose-500/12 text-rose-300",
    mavi: "border-sky-400/30 bg-sky-500/12 text-sky-300",
  }[ton];
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", s)}>{children}</span>;
}

export function DurumRozet({ durum }: { durum: string }) {
  const harita: Record<string, { ton: "notr" | "yesil" | "sari" | "kirmizi" | "mavi"; ad: string }> = {
    taslak: { ton: "notr", ad: "Taslak" },
    inceleniyor: { ton: "sari", ad: "İnceleniyor" },
    beklemede: { ton: "sari", ad: "Beklemede" },
    acik: { ton: "mavi", ad: "Açık" },
    yanitlandi: { ton: "mavi", ad: "Yanıtlandı" },
    onaylandi: { ton: "yesil", ad: "Onaylandı" },
    katildi: { ton: "yesil", ad: "Katıldı" },
    uretti: { ton: "yesil", ad: "Üretti" },
    aktif: { ton: "yesil", ad: "Aktif" },
    odendi: { ton: "yesil", ad: "Ödendi" },
    reddedildi: { ton: "kirmizi", ad: "Reddedildi" },
    pasif: { ton: "notr", ad: "Pasif" },
    kapandi: { ton: "notr", ad: "Kapandı" },
    bitti: { ton: "notr", ad: "Bitti" },
  };
  const d = harita[durum] ?? { ton: "notr" as const, ad: durum };
  return <Rozet ton={d.ton}>{d.ad}</Rozet>;
}

export function YesilDugme({ children, onClick, disabled, className, tur = "dolu" }: { children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string; tur?: "dolu" | "hafif" }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn("rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-150 hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100",
        tur === "dolu" ? "bg-sky-400 text-[#04141a] shadow-lg shadow-sky-500/10 hover:bg-sky-300" : "border border-sky-400/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20", className)}>
      {children}
    </button>
  );
}

export function SayfaBaslik({ baslik, ozet, sag }: { baslik: string; ozet?: string; sag?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{baslik}</h1>
        {ozet && <p className="mt-1 text-sm text-white/50">{ozet}</p>}
      </div>
      {sag}
    </div>
  );
}

export function BosDurum({ ikon, baslik, ozet, aksiyon }: { ikon?: ReactNode; baslik: string; ozet?: string; aksiyon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/[0.1] py-14 text-center">
      {ikon && <GlassIkon boyut={52}>{ikon}</GlassIkon>}
      <div className="text-[15px] font-semibold text-white">{baslik}</div>
      {ozet && <p className="max-w-sm text-sm text-white/45">{ozet}</p>}
      {aksiyon}
    </div>
  );
}
