import { create } from "zustand";
import { persist } from "zustand/middleware";
import { alanlariKoru } from "@/store/gocHelper";

/**
 * Özel yanıt stilleri (Claude "Create & edit styles"): kullanıcı bir yazı örneği verir ya da stili tarif eder;
 * stil talimatı her yanıtın sistem istemine eklenir. Composer'daki Yanıt stili menüsünde hazır stillerin altında görünür.
 */
export type ScOzelStil = { id: string; ad: string; talimat: string; olusturma: number };

type Durum = {
  ozel: ScOzelStil[];
  ekle: (s: Omit<ScOzelStil, "id" | "olusturma">) => string;
  guncelle: (id: string, p: Partial<Omit<ScOzelStil, "id">>) => void;
  sil: (id: string) => void;
};

export const useScStil = create<Durum>()(
  persist(
    (set) => ({
      ozel: [],
      ekle: (s) => { const id = `st-${Date.now().toString(36)}`; set((d) => ({ ozel: [{ ...s, id, olusturma: Date.now() }, ...d.ozel].slice(0, 30) })); return id; },
      guncelle: (id, p) => set((d) => ({ ozel: d.ozel.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      sil: (id) => set((d) => ({ ozel: d.ozel.filter((x) => x.id !== id) })),
    }),
    { name: "vayra-sc-stil", version: 1, migrate: alanlariKoru },
  ),
);

export const ozelStilBul = (id?: string) => (id ? useScStil.getState().ozel.find((s) => s.id === id) : undefined);

/** Yazı örneğinden stil talimatı (model varsa model çıkarır; yoksa örnekten ölçülen gerçek özelliklerle). */
export async function stilCikar(ornek: string): Promise<{ ad: string; talimat: string; demo?: boolean } | null> {
  try {
    const r = await fetch("/api/sc/stil", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ornek: ornek.slice(0, 20000) }) });
    if (!r.ok) return null;
    return (await r.json()) as { ad: string; talimat: string; demo?: boolean };
  } catch { return null; }
}
