"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, Rocket, FolderOpen, Bell, Sparkles, Check,
  LogOut, User, Settings, Zap, Menu, Gift, ArrowRight,
  // Nav öğe ikonları
  Compass, ImageIcon, Video, AudioLines, Box, Clapperboard, Megaphone,
  Workflow, Cpu, Users, Scissors, GraduationCap, Code2, LayoutGrid, Puzzle,
} from "lucide-react";
import { useEffect } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { AramaModal } from "./AramaModal";
import { MegaMenu } from "./MegaMenu";
import { EklentiMenu } from "./EklentiMenu";
import { SaglayiciDurum } from "./SaglayiciDurum";
import { KuyrukGosterge } from "./KuyrukGosterge";
import { MEGA_MENULER } from "@/lib/megaMenu";
import { useAuth } from "@/store/useAuth";
import { useBildirim } from "@/store/useBildirim";
import { formatKredi, cn } from "@/lib/utils";

/** Üst yatay navigasyon. Ses'te 2-sütun mega-menü, Eklentiler'de dropdown açılır.
    NOT (2026-07-30): Görsel ve Video'nun hover mega-menüsü KALDIRILDI (kullanıcı
    kararı: "gereksiz"). Tıklama davranışı aynı — doğrudan sayfaya gider.
    MEGA_MENULER.gorsel/video tanımları lib/megaMenu.ts'te duruyor; geri
    istenirse ilgili satıra `mega: "gorsel"` eklemek yeterli. */
// ikon: her nav öğesinin anlamını taşıyan glif. renk: .glass-ikon renkli varyantı —
// çıktı türüne göre gruplanır (görsel=cyan, video=mor, ses=gök, 3D=lime, ajan=kehribar).
const menu: {
  ad: string; href: string; rozet?: string; mega?: "gorsel" | "video" | "ses"; eklenti?: boolean;
  ikon: typeof Compass; renk?: string;
}[] = [
  { ad: "Keşfet", href: "/panel", ikon: Compass },
  { ad: "Görsel", href: "/panel/gorsel", ikon: ImageIcon, renk: "glass-ikon-cyan" },
  { ad: "Video", href: "/panel/video", ikon: Video, renk: "glass-ikon-mor" },
  { ad: "Ses", href: "/panel/ses", mega: "ses", ikon: AudioLines, renk: "glass-ikon-gok" },
  { ad: "3D", href: "/panel/3d", rozet: "Yeni", ikon: Box, renk: "glass-ikon-lime" },
  { ad: "Sinema", href: "/panel/sinema", ikon: Clapperboard, renk: "glass-ikon-mor" },
  { ad: "Pazarlama", href: "/panel/pazarlama", ikon: Megaphone, renk: "glass-ikon-gul" },
  { ad: "Akış (Canvas)", href: "/panel/akis-canvas", ikon: Workflow },
  { ad: "Supercomputer", href: "/panel/supercomputer", rozet: "Yeni", ikon: Cpu, renk: "glass-ikon-kehribar" },
  { ad: "Çalışanlar", href: "/panel/calisanlar", ikon: Users, renk: "glass-ikon-kehribar" },
  { ad: "Shorts", href: "/panel/shorts", ikon: Scissors, renk: "glass-ikon-mor" },
  { ad: "Explainer", href: "/panel/explainer", ikon: GraduationCap, renk: "glass-ikon-yesil" },
  { ad: "API", href: "/panel/api", ikon: Code2 },
  // Higgsfield "Plugins" — nav'da hover'da açılan eklenti dropdown'ı
  { ad: "Eklentiler", href: "/panel/eklentiler", rozet: "Yeni", eklenti: true, ikon: Puzzle },
];

// İlk 4 öğe sabit (Keşfet/Görsel/Video/Ses), geri kalanı yatay kaydırılabilir (Higgsfield tarzı).
const menuSabit = menu.slice(0, 4);
const menuKayan = menu.slice(4);

function zamanFarki(t: number) {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "az önce";
  if (s < 3600) return `${Math.floor(s / 60)} dk önce`;
  if (s < 86400) return `${Math.floor(s / 3600)} sa önce`;
  return `${Math.floor(s / 86400)} gün önce`;
}

export function PanelTopNav() {
  const path = usePathname();
  const router = useRouter();
  const { kullanici, cikisYap } = useAuth();
  const { bildirimler, okunduIsaretle, tumunuOku } = useBildirim();
  const [zil, setZil] = useState(false);
  const [profil, setProfil] = useState(false);
  const [mobil, setMobil] = useState(false);
  const [arama, setArama] = useState(false);
  const [acikMega, setAcikMega] = useState<"gorsel" | "video" | "ses" | null>(null);
  const [eklentiAcik, setEklentiAcik] = useState(false); // Higgsfield "Plugins" dropdown'ı
  const okunmamis = bildirimler.filter((b) => !b.okundu).length;
  const aktif = (h: string) => (h === "/panel" ? path === "/panel" : path.startsWith(h.split("?")[0]));

  // ⌘K / Ctrl+K ile arama aç
  useEffect(() => {
    const kisayol = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setArama((v) => !v);
      }
    };
    document.addEventListener("keydown", kisayol);
    return () => document.removeEventListener("keydown", kisayol);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-ink-950/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-1 px-4 lg:px-6">
        {/* Logo */}
        <Link href="/panel" className="mr-2 flex items-center gap-2">
          {/* Marka işareti — favicon/apple-icon ile BİREBİR aynı glif.
              "V" = aşağı bakan play üçgeni + sağ üstte AI kıvılcımı. */}
          <span className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg shadow-cyan-500/30"
            style={{ background: "linear-gradient(135deg,#7df0ff,#22d3ee 50%,#0e9fbc)" }}>
            <svg viewBox="0 0 32 32" className="h-9 w-9" fill="none" aria-hidden>
              <path d="M9.6 10.2h12.8c1.05 0 1.72 1.13 1.2 2.05l-6.4 11.3c-.53.93-1.87.93-2.4 0l-6.4-11.3c-.52-.92.15-2.05 1.2-2.05Z" fill="#07171b" />
              <circle cx="23.4" cy="8.6" r="2.6" fill="#07171b" />
              <circle cx="23.4" cy="8.6" r="1.2" fill="#7df0ff" />
            </svg>
          </span>
          <span className="hidden text-lg font-bold tracking-tight sm:block">Vayra</span>
        </Link>

        {/* Sabit menü (ilk 4 — Keşfet/Görsel/Video/Ses) */}
        <nav className="hidden shrink-0 items-center lg:flex">
          {menuSabit.map((m) => (
            <div key={m.href} className="relative"
              onMouseEnter={() => setAcikMega(m.mega ?? null)}
              onMouseLeave={() => setAcikMega(null)}>
              <Link href={m.href}
                className={cn("group/nav relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  aktif(m.href) ? "text-white" : "text-white/55 hover:text-white")}>
                {/* İkon: aktif sayfada RENKLİ cam kutu, pasifte sade glif.
                    Her öğeyi kutulamak nav'ı kalabalıklaştırırdı; kutu sadece
                    bulunduğun yeri işaretliyor, hover'da da beliriyor. */}
                <span className={cn("nav-ikon flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] transition-all",
                  aktif(m.href) && cn("glass-ikon", m.renk))}>
                  <m.ikon className="h-4 w-4" />
                </span>
                {m.ad}
                {m.rozet && <span className="glass-ikon glass-ikon-cyan rounded-[5px] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide">{m.rozet}</span>}
                {aktif(m.href) && <motion.span layoutId="navAktif" className="absolute inset-x-2 -bottom-[1px] h-0.5 rounded-full bg-cyan-glow" />}
              </Link>
              <AnimatePresence>
                {m.mega && acikMega === m.mega && (
                  <MegaMenu menu={MEGA_MENULER[m.mega]} onGit={() => setAcikMega(null)} />
                )}
              </AnimatePresence>
            </div>
          ))}
          {/* Sabit/kayan ayracı */}
          <span className="mx-1.5 h-5 w-px shrink-0 bg-white/10" />
        </nav>

        {/* Kaydırılabilir menü (geri kalan stüdyolar) — sağda pr-2 ile son rozet kırpılmasın */}
        <nav className="hidden min-w-0 flex-1 items-center overflow-x-auto pr-2 lg:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {menuKayan.map((m) => (
            <div key={m.ad} className="relative shrink-0"
              onMouseEnter={() => { setAcikMega(m.mega ?? null); setEklentiAcik(Boolean(m.eklenti)); }}
              onMouseLeave={() => { setAcikMega(null); setEklentiAcik(false); }}>
              <Link href={m.href}
                className={cn("group/nav relative flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  aktif(m.href) && !m.eklenti ? "text-white" : "text-white/55 hover:text-white")}>
                <span className={cn("nav-ikon flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] transition-all",
                  aktif(m.href) && !m.eklenti && cn("glass-ikon", m.renk))}>
                  <m.ikon className="h-4 w-4" />
                </span>
                {m.ad}
                {m.rozet && <span className="glass-ikon glass-ikon-cyan shrink-0 whitespace-nowrap rounded-[5px] px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wide">{m.rozet}</span>}
                {aktif(m.href) && !m.eklenti && <motion.span layoutId="navAktif" className="absolute inset-x-2 -bottom-[1px] h-0.5 rounded-full bg-cyan-glow" />}
              </Link>
              <AnimatePresence>
                {m.mega && acikMega === m.mega && (
                  <MegaMenu menu={MEGA_MENULER[m.mega]} onGit={() => setAcikMega(null)} />
                )}
                {/* Higgsfield "Plugins" dropdown'ı birebir */}
                {m.eklenti && eklentiAcik && (
                  <EklentiMenu onGit={() => setEklentiAcik(false)} />
                )}
              </AnimatePresence>
            </div>
          ))}
          {/* Son öğenin rozeti sağ-aksiyon bloğuna yapışıp kırpılmasın diye boşluk */}
          <span className="w-3 shrink-0" aria-hidden />
        </nav>

        {/* Sağ aksiyonlar */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:ml-2">
          <Tooltip label="Ara (⌘K)">
            <button onClick={() => setArama(true)} className="hf-btn glass-cip flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-white/60 hover:text-white" aria-label="Ara">
              <Search className="h-4.5 w-4.5" />
              <kbd className="glass-cip hidden rounded px-1 text-[10px] text-white/40 lg:inline">⌘K</kbd>
            </button>
          </Tooltip>

          {/* Upgrade */}
          <Link href="/panel/kredi" className="relative hidden items-center gap-1.5 rounded-lg bg-white/8 px-3 py-2 text-sm font-medium transition-colors hover:bg-white/12 sm:flex">
            <Rocket className="h-4 w-4 text-cyan-glow" /> Yükselt
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">%30 İNDİRİM</span>
          </Link>

          {/* Kredi / Assets */}
          <Tooltip label="Kalan kredin">
            <Link href="/panel/kredi" className="flex h-9 items-center gap-1.5 rounded-lg border border-amber-glow/25 bg-amber-glow/10 px-2.5 text-sm font-semibold text-amber-glow transition-colors hover:bg-amber-glow/20">
              <Zap className="h-3.5 w-3.5" /> {formatKredi(kullanici?.krediler ?? 0)}
            </Link>
          </Tooltip>
          <Tooltip label="Kitaplığım (varlıklar)">
            <Link href="/panel/kitaplik" className="hidden h-9 items-center gap-1.5 rounded-lg bg-white/8 px-3 text-sm font-medium transition-colors hover:bg-white/12 md:flex">
              <FolderOpen className="h-4 w-4 text-cyan-glow" /> Varlıklar
            </Link>
          </Tooltip>

          {/* Batch üretim kuyruğu göstergesi */}
          <div className="hidden md:block">
            <KuyrukGosterge />
          </div>

          {/* AI sağlayıcı durumu (gerçek/demo şeffaflığı) */}
          <div className="hidden md:block">
            <SaglayiciDurum />
          </div>

          {/* Bildirim */}
          <div className="relative">
            <Tooltip label="Bildirimler">
              <button onClick={() => { setZil((v) => !v); setProfil(false); }}
                className="hf-btn glass-cip relative flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:text-white" aria-label="Bildirimler">
                <Bell className="h-4.5 w-4.5" />
                {okunmamis > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-vayra-500 px-1 text-[10px] font-bold">{okunmamis}</span>}
              </button>
            </Tooltip>
            <AnimatePresence>
              {zil && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setZil(false)} />
                  <motion.div initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    className="menu-surface absolute right-0 top-11 z-50 w-80 rounded-2xl p-2 shadow-2xl shadow-black/50">
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <span className="text-sm font-semibold">Bildirimler</span>
                      {okunmamis > 0 && <button onClick={tumunuOku} className="flex items-center gap-1 text-xs text-cyan-glow"><Check className="h-3 w-3" /> Tümünü oku</button>}
                    </div>

                    {/* Ödül promosyon kartı (Higgsfield tarzı) */}
                    <button onClick={() => { setZil(false); router.push("/panel/ayarlar?sekme=oduller"); }}
                      className="hf-kart hf-btn group relative mb-1.5 flex w-full items-center gap-3 overflow-hidden bg-gradient-to-r from-emerald-500/20 via-emerald-400/10 to-transparent p-3 text-left">
                      <span className="glass-cip flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-emerald-300"><Gift className="h-5 w-5" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-tight">Ödüllerin yakında açılıyor</p>
                        <p className="mt-0.5 text-xs text-white/55">Görevleri tamamla, bonus kredi kazan.</p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-emerald-300 transition-transform group-hover:translate-x-0.5" />
                    </button>

                    <div className="max-h-80 overflow-y-auto">
                      {bildirimler.length === 0 ? <p className="px-2 py-8 text-center text-sm text-white/40">Bildirim yok</p> :
                        bildirimler.map((b) => (
                          <button key={b.id} onClick={() => okunduIsaretle(b.id)}
                            className={cn("flex w-full gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-white/8", !b.okundu && "glass-cip-aktif")}>
                            <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", b.tur === "basari" ? "bg-emerald-400" : b.tur === "uyari" ? "bg-amber-glow" : "bg-cyan-glow")} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium leading-tight">{b.baslik}</p>
                              <p className="mt-0.5 text-xs text-white/50">{b.mesaj}</p>
                              <p className="mt-1 text-[11px] text-white/30">{zamanFarki(b.zaman)}</p>
                            </div>
                          </button>
                        ))}
                    </div>
                    <Link href="/panel/bildirimler" onClick={() => setZil(false)} className="hf-btn glass-cip mt-1 block rounded-xl py-2 text-center text-xs text-cyan-glow">Tümünü gör</Link>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Profil */}
          <div className="relative">
            <button onClick={() => { setProfil((v) => !v); setZil(false); }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-vayra-400 to-vayra-600 text-sm font-semibold ring-2 ring-white/10 transition-transform hover:scale-105">
              {(kullanici?.ad ?? "V").charAt(0).toUpperCase()}
            </button>
            <AnimatePresence>
              {profil && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfil(false)} />
                  <motion.div initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    className="menu-surface absolute right-0 top-11 z-50 w-64 rounded-2xl p-2 shadow-2xl shadow-black/50">
                    <div className="border-b border-white/10 px-3 py-2.5">
                      <p className="text-sm font-medium">{kullanici?.ad}</p>
                      <p className="text-xs text-white/45">{kullanici?.email}</p>
                      <span className="glass-cip-aktif mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium capitalize text-cyan-glow">{kullanici?.plan} planı</span>
                    </div>

                    {/* Kredi bakiyesi + dot-progress + hızlı yükseltmeler (Higgsfield mantığı) */}
                    <div className="border-b border-white/10 px-3 py-2.5">
                      <Link href="/panel/kredi" onClick={() => setProfil(false)}
                        className="flex items-center justify-between text-sm transition-colors hover:text-cyan-glow">
                        <span className="font-medium">Kredi</span>
                        <span className="flex items-center gap-1 text-white/55">{new Intl.NumberFormat("tr-TR").format(kullanici?.krediler ?? 0)} kalan <ArrowRight className="h-3 w-3" /></span>
                      </Link>
                      <div className="mt-2 flex gap-0.5">
                        {Array.from({ length: 24 }).map((_, i) => (
                          <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < Math.round(Math.min(1, (kullanici?.krediler ?? 0) / 1000) * 24) ? "bg-cyan-glow" : "bg-white/12")} />
                        ))}
                      </div>
                      <div className="mt-2.5 space-y-0.5">
                        <Link href="/panel/kredi" onClick={() => setProfil(false)}
                          className="hf-btn flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm transition-colors hover:bg-white/8">
                          <span className="glass-cip flex h-6 w-6 items-center justify-center rounded-md text-cyan-glow"><Zap className="h-3.5 w-3.5" /></span>
                          <span className="flex-1 text-white/80">Kredi yükle</span>
                          <span className="rounded-full bg-cyan-glow px-2 py-0.5 text-[10px] font-bold text-ink-950">Al</span>
                        </Link>
                        <Link href="/panel/kredi" onClick={() => setProfil(false)}
                          className="hf-btn flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm transition-colors hover:bg-white/8">
                          <span className="glass-cip flex h-6 w-6 items-center justify-center rounded-md text-violet-300"><ArrowRight className="h-3.5 w-3.5" /></span>
                          <span className="flex-1 text-white/80">Hızı artır</span>
                          <span className="glass-cip rounded-full px-2 py-0.5 text-[10px] font-semibold text-white/60">Al</span>
                        </Link>
                        <Link href="/panel/kredi" onClick={() => setProfil(false)}
                          className="hf-btn flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm transition-colors hover:bg-white/8">
                          <span className="glass-cip flex h-6 w-6 items-center justify-center rounded-md text-sky-300">∞</span>
                          <span className="flex-1 text-white/80">Sınırsız modeller</span>
                          <span className="glass-cip rounded-full px-2 py-0.5 text-[10px] font-semibold text-white/60">Al</span>
                        </Link>
                      </div>
                    </div>

                    <div className="pt-1">
                      <Link href="/panel/profil" onClick={() => setProfil(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-white/8"><User className="h-4 w-4 text-white/60" /> Profilim</Link>
                      <Link href="/panel/ayarlar" onClick={() => setProfil(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-white/8"><Settings className="h-4 w-4 text-white/60" /> Ayarlar</Link>
                      <Link href="/kesfet" onClick={() => setProfil(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-white/8"><Sparkles className="h-4 w-4 text-white/60" /> Topluluğa katıl</Link>
                      <button onClick={() => { cikisYap(); router.push("/"); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10"><LogOut className="h-4 w-4" /> Çıkış yap</button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Mobil menü */}
          <button onClick={() => setMobil((v) => !v)} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 lg:hidden" aria-label="Menü">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobil menü açılır */}
      <AnimatePresence>
        {mobil && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/8 lg:hidden">
            <div className="flex flex-col gap-0.5 p-3">
              {menu.map((m) => (
                <Link key={m.href} href={m.href} onClick={() => setMobil(false)}
                  className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm", aktif(m.href) ? "glass-cip-aktif text-white" : "text-white/60")}>
                  {/* Mobilde alan bol — ikon kutusu her satırda görünür. */}
                  <span className={cn("glass-ikon flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px]", aktif(m.href) && m.renk)}>
                    <m.ikon className="h-4 w-4" />
                  </span>
                  {m.ad}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AramaModal acik={arama} onKapat={() => setArama(false)} />
    </header>
  );
}
