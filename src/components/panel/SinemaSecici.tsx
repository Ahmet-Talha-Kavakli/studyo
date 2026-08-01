"use client";

/**
 * SinemaSecici — Sinema Stüdyo'nun Tür/Stil/Kamera seçicileri, BİREBİR.
 *
 * Referans: modeller/video/cinema-studio-3.5 (çark) ve 3.0 (ızgara).
 *
 * İki modal paradigması:
 *  ÇARK (3.5)  — yarı saydam panel, SOLDA dev daire önizleme, SAĞDA dikey liste;
 *                seçili öğe ortada BÜYÜK ve tam opak, uzaklaştıkça küçülüp soluyor;
 *                listenin sağında merkezi kuşatan yukarı/aşağı ok butonları.
 *                Çok sütunlu sürümde (Stil/Kamera) her sütun kendi çarkı.
 *  IZGARA (3.0) — 6 sütunlu görsel kart ızgarası, seçilide lime çerçeve + lime ✓ rozet.
 *
 * Haplar composer'ın üstünde: yuvarlak küçük görsel + "Etiket: Değer".
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronUp, ChevronDown, Check, Clapperboard, Pencil } from "lucide-react";
import { cn, onizlemeArka } from "@/lib/utils";
import { sinemaGercek } from "@/lib/sinemaVeri";

/* Türkçe → ascii slug (stil/kamera seçici dosya adları için). */
function seciciSlug(s: string): string {
  return s.toLowerCase()
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
/* Gerçek görseli olan seçici önekleri: stil-*, kamera-* (slug'lı dosya) + tur-* (sinemaGercek). */
function seciciArka(tohum: string, kat: string): string {
  // tur-<ad> → sinemaGercek doğrudan çözer
  const g = sinemaGercek(tohum);
  if (g) return `url("${g}") center/cover no-repeat`;
  // stil-<ad> / kamera-<ad> → slug'lı dosya
  const m = tohum.match(/^(stil|kamera)-(.+)$/);
  if (m) return `url("/gercek/sinema/${m[1]}-${seciciSlug(m[2])}.webp") center/cover no-repeat`;
  return onizlemeArka(tohum, kat);
}
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import type { HapTanim, SeciciOge } from "@/lib/sinemaSecici";

/* ------------------------------------------------------------------ */
/* Tek sütunlu ÇARK — 3.5 Tür modalı                                   */
/* ------------------------------------------------------------------ */
function Cark({
  ogeler, secili, onSec, tohumOnEk,
}: {
  ogeler: SeciciOge[]; secili: string; onSec: (ad: string) => void; tohumOnEk: string;
}) {
  const i = Math.max(0, ogeler.findIndex((o) => o.ad === secili));
  const n = ogeler.length;
  const kaydir = (yon: 1 | -1) => onSec(ogeler[(i + yon + n) % n].ad);

  /* ANİMASYON: her öğe listede SABİT kalır, sadece merkeze olan mesafesine göre
     y-konumu/boyutu/opaklığı değişir. Böylece seçim değişince öğeler yerlerini
     yumuşakça kaydırır (önceki sürümde liste yeniden diziliyor, zıplıyordu). */
  const SATIR = 70;   // merkeze göre bir basamağın piksel yüksekliği
  /** i'ye göre en kısa dairesel mesafe (−n/2..n/2) — çark sonsuz döner. */
  const mesafe = (j: number) => {
    let d = j - i;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  };

  return (
    <div className="flex h-[400px] shrink-0 items-center gap-8 px-8 pb-8">
      {/* SOL: dev daire önizleme — seçim değişince çapraz geçiş */}
      <div className="relative hidden h-[300px] w-[300px] shrink-0 sm:block lg:h-[340px] lg:w-[340px]">
        <AnimatePresence mode="popLayout">
          <motion.div key={secili}
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 rounded-full"
            style={{ background: seciciArka(`${tohumOnEk}-${secili}`, ogeler[i]?.kat ?? "sinematik") }} />
        </AnimatePresence>
      </div>

      {/* SAĞ: dikey çark listesi — öğeler animasyonla kayar */}
      <div className="relative flex min-h-0 flex-1 items-center">
        <div className="relative w-full overflow-hidden" style={{ height: SATIR * 5 }}>
          {ogeler.map((oge, j) => {
            const d = mesafe(j);
            const uzak = Math.abs(d);
            if (uzak > 2.6) return null;      // görünmeyenleri çizme
            const merkez = d === 0;
            const boy = merkez ? 62 : uzak === 1 ? 46 : 34;
            return (
              <motion.button key={oge.ad} onClick={() => onSec(oge.ad)}
                initial={false}
                animate={{
                  y: d * SATIR,
                  opacity: merkez ? 1 : uzak === 1 ? 0.5 : 0.22,
                  scale: merkez ? 1 : uzak === 1 ? 0.94 : 0.86,
                }}
                transition={{ type: "spring", stiffness: 380, damping: 34, mass: 0.7 }}
                className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center gap-4 rounded-2xl px-3 py-1.5 text-left hover:bg-white/[0.04]">
                <motion.span className="shrink-0 rounded-full"
                  animate={{ width: boy, height: boy }}
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  style={{ background: seciciArka(`${tohumOnEk}-${oge.ad}`, oge.kat) }} />
                <motion.span className="truncate text-white"
                  animate={{ fontSize: merkez ? 27 : uzak === 1 ? 21 : 17, fontWeight: merkez ? 600 : 400 }}
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}>
                  {oge.ad}
                </motion.span>
              </motion.button>
            );
          })}
        </div>
        {/* Merkezi kuşatan ok butonları (referans: listenin SAĞINDA, seçiliyi sarar) */}
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 flex-col gap-[74px]">
          <button onClick={() => kaydir(-1)} aria-label="Önceki"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"><ChevronUp className="h-4 w-4" /></button>
          <button onClick={() => kaydir(1)} aria-label="Sonraki"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"><ChevronDown className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Çok sütunlu ÇARK — 3.5 Stil (3 sütun) / Kamera (4 sütun)            */
/* ------------------------------------------------------------------ */
function CokSutunCark({
  sutunlar, secimler, onSec, tohumOnEk,
}: {
  sutunlar: { baslik: string; ogeler: SeciciOge[] }[];
  secimler: string[]; onSec: (sutun: number, ad: string) => void; tohumOnEk: string;
}) {
  return (
    /* NOT: yükseklik AÇIKÇA verilmeli. `flex-1 min-h-0` ya da sadece
       `shrink-0` ile bu satır modalın flex akışında sıfıra çöküyor ve
       `overflow-hidden` sütunları tamamen kırpıyordu (sadece oklar kalıyordu). */
    <div className="flex h-[430px] shrink-0 items-stretch gap-4 overflow-x-auto px-8 pb-8">
      {sutunlar.map((s, si) => {
        const ogeler = s.ogeler;
        const i = Math.max(0, ogeler.findIndex((o) => o.ad === secimler[si]));
        const n = ogeler.length;
        const kaydir = (yon: 1 | -1) => onSec(si, ogeler[(i + yon + n) % n].ad);
        // Dairesel en kısa mesafe — sütun sonsuz döner, öğeler animasyonla kayar.
        // NOT: eşik `n/2` iken çift sayılı listelerde (n=4) tam sınırdaki öğe
        // hem +2 hem −2 çıkıp filtreye takılıyor ve sütun BOŞ kalıyordu.
        const KART = 178;
        const mesafe = (j: number) => {
          let d = j - i;
          if (d > n / 2) d -= n;
          if (d < -n / 2) d += n;
          return d;
        };
        // Görünür pencere: n küçükse (2–4) tüm öğeleri göster, kırpma yapma.
        const esik = n <= 4 ? n : 1.6;
        return (
          <div key={s.baslik} className="flex min-w-[150px] flex-1 flex-col items-center">
            <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-metin-3">{s.baslik}</p>
            <button onClick={() => kaydir(-1)} aria-label="Önceki"
              className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"><ChevronUp className="h-4 w-4" /></button>
            <div className="relative flex-1 overflow-hidden" style={{ height: KART * 1.9, width: 150 }}>
              {ogeler.map((oge, j) => {
                const d = mesafe(j);
                if (Math.abs(d) > esik) return null;
                const merkez = d === 0;
                return (
                  <motion.button key={oge.ad} onClick={() => onSec(si, oge.ad)}
                    initial={false}
                    animate={{ y: d * KART, opacity: merkez ? 1 : 0.28, scale: merkez ? 1 : 0.9 }}
                    transition={{ type: "spring", stiffness: 380, damping: 34, mass: 0.7 }}
                    className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center">
                    <motion.span className={cn("overflow-hidden rounded-2xl", merkez && "ring-2 ring-white/50")}
                      animate={{ width: merkez ? 108 : 82, height: merkez ? 150 : 104 }}
                      transition={{ type: "spring", stiffness: 380, damping: 34 }}
                      style={{ background: seciciArka(`${tohumOnEk}-${oge.ad}`, oge.kat) }} />
                    <motion.span className="mt-1.5 max-w-[130px] truncate text-center text-white"
                      animate={{ fontSize: merkez ? 14 : 12, fontWeight: merkez ? 500 : 400, opacity: merkez ? 1 : 0.7 }}
                      transition={{ type: "spring", stiffness: 380, damping: 34 }}>{oge.ad}</motion.span>
                  </motion.button>
                );
              })}
            </div>
            <button onClick={() => kaydir(1)} aria-label="Sonraki"
              className="mt-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"><ChevronDown className="h-4 w-4" /></button>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* IZGARA — 3.0 Tür / Kamera Hareketi / Hız Rampası                    */
/* ------------------------------------------------------------------ */
function Izgara({
  ogeler, secili, onSec, tohumOnEk,
}: {
  ogeler: SeciciOge[]; secili: string; onSec: (ad: string) => void; tohumOnEk: string;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-7">
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {ogeler.map((o) => {
          const aktif = o.ad === secili;
          return (
            <button key={o.ad} onClick={() => onSec(o.ad)} className="group text-left">
              {/* NOT: seçim vurgusu LIME olmalı (referans). `ring-aksan` sinema
                  kapsamında cyan'a düşüyor — inline --sn-lime ile sabitliyoruz. */}
              <span className="relative block aspect-[4/5] w-full overflow-hidden rounded-2xl transition-all"
                style={{
                  background: seciciArka(`${tohumOnEk}-${o.ad}`, o.kat),
                  boxShadow: aktif
                    ? "0 0 0 3px var(--sn-lime, #55d6fd)"
                    : "inset 0 0 0 1px rgba(255,255,255,0.10)",
                }}>
                {aktif && (
                  <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-zemin shadow-lg"
                    style={{ background: "var(--sn-lime, #55d6fd)" }}>
                    <Check className="h-5 w-5" strokeWidth={3} />
                  </span>
                )}
              </span>
              <span className={cn("mt-2 block truncate text-center text-[14px]", aktif ? "font-semibold text-metin" : "text-metin-2")}>{o.ad}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Hap satırı + modal                                                  */
/* ================================================================== */

export type SinemaSecim = Record<string, string>;

export function SinemaHaplar({
  haplar, secim, onSecim, onYonetmen,
}: {
  haplar: HapTanim[];
  secim: SinemaSecim;
  onSecim: (yeni: SinemaSecim) => void;
  onYonetmen?: () => void;
}) {
  const [acikHap, setAcikHap] = useState<HapTanim | null>(null);
  useScrollKilit(acikHap !== null);
  useEscKapat(acikHap !== null, () => setAcikHap(null));
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);

  /** Hapın gösterilecek değeri — çok sütunlularda virgüllü özet (referans birebir).
      Seçim yapılmamış sütunlar için sütunun İLK öğesi varsayılan sayılır; yoksa
      hap "Stil:" gibi boş görünüyordu. */
  const hapDeger = (h: HapTanim): string => {
    if (h.tip === "carCok" && h.sutunlar) {
      return h.sutunlar.map((s, si) => secim[`${h.id}${si}`] ?? s.ogeler[0]?.ad ?? "").filter(Boolean).join(", ");
    }
    return secim[h.id] ?? h.ogeler?.[0]?.ad ?? "";
  };
  /** Hapın yuvarlak önizleme tohumu. */
  const hapTohum = (h: HapTanim): { tohum: string; kat: string } => {
    if (h.tip === "carCok" && h.sutunlar) {
      const s0 = h.sutunlar[0];
      const ilk = secim[`${h.id}0`] ?? s0?.ogeler[0]?.ad ?? "";
      return { tohum: `${h.id}-${ilk}`, kat: s0?.ogeler.find((o) => o.ad === ilk)?.kat ?? "sinematik" };
    }
    const d = secim[h.id] ?? h.ogeler?.[0]?.ad ?? "";
    return { tohum: `${h.id}-${d}`, kat: h.ogeler?.find((o) => o.ad === d)?.kat ?? "sinematik" };
  };

  return (
    <>
      {/* Hap satırı — composer'ın üstünde, ortalanmış (referans birebir) */}
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
        {haplar.map((h) => {
          const acik = acikHap?.id === h.id;
          if (h.tip === "buton") {
            return (
              <button key={h.id} onClick={onYonetmen}
                className="hf-hap flex h-11 items-center gap-2 rounded-full px-4 text-[15px] text-metin-2 transition-colors hover:text-metin">
                <Clapperboard className="h-[18px] w-[18px]" /> {h.etiket}
              </button>
            );
          }
          const { tohum, kat } = hapTohum(h);
          return (
            <button key={h.id} onClick={() => setAcikHap(h)}
              className={cn("hf-hap flex h-11 max-w-[300px] items-center gap-2.5 rounded-full py-1 pl-1 pr-4 text-[15px]", acik && "hf-hap-aktif")}>
              <span className="h-9 w-9 shrink-0 rounded-full" style={{ background: onizlemeArka(tohum, kat) }} />
              <span className="truncate">
                <span className="text-metin-3">{h.etiket}: </span>
                <span className="text-metin">{hapDeger(h)}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Modal */}
      {hazir && createPortal(
        <AnimatePresence>
          {acikHap && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[150] bg-black/45" onClick={() => setAcikHap(null)} />
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.985 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                /* NOT: modal body'ye portallanıyor → `.sinema-kapsam` dışında kalır
                   ve --sn-lime tanımsız olur. Kapsamı burada yeniden veriyoruz. */
                className="sinema-kapsam hf-cam fixed left-1/2 top-1/2 z-[151] flex max-h-[80vh] w-[min(1180px,94vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[26px]">
                {/* Başlık — sol; sağda (Stil'de) Manuel Stil + kapat */}
                <div className="flex shrink-0 items-center gap-3 px-7 py-5">
                  <h3 className="flex-1 text-[19px] font-medium text-metin">{acikHap.baslik}</h3>
                  {acikHap.id === "stil" && (
                    <button className="hf-cip flex h-9 items-center gap-2 rounded-full px-3.5 text-[14px] text-metin-2">
                      <Pencil className="h-3.5 w-3.5" /> Manuel Stil <span className="text-metin-3">· Kapalı</span>
                    </button>
                  )}
                  <button onClick={() => setAcikHap(null)} aria-label="Kapat"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-metin transition-colors hover:bg-white/20"><X className="h-[18px] w-[18px]" /></button>
                </div>

                {acikHap.tip === "car" && acikHap.ogeler && (
                  <Cark ogeler={acikHap.ogeler} secili={secim[acikHap.id] ?? acikHap.ogeler[0].ad}
                    onSec={(ad) => onSecim({ ...secim, [acikHap.id]: ad })} tohumOnEk={acikHap.id} />
                )}
                {acikHap.tip === "carCok" && acikHap.sutunlar && (
                  <CokSutunCark sutunlar={acikHap.sutunlar}
                    secimler={acikHap.sutunlar.map((s, si) => secim[`${acikHap.id}${si}`] ?? s.ogeler[0].ad)}
                    onSec={(si, ad) => onSecim({ ...secim, [`${acikHap.id}${si}`]: ad })}
                    tohumOnEk={acikHap.id} />
                )}
                {acikHap.tip === "izgara" && acikHap.ogeler && (
                  <Izgara ogeler={acikHap.ogeler} secili={secim[acikHap.id] ?? acikHap.ogeler[0].ad}
                    onSec={(ad) => onSecim({ ...secim, [acikHap.id]: ad })} tohumOnEk={acikHap.id} />
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
