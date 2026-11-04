"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Film, Image as ImageIcon, Images, Sparkles, Upload, X, type LucideIcon } from "lucide-react";
import { cn, saltUrl } from "@/lib/utils";
import { useProjeler } from "@/store/useProjeler";
import { useOdakTuzagi } from "@/hooks/useOdakTuzagi";
import { useEscKapat } from "@/hooks/useScrollKilit";

export type KitaplikOge = ReturnType<typeof useProjeler.getState>["uretimler"][number];
export type KitaplikTur = "gorsel" | "video";

/**
 * Kitaplıktan seç: sağdan açılan panel (ortada pencere değil); sayfa arkada görünür kalır.
 * Büyüt, Çerçevele gibi araçlar ortak kullanır. `turler` birden fazlaysa beyaz kayan süzgeç çıkar.
 */
export function KitaplikPaneli({ tur, turler = ["gorsel", "video"], alt, eylem, eylemIkon: EI, onKapat, onSec, onYukle }: {
  tur: KitaplikTur; turler?: KitaplikTur[]; alt: string; eylem: string; eylemIkon: LucideIcon;
  onKapat: () => void; onSec: (u: KitaplikOge) => void; onYukle: () => void;
}) {
  const uretimler = useProjeler((s) => s.uretimler);
  const [filtre, setFiltre] = useState<KitaplikTur>(turler.includes(tur) ? tur : turler[0]);
  const odak = useOdakTuzagi();
  const router = useRouter();
  useEscKapat(true, onKapat);
  const gecerli = (u?: string) => !!u && /^(\/|https:\/\/|data:image\/)/.test(u);
  const liste = uretimler
    .filter((u) => u.durum === "tamam" && u.gercek !== false && (filtre === "video" ? u.tur === "video" && gecerli(u.videoUrl) : u.tur === "gorsel" && gecerli(saltUrl(u.gorselUrl))))
    .sort((a, b) => b.olusturma - a.olusturma)
    .slice(0, 120);
  if (typeof document === "undefined") return null;
  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex justify-end bg-black/55" onClick={onKapat}>
      <motion.aside ref={odak} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 60, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 38 }} onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label="Kitaplıktan seç" className="flex h-full w-full max-w-[520px] flex-col border-l border-white/[0.08] bg-[#121315]">
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08]"><Images className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1 leading-tight"><span className="block text-[15px] font-semibold text-metin">Kitaplıktan seç</span><span className="block text-[12px] text-metin-2">{alt}</span></span>
          <button onClick={onKapat} aria-label="Kapat" className="flex h-9 w-9 items-center justify-center rounded-full text-metin-2 transition hover:bg-white/[0.08] hover:text-metin active:scale-90"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex items-center gap-2 px-4 py-3">
          {turler.length > 1 && (
            <div className="isolate flex gap-0.5 rounded-full bg-white/[0.06] p-[3px]">
              {turler.map((id) => {
                const [ad, I] = id === "video" ? ["Videolar", Film] as const : ["Görseller", ImageIcon] as const;
                return (
                  <button key={id} onClick={() => setFiltre(id)} aria-pressed={filtre === id} className={cn("relative flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors", filtre === id ? "text-black" : "text-metin-2 hover:text-metin")}>
                    {filtre === id && <motion.span layoutId="kitFiltre" className="absolute inset-0 -z-10 rounded-full bg-white" transition={{ type: "spring", stiffness: 480, damping: 36 }} />}<I className="h-4 w-4" />{ad}
                  </button>
                );
              })}
            </div>
          )}
          {liste.length > 0 && <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11.5px] tabular-nums text-metin-2">{liste.length} {filtre === "video" ? "video" : "görsel"}</span>}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 [scrollbar-width:thin]">
          {liste.length ? (
            <div className="grid grid-cols-3 gap-2">
              {liste.map((u, i) => (
                <motion.button key={u.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} onClick={() => onSec(u)}
                  className="group relative aspect-square overflow-hidden rounded-[12px] bg-black/40 text-left outline outline-1 -outline-offset-1 outline-white/10 transition hover:outline-2 hover:outline-white active:scale-[0.97]">
                  {u.tur === "video"
                    ? <video src={u.videoUrl} muted className="h-full w-full object-cover" />
                    // eslint-disable-next-line @next/next/no-img-element
                    : <img src={saltUrl(u.gorselUrl)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />}
                  <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-2 pb-1.5 pt-5 text-[11px] text-white/90">{u.baslik}</span>
                  <span className="absolute right-1.5 top-1.5 flex h-7 items-center gap-1 rounded-full bg-white px-2 text-[11px] font-semibold text-black opacity-0 transition group-hover:opacity-100"><EI className="h-3 w-3" />{eylem}</span>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="mt-2 flex flex-col items-center gap-3 rounded-[18px] bg-white/[0.04] px-6 py-10 text-center ring-1 ring-inset ring-white/[0.07]">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08]">{filtre === "video" ? <Film className="h-5 w-5 text-metin-2" /> : <Images className="h-5 w-5 text-metin-2" />}</span>
              <span className="text-[14px] font-semibold text-metin">Kitaplığında {filtre === "video" ? "video" : "görsel"} yok</span>
              <span className="max-w-[300px] text-[12.5px] leading-relaxed text-metin-2">Ürettiğin {filtre === "video" ? "videolar" : "görseller"} burada listelenir. Şimdilik bilgisayarından bir dosya yükleyebilirsin.</span>
              <div className="flex gap-2">
                <button onClick={() => { onKapat(); onYukle(); }} className="flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black active:scale-95"><Upload className="h-4 w-4" />Dosya yükle</button>
                <button onClick={() => router.push(filtre === "video" ? "/panel/video" : "/panel/gorsel")} className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] font-medium text-metin hover:bg-white/[0.13] active:scale-95"><Sparkles className="h-4 w-4" />{filtre === "video" ? "Video üret" : "Görsel üret"}</button>
              </div>
            </div>
          )}
        </div>
      </motion.aside>
    </motion.div>,
    document.body,
  );
}
