import "server-only";
import { createHash, randomBytes } from "crypto";
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { ekipOku, ekipRolu, ekipSil, uyeDizinindenCikar, uyeDizinineEkle, uyeProjeleri, YetkiHatasi } from "./ekipDepo";
import { calisanlar } from "./ajanCalisan";
import { IZLEYICI_HATASI } from "./ekipOrtak";
import {
  altAlanGecerli, altAlanUret, dosyaFarklari, type FormGonderimi, type Proje, type ProjeErisim, type ProjeOzet, type ProjeTur, type Surum,
} from "./tipler";

/**
 * Vayra Build sunucu deposu (.veri/build/…).
 *  projeler/<id>.json   tam proje (dosyalar, sürümler, arayüz mesajları, ayarlar)
 *  sahip/<hash>.json    sahibin proje kimlikleri
 *  altalan/<ad>         yayın adresi → proje kimliği
 *  alanadi/<alan>       özel alan adı → proje kimliği
 *  sohbet/<id>.json     ajanın API geçmişi (yalnız sona eklenir; düşünme blokları değiştirilmeden saklanır)
 *  form/<id>.json       form gönderimleri (gelen kutusu)
 * Sahiplik: istemcinin rastgele sahip anahtarı başlıkta gelir, burada yalnız özeti saklanır.
 */

const KOK = path.join(DEPO_KOK, "build");
const D = { proje: path.join(KOK, "projeler"), sahip: path.join(KOK, "sahip"), altalan: path.join(KOK, "altalan"), alanadi: path.join(KOK, "alanadi"), sohbet: path.join(KOK, "sohbet"), form: path.join(KOK, "form"), cop: path.join(KOK, "cop"), copProje: path.join(KOK, "cop-proje") };
const KIMLIK = /^[A-Za-z0-9_-]{12}$/;
export const SURUM_SINIRI = 60;
export const DOSYA_SINIRI = 400_000;
export const PROJE_SINIRI = 4_000_000;

export const sahipOzeti = (anahtar: string) => createHash("sha256").update(`vayra-build:${anahtar}`).digest("hex").slice(0, 40);
export const sahipAnahtariGecerli = (a: string | null): a is string => !!a && /^[A-Za-z0-9_-]{24,80}$/.test(a);
const yeniKimlik = () => randomBytes(9).toString("base64url").slice(0, 12);

async function oku<T>(dosya: string): Promise<T | null> {
  try { return JSON.parse(await readFile(dosya, "utf8")) as T; } catch { return null; }
}
async function yaz(dosya: string, veri: unknown) {
  await mkdir(path.dirname(dosya), { recursive: true });
  await writeFile(dosya, JSON.stringify(veri));
}

type KayitliProje = Proje & { sahip: string };

/**
 * Proje → sahip özeti. Sahiplik hiç değişmez; yazarken sahibi korumak için tam dosyayı yeniden okumamak üzere
 * her okumada not edilir. Silinen projeler boş dizgeyle işaretlenir (geç biten bir yazım projeyi geri getirmesin).
 */
const GS = globalThis as unknown as { __vayraProjeSahibi?: Map<string, string> };
const SAHIPLER = (GS.__vayraProjeSahibi ??= new Map<string, string>());
const SILINDI = "";

export async function projeOkuHam(id: string): Promise<KayitliProje | null> {
  if (!KIMLIK.test(id)) return null;
  const p = await oku<KayitliProje>(path.join(D.proje, `${id}.json`));
  if (p?.sahip) SAHIPLER.set(id, p.sahip);
  return p;
}
/** Kayıtlı sahip özeti; proje yoksa null. Dosya var ama o an okunamıyorsa (yarım yazım) bir kez daha dener. */
async function kayitliSahip(id: string): Promise<string | null> {
  const s = SAHIPLER.get(id);
  if (s !== undefined) return s || null;
  const p = await projeOkuHam(id);
  if (p) return p.sahip;
  try { await stat(path.join(D.proje, `${id}.json`)); } catch { return null; }
  await new Promise((r) => setTimeout(r, 150));
  const p2 = await projeOkuHam(id);
  if (p2) return p2.sahip;
  throw new Error("Proje dosyası okunamadı; biraz sonra yeniden dene.");
}

/** İsteği yapanın projedeki yeri: sahip, düzenleyici, izleyici ya da erişimi yok (null). */
export async function projeErisimi(id: string, sahip: string): Promise<ProjeErisim | null> {
  if (!KIMLIK.test(id)) return null;
  const asil = await kayitliSahip(id).catch(() => null);
  if (!asil) return null;
  const oz = sahipOzeti(sahip);
  return asil === oz ? "sahip" : ekipRolu(id, oz);
}
/** Yalnız sahibe açık işlemler (silme, ekip, GitHub, ödeme, alan adı, topluluk) için. */
export async function projeSahibiMi(id: string, sahip: string): Promise<boolean> {
  return (await projeErisimi(id, sahip)) === "sahip";
}

/** Sahibi ya da ekip üyesi olunan proje (sahip özetini istemciye geri vermez). Rol denetimi yazarken yapılır. */
export async function projeOku(id: string, sahip: string): Promise<Proje | null> {
  const p = await projeOkuHam(id);
  if (!p) return null;
  const oz = sahipOzeti(sahip);
  if (p.sahip !== oz && !(await ekipRolu(id, oz))) return null;
  const { sahip: _s, ...temiz } = p; void _s;
  return temiz;
}
/**
 * Projeyi yazar. Yazan sahip ya da düzenleyici olmalı; dosyadaki sahip her zaman korunur (üye yazınca sahip değişmez).
 * İzleyici ve ekip dışındakiler için YetkiHatasi (403) atar. Dosya yoksa (yeni proje) yazan sahip olur.
 */
export async function projeYaz(p: Proje, sahip: string) {
  const boyut = Object.values(p.dosyalar).reduce((t, d) => t + d.length, 0);
  if (boyut > PROJE_SINIRI) throw new Error("Proje çok büyüdü (4 MB sınırı). Büyük varlıkları dosya yerine bağlantıyla kullan.");
  const oz = sahipOzeti(sahip);
  if (SAHIPLER.get(p.id) === SILINDI) throw new Error("Bu proje silinmiş.");
  const asil = (await kayitliSahip(p.id)) ?? oz;
  if (asil !== oz) {
    const rol = await ekipRolu(p.id, oz);
    if (rol === "izleyici") throw new YetkiHatasi(IZLEYICI_HATASI);
    if (rol !== "duzenleyici") throw new YetkiHatasi("Bu projeye erişimin yok.");
  }
  p.surumler = p.surumler.slice(-SURUM_SINIRI);
  // Yanıta özel alanlar dosyaya girmez.
  const { ekipRol: _r, ekipSayisi: _n, ...temiz } = p; void _r; void _n;
  await yaz(path.join(D.proje, `${p.id}.json`), { ...temiz, sahip: asil });
  SAHIPLER.set(p.id, asil);
}

function ozetle(p: KayitliProje): ProjeOzet {
  // Kaldığın yerden devam: son gerçek istek (hata düzeltme ve ayraç değil), yayından sonra biriken sürümler.
  const son = [...(p.mesajlar ?? [])].reverse().find((m) => m.rol === "kullanici" && !m.duzeltme && m.metin?.trim());
  const yayinNo = p.yayin?.surumNo ?? 0;
  const yayinlanmamis = p.surumler.filter((s) => s.no > yayinNo).length;
  return {
    id: p.id, ad: p.ad, tur: p.tur, olusturma: p.olusturma, guncelleme: p.guncelleme, kapak: p.kapak, yayin: p.yayin, yildiz: p.yildiz, klasor: p.klasor, taslak: p.taslak, altAlan: p.ayarlar.altAlan, surumSayisi: p.surumler.length, sonSurumNo: p.surumler.at(-1)?.no ?? 0,
    ...(son ? { sonIstek: { metin: son.metin.replace(/\s+/g, " ").trim().slice(0, 200), zaman: son.zaman } } : {}),
    yayinlanmamis, ...(calisanlar.has(p.id) ? { calisiyor: true } : {}),
  };
}

/**
 * Sahibin projeleri ve ekibine katıldığı projeler (ekipRol alanıyla). Paylaşılan projelerde yıldız ve klasör
 * sahibin düzeni olduğu için gönderilmez. Ekipten çıkarılan ya da silinen projeler üye dizininden temizlenir.
 */
export async function sahipProjeleri(sahip: string): Promise<ProjeOzet[]> {
  const oz = sahipOzeti(sahip);
  const liste = (await oku<string[]>(path.join(D.sahip, `${oz}.json`))) ?? [];
  const sonuc: ProjeOzet[] = [];
  for (const id of liste) {
    const p = await projeOkuHam(id);
    if (!p) continue;
    const n = (await ekipOku(id)).uyeler.length;
    sonuc.push({ ...ozetle(p), ...(n ? { uyeSayisi: n } : {}) });
  }
  const kendi = new Set(liste);
  for (const id of await uyeProjeleri(oz)) {
    if (kendi.has(id)) continue;
    const [p, e] = await Promise.all([projeOkuHam(id), ekipOku(id)]);
    const u = e.uyeler.find((x) => x.oz === oz);
    if (!p || !u) { uyeDizinindenCikar(oz, id).catch(() => {}); continue; }
    const { yildiz: _y, klasor: _k, ...o } = ozetle(p); void _y; void _k;
    sonuc.push({ ...o, ekipRol: u.rol, uyeSayisi: e.uyeler.length, ...(e.sahipAd ? { sahipAd: e.sahipAd } : {}) });
  }
  // Çalışma alanı projeleri (lib/alan/build): üyesi olunan alanlara bağlı, kendine ait olmayan projeler.
  const gorulen = new Set(sonuc.map((p) => p.id));
  for (const x of await import("@/lib/alan/build").then((m) => m.alanProjeleriListe(oz)).catch(() => [])) {
    if (gorulen.has(x.id)) continue;
    gorulen.add(x.id);
    const p = await projeOkuHam(x.id);
    if (!p || p.sahip === oz) continue;
    const { yildiz: _y, klasor: _k, ...o } = ozetle(p); void _y; void _k;
    sonuc.push({ ...o, ekipRol: x.rol, sahipAd: x.alanAd });
  }
  return sonuc.sort((a, b) => b.guncelleme - a.guncelleme);
}

async function altAlanBos(ad: string, haricId?: string) {
  try { const id = (await readFile(path.join(D.altalan, ad), "utf8")).trim(); return id === haricId; } catch { return true; }
}
export async function altAlanBul(ad: string): Promise<string> {
  let aday = altAlanUret(ad);
  for (let i = 0; i < 20; i++) {
    if (await altAlanBos(aday)) return aday;
    aday = `${altAlanUret(ad).slice(0, 26)}-${randomBytes(2).toString("hex")}`;
  }
  return `proje-${randomBytes(4).toString("hex")}`;
}
/** Alt alan adını projeye bağlar; başkasınınsa hata. */
export async function altAlanAyir(ad: string, id: string, eski?: string) {
  if (!altAlanGecerli(ad)) throw new Error("Adres yalnız küçük harf, rakam ve tire içerebilir (3-40 karakter).");
  if (!(await altAlanBos(ad, id))) throw new Error("Bu adres başka bir projede kullanılıyor.");
  await mkdir(D.altalan, { recursive: true });
  await writeFile(path.join(D.altalan, ad), id);
  if (eski && eski !== ad) await rm(path.join(D.altalan, eski), { force: true });
}
export async function altAlandanProje(ad: string) {
  if (!altAlanGecerli(ad)) return null;
  try { return await projeOkuHam((await readFile(path.join(D.altalan, ad), "utf8")).trim()); } catch { return null; }
}

export async function alanAdiBagla(alan: string, id: string) {
  const mevcut = await alanAdindanKimlik(alan);
  if (mevcut && mevcut !== id) throw new Error("Bu alan adı başka bir Vayra projesine bağlı. Önce oradan kaldır.");
  await mkdir(D.alanadi, { recursive: true });
  await writeFile(path.join(D.alanadi, alan), id);
}
export async function alanAdiKaldir(alan: string, id: string) {
  if ((await alanAdindanKimlik(alan)) === id) await rm(path.join(D.alanadi, alan), { force: true });
}
export async function alanAdindanKimlik(alan: string) {
  if (!/^[a-z0-9.-]{3,253}$/.test(alan)) return null;
  try { return (await readFile(path.join(D.alanadi, alan), "utf8")).trim(); } catch { return null; }
}

export async function projeOlustur(g: { ad: string; tur: ProjeTur; dosyalar: Record<string, string>; sahip: string; kapak?: string; sablon?: string; aciklama?: string }): Promise<Proje> {
  const id = yeniKimlik();
  const altAlan = await altAlanBul(g.ad);
  await altAlanAyir(altAlan, id);
  const surum: Surum = { id: yeniKimlik(), no: 1, zaman: Date.now(), aciklama: g.aciklama ?? "Proje oluşturuldu", kaynak: g.sablon ? "sablon" : "ajan", dosyalar: g.dosyalar, degisen: dosyaFarklari({}, g.dosyalar) };
  const p: Proje = {
    id, ad: g.ad, tur: g.tur, olusturma: Date.now(), guncelleme: Date.now(), onizlemeBelirteci: randomBytes(12).toString("base64url"),
    dosyalar: g.dosyalar, surumler: Object.keys(g.dosyalar).length ? [surum] : [], mesajlar: [], yayin: null, alanAdlari: [], kapak: g.kapak, sablon: g.sablon,
    ayarlar: { altAlan, gorunurluk: "herkes", seo: { baslik: g.ad, aciklama: "", indeks: true }, sirlar: [], rozet: true, talimat: "" },
  };
  await projeYaz(p, g.sahip);
  const liste = (await oku<string[]>(path.join(D.sahip, `${sahipOzeti(g.sahip)}.json`))) ?? [];
  await yaz(path.join(D.sahip, `${sahipOzeti(g.sahip)}.json`), [id, ...liste.filter((x) => x !== id)]);
  // Sahip bir çalışma alanında çalışıyorsa proje o alana bağlanır (lib/alan/build).
  await import("@/lib/alan/build").then((m) => m.yeniProjeyiAlanaBagla(id, g.sahip)).catch(() => {});
  return p;
}

/** Yalnız sahip siler; ekip dosyası ve üyelerin dizin kayıtları da gider. */
export async function projeSil(id: string, sahip: string) {
  const p = await projeOkuHam(id);
  if (!p || p.sahip !== sahipOzeti(sahip)) return false;
  SAHIPLER.set(id, SILINDI);
  await ekipSil(id).catch(() => {});
  await rm(path.join(D.proje, `${id}.json`), { force: true });
  await rm(path.join(D.sohbet, `${id}.json`), { force: true });
  await rm(path.join(D.form, `${id}.json`), { force: true });
  // Vayra Veri, üyelik, analitik ve kapak dosyaları da projeyle birlikte gider.
  for (const [k, u] of [["veri", "json"], ["gorev", "json"], ["uye", "json"], ["analitik", "json"], ["kapak", "webp"], ["bulut", "json"], ["bulut-bildirim", "json"], ["bulut-kullanim", "json"], ["analitik-ek", "json"], ["ai-kullanim", "json"], ["veri-test", "json"], ["veri-ortam", "json"], ["odeme", "json"], ["buyume", "json"], ["buyume-ek", "json"], ["isletme", "json"], ["bulut-zaman", "json"], ["bulut-sorgu", "json"], ["bulut-kanca", "json"], ["bulut-denetim", "ndjson"], ["bulut-veri-ayar", "json"], ["bulut-oda", "json"]] as const) await rm(path.join(KOK, k, `${id}.${u}`), { force: true });
  // Klasör tutan depolar: günlükler, dosya kovaları, veritabanı yedekleri.
  for (const k of ["gunluk", "depolama", "veri-yedek", "oturum", "isletme-kayit", "depolama-onbellek", "depolama-parca"]) await rm(path.join(KOK, k, id), { recursive: true, force: true });
  // Kayıt geçmişi canlı ve test ortamı için ayrı klasörlerde.
  for (const k of [id, `${id}-test`]) await rm(path.join(KOK, "veri-gecmis", k), { recursive: true, force: true });
  await rm(path.join(D.altalan, p.ayarlar.altAlan), { force: true });
  for (const a of p.alanAdlari) await alanAdiKaldir(a.ad, id);
  const dosya = path.join(D.sahip, `${sahipOzeti(sahip)}.json`);
  const liste = (await oku<string[]>(dosya)) ?? [];
  await yaz(dosya, liste.filter((x) => x !== id));
  return true;
}

/* ───────────── Çöp kutusu ───────────── */

/** Silinen projeler 30 gün çöp kutusunda kalır; sonra kalıcı silinir. */
export const COP_GUN = 30;
export type CopKaydi = { id: string; ad: string; tur: ProjeTur; kapak?: string; silinme: number; altAlan: string; alanAdlari: string[]; yayindaydi: boolean; surumSayisi: number };
const copDosyasi = (oz: string) => path.join(D.cop, `${oz}.json`);
const copKilit = new Map<string, Promise<unknown>>();
/** Sahibin çöp listesi üzerinde sıralı işlem (aynı anda iki silme listeyi ezmesin). */
function copIslem<T>(oz: string, f: (l: CopKaydi[]) => Promise<{ l: CopKaydi[]; sonuc: T }>): Promise<T> {
  const onceki = copKilit.get(oz) ?? Promise.resolve();
  const is = onceki.catch(() => {}).then(async () => {
    const { l, sonuc } = await f((await oku<CopKaydi[]>(copDosyasi(oz))) ?? []);
    await yaz(copDosyasi(oz), l);
    return sonuc;
  });
  copKilit.set(oz, is);
  return is;
}

/**
 * Projeyi çöp kutusuna taşır: dosya çöp klasörüne gider, yayın adresi ve alan adları boşa çıkar (site kapanır),
 * süren ajan turu durur. Veritabanı, dosyalar, sohbet ve ekip yerinde kalır; geri alınınca hepsi döner.
 */
export async function projeCopeAt(id: string, sahip: string): Promise<boolean> {
  const p = await projeOkuHam(id);
  const oz = sahipOzeti(sahip);
  if (!p || p.sahip !== oz) return false;
  calisanlar.get(id)?.abort();
  SAHIPLER.set(id, SILINDI);
  await mkdir(D.copProje, { recursive: true });
  await rename(path.join(D.proje, `${id}.json`), path.join(D.copProje, `${id}.json`));
  await rm(path.join(D.altalan, p.ayarlar.altAlan), { force: true });
  for (const a of p.alanAdlari) await alanAdiKaldir(a.ad, id);
  const dosya = path.join(D.sahip, `${oz}.json`);
  await yaz(dosya, ((await oku<string[]>(dosya)) ?? []).filter((x) => x !== id));
  const kayit: CopKaydi = { id, ad: p.ad, tur: p.tur, kapak: p.kapak, silinme: Date.now(), altAlan: p.ayarlar.altAlan, alanAdlari: p.alanAdlari.map((a) => a.ad), yayindaydi: !!p.yayin, surumSayisi: p.surumler.length };
  await copIslem(oz, async (l) => ({ l: [kayit, ...l.filter((x) => x.id !== id)], sonuc: null }));
  return true;
}

/** Çöpteki projeyi geri getirir. Yayın adresi bu arada alındıysa yeni adres verilir; alan adı başkasına bağlandıysa bağlanmaz. */
export async function projeGeriAl(id: string, sahip: string): Promise<{ ok: boolean; altAlan?: string; uyari?: string }> {
  const oz = sahipOzeti(sahip);
  const k = await copIslem(oz, async (l) => ({ l: l.filter((x) => x.id !== id), sonuc: l.find((x) => x.id === id) ?? null }));
  if (!k) return { ok: false };
  const p = await oku<KayitliProje>(path.join(D.copProje, `${id}.json`));
  if (!p || p.sahip !== oz) return { ok: false };
  const uyarilar: string[] = [];
  if (!(await altAlanBos(p.ayarlar.altAlan, id))) {
    const yeni = await altAlanBul(p.ad);
    uyarilar.push(`Eski yayın adresi başka bir projede kullanılıyor; yeni adres: ${yeni}.`);
    p.ayarlar.altAlan = yeni;
  }
  await mkdir(D.altalan, { recursive: true });
  await writeFile(path.join(D.altalan, p.ayarlar.altAlan), id);
  const kalan = [];
  for (const a of p.alanAdlari) {
    const m = await alanAdindanKimlik(a.ad);
    if (m && m !== id) { uyarilar.push(`${a.ad} başka bir projeye bağlandığı için kaldırıldı.`); continue; }
    await alanAdiBagla(a.ad, id); kalan.push(a);
  }
  p.alanAdlari = kalan;
  await mkdir(D.proje, { recursive: true });
  await writeFile(path.join(D.proje, `${id}.json`), JSON.stringify(p));
  await rm(path.join(D.copProje, `${id}.json`), { force: true });
  SAHIPLER.set(id, p.sahip);
  const dosya = path.join(D.sahip, `${oz}.json`);
  await yaz(dosya, [id, ...((await oku<string[]>(dosya)) ?? []).filter((x) => x !== id)]);
  // Çöpteyken üye dizinlerinden düşen ekip üyeleri yeniden eklenir.
  for (const u of (await ekipOku(id)).uyeler) await uyeDizinineEkle(u.oz, id);
  return { ok: true, altAlan: p.ayarlar.altAlan, ...(uyarilar.length ? { uyari: uyarilar.join(" ") } : {}) };
}

/** Çöpteki projeyi kalıcı siler (veritabanı, dosyalar, sohbet, ekip dahil). */
export async function copKaliciSil(id: string, sahip: string): Promise<boolean> {
  const oz = sahipOzeti(sahip);
  const vardi = await copIslem(oz, async (l) => ({ l: l.filter((x) => x.id !== id), sonuc: l.some((x) => x.id === id) }));
  const kaynak = path.join(D.copProje, `${id}.json`);
  const p = await oku<KayitliProje>(kaynak);
  if (!p || p.sahip !== oz) return vardi;
  // projeSil ana klasördeki dosyadan çalışır: önce geri koy, hemen sil (yazım kilidi SILINDI ile kapalı kalır).
  await rename(kaynak, path.join(D.proje, `${id}.json`));
  await projeSil(id, sahip);
  return true;
}

/** Çöp listesi; süresi dolanlar bu sırada kalıcı silinir. */
export async function copListesi(sahip: string): Promise<CopKaydi[]> {
  const oz = sahipOzeti(sahip);
  const l = (await oku<CopKaydi[]>(copDosyasi(oz))) ?? [];
  const sinir = Date.now() - COP_GUN * 86_400_000;
  for (const x of l.filter((x) => x.silinme < sinir)) await copKaliciSil(x.id, sahip).catch(() => {});
  return l.filter((x) => x.silinme >= sinir);
}

/** Dosyaları değiştirir ve (değişiklik varsa) yeni sürüm ekler. */
export function surumEkle(p: Proje, yeni: Record<string, string>, aciklama: string, kaynak: Surum["kaynak"]): Surum | null {
  const degisen = dosyaFarklari(p.dosyalar, yeni);
  if (!degisen.length) return null;
  const s: Surum = { id: yeniKimlik(), no: (p.surumler.at(-1)?.no ?? 0) + 1, zaman: Date.now(), aciklama, kaynak, dosyalar: yeni, degisen };
  p.dosyalar = yeni;
  p.surumler.push(s);
  p.guncelleme = Date.now();
  return s;
}

/* ── Ajan API geçmişi: yalnız sona eklenir ──
 * gorulen: ajanın son turda gördüğü dosyaların özeti (sonraki turda yalnız değişenler gönderilir).
 * kesik: son tur durduruldu ya da hata verdi. */
export type AjanGecmisi = { mesajlar: unknown[]; gorulen: Record<string, string>; kesik?: boolean;
  /** Geri dönüşten sonra ajana bir kez verilecek önceki konuşma özeti (geçmiş sıfırlandı, kalan mesajlar özetlendi). */
  ozet?: string };

/**
 * Ajan bağlamını sıfırlar: API geçmişi boşalır, bir sonraki turda bütün dosyalar baştan gönderilir. ozet verilirse
 * (geri dönüşte kalan mesajlar) bir sonraki tura bir kez eklenir; yeni sohbette verilmez, ajan önceki konuşmayı görmez.
 */
export async function ajanBaglamiSifirla(id: string, ozet?: string) {
  await sohbetYaz(id, { mesajlar: [], gorulen: {}, ...(ozet ? { ozet: ozet.slice(0, 12_000) } : {}) });
}
export async function sohbetOku(id: string): Promise<AjanGecmisi> {
  const v = await oku<AjanGecmisi | unknown[]>(path.join(D.sohbet, `${id}.json`));
  if (Array.isArray(v)) return { mesajlar: v, gorulen: {} };
  return v ?? { mesajlar: [], gorulen: {} };
}
export async function sohbetYaz(id: string, g: AjanGecmisi) {
  await yaz(path.join(D.sohbet, `${id}.json`), g);
}
export const icerikOzeti = (s: string) => createHash("sha1").update(s).digest("hex").slice(0, 16);

/* ── Form gelen kutusu ── */
export async function formlariOku(id: string): Promise<FormGonderimi[]> {
  return (await oku<FormGonderimi[]>(path.join(D.form, `${id}.json`))) ?? [];
}
export async function formEkle(id: string, g: Omit<FormGonderimi, "id" | "zaman">) {
  const l = await formlariOku(id);
  if (l.length >= 5000) throw new Error("Gelen kutusu dolu.");
  const kayit: FormGonderimi = { ...g, id: yeniKimlik(), zaman: Date.now() };
  await yaz(path.join(D.form, `${id}.json`), [kayit, ...l]);
  return kayit;
}
export async function formlariYaz(id: string, l: FormGonderimi[]) { await yaz(path.join(D.form, `${id}.json`), l); }

export async function tumProjeKimlikleri() {
  try { return (await readdir(D.proje)).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)); } catch { return []; }
}
