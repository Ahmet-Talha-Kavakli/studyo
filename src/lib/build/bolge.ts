/**
 * Vayra bölge katmanı: ülke, para birimi, vergi, adres biçimi, saat dilimi ve gizlilik rejimi. İstemci ve sunucu ortak
 * (server-only değil). Arayüz metinleri Türkçe; veriler dünya pazarına göre. Türkiye bir seçenektir, varsayılan değildir.
 *
 * Kaynaklar (2026): AB KDV oranları European Commission "VAT rates" tablosu; ABD eyalet temel satış vergisi oranları
 * eyalet gelir idareleri (yerel ilçe ve şehir ekleri hariç); Kanada GST/HST/PST/QST canada.ca; Avustralya GST ato.gov.au;
 * para birimi ondalıkları ISO 4217 ve Stripe "zero-decimal currencies" listesi; kurlar ECB euro referans kurları.
 */

/* ───────── para birimleri ───────── */
export type ParaBirimi = { kod: string; ad: string; ondalik: number };
export const PARA_BIRIMLERI: ParaBirimi[] = [
  { kod: "USD", ad: "ABD doları", ondalik: 2 }, { kod: "EUR", ad: "Avro", ondalik: 2 }, { kod: "GBP", ad: "İngiliz sterlini", ondalik: 2 },
  { kod: "CAD", ad: "Kanada doları", ondalik: 2 }, { kod: "AUD", ad: "Avustralya doları", ondalik: 2 }, { kod: "NZD", ad: "Yeni Zelanda doları", ondalik: 2 },
  { kod: "CHF", ad: "İsviçre frangı", ondalik: 2 }, { kod: "SEK", ad: "İsveç kronu", ondalik: 2 }, { kod: "NOK", ad: "Norveç kronu", ondalik: 2 },
  { kod: "DKK", ad: "Danimarka kronu", ondalik: 2 }, { kod: "PLN", ad: "Polonya zlotisi", ondalik: 2 }, { kod: "CZK", ad: "Çek korunası", ondalik: 2 },
  { kod: "HUF", ad: "Macar forinti", ondalik: 2 }, { kod: "RON", ad: "Rumen leyi", ondalik: 2 }, { kod: "ISK", ad: "İzlanda kronu", ondalik: 0 },
  { kod: "TRY", ad: "Türk lirası", ondalik: 2 }, { kod: "JPY", ad: "Japon yeni", ondalik: 0 }, { kod: "KRW", ad: "Güney Kore wonu", ondalik: 0 },
  { kod: "CNY", ad: "Çin yuanı", ondalik: 2 }, { kod: "HKD", ad: "Hong Kong doları", ondalik: 2 }, { kod: "SGD", ad: "Singapur doları", ondalik: 2 },
  { kod: "INR", ad: "Hindistan rupisi", ondalik: 2 }, { kod: "IDR", ad: "Endonezya rupisi", ondalik: 2 }, { kod: "MYR", ad: "Malezya ringgiti", ondalik: 2 },
  { kod: "THB", ad: "Tayland bahtı", ondalik: 2 }, { kod: "PHP", ad: "Filipin pesosu", ondalik: 2 }, { kod: "AED", ad: "BAE dirhemi", ondalik: 2 },
  { kod: "SAR", ad: "Suudi riyali", ondalik: 2 }, { kod: "ILS", ad: "İsrail şekeli", ondalik: 2 }, { kod: "ZAR", ad: "Güney Afrika randı", ondalik: 2 },
  { kod: "BRL", ad: "Brezilya reali", ondalik: 2 }, { kod: "MXN", ad: "Meksika pesosu", ondalik: 2 }, { kod: "AZN", ad: "Azerbaycan manatı", ondalik: 2 },
];
export const paraGecerli = (k: unknown): k is string => typeof k === "string" && PARA_BIRIMLERI.some((p) => p.kod === k);
export const paraAdi = (k: string) => PARA_BIRIMLERI.find((p) => p.kod === k)?.ad ?? k;
export const paraOndalik = (k: string) => PARA_BIRIMLERI.find((p) => p.kod === k)?.ondalik ?? 2;
/** Tutarı para biriminin en küçük birimine yuvarlar (JPY tam sayı, USD sent). */
export const paraYuvarla = (n: number, k: string) => { const c = 10 ** paraOndalik(k); return Math.round(n * c) / c; };
/** Intl ile biçim: yerel "en-US" ise "$1,250.00", "de-DE" ise "1.250,00 €". */
export function paraYaz(n: number, kod = "USD", yerel = "tr-TR"): string {
  const o = paraOndalik(kod);
  try { return new Intl.NumberFormat(yerel, { style: "currency", currency: kod, minimumFractionDigits: n % 1 && o ? o : 0, maximumFractionDigits: o }).format(n); }
  catch { return `${n.toFixed(o)} ${kod}`; }
}
export function paraSimgesi(kod: string, yerel = "tr-TR"): string {
  try { return new Intl.NumberFormat(yerel, { style: "currency", currency: kod, currencyDisplay: "narrowSymbol" }).formatToParts(0).find((p) => p.type === "currency")?.value ?? kod; }
  catch { return kod; }
}
/** ABD dolarına sabitli para birimleri (ECB listesinde yok): resmî sabit kur. */
export const SABIT_KUR_USD: Record<string, number> = { AED: 3.6725, SAR: 3.75, AZN: 1.7 };

/* ───────── vergi ───────── */
export type VergiModeli = "kdv" | "vat" | "gst" | "sales" | "yok";
export const VERGI_MODELLERI: { id: VergiModeli; ad: string; alt: string; dahil: boolean }[] = [
  { id: "vat", ad: "VAT (katma değer vergisi)", alt: "AB, Birleşik Krallık, Norveç, İsviçre; fiyatlar genelde vergi dahil gösterilir", dahil: true },
  { id: "sales", ad: "Satış vergisi (Sales tax)", alt: "ABD; oran teslimat eyaletine göre, fiyatlar vergi hariç gösterilir", dahil: false },
  { id: "gst", ad: "GST / HST", alt: "Kanada, Avustralya, Yeni Zelanda, Hindistan, Singapur", dahil: true },
  { id: "kdv", ad: "KDV (Türkiye)", alt: "Yüzde 0, 1, 10, 20; fiyatlar vergi dahil", dahil: true },
  { id: "yok", ad: "Vergisiz", alt: "Mağaza vergi hesaplamaz, göstermez ve eklemez", dahil: true },
];
export const vergiAdi = (m: VergiModeli) => (m === "sales" ? "Satış vergisi" : m === "gst" ? "GST" : m === "vat" ? "VAT" : m === "kdv" ? "KDV" : "Vergi");

/* ───────── eyalet ve il listeleri (adres ve vergi için) ───────── */
export type AltBolge = { kod: string; ad: string; oran?: number; not?: string };
export const ABD_EYALETLERI: AltBolge[] = [
  ["AL", "Alabama", 4], ["AK", "Alaska", 0], ["AZ", "Arizona", 5.6], ["AR", "Arkansas", 6.5], ["CA", "California", 7.25], ["CO", "Colorado", 2.9], ["CT", "Connecticut", 6.35],
  ["DE", "Delaware", 0], ["DC", "District of Columbia", 6], ["FL", "Florida", 6], ["GA", "Georgia", 4], ["HI", "Hawaii", 4], ["ID", "Idaho", 6], ["IL", "Illinois", 6.25],
  ["IN", "Indiana", 7], ["IA", "Iowa", 6], ["KS", "Kansas", 6.5], ["KY", "Kentucky", 6], ["LA", "Louisiana", 5], ["ME", "Maine", 5.5], ["MD", "Maryland", 6],
  ["MA", "Massachusetts", 6.25], ["MI", "Michigan", 6], ["MN", "Minnesota", 6.875], ["MS", "Mississippi", 7], ["MO", "Missouri", 4.225], ["MT", "Montana", 0],
  ["NE", "Nebraska", 5.5], ["NV", "Nevada", 6.85], ["NH", "New Hampshire", 0], ["NJ", "New Jersey", 6.625], ["NM", "New Mexico", 4.875], ["NY", "New York", 4],
  ["NC", "North Carolina", 4.75], ["ND", "North Dakota", 5], ["OH", "Ohio", 5.75], ["OK", "Oklahoma", 4.5], ["OR", "Oregon", 0], ["PA", "Pennsylvania", 6],
  ["RI", "Rhode Island", 7], ["SC", "South Carolina", 6], ["SD", "South Dakota", 4.2], ["TN", "Tennessee", 7], ["TX", "Texas", 6.25], ["UT", "Utah", 6.1],
  ["VT", "Vermont", 6], ["VA", "Virginia", 5.3], ["WA", "Washington", 6.5], ["WV", "West Virginia", 6], ["WI", "Wisconsin", 5], ["WY", "Wyoming", 4],
  ["PR", "Puerto Rico", 10.5],
].map(([kod, ad, oran]) => ({ kod: String(kod), ad: String(ad), oran: Number(oran) }));
/** Kanada: GST yüzde 5; HST eyaletlerinde birleşik oran; PST/QST eyaletlerinde GST ile eyalet vergisinin toplamı. */
export const KANADA_EYALETLERI: AltBolge[] = [
  { kod: "AB", ad: "Alberta", oran: 5, not: "GST" }, { kod: "BC", ad: "British Columbia", oran: 12, not: "GST 5 ve PST 7" }, { kod: "MB", ad: "Manitoba", oran: 12, not: "GST 5 ve RST 7" },
  { kod: "NB", ad: "New Brunswick", oran: 15, not: "HST" }, { kod: "NL", ad: "Newfoundland and Labrador", oran: 15, not: "HST" }, { kod: "NS", ad: "Nova Scotia", oran: 14, not: "HST" },
  { kod: "NT", ad: "Northwest Territories", oran: 5, not: "GST" }, { kod: "NU", ad: "Nunavut", oran: 5, not: "GST" }, { kod: "ON", ad: "Ontario", oran: 13, not: "HST" },
  { kod: "PE", ad: "Prince Edward Island", oran: 15, not: "HST" }, { kod: "QC", ad: "Québec", oran: 14.975, not: "GST 5 ve QST 9,975" }, { kod: "SK", ad: "Saskatchewan", oran: 11, not: "GST 5 ve PST 6" },
  { kod: "YT", ad: "Yukon", oran: 5, not: "GST" },
];
export const AVUSTRALYA_EYALETLERI: AltBolge[] = [
  { kod: "ACT", ad: "Australian Capital Territory" }, { kod: "NSW", ad: "New South Wales" }, { kod: "NT", ad: "Northern Territory" }, { kod: "QLD", ad: "Queensland" },
  { kod: "SA", ad: "South Australia" }, { kod: "TAS", ad: "Tasmania" }, { kod: "VIC", ad: "Victoria" }, { kod: "WA", ad: "Western Australia" },
];
export const ALT_BOLGELER: Record<string, AltBolge[]> = { US: ABD_EYALETLERI, CA: KANADA_EYALETLERI, AU: AVUSTRALYA_EYALETLERI };

/* ───────── ülkeler ───────── */
export type Gizlilik = "gdpr" | "ukgdpr" | "ccpa" | "kvkk" | "pipeda" | "lgpd" | "app" | "dpdp" | "pdpa" | "popia" | "appi" | "fadp" | "genel";
export type EpostaKurali = "gdpr" | "canspam" | "casl" | "iys" | "spam-act" | "genel";
export type Ulke = {
  kod: string; ad: string; grup: UlkeGrubu; para: string; dilim: string; yerel: string;
  vergi: { model: VergiModeli; oran: number; indirimli?: number[] };
  adres: { bolge: "" | "zorunlu" | "istege"; bolgeEtiket: string; posta: "zorunlu" | "istege" | "yok"; postaEtiket: string; postaDesen?: string; postaOnce?: boolean };
  gizlilik: Gizlilik; eposta: EpostaKurali;
};
export type UlkeGrubu = "ab" | "avrupa" | "kuzey-amerika" | "latin-amerika" | "asya-pasifik" | "orta-dogu" | "afrika" | "turkiye";
export const ULKE_GRUPLARI: { id: UlkeGrubu; ad: string }[] = [
  { id: "kuzey-amerika", ad: "Kuzey Amerika" }, { id: "ab", ad: "Avrupa Birliği" }, { id: "avrupa", ad: "AB dışı Avrupa" }, { id: "asya-pasifik", ad: "Asya ve Pasifik" },
  { id: "orta-dogu", ad: "Orta Doğu" }, { id: "latin-amerika", ad: "Latin Amerika" }, { id: "afrika", ad: "Afrika" }, { id: "turkiye", ad: "Türkiye" },
];
const A = (bolge: Ulke["adres"]["bolge"], bolgeEtiket: string, posta: Ulke["adres"]["posta"], postaEtiket: string, postaDesen?: string, postaOnce = true): Ulke["adres"] => ({ bolge, bolgeEtiket, posta, postaEtiket, postaDesen, postaOnce });
const AB = (kod: string, ad: string, oran: number, yerel: string, dilim: string, posta = "^\\d{4,5}$", indirimli?: number[], para = "EUR"): Ulke =>
  ({ kod, ad, grup: "ab", para, dilim, yerel, vergi: { model: "vat", oran, indirimli }, adres: A("", "", "zorunlu", "Posta kodu", posta), gizlilik: "gdpr", eposta: "gdpr" });
export const ULKELER: Ulke[] = [
  { kod: "US", ad: "Amerika Birleşik Devletleri", grup: "kuzey-amerika", para: "USD", dilim: "America/New_York", yerel: "en-US", vergi: { model: "sales", oran: 0 }, adres: A("zorunlu", "Eyalet", "zorunlu", "ZIP kodu", "^\\d{5}(-\\d{4})?$", false), gizlilik: "ccpa", eposta: "canspam" },
  { kod: "CA", ad: "Kanada", grup: "kuzey-amerika", para: "CAD", dilim: "America/Toronto", yerel: "en-CA", vergi: { model: "gst", oran: 5 }, adres: A("zorunlu", "Eyalet", "zorunlu", "Posta kodu", "^[A-Za-z]\\d[A-Za-z] ?\\d[A-Za-z]\\d$", false), gizlilik: "pipeda", eposta: "casl" },
  { kod: "MX", ad: "Meksika", grup: "latin-amerika", para: "MXN", dilim: "America/Mexico_City", yerel: "es-MX", vergi: { model: "vat", oran: 16 }, adres: A("zorunlu", "Eyalet", "zorunlu", "Posta kodu", "^\\d{5}$"), gizlilik: "genel", eposta: "genel" },
  { kod: "GB", ad: "Birleşik Krallık", grup: "avrupa", para: "GBP", dilim: "Europe/London", yerel: "en-GB", vergi: { model: "vat", oran: 20, indirimli: [5, 0] }, adres: A("istege", "İlçe (county)", "zorunlu", "Postcode", "^[A-Za-z]{1,2}\\d[A-Za-z\\d]? ?\\d[A-Za-z]{2}$", false), gizlilik: "ukgdpr", eposta: "gdpr" },
  { kod: "IE", ad: "İrlanda", grup: "ab", para: "EUR", dilim: "Europe/Dublin", yerel: "en-IE", vergi: { model: "vat", oran: 23, indirimli: [13.5, 9] }, adres: A("istege", "İlçe (county)", "istege", "Eircode", undefined, false), gizlilik: "gdpr", eposta: "gdpr" },
  AB("DE", "Almanya", 19, "de-DE", "Europe/Berlin", "^\\d{5}$", [7]), AB("FR", "Fransa", 20, "fr-FR", "Europe/Paris", "^\\d{5}$", [10, 5.5]), AB("ES", "İspanya", 21, "es-ES", "Europe/Madrid", "^\\d{5}$", [10, 4]),
  AB("IT", "İtalya", 22, "it-IT", "Europe/Rome", "^\\d{5}$", [10, 5, 4]), AB("NL", "Hollanda", 21, "nl-NL", "Europe/Amsterdam", "^\\d{4} ?[A-Za-z]{2}$", [9]), AB("BE", "Belçika", 21, "nl-BE", "Europe/Brussels", "^\\d{4}$", [12, 6]),
  AB("AT", "Avusturya", 20, "de-AT", "Europe/Vienna", "^\\d{4}$", [13, 10]), AB("PT", "Portekiz", 23, "pt-PT", "Europe/Lisbon", "^\\d{4}-?\\d{3}$", [13, 6]), AB("PL", "Polonya", 23, "pl-PL", "Europe/Warsaw", "^\\d{2}-?\\d{3}$", [8, 5], "PLN"),
  AB("SE", "İsveç", 25, "sv-SE", "Europe/Stockholm", "^\\d{3} ?\\d{2}$", [12, 6], "SEK"), AB("DK", "Danimarka", 25, "da-DK", "Europe/Copenhagen", "^\\d{4}$", undefined, "DKK"), AB("FI", "Finlandiya", 25.5, "fi-FI", "Europe/Helsinki", "^\\d{5}$", [14, 10]),
  AB("GR", "Yunanistan", 24, "el-GR", "Europe/Athens", "^\\d{3} ?\\d{2}$", [13, 6]), AB("CZ", "Çekya", 21, "cs-CZ", "Europe/Prague", "^\\d{3} ?\\d{2}$", [12], "CZK"), AB("HU", "Macaristan", 27, "hu-HU", "Europe/Budapest", "^\\d{4}$", [18, 5], "HUF"),
  AB("RO", "Romanya", 21, "ro-RO", "Europe/Bucharest", "^\\d{6}$", [11], "RON"), AB("BG", "Bulgaristan", 20, "bg-BG", "Europe/Sofia", "^\\d{4}$", [9]), AB("HR", "Hırvatistan", 25, "hr-HR", "Europe/Zagreb", "^\\d{5}$", [13, 5]),
  AB("SK", "Slovakya", 23, "sk-SK", "Europe/Bratislava", "^\\d{3} ?\\d{2}$", [19, 5]), AB("SI", "Slovenya", 22, "sl-SI", "Europe/Ljubljana", "^\\d{4}$", [9.5, 5]), AB("LT", "Litvanya", 21, "lt-LT", "Europe/Vilnius", "^(LT-)?\\d{5}$", [9, 5]),
  AB("LV", "Letonya", 21, "lv-LV", "Europe/Riga", "^(LV-)?\\d{4}$", [12, 5]), AB("EE", "Estonya", 24, "et-EE", "Europe/Tallinn", "^\\d{5}$", [13, 9]), AB("LU", "Lüksemburg", 17, "fr-LU", "Europe/Luxembourg", "^(L-)?\\d{4}$", [8, 3]),
  AB("MT", "Malta", 18, "en-MT", "Europe/Malta", "^[A-Za-z]{3} ?\\d{4}$", [7, 5]), AB("CY", "Kıbrıs Cumhuriyeti", 19, "el-CY", "Asia/Nicosia", "^\\d{4}$", [9, 5]),
  { kod: "CH", ad: "İsviçre", grup: "avrupa", para: "CHF", dilim: "Europe/Zurich", yerel: "de-CH", vergi: { model: "vat", oran: 8.1, indirimli: [2.6, 3.8] }, adres: A("", "", "zorunlu", "Posta kodu", "^\\d{4}$"), gizlilik: "fadp", eposta: "gdpr" },
  { kod: "NO", ad: "Norveç", grup: "avrupa", para: "NOK", dilim: "Europe/Oslo", yerel: "nb-NO", vergi: { model: "vat", oran: 25, indirimli: [15, 12] }, adres: A("", "", "zorunlu", "Posta kodu", "^\\d{4}$"), gizlilik: "gdpr", eposta: "gdpr" },
  { kod: "IS", ad: "İzlanda", grup: "avrupa", para: "ISK", dilim: "Atlantic/Reykjavik", yerel: "is-IS", vergi: { model: "vat", oran: 24, indirimli: [11] }, adres: A("", "", "zorunlu", "Posta kodu", "^\\d{3}$"), gizlilik: "gdpr", eposta: "gdpr" },
  { kod: "TR", ad: "Türkiye", grup: "turkiye", para: "TRY", dilim: "Europe/Istanbul", yerel: "tr-TR", vergi: { model: "kdv", oran: 20, indirimli: [10, 1, 0] }, adres: A("zorunlu", "İl", "istege", "Posta kodu", "^\\d{5}$"), gizlilik: "kvkk", eposta: "iys" },
  { kod: "AU", ad: "Avustralya", grup: "asya-pasifik", para: "AUD", dilim: "Australia/Sydney", yerel: "en-AU", vergi: { model: "gst", oran: 10 }, adres: A("zorunlu", "Eyalet", "zorunlu", "Postcode", "^\\d{4}$", false), gizlilik: "app", eposta: "spam-act" },
  { kod: "NZ", ad: "Yeni Zelanda", grup: "asya-pasifik", para: "NZD", dilim: "Pacific/Auckland", yerel: "en-NZ", vergi: { model: "gst", oran: 15 }, adres: A("istege", "Bölge", "zorunlu", "Postcode", "^\\d{4}$", false), gizlilik: "genel", eposta: "spam-act" },
  { kod: "JP", ad: "Japonya", grup: "asya-pasifik", para: "JPY", dilim: "Asia/Tokyo", yerel: "ja-JP", vergi: { model: "vat", oran: 10, indirimli: [8] }, adres: A("zorunlu", "İl (prefecture)", "zorunlu", "Posta kodu", "^\\d{3}-?\\d{4}$"), gizlilik: "appi", eposta: "genel" },
  { kod: "KR", ad: "Güney Kore", grup: "asya-pasifik", para: "KRW", dilim: "Asia/Seoul", yerel: "ko-KR", vergi: { model: "vat", oran: 10 }, adres: A("istege", "İl", "zorunlu", "Posta kodu", "^\\d{5}$"), gizlilik: "genel", eposta: "genel" },
  { kod: "SG", ad: "Singapur", grup: "asya-pasifik", para: "SGD", dilim: "Asia/Singapore", yerel: "en-SG", vergi: { model: "gst", oran: 9 }, adres: A("", "", "zorunlu", "Posta kodu", "^\\d{6}$", false), gizlilik: "pdpa", eposta: "genel" },
  { kod: "IN", ad: "Hindistan", grup: "asya-pasifik", para: "INR", dilim: "Asia/Kolkata", yerel: "en-IN", vergi: { model: "gst", oran: 18, indirimli: [5, 0] }, adres: A("zorunlu", "Eyalet", "zorunlu", "PIN kodu", "^\\d{6}$", false), gizlilik: "dpdp", eposta: "genel" },
  { kod: "HK", ad: "Hong Kong", grup: "asya-pasifik", para: "HKD", dilim: "Asia/Hong_Kong", yerel: "en-HK", vergi: { model: "yok", oran: 0 }, adres: A("istege", "Bölge", "yok", "Posta kodu"), gizlilik: "genel", eposta: "genel" },
  { kod: "CN", ad: "Çin", grup: "asya-pasifik", para: "CNY", dilim: "Asia/Shanghai", yerel: "zh-CN", vergi: { model: "vat", oran: 13 }, adres: A("zorunlu", "İl", "zorunlu", "Posta kodu", "^\\d{6}$"), gizlilik: "genel", eposta: "genel" },
  { kod: "MY", ad: "Malezya", grup: "asya-pasifik", para: "MYR", dilim: "Asia/Kuala_Lumpur", yerel: "en-MY", vergi: { model: "gst", oran: 8 }, adres: A("zorunlu", "Eyalet", "zorunlu", "Posta kodu", "^\\d{5}$"), gizlilik: "pdpa", eposta: "genel" },
  { kod: "TH", ad: "Tayland", grup: "asya-pasifik", para: "THB", dilim: "Asia/Bangkok", yerel: "th-TH", vergi: { model: "vat", oran: 7 }, adres: A("zorunlu", "İl", "zorunlu", "Posta kodu", "^\\d{5}$"), gizlilik: "pdpa", eposta: "genel" },
  { kod: "ID", ad: "Endonezya", grup: "asya-pasifik", para: "IDR", dilim: "Asia/Jakarta", yerel: "id-ID", vergi: { model: "vat", oran: 12 }, adres: A("zorunlu", "İl", "zorunlu", "Posta kodu", "^\\d{5}$"), gizlilik: "genel", eposta: "genel" },
  { kod: "PH", ad: "Filipinler", grup: "asya-pasifik", para: "PHP", dilim: "Asia/Manila", yerel: "en-PH", vergi: { model: "vat", oran: 12 }, adres: A("zorunlu", "İl", "zorunlu", "Posta kodu", "^\\d{4}$"), gizlilik: "genel", eposta: "genel" },
  { kod: "AE", ad: "Birleşik Arap Emirlikleri", grup: "orta-dogu", para: "AED", dilim: "Asia/Dubai", yerel: "en-AE", vergi: { model: "vat", oran: 5 }, adres: A("zorunlu", "Emirlik", "yok", "Posta kodu"), gizlilik: "genel", eposta: "genel" },
  { kod: "SA", ad: "Suudi Arabistan", grup: "orta-dogu", para: "SAR", dilim: "Asia/Riyadh", yerel: "ar-SA", vergi: { model: "vat", oran: 15 }, adres: A("istege", "Bölge", "zorunlu", "Posta kodu", "^\\d{5}(-\\d{4})?$"), gizlilik: "genel", eposta: "genel" },
  { kod: "IL", ad: "İsrail", grup: "orta-dogu", para: "ILS", dilim: "Asia/Jerusalem", yerel: "he-IL", vergi: { model: "vat", oran: 18 }, adres: A("", "", "zorunlu", "Posta kodu", "^\\d{7}$"), gizlilik: "genel", eposta: "genel" },
  { kod: "AZ", ad: "Azerbaycan", grup: "orta-dogu", para: "AZN", dilim: "Asia/Baku", yerel: "az-AZ", vergi: { model: "vat", oran: 18 }, adres: A("istege", "Bölge", "istege", "Posta kodu", "^(AZ)? ?\\d{4}$"), gizlilik: "genel", eposta: "genel" },
  { kod: "ZA", ad: "Güney Afrika", grup: "afrika", para: "ZAR", dilim: "Africa/Johannesburg", yerel: "en-ZA", vergi: { model: "vat", oran: 15 }, adres: A("zorunlu", "Eyalet", "zorunlu", "Posta kodu", "^\\d{4}$", false), gizlilik: "popia", eposta: "genel" },
  { kod: "BR", ad: "Brezilya", grup: "latin-amerika", para: "BRL", dilim: "America/Sao_Paulo", yerel: "pt-BR", vergi: { model: "yok", oran: 0 }, adres: A("zorunlu", "Eyalet", "zorunlu", "CEP", "^\\d{5}-?\\d{3}$"), gizlilik: "lgpd", eposta: "genel" },
];
export const ulkeBul = (kod: string | undefined | null) => (kod ? ULKELER.find((u) => u.kod === kod.toUpperCase()) : undefined);
/** Eski kayıtlardaki ülke adını ("Türkiye", "Germany") koda çevirir. */
export function ulkeKoduBul(x: unknown): string {
  const s = String(x ?? "").trim();
  if (!s) return "";
  if (/^[A-Za-z]{2}$/.test(s) && ulkeBul(s)) return s.toUpperCase();
  const k = s.toLocaleLowerCase("tr");
  const es: Record<string, string> = { turkey: "TR", "türkiye": "TR", turkiye: "TR", usa: "US", "united states": "US", abd: "US", "united kingdom": "GB", uk: "GB", "ingiltere": "GB", germany: "DE", deutschland: "DE", france: "FR", spain: "ES", italy: "IT", netherlands: "NL", canada: "CA", australia: "AU" };
  return es[k] ?? ULKELER.find((u) => u.ad.toLocaleLowerCase("tr") === k)?.kod ?? "";
}
/** Uluslararası telefon kodları (E.164 öneki, artı işaretsiz). */
export const TELEFON_KODU: Record<string, string> = {
  US: "1", CA: "1", MX: "52", GB: "44", IE: "353", DE: "49", FR: "33", ES: "34", IT: "39", NL: "31", BE: "32", AT: "43", PT: "351", PL: "48", SE: "46", DK: "45",
  FI: "358", GR: "30", CZ: "420", HU: "36", RO: "40", BG: "359", HR: "385", SK: "421", SI: "386", LT: "370", LV: "371", EE: "372", LU: "352", MT: "356", CY: "357",
  CH: "41", NO: "47", IS: "354", TR: "90", AU: "61", NZ: "64", JP: "81", KR: "82", SG: "65", IN: "91", HK: "852", CN: "86", MY: "60", TH: "66", ID: "62", PH: "63",
  AE: "971", SA: "966", IL: "972", AZ: "994", ZA: "27", BR: "55",
};
/** Yerel yazılmış numarayı E.164'e çevirir ("(415) 555-0100", US → "+14155550100"; "0532 …", TR → "+90532…"). */
export function telefonE164(t: string, ulke = ""): string {
  const d = t.replace(/[^\d+]/g, ""), r = d.replace(/\+/g, "");
  if (!r) return "";
  if (d.startsWith("+")) return "+" + r;
  if (r.startsWith("00")) return "+" + r.slice(2);
  const kod = TELEFON_KODU[ulke];
  if (ulke === "TR" || (!ulke && /^(0?5\d{9}|90\d{10})$/.test(r))) {
    if (r.length === 10 && r.startsWith("5")) return "+90" + r;
    if (r.length === 11 && r.startsWith("0")) return "+90" + r.slice(1);
    if (r.length === 12 && r.startsWith("90")) return "+" + r;
  }
  if (kod) {
    if (r.startsWith(kod) && r.length > 10) return "+" + r;
    return "+" + kod + r.replace(/^0+/, "");
  }
  return "+" + r;
}
/** Ülkenin İngilizce adı (ödeme sağlayıcıları için: "Germany", "United States"). */
export function ulkeIngilizce(kod: string): string {
  try { return new Intl.DisplayNames(["en"], { type: "region" }).of(kod) ?? kod; } catch { return kod; }
}
export const AB_ULKELERI =ULKELER.filter((u) => u.grup === "ab").map((u) => u.kod);
export const ulkeGrubu = (g: UlkeGrubu) => ULKELER.filter((u) => u.grup === g).map((u) => u.kod);
export const altBolgeAdi = (ulke: string, kod: string) => ALT_BOLGELER[ulke]?.find((b) => b.kod === kod)?.ad ?? kod;
/** Ülkeye göre gösterilecek adres alanları (sıra ve etiket). */
export function adresBicimi(ulke: string) {
  const u = ulkeBul(ulke);
  const a = u?.adres ?? A("istege", "Eyalet ya da bölge", "istege", "Posta kodu");
  return { ...a, secenekler: ALT_BOLGELER[ulke] ?? null, ilEtiket: ulke === "TR" ? "İlçe" : "Şehir" };
}
/** Posta kodu ülkenin biçimine uyuyor mu (biçimi tanımlı olmayan ülkede yalnız uzunluk). */
export function postaKoduGecerli(ulke: string, kod: string): boolean {
  const d = ulkeBul(ulke)?.adres.postaDesen;
  const s = kod.trim();
  return d ? new RegExp(d).test(s) : s.length <= 12;
}

/* ───────── gizlilik ve e-posta rejimleri ───────── */
export const GIZLILIK_REJIMLERI: { id: Gizlilik; ad: string; alt: string }[] = [
  { id: "gdpr", ad: "GDPR", alt: "AB ve AEA: açık onay, veri sahibi hakları, 72 saatte ihlal bildirimi" },
  { id: "ukgdpr", ad: "UK GDPR", alt: "Birleşik Krallık: GDPR ile aynı ilkeler, ICO denetimi" },
  { id: "ccpa", ad: "CCPA ve CPRA", alt: "Kaliforniya: bilme, silme, satışı ve paylaşımı reddetme hakkı" },
  { id: "pipeda", ad: "PIPEDA", alt: "Kanada: anlamlı onay ve erişim hakkı" },
  { id: "kvkk", ad: "KVKK", alt: "Türkiye: aydınlatma metni, açık rıza, VERBİS" },
  { id: "lgpd", ad: "LGPD", alt: "Brezilya" }, { id: "app", ad: "Australian Privacy Principles", alt: "Avustralya" }, { id: "dpdp", ad: "DPDP Act", alt: "Hindistan" },
  { id: "pdpa", ad: "PDPA", alt: "Singapur, Tayland, Malezya" }, { id: "popia", ad: "POPIA", alt: "Güney Afrika" }, { id: "appi", ad: "APPI", alt: "Japonya" }, { id: "fadp", ad: "nFADP", alt: "İsviçre" },
  { id: "genel", ad: "Genel", alt: "Belirli bir yasa seçilmedi; iyi uygulama ilkeleri" },
];
/** Çerez onay biçimi: önceden onay (opt-in, AB ve İngiltere), reddetme hakkı (opt-out, ABD), yalnız bildirim. */
export type CerezBicimi = "onay" | "ret" | "bildirim";
export function cerezBicimi(g: Gizlilik): CerezBicimi {
  if (g === "gdpr" || g === "ukgdpr" || g === "kvkk" || g === "fadp" || g === "lgpd") return "onay";
  if (g === "ccpa") return "ret";
  return "bildirim";
}

/* ───────── saat dilimi ───────── */
export const SAAT_DILIMLERI_TEMEL = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Phoenix", "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu",
  "America/Toronto", "America/Vancouver", "America/Halifax", "America/Mexico_City", "America/Sao_Paulo", "America/Buenos_Aires", "America/Bogota",
  "Europe/London", "Europe/Dublin", "Europe/Lisbon", "Europe/Paris", "Europe/Berlin", "Europe/Madrid", "Europe/Rome", "Europe/Amsterdam", "Europe/Brussels",
  "Europe/Zurich", "Europe/Vienna", "Europe/Stockholm", "Europe/Oslo", "Europe/Copenhagen", "Europe/Helsinki", "Europe/Warsaw", "Europe/Prague", "Europe/Athens",
  "Europe/Bucharest", "Europe/Istanbul", "Europe/Kyiv", "Asia/Dubai", "Asia/Riyadh", "Asia/Jerusalem", "Asia/Baku", "Asia/Kolkata", "Asia/Singapore",
  "Asia/Hong_Kong", "Asia/Shanghai", "Asia/Tokyo", "Asia/Seoul", "Asia/Bangkok", "Asia/Jakarta", "Asia/Manila", "Australia/Sydney", "Australia/Melbourne",
  "Australia/Brisbane", "Australia/Perth", "Pacific/Auckland", "Africa/Johannesburg", "Africa/Cairo", "Africa/Lagos", "Africa/Nairobi",
];
const bicimci = new Map<string, Intl.DateTimeFormat>();
export function dilimGecerli(tz: unknown): tz is string {
  if (typeof tz !== "string" || !tz || tz.length > 64) return false;
  try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; } catch { return false; }
}
/** Saat diliminin o andaki UTC farkı (ms; yaz saati dahil). */
export function dilimFark(z: number, tz: string): number {
  let f = bicimci.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone: dilimGecerli(tz) ? tz : "UTC", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    bicimci.set(tz, f);
  }
  const p: Record<string, number> = {};
  for (const x of f.formatToParts(new Date(z))) if (x.type !== "literal") p[x.type] = Number(x.value);
  const yerel = Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second);
  return yerel - Math.floor(z / 1000) * 1000;
}
/** epoch ms → saat diliminde "YYYY-MM-DD". */
export const dilimTarih = (z: number, tz: string) => new Date(z + dilimFark(z, tz)).toISOString().slice(0, 10);
/** epoch ms → saat diliminde "HH:MM". */
export const dilimSaat = (z: number, tz: string) => new Date(z + dilimFark(z, tz)).toISOString().slice(11, 16);
/** Saat dilimindeki "YYYY-MM-DD" + "HH:MM" → epoch ms (yaz saati geçişinde bir kez düzeltilir). */
export function dilimZaman(tarih: string, saat: string, tz: string): number {
  const t = Date.parse(`${tarih}T${saat}:00Z`);
  if (!Number.isFinite(t)) return NaN;
  let z = t - dilimFark(t, tz);
  z = t - dilimFark(z, tz);
  return z;
}
/** "YYYY-MM-DD" haftanın hangi günü (Pazartesi 0); saat diliminden bağımsız. */
export const tarihGunu = (tarih: string) => (new Date(`${tarih}T12:00:00Z`).getUTCDay() + 6) % 7;
/** "UTC+03:00" biçiminde fark. */
export function dilimEtiketi(tz: string, z = Date.now()): string {
  const d = Math.round(dilimFark(z, tz) / 60000), i = d < 0 ? "-" : "+", m = Math.abs(d);
  return `UTC${i}${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
export function saatDilimleri(): string[] {
  try { const l = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone"); if (l?.length) return l.includes("UTC") ? l : ["UTC", ...l]; } catch { /* eski tarayıcı */ }
  return SAAT_DILIMLERI_TEMEL;
}
/** Kayıtlı saat dilimi; yoksa ülkenin varsayılanı; o da yoksa UTC. */
export const dilimSec = (tz: unknown, ulke?: string) => (dilimGecerli(tz) ? tz : ulkeBul(ulke)?.dilim ?? "UTC");
/** Saat diliminde okunur tarih ve saat (metin Türkçe; saat dilimi işletmeninki). */
export const dilimYaz = (z: number, tz: string, secenek: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric", weekday: "long", hour: "2-digit", minute: "2-digit" }, yerel = "tr-TR") =>
  new Date(z).toLocaleString(yerel, { timeZone: dilimGecerli(tz) ? tz : "UTC", ...secenek });
