"use client";

import { useEffect, useRef, useState } from "react";
import { KenarTutamac, useKenarStili } from "@/components/ui/KenarTutamac";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clapperboard, Download, FileText, MapPin, UserRound, Zap, Heart, Loader2, Package, Pause, Play, Plus, Trash2, Volume2, VolumeX, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOdakTuzagi } from "@/hooks/useOdakTuzagi";
import type { Uretim } from "@/store/useProjeler";

/**
 * Reklam görüntüleyici — ortada telefon çerçevesinde video (kendi oynatma çubuğu), altında kampanyanın
 * varyant şeridi; sağda başlık, tek satır eylemler, ayarlar listesi ve senaryo blokları.
 */
const BLOK_RENK: Record<string, string> = { Kanca: "#fcd34d", Sahne: "#55d6fd", Kapanış: "#c4b5fd" };
export type TarifSatiri = { etiket: string; deger: string; gorsel?: string };

export function senaryoBloklari(metin?: string): { ad: string; metin: string }[] {
  if (!metin) return [];
  const l = metin.split("\n").map((s) => s.trim()).filter(Boolean);
  const b = l.map((s) => { const m = s.match(/^(Kanca|Sahne|Kapanış)(?:\s*\([^)]*\))?:\s*(.*)$/); return m ? { ad: m[1], metin: m[2] } : { ad: "", metin: s }; });
  return b;
}

export function ReklamGoruntuleyici({ u, grup, urunAd, urunGorsel, tarif, teknik, zaman, sira, onSec, onGez, onKapat, onBegen, onIndir, onYeniden, onSil }: {
  u: Uretim; grup: Uretim[]; urunAd: string; urunGorsel?: string; tarif: TarifSatiri[]; teknik: string[]; zaman: string; sira: { i: number; n: number };
  onSec: (id: string) => void; onGez: (y: 1 | -1) => void; onKapat: () => void; onBegen: () => void; onIndir: () => void; onYeniden: () => void; onSil: () => void;
}) {
  const yanBoy = useKenarStili("goruntuleyici-reklam", 400);
  const odakRef = useOdakTuzagi(true);
  const vRef = useRef<HTMLVideoElement>(null);
  const [oynuyor, setOynuyor] = useState(true);
  const [sessiz, setSessiz] = useState(true);
  const [yuzde, setYuzde] = useState(0);
  useEffect(() => {
    const t = (e: KeyboardEvent) => {
      if (e.key === "Escape") onKapat();
      else if (e.key === "ArrowRight") onGez(1);
      else if (e.key === "ArrowLeft") onGez(-1);
      else if (e.key === " ") { e.preventDefault(); oynat(); }
    };
    window.addEventListener("keydown", t);
    return () => window.removeEventListener("keydown", t);
  });
  useEffect(() => { setOynuyor(true); setYuzde(0); }, [u.id]);
  const oynat = () => { const v = vRef.current; if (!v) return; if (v.paused) { void v.play(); setOynuyor(true); } else { v.pause(); setOynuyor(false); } };
  const bloklar = senaryoBloklari(u.meta?.hamIstem);
  const no = grup.findIndex((x) => x.id === u.id) + 1;
  const eylem = "flex h-9 w-9 items-center justify-center rounded-full text-metin-2 ring-1 ring-inset ring-white/[0.1] transition-colors hover:bg-white/[0.06] hover:text-metin disabled:opacity-40";

  return (
    <div ref={odakRef} role="dialog" aria-modal="true" aria-label={urunAd} onClick={onKapat} className="perde fixed inset-0 z-[70] flex flex-col bg-black/90 md:flex-row">
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6 max-md:p-3" onClick={(e) => e.stopPropagation()}>
        <motion.div key={u.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="relative h-[min(72vh,720px)] rounded-[38px] bg-[#0b0b0d] p-[7px] ring-1 ring-white/15 shadow-[0_40px_90px_-30px_rgba(85,214,253,0.3)] max-md:h-[52vh]" style={{ aspectRatio: "9 / 19" }}>
          <div className="relative h-full w-full overflow-hidden rounded-[31px] bg-black">
            {u.videoUrl
              ? <video ref={vRef} key={u.videoUrl} src={u.videoUrl} autoPlay loop playsInline muted={sessiz} onClick={oynat}
                  onTimeUpdate={(e) => { const v = e.currentTarget; if (v.duration) setYuzde((v.currentTime / v.duration) * 100); }} className="h-full w-full cursor-pointer object-cover" />
              : <span className="block h-full w-full" style={{ background: u.gorselUrl }} />}
            <span className="pointer-events-none absolute left-1/2 top-2.5 h-[18px] w-[64px] -translate-x-1/2 rounded-full bg-black" />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
            <span className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-[16px] bg-white/[0.12] p-1.5 backdrop-blur-md max-md:inset-x-2 max-md:bottom-2 max-md:gap-1.5 max-md:rounded-[13px] max-md:p-1">
              <span className="h-9 w-9 shrink-0 overflow-hidden rounded-[10px] bg-white/20 max-md:h-7 max-md:w-7 max-md:rounded-[8px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {urunGorsel ? <img src={urunGorsel} alt="" className="h-full w-full object-cover" /> : <Package className="m-2.5 h-4 w-4 text-white/80" />}
              </span>
              <span className="min-w-0 flex-1 leading-tight"><span className="block truncate text-[12px] font-semibold text-white max-md:text-[11px]">{urunAd}</span><span className="block text-[10px] text-white/70">Sponsorlu</span></span>
              <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-black max-md:px-2 max-md:text-[10px]">Satın al</span>
            </span>
            {u.videoUrl && (
              <span className="absolute inset-x-3 top-9 flex items-center gap-2">
                <button onClick={oynat} aria-label={oynuyor ? "Duraklat" : "Oynat"} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm">{oynuyor ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />}</button>
                <span className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25"><span className="block h-full bg-white" style={{ width: `${yuzde}%` }} /></span>
                <button onClick={() => setSessiz((v) => !v)} aria-label={sessiz ? "Sesi aç" : "Sesi kapat"} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm">{sessiz ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}</button>
              </span>
            )}
          </div>
        </motion.div>
        {grup.length > 1 && (
          <div className="flex items-center gap-2 rounded-[18px] bg-white/[0.05] p-1.5 ring-1 ring-inset ring-white/[0.08] md:hidden" role="tablist" aria-label="Varyantlar">
            {grup.map((x, i) => (
              <button key={x.id} role="tab" aria-selected={x.id === u.id} onClick={() => x.durum === "tamam" && onSec(x.id)} disabled={x.durum !== "tamam"}
                className={cn("relative h-14 w-10 overflow-hidden rounded-[10px] bg-white/[0.05] transition-[outline-color] disabled:opacity-40", x.id === u.id ? "outline outline-2 -outline-offset-2 outline-aksan" : "outline outline-1 -outline-offset-1 outline-white/10 hover:outline-white/30")}>
                <span className="absolute inset-0" style={{ background: x.gorselUrl }} />
                <span className="absolute bottom-0.5 left-1 text-[10px] font-bold text-white [text-shadow:0_1px_3px_#000]">V{i + 1}</span>
              </button>
            ))}
          </div>
        )}
        {sira.n > 1 && (
          <>
            <button onClick={() => onGez(-1)} aria-label="Önceki reklam" className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.08] text-metin hover:bg-white/[0.14] max-md:hidden"><ChevronLeft className="h-5 w-5" /></button>
            <button onClick={() => onGez(1)} aria-label="Sonraki reklam" className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.08] text-metin hover:bg-white/[0.14] max-md:hidden"><ChevronRight className="h-5 w-5" /></button>
          </>
        )}
      </div>

      <motion.aside onClick={(e) => e.stopPropagation()} style={yanBoy.stil} className="flex w-full shrink-0 flex-col border-l border-white/[0.06] bg-[#141517] relative md:w-[var(--yan-en)] max-md:max-h-[42vh]">
        <KenarTutamac en={yanBoy.en} anahtar={yanBoy.anahtar} varsayilan={yanBoy.varsayilan} min={yanBoy.min} max={yanBoy.max} etiket="Panelin genişliği" />
        <div className="flex items-center gap-3 border-b border-white/[0.06] p-4 pr-3">
          <span className="h-11 w-11 shrink-0 overflow-hidden rounded-[12px] bg-white/[0.06] ring-1 ring-inset ring-white/[0.1]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {urunGorsel ? <img src={urunGorsel} alt="" className="h-full w-full object-cover" /> : <Package className="m-3 h-5 w-5 text-metin-2" />}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[16px] font-semibold text-metin" title={urunAd}>{urunAd}</h2>
            <p className="mt-0.5 truncate text-[12.5px] text-metin-2">Varyant {no} / {grup.length} · {zaman}</p>
          </div>
          <button onClick={onKapat} aria-label="Kapat" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-metin-2 hover:bg-white/[0.07] hover:text-metin"><X className="h-5 w-5" /></button>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 [scrollbar-width:thin]">
          <div className="flex items-center gap-1.5">
            <motion.button whileTap={{ scale: 0.97 }} onClick={onIndir} disabled={!u.videoUrl} title={u.videoUrl ? "Videoyu indir" : "Video hazır olunca indirilebilir"}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-[13.5px] font-semibold text-[#0b0c0e] transition hover:bg-white/90 disabled:bg-white/[0.085] disabled:text-metin-3"><Download className="h-4 w-4" />V{no} indir</motion.button>
            <button onClick={onBegen} aria-pressed={!!u.favori} aria-label="Beğen" title={u.favori ? "Beğeniden çıkar" : "Beğen"} className={cn(eylem, "h-10 w-10", u.favori && "text-rose-300 ring-rose-400/30")}><Heart className={cn("h-4 w-4", u.favori && "fill-current")} /></button>
            <button onClick={onSil} aria-label="Sil" title="Bu varyantı sil" className={cn(eylem, "h-10 w-10 hover:text-rose-300")}><Trash2 className="h-4 w-4" /></button>
          </div>

          <section className="overflow-hidden rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.06] max-md:hidden">
            <p className="flex items-center gap-2 border-b border-white/[0.06] px-3.5 py-2.5 text-[13px] font-semibold text-metin">Varyantlar<span className="rounded-full bg-white/[0.085] px-1.5 text-[11px] tabular-nums leading-[18px] text-metin-2">{grup.length}</span></p>
            <div className="flex flex-wrap gap-2 p-3">
              {grup.map((x, i) => {
                const sec = x.id === u.id; const hazir = x.durum === "tamam";
                return (
                  <button key={x.id} onClick={() => hazir && onSec(x.id)} disabled={!hazir} aria-pressed={sec} aria-label={`Varyant ${i + 1}`}
                    className="group relative aspect-[9/16] w-[62px] overflow-hidden rounded-[11px] bg-white/[0.05] disabled:cursor-default">
                    {hazir && <span className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.05]" style={{ background: x.gorselUrl }} />}
                    {!hazir && <span className="absolute inset-0 flex items-center justify-center">{x.durum === "hata" ? <X className="h-4 w-4 text-rose-300" /> : <Loader2 className="h-4 w-4 animate-spin text-metin-2" />}</span>}
                    <span className="absolute left-1 top-1 rounded-full bg-black/60 px-1.5 text-[10px] font-bold leading-[16px] text-white">V{i + 1}</span>
                    {x.favori && <Heart className="absolute bottom-1 right-1 h-3 w-3 fill-rose-400 text-rose-400" />}
                    <span className={cn("pointer-events-none absolute inset-0 rounded-[11px] ring-inset", sec ? "ring-2 ring-white" : "ring-1 ring-white/[0.1] group-hover:ring-white/30")} />
                  </button>
                );
              })}
              <button onClick={onYeniden} title="Aynı ayarlarla yeni varyant" className="flex aspect-[9/16] w-[62px] flex-col items-center justify-center gap-1 rounded-[11px] border border-dashed border-white/[0.16] text-metin-2 transition hover:border-white/35 hover:text-metin">
                <Plus className="h-4 w-4" /><span className="text-[10.5px] font-medium">Yeni</span>
              </button>
            </div>
          </section>

          <section className="overflow-hidden rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.06]">
            <p className="border-b border-white/[0.06] px-3.5 py-2.5 text-[13px] font-semibold text-metin">Tarif</p>
            <ul className="divide-y divide-white/[0.06]">
              {tarif.map((t) => (
                <li key={t.etiket} className="flex items-center gap-3 px-3.5 py-2.5">
                  <span className="h-9 w-9 shrink-0 overflow-hidden rounded-[10px] bg-white/[0.06] ring-1 ring-inset ring-white/[0.08]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {t.gorsel ? <img src={t.gorsel} alt="" className="h-full w-full object-cover" /> : (() => { const I = ({ Kanca: Zap, Ortam: MapPin, Avatar: UserRound } as Record<string, typeof Zap>)[t.etiket] ?? Clapperboard; return <span className="flex h-full w-full items-center justify-center text-metin-2"><I className="h-4 w-4" /></span>; })()}
                  </span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block text-[11.5px] text-metin-3">{t.etiket}</span>
                    <span className="block truncate text-[13.5px] font-medium text-metin" title={t.deger}>{t.deger}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-1.5 border-t border-white/[0.06] px-3.5 py-2.5">
              {teknik.map((t) => <span key={t} className="rounded-full bg-white/[0.065] px-2.5 py-1 text-[12px] font-medium tabular-nums text-metin-2 ring-1 ring-inset ring-white/[0.07]">{t}</span>)}
            </div>
          </section>

          <section className="overflow-hidden rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.06]">
            <p className="flex items-center gap-2 border-b border-white/[0.06] px-3.5 py-2.5 text-[13px] font-semibold text-metin">Senaryo{bloklar.length > 0 && <span className="rounded-full bg-white/[0.085] px-1.5 text-[11px] tabular-nums leading-[18px] text-metin-2">{bloklar.length}</span>}</p>
            {bloklar.length > 0 ? (
              <ol className="relative px-3.5 py-3">
                <span aria-hidden className="absolute bottom-6 left-[21px] top-6 w-px bg-white/[0.1]" />
                {bloklar.map((b, i) => (
                  <li key={i} className="relative flex gap-3 py-1.5">
                    <span className="relative mt-[5px] h-[9px] w-[9px] shrink-0 rounded-full ring-4 ring-[#18191c]" style={{ background: BLOK_RENK[b.ad] ?? "rgba(255,255,255,0.5)" }} />
                    <span className="min-w-0">
                      {b.ad && <span className="block text-[11.5px] font-semibold" style={{ color: BLOK_RENK[b.ad] }}>{b.ad}</span>}
                      <span className="block text-[13.5px] leading-relaxed text-metin">{b.metin}</span>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="flex items-start gap-3 px-3.5 py-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.085] text-metin-2"><FileText className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium text-metin">Bu varyantta senaryo yok</span>
                  <span className="mt-0.5 block text-[12.5px] leading-relaxed text-metin-2">Reklam format ve kancaya göre kurgulandı. Kanca, sahne ve kapanışı kendin yazmak için ayarları yükle.</span>
                  <button onClick={onYeniden} className="mt-2.5 flex h-8 items-center gap-1.5 rounded-full bg-white/[0.085] px-3 text-[12.5px] font-semibold text-metin ring-1 ring-inset ring-white/[0.1] transition hover:bg-white/[0.12]"><FileText className="h-3.5 w-3.5" />Senaryoyla yeniden üret</button>
                </span>
              </div>
            )}
          </section>
        </div>
      </motion.aside>
    </div>
  );
}
