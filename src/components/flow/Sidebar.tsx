"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Search, Clapperboard, Heart, PlusSquare, Menu, User, Settings, Bookmark,
  BarChart3, BadgeCheck, LogOut, Flag, X,
} from "lucide-react";
import { IG_GRADIENT, cn, Avatar } from "./UI";
import { useAuth } from "@/store/useAuth";
import { BildirimPanel } from "./BildirimPanel";

/** Flow sol sidebar — Instagram birebir (DM YOK).
 * - Normalde DAR (sadece ikon). Mouse üstüne gelince GENİŞLER (ikon + yazı).
 * - Dar modda ikonların yanında hover tooltip açıklaması çıkar.
 * - Bildirimler/Ara panel açarken sidebar dar-kilitli kalır (Instagram).
 * Mobilde alt bara döner. */

const NAV = [
  { ad: "Ana Sayfa", yol: "/flow", ikon: Home },
  { ad: "Ara", yol: "/flow/ara", ikon: Search },
  { ad: "Reels", yol: "/flow/reels", ikon: Clapperboard },
  { ad: "Bildirimler", yol: "/flow/bildirimler", ikon: Heart, panel: true },
  { ad: "Oluştur", yol: "/flow/olustur", ikon: PlusSquare },
  { ad: "Profil", yol: "/flow/profil", ikon: User },
];

export function FlowSidebar() {
  const pathname = usePathname();
  const { kullanici } = useAuth();
  const [dahaAcik, setDahaAcik] = useState(false);
  const [bildirimAcik, setBildirimAcik] = useState(false);
  const [hover, setHover] = useState(false);
  const aktifMi = (yol: string) => (yol === "/flow" ? pathname === "/flow" : pathname.startsWith(yol));
  // panel açıkken sidebar dar kilitli; onun dışında hover ile genişler
  const genis = hover && !bildirimAcik;

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => { setHover(false); setDahaAcik(false); }}
        className={cn("fixed left-0 top-0 z-50 hidden h-screen flex-col border-r border-white/[0.08] bg-[#12171c] px-3 py-6 transition-[width] duration-300 ease-out md:flex",
          genis ? "w-[245px]" : "w-[72px]")}>
        <Link href="/flow" className="mb-8 flex h-8 items-center px-2">
          {genis
            ? <span className="text-[24px] font-bold" style={{ background: IG_GRADIENT, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>Flow</span>
            : <span className="flex h-7 w-7 items-center justify-center rounded-lg text-[15px] font-bold text-white" style={{ background: IG_GRADIENT }}>F</span>}
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((n) => {
            const aktif = n.panel ? bildirimAcik : (aktifMi(n.yol) && !bildirimAcik);
            const ortak = cn("group/nav relative flex items-center gap-4 rounded-xl px-3 py-3 transition-colors", aktif ? "bg-white/[0.08] hover:bg-white/[0.12]" : "hover:bg-white/[0.1]");
            const icerik = (
              <>
                <n.ikon className={cn("h-6 w-6 shrink-0 transition-transform group-hover/nav:scale-105", aktif && "fill-white/20")} strokeWidth={aktif ? 2.5 : 2} />
                <span className={cn("whitespace-nowrap text-[16px] transition-all duration-200", genis ? "opacity-100" : "w-0 overflow-hidden opacity-0", aktif ? "font-bold" : "font-normal")}>{n.ad}</span>
                {/* dar modda hover tooltip */}
                {!genis && <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-[#262626] px-2.5 py-1.5 text-[13px] font-medium opacity-0 shadow-lg transition-opacity group-hover/nav:opacity-100">{n.ad}</span>}
              </>
            );
            if (n.panel) return <button key={n.ad} onClick={() => setBildirimAcik((v) => !v)} className={cn(ortak, "w-full text-left")}>{icerik}</button>;
            return <Link key={n.ad} href={n.yol} onClick={() => setBildirimAcik(false)} className={ortak}>{icerik}</Link>;
          })}
        </nav>

        <div className="relative">
          <button onClick={() => setDahaAcik((v) => !v)} className="group/nav relative flex w-full items-center gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-white/[0.1]">
            <Menu className="h-6 w-6 shrink-0" />
            <span className={cn("whitespace-nowrap text-[16px] transition-all duration-200", genis ? "opacity-100" : "w-0 overflow-hidden opacity-0")}>Daha fazla</span>
            {!genis && <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-[#262626] px-2.5 py-1.5 text-[13px] font-medium opacity-0 shadow-lg transition-opacity group-hover/nav:opacity-100">Daha fazla</span>}
          </button>
          {dahaAcik && (
            <div className="absolute bottom-14 left-0 w-60 overflow-hidden rounded-xl border border-white/10 bg-[#262626] py-1.5 shadow-2xl">
              {[
                { ad: "Ayarlar", ikon: Settings, yol: "/flow/ayarlar" },
                { ad: "Kaydedilenler", ikon: Bookmark, yol: "/flow/profil?sekme=kayitli" },
                { ad: "İstatistikler", ikon: BarChart3, yol: "/flow/profil?sekme=istatistik" },
                { ad: "Doğrulama (Mavi tik)", ikon: BadgeCheck, yol: "/flow/dogrulama" },
                { ad: "Bildir", ikon: Flag, yol: "/flow/ayarlar" },
              ].map((m) => (
                <Link key={m.ad} href={m.yol} onClick={() => setDahaAcik(false)} className="flex items-center gap-3 px-4 py-2.5 text-[14px] transition-colors hover:bg-white/[0.1]">
                  <m.ikon className="h-4.5 w-4.5" /> {m.ad}
                </Link>
              ))}
              <div className="my-1 border-t border-white/[0.08]" />
              <Link href="/panel" className="flex items-center gap-3 px-4 py-2.5 text-[14px] transition-colors hover:bg-white/[0.1]"><LogOut className="h-4.5 w-4.5" /> Vayra'ya dön</Link>
            </div>
          )}
        </div>
      </aside>

      {/* ── BİLDİRİM PANELİ (sidebar yanından açılır) ── */}
      {bildirimAcik && (
        <>
          <div className="fixed inset-0 z-30 hidden bg-black/20 md:block" onClick={() => setBildirimAcik(false)} />
          <div className="fixed left-[72px] top-0 z-40 hidden h-screen w-[400px] animate-[panelGir_0.3s_cubic-bezier(0.16,1,0.3,1)] overflow-hidden rounded-r-2xl border-r border-white/[0.08] bg-[#12171c] shadow-2xl md:block">
            <button onClick={() => setBildirimAcik(false)} className="absolute right-3 top-6 z-10 flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/[0.1] hover:text-white"><X className="h-6 w-6" /></button>
            <BildirimPanel onKapat={() => setBildirimAcik(false)} />
          </div>
          <style jsx global>{`@keyframes panelGir { from { transform: translateX(-24px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }`}</style>
        </>
      )}

      {/* ── MOBİL ALT BAR ── */}
      <nav className="fixed bottom-0 left-0 z-40 flex w-full items-center justify-around border-t border-white/[0.08] bg-[#12171c] py-2.5 md:hidden">
        {[NAV[0], NAV[1], NAV[2], NAV[4], NAV[3], NAV[5]].map((n) => {
          const aktif = aktifMi(n.yol);
          if (n.ad === "Profil") return (
            <Link key={n.ad} href={n.yol}><Avatar tohum={kullanici?.email ?? "ben"} ad={kullanici?.ad} boyut={26} story izlendi={!aktif} /></Link>
          );
          if (n.panel) return <Link key={n.ad} href="/flow/bildirimler"><n.ikon className={cn("h-6 w-6", aktif && "fill-white/15")} strokeWidth={aktif ? 2.6 : 2} /></Link>;
          return <Link key={n.ad} href={n.yol}><n.ikon className={cn("h-6 w-6", aktif && "fill-white/15")} strokeWidth={aktif ? 2.6 : 2} /></Link>;
        })}
      </nav>
    </>
  );
}
