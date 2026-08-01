"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MousePointer2, Hand, Pencil, StickyNote, Square, Type, ArrowUpRight,
  Heart, MessageCircle, FolderPlus, Plus, Eraser, Search, SmilePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CV, CV_LIME, CV_OLCU, STICKY_PALET, CIZIM_PALET } from "@/lib/canvasTema";
import {
  HIZLI_TEPKILER, EMOJILER, OK_STILLERI, SEKIL_SIRA, SEKIL_PATH,
  type NodeTur, type OkStil, type OkStilBilgi, type SekilTur,
} from "@/lib/canvasVeri";
import { CvEklemePaleti } from "./CvEklemePaleti";
import { CvRenkSecici } from "./CvRenkSecici";

/* ============================================================
   ALT ARAÇ ÇUBUĞU — referans birebir ölçüm.

   Kapsül 510×57, alt kenardan 20px, YATAY ORTALI.
   11 buton, 4 grup: [seç·kaydır] | [çiz·sticky·şekil] |
   [metin·ok·tepki·yorum] | [klasör·ekle]
   Buton 40px daire · adım 44px · gruplar arası ayraç 13px
   Aktif: BEYAZ dolu daire + ikon siyah · Hover: #333538
   Tooltip: "Ad (Kısayol)" · zemin #171717 (panellerden farklı)

   Araç seçilince çubuğun ÜSTÜNDE kontekst çubuğu açılır:
     çizim → renk+kalınlık · sticky → 10 pastel · şekil → 18 şekil
     tepki → hızlı emoji + picker · yorum → "Çözülenleri gizle"
   ============================================================ */

export type Arac =
  | "sec" | "kaydir" | "cizim" | "silgi" | "sticky" | "sekil"
  | "metin" | "ok" | "tepki" | "yorum";

const ARACLAR: { arac: Arac; ikon: React.ComponentType<{ className?: string }>; ad: string; ks: string; grupSonu?: boolean }[] = [
  { arac: "sec",    ikon: MousePointer2, ad: "Seçim Modu",   ks: "V" },
  { arac: "kaydir", ikon: Hand,          ad: "Kaydırma Modu", ks: "H", grupSonu: true },
  { arac: "cizim",  ikon: Pencil,        ad: "Çizim",        ks: "D" },
  { arac: "sticky", ikon: StickyNote,    ad: "Yapışkan Not", ks: "N" },
  { arac: "sekil",  ikon: Square,        ad: "Şekil",        ks: "R", grupSonu: true },
  { arac: "metin",  ikon: Type,          ad: "Metin",        ks: "T" },
  { arac: "ok",     ikon: ArrowUpRight,  ad: "Ok",           ks: "" },
  { arac: "tepki",  ikon: Heart,         ad: "Tepki",        ks: "S" },
  { arac: "yorum",  ikon: MessageCircle, ad: "Yorum Modu",   ks: "C", grupSonu: true },
];

export function CvAracCubugu({
  arac, onArac, onKlasor, onEkle,
  cizimRenk, onCizimRenk, cizimKalin, onCizimKalin,
  stickyRenk, onStickyRenk, sekilTur, onSekilTur, sekilRenk, onSekilRenk,
  okStil, onOkStil, tepkiEmoji, onTepkiSec,
  cozulenGizli, onCozulenGizli,
}: {
  arac: Arac;
  onArac: (a: Arac) => void;
  onKlasor: () => void;
  onEkle: (tip: NodeTur) => void;
  cizimRenk: string; onCizimRenk: (r: string) => void;
  cizimKalin: "ince" | "kalin"; onCizimKalin: (k: "ince" | "kalin") => void;
  stickyRenk: string; onStickyRenk: (r: string) => void;
  sekilTur: SekilTur; onSekilTur: (s: SekilTur) => void;
  sekilRenk: string; onSekilRenk: (r: string) => void;
  okStil: OkStil; onOkStil: (s: OkStil) => void;
  /** Tepki aracıyla yapıştırılacak emoji — seçili olan beyaz daire alır. */
  tepkiEmoji: string; onTepkiSec: (e: string) => void;
  cozulenGizli: boolean; onCozulenGizli: (v: boolean) => void;
}) {
  const [ekleAcik, setEkleAcik] = useState(false);
  const [emojiAcik, setEmojiAcik] = useState(false);
  const [emojiAra, setEmojiAra] = useState("");
  const [sekilRenkAcik, setSekilRenkAcik] = useState(false);
  const [renkSecici, setRenkSecici] = useState(false);
  /* Emoji araması GERÇEK filtre (eskiden dekoratifti). */
  const emojiSuzulu = emojiAra.trim() ? EMOJILER.filter((e) => e.includes(emojiAra.trim())) : EMOJILER;

  return (
    <>
      {/* ══ KONTEKST ÇUBUĞU — aracın üstünde ══ */}
      <AnimatePresence>
        {(arac === "cizim" || arac === "silgi") && (
          <Kontekst key="cizim">
            <div className="flex items-center gap-1">
              {(["kalin", "ince"] as const).map((k) => (
                <button key={k} onClick={() => onCizimKalin(k)}
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                  style={{ background: cizimKalin === k ? CV.limeIz : "transparent" }}
                  aria-label={k === "kalin" ? "Kalın uç" : "İnce uç"}>
                  <span className="rounded-full"
                    style={{
                      width: k === "kalin" ? 16 : 12, height: k === "kalin" ? 4 : 2,
                      background: cizimKalin === k ? CV_LIME : "#8A8B8D",
                    }} />
                </button>
              ))}
            </div>
            <Ayrac />
            {CIZIM_PALET.map((r) => (
              <RenkNoktasi key={r} renk={r} secili={cizimRenk === r} onTikla={() => onCizimRenk(r)} />
            ))}
            {/* RENK ÇARKI — tam RGB seçiciyi açar (referans birebir) */}
            <button onClick={() => setRenkSecici((v) => !v)} aria-label="Renk çarkı"
              className="flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110">
              <span className="h-[22px] w-[22px] rounded-full"
                style={{
                  background: "conic-gradient(#F00,#FF0,#0F0,#0FF,#00F,#F0F,#F00)",
                  boxShadow: renkSecici ? "0 0 0 2px #1C1E21, 0 0 0 4px #FFF" : undefined,
                }} />
            </button>
            <Ayrac />
            {/* GERÇEK silgi: aracı "silgi"ye çevirir (eskiden sadece rengi
                beyaz yapıyordu — hiçbir şeyi silmiyordu). */}
            <button onClick={() => onArac(arac === "silgi" ? "cizim" : "silgi")} aria-label="Silgi"
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
              style={{ background: arac === "silgi" ? "#FFFFFF" : CV.barHover }}>
              <Eraser className="h-4 w-4" style={{ color: arac === "silgi" ? "#0F1113" : "#FFFFFF" }} />
            </button>
          </Kontekst>
        )}

        {arac === "sticky" && (
          <Kontekst key="sticky">
            {STICKY_PALET.map((r) => (
              <RenkNoktasi key={r} renk={r} secili={stickyRenk === r} onTikla={() => onStickyRenk(r)} />
            ))}
          </Kontekst>
        )}

        {/* ŞEKİL PANELİ — referans birebir: üstte renk satırı + 3×6 = 18 şekil */}
        {arac === "sekil" && (
          <motion.div key="sekil"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.14 }}
            className="absolute bottom-[88px] left-1/2 z-40 -translate-x-1/2 overflow-hidden"
            style={{
              width: 250, background: CV.bar,
              border: `1px solid ${CV.barKenar}`, borderRadius: 12,
              boxShadow: "0 12px 34px rgba(0,0,0,0.45)",
            }}>
            {/* dolgu rengi satırı */}
            <div className="flex items-center px-[15px]" style={{ height: 43 }}>
              <button onClick={() => setSekilRenkAcik((v) => !v)} aria-label="Şekil rengi"
                className="h-6 w-6 rounded-full transition-transform hover:scale-110"
                style={{ background: sekilRenk, boxShadow: `0 0 0 1px ${CV.barKenar}` }} />
              {sekilRenkAcik && (
                <div className="ml-3 flex items-center gap-1.5">
                  {CIZIM_PALET.map((r) => (
                    <button key={r} onClick={() => { onSekilRenk(r); setSekilRenkAcik(false); }}
                      aria-label={`Şekil rengi ${r}`}
                      className="h-4 w-4 rounded-full transition-transform hover:scale-125"
                      style={{ background: r, boxShadow: sekilRenk === r ? "0 0 0 2px #FFF" : undefined }} />
                  ))}
                </div>
              )}
            </div>
            <div className="h-px" style={{ background: CV.panelAyrac }} />
            {/* 18 şekil — 3 satır × 6 sütun */}
            <div className="grid grid-cols-6 gap-0.5 p-1.5">
              {SEKIL_SIRA.map((sk) => (
                <button key={sk} onClick={() => onSekilTur(sk)}
                  aria-label={`Şekil ${sk}`}
                  className="flex h-10 items-center justify-center rounded-full transition-colors hover:bg-white/[0.08]"
                  style={{ background: sekilTur === sk ? "#FFFFFF" : "transparent" }}>
                  <svg width="20" height="20" viewBox="0 0 100 100" fill="none" aria-hidden>
                    <path d={SEKIL_PATH[sk]} stroke={sekilTur === sk ? "#0F1113" : "#FFFFFF"}
                      strokeWidth="7" strokeLinejoin="round" />
                  </svg>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {arac === "ok" && (
          <Kontekst key="ok">
            {OK_STILLERI.map((o) => (
              <div key={o.stil} className="flex items-center">
                <button onClick={() => onOkStil(o.stil)}
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
                  style={{ background: okStil === o.stil ? "#FFFFFF" : "transparent" }}
                  aria-label={`Ok stili ${o.stil}`}>
                  <OkOnizleme bilgi={o} renk={okStil === o.stil ? "#0F1113" : "#FFFFFF"} />
                </button>
                {o.grupSonu && <Ayrac />}
              </div>
            ))}
          </Kontekst>
        )}

        {arac === "tepki" && (
          <Kontekst key="tepki">
            {HIZLI_TEPKILER.map((e) => (
              <button key={e} onClick={() => onTepkiSec(e)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[19px] transition-colors hover:bg-white/10"
                style={{ background: tepkiEmoji === e ? "#FFFFFF" : "transparent" }}>
                {e}
              </button>
            ))}
            <button onClick={() => setEmojiAcik((v) => !v)} aria-label="Emoji seç"
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
              style={{ background: emojiAcik ? "#FFFFFF" : CV.barIkon }}>
              <SmilePlus className="h-[17px] w-[17px]" style={{ color: emojiAcik ? "#0F1113" : "#FFFFFF" }} />
            </button>
          </Kontekst>
        )}

        {arac === "yorum" && (
          <Kontekst key="yorum">
            <span className="pl-2 text-[13px]" style={{ color: "#D2D2D3" }}>Çözülenleri gizle</span>
            <button onClick={() => onCozulenGizli(!cozulenGizli)} role="switch" aria-checked={cozulenGizli}
              aria-label="Çözülenleri gizle"
              className="relative ml-1 mr-1 h-[26px] w-[48px] rounded-full transition-colors"
              style={{ background: cozulenGizli ? CV_LIME : CV.toggleKapali }}>
              <span className="absolute top-[3px] h-5 w-5 rounded-full bg-white transition-all"
                style={{ left: cozulenGizli ? 25 : 3 }} />
            </button>
          </Kontekst>
        )}
      </AnimatePresence>

      {/* ══ RGB RENK SEÇİCİ — çizim çubuğunun üstünde ══ */}
      <AnimatePresence>
        {renkSecici && (arac === "cizim" || arac === "silgi") && (
          <CvRenkSecici
            renk={cizimRenk}
            onRenk={onCizimRenk}
            onKapat={() => setRenkSecici(false)}
            stil={{ position: "absolute", bottom: 146, left: "50%", transform: "translateX(-50%)" }}
          />
        )}
      </AnimatePresence>

      {/* ══ EMOJİ PICKER — kontekst çubuğunun da üstünde ══ */}
      <AnimatePresence>
        {emojiAcik && arac === "tepki" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.14 }}
            className="absolute bottom-[146px] left-1/2 z-50 -translate-x-1/2 overflow-hidden rounded-[16px]"
            style={{ width: 372, background: CV.panel, border: `1px solid ${CV.barKenar}`, boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
            <div className="p-2.5 pb-1.5">
              <label className="flex h-10 items-center gap-2 rounded-[10px] px-3" style={{ background: CV.panelAra }}>
                <Search className="h-4 w-4 shrink-0" style={{ color: CV.panelPlaceholder }} />
                <input value={emojiAra} onChange={(e) => setEmojiAra(e.target.value)}
                  placeholder="Emoji ara"
                  className="w-full bg-transparent text-[14px] text-white outline-none placeholder:text-[#656668]" />
              </label>
            </div>
            {/* kategorisiz tek sonsuz liste — referans birebir, 7 sütun */}
            <div className="grid max-h-[268px] grid-cols-7 gap-1 overflow-y-auto p-2.5 pt-1
                            [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {emojiSuzulu.map((e, i) => (
                <button key={`${e}-${i}`} onClick={() => { onTepkiSec(e); setEmojiAcik(false); }}
                  className="flex h-11 items-center justify-center rounded-[8px] text-[21px] transition-colors hover:bg-[#2E3033]"
                  style={{ background: tepkiEmoji === e ? "#2E3033" : undefined }}>
                  {e}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ EKLEME PALETİ ══
          Sağ tıkla AYNI bileşen açılıyor (CvEklemePaleti) — tek kaynak. */}
      <AnimatePresence>
        {ekleAcik && (
          <CvEklemePaleti
            onSec={onEkle}
            onKapat={() => setEkleAcik(false)}
            stil={{ position: "absolute", bottom: 88, left: "50%", marginLeft: 40 }}
          />
        )}
      </AnimatePresence>

      {/* ══ ANA ÇUBUK ══ */}
      <div
        className="absolute left-1/2 z-40 flex -translate-x-1/2 items-center px-2"
        style={{
          bottom: CV_OLCU.barAlt,
          height: CV_OLCU.barYukseklik,
          background: CV.bar,
          border: `1px solid ${CV.barKenar}`,
          borderRadius: CV_OLCU.barRadius,
          boxShadow: "0 12px 34px rgba(0,0,0,0.45)",
        }}>
        {ARACLAR.map((a) => (
          <div key={a.arac} className="flex items-center">
            <AracBtn ikon={a.ikon} ad={a.ad} ks={a.ks}
              aktif={arac === a.arac} onTikla={() => onArac(a.arac)} />
            {a.grupSonu && <Ayrac />}
          </div>
        ))}
        <AracBtn ikon={FolderPlus} ad="Yeni klasör" ks="" aktif={false} onTikla={onKlasor} />
        <AracBtn ikon={Plus} ad="Node ekle" ks="" aktif={ekleAcik}
          onTikla={() => setEkleAcik((v) => !v)} />
      </div>
    </>
  );
}

/* ── kontekst çubuğu kabuğu ── */
function Kontekst({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.14 }}
      className="absolute bottom-[88px] left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 px-2.5"
      style={{
        height: 48, background: CV.bar,
        border: `1px solid ${CV.barKenar}`, borderRadius: 24,
        boxShadow: "0 12px 34px rgba(0,0,0,0.45)",
      }}>
      {children}
    </motion.div>
  );
}

function Ayrac() {
  return <span className="mx-[6.5px] h-[22px] w-px shrink-0" style={{ background: CV.barKenar }} />;
}

/** Ok stili önizlemesi — çubuktaki minik ikon (referans birebir 9 varyant). */
function OkOnizleme({ bilgi, renk }: { bilgi: OkStilBilgi; renk: string }) {
  const id = `onz-${bilgi.stil}`;
  /* "duz" ve "cizgi" yatay; diğerleri diyagonal (sağ-üste). */
  const yatay = bilgi.stil === "duz" || bilgi.stil === "duzOk";
  const d = bilgi.egri
    ? "M 3 15 C 3 6, 8 4, 14 4"
    : yatay ? "M 3 9 L 15 9" : "M 3 15 L 15 4";
  return (
    <svg width="19" height="19" viewBox="0 0 19 19" fill="none" aria-hidden>
      {bilgi.ucVar && (
        <defs>
          <marker id={id} viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={renk} />
          </marker>
        </defs>
      )}
      <path d={d} stroke={renk} strokeWidth="1.7" strokeLinecap="round"
        strokeDasharray={bilgi.desen} markerEnd={bilgi.ucVar ? `url(#${id})` : undefined} />
    </svg>
  );
}

function RenkNoktasi({ renk, secili, onTikla }: { renk: string; secili: boolean; onTikla: () => void }) {
  return (
    <button onClick={onTikla}
      className="flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110"
      aria-label={`Renk ${renk}`}>
      <span className="rounded-full"
        style={{
          width: 22, height: 22, background: renk,
          boxShadow: secili ? `0 0 0 2px ${CV.bar}, 0 0 0 4px #FFFFFF` : undefined,
          border: renk === "#1C1C1E" ? "1px solid #3A3B3E" : undefined,
        }} />
    </button>
  );
}

/* ── araç butonu + tooltip ── */
function AracBtn({ ikon: Ik, ad, ks, aktif, onTikla }: {
  ikon: React.ComponentType<{ className?: string }>;
  ad: string; ks: string; aktif: boolean; onTikla: () => void;
}) {
  const [ustunde, setUstunde] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={onTikla}
        onMouseEnter={() => setUstunde(true)}
        onMouseLeave={() => setUstunde(false)}
        className={cn(
          "flex items-center justify-center rounded-full transition-colors",
          !aktif && "hover:bg-[#333538]",
        )}
        style={{
          width: CV_OLCU.barButon, height: CV_OLCU.barButon,
          background: aktif ? "#FFFFFF" : "transparent",
        }}
        aria-label={ad} aria-pressed={aktif}>
        <Ik className="h-[18px] w-[18px]" />
      </button>
      <AnimatePresence>
        {ustunde && !aktif && (
          <motion.span
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.1 }}
            className="pointer-events-none absolute -top-[34px] left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-[8px] px-2.5 py-1.5 text-[13px] text-white"
            style={{ background: CV.tooltip, boxShadow: "0 6px 18px rgba(0,0,0,0.5)" }}>
            {ad}{ks && ` (${ks})`}
          </motion.span>
        )}
      </AnimatePresence>
      {/* aktif butonun ikonu siyah — referans birebir */}
      <style jsx>{`
        button[aria-pressed="true"] :global(svg) { color: #0F1113; }
        button[aria-pressed="false"] :global(svg) { color: #FFFFFF; }
      `}</style>
    </div>
  );
}
