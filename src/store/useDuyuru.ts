"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * useDuyuru — sistem duyuruları (Higgsfield "Our terms have changed" tarzı).
 *
 * Merkezi bir duyuru kataloğu (DUYURULAR) tanımlanır; her duyurunun benzersiz
 * id'si vardır. Kullanıcı bir duyuruyu kapatınca id'si `goruldu`ye eklenir ve
 * bir daha çıkmaz. Yeni bir duyuru (politika/promo/güncelleme/bakım) eklemek
 * için sadece DUYURULAR'a yeni bir kayıt eklemek yeterli — otomatik gösterilir.
 */

export type DuyuruTur = "politika" | "promo" | "guncelleme" | "bakim" | "duyuru";

export type Duyuru = {
  id: string; // benzersiz — "terms-2026-08" gibi
  tur: DuyuruTur;
  baslik: string;
  mesaj: string;
  // İsteğe bağlı: onay kutusu gerektiren duyurular (politika gibi)
  onayGerekli?: boolean;
  onayMetni?: string;
  // Birincil buton
  btnMetin: string;
  // İsteğe bağlı yönlendirme (buton tıklanınca)
  link?: string;
  // İsteğe bağlı promo kodu (promo türü)
  promoKod?: string;
  // Yalnızca girişli kullanıcıya göster (varsayılan: herkese)
  yalnizGirisli?: boolean;
};

interface DuyuruState {
  goruldu: string[]; // görülüp kapatılan duyuru id'leri
  gordu: (id: string) => void;
  goruldüMu: (id: string) => boolean;
}

export const useDuyuru = create<DuyuruState>()(
  persist(
    (set, get) => ({
      goruldu: [],
      gordu: (id) => set((s) => (s.goruldu.includes(id) ? s : { goruldu: [...s.goruldu, id] })),
      goruldüMu: (id) => get().goruldu.includes(id),
    }),
    { name: "vayra-duyuru" },
  ),
);

/**
 * DUYURU KATALOĞU — tüm sistem duyuruları burada tanımlanır.
 * En üstteki görülmemiş duyuru gösterilir. Yeni duyuru = yeni kayıt.
 *
 * NOT: Gerçek üründe bu liste sunucudan gelir; burada demo amaçlı statik.
 * Örnek olarak KAPALI (boş) bırakıldı ki her açılışta pop-up bunaltmasın;
 * gerçek bir duyuru çıkarmak için aşağıya kayıt ekle.
 */
export const DUYURULAR: Duyuru[] = [
  // Tarihi geçmiş koşul duyurusu kaldırıldı (2026-11-07). Koşullar değişince kayıt sayfası onayı ve e-posta bildirimi kullanılır.
];
