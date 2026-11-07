"use client";

/**
 * Süzgeç çubuğu — kitaplık ve galeriler için: Favoriler onay kutusu · Yeni klasör oluştur ·
 * Klasörler · Türe göre · Tarih aralığı · Sıralama (En yeni / En eski / Özel). Sağ uca sayfa kendi
 * düğmelerini (görünüm ayarı) koyar. Mobilde yatay kayar, taşmaz.
 */

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownAZ, CalendarArrowDown, CalendarArrowUp, ChevronDown, Coins, Cpu, LayoutGrid, Shapes, SlidersHorizontal, Star } from "lucide-react";
import type { Uretim } from "@/store/useProjeler";
import { useKoleksiyon } from "@/store/useKoleksiyon";
import { TURLER, uretimTuru, type Tur } from "@/components/kitaplik/yardimci";
import { cn } from "@/lib/utils";
import { Katman } from "./Katman";
import { KlasorMenusu, YeniKlasorDugmesi } from "./Klasorler";
import { TarihAraligi, aralikta, type Aralik } from "./TarihAraligi";

export type SiraSecimi = "yeni" | "eski" | "ozel";
export type OzelSira = "ad" | "kredi" | "tur" | "model";

export interface SuzgecDurumu {
  favori: boolean;
  klasor: string | null;
  tur: Tur | null;
  tarih: Aralik;
  siralama: SiraSecimi;
  ozel: OzelSira;
}
export const BOS_SUZGEC_DURUMU: SuzgecDurumu = { favori: false, klasor: null, tur: null, tarih: {}, siralama: "yeni", ozel: "ad" };

export function useSuzgec(ilk: Partial<SuzgecDurumu> = {}) {
  const [d, setD] = useState<SuzgecDurumu>({ ...BOS_SUZGEC_DURUMU, ...ilk });
  const ayarla = useCallback((p: Partial<SuzgecDurumu>) => setD((x) => ({ ...x, ...p })), []);
  return [d, ayarla] as const;
}

export const suzgecEtkin = (d: SuzgecDurumu) => d.favori || !!d.klasor || !!d.tur || !!d.tarih.bas;

/** Süz ve sırala (kopya döner). turAl verilmezse kitaplık türleri kullanılır. */
export function suzgecUygula<T extends Uretim>(liste: T[], d: SuzgecDurumu, klasorIdleri?: Set<string> | null, turAl: (u: T) => string = uretimTuru): T[] {
  const l = liste.filter((u) => (!d.favori || u.favori) && (!d.tur || turAl(u) === d.tur) && (!d.tarih.bas || aralikta(u.olusturma, d.tarih)) && (!klasorIdleri || klasorIdleri.has(u.id)));
  const ozel = (a: T, b: T) =>
    d.ozel === "ad" ? (a.baslik || a.prompt).localeCompare(b.baslik || b.prompt, undefined, { sensitivity: "base" })
    : d.ozel === "kredi" ? (b.kredi ?? 0) - (a.kredi ?? 0)
    : d.ozel === "tur" ? turAl(a).localeCompare(turAl(b)) || b.olusturma - a.olusturma
    : a.model.localeCompare(b.model) || b.olusturma - a.olusturma;
  return l.sort((a, b) => (d.siralama === "eski" ? a.olusturma - b.olusturma : d.siralama === "ozel" ? ozel(a, b) : b.olusturma - a.olusturma));
}

/** Seçili klasörün üretim kimlikleri (klasör yoksa null). */
export function useKlasorIdleri(klasor: string | null): Set<string> | null {
  const koleksiyonlar = useKoleksiyon((s) => s.koleksiyonlar);
  return useMemo(() => {
    if (!klasor) return null;
    return new Set(koleksiyonlar.find((k) => k.id === klasor)?.uretimIdler ?? []);
  }, [klasor, koleksiyonlar]);
}

const OZEL: { id: OzelSira; ad: string; ikon: React.ElementType }[] = [
  { id: "ad", ad: "İsme göre", ikon: ArrowDownAZ },
  { id: "kredi", ad: "Krediye göre", ikon: Coins },
  { id: "tur", ad: "Türe göre", ikon: Shapes },
  { id: "model", ad: "Modele göre", ikon: Cpu },
];

const cubukDugme = (aktif: boolean) => cn("flex h-9 shrink-0 items-center gap-2 rounded-full px-3 text-[13px] font-medium ring-1 ring-inset transition-colors",
  aktif ? "bg-white text-[#0d0e10] ring-white" : "bg-white/[0.06] text-metin ring-white/[0.08] hover:bg-white/[0.1]");

export function SuzgecCubugu({ d, ayarla, sayilar, turler, klasorVar = true, sag, sol, className, sonucSayisi, seciliIdler }: {
  d: SuzgecDurumu; ayarla: (p: Partial<SuzgecDurumu>) => void;
  /** Tür başına üretim sayısı (menüde gösterilir). */
  sayilar?: Partial<Record<string, number>>;
  /** Gösterilecek türler (varsayılan: bütün türler). */
  turler?: Tur[];
  klasorVar?: boolean;
  sag?: React.ReactNode; sol?: React.ReactNode; className?: string;
  sonucSayisi?: number;
  /** Seçili üretimler varsa "Yeni klasör oluştur" onları içine taşır. */
  seciliIdler?: string[];
}) {
  return (
    <div className={cn("gizli-scroll flex min-w-0 items-center gap-2 overflow-x-auto", className)}>
      {sol}
      <FavoriKutusu acik={d.favori} onDegis={(v) => ayarla({ favori: v })} />
      {klasorVar && <YeniKlasorDugmesi uretimIdler={seciliIdler} onOlustu={(id) => { if (seciliIdler?.length) ayarla({ klasor: id }); }} />}
      {klasorVar && <KlasorMenusu secili={d.klasor} onSec={(id) => ayarla({ klasor: id })} />}
      <TurMenusu deger={d.tur} onDegis={(t) => ayarla({ tur: t })} sayilar={sayilar} turler={turler} />
      <TarihAraligi deger={d.tarih} onDegis={(t) => ayarla({ tarih: t })} />
      <SiralamaMenusu deger={d.siralama} ozel={d.ozel} onDegis={(s, o) => ayarla({ siralama: s, ...(o ? { ozel: o } : {}) })} />
      <AnimatePresence>
        {suzgecEtkin(d) && (
          <motion.button type="button" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => ayarla({ favori: false, klasor: null, tur: null, tarih: {} })}
            className="h-9 shrink-0 rounded-full px-3 text-[13px] font-medium text-metin-2 transition-colors hover:text-metin">Süzgeçleri temizle</motion.button>
        )}
      </AnimatePresence>
      {(sonucSayisi !== undefined || sag) && <span className="flex-1" />}
      {sonucSayisi !== undefined && suzgecEtkin(d) && <span className="shrink-0 text-[12.5px] tabular-nums text-metin-2">{sonucSayisi} sonuç</span>}
      {sag}
    </div>
  );
}

export function FavoriKutusu({ acik, onDegis }: { acik: boolean; onDegis: (v: boolean) => void }) {
  return (
    <motion.button type="button" role="checkbox" aria-checked={acik} whileTap={{ scale: 0.96 }} onClick={() => onDegis(!acik)}
      className={cn("flex h-9 shrink-0 items-center gap-2 rounded-full pl-2.5 pr-3 text-[13px] font-medium ring-1 ring-inset transition-colors", acik ? "bg-white/[0.1] text-metin ring-white/45" : "bg-white/[0.06] text-metin ring-white/[0.08] hover:bg-white/[0.1]")}>
      <span className={cn("flex h-[18px] w-[18px] items-center justify-center rounded-[5px] ring-1 ring-inset transition-colors", acik ? "bg-white ring-white" : "ring-white/45")}>
        <AnimatePresence>{acik && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Star className="h-3 w-3 fill-[#0d0e10] text-[#0d0e10]" /></motion.span>}</AnimatePresence>
      </span>
      Favoriler
    </motion.button>
  );
}

export function TurMenusu({ deger, onDegis, sayilar, turler }: { deger: Tur | null; onDegis: (t: Tur | null) => void; sayilar?: Partial<Record<string, number>>; turler?: Tur[] }) {
  const [acik, setAcik] = useState(false);
  const liste = TURLER.filter((t) => !turler || turler.includes(t.id));
  const aktif = liste.find((t) => t.id === deger);
  const I = aktif?.ikon ?? LayoutGrid;
  const toplam = sayilar ? Object.values(sayilar).reduce<number>((a, b) => a + (b ?? 0), 0) : undefined;
  return (
    <div className="relative shrink-0">
      <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={() => setAcik((v) => !v)} aria-expanded={acik} className={cubukDugme(!!aktif)}>
        <I className="h-4 w-4" /><span>{aktif ? aktif.cogul : "Türe göre"}</span><ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform", acik && "rotate-180")} />
      </motion.button>
      <Katman acik={acik} onKapat={() => setAcik(false)} yerlesim="alt-sol" genislik={260} baslik="Türe göre" etiket="Türe göre süz">
        <div className="space-y-0.5 p-1">
          {[{ id: null as Tur | null, ad: "Bütün türler", ikon: LayoutGrid, n: toplam }, ...liste.map((t) => ({ id: t.id as Tur | null, ad: t.cogul, ikon: t.ikon, n: sayilar?.[t.id] }))].map((t) => {
            const s = deger === t.id;
            const Ik = t.ikon;
            return (
              <button key={t.id ?? "tum"} type="button" onClick={() => { onDegis(t.id); setAcik(false); }} aria-pressed={s} disabled={t.id !== null && t.n === 0}
                className={cn("flex w-full items-center gap-2.5 rounded-[12px] px-2 py-1.5 text-left text-[13.5px] transition-colors disabled:opacity-40", s ? "bg-white/[0.08] text-metin ring-1 ring-inset ring-white/40" : "text-metin hover:bg-white/[0.06]")}>
                <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-white/[0.07]"><Ik className="h-4 w-4" /></span>
                <span className="flex-1">{t.ad}</span>
                {t.n !== undefined && <span className="text-[12px] tabular-nums text-metin-2">{t.n}</span>}
              </button>
            );
          })}
        </div>
      </Katman>
    </div>
  );
}

export function SiralamaMenusu({ deger, ozel, onDegis }: { deger: SiraSecimi; ozel: OzelSira; onDegis: (s: SiraSecimi, o?: OzelSira) => void }) {
  const [acik, setAcik] = useState(false);
  const ozelAd = OZEL.find((o) => o.id === ozel)!;
  const yazi = deger === "eski" ? "En eski" : deger === "ozel" ? ozelAd.ad : "En yeni";
  const I = deger === "eski" ? CalendarArrowUp : deger === "ozel" ? ozelAd.ikon : CalendarArrowDown;
  const satir = (s: boolean) => cn("flex w-full items-center gap-2.5 rounded-[12px] px-2 py-1.5 text-left text-[13.5px] transition-colors", s ? "bg-white/[0.08] text-metin ring-1 ring-inset ring-white/40" : "text-metin hover:bg-white/[0.06]");
  return (
    <div className="relative shrink-0">
      <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={() => setAcik((v) => !v)} aria-expanded={acik} className={cubukDugme(false)}>
        <I className="h-4 w-4" /><span>{yazi}</span><ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform", acik && "rotate-180")} />
      </motion.button>
      <Katman acik={acik} onKapat={() => setAcik(false)} yerlesim="alt-sag" genislik={250} baslik="Sıralama" etiket="Sıralama">
        <div className="space-y-0.5 p-1">
          {([["yeni", "En yeni", CalendarArrowDown], ["eski", "En eski", CalendarArrowUp]] as const).map(([id, ad, Ik]) => (
            <button key={id} type="button" onClick={() => { onDegis(id); setAcik(false); }} aria-pressed={deger === id} className={satir(deger === id)}>
              <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-white/[0.07]"><Ik className="h-4 w-4" /></span><span className="flex-1">{ad}</span>
            </button>
          ))}
          <div className="mt-1 border-t border-white/[0.06] pt-1">
            <p className="flex items-center gap-1.5 px-2 pb-1 pt-1 text-[12px] font-medium text-metin-2"><SlidersHorizontal className="h-3.5 w-3.5" />Özel</p>
            {OZEL.map((o) => {
              const s = deger === "ozel" && ozel === o.id;
              return (
                <button key={o.id} type="button" onClick={() => { onDegis("ozel", o.id); setAcik(false); }} aria-pressed={s} className={satir(s)}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-white/[0.07]"><o.ikon className="h-4 w-4" /></span><span className="flex-1">{o.ad}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Katman>
    </div>
  );
}

