import { create } from "zustand";
import { persist } from "zustand/middleware";
import { alanlariKoru } from "@/store/gocHelper";

/**
 * Zamanlanmış görevler (ChatGPT "Tasks", Claude/Manus zamanlanmış işler).
 * Dürüst sınır: sunucu tarafı zamanlayıcı yok; görevler Vayra bir sekmede açıkken çalışır,
 * kaçırılan görev sekme açıldığında bir kez çalıştırılır.
 */
export type GorevSiklik = "bir" | "gunluk" | "haftaici" | "haftalik" | "aylik";
export type ScGorev = {
  id: string; baslik: string; istem: string; siklik: GorevSiklik;
  /** "SS:DD" */ saat: string;
  /** Haftalık: 0 (Pazar) – 6. */ gun?: number;
  /** Bir kez: "YYYY-AA-GG". Aylık: ayın günü bu tarihten alınır. */ tarih?: string;
  web: boolean; acik: boolean; olusturma: number;
  sonraki: number | null; sonCalisma?: number; sonSohbet?: string; calismaSayisi?: number;
};

export const SIKLIK_AD: Record<GorevSiklik, string> = { bir: "Bir kez", gunluk: "Her gün", haftaici: "Hafta içi her gün", haftalik: "Her hafta", aylik: "Her ay" };
export const GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

/** `sonra` anından sonraki ilk çalışma zamanı (yoksa null). */
export function sonrakiZaman(g: Pick<ScGorev, "siklik" | "saat" | "gun" | "tarih">, sonra = Date.now()): number | null {
  const [ss, dd] = g.saat.split(":").map(Number);
  if (g.siklik === "bir") {
    if (!g.tarih) return null;
    const [y, a, gn] = g.tarih.split("-").map(Number);
    const t = new Date(y, a - 1, gn, ss, dd).getTime();
    return t > sonra ? t : null;
  }
  const d = new Date(sonra); d.setSeconds(0, 0); d.setHours(ss, dd);
  if (g.siklik === "aylik") {
    const ayGunu = g.tarih ? Number(g.tarih.split("-")[2]) : new Date().getDate();
    for (let i = 0; i < 14; i++) {
      const c = new Date(d.getFullYear(), d.getMonth() + i, 1, ss, dd);
      const son = new Date(c.getFullYear(), c.getMonth() + 1, 0).getDate();
      c.setDate(Math.min(ayGunu, son));
      if (c.getTime() > sonra) return c.getTime();
    }
    return null;
  }
  for (let i = 0; i < 8; i++) {
    const c = new Date(d); c.setDate(d.getDate() + i);
    if (c.getTime() <= sonra) continue;
    const w = c.getDay();
    if (g.siklik === "gunluk" || (g.siklik === "haftaici" && w >= 1 && w <= 5) || (g.siklik === "haftalik" && w === (g.gun ?? 1))) return c.getTime();
  }
  return null;
}

export function zamanAd(t: number | null | undefined) {
  if (!t) return "—";
  const d = new Date(t), simdi = new Date();
  const yarin = new Date(simdi); yarin.setDate(simdi.getDate() + 1);
  const saat = d.toLocaleTimeString("tr", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === simdi.toDateString()) return `Bugün ${saat}`;
  if (d.toDateString() === yarin.toDateString()) return `Yarın ${saat}`;
  return `${d.toLocaleDateString("tr", { day: "numeric", month: "short", weekday: "short" })} ${saat}`;
}

type Durum = {
  gorevler: ScGorev[];
  ekle: (g: Omit<ScGorev, "id" | "olusturma" | "sonraki" | "acik">) => string;
  guncelle: (id: string, p: Partial<ScGorev>) => void;
  sil: (id: string) => void;
};

export const useScGorev = create<Durum>()(
  persist(
    (set) => ({
      gorevler: [],
      ekle: (g) => {
        const id = `gv-${Date.now().toString(36)}`;
        set((d) => ({ gorevler: [{ ...g, id, olusturma: Date.now(), acik: true, sonraki: sonrakiZaman(g) }, ...d.gorevler] }));
        return id;
      },
      guncelle: (id, p) => set((d) => ({ gorevler: d.gorevler.map((x) => { if (x.id !== id) return x; const y = { ...x, ...p }; if ("saat" in p || "siklik" in p || "gun" in p || "tarih" in p || (p.acik && !x.acik)) y.sonraki = sonrakiZaman(y); return y; }) })),
      sil: (id) => set((d) => ({ gorevler: d.gorevler.filter((x) => x.id !== id) })),
    }),
    { name: "vayra-sc-gorev", version: 1, migrate: alanlariKoru },
  ),
);
