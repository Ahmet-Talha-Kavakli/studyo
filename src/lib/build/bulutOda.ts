import "server-only";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { kanalGonder, kanalKimler } from "./bulutCanli";
import type { VeriOrtami } from "./veri";

/**
 * Vayra Bulut odaları (Cloudflare Durable Objects, Liveblocks benzeri): adla açılan, sunucuda tek doğru kopyası olan
 * paylaşılan durum ve sıralı olaylar. Çok kişili oyun (masa, hamle sırası, skor), canlı belge (alanlar, imleçler),
 * ortak beyaz tahta, sayaç ve oylama için.
 *  - Her değişiklik bir olaydır ve sıra numarası alır (seq). Bütün istemciler olayları aynı sırayla uygular; araya
 *    olay kaçırdığını fark eden istemci eksikleri ister (son 200 olay tutulur) ya da durumu baştan alır.
 *  - İşlemler: ayarla(yol, değer), sil(yol), artir(yol, n), ekle(yol, değer, sınır), birlestir(nesne), olay(ad, veri).
 *    Bir istekteki işlemler tek olay olarak, birlikte uygulanır. kosul: { seq } verilirse oda o sırada değilse
 *    reddedilir (sıra tabanlı oyunlarda "benim hamlem geçerli mi" denetimi).
 *  - Durum en çok 64 KB; proje başına 200 oda; 30 gün dokunulmayan oda silinir. Varlık (kim odada) kanal üzerinden.
 * Bellekte tutulur, 1 saniye içinde diske yazılır. Dosya: .veri/build/bulut-oda/<projeId>.json
 */
export type OdaIslem =
  | { t: "ayarla"; y: string; d: unknown }
  | { t: "sil"; y: string }
  | { t: "artir"; y: string; n?: number }
  | { t: "ekle"; y: string; d: unknown; s?: number }
  | { t: "birlestir"; y?: string; d: Record<string, unknown> }
  | { t: "olay"; o: string; d?: unknown }
  | { t: "sifirla"; d?: Record<string, unknown> };
export type OdaOlay = { seq: number; z: number; islemler: OdaIslem[]; kim: string; uyeId?: string };
export type Oda = { ad: string; ortam: VeriOrtami; durum: Record<string, unknown>; seq: number; olaylar: OdaOlay[]; olusturma: number; guncelleme: number; sayac: { olay: number } };

export const ODA_SINIR = { durum: 64 * 1024, oda: 200, olay: 200, islem: 20, deger: 16 * 1024 };
export const odaAdiGecerli = (a: string) => /^[A-Za-z0-9_:-]{1,50}$/.test(a);
/** Oda kanalının adı: "uyeler:" ile başlayan odalar üyelere açık kanal kullanır. */
export const odaKanali = (ad: string) => (ad.startsWith("uyeler:") ? `uyeler:oda:${ad.slice(7)}` : `oda:${ad}`);

type Proj = { odalar: Map<string, Oda>; yuklendi: Promise<void> | null; zaman: ReturnType<typeof setTimeout> | null };
type Durum = { projeler: Map<string, Proj> };
const G = globalThis as unknown as { __vayraOda?: Durum };
const d: Durum = (G.__vayraOda ??= { projeler: new Map() });
const KIMLIK = /^[A-Za-z0-9_-]{6,20}$/;
const dosya = (id: string) => path.join(DEPO_KOK, "build", "bulut-oda", `${id}.json`);
const anahtar = (ortam: VeriOrtami, ad: string) => `${ortam}|${ad}`;

async function proje(id: string): Promise<Proj> {
  if (!KIMLIK.test(id)) throw new OdaHatasi("Proje kimliği geçersiz.", 400);
  let p = d.projeler.get(id);
  if (!p) {
    p = { odalar: new Map(), yuklendi: null, zaman: null };
    d.projeler.set(id, p);
    const pp = p;
    p.yuklendi = readFile(dosya(id), "utf8").then((t) => {
      const sinir = Date.now() - 30 * 864e5;
      for (const o of (JSON.parse(t) as { odalar?: Oda[] }).odalar ?? []) if (o && odaAdiGecerli(o.ad) && o.guncelleme > sinir) pp.odalar.set(anahtar(o.ortam, o.ad), { ...o, sayac: o.sayac ?? { olay: 0 } });
    }).catch(() => {});
  }
  await p.yuklendi;
  return p;
}
function kaydet(id: string, p: Proj) {
  if (p.zaman) return;
  p.zaman = setTimeout(() => {
    p.zaman = null;
    mkdir(path.dirname(dosya(id)), { recursive: true }).then(() => writeFile(dosya(id), JSON.stringify({ odalar: [...p.odalar.values()] }))).catch(() => {});
  }, 1000);
}

export class OdaHatasi extends Error { constructor(m: string, public durum = 400, public ek?: Record<string, unknown>) { super(m); } }

const YASAK = new Set(["__proto__", "prototype", "constructor"]);
function yolCoz(y: string): string[] {
  const l = String(y ?? "").split(".").filter((x) => x !== "");
  if (l.length > 8 || l.some((x) => YASAK.has(x) || x.length > 60)) throw new OdaHatasi(`Yol geçersiz: "${y}"`);
  return l;
}
function kap(kok: Record<string, unknown>, yol: string[], olustur: boolean): { ust: Record<string, unknown> | unknown[]; son: string } | null {
  let x: unknown = kok;
  for (let i = 0; i < yol.length - 1; i++) {
    const o = x as Record<string, unknown>, p = yol[i];
    if (o[p] === undefined || o[p] === null || typeof o[p] !== "object") { if (!olustur) return null; o[p] = /^\d+$/.test(yol[i + 1]) ? [] : {}; }
    x = o[p];
  }
  return { ust: x as Record<string, unknown>, son: yol[yol.length - 1] };
}
const derin = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)) as T);

/** İşlemleri duruma uygular (yerinde). */
export function uygula(durum: Record<string, unknown>, l: OdaIslem[]): Record<string, unknown> {
  let kok = durum;
  for (const i of l) {
    switch (i.t) {
      case "sifirla": kok = derin(i.d && typeof i.d === "object" && !Array.isArray(i.d) ? i.d : {}); break;
      case "olay": break;
      case "birlestir": {
        if (!i.d || typeof i.d !== "object" || Array.isArray(i.d)) throw new OdaHatasi("birlestir bir nesne bekler.");
        const yol = i.y ? yolCoz(i.y) : [];
        let hedef: Record<string, unknown> = kok;
        if (yol.length) { const c = kap(kok, yol, true)!; const u = c.ust as Record<string, unknown>; if (!u[c.son] || typeof u[c.son] !== "object") u[c.son] = {}; hedef = u[c.son] as Record<string, unknown>; }
        for (const [a, v] of Object.entries(i.d)) { if (YASAK.has(a)) continue; if (v === null) delete hedef[a]; else hedef[a] = derin(v); }
        break;
      }
      default: {
        const yol = yolCoz(i.y);
        if (!yol.length) { if (i.t === "ayarla" && i.d && typeof i.d === "object" && !Array.isArray(i.d)) { kok = derin(i.d as Record<string, unknown>); break; } throw new OdaHatasi("Kök için birlestir ya da sifirla kullan."); }
        const c = kap(kok, yol, i.t !== "sil");
        if (!c) break;
        const u = c.ust as Record<string, unknown>;
        if (i.t === "ayarla") u[c.son] = derin(i.d);
        else if (i.t === "sil") { if (Array.isArray(u) && /^\d+$/.test(c.son)) (u as unknown[]).splice(Number(c.son), 1); else delete u[c.son]; }
        else if (i.t === "artir") { const n = Number(i.n ?? 1); if (!Number.isFinite(n)) throw new OdaHatasi("artir sayı bekler."); u[c.son] = (typeof u[c.son] === "number" ? (u[c.son] as number) : 0) + n; }
        else if (i.t === "ekle") {
          if (!Array.isArray(u[c.son])) u[c.son] = [];
          const dz = u[c.son] as unknown[];
          dz.push(derin(i.d));
          const s = Math.min(500, Math.max(1, Math.round(Number(i.s) || 500)));
          if (dz.length > s) dz.splice(0, dz.length - s);
        }
      }
    }
  }
  return kok;
}

/** Gelen işlem listesini doğrular ve sadeleştirir. */
export function islemTemizle(g: unknown): OdaIslem[] {
  if (!Array.isArray(g) || !g.length) throw new OdaHatasi("En az bir işlem gönder.");
  if (g.length > ODA_SINIR.islem) throw new OdaHatasi(`Bir istekte en çok ${ODA_SINIR.islem} işlem olabilir.`);
  return g.map((x) => {
    const t = (x as { t?: string })?.t;
    const y = String((x as { y?: unknown }).y ?? "");
    const dd = (x as { d?: unknown }).d;
    if (dd !== undefined && JSON.stringify(dd).length > ODA_SINIR.deger) throw new OdaHatasi("Tek değer en çok 16 KB olabilir.", 413);
    switch (t) {
      case "ayarla": return { t, y, d: dd ?? null };
      case "sil": return { t, y };
      case "artir": return { t, y, n: Number((x as { n?: unknown }).n ?? 1) };
      case "ekle": return { t, y, d: dd ?? null, ...((x as { s?: unknown }).s ? { s: Number((x as { s?: unknown }).s) } : {}) };
      case "birlestir": return { t, ...(y ? { y } : {}), d: (dd ?? {}) as Record<string, unknown> };
      case "olay": { const o = String((x as { o?: unknown }).o ?? "").slice(0, 40); if (!/^[\p{L}\p{N}_ -]{1,40}$/u.test(o)) throw new OdaHatasi("Olay adı geçersiz."); return { t, o, ...(dd !== undefined ? { d: dd } : {}) }; }
      case "sifirla": return { t, ...(dd && typeof dd === "object" ? { d: dd as Record<string, unknown> } : {}) };
    }
    throw new OdaHatasi(`Bilinmeyen işlem: ${String(t)}`);
  });
}

/** Odayı getirir (yoksa boş açar; olustur false ise null). */
export async function odaGetir(id: string, ortam: VeriOrtami, ad: string, olustur = true): Promise<Oda | null> {
  if (!odaAdiGecerli(ad)) throw new OdaHatasi("Oda adı yalnız harf, rakam, tire, alt çizgi ve iki nokta olabilir (en çok 50).");
  const p = await proje(id);
  let o = p.odalar.get(anahtar(ortam, ad));
  if (!o && olustur) {
    if ([...p.odalar.values()].length >= ODA_SINIR.oda) throw new OdaHatasi(`Bu projede en çok ${ODA_SINIR.oda} oda açılabilir. Kullanılmayanları Bulut › Odalar'dan sil.`, 429);
    o = { ad, ortam, durum: {}, seq: 0, olaylar: [], olusturma: Date.now(), guncelleme: Date.now(), sayac: { olay: 0 } };
    p.odalar.set(anahtar(ortam, ad), o);
    kaydet(id, p);
  }
  return o ?? null;
}

/** İşlemleri odaya uygular, sıra numarası verir, oda kanalındaki herkese yayınlar. */
export async function odaUygula(id: string, ortam: VeriOrtami, ad: string, islemler: OdaIslem[], g: { kim: string; uyeId?: string | null; kosul?: { seq?: number } }): Promise<OdaOlay> {
  const o = (await odaGetir(id, ortam, ad))!;
  if (g.kosul?.seq !== undefined && Number(g.kosul.seq) !== o.seq) throw new OdaHatasi("Oda bu arada değişti; güncel durumla yeniden dene.", 409, { seq: o.seq, durum: o.durum });
  const yeni = uygula(derin(o.durum), islemler);
  if (JSON.stringify(yeni).length > ODA_SINIR.durum) throw new OdaHatasi("Oda durumu en çok 64 KB olabilir; eski verileri sil ya da kalıcı veri için tablo kullan.", 413);
  o.durum = yeni;
  o.seq++;
  o.guncelleme = Date.now();
  o.sayac.olay++;
  const olay: OdaOlay = { seq: o.seq, z: o.guncelleme, islemler, kim: g.kim, ...(g.uyeId ? { uyeId: g.uyeId } : {}) };
  o.olaylar.push(olay);
  if (o.olaylar.length > ODA_SINIR.olay) o.olaylar.splice(0, o.olaylar.length - ODA_SINIR.olay);
  kaydet(id, await proje(id));
  kanalGonder(id, ortam, odaKanali(ad), "$oda", olay);
  return olay;
}

/** İstemcinin eşitlenmesi: sonra verilirse o sıradan sonraki olaylar (kayıp yoksa), değilse bütün durum. */
export async function odaEsitle(id: string, ortam: VeriOrtami, ad: string, sonra?: number) {
  const o = await odaGetir(id, ortam, ad, false);
  if (!o) return { tam: true, seq: 0, durum: {} as Record<string, unknown> };
  if (sonra !== undefined && Number.isFinite(sonra) && sonra <= o.seq) {
    const ilk = o.olaylar[0]?.seq ?? o.seq + 1;
    if (sonra === o.seq) return { tam: false, seq: o.seq, olaylar: [] as OdaOlay[] };
    if (sonra + 1 >= ilk) return { tam: false, seq: o.seq, olaylar: o.olaylar.filter((x) => x.seq > sonra) };
  }
  return { tam: true, seq: o.seq, durum: o.durum };
}

/** Panel: odaların listesi (ortam başına), kişi sayısıyla. */
export async function odalar(id: string) {
  const p = await proje(id);
  return [...p.odalar.values()].map((o) => ({ ad: o.ad, ortam: o.ortam, seq: o.seq, boyut: JSON.stringify(o.durum).length, olusturma: o.olusturma, guncelleme: o.guncelleme, kisi: kanalKimler(id, o.ortam, odaKanali(o.ad)).length, olay: o.sayac.olay })).sort((a, b) => b.kisi - a.kisi || b.guncelleme - a.guncelleme);
}
export async function odaAyrinti(id: string, ortam: VeriOrtami, ad: string) {
  const o = await odaGetir(id, ortam, ad, false);
  if (!o) return null;
  return { ...o, olaylar: [...o.olaylar].reverse().slice(0, 100), kimler: kanalKimler(id, ortam, odaKanali(ad)), boyut: JSON.stringify(o.durum).length };
}
export async function odaSil(id: string, ortam: VeriOrtami, ad: string) {
  const p = await proje(id);
  const var_ = p.odalar.delete(anahtar(ortam, ad));
  if (var_) { kaydet(id, p); kanalGonder(id, ortam, odaKanali(ad), "$oda", { seq: 0, z: Date.now(), islemler: [{ t: "sifirla" }], kim: "panel", silindi: true }); }
  return var_;
}

/** Sunucu fonksiyonlarından (vayra.oda) gelen istek: { t: "oku" } ya da { islemler, kosul }. */
export async function odaFonksiyon(id: string, ortam: VeriOrtami, ad: string, g: { t?: string; islemler?: unknown; kosul?: { seq?: number } }) {
  if (g.t === "oku") { const o = await odaGetir(id, ortam, ad, false); return { seq: o?.seq ?? 0, durum: o?.durum ?? {}, kimler: kanalKimler(id, ortam, odaKanali(ad)).length }; }
  const olay = await odaUygula(id, ortam, ad, islemTemizle(g.islemler), { kim: "sunucu", kosul: g.kosul });
  const o = await odaGetir(id, ortam, ad, false);
  return { seq: olay.seq, durum: o?.durum ?? {} };
}
