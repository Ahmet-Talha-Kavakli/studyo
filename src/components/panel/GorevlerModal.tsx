"use client";

import { motion } from "framer-motion";
import { X, Info, Lock, Gift, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";

/**
 * Görevler & Ödüller modalı — Higgsfield "Challenges & Rewards" (Görsel 58) birebir Türkçe klonu.
 * İki panelli: sol geniş görev listesi (kilitli banner + 3 görev kartı + ilerleme çubukları),
 * sağ dar ödül paneli (BÜYÜK ÖDÜL / Sınırsız Nano Banana Pro).
 *
 * SSR güvenli: geri sayım STATİK metin (render'da Date.now / Math.random YOK).
 * Dışarıdan `onKapat` prop'u ile açılır/kapanır (bkz. panel layout / topbar tetikleyici).
 */

interface Gorev {
  id: number;
  baslik: string;
  aciklama: string;
  ilerleme: string;        // "0/1.000"
  yuzde: number;           // ilerleme çubuğu (statik)
  odulEtiket: string;      // ödül kartı üst yazı
  odulAlt: string;         // ödül kartı alt yazı
  odulRenk: string;        // ödül kartı gradyan sınıfları
}

const GOREVLER: Gorev[] = [
  {
    id: 1,
    baslik: "Bu ay 1.000 kredi harca",
    aciklama: "Nano Banana Pro 2K ile 20 ücretsiz üretim",
    ilerleme: "0/1.000 kredi",
    yuzde: 0,
    odulEtiket: "NANO BANANA PRO",
    odulAlt: "20 ÜCRETSİZ ÜRETİM",
    odulRenk: "from-emerald-500/25 to-emerald-600/10 ring-emerald-400/30 text-emerald-300",
  },
  {
    id: 2,
    baslik: "1.000 ek kredi satın al",
    aciklama: "200 kredi",
    ilerleme: "0/1.000 kredi",
    yuzde: 0,
    odulEtiket: "200 KREDİ",
    odulAlt: "HESABINA EKLENİR",
    odulRenk: "from-violet-500/25 to-violet-600/10 ring-violet-400/30 text-violet-300",
  },
  {
    id: 3,
    baslik: "Herhangi bir sınırsız video modeli satın al",
    aciklama: "50 kredi",
    ilerleme: "0/1 model",
    yuzde: 0,
    odulEtiket: "50 KREDİ",
    odulAlt: "HESABINA EKLENİR",
    odulRenk: "from-pink-500/25 to-rose-600/10 ring-pink-400/30 text-pink-300",
  },
];

export function GorevlerModal({ onKapat }: { onKapat: () => void }) {
  useScrollKilit(true);
  useEscKapat(true, onKapat);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onKapat}
        className="perde absolute inset-0 bg-black/55 backdrop-blur-2xl backdrop-saturate-150"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="hf-kart relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden bg-[#0f1113]"
      >
        {/* Kapat */}
        <button
          onClick={onKapat}
          aria-label="Kapat"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full glass-ikon text-metin-2 transition-colors hover:text-metin"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Başlık */}
        <div className="px-6 pt-6 pb-4 sm:px-8">
          <h2 className="hf-baslik text-2xl text-metin sm:text-3xl">
            GÖREVLERİ TAMAMLA <span className="text-aksan">&amp; ÖDÜLLERİ AÇ</span>
          </h2>
        </div>

        <div className="grid flex-1 gap-5 overflow-y-auto px-6 pb-6 sm:px-8 sm:pb-8 lg:grid-cols-[1fr_300px]">
          {/* ── SOL: görev listesi ── */}
          <div className="flex flex-col gap-4">
            {/* Kilitli banner */}
            <div className="relative overflow-hidden rounded-xl border border-rose-900/40 bg-gradient-to-r from-[#3a0f1c] via-[#4a1220] to-[#2a0b16] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full glass-ikon glass-ikon-gul ring-1 ring-rose-400/30">
                  <Lock className="h-4.5 w-4.5 text-rose-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] text-rose-200/80">Görevler 30 Temmuz&apos;a kadar kilitli</p>
                  <p className="hf-baslik mt-0.5 text-lg text-white">GÖREVLER YAKINDA AÇILIYOR</p>
                  <p className="mt-0.5 text-[12px] text-rose-200/60">Merak etme, çok yakında başlayabilirsin</p>
                </div>
                <div className="ml-auto hidden shrink-0 text-right sm:block">
                  <p className="text-[11px] uppercase tracking-wide text-rose-200/60">Kalan süre</p>
                  <p className="hf-baslik mt-0.5 text-base text-white tabular-nums">10 gün 20 saat 45 dk</p>
                </div>
              </div>
              {/* mobil geri sayım */}
              <p className="hf-baslik mt-3 text-center text-base text-white tabular-nums sm:hidden">
                10 gün 20 saat 45 dk
              </p>
            </div>

            {/* Görev kartları */}
            {GOREVLER.map((g) => (
              <div
                key={g.id}
                className="glass-cip flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[15px] font-semibold text-metin">{g.baslik}</p>
                    <Info className="h-3.5 w-3.5 shrink-0 text-metin-3" />
                  </div>
                  <p className="mt-0.5 text-[13px] text-metin-2">{g.aciklama}</p>
                  {/* İlerleme çubuğu */}
                  <div className="mt-3 flex items-center gap-2.5">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/12">
                      <div
                        className="h-full rounded-full bg-aksan"
                        style={{ width: `${g.yuzde}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-[12px] font-medium tabular-nums text-metin-2">{g.ilerleme}</span>
                  </div>
                </div>
                {/* Ödül kartı */}
                <div
                  className={cn(
                    "flex w-full shrink-0 flex-col items-center justify-center rounded-lg bg-gradient-to-br px-4 py-3 text-center ring-1 sm:w-40",
                    g.odulRenk,
                  )}
                >
                  <Sparkles className="mb-1 h-4 w-4 opacity-80" />
                  <p className="hf-baslik text-sm leading-tight">{g.odulEtiket}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide opacity-70">{g.odulAlt}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── SAĞ: ödül paneli ── */}
          <aside className="hf-kart flex flex-col overflow-hidden bg-gradient-to-b from-[#16161a] to-[#0f0f12]">
            <div className="relative flex flex-1 flex-col p-5">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-pink-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-pink-300 ring-1 ring-pink-400/30">
                <Gift className="h-3.5 w-3.5" /> Büyük Ödül
              </span>
              <h3 className="hf-baslik mt-4 text-2xl leading-tight text-aksan">
                SINIRSIZ<br />NANO BANANA<br />PRO
              </h3>

              {/* Kilitli ilerleme */}
              <div className="mt-4 flex items-center gap-2.5">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/12">
                  <div className="h-full w-0 rounded-full bg-aksan" />
                </div>
                <span className="flex items-center gap-1 text-[12px] font-medium text-metin-3">
                  <Lock className="h-3 w-3" /> Kilitli
                </span>
              </div>

              {/* Etiketler */}
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="glass-cip rounded-md px-2.5 py-1 text-[11px] font-medium text-metin-2">
                  2K&apos;ya kadar
                </span>
                <span className="glass-cip rounded-md px-2.5 py-1 text-[11px] font-medium text-metin-2">
                  2 eşzamanlı
                </span>
              </div>

              <p className="mt-4 text-[13px] leading-relaxed text-metin-2">
                Görevi tamamla ve Nano Banana Pro&apos;ya 7 günlük Sınırsız erişimi kap.
              </p>

              <div className="mt-auto pt-5">
                <button
                  onClick={() => (typeof window !== "undefined" && (window.location.href = "/panel/gorevler"))}
                  className="glass-cip w-full cursor-not-allowed rounded-xl py-3 text-sm font-semibold text-metin-3"
                >
                  Yakında Açılıyor
                </button>
                <p className="mt-2.5 text-center text-[11px] text-metin-3">
                  Koşullar geçerlidir. Daha fazla bilgi
                </p>
              </div>
            </div>
          </aside>
        </div>
      </motion.div>
    </div>
  );
}
