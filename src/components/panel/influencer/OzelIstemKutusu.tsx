"use client";

/**
 * OzelIstemKutusu — Influencer kurucusundaki her seçicinin en altındaki
 * "Özel" kartına tıklayınca SOLA doğru açılan istem kutusu.
 *
 * Kullanıcı isteği (2026-08-01): "Her seçicinin en alına özel seçeneği
 * ekleyeceğiz. Buna tıklayınca sola doğru prompt kutusu açılacak ve prompt
 * olarak yazabilecek — örneğin ten durumlarında özel olarak tarif edecek ne
 * istediğini — ve ona göre üretilecek."
 *
 * Konumlandırma: sağ panel `overflow-y-auto` olduğu için kutu panelin içinde
 * kalırsa kırpılır. Bu yüzden createPortal ile body'ye taşınır ve tetikleyen
 * kartın ekrandaki ölçülen konumuna göre SOLUNA sabitlenir. Sola sığmazsa
 * otomatik sağa döner (dar ekran), dikeyde de görünür alana sıkıştırılır.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Check } from "lucide-react";

/* Sayfa aksanı — portal body'ye taşındığı için .sinema-kapsam kapsamı
   dışında kalır; değişken çözülmezse diye sabit fallback verilir. */
const AKSAN = "var(--sn-lime, #55d6fd)";

const GENISLIK = 300;
const BOSLUK = 10;

export interface OzelIstemKonum {
  /** Tetikleyen kartın viewport'taki dikdörtgeni. */
  ust: number;
  sol: number;
  alt: number;
}

export function OzelIstemKutusu({
  acik,
  konum,
  baslik,
  ipucu,
  deger,
  onKaydet,
  onKapat,
  onTemizle,
}: {
  acik: boolean;
  konum: OzelIstemKonum | null;
  /** Bölüm başlığı — "Ten Durumları" gibi. */
  baslik: string;
  /** Alanına özel örnek metin. */
  ipucu: string;
  /** Kayıtlı istem (varsa düzenlemek için). */
  deger: string;
  onKaydet: (metin: string) => void;
  onKapat: () => void;
  onTemizle: () => void;
}) {
  const [metin, setMetin] = useState(deger);
  const [yer, setYer] = useState<{ top: number; left: number } | null>(null);
  const kutuRef = useRef<HTMLDivElement>(null);
  const alanRef = useRef<HTMLTextAreaElement>(null);

  /* Açılışta kayıtlı değeri yükle + odaklan. */
  useEffect(() => {
    if (acik) {
      setMetin(deger);
      // odak, konum hesaplandıktan sonra verilir ki sayfa zıplamasın
      const t = setTimeout(() => alanRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [acik, deger]);

  /* Konumu ÖLÇEREK hesapla — sola sığmazsa sağa dön, dikeyde ekranda tut. */
  useLayoutEffect(() => {
    if (!acik || !konum) return setYer(null);
    const yukseklik = kutuRef.current?.offsetHeight ?? 210;

    let left = konum.sol - GENISLIK - BOSLUK;
    if (left < BOSLUK) left = konum.alt + BOSLUK; // sola sığmadı → sağa aç
    if (left + GENISLIK > window.innerWidth - BOSLUK) {
      left = Math.max(BOSLUK, window.innerWidth - GENISLIK - BOSLUK);
    }

    let top = konum.ust;
    if (top + yukseklik > window.innerHeight - BOSLUK) {
      top = Math.max(BOSLUK, window.innerHeight - yukseklik - BOSLUK);
    }
    setYer({ top, left });
  }, [acik, konum, metin]);

  /* ESC ile kapat. */
  useEffect(() => {
    if (!acik) return;
    const f = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onKapat(); } };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [acik, onKapat]);

  if (typeof document === "undefined") return null;

  const kaydet = () => {
    const t = metin.trim();
    if (!t) return onTemizle();
    onKaydet(t);
  };

  return createPortal(
    <AnimatePresence>
      {acik && (
        <>
          {/* Dışa tıklayınca kapat — karartma yok, seçici görünür kalsın. */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90]"
            onClick={onKapat}
          />
          <motion.div
            ref={kutuRef}
            initial={{ opacity: 0, x: 8, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-[91] overflow-hidden rounded-2xl border border-white/12 bg-[#1b1c1f] shadow-2xl"
            style={{ width: GENISLIK, top: yer?.top ?? -9999, left: yer?.left ?? -9999 }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] px-3.5 py-2.5">
              <span className="flex min-w-0 items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 shrink-0" style={{ color: AKSAN }} />
                <span className="truncate text-[12.5px] font-semibold text-white">{baslik} · Özel</span>
              </span>
              <button onClick={onKapat} aria-label="Kapat"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-3.5">
              <textarea
                ref={alanRef}
                value={metin}
                onChange={(e) => setMetin(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); kaydet(); }
                }}
                rows={4}
                maxLength={400}
                placeholder={ipucu}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[13px] leading-relaxed text-white outline-none transition-colors placeholder:text-white/35 focus:border-[color:var(--sn-lime,#55d6fd)]/60"
              />
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[10.5px] text-white/35">⌘↵ ile kaydet</span>
                <span className="text-[10.5px] tabular-nums text-white/35">{metin.length}/400</span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                {deger && (
                  <button
                    onClick={onTemizle}
                    className="rounded-lg border border-white/12 px-3 py-1.5 text-[12px] font-medium text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white"
                  >
                    Kaldır
                  </button>
                )}
                <button
                  onClick={kaydet}
                  disabled={!metin.trim()}
                  className="ml-auto flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12.5px] font-bold transition-transform enabled:hover:scale-[1.03] disabled:opacity-40"
                  style={{ background: AKSAN, color: "#0a0a0a" }}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} /> Uygula
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
