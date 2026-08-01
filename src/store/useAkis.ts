"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  AKIS_TOHUM, tohumYorumlar,
  type AkisGonderi, type AkisYorum, type AkisTur,
} from "@/lib/akisVeri";

/**
 * Akış — TikTok-tarzı topluluk feed'inin canlı durumu.
 *
 * MİMARİ: Kurgusal tohumlar (akisVeri.AKIS_TOHUM) SABİTTİR ve persist EDİLMEZ
 * (kod güncellenince otomatik tazelenir). Store yalnızca DELTA'yı tutar:
 *   - kullanıcının kendi paylaşımları (paylasimlar)
 *   - etkileşim: beğeni/kaydet/takip setleri, ek yorumlar, ek görüntülenme
 * `feed` selector'ı tohum + paylaşım + delta'yı birleştirir.
 *
 * ZUSTAND KURALI: Selector'lar YENİ DİZİ döndürmez. Ham state alınır,
 * bileşende useMemo ile türetilir (getSnapshot cache / sonsuz döngü fix).
 */

// Kullanıcının Akış'ta paylaştığı kendi gönderisi (kitaplık üretiminden türer).
export type Paylasim = {
  id: string; // "akis_pay_<uretimId>"
  uretimId?: string; // kaynak üretim (kitaplıkta)
  kullanici: "@ben"; // kullanıcının handle'ı
  tur: AkisTur;
  baslik: string;
  aciklama: string;
  model: string;
  etiketler: string[];
  gorselUrl: string;
  videoUrl?: string;
  oran: "9:16" | "16:9" | "1:1";
  muzik: string;
  izinYenidenOlustur: boolean;
  kredi: number;
  olusturma: number; // gerçek zaman damgası
};

// Feed'de dolaşan birleşik gönderi tipi (tohum + paylaşım ortak arayüz).
export type FeedGonderi = AkisGonderi & {
  benimMi?: boolean;
  videoUrl?: string;
};

// Etkileşim delta'sı (id → sayı ekleme).
type Sayaclar = Record<string, number>;

// m4: Ücretli hediye türleri (TikTok mantığı: kredi karşılığı gönderilir).
export type HediyeTur = "gul" | "kalp" | "alev" | "roket" | "elmas" | "ejderha";
export const HEDIYELER: { tur: HediyeTur; ad: string; ikon: string; kredi: number }[] = [
  { tur: "gul", ad: "Gül", ikon: "🌹", kredi: 1 },
  { tur: "kalp", ad: "Kalp", ikon: "💖", kredi: 5 },
  { tur: "alev", ad: "Alev", ikon: "🔥", kredi: 15 },
  { tur: "roket", ad: "Roket", ikon: "🚀", kredi: 50 },
  { tur: "elmas", ad: "Elmas", ikon: "💎", kredi: 100 },
  { tur: "ejderha", ad: "Ejderha", ikon: "🐉", kredi: 500 },
];

// m4: Gönderiye gönderilen hediye kaydı.
export type Hediye = { id: string; gonderiId: string; tur: HediyeTur; kredi: number; zaman: number };

// m4: Instagram-tarzı hikaye (24 saat, kullanıcının kendi profilinde).
export type Hikaye = { id: string; gorselUrl: string; zaman: number; goruntulenme: number };

interface AkisState {
  paylasimlar: Paylasim[];
  begeniler: string[]; // beğenilen gönderi id'leri
  begenmeyenler: string[]; // m4: dislike edilen gönderi id'leri
  repostlar: string[]; // m4: repost (yeniden paylaşım) edilen gönderi id'leri
  kayitlar: string[]; // kaydedilen (bookmark) gönderi id'leri
  takipler: string[]; // takip edilen @kullanici'lar
  ekYorumlar: Record<string, AkisYorum[]>; // gonderiId → kullanıcı yorumları
  ekYanitlar: Record<string, AkisYorum[]>; // yorumId → kullanıcı yanıtları
  yorumBegeni: string[]; // beğenilen yorum id'leri
  ekGoruntulenme: Sayaclar; // gonderiId → izlenme artışı (kullanıcı gördükçe)
  gizlenenler: string[]; // "ilgilenmiyorum" denen gönderiler
  raporlananlar: string[]; // m4: raporlanan gönderi id'leri
  hediyeler: Hediye[]; // m4: kullanıcının gönderdiği hediyeler
  hikayeler: Hikaye[]; // m4: kullanıcının kendi hikayeleri (Instagram-tarzı)
  goruntulenenHikayeler: string[]; // m4: görüntülenen (kurgusal) hikaye handle'ları
  benimBanner: string | null; // kullanıcının kendi profil banner'ı (data-uri/url)
  benimBio: string; // kullanıcının kendi bio'su
  // m4: içerik-üretici / mavi tik durumu
  maviTik: boolean; // kullanıcı doğrulanmış mı (mavi tik satın alındı mı)
  icerikUretici: boolean; // içerik üretici modu aktif mi

  // paylaşım
  paylas: (p: Omit<Paylasim, "id" | "kullanici" | "olusturma">) => string;
  paylasimKaldir: (id: string) => void;
  paylasildiMi: (uretimId: string) => boolean;

  // etkileşim
  begeniToggle: (id: string) => void;
  begenmeToggle: (id: string) => void; // m4: dislike
  repostToggle: (id: string) => void; // m4: repost
  kayitToggle: (id: string) => void;
  takipToggle: (kullanici: string) => void;
  yorumEkle: (gonderiId: string, metin: string) => void;
  yanitEkle: (yorumId: string, metin: string) => void;
  yorumBegeniToggle: (yorumId: string) => void;
  goruntulendi: (id: string) => void;
  gizle: (id: string) => void;
  raporla: (id: string) => void; // m4: raporla/şikayet et
  hediyeGonder: (gonderiId: string, tur: HediyeTur) => Hediye; // m4
  maviTikAl: () => void; // m4: doğrulanmış rozet
  icerikUreticiOl: () => void; // m4: içerik üretici modu
  hikayeEkle: (gorselUrl: string) => void; // m4: kendi hikayeni ekle
  hikayeSil: (id: string) => void; // m4
  hikayeGoruldu: (handle: string) => void; // m4: bir hikaye izlendi
  bannerAyarla: (url: string | null) => void;
  bioAyarla: (bio: string) => void;
}

let sayac = 0;
const yeniYorumId = () => `y_${sayac++}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

export const useAkis = create<AkisState>()(
  persist(
    (set, get) => ({
      paylasimlar: [],
      begeniler: [],
      begenmeyenler: [],
      repostlar: [],
      kayitlar: [],
      takipler: [],
      ekYorumlar: {},
      ekYanitlar: {},
      yorumBegeni: [],
      ekGoruntulenme: {},
      gizlenenler: [],
      raporlananlar: [],
      hediyeler: [],
      hikayeler: [],
      goruntulenenHikayeler: [],
      benimBanner: null,
      benimBio: "",
      maviTik: false,
      icerikUretici: false,

      paylas: (p) => {
        const id = `akis_pay_${p.uretimId ?? sayac++}_${Date.now().toString(36)}`;
        set((s) => ({
          paylasimlar: [
            { ...p, id, kullanici: "@ben", olusturma: Date.now() },
            ...s.paylasimlar,
          ],
        }));
        return id;
      },
      paylasimKaldir: (id) =>
        set((s) => ({ paylasimlar: s.paylasimlar.filter((x) => x.id !== id && x.uretimId !== id) })),
      paylasildiMi: (uretimId) => get().paylasimlar.some((x) => x.uretimId === uretimId),

      begeniToggle: (id) =>
        set((s) => ({
          begeniler: s.begeniler.includes(id)
            ? s.begeniler.filter((x) => x !== id)
            : [...s.begeniler, id],
          // Beğenince dislike'ı kaldır (karşılıklı dışlar).
          begenmeyenler: s.begenmeyenler.filter((x) => x !== id),
        })),
      // m4: dislike — beğeniyle karşılıklı dışlar.
      begenmeToggle: (id) =>
        set((s) => ({
          begenmeyenler: s.begenmeyenler.includes(id)
            ? s.begenmeyenler.filter((x) => x !== id)
            : [...s.begenmeyenler, id],
          begeniler: s.begeniler.filter((x) => x !== id),
        })),
      // m4: repost — gönderiyi yeniden paylaş.
      repostToggle: (id) =>
        set((s) => ({
          repostlar: s.repostlar.includes(id)
            ? s.repostlar.filter((x) => x !== id)
            : [...s.repostlar, id],
        })),
      kayitToggle: (id) =>
        set((s) => ({
          kayitlar: s.kayitlar.includes(id)
            ? s.kayitlar.filter((x) => x !== id)
            : [...s.kayitlar, id],
        })),
      takipToggle: (kullanici) =>
        set((s) => ({
          takipler: s.takipler.includes(kullanici)
            ? s.takipler.filter((x) => x !== kullanici)
            : [...s.takipler, kullanici],
        })),
      yorumEkle: (gonderiId, metin) =>
        set((s) => {
          const yorum: AkisYorum = { id: yeniYorumId(), kullanici: "@ben", metin, begeni: 0, ofset: 0 };
          return {
            ekYorumlar: {
              ...s.ekYorumlar,
              [gonderiId]: [yorum, ...(s.ekYorumlar[gonderiId] ?? [])],
            },
          };
        }),
      yanitEkle: (yorumId, metin) =>
        set((s) => {
          const yanit: AkisYorum = { id: yeniYorumId(), kullanici: "@ben", metin, begeni: 0, ofset: 0 };
          return { ekYanitlar: { ...s.ekYanitlar, [yorumId]: [...(s.ekYanitlar[yorumId] ?? []), yanit] } };
        }),
      yorumBegeniToggle: (yorumId) =>
        set((s) => ({
          yorumBegeni: s.yorumBegeni.includes(yorumId)
            ? s.yorumBegeni.filter((x) => x !== yorumId)
            : [...s.yorumBegeni, yorumId],
        })),
      goruntulendi: (id) =>
        set((s) => {
          // Aynı oturumda tekrar tekrar saymamak için: sadece ilk görüntülemede +1.
          if (s.ekGoruntulenme[id]) return s;
          return { ekGoruntulenme: { ...s.ekGoruntulenme, [id]: 1 } };
        }),
      gizle: (id) =>
        set((s) => ({ gizlenenler: [...s.gizlenenler, id] })),
      // m4: raporla/şikayet — raporlanan gönderi feed'den de gizlenir.
      raporla: (id) =>
        set((s) => ({
          raporlananlar: s.raporlananlar.includes(id) ? s.raporlananlar : [...s.raporlananlar, id],
          gizlenenler: s.gizlenenler.includes(id) ? s.gizlenenler : [...s.gizlenenler, id],
        })),
      // m4: hediye gönder — kredi düşürme çağıran bileşende (useAuth) yapılır.
      hediyeGonder: (gonderiId, tur) => {
        const meta = HEDIYELER.find((h) => h.tur === tur)!;
        const hediye: Hediye = { id: `hd_${sayac++}_${Date.now().toString(36)}`, gonderiId, tur, kredi: meta.kredi, zaman: Date.now() };
        set((s) => ({ hediyeler: [hediye, ...s.hediyeler] }));
        return hediye;
      },
      maviTikAl: () => set({ maviTik: true }),
      icerikUreticiOl: () => set({ icerikUretici: true }),
      // m4: hikaye ekle/sil/görüldü (Instagram-tarzı, 24 saat sınırı UI'da).
      hikayeEkle: (gorselUrl) =>
        set((s) => ({
          hikayeler: [{ id: `hk_${sayac++}_${Date.now().toString(36)}`, gorselUrl, zaman: Date.now(), goruntulenme: 0 }, ...s.hikayeler],
        })),
      hikayeSil: (id) => set((s) => ({ hikayeler: s.hikayeler.filter((h) => h.id !== id) })),
      hikayeGoruldu: (handle) =>
        set((s) => (s.goruntulenenHikayeler.includes(handle) ? s : { goruntulenenHikayeler: [...s.goruntulenenHikayeler, handle] })),
      bannerAyarla: (url) => set({ benimBanner: url }),
      bioAyarla: (bio) => set({ benimBio: bio }),
    }),
    {
      name: "vayra-akis",
      // Kurgusal tohumlar persist EDİLMEZ — yalnızca kullanıcı delta'sı saklanır.
      partialize: (s) => ({
        paylasimlar: s.paylasimlar,
        begeniler: s.begeniler,
        begenmeyenler: s.begenmeyenler,
        repostlar: s.repostlar,
        kayitlar: s.kayitlar,
        takipler: s.takipler,
        ekYorumlar: s.ekYorumlar,
        ekYanitlar: s.ekYanitlar,
        yorumBegeni: s.yorumBegeni,
        ekGoruntulenme: s.ekGoruntulenme,
        gizlenenler: s.gizlenenler,
        raporlananlar: s.raporlananlar,
        hediyeler: s.hediyeler,
        hikayeler: s.hikayeler,
        goruntulenenHikayeler: s.goruntulenenHikayeler,
        benimBanner: s.benimBanner,
        benimBio: s.benimBio,
        maviTik: s.maviTik,
        icerikUretici: s.icerikUretici,
      }),
    },
  ),
);

// ── Türetilmiş yardımcılar (bileşende useMemo ile çağrılır) ────────────────────

/** Kullanıcı paylaşımını FeedGonderi biçimine çevirir. */
function paylasimToFeed(p: Paylasim): FeedGonderi {
  return {
    id: p.id,
    kullanici: p.kullanici,
    tur: p.tur,
    baslik: p.baslik,
    aciklama: p.aciklama,
    model: p.model,
    etiketler: p.etiketler,
    gorselUrl: p.gorselUrl,
    videoUrl: p.videoUrl,
    oran: p.oran,
    muzik: p.muzik,
    begeniTohum: 0,
    goruntulenmeTohum: 1,
    yorumTohum: 0,
    paylasimTohum: 0,
    izinYenidenOlustur: p.izinYenidenOlustur,
    kredi: p.kredi,
    olusturmaOfset: Math.max(1, Math.round((Date.now() - p.olusturma) / 3_600_000)),
    benimMi: true,
  };
}

/**
 * Birleşik feed: kullanıcı paylaşımları EN ÜSTTE + kurgusal tohumlar,
 * gizlenenler çıkarılır. Deterministik sıra (SSR güvenli, karıştırma yok).
 */
export function birlesikFeed(paylasimlar: Paylasim[], gizlenenler: string[]): FeedGonderi[] {
  const benimkiler = paylasimlar.map(paylasimToFeed);
  const tohumlar: FeedGonderi[] = AKIS_TOHUM.map((t) => ({ ...t }));
  return [...benimkiler, ...tohumlar].filter((g) => !gizlenenler.includes(g.id));
}

/** Bir gönderinin canlı beğeni sayısı (tohum + kullanıcı beğenisi). */
export function canliBegeni(g: FeedGonderi, begenili: boolean): number {
  return g.begeniTohum + (begenili ? 1 : 0);
}

/** Bir gönderinin canlı görüntülenmesi (tohum + kullanıcı görüntülemesi). */
export function canliGoruntulenme(g: FeedGonderi, ek: number): number {
  return g.goruntulenmeTohum + (ek ?? 0);
}

/** Bir gönderinin tüm yorumları: kullanıcı yorumları önce + kurgusal tohumlar. */
export function tumYorumlar(gonderiId: string, ekYorumlar: Record<string, AkisYorum[]>): AkisYorum[] {
  const benim = ekYorumlar[gonderiId] ?? [];
  // Kullanıcının kendi paylaşımlarında kurgusal yorum yok.
  const tohum = gonderiId.startsWith("akis_pay_") ? [] : tohumYorumlar(gonderiId);
  return [...benim, ...tohum];
}
