"use client";

/* Stüdyo bildirimleri için küçük yardımcılar (bkz. src/lib/mesaj.ts kılavuzu). */

import { toast } from "@/lib/toast";
import { useProjeler, type Uretim } from "@/store/useProjeler";

/** Silinen üretim(ler)i listeye geri ekler; zaten varsa dokunmaz. "Geri al" eylemi için. */
export function uretimGeriYukle(silinen: Uretim | Uretim[]) {
  const l = Array.isArray(silinen) ? silinen : [silinen];
  useProjeler.setState((s) => {
    const yeni = l.filter((u) => !s.uretimler.some((x) => x.id === u.id));
    return yeni.length ? { uretimler: [...yeni, ...s.uretimler].sort((a, b) => b.olusturma - a.olusturma) } : s;
  });
}

/** Hatanın (Error ya da metin) nedenini noktayla biten tek cümle olarak verir; mesaj yoksa yedeği kullanır. */
export function neden(e: unknown, yedek: string): string {
  const m = (typeof e === "string" && e.trim() ? e : e instanceof Error && e.message ? e.message : yedek).trim();
  return /[.!?…]$/.test(m) ? m : `${m}.`;
}

/** Beğen düğmesinin sonucu: `onceFavori` tıklamadan önceki durumdur. */
export function begeniBildir(onceFavori: boolean | undefined) {
  toast.success(onceFavori ? "Beğenilerden çıkarıldı" : "Beğenilere eklendi");
}
