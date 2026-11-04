"use client";

import { useEffect } from "react";
import { perdeyeBagla } from "@/lib/perdeMotor";

/**
 * Sitedeki modal arka planlarını izler: DOM'a `.perde` sınıflı bir öğe girince
 * içine karakter yağmuru canvas'ı ekler, öğe çıkınca durdurur. Böylece her modal
 * tek bir sınıfla aynı perdeyi alır; ayrı bileşen gerekmez.
 */
export function PerdeGozcusu() {
  useEffect(() => {
    const bagli = new Map<HTMLElement, () => void>();
    const tara = () => {
      document.querySelectorAll<HTMLElement>(".perde").forEach((el) => { if (!bagli.has(el)) bagli.set(el, perdeyeBagla(el)); });
      bagli.forEach((dur, el) => { if (!el.isConnected || !el.classList.contains("perde")) { dur(); bagli.delete(el); } });
    };
    let bekleyen = 0;
    const gozcu = new MutationObserver(() => { if (!bekleyen) bekleyen = requestAnimationFrame(() => { bekleyen = 0; tara(); }); });
    gozcu.observe(document.body, { childList: true, subtree: true });
    tara();
    return () => { gozcu.disconnect(); cancelAnimationFrame(bekleyen); bagli.forEach((dur) => dur()); bagli.clear(); };
  }, []);
  return null;
}
