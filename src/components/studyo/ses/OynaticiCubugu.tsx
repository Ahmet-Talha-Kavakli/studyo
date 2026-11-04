"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, Pause, Play, RotateCcw, RotateCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Uretim } from "@/store/useProjeler";
import { SESLER } from "@/lib/sesVeri";
import { sesCalici, useCalici, sureYaz } from "@/lib/sesCalici";
import { uretimKaynagi } from "./SesGoruntuleyici";
import { SesAvatar } from "./ortak";
import { sesBasligi } from "./GecmisSatiri";

const HIZLAR = [0.75, 1, 1.25, 1.5, 2];
const DUGME = "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/[0.085] hover:text-metin";

/** Sonuçlar çekmecesinin altında kalıcı oynatıcı — listeden çalınan sesi gösterir ve yönetir. */
export function OynaticiCubugu({ uretimler, onAc, onIndir, haric }: { uretimler: Uretim[]; onAc: (id: string) => void; onIndir: (u: Uretim) => void; /** Başka yerde (son üretim şeridi) zaten gösterilen öğe. */ haric?: string }) {
  const cal = useCalici();
  const u = cal.id && cal.id !== haric ? uretimler.find((x) => x.id === cal.id) : undefined;
  const dosya = cal.tur === "dosya";
  const oran = cal.toplam ? Math.min(1, cal.an / cal.toplam) : 0;
  const m = u?.meta;
  const renk = SESLER.find((s) => s.ad === m?.ses)?.renk ?? "#8b7bff";
  const baslik = u ? sesBasligi(u) : "";
  /** Klavye: ←/→ 5 sn, Home/End başa/sona. */
  const tus = (e: React.KeyboardEvent) => {
    if (!dosya || !cal.toplam) return;
    const y = e.key === "ArrowRight" || e.key === "ArrowUp" ? cal.an + 5 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? cal.an - 5 : e.key === "Home" ? 0 : e.key === "End" ? cal.toplam - 0.1 : null;
    if (y === null) return;
    e.preventDefault(); sesCalici.konum(Math.max(0, Math.min(cal.toplam - 0.1, y)));
  };
  const oynat = () => {
    if (!u) return;
    if (cal.calisiyor) return sesCalici.duraklat();
    const k = uretimKaynagi(u); if (k) void sesCalici.cal(u.id, k);
  };
  return (
    <AnimatePresence>
      {u && (
        <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0, transition: { duration: 0.15 } }} transition={{ type: "spring", stiffness: 420, damping: 36 }}
          className="border-t border-white/[0.06] bg-[#141517] px-3 py-2.5" role="region" aria-label="Oynatıcı">
          <div className="flex items-center gap-2.5">
            <button onClick={() => onAc(u.id)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left" title="Ayrıntıyı aç">
              <SesAvatar ad={m?.ses ?? u.id} renk={renk} boyut={32} aktif={cal.calisiyor} />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-metin">{baslik}</span>
                <span className="block truncate text-[11.5px] text-metin-3">{m?.ses ?? u.model}</span>
              </span>
            </button>
            {dosya && (
              <button onClick={() => { const i = HIZLAR.indexOf(cal.hiz); sesCalici.hiz(HIZLAR[(i + 1) % HIZLAR.length]); }} aria-label={`Oynatma hızı ${cal.hiz}×`}
                className="h-7 rounded-full px-2 text-[12px] font-semibold tabular-nums text-metin-2 transition-colors hover:bg-white/[0.085] hover:text-metin">{cal.hiz}×</button>
            )}
            {u.sesUrl && <button onClick={() => onIndir(u)} aria-label="İndir" className={DUGME}><Download className="h-4 w-4" /></button>}
            <button onClick={() => sesCalici.durdur()} aria-label="Oynatıcıyı kapat" className={DUGME}><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            {dosya && <button onClick={() => sesCalici.atla(-10)} aria-label="10 saniye geri" className={DUGME}><RotateCcw className="h-4 w-4" /></button>}
            <button onClick={oynat} aria-label={cal.calisiyor ? "Duraklat" : "Oynat"} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#0b0c0e]">
              {cal.calisiyor ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />}
            </button>
            {dosya && <button onClick={() => sesCalici.atla(10)} aria-label="10 saniye ileri" className={DUGME}><RotateCw className="h-4 w-4" /></button>}
            <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-metin-3">{dosya ? sureYaz(cal.an) : ""}</span>
            <div onClick={dosya ? (e) => { const r = e.currentTarget.getBoundingClientRect(); sesCalici.konum(((e.clientX - r.left) / r.width) * cal.toplam); } : undefined}
              onKeyDown={dosya ? tus : undefined} tabIndex={dosya ? 0 : undefined}
              role={dosya ? "slider" : "progressbar"} aria-label="İlerleme" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(oran * 100)}
              aria-valuetext={dosya && cal.toplam ? `${sureYaz(cal.an)} / ${sureYaz(cal.toplam)}` : undefined}
              className={cn("group/ilerleme relative h-1.5 min-w-0 flex-1 rounded-full bg-white/[0.08] outline-none", dosya && "cursor-pointer focus-visible:ring-2 focus-visible:ring-aksan/70")}>
              <span className="absolute inset-y-0 left-0 rounded-full bg-aksan" style={{ width: `${oran * 100}%` }} />
              {dosya && <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 transition-opacity group-hover/ilerleme:opacity-100 group-focus-visible/ilerleme:opacity-100" style={{ left: `${oran * 100}%` }} />}
            </div>
            <span className="w-8 shrink-0 text-[11px] tabular-nums text-metin-3">{dosya ? sureYaz(cal.toplam) : ""}</span>
          </div>
          {!dosya && cal.uyari && <p className="mt-1 text-center text-[11.5px] text-metin-3">{cal.uyari}</p>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
