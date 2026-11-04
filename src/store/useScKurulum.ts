import { create } from "zustand";
import { alanlariKoru } from "./gocHelper";
import { persist } from "zustand/middleware";
import { CALISANLAR, BECERILER } from "@/lib/scMarket";

/**
 * Usta Ayarlar — AI Çalışan / Beceri açma-kapama durumu. KALICI.
 *
 * Önce bu durum ekranların içinde `useState` ile tutuluyordu; sayfa
 * yenilenince açtığın beceri/çalışan kapanıyordu (ayar hiç kaydedilmiyordu).
 * Artık localStorage'da saklanır ve ilk açılışta katalogdaki
 * `varsayilanKurulu` alanından tohumlanır.
 */
interface ScKurulumState {
  /** Açık çalışan slug'ları. */
  calisanlar: string[];
  /** Açık beceri slug'ları. */
  beceriler: string[];
  calisanDegistir: (slug: string) => void;
  beceriDegistir: (slug: string) => void;
  calisanAcikMi: (slug: string) => boolean;
  beceriAcikMi: (slug: string) => boolean;
}

const degistir = (liste: string[], slug: string) =>
  liste.includes(slug) ? liste.filter((x) => x !== slug) : [...liste, slug];

export const useScKurulum = create<ScKurulumState>()(
  persist(
    (set, get) => ({
      // Tohum: katalogdaki varsayılan kurulu öğeler.
      calisanlar: CALISANLAR.filter((c) => c.varsayilanKurulu).map((c) => c.slug),
      beceriler: BECERILER.filter((b) => b.varsayilanKurulu).map((b) => b.slug),
      calisanDegistir: (slug) => set((s) => ({ calisanlar: degistir(s.calisanlar, slug) })),
      beceriDegistir: (slug) => set((s) => ({ beceriler: degistir(s.beceriler, slug) })),
      calisanAcikMi: (slug) => get().calisanlar.includes(slug),
      beceriAcikMi: (slug) => get().beceriler.includes(slug),
    }),
    { name: "vayra-sc-kurulum", version: 1, migrate: alanlariKoru },
  ),
);
