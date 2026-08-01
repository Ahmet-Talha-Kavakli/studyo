"use client";

/**
 * VideoModelSecici — Higgsfield model seçici, BİREBİR.
 * Referans: ~/Desktop/referanslar/video-model-secici/* (11 ekran görüntüsü)
 *
 * Yapı:
 *   [Ara…]
 *   ✦ Sinematik modeller   → ad + açıklama (meta çip YOK)
 *   ✦ Öne çıkan modeller   → ad + rozetler + meta çipleri (çözünürlük · süre)
 *   🎬 Tüm modeller        → aile satırı + `>` ; hover'da SAĞA varyant flyout'u
 *
 * Flyout: ailenin varyantları, her biri ad + rozet + meta çip. Seçili olanda ✓.
 * Kapanma 220ms geciktirilir (mouse satırdan flyout'a giderken kapanmasın).
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { seciciKonumHesapla, seciciStil, type SeciciKonum } from "@/lib/seciciKonum";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, Check, Gem, Clock, Volume2, Sparkles, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkaIkon } from "./MarkaIkon";
import {
  VIDEO_MODELLERI, SINEMATIK_MODELLER, ONE_CIKAN_MODELLER, MODEL_AILE_SIRASI,
  GORSEL_MODELLERI, GORSEL_SINEMATIK, GORSEL_ONE_CIKAN, GORSEL_TUM, MODEL_OZET,
  modelBul, aileVaryantlari, type VideoModelSpec,
} from "@/lib/videoModelSpec";

/* Rozet pill — lime (Yeni/Özel/Premium) veya mavi (Sınırsız) */
function Rozet({ ad }: { ad: string }) {
  const mavi = ad === "Sınırsız";
  return (
    <span className={cn("shrink-0 rounded-[5px] px-1.5 py-[3px] text-[10px] font-black italic tracking-wide",
      mavi ? "bg-gradient-to-r from-sky-400 to-indigo-400 text-white" : "bg-aksan text-zemin")}>
      {ad.toUpperCase()}
    </span>
  );
}

/* Meta çipleri — çözünürlük · süre aralığı */
function Meta({ m }: { m: VideoModelSpec }) {
  const sureler = m.sureler ?? [];
  const aralik = sureler.length > 1 ? `${sureler[0]}sn-${sureler[sureler.length - 1]}sn` : sureler[0] ? `${sureler[0]}sn` : null;
  return (
    <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
      {m.coz && (
        <span className="flex items-center gap-1 rounded-md bg-white/[0.06] px-1.5 py-[3px] text-[11px] text-metin-3">
          <Gem className="h-3 w-3" />{m.coz}
        </span>
      )}
      {aralik && (
        <span className="flex items-center gap-1 rounded-md bg-white/[0.06] px-1.5 py-[3px] text-[11px] text-metin-3">
          <Clock className="h-3 w-3" />{aralik}
        </span>
      )}
    </span>
  );
}

export function VideoModelSecici({
  acik, kapat, seciliModel, onSec, cipRef, kip = "video",
}: {
  acik: boolean; kapat: () => void; seciliModel: string;
  onSec: (ad: string) => void;
  cipRef: React.RefObject<HTMLElement | null>;
  /** Görsel modunda tamamen farklı liste gösterilir (referans: gorsel-model-secici). */
  kip?: "video" | "gorsel";
}) {
  const [ara, setAra] = useState("");
  const [konum, setKonum] = useState<SeciciKonum | null>(null);
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);

  // Aile flyout'u — hover + 220ms kapanma toleransı
  const [flyAile, setFlyAile] = useState<string | null>(null);
  const [flyKonum, setFlyKonum] = useState<{ top: number; left: number } | null>(null);
  const flyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flyIptal = () => { if (flyTimer.current) { clearTimeout(flyTimer.current); flyTimer.current = null; } };
  const flyGecKapat = () => { flyIptal(); flyTimer.current = setTimeout(() => setFlyAile(null), 220); };
  const flyAc = (aile: string, el: HTMLElement) => {
    flyIptal();
    const r = el.getBoundingClientRect();
    const gen = 300, bosluk = 10;
    const varyantSayi = aileVaryantlari(aile).length;
    const yuk = Math.min(varyantSayi * 74 + 16, window.innerHeight * 0.8);
    const sagaSigar = r.right + bosluk + gen < window.innerWidth;
    let left = sagaSigar ? r.right + bosluk : r.left - bosluk - gen;
    left = Math.max(bosluk, Math.min(left, window.innerWidth - bosluk - gen));
    const top = Math.max(bosluk, Math.min(r.top - 10, window.innerHeight - bosluk - yuk));
    setFlyKonum({ top, left });
    setFlyAile(aile);
  };

  useEffect(() => {
    if (!acik) { setAra(""); setFlyAile(null); return; }
    /* Ortak hesap: sığmazsa aşağı açar + ekran içine sıkıştırır. */
    const k = seciciKonumHesapla(cipRef.current, 420);
    if (k) setKonum(k);
  }, [acik, cipRef]);

  const satirTemel = "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors";

  // Arama — aktif kipin havuzunda düz arama (gruplar gizlenir)
  const havuz = kip === "gorsel" ? GORSEL_MODELLERI : VIDEO_MODELLERI;
  const aramaSonuc = useMemo(() => {
    const q = ara.trim().toLowerCase();
    if (!q) return null;
    return havuz.filter((m) => m.ad.toLowerCase().includes(q) || m.aile.toLowerCase().includes(q));
  }, [ara, havuz]);

  /** Görsel modu satırı — ikon kutusu + ad + rozetler + açıklama (referans birebir). */
  const gorselSatir = (ad: string, rozetler?: string[]) => {
    const m = modelBul(ad);
    if (!m) return null;
    return (
      <button key={ad} onClick={() => { onSec(ad); kapat(); }}
        className={cn(satirTemel, seciliModel === ad ? "bg-white/[0.07]" : "hover:bg-white/[0.05]")}>
        <span className="hf-marka flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
          <MarkaIkon marka={m.marka} className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-[15px] font-medium text-metin">{m.ad}</span>
            {rozetler?.map((r) => <Rozet key={r} ad={r} />)}
          </span>
          <span className="mt-0.5 block truncate text-[13px] text-metin-3">{MODEL_OZET[ad] ?? ""}</span>
        </span>
        {seciliModel === ad && <Check className="h-4 w-4 shrink-0 text-aksan" />}
      </button>
    );
  };

  if (!hazir) return null;

  return createPortal(
    <AnimatePresence>
      {acik && konum && (
        <>
          <div className="fixed inset-0 z-[140]" onClick={kapat} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{ ...seciciStil(konum), width: 420 }}
            /* body portalı — `.sinema-kapsam` dışında kalmasın (lime tokenleri). */
            className="sinema-kapsam hf-pop z-[141] flex max-h-[74vh] flex-col overflow-hidden rounded-[22px]">
            {/* Arama */}
            <div className="flex shrink-0 items-center gap-2.5 border-b border-white/[0.06] px-4 py-3.5">
              <Search className="h-[18px] w-[18px] shrink-0 text-metin-3" />
              <input value={ara} onChange={(e) => setAra(e.target.value)} autoFocus
                placeholder="Ara…"
                className="w-full bg-transparent text-[16px] text-metin outline-none placeholder:text-metin-3" />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
              {aramaSonuc ? (
                aramaSonuc.length === 0 ? (
                  <p className="px-3 py-8 text-center text-[14px] text-metin-3">Sonuç yok</p>
                ) : aramaSonuc.map((m) => (
                  <button key={m.ad} onClick={() => { onSec(m.ad); kapat(); }}
                    className={cn(satirTemel, seciliModel === m.ad ? "bg-white/[0.07]" : "hover:bg-white/[0.05]")}>
                    <span className="hf-marka flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                      <MarkaIkon marka={m.marka} className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium text-metin">{m.ad}</span>
                      <Meta m={m} />
                    </span>
                    {seciliModel === m.ad && <Check className="h-4 w-4 shrink-0 text-aksan" />}
                  </button>
                ))
              ) : kip === "gorsel" ? (
                /* ══ GÖRSEL MODU — referans: gorsel-model-secici/* ══
                   Üç grup: Sinematik modeller · Öne çıkan modeller · Tüm modeller.
                   Video'dan farkı: aile/flyout YOK, hepsi düz satır. */
                <>
                  <p className="flex items-center gap-2 px-3 pb-1.5 pt-2 text-[13px] text-metin-3">
                    <Sparkles className="h-3.5 w-3.5" /> Sinematik modeller
                  </p>
                  {GORSEL_SINEMATIK.map((ad) => gorselSatir(ad))}

                  <p className="flex items-center gap-2 px-3 pb-1.5 pt-3 text-[13px] text-metin-3">
                    <Sparkles className="h-3.5 w-3.5" /> Öne çıkan modeller
                  </p>
                  {GORSEL_ONE_CIKAN.map((o) => gorselSatir(o.ad, o.rozetler))}

                  <p className="flex items-center gap-2 px-3 pb-1.5 pt-3 text-[13px] text-metin-3">
                    <Film className="h-3.5 w-3.5" /> Tüm modeller
                  </p>
                  {GORSEL_TUM.map((ad) => gorselSatir(ad))}
                </>
              ) : (
                <>
                  {/* ── Sinematik modeller ── */}
                  <p className="flex items-center gap-2 px-3 pb-1.5 pt-2 text-[13px] text-metin-3">
                    <Sparkles className="h-3.5 w-3.5" /> Sinematik modeller
                  </p>
                  {SINEMATIK_MODELLER.map((s) => (
                    <button key={s.ad} onClick={() => { onSec(s.ad); kapat(); }}
                      className={cn(satirTemel, "hover:bg-white/[0.05]")}>
                      <span className="hf-marka flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                        <MarkaIkon marka="vayra" className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[15px] font-medium text-metin">{s.ad}</span>
                          {s.rozet && <Rozet ad={s.rozet} />}
                        </span>
                        <span className="mt-0.5 block truncate text-[13px] text-metin-3">{s.ozet}</span>
                      </span>
                    </button>
                  ))}

                  {/* ── Öne çıkan modeller ── */}
                  <p className="flex items-center gap-2 px-3 pb-1.5 pt-3 text-[13px] text-metin-3">
                    <Sparkles className="h-3.5 w-3.5" /> Öne çıkan modeller
                  </p>
                  {ONE_CIKAN_MODELLER.map((o) => {
                    const m = modelBul(o.ad);
                    if (!m) return null;
                    return (
                      <button key={o.ad} onClick={() => { onSec(o.ad); kapat(); }}
                        className={cn(satirTemel, seciliModel === o.ad ? "bg-white/[0.07]" : "hover:bg-white/[0.05]")}>
                        <span className="hf-marka flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                          <MarkaIkon marka={m.marka} className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className="truncate text-[15px] font-medium text-metin">{m.ad}</span>
                            {m.ses && <Volume2 className="h-3.5 w-3.5 shrink-0 text-metin-3" />}
                            {o.rozetler?.map((r) => <Rozet key={r} ad={r} />)}
                          </span>
                          <Meta m={m} />
                        </span>
                        {seciliModel === o.ad && <Check className="h-4 w-4 shrink-0 text-aksan" />}
                      </button>
                    );
                  })}

                  {/* ── Tüm modeller (aile → flyout) ── */}
                  <p className="flex items-center gap-2 px-3 pb-1.5 pt-3 text-[13px] text-metin-3">
                    <Film className="h-3.5 w-3.5" /> Tüm modeller
                  </p>
                  {MODEL_AILE_SIRASI.map((a) => {
                    const varyantlar = aileVaryantlari(a.ad);
                    const tekli = varyantlar.length === 1;
                    const m0 = varyantlar[0];
                    return (
                      <button key={a.ad}
                        onMouseEnter={(e) => !tekli && flyAc(a.ad, e.currentTarget)}
                        onMouseLeave={() => !tekli && flyGecKapat()}
                        onClick={() => { if (tekli && m0) { onSec(m0.ad); kapat(); } }}
                        className={cn(satirTemel, flyAile === a.ad ? "bg-white/[0.07]" : "hover:bg-white/[0.05]")}>
                        <span className="hf-marka flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                          <MarkaIkon marka={m0?.marka ?? ""} className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-[15px] font-medium text-metin">{a.ad}</span>
                            {a.rozet && <Rozet ad={a.rozet} />}
                          </span>
                          {tekli && m0 ? <Meta m={m0} />
                            : <span className="mt-0.5 block truncate text-[13px] text-metin-3">{a.ozet}</span>}
                        </span>
                        {!tekli && <ChevronRight className="h-4 w-4 shrink-0 text-metin-3" />}
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </motion.div>

          {/* ── Varyant flyout'u ── */}
          <AnimatePresence>
            {flyAile && flyKonum && (
              <motion.div
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                onMouseEnter={flyIptal} onMouseLeave={flyGecKapat}
                style={{ position: "fixed", top: flyKonum.top, left: flyKonum.left, width: 300 }}
                className="sinema-kapsam hf-pop z-[142] max-h-[80vh] overflow-y-auto rounded-[20px] p-1.5">
                {aileVaryantlari(flyAile).map((v) => (
                  <button key={v.ad} onClick={() => { onSec(v.ad); kapat(); }}
                    className={cn("flex w-full items-start gap-2 rounded-2xl px-3 py-2.5 text-left transition-colors",
                      seciliModel === v.ad ? "bg-white/[0.09]" : "hover:bg-white/[0.05]")}>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-[15px] font-medium text-metin">{v.ad}</span>
                        {v.ses && <Volume2 className="h-3.5 w-3.5 shrink-0 text-metin-3" />}
                      </span>
                      <Meta m={v} />
                    </span>
                    {seciliModel === v.ad && <Check className="mt-1 h-4 w-4 shrink-0 text-aksan" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
