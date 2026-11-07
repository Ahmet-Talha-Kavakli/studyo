import "server-only";
import { readdir } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { jsonOku, jsonYaz, kilitle } from "@/lib/hesap/depo";

/**
 * Destek talepleri: iletişim formundan gelen her mesaj .veri/destek/<referans>.json olarak saklanır.
 * Yönetim panelinde durum, iç not ve e-postayla yanıt bu kayda eklenir.
 */
export const DESTEK_KOK = path.join(DEPO_KOK, "destek");
export type TalepDurum = "acik" | "yanitlandi" | "kapandi";

export interface DestekTalebi {
  referans: string;
  ad: string;
  email: string;
  konu: string;
  mesaj: string;
  detay: Record<string, string>;
  ekler: { ad: string; boyut: number; tur: string }[];
  zaman: number;
  durum: TalepDurum;
  guncelleme: number;
  uid?: string;
  notlar: { zaman: number; admin: string; metin: string }[];
  yanitlar: { zaman: number; admin: string; metin: string; gonderildi: boolean; hata?: string }[];
}

const REF = /^VYR-T-[0-9A-F]{6}$/;
const dosya = (r: string) => path.join(DESTEK_KOK, `${r}.json`);

export async function talepKaydet(t: Omit<DestekTalebi, "durum" | "guncelleme" | "notlar" | "yanitlar">) {
  await jsonYaz(dosya(t.referans), { ...t, durum: "acik", guncelleme: t.zaman, notlar: [], yanitlar: [] } satisfies DestekTalebi);
}

export async function talepOku(r: string): Promise<DestekTalebi | null> {
  return REF.test(r) ? jsonOku<DestekTalebi>(dosya(r)) : null;
}

export async function talepler(): Promise<DestekTalebi[]> {
  let adlar: string[] = [];
  try { adlar = await readdir(DESTEK_KOK); } catch { return []; }
  const l = await Promise.all(adlar.filter((a) => /^VYR-T-[0-9A-F]{6}\.json$/.test(a)).map((a) => jsonOku<DestekTalebi>(path.join(DESTEK_KOK, a))));
  return l.filter((x): x is DestekTalebi => !!x).sort((a, b) => b.zaman - a.zaman);
}

export async function talepGuncelle(r: string, f: (t: DestekTalebi) => void): Promise<DestekTalebi | null> {
  if (!REF.test(r)) return null;
  return kilitle(`destek:${r}`, async () => {
    const t = await jsonOku<DestekTalebi>(dosya(r));
    if (!t) return null;
    f(t);
    t.guncelleme = Date.now();
    await jsonYaz(dosya(r), t);
    return t;
  });
}
