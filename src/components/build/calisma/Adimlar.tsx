"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, CircleCheck, CircleDashed, X } from "lucide-react";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";

/**
 * Sonraki adımlar: projenin yaşam döngüsünde atılmamış adımlar (Hostinger/Lovable "önerilen adımlar"). Tamamlananlar
 * işaretlenir, tıklayınca ilgili yere götürür. Hepsi bitince ya da kapatılınca görünmez (proje başına hatırlanır).
 */
export function SonrakiAdimlar({ p, formGonderimi, git }: {
  p: Proje; formGonderimi: number;
  git: (hedef: "onizleme" | "yayin" | "alan" | "veriler" | "secim") => void;
}) {
  const anahtar = `vayra-build-adimlar-${p.id}`;
  const [gizli, setGizli] = useState(true);
  const [acik, setAcik] = useState(false);
  useEffect(() => { try { setGizli(localStorage.getItem(anahtar) === "1"); } catch { setGizli(false); } }, [anahtar]);
  const formVar = Object.values(p.dosyalar).some((d) => d.includes("data-vayra-form"));
  const adimlar = [
    { ad: "İlk sürümü oluştur", alt: "Ne yapmak istediğini yaz", bitti: p.surumler.length > 0, hedef: null },
    { ad: "Bir öğeye tıkla, kendin düzenle", alt: "Önizlemede Seç aracı, kredi harcamaz", bitti: p.surumler.some((s) => s.kaynak === "stil"), hedef: "secim" as const },
    ...(formVar ? [{ ad: "Formu doldurup dene", alt: "Gönderim Bulut sekmesindeki gelen kutusuna düşer", bitti: formGonderimi > 0, hedef: "veriler" as const }] : []),
    { ad: "Yayınla", alt: "Herkesin açabileceği adrese koy", bitti: !!p.yayin, hedef: "yayin" as const },
    { ad: "Kendi alan adını bağla", alt: "siten.com gibi", bitti: p.alanAdlari.length > 0, hedef: "alan" as const },
  ];
  const biten = adimlar.filter((a) => a.bitti).length;
  if (gizli || biten === adimlar.length || !p.surumler.length) return null;
  return (
    <div className="mb-2 overflow-hidden rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
      <div className="flex items-center gap-2.5 px-3 py-2">
        <button type="button" onClick={() => setAcik((x) => !x)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
          <span className="relative h-7 w-7 shrink-0">
            <svg viewBox="0 0 28 28" className="h-7 w-7 -rotate-90"><circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="3" /><circle cx="14" cy="14" r="11" fill="none" stroke="#55d6fd" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(biten / adimlar.length) * 69.1} 69.1`} /></svg>
          </span>
          <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-white">Sonraki adımlar</span><span className="block text-[11.5px] text-white/45">{biten} / {adimlar.length} tamam · {adimlar.find((a) => !a.bitti)?.ad}</span></span>
          <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-white/40 transition-transform", acik && "rotate-180")} />
        </button>
        <button type="button" title="Gizle" onClick={() => { setGizli(true); try { localStorage.setItem(anahtar, "1"); } catch { /* yok */ } }} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/35 hover:bg-white/[0.07] hover:text-white"><X className="h-3.5 w-3.5" /></button>
      </div>
      <AnimatePresence initial={false}>
        {acik && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="space-y-0.5 border-t border-white/[0.05] p-1.5">
              {adimlar.map((a) => (
                <button key={a.ad} type="button" disabled={a.bitti || !a.hedef} onClick={() => a.hedef && git(a.hedef)} className="flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left transition-colors enabled:hover:bg-white/[0.05]">
                  {a.bitti ? <CircleCheck className="h-4 w-4 shrink-0 text-[#55d6fd]" /> : <CircleDashed className="h-4 w-4 shrink-0 text-white/35" />}
                  <span className="min-w-0"><span className={cn("block text-[12.5px]", a.bitti ? "text-white/40 line-through decoration-white/20" : "text-white/85")}>{a.ad}</span>{!a.bitti && <span className="block text-[11px] text-white/40">{a.alt}</span>}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
