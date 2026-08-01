"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home, CreditCard, Activity, KeyRound, Webhook as WebhookIkon, BookOpen,
  ChevronDown, Check, Plus, User, Menu, X, Gauge, FlaskConical,
  Terminal, AlertTriangle, GitCommitHorizontal, Boxes, Signal, Sparkles,
} from "lucide-react";
import { useAuth } from "@/store/useAuth";
import { useApiAnahtar } from "@/store/useApiAnahtar";
import { cn } from "@/lib/utils";

/* ============================================================
   VAYRA CLOUD KABUĞU — Higgsfield Cloud birebir uyarlaması.

   Sol sidebar:  Genel Bakış · API başlığı (Faturalama/Kullanım/Anahtarlar/
                 Webhook/Hız Limitleri) · altta "API Durumu" yeşil nokta.
   Üst çubuk:    Hesap seçici (Kişisel Hesap ▾) · Dokümantasyon · Fiyatlandırma
                 · Sandbox rozeti · avatar.
   ============================================================ */

const GENEL = { ad: "Genel Bakış", href: "/panel/api", ikon: Home };

type NavOge = { ad: string; href: string; ikon: typeof Home };

// GELİŞTİR — günlük kullanılan araçlar
const GELISTIR_BOLUM: NavOge[] = [
  { ad: "API Konsolu", href: "/panel/api/konsol", ikon: Terminal },
  { ad: "API Anahtarları", href: "/panel/api/anahtarlar", ikon: KeyRound },
  { ad: "Webhook'lar", href: "/panel/api/webhooklar", ikon: WebhookIkon },
  { ad: "Hız Limitleri", href: "/panel/api/hiz-limitleri", ikon: Gauge },
  { ad: "Kullanım", href: "/panel/api/kullanim", ikon: Activity },
  { ad: "Faturalama", href: "/panel/api/faturalama", ikon: CreditCard },
];

// REFERANS — dokümantasyon & yardım
const REFERANS_BOLUM: NavOge[] = [
  { ad: "Dokümantasyon", href: "/panel/api/dokuman", ikon: BookOpen },
  { ad: "SDK'lar", href: "/panel/api/sdk", ikon: Boxes },
  { ad: "Örnek Galerisi", href: "/panel/api/ornekler", ikon: Sparkles },
  { ad: "Hata Referansı", href: "/panel/api/hatalar", ikon: AlertTriangle },
  { ad: "Değişiklikler", href: "/panel/api/degisiklikler", ikon: GitCommitHorizontal },
  { ad: "API Durumu", href: "/panel/api/durum", ikon: Signal },
];

function SidebarBaglanti({
  ad, href, ikon: Ikon, aktif, onTikla,
}: { ad: string; href: string; ikon: typeof Home; aktif: boolean; onTikla?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onTikla}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        aktif
          ? "bg-aksan text-[#12140c]"
          : "text-metin-2 hover:bg-white/[0.06] hover:text-metin",
      )}
    >
      <Ikon className="h-[18px] w-[18px] shrink-0" />
      <span className="truncate">{ad}</span>
    </Link>
  );
}

export function CloudKabuk({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { kullanici } = useAuth();
  const sandbox = useApiAnahtar((s) => s.sandbox);
  const sandboxAyarla = useApiAnahtar((s) => s.sandboxAyarla);

  const [hesapAcik, setHesapAcik] = useState(false);
  const [avatarAcik, setAvatarAcik] = useState(false);
  const [mobilAcik, setMobilAcik] = useState(false);

  const aktifMi = (href: string) => (href === "/panel/api" ? path === href : path.startsWith(href));

  const sidebarIcerik = (
    <div className="flex h-full flex-col p-3">
      <SidebarBaglanti {...GENEL} aktif={aktifMi(GENEL.href)} onTikla={() => setMobilAcik(false)} />

      <p className="mb-1.5 mt-5 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-metin-3">
        Geliştir
      </p>
      <div className="space-y-0.5">
        {GELISTIR_BOLUM.map((o) => (
          <SidebarBaglanti key={o.href} {...o} aktif={aktifMi(o.href)} onTikla={() => setMobilAcik(false)} />
        ))}
      </div>

      <p className="mb-1.5 mt-5 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-metin-3">
        Referans
      </p>
      <div className="space-y-0.5 overflow-y-auto [scrollbar-width:thin]">
        {REFERANS_BOLUM.map((o) => (
          <SidebarBaglanti key={o.href} {...o} aktif={aktifMi(o.href)} onTikla={() => setMobilAcik(false)} />
        ))}
      </div>

      <div className="mt-auto pt-4">
        <Link href="/panel/api/durum" onClick={() => setMobilAcik(false)} className="block rounded-xl border border-white/[0.06] bg-yuzey-2 px-3.5 py-3 transition-colors hover:border-white/[0.14]">
          <div className="text-xs font-semibold text-metin">API Durumu</div>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-metin-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Tüm sistemler çalışıyor
          </div>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="api-kapsam flex min-h-screen items-start bg-zemin">
      {/* Mobil hamburger */}
      <button
        onClick={() => setMobilAcik(true)}
        aria-label="API menüsü"
        className="fixed left-3 top-[3.25rem] z-30 flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-yuzey/95 text-metin backdrop-blur lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {mobilAcik && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobilAcik(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar — m45: masaüstünde SABİT (sticky top, tam yükseklik); sayfa
          aşağı kaysa da sidebar yerinde kalır. */}
      <aside
        className={cn(
          "w-[248px] shrink-0 border-r border-white/[0.06] bg-yuzey",
          "lg:sticky lg:top-0 lg:h-screen lg:self-start",
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:transition-transform",
          mobilAcik ? "max-lg:translate-x-0" : "max-lg:-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5 lg:hidden">
            <span className="text-sm font-bold">Vayra Cloud</span>
            <button onClick={() => setMobilAcik(false)} aria-label="Kapat" className="text-metin-3 hover:text-metin">
              <X className="h-5 w-5" />
            </button>
          </div>
          {sidebarIcerik}
        </div>
      </aside>

      {/* İçerik sütunu */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Üst çubuk */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-white/[0.06] bg-zemin/95 px-4 backdrop-blur-xl max-lg:pl-14 lg:px-6">
          {/* Hesap seçici */}
          <div className="relative">
            <button
              onClick={() => { setHesapAcik((v) => !v); setAvatarAcik(false); }}
              className="glass-cip flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm text-metin"
            >
              <User className="h-4 w-4 text-metin-2" />
              <span className="max-sm:hidden">Kişisel Hesap</span>
              <ChevronDown className={cn("h-4 w-4 text-metin-3 transition-transform", hesapAcik && "rotate-180")} />
            </button>
            <AnimatePresence>
              {hesapAcik && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setHesapAcik(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className="menu-surface absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl p-1.5"
                  >
                    <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-metin-3">
                      Hesap değiştir
                    </p>
                    <button className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-metin hover:bg-white/[0.06]">
                      <User className="h-4 w-4 text-metin-2" />
                      <span className="flex-1 text-left">Kişisel Hesap</span>
                      <Check className="h-4 w-4 text-aksan" />
                    </button>
                    <Link
                      href="/panel/calisanlar"
                      onClick={() => setHesapAcik(false)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-metin hover:bg-white/[0.06]"
                    >
                      <Plus className="h-4 w-4 text-metin-2" /> Organizasyon Oluştur
                    </Link>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1" />

          {/* Sandbox anahtarı — bizim ekstramız */}
          <button
            onClick={() => sandboxAyarla(!sandbox)}
            title="Sandbox modunda istekler kredi harcamaz"
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors",
              sandbox
                ? "border border-amber-400/35 bg-amber-500/15 text-amber-300"
                : "glass-cip text-metin-2",
            )}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            <span className="max-sm:hidden">Sandbox {sandbox ? "AÇIK" : "kapalı"}</span>
          </button>

          <Link
            href="/panel/api/dokuman"
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm text-metin-2 transition-colors hover:text-metin max-md:hidden"
          >
            <BookOpen className="h-4 w-4" /> Dokümantasyon
          </Link>
          <Link
            href="/panel/kredi"
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm text-metin-2 transition-colors hover:text-metin max-md:hidden"
          >
            <CreditCard className="h-4 w-4" /> Fiyatlandırma
          </Link>

          {/* Avatar */}
          <div className="relative">
            <button
              onClick={() => { setAvatarAcik((v) => !v); setHesapAcik(false); }}
              aria-label="Hesap menüsü"
              className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-white/[0.06]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-aksan text-sm font-bold text-[#12140c]">
                {(kullanici?.ad ?? "V").charAt(0).toUpperCase()}
              </span>
              <span className="max-w-[9rem] truncate text-sm text-metin max-md:hidden">
                {kullanici?.ad ?? "Misafir"}
              </span>
            </button>
            <AnimatePresence>
              {avatarAcik && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAvatarAcik(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className="menu-surface absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl p-1.5"
                  >
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-semibold text-metin">{kullanici?.ad ?? "Misafir"}</p>
                      <p className="truncate text-xs text-metin-3">{kullanici?.email ?? "giriş yapılmadı"}</p>
                    </div>
                    <div className="my-1 h-px bg-white/[0.07]" />
                    <Link
                      href="/panel/profil"
                      onClick={() => setAvatarAcik(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-metin hover:bg-white/[0.06]"
                    >
                      <User className="h-4 w-4 text-metin-2" /> Profil
                    </Link>
                    <Link
                      href="/panel"
                      onClick={() => setAvatarAcik(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-metin hover:bg-white/[0.06]"
                    >
                      <Home className="h-4 w-4 text-metin-2" /> Panele dön
                    </Link>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
