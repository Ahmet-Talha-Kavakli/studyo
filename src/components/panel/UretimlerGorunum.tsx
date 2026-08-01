"use client";

/**
 * UretimlerGorunum — "Üretimlerim" / "Favorilerim" sayfaları, Higgsfield BİREBİR.
 * Referans: üretilenler-sayfası/ (9 ekran) + favoriler/ (1 ekran)
 *
 * Yapı:
 *  Başlık + sağda [Filtre] [Görünüm]
 *  BOŞLUKSUZ masonry ızgara (kartlar bitişik, kırpılmadan)
 *  Kart hover → sol-üst seçim kutusu + sağ-üst dikey araç şeridi (♡ ⤓ ⧉ 🖼 ⋯)
 *  ⋯ → 14 maddelik bağlam menüsü + 3 alt menü (Videoya çevir / Ek işlemler / Paylaş)
 *  Seçim → altta yüzen toplu işlem çubuğu
 *  Favoriler boşsa → pembe kalp + iki ipucu kartı
 */

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal, LayoutGrid, Check, Heart, Download, Copy, Image as ImageIcon,
  MoreHorizontal, ChevronRight, Play, X, Trash2, Share2, Link2, Expand,
  RefreshCw, AtSign, Sparkles, Wand2, Sun, Maximize2, Target, Grid3x3, Box,
  FolderInput, ClipboardCopy, ArrowUpRight, Eye, EyeOff, Folder,
} from "lucide-react";
import { cn, onizlemeArka } from "@/lib/utils";
import { scArka } from "@/lib/gercekVeri";
import type { Uretim } from "@/store/useProjeler";
import { UretimKarti } from "./UretimKarti";

/* ------------------------------------------------------------------ */
/* Menü tanımları — referans birebir                                   */
/* ------------------------------------------------------------------ */
const FILTRE_TIP = [
  { ad: "Tümü", Ik: LayoutGrid },
  { ad: "Görsel", Ik: ImageIcon },
  { ad: "Video", Ik: Play },
];
const FILTRE_ETKINLIK = [
  { ad: "Beğenilen", Ik: Heart },
  { ad: "İndirilen", Ik: Download },
  { ad: "Görülmemiş", Ik: EyeOff },
];
const VIDEOYA_CEVIR = ["Başlangıç karesi", "Son kare"];
const EK_ISLEMLER = [
  { ad: "3D sahne oluştur", Ik: Box },
  { ad: "Hex çıkar", Ik: Sparkles, yeni: true },
  { ad: "Çoklu çekim", Ik: Grid3x3 },
  { ad: "Boyama", Ik: Wand2 },
  { ad: "Cilt iyileştirici", Ik: Sparkles },
  { ad: "Yeniden ışıklandır", Ik: Sun },
  { ad: "Büyüt", Ik: Maximize2 },
  { ad: "Açılar", Ik: Target },
];
const PAYLAS = ["Bağlantıyı kopyala", "X'te paylaş", "WhatsApp'ta paylaş", "Pinterest'te paylaş", "LinkedIn'de paylaş"];

/* ------------------------------------------------------------------ */
/* Küçük menü parçaları                                                */
/* ------------------------------------------------------------------ */
const MenuSatir = ({ ad, Ik, tehlike, ok, yeni, onClick, onHover }: {
  ad: string; Ik?: React.ElementType; tehlike?: boolean; ok?: boolean; yeni?: boolean;
  onClick?: () => void; onHover?: () => void;
}) => (
  <button onClick={onClick} onMouseEnter={onHover}
    className={cn("flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[14px] transition-colors hover:bg-white/[0.07]",
      tehlike ? "text-rose-400" : "text-metin")}>
    {Ik && <Ik className="h-4 w-4 shrink-0 opacity-80" />}
    <span className="flex-1 truncate">{ad}</span>
    {yeni && <span className="shrink-0 rounded-[5px] bg-white px-1.5 py-[2px] text-[10px] font-black italic text-zemin">YENİ</span>}
    {ok && <ChevronRight className="h-4 w-4 shrink-0 text-metin-3" />}
  </button>
);

/* ================================================================== */

export function UretimlerGorunum({
  baslik, liste, favoriMi, onAc, onSil, onFavori,
}: {
  baslik: string;
  liste: Uretim[];
  favoriMi?: boolean;
  onAc: (u: Uretim) => void;
  onSil: (id: string) => void;
  onFavori: (id: string) => void;
}) {
  const [filtreAcik, setFiltreAcik] = useState(false);
  const [gorunumAcik, setGorunumAcik] = useState(false);
  const [tip, setTip] = useState("Tümü");
  const [duzen, setDuzen] = useState<"kare" | "masonry">("masonry");
  const [kartBoyut, setKartBoyut] = useState(3);
  const [secililer, setSecililer] = useState<string[]>([]);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuKonum, setMenuKonum] = useState<{ top: number; left: number } | null>(null);
  const [altMenu, setAltMenu] = useState<string | null>(null);
  const [onay3D, setOnay3D] = useState<string | null>(null);
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);

  const suzulmus = useMemo(() => {
    if (tip === "Görsel") return liste.filter((u) => u.tur !== "video");
    if (tip === "Video") return liste.filter((u) => u.tur === "video");
    return liste;
  }, [liste, tip]);

  const sutun = kartBoyut === 1 ? 6 : kartBoyut === 2 ? 5 : kartBoyut === 3 ? 4 : 3;
  const secimToggle = (id: string) =>
    setSecililer((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  /* ── Favoriler boş durumu (referans: favoriler/) ── */
  if (favoriMi && liste.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="mb-5 text-xl font-bold">{baslik}</h1>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-gradient-to-br from-pink-400 to-fuchsia-600 text-white">
            <Heart className="h-8 w-8" />
          </span>
          <p className="text-[24px] font-semibold text-metin">Favori üretimlerin burada görünecek</p>
          <p className="mt-1.5 text-[15px] text-metin-3">Beğendiklerini işaretleyerek buraya kaydet</p>
          <div className="mt-10 grid w-full max-w-[800px] grid-cols-1 gap-8 sm:grid-cols-2">
            {[
              { Ik: Heart, ad: "Favorilere ekle", ozet: "En iyi çekimlerini tek yerde topla, tekrar kullanmaya hazır" },
              { Ik: Folder, ad: "Her projeden", ozet: "Tüm proje ve klasörlerdeki favoriler burada görünür" },
            ].map(({ Ik, ad, ozet }, i) => (
              <div key={ad} className="relative h-[275px] overflow-hidden rounded-2xl border border-kenar bg-[#161616] p-5 text-left">
                <p className="flex items-center gap-2 text-[17px] font-semibold text-metin">
                  <Ik className={cn("h-[18px] w-[18px]", i === 0 ? "fill-current text-white" : "text-metin-3")} /> {ad}
                </p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-metin-3">{ozet}</p>
                {/* solan görsel ipucu */}
                <span className="pointer-events-none absolute inset-x-5 bottom-0 flex h-[130px] gap-2"
                  style={{ maskImage: "linear-gradient(to bottom, #000 30%, transparent)" }}>
                  {[0, 1, 2].map((j) => (
                    <span key={j} className="relative flex-1 rounded-xl" style={{ background: scArka(`fav-${i}-${j}`, "portre") }}>
                      {i === 0 && (
                        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-white">
                          <Heart className="h-3 w-3 fill-current" />
                        </span>
                      )}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      {/* Başlık + Filtre/Görünüm */}
      <div className="relative mb-5 flex items-center gap-2">
        <h1 className="flex-1 text-xl font-bold">{baslik}</h1>
        <button onClick={() => { setFiltreAcik((v) => !v); setGorunumAcik(false); }}
          className={cn("hf-cip flex h-9 items-center gap-2 rounded-xl px-3 text-[14px] text-metin-2 hover:text-metin", filtreAcik && "hf-cip-aktif text-metin")}>
          <SlidersHorizontal className="h-4 w-4" /> Filtre
        </button>
        <button onClick={() => { setGorunumAcik((v) => !v); setFiltreAcik(false); }}
          className={cn("hf-cip flex h-9 items-center gap-2 rounded-xl px-3 text-[14px] text-metin-2 hover:text-metin", gorunumAcik && "hf-cip-aktif text-metin")}>
          <LayoutGrid className="h-4 w-4" /> Görünüm
        </button>

        {/* Filtre menüsü */}
        <AnimatePresence>
          {filtreAcik && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFiltreAcik(false)} />
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="menu-surface absolute right-[110px] top-11 z-50 w-[280px] rounded-2xl p-1.5">
                <p className="px-3 pb-1 pt-2 text-[12px] text-metin-3">Tür</p>
                {FILTRE_TIP.map(({ ad, Ik }) => (
                  <button key={ad} onClick={() => { setTip(ad); setFiltreAcik(false); }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[14px] text-metin transition-colors hover:bg-white/[0.07]">
                    <Ik className="h-4 w-4 shrink-0 opacity-80" /><span className="flex-1">{ad}</span>
                    {tip === ad && <Check className="h-4 w-4 shrink-0 text-aksan" />}
                  </button>
                ))}
                <span className="my-1 block h-px bg-white/[0.07]" />
                <p className="px-3 pb-1 pt-1 text-[12px] text-metin-3">Etkinlik</p>
                {FILTRE_ETKINLIK.map(({ ad, Ik }) => <MenuSatir key={ad} ad={ad} Ik={Ik} />)}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Görünüm menüsü */}
        <AnimatePresence>
          {gorunumAcik && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setGorunumAcik(false)} />
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="menu-surface absolute right-0 top-11 z-50 w-[290px] rounded-2xl p-1.5">
                <p className="px-3 pb-1 pt-2 text-[12px] text-metin-3">Düzen</p>
                {([["kare", "Kare"], ["masonry", "Masonry"]] as const).map(([id, ad]) => (
                  <button key={id} onClick={() => setDuzen(id)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[14px] text-metin transition-colors hover:bg-white/[0.07]">
                    <LayoutGrid className="h-4 w-4 shrink-0 opacity-80" /><span className="flex-1">{ad}</span>
                    {duzen === id && <Check className="h-4 w-4 shrink-0 text-aksan" />}
                  </button>
                ))}
                <p className="px-3 pb-2 pt-2 text-[12px] text-metin-3">Kart boyutu</p>
                <div className="px-3 pb-3">
                  <input type="range" min={1} max={4} step={1} value={kartBoyut}
                    onChange={(e) => setKartBoyut(Number(e.target.value))}
                    className="h-1 w-full cursor-pointer accent-aksan" />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* BOŞLUKSUZ masonry (referans: kartlar bitişik) */}
      {suzulmus.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-kenar-2 bg-yuzey py-24 text-center">
          <ImageIcon className="mb-2 h-7 w-7 text-metin-3" />
          <p className="text-sm text-metin-2">Henüz üretim yok.</p>
        </div>
      ) : (
        /* Kartlar: /panel/gorsel ile BİREBİR aynı bileşen (UretimKarti) —
           tooltip'li hover rayı, ⋮ menüsü, lightbox, seçim davranışı ortak. */
        <div style={{ columnCount: sutun, columnGap: duzen === "masonry" ? 0 : 10 }}>
          {suzulmus.map((u) => (
            <div key={u.id} className="group/ur relative"
              style={{ breakInside: "avoid", marginBottom: duzen === "masonry" ? 0 : 10 }}>
              <UretimKarti u={u} kutuBoyut={kartBoyut >= 4 ? "kucuk" : kartBoyut === 3 ? "orta" : "buyuk"} />
              {/* Çoklu seçim kutusu — kartın kendi araçlarının üstünde, sol-üstte */}
              <button onClick={(e) => { e.stopPropagation(); secimToggle(u.id); }} aria-label="Seç"
                className={cn("absolute left-2.5 top-2.5 z-20 flex h-[22px] w-[22px] items-center justify-center rounded-[6px] border-2 backdrop-blur-sm transition-all",
                  secililer.includes(u.id)
                    ? "border-white bg-white text-zemin opacity-100"
                    : "border-white/80 opacity-0 group-hover/ur:opacity-100")}>
                {secililer.includes(u.id) && <Check className="h-3.5 w-3.5" strokeWidth={3.5} />}
              </button>
              {secililer.includes(u.id) && (
                <span className="pointer-events-none absolute inset-0 z-10 rounded-[14px] ring-2 ring-white" />
              )}
            </div>
          ))}
        </div>
      )}

            {/* ── Toplu seçim çubuğu ── */}
      {hazir && createPortal(
        <AnimatePresence>
          {secililer.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="sinema-kapsam hf-pop fixed bottom-6 left-1/2 z-[140] flex -translate-x-1/2 items-center gap-2 rounded-2xl px-3 py-2.5">
              <span className="h-9 w-9 shrink-0 rounded-lg" style={{ background: scArka(secililer[0], "sinematik") }} />
              <span className="mr-2 whitespace-nowrap text-[15px] text-metin">{secililer.length} seçildi</span>
              {([
                { ad: "İndir", Ik: Download }, { ad: "Tümünü yayınla", Ik: ArrowUpRight }, { ad: "Şuraya kopyala", Ik: FolderInput },
              ] as const).map(({ ad, Ik }) => (
                <button key={ad} className="flex items-center gap-2 rounded-xl px-3 py-2 text-[14px] text-metin transition-colors hover:bg-white/[0.08]">
                  <Ik className="h-4 w-4" /> {ad}
                </button>
              ))}
              <button onClick={() => secililer.forEach(onFavori)} aria-label="Beğen"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-metin transition-colors hover:bg-white/[0.08]"><Heart className="h-4 w-4" /></button>
              <button onClick={() => { secililer.forEach(onSil); setSecililer([]); }} aria-label="Sil"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-metin transition-colors hover:bg-rose-500/15 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
              <button onClick={() => setSecililer([])} aria-label="Kapat"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-metin-2 transition-colors hover:bg-white/[0.08]"><X className="h-4 w-4" /></button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      {/* ── "3D sahne üret?" onayı ── */}
      {hazir && createPortal(
        <AnimatePresence>
          {onay3D && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[180] bg-black/60 backdrop-blur-sm" onClick={() => setOnay3D(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                className="sinema-kapsam hf-pop fixed left-1/2 top-1/2 z-[181] w-[min(640px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-[22px] p-6">
                <div className="flex items-start">
                  <h3 className="flex-1 text-[22px] font-bold text-metin">3D sahne üretilsin mi?</h3>
                  <button onClick={() => setOnay3D(null)} aria-label="Kapat"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-metin"><X className="h-[18px] w-[18px]" /></button>
                </div>
                <p className="mt-2 text-[15px] leading-relaxed text-metin-3">
                  Bu işlem mevcut görselinden bir 3D sahne oluşturur. Üretim bakiyendeki kredileri kullanır.
                </p>
                <div className="mt-5 flex items-center rounded-2xl bg-white/[0.05] px-4 py-4">
                  <span className="flex-1 text-[15px] text-metin-3">Maliyet</span>
                  <span className="text-[15px] font-bold text-metin">3 kredi</span>
                </div>
                <div className="mt-4 flex gap-3">
                  <button onClick={() => setOnay3D(null)}
                    className="h-[52px] flex-1 rounded-2xl bg-white/[0.08] text-[16px] text-metin transition-colors hover:bg-white/[0.13]">Hayır, vazgeç</button>
                  <button onClick={() => setOnay3D(null)}
                    className="h-[52px] flex-1 rounded-2xl bg-white text-[16px] font-semibold text-zemin transition-colors hover:bg-white/90">Evet, üret</button>
                </div>
                <label className="mt-4 flex items-center gap-2.5 text-[14px] text-metin-3">
                  <input type="checkbox" className="h-4 w-4 rounded accent-aksan" /> Bunu bir daha gösterme
                </label>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
