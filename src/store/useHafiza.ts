import { create } from "zustand";
import { alanlariKoru } from "./gocHelper";
import { persist } from "zustand/middleware";

export interface HafizaOge {
  id: string;
  metin: string;
  olusturma: number;
  /** Kapatılmış öğe hatırlanmaya devam eder ama isteme eklenmez (Claude davranışı). */
  kapali?: boolean;
}

interface HafizaState {
  /** Hafıza tümden açık mı — Claude'daki ana anahtar. */
  acik: boolean;
  ogeler: HafizaOge[];
  acikAyarla: (v: boolean) => void;
  ekle: (metin: string) => void;
  guncelle: (id: string, metin: string) => void;
  degistir: (id: string) => void;
  sil: (id: string) => void;
  tumunuSil: () => void;
}

let sayac = 0;

/**
 * Supercomputer hafızası — kullanıcı marka/tercih bilgisi; ajanlar her üretimde
 * hatırlar. Kalıcı.
 *
 * Claude'un hafıza ekranıyla eşleşmesi için genişletildi: ana açma/kapama
 * anahtarı, öğe düzenleme, öğe bazında devre dışı bırakma ve toplu silme.
 * (Bu ekran daha önce "otomatik yönetiliyor" denip kaldırılmıştı; Claude'da
 * hafıza kullanıcının görüp düzenlediği gerçek bir ayardır.)
 */
export const useHafiza = create<HafizaState>()(
  persist(
    (set) => ({
      acik: true,
      ogeler: [
        { id: "h_seed_1", metin: "Marka rengim canlı cyan ve koyu mor tonları.", olusturma: 0 },
        { id: "h_seed_2", metin: "Hedef kitlem 18-30 yaş, sinematik ve modern içerik seviyor.", olusturma: 0 },
      ],
      acikAyarla: (v) => set({ acik: v }),
      ekle: (metin) => {
        sayac += 1;
        set((s) => ({
          ogeler: [{ id: `h_${sayac}_${Math.floor(performance.now())}`, metin, olusturma: Date.now() }, ...s.ogeler],
        }));
      },
      guncelle: (id, metin) =>
        set((s) => ({ ogeler: s.ogeler.map((x) => (x.id === id ? { ...x, metin } : x)) })),
      degistir: (id) =>
        set((s) => ({ ogeler: s.ogeler.map((x) => (x.id === id ? { ...x, kapali: !x.kapali } : x)) })),
      sil: (id) => set((s) => ({ ogeler: s.ogeler.filter((x) => x.id !== id) })),
      tumunuSil: () => set({ ogeler: [] }),
    }),
    { name: "vayra-hafiza", version: 2, migrate: alanlariKoru },
  ),
);
