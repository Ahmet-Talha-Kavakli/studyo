"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Film, Image as ImageIcon, Images, Loader2, Play, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn, saltUrl } from "@/lib/utils";
import type { Uretim } from "@/store/useProjeler";
import { useEscKapat } from "@/hooks/useScrollKilit";
import { kareYakala } from "@/components/studyo/VideoGoruntuleyici";

/** Üretimlerden seçme penceresi: görsel (kare olarak) ya da video (uzatma ya da karesini alma). */
export function UretimSecici({ hedef, uretimler, onKapat, onKare, onVideo, baslik, alt }: {
  hedef: "bas" | "son" | "uzat"; uretimler: Uretim[];
  onKapat: () => void; onKare: (url: string, hedef: "bas" | "son") => void; onVideo: (u: Uretim) => void;
  /** Başka araçlarda başlık ve alt yazı (ör. Çizim: tuvale görsel). */
  baslik?: string; alt?: string;
}) {
  const [sekme, setSekme] = useState<"gorsel" | "video">(hedef === "uzat" ? "video" : "gorsel");
  const [mesgul, setMesgul] = useState<string | null>(null);
  useEscKapat(true, onKapat);
  const gorseller = uretimler.filter((u) => u.tur === "gorsel" && u.durum === "tamam" && saltUrl(u.gorselUrl)).slice(0, 60);
  const videolar = uretimler.filter((u) => u.tur === "video" && u.durum === "tamam" && u.videoUrl).slice(0, 60);
  const liste = sekme === "gorsel" ? gorseller : videolar;
  const sec = async (u: Uretim) => {
    if (sekme === "gorsel") return onKare(saltUrl(u.gorselUrl)!, hedef === "son" ? "son" : "bas");
    if (hedef === "uzat") return onVideo(u);
    setMesgul(u.id);
    try { onKare(await kareYakala(u.videoUrl!, "son"), hedef === "son" ? "son" : "bas"); }
    catch { toast.error("Videonun karesi alınamadı", { description: "Tarayıcı bu videodan kare okuyamadı. Başka bir video seç ya da bir görsel yükle." }); }
    finally { setMesgul(null); }
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="perde fixed inset-0 z-[120] flex justify-end bg-black/55" onClick={onKapat}>
      <motion.div initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 60, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label="Üretimlerinden seç"
        className="flex h-full w-full max-w-[520px] flex-col overflow-hidden border-l border-white/[0.08] bg-[#121315]">
        <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.07] px-4 py-3.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-white/[0.05] text-metin ring-1 ring-inset ring-white/[0.08]"><Images className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold text-metin">{baslik ?? (hedef === "uzat" ? "Uzatılacak videoyu seç" : hedef === "son" ? "Bitiş karesini seç" : "Başlangıç karesini seç")}</span>
            <span className="block text-[12px] text-metin-3">{alt ?? (hedef === "uzat" ? "Seçtiğin videonun son karesinden devam edilir." : "Bir görsel seç ya da bir videonun son karesini al.")}</span>
          </span>
          {hedef !== "uzat" && (
            <div className="flex items-center gap-0.5 rounded-full bg-white/[0.04] p-0.5 ring-1 ring-inset ring-white/[0.07]">
              {([["gorsel", "Görseller", gorseller.length], ["video", "Videolar", videolar.length]] as const).map(([id, ad, n]) => (
                <button key={id} onClick={() => setSekme(id)} aria-pressed={sekme === id}
                  className={cn("h-8 rounded-full px-3 text-[12.5px] font-medium transition-colors", sekme === id ? "bg-white/[0.1] text-metin" : "text-metin-3 hover:text-metin-2")}>{ad} <span className="tabular-nums text-metin-3">{n}</span></button>
              ))}
            </div>
          )}
          <button onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05] text-metin-2 ring-1 ring-inset ring-white/[0.08] hover:text-metin"><X className="h-4 w-4" /></button>
        </div>
        <div className="min-h-[260px] flex-1 overflow-y-auto p-3 [scrollbar-width:thin]">
          {liste.length ? (
            <div className="grid grid-cols-3 gap-2">
              {liste.map((u) => {
                const poster = saltUrl(u.gorselUrl);
                return (
                  <button key={u.id} onClick={() => void sec(u)} disabled={!!mesgul} title={u.baslik}
                    className="group relative aspect-square overflow-hidden rounded-[12px] bg-[#111113] ring-1 ring-inset ring-white/10 transition-shadow hover:ring-2 hover:ring-white/50 disabled:opacity-60">
                    {poster
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={poster} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                      : <span className="absolute inset-0 bg-gradient-to-br from-[#1a1a1e] to-[#101012]" />}
                    {u.tur === "video" && <span className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60"><Play className="h-2.5 w-2.5 translate-x-px fill-white text-white" /></span>}
                    
                    {mesgul === u.id && <span className="absolute inset-0 flex items-center justify-center bg-black/50"><Loader2 className="h-5 w-5 animate-spin text-white" /></span>}
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1 pt-4 text-left text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {u.tur === "video" && hedef !== "uzat" ? "Son karesini al" : u.baslik}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.05] ring-1 ring-inset ring-white/[0.08]">{sekme === "video" ? <Film className="h-5 w-5 text-metin-2" /> : <ImageIcon className="h-5 w-5 text-metin-2" />}</span>
              <p className="text-[14px] font-semibold text-metin">{sekme === "video" ? "Henüz tamamlanmış videon yok" : "Henüz görsel üretmedin"}</p>
              <p className="text-[12.5px] text-metin-3">{sekme === "video" ? "Bir video üret ya da bilgisayarından video yükle." : "Görsel stüdyosunda üret, burada kare olarak kullan."}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
