import "server-only";
import { randomBytes } from "crypto";
import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { projeOkuHam } from "./depo";
import { fonksiyonAyrintisi, fonksiyonCalistir } from "./fonksiyon";
import { gunlukYaz } from "./gunluk";
import { dilimFark, dilimGecerli, dilimZaman } from "./bolge";
import type { Proje } from "./tipler";

/**
 * Vayra Bulut zamanlanmış fonksiyonlar (Supabase Cron, Vercel Cron, Netlify scheduled functions benzeri) ve gecikmeli
 * işler (Convex runAfter, Appwrite scheduledAt benzeri).
 *  - Zamanlama 5 alanlı cron ("0 9 * * 1-5"), kısayol (@hourly, @daily …) ya da Türkçe ifade ("her gün 09:00",
 *    "hafta içi 08:30", "her 15 dakikada bir", "her ayın 1'i 10:00") olarak yazılır; Türkiye saatiyle (UTC+3) ya da UTC.
 *  - Görev yayındaki sürümün api/<fonksiyon>.js dosyasını çalıştırır (Canlı veriyle). Önceki çalışma sürüyorsa
 *    yenisi atlanır ve "atlandı" diye kaydedilir. Kaçırılan çalışmalar (sunucu kapalıyken) sonradan yapılmaz.
 *  - Koddan tanım: api/<ad>.js içinde `export const zamanlama = "her gün 09:00"` yazılırsa görev kendiliğinden
 *    oluşur (kaynak "kod"); açma/kapama panelden yapılır.
 *  - Gecikmeli iş: fonksiyon içinden vayra.sonra(saniye, "ad", veri). Hata olursa 1 ve 2 dakika sonra yeniden denenir.
 *  - Çalışma geçmişi: son 300 çalışma (en çok 7 gün), console satırları ve hata metniyle.
 * Dosya: .veri/build/bulut-zaman/<projeId>.json. Zamanlayıcı 15 saniyede bir bakar (zamanliBaslat).
 */
/** IANA saat dilimi ("UTC", "Europe/Istanbul", "America/New_York" ...). */
export type SaatDilimi = string;
export type ZamanliIs = {
  id: string; ad: string; fonksiyon: string; zamanlama: string; ifade?: string; saatDilimi: SaatDilimi; acik: boolean;
  kaynak: "panel" | "kod"; govde?: string; olusturma: number; guncelleme: number;
  sonraki?: number; sonCalisma?: number; sonDurum?: Calisma["durum"]; sonSure?: number;
};
export type Calisma = {
  id: string; isId: string; ad: string; fonksiyon: string; tetik: "zaman" | "elle" | "gecikmeli"; z: number; sure: number;
  durum: "basarili" | "hata" | "atlandi"; kod?: number; mesaj?: string; log?: string[]; deneme?: number;
};
export type GecikmeliIs = {
  id: string; fonksiyon: string; veri?: unknown; zaman: number; olusturma: number; deneme: number;
  durum: "bekliyor" | "basarili" | "hata" | "iptal"; sonHata?: string; bitis?: number;
  /** Denemeler (en çok 10): zaman, süre, sonuç, mesaj. */ denemeler?: { z: number; sure: number; durum: Calisma["durum"]; mesaj?: string }[];
  /** Panelden yeniden kuyruğa alındıysa sayısı. */ yeniden?: number; kaynak?: "fonksiyon" | "panel";
  /** İlk vade (zaman alanı denemelerde ileri alınır). */ vade?: number;
};
/** Yeniden deneme kuralı (kuyruk ayarı): en çok deneme ve bekleme biçimi. */
export type DenemeAyari = { enCok: number; bekleme: "dogrusal" | "ustel" | "sabit"; saniye: number };
export const VARSAYILAN_DENEME: DenemeAyari = { enCok: 3, bekleme: "dogrusal", saniye: 60 };
type Depo = { isler: ZamanliIs[]; calismalar: Calisma[]; gecikmeli: GecikmeliIs[]; kodSurum?: string; deneme?: DenemeAyari };

const KIMLIK = /^[A-Za-z0-9_-]{6,20}$/;
const KOK = path.join(DEPO_KOK, "build", "bulut-zaman");
const dosya = (id: string) => path.join(KOK, `${id}.json`);
const kuyruk = new Map<string, Promise<unknown>>();
export const SINIR = { is: 20, bekleyen: 200, gecmis: 300, gecikmeGun: 30 };
const FONKSIYON = /^[A-Za-z0-9_-]{1,60}$/;

async function oku(id: string): Promise<Depo> {
  try { const d = JSON.parse(await readFile(dosya(id), "utf8")) as Partial<Depo>; return { isler: d.isler ?? [], calismalar: d.calismalar ?? [], gecikmeli: d.gecikmeli ?? [], kodSurum: d.kodSurum, ...(d.deneme ? { deneme: d.deneme } : {}) }; }
  catch { return { isler: [], calismalar: [], gecikmeli: [] }; }
}
async function degistir<T>(id: string, f: (d: Depo) => T | Promise<T>): Promise<T> {
  if (!KIMLIK.test(id)) throw new Error("Proje kimliği geçersiz.");
  const onceki = kuyruk.get(id) ?? Promise.resolve();
  let s!: T;
  const is = onceki.then(async () => {
    const d = await oku(id);
    s = await f(d);
    const sinir = Date.now() - 7 * 864e5;
    d.calismalar = d.calismalar.filter((c) => c.z > sinir).slice(0, SINIR.gecmis);
    d.gecikmeli = d.gecikmeli.filter((g) => g.durum === "bekliyor" || (g.bitis ?? g.olusturma) > sinir).slice(-400);
    await mkdir(KOK, { recursive: true });
    await writeFile(dosya(id), JSON.stringify(d));
  });
  kuyruk.set(id, is.catch(() => {}));
  await is;
  return s;
}

/* ───────── Cron ───────── */

type CronAlan = { dk: boolean[]; sa: boolean[]; gun: boolean[]; ay: boolean[]; hg: boolean[]; gunYildiz: boolean; hgYildiz: boolean };
const MAKRO: Record<string, string> = { "@yearly": "0 0 1 1 *", "@annually": "0 0 1 1 *", "@monthly": "0 0 1 * *", "@weekly": "0 0 * * 0", "@daily": "0 0 * * *", "@midnight": "0 0 * * *", "@hourly": "0 * * * *" };
const AY_AD = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const HG_AD = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function alanCoz(s: string, min: number, max: number, adlar?: string[], adKaydir = 0): boolean[] | null {
  const d: boolean[] = new Array(max + 1).fill(false);
  const deger = (x: string) => { if (/^\d+$/.test(x)) return Number(x); const i = adlar?.indexOf(x.toLowerCase()) ?? -1; return i >= 0 ? i + adKaydir : NaN; };
  for (const parca of s.split(",")) {
    const m = /^(\*|([a-z0-9]+)(?:-([a-z0-9]+))?)(?:\/(\d+))?$/i.exec(parca.trim());
    if (!m) return null;
    const adim = m[4] ? Number(m[4]) : 1;
    if (!(adim >= 1)) return null;
    let a = min, b = max;
    if (m[1] !== "*") { a = deger(m[2]); b = m[3] ? deger(m[3]) : m[4] ? max : a; }
    if (!Number.isFinite(a) || !Number.isFinite(b) || a < min || b > max || a > b) return null;
    for (let i = a; i <= b; i += adim) d[i] = true;
  }
  return d;
}

/** 5 alanlı cron ifadesini çözer (dakika saat gün ay haftanınGünü); geçersizse null. Haftanın günü 0 ve 7 pazar. */
export function cronCoz(ifade: string): CronAlan | null {
  const t = (MAKRO[ifade.trim().toLowerCase()] ?? ifade).trim().split(/\s+/);
  if (t.length !== 5) return null;
  const dk = alanCoz(t[0], 0, 59), sa = alanCoz(t[1], 0, 23), gun = alanCoz(t[2], 1, 31), ay = alanCoz(t[3], 1, 12, AY_AD, 1), hg0 = alanCoz(t[4], 0, 7, HG_AD);
  if (!dk || !sa || !gun || !ay || !hg0) return null;
  const hg = hg0.slice(0, 7); if (hg0[7]) hg[0] = true;
  return { dk, sa, gun, ay, hg, gunYildiz: t[2] === "*", hgYildiz: t[4] === "*" };
}

/** Verilen andan sonraki n çalışma zamanı (ms, gerçek zaman). */
export function sonrakiler(ifade: string, sd: SaatDilimi = "Europe/Istanbul", n = 1, from = Date.now()): number[] {
  const c = cronCoz(ifade);
  if (!c) return [];
  const tz = dilimGecerli(sd) ? sd : "UTC";
  const off = dilimFark(from, tz);
  const o: number[] = [];
  let t = Math.floor((from + off) / 60_000) * 60_000 + 60_000;
  for (let i = 0; i < 200_000 && o.length < n; i++) {
    const d = new Date(t);
    const y = d.getUTCFullYear(), mo = d.getUTCMonth(), g = d.getUTCDate(), h = d.getUTCHours();
    if (y > new Date(from).getUTCFullYear() + 5) break;
    if (!c.ay[mo + 1]) { t = Date.UTC(y, mo + 1, 1); continue; }
    const gunUyar = c.gunYildiz && c.hgYildiz ? true : c.gunYildiz ? c.hg[d.getUTCDay()] : c.hgYildiz ? c.gun[g] : c.gun[g] || c.hg[d.getUTCDay()];
    if (!gunUyar) { t = Date.UTC(y, mo, g + 1); continue; }
    if (!c.sa[h]) { t = Date.UTC(y, mo, g, h + 1); continue; }
    if (!c.dk[d.getUTCMinutes()]) { t += 60_000; continue; }
    // Yerel saat (yaz saati geçişi dahil) gerçek zamana çevrilir.
    const iso = new Date(t).toISOString();
    const gercek = dilimZaman(iso.slice(0, 10), iso.slice(11, 16), tz);
    if (gercek > from) o.push(gercek);
    t += 60_000;
  }
  return o;
}

const GUN_ADLARI = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const iki = (n: number) => String(n).padStart(2, "0");

/** Cron ifadesinin Türkçe okunuşu ("Her gün 09:00", "Hafta içi her gün 08:30", "Her 15 dakikada bir"). */
export function cronAciklama(ifade: string): string {
  const s = (MAKRO[ifade.trim().toLowerCase()] ?? ifade).trim().split(/\s+/);
  if (s.length !== 5 || !cronCoz(ifade)) return "Geçersiz zamanlama";
  const [dk, sa, gun, ay, hg] = s;
  const sayi = (x: string) => /^\d+$/.test(x);
  const saat = sayi(dk) && sayi(sa) ? `${iki(Number(sa))}:${iki(Number(dk))}` : null;
  if (ay === "*" && gun === "*" && hg === "*") {
    if (dk === "*" && sa === "*") return "Her dakika";
    const adim = /^\*\/(\d+)$/.exec(dk);
    if (adim && sa === "*") return `Her ${adim[1]} dakikada bir`;
    if (sayi(dk) && sa === "*") return Number(dk) === 0 ? "Her saat başı" : `Her saat, ${dk} geçe`;
    const sadim = /^\*\/(\d+)$/.exec(sa);
    if (sadim && sayi(dk)) return `Her ${sadim[1]} saatte bir${Number(dk) ? `, ${dk} geçe` : ""}`;
    if (saat) return `Her gün ${saat}`;
    if (sayi(dk) && /^[\d,]+$/.test(sa)) return `Her gün ${sa.split(",").map((h) => `${iki(Number(h))}:${iki(Number(dk))}`).join(", ")}`;
  }
  if (saat && ay === "*" && gun === "*") {
    if (hg === "1-5") return `Hafta içi her gün ${saat}`;
    if (hg === "0,6" || hg === "6,0") return `Hafta sonu ${saat}`;
    if (/^[0-7](,[0-7])*$/.test(hg)) return `Her ${hg.split(",").map((x) => GUN_ADLARI[Number(x) % 7].toLocaleLowerCase("tr")).join(" ve ")} ${saat}`;
  }
  if (saat && ay === "*" && hg === "*" && /^\d+$/.test(gun)) return `Her ayın ${gun}. günü ${saat}`;
  if (saat && /^\d+$/.test(ay) && /^\d+$/.test(gun) && hg === "*") return `Her yıl ${gun} ${new Date(Date.UTC(2026, Number(ay) - 1, 1)).toLocaleDateString("tr-TR", { month: "long" })} ${saat}`;
  return `Özel zamanlama (${s.join(" ")})`;
}

/**
 * Türkçe ifadeyi cron'a çevirir. Anlaşılmazsa null. Cron ve kısayollar olduğu gibi kabul edilir.
 * Örnekler: "her dakika", "her 10 dakikada bir", "her saat", "her 2 saatte bir", "her saat 15 geçe", "her gün 09:00",
 * "her sabah 8", "her akşam 7", "gece yarısı", "hafta içi 08:30", "hafta sonu 10", "her pazartesi ve perşembe 10:00",
 * "her ayın 1'i 09:00", "her ayın 15. günü 12:30".
 */
export function turkceCron(metin: string): string | null {
  const ham = metin.trim();
  if (!ham) return null;
  if (MAKRO[ham.toLowerCase()]) return MAKRO[ham.toLowerCase()];
  if (/^\S+(\s+\S+){4}$/.test(ham) && cronCoz(ham)) return ham.split(/\s+/).join(" ");
  let s = ` ${ham.toLocaleLowerCase("tr-TR").replace(/[’']/g, "'").replace(/\s+/g, " ")} `;
  if (/ (her dakika|dakikada bir|dakika başı) /.test(s) && !/\d+ dakika/.test(s)) return "* * * * *";
  let m = /(\d{1,2}) dakikada bir|her (\d{1,2}) dakika/.exec(s);
  if (m) { const n = Number(m[1] ?? m[2]); return n >= 1 && n <= 59 ? (n === 1 ? "* * * * *" : `*/${n} * * * *`) : null; }
  m = /(\d{1,2}) saatte bir|her (\d{1,2}) saat(te)? /.exec(s);
  if (m) { const n = Number(m[1] ?? m[2]); return n >= 1 && n <= 23 ? (n === 1 ? "0 * * * *" : `0 */${n} * * *`) : null; }
  m = /her saat (\d{1,2}) geçe|saat başından (\d{1,2}) dakika sonra/.exec(s);
  if (m) { const n = Number(m[1] ?? m[2]); return n <= 59 ? `${n} * * * *` : null; }
  if (/ (her saat|saatte bir|saat başı|her saat başı) /.test(s)) return "0 * * * *";
  // Ayın günü
  let gun = "*";
  m = /ayın (\d{1,2})('?[a-zıüöçş]*)?(\.)?( günü)?/.exec(s);
  if (m) { const n = Number(m[1]); if (n < 1 || n > 31) return null; gun = String(n); s = s.replace(m[0], " "); }
  // Haftanın günleri
  let hg = "*";
  if (/hafta ?içi/.test(s)) { hg = "1-5"; s = s.replace(/hafta ?içi/, " "); }
  else if (/hafta ?sonu/.test(s)) { hg = "0,6"; s = s.replace(/hafta ?sonu/, " "); }
  else {
    const gunler = new Set<number>();
    for (const k of s.split(/[\s,]+/)) {
      const n = k.startsWith("pazartesi") ? 1 : k.startsWith("cumartesi") ? 6 : k.startsWith("pazar") ? 0 : k.startsWith("salı") || k.startsWith("sali") ? 2 : k.startsWith("çarşamba") || k.startsWith("carsamba") ? 3 : k.startsWith("perşembe") || k.startsWith("persembe") ? 4 : k.startsWith("cuma") ? 5 : -1;
      if (n >= 0) gunler.add(n);
    }
    if (gunler.size) { hg = [...gunler].sort().join(","); s = s.replace(/(pazartesi|cumartesi|pazar|salı|sali|çarşamba|carsamba|perşembe|persembe|cuma)[a-zıüöçş]*/g, " "); }
  }
  // Saat
  let saat: [number, number] | null = null;
  if (/gece ?yarısı/.test(s)) saat = [0, 0];
  else if (/öğle(n|yin)?( vakti)?/.test(s) && !/\d/.test(s)) saat = [12, 0];
  m = /(\d{1,2})[:.](\d{2})/.exec(s) ?? /saat (\d{1,2})\b/.exec(s) ?? /(?:sabah|akşam|aksam|gece|öğleden sonra|ogleden sonra) (\d{1,2})\b/.exec(s) ?? / (\d{1,2})(?:'?(?:de|da|te|ta))? /.exec(s);
  if (m) {
    let h = Number(m[1]); const d = m[2] ? Number(m[2]) : 0;
    if ((/akşam|aksam|öğleden sonra|ogleden sonra/.test(s)) && h < 12) h += 12;
    if (/gece/.test(s) && !/yarısı/.test(s) && h >= 7 && h < 12) h += 12;
    if (h > 23 || d > 59) return null;
    saat = [h, d];
  }
  if (!saat && /(her sabah)/.test(s)) saat = [9, 0];
  if (!saat && /(her akşam|her aksam)/.test(s)) saat = [19, 0];
  if (!saat) return null;
  return `${saat[1]} ${saat[0]} ${gun} * ${hg}`;
}

/* ───────── Görevler ───────── */

export const zamanlamaCoz = (metin: string) => { const cron = turkceCron(metin); return cron && cronCoz(cron) ? { cron, aciklama: cronAciklama(cron) } : null; };
const sonrakiHesapla = (is: Pick<ZamanliIs, "zamanlama" | "saatDilimi">) => sonrakiler(is.zamanlama, is.saatDilimi, 1)[0];

export async function zamanliOku(id: string) { return KIMLIK.test(id) ? oku(id) : { isler: [], calismalar: [], gecikmeli: [] } as Depo; }

export type IsGirdi = { ad?: string; fonksiyon?: string; zamanlama?: string; saatDilimi?: SaatDilimi; acik?: boolean; govde?: string };
export class ZamanliHata extends Error {}
function girdiDenetle(g: IsGirdi, eski?: ZamanliIs) {
  const fonksiyon = (g.fonksiyon ?? eski?.fonksiyon ?? "").trim();
  if (!FONKSIYON.test(fonksiyon)) throw new ZamanliHata("Fonksiyon seç (api/<ad>.js).");
  const ham = (g.zamanlama ?? eski?.ifade ?? eski?.zamanlama ?? "").trim();
  const z = zamanlamaCoz(ham);
  if (!z) throw new ZamanliHata("Zamanlama anlaşılmadı. \"her gün 09:00\", \"her 15 dakikada bir\" ya da cron (0 9 * * 1-5) yaz.");
  const govde = g.govde ?? eski?.govde;
  if (govde) { if (govde.length > 4000) throw new ZamanliHata("Gövde en çok 4000 karakter olabilir."); try { JSON.parse(govde); } catch { throw new ZamanliHata("Gövde geçerli JSON olmalı."); } }
  return { fonksiyon, cron: z.cron, ifade: ham === z.cron ? undefined : ham, govde: govde || undefined, ad: (g.ad ?? eski?.ad ?? "").trim().slice(0, 60) || fonksiyon, saatDilimi: dilimGecerli(g.saatDilimi ?? eski?.saatDilimi) ? String(g.saatDilimi ?? eski?.saatDilimi) : "UTC" };
}

export async function isEkle(id: string, g: IsGirdi): Promise<ZamanliIs> {
  const x = girdiDenetle(g);
  return degistir(id, (d) => {
    if (d.isler.length >= SINIR.is) throw new ZamanliHata(`Bir projede en çok ${SINIR.is} zamanlanmış görev olabilir.`);
    const z = Date.now();
    const is: ZamanliIs = { id: randomBytes(6).toString("base64url"), ad: x.ad, fonksiyon: x.fonksiyon, zamanlama: x.cron, ifade: x.ifade, saatDilimi: x.saatDilimi, acik: g.acik !== false, kaynak: "panel", govde: x.govde, olusturma: z, guncelleme: z };
    is.sonraki = is.acik ? sonrakiHesapla(is) : undefined;
    d.isler.push(is);
    return is;
  });
}
export async function isGuncelle(id: string, isId: string, g: IsGirdi): Promise<ZamanliIs> {
  return degistir(id, (d) => {
    const is = d.isler.find((x) => x.id === isId);
    if (!is) throw new ZamanliHata("Görev bulunamadı.");
    if (is.kaynak === "kod" && (g.zamanlama !== undefined || g.fonksiyon !== undefined)) throw new ZamanliHata("Bu görev koddan tanımlı; zamanlamayı api dosyasındaki export const zamanlama satırından değiştir.");
    if (is.kaynak === "panel" && (g.zamanlama !== undefined || g.fonksiyon !== undefined || g.ad !== undefined || g.govde !== undefined || g.saatDilimi !== undefined)) {
      const x = girdiDenetle(g, is);
      Object.assign(is, { ad: x.ad, fonksiyon: x.fonksiyon, zamanlama: x.cron, ifade: x.ifade, govde: x.govde, saatDilimi: x.saatDilimi });
    }
    if (typeof g.acik === "boolean") is.acik = g.acik;
    is.guncelleme = Date.now();
    is.sonraki = is.acik ? sonrakiHesapla(is) : undefined;
    return is;
  });
}
export async function isSil(id: string, isId: string) {
  return degistir(id, (d) => {
    const is = d.isler.find((x) => x.id === isId);
    if (!is) throw new ZamanliHata("Görev bulunamadı.");
    if (is.kaynak === "kod") throw new ZamanliHata("Bu görev koddan tanımlı; silmek için api dosyasındaki export const zamanlama satırını kaldır ya da görevi kapat.");
    d.isler = d.isler.filter((x) => x.id !== isId);
    return is;
  });
}

/** Yayındaki sürümün api/*.js dosyalarındaki `export const zamanlama = "…"` satırları. */
export function koddakiZamanlamalar(dosyalar: Record<string, string>) {
  const o: { fonksiyon: string; ifade: string; cron: string | null }[] = [];
  for (const [yol, icerik] of Object.entries(dosyalar)) {
    const f = /^api\/([A-Za-z0-9_-]{1,60})\.js$/.exec(yol);
    if (!f) continue;
    const m = /export\s+const\s+zamanlama\s*=\s*(["'`])([^"'`\n]{1,80})\1/.exec(icerik);
    if (m) o.push({ fonksiyon: f[1], ifade: m[2].trim(), cron: turkceCron(m[2]) });
  }
  return o;
}
const esitlenen = new Map<string, string>();
/** Koddan tanımlı görevleri yayındaki sürümle eşitler (sürüm başına bir kez; açık/kapalı tercihi korunur). */
export async function kodZamanlamalariniEsitle(p: Proje, zorla = false) {
  const surum = p.yayin?.surumId ?? "";
  if (!zorla && esitlenen.get(p.id) === surum) return;
  esitlenen.set(p.id, surum);
  const dosyalar = p.yayin ? p.surumler.find((s) => s.id === p.yayin!.surumId)?.dosyalar ?? {} : {};
  const kod = koddakiZamanlamalar(dosyalar).filter((x) => x.cron);
  const d0 = await oku(p.id);
  if (!kod.length && !d0.isler.some((x) => x.kaynak === "kod")) return;
  await degistir(p.id, (d) => {
    const z = Date.now();
    for (const k of kod) {
      const id = `kod-${k.fonksiyon}`;
      const var_ = d.isler.find((x) => x.id === id);
      if (var_) { if (var_.zamanlama !== k.cron) { var_.zamanlama = k.cron!; var_.ifade = k.ifade === k.cron ? undefined : k.ifade; var_.guncelleme = z; var_.sonraki = var_.acik ? sonrakiHesapla(var_) : undefined; } }
      else if (d.isler.length < SINIR.is) { const is: ZamanliIs = { id, ad: k.fonksiyon, fonksiyon: k.fonksiyon, zamanlama: k.cron!, ifade: k.ifade === k.cron ? undefined : k.ifade, saatDilimi: "Europe/Istanbul", acik: true, kaynak: "kod", olusturma: z, guncelleme: z }; is.sonraki = sonrakiHesapla(is); d.isler.push(is); }
    }
    d.isler = d.isler.filter((x) => x.kaynak !== "kod" || kod.some((k) => `kod-${k.fonksiyon}` === x.id));
    d.kodSurum = surum;
  });
}

/* ───────── Çalıştırma ───────── */

type Durum = { z: ReturnType<typeof setInterval> | null; tik: () => Promise<void>; calisan: Set<string>; mesgul: boolean; sonUyari: number; basla?: Map<string, { z: number; ad: string; fonksiyon: string; tetik: Calisma["tetik"]; deneme?: number }> };
const G = globalThis as unknown as { __vayraZamanli?: Durum };
const durum: Durum = (G.__vayraZamanli ??= { z: null, tik: async () => {}, calisan: new Set(), mesgul: false, sonUyari: 0 });
const baslayanlar = () => (durum.basla ??= new Map());

/** Fonksiyonu çalıştırır ve sonucu kaydeder. Aynı görev zaten çalışıyorsa "atlandı" döner. */
async function calistir(projeId: string, g: { isId: string; ad: string; fonksiyon: string; tetik: Calisma["tetik"]; govde?: unknown; deneme?: number }): Promise<Calisma> {
  const bas = Date.now();
  const temel = { id: randomBytes(6).toString("base64url"), isId: g.isId, ad: g.ad, fonksiyon: g.fonksiyon, tetik: g.tetik, z: bas, ...(g.deneme ? { deneme: g.deneme } : {}) };
  const anahtar = `${projeId}:${g.isId}`;
  if (durum.calisan.has(anahtar)) {
    const c: Calisma = { ...temel, sure: 0, durum: "atlandi", mesaj: "Önceki çalışma sürdüğü için atlandı." };
    await degistir(projeId, (d) => { d.calismalar.unshift(c); });
    return c;
  }
  durum.calisan.add(anahtar);
  baslayanlar().set(anahtar, { z: bas, ad: g.ad, fonksiyon: g.fonksiyon, tetik: g.tetik, ...(g.deneme ? { deneme: g.deneme } : {}) });
  let c: Calisma;
  try {
    const p = await projeOkuHam(projeId);
    const kod = p?.yayin ? p.surumler.find((s) => s.id === p.yayin!.surumId)?.dosyalar[`api/${g.fonksiyon}.js`] : undefined;
    if (!p || !kod) c = { ...temel, sure: 0, durum: "hata", mesaj: p?.yayin ? `Yayındaki sürümde api/${g.fonksiyon}.js yok.` : "Proje yayında değil; zamanlanmış görevler yayındaki kodu çalıştırır." };
    else {
      const metin = g.govde === undefined ? "" : JSON.stringify(g.govde);
      const s = await fonksiyonCalistir(kod, { yontem: "POST", yol: `/api/${g.fonksiyon}`, sorgu: {}, basliklar: { "content-type": "application/json", "x-vayra-tetik": g.tetik === "gecikmeli" ? "gecikmeli" : "zamanlama", "user-agent": "Vayra Zamanlayıcı" }, govde: g.govde ?? null, metin }, p);
      const hata = s.hata ?? (s.durum >= 500 ? `Durum ${s.durum}` : undefined);
      c = { ...temel, sure: s.sure, durum: hata ? "hata" : "basarili", kod: s.durum, mesaj: (hata ?? s.loglar.at(-1) ?? s.govde.slice(0, 200)).slice(0, 300), log: s.loglar.slice(-30) };
      gunlukYaz(projeId, { t: "fonksiyon", d: s.durum, y: `/api/${g.fonksiyon}`, ms: s.sure, yt: "POST", m: `${g.tetik === "gecikmeli" ? "Gecikmeli iş" : g.tetik === "elle" ? "Elle çalıştırılan görev" : "Zamanlanmış görev"}: ${g.ad}${hata ? `, ${hata}` : ""}`, f: fonksiyonAyrintisi(s), ua: "Vayra Zamanlayıcı" });
    }
  } catch (e) { c = { ...temel, sure: Date.now() - bas, durum: "hata", mesaj: (e as Error).message.slice(0, 300) }; }
  finally { durum.calisan.delete(anahtar); baslayanlar().delete(anahtar); }
  await degistir(projeId, (d) => {
    d.calismalar.unshift(c);
    const is = d.isler.find((x) => x.id === g.isId);
    if (is) { is.sonCalisma = c.z; is.sonDurum = c.durum; is.sonSure = c.sure; }
  });
  if (c.durum === "hata" && g.tetik !== "elle") {
    import("./bulutBildirim").then(async (b) => {
      const p = await projeOkuHam(projeId);
      if (p) await b.bildirimEkle(p, `zamanli:${g.isId}:${new Date(c.z + 3 * 3600_000).toISOString().slice(0, 10)}`, { tur: "zamanli-hata", seviye: "uyari", baslik: `${g.tetik === "gecikmeli" ? "Gecikmeli iş" : "Zamanlanmış görev"} başarısız: ${g.ad}`, ayrinti: c.mesaj ?? "Fonksiyon hata verdi.", bolum: "zamanli" });
    }).catch(() => {});
  }
  return c;
}

/** Görevi hemen çalıştırır (panelden "Şimdi çalıştır"). */
export async function isCalistir(projeId: string, isId: string) {
  const is = (await oku(projeId)).isler.find((x) => x.id === isId);
  if (!is) throw new ZamanliHata("Görev bulunamadı.");
  return calistir(projeId, { isId: is.id, ad: is.ad, fonksiyon: is.fonksiyon, tetik: "elle", govde: is.govde ? JSON.parse(is.govde) : undefined });
}

/** Gecikmeli iş ekler (fonksiyon içinden vayra.sonra). gecikme: ms (1 sn ile 30 gün arası). */
export async function gecikmeliEkle(projeId: string, g: { fonksiyon: string; veri?: unknown; gecikme: number; kaynak?: "fonksiyon" | "panel" }): Promise<GecikmeliIs> {
  if (!FONKSIYON.test(g.fonksiyon)) throw new ZamanliHata("Fonksiyon adı geçersiz.");
  const gecikme = Math.round(Number(g.gecikme));
  if (!(gecikme >= 1000) || gecikme > SINIR.gecikmeGun * 864e5) throw new ZamanliHata(`Gecikme 1 saniye ile ${SINIR.gecikmeGun} gün arasında olmalı.`);
  const veri = g.veri === undefined ? undefined : JSON.parse(JSON.stringify(g.veri));
  if (veri !== undefined && JSON.stringify(veri).length > 20_000) throw new ZamanliHata("İş verisi en çok 20 KB olabilir.");
  return degistir(projeId, (d) => {
    if (d.gecikmeli.filter((x) => x.durum === "bekliyor").length >= SINIR.bekleyen) throw new ZamanliHata(`Bekleyen iş sınırı (${SINIR.bekleyen}) doldu.`);
    const z = Date.now();
    const is: GecikmeliIs = { id: randomBytes(6).toString("base64url"), fonksiyon: g.fonksiyon, ...(veri !== undefined ? { veri } : {}), zaman: z + gecikme, vade: z + gecikme, olusturma: z, deneme: 0, durum: "bekliyor", ...(g.kaynak ? { kaynak: g.kaynak } : {}) };
    d.gecikmeli.push(is);
    return is;
  });
}
export async function gecikmeliIptal(projeId: string, isId: string) {
  return degistir(projeId, (d) => { const x = d.gecikmeli.find((y) => y.id === isId && y.durum === "bekliyor"); if (!x) throw new ZamanliHata("Bekleyen iş bulunamadı."); x.durum = "iptal"; x.bitis = Date.now(); return x; });
}

/** n. başarısız denemeden sonra beklenecek süre (ms). */
export const denemeBeklemesi = (k: DenemeAyari, n: number) => Math.min(24 * 3600_000, (k.bekleme === "ustel" ? k.saniye * 2 ** (n - 1) : k.bekleme === "dogrusal" ? k.saniye * n : k.saniye) * 1000);

/* ───────── Kuyruk izleme (Bulut > Kuyruk) ───────── */

export type KuyrukOzeti = {
  sayac: { bekliyor: number; vadesi: number; calisiyor: number; basarili: number; hata: number; iptal: number };
  gecikme: { enEskiBekleyen: number | null; ortBekleme: number | null; ortSure: number | null; p95Sure: number | null };
  saatlik: { saat: number; basarili: number; hata: number }[];
  fonksiyonlar: { ad: string; bekliyor: number; basarili: number; hata: number; ortSure: number | null; sonHata?: string }[];
  calisan: { anahtar: string; ad: string; fonksiyon: string; tetik: Calisma["tetik"]; z: number; deneme?: number }[];
  yaklasan: { isId: string; ad: string; fonksiyon: string; z: number; tur: "zamanli" | "gecikmeli" }[];
  deneme: DenemeAyari;
};

/** Kuyruğun anlık özeti: sayılar, gecikme, son 24 saat saatlik çıktı, fonksiyon başına, çalışanlar, yaklaşan 24 saat. */
export async function kuyrukOzeti(id: string): Promise<KuyrukOzeti> {
  const d = await zamanliOku(id);
  const z = Date.now();
  const g = d.gecikmeli;
  const bekleyen = g.filter((x) => x.durum === "bekliyor");
  const gecikmeliCalismalar = d.calismalar.filter((c) => c.tetik === "gecikmeli" && c.durum !== "atlandi");
  const sureler = gecikmeliCalismalar.map((c) => c.sure).sort((a, b) => a - b);
  const biten = g.filter((x) => x.vade && x.durum !== "iptal" && x.denemeler?.length);
  const bekleme = biten.map((x) => (x.denemeler!.find((y) => y.z >= x.vade!)?.z ?? -1) - x.vade!).filter((n) => n >= 0 && n < 864e5);
  const saatlik = Array.from({ length: 24 }, (_, i) => ({ saat: Math.floor(z / 3600_000) * 3600_000 - (23 - i) * 3600_000, basarili: 0, hata: 0 }));
  for (const c of d.calismalar) { const i = 23 - Math.floor((Math.floor(z / 3600_000) * 3600_000 - Math.floor(c.z / 3600_000) * 3600_000) / 3600_000); if (i >= 0 && i < 24 && c.durum !== "atlandi") saatlik[i][c.durum === "hata" ? "hata" : "basarili"]++; }
  const fAd = [...new Set([...g.map((x) => x.fonksiyon), ...d.isler.map((x) => x.fonksiyon)])].sort();
  const fonksiyonlar = fAd.map((f) => {
    const l = d.calismalar.filter((c) => c.fonksiyon === f && c.durum !== "atlandi");
    return { ad: f, bekliyor: bekleyen.filter((x) => x.fonksiyon === f).length, basarili: l.filter((c) => c.durum === "basarili").length, hata: l.filter((c) => c.durum === "hata").length, ortSure: l.length ? Math.round(l.reduce((t, c) => t + c.sure, 0) / l.length) : null, sonHata: l.find((c) => c.durum === "hata")?.mesaj };
  });
  const calisan = [...baslayanlar().entries()].filter(([k]) => k.startsWith(`${id}:`)).map(([k, v]) => ({ anahtar: k.slice(id.length + 1), ...v }));
  const yaklasan = [
    ...d.isler.filter((x) => x.acik).flatMap((x) => sonrakiler(x.zamanlama, x.saatDilimi, 30, z).filter((t) => t < z + 864e5).slice(0, 24).map((t) => ({ isId: x.id, ad: x.ad, fonksiyon: x.fonksiyon, z: t, tur: "zamanli" as const }))),
    ...bekleyen.filter((x) => x.zaman < z + 864e5).map((x) => ({ isId: x.id, ad: `${x.fonksiyon} (gecikmeli)`, fonksiyon: x.fonksiyon, z: x.zaman, tur: "gecikmeli" as const })),
  ].sort((a, b) => a.z - b.z).slice(0, 60);
  return {
    sayac: { bekliyor: bekleyen.length, vadesi: bekleyen.filter((x) => x.zaman <= z).length, calisiyor: calisan.length, basarili: g.filter((x) => x.durum === "basarili").length, hata: g.filter((x) => x.durum === "hata").length, iptal: g.filter((x) => x.durum === "iptal").length },
    gecikme: { enEskiBekleyen: bekleyen.filter((x) => x.zaman <= z).reduce<number | null>((m, x) => (m === null || x.zaman < m ? x.zaman : m), null), ortBekleme: bekleme.length ? Math.round(bekleme.reduce((t, n) => t + n, 0) / bekleme.length) : null, ortSure: sureler.length ? Math.round(sureler.reduce((t, n) => t + n, 0) / sureler.length) : null, p95Sure: sureler.length ? sureler[Math.min(sureler.length - 1, Math.floor(sureler.length * 0.95))] : null },
    saatlik, fonksiyonlar, calisan, yaklasan, deneme: d.deneme ?? VARSAYILAN_DENEME,
  };
}

/** Başarısız ya da iptal edilmiş işi yeniden kuyruğa alır (deneme sayısı sıfırlanır, geçmiş denemeler kalır). */
export async function gecikmeliYenidenDene(projeId: string, isIdler: string[]) {
  return degistir(projeId, (d) => {
    let n = 0;
    for (const x of d.gecikmeli) {
      if (!isIdler.includes(x.id) || (x.durum !== "hata" && x.durum !== "iptal")) continue;
      if (d.gecikmeli.filter((y) => y.durum === "bekliyor").length >= SINIR.bekleyen) throw new ZamanliHata(`Bekleyen iş sınırı (${SINIR.bekleyen}) doldu.`);
      x.durum = "bekliyor"; x.deneme = 0; x.zaman = Date.now(); x.vade = x.zaman; x.yeniden = (x.yeniden ?? 0) + 1; delete x.bitis;
      n++;
    }
    if (!n) throw new ZamanliHata("Yeniden denenecek iş bulunamadı (yalnız başarısız ya da iptal edilmiş işler).");
    return n;
  });
}
/** Bekleyen işi hemen çalışacak hâle getirir (zamanlayıcının bir sonraki turunda, 15 sn içinde). */
export async function gecikmeliSimdi(projeId: string, isId: string) {
  return degistir(projeId, (d) => { const x = d.gecikmeli.find((y) => y.id === isId && y.durum === "bekliyor"); if (!x) throw new ZamanliHata("Bekleyen iş bulunamadı."); x.zaman = Date.now(); return x; });
}
/** Biten işleri kuyruktan temizler (durumlar: basarili, hata, iptal). */
export async function gecikmeliTemizle(projeId: string, durumlar: GecikmeliIs["durum"][]) {
  return degistir(projeId, (d) => { const once = d.gecikmeli.length; d.gecikmeli = d.gecikmeli.filter((x) => x.durum === "bekliyor" || !durumlar.includes(x.durum)); return once - d.gecikmeli.length; });
}
/** Bekleyen işlerin hepsini (ya da bir fonksiyonunkileri) iptal eder. */
export async function gecikmeliTopluIptal(projeId: string, fonksiyon?: string) {
  return degistir(projeId, (d) => { let n = 0; for (const x of d.gecikmeli) if (x.durum === "bekliyor" && (!fonksiyon || x.fonksiyon === fonksiyon)) { x.durum = "iptal"; x.bitis = Date.now(); n++; } return n; });
}
export async function denemeAyariYaz(projeId: string, a: Partial<DenemeAyari>): Promise<DenemeAyari> {
  return degistir(projeId, (d) => {
    const e = d.deneme ?? VARSAYILAN_DENEME;
    const enCok = Math.round(Number(a.enCok ?? e.enCok)), saniye = Math.round(Number(a.saniye ?? e.saniye));
    if (!(enCok >= 1 && enCok <= 10)) throw new ZamanliHata("En çok deneme 1 ile 10 arasında olmalı.");
    if (!(saniye >= 5 && saniye <= 3600)) throw new ZamanliHata("Bekleme 5 saniye ile 1 saat arasında olmalı.");
    const bekleme = a.bekleme === "ustel" || a.bekleme === "sabit" || a.bekleme === "dogrusal" ? a.bekleme : e.bekleme;
    d.deneme = { enCok, bekleme, saniye };
    return d.deneme;
  });
}
/** Başarısız zamanlanmış ya da elle çalışmayı aynı girdiyle yeniden çalıştırır. */
export async function calismaYenidenCalistir(projeId: string, calismaId: string) {
  const d = await oku(projeId);
  const c = d.calismalar.find((x) => x.id === calismaId);
  if (!c) throw new ZamanliHata("Çalışma bulunamadı.");
  if (c.isId.startsWith("gecikmeli:")) { await gecikmeliYenidenDene(projeId, [c.isId.slice(10)]); return null; }
  return isCalistir(projeId, c.isId);
}

async function projeTiki(id: string) {
  const z = Date.now();
  const d = await oku(id);
  const vadeli = d.isler.filter((x) => x.acik && x.sonraki && x.sonraki <= z);
  const bekleyen = d.gecikmeli.filter((x) => x.durum === "bekliyor" && x.zaman <= z).slice(0, 10);
  if (!vadeli.length && !bekleyen.length) {
    // Açık ama sonraki zamanı olmayan (eski kayıt) görevlerin zamanını hesapla.
    if (d.isler.some((x) => x.acik && !x.sonraki)) await degistir(id, (y) => { for (const x of y.isler) if (x.acik && !x.sonraki) x.sonraki = sonrakiHesapla(x); });
    return;
  }
  // Önce sonraki zamanlar ilerletilir (çalışma uzun sürse de iki kez tetiklenmesin); kaçırılan çalışmalar yapılmaz.
  await degistir(id, (y) => {
    for (const x of y.isler) if (vadeli.some((v) => v.id === x.id)) x.sonraki = sonrakiHesapla(x);
    // Çalışan gecikmeli iş 10 dakikalık kirayla ileri alınır: sunucu yarıda kapanırsa sonra yeniden denenir.
    for (const x of y.gecikmeli) if (bekleyen.some((b) => b.id === x.id)) x.zaman = Date.now() + 600_000;
  });
  for (const v of vadeli) {
    // 2 dakikadan eski vade sunucu kapalıyken kaçırılmıştır: çalıştırılmaz.
    if (z - (v.sonraki ?? z) > 120_000) continue;
    calistir(id, { isId: v.id, ad: v.ad, fonksiyon: v.fonksiyon, tetik: "zaman", govde: v.govde ? JSON.parse(v.govde) : { zamanlama: v.ad } }).catch(() => {});
  }
  for (const b of bekleyen) {
    calistir(id, { isId: `gecikmeli:${b.id}`, ad: `${b.fonksiyon} (gecikmeli)`, fonksiyon: b.fonksiyon, tetik: "gecikmeli", govde: b.veri, deneme: b.deneme + 1 }).then((c) => degistir(id, (y) => {
      const x = y.gecikmeli.find((q) => q.id === b.id);
      if (!x || x.durum !== "bekliyor") return;
      x.deneme++;
      x.denemeler = [...(x.denemeler ?? []), { z: c.z, sure: c.sure, durum: c.durum, ...(c.mesaj ? { mesaj: c.mesaj.slice(0, 200) } : {}) }].slice(-10);
      const kural = y.deneme ?? VARSAYILAN_DENEME;
      // "atlandi": aynı iş zaten çalışıyor (olmamalı); deneme sayılmadan 30 sn sonra yeniden bakılır.
      if (c.durum === "atlandi") { x.deneme--; x.zaman = Date.now() + 30_000; return; }
      if (c.durum === "hata" && x.deneme < kural.enCok) { x.zaman = Date.now() + denemeBeklemesi(kural, x.deneme); x.sonHata = c.mesaj; }
      else { x.durum = c.durum === "hata" ? "hata" : "basarili"; x.sonHata = c.durum === "hata" ? c.mesaj : undefined; x.bitis = Date.now(); }
    })).catch(() => {});
  }
}

async function tik() {
  if (durum.mesgul) return;
  durum.mesgul = true;
  try {
    const l = await readdir(KOK).catch(() => [] as string[]);
    for (const f of l) { const id = f.replace(/\.json$/, ""); if (KIMLIK.test(id)) await projeTiki(id).catch(() => {}); }
    if (Date.now() - durum.sonUyari > 60_000) { durum.sonUyari = Date.now(); await import("./bulutUyari").then((x) => x.uyarilariDenetle()).catch(() => {}); }
    // Otomatik günlük veritabanı yedeği (Bulut > Yedekler; kendi içinde 5 dakikada bir bakar).
    await import("./bulutYedek").then((x) => x.otomatikYedekTuru()).catch(() => {});
  } finally { durum.mesgul = false; }
}

/** Zamanlayıcıyı başlatır (tekrar çağrılabilir; geliştirmede modül yenilense de tek aralık çalışır, en yeni kodla). */
export function zamanliBaslat() {
  durum.tik = tik;
  if (!durum.z) durum.z = setInterval(() => { durum.tik().catch(() => {}); }, 15_000);
}
