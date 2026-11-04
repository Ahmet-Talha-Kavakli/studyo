"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fId, type FilmBolum, type FilmCekim, type FilmTur } from "@/lib/filmMotor";

/**
 * useFilm — Uzun Video Stüdyosu (proje → bölüm → çekim). Kalıcı.
 * Üretimler (take) useProjeler'de durur; burada yalnız kimlikleri tutulur.
 */

export interface FilmProje {
  id: string;
  ad: string;
  logline: string;
  tur: FilmTur;
  hedefDk: number;
  oran: "16:9" | "9:16" | "1:1";
  stil: string;          // stil kimliği (FILM_STILLER)
  model: string;         // varsayılan video modeli
  kareModel: string;     // taslak kare modeli
  muzik: "yok" | "sakin" | "kurumsal" | "enerjik" | "duygusal";
  bolumler: FilmBolum[];
  plan: "ai" | "sablon";
  olusturma: number;
  guncelleme: number;
}

interface FilmState {
  projeler: FilmProje[];
  aktifId: string | null;
  secili: { bolum: string | null; cekim: string | null };
  gecmis: Record<string, FilmBolum[][]>;

  olustur: (p: Omit<FilmProje, "id" | "olusturma" | "guncelleme">) => string;
  sec: (id: string | null) => void;
  guncelle: (id: string, p: Partial<FilmProje>) => void;
  sil: (id: string) => void;
  cogalt: (id: string) => void;
  secim: (bolum: string | null, cekim?: string | null) => void;

  bolumYaz: (id: string, fn: (l: FilmBolum[]) => FilmBolum[], gecmise?: boolean) => void;
  bolumGuncelle: (id: string, bolumId: string, p: Partial<FilmBolum>) => void;
  cekimGuncelle: (id: string, cekimId: string, p: Partial<FilmCekim>) => void;
  geriAl: (id: string) => void;
}

export const useFilm = create<FilmState>()(
  persist(
    (set, get) => {
      const kaydet = (id: string) => {
        const p = get().projeler.find((x) => x.id === id); if (!p) return;
        set((s) => ({ gecmis: { ...s.gecmis, [id]: [...(s.gecmis[id] ?? []).slice(-29), p.bolumler] } }));
      };
      const yaz = (id: string, fn: (p: FilmProje) => FilmProje) => set((s) => ({ projeler: s.projeler.map((p) => (p.id === id ? { ...fn(p), guncelleme: Date.now() } : p)) }));
      return {
        projeler: [],
        aktifId: null,
        secili: { bolum: null, cekim: null },
        gecmis: {},
        olustur: (p) => {
          const id = fId("film");
          set((s) => ({ projeler: [{ ...p, id, olusturma: Date.now(), guncelleme: Date.now() }, ...s.projeler], aktifId: id, secili: { bolum: p.bolumler[0]?.id ?? null, cekim: p.bolumler[0]?.cekimler[0]?.id ?? null } }));
          return id;
        },
        sec: (id) => set((s) => { const p = s.projeler.find((x) => x.id === id); return { aktifId: id, secili: { bolum: p?.bolumler[0]?.id ?? null, cekim: p?.bolumler[0]?.cekimler[0]?.id ?? null } }; }),
        guncelle: (id, patch) => yaz(id, (p) => ({ ...p, ...patch })),
        sil: (id) => set((s) => ({ projeler: s.projeler.filter((p) => p.id !== id), aktifId: s.aktifId === id ? null : s.aktifId })),
        cogalt: (id) => {
          const p = get().projeler.find((x) => x.id === id); if (!p) return;
          const k: FilmProje = JSON.parse(JSON.stringify(p));
          k.id = fId("film"); k.ad = `${p.ad} (kopya)`; k.olusturma = k.guncelleme = Date.now();
          set((s) => ({ projeler: [k, ...s.projeler] }));
        },
        secim: (bolum, cekim = null) => set({ secili: { bolum, cekim } }),
        bolumYaz: (id, fn, gecmise = true) => { if (gecmise) kaydet(id); yaz(id, (p) => ({ ...p, bolumler: fn(p.bolumler) })); },
        bolumGuncelle: (id, bolumId, patch) => yaz(id, (p) => ({ ...p, bolumler: p.bolumler.map((b) => (b.id === bolumId ? { ...b, ...patch } : b)) })),
        cekimGuncelle: (id, cekimId, patch) => yaz(id, (p) => ({ ...p, bolumler: p.bolumler.map((b) => ({ ...b, cekimler: b.cekimler.map((c) => (c.id === cekimId ? { ...c, ...patch } : c)) })) })),
        geriAl: (id) => {
          const g = get().gecmis[id]; if (!g?.length) return;
          set((s) => ({ gecmis: { ...s.gecmis, [id]: g.slice(0, -1) }, projeler: s.projeler.map((p) => (p.id === id ? { ...p, bolumler: g[g.length - 1], guncelleme: Date.now() } : p)) }));
        },
      };
    },
    { name: "vayra-film", version: 1, partialize: (s) => ({ projeler: s.projeler, aktifId: s.aktifId }) as unknown as FilmState },
  ),
);
