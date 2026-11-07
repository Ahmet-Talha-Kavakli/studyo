/**
 * Vayra İşletme: siteyi işleten esnafın paneli (Hostinger Store Manager, Wix Dashboard ve Squarespace "site yönetimi"
 * karşılığı). İstemci ve sunucu ortak tipleri, varsayılanlar ve temizleyiciler. Kayıtlar sunucuda
 * .veri/build/isletme/<proje>.json (ayarlar) ve .veri/build/isletme-kayit/<proje>/<tür>.json (randevu, yazı, yorum …)
 * dosyalarında; ürünler ve siparişler Vayra Veri'nin "urunler" ve "siparisler" tablolarında durur.
 */

import {
  AB_ULKELERI, ALT_BOLGELER, PARA_BIRIMLERI, ULKELER, dilimGecerli, paraGecerli, paraYaz, ulkeBul, ulkeKoduBul,
  type Gizlilik, type VergiModeli,
} from "./bolge";

/* ───────── küçük temizleyiciler ───────── */
type N = Record<string, unknown>;
export const nesne = (x: unknown): N => (x && typeof x === "object" && !Array.isArray(x) ? (x as N) : {});
export const dizi = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);
/** Metin: < ve > atılır, boşluklar kırpılır, uzunluk sınırlanır. cok: satır sonları korunur. */
export const metin = (x: unknown, n = 200, cok = false): string => {
  const s = typeof x === "string" ? x : typeof x === "number" ? String(x) : "";
  const t = s.replace(/[<>]/g, "").replace(/\r\n/g, "\n");
  return (cok ? t.replace(/[ \t]+\n/g, "\n").trim() : t.replace(/\s+/g, " ").trim()).slice(0, n);
};
export const sayi = (x: unknown, alt = 0, ust = 1e9, vars = 0): number => {
  const n = typeof x === "number" ? x : Number(String(x ?? "").replace(",", "."));
  return Number.isFinite(n) ? Math.min(ust, Math.max(alt, n)) : vars;
};
export const sayiYaDaBos = (x: unknown, alt = 0, ust = 1e9): number | null => (x === null || x === undefined || x === "" ? null : Number.isFinite(Number(String(x).replace(",", "."))) ? sayi(x, alt, ust) : null);
export const mantik = (x: unknown, vars = false) => (typeof x === "boolean" ? x : vars);
export function secim<T extends string>(x: unknown, l: readonly T[], vars: T): T { return l.includes(x as T) ? (x as T) : vars; }
export const kimlikUret = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const kimlik = (x: unknown) => { const s = String(x ?? ""); return /^[A-Za-z0-9_-]{4,40}$/.test(s) ? s : kimlikUret(); };
export const SAAT = /^([01]\d|2[0-3]):[0-5]\d$/;
export const saatMetin = (x: unknown, vars: string) => (typeof x === "string" && SAAT.test(x) ? x : vars);
export const adres = (x: unknown, n = 500): string => { const s = metin(x, n); return /^(https?:\/\/|\/)/.test(s) ? s : ""; };
export const eposta = (x: unknown): string => { const s = metin(x, 120).toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : ""; };
export const telefon = (x: unknown): string => metin(x, 30).replace(/[^\d+ ()-]/g, "");
export function slug(s: string): string {
  const tr: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };
  return s.toLocaleLowerCase("tr-TR").replace(/[çğıöşüâîû]/g, (h) => tr[h] ?? h).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "yazi";
}
/** Eski TL yazımı (yalnız Türk lirası kayıtları için); yeni kod para() kullanır. */
export const tl = (n: number) => `${n.toLocaleString("tr-TR", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })} TL`;
/** İşletmenin para birimi ve yerel biçimiyle tutar ("$1,250", "1.250 €", "1.250 TL"). */
export const para = (n: number, kod = "USD", yerel = "tr-TR") => (kod === "TRY" && yerel.startsWith("tr") ? tl(n) : paraYaz(n, kod, yerel));
/** İşletme kaydından para birimi ve yerel ayarla biçimleyici. */
export const isletmePara = (v: Pick<IsletmeVeri, "magaza" | "profil">) => (n: number) => para(n, v.magaza.paraBirimi, v.profil.yerel || "tr-TR");

/* ───────── çalışma saatleri ───────── */
export const GUNLER = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"] as const;
/** schema.org gün adları (Pazartesi ilk). */
export const GUN_SCHEMA = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export type GunSaat = { acik: boolean; bas: string; bit: string; molaBas?: string; molaBit?: string };
export type HaftaSaat = GunSaat[];
export const VARSAYILAN_HAFTA: HaftaSaat = GUNLER.map((_, i) => ({ acik: i < 6, bas: "09:00", bit: i === 5 ? "14:00" : "18:00" }));
export function haftaTemizle(x: unknown, vars: HaftaSaat = VARSAYILAN_HAFTA): HaftaSaat {
  const l = dizi(x);
  return GUNLER.map((_, i) => {
    const g = nesne(l[i]), v = vars[i];
    const o: GunSaat = { acik: mantik(g.acik, v.acik), bas: saatMetin(g.bas, v.bas), bit: saatMetin(g.bit, v.bit) };
    if (typeof g.molaBas === "string" && SAAT.test(g.molaBas) && typeof g.molaBit === "string" && SAAT.test(g.molaBit) && g.molaBas < g.molaBit) { o.molaBas = g.molaBas; o.molaBit = g.molaBit; }
    if (o.bas >= o.bit) o.bit = v.bit > o.bas ? v.bit : "23:59";
    return o;
  });
}

/* ───────── işletme profili ───────── */
/** schema.org LocalBusiness alt türleri (Türkçe adıyla). */
export const ISLETME_TURLERI: { id: string; ad: string }[] = [
  { id: "LocalBusiness", ad: "Yerel işletme" }, { id: "Store", ad: "Mağaza" }, { id: "CafeOrCoffeeShop", ad: "Kafe" }, { id: "Restaurant", ad: "Restoran" },
  { id: "Bakery", ad: "Fırın ve pastane" }, { id: "BeautySalon", ad: "Güzellik salonu" }, { id: "HairSalon", ad: "Kuaför" }, { id: "Dentist", ad: "Diş kliniği" },
  { id: "MedicalClinic", ad: "Klinik" }, { id: "ExerciseGym", ad: "Spor salonu" }, { id: "LegalService", ad: "Hukuk bürosu" }, { id: "AccountingService", ad: "Mali müşavir" },
  { id: "RealEstateAgent", ad: "Emlak ofisi" }, { id: "Florist", ad: "Çiçekçi" }, { id: "HomeAndConstructionBusiness", ad: "Usta ve tadilat" }, { id: "AutoRepair", ad: "Oto servis" },
  { id: "LodgingBusiness", ad: "Otel ve pansiyon" }, { id: "EducationalOrganization", ad: "Kurs ve eğitim" }, { id: "ProfessionalService", ad: "Profesyonel hizmet" }, { id: "OnlineStore", ad: "Yalnız çevrim içi mağaza" },
];
export type Profil = {
  ad: string; tur: string; slogan: string; aciklama: string; logo: string; gorsel: string;
  telefon: string; eposta: string; whatsapp: string;
  /** il: şehir (TR'de il); ilce: TR'de ilçe, diğer ülkelerde semt ya da ikinci satır; bolge: eyalet, il (prefecture) ya da county. */
  adres: { sokak: string; ilce: string; il: string; postaKodu: string; ulke: string; bolge: string };
  /** ISO 3166-1 alfa-2 ülke kodu (vergi, para, adres biçimi ve yasal rejim varsayılanları buradan gelir). */
  ulkeKodu: string;
  /** IANA saat dilimi (randevu, kupon tarihi, raporlar ve e-postalardaki saatler). */
  saatDilimi: string;
  /** Sitede sayı ve tarih biçimi (BCP 47, örneğin en-US, de-DE, tr-TR). Metin dili ayrıdır. */
  yerel: string;
  konum: { enlem: number | null; boylam: number | null };
  /** Adresi gizle (yalnız hizmet bölgesi olan işletmeler, ev atölyeleri). */
  adresGizli: boolean;
  hizmetBolgesi: string;
  saatler: HaftaSaat;
  /** Tatil ve özel kapalı günler (YYYY-MM-DD). */
  ozelGunler: { tarih: string; ad: string; acik: boolean; bas?: string; bit?: string }[];
  sosyal: { instagram: string; facebook: string; x: string; tiktok: string; youtube: string; linkedin: string };
  googleProfil: string;
  /** Fiyat düzeyi 1-4 (schema.org priceRange işletmenin para simgesiyle yazılır). Eski kayıtlar ₺ biçimindedir. */
  fiyatAraligi: "" | "1" | "2" | "3" | "4";
  /** Fatura ve yasal metinlerde kullanılan resmî bilgiler. */
  /** vergiNo: TR'de VKN ya da TCKN; diğer ülkelerde VAT numarası, EIN, ABN, GSTIN gibi vergi kimliği. sicilNo: şirket sicil numarası. */
  resmi: { unvan: string; vergiDairesi: string; vergiNo: string; mersis: string; kep: string; tur: "sahis" | "sirket"; sicilNo: string };
  guncelleme: number;
};
export const BOS_PROFIL: Profil = {
  ad: "", tur: "LocalBusiness", slogan: "", aciklama: "", logo: "", gorsel: "", telefon: "", eposta: "", whatsapp: "",
  adres: { sokak: "", ilce: "", il: "", postaKodu: "", ulke: "", bolge: "" }, ulkeKodu: "", saatDilimi: "", yerel: "", konum: { enlem: null, boylam: null }, adresGizli: false, hizmetBolgesi: "",
  saatler: VARSAYILAN_HAFTA, ozelGunler: [], sosyal: { instagram: "", facebook: "", x: "", tiktok: "", youtube: "", linkedin: "" }, googleProfil: "", fiyatAraligi: "",
  resmi: { unvan: "", vergiDairesi: "", vergiNo: "", mersis: "", kep: "", tur: "sahis", sicilNo: "" }, guncelleme: 0,
};
export function profilTemizle(x: unknown): Profil {
  const g = nesne(x), a = nesne(g.adres), k = nesne(g.konum), s = nesne(g.sosyal), r = nesne(g.resmi);
  const enlem = sayiYaDaBos(k.enlem, -90, 90), boylam = sayiYaDaBos(k.boylam, -180, 180);
  const ulkeKodu = ulkeKoduBul(g.ulkeKodu) || ulkeKoduBul(a.ulke);
  const u = ulkeBul(ulkeKodu);
  const fiyat = String(g.fiyatAraligi ?? ""), fiyatDuzey = /^[1-4]$/.test(fiyat) ? fiyat : /^₺{1,4}$|^\${1,4}$|^€{1,4}$/.test(fiyat) ? String(fiyat.length) : "";
  return {
    ad: metin(g.ad, 120), tur: ISLETME_TURLERI.some((t) => t.id === g.tur) ? String(g.tur) : "LocalBusiness", slogan: metin(g.slogan, 160), aciklama: metin(g.aciklama, 1200, true),
    logo: adres(g.logo), gorsel: adres(g.gorsel), telefon: telefon(g.telefon), eposta: eposta(g.eposta), whatsapp: telefon(g.whatsapp),
    adres: { sokak: metin(a.sokak, 200), ilce: metin(a.ilce, 60), il: metin(a.il, 60), postaKodu: metin(a.postaKodu, 12), ulke: u?.ad ?? metin(a.ulke, 60), bolge: metin(a.bolge, 60) },
    ulkeKodu, saatDilimi: dilimGecerli(g.saatDilimi) ? String(g.saatDilimi) : u?.dilim ?? "UTC", yerel: yerelGecerli(g.yerel) ? String(g.yerel) : u?.yerel ?? "en-US",
    konum: { enlem, boylam }, adresGizli: mantik(g.adresGizli), hizmetBolgesi: metin(g.hizmetBolgesi, 200),
    saatler: haftaTemizle(g.saatler),
    ozelGunler: dizi(g.ozelGunler).slice(0, 60).map((o0) => { const o = nesne(o0); const t = metin(o.tarih, 10); return /^\d{4}-\d{2}-\d{2}$/.test(t) ? { tarih: t, ad: metin(o.ad, 60), acik: mantik(o.acik), ...(mantik(o.acik) ? { bas: saatMetin(o.bas, "10:00"), bit: saatMetin(o.bit, "16:00") } : {}) } : null; }).filter((o): o is NonNullable<typeof o> => !!o).sort((a2, b) => a2.tarih.localeCompare(b.tarih)),
    sosyal: { instagram: adres(s.instagram), facebook: adres(s.facebook), x: adres(s.x), tiktok: adres(s.tiktok), youtube: adres(s.youtube), linkedin: adres(s.linkedin) },
    googleProfil: adres(g.googleProfil), fiyatAraligi: fiyatDuzey as Profil["fiyatAraligi"],
    resmi: {
      unvan: metin(r.unvan, 160), vergiDairesi: metin(r.vergiDairesi, 80), vergiNo: ulkeKodu === "TR" || !ulkeKodu ? metin(r.vergiNo, 11).replace(/\D/g, "") : metin(r.vergiNo, 24).toUpperCase().replace(/[^A-Z0-9-]/g, ""),
      mersis: metin(r.mersis, 16).replace(/\D/g, ""), kep: metin(r.kep, 120), tur: secim(r.tur, ["sahis", "sirket"] as const, "sahis"), sicilNo: metin(r.sicilNo, 40),
    },
    guncelleme: Date.now(),
  };
}
export const yerelGecerli = (x: unknown): x is string => { if (typeof x !== "string" || !/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(x)) return false; try { return Intl.NumberFormat.supportedLocalesOf([x]).length > 0; } catch { return false; } };
/** Eski kayıt (ülke kodu ve saat dilimi olmadan kaydedilmiş): Türkiye'de açılmış sayılır, ayarları korunur. */
export const eskiTrKaydi = (p: Partial<Profil> | undefined) => !!p && !("ulkeKodu" in p) && (p.guncelleme ?? 0) > 0;
/** Profil tamamlanma maddeleri (Google İşletme Profili ile tutarlılık için gerekenler). */
export function profilEksikleri(p: Profil): string[] {
  const l: string[] = [];
  if (!p.ad) l.push("İşletme adı");
  if (!p.telefon) l.push("Telefon");
  if (!p.ulkeKodu) l.push("Ülke");
  if (!p.adresGizli && (!p.adres.sokak || !p.adres.il)) l.push("Açık adres");
  if (p.adresGizli && !p.hizmetBolgesi) l.push("Hizmet bölgesi");
  if (!p.aciklama) l.push("Kısa tanıtım");
  if (!p.saatler.some((g) => g.acik)) l.push("Çalışma saatleri");
  if (!p.logo) l.push("Logo");
  return l;
}

/* ───────── mağaza ───────── */
export const KDV_ORANLARI = [0, 1, 10, 20] as const;
/** Kargo firmaları: önce uluslararası ve ülke posta şirketleri, sonra Türkiye firmaları. takip: {no} takip numarasıyla değişir. */
export const KARGO_FIRMALARI_AYRINTI: { ad: string; ulkeler: string[]; takip: string }[] = [
  { ad: "UPS", ulkeler: [], takip: "https://www.ups.com/track?tracknum={no}" },
  { ad: "FedEx", ulkeler: [], takip: "https://www.fedex.com/fedextrack/?trknbr={no}" },
  { ad: "DHL Express", ulkeler: [], takip: "https://www.dhl.com/global-en/home/tracking/tracking-express.html?tracking-id={no}" },
  { ad: "USPS", ulkeler: ["US"], takip: "https://tools.usps.com/go/TrackConfirmAction?tLabels={no}" },
  { ad: "Canada Post", ulkeler: ["CA"], takip: "https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor={no}" },
  { ad: "Royal Mail", ulkeler: ["GB"], takip: "https://www.royalmail.com/track-your-item#/tracking-results/{no}" },
  { ad: "Evri", ulkeler: ["GB"], takip: "https://www.evri.com/track/parcel/{no}" },
  { ad: "DPD", ulkeler: [], takip: "https://tracking.dpd.de/status/en_US/parcel/{no}" },
  { ad: "GLS", ulkeler: [], takip: "https://gls-group.com/track/{no}" },
  { ad: "DHL Paket", ulkeler: ["DE"], takip: "https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode={no}" },
  { ad: "Hermes", ulkeler: ["DE"], takip: "https://www.myhermes.de/empfangen/sendungsverfolgung/sendungsinformation#{no}" },
  { ad: "PostNL", ulkeler: ["NL", "BE"], takip: "https://jouw.postnl.nl/track-and-trace/{no}" },
  { ad: "Colissimo", ulkeler: ["FR"], takip: "https://www.laposte.fr/outils/suivre-vos-envois?code={no}" },
  { ad: "Correos", ulkeler: ["ES"], takip: "https://www.correos.es/es/es/herramientas/localizador/envios/detalle?tracking-number={no}" },
  { ad: "Poste Italiane", ulkeler: ["IT"], takip: "https://www.poste.it/cerca/index.html#/risultati-spedizioni/{no}" },
  { ad: "Australia Post", ulkeler: ["AU"], takip: "https://auspost.com.au/mypost/track/details/{no}" },
  { ad: "Japan Post", ulkeler: ["JP"], takip: "https://trackings.post.japanpost.jp/services/srv/search/?requestNo1={no}&locale=en" },
  { ad: "Aramex", ulkeler: ["AE", "SA"], takip: "https://www.aramex.com/us/en/track/results?ShipmentNumber={no}" },
  { ad: "Yurtiçi Kargo", ulkeler: ["TR"], takip: "" }, { ad: "Aras Kargo", ulkeler: ["TR"], takip: "" }, { ad: "MNG Kargo", ulkeler: ["TR"], takip: "" },
  { ad: "PTT Kargo", ulkeler: ["TR"], takip: "" }, { ad: "Sürat Kargo", ulkeler: ["TR"], takip: "" }, { ad: "Hepsijet", ulkeler: ["TR"], takip: "" }, { ad: "Kolay Gelsin", ulkeler: ["TR"], takip: "" },
  { ad: "Elden teslim", ulkeler: [], takip: "" },
];
export const KARGO_FIRMALARI = KARGO_FIRMALARI_AYRINTI.map((f) => f.ad);
/** Mağazanın ülkesine uygun firmalar önce (uluslararası olanlar her zaman listede). */
export const ulkeFirmalari = (ulke: string) => KARGO_FIRMALARI_AYRINTI.filter((f) => !f.ulkeler.length || f.ulkeler.includes(ulke)).map((f) => f.ad);
/**
 * Kargo yöntemi (Shopify "shipping rate" karşılığı). ulkeler: boşsa her ülke; "*" de her ülke demektir. bolgeler: ABD eyaleti
 * ya da Kanada eyaleti gibi alt bölgeler (boşsa ülkenin tamamı). ucretTuru "agirlik": ucret taban, her kg için kgBasi eklenir.
 */
export type KargoYontem = {
  id: string; ad: string; firma: string; ucret: number; ucretsizEsik: number | null; sure: string; aktif: boolean; takipAdresi: string;
  ulkeler: string[]; bolgeler: string[]; ucretTuru: "sabit" | "agirlik"; kgBasi: number;
};
export type Kupon = {
  id: string; kod: string; tur: "yuzde" | "tutar" | "kargo"; deger: number; minSepet: number | null; baslangic: string; bitis: string;
  sinir: number | null; kisiBasi: number | null; kategoriler: string[]; aktif: boolean; aciklama: string; olusturma: number;
};
/** Bölgeye göre vergi kuralı: ulke + (isteğe bağlı) bolge; oran yüzde. */
export type VergiKurali = { id: string; ulke: string; bolge: string; oran: number; ad: string };
export type VergiAyar = {
  model: VergiModeli;
  /** Fiyatlar vergi dahil mi girildi (AB, TR, AU) yoksa vergi ödemede mi eklenir (ABD, Kanada). */
  dahil: boolean;
  /** Mağazanın kendi ülkesindeki standart oran (ürüne oran yazılmamışsa). */
  varsayilanOran: number;
  /** Kargo ücreti de vergilendirilsin (AB ve TR'de evet; ABD'de eyalete göre değişir). */
  kargoVergili: boolean;
  /** Teslimat ülkesi ve bölgesine göre oranlar (en özel kural kazanır). */
  kurallar: VergiKurali[];
  /** Kuralı olmayan yabancı ülkeye satış vergisiz (ihracat). Kapalıysa varsayılan oran uygulanır. */
  ihracatVergisiz: boolean;
  /** Kurumsal alıcıdan vergi kimliği (VAT ID) sorulsun; AB içi B2B satışta ters ibraz notu eklenir. */
  vergiKimligiIste: boolean;
};
/** Vitrinde gösterilen ek para birimi: kur elle ya da ECB referans kurundan, istenirse yuvarlama. */
export type EkParaBirimi = { kod: string; kur: number | null; otomatik: boolean; yuvarlama: "yok" | "tam" | "99" };
export type MagazaAyar = {
  /** Mağazanın ana para birimi (ürün fiyatları bu birimdedir). ISO 4217. */
  paraBirimi: string;
  /** Alıcının seçebileceği diğer para birimleri; ödeme seçilen birimle alınır (sağlayıcı destekliyorsa). */
  ekParaBirimleri: EkParaBirimi[];
  /** Son çekilen otomatik kurlar: taban birim başına karşılık. */
  kurlar: { z: number; taban: string; oranlar: Record<string, number>; kaynak: string } | null;
  vergi: VergiAyar;
  /** Eski alan: vergi.varsayilanOran ile aynı tutulur. */
  varsayilanKdv: number;
  kargo: KargoYontem[];
  /** Mağazanın satış yaptığı ülkeler (boşsa her ülke). Listede olmayan ülkeye ödeme açılmaz. */
  satisUlkeleri: string[];
  /** Ödemede kurumsal fatura bilgisi (unvan, vergi dairesi ya da VAT numarası) sorulsun. */
  faturaIste: boolean;
  dusukStok: number;
  /** Terk edilen sepet hatırlatması: ödeme başlatılıp tamamlanmayan siparişlere e-posta. */
  terk: { acik: boolean; saat: number; kuponKod: string };
  /** Sipariş aşaması değişince müşteriye e-posta (kargoya verildi, teslim edildi). */
  musteriEposta: boolean;
  /** Teslimden N gün sonra yorum isteği e-postası (0: kapalı). */
  yorumIstegiGun: number;
  /** Yeni siparişte sahibe bildirim adresi. */
  bildirimEposta: string;
  guncelleme: number;
};
/** Ülkenin vergi düzeni ve kargo varsayılanları (yeni mağaza ya da ülke değişince öneri olarak kullanılır). */
export function ulkeVergiVarsayilani(ulke: string): VergiAyar {
  const u = ulkeBul(ulke);
  const model = u?.vergi.model ?? "yok";
  const kurallar: VergiKurali[] = ulke === "US" ? [] : ulke === "CA" ? (ALT_BOLGELER.CA ?? []).map((b) => ({ id: `CA-${b.kod}`, ulke: "CA", bolge: b.kod, oran: b.oran ?? 5, ad: b.not ?? "GST" })) : [];
  return { model, dahil: model !== "sales" && ulke !== "CA", varsayilanOran: u?.vergi.oran ?? 0, kargoVergili: model !== "sales", kurallar, ihracatVergisiz: true, vergiKimligiIste: u?.grup === "ab" };
}
export function ulkeKargoVarsayilani(ulke: string): KargoYontem[] {
  const firma = ulke === "TR" ? "Yurtiçi Kargo" : ulke === "US" ? "USPS" : ulke === "GB" ? "Royal Mail" : ulke === "CA" ? "Canada Post" : ulke === "AU" ? "Australia Post" : ulke === "DE" ? "DHL Paket" : "DHL Express";
  return [
    { id: "standart", ad: "Standart kargo", firma, ucret: 0, ucretsizEsik: null, sure: "2-5 iş günü", aktif: true, takipAdresi: KARGO_FIRMALARI_AYRINTI.find((f) => f.ad === firma)?.takip ?? "", ulkeler: ulke ? [ulke] : [], bolgeler: [], ucretTuru: "sabit", kgBasi: 0 },
    ...(ulke ? [{ id: "uluslararasi", ad: "Uluslararası kargo", firma: "DHL Express", ucret: 0, ucretsizEsik: null, sure: "5-10 iş günü", aktif: false, takipAdresi: KARGO_FIRMALARI_AYRINTI[2].takip, ulkeler: [], bolgeler: [], ucretTuru: "sabit" as const, kgBasi: 0 }] : []),
  ];
}
export const VARSAYILAN_MAGAZA: MagazaAyar = {
  paraBirimi: "USD", ekParaBirimleri: [], kurlar: null, vergi: ulkeVergiVarsayilani(""), varsayilanKdv: 0, kargo: ulkeKargoVarsayilani(""), satisUlkeleri: [],
  faturaIste: false, dusukStok: 3, terk: { acik: false, saat: 3, kuponKod: "" }, musteriEposta: true, yorumIstegiGun: 0, bildirimEposta: "", guncelleme: 0,
};
/** Türkiye'de açılmış eski mağaza kaydı: TL ve KDV dahil düzen. */
export const TR_MAGAZA_EK = { paraBirimi: "TRY", vergi: ulkeVergiVarsayilani("TR") } as const;
const ulkeKodlari = (x: unknown, n = 120) => [...new Set(dizi(x).map((k) => String(k ?? "").toUpperCase()).filter((k) => k === "*" || ULKELER.some((u) => u.kod === k)))].slice(0, n);
export function kargoTemizle(x: unknown): KargoYontem {
  const o = nesne(x);
  const ulkeler = ulkeKodlari(o.ulkeler);
  return {
    id: kimlik(o.id), ad: metin(o.ad, 60) || "Kargo", firma: metin(o.firma, 40), ucret: sayi(o.ucret, 0, 100000), ucretsizEsik: sayiYaDaBos(o.ucretsizEsik, 0, 1e7), sure: metin(o.sure, 40), aktif: mantik(o.aktif, true),
    takipAdresi: /\{no\}/.test(String(o.takipAdresi ?? "")) ? adres(o.takipAdresi) : "",
    ulkeler: ulkeler.includes("*") ? [] : ulkeler, bolgeler: [...new Set(dizi(o.bolgeler).map((b) => metin(b, 8).toUpperCase()).filter(Boolean))].slice(0, 80),
    ucretTuru: secim(o.ucretTuru, ["sabit", "agirlik"] as const, "sabit"), kgBasi: sayi(o.kgBasi, 0, 10000),
  };
}
export function vergiTemizle(x: unknown, ulke = ""): VergiAyar {
  const g = nesne(x), v = ulkeVergiVarsayilani(ulke);
  if (!Object.keys(g).length) return v;
  const model = secim(g.model, ["kdv", "vat", "gst", "sales", "yok"] as const, v.model);
  const oran = (o: unknown, vars: number) => Math.round(sayi(o, 0, 50, vars) * 1000) / 1000;
  return {
    model, dahil: mantik(g.dahil, v.dahil), varsayilanOran: oran(g.varsayilanOran, v.varsayilanOran), kargoVergili: mantik(g.kargoVergili, v.kargoVergili),
    kurallar: dizi(g.kurallar).slice(0, 200).map((k0) => { const k = nesne(k0); const u = String(k.ulke ?? "").toUpperCase(); return ULKELER.some((x2) => x2.kod === u) ? { id: kimlik(k.id), ulke: u, bolge: metin(k.bolge, 8).toUpperCase(), oran: oran(k.oran, 0), ad: metin(k.ad, 40) } : null; }).filter((k): k is VergiKurali => !!k),
    ihracatVergisiz: mantik(g.ihracatVergisiz, true), vergiKimligiIste: mantik(g.vergiKimligiIste, v.vergiKimligiIste),
  };
}
export function magazaTemizle(x: unknown, ulke = ""): MagazaAyar {
  const g = nesne(x), t = nesne(g.terk);
  const kargo = dizi(g.kargo).slice(0, 30).map(kargoTemizle);
  const paraBirimi = paraGecerli(g.paraBirimi) ? g.paraBirimi : ulkeBul(ulke)?.para ?? "USD";
  const vergi = vergiTemizle(g.vergi ?? (typeof g.varsayilanKdv === "number" ? { ...ulkeVergiVarsayilani("TR"), varsayilanOran: g.varsayilanKdv } : undefined), ulke);
  const kurlar = nesne(g.kurlar);
  return {
    paraBirimi,
    ekParaBirimleri: dizi(g.ekParaBirimleri).map((e0) => { const e = nesne(e0); return paraGecerli(e.kod) && e.kod !== paraBirimi ? { kod: e.kod, kur: sayiYaDaBos(e.kur, 0.000001, 1e7), otomatik: mantik(e.otomatik, true), yuvarlama: secim(e.yuvarlama, ["yok", "tam", "99"] as const, "yok") } : null; })
      .filter((e): e is EkParaBirimi => !!e).filter((e, i, l) => l.findIndex((y) => y.kod === e.kod) === i).slice(0, PARA_BIRIMLERI.length),
    kurlar: typeof kurlar.z === "number" && typeof kurlar.taban === "string" ? { z: kurlar.z, taban: kurlar.taban, oranlar: Object.fromEntries(Object.entries(nesne(kurlar.oranlar)).filter(([k, v2]) => paraGecerli(k) && typeof v2 === "number" && v2 > 0)) as Record<string, number>, kaynak: metin(kurlar.kaynak, 80) } : null,
    vergi, varsayilanKdv: vergi.varsayilanOran,
    kargo, satisUlkeleri: ulkeKodlari(g.satisUlkeleri, 200).filter((k) => k !== "*"), faturaIste: mantik(g.faturaIste, ulke === "TR"), dusukStok: sayi(g.dusukStok, 0, 1000, 3),
    terk: { acik: mantik(t.acik), saat: [1, 3, 6, 24].includes(Number(t.saat)) ? Number(t.saat) : 3, kuponKod: metin(t.kuponKod, 30).toUpperCase() },
    musteriEposta: mantik(g.musteriEposta, true), yorumIstegiGun: [0, 3, 7, 14].includes(Number(g.yorumIstegiGun)) ? Number(g.yorumIstegiGun) : 0,
    bildirimEposta: eposta(g.bildirimEposta), guncelleme: Date.now(),
  };
}
/** Teslimat adresine uygun vergi oranı: ülke ve bölge kuralı, ülke kuralı, mağaza ülkesi, ihracat. */
export function vergiOrani(v: VergiAyar, magazaUlke: string, hedefUlke: string, hedefBolge: string, urunOrani: number | null): { oran: number; ad: string } {
  if (v.model === "yok") return { oran: 0, ad: "" };
  const hedef = hedefUlke || magazaUlke;
  const bolge = (hedefBolge || "").toUpperCase();
  const kural = v.kurallar.find((k) => k.ulke === hedef && k.bolge && k.bolge === bolge) ?? v.kurallar.find((k) => k.ulke === hedef && !k.bolge);
  if (urunOrani === 0) return { oran: 0, ad: kural?.ad ?? "" };
  if (kural) return { oran: kural.oran, ad: kural.ad };
  if (!hedef || hedef === magazaUlke || !magazaUlke) return { oran: urunOrani ?? v.varsayilanOran, ad: "" };
  // AB içi tüketici satışı: OSS eşiği (yıllık 10.000 avro) altında satıcının ülkesindeki oran; eşiği aşan satıcı ülke kurallarını (AB ülkeleri hazırı) ekler.
  if (AB_ULKELERI.includes(hedef) && AB_ULKELERI.includes(magazaUlke)) return { oran: urunOrani ?? v.varsayilanOran, ad: "" };
  return v.ihracatVergisiz ? { oran: 0, ad: "" } : { oran: urunOrani ?? v.varsayilanOran, ad: "" };
}
/** Kargo yöntemi bu teslimat adresine gönderir mi. */
export const kargoUygun = (y: Pick<KargoYontem, "ulkeler" | "bolgeler">, ulke: string, bolge: string) =>
  (!y.ulkeler?.length || !ulke || y.ulkeler.includes(ulke)) && (!y.bolgeler?.length || !bolge || y.bolgeler.includes(bolge.toUpperCase()));
/** Kargo ücreti: sabit ya da taban + her başlayan kg için ek ücret. agirlikGram: sepetteki toplam ağırlık. */
export const kargoUcretHesapla = (y: Pick<KargoYontem, "ucret" | "ucretTuru" | "kgBasi">, agirlikGram: number) =>
  y.ucretTuru === "agirlik" ? y.ucret + Math.max(0, Math.ceil(Math.max(0, agirlikGram) / 1000)) * (y.kgBasi || 0) : y.ucret;
/** Ek para birimi kuru (taban birim başına): elle girilen kur ya da otomatik kur tablosu. */
export function kurBul(m: Pick<MagazaAyar, "paraBirimi" | "ekParaBirimleri" | "kurlar">, kod: string): number | null {
  if (kod === m.paraBirimi) return 1;
  const e = m.ekParaBirimleri.find((x) => x.kod === kod);
  if (!e) return null;
  if (!e.otomatik && e.kur) return e.kur;
  return m.kurlar && m.kurlar.taban === m.paraBirimi ? m.kurlar.oranlar[kod] ?? e.kur ?? null : e.kur ?? null;
}
/** Taban fiyatı ek para birimine çevirir ve yuvarlar ("tam": 12,40 → 13; "99": 12,40 → 12,99). */
export function kurlaCevir(n: number, kur: number, yuvarlama: EkParaBirimi["yuvarlama"], ondalik: number): number {
  const c = 10 ** ondalik, x = n * kur;
  if (yuvarlama === "tam") return Math.ceil(x - 1e-9);
  if (yuvarlama === "99" && ondalik > 0) return Math.max(0.99, Math.floor(x) + 0.99);
  return Math.round(x * c) / c;
}
export const kuponKodGecerli = (k: string) => /^[A-Z0-9_-]{3,30}$/.test(k);
export function kuponTemizle(x: unknown, eski?: Kupon): Kupon | null {
  const o = nesne(x);
  const kod = metin(o.kod, 30).toUpperCase().replace(/\s+/g, "");
  if (!kuponKodGecerli(kod)) return null;
  const tur = secim(o.tur, ["yuzde", "tutar", "kargo"] as const, "yuzde");
  const tarih = (v: unknown) => { const s = metin(v, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : ""; };
  return {
    id: eski?.id ?? kimlik(o.id), kod, tur, deger: tur === "kargo" ? 0 : tur === "yuzde" ? sayi(o.deger, 1, 90, 10) : sayi(o.deger, 1, 1e6, 50),
    minSepet: sayiYaDaBos(o.minSepet, 0, 1e7), baslangic: tarih(o.baslangic), bitis: tarih(o.bitis), sinir: sayiYaDaBos(o.sinir, 1, 1e6), kisiBasi: sayiYaDaBos(o.kisiBasi, 1, 1000),
    kategoriler: [...new Set(dizi(o.kategoriler).map((k) => metin(k, 60)).filter(Boolean))].slice(0, 30), aktif: mantik(o.aktif, true), aciklama: metin(o.aciklama, 160), olusturma: eski?.olusturma ?? Date.now(),
  };
}
export const kuponOzeti = (k: Pick<Kupon, "tur" | "deger" | "minSepet">, yaz: (n: number) => string = tl) =>
  `${k.tur === "yuzde" ? `Yüzde ${k.deger} indirim` : k.tur === "tutar" ? `${yaz(k.deger)} indirim` : "Ücretsiz kargo"}${k.minSepet ? `, en az ${yaz(k.minSepet)} sepette` : ""}`;

/** Ürün varyantları: seçenekler (Beden: S, M, L) ve her bileşimin fiyatı, stoğu, stok kodu. */
export type VaryantSecenek = { ad: string; degerler: string[] };
export type Varyant = { id: string; degerler: Record<string, string>; fiyat: number | null; stok: number | null; sku: string; aktif: boolean };
export type Varyantlar = { secenekler: VaryantSecenek[]; liste: Varyant[] };
export const varyantAdi = (v: Pick<Varyant, "degerler">) => Object.values(v.degerler).join(" / ");
export function varyantTemizle(x: unknown): Varyantlar | null {
  const g = nesne(x);
  const secenekler = dizi(g.secenekler).slice(0, 3).map((s0) => { const s = nesne(s0); return { ad: metin(s.ad, 30), degerler: [...new Set(dizi(s.degerler).map((d) => metin(d, 30)).filter(Boolean))].slice(0, 30) }; }).filter((s) => s.ad && s.degerler.length);
  if (!secenekler.length) return null;
  const eski = new Map(dizi(g.liste).map((v0) => { const v = nesne(v0); const d = nesne(v.degerler); return [secenekler.map((s) => String(d[s.ad] ?? "")).join("|"), v] as const; }));
  // Bütün bileşimler (en çok 100): eski bileşimin fiyat, stok ve kimliği korunur.
  let bilesim: Record<string, string>[] = [{}];
  for (const s of secenekler) bilesim = bilesim.flatMap((b) => s.degerler.map((d) => ({ ...b, [s.ad]: d }))).slice(0, 100);
  const liste = bilesim.map((d) => {
    const v = nesne(eski.get(secenekler.map((s) => d[s.ad]).join("|")));
    return { id: kimlik(v.id), degerler: d, fiyat: sayiYaDaBos(v.fiyat, 0, 1e7), stok: sayiYaDaBos(v.stok, 0, 1e6), sku: metin(v.sku, 40), aktif: mantik(v.aktif, true) };
  });
  return { secenekler, liste };
}
export const SIPARIS_ASAMALARI = [
  { id: "yeni", ad: "Yeni" }, { id: "hazirlaniyor", ad: "Hazırlanıyor" }, { id: "kargoda", ad: "Kargoda" }, { id: "teslim", ad: "Teslim edildi" }, { id: "iptal", ad: "İptal" },
] as const;
export type SiparisAsama = (typeof SIPARIS_ASAMALARI)[number]["id"];
/** Kurumsal fatura: TR'de vergi dairesi ve VKN; diğer ülkelerde vergiNo VAT, EIN ya da GST numarasıdır. */
export type Fatura = { tur: "bireysel" | "kurumsal"; unvan: string; vergiDairesi: string; vergiNo: string; adres: string; ulke?: string };
/** Vayra Ödeme siparişine işletme panelinin eklediği alanlar ("isletme" sütunu). */
export type SiparisIsletme = {
  asama: SiparisAsama; araToplam?: number; indirim?: number; kargoUcreti?: number; kdv?: { oran: number; tutar: number }[];
  /** Vergi özeti (ad: VAT, GST, Satış vergisi, KDV); kur: ek para biriminde alındıysa ana birim başına kur. */
  vergi?: { ad: string; dahil: boolean; toplam: number; tersIbraz: boolean; not: string }; kur?: number; anaPara?: string;
  kupon?: { kod: string; indirim: number; tur: Kupon["tur"] }; kargo?: { yontem: string; ad: string; firma: string; takipNo: string; takipAdresi: string };
  fatura?: Fatura; not?: string; notlar?: { z: number; metin: string }[]; gecmis?: { z: number; olay: string }[];
  /** Varyant stoğu ve kupon kullanımı işlendi mi (ödeme onayından sonra bir kez). */
  islendi?: boolean; hatirlatma?: number; yorumIstegi?: number; musteriBildirim?: Partial<Record<SiparisAsama, number>>;
};

/* ───────── randevu ───────── */
export type Hizmet = { id: string; ad: string; aciklama: string; sure: number; fiyat: number | null; tampon: number; calisanlar: string[]; aktif: boolean; kapasite: number };
export type Calisan = { id: string; ad: string; unvan: string; gorsel: string; eposta: string; ozelSaat: boolean; saatler: HaftaSaat; izinler: string[]; aktif: boolean };
export type RandevuAyar = {
  acik: boolean; hizmetler: Hizmet[]; calisanlar: Calisan[]; saatler: HaftaSaat;
  /** En az kaç dakika önceden (aynı gün son dakika randevusunu önler). */
  enAzOnce: number; enCokIleri: number; adim: number;
  onay: "otomatik" | "elle";
  hatirlatma: { acik: boolean; saat: number };
  /** Müşteri randevudan en geç kaç saat önce iptal edebilir. */
  iptalSaat: number;
  kapaliGunler: string[];
  sahipEposta: string;
  /** Takvim aboneliği (ICS) için gizli anahtar: Google, Apple ve Outlook takvimleri bu adresi okur. */
  takvimAnahtari?: string;
  /** Okurken profilden doldurulur (saklanmaz): müsait saatler bu saat diliminde hesaplanır. */
  saatDilimi?: string;
  guncelleme: number;
};
export const VARSAYILAN_RANDEVU: RandevuAyar = {
  acik: false, hizmetler: [], calisanlar: [], saatler: VARSAYILAN_HAFTA, enAzOnce: 120, enCokIleri: 60, adim: 30, onay: "otomatik",
  hatirlatma: { acik: true, saat: 24 }, iptalSaat: 12, kapaliGunler: [], sahipEposta: "", guncelleme: 0,
};
export function hizmetTemizle(x: unknown): Hizmet {
  const o = nesne(x);
  return { id: kimlik(o.id), ad: metin(o.ad, 80) || "Hizmet", aciklama: metin(o.aciklama, 400), sure: sayi(o.sure, 5, 600, 30), fiyat: sayiYaDaBos(o.fiyat, 0, 1e6), tampon: sayi(o.tampon, 0, 240, 0), calisanlar: dizi(o.calisanlar).map((c) => metin(c, 40)).filter(Boolean).slice(0, 40), aktif: mantik(o.aktif, true), kapasite: sayi(o.kapasite, 1, 50, 1) };
}
export function calisanTemizle(x: unknown, hafta: HaftaSaat): Calisan {
  const o = nesne(x);
  return { id: kimlik(o.id), ad: metin(o.ad, 80) || "Çalışan", unvan: metin(o.unvan, 80), gorsel: adres(o.gorsel), eposta: eposta(o.eposta), ozelSaat: mantik(o.ozelSaat), saatler: haftaTemizle(o.saatler, hafta), izinler: dizi(o.izinler).map((t) => metin(t, 10)).filter((t) => /^\d{4}-\d{2}-\d{2}$/.test(t)).slice(0, 120), aktif: mantik(o.aktif, true) };
}
export function randevuAyarTemizle(x: unknown): RandevuAyar {
  const g = nesne(x), h = nesne(g.hatirlatma);
  const saatler = haftaTemizle(g.saatler);
  return {
    acik: mantik(g.acik), hizmetler: dizi(g.hizmetler).slice(0, 60).map(hizmetTemizle), calisanlar: dizi(g.calisanlar).slice(0, 40).map((c) => calisanTemizle(c, saatler)), saatler,
    enAzOnce: sayi(g.enAzOnce, 0, 10080, 120), enCokIleri: sayi(g.enCokIleri, 1, 365, 60), adim: [10, 15, 20, 30, 60].includes(Number(g.adim)) ? Number(g.adim) : 30,
    onay: secim(g.onay, ["otomatik", "elle"] as const, "otomatik"), hatirlatma: { acik: mantik(h.acik, true), saat: [2, 6, 12, 24, 48].includes(Number(h.saat)) ? Number(h.saat) : 24 },
    iptalSaat: sayi(g.iptalSaat, 0, 168, 12), kapaliGunler: dizi(g.kapaliGunler).map((t) => metin(t, 10)).filter((t) => /^\d{4}-\d{2}-\d{2}$/.test(t)).slice(0, 200), sahipEposta: eposta(g.sahipEposta), guncelleme: Date.now(),
  };
}
export type RandevuDurum = "bekliyor" | "onaylandi" | "iptal" | "geldi" | "gelmedi";
export const RANDEVU_DURUMLARI: { id: RandevuDurum; ad: string }[] = [{ id: "bekliyor", ad: "Onay bekliyor" }, { id: "onaylandi", ad: "Onaylandı" }, { id: "geldi", ad: "Geldi" }, { id: "gelmedi", ad: "Gelmedi" }, { id: "iptal", ad: "İptal" }];
export type Randevu = {
  id: string; hizmetId: string; hizmetAd: string; calisanId: string; calisanAd: string; bas: number; bit: number; sure: number; fiyat: number | null;
  ad: string; eposta: string; telefon: string; not: string; durum: RandevuDurum; kod: string; kaynak: "site" | "panel";
  olusturma: number; guncelleme: number; hatirlatildi?: number; iptalNeden?: string; gecmis: { z: number; olay: string }[];
};

/* ───────── blog ───────── */
export type BlogAyar = { baslik: string; aciklama: string; yazar: string; sayfa: string; yaziSayfasi: string; kategoriler: string[]; sayfaBasi: number; guncelleme: number };
export const VARSAYILAN_BLOG: BlogAyar = { baslik: "Blog", aciklama: "", yazar: "", sayfa: "blog.html", yaziSayfasi: "yazi.html", kategoriler: [], sayfaBasi: 9, guncelleme: 0 };
export type YaziDurum = "taslak" | "yayinda" | "zamanli";
export type Yazi = {
  id: string; baslik: string; slug: string; ozet: string; icerik: string; kapak: string; kategori: string; etiketler: string[]; yazar: string;
  durum: YaziDurum; yayinZamani: number | null; seoBaslik: string; seoAciklama: string; okumaDk: number; olusturma: number; guncelleme: number; kaynak?: string;
  /** Sitede kalıcı sayfası (blog/<slug>.html) yazıldığı andaki güncelleme zamanı. */
  statik?: number;
};
/** Yazının şu an yayında olup olmadığı (zamanlı yazı vakti gelince kendiliğinden yayına girer). */
export const yaziYayinda = (y: Pick<Yazi, "durum" | "yayinZamani">, simdi = Date.now()) => y.durum === "yayinda" || (y.durum === "zamanli" && !!y.yayinZamani && y.yayinZamani <= simdi);
export const okumaSuresi = (md: string) => Math.max(1, Math.round((md.match(/[\p{L}\p{N}]+/gu) ?? []).length / 200));

/* ───────── çok dilli ───────── */
export const DILLER: { kod: string; ad: string; yerel: string }[] = [
  { kod: "tr", ad: "Türkçe", yerel: "Türkçe" }, { kod: "en", ad: "İngilizce", yerel: "English" }, { kod: "de", ad: "Almanca", yerel: "Deutsch" }, { kod: "ar", ad: "Arapça", yerel: "العربية" },
  { kod: "ru", ad: "Rusça", yerel: "Русский" }, { kod: "fr", ad: "Fransızca", yerel: "Français" }, { kod: "es", ad: "İspanyolca", yerel: "Español" }, { kod: "it", ad: "İtalyanca", yerel: "Italiano" },
  { kod: "nl", ad: "Felemenkçe", yerel: "Nederlands" }, { kod: "fa", ad: "Farsça", yerel: "فارسی" }, { kod: "az", ad: "Azerbaycan Türkçesi", yerel: "Azərbaycanca" }, { kod: "uk", ad: "Ukraynaca", yerel: "Українська" },
  { kod: "zh", ad: "Çince", yerel: "中文" }, { kod: "ja", ad: "Japonca", yerel: "日本語" }, { kod: "ko", ad: "Korece", yerel: "한국어" }, { kod: "pt", ad: "Portekizce", yerel: "Português" },
];
export const dilAdi = (k: string) => DILLER.find((d) => d.kod === k)?.ad ?? k;
export type DilAyar = { kaynak: string; diller: string[]; secici: { acik: boolean; konum: "sag-alt" | "sol-alt" | "sag-ust" }; tarayiciDili: boolean; ton: string; guncelleme: number };
export const VARSAYILAN_DIL: DilAyar = { kaynak: "tr", diller: [], secici: { acik: true, konum: "sol-alt" }, tarayiciDili: true, ton: "", guncelleme: 0 };
/** Çeviri tablosu satırı: kaynak metin, bulunduğu sayfalar ve dil başına çeviri. */
export type CeviriDurum = "ai" | "elle" | "eski";
export type CeviriSatir = { id: string; kaynak: string; sayfalar: string[]; tur: "metin" | "nitelik" | "baslik"; ceviri: Record<string, { metin: string; durum: CeviriDurum; z: number }>; gorulme: number };

/* ───────── eklentiler ───────── */
export type Konum = "sag-alt" | "sol-alt";
export type Eklentiler = {
  whatsapp: { acik: boolean; numara: string; mesaj: string; konum: Konum; etiket: string; urunSayfasi: boolean };
  sohbet: { acik: boolean; baslik: string; karsilama: string; cevrimdisi: string; eposta: boolean; konum: Konum };
  duyuru: { acik: boolean; metin: string; baglanti: string; baglantiMetni: string; renk: string; yaziRengi: string; kapatilabilir: boolean; bitis: string; kupon: string };
  popup: { acik: boolean; tur: "eposta" | "kupon" | "duyuru"; baslik: string; metin: string; dugme: string; kuponKod: string; gorsel: string; tetik: "gecikme" | "cikis" | "kaydirma"; gecikme: number; siklik: "bir" | "gunluk" | "her"; sayfalar: string };
  /**
   * Çerez bandı. bicim "bolge": ziyaretçinin ülkesine göre (AB, İngiltere, TR, İsviçre, Brezilya önceden onay; Kaliforniya
   * ve ABD reddetme hakkı ve Global Privacy Control; diğerleri bildirim). "onay", "ret", "bildirim": her ziyaretçiye aynı.
   */
  cerez: { acik: boolean; metin: string; politika: string; konum: "alt" | "sol-alt"; analitik: boolean; pazarlama: boolean; bicim: "bolge" | "onay" | "ret" | "bildirim"; gpc: boolean; retMetni: string };
  yorum: { acik: boolean; onay: "elle" | "otomatik"; urun: boolean; isletme: boolean };
  /** LocalBusiness yapılandırılmış verisi ana sayfaya eklensin. */
  yapisalVeri: boolean;
  /** Harita: [data-vayra-harita] öğesine OpenStreetMap haritası. */
  harita: boolean;
  guncelleme: number;
};
export const VARSAYILAN_EKLENTI: Eklentiler = {
  whatsapp: { acik: false, numara: "", mesaj: "Merhaba, sitenizden yazıyorum.", konum: "sag-alt", etiket: "WhatsApp ile yaz", urunSayfasi: true },
  sohbet: { acik: false, baslik: "Bize yazın", karsilama: "Merhaba, nasıl yardımcı olabiliriz?", cevrimdisi: "Şu an çevrim dışıyız; e-postanı bırak, en kısa sürede dönelim.", eposta: true, konum: "sag-alt" },
  duyuru: { acik: false, metin: "", baglanti: "", baglantiMetni: "", renk: "#111111", yaziRengi: "#ffffff", kapatilabilir: true, bitis: "", kupon: "" },
  popup: { acik: false, tur: "eposta", baslik: "Bültenimize katıl", metin: "Yeni ürünlerden ve kampanyalardan ilk sen haberdar ol.", dugme: "Katıl", kuponKod: "", gorsel: "", tetik: "gecikme", gecikme: 8, siklik: "gunluk", sayfalar: "" },
  cerez: { acik: false, metin: "Sitemizde deneyimini iyileştirmek için çerezler kullanıyoruz. Zorunlu çerezler dışındakiler için onayını istiyoruz.", politika: "cerez-politikasi.html", konum: "alt", analitik: true, pazarlama: false, bicim: "bolge", gpc: true, retMetni: "Kişisel bilgilerimi satma ya da paylaşma" },
  yorum: { acik: false, onay: "elle", urun: true, isletme: true },
  yapisalVeri: true, harita: true, guncelleme: 0,
};
const renk = (x: unknown, v: string) => (typeof x === "string" && /^#[0-9a-f]{6}$/i.test(x) ? x : v);
export function eklentiTemizle(x: unknown): Eklentiler {
  const g = nesne(x), V = VARSAYILAN_EKLENTI;
  const w = nesne(g.whatsapp), s = nesne(g.sohbet), d = nesne(g.duyuru), p = nesne(g.popup), c = nesne(g.cerez), y = nesne(g.yorum);
  const konum = (v: unknown) => secim(v, ["sag-alt", "sol-alt"] as const, "sag-alt");
  return {
    whatsapp: { acik: mantik(w.acik), numara: metin(w.numara, 20).replace(/\D/g, ""), mesaj: metin(w.mesaj, 300) || V.whatsapp.mesaj, konum: konum(w.konum), etiket: metin(w.etiket, 40), urunSayfasi: mantik(w.urunSayfasi, true) },
    sohbet: { acik: mantik(s.acik), baslik: metin(s.baslik, 60) || V.sohbet.baslik, karsilama: metin(s.karsilama, 300) || V.sohbet.karsilama, cevrimdisi: metin(s.cevrimdisi, 300) || V.sohbet.cevrimdisi, eposta: mantik(s.eposta, true), konum: konum(s.konum) },
    duyuru: { acik: mantik(d.acik), metin: metin(d.metin, 200), baglanti: metin(d.baglanti, 300).replace(/^javascript:/i, ""), baglantiMetni: metin(d.baglantiMetni, 40), renk: renk(d.renk, V.duyuru.renk), yaziRengi: renk(d.yaziRengi, V.duyuru.yaziRengi), kapatilabilir: mantik(d.kapatilabilir, true), bitis: /^\d{4}-\d{2}-\d{2}$/.test(String(d.bitis ?? "")) ? String(d.bitis) : "", kupon: metin(d.kupon, 30).toUpperCase() },
    popup: {
      acik: mantik(p.acik), tur: secim(p.tur, ["eposta", "kupon", "duyuru"] as const, "eposta"), baslik: metin(p.baslik, 80) || V.popup.baslik, metin: metin(p.metin, 300), dugme: metin(p.dugme, 30) || "Katıl",
      kuponKod: metin(p.kuponKod, 30).toUpperCase(), gorsel: adres(p.gorsel), tetik: secim(p.tetik, ["gecikme", "cikis", "kaydirma"] as const, "gecikme"), gecikme: sayi(p.gecikme, 0, 120, 8),
      siklik: secim(p.siklik, ["bir", "gunluk", "her"] as const, "gunluk"), sayfalar: metin(p.sayfalar, 300),
    },
    cerez: { acik: mantik(c.acik), metin: metin(c.metin, 400) || V.cerez.metin, politika: metin(c.politika, 120).replace(/^javascript:/i, ""), konum: secim(c.konum, ["alt", "sol-alt"] as const, "alt"), analitik: mantik(c.analitik, true), pazarlama: mantik(c.pazarlama), bicim: secim(c.bicim, ["bolge", "onay", "ret", "bildirim"] as const, "bolge"), gpc: mantik(c.gpc, true), retMetni: metin(c.retMetni, 80) || V.cerez.retMetni },
    yorum: { acik: mantik(y.acik), onay: secim(y.onay, ["elle", "otomatik"] as const, "elle"), urun: mantik(y.urun, true), isletme: mantik(y.isletme, true) },
    yapisalVeri: mantik(g.yapisalVeri, true), harita: mantik(g.harita, true), guncelleme: Date.now(),
  };
}

/* ───────── kurumsal e-posta ve alan adı ───────── */
export const EPOSTA_SAGLAYICILARI = [
  { id: "google", ad: "Google Workspace", logo: "/marka/renkli/google-color.svg", fiyat: "Kullanıcı başına aylık ücretli", kurulum: "admin.google.com" },
  { id: "microsoft", ad: "Microsoft 365", logo: "/marka/renkli/microsoft-color.svg", fiyat: "Kullanıcı başına aylık ücretli", kurulum: "admin.microsoft.com" },
  { id: "zoho", ad: "Zoho Mail", logo: "", fiyat: "Küçük ekipler için ücretsiz plan var", kurulum: "mailadmin.zoho.com" },
  { id: "yandex", ad: "Yandex 360", logo: "", fiyat: "Kullanıcı başına aylık ücretli", kurulum: "admin.yandex.com" },
  { id: "diger", ad: "Diğer sağlayıcı", logo: "", fiyat: "", kurulum: "" },
] as const;
export type EpostaSaglayici = (typeof EPOSTA_SAGLAYICILARI)[number]["id"];
export type KurumsalEposta = { saglayici: EpostaSaglayici | null; alan: string; dkimAd: string; dkimDeger: string; dmarcEposta: string; mxOzel: string; spfOzel: string; zohoBolge: "com" | "eu"; kutular: string[]; guncelleme: number };
export const VARSAYILAN_EPOSTA: KurumsalEposta = { saglayici: null, alan: "", dkimAd: "", dkimDeger: "", dmarcEposta: "", mxOzel: "", spfOzel: "", zohoBolge: "eu", kutular: [], guncelleme: 0 };
export const alanAdiGecerli = (a: string) => /^(?=.{3,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/.test(a);
export function kurumsalEpostaTemizle(x: unknown): KurumsalEposta {
  const g = nesne(x);
  const alan = metin(g.alan, 253).toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return {
    saglayici: EPOSTA_SAGLAYICILARI.some((s) => s.id === g.saglayici) ? (g.saglayici as EpostaSaglayici) : null, alan: alanAdiGecerli(alan) ? alan : "",
    dkimAd: metin(g.dkimAd, 120).replace(/[^a-zA-Z0-9._-]/g, ""), dkimDeger: metin(g.dkimDeger, 2000).replace(/\s+/g, " "), dmarcEposta: eposta(g.dmarcEposta),
    mxOzel: metin(g.mxOzel, 300), spfOzel: metin(g.spfOzel, 200).replace(/[^a-zA-Z0-9._:-]/g, ""), zohoBolge: secim(g.zohoBolge, ["com", "eu"] as const, "eu"),
    kutular: [...new Set(dizi(g.kutular).map((k) => metin(k, 64).toLowerCase()).filter((k) => /^[a-z0-9._-]{1,64}$/.test(k)))].slice(0, 30), guncelleme: Date.now(),
  };
}

/* ───────── yasal metinler ───────── */
/**
 * Yasal sayfalar. rejim: sayfanın ait olduğu yasa (boşsa her bölgede gerekli). Seçili rejimlere uymayan sayfa listede
 * önerilmez ama elle seçilebilir. Gizlilik politikası seçili rejimlerin (GDPR, CCPA, PIPEDA, KVKK) bölümlerini içerir.
 */
export const YASAL_TURLER = [
  { id: "gizlilik", ad: "Gizlilik politikası", dosya: "gizlilik-politikasi.html", alt: "Hangi verinin neden toplandığı; seçili yasaların (GDPR, CCPA, KVKK) bölümleriyle", magaza: false, rejim: "" },
  { id: "cerez", ad: "Çerez politikası", dosya: "cerez-politikasi.html", alt: "Çerez bandının bağlandığı sayfa", magaza: false, rejim: "" },
  { id: "kullanim", ad: "Kullanım koşulları", dosya: "kullanim-kosullari.html", alt: "Site kullanım kuralları, sorumluluk sınırı ve uygulanacak hukuk", magaza: false, rejim: "" },
  { id: "veriTalebi", ad: "Veri sahibi talepleri", dosya: "veri-talepleri.html", alt: "Erişim, düzeltme, silme ve taşınabilirlik talebi nasıl yapılır (GDPR madde 15-22)", magaza: false, rejim: "gdpr" },
  { id: "ccpa", ad: "Kaliforniya gizlilik bildirimi", dosya: "kaliforniya-gizlilik.html", alt: "CCPA ve CPRA: bilme, silme, düzeltme, satışı ve paylaşımı reddetme hakları", magaza: false, rejim: "ccpa" },
  { id: "kvkk", ad: "KVKK aydınlatma metni", dosya: "kvkk-aydinlatma.html", alt: "Türkiye: 6698 sayılı Kanun'un 10. maddesi", magaza: false, rejim: "kvkk" },
  { id: "satisKosullari", ad: "Satış koşulları", dosya: "satis-kosullari.html", alt: "Fiyat, vergi, ödeme, teslimat ve garanti; AB'de cayma bildirimi ve örnek cayma formuyla", magaza: true, rejim: "" },
  { id: "iade", ad: "İade ve cayma koşulları", dosya: "iade-kosullari.html", alt: "İade süresi, süreç ve istisnalar; AB ve İngiltere'de en az 14 gün", magaza: true, rejim: "" },
  { id: "teslimat", ad: "Teslimat ve kargo", dosya: "teslimat-ve-kargo.html", alt: "Kargo firmaları, bölgeler, süreler ve ücretler mağaza ayarlarından", magaza: true, rejim: "" },
  { id: "mesafeli", ad: "Mesafeli satış sözleşmesi", dosya: "mesafeli-satis-sozlesmesi.html", alt: "Türkiye: 6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği", magaza: true, rejim: "kvkk" },
  { id: "onbilgi", ad: "Ön bilgilendirme formu", dosya: "on-bilgilendirme-formu.html", alt: "Türkiye: siparişten önce alıcıya gösterilmesi zorunlu", magaza: true, rejim: "kvkk" },
] as const;
/** Seçili rejimlere göre önerilen sayfalar. */
export const yasalOneri = (rejimler: Gizlilik[], magaza: boolean) =>
  YASAL_TURLER.filter((x) => (!x.magaza || magaza) && (!x.rejim || rejimler.includes(x.rejim as Gizlilik) || (x.rejim === "gdpr" && rejimler.includes("ukgdpr")))).map((x) => x.id);
export type YasalTur = (typeof YASAL_TURLER)[number]["id"];
export type YasalAyar = {
  /** Metinlerde kullanılan ek bilgiler. */
  veriSorumlusu: string; basvuruEposta: string; saklamaSuresi: string; yurtDisi: boolean; analitik: boolean; pazarlamaIzni: boolean; iadeGun: number; iadeKargo: "alici" | "satici";
  /** Uyulan gizlilik yasaları (müşterilerin bulunduğu bölgelere göre); boşsa işletmenin ülkesinden gelir. */
  rejimler: Gizlilik[];
  /** Veri koruma görevlisi (DPO) e-postası; GDPR'da büyük ölçekte işleyenler için zorunlu. */
  dpoEposta: string;
  /** AB dışındaki işletmenin AB temsilcisi (GDPR madde 27) ve İngiltere temsilcisi. */
  abTemsilci: string; ukTemsilci: string;
  /** CCPA: kişisel bilgi reklam amacıyla satılıyor ya da paylaşılıyor mu (çapraz bağlam davranışsal reklam). */
  ccpaSatis: boolean;
  /** Kullanım ve satış koşullarında uygulanacak hukuk ve yetkili yer (boşsa işletmenin ülkesi). */
  hukukUlke: string; yetkiliYer: string;
  sayfalar: Partial<Record<YasalTur, { dosya: string; zaman: number; surumNo?: number }>>; guncelleme: number;
};
export const VARSAYILAN_YASAL: YasalAyar = { veriSorumlusu: "", basvuruEposta: "", saklamaSuresi: "Yasal saklama süreleri boyunca, en çok 10 yıl", yurtDisi: false, analitik: true, pazarlamaIzni: false, iadeGun: 14, iadeKargo: "satici", rejimler: [], dpoEposta: "", abTemsilci: "", ukTemsilci: "", ccpaSatis: false, hukukUlke: "", yetkiliYer: "", sayfalar: {}, guncelleme: 0 };
export const REJIM_KODLARI: Gizlilik[] = ["gdpr", "ukgdpr", "ccpa", "kvkk", "pipeda", "lgpd", "app", "dpdp", "pdpa", "popia", "appi", "fadp", "genel"];
export function yasalTemizle(x: unknown, eski?: YasalAyar): YasalAyar {
  const g = nesne(x);
  return {
    veriSorumlusu: metin(g.veriSorumlusu, 160), basvuruEposta: eposta(g.basvuruEposta), saklamaSuresi: metin(g.saklamaSuresi, 200) || VARSAYILAN_YASAL.saklamaSuresi, yurtDisi: mantik(g.yurtDisi),
    analitik: mantik(g.analitik, true), pazarlamaIzni: mantik(g.pazarlamaIzni), iadeGun: sayi(g.iadeGun, 14, 90, 14), iadeKargo: secim(g.iadeKargo, ["alici", "satici"] as const, "satici"),
    rejimler: [...new Set(dizi(g.rejimler).filter((x): x is Gizlilik => REJIM_KODLARI.includes(x as Gizlilik)))], dpoEposta: eposta(g.dpoEposta), abTemsilci: metin(g.abTemsilci, 300), ukTemsilci: metin(g.ukTemsilci, 300),
    ccpaSatis: mantik(g.ccpaSatis), hukukUlke: ulkeBul(String(g.hukukUlke ?? "")) ? String(g.hukukUlke).toUpperCase() : "", yetkiliYer: metin(g.yetkiliYer, 120),
    sayfalar: eski?.sayfalar ?? {}, guncelleme: Date.now(),
  };
}

/* ───────── yorumlar, sohbet, aboneler ───────── */
export type Yorum = { id: string; hedef: "isletme" | "urun"; urunId: string; urunAd: string; ad: string; eposta: string; puan: number; baslik: string; metin: string; durum: "bekliyor" | "onayli" | "gizli"; yanit: string; dogrulanmis: boolean; olusturma: number; ip?: string };
export type SohbetMesaj = { z: number; kim: "ziyaretci" | "isletme"; metin: string };
export type Sohbet = { id: string; anahtar: string; ad: string; eposta: string; sayfa: string; mesajlar: SohbetMesaj[]; okundu: boolean; kapali: boolean; olusturma: number; guncelleme: number; ip?: string };
/**
 * Bülten abonesi ve izin kaydı (GDPR madde 7: onayın ispatı). onayKodu: çift onay bekleniyor; onayZaman: e-postadaki bağlantıya
 * tıklandı. izinMetni: abone olurken gösterilen onay metni; ip ve ulke: kaydın yapıldığı yer.
 */
export type Abone = {
  id: string; eposta: string; ad: string; kaynak: string; sayfa: string; kupon: string; olusturma: number; izin: boolean;
  onayKodu?: string; onayIstendi?: number; onayZaman?: number; izinMetni?: string; ip?: string; ulke?: string; cikis?: number;
};

/* ───────── bütün işletme verisi ───────── */
export type IsletmeVeri = {
  profil: Profil; magaza: MagazaAyar; kuponlar: Kupon[]; randevu: RandevuAyar; blog: BlogAyar; dil: DilAyar; eklentiler: Eklentiler;
  yasal: YasalAyar; eposta: KurumsalEposta; kurulum: { bitti: string[] }; guncelleme: number;
};
export const bosIsletme = (): IsletmeVeri => ({
  profil: { ...BOS_PROFIL }, magaza: { ...VARSAYILAN_MAGAZA }, kuponlar: [], randevu: { ...VARSAYILAN_RANDEVU }, blog: { ...VARSAYILAN_BLOG }, dil: { ...VARSAYILAN_DIL },
  eklentiler: { ...VARSAYILAN_EKLENTI }, yasal: { ...VARSAYILAN_YASAL }, eposta: { ...VARSAYILAN_EPOSTA }, kurulum: { bitti: [] }, guncelleme: 0,
});
/** Eski ya da eksik kaydı tam biçime getirir (yeni alanlar varsayılanla). */
export function isletmeTamamla(x: unknown): IsletmeVeri {
  const g = nesne(x), b = bosIsletme();
  const kat = <T,>(v: T, y: unknown): T => ({ ...v, ...nesne(y) }) as T;
  const gp = nesne(g.profil), gm = nesne(g.magaza);
  const profil: Profil = { ...kat(b.profil, gp), adres: kat(b.profil.adres, gp.adres), sosyal: kat(b.profil.sosyal, gp.sosyal), resmi: kat(b.profil.resmi, gp.resmi), konum: kat(b.profil.konum, gp.konum) };
  // Bölge alanlarından önceki kayıtlar: ülke adından kod; eski varsayılan "Türkiye" idi.
  if (!profil.ulkeKodu) profil.ulkeKodu = ulkeKoduBul(profil.adres.ulke) || (eskiTrKaydi(gp as Partial<Profil>) ? "TR" : "");
  const u = ulkeBul(profil.ulkeKodu);
  if (u && !profil.adres.ulke) profil.adres.ulke = u.ad;
  if (!dilimGecerli(profil.saatDilimi)) profil.saatDilimi = u?.dilim ?? "UTC";
  if (!yerelGecerli(profil.yerel)) profil.yerel = u?.yerel ?? "en-US";
  if (/^₺{1,4}$/.test(String(profil.fiyatAraligi))) profil.fiyatAraligi = String(String(profil.fiyatAraligi).length) as Profil["fiyatAraligi"];
  // Para birimi ve vergiden önceki mağaza kaydı TL ve KDV dahil çalışıyordu.
  const eskiMagaza = Object.keys(gm).length > 0 && !("paraBirimi" in gm);
  const magaza: MagazaAyar = { ...kat(b.magaza, gm), terk: kat(b.magaza.terk, gm.terk) };
  if (eskiMagaza) { magaza.paraBirimi = "TRY"; magaza.vergi = { ...ulkeVergiVarsayilani("TR"), varsayilanOran: typeof gm.varsayilanKdv === "number" ? gm.varsayilanKdv : 20 }; }
  else if (!Object.keys(gm).length && u) { magaza.paraBirimi = u.para; magaza.vergi = ulkeVergiVarsayilani(u.kod); magaza.varsayilanKdv = magaza.vergi.varsayilanOran; magaza.kargo = ulkeKargoVarsayilani(u.kod); magaza.faturaIste = u.kod === "TR"; }
  if (!paraGecerli(magaza.paraBirimi)) magaza.paraBirimi = u?.para ?? "USD";
  magaza.vergi = { ...ulkeVergiVarsayilani(profil.ulkeKodu), ...nesne(magaza.vergi) } as VergiAyar;
  magaza.kargo = dizi(magaza.kargo).map((k) => ({ ulkeler: [], bolgeler: [], ucretTuru: "sabit", kgBasi: 0, ...nesne(k) }) as unknown as KargoYontem);
  magaza.ekParaBirimleri = dizi(magaza.ekParaBirimleri) as EkParaBirimi[];
  magaza.satisUlkeleri = dizi(magaza.satisUlkeleri).map(String);
  return {
    profil, magaza, kuponlar: dizi(g.kuponlar) as Kupon[],
    randevu: { ...kat(b.randevu, g.randevu), hatirlatma: kat(b.randevu.hatirlatma, nesne(g.randevu).hatirlatma), saatDilimi: profil.saatDilimi }, blog: kat(b.blog, g.blog), dil: { ...kat(b.dil, g.dil), secici: kat(b.dil.secici, nesne(g.dil).secici) },
    eklentiler: (() => { const e = nesne(g.eklentiler); return { ...kat(b.eklentiler, e), whatsapp: kat(b.eklentiler.whatsapp, e.whatsapp), sohbet: kat(b.eklentiler.sohbet, e.sohbet), duyuru: kat(b.eklentiler.duyuru, e.duyuru), popup: kat(b.eklentiler.popup, e.popup), cerez: kat(b.eklentiler.cerez, e.cerez), yorum: kat(b.eklentiler.yorum, e.yorum) }; })(),
    yasal: (() => { const y = kat(b.yasal, g.yasal); y.rejimler = dizi(y.rejimler) as Gizlilik[]; return y; })(), eposta: kat(b.eposta, g.eposta), kurulum: { bitti: dizi(nesne(g.kurulum).bitti).map(String) }, guncelleme: sayi(g.guncelleme),
  };
}

/** Uyulan gizlilik yasaları: seçili olanlar; seçilmemişse işletmenin ülkesine göre. */
export function yasalRejimleri(v: Pick<IsletmeVeri, "yasal" | "profil">): Gizlilik[] {
  if (v.yasal.rejimler?.length) return v.yasal.rejimler;
  const g = ulkeBul(v.profil.ulkeKodu)?.gizlilik;
  return g && g !== "genel" ? [g] : ["genel"];
}
const sayfaAdi = (x: unknown, v: string) => { const s = metin(x, 80).replace(/^\/+/, ""); return /^[a-z0-9_-]+(\/[a-z0-9_-]+)*\.html$/i.test(s) && !s.includes("..") ? s : v; };
export function blogAyarTemizle(x: unknown): BlogAyar {
  const g = nesne(x);
  const sayfa = sayfaAdi(g.sayfa, VARSAYILAN_BLOG.sayfa), yaziSayfasi = sayfaAdi(g.yaziSayfasi, VARSAYILAN_BLOG.yaziSayfasi);
  return {
    baslik: metin(g.baslik, 80) || "Blog", aciklama: metin(g.aciklama, 300), yazar: metin(g.yazar, 80), sayfa, yaziSayfasi: yaziSayfasi === sayfa ? VARSAYILAN_BLOG.yaziSayfasi : yaziSayfasi,
    kategoriler: [...new Set(dizi(g.kategoriler).map((k) => metin(k, 60)).filter(Boolean))].slice(0, 30), sayfaBasi: sayi(g.sayfaBasi, 3, 30, 9), guncelleme: Date.now(),
  };
}
export function dilAyarTemizle(x: unknown): DilAyar {
  const g = nesne(x), s = nesne(g.secici);
  const kaynak = DILLER.some((d) => d.kod === g.kaynak) ? String(g.kaynak) : "tr";
  return {
    kaynak, diller: [...new Set(dizi(g.diller).map(String).filter((k) => k !== kaynak && DILLER.some((d) => d.kod === k)))].slice(0, 8),
    secici: { acik: mantik(s.acik, true), konum: secim(s.konum, ["sag-alt", "sol-alt", "sag-ust"] as const, "sol-alt") }, tarayiciDili: mantik(g.tarayiciDili, true), ton: metin(g.ton, 120), guncelleme: Date.now(),
  };
}
