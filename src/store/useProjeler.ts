"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ModelTur } from "@/lib/catalog";
import { SEED_URETIMLER } from "@/lib/seed-uretimler";
import { onizlemeArka } from "@/lib/utils";

// Üretim türüne göre stok görsel kategorisi (uretimMotoru ile aynı mantık).
function turKategori(tur: string): string {
  return tur === "video" ? "sinematik" : tur === "3d" ? "3d" : tur === "ses" ? "soyut" : "portre";
}
// Eski kayıtların gradyan gorselUrl'ünü gerçek stok görselle değiştirir (Higgsfield birebir dolu görünüm).
// Gerçek çıktı (data:/http/stok) olanlara dokunmaz; yalnızca salt-gradyan olanları yükseltir.
function gorseliYukselt(u: Uretim): Uretim {
  if (u.tur === "ses" && u.sesUrl) return u; // ses zaten sesUrl kullanır
  const g = u.gorselUrl;
  const gercek = g && (g.includes("/stok/") || g.startsWith("data:") || g.startsWith("http") || g.startsWith("/"));
  if (gercek) return u; // zaten gerçek görsel/stok var
  // Salt gradyan (veya boş) → deterministik stok görselle doldur
  return { ...u, gorselUrl: onizlemeArka((u.prompt || u.baslik) + u.model, turKategori(u.tur)) };
}

export interface Uretim {
  id: string;
  baslik: string;
  tur: ModelTur;
  model: string;
  prompt: string;
  durum: "kuyrukta" | "isleniyor" | "tamam" | "hata";
  ilerleme: number;
  gorselUrl?: string; // önizleme (gradient/placeholder veya gerçek görsel)
  sesUrl?: string; // gerçek ses çıktısı (data-uri/http)
  videoUrl?: string; // gerçek video çıktısı (Replicate http)
  glbUrl?: string; // gerçek 3D model (Meshy GLB)
  thumbnailUrl?: string; // 3D önizleme görseli
  varyasyonlar?: { thumb: string; glb?: string }[]; // Meshy: bir üretimde 4 aday model
  secilenVaryasyon?: number; // kullanıcının seçtiği varyasyon indeksi
  topoloji?: { poligon: number; tip: "quad" | "triangle"; pbr: boolean }; // 3D mesh bilgisi
  animasyonlar?: string[]; // uygulanan animasyon preset adları (Yürü/Koş/Dans…)
  etiketler?: string[]; // kullanıcının modele eklediği etiketler (Meshy: Etiket Ekle)
  poz?: string; // uygulanan poz preset adı (Yumruk/Savunma/Diz Çök…)
  dokuCozunurluk?: string; // "2K" | "4K" (retexture)
  muzik?: { sozler?: string; tur?: string; ruhHali?: string[]; bpm?: number; key?: string; vokal?: string; sure?: number; dil?: string; kapak?: string; enstrumanlar?: string[]; varyant?: number }; // müzik/şarkı meta
  olusturma: number;
  kredi: number;
  favori?: boolean;
  yayinda?: boolean; // Keşfet topluluğunda yayınlandı mı
  arac?: string; // hangi araç/studio üretti
  /* hamIstem: kullanıcının YAZDIĞI istem — `prompt` alanına üretim sırasında
     ayar notları ekleniyor (" · 4K", " · 1 referans görsele sadık kal" …).
     "Bu ayarlarla üret" composer'a bu ham metni yazar; `prompt` yazılsaydı
     notlar her geri yüklemede birikirdi. */
  meta?: { oran?: string; cozunurluk?: string; sure?: string; ses?: string; gorselUrl?: string; hamIstem?: string }; // gerçekçi çıktı bilgisi
  saglayici?: string; // "eleven" | "meshy" | "openai" | "replicate" | "simulasyon"
  gercek?: boolean; // gerçek API çıktısı mı, demo mu
  projeId?: string; // bu üretimin ait olduğu ortak proje (useProje). undefined = bağımsız üretim
}

interface ProjelerState {
  uretimler: Uretim[];
  ekle: (u: Omit<Uretim, "id" | "olusturma">) => string;
  guncelle: (id: string, patch: Partial<Uretim>) => void;
  sil: (id: string) => void;
  favoriToggle: (id: string) => void;
  temizle: () => void;
}

let sayac = 0;
function yeniId() {
  sayac += 1;
  /* DİKKAT: `sayac` ve `performance.now()` ikisi de SAYFA YENİLENİNCE sıfırlanır.
     Yalnız bu ikisiyle üretilen id, yeniden yüklenmiş sayfada birebir tekrar
     edebiliyordu → localStorage'daki eski üretimle çakışıp React'te
     "two children with the same key" hatası veriyordu (ızgara bozuluyordu).
     Date.now() (duvar saati) + rastgele son ek çakışmayı kesin engeller. */
  return `u_${sayac}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useProjeler = create<ProjelerState>()(
  persist(
    (set) => ({
      // İlk ziyaret (boş localStorage): deterministik seed'lerle DOLU başla.
      // Kullanıcı bir üretim yaptığında persist devreye girer ve sonraki
      // ziyarette localStorage'daki kendi verisi bu initial state'i geçersiz kılar.
      // SEED_URETIMLER tamamen deterministik olduğu için bu initial state SSR-güvenli.
      uretimler: SEED_URETIMLER,
      ekle: (u) => {
        const id = yeniId();
        const yeni: Uretim = { ...u, id, olusturma: Date.now() };
        set((s) => ({ uretimler: [yeni, ...s.uretimler] }));
        return id;
      },
      guncelle: (id, patch) =>
        set((s) => ({
          uretimler: s.uretimler.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      sil: (id) => set((s) => ({ uretimler: s.uretimler.filter((x) => x.id !== id) })),
      favoriToggle: (id) =>
        set((s) => ({
          uretimler: s.uretimler.map((x) =>
            x.id === id ? { ...x, favori: !x.favori } : x,
          ),
        })),
      temizle: () => set({ uretimler: [] }),
    }),
    {
      name: "vayra-projeler",
      version: 3,
      // v2: eski kullanıcıların GRADYAN gorselUrl'lü üretimlerini gerçek stok görsele yükseltir.
      // v3: `projeId?` alanı eklendi (ortak proje mimarisi). Eski üretimler projeId olmadan kalır
      // ("bağımsız üretim") — VERİ KAYBI YOK. Kullanıcı verisi korunur, seed'lerle ezilmez.
      migrate: (persisted) => {
        const s = persisted as ProjelerState;
        if (s && Array.isArray(s.uretimler)) {
          return { ...s, uretimler: s.uretimler.map(gorseliYukselt) };
        }
        return s;
      },
    },
  ),
);
