"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { User, CreditCard, BarChart3, Wallet, Gift, LogOut, MessageCircle, Award } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/useAuth";
import { cn } from "@/lib/utils";

export type AyarSekme = "profil" | "abonelik" | "kullanim" | "odeme" | "hediye" | "oduller";

// Higgsfield birebir: her sekmenin renkli kare rozet-ikonu
const sekmeler: { id: AyarSekme; ad: string; ikon: typeof User; renk: string }[] = [
  { id: "profil", ad: "Profil", ikon: User, renk: "bg-sky-500/20 text-sky-300" },
  { id: "abonelik", ad: "Abonelik", ikon: CreditCard, renk: "bg-rose-500/20 text-rose-300" },
  { id: "kullanim", ad: "Kullanım", ikon: BarChart3, renk: "bg-white/10 text-white/70" },
  { id: "oduller", ad: "Ödüller & Karma", ikon: Award, renk: "bg-amber-500/20 text-amber-300" },
  { id: "odeme", ad: "Ödeme yöntemleri", ikon: Wallet, renk: "bg-emerald-500/20 text-emerald-300" },
  { id: "hediye", ad: "Hediye & Promokod", ikon: Gift, renk: "bg-violet-500/20 text-violet-300" },
];

/** Higgsfield tarzı ayarlar: sol ikonlu sidebar + sağ içerik + Discord promo + çıkış. */
export function AyarKabuk({
  aktif,
  onSekme,
  children,
}: {
  aktif: AyarSekme;
  onSekme: (s: AyarSekme) => void;
  children: ReactNode;
}) {
  const router = useRouter();
  const cikisYap = useAuth((s) => s.cikisYap);

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8 lg:px-8">
      {/* Sol sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col md:flex">
        <h1 className="mb-5 px-2 text-lg font-bold">Ayarlar</h1>
        <nav className="space-y-0.5">
          {sekmeler.map((s) => (
            <button key={s.id} onClick={() => onSekme(s.id)}
              className={cn("flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                aktif === s.id ? "bg-cyan-glow/12 text-cyan-glow" : "text-white hover:bg-white/6")}>
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", s.renk)}>
                <s.ikon className="h-4 w-4" />
              </span>
              {s.ad}
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-2 pt-6">
          <Link href="/kesfet" className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-gradient-to-r from-indigo-500/15 to-transparent px-3 py-2.5 text-sm text-white transition-colors hover:bg-white/6">
            <MessageCircle className="h-4.5 w-4.5 text-indigo-300" /> Topluluğa katıl
          </Link>
          <button onClick={() => { cikisYap(); router.push("/"); }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-rose-300 transition-colors hover:bg-rose-500/10">
            <LogOut className="h-4.5 w-4.5" /> Çıkış yap
          </button>
        </div>
      </aside>

      {/* Mobil sekme şeridi */}
      <div className="w-full md:hidden">
        <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-yuzey p-1">
          {sekmeler.map((s) => (
            <button key={s.id} onClick={() => onSekme(s.id)}
              className={cn("shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                aktif === s.id ? "bg-cyan-glow/15 text-cyan-glow" : "text-white")}>
              {s.ad}
            </button>
          ))}
        </div>
        <div>{children}</div>
      </div>

      {/* Sağ içerik (masaüstü) */}
      <div className="hidden min-w-0 flex-1 md:block">{children}</div>
    </div>
  );
}
