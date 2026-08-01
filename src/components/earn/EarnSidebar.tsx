"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Coins, Video, Share2, Users, Briefcase, Target, ShoppingBag, Trophy,
  ClipboardList, Wallet, Link2, Info, LifeBuoy, Menu, X, ArrowLeft, Award,
} from "lucide-react";
import { useEarn, bakiye, tierBul, tl } from "@/store/useEarn";
import { cn, GlassIkon } from "./UI";

/* Earn sol sidebar — kendi navigasyonu (13 sayfa). Açık yeşil imza. */

const NAV = [
  { grup: "", ogeler: [{ ad: "Genel Bakış", yol: "/earn", ikon: LayoutDashboard }] },
  { grup: "Kazan", ogeler: [
    { ad: "Kazanç Yolları", yol: "/earn/yollar", ikon: Coins },
    { ad: "Flow Performansı", yol: "/earn/flow", ikon: Video },
    { ad: "Sosyal Paylaşım", yol: "/earn/sosyal", ikon: Share2 },
    { ad: "Referanslar", yol: "/earn/referans", ikon: Users },
    { ad: "Affiliate", yol: "/earn/affiliate", ikon: Briefcase },
    { ad: "Görevler", yol: "/earn/gorevler", ikon: Target },
    { ad: "Marketplace", yol: "/earn/marketplace", ikon: ShoppingBag },
    { ad: "Yarışmalar", yol: "/earn/yarismalar", ikon: Trophy },
  ] },
  { grup: "Hesap", ogeler: [
    { ad: "Başvurular & Takip", yol: "/earn/basvurular", ikon: ClipboardList },
    { ad: "Cüzdan & Çekim", yol: "/earn/cuzdan", ikon: Wallet },
    { ad: "Hesap Bağlama", yol: "/earn/hesaplar", ikon: Link2 },
  ] },
  { grup: "Yardım", ogeler: [
    { ad: "Bilgilendirmeler", yol: "/earn/bilgi", ikon: Info },
    { ad: "Destek", yol: "/earn/destek", ikon: LifeBuoy },
  ] },
];

export function EarnSidebar() {
  const path = usePathname();
  const [mobil, setMobil] = useState(false);
  const hareketler = useEarn((s) => s.hareketler);
  const cekimler = useEarn((s) => s.cekimler);
  const xp = useEarn((s) => s.xp);
  const bak = bakiye(hareketler, cekimler);
  const tier = tierBul(xp);
  const aktif = (yol: string) => (yol === "/earn" ? path === "/earn" : path.startsWith(yol));

  const icerik = (
    <div className="flex h-full flex-col p-3">
      {/* logo */}
      <Link href="/earn" onClick={() => setMobil(false)} className="mb-4 flex items-center gap-2 px-2 py-1">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-400 text-[16px] font-black text-[#04141a]">V</span>
        <span className="text-[18px] font-bold text-white">Earn</span>
      </Link>

      {/* bakiye kartı */}
      <Link href="/earn/cuzdan" onClick={() => setMobil(false)} className="mb-4 block rounded-2xl border border-white/[0.06] bg-[#141517] p-4 transition-colors hover:border-sky-400/25">
        <div className="flex items-center gap-2.5">
          <GlassIkon boyut={38} aktif><Wallet className="h-4.5 w-4.5" /></GlassIkon>
          <div>
            <div className="text-[11px] text-white/50">Kazancın</div>
            <div className="text-[19px] font-bold text-white leading-tight">{tl(bak)}</div>
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 border-t border-white/[0.06] pt-2.5 text-[11px] text-white/50">
          <Award className="h-3.5 w-3.5 text-sky-400" /> {tier.ad} seviyesi
        </div>
      </Link>

      <nav className="flex-1 space-y-4 overflow-y-auto [scrollbar-width:thin]">
        {NAV.map((g, i) => (
          <div key={i}>
            {g.grup && <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">{g.grup}</p>}
            <div className="space-y-0.5">
              {g.ogeler.map((o) => (
                <Link key={o.yol} href={o.yol} onClick={() => setMobil(false)}
                  className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    aktif(o.yol) ? "bg-sky-400 text-[#04141a]" : "text-white/60 hover:bg-white/[0.06] hover:text-white")}>
                  <o.ikon className="h-4.5 w-4.5 shrink-0" />
                  <span className="truncate">{o.ad}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <Link href="/panel" onClick={() => setMobil(false)} className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Vayra'ya dön
      </Link>
    </div>
  );

  return (
    <>
      {/* mobil hamburger */}
      <button onClick={() => setMobil(true)} className="fixed left-3 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#0c0d0f] text-white md:hidden">
        <Menu className="h-5 w-5" />
      </button>

      {/* desktop */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[260px] border-r border-white/[0.06] bg-[#0e0f11] md:block">{icerik}</aside>

      {/* mobil drawer */}
      {mobil && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobil(false)} />
          <aside className="fixed left-0 top-0 z-50 h-screen w-[280px] border-r border-white/[0.06] bg-[#0e0f11] md:hidden">
            <button onClick={() => setMobil(false)} className="absolute right-3 top-3 text-white/60"><X className="h-5 w-5" /></button>
            {icerik}
          </aside>
        </>
      )}
    </>
  );
}
