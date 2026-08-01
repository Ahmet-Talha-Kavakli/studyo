"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useProje } from "@/store/useSinema";

/**
 * useAktifProje — ortak proje mimarisinin "şu an hangi projedeyim" bağlamı.
 *
 * Higgsfield mantığı: aynı proje listesi her stüdyoda görünür; kullanıcı bir projeyi
 * seçtiğinde o stüdyonun üretimi o projeye bağlanır. Aktif proje URL `?proje=<id>` ile
 * taşınır (SSR-uyumlu + paylaşılabilir link). Store fallback yok — URL tek kaynak.
 *
 * Dönenler:
 *  • aktifProjeId  — URL'deki geçerli proje id'si (yoksa null)
 *  • aktifProje    — o projenin verisi (yoksa undefined)
 *  • projeSec(id)  — URL'e ?proje=id ekler (sayfada kalır, aktif projeyi değiştirir)
 *  • projeSecVeAc(id) — o projeyi seçip Sinema editörüne gider (detay)
 *  • yeniProjeVeSec(ad) — yeni proje oluşturup aktif yapar, id döner
 */
export function useAktifProje() {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const aktifProjeId = sp.get("proje");
  const aktifProje = useProje((s) => (aktifProjeId ? s.projeler.find((p) => p.id === aktifProjeId) : undefined));

  const projeSec = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(Array.from(sp.entries()));
      if (id) params.set("proje", id);
      else params.delete("proje");
      const qs = params.toString();
      router.replace(qs ? `${path}?${qs}` : path, { scroll: false });
    },
    [router, path, sp],
  );

  const projeSecVeAc = useCallback(
    (id: string) => {
      router.push(`/panel/sinema/${id}`);
    },
    [router],
  );

  const yeniProjeVeSec = useCallback(
    (ad?: string, kaynakStudyo?: string) => {
      const id = useProje.getState().projeOlustur(ad ?? "Yeni proje", "Genel", { kaynakStudyo });
      projeSec(id);
      return id;
    },
    [projeSec],
  );

  return { aktifProjeId, aktifProje, projeSec, projeSecVeAc, yeniProjeVeSec };
}
