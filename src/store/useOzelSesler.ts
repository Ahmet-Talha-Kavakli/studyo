"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Seslendirme için kullanıcının kendi sesleri (klonlar).
 *  • durum "klonlandi": sağlayıcıda klon oluşturuldu, `sesId` ile üretimde kullanılır.
 *  • durum "ornek": örnek kaydedildi ama klonlanmadı (sağlayıcı bağlı değildi) — üretimde
 *    kullanılamaz; bağlantı kurulunca tek tıkla klonlanır.
 * Örnek ses dosyası IndexedDB'de (yerelDepo) `ornekAnahtar` ile durur.
 */
export interface OzelSes {
  id: string;
  ad: string;
  cinsiyet: "Kadın" | "Erkek" | "Nötr";
  durum: "klonlandi" | "ornek";
  sesId?: string;
  ornekAnahtar: string;
  ornekSn: number;
  /** Nasıl oluşturuldu: kayıttan klon ya da metinden tasarım. */
  kaynak?: "klon" | "tasarim";
  /** Tasarım sesinde kullanıcının tarifi. */
  aciklama?: string;
  /** Kullanıcının etiketleri (aksan, yaş, kullanım…). */
  etiketler?: Record<string, string>;
  /** Remiks ile türetildiyse kaynak sesin sağlayıcı kimliği. */
  remixKaynak?: string;
  olusturma: number;
}

/** Favori anahtarı: "hazir:<ad>", "ozel:<id>" ya da "topluluk:<sesId>". Topluluk sesleri yerelde olmadığından özeti saklanır. */
export type ToplulukOzet = { sesId: string; sahip: string; ad: string; tanim?: string; cinsiyet: "Kadın" | "Erkek" | "Nötr"; aksan?: string; kullanim?: string; onizleme?: string };
export type Favori = { eklendi: number; topluluk?: ToplulukOzet };

interface Durum {
  sesler: OzelSes[];
  favoriler: Record<string, Favori>;
  favoriDegistir: (anahtar: string, topluluk?: ToplulukOzet) => void;
  ekle: (s: Omit<OzelSes, "id" | "olusturma">) => OzelSes;
  guncelle: (id: string, d: Partial<OzelSes>) => void;
  sil: (id: string) => void;
}

export const useOzelSesler = create<Durum>()(
  persist(
    (set) => ({
      sesler: [],
      favoriler: {},
      favoriDegistir: (anahtar, topluluk) => set((d) => {
        const f = { ...d.favoriler };
        if (f[anahtar]) delete f[anahtar];
        else f[anahtar] = { eklendi: Date.now(), ...(topluluk ? { topluluk } : {}) };
        return { favoriler: f };
      }),
      ekle: (s) => {
        const yeni: OzelSes = { ...s, id: `os_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`, olusturma: Date.now() };
        set((d) => ({ sesler: [yeni, ...d.sesler] }));
        return yeni;
      },
      guncelle: (id, d) => set((x) => ({ sesler: x.sesler.map((s) => (s.id === id ? { ...s, ...d } : s)) })),
      sil: (id) => set((x) => {
        const favoriler = { ...x.favoriler };
        delete favoriler["ozel:" + id];
        return { sesler: x.sesler.filter((s) => s.id !== id), favoriler };
      }),
    }),
    { name: "vayra-ozel-sesler", version: 1 },
  ),
);
