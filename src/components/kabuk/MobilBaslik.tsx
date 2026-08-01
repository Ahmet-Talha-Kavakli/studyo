"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronRight, UserRound, Settings, Users, LogOut, Coins, Zap } from "lucide-react";
import { VayraIsaret } from "./VayraIsaret";

import { useAuth } from "@/store/useAuth";
import { cn } from "@/lib/utils";

const PLAN_ADI: Record<string, string> = {
  baslangic: "Başlangıç Planı", arti: "Artı Planı", ultra: "Ultra Planı", kurumsal: "Kurumsal Plan",
};

/**
 * Mobil üst başlık — Higgsfield mobil web BİREBİR.
 *
 * Referans ölçüleri (628×775 CSS viewport):
 *   • Yükseklik 52px, zemin #0F1113 (sayfa #131517'den bir kademe koyu)
 *   • Logo + "Vayra" kelime markası: x 17'den başlar, kelime ~20px/700
 *   • "Fiyatlandırma" hapı: 94.5×36, zemin #1B1D1F, tam yuvarlak
 *   • "%30 İNDİRİM" fuşya rozeti hapın ALTINA taşar (bottom:-8px), yatayda ortalı
 *   • Instagram: 20px kontur glif, ZEMİNSİZ
 *   • Hamburger: 2 çubuk, ~20px genişlik, sağ kenardan 16px içeride
 *
 * NOT: Referansta başlık STICKY DEĞİL — sayfayla birlikte kayar. Sadece alt
 * sekme çubuğu sabittir. Bu yüzden `sticky` vermiyoruz.
 */

/** Instagram amblemi — kontur (lucide'in dolu karesi referansa uymuyor). */
function InstagramIkon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Elmas/etiket glifi — "Fiyatlandırma" hapının solundaki ikon. */
function ElmasIkon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2.4 2.6 11.8 12 21.2l9.4-9.4L12 2.4Zm0 3.1 6.3 6.3-6.3 6.3-6.3-6.3L12 5.5Z" />
      <path d="M12 7.4 7.9 11.8 12 16.2l4.1-4.4L12 7.4Z" />
    </svg>
  );
}

export function MobilBaslik() {
  const [menu, setMenu] = useState(false);
  const [portalHazir, setPortalHazir] = useState(false);
  const router = useRouter();
  const kullanici = useAuth((s) => s.kullanici);
  const cikisYap = useAuth((s) => s.cikisYap);

  useEffect(() => setPortalHazir(true), []);

  /* Çekmece açıkken arka plan kaymasın. */
  useEffect(() => {
    if (!menu) return;
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = eski; };
  }, [menu]);

  return (
    <>
      <header className="mobil-lime flex h-[52px] items-center bg-[#0f1113] px-4 sm:hidden">
        <Link href="/panel" className="flex items-center gap-2" aria-label="Vayra ana sayfa">
          <VayraIsaret size={42} />
          <span className="text-[20px] font-bold leading-none tracking-tight text-white">Vayra</span>
        </Link>

        <div className="ml-auto flex items-center gap-4">
          {/* Fiyatlandırma hapı — fuşya rozet alt kenara sarkar */}
          <Link
            href="/panel/kredi"
            className="relative flex h-9 items-center gap-1.5 rounded-full bg-[#1b1d1f] px-3.5"
          >
            <ElmasIkon className="h-[18px] w-[18px] text-white" />
            <span className="text-[15px] font-semibold leading-none text-white">Fiyat</span>
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-fusya px-1.5 py-[2px] text-[9px] font-bold leading-none text-white">
              %30 İNDİRİM
            </span>
          </Link>

          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="text-white"
          >
            <InstagramIkon className="h-[22px] w-[22px]" />
          </a>

          <button onClick={() => setMenu(true)} aria-label="Menü" className="flex h-6 w-6 flex-col items-center justify-center gap-[6px]">
            <span className="h-[2px] w-[21px] rounded-full bg-white" />
            <span className="h-[2px] w-[21px] rounded-full bg-white" />
          </button>
        </div>
      </header>

      {/* Hesap menüsü — Higgsfield birebir: sağ-üstten açılan hesap dropdown'ı
          (kullanıcı+plan → Krediler → Get butonları → Profili gör/Hesap/Topluluk → Çıkış).
          Eskiden tam-yükseklik nav çekmecesiydi; kullanıcı "bambaşka" bildirdi. */}
      {portalHazir && createPortal(
        <AnimatePresence>
          {menu && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
                onClick={() => setMenu(false)}
                className="fixed inset-0 z-[90] bg-black/50 sm:hidden"
              />
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }} transition={{ duration: 0.18 }}
                className="mobil-lime fixed right-3 top-[56px] z-[91] w-[320px] max-w-[calc(100vw-24px)] overflow-hidden rounded-[18px] bg-[#1b1d1f] shadow-2xl sm:hidden"
              >
                {/* Kullanıcı + plan */}
                <div className="flex items-center gap-3 p-4">
                  {kullanici?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={kullanici.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-aksan to-aksan-koyu text-[17px] font-bold text-zemin">
                      {(kullanici?.ad || "V").charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-semibold text-white">{kullanici?.ad || "Vayra Kullanıcı"}</p>
                    <p className="text-[13px] text-metin-2">{PLAN_ADI[kullanici?.plan ?? "arti"]}</p>
                  </div>
                </div>

                {/* Krediler kartı */}
                <div className="mx-3 mb-2 rounded-[14px] bg-[#131517] p-3.5">
                  <Link href="/panel/kredi" onClick={() => setMenu(false)} className="flex items-center justify-between">
                    <span className="text-[15px] font-medium text-white">Krediler</span>
                    <span className="flex items-center gap-1 text-[14px] text-metin-2">{kullanici?.krediler ?? 0} kaldı <ChevronRight className="h-4 w-4" /></span>
                  </Link>
                  {/* Nokta göstergesi (referans birebir) */}
                  <div className="mt-2.5 flex gap-1">
                    {Array.from({ length: 34 }).map((_, i) => (
                      <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i < Math.min(34, Math.round((kullanici?.krediler ?? 0) / 30)) ? "bg-aksan" : "bg-white/12")} />
                    ))}
                  </div>
                  <div className="mt-3 space-y-2 border-t border-white/[0.06] pt-3">
                    {[
                      { ikon: Coins, ad: "Kredi yükle", href: "/panel/kredi" },
                      { ikon: Zap, ad: "Hızı artır", href: "/panel/kredi" },
                    ].map((g) => (
                      <div key={g.ad} className="flex items-center gap-2.5">
                        <g.ikon className="h-[18px] w-[18px] shrink-0 text-aksan" />
                        <span className="flex-1 text-[15px] text-white">{g.ad}</span>
                        <Link href={g.href} onClick={() => setMenu(false)}
                          className="rounded-full bg-aksan px-4 py-1.5 text-[13px] font-bold text-zemin">Al</Link>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Aksiyonlar */}
                <div className="px-2 pb-2">
                  {[
                    { ikon: UserRound, ad: "Profili gör", href: "/panel/profil" },
                    { ikon: Settings, ad: "Hesabı yönet", href: "/panel/ayarlar" },
                    { ikon: Users, ad: "Topluluğa katıl", href: "/panel/presetler" },
                  ].map((a) => (
                    <Link key={a.ad} href={a.href} onClick={() => setMenu(false)}
                      className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[15px] text-white active:bg-white/[0.05]">
                      <a.ikon className="h-[18px] w-[18px] text-metin-2" /> {a.ad}
                    </Link>
                  ))}
                  <div className="my-1 h-px bg-white/[0.06]" />
                  <button onClick={() => { cikisYap(); setMenu(false); router.push("/giris"); }}
                    className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-[15px] text-white active:bg-white/[0.05]">
                    <LogOut className="h-[18px] w-[18px] text-metin-2" /> Çıkış yap
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
