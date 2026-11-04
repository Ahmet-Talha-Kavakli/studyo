"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useRef, useEffect, cloneElement, isValidElement, type ReactNode, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type Side = "top" | "bottom" | "left" | "right";

/**
 * Vayra Tooltip — ikonların üstüne gelince açıklama çıkar.
 * Örn: ev ikonu → "Ana Sayfa", zil → "Bildirimler".
 * FIXED-PORTAL: konum viewport'a göre hesaplanır, böylece `overflow-hidden`
 * kapsayıcılar (galeri kartları vb.) tooltip'i KIRPAMAZ. Erişilebilir (aria-label fallback).
 */
export function Tooltip({
  label,
  children,
  side = "bottom",
  delay = 120,
  className,
}: {
  label: string;
  children: ReactNode;
  side?: Side;
  delay?: number;
  /** Sarmalayıcı sınıfı (varsayılan: satır içi). Tam genişlik düğmeler için ör. "flex flex-1". */
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Konum + gerçek yön (yer yoksa ters çevrilmiş) + yatay hizalama TEK objede — state race olmasın.
  const [yer, setYer] = useState<{ top: number; left: number; side: Side; hiz: "orta" | "sol" | "sag" } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sarmalRef = useRef<HTMLSpanElement>(null);

  useEffect(() => setMounted(true), []);

  // Ölçülen konum + gerçek hizalama. hiz: top/bottom'da yatay yaslanma
  // ("orta" | "sol" | "sag") — uzun metin ekran kenarına taşarsa ok'u koruyup
  // kutuyu i'nin sol/sağ kenarına yaslar (Higgsfield birebir).
  const konumHesapla = (): { top: number; left: number; side: Side; hiz: "orta" | "sol" | "sag" } | null => {
    const r = sarmalRef.current?.getBoundingClientRect();
    if (!r) return null;
    const bosluk = 8;
    let s = side;
    // Yatay taşma: sola/sağa GERÇEKTEN yer yoksa ters çevir. Eşik = tooltip'in
    // tahmini genişliği (sabit 150px değil) — böylece kısa etiketli araç ikonu
    // solda kalsa bile tooltip ikonu ÖRTMEZ, soluna açılır (M6).
    const flipEsik = Math.min(320, 24 + label.length * 6.4) + bosluk + 6;
    if (side === "left" && r.left < flipEsik) s = "right";
    else if (side === "right" && window.innerWidth - r.right < flipEsik) s = "left";
    // Dikey taşma: üstte yer yoksa alta, altta yer yoksa üste çevir.
    else if (side === "top" && r.top < 56) s = "bottom";
    else if (side === "bottom" && window.innerHeight - r.bottom < 56) s = "top";

    const merkezX = r.left + r.width / 2;
    // top/bottom: ortalanan tooltip'in yarısı ekran kenarını aşarsa kenara yasla.
    // Tahmini genişlik ~ metin uzunluğu (whitespace-nowrap). Aşımı ok'u koruyacak
    // şekilde sol/sağ yaslama ile çöz.
    const tahminiGen = Math.min(320, 24 + label.length * 6.4);
    let hiz: "orta" | "sol" | "sag" = "orta";
    if (s === "top" || s === "bottom") {
      if (merkezX - tahminiGen / 2 < 12) hiz = "sol";        // sola taşıyor → ikonun sol kenarına yasla
      else if (merkezX + tahminiGen / 2 > window.innerWidth - 12) hiz = "sag"; // sağa taşıyor
    }
    const yatay = hiz === "sol" ? r.left : hiz === "sag" ? r.right : merkezX;
    switch (s) {
      case "top": return { top: r.top - bosluk, left: yatay, side: s, hiz };
      case "bottom": return { top: r.bottom + bosluk, left: yatay, side: s, hiz };
      case "left": return { top: r.top + r.height / 2, left: r.left - bosluk, side: s, hiz: "orta" };
      case "right": return { top: r.top + r.height / 2, left: r.right + bosluk, side: s, hiz: "orta" };
    }
  };

  // Tıklanınca ipucu kapanır ve fare çıkana dek yeniden açılmaz (açılan menünün üstünde asılı kalmasın).
  const basildiRef = useRef(false);
  const show = () => {
    if (basildiRef.current) return;
    timerRef.current = setTimeout(() => { setYer(konumHesapla()); setOpen(true); }, delay);
  };
  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(false);
  };

  // Tooltip açıkken scroll olursa kapat — fixed konum ölçümü eskiyip tooltip
  // havada/yanlış yerde asılı kalıyordu.
  useEffect(() => {
    if (!open) return;
    const kapat = () => setOpen(false);
    window.addEventListener("scroll", kapat, true);
    return () => window.removeEventListener("scroll", kapat, true);
  }, [open]);

  // Fixed konumda kendini hizalama transform'u (side + yatay hiz'e göre).
  // top/bottom'da hiz "sol"→kutu sola yaslı (sol kenar ikonla hizalı),
  // "sag"→sağa yaslı, "orta"→ortalı.
  /* CSS `translate` özelliği için DEĞER çifti döndürür ("x y") — `transform`
     fonksiyon sözdizimi (`translate(...)`) DEĞİL. Bkz. style'daki açıklama:
     transform'u framer-motion yönetiyor, hizalamayı ayrı özellikte tutuyoruz. */
  const yatayCevir = (s: Side, hiz: "orta" | "sol" | "sag") => {
    if (s === "left") return "-100% -50%";
    if (s === "right") return "0 -50%";
    const y = s === "top" ? "-100%" : "0";
    const x = hiz === "sol" ? "-14px" : hiz === "sag" ? "calc(-100% + 14px)" : "-50%";
    return `${x} ${y}`;
  };
  const origin: Record<Side, string> = {
    top: "origin-bottom",
    bottom: "origin-top",
    left: "origin-right",
    right: "origin-left",
  };

  // Erişilebilirlik: child interaktif öğeye kendi aria-label'ı yoksa tooltip metnini ata.
  const erisilebilirCocuk =
    isValidElement(children) && !(children.props as { "aria-label"?: string })["aria-label"]
      ? cloneElement(children as ReactElement<{ "aria-label"?: string }>, { "aria-label": label })
      : children;

  return (
    <span
      ref={sarmalRef}
      className={cn("relative", className ?? "inline-flex")}
      onMouseEnter={show}
      onMouseLeave={() => { basildiRef.current = false; hide(); }}
      onPointerDown={() => { basildiRef.current = true; hide(); }}
      onFocus={(e) => { if (e.target.matches(":focus-visible")) show(); }}
      onBlur={hide}
    >
      {erisilebilirCocuk}
      {/* Tooltip PORTAL ile document.body'ye çıkar — aksi halde hover'da kartın
          transform'u (translateY/scale) fixed konumu kendine göreli yapıp
          tooltip'i yanlış/alakasız yere kaydırıyordu. Portal transformdan kaçar. */}
      {mounted && createPortal(
        <AnimatePresence>
          {open && yer && (
            <motion.span
              role="tooltip"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              /* KRİTİK: hizalama `transform` DEĞİL `translate` ile yapılır.
                 framer-motion `scale` animasyonu için transform'u kendisi
                 yönetiyor ve inline transform'u EZİYORDU (computed: "none") —
                 bu yüzden tooltip ham left/top'a oturup ikonu örtüyordu
                 (kullanıcı: "yazılar ikonun tam üstüne çıkıyor").
                 `translate` ayrı bir CSS özelliği; scale ile çakışmaz. */
              style={{ position: "fixed", top: yer.top, left: yer.left, translate: yatayCevir(yer.side, yer.hiz), maxWidth: "min(320px, calc(100vw - 24px))" }}
              className={cn(
                /* w-max: fixed kutu sağ kenara yakınken kalan dar alana göre daralıp
                   her kelimeyi alt satıra atıyordu; genişlik metinden gelir. */
                "pointer-events-none z-[100] w-max rounded-lg px-2.5 py-1.5 text-xs font-medium leading-snug",
                "menu-surface text-white",
                origin[yer.side],
              )}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </span>
  );
}
