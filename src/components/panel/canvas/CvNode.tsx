"use client";

import { memo, useEffect, useRef, useState } from "react";
import {
  Type, Image as ImageIcon, Video, AudioLines, FileText, Sparkles, Lock, ArrowUp, Plus,
} from "lucide-react";
import { saltUrl, cn } from "@/lib/utils";
import { CV, CV_LIME, CV_OLCU } from "@/lib/canvasTema";
import { NODE_META, OK_STILLERI, SEKIL_PATH, FONTLAR, type HandleTip } from "@/lib/canvasVeri";
import type { CanvasNode } from "@/store/useCanvas";

/* ============================================================
   NODE KARTI — referans birebir.

   Anatomi (referanstan):
     · Etiket kartın DIŞINDA, üstünde (#8A8C8E, 11px, 600)
     · Gövde: üretici #141618, diğerleri #1C1E20, radius 12
     · Seçilmemişken kenarlık YOK
     · Seçili: 1px #3F84ED + 4 köşede 7×7 BEYAZ KARE tutamaç
     · Handle: kartın 34px dışında, 30px daire, içinde tip ikonu
     · Alt bar (üretici): "Model | Oran" #77797B
     · Ayarlar kartta DEĞİL — sağ inspector panelinde
   ============================================================ */

const HANDLE_IKON: Record<HandleTip, React.ComponentType<{ className?: string }>> = {
  metin: Type,
  gorsel: ImageIcon,
  video: Video,
  ses: AudioLines,
  dokuman: FileText,
};

export const CvNode = memo(function CvNode({
  node, secili, coklu, duzenleniyor, baglaniyorTip,
  onBasla, onSecim, onHandleBasla, onHandleUstu, onIstemDegis, onDuzenleBitir, onCiftTikla,
  onStickyKopyala,
}: {
  node: CanvasNode;
  secili: boolean;
  coklu: boolean;
  duzenleniyor: boolean;
  /** Bağlantı çiziliyorsa taşınan tip — uyumlu girişler parlar. */
  baglaniyorTip: HandleTip | null;
  onBasla: (e: React.MouseEvent) => void;
  onSecim: (e: React.MouseEvent) => void;
  onHandleBasla: (e: React.MouseEvent, tip: HandleTip) => void;
  onHandleUstu: (girisMi: boolean) => void;
  onIstemDegis: (v: string) => void;
  onDuzenleBitir: () => void;
  onCiftTikla: () => void;
  /** Sticky kenar "+" tutamağı — o yöne aynı renk/metinle kopya oluşturur. */
  onStickyKopyala?: (yon: "ust" | "sag" | "alt" | "sol") => void;
}) {
  const meta = NODE_META[node.tip];
  const uretici = meta.uretici;
  const gorselUrl = saltUrl(node.ciktiUrl);

  /* ── yardımcı node'lar: sticky / metin / şekil / yorum / tepki ── */
  if (node.tip === "sticky") return <Sticky {...{ node, secili, duzenleniyor, onBasla, onSecim, onIstemDegis, onDuzenleBitir, onCiftTikla }} onKopyala={onStickyKopyala} />;
  if (node.tip === "metin") return <Metin {...{ node, secili, duzenleniyor, onBasla, onSecim, onIstemDegis, onDuzenleBitir, onCiftTikla }} />;
  if (node.tip === "sekil") return <Sekil {...{ node, secili, onBasla, onSecim }} />;
  if (node.tip === "tepki") return <Tepki {...{ node, secili, onBasla, onSecim }} />;
  if (node.tip === "cizim") return <Cizim {...{ node, secili, onBasla, onSecim }} />;
  if (node.tip === "ok") return <Ok {...{ node, secili, onBasla, onSecim }} />;
  if (node.tip === "yorum") return <Yorum {...{ node, secili, duzenleniyor, onBasla, onSecim, onIstemDegis, onDuzenleBitir, onCiftTikla }} />;

  return (
    <div
      data-node={node.id}
      className="absolute select-none"
      style={{ left: node.x, top: node.y, width: node.g }}
      onMouseDown={onBasla}
      onClick={onSecim}
      onDoubleClick={onCiftTikla}>

      {/* etiket — kartın DIŞINDA, üstünde */}
      <div className="mb-[9px] flex items-center gap-1.5 pl-[5px]">
        <span className="text-[10px] font-bold tracking-[0.01em]" style={{ color: CV.nodeEtiket }}>
          {meta.ad}
        </span>
        {node.kilit && <Lock className="h-3 w-3" style={{ color: CV.nodeEtiket }} />}
      </div>

      <div className="relative" style={{ height: node.y2 }}>
        {/* ── SOL giriş handle'ları — 24px daire, kart ortasına GRUPLANIR ──
            (Eskiden üstten sabit 14px'ti; referansta girişler dikeyde
            kartın merkezine göre hizalı.) */}
        {meta.girisler.map((tip, i) => {
          const uyumlu = baglaniyorTip === tip;
          const Ik = HANDLE_IKON[tip];
          const n = meta.girisler.length;
          const adim = CV_OLCU.handleGirisAdim;
          const ust = node.y2 / 2 - (n * adim) / 2 + i * adim + (adim - CV_OLCU.handleGiris) / 2;
          return (
            <button
              key={tip}
              data-handle="giris"
              onMouseEnter={() => onHandleUstu(true)}
              onMouseLeave={() => onHandleUstu(false)}
              className="absolute z-10 flex items-center justify-center rounded-full transition-all"
              style={{
                left: -CV_OLCU.handleGirisOfset,
                top: ust,
                width: CV_OLCU.handleGiris, height: CV_OLCU.handleGiris,
                background: uyumlu ? CV.handleAktif : CV.handle,
                border: `1px solid ${uyumlu ? CV.secim : CV.handleKenar}`,
                boxShadow: uyumlu ? `0 0 0 3px ${CV.secim}33` : undefined,
                color: "#D6D6D6",
              }}
              aria-label={`${tip} girişi`}>
              <Ik className="h-[12px] w-[12px]" />
            </button>
          );
        })}

        {/* ── SAĞ çıkış handle'ı — 31×23 OVAL, karta bitişik ── */}
        {meta.cikis && (
          <button
            data-handle="cikis"
            onMouseDown={(e) => { e.stopPropagation(); onHandleBasla(e, meta.cikis!); }}
            className="absolute z-10 flex items-center justify-center transition-colors hover:brightness-125"
            style={{
              right: -CV_OLCU.handleCikisG,
              top: node.y2 / 2 - CV_OLCU.handleCikisY / 2,
              width: CV_OLCU.handleCikisG, height: CV_OLCU.handleCikisY,
              borderRadius: 999,
              background: CV.handle, border: `1px solid ${CV.handleKenar}`,
              cursor: "crosshair", color: "#D6D6D6",
            }}
            aria-label={`${meta.cikis} çıkışı`}>
            {(() => { const Ik = HANDLE_IKON[meta.cikis]; return <Ik className="h-[12px] w-[12px]" />; })()}
          </button>
        )}

        {/* ── GÖVDE ──
            Zemin: SADECE görsel/video üretici koyu (#141618). Ses ve LLM de
            `uretici:true` ama referansta açık gövde (#1C1E20) kullanıyorlar.
            Kenarlık: seçilmemişken de 1px — kart tuvalden AYRIŞIR (bu olmadan
            kartlar "yüzüyor" gibi duruyordu). */}
        <div
          className="relative h-full w-full overflow-hidden"
          style={{
            background: node.tip === "gorsel" || node.tip === "video" ? CV.nodeUretici : CV.node,
            borderRadius: CV_OLCU.nodeRadius,
            border: `1px solid ${secili ? CV.secim : CV.nodeKenar}`,
          }}>

          {/* çıktı görseli
              draggable={false} + pointer-events-none ZORUNLU: aksi halde tarayıcının
              yerleşik resim sürüklemesi (HTML5 drag) devreye girip node'un mousemove
              akışını kesiyor — görsel "kutudan ayrılmış" gibi tek başına sürükleniyordu. */}
          {gorselUrl && node.durum === "tamam" && (
            <img src={gorselUrl} alt="" draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover" />
          )}

          {/* boş üretici → filigran */}
          {uretici && !gorselUrl && node.durum !== "isleniyor" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <VayraFiligran />
            </div>
          )}

          {/* işleniyor — referansta ağır spinner+yüzde YOK.
              Filigran nabız atar + kartın altında ince lime ilerleme çizgisi. */}
          {node.durum === "isleniyor" && (
            <>
              <div className="absolute inset-0 flex animate-pulse items-center justify-center">
                <VayraFiligran />
              </div>
              <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/[0.06]">
                <div className="h-full transition-[width] duration-300"
                  style={{ width: `${node.ilerleme ?? 0}%`, background: CV_LIME }} />
              </div>
            </>
          )}

          {/* hata */}
          {node.durum === "hata" && (
            <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
              <span className="text-[12px] font-medium" style={{ color: CV.tehlike }}>
                Üretilemedi
              </span>
            </div>
          )}

          {/* İSTEM gövdesi — tek alan */}
          {node.tip === "istem" && (
            <div className="flex h-full flex-col p-[14px]">
              {duzenleniyor ? (
                <textarea
                  autoFocus value={node.istem}
                  onChange={(e) => onIstemDegis(e.target.value)}
                  onBlur={onDuzenleBitir}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder={meta.placeholder}
                  className="h-full w-full resize-none bg-transparent text-[15px] leading-[1.5] outline-none [scrollbar-width:thin]"
                  style={{ color: "#EDEDEE" }}
                />
              ) : (
                <p className="flex-1 overflow-hidden text-[15px] leading-[1.5]"
                  style={{ color: node.istem ? "#EDEDEE" : CV.nodePlaceholder }}>
                  {node.istem || meta.placeholder}
                </p>
              )}
            </div>
          )}

          {/* LLM gövdesi — 3 bölüm: Kullanıcı İstemi │ Sistem İstemi │ boş */}
          {node.tip === "llm" && (
            <div className="flex h-full flex-col">
              <div className="flex min-h-0 flex-1 flex-col px-[14px] pb-3 pt-[18px]">
                <p className="mb-1 text-[11px] font-semibold" style={{ color: CV.nodeBaslik }}>
                  Kullanıcı İstemi
                </p>
                {duzenleniyor ? (
                  <textarea
                    autoFocus value={node.istem}
                    onChange={(e) => onIstemDegis(e.target.value)}
                    onBlur={onDuzenleBitir}
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder={meta.placeholder}
                    className="min-h-0 flex-1 resize-none bg-transparent text-[15px] leading-[1.5] outline-none [scrollbar-width:thin]"
                    style={{ color: "#EDEDEE" }}
                  />
                ) : (
                  <p className="min-h-0 flex-1 overflow-hidden text-[15px] leading-[1.5]"
                    style={{ color: node.istem ? "#EDEDEE" : CV.nodePlaceholder }}>
                    {node.istem || meta.placeholder}
                  </p>
                )}
              </div>
              <div className="shrink-0 px-[14px] py-3" style={{ borderTop: `1px solid ${CV.nodeAyrac}` }}>
                <p className="text-[11px] font-semibold" style={{ color: CV.nodeBaslik }}>
                  Sistem İstemi (İsteğe bağlı)
                </p>
              </div>
              <div className="h-[58px] shrink-0" style={{ borderTop: `1px solid ${CV.nodeAyrac}` }} />
            </div>
          )}

          {/* SES gövdesi — 3 bölüm: metin │ 38px ön ayar satırı │ 45px boş */}
          {node.tip === "ses" && (
            <div className="flex h-full flex-col">
              <div className="min-h-0 flex-1 px-3 pb-3 pt-[11px]">
                <p className="text-[15px] leading-[1.5]"
                  style={{ color: node.istem ? "#EDEDEE" : CV.nodePlaceholder }}>
                  {node.istem || meta.placeholder}
                </p>
              </div>
              <div className="flex h-[38px] shrink-0 items-center justify-between px-3 text-[13px]"
                style={{ borderTop: `1px solid ${CV.nodeAyrac}` }}>
                <span style={{ color: CV.nodeAlt }}>Ses ön ayarı</span>
                <span className="font-semibold" style={{ color: CV_LIME }}>
                  {node.ayarlar.sesOnAyar ?? "Tallulah"}
                </span>
              </div>
              <div className="h-[45px] shrink-0" style={{ borderTop: `1px solid ${CV.nodeAyrac}` }} />
            </div>
          )}

          {/* alt bar — görsel/video üreticide "Model | Oran" */}
          {(node.tip === "gorsel" || node.tip === "video") && (
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 pb-[12px] pl-[9px] pr-3 text-[13px]"
              style={{ color: CV.nodeAlt }}>
              <span className="truncate">{node.model}</span>
              {node.ayarlar.oran && (
                <>
                  <span style={{ color: CV.nodeAltPipe }}>|</span>
                  <span>{node.ayarlar.oran}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* seçim tutamaçları — 4 köşe, KARE (çoklu seçimde yuvarlak) */}
        {secili && <Tutamaclar coklu={coklu} />}
      </div>
    </div>
  );
});

/* ── 4 köşe tutamacı ── */
function Tutamaclar({ coklu }: { coklu: boolean }) {
  const t = CV_OLCU.tutamac;
  const ortak: React.CSSProperties = {
    position: "absolute", width: t, height: t,
    background: "#FFFFFF", border: `1px solid ${CV.secim}`,
    borderRadius: coklu ? "50%" : 1.5,
  };
  const d = -(t / 2);
  return (
    <>
      <span style={{ ...ortak, left: d, top: d }} />
      <span style={{ ...ortak, right: d, top: d }} />
      <span style={{ ...ortak, left: d, bottom: d }} />
      <span style={{ ...ortak, right: d, bottom: d }} />
    </>
  );
}

/** Boş üretici node ortasındaki marka filigranı. */
function VayraFiligran() {
  return (
    <svg width="26" height="26" viewBox="0 0 44 44" fill="none" aria-hidden>
      <path
        d="M11 14c0-2 1.5-3.5 3.5-3.5S18 12 18 14v9c0 3.5 2.5 6 6 6s6-2.5 6-6v-9c0-2 1.5-3.5 3.5-3.5S37 12 37 14"
        stroke={CV.filigran} strokeWidth="3.2" strokeLinecap="round"
      />
    </svg>
  );
}

/** Metin/sticky biçim ayarlarını CSS'e çevirir (font/punto/hiza/B/I/U/S). */
function bicimStili(node: CanvasNode, varsayilanPunto: number): React.CSSProperties {
  const f = FONTLAR.find((x) => x.ad === (node.font ?? "Varsayılan"));
  const suslu = [node.alti && "underline", node.ustu && "line-through"].filter(Boolean).join(" ");
  return {
    fontFamily: f?.css,
    fontSize: node.punto ?? varsayilanPunto,
    fontWeight: node.kalin ? 700 : undefined,
    fontStyle: node.italik ? "italic" : undefined,
    textDecoration: suslu || undefined,
    textAlign: node.hiza === "orta" ? "center" : node.hiza === "sag" ? "right"
      : node.hiza === "yasla" ? "justify" : "left",
  };
}

/** Liste biçimi seçiliyse satır başlarına madde/numara ekler. */
function listeMetni(node: CanvasNode): string {
  if (!node.liste || !node.istem) return node.istem;
  return node.istem.split("\n")
    .map((satir, i) => (node.liste === "madde" ? `• ${satir}` : `${i + 1}. ${satir}`))
    .join("\n");
}

/* ══════════ Yapışkan not ══════════ */
function Sticky({ node, secili, duzenleniyor, onBasla, onSecim, onIstemDegis, onDuzenleBitir, onCiftTikla, onKopyala }: {
  node: CanvasNode; secili: boolean; duzenleniyor: boolean;
  onBasla: (e: React.MouseEvent) => void; onSecim: (e: React.MouseEvent) => void;
  onIstemDegis: (v: string) => void; onDuzenleBitir: () => void; onCiftTikla: () => void;
  /** Kenar "+" tutamağı: o yöne aynı renk/metinle yeni sticky kopyalar. */
  onKopyala?: (yon: "ust" | "sag" | "alt" | "sol") => void;
}) {
  const [hoverYon, setHoverYon] = useState<"ust" | "sag" | "alt" | "sol" | null>(null);
  const BOSLUK = 40;   // iki sticky arası sabit boşluk (referans)
  const taRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!duzenleniyor) return;
    const t = requestAnimationFrame(() => taRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [duzenleniyor]);

  return (
    <div
      data-node={node.id}
      className="absolute select-none"
      style={{ left: node.x, top: node.y, width: node.g, height: node.y2 }}
      onMouseDown={onBasla} onClick={onSecim} onDoubleClick={onCiftTikla}>

      {/* ── 4 KENAR "+" TUTAMAĞI ──
          Referans: seçili sticky'nin kenar ortalarında beyaz nokta; üstüne
          gelince mavi "+" butonuna dönüşür ve o yönde hayalet önizleme çıkar. */}
      {secili && onKopyala && (["ust", "sag", "alt", "sol"] as const).map((yon) => {
        const orta = { ust: { left: node.g / 2, top: 0 }, sag: { left: node.g, top: node.y2 / 2 },
                       alt: { left: node.g / 2, top: node.y2 }, sol: { left: 0, top: node.y2 / 2 } }[yon];
        const acik = hoverYon === yon;
        return (
          <div key={yon}>
            {/* hayalet önizleme */}
            {acik && (
              <span className="pointer-events-none absolute rounded-[4px]"
                style={{
                  width: node.g, height: node.y2,
                  left: yon === "sag" ? node.g + BOSLUK : yon === "sol" ? -(node.g + BOSLUK) : 0,
                  top: yon === "alt" ? node.y2 + BOSLUK : yon === "ust" ? -(node.y2 + BOSLUK) : 0,
                  background: `${node.renk ?? "#FAE196"}44`,
                  border: `1px dashed ${node.renk ?? "#FAE196"}`,
                }} />
            )}
            <button
              onMouseEnter={() => setHoverYon(yon)}
              onMouseLeave={() => setHoverYon(null)}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onKopyala(yon); setHoverYon(null); }}
              aria-label={`${yon} yönüne not ekle`}
              className="absolute z-20 flex items-center justify-center rounded-full transition-all"
              style={{
                left: orta.left, top: orta.top,
                width: acik ? 26 : 9, height: acik ? 26 : 9,
                transform: "translate(-50%, -50%)",
                background: acik ? "#FFFFFF" : "#FFFFFF",
                border: acik ? `2px solid ${CV.tutamacMavi}` : "none",
                boxShadow: undefined,
              }}>
              {acik && <Plus className="h-3.5 w-3.5" style={{ color: CV.tutamacMavi }} strokeWidth={3} />}
            </button>
          </div>
        );
      })}

      <div
        className="relative h-full w-full p-3"
        style={{
          background: node.renk ?? "#FAE196",
          borderRadius: 4,
          outline: secili ? `2px solid ${CV.secim}` : undefined,
          boxShadow: "none",
        }}>
        {duzenleniyor ? (
          <textarea
            ref={taRef} value={node.istem}
            onChange={(e) => onIstemDegis(e.target.value)}
            onBlur={onDuzenleBitir}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="Metin ekle"
            className="h-full w-full resize-none bg-transparent leading-[1.45] text-[#1A1A18] outline-none placeholder:text-black/35"
            style={bicimStili(node, 14)}
          />
        ) : (
          <p className={cn("whitespace-pre-wrap leading-[1.45]", node.istem ? "text-[#1A1A18]" : "text-black/35")}
            style={bicimStili(node, 14)}>
            {listeMetni(node) || "Metin ekle"}
          </p>
        )}
      </div>
      {secili && <Tutamaclar coklu={false} />}
    </div>
  );
}

/* ══════════ Serbest metin ══════════ */
function Metin({ node, secili, duzenleniyor, onBasla, onSecim, onIstemDegis, onDuzenleBitir, onCiftTikla }: {
  node: CanvasNode; secili: boolean; duzenleniyor: boolean;
  onBasla: (e: React.MouseEvent) => void; onSecim: (e: React.MouseEvent) => void;
  onIstemDegis: (v: string) => void; onDuzenleBitir: () => void; onCiftTikla: () => void;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  /* `autoFocus` tek başına yetmiyor: node yeni monte olurken odak başka yere
     kayıyor ve yazılan harfler ARAÇ KISAYOLU olarak yorumlanıyordu (m/r/h…).
     Bir sonraki kareye erteleyip açıkça odaklıyoruz. */
  useEffect(() => {
    if (!duzenleniyor) return;
    const t = requestAnimationFrame(() => taRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [duzenleniyor]);

  return (
    <div
      data-node={node.id}
      className="absolute select-none"
      style={{ left: node.x, top: node.y, minWidth: node.g }}
      onMouseDown={onBasla} onClick={onSecim} onDoubleClick={onCiftTikla}>
      <div className="relative px-1 py-0.5"
        style={{ outline: secili ? `1px solid ${CV.secim}` : undefined }}>
        {duzenleniyor ? (
          <textarea
            ref={taRef} value={node.istem} rows={1}
            onChange={(e) => onIstemDegis(e.target.value)}
            onBlur={onDuzenleBitir}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="Metin ekle"
            className="w-full resize-none overflow-hidden bg-transparent font-medium outline-none placeholder:text-white/30"
            style={{ ...bicimStili(node, 20), color: node.renk ?? "#FFFFFF" }}
          />
        ) : (
          <p className="whitespace-pre-wrap font-medium"
            style={{
              ...bicimStili(node, 20),
              color: node.istem ? (node.renk ?? "#FFFFFF") : "rgba(255,255,255,0.3)",
            }}>
            {listeMetni(node) || "Metin ekle"}
          </p>
        )}
        {secili && <Tutamaclar coklu={false} />}
      </div>
    </div>
  );
}

/* ══════════ Şekil ══════════ */
function Sekil({ node, secili, onBasla, onSecim }: {
  node: CanvasNode; secili: boolean;
  onBasla: (e: React.MouseEvent) => void; onSecim: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      data-node={node.id}
      className="absolute select-none"
      style={{ left: node.x, top: node.y, width: node.g, height: node.y2 }}
      onMouseDown={onBasla} onClick={onSecim}>
      {/* 18 şeklin hepsi SVG path ile — referans birebir (içi boş kontur). */}
      <svg className="h-full w-full" viewBox="0 0 100 100" fill="none" preserveAspectRatio="none">
        <path d={SEKIL_PATH[node.sekilTur ?? "kare"]}
          stroke={node.renk ?? "#FFFFFF"} strokeWidth="3" strokeLinejoin="round"
          vectorEffect="non-scaling-stroke" />
      </svg>
      {secili && (
        <span className="pointer-events-none absolute inset-0"
          style={{ outline: `1px solid ${CV.secim}`, outlineOffset: 3 }} />
      )}
      {secili && <Tutamaclar coklu={false} />}
    </div>
  );
}

/* ══════════ Tepki (emoji) ══════════ */
function Tepki({ node, secili, onBasla, onSecim }: {
  node: CanvasNode; secili: boolean;
  onBasla: (e: React.MouseEvent) => void; onSecim: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      data-node={node.id}
      className="absolute flex select-none items-center justify-center"
      style={{ left: node.x, top: node.y, width: node.g, height: node.y2 }}
      onMouseDown={onBasla} onClick={onSecim}>
      <span className="text-[30px] leading-none"
        style={{ outline: secili ? `1px solid ${CV.secim}` : undefined }}>
        {node.emoji ?? "👍"}
      </span>
    </div>
  );
}

/* ══════════ Serbest çizim (kalem) ══════════
   `cizim` node'a GÖRELİ SVG path tutar; node taşınınca çizim de taşınır. */
function Cizim({ node, secili, onBasla, onSecim }: {
  node: CanvasNode; secili: boolean;
  onBasla: (e: React.MouseEvent) => void; onSecim: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      data-node={node.id}
      className="absolute select-none"
      style={{ left: node.x, top: node.y, width: node.g, height: node.y2 }}
      onMouseDown={onBasla} onClick={onSecim}>
      <svg className="pointer-events-none absolute inset-0 overflow-visible"
        width={node.g} height={node.y2}>
        <path d={node.cizim ?? ""} fill="none"
          stroke={node.renk ?? "#FFFFFF"}
          strokeWidth={node.kalinlik ?? 3}
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {secili && (
        <span className="pointer-events-none absolute inset-0 rounded-[6px]"
          style={{ outline: `1px solid ${CV.secim}`, outlineOffset: 4 }} />
      )}
    </div>
  );
}

/* ══════════ Ok / çizgi ══════════
   İki uç node kutusuna görelidir: (0,0) → (x2,y3). */
function Ok({ node, secili, onBasla, onSecim }: {
  node: CanvasNode; secili: boolean;
  onBasla: (e: React.MouseEvent) => void; onSecim: (e: React.MouseEvent) => void;
}) {
  const bilgi = OK_STILLERI.find((o) => o.stil === node.okStil) ?? OK_STILLERI[0];
  const x2 = node.x2 ?? node.g;
  const y2 = node.y3 ?? node.y2;
  const renk = node.renk ?? "#FFFFFF";
  const kal = node.kalinlik ?? 2.5;
  const okId = `ok-${node.id}`;

  /* Kıvrık stilde yatay çıkıp dikey inen yumuşak bezier. */
  const d = bilgi.egri
    ? `M 0 0 C ${x2 * 0.55} 0, ${x2 * 0.45} ${y2}, ${x2} ${y2}`
    : `M 0 0 L ${x2} ${y2}`;

  return (
    <div
      data-node={node.id}
      className="absolute select-none"
      style={{ left: node.x, top: node.y, width: Math.abs(x2) || 2, height: Math.abs(y2) || 2 }}
      onMouseDown={onBasla} onClick={onSecim}>
      <svg className="absolute overflow-visible" style={{ left: 0, top: 0, width: 1, height: 1 }}>
        {bilgi.ucVar && (
          <defs>
            <marker id={okId} viewBox="0 0 10 10" refX="9" refY="5"
              markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={renk} />
            </marker>
          </defs>
        )}
        <path d={d} fill="none" stroke={renk} strokeWidth={kal}
          strokeLinecap="round" strokeDasharray={bilgi.desen}
          markerEnd={bilgi.ucVar ? `url(#${okId})` : undefined} />
        {/* tıklama alanı — ince çizgiyi yakalamak zor */}
        <path d={d} fill="none" stroke="transparent" strokeWidth={14} />
      </svg>
      {secili && (
        <>
          <span className="absolute h-[7px] w-[7px] rounded-[1px]"
            style={{ left: -3.5, top: -3.5, background: "#FFF", border: `1px solid ${CV.secim}` }} />
          <span className="absolute h-[7px] w-[7px] rounded-[1px]"
            style={{ left: x2 - 3.5, top: y2 - 3.5, background: "#FFF", border: `1px solid ${CV.secim}` }} />
        </>
      )}
    </div>
  );
}

/* ══════════ Yorum pini + composer ══════════
   Referans: sol-alt sivri damla avatar (mavi ring) + yanında kapsül input. */
function Yorum({ node, secili, duzenleniyor, onBasla, onSecim, onIstemDegis, onDuzenleBitir, onCiftTikla }: {
  node: CanvasNode; secili: boolean; duzenleniyor: boolean;
  onBasla: (e: React.MouseEvent) => void; onSecim: (e: React.MouseEvent) => void;
  onIstemDegis: (v: string) => void; onDuzenleBitir: () => void; onCiftTikla: () => void;
}) {
  const acik = duzenleniyor || (secili && !node.istem);
  return (
    <div
      data-node={node.id}
      className="absolute flex select-none items-start gap-2"
      style={{ left: node.x, top: node.y }}
      onMouseDown={onBasla} onClick={onSecim} onDoubleClick={onCiftTikla}>

      {/* pin — sol-alt köşesi sivri damla, mavi ring, lime avatar */}
      <span className="relative flex h-[34px] w-[34px] shrink-0 items-center justify-center"
        style={{
          background: CV.pinHalka,
          borderRadius: "50% 50% 50% 4px",
          boxShadow: node.cozuldu ? "none" : `0 0 0 2px ${CV.pinHalka}55`,
          opacity: node.cozuldu ? 0.45 : 1,
        }}>
        <span className="h-[26px] w-[26px] rounded-full"
          style={{ background: "radial-gradient(circle at 35% 35%, #D9F75D, #DADBCC)" }} />
      </span>

      {acik ? (
        <div className="flex items-center gap-2 rounded-full px-4 py-2"
          style={{ background: CV.yorumKutu, border: `1px solid ${CV.yorumKenar}`, minWidth: 300 }}
          onMouseDown={(e) => e.stopPropagation()}>
          <input
            autoFocus value={node.istem}
            onChange={(e) => onIstemDegis(e.target.value)}
            onBlur={onDuzenleBitir}
            onKeyDown={(e) => { if (e.key === "Enter") onDuzenleBitir(); }}
            placeholder="Yorum ekle..."
            className="w-full bg-transparent text-[15px] text-white outline-none"
            style={{ caretColor: CV_LIME }}
          />
          <button onClick={onDuzenleBitir} aria-label="Gönder"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
            style={{ background: CV.yorumGonder }}>
            <ArrowUp className="h-4 w-4" style={{ color: CV.yorumOk }} />
          </button>
        </div>
      ) : node.istem ? (
        <div className="max-w-[260px] rounded-[12px] px-3 py-2"
          style={{ background: CV.yorumKutu, border: `1px solid ${CV.yorumKenar}` }}>
          <p className={cn("text-[13.5px] leading-[1.45]", node.cozuldu ? "text-white/40 line-through" : "text-white")}>
            {node.istem}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** Sparkles yeniden ihraç — inspector kredi rozetinde kullanılıyor. */
export { Sparkles as KrediIkon };
