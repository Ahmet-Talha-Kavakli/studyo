import { create } from "zustand";
import { persist } from "zustand/middleware";
import { alanlariKoru } from "./gocHelper";

/**
 * Usta tercihleri — Ayarlar'daki Görünüm ve Yetenekler sekmelerinin gerçek durumu.
 * Her alan bir yerde gerçekten kullanılır (yanıt yazı tipi, kutu genişliği, varsayılan araçlar…).
 */
export interface ScTercihler {
  /** Yanıt metninin yazı tipi. */
  yaziTipi: "serif" | "sans";
  /** Yanıt metni boyutu. */
  yaziBoyutu: "kucuk" | "orta" | "buyuk";
  /** Sohbet sütunu geniş mi (780 → 1040 px). */
  genis: boolean;
  /** Yeni sohbetlerde varsayılan araçlar ve model. */
  varsayilanWeb: boolean;
  varsayilanDusun: boolean;
  varsayilanModel: string | null;
  /** Yanıttan sonra takip soruları göster. */
  oneriler: boolean;
  /** Masaüstünde Enter gönderir (kapalıysa Ctrl+Enter). */
  enterGonder: boolean;
  /** Sesli okuma ve sesli sohbet hızı. */
  sesHizi: number;
  /** Düşünme kutusu açık başlasın. */
  dusunmeAcik: boolean;
  /** Sekme arka plandayken yanıt bitince tarayıcı bildirimi. */
  bildirim: boolean;
  /** İlk açılış tanışması görüldü mü. */
  tanisma: boolean;
}

export const VARSAYILAN_TERCIH: ScTercihler = {
  yaziTipi: "serif", yaziBoyutu: "orta", genis: false, varsayilanWeb: false, varsayilanDusun: false, varsayilanModel: null,
  oneriler: true, enterGonder: true, sesHizi: 1.04, dusunmeAcik: false, bildirim: false, tanisma: false,
};

export const useScTercih = create<ScTercihler & { ayarla: (p: Partial<ScTercihler>) => void; sifirla: () => void }>()(
  persist(
    (set) => ({ ...VARSAYILAN_TERCIH, ayarla: (p) => set(p), sifirla: () => set(VARSAYILAN_TERCIH) }),
    { name: "vayra-sc-tercih", version: 1, migrate: alanlariKoru },
  ),
);
