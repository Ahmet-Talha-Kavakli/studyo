import "server-only";
import { createHmac, randomBytes } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { guvenliFetch } from "@/lib/guvenliAg";
import type { Kayit } from "./veri";

/**
 * Veri kancaları (Supabase Database Webhooks benzeri): tabloda kayıt eklenince, güncellenince ya da silinince dış adrese
 * imzalı POST. Gövde { olay, tablo, kayit, onceki?, zaman }; başlıklar X-Vayra-Olay, X-Vayra-Imza (sha256=HMAC gövde,
 * kancanın sırrıyla), X-Vayra-Teslim. Yalnız Canlı ortamda; istek guvenliFetch ile (iç ağ adresleri engelli), 10 sn.
 * Başarısızlıkta 1 ve 5 dakika sonra yeniden denenir (sunucu yeniden başlarsa bekleyen deneme düşer). Son 100 teslim
 * saklanır. Dosya: .veri/build/bulut-kanca/<projeId>.json
 */
export type KancaOlay = "ekle" | "guncelle" | "sil";
export type Kanca = { id: string; ad: string; tablo: string; olaylar: KancaOlay[]; adres: string; sir: string; acik: boolean; olusturma: number };
export type Teslim = { id: string; kancaId: string; z: number; olay: string; tablo: string; durum: number; sure: number; deneme: number; hata?: string; yanit?: string };
type Depo = { kancalar: Kanca[]; teslimler: Teslim[] };
const KIMLIK = /^[A-Za-z0-9_-]{6,20}$/;
const dosya = (id: string) => path.join(DEPO_KOK, "build", "bulut-kanca", `${id}.json`);
const kuyruk = new Map<string, Promise<unknown>>();
const onbellek = new Map<string, { k: Kanca[]; z: number }>();

export async function kancaOku(id: string): Promise<Depo> { try { const d = JSON.parse(await readFile(dosya(id), "utf8")) as Partial<Depo>; return { kancalar: d.kancalar ?? [], teslimler: d.teslimler ?? [] }; } catch { return { kancalar: [], teslimler: [] }; } }
export async function kancaDegistir<T>(id: string, f: (d: Depo) => T): Promise<T> {
  if (!KIMLIK.test(id)) throw new Error("Proje kimliği geçersiz.");
  const onceki = kuyruk.get(id) ?? Promise.resolve();
  let s!: T;
  const is = onceki.then(async () => { const d = await kancaOku(id); s = f(d); d.teslimler = d.teslimler.slice(0, 100); await mkdir(path.dirname(dosya(id)), { recursive: true }); await writeFile(dosya(id), JSON.stringify(d)); onbellek.delete(id); });
  kuyruk.set(id, is.catch(() => {}));
  await is;
  return s;
}
export const yeniSir = () => `vks_${randomBytes(18).toString("base64url")}`;

/** Kancayı doğrular: ad, tablo, olaylar, https adresi (geliştirmede http de olur). */
export function kancaTemizle(g: Partial<Kanca>, eski?: Kanca): Kanca {
  const tablo = String(g.tablo ?? eski?.tablo ?? "").trim();
  if (tablo !== "*" && !/^[a-zA-Z0-9_-]{1,40}$/.test(tablo)) throw new Error("Tablo seç.");
  const olaylar = (Array.isArray(g.olaylar) ? g.olaylar : eski?.olaylar ?? []).filter((x): x is KancaOlay => ["ekle", "guncelle", "sil"].includes(x));
  if (!olaylar.length) throw new Error("En az bir olay seç.");
  const adres = String(g.adres ?? eski?.adres ?? "").trim();
  let u: URL; try { u = new URL(adres); } catch { throw new Error("Adres geçerli bir URL olmalı (https://...)."); }
  if (u.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && u.protocol === "http:")) throw new Error("Adres https ile başlamalı.");
  return { id: eski?.id ?? randomBytes(5).toString("base64url"), ad: String(g.ad ?? eski?.ad ?? "").trim().slice(0, 60) || `${tablo} kancası`, tablo, olaylar: [...new Set(olaylar)], adres: u.toString().slice(0, 500), sir: eski?.sir ?? yeniSir(), acik: g.acik ?? eski?.acik ?? true, olusturma: eski?.olusturma ?? Date.now() };
}

async function teslimEt(projeId: string, k: Kanca, govde: Record<string, unknown>, deneme: number, teslimId: string): Promise<Teslim> {
  const metin = JSON.stringify(govde);
  const bas = Date.now();
  const t: Teslim = { id: teslimId, kancaId: k.id, z: bas, olay: String(govde.olay), tablo: String(govde.tablo), durum: 0, sure: 0, deneme };
  try {
    const r = await guvenliFetch(k.adres, { method: "POST", body: metin, headers: { "Content-Type": "application/json", "User-Agent": "Vayra-Kanca", "X-Vayra-Olay": `${govde.tablo}.${govde.olay}`, "X-Vayra-Teslim": teslimId, "X-Vayra-Imza": `sha256=${createHmac("sha256", k.sir).update(metin).digest("hex")}` }, signal: AbortSignal.timeout(10_000) }, { yalnizHttps: process.env.NODE_ENV === "production", yerel: process.env.NODE_ENV !== "production" });
    t.durum = r.status; t.yanit = (await r.text().catch(() => "")).slice(0, 300);
  } catch (e) { t.hata = (e as Error).message.slice(0, 200); }
  t.sure = Date.now() - bas;
  await kancaDegistir(projeId, (d) => { d.teslimler.unshift(t); }).catch(() => {});
  return t;
}

/** Olayı ilgili kancalara gönderir (beklemeden). Yalnız Canlı ortam. */
export function kancaTetikle(projeId: string, tablo: string, olay: KancaOlay, kayit?: Kayit, onceki?: Kayit) {
  (async () => {
    let o = onbellek.get(projeId);
    if (!o || Date.now() - o.z > 5000) { o = { k: (await kancaOku(projeId)).kancalar, z: Date.now() }; onbellek.set(projeId, o); }
    for (const k of o.k.filter((x) => x.acik && (x.tablo === "*" || x.tablo === tablo) && x.olaylar.includes(olay))) {
      const govde = { olay, tablo, kayit: olay === "sil" ? { id: kayit?.id } : kayit, ...(onceki ? { onceki } : {}), ...(olay === "sil" && kayit ? { onceki: kayit } : {}), zaman: new Date().toISOString() };
      const teslimId = randomBytes(6).toString("base64url");
      const dene = async (n: number) => {
        const t = await teslimEt(projeId, k, govde, n, teslimId);
        if ((t.durum === 0 || t.durum >= 500 || t.durum === 429) && n < 3) setTimeout(() => { dene(n + 1).catch(() => {}); }, n === 1 ? 60_000 : 300_000);
      };
      dene(1).catch(() => {});
    }
  })().catch(() => {});
}

/** Panelden deneme teslimi (örnek kayıtla, hemen; sonuç döner). */
export async function kancaDene(projeId: string, k: Kanca) {
  return teslimEt(projeId, k, { olay: k.olaylar[0], tablo: k.tablo, kayit: { id: "deneme", ornek: true }, deneme: true, zaman: new Date().toISOString() }, 1, randomBytes(6).toString("base64url"));
}
