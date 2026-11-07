import "server-only";
import { createHash, randomBytes, randomInt, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { promisify } from "util";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { coz, sifrele } from "./sifre";
import { epostaAyarTemizle, sablonTamamla, type EpostaAyar, type EpostaTur } from "./epostaSablon";
import { otpauthUri, secretUret, totpKod } from "@/lib/admin/guvenlik/totp";

/**
 * Vayra Üyelik: Build projelerinin kendi kullanıcı hesapları (site/uygulama ziyaretçileri için kayıt ve giriş).
 * Şifre scrypt + tuzla özetlenir, düz tutulmaz. Oturum: rastgele belirteç (varsayılan 30 gün, ayarlanabilir).
 * Sahip yönetimi: üye ekleme, süreli yasak, oturum kapatma, şifre sıfırlama bağlantısı; ayarlar: kayıtları kapatma,
 * en kısa şifre, dönüş adresi izin listesi, oturum süresi, Google ile giriş (sahibin kendi OAuth istemcisi; gizli
 * anahtar sifre.ts ile şifreli). Dosya: .veri/build/uye/<projeId>.json (eski kayıtlar okurken tamamlanır).
 */
const scrypt = promisify(scryptCb) as (s: string, t: Buffer, n: number) => Promise<Buffer>;

export type Saglayici = "eposta" | "google" | "baglanti" | "github" | "microsoft" | "apple" | "sms" | "kod" | "anonim";
/** Sahibin kendi istemcisiyle çalışan ek OAuth sağlayıcıları (Google ayrı tutulur). */
export type OauthSaglayici = "github" | "microsoft" | "apple";
export const OAUTH_SAGLAYICILAR: OauthSaglayici[] = ["github", "microsoft", "apple"];
type OauthAyar = { acik: boolean; istemciId: string; sirSifreli: string; takimId?: string; anahtarId?: string };
/** SMS ile kod (Netgsm): sahibin hesabı; şifre şifreli. deneme: SMS gönderilmeyen sabit kodlu deneme numaraları. */
type SmsAyar = { acik: boolean; kullanici: string; sifreSifreli: string; baslik: string; sablon: string; deneme: { telefon: string; kod: string }[] };
export type Uye = {
  id: string; eposta: string; ad: string; tuz: string; ozet: string; olusturma: number; sonGiris: number;
  /** Yasak bitişi (ms). Yoksa yasak yok; Number.MAX_SAFE_INTEGER süresiz. */ yasakBitis?: number;
  saglayicilar?: Saglayici[]; googleId?: string; gorsel?: string;
  /** E-posta adresi doğrulandı mı (Google ya da doğrulama bağlantısı). */ dogrulandi?: boolean;
  /** Şifre sıfırlama belirtecinin özeti. */ sifirlama?: { ozet: string; bitis: number };
  girisSayisi?: number; ekleyen?: "sahip";
  oauthId?: Partial<Record<OauthSaglayici, string>>; telefon?: string;
  /** İki adımlı doğrulama (TOTP): gizli anahtar şifreli, kurtarma kodlarının özetleri, son kullanılan zaman adımı. */
  ikiAdim?: { gizliSifreli: string; kurtarma: string[]; kurulum: number; sonAdim?: number };
  ikiAdimBekleyen?: { gizliSifreli: string; bitis: number };
};
export type KimlikAyar = {
  kayitKapali: boolean; minSifre: number; yonlendirmeler: string[]; oturumGun: number;
  epostaDogrulama: boolean; sihirliBaglanti: boolean;
  google?: { acik: boolean; istemciId: string; sirSifreli: string };
  /** Üyelere giden e-postaların şablonları ve markası (doğrulama, giriş bağlantısı, şifre sıfırlama). */
  eposta?: EpostaAyar;
  oauth?: Partial<Record<OauthSaglayici, OauthAyar>>;
  sms?: SmsAyar;
  /** E-postayla 6 haneli kodla giriş (e-posta servisi gerekir). */ epostaKod?: boolean;
  /** Anonim (misafir) giriş; misafir sonra kayıt olunca hesabı korunur. */ anonim?: boolean;
  /** Üyeler iki adımlı doğrulamayı (TOTP) açabilir. */ ikiAdim?: boolean;
};
type Oturum = { uyeId: string; bitis: number; olusturma?: number; saglayici?: Saglayici };
type Depo = {
  uyeler: Uye[]; oturumlar: Record<string, Oturum>; ayarlar?: Partial<KimlikAyar>;
  /** OAuth durumları (10 dk). */ oauth?: Record<string, { dogrulayici: string; donus: string; bitis: number }>;
  /** Sihirli bağlantı ve doğrulama belirteçleri (özet → kayıt). */ belirtecler?: Record<string, { tur: "baglanti" | "dogrula"; eposta: string; donus?: string; bitis: number }>;
  /** İkinci adım bekleyen girişler (özet → kayıt, 5 dk). */ mfa?: Record<string, { uyeId: string; saglayici: Saglayici; bitis: number; deneme: number }>;
  /** Tek kullanımlık giriş kodları (SMS ve e-posta; anahtar kanal:hedef özeti). */ kodlar?: Record<string, { ozet: string; bitis: number; deneme: number; gonderim: number[] }>;
};
export type AcikUye = { id: string; eposta: string; ad: string; olusturma: number; sonGiris: number; yasakBitis?: number; saglayicilar?: Saglayici[]; dogrulandi?: boolean; gorsel?: string; girisSayisi?: number; ekleyen?: "sahip"; telefon?: string; ikiAdim?: boolean };

const dosya = (id: string) => path.join(DEPO_KOK, "build", "uye", `${id}.json`);
const kuyruk = new Map<string, Promise<unknown>>();
const VARSAYILAN: KimlikAyar = { kayitKapali: false, minSifre: 8, yonlendirmeler: [], oturumGun: 30, epostaDogrulama: false, sihirliBaglanti: false };
const ozetle = (s: string) => createHash("sha256").update(s).digest("base64url");
export const SURESIZ = Number.MAX_SAFE_INTEGER;

async function oku(id: string): Promise<Depo> { try { return JSON.parse(await readFile(dosya(id), "utf8")); } catch { return { uyeler: [], oturumlar: {} }; } }
async function degistir<T>(id: string, f: (d: Depo) => T | Promise<T>): Promise<T> {
  const onceki = kuyruk.get(id) ?? Promise.resolve();
  let s!: T;
  const is = onceki.then(async () => {
    const d = await oku(id);
    s = await f(d);
    const z = Date.now();
    for (const [k, o] of Object.entries(d.oturumlar)) if (o.bitis < z) delete d.oturumlar[k];
    for (const [k, o] of Object.entries(d.oauth ?? {})) if (o.bitis < z) delete d.oauth![k];
    for (const [k, o] of Object.entries(d.belirtecler ?? {})) if (o.bitis < z) delete d.belirtecler![k];
    for (const [k, o] of Object.entries(d.mfa ?? {})) if (o.bitis < z) delete d.mfa![k];
    for (const [k, o] of Object.entries(d.kodlar ?? {})) if (o.bitis < z - 3600_000) delete d.kodlar![k];
    await mkdir(path.dirname(dosya(id)), { recursive: true });
    await writeFile(dosya(id), JSON.stringify(d));
  });
  kuyruk.set(id, is.catch(() => {}));
  await is;
  return s;
}

const ayarTamamla = (a?: Partial<KimlikAyar>): KimlikAyar => ({ ...VARSAYILAN, ...(a ?? {}), yonlendirmeler: a?.yonlendirmeler ?? [] });
const yasakli = (u: Uye) => !!u.yasakBitis && u.yasakBitis > Date.now();
export const acik = (u: Uye): AcikUye => ({
  id: u.id, eposta: u.eposta, ad: u.ad, olusturma: u.olusturma, sonGiris: u.sonGiris,
  ...(yasakli(u) ? { yasakBitis: u.yasakBitis } : {}), saglayicilar: u.saglayicilar ?? (u.ozet ? ["eposta"] : []),
  ...(u.dogrulandi ? { dogrulandi: true } : {}), ...(u.gorsel ? { gorsel: u.gorsel } : {}), ...(u.girisSayisi ? { girisSayisi: u.girisSayisi } : {}), ...(u.ekleyen ? { ekleyen: u.ekleyen } : {}),
  ...(u.telefon ? { telefon: u.telefon } : {}), ...(u.ikiAdim ? { ikiAdim: true } : {}),
});
const epostaGecerli = (e: string) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/.test(e);
const epostaTemizle = (e: string) => e.trim().toLocaleLowerCase("tr-TR");
const yeniOturum = (d: Depo, u: Uye, saglayici: Saglayici) => {
  const oturum = randomBytes(24).toString("base64url");
  const z = Date.now();
  d.oturumlar[oturum] = { uyeId: u.id, bitis: z + ayarTamamla(d.ayarlar).oturumGun * 864e5, olusturma: z, saglayici };
  u.sonGiris = z; u.girisSayisi = (u.girisSayisi ?? 0) + 1;
  return oturum;
};

export class UyeHatasi extends Error {}

/** Girişi tamamlar: üyede iki adımlı doğrulama açıksa oturum yerine 5 dakikalık ikinci adım belirteci (mfa) döner. */
function girisTamamla(d: Depo, u: Uye, saglayici: Saglayici): { uye: AcikUye; oturum?: string; mfa?: string } {
  if (u.ikiAdim) {
    const m = randomBytes(24).toString("base64url");
    (d.mfa ??= {})[ozetle(m)] = { uyeId: u.id, saglayici, bitis: Date.now() + 5 * 60_000, deneme: 0 };
    return { uye: acik(u), mfa: m };
  }
  return { uye: acik(u), oturum: yeniOturum(d, u, saglayici) };
}

async function sifreOzeti(sifre: string) { const tuz = randomBytes(16); return { tuz: tuz.toString("base64"), ozet: (await scrypt(sifre, tuz, 32)).toString("base64") }; }
function sifreDenetle(sifre: string, a: KimlikAyar) {
  if (sifre.length < a.minSifre) throw new UyeHatasi(`Şifre en az ${a.minSifre} karakter olmalı.`);
  if (sifre.length > 200) throw new UyeHatasi("Şifre çok uzun.");
}

export async function kayitOl(id: string, eposta: string, sifre: string, ad: string, mevcutOturum?: string | null): Promise<{ uye: AcikUye; oturum: string; yukseltildi?: boolean }> {
  const e = epostaTemizle(eposta);
  if (!epostaGecerli(e)) throw new UyeHatasi("Geçerli bir e-posta yaz.");
  const a = ayarTamamla((await oku(id)).ayarlar);
  if (a.kayitKapali) throw new UyeHatasi("Yeni kayıtlar şu an kapalı.");
  sifreDenetle(sifre, a);
  const s = await sifreOzeti(sifre);
  return degistir(id, (d) => {
    if (d.uyeler.some((u) => u.eposta === e)) throw new UyeHatasi("Bu e-postayla zaten bir hesap var. Giriş yap.");
    // Misafir (anonim) oturumla kayıt: aynı üye kalıcı hesaba dönüşür, kayıtları korunur.
    const o = mevcutOturum ? d.oturumlar[mevcutOturum] : undefined;
    const misafir = o && o.bitis > Date.now() ? d.uyeler.find((x) => x.id === o.uyeId && x.saglayicilar?.includes("anonim")) : undefined;
    if (misafir) {
      Object.assign(misafir, { eposta: e, ad: ad.trim().slice(0, 80) || e.split("@")[0], ...s, saglayicilar: ["eposta"] });
      delete d.oturumlar[mevcutOturum!];
      return { uye: acik(misafir), oturum: yeniOturum(d, misafir, "eposta"), yukseltildi: true };
    }
    if (d.uyeler.length >= 20_000) throw new UyeHatasi("Üye sınırına ulaşıldı.");
    const z = Date.now();
    const u: Uye = { id: randomBytes(8).toString("base64url"), eposta: e, ad: ad.trim().slice(0, 80) || e.split("@")[0], ...s, olusturma: z, sonGiris: z, saglayicilar: ["eposta"] };
    d.uyeler.push(u);
    return { uye: acik(u), oturum: yeniOturum(d, u, "eposta") };
  });
}

export async function girisYap(id: string, eposta: string, sifre: string): Promise<{ uye: AcikUye; oturum?: string; mfa?: string }> {
  const e = epostaTemizle(eposta);
  const d0 = await oku(id);
  const u0 = d0.uyeler.find((u) => u.eposta === e);
  // Zamanlama farkı sızmasın: üye yoksa da özet hesaplanır.
  const ozet = await scrypt(sifre, Buffer.from(u0?.tuz || "AAAAAAAAAAAAAAAAAAAAAA==", "base64"), 32);
  if (u0 && !u0.ozet && u0.saglayicilar?.includes("google")) throw new UyeHatasi("Bu hesap Google ile açıldı. Google ile giriş yap.");
  if (!u0 || !u0.ozet || !timingSafeEqual(ozet, Buffer.from(u0.ozet, "base64"))) throw new UyeHatasi("E-posta ya da şifre yanlış.");
  if (yasakli(u0)) throw new UyeHatasi("Bu hesap geçici olarak kullanıma kapatıldı.");
  return degistir(id, (d) => {
    const u = d.uyeler.find((x) => x.id === u0.id)!;
    return girisTamamla(d, u, "eposta");
  });
}

export async function oturumdanUye(id: string, oturum: string | null): Promise<AcikUye | null> {
  if (!oturum || !/^[A-Za-z0-9_-]{20,64}$/.test(oturum)) return null;
  const d = await oku(id);
  const o = d.oturumlar[oturum];
  if (!o || o.bitis < Date.now()) return null;
  const u = d.uyeler.find((x) => x.id === o.uyeId);
  return u && !yasakli(u) ? acik(u) : null;
}

export async function cikisYap(id: string, oturum: string) { await degistir(id, (d) => { delete d.oturumlar[oturum]; }); }
export async function uyeleriListele(id: string): Promise<AcikUye[]> { return (await oku(id)).uyeler.map(acik).reverse(); }
export async function uyeSil(id: string, uyeId: string) {
  await degistir(id, (d) => {
    d.uyeler = d.uyeler.filter((u) => u.id !== uyeId);
    for (const [k, o] of Object.entries(d.oturumlar)) if (o.uyeId === uyeId) delete d.oturumlar[k];
  });
}

/* ───── Sahip yönetimi ───── */

/** Ayarlar (gizli anahtar yerine yalnız var olup olmadığı döner). */
export async function kimlikAyarOku(id: string) {
  const a = ayarTamamla((await oku(id)).ayarlar);
  const { google, oauth, sms, ...geri } = a;
  return {
    ...geri, google: google ? { acik: google.acik, istemciId: google.istemciId, sirVar: !!google.sirSifreli } : null,
    oauth: Object.fromEntries(OAUTH_SAGLAYICILAR.map((s) => [s, oauth?.[s] ? { acik: oauth[s]!.acik, istemciId: oauth[s]!.istemciId, sirVar: !!oauth[s]!.sirSifreli, takimId: oauth[s]!.takimId ?? "", anahtarId: oauth[s]!.anahtarId ?? "" } : null])) as Record<OauthSaglayici, { acik: boolean; istemciId: string; sirVar: boolean; takimId: string; anahtarId: string } | null>,
    sms: sms ? { acik: sms.acik, kullanici: sms.kullanici, sifreVar: !!sms.sifreSifreli, baslik: sms.baslik, sablon: sms.sablon, deneme: sms.deneme } : null,
    epostaKod: !!a.epostaKod, anonim: !!a.anonim, ikiAdim: !!a.ikiAdim,
  };
}
/** Sunucu içi: Google istemci bilgisi (gizli anahtar çözülmüş). */
export async function googleIstemci(id: string): Promise<{ istemciId: string; sir: string } | null> {
  const g = ayarTamamla((await oku(id)).ayarlar).google;
  if (!g?.acik || !g.istemciId) return null;
  const sir = coz(g.sirSifreli);
  return sir ? { istemciId: g.istemciId, sir } : null;
}
/** Bir e-posta türünün şablonu ve markası (eksikler varsayılandan). */
export async function epostaSablonu(id: string, tur: EpostaTur) {
  return sablonTamamla(ayarTamamla((await oku(id)).ayarlar).eposta, tur);
}
/** E-postayla üye (şifremi unuttum için); yasaklıysa null. */
export async function uyeBulEposta(id: string, eposta: string): Promise<AcikUye | null> {
  const e = eposta.trim().toLocaleLowerCase("tr");
  const u = (await oku(id)).uyeler.find((x) => x.eposta.toLocaleLowerCase("tr") === e);
  return u && !yasakli(u) ? acik(u) : null;
}

export type OauthGirdi = { acik?: boolean; istemciId?: string; sir?: string; takimId?: string; anahtarId?: string } | null;
export type SmsGirdi = { acik?: boolean; kullanici?: string; sifre?: string; baslik?: string; sablon?: string; deneme?: { telefon: string; kod: string }[] } | null;
export async function kimlikAyarYaz(id: string, y: Partial<Omit<KimlikAyar, "google" | "eposta" | "oauth" | "sms">> & { google?: { acik?: boolean; istemciId?: string; sir?: string } | null; eposta?: unknown; oauth?: Partial<Record<OauthSaglayici, OauthGirdi>>; sms?: SmsGirdi }) {
  await degistir(id, (d) => {
    const a = ayarTamamla(d.ayarlar);
    for (const k of ["epostaKod", "anonim", "ikiAdim"] as const) if (typeof y[k] === "boolean") a[k] = y[k];
    if (y.oauth) for (const s of OAUTH_SAGLAYICILAR) {
      const g = y.oauth[s];
      if (g === undefined) continue;
      if (g === null) { if (a.oauth) delete a.oauth[s]; continue; }
      const eski = a.oauth?.[s];
      const istemciId = (g.istemciId ?? eski?.istemciId ?? "").trim();
      const kalip = s === "microsoft" ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i : /^[\w.-]{3,150}$/;
      if (istemciId && !kalip.test(istemciId)) throw new UyeHatasi(s === "microsoft" ? "Microsoft uygulama (istemci) kimliği GUID biçiminde olmalı." : s === "apple" ? "Apple Services ID ters alan adı biçiminde olmalı (com.ornek.web)." : "GitHub istemci kimliği geçersiz.");
      const takimId = (g.takimId ?? eski?.takimId ?? "").trim().toUpperCase(), anahtarId = (g.anahtarId ?? eski?.anahtarId ?? "").trim().toUpperCase();
      if (s === "apple" && ((takimId && !/^[A-Z0-9]{10}$/.test(takimId)) || (anahtarId && !/^[A-Z0-9]{10}$/.test(anahtarId)))) throw new UyeHatasi("Apple takım kimliği ve anahtar kimliği 10 karakter olmalı.");
      const sir = g.sir?.trim();
      if (s === "apple" && sir && !sir.includes("BEGIN PRIVATE KEY")) throw new UyeHatasi("Apple anahtarı .p8 dosyasının içeriği olmalı (BEGIN PRIVATE KEY ile başlar).");
      (a.oauth ??= {})[s] = { acik: g.acik ?? eski?.acik ?? true, istemciId, sirSifreli: sir ? sifrele(sir) : eski?.sirSifreli ?? "", ...(s === "apple" ? { takimId, anahtarId } : {}) };
    }
    if (y.sms === null) delete a.sms;
    else if (y.sms) {
      const eski = a.sms;
      const deneme = Array.isArray(y.sms.deneme) ? y.sms.deneme.map((x) => ({ telefon: String(x?.telefon ?? "").replace(/[^\d]/g, ""), kod: String(x?.kod ?? "") })).filter((x) => /^905\d{9}$/.test(x.telefon) && /^\d{6}$/.test(x.kod)).slice(0, 10) : eski?.deneme ?? [];
      const baslik = (y.sms.baslik ?? eski?.baslik ?? "").trim().slice(0, 11);
      const sablon = (y.sms.sablon ?? eski?.sablon ?? "{site} giriş kodun: {kod}. Kimseyle paylaşma.").trim().slice(0, 300);
      if (!sablon.includes("{kod}")) throw new UyeHatasi("SMS metninde {kod} geçmeli.");
      a.sms = { acik: y.sms.acik ?? eski?.acik ?? true, kullanici: (y.sms.kullanici ?? eski?.kullanici ?? "").trim().slice(0, 40), sifreSifreli: y.sms.sifre?.trim() ? sifrele(y.sms.sifre.trim()) : eski?.sifreSifreli ?? "", baslik, sablon, deneme };
    }
    if (y.eposta !== undefined) a.eposta = epostaAyarTemizle(y.eposta, a.eposta);
    if (typeof y.kayitKapali === "boolean") a.kayitKapali = y.kayitKapali;
    if (typeof y.epostaDogrulama === "boolean") a.epostaDogrulama = y.epostaDogrulama;
    if (typeof y.sihirliBaglanti === "boolean") a.sihirliBaglanti = y.sihirliBaglanti;
    if (y.minSifre != null) a.minSifre = Math.max(6, Math.min(64, Math.round(Number(y.minSifre)) || 8));
    if (y.oturumGun != null) a.oturumGun = Math.max(1, Math.min(365, Math.round(Number(y.oturumGun)) || 30));
    if (Array.isArray(y.yonlendirmeler)) a.yonlendirmeler = [...new Set(y.yonlendirmeler.map((x) => String(x).trim()).filter((x) => /^https?:\/\/[^\s]{3,200}$/.test(x)))].slice(0, 30);
    if (y.google === null) delete a.google;
    else if (y.google) {
      const istemciId = (y.google.istemciId ?? a.google?.istemciId ?? "").trim();
      if (istemciId && !/^[\w.-]{10,200}\.apps\.googleusercontent\.com$/.test(istemciId)) throw new UyeHatasi("İstemci kimliği ...apps.googleusercontent.com ile bitmeli.");
      const sirSifreli = y.google.sir?.trim() ? sifrele(y.google.sir.trim()) : a.google?.sirSifreli ?? "";
      a.google = { acik: y.google.acik ?? a.google?.acik ?? true, istemciId, sirSifreli };
    }
    d.ayarlar = a;
  });
  return kimlikAyarOku(id);
}

/** Sahibin eklediği üye. Şifre verilmezse şifre belirleme bağlantısı (davet) üretilir. */
export async function uyeEkle(id: string, g: { eposta: string; ad?: string; sifre?: string }): Promise<{ uye: AcikUye; belirtec?: string }> {
  const e = epostaTemizle(g.eposta);
  if (!epostaGecerli(e)) throw new UyeHatasi("Geçerli bir e-posta yaz.");
  const a = ayarTamamla((await oku(id)).ayarlar);
  const s = g.sifre ? (sifreDenetle(g.sifre, a), await sifreOzeti(g.sifre)) : { tuz: "", ozet: "" };
  return degistir(id, (d) => {
    if (d.uyeler.some((u) => u.eposta === e)) throw new UyeHatasi("Bu e-postayla bir üye zaten var.");
    const z = Date.now();
    const u: Uye = { id: randomBytes(8).toString("base64url"), eposta: e, ad: (g.ad ?? "").trim().slice(0, 80) || e.split("@")[0], ...s, olusturma: z, sonGiris: 0, saglayicilar: ["eposta"], ekleyen: "sahip" };
    let belirtec: string | undefined;
    if (!g.sifre) { belirtec = randomBytes(24).toString("base64url"); u.sifirlama = { ozet: ozetle(belirtec), bitis: z + 7 * 864e5 }; }
    d.uyeler.push(u);
    return { uye: acik(u), belirtec };
  });
}

/** Süreli yasak (ms; null kaldırır, SURESIZ süresiz). Yasaklanınca bütün oturumları kapanır. */
export async function uyeYasakla(id: string, uyeId: string, sure: number | null) {
  return degistir(id, (d) => {
    const u = d.uyeler.find((x) => x.id === uyeId);
    if (!u) throw new UyeHatasi("Üye bulunamadı.");
    if (sure === null) delete u.yasakBitis;
    else { u.yasakBitis = sure >= SURESIZ ? SURESIZ : Date.now() + Math.max(60_000, sure); for (const [k, o] of Object.entries(d.oturumlar)) if (o.uyeId === uyeId) delete d.oturumlar[k]; }
    return acik(u);
  });
}

/** Üyenin bütün oturumlarını kapatır; kapanan oturum sayısını döner. */
export async function oturumlariKapat(id: string, uyeId: string) {
  return degistir(id, (d) => { let n = 0; for (const [k, o] of Object.entries(d.oturumlar)) if (o.uyeId === uyeId) { delete d.oturumlar[k]; n++; } return n; });
}

/** Şifre sıfırlama belirteci (24 saat); sahip bağlantıyı üyeye kendisi iletir. */
export async function sifirlamaBelirteci(id: string, uyeId: string) {
  return degistir(id, (d) => {
    const u = d.uyeler.find((x) => x.id === uyeId);
    if (!u) throw new UyeHatasi("Üye bulunamadı.");
    const b = randomBytes(24).toString("base64url");
    u.sifirlama = { ozet: ozetle(b), bitis: Date.now() + 864e5 };
    return { belirtec: b, bitis: u.sifirlama.bitis };
  });
}
/** Belirteç geçerli mi (sayfayı göstermek için). */
export async function sifirlamaKimin(id: string, belirtec: string): Promise<AcikUye | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(belirtec)) return null;
  const o = ozetle(belirtec);
  const u = (await oku(id)).uyeler.find((x) => x.sifirlama?.ozet === o && x.sifirlama.bitis > Date.now());
  return u ? acik(u) : null;
}
/** Yeni şifreyi uygular; belirteç tek kullanımlık, bütün oturumlar kapanır. */
export async function sifirlamaUygula(id: string, belirtec: string, sifre: string) {
  const a = ayarTamamla((await oku(id)).ayarlar);
  sifreDenetle(sifre, a);
  const s = await sifreOzeti(sifre);
  const o = ozetle(belirtec);
  return degistir(id, (d) => {
    const u = d.uyeler.find((x) => x.sifirlama?.ozet === o && x.sifirlama.bitis > Date.now());
    if (!u) throw new UyeHatasi("Bağlantının süresi dolmuş ya da kullanılmış.");
    u.tuz = s.tuz; u.ozet = s.ozet; delete u.sifirlama;
    if (!u.saglayicilar?.includes("eposta")) u.saglayicilar = [...(u.saglayicilar ?? []), "eposta"];
    for (const [k, x] of Object.entries(d.oturumlar)) if (x.uyeId === u.id) delete d.oturumlar[k];
    return acik(u);
  });
}

/** Sahip için ham kayıt (gizli alanlar çıkarılır) ve oturum özeti. */
export async function uyeAyrinti(id: string, uyeId: string) {
  const d = await oku(id);
  const u = d.uyeler.find((x) => x.id === uyeId);
  if (!u) return null;
  const { tuz: _t, ozet: _o, sifirlama, ikiAdim, ikiAdimBekleyen: _b, ...ham } = u; void _t; void _o; void _b;
  const oturumlar = Object.values(d.oturumlar).filter((o) => o.uyeId === uyeId && o.bitis > Date.now()).map((o) => ({ olusturma: o.olusturma ?? null, bitis: o.bitis, saglayici: o.saglayici ?? "eposta" }));
  return { uye: acik(u), ham: { ...ham, sifreVar: !!u.ozet, ...(sifirlama ? { sifirlamaBitis: sifirlama.bitis } : {}), ...(ikiAdim ? { ikiAdim: { kurulum: ikiAdim.kurulum, kalanKurtarmaKodu: ikiAdim.kurtarma.length } } : {}) }, oturumlar };
}

/* ───── Google ile giriş (OAuth 2.0 yetki kodu + PKCE) ───── */

export async function oauthBaslat(id: string, donus: string) {
  const durum = randomBytes(24).toString("base64url");
  const dogrulayici = randomBytes(32).toString("base64url");
  await degistir(id, (d) => { (d.oauth ??= {})[durum] = { dogrulayici, donus, bitis: Date.now() + 600_000 }; if (Object.keys(d.oauth).length > 500) d.oauth = Object.fromEntries(Object.entries(d.oauth).slice(-500)); });
  return { durum, meydanOkuma: createHash("sha256").update(dogrulayici).digest("base64url") };
}
export async function oauthBitir(id: string, durum: string) {
  return degistir(id, (d) => { const o = d.oauth?.[durum]; if (o) delete d.oauth![durum]; return o && o.bitis > Date.now() ? o : null; });
}
/** Google profiliyle giriş ya da kayıt; oturum belirteci döner. */
export async function googleIleGiris(id: string, g: { sub: string; email: string; emailDogru: boolean; ad?: string; gorsel?: string }) {
  const e = epostaTemizle(g.email);
  return degistir(id, (d) => {
    const a = ayarTamamla(d.ayarlar);
    let u = d.uyeler.find((x) => x.googleId === g.sub) ?? (g.emailDogru ? d.uyeler.find((x) => x.eposta === e) : undefined);
    if (u && yasakli(u)) throw new UyeHatasi("Bu hesap geçici olarak kullanıma kapatıldı.");
    if (!u) {
      if (a.kayitKapali) throw new UyeHatasi("Yeni kayıtlar şu an kapalı.");
      if (!epostaGecerli(e)) throw new UyeHatasi("Google hesabında geçerli bir e-posta yok.");
      if (d.uyeler.length >= 20_000) throw new UyeHatasi("Üye sınırına ulaşıldı.");
      u = { id: randomBytes(8).toString("base64url"), eposta: e, ad: (g.ad ?? "").slice(0, 80) || e.split("@")[0], tuz: "", ozet: "", olusturma: Date.now(), sonGiris: 0, saglayicilar: ["google"] };
      d.uyeler.push(u);
    }
    u.googleId = g.sub;
    if (g.emailDogru) u.dogrulandi = true;
    if (g.gorsel && /^https:\/\//.test(g.gorsel)) u.gorsel = g.gorsel.slice(0, 300);
    if (!u.saglayicilar?.includes("google")) u.saglayicilar = [...(u.saglayicilar ?? (u.ozet ? ["eposta"] : [])), "google"];
    return girisTamamla(d, u, "google");
  });
}

/* ───── E-posta bağlantıları (yalnız e-posta servisi kuruluysa kullanılır) ───── */

export async function belirtecUret(id: string, tur: "baglanti" | "dogrula", eposta: string, donus?: string) {
  const b = randomBytes(24).toString("base64url");
  await degistir(id, (d) => { (d.belirtecler ??= {})[ozetle(b)] = { tur, eposta: epostaTemizle(eposta), ...(donus ? { donus } : {}), bitis: Date.now() + (tur === "baglanti" ? 15 * 60_000 : 3 * 864e5) }; });
  return b;
}
/** Sihirli bağlantı ya da doğrulama belirtecini kullanır. baglanti: oturum açar (kayıt açıksa yeni üye oluşturur). */
export async function belirtecKullan(id: string, b: string) {
  return degistir(id, (d) => {
    const k = ozetle(b);
    const x = d.belirtecler?.[k];
    if (!x || x.bitis < Date.now()) throw new UyeHatasi("Bağlantının süresi dolmuş ya da kullanılmış.");
    delete d.belirtecler![k];
    let u = d.uyeler.find((y) => y.eposta === x.eposta);
    if (x.tur === "dogrula") { if (!u) throw new UyeHatasi("Üye bulunamadı."); u.dogrulandi = true; return { tur: x.tur, uye: acik(u), donus: x.donus }; }
    if (u && yasakli(u)) throw new UyeHatasi("Bu hesap geçici olarak kullanıma kapatıldı.");
    if (!u) {
      if (ayarTamamla(d.ayarlar).kayitKapali) throw new UyeHatasi("Yeni kayıtlar şu an kapalı.");
      u = { id: randomBytes(8).toString("base64url"), eposta: x.eposta, ad: x.eposta.split("@")[0], tuz: "", ozet: "", olusturma: Date.now(), sonGiris: 0, saglayicilar: ["baglanti"] };
      d.uyeler.push(u);
    }
    u.dogrulandi = true;
    if (!u.saglayicilar?.includes("baglanti")) u.saglayicilar = [...(u.saglayicilar ?? []), "baglanti"];
    return { tur: x.tur, donus: x.donus, ...girisTamamla(d, u, "baglanti") };
  });
}

/* ───── GitHub, Microsoft ve Apple ile giriş (sahibin kendi OAuth istemcisi) ───── */

/** Sunucu içi: sağlayıcının istemci bilgisi (gizli anahtar çözülmüş); kapalıysa ya da eksikse null. */
export async function oauthIstemci(id: string, s: OauthSaglayici): Promise<{ istemciId: string; sir: string; takimId?: string; anahtarId?: string } | null> {
  const o = ayarTamamla((await oku(id)).ayarlar).oauth?.[s];
  if (!o?.acik || !o.istemciId) return null;
  const sir = coz(o.sirSifreli);
  if (!sir || (s === "apple" && (!o.takimId || !o.anahtarId))) return null;
  return { istemciId: o.istemciId, sir, takimId: o.takimId, anahtarId: o.anahtarId };
}
/** Sağlayıcı profiliyle giriş ya da kayıt. E-posta yalnız sağlayıcı doğruladıysa mevcut hesaba bağlanır. */
export async function oauthIleGiris(id: string, s: OauthSaglayici, g: { sub: string; email: string; emailDogru: boolean; ad?: string; gorsel?: string }) {
  const e = epostaTemizle(g.email);
  return degistir(id, (d) => {
    const a = ayarTamamla(d.ayarlar);
    let u = d.uyeler.find((x) => x.oauthId?.[s] === g.sub) ?? (g.emailDogru && e ? d.uyeler.find((x) => x.eposta === e) : undefined);
    if (u && yasakli(u)) throw new UyeHatasi("Bu hesap geçici olarak kullanıma kapatıldı.");
    if (!u) {
      if (a.kayitKapali) throw new UyeHatasi("Yeni kayıtlar şu an kapalı.");
      if (!epostaGecerli(e)) throw new UyeHatasi("Hesapta doğrulanmış bir e-posta yok; sağlayıcıda e-postanı doğrulayıp tekrar dene.");
      if (d.uyeler.some((x) => x.eposta === e)) throw new UyeHatasi("Bu e-postayla başka bir hesap var; o yöntemle giriş yap.");
      if (d.uyeler.length >= 20_000) throw new UyeHatasi("Üye sınırına ulaşıldı.");
      u = { id: randomBytes(8).toString("base64url"), eposta: e, ad: (g.ad ?? "").slice(0, 80) || e.split("@")[0], tuz: "", ozet: "", olusturma: Date.now(), sonGiris: 0, saglayicilar: [s] };
      d.uyeler.push(u);
    }
    u.oauthId = { ...(u.oauthId ?? {}), [s]: g.sub };
    if (g.emailDogru) u.dogrulandi = true;
    if (g.gorsel && /^https:\/\//.test(g.gorsel) && !u.gorsel) u.gorsel = g.gorsel.slice(0, 300);
    if (!u.saglayicilar?.includes(s)) u.saglayicilar = [...(u.saglayicilar ?? (u.ozet ? ["eposta"] : [])), s];
    return girisTamamla(d, u, s);
  });
}

/* ───── İki adımlı doğrulama (TOTP, kurtarma kodları) ───── */

const KURTARMA_ABC = "abcdefghjkmnpqrstuvwxyz23456789";
const kurtarmaUret = () => Array.from({ length: 10 }, () => { let k = ""; for (let i = 0; i < 10; i++) k += KURTARMA_ABC[randomInt(KURTARMA_ABC.length)]; return `${k.slice(0, 5)}-${k.slice(5)}`; });
const kurtarmaOzet = (k: string) => ozetle(`kurtarma:${k.toLowerCase().replace(/[^a-z0-9]/g, "")}`);
/** TOTP kodunu doğrular (±1 adım); sonAdim ve öncesi yeniden kullanılamaz. Geçerse zaman adımını döner. */
async function totpAdimi(gizli: string, kod: string, sonAdim?: number): Promise<number | null> {
  const temiz = kod.replace(/\s/g, "");
  if (!/^\d{6}$/.test(temiz)) return null;
  const t = Date.now(), adim = Math.floor(t / 30_000);
  for (const k of [0, -1, 1]) {
    if (sonAdim !== undefined && adim + k <= sonAdim) continue;
    if ((await totpKod(gizli, t + k * 30_000)) === temiz) return adim + k;
  }
  return null;
}

/** Kurulum: gizli anahtar ve otpauth adresi (15 dk içinde onaylanmalı). */
export async function ikiAdimKur(id: string, uyeId: string, siteAdi: string) {
  const gizli = secretUret(20);
  const u = await degistir(id, (d) => {
    if (!ayarTamamla(d.ayarlar).ikiAdim) throw new UyeHatasi("Bu sitede iki adımlı doğrulama kapalı.");
    const x = d.uyeler.find((y) => y.id === uyeId);
    if (!x) throw new UyeHatasi("Üye bulunamadı.");
    if (x.ikiAdim) throw new UyeHatasi("İki adımlı doğrulama zaten açık.");
    x.ikiAdimBekleyen = { gizliSifreli: sifrele(gizli), bitis: Date.now() + 15 * 60_000 };
    return acik(x);
  });
  return { gizli, uri: otpauthUri(gizli, u.eposta || u.telefon || u.id, siteAdi.slice(0, 40) || "Vayra") };
}
/** Kurulumu ilk kodla onaylar; bir kez gösterilecek 10 kurtarma kodu döner. */
export async function ikiAdimOnayla(id: string, uyeId: string, kod: string) {
  return degistir(id, async (d) => {
    const u = d.uyeler.find((y) => y.id === uyeId);
    const b = u?.ikiAdimBekleyen;
    if (!u || !b || b.bitis < Date.now()) throw new UyeHatasi("Kurulumun süresi doldu; yeniden başlat.");
    const gizli = coz(b.gizliSifreli);
    const adim = gizli ? await totpAdimi(gizli, kod) : null;
    if (adim === null) throw new UyeHatasi("Kod tutmadı. Doğrulama uygulamasındaki güncel 6 haneli kodu yaz.");
    const kodlar = kurtarmaUret();
    u.ikiAdim = { gizliSifreli: b.gizliSifreli, kurtarma: kodlar.map(kurtarmaOzet), kurulum: Date.now(), sonAdim: adim };
    delete u.ikiAdimBekleyen;
    return { kurtarmaKodlari: kodlar };
  });
}
/** Kod (TOTP ya da kurtarma) doğrular; kurtarma kodu harcanır. */
async function ikinciAdimDenetle(u: Uye, kod: string): Promise<"totp" | "kurtarma" | null> {
  if (!u.ikiAdim) return null;
  const gizli = coz(u.ikiAdim.gizliSifreli);
  const adim = gizli ? await totpAdimi(gizli, kod, u.ikiAdim.sonAdim) : null;
  if (adim !== null) { u.ikiAdim.sonAdim = adim; return "totp"; }
  const oz = kurtarmaOzet(kod), i = u.ikiAdim.kurtarma.indexOf(oz);
  if (/[a-z]/i.test(kod) && i >= 0) { u.ikiAdim.kurtarma.splice(i, 1); return "kurtarma"; }
  return null;
}
export async function ikiAdimKapat(id: string, uyeId: string, kod: string) {
  return degistir(id, async (d) => {
    const u = d.uyeler.find((y) => y.id === uyeId);
    if (!u?.ikiAdim) throw new UyeHatasi("İki adımlı doğrulama açık değil.");
    if (!(await ikinciAdimDenetle(u, kod))) throw new UyeHatasi("Kod tutmadı.");
    delete u.ikiAdim;
    return acik(u);
  });
}
/** Girişin ikinci adımı: mfa belirteci + kod → oturum. 5 hatalı denemede belirteç düşer. */
export async function ikiAdimGiris(id: string, mfa: string, kod: string) {
  return degistir(id, async (d) => {
    const k = ozetle(mfa), m = d.mfa?.[k];
    if (!m || m.bitis < Date.now()) throw new UyeHatasi("Giriş isteğinin süresi doldu; yeniden giriş yap.");
    const u = d.uyeler.find((y) => y.id === m.uyeId);
    if (!u || yasakli(u)) { delete d.mfa![k]; throw new UyeHatasi("Bu hesapla giriş yapılamıyor."); }
    const tur = await ikinciAdimDenetle(u, kod);
    if (!tur) { m.deneme++; if (m.deneme >= 5) delete d.mfa![k]; throw new UyeHatasi(m.deneme >= 5 ? "Çok fazla hatalı kod; yeniden giriş yap." : "Kod tutmadı."); }
    delete d.mfa![k];
    return { uye: acik(u), oturum: yeniOturum(d, u, m.saglayici), kurtarmaKullanildi: tur === "kurtarma", kalanKurtarma: u.ikiAdim?.kurtarma.length ?? 0 };
  });
}
/** Sahip: üyenin iki adımlı doğrulamasını kaldırır (telefonunu kaybeden üye için). */
export async function ikiAdimSifirla(id: string, uyeId: string) {
  return degistir(id, (d) => { const u = d.uyeler.find((y) => y.id === uyeId); if (!u) throw new UyeHatasi("Üye bulunamadı."); delete u.ikiAdim; delete u.ikiAdimBekleyen; return acik(u); });
}

/* ───── Tek kullanımlık kodla giriş (SMS ve e-posta) ve misafir giriş ───── */

export type KodKanal = "sms" | "eposta";
/** Sunucu içi: SMS gönderim bilgisi (şifre çözülmüş). */
export async function smsAyari(id: string) {
  const s = ayarTamamla((await oku(id)).ayarlar).sms;
  return s?.acik ? { kullanici: s.kullanici, sifre: coz(s.sifreSifreli) ?? "", baslik: s.baslik, sablon: s.sablon, deneme: s.deneme } : null;
}
/** Yeni kod üretir ve saklar (5 dk, 5 deneme). Aynı hedefe dakikada bir, saatte en çok 5 kod. deneme: sabit kodlu numara. */
export async function kodHazirla(id: string, kanal: KodKanal, hedef: string): Promise<{ kod: string; deneme: boolean }> {
  return degistir(id, (d) => {
    const a = ayarTamamla(d.ayarlar);
    if (kanal === "sms" && !a.sms?.acik) throw new UyeHatasi("Bu sitede SMS ile giriş kapalı.");
    if (kanal === "eposta" && !a.epostaKod) throw new UyeHatasi("Bu sitede e-postayla kodla giriş kapalı.");
    const z = Date.now(), anahtar = ozetle(`${kanal}:${hedef}`);
    const once = d.kodlar?.[anahtar];
    const gonderim = (once?.gonderim ?? []).filter((t) => z - t < 3600_000);
    if (gonderim.length && z - gonderim[gonderim.length - 1] < 60_000) throw new UyeHatasi("Yeni kod için bir dakika bekle.");
    if (gonderim.length >= 5) throw new UyeHatasi("Bu numaraya ya da adrese bir saatte çok fazla kod gönderildi; biraz sonra dene.");
    const sabit = kanal === "sms" ? a.sms?.deneme.find((x) => x.telefon === hedef)?.kod : undefined;
    const kod = sabit ?? String(randomInt(0, 1_000_000)).padStart(6, "0");
    (d.kodlar ??= {})[anahtar] = { ozet: ozetle(`${anahtar}:${kod}`), bitis: z + 5 * 60_000, deneme: 0, gonderim: [...gonderim, z] };
    return { kod, deneme: !!sabit };
  });
}
/** Kodu doğrular; üye yoksa (kayıt açıksa) oluşturur ve girişi tamamlar. */
export async function kodIleGiris(id: string, kanal: KodKanal, hedef: string, kod: string) {
  return degistir(id, (d) => {
    const anahtar = ozetle(`${kanal}:${hedef}`), k = d.kodlar?.[anahtar];
    if (!k || k.bitis < Date.now() || k.deneme >= 5) throw new UyeHatasi("Kodun süresi doldu; yeni kod iste.");
    if (ozetle(`${anahtar}:${String(kod).replace(/\s/g, "")}`) !== k.ozet) { k.deneme++; throw new UyeHatasi(k.deneme >= 5 ? "Çok fazla hatalı deneme; yeni kod iste." : "Kod yanlış."); }
    // Kod harcanır; gönderim geçmişi (hız sınırı) bir saat korunur.
    k.deneme = 5;
    const a = ayarTamamla(d.ayarlar);
    let u = kanal === "sms" ? d.uyeler.find((x) => x.telefon === hedef) : d.uyeler.find((x) => x.eposta === hedef);
    if (u && yasakli(u)) throw new UyeHatasi("Bu hesap geçici olarak kullanıma kapatıldı.");
    if (!u) {
      if (a.kayitKapali) throw new UyeHatasi("Yeni kayıtlar şu an kapalı.");
      if (d.uyeler.length >= 20_000) throw new UyeHatasi("Üye sınırına ulaşıldı.");
      u = { id: randomBytes(8).toString("base64url"), eposta: kanal === "eposta" ? hedef : "", ad: kanal === "eposta" ? hedef.split("@")[0] : `Üye ${hedef.slice(-4)}`, tuz: "", ozet: "", olusturma: Date.now(), sonGiris: 0, saglayicilar: [kanal === "sms" ? "sms" : "kod"], ...(kanal === "sms" ? { telefon: hedef } : {}) };
      d.uyeler.push(u);
    }
    const s: Saglayici = kanal === "sms" ? "sms" : "kod";
    if (kanal === "eposta") u.dogrulandi = true;
    if (!u.saglayicilar?.includes(s)) u.saglayicilar = [...(u.saglayicilar ?? []), s];
    return girisTamamla(d, u, s);
  });
}
/** Misafir giriş: e-postasız üye ve oturum; sonra kayit ile kalıcı hesaba dönüşür. */
export async function anonimGiris(id: string) {
  return degistir(id, (d) => {
    if (!ayarTamamla(d.ayarlar).anonim) throw new UyeHatasi("Bu sitede misafir girişi kapalı.");
    if (d.uyeler.length >= 20_000) throw new UyeHatasi("Üye sınırına ulaşıldı.");
    const u: Uye = { id: randomBytes(8).toString("base64url"), eposta: "", ad: "Misafir", tuz: "", ozet: "", olusturma: Date.now(), sonGiris: 0, saglayicilar: ["anonim"] };
    d.uyeler.push(u);
    return { uye: acik(u), oturum: yeniOturum(d, u, "anonim") };
  });
}
