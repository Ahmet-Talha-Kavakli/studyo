"use client";

/**
 * KucukComposer — Üretimlerim/Favorilerim sayfalarındaki alt yüzen composer.
 *
 * Referans (kullanıcı ekran görüntüsü + üretilenler-sayfası/):
 *   KÜÇÜK durum  → tek satırlık çubuk: "Hayal ettiğin sahneyi anlat…" + sağda
 *                  lime yuvarlak-kare ✦ düğmesi. Başka hiçbir şey yok.
 *   HOVER        → tam composer açılır (sinema anasayfasındakinin AYNISI).
 *   Mouse çıkınca 3 SANİYE sonra tekrar küçük çubuğa döner.
 *
 * Not: küçük durumda `children` DOM'da kalır ama gizlenir — böylece composer'ın
 * durumu (model, çipler, prompt) korunur, her açılışta sıfırlanmaz.
 */

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

/** Mouse çıktıktan kaç ms sonra küçülsün. */
const KUCULME_GECIKME = 3000;

export function KucukComposer({ children, ustBolum }: {
  children: React.ReactNode;
  /** Composer'ın ÜSTÜNDE görünecek bölüm (seçici hapları) — yalnız büyükken. */
  ustBolum?: React.ReactNode;
}) {
  const [buyuk, setBuyuk] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const iptal = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  const buyut = () => { iptal(); setBuyuk(true); };
  const gecKucult = () => {
    iptal();
    timer.current = setTimeout(() => {
      // Panelin dışına portallanmış bir menü/modal açıksa küçültme —
      // kullanıcı model seçiyor ya da bir popover'la uğraşıyor olabilir.
      if (document.querySelector(".hf-pop, .hf-cam")) { gecKucult(); return; }
      setBuyuk(false);
    }, KUCULME_GECIKME);
  };
  useEffect(() => iptal, []);

  return (
    /* Sol kenar sidebar genişliği kadar içeride başlar — aksi halde composer
       tüm ekrana göre ortalanıp içerik alanına göre sola kayık duruyordu.
       Sidebar daraltılıp genişletilebildiği için ölçü CSS değişkeninden gelir
       (StudyoSidebar `--sidebar-genislik`i günceller). */
    <div style={{ left: "var(--sidebar-genislik, 0px)" }}
      className="pointer-events-none fixed bottom-0 right-0 z-[60] flex justify-center px-4 pb-5">
      <div
        onMouseEnter={buyut}
        onMouseLeave={gecKucult}
        onFocusCapture={buyut}
        className="pointer-events-auto w-full max-w-[1180px]">
        {/* Seçici hapları — composer'ın üstünde, yalnız büyükken görünür.
            Küçükken yer kaplamasın diye yükseklik de animasyonlanır. */}
        {ustBolum && (
          <motion.div
            initial={false}
            animate={{ opacity: buyuk ? 1 : 0, y: buyuk ? 0 : 10, height: buyuk ? "auto" : 0 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden", pointerEvents: buyuk ? "auto" : "none" }}>
            {ustBolum}
          </motion.div>
        )}
        {/* Çapraz geçiş: ikisi de aynı ızgara hücresinde, ALT-ORTAdan büyür.
            `place-items-center` + `items-end` → küçük çubuk tam ortada durur,
            büyürken merkez kaymadan açılır (yağ gibi akıcı). */}
        <div className="grid place-items-center">
          {/* KÜÇÜK ÇUBUK — ortalanmış */}
          <motion.button
            onClick={buyut}
            initial={false}
            animate={{
              opacity: buyuk ? 0 : 1,
              scale: buyuk ? 1.04 : 1,
              filter: buyuk ? "blur(6px)" : "blur(0px)",
            }}
            transition={{
              opacity: { duration: buyuk ? 0.18 : 0.3, ease: "easeOut" },
              scale: { type: "spring", stiffness: 260, damping: 30, mass: 0.9 },
              filter: { duration: 0.22 },
            }}
            style={{ gridArea: "1/1", pointerEvents: buyuk ? "none" : "auto", transformOrigin: "center bottom" }}
            className="hf-kabuk flex h-[74px] w-[min(860px,100%)] items-center gap-3 rounded-[22px] pl-6 pr-3 text-left">
            <span className="flex-1 truncate text-[17px] text-metin-3">Hayal ettiğin sahneyi anlat…</span>
            <span className="hf-uret flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl">
              <Sparkles className="h-5 w-5" />
            </span>
          </motion.button>

          {/* TAM COMPOSER — küçükken saydam ama DOM'da (durum korunur) */}
          <motion.div
            initial={false}
            animate={{
              opacity: buyuk ? 1 : 0,
              scale: buyuk ? 1 : 0.94,
              filter: buyuk ? "blur(0px)" : "blur(6px)",
            }}
            transition={{
              opacity: { duration: buyuk ? 0.3 : 0.18, ease: "easeOut" },
              scale: { type: "spring", stiffness: 260, damping: 30, mass: 0.9 },
              filter: { duration: 0.22 },
            }}
            style={{ gridArea: "1/1", width: "100%", pointerEvents: buyuk ? "auto" : "none", transformOrigin: "center bottom" }}>
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
