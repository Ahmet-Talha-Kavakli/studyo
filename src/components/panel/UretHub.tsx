"use client";

/**
 * ÜRET HUB — Higgsfield "Create" (higgsfield.ai/flow) modalının mobil BİREBİR
 * Türkçe karşılığı. /panel/olustur mobilde önce BUNU gösterir; bir karta
 * tıklanınca ilgili composer rotasına gider.
 *
 * Yapı (referans ~/Desktop/referanslar/alagam):
 *   ┌ "Üret" başlığı (sticky) + daire ✕
 *   │ sekme şeridi (sticky): Tümü·Yeni·Görseller·Videolar·Düzenle·Karakterler·Modeller
 *   │ hero kart (Viral Presetler) — tam genişlik
 *   └ 2 sütun kart ızgarası
 *
 * YALNIZ < sm (mobil) render edilir; masaüstünde /panel/olustur kendi düzenini basar.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn, onizlemeArka } from "@/lib/utils";
import { scArka } from "@/lib/gercekVeri";
import {
  HUB_SEKMELER, HUB_HERO, HUB_ROZET_RENK, hubKartlariSuz,
  type HubSekme, type HubKart,
} from "@/lib/uretHub";

/** Hero + normal kart için ortak rozet pill'i. */
function Rozet({ kart }: { kart: HubKart }) {
  if (!kart.rozet) return null;
  const renk = HUB_ROZET_RENK[kart.rozet];
  return (
    <span
      className="absolute left-2.5 top-2.5 z-10 rounded-[6px] px-2 py-[3px] text-[10px] font-extrabold uppercase tracking-[0.03em]"
      style={{ background: renk.bg, color: renk.metin }}
    >
      {kart.rozet}
    </span>
  );
}

function HubKartGorunum({ kart, onTikla, hero }: { kart: HubKart; onTikla: () => void; hero?: boolean }) {
  const arka = scArka(kart.id + kart.ad, kart.kategori);
  return (
    <button
      onClick={onTikla}
      className={cn(
        "group relative w-full overflow-hidden rounded-[16px] bg-yuzey-2 text-left",
        hero ? "aspect-[16/10]" : "aspect-[4/3]",
      )}
    >
      {/* Görsel katmanı — hafif zoom hover */}
      <span
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-active:scale-[1.03]"
        style={{ background: arka }}
        aria-hidden
      />
      {/* Alttan koyulaşan gradyan — ad okunsun */}
      <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/30 to-transparent" aria-hidden />
      <Rozet kart={kart} />
      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-3">
        <span className={cn("font-bold uppercase leading-tight text-white", hero ? "text-[19px]" : "text-[14px]")}>
          {kart.ad}
        </span>
        <span className={cn("leading-snug text-white/60", hero ? "text-[13px]" : "text-[11.5px]")}>
          {kart.ozet}
        </span>
      </span>
    </button>
  );
}

export function UretHub({ onKapat }: { onKapat?: () => void }) {
  const router = useRouter();
  const [sekme, setSekme] = useState<HubSekme>("tumu");
  const kartlar = hubKartlariSuz(sekme);
  const heroGoster = sekme === "tumu" || HUB_HERO.sekmeler.includes(sekme as Exclude<HubSekme, "tumu">);

  const git = (href: string) => router.push(href);

  return (
    <div className="mobil-lime flex min-h-[100dvh] flex-col bg-zemin pb-[calc(60px+env(safe-area-inset-bottom))] sm:hidden">
      {/* ── Başlık (sticky) ── */}
      <header className="sticky top-0 z-20 flex h-[56px] shrink-0 items-center justify-between bg-zemin px-4">
        <h1 className="text-[24px] font-bold text-white">Üret</h1>
        {onKapat && (
          <button onClick={onKapat} aria-label="Kapat"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2a2c2e] text-white">
            <X className="h-5 w-5" />
          </button>
        )}
      </header>

      {/* ── Sekme şeridi (sticky) ── */}
      <div className="sticky top-[56px] z-20 -mx-0 flex gap-2 overflow-x-auto bg-zemin px-4 pb-3 pt-1 gizli-scroll">
        {HUB_SEKMELER.map((s) => (
          <button key={s.id} onClick={() => setSekme(s.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-[15px] font-medium transition-colors",
              sekme === s.id ? "bg-white text-[#131517]" : "text-[#8a8d90]",
            )}>
            {s.ad}
          </button>
        ))}
      </div>

      {/* ── İçerik ── */}
      <div className="flex-1 px-4 pb-6">
        {heroGoster && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-3">
            <HubKartGorunum kart={HUB_HERO} hero onTikla={() => git(HUB_HERO.href)} />
          </motion.div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {kartlar.map((k) => (
            <HubKartGorunum key={k.id} kart={k} onTikla={() => git(k.href)} />
          ))}
        </div>
        {kartlar.length === 0 && (
          <p className="py-20 text-center text-[15px] text-metin-3">Bu sekmede araç yok</p>
        )}
      </div>
    </div>
  );
}
