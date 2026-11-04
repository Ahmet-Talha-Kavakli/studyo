"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Uretim } from "@/store/useProjeler";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { cn } from "@/lib/utils";

/**
 * Üretim sürerken galerideki kart. Gerçek ilerleme sağlayıcıdan gelmediği için yüzde
 * gösterilmez; ilerleme çubuğu geçen süreyi tahmini süreye oranlar ve %92'de bekler
 * (bitince kart sonuçla değişir). Kart genişliğine göre bilgi yoğunluğu ayarlanır.
 *
 *  - Arka plan: yavaş kayan renk bulutları + ince gren (görselin "oluşması");
 *    referans görsel varsa bulanık hâli altta durur.
 *  - Sol üst: model logosu ve adı · sağ üst: iptal.
 *  - Orta: dönen Vayra yıldızı, durum, geçen / tahmini süre.
 *  - Alt: istem özeti ve kenarda ilerleme çubuğu.
 */

/** Model ailesine göre kabaca beklenen süre (sn) — yalnız ilerleme çubuğu için. */
function tahminiSn(model: string, tur?: string) {
  // Video sağlayıcıları dakikalar sürer (Kling/Seedance tipik 1–4 dk).
  if (tur === "video") return /Fast|Flash|Turbo|Mini|Lite/i.test(model) ? 70 : 150;
  if (/4K|Pro|Ultra|Ruh Sinema/i.test(model)) return 35;
  if (/lite|Fast|Flash|Turbo|Schnell/i.test(model)) return 12;
  return 22;
}

export function UretimYukleniyor({ u, siraNo, onIptal, etiket, ozet }: { u: Uretim; siraNo?: number; onIptal: () => void;
  /** Üst hapta model adı yerine gösterilecek metin (ör. setteki kare adı). */ etiket?: string;
  /** Alttaki istem özeti yerine gösterilecek metin; boş dize gizler. */ ozet?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [gen, setGen] = useState(240);
  const [, tik] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setGen(el.clientWidth));
    ro.observe(el);
    const t = setInterval(() => tik((x) => x + 1), 500);
    return () => { ro.disconnect(); clearInterval(t); };
  }, []);

  const sirada = u.durum === "kuyrukta";
  const bas = u.baslama ?? u.olusturma;
  const gecen = Math.max(0, (Date.now() - bas) / 1000);
  const tahmin = tahminiSn(u.model, u.tur);
  // Asimptotik: tahmini sürede ~%75, sonra yavaşça %92'ye yaklaşır.
  const oran = sirada ? 0 : Math.min(0.92, 1 - Math.exp(-gecen / (tahmin * 0.72)));
  const sure = `${Math.floor(gecen / 60)}:${String(Math.floor(gecen % 60)).padStart(2, "0")}`;
  const ref0 = u.meta?.referanslar?.[0];
  const kucuk = gen < 170;
  const orta = gen < 240;
  const istem = (ozet ?? u.meta?.hamIstem ?? u.prompt ?? "").trim();

  return (
    <span ref={ref} className={cn("uy-kart absolute inset-0 overflow-hidden", sirada && "uy-sirada")}>
      {/* Zemin: referansın bulanık hâli + renk bulutları + gren */}
      {ref0 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ref0} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-2xl saturate-50" />
      )}
      <span className="uy-bulut uy-bulut-1" />
      <span className="uy-bulut uy-bulut-2" />
      <span className="uy-bulut uy-bulut-3" />
      <span className="uy-gren" />
      <span className="uy-tara" />
      <span className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/55" />

      {/* Üst: model + iptal */}
      {!kucuk && (
        <span className="absolute inset-x-2 top-2 flex items-center justify-between gap-2">
          <span className={cn("flex min-w-0 items-center gap-1.5 rounded-full bg-black/45 py-1 pr-2.5 text-[11.5px] font-medium text-white/85 ring-1 ring-inset ring-white/10 backdrop-blur-md", etiket ? "pl-2.5" : "pl-1")}>
            {!etiket && <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10"><ModelLogo ad={u.model} boyut={12} /></span>}
            <span className="truncate">{etiket ?? u.model}</span>
          </span>
        </span>
      )}
      <span role="button" tabIndex={0} aria-label="Üretimi iptal et" title="İptal et"
        onClick={(e) => { e.stopPropagation(); onIptal(); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onIptal(); } }}
        className={cn("absolute right-2 top-2 flex items-center justify-center rounded-full bg-black/50 text-white/80 ring-1 ring-inset ring-white/10 backdrop-blur-md transition-[opacity,background-color] hover:bg-rose-500/80 hover:text-white focus:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:opacity-0",
          kucuk ? "h-6 w-6" : "h-7 w-7")}>
        <X className={kucuk ? "h-3 w-3" : "h-3.5 w-3.5"} />
      </span>

      {/* Orta: yıldız + durum */}
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-3 text-center">
        <span className={cn("relative flex items-center justify-center", kucuk ? "h-9 w-9" : "h-14 w-14")}>
          <span className="uy-halka absolute inset-0 rounded-full" />
          <KrediYildiz className={cn("uy-yildiz relative text-white drop-shadow-[0_0_12px_rgba(85,214,253,0.8)]", kucuk ? "h-4 w-4" : "h-6 w-6")} />
        </span>
        <span className="flex flex-col items-center gap-1">
          <span className={cn("hf-shimmer font-semibold", kucuk ? "text-[11.5px]" : "text-[13.5px]")}>
            {sirada ? (siraNo ? `${siraNo}. sırada` : "Sırada") : "Üretiliyor"}
          </span>
          <span className={cn("tabular-nums text-white/60", kucuk ? "text-[10.5px]" : "text-[11.5px]")}>
            {sirada ? (orta ? "birazdan başlar" : "eşzamanlı sınır dolu · birazdan başlar") : orta ? sure : `${sure} · tahmini ${tahmin} sn`}
          </span>
        </span>
      </span>

      {/* Alt: istem özeti */}
      {!orta && istem && (
        <span className="absolute inset-x-3 bottom-3 line-clamp-2 text-left text-[11.5px] leading-snug text-white/55">{istem}</span>
      )}

      {/* İlerleme çubuğu (kenar) */}
      <span className="absolute inset-x-0 bottom-0 h-[3px] bg-white/[0.06]">
        {sirada
          ? <span className="hf-belirsiz block h-full w-1/3 bg-white/30" />
          : <span className="block h-full bg-aksan shadow-[0_0_10px_rgba(85,214,253,0.9)] transition-[width] duration-500 ease-out" style={{ width: `${Math.max(3, oran * 100)}%` }} />}
      </span>
    </span>
  );
}
