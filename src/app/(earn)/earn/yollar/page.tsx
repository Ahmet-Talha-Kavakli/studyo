"use client";

import Link from "next/link";
import * as Ikonlar from "lucide-react";
import { ArrowRight, Gift } from "lucide-react";
import { KAZANC_YOLLARI } from "@/lib/earn/katalog";
import { SayfaBaslik, GlassIkon, Kart } from "@/components/earn/UI";

export default function KazancYollari() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <SayfaBaslik baslik="Kazanç Yolları" ozet="7 farklı yolla Vayra'dan gelir elde et. Sana uygun olanı seç, başla." />

      <div className="grid gap-4 sm:grid-cols-2">
        {KAZANC_YOLLARI.map((y) => {
          const Ikon = (Ikonlar as unknown as Record<string, React.ComponentType<{ className?: string }>>)[y.ikon] ?? Gift;
          return (
            <Link key={y.id} href={y.yol} className="group flex flex-col rounded-2xl border border-white/[0.06] bg-[#14151799] backdrop-blur-xl p-5 transition-colors hover:border-sky-400/25">
              <div className="flex items-start justify-between">
                <GlassIkon boyut={48}><Ikon className="h-5 w-5" /></GlassIkon>
                <ArrowRight className="h-5 w-5 text-white/25 transition-all group-hover:translate-x-0.5 group-hover:text-sky-400" />
              </div>
              <h3 className="mt-3 text-lg font-bold text-white">{y.ad}</h3>
              <p className="mt-1 flex-1 text-sm text-white/50">{y.ozet}</p>
              <span className="mt-4 text-sm font-semibold text-sky-400">Başla →</span>
            </Link>
          );
        })}
      </div>

      <Kart className="mt-6 !border-sky-400/20 !bg-sky-500/[0.05]">
        <h3 className="font-bold text-white">Nasıl çalışır?</h3>
        <ol className="mt-2 space-y-1.5 text-sm text-white/60">
          <li><b className="text-sky-300">1.</b> Bir kazanç yolu seç ve gereken adımı tamamla.</li>
          <li><b className="text-sky-300">2.</b> Kanıtını gönder — çoğu kazanç kısa bir onaydan geçer.</li>
          <li><b className="text-sky-300">3.</b> Onaylanınca kredi bakiyene yatar; eşiği geçince nakde çevir.</li>
          <li><b className="text-sky-300">4.</b> Seviyen yükseldikçe kazancın katlanır, çekim limitin artar.</li>
        </ol>
      </Kart>
    </div>
  );
}
