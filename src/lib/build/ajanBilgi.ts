import "server-only";
import { createHash } from "crypto";
import type { AjanBilgi } from "./ajanDepo";
import { siteOku } from "./kaynak";
import { guvenliFetch } from "@/lib/guvenliAg";
import type { Kaynakca } from "./ziyaretciDepo";

/**
 * Ajan bilgisi: belgeler parçalara bölünür, Türkçeye uygun normalleştirme (küçük harf, ç ğ ı ö ş ü katlama, hafif ek
 * atma) ve BM25 sıralamasıyla aranır. Gömme (embedding) servisi gerektirmez. Bulunan parçalar numaralı kaynak olarak
 * modele verilir; model yanıtta [1] gibi alıntı yapar, hangi kaynağın yanıtladığı iz kaydında ve sohbette görünür.
 * Web adresi kaynakları alt sayfalarıyla okunur (bağlantılar ve istenirse site haritası; dahil ve hariç yol
 * süzgeçleri; en çok 50 sayfa) ve zamanlı yenilenir; her yenilemede değişen sayfa sayısı sayfa parmak izleriyle bulunur.
 */
const KATLA: Record<string, string> = { ç: "c", ğ: "g", ı: "i", i̇: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };
export const normal = (s: string) => s.toLocaleLowerCase("tr").replace(/[çğıöşüâîû]|i̇/g, (h) => KATLA[h] ?? h);

const DURAK = new Set(("ve veya ile icin ama fakat ancak bir bu su o da de ki mi mu mı mü ne nasil neden niye hangi kac kim ben sen biz siz onlar bana sana "
  + "beni seni bizim sizin benim senin var yok gibi kadar daha cok az en her hic olan olarak olur olsun ise eger diye yani hem ya cunku sonra once simdi "
  + "yalniz sadece eger ise sayet durumunda oldugunda kosul gelirse gelen geldiginde varsa yoksa buyukse kucukse fazlaysa azsa "
  + "the a an of to in on for and or is are be was were it this that with as by at from can do does how what when where which who why your you my").split(" "));
const EKLER = ["lerinden", "larindan", "lerinde", "larinda", "lerine", "larina", "lerini", "larini", "leriniz", "lariniz", "lerimiz", "larimiz", "lerin", "larin", "leri", "lari", "ler", "lar",
  "imiz", "umuz", "iniz", "unuz", "niz", "nuz", "miz", "muz", "inden", "undan", "sinden", "sindan", "nden", "ndan", "inde", "unda", "sinde", "sinda", "nde", "nda", "sini", "sina", "sine",
  "nin", "nun", "dan", "den", "tan", "ten", "yla", "yle", "da", "de", "ta", "te", "in", "un", "si", "su", "yi", "yu", "ya", "ye", "im", "um", "i", "u", "e", "a", "m", "n"];
export function kok(t: string): string {
  let x = t;
  for (let d = 0; d < 3 && x.length > 4; d++) {
    const e = EKLER.find((s) => x.endsWith(s) && x.length - s.length >= 3);
    if (!e) break;
    x = x.slice(0, -e.length);
  }
  return x.length > 7 ? x.slice(0, 7) : x;
}
export const terimler = (s: string) => normal(s).split(/[^a-z0-9]+/).filter((t) => t.length > 1 && !DURAK.has(t)).map(kok);

export type Parca = { bilgiId: string; ad: string; url?: string; no: number; metin: string; baslik: string };
/** Belgeyi başlık ve paragraf sınırlarından yaklaşık 900 karakterlik parçalara böler. */
export function parcala(b: AjanBilgi): Parca[] {
  const satirlar = b.icerik.replace(/\r/g, "").split(/\n/);
  const o: Parca[] = [];
  let tampon: string[] = [], boy = 0, baslik = b.ad;
  const bosalt = () => {
    const metin = tampon.join("\n").trim();
    if (metin) o.push({ bilgiId: b.id, ad: b.ad, url: b.url, no: o.length, metin, baslik });
    tampon = []; boy = 0;
  };
  for (const s of satirlar) {
    const h = /^(#{1,4})\s+(.+)/.exec(s) ?? /^(Sayfa:)\s*(.+)/.exec(s);
    if (h) { if (boy > 80) bosalt(); if (!tampon.length) baslik = h[2].slice(0, 120); }
    if (boy + s.length > 900 && boy > 0) {
      const son = tampon.at(-1) ?? "";
      bosalt();
      if (son.length < 300 && !h) { tampon.push(son); boy = son.length; }
    }
    if (s.length > 1200) { for (let i = 0; i < s.length; i += 900) { tampon.push(s.slice(i, i + 900)); boy += 900; bosalt(); } continue; }
    tampon.push(s); boy += s.length + 1;
  }
  bosalt();
  return o;
}

type Dizin = { parcalar: Parca[]; tf: Map<string, number>[]; boy: number[]; df: Map<string, number>; ort: number };
const onbellek = new Map<string, Dizin>();
const imza = (l: AjanBilgi[]) => createHash("sha1").update(l.map((b) => `${b.id}:${b.boyut}:${b.sonYenileme ?? b.eklenme}`).join("|")).digest("hex");
function dizinKur(l: AjanBilgi[]): Dizin {
  const k = imza(l);
  const v = onbellek.get(k);
  if (v) return v;
  const parcalar = l.flatMap(parcala);
  const df = new Map<string, number>();
  const tf = parcalar.map((p) => {
    const m = new Map<string, number>();
    for (const t of [...terimler(p.metin), ...terimler(p.baslik), ...terimler(p.ad)]) m.set(t, (m.get(t) ?? 0) + 1);
    for (const t of m.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    return m;
  });
  const boy = tf.map((m) => [...m.values()].reduce((a, b) => a + b, 0));
  const d: Dizin = { parcalar, tf, boy, df, ort: boy.reduce((a, b) => a + b, 0) / Math.max(1, boy.length) };
  if (onbellek.size > 40) onbellek.delete(onbellek.keys().next().value!);
  onbellek.set(k, d);
  return d;
}

export type Bulgu = Parca & { puan: number };
/** BM25 (k1 1.4, b 0.75). Sorgu terimlerinin yarısından azını içeren zayıf eşleşmeler en alta düşer. */
export function bilgiAra(l: AjanBilgi[], sorgu: string, k = 5): Bulgu[] {
  if (!l.length) return [];
  const q = [...new Set(terimler(sorgu))];
  if (!q.length) return [];
  const d = dizinKur(l);
  const N = d.parcalar.length;
  const o: Bulgu[] = [];
  d.parcalar.forEach((p, i) => {
    let puan = 0, eslesen = 0;
    for (const t of q) {
      const f = d.tf[i].get(t) ?? 0;
      if (!f) continue;
      eslesen++;
      const idf = Math.log(1 + (N - (d.df.get(t) ?? 0) + 0.5) / ((d.df.get(t) ?? 0) + 0.5));
      puan += idf * ((f * 2.4) / (f + 1.4 * (0.25 + 0.75 * (d.boy[i] / d.ort))));
    }
    if (puan > 0) o.push({ ...p, puan: puan * (eslesen / q.length >= 0.5 ? 1 : 0.6) });
  });
  return o.sort((a, b) => b.puan - a.puan).slice(0, k);
}

/** Model için numaralı kaynak bloğu ve alıntı listesi. */
export function kaynakBlogu(bulgular: Bulgu[], bas = 1): { metin: string; liste: Kaynakca[] } {
  const liste: Kaynakca[] = bulgular.map((b, i) => ({ no: bas + i, bilgiId: b.bilgiId, ad: b.ad, url: b.url, parca: b.metin.slice(0, 600) }));
  const metin = bulgular.map((b, i) => `<kaynak no="${bas + i}" belge="${b.ad.replace(/"/g, "'")}"${b.baslik && b.baslik !== b.ad ? ` bolum="${b.baslik.replace(/"/g, "'")}"` : ""}>\n${b.metin}\n</kaynak>`).join("\n");
  return { metin, liste };
}

/** Yanıttaki [1] [2, 3] alıntılarını kaynak listesine eşler (yalnız kullanılanlar). */
export function alintilar(metin: string, liste: Kaynakca[]): Kaynakca[] {
  const nolar = new Set<number>();
  for (const m of metin.matchAll(/\[(\d{1,2}(?:\s*,\s*\d{1,2})*)\]/g)) for (const n of m[1].split(",")) nolar.add(Number(n.trim()));
  return liste.filter((k) => nolar.has(k.no));
}

/* ───────────── Web adresi içe aktarma ───────────── */
const temizle = (ozet: string) => ozet.split("\n").filter((s) => !/^(Renkler:|Yazı tipleri:|İçerik ve yapı|\[görsel|\[düğme|\[bağlantı)/.test(s)).join("\n").trim();
function baglantilar(ozet: string, kokAdres: string): string[] {
  const u = new URL(kokAdres);
  const o: string[] = [];
  for (const m of ozet.matchAll(/\[bağlantı: [^\]]*? → ([^\]\s]+)\]/g)) {
    try {
      const x = new URL(m[1], u);
      if (x.hostname !== u.hostname || !/^https?:$/.test(x.protocol) || /\.(pdf|jpe?g|png|webp|gif|svg|zip|mp4|mp3)$/i.test(x.pathname)) continue;
      x.hash = "";
      const s = x.toString();
      if (s !== u.toString() && !o.includes(s)) o.push(s);
    } catch { /* geçersiz */ }
  }
  return o;
}
/** Tarama ayarı: sayfa sınırı, site haritası, dahil ve hariç yol desenleri (* joker, örneğin /blog/*). */
export type TaramaAyar = { sinir?: number; harita?: boolean; dahil?: string[]; haric?: string[] };
const desen = (d: string) => new RegExp(`^${d.trim().replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`, "i");
export function yolSuz(yol: string, t: TaramaAyar): boolean {
  const d = (t.dahil ?? []).filter(Boolean), h = (t.haric ?? []).filter(Boolean);
  if (h.some((x) => desen(x).test(yol))) return false;
  return !d.length || d.some((x) => desen(x).test(yol));
}
/** Site haritası (sitemap.xml, dizin haritalarında ilk 3 alt harita): aynı alan adındaki sayfa adresleri. */
async function siteHaritasi(kok: string): Promise<string[]> {
  const u = new URL(kok);
  const oku = async (adres: string) => { try { const r = await guvenliFetch(adres, { signal: AbortSignal.timeout(8000) }); return r.ok ? (await r.text()).slice(0, 3_000_000) : ""; } catch { return ""; } };
  const locs = (x: string) => [...x.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].replace(/&amp;/g, "&"));
  const ilk = await oku(`${u.origin}/sitemap.xml`);
  let l = locs(ilk);
  if (/<sitemapindex/i.test(ilk)) { const alt: string[] = []; for (const s of l.slice(0, 3)) alt.push(...locs(await oku(s))); l = alt; }
  return l.filter((x) => { try { const y = new URL(x); return y.hostname === u.hostname && !/\.(pdf|jpe?g|png|webp|gif|svg|zip|mp4|mp3|xml)$/i.test(y.pathname); } catch { return false; } }).slice(0, 500);
}
export const parmakIzi = (metin: string) => createHash("sha1").update(metin.replace(/\s+/g, " ").trim()).digest("hex").slice(0, 16);
/**
 * Sayfayı ve istenirse aynı siteden alt sayfaları okur (önce site haritası, sonra sayfalardaki bağlantılar; dahil ve
 * hariç yollar uygulanır; dört sayfa birlikte). Dönüş: bilgi metni, sayfa sayısı ve sayfa başına parmak izi.
 */
export async function siteIceAktar(adres: string, altSayfa: boolean, t: TaramaAyar = {}): Promise<{ ad: string; url: string; icerik: string; sayfa: number; parmak: Record<string, string> }> {
  const ilk = await siteOku(adres);
  const ilkMetin = [ilk.aciklama, temizle(ilk.ozet)].filter(Boolean).join("\n");
  const bolumler = [`Sayfa: ${ilk.baslik || ilk.url} (${ilk.url})\n${ilkMetin}`];
  const parmak: Record<string, string> = { [ilk.url]: parmakIzi(ilkMetin) };
  let sayfa = 1;
  if (altSayfa) {
    const sinir = Math.max(1, Math.min(50, Math.round(t.sinir ?? 8)));
    const gorulen = new Set<string>([ilk.url]);
    const kuyruk: string[] = [];
    const ekle = (l: string[]) => { for (const x of l) { if (gorulen.has(x)) continue; try { if (!yolSuz(new URL(x).pathname, t)) continue; } catch { continue; } gorulen.add(x); kuyruk.push(x); } };
    if (t.harita) ekle(await siteHaritasi(ilk.url));
    ekle(baglantilar(ilk.ozet, ilk.url));
    while (kuyruk.length && sayfa - 1 < sinir) {
      const grup = kuyruk.splice(0, Math.min(4, sinir - (sayfa - 1)));
      const sonuc = await Promise.all(grup.map((u) => siteOku(u).catch(() => null)));
      for (const s of sonuc) {
        if (!s) continue;
        const m = temizle(s.ozet);
        if (m.length < 80) continue;
        const metin = [s.aciklama, m].filter(Boolean).join("\n");
        bolumler.push(`Sayfa: ${s.baslik || s.url} (${s.url})\n${metin}`);
        parmak[s.url] = parmakIzi(metin);
        sayfa++;
        if (kuyruk.length < 200) ekle(baglantilar(s.ozet, s.url));
      }
    }
  }
  return { ad: ilk.baslik || new URL(ilk.url).hostname, url: ilk.url, icerik: bolumler.join("\n\n").slice(0, 600_000), sayfa, parmak };
}
/** İki parmak izi kümesi arasında eklenen, değişen ve kaldırılan sayfa sayısı. */
export function parmakFarki(eski: Record<string, string> | undefined, yeni: Record<string, string>) {
  if (!eski) return { eklenen: 0, degisen: 0, kaldirilan: 0 };
  let eklenen = 0, degisen = 0;
  for (const [u, p] of Object.entries(yeni)) { if (!(u in eski)) eklenen++; else if (eski[u] !== p) degisen++; }
  return { eklenen, degisen, kaldirilan: Object.keys(eski).filter((u) => !(u in yeni)).length };
}
export const YENILEME_MS = { gunluk: 86_400_000, haftalik: 7 * 86_400_000, aylik: 30 * 86_400_000 } as const;
