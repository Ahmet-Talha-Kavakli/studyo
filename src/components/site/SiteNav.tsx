"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const urunler = [
  { ad: "Sinema Stüdyosu", href: "/urunler/sinema", ozet: "AI Yönetmen & kamera kontrolü" },
  { ad: "Pazarlama Stüdyosu", href: "/urunler/pazarlama", ozet: "URL'den yayına hazır reklam" },
  { ad: "3D Stüdyo", href: "/urunler/3d", ozet: "Meshy ile metin/görsel → 3D", fark: true },
  { ad: "Ses Stüdyosu", href: "/urunler/ses", ozet: "Seslendirme, klon, müzik", fark: true },
  { ad: "Akış — Görsel Workflow", href: "/urunler/akis", ozet: "Düğüm tabanlı akış editörü", fark: true },
  { ad: "Kimlik — Ruh ID", href: "/urunler/kimlik", ozet: "Karakter tutarlılığı" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobil, setMobil] = useState(false);
  const [urunAcik, setUrunAcik] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "py-2.5" : "py-4",
      )}
    >
      <div className="mx-auto max-w-7xl px-4">
        <nav
          className={cn(
            "flex items-center justify-between rounded-2xl px-4 transition-all duration-300",
            scrolled ? "glass-strong h-14 shadow-lg shadow-black/30" : "h-16",
          )}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 pl-1">
            <VayraIsaret size={32} />
            <span className="text-lg font-bold tracking-tight">Vayra</span>
          </Link>

          {/* Orta menü */}
          <div className="hidden items-center gap-1 md:flex">
            <div
              className="relative"
              onMouseEnter={() => setUrunAcik(true)}
              onMouseLeave={() => setUrunAcik(false)}
            >
              <button className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:text-white">
                Ürünler
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", urunAcik && "rotate-180")} />
              </button>
              <AnimatePresence>
                {urunAcik && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="menu-surface absolute left-1/2 top-full w-80 -translate-x-1/2 rounded-2xl p-2 shadow-2xl shadow-black/50"
                  >
                    {urunler.map((u) => (
                      <Link
                        key={u.href}
                        href={u.href}
                        className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-white/8"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            {u.ad}
                            {u.fark && (
                              <span className="rounded-[5px] bg-cyan-glow px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ink-950">
                                YENİ
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-white/50">{u.ozet}</div>
                        </div>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {[
              { ad: "Modeller", href: "/modeller" },
              { ad: "Uygulamalar", href: "/uygulamalar" },
              { ad: "Entegrasyonlar", href: "/entegrasyonlar" },
              { ad: "Keşfet", href: "/kesfet" },
              { ad: "Fiyatlandırma", href: "/fiyatlandirma" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:text-white"
              >
                {l.ad}
              </Link>
            ))}
          </div>

          {/* Sağ aksiyonlar */}
          <div className="hidden items-center gap-2 md:flex">
            <Link href="/giris">
              <Button variant="ghost" size="sm">Giriş yap</Button>
            </Link>
            <Link href="/kayit">
              <Button variant="primary" size="sm">Ücretsiz başla</Button>
            </Link>
          </div>

          {/* Mobil */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white/80 md:hidden"
            onClick={() => setMobil((v) => !v)}
            aria-label="Menü"
          >
            {mobil ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {/* Mobil menü */}
        <AnimatePresence>
          {mobil && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="menu-surface mt-2 overflow-hidden rounded-2xl md:hidden"
            >
              <div className="flex flex-col gap-1 p-3">
                {urunler.map((u) => (
                  <Link key={u.href} href={u.href} onClick={() => setMobil(false)}
                    className="rounded-lg px-3 py-2.5 text-sm hover:bg-white/8">{u.ad}</Link>
                ))}
                <div className="my-1 h-px bg-white/10" />
                {["Modeller|/modeller", "Uygulamalar|/uygulamalar", "Keşfet|/kesfet", "Fiyatlandırma|/fiyatlandirma"].map((x) => {
                  const [ad, href] = x.split("|");
                  return (
                    <Link key={href} href={href} onClick={() => setMobil(false)}
                      className="rounded-lg px-3 py-2.5 text-sm hover:bg-white/8">{ad}</Link>
                  );
                })}
                <div className="mt-2 flex gap-2">
                  <Link href="/giris" className="flex-1"><Button variant="glass" size="sm" className="w-full">Giriş</Button></Link>
                  <Link href="/kayit" className="flex-1"><Button variant="primary" size="sm" className="w-full">Başla</Button></Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
