"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wand2, FolderOpen, CircleUser, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Mobil alt sekme çubuğu — Higgsfield mobil web BİREBİR.
 *
 * Referans ölçüleri (628×775 CSS viewport, 2x retina'dan bölünmüş):
 *   • Çubuk y 716→775 → yükseklik 59-60px + iOS home-indicator güvenli alanı
 *   • 5 eşit slot, ikon merkezleri x 65.75 / 190.25 / 313.75 / 437.75 / 562.5 (adım ~124px)
 *   • İkon 19-20px, etiket 11px, ikon→etiket boşluğu 4px
 *   • Aktif: #FFFFFF · Pasif: #898A8B (hem ikon hem etiket)
 *   • ÜRET (FAB): 56×40, radius 12px, lime #55D6FD, çubuğun 16px ÜSTÜNE taşar.
 *     Etiketi FAB ile birlikte yükselmez — normal etiket satırında pasif renkte kalır.
 *
 * Sadece < sm (640px) görünür; masaüstünde üst nav kullanılır.
 * İçeriğin altına gizlenmemesi için sayfa gövdesine pb verilmeli (bkz. .alt-tab-bosluk).
 */

/* `fab` ile `ikon` ayrı alanlar: birleşim tipi yerine tek tip kullanıyoruz ki
   TS `fab` dalında `ikon`u daraltıp kaybetmesin. */
type Sekme = { ad: string; href: string; ikon?: LucideIcon; fab?: boolean };

/* Higgsfield mobil alt bar BİREBİR sırası:
   Home · Community · Generate(FAB) · Library · Profile.
   Akış sayfası 2026-10-27'de kaldırıldı; ikinci sekme Presetler (Ana Sayfa zaten Keşfet). */
const SEKMELER: Sekme[] = [
  { ad: "Ana Sayfa", href: "/panel", ikon: Home },
  { ad: "Presetler", href: "/panel/presetler", ikon: Wand2 },
  { ad: "Üret", href: "/panel/gorsel", fab: true },
  { ad: "Kitaplık", href: "/panel/kitaplik", ikon: FolderOpen },
  { ad: "Ayarlar", href: "/panel/ayarlar", ikon: CircleUser },
];

/** Yıldız/sparkle — FAB glifi (lucide Sparkles'tan farklı: tek 4-uçlu yıldız, dolu). */
function DortUc({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2c.4 4.6 1.9 6.9 6.3 7.6-4.4.7-5.9 3-6.3 7.6-.4-4.6-1.9-6.9-6.3-7.6C10.1 8.9 11.6 6.6 12 2Z" transform="translate(0 2.4)" />
    </svg>
  );
}

export function AltTabBar() {
  const path = usePathname();

  /* Aktiflik: /panel tam eşleşme ister (aksi halde her alt sayfada yanar),
     diğerleri önek eşleşmesi kullanır. */
  const aktifMi = (href: string) => (href === "/panel" ? path === "/panel" : path.startsWith(href));

  return (
    <nav
      aria-label="Alt gezinme"
      className="mobil-lime vayra-mono fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.05] bg-zemin pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <div className="relative flex h-[60px] items-stretch">
        {SEKMELER.map((s) => {
          const aktif = aktifMi(s.href);
          if (s.fab) {
            return (
              <Link
                key={s.href}
                href={s.href}
                className="relative flex flex-1 flex-col items-center justify-end pb-[9px]"
              >
                {/* FAB çubuğun üstüne taşar: 40px yüksek, 16px yukarı */}
                {/* FAB aksan token'ını kullanır; .vayra-mono altında beyaz. */}
                <span className="absolute left-1/2 top-0 flex h-10 w-14 -translate-x-1/2 -translate-y-4 items-center justify-center rounded-xl bg-aksan text-zemin">
                  <DortUc className="h-5 w-5" />
                </span>
                <span className="text-[11px] leading-none text-[#898A8B]">{s.ad}</span>
              </Link>
            );
          }
          const Ikon = s.ikon ?? Home;
          return (
            <Link
              key={s.href}
              href={s.href}
              aria-current={aktif ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-end gap-1 pb-[9px] transition-colors",
                aktif ? "text-white" : "text-[#898A8B]",
              )}
            >
              <Ikon className="h-5 w-5" strokeWidth={aktif ? 2.2 : 1.9} />
              <span className="text-[11px] leading-none">{s.ad}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
