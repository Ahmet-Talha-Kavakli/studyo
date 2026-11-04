"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuthKapi } from "@/store/useAuthKapi";
import { cn } from "@/lib/utils";

/**
 * Misafir için "Giriş yap" + "Ücretsiz başla" düğmeleri — tüm üst çubuklarda aynı.
 * `pencere`: yerinde giriş penceresi açar (panel, uygulama içi); yoksa /giris ve /kayit sayfasına gider.
 * `blok`: mobil menüde tam genişlik, yan yana.
 */
const ODAK = "outline-none focus-visible:ring-2 focus-visible:ring-[#55d6fd]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0c]";

export function AuthDugmeleri({ pencere, blok, onTik, className }: { pencere?: boolean; blok?: boolean; onTik?: () => void; className?: string }) {
  const ac = useAuthKapi((s) => s.ac);
  const girisSinif = cn("flex items-center justify-center rounded-full font-medium text-white/85 transition-[background-color,color,transform] hover:bg-white/[0.08] hover:text-white active:scale-[0.97]", ODAK,
    blok ? "h-11 flex-1 bg-white/[0.06] text-[15px] ring-1 ring-inset ring-white/[0.1]" : "h-10 px-4 text-[14.5px]");
  const basSinif = cn("group flex items-center justify-center gap-1.5 rounded-full bg-white font-semibold text-[#0b0b0d] transition-[background-color,transform] hover:bg-white/90 active:scale-[0.97]", ODAK,
    blok ? "h-11 flex-1 text-[15px]" : "h-10 pl-4 pr-3.5 text-[14.5px]");
  const ok = <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.4} />;

  return (
    <div className={cn("flex items-center gap-1.5", blok && "w-full gap-2", className)}>
      {pencere ? (
        <>
          <button onClick={() => { onTik?.(); ac({ baslik: "Tekrar hoş geldin" }); }} className={girisSinif}>Giriş yap</button>
          <button onClick={() => { onTik?.(); ac({ baslik: "Vayra'ya hoş geldin" }); }} className={basSinif}>Ücretsiz başla{ok}</button>
        </>
      ) : (
        <>
          <Link href="/giris" onClick={onTik} className={girisSinif}>Giriş yap</Link>
          <Link href="/kayit" onClick={onTik} className={basSinif}>Ücretsiz başla{ok}</Link>
        </>
      )}
    </div>
  );
}
