import "server-only";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";

/**
 * Analitik derinliği (sayfa görüntülemeden ayrı depo): bulunamayan sayfalar (404), özel olaylar (vayra.olay) ve
 * gerçek kullanıcı hız ölçümleri (LCP, CLS, INP). Gün başına (Türkiye saati) tutulur, 120 gün saklanır.
 * Yazımlar bellekte toplanır, 4 saniyede bir diske işlenir. Dosya: .veri/build/analitik-ek/<id>.json
 */
export type OlayGun = { adet: number; ozellik: Record<string, Record<string, number>> };
export type HizOrnek = [lcp: number | null, cls: number | null, inp: number | null, mobil: 0 | 1];
export type EkGun = { b: Record<string, number>; o: Record<string, OlayGun>; h: Record<string, HizOrnek[]> };
type Kayit = { gunler: Record<string, EkGun> };

const KIMLIK = /^[A-Za-z0-9_-]{6,20}$/;
const dosya = (id: string) => path.join(DEPO_KOK, "build", "analitik-ek", `${id}.json`);
export const gunAnahtari = (t = Date.now()) => new Date(t + 3 * 3600_000).toISOString().slice(0, 10);
const bos = (): EkGun => ({ b: {}, o: {}, h: {} });
type Durum = { bekleyen: Map<string, ((v: Kayit) => void)[]>; z: ReturnType<typeof setTimeout> | null };
const G = globalThis as unknown as { __vayraAnalitikEk?: Durum };
const durum: Durum = (G.__vayraAnalitikEk ??= { bekleyen: new Map(), z: null });
const bekleyen = durum.bekleyen;

async function oku(id: string): Promise<Kayit> {
  try { return JSON.parse(await readFile(dosya(id), "utf8")); } catch { return { gunler: {} }; }
}
async function isle() {
  durum.z = null;
  const l = [...bekleyen.entries()];
  bekleyen.clear();
  for (const [id, fl] of l) {
    try {
      const v = await oku(id);
      for (const f of fl) f(v);
      for (const a of Object.keys(v.gunler).sort().slice(0, -120)) delete v.gunler[a];
      await mkdir(path.dirname(dosya(id)), { recursive: true });
      await writeFile(dosya(id), JSON.stringify(v));
    } catch { /* bir sonraki turda */ }
  }
}
function sirala(id: string, f: (g: EkGun) => void) {
  if (!KIMLIK.test(id)) return;
  const gun = gunAnahtari();
  const l = bekleyen.get(id) ?? [];
  if (l.length > 5000) return;
  l.push((v) => f((v.gunler[gun] ??= bos())));
  bekleyen.set(id, l);
  if (!durum.z) durum.z = setTimeout(() => { isle().catch(() => {}); }, 4000);
}
const arttir = (o: Record<string, number>, a: string, sinir = 300) => { if (a in o || Object.keys(o).length < sinir) o[a] = (o[a] ?? 0) + 1; };

/** Bulunamayan sayfa isteğini sayar (dosya uzantılı olanlar da dahil). */
export function bulunamadiSay(id: string, yol: string) { sirala(id, (g) => arttir(g.b, yol.slice(0, 160))); }

/** Özel olay: ad + düz özellikler (her özellik için en çok 50 farklı değer sayılır). */
export function olaySay(id: string, ad: string, veri: Record<string, unknown>) {
  const a = ad.trim().slice(0, 60);
  if (!a) return;
  sirala(id, (g) => {
    if (!(a in g.o) && Object.keys(g.o).length >= 100) return;
    const o = (g.o[a] ??= { adet: 0, ozellik: {} });
    o.adet++;
    for (const [k, v] of Object.entries(veri).slice(0, 10)) {
      if (v === null || typeof v === "object") continue;
      const kk = k.slice(0, 40);
      if (!(kk in o.ozellik) && Object.keys(o.ozellik).length >= 20) continue;
      arttir((o.ozellik[kk] ??= {}), String(v).slice(0, 80), 50);
    }
  });
}

/** Hız örneği (sayfa başına günde en çok 400 örnek tutulur). */
export function hizEkle(id: string, sayfa: string, o: HizOrnek) {
  sirala(id, (g) => { const l = (g.h[sayfa.slice(0, 120)] ??= []); if (l.length < 400) l.push(o); else if (Object.keys(g.h).length < 200) l[Math.floor(Math.random() * l.length)] = o; });
}

/** Son n günün ek verisi (bekleyenler dahil değil; en çok 4 sn gecikir). */
export async function ekAnalitikOku(id: string, n: number, kaydir = 0): Promise<EkGun[]> {
  const v = await oku(id);
  const o: EkGun[] = [];
  for (let i = kaydir; i < kaydir + n; i++) o.push(v.gunler[gunAnahtari(Date.now() - i * 864e5)] ?? bos());
  return o;
}
