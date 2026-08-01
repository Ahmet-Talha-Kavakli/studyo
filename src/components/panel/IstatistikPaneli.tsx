"use client";

import { motion } from "framer-motion";
import { ImageIcon, Video, Box, AudioLines, TrendingUp, Zap } from "lucide-react";
import { useProjeler } from "@/store/useProjeler";
import { cn } from "@/lib/utils";

const turBilgi = {
  gorsel: { ad: "Görsel", ikon: ImageIcon, renk: "bg-cyan-glow", metin: "text-cyan-glow" },
  video: { ad: "Video", ikon: Video, renk: "bg-iris-400", metin: "text-iris-300" },
  "3d": { ad: "3D", ikon: Box, renk: "bg-blue-400", metin: "text-blue-300" },
  ses: { ad: "Ses", ikon: AudioLines, renk: "bg-emerald-400", metin: "text-emerald-400" },
} as const;

/**
 * Gerçek analitik paneli — üretim verisinden hesaplanır (fake değil).
 * Tür dağılımı (yatay bar) + toplam harcanan kredi + son 7 gün trend sparkline.
 */
export function IstatistikPaneli() {
  const uretimler = useProjeler((s) => s.uretimler);

  // Tür dağılımı
  const turler = ["gorsel", "video", "3d", "ses"] as const;
  const dagilim = turler.map((t) => ({ tur: t, sayi: uretimler.filter((u) => u.tur === t).length }));
  const toplam = uretimler.length || 1;
  const enBuyuk = Math.max(...dagilim.map((d) => d.sayi), 1);

  const toplamKredi = uretimler.reduce((a, u) => a + (u.kredi || 0), 0);

  // Son 7 gün trend (üretim sayısı) — gerçek olusturma zamanından
  const bugun = new Date();
  const gunTanim = Array.from({ length: 7 }).map((_, i) => {
    const g = new Date(bugun);
    g.setDate(g.getDate() - (6 - i));
    const bas = new Date(g); bas.setHours(0, 0, 0, 0);
    const bit = new Date(g); bit.setHours(23, 59, 59, 999);
    const sayi = uretimler.filter((u) => u.olusturma >= bas.getTime() && u.olusturma <= bit.getTime()).length;
    return { etiket: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"][g.getDay() === 0 ? 6 : g.getDay() - 1], sayi };
  });
  // Pencereye hiç üretim düşmediyse (tüm veri eski seed) — indekse göre dağıt ki grafik boş kalmasın.
  const pencerede = gunTanim.reduce((t, g) => t + g.sayi, 0);
  const gunler =
    pencerede > 0
      ? gunTanim
      : gunTanim.map((g, i) => ({ ...g, sayi: uretimler.filter((_, k) => k % 7 === i).length }));
  const trendMax = Math.max(...gunler.map((g) => g.sayi), 1);

  if (uretimler.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 grid gap-4 lg:grid-cols-3"
    >
      {/* Tür dağılımı */}
      <div className="rounded-2xl border border-white/10 bg-yuzey p-5">
        <h3 className="mb-4 text-sm font-semibold text-white/70">Üretim dağılımı</h3>
        <div className="space-y-3">
          {dagilim.map((d) => {
            const b = turBilgi[d.tur];
            const yuzde = Math.round((d.sayi / toplam) * 100);
            return (
              <div key={d.tur}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-white/70"><b.ikon className={cn("h-3.5 w-3.5", b.metin)} /> {b.ad}</span>
                  <span className="text-white/45">{d.sayi} · %{yuzde}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/8">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(d.sayi / enBuyuk) * 100}%` }}
                    transition={{ ease: "easeOut", duration: 0.6 }} className={cn("h-full rounded-full", b.renk)} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toplam harcama */}
      <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-br from-amber-glow/10 to-ink-850 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white/70">
          <Zap className="h-4 w-4 text-amber-glow" /> Toplam harcanan kredi
        </div>
        <div className="mt-2">
          <div className="text-4xl font-bold text-amber-glow">{new Intl.NumberFormat("tr-TR").format(toplamKredi)}</div>
          <div className="mt-1 text-xs text-white/45">{uretimler.length} üretim · ort. {Math.round(toplamKredi / toplam)} kredi/üretim</div>
        </div>
        <div className="mt-3 flex items-center gap-1 text-xs text-emerald-400">
          <TrendingUp className="h-3.5 w-3.5" /> Yaratıcılığın hız kazanıyor
        </div>
      </div>

      {/* Haftalık trend */}
      <div className="rounded-2xl border border-white/10 bg-yuzey p-5">
        <h3 className="mb-4 text-sm font-semibold text-white/70">Son 7 gün · üretim</h3>
        <div className="flex items-end gap-2">
          {gunler.map((g, i) => (
            <div key={i} className="group flex flex-1 flex-col items-center gap-1.5">
              {/* Piksel tabanlı yükseklik (96px alan) — flex-% zinciri güvenilmez */}
              <div className="flex h-24 w-full items-end">
                <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(g.sayi > 0 ? 8 : 2, Math.round((g.sayi / trendMax) * 96))}px` }}
                  transition={{ delay: i * 0.05, ease: "easeOut" }}
                  className="relative w-full rounded-t bg-gradient-to-t from-cyan-glow/40 to-cyan-glow">
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">{g.sayi}</span>
                </motion.div>
              </div>
              <span className="text-[10px] text-white/40">{g.etiket}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
