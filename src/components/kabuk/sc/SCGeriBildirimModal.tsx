"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";

/* ============================================================
   GERİ BİLDİRİM MODALI — Claude'un 👍/👎 sonrası açtığı pencere.

   Claude'da beğen/beğenme tıklanınca oy ANINDA kaydedilmez; önce bu
   pencere açılır, kullanıcı isterse serbest metin ekler ve Gönder'e
   basınca kaydedilir. İptal edilirse oy da geri alınır.

   Referans yapısı (birebir):
     · başlık        → "Olumlu geri bildirim ver" / "Olumsuz geri bildirim ver"
     · alt satır     → "Ayrıntı ekle: (isteğe bağlı)"
     · metin alanı   → olumlu/olumsuzda farklı yer tutucu
     · gizlilik notu → gönderimin ne anlama geldiği + "Daha fazla bilgi"
     · eylemler      → İptal (sade) · Gönder (dolgulu)

   Portal ŞART: modal sohbet akışının içinden çağrılıyor; oradaki
   `overflow` ve `transform` zincirleri position:fixed'i kırpardı.
   Portal kökü .sc-kapsam taşır — yoksa --sc-* değişkenleri body'de
   çözülmez (bu hatayı menülerde bir kez yaşadık).
   ============================================================ */

export type GeriBildirimTur = "artı" | "eksi";

export function SCGeriBildirimModal({
  tur, onKapat, onGonder,
}: {
  /** Hangi oy verildi — başlık ve yer tutucu buna göre değişir. */
  tur: GeriBildirimTur;
  /** İptal / dışarı tıklama / Esc — oy geri alınır. */
  onKapat: () => void;
  /** Gönder — serbest metinle birlikte oy kesinleşir. */
  onGonder: (detay: string) => void;
}) {
  const [detay, setDetay] = useState("");
  const [monte, setMonte] = useState(false);
  const alanRef = useRef<HTMLTextAreaElement>(null);
  const kutuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMonte(true), []);
  useScrollKilit(true);
  useEscKapat(true, onKapat);

  // Claude'da pencere açılır açılmaz metin alanı odaklanır.
  useEffect(() => {
    const t = setTimeout(() => alanRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  /* Odak tuzağı: Tab tuşu pencerenin dışına çıkmasın (klavye kullanıcısı
     arkadaki sohbete düşerse pencereyi kapatmadan geri dönemez). */
  useEffect(() => {
    const tab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !kutuRef.current) return;
      const odaklanabilir = kutuRef.current.querySelectorAll<HTMLElement>(
        'button, textarea, a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!odaklanabilir.length) return;
      const ilk = odaklanabilir[0];
      const son = odaklanabilir[odaklanabilir.length - 1];
      if (e.shiftKey && document.activeElement === ilk) { e.preventDefault(); son.focus(); }
      else if (!e.shiftKey && document.activeElement === son) { e.preventDefault(); ilk.focus(); }
    };
    document.addEventListener("keydown", tab);
    return () => document.removeEventListener("keydown", tab);
  }, []);

  if (!monte) return null;

  const olumlu = tur === "artı";

  return createPortal(
    <div className="sc-kapsam fixed inset-0 z-[170] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onKapat}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <motion.div
        ref={kutuRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gb-baslik"
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="relative w-full max-w-[520px] rounded-[18px] border border-[var(--sc-kenar)] bg-[var(--sc-kart)] p-6 shadow-[0_24px_60px_-18px_rgba(0,0,0,0.6)]">

        <h2 id="gb-baslik" className="text-[19px] font-semibold tracking-[-0.01em] text-[var(--sc-metin)]">
          {olumlu ? "Olumlu geri bildirim ver" : "Olumsuz geri bildirim ver"}
        </h2>

        <label htmlFor="gb-detay" className="mt-5 block text-[13.5px] text-[var(--sc-metin-2)]">
          Ayrıntı ekle: (isteğe bağlı)
        </label>

        <textarea
          id="gb-detay"
          ref={alanRef}
          value={detay}
          onChange={(e) => setDetay(e.target.value)}
          rows={3}
          placeholder={olumlu ? "Bu yanıtın hangi yönü işine yaradı?" : "Bu yanıt neden yeterli olmadı?"}
          className="mt-2 w-full resize-none rounded-xl border border-[var(--sc-aksan)]/60 bg-[var(--sc-zemin)] px-3.5 py-3 text-[14px] leading-[1.5] text-[var(--sc-metin)] outline-none transition-colors placeholder:text-[var(--sc-metin-3)] focus:border-[var(--sc-aksan)]" />

        <p className="mt-4 text-[12.5px] italic leading-relaxed text-[var(--sc-metin-3)]">
          Bu bildirimi göndermek, mevcut sohbetin tamamını modellerimizin
          geliştirilmesi için bize iletir.{" "}
          {/* (kurumsal) bir route group — gerçek URL /gizlilik, /kurumsal/gizlilik DEĞİL. */}
          <a href="/gizlilik" target="_blank" rel="noreferrer"
            className="not-italic text-[var(--sc-aksan)] underline underline-offset-2 hover:opacity-80">
            Daha fazla bilgi
          </a>
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onKapat}
            className="rounded-xl border border-[var(--sc-kenar)] px-4 py-2.5 text-[13.5px] font-medium text-[var(--sc-metin-2)] transition-colors hover:bg-[var(--sc-cip)] hover:text-[var(--sc-metin)]">
            İptal
          </button>
          <button
            type="button"
            onClick={() => onGonder(detay.trim())}
            className="rounded-xl bg-[var(--sc-aksan)] px-5 py-2.5 text-[13.5px] font-semibold text-[var(--sc-aksan-metin)] transition-transform hover:scale-[1.02]">
            Gönder
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

/** Araç çubuğundan kullanmak için sarmalayıcı — AnimatePresence ile çıkış animasyonu. */
export function SCGeriBildirimKatman({
  tur, onKapat, onGonder,
}: {
  tur: GeriBildirimTur | null;
  onKapat: () => void;
  onGonder: (detay: string) => void;
}) {
  return (
    <AnimatePresence>
      {tur && <SCGeriBildirimModal key={tur} tur={tur} onKapat={onKapat} onGonder={onGonder} />}
    </AnimatePresence>
  );
}
