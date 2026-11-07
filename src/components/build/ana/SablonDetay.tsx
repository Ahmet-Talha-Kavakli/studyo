"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Gamepad2, GitFork, Globe, Heart, Info, LayoutDashboard, Loader2, Smartphone, Sparkles, Trash2, UserRound, X } from "lucide-react";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { CihazSecici, OnizlemeCercevesi, sayiYaz, type Cihaz } from "@/components/build/paylasim/ortak";
import { gorece } from "@/lib/build/istemci";
import { yazarAdi } from "@/lib/build/paylasimOrtak";
import type { SablonOzet } from "@/lib/build/sablonlar/ozet";
import { kategoriAdi, type ToplulukOzet } from "@/lib/build/toplulukOrtak";
import type { ProjeTur } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";

const TUR_IKON: Record<ProjeTur, typeof Globe> = { site: Globe, uygulama: LayoutDashboard, oyun: Gamepad2, mobil: Smartphone };
export type DetayOgesi = { kaynak: "vayra"; s: SablonOzet } | { kaynak: "topluluk"; o: ToplulukOzet };

/**
 * Şablon ayrıntısı (sağdan açılan geniş panel): solda canlı önizleme (masaüstü ve telefon), sağda açıklama, yazar,
 * remix ve beğeni sayısı, etiketler ve ana eylem (Vayra şablonunda "Kullan", topluluk şablonunda "Remix").
 */
export function SablonDetay({ oge, kapat, kullan, gidiyor, begen, kaldir }: {
  oge: DetayOgesi; kapat: () => void; kullan: () => void; gidiyor: boolean; begen?: () => void; kaldir?: () => Promise<void>;
}) {
  const tur = oge.kaynak === "vayra" ? oge.s.tur : oge.o.kategori;
  const [cihaz, setCihaz] = useState<Cihaz>(tur === "mobil" ? "telefon" : "masaustu");
  const [hazir, setHazir] = useState(false);
  const [kaldirOnay, setKaldirOnay] = useState(false);
  const [kaldiriliyor, setKaldiriliyor] = useState(false);
  useEffect(() => setHazir(true), []);
  useEffect(() => {
    const t = (e: KeyboardEvent) => { if (e.key === "Escape") kapat(); };
    addEventListener("keydown", t);
    const eski = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { removeEventListener("keydown", t); document.body.style.overflow = eski; };
  }, [kapat]);
  if (!hazir) return null;
  const I = TUR_IKON[tur];
  const ad = oge.kaynak === "vayra" ? oge.s.ad : oge.o.baslik;
  const aciklama = oge.kaynak === "vayra" ? oge.s.aciklama : oge.o.aciklama;
  const src = oge.kaynak === "vayra" ? `/api/build/sablon/${oge.s.id}` : `/api/build/topluluk/${oge.o.id}/onizleme`;
  const t = oge.kaynak === "topluluk" ? oge.o : null;
  const Eylem = ({ tam }: { tam?: boolean }) => (
    <button type="button" onClick={kullan} disabled={gidiyor} className={cn("inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black transition active:scale-[0.97] disabled:opacity-60", tam && "w-full")}>
      {gidiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : t ? <GitFork className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}{t ? "Remix" : "Kullan"}
    </button>
  );

  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] flex justify-end bg-black/50 sm:p-3" onMouseDown={(e) => { if (e.target === e.currentTarget) kapat(); }}>
      <motion.div role="dialog" aria-modal="true" aria-label={`${ad} ayrıntısı`} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="flex h-full w-full max-w-[1320px] flex-col overflow-hidden bg-[#141416] ring-1 ring-white/[0.1] sm:rounded-[24px]">
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.08] text-white"><I className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1"><p className="truncate text-[16px] font-semibold text-white">{ad}</p><p className="truncate text-[12.5px] text-white/50">{t ? `${yazarAdi(t.yazar)} · topluluk şablonu` : "Vayra şablonu"} · {kategoriAdi(tur)}</p></div>
          <span className="max-sm:hidden"><CihazSecici id="sablon-detay-cihaz" deger={cihaz} set={setCihaz} /></span>
          <span className="max-lg:hidden"><Eylem /></span>
          <button type="button" onClick={kapat} aria-label="Kapat" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white/70 hover:bg-white/[0.14] hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex min-h-0 flex-1 max-lg:flex-col max-lg:overflow-y-auto">
          <div className="min-h-0 flex-1 max-lg:h-[58vh] max-lg:flex-none">
            <OnizlemeCercevesi src={src} baslik={ad} cihaz={cihaz} />
          </div>
          <aside className="flex shrink-0 flex-col border-white/[0.06] lg:w-[340px] lg:overflow-y-auto lg:border-l [scrollbar-width:thin]">
            <div className="space-y-4 p-4 sm:p-5">
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-white/[0.08] px-2.5 text-[12px] font-medium text-white"><I className="h-3.5 w-3.5" />{kategoriAdi(tur)}</span>
                {t?.etiketler.map((e) => <span key={e} className="inline-flex h-7 items-center rounded-full bg-white/[0.04] px-2.5 text-[12px] text-white/65 ring-1 ring-inset ring-white/[0.07]">{e}</span>)}
              </div>
              <p className="text-[13.5px] leading-relaxed text-white/75">{aciklama}</p>
              <div className="flex items-center gap-3 rounded-[16px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
                {t ? <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white/70"><UserRound className="h-4 w-4" /></span>
                  : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06]"><VayraIsaret size={15} /></span>}
                <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-white">{t ? yazarAdi(t.yazar) : "Vayra"}</span><span className="block text-[12px] text-white/45">{t ? `${gorece(t.olusturma)} eklendi${t.guncelleme - t.olusturma > 60_000 ? `, ${gorece(t.guncelleme)} güncellendi` : ""}` : "Vayra ekibinin çalışan şablonu"}</span></span>
              </div>
              {t ? (
                <dl className="grid grid-cols-3 divide-x divide-white/[0.06] rounded-[16px] bg-white/[0.03] py-3 text-center ring-1 ring-inset ring-white/[0.06]">
                  {([["Remix", sayiYaz(t.remix)], ["Beğeni", sayiYaz(t.begeni)], ["Dosya", sayiYaz(t.dosyaSayisi)]] as const).map(([a, d]) => (
                    <div key={a}><dt className="text-[11.5px] text-white/45">{a}</dt><dd className="mt-0.5 text-[17px] font-semibold tabular-nums text-white">{d}</dd></div>
                  ))}
                </dl>
              ) : (
                <dl className="divide-y divide-white/[0.06] rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.06]">
                  {([["Tür", kategoriAdi(tur)], ["Ücret", "Kredi harcamaz"], ["Yapay zekâ", "Açılması için gerekmez"]] as const).map(([a, d]) => (
                    <div key={a} className="flex items-center justify-between gap-3 px-3.5 py-2.5"><dt className="text-[12.5px] text-white/50">{a}</dt><dd className="text-[12.5px] font-medium text-white">{d}</dd></div>
                  ))}
                </dl>
              )}
              {t?.sunucuGerekli && <p className="flex items-start gap-2 rounded-[14px] bg-amber-300/[0.06] px-3 py-2.5 text-[12px] leading-relaxed text-amber-100/80 ring-1 ring-inset ring-amber-300/15"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Veritabanı ya da sunucu fonksiyonu kullanan bölümler önizlemede kapalı; remix edince kendi projende çalışır.</p>}
              <div className="space-y-2">
                <Eylem tam />
                {t && !t.benim && begen && (
                  <button type="button" onClick={begen} aria-pressed={t.begendim} className={cn("inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full text-[13px] font-medium transition-colors", t.begendim ? "bg-rose-400/[0.12] text-rose-200 ring-1 ring-inset ring-rose-300/30" : "bg-white/[0.08] text-white hover:bg-white/[0.13]")}>
                    <motion.span key={String(t.begendim)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}><Heart className={cn("h-4 w-4", t.begendim && "fill-rose-300 text-rose-300")} /></motion.span>
                    {t.begendim ? "Beğendin" : "Beğen"}
                  </button>
                )}
                {t?.benim && kaldir && (
                  <AnimatePresence mode="wait" initial={false}>
                    {kaldirOnay ? (
                      <motion.div key="o" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2">
                        <button type="button" disabled={kaldiriliyor} onClick={async () => { setKaldiriliyor(true); try { await kaldir(); } finally { setKaldiriliyor(false); } }} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-rose-500 text-[13px] font-semibold text-white">{kaldiriliyor && <Loader2 className="h-4 w-4 animate-spin" />}Kaldır</button>
                        <button type="button" onClick={() => setKaldirOnay(false)} className="h-10 flex-1 rounded-full bg-white/[0.08] text-[13px] text-white">Vazgeç</button>
                      </motion.div>
                    ) : (
                      <motion.button key="k" type="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setKaldirOnay(true)} className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full text-[13px] text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" />Topluluktan kaldır</motion.button>
                    )}
                  </AnimatePresence>
                )}
              </div>
              <p className="text-[12px] leading-relaxed text-white/40">{t ? "Remix, şablonun dosyalarını yeni bir projeye kopyalar; ilk sürümde kaynağı anılır. Asıl şablon etkilenmez." : "Kullan, şablonun dosyalarını yeni bir projeye kopyalar; sohbetle kendine uyarlarsın."}</p>
            </div>
          </aside>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
