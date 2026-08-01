"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown, ChevronRight, Plus, Download, Maximize2, Play, X,
  HelpCircle, Video, Image as ImageIkon, Music, ArrowDown, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   SOHBET PARÇALARI — referanslar/sohbetler birebir.
   Tipografi kuralı (referansın imzası):
     asistan NESRİ  → SERİF 17px var(--sc-metin)
     sistem/ajan    → SANS (adım, düşünme, çip, composer)
   ============================================================ */

export const SERIF = 'Georgia, "Times New Roman", Tiempos, serif';

/* ── Kullanıcı mesajı — SAĞA yaslı balon ── */
export function SCKullaniciMesaji({ metin, ekler }: { metin: string; ekler?: string[] }) {
  return (
    <div className="flex flex-col items-end gap-2">
      {ekler && ekler.length > 0 && (
        <div className="flex gap-2">
          {ekler.map((e, i) => (
            <span key={i} className="h-14 w-14 overflow-hidden rounded-lg bg-[var(--sc-cip)]"
              style={{ background: e }} />
          ))}
        </div>
      )}
      <div className="max-w-[62%] rounded-[20px] bg-[var(--sc-cip)] px-5 py-3 text-[15px] leading-relaxed text-[var(--sc-metin)]">
        {metin}
      </div>
    </div>
  );
}

/* ── Asistan mesajı — SOLA yaslı, balon YOK, SERİF ── */
export function SCAjanMesaji({ html }: { html: string }) {
  return (
    <div
      className="sc-nesir text-[17px] leading-[1.55] text-[var(--sc-metin)]"
      style={{ fontFamily: SERIF }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/* ── "8dk 21sn çalıştı ⌄" — STICKY özet başlığı ── */
export function SCCalismaBasligi({
  saniye, acik, onDegis, calisiyor,
}: { saniye: number; acik: boolean; onDegis: () => void; calisiyor?: boolean }) {
  const dk = Math.floor(saniye / 60), sn = saniye % 60;
  const sure = dk > 0 ? `${dk}dk ${sn}sn` : `${sn}sn`;
  return (
    <div className="sticky top-0 z-20 -mx-4 bg-[var(--sc-zemin)]/92 px-4 backdrop-blur-md">
      <button onClick={onDegis}
        className="flex items-center gap-1.5 py-2.5 text-[14px] text-[var(--sc-metin-3)] transition-colors hover:text-[var(--sc-metin)]">
        {/* "0sndir çalışıyor" gibi bozuk ek oluşuyordu (sure zaten birim içeriyor). */}
        {calisiyor ? `${sure} boyunca çalışıyor` : `${sure} çalıştı`}
        {acik ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      <div className="h-px bg-[var(--sc-kenar)]" />
    </div>
  );
}

/* ── Görev sayacı — ✓ 7/7 ── */
export function SCGorevSayaci({ tamam, toplam }: { tamam: number; toplam: number }) {
  const bitti = tamam >= toplam;
  const R = 7, C = 2 * Math.PI * R;
  return (
    <span className="flex items-center gap-2 text-[13px] text-[var(--sc-metin-3)]">
      {bitti ? (
        <Check className="h-4 w-4" strokeWidth={2.6} />
      ) : (
        <svg viewBox="0 0 18 18" className="h-4 w-4 -rotate-90" aria-hidden>
          <circle cx="9" cy="9" r={R} fill="none" stroke="var(--sc-cip-2)" strokeWidth="2" />
          <circle cx="9" cy="9" r={R} fill="none" stroke="var(--sc-metin-3)" strokeWidth="2"
            strokeDasharray={C} strokeDashoffset={C * (1 - tamam / Math.max(1, toplam))} strokeLinecap="round" />
        </svg>
      )}
      <span className="tabular-nums">{tamam}/{toplam}</span>
    </span>
  );
}

/* ── Üretilen çıktı ızgarası — 3 sütun, hover'da 3 araç ── */
export type SCCiktiKart = {
  id: string;
  ad: string;
  tur: "video" | "gorsel" | "ses";
  boyut: string;
  arka: string;
  url?: string | null;
};

export function SCCiktiIzgarasi({
  ciktilar, onAc, onIndir, onEkle,
}: {
  ciktilar: SCCiktiKart[];
  onAc: (c: SCCiktiKart) => void;
  onIndir: (c: SCCiktiKart) => void;
  onEkle: (c: SCCiktiKart) => void;
}) {
  const TUR_IKON = { video: Video, gorsel: ImageIkon, ses: Music };
  const TUR_AD = { video: "Video", gorsel: "Görsel", ses: "Ses" };
  return (
    <div className="grid grid-cols-3 gap-3.5">
      {ciktilar.map((c) => {
        const Ikon = TUR_IKON[c.tur];
        return (
          <div key={c.id} className="group/ck relative aspect-[1/1.25] overflow-hidden rounded-[14px]">
            <span className="absolute inset-0" style={{ background: c.arka }} />
            {c.url && <img src={c.url} alt="" loading="lazy"
              className="absolute inset-0 h-full w-full object-cover" />}
            <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />

            {/* video: ortada play */}
            {c.tur === "video" && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm">
                  <Play className="ml-0.5 h-5 w-5 text-[var(--sc-metin)]" fill="currentColor" />
                </span>
              </span>
            )}

            {/* SOL ÜST hover araçları: + ⤓ ⤢ (referans sırası) */}
            <span className="absolute left-2.5 top-2.5 flex gap-2 opacity-0 transition-opacity group-hover/ck:opacity-100">
              {[[Plus, () => onEkle(c), "Ekle"], [Download, () => onIndir(c), "İndir"], [Maximize2, () => onAc(c), "Büyüt"]].map(
                ([I, fn, et], i) => {
                  const Ikn = I as typeof Plus;
                  return (
                    <button key={i} onClick={fn as () => void} aria-label={et as string}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-[var(--sc-metin)] backdrop-blur-sm transition-colors hover:bg-black/85">
                      <Ikn className="h-[15px] w-[15px]" />
                    </button>
                  );
                },
              )}
            </span>

            {/* SOL ALT meta */}
            <span className="absolute inset-x-0 bottom-0 p-3">
              <span className="block truncate text-[15px] font-bold text-[var(--sc-metin)] drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
                {c.ad}
              </span>
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-[3px] text-[12px] text-[var(--sc-metin)] backdrop-blur-sm">
                <Ikon className="h-[12px] w-[12px]" /> {TUR_AD[c.tur]} · {c.boyut}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Onay/soru kartı — "N yanıt" ── */
export function SCSoruKarti({
  sorular,
}: { sorular: { soru: string; cevap?: string }[] }) {
  return (
    <div className="rounded-[14px] border border-[var(--sc-kenar)] bg-[var(--sc-kart)] p-5">
      <div className="flex items-center gap-2 pb-3">
        <HelpCircle className="h-[18px] w-[18px] text-[var(--sc-metin-3)]" />
        <span className="text-[14px] text-[var(--sc-metin-3)]">{sorular.length} yanıt</span>
      </div>
      <div className="h-px bg-[var(--sc-kenar)]" />
      <div className="space-y-[18px] pt-4">
        {sorular.map((s, i) => (
          <div key={i}>
            <p className="text-[14.5px] leading-relaxed text-[var(--sc-metin-2)]">
              {sorular.length > 1 && `${i + 1}. `}{s.soru}
            </p>
            {s.cevap && <p className="mt-1 text-[14.5px] leading-relaxed text-[var(--sc-metin-3)]">{s.cevap}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Aşağı kaydır butonu — composer üstünde yüzer ── */
export function SCAsagiKaydir({ gorunur, onTikla }: { gorunur: boolean; onTikla: () => void }) {
  return (
    <AnimatePresence>
      {gorunur && (
        <motion.button
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
          onClick={onTikla} aria-label="En alta git"
          className="absolute -top-11 left-1/2 z-20 flex h-[30px] w-[30px] -translate-x-1/2 items-center justify-center rounded-full border border-[var(--sc-kenar)] bg-[var(--sc-cip)] text-[var(--sc-metin-3)] transition-colors hover:text-[var(--sc-metin)]">
          <ArrowDown className="h-4 w-4" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ── Inline kod çipi (asistan metni içinde) ── */
export function SCKodCipi({ metin }: { metin: string }) {
  return (
    <span className="rounded-[5px] bg-[var(--sc-kenar)] px-[7px] py-[2px] font-mono text-[13px] text-[var(--sc-metin-2)]">
      {metin}
    </span>
  );
}
