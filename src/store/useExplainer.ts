"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * useExplainer — Explainer Stüdyosu durumu.
 *
 * Akış: brief (konu + kaynak + ayarlar) → senaryo (sahneler) → görsel/ses → önizleme → dışa aktarma.
 * Sahneler montaj motoruna derlenir (explainerMotor.explainerMontaj); önizleme ve MP4 aynı çizimden çıkar.
 */

export type SahneTur = "baslik" | "anlatim" | "liste" | "istatistik" | "alinti" | "cta";
export type ExTon = "samimi" | "profesyonel" | "egitici" | "enerjik" | "ilham";
export type ExKitle = "genel" | "baslangic" | "uzman" | "cocuk" | "yonetici";
export type ExMuzik = "yok" | "sakin" | "kurumsal" | "enerjik" | "duygusal";
export type ExAltyazi = "yok" | "karaoke" | "tiktok" | "altyazi";

export interface ExSahne {
  id: string;
  tur: SahneTur;
  baslik: string;            // ekrandaki ana yazı
  anlatim: string;           // seslendirme metni (altyazı da buradan)
  maddeler?: string[];       // liste sahnesi
  deger?: string;            // istatistik: "%73", "2,4 milyon"
  etiket?: string;           // istatistik açıklaması / CTA alt yazısı
  gorselIstem: string;       // sahne görseli için istem
  gorselUrl?: string;
  videoUrl?: string;
  gorselKaynak?: "ai" | "stil" | "yukleme" | "uretim";
  gorselDurum?: "bos" | "uretiliyor" | "hazir" | "hata";
  sure?: number;             // elle ayarlanan süre (yoksa anlatımdan hesaplanır)
  sesUrl?: string;           // sahnenin seslendirmesi
  sesSure?: number;
  sesMetni?: string;         // seslendirildiği andaki metin (değişince yeniden seslendirme gerekir)
}

export interface ExAyar {
  stil: string;              // stil preset kimliği (tohum)
  oran: "16:9" | "9:16" | "1:1";
  hedefSn: number;
  ton: ExTon;
  kitle: ExKitle;
  dil: "tr" | "en";
  ses: string;
  sesId?: string;
  altyazi: ExAltyazi;
  muzik: ExMuzik;
  muzikUrl?: string;         // sentezlenen/üretilen müzik (ruh hali değişince yenilenir)
  muzikAnahtar?: string;
  ilerleme: boolean;         // alt ilerleme çubuğu
  marka: boolean;            // montaj marka setini (renk/font/logo) uygula
  sfx: boolean;              // sahne geçişlerinde "whoosh" sesi
}

export interface ExProje {
  id: string;
  ad: string;
  konu: string;
  kaynakMetin?: string;      // yapıştırılan metin / bağlantıdan çekilen metin
  kaynakUrl?: string;
  ayar: ExAyar;
  sahneler: ExSahne[];
  senaryoKaynak?: "ai" | "taslak" | "metin";
  olusturma: number;
  guncelleme: number;
  montajId?: string;         // Montaj Stüdyosu'nda açıldıysa
  /** Senaryo yazıldı, kullanıcı onayı bekleniyor (onay ekranı gösterilir). */
  onayBekliyor?: boolean;
}

export const varsayilanAyar = (): ExAyar => ({
  stil: "ex-2dillustrator", oran: "16:9", hedefSn: 60, ton: "samimi", kitle: "genel", dil: "tr",
  ses: "George", sesId: "JBFqnCBsd6RMkjVDRZzb", altyazi: "karaoke", muzik: "kurumsal", ilerleme: true, marka: false, sfx: true,
});

let sayac = 0;
export const exId = (p: string) => { sayac += 1; return `${p}_${Date.now().toString(36)}${sayac}${Math.floor(Math.random() * 1e4)}`; };

interface ExplainerState {
  projeler: ExProje[];
  aktifId: string | null;
  seciliSahne: string | null;
  gecmis: Record<string, ExSahne[][]>;   // sahne listesi için geri al (oturumluk)
  /** Telaffuz sözlüğü (kalıcı): seslendirmede yazım → okunuş. */
  sozluk: { yazim: string; okunus: string }[];
  sozlukAyarla: (l: { yazim: string; okunus: string }[]) => void;

  olustur: (patch?: Partial<ExProje>) => string;
  sec: (id: string | null) => void;
  guncelle: (id: string, patch: Partial<ExProje>) => void;
  ayarGuncelle: (id: string, patch: Partial<ExAyar>) => void;
  sil: (id: string) => void;
  cogalt: (id: string) => string | null;

  sahneleriAyarla: (id: string, sahneler: ExSahne[], kaynak?: ExProje["senaryoKaynak"]) => void;
  sahneGuncelle: (id: string, sahneId: string, patch: Partial<ExSahne>) => void;
  sahneEkle: (id: string, sonra: string | null, sahne?: Partial<ExSahne>) => string;
  sahneSil: (id: string, sahneId: string) => void;
  sahneTasi: (id: string, sahneId: string, yon: -1 | 1) => void;
  sahneSec: (sahneId: string | null) => void;
  geriAl: (id: string) => void;
}

export const useExplainer = create<ExplainerState>()(
  persist(
    (set, get) => {
      const kaydet = (id: string) => {
        const p = get().projeler.find((x) => x.id === id); if (!p) return;
        const g = get().gecmis[id] ?? [];
        set({ gecmis: { ...get().gecmis, [id]: [...g.slice(-29), p.sahneler] } });
      };
      const yaz = (id: string, fn: (s: ExSahne[]) => ExSahne[], gecmise = true) => {
        if (gecmise) kaydet(id);
        set((s) => ({ projeler: s.projeler.map((p) => (p.id === id ? { ...p, sahneler: fn(p.sahneler), guncelleme: Date.now() } : p)) }));
      };
      return {
        projeler: [],
        aktifId: null,
        seciliSahne: null,
        gecmis: {},
        sozluk: [{ yazim: "AI", okunus: "ey ay" }, { yazim: "Vayra", okunus: "Vayra" }],
        sozlukAyarla: (l) => set({ sozluk: l }),

        olustur: (patch) => {
          const id = exId("ex");
          const p: ExProje = { id, ad: patch?.ad ?? "Adsız explainer", konu: patch?.konu ?? "", kaynakMetin: patch?.kaynakMetin, kaynakUrl: patch?.kaynakUrl, ayar: { ...varsayilanAyar(), ...patch?.ayar }, sahneler: patch?.sahneler ?? [], senaryoKaynak: patch?.senaryoKaynak, olusturma: Date.now(), guncelleme: Date.now() };
          set((s) => ({ projeler: [p, ...s.projeler], aktifId: id, seciliSahne: null }));
          return id;
        },
        sec: (id) => set({ aktifId: id, seciliSahne: null }),
        guncelle: (id, patch) => set((s) => ({ projeler: s.projeler.map((p) => (p.id === id ? { ...p, ...patch, guncelleme: Date.now() } : p)) })),
        ayarGuncelle: (id, patch) => set((s) => ({ projeler: s.projeler.map((p) => (p.id === id ? { ...p, ayar: { ...p.ayar, ...patch }, guncelleme: Date.now() } : p)) })),
        sil: (id) => set((s) => ({ projeler: s.projeler.filter((p) => p.id !== id), aktifId: s.aktifId === id ? null : s.aktifId })),
        cogalt: (id) => {
          const p = get().projeler.find((x) => x.id === id); if (!p) return null;
          const yeni: ExProje = { ...JSON.parse(JSON.stringify(p)), id: exId("ex"), ad: `${p.ad} (kopya)`, montajId: undefined, olusturma: Date.now(), guncelleme: Date.now() };
          set((s) => ({ projeler: [yeni, ...s.projeler] }));
          return yeni.id;
        },

        sahneleriAyarla: (id, sahneler, kaynak) => {
          kaydet(id);
          set((s) => ({ projeler: s.projeler.map((p) => (p.id === id ? { ...p, sahneler, ...(kaynak ? { senaryoKaynak: kaynak } : {}), guncelleme: Date.now() } : p)), seciliSahne: sahneler[0]?.id ?? null }));
        },
        sahneGuncelle: (id, sahneId, patch) => yaz(id, (l) => l.map((x) => (x.id === sahneId ? { ...x, ...patch } : x)), false),
        sahneEkle: (id, sonra, sahne) => {
          const yeni: ExSahne = { tur: "anlatim", baslik: "Yeni sahne", anlatim: "", gorselIstem: "", ...sahne, id: exId("sh") };
          yaz(id, (l) => { const i = sonra ? l.findIndex((x) => x.id === sonra) : l.length - 1; const c = [...l]; c.splice(i + 1, 0, yeni); return c; });
          set({ seciliSahne: yeni.id });
          return yeni.id;
        },
        sahneSil: (id, sahneId) => yaz(id, (l) => l.filter((x) => x.id !== sahneId)),
        sahneTasi: (id, sahneId, yon) => yaz(id, (l) => {
          const i = l.findIndex((x) => x.id === sahneId), j = i + yon;
          if (i < 0 || j < 0 || j >= l.length) return l;
          const c = [...l]; [c[i], c[j]] = [c[j], c[i]]; return c;
        }),
        sahneSec: (sahneId) => set({ seciliSahne: sahneId }),
        geriAl: (id) => {
          const g = get().gecmis[id]; if (!g?.length) return;
          const onceki = g[g.length - 1];
          set((s) => ({ gecmis: { ...s.gecmis, [id]: g.slice(0, -1) }, projeler: s.projeler.map((p) => (p.id === id ? { ...p, sahneler: onceki, guncelleme: Date.now() } : p)) }));
        },
      };
    },
    {
      name: "vayra-explainer",
      version: 1,
      partialize: (s) => ({ projeler: s.projeler, aktifId: s.aktifId, sozluk: s.sozluk }) as unknown as ExplainerState,
    },
  ),
);
