import "server-only";
import { createHash, randomBytes } from "crypto";
import { mkdir, readFile, rename, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import type { EkipRol } from "./tipler";

/**
 * Ekip deposu (proje dosyasından ayrı, yarış olmasın diye):
 *  ekip/<projeId>.json     { sahipAd, uyeler, davetler }
 *  ekip-uye/<oz>.json      üyenin katıldığı proje kimlikleri
 * Her dosyaya yazım anahtar başına sıraya alınır; dosya geçici adla yazılıp yeniden adlandırılır.
 * Bu modül depo.ts'e bağlı değildir (depo.ts yetki denetimi için bunu kullanır).
 */
const KOK = path.join(DEPO_KOK, "build");
const D = { ekip: path.join(KOK, "ekip"), uye: path.join(KOK, "ekip-uye") };
const KIMLIK = /^[A-Za-z0-9_-]{12}$/;
const OZ = /^[a-f0-9]{40}$/;

export type EkipUye = { oz: string; ad: string; rol: EkipRol; eklenme: number; davetEden?: string };
export type EkipDavet = { kod: string; rol: EkipRol; olusturma: number; sonKullanma: number; tekKullanim?: boolean; kullanildi?: boolean; kullanim?: number };
export type EkipKaydi = { sahipAd?: string; uyeler: EkipUye[]; davetler: EkipDavet[] };

export const UYE_SINIRI = 50;
export const DAVET_SINIRI = 20;

/** Kişinin istemciye giden genel kimliği (sahip özetinin özeti; geri çevrilemez). */
export const genelKimlik = (oz: string) => createHash("sha256").update(`vayra-ekip:${oz}`).digest("hex").slice(0, 16);

/** Yetki hatası: rotalar 403'e çevirir. */
export class YetkiHatasi extends Error {
  durum = 403;
}

const G = globalThis as unknown as { __vayraEkipKilit?: Map<string, Promise<unknown>> };
const kilitler = (G.__vayraEkipKilit ??= new Map());
function sirala<T>(anahtar: string, f: () => Promise<T>): Promise<T> {
  const is = (kilitler.get(anahtar) ?? Promise.resolve()).catch(() => {}).then(f);
  const bekle = is.catch(() => {});
  kilitler.set(anahtar, bekle);
  bekle.finally(() => { if (kilitler.get(anahtar) === bekle) kilitler.delete(anahtar); });
  return is;
}

async function yazAtomik(dosya: string, veri: unknown) {
  await mkdir(path.dirname(dosya), { recursive: true });
  const ham = JSON.stringify(veri);
  const gecici = `${dosya}.${process.pid}.${Date.now()}.${randomBytes(3).toString("hex")}.tmp`;
  await writeFile(gecici, ham);
  // Windows'ta okuyan biri dosyayı tutuyorsa yeniden adlandırma reddedilebilir: doğrudan yaz.
  try { await rename(gecici, dosya); } catch { await writeFile(dosya, ham); await rm(gecici, { force: true }); }
}

const ekipDosya = (id: string) => path.join(D.ekip, `${id}.json`);
const uyeDosya = (oz: string) => path.join(D.uye, `${oz}.json`);
const bos = (): EkipKaydi => ({ uyeler: [], davetler: [] });

export async function ekipOku(projeId: string): Promise<EkipKaydi> {
  if (!KIMLIK.test(projeId)) return bos();
  try {
    const v = JSON.parse(await readFile(ekipDosya(projeId), "utf8")) as Partial<EkipKaydi>;
    return { sahipAd: v.sahipAd, uyeler: Array.isArray(v.uyeler) ? v.uyeler : [], davetler: Array.isArray(v.davetler) ? v.davetler : [] };
  } catch { return bos(); }
}

/** Oku, değiştir, yaz (proje başına sıralı). f hata atarsa dosyaya dokunulmaz. Süresi 30 günden eski dolan davetler atılır. */
export function ekipGuncelle<T>(projeId: string, f: (e: EkipKaydi) => T | Promise<T>): Promise<T> {
  if (!KIMLIK.test(projeId)) return Promise.reject(new Error("Geçersiz proje."));
  return sirala(`ekip:${projeId}`, async () => {
    const e = await ekipOku(projeId);
    const sonuc = await f(e);
    const esik = Date.now() - 30 * 86_400_000;
    e.davetler = e.davetler.filter((d) => d.sonKullanma > esik);
    await yazAtomik(ekipDosya(projeId), e);
    return sonuc;
  });
}

/** Kişinin bu projedeki ekip rolü (sahip değil; sahip denetimi depo.ts'te). */
export async function ekipRolu(projeId: string, oz: string): Promise<EkipRol | null> {
  if (!OZ.test(oz)) return null;
  const rol = (await ekipOku(projeId)).uyeler.find((u) => u.oz === oz)?.rol ?? null;
  if (rol) return rol;
  // Çalışma alanı bağı: alana bağlı projede alan üyesi düzenleyici, alan izleyicisi izleyici (lib/alan/build).
  return import("@/lib/alan/build").then((m) => m.alanProjeRolu(projeId, oz)).catch(() => null);
}

/* ── Üye dizini ── */
export async function uyeProjeleri(oz: string): Promise<string[]> {
  if (!OZ.test(oz)) return [];
  try { const v = JSON.parse(await readFile(uyeDosya(oz), "utf8")); return Array.isArray(v) ? v.filter((x) => typeof x === "string" && KIMLIK.test(x)) : []; } catch { return []; }
}
export function uyeDizinineEkle(oz: string, projeId: string) {
  if (!OZ.test(oz) || !KIMLIK.test(projeId)) return Promise.resolve();
  return sirala(`uye:${oz}`, async () => {
    const l = await uyeProjeleri(oz);
    await yazAtomik(uyeDosya(oz), [projeId, ...l.filter((x) => x !== projeId)]);
  });
}
export function uyeDizinindenCikar(oz: string, projeId: string) {
  if (!OZ.test(oz)) return Promise.resolve();
  return sirala(`uye:${oz}`, async () => {
    const l = await uyeProjeleri(oz);
    if (!l.includes(projeId)) return;
    const kalan = l.filter((x) => x !== projeId);
    if (kalan.length) await yazAtomik(uyeDosya(oz), kalan);
    else await rm(uyeDosya(oz), { force: true });
  });
}

/** Proje silinince: ekip dosyası ve her üyenin dizinindeki kayıt. */
export function ekipSil(projeId: string) {
  if (!KIMLIK.test(projeId)) return Promise.resolve();
  return sirala(`ekip:${projeId}`, async () => {
    const e = await ekipOku(projeId);
    for (const u of e.uyeler) await uyeDizinindenCikar(u.oz, projeId).catch(() => {});
    await rm(ekipDosya(projeId), { force: true });
  });
}

/** Davet kodu: proje kimliği (12) + 24 karakter rastgele. Kimliği koddan okuruz; ayrı dizin gerekmez. */
export const davetKoduUret = (projeId: string) => `${projeId}${randomBytes(18).toString("base64url")}`;
export function davetKodundanProje(kod: string): string | null {
  return /^[A-Za-z0-9_-]{36}$/.test(kod) ? kod.slice(0, 12) : null;
}
