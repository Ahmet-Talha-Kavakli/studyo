"use client";

import { memo, useRef, useState } from "react";
import { AlertTriangle, Check, Star, Loader2, MoreHorizontal, Pause, Play, RefreshCw, Upload } from "lucide-react";
import { IndirDugmesi } from "@/components/galeri/IndirMenusu";
import { Tooltip } from "@/components/ui/Tooltip";
import type { Uretim } from "@/store/useProjeler";
import { IKON_KARO } from "@/lib/renk";
import { aracFiltresi, dalga, kartArka, turBul, uretimTuru } from "./yardimci";
import { cn } from "@/lib/utils";

export interface KartOlaylari {
  onTikla: (u: Uretim, e: React.MouseEvent) => void;
  onSec: (u: Uretim, e: React.MouseEvent) => void;
  onFavori: (u: Uretim) => void;
  onIndir: (u: Uretim) => void;
  onMenu: (u: Uretim, x: number, y: number) => void;
  onCal: (u: Uretim) => void;
  onTekrar: (u: Uretim) => void;
}

const SesDalgasi = ({ u, ilerleme, kucuk }: { u: Uretim; ilerleme: number; kucuk?: boolean }) => {
  const d = dalga(u.id + u.prompt, kucuk ? 32 : 44);
  return (
    <div className={cn("flex w-full items-center gap-[2px]", kucuk ? "h-8" : "h-14")}>
      {d.map((v, i) => (
        <span key={i} className={cn("flex-1 rounded-full transition-colors", i / d.length < ilerleme ? "bg-white" : "bg-white/35")} style={{ height: `${v * 100}%` }} />
      ))}
    </div>
  );
};

/** Izgara kartı. */
export const VarlikKarti = memo(function VarlikKarti({ u, secili, secimModu, calan, ilerleme, ...o }: {
  u: Uretim; secili: boolean; secimModu: boolean; calan: boolean; ilerleme: number;
} & KartOlaylari) {
  const tur = uretimTuru(u);
  const T = turBul(tur);
  const hata = u.durum === "hata";
  const suruyor = u.durum === "isleniyor" || u.durum === "kuyrukta";
  const sesli = tur === "ses" || tur === "muzik";
  const yukleme = aracFiltresi(u) === "yukleme";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ustunde, setUstunde] = useState(false);

  return (
    <div data-varlik={u.id} data-durum={u.durum}
      onClick={(e) => o.onTikla(u, e)}
      onContextMenu={(e) => { if (suruyor) return; e.preventDefault(); o.onMenu(u, e.clientX, e.clientY); }}
      onMouseEnter={() => { setUstunde(true); videoRef.current?.play().catch(() => {}); }}
      onMouseLeave={() => { setUstunde(false); const v = videoRef.current; if (v) { v.pause(); v.currentTime = 0; } }}
      className={cn("group/k relative aspect-[4/5] cursor-pointer select-none overflow-hidden rounded-[14px] bg-yuzey-2 outline-none ring-offset-2 ring-offset-zemin transition-shadow",
        secili ? "ring-2 ring-vurgu" : "focus-visible:ring-2 focus-visible:ring-white/60")}
      tabIndex={0} role="button" aria-label={u.baslik} aria-pressed={secimModu ? secili : undefined}>

      {/* Medya */}
      {hata ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#1a1215] p-3 text-center">
          <AlertTriangle className="h-5 w-5 text-rose-300" />
          <span className="text-[12px] font-medium text-rose-200">Üretim tamamlanamadı</span>
          <span className="line-clamp-2 text-[11px] text-metin-3">{u.prompt || u.baslik}</span>
          <button onClick={(e) => { e.stopPropagation(); o.onTekrar(u); }} className="mt-1 inline-flex items-center gap-1 rounded-lg bg-white/[0.08] px-2.5 py-1 text-[11.5px] font-semibold text-white hover:bg-white/[0.14]"><RefreshCw className="h-3 w-3" />Tekrar dene</button>
        </div>
      ) : (
        <>
          <div className="absolute inset-0 transition-transform duration-500 group-hover/k:scale-[1.03]" style={{ background: kartArka(u) }} />
          {tur === "video" && u.videoUrl && (
            <video ref={videoRef} src={u.videoUrl} muted loop playsInline preload="none"
              className={cn("absolute inset-0 h-full w-full object-cover transition-opacity", ustunde ? "opacity-100" : "opacity-0")} />
          )}
          {sesli && (
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/30 to-black/10 p-3">
              <SesDalgasi u={u} ilerleme={calan ? ilerleme : 0} />
            </div>
          )}
        </>
      )}

      {suruyor && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 backdrop-blur-[2px]">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
          <span className="text-[12px] font-semibold tabular-nums text-white">{u.durum === "kuyrukta" ? "Sırada" : `yüzde ${Math.round(u.ilerleme)}`}</span>
          <div className="h-1 w-2/3 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-vurgu transition-[width]" style={{ width: `${u.ilerleme}%` }} /></div>
        </div>
      )}

      {/* Üst katman: degrade + bilgiler */}
      {!hata && !suruyor && (
        <>
          <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/70 transition-opacity", secili || ustunde ? "opacity-100" : "opacity-0")} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 opacity-0 transition-opacity group-hover/k:opacity-100">
            <p className="line-clamp-2 pr-14 text-[12.5px] font-medium leading-snug text-white">{u.meta?.hamIstem || u.prompt || u.baslik}</p>
            <p className="mt-0.5 truncate text-[11px] text-white/65">{u.model}</p>
          </div>
        </>
      )}

      {/* Rozetler */}
      <div className="pointer-events-none absolute right-2.5 top-2.5 flex items-center gap-1">
        {u.meta?.sure && (tur === "video" || sesli) && <span className="rounded-md bg-black/60 px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums text-white backdrop-blur">{u.meta.sure}</span>}
        {yukleme && <span className="flex h-6 w-6 items-center justify-center rounded-md bg-black/60 text-white backdrop-blur" title="Yükleme"><Upload className="h-3 w-3" /></span>}
        {tur !== "gorsel" && <span className={cn("flex h-6 w-6 items-center justify-center rounded-md ring-1 ring-inset backdrop-blur", IKON_KARO[T.renk], "bg-black/55")} title={T.ad}><T.ikon className="h-3 w-3" /></span>}
        {u.yayinda && <span className="rounded-md bg-vurgu px-1.5 py-0.5 text-[10px] font-bold text-vurgu-ust">Yayında</span>}
      </div>

      {/* Seçim kutusu */}
      {!suruyor && (
        <button onClick={(e) => { e.stopPropagation(); o.onSec(u, e); }} aria-label={secili ? "Seçimi kaldır" : "Seç"}
          className={cn("absolute left-2.5 top-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all",
            secili ? "border-vurgu bg-vurgu text-white" : cn("border-white/80 bg-black/30 text-transparent backdrop-blur", secimModu ? "opacity-100" : "opacity-0 group-hover/k:opacity-100 group-focus-visible/k:opacity-100"))}>
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </button>
      )}

      {/* Oynat (ses / müzik) */}
      {sesli && !hata && !suruyor && (
        <button onClick={(e) => { e.stopPropagation(); if (e.ctrlKey || e.metaKey || e.shiftKey || secimModu) o.onSec(u, e); else o.onCal(u); }} aria-label={calan ? "Duraklat" : "Oynat"}
          className={cn("absolute left-1/2 top-[42%] z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-zemin transition-transform hover:scale-105", !u.sesUrl && "opacity-60")}>
          {calan ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
        </button>
      )}

      {/* Alt köşe eylemleri */}
      {!hata && !suruyor && !secimModu && (
        <div className="absolute bottom-2.5 right-2.5 z-10 flex gap-1 opacity-0 transition-opacity group-hover/k:opacity-100">
          <Tooltip label={u.favori ? "Favorilerden çıkar" : "Favorilere ekle"} side="top"><button onClick={(e) => { e.stopPropagation(); o.onFavori(u); }} aria-label={u.favori ? "Favorilerden çıkar" : "Favorilere ekle"} className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/55 text-white backdrop-blur hover:bg-black/75">
            <Star className={cn("h-3.5 w-3.5", u.favori && "fill-aksan text-aksan")} />
          </button></Tooltip>
          <IndirDugmesi u={u} side="top" className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/55 text-white backdrop-blur hover:bg-black/75" ikonSinif="h-3.5 w-3.5" />
          <Tooltip label="Daha fazla" side="top"><button onClick={(e) => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); o.onMenu(u, r.right - 220, r.top - 8); }} aria-label="Daha fazla" className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/55 text-white backdrop-blur hover:bg-black/75"><MoreHorizontal className="h-3.5 w-3.5" /></button></Tooltip>
        </div>
      )}
      {u.favori && !ustunde && !secili && !hata && !suruyor && <Star className="pointer-events-none absolute bottom-2.5 right-2.5 h-4 w-4 fill-aksan text-aksan" />}
    </div>
  );
});

/** Liste satırı (ses ve müzik için de en verimli görünüm). */
export const VarlikSatiri = memo(function VarlikSatiri({ u, secili, secimModu, calan, ilerleme, ...o }: {
  u: Uretim; secili: boolean; secimModu: boolean; calan: boolean; ilerleme: number;
} & KartOlaylari) {
  const tur = uretimTuru(u);
  const T = turBul(tur);
  const sesli = tur === "ses" || tur === "muzik";
  const hata = u.durum === "hata";
  const suruyor = u.durum === "isleniyor" || u.durum === "kuyrukta";
  const tarih = new Date(u.olusturma);
  return (
    <div data-varlik={u.id} data-durum={u.durum} onClick={(e) => o.onTikla(u, e)} onContextMenu={(e) => { e.preventDefault(); o.onMenu(u, e.clientX, e.clientY); }}
      tabIndex={0} role="button" aria-label={u.baslik}
      className={cn("group/s flex cursor-pointer select-none items-center gap-3 rounded-xl px-2 py-2 transition-colors", secili ? "bg-vurgu/15" : "hover:bg-white/[0.04]")}>
      <button onClick={(e) => { e.stopPropagation(); o.onSec(u, e); }} aria-label="Seç"
        className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-opacity", secili ? "border-vurgu bg-vurgu text-white" : cn("border-white/40 text-transparent", secimModu ? "opacity-100" : "opacity-0 group-hover/s:opacity-100"))}>
        <Check className="h-3 w-3" strokeWidth={3} />
      </button>
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg" style={{ background: kartArka(u) }}>
        {sesli && !hata && (
          <button onClick={(e) => { e.stopPropagation(); if (e.ctrlKey || e.metaKey || e.shiftKey || secimModu) o.onSec(u, e); else o.onCal(u); }} aria-label={calan ? "Duraklat" : "Oynat"} className="absolute inset-0 flex items-center justify-center bg-black/45 text-white">
            {calan ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
          </button>
        )}
        {suruyor && <span className="absolute inset-0 flex items-center justify-center bg-black/55"><Loader2 className="h-4 w-4 animate-spin text-white" /></span>}
        {hata && <span className="absolute inset-0 flex items-center justify-center bg-rose-950/70"><AlertTriangle className="h-4 w-4 text-rose-300" /></span>}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-white">{u.meta?.hamIstem || u.prompt || u.baslik}</p>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-metin-3">
          <T.ikon className="h-3 w-3 shrink-0" />{u.model}{u.arac ? ` · ${u.arac}` : ""}{u.favori && <Star className="h-3 w-3 shrink-0 fill-aksan text-aksan" />}
        </p>
      </div>
      {sesli && <div className="hidden w-[220px] shrink-0 lg:block"><SesDalgasi u={u} ilerleme={calan ? ilerleme : 0} kucuk /></div>}
      <span className="hidden w-[64px] shrink-0 text-right text-[12.5px] tabular-nums text-metin-3 md:block">{u.meta?.oran ?? "—"}</span>
      <span className="hidden w-[64px] shrink-0 text-right text-[12.5px] tabular-nums text-metin-3 md:block">{u.meta?.sure ?? "—"}</span>
      <span className="hidden w-[96px] shrink-0 text-right text-[12.5px] tabular-nums text-metin-3 sm:block">{tarih.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</span>
      <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover/s:opacity-100">
        <Tooltip label={u.favori ? "Favorilerden çıkar" : "Favorilere ekle"} side="top"><button onClick={(e) => { e.stopPropagation(); o.onFavori(u); }} aria-label={u.favori ? "Favorilerden çıkar" : "Favorilere ekle"} className="flex h-8 w-8 items-center justify-center rounded-lg text-metin-2 hover:bg-white/[0.06] hover:text-white"><Star className={cn("h-4 w-4", u.favori && "fill-aksan text-aksan")} /></button></Tooltip>
        <IndirDugmesi u={u} side="top" className="flex h-8 w-8 items-center justify-center rounded-lg text-metin-2 hover:bg-white/[0.06] hover:text-white" />
        <button onClick={(e) => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); o.onMenu(u, r.right - 220, r.bottom + 4); }} title="Daha fazla" aria-label="Daha fazla" className="flex h-8 w-8 items-center justify-center rounded-lg text-metin-2 hover:bg-white/[0.06] hover:text-white"><MoreHorizontal className="h-4 w-4" /></button>
      </div>
    </div>
  );
});
