"use client";

import { useEffect, useState } from "react";

/**
 * Uygulama olarak yükleme (ChatGPT/Claude masaüstü uygulaması karşılığı, PWA): servis çalışanı kaydedilir,
 * tarayıcının "beforeinstallprompt" olayı yakalanır ve menüden tetiklenir. iOS Safari'de olay yoktur; yönerge gösterilir.
 */
type KurulumOlayi = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
let bekleyen: KurulumOlayi | null = null;
const dinleyiciler = new Set<() => void>();
const yay = () => dinleyiciler.forEach((f) => f());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); bekleyen = e as KurulumOlayi; yay(); });
  window.addEventListener("appinstalled", () => { bekleyen = null; yay(); });
  if ("serviceWorker" in navigator && window.isSecureContext) {
    window.addEventListener("load", () => { void navigator.serviceWorker.register("/sw.js").catch(() => undefined); }, { once: true });
    if (document.readyState === "complete") void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }
}

export function useKurulum() {
  const [, tik] = useState(0);
  const [kurulu, setKurulu] = useState(false);
  useEffect(() => {
    const f = () => tik((x) => x + 1);
    dinleyiciler.add(f);
    setKurulu(window.matchMedia("(display-mode: standalone)").matches);
    return () => { dinleyiciler.delete(f); };
  }, []);
  const ios = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
  return {
    kurulu,
    /** Tarayıcı yüklemeye izin veriyor (Chrome/Edge) ya da iOS (elle). */
    kurulabilir: !kurulu && (!!bekleyen || ios),
    ios,
    kur: async () => {
      if (!bekleyen) return false;
      await bekleyen.prompt();
      const { outcome } = await bekleyen.userChoice;
      bekleyen = null; yay();
      return outcome === "accepted";
    },
  };
}
