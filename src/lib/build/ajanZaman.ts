/**
 * Ajan zamanlamaları: düz Türkçe ("her pazartesi 09.00", "hafta içi her gün 8.30'da", "her 15 dakikada bir",
 * "her ayın 1'i saat 10", "yarın 14.00") cron benzeri kurala çevrilir; kuralın saat dilimiyle (tz; yoksa Türkiye
 * saati, eski kurallar bu varsayımla kuruldu; yaz saati geçişleri hesaba katılır) sonraki çalışmalar hesaplanır. İstemci ve sunucu ortak; sunucuya özgü bir şey içermez.
 */
import { dilimFark, dilimGecerli, dilimZaman } from "./bolge";
export type ZamanKural = { dakika: number[]; saat: number[]; ayGunu: number[]; haftaGunu: number[]; aralik?: number; tek?: number; tz?: string };

const VARS_TZ = "Europe/Istanbul";
const katla = (s: string) => s.toLocaleLowerCase("tr").replace(/[çğıöşüâî]/g, (h) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i" })[h] ?? h).replace(/[’`]/g, "'");
const GUN_ADI = ["pazar", "pazartesi", "salı", "çarşamba", "perşembe", "cuma", "cumartesi"];
const AYLAR = ["ocak", "subat", "mart", "nisan", "mayis", "haziran", "temmuz", "agustos", "eylul", "ekim", "kasim", "aralik"];
const AY_ADI = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

function gunBul(t: string): number | null {
  if (t.startsWith("pazartesi")) return 1;
  if (t.startsWith("cumartesi")) return 6;
  if (t.startsWith("pazar")) return 0;
  if (t.startsWith("cuma")) return 5;
  if (t.startsWith("sali")) return 2;
  if (t.startsWith("carsamba") || t.startsWith("carsanba")) return 3;
  if (t.startsWith("persembe")) return 4;
  return null;
}
/** Saat diliminde (varsayılan Türkiye) tarih parçaları. */
export function trParca(t: number, tz = VARS_TZ) {
  const d = new Date(t + dilimFark(t, tz));
  return { yil: d.getUTCFullYear(), ay: d.getUTCMonth(), gun: d.getUTCDate(), haftaGunu: d.getUTCDay(), saat: d.getUTCHours(), dakika: d.getUTCMinutes() };
}
const iki = (n: number) => String(n).padStart(2, "0");
const trZaman = (yil: number, ay: number, gun: number, saat: number, dakika: number, tz = VARS_TZ) => dilimZaman(new Date(Date.UTC(yil, ay, gun)).toISOString().slice(0, 10), `${iki(saat)}:${iki(dakika)}`, tz);

/** Düz metni kurala çevirir; anlaşılmazsa null (sunucu yapay zekâyla yeniden dener). */
export function zamanCozumle(metin: string, simdi = Date.now(), tz?: string): ZamanKural | null {
  const k0 = zamanCozumleTz(metin, simdi, tz && dilimGecerli(tz) ? tz : VARS_TZ);
  return k0 && tz && dilimGecerli(tz) ? { ...k0, tz } : k0;
}
function zamanCozumleTz(metin: string, simdi: number, tz: string): ZamanKural | null {
  const s = ` ${katla(metin).replace(/\s+/g, " ").trim()} `;
  if (s.trim().length < 2) return null;
  const k: ZamanKural = { dakika: [], saat: [], ayGunu: [], haftaGunu: [] };
  let anlasildi = false;

  // Aralıklar
  let m: RegExpMatchArray | null;
  if ((m = s.match(/(?:her\s+)?(\d{1,3})\s*(?:dakika|dk)(?:da|de|ta|te)?(?:\s+bir)?/)) && Number(m[1]) >= 5) { k.aralik = Math.min(720, Number(m[1])); anlasildi = true; }
  else if (/yarim saat/.test(s)) { k.aralik = 30; anlasildi = true; }
  else if ((m = s.match(/(?:her\s+)?(\d{1,2})\s*saat(?:te|ta)?\s*(?:bir|de bir)/)) || (m = s.match(/her\s+(\d{1,2})\s*saat(?:te)?\b/))) { k.aralik = Math.min(24, Math.max(1, Number(m[1]))) * 60; anlasildi = true; }
  else if (/saat ?basi|saatte bir|her saat\b/.test(s)) { k.aralik = 60; anlasildi = true; }

  // Saatler
  const saatler: [number, number][] = [];
  for (const x of s.matchAll(/(?<![\d.:])(\d{1,2})[.:](\d{2})(?![\d])/g)) { const h = Number(x[1]), d = Number(x[2]); if (h < 24 && d < 60) saatler.push([h, d]); }
  if (!saatler.length) {
    for (const x of s.matchAll(/saat\s+(\d{1,2})(?![\d.:])/g)) if (Number(x[1]) < 24) saatler.push([Number(x[1]), 0]);
    for (const x of s.matchAll(/(?<![\d.:])(\d{1,2})\s*'?\s*(?:da|de|ta|te)\b/g)) if (Number(x[1]) < 24 && !saatler.some(([h]) => h === Number(x[1]))) saatler.push([Number(x[1]), 0]);
  }
  const ogleden = /aksam|ogleden sonra|gece/.test(s);
  for (const z of saatler) if (ogleden && z[0] < 12 && z[0] >= 5) z[0] += 12;
  if (!saatler.length && !k.aralik) {
    if (/gece ?yarisi/.test(s)) saatler.push([0, 0]);
    else if (/ogle(n|de)?\b/.test(s) && !/ogleden sonra/.test(s)) saatler.push([12, 0]);
    else if (/sabah/.test(s)) saatler.push([9, 0]);
    else if (/ogleden sonra/.test(s)) saatler.push([14, 0]);
    else if (/aksam/.test(s)) saatler.push([19, 0]);
  }
  if (saatler.length) anlasildi = true;

  // Tek seferlik: yarın, bugün, "12 kasım"
  let tarih: { yil: number; ay: number; gun: number } | null = null;
  const p = trParca(simdi, tz);
  if (/\byarin\b/.test(s)) { const y = trParca(simdi + 86_400_000, tz); tarih = { yil: y.yil, ay: y.ay, gun: y.gun }; }
  else if (/\bbugun\b/.test(s)) tarih = { yil: p.yil, ay: p.ay, gun: p.gun };
  else if ((m = s.match(/(\d{1,2})\s+(ocak|subat|mart|nisan|mayis|haziran|temmuz|agustos|eylul|ekim|kasim|aralik)/))) {
    const ay = AYLAR.indexOf(m[2]), gun = Number(m[1]);
    let yil = p.yil;
    if (ay < p.ay || (ay === p.ay && gun < p.gun)) yil++;
    tarih = { yil, ay, gun };
  }
  if (tarih && !/\bher\b/.test(s)) {
    const [h, d] = saatler[0] ?? [9, 0];
    return { dakika: [], saat: [], ayGunu: [], haftaGunu: [], tek: trZaman(tarih.yil, tarih.ay, tarih.gun, h, d, tz) };
  }

  // Günler
  if (/hafta ?ici/.test(s)) { k.haftaGunu = [1, 2, 3, 4, 5]; anlasildi = true; }
  else if (/hafta ?sonu/.test(s)) { k.haftaGunu = [6, 0]; anlasildi = true; }
  else {
    const g = new Set<number>();
    for (const t of s.split(/[^a-z]+/)) { const x = gunBul(t); if (x !== null) g.add(x); }
    if (g.size) { k.haftaGunu = [...g].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)); anlasildi = true; }
    else if (/her hafta|haftalik|haftada bir/.test(s)) { k.haftaGunu = [1]; anlasildi = true; }
  }
  if ((m = s.match(/ayin\s+(\d{1,2})/)) || (m = s.match(/her ay(?:in)?\s+(\d{1,2})/))) { const x = Number(m[1]); if (x >= 1 && x <= 31) { k.ayGunu = [x]; anlasildi = true; } }
  else if (/ay ?basi|ayin ilk gunu|her ayin basinda/.test(s)) { k.ayGunu = [1]; anlasildi = true; }
  else if (/her ay\b|aylik|ayda bir/.test(s)) { k.ayGunu = [1]; anlasildi = true; }
  if (/her gun|hergun|gunluk|her sabah|her aksam|her gece/.test(s)) anlasildi = true;
  if (!anlasildi) return null;

  if (!k.aralik) {
    if (!saatler.length) saatler.push([9, 0]);
    const uniq = [...new Map(saatler.map(([h, d]) => [`${h}:${d}`, [h, d] as [number, number]])).values()].sort((a, b) => a[0] * 60 + a[1] - (b[0] * 60 + b[1]));
    // Saat ve dakika ayrı listeler: farklı dakikalı birden çok saat yalnız aynı dakikadaysa birleşir.
    const dk = [...new Set(uniq.map((x) => x[1]))];
    if (dk.length === 1) { k.saat = uniq.map((x) => x[0]); k.dakika = dk; }
    else { k.saat = [uniq[0][0]]; k.dakika = [uniq[0][1]]; }
  } else if (saatler.length >= 2) {
    // "09.00 ile 18.00 arası her 30 dakikada bir"
    const [a, b] = [saatler[0][0], saatler[1][0]].sort((x, y) => x - y);
    k.saat = Array.from({ length: b - a + 1 }, (_, i) => a + i);
  }
  return k;
}

const buyuk = (x: string) => x.charAt(0).toLocaleUpperCase("tr") + x.slice(1);
const ikiHane = (n: number) => String(n).padStart(2, "0");
export const saatMetni = (h: number, d: number) => `${ikiHane(h)}.${ikiHane(d)}`;

/** Kuralın okunur Türkçe anlatımı (simgesiz). */
export function kuralAcikla(k: ZamanKural): string {
  if (k.tek) { const p = trParca(k.tek); return `Bir kez, ${p.gun} ${AY_ADI[p.ay]} ${buyuk(GUN_ADI[p.haftaGunu])} ${saatMetni(p.saat, p.dakika)}`; }
  let gun = "Her gün";
  const hg = [...k.haftaGunu].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  if (k.ayGunu.length) gun = `Her ayın ${k.ayGunu.join(" ve ")}. günü`;
  else if (hg.length === 5 && [1, 2, 3, 4, 5].every((x) => hg.includes(x))) gun = "Hafta içi her gün";
  else if (hg.length === 2 && hg.includes(0) && hg.includes(6)) gun = "Hafta sonu her gün";
  else if (hg.length && hg.length < 7) gun = `Her ${hg.map((x) => GUN_ADI[x]).join(hg.length > 2 ? ", " : " ve ").replace(/, ([^,]+)$/, " ve $1")}`;
  if (k.aralik) {
    const a = k.aralik % 60 === 0 ? (k.aralik === 60 ? "her saat başı" : `her ${k.aralik / 60} saatte bir`) : `her ${k.aralik} dakikada bir`;
    const sonDk = Math.floor((59) / (k.aralik % 60 || 60)) * (k.aralik % 60 || 60);
    const ara = k.saat.length > 1 ? `${saatMetni(k.saat[0], 0)} ile ${saatMetni(k.saat.at(-1)!, k.aralik < 60 ? sonDk : 0)} arası ` : "";
    if (gun === "Her gün") return `${ara ? `Her gün ${ara}` : ""}${ara ? a : a.charAt(0).toLocaleUpperCase("tr") + a.slice(1)}`;
    return `${gun} ${ara}${a}`;
  }
  const saatler = (k.saat.length ? k.saat : [9]).flatMap((h) => (k.dakika.length ? k.dakika : [0]).map((d) => saatMetni(h, d)));
  return `${gun} ${saatler.join(", ").replace(/, ([^,]+)$/, " ve $1")}`;
}

/** Bu andan sonraki n çalışma zamanı (en çok 400 gün ileriye bakar). */
export function sonrakiler(k: ZamanKural, n = 3, bas = Date.now()): number[] {
  if (k.tek) return k.tek > bas ? [k.tek] : [];
  const o: number[] = [];
  const dakikalar: number[] = k.aralik
    ? Array.from({ length: Math.floor(1440 / k.aralik) }, (_, i) => i * k.aralik!).filter((m) => !k.saat.length || k.saat.includes(Math.floor(m / 60)))
    : (k.saat.length ? k.saat : [9]).flatMap((h) => (k.dakika.length ? k.dakika : [0]).map((d) => h * 60 + d)).sort((a, b) => a - b);
  const tz = k.tz && dilimGecerli(k.tz) ? k.tz : VARS_TZ;
  const p = trParca(bas, tz);
  for (let i = 0; i < 400 && o.length < n; i++) {
    const g = new Date(Date.UTC(p.yil, p.ay, p.gun + i));
    const hg = g.getUTCDay(), ag = g.getUTCDate();
    if (k.haftaGunu.length && !k.haftaGunu.includes(hg)) continue;
    if (k.ayGunu.length && !k.ayGunu.includes(ag)) continue;
    for (const m of dakikalar) {
      const t = trZaman(g.getUTCFullYear(), g.getUTCMonth(), ag, Math.floor(m / 60), m % 60, tz);
      if (t > bas) { o.push(t); if (o.length >= n) break; }
    }
  }
  return o;
}

export const zamanYaz = (t: number, tz = VARS_TZ) => {
  const p = trParca(t, tz), b = trParca(Date.now(), tz), y = trParca(Date.now() + 86_400_000, tz);
  const gun = p.yil === b.yil && p.ay === b.ay && p.gun === b.gun ? "Bugün" : p.yil === y.yil && p.ay === y.ay && p.gun === y.gun ? "Yarın" : `${p.gun} ${AY_ADI[p.ay]} ${buyuk(GUN_ADI[p.haftaGunu])}`;
  return `${gun} ${saatMetni(p.saat, p.dakika)}`;
};
