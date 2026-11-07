"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Laptop, Monitor, RectangleHorizontal, RectangleVertical, Smartphone, Tablet } from "lucide-react";
import { cn } from "@/lib/utils";

export type CihazOlcu = { id: string; ad: string; w: number; h: number; tur: "telefon" | "tablet" | "masaustu" };

/** Önizleme cihazları (CSS piksel). İlk telefon ve ilk tablet, Telefon ve Tablet düğmelerinin varsayılanıdır. */
export const CIHAZLAR: CihazOlcu[] = [
  { id: "iphone17", ad: "iPhone 17", w: 402, h: 874, tur: "telefon" },
  { id: "iphone17pm", ad: "iPhone 17 Pro Max", w: 440, h: 956, tur: "telefon" },
  { id: "iphonese", ad: "iPhone SE", w: 375, h: 667, tur: "telefon" },
  { id: "pixel10", ad: "Pixel 10", w: 412, h: 915, tur: "telefon" },
  { id: "galaxys26", ad: "Galaxy S26", w: 384, h: 832, tur: "telefon" },
  { id: "kucuk", ad: "Küçük Android", w: 360, h: 780, tur: "telefon" },
  { id: "ipadmini", ad: "iPad mini", w: 744, h: 1133, tur: "tablet" },
  { id: "ipadair", ad: "iPad Air 11", w: 820, h: 1180, tur: "tablet" },
  { id: "ipadpro", ad: "iPad Pro 13", w: 1032, h: 1376, tur: "tablet" },
  { id: "dizustu", ad: "Dizüstü", w: 1280, h: 800, tur: "masaustu" },
  { id: "masaustu", ad: "Masaüstü", w: 1440, h: 900, tur: "masaustu" },
  { id: "genis", ad: "Geniş ekran", w: 1920, h: 1080, tur: "masaustu" },
];
const IKON = { telefon: Smartphone, tablet: Tablet, masaustu: Laptop } as const;
const GRUP = { telefon: "Telefonlar", tablet: "Tabletler", masaustu: "Bilgisayar" } as const;

/** Cihaz seçici: hazır cihazlar, Özel boyut, yatay ve dikey yön. */
export function CihazMenusu({ secili, sec, yatay, setYatay }: { secili: CihazOlcu | null; sec: (c: CihazOlcu | null) => void; yatay: boolean; setYatay: (v: boolean) => void }) {
  const [acik, setAcik] = useState(false);
  const [ow, setOw] = useState("390"), [oh, setOh] = useState("844");
  const ozelUygula = () => { const w = Math.min(3840, Math.max(240, Number(ow) || 0)), h = Math.min(2400, Math.max(320, Number(oh) || 0)); sec({ id: "ozel", ad: "Özel", w, h, tur: w < 600 ? "telefon" : w < 1100 ? "tablet" : "masaustu" }); setAcik(false); };
  return (
    <div className="relative shrink-0 max-md:hidden">
      <div className="flex items-center">
        <button type="button" onClick={() => setAcik((x) => !x)} title="Cihaz seç" aria-label="Cihaz seç" aria-expanded={acik} className={cn("flex h-8 items-center gap-1 rounded-full px-2 text-[12px] transition-colors", acik ? "bg-white/[0.1] text-white" : "text-white/60 hover:bg-white/[0.07] hover:text-white")}>
          <span className="max-w-[92px] truncate max-xl:hidden">{secili?.ad ?? "Tam genişlik"}</span><ChevronDown className="h-3.5 w-3.5" />
        </button>
        {secili && (
          <button type="button" title={yatay ? "Dikey çevir" : "Yatay çevir"} aria-label={yatay ? "Dikey çevir" : "Yatay çevir"} aria-pressed={yatay} onClick={() => setYatay(!yatay)} className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white">
            {yatay ? <RectangleHorizontal className="h-4 w-4" /> : <RectangleVertical className="h-4 w-4" />}
          </button>
        )}
      </div>
      <AnimatePresence>
        {acik && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setAcik(false)} />
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute left-0 top-[calc(100%+6px)] z-40 max-h-[70vh] w-[260px] overflow-y-auto rounded-[16px] bg-[#17181b] p-1.5 ring-1 ring-inset ring-white/[0.1] [scrollbar-width:thin]">
              <button type="button" onClick={() => { sec(null); setAcik(false); }} className={cn("flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] hover:bg-white/[0.06]", !secili ? "text-white ring-1 ring-inset ring-white" : "text-white/75")}>
                <Monitor className="h-4 w-4 text-white/50" />Tam genişlik<span className="ml-auto text-[11.5px] text-white/35">alana sığar</span>
              </button>
              {(["telefon", "tablet", "masaustu"] as const).map((t) => (
                <div key={t} className="mt-1">
                  <p className="px-2.5 pb-1 pt-1.5 text-[11.5px] text-white/40">{GRUP[t]}</p>
                  {CIHAZLAR.filter((c) => c.tur === t).map((c) => {
                    const I = IKON[t];
                    return (
                      <button key={c.id} type="button" onClick={() => { sec(c); setAcik(false); }} className={cn("flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] hover:bg-white/[0.06]", secili?.id === c.id ? "text-white ring-1 ring-inset ring-white" : "text-white/75")}>
                        <I className="h-4 w-4 text-white/50" />{c.ad}<span className="ml-auto text-[11.5px] tabular-nums text-white/35">{c.w} x {c.h}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
              <div className="mt-1 border-t border-white/[0.06] px-2.5 pb-1.5 pt-2.5">
                <p className="mb-1.5 text-[11.5px] text-white/40">Özel</p>
                <div className="flex items-center gap-1.5">
                  <input value={ow} onChange={(e) => setOw(e.target.value.replace(/\D/g, "").slice(0, 4))} aria-label="Özel genişlik" className="h-8 w-16 rounded-[9px] bg-white/[0.05] px-2 text-[12px] tabular-nums text-white outline-none ring-1 ring-inset ring-white/[0.08] focus:ring-white/30" />
                  <span className="text-[12px] text-white/40">x</span>
                  <input value={oh} onChange={(e) => setOh(e.target.value.replace(/\D/g, "").slice(0, 4))} onKeyDown={(e) => e.key === "Enter" && ozelUygula()} aria-label="Özel yükseklik" className="h-8 w-16 rounded-[9px] bg-white/[0.05] px-2 text-[12px] tabular-nums text-white outline-none ring-1 ring-inset ring-white/[0.08] focus:ring-white/30" />
                  <button type="button" onClick={ozelUygula} className="ml-auto h-8 rounded-full bg-white px-3 text-[12px] font-semibold text-black">Uygula</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
