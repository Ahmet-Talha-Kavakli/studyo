"use client";

/**
 * Kart eylem çubuğu — üretim kartının üstüne gelince çıkan yuvarlak düğmeler:
 * Favori (yıldız) · İndir (menü) · Yeniden kullan (alıntı) · Daha fazla. Her düğmede ipucu var.
 * Kartlar kendi "daha fazla" menüsünü `onDaha` ile bağlar; yoksa düğme çıkmaz.
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, FolderInput, MoreHorizontal, Quote, Star, Trash2 } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import type { Uretim } from "@/store/useProjeler";
import { cn } from "@/lib/utils";
import { IndirDugmesi } from "./IndirMenusu";
import { Katman } from "./Katman";
import { KlasoreTasiListesi } from "./Klasorler";

export type EylemBoyut = "kucuk" | "orta" | "buyuk";
const BTN: Record<EylemBoyut, string> = { kucuk: "h-7 w-7", orta: "h-8 w-8", buyuk: "h-9 w-9" };
const IK: Record<EylemBoyut, string> = { kucuk: "h-3.5 w-3.5", orta: "h-4 w-4", buyuk: "h-[18px] w-[18px]" };

/** Cam yuvarlak eylem düğmesinin sınıfı (kartların kendi raylarıyla aynı görünüm). */
export const eylemDugmesi = (b: EylemBoyut = "orta", ek?: string) =>
  cn("hf-btn glass-ikon pointer-events-auto flex items-center justify-center rounded-full text-white transition-transform active:scale-90", BTN[b], ek);

export function FavoriDugmesi({ favori, onClick, boyut = "orta", side = "left", className }: { favori: boolean; onClick: () => void; boyut?: EylemBoyut; side?: "left" | "right" | "top" | "bottom"; className?: string }) {
  return (
    <Tooltip label={favori ? "Favorilerden çıkar" : "Favorilere ekle"} side={side}>
      <motion.button type="button" whileTap={{ scale: 0.85 }} aria-pressed={favori} aria-label={favori ? "Favorilerden çıkar" : "Favorilere ekle"}
        onClick={(e) => { e.stopPropagation(); onClick(); }} className={cn(eylemDugmesi(boyut), favori && "text-aksan", className)}>
        <motion.span key={String(favori)} initial={{ scale: 0.6, rotate: -25 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 600, damping: 18 }} className="flex">
          <Star className={cn(IK[boyut], favori && "fill-current")} />
        </motion.span>
      </motion.button>
    </Tooltip>
  );
}

export function YenidenKullanDugmesi({ onClick, boyut = "orta", side = "left", etiket = "Yeniden kullan" }: { onClick: () => void; boyut?: EylemBoyut; side?: "left" | "right" | "top" | "bottom"; etiket?: string }) {
  return (
    <Tooltip label={etiket} side={side}>
      <button type="button" aria-label={etiket} onClick={(e) => { e.stopPropagation(); onClick(); }} className={eylemDugmesi(boyut)}>
        <Quote className={IK[boyut]} />
      </button>
    </Tooltip>
  );
}

/** Kalıcı favori rozeti — hover olmadan da görünür (hover'da çubuğun yıldızına yer bırakır). */
export function FavoriRozeti({ boyut = "orta", className }: { boyut?: EylemBoyut; className?: string }) {
  return (
    <span aria-hidden className={cn("pointer-events-none absolute z-20 flex items-center justify-center rounded-full bg-black/45 backdrop-blur-md transition-opacity group-hover:opacity-0", BTN[boyut], className)}>
      <Star className={cn(IK[boyut], "fill-aksan text-aksan")} />
    </span>
  );
}

export function KartEylemleri({ u, onFavori, onYenidenKullan, onDaha, boyut = "orta", yon = "dikey", className, acik, side = "left", ek }: {
  u: Uretim;
  onFavori: () => void;
  onYenidenKullan?: () => void;
  /** Daha fazla menüsünü açar (kartın kendi menüsü). Düğmenin ekrandaki dikdörtgeni verilir. */
  onDaha?: (r: DOMRect) => void;
  boyut?: EylemBoyut;
  yon?: "yatay" | "dikey";
  className?: string;
  /** Menü açıkken çubuk görünür kalsın. */
  acik?: boolean;
  side?: "left" | "right" | "top" | "bottom";
  /** Çubuğun başına eklenecek karta özel düğmeler. */
  ek?: React.ReactNode;
}) {
  return (
    <div onClick={(e) => e.stopPropagation()}
      className={cn("pointer-events-none absolute z-20 flex gap-1.5 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100",
        yon === "yatay" ? "flex-row" : "flex-col", acik && "pointer-events-auto opacity-100", className ?? "right-2 top-2")}>
      {ek}
      <FavoriDugmesi favori={!!u.favori} onClick={onFavori} boyut={boyut} side={side} />
      <IndirDugmesi u={u} className={eylemDugmesi(boyut)} ikonSinif={IK[boyut]} side={side} />
      {onYenidenKullan && <YenidenKullanDugmesi onClick={onYenidenKullan} boyut={boyut} side={side} />}
      {onDaha && (
        <Tooltip label="Daha fazla" side={side}>
          <button type="button" aria-label="Daha fazla" onClick={(e) => { e.stopPropagation(); onDaha(e.currentTarget.getBoundingClientRect()); }} className={eylemDugmesi(boyut)}>
            <MoreHorizontal className={IK[boyut]} />
          </button>
        </Tooltip>
      )}
    </div>
  );
}

/* ── Daha fazla menüsü ── */

export interface DahaEylem { ad: string; ikon: React.ElementType; fn: () => void; tehlike?: boolean }

/**
 * Kartın "Daha fazla" düğmesi ve menüsü: karta özel eylemler + Klasöre taşı (aynı menüde ikinci
 * görünüm) + isteğe bağlı Sil. Telefonda alttan çekmece olur.
 */
export function KartDahaMenusu({ u, eylemler, onSil, boyut = "orta", side = "left", className }: {
  u: Uretim; eylemler: DahaEylem[]; onSil?: () => void; boyut?: EylemBoyut; side?: "left" | "right" | "top" | "bottom"; className?: string;
}) {
  const [acik, setAcik] = useState(false);
  const [gorunum, setGorunum] = useState<"ana" | "klasor">("ana");
  const kapat = () => { setAcik(false); setGorunum("ana"); };
  const satir = "flex w-full items-center gap-3 rounded-[12px] px-2.5 py-2 text-left text-[13.5px] font-medium transition-colors";
  return (
    <span className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
      <Tooltip label="Daha fazla" side={side}>
        <button type="button" aria-label="Daha fazla" aria-haspopup="menu" aria-expanded={acik} onClick={(e) => { e.stopPropagation(); setAcik((v) => !v); }} className={className ?? eylemDugmesi(boyut)}>
          <MoreHorizontal className={IK[boyut]} />
        </button>
      </Tooltip>
      <Katman acik={acik} onKapat={kapat} yerlesim="alt-sag" genislik={260} baslik={gorunum === "klasor" ? "Klasöre taşı" : u.baslik || "Üretim"} etiket="Daha fazla">
        <AnimatePresence mode="wait" initial={false}>
          {gorunum === "ana" ? (
            <motion.div key="ana" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.12 }} className="space-y-0.5 p-0.5">
              {eylemler.map((e) => (
                <button key={e.ad} type="button" onClick={() => { e.fn(); kapat(); }} className={cn(satir, e.tehlike ? "text-tehlike hover:bg-tehlike/10" : "text-metin hover:bg-white/[0.06]")}>
                  <e.ikon className={cn("h-[18px] w-[18px] shrink-0", e.tehlike ? "" : "text-metin-2")} />{e.ad}
                </button>
              ))}
              <button type="button" onClick={() => setGorunum("klasor")} className={cn(satir, "text-metin hover:bg-white/[0.06]")}>
                <FolderInput className="h-[18px] w-[18px] shrink-0 text-metin-2" /><span className="flex-1">Klasöre taşı</span><ChevronRight className="h-4 w-4 text-metin-2" />
              </button>
              {onSil && (
                <>
                  <div className="my-1 h-px bg-white/[0.06]" />
                  <button type="button" onClick={() => { onSil(); kapat(); }} className={cn(satir, "text-tehlike hover:bg-tehlike/10")}><Trash2 className="h-[18px] w-[18px] shrink-0" />Sil</button>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div key="klasor" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.12 }}>
              <button type="button" onClick={() => setGorunum("ana")} className="flex items-center gap-1.5 px-2.5 pb-0.5 pt-1.5 text-[12.5px] font-medium text-metin-2 hover:text-metin"><ChevronLeft className="h-3.5 w-3.5" />Geri</button>
              <KlasoreTasiListesi uretimIdler={[u.id]} onBitti={kapat} />
            </motion.div>
          )}
        </AnimatePresence>
      </Katman>
    </span>
  );
}
