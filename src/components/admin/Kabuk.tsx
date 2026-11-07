"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Menu, X, ShieldCheck, ShieldAlert, ArrowUpRight } from "lucide-react";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { NAV } from "@/lib/admin/nav";
import { useAdminVeri } from "@/lib/admin/istemci";
import { cn } from "@/lib/utils";
import { AiDock } from "./ai/AiDock";
import { SPRING } from "@/lib/admin/animasyon";

/* Yönetim kabuğu: sol menü + üst çubuk + içerik. Kimlik gerçek oturumdan gelir (/api/admin/ben);
   sayfa ara katmanda (middleware) ve her veri ucu sunucuda yönetici rolüyle korunur. */

interface Ben { uid: string; email: string; ad: string; avatar: string | null; ikiAdim: boolean }

function Sidebar({ kapat }: { kapat?: () => void }) {
  const path = usePathname();
  const aktifMi = (yol: string) => (yol === "/admin" ? path === "/admin" : path.startsWith(yol));
  return (
    <div className="flex h-full w-64 flex-col border-r border-[color:var(--ad-kenar)] bg-[color:var(--ad-yuzey)]">
      <Link href="/admin" onClick={kapat} className="flex items-center gap-2.5 px-5 py-5">
        <VayraIsaret size={30} />
        <div>
          <div className="text-[15px] font-bold text-[color:var(--ad-metin)]">Vayra</div>
          <div className="text-[11px] text-[color:var(--ad-metin-3)]">Yönetim</div>
        </div>
      </Link>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6 ad-ince-scroll">
        {NAV.map((grup) => (
          <div key={grup.grup}>
            <p className="mb-1.5 px-2.5 text-[11px] font-semibold text-[color:var(--ad-metin-3)]">{grup.grup}</p>
            <div className="space-y-0.5">
              {grup.ogeler.map((o) => {
                const aktif = aktifMi(o.yol);
                return (
                  <Link key={o.yol} href={o.yol} onClick={kapat}
                    className={cn("relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                      aktif ? "text-[color:var(--ad-metin)]" : "text-[color:var(--ad-metin-2)] hover:text-[color:var(--ad-metin)]")}>
                    {aktif && <motion.span layoutId="adNavAktif" className="absolute inset-0 rounded-lg bg-[color:var(--ad-aksan)]/[0.1] ring-1 ring-inset ring-[color:var(--ad-aksan)]/25" transition={SPRING} />}
                    <o.ikon className={cn("relative h-4.5 w-4.5 shrink-0", aktif && "text-[color:var(--ad-aksan)]")} />
                    <span className="relative">{o.ad}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        <Link href="/panel" onClick={kapat} className="flex items-center justify-between rounded-lg border border-[color:var(--ad-kenar)] px-3 py-2 text-[13px] text-[color:var(--ad-metin-2)] transition-colors hover:text-[color:var(--ad-metin)]">
          Panele dön <ArrowUpRight className="h-4 w-4" />
        </Link>
      </nav>
    </div>
  );
}

function UstBar({ ben, menuAc }: { ben: Ben | null; menuAc: () => void }) {
  const [cikiyor, setCikiyor] = useState(false);
  const cikis = async () => {
    setCikiyor(true);
    await fetch("/api/hesap/cikis", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => {});
    window.location.href = "/";
  };
  const bas = (ben?.ad || ben?.email || "").split(/[\s@.]/).filter(Boolean).map((x) => x[0]).join("").slice(0, 2).toLocaleUpperCase("tr");
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-[color:var(--ad-kenar)] bg-[color:var(--ad-yuzey)]/85 px-4 backdrop-blur-xl md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button onClick={menuAc} aria-label="Menüyü aç" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[color:var(--ad-kenar)] text-[color:var(--ad-metin)] md:hidden">
          <Menu className="h-5 w-5" />
        </button>
        {ben && (ben.ikiAdim
          ? <span className="flex items-center gap-1.5 text-[13px] text-[color:var(--ad-metin-3)]"><ShieldCheck className="h-4 w-4 text-emerald-400" /><span className="hidden sm:inline">İki adımlı doğrulama açık</span></span>
          : <Link href="/panel/ayarlar/guvenlik" className="flex items-center gap-1.5 truncate text-[13px] text-amber-300"><ShieldAlert className="h-4 w-4 shrink-0" /><span className="truncate">İki adımlı doğrulamayı aç</span></Link>)}
      </div>
      <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-[color:var(--ad-kenar)] px-2.5 py-1.5">
        {ben?.avatar
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={ben.avatar} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
          : <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7de0ff] to-[#1ea8d6] text-xs font-bold text-[#04222c]">{bas || "V"}</div>}
        <div className="hidden min-w-0 sm:block">
          <div className="truncate text-[13px] font-semibold text-[color:var(--ad-metin)]">{ben?.ad || ben?.email || "Yönetici"}</div>
          <div className="truncate text-[11px] text-[color:var(--ad-metin-3)]">{ben?.email ?? ""}</div>
        </div>
        <button onClick={cikis} disabled={cikiyor} className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[color:var(--ad-metin-3)] transition-colors hover:bg-rose-500/10 hover:text-rose-400" title="Çıkış yap" aria-label="Çıkış yap">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

export function AdminKabuk({ children }: { children: ReactNode }) {
  const [mobilAcik, setMobilAcik] = useState(false);
  const { veri } = useAdminVeri<Ben>("/api/admin/ben");
  return (
    <div className="min-h-screen bg-[color:var(--ad-zemin)] text-[color:var(--ad-metin)]">
      <div className="fixed inset-y-0 left-0 z-40 hidden md:block"><Sidebar /></div>
      <AnimatePresence>
        {mobilAcik && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobilAcik(false)} className="fixed inset-0 z-40 bg-black/60 md:hidden" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={SPRING} className="fixed inset-y-0 left-0 z-50 md:hidden">
              <button onClick={() => setMobilAcik(false)} aria-label="Menüyü kapat" className="absolute right-3 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--ad-metin-2)]"><X className="h-5 w-5" /></button>
              <Sidebar kapat={() => setMobilAcik(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <div className="md:pl-64">
        <UstBar ben={veri} menuAc={() => setMobilAcik(true)} />
        <main className="min-h-[calc(100vh-3.5rem)] p-4 md:p-6">{children}</main>
      </div>
      <AiDock />
    </div>
  );
}
