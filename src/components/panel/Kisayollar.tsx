"use client";

import { useEffect, useState } from "react";
import { useTercih } from "@/store/useTercih";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";
import { toast } from "@/lib/toast";

// Tuş → hedef eşlemesi (tek tuş, input dışında).
export const gecisler: { tus: string; ad: string; href: string }[] = [
  { tus: "o", ad: "Oluştur", href: "/panel/gorsel" },
  { tus: "s", ad: "Sinema", href: "/panel/sinema" },
  { tus: "p", ad: "Pazarlama", href: "/panel/pazarlama" },
  { tus: "d", ad: "3D", href: "/panel/3d" },
  { tus: "m", ad: "Ses (müzik)", href: "/panel/ses" },
  { tus: "k", ad: "Kitaplık", href: "/panel/kitaplik" },
  { tus: "h", ad: "Ana panel", href: "/panel" },
];

/**
 * Global klavye kısayolları — güç-kullanıcı navigasyonu. Tek tuşla stüdyo
 * geçişi (input dışında), "?" ile yardım overlay'i. Higgsfield'da yok.
 */
export function Kisayollar() {
  const router = useRouter();
  const [yardim, setYardim] = useState(false);

  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      // Input/textarea/contenteditable içindeyken kısayolları çalıştırma.
      const hedef = e.target as HTMLElement;
      if (hedef && (hedef.tagName === "INPUT" || hedef.tagName === "TEXTAREA" || hedef.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!useTercih.getState().kisayollar) return;
      // Kendi tek tuşlu kısayolları olan sayfalar (Canvas editörü) genel geçişleri devre dışı bırakır.
      if (e.defaultPrevented || document.querySelector("[data-kendi-kisayol]")) return;

      if (e.key === "?") { setYardim((v) => !v); return; }
      if (e.key === "Escape") { setYardim(false); return; }
      const g = gecisler.find((x) => x.tus === e.key.toLowerCase());
      if (g) { e.preventDefault(); router.push(g.href); toast.success(`${g.ad} açıldı`, { duration: 900 }); }
    };
    document.addEventListener("keydown", tus);
    return () => document.removeEventListener("keydown", tus);
  }, [router]);

  return (
    <AnimatePresence>
      {yardim && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink-950/85 backdrop-blur-md" onClick={() => setYardim(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
            className="menu-surface relative w-full max-w-md rounded-3xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold"><Keyboard className="h-4.5 w-4.5 text-cyan-glow" /> Klavye kısayolları</h2>
              <button onClick={() => setYardim(false)} className="text-white/50 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-1">
              {gecisler.map((g) => (
                <div key={g.tus} className="flex items-center justify-between rounded-lg px-2 py-1.5">
                  <span className="text-sm text-white/70">{g.ad}</span>
                  <kbd className="rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-xs font-semibold uppercase">{g.tus}</kbd>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg px-2 py-1.5">
                <span className="text-sm text-white/70">Bu yardımı aç/kapat</span>
                <kbd className="rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-xs font-semibold">?</kbd>
              </div>
              <div className="flex items-center justify-between rounded-lg px-2 py-1.5">
                <span className="text-sm text-white/70">Komut paleti</span>
                <kbd className="rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-xs font-semibold">⌘K</kbd>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-white/35">Kısayollar yazı alanları dışında çalışır.</p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
