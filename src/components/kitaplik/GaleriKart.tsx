"use client";

/**
 * Kitaplık galeri kartı — stüdyo galerilerinin AYNI kartları:
 *  görsel/3D → Görsel stüdyosu kartı (4px köşe, vignette, Demo rozeti, seçim kutusu, KartAraclari rayı),
 *  video → Video stüdyosunun VideoKart'ı, süren iş → UretimYukleniyor,
 *  ses/müzik → aynı dilde dalga formlu karo.
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { Box, Info, MoreHorizontal, Pause, Play, RotateCcw, Star, Trash2, XCircle } from "lucide-react";
import { IndirDugmesi } from "@/components/galeri/IndirMenusu";
import { FavoriDugmesi } from "@/components/galeri/KartEylemleri";
import { Tooltip } from "@/components/ui/Tooltip";
import type { Uretim } from "@/store/useProjeler";
import { uretimIptal, uretimSirasi } from "@/lib/uretimMotoru";
import { INDIRME_FORMATLARI, gorseliFormatlaIndir, cn } from "@/lib/utils";
import { UretimYukleniyor } from "@/components/studyo/UretimYukleniyor";
import { KartAraclari } from "@/components/studyo/gorsel/KartAraclari";
import { VideoKart } from "@/components/studyo/video/VideoKart";
import { oranSayi } from "@/components/panel/UretimKarti";
import { dalga, kapakUrl, uretimTuru } from "./yardimci";

export interface GaleriOlaylari {
  onAc: (u: Uretim) => void;
  onSec: (u: Uretim, e: React.MouseEvent) => void;
  onBegen: (u: Uretim) => void;
  onIndir: (u: Uretim) => void;
  onMenu: (u: Uretim, x: number, y: number) => void;
  onCal: (u: Uretim) => void;
  onStudyo: (u: Uretim) => void;
  onReferans: (u: Uretim) => void;
  onAnimate: (u: Uretim) => void;
  on3d: (u: Uretim) => void;
  onElement: (u: Uretim) => void;
  onYayinla: (u: Uretim) => void;
  onSil: (u: Uretim) => void;
  projeler: { id: string; ad: string; adet: number }[];
  onProjeyeEkle: (u: Uretim, projeId: string) => void;
  onYeniProje: (u: Uretim) => void;
}

const SecimKutusu = ({ secili, onClick }: { secili: boolean; onClick: (e: React.MouseEvent) => void }) => (
  <button onClick={(e) => { e.stopPropagation(); onClick(e); }} aria-label={secili ? "Seçimi kaldır" : "Seç"}
    className={cn("absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 backdrop-blur-sm transition-all active:scale-90",
      secili ? "border-white bg-white/25 opacity-100" : "pointer-events-none border-white/75 bg-black/20 opacity-0 group-hover:pointer-events-auto group-hover:opacity-100")}>
    {secili && <span className="h-2.5 w-2.5 rounded-full bg-white" />}
  </button>
);

export const GaleriKart = memo(function GaleriKart({ u, secili, secimModu, calan, ilerleme, copKalan, o, oran }: {
  u: Uretim; secili: boolean; secimModu: boolean; calan: boolean; ilerleme: number; copKalan?: number; o: GaleriOlaylari;
  /** Görünüm ayarının kart oranı (yatay ya da dikey); verilmezse üretimin kendi oranı. */
  oran?: number;
}) {
  const tur = uretimTuru(u);
  const bitti = u.durum === "tamam";
  const hata = u.durum === "hata";
  const sec = (e: React.MouseEvent) => o.onSec(u, e);
  /* Seçim modunda karta tıklamak seçer; değilse açar (stüdyo davranışı). */
  const tikla = (e: React.MouseEvent) => (secimModu || e.shiftKey || e.metaKey || e.ctrlKey ? sec(e) : o.onAc(u));
  const sag = (e: React.MouseEvent) => { if (!bitti) return; e.preventDefault(); o.onMenu(u, e.clientX, e.clientY); };
  const kalan = copKalan !== undefined && <span className="pointer-events-none absolute bottom-2 right-2 z-10 rounded-md bg-black/70 px-1.5 py-0.5 text-[10.5px] font-medium text-white backdrop-blur">{copKalan} gün kaldı</span>;

  if (tur === "video" && (bitti || hata)) {
    return (
      <div data-varlik={u.id} onContextMenu={sag} onClickCapture={(e) => { if (secimModu || e.shiftKey || e.metaKey || e.ctrlKey) { e.stopPropagation(); e.preventDefault(); sec(e); } }} className="relative">
        <VideoKart u={u} oran={oran} secili={secili} secimModu={secimModu} demoGizle
          onAc={() => o.onAc(u)} onSecim={() => o.onSec(u, { shiftKey: false } as React.MouseEvent)} onBegen={() => o.onBegen(u)} onIndir={() => o.onIndir(u)} onAyar={() => o.onStudyo(u)}
          onYenidenDene={() => o.onStudyo(u)} onSil={() => o.onSil(u)} />
        {secili && <span className="pointer-events-none absolute inset-0 z-20 rounded-[16px] ring-2 ring-inset ring-white" />}
        {kalan}
      </div>
    );
  }

  const sesli = tur === "ses" || tur === "muzik";
  const kapak = kapakUrl(u);
  /* Kapak <img loading="lazy">: ekran dışındaki görseller indirilip çözülmez (CSS arka planı hepsini birden çözüyordu). */
  const arka = kapak ? "#141518" : u.gorselUrl && !/^(data:|https?:|\/)/.test(u.gorselUrl) ? u.gorselUrl : "linear-gradient(135deg,#1a1725,#12101a)";

  return (
    <motion.div data-varlik={u.id} data-durum={u.durum} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
      onContextMenu={sag} className="group relative block overflow-hidden rounded-[4px]">
      <button type="button" onClick={tikla} disabled={!bitti && !hata}
        className={cn("relative block w-full", bitti ? "cursor-pointer" : "cursor-default")}
        style={{ aspectRatio: String(oran ?? (sesli ? 4 / 3 : oranSayi(u))), background: hata ? "linear-gradient(135deg,#181818,#0f1113)" : sesli ? undefined : arka }}
        aria-label={bitti ? `${u.baslik} aç` : hata ? "Üretim başarısız" : "Üretiliyor"}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {kapak && !sesli && !hata && <img src={kapak} alt="" loading="lazy" decoding="async" draggable={false} className="absolute inset-0 h-full w-full object-cover" />}
        {sesli && bitti && (
          <span className="absolute inset-0 flex flex-col justify-end overflow-hidden" style={{ background: kapak ? undefined : "radial-gradient(90% 80% at 15% 0%, rgba(255,255,255,0.08), transparent 70%), #141518" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {kapak && <><img src={kapak} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-[2px]" /><span className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80" /></>}
            <span className="relative px-3 pb-9 text-left">
              <span className="line-clamp-2 text-[13px] font-medium leading-snug text-white">{u.baslik || u.prompt}</span>
              <span className="mt-2 flex h-9 items-center gap-[2px]">
                {dalga(u.id + u.prompt, 40).map((v, i, d) => <span key={i} className={cn("flex-1 rounded-full", calan && i / d.length < ilerleme ? "bg-white" : "bg-white/35")} style={{ height: `${v * 100}%` }} />)}
              </span>
            </span>
          </span>
        )}
        {!bitti && !hata && <UretimYukleniyor u={u} siraNo={uretimSirasi(u.id) || undefined} onIptal={() => uretimIptal(u.id)} />}
        {hata && (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <span className="flex flex-wrap items-center justify-center gap-2">
              <span className="glass-cip flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-white"><XCircle className="h-4 w-4" />{u.hata === "İptal edildi" ? "İptal edildi" : "Başarısız"}</span>
              <span className="glass-cip flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-white"><Info className="h-4 w-4" />Kredi iade edildi</span>
            </span>
            <span className="line-clamp-3 text-[12px] leading-snug text-metin-3">{u.hata && u.hata !== "İptal edildi" ? u.hata : "Tekrar dene ya da istemini değiştir."}</span>
            <span className="flex items-center gap-2">
              <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); o.onStudyo(u); }} className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-zemin transition-transform hover:scale-105"><RotateCcw className="h-3.5 w-3.5" />Tekrar dene</span>
              <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); o.onSil(u); }} className="hf-btn glass-cip flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold text-white"><Trash2 className="h-3.5 w-3.5" />Sil</span>
            </span>
          </span>
        )}
      </button>

      {bitti && (
        <>
          <span className="uretim-vignette" />
          {tur === "3d" && <span className="pointer-events-none absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10.5px] font-medium text-white backdrop-blur group-hover:opacity-0"><Box className="h-3 w-3" />3D</span>}
          {u.favori && !secimModu && sesli && <Star className="pointer-events-none absolute bottom-2 right-2 z-10 h-4 w-4 fill-aksan text-aksan transition-opacity group-hover:opacity-0" />}
          <SecimKutusu secili={secili} onClick={sec} />
          {sesli ? (
            <span className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button onClick={(e) => { e.stopPropagation(); o.onCal(u); }} title={calan ? "Duraklat" : "Oynat"} aria-label={calan ? "Duraklat" : "Oynat"} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#111] transition-transform hover:scale-105">{calan ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />}</button>
              <FavoriDugmesi favori={!!u.favori} onClick={() => o.onBegen(u)} side="bottom" />
              <IndirDugmesi u={u} side="bottom" className="glass-cip flex h-8 w-8 items-center justify-center rounded-full text-white" ikonSinif="h-3.5 w-3.5" />
              <Tooltip label="Daha fazla" side="bottom"><button onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); o.onMenu(u, r.right - 220, r.bottom + 4); }} aria-label="Daha fazla" className="glass-cip flex h-8 w-8 items-center justify-center rounded-full text-white"><MoreHorizontal className="h-3.5 w-3.5" /></button></Tooltip>
            </span>
          ) : !secimModu && (
            <KartAraclari
              begenili={!!u.favori} onBegen={() => o.onBegen(u)} onIndir={() => o.onIndir(u)} onAc={() => o.onAc(u)}
              gorselUrl={kapak} onYenidenUret={() => o.onStudyo(u)} onKopyala={() => o.onStudyo(u)}
              onReferans={kapak ? () => o.onReferans(u) : undefined} onAnimate={kapak ? () => o.onAnimate(u) : undefined}
              on3d={kapak && tur !== "3d" ? () => o.on3d(u) : undefined} onElement={kapak ? () => o.onElement(u) : undefined}
              onYayinla={() => o.onYayinla(u)} onSil={() => o.onSil(u)}
              uretim={u} klasorAdi="proje" klasorler={o.projeler} onKlasoreEkle={(id) => o.onProjeyeEkle(u, id)} onYeniKlasor={() => o.onYeniProje(u)}
              indirmeFormatlari={kapak ? [...INDIRME_FORMATLARI] : undefined} onFormatIndir={kapak ? (f) => void gorseliFormatlaIndir(kapak, u.baslik || "vayra-gorsel", f) : undefined}
            />
          )}
          {kalan}
        </>
      )}
      {secili && <span className="pointer-events-none absolute inset-0 z-20 rounded-[4px] ring-2 ring-inset ring-white" />}
    </motion.div>
  );
});
