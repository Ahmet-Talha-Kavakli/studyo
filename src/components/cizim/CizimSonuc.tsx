"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Download, PencilLine, Clapperboard, Columns2, Loader2, AlertTriangle, Trash2, Heart, Clock, Shapes, Ratio, SlidersHorizontal } from "lucide-react";
import { KenarTutamac, useKenarGenisligi } from "@/components/ui/KenarTutamac";
import { useProjeler } from "@/store/useProjeler";
import { Tooltip } from "@/components/ui/Tooltip";
import { kareYakala } from "@/components/studyo/VideoGoruntuleyici";
import { cn, saltUrl } from "@/lib/utils";
import { useEscKapat, useScrollKilit } from "@/hooks/useScrollKilit";
import { useOdakTuzagi } from "@/hooks/useOdakTuzagi";
import type { Uretim } from "@/store/useProjeler";
import { toast } from "@/lib/toast";
import { MarkaKare } from "@/components/studyo/hf";

/**
 * Çizim sonucu: solda büyük sahne (görselde önce/sonra karşılaştırma kaydırıcısı, videoda oynatıcı),
 * sağda yan panel (bilgi + eylemler). "Tuvale al" sonucu yeni taban yapar (çıktı → girdi döngüsü).
 */
export function CizimSonuc({ u, onKapat, onTuvale, onVideoya }: { u: Uretim; onKapat: () => void; onTuvale: (url: string) => void; onVideoya: (url: string) => void }) {
  useScrollKilit(true);
  useEscKapat(true, onKapat);
  const kutu = useOdakTuzagi<HTMLDivElement>(true);
  const [ayrac, setAyrac] = useState(50);
  const [karsilastir, setKarsilastir] = useState(true);
  const panelEn = useKenarGenisligi("cizim-sonuc", 380, 320, 640);
  const ornek = u.gercek === false;
  const alanRef = useRef<HTMLDivElement>(null);
  const video = u.tur === "video";
  const sonuc = video ? u.videoUrl : saltUrl(u.gorselUrl);
  const once = u.meta?.gorselUrl;
  const bitti = u.durum === "tamam";
  const surukle = (e: React.PointerEvent) => {
    const el = alanRef.current; if (!el) return;
    const ayarla = (x: number) => { const r = el.getBoundingClientRect(); setAyrac(Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100))); };
    ayarla(e.clientX);
    const tasi = (ev: PointerEvent) => ayarla(ev.clientX);
    const birak = () => { window.removeEventListener("pointermove", tasi); window.removeEventListener("pointerup", birak); };
    window.addEventListener("pointermove", tasi); window.addEventListener("pointerup", birak);
  };
  const indir = () => { if (!sonuc) return; const a = document.createElement("a"); a.href = sonuc; a.download = `${(u.baslik || "cizim").replace(/[\\/:*?"<>|]+/g, "-")}.${video ? "mp4" : "png"}`; a.click(); toast.success(video ? "Video indiriliyor" : "Görsel indiriliyor", { description: "Dosya indirilenler klasörüne kaydedilir." }); };
  const karolar: [typeof Clock, string, string][] = [
    [Shapes, "İşlem", video ? "Çizimden video" : u.meta?.islem === "eskiz" ? "Eskizden görsel" : "Çizimle düzenleme"],
    ...(u.meta?.sure ? [[Clock, "Süre", String(u.meta.sure).replace("sn", " sn")] as [typeof Clock, string, string]] : []),
    ...(u.meta?.oran ? [[Ratio, "Oran", String(u.meta.oran)] as [typeof Clock, string, string]] : []),
    ...(!video && u.meta?.sadakat ? [[SlidersHorizontal, u.meta?.islem === "eskiz" ? "Çizime bağlılık" : "Değişim payı", u.meta.islem === "eskiz" ? ({ siki: "Sıkı", dengeli: "Dengeli", serbest: "Serbest" } as Record<string, string>)[u.meta.sadakat] : ({ siki: "Yalnız işaretli", dengeli: "Dengeli", serbest: "Uyumlu" } as Record<string, string>)[u.meta.sadakat]] as [typeof Clock, string, string]] : []),
  ];
  const { sil, favoriToggle } = useProjeler.getState();
  const favori = !!u.favori;

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="perde fixed inset-0 z-[200] bg-black/80 backdrop-blur-md" onClick={onKapat} />
      <motion.div ref={kutu} role="dialog" aria-modal="true" aria-label="Çizim sonucu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="pointer-events-none fixed inset-0 z-[201] flex max-md:flex-col">
        {/* Sahne */}
        <div className="pointer-events-auto relative flex min-h-0 min-w-0 flex-1 items-center justify-center p-6 max-md:p-3" onClick={(e) => { if (e.target === e.currentTarget) onKapat(); }}>
          <button onClick={onKapat} aria-label="Kapat" className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-inset ring-white/15 backdrop-blur-xl transition hover:bg-black/65 active:scale-90"><X className="h-4 w-4" /></button>
          {!bitti ? (
            <div className="flex flex-col items-center gap-3 text-center">
              {u.durum === "hata" ? <AlertTriangle className="h-8 w-8 text-rose-300" /> : <Loader2 className="h-8 w-8 animate-spin text-white" />}
              <p className="text-[15px] font-semibold text-white">{u.durum === "hata" ? "Üretim başarısız" : "Üretiliyor"}</p>
              <p className="max-w-sm text-[13px] text-white/60">{u.durum === "hata" ? u.hata ?? "Bilinmeyen hata, kredi iade edildi" : `%${Math.round(u.ilerleme ?? 0)}; bitince burada açılır`}</p>
              {u.durum !== "hata" && <span className="h-1 w-48 overflow-hidden rounded-full bg-white/15"><motion.span className="block h-full rounded-full bg-white" animate={{ width: `${Math.max(3, u.ilerleme ?? 0)}%` }} /></span>}
            </div>
          ) : video ? (
            <motion.video initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} src={sonuc} controls autoPlay loop playsInline className="max-h-full max-w-full rounded-[18px]" />
          ) : karsilastir && once && !ornek ? (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} ref={alanRef} onPointerDown={surukle} className="relative max-h-full cursor-ew-resize select-none overflow-hidden rounded-[18px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sonuc} alt="Sonuç" className="block max-h-[calc(100dvh-48px)] max-w-full max-md:max-h-[55dvh]" draggable={false} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={once} alt="Çizimli kare" className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: `inset(0 ${100 - ayrac}% 0 0)` }} draggable={false} />
              <span className="pointer-events-none absolute inset-y-0 w-0.5 bg-white" style={{ left: `${ayrac}%` }}>
                <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black"><Columns2 className="h-4 w-4" /></span>
              </span>
              <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-0.5 text-[12px] font-medium text-white backdrop-blur">Çizim</span>
              <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-0.5 text-[12px] font-medium text-white backdrop-blur">Sonuç</span>
            </motion.div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <motion.img initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} src={sonuc} alt="Sonuç" className="max-h-full max-w-full rounded-[18px]" />
          )}
        </div>

        {/* Yan panel */}
        <motion.aside initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 24, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 36 }}
          style={{ width: panelEn }}
          className="pointer-events-auto relative flex shrink-0 flex-col border-l border-white/[0.07] bg-[#17181b] max-md:max-h-[45dvh] max-md:!w-full max-md:border-l-0 max-md:border-t">
          <KenarTutamac en={panelEn} anahtar="cizim-sonuc" varsayilan={380} min={320} max={640} etiket="Panelin genişliği" />
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5">
            <span className="min-w-0 flex-1 leading-tight"><span className="block truncate text-[15px] font-semibold text-metin">{u.baslik}</span><span className="block text-[12.5px] text-metin-3">{new Date(u.olusturma).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</span></span>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 [scrollbar-width:thin]">
            {!video && once && bitti && !ornek && (
              <div className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
                <div className="border-b border-white/[0.06] px-3 py-2 text-[13px] font-semibold text-metin">Görünüm</div>
                <div className="grid grid-cols-2 gap-1 p-1.5">
                  {([[true, "Karşılaştır"], [false, "Yalnız sonuç"]] as const).map(([v, a]) => (
                    <button key={a} onClick={() => setKarsilastir(v)} aria-pressed={karsilastir === v} className={cn("h-9 rounded-full text-[13px] font-medium transition", karsilastir === v ? "bg-white text-black" : "text-metin-2 hover:bg-white/[0.05] hover:text-metin")}>{a}</button>
                  ))}
                </div>
              </div>
            )}
            {u.prompt && (
              <div className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
                <div className="border-b border-white/[0.06] px-3 py-2 text-[13px] font-semibold text-metin">Talimat</div>
                <p className="px-3 py-2.5 text-[13px] leading-relaxed text-metin-2">{u.meta?.hamIstem || u.baslik}</p>
              </div>
            )}
            <div className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
              <div className="border-b border-white/[0.06] px-3 py-2 text-[13px] font-semibold text-metin">Detaylar</div>
              <div className="flex items-center gap-3 border-b border-white/[0.06] px-3 py-2.5">
                <MarkaKare ad={u.model} boyut={36} />
                <span className="min-w-0 leading-tight"><span className="block text-[11.5px] text-metin-3">Model</span><span className="block truncate text-[14px] font-semibold text-metin">{u.model}</span></span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 p-2">
                {karolar.map(([I, a, b]) => (
                  <div key={a} className={cn("flex items-center gap-2.5 rounded-[11px] px-2.5 py-2 ring-1 ring-inset ring-white/[0.05]", b.length > 14 && "col-span-2")} style={{ background: "rgba(255,255,255,0.03)" }}>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-metin-2"><I className="h-3.5 w-3.5" /></span>
                    <span className="min-w-0 leading-tight"><span className="block text-[11px] text-metin-3">{a}</span><span className="block truncate text-[13px] font-semibold tabular-nums text-metin">{b}</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {bitti && sonuc && (
            <div className="space-y-2 border-t border-white/[0.06] p-3">
              <div className="flex gap-2">
                <button onClick={indir} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white text-[14px] font-semibold text-black transition active:scale-[0.98]"><Download className="h-4 w-4" />İndir</button>
                <Tooltip label={favori ? "Beğeniyi kaldır" : "Beğen"}><button onClick={() => favoriToggle(u.id)} aria-label="Beğen" aria-pressed={favori} className={cn("flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.08] transition hover:bg-white/[0.14]", favori ? "text-rose-400" : "text-metin-2 hover:text-metin")}><Heart className={cn("h-4 w-4", favori && "fill-current")} /></button></Tooltip>
                <Tooltip label="Sil"><button onClick={() => { sil(u.id); onKapat(); toast.success("Sonuç silindi"); }} aria-label="Sil" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.08] text-metin-2 transition hover:bg-rose-500/15 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button></Tooltip>
              </div>
              {video && (
                <button onClick={() => { void kareYakala(sonuc, "son").then(onTuvale).catch(() => toast.error("Videonun son karesi alınamadı", { description: "Tarayıcı bu videodan kare okuyamadı. Videoyu indirip görsel olarak yükleyebilirsin." })); }}
                  className="flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-white/[0.08] text-[13px] font-medium text-metin transition hover:bg-white/[0.14] active:scale-95"><PencilLine className="h-4 w-4" />Son kareyi tuvale al, devamını çiz</button>
              )}
              {!video && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => onTuvale(sonuc)} className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-white/[0.08] text-[13px] font-medium text-metin transition hover:bg-white/[0.14] active:scale-95"><PencilLine className="h-4 w-4" />Tuvale al</button>
                  <button onClick={() => onVideoya(sonuc)} className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-white/[0.08] text-[13px] font-medium text-metin transition hover:bg-white/[0.14] active:scale-95"><Clapperboard className="h-4 w-4" />Videoya çevir</button>
                </div>
              )}
            </div>
          )}
        </motion.aside>
      </motion.div>
    </>
  );
}
