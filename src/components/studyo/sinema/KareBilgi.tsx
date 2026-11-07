"use client";

/* Anahtar kare görüntüleyicisinin bilgi sekmesi: istem, model ve çekimin kamera kurulumu;
   altta asıl eylemler (canlandır, sahneye ekle, başka açılar, bu kurulumla üret). */

import { useState } from "react";
import { Clapperboard, Copy, CopyCheck, Download, Star, ListCheck, ListPlus, Quote, SwitchCamera, Trash2 } from "lucide-react";
import { IndirDugmesi } from "@/components/galeri/IndirMenusu";
import { KlasoreTasiDugmesi } from "@/components/galeri/Klasorler";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";
import { mesaj } from "@/lib/mesaj";
import type { Uretim } from "@/store/useProjeler";
import { MarkaKare } from "@/components/studyo/hf";
import { kurulumSatirlari, kurulumTamamla } from "./veri";

/** Başlık şeritli bilgi kartı. */
function Kart({ baslik, sag, children }: { baslik: React.ReactNode; sag?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex min-h-[38px] items-center gap-2 border-b border-white/[0.06] px-3 py-2"><span className="min-w-0 flex-1 text-[13px] font-semibold text-metin">{baslik}</span>{sag}</div>
      {children}
    </section>
  );
}

export function KareBilgi({ u, ekBilgi, sahnede, onCanlandir, onSahne, onAcilar, onKurulum, onIndir: _onIndir, onBegen, onSil }: {
  u: Uretim; sahnede: boolean; ekBilgi?: React.ReactNode;
  onCanlandir: () => void; onSahne: () => void; onAcilar: () => void; onKurulum: () => void; onIndir: () => void; onBegen: () => void; onSil: () => void;
}) {
  const [kopyalandi, setKopyalandi] = useState(false);
  const istem = ((u.meta?.hamIstem as string | undefined) ?? u.prompt ?? "").trim();
  const satirlar = u.meta?.kurulum ? kurulumSatirlari(kurulumTamamla(u.meta.kurulum)) : [];
  const ikincil = "flex h-10 items-center justify-center gap-2 rounded-full bg-white/[0.05] text-[13px] font-medium text-metin ring-1 ring-inset ring-white/[0.08] transition-[background-color,transform] hover:bg-white/[0.09] active:scale-[0.97]";
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3 [scrollbar-width:thin]">
        {u.gercek === false && <p className="rounded-[12px] bg-amber-300/[0.07] px-3 py-2.5 text-[12px] leading-snug text-amber-100/90 ring-1 ring-inset ring-amber-200/15">Demo kare: sağlayıcı bağlı olmadığı için örnek gösteriliyor, kredi düşmedi.</p>}
        {istem && (
          <Kart baslik="İstem" sag={
            <button onClick={() => { void mesaj.kopyala(istem, "İstem").then((ok) => { if (!ok) return; setKopyalandi(true); setTimeout(() => setKopyalandi(false), 1400); }); }}
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium text-metin-2 transition-colors hover:bg-white/[0.06] hover:text-metin">{kopyalandi ? <CopyCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{kopyalandi ? "Kopyalandı" : "Kopyala"}</button>}>
            <p className="px-3 py-2.5 text-[13px] leading-relaxed text-metin-2">{istem}</p>
          </Kart>
        )}
        {ekBilgi}
        <Kart baslik="Model" sag={u.meta?.oran ? <span className="text-[12px] tabular-nums text-metin-3">{u.meta.oran}{u.meta.cozunurluk ? ` · ${u.meta.cozunurluk}` : ""}</span> : undefined}>
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <MarkaKare ad={u.model} boyut={30} />
            <p className="min-w-0 text-[13.5px] font-semibold text-metin">{u.model}</p>
          </div>
        </Kart>
        <Kart baslik="Yönetmen kurulumu" sag={!satirlar.length ? <span className="text-[12px] text-metin-3">Hepsi otomatik</span> : undefined}>
          {satirlar.length ? (
            <dl className="grid grid-cols-2 gap-px bg-white/[0.05]">
              {satirlar.map(([e, d]) => (
                <div key={e} className="bg-[#141416] px-3 py-2">
                  <dt className="text-[11px] font-medium text-metin-3">{e}</dt>
                  <dd className="text-[12.5px] font-semibold leading-snug text-metin">{d}</dd>
                </div>
              ))}
              {satirlar.length % 2 === 1 && <div className="bg-[#141416]" />}
            </dl>
          ) : <p className="px-3 py-2.5 text-[12.5px] text-metin-2">Kamera, ışık ve rengi sahne belirledi. Bu kurulumla düğmesiyle aynı görünümü yeni bir kareye taşıyabilirsin.</p>}
        </Kart>
      </div>
      <div className="space-y-2 border-t border-white/[0.06] p-3">
        <button onClick={onCanlandir} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white text-[14px] font-semibold text-[#0a0a0b] transition-transform hover:-translate-y-px active:scale-[0.98]"><Clapperboard className="h-4 w-4" />Canlandır</button>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onSahne} aria-pressed={sahnede} className={cn(ikincil, sahnede && "bg-white/[0.1] ring-white/40")}>{sahnede ? <ListCheck className="h-4 w-4" /> : <ListPlus className="h-4 w-4" />}{sahnede ? "Sahnede" : "Sahneye ekle"}</button>
          <button onClick={onAcilar} className={ikincil}><SwitchCamera className="h-4 w-4" />Başka açılar</button>
          <button onClick={onKurulum} className={ikincil}><Quote className="h-4 w-4" />Yeniden kullan</button>
          <div className="min-w-0 [&_span]:flex [&_span]:w-full"><IndirDugmesi u={u} side="top" yerlesim="ust-sol" className={cn(ikincil, "w-full")}><Download className="h-4 w-4" />İndir</IndirDugmesi></div>
        </div>
        <div className="flex gap-2">
          <button onClick={onBegen} aria-pressed={!!u.favori} className={cn(ikincil, "flex-1")}><Star className={cn("h-4 w-4", u.favori && "fill-aksan text-aksan")} />{u.favori ? "Favorilerde" : "Favorilere ekle"}</button>
          <Tooltip label="Klasöre taşı" side="top"><KlasoreTasiDugmesi uretimIdler={[u.id]} etiketSinif="sr-only" yerlesim="ust-sag" className={cn(ikincil, "w-10 px-0")} /></Tooltip>
          <Tooltip label="Sil" side="top"><button onClick={onSil} aria-label="Sil" className={cn(ikincil, "w-10 hover:text-rose-300")}><Trash2 className="h-4 w-4" /></button></Tooltip>
        </div>
      </div>
    </div>
  );
}
