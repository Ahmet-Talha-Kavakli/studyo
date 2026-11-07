"use client";

import { Yuzen } from "@/components/ui/Yuzen";
import { AuthDugmeleri } from "@/components/auth/AuthDugmeleri";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Zap } from "lucide-react";
import { toast } from "@/lib/toast";
import { Tooltip } from "@/components/ui/Tooltip";
import { AramaModal } from "@/components/panel/AramaModal";
import { VayraIsaret } from "./VayraIsaret";
import { MegaNav, okGezinti } from "./MegaNav";
import { useAuth, krediDurum } from "@/store/useAuth";
import { useAuthKapi } from "@/store/useAuthKapi";
import { BildirimMerkezi } from "@/components/bildirim/BildirimMerkezi";
import { cn } from "@/lib/utils";
import { KrediIsiltiHap } from "@/components/ui/KrediHap";
import { KullaniciAvatar } from "@/components/ui/KullaniciAvatar";
import { HesapMenusu } from "./HesapMenusu";
import { AlanSecici } from "@/components/alan/AlanSecici";

/**
 * Üst navigasyon (masaüstü, sm+).
 *
 *  [Vayra]  Keşfet Görsel Video Ses 3D Stüdyolar Presetler Topluluk Kaynaklar [Fiyatlar]      ⌕ [◎ 640] [Yükselt] zil (T)
 *
 * Bar sade ve tipografik (Higgsfield/Leonardo düzeni): düz koyu zemin, ince alt çizgi,
 * aktif başlık camgöbeği metin. Açılır paneller MegaNav.tsx'te; bu dosya logo, sağ
 * küme ve hesap menüsünü taşır. Hesap menüsü panellerle aynı yüzeyi ve satır ritmini kullanır.
 */

const ODAK = "outline-none focus-visible:ring-2 focus-visible:ring-aksan/70";
const fmt = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

/** Hesap menüsü satırı: panellerdeki karo dilinin küçük hali. */
export function UstNav() {
  const path = usePathname();
  const router = useRouter();
  const { kullanici, cikisYap, girisYapildi } = useAuth();
  const kredi = useMemo(() => krediDurum(kullanici), [kullanici]);
  const acKapi = useAuthKapi((s) => s.ac);
  const [arama, setArama] = useState(false);
  const [zil, setZil] = useState(false);
  const [profil, setProfil] = useState(false);
  const avatarRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Kısayol ipucu platforma göre (SSR'da "Ctrl", mount sonrası Mac ise ⌘).
  const [mac, setMac] = useState(false);
  useEffect(() => { setMac(/Mac|iPhone|iPad/.test(navigator.platform)); }, []);

  useEffect(() => {
    const kisayol = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setArama((v) => !v); }
      if (e.key === "Escape") { setZil(false); setProfil((v) => { if (v) avatarRef.current?.focus(); return false; }); }
    };
    document.addEventListener("keydown", kisayol);
    return () => document.removeEventListener("keydown", kisayol);
  }, []);

  useEffect(() => {
    if (!profil) return;
    const t = setTimeout(() => menuRef.current?.querySelector<HTMLElement>("[data-gez]")?.focus({ preventScroll: true }), 60);
    return () => clearTimeout(t);
  }, [profil]);
  useEffect(() => { setProfil(false); setZil(false); }, [path]);

  const enUstPlan = kullanici?.plan === "ultra" || kullanici?.plan === "kurumsal";
  const yuzde = Math.round(kredi.oran * 100);
  const git = (href: string) => { setProfil(false); router.push(href); };
  const kapat = () => setProfil(false);

  const avatar = (boyut: number) => <KullaniciAvatar boyut={boyut} />;

  return (
    <header className="sticky top-0 z-40 hidden h-[var(--ust-nav)] border-b border-white/[0.06] bg-[#0b0b0c] sm:block">
      <div className="flex h-full items-center gap-2 px-3 lg:px-5">
        <Link href="/panel" aria-label="Vayra ana sayfa" className={cn("group mr-1 flex h-9 shrink-0 items-center gap-2 rounded-[10px] px-1.5 lg:mr-3", ODAK)}>
          <span className="transition-transform duration-300 group-hover:rotate-[-8deg]"><VayraIsaret size={32} /></span>
          <span className={cn("hidden text-[18px] font-semibold tracking-[-0.02em] text-white", girisYapildi ? "min-[1600px]:inline" : "lg:inline")}>Vayra</span>
        </Link>

        {/* Çalışma alanı seçici (kişisel ya da ekip alanı): krediler etkin alanın cüzdanından düşer. */}
        {girisYapildi && <><span aria-hidden className="hidden h-5 w-px bg-white/[0.12] lg:block" /><AlanSecici className="mr-0.5 hidden lg:block" /></>}
        <MegaNav path={path} />
        <div className="min-w-0 flex-1" />

        <div className="flex shrink-0 items-center gap-2">
          <Tooltip label={mac ? "Ara (⌘K)" : "Ara (Ctrl K)"}>
            <button onClick={() => setArama(true)} aria-label="Ara"
              className={cn("flex h-10 w-10 items-center justify-center rounded-[11px] text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white", ODAK)}>
              <Search className="h-5 w-5" strokeWidth={2} />
            </button>
          </Tooltip>

          {girisYapildi ? (
            <>

              <Tooltip label={`${kredi.etiket} · %${yuzde} kaldı · kredi yükle`}>
                <KrediIsiltiHap deger={kullanici?.krediler ?? 0} az={kredi.oran < 0.2} href="/panel/kredi?sekme=kredi" boyut="lg" className="hidden md:inline-flex" />
              </Tooltip>

              {!enUstPlan && (
                <button onClick={() => router.push("/panel/kredi?sekme=plan")} aria-label="Yükselt"
                  className={cn("hf-cta flex h-10 items-center gap-1.5 !rounded-[12px] px-3.5 text-[14.5px] xl:px-4", ODAK)}>
                  <Zap className="h-3.5 w-3.5 fill-current" strokeWidth={2.2} /><span className="hidden xl:inline">Yükselt</span>
                </button>
              )}

              <BildirimMerkezi acik={zil} setAcik={(v) => { setZil(v); if (v) setProfil(false); }} />

              <div className="relative">
                <button ref={avatarRef} onClick={() => { setProfil((v) => !v); setZil(false); }} aria-haspopup="menu" aria-expanded={profil}
                  aria-label={`Hesabım — ${kredi.etiket}: ${kredi.kalan.toLocaleString("tr-TR")} / ${kredi.toplam.toLocaleString("tr-TR")} kredi`}
                  className={cn("relative flex h-10 w-10 items-center justify-center rounded-full ring-2 transition-[box-shadow]", ODAK, profil ? "ring-aksan/70" : "ring-white/10 hover:ring-white/25")}>
                  {avatar(36)}
                </button>
                <AnimatePresence>
                  <Yuzen acik={profil} onKapat={kapat} sag={0} ust={52} bosluk={0}>
                    <motion.div ref={menuRef} role="menu" aria-label="Hesap menüsü" onKeyDown={okGezinti}
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                      className="bd-panel max-h-[calc(100dvh-var(--ust-nav)-8px)] w-[320px] overflow-y-auto rounded-[24px] p-1.5 [scrollbar-width:none]">
                      <HesapMenusu kapat={kapat} git={git} onCikis={() => { kapat(); cikisYap(); toast("Çıkış yapıldı"); router.push("/"); }} />
                    </motion.div>
                  </Yuzen>
                </AnimatePresence>
              </div>
            </>
          ) : (
            <AuthDugmeleri pencere className="ml-1" />
          )}
        </div>
      </div>

      <AramaModal acik={arama} onKapat={() => setArama(false)} />
    </header>
  );
}
