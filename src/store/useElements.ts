"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ElementTur = "karakter" | "mekan" | "obje" | "stil";

export interface VElement {
  id: string;
  ad: string; // @mention adı (boşluksuz)
  tur: ElementTur;
  aciklama: string;
  tohum: string; // önizleme gradyanı (kapak)
  gorseller: string[]; // yüklenen medya (data URL veya ""); boşsa tohum kullanılır
  /** Görünen klasör ADI — yalnız etiket/gösterim içindir. Aynı ada sahip
      birden çok klasör olabileceği için EŞLEŞTİRMEDE KULLANILMAZ. */
  klasor?: string; // "Folders" — referans: Game of Thrones vb.
  /** Ait olduğu proje-içi klasörün ID'si (ProjeKlasor.id). Aynı isimli
      klasörleri ayırmanın tek güvenilir yolu (2026-08-01). */
  klasorId?: string;
  /** Klasörün ait olduğu projenin ID'si — proje kapsamı bununla süzülür. */
  projeId?: string;
  sabitli?: boolean; // Pin
  kullanim: number; // "Used in N generation"
  sonKullanim?: number; // last used (epoch)
  olusturma: number;
}

interface ElementsState {
  elementler: VElement[];
  ekle: (e: Partial<Omit<VElement, "id" | "olusturma">> & { ad: string; tur: ElementTur }) => string;
  guncelle: (id: string, patch: Partial<Omit<VElement, "id">>) => void;
  cogalt: (id: string) => string | null; // Duplicate & Edit
  kullanildi: (id: string) => void; // üretimde @ ile kullanılınca
  sil: (id: string) => void;
}

let sayac = 0;
function yeniId() {
  sayac += 1;
  return `el_${sayac}_${Math.floor(performance.now())}`;
}

const varsayilan: VElement[] = [
  { id: "el_seed_1", ad: "Zara", tur: "karakter", aciklama: "Ana karakter · kızıl saç, deri ceket", tohum: "el-zara", gorseller: [], klasor: "Ana Kadro", kullanim: 3, sonKullanim: 0, olusturma: 0 },
  { id: "el_seed_2", ad: "NeonSokak", tur: "mekan", aciklama: "Yağmurlu neon şehir sokağı", tohum: "el-neon", gorseller: [], kullanim: 1, sonKullanim: 0, olusturma: 0 },
  { id: "el_seed_3", ad: "AltinSaat", tur: "obje", aciklama: "Antika altın cep saati", tohum: "el-saat", gorseller: [], kullanim: 0, olusturma: 0 },
  { id: "el_seed_4", ad: "SicakGrade", tur: "stil", aciklama: "Sıcak tonlu sinematik renk grade", tohum: "el-grade", gorseller: [], kullanim: 5, sonKullanim: 0, olusturma: 0 },
];

export const useElements = create<ElementsState>()(
  persist(
    (set, get) => ({
      elementler: varsayilan,
      ekle: (e) => {
        const id = yeniId();
        const yeni: VElement = {
          id,
          ad: e.ad,
          tur: e.tur,
          aciklama: e.aciklama ?? "",
          tohum: e.tohum ?? "el-" + e.ad.toLowerCase(),
          gorseller: e.gorseller ?? [],
          klasor: e.klasor,
          klasorId: e.klasorId,
          projeId: e.projeId,
          sabitli: e.sabitli,
          kullanim: e.kullanim ?? 0,
          sonKullanim: e.sonKullanim,
          olusturma: Date.now(),
        };
        set((s) => ({ elementler: [yeni, ...s.elementler] }));
        return id;
      },
      guncelle: (id, patch) =>
        set((s) => ({ elementler: s.elementler.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      cogalt: (id) => {
        const el = get().elementler.find((x) => x.id === id);
        if (!el) return null;
        const yid = yeniId();
        const kopya: VElement = { ...el, id: yid, ad: el.ad + "Kopya", kullanim: 0, sonKullanim: undefined, sabitli: false, olusturma: Date.now() };
        set((s) => ({ elementler: [kopya, ...s.elementler] }));
        return yid;
      },
      kullanildi: (id) =>
        set((s) => ({ elementler: s.elementler.map((x) => (x.id === id ? { ...x, kullanim: x.kullanim + 1, sonKullanim: Date.now() } : x)) })),
      sil: (id) => set((s) => ({ elementler: s.elementler.filter((x) => x.id !== id) })),
    }),
    {
      name: "vayra-elements",
      version: 2,
      migrate: (persisted: unknown, ver: number) => {
        // v1 → v2: yeni alanları doldur
        const p = persisted as { elementler?: Partial<VElement>[] } | undefined;
        if (p?.elementler && ver < 2) {
          p.elementler = p.elementler.map((e) => ({
            gorseller: [], kullanim: 0, ...e,
          }));
        }
        return p as ElementsState;
      },
    },
  ),
);

/* ═══════════ paylaşılan meta (stüdyo + composer popup ortak) ═══════════ */

export const ELEMENT_TUR_LISTE: ElementTur[] = ["karakter", "mekan", "obje", "stil"];

export function goreliZamanKisa(t?: number): string {
  if (!t) return "hiç";
  const fark = Date.now() - t;
  const gun = Math.floor(fark / 86_400_000);
  if (gun <= 0) return "bugün";
  if (gun === 1) return "1 gün önce";
  if (gun < 7) return `${gun} gün önce`;
  const hafta = Math.floor(gun / 7);
  if (hafta === 1) return "1 hafta önce";
  if (hafta < 5) return `${hafta} hafta önce`;
  return `${Math.floor(gun / 30)} ay önce`;
}
