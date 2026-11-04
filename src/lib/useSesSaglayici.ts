"use client";

import { useEffect, useState } from "react";

/** Ses için gerçek sağlayıcı bağlı mı? null = henüz bilinmiyor. Sonuç oturum boyunca önbellekte. */
let onbellek: boolean | null = null;
let istek: Promise<boolean> | null = null;

export function useSesSaglayici(): boolean | null {
  const [gercek, setGercek] = useState<boolean | null>(onbellek);
  useEffect(() => {
    if (onbellek !== null) return;
    istek ??= fetch("/api/saglayici-durum")
      .then((r) => r.json())
      .then((j: { durum?: { ses?: { gercek?: boolean } } }) => Boolean(j.durum?.ses?.gercek))
      .catch(() => false);
    let iptal = false;
    void istek.then((g) => { onbellek = g; if (!iptal) setGercek(g); });
    return () => { iptal = true; };
  }, []);
  return gercek;
}
