"use client";

/**
 * UretimKartMenu — Higgsfield Cinema Studio üretim kartı kebab (⋯) context menüsü (spec 106-108) BİREBİR.
 *
 * Menü sırası (alt-menülü olanlar › ile):
 *   Aç / Videoya çevir›(Başlangıç karesi, Bitiş karesi) / Yeniden oluştur / Referans /
 *   Element oluştur / Ek işlemler›(3D sahne, Renk çıkar[Yeni], Çoklu çekim, Inpaint, Cilt
 *   geliştirici, Yeniden aydınlat, Büyüt, Açılar) / — / Beğen / Paylaş›(Bağlantı kopyala, X,
 *   WhatsApp, Pinterest, Linkedin) / Yayınla / — / İndir / Kopyala / Görseli kopyala / Görsel URL kopyala.
 *
 * Alt-menüler hover'da sağa açılır. .sinema-kapsam içinde render edilir → --sn-* erişilebilir.
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "@/lib/toast";
import {
  MoreHorizontal,
  Maximize2,
  Video,
  RefreshCw,
  UserRound,
  AtSign,
  Layers,
  Heart,
  Share2,
  Upload,
  Download,
  Copy,
  Image as ImageIcon,
  Link2,
  ChevronRight,
  Box,
  Palette,
  Film,
  Brush,
  Sparkles,
  Sun,
  Aperture,
  X as XIkon,
  MessageCircle,
  Bookmark,
  Contact,
} from "lucide-react";

interface UretimKartMenuProps {
  /** Herhangi bir menü aksiyonu tetiklendiğinde çağrılır (aksiyon adı ile). */
  onAcsyon?: (ad: string) => void;
  /** Menü butonunun hizalanacağı taraf (kart içinde). Varsayılan sağ. */
  hiza?: "sag" | "sol";
  /** Tetikleyici butonu özelleştirmek isteyenler için (opsiyonel). */
  className?: string;
}

type AltOge = { ad: string; ikon: typeof Copy; yeni?: boolean };
type MenuOge =
  | { tur: "ayrac" }
  | { tur: "oge"; ad: string; ikon: typeof Copy; alt?: AltOge[] };

const VIDEO_ALT: AltOge[] = [
  { ad: "Başlangıç karesi", ikon: Video },
  { ad: "Bitiş karesi", ikon: Film },
];

const EK_ALT: AltOge[] = [
  { ad: "3D sahne oluştur", ikon: Box },
  { ad: "Renk çıkar", ikon: Palette, yeni: true },
  { ad: "Çoklu çekim", ikon: Layers },
  { ad: "Inpaint", ikon: Brush },
  { ad: "Cilt geliştirici", ikon: Sparkles },
  { ad: "Yeniden aydınlat", ikon: Sun },
  { ad: "Büyüt", ikon: Maximize2 },
  { ad: "Açılar", ikon: Aperture },
];

const PAYLAS_ALT: AltOge[] = [
  { ad: "Bağlantı kopyala", ikon: Link2 },
  { ad: "X'te paylaş", ikon: XIkon },
  { ad: "WhatsApp", ikon: MessageCircle },
  { ad: "Pinterest", ikon: Bookmark },
  { ad: "Linkedin", ikon: Contact },
];

const MENU: MenuOge[] = [
  { tur: "oge", ad: "Aç", ikon: Maximize2 },
  { tur: "oge", ad: "Videoya çevir", ikon: Video, alt: VIDEO_ALT },
  { tur: "oge", ad: "Yeniden oluştur", ikon: RefreshCw },
  { tur: "oge", ad: "Referans", ikon: UserRound },
  { tur: "oge", ad: "Element oluştur", ikon: AtSign },
  { tur: "oge", ad: "Ek işlemler", ikon: Layers, alt: EK_ALT },
  { tur: "ayrac" },
  { tur: "oge", ad: "Beğen", ikon: Heart },
  { tur: "oge", ad: "Paylaş", ikon: Share2, alt: PAYLAS_ALT },
  { tur: "oge", ad: "Yayınla", ikon: Upload },
  { tur: "ayrac" },
  { tur: "oge", ad: "İndir", ikon: Download },
  { tur: "oge", ad: "Kopyala", ikon: Copy },
  { tur: "oge", ad: "Görseli kopyala", ikon: ImageIcon },
  { tur: "oge", ad: "Görsel URL kopyala", ikon: Link2 },
];

export function UretimKartMenu({ onAcsyon, hiza = "sag", className }: UretimKartMenuProps) {
  const [acik, setAcik] = useState(false);
  const [altAcik, setAltAcik] = useState<string | null>(null);

  function tetikle(ad: string) {
    onAcsyon?.(ad);
    toast(ad);
    setAcik(false);
    setAltAcik(null);
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setAcik((v) => !v);
        }}
        className="grid h-8 w-8 place-items-center rounded-lg transition hover:brightness-125"
        style={{ background: "rgba(20,20,22,.72)", color: "var(--sn-metin)" }}
        title="Daha fazla"
      >
        <MoreHorizontal size={17} />
      </button>

      <AnimatePresence>
        {acik && (
          <>
            {/* dış tık kapatıcı */}
            <div
              className="fixed inset-0 z-[140]"
              onClick={() => {
                setAcik(false);
                setAltAcik(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ duration: 0.14 }}
              className="absolute z-[141] mt-1 w-[230px] rounded-2xl border py-1.5 shadow-2xl"
              style={{
                background: "var(--sn-menu)",
                borderColor: "var(--sn-kenar)",
                [hiza === "sag" ? "right" : "left"]: 0,
                backdropFilter: "blur(12px)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {MENU.map((oge, i) => {
                if (oge.tur === "ayrac") {
                  return (
                    <div
                      key={`ayrac-${i}`}
                      className="my-1.5 h-px"
                      style={{ background: "var(--sn-kenar)" }}
                    />
                  );
                }
                const Ikon = oge.ikon;
                const varAlt = !!oge.alt?.length;
                return (
                  <div
                    key={oge.ad}
                    className="relative"
                    onMouseEnter={() => setAltAcik(varAlt ? oge.ad : null)}
                    onMouseLeave={() => varAlt && setAltAcik(null)}
                  >
                    <button
                      onClick={() => !varAlt && tetikle(oge.ad)}
                      className="flex w-full items-center gap-3 px-3.5 py-2 text-sm transition hover:brightness-125"
                      style={{
                        color: "var(--sn-metin)",
                        background:
                          varAlt && altAcik === oge.ad ? "var(--sn-cip)" : "transparent",
                      }}
                    >
                      <Ikon size={16} style={{ color: "var(--sn-metin-2)" }} />
                      <span className="flex-1 text-left">{oge.ad}</span>
                      {varAlt && (
                        <ChevronRight size={15} style={{ color: "var(--sn-metin-3)" }} />
                      )}
                    </button>

                    {/* Alt-menü (sağa açılır) */}
                    <AnimatePresence>
                      {varAlt && altAcik === oge.ad && (
                        <motion.div
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -6 }}
                          transition={{ duration: 0.13 }}
                          className="absolute top-0 z-[142] w-[220px] rounded-2xl border py-1.5 shadow-2xl"
                          style={{
                            background: "var(--sn-menu)",
                            borderColor: "var(--sn-kenar)",
                            backdropFilter: "blur(12px)",
                            [hiza === "sag" ? "right" : "left"]: "100%",
                            [hiza === "sag" ? "marginRight" : "marginLeft"]: 6,
                          }}
                        >
                          {oge.alt!.map((alt) => {
                            const AltIkon = alt.ikon;
                            return (
                              <button
                                key={alt.ad}
                                onClick={() => tetikle(alt.ad)}
                                className="flex w-full items-center gap-3 px-3.5 py-2 text-sm transition hover:brightness-125"
                                style={{ color: "var(--sn-metin)" }}
                              >
                                <AltIkon
                                  size={16}
                                  style={{ color: "var(--sn-metin-2)" }}
                                />
                                <span className="flex-1 text-left">{alt.ad}</span>
                                {alt.yeni && (
                                  <span
                                    className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                                    style={{
                                      background: "var(--sn-lime)",
                                      color: "var(--sn-lime-metin)",
                                    }}
                                  >
                                    Yeni
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
