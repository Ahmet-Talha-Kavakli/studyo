import { useEffect, useRef } from "react";

const ODAKLANABILIR = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Modal odak tuzağı: açılınca odağı pencereye taşır (zaten içindeyse dokunmaz), Tab/Shift+Tab
 * pencerenin içinde döner, kapanınca odak açılmadan önceki öğeye geri verilir.
 * Dönen ref'i pencerenin kök öğesine bağla.
 */
export function useOdakTuzagi<T extends HTMLElement = HTMLDivElement>(aktif = true) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const kok = ref.current;
    if (!aktif || !kok) return;
    const onceki = document.activeElement as HTMLElement | null;
    const ogeler = () => [...kok.querySelectorAll<HTMLElement>(ODAKLANABILIR)].filter((e) => e.offsetParent !== null || e === document.activeElement);
    if (!kok.contains(document.activeElement)) {
      const ilk = kok.querySelector<HTMLElement>("[autofocus]") ?? ogeler()[0];
      if (ilk) ilk.focus({ preventScroll: true });
      else { kok.tabIndex = -1; kok.focus({ preventScroll: true }); }
    }
    const tus = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const l = ogeler();
      if (!l.length) return e.preventDefault();
      const ilk = l[0], son = l[l.length - 1];
      const a = document.activeElement;
      if (e.shiftKey && (a === ilk || !kok.contains(a))) { e.preventDefault(); son.focus(); }
      else if (!e.shiftKey && (a === son || !kok.contains(a))) { e.preventDefault(); ilk.focus(); }
    };
    kok.addEventListener("keydown", tus);
    return () => {
      kok.removeEventListener("keydown", tus);
      if (onceki && document.contains(onceki)) onceki.focus({ preventScroll: true });
    };
  }, [aktif]);
  return ref;
}
