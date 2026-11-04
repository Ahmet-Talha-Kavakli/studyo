"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, Lock, Trash2, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Highlighter,
} from "lucide-react";
import { CV } from "@/lib/canvasTema";
import { FONTLAR, PUNTOLAR, HIZALAR, METIN_RENKLER, type Hiza } from "@/lib/canvasVeri";
import { STICKY_PALET } from "@/lib/canvasTema";
import type { CanvasNode } from "@/store/useCanvas";

/* ============================================================
   METİN / STICKY BİÇİMLENDİRME ÇUBUĞU — referans birebir.

   Node'un ÜSTÜNDE yüzen kapsül (48px, radius 24, #232527).

   METİN çubuğu:
     [● renk ⌄] │ [Aa ⌄] [Punto ⌄] [☰ ⌄] │ B I U S │ ≔ ≕ │ 🔒 🗑
   STICKY çubuğu (FARKLI):
     [🟨 dolgu ⌄] [● metin ⌄] │ [Aa ⌄] [Punto ⌄] [☰ ⌄] │ ✍ │ 🔒 🗑
     (sticky'de B/I/U/S ve listeler YOK, dolgu rengi VAR)
   ============================================================ */

type Menu = "dolgu" | "renk" | "font" | "punto" | "hiza" | null;

export function CvBicimCubugu({
  node, ekranX, ekranY, onDegis, onKilit, onSil,
}: {
  node: CanvasNode;
  /** Node'un ekran koordinatları (çubuk bunun üstüne konumlanır). */
  ekranX: number;
  ekranY: number;
  onDegis: (p: Partial<CanvasNode>) => void;
  onKilit: () => void;
  onSil: () => void;
}) {
  const [menu, setMenu] = useState<Menu>(null);
  const kapRef = useRef<HTMLDivElement>(null);
  const sticky = node.tip === "sticky";

  /* dışına tıkla → menüyü kapat */
  useEffect(() => {
    if (!menu) return;
    const kapat = (e: MouseEvent) => {
      if (!kapRef.current?.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener("mousedown", kapat);
    return () => document.removeEventListener("mousedown", kapat);
  }, [menu]);

  const puntoAd = PUNTOLAR.find((p) => p.px === node.punto)?.ad ?? "Küçük";

  return (
    <div
      ref={kapRef}
      data-ui
      className="absolute z-50 -translate-x-1/2"
      style={{ left: ekranX, top: Math.max(58, ekranY - 60) }}
      onMouseDown={(e) => e.stopPropagation()}>

      <div className="flex items-center gap-0.5 px-2"
        style={{
          height: 44, background: "#232527",
          border: `1px solid ${CV.barKenar}`, borderRadius: 22,
          boxShadow: "none",
        }}>

        {/* sticky: DOLGU rengi */}
        {sticky && (
          <Tetik acik={menu === "dolgu"} onTikla={() => setMenu(menu === "dolgu" ? null : "dolgu")}
            etiket="Not rengi">
            <span className="h-[18px] w-[18px] rounded-[4px]"
              style={{ background: node.renk ?? "#FAE196" }} />
            <ChevronDown className="h-3 w-3 opacity-70" />
          </Tetik>
        )}

        {/* METİN rengi */}
        <Tetik acik={menu === "renk"} onTikla={() => setMenu(menu === "renk" ? null : "renk")}
          etiket="Metin rengi">
          <span className="h-[18px] w-[18px] rounded-full"
            style={{
              background: sticky ? "#1A1A18" : (node.renk ?? "#FFFFFF"),
              boxShadow: "0 0 0 1px rgba(255,255,255,0.25)",
            }} />
          <ChevronDown className="h-3 w-3 opacity-70" />
        </Tetik>

        <Ayrac />

        {/* FONT */}
        <Tetik acik={menu === "font"} onTikla={() => setMenu(menu === "font" ? null : "font")}
          etiket="Yazı tipi">
          <span className="text-[14px] font-medium text-white">Aa</span>
          <ChevronDown className="h-3 w-3 opacity-70" />
        </Tetik>

        {/* PUNTO */}
        <Tetik acik={menu === "punto"} onTikla={() => setMenu(menu === "punto" ? null : "punto")}
          etiket="Punto">
          <span className="max-w-[54px] truncate text-[13px] text-white">{puntoAd}</span>
          <ChevronDown className="h-3 w-3 opacity-70" />
        </Tetik>

        {/* HİZA */}
        <Tetik acik={menu === "hiza"} onTikla={() => setMenu(menu === "hiza" ? null : "hiza")}
          etiket="Hizalama">
          {(() => {
            const Ik = HIZA_IKON[node.hiza ?? "sol"];
            return <Ik className="h-4 w-4 text-white" />;
          })()}
          <ChevronDown className="h-3 w-3 opacity-70" />
        </Tetik>

        <Ayrac />

        {/* METİN: B I U S + listeler · STICKY: vurgu kalemi */}
        {sticky ? (
          <IkonBtn ikon={Highlighter} etiket="Vurgu"
            aktif={!!node.kalin} onTikla={() => onDegis({ kalin: !node.kalin })} />
        ) : (
          <>
            <IkonBtn ikon={Bold} etiket="Kalın" aktif={!!node.kalin}
              onTikla={() => onDegis({ kalin: !node.kalin })} />
            <IkonBtn ikon={Italic} etiket="İtalik" aktif={!!node.italik}
              onTikla={() => onDegis({ italik: !node.italik })} />
            <IkonBtn ikon={Underline} etiket="Altı çizili" aktif={!!node.alti}
              onTikla={() => onDegis({ alti: !node.alti })} />
            <IkonBtn ikon={Strikethrough} etiket="Üstü çizili" aktif={!!node.ustu}
              onTikla={() => onDegis({ ustu: !node.ustu })} />
            <IkonBtn ikon={List} etiket="Madde listesi" aktif={node.liste === "madde"}
              onTikla={() => onDegis({ liste: node.liste === "madde" ? null : "madde" })} />
            <IkonBtn ikon={ListOrdered} etiket="Numaralı liste" aktif={node.liste === "numara"}
              onTikla={() => onDegis({ liste: node.liste === "numara" ? null : "numara" })} />
          </>
        )}

        <Ayrac />

        {/* kilit + sil — referansta ikisi de NÖTR GRİ (sil kırmızı değil) */}
        <IkonBtn ikon={Lock} etiket="Kilitle" aktif={!!node.kilit} onTikla={onKilit} sonuk />
        <IkonBtn ikon={Trash2} etiket="Sil" aktif={false} onTikla={onSil} sonuk />
      </div>

      {/* ══ AÇILIR MENÜLER — çubuğun ÜSTÜNDE ══ */}
      <AnimatePresence>
        {menu === "dolgu" && (
          <RenkMenu key="dolgu" renkler={STICKY_PALET} secili={node.renk}
            onSec={(r) => { onDegis({ renk: r }); setMenu(null); }} />
        )}
        {menu === "renk" && (
          <RenkMenu key="renk" renkler={METIN_RENKLER} secili={node.renk}
            onSec={(r) => { onDegis({ renk: r }); setMenu(null); }} />
        )}

        {menu === "font" && (
          <Kabuk key="font" genislik={150}>
            {FONTLAR.map((f) => (
              <Satir key={f.ad} secili={(node.font ?? "Varsayılan") === f.ad}
                onTikla={() => { onDegis({ font: f.ad }); setMenu(null); }}>
                {/* her satır KENDİ fontuyla — canlı önizleme */}
                <span style={{ fontFamily: f.css }}>{f.ad}</span>
              </Satir>
            ))}
          </Kabuk>
        )}

        {menu === "punto" && (
          <Kabuk key="punto" genislik={158}>
            {/* serbest sayı girişi */}
            <div className="p-1.5 pb-1">
              <input
                type="number" min={8} max={96}
                value={node.punto ?? 14}
                onChange={(e) => onDegis({ punto: Math.max(8, Math.min(96, Number(e.target.value) || 14)) })}
                className="h-9 w-full rounded-[6px] px-2.5 text-[14px] text-white outline-none"
                style={{ background: "#26282B" }}
              />
            </div>
            <div className="h-px" style={{ background: "#2E3033" }} />
            {PUNTOLAR.map((p) => (
              <Satir key={p.ad} secili={node.punto === p.px}
                onTikla={() => { onDegis({ punto: p.px }); setMenu(null); }}>
                <span className="flex-1">{p.ad}</span>
                <span style={{ color: "#8A8B8D" }}>{p.px}</span>
              </Satir>
            ))}
          </Kabuk>
        )}

        {menu === "hiza" && (
          <Kabuk key="hiza" genislik={150}>
            {HIZALAR.map((h) => {
              const Ik = HIZA_IKON[h.deger];
              return (
                <Satir key={h.deger} secili={(node.hiza ?? "sol") === h.deger}
                  onTikla={() => { onDegis({ hiza: h.deger }); setMenu(null); }}>
                  <Ik className="h-4 w-4 shrink-0" style={{ color: "#C8C9CA" }} />
                  <span>{h.ad}</span>
                </Satir>
              );
            })}
          </Kabuk>
        )}
      </AnimatePresence>
    </div>
  );
}

const HIZA_IKON: Record<Hiza, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  sol: AlignLeft, orta: AlignCenter, sag: AlignRight, yasla: AlignJustify,
};

function Ayrac() {
  return <span className="mx-1 h-[18px] w-px shrink-0" style={{ background: "#3A3B3E" }} />;
}

function Tetik({ acik, onTikla, etiket, children }: {
  acik: boolean; onTikla: () => void; etiket: string; children: React.ReactNode;
}) {
  return (
    <button onClick={onTikla} aria-label={etiket} title={etiket}
      className="flex h-8 items-center gap-1.5 rounded-[8px] px-2 transition-colors hover:bg-white/[0.08]"
      style={{ background: acik ? "#2C2D31" : "transparent" }}>
      {children}
    </button>
  );
}

function IkonBtn({ ikon: Ik, etiket, aktif, onTikla, sonuk }: {
  ikon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  etiket: string; aktif: boolean; onTikla: () => void; sonuk?: boolean;
}) {
  return (
    <button onClick={onTikla} aria-label={etiket} title={etiket}
      className="flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors hover:bg-white/[0.08]"
      style={{ background: aktif ? "#3A3C3E" : "transparent" }}>
      <Ik className="h-4 w-4" style={{ color: sonuk ? CV.ikonSonuk : "#FFFFFF" }} />
    </button>
  );
}

/** Açılır menü kabuğu — çubuğun ÜSTÜNDE açılır (referans davranışı). */
function Kabuk({ genislik, children }: { genislik: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.12 }}
      className="absolute bottom-[52px] left-1/2 -translate-x-1/2 overflow-hidden rounded-[10px] py-1"
      style={{
        width: genislik, background: CV.panelAlt,
        border: `1px solid ${CV.barKenar}`,
        boxShadow: "none",
      }}>
      {children}
    </motion.div>
  );
}

function Satir({ secili, onTikla, children }: {
  secili: boolean; onTikla: () => void; children: React.ReactNode;
}) {
  return (
    <button onClick={onTikla}
      className="flex h-9 w-full items-center gap-2 px-2.5 text-left text-[14px] text-white transition-colors hover:bg-white/[0.06]"
      style={{ background: secili ? CV.panelSecili : undefined }}>
      {children}
    </button>
  );
}

/** Renk ızgarası menüsü (dolgu / metin rengi). */
function RenkMenu({ renkler, secili, onSec }: {
  renkler: readonly string[]; secili?: string; onSec: (r: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.12 }}
      className="absolute bottom-[52px] left-1/2 grid -translate-x-1/2 grid-cols-5 gap-1.5 rounded-[12px] p-2"
      style={{
        background: CV.panelAlt, border: `1px solid ${CV.barKenar}`,
        boxShadow: "none",
      }}>
      {renkler.map((r) => (
        <button key={r} onClick={() => onSec(r)} aria-label={`Renk ${r}`}
          className="h-6 w-6 rounded-full transition-transform hover:scale-110"
          style={{
            background: r,
            boxShadow: secili === r
              ? `0 0 0 2px ${CV.panelAlt}, 0 0 0 4px #FFFFFF`
              : "0 0 0 1px rgba(255,255,255,0.18)",
          }} />
      ))}
    </motion.div>
  );
}
