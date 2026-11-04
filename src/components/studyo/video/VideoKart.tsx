"use client";

import { useState } from "react";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { Download, FastForward, Heart, Play, RotateCcw, Trash2, Wand2, XCircle, Maximize2 } from "lucide-react";
import { cn, saltUrl } from "@/lib/utils";
import type { Uretim } from "@/store/useProjeler";
import { uretimIptal, uretimSirasi } from "@/lib/uretimMotoru";
import { UretimYukleniyor } from "@/components/studyo/UretimYukleniyor";
import { MarkaKare } from "@/components/studyo/hf";
import { Tooltip } from "@/components/ui/Tooltip";
import { hareketAdi, oranDegeri } from "./veri";

/**
 * Akıştaki video kartı. Durumlar: sırada/üretiliyor (ortak yükleme kartı, iptal), başarısız
 * (kredi iadesi, tekrar dene, sil) ve hazır (poster; fareyle üzerine gelince sessiz oynar).
 * Bütün eylemler gerçek düğmedir; klavye odağında da görünür.
 */
export function VideoKart({ u, secili, secimModu, onAc, onSecim, onBegen, onIndir, onAyar, onBuyut, onDevam, onSonHal, sonHalKredi, onYenidenDene, onSil, demoGizle }: {
  u: Uretim; secili: boolean; secimModu: boolean;
  /** Demo rozetini gizle (demo bilgisi sayfada tek yerde gösteriliyorsa). */
  demoGizle?: boolean;
  onAc: () => void; onSecim: () => void; onBegen: () => void; onIndir: () => void; onAyar: () => void;
  /** Gerçek videoda büyütme köprüsü (demo karede yok). */
  onBuyut?: () => void;
  /** Son karesinden devam (uzatma modunu bu videoyla açar). */
  onDevam?: () => void;
  /** Taslağı istenen kalitede yeniden üretir. */
  onSonHal?: () => void; sonHalKredi?: string;
  onYenidenDene: () => void; onSil: () => void;
}) {
  const [oynat, setOynat] = useState(false);
  const bitti = u.durum === "tamam";
  const hata = u.durum === "hata";
  const suruyor = !bitti && !hata;
  const poster = saltUrl(u.gorselUrl);
  const ikonBtn = "flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-inset ring-white/10 backdrop-blur-md transition-colors hover:bg-black/75";
  const hareket = u.meta?.hareket && u.meta.hareket !== "GENEL" ? hareketAdi(u.meta.hareket) : null;
  const taslak = !!u.meta?.taslak;

  return (
    <div className="group/kart relative overflow-hidden rounded-[16px] bg-[#111113] ring-1 ring-inset ring-white/[0.06]" style={{ aspectRatio: String(oranDegeri(u.meta?.oran)) }}
      onPointerEnter={(e) => { if (e.pointerType === "mouse") setOynat(true); }} onPointerLeave={() => setOynat(false)}>
      {suruyor && (
        <>
          {u.meta?.gorselUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={u.meta.gorselUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-xl" />
          )}
          <UretimYukleniyor u={u} siraNo={uretimSirasi(u.id) || undefined} onIptal={() => uretimIptal(u.id)} />
        </>
      )}

      {hata && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
          <span className="flex items-center gap-1.5 text-[13px] font-semibold text-rose-200"><XCircle className="h-4 w-4" />Üretilemedi</span>
          <span className="line-clamp-2 max-w-[90%] text-[12px] text-metin-3">{u.hata ?? "Sağlayıcı hata döndürdü."} Kredin iade edildi.</span>
          <span className="flex items-center gap-2">
            <button onClick={onYenidenDene} className="flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-[#0a0a0b]"><RotateCcw className="h-3.5 w-3.5" />Tekrar dene</button>
            <button onClick={onSil} className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[12.5px] font-medium text-metin ring-1 ring-inset ring-white/10 hover:bg-white/[0.12]"><Trash2 className="h-3.5 w-3.5" />Sil</button>
          </span>
        </div>
      )}

      {bitti && (
        <>
          <button type="button" onClick={secimModu ? onSecim : onAc} className="absolute inset-0 block h-full w-full" aria-label={`Videoyu aç: ${u.baslik}`}>
            {poster
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={poster} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              : <span className="absolute inset-0 bg-gradient-to-br from-[#1a1a1e] to-[#101012]" />}
            {u.videoUrl && oynat && <video src={u.videoUrl} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />}
          </button>
          {u.videoUrl && !oynat && !(taslak && onSonHal) && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 ring-1 ring-inset ring-white/15 backdrop-blur-md transition-transform duration-300 group-hover/kart:scale-110"><Play className="h-4 w-4 translate-x-px fill-white text-white" /></span>
            </span>
          )}
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 to-transparent opacity-0 transition-opacity duration-300 group-focus-within/kart:opacity-100 group-hover/kart:opacity-100" />
          <span className="pointer-events-none absolute inset-x-2.5 bottom-2.5 flex items-end justify-between gap-2">
            <span className="min-w-0">
              <span className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-white/85 opacity-0 transition-opacity group-focus-within/kart:opacity-100 group-hover/kart:opacity-100">
                <span className="[&>span]:!h-4 [&>span]:!w-4 [&>span]:!rounded"><MarkaKare ad={u.model} boyut={16} /></span>{u.model}{hareket && <span className="text-white/55">· {hareket}</span>}
              </span>
              <span className="block truncate text-[12.5px] font-medium text-white opacity-0 transition-opacity group-focus-within/kart:opacity-100 group-hover/kart:opacity-100">{u.baslik}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1">
              {taslak && <span className="rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-[#0a0a0b]" title={`Taslak · istenen ${u.meta?.taslak?.cozunurluk ?? ""}`}>TASLAK</span>}
              
              {u.meta?.sure && <span className="rounded-md bg-black/60 px-1.5 py-0.5 text-[10.5px] font-medium tabular-nums text-white/90 backdrop-blur">{u.meta.sure.replace("sn", " sn")}</span>}
            </span>
          </span>
          {taslak && onSonHal && (
            <button onClick={onSonHal} className="absolute left-1/2 top-1/2 z-10 flex h-9 -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-[#0a0a0b] opacity-0 transition-opacity focus-visible:opacity-100 group-hover/kart:opacity-100 max-md:opacity-100">
              <KrediYildiz className="h-3.5 w-3.5" />Son hâline getir{sonHalKredi && <span className="rounded-full bg-black/10 px-1.5 py-px text-[11px] tabular-nums">{sonHalKredi}</span>}
            </button>
          )}
          {/* Seçim */}
          <button onClick={onSecim} aria-label={secili ? "Seçimi kaldır" : "Seç"} aria-pressed={secili}
            className={cn("absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 backdrop-blur-sm transition-opacity",
              secili ? "border-white bg-white/25 opacity-100" : cn("border-white/75 bg-black/20", secimModu ? "opacity-100" : "opacity-0 focus-visible:opacity-100 group-hover/kart:opacity-100"))}>
            {secili && <span className="h-2.5 w-2.5 rounded-full bg-white" />}
          </button>
          {/* Hızlı eylemler */}
          <span className="absolute right-2 top-2 z-10 flex items-center gap-1.5">
            <span className="flex items-center gap-1.5 opacity-0 transition-opacity group-focus-within/kart:opacity-100 group-hover/kart:opacity-100">
              <Tooltip label="Bu ayarlarla üret" side="bottom"><button onClick={onAyar} className={ikonBtn} aria-label="Bu ayarlarla üret"><Wand2 className="h-3.5 w-3.5" /></button></Tooltip>
              {onDevam && <Tooltip label="Son kareden devam" side="bottom"><button onClick={onDevam} className={ikonBtn} aria-label="Son kareden devam"><FastForward className="h-3.5 w-3.5" /></button></Tooltip>}
              {onBuyut && <Tooltip label="Büyüt" side="bottom"><button onClick={onBuyut} className={ikonBtn} aria-label="Büyüt"><Maximize2 className="h-3.5 w-3.5" /></button></Tooltip>}
              <Tooltip label="İndir" side="bottom"><button onClick={onIndir} className={ikonBtn} aria-label="İndir"><Download className="h-3.5 w-3.5" /></button></Tooltip>
            </span>
            <Tooltip label={u.favori ? "Beğeniyi kaldır" : "Beğen"} side="bottom">
              <button onClick={onBegen} aria-pressed={!!u.favori} aria-label={u.favori ? "Beğeniyi kaldır" : "Beğen"}
                className={cn(ikonBtn, !u.favori && "opacity-0 focus-visible:opacity-100 group-hover/kart:opacity-100")}>
                <Heart className={cn("h-3.5 w-3.5", u.favori && "fill-rose-400 text-rose-400")} />
              </button>
            </Tooltip>
          </span>
        </>
      )}
    </div>
  );
}
