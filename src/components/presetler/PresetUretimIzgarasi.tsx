"use client";

/**
 * Preset videolarının sonuç ızgarası — görünüm ayarına (sayfa "presetler") bağlı: sütun sayısı
 * boyuttan, kart oranı yerleşimden, sıra en yeni ya da en eskiden. Kartlar ortak UretimKarti
 * (yıldız, indir menüsü, yeniden kullan, daha fazla).
 */

import { motion } from "framer-motion";
import type { Uretim } from "@/store/useProjeler";
import { UretimKarti, oranSayi } from "@/components/panel/UretimKarti";
import { useAlanGenisligi, useGorunum } from "@/components/galeri/useGorunum";
import { kartOrani, sutunSayisi, zamanaGoreSirala } from "@/lib/galeri/gorunum";

export const PRESET_GORUNUM = "presetler";

export function PresetUretimIzgarasi({ liste }: { liste: Uretim[] }) {
  const [g] = useGorunum(PRESET_GORUNUM);
  const [ref, en] = useAlanGenisligi<HTMLDivElement>(1100);
  const n = sutunSayisi(en, g);
  const sirali = zamanaGoreSirala(liste, g.siralama);
  return (
    <div ref={ref} style={{ columnCount: n, columnGap: 12 }}>
      {sirali.map((u, i) => (
        <motion.div key={u.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }} className="mb-3 break-inside-avoid">
          <UretimKarti u={u} kutuBoyut={g.boyut === "kucuk" ? "kucuk" : g.boyut === "buyuk" ? "buyuk" : "orta"} gorselOran={kartOrani(g, oranSayi(u))} />
        </motion.div>
      ))}
    </div>
  );
}
