"use client";

/**
 * useReferansKopru — üretim detayından composer'a REFERANS köprüsü (m7, m13).
 *
 * Sorun: UretimDetay bileşeni UretimKarti içinde render ediliyor; açan sayfanın
 * (gorsel/video) lokal `referanslar` state'ine doğrudan erişemez. "Referans"
 * butonu eskiden sessionStorage'a yazıp /panel/olustur'a atıyordu → kullanıcının
 * gördüğü "saçma ekran".
 *
 * Çözüm: hafif bir yayın (pub/sub) store'u. UretimDetay bir referans isteği
 * yayınlar (url + tür + kaynak sayfa); ilgili stüdyo sayfası (gorsel/video/ses)
 * bunu dinler, AYNI türdeyse composer'ına anında ekler ve isteği temizler.
 * Farklı türse (ör. görselden video) hedef sayfaya yönlendirme yapılır ve
 * o sayfa açılışta bekleyen isteği tüketir.
 *
 * persist YOK — oturum içi anlık köprü; sayfa yenilenince temizlenir.
 */

import { create } from "zustand";

export type ReferansIstek = {
  url: string;        // görselin bare URL'i (data: veya http)
  tur: string;        // "gorsel" | "video" | "ses" | "3d"
  baslik: string;
  prompt: string;
  zaman: number;
};

type ReferansKopruState = {
  istek: ReferansIstek | null;
  /** Bir referans isteği yayınla (UretimDetay çağırır). */
  gonder: (istek: Omit<ReferansIstek, "zaman">) => void;
  /** İsteği tüket (dinleyen sayfa işledikten sonra temizler). */
  tuket: () => void;
};

export const useReferansKopru = create<ReferansKopruState>((set) => ({
  istek: null,
  gonder: (istek) => set({ istek: { ...istek, zaman: Date.now() } }),
  tuket: () => set({ istek: null }),
}));
