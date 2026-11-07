import "server-only";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import type { CalismaDurum, Kanal } from "./ajanKatalog";
import type { Kaynakca } from "./ziyaretciDepo";

/**
 * Ajan çalışma geçmişi: her çalışma (deneme sohbeti, paylaşım sayfası, web kutusu, API, zamanlama, webhook, Telegram,
 * WhatsApp, ekip görevi, test seti) kanalı, sürümü, adım adım izi (model turları, araç çağrılarının girdisi, çıktısı
 * ve süresi, bilgi araması, koruma, devir), token ve kredi kullanımıyla kaydedilir.
 * Onay bekleyen gözetimsiz çalışmalar devam için gereken geçmişi de saklar (görevler kutusundan onaylanınca sürer).
 * Dosyalar: .veri/build/ajan-calisma/<ajanId>/dizin.json (özetler, yeniden eskiye), <ajanId>/<calismaId>.json (tam iz)
 */
export type AdimTur = "model" | "arac" | "ekip" | "bilgi" | "koruma" | "devir" | "kanal" | "filtre" | "bellek" | "prosedur";
export type Adim = {
  tur: AdimTur; ad: string; baslik: string;
  durum: "bitti" | "hata" | "onay" | "reddedildi" | "suruyor" | "atlandi";
  baslangic: number; sure: number;
  girdi?: string; cikti?: string; hata?: string; kredi?: number;
  /** Ekip adımında alt ajanın çalışması. */
  altCalisma?: { ajanId: string; id: string; ad: string };
  /** Araç çağrısı kimliği (onay eşleşmesi). */
  cagri?: string;
};
export type Kullanim = { girdi: number; cikti: number; onbellek: number; yazilan: number };
export type Calisma = {
  id: string; ajanId: string; kanal: Kanal; surum: number | null; model: string;
  durum: CalismaDurum; baslangic: number; bitis?: number; sure: number;
  girdi: string; cikti: string; hata?: string;
  adimlar: Adim[]; kullanim: Kullanim; kredi: number;
  kaynaklar?: Kaynakca[];
  /** Ziyaretçi konuşması (dosya kimliği) ya da deneme sohbeti. */
  konusma?: string;
  tetik?: { id: string; ad: string };
  ust?: { ajanId: string; id: string };
  /** Onay bekleyen gözetimsiz çalışmanın devam durumu. */
  bekleme?: { cagrilar: { id: string; name: string; input: unknown }[]; gecmis: unknown[]; parcalar: unknown[]; aciklama: { ad: string; girdi: Record<string, string> }[] };
  goruldu?: boolean;
};
export type CalismaOzet = Pick<Calisma, "id" | "kanal" | "surum" | "model" | "durum" | "baslangic" | "sure" | "kredi" | "konusma" | "tetik" | "ust" | "goruldu" | "hata"> & {
  girdi: string; cikti: string; araclar: { ad: string; hata: boolean; sure: number }[]; token: number; bekleyen?: string[];
};

const KOK = path.join(DEPO_KOK, "build", "ajan-calisma");
const dizinDosyasi = (ajanId: string) => path.join(KOK, ajanId, "dizin.json");
const calismaDosyasi = (ajanId: string, id: string) => path.join(KOK, ajanId, `${id}.json`);
const KIMLIK = /^[A-Za-z0-9_-]{6,16}$/;
const SINIR = 2000;

async function oku<T>(f: string): Promise<T | null> { try { return JSON.parse(await readFile(f, "utf8")) as T; } catch { return null; } }
async function yaz(f: string, v: unknown) { await mkdir(path.dirname(f), { recursive: true }); await writeFile(f, JSON.stringify(v)); }

const kilitler = new Map<string, Promise<unknown>>();
function kilitle<T>(k: string, f: () => Promise<T>): Promise<T> {
  const once = kilitler.get(k) ?? Promise.resolve();
  const p = once.catch(() => {}).then(f);
  kilitler.set(k, p);
  p.finally(() => { if (kilitler.get(k) === p) kilitler.delete(k); }).catch(() => {});
  return p;
}

export function ozetCikar(c: Calisma): CalismaOzet {
  return {
    id: c.id, kanal: c.kanal, surum: c.surum, model: c.model, durum: c.durum, baslangic: c.baslangic, sure: c.sure, kredi: c.kredi, konusma: c.konusma,
    tetik: c.tetik, ust: c.ust, goruldu: c.goruldu, hata: c.hata?.slice(0, 200),
    girdi: c.girdi.replace(/\s+/g, " ").slice(0, 160), cikti: c.cikti.replace(/\s+/g, " ").slice(0, 240),
    araclar: c.adimlar.filter((a) => a.tur === "arac" || a.tur === "ekip").map((a) => ({ ad: a.ad, hata: a.durum === "hata", sure: a.sure })),
    token: c.kullanim.girdi + c.kullanim.cikti,
    bekleyen: c.bekleme ? c.bekleme.aciklama.map((x) => x.ad) : undefined,
  };
}

/** Çalışmayı yazar (oluşturur ya da günceller) ve dizindeki özetini yeniler. */
export function calismaKaydet(c: Calisma): Promise<void> {
  return kilitle(c.ajanId, async () => {
    await yaz(calismaDosyasi(c.ajanId, c.id), c);
    const d = (await oku<CalismaOzet[]>(dizinDosyasi(c.ajanId))) ?? [];
    const o = ozetCikar(c);
    const i = d.findIndex((x) => x.id === c.id);
    if (i >= 0) d[i] = o; else d.unshift(o);
    const kesilen = d.splice(SINIR);
    await yaz(dizinDosyasi(c.ajanId), d);
    for (const x of kesilen) await rm(calismaDosyasi(c.ajanId, x.id), { force: true }).catch(() => {});
  });
}
export async function calismaGetir(ajanId: string, id: string): Promise<Calisma | null> {
  if (!KIMLIK.test(id)) return null;
  return oku<Calisma>(calismaDosyasi(ajanId, id));
}
/** Kilit altında oku-değiştir-yaz (onay devamı, görüldü işareti). f metin döndürürse yazılmaz. */
export function calismaGuncelle(ajanId: string, id: string, f: (c: Calisma) => void | string): Promise<Calisma | string | null> {
  return kilitle(ajanId, async () => {
    const c = await calismaGetir(ajanId, id);
    if (!c) return null;
    const h = f(c);
    if (typeof h === "string") return h;
    await yaz(calismaDosyasi(ajanId, id), c);
    const d = (await oku<CalismaOzet[]>(dizinDosyasi(ajanId))) ?? [];
    const i = d.findIndex((x) => x.id === id);
    if (i >= 0) { d[i] = ozetCikar(c); await yaz(dizinDosyasi(ajanId), d); }
    return c;
  });
}
export async function calismalariListele(ajanId: string): Promise<CalismaOzet[]> {
  return (await oku<CalismaOzet[]>(dizinDosyasi(ajanId))) ?? [];
}
export async function calismalariSil(ajanId: string) {
  await rm(path.join(KOK, ajanId), { recursive: true, force: true });
}

export type CalismaSuzgec = { kanal?: string; durum?: string; ara?: string; gun?: number; tetik?: string };
export function suz(l: CalismaOzet[], s: CalismaSuzgec): CalismaOzet[] {
  const q = s.ara?.trim().toLocaleLowerCase("tr");
  const bas = s.gun ? Date.now() - s.gun * 86_400_000 : 0;
  return l.filter((c) => (!s.kanal || c.kanal === s.kanal) && (!s.durum || c.durum === s.durum) && (!s.tetik || c.tetik?.id === s.tetik) && c.baslangic >= bas
    && (!q || c.girdi.toLocaleLowerCase("tr").includes(q) || c.cikti.toLocaleLowerCase("tr").includes(q) || c.araclar.some((a) => a.ad.toLocaleLowerCase("tr").includes(q))));
}

/** Kısaltılmış metin (iz kaydı için). */
export function kisalt(v: unknown, n = 4000): string {
  const s = typeof v === "string" ? v : (() => { try { return JSON.stringify(v, null, 2); } catch { return String(v); } })();
  return s.length > n ? `${s.slice(0, n)}\n… (${(s.length - n).toLocaleString("tr-TR")} karakter daha)` : s;
}
