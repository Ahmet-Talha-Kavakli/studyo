"use client";

/**
 * YonetmenPaneli — Higgsfield "Director Panel" BİREBİR.
 *
 * Referans (kullanıcı ekran görüntüsü):
 *   🎬 Director Panel ....................................... ⌄
 *   [👤+][ ][ ] │ [foto] Movement/Auto ▲▼ │ ~mavi eğri~ │ Speed ramp/Custom ▲▼ │ Duration/12s
 *
 * Üç bölüm yatay, aralarında ince dikey ayraç:
 *  1) 3 karakter yuvası — ilki "kişi ekle" ikonlu, dolduruca foto gösterir
 *  2) Hareket seçici — küçük kare önizleme + etiket/değer + ▲▼ stepper
 *  3) Hız rampası — mavi eğri grafiği (Custom'da noktalar SÜRÜKLENEBİLİR) + ▲▼
 *  4) Süre — salt okunur değer
 *
 * Kapanma animasyonu `height:auto` yerine scaleY/opacity ile yapılır; height
 * animasyonu her karede layout hesaplattığı için kapanışta takılma yaratıyordu.
 */

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clapperboard, ChevronDown, ChevronUp, UserPlus, Plus } from "lucide-react";
import { cn, onizlemeArka } from "@/lib/utils";
import { kabukArka } from "@/lib/gercekVeri";
import { HIZ_RAMPALARI, KAMERA_HAREKETLERI } from "@/lib/sinemaSecici";

/* ------------------------------------------------------------------ */
/* Hız rampası eğrisi — Custom modunda noktalar sürüklenebilir         */
/* ------------------------------------------------------------------ */
function HizEgrisi({
  egri, duzenlenebilir, onDegis,
}: {
  egri: number[]; duzenlenebilir: boolean; onDegis: (yeni: number[]) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tutulan, setTutulan] = useState<number | null>(null);
  const G = 232, Y = 62, PAY = 10;   // grafik ölçüleri

  const x = (i: number) => PAY + (i / (egri.length - 1)) * (G - PAY * 2);
  const y = (v: number) => PAY + (1 - v) * (Y - PAY * 2);

  /** Noktayı dikeyde sürükle (0..1 aralığında kırp). */
  const tut = (i: number) => (e: React.PointerEvent) => {
    if (!duzenlenebilir) return;
    e.preventDefault(); e.stopPropagation();
    setTutulan(i);
    const kutu = svgRef.current?.getBoundingClientRect();
    if (!kutu) return;
    const tasi = (ev: PointerEvent) => {
      const oran = 1 - (ev.clientY - kutu.top - PAY) / (Y - PAY * 2);
      const yeni = [...egri];
      yeni[i] = Math.max(0, Math.min(1, oran));
      onDegis(yeni);
    };
    const birak = () => {
      setTutulan(null);
      window.removeEventListener("pointermove", tasi);
      window.removeEventListener("pointerup", birak);
    };
    window.addEventListener("pointermove", tasi);
    window.addEventListener("pointerup", birak);
  };

  const cizgi = egri.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");
  const dolgu = `${cizgi} L ${x(egri.length - 1)} ${Y - PAY} L ${x(0)} ${Y - PAY} Z`;

  return (
    <svg ref={svgRef} width={G} height={Y} className={cn("shrink-0", duzenlenebilir && "cursor-ns-resize")}>
      {/* orta eksen */}
      <line x1={PAY} y1={Y / 2} x2={G - PAY} y2={Y / 2} stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
      {/* dolgu + çizgi */}
      <path d={dolgu} fill="rgba(59,154,225,0.14)" />
      <path d={cizgi} fill="none" stroke="#3b9ae1" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      {/* düğümler */}
      {egri.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={tutulan === i ? 6.5 : 5}
          fill="#3b9ae1" stroke="#0f1113" strokeWidth="1.5"
          onPointerDown={tut(i)}
          className={cn(duzenlenebilir && "cursor-grab active:cursor-grabbing")}
          style={{ pointerEvents: duzenlenebilir ? "auto" : "none" }} />
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Stepper alanı — küçük önizleme + etiket/değer + ▲▼                  */
/* ------------------------------------------------------------------ */
function StepperAlan({
  onizleme, etiket, deger, onOnceki, onSonraki, onTikla,
}: {
  onizleme?: string; etiket: string; deger: string;
  onOnceki: () => void; onSonraki: () => void; onTikla?: () => void;
}) {
  return (
    <div className="flex h-[58px] shrink-0 items-center gap-2.5 rounded-xl bg-white/[0.05] px-2">
      {onizleme && (
        <button onClick={onTikla} className="h-11 w-11 shrink-0 overflow-hidden rounded-lg"
          style={{ background: onizleme }} aria-label={etiket} />
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] leading-tight text-metin-3">{etiket}</span>
        <span className="block truncate text-[17px] font-medium leading-tight text-metin">{deger}</span>
      </span>
      <span className="flex shrink-0 flex-col">
        <button onClick={onOnceki} aria-label="Önceki" className="text-metin-3 transition-colors hover:text-metin"><ChevronUp className="h-4 w-4" /></button>
        <button onClick={onSonraki} aria-label="Sonraki" className="text-metin-3 transition-colors hover:text-metin"><ChevronDown className="h-4 w-4" /></button>
      </span>
    </div>
  );
}

/* ================================================================== */

export type YonetmenDurum = {
  karakterler: (string | null)[];   // 3 yuva
  hareket: string;
  hizRampa: string;
  hizEgri: number[];
  sure: number;
};

export function YonetmenPaneli({
  acik, onAcik, durum, onDurum, onKarakterEkle,
}: {
  acik: boolean; onAcik: (v: boolean) => void;
  durum: YonetmenDurum; onDurum: (y: Partial<YonetmenDurum>) => void;
  onKarakterEkle: (yuva: number) => void;
}) {
  const hareketIdx = Math.max(0, KAMERA_HAREKETLERI.indexOf(durum.hareket));
  const rampaIdx = Math.max(0, HIZ_RAMPALARI.findIndex((h) => h.ad === durum.hizRampa));
  const ozelRampa = durum.hizRampa === "Özel";
  // "Özel" seçeneği listede yok → sona ekliyoruz (Higgsfield "Custom").
  const rampaListe = [...HIZ_RAMPALARI.map((h) => h.ad), "Özel"];

  const rampaDegis = (yon: 1 | -1) => {
    const i = Math.max(0, rampaListe.indexOf(durum.hizRampa));
    const yeni = rampaListe[(i + yon + rampaListe.length) % rampaListe.length];
    const bulunan = HIZ_RAMPALARI.find((h) => h.ad === yeni);
    onDurum({ hizRampa: yeni, hizEgri: bulunan ? [...bulunan.egri] : durum.hizEgri });
  };

  return (
    <div className="overflow-hidden rounded-[18px] border border-white/[0.07] bg-[rgba(26,27,29,0.9)] backdrop-blur-xl">
      {/* Başlık — 🎬 Yönetmen Paneli ......... ⌄ */}
      <button onClick={() => onAcik(!acik)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left">
        <Clapperboard className="h-[18px] w-[18px] shrink-0 text-metin-2" />
        <span className="flex-1 text-[16px] font-medium text-metin">Yönetmen Paneli</span>
        <motion.span animate={{ rotate: acik ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-[18px] w-[18px] text-metin-3" />
        </motion.span>
      </button>

      {/* Gövde — kapanışta TAKILMASIN diye height değil, transform animasyonu.
          height:auto her karede reflow tetikliyordu (kasma şikâyeti). */}
      <AnimatePresence initial={false}>
        {acik && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{ willChange: "transform, opacity" }}
            className="flex items-center gap-3 overflow-x-auto border-t border-white/[0.06] px-4 py-3">
            {/* 1) Karakter yuvaları */}
            <div className="flex shrink-0 gap-2">
              {durum.karakterler.map((k, i) => (
                <button key={i} onClick={() => onKarakterEkle(i)}
                  className="flex h-[58px] w-[58px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/[0.05] text-metin-3 transition-colors hover:bg-white/[0.09] hover:text-metin"
                  style={k ? { background: `url("${k}") center/cover` } : undefined}
                  aria-label={`Karakter ${i + 1}`}>
                  {!k && (i === 0 ? <UserPlus className="h-5 w-5" /> : <Plus className="h-4 w-4 opacity-0 transition-opacity hover:opacity-100" />)}
                </button>
              ))}
            </div>

            <span className="h-10 w-px shrink-0 bg-white/[0.09]" />

            {/* 2) Hareket */}
            <StepperAlan
              onizleme={kabukArka(`hareket-${durum.hareket}`, "sinematik")}
              etiket="Hareket" deger={durum.hareket}
              onOnceki={() => onDurum({ hareket: KAMERA_HAREKETLERI[(hareketIdx - 1 + KAMERA_HAREKETLERI.length) % KAMERA_HAREKETLERI.length] })}
              onSonraki={() => onDurum({ hareket: KAMERA_HAREKETLERI[(hareketIdx + 1) % KAMERA_HAREKETLERI.length] })} />

            <span className="h-10 w-px shrink-0 bg-white/[0.09]" />

            {/* 3) Hız eğrisi — Özel modda noktalar sürüklenebilir */}
            <div className={cn("shrink-0 rounded-xl bg-white/[0.05] px-1 py-0.5", ozelRampa && "ring-1 ring-[#3b9ae1]/40")}
              title={ozelRampa ? "Noktaları yukarı/aşağı sürükle" : "Özel moda geçince noktalar sürüklenebilir"}>
              <HizEgrisi egri={durum.hizEgri} duzenlenebilir={ozelRampa}
                onDegis={(yeni) => onDurum({ hizEgri: yeni })} />
            </div>

            {/* Hız rampası seçici */}
            <StepperAlan etiket="Hız rampası" deger={durum.hizRampa}
              onOnceki={() => rampaDegis(-1)} onSonraki={() => rampaDegis(1)} />

            <span className="h-10 w-px shrink-0 bg-white/[0.09]" />

            {/* 4) Süre */}
            <div className="flex h-[58px] shrink-0 flex-col justify-center rounded-xl bg-white/[0.05] px-3.5">
              <span className="text-[12px] leading-tight text-metin-3">Süre</span>
              <span className="text-[17px] font-medium leading-tight text-metin">{durum.sure}sn</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
