"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Clock3, Sparkles } from "lucide-react";
import { useProjeler } from "@/store/useProjeler";
import { JustifiedGaleri } from "@/components/panel/JustifiedGaleri";
import { kesfetFont } from "@/components/kesfet/font";
import { cn } from "@/lib/utils";
import { GorunumAyari } from "@/components/galeri/GorunumAyari";

/**
 * Mobil öncelikli araç stüdyoları (Yükselt, Reframe, Inpaint, Çiz, Konuştur, UGC …) için
 * masaüstü düzeni: solda aracın kendi akışı (yükleme, ayarlar, Üret), sağda o araçla
 * yapılmış gerçek üretimler. Sayfalar tek kod tabanıyla iki düzende çalışır; mobilde
 * bu kabuk görünmez bir sarmalayıcıdır.
 */

export const ARAC_ROTALARI: Record<string, { arac: string; ad: string; aciklama: string }> = {
};

export function aracRotasi(path: string) {
  return Object.keys(ARAC_ROTALARI).find((r) => path === r || path.startsWith(r + "/")) ?? null;
}

export function AracMasaustu({ rota, children }: { rota: string; children: ReactNode }) {
  const bilgi = ARAC_ROTALARI[rota];
  // Çekmeceler body'ye portal edilir; masaüstü kurallarının onlara da ulaşması için kök sınıf
  useEffect(() => {
    document.documentElement.classList.add("arac-masaustu-acik");
    return () => document.documentElement.classList.remove("arac-masaustu-acik");
  }, []);
  return (
    <div className={cn("arac-masaustu kesfet-tema sm:flex sm:h-[calc(100vh-var(--ust-nav))] sm:overflow-hidden", kesfetFont.variable)}>
      <section aria-label={bilgi.ad} className="arac-masaustu-panel sm:w-[440px] sm:shrink-0 sm:overflow-y-auto sm:border-r sm:border-white/[0.06] sm:[scrollbar-width:thin]">
        {children}
      </section>
      <AracGecmisi arac={bilgi.arac} ad={bilgi.ad} aciklama={bilgi.aciklama} />
    </div>
  );
}

function AracGecmisi({ arac, ad, aciklama }: { arac: string; ad: string; aciklama: string }) {
  const uretimler = useProjeler((s) => s.uretimler);
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  const liste = useMemo(() => uretimler.filter((u) => u.arac === arac).sort((a, b) => b.olusturma - a.olusturma), [uretimler, arac]);
  const suren = liste.filter((u) => u.durum === "kuyrukta" || u.durum === "isleniyor").length;
  const biten = liste.filter((u) => u.durum === "tamam");

  return (
    <div className="hidden min-w-0 flex-1 flex-col sm:flex">
      <header className="flex h-[52px] shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-5">
        <p className="flex items-center gap-2 text-[14px] font-semibold text-white">
          <Clock3 className="h-4 w-4 text-metin-3" />Geçmiş
          {hazir && liste.length > 0 && <span className="text-[12.5px] font-normal tabular-nums text-metin-3">{liste.length}</span>}
          {suren > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-vurgu/15 px-2 py-0.5 text-[11.5px] font-medium text-vurgu-acik"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-vurgu" />{suren} sürüyor</span>}
        </p>
        <span className="flex items-center gap-3">
          <Link href="/panel/kitaplik" className="inline-flex items-center gap-1 text-[12.5px] font-medium text-metin-2 hover:text-white">Kitaplıkta aç<ArrowUpRight className="h-3.5 w-3.5" /></Link>
          <GorunumAyari sayfa="ana" istemVar={false} />
        </span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-width:thin]">
        {!hazir ? (
          <div className="flex flex-col gap-1.5" aria-hidden>
            {[[1.5, 1, 0.75, 1.78], [1, 1.5, 1]].map((s, i) => <div key={i} className="flex gap-1.5">{s.map((o, j) => <div key={j} className="iskelet-parca h-[220px] rounded-xl" style={{ flexGrow: o, flexBasis: 0 }} />)}</div>)}
          </div>
        ) : biten.length || suren ? (
          <JustifiedGaleri sayfa="ana" uretimler={liste.filter((u) => u.durum !== "hata")} hedefYukseklik={240} bosluk={6} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-vurgu/12 text-vurgu-acik ring-1 ring-inset ring-vurgu/25"><Sparkles className="h-6 w-6" /></span>
            <h2 className="mt-5 text-[22px] font-semibold tracking-[-0.02em] text-white">{ad}</h2>
            <p className="mt-1.5 max-w-[380px] text-[14px] leading-relaxed text-metin-2">{aciklama}</p>
            <p className="mt-6 max-w-[340px] text-[13px] text-metin-3">Soldaki panelden başla. Bu araçla ürettiklerin burada birikir; tamamı kitaplığında da durur.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Üretimden sonra kitaplığa geçiş yalnız mobilde; masaüstünde geçmiş zaten yan panelde. */
export const mobilMi = () => typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches;
