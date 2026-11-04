"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * Yüzen katman — açılır menü, popover ve seçiciler için.
 *
 * Menü document.body'ye portal edilir ve `position: fixed` ile konumlanır; bu yüzden
 * overflow-hidden/auto kutular, tablolar, kaydırılan paneller ve transform'lu atalar onu
 * KIRPAMAZ. Konum, menünün yazıldığı yerdeki en yakın konumlu (relative) kutuya göre
 * hesaplanır — eski `absolute right-0 top-full` yerleşimiyle birebir aynı hizalama.
 * Ekrana sığmazsa alttan üste / sağdan sola kendiliğinden döner; kaydırmada ve yeniden
 * boyutlandırmada yeniden konumlanır. Dışarı tıklama ve Esc kapatır.
 */
export type Yerlesim = "alt-sag" | "alt-sol" | "alt-orta" | "ust-sag" | "ust-sol" | "ust-orta" | "sag-ust" | "sol-ust";

export function Yuzen({
  acik, onKapat, yerlesim, ust, alt, sol, sag, ortala, bosluk = 6, className, style, children, z = 400, kaydirmadaKapat = false, etiket, ...dom
}: Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "className" | "style"> & {
  acik: boolean;
  onKapat: () => void;
  /** Kısa yol: "alt-sag" kutunun altında sağ kenarlar hizalı; "sag-ust" kutunun sağında üst kenarlar hizalı. */
  yerlesim?: Yerlesim;
  /** CSS absolute ile aynı anlam, kutuya göre px: ust=8 → top-2; "tam" → top-full. */
  ust?: number | "tam";
  alt?: number | "tam";
  sol?: number | "tam";
  sag?: number | "tam";
  /** Yatayda kutuya ortala (left-1/2 -translate-x-1/2). */
  ortala?: boolean;
  /** Kutudan uzaklık (mt/mb/ml/mr karşılığı) — "tam" kenarlarda uygulanır. */
  bosluk?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  z?: number;
  kaydirmadaKapat?: boolean;
  etiket?: string;
}) {
  const capa = useRef<HTMLSpanElement>(null);
  const kutu = useRef<HTMLDivElement>(null);
  const [konum, setKonum] = useState<{ top: number; left: number; en?: number; boy?: number } | null>(null);

  // Kısa yerleşim adlarını kenar değerlerine çevir
  const k0 = yerlesim ? {
    "alt-sag": { ust: "tam" as const, sag: 0 }, "alt-sol": { ust: "tam" as const, sol: 0 }, "alt-orta": { ust: "tam" as const, ortala: true },
    "ust-sag": { alt: "tam" as const, sag: 0 }, "ust-sol": { alt: "tam" as const, sol: 0 }, "ust-orta": { alt: "tam" as const, ortala: true },
    "sag-ust": { sol: "tam" as const, ust: 0 }, "sol-ust": { sag: "tam" as const, ust: 0 },
  }[yerlesim] as { ust?: number | "tam"; alt?: number | "tam"; sol?: number | "tam"; sag?: number | "tam"; ortala?: boolean } : {};
  const K = { ust: ust ?? k0.ust, alt: alt ?? k0.alt, sol: sol ?? k0.sol, sag: sag ?? k0.sag, ortala: ortala ?? k0.ortala };
  if (K.ust === undefined && K.alt === undefined) K.ust = "tam";

  const hesapla = () => {
    const c = capa.current, k = kutu.current;
    if (!c || !k) return;
    const a = c.getBoundingClientRect();
    // left-0 right-0 gibi iki yatay kenar verildiyse genişlik kutudan gelir
    const en = typeof K.sol === "number" && typeof K.sag === "number" ? a.width - K.sol - K.sag : undefined;
    const g = en ?? k.offsetWidth, y = k.scrollHeight;
    const vw = window.innerWidth, vh = window.innerHeight, kenar = 8;
    const yanda = K.sol === "tam" || K.sag === "tam";
    // Dikey
    let top: number;
    if (K.ust !== undefined) top = K.ust === "tam" ? a.bottom + bosluk : a.top + K.ust;
    else top = K.alt === "tam" ? a.top - bosluk - y : a.bottom - (K.alt as number) - y;
    // Ekrana sığmıyorsa: kutunun dışında açılan menüyü karşı tarafa döndür
    if (top + y > vh - kenar && K.ust === "tam" && a.top - bosluk - y >= kenar) top = a.top - bosluk - y;
    if (top < kenar && K.alt === "tam" && a.bottom + bosluk + y <= vh - kenar) top = a.bottom + bosluk;
    // Yatay
    let left: number;
    if (K.ortala) left = a.left + a.width / 2 - g / 2;
    else if (K.sol !== undefined) left = K.sol === "tam" ? a.right + bosluk : a.left + K.sol;
    else if (K.sag !== undefined) left = K.sag === "tam" ? a.left - bosluk - g : a.right - K.sag - g;
    else left = a.left;
    if (yanda && left + g > vw - kenar) left = a.left - bosluk - g;
    if (yanda && left < kenar) left = a.right + bosluk;
    left = Math.min(Math.max(kenar, left), vw - g - kenar);
    top = Math.min(Math.max(kenar, top), Math.max(kenar, vh - y - kenar));
    /* Ekrandan taşan uzun menü kesilmesin: kalan yüksekliğe sınırla, içi kaysın. */
    const boy = top + y > vh - kenar ? Math.max(160, vh - top - kenar) : undefined;
    setKonum((o) => (o && Math.abs(o.top - top) < 0.5 && Math.abs(o.left - left) < 0.5 && o.en === en && o.boy === boy ? o : { top, left, en, boy }));
  };

  useLayoutEffect(() => { if (acik) hesapla(); else if (konum) setKonum(null); }); // her çizimde (içerik boyu değişebilir)

  // Portal body'ye taşındığı için tema kapsamları (renk/yazı tipi değişkenleri) atalardan toplanır
  const [kapsam, setKapsam] = useState("");
  useLayoutEffect(() => {
    if (!acik || !capa.current) return;
    const siniflar = new Set<string>();
    for (let el: HTMLElement | null = capa.current.parentElement; el; el = el.parentElement)
      for (const c of el.classList) if (/(^|-)kapsam$|^kesfet-tema$|^mobil-lime|^__variable_/.test(c)) siniflar.add(c);
    setKapsam([...siniflar].join(" "));
  }, [acik]);

  useEffect(() => {
    if (!acik) return;
    const kaydir = (e: Event) => {
      if (kutu.current?.contains(e.target as Node)) return;
      if (kaydirmadaKapat) { onKapat(); return; }
      // Bağlı olduğu düğme ekrandan çıktıysa menü ekranın kenarına yapışıp kalmasın: kapat.
      const r = capa.current?.getBoundingClientRect();
      if (r && (r.bottom < 0 || r.top > window.innerHeight)) { onKapat(); return; }
      hesapla();
    };
    const tus = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onKapat(); } };
    window.addEventListener("scroll", kaydir, true);
    window.addEventListener("resize", hesapla);
    window.addEventListener("keydown", tus, true);
    return () => { window.removeEventListener("scroll", kaydir, true); window.removeEventListener("resize", hesapla); window.removeEventListener("keydown", tus, true); };
  }, [acik]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <span ref={capa} aria-hidden className="pointer-events-none absolute inset-0" />
      {acik && typeof document !== "undefined" && createPortal(
        <div className={cn("contents", kapsam)} style={{ background: "none" }}>
          <div className="fixed inset-0" style={{ zIndex: z - 1 }} onMouseDown={(e) => { e.preventDefault(); onKapat(); }} aria-hidden />
          <div ref={kutu} role="menu" aria-label={etiket} {...dom}
            className={cn("fixed", className)}
            style={{ ...style, zIndex: z, top: konum?.top ?? -9999, left: konum?.left ?? -9999, ...(konum?.en ? { width: konum.en } : {}), ...(konum?.boy ? { maxHeight: konum.boy, overflowY: "auto" as const } : {}), visibility: konum ? "visible" : "hidden" }}>
            {children}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
