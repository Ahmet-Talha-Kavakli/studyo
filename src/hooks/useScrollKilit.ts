"use client";

import { useEffect, useRef } from "react";

/**
 * Bir modal/lightbox açıkken (aktif=true) arka plan sayfasının kaydırılmasını kilitler.
 * Higgsfield birebir: tam-ekran katman açıkken arka plan SABİT kalır.
 * Scrollbar kaybından doğan layout kaymasını padding ile telafi eder.
 *
 * Kullanım: useScrollKilit(modalAcik)
 */
export function useScrollKilit(aktif: boolean) {
  useEffect(() => {
    if (!aktif) return;
    const govde = document.body;
    const oncekiOverflow = govde.style.overflow;
    const oncekiPadding = govde.style.paddingRight;
    // Scrollbar genişliği kadar sağ padding ekle ki içerik zıplamasın.
    const kaydirmaGenislik = window.innerWidth - document.documentElement.clientWidth;
    govde.style.overflow = "hidden";
    if (kaydirmaGenislik > 0) govde.style.paddingRight = `${kaydirmaGenislik}px`;
    return () => {
      govde.style.overflow = oncekiOverflow;
      govde.style.paddingRight = oncekiPadding;
    };
  }, [aktif]);
}

/**
 * Modal/lightbox açıkken (aktif=true) Escape tuşuna basınca kapatır.
 * Higgsfield birebir: tüm tam-ekran katmanlar Escape ile kapanır.
 *
 * Kullanım: useEscKapat(modalAcik, () => setModalAcik(false))
 */
export function useEscKapat(aktif: boolean, kapat: () => void) {
  // kapat closure'ını ref'te güncel tut — çok-modallı sayfalarda (biri kapanıp
  // öbürü açıldığında aktif=true kalır, effect yeniden bağlanmaz) stale closure önlenir.
  const kapatRef = useRef(kapat);
  kapatRef.current = kapat;
  useEffect(() => {
    if (!aktif) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") kapatRef.current(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [aktif]);
}
