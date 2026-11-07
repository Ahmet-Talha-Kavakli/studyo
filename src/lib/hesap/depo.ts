import "server-only";
import { createHash, randomBytes } from "crypto";
import { readFileSync } from "fs";
import { appendFile, mkdir, readdir, readFile, rename, rm, stat, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import type { CihazTuru, GuvenlikOlayTuru, PlanKimligi, ProfilVerisi, Rol, SaglayiciKimligi } from "./tipler";

/**
 * Hesap deposu (.veri/hesap/…). Her şey dosya; her kullanıcının yazımı tek sırada (kilitle).
 *  kullanici/<uid>.json     hesap kaydı (şifre özeti, iki adım sırrı şifreli, oturum listesi, olaylar, profil)
 *  eposta/<özet>.json       e-posta → uid dizini (e-postanın kendisi dosya adında görünmez)
 *  kadi/<ad>.json           kullanıcı adı → uid
 *  saglayici/<özet>.json    Google/Apple/Microsoft hesabı → uid
 *  oturum/<özet>.json       oturum belirtecinin SHA-256 özeti → { uid, id, bitis }. Belirtecin kendisi saklanmaz.
 *  belirtec/<özet>.json     tek kullanımlık bağlantılar (doğrulama, sıfırlama, iki adım bekleyen, OAuth durumu)
 *  kredi/<uid>.json         kredi defteri durumu;  kredi/<uid>.jsonl  yalnız sona eklenen hareketler
 *  build/<özet>.json        Build sahip anahtarı özeti → uid (bir anahtar tek hesaba bağlanır)
 *  medya/<uid>/…            avatar ve kapak görselleri
 */
export const HESAP_KOK = path.join(DEPO_KOK, "hesap");
export const D = {
  kullanici: path.join(HESAP_KOK, "kullanici"),
  eposta: path.join(HESAP_KOK, "eposta"),
  kadi: path.join(HESAP_KOK, "kadi"),
  saglayici: path.join(HESAP_KOK, "saglayici"),
  oturum: path.join(HESAP_KOK, "oturum"),
  belirtec: path.join(HESAP_KOK, "belirtec"),
  kredi: path.join(HESAP_KOK, "kredi"),
  build: path.join(HESAP_KOK, "build"),
  medya: path.join(HESAP_KOK, "medya"),
};

export const ozet = (s: string) => createHash("sha256").update(s).digest("hex");
export const epostaNormal = (e: string) => e.normalize("NFC").trim().toLowerCase();
export const EPOSTA_DESENI = /^[^\s@<>()",;:]{1,64}@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;
export const UID_DESENI = /^u_[A-Za-z0-9_-]{16}$/;
export const yeniUid = () => `u_${randomBytes(12).toString("base64url")}`;
export const yeniKimlik = (on: string) => `${on}_${randomBytes(9).toString("base64url")}`;

/* ── Kayıt tipleri ── */

export interface OturumKaydi {
  id: string;
  /** Belirtecin SHA-256 özeti (dizin dosyasının adı). */
  ozet: string;
  olusturma: number;
  sonGorulme: number;
  bitis: number;
  tarayici: string;
  isletim: string;
  tur: CihazTuru;
  ip: string;
  yontem: string;
}

export interface OlayKaydi { id: string; zaman: number; tur: GuvenlikOlayTuru; cihaz: string; ayrinti?: string; ip?: string }

export interface HesapKaydi {
  uid: string;
  email: string;
  olusturma: number;
  guncelleme: number;
  rol: Rol;
  epostaDogrulandi: boolean;
  /** scrypt özeti: "s1$N$r$p$tuz$özet". */
  sifre?: { ozet: string; guncelleme: number };
  /** TOTP: sır kasa ile şifreli; yedek kodların yalnız özeti tutulur. */
  ikiAdim?: { sir: string; acilis: number; sonAdim: number; yedekler: { ozet: string; kullanildi: number | null }[] };
  ikiAdimKurulum?: { sir: string; bitis: number };
  saglayicilar: { tur: SaglayiciKimligi; kimlik: string; email?: string; baglanma: number }[];
  profil: ProfilVerisi;
  plan: PlanKimligi;
  oturumlar: OturumKaydi[];
  olaylar: OlayKaydi[];
  bekleyenEposta?: string;
  /** Güvenlik tercihleri: yeni cihazdan girişte e-posta (varsayılan açık). */
  tercih?: { yeniGirisEposta?: boolean };
  /** Vayra Build sahip anahtarı (kasa ile şifreli). eskiler: hesaba bağlanırken görülen diğer cihaz anahtarları. */
  build?: { anahtar: string; baglanma: number; eskiler?: string[] };
  /** Yönetici askıya aldıysa: oturum açılmaz, açık oturumlar geçersiz sayılır. */
  askida?: { zaman: number; neden: string; admin: string };
}

/* ── Dosya yardımcıları ── */

export async function jsonOku<T>(dosya: string): Promise<T | null> {
  for (let i = 0; i < 3; i++) {
    try { return JSON.parse(await readFile(dosya, "utf8")) as T; } catch (e) {
      const kod = (e as NodeJS.ErrnoException).code;
      if (kod === "ENOENT") return null;
      // Windows'ta yeniden adlandırma anında okuma kısa süre EPERM/EBUSY verebilir; yarım JSON görülmez ama bir kez daha dene.
      if (i === 2) return null;
      await new Promise((r) => setTimeout(r, 20 * (i + 1)));
    }
  }
  return null;
}

export function jsonOkuSync<T>(dosya: string): T | null {
  try { return JSON.parse(readFileSync(dosya, "utf8")) as T; } catch { return null; }
}

/** Atomik yazım: geçici dosyaya yaz, yerine taşı. Okuyan ya eskiyi ya yeniyi görür. */
export async function jsonYaz(dosya: string, veri: unknown) {
  await mkdir(path.dirname(dosya), { recursive: true });
  const gecici = `${dosya}.${randomBytes(5).toString("hex")}.tmp`;
  await writeFile(gecici, JSON.stringify(veri), { mode: 0o600 });
  for (let i = 0; ; i++) {
    try { await rename(gecici, dosya); return; } catch (e) {
      const kod = (e as NodeJS.ErrnoException).code;
      if (i >= 6 || (kod !== "EPERM" && kod !== "EBUSY" && kod !== "EACCES")) { await rm(gecici, { force: true }); throw e; }
      await new Promise((r) => setTimeout(r, 15 * (i + 1)));
    }
  }
}

export async function satirEkle(dosya: string, veri: unknown) {
  await mkdir(path.dirname(dosya), { recursive: true });
  await appendFile(dosya, `${JSON.stringify(veri)}\n`, { mode: 0o600 });
}

export const sil = (dosya: string) => rm(dosya, { force: true, recursive: true });
export async function varMi(dosya: string) { try { await stat(dosya); return true; } catch { return false; } }
export async function dizinListe(dizin: string) { try { return await readdir(dizin); } catch { return []; } }

/* ── Kilit: aynı anahtardaki işler sırayla çalışır (süreç içi; HMR'da globalThis'te kalır) ── */

const G = globalThis as unknown as { __vayraHesapKilit?: Map<string, Promise<unknown>> };
const KILITLER = (G.__vayraHesapKilit ??= new Map());

export async function kilitle<T>(anahtar: string, is: () => Promise<T>): Promise<T> {
  const onceki = KILITLER.get(anahtar) ?? Promise.resolve();
  let birak!: () => void;
  const bu = new Promise<void>((r) => { birak = r; });
  const zincir = onceki.then(() => bu, () => bu);
  KILITLER.set(anahtar, zincir);
  try {
    await onceki.catch(() => {});
    return await is();
  } finally {
    birak();
    if (KILITLER.get(anahtar) === zincir) KILITLER.delete(anahtar);
  }
}

/* ── Hesap kaydı ── */

const kullaniciDosyasi = (uid: string) => path.join(D.kullanici, `${uid}.json`);
const epostaDosyasi = (email: string) => path.join(D.eposta, `${ozet(`eposta:${epostaNormal(email)}`)}.json`);
const kadiDosyasi = (ad: string) => path.join(D.kadi, `${ozet(`kadi:${ad.toLowerCase()}`)}.json`);
const saglayiciDosyasi = (tur: SaglayiciKimligi, kimlik: string) => path.join(D.saglayici, `${ozet(`${tur}:${kimlik}`)}.json`);

export async function hesapOku(uid: string): Promise<HesapKaydi | null> {
  if (!UID_DESENI.test(uid)) return null;
  return jsonOku<HesapKaydi>(kullaniciDosyasi(uid));
}
export function hesapOkuSync(uid: string): HesapKaydi | null {
  if (!UID_DESENI.test(uid)) return null;
  return jsonOkuSync<HesapKaydi>(kullaniciDosyasi(uid));
}
export async function hesapYazHam(h: HesapKaydi) {
  h.guncelleme = Date.now();
  await jsonYaz(kullaniciDosyasi(h.uid), h);
}

/**
 * Hesabı kilit altında okur, değiştirir, yazar. f null dönerse yazım yapılmaz.
 * Hesap yoksa null döner.
 */
export async function hesapGuncelle<T = void>(uid: string, f: (h: HesapKaydi) => T | Promise<T>): Promise<{ hesap: HesapKaydi; sonuc: T } | null> {
  return kilitle(`hesap:${uid}`, async () => {
    const h = await hesapOku(uid);
    if (!h) return null;
    const sonuc = await f(h);
    await hesapYazHam(h);
    return { hesap: h, sonuc };
  });
}

export async function hesapSilHam(uid: string) { await sil(kullaniciDosyasi(uid)); }

export async function epostadanUid(email: string): Promise<string | null> {
  const v = await jsonOku<{ uid: string }>(epostaDosyasi(email));
  return v?.uid ?? null;
}
export async function epostaIndeksYaz(email: string, uid: string) { await jsonYaz(epostaDosyasi(email), { uid }); }
export async function epostaIndeksSil(email: string) { await sil(epostaDosyasi(email)); }
export const epostaKilidi = (email: string) => `eposta:${ozet(epostaNormal(email))}`;

export async function kadiUid(ad: string): Promise<string | null> { return (await jsonOku<{ uid: string }>(kadiDosyasi(ad)))?.uid ?? null; }
export async function kadiYaz(ad: string, uid: string) { await jsonYaz(kadiDosyasi(ad), { uid }); }
export async function kadiSil(ad: string) { await sil(kadiDosyasi(ad)); }

export async function saglayiciUid(tur: SaglayiciKimligi, kimlik: string): Promise<string | null> {
  return (await jsonOku<{ uid: string }>(saglayiciDosyasi(tur, kimlik)))?.uid ?? null;
}
export async function saglayiciYaz(tur: SaglayiciKimligi, kimlik: string, uid: string) { await jsonYaz(saglayiciDosyasi(tur, kimlik), { uid }); }
export async function saglayiciSil(tur: SaglayiciKimligi, kimlik: string) { await sil(saglayiciDosyasi(tur, kimlik)); }

/** Hesabın güvenlik olay günlüğü (en yeni başta, en çok 200). Çağıran hesapGuncelle içindedir. */
export function olayEkle(h: HesapKaydi, tur: GuvenlikOlayTuru, cihaz: string, ayrinti?: string, ip?: string) {
  h.olaylar = [{ id: yeniKimlik("ev"), zaman: Date.now(), tur, cihaz, ...(ayrinti ? { ayrinti } : {}), ...(ip ? { ip } : {}) }, ...(h.olaylar ?? [])].slice(0, 200);
}

/** Süresi dolmuş tek kullanımlık belirteçleri ara sıra temizler (saatte en çok bir kez). */
const T = globalThis as unknown as { __vayraBelirtecTemizlik?: number };
export async function eskiBelirtecleriTemizle() {
  if ((T.__vayraBelirtecTemizlik ?? 0) > Date.now() - 3_600_000) return;
  T.__vayraBelirtecTemizlik = Date.now();
  for (const ad of await dizinListe(D.belirtec)) {
    const v = await jsonOku<{ bitis?: number }>(path.join(D.belirtec, ad));
    if (!v || (v.bitis ?? 0) < Date.now()) await sil(path.join(D.belirtec, ad));
  }
  for (const ad of await dizinListe(D.oturum)) {
    const v = await jsonOku<{ bitis?: number }>(path.join(D.oturum, ad));
    if (!v || (v.bitis ?? 0) < Date.now()) await sil(path.join(D.oturum, ad));
  }
}
