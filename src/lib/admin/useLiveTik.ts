"use client";

import { useState, useEffect } from "react";

/**
 * Live Ops tik sayacı — her `ms` (varsayılan 5sn) artar. Mount'ta 0 başlar
 * (SSR-safe), client'ta ilerler. Dashboard canlı metrikleri buna bağlanır.
 */
export function useLiveTik(ms = 5000): number {
  const [tik, setTik] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTik((x) => x + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
  return tik;
}
