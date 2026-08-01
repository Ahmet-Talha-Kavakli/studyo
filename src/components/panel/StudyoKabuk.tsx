"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Images, FolderPlus, Plus,
  Clapperboard, Megaphone, Box, AudioLines, Wand2, PanelLeft, Cpu,
  Scissors, GraduationCap, Video, Terminal, Menu, X, Music,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

const studyolar = [
  { ad: "Oluştur", href: "/panel/gorsel", ikon: Wand2 },
  { ad: "Video Stüdyo", href: "/panel/video", ikon: Video },
  { ad: "Sinema Stüdyosu", href: "/panel/sinema", ikon: Clapperboard },
  { ad: "Pazarlama Stüdyosu", href: "/panel/pazarlama", ikon: Megaphone },
  { ad: "3D Stüdyo", href: "/panel/3d", ikon: Box },
  { ad: "Müzik Stüdyosu", href: "/panel/muzik", ikon: Music },
  { ad: "Ses Stüdyosu", href: "/panel/ses", ikon: AudioLines },
  { ad: "Shorts Stüdyo", href: "/panel/shorts", ikon: Scissors },
  { ad: "Explainer Stüdyo", href: "/panel/explainer", ikon: GraduationCap },
  { ad: "Supercomputer", href: "/panel/supercomputer", ikon: Cpu },
  { ad: "API Konsolu", href: "/panel/api", ikon: Terminal },
];

/**
 * Higgsfield tarzı stüdyo kabuğu: sol sidebar (stüdyo seçici + Home/generations/
 * favorites + Tools + Projects) + içerik alanı.
 */
export function StudyoKabuk({
  aktifStudyo,
  araclar,
  sidebarGizle,
  children,
}: {
  aktifStudyo: string;
  araclar?: { ad: string; ikon: typeof Home; onClick?: () => void }[];
  sidebarGizle?: boolean; // editör gibi kendi paneli olan sayfalarda dış kabuk sidebar'ını gizle
  children: ReactNode;
}) {
  const path = usePathname();
  // Sidebar standart olarak KÜÇÜK/dar modda başlar (sayfa açılış/yenileme). Kullanıcı
  // açtıysa o tercih localStorage'da saklanır ve sonraki sayfalarda korunur.
  const [acik, setAcik] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("vayra-sidebar") === "acik") setAcik(true);
  }, []);
  const acikAyarla = (v: boolean) => {
    setAcik(v);
    if (typeof window !== "undefined") localStorage.setItem("vayra-sidebar", v ? "acik" : "kapali");
  };
  const [secici, setSecici] = useState(false);
  const [projeler, setProjeler] = useState<string[]>([]);
  const [mobilAcik, setMobilAcik] = useState(false); // mobil drawer
  const mevcut = studyolar.find((s) => path.startsWith(s.href)) ?? studyolar[0];

  // Editör sayfaları kendi zengin sol panelini taşır → dış kabuk sidebar'ını hiç render etme.
  if (sidebarGizle) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)]">
        <div className="relative min-w-0 flex-1">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Mobil hamburger — sol-üst (md+ gizli) */}
      <button
        onClick={() => setMobilAcik(true)}
        aria-label="Projeler menüsü"
        className="fixed left-3 top-[3.25rem] z-30 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-ink-900/90 text-metin backdrop-blur md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobil arka plan karartma */}
      <AnimatePresence>
        {mobilAcik && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobilAcik(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar — Higgsfield birebir: SADE. Kapalıyken dar ikon şeridi, açıkken sadece Projeler.
          Masaüstünde inline; mobilde slide-in drawer (hamburger ile açılır). */}
      <motion.aside
        animate={{ width: acik ? 248 : 56 }}
        onClick={(e) => { if ((e.target as HTMLElement).closest("a")) setMobilAcik(false); }}
        className={cn(
          "shrink-0 overflow-hidden border-r border-white/8 bg-yuzey max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:!w-[248px] max-md:transition-transform",
          mobilAcik ? "max-md:translate-x-0" : "max-md:-translate-x-full",
        )}
      >
        {acik ? (
          <div className="flex h-full w-62 flex-col p-3">
            {/* Daralt satırı — Higgsfield "Hide" */}
            <button onClick={() => acikAyarla(false)}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-white/60 transition-colors hover:bg-white/6 hover:text-white">
              <PanelLeft className="h-4.5 w-4.5" /> Gizle
            </button>

            {/* Projeler — Higgsfield birebir (Üretimlerim + kullanıcı projeleri) */}
            <div className="mt-4">
              <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-white/35">Projeler</p>
              <Link href="/panel/kitaplik"
                className={cn("flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-colors",
                  path.startsWith("/panel/kitaplik") ? "bg-white/8 text-white" : "text-white hover:bg-white/6")}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg glass-ikon">
                  <Images className="h-4 w-4" />
                </span>
                Üretimlerim
              </Link>
              {projeler.map((pr) => (
                <div key={pr} className="flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm text-white">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg glass-ikon">
                    <FolderPlus className="h-4 w-4 text-cyan-glow/80" />
                  </span>
                  {pr}
                </div>
              ))}
            </div>

            {/* Yeni proje — Higgsfield birebir: en altta */}
            <button onClick={() => { const ad = `Proje ${projeler.length + 1}`; setProjeler((v) => [...v, ad]); toast.success(`${ad} oluşturuldu`); }}
              className="mt-auto flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm text-white transition-colors hover:bg-white/6">
              <Plus className="h-5 w-5" /> Yeni proje
            </button>
          </div>
        ) : (
          // Kapalı: dar ikon şeridi (Higgsfield birebir)
          <div className="flex h-full w-14 flex-col items-center gap-2 p-2">
            <Tooltip label="Paneli genişlet" side="right">
              <button onClick={() => acikAyarla(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/8 hover:text-white">
                <PanelLeft className="h-4.5 w-4.5" />
              </button>
            </Tooltip>
            <Tooltip label="Üretimlerim" side="right">
              <Link href="/panel/kitaplik"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/8 hover:text-white">
                <Images className="h-4.5 w-4.5" />
              </Link>
            </Tooltip>
            <Tooltip label={aktifStudyo} side="right">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg glass-ikon text-cyan-glow">
                <mevcut.ikon className="h-4.5 w-4.5" />
              </span>
            </Tooltip>
            <Tooltip label="Yeni proje" side="right">
              <button onClick={() => { const ad = `Proje ${projeler.length + 1}`; setProjeler((v) => [...v, ad]); toast.success(`${ad} oluşturuldu`); }}
                className="mt-auto flex h-9 w-9 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/8 hover:text-white">
                <Plus className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>
        )}
      </motion.aside>

      {/* İçerik */}
      <div className="relative min-w-0 flex-1">{children}</div>
    </div>
  );
}
