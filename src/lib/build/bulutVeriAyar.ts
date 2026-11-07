import "server-only";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import type { Kural, Kurallar } from "./veri";

/**
 * Vayra Bulut veri ayarları (proje başına): yeni tabloların varsayılan erişimi, otomatik günlük yedek ve odaların
 * erişimi. Proje dosyasından ayrı tutulur. Dosya: .veri/build/bulut-veri-ayar/<projeId>.json
 *
 * Yeni tablolar için varsayılan erişim (Bolt 2026-10-30 "private by default" benzeri): bu ayarın geldiği günden sonra
 * açılan projelerde yeni tablolar kapalı açılır (yalnız sahip, önizleme ve sunucu fonksiyonları). Daha önce açılmış
 * projeler eski varsayılanla (okuma ve ekleme herkese açık) sürer, siteleri bozulmaz. Sahip ayardan değiştirebilir.
 */
export type YeniTabloKip = "kapali" | "acik" | "ozel";
export type OdaErisim = "herkes" | "uyeler" | "sunucu";
export type VeriAyar = {
  /** Yoksa projenin açılış tarihine göre belirlenir (yeniTabloKurali). */
  yeniTablo?: { kip: YeniTabloKip; kurallar: Kurallar; zaman: number };
  yedek: { acik: boolean; /** Türkiye saatiyle 0-23. */ saat: number; /** Tutulacak otomatik, elle ve yüklenen yedek sayısı. */ saklama: number; sonZamanli?: number; sonHata?: string };
  /** Odalar: kimin durum değiştirebileceği (sunucu: yalnız sunucu fonksiyonları ve panel), kimin okuyabileceği. */
  oda: { yazma: OdaErisim; okuma: "herkes" | "uyeler" };
};

/** Bu andan sonra açılan projelerde yeni tablolar varsayılan olarak kapalıdır. */
export const YENI_TABLO_KAPALI_BASLANGIC = Date.parse("2026-11-06T00:00:00+03:00");
export const KIP_KURAL: Record<Exclude<YeniTabloKip, "ozel">, Kurallar> = {
  kapali: { okuma: "kapali", ekleme: "kapali", duzenleme: "kapali" },
  acik: { okuma: "herkes", ekleme: "herkes", duzenleme: "kapali" },
};
const KURAL_L: Kural[] = ["herkes", "uyeler", "sahibi", "kapali"];

const KIMLIK = /^[A-Za-z0-9_-]{6,20}$/;
const dosya = (id: string) => path.join(DEPO_KOK, "build", "bulut-veri-ayar", `${id}.json`);
const onbellek = new Map<string, { v: VeriAyar; z: number }>();
const kuyruk = new Map<string, Promise<unknown>>();

function tamamla(h: Partial<VeriAyar> | null): VeriAyar {
  const y = h?.yeniTablo;
  const kurallarTemiz = (k: Partial<Kurallar> | undefined): Kurallar => ({
    okuma: KURAL_L.includes(k?.okuma as Kural) ? k!.okuma! : "kapali",
    ekleme: KURAL_L.includes(k?.ekleme as Kural) ? k!.ekleme! : "kapali",
    duzenleme: KURAL_L.includes(k?.duzenleme as Kural) ? k!.duzenleme! : "kapali",
  });
  return {
    ...(y && (y.kip === "kapali" || y.kip === "acik" || y.kip === "ozel") ? { yeniTablo: { kip: y.kip, kurallar: y.kip === "ozel" ? kurallarTemiz(y.kurallar) : KIP_KURAL[y.kip], zaman: Number(y.zaman) || 0 } } : {}),
    yedek: {
      acik: h?.yedek?.acik !== false,
      saat: Number.isInteger(h?.yedek?.saat) && h!.yedek!.saat >= 0 && h!.yedek!.saat <= 23 ? h!.yedek!.saat : 3,
      saklama: Number.isInteger(h?.yedek?.saklama) && h!.yedek!.saklama >= 1 && h!.yedek!.saklama <= 60 ? h!.yedek!.saklama : 14,
      ...(h?.yedek?.sonZamanli ? { sonZamanli: h.yedek.sonZamanli } : {}),
      ...(h?.yedek?.sonHata ? { sonHata: h.yedek.sonHata } : {}),
    },
    oda: { yazma: h?.oda?.yazma === "uyeler" || h?.oda?.yazma === "sunucu" ? h.oda.yazma : "herkes", okuma: h?.oda?.okuma === "uyeler" ? "uyeler" : "herkes" },
  };
}

export async function veriAyarOku(id: string): Promise<VeriAyar> {
  if (!KIMLIK.test(id)) return tamamla(null);
  const o = onbellek.get(id);
  if (o && Date.now() - o.z < 3000) return o.v;
  let ham: Partial<VeriAyar> | null = null;
  try { ham = JSON.parse(await readFile(dosya(id), "utf8")); } catch { /* yok */ }
  const v = tamamla(ham);
  onbellek.set(id, { v, z: Date.now() });
  return v;
}

export async function veriAyarDegistir<T>(id: string, f: (a: VeriAyar) => T | Promise<T>): Promise<T> {
  if (!KIMLIK.test(id)) throw new Error("Proje kimliği geçersiz.");
  const onceki = kuyruk.get(id) ?? Promise.resolve();
  let s!: T;
  const is = onceki.then(async () => {
    let ham: Partial<VeriAyar> | null = null;
    try { ham = JSON.parse(await readFile(dosya(id), "utf8")); } catch { /* yok */ }
    const a = tamamla(ham);
    s = await f(a);
    const t = tamamla(a);
    await mkdir(path.dirname(dosya(id)), { recursive: true });
    await writeFile(dosya(id), JSON.stringify(t));
    onbellek.set(id, { v: t, z: Date.now() });
  });
  kuyruk.set(id, is.catch(() => {}));
  await is;
  return s;
}

/** Projenin yeni tablo varsayılanı: ayar varsa o, yoksa açılış tarihine göre kapalı ya da açık. */
export async function yeniTabloDurumu(id: string): Promise<{ kip: YeniTabloKip; kurallar: Kurallar; kaynak: "ayar" | "yeniProje" | "eskiProje" }> {
  const a = await veriAyarOku(id);
  if (a.yeniTablo) return { kip: a.yeniTablo.kip, kurallar: { ...a.yeniTablo.kurallar }, kaynak: "ayar" };
  const { projeOkuHam } = await import("./depo");
  const p = await projeOkuHam(id).catch(() => null);
  const yeni = !!p && p.olusturma >= YENI_TABLO_KAPALI_BASLANGIC;
  return { kip: yeni ? "kapali" : "acik", kurallar: { ...KIP_KURAL[yeni ? "kapali" : "acik"] }, kaynak: yeni ? "yeniProje" : "eskiProje" };
}
/** Yeni açılan tabloya verilecek kurallar (kopya). */
export async function yeniTabloKurali(id: string): Promise<Kurallar> { return (await yeniTabloDurumu(id)).kurallar; }
