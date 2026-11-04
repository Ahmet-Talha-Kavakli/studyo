"use client";

/**
 * Earn para sayfalarının (Cüzdan, Davet, Marketplace) ortak dili — genel bakışla aynı:
 * beyaz birincil düğme, nötr pasif hal, degrade yüzey kartları, gerçek ödeme logoları,
 * motion value ile sayan sayaç (kare başı React state yok).
 */

import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

export const ease = [0.22, 1, 0.36, 1] as const;
export const yay = { type: "spring" as const, stiffness: 420, damping: 34 };

/** Birincil: beyaz hap; pasifken nötr (camgöbeği değil). */
export const birincil = "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97] disabled:pointer-events-none disabled:bg-white/[0.07] disabled:text-white/35";
export const ikincil = "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-[14px] font-medium text-white ring-1 ring-white/[0.14] transition hover:bg-white/[0.06] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40";
export const yuzey = "rounded-[26px] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.012))] ring-1 ring-white/[0.08]";

export function Sayac({ hedef, sure = 1.1, bicim, className }: { hedef: number; sure?: number; bicim: (n: number) => string; className?: string }) {
  const mv = useMotionValue(0);
  const metin = useTransform(mv, (v) => bicim(v));
  useEffect(() => { const c = animate(mv, hedef, { duration: sure, ease }); return () => c.stop(); }, [hedef, sure, mv]);
  return <motion.span className={className}>{metin}</motion.span>;
}

export function Bolum({ baslik, alt, sag, children, className }: { baslik: string; alt?: string; sag?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("mt-14", className)}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-[24px] font-semibold tracking-[-0.03em] text-white">{baslik}</h2>{alt && <p className="mt-1 text-[14px] text-white/55">{alt}</p>}</div>
        {sag}
      </div>
      {children}
    </section>
  );
}

export function Baslik({ baslik, alt, sag }: { baslik: string; alt: string; sag?: React.ReactNode }) {
  return (
    <motion.header initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }} className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-[640px]">
        <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.035em] text-white sm:text-[36px]">{baslik}</h1>
        <p className="mt-1.5 text-[15px] leading-relaxed text-white/60">{alt}</p>
      </div>
      {sag && <div className="flex shrink-0 flex-wrap gap-2">{sag}</div>}
    </motion.header>
  );
}

/** Rozet: "Örnek" gibi dürüstlük etiketleri için kehribar hap. */
export function OrnekRozet({ children = "Örnek" }: { children?: React.ReactNode }) {
  return <span className="rounded-full bg-amber-300/12 px-2.5 py-1 text-[12px] font-medium text-amber-200">{children}</span>;
}

/* ── Ödeme logoları ── */
export const BANKALAR: Record<string, { ad: string; logo: string }> = {
  "00010": { ad: "Ziraat Bankası", logo: "/marka/renkli/banka-ziraat.svg" },
  "00062": { ad: "Garanti BBVA", logo: "/marka/renkli/banka-garanti.svg" },
  "00064": { ad: "İş Bankası", logo: "/marka/renkli/banka-isbank.svg" },
  "00046": { ad: "Akbank", logo: "/marka/renkli/banka-akbank.svg" },
  "00015": { ad: "VakıfBank", logo: "/marka/renkli/banka-vakifbank.svg" },
  "00012": { ad: "Halkbank", logo: "/marka/renkli/banka-halkbank.svg" },
};
/** TR IBAN: TR + 2 kontrol + 5 haneli banka kodu. */
export function bankaBul(iban: string) {
  const t = iban.replace(/\s/g, "").toUpperCase();
  return t.length >= 9 ? BANKALAR[t.slice(4, 9)] ?? null : null;
}

/** Logo karosu: koyu logolar beyaz karoda (gerçek resmî logo). Banka tanınmazsa nötr banka simgesi. */
export function OdemeLogo({ tur, deger, boyut = "md" }: { tur: "iban" | "papara"; deger?: string; boyut?: "sm" | "md" | "lg" }) {
  const b = tur === "iban" && deger ? bankaBul(deger) : null;
  const k = boyut === "sm" ? "h-8 w-12 rounded-[9px] px-1.5" : boyut === "lg" ? "h-12 w-[84px] rounded-[13px] px-2.5" : "h-10 w-16 rounded-[11px] px-2";
  if (tur === "papara") {
    // eslint-disable-next-line @next/next/no-img-element
    return <span className={cn("flex shrink-0 items-center justify-center bg-white", k)}><img src="/marka/renkli/papara.png" alt="Papara" className="max-h-[42%] w-full object-contain" /></span>;
  }
  if (b) {
    // eslint-disable-next-line @next/next/no-img-element
    return <span className={cn("flex shrink-0 items-center justify-center bg-white", k)} title={b.ad}><img src={b.logo} alt={b.ad} className="max-h-[60%] w-full object-contain" /></span>;
  }
  return <span className={cn("flex shrink-0 items-center justify-center bg-white/[0.07] text-white/70 ring-1 ring-white/[0.1]", k)}><Landmark className="h-4 w-4" /></span>;
}

export const maskele = (d: string) => {
  const t = d.replace(/\s/g, "");
  return t.length > 10 ? `${t.slice(0, 4)} •••• ${t.slice(-4)}` : `•••• ${t.slice(-4)}`;
};
