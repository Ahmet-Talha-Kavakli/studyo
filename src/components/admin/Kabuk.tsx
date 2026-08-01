"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Menu, X, ShieldCheck, Bell } from "lucide-react";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { useAdminOturum } from "@/store/admin/useAdminOturum";
import { NAV } from "@/lib/admin/nav";
import { yetkiVar, ROL_ADI } from "@/lib/admin/guvenlik/roller";
import { cn } from "@/lib/utils";
import { AdminGiris } from "./Giris";
import { AiDock } from "./ai/AiDock";
import { SPRING } from "@/lib/admin/animasyon";

/* Admin kabuğu — sol sidebar (rol-filtreli nav) + üst bar + idle-guard + içerik.
   Giriş yoksa AdminGiris gösterir. */

function Sidebar({ kapat }: { kapat?: () => void }) {
  const path = usePathname();
  const rol = useAdminOturum((s) => s.aktifRol);
  const aktifMi = (yol: string) => (yol === "/admin" ? path === "/admin" : path.startsWith(yol));

  return (
    <div className="flex h-full w-64 flex-col border-r border-[color:var(--ad-kenar)] bg-[color:var(--ad-yuzey)]">
      <Link href="/admin" onClick={kapat} className="flex items-center gap-2.5 px-5 py-5">
        <VayraIsaret size={30} />
        <div>
          <div className="text-[15px] font-bold text-[color:var(--ad-metin)]">Vayra</div>
          <div className="text-[10px] uppercase tracking-wider text-[color:var(--ad-metin-3)]">Yönetim</div>
        </div>
      </Link>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6 ad-ince-scroll">
        {NAV.map((grup) => {
          const ogeler = grup.ogeler.filter((o) => rol && yetkiVar(rol, o.modul));
          if (!ogeler.length) return null;
          return (
            <div key={grup.grup}>
              <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ad-metin-3)]">{grup.grup}</p>
              <div className="space-y-0.5">
                {ogeler.map((o) => {
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
          );
        })}
      </nav>
    </div>
  );
}

function UstBar() {
  const s = useAdminOturum();
  const hesap = s.hesaplar.find((h) => h.kullaniciAdi === s.aktifAdmin);
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[color:var(--ad-kenar)] bg-[color:var(--ad-yuzey)]/80 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-2 text-[13px] text-[color:var(--ad-metin-3)]">
        <ShieldCheck className="h-4 w-4 text-emerald-400" />
        <span className="hidden sm:inline">Güvenli oturum</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[color:var(--ad-metin-2)] transition-colors hover:bg-white/[0.05] hover:text-[color:var(--ad-metin)]">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-400" />
        </button>
        <div className="flex items-center gap-2.5 rounded-xl border border-[color:var(--ad-kenar)] px-2.5 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#7de0ff] to-[#1ea8d6] text-xs font-bold text-[#04222c]">
            {hesap?.ad.split(" ").map((x) => x[0]).join("").slice(0, 2)}
          </div>
          <div className="hidden sm:block">
            <div className="text-[13px] font-semibold text-[color:var(--ad-metin)]">{hesap?.ad}</div>
            <div className="text-[10px] text-[color:var(--ad-metin-3)]">{s.aktifRol && ROL_ADI[s.aktifRol]}</div>
          </div>
          <button onClick={() => s.cikis()} className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg text-[color:var(--ad-metin-3)] transition-colors hover:bg-rose-500/10 hover:text-rose-400" title="Çıkış">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

export function AdminKabuk({ children }: { children: ReactNode }) {
  const girisli = useAdminOturum((s) => s.girisli);
  const idleKontrol = useAdminOturum((s) => s.idleKontrol);
  const aktiviteYenile = useAdminOturum((s) => s.aktiviteYenile);
  const [mobilAcik, setMobilAcik] = useState(false);
  const [hazir, setHazir] = useState(false);

  useEffect(() => setHazir(true), []);

  // Idle-timeout: her 30sn'de kontrol + kullanıcı hareketiyle yenile
  useEffect(() => {
    if (!girisli) return;
    const t = setInterval(() => idleKontrol(), 30000);
    const yenile = () => aktiviteYenile();
    window.addEventListener("mousemove", yenile);
    window.addEventListener("keydown", yenile);
    window.addEventListener("click", yenile);
    return () => {
      clearInterval(t);
      window.removeEventListener("mousemove", yenile);
      window.removeEventListener("keydown", yenile);
      window.removeEventListener("click", yenile);
    };
  }, [girisli, idleKontrol, aktiviteYenile]);

  if (!hazir) {
    return <div className="flex min-h-screen items-center justify-center bg-[color:var(--ad-zemin)]">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-[color:var(--ad-aksan)]" />
    </div>;
  }

  if (!girisli) return <AdminGiris />;

  return (
    <div className="min-h-screen bg-[color:var(--ad-zemin)] text-[color:var(--ad-metin)]">
      {/* Masaüstü sidebar */}
      <div className="fixed inset-y-0 left-0 z-40 hidden md:block">
        <Sidebar />
      </div>

      {/* Mobil sidebar */}
      <AnimatePresence>
        {mobilAcik && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobilAcik(false)} className="fixed inset-0 z-40 bg-black/60 md:hidden" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={SPRING}
              className="fixed inset-y-0 left-0 z-50 md:hidden">
              <Sidebar kapat={() => setMobilAcik(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="md:pl-64">
        <UstBar />
        {/* Mobil menü butonu */}
        <button onClick={() => setMobilAcik(true)} className="fixed left-4 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--ad-kenar)] bg-[color:var(--ad-yuzey)] text-[color:var(--ad-metin)] md:hidden">
          {mobilAcik ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <main className="min-h-[calc(100vh-3.5rem)] p-4 md:p-6">{children}</main>
      </div>

      {/* Her sayfada gömülü AI asistan dock'u */}
      <AiDock />
    </div>
  );
}
