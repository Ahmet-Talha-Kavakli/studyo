"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Brain, Zap, Plug, SlidersHorizontal, type LucideIcon } from "lucide-react";
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
  { ad: "Genel", href: "/panel/supercomputer/ayarlar", ikon: SlidersHorizontal, ozet: "Model ve davranış" },
  { ad: "AI Çalışanlar", href: "/panel/supercomputer/ayarlar/calisanlar", ikon: Bot, ozet: "Özel görev ajanları" },
  { ad: "Hafıza", href: "/panel/supercomputer/ayarlar/hafiza", ikon: Brain, ozet: "Kalıcı bağlam" },
  { ad: "Beceriler", href: "/panel/supercomputer/ayarlar/beceriler", ikon: Zap, ozet: "Yetenek paketleri" },
  { ad: "Bağlayıcılar", href: "/panel/supercomputer/ayarlar/baglayicilar", ikon: Plug, ozet: "Dış uygulamalar" },
];

export default function AyarlarLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  // "Genel" yalnızca TAM eşleşmede aktif olur; alt sekmelerde de yanmasın.
  const aktif = (h: string) =>
    h === "/panel/supercomputer/ayarlar" ? path === h : path === h || path.startsWith(h + "/");

  return (
    <div className="sc-kapsam min-h-full bg-[var(--sc-zemin)] text-[var(--sc-metin)]">
      <div className="mx-auto max-w-[1080px] px-6 py-10">
        <header className="mb-8">
          <h1 className="text-[26px] font-normal tracking-[-0.02em]">Ayarlar</h1>
          <p className="mt-1 text-[14px] text-[var(--sc-metin-3)]">
            Supercomputer&apos;ın nasıl çalıştığını, neyi hatırladığını ve neye erişebileceğini yönet.
          </p>
        </header>

        {/* items-start ŞART: flex varsayılanı `stretch` olduğu için nav tüm
            sütun yüksekliğine uzuyor ve sticky etkisiz kalıyordu. */}
        <div className="flex flex-col gap-8 md:flex-row md:items-start">
          {/* Sekme listesi — Claude'un ayar gezinmesi (dikey, sade).
              md+ ekranlarda YAPIŞKAN: uzun listelerde aşağı inince sekmeler
              görünmez oluyordu, artık üstte sabit kalır. */}
          <nav className="shrink-0 md:sticky md:top-6 md:h-fit md:w-[236px]">
            <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
              {SEKMELER.map((s) => {
                const bu = aktif(s.href);
                return (
                  <li key={s.href} className="shrink-0 md:shrink">
                    <Link href={s.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[14px] transition-colors",
                        bu
                          ? "bg-[var(--sc-yukselti)] font-medium text-[var(--sc-metin)]"
                          : "text-[var(--sc-metin-2)] hover:bg-[var(--sc-cip)] hover:text-[var(--sc-metin)]",
                      )}>
                      <s.ikon className={cn("h-[17px] w-[17px] shrink-0", bu ? "text-[var(--sc-aksan)]" : "text-[var(--sc-metin-3)]")}
                        strokeWidth={1.8} />
                      <span className="whitespace-nowrap md:whitespace-normal">{s.ad}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
