"use client";

import { create } from "zustand";
import { alanlariKoru } from "./gocHelper";
import { persist } from "zustand/middleware";

export interface Bildirim {
  id: string;
  baslik: string;
  mesaj: string;
  tur: "basari" | "bilgi" | "uyari" | "hata";
  okundu: boolean;
  zaman: number;
  link?: string; // tıklayınca gidilecek rota (ör. /panel/kitaplik)
  /** İlgili üretimin kimliği — bildirime tıklanınca doğrudan o üretimin lightbox'ı açılır. */
  uretimId?: string;
  /** Aynı olayın tekrar tekrar bildirilmesini engelleyen anahtar (ör. "kredi-dusuk"). */
  anahtar?: string;
}

interface BildirimState {
  bildirimler: Bildirim[];
  ekle: (b: Omit<Bildirim, "id" | "zaman" | "okundu">) => void;
  /** `anahtar` ile aynı olayı yalnızca bir kez (veya soğuma süresi sonra) bildirir. */
  ekleTek: (b: Omit<Bildirim, "id" | "zaman" | "okundu"> & { anahtar: string }, soguma?: number) => void;
  okunduIsaretle: (id: string) => void;
  tumunuOku: () => void;
  sil: (id: string) => void;
  tumunuSil: () => void;
}

let bId = 0;

export const useBildirim = create<BildirimState>()(
  persist(
    (set, get) => ({
      bildirimler: [
        { id: "b0", baslik: "Ödüllerin yakında açılıyor 🎁", mesaj: "Görevleri tamamla, bonusları topla ve sınırsız Ruh 2.0'ın kilidini aç. Sonraki döngü başladığında açılır.", tur: "bilgi", okundu: false, zaman: Date.now() - 1800_000 },
        { id: "b1", baslik: "Vayra'ya hoş geldin! 🎉", mesaj: "İlk sinematik içeriğini oluşturmaya hazır mısın?", tur: "bilgi", okundu: false, zaman: Date.now() - 3600_000 },
        { id: "b2", baslik: "$100.000 Uygulama Yarışması başladı 🏆", mesaj: "Supercomputer veya MCP ile bir uygulama gönder, ödül havuzundan pay al. Son gün: 22 Temmuz.", tur: "basari", okundu: false, zaman: Date.now() - 5400_000 },
        { id: "b3", baslik: "3D Stüdyo yayında", mesaj: "Meshy ile metinden 3D model üretmeyi dene.", tur: "basari", okundu: false, zaman: Date.now() - 7200_000 },
        { id: "b4", baslik: "50 bonus kredi kazandın 🎁", mesaj: "Hoş geldin hediyesi hesabına tanımlandı.", tur: "basari", okundu: false, zaman: Date.now() - 10800_000 },
        { id: "b5", baslik: "Ses Stüdyosu güncellendi", mesaj: "Artık 18 dilde çeviri ve ses klonlama yapabilirsin.", tur: "bilgi", okundu: true, zaman: Date.now() - 86400_000 },
        { id: "b6", baslik: "Kredin azalıyor", mesaj: "Kalan kredin 200'ün altına düştüğünde haber vereceğiz.", tur: "uyari", okundu: true, zaman: Date.now() - 172800_000 },
      ],
      ekle: (b) =>
        set((s) => ({
          bildirimler: [
            { ...b, id: `b_${(bId += 1)}_${s.bildirimler.length}`, zaman: Date.now(), okundu: false },
            ...s.bildirimler,
          ].slice(0, 40),
        })),
      /**
       * Tekrarlayan olayları bir kez bildirir (ör. "kredin azaldı" her üretimde
       * düşmesin). `soguma` ms içinde aynı anahtarlı bildirim varsa atlar.
       */
      ekleTek: (b, soguma = 6 * 60 * 60 * 1000) => {
        const varOlan = get().bildirimler.find((x) => x.anahtar === b.anahtar);
        if (varOlan && Date.now() - varOlan.zaman < soguma) return;
        set((s) => ({
          bildirimler: [
            { ...b, id: `b_${(bId += 1)}_${s.bildirimler.length}`, zaman: Date.now(), okundu: false },
            ...s.bildirimler.filter((x) => x.anahtar !== b.anahtar),
          ].slice(0, 40),
        }));
      },
      okunduIsaretle: (id) =>
        set((s) => ({ bildirimler: s.bildirimler.map((x) => (x.id === id ? { ...x, okundu: true } : x)) })),
      tumunuOku: () => set((s) => ({ bildirimler: s.bildirimler.map((x) => ({ ...x, okundu: true })) })),
      sil: (id) => set((s) => ({ bildirimler: s.bildirimler.filter((x) => x.id !== id) })),
      tumunuSil: () => set({ bildirimler: [] }),
    }),
    { name: "vayra-bildirim", version: 3, migrate: alanlariKoru },
  ),
);
