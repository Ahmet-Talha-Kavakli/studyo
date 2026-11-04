"use client";

import { useState } from "react";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { Rewind, Clapperboard, Download, FastForward, Heart, Play, RotateCcw, SwitchCamera, Trash2, Wand2, XCircle, Maximize2, ListPlus, ListCheck } from "lucide-react";
import { cn, saltUrl } from "@/lib/utils";
import type { Uretim } from "@/store/useProjeler";
import { uretimIptal, uretimSirasi } from "@/lib/uretimMotoru";
import { UretimYukleniyor } from "@/components/studyo/UretimYukleniyor";
import { MarkaKare } from "@/components/studyo/hf";
import { Tooltip } from "@/components/ui/Tooltip";
import { hareketAdi, oranDegeri } from "../video/veri";
import { kameraOzet, kurulumTamamla } from "./veri";

/**
 * Sinema akışındaki kart: anahtar kare (görsel) ya da çekim (video). Sırada/üretiliyor, başarısız
 * ve hazır durumları var. Karede asıl eylem "Canlandır", çekimde "Son kareden devam".
 * Bütün eylemler gerçek düğmedir; klavye odağında da görünür.
 */
export function SinemaKart({ u, secili, secimModu, sahnede, onAc, onSecim, onBegen, onIndir, onKurulum, onCanlandir, onAcilar, onDevam, onOncesi, onBuyut, onSahne, onSonHal, sonHalKredi, onYenidenDene, onSil }: {
  u: Uretim; secili: boolean; secimModu: boolean; sahnede: boolean;
  onAc: () => void; onSecim: () => void; onBegen: () => void; onIndir: () => void; onKurulum: () => void;
  onCanlandir?: () => void; onAcilar?: () => void; onDevam?: () => void; onBuyut?: () => void;
  onSahne: () => void; onOncesi?: () => void; onSonHal?: () => void; sonHalKredi?: string;
  onYenidenDene: () => void; onSil: () => void;
}) {
  const [oynat, setOynat] = useState(false);
  const video = u.tur === "video";
  const bitti = u.durum === "tamam";
  const hata = u.durum === "hata";
  const suruyor = !bitti && !hata;
  const poster = saltUrl(u.gorselUrl);
  const ikonBtn = "flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-inset ring-white/10 backdrop-blur-md transition-colors hover:bg-black/75";
  const hareket = u.meta?.hareket && u.meta.hareket !== "GENEL" ? hareketAdi(u.meta.hareket.split(" + ")[0]) + (u.meta.hareket.includes(" + ") ? " +" : "") : null;
  const kz = u.meta?.kurulum ? kameraOzet(kurulumTamamla(u.meta.kurulum)) : "";
  const kurulum = kz && kz !== "Oto" ? kz : null;
  const taslak = !!u.meta?.taslak;
  const goster = "opacity-0 transition-opacity duration-200 group-focus-within/kart:opacity-100 group-hover/kart:opacity-100 max-md:opacity-100";

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
          <button type="button" onClick={secimModu ? onSecim : onAc} className="absolute inset-0 block h-full w-full" aria-label={`${video ? "Çekimi" : "Kareyi"} aç: ${u.baslik}`}>
            {poster
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={poster} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              : <span className="absolute inset-0 bg-gradient-to-br from-[#1a1a1e] to-[#101012]" />}
            {video && u.videoUrl && oynat && <video src={u.videoUrl} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />}
          </button>
          {video && u.videoUrl && !oynat && !(taslak && onSonHal) && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 ring-1 ring-inset ring-white/15 backdrop-blur-md transition-transform duration-300 group-hover/kart:scale-110"><Play className="h-4 w-4 translate-x-px fill-white text-white" /></span>
            </span>
          )}
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition-opacity duration-300 group-focus-within/kart:opacity-100 group-hover/kart:opacity-100" />

          {/* Alt: bilgi ve asıl eylem */}
          <span className="absolute inset-x-2.5 bottom-2.5 flex items-end justify-between gap-2">
            <span className={cn("pointer-events-none min-w-0", goster, "max-md:hidden")}>
              <span className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-white/85">
                <span className="[&>span]:!h-4 [&>span]:!w-4 [&>span]:!rounded"><MarkaKare ad={u.model} boyut={16} /></span>
                <span className="truncate">{u.model}{hareket && <span className="text-white/55"> · {hareket}</span>}</span>
              </span>
              {kurulum && <span className="block truncate text-[11px] text-white/60">{kurulum}</span>}
              <span className="block truncate text-[12.5px] font-medium text-white">{u.baslik}</span>
            </span>
            <span className="ml-auto flex shrink-0 items-center gap-1">
              {taslak && <span className="rounded-md bg-white/90 px-1.5 py-0.5 text-[10.5px] font-semibold text-[#0a0a0b]" title={`Taslak, istenen ${u.meta?.taslak?.cozunurluk ?? ""}`}>Taslak</span>}
              {video && u.meta?.sure && <span className="rounded-md bg-black/60 px-1.5 py-0.5 text-[10.5px] font-medium tabular-nums text-white/90 backdrop-blur">{u.meta.sure.replace("sn", " sn")}</span>}
              {!video && onCanlandir && (
                <button onClick={onCanlandir} className={cn("flex h-8 items-center gap-1.5 rounded-full bg-white pl-2.5 pr-3 text-[12.5px] font-semibold text-[#0a0a0b] transition-transform hover:-translate-y-px", goster)}>
                  <Clapperboard className="h-3.5 w-3.5" />Canlandır
                </button>
              )}
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
          {sahnede && !secimModu && (
            <span className="pointer-events-none absolute left-2 top-2 flex h-6 items-center gap-1 rounded-full bg-black/55 px-2 text-[11px] font-semibold text-white backdrop-blur transition-opacity group-hover/kart:opacity-0">
              <ListCheck className="h-3 w-3" />Sahnede
            </span>
          )}

          {/* Hızlı eylemler */}
          <span className="absolute right-2 top-2 z-10 flex items-center gap-1.5">
            <span className={cn("flex items-center gap-1.5", goster)}>
              <Tooltip label={sahnede ? "Sahneden çıkar" : "Sahneye ekle"} side="bottom">
                <button onClick={onSahne} aria-pressed={sahnede} className={cn(ikonBtn, sahnede && "bg-white text-[#0a0a0b] hover:bg-white/90")} aria-label={sahnede ? "Sahneden çıkar" : "Sahneye ekle"}>{sahnede ? <ListCheck className="h-3.5 w-3.5" /> : <ListPlus className="h-3.5 w-3.5" />}</button>
              </Tooltip>
              <Tooltip label="Bu kurulumla üret" side="bottom"><button onClick={onKurulum} className={ikonBtn} aria-label="Bu kurulumla üret"><Wand2 className="h-3.5 w-3.5" /></button></Tooltip>
              {onAcilar && <Tooltip label="Başka açılardan çek" side="bottom"><button onClick={onAcilar} className={ikonBtn} aria-label="Başka açılardan çek"><SwitchCamera className="h-3.5 w-3.5" /></button></Tooltip>}
              {onOncesi && <Tooltip label="Öncesini çek" side="bottom"><button onClick={onOncesi} className={ikonBtn} aria-label="Öncesini çek"><Rewind className="h-3.5 w-3.5" /></button></Tooltip>}
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
