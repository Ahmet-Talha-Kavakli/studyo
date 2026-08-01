"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Search, Check, ChevronRight, Sparkles, Gem, Clock, Volume2, VolumeX,
  Image as ImageIcon, Video, AudioLines, Plus, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CV, CV_LIME } from "@/lib/canvasTema";
import {
  NODE_META, modelListesi, ORANLAR, VIDEO_ORANLAR,
  GORSEL_COZUNURLUK, VIDEO_COZUNURLUK, KALITELER, SES_ON_AYARLAR,
  type CvModel,
} from "@/lib/canvasVeri";
import type { CanvasNode, NodeAyarlar } from "@/store/useCanvas";

/* ============================================================
   SAĞ INSPECTOR PANELİ — referans birebir.

   KRİTİK MİMARİ: Higgsfield'da ayarlar node kartının İÇİNDE değil.
   Node seçilince sağdan bu panel açılır; tüm model/oran/çözünürlük/
   kalite/batch ayarları ve GENERATE burada.

   Ölçüler: genişlik 280, radius 12, zemin #28292B (bardan bir tık açık)
   GENERATE: tam genişlik, 40px, lime #55D6FD, SİYAH BÜYÜK HARF metin
   ============================================================ */

export function CvInspector({
  node, onKapat, onDegis, onAyar, onUret, uretiliyor,
}: {
  node: CanvasNode;
  onKapat: () => void;
  onDegis: (p: Partial<CanvasNode>) => void;
  onAyar: (p: Partial<NodeAyarlar>) => void;
  onUret: () => void;
  uretiliyor: boolean;
}) {
  const meta = NODE_META[node.tip];
  const [acikMenu, setAcikMenu] = useState<string | null>(null);
  const kapat = () => setAcikMenu(null);

  const Ikon =
    node.tip === "video" ? Video : node.tip === "ses" ? AudioLines
    : node.tip === "llm" ? Sparkles : ImageIcon;

  return (
    <motion.aside
      initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.16 }}
      onMouseDown={(e) => e.stopPropagation()}
      className="absolute z-40 flex flex-col overflow-visible"
      style={{
        top: 120, right: 55, width: 280,
        background: CV.panelSag, borderRadius: 12,
        border: `1px solid ${CV.barKenar}`,
        boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
      }}>

      {/* başlık */}
      <div className="flex items-center gap-2 px-4 pt-3.5">
        <Ikon className="h-[17px] w-[17px] text-white" />
        <span className="flex-1 text-[15px] font-medium text-white">{meta.ad}</span>
        <button onClick={onKapat} aria-label="Kapat"
          className="flex h-6 w-6 items-center justify-center rounded-full text-[#8A8B8D] transition-colors hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* istem alanı */}
      {meta.placeholder && (
        <div className="px-4 pt-3">
          <textarea
            value={node.istem}
            onChange={(e) => onDegis({ istem: e.target.value })}
            placeholder={meta.placeholder}
            className="min-h-[92px] w-full resize-none rounded-[10px] p-3 text-[13px] leading-[1.5] text-white outline-none placeholder:text-[#6C6D6F] [scrollbar-width:thin]"
            style={{ background: CV.cip }}
          />
        </div>
      )}

      {/* LLM sistem istemi */}
      {node.tip === "llm" && (
        <div className="px-4 pt-3">
          <p className="mb-1.5 text-[12px]" style={{ color: CV.metinGri }}>Sistem istemi</p>
          <textarea
            value={node.ayarlar.sistemIstem ?? ""}
            onChange={(e) => onAyar({ sistemIstem: e.target.value })}
            placeholder="İsteğe bağlı sistem yönergeleri"
            className="min-h-[64px] w-full resize-none rounded-[10px] p-3 text-[13px] leading-[1.5] text-white outline-none placeholder:text-[#6C6D6F] [scrollbar-width:thin]"
            style={{ background: CV.cip }}
          />
        </div>
      )}

      {/* ── ayar satırları ── */}
      <div className="flex flex-col px-4 pb-1 pt-2">
        <Satir etiket="Model">
          <CipBtn beyaz acik={acikMenu === "model"} onTikla={() => setAcikMenu(acikMenu === "model" ? null : "model")}>
            {node.model}
          </CipBtn>
          {acikMenu === "model" && (
            <ModelMenu liste={modelListesi(node.tip)} secili={node.model}
              onSec={(m) => { onDegis({ model: m }); kapat(); }} onKapat={kapat} />
          )}
        </Satir>

        {(node.tip === "gorsel" || node.tip === "video") && (
          <Satir etiket="En-boy oranı">
            <CipBtn acik={acikMenu === "oran"} onTikla={() => setAcikMenu(acikMenu === "oran" ? null : "oran")}>
              {node.ayarlar.oran}
            </CipBtn>
            {acikMenu === "oran" && (
              <IzgaraMenu baslik="EN-BOY ORANI"
                secenekler={node.tip === "video" ? VIDEO_ORANLAR : ORANLAR}
                secili={node.ayarlar.oran}
                onSec={(v) => { onAyar({ oran: v }); kapat(); }} onKapat={kapat} />
            )}
          </Satir>
        )}

        {(node.tip === "gorsel" || node.tip === "video") && (
          <Satir etiket="Çözünürlük">
            <CipBtn acik={acikMenu === "coz"} onTikla={() => setAcikMenu(acikMenu === "coz" ? null : "coz")}>
              {node.ayarlar.cozunurluk}
            </CipBtn>
            {acikMenu === "coz" && (
              <ListeMenu baslik="ÇÖZÜNÜRLÜK"
                secenekler={node.tip === "video" ? VIDEO_COZUNURLUK : GORSEL_COZUNURLUK}
                secili={node.ayarlar.cozunurluk}
                onSec={(v) => { onAyar({ cozunurluk: v }); kapat(); }} onKapat={kapat} />
            )}
          </Satir>
        )}

        {node.tip === "gorsel" && (
          <Satir etiket="Kalite">
            <CipBtn ikon={<Gem className="h-3.5 w-3.5" />} acik={acikMenu === "kalite"}
              onTikla={() => setAcikMenu(acikMenu === "kalite" ? null : "kalite")}>
              {node.ayarlar.kalite}
            </CipBtn>
            {acikMenu === "kalite" && (
              <ListeMenu baslik="KALİTE" secenekler={KALITELER} secili={node.ayarlar.kalite}
                onSec={(v) => { onAyar({ kalite: v }); kapat(); }} onKapat={kapat} />
            )}
          </Satir>
        )}

        {node.tip === "video" && (
          <>
            <Satir etiket="Süre (sn)">
              <CipBtn ikon={<Clock className="h-3.5 w-3.5" />} acik={acikMenu === "sure"}
                onTikla={() => setAcikMenu(acikMenu === "sure" ? null : "sure")}>
                {node.ayarlar.sure}
              </CipBtn>
              {acikMenu === "sure" && (
                <ListeMenu baslik="SÜRE" secenekler={["4sn", "6sn", "10sn", "15sn"]} secili={node.ayarlar.sure}
                  onSec={(v) => { onAyar({ sure: v }); kapat(); }} onKapat={kapat} />
              )}
            </Satir>
            <Satir etiket="Ses üret">
              <button onClick={() => onAyar({ sesUret: !node.ayarlar.sesUret })}
                className="flex items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 text-[13px] text-white transition-colors"
                style={{ background: CV.cip }}>
                {node.ayarlar.sesUret ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                {node.ayarlar.sesUret ? "Açık" : "Kapalı"}
              </button>
            </Satir>
          </>
        )}

        {node.tip === "ses" && (
          <Satir etiket="Ses ön ayarı">
            <CipBtn acik={acikMenu === "ses"} onTikla={() => setAcikMenu(acikMenu === "ses" ? null : "ses")}>
              {node.ayarlar.sesOnAyar}
            </CipBtn>
            {acikMenu === "ses" && (
              <ListeMenu baslik="SES" secenekler={SES_ON_AYARLAR.map((s) => s.ad)} secili={node.ayarlar.sesOnAyar}
                onSec={(v) => { onAyar({ sesOnAyar: v }); kapat(); }} onKapat={kapat} />
            )}
          </Satir>
        )}

        {node.tip === "llm" && (
          <Satir etiket="Muhakeme">
            <button onClick={() => onAyar({ muhakeme: !node.ayarlar.muhakeme })}
              className="rounded-[6px] px-2.5 py-1.5 text-[13px] text-white"
              style={{ background: CV.cip }}>
              {node.ayarlar.muhakeme ? "Açık" : "Kapalı"}
            </button>
          </Satir>
        )}

        {(node.tip === "gorsel" || node.tip === "video") && (
          <Satir etiket="Yığın boyutu">
            <div className="flex items-center gap-1 rounded-[6px] px-1 py-1" style={{ background: CV.cip }}>
              <button aria-label="Azalt"
                onClick={() => onAyar({ batch: Math.max(1, (node.ayarlar.batch ?? 1) - 1) })}
                className="flex h-5 w-5 items-center justify-center rounded text-white/70 hover:text-white">
                <Minus className="h-3 w-3" />
              </button>
              <span className="min-w-[26px] text-center text-[13px] text-white">{node.ayarlar.batch ?? 1}/4</span>
              <button aria-label="Artır"
                onClick={() => onAyar({ batch: Math.min(4, (node.ayarlar.batch ?? 1) + 1) })}
                className="flex h-5 w-5 items-center justify-center rounded text-white/70 hover:text-white">
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </Satir>
        )}
      </div>

      {/* ── GENERATE ── */}
      <div className="px-4 pb-4 pt-2">
        <button
          onClick={onUret}
          disabled={uretiliyor}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-[8px] text-[14px] font-bold uppercase tracking-[0.03em] transition-transform disabled:cursor-not-allowed"
          style={{
            background: uretiliyor ? CV.limeSonuk : CV_LIME,
            color: uretiliyor ? "rgba(15,17,19,0.55)" : "#0F1113",
          }}>
          {uretiliyor ? "Üretiliyor…" : "ÜRET"}
          {!uretiliyor && meta.kredi != null && (
            <span className="flex items-center gap-1 text-[13px]">
              <Sparkles className="h-3.5 w-3.5" /> {meta.kredi}
            </span>
          )}
        </button>
      </div>
    </motion.aside>
  );
}

/* ── satır kabuğu ── */
function Satir({ etiket, children }: { etiket: string; children: React.ReactNode }) {
  return (
    <div className="relative flex h-11 items-center justify-between gap-2">
      <span className="text-[13px]" style={{ color: CV.metinGri }}>{etiket}</span>
      <div className="relative flex items-center">{children}</div>
    </div>
  );
}

/* ── çip butonu ── */
function CipBtn({ children, ikon, beyaz, acik, onTikla }: {
  children: React.ReactNode; ikon?: React.ReactNode;
  beyaz?: boolean; acik?: boolean; onTikla: () => void;
}) {
  return (
    <button onClick={onTikla}
      className={cn(
        "flex items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 text-[13px] font-medium transition-colors",
        beyaz ? "text-[#0F1113]" : "text-white",
      )}
      style={{ background: beyaz ? "#FFFFFF" : acik ? CV.cipUst : CV.cip }}>
      {ikon}{children}
    </button>
  );
}

/* ── düz liste menüsü (çözünürlük/kalite/süre/ses) ── */
function ListeMenu({ baslik, secenekler, secili, onSec, onKapat }: {
  baslik: string; secenekler: string[]; secili?: string;
  onSec: (v: string) => void; onKapat: () => void;
}) {
  return (
    <Kabuk onKapat={onKapat} genislik={168}>
      <p className="px-3 pb-1.5 pt-2 text-[11px] font-semibold tracking-[0.06em]" style={{ color: CV.metinGri }}>
        {baslik}
      </p>
      <div className="max-h-[260px] overflow-y-auto pb-1.5 [scrollbar-width:thin]">
        {secenekler.map((s) => (
          <button key={s} onClick={() => onSec(s)}
            className="flex h-8 w-full items-center justify-between px-3 text-[13px] text-white transition-colors hover:bg-white/[0.06]"
            style={{ background: secili === s ? CV.panelSecili : undefined }}>
            {s}
            {secili === s && <Check className="h-3.5 w-3.5" style={{ color: CV_LIME }} />}
          </button>
        ))}
      </div>
    </Kabuk>
  );
}

/* ── 2 sütun oran ızgarası ── */
function IzgaraMenu({ baslik, secenekler, secili, onSec, onKapat }: {
  baslik: string; secenekler: string[]; secili?: string;
  onSec: (v: string) => void; onKapat: () => void;
}) {
  return (
    <Kabuk onKapat={onKapat} genislik={188}>
      <p className="px-3 pb-1.5 pt-2 text-[11px] font-semibold tracking-[0.06em]" style={{ color: CV.metinGri }}>
        {baslik}
      </p>
      <div className="grid grid-cols-2 gap-1 p-1.5 pt-0">
        {secenekler.map((s) => {
          const [a, b] = s.split(":").map(Number);
          const w = 15, h = Math.max(6, Math.round((15 * b) / a));
          return (
            <button key={s} onClick={() => onSec(s)}
              className="flex h-8 items-center gap-2 rounded-[6px] px-2 text-[13px] text-white transition-colors hover:bg-white/[0.06]"
              style={{ background: secili === s ? CV.panelSecili : undefined }}>
              <span className="shrink-0 rounded-[2px] border"
                style={{ width: w, height: Math.min(h, 16), borderColor: "#8A8B8D" }} />
              {s}
            </button>
          );
        })}
      </div>
    </Kabuk>
  );
}

/* ── model seçici (aramalı, öne çıkanlar + açıklama + rozet) ── */
function ModelMenu({ liste, secili, onSec, onKapat }: {
  liste: CvModel[]; secili?: string; onSec: (m: string) => void; onKapat: () => void;
}) {
  const [ara, setAra] = useState("");
  const q = ara.trim().toLocaleLowerCase("tr");
  const suzulu = q ? liste.filter((m) => m.ad.toLocaleLowerCase("tr").includes(q)) : liste;

  return (
    <Kabuk onKapat={onKapat} genislik={330}>
      <div className="p-2 pb-1">
        <label className="flex h-9 items-center gap-2 rounded-[8px] px-2.5" style={{ background: CV.cip }}>
          <Search className="h-3.5 w-3.5 shrink-0" style={{ color: CV.metinGri }} />
          <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ara..."
            className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-[#7A7B7D]" />
        </label>
      </div>
      <p className="flex items-center gap-1.5 px-3 pb-1 pt-1.5 text-[12px]" style={{ color: CV.metinGri }}>
        <Sparkles className="h-3 w-3" /> Öne çıkan modeller
      </p>
      <div className="max-h-[320px] overflow-y-auto pb-2 [scrollbar-width:thin]">
        {suzulu.map((m) => (
          <button key={m.ad} onClick={() => onSec(m.ad)}
            className="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-white/[0.06]"
            style={{ background: secili === m.ad ? "rgba(255,255,255,0.04)" : undefined }}>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-[14px] font-medium text-white">{m.ad}</span>
                {m.rozet && (
                  <span className="shrink-0 rounded-[3px] px-1 py-[1px] text-[9px] font-bold italic uppercase"
                    style={{ background: CV_LIME, color: "#0F1113" }}>
                    {m.rozet}
                  </span>
                )}
                {m.sesli && <Volume2 className="h-3 w-3 shrink-0" style={{ color: CV.metinGri }} />}
              </span>
              {m.ozet && <span className="mt-0.5 block text-[12px] leading-[1.35]" style={{ color: CV.metinGri }}>{m.ozet}</span>}
              {(m.cozunurluk || m.sure) && (
                <span className="mt-1 flex gap-1">
                  {m.cozunurluk && <Meta>{m.cozunurluk}</Meta>}
                  {m.sure && <Meta>{m.sure}</Meta>}
                </span>
              )}
            </span>
            {secili === m.ad && <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: CV_LIME }} />}
          </button>
        ))}
        {suzulu.length === 0 && (
          <p className="px-3 py-6 text-center text-[13px]" style={{ color: CV.metinGri }}>Sonuç yok</p>
        )}
      </div>
      <div className="flex items-center justify-between px-3 py-2 text-[12px]"
        style={{ borderTop: `1px solid ${CV.panelAyrac}`, color: CV.metinGri }}>
        <span className="flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> Tüm modeller</span>
        <ChevronRight className="h-3.5 w-3.5" />
      </div>
    </Kabuk>
  );
}

function Meta({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-[4px] px-1.5 py-[2px] text-[10px]"
      style={{ background: CV.cip, color: CV.metinGri }}>
      {children}
    </span>
  );
}

/* ── açılır menü kabuğu — panelin SOLUNA taşar (referans davranışı) ── */
function Kabuk({ children, genislik, onKapat }: {
  children: React.ReactNode; genislik: number; onKapat: () => void;
}) {
  return (
    <>
      {/* dışına tıkla → kapat */}
      <span className="fixed inset-0 z-[-1]" onClick={onKapat} />
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12 }}
          className="absolute right-0 top-full z-50 mt-1.5 overflow-hidden rounded-[10px]"
          style={{
            width: genislik, background: CV.panelAlt,
            border: `1px solid ${CV.barKenar}`,
            boxShadow: "0 16px 44px rgba(0,0,0,0.6)",
          }}>
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
