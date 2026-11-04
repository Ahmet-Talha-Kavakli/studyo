"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { adHatasi, bostakiAd, type ElementTur } from "@/lib/elementCekirdek";

export type { ElementTur };

/**
 * Element: bir kez tanımlanıp her üretimde @Ad ile çağrılan karakter, mekân, obje ya da stil.
 * Görseller sunucu deposunda durur (`/api/dosya/element/…`); tarayıcıya yalnız adres yazılır.
 * Eski kayıtlarda data URL kalmış olabilir — gösterim ikisini de destekler.
 */
export interface VElement {
  id: string;
  /** @mention adı — tekil (büyük/küçük harf duyarsız), boşluksuz. */
  ad: string;
  tur: ElementTur;
  /** Modele giden tarif: üretimde @Ad bu metinle açıklanır. */
  aciklama: string;
  /** Kapak için geri dönüş tohumu (görsel yoksa tür ikonu gösterilir). */
  tohum: string;
  /** Referans görseller (ilki kapak). Karakterde farklı açılar tutarlılığı artırır. */
  gorseller: string[];
  /** Görünen klasör adı — yalnız etiket. */
  klasor?: string;
  klasorId?: string;
  projeId?: string;
  sabitli?: boolean;
  /** Hazır örnekten oluşturuldu (kullanıcının kendi fotoğrafı değil). */
  ornek?: boolean;
  /** Derin eğitim (fal LoRA). Durum gerçek kuyruk durumudur; yüzde yoktur. */
  lora?: { durum: "sirada" | "egitiliyor" | "hazir" | "hata"; tetik: string; kredi: number; baslangic: number; jeton?: string; url?: string; bitis?: number; hata?: string; log?: string; sira?: number; ekGorseller?: string[] };
  /** Gerçek üretimde kullanım sayısı (istemde @Ad ile üretim başlatıldığında artar). */
  kullanim: number;
  sonKullanim?: number;
  olusturma: number;
  guncelleme?: number;
}

type Yeni = Partial<Omit<VElement, "id" | "olusturma" | "kullanim">> & { ad: string; tur: ElementTur };

interface ElementsState {
  elementler: VElement[];
  /** Ad geçersiz ya da kullanımdaysa `{ hata }` döner; kayıt yapılmaz. */
  ekle: (e: Yeni) => { id?: string; hata?: string };
  guncelle: (id: string, patch: Partial<Omit<VElement, "id" | "olusturma">>) => { hata?: string };
  /** Kopya oluşturur (ad: Zara → Zara2), yeni id'yi döner. */
  cogalt: (id: string) => string | null;
  /** Üretim başlatıldığında istemdeki elementler için çağrılır. */
  kullanildi: (idler: string[]) => void;
  sil: (id: string) => void;
  /** Silinen elementi geri alır (aynı id ve adla). */
  geriYukle: (e: VElement) => void;
}

const yeniId = () => `el_${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`}`;
const adlar = (l: VElement[], haric?: string) => l.filter((x) => x.id !== haric).map((x) => x.ad);

export const useElements = create<ElementsState>()(
  persist(
    (set, get) => ({
      elementler: [],
      ekle: (e) => {
        const hata = adHatasi(e.ad, adlar(get().elementler));
        if (hata) return { hata };
        const id = yeniId();
        const yeni: VElement = {
          id, ad: e.ad, tur: e.tur, aciklama: (e.aciklama ?? "").trim(), tohum: e.tohum ?? `el-${e.ad.toLocaleLowerCase("tr")}`,
          gorseller: (e.gorseller ?? []).filter(Boolean), klasor: e.klasor, klasorId: e.klasorId, projeId: e.projeId,
          sabitli: e.sabitli, ...(e.ornek ? { ornek: true } : {}), kullanim: 0, olusturma: Date.now(),
        };
        set((s) => ({ elementler: [yeni, ...s.elementler] }));
        return { id };
      },
      guncelle: (id, patch) => {
        if (patch.ad !== undefined) {
          const hata = adHatasi(patch.ad, adlar(get().elementler, id));
          if (hata) return { hata };
        }
        set((s) => ({ elementler: s.elementler.map((x) => (x.id === id ? { ...x, ...patch, guncelleme: Date.now() } : x)) }));
        return {};
      },
      cogalt: (id) => {
        const el = get().elementler.find((x) => x.id === id);
        if (!el) return null;
        const yid = yeniId();
        const kopya: VElement = { ...el, id: yid, ad: bostakiAd(el.ad, adlar(get().elementler)), kullanim: 0, sonKullanim: undefined, sabitli: false, olusturma: Date.now(), guncelleme: undefined };
        set((s) => ({ elementler: [kopya, ...s.elementler] }));
        return yid;
      },
      kullanildi: (idler) => {
        if (!idler.length) return;
        const k = new Set(idler); const t = Date.now();
        set((s) => ({ elementler: s.elementler.map((x) => (k.has(x.id) ? { ...x, kullanim: x.kullanim + 1, sonKullanim: t } : x)) }));
      },
      sil: (id) => set((s) => ({ elementler: s.elementler.filter((x) => x.id !== id) })),
      geriYukle: (e) => set((s) => (s.elementler.some((x) => x.id === e.id || x.ad.toLocaleLowerCase("tr") === e.ad.toLocaleLowerCase("tr")) ? s : { elementler: [e, ...s.elementler] })),
    }),
    {
      name: "vayra-elements",
      version: 3,
      migrate: (persisted: unknown, ver: number) => {
        const p = persisted as { elementler?: Partial<VElement>[] } | undefined;
        if (!p?.elementler) return { elementler: [] } as unknown as ElementsState;
        let l = p.elementler.map((e) => ({ gorseller: [], kullanim: 0, ...e })) as VElement[];
        if (ver < 3) {
          // v3: uygulamanın eklediği örnek elementler (görselsiz, sahte kullanım sayılı) kaldırılır;
          // kullanıcının kendi elementleri korunur. Aynı adlı kopyalar tekilleştirilir.
          l = l.filter((e) => !(e.id?.startsWith("el_seed_") && !e.gorseller.length));
          const goruldu = new Set<string>();
          l = l.map((e) => {
            let ad = e.ad;
            if (goruldu.has(ad.toLocaleLowerCase("tr"))) ad = bostakiAd(ad, [...goruldu]);
            goruldu.add(ad.toLocaleLowerCase("tr"));
            return { ...e, ad };
          });
        }
        return { elementler: l } as unknown as ElementsState;
      },
    },
  ),
);

export const ELEMENT_TUR_LISTE: ElementTur[] = ["karakter", "mekan", "obje", "stil"];

export function goreliZamanKisa(t?: number): string {
  if (!t) return "henüz yok";
  const fark = Date.now() - t;
  const dk = Math.floor(fark / 60_000);
  if (dk < 1) return "az önce";
  if (dk < 60) return `${dk} dk önce`;
  const sa = Math.floor(dk / 60);
  if (sa < 24) return `${sa} sa önce`;
  const gun = Math.floor(sa / 24);
  if (gun === 1) return "dün";
  if (gun < 7) return `${gun} gün önce`;
  const hafta = Math.floor(gun / 7);
  if (hafta < 5) return `${hafta} hafta önce`;
  return `${Math.floor(gun / 30)} ay önce`;
}
