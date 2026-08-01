"use client";

import Link from "next/link";
import { Rocket, Folder } from "lucide-react";
import { useAuth } from "@/store/useAuth";
import { cn } from "@/lib/utils";

/* ============================================================
   PAZARLAMA — ORTAK KABUK PARÇALARI
   Referans: tüm marketing ekranlarında değişmeyen sağ-üst küme
   ve zemin ızgarası.
   ============================================================ */

/** Sağ üst: Yükselt(+%30 rozeti) · Varlıklar · avatar. */
export function PazUstKume({ className }: { className?: string }) {
  const kullanici = useAuth((s) => s.kullanici);
  return (
    /* MOBİLDE etiketler gizli — üç tam-genişlik hap (298px) 390px ekranda
       yatay taşma yapıyordu (ölçüldü). ≥640px'de metinler geri gelir. */
    <div className={cn("flex items-center gap-2 sm:gap-3", className)}>
      <Link href="/panel/kredi" className="relative">
        <span className="flex h-10 items-center gap-2 rounded-full border border-[#2C2D30] bg-[#1A1B1D]/70 px-3 text-[15px] font-medium text-white backdrop-blur transition-colors hover:bg-[#232427]/80 sm:px-4">
          <Rocket className="h-[17px] w-[17px]" style={{ color: "var(--sn-lime,#55d6fd)" }} />
          <span className="hidden sm:inline">Yükselt</span>
        </span>
        {/* Referansta butonun SOL-ALTINA taşan fuşya rozet */}
        <span className="absolute -bottom-2 left-2 hidden rounded-[6px] bg-[#F2276B] px-[7px] py-[3px] text-[11px] font-bold leading-none text-white sm:block">
          %30 İNDİRİM
        </span>
      </Link>

      <Link href="/panel/kitaplik"
        className="flex h-10 items-center gap-2 rounded-full border border-[#2C2D30] bg-[#1A1B1D]/70 px-3 text-[15px] font-medium text-white backdrop-blur transition-colors hover:bg-[#232427]/80 sm:px-4">
        <Folder className="h-[17px] w-[17px] text-aksan" />
        <span className="hidden sm:inline">Varlıklar</span>
      </Link>

      <Link href="/panel/profil"
        className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-bold text-[#101207] ring-2 ring-white/20"
        style={{ background: "radial-gradient(circle at 30% 30%, #fff, var(--sn-lime,#55d6fd))" }}>
        {(kullanici?.ad ?? "V").charAt(0).toUpperCase()}
      </Link>
    </div>
  );
}

/** Zemin ızgarası — referansta 96px hücreli ince beyaz çizgiler. */
export function PazIzgaraZemin({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px)," +
          "linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
        backgroundSize: "96px 96px",
      }} />
  );
}

/** Hero'nun arkasındaki radyal yıkama — BİZİM CYAN'ımız.
    Kullanıcı isteği 2026-07-31: "heroda üstten yeşil şey geliyor arkaplanda
    bunun rengini mavimiz ile değiştirelim". Higgsfield'ın zeytin/lime
    (#7E8C1E → #4E5A15) yıkaması markamıza ait değildi. Aynı parlaklık
    basamakları korunarak cyan'a taşındı. */
export function PazZeytinYikama() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[860px]"
      style={{
        background:
          "radial-gradient(120% 78% at 50% -12%, #1B6F8C 0%, #12475A 34%, rgba(12,32,39,0.55) 62%, transparent 88%)",
      }} />
  );
}
