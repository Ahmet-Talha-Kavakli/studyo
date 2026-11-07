import "server-only";
import { mkdir, readFile, rename, rm, writeFile } from "fs/promises";
import { randomBytes } from "crypto";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { kilitle } from "./sistemDepo";

/**
 * Depo adımı: çalışmalar arasında kalan anahtar-değer deposu (Storage by Zapier, Make data store, n8n static data).
 * Sahip başına tek dosya: build/sistem-depo/<sahip özeti>.json. Kapsam "sistem" anahtarı yalnız o sisteme ayırır,
 * "hesap" bütün sistemlerin ortak kullandığı anahtardır. İşlemler: yaz, oku, artir, ekle (listeye), cek (listeden),
 * sil ve goruldu (daha önce görüldü mü; tekilleştirme). Süre verilirse anahtar o kadar gün sonra kendiliğinden silinir.
 */
export type DepoIslem = "yaz" | "oku" | "artir" | "ekle" | "cek" | "sil" | "goruldu";
type Kayit = { v: unknown; t: number; s?: number; k: "sistem" | "hesap"; sid?: string };
type Dosya = Record<string, Kayit>;
export const DEPO_SINIR = { anahtar: 2000, deger: 100_000, liste: 1000, gorulen: 5000 };

const dosya = (sahipOz: string) => path.join(DEPO_KOK, "build", "sistem-depo", `${sahipOz}.json`);
async function oku(sahipOz: string): Promise<Dosya> { try { return JSON.parse(await readFile(dosya(sahipOz), "utf8")) as Dosya; } catch { return {}; } }
async function yaz(sahipOz: string, d: Dosya) {
  const f = dosya(sahipOz);
  await mkdir(path.dirname(f), { recursive: true });
  const g = `${f}.${randomBytes(4).toString("hex")}.tmp`;
  await writeFile(g, JSON.stringify(d));
  try { await rename(g, f); } catch { await writeFile(f, JSON.stringify(d)); await rm(g, { force: true }); }
}
const temizle = (d: Dosya, simdi = Date.now()) => { for (const [k, x] of Object.entries(d)) if (x.s && x.s < simdi) delete d[k]; return d; };
export const depoAnahtari = (kapsam: string, sistemId: string, anahtar: string) => (kapsam === "hesap" ? `h:${anahtar}` : `s:${sistemId}:${anahtar}`);
const boyut = (v: unknown) => JSON.stringify(v ?? null).length;

export type DepoSonuc = { veri: Record<string, unknown>; cikti: string; dur?: boolean };
export class DepoHatasi extends Error {}

/** Depo işlemi. dene: yazan işlemler diske yazılmaz, sonuç olacağı gibi döner. */
export async function depoIslem(sahipOz: string, sistemId: string, x: { islem: string; anahtar: string; deger: unknown; miktar: number; kapsam: string; sure: number; gorulduyse: string; nereden: string }, dene: boolean): Promise<DepoSonuc> {
  const anahtar = x.anahtar.trim().slice(0, 120);
  if (!anahtar) throw new DepoHatasi("Anahtar yaz (ör. son_siparis_no) ya da / ile önceki adımdan seç.");
  const kapsam = x.kapsam === "hesap" ? "hesap" : "sistem";
  const k = depoAnahtari(kapsam, sistemId, anahtar);
  const islem = (["yaz", "oku", "artir", "ekle", "cek", "sil", "goruldu"].includes(x.islem) ? x.islem : "yaz") as DepoIslem;
  const sonKullanma = x.sure > 0 ? Date.now() + Math.min(3650, x.sure) * 86_400_000 : undefined;
  const ozet = (v: unknown) => { const s = typeof v === "string" ? v : JSON.stringify(v ?? null); return s.length > 120 ? `${s.slice(0, 120)}…` : s; };
  return kilitle(`depo:${sahipOz}`, async () => {
    const d = temizle(await oku(sahipOz));
    const var_ = d[k];
    const yeniMi = !var_;
    const kaydet = async (v: unknown) => {
      if (boyut(v) > DEPO_SINIR.deger) throw new DepoHatasi("Değer 100 KB sınırını aşıyor.");
      if (yeniMi && Object.keys(d).length >= DEPO_SINIR.anahtar) throw new DepoHatasi(`Depo dolu (${DEPO_SINIR.anahtar} anahtar). Değişkenler panelindeki Depo bölümünden eski anahtarları sil.`);
      d[k] = { v, t: Date.now(), s: sonKullanma ?? var_?.s, k: kapsam, ...(kapsam === "sistem" ? { sid: sistemId } : {}) };
      if (!dene) await yaz(sahipOz, d);
    };
    const not = dene ? " Denemede depoya yazılmadı." : "";
    switch (islem) {
      case "oku": {
        const bulundu = !!var_;
        const v = bulundu ? var_!.v : x.deger === "" || x.deger === undefined ? null : x.deger;
        return { veri: { deger: v, bulundu, anahtar, guncelleme: var_ ? new Date(var_.t).toISOString() : null }, cikti: bulundu ? ozet(v) : "Anahtar yok; varsayılan değer verildi." };
      }
      case "yaz": await kaydet(x.deger); return { veri: { deger: x.deger, anahtar, yeni: yeniMi }, cikti: `${anahtar} yazıldı.${not}` };
      case "artir": {
        const once = Number(var_?.v ?? 0);
        if (var_ && !Number.isFinite(once)) throw new DepoHatasi(`"${anahtar}" anahtarındaki değer sayı değil; artırılamaz.`);
        const yeni = (Number.isFinite(once) ? once : 0) + (Number.isFinite(x.miktar) ? x.miktar : 1);
        await kaydet(yeni);
        return { veri: { deger: yeni, onceki: var_ ? once : 0, anahtar }, cikti: `${anahtar}: ${yeni}${not}` };
      }
      case "ekle": {
        const l = Array.isArray(var_?.v) ? [...(var_!.v as unknown[])] : var_ ? [var_.v] : [];
        l.push(x.deger);
        const kesilen = l.length > DEPO_SINIR.liste ? l.splice(0, l.length - DEPO_SINIR.liste).length : 0;
        await kaydet(l);
        return { veri: { liste: l.slice(-50), uzunluk: l.length, kesilen, anahtar }, cikti: `Listeye eklendi; ${l.length} öğe.${not}` };
      }
      case "cek": {
        const l = Array.isArray(var_?.v) ? [...(var_!.v as unknown[])] : [];
        if (!l.length) return { veri: { deger: null, bos: true, kalan: 0, anahtar }, cikti: "Liste boş." };
        const v = x.nereden === "son" ? l.pop() : l.shift();
        await kaydet(l);
        return { veri: { deger: v, bos: false, kalan: l.length, anahtar }, cikti: `${ozet(v)} alındı; ${l.length} öğe kaldı.${not}` };
      }
      case "sil": {
        if (var_ && !dene) { delete d[k]; await yaz(sahipOz, d); }
        return { veri: { silindi: !!var_, anahtar }, cikti: var_ ? `${anahtar} silindi.${not}` : "Anahtar zaten yoktu." };
      }
      case "goruldu": {
        const belirtec = (typeof x.deger === "string" ? x.deger : JSON.stringify(x.deger ?? "")).trim().slice(0, 500);
        if (!belirtec) throw new DepoHatasi("Tekrar denetimi için değer yaz (ör. sipariş numarası ya da e-posta) ya da / ile seç.");
        const l = Array.isArray(var_?.v) ? (var_!.v as string[]) : [];
        const goruldu = l.includes(belirtec);
        if (!goruldu) await kaydet([...l, belirtec].slice(-DEPO_SINIR.gorulen));
        const dur = goruldu && x.gorulduyse !== "devam";
        return { veri: { goruldu, yeni: !goruldu, deger: belirtec, kayitli: goruldu ? l.length : Math.min(l.length + 1, DEPO_SINIR.gorulen) }, cikti: goruldu ? (dur ? "Bu değer daha önce görüldü; sistem burada durdu." : "Bu değer daha önce görüldü.") : `İlk kez görüldü; kaydedildi.${not}`, dur };
      }
    }
  });
}

/** Değişkenler panelindeki Depo listesi. */
export async function depoListele(sahipOz: string): Promise<{ anahtar: string; tam: string; kapsam: "sistem" | "hesap"; sistemId?: string; ozet: string; tur: string; boyut: number; guncelleme: number; sonKullanma?: number }[]> {
  const d = temizle(await oku(sahipOz));
  return Object.entries(d).map(([tam, x]) => {
    const anahtar = x.k === "hesap" ? tam.slice(2) : tam.split(":").slice(2).join(":");
    const s = typeof x.v === "string" ? x.v : JSON.stringify(x.v ?? null);
    return { anahtar, tam, kapsam: x.k, sistemId: x.sid, ozet: s.length > 160 ? `${s.slice(0, 160)}…` : s, tur: Array.isArray(x.v) ? `liste, ${x.v.length} öğe` : typeof x.v === "number" ? "sayı" : x.v && typeof x.v === "object" ? "nesne" : "metin", boyut: s.length, guncelleme: x.t, sonKullanma: x.s };
  }).sort((a, b) => b.guncelleme - a.guncelleme).slice(0, 500);
}
export function depoSil(sahipOz: string, tam: string | null): Promise<number> {
  return kilitle(`depo:${sahipOz}`, async () => {
    const d = temizle(await oku(sahipOz));
    let n = 0;
    for (const k of Object.keys(d)) if (tam === null ? false : k === tam) { delete d[k]; n++; }
    await yaz(sahipOz, d);
    return n;
  });
}
/** Sistem silinince o sisteme ayrılmış anahtarlar da silinir. */
export function depoSistemSil(sahipOz: string, sistemId: string): Promise<void> {
  return kilitle(`depo:${sahipOz}`, async () => {
    const d = await oku(sahipOz);
    let degisti = false;
    for (const k of Object.keys(d)) if (k.startsWith(`s:${sistemId}:`)) { delete d[k]; degisti = true; }
    if (degisti) await yaz(sahipOz, d);
  });
}
