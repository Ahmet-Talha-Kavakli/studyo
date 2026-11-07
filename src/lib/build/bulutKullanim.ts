import "server-only";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";

/**
 * Proje başına aylık kullanım sayaçları (Türkiye saatine göre takvim ayı): istek, bant genişliği, fonksiyon çağrısı,
 * yapay zekâ isteği, güvenlik duvarının engellediği istek. Günlükler 14 gün tutulduğu için ay toplamı burada ayrıca
 * birikir. Yazımlar bellekte toplanır, 5 saniyede bir diske işlenir. Dosya: .veri/build/bulut-kullanim/<id>.json
 */
export type AySayac = { istek: number; bant: number; fonksiyon: number; ai: number; engel: number; /** Görsel dönüşümü (önbellekte olmayan, yeni üretilen). */ gorsel: number; /** Fonksiyonların toplam çalışma süresi (ms). */ fonksiyonMs: number };
/** aylar: takvim ayı toplamları (13 ay); gunler: gün toplamları (62 gün; grafik ve ay sonu tahmini için). */
type Kayit = { aylar: Record<string, AySayac>; gunler?: Record<string, AySayac> };
const BOS: AySayac = { istek: 0, bant: 0, fonksiyon: 0, ai: 0, engel: 0, gorsel: 0, fonksiyonMs: 0 };
export const gunAnahtari = (t = Date.now()) => new Date(t + 3 * 3600_000).toISOString().slice(0, 10);
const KIMLIK = /^[A-Za-z0-9_-]{6,20}$/;
const dosya = (id: string) => path.join(DEPO_KOK, "build", "bulut-kullanim", `${id}.json`);
export const ayAnahtari = (t = Date.now()) => new Date(t + 3 * 3600_000).toISOString().slice(0, 7);

// Bekleyen sayaçlar globalThis üzerinde: geliştirmede modül yeniden yüklense de kaybolmaz.
type Durum = { bekleyen: Map<string, Record<string, AySayac>>; z: ReturnType<typeof setTimeout> | null };
const G = globalThis as unknown as { __vayraKullanim?: Durum };
const durum: Durum = (G.__vayraKullanim ??= { bekleyen: new Map(), z: null });
const bekleyen = durum.bekleyen;

async function oku(id: string): Promise<Kayit> {
  try { return JSON.parse(await readFile(dosya(id), "utf8")); } catch { return { aylar: {} }; }
}

async function isle() {
  durum.z = null;
  const l = [...bekleyen.entries()];
  bekleyen.clear();
  for (const [id, aylar] of l) {
    try {
      const v = await oku(id);
      for (const [ay, s] of Object.entries(aylar)) {
        const gun = ay.startsWith("g:");
        const hedef = gun ? (v.gunler ??= {}) : v.aylar;
        const x = (hedef[gun ? ay.slice(2) : ay] ??= { ...BOS });
        for (const k of Object.keys(BOS) as (keyof AySayac)[]) x[k] = (x[k] ?? 0) + (s[k] ?? 0);
      }
      for (const a of Object.keys(v.aylar).sort().slice(0, -13)) delete v.aylar[a];
      if (v.gunler) for (const a of Object.keys(v.gunler).sort().slice(0, -62)) delete v.gunler[a];
      await mkdir(path.dirname(dosya(id)), { recursive: true });
      await writeFile(dosya(id), JSON.stringify(v));
    } catch { /* bir sonraki turda */ }
  }
}

/** Sayaçları artırır (beklemeden). */
export function kullanimArttir(id: string, ek: Partial<AySayac>) {
  if (!KIMLIK.test(id)) return;
  const ay = ayAnahtari(), gun = `g:${gunAnahtari()}`;
  const p = bekleyen.get(id) ?? {};
  const x = (p[ay] ??= { ...BOS }), y = (p[gun] ??= { ...BOS });
  for (const [k, v] of Object.entries(ek) as [keyof AySayac, number][]) { x[k] = (x[k] ?? 0) + (v || 0); y[k] = (y[k] ?? 0) + (v || 0); }
  bekleyen.set(id, p);
  if (!durum.z) durum.z = setTimeout(() => { isle().catch(() => {}); }, 5000);
}

/** Bu ayın (ya da verilen ayın) sayaçları; diske işlenmemiş olanlar da eklenir. */
export async function aylikKullanim(id: string, ay = ayAnahtari()): Promise<AySayac> {
  const v = await oku(id);
  const s = { ...BOS, ...(v.aylar[ay] ?? {}) };
  const b = bekleyen.get(id)?.[ay];
  if (b) for (const k of Object.keys(BOS) as (keyof AySayac)[]) s[k] += b[k];
  return s;
}

/** Son n günün sayaçları (eskiden yeniye; Türkiye saatine göre gün). */
export async function gunlukKullanim(id: string, n = 30): Promise<{ gun: string; s: AySayac }[]> {
  const v = await oku(id);
  const o: { gun: string; s: AySayac }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const gun = gunAnahtari(Date.now() - i * 864e5);
    const s = { ...BOS, ...(v.gunler?.[gun] ?? {}) };
    const b = bekleyen.get(id)?.[`g:${gun}`];
    if (b) for (const k of Object.keys(BOS) as (keyof AySayac)[]) s[k] += b[k];
    o.push({ gun, s });
  }
  return o;
}

/** Son N ayın sayaçları (eskiden yeniye). */
export async function kullanimGecmisi(id: string, n = 6): Promise<{ ay: string; s: AySayac }[]> {
  const v = await oku(id);
  const o: { ay: string; s: AySayac }[] = [];
  const simdi = new Date(Date.now() + 3 * 3600_000);
  for (let i = n - 1; i >= 0; i--) {
    const ay = new Date(Date.UTC(simdi.getUTCFullYear(), simdi.getUTCMonth() - i, 1)).toISOString().slice(0, 7);
    const s = { ...BOS, ...(v.aylar[ay] ?? {}) };
    const b = bekleyen.get(id)?.[ay];
    if (b) for (const k of Object.keys(BOS) as (keyof AySayac)[]) s[k] += b[k];
    o.push({ ay, s });
  }
  return o;
}
