"use client";

import { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, ChevronUp, ChevronDown } from "lucide-react";
import { onizlemeArka } from "@/lib/utils";
import { sinemaGercek } from "@/lib/sinemaVeri";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";

/** tur-<id> için gerçek görsel varsa CSS background, yoksa stok. */
function turArka(tohum: string, kat: string): string {
  const g = sinemaGercek(tohum);
  return g ? `url("${g}") center/cover no-repeat` : onizlemeArka(tohum, kat);
}

/* Türkçe → ascii slug (cark dosya adları için). */
function carkSlug(s: string): string {
  return s.toLowerCase()
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
/* Stil/Kamera ayarları çark seçeneklerinin GERÇEK görselleri olan sütunlar (Renk/Işık/Hareket/Kamera/Lens). */
const CARK_GERCEK_SUTUN = new Set(["RENK PALETİ", "IŞIK", "KAMERA HAREKET STİLİ", "KAMERA", "LENS"]);
/** cark-<baslik>-<id> için gerçek görsel varsa CSS background, yoksa stok. */
function carkArka(baslik: string, id: string, kat: string): string {
  if (CARK_GERCEK_SUTUN.has(baslik)) {
    return `url("/gercek/sinema/cark-${carkSlug(baslik)}-${carkSlug(id)}.webp") center/cover no-repeat`;
  }
  return onizlemeArka(`cark-${baslik}-${id}`, kat);
}

/**
 * Higgsfield cam-blur modal kabuğu (HIGGSFIELD-ACILIR-PANELLER referansı).
 * Cinema Genre/Style/Camera ve diğer cam popover'lar bunu kullanır:
 * translucent panel + backdrop-blur + fade+scale giriş + sağ üst yuvarlak X.
 */
export function CamModal({
  acik, baslik, sagBaslik, onKapat, children, genislik = 810,
}: {
  acik: boolean;
  baslik: string;
  sagBaslik?: ReactNode;
  onKapat: () => void;
  children: ReactNode;
  genislik?: number;
}) {
  useScrollKilit(acik); // modal açıkken arka plan sabit (madde 10)
  useEscKapat(acik, onKapat); // Escape ile kapat
  return (
    <AnimatePresence>
      {acik && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onKapat}
            className="absolute inset-0 bg-black/65 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="relative w-full overflow-hidden rounded-[20px] border border-white/[0.08] shadow-2xl shadow-black/60"
            style={{ maxWidth: genislik, background: "rgba(30,30,32,0.72)", backdropFilter: "blur(28px) saturate(160%)" }}
          >
            <div className="flex items-center justify-between px-6 py-4">
              <span className="text-[15px] font-medium">{baslik}</span>
              <div className="flex items-center gap-3">
                {sagBaslik}
                <button onClick={onKapat}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-white/5 text-metin-2 transition-colors hover:bg-white/10 hover:text-metin"
                  aria-label="Kapat">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * TÜR çarkı — Higgsfield "Genre" modalı BİREBİR:
 * SOL büyük dairesel önizleme (seçili türün görseli) + SAĞ dikey wheel
 * (her öğe küçük yuvarlak thumbnail + isim; ortadaki büyük+beyaz, uzaklar soluk)
 * + sağda yukarı/aşağı ok butonları (wheel'i döndürür).
 */
export function TurCark({
  secenekler, secili, onSec, tohumKategori = "sinematik",
}: {
  secenekler: { id: string; etiket: string }[];
  secili: string;
  onSec: (id: string) => void;
  tohumKategori?: string;
}) {
  const n = secenekler.length;
  const seciliIndex = Math.max(0, secenekler.findIndex((s) => s.id === secili));
  const kaydir = (yon: 1 | -1) => onSec(secenekler[(seciliIndex + yon + n) % n].id);
  // Wheel: seçili ortada, ±2 komşu görünür (döngüsel)
  const gorunur = [-2, -1, 0, 1, 2].map((d) => secenekler[(seciliIndex + d + n) % n]);

  return (
    <div className="flex items-stretch gap-6 px-2 pb-8 pt-2">
      {/* Sol: büyük dairesel önizleme */}
      <div className="flex flex-1 items-center justify-center">
        <div className="relative aspect-square w-full max-w-[340px] overflow-hidden rounded-full border border-white/10 shadow-2xl shadow-black/50"
          style={{ background: turArka(`tur-${secili}`, tohumKategori) }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
        </div>
      </div>
      {/* Sağ: dikey wheel + oklar */}
      <div className="relative flex w-[240px] flex-col items-stretch justify-center">
        <div className="flex flex-col items-stretch gap-1"
          style={{ maskImage: "linear-gradient(180deg, transparent, #000 26%, #000 74%, transparent)", WebkitMaskImage: "linear-gradient(180deg, transparent, #000 26%, #000 74%, transparent)" }}>
          {gorunur.map((s, i) => {
            const uzaklik = Math.abs(i - 2);
            const aktif = uzaklik === 0;
            const olcek = uzaklik === 0 ? 1 : uzaklik === 1 ? 0.9 : 0.78;
            const opak = uzaklik === 0 ? 1 : uzaklik === 1 ? 0.5 : 0.28;
            return (
              <button key={`${s.id}-${i}`} onClick={() => onSec(s.id)}
                className="flex items-center gap-3 rounded-2xl px-3 py-2 text-left transition-all hover:bg-white/5"
                style={{ transform: `scale(${olcek})`, opacity: opak }}>
                <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/10" style={{ background: turArka(`tur-${s.id}`, tohumKategori) }} />
                <span className={aktif ? "text-[19px] font-semibold text-white" : "text-[16px] text-white/80"}>{s.etiket}</span>
              </button>
            );
          })}
        </div>
        {/* Yukarı/aşağı ok butonları — sağ kenar */}
        <div className="absolute right-0 top-1/2 flex -translate-y-1/2 flex-col gap-2">
          <button onClick={() => kaydir(-1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/5 text-metin-2 transition-colors hover:bg-white/10 hover:text-metin" aria-label="Yukarı"><ChevronUp className="h-4 w-4" /></button>
          <button onClick={() => kaydir(1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/5 text-metin-2 transition-colors hover:bg-white/10 hover:text-metin" aria-label="Aşağı"><ChevronDown className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}

/**
 * Dikey "çark" seçici sütunu — Higgsfield Genre/Style/Camera çarkları.
 * Merkeze yakın öğe büyük+opak, uzaklaştıkça küçülüp soluyor.
 * Üst/alt fade maskesi çark illüzyonu verir.
 */
export function CarkSutun({
  baslik, secenekler, secili, onSec, tohumKategori = "sinematik",
}: {
  baslik?: string;
  secenekler: { id: string; etiket: string; alt?: string }[];
  secili: string;
  onSec: (id: string) => void;
  tohumKategori?: string;
}) {
  const seciliIndex = Math.max(0, secenekler.findIndex((s) => s.id === secili));

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center">
      {baslik && <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-metin-3">{baslik}</p>}
      <div
        className="relative flex h-[260px] w-full flex-col items-center overflow-y-auto py-[100px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ maskImage: "linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent)", WebkitMaskImage: "linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent)" }}
      >
        {secenekler.map((s, i) => {
          const uzaklik = Math.abs(i - seciliIndex);
          const aktif = s.id === secili;
          const olcek = uzaklik === 0 ? 1 : uzaklik === 1 ? 0.86 : 0.72;
          const opak = uzaklik === 0 ? 1 : uzaklik === 1 ? 0.55 : 0.3;
          return (
            <button
              key={s.id}
              onClick={() => onSec(s.id)}
              className="my-1 flex shrink-0 flex-col items-center transition-all"
              style={{ transform: `scale(${olcek})`, opacity: opak }}
            >
              {/* Higgsfield birebir: her seçenekte gerçek görsel thumbnail + aktifte cyan çerçeve/✓ */}
              <span className={`relative flex h-[76px] w-[148px] items-center justify-center overflow-hidden rounded-[30px] border-2 transition-colors ${aktif ? "border-aksan" : "border-white/10"}`}
                style={{ background: carkArka(baslik ?? "", s.id, tohumKategori) }}>
                <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30" />
                <span className="relative px-2 text-center text-[12.5px] font-semibold text-white drop-shadow-md">{s.etiket}</span>
                {aktif && (
                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-aksan text-zemin">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </span>
              {s.alt && <span className="mt-1 text-[11px] text-metin-2">{s.alt}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
