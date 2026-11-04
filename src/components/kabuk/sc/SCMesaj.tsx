"use client";

import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   SUPERCOMPUTER — mesaj gövdeleri. Higgsfield birebir.
   Referans: higg-supercomputer 00.07.35 → 00.08.39, 00.26.x

   EN AYIRT EDİCİ TİPOGRAFİK KARAR (referansta çok net):
     • Kullanıcı mesajı  → BALONLU, sans, --sc-cip zemin
     • Asistan cevabı    → BALONSUZ, SERİF, yaklaşık 20px, sola dayalı
     • Akıl yürütme      → gri sans, girintili (cevaptan ayrışır)
   ============================================================ */

/** Kullanıcı balonu — sağa yaslı ama neredeyse tam genişlik, avatar YOK. */
export function SCKullaniciMesaji({ metin }: { metin: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-[20px] bg-[var(--sc-cip)] px-5 py-3.5 text-[16px] leading-relaxed text-[var(--sc-metin)]">
        {metin}
      </div>
    </div>
  );
}

/** Asistan cevabı — balon yok, zemin yok, avatar yok. Sadece serif metin. */
export function SCAsistanMesaji({ metin }: { metin: string }) {
  return (
    <div
      className="text-[19px] leading-[1.55] text-[var(--sc-metin)]"
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      {metin.split("\n").map((satir, i) => {
        const bos = satir.trim() === "";
        if (bos) return <div key={i} className="h-3" />;
        // "**kalın**" → serif kalın (referansta madde başlıkları böyle)
        const parcalar = satir.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className={cn(satir.startsWith("•") && "pl-4")}>
            {parcalar.map((p, j) =>
              p.startsWith("**") && p.endsWith("**")
                ? <strong key={j} className="font-bold text-[var(--sc-metin)]">{p.slice(2, -2)}</strong>
                : <span key={j}>{p}</span>,
            )}
          </p>
        );
      })}
    </div>
  );
}

/** Üretim yer tutucusu — kare, lime spinner çipi sol üstte (referans: 00.08.39). */
export function SCUretimYerTutucu({ boyut = 233 }: { boyut?: number }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-[var(--sc-kenar)] bg-[var(--sc-kart)]"
      style={{ width: boyut, height: boyut }}
    >
      {/* üstten sızan lime parıltı */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-28"
        style={{ background: "linear-gradient(180deg, color-mix(in srgb, var(--sc-aksan) 22%, transparent), transparent)" }}
        aria-hidden
      />
      <span className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-[var(--sc-cip-2)] px-2.5 py-1.5 text-[13px]"
        style={{ color: "var(--sc-aksan)" }}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Üretiliyor
      </span>
    </div>
  );
}

/** Üretim sonucu — hazır görsel kutucuğu. */
export function SCUretimSonuc({ arka, url, boyut = 233, onAc }: {
  arka: string; url?: string; boyut?: number; onAc?: () => void;
}) {
  return (
    <button onClick={onAc}
      className="hf-kart hf-kart-tiklanabilir group relative overflow-hidden rounded-xl"
      style={{ width: boyut, height: boyut, background: arka }}>
      {url && <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />}
      {/* Hover vignette — dört kenardan koyu (Higgsfield birebir) */}
      <span className="uretim-vignette" />
    </button>
  );
}

/** Ajan çalışma başlığı — "11sn'dir çalışıyor · ✦ Üretiliyor" */
export function SCCalismaBasligi({ saniye, etkinlik }: { saniye: number; etkinlik?: string }) {
  const dk = Math.floor(saniye / 60), sn = saniye % 60;
  const sure = dk > 0 ? `${dk}dk ${sn}sn` : `${sn}sn`;
  return (
    <div className="flex items-center gap-2.5 border-b border-[var(--sc-kenar)] pb-3">
      <span className="glass-ikon glass-ikon-lime flex h-6 w-6 shrink-0 items-center justify-center rounded-md">
        <Sparkles className="h-3 w-3" />
      </span>
      <span className="text-[16px] text-[var(--sc-metin)]">
        <span style={{ color: "var(--sc-aksan)" }}>{sure}</span>&apos;dir çalışıyor
      </span>
      {etkinlik && (
        <>
          <span className="text-[var(--sc-metin-3)]">·</span>
          <span className="flex items-center gap-1.5 text-[15px]" style={{ color: "var(--sc-aksan)" }}>
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {etkinlik}
          </span>
        </>
      )}
    </div>
  );
}
