import "server-only";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { anlikAl, anlikOku, gecmisliTablolar, gecmisTumu, type GecmisSatir, type Kim } from "./bulutGecmis";
import { veriAyarDegistir, veriAyarOku } from "./bulutVeriAyar";
import {
  koleksiyonAdiGecerli, KURALLAR, semaTemizle, SINIR, veriDegisimZamani, veriDegistir, veriOku, yedekAl, yedekler, yedekYolu,
  type Kayit, type Koleksiyon, type Kurallar, type Veritabani, type VeriOrtami,
} from "./veri";

/**
 * Vayra Bulut yedekleri ve zamana göre geri dönüş (Supabase PITR benzeri).
 *  - Zamana göre geri dönüş: tablonun bugünkü hâlinden başlanır, kayıt geçmişindeki değişiklikler yeniden eskiye geri
 *    sarılır (ekleme geri alınır, güncellemede önceki hâl, silmede silinen kayıt geri konur; toplu değişiklik ve tablo
 *    silmede o anın anlık görüntüsü kurulur). Geçmiş tablo başına 30 gün ya da 2 MB tutulur; daha eskisi için yedek gerekir.
 *    Geçmişe düşmeyen yazımlar (Sistemler otomasyonları, ödeme altyapısı) tutarsızlık olarak sayılır ve bildirilir.
 *  - Otomatik günlük yedek: seçilen saatte (Türkiye saati), veri son yedekten beri değiştiyse alınır; zamanlayıcıya bağlı.
 *  - Yedek içeriği, indirme ve dışarıdan yedek yükleme (Vayra yedek biçimi: { koleksiyonlar }).
 */

export type ZamanFark = { eklenecek: number; silinecek: number; degisecek: number; ayni: number };
export type ZamanTablo = {
  tablo: string; varAnda: boolean; varSimdi: boolean; adetAnda: number; adetSimdi: number; fark: ZamanFark;
  semaDegisti: boolean; kuralDegisti: boolean; geriSarilan: number; tutarsiz: number; eksikAnlik: number;
  enEski: number | null; kesin: boolean; uyarilar: string[];
};
type Kurulum = { k: Koleksiyon | undefined; ozet: ZamanTablo };

const kopya = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

/** Tablonun verilen andaki hâlini kurar (şimdiki: tablonun bugünkü hâli; verilmezse diskten okunur). */
async function tabloyuKur(id: string, ortam: VeriOrtami, tablo: string, an: number, simdiki?: Koleksiyon): Promise<Kurulum> {
  const suan = simdiki ?? (await veriOku(id, ortam)).koleksiyonlar[tablo];
  const satirlar = await gecmisTumu(id, ortam, tablo);
  const enEski = satirlar[0]?.z ?? null;
  let k: Koleksiyon | undefined = suan ? kopya(suan) : undefined;
  const harita = new Map<string, Kayit>((k?.kayitlar ?? []).map((r) => [r.id, r]));
  let geriSarilan = 0, tutarsiz = 0, eksikAnlik = 0;
  const sonra = satirlar.filter((s) => s.z > an).reverse();
  for (const s of sonra) {
    geriSarilan++;
    switch (s.islem) {
      case "ekle": case "geriYukle":
        if (harita.has(s.kayitId)) harita.delete(s.kayitId); else tutarsiz++;
        break;
      case "guncelle":
        if (s.onceki) { if (!harita.has(s.kayitId)) tutarsiz++; harita.set(s.kayitId, s.onceki as Kayit); } else tutarsiz++;
        break;
      case "sil":
        if (s.onceki) { if (harita.has(s.kayitId)) tutarsiz++; harita.set(s.kayitId, s.onceki as Kayit); } else tutarsiz++;
        break;
      case "toplu": case "tabloSil": {
        const a = s.anlik ? await anlikOku(id, ortam, tablo, s.anlik) : null;
        if (!a) { eksikAnlik++; break; }
        harita.clear();
        if (!a.var) { k = undefined; break; }
        for (const r of a.kayitlar) harita.set(String(r.id), r as Kayit);
        k = { kurallar: (a.kurallar as Kurallar) ?? k?.kurallar ?? { okuma: "kapali", ekleme: "kapali", duzenleme: "kapali" }, kayitlar: [], ...(a.sema ? { sema: a.sema as Koleksiyon["sema"] } : {}), ...(a.aciklama ? { aciklama: a.aciklama } : {}) };
        break;
      }
    }
    // Ekleme satırı gelmeden önce tablo hiç yoktu: en eski "ekle"nin öncesinde tablo boş kalır, var kalır.
  }
  const varAnda = !!k || harita.size > 0;
  if (varAnda && !k) k = { kurallar: suan?.kurallar ?? { okuma: "kapali", ekleme: "kapali", duzenleme: "kapali" }, kayitlar: [] };
  if (k) k.kayitlar = [...harita.values()].sort((a, b) => (a.olusturma ?? 0) - (b.olusturma ?? 0));
  const simdiHarita = new Map((suan?.kayitlar ?? []).map((r) => [r.id, r]));
  const fark: ZamanFark = { eklenecek: 0, silinecek: 0, degisecek: 0, ayni: 0 };
  for (const r of k?.kayitlar ?? []) { const x = simdiHarita.get(r.id); if (!x) fark.eklenecek++; else if (JSON.stringify(x) !== JSON.stringify(r)) fark.degisecek++; else fark.ayni++; }
  for (const r of suan?.kayitlar ?? []) if (!harita.has(r.id)) fark.silinecek++;
  const uyarilar: string[] = [];
  if (enEski === null) uyarilar.push("Bu tablonun kayıt geçmişi yok; bugünkü hâli gösteriliyor. Daha eski bir hâl için yedekten dön.");
  else if (an < enEski) uyarilar.push(`Geçmiş ${new Date(enEski).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })} tarihinden başlıyor; daha önceki değişiklikler kayıtlı değil.`);
  if (tutarsiz) uyarilar.push(`${tutarsiz} değişiklik bugünkü veriyle uyuşmadı. Kayıt geçmişine düşmeyen yazımlar (Sistemler otomasyonu, ödeme altyapısı) olabilir.`);
  if (eksikAnlik) uyarilar.push(`${eksikAnlik} toplu değişikliğin anlık görüntüsü yok (30 günden eski ya da 30 MB üstü).`);
  const kesin = enEski !== null && an >= enEski && !tutarsiz && !eksikAnlik;
  return {
    k,
    ozet: {
      tablo, varAnda, varSimdi: !!suan, adetAnda: k?.kayitlar.length ?? 0, adetSimdi: suan?.kayitlar.length ?? 0, fark,
      semaDegisti: JSON.stringify(k?.sema ?? []) !== JSON.stringify(suan?.sema ?? []), kuralDegisti: !!k && !!suan && JSON.stringify(k.kurallar) !== JSON.stringify(suan.kurallar),
      geriSarilan, tutarsiz, eksikAnlik, enEski, kesin, uyarilar,
    },
  };
}

/** Verilen anda bütün tabloların (bugün olan ve geçmişi olan silinmişler) özeti; yalnız değişecek olanlar ve isteğe bağlı hepsi. */
export async function zamandaOzet(id: string, ortam: VeriOrtami, an: number, hepsi = false): Promise<ZamanTablo[]> {
  const v = await veriOku(id, ortam);
  const adlar = [...new Set([...Object.keys(v.koleksiyonlar), ...(await gecmisliTablolar(id, ortam))])].sort();
  const o: ZamanTablo[] = [];
  for (const t of adlar) {
    const r = (await tabloyuKur(id, ortam, t, an, v.koleksiyonlar[t])).ozet;
    const degisir = r.varAnda !== r.varSimdi || r.fark.eklenecek || r.fark.silinecek || r.fark.degisecek || r.semaDegisti || r.kuralDegisti;
    if (hepsi || degisir) o.push(r);
  }
  return o;
}

/** Tek tablonun o andaki kayıtları (önizleme; en çok 200) ve özet. */
export async function zamandaTablo(id: string, ortam: VeriOrtami, tablo: string, an: number) {
  const r = await tabloyuKur(id, ortam, tablo, an);
  const simdi = new Map(((await veriOku(id, ortam)).koleksiyonlar[tablo]?.kayitlar ?? []).map((x) => [x.id, x]));
  const kayitlar = (r.k?.kayitlar ?? []).slice(-200).reverse().map((x) => ({ kayit: x, durum: !simdi.has(x.id) ? "geri" as const : JSON.stringify(simdi.get(x.id)) !== JSON.stringify(x) ? "degisik" as const : "ayni" as const }));
  const silinecek = [...simdi.values()].filter((x) => !(r.k?.kayitlar ?? []).some((y) => y.id === x.id)).slice(0, 50);
  return { ozet: r.ozet, sema: r.k?.sema ?? [], kayitlar, silinecek };
}

/**
 * Tabloları verilen ana döndürür. hedef "yerinde": tablo o andaki hâline kurulur (önce Canlı yedeklenir, bugünkü hâl
 * anlık görüntü olarak geçmişe düşer; işlem de geri alınabilir). hedef "kopya": o andaki hâl yeni bir tabloya yazılır
 * (kurallar kapalı açılır), asıl tabloya dokunulmaz.
 */
export async function zamanaDon(id: string, ortam: VeriOrtami, tablolar: string[], an: number, hedef: "yerinde" | "kopya", kim: Kim): Promise<{ tablo: string; sonuc: string; yeniAd?: string }[]> {
  if (ortam === "canli") await yedekAl(id, "zaman-oncesi").catch(() => null);
  const etiket = new Date(an + 3 * 3600_000).toISOString().slice(0, 16).replace(/[-:]/g, "").replace("T", "_");
  const zamanMetni = new Date(an).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "medium", timeStyle: "short" });
  return veriDegistir(id, async (v) => {
    const o: { tablo: string; sonuc: string; yeniAd?: string }[] = [];
    for (const t of tablolar.filter(koleksiyonAdiGecerli).slice(0, SINIR.koleksiyon)) {
      const r = await tabloyuKur(id, ortam, t, an, v.koleksiyonlar[t]);
      if (hedef === "kopya") {
        if (!r.k) { o.push({ tablo: t, sonuc: "O anda bu tablo yoktu" }); continue; }
        if (Object.keys(v.koleksiyonlar).length >= SINIR.koleksiyon) { o.push({ tablo: t, sonuc: "Tablo sınırı dolu (50)" }); continue; }
        let ad = `${t.slice(0, 26)}_${etiket}`.slice(0, 40), i = 2;
        while (v.koleksiyonlar[ad]) ad = `${t.slice(0, 23)}_${etiket}_${i++}`.slice(0, 40);
        v.koleksiyonlar[ad] = { ...kopya(r.k), kurallar: { okuma: "kapali", ekleme: "kapali", duzenleme: "kapali" }, aciklama: `"${t}" tablosunun ${zamanMetni} hâli` };
        anlikAl(id, ortam, ad, undefined, "toplu", `"${t}" tablosunun ${zamanMetni} hâlinden kopya`, kim);
        o.push({ tablo: t, sonuc: `${r.k.kayitlar.length} kayıtla kopyalandı`, yeniAd: ad });
        continue;
      }
      const simdi = v.koleksiyonlar[t];
      if (!r.k) {
        if (!simdi) { o.push({ tablo: t, sonuc: "Değişiklik yok" }); continue; }
        anlikAl(id, ortam, t, simdi, "tabloSil", `Zamana göre geri dönüş: ${zamanMetni} anında bu tablo yoktu`, kim);
        delete v.koleksiyonlar[t];
        o.push({ tablo: t, sonuc: "O anda yoktu; kaldırıldı" });
        continue;
      }
      if (JSON.stringify(simdi ?? null) === JSON.stringify(r.k)) { o.push({ tablo: t, sonuc: "Değişiklik yok" }); continue; }
      if (!simdi && Object.keys(v.koleksiyonlar).length >= SINIR.koleksiyon) { o.push({ tablo: t, sonuc: "Tablo sınırı dolu (50)" }); continue; }
      anlikAl(id, ortam, t, simdi, "toplu", `Zamana göre geri dönüş: ${zamanMetni}`, kim);
      v.koleksiyonlar[t] = r.k;
      o.push({ tablo: t, sonuc: `${r.k.kayitlar.length} kayıtla ${zamanMetni} hâline döndü` });
    }
    return o;
  }, ortam);
}

/* ───────── Yedek içeriği, yükleme ───────── */

export type YedekTablo = { ad: string; adet: number; sutun: number; kurallar: Kurallar; simdi: number | null; ayni: boolean };
/** Yedekteki tablolar, kayıt sayıları ve bugünkü hâlle karşılaştırma. */
export async function yedekIcerik(id: string, ad: string): Promise<{ tablolar: YedekTablo[]; yalnizSimdi: string[] } | null> {
  const y = yedekYolu(id, ad);
  if (!y) return null;
  let v: Veritabani;
  try { v = JSON.parse(await readFile(y, "utf8")) as Veritabani; } catch { return null; }
  const c = await veriOku(id, "canli");
  const tablolar = Object.entries(v.koleksiyonlar ?? {}).map(([a, k]) => ({ ad: a, adet: k.kayitlar?.length ?? 0, sutun: k.sema?.length ?? 0, kurallar: k.kurallar, simdi: c.koleksiyonlar[a]?.kayitlar.length ?? null, ayni: JSON.stringify(c.koleksiyonlar[a] ?? null) === JSON.stringify(k) })).sort((a, b) => a.ad.localeCompare(b.ad));
  return { tablolar, yalnizSimdi: Object.keys(c.koleksiyonlar).filter((a) => !v.koleksiyonlar?.[a]).sort() };
}

/** Dışarıdan gelen yedeği doğrular ve temizler. Hatalıysa açıklama döner. */
export function yedekDogrula(metin: string): { v: Veritabani; tablo: number; kayit: number } | { hata: string } {
  let j: unknown;
  try { j = JSON.parse(metin); } catch { return { hata: "Dosya geçerli JSON değil." }; }
  const kol = (j as { koleksiyonlar?: unknown })?.koleksiyonlar;
  if (!kol || typeof kol !== "object" || Array.isArray(kol)) return { hata: "Vayra yedeği değil: \"koleksiyonlar\" alanı yok." };
  const v: Veritabani = { koleksiyonlar: {} };
  let kayit = 0;
  for (const [ad, ham] of Object.entries(kol as Record<string, unknown>)) {
    if (!koleksiyonAdiGecerli(ad)) return { hata: `"${ad}" geçerli bir tablo adı değil.` };
    const k = ham as Partial<Koleksiyon>;
    if (!k || !Array.isArray(k.kayitlar)) return { hata: `"${ad}" tablosunda kayıt listesi yok.` };
    if (k.kayitlar.length > SINIR.kayit) return { hata: `"${ad}" tablosunda ${SINIR.kayit} kayıttan fazlası var.` };
    const kr = (k.kurallar ?? {}) as Partial<Kurallar>;
    const kurallar: Kurallar = { okuma: KURALLAR.includes(kr.okuma!) ? kr.okuma! : "kapali", ekleme: KURALLAR.includes(kr.ekleme!) ? kr.ekleme! : "kapali", duzenleme: KURALLAR.includes(kr.duzenleme!) ? kr.duzenleme! : "kapali" };
    const kayitlar: Kayit[] = [];
    for (const r of k.kayitlar) {
      if (!r || typeof r !== "object" || typeof (r as Kayit).id !== "string") return { hata: `"${ad}" tablosunda kimliği olmayan kayıt var.` };
      kayitlar.push(r as Kayit);
    }
    const sema = k.sema ? semaTemizle(k.sema) : null;
    v.koleksiyonlar[ad] = { kurallar, kayitlar, ...(sema?.length ? { sema } : {}), ...(typeof k.aciklama === "string" && k.aciklama ? { aciklama: k.aciklama.slice(0, 300) } : {}) };
    kayit += kayitlar.length;
  }
  if (Object.keys(v.koleksiyonlar).length > SINIR.koleksiyon) return { hata: `Yedekte ${SINIR.koleksiyon} tablodan fazlası var.` };
  return { v, tablo: Object.keys(v.koleksiyonlar).length, kayit };
}

/* ───────── Otomatik günlük yedek (zamanlayıcıdan) ───────── */

type Durum = { son: number };
const G = globalThis as unknown as { __vayraYedekZaman?: Durum };
const durum: Durum = (G.__vayraYedekZaman ??= { son: 0 });
const trSaat = (t = Date.now()) => new Date(t + 3 * 3600_000).getUTCHours();
const trGun = (t = Date.now()) => new Date(t + 3 * 3600_000).toISOString().slice(0, 10);

/** Bir sonraki otomatik yedek zamanı (Türkiye saatiyle seçilen saat). */
export function sonrakiYedek(saat: number, from = Date.now()) {
  const d = new Date(from + 3 * 3600_000);
  let t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), saat) - 3 * 3600_000;
  if (t <= from) t += 864e5;
  return t;
}

/** Zamanlayıcının her turunda çağrılır; 5 dakikada bir bakar. Saati gelen projede, veri değiştiyse yedek alır. */
export async function otomatikYedekTuru() {
  if (Date.now() - durum.son < 5 * 60_000) return;
  durum.son = Date.now();
  const d = path.join(DEPO_KOK, "build", "veri");
  for (const f of await readdir(d).catch(() => [] as string[])) {
    const id = f.replace(/\.json$/, "");
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(id)) continue;
    try {
      const a = await veriAyarOku(id);
      if (!a.yedek.acik || trSaat() !== a.yedek.saat || (a.yedek.sonZamanli && trGun(a.yedek.sonZamanli) === trGun())) continue;
      const son = (await yedekler(id)).find((x) => x.tur === "otomatik" || x.tur === "elle");
      const degisim = await veriDegisimZamani(id);
      let hataMetni: string | undefined;
      if (!son || degisim > son.zaman) { const y = await yedekAl(id, "otomatik").catch((e) => { hataMetni = (e as Error).message; return null; }); if (!y && !hataMetni) hataMetni = "Yedeklenecek veri yok."; }
      await veriAyarDegistir(id, (x) => { x.yedek.sonZamanli = Date.now(); if (hataMetni) x.yedek.sonHata = hataMetni.slice(0, 200); else delete x.yedek.sonHata; });
    } catch { /* bir sonraki tur */ }
  }
}

export type { GecmisSatir };
