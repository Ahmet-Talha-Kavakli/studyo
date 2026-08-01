"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowLeft } from "lucide-react";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { cn } from "@/lib/utils";

/* Beyaz kurumsal navigasyon — sticky, scroll'da cam + gölge.
   SADECE resmî/şirket sayfaları (düz linkler). Ürün/pazarlama menüleri YOK.
   Sağda "Uygulamaya dön" + Giriş. */

/* SADECE resmî/şirket sayfaları — ürün/pazarlama menüleri yok.
   Kurumsal alan = şirket işleri. Düz linkler (mega-menü yok). */
const LINKLER: { ad: string; href: string }[] = [
  { ad: "Hakkımızda", href: "/hakkinda" },
  { ad: "Kariyer", href: "/kariyer" },
  { ad: "Blog", href: "/blog" },
  { ad: "Basın", href: "/basin" },
  { ad: "Güvenlik", href: "/guvenlik" },
  { ad: "İş Ortaklığı", href: "/partner" },
  { ad: "İletişim", href: "/iletisim" },
];

export function KurumsalNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobil, setMobil] = useState(false);
  const path = usePathname();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const aktifMi = (href: string) => path === href || path.startsWith(href + "/");

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-all", scrolled ? "kr-nav-cam" : "bg-transparent")}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href={"/kurumsal" as never} className="flex items-center gap-2">
          <VayraIsaret size={30} />
          <span className="text-lg font-bold tracking-tight text-[color:var(--color-metin)]">Vayra</span>
        </Link>

        {/* Orta menü — sade resmî linkler (mega-menü yok) */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {LINKLER.map((l) => (
            <Link key={l.href} href={l.href as never}
              className={cn("rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                aktifMi(l.href) ? "text-[color:var(--color-metin)]" : "text-[color:var(--color-metin-2)] hover:text-[color:var(--color-metin)]")}>
              {l.ad}
            </Link>
          ))}
        </nav>

        {/* Sağ aksiyon — sadece "Uygulamaya dön" (giriş butonu yok) */}
        <div className="hidden items-center md:flex">
          <Link href="/panel" className="kr-cta flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold">
            <ArrowLeft className="h-4 w-4" /> Uygulamaya dön
          </Link>
        </div>

        {/* Mobil */}
        <button onClick={() => setMobil((v) => !v)} aria-label="Menü" className="flex h-10 w-10 items-center justify-center rounded-xl text-[color:var(--color-metin)] md:hidden">
          {mobil ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobil çekmece */}
      <AnimatePresence>
        {mobil && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-[color:var(--color-kenar)] bg-white md:hidden">
            <div className="space-y-1 px-4 py-4">
              {LINKLER.map((l) => (
                <Link key={l.href} href={l.href as never} onClick={() => setMobil(false)}
                  className={cn("block rounded-lg px-3 py-2.5 text-sm font-medium",
                    aktifMi(l.href) ? "bg-[color:var(--color-yuzey-2)] text-[color:var(--color-metin)]" : "text-[color:var(--color-metin)] hover:bg-[color:var(--color-yuzey-2)]")}>
                  {l.ad}
                </Link>
              ))}
              <div className="border-t border-[color:var(--color-kenar)] pt-3">
                <Link href="/panel" onClick={() => setMobil(false)} className="kr-cta flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold">
                  <ArrowLeft className="h-4 w-4" /> Uygulamaya dön
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
