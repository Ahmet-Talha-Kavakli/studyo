"use client";

/**
 * Görünüm ayarları — sonuç ve galeri araç çubuğundaki ayar düğmesi + popover.
 * Yerleşim (özgün · yatay · dikey), boyut (küçük · orta · büyük · özel sütun), sıralama
 * (en yeni · en eski) ve "Gönderdikten sonra istemi temizle". Seçim hemen uygulanır ve
 * sayfa başına kalıcıdır (useGorunum).
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarArrowDown, CalendarArrowUp, Eraser, LayoutDashboard, Minus, Plus, RectangleHorizontal, RectangleVertical, Settings2 } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";
import { useGorunum } from "./useGorunum";
import { Anahtar, Bolum, KayanSegment, Katman } from "./Katman";
import { VARSAYILAN_GORUNUM, type GaleriSiralama, type Gorunum, type KartBoyut, type Yerlesim } from "@/lib/galeri/gorunum";

export function GorunumAyari({ sayfa, istemVar = true, siralamaVar = true, yerlesimVar = true, boyutVar = true, className, dugmeSinif, taban }: {
  /** Kayıt anahtarı (ör. "gorsel", "video", "kitaplik"). */
  sayfa: string;
  /** Sayfada komut kutusu varsa "istemi temizle" anahtarı görünür. */
  istemVar?: boolean;
  siralamaVar?: boolean;
  yerlesimVar?: boolean;
  /** Liste düzeninde (satırlar) boyut seçeneği gizlenir. */
  boyutVar?: boolean;
  className?: string;
  /** Düğmenin görünümü sayfanın araç çubuğuna uysun diye ezilebilir. */
  dugmeSinif?: string;
  taban?: Partial<Gorunum>;
}) {
  const [g, ayarla] = useGorunum(sayfa, taban);
  const [acik, setAcik] = useState(false);
  const ilk = { ...VARSAYILAN_GORUNUM, ...(taban ?? {}) };
  const degisti = (yerlesimVar && g.yerlesim !== ilk.yerlesim) || (boyutVar && (g.boyut !== ilk.boyut || (g.boyut === "ozel" && g.sutun !== ilk.sutun))) || (siralamaVar && g.siralama !== ilk.siralama) || (istemVar && g.istemTemizle !== ilk.istemTemizle);
  return (
    <div className={cn("relative shrink-0", className)}>
      <Tooltip label="Görünüm ayarları" side="bottom">
        <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={() => setAcik((v) => !v)} aria-expanded={acik} aria-haspopup="dialog" aria-label="Görünüm ayarları"
          className={cn("relative flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-inset transition-colors",
            acik ? "bg-white text-[#0d0e10] ring-white" : "bg-white/[0.06] text-metin ring-white/[0.08] hover:bg-white/[0.1]", dugmeSinif)}>
          <Settings2 className="h-4 w-4" />
          <AnimatePresence>
            {degisti && !acik && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute right-1 top-1 h-2 w-2 rounded-full bg-aksan ring-2 ring-zemin" />}
          </AnimatePresence>
        </motion.button>
      </Tooltip>
      <Katman acik={acik} onKapat={() => setAcik(false)} yerlesim="alt-sag" genislik={316} baslik="Görünüm" etiket="Görünüm ayarları">
        <GorunumIcerik sayfa={sayfa} g={g} ayarla={ayarla} istemVar={istemVar} siralamaVar={siralamaVar} yerlesimVar={yerlesimVar} boyutVar={boyutVar} />
      </Katman>
    </div>
  );
}

const YERLESIMLER: { id: Yerlesim; ad: string; ikon: React.ElementType }[] = [
  { id: "ozgun", ad: "Özgün", ikon: LayoutDashboard },
  { id: "yatay", ad: "Yatay", ikon: RectangleHorizontal },
  { id: "dikey", ad: "Dikey", ikon: RectangleVertical },
];
const BOYUTLAR: { id: KartBoyut; ad: string }[] = [
  { id: "kucuk", ad: "Küçük" }, { id: "orta", ad: "Orta" }, { id: "buyuk", ad: "Büyük" }, { id: "ozel", ad: "Özel" },
];
const SIRALAR: { id: GaleriSiralama; ad: string; ikon: React.ElementType }[] = [
  { id: "yeni", ad: "En yeni", ikon: CalendarArrowDown },
  { id: "eski", ad: "En eski", ikon: CalendarArrowUp },
];

export function GorunumIcerik({ sayfa, g, ayarla, istemVar, siralamaVar, yerlesimVar, boyutVar = true }: {
  sayfa: string; g: Gorunum; ayarla: (p: Partial<Gorunum>) => void; istemVar: boolean; siralamaVar: boolean; yerlesimVar: boolean; boyutVar?: boolean;
}) {
  return (
    <div className="divide-y divide-white/[0.06]">
      {yerlesimVar && (
        <Bolum baslik="Yerleşim">
          <KayanSegment grup={`${sayfa}-yerlesim`} etiket="Yerleşim" dikey deger={g.yerlesim} onDegis={(v) => ayarla({ yerlesim: v })} secenekler={YERLESIMLER} />
        </Bolum>
      )}
      {boyutVar && <Bolum baslik="Boyut">
        <KayanSegment grup={`${sayfa}-boyut`} etiket="Boyut" deger={g.boyut} onDegis={(v) => ayarla({ boyut: v })} secenekler={BOYUTLAR} />
        <AnimatePresence initial={false}>
          {g.boyut === "ozel" && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-2 flex items-center gap-2 rounded-[12px] bg-white/[0.035] px-2 py-1.5 ring-1 ring-inset ring-white/[0.06]">
                <span className="flex-1 pl-1 text-[13px] text-metin-2">Sütun sayısı</span>
                <motion.button type="button" whileTap={{ scale: 0.9 }} disabled={g.sutun <= 2} onClick={() => ayarla({ sutun: g.sutun - 1 })} aria-label="Sütun azalt"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.07] text-metin disabled:opacity-35"><Minus className="h-3.5 w-3.5" /></motion.button>
                <motion.span key={g.sutun} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-6 text-center text-[14px] font-semibold tabular-nums text-metin">{g.sutun}</motion.span>
                <motion.button type="button" whileTap={{ scale: 0.9 }} disabled={g.sutun >= 8} onClick={() => ayarla({ sutun: g.sutun + 1 })} aria-label="Sütun artır"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.07] text-metin disabled:opacity-35"><Plus className="h-3.5 w-3.5" /></motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Bolum>}
      {siralamaVar && (
        <Bolum baslik="Sıralama">
          <KayanSegment grup={`${sayfa}-sira`} etiket="Sıralama" deger={g.siralama} onDegis={(v) => ayarla({ siralama: v })} secenekler={SIRALAR} />
        </Bolum>
      )}
      {istemVar && (
        <div className="px-2 py-2">
          <div className="flex items-center gap-3 rounded-[12px] px-1 py-1">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-metin-2"><Eraser className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-[13.5px] text-metin">Gönderdikten sonra istemi temizle</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={String(g.istemTemizle)} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }}
                  className={cn("block text-[12px]", g.istemTemizle ? "text-aksan" : "text-metin-3")}>{g.istemTemizle ? "Açık" : "Kapalı"}</motion.span>
              </AnimatePresence>
            </span>
            <Anahtar acik={g.istemTemizle} onDegis={(v) => ayarla({ istemTemizle: v })} etiket="Gönderdikten sonra istemi temizle" />
          </div>
        </div>
      )}
    </div>
  );
}
