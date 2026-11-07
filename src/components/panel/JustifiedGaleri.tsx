"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { UretimKarti, oranSayi } from "./UretimKarti";
import type { Uretim } from "@/store/useProjeler";
import { useGorunum } from "@/components/galeri/useGorunum";
import { kartOrani, zamanaGoreSirala } from "@/lib/galeri/gorunum";

// Higgsfield "Last viewed": en son detayı açılan kart ortada rozetle işaretlenir.
// Kart bileşeni detay açarken bu olayı yayar; galeri dinler.
const SON_BAKILAN_OLAY = "vayra-son-bakilan";

/**
 * Higgsfield birebir "justified rows" galeri.
 * - Her satır container genişliğine tam yayılır (son satır dahil, makul kırpma ile).
 * - Kartlar kendi en-boy oranını korur (meta.oran → oranSayi).
 * - `hedefYukseklik` (zoom slider) satırların ideal yüksekliğini belirler → kart boyutu.
 * - Flexbox flex-grow ile satır normalize edilir; SSR-güvenli (ölçüm sadece client'ta, layout CSS'te).
 */
export function JustifiedGaleri({
  uretimler,
  hedefYukseklik: hedefHam,
  bosluk = 4,
  sayfa = "ana",
}: {
  uretimler: Uretim[];
  hedefYukseklik: number;
  bosluk?: number;
  /** Görünüm ayarı anahtarı (yerleşim, boyut, sıralama). */
  sayfa?: string;
}) {
  const [g] = useGorunum(sayfa);
  // Boyut: küçük satırlar kısa, büyük satırlar uzun; özelde sütun sayısına göre.
  const hedefYukseklik = g.boyut === "kucuk" ? hedefHam * 0.7 : g.boyut === "buyuk" ? hedefHam * 1.5 : g.boyut === "ozel" ? Math.max(120, hedefHam * (5 / g.sutun) * 1.1) : hedefHam;
  const kapRef = useRef<HTMLDivElement>(null);
  const [genislik, setGenislik] = useState(0);
  const [sonBakilanId, setSonBakilanId] = useState<string | null>(null);

  useEffect(() => {
    const el = kapRef.current;
    if (!el) return;
    const olc = () => setGenislik(el.clientWidth);
    olc();
    const ro = new ResizeObserver(olc);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Kart detayı açılınca "son bakılan" işaretle (Higgsfield Last viewed).
  useEffect(() => {
    const dinle = (e: Event) => setSonBakilanId((e as CustomEvent<string>).detail);
    window.addEventListener(SON_BAKILAN_OLAY, dinle);
    return () => window.removeEventListener(SON_BAKILAN_OLAY, dinle);
  }, []);

  // Kartları satırlara böl: her karta hedef yükseklikte genişlik = oran*yükseklik ver,
  // container'ı aşınca satırı kapat. Sonra satırı tam genişliğe ölçekle (justified).
  const satirlar = useMemo(() => {
    if (genislik === 0) return [] as { u: Uretim; oran: number }[][];
    const items = zamanaGoreSirala(uretimler, g.siralama).map((u) => ({ u, oran: kartOrani(g, oranSayi(u)) }));
    const rows: { u: Uretim; oran: number }[][] = [];
    let satir: { u: Uretim; oran: number }[] = [];
    let toplamOran = 0;
    for (const it of items) {
      satir.push(it);
      toplamOran += it.oran;
      // Bu satır hedef yükseklikte ne kadar genişlik ister? (boşluklar dahil)
      const genislikIhtiyaci = toplamOran * hedefYukseklik + (satir.length - 1) * bosluk;
      // Eşiği %85'te kır: satır hedefe yaklaşınca kapat. Böylece satırlar hedef
      // yüksekliğe yakın kalır (aşırı küçülüp "şerit" gibi görünmez).
      if (genislikIhtiyaci >= genislik * 0.85) {
        rows.push(satir);
        satir = [];
        toplamOran = 0;
      }
    }
    if (satir.length) rows.push(satir);
    return rows;
  }, [uretimler, genislik, hedefYukseklik, bosluk, g]);

  return (
    <div ref={kapRef} className="w-full">
      {satirlar.map((satir, ri) => {
        const toplamOran = satir.reduce((a, b) => a + b.oran, 0);
        const kullanilabilir = genislik - (satir.length - 1) * bosluk;
        // Satır yüksekliği = kullanılabilir genişlik / toplam oran (tam justified).
        // Son satır tek/az kartlıysa hedef yüksekliği aşmasın (Higgsfield: son satır sola yaslı, büyümez).
        const sonSatir = ri === satirlar.length - 1;
        let satirY = kullanilabilir / toplamOran;
        if (sonSatir && satirY > hedefYukseklik * 1.35) satirY = hedefYukseklik;
        return (
          <div key={ri} className="flex" style={{ gap: bosluk, marginBottom: bosluk }}>
            {satir.map(({ u, oran }) => (
              <div key={u.id} style={{ width: satirY * oran, flexShrink: 0 }}>
                <UretimKarti u={u} gorselOran={oran} sonBakilan={u.id === sonBakilanId} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
