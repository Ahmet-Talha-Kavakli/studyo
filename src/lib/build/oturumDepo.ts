import "server-only";
import { appendFile, mkdir, readFile, readdir, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { cihazBul, OTURUM_SINIR, type HamOlay, type OturumAi, type OturumOzet } from "./oturumTipler";

/**
 * Ziyaretçi oturum kayıtları (.veri/build/oturum/<projeId>/…):
 *  dizin.json            oturum özetleri (liste ve süzgeçler bunu okur)
 *  <oturumId>.ndjson     gelen her paket bir satır: { p: sayfa yüklemesi, s: sıra, e: rrweb olayları }
 * Yazmalar proje başına sıraya alınır (aynı anda gelen paketler dizini ezmez). Saklama süresi dolan oturumlar okurken
 * ve yazarken (en çok 10 dakikada bir) silinir; proje 300 MB ya da 5000 oturumu aşarsa en eskiler gider.
 * IP saklanmaz; ülke yalnız barındırıcının başlığından (x-vercel-ip-country, cf-ipcountry) gelir.
 */

const KOK = path.join(DEPO_KOK, "build", "oturum");
const PROJE = /^[A-Za-z0-9_-]{12}$/;
export const OTURUM_KIMLIK = /^[A-Za-z0-9]{16,32}$/;
export const PAKET_KIMLIK = /^[A-Za-z0-9]{6,16}$/;
const klasor = (id: string) => path.join(KOK, id);
const dizinYolu = (id: string) => path.join(klasor(id), "dizin.json");
const olayYolu = (id: string, o: string) => path.join(klasor(id), `${o}.ndjson`);

/** _a: yinelenen paketi ayıklamak için son paket anahtarları (istemciye gitmez). */
type Kayit = OturumOzet & { _a?: string[] };
type Dizin = { oturumlar: Record<string, Kayit>; temizlik?: number };

const g = globalThis as unknown as { __vayraOturum?: { dizin: Map<string, Dizin>; kuyruk: Map<string, Promise<unknown>> } };
const bellek = (g.__vayraOturum ??= { dizin: new Map(), kuyruk: new Map() });

async function dizinOku(id: string): Promise<Dizin> {
  const o = bellek.dizin.get(id);
  if (o) return o;
  let d: Dizin = { oturumlar: {} };
  try { const h = JSON.parse(await readFile(dizinYolu(id), "utf8")) as Dizin; if (h && typeof h.oturumlar === "object") d = h; } catch { /* yok */ }
  bellek.dizin.set(id, d);
  return d;
}
async function dizinYaz(id: string, d: Dizin) {
  await mkdir(klasor(id), { recursive: true });
  await writeFile(dizinYolu(id), JSON.stringify(d));
}
function sirada<T>(id: string, f: () => Promise<T>): Promise<T> {
  const onceki = bellek.kuyruk.get(id) ?? Promise.resolve();
  const is = onceki.then(f, f);
  bellek.kuyruk.set(id, is.catch(() => {}));
  return is;
}
const temiz = (k: Kayit): OturumOzet => { const { _a, ...o } = k; void _a; return o; };

/** Saklama süresi dolanları, proje sınırını aşan en eskileri ve dizinde olmayan yetim dosyaları siler. */
async function temizle(id: string, d: Dizin, saklamaGun: number): Promise<number> {
  const sinir = Date.now() - saklamaGun * 864e5;
  let silinen = 0;
  for (const [o, k] of Object.entries(d.oturumlar)) {
    if (k.guncel < sinir) { delete d.oturumlar[o]; await rm(olayYolu(id, o), { force: true }); silinen++; }
  }
  const l = Object.values(d.oturumlar).sort((a, b) => a.guncel - b.guncel);
  let toplam = l.reduce((t, k) => t + k.bayt, 0), adet = l.length;
  for (const k of l) {
    if (toplam <= OTURUM_SINIR.projeBayt && adet <= OTURUM_SINIR.projeOturum) break;
    delete d.oturumlar[k.id]; await rm(olayYolu(id, k.id), { force: true }); toplam -= k.bayt; adet--; silinen++;
  }
  try {
    for (const f of await readdir(klasor(id))) if (f.endsWith(".ndjson") && !d.oturumlar[f.slice(0, -7)]) await rm(path.join(klasor(id), f), { force: true });
  } catch { /* klasör yok */ }
  d.temizlik = Date.now();
  return silinen;
}

const yazi = (x: unknown, n: number) => (typeof x === "string" ? x.slice(0, n) : "");

/** Gelen paketin olaylarıyla özeti günceller (sayfalar, cihaz, tık ve işaret sayıları, süre). */
function ozetGuncelle(k: Kayit, olaylar: HamOlay[]) {
  for (const e of olaylar) {
    const z = e.timestamp;
    if (!k.bas || z < k.bas) k.bas = z;
    if (z > k.son) k.son = z;
    if (e.type === 4) {
      const m = (e.data ?? {}) as { width?: number; height?: number };
      if (Number(m.width) > 0) { k.en = Math.round(Number(m.width)); k.boy = Math.round(Number(m.height) || 0); k.cihaz = cihazBul(k.en); }
    } else if (e.type === 5) {
      const c = (e.data ?? {}) as { tag?: string; payload?: Record<string, unknown> }, p = c.payload ?? {};
      switch (c.tag) {
        case "vayra-sayfa":
          if (k.sayfalar.length < 100) k.sayfalar.push({ yol: yazi(p.y, 120) || "index.html", z, ...(yazi(p.b, 120) ? { baslik: yazi(p.b, 120) } : {}) });
          if (!k.ref && yazi(p.r, 80)) k.ref = yazi(p.r, 80);
          break;
        case "vayra-tik": k.tik++; break;
        case "vayra-ofkeli": k.ofkeli++; break;
        case "vayra-olu": k.olu++; break;
        case "vayra-hata": if (p.s === "uyari") k.uyari++; else k.hata++; break;
        case "vayra-alan": k.alan++; break;
      }
    }
  }
  k.sayfalar.sort((a, b) => a.z - b.z);
  k.sure = Math.max(0, k.son - k.bas);
}

export type GelenPaket = { o: string; p: string; s: number; e: HamOlay[] };

/** Paketi oturum dosyasına ekler. dur: kaydedici durmalı (oturum boyut sınırına ulaştı). */
export function paketEkle(id: string, g: GelenPaket, b: { bayt: number; saklama: number; tarayici?: string; ulke?: string; dil?: string }): Promise<{ ok: boolean; dur?: boolean }> {
  if (!PROJE.test(id) || !OTURUM_KIMLIK.test(g.o)) return Promise.resolve({ ok: false });
  return sirada(id, async () => {
    const d = await dizinOku(id);
    const simdi = Date.now();
    let k = d.oturumlar[g.o];
    if (!k) {
      k = d.oturumlar[g.o] = {
        id: g.o, bas: 0, son: 0, sure: 0, alinma: simdi, guncel: simdi, sayfalar: [], cihaz: "masaustu", en: 0, boy: 0,
        ...(b.tarayici ? { tarayici: b.tarayici } : {}), ...(b.ulke ? { ulke: b.ulke } : {}), ...(b.dil ? { dil: b.dil } : {}),
        tik: 0, ofkeli: 0, olu: 0, hata: 0, uyari: 0, alan: 0, bayt: 0, olay: 0, _a: [],
      };
    }
    if (k.dolu) return { ok: false, dur: true };
    const anahtar = `${g.p}:${g.s}`;
    if (k._a?.includes(anahtar)) return { ok: true };
    if (k.bayt + b.bayt > OTURUM_SINIR.oturumBayt) { k.dolu = true; k.guncel = simdi; await dizinYaz(id, d); return { ok: false, dur: true }; }
    await mkdir(klasor(id), { recursive: true });
    await appendFile(olayYolu(id, g.o), JSON.stringify({ p: g.p, s: g.s, e: g.e }) + "\n");
    ozetGuncelle(k, g.e);
    k._a = [...(k._a ?? []), anahtar].slice(-400);
    k.bayt += b.bayt; k.olay += g.e.length; k.guncel = simdi;
    if (!d.temizlik || simdi - d.temizlik > 600_000) await temizle(id, d, b.saklama);
    await dizinYaz(id, d);
    return { ok: true };
  });
}

/** Oturum listesi (yeniden eskiye); okurken süresi dolanlar silinir. */
export function oturumListesi(id: string, saklama: number): Promise<OturumOzet[]> {
  if (!PROJE.test(id)) return Promise.resolve([]);
  return sirada(id, async () => {
    const d = await dizinOku(id);
    const once = Object.keys(d.oturumlar).length;
    const silinen = await temizle(id, d, saklama);
    if (silinen || once) await dizinYaz(id, d).catch(() => {});
    return Object.values(d.oturumlar).map(temiz).sort((a, b) => b.alinma - a.alinma);
  });
}

/** Tek oturumun özeti ve zamana göre sıralı bütün rrweb olayları. */
export async function oturumOku(id: string, o: string, saklama: number): Promise<{ ozet: OturumOzet; olaylar: HamOlay[] } | null> {
  if (!PROJE.test(id) || !OTURUM_KIMLIK.test(o)) return null;
  const d = await dizinOku(id);
  const k = d.oturumlar[o];
  if (!k) return null;
  if (k.guncel < Date.now() - saklama * 864e5) { await oturumSil(id, o); return null; }
  let ham = "";
  try { ham = await readFile(olayYolu(id, o), "utf8"); } catch { return { ozet: temiz(k), olaylar: [] }; }
  const parcalar = ham.split("\n").filter(Boolean).map((s) => { try { return JSON.parse(s) as { p: string; s: number; e: HamOlay[] }; } catch { return null; } }).filter((x): x is { p: string; s: number; e: HamOlay[] } => !!x && Array.isArray(x.e));
  // Aynı sayfa yüklemesinin paketleri sıra numarasına göre; sonra bütün olaylar zamana göre (kararlı sıralama).
  parcalar.sort((a, b) => (a.p === b.p ? a.s - b.s : (a.e[0]?.timestamp ?? 0) - (b.e[0]?.timestamp ?? 0)));
  const olaylar = parcalar.flatMap((x) => x.e).sort((a, b) => a.timestamp - b.timestamp);
  return { ozet: temiz(k), olaylar };
}

/** Tek oturumu ya da (o verilmezse) projenin bütün oturumlarını siler. */
export function oturumSil(id: string, o?: string): Promise<number> {
  if (!PROJE.test(id)) return Promise.resolve(0);
  return sirada(id, async () => {
    const d = await dizinOku(id);
    if (o) {
      if (!d.oturumlar[o]) return 0;
      delete d.oturumlar[o];
      await rm(olayYolu(id, o), { force: true });
      await dizinYaz(id, d);
      return 1;
    }
    const n = Object.keys(d.oturumlar).length;
    bellek.dizin.delete(id);
    await rm(klasor(id), { recursive: true, force: true });
    return n;
  });
}

export function aiOzetYaz(id: string, o: string, ai: OturumAi): Promise<boolean> {
  return sirada(id, async () => {
    const d = await dizinOku(id);
    const k = d.oturumlar[o];
    if (!k) return false;
    k.ai = ai;
    await dizinYaz(id, d);
    return true;
  });
}
