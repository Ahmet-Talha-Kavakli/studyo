"use client";

/**
 * YuklenenOnizleme — composer'lardaki yüklenmiş görsel/video kutusu.
 *
 * Hover'da SAĞA doğru büyük önizleme açar (kullanıcı isteği 2026-07-31).
 * Küçük kutuda ne yüklediğin seçilemiyordu; /panel/video'da çözülen desen
 * buraya taşındı ki explainer, shorts ve pazarlama da aynısını kullansın.
 *
 * İki kritik nokta (ikisi de ölçümle bulundu):
 *  1) Önizleme PORTAL ile body'ye çıkar. Composer'ın kendi yığma bağlamı ve
 *     overflow'u yüzünden kutu içinde kalan önizleme ALTTA kalıyordu
 *     ("önizlemeler altta kalıyor").
 *  2) VİDEO dosyası <img> ile gösterilemez — kutu boş "şerit" kalıyordu.
 *     Tür otomatik algılanır; video döngüde sessiz oynar.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/** data-uri veya uzantıdan video olup olmadığını anlar. */
export function videoMu(url: string): boolean {
  return url.startsWith("data:video") || /\.(mp4|webm|mov|m4v)($|\?)/i.test(url);
}

export function YuklenenOnizleme({
  url, alt = "", yuvarlak = "rounded-[12px]", kapla = true, enBuyuk = 280,
}: {
  url: string;
  alt?: string;
  yuvarlak?: string;
  /** true → kutuyu tamamen doldurur (absolute inset-0). false → akış içinde. */
  kapla?: boolean;
  /** Önizleme kutusunun en büyük kenarı (px). */
  enBuyuk?: number;
}) {
  const [acik, setAcik] = useState(false);
  const [yer, setYer] = useState<{ top: number; left: number } | null>(null);
  const kokRef = useRef<HTMLSpanElement>(null);
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);

  const video = videoMu(url);

  const ac = () => {
    const r = kokRef.current?.getBoundingClientRect();
    if (!r) return;
    /* Sağa sığmıyorsa sola aç — dar ekranda önizleme ekran dışına taşıyordu. */
    const sagaSigar = r.right + 12 + enBuyuk < window.innerWidth;
    setYer({
      top: r.top + r.height / 2,
      left: sagaSigar ? r.right + 10 : Math.max(8, r.left - 10 - enBuyuk),
    });
    setAcik(true);
  };

  return (
    <span ref={kokRef}
      className={cn(kapla ? "absolute inset-0" : "relative block", yuvarlak)}
      onMouseEnter={ac} onMouseLeave={() => setAcik(false)}>
      {video ? (
        <video src={url} autoPlay loop muted playsInline preload="metadata"
          className={cn("absolute inset-0 h-full w-full object-cover", yuvarlak)} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} className={cn("absolute inset-0 h-full w-full object-cover", yuvarlak)} />
      )}

      {hazir && acik && yer && createPortal(
        <span className="pointer-events-none fixed z-[200]"
          style={{ top: yer.top, left: yer.left, translate: "0 -50%" }}>
          <span className="glass-kenar block overflow-hidden rounded-xl p-1 shadow-2xl shadow-black/60">
            {video ? (
              <video src={url} autoPlay loop muted playsInline
                className="block rounded-lg object-contain"
                style={{ maxHeight: enBuyuk, maxWidth: enBuyuk }} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" aria-hidden className="block rounded-lg object-contain"
                style={{ maxHeight: enBuyuk, maxWidth: enBuyuk }} />
            )}
          </span>
        </span>,
        document.body,
      )}
    </span>
  );
}
