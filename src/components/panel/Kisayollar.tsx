"use client";

import { useEffect } from "react";
import { useTercih } from "@/store/useTercih";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

// Tuş → hedef eşlemesi (tek tuş, input dışında).
export const gecisler: { tus: string; ad: string; href: string }[] = [
  { tus: "o", ad: "Oluştur", href: "/panel/gorsel" },
  { tus: "s", ad: "Sinema", href: "/panel/sinema" },
  { tus: "p", ad: "Pazarlama", href: "/panel/pazarlama" },
  { tus: "d", ad: "3D", href: "/panel/3d" },
  { tus: "m", ad: "Müzik", href: "/panel/muzik" },
  { tus: "k", ad: "Kitaplık", href: "/panel/kitaplik" },
  { tus: "h", ad: "Ana panel", href: "/panel" },
];

/**
 * Global klavye kısayolları: tek tuşla stüdyo geçişi (yazı alanı dışında). "?" tuşu ve kısayol penceresi
 * üst navigasyonda (components/kabuk/nav/KisayolPenceresi) — her sayfada aynı pencere açılır.
 */
export function Kisayollar() {
  const router = useRouter();

  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      // Input/textarea/contenteditable içindeyken kısayolları çalıştırma.
      const hedef = e.target as HTMLElement;
      if (hedef && (hedef.tagName === "INPUT" || hedef.tagName === "TEXTAREA" || hedef.tagName === "SELECT" || hedef.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!useTercih.getState().kisayollar) return;
      // Kendi tek tuşlu kısayolları olan sayfalar (Canvas editörü) ya da açık bir pencere genel geçişleri devre dışı bırakır.
      if (e.defaultPrevented || document.querySelector("[data-kendi-kisayol], [aria-modal='true']")) return;
      const g = gecisler.find((x) => x.tus === e.key.toLocaleLowerCase("tr-TR"));
      if (g) { e.preventDefault(); router.push(g.href); toast.success(`${g.ad} açıldı`, { duration: 900 }); }
    };
    document.addEventListener("keydown", tus);
    return () => document.removeEventListener("keydown", tus);
  }, [router]);

  return null;
}
