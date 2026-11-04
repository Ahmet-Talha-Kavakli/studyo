"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bot, Brain, Zap, Plug, ShieldCheck, SlidersHorizontal, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ============================================================
   SUPERCOMPUTER AYARLAR — Claude Settings kabuğu.

   Claude'da Çalışanlar / Hafıza / Beceriler / Bağlayıcılar sidebar'da ayrı
   ürünler DEĞİL; hepsi Ayarlar'ın sekmeleridir. Higgsfield'ın "Özelleştir"
   grubu bu yüzden söküldü ve buraya taşındı.

   Düzen: solda dikey sekme listesi (Claude'un ayar gezinmesi), sağda içerik.
   Genişlik sınırlı ve okunur — Claude'un ayar ekranları geniş kart ızgarası
   değil, sakin tek sütun listelerdir.
   ============================================================ */

const SEKMELER: { ad: string; href: string; ikon: LucideIcon; ozet: string }[] = [
  { ad: "Genel", href: "/panel/supercomputer/ayarlar", ikon: SlidersHorizontal, ozet: "Talimatlar, görünüm, yetenekler" },
  { ad: "Bellek", href: "/panel/supercomputer/ayarlar/hafiza", ikon: Brain, ozet: "Kalıcı bağlam" },
  { ad: "Çalışanlar", href: "/panel/supercomputer/ayarlar/calisanlar", ikon: Bot, ozet: "Özel asistanlar" },
  { ad: "Beceriler", href: "/panel/supercomputer/ayarlar/beceriler", ikon: Zap, ozet: "Yetenek paketleri" },
  { ad: "Bağlayıcılar", href: "/panel/supercomputer/ayarlar/baglayicilar", ikon: Plug, ozet: "Dış uygulamalar" },
  { ad: "Veri ve gizlilik", href: "/panel/supercomputer/ayarlar/veri", ikon: ShieldCheck, ozet: "Paylaşım, arşiv, dışa aktarma" },
  { ad: "Kullanım", href: "/panel/supercomputer/ayarlar/kullanim", ikon: BarChart3, ozet: "Kredi ve etkinlik" },
];

export default function AyarlarLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  // "Genel" yalnızca TAM eşleşmede aktif olur; alt sekmelerde de yanmasın.
  const aktif = (h: string) =>
    h === "/panel/supercomputer/ayarlar" ? path === h : path === h || path.startsWith(h + "/");

  const secili = SEKMELER.find((x) => aktif(x.href)) ?? SEKMELER[0];
  return (
    <div className="sc-kapsam min-h-full bg-[var(--sc-zemin)] text-[var(--sc-metin)]">
      <div className="mx-auto max-w-[1240px] px-6 py-8 max-md:pt-16 max-sm:px-4 md:pl-10 xl:pl-14">
        {/* items-start ŞART: yoksa yapışkan menü sütun boyunca uzar ve yapışmaz. */}
        <div className="flex flex-col gap-5 md:flex-row md:items-start">
          {/* Ayarlar menüsü: başlık şeridi + simgeli satırlar, tek kartta (havada yazı yok). */}
          <nav aria-label="Ayarlar" className="shrink-0 overflow-hidden rounded-[22px] bg-[var(--sc-kart)] ring-1 ring-inset ring-white/[0.07] md:sticky md:top-6 md:w-[272px]">
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-[var(--sc-metin)]"><SlidersHorizontal className="h-[18px] w-[18px]" /></span>
              <span className="min-w-0"><span className="block text-[16px] font-semibold tracking-[-0.01em]">Ayarlar</span><span className="block truncate text-[12.5px] text-[var(--sc-metin-3)]">Usta nasıl çalışsın</span></span>
            </div>
            <ul className="gizli-scroll flex gap-1 overflow-x-auto p-2 md:flex-col md:overflow-visible">
              {SEKMELER.map((s) => {
                const bu = aktif(s.href);
                return (
                  <li key={s.href} className="shrink-0 md:shrink">
                    <Link href={s.href} aria-current={bu ? "page" : undefined}
                      className={cn("relative flex items-center gap-3 rounded-[14px] px-2.5 py-2 transition-colors active:scale-[0.99]",
                        bu ? "text-[var(--sc-metin)]" : "text-[var(--sc-metin-2)] hover:bg-white/[0.055] hover:text-[var(--sc-metin)]")}>
                      {bu && <motion.span layoutId="sc-ayar-zemin" transition={{ type: "spring", stiffness: 480, damping: 38 }} className="absolute inset-0 rounded-[14px] bg-white/[0.085] ring-1 ring-inset ring-white/[0.08]" />}
                      <span className={cn("relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full", bu ? "bg-white text-[#0b0b0c]" : "bg-white/[0.065] text-[var(--sc-metin-2)]")}><s.ikon className="h-4 w-4" strokeWidth={1.9} /></span>
                      <span className="relative min-w-0">
                        <span className={cn("block whitespace-nowrap text-[13.5px]", bu && "font-semibold")}>{s.ad}</span>
                        <span className="hidden truncate text-[11.5px] text-[var(--sc-metin-3)] md:block">{s.ozet}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="min-w-0 flex-1">
            <div className="mb-4 flex items-center gap-3 rounded-[22px] bg-[var(--sc-kart)] px-4 py-3.5 ring-1 ring-inset ring-white/[0.07] sm:px-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.085]"><secili.ikon className="h-[18px] w-[18px]" /></span>
              <span className="min-w-0"><span className="block text-[18px] font-semibold tracking-[-0.02em]">{secili.ad}</span><span className="block truncate text-[12.5px] text-[var(--sc-metin-3)]">{secili.ozet}</span></span>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
