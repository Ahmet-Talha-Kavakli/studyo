"use client";

/**
 * ElementMention — Higgsfield'ın `@element` sistemi, BİREBİR.
 *
 * Referans ekran görüntüleri (kullanıcı tarafından sağlandı):
 *  1) Prompt'a `@` yazılınca → element listesi (kare foto + ad + seçilide ✓)
 *  2) Seçilince prompt'a LIME `@Talha` hapı gömülür — solunda `×` (kaldır),
 *     sağında gülen-yüz ikonu (duygu seçici)
 *  3) Hapın üstüne gelince → BÜYÜK portre önizleme kartı (altında @ad)
 *  4) Gülen-yüz ikonuna tıklayınca → 8 DİLİMLİ DUYGU ÇARKI:
 *     üstte seçili duygunun adı, ortada dairesel yüz, çevresinde 8 dilim
 *     (Umut · Öfke · Neşe · Güven · Korku · Şaşkınlık · Üzüntü · Tiksinti)
 *  5) `+` menüsü → Referans olarak / Başlangıç karesi olarak / Son kare olarak
 *
 * Tasarım kararı: prompt'u contentEditable yapmak yerine, textarea'nın ÜSTÜNE
 * hizalı bir katman çiziyoruz. Böylece imleç/seçim/geri-al davranışı bozulmuyor,
 * haplar da tam metin konumunda görünüyor.
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { seciciKonumHesapla, seciciStil, type SeciciKonum } from "@/lib/seciciKonum";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Smile, ImagePlus, ArrowRightToLine, ArrowLeftToLine, Layers, AtSign, Search } from "lucide-react";
import { cn, onizlemeArka } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Duygular — referanstaki 8 dilim, saat yönünde                       */
/* ------------------------------------------------------------------ */
export const DUYGULAR = [
  "Umut", "Öfke", "Neşe", "Güven", "Korku", "Şaşkınlık", "Üzüntü", "Tiksinti",
] as const;
export type Duygu = (typeof DUYGULAR)[number] | "Nötr";

export type MentionElement = {
  id: string;
  ad: string;          // "@" olmadan
  gorselUrl?: string;
  kategori?: string;   // Karakter / Mekan / Nesne
};

/* ------------------------------------------------------------------ */
/* 1) Element listesi — `@` yazınca veya çipe tıklayınca açılır         */
/* ------------------------------------------------------------------ */
export function ElementListesi({
  acik, kapat, elementler, secili, onSec, konum,
}: {
  acik: boolean; kapat: () => void;
  elementler: MentionElement[];
  secili: string[];
  onSec: (e: MentionElement) => void;
  konum: SeciciKonum | null;
}) {
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  if (!hazir) return null;

  return createPortal(
    <AnimatePresence>
      {acik && konum && (
        <>
          <div className="fixed inset-0 z-[160]" onClick={kapat} />
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }} transition={{ duration: 0.15 }}
            /* Yön ORTAK HESAPTAN gelir (yukarı sığmazsa aşağı) — eskiden
               koşulsuz yukarı açılıyor, sığmayınca ekran dışında kalıyordu.
               (eski not: konum.top aslında "alt kenarın viewport altından
               uzaklığı" (bottom). Composer sayfanın altında olduğu için liste
               aşağı açılınca ekran dışında kalıyordu. */
            style={{ ...seciciStil(konum), width: 320 }}
            className="sinema-kapsam hf-pop z-[161] max-h-[320px] overflow-y-auto rounded-2xl p-1.5">
            {elementler.length === 0 ? (
              <p className="px-3 py-6 text-center text-[13px] text-metin-3">Henüz element yok</p>
            ) : elementler.map((e) => {
              const aktif = secili.includes(e.ad);
              return (
                <button key={e.id} onClick={() => onSec(e)}
                  className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-white/[0.07]">
                  <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white/[0.06]"
                    style={e.gorselUrl ? { background: `url("${e.gorselUrl}") center/cover` } : undefined} />
                  <span className="min-w-0 flex-1 truncate text-[16px] font-medium text-metin">{e.ad}</span>
                  {aktif && <Check className="h-[18px] w-[18px] shrink-0 text-metin-2" />}
                </button>
              );
            })}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/* 2) Duygu çarkı — 8 dilim, ortada yüz                                */
/* ------------------------------------------------------------------ */
export function DuyguCarki({
  acik, kapat, element, deger, onDeger, konum,
}: {
  acik: boolean; kapat: () => void;
  element: MentionElement | null;
  deger: Duygu; onDeger: (d: Duygu) => void;
  konum: SeciciKonum | null;
}) {
  const [hazir, setHazir] = useState(false);
  const [uzerinde, setUzerinde] = useState<Duygu | null>(null);
  useEffect(() => setHazir(true), []);
  if (!hazir) return null;

  const BOY = 300;          // çark kutusu
  const ic = 52;            // ortadaki yüz yarıçapı
  const dis = 140;          // dilim dış yarıçapı
  const merkez = BOY / 2;

  /** i. dilimin SVG path'i (8 eşit dilim, üstten başlayıp saat yönünde). */
  const dilimPath = (i: number) => {
    const adim = (Math.PI * 2) / 8;
    // -90° offset: ilk dilim üst-ortada başlasın; her dilim arası 2° boşluk.
    const bos = 0.035;
    const a0 = -Math.PI / 2 + i * adim - adim / 2 + bos;
    const a1 = -Math.PI / 2 + i * adim + adim / 2 - bos;
    const p = (r: number, a: number) => `${merkez + r * Math.cos(a)} ${merkez + r * Math.sin(a)}`;
    return `M ${p(ic, a0)} L ${p(dis, a0)} A ${dis} ${dis} 0 0 1 ${p(dis, a1)} L ${p(ic, a1)} A ${ic} ${ic} 0 0 0 ${p(ic, a0)} Z`;
  };
  /** i. dilimin etiket konumu. */
  const etiketKonum = (i: number) => {
    const adim = (Math.PI * 2) / 8;
    const a = -Math.PI / 2 + i * adim;
    const r = (ic + dis) / 2;
    return { x: merkez + r * Math.cos(a), y: merkez + r * Math.sin(a) };
  };

  return createPortal(
    <AnimatePresence>
      {acik && konum && (
        <>
          <div className="fixed inset-0 z-[170]" onClick={kapat} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            /* Duygu çarkı da YUKARI açılır (konum.top = alt kenar mesafesi). */
            style={{ position: "fixed", bottom: konum.top, left: konum.left }}
            className="sinema-kapsam hf-pop z-[171] rounded-[26px] p-4">
            {/* Üstte seçili/hover duygunun adı */}
            <p className="mb-1 text-center text-[19px] font-medium text-metin">
              {uzerinde ?? (deger === "Nötr" ? "Nötr" : deger)}
            </p>
            <div className="relative" style={{ width: BOY, height: BOY }}>
              <svg width={BOY} height={BOY} className="absolute inset-0">
                {DUYGULAR.map((d, i) => {
                  const aktif = deger === d || uzerinde === d;
                  return (
                    <path key={d} d={dilimPath(i)}
                      onMouseEnter={() => setUzerinde(d)} onMouseLeave={() => setUzerinde(null)}
                      onClick={() => { onDeger(d); kapat(); }}
                      className="cursor-pointer transition-all"
                      fill={aktif ? "rgba(85, 214, 253,0.20)" : "rgba(255,255,255,0.055)"}
                      stroke={aktif ? "var(--sn-lime,#55d6fd)" : "rgba(255,255,255,0.07)"}
                      strokeWidth={aktif ? 1.4 : 1} />
                  );
                })}
              </svg>
              {/* Dilim etiketleri */}
              {DUYGULAR.map((d, i) => {
                const { x, y } = etiketKonum(i);
                const aktif = deger === d || uzerinde === d;
                return (
                  <span key={d}
                    onMouseEnter={() => setUzerinde(d)} onMouseLeave={() => setUzerinde(null)}
                    onClick={() => { onDeger(d); kapat(); }}
                    style={{ left: x, top: y }}
                    className={cn("pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer whitespace-nowrap text-[14px] transition-colors",
                      aktif ? "font-semibold text-metin" : "text-metin-2")}>
                    {d}
                  </span>
                );
              })}
              {/* Ortadaki yüz — tıklayınca Nötr'e döner */}
              <button onClick={() => { onDeger("Nötr"); kapat(); }}
                title="Nötr"
                style={{ left: merkez, top: merkez, width: ic * 2 - 8, height: ic * 2 - 8 }}
                className="absolute -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-white/[0.07]"
                aria-label="Nötr">
                {element?.gorselUrl && (
                  <span className="block h-full w-full" style={{ background: `url("${element.gorselUrl}") center/cover` }} />
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/* 3) Mention hapı — prompt satırının altında, lime                     */
/* ------------------------------------------------------------------ */
export function MentionHapi({
  element, duygu, onKaldir, onDuygu,
}: {
  element: MentionElement; duygu: Duygu;
  onKaldir: () => void;
  onDuygu: (konum: SeciciKonum | null) => void;
}) {
  const [onizleme, setOnizleme] = useState(false);
  const hapRef = useRef<HTMLSpanElement>(null);
  const [onizKonum, setOnizKonum] = useState<{ top: number; left: number } | null>(null);
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);

  const onizAc = () => {
    const r = hapRef.current?.getBoundingClientRect();
    if (r) setOnizKonum({ top: r.top - 12, left: r.left + r.width / 2 });
    setOnizleme(true);
  };

  return (
    <>
      <span ref={hapRef}
        onMouseEnter={onizAc} onMouseLeave={() => setOnizleme(false)}
        className="group/hap inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg bg-white/[0.08] pl-1 pr-2">
        {/* × kaldır — referansta hapın SOLUNDA, koyu daire */}
        <button onClick={onKaldir} aria-label="Kaldır"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80">
          <X className="h-3 w-3" strokeWidth={2.6} />
        </button>
        <span className="text-[15px] font-medium" style={{ color: "var(--sn-lime,#55d6fd)" }}>@{element.ad}</span>
        {/* Duygu seçici — gülen yüz; seçiliyse lime */}
        <button aria-label="Duygu seç"
          onClick={(e) => {
            onDuygu(seciciKonumHesapla(e.currentTarget as HTMLElement, 332));
          }}
          className={cn("shrink-0 transition-colors", duygu !== "Nötr" ? "text-aksan" : "text-metin-3 hover:text-metin")}>
          <Smile className="h-4 w-4" />
        </button>
      </span>

      {/* Hover önizleme — büyük portre kartı */}
      {hazir && createPortal(
        <AnimatePresence>
          {onizleme && onizKonum && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }} transition={{ duration: 0.14 }}
              style={{ position: "fixed", top: onizKonum.top, left: onizKonum.left, transform: "translate(-50%,-100%)" }}
              className="sinema-kapsam hf-pop pointer-events-none z-[165] overflow-hidden rounded-[22px] p-2">
              <span className="relative block h-[230px] w-[180px] overflow-hidden rounded-2xl bg-white/[0.06]"
                style={element.gorselUrl ? { background: `url("${element.gorselUrl}") center/cover` } : undefined}>
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2.5 pt-8">
                  <span className="text-[15px] font-semibold text-white">@{element.ad}</span>
                </span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 3b) Kadro token'ı — AI Kadro composer'ında (referans: kadro/)        */
/*     Hover → büyük önizleme + "Element olarak kaydet"                 */
/*     Tıkla → "@X yerine:" değiştirme paneli (arama + seçenekler)      */
/* ------------------------------------------------------------------ */
export function KadroTokeni({
  ad, tohum, secenekler, onDegis, onKaldir, onElementKaydet,
}: {
  ad: string;
  tohum?: string;
  secenekler: string[];
  onDegis: (yeni: string) => void;
  onKaldir: () => void;
  onElementKaydet: () => void;
}) {
  const [onizleme, setOnizleme] = useState(false);
  const [panel, setPanel] = useState(false);
  const [ara, setAra] = useState("");
  const [konum, setKonum] = useState<SeciciKonum | null>(null);
  const refEl = useRef<HTMLSpanElement>(null);
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);

  const konumOlc = () => setKonum(seciciKonumHesapla(refEl.current, 330));

  const suzulen = secenekler.filter((s) => s.toLocaleLowerCase("tr").includes(ara.toLocaleLowerCase("tr")));

  return (
    <>
      <span ref={refEl}
        onMouseEnter={() => { if (!panel) { konumOlc(); setOnizleme(true); } }}
        onMouseLeave={() => setOnizleme(false)}
        onClick={() => { konumOlc(); setOnizleme(false); setPanel(true); setAra(""); }}
        className={cn("group/tk inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-white/[0.08] pl-1 pr-2.5 transition-colors hover:bg-white/[0.13]",
          panel && "ring-1 ring-white/40")}>
        {/* Sol yuvarlak: normalde önizleme, hover'da × (kaldır) */}
        {panel ? (
          <button onClick={(e) => { e.stopPropagation(); onKaldir(); setPanel(false); }} aria-label="Kaldır"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/60 text-white">
            <X className="h-3 w-3" strokeWidth={2.6} />
          </button>
        ) : (
          <span className="h-5 w-5 shrink-0 rounded-full bg-white/15"
            style={tohum ? { background: `var(--tok-${tohum})` } : undefined}>
            <span className="block h-full w-full rounded-full"
              style={tohum ? { background: onizlemeArkaTok(tohum) } : undefined} />
          </span>
        )}
        <span className="text-[15px] font-medium" style={{ color: "var(--sn-lime,#55d6fd)" }}>@{ad}</span>
      </span>

      {hazir && createPortal(
        <>
          {/* Hover önizleme kartı */}
          <AnimatePresence>
            {onizleme && konum && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }} transition={{ duration: 0.14 }}
                style={seciciStil(konum)}
                className="sinema-kapsam hf-pop z-[166] w-[210px] overflow-hidden rounded-[20px] p-2">
                <span className="relative block h-[250px] w-full overflow-hidden rounded-2xl bg-white/[0.06]"
                  style={tohum ? { background: onizlemeArkaTok(tohum) } : undefined}>
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2.5 pt-8">
                    <span className="text-[15px] font-semibold text-white">@{ad}</span>
                  </span>
                </span>
                <button onClick={onElementKaydet}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.10] py-2.5 text-[14px] font-medium text-metin transition-colors hover:bg-white/[0.16]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15"><AtSign className="h-3 w-3" /></span>
                  Element olarak kaydet
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Değiştirme paneli */}
          <AnimatePresence>
            {panel && konum && (
              <>
                <div className="fixed inset-0 z-[167]" onClick={() => setPanel(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }} transition={{ duration: 0.15 }}
                  style={{ ...seciciStil(konum), width: 320 }}
                  className="sinema-kapsam hf-pop z-[168] flex max-h-[420px] flex-col overflow-hidden rounded-[20px]">
                  <p className="px-4 pb-2 pt-3.5 text-[15px] text-metin-2">@{ad} yerine:</p>
                  <div className="mx-3 mb-2 flex items-center gap-2 rounded-xl bg-black/40 px-3 py-2.5">
                    <Search className="h-4 w-4 shrink-0 text-metin-3" />
                    <input value={ara} onChange={(e) => setAra(e.target.value)} autoFocus placeholder="Ara"
                      className="w-full bg-transparent text-[15px] text-metin outline-none placeholder:text-metin-3" />
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2">
                    {suzulen.length === 0 ? (
                      <p className="px-3 py-6 text-center text-[13px] text-metin-3">Sonuç yok</p>
                    ) : suzulen.map((s) => (
                      <button key={s} onClick={() => { onDegis(s); setPanel(false); }}
                        className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-white/[0.07]">
                        <span className="h-10 w-10 shrink-0 rounded-lg bg-white/[0.06]"
                          style={tohum ? { background: onizlemeArkaTok(`${tohum.split("-")[0]}-${s}`) } : undefined} />
                        <span className="min-w-0 flex-1 truncate text-[16px] text-metin">{s}</span>
                        {s === ad && <Check className="h-4 w-4 shrink-0 text-aksan" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>,
        document.body,
      )}
    </>
  );
}

/** Token önizlemesi için deterministik gradyan (utils.onizlemeArka sarmalayıcısı). */
function onizlemeArkaTok(tohum: string): string {
  return onizlemeArka(tohum, "portre");
}

/* ------------------------------------------------------------------ */
/* 4) `+` menüsü — Referans / Başlangıç karesi / Son kare               */
/* ------------------------------------------------------------------ */
export function ReferansMenu({
  acik, kapat, konum, onSec, bitisVar,
}: {
  acik: boolean; kapat: () => void;
  konum: SeciciKonum | null;
  onSec: (tip: "referans" | "baslangic" | "bitis") => void;
  bitisVar?: boolean;
}) {
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  if (!hazir) return null;
  const ogeler = [
    { id: "referans" as const, ad: "Referans olarak", Ik: Layers },
    { id: "baslangic" as const, ad: "Başlangıç karesi olarak", Ik: ArrowRightToLine },
    ...(bitisVar ? [{ id: "bitis" as const, ad: "Son kare olarak", Ik: ArrowLeftToLine }] : []),
  ];
  return createPortal(
    <AnimatePresence>
      {acik && konum && (
        <>
          <div className="fixed inset-0 z-[160]" onClick={kapat} />
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }} transition={{ duration: 0.15 }}
            style={{ position: "fixed", bottom: konum.top, left: konum.left, width: 280 }}
            className="sinema-kapsam hf-pop z-[161] rounded-2xl p-1.5">
            <p className="px-3 pb-1.5 pt-2 text-[13px] text-metin-3">Referanslar</p>
            {ogeler.map(({ id, ad, Ik }) => (
              <button key={id} onClick={() => { onSec(id); kapat(); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[16px] text-metin transition-colors hover:bg-white/[0.07]">
                <Ik className="h-[18px] w-[18px] shrink-0 text-metin-2" /> {ad}
              </button>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
