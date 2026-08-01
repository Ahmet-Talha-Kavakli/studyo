"use client";

/**
 * useGorevler — Görevler & Ödüller sistemi (m49).
 *
 * Kullanıcı belli görevleri tamamlayınca GERÇEKTEN kredi kazanır (useAuth'a
 * ekKredi/kredi eklenir). İlerleme kalıcı saklanır; bir görev tamamlanınca
 * ödül tek sefer verilir (tekrar alınamaz). Günlük görevler her gün sıfırlanır
 * (son tamamlanma günü kontrol edilerek).
 */

import { create } from "zustand";
import { alanlariKoru } from "./gocHelper";
import { persist } from "zustand/middleware";

export type GorevTip = "gunluk" | "baslangic" | "sosyal" | "uretim";

export interface Gorev {
  id: string;
  tip: GorevTip;
  baslik: string;
  aciklama: string;
  odul: number;          // kazanılacak kredi
  hedef: number;         // tamamlanma için gereken adım sayısı
}

/** Tüm görevler (katalog). İlerleme ayrı tutulur. */
export const GOREVLER: Gorev[] = [
  { id: "ilk-uretim", tip: "baslangic", baslik: "İlk üretimini yap", aciklama: "Herhangi bir stüdyoda ilk içeriğini oluştur.", odul: 50, hedef: 1 },
  { id: "profil-tamamla", tip: "baslangic", baslik: "Profilini tamamla", aciklama: "Ad, avatar ve biyografini ekle.", odul: 30, hedef: 1 },
  { id: "element-olustur", tip: "baslangic", baslik: "İlk elementini oluştur", aciklama: "Bir karakter, stil veya obje elementi kaydet.", odul: 40, hedef: 1 },
  { id: "gunluk-uretim", tip: "gunluk", baslik: "Günlük 3 üretim", aciklama: "Bugün 3 içerik üret.", odul: 25, hedef: 3 },
  { id: "gunluk-giris", tip: "gunluk", baslik: "Günlük giriş", aciklama: "Her gün uğra, bonusunu al.", odul: 10, hedef: 1 },
  { id: "toplulukta-yayinla", tip: "sosyal", baslik: "Toplulukta yayınla", aciklama: "Bir üretimini Keşfet'te yayınla.", odul: 35, hedef: 1 },
  { id: "davet-et", tip: "sosyal", baslik: "Bir arkadaşını davet et", aciklama: "Davet bağlantınla katılan ilk kişi.", odul: 100, hedef: 1 },
  { id: "5-yorum", tip: "sosyal", baslik: "5 yorum yap", aciklama: "Topluluk içeriklerine 5 yorum ekle.", odul: 20, hedef: 5 },
  { id: "10-uretim", tip: "uretim", baslik: "10 üretime ulaş", aciklama: "Toplam 10 içerik üret.", odul: 60, hedef: 10 },
  { id: "3-studyo", tip: "uretim", baslik: "3 farklı stüdyo dene", aciklama: "Görsel, video, ses… 3 farklı stüdyoda üret.", odul: 45, hedef: 3 },
];

interface GorevlerState {
  ilerleme: Record<string, number>;     // görev id → mevcut adım
  alinanlar: string[];                  // ödülü alınmış görev id'leri
  sonGunlukGun: string;                 // günlük görevlerin sıfırlandığı son gün (YYYY-MM-DD)
  ilerlet: (id: string, adim?: number) => void;
  /** Ödülü teslim al (tamamlanmışsa). onKrediEkle: gerçek kredi ekleme geri-çağrısı. */
  odulAl: (id: string, onKrediEkle: (miktar: number) => void) => boolean;
  gunlukKontrol: () => void;
}

function bugununGunu(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const useGorevler = create<GorevlerState>()(
  persist(
    (set, get) => ({
      ilerleme: {},
      alinanlar: [],
      sonGunlukGun: "",
      ilerlet: (id, adim = 1) =>
        set((s) => {
          const g = GOREVLER.find((x) => x.id === id);
          if (!g) return s;
          const mevcut = s.ilerleme[id] ?? 0;
          return { ilerleme: { ...s.ilerleme, [id]: Math.min(g.hedef, mevcut + adim) } };
        }),
      odulAl: (id, onKrediEkle) => {
        const s = get();
        const g = GOREVLER.find((x) => x.id === id);
        if (!g) return false;
        if (s.alinanlar.includes(id)) return false; // zaten alınmış
        if ((s.ilerleme[id] ?? 0) < g.hedef) return false; // tamamlanmamış
        onKrediEkle(g.odul);
        set({ alinanlar: [...s.alinanlar, id] });
        return true;
      },
      gunlukKontrol: () => {
        const bugun = bugununGunu();
        const s = get();
        if (s.sonGunlukGun === bugun) return;
        // Günlük görevlerin ilerlemesini + alınma durumunu sıfırla.
        const gunlukIdler = GOREVLER.filter((g) => g.tip === "gunluk").map((g) => g.id);
        const ilerleme = { ...s.ilerleme };
        gunlukIdler.forEach((id) => { delete ilerleme[id]; });
        set({
          ilerleme,
          alinanlar: s.alinanlar.filter((id) => !gunlukIdler.includes(id)),
          sonGunlukGun: bugun,
        });
      },
    }),
    { name: "vayra-gorevler", version: 1, migrate: alanlariKoru },
  ),
);
