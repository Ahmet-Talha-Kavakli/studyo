/**
 * Dönüştür adımı (istemci ve sunucu ortak, yan etkisiz): metin, sayı, Türkçe tarih ve JSON işlemleri.
 * Tarihler Türkiye saatiyle (UTC+3) okunur ve yazılır.
 */
export type DonusturGrup = "metin" | "sayi" | "tarih" | "json" | "liste" | "yardimci";
export type DonusturIslem = { id: string; ad: string; p1?: string; p2?: string; p1Yer?: string; p2Yer?: string; secenek1?: { id: string; ad: string }[]; secenek2?: { id: string; ad: string }[] };

export const TARIH_BICIMLERI: { id: string; ad: string; ornek: string }[] = [
  { id: "uzun", ad: "Gün ay yıl", ornek: "5 Kasım 2026" },
  { id: "kisa", ad: "Noktalı", ornek: "05.11.2026" },
  { id: "gunlu", ad: "Gün adıyla", ornek: "5 Kasım 2026 Perşembe" },
  { id: "saatli", ad: "Saatle", ornek: "5 Kasım 2026 14:30" },
  { id: "kisa-saatli", ad: "Noktalı, saatle", ornek: "05.11.2026 14:30" },
  { id: "iso", ad: "ISO 8601", ornek: "2026-11-05T11:30:00.000Z" },
  { id: "ozel", ad: "Özel", ornek: "GG.AA.YYYY SS:dd" },
];
const BIRIMLER = [{ id: "dakika", ad: "dakika" }, { id: "saat", ad: "saat" }, { id: "gun", ad: "gün" }, { id: "hafta", ad: "hafta" }, { id: "ay", ad: "ay" }, { id: "yil", ad: "yıl" }];

export const DONUSTUR_ISLEMLERI: Record<DonusturGrup, DonusturIslem[]> = {
  metin: [
    { id: "kirp", ad: "Baştaki ve sondaki boşlukları sil" },
    { id: "buyuk", ad: "Büyük harf (Türkçe)" }, { id: "kucuk", ad: "Küçük harf (Türkçe)" }, { id: "baslik", ad: "Her kelimenin ilk harfi büyük" },
    { id: "degistir", ad: "Bul ve değiştir", p1: "Bul", p2: "Yerine", p1Yer: "eski", p2Yer: "yeni" },
    { id: "bol", ad: "Listeye böl", p1: "Ayraç", p1Yer: "virgül için , yaz; satır için boş bırak" },
    { id: "kisalt", ad: "Kısalt", p1: "En çok karakter", p1Yer: "160" },
    { id: "eposta", ad: "E-posta adresini çıkar" }, { id: "url", ad: "Bağlantıyı çıkar" }, { id: "telefon", ad: "Telefon numarasını çıkar" }, { id: "sayi", ad: "Sayıyı çıkar" },
    { id: "html-temizle", ad: "HTML etiketlerini sil" }, { id: "url-dostu", ad: "Adres dostu yap" },
    { id: "desen", ad: "Düzenli ifadeyle çıkar", p1: "Düzenli ifade", p1Yer: "[A-Z]{2}\\d{6}" },
    { id: "say", ad: "Karakter ve kelime say" },
  ],
  sayi: [
    { id: "tl", ad: "Türk lirası biçimi", p1: "Kuruş basamağı", p1Yer: "2" },
    { id: "bicim", ad: "Binlik ayraçlı yaz", p1: "Ondalık basamak", p1Yer: "0" },
    { id: "yuvarla", ad: "Yuvarla", p1: "Ondalık basamak", p1Yer: "0" },
    { id: "topla", ad: "Ekle", p1: "Eklenecek", p1Yer: "10" }, { id: "cikar", ad: "Çıkar", p1: "Çıkarılacak", p1Yer: "10" },
    { id: "carp", ad: "Çarp", p1: "Çarpan", p1Yer: "1.2" }, { id: "bol", ad: "Böl", p1: "Bölen", p1Yer: "100" },
    { id: "yuzde", ad: "Yüzdesini al", p1: "Yüzde", p1Yer: "18" },
    { id: "metinden", ad: "Türkçe yazılmış sayıyı oku" },
  ],
  tarih: [
    { id: "bicim", ad: "Türkçe biçimle", p1: "Biçim", secenek1: TARIH_BICIMLERI.map((b) => ({ id: b.id, ad: `${b.ad}: ${b.ornek}` })), p2: "Özel biçim", p2Yer: "GG.AA.YYYY SS:dd" },
    { id: "ekle", ad: "Süre ekle ya da çıkar", p1: "Miktar (çıkarmak için eksi)", p1Yer: "3", p2: "Birim", secenek2: BIRIMLER },
    { id: "fark", ad: "İki tarih arasındaki fark", p1: "Diğer tarih", p1Yer: "{{simdi}}", p2: "Birim", secenek2: BIRIMLER },
    { id: "gun-adi", ad: "Haftanın günü" },
    { id: "coz", ad: "Metinden tarih oku" },
  ],
  json: [
    { id: "ayristir", ad: "Metni JSON olarak oku" }, { id: "metne", ad: "JSON'u metne çevir" },
    { id: "al", ad: "Alan al", p1: "Alan yolu", p1Yer: "musteri.ad" },
    { id: "anahtarlar", ad: "Alan adlarını listele" }, { id: "uzunluk", ad: "Liste uzunluğu" },
    { id: "ilk", ad: "İlk öğe" }, { id: "son", ad: "Son öğe" },
    { id: "birlestir", ad: "Listeyi metinle birleştir", p1: "Ayraç", p1Yer: ", " },
    { id: "ayarla", ad: "Alanları ayarla (yeni nesne kur)" },
    { id: "nesneBirlestir", ad: "İki nesneyi birleştir", p1: "Eklenecek nesne", p1Yer: "/ ile ikinci nesne" },
    { id: "alanSec", ad: "Yalnız şu alanları bırak", p1: "Alanlar, virgülle", p1Yer: "ad, eposta, tutar" },
    { id: "alanSil", ad: "Şu alanları sil", p1: "Alanlar, virgülle", p1Yer: "sifre, kartNo" },
  ],
  liste: [
    { id: "sirala", ad: "Sırala", p1: "Alan (nesne listesinde)", p1Yer: "tutar", p2: "Yön", secenek2: [{ id: "artan", ad: "Küçükten büyüğe" }, { id: "azalan", ad: "Büyükten küçüğe" }] },
    { id: "suz", ad: "Süz: alanı şu değer olanlar", p1: "Alan", p1Yer: "durum", p2: "Değer (boşsa alanı dolu olanlar)", p2Yer: "odendi" },
    { id: "bul", ad: "İlk eşleşeni bul", p1: "Alan", p1Yer: "eposta", p2: "Değer", p2Yer: "/ ile aranan" },
    { id: "tekil", ad: "Tekrarları sil", p1: "Alan (isteğe bağlı)", p1Yer: "eposta" },
    { id: "alan", ad: "Her öğeden bir alanı çek", p1: "Alan yolu", p1Yer: "urun.ad" },
    { id: "ozetle", ad: "Sayıları özetle (toplam, ortalama)", p1: "Alan (nesne listesinde)", p1Yer: "tutar" },
    { id: "grupla", ad: "Grupla ve say", p1: "Gruplanacak alan", p1Yer: "sehir", p2: "Toplanacak sayı alanı (isteğe bağlı)", p2Yer: "tutar" },
    { id: "parcala", ad: "Parçalara böl", p1: "Parça boyu", p1Yer: "10" },
    { id: "ilkN", ad: "İlk N öğe", p1: "Kaç öğe", p1Yer: "5" },
    { id: "ters", ad: "Ters çevir" },
    { id: "duzlestir", ad: "İç içe listeleri düzleştir" },
    { id: "ekle", ad: "İki listeyi uç uca ekle", p1: "İkinci liste", p1Yer: "/ ile ikinci liste" },
    { id: "eslestir", ad: "İki listeyi alana göre birleştir", p1: "İkinci liste", p1Yer: "/ ile ikinci liste", p2: "Eşleşme alanı", p2Yer: "eposta" },
  ],
  yardimci: [
    { id: "arama", ad: "Arama tablosu", p1: "Tablo: her satıra anahtar: değer", p1Yer: "TR: Türkiye\nDE: Almanya", p2: "Bulunamazsa", p2Yer: "Bilinmiyor" },
    { id: "sec", ad: "Listeden seç", p1: "Hangisi", secenek1: [{ id: "ilk", ad: "İlk" }, { id: "son", ad: "Son" }, { id: "rastgele", ad: "Rastgele" }] },
    { id: "csvOku", ad: "CSV metnini tabloya çevir", p1: "Ayraç (boşsa kendisi bulur)", p1Yer: ";" },
    { id: "csvYaz", ad: "Listeyi CSV metnine çevir", p1: "Ayraç", p1Yer: "," },
    { id: "markdown", ad: "Markdown metnini HTML yap" },
    { id: "urlKodla", ad: "Adres için kodla" }, { id: "urlCoz", ad: "Adres kodunu çöz" },
    { id: "base64", ad: "Base64 kodla" }, { id: "base64Coz", ad: "Base64 çöz" },
    { id: "rastgele", ad: "Rastgele sayı", p1: "En küçük", p1Yer: "1", p2: "En büyük", p2Yer: "100" },
    { id: "kimlik", ad: "Benzersiz kimlik üret" },
  ],
};

const TR_AY = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const TR_GUN = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const TR = 3 * 3600_000;
const iki = (n: number) => String(n).padStart(2, "0");

/** Türkçe ya da ISO yazılmış sayıyı okur: "1.234,56", "1234.56", "₺1.234", "%18". */
export function sayiOku(v: unknown): number {
  if (typeof v === "number") return v;
  const s = String(v ?? "").replace(/[^\d,.\-]/g, "");
  if (!s) return NaN;
  if (s.includes(",") && s.lastIndexOf(",") > s.lastIndexOf(".")) return Number(s.replace(/\./g, "").replace(",", "."));
  if ((s.match(/\./g) ?? []).length > 1) return Number(s.replace(/\./g, ""));
  return Number(s.replace(/,/g, ""));
}

/** Tarih okur: ISO, zaman damgası, "05.11.2026 14:30", "5 Kasım 2026". Saat verilmemişse Türkiye saatiyle gece yarısı. */
export function tarihOku(v: unknown): number | null {
  if (typeof v === "number") return v < 1e11 ? v * 1000 : v;
  const s = String(v ?? "").trim();
  if (!s) return null;
  if (/^\d{9,13}$/.test(s)) { const n = Number(s); return n < 1e11 ? n * 1000 : n; }
  let m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:[ T](\d{1,2})[:.](\d{2}))?$/.exec(s);
  if (m) return Date.UTC(+m[3], +m[2] - 1, +m[1], +(m[4] ?? 0), +(m[5] ?? 0)) - TR;
  m = /^(\d{1,2})\s+([\p{L}]+)\s+(\d{4})(?:\s+[\p{L}]+)?(?:\s+(\d{1,2})[:.](\d{2}))?$/u.exec(s);
  if (m) { const ay = TR_AY.findIndex((a) => a.toLocaleLowerCase("tr") === m![2].toLocaleLowerCase("tr")); if (ay >= 0) return Date.UTC(+m[3], ay, +m[1], +(m[4] ?? 0), +(m[5] ?? 0)) - TR; }
  if (/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2})?)?$/.test(s)) { const [g, sa] = s.split(/[ T]/); const [y, a, gn] = g.split("-").map(Number); const [h, dk] = (sa ?? "00:00").split(":").map(Number); return Date.UTC(y, a - 1, gn, h, dk) - TR; }
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t;
}

export function tarihBicimle(t: number, bicim: string, ozel = ""): string {
  const d = new Date(t + TR);
  const G = d.getUTCDate(), A = d.getUTCMonth(), Y = d.getUTCFullYear(), S = d.getUTCHours(), D = d.getUTCMinutes();
  switch (bicim) {
    case "kisa": return `${iki(G)}.${iki(A + 1)}.${Y}`;
    case "gunlu": return `${G} ${TR_AY[A]} ${Y} ${TR_GUN[d.getUTCDay()]}`;
    case "saatli": return `${G} ${TR_AY[A]} ${Y} ${iki(S)}:${iki(D)}`;
    case "kisa-saatli": return `${iki(G)}.${iki(A + 1)}.${Y} ${iki(S)}:${iki(D)}`;
    case "iso": return new Date(t).toISOString();
    case "ozel": return (ozel || "GG.AA.YYYY").replace(/YYYY|AAAA|AA|GGGG|GG|SS|dd|ss/g, (k) => ({ YYYY: String(Y), AAAA: TR_AY[A], AA: iki(A + 1), GGGG: TR_GUN[d.getUTCDay()], GG: iki(G), SS: iki(S), dd: iki(D), ss: iki(d.getUTCSeconds()) } as Record<string, string>)[k]);
    default: return `${G} ${TR_AY[A]} ${Y}`;
  }
}

function sureEkle(t: number, miktar: number, birim: string): number {
  if (birim === "ay" || birim === "yil") { const d = new Date(t + TR); d.setUTCMonth(d.getUTCMonth() + miktar * (birim === "yil" ? 12 : 1)); return d.getTime() - TR; }
  const ms = { dakika: 60_000, saat: 3_600_000, gun: 86_400_000, hafta: 604_800_000 }[birim] ?? 86_400_000;
  return t + miktar * ms;
}

const json = (v: unknown): unknown => { if (typeof v !== "string") return v; try { return JSON.parse(v); } catch { return v; } };

/** İşlemi uygular; sonuç { sonuc } (bazılarında ek alanlar). Hata metinleri kullanıcıya gösterilir. */
export function donustur(grup: string, islem: string, deger: unknown, p1 = "", p2 = ""): Record<string, unknown> {
  const s = typeof deger === "string" ? deger : deger === undefined || deger === null ? "" : JSON.stringify(deger);
  if (grup === "metin") {
    switch (islem) {
      case "kirp": return { sonuc: s.trim() };
      case "buyuk": return { sonuc: s.toLocaleUpperCase("tr") };
      case "kucuk": return { sonuc: s.toLocaleLowerCase("tr") };
      case "baslik": return { sonuc: s.toLocaleLowerCase("tr").replace(/(^|[\s(-])(\p{L})/gu, (_, a, b: string) => a + b.toLocaleUpperCase("tr")) };
      case "degistir": return { sonuc: p1 ? s.split(p1).join(p2) : s };
      case "bol": { const l = (p1 ? s.split(p1) : s.split(/\r?\n/)).map((x) => x.trim()).filter(Boolean); return { sonuc: l, sayi: l.length }; }
      case "kisalt": { const n = Math.max(1, Number(p1) || 160); return { sonuc: s.length > n ? `${s.slice(0, n).trimEnd()}…` : s }; }
      case "eposta": { const l = s.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) ?? []; return { sonuc: l[0] ?? "", hepsi: l }; }
      case "url": { const l = s.match(/https?:\/\/[^\s"'<>)]+/g) ?? []; return { sonuc: l[0] ?? "", hepsi: l }; }
      case "telefon": { const l = (s.match(/(\+?90[\s-]?)?\(?0?5\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}|\+?\d[\d\s-]{8,14}\d/g) ?? []).map((x) => x.trim()); return { sonuc: l[0] ?? "", hepsi: l }; }
      case "sayi": { const l = s.match(/-?\d[\d.,]*/g) ?? []; return { sonuc: l.length ? sayiOku(l[0]) : null, hepsi: l.map(sayiOku) }; }
      case "html-temizle": return { sonuc: s.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim() };
      case "url-dostu": return { sonuc: s.toLocaleLowerCase("tr").replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") };
      case "desen": {
        let r: RegExp;
        try { r = new RegExp(p1, "gu"); } catch { throw new Error("Düzenli ifade geçersiz."); }
        const l = [...s.matchAll(r)].slice(0, 200).map((m) => m[1] ?? m[0]);
        return { sonuc: l[0] ?? "", hepsi: l };
      }
      case "say": return { sonuc: s.length, karakter: s.length, kelime: (s.trim().match(/\S+/g) ?? []).length, satir: s ? s.split(/\r?\n/).length : 0 };
    }
  }
  if (grup === "sayi") {
    const n = sayiOku(deger), a = sayiOku(p1);
    if (Number.isNaN(n)) throw new Error(`"${s.slice(0, 40)}" bir sayı değil.`);
    const nf = (b: number) => new Intl.NumberFormat("tr-TR", { minimumFractionDigits: b, maximumFractionDigits: b });
    switch (islem) {
      case "tl": { const b = Math.max(0, Math.min(4, Number.isNaN(a) ? 2 : a)); return { sonuc: `${nf(b).format(n)} TL`, sayi: n }; }
      case "bicim": return { sonuc: nf(Math.max(0, Math.min(6, Number.isNaN(a) ? 0 : a))).format(n), sayi: n };
      case "yuvarla": { const b = Math.max(0, Math.min(8, Number.isNaN(a) ? 0 : a)); return { sonuc: Math.round(n * 10 ** b) / 10 ** b }; }
      case "topla": return { sonuc: n + (Number.isNaN(a) ? 0 : a) };
      case "cikar": return { sonuc: n - (Number.isNaN(a) ? 0 : a) };
      case "carp": return { sonuc: n * (Number.isNaN(a) ? 1 : a) };
      case "bol": if (!a) throw new Error("Sıfıra bölünemez."); return { sonuc: n / a };
      case "yuzde": return { sonuc: (n * (Number.isNaN(a) ? 0 : a)) / 100 };
      case "metinden": return { sonuc: n };
    }
  }
  if (grup === "tarih") {
    const t = tarihOku(deger);
    if (t === null) throw new Error(`"${s.slice(0, 40)}" tarih olarak okunamadı.`);
    switch (islem) {
      case "bicim": return { sonuc: tarihBicimle(t, p1 || "uzun", p2), iso: new Date(t).toISOString() };
      case "ekle": { const y = sureEkle(t, Number(p1) || 0, p2 || "gun"); return { sonuc: new Date(y).toISOString(), metin: tarihBicimle(y, "saatli") }; }
      case "fark": {
        const d = tarihOku(p1 || Date.now());
        if (d === null) throw new Error("Diğer tarih okunamadı.");
        const ms = { dakika: 60_000, saat: 3_600_000, gun: 86_400_000, hafta: 604_800_000, ay: 2_629_800_000, yil: 31_557_600_000 }[p2 || "gun"] ?? 86_400_000;
        return { sonuc: Math.floor((d - t) / ms), birim: p2 || "gun" };
      }
      case "gun-adi": return { sonuc: TR_GUN[new Date(t + TR).getUTCDay()] };
      case "coz": return { sonuc: new Date(t).toISOString(), metin: tarihBicimle(t, "saatli") };
    }
  }
  if (grup === "json") {
    const v = json(deger);
    switch (islem) {
      case "ayristir": if (typeof deger === "string") { try { return { sonuc: JSON.parse(deger) }; } catch { throw new Error("Metin geçerli JSON değil."); } } return { sonuc: deger ?? null };
      case "metne": return { sonuc: typeof deger === "string" ? deger : JSON.stringify(deger ?? null) };
      case "al": { let x: unknown = v; for (const p of p1.split(".").filter(Boolean)) { x = Array.isArray(x) ? x[Number(p)] : x && typeof x === "object" ? (x as Record<string, unknown>)[p] : undefined; } return { sonuc: x ?? null }; }
      case "anahtarlar": return { sonuc: v && typeof v === "object" ? Object.keys(v as object) : [] };
      case "uzunluk": return { sonuc: Array.isArray(v) ? v.length : typeof v === "string" ? v.length : v && typeof v === "object" ? Object.keys(v as object).length : 0 };
      case "ilk": return { sonuc: Array.isArray(v) ? v[0] ?? null : null };
      case "son": return { sonuc: Array.isArray(v) ? v.at(-1) ?? null : null };
      case "birlestir": return { sonuc: Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(p1 || ", ") : s };
    }
  }
  if (grup === "json") {
    const v = json(deger);
    const o = v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
    const adlar = p1.split(",").map((x) => x.trim()).filter(Boolean);
    switch (islem) {
      case "nesneBirlestir": { const y = json(p1); return { sonuc: { ...o, ...(y && typeof y === "object" && !Array.isArray(y) ? (y as object) : {}) } }; }
      case "alanSec": return { sonuc: Object.fromEntries(adlar.filter((k) => k in o).map((k) => [k, o[k]])) };
      case "alanSil": return { sonuc: Object.fromEntries(Object.entries(o).filter(([k]) => !adlar.includes(k))) };
    }
  }
  if (grup === "liste") return listeIslem(islem, deger, p1, p2);
  if (grup === "yardimci") return yardimciIslem(islem, deger, s, p1, p2);
  throw new Error("Dönüştürme işlemi seçilmedi.");
}

/* ── Liste işlemleri (Make aggregator, n8n Sort, Filter, Aggregate, Summarize, Merge) ── */
const alanOku = (x: unknown, yol: string): unknown => { let v: unknown = x; for (const p of yol.split(".").filter(Boolean)) v = Array.isArray(v) ? v[Number(p)] : v && typeof v === "object" ? (v as Record<string, unknown>)[p] : undefined; return v; };
const metinOf = (v: unknown) => (v === undefined || v === null ? "" : typeof v === "string" ? v : JSON.stringify(v));
function listeAl(v: unknown, ad = "Değer"): unknown[] {
  const x = json(v);
  if (Array.isArray(x)) return x;
  if (x === undefined || x === null || x === "") return [];
  if (x && typeof x === "object") { const l = Object.values(x as object).find((z) => Array.isArray(z)); if (l) return l as unknown[]; }
  throw new Error(`${ad} bir liste değil. / ile bir liste seç (ör. Kayıt bul adımının kayitlar alanı).`);
}
const kiyas = (a: unknown, b: unknown) => (typeof a === "number" && typeof b === "number" ? a - b : metinOf(a).localeCompare(metinOf(b), "tr", { numeric: true }));
function listeIslem(islem: string, deger: unknown, p1: string, p2: string): Record<string, unknown> {
  const l = listeAl(deger);
  const yol = p1.trim();
  const al = (x: unknown) => (yol ? alanOku(x, yol) : x);
  switch (islem) {
    case "sirala": { const y = p2 === "azalan" ? -1 : 1; const o = [...l].sort((a, b) => kiyas(al(a), al(b)) * y); return { sonuc: o, sayi: o.length }; }
    case "suz": { const d = p2.trim().toLocaleLowerCase("tr"); const o = l.filter((x) => { const v = al(x); return d ? metinOf(v).trim().toLocaleLowerCase("tr") === d : v !== undefined && v !== null && v !== "" && v !== false; }); return { sonuc: o, sayi: o.length, elenen: l.length - o.length }; }
    case "bul": { const d = p2.trim().toLocaleLowerCase("tr"); const i = l.findIndex((x) => metinOf(al(x)).trim().toLocaleLowerCase("tr") === d); return { sonuc: i >= 0 ? l[i] : null, bulundu: i >= 0, sira: i >= 0 ? i + 1 : null }; }
    case "tekil": { const g = new Set<string>(); const o = l.filter((x) => { const k = metinOf(al(x)); if (g.has(k)) return false; g.add(k); return true; }); return { sonuc: o, sayi: o.length, silinen: l.length - o.length }; }
    case "alan": return { sonuc: l.map((x) => alanOku(x, yol) ?? null), sayi: l.length };
    case "ozetle": {
      const n = l.map((x) => sayiOku(al(x))).filter((x) => Number.isFinite(x));
      const t = n.reduce((a, b) => a + b, 0);
      return { sonuc: t, toplam: t, ortalama: n.length ? t / n.length : 0, enKucuk: n.length ? Math.min(...n) : null, enBuyuk: n.length ? Math.max(...n) : null, sayi: n.length, oge: l.length };
    }
    case "grupla": {
      if (!yol) throw new Error("Gruplanacak alanı yaz.");
      const m = new Map<string, unknown[]>();
      for (const x of l) { const k = metinOf(alanOku(x, yol)) || "boş"; (m.get(k) ?? m.set(k, []).get(k)!).push(x); }
      const liste = [...m.entries()].map(([grup, ogeler]) => ({ grup, sayi: ogeler.length, ...(p2.trim() ? { toplam: ogeler.reduce<number>((a, x) => a + (Number.isFinite(sayiOku(alanOku(x, p2.trim()))) ? sayiOku(alanOku(x, p2.trim())) : 0), 0) } : {}) })).sort((a, b) => b.sayi - a.sayi);
      return { sonuc: liste, gruplar: Object.fromEntries(m), sayilar: Object.fromEntries(liste.map((x) => [x.grup, x.sayi])), grupSayisi: liste.length };
    }
    case "parcala": { const n = Math.max(1, Math.min(1000, Number(p1) || 10)); const o: unknown[][] = []; for (let i = 0; i < l.length; i += n) o.push(l.slice(i, i + n)); return { sonuc: o, parca: o.length }; }
    case "ilkN": { const n = Math.max(0, Number(p1) || 5); return { sonuc: l.slice(0, n), sayi: Math.min(n, l.length) }; }
    case "ters": return { sonuc: [...l].reverse() };
    case "duzlestir": { const o = l.flatMap((x) => (Array.isArray(x) ? x : [x])); return { sonuc: o, sayi: o.length }; }
    case "ekle": { const o = [...l, ...listeAl(p1, "İkinci liste")]; return { sonuc: o, sayi: o.length }; }
    case "eslestir": {
      const k = p2.trim();
      if (!k) throw new Error("Eşleşme alanını yaz.");
      const ikinci = listeAl(p1, "İkinci liste");
      const harita = new Map(ikinci.map((x) => [metinOf(alanOku(x, k)).trim().toLocaleLowerCase("tr"), x]));
      const eslesen: unknown[] = [], eslesmeyen: unknown[] = [];
      for (const x of l) { const y = harita.get(metinOf(alanOku(x, k)).trim().toLocaleLowerCase("tr")); if (y && typeof y === "object" && x && typeof x === "object") eslesen.push({ ...(y as object), ...(x as object) }); else eslesmeyen.push(x); }
      return { sonuc: eslesen, eslesen: eslesen.length, eslesmeyen, eslesmeyenSayi: eslesmeyen.length };
    }
  }
  throw new Error("Liste işlemi seçilmedi.");
}

/* ── Yardımcılar (Zapier Formatter Utilities) ── */
const b64 = (s: string) => { const b = new TextEncoder().encode(s); let x = ""; for (const c of b) x += String.fromCharCode(c); return btoa(x); };
function csvOku(s: string, ayrac: string): Record<string, string>[] {
  const a = ayrac || ((s.split(/\r?\n/)[0].match(/;/g)?.length ?? 0) > (s.split(/\r?\n/)[0].match(/,/g)?.length ?? 0) ? ";" : s.includes("\t") ? "\t" : ",");
  const satirlar: string[][] = [];
  let alan = "", satir: string[] = [], tirnak = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (tirnak) { if (c === "\"" && s[i + 1] === "\"") { alan += "\""; i++; } else if (c === "\"") tirnak = false; else alan += c; continue; }
    if (c === "\"") tirnak = true;
    else if (c === a) { satir.push(alan); alan = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && s[i + 1] === "\n") i++; satir.push(alan); satirlar.push(satir); satir = []; alan = ""; }
    else alan += c;
  }
  if (alan || satir.length) { satir.push(alan); satirlar.push(satir); }
  const bas = (satirlar.shift() ?? []).map((x, i) => x.trim() || `sutun${i + 1}`);
  return satirlar.filter((x) => x.some((y) => y.trim())).slice(0, 5000).map((x) => Object.fromEntries(bas.map((b, i) => [b, (x[i] ?? "").trim()])));
}
function csvYaz(l: unknown[], a: string): string {
  const ay = a || ",";
  const nesneler = l.map((x) => (x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : { deger: x }));
  const bas = [...new Set(nesneler.flatMap((x) => Object.keys(x)))];
  const h = (v: unknown) => { const t = metinOf(v); return /["\n\r]/.test(t) || t.includes(ay) ? `"${t.replace(/"/g, "\"\"")}"` : t; };
  return [bas.map(h).join(ay), ...nesneler.map((x) => bas.map((b) => h(x[b])).join(ay))].join("\n");
}
function markdownHtml(s: string): string {
  const k = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const satir = (t: string) => k(t).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, "<a href=\"$2\">$1</a>");
  return s.replace(/\r/g, "").split(/\n{2,}/).map((b) => {
    const l = b.split("\n");
    const h = /^(#{1,6})\s+(.*)$/.exec(b);
    if (h && l.length === 1) return `<h${h[1].length}>${satir(h[2])}</h${h[1].length}>`;
    if (l.every((x) => /^\s*[-*]\s/.test(x))) return `<ul>${l.map((x) => `<li>${satir(x.replace(/^\s*[-*]\s/, ""))}</li>`).join("")}</ul>`;
    if (l.every((x) => /^\s*\d+[.)]\s/.test(x))) return `<ol>${l.map((x) => `<li>${satir(x.replace(/^\s*\d+[.)]\s/, ""))}</li>`).join("")}</ol>`;
    return `<p>${l.map(satir).join("<br>")}</p>`;
  }).join("\n");
}
function yardimciIslem(islem: string, deger: unknown, s: string, p1: string, p2: string): Record<string, unknown> {
  switch (islem) {
    case "arama": {
      const tablo = new Map(p1.split(/\r?\n/).map((x) => { const i = x.indexOf(":"); return i > 0 ? [x.slice(0, i).trim().toLocaleLowerCase("tr"), x.slice(i + 1).trim()] as const : null; }).filter((x): x is readonly [string, string] => !!x));
      const k = s.trim().toLocaleLowerCase("tr");
      return { sonuc: tablo.has(k) ? tablo.get(k)! : p2, bulundu: tablo.has(k) };
    }
    case "sec": { const l = listeAl(deger); const i = p1 === "son" ? l.length - 1 : p1 === "rastgele" ? Math.floor(Math.random() * l.length) : 0; return { sonuc: l[i] ?? null, sira: l.length ? i + 1 : null }; }
    case "csvOku": { const l = csvOku(s, p1 === "\\t" ? "\t" : p1.trim()); return { sonuc: l, sayi: l.length, sutunlar: l[0] ? Object.keys(l[0]) : [] }; }
    case "csvYaz": { const l = listeAl(deger); return { sonuc: csvYaz(l, p1.trim()), sayi: l.length }; }
    case "markdown": return { sonuc: markdownHtml(s) };
    case "urlKodla": return { sonuc: encodeURIComponent(s) };
    case "urlCoz": try { return { sonuc: decodeURIComponent(s) }; } catch { throw new Error("Adres kodu çözülemedi."); }
    case "base64": return { sonuc: b64(s) };
    case "base64Coz": try { const x = atob(s.trim()); return { sonuc: new TextDecoder().decode(Uint8Array.from(x, (c) => c.charCodeAt(0))) }; } catch { throw new Error("Metin geçerli Base64 değil."); }
    case "rastgele": { const a = Math.ceil(Number(p1) || 1), b = Math.floor(Number(p2) || 100); if (b < a) throw new Error("En büyük değer en küçükten küçük olamaz."); return { sonuc: a + Math.floor(Math.random() * (b - a + 1)) }; }
    case "kimlik": return { sonuc: crypto.randomUUID() };
  }
  throw new Error("Yardımcı işlem seçilmedi.");
}
