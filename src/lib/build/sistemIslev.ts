/**
 * Şablon işlevleri (istemci ve sunucu ortak, yan etkisiz). Gönderme içinde dikey çizgiyle zincirlenir:
 *   {{tetik.ad | buyuk}}   {{tetik.aciklama | kisalt(120)}}   {{tetik.tarih | tarih("kisa-saatli")}}
 *   {{adim.s1.kayitlar | alan("tutar") | toplam | tl}}   {{tetik.not | varsayilan("Not yok")}}
 * Bağımsız değişkenler virgülle ayrılır; metinler çift tırnak içinde, sayılar tırnaksız yazılır.
 * Hatalı kullanım SablonHatasi fırlatır (adım bu iletiyle başarısız olur, önizleme hatayı gösterir).
 */
import { TARIH_BICIMLERI, sayiOku, tarihBicimle, tarihOku } from "./sistemDonustur";

export class SablonHatasi extends Error { constructor(m: string) { super(m); this.name = "SablonHatasi"; } }
export type IslevGrubu = "Metin" | "Sayı" | "Tarih" | "Liste" | "Mantık" | "Kodlama";
export type IslevArg = { ad: string; yer?: string; secenek?: { id: string; ad: string }[]; varsayilan?: string; istege?: boolean };
export type Islev = { ad: string; etiket: string; grup: IslevGrubu; aciklama: string; arg?: IslevArg[]; f: (v: unknown, a: string[]) => unknown };
export type IslevCagrisi = { ad: string; args: string[] };

const metin = (v: unknown) => (v === undefined || v === null ? "" : typeof v === "string" ? v : JSON.stringify(v));
const jsonDene = (v: unknown): unknown => { if (typeof v !== "string" || !/^\s*[[{]/.test(v)) return v; try { return JSON.parse(v); } catch { return v; } };
const liste = (v: unknown, ad: string): unknown[] => {
  const x = jsonDene(v);
  if (Array.isArray(x)) return x;
  if (x === undefined || x === null || x === "") return [];
  if (typeof x === "string") return x.split(/\r?\n|,/).map((z) => z.trim()).filter(Boolean);
  throw new SablonHatasi(`${ad} bir liste bekler; gelen değer liste değil.`);
};
const sayi = (v: unknown, ad: string) => { const n = sayiOku(v); if (!Number.isFinite(n)) throw new SablonHatasi(`${ad}: "${metin(v).slice(0, 40)}" bir sayı değil.`); return n; };
const argSayi = (a: string | undefined, v: number) => { const n = Number(a); return a === undefined || a === "" || !Number.isFinite(n) ? v : n; };
const tarih = (v: unknown, ad: string) => { const t = tarihOku(v); if (t === null) throw new SablonHatasi(`${ad}: "${metin(v).slice(0, 40)}" tarih olarak okunamadı.`); return t; };
const bosMu = (v: unknown) => v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length) || (typeof v === "object" && v !== null && !Array.isArray(v) && !Object.keys(v).length);
const dogruMu = (v: unknown) => !bosMu(v) && v !== false && !/^(false|0|hayır|hayir|yanlış|yanlis|no|off)$/i.test(String(v).trim());
const nf = (b: number) => new Intl.NumberFormat("tr-TR", { minimumFractionDigits: b, maximumFractionDigits: b });
const alanOku = (o: unknown, yol: string) => { let x: unknown = jsonDene(o); for (const p of yol.split(".").filter(Boolean)) { x = Array.isArray(x) ? x[Number(p)] : x && typeof x === "object" ? (x as Record<string, unknown>)[p] : undefined; } return x; };
const sayilar = (v: unknown, ad: string) => liste(v, ad).map((z) => sayiOku(z)).filter((z) => Number.isFinite(z));
const karsilastir = (x: unknown, y: unknown) => (typeof x === "number" && typeof y === "number" ? x - y : metin(x).localeCompare(metin(y), "tr", { numeric: true }));
const b64 = (s: string) => { const b = new TextEncoder().encode(s); let x = ""; for (const c of b) x += String.fromCharCode(c); return btoa(x); };
const b64Coz = (s: string) => { try { const x = atob(s.trim()); return new TextDecoder().decode(Uint8Array.from(x, (c) => c.charCodeAt(0))); } catch { throw new SablonHatasi("Base64 çözülemedi; metin geçerli Base64 değil."); } };
const BICIM_SECENEK = TARIH_BICIMLERI.filter((b) => b.id !== "ozel").map((b) => ({ id: b.id, ad: `${b.ad}: ${b.ornek}` }));

export const ISLEVLER: Islev[] = [
  /* Metin */
  { ad: "buyuk", etiket: "Büyük harf", grup: "Metin", aciklama: "Türkçe kurallarla büyük harfe çevirir", f: (v) => metin(v).toLocaleUpperCase("tr") },
  { ad: "kucuk", etiket: "Küçük harf", grup: "Metin", aciklama: "Türkçe kurallarla küçük harfe çevirir", f: (v) => metin(v).toLocaleLowerCase("tr") },
  { ad: "baslik", etiket: "Kelime başları büyük", grup: "Metin", aciklama: "ayşe yılmaz yerine Ayşe Yılmaz", f: (v) => metin(v).toLocaleLowerCase("tr").replace(/(^|[\s(-])(\p{L})/gu, (_, a, b: string) => a + b.toLocaleUpperCase("tr")) },
  { ad: "kirp", etiket: "Boşlukları kırp", grup: "Metin", aciklama: "Baştaki ve sondaki boşlukları siler", f: (v) => metin(v).trim() },
  { ad: "kisalt", etiket: "Kısalt", grup: "Metin", aciklama: "Uzunsa keser, sonuna üç nokta koyar", arg: [{ ad: "En çok karakter", yer: "100", varsayilan: "100" }], f: (v, a) => { const s = metin(v), n = Math.max(1, argSayi(a[0], 100)); return s.length > n ? `${s.slice(0, n).trimEnd()}…` : s; } },
  { ad: "degistir", etiket: "Bul ve değiştir", grup: "Metin", aciklama: "Geçen her yeri değiştirir", arg: [{ ad: "Bul", yer: "eski" }, { ad: "Yerine", yer: "yeni", istege: true }], f: (v, a) => (a[0] ? metin(v).split(a[0]).join(a[1] ?? "") : metin(v)) },
  { ad: "basina", etiket: "Başına ekle", grup: "Metin", aciklama: "Değer doluysa başına metin ekler", arg: [{ ad: "Eklenecek", yer: "Sayın " }], f: (v, a) => (bosMu(v) ? "" : `${a[0] ?? ""}${metin(v)}`) },
  { ad: "sonuna", etiket: "Sonuna ekle", grup: "Metin", aciklama: "Değer doluysa sonuna metin ekler", arg: [{ ad: "Eklenecek", yer: " TL" }], f: (v, a) => (bosMu(v) ? "" : `${metin(v)}${a[0] ?? ""}`) },
  { ad: "bol", etiket: "Listeye böl", grup: "Metin", aciklama: "Metni ayraçtan bölüp liste yapar", arg: [{ ad: "Ayraç", yer: ",", varsayilan: "," }], f: (v, a) => metin(v).split(a[0] || ",").map((z) => z.trim()).filter(Boolean) },
  { ad: "html_temizle", etiket: "HTML etiketlerini sil", grup: "Metin", aciklama: "Etiketleri atıp düz metin bırakır", f: (v) => metin(v).replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim() },
  { ad: "adres_dostu", etiket: "Adres dostu", grup: "Metin", aciklama: "Çay Bahçesi yerine cay-bahcesi", f: (v) => metin(v).toLocaleLowerCase("tr").replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") },
  { ad: "eposta", etiket: "E-postayı çıkar", grup: "Metin", aciklama: "Metindeki ilk e-posta adresi", f: (v) => (metin(v).match(/[\w.+-]+@[\w-]+\.[\w.-]+/) ?? [""])[0] },
  { ad: "uzunluk", etiket: "Uzunluk", grup: "Metin", aciklama: "Karakter ya da öğe sayısı", f: (v) => { const x = jsonDene(v); return Array.isArray(x) ? x.length : x && typeof x === "object" ? Object.keys(x).length : metin(x).length; } },
  /* Sayı */
  { ad: "sayi", etiket: "Sayıya çevir", grup: "Sayı", aciklama: "1.234,56 gibi Türkçe yazılmış sayıyı okur", f: (v) => sayi(v, "Sayıya çevir") },
  { ad: "yuvarla", etiket: "Yuvarla", grup: "Sayı", aciklama: "Verilen ondalık basamağa yuvarlar", arg: [{ ad: "Ondalık basamak", yer: "0", varsayilan: "0" }], f: (v, a) => { const b = Math.max(0, Math.min(8, argSayi(a[0], 0))); return Math.round(sayi(v, "Yuvarla") * 10 ** b) / 10 ** b; } },
  { ad: "tl", etiket: "Türk lirası", grup: "Sayı", aciklama: "1234.5 yerine 1.234,50 TL", arg: [{ ad: "Kuruş basamağı", yer: "2", varsayilan: "2" }], f: (v, a) => `${nf(Math.max(0, Math.min(4, argSayi(a[0], 2)))).format(sayi(v, "Türk lirası"))} TL` },
  { ad: "bicim", etiket: "Binlik ayraçlı", grup: "Sayı", aciklama: "1234567 yerine 1.234.567", arg: [{ ad: "Ondalık basamak", yer: "0", varsayilan: "0" }], f: (v, a) => nf(Math.max(0, Math.min(6, argSayi(a[0], 0)))).format(sayi(v, "Binlik ayraçlı")) },
  { ad: "arti", etiket: "Ekle", grup: "Sayı", aciklama: "Sayıya ekler", arg: [{ ad: "Eklenecek", yer: "10" }], f: (v, a) => sayi(v, "Ekle") + argSayi(a[0], 0) },
  { ad: "eksi", etiket: "Çıkar", grup: "Sayı", aciklama: "Sayıdan çıkarır", arg: [{ ad: "Çıkarılacak", yer: "10" }], f: (v, a) => sayi(v, "Çıkar") - argSayi(a[0], 0) },
  { ad: "carpi", etiket: "Çarp", grup: "Sayı", aciklama: "Sayıyı çarpar", arg: [{ ad: "Çarpan", yer: "1.2" }], f: (v, a) => sayi(v, "Çarp") * argSayi(a[0], 1) },
  { ad: "bolu", etiket: "Böl", grup: "Sayı", aciklama: "Sayıyı böler", arg: [{ ad: "Bölen", yer: "100" }], f: (v, a) => { const b = argSayi(a[0], 1); if (!b) throw new SablonHatasi("Sıfıra bölünemez."); return sayi(v, "Böl") / b; } },
  { ad: "yuzde", etiket: "Yüzdesini al", grup: "Sayı", aciklama: "Yüzde 20 için 20 yaz", arg: [{ ad: "Yüzde", yer: "20" }], f: (v, a) => (sayi(v, "Yüzdesini al") * argSayi(a[0], 0)) / 100 },
  { ad: "mutlak", etiket: "Mutlak değer", grup: "Sayı", aciklama: "Eksi işaretini kaldırır", f: (v) => Math.abs(sayi(v, "Mutlak değer")) },
  /* Tarih */
  { ad: "tarih", etiket: "Türkçe tarih", grup: "Tarih", aciklama: "Tarihi seçtiğin biçimde yazar, Türkiye saatiyle", arg: [{ ad: "Biçim", secenek: BICIM_SECENEK, varsayilan: "uzun", yer: "GG.AA.YYYY" }], f: (v, a) => { const t = tarih(v, "Türkçe tarih"); const b = a[0] || "uzun"; return TARIH_BICIMLERI.some((x) => x.id === b) ? tarihBicimle(t, b) : tarihBicimle(t, "ozel", b); } },
  { ad: "gun_ekle", etiket: "Gün ekle", grup: "Tarih", aciklama: "Gün ekler; çıkarmak için eksi yaz", arg: [{ ad: "Gün", yer: "3" }], f: (v, a) => new Date(tarih(v, "Gün ekle") + argSayi(a[0], 0) * 86_400_000).toISOString() },
  { ad: "saat_ekle", etiket: "Saat ekle", grup: "Tarih", aciklama: "Saat ekler; çıkarmak için eksi yaz", arg: [{ ad: "Saat", yer: "2" }], f: (v, a) => new Date(tarih(v, "Saat ekle") + argSayi(a[0], 0) * 3_600_000).toISOString() },
  { ad: "gun_adi", etiket: "Haftanın günü", grup: "Tarih", aciklama: "Pazartesi, Salı…", f: (v) => ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"][new Date(tarih(v, "Haftanın günü") + 3 * 3_600_000).getUTCDay()] },
  { ad: "gun_farki", etiket: "Kaç gün kaldı", grup: "Tarih", aciklama: "Bugünden bu tarihe kaç gün var (geçtiyse eksi)", f: (v) => Math.ceil((tarih(v, "Kaç gün kaldı") - Date.now()) / 86_400_000) },
  { ad: "iso", etiket: "ISO biçimi", grup: "Tarih", aciklama: "2026-11-05T09:00:00.000Z biçimi", f: (v) => new Date(tarih(v, "ISO biçimi")).toISOString() },
  /* Liste */
  { ad: "ilk", etiket: "İlk öğe", grup: "Liste", aciklama: "Listenin ilk öğesi", f: (v) => liste(v, "İlk öğe")[0] ?? null },
  { ad: "son", etiket: "Son öğe", grup: "Liste", aciklama: "Listenin son öğesi", f: (v) => liste(v, "Son öğe").at(-1) ?? null },
  { ad: "oge", etiket: "Sıradaki öğe", grup: "Liste", aciklama: "Verilen sıradaki öğe, 1'den başlar", arg: [{ ad: "Sıra", yer: "2" }], f: (v, a) => { const l = liste(v, "Sıradaki öğe"), i = argSayi(a[0], 1); return l[i < 0 ? l.length + i : i - 1] ?? null; } },
  { ad: "ilk_n", etiket: "İlk N öğe", grup: "Liste", aciklama: "Listenin baştan N öğesi", arg: [{ ad: "Kaç öğe", yer: "5" }], f: (v, a) => liste(v, "İlk N öğe").slice(0, Math.max(0, argSayi(a[0], 5))) },
  { ad: "alan", etiket: "Alanı çek", grup: "Liste", aciklama: "Her öğeden bir alanı alır (nesnede o alanı verir)", arg: [{ ad: "Alan yolu", yer: "musteri.ad" }], f: (v, a) => { const x = jsonDene(v); const y = a[0] ?? ""; return Array.isArray(x) ? x.map((z) => alanOku(z, y) ?? null) : alanOku(x, y) ?? null; } },
  { ad: "birlestir", etiket: "Metinle birleştir", grup: "Liste", aciklama: "Öğeleri ayraçla tek metin yapar", arg: [{ ad: "Ayraç", yer: ", ", varsayilan: ", " }], f: (v, a) => liste(v, "Metinle birleştir").map(metin).join(a[0] ?? ", ") },
  { ad: "toplam", etiket: "Toplam", grup: "Liste", aciklama: "Sayıların toplamı", f: (v) => sayilar(v, "Toplam").reduce((t, z) => t + z, 0) },
  { ad: "ortalama", etiket: "Ortalama", grup: "Liste", aciklama: "Sayıların ortalaması", f: (v) => { const l = sayilar(v, "Ortalama"); return l.length ? l.reduce((t, z) => t + z, 0) / l.length : 0; } },
  { ad: "en_kucuk", etiket: "En küçük", grup: "Liste", aciklama: "En küçük sayı", f: (v) => { const l = sayilar(v, "En küçük"); return l.length ? Math.min(...l) : null; } },
  { ad: "en_buyuk", etiket: "En büyük", grup: "Liste", aciklama: "En büyük sayı", f: (v) => { const l = sayilar(v, "En büyük"); return l.length ? Math.max(...l) : null; } },
  { ad: "tekil", etiket: "Tekrarları sil", grup: "Liste", aciklama: "Aynı öğelerden birini bırakır", f: (v) => { const g = new Set<string>(); return liste(v, "Tekrarları sil").filter((z) => { const k = metin(z); if (g.has(k)) return false; g.add(k); return true; }); } },
  { ad: "sirala", etiket: "Sırala", grup: "Liste", aciklama: "Küçükten büyüğe; nesnelerde alan adı ver", arg: [{ ad: "Alan (isteğe bağlı)", yer: "tutar", istege: true }, { ad: "Yön", secenek: [{ id: "artan", ad: "Artan" }, { id: "azalan", ad: "Azalan" }], varsayilan: "artan", istege: true }], f: (v, a) => { const y = a[1] === "azalan" ? -1 : 1; return [...liste(v, "Sırala")].sort((x, z) => karsilastir(a[0] ? alanOku(x, a[0]) : x, a[0] ? alanOku(z, a[0]) : z) * y); } },
  { ad: "ters", etiket: "Ters çevir", grup: "Liste", aciklama: "Listeyi sondan başa çevirir", f: (v) => [...liste(v, "Ters çevir")].reverse() },
  /* Mantık */
  { ad: "varsayilan", etiket: "Boşsa varsayılan", grup: "Mantık", aciklama: "Değer boşsa yerine bunu yazar", arg: [{ ad: "Varsayılan", yer: "Belirtilmedi" }], f: (v, a) => (bosMu(v) ? a[0] ?? "" : v) },
  { ad: "eger", etiket: "Doluysa şu, değilse bu", grup: "Mantık", aciklama: "Değer dolu ya da doğruysa ilkini, değilse ikincisini verir", arg: [{ ad: "Doluysa", yer: "Evet" }, { ad: "Değilse", yer: "Hayır", istege: true }], f: (v, a) => (dogruMu(v) ? a[0] ?? "" : a[1] ?? "") },
  { ad: "esitse", etiket: "Eşitse şu, değilse bu", grup: "Mantık", aciklama: "Değer verilen metne eşitse ilkini, değilse ikincisini verir", arg: [{ ad: "Karşılaştır", yer: "odendi" }, { ad: "Eşitse", yer: "Ödendi" }, { ad: "Değilse", yer: "Bekliyor", istege: true }], f: (v, a) => (metin(v).trim().toLocaleLowerCase("tr") === (a[0] ?? "").trim().toLocaleLowerCase("tr") ? a[1] ?? "" : a[2] ?? "") },
  /* Kodlama */
  { ad: "json", etiket: "JSON metni", grup: "Kodlama", aciklama: "Değeri JSON metnine çevirir", f: (v) => JSON.stringify(v ?? null) },
  { ad: "json_oku", etiket: "JSON olarak oku", grup: "Kodlama", aciklama: "JSON metnini nesneye çevirir", f: (v) => { if (typeof v !== "string") return v ?? null; try { return JSON.parse(v); } catch { throw new SablonHatasi("JSON olarak oku: metin geçerli JSON değil."); } } },
  { ad: "url_kodla", etiket: "Adres için kodla", grup: "Kodlama", aciklama: "Sorgu parametresine koymak için kodlar", f: (v) => encodeURIComponent(metin(v)) },
  { ad: "url_coz", etiket: "Adres kodunu çöz", grup: "Kodlama", aciklama: "Kodlanmış adres parçasını çözer", f: (v) => { try { return decodeURIComponent(metin(v)); } catch { throw new SablonHatasi("Adres kodu çözülemedi."); } } },
  { ad: "base64", etiket: "Base64 kodla", grup: "Kodlama", aciklama: "Metni Base64 yapar (ör. Basic yetki başlığı)", f: (v) => b64(metin(v)) },
  { ad: "base64_coz", etiket: "Base64 çöz", grup: "Kodlama", aciklama: "Base64 metni çözer", f: (v) => b64Coz(metin(v)) },
];
export const ISLEV_GRUPLARI: IslevGrubu[] = ["Metin", "Sayı", "Tarih", "Liste", "Mantık", "Kodlama"];
export const islevBul = (ad: string) => ISLEVLER.find((x) => x.ad === ad);

/** Üst düzeyde (tırnak, ayraç ve parantez dışında) ayırır. */
function ustDuzeyBol(s: string, ayrac: string): string[] {
  const o: string[] = [];
  let d = 0, tirnak: string | null = null, bas = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (tirnak) { if (c === "\\") { i++; continue; } if (c === tirnak) tirnak = null; continue; }
    if (c === "\"" || c === "'") { tirnak = c; continue; }
    if (c === "(" || c === "[") d++;
    else if (c === ")" || c === "]") d = Math.max(0, d - 1);
    else if (c === ayrac && d === 0) { o.push(s.slice(bas, i)); bas = i + 1; }
  }
  o.push(s.slice(bas));
  return o;
}
const argCoz = (s: string) => { const t = s.trim(); if ((t.startsWith("\"") && t.endsWith("\"") && t.length >= 2) || (t.startsWith("'") && t.endsWith("'") && t.length >= 2)) return t.slice(1, -1).replace(/\\(["'\\])/g, "$1"); return t; };
/** "tetik.ad | kisalt(10) | buyuk" yolunu ve işlev zincirini ayırır. */
export function ifadeAyir(ifade: string): { yol: string; islevler: IslevCagrisi[] } {
  const p = ustDuzeyBol(ifade, "|");
  const islevler: IslevCagrisi[] = [];
  for (const x of p.slice(1)) {
    const t = x.trim();
    if (!t) continue;
    const m = /^([A-Za-z_][\w]*)\s*(?:\(([\s\S]*)\))?$/.exec(t);
    if (!m) throw new SablonHatasi(`"${t.slice(0, 40)}" işlev olarak okunamadı; ad(değer) biçiminde yaz.`);
    islevler.push({ ad: m[1], args: m[2] !== undefined && m[2].trim() !== "" ? ustDuzeyBol(m[2], ",").map(argCoz) : [] });
  }
  return { yol: p[0].trim(), islevler };
}
/** Zinciri metne çevirir: kisalt(120) | buyuk. Metin bağımsız değişkenleri tırnaklanır. */
export function islevYaz(l: IslevCagrisi[]): string {
  return l.map((x) => (x.args.length ? `${x.ad}(${x.args.map((a) => (/^-?\d+(\.\d+)?$/.test(a) ? a : `"${a.replace(/(["\\])/g, "\\$1")}"`)).join(", ")})` : x.ad)).join(" | ");
}
/** Göndermeyi yol ve zincirden kurar. */
export const ifadeKur = (yol: string, l: IslevCagrisi[]) => (l.length ? `${yol} | ${islevYaz(l)}` : yol);

/** Değere zinciri uygular. */
export function islevUygula(v: unknown, l: IslevCagrisi[]): unknown {
  let x = v;
  for (const c of l) {
    const f = islevBul(c.ad);
    if (!f) throw new SablonHatasi(`"${c.ad}" diye bir işlev yok.`);
    try { x = f.f(x, c.args); } catch (e) { if (e instanceof SablonHatasi) throw e; throw new SablonHatasi(`${f.etiket}: ${(e as Error).message}`); }
  }
  return x;
}
