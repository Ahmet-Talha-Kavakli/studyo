import "server-only";
import { AsyncLocalStorage } from "async_hooks";
import { randomBytes } from "crypto";
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";

/**
 * Vayra Veri: Build projelerinin paylaşımlı veritabanı (koleksiyon → kayıtlar). Site/uygulama/oyun tarayıcıdan
 * window.vayra.veri ile okur ve yazar (skor tablosu, ziyaretçi defteri, ortak liste, yorum, anket …).
 * Erişim koleksiyon başına kurallarla: okuma ve ekleme varsayılan herkese açık, düzenleme/silme varsayılan kapalı
 * (sahip panelden ve önizlemeden her şeyi yapabilir). Dosya: .veri/build/veri/<projeId>.json
 *
 * Test ve Canlı ortamları (isteğe bağlı, varsayılan kapalı): açılınca Canlı veritabanı bir kez kopyalanarak
 * .veri/build/veri-test/<projeId>.json oluşur. Önizleme, ajan ve test ödemeleri Test'i kullanır; yayındaki site her zaman
 * Canlı'yı. Yayında şema ve kurallar Test'ten Canlı'ya aktarılır; veriler yalnız istenirse ve önce Canlı yedeklenir.
 * ortam verilmeyen çağrılar (eski kod) Canlı'dır; ortamlaCalistir ile açılan bağlamda o bağlamın ortamı kullanılır.
 */

/** herkes: herkes · uyeler: giriş yapmış üyeler · sahibi: her üye yalnız kendi kaydı · kapali: yalnız proje sahibi */
export type Kural = "herkes" | "uyeler" | "sahibi" | "kapali";
export const KURALLAR: Kural[] = ["herkes", "uyeler", "sahibi", "kapali"];
export type Kurallar = { okuma: Kural; ekleme: Kural; duzenleme: Kural };
export type Kayit = { id: string; olusturma: number; guncelleme: number } & Record<string, unknown>;

/** Sütun türleri. Şema isteğe bağlıdır: tanımlı sütunlar doğrulanır ve dönüştürülür, tanımsız alanlar serbest kalır. */
export type SutunTur = "metin" | "uzunMetin" | "sayi" | "mantiksal" | "tarih" | "eposta" | "url" | "gorsel" | "secim" | "iliski" | "json";
export const SUTUN_TURLERI: SutunTur[] = ["metin", "uzunMetin", "sayi", "mantiksal", "tarih", "eposta", "url", "gorsel", "secim", "iliski", "json"];
/** silinince (yalnız ilişki sütunu): bağlı kayıt silinince ne olacağı. kisitla: bağlı kayıt varken silinemez; zincir: bu kayıt da silinir; bosalt: bu alan boşaltılır. Yoksa bir şey yapılmaz. */
export type IliskiSilinince = "kisitla" | "zincir" | "bosalt";
export type Sutun = { ad: string; tur: SutunTur; zorunlu?: boolean; benzersiz?: boolean; varsayilan?: unknown; secenekler?: string[]; iliski?: string; silinince?: IliskiSilinince; aciklama?: string };
export type Koleksiyon = { kurallar: Kurallar; kayitlar: Kayit[]; sema?: Sutun[]; aciklama?: string };
export type Veritabani = { koleksiyonlar: Record<string, Koleksiyon> };

export const sutunAdiGecerli = (a: string) => /^[\p{L}\p{N}_ -]{1,60}$/u.test(a) && !["id", "olusturma", "guncelleme", "uyeId"].includes(a);

/** Şemayı temizler: geçersiz sütunlar atılır, en fazla 60 sütun. */
export function semaTemizle(g: unknown): Sutun[] | null {
  if (!Array.isArray(g)) return null;
  const goruldu = new Set<string>();
  const l: Sutun[] = [];
  for (const x of g.slice(0, 60)) {
    if (!x || typeof x !== "object") continue;
    const s = x as Record<string, unknown>;
    const ad = String(s.ad ?? "").trim();
    const tur = s.tur as SutunTur;
    if (!sutunAdiGecerli(ad) || goruldu.has(ad) || !SUTUN_TURLERI.includes(tur)) continue;
    goruldu.add(ad);
    const o: Sutun = { ad, tur };
    if (s.zorunlu) o.zorunlu = true;
    if (s.benzersiz) o.benzersiz = true;
    if (s.varsayilan !== undefined && s.varsayilan !== "" && s.varsayilan !== null) o.varsayilan = s.varsayilan;
    if (tur === "secim" && Array.isArray(s.secenekler)) o.secenekler = [...new Set(s.secenekler.map((v) => String(v).trim()).filter(Boolean))].slice(0, 50);
    if (tur === "iliski" && typeof s.iliski === "string" && koleksiyonAdiGecerli(s.iliski)) o.iliski = s.iliski;
    if (tur === "iliski" && (s.silinince === "kisitla" || s.silinince === "zincir" || s.silinince === "bosalt")) o.silinince = s.silinince;
    if (typeof s.aciklama === "string" && s.aciklama.trim()) o.aciklama = s.aciklama.trim().slice(0, 200);
    l.push(o);
  }
  return l;
}

const EPOSTA = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Tek değeri sütun türüne çevirir; çevrilemezse hata metni döner. Boş değer null olur. */
export function degerCevir(s: Sutun, v: unknown): { deger: unknown } | { hata: string } {
  if (v === undefined || v === null || v === "") return { deger: null };
  switch (s.tur) {
    case "sayi": { const n = typeof v === "number" ? v : Number(String(v).replace(",", ".")); return Number.isFinite(n) ? { deger: n } : { hata: `"${s.ad}" sayı olmalı` }; }
    case "mantiksal": { if (typeof v === "boolean") return { deger: v }; const t = String(v).toLowerCase(); if (["true", "1", "evet", "doğru"].includes(t)) return { deger: true }; if (["false", "0", "hayır", "yanlış"].includes(t)) return { deger: false }; return { hata: `"${s.ad}" evet ya da hayır olmalı` }; }
    case "tarih": { const z = typeof v === "number" ? v : Date.parse(String(v)); return Number.isFinite(z) ? { deger: new Date(z).toISOString() } : { hata: `"${s.ad}" geçerli bir tarih olmalı` }; }
    case "eposta": { const t = String(v).trim(); return EPOSTA.test(t) ? { deger: t } : { hata: `"${s.ad}" geçerli bir e-posta olmalı` }; }
    case "url": case "gorsel": { const t = String(v).trim(); return /^(https?:\/\/|\/|data:image\/)/.test(t) ? { deger: t } : { hata: `"${s.ad}" bir adres olmalı (https:// ile)` }; }
    case "secim": { const t = String(v); return !s.secenekler?.length || s.secenekler.includes(t) ? { deger: t } : { hata: `"${s.ad}" şunlardan biri olmalı: ${s.secenekler.join(", ")}` }; }
    case "json": { if (typeof v === "object") return { deger: v }; try { return { deger: JSON.parse(String(v)) }; } catch { return { hata: `"${s.ad}" geçerli JSON olmalı` }; } }
    case "iliski": case "metin": case "uzunMetin": default: return { deger: typeof v === "object" ? JSON.stringify(v) : String(v) };
  }
}

/**
 * Kaydı şemaya göre doğrular. yeni: ekleme mi (zorunlu alanlar ve varsayılanlar yalnız eklemede uygulanır).
 * Benzersizlik için mevcut kayıtlar verilir (güncellenen kaydın kendisi hariç tutulur).
 */
export function semayaUygula(k: Koleksiyon, alanlar: Record<string, unknown>, yeni: boolean, haricId?: string): { alanlar: Record<string, unknown> } | { hata: string } {
  if (!k.sema?.length) return { alanlar };
  const o = { ...alanlar };
  for (const s of k.sema) {
    const var_ = Object.prototype.hasOwnProperty.call(o, s.ad);
    if (!var_) {
      if (yeni && s.varsayilan !== undefined) o[s.ad] = s.varsayilan === "simdi" && s.tur === "tarih" ? new Date().toISOString() : s.varsayilan;
      else if (yeni && s.zorunlu) return { hata: `"${s.ad}" zorunlu` };
      else continue;
    }
    const c = degerCevir(s, o[s.ad]);
    if ("hata" in c) return c;
    if (c.deger === null && s.zorunlu) return { hata: `"${s.ad}" boş bırakılamaz` };
    o[s.ad] = c.deger;
    if (s.benzersiz && c.deger !== null && k.kayitlar.some((r) => r.id !== haricId && r[s.ad] === c.deger)) return { hata: `"${s.ad}" için "${String(c.deger)}" zaten var` };
  }
  return { alanlar: o };
}

/** Gelişmiş süzgeç: [{alan, op, deger}] (esit, esitDegil, buyuk, kucuk, icerir, baslar, bos, dolu). */
export type Suzgec = { alan: string; op: "esit" | "esitDegil" | "buyuk" | "buyukEsit" | "kucuk" | "kucukEsit" | "icerir" | "baslar" | "bos" | "dolu"; deger?: unknown };
export function suzgecUygula(l: Kayit[], s: Suzgec[]): Kayit[] {
  const sayi = (v: unknown) => (typeof v === "number" ? v : Number(v));
  const kar = (a: unknown, b: unknown) => { const x = sayi(a), y = sayi(b); return Number.isFinite(x) && Number.isFinite(y) ? x - y : String(a ?? "").localeCompare(String(b ?? ""), "tr"); };
  return l.filter((r) => s.every((f) => {
    const v = r[f.alan];
    switch (f.op) {
      case "esit": return String(v ?? "") === String(f.deger ?? "");
      case "esitDegil": return String(v ?? "") !== String(f.deger ?? "");
      case "buyuk": return v !== null && v !== undefined && kar(v, f.deger) > 0;
      case "buyukEsit": return v !== null && v !== undefined && kar(v, f.deger) >= 0;
      case "kucuk": return v !== null && v !== undefined && kar(v, f.deger) < 0;
      case "kucukEsit": return v !== null && v !== undefined && kar(v, f.deger) <= 0;
      case "icerir": return String(typeof v === "object" ? JSON.stringify(v) : v ?? "").toLocaleLowerCase("tr").includes(String(f.deger ?? "").toLocaleLowerCase("tr"));
      case "baslar": return String(v ?? "").toLocaleLowerCase("tr").startsWith(String(f.deger ?? "").toLocaleLowerCase("tr"));
      case "bos": return v === null || v === undefined || v === "";
      case "dolu": return !(v === null || v === undefined || v === "");
      default: return true;
    }
  }));
}

export const VARSAYILAN_KURAL: Kurallar = { okuma: "herkes", ekleme: "herkes", duzenleme: "kapali" };
export const SINIR = { koleksiyon: 50, kayit: 5000, kayitBoyut: 20_000 };
export const koleksiyonAdiGecerli = (a: string) => /^[a-zA-Z0-9_-]{1,40}$/.test(a);

/** Veri ortamı: canli (yayındaki site) ya da test (önizleme, ajan, test ödemeleri). */
export type VeriOrtami = "canli" | "test";
const baglam = new AsyncLocalStorage<{ ortam: VeriOrtami }>();
/** f içindeki ortam belirtilmemiş bütün veri çağrıları verilen ortamı kullanır (önizlemedeki sunucu fonksiyonları için). */
export function ortamlaCalistir<T>(ortam: VeriOrtami, f: () => T): T { return baglam.run({ ortam }, f); }
const ortamBul = (o?: VeriOrtami): VeriOrtami => o ?? baglam.getStore()?.ortam ?? "canli";
/** Çağrının ortamı (ortamlaCalistir bağlamı yoksa Canlı). */
export const aktifOrtam = (): VeriOrtami => ortamBul();

const dosya = (id: string, ortam: VeriOrtami = "canli") => path.join(DEPO_KOK, "build", ortam === "test" ? "veri-test" : "veri", `${id}.json`);
const kilit = new Map<string, Promise<unknown>>();

export async function veriOku(id: string, ortam?: VeriOrtami): Promise<Veritabani> {
  try { return JSON.parse(await readFile(dosya(id, ortamBul(ortam)), "utf8")) as Veritabani; } catch { return { koleksiyonlar: {} }; }
}

/* ── Yedekler: günde bir otomatik (zamanlayıcı ya da ilk yazımdan önce), elle, geri yüklemeden, yayından ve zamana göre
   geri dönüşten önce. Otomatik, elle ve yüklenen yedeklerden son N tanesi tutulur (Bulut > Yedekler ayarı, varsayılan
   14); işlem öncesi yedeklerden son 20 tanesi ayrıca tutulur. ── */
const yedekKlasoru = (id: string) => path.join(DEPO_KOK, "build", "veri-yedek", id);
export type YedekTur = "otomatik" | "elle" | "geri-yukleme-oncesi" | "yayin-oncesi" | "zaman-oncesi" | "yukleme";
export type Yedek = { ad: string; zaman: number; boyut: number; tur: YedekTur };
export const YEDEK_AD = /^(\d+)-(otomatik|elle|geri-yukleme-oncesi|yayin-oncesi|zaman-oncesi|yukleme)\.json$/;
/** Yedek dosyasının yolu (ad doğrulanır; geçersizse null). */
export const yedekYolu = (id: string, ad: string) => (YEDEK_AD.test(ad) ? path.join(yedekKlasoru(id), ad) : null);
/** Veritabanı dosyasının son yazılma zamanı (yoksa 0). */
export async function veriDegisimZamani(id: string, ortam: VeriOrtami = "canli") { return (await stat(dosya(id, ortam)).catch(() => null))?.mtimeMs ?? 0; }
export async function yedekler(id: string): Promise<Yedek[]> {
  const d = yedekKlasoru(id);
  const l = await readdir(d).catch(() => [] as string[]);
  const o: Yedek[] = [];
  for (const a of l.filter((x) => x.endsWith(".json"))) {
    const st = await stat(path.join(d, a)).catch(() => null);
    const m = a.match(YEDEK_AD);
    if (st && m) o.push({ ad: a, zaman: Number(m[1]), boyut: st.size, tur: m[2] as Yedek["tur"] });
  }
  return o.sort((a, b) => b.zaman - a.zaman);
}
/** Yedek alır. icerik verilirse (yüklenen yedek) dosya yerine o yazılır. */
export async function yedekAl(id: string, tur: Yedek["tur"], icerik?: string): Promise<Yedek | null> {
  const kaynak = dosya(id);
  if (!icerik && !(await stat(kaynak).catch(() => null))) return null;
  const d = yedekKlasoru(id);
  await mkdir(d, { recursive: true });
  let z = Date.now();
  while (await stat(path.join(d, `${z}-${tur}.json`)).catch(() => null)) z++;
  const ad = `${z}-${tur}.json`;
  if (icerik) await writeFile(path.join(d, ad), icerik); else await copyFile(kaynak, path.join(d, ad));
  const l = await yedekler(id);
  const saklama = await import("./bulutVeriAyar").then((m) => m.veriAyarOku(id)).then((a) => a.yedek.saklama).catch(() => 14);
  const duzenli = l.filter((x) => x.tur === "otomatik" || x.tur === "elle" || x.tur === "yukleme");
  const islem = l.filter((x) => !duzenli.includes(x));
  for (const x of [...duzenli.slice(saklama), ...islem.slice(20)]) if (x.ad !== ad) await rm(path.join(d, x.ad), { force: true });
  return l.find((x) => x.ad === ad) ?? null;
}
/**
 * Yedeği geri yükler; önce mevcut durum yedeklenir. tablolar verilirse yalnız o tablolar yedekteki hâline döner
 * (yedekte olmayan seçili tablo silinir); diğerlerine dokunulmaz.
 */
export async function yedektenDon(id: string, ad: string, tablolar?: string[]): Promise<{ tablolar: string[] } | false> {
  if (!YEDEK_AD.test(ad)) return false;
  const icerik = await readFile(path.join(yedekKlasoru(id), ad), "utf8").catch(() => null);
  if (!icerik) return false;
  const yeni = JSON.parse(icerik) as Veritabani;
  if (!yeni || typeof yeni.koleksiyonlar !== "object") return false;
  return veriIcerigiYukle(id, yeni, tablolar);
}
/**
 * Verilen veritabanı içeriğini Canlı'ya yazar (yedekten dönüş ve yüklenen yedek için ortak). Önce Canlı yedeklenir;
 * değişen her tablonun önceki hâli kayıt geçmişine anlık görüntü olarak düşer (zamana göre geri dönüş bunun ötesine de geçer).
 */
export async function veriIcerigiYukle(id: string, yeni: Veritabani, tablolar?: string[], aciklama = "Yedekten geri yükleme"): Promise<{ tablolar: string[] }> {
  const { anlikAl } = await import("./bulutGecmis");
  await yedekAl(id, "geri-yukleme-oncesi");
  const degisen = await veriDegistir(id, (v) => {
    const adlar = tablolar?.length ? tablolar.filter(koleksiyonAdiGecerli) : [...new Set([...Object.keys(v.koleksiyonlar), ...Object.keys(yeni.koleksiyonlar)])];
    const l: string[] = [];
    for (const a of adlar) {
      const hedef = yeni.koleksiyonlar[a];
      if (JSON.stringify(hedef ?? null) === JSON.stringify(v.koleksiyonlar[a] ?? null)) continue;
      if (hedef && !v.koleksiyonlar[a] && Object.keys(v.koleksiyonlar).length >= SINIR.koleksiyon) continue;
      anlikAl(id, "canli", a, v.koleksiyonlar[a], "toplu", aciklama);
      if (hedef) v.koleksiyonlar[a] = kopya(hedef); else delete v.koleksiyonlar[a];
      l.push(a);
    }
    return l;
  }, "canli");
  return { tablolar: degisen };
}
const sonOtomatik = new Map<string, number>();
async function otomatikYedek(id: string) {
  const simdi = Date.now();
  if (simdi - (sonOtomatik.get(id) ?? 0) < 3600_000) return;
  sonOtomatik.set(id, simdi);
  if (!(await import("./bulutVeriAyar").then((m) => m.veriAyarOku(id)).then((a) => a.yedek.acik).catch(() => true))) return;
  const son = (await yedekler(id)).find((x) => x.tur === "otomatik");
  if (!son || simdi - son.zaman > 24 * 3600_000) await yedekAl(id, "otomatik");
}

/** Aynı projeye (aynı ortamda) eşzamanlı yazımlar sıraya girer (dosya bütünlüğü). Otomatik yedek yalnız Canlı'da. */
export async function veriDegistir<T>(id: string, f: (v: Veritabani) => T | Promise<T>, ortam?: VeriOrtami): Promise<T> {
  const o = ortamBul(ortam);
  const anahtar = o === "test" ? `test:${id}` : id;
  const onceki = kilit.get(anahtar) ?? Promise.resolve();
  let sonuc!: T;
  const is = onceki.then(async () => {
    if (o === "canli") await otomatikYedek(id).catch(() => {});
    const v = await veriOku(id, o);
    sonuc = await f(v);
    await mkdir(path.dirname(dosya(id, o)), { recursive: true });
    await writeFile(dosya(id, o), JSON.stringify(v));
  });
  kilit.set(anahtar, is.catch(() => {}));
  await is;
  return sonuc;
}

/* ── Test ve Canlı ortamları ── */
export type OrtamAyari = { test: boolean; kurulum?: number; sonAktarim?: number; aktarimlar?: { zaman: number; tablolar: number; veri: boolean; yedek?: string }[] };
const ortamDosyasi = (id: string) => path.join(DEPO_KOK, "build", "veri-ortam", `${id}.json`);
/** Ortama özgü tablolar: Test'ten Canlı'ya veri aktarımında taşınmaz (test siparişleri canlıya karışmaz). */
export const ORTAMA_OZGU = new Set(["siparisler"]);
export async function ortamAyariOku(id: string): Promise<OrtamAyari> {
  try { return { test: false, ...(JSON.parse(await readFile(ortamDosyasi(id), "utf8")) as Partial<OrtamAyari>) }; } catch { return { test: false }; }
}
async function ortamAyariYaz(id: string, a: OrtamAyari) { await mkdir(path.dirname(ortamDosyasi(id)), { recursive: true }); await writeFile(ortamDosyasi(id), JSON.stringify(a)); }
/** İsteğin ortamı: önizleme (ve ajan) test ortamı açıksa Test; yayındaki site her zaman Canlı. */
export async function istekOrtami(id: string, onizleme: boolean): Promise<VeriOrtami> {
  return onizleme && (await ortamAyariOku(id)).test ? "test" : "canli";
}
const kopya = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
/** Test ortamını açar: ilk açılışta Canlı'daki tablolar (kayıtlarıyla) Test'e bir kez kopyalanır; Test'te zaten olan tablolara dokunulmaz. */
export async function testOrtamiAc(id: string): Promise<OrtamAyari> {
  const a = await ortamAyariOku(id);
  if (!a.kurulum) {
    const canli = await veriOku(id, "canli");
    await veriDegistir(id, (t) => { for (const [ad, k] of Object.entries(canli.koleksiyonlar)) if (!t.koleksiyonlar[ad] && !ORTAMA_OZGU.has(ad)) t.koleksiyonlar[ad] = kopya(k); }, "test");
  }
  const yeni: OrtamAyari = { ...a, test: true, kurulum: a.kurulum ?? Date.now() };
  await ortamAyariYaz(id, yeni);
  return yeni;
}
/** Test ortamını kapatır; Test verisi silinmez (yeniden açınca kaldığı yerden sürer). sil: Test verisi de silinir. */
export async function testOrtamiKapat(id: string, sil = false): Promise<OrtamAyari> {
  const a = await ortamAyariOku(id);
  const yeni: OrtamAyari = sil ? { test: false, aktarimlar: a.aktarimlar } : { ...a, test: false };
  if (sil) await rm(dosya(id, "test"), { force: true });
  await ortamAyariYaz(id, yeni);
  return yeni;
}
export type TabloFarki = { ad: string; durum: "yeni" | "degisti" | "ayni" | "yalnizCanli"; sema: boolean; kural: boolean; testAdet: number; canliAdet: number; ortamaOzgu: boolean };
/** Test ile Canlı arasındaki fark: tablo başına şema ve kural değişikliği, kayıt sayıları. */
export async function ortamFarki(id: string): Promise<TabloFarki[]> {
  const [t, c] = await Promise.all([veriOku(id, "test"), veriOku(id, "canli")]);
  const adlar = [...new Set([...Object.keys(t.koleksiyonlar), ...Object.keys(c.koleksiyonlar)])].sort();
  return adlar.map((ad) => {
    const x = t.koleksiyonlar[ad], y = c.koleksiyonlar[ad];
    const sema = !!x && JSON.stringify(x.sema ?? []) !== JSON.stringify(y?.sema ?? []);
    const kural = !!x && JSON.stringify(x.kurallar) !== JSON.stringify(y?.kurallar ?? null);
    const durum: TabloFarki["durum"] = !x ? "yalnizCanli" : !y ? "yeni" : sema || kural || (x.aciklama ?? "") !== (y.aciklama ?? "") ? "degisti" : "ayni";
    return { ad, durum, sema, kural, testAdet: x?.kayitlar.length ?? 0, canliAdet: y?.kayitlar.length ?? 0, ortamaOzgu: ORTAMA_OZGU.has(ad) };
  });
}
/**
 * Test'i Canlı'ya aktarır (yayında çağrılır): önce Canlı yedeklenir; Test'teki her tablonun şeması, kuralları ve
 * açıklaması Canlı'ya yazılır (Canlı'da olmayan tablo boş açılır). veri: true ise kayıtlar da Test'tekilerle değiştirilir
 * (ortama özgü siparisler tablosu hariç). Canlı'da olup Test'te olmayan tablolar ve kayıtları hiç silinmez.
 */
export async function testiCanliyaAktar(id: string, g: { veri?: boolean; tablolar?: string[] } = {}): Promise<{ tablolar: string[]; veri: boolean; yedek: string | null }> {
  const t = await veriOku(id, "test");
  const yedek = await yedekAl(id, "yayin-oncesi").catch(() => null);
  const secili = g.tablolar?.length ? new Set(g.tablolar) : null;
  const { anlikAl } = await import("./bulutGecmis");
  const tablolar = await veriDegistir(id, (c) => {
    const l: string[] = [];
    for (const [ad, k] of Object.entries(t.koleksiyonlar)) {
      if (secili && !secili.has(ad)) continue;
      if (ORTAMA_OZGU.has(ad) && !c.koleksiyonlar[ad]) continue;
      if (!c.koleksiyonlar[ad] && Object.keys(c.koleksiyonlar).length >= SINIR.koleksiyon) continue;
      if (c.koleksiyonlar[ad]) anlikAl(id, "canli", ad, c.koleksiyonlar[ad], "toplu", g.veri ? "Test'ten kayıtlarıyla aktarım" : "Test'ten şema ve kural aktarımı");
      const hedef = c.koleksiyonlar[ad] ??= { kurallar: { ...k.kurallar }, kayitlar: [] };
      hedef.kurallar = { ...k.kurallar };
      if (k.sema) hedef.sema = kopya(k.sema); else delete hedef.sema;
      if (k.aciklama) hedef.aciklama = k.aciklama; else delete hedef.aciklama;
      if (g.veri && !ORTAMA_OZGU.has(ad)) hedef.kayitlar = kopya(k.kayitlar);
      l.push(ad);
    }
    return l;
  }, "canli");
  const a = await ortamAyariOku(id);
  await ortamAyariYaz(id, { ...a, sonAktarim: Date.now(), aktarimlar: [{ zaman: Date.now(), tablolar: tablolar.length, veri: !!g.veri, yedek: yedek?.ad }, ...(a.aktarimlar ?? [])].slice(0, 20) });
  return { tablolar, veri: !!g.veri, yedek: yedek?.ad ?? null };
}

export const yeniKayitId = () => randomBytes(8).toString("base64url");

/* ── Tam metin arama (Convex searchIndex, Firestore text search benzeri) ── */
/** Türkçe duyarlı sadeleştirme: küçük harf, ı ve İ dahil şapka ve noktalar atılır ("Çekirdeği" → "cekirdegi"). */
export const aramaNormal = (s: string) => s.toLocaleLowerCase("tr-TR").replace(/ı/g, "i").normalize("NFD").replace(/[̀-ͯ]/g, "");
const kelimeler = (s: string) => aramaNormal(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
const AGIR = /^(ad|adi|baslik|başlık|isim|title|name|urun|ürün|konu)$/i;

/**
 * Kayıtlarda puanlı arama. Sorgu: kelimeler (hepsi geçmeli), "tam ifade", -hariç, alan:kelime. Son kelime önek olarak
 * da eşleşir (yazarken arama). Puan BM25 benzeri; ad ve başlık alanları iki kat ağırlıklı. Eşit puanda yeni kayıt önce.
 * alanlar verilmezse şemadaki metin alanları, şema yoksa bütün metin ve sayı alanları aranır.
 */
export function metinAra(l: Kayit[], sorgu: string, sema?: Sutun[], alanlar?: string[]): (Kayit & { _puan: number })[] {
  const ifadeler: string[] = [], haric: string[] = [], haricIfade: string[] = [];
  const terimler: { t: string; alan?: string }[] = [];
  for (const m of sorgu.slice(0, 300).matchAll(/(-?)(?:([\p{L}\p{N}_]+):)?(?:"([^"]+)"|(\S+))/gu)) {
    const neg = m[1] === "-", alan = m[2], ifade = m[3], kelime = m[4];
    if (ifade) { const n = kelimeler(ifade).join(" "); if (n) (neg ? haricIfade : ifadeler).push(n); continue; }
    for (const t of kelimeler(kelime ?? "")) (neg ? haric.push(t) : terimler.push({ t, alan }));
  }
  if (!terimler.length && !ifadeler.length) return [];
  const metinTur = new Set(["metin", "uzunMetin", "eposta", "url", "secim"]);
  const hedef = alanlar?.length ? new Set(alanlar) : sema?.length ? new Set(sema.filter((s) => metinTur.has(s.tur)).map((s) => s.ad)) : null;
  const belgeler = l.map((k) => {
    const alan: Record<string, string[]> = {};
    for (const [a, v] of Object.entries(k)) {
      if (a === "id" || a === "olusturma" || a === "guncelleme" || a === "uyeId") continue;
      if (hedef && !hedef.has(a)) continue;
      if (typeof v !== "string" && typeof v !== "number") continue;
      alan[a] = kelimeler(String(v));
    }
    return { k, alan, duz: Object.values(alan).map((x) => x.join(" ")).join(" | ") };
  });
  const N = belgeler.length || 1;
  const ortUzun = belgeler.reduce((t, b) => t + Object.values(b.alan).reduce((s, x) => s + x.length, 0), 0) / N || 1;
  const sonIndeks = terimler.length - 1;
  const uyar = (tok: string, t: string, i: number) => tok === t || (i === sonIndeks && t.length >= 2 && tok.startsWith(t));
  const df = terimler.map((x, i) => belgeler.filter((b) => Object.entries(b.alan).some(([a, toks]) => (!x.alan || a === x.alan) && toks.some((tok) => uyar(tok, x.t, i)))).length);
  const o: (Kayit & { _puan: number })[] = [];
  for (const b of belgeler) {
    if (haric.some((h) => Object.values(b.alan).some((toks) => toks.includes(h))) || haricIfade.some((h) => b.duz.includes(h))) continue;
    if (!ifadeler.every((f) => b.duz.includes(f))) continue;
    let puan = ifadeler.length;
    let tamam = true;
    terimler.forEach((x, i) => {
      if (!tamam) return;
      const idf = Math.log(1 + (N - df[i] + 0.5) / (df[i] + 0.5));
      let p = 0;
      for (const [a, toks] of Object.entries(b.alan)) {
        if (x.alan && a !== x.alan) continue;
        const tf = toks.filter((tok) => uyar(tok, x.t, i)).length;
        if (tf) p += idf * ((tf * 2.2) / (tf + 1.2 * (0.25 + (0.75 * toks.length) / ortUzun))) * (AGIR.test(a) ? 2 : 1);
      }
      if (!p) tamam = false; else puan += p;
    });
    if (tamam) o.push({ ...b.k, _puan: Math.round(puan * 1000) / 1000 });
  }
  return o.sort((a, c) => c._puan - a._puan || c.olusturma - a.olusturma);
}

/** Kayıt alanlarını temizler: sistem alanları korunur, boyut sınırı uygulanır. */
export function alanlariTemizle(g: unknown): Record<string, unknown> | null {
  if (!g || typeof g !== "object" || Array.isArray(g)) return null;
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(g as Record<string, unknown>).slice(0, 60)) {
    if (k === "id" || k === "olusturma" || k === "guncelleme" || k === "uyeId" || !/^[\p{L}\p{N}_ -]{1,60}$/u.test(k)) continue;
    o[k] = v;
  }
  if (JSON.stringify(o).length > SINIR.kayitBoyut) return null;
  return o;
}
