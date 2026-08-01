"use client";

/**
 * useAyarKopru — üretim detayından composer'a AYAR GERİ YÜKLEME köprüsü.
 *
 * Sorun (kullanıcı geri bildirimi, 2026-07-31): detay panelindeki kopyala
 * butonu prompt'u yalnızca PANOYA alıyordu. Kullanıcının beklediği davranış
 * "bu üretimi tekrar yap": o iş hangi model, çözünürlük, oran, prompt, element
 * ve referanslarla üretildiyse hepsi composer'a dolsun, panel kapansın.
 *
 * Çözüm: useReferansKopru ile aynı pub/sub deseni. UretimDetay bir "ayarları
 * yükle" isteği yayınlar; stüdyo sayfası (gorsel/video) dinler, kendi
 * composer state'ine uygular ve isteği tüketir.
 *
 * Neden ayrı store: useReferansKopru TEK bir görseli referans olarak ekler
 * (üretimi değiştirmez). Bu köprü ise composer'ın TÜM ayarlarını değiştirir —
 * iki davranışı tek isteğe sıkıştırmak ikisini de bulanıklaştırırdı.
 *
 * persist YOK — oturum içi anlık köprü.
 */

import { create } from "zustand";

export type AyarIstek = {
  /** Hedef stüdyo: isteği yalnız doğru sayfa tüketsin. */
  tur: string; // "gorsel" | "video" | "ses" | "3d"
  prompt: string;
  model?: string;
  /** meta.oran — "16:9" gibi. */
  oran?: string;
  /** meta.cozunurluk — "1080p" / "4K" gibi. */
  cozunurluk?: string;
  /** meta.sure — video/ses uzunluğu. */
  sure?: string;
  /** Üretimde kullanılan referans görselleri. */
  referanslar?: { ad: string; url: string }[];
  /** Prompt içindeki @element adları. */
  elementler?: string[];
  baslik?: string;
  zaman: number;
};

type AyarKopruState = {
  istek: AyarIstek | null;
  /** Ayar geri yükleme isteği yayınla (UretimDetay çağırır). */
  gonder: (istek: Omit<AyarIstek, "zaman">) => void;
  /** İsteği tüket (dinleyen sayfa uyguladıktan sonra temizler). */
  tuket: () => void;
};

export const useAyarKopru = create<AyarKopruState>((set) => ({
  istek: null,
  gonder: (istek) => set({ istek: { ...istek, zaman: Date.now() } }),
  tuket: () => set({ istek: null }),
}));
