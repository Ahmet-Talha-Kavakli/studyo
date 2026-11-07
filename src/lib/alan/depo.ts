import "server-only";
import { createHash, randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { dizinListe, epostaNormal, hesapOku, jsonOku, jsonYaz, kilitle, satirEkle, sil, type HesapKaydi } from "@/lib/hesap/depo";
import { alanDefteriAc } from "@/lib/hesap/kredi";
import type { PlanKimligi } from "@/lib/hesap/tipler";
import {
  ALAN_DESENI, ALAN_UYE_SINIRI, DAVET_GUN, ROL_AD, alanRengi, type AlanGunlukKaydi, type AlanGunlukTuru, type AlanOzet, type AlanRol,
} from "./tipler";

/**
 * Çalışma alanı deposu (.veri/alan/…). Her alan tek dosya; bir alana yazım tek sırada (kilitle).
 *  alan/<id>.json        alan kaydı: ad, logo, plan, üyeler (rol, sınır), davetler (belirtecin yalnız özeti), alan adı, projeler
 *  uye/<uid>.json        hesabın üye olduğu alanlar (seçici ve silme için dizin)
 *  etkin/<uid>.json      hesabın son seçtiği alan (çerezsiz istekler ve arka plan Build işleri için)
 *  davet/<özet>.json     davet belirteci özeti → alan, davet kimliği, bitiş
 *  alanadi/<ad>.json     doğrulanmış e-posta alan adı → alan
 *  proje/<projeId>.json  Build projesi → alan
 *  gunluk/<id>.jsonl     denetim günlüğü (yalnız sona eklenir)
 *  kullanim/<id>.jsonl   üye harcamaları; sayac/<id>.json bu ayın üye toplamları
 *  kitaplik/<id>.jsonl   alan kitaplığı
 *  medya/<id>/…          alan logosu
 * Kredi havuzu hesap kredi defterinde, alan kimliğiyle tutulur (lib/hesap/kredi).
 */
export const ALAN_KOK = path.join(DEPO_KOK, "alan");
export const AD = {
  alan: path.join(ALAN_KOK, "alan"),
  uye: path.join(ALAN_KOK, "uye"),
  etkin: path.join(ALAN_KOK, "etkin"),
  davet: path.join(ALAN_KOK, "davet"),
  alanadi: path.join(ALAN_KOK, "alanadi"),
  proje: path.join(ALAN_KOK, "proje"),
  gunluk: path.join(ALAN_KOK, "gunluk"),
  kullanim: path.join(ALAN_KOK, "kullanim"),
  sayac: path.join(ALAN_KOK, "sayac"),
  kitaplik: path.join(ALAN_KOK, "kitaplik"),
  medya: path.join(ALAN_KOK, "medya"),
};

export class AlanHatasi extends Error { constructor(mesaj: string, public durum = 400, public kod?: string) { super(mesaj); } }

export interface UyeKaydi {
  uid: string;
  rol: AlanRol;
  katilma: number;
  /** Aylık kredi sınırı: null ya da yok ise alan varsayılanı. 0 harcamayı kapatır. */
  sinir?: number | null;
  davetEden?: string;
  kaynak?: "davet" | "alanadi" | "kurucu" | "devir";
}
export interface DavetKaydi {
  id: string;
  ozet: string;
  eposta: string;
  rol: Exclude<AlanRol, "sahip">;
  olusturma: number;
  bitis: number;
  davetEden: string;
  gonderildi: boolean;
}
export interface AlanKaydi {
  surum: 1;
  id: string;
  ad: string;
  logo?: string;
  olusturma: number;
  guncelleme: number;
  sahip: string;
  uyeler: UyeKaydi[];
  davetler: DavetKaydi[];
  plan: PlanKimligi;
  /** Ödenmiş alan planının bitişi (dönemlik ödeme). */
  planBitis?: number;
  varsayilanSinir: number | null;
  ayar: { uyeDavet: boolean; yeniProjeAlana: boolean };
  alanAdi?: { alan: string; txt: string; yontem?: "eposta" | "dns"; dogrulandi?: number; acik: boolean; rol: "uye" | "izleyici" };
  projeler: { id: string; ekleyen: string; eklenme: number }[];
}

export const yeniAlanKimligi = () => `a_${randomBytes(12).toString("base64url")}`;
const alanDosyasi = (id: string) => path.join(AD.alan, `${id}.json`);
const uyeDosyasi = (uid: string) => path.join(AD.uye, `${uid}.json`);
const etkinDosyasi = (uid: string) => path.join(AD.etkin, `${uid}.json`);
export const davetOzeti = (b: string) => createHash("sha256").update(`alan-davet:${b}`).digest("hex");
const davetDosyasi = (oz: string) => path.join(AD.davet, `${oz}.json`);
const alanAdiDosyasi = (ad: string) => path.join(AD.alanadi, `${createHash("sha256").update(`alanadi:${ad}`).digest("hex").slice(0, 40)}.json`);
export const projeDosyasi = (pid: string) => path.join(AD.proje, `${pid.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40)}.json`);
export const adTemizle = (s: unknown, en = 50) => String(s ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, en);

/* ── Okuma, yazma ── */

export async function alanOku(id: string): Promise<AlanKaydi | null> {
  if (!ALAN_DESENI.test(id)) return null;
  const a = await jsonOku<AlanKaydi>(alanDosyasi(id));
  if (a) { a.davetler ??= []; a.projeler ??= []; a.ayar ??= { uyeDavet: false, yeniProjeAlana: true }; }
  return a;
}

/** Alanı kilit altında okur, değiştirir, yazar. f AlanHatasi atarsa yazılmaz. Alan yoksa 404. */
export async function alanGuncelle<T>(id: string, f: (a: AlanKaydi) => T | Promise<T>): Promise<{ alan: AlanKaydi; sonuc: T }> {
  return kilitle(`alan:${id}`, async () => {
    const a = await alanOku(id);
    if (!a) throw new AlanHatasi("Çalışma alanı bulunamadı.", 404, "yok");
    const sonuc = await f(a);
    const simdi = Date.now();
    a.davetler = a.davetler.filter((d) => d.bitis > simdi - 30 * 86_400_000);
    a.guncelleme = simdi;
    await jsonYaz(alanDosyasi(id), a);
    return { alan: a, sonuc };
  });
}

export const uyeBul = (a: AlanKaydi, uid: string) => a.uyeler.find((u) => u.uid === uid);
export const uyeSiniri = (a: AlanKaydi) => ALAN_UYE_SINIRI[a.plan];

/* ── Üyelik dizini ── */

export async function uyeAlanlari(uid: string): Promise<string[]> {
  const v = await jsonOku<string[]>(uyeDosyasi(uid));
  return Array.isArray(v) ? v.filter((x) => ALAN_DESENI.test(x)) : [];
}
export function uyeDiziniEkle(uid: string, id: string) {
  return kilitle(`alan-uye:${uid}`, async () => { const l = await uyeAlanlari(uid); if (!l.includes(id)) await jsonYaz(uyeDosyasi(uid), [...l, id]); });
}
export function uyeDizinindenCikar(uid: string, id: string) {
  return kilitle(`alan-uye:${uid}`, async () => {
    const l = await uyeAlanlari(uid);
    const kalan = l.filter((x) => x !== id);
    if (!kalan.length) await sil(uyeDosyasi(uid)); else if (kalan.length !== l.length) await jsonYaz(uyeDosyasi(uid), kalan);
    if ((await etkinOku(uid)) === id) await sil(etkinDosyasi(uid));
  });
}

/** Hesabın üye olduğu alanların özetleri (dizinde kalıp üyeliği düşenler temizlenir). */
export async function alanlarim(uid: string): Promise<AlanOzet[]> {
  const sonuc: AlanOzet[] = [];
  for (const id of await uyeAlanlari(uid)) {
    const a = await alanOku(id);
    const u = a && uyeBul(a, uid);
    if (!a || !u) { await uyeDizinindenCikar(uid, id); continue; }
    sonuc.push(alanOzeti(a, u.rol));
  }
  return sonuc;
}
export const alanOzeti = (a: AlanKaydi, rol: AlanRol): AlanOzet => ({ id: a.id, ad: a.ad, ...(a.logo ? { logo: a.logo } : {}), renk: alanRengi(a.id), rol, plan: a.plan, uyeSayisi: a.uyeler.length });

/* ── Etkin alan (sunucu kaydı) ── */

export async function etkinOku(uid: string): Promise<string | null> {
  const v = await jsonOku<{ alan: string }>(etkinDosyasi(uid));
  return v?.alan && ALAN_DESENI.test(v.alan) ? v.alan : null;
}
export async function etkinYaz(uid: string, id: string | null) {
  if (id) await jsonYaz(etkinDosyasi(uid), { alan: id, zaman: Date.now() }); else await sil(etkinDosyasi(uid));
}

/* ── Denetim günlüğü ── */

export async function gunlukEkle(id: string, tur: AlanGunlukTuru, kim: { uid: string; ad: string }, ayrinti: string, ip?: string) {
  const k: AlanGunlukKaydi = { id: `g_${randomBytes(8).toString("base64url")}`, zaman: Date.now(), tur, uid: kim.uid, ad: kim.ad.slice(0, 80), ayrinti: ayrinti.slice(0, 300), ...(ip ? { ip } : {}) };
  await satirEkle(path.join(AD.gunluk, `${id}.jsonl`), k);
}

/** jsonl dosyasının son kısmı (en yeni sonda). En çok sinir bayt okunur. */
export async function jsonlOku<T>(dosya: string, sinir = 4_000_000): Promise<T[]> {
  const { open } = await import("fs/promises");
  let fh;
  try { fh = await open(dosya, "r"); } catch { return []; }
  try {
    const { size } = await fh.stat();
    const oku = Math.min(size, sinir);
    const b = Buffer.alloc(oku);
    await fh.read(b, 0, oku, size - oku);
    const satirlar = b.toString("utf8").split("\n").filter(Boolean);
    if (oku < size) satirlar.shift();
    const l: T[] = [];
    for (const s of satirlar) { try { l.push(JSON.parse(s)); } catch { /* yarım satır */ } }
    return l;
  } finally { await fh.close(); }
}
export const gunlukOku = (id: string) => jsonlOku<AlanGunlukKaydi>(path.join(AD.gunluk, `${id}.jsonl`), 2_000_000);

/* ── Oluşturma ── */

const SAHIP_ALAN_SINIRI = 10;
const UYELIK_SINIRI = 50;

export async function alanOlustur(h: HesapKaydi, adHam: unknown, ip?: string): Promise<AlanKaydi> {
  const ad = adTemizle(adHam);
  if (ad.length < 2) throw new AlanHatasi("Alana en az 2 karakterlik bir ad ver.", 400, "ad");
  const mevcut = await alanlarim(h.uid);
  if (mevcut.filter((x) => x.rol === "sahip").length >= SAHIP_ALAN_SINIRI) throw new AlanHatasi(`En çok ${SAHIP_ALAN_SINIRI} çalışma alanının sahibi olabilirsin.`, 409, "sinir");
  if (mevcut.length >= UYELIK_SINIRI) throw new AlanHatasi(`En çok ${UYELIK_SINIRI} çalışma alanına üye olabilirsin.`, 409, "sinir");
  const simdi = Date.now();
  const a: AlanKaydi = {
    surum: 1, id: yeniAlanKimligi(), ad, olusturma: simdi, guncelleme: simdi, sahip: h.uid,
    uyeler: [{ uid: h.uid, rol: "sahip", katilma: simdi, kaynak: "kurucu" }], davetler: [], plan: "baslangic", varsayilanSinir: null,
    ayar: { uyeDavet: false, yeniProjeAlana: true }, projeler: [],
  };
  await jsonYaz(alanDosyasi(a.id), a);
  await alanDefteriAc(a.id);
  await uyeDiziniEkle(h.uid, a.id);
  await gunlukEkle(a.id, "olustur", { uid: h.uid, ad: h.profil.ad }, `"${ad}" adıyla oluşturuldu`, ip);
  return a;
}

/* ── Logo ── */

const LOGO_SINIRI = 400_000;
const UZANTI: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

export async function logoKaydet(id: string, deger: string): Promise<string> {
  const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(deger);
  if (!m) throw new AlanHatasi("Logo PNG, JPEG ya da WebP olmalı.");
  const bayt = Buffer.from(m[2], "base64");
  if (bayt.length > LOGO_SINIRI) throw new AlanHatasi("Logo en çok 400 KB olabilir.");
  const imza = bayt.subarray(0, 12).toString("hex");
  const uyar = m[1] === "image/png" ? imza.startsWith("89504e47") : m[1] === "image/jpeg" ? imza.startsWith("ffd8ff") : imza.startsWith("52494646") && imza.slice(16, 24) === "57454250";
  if (!uyar) throw new AlanHatasi("Logo dosyası bozuk ya da türü uyuşmuyor.");
  const ad = `logo-${createHash("sha256").update(bayt).digest("hex").slice(0, 16)}.${UZANTI[m[1]]}`;
  const dizin = path.join(AD.medya, id);
  await sil(dizin);
  await mkdir(dizin, { recursive: true });
  await writeFile(path.join(dizin, ad), bayt, { mode: 0o600 });
  return `/api/alan/medya/${id}/${ad}`;
}
export const logoSil = (id: string) => sil(path.join(AD.medya, id));

/* ── Davet ── */

export const DAVET_SINIRI = 50;

/** Davet belirteci üretir, alana yazar (aynı adrese önceki davet geçersizleşir). Ham belirteç yalnız dönüşte bulunur. */
export async function davetEkle(a: AlanKaydi, g: { eposta: string; rol: Exclude<AlanRol, "sahip">; davetEden: string }): Promise<{ davet: DavetKaydi; belirtec: string }> {
  const eposta = epostaNormal(g.eposta);
  for (const eski of a.davetler.filter((d) => d.eposta === eposta)) await sil(davetDosyasi(eski.ozet));
  a.davetler = a.davetler.filter((d) => d.eposta !== eposta);
  if (a.davetler.filter((d) => d.bitis > Date.now()).length >= DAVET_SINIRI) throw new AlanHatasi(`Bekleyen davet sayısı en çok ${DAVET_SINIRI} olabilir. Eski davetleri geri al.`, 409, "sinir");
  const belirtec = randomBytes(32).toString("base64url");
  const simdi = Date.now();
  const d: DavetKaydi = { id: `d_${randomBytes(8).toString("base64url")}`, ozet: davetOzeti(belirtec), eposta, rol: g.rol, olusturma: simdi, bitis: simdi + DAVET_GUN * 86_400_000, davetEden: g.davetEden, gonderildi: false };
  a.davetler.unshift(d);
  await jsonYaz(davetDosyasi(d.ozet), { alan: a.id, davet: d.id, bitis: d.bitis });
  return { davet: d, belirtec };
}
export async function davetDiziniSil(oz: string) { await sil(davetDosyasi(oz)); }

/** Belirteçten davet: geçersiz, süresi dolmuş ya da kullanılmışsa null. */
export async function davetBul(belirtec: string): Promise<{ alan: AlanKaydi; davet: DavetKaydi } | null> {
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(belirtec)) return null;
  const oz = davetOzeti(belirtec);
  const v = await jsonOku<{ alan: string; davet: string; bitis: number }>(davetDosyasi(oz));
  if (!v) return null;
  if (v.bitis < Date.now()) { await sil(davetDosyasi(oz)); return null; }
  const a = await alanOku(v.alan);
  const d = a?.davetler.find((x) => x.id === v.davet && x.ozet === oz);
  if (!a || !d) { await sil(davetDosyasi(oz)); return null; }
  return { alan: a, davet: d };
}

/** Üye ekler (çağıran alanGuncelle içindedir). Plan üye sınırı aşılıyorsa hata. */
export function uyeEkleHam(a: AlanKaydi, u: UyeKaydi) {
  if (uyeBul(a, u.uid)) throw new AlanHatasi("Zaten bu çalışma alanının üyesisin.", 409, "uye");
  const s = uyeSiniri(a);
  if (s !== null && a.uyeler.length >= s) throw new AlanHatasi(`Bu alanın planı en çok ${s} üyeye izin veriyor. Alan sahibi planı yükseltmeli.`, 409, "kapasite");
  a.uyeler.push(u);
}

/* ── Alan adı ── */

/** Herkese açık e-posta servisleri: bu alan adlarıyla kendiliğinden katılım açılamaz. */
export const GENEL_ALANLAR = new Set([
  "gmail.com", "googlemail.com", "hotmail.com", "hotmail.com.tr", "outlook.com", "outlook.com.tr", "live.com", "msn.com", "yahoo.com", "yahoo.com.tr", "ymail.com",
  "icloud.com", "me.com", "mac.com", "yandex.com", "yandex.com.tr", "yandex.ru", "proton.me", "protonmail.com", "aol.com", "gmx.com", "gmx.de", "mail.com",
  "zoho.com", "mynet.com", "windowslive.com", "hey.com", "tutanota.com", "fastmail.com", "qq.com", "163.com",
]);
export const ALAN_ADI_DESENI = /^(?=.{4,100}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;
export const epostaAlanAdi = (e: string) => epostaNormal(e).split("@")[1] ?? "";

export async function alanAdiSahibi(ad: string): Promise<string | null> {
  return (await jsonOku<{ alan: string }>(alanAdiDosyasi(ad)))?.alan ?? null;
}
export async function alanAdiDiziniYaz(ad: string, id: string | null) {
  if (id) await jsonYaz(alanAdiDosyasi(ad), { alan: id }); else await sil(alanAdiDosyasi(ad));
}

/** Doğrulanmış e-posta alan adıyla davetsiz katılabileceği alan (varsa). */
export async function katilabilirAlan(h: HesapKaydi): Promise<{ alan: AlanKaydi; rol: "uye" | "izleyici" } | null> {
  if (!h.epostaDogrulandi) return null;
  const ad = epostaAlanAdi(h.email);
  if (!ad || GENEL_ALANLAR.has(ad)) return null;
  const id = await alanAdiSahibi(ad);
  const a = id ? await alanOku(id) : null;
  if (!a?.alanAdi || a.alanAdi.alan !== ad || !a.alanAdi.dogrulandi || !a.alanAdi.acik || uyeBul(a, h.uid)) return null;
  return { alan: a, rol: a.alanAdi.rol };
}

/* ── Proje bağı ── */

export async function projeAlani(pid: string): Promise<string | null> {
  return (await jsonOku<{ alan: string }>(projeDosyasi(pid)))?.alan ?? null;
}
export async function projeAlaniYaz(pid: string, id: string | null) {
  if (id) await jsonYaz(projeDosyasi(pid), { alan: id }); else await sil(projeDosyasi(pid));
}

/* ── Ad çözümü (üyelerin görünen adları) ── */

export async function kisiAdi(uid: string): Promise<{ ad: string; email: string; avatar?: string } | null> {
  const h = await hesapOku(uid);
  return h ? { ad: h.profil.ad || h.email.split("@")[0], email: h.email, ...(h.profil.avatar ? { avatar: h.profil.avatar } : {}) } : null;
}

/* ── Silme ── */

/** Alanın bütün dosyaları (kayıt, dizinler, günlükler, kitaplık, logo, proje bağları). Kredi defteri çağıranca silinir. */
export async function alanDosyalariniSil(a: AlanKaydi) {
  for (const u of a.uyeler) await uyeDizinindenCikar(u.uid, a.id).catch(() => {});
  for (const d of a.davetler) await sil(davetDosyasi(d.ozet));
  if (a.alanAdi && (await alanAdiSahibi(a.alanAdi.alan)) === a.id) await alanAdiDiziniYaz(a.alanAdi.alan, null);
  for (const p of a.projeler) if ((await projeAlani(p.id)) === a.id) await projeAlaniYaz(p.id, null);
  for (const d of [AD.gunluk, AD.kullanim, AD.kitaplik]) await sil(path.join(d, `${a.id}.jsonl`));
  await sil(path.join(AD.sayac, `${a.id}.json`));
  await logoSil(a.id);
  await sil(alanDosyasi(a.id));
}

export const rolMetni = (r: AlanRol) => ROL_AD[r];
export { dizinListe };
