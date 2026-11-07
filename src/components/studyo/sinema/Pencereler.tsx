"use client";

/* Sinema stüdyosunun dört kurulum penceresi: Film kurulumu (tür çarkı, dönem cetveli, tempo
   şeridi, oyunculuk çarkı), Kamera (gövde/lens/odak/diyafram silindirleri, hareket, kadraj, hız),
   Renk paleti (film kareleri ve renk şeritleri, özel palet) ve Işık (hazır ışıklar, ışık kurgusu).
   Hepsi aynı kabukta: solda sekmeler, sağda içerik, üstte "Sıfırla" ve kapat. */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownUp, Aperture, Sparkles, Camera, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clapperboard, Film, Focus, Gauge, History, Move3d, Plus, Search, Smile, Theater, Trash2, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEscKapat, useScrollKilit } from "@/hooks/useScrollKilit";
import { paletCikar } from "@/lib/paletCikar";
import { HAREKETLER, HAREKET_KATLARI, hareketAdi, klipYolu, posterYolu, type Hareket, type HareketKat } from "../video/veri";
import {
  ACILAR, DIYAFRAMLAR, DONEMLER, DUYGULAR, GOVDELER, HIZ_EGRILERI, ISIKLAR, LENSLER, ODAKLAR, PALETLER, PLANLAR, TEMPOLAR, TURLER, YOGUNLUK, YON_KISAYOL,
  bul, hareketEtiketi, type IsikKaynak, type Kurulum, type Secenek,
} from "./veri";

export type PencereTur = "film" | "kamera" | "palet" | "isik";

/* ═════════════ Kabuk ═════════════ */

function Kabuk({ baslik, onKapat, onSifirla, sekmeler, sekme, onSekme, geri, children }: {
  baslik: string; onKapat: () => void; onSifirla?: () => void;
  sekmeler?: { id: string; ad: string; ikon: typeof Camera }[]; sekme?: string; onSekme?: (s: string) => void;
  geri?: () => void; children: React.ReactNode;
}) {
  useEscKapat(true, onKapat);
  useScrollKilit(true);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
      className="perde fixed inset-0 z-[110] flex items-end justify-center bg-black/65 backdrop-blur-[3px] sm:items-center sm:p-6" onClick={onKapat}>
      <motion.div initial={{ opacity: 0, y: 18, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.985 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={baslik}
        className="flex h-[min(560px,88dvh)] w-full max-w-[880px] flex-col overflow-hidden rounded-t-[24px] bg-[#1c1c1f] ring-1 ring-white/[0.07] sm:rounded-[24px]">
        <div className="flex shrink-0 items-center gap-2 px-4 py-3">
          {geri && <button onClick={geri} aria-label="Geri" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-metin hover:bg-white/[0.1]"><ChevronLeft className="h-4 w-4" /></button>}
          <p className="text-[16px] font-semibold tracking-[-0.01em] text-metin">{baslik}</p>
          <span className="flex-1" />
          {onSifirla && <button onClick={onSifirla} className="h-8 rounded-full bg-white/[0.07] px-3.5 text-[12.5px] font-semibold text-metin transition-colors hover:bg-white/[0.12]">Sıfırla</button>}
          <button onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/[0.08] hover:text-metin"><X className="h-[18px] w-[18px]" /></button>
        </div>
        <div className="mx-1.5 mb-1.5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[19px] bg-[#252528] sm:flex-row">
          {sekmeler && (
            <div role="tablist" className="gizli-scroll flex shrink-0 gap-1 overflow-x-auto border-white/[0.05] p-2 max-sm:border-b sm:w-[176px] sm:flex-col sm:border-r sm:p-2.5">
              {sekmeler.map((s) => (
                <button key={s.id} role="tab" aria-selected={sekme === s.id} onClick={() => onSekme?.(s.id)}
                  className={cn("flex h-9 shrink-0 items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] font-medium transition-colors", sekme === s.id ? "bg-white/[0.08] text-metin" : "text-metin-2 hover:bg-white/[0.04] hover:text-metin")}>
                  <s.ikon className="h-4 w-4" strokeWidth={1.8} />{s.ad}
                </button>
              ))}
            </div>
          )}
          <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">{children}</div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Baslik({ baslik, alt, sag }: { baslik: string; alt: string; sag?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-4 pt-3.5 sm:px-5">
      <div className="min-w-0 flex-1"><p className="text-[14px] font-semibold text-metin">{baslik}</p><p className="text-[12px] text-metin-3">{alt}</p></div>
      {sag}
    </div>
  );
}

/** Yuvarlak ok düğmesi + seçili ad: çark ve şeritlerin altındaki gezinti. */
function Gezinti({ ad, onOnce, onSonra, vurgu }: { ad: string; onOnce: () => void; onSonra: () => void; vurgu?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <button onClick={onOnce} aria-label="Önceki" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.07] text-metin ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.12]"><ChevronLeft className="h-4 w-4" /></button>
      <span className={cn("min-w-[104px] rounded-full px-4 py-1.5 text-center text-[14px] font-semibold ring-1 ring-inset", vurgu ? "bg-white/[0.08] text-metin ring-white/30" : "bg-white/[0.06] text-metin ring-white/[0.1]")}>{ad}</span>
      <button onClick={onSonra} aria-label="Sonraki" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.07] text-metin ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.12]"><ChevronRight className="h-4 w-4" /></button>
    </div>
  );
}

/** Dönem ve tempo önizlemesinde kullanılan akışkan renk dokusu. */
export function Doku({ renk, className }: { renk: [string, string, string]; className?: string }) {
  return (
    <span className={cn("block overflow-hidden", className)} style={{ background: `radial-gradient(60% 80% at 25% 30%, ${renk[0]}, transparent 70%), radial-gradient(55% 70% at 75% 65%, ${renk[1]}, transparent 70%), radial-gradient(40% 60% at 60% 20%, ${renk[2]}, transparent 70%), #141418` }}>
      <span className="block h-full w-full opacity-60 mix-blend-overlay" style={{ background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0 2px, transparent 2px 7px)" }} />
    </span>
  );
}

/* ═════════════ Film kurulumu ═════════════ */

/** Tür çarkı: kartlar bir yay üzerinde döner; seçili kart ortada büyük. */
function TurCarki({ k, onDegis }: { k: Kurulum; onDegis: (y: Partial<Kurulum>) => void }) {
  const i = Math.max(0, TURLER.findIndex((t) => t.id === k.tur));
  const n = TURLER.length;
  const git = (d: number) => onDegis({ tur: TURLER[(i + d + n) % n].id });
  return (
    <div className="flex h-full flex-col">
      <Baslik baslik="Tür seç" alt="Modelin izleyeceği anlatım kuralları" />
      <div className="relative min-h-0 flex-1 overflow-hidden" onWheel={(e) => { if (Math.abs(e.deltaY) > 20) git(e.deltaY > 0 ? 1 : -1); }}>
        <span aria-hidden className="absolute left-1/2 top-[22%] h-[900px] w-[900px] -translate-x-1/2 rounded-full border border-white/[0.06] bg-white/[0.015]" />
        {TURLER.map((t, j) => {
          let d = j - i; if (d > n / 2) d -= n; if (d < -n / 2) d += n;
          if (Math.abs(d) > 2) return null;
          const sec = d === 0;
          return (
            <motion.button key={t.id} onClick={() => onDegis({ tur: t.id })} aria-label={t.ad} aria-pressed={sec}
              initial={false} animate={{ x: `calc(-50% + ${d * 245}px)`, y: Math.abs(d) * 34 + (Math.abs(d) === 2 ? 30 : 0), rotate: d * 16, scale: sec ? 1 : 0.78, opacity: Math.abs(d) === 2 ? 0.45 : 1 }}
              transition={{ type: "spring", stiffness: 210, damping: 26 }}
              className={cn("absolute left-1/2 top-[18%] aspect-[16/10] w-[300px] max-w-[62%] overflow-hidden rounded-[18px]", sec ? "z-10 ring-2 ring-white/80" : "ring-1 ring-white/10")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.gorsel} alt="" className="h-full w-full object-cover" />
              {!sec && <span className="absolute inset-0 bg-black/35" />}
            </motion.button>
          );
        })}
        <div className="absolute inset-x-0 bottom-5"><Gezinti ad={TURLER[i].ad} onOnce={() => git(-1)} onSonra={() => git(1)} vurgu={i > 0} /><p className="mt-2 text-center text-[12px] text-metin-3">{TURLER[i].not}</p></div>
      </div>
    </div>
  );
}

/** Dönem cetveli: tıklanabilir çentikler, ortada seçili dönem. */
const DONEM_FOTO = "/gercek/sinema/top-nala.webp";
const GREN = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";
/** Dönem: aynı kare her dönemin renk ve dokusuyla; altta dönem kartları sırayla (geçmişe doğru). */
function DonemCetveli({ k, onDegis }: { k: Kurulum; onDegis: (y: Partial<Kurulum>) => void }) {
  const i = Math.max(0, DONEMLER.findIndex((d) => d.id === k.donem));
  const d = DONEMLER[i];
  const eski = d.id === "70" || d.id === "60";
  return (
    <div className="flex h-full flex-col">
      <Baslik baslik="Dönem" alt="Filmin geçtiği zaman: kostüm, mekân ve görüntünün dokusu ona göre kurulur" />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4 pt-3 [scrollbar-width:thin] sm:px-5">
        <div className="relative aspect-[21/9] w-full shrink-0 overflow-hidden rounded-[16px] bg-black ring-1 ring-inset ring-white/[0.08]">
          <AnimatePresence initial={false}>
            <motion.img key={d.id} src={DONEM_FOTO} alt="" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
              className="absolute inset-0 h-full w-full object-cover" style={{ filter: d.filtre }} />
          </AnimatePresence>
          {eski && <span aria-hidden className="absolute inset-0 opacity-[0.22] mix-blend-overlay" style={{ backgroundImage: GREN }} />}
          <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
          <span className="absolute bottom-3.5 left-4 text-[26px] font-bold tracking-[-0.02em] text-white sm:text-[30px]">{i === 0 ? "Oto" : d.ad}</span>
          <span className="absolute bottom-4 right-4 max-w-[55%] text-right text-[12px] text-white/70">{i === 0 ? "Dönemi sahne belirler" : "Kostüm, araçlar ve renk o yıllara göre"}</span>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {DONEMLER.map((x) => {
            const sec = x.id === d.id;
            return (
              <button key={x.id} onClick={() => onDegis({ donem: x.id })} aria-pressed={sec} className="group min-w-0 text-left">
                <span className={cn("relative block aspect-[4/3] overflow-hidden rounded-[10px] ring-inset", sec ? "outline outline-2 -outline-offset-2 outline-white" : "ring-1 ring-white/[0.08] group-hover:ring-white/30")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={DONEM_FOTO} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" style={{ filter: x.filtre }} />
                  {x.id === "oto" && <span className="absolute inset-0 flex items-center justify-center bg-black/45"><Sparkles className="h-4 w-4 text-metin" /></span>}
                </span>
                <span className={cn("mt-1 block truncate text-[12px] font-semibold", sec ? "text-metin" : "text-metin-2 group-hover:text-metin")}>{x.ad}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Tempo şeridi: yatay kartlar, ortadaki seçili. */
function TempoSeridi({ k, onDegis }: { k: Kurulum; onDegis: (y: Partial<Kurulum>) => void }) {
  const i = Math.max(0, TEMPOLAR.findIndex((t) => t.id === k.tempo));
  const n = TEMPOLAR.length;
  const git = (d: number) => onDegis({ tempo: TEMPOLAR[(i + d + n) % n].id });
  return (
    <div className="flex h-full flex-col">
      <Baslik baslik="Tempo seç" alt="Kurgunun hızı · çok çekimli üretimde kesmeleri belirler" />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {TEMPOLAR.map((t, j) => {
          const d = j - i;
          if (Math.abs(d) > 2) return null;
          const sec = d === 0;
          return (
            <motion.button key={t.id} onClick={() => onDegis({ tempo: t.id })} aria-label={t.ad} aria-pressed={sec}
              initial={false} animate={{ x: `calc(-50% + ${d * 330}px)`, scale: sec ? 1 : 0.72, opacity: Math.abs(d) === 2 ? 0 : 1 }} transition={{ type: "spring", stiffness: 210, damping: 26 }}
              className={cn("absolute left-1/2 top-[16%] aspect-[16/10] w-[300px] max-w-[66%] overflow-hidden rounded-[18px]", sec ? "z-10 ring-2 ring-white/80" : "ring-1 ring-white/10")}>
              {t.gorsel
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={t.gorsel} alt="" className="h-full w-full object-cover" />
                : <Doku renk={t.renk!} className="h-full w-full" />}
              {t.id === "kaotik" && sec && <span aria-hidden className="absolute inset-0 animate-pulse bg-white/[0.04]" />}
            </motion.button>
          );
        })}
        <div className="absolute inset-x-0 bottom-5"><Gezinti ad={TEMPOLAR[i].ad} onOnce={() => git(-1)} onSonra={() => git(1)} vurgu={i > 0} /><p className="mt-2 text-center text-[12px] text-metin-3">{TEMPOLAR[i].not}</p></div>
      </div>
    </div>
  );
}

/** Oyunculuk: duygu çarkı ve yoğunluk. */
/** Oyunculuk: duygular yüz kareleriyle; seçince yoğunluk açılır. */
function DuyguCarki({ k, onDegis }: { k: Kurulum; onDegis: (y: Partial<Kurulum>) => void }) {
  const d = DUYGULAR.find((x) => x.id === k.duygu);
  return (
    <div className="flex h-full flex-col">
      <Baslik baslik="Oyunculuk" alt="Duygu yüz ifadesine, beden diline ve tempoya yansır; @karakter varsa ona uygulanır"
        sag={(
          <div className={cn("flex shrink-0 gap-0.5 rounded-full bg-black/25 p-0.5 ring-1 ring-inset ring-white/[0.06] transition-opacity", !d && "pointer-events-none opacity-35")} aria-label="Yoğunluk">
            {YOGUNLUK.map((y, j) => (
              <button key={y} onClick={() => onDegis({ yogunluk: j + 1 })} disabled={!d} aria-pressed={k.yogunluk === j + 1}
                className={cn("h-7 rounded-full px-3 text-[12px] font-medium transition-colors", k.yogunluk === j + 1 ? "bg-white text-[#0a0a0b]" : "text-metin-3 hover:text-metin")}>{y}</button>
            ))}
          </div>
        )} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3 [scrollbar-width:thin] sm:px-5">
        <div className="grid grid-cols-3 gap-x-3 gap-y-3.5 sm:grid-cols-5">
          <button onClick={() => onDegis({ duygu: "" })} aria-pressed={!d} className="group min-w-0 text-left">
            <span className={cn("flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-[12px] bg-white/[0.03] ring-inset", !d ? "outline outline-2 -outline-offset-2 outline-white" : "ring-1 ring-white/[0.08] group-hover:ring-white/25")}>
              <Sparkles className={cn("h-5 w-5", !d ? "text-metin" : "text-metin-3")} /><span className="px-2 text-center text-[11.5px] text-metin-3">Sahneye göre</span>
            </span>
            <span className={cn("mt-1.5 block text-[12.5px] font-semibold", !d ? "text-metin" : "text-metin")}>Serbest</span>
          </button>
          {DUYGULAR.map((x) => {
            const sec = x.id === k.duygu;
            return (
              <button key={x.id} onClick={() => onDegis({ duygu: sec ? "" : x.id })} aria-pressed={sec} className="group min-w-0 text-left">
                <span className={cn("relative block aspect-[4/5] overflow-hidden rounded-[12px] ring-inset", sec ? "outline outline-2 -outline-offset-2 outline-white" : "ring-1 ring-white/[0.08] group-hover:ring-white/25")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={x.gorsel} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                </span>
                <span className={cn("mt-1.5 block truncate text-[12.5px] font-semibold", sec ? "text-metin" : "text-metin")}>{x.ad}{sec && <span className="ml-1 font-medium text-metin-3">· {YOGUNLUK[k.yogunluk - 1].toLocaleLowerCase("tr")}</span>}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-[12px] leading-relaxed text-metin-3">İpucu: karakteri istemde <span className="font-semibold text-metin-2">@</span> ile çağır; birden çok karakter varsa duyguyu istemde de belirt (ör. “@Ayşe korkuyla geri çekilir”).</p>
      </div>
    </div>
  );
}

/* ═════════════ Kamera ═════════════ */

/** Dikey silindir: üstte/altta komşular soluk, ortada seçili hap; ok, tekerlek ve tıkla. */
function Silindir({ baslik, ogeler, secili, onSec }: { baslik: string; ogeler: { id: string; ad: string; gorsel?: string; ikon?: React.ReactNode }[]; secili: string; onSec: (id: string) => void }) {
  const i = Math.max(0, ogeler.findIndex((o) => o.id === secili));
  const git = (d: number) => { const j = i + d; if (j >= 0 && j < ogeler.length) onSec(ogeler[j].id); };
  const kilit = useRef(0);
  return (
    <div className="flex min-w-[112px] flex-1 flex-col items-center justify-center sm:min-w-[132px]"
      onWheel={(e) => { const t = Date.now(); if (t - kilit.current < 140 || Math.abs(e.deltaY) < 8) return; kilit.current = t; git(e.deltaY > 0 ? 1 : -1); }}>
      <p className="pt-3 text-[12px] font-medium text-metin-2">{baslik}</p>
      <button onClick={() => git(-1)} disabled={i === 0} aria-label={`${baslik}: önceki`} className="mt-2 flex h-6 w-9 items-center justify-center rounded-full bg-white/[0.07] text-metin-2 transition-opacity hover:text-metin disabled:opacity-0"><ChevronUp className="h-3.5 w-3.5" /></button>
      <div className="relative mt-1 h-[300px] w-full overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_22%,black_78%,transparent)]">
        {ogeler.map((o, j) => {
          const d = j - i;
          if (Math.abs(d) > 2) return null;
          const sec = d === 0;
          return (
            <motion.button key={o.id} onClick={() => onSec(o.id)} aria-pressed={sec} aria-label={`${baslik}: ${o.ad}`}
              initial={false} animate={{ y: d * (typeof window !== "undefined" && window.innerWidth < 640 ? 94 : 112), scale: sec ? 1 : 0.86, opacity: sec ? 1 : Math.abs(d) === 1 ? 0.5 : 0.15 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={cn("absolute left-1/2 top-1/2 -ml-[76px] -mt-[48px] flex h-[96px] w-[152px] flex-col max-sm:-ml-[52px] max-sm:-mt-[40px] max-sm:h-[80px] max-sm:w-[104px] max-sm:rounded-[24px] items-center justify-end overflow-hidden rounded-[30px] pb-2.5 text-center",
                sec ? "bg-[#2e2e33] shadow-[0_0_0_2px_rgba(255,255,255,0.85)]" : "bg-[#2a2a2e] ring-1 ring-inset ring-white/[0.06]")}>
              {o.gorsel
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={o.gorsel} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
                : <span className="absolute inset-0 flex items-center justify-center pb-5 text-metin">{o.ikon}</span>}
              {o.gorsel && <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />}
              <span className="relative px-2 text-[12.5px] font-semibold leading-tight text-white">{o.ad}</span>
            </motion.button>
          );
        })}
      </div>
      <button onClick={() => git(1)} disabled={i === ogeler.length - 1} aria-label={`${baslik}: sonraki`} className="mb-3 mt-1 flex h-6 w-9 items-center justify-center rounded-full bg-white/[0.07] text-metin-2 transition-opacity hover:text-metin disabled:opacity-0"><ChevronDown className="h-3.5 w-3.5" /></button>
    </div>
  );
}

/** Görüş açısı kaması (üstten bakış). */
export function AciKamasi({ aci, boyut = 34, className }: { aci: number; boyut?: number; className?: string }) {
  const r = boyut - 4, a = (Math.min(aci, 120) * Math.PI) / 360, cx = boyut / 2, cy = boyut - 2;
  const x1 = cx - Math.sin(a) * r, y1 = cy - Math.cos(a) * r, x2 = cx + Math.sin(a) * r;
  return (
    <svg width={boyut} height={boyut} viewBox={`0 0 ${boyut} ${boyut}`} aria-hidden className={className}>
      <path d={`M${cx} ${cy} L${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y1.toFixed(2)} Z`} fill="currentColor" fillOpacity={0.16} stroke="currentColor" strokeOpacity={0.75} strokeWidth={1.3} strokeLinejoin="round" />
      <circle cx={cx} cy={cy} r={1.8} fill="currentColor" />
    </svg>
  );
}

/** Hız eğrisi çizgisi. */
export function Egri({ egri, className }: { egri: number[]; className?: string }) {
  const W = 56, H = 24, p = egri.map((v, i) => [3 + (i / (egri.length - 1)) * (W - 6), H - 3 - v * (H - 6)] as const);
  let d = `M${p[0][0]} ${p[0][1]}`;
  for (let i = 1; i < p.length; i++) { const mx = (p[i - 1][0] + p[i][0]) / 2; d += ` C${mx} ${p[i - 1][1]} ${mx} ${p[i][1]} ${p[i][0]} ${p[i][1]}`; }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={className} aria-hidden>
      <line x1={3} x2={W - 3} y1={H / 2} y2={H / 2} stroke="currentColor" strokeOpacity={0.15} strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Kadraj kartı: o plan boyunun ya da açının gerçek bir film karesi; altında ad ve kısa not. */
function KadrajKart({ secili, onSec, gorsel, ad, not, ek, oto, yatik }: { secili: boolean; onSec: () => void; gorsel: string; ad: string; not: string; ek?: string; oto?: boolean; yatik?: boolean }) {
  return (
    <button onClick={onSec} aria-pressed={secili} className="group block min-w-0 text-left">
      <span className={cn("relative block aspect-[16/10] overflow-hidden rounded-[12px] bg-black/30 ring-inset transition-shadow", secili ? "outline outline-2 -outline-offset-2 outline-white" : "ring-1 ring-white/[0.07] group-hover:ring-white/25")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={gorsel} alt="" loading="lazy" className={cn("absolute inset-0 h-full w-full object-cover transition-transform duration-500", yatik ? "-rotate-[9deg] scale-[1.32] group-hover:scale-[1.38]" : "group-hover:scale-[1.04]", oto && "opacity-40 blur-[1px]")} />
        {oto && <span className="absolute inset-0 flex items-center justify-center"><span className="flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-[13px] font-semibold text-white ring-1 ring-inset ring-white/15 backdrop-blur"><Sparkles className="h-3.5 w-3.5 text-metin" />Oto</span></span>}
      </span>
      <span className="mt-1.5 flex items-baseline gap-1.5"><span className={cn("truncate text-[12.5px] font-semibold", secili ? "text-metin" : "text-metin")}>{ad}</span>{ek && <span className="text-[11px] font-medium text-metin-3">{ek}</span>}</span>
      <span className="block truncate text-[11.5px] text-metin-3">{not}</span>
    </button>
  );
}

/** Hareket kartı: üzerine gelince klip oynar; "İsteme ekle" etiketi istemin sonuna yazar. */
export function HareketKart({ h, sira, onEkle }: { h: Hareket; sira: number; onEkle: () => void }) {
  const [oyna, setOyna] = useState(false);
  return (
    <button onClick={onEkle} onPointerEnter={(e) => { if (e.pointerType === "mouse") setOyna(true); }} onPointerLeave={() => setOyna(false)} className="group block text-left">
      <span className={cn("relative block aspect-square overflow-hidden rounded-[12px] bg-black ring-inset transition-shadow", sira ? "outline outline-2 -outline-offset-2 outline-white" : "ring-1 ring-white/[0.08] group-hover:ring-white/30")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={posterYolu(h.klip)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        {oyna && <video src={klipYolu(h.klip)} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />}
        {sira > 0 && <span className="absolute left-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold tabular-nums text-[#0a0a0b]">{sira}</span>}
        <span className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-center rounded-[8px] bg-black/70 py-1 text-[11px] font-semibold text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 max-md:hidden">{sira ? "Tekrar ekle" : "İsteme ekle"}</span>
      </span>
      <span className="mt-1.5 block truncate px-0.5 text-center text-[12px] font-semibold text-metin">{hareketAdi(h.ad)}</span>
    </button>
  );
}

function useKameraPencere({ k, onDegis, istemHareketleri, onHareketEkle, sadeceKurulum }: {
  k: Kurulum; onDegis: (y: Partial<Kurulum>) => void;
  /** İstemde şu an sırayla geçen hareketler. */
  istemHareketleri: Hareket[]; onHareketEkle?: (h: Hareket) => void;
  /** Görsel modu: yalnız gövde/lens/odak/diyafram ve kadraj. */
  sadeceKurulum?: boolean;
}) {
  const [sekme, setSekme] = useState("kurulum");
  const [kat, setKat] = useState<HareketKat | "tumu">("tumu");
  const [ara, setAra] = useState("");
  const [sirala, setSirala] = useState(false);
  const liste = useMemo(() => {
    const q = ara.trim().toLocaleLowerCase("tr");
    const l = HAREKETLER.filter((h) => (kat === "tumu" || h.kat === kat) && (!q || hareketAdi(h.ad).toLocaleLowerCase("tr").includes(q) || h.not.toLocaleLowerCase("tr").includes(q)));
    return sirala ? [...l].sort((a, b) => hareketAdi(a.ad).localeCompare(hareketAdi(b.ad), "tr")) : l;
  }, [kat, ara, sirala]);
  const ikon = (I: typeof Camera) => <I className="h-6 w-6" strokeWidth={1.6} />;
  const ic = (() => {
    switch (sekme) {
      case "kurulum":
        return (
          <div className="flex h-full divide-x divide-white/[0.05] overflow-x-auto [scrollbar-width:none]">
            <Silindir baslik="Kamera" ogeler={GOVDELER.map((o) => ({ ...o, ikon: ikon(Camera) }))} secili={k.govde} onSec={(id) => onDegis({ govde: id })} />
            <Silindir baslik="Lens" ogeler={LENSLER.map((o) => ({ ...o, ikon: ikon(Aperture) }))} secili={k.lens} onSec={(id) => onDegis({ lens: id })} />
            <Silindir baslik="Odak" ogeler={ODAKLAR.map((o) => ({ id: String(o.mm), ad: o.ad, ikon: <AciKamasi aci={o.aci} boyut={38} className="text-metin" /> }))} secili={String(k.odak)} onSec={(id) => onDegis({ odak: Number(id) })} />
            <Silindir baslik="Diyafram" ogeler={DIYAFRAMLAR.map((o) => ({ ...o, ikon: ikon(Aperture) }))} secili={k.diyafram} onSec={(id) => onDegis({ diyafram: id })} />
          </div>
        );
      case "kadraj":
        return (
          <div className="h-full overflow-y-auto pb-4 [scrollbar-width:thin]">
            <Baslik baslik="Plan boyu" alt="Karakterin kadrajı ne kadar doldurduğu" />
            <div className="grid grid-cols-2 gap-x-3 gap-y-3.5 px-4 pt-3 sm:grid-cols-3 sm:px-5">
              {PLANLAR.map((p) => <KadrajKart key={p.id} secili={k.plan === p.id} onSec={() => onDegis({ plan: p.id })} gorsel={p.gorsel} oto={p.id === "oto"} ad={p.ad} not={p.not} ek={p.kisa || undefined} />)}
            </div>
            <Baslik baslik="Kamera açısı" alt="Kameranın özneye göre konumu" />
            <div className="grid grid-cols-2 gap-x-3 gap-y-3.5 px-4 pt-3 sm:grid-cols-3 sm:px-5">
              {ACILAR.map((a) => <KadrajKart key={a.id} secili={k.aci === a.id} onSec={() => onDegis({ aci: a.id })} gorsel={a.gorsel} oto={a.id === "oto"} yatik={a.id === "hollanda"} ad={a.ad} not={a.not} />)}
            </div>
          </div>
        );
      case "hiz":
        return (
          <div className="h-full overflow-y-auto pb-4 [scrollbar-width:thin]">
            <Baslik baslik="Hız eğrisi" alt="Çekimin zamanı: ağır çekim, rampa, donma anı" />
            <div className="grid grid-cols-2 gap-x-3 gap-y-3.5 px-4 pt-3 sm:grid-cols-3 sm:px-5">
              {HIZ_EGRILERI.map((x) => {
                const sec = k.hiz === x.id;
                return (
                  <button key={x.id} onClick={() => onDegis({ hiz: x.id })} aria-pressed={sec} className="group min-w-0 text-left">
                    <span className={cn("relative block aspect-[16/10] overflow-hidden rounded-[12px] bg-black ring-inset", sec ? "outline outline-2 -outline-offset-2 outline-white" : "ring-1 ring-white/[0.08] group-hover:ring-white/25")}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={x.gorsel} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-[1.05]" />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                      <span className={cn("absolute inset-x-2.5 bottom-2", sec ? "text-metin" : "text-white")}><Egri egri={x.egri} className="h-9 w-full" /></span>
                    </span>
                    <span className={cn("mt-1.5 block truncate text-[12.5px] font-semibold", sec ? "text-metin" : "text-metin")}>{x.ad}</span>
                    <span className="block truncate text-[11.5px] text-metin-3">{x.not}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      case "hareket":
        return (
          <div className="flex h-full flex-col">
            <Baslik baslik="Kamera hareketi yönet" alt="İstem kutusuna # etiketi olarak eklenir; istemde # yazarak da çağırabilirsin. Bir çekimde birden çok hareket olabilir, sıra önemlidir."
              sag={(
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => setSirala((v) => !v)} aria-pressed={sirala} className={cn("flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-medium transition-colors", sirala ? "text-metin" : "text-metin-3 hover:text-metin")}><ArrowDownUp className="h-3.5 w-3.5" />{sirala ? "A–Z" : "Sırala"}</button>
                  <label className="flex h-8 items-center gap-1.5 rounded-full bg-black/20 px-2.5 ring-1 ring-inset ring-white/[0.07] focus-within:ring-white/20">
                    <Search className="h-3.5 w-3.5 text-metin-3" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ara" aria-label="Hareket ara" className="w-20 bg-transparent text-[12.5px] text-metin outline-none placeholder:text-metin-3 focus:w-28" />
                  </label>
                </div>
              )} />
            <div className="gizli-scroll flex shrink-0 gap-1.5 overflow-x-auto px-4 pt-3 sm:px-5">
              {HAREKET_KATLARI.map((x) => (
                <button key={x.id} onClick={() => setKat(x.id)} aria-pressed={kat === x.id} className={cn("h-8 shrink-0 rounded-full px-3 text-[12.5px] font-medium transition-colors", kat === x.id ? "bg-white text-[#0a0a0b]" : "bg-white/[0.06] text-metin-2 hover:text-metin")}>{x.ad}</button>
              ))}
            </div>
            {istemHareketleri.length > 0 && (
              <p className="flex shrink-0 flex-wrap items-center gap-1.5 px-4 pt-2.5 text-[12px] text-metin-3 sm:px-5">İstemdeki sıra:{istemHareketleri.map((h, i) => <span key={h.ad} className="rounded-full bg-white/[0.08] px-2 py-0.5 font-semibold text-metin">{i + 1}. {hareketEtiketi(h)}</span>)}</p>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3 [scrollbar-width:thin] sm:px-5">
              <div className="grid grid-cols-3 gap-x-2.5 gap-y-3 sm:grid-cols-4">
                {liste.map((h) => <HareketKart key={h.ad} h={h} sira={istemHareketleri.indexOf(h) + 1} onEkle={() => onHareketEkle?.(h)} />)}
              </div>
              {!liste.length && <p className="py-10 text-center text-[13px] text-metin-3">“{ara}” ile eşleşen hareket yok.</p>}
            </div>
          </div>
        );
    }
  })();
  const sekmeler = [
    { id: "kurulum", ad: "Kurulum", ikon: Camera },
    ...(sadeceKurulum ? [] : [{ id: "hareket", ad: "Hareket", ikon: Move3d }]),
    { id: "kadraj", ad: "Kadraj", ikon: Focus },
    ...(sadeceKurulum ? [] : [{ id: "hiz", ad: "Hız", ikon: Gauge }]),
  ];
  return { sekmeler, sekme, setSekme, ic };
}

/* ═════════════ Renk paleti ═════════════ */

const paletOnbellek = new Map<string, string[]>();
function useSerit(url?: string) {
  const [l, setL] = useState<string[]>(() => (url ? paletOnbellek.get(url) ?? [] : []));
  useEffect(() => {
    if (!url || paletOnbellek.has(url)) return;
    let iptal = false;
    paletCikar(url, 9).then((r) => { paletOnbellek.set(url, r); if (!iptal) setL(r); }).catch(() => {});
    return () => { iptal = true; };
  }, [url]);
  return l;
}
export function PaletKart({ s, secili, onSec }: { s: Secenek; secili: boolean; onSec: () => void }) {
  const serit = useSerit(s.gorsel);
  return (
    <button onClick={onSec} aria-pressed={secili} className="group block text-left">
      <span className={cn("relative block overflow-hidden rounded-[12px] bg-black/30 ring-inset transition-shadow", secili ? "outline outline-2 -outline-offset-2 outline-white" : "ring-1 ring-white/[0.07] group-hover:ring-white/25")}>
        <span className="relative block aspect-[16/8]">
          {s.gorsel
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={s.gorsel} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            : <Doku renk={["#7dd3fc", "#f0abfc", "#fcd34d"]} className="absolute inset-0" />}
        </span>
        <span className="flex h-[14px]">
          {(serit.length ? serit : s.gorsel ? Array.from({ length: 9 }, () => "#2a2a2e") : ["#7dd3fc", "#a5b4fc", "#f0abfc", "#fda4af", "#fcd34d", "#86efac"]).map((c, i) => <span key={i} className="flex-1" style={{ background: c }} />)}
        </span>
      </span>
      <span className={cn("mt-1.5 block truncate text-center text-[12.5px] font-medium", secili ? "text-metin" : "text-metin-2 group-hover:text-metin")}>{s.ad}</span>
    </button>
  );
}

const HAZIR_RENKLER = ["#0b1f3a", "#1e3a5f", "#3b82f6", "#22d3ee", "#a7f3d0", "#fef3c7", "#fbbf24", "#f97316", "#dc2626", "#7f1d1d", "#4a044e", "#a21caf", "#f9a8d4", "#e5e7eb", "#6b7280", "#111827"];
function PaletDuzenle({ ilk, onUygula, onIptal }: { ilk: string[]; onUygula: (l: string[]) => void; onIptal: () => void }) {
  const [l, setL] = useState<string[]>(ilk.length ? ilk : ["#0b1f3a", "#22d3ee", "#fbbf24", "#dc2626", "#e5e7eb"]);
  const [cikariliyor, setCikariliyor] = useState(false);
  const dosya = useRef<HTMLInputElement>(null);
  return (
    <div className="flex h-full flex-col">
      <Baslik baslik="Yeni palet" alt="En fazla 8 renk · renk düzeni bu tonlara sadık kalır" />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4 [scrollbar-width:thin] sm:px-5">
        <div className="flex h-24 overflow-hidden rounded-[16px] ring-1 ring-inset ring-white/[0.08]">
          {l.map((c, i) => (
            <label key={i} className="group relative flex-1 cursor-pointer" style={{ background: c }}>
              <input type="color" value={c} onChange={(e) => setL((x) => x.map((y, j) => (j === i ? e.target.value : y)))} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label={`Renk ${i + 1}`} />
              <span className="absolute inset-x-0 bottom-1.5 text-center text-[10.5px] font-semibold text-white opacity-0 mix-blend-difference transition-opacity group-hover:opacity-100">{c}</span>
              {l.length > 2 && <button onClick={(e) => { e.preventDefault(); setL((x) => x.filter((_, j) => j !== i)); }} aria-label={`Renk ${i + 1} kaldır`} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"><X className="h-3 w-3" /></button>}
            </label>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button onClick={() => l.length < 8 && setL((x) => [...x, "#888888"])} disabled={l.length >= 8} className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] font-medium text-metin hover:bg-white/[0.12] disabled:opacity-40"><Plus className="h-3.5 w-3.5" />Renk ekle</button>
          <button onClick={() => dosya.current?.click()} disabled={cikariliyor} className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] font-medium text-metin hover:bg-white/[0.12] disabled:opacity-50"><Film className="h-3.5 w-3.5" />{cikariliyor ? "Çıkarılıyor…" : "Görselden çıkar"}</button>
          <input ref={dosya} type="file" accept="image/*" hidden onChange={(e) => {
            const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
            setCikariliyor(true); const u = URL.createObjectURL(f);
            paletCikar(u, 6).then((r) => r.length && setL(r)).finally(() => { URL.revokeObjectURL(u); setCikariliyor(false); });
          }} />
        </div>
        <p className="mb-2 mt-5 text-[12px] font-medium text-metin-3">Hızlı renkler · tıkla, eklensin</p>
        <div className="flex flex-wrap gap-1.5">
          {HAZIR_RENKLER.map((c) => <button key={c} onClick={() => l.length < 8 && setL((x) => [...x, c])} aria-label={c} className="h-7 w-7 rounded-full ring-1 ring-inset ring-white/15 transition-transform hover:scale-110" style={{ background: c }} />)}
        </div>
      </div>
      <div className="flex shrink-0 justify-center gap-2 border-t border-white/[0.05] p-3">
        <button onClick={onIptal} className="h-9 rounded-full px-4 text-[13px] font-medium text-metin-2 hover:text-metin">Vazgeç</button>
        <button onClick={() => onUygula(l)} className="h-9 rounded-full bg-white px-5 text-[13px] font-semibold text-[#0a0a0b]">Uygula</button>
      </div>
    </div>
  );
}

/* ═════════════ Işık ═════════════ */

const YENI_ISIK = (): IsikKaynak => ({ renk: "#ffffff", parlaklik: 60, yumusak: 50, yatay: -40, dikey: 25 });
/** Küre: ışık noktası sürüklenir; yatay ±180°, dikey ±90°. */
function IsikKuresi({ l, aktif, onSec, onTasi }: { l: IsikKaynak[]; aktif: number; onSec: (i: number) => void; onTasi: (yatay: number, dikey: number) => void }) {
  const ref = useRef<SVGSVGElement>(null);
  const R = 92;
  const konum = (x: IsikKaynak) => {
    const a = (x.yatay * Math.PI) / 180, b = (x.dikey * Math.PI) / 180;
    return { x: 110 + Math.sin(a) * Math.cos(b) * R, y: 110 - Math.sin(b) * R, on: Math.cos(a) * Math.cos(b) > -0.05 };
  };
  const surukle = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * 220 - 110, py = 110 - ((e.clientY - r.top) / r.height) * 220;
    const dikey = Math.max(-89, Math.min(89, (Math.asin(Math.max(-1, Math.min(1, py / R))) * 180) / Math.PI));
    const cb = Math.cos((dikey * Math.PI) / 180) || 0.01;
    const s = Math.max(-1, Math.min(1, px / (R * cb)));
    const arka = l[aktif] && Math.abs(l[aktif].yatay) > 90;
    let yatay = (Math.asin(s) * 180) / Math.PI;
    if (arka) yatay = (yatay >= 0 ? 180 : -180) - yatay;
    onTasi(Math.round(yatay), Math.round(dikey));
  };
  return (
    <svg ref={ref} viewBox="0 0 220 220" className="w-[220px] touch-none select-none"
      onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); surukle(e); }} onPointerMove={(e) => { if (e.buttons) surukle(e); }}>
      <defs>
        <radialGradient id="kure" cx="40%" cy="35%"><stop offset="0%" stopColor="#3a3a40" /><stop offset="100%" stopColor="#1a1a1d" /></radialGradient>
      </defs>
      <circle cx={110} cy={110} r={R} fill="url(#kure)" stroke="rgba(255,255,255,0.12)" />
      {[-60, -30, 0, 30, 60].map((d) => <ellipse key={d} cx={110} cy={110 - Math.sin((d * Math.PI) / 180) * R} rx={Math.cos((d * Math.PI) / 180) * R} ry={Math.cos((d * Math.PI) / 180) * R * 0.18} fill="none" stroke="rgba(255,255,255,0.07)" />)}
      {[0, 45, 90, 135].map((a) => <ellipse key={a} cx={110} cy={110} rx={Math.abs(Math.sin((a * Math.PI) / 180)) * R} ry={R} fill="none" stroke="rgba(255,255,255,0.07)" />)}
      {/* Özne */}
      <rect x={94} y={92} width={32} height={40} rx={9} fill="#d4d4d8" fillOpacity={0.85} />
      <circle cx={110} cy={80} r={11} fill="#d4d4d8" fillOpacity={0.9} />
      {l.map((x, i) => {
        const p = konum(x);
        return (
          <g key={i} onPointerDown={(e) => { e.stopPropagation(); onSec(i); (e.target as Element).setPointerCapture?.(e.pointerId); }} className="cursor-grab">
            <line x1={p.x} y1={p.y} x2={110} y2={100} stroke={x.renk} strokeOpacity={p.on ? 0.5 : 0.18} strokeDasharray="3 3" />
            <circle cx={p.x} cy={p.y} r={i === aktif ? 11 : 8} fill={x.renk} fillOpacity={p.on ? 1 : 0.35} stroke={i === aktif ? "#55d6fd" : "#0b0b0c"} strokeWidth={i === aktif ? 3 : 2} />
            <text x={p.x} y={p.y + 3.5} textAnchor="middle" fontSize={9} fontWeight={800} fill="#0b0b0c" className="pointer-events-none">{i + 1}</text>
          </g>
        );
      })}
    </svg>
  );
}
function Kaydirici({ ad, deger, onDeger }: { ad: string; deger: number; onDeger: (v: number) => void }) {
  return (
    <label className="relative flex h-9 items-center overflow-hidden rounded-[10px] bg-black/25 px-3 ring-1 ring-inset ring-white/[0.07]">
      <span className="absolute inset-y-0 left-0 bg-white/[0.1]" style={{ width: `${deger}%` }} />
      <span className="relative flex-1 text-[12.5px] text-metin-2">{ad}</span><span className="relative text-[12.5px] font-semibold tabular-nums text-metin">yüzde {deger}</span>
      <input type="range" min={0} max={100} value={deger} onChange={(e) => onDeger(Number(e.target.value))} aria-label={ad} className="absolute inset-0 cursor-ew-resize opacity-0" />
    </label>
  );
}
function IsikDuzenle({ ilk, onUygula }: { ilk: IsikKaynak[]; onUygula: (l: IsikKaynak[]) => void }) {
  const [l, setL] = useState<IsikKaynak[]>(ilk.length ? ilk : [YENI_ISIK()]);
  const [aktif, setAktif] = useState(0);
  const a = l[Math.min(aktif, l.length - 1)];
  const yaz = (y: Partial<IsikKaynak>) => setL((x) => x.map((z, i) => (i === aktif ? { ...z, ...y } : z)));
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-center gap-1.5 pt-3">
        {l.map((x, i) => (
          <button key={i} onClick={() => setAktif(i)} aria-pressed={i === aktif} className={cn("flex h-8 items-center gap-1.5 rounded-full pl-2 pr-3 text-[12.5px] font-semibold transition-colors", i === aktif ? "bg-white/[0.12] text-metin" : "text-metin-3 hover:text-metin")}>
            <span className="h-3 w-3 rounded-full ring-1 ring-white/30" style={{ background: x.renk }} />Işık {i + 1}
            {l.length > 1 && i === aktif && <Trash2 onClick={(e) => { e.stopPropagation(); setL((z) => z.filter((_, j) => j !== i)); setAktif(0); }} className="ml-0.5 h-3.5 w-3.5 text-metin-3 hover:text-rose-300" aria-label="Işığı sil" />}
          </button>
        ))}
        {l.length < 3 && <button onClick={() => { setL((x) => [...x, { ...YENI_ISIK(), yatay: 60, renk: "#ffd7a8" }]); setAktif(l.length); }} className="flex h-8 items-center gap-1 rounded-full px-3 text-[12.5px] font-medium text-metin-3 hover:text-metin"><Plus className="h-3.5 w-3.5" />Işık ekle</button>}
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto px-4 py-2 sm:flex-row sm:gap-6">
        <div className="w-full max-w-[190px] space-y-2 max-sm:order-2">
          <p className="text-[11.5px] text-metin-3">Işık {aktif + 1}</p>
          <label className="relative flex h-9 items-center gap-2 rounded-[10px] bg-black/25 px-3 ring-1 ring-inset ring-white/[0.07]">
            <span className="flex-1 text-[12.5px] text-metin-2">Renk</span>
            <span className="h-4 w-4 rounded-full ring-1 ring-white/30" style={{ background: a.renk }} /><span className="text-[12px] font-semibold tabular-nums text-metin">{a.renk}</span>
            <input type="color" value={a.renk} onChange={(e) => yaz({ renk: e.target.value })} aria-label="Işık rengi" className="absolute inset-0 cursor-pointer opacity-0" />
          </label>
          <Kaydirici ad="Parlaklık" deger={a.parlaklik} onDeger={(v) => yaz({ parlaklik: v })} />
          <Kaydirici ad="Yumuşaklık" deger={a.yumusak} onDeger={(v) => yaz({ yumusak: v })} />
        </div>
        <IsikKuresi l={l} aktif={aktif} onSec={setAktif} onTasi={(yatay, dikey) => yaz({ yatay, dikey })} />
        <div className="w-full max-w-[190px] max-sm:order-3">
          <p className="mb-2 text-[11.5px] text-metin-3">Hızlı yön</p>
          <div className="grid grid-cols-2 gap-1.5">
            {YON_KISAYOL.map((y) => {
              const sec = a.yatay === y.yatay && a.dikey === y.dikey;
              return <button key={y.ad} onClick={() => yaz({ yatay: y.yatay, dikey: y.dikey })} aria-pressed={sec} className={cn("h-9 rounded-[10px] text-[12.5px] font-semibold transition-colors", sec ? "bg-white/[0.1] text-metin ring-1 ring-inset ring-white/70" : "bg-black/25 text-metin-2 ring-1 ring-inset ring-white/[0.07] hover:text-metin")}>{y.ad}</button>;
            })}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 justify-center border-t border-white/[0.05] p-3">
        <button onClick={() => onUygula(l)} className="h-9 rounded-full bg-white px-6 text-[13px] font-semibold text-[#0a0a0b]">Uygula</button>
      </div>
    </div>
  );
}

/* ═════════════ Dışa açılan pencere ═════════════ */

export function KurulumPenceresi({ tur, k, onDegis, onKapat, istemHareketleri = [], onHareketEkle, gorselModu, ozel }: {
  /** ozel: palet/ışık penceresini doğrudan düzenleyicide aç. */
  ozel?: boolean;
  tur: PencereTur | null; k: Kurulum; onDegis: (y: Partial<Kurulum>) => void; onKapat: () => void;
  istemHareketleri?: Hareket[]; onHareketEkle?: (h: Hareket) => void; gorselModu?: boolean;
}) {
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  if (!hazir) return null;
  return createPortal(
    <AnimatePresence>
      {tur && <Ic key={tur} tur={tur} k={k} onDegis={onDegis} onKapat={onKapat} istemHareketleri={istemHareketleri} onHareketEkle={onHareketEkle} gorselModu={gorselModu} ozel={ozel} />}
    </AnimatePresence>,
    document.body,
  );
}

function Ic({ tur, k, onDegis, onKapat, istemHareketleri, onHareketEkle, gorselModu, ozel }: {
  ozel?: boolean;
  tur: PencereTur; k: Kurulum; onDegis: (y: Partial<Kurulum>) => void; onKapat: () => void;
  istemHareketleri: Hareket[]; onHareketEkle?: (h: Hareket) => void; gorselModu?: boolean;
}) {
  const [filmSekme, setFilmSekme] = useState("tur");
  const [duzenle, setDuzenle] = useState(!!ozel);
  const kamera = useKameraPencere({ k, onDegis, istemHareketleri, onHareketEkle, sadeceKurulum: gorselModu });

  if (tur === "film") {
    const sifirla = () => onDegis({ tur: "oto", donem: "oto", tempo: "oto", duygu: "", yogunluk: 2 });
    return (
      <Kabuk baslik="Film kurulumu" onKapat={onKapat} onSifirla={sifirla} sekme={filmSekme} onSekme={setFilmSekme}
        sekmeler={[{ id: "tur", ad: "Tür", ikon: Theater }, { id: "donem", ad: "Dönem", ikon: History }, { id: "tempo", ad: "Tempo", ikon: Clapperboard }, { id: "oyunculuk", ad: "Oyunculuk", ikon: Smile }]}>
        {filmSekme === "tur" ? <TurCarki k={k} onDegis={onDegis} /> : filmSekme === "donem" ? <DonemCetveli k={k} onDegis={onDegis} /> : filmSekme === "tempo" ? <TempoSeridi k={k} onDegis={onDegis} /> : <DuyguCarki k={k} onDegis={onDegis} />}
      </Kabuk>
    );
  }
  if (tur === "kamera") {
    const sifirla = () => onDegis({ govde: "oto", lens: "oto", odak: 0, diyafram: "oto", plan: "oto", aci: "oto", hiz: "oto" });
    return (
      <Kabuk baslik={gorselModu ? "Kamerayı kur" : "Kamera"} onKapat={onKapat} onSifirla={sifirla} sekmeler={kamera.sekmeler} sekme={kamera.sekme} onSekme={kamera.setSekme}>{kamera.ic}</Kabuk>
    );
  }
  if (tur === "palet") {
    if (duzenle) return (
      <Kabuk baslik="Yeni palet" onKapat={onKapat} geri={() => setDuzenle(false)}>
        <PaletDuzenle ilk={k.paletOzel ?? []} onIptal={() => setDuzenle(false)} onUygula={(l) => { onDegis({ palet: "ozel", paletOzel: l }); setDuzenle(false); onKapat(); }} />
      </Kabuk>
    );
    return (
      <Kabuk baslik="Renk paleti" onKapat={onKapat} onSifirla={() => onDegis({ palet: "oto", paletOzel: undefined })}>
        <SecimIzgara baslik="Renk paletini kur" alt="Renk düzeninin izleyeceği palet" ogeler={PALETLER} kolon="grid-cols-2 sm:grid-cols-4"
          yeni={{ ad: k.palet === "ozel" ? "Özel paleti düzenle" : "Yeni palet", onTik: () => setDuzenle(true), ozelRenkler: k.palet === "ozel" ? k.paletOzel : undefined }}
          kart={(s) => <PaletKart key={s.id} s={s} secili={k.palet === s.id} onSec={() => onDegis({ palet: s.id })} />} />
      </Kabuk>
    );
  }
  if (duzenle) return (
    <Kabuk baslik="Yeni ışık kurgusu" onKapat={onKapat} geri={() => setDuzenle(false)} onSifirla={() => onDegis({ isik: "oto", isikOzel: undefined })}>
      <IsikDuzenle ilk={k.isikOzel ?? []} onUygula={(l) => { onDegis({ isik: "ozel", isikOzel: l }); setDuzenle(false); onKapat(); }} />
    </Kabuk>
  );
  return (
    <Kabuk baslik="Işık" onKapat={onKapat} onSifirla={() => onDegis({ isik: "oto", isikOzel: undefined })}>
      <SecimIzgara baslik="Işığı kur" alt="Hazır bir şema seç ya da kendi ışıklarını yerleştir" ogeler={ISIKLAR} kolon="grid-cols-2 sm:grid-cols-3"
        yeni={{ ad: k.isik === "ozel" ? "Işık kurgunu düzenle" : "Yeni ışık kurgusu", onTik: () => setDuzenle(true), isikSayi: k.isik === "ozel" ? k.isikOzel?.length : undefined }}
        kart={(s) => <IsikKart key={s.id} s={s} secili={k.isik === s.id} onSec={() => onDegis({ isik: s.id })} />} />
    </Kabuk>
  );
}

export function IsikKart({ s, secili, onSec }: { s: Secenek; secili: boolean; onSec: () => void }) {
  return (
    <button onClick={onSec} aria-pressed={secili} className="group block text-left">
      <span className={cn("relative block aspect-[16/9] overflow-hidden rounded-[12px] bg-black/30 ring-inset transition-shadow", secili ? "outline outline-2 -outline-offset-2 outline-white" : "ring-1 ring-white/[0.07] group-hover:ring-white/25")}>
        {s.gorsel
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={s.gorsel} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
          : <Doku renk={["#cbd5e1", "#64748b", "#e2e8f0"]} className="absolute inset-0" />}
      </span>
      <span className={cn("mt-1.5 block truncate text-center text-[12.5px] font-semibold", secili ? "text-metin" : "text-metin")}>{s.ad}</span>
    </button>
  );
}

function SecimIzgara({ baslik, alt, ogeler, kart, kolon, yeni }: {
  baslik: string; alt: string; ogeler: Secenek[]; kart: (s: Secenek) => React.ReactNode; kolon: string;
  yeni: { ad: string; onTik: () => void; ozelRenkler?: string[]; isikSayi?: number };
}) {
  const [ara, setAra] = useState("");
  const [sirala, setSirala] = useState(false);
  const l = useMemo(() => {
    const q = ara.trim().toLocaleLowerCase("tr");
    const x = ogeler.filter((s) => !q || s.ad.toLocaleLowerCase("tr").includes(q) || s.not.toLocaleLowerCase("tr").includes(q));
    return sirala ? [x[0], ...x.slice(1).sort((a, b) => a.ad.localeCompare(b.ad, "tr"))].filter(Boolean) : x;
  }, [ogeler, ara, sirala]);
  const secili = !!yeni.ozelRenkler?.length || !!yeni.isikSayi;
  return (
    <div className="flex h-full flex-col">
      <Baslik baslik={baslik} alt={alt} sag={(
        <div className="flex shrink-0 items-center gap-1">
          <button onClick={() => setSirala((v) => !v)} aria-pressed={sirala} className={cn("flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-medium transition-colors", sirala ? "text-metin" : "text-metin-3 hover:text-metin")}><ArrowDownUp className="h-3.5 w-3.5" />{sirala ? "A–Z" : "Sırala"}</button>
          <label className="flex h-8 items-center gap-1.5 rounded-full bg-black/20 px-2.5 ring-1 ring-inset ring-white/[0.07] focus-within:ring-white/20">
            <Search className="h-3.5 w-3.5 text-metin-3" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ara" aria-label="Ara" className="w-20 bg-transparent text-[12.5px] text-metin outline-none placeholder:text-metin-3 focus:w-28" />
          </label>
        </div>
      )} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3 [scrollbar-width:thin] sm:px-5">
        <div className={cn("grid gap-x-3 gap-y-3.5", kolon)}>
          <button onClick={yeni.onTik} className="group block text-left">
            <span className={cn("relative flex aspect-[16/9] flex-col items-center justify-center gap-2 overflow-hidden rounded-[12px] bg-white/[0.04] ring-inset transition-colors group-hover:bg-white/[0.07]", secili ? "outline outline-2 -outline-offset-2 outline-white" : "ring-1 ring-white/[0.1]")}>
              {yeni.ozelRenkler?.length ? <span className="absolute inset-0 flex">{yeni.ozelRenkler.map((c, i) => <span key={i} className="flex-1" style={{ background: c }} />)}</span> : null}
              <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.1] text-metin ring-1 ring-inset ring-white/15 backdrop-blur"><Plus className="h-4 w-4" /></span>
              {!!yeni.isikSayi && <span className="relative text-[11.5px] font-semibold text-metin">{yeni.isikSayi} ışık</span>}
            </span>
            <span className={cn("mt-1.5 block truncate text-center text-[12.5px] font-semibold", secili ? "text-metin" : "text-metin")}>{yeni.ad}</span>
          </button>
          {l.map((s) => kart(s))}
        </div>
        {l.length === 0 && <p className="py-10 text-center text-[13px] text-metin-3">“{ara}” ile eşleşen yok.</p>}
      </div>
    </div>
  );
}

/** Dışa: pencereyi açmak için hazır değerler (kartlardaki küçük görseller). */
export const kartGorseli = {
  film: (k: Kurulum) => (k.tur !== "oto" ? bul(TURLER, k.tur).gorsel : undefined),
  kamera: (k: Kurulum) => (k.govde !== "oto" ? bul(GOVDELER, k.govde).gorsel : k.lens !== "oto" ? bul(LENSLER, k.lens).gorsel : undefined),
  palet: (k: Kurulum) => (k.palet !== "oto" && k.palet !== "ozel" ? bul(PALETLER, k.palet).gorsel : undefined),
  isik: (k: Kurulum) => (k.isik !== "oto" && k.isik !== "ozel" ? bul(ISIKLAR, k.isik).gorsel : undefined),
};
