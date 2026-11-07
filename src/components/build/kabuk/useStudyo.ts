"use client";

import { create } from "zustand";
import { api } from "@/lib/build/istemci";
import type { ProjeOzet, ProjeTur } from "@/lib/build/tipler";

/** Kenar çubuğundaki "Son çalışmalar": sohbetler ve projeler, son dokunulan önde. */
export type SonOge = { id: string; tur: "proje" | "sohbet"; ad: string; href: string; zaman: number; projeTur?: ProjeTur; calisiyor?: boolean; yayinda?: boolean };
type SohbetOzet = { id: string; baslik: string; guncelleme: number; calisiyor?: boolean };

type Durum = { son: SonOge[]; projeler: ProjeOzet[] | null; yukleniyor: boolean; yukle: () => Promise<void> };

let sonYukleme = 0;
export const useStudyo = create<Durum>((set) => ({
  son: [], projeler: null, yukleniyor: false,
  yukle: async () => {
    // Sayfa geçişlerinde art arda istek atmasın (1,5 sn içinde tek yükleme).
    if (Date.now() - sonYukleme < 1500) return;
    sonYukleme = Date.now();
    set({ yukleniyor: true });
    const [p, s] = await Promise.all([
      api<{ projeler: ProjeOzet[] }>("/api/build/proje").then((v) => v.projeler).catch(() => [] as ProjeOzet[]),
      api<{ sohbetler: SohbetOzet[] }>("/api/build/sohbet").then((v) => v.sohbetler).catch(() => [] as SohbetOzet[]),
    ]);
    const son: SonOge[] = [
      ...p.map((x) => ({ id: `p-${x.id}`, tur: "proje" as const, ad: x.ad, href: `/panel/build/${x.id}`, zaman: x.guncelleme, projeTur: x.tur, yayinda: !!x.yayin })),
      ...s.map((x) => ({ id: `s-${x.id}`, tur: "sohbet" as const, ad: x.baslik, href: `/panel/build/sohbet/${x.id}`, zaman: x.guncelleme, calisiyor: x.calisiyor })),
    ].sort((a, b) => b.zaman - a.zaman);
    set({ son, projeler: p, yukleniyor: false });
  },
}));

/** Zorla yeniden yükle (yeni proje/sohbet sonrası). */
export const studyoYenile = () => { sonYukleme = 0; return useStudyo.getState().yukle(); };
