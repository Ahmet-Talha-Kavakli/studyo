import Link from "next/link";
import { cn } from "@/lib/utils";

/** Dört uçlu yıldız — Higgsfield'deki gibi kredi birimi (`Üret ✦ 7`). */
const YILDIZ = "M12 2c.5 5.2 2.3 7.5 8 10-5.7 2.5-7.5 4.8-8 10-.5-5.2-2.3-7.5-8-10 5.7-2.5 7.5-4.8 8-10Z";

/** Kredi birimi işareti; rengi metinden (currentColor) gelir — düğme ve hap içindeki bedeller için. */
export function KrediYildiz({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d={YILDIZ} />
    </svg>
  );
}

/** Renkli kredi yıldızı — düz metin içindeki bakiye ve tahminler. `az` iken kehribar. */
export function KrediJeton({ boyut = 16, az, className }: { boyut?: number; az?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden width={boyut} height={boyut} className={cn("shrink-0", className)} fill={az ? "#fcd34d" : "#55d6fd"}>
      <path d={YILDIZ} />
    </svg>
  );
}

/**
 * Bakiye hapı ("F · Işıltılı kenar"): koyu hap, kenarında dönen camgöbeği ışıltı (globals.css `.kredi-isilti`),
 * parlayan yıldız + sayı + yuvarlak "+". `az` iken kehribar. `href` verilirse bağlantı, yoksa düğme olur.
 */
export function KrediIsiltiHap({ deger, az, href, onClick, boyut = "md", artiGizle, etiket, className }: {
  deger: number; az?: boolean; href?: string; onClick?: () => void; boyut?: "sm" | "md" | "lg";
  artiGizle?: boolean; etiket?: string; className?: string;
}) {
  const kucuk = boyut === "sm", buyuk = boyut === "lg";
  const sinif = cn("kredi-isilti group inline-flex shrink-0 rounded-full p-px outline-none transition-transform active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[#55d6fd]/60",
    kucuk ? "h-7" : buyuk ? "h-10" : "h-8", az && "kredi-isilti-az", className);
  const ic = (
    <span className={cn("flex h-full items-center rounded-full bg-[#111214] transition-colors group-hover:bg-[#16181b]",
      kucuk ? "gap-1.5 pl-2 text-[12.5px]" : buyuk ? "gap-2 pl-3 text-[14.5px]" : "gap-2 pl-2.5 text-[13.5px]", artiGizle ? (kucuk ? "pr-2.5" : "pr-3") : buyuk ? "pr-1.5" : "pr-1")}>
      <KrediJeton boyut={kucuk ? 12 : buyuk ? 15 : 14} az={az} className="kredi-isilti-yildiz" />
      <span className={cn("font-semibold tabular-nums", az ? "text-amber-300" : "text-white")}>{new Intl.NumberFormat("tr-TR").format(deger)}</span>
      {!artiGizle && (
        <span className={cn("flex items-center justify-center rounded-full bg-white/[0.08] text-white/80 transition-colors group-hover:bg-white/[0.14] group-hover:text-white", kucuk ? "h-5 w-5" : buyuk ? "h-7 w-7" : "h-6 w-6")}>
          <svg viewBox="0 0 24 24" className={kucuk ? "h-3 w-3" : "h-3.5 w-3.5"} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
        </span>
      )}
    </span>
  );
  const aria = etiket ?? `Kalan kredi: ${new Intl.NumberFormat("tr-TR").format(deger)}. Kredi yükle`;
  if (href) return <Link href={href} onClick={onClick} aria-label={aria} className={sinif}>{ic}</Link>;
  return <button type="button" onClick={onClick} aria-label={aria} className={sinif}>{ic}</button>;
}

/**
 * Bedel hapı: tek satır, yıldız + sayı. `deger` sayı değilse ("Ücretsiz", "Değişken") yazı olarak gösterilir.
 * `secili` iken camgöbeğine döner.
 */
export function KrediHap({ deger, secili, baslik, className }: { deger: string | number; secili?: boolean; baslik?: string; className?: string }) {
  const s = String(deger);
  const sayi = /^\d+([.,]\d+)?$/.test(s);
  const ucretsiz = /^ücretsiz$/i.test(s);
  return (
    <span title={baslik ?? (sayi ? `${s} kredi` : s)}
      className={cn("inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full text-[12.5px] font-semibold tabular-nums ring-1 ring-inset transition-colors",
        sayi ? "pl-2 pr-2.5" : "px-2.5 text-[11.5px] font-medium",
        secili ? "bg-aksan/[0.12] text-aksan ring-aksan/30"
          : ucretsiz ? "bg-emerald-400/[0.08] text-emerald-300 ring-emerald-400/20"
          : sayi ? "bg-white/[0.05] text-metin ring-white/[0.08]" : "bg-white/[0.035] text-metin-2 ring-white/[0.07]",
        className)}>
      {sayi && <KrediYildiz className={cn("h-3 w-3", secili ? "text-aksan" : "text-aksan/80")} />}
      {s}
    </span>
  );
}
