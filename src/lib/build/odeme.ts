import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import type { Proje } from "./tipler";
import { semaTemizle, veriDegistir, veriOku, type Kayit, type Koleksiyon, type Sutun, type VeriOrtami, type Veritabani } from "./veri";
import { dilimTarih, paraOndalik, paraYaz, telefonE164, ulkeIngilizce } from "./bolge";

/**
 * Vayra Ödeme: Build sitelerinde Stripe Checkout (birincil, dünya geneli), PayPal Orders v2, iyzico Ödeme Formu (Checkout Form)
 * ve PayTR iFrame API ile ödeme. Sipariş, mağazanın ya da alıcının seçtiği para biriminde açılır; her sağlayıcı yalnız
 * desteklediği para birimlerinde kullanılır (SAGLAYICI_PARA).
 * Kart bilgisi Vayra'ya hiç uğramaz: ziyaretçi sağlayıcının güvenli sayfasında öder; sonuç sunucudan sunucuya doğrulanır.
 *
 *  - Fiyatlar tarayıcıdan ALINMAZ: sepetteki ürün kimlikleri "urunler" tablosundan sunucuda okunur ve tutar burada hesaplanır.
 *  - Sipariş "siparisler" tablosunda tutulur (kurallar hep kapalı: ziyaretçi okuyamaz, yazamaz; yalnız sunucu yazar).
 *  - Test modu: iyzico sandbox adresi, PayTR test_mode=1, Stripe sk_test anahtarı. Önizlemeden başlayan ödeme her zaman
 *    testtir. Test siparişleri Test veritabanına (veri-test) yazılır, Canlı'ya karışmaz.
 *  - Anahtarlar projenin "sunucu" sırlarındadır. Testte önce <AD>_TEST aranır, yoksa <AD> kullanılır.
 *  - Ödeme sonuçlanınca "siparisler" tablosundaki "Yeni kayıt" tetiği (veri:<proje>:siparisler) ve odeme:<proje> tetiği çalışır.
 *
 * Belgeler: docs.iyzico.com (CF Initialize / CF Retrieve / Refund, Response Signature Validation), dev.paytr.com
 * (iFrame API 1. ve 2. adım, İade API, Durum Sorgu), docs.stripe.com (Checkout Sessions, Refunds, Webhook signatures,
 * zero-decimal currencies), developer.paypal.com (OAuth 2.0 client credentials, Orders v2 create/show/capture, Payments v2
 * captures refund, Webhooks v1 verify-webhook-signature).
 */

export type Saglayici = "stripe" | "paypal" | "iyzico" | "paytr";
/** Sıra arayüzdeki sıradır: dünya geneli sağlayıcılar önce, Türkiye'ye özel olanlar sonra. */
export const SAGLAYICILAR: Saglayici[] = ["stripe", "paypal", "iyzico", "paytr"];
/** Sağlayıcının kabul ettiği para birimleri (ISO 4217). Stripe tüm listeyi destekler. */
export const SAGLAYICI_PARA: Record<Saglayici, string[] | "hepsi"> = {
  stripe: "hepsi",
  paypal: ["AUD", "BRL", "CAD", "CNY", "CZK", "DKK", "EUR", "HKD", "HUF", "ILS", "JPY", "MYR", "MXN", "NZD", "NOK", "PHP", "PLN", "GBP", "SGD", "SEK", "CHF", "THB", "USD"],
  iyzico: ["TRY", "USD", "EUR", "GBP", "CHF", "NOK"],
  paytr: ["TRY", "USD", "EUR", "GBP"],
};
export const paraDestekli = (s: Saglayici, para: string) => { const l = SAGLAYICI_PARA[s]; return l === "hepsi" || l.includes(para); };
/** PayPal'da ondalıksız para birimleri. */
const PAYPAL_TAM = new Set(["HUF", "JPY", "TWD"]);
export type OdemeMod = "test" | "canli";
export type SiparisDurum = "bekliyor" | "odendi" | "basarisiz" | "iade";

export type OdemeAyar = {
  /** Birincil sağlayıcı (kart ödemesi). */
  saglayici: Saglayici | null;
  /** Ödeme adımında alıcıya ayrıca sunulan sağlayıcılar (örneğin Stripe ile kart, yanında PayPal). */
  ekSaglayicilar?: Saglayici[];
  /** Yayındaki sitenin ödeme modu. Önizleme her zaman testtir. */
  mod: OdemeMod;
  /** Ödeme sonrası dönülecek site sayfaları (göreli yol). */
  basariSayfasi: string;
  hataSayfasi: string;
  /** En çok taksit (1: tek çekim). */
  taksit: number;
  /** Fiyatların okunduğu tablo. */
  urunTablosu: string;
  /** İmzası doğrulanmış son bildirim zamanı (sağlayıcı-mod). Canlıya geçiş listesinde kullanılır. */
  sonBildirim?: Partial<Record<string, number>>;
  /** Yalnız geliştirmede (NODE_ENV production değilken): sağlayıcı adresini yerel deneme sunucusuna yönlendirir. */
  gelistirici?: Partial<Record<Saglayici, string>>;
  guncelleme: number;
};
export const VARSAYILAN_AYAR: OdemeAyar = { saglayici: null, mod: "test", basariSayfasi: "", hataSayfasi: "", taksit: 1, urunTablosu: "urunler", guncelleme: 0 };

export class OdemeHata extends Error { constructor(mesaj: string, public durum = 400) { super(mesaj); } }

/* ───────────── Ayar deposu: .veri/build/odeme/<proje>.json ───────────── */
const ayarDosyasi = (id: string) => path.join(DEPO_KOK, "build", "odeme", `${id}.json`);
const ayarKilit = new Map<string, Promise<unknown>>();
export async function odemeAyarOku(id: string): Promise<OdemeAyar> {
  try { return { ...VARSAYILAN_AYAR, ...(JSON.parse(await readFile(ayarDosyasi(id), "utf8")) as Partial<OdemeAyar>) }; } catch { return { ...VARSAYILAN_AYAR }; }
}
export async function odemeAyarDegistir(id: string, f: (a: OdemeAyar) => void): Promise<OdemeAyar> {
  const onceki = ayarKilit.get(id) ?? Promise.resolve();
  let sonuc!: OdemeAyar;
  const is = onceki.then(async () => {
    const a = await odemeAyarOku(id);
    f(a);
    a.guncelleme = Date.now();
    await mkdir(path.dirname(ayarDosyasi(id)), { recursive: true });
    await writeFile(ayarDosyasi(id), JSON.stringify(a));
    sonuc = a;
  });
  ayarKilit.set(id, is.catch(() => {}));
  await is;
  return sonuc;
}

/* ───────────── Anahtarlar (projenin sunucu sırları) ───────────── */
export const ANAHTARLAR: Record<Saglayici, { ad: string; etiket: string }[]> = {
  iyzico: [{ ad: "IYZICO_API_KEY", etiket: "API anahtarı" }, { ad: "IYZICO_SECRET_KEY", etiket: "Gizli anahtar" }],
  paytr: [{ ad: "PAYTR_MERCHANT_ID", etiket: "Mağaza no" }, { ad: "PAYTR_MERCHANT_KEY", etiket: "Mağaza parola" }, { ad: "PAYTR_MERCHANT_SALT", etiket: "Mağaza gizli anahtar" }],
  stripe: [{ ad: "STRIPE_SECRET_KEY", etiket: "Gizli anahtar" }, { ad: "STRIPE_WEBHOOK_SECRET", etiket: "Webhook imza sırrı" }],
  paypal: [{ ad: "PAYPAL_CLIENT_ID", etiket: "Client ID" }, { ad: "PAYPAL_CLIENT_SECRET", etiket: "Secret" }, { ad: "PAYPAL_WEBHOOK_ID", etiket: "Webhook ID" }],
};
/** Ödeme başlatmak için şart olmayan anahtarlar (bildirim doğrulaması için). */
const ISTEGE_BAGLI = new Set(["STRIPE_WEBHOOK_SECRET", "PAYPAL_WEBHOOK_ID"]);
/** Testte ayrı anahtar kullanan sağlayıcılar (PayTR aynı mağaza bilgileriyle test_mode=1 gönderir). */
export const TEST_AYRI: Record<Saglayici, boolean> = { iyzico: true, paytr: false, stripe: true, paypal: true };
export const testAdi = (ad: string) => `${ad}_TEST`;
const sirBul = (p: Proje, ad: string) => p.ayarlar.sirlar.find((s) => s.ad === ad);
const sir = (p: Proje, ad: string) => { const s = sirBul(p, ad); return s && s.gorunurluk === "sunucu" ? s.deger.trim() : ""; };
/** Moda göre anahtar: testte önce <AD>_TEST, yoksa <AD>. Herkese açık (tarayıcıya giden) değer hiç kullanılmaz. */
export const anahtarAl = (p: Proje, ad: string, mod: OdemeMod) => (mod === "test" ? sir(p, testAdi(ad)) || sir(p, ad) : sir(p, ad));

export type AnahtarSatiri = { ad: string; etiket: string; canli: "var" | "yok" | "acik"; test: "var" | "yok" | "acik" | "canlidan"; uyari?: string };
/** Hangi sırlar tanımlı (değerler hiç dönmez) ve biçim uyarıları. */
export function anahtarDurumu(p: Proje, s: Saglayici): AnahtarSatiri[] {
  const d = (ad: string): "var" | "yok" | "acik" => { const x = sirBul(p, ad); return !x || !x.deger.trim() ? "yok" : x.gorunurluk === "sunucu" ? "var" : "acik"; };
  return ANAHTARLAR[s].map((a) => {
    const canli = d(a.ad), t = d(testAdi(a.ad));
    const test = t !== "yok" ? t : canli === "var" ? "canlidan" : "yok";
    return { ad: a.ad, etiket: a.etiket, canli, test, uyari: anahtarUyarisi(s, a.ad, sir(p, a.ad), sir(p, testAdi(a.ad))) };
  });
}
function anahtarUyarisi(s: Saglayici, ad: string, canli: string, test: string): string | undefined {
  if (s === "iyzico" && ad === "IYZICO_API_KEY") {
    if (canli.startsWith("sandbox-")) return "Canlı alanda sandbox anahtarı var; canlı anahtar iyzico Merchant Panel'den alınır.";
    if (test && !test.startsWith("sandbox-")) return "Test anahtarı sandbox- ile başlamalı (sandbox-merchant.iyzipay.com).";
  }
  if (s === "stripe" && ad === "STRIPE_SECRET_KEY") {
    if (canli && !/^(sk|rk)_live_/.test(canli) && !test) return "Canlı alanda test anahtarı var; testte kullanılır, canlı için sk_live_ ile başlayan anahtar gerekir.";
    if (canli && !/^(sk|rk)_(live|test)_/.test(canli)) return "Stripe gizli anahtarı sk_live_ ya da rk_live_ ile başlar.";
    if (test && !/^(sk|rk)_test_/.test(test)) return "Test anahtarı sk_test_ ile başlamalı.";
  }
  if (s === "stripe" && ad === "STRIPE_WEBHOOK_SECRET" && ((canli && !canli.startsWith("whsec_")) || (test && !test.startsWith("whsec_")))) return "Webhook imza sırrı whsec_ ile başlar.";
  if (s === "paytr" && ad === "PAYTR_MERCHANT_ID" && canli && !/^\d+$/.test(canli)) return "Mağaza no yalnız rakamdır.";
  if (s === "paypal" && ad === "PAYPAL_CLIENT_ID" && canli && canli === test) return "Canlı ve sandbox Client ID aynı; sandbox uygulaması developer.paypal.com'da ayrıdır.";
  return undefined;
}

type Kimlik = Record<string, string>;
function kimlik(p: Proje, s: Saglayici, mod: OdemeMod): Kimlik {
  const k: Kimlik = {};
  for (const a of ANAHTARLAR[s]) k[a.ad] = anahtarAl(p, a.ad, mod);
  const eksik = ANAHTARLAR[s].filter((a) => !k[a.ad] && !ISTEGE_BAGLI.has(a.ad));
  if (eksik.length) throw new OdemeHata(`${SAGLAYICI_AD[s]} ${mod === "test" ? "test" : "canlı"} anahtarları eksik: ${eksik.map((a) => a.ad).join(", ")}. Site sahibi Bulut › Ödemeler bölümünden eklemeli.`, 409);
  if (s === "stripe") {
    const sk = k.STRIPE_SECRET_KEY;
    if (mod === "test" && !/^(sk|rk)_test_/.test(sk)) throw new OdemeHata("Stripe test modu için sk_test_ ile başlayan anahtar gerekir (STRIPE_SECRET_KEY_TEST). Canlı anahtarla test ödemesi yapılmaz.", 409);
    if (mod === "canli" && !/^(sk|rk)_live_/.test(sk)) throw new OdemeHata("Stripe canlı modu için sk_live_ ile başlayan anahtar gerekir.", 409);
  }
  if (s === "iyzico" && mod === "canli" && k.IYZICO_API_KEY.startsWith("sandbox-")) throw new OdemeHata("iyzico canlı modunda sandbox anahtarı kullanılamaz.", 409);
  return k;
}
export const SAGLAYICI_AD: Record<Saglayici, string> = { iyzico: "iyzico", paytr: "PayTR", stripe: "Stripe", paypal: "PayPal" };
/** Anahtarlar bu mod için hazır mı (eksik ya da yanlış türdeyse OdemeHata): sipariş açmadan önce çağrılır. */
export function anahtarlarHazir(p: Proje, s: Saglayici, mod: OdemeMod) { kimlik(p, s, mod); }

/* ───────────── Sağlayıcı adresleri ───────────── */
const YEREL = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{2,5})?$/;
/** Yalnız geliştirmede: proje ayarındaki ya da VAYRA_ODEME_MOCK_<SAĞLAYICI> ortam değişkenindeki yerel adres. */
function yerelTaban(a: OdemeAyar, s: Saglayici): string | null {
  if (process.env.NODE_ENV === "production") return null;
  const x = a.gelistirici?.[s] || process.env[`VAYRA_ODEME_MOCK_${s.toUpperCase()}`];
  return x && YEREL.test(x) ? x : null;
}
const taban = (a: OdemeAyar, s: Saglayici, mod: OdemeMod) =>
  yerelTaban(a, s) ?? (s === "iyzico" ? (mod === "test" ? "https://sandbox-api.iyzipay.com" : "https://api.iyzipay.com") : s === "paytr" ? "https://www.paytr.com"
    : s === "paypal" ? (mod === "test" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com") : "https://api.stripe.com");
export const yerelAdresGecerli = (x: string) => YEREL.test(x);

/* ───────────── Tablolar ───────────── */
export const SIPARIS_TABLOSU = "siparisler";
const KAPALI = { okuma: "kapali", ekleme: "kapali", duzenleme: "kapali" } as const;
/** Şemalar veri.ts semaTemizle ile doğrulanır (geçersiz sütun olursa atılır). */
export const SIPARIS_SEMA: Sutun[] = semaTemizle([
  { ad: "siparisNo", tur: "metin", zorunlu: true, benzersiz: true, aciklama: "Sitenin ve sağlayıcının gördüğü sipariş numarası" },
  { ad: "durum", tur: "secim", zorunlu: true, secenekler: ["bekliyor", "odendi", "basarisiz", "iade"], varsayilan: "bekliyor" },
  { ad: "tutar", tur: "sayi", zorunlu: true, aciklama: "Siparişin para biriminde, sunucuda ürün tablosundan hesaplanır" },
  { ad: "paraBirimi", tur: "metin" },
  { ad: "saglayici", tur: "secim", secenekler: ["stripe", "paypal", "iyzico", "paytr"] },
  { ad: "mod", tur: "secim", secenekler: ["test", "canli"] },
  { ad: "kalemler", tur: "json", aciklama: "Ürün kimliği, ad, birim fiyat, adet, tutar" },
  { ad: "alici", tur: "json" },
  { ad: "eposta", tur: "eposta" },
  { ad: "odemeKimligi", tur: "metin", aciklama: "Stripe payment_intent, PayPal capture kimliği, iyzico paymentId ya da PayTR sipariş no" },
  { ad: "odemeZamani", tur: "tarih" },
  { ad: "taksit", tur: "sayi" },
  { ad: "kart", tur: "metin" },
  { ad: "hata", tur: "metin" },
  { ad: "iadeTutari", tur: "sayi" },
  { ad: "iadeZamani", tur: "tarih" },
  { ad: "olaylar", tur: "json" },
  { ad: "ic", tur: "json", aciklama: "Sağlayıcı ayrıntısı (belirteç, işlem kimlikleri, dönüş adresleri); siteye gönderilmez" },
]) ?? [];
export const URUN_SEMA: Sutun[] = semaTemizle([
  { ad: "ad", tur: "metin", zorunlu: true },
  { ad: "fiyat", tur: "sayi", zorunlu: true, aciklama: "Mağazanın ana para biriminde satış fiyatı (vergi dahil ya da hariç, mağaza ayarına göre)" },
  { ad: "aciklama", tur: "uzunMetin" },
  { ad: "gorsel", tur: "gorsel" },
  { ad: "stok", tur: "sayi", aciklama: "Boşsa sınırsız; ödeme alınınca düşer" },
  { ad: "aktif", tur: "mantiksal", varsayilan: true },
]) ?? [];

function siparisTablosu(v: Veritabani): Koleksiyon {
  const k = v.koleksiyonlar[SIPARIS_TABLOSU] ??= { kurallar: { ...KAPALI }, kayitlar: [], sema: SIPARIS_SEMA, aciklama: "Vayra Ödeme siparişleri. Yalnız sunucu yazar; ziyaretçiye kapalı." };
  // Siparişte kişisel veri ve tutar var: kurallar her yazımda kapalıya döner.
  k.kurallar = { ...KAPALI };
  const var_ = new Set((k.sema ?? []).map((s) => s.ad));
  k.sema = [...(k.sema ?? []), ...SIPARIS_SEMA.filter((s) => !var_.has(s.ad))];
  return k;
}

/** Ürün tablosunu kurar (yoksa); varsa şemasına yalnız eksik "fiyat" sütununu ekler, başka hiçbir şeye dokunmaz. */
export async function urunTablosuKur(id: string, ortam: VeriOrtami, tablo = "urunler"): Promise<"kuruldu" | "vardi"> {
  return veriDegistir(id, (v) => {
    const k = v.koleksiyonlar[tablo];
    if (!k) { v.koleksiyonlar[tablo] = { kurallar: { okuma: "herkes", ekleme: "kapali", duzenleme: "kapali" }, kayitlar: [], sema: URUN_SEMA, aciklama: "Satılan ürünler. Ödemede fiyat bu tablodan sunucuda okunur." }; return "kuruldu" as const; }
    if (k.sema?.length && !k.sema.some((s) => s.ad === "fiyat")) k.sema.push({ ad: "fiyat", tur: "sayi", aciklama: "Mağazanın ana para biriminde satış fiyatı" });
    return "vardi" as const;
  }, ortam);
}

/* ───────────── Sepet: fiyat sunucuda ───────────── */
/** Sepet kalemi; fiyat ve tutar siparişin para biriminde (en küçük birimin yüzde biri hassasiyetinde). */
export type Kalem = { id: string; ad: string; kategori?: string; fiyat: number; adet: number; tutar: number };
export const kurus = (tl: number) => Math.round(tl * 100);
export const tlYaz = (k: number) => (k / 100).toFixed(2);
/** iyzico için sondaki sıfırları atan tutar ("150.00" → "150", "10.50" → "10.5"); imza da bu biçimle hesaplanır. */
export const iyzicoFiyat = (v: unknown) => { const s = String(v ?? ""); return s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s; };

/** Sepeti ürün tablosundan hesaplar; toplam kuruştur. */
export async function sepetHesapla(id: string, ortam: VeriOrtami, tablo: string, istek: unknown): Promise<{ kalemler: Kalem[]; toplam: number }> {
  if (!Array.isArray(istek) || !istek.length) throw new OdemeHata("Sepet boş.");
  if (istek.length > 50) throw new OdemeHata("Sepette en çok 50 ürün olabilir.");
  const adetler = new Map<string, number>();
  for (const x of istek) {
    const o = (x ?? {}) as { id?: unknown; adet?: unknown };
    const uid = String(o.id ?? "").trim();
    const adet = o.adet === undefined ? 1 : Number(o.adet);
    if (!uid || uid.length > 64) throw new OdemeHata("Ürün kimliği geçersiz.");
    if (!Number.isInteger(adet) || adet < 1 || adet > 100) throw new OdemeHata("Adet 1 ile 100 arasında tam sayı olmalı.");
    adetler.set(uid, (adetler.get(uid) ?? 0) + adet);
  }
  const k = (await veriOku(id, ortam)).koleksiyonlar[tablo];
  if (!k) throw new OdemeHata(`"${tablo}" tablosu yok; önce ürünleri ekle.`, 409);
  const kalemler: Kalem[] = [];
  for (const [uid, adet] of adetler) {
    const r = k.kayitlar.find((x) => x.id === uid);
    if (!r) throw new OdemeHata(`Ürün bulunamadı (${uid}).`);
    const ad = String(r.ad ?? r.baslik ?? "Ürün").slice(0, 100);
    if (r.aktif === false || r.stokta === false) throw new OdemeHata(`"${ad}" şu an satışta değil.`);
    const f = typeof r.fiyat === "number" ? r.fiyat : Number(String(r.fiyat ?? "").replace(/\s|TL|₺/gi, "").replace(",", "."));
    if (!Number.isFinite(f) || f <= 0) throw new OdemeHata(`"${ad}" için geçerli bir fiyat yok.`);
    if (typeof r.stok === "number" && adet > r.stok) throw new OdemeHata(r.stok > 0 ? `"${ad}" için stokta ${r.stok} adet var.` : `"${ad}" tükendi.`);
    const birim = kurus(f);
    kalemler.push({ id: uid, ad, ...(r.kategori ? { kategori: String(r.kategori).slice(0, 60) } : {}), fiyat: birim / 100, adet, tutar: (birim * adet) / 100 });
  }
  const toplam = kalemler.reduce((t, x) => t + kurus(x.tutar), 0);
  if (toplam < 100) throw new OdemeHata("Sepet tutarı en az 1 birim olmalı.");
  return { kalemler, toplam };
}

/* ───────────── Alıcı ───────────── */
/** ulke: ISO 3166-1 alfa-2 (teslimat ve fatura ülkesi); bolge: eyalet, il ya da county. */
export type Alici = { ad: string; soyad: string; eposta: string; telefon: string; adres: string; sehir: string; postaKodu?: string; tc?: string; ulke?: string; bolge?: string };
export function aliciTemizle(g: unknown, s: Saglayici, varsUlke = ""): Alici {
  const o = (g ?? {}) as Record<string, unknown>;
  const m = (a: string, n = 120) => String(o[a] ?? "").replace(/[<>]/g, "").trim().slice(0, n);
  const ulke = /^[A-Za-z]{2}$/.test(m("ulke", 2)) ? m("ulke", 2).toUpperCase() : varsUlke;
  const a: Alici = { ad: m("ad", 60), soyad: m("soyad", 60), eposta: m("eposta", 120).toLowerCase(), telefon: telefonE164(m("telefon", 30), ulke), adres: m("adres", 250), sehir: m("sehir", 60) };
  if (ulke) a.ulke = ulke;
  if (m("bolge", 60)) a.bolge = m("bolge", 60);
  if (m("postaKodu", 12)) a.postaKodu = m("postaKodu", 12);
  if (/^\d{11}$/.test(m("tc", 11))) a.tc = m("tc", 11);
  if (!a.ad || !a.soyad) throw new OdemeHata("Alıcının adı ve soyadı gerekli.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.eposta)) throw new OdemeHata("Alıcının e-posta adresi geçersiz.");
  if (s === "iyzico" || s === "paytr") {
    if (!/^\+\d{10,15}$/.test(a.telefon)) throw new OdemeHata("Alıcının telefon numarası geçersiz.");
    if (a.adres.length < 5) throw new OdemeHata("Alıcının adresi gerekli.");
    if (!a.sehir) throw new OdemeHata("Alıcının şehri gerekli.");
  }
  return a;
}
/** Para biriminin en küçük birimi cinsinden tutar (Stripe unit_amount: USD sent, JPY yen). */
export const kucukBirim = (n: number, para: string) => Math.round(n * 10 ** paraOndalik(para));

/* ───────────── Siparişler ───────────── */
const ALFA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
/** PayTR merchant_oid yalnız harf ve rakam kabul eder: VS + 14 karakter. */
export const siparisNoUret = () => "VS" + [...randomBytes(14)].map((b) => ALFA[b % ALFA.length]).join("");
export const siparisNoGecerli = (s: string) => /^VS[A-Z0-9]{14}$/.test(s);
export type Olay = { z: number; olay: string; ayrinti?: string };
export type SiparisIc = {
  donus: { basari: string; hata: string }; urunOrtami: VeriOrtami; kaynak?: string; ip?: string;
  token?: string; oturum?: string; iframe?: string; islemler?: { id: string; tutar: string }[]; stokDustu?: boolean; bildirimler?: string[];
};
export type SiparisAlanlari = {
  siparisNo: string; durum: SiparisDurum; tutar: number; paraBirimi: string; saglayici: Saglayici; mod: OdemeMod; kalemler: Kalem[]; alici: Alici; eposta: string;
  odemeKimligi?: string | null; odemeZamani?: string | null; taksit?: number | null; kart?: string | null; hata?: string | null; iadeTutari?: number | null; iadeZamani?: string | null;
  olaylar: Olay[]; ic: SiparisIc;
};
export type Siparis = Kayit & SiparisAlanlari;
export const siparisOrtami = (mod: OdemeMod): VeriOrtami => (mod === "test" ? "test" : "canli");

/** Siparişi iki ortamda da arar (önce Test). */
export async function siparisBul(id: string, f: string | ((k: Siparis) => boolean)): Promise<{ ortam: VeriOrtami; s: Siparis } | null> {
  const es = typeof f === "string" ? (k: Siparis) => k.siparisNo === f : f;
  for (const ortam of ["test", "canli"] as const) {
    const k = (await veriOku(id, ortam)).koleksiyonlar[SIPARIS_TABLOSU];
    const s = (k?.kayitlar as Siparis[] | undefined)?.find(es);
    if (s) return { ortam, s };
  }
  return null;
}

export async function siparisOlustur(id: string, s: SiparisAlanlari): Promise<Siparis> {
  return veriDegistir(id, (v) => {
    const k = siparisTablosu(v);
    if (k.kayitlar.length >= 5000) {
      // Eski bekleyen siparişler (7 günden eski) yer açmak için atılır; ödenenler hiç silinmez.
      const sinir = Date.now() - 7 * 864e5;
      k.kayitlar = k.kayitlar.filter((x) => x.durum !== "bekliyor" || x.olusturma > sinir);
      if (k.kayitlar.length >= 5000) throw new OdemeHata("Sipariş tablosu dolu.", 507);
    }
    const z = Date.now();
    const y = { id: randomBytes(8).toString("base64url"), olusturma: z, guncelleme: z, ...s } as Siparis;
    k.kayitlar.push(y);
    return y;
  }, siparisOrtami(s.mod));
}

/** Siteye ve sistemlere giden biçim: iç ayrıntı (belirteçler) atılır. */
export function siparisDis(s: Siparis) { const { ic: _ic, ...d } = s; void _ic; return d; }
/** Herkese açık durum (vayra.odeme.durum): kişisel veri yok. */
export function siparisGenel(s: Siparis) {
  return { siparisNo: s.siparisNo, durum: s.durum, tutar: s.tutar, paraBirimi: s.paraBirimi, kalemler: s.kalemler.map((k) => ({ id: k.id, ad: k.ad, fiyat: k.fiyat, adet: k.adet, tutar: k.tutar })), olusturma: s.olusturma, odemeZamani: s.odemeZamani ?? null, test: s.mod === "test", ...(s.durum === "basarisiz" && s.hata ? { hata: s.hata } : {}) };
}

type Sonuc = { durum: SiparisDurum; olay: string; ayrinti?: string; alanlar?: Partial<Siparis>; ic?: Partial<SiparisIc> };
/**
 * Sağlayıcıdan doğrulanmış sonucu siparişe işler. Geçişler: bekliyor/basarisiz → odendi, bekliyor → basarisiz,
 * odendi → iade; aynı sonucun tekrarı (yinelenen bildirim) hiçbir şeyi değiştirmez. Değişince sistemler tetiklenir,
 * günlüğe yazılır ve (ödendiyse) stok düşer.
 */
export async function sonucIsle(id: string, ortam: VeriOrtami, siparisNo: string, r: Sonuc): Promise<{ s: Siparis; degisti: boolean }> {
  const sonuc = await veriDegistir(id, (v) => {
    const k = siparisTablosu(v);
    const s = k.kayitlar.find((x) => x.siparisNo === siparisNo) as Siparis | undefined;
    if (!s) throw new OdemeHata("Sipariş bulunamadı.", 404);
    const izin = r.durum === s.durum ? false : r.durum === "odendi" ? s.durum === "bekliyor" || s.durum === "basarisiz" : r.durum === "basarisiz" ? s.durum === "bekliyor" : r.durum === "iade" ? s.durum === "odendi" : false;
    s.olaylar = [...(s.olaylar ?? []), { z: Date.now(), olay: r.olay, ...(r.ayrinti ? { ayrinti: r.ayrinti.slice(0, 300) } : {}) }].slice(-40);
    if (r.ic) s.ic = { ...s.ic, ...r.ic };
    if (izin) {
      Object.assign(s, r.alanlar ?? {});
      s.durum = r.durum;
      if (r.durum === "odendi") { s.odemeZamani = new Date().toISOString(); s.hata = null; }
    }
    s.guncelleme = Date.now();
    return { s: JSON.parse(JSON.stringify(s)) as Siparis, degisti: izin };
  }, ortam);
  if (sonuc.degisti) await sonrasi(id, ortam, sonuc.s).catch(() => {});
  return sonuc;
}

/** Ödeme sonrası: stok, günlük ve sistem tetikleri (sistemMotoru tembel yüklenir; döngüsel bağımlılık olmaz). */
async function sonrasi(id: string, ortam: VeriOrtami, s: Siparis) {
  const { gunlukYaz } = await import("./gunluk");
  const tutar = paraYaz(s.tutar, s.paraBirimi || "TRY");
  const ek = `${SAGLAYICI_AD[s.saglayici]}${s.mod === "test" ? ", test" : ""}`;
  if (s.durum === "odendi") {
    await stokDus(id, s).catch(() => {});
    gunlukYaz(id, { t: "veri", d: 200, y: "/odeme", m: `Ödeme alındı: ${s.siparisNo}, ${tutar} (${ek})` });
  } else if (s.durum === "basarisiz") gunlukYaz(id, { t: "veri", d: 402, y: "/odeme", m: `Ödeme başarısız: ${s.siparisNo} (${ek})${s.hata ? `: ${s.hata}` : ""}` });
  else if (s.durum === "iade") gunlukYaz(id, { t: "veri", d: 200, y: "/odeme", m: `İade edildi: ${s.siparisNo}, ${tutar} (${ek})` });
  const { sistemTetikle } = await import("./sistemMotoru");
  const veri = { proje: id, koleksiyon: SIPARIS_TABLOSU, kayit: siparisDis(s), olay: s.durum, ortam };
  // Ödenen sipariş "siparisler" tablosunun "Yeni kayıt" tetiğini çalıştırır (bekleyen siparişler tetiklemez).
  if (s.durum === "odendi") sistemTetikle(`veri:${id}:${SIPARIS_TABLOSU}`, veri).catch(() => {});
  sistemTetikle(`odeme:${id}`, veri).catch(() => {});
}

/** Ödenen siparişte sayısal stok düşer. Test ödemesi Canlı stoğa hiç dokunmaz. */
async function stokDus(id: string, s: Siparis) {
  const o = s.ic.urunOrtami;
  if (s.ic.stokDustu || (s.mod === "test" && o === "canli")) return;
  const tablo = (await odemeAyarOku(id)).urunTablosu || "urunler";
  await veriDegistir(id, (v) => {
    const k = v.koleksiyonlar[tablo];
    if (!k) return;
    for (const x of s.kalemler) { const r = k.kayitlar.find((y) => y.id === x.id); if (r && typeof r.stok === "number") { r.stok = Math.max(0, r.stok - x.adet); r.guncelleme = Date.now(); } }
  }, o);
  await veriDegistir(id, (v) => { const r = v.koleksiyonlar[SIPARIS_TABLOSU]?.kayitlar.find((x) => x.siparisNo === s.siparisNo) as Siparis | undefined; if (r) r.ic = { ...r.ic, stokDustu: true }; }, siparisOrtami(s.mod));
}

/* ───────────── İmza yardımcıları ───────────── */
const esit = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
const hmacHex = (anahtar: string, veri: string) => createHmac("sha256", anahtar).update(veri).digest("hex");
const hmacB64 = (anahtar: string, veri: string) => createHmac("sha256", anahtar).update(veri).digest("base64");
async function jsonOku(r: Response): Promise<Record<string, unknown> | null> { const t = await r.text(); try { return JSON.parse(t) as Record<string, unknown>; } catch { return t ? { metin: t.slice(0, 300) } : null; } }
const ZAMAN = 15_000;

/* ───────────── iyzico ───────────── */
/** IYZWSv2: HMAC-SHA256(randomKey + uri yolu + gövde, secretKey) hex; başlık "IYZWSv2 " + base64("apiKey:..&randomKey:..&signature:.."). */
async function iyzicoIstek(k: Kimlik, t: string, yol: string, govde: Record<string, unknown>): Promise<Record<string, unknown>> {
  const rnd = `${Date.now()}${randomBytes(6).toString("hex")}`;
  const metin = JSON.stringify(govde);
  const imza = hmacHex(k.IYZICO_SECRET_KEY, rnd + yol + metin);
  const yetki = `IYZWSv2 ${Buffer.from(`apiKey:${k.IYZICO_API_KEY}&randomKey:${rnd}&signature:${imza}`).toString("base64")}`;
  let r: Response;
  try { r = await fetch(t + yol, { method: "POST", signal: AbortSignal.timeout(ZAMAN), headers: { Authorization: yetki, "x-iyzi-rnd": rnd, "Content-Type": "application/json", Accept: "application/json" }, body: metin }); }
  catch { throw new OdemeHata("iyzico'ya ulaşılamadı; biraz sonra tekrar dene.", 502); }
  const j = await jsonOku(r);
  if (!j || j.status !== "success") throw new OdemeHata(`iyzico: ${String(j?.errorMessage ?? `yanıt vermedi (${r.status})`)}${j?.errorCode ? ` (kod ${String(j.errorCode)})` : ""}`, 502);
  return j;
}
/** Yanıt imzası (Response Signature Validation): değerler ":" ile birleşir, HMAC-SHA256 hex, fiyatlarda sondaki sıfırlar atılır. */
function iyzicoImzaDogru(j: Record<string, unknown>, alanlar: string[], gizli: string): boolean {
  if (typeof j.signature !== "string" || !j.signature) return true; // imzasız eski yanıt: TLS ve tutar denetimi yeterli
  const veri = alanlar.map((a) => (/price$/i.test(a) ? iyzicoFiyat(j[a]) : String(j[a] ?? ""))).join(":");
  return esit(hmacHex(gizli, veri), j.signature);
}
const TAKSITLER = [1, 2, 3, 6, 9, 12];

/* ───────────── Başlat ───────────── */
export type BaslatGirdi = { p: Proje; ayar: OdemeAyar; mod: OdemeMod; koken: string; ip: string; s: Siparis };
export type BaslatSonuc = { adres: string; iframe?: string; ic: Partial<SiparisIc> };
const odemeKok = (koken: string, id: string) => `${koken}/api/build/odeme/${id}`;

export async function saglayiciBaslat(g: BaslatGirdi): Promise<BaslatSonuc> {
  const { p, ayar, mod, koken, s } = g;
  const sag = s.saglayici;
  const k = kimlik(p, sag, mod);
  const t = taban(ayar, sag, mod);
  const a = s.alici;
  const kok = odemeKok(koken, p.id);
  const toplam = s.kalemler.reduce((x, y) => x + kurus(y.tutar), 0);
  if (sag === "iyzico") {
    const govde = {
      locale: s.paraBirimi === "TRY" ? "tr" : "en", conversationId: s.siparisNo, price: iyzicoFiyat(tlYaz(toplam)), paidPrice: iyzicoFiyat(tlYaz(toplam)), currency: s.paraBirimi, basketId: s.siparisNo, paymentGroup: "PRODUCT",
      callbackUrl: `${kok}/donus/iyzico?s=${s.siparisNo}`, enabledInstallments: TAKSITLER.filter((x) => x <= Math.max(1, ayar.taksit)),
      buyer: {
        id: `V${createHash("sha256").update(a.eposta).digest("hex").slice(0, 12)}`, name: a.ad, surname: a.soyad, identityNumber: a.tc ?? "11111111111", email: a.eposta, gsmNumber: a.telefon,
        registrationAddress: a.adres, city: a.sehir, country: ulkeIngilizce(a.ulke || "TR"), ...(a.postaKodu ? { zipCode: a.postaKodu } : {}), ip: g.ip,
      },
      shippingAddress: { contactName: `${a.ad} ${a.soyad}`, city: a.sehir, country: ulkeIngilizce(a.ulke || "TR"), address: a.adres, ...(a.postaKodu ? { zipCode: a.postaKodu } : {}) },
      billingAddress: { contactName: `${a.ad} ${a.soyad}`, city: a.sehir, country: ulkeIngilizce(a.ulke || "TR"), address: a.adres, ...(a.postaKodu ? { zipCode: a.postaKodu } : {}) },
      basketItems: s.kalemler.map((x) => ({ id: x.id, name: x.ad, category1: x.kategori || "Genel", itemType: "PHYSICAL", price: iyzicoFiyat(tlYaz(kurus(x.tutar))) })),
    };
    const j = await iyzicoIstek(k, t, "/payment/iyzipos/checkoutform/initialize/auth/ecom", govde);
    if (!iyzicoImzaDogru(j, ["conversationId", "token"], k.IYZICO_SECRET_KEY)) throw new OdemeHata("iyzico yanıt imzası doğrulanamadı.", 502);
    if (typeof j.token !== "string" || typeof j.paymentPageUrl !== "string") throw new OdemeHata("iyzico ödeme sayfası adresi dönmedi.", 502);
    return { adres: j.paymentPageUrl, ic: { token: j.token } };
  }
  if (sag === "paytr") {
    const merchant_id = k.PAYTR_MERCHANT_ID;
    const user_basket = Buffer.from(JSON.stringify(s.kalemler.map((x) => [x.ad, tlYaz(kurus(x.fiyat)), x.adet]))).toString("base64");
    const taksit = Math.min(12, Math.max(1, ayar.taksit));
    const alan: Record<string, string> = {
      merchant_id, user_ip: g.ip, merchant_oid: s.siparisNo, email: a.eposta, payment_amount: String(toplam), user_basket,
      no_installment: taksit <= 1 ? "1" : "0", max_installment: taksit <= 1 ? "0" : String(taksit), currency: s.paraBirimi === "TRY" || !s.paraBirimi ? "TL" : s.paraBirimi, test_mode: mod === "test" ? "1" : "0",
    };
    const hashStr = alan.merchant_id + alan.user_ip + alan.merchant_oid + alan.email + alan.payment_amount + alan.user_basket + alan.no_installment + alan.max_installment + alan.currency + alan.test_mode;
    const govde = new URLSearchParams({
      ...alan, paytr_token: hmacB64(k.PAYTR_MERCHANT_KEY, hashStr + k.PAYTR_MERCHANT_SALT), debug_on: mod === "test" ? "1" : "0",
      user_name: `${a.ad} ${a.soyad}`.slice(0, 60), user_address: a.adres.slice(0, 400), user_phone: a.telefon.slice(0, 20),
      merchant_ok_url: `${kok}/donus/paytr?s=${s.siparisNo}&sonuc=basarili`, merchant_fail_url: `${kok}/donus/paytr?s=${s.siparisNo}&sonuc=hata`, timeout_limit: "30", lang: s.paraBirimi === "TRY" ? "tr" : "en",
    });
    let r: Response;
    try { r = await fetch(`${t}/odeme/api/get-token`, { method: "POST", signal: AbortSignal.timeout(ZAMAN), headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body: govde.toString() }); }
    catch { throw new OdemeHata("PayTR'ye ulaşılamadı; biraz sonra tekrar dene.", 502); }
    const j = await jsonOku(r);
    if (j?.status !== "success" || typeof j.token !== "string") throw new OdemeHata(`PayTR: ${String(j?.reason ?? j?.err_msg ?? j?.metin ?? `yanıt vermedi (${r.status})`)}`, 502);
    const iframe = `${yerelTaban(ayar, "paytr") ?? "https://www.paytr.com"}/odeme/guvenli/${j.token}`;
    return { adres: `${kok}/sayfa/${s.siparisNo}`, iframe, ic: { token: j.token, iframe } };
  }
  if (sag === "paypal") {
    const para = s.paraBirimi;
    const deger = (n: number) => ppTutar(n, para);
    const kalemToplam = s.kalemler.reduce((x, y) => x + Math.round(Number(deger(y.fiyat)) * 100) * y.adet, 0);
    const kalemli = kalemToplam === Math.round(Number(deger(s.tutar)) * 100);
    const govde = {
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: s.siparisNo, custom_id: s.siparisNo, invoice_id: `${p.id.slice(0, 40)}-${s.siparisNo}`, description: `Sipariş ${s.siparisNo}`.slice(0, 127),
        amount: { currency_code: para, value: deger(s.tutar), ...(kalemli ? { breakdown: { item_total: { currency_code: para, value: deger(kalemToplam / 100) } } } : {}) },
        ...(kalemli ? { items: s.kalemler.map((x) => ({ name: x.ad.slice(0, 127), quantity: String(x.adet), unit_amount: { currency_code: para, value: deger(x.fiyat) }, category: x.kategori === "Kargo" || x.id === "vergi" ? "DIGITAL_GOODS" : "PHYSICAL_GOODS" })).map((x) => ({ ...x, category: x.category === "DIGITAL_GOODS" ? undefined : x.category })) } : {}),
      }],
      payment_source: { paypal: { experience_context: { return_url: `${kok}/donus/paypal?s=${s.siparisNo}`, cancel_url: `${kok}/donus/paypal?s=${s.siparisNo}&iptal=1`, user_action: "PAY_NOW", shipping_preference: "NO_SHIPPING", brand_name: (p.ad || "Vayra").slice(0, 127) } } },
    };
    const j = await paypalIstek(k, t, "POST", "/v2/checkout/orders", govde, `vs-${s.siparisNo}`);
    const link = (Array.isArray(j.links) ? (j.links as { rel?: string; href?: string }[]) : []).find((x) => x.rel === "payer-action" || x.rel === "approve");
    if (typeof j.id !== "string" || !link?.href) throw new OdemeHata("PayPal ödeme sayfası adresi dönmedi.", 502);
    return { adres: link.href, ic: { oturum: j.id } };
  }
  // Stripe Checkout (mode=payment, price_data ile satır; tutar para biriminin en küçük biriminde).
  const para = (s.paraBirimi || "TRY").toLowerCase();
  const f = new URLSearchParams();
  f.set("mode", "payment");
  f.set("success_url", `${kok}/donus/stripe?s=${s.siparisNo}&session_id={CHECKOUT_SESSION_ID}`);
  f.set("cancel_url", `${kok}/donus/stripe?s=${s.siparisNo}&iptal=1`);
  f.set("client_reference_id", s.siparisNo);
  f.set("customer_email", a.eposta);
  f.set("locale", "auto");
  f.set("metadata[siparisNo]", s.siparisNo); f.set("metadata[proje]", p.id);
  f.set("payment_intent_data[metadata][siparisNo]", s.siparisNo); f.set("payment_intent_data[metadata][proje]", p.id);
  s.kalemler.forEach((x, i) => {
    f.set(`line_items[${i}][price_data][currency]`, para);
    f.set(`line_items[${i}][price_data][unit_amount]`, String(kucukBirim(x.fiyat, s.paraBirimi || "TRY")));
    f.set(`line_items[${i}][price_data][product_data][name]`, x.ad);
    f.set(`line_items[${i}][quantity]`, String(x.adet));
  });
  const j = await stripeIstek(k, t, "POST", "/v1/checkout/sessions", f);
  if (typeof j.id !== "string" || typeof j.url !== "string") throw new OdemeHata("Stripe ödeme sayfası adresi dönmedi.", 502);
  return { adres: j.url, ic: { oturum: j.id } };
}

/* ───────────── PayPal ───────────── */
/** PayPal tutar biçimi: HUF, JPY, TWD ondalıksız; diğerleri iki ondalık. */
const ppTutar = (n: number, para: string) => { if (PAYPAL_TAM.has(para)) { if (Math.round(n) !== Math.round(n * 100) / 100) throw new OdemeHata(`PayPal ${para} tutarında ondalık kabul etmez; fiyatları tam sayı yap.`, 409); return String(Math.round(n)); } return n.toFixed(2); };
const ppBelirtec = new Map<string, { b: string; bitis: number }>();
/** OAuth 2.0 client credentials: POST /v1/oauth2/token, Basic client_id:secret; belirteç süresi dolana kadar saklanır. */
async function paypalBelirteci(k: Kimlik, t: string): Promise<string> {
  const anahtar = `${t}|${k.PAYPAL_CLIENT_ID}`;
  const e = ppBelirtec.get(anahtar);
  if (e && e.bitis > Date.now() + 60_000) return e.b;
  let r: Response;
  try { r = await fetch(`${t}/v1/oauth2/token`, { method: "POST", signal: AbortSignal.timeout(ZAMAN), headers: { Authorization: `Basic ${Buffer.from(`${k.PAYPAL_CLIENT_ID}:${k.PAYPAL_CLIENT_SECRET}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body: "grant_type=client_credentials" }); }
  catch { throw new OdemeHata("PayPal'a ulaşılamadı; biraz sonra tekrar dene.", 502); }
  const j = await jsonOku(r);
  if (!r.ok || typeof j?.access_token !== "string") throw new OdemeHata(`PayPal kimlik doğrulaması başarısız: ${String(j?.error_description ?? j?.error ?? r.status)}. Client ID ve Secret'ı kontrol et.`, 502);
  ppBelirtec.set(anahtar, { b: j.access_token, bitis: Date.now() + (Number(j.expires_in) || 3000) * 1000 });
  return j.access_token;
}
async function paypalIstek(k: Kimlik, t: string, yontem: "GET" | "POST", yol: string, govde?: unknown, istekNo?: string): Promise<Record<string, unknown>> {
  const b = await paypalBelirteci(k, t);
  let r: Response;
  try { r = await fetch(t + yol, { method: yontem, signal: AbortSignal.timeout(ZAMAN), headers: { Authorization: `Bearer ${b}`, Accept: "application/json", ...(govde !== undefined ? { "Content-Type": "application/json" } : {}), ...(istekNo ? { "PayPal-Request-Id": istekNo } : {}), Prefer: "return=representation" }, body: govde !== undefined ? JSON.stringify(govde) : undefined }); }
  catch { throw new OdemeHata("PayPal'a ulaşılamadı; biraz sonra tekrar dene.", 502); }
  const j = await jsonOku(r);
  if (!r.ok || !j) {
    const ayr = Array.isArray(j?.details) ? (j!.details as { issue?: string; description?: string }[])[0] : undefined;
    const e = new OdemeHata(`PayPal: ${ayr?.description ?? String(j?.message ?? `yanıt vermedi (${r.status})`)}${ayr?.issue ? ` (${ayr.issue})` : ""}`, 502) as OdemeHata & { sorun?: string };
    e.sorun = ayr?.issue;
    throw e;
  }
  return j;
}
type PpYakalama = { id?: string; status?: string; amount?: { currency_code?: string; value?: string }; custom_id?: string };
/** PayPal siparişinin sonucu: onaylanmışsa tahsil eder (capture), sonra tutar, para birimi ve sipariş eşleşmesi denetlenir. */
export async function paypalSonuc(p: Proje, ayar: OdemeAyar, s: Siparis): Promise<Sonuc> {
  const no = s.ic.oturum;
  if (!no || !/^[A-Z0-9]{8,40}$/.test(no)) return { durum: "bekliyor", olay: "Bu siparişte PayPal sipariş kimliği yok" };
  const k = kimlik(p, "paypal", s.mod), t = taban(ayar, "paypal", s.mod);
  let o = await paypalIstek(k, t, "GET", `/v2/checkout/orders/${no}`);
  if (o.status === "APPROVED") {
    try { o = await paypalIstek(k, t, "POST", `/v2/checkout/orders/${no}/capture`, {}, `cap-${s.siparisNo}`); }
    catch (e) {
      const sorun = (e as { sorun?: string }).sorun;
      if (sorun === "INSTRUMENT_DECLINED" || sorun === "PAYER_ACTION_REQUIRED") return { durum: "basarisiz", olay: "PayPal ödemeyi reddetti", ayrinti: (e as Error).message, alanlar: { hata: "Ödeme yöntemi reddedildi; başka bir yöntem dene" } };
      o = await paypalIstek(k, t, "GET", `/v2/checkout/orders/${no}`);
    }
  }
  const birim = (Array.isArray(o.purchase_units) ? o.purchase_units[0] : {}) as { reference_id?: string; custom_id?: string; payments?: { captures?: PpYakalama[] } };
  if (birim.reference_id && birim.reference_id !== s.siparisNo && birim.custom_id !== s.siparisNo) return { durum: "bekliyor", olay: "PayPal siparişi başka siparişe ait" };
  if (o.status === "VOIDED") return { durum: "basarisiz", olay: "PayPal siparişi iptal edildi", alanlar: { hata: "Ödeme tamamlanmadı" } };
  if (o.status !== "COMPLETED") return { durum: "bekliyor", olay: o.status === "PAYER_ACTION_REQUIRED" || o.status === "CREATED" ? "PayPal ödemesi alıcıyı bekliyor" : `PayPal sipariş durumu: ${String(o.status)}` };
  const c = (birim.payments?.captures ?? [])[0];
  if (!c) return { durum: "bekliyor", olay: "PayPal tahsilatı bulunamadı" };
  return paypalYakalamaSonuc(s, c, "PayPal ödemesi onaylandı");
}
/** Tahsilat (capture) nesnesinden sonuç; webhook PAYMENT.CAPTURE.* olaylarında da kullanılır. */
export function paypalYakalamaSonuc(s: Siparis, c: PpYakalama, olay: string): Sonuc {
  if (c.status === "DECLINED" || c.status === "FAILED") return { durum: "basarisiz", olay: "PayPal tahsilatı reddedildi", alanlar: { hata: "Ödeme reddedildi" } };
  if (c.status === "REFUNDED") return { durum: "iade", olay: "PayPal iadesi", alanlar: { iadeTutari: s.tutar, iadeZamani: new Date().toISOString() } };
  if (c.status !== "COMPLETED") return { durum: "bekliyor", olay: `PayPal tahsilatı ${String(c.status ?? "bekliyor").toLowerCase()}` };
  if (String(c.amount?.currency_code) !== s.paraBirimi || Math.round(Number(c.amount?.value) * 100) !== Math.round(s.tutar * 100)) return { durum: "bekliyor", olay: "Tutar uyuşmuyor", ayrinti: `PayPal ${String(c.amount?.value)} ${String(c.amount?.currency_code)}`, alanlar: { hata: "Tutar uyuşmuyor; PayPal panelinden kontrol et" } };
  return { durum: "odendi", olay, ayrinti: `capture ${String(c.id)}`, alanlar: { odemeKimligi: String(c.id) } };
}
/** PayPal webhook imzası: POST /v1/notifications/verify-webhook-signature; hangi modun Webhook ID'siyle doğrulandığı döner. */
export async function paypalImzaDogrula(p: Proje, ayar: OdemeAyar, h: Headers, olay: unknown): Promise<OdemeMod | null> {
  const baslik = (a: string) => h.get(a) ?? "";
  if (!baslik("paypal-transmission-id") || !baslik("paypal-transmission-sig")) return null;
  for (const mod of ["test", "canli"] as const) {
    const wid = anahtarAl(p, "PAYPAL_WEBHOOK_ID", mod);
    if (!wid || !anahtarAl(p, "PAYPAL_CLIENT_ID", mod) || !anahtarAl(p, "PAYPAL_CLIENT_SECRET", mod)) continue;
    try {
      const j = await paypalIstek(kimlik(p, "paypal", mod), taban(ayar, "paypal", mod), "POST", "/v1/notifications/verify-webhook-signature", {
        auth_algo: baslik("paypal-auth-algo"), cert_url: baslik("paypal-cert-url"), transmission_id: baslik("paypal-transmission-id"), transmission_sig: baslik("paypal-transmission-sig"),
        transmission_time: baslik("paypal-transmission-time"), webhook_id: wid, webhook_event: olay,
      });
      if (j.verification_status === "SUCCESS") return mod;
    } catch { /* öbür mod denenir */ }
  }
  return null;
}

async function stripeIstek(k: Kimlik, t: string, yontem: "GET" | "POST", yol: string, govde?: URLSearchParams): Promise<Record<string, unknown>> {
  let r: Response;
  try { r = await fetch(t + yol, { method: yontem, signal: AbortSignal.timeout(ZAMAN), headers: { Authorization: `Bearer ${k.STRIPE_SECRET_KEY}`, ...(govde ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) }, body: govde?.toString() }); }
  catch { throw new OdemeHata("Stripe'a ulaşılamadı; biraz sonra tekrar dene.", 502); }
  const j = await jsonOku(r);
  if (!r.ok || !j) { const e = (j?.error ?? {}) as { message?: string; code?: string }; throw new OdemeHata(`Stripe: ${e.message ?? `yanıt vermedi (${r.status})`}`, 502); }
  return j;
}

/* ───────────── Sonuç doğrulama ───────────── */
/** iyzico Ödeme Formu sonucu (CF Retrieve): imza, sepet, tutar ve belirteç denetlenir. */
export async function iyzicoSonuc(p: Proje, ayar: OdemeAyar, s: Siparis, token: string): Promise<Sonuc> {
  if (!token || (s.ic.token && !esit(token, s.ic.token))) return { durum: "bekliyor", olay: "Geri dönüş belirteci siparişle eşleşmedi" };
  const k = kimlik(p, "iyzico", s.mod);
  let j: Record<string, unknown>;
  try { j = await iyzicoIstek(k, taban(ayar, "iyzico", s.mod), "/payment/iyzipos/checkoutform/auth/ecom/detail", { locale: "tr", conversationId: s.siparisNo, token }); }
  catch (e) {
    const m = (e as Error).message;
    return { durum: "basarisiz", olay: "iyzico ödemeyi onaylamadı", ayrinti: m, alanlar: { hata: m.replace(/^iyzico: /, "") } };
  }
  if (!iyzicoImzaDogru(j, ["paymentStatus", "paymentId", "currency", "basketId", "conversationId", "paidPrice", "price", "token"], k.IYZICO_SECRET_KEY)) return { durum: "bekliyor", olay: "iyzico yanıt imzası doğrulanamadı" };
  if (String(j.basketId) !== s.siparisNo || String(j.token) !== token) return { durum: "bekliyor", olay: "iyzico yanıtı başka siparişe ait" };
  if (j.paymentStatus !== "SUCCESS") return { durum: "basarisiz", olay: "iyzico ödemesi başarısız", ayrinti: String(j.errorMessage ?? j.paymentStatus ?? ""), alanlar: { hata: String(j.errorMessage ?? "Ödeme tamamlanmadı") } };
  const fiyat = Math.round(Number(j.price) * 100);
  if (fiyat !== Math.round(s.tutar * 100) || String(j.currency) !== (s.paraBirimi || "TRY")) return { durum: "bekliyor", olay: "Tutar uyuşmuyor", ayrinti: `iyzico ${String(j.price)} ${String(j.currency)}`, alanlar: { hata: "Tutar uyuşmuyor; iyzico panelinden kontrol et" } };
  if (Number(j.fraudStatus) === -1) return { durum: "basarisiz", olay: "iyzico dolandırıcılık denetimi reddetti", alanlar: { hata: "Ödeme risk denetiminden geçmedi" } };
  if (Number(j.fraudStatus) === 0) return { durum: "bekliyor", olay: "iyzico risk incelemesinde" };
  const islemler = Array.isArray(j.itemTransactions) ? (j.itemTransactions as Record<string, unknown>[]).map((x) => ({ id: String(x.paymentTransactionId), tutar: iyzicoFiyat(x.paidPrice) })) : [];
  return {
    durum: "odendi", olay: "iyzico ödemesi onaylandı", ayrinti: `paymentId ${String(j.paymentId)}`,
    alanlar: { odemeKimligi: String(j.paymentId), taksit: Number(j.installment) || 1, kart: [j.cardAssociation, j.lastFourDigits ? `son dört hane ${String(j.lastFourDigits)}` : ""].filter(Boolean).join(", ") || null },
    ic: { islemler },
  };
}

/** PayTR bildirimi: hash = base64(HMAC-SHA256(merchant_oid + merchant_salt + status + total_amount, merchant_key)). */
export function paytrBildirimDogrula(p: Proje, mod: OdemeMod, f: Record<string, string>): boolean {
  const key = anahtarAl(p, "PAYTR_MERCHANT_KEY", mod), salt = anahtarAl(p, "PAYTR_MERCHANT_SALT", mod);
  if (!key || !salt || !f.hash) return false;
  return esit(hmacB64(key, `${f.merchant_oid ?? ""}${salt}${f.status ?? ""}${f.total_amount ?? ""}`), f.hash);
}
export function paytrSonuc(s: Siparis, f: Record<string, string>): Sonuc {
  if ((f.test_mode === "1") !== (s.mod === "test")) return { durum: "bekliyor", olay: "PayTR bildirim modu siparişle uyuşmuyor", ayrinti: `test_mode ${f.test_mode ?? "0"}` };
  if (f.status !== "success") return { durum: "basarisiz", olay: "PayTR ödemesi başarısız", ayrinti: `${f.failed_reason_code ?? ""} ${f.failed_reason_msg ?? ""}`.trim(), alanlar: { hata: f.failed_reason_msg || "Ödeme tamamlanmadı" } };
  if (Number(f.payment_amount) !== Math.round(s.tutar * 100)) return { durum: "bekliyor", olay: "Tutar uyuşmuyor", ayrinti: `PayTR payment_amount ${f.payment_amount}`, alanlar: { hata: "Tutar uyuşmuyor; PayTR panelinden kontrol et" } };
  return { durum: "odendi", olay: "PayTR ödemesi onaylandı", ayrinti: `${f.payment_type === "eft" ? "Havale/EFT" : "Kart"}, tahsil edilen ${(Number(f.total_amount) / 100).toFixed(2)} TL`, alanlar: { odemeKimligi: s.siparisNo, kart: f.payment_type === "eft" ? "Havale/EFT" : "Kart" } };
}

/** Stripe imzası: Stripe-Signature "t=..,v1=.."; v1 = HMAC-SHA256(`${t}.${gövde}`, whsec) hex; 5 dakika tolerans. */
export function stripeImzaDogrula(p: Proje, baslik: string | null, govde: string, tolerans = 300): OdemeMod | null {
  if (!baslik) return null;
  const parca = baslik.split(",").map((x) => x.trim().split("="));
  const t = parca.find(([a]) => a === "t")?.[1];
  const v1 = parca.filter(([a]) => a === "v1").map(([, b]) => b ?? "");
  if (!t || !/^\d+$/.test(t) || !v1.length || Math.abs(Date.now() / 1000 - Number(t)) > tolerans) return null;
  for (const mod of ["test", "canli"] as const) {
    const sirri = mod === "test" ? sir(p, testAdi("STRIPE_WEBHOOK_SECRET")) || sir(p, "STRIPE_WEBHOOK_SECRET") : sir(p, "STRIPE_WEBHOOK_SECRET");
    if (!sirri) continue;
    const beklenen = hmacHex(sirri, `${t}.${govde}`);
    if (v1.some((x) => esit(beklenen, x))) return mod;
  }
  return null;
}
/** Stripe Checkout oturumu nesnesinden sonuç (webhook ya da dönüşte sunucudan çekilen oturum). */
export function stripeOturumSonuc(s: Siparis, o: Record<string, unknown>, olay: string): Sonuc {
  if (String(o.client_reference_id ?? "") !== s.siparisNo || (s.ic.oturum && String(o.id) !== s.ic.oturum)) return { durum: "bekliyor", olay: "Stripe oturumu başka siparişe ait" };
  const pi = typeof o.payment_intent === "string" ? o.payment_intent : (o.payment_intent as { id?: string } | null)?.id;
  if (olay === "checkout.session.expired") return { durum: "basarisiz", olay: "Stripe ödeme süresi doldu", alanlar: { hata: "Ödeme süresi doldu" } };
  if (olay === "checkout.session.async_payment_failed") return { durum: "basarisiz", olay: "Stripe ödemesi başarısız", alanlar: { hata: "Ödeme tamamlanmadı" } };
  if (o.payment_status !== "paid") return { durum: "bekliyor", olay: o.status === "complete" ? "Stripe ödemesi onay bekliyor" : "Stripe ödemesi tamamlanmadı" };
  if (Number(o.amount_total) !== kucukBirim(s.tutar, s.paraBirimi || "TRY") || String(o.currency).toLowerCase() !== (s.paraBirimi || "TRY").toLowerCase()) return { durum: "bekliyor", olay: "Tutar uyuşmuyor", ayrinti: `Stripe ${String(o.amount_total)} ${String(o.currency)}`, alanlar: { hata: "Tutar uyuşmuyor; Stripe panelinden kontrol et" } };
  return { durum: "odendi", olay: "Stripe ödemesi onaylandı", ayrinti: pi ? `payment_intent ${pi}` : undefined, alanlar: { odemeKimligi: pi ?? String(o.id) } };
}
export async function stripeOturumGetir(p: Proje, ayar: OdemeAyar, s: Siparis, oturum: string): Promise<Record<string, unknown>> {
  if (!/^cs_[A-Za-z0-9_]+$/.test(oturum)) throw new OdemeHata("Oturum kimliği geçersiz.");
  return stripeIstek(kimlik(p, "stripe", s.mod), taban(ayar, "stripe", s.mod), "GET", `/v1/checkout/sessions/${oturum}`);
}

/** Bekleyen siparişin durumunu sağlayıcıdan yeniden sorgular (alıcı dönüşten önce sekmeyi kapattıysa). */
export async function siparisSorgula(p: Proje, ayar: OdemeAyar, s: Siparis): Promise<Sonuc> {
  if (s.saglayici === "iyzico") { if (!s.ic.token) throw new OdemeHata("Bu siparişte iyzico belirteci yok."); return iyzicoSonuc(p, ayar, s, s.ic.token); }
  if (s.saglayici === "stripe") { if (!s.ic.oturum) throw new OdemeHata("Bu siparişte Stripe oturumu yok."); return stripeOturumSonuc(s, await stripeOturumGetir(p, ayar, s, s.ic.oturum), "sorgu"); }
  if (s.saglayici === "paypal") return paypalSonuc(p, ayar, s);
  const k = kimlik(p, "paytr", s.mod);
  const govde = new URLSearchParams({ merchant_id: k.PAYTR_MERCHANT_ID, merchant_oid: s.siparisNo, paytr_token: hmacB64(k.PAYTR_MERCHANT_KEY, k.PAYTR_MERCHANT_ID + s.siparisNo + k.PAYTR_MERCHANT_SALT) });
  let r: Response;
  try { r = await fetch(`${taban(ayar, "paytr", s.mod)}/odeme/durum-sorgu`, { method: "POST", signal: AbortSignal.timeout(ZAMAN), headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: govde.toString() }); }
  catch { throw new OdemeHata("PayTR'ye ulaşılamadı.", 502); }
  const j = await jsonOku(r);
  if (j?.status !== "success") return { durum: "bekliyor", olay: "PayTR'de başarılı ödeme yok", ayrinti: String(j?.err_msg ?? "") };
  const tutar = Number(j.payment_amount);
  if (Math.round(tutar * 100) !== Math.round(s.tutar * 100) && tutar !== Math.round(s.tutar * 100)) return { durum: "bekliyor", olay: "Tutar uyuşmuyor", ayrinti: `PayTR ${String(j.payment_amount)}` };
  return { durum: "odendi", olay: "PayTR durum sorgusu: ödendi", alanlar: { odemeKimligi: s.siparisNo, taksit: Number(j.taksit) || 1, kart: [j.kart_marka, j.masked_pan].filter(Boolean).join(", ") || null } };
}

/* ───────────── İade (tam tutar) ───────────── */
export async function iadeEt(p: Proje, ayar: OdemeAyar, s: Siparis, ip: string): Promise<Sonuc> {
  if (s.durum !== "odendi") throw new OdemeHata("Yalnız ödenmiş sipariş iade edilir.");
  const k = kimlik(p, s.saglayici, s.mod);
  const t = taban(ayar, s.saglayici, s.mod);
  if (s.saglayici === "iyzico") {
    // Sepet kalemi başına iade (/payment/refund, paymentTransactionId); çok ürünlü sepette iyzico'nun önerdiği yol.
    const l = s.ic.islemler ?? [];
    if (!l.length) throw new OdemeHata("Bu siparişte iyzico işlem kimlikleri yok.");
    let toplam = 0;
    for (const x of l) {
      const j = await iyzicoIstek(k, t, "/payment/refund", { locale: s.paraBirimi === "TRY" ? "tr" : "en", conversationId: s.siparisNo, paymentTransactionId: x.id, price: x.tutar, currency: s.paraBirimi || "TRY", ip });
      if (!iyzicoImzaDogru(j, ["paymentId", "price", "currency", "conversationId"], k.IYZICO_SECRET_KEY)) throw new OdemeHata("iyzico iade yanıtının imzası doğrulanamadı.", 502);
      toplam += Number(j.price) || 0;
    }
    return { durum: "iade", olay: "iyzico iadesi yapıldı", ayrinti: `${l.length} kalem`, alanlar: { iadeTutari: Math.round(toplam * 100) / 100, iadeZamani: new Date().toISOString() } };
  }
  if (s.saglayici === "paytr") {
    const tutar = tlYaz(Math.round(s.tutar * 100));
    const govde = new URLSearchParams({ merchant_id: k.PAYTR_MERCHANT_ID, merchant_oid: s.siparisNo, return_amount: tutar, paytr_token: hmacB64(k.PAYTR_MERCHANT_KEY, k.PAYTR_MERCHANT_ID + s.siparisNo + tutar + k.PAYTR_MERCHANT_SALT) });
    let r: Response;
    try { r = await fetch(`${t}/odeme/iade`, { method: "POST", signal: AbortSignal.timeout(ZAMAN), headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: govde.toString() }); }
    catch { throw new OdemeHata("PayTR'ye ulaşılamadı.", 502); }
    const j = await jsonOku(r);
    if (j?.status !== "success") throw new OdemeHata(`PayTR iade: ${String(j?.err_msg ?? j?.reason ?? `yanıt vermedi (${r.status})`)}`, 502);
    return { durum: "iade", olay: "PayTR iadesi yapıldı", alanlar: { iadeTutari: Number(tutar), iadeZamani: new Date().toISOString() } };
  }
  if (s.saglayici === "paypal") {
    if (!s.odemeKimligi) throw new OdemeHata("Bu siparişte PayPal tahsilat kimliği yok.");
    const j = await paypalIstek(k, t, "POST", `/v2/payments/captures/${encodeURIComponent(s.odemeKimligi)}/refund`, {}, `ref-${s.siparisNo}`);
    if (j.status !== "COMPLETED" && j.status !== "PENDING") throw new OdemeHata(`PayPal iade durumu: ${String(j.status)}`, 502);
    const tutar = Number((j.amount as { value?: string } | undefined)?.value);
    return { durum: "iade", olay: j.status === "PENDING" ? "PayPal iadesi işleniyor" : "PayPal iadesi yapıldı", ayrinti: String(j.id ?? ""), alanlar: { iadeTutari: Number.isFinite(tutar) && tutar > 0 ? tutar : s.tutar, iadeZamani: new Date().toISOString() } };
  }
  if (!s.odemeKimligi?.startsWith("pi_")) throw new OdemeHata("Bu siparişte Stripe payment_intent yok.");
  const j = await stripeIstek(k, t, "POST", "/v1/refunds", new URLSearchParams({ payment_intent: s.odemeKimligi, "metadata[siparisNo]": s.siparisNo }));
  if (j.status !== "succeeded" && j.status !== "pending") throw new OdemeHata(`Stripe iade durumu: ${String(j.status)}`, 502);
  return { durum: "iade", olay: j.status === "pending" ? "Stripe iadesi işleniyor" : "Stripe iadesi yapıldı", ayrinti: String(j.id ?? ""), alanlar: { iadeTutari: Number(j.amount) ? Number(j.amount) / 10 ** paraOndalik(s.paraBirimi || "TRY") : s.tutar, iadeZamani: new Date().toISOString() } };
}

/* ───────────── Raporlar ───────────── */
export async function siparisRaporu(id: string, ortam: VeriOrtami, gunSayisi: number, saatDilimi?: string) {
  const tz = saatDilimi || (await import("./isletme").then((m) => m.isletmeOku(id)).then((v) => v.profil.saatDilimi).catch(() => "UTC"));
  const gun = (t: number) => dilimTarih(t, tz);
  const l = (((await veriOku(id, ortam)).koleksiyonlar[SIPARIS_TABLOSU]?.kayitlar ?? []) as Siparis[]).slice().sort((a, b) => b.olusturma - a.olusturma);
  const bas = Date.now() - gunSayisi * 864e5;
  const donem = l.filter((s) => s.olusturma >= bas);
  const odenen = donem.filter((s) => s.durum === "odendi" || s.durum === "iade");
  const gelir = odenen.filter((s) => s.durum === "odendi").reduce((t, s) => t + Math.round(s.tutar * 100), 0);
  const iade = donem.filter((s) => s.durum === "iade").reduce((t, s) => t + Math.round((s.iadeTutari ?? s.tutar) * 100), 0);
  const gunler: { tarih: string; gelir: number; adet: number }[] = [];
  for (let i = gunSayisi - 1; i >= 0; i--) gunler.push({ tarih: gun(Date.now() - i * 864e5), gelir: 0, adet: 0 });
  const dizin = new Map(gunler.map((g, i) => [g.tarih, i]));
  for (const s of donem) {
    if (s.durum !== "odendi") continue;
    const i = dizin.get(gun(s.odemeZamani ? Date.parse(s.odemeZamani) : s.olusturma));
    if (i !== undefined) { gunler[i].gelir += Math.round(s.tutar * 100); gunler[i].adet++; }
  }
  const sayac = { bekliyor: 0, odendi: 0, basarisiz: 0, iade: 0 } as Record<SiparisDurum, number>;
  for (const s of l) sayac[s.durum] = (sayac[s.durum] ?? 0) + 1;
  const odenenAdet = donem.filter((s) => s.durum === "odendi").length;
  return {
    ozet: { gelir: gelir / 100, adet: odenenAdet, ortalama: odenenAdet ? gelir / odenenAdet / 100 : 0, iade: iade / 100, bekleyen: donem.filter((s) => s.durum === "bekliyor").length, basarisiz: donem.filter((s) => s.durum === "basarisiz").length },
    gunler: gunler.map((g) => ({ ...g, gelir: g.gelir / 100 })), sayac,
    siparisler: l.slice(0, 500).map((s) => { const { ic, ...d } = s; return { ...d, ic: { iframe: undefined, islemSayisi: ic?.islemler?.length ?? 0, urunOrtami: ic?.urunOrtami, kaynak: ic?.kaynak } }; }),
  };
}

/* ───────────── Canlıya geçiş listesi ───────────── */
export type KontrolMaddesi = { id: string; ad: string; alt: string; durum: "tamam" | "eksik" | "uyari"; zorunlu: boolean };
/** Her madde gerçek duruma bakar (anahtarlar, test ödemesi, doğrulanmış bildirim, ürünler, sayfalar, yasal metin, yayın). */
export async function kontrolListesi(p: Proje, ayar: OdemeAyar, koken: string): Promise<KontrolMaddesi[]> {
  const s = ayar.saglayici;
  const l: KontrolMaddesi[] = [];
  const ekle = (m: KontrolMaddesi) => l.push(m);
  ekle({ id: "saglayici", ad: "Ödeme sağlayıcısı seçildi", alt: s ? `${SAGLAYICI_AD[s]} seçili` : "Stripe, PayPal, iyzico ya da PayTR seç", durum: s ? "tamam" : "eksik", zorunlu: true });
  const satir = s ? anahtarDurumu(p, s) : [];
  const canliEksik = satir.filter((x) => x.canli !== "var" && !ISTEGE_BAGLI.has(x.ad));
  const acik = satir.filter((x) => x.canli === "acik" || x.test === "acik");
  const uyari = satir.find((x) => x.uyari)?.uyari;
  ekle({ id: "anahtar", ad: "Canlı anahtarlar girildi", alt: !s ? "Önce sağlayıcıyı seç" : acik.length ? `${acik.map((x) => x.ad).join(", ")} herkese açık; sunucu sırrı yap` : canliEksik.length ? `Eksik: ${canliEksik.map((x) => x.ad).join(", ")}` : uyari ?? "Anahtarlar sunucu sırrı olarak saklanıyor", durum: !s || canliEksik.length || acik.length ? "eksik" : uyari ? "uyari" : "tamam", zorunlu: true });
  const test = s ? (((await veriOku(p.id, "test")).koleksiyonlar[SIPARIS_TABLOSU]?.kayitlar ?? []) as Siparis[]).filter((x) => x.saglayici === s && (x.durum === "odendi" || x.durum === "iade")).length : 0;
  ekle({ id: "testOdeme", ad: "Test ödemesi başarıyla tamamlandı", alt: test ? `${test} test ödemesi alındı` : "Önizlemeden ya da test modundaki siteden bir ödeme dene", durum: test ? "tamam" : "eksik", zorunlu: true });
  if (s === "paytr" || s === "stripe" || s === "paypal") {
    const z = Math.max(ayar.sonBildirim?.[`${s}-test`] ?? 0, ayar.sonBildirim?.[`${s}-canli`] ?? 0);
    ekle({ id: "bildirim", ad: s === "paytr" ? "Bildirim URL doğrulandı" : "Webhook doğrulandı", alt: z ? "İmzası doğrulanmış bildirim geldi" : s === "paytr" ? "Bildirim URL'yi PayTR Mağaza Paneli'ne yapıştır ve test ödemesi yap" : s === "paypal" ? "Webhook adresini PayPal uygulamana ekle, Webhook ID'yi gir ve test ödemesi yap" : "Webhook adresini Stripe'a ekle, imza sırrını gir ve test ödemesi yap", durum: z ? "tamam" : s === "paypal" ? "uyari" : "eksik", zorunlu: s !== "paypal" });
  }
  const canliUrun = (await veriOku(p.id, "canli")).koleksiyonlar[ayar.urunTablosu || "urunler"];
  const satista = (canliUrun?.kayitlar ?? []).filter((r) => r.aktif !== false && r.stokta !== false && Number(String(r.fiyat ?? "").replace(",", ".")) > 0).length;
  ekle({ id: "urun", ad: "Satışta ürün var", alt: !canliUrun ? `Canlı veritabanında "${ayar.urunTablosu || "urunler"}" tablosu yok` : satista ? `${satista} ürün fiyatıyla satışta` : "Fiyatı olan etkin ürün yok", durum: satista ? "tamam" : "eksik", zorunlu: true });
  const dosyalar = p.yayin ? p.surumler.find((x) => x.id === p.yayin!.surumId)?.dosyalar ?? p.dosyalar : p.dosyalar;
  const sayfaVar = (y: string) => !!y && (y.split(/[?#]/)[0] in dosyalar || `${y.split(/[?#]/)[0]}.html` in dosyalar);
  ekle({ id: "sayfa", ad: "Başarı ve hata sayfaları hazır", alt: !ayar.basariSayfasi || !ayar.hataSayfasi ? "Ödeme sonrası dönülecek sayfaları seç" : sayfaVar(ayar.basariSayfasi) && sayfaVar(ayar.hataSayfasi) ? `${ayar.basariSayfasi}, ${ayar.hataSayfasi}` : "Seçilen sayfalardan biri projede yok", durum: sayfaVar(ayar.basariSayfasi) && sayfaVar(ayar.hataSayfasi) ? "tamam" : "eksik", zorunlu: false });
  const metin = Object.entries(dosyalar).filter(([y]) => y.endsWith(".html")).map(([, d]) => d).join("\n");
  const yasal = /(mesafeli\s+sat|satış koşulları|terms of (sale|service)|conditions)/i.test(metin) && /(iade|cayma|refund|return)/i.test(metin);
  ekle({ id: "yasal", ad: "Satış koşulları ve iade politikası", alt: yasal ? "Sitede yer alıyor" : "Stripe, PayPal, iyzico ve PayTR hesap onayında bu sayfaları ister; İşletme sekmesindeki Yasal metinler bölümünden üretebilirsin", durum: yasal ? "tamam" : "uyari", zorunlu: false });
  ekle({ id: "yayin", ad: "Site yayında", alt: p.yayin ? `Sürüm ${p.yayin.surumNo} yayında` : "Ödemeler yayındaki sitede çalışır", durum: p.yayin ? "tamam" : "eksik", zorunlu: true });
  ekle({ id: "https", ad: "Güvenli bağlantı (HTTPS)", alt: koken.startsWith("https://") ? "Geri dönüş adresleri HTTPS" : "Sağlayıcılar canlıda geri dönüş için HTTPS ister; bu sunucu HTTP", durum: koken.startsWith("https://") ? "tamam" : "uyari", zorunlu: false });
  return l;
}
