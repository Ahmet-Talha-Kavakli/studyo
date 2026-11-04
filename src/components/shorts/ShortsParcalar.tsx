"use client";

/* Shorts stüdyosunun görsel parçaları: seçenek çipi (görselli açılır), bulunan an kartı,
   gerçek kare üstünde kadraj / format / altyazı önizlemeleri. */

import { useRef, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Yuzen } from "@/components/ui/Yuzen";
import { sureYaz, type AltyaziStil, type Yerlesim, type ShortsOran } from "./shortsMotor";

/** İstem kutusu çipi (büyük): diğer stüdyolardaki KCip ile aynı malzeme; menü başlık şeritli. */
export function Cip({ ikon, etiket, deger, children, genislik = 300, acik, setAcik, yukari = true, sag }: {
  ikon?: React.ReactNode; etiket: string; deger: React.ReactNode; children: React.ReactNode; genislik?: number; acik: boolean; setAcik: (v: boolean) => void; yukari?: boolean; sag?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button onClick={() => setAcik(!acik)} aria-expanded={acik} title={etiket}
        className={cn("flex h-12 shrink-0 items-center gap-2.5 rounded-full pl-1.5 pr-3.5 text-[13.5px] ring-1 ring-inset transition-[color,background-color,transform] active:scale-[0.97]",
          acik ? "bg-white/[0.12] text-metin ring-white/20" : "bg-white/[0.08] text-metin ring-transparent hover:bg-white/[0.13]")}>
        {ikon && <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.1] text-white/85">{ikon}</span>}
        <span className="flex max-w-[180px] flex-col items-start leading-tight"><span className="text-[11px] text-white/55">{etiket}</span><span className="max-w-full truncate whitespace-nowrap font-medium">{deger}</span></span>
      </button>
      <Yuzen acik={acik} onKapat={() => setAcik(false)} yerlesim={yukari ? "ust-sol" : "alt-sol"} bosluk={10} etiket={etiket}
        className="flex max-h-[min(72vh,620px)] flex-col overflow-hidden rounded-[18px] border border-white/[0.09] bg-[#1b1c1f]" style={{ width: `min(${genislik}px, calc(100vw - 24px))` }}>
        <div className="flex min-h-[44px] shrink-0 items-center gap-2 border-b border-white/[0.06] px-3.5 py-2"><span className="min-w-0 flex-1 text-[13.5px] font-semibold text-metin">{etiket}</span>{sag}</div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2 [scrollbar-width:thin]">{children}</div>
      </Yuzen>
    </div>
  );
}

/** Liste satırı (çip panelinde): seçili satır beyaz halkalı, tik yok. */
export function SecSatir({ secili, onClick, children, alt, on }: { secili: boolean; onClick: () => void; children: React.ReactNode; alt?: string; on?: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={secili} className={cn("flex w-full items-center gap-3 rounded-[12px] px-2.5 py-2 text-left ring-1 ring-inset transition-colors", secili ? "bg-white/[0.085] ring-white/60" : "ring-transparent hover:bg-white/[0.055]")}>
      {on}
      <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium text-metin">{children}</span>{alt && <span className="mt-0.5 block truncate text-[12px] text-metin-3">{alt}</span>}</span>
    </button>
  );
}

/** Altyazı stilinin örneği (gerçek kare üstünde). */
export function AltyaziOrnek({ s, vurgu, buyuk }: { s: AltyaziStil; vurgu: string; buyuk?: boolean }) {
  const b = buyuk ? "text-[17px]" : "text-[13px]";
  if (s === "yok") return <span className="text-[12px] font-medium text-white/70">Altyazısız</span>;
  if (s === "karaoke") return <span className={cn(b, "font-extrabold text-white [paint-order:stroke_fill] [-webkit-text-stroke:2.5px_#000]")}>Bu an <span style={{ color: vurgu }}>çok</span> iyi</span>;
  if (s === "tiktok") return <span className={cn(b, "font-black uppercase text-white [paint-order:stroke_fill] [-webkit-text-stroke:3px_#000]")}>Çok iyi</span>;
  if (s === "neon") return <span className={cn(b, "font-bold text-white")} style={{ textShadow: `0 0 8px ${vurgu}, 0 0 16px ${vurgu}` }}>Bu an çok iyi</span>;
  if (s === "altyazi") return <span className={cn("rounded bg-black/80 px-1.5 py-0.5 font-semibold text-white", buyuk ? "text-[14px]" : "text-[11.5px]")}>Bu an çok iyi</span>;
  return <span className={cn(b, "font-bold text-white")}>Bu an çok iyi</span>;
}

export const ALTYAZI_STILLERI: { id: AltyaziStil; ad: string; alt: string }[] = [
  { id: "karaoke", ad: "Karaoke", alt: "Sözcük vurgulu" }, { id: "tiktok", ad: "Kalın", alt: "Konturlu, büyük" }, { id: "neon", ad: "Neon", alt: "Parlayan" },
  { id: "altyazi", ad: "Klasik", alt: "Kutulu" }, { id: "sade", ad: "Sade", alt: "Gölgeli" }, { id: "yok", ad: "Kapalı", alt: "Altyazısız" },
];

/** Altyazı stili kartları (3 sütun). */
export function AltyaziIzgara({ deger, onSec, vurgu, kare }: { deger: AltyaziStil; onSec: (s: AltyaziStil) => void; vurgu: string; kare: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {ALTYAZI_STILLERI.map((s) => {
        const sec = deger === s.id;
        return (
          <button key={s.id} onClick={() => onSec(s.id)} aria-pressed={sec} className="group min-w-0 text-left">
            <span className="relative flex aspect-[4/5] items-end justify-center overflow-hidden rounded-[12px] pb-[22%]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={kare} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <span className="relative px-1 text-center leading-tight"><AltyaziOrnek s={s.id} vurgu={vurgu} /></span>
              <span className={cn("pointer-events-none absolute inset-0 rounded-[12px] ring-inset transition-[box-shadow]", sec ? "ring-[2.5px] ring-white" : "ring-1 ring-white/[0.1] group-hover:ring-white/30")} />
            </span>
            <span className={cn("mt-1.5 block truncate text-[12.5px] font-medium", sec ? "text-metin" : "text-metin-2")}>{s.ad}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Dikey kadraj seçeneğinin gerçek karedeki görünümü. */
export function KadrajOrnek({ kare, yerlesim, dikeyKaynak }: { kare: string; yerlesim: Yerlesim; dikeyKaynak?: boolean }) {
  return (
    <span className="relative block aspect-[9/16] overflow-hidden rounded-[10px] bg-black">
      {yerlesim === "bulanik" && /* eslint-disable-next-line @next/next/no-img-element */ <img src={kare} alt="" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-md" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={kare} alt="" className={cn("absolute inset-0 h-full w-full", yerlesim === "doldur" ? "object-cover" : dikeyKaynak ? "object-contain" : "object-contain")} />
    </span>
  );
}

export const KADRAJLAR: { id: Yerlesim; ad: string; alt: string }[] = [
  { id: "bulanik", ad: "Bulanık zemin", alt: "Tamamı görünür" }, { id: "doldur", ad: "Kırp", alt: "Ekranı doldurur" }, { id: "sigdir", ad: "Sığdır", alt: "Kenarlar boş" },
];
export const FORMATLAR: { id: ShortsOran; ad: string; alt: string }[] = [
  { id: "9:16", ad: "9:16", alt: "Shorts · Reels · TikTok" }, { id: "4:5", ad: "4:5", alt: "Instagram akışı" }, { id: "1:1", ad: "1:1", alt: "Kare gönderi" },
];
export const ORAN_KUTU: Record<ShortsOran, string> = { "9:16": "aspect-[9/16]", "4:5": "aspect-[4/5]", "1:1": "aspect-square" };

export type AnKartVeri = { id: string; url: string; bas: number; son: number; puan: number; kare?: string; kanca: string; neden: string; ad: string; /** Birleştirilmiş kaynakta parçanın başladığı an (gösterim için). */ ofset?: number };

/** Bulunan an: dikey kart; üzerine gelince o bölüm sessiz oynar. */
export function AnKart({ an, sira, enIyi, onAc, nedenGizle }: { an: AnKartVeri; sira: number; enIyi: boolean; onAc: () => void; /** Bütün kartlarda aynı gerekçe varsa tekrar yazılmaz. */ nedenGizle?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [oyna, setOyna] = useState(false);
  const renk = an.puan >= 80 ? "bg-emerald-400 text-[#052e1b]" : an.puan >= 55 ? "bg-white text-black" : "bg-black/60 text-white ring-1 ring-white/30";
  return (
    <button onClick={onAc} onPointerEnter={(e) => { if (e.pointerType === "mouse") setOyna(true); }} onPointerLeave={() => setOyna(false)}
      className="group relative block w-full overflow-hidden rounded-[18px] bg-[#111214] text-left ring-1 ring-inset ring-white/[0.08] transition duration-300 hover:-translate-y-1 hover:ring-white/25 active:scale-[0.98]">
      <span className="relative block aspect-[9/16] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {an.kare ? <img src={an.kare} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" /> : <span className="absolute inset-0 animate-pulse bg-white/[0.045]" />}
        {oyna && (
          <video ref={ref} src={`${an.url}#t=${an.bas.toFixed(2)},${an.son.toFixed(2)}`} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover"
            onTimeUpdate={(e) => { const v = e.currentTarget; if (v.currentTime >= an.son - 0.05) v.currentTime = an.bas; }} />
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/30" />
        <span className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
          {an.puan >= 0 && <span className={cn("flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[13px] font-bold tabular-nums", renk)} title="Bu videodaki diğer anlara göre güç skoru">{an.puan}</span>}
          {enIyi && <span className="rounded-full bg-black/60 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur max-sm:hidden">En güçlü</span>}
        </span>
        <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11.5px] font-medium tabular-nums text-white backdrop-blur"><Clock className="h-3 w-3" />{sureYaz(an.son - an.bas)}</span>
        <span className="absolute inset-x-3 bottom-3">
          <span className="line-clamp-2 text-[14.5px] font-semibold leading-snug text-white">{an.kanca}</span>
          <span className="mt-1 block truncate text-[12px] text-white/70">{sira}. an · {sureYaz(an.bas + (an.ofset ?? 0))}–{sureYaz(an.son + (an.ofset ?? 0))}</span>
          {!nedenGizle && <span className="mt-0.5 block truncate text-[12px] text-white/55">{an.neden}</span>}
          <span className="mt-2 flex h-8 translate-y-1 items-center justify-center rounded-full bg-white text-[12.5px] font-semibold text-black opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:none)]:hidden">Düzenle ve indir</span>
        </span>
      </span>
    </button>
  );
}
