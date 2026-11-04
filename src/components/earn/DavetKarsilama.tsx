"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, AudioLines, Clapperboard, ImageIcon, Music } from "lucide-react";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { useAuth } from "@/store/useAuth";
import { davetKaydet } from "@/lib/earn/davet";
import { DAVET_INDIRIM } from "@/lib/earn/kampanyalar";
import { UCRETSIZ } from "@/lib/fiyat";
import { IKON_KARO } from "@/lib/renk";
import { cn } from "@/lib/utils";

const GORSELLER = [
  "/gercek/kesfet/neon-sehir.webp", "/gercek/orig/seed-kapadokya-veo31.webp", "/gercek/gorsel/gorsel-karakter-Aria.webp",
  "/gercek/proje-kesfet/kesfet-03.webp", "/gercek/orig/banner-neonmancer.webp", "/gercek/galeri/urun3.webp",
];

export function DavetKarsilama({ kod }: { kod: string }) {
  const girisli = useAuth((s) => s.girisYapildi);
  const [hazir, setHazir] = useState(false);
  useEffect(() => {
    if (kod) davetKaydet(kod);
    setHazir(true);
  }, [kod]);

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-[1180px] items-center gap-12 px-5 py-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
      <div>
        <Link href="/" className="inline-flex items-center gap-2" aria-label="Vayra ana sayfa">
          <VayraIsaret size={36} /><span className="text-[19px] font-bold text-white">Vayra</span>
        </Link>
        <p className="mt-12 inline-flex items-center gap-2 rounded-full border border-vurgu/40 bg-[color-mix(in_oklab,var(--vurgu-renk)_16%,#111113)] px-3 py-1 text-[13px] text-white">
          <span className="font-semibold">@{kod}</span> seni davet etti
        </p>
        <h1 className="mt-5 text-balance text-[40px] font-semibold leading-[1.04] tracking-[-0.04em] text-white sm:text-[56px]">
          Hayal ettiğini dakikalar içinde üret.
        </h1>
        <p className="mt-5 max-w-[480px] text-[16px] leading-relaxed text-metin-2">
          Görsel, video, ses ve müzik için dünyanın en iyi yapay zekâ modelleri tek yerde. Davetle katıldığın için ilk plan ödemende <b className="font-semibold text-white">%{Math.round(DAVET_INDIRIM * 100)} indirim</b> seni bekliyor.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          {hazir && girisli ? (
            <>
              <Link href="/panel" className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-[15px] font-semibold text-zemin hover:opacity-90">Panele git <ArrowRight className="h-4 w-4" /></Link>
              <p className="text-[13px] text-metin-2">Zaten bir hesabın var; davet indirimi yeni hesaplar için geçerli.</p>
            </>
          ) : (
            <>
              <Link href="/kayit?geri=/panel" className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-[15px] font-semibold text-zemin hover:opacity-90">Ücretsiz kaydol <ArrowRight className="h-4 w-4" /></Link>
              <p className="text-[13px] text-metin-2">Kart gerekmez · {UCRETSIZ.hosgeldin} kredi hoş geldin hediyesi</p>
            </>
          )}
        </div>
        <div className="mt-10 grid max-w-[480px] grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { ad: "Görsel", ikon: ImageIcon, renk: "gorsel" as const },
            { ad: "Video", ikon: Clapperboard, renk: "video" as const },
            { ad: "Ses", ikon: AudioLines, renk: "ses" as const },
            { ad: "Müzik", ikon: Music, renk: "muzik" as const },
          ].map((t) => (
            <span key={t.ad} className="flex items-center gap-2 rounded-[14px] bg-white/[0.025] ring-1 ring-white/[0.08] px-3 py-2.5 text-[13px] font-medium text-white">
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg ring-1 ring-inset", IKON_KARO[t.renk])}><t.ikon className="h-3.5 w-3.5" /></span>{t.ad}
            </span>
          ))}
        </div>
      </div>
      <div aria-hidden className="grid grid-cols-3 gap-2">
        {GORSELLER.map((g, i) => (
          <div key={g} className={cn("overflow-hidden rounded-2xl bg-yuzey", i % 3 === 1 ? "translate-y-8" : "")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g} alt="" className="aspect-[3/4] h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </main>
  );
}
