"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Preset stüdyosundaki yapılandırılmış tarif — modele giden metin bundan derlenir. */
export interface TarifYapisi {
  /** Özneye ne olduğu (kullanıcının kendi cümlesi). */
  eylem: string;
  kamera: string;
  atmosfer: string[];
  tempo: string;
  /** Kimliği koru cümlesi eklensin mi. */
  kimlik: boolean;
  /** Doluysa derlenmiş tarifin yerine geçer (gelişmiş). */
  elle?: string;
}

/** Kullanıcının kendi oluşturduğu preset — resmi presetlerle aynı akışta kullanılır. */
export interface OzelPreset {
  slug: string;
  ad: string;
  aciklama: string;
  /** Modele giden hareket tarifi (istem). */
  tarif: string;
  kategori: string;
  /** 512 px kapak (data URL, WebP) ya da test sonucunun görseli — yoksa vurgu renkli düz kapak. */
  kapak?: string;
  /** Kapak bir test videosundan seçildiyse video adresi. */
  kapakVideo?: string;
  olusturma: number;
  guncelleme?: number;
  /** Eski kayıtlarda yok → yayında sayılır. */
  durum?: "taslak" | "yayinda";
  yapi?: TarifYapisi;
  /** Bu presetin test üretimlerinin kimlikleri (kitaplıktaki üretimler). */
  testler?: string[];
  /** Çoğaltıldığı resmi preset. */
  kaynak?: string;
  /** Kim görebilir: toplulukta herkes, bağlantısı olan ya da yalnız sen. Eski kayıtlar toplulukta sayılır. */
  gorunurluk?: "topluluk" | "baglanti" | "ozel";
  /** Yaratıcı payı: her kullanımda ek kredi, tamamı sana (0 = ücretsiz). */
  ekKredi?: number;
  /** İstem başkalarına görünsün mü. */
  istemGorunur?: boolean;
  /** Toplulukta biriken sayılar (sunucu bağlanınca gerçek). */
  kullanim?: number;
  begeni?: number;
  kazanc?: number;
}

interface Durum {
  /** Kayıtlı (yer imli) preset slug'ları — en son eklenen başta. */
  kayitli: string[];
  /** Beğenilen preset slug'ları. */
  begenilen: string[];
  /** Takip edilen yaratıcılar (@ad). */
  takip: string[];
  /** Bildirilen presetler (akıştan gizlenir). */
  bildirilen: string[];
  begeniDegis: (slug: string) => boolean;
  takipDegis: (kullanici: string) => boolean;
  bildir: (slug: string) => void;
  bildirGeriAl: (slug: string) => void;
  ozel: OzelPreset[];
  kayitDegis: (slug: string) => boolean;
  ozelEkle: (p: Omit<OzelPreset, "slug" | "olusturma">) => OzelPreset;
  ozelGuncelle: (slug: string, p: Partial<Omit<OzelPreset, "slug">>) => void;
  ozelSil: (slug: string) => void;
  testEkle: (slug: string, uretimId: string) => void;
}

const slugla = (s: string) =>
  s.toLocaleLowerCase("tr-TR").replace(/[çğıöşü]/g, (c) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" })[c]!).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "preset";

export const yayindaMi = (p: OzelPreset) => p.durum !== "taslak";

export const usePresetler = create<Durum>()(
  persist(
    (set, get) => ({
      kayitli: [],
      begenilen: [],
      takip: [],
      bildirilen: [],
      begeniDegis: (slug) => {
        const var_ = get().begenilen.includes(slug);
        set((s) => ({ begenilen: var_ ? s.begenilen.filter((x) => x !== slug) : [slug, ...s.begenilen] }));
        return !var_;
      },
      takipDegis: (k) => {
        const var_ = get().takip.includes(k);
        set((s) => ({ takip: var_ ? s.takip.filter((x) => x !== k) : [k, ...s.takip] }));
        return !var_;
      },
      bildir: (slug) => set((s) => ({ bildirilen: s.bildirilen.includes(slug) ? s.bildirilen : [...s.bildirilen, slug] })),
      bildirGeriAl: (slug) => set((s) => ({ bildirilen: s.bildirilen.filter((x) => x !== slug) })),
      ozel: [],
      kayitDegis: (slug) => {
        const var_ = get().kayitli.includes(slug);
        set((s) => ({ kayitli: var_ ? s.kayitli.filter((x) => x !== slug) : [slug, ...s.kayitli] }));
        return !var_;
      },
      ozelEkle: (p) => {
        const taban = `ozel-${slugla(p.ad || "taslak")}`;
        let slug = taban, i = 2;
        while (get().ozel.some((x) => x.slug === slug)) slug = `${taban}-${i++}`;
        const yeni: OzelPreset = { ...p, slug, olusturma: Date.now(), guncelleme: Date.now() };
        set((s) => ({ ozel: [yeni, ...s.ozel] }));
        return yeni;
      },
      ozelGuncelle: (slug, p) => set((s) => ({ ozel: s.ozel.map((x) => (x.slug === slug ? { ...x, ...p, guncelleme: Date.now() } : x)) })),
      ozelSil: (slug) => set((s) => ({ ozel: s.ozel.filter((x) => x.slug !== slug), kayitli: s.kayitli.filter((x) => x !== slug) })),
      testEkle: (slug, uretimId) => set((s) => ({ ozel: s.ozel.map((x) => (x.slug === slug ? { ...x, testler: [uretimId, ...(x.testler ?? [])] } : x)) })),
    }),
    { name: "vayra-presetler", version: 2, migrate: (d) => ({ begenilen: [], takip: [], bildirilen: [], ...(d as object) }) as unknown as Durum },
  ),
);
