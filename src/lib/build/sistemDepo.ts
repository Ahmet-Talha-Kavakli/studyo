import "server-only";
import { createHash, randomBytes } from "crypto";
import { mkdir, readdir, readFile, rename, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { sahipOzeti } from "./depo";
import { adimGoc, sablonKur, type Adim, type AdimTuru, type GirdiAlani, type NotKarti, type Tetikleyici, type TetikTuru } from "./sistemKatalog";
import { TUM_SABLONLAR } from "./sistemSablonlar";

/**
 * Sistemler (otomasyonlar), depo sürüm 2.
 *   sistemler/<id>.json            sistem (taslak akış + yayındaki akışın kopyası + deneme verisi)
 *   sistem-surum/<id>.json         yayınlanan sürümler (ad, not, akış)
 *   sistem-calisma/<id>.json       çalışma dizini (özetler; 30 gün ya da 2000 çalışma)
 *   sistem-calisma/<id>/<cid>.json çalışmanın tamamı (adım girdileri, çıktıları, bekleme durumu)
 *   sistem-aktif.json              kuyrukta, çalışan ve bekleyen çalışmalar (zamanlayıcı ve onay kutusu için)
 *   sistem-tetik.json              tetik dizini (form, veri, zaman, sistem, rss → sistemler)
 *   sistem-anahtar.json            anahtar dizini (gelen e-posta adresi, dışarı açma anahtarı → sistem)
 * Eski biçim (tek dosyada son 100 çalışma, düz adım listesi) okunurken yeni biçime taşınır.
 */
export type CalismaDurum = "kuyrukta" | "calisiyor" | "bekliyor" | "basarili" | "basarisiz" | "durdu" | "iptal";
export type AdimDurum = "basarili" | "basarisiz" | "atlandi" | "calisiyor" | "bekliyor";
export type AdimSonucu = {
  /** Çalışma içindeki benzersiz anahtar: adım kimliği, döngü içinde kimlik@tur. */
  anahtar: string; id: string; ad: string; tur: AdimTuru; durum: AdimDurum;
  /** Adıma giren çözülmüş ayarlar (Data In). */
  girdi?: unknown;
  /** Metin biçimi (geriye dönük) ve JSON çıktı (Data Out). */
  cikti?: string; veri?: unknown; hata?: string;
  sure: number; kredi: number; deneme?: number; baslangic?: number;
  ek?: { gorseller?: string[]; url?: string; loglar?: string[]; alt?: AltCagri };
  /** Yönlendiricide seçilen dal(lar). */
  dal?: string[];
  sabit?: boolean;
};
export type Bekleme = {
  anahtar: string; adimId: string; tur: "sure" | "tarih" | "webhook" | "onay" | "tekrar" | "alt";
  /** Sistemi çağır: bitmesi beklenen alt çalışma. */
  alt?: { sistemId: string; calismaId: string };
  zaman?: number; zamanAsimi?: number; belirtecOzeti?: string; zamanAsiminda?: "devam" | "hata";
  baslik?: string; icerik?: string; duzenlenebilir?: boolean; varsayilan?: "onay" | "ret";
};
/** Sistemi çağır adımının bağlantısı: çağıran çalışmada adım sonucunda, çağrılan çalışmada ust olarak. */
export type AltCagri = { sistemId: string; calismaId: string; sistemAd: string; durum?: CalismaDurum };
export type UstCagri = { sistemId: string; calismaId: string; sistemAd: string; adimAnahtar: string; adimAd: string; derinlik: number; bekle: boolean };
export type CalismaTetikTuru = TetikTuru | "deneme" | "cagri" | "api" | "mcp";
export type Calisma = {
  id: string; sistemId: string;
  /** Sistemdeki sıra numarası ({{calisma.no}}). */
  no?: number;
  tetik: { tur: CalismaTetikTuru; veri?: unknown };
  /** Bu çalışmayı Sistemi çağır adımıyla başlatan çalışma. */
  ust?: UstCagri;
  baslangic: number; bitis?: number; durum: CalismaDurum; adimlar: AdimSonucu[]; kredi: number; hata?: string;
  /** Çalışan sürüm numarası; taslak denemelerinde "taslak" ve akışın kopyası. */
  surum?: number | "taslak"; akis?: Adim[];
  bekleme?: Bekleme;
  /** Paralel dallarda aynı anda bekleyen adımlar (onay, süre, dış çağrı, alt sistem); bekleme bunların ilki. */
  beklemeler?: Bekleme[];
  /** Devam verisi (dış çağrı, onay kararı) bekleme anahtarına göre. */
  devam?: Record<string, unknown>;
  kaynak?: { tur: "devam" | "yeniden"; calismaId: string };
  hataAdimi?: string; hataEleAlindi?: boolean; aciklama?: { metin: string; zaman: number };
  /** Yanıt ver adımının yanıtı (form sayfası, sohbet, API ve MCP bunu döndürür). */
  yanit?: CalismaYaniti;
  /** Buradan itibaren çalıştırmada başlangıç adımı (önceki adımlar deneme verisinden). */
  baslangicAdimi?: string;
  /** Çalışmaya özel devam belirteci ({{calisma.devam}} adresi) ve sitenin kökeni. */
  belirtec?: string; koken?: string;
};
export type CalismaYaniti = { metin: string; json?: unknown; durum: number; zaman: number };
export type CalismaOzeti = {
  id: string; sistemId: string; durum: CalismaDurum; baslangic: number; bitis?: number; tetikTur: string; kredi: number;
  hata?: string; surum?: number | "taslak"; adimSayisi: number; hataAdimi?: string; kaynak?: string; ara: string; beklemeTur?: string;
  /** Çağıran sistemin adı (Sistemi çağır). */
  ust?: string; no?: number;
};
/** Tetiğin gerçek olayı (son 10; deneme verisi seçmek için). */
export type TetikOlayi = { id: string; zaman: number; tur: string; veri: unknown };
export type TestSonuc = { girdi?: unknown; veri?: unknown; cikti?: string; hata?: string; zaman: number; sure?: number; kaynak: "dene" | "calisma" | "elle" };
export type Surum = { no: number; ad: string; not: string; zaman: number; tetikler: Tetikleyici[]; adimlar: Adim[]; model: string };
export type SistemAyar = {
  model: string; ajanId?: string; krediTavani: number; ustUsteHata: number;
  /** Aynı anda en çok kaç çalışma (fazlası kuyrukta bekler). */
  esZamanli: number;
  /** Bir çalışma başarısız olunca: bu sistemi çalıştır ve/veya bu adrese bildir. */
  hataSistemi?: string; hataWebhook?: string;
  /** Bir başarılı çalışmanın elle yapılsa kaç dakika süreceği (içgörülerde kazanılan süre). */
  dakika?: number;
  /** Hız sınırı: pencere (dakika) içinde en çok sayi çalışma başlar; fazlası kuyrukta sırasını bekler. */
  hiz?: { sayi: number; dakika: number };
  /** Art arda iki çalışmanın başlaması arasında en az bu kadar saniye (kuyruktakiler için). */
  aralik?: number;
  /** Bir çalışmanın toplam en uzun süresi (dakika, 1 ile 10; bekleme süreleri sayılmaz). */
  zamanAsimi?: number;
  /** Hata e-postası (Resend sırrıyla): her hatada ya da her sabah 09.00'da özet. */
  hataEposta?: { alici: string; mod: "anlik" | "gunluk" };
};
export type Disari = { api: boolean; mcp: boolean; anahtarOzeti: string; anahtarSifreli: string; anahtarSonu: string; aracAdi: string; aracAciklama: string; olusturma: number };
export type Sistem = {
  id: string; ad: string; aciklama: string; durum: "taslak" | "acik" | "duraklatildi"; duraklatmaNedeni?: string;
  tetikler: Tetikleyici[]; adimlar: Adim[];
  ayar: SistemAyar;
  webhookOzeti?: string; zamanSon: Record<string, number>;
  olusturma: number; guncelleme: number; sablon?: string;
  ozet: { calisma: number; basarili: number; basarisiz: number; sonCalisma?: number; sonDurum?: CalismaDurum; kredi: number };
  /** Yayındaki akış (canlı tetikler bunu çalıştırır). Yoksa eski sistem: taslak çalışır. */
  yayin?: { surum: number; zaman: number; tetikler: Tetikleyici[]; adimlar: Adim[] };
  surumSayaci?: number;
  /** Deneme verisi: tetik örneği, adımların son ya da sabitlenmiş çıktıları. */
  test?: {
    tetik?: unknown; sonTetik?: unknown; adimlar?: Record<string, TestSonuc>; sabit?: string[];
    /** Son 10 gerçek tetik olayı; sabitlenen tetik verisi (denemelerde gelen olay bunu ezmez); test adresi dinlemesi. */
    olaylar?: TetikOlayi[]; sabitTetik?: unknown; dinle?: number;
  };
  /** Tuvaldeki not kartları, girdi alanları (form, çağrı, API, MCP), liste düzeni. */
  notlar?: NotKarti[]; girdi?: GirdiAlani[]; yildiz?: boolean; etiketler?: string[];
  /** API ve MCP olarak dışarı açma (anahtar şifreli; arama için özeti). */
  disari?: Disari;
  /** Test web kancası anahtarı ve gelen e-posta adresinin anahtarı. */
  testAnahtari?: string; epostaAnahtari?: string;
  /** Günlük hata özetine eklenecek hatalar ve son bildirim sorunu (ör. Resend sırrı yok). */
  hataOzeti?: { zaman: number; calisma: string; hata: string; adim: string }[]; bildirimSorunu?: string;
  /** Sistem testleri: vakalar ve son 20 koşu (sistemDegerlendir.ts). */
  testler?: import("./sistemDegerlendir").TestVakasi[]; degerlendirmeler?: import("./sistemDegerlendir").TestKosusu[];
  /** Form sayfası (/s/f/<anahtar>) ve sohbet sayfası (/s/c/<anahtar>) anahtarları. */
  formAnahtari?: string; sohbetAnahtari?: string;
  /** RSS tetiklerinin yoklama durumu (tetik kimliğine göre). */
  rss?: Record<string, { son: number; gorulen: string[]; hata?: string; baslik?: string; okunan?: number }>;
  /** Servis ve işletme tetiklerinin yoklama durumu (tetik kimliğine göre): görülen kimlikler, son durumlar (aşama değişimi için). */
  yoklama?: Record<string, { son: number; gorulen: string[]; durumlar?: Record<string, string>; hata?: string; okunan?: number; yeni?: number; imza?: string }>;
  calismaSayaci?: number;
  /** Son açılış zamanı (kaçırılan zamanlı çalışmalar bundan önceye bakmaz). */
  acilis?: number;
  /** Arka plan çalışmalarında devam adresi için sitenin kökeni (son düzenlemeden). */
  koken?: string;
};

const KOK = path.join(DEPO_KOK, "build");
const dosya = (id: string) => path.join(KOK, "sistemler", `${id}.json`);
const surumDosyasi = (id: string) => path.join(KOK, "sistem-surum", `${id}.json`);
const dizinDosyasi = (id: string) => path.join(KOK, "sistem-calisma", `${id}.json`);
const calismaDosyasi = (id: string, cid: string) => path.join(KOK, "sistem-calisma", id, `${cid}.json`);
const sahipDizini = (sahipOz: string) => path.join(KOK, "sistem-sahip", `${sahipOz}.json`);
const TETIK = path.join(KOK, "sistem-tetik.json");
const AKTIF = path.join(KOK, "sistem-aktif.json");
const KIMLIK = /^[A-Za-z0-9_-]{10}$/;
const CKIMLIK = /^[A-Za-z0-9_-]{8,16}$/;
export const SAKLAMA = { gun: 30, adet: 2000 };

async function oku<T>(f: string): Promise<T | null> { try { return JSON.parse(await readFile(f, "utf8")) as T; } catch { return null; } }
/** Yarım yazılmış dosya kalmasın: geçici dosyaya yaz, sonra taşı. */
async function yaz(f: string, v: unknown) {
  await mkdir(path.dirname(f), { recursive: true });
  const g = `${f}.${randomBytes(4).toString("hex")}.tmp`;
  await writeFile(g, JSON.stringify(v));
  try { await rename(g, f); } catch { await writeFile(f, JSON.stringify(v)); await rm(g, { force: true }); }
}
type Kayitli = Sistem & { sahip: string };
export const yeniKimlik = (n = 6) => randomBytes(n).toString("base64url").slice(0, n).replace(/[^A-Za-z0-9]/g, "x");
export const webhookOzeti = (k: string) => createHash("sha256").update(`vayra-sistem:${k}`).digest("hex");
export const belirtecOzeti = (k: string) => createHash("sha256").update(`vayra-devam:${k}`).digest("hex");

/** Süreç geneli durum (her rota paketi ve yeniden yüklenen modül aynı kilitleri ve önbelleği görsün). */
const G = globalThis as unknown as { __vayraSistemDepo2?: { kilitler: Map<string, Promise<unknown>>; dizin: Map<string, CalismaOzeti[]> } };
const ORTAK: { kilitler: Map<string, Promise<unknown>>; dizin: Map<string, CalismaOzeti[]> } = (G.__vayraSistemDepo2 ??= { kilitler: new Map(), dizin: new Map() });
const kilitler = ORTAK.kilitler;
export function kilitle<T>(anahtar: string, f: () => Promise<T>): Promise<T> {
  const p = (kilitler.get(anahtar) ?? Promise.resolve()).catch(() => {}).then(f);
  kilitler.set(anahtar, p);
  p.finally(() => { if (kilitler.get(anahtar) === p) kilitler.delete(anahtar); }).catch(() => {});
  return p;
}

/* ── Göç ── */
function sistemGoc(s: Sistem): Sistem {
  s.adimlar = (s.adimlar ?? []).map(adimGoc);
  s.tetikler = s.tetikler ?? [];
  s.ayar = { model: "claude-sonnet-5-5", krediTavani: 200, ustUsteHata: 0, esZamanli: 1, ...((s.ayar as Partial<SistemAyar> | undefined) ?? {}) };
  if (!Number.isFinite(s.ayar.esZamanli) || s.ayar.esZamanli < 1) s.ayar.esZamanli = 1;
  if (s.yayin) s.yayin = { ...s.yayin, adimlar: (s.yayin.adimlar ?? []).map(adimGoc) };
  s.test ??= {};
  s.zamanSon ??= {};
  return s;
}
/** İstemciye giden sistem (webhook özeti ve dışarı açma anahtarı gizli). */
export function sistemAcik(s: Sistem): Omit<Sistem, "webhookOzeti" | "disari"> & { disari?: Omit<Disari, "anahtarOzeti" | "anahtarSifreli"> } {
  const { webhookOzeti: _w, disari, ...acik } = s; void _w;
  if (!disari) return acik;
  const { anahtarOzeti: _o, anahtarSifreli: _s, ...d } = disari; void _o; void _s;
  return { ...acik, disari: d };
}
/** Yayındaki akış (eski sistemlerde taslak). */
export function canliAkis(s: Sistem): { surum?: number; tetikler: Tetikleyici[]; adimlar: Adim[] } {
  return s.yayin ? { surum: s.yayin.surum, tetikler: s.yayin.tetikler, adimlar: s.yayin.adimlar } : { tetikler: s.tetikler, adimlar: s.adimlar };
}

export async function sistemGetirOz(id: string, sahipOz: string): Promise<Sistem | null> {
  if (!KIMLIK.test(id)) return null;
  const s = await oku<Kayitli>(dosya(id));
  if (!s || s.sahip !== sahipOz) return null;
  const { sahip: _s, ...t } = s; void _s;
  return sistemGoc(t);
}
export const sistemGetir = (id: string, sahip: string) => sistemGetirOz(id, sahipOzeti(sahip));
/** Sahip denetimi olmadan (webhook ve zamanlayıcı için); sahip özetiyle döner. */
export async function sistemHam(id: string): Promise<{ s: Sistem; sahipOz: string } | null> {
  if (!KIMLIK.test(id)) return null;
  const x = await oku<Kayitli>(dosya(id));
  if (!x) return null;
  const { sahip, ...s } = x;
  return { s: sistemGoc(s), sahipOz: sahip };
}

export function sistemGuncelleOz(id: string, sahipOz: string, f: (s: Sistem) => void | string): Promise<{ sistem: Sistem; hata?: undefined } | { hata: string; sistem?: undefined } | null> {
  return kilitle(`s:${id}`, async () => {
    const s = await sistemGetirOz(id, sahipOz);
    if (!s) return null;
    const h = f(s);
    if (typeof h === "string") return { hata: h };
    s.guncelleme = Date.now();
    await yaz(dosya(id), { ...s, sahip: sahipOz });
    await tetikDiziniGuncelle(s);
    return { sistem: s };
  });
}
export const sistemGuncelle = (id: string, sahip: string, f: (s: Sistem) => void | string) => sistemGuncelleOz(id, sahipOzeti(sahip), f);

export async function sistemOlustur(sahip: string, g: Partial<Sistem> & { sablon?: string }): Promise<Sistem> {
  const id = randomBytes(8).toString("base64url").slice(0, 10);
  const t = g.sablon ? TUM_SABLONLAR.find((x) => x.id === g.sablon) : undefined;
  const s: Sistem = {
    id, ad: (g.ad ?? t?.ad ?? "Yeni sistem").slice(0, 80), aciklama: (g.aciklama ?? t?.aciklama ?? "").slice(0, 400), durum: "taslak",
    tetikler: g.tetikler ?? (t ? [{ ...t.tetik, id: yeniKimlik() } as Tetikleyici] : [{ id: yeniKimlik(), tur: "elle" }]),
    adimlar: g.adimlar ?? (t ? sablonKur(t, () => yeniKimlik()) : []),
    ayar: { model: "claude-sonnet-5-5", krediTavani: 200, ustUsteHata: 0, esZamanli: 1, ...(g.ayar ?? {}) },
    zamanSon: {}, olusturma: Date.now(), guncelleme: Date.now(), sablon: t?.id,
    ozet: { calisma: 0, basarili: 0, basarisiz: 0, kredi: 0 }, test: {},
    ...(t?.girdi?.length ? { girdi: JSON.parse(JSON.stringify(t.girdi)) as GirdiAlani[] } : g.girdi ? { girdi: g.girdi } : {}),
  };
  // Form sayfası ve sohbet tetikleri: herkese açık adres ve deneme anahtarı hemen oluşsun.
  const genelAnahtar = () => randomBytes(12).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "").padEnd(16, "0").slice(0, 16);
  if (s.tetikler.some((x) => x.tur === "formSayfasi")) s.formAnahtari = genelAnahtar();
  if (s.tetikler.some((x) => x.tur === "sohbet")) s.sohbetAnahtari = genelAnahtar();
  if (s.tetikler.some((x) => x.tur === "formSayfasi" || x.tur === "sohbet" || x.tur === "webhook")) s.testAnahtari = randomBytes(12).toString("base64url");
  if (s.tetikler.some((x) => x.tur === "webhook" && x.dogrulama === "")) for (const x of s.tetikler) if (x.tur === "webhook" && x.dogrulama === "") x.dogrulama = randomBytes(12).toString("base64url");
  const oz = sahipOzeti(sahip);
  await yaz(dosya(id), { ...s, sahip: oz });
  if (s.formAnahtari || s.sohbetAnahtari) await anahtarDiziniDegistir((d) => { if (s.formAnahtari) d[`form:${s.formAnahtari}`] = id; if (s.sohbetAnahtari) d[`sohbet:${s.sohbetAnahtari}`] = id; });
  await kilitle(`sahip:${oz}`, async () => {
    const l = (await oku<string[]>(sahipDizini(oz))) ?? [];
    await yaz(sahipDizini(oz), [id, ...l.filter((x) => x !== id)].slice(0, 300));
  });
  return s;
}
export async function sistemKimlikleri(sahipOz: string): Promise<string[]> { return ((await oku<string[]>(sahipDizini(sahipOz))) ?? []).slice(0, 300); }
export async function sistemleriListele(sahip: string): Promise<Sistem[]> {
  const oz = sahipOzeti(sahip);
  const o: Sistem[] = [];
  for (const id of (await sistemKimlikleri(oz)).slice(0, 200)) { const s = await sistemGetirOz(id, oz); if (s) o.push(s); }
  return o.sort((a, b) => b.guncelleme - a.guncelleme);
}
export async function sistemSil(id: string, sahip: string) {
  const oz = sahipOzeti(sahip);
  const s = await sistemGetirOz(id, oz);
  if (!s) return false;
  await rm(dosya(id), { force: true });
  await rm(dizinDosyasi(id), { force: true });
  await rm(path.join(KOK, "sistem-calisma", id), { recursive: true, force: true });
  await rm(surumDosyasi(id), { force: true });
  await rm(istatDosyasi(id), { force: true });
  await rm(path.join(KOK, "sistem-sohbet", id), { recursive: true, force: true });
  await (await import("./sistemDepoAdim")).depoSistemSil(oz, id).catch(() => {});
  dizinOnbellek.delete(id);
  await kilitle(`sahip:${oz}`, async () => {
    const l = (await oku<string[]>(sahipDizini(oz))) ?? [];
    await yaz(sahipDizini(oz), l.filter((x) => x !== id));
  });
  await aktifDegistir((a) => { for (const [k, v] of Object.entries(a)) if (v.sistemId === id) delete a[k]; });
  await onayGecmisiTemizle(oz, id);
  await tetikDiziniGuncelle({ ...s, durum: "taslak", tetikler: [], yayin: undefined });
  await anahtarDiziniDegistir((d) => { for (const [k, v] of Object.entries(d)) if (v === id) delete d[k]; });
  return true;
}

/* ── Sürümler ── */
export async function surumleriOku(id: string): Promise<Surum[]> { return ((await oku<Surum[]>(surumDosyasi(id))) ?? []).map((v) => ({ ...v, adimlar: (v.adimlar ?? []).map(adimGoc) })); }
export async function surumOku(id: string, no: number): Promise<Surum | null> { return (await surumleriOku(id)).find((v) => v.no === no) ?? null; }
export function surumEkle(id: string, v: Surum): Promise<void> {
  return kilitle(`v:${id}`, async () => {
    const l = await surumleriOku(id);
    await yaz(surumDosyasi(id), [v, ...l.filter((x) => x.no !== v.no)].slice(0, 100));
  });
}
export function surumAdiDegistir(id: string, no: number, ad: string, not?: string): Promise<boolean> {
  return kilitle(`v:${id}`, async () => {
    const l = await surumleriOku(id);
    const v = l.find((x) => x.no === no);
    if (!v) return false;
    v.ad = ad; if (not !== undefined) v.not = not;
    await yaz(surumDosyasi(id), l);
    return true;
  });
}

/* ── Çalışmalar ── */
const dizinOnbellek = ORTAK.dizin;
const AKTIF_DURUM = new Set<CalismaDurum>(["kuyrukta", "calisiyor", "bekliyor"]);

function adimSonucGoc(x: AdimSonucu & { anahtar?: string }): AdimSonucu {
  if (x.anahtar) return x;
  let veri: unknown = undefined;
  if (typeof x.cikti === "string") { try { veri = /^\s*[[{]/.test(x.cikti) ? JSON.parse(x.cikti) : { metin: x.cikti }; } catch { veri = { metin: x.cikti }; } }
  return { ...x, anahtar: x.id, veri };
}
function calismaGoc(c: Calisma, sistemId: string): Calisma {
  return { ...c, sistemId: c.sistemId ?? sistemId, adimlar: (c.adimlar ?? []).map(adimSonucGoc) };
}
export function calismaOzeti(c: Calisma): CalismaOzeti {
  const ara = [c.hata ?? "", c.adimlar.map((a) => `${a.ad} ${a.hata ?? ""}`).join(" "), JSON.stringify(c.tetik.veri ?? "").slice(0, 600)].join(" ").slice(0, 1200);
  return { id: c.id, sistemId: c.sistemId, durum: c.durum, baslangic: c.baslangic, bitis: c.bitis, tetikTur: c.tetik.tur, kredi: c.kredi, hata: c.hata?.slice(0, 300), surum: c.surum, adimSayisi: c.adimlar.length, hataAdimi: c.hataAdimi, kaynak: c.kaynak?.tur, ara, beklemeTur: c.bekleme?.tur, ust: c.ust?.sistemAd, no: c.no };
}

/** Çalışma dizini (yeniden eskiye). Eski tek dosya biçimi burada taşınır. */
export function calismaOzetleri(id: string): Promise<CalismaOzeti[]> {
  const o = dizinOnbellek.get(id);
  if (o) return Promise.resolve(o);
  return kilitle(`c:${id}`, async () => {
    const h = dizinOnbellek.get(id);
    if (h) return h;
    const ham = (await oku<(CalismaOzeti | Calisma)[]>(dizinDosyasi(id))) ?? [];
    let l: CalismaOzeti[];
    if (ham.some((x) => Array.isArray((x as Calisma).adimlar))) {
      l = [];
      for (const x of ham as Calisma[]) {
        const c = calismaGoc(x, id);
        if (c.durum === "calisiyor") { c.durum = "basarisiz"; c.hata = "Sunucu yeniden başladığı için yarıda kaldı."; c.bitis ??= c.baslangic; }
        await yaz(calismaDosyasi(id, c.id), c);
        l.push(calismaOzeti(c));
      }
      await yaz(dizinDosyasi(id), l);
    } else l = ham as CalismaOzeti[];
    dizinOnbellek.set(id, l);
    return l;
  });
}
export async function calismaOku(id: string, cid: string): Promise<Calisma | null> {
  if (!CKIMLIK.test(cid)) return null;
  await calismaOzetleri(id);
  const c = await oku<Calisma>(calismaDosyasi(id, cid));
  return c ? calismaGoc(c, id) : null;
}
/** Son n çalışmanın tamamı. */
export async function calismalariOku(id: string, n = 20): Promise<Calisma[]> {
  const o: Calisma[] = [];
  for (const x of (await calismaOzetleri(id)).slice(0, n)) { const c = await calismaOku(id, x.id); if (c) o.push(c); }
  return o;
}
/** Çalışmayı yazar ve dizini günceller; saklama sınırını aşanları siler (etkin olanlar hep kalır). */
export function calismaYaz(id: string, c: Calisma, dizin = true): Promise<void> {
  return kilitle(`c:${id}`, async () => {
    await yaz(calismaDosyasi(id, c.id), c);
    if (!dizin) return;
    const l = dizinOnbellek.get(id) ?? (((await oku<CalismaOzeti[]>(dizinDosyasi(id))) ?? []).filter((x) => !Array.isArray((x as unknown as Calisma).adimlar)));
    const oz = calismaOzeti(c);
    const i = l.findIndex((x) => x.id === c.id);
    if (i >= 0) l[i] = oz; else l.unshift(oz);
    l.sort((a, b) => b.baslangic - a.baslangic);
    const sinir = Date.now() - SAKLAMA.gun * 86_400_000;
    const kalan: string[] = [], silinen: string[] = [];
    for (const x of l) (AKTIF_DURUM.has(x.durum) || (x.baslangic >= sinir && kalan.length < SAKLAMA.adet) ? kalan : silinen).push(x.id);
    const yeni = l.filter((x) => !silinen.includes(x.id));
    dizinOnbellek.set(id, yeni);
    await yaz(dizinDosyasi(id), yeni);
    for (const s of silinen) await rm(calismaDosyasi(id, s), { force: true });
  });
}
/** Çalışmayı kilit altında oku-değiştir-yaz (bekleme kararı, açıklama). */
export function calismaDegistir(id: string, cid: string, f: (c: Calisma) => void | string): Promise<{ c: Calisma } | { hata: string } | null> {
  return kilitle(`r:${cid}`, async () => {
    const c = await calismaOku(id, cid);
    if (!c) return null;
    const h = f(c);
    if (typeof h === "string") return { hata: h };
    await calismaYaz(id, c);
    return { c };
  });
}
export async function calismaSil(id: string, cid: string): Promise<void> {
  await kilitle(`c:${id}`, async () => {
    const l = (dizinOnbellek.get(id) ?? (await oku<CalismaOzeti[]>(dizinDosyasi(id))) ?? []).filter((x) => x.id !== cid);
    dizinOnbellek.set(id, l);
    await yaz(dizinDosyasi(id), l);
    await rm(calismaDosyasi(id, cid), { force: true });
  });
  await aktifDegistir((a) => { delete a[cid]; });
}

/* ── Etkin çalışmalar (kuyruk, bekleme, onay) ── */
export type AktifKayit = { sistemId: string; sahipOz: string; durum: CalismaDurum; olusturma: number; zaman?: number; zamanAsimi?: number; tur?: Bekleme["tur"] };
export async function aktifOku(): Promise<Record<string, AktifKayit>> { return (await oku<Record<string, AktifKayit>>(AKTIF)) ?? {}; }
export function aktifDegistir(f: (a: Record<string, AktifKayit>) => void): Promise<void> {
  return kilitle("aktif", async () => { const a = await aktifOku(); f(a); await yaz(AKTIF, a); });
}
/** Çalışmanın etkin dizindeki kaydını durumuna göre ekler ya da siler. */
/** Çalışmanın bütün bekleyen adımları (tek bekleme ve paralel dallardakiler). */
export function beklemeListesi(c: Pick<Calisma, "bekleme" | "beklemeler">): Bekleme[] {
  const l = [...(c.beklemeler ?? [])];
  if (c.bekleme && !l.some((x) => x.anahtar === c.bekleme!.anahtar)) l.unshift(c.bekleme);
  return l;
}
export function aktifIsle(c: Calisma, sahipOz: string): Promise<void> {
  return aktifDegistir((a) => {
    if (!AKTIF_DURUM.has(c.durum)) { delete a[c.id]; return; }
    const l = [...(c.beklemeler ?? []), ...(c.bekleme && !(c.beklemeler ?? []).some((x) => x.anahtar === c.bekleme!.anahtar) ? [c.bekleme] : [])];
    const enAz = (k: "zaman" | "zamanAsimi") => { const z = l.map((x) => x[k]).filter((x): x is number => typeof x === "number"); return z.length ? Math.min(...z) : undefined; };
    a[c.id] = { sistemId: c.sistemId, sahipOz, durum: c.durum, olusturma: c.baslangic, zaman: enAz("zaman"), zamanAsimi: enAz("zamanAsimi"), tur: c.durum === "bekliyor" ? c.bekleme?.tur : undefined };
  });
}

/* ── Tetik dizini (yayındaki tetikler) ── */
type Dizin = Record<string, string[]>;
async function tetikDiziniGuncelle(s: Sistem) {
  await kilitle("tetik", async () => {
    const d = (await oku<Dizin>(TETIK)) ?? {};
    for (const k of Object.keys(d)) { d[k] = d[k].filter((x) => x !== s.id); if (!d[k].length) delete d[k]; }
    if (s.durum === "acik") for (const t of canliAkis(s).tetikler) {
      for (const anahtar of tetikAnahtarlari(t)) (d[anahtar] ??= []).push(s.id);
    }
    await yaz(TETIK, d);
  });
}
/** Tetiğin dizin anahtarları (veri tablosunda olay başına bir anahtar; eski kayıtlarda yalnız ekleme). */
export function tetikAnahtarlari(t: Tetikleyici): string[] {
  switch (t.tur) {
    case "form": return t.projeId ? [`form:${t.projeId}`] : [];
    case "veri": return t.projeId && t.koleksiyon ? (t.olaylar?.length ? t.olaylar : ["ekle"]).map((o) => `${o === "ekle" ? "veri" : `veri-${o}`}:${t.projeId}:${t.koleksiyon}`) : [];
    case "zaman": return ["zaman"];
    case "sistem": return t.sistemId ? [`sistem:${t.sistemId}`] : [];
    case "rss": return t.adres ? ["rss"] : [];
    case "servis": return t.olay ? ["yoklama"] : [];
    case "isletme": return t.projeId ? ["yoklama"] : [];
    case "odeme": return t.projeId ? [`odeme:${t.projeId}`] : [];
    default: return [];
  }
}
export async function tetikDinleyenler(anahtar: string): Promise<string[]> { return [...new Set(((await oku<Dizin>(TETIK)) ?? {})[anahtar] ?? [])]; }

/* ── Günlük istatistik (içgörüler; çalışma saklama süresinden bağımsız, 400 gün) ── */
export type GunIstat = { n: number; b: number; h: number; s: number; k: number };
export type Istatistik = Record<string, { c?: GunIstat; d?: GunIstat }>;
const istatDosyasi = (id: string) => path.join(KOK, "sistem-istat", `${id}.json`);
const trGun = (t: number) => new Date(t + 3 * 3600_000).toISOString().slice(0, 10);
function istatEkle(x: Istatistik, c: Pick<CalismaOzeti, "baslangic" | "bitis" | "durum" | "kredi" | "tetikTur">) {
  const g = (x[trGun(c.baslangic)] ??= {});
  const k = c.tetikTur === "deneme" ? "d" : "c";
  const v = (g[k] ??= { n: 0, b: 0, h: 0, s: 0, k: 0 });
  v.n++; if (c.durum === "basarili") v.b++; if (c.durum === "basarisiz") v.h++;
  v.s += Math.max(0, (c.bitis ?? c.baslangic) - c.baslangic); v.k += c.kredi || 0;
}
/** İstatistik dosyası (yoksa mevcut çalışma dizininden kurulur). */
export function istatistikOku(id: string): Promise<Istatistik> {
  return kilitle(`istat:${id}`, async () => {
    const v = await oku<Istatistik>(istatDosyasi(id));
    if (v) return v;
    const x: Istatistik = {};
    for (const c of await calismaOzetleri(id)) if (!AKTIF_DURUM.has(c.durum)) istatEkle(x, c);
    await yaz(istatDosyasi(id), x);
    return x;
  });
}
/** Biten çalışmayı günlük istatistiğe ekler (dosya yoksa dizinden kurulur; bu çalışma zaten dizinde). */
export function istatistikYaz(id: string, c: Calisma): Promise<void> {
  return kilitle(`istat:${id}`, async () => {
    const v = await oku<Istatistik>(istatDosyasi(id));
    const x: Istatistik = v ?? {};
    if (v) istatEkle(x, { baslangic: c.baslangic, bitis: c.bitis, durum: c.durum, kredi: c.kredi, tetikTur: c.tetik.tur });
    else for (const o of await calismaOzetleri(id)) if (!AKTIF_DURUM.has(o.durum)) istatEkle(x, o);
    const sinir = trGun(Date.now() - 400 * 86_400_000);
    for (const g of Object.keys(x)) if (g < sinir) delete x[g];
    await yaz(istatDosyasi(id), x);
  });
}

/* ── Anahtar dizini: "eposta:<anahtar>" ve "disari:<özet>" → sistem kimliği ── */
const ANAHTAR = path.join(KOK, "sistem-anahtar.json");
export function anahtarDiziniDegistir(f: (d: Record<string, string>) => void): Promise<void> {
  return kilitle("anahtar", async () => { const d = (await oku<Record<string, string>>(ANAHTAR)) ?? {}; f(d); await yaz(ANAHTAR, d); });
}
/** Ön eki uyan anahtarlar (ör. "hataozet:"). */
export async function anahtarListesi(onEk: string): Promise<[string, string][]> { return Object.entries((await oku<Record<string, string>>(ANAHTAR)) ?? {}).filter(([k]) => k.startsWith(onEk)); }
export async function anahtarBul(anahtar: string): Promise<string | null> { return ((await oku<Record<string, string>>(ANAHTAR)) ?? {})[anahtar] ?? null; }

/** Bakım: sistem dosyası silinmiş ama çalışma klasörü kalmışsa temizler. */
export async function yetimleriTemizle(): Promise<number> {
  let n = 0;
  try {
    for (const g of await readdir(path.join(KOK, "sistem-calisma"), { withFileTypes: true })) {
      if (!g.isDirectory()) continue;
      if (!(await oku(dosya(g.name)))) { await rm(path.join(KOK, "sistem-calisma", g.name), { recursive: true, force: true }); n++; }
    }
  } catch { /* klasör yok */ }
  return n;
}

/* ── Onay geçmişi (sahip başına son 100 karar) ── */
export type OnayKaydi = { calismaId: string; sistemId: string; sistemAd: string; baslik: string; karar: "onay" | "ret"; duzenlendi: boolean; not?: string; zaman: number; kararVeren: "uygulama" | "adres" | "zaman-asimi" };
const onayDosyasi = (sahipOz: string) => path.join(KOK, "sistem-onay", `${sahipOz}.json`);
export async function onayGecmisi(sahipOz: string): Promise<OnayKaydi[]> { return (await oku<OnayKaydi[]>(onayDosyasi(sahipOz))) ?? []; }
export function onayGecmisiEkle(sahipOz: string, k: OnayKaydi): Promise<void> {
  return kilitle(`onay:${sahipOz}`, async () => { const l = await onayGecmisi(sahipOz); await yaz(onayDosyasi(sahipOz), [k, ...l.filter((x) => x.calismaId !== k.calismaId || x.zaman !== k.zaman)].slice(0, 100)); });
}
export async function onayGecmisiTemizle(sahipOz: string, sistemId: string): Promise<void> {
  await kilitle(`onay:${sahipOz}`, async () => { const l = await onayGecmisi(sahipOz); await yaz(onayDosyasi(sahipOz), l.filter((x) => x.sistemId !== sistemId)); });
}
