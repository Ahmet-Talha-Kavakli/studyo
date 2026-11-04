"use client";

import { useEffect, useState } from "react";

/** Sağlayıcı bazında bağlantı durumu (ad → hazır mı). Oturum boyunca önbellekte; anahtarlar asla gelmez. */
let onbellek: Record<string, boolean> | null = null;
export function useSaglayicilar(): Record<string, boolean> | null {
  const [d, setD] = useState(onbellek);
  useEffect(() => {
    if (onbellek) return;
    let iptal = false;
    fetch("/api/saglayici-durum").then((r) => r.json()).then((j: { saglayicilar?: Record<string, boolean> }) => {
      onbellek = j.saglayicilar ?? {}; if (!iptal) setD(onbellek);
    }).catch(() => { if (!iptal) setD({}); });
    return () => { iptal = true; };
  }, []);
  return d;
}
