import "server-only";
import { anlikAl, type Kim } from "./bulutGecmis";
import { degerCevir, ORTAMA_OZGU, SINIR, veriDegistir, veriOku, yedekAl, type Kayit, type Koleksiyon, type Sutun, type Veritabani, type VeriOrtami } from "./veri";

/**
 * Vayra Bulut ortamları ve dallar (Supabase Branching benzeri). Bir "uç" bir projenin bir ortamıdır: ana projenin Canlı
 * ve Test veritabanı, deneme dalının (taslak proje) kendi veritabanı. Burada:
 *  - Ayrıntılı şema farkı: tablo, sütun (eklenen, kaldırılan, türü ya da kuralı değişen), erişim kuralı ve açıklama.
 *  - Ön denetim: kaynak şema hedefe uygulanırsa hedefteki mevcut kayıtlarla ne olur (zorunlu alanı boş kayıt, yeni türe
 *    uymayan değer, benzersizliği bozan tekrar, seçeneklerde olmayan değer, ilişki hedefi olmayan tablo, açılan erişim).
 *  - Geçiş planı: uygulanacak adımların Türkçe listesi.
 *  - Veri kopyası: kaynaktan hedefe yalnız şema, son N kayıt ya da tümü; kişisel alanlar maskelenebilir. Hedefte
 *    değişen her tablonun önceki hâli kayıt geçmişine anlık görüntü olarak düşer (geri alınabilir).
 */
export type Uc = { id: string; ortam: VeriOrtami };
export type SutunFarki = { ad: string; durum: "eklendi" | "kaldirildi" | "degisti"; once?: Sutun; sonra?: Sutun; alanlar?: string[] };
export type Denetim = { seviye: "engel" | "uyari" | "bilgi"; metin: string; adet?: number };
export type TabloAyrinti = {
  ad: string; durum: "yeni" | "degisti" | "ayni" | "yalnizHedefte"; sutunlar: SutunFarki[];
  kural: { alan: "okuma" | "ekleme" | "duzenleme"; once: string; sonra: string }[]; aciklama: boolean;
  kaynakAdet: number; hedefAdet: number; ortamaOzgu: boolean; denetimler: Denetim[]; plan: string[];
};

const TUR_AD: Record<string, string> = { metin: "metin", uzunMetin: "uzun metin", sayi: "sayı", mantiksal: "evet/hayır", tarih: "tarih", eposta: "e-posta", url: "adres", gorsel: "görsel", secim: "seçim", iliski: "ilişki", json: "JSON" };
const KURAL_AD: Record<string, string> = { herkes: "herkes", uyeler: "üyeler", sahibi: "kaydın sahibi", kapali: "yalnız sen" };
const ALAN_AD: Record<string, string> = { okuma: "okuma", ekleme: "ekleme", duzenleme: "düzenleme" };
const ACIKLIK: Record<string, number> = { kapali: 0, sahibi: 1, uyeler: 2, herkes: 3 };
const kopya = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const bos = (v: unknown) => v === undefined || v === null || v === "";
const sutunTanim = (s: Sutun) => `${TUR_AD[s.tur] ?? s.tur}${s.zorunlu ? ", zorunlu" : ""}${s.benzersiz ? ", benzersiz" : ""}${s.varsayilan !== undefined ? `, varsayılan ${JSON.stringify(s.varsayilan)}` : ""}${s.secenekler?.length ? `, seçenekler ${s.secenekler.join(" | ")}` : ""}${s.iliski ? `, ${s.iliski} tablosuna bağlı` : ""}`;

function sutunFarklari(a: Sutun[] = [], b: Sutun[] = []): SutunFarki[] {
  const o: SutunFarki[] = [];
  const hb = new Map(b.map((s) => [s.ad, s]));
  for (const s of a) {
    const x = hb.get(s.ad);
    if (!x) { o.push({ ad: s.ad, durum: "eklendi", sonra: s }); continue; }
    const alanlar = (["tur", "zorunlu", "benzersiz", "varsayilan", "secenekler", "iliski", "silinince", "aciklama"] as const).filter((k) => JSON.stringify(s[k] ?? null) !== JSON.stringify(x[k] ?? null));
    if (alanlar.length) o.push({ ad: s.ad, durum: "degisti", once: x, sonra: s, alanlar });
  }
  for (const s of b) if (!a.some((x) => x.ad === s.ad)) o.push({ ad: s.ad, durum: "kaldirildi", once: s });
  return o;
}

/** Kaynağın şeması hedefe uygulanırsa hedefteki kayıtlarla çıkacak sorunlar. */
function onDenetim(ad: string, k: Koleksiyon, h: Koleksiyon | undefined, farklar: SutunFarki[], hedefDb: Veritabani, aktarilan: Set<string>): Denetim[] {
  const o: Denetim[] = [];
  const kayitlar = h?.kayitlar ?? [];
  for (const f of farklar) {
    const s = f.sonra;
    if (!s) { if (kayitlar.some((r) => !bos(r[f.ad]))) o.push({ seviye: "bilgi", metin: `"${f.ad}" şemadan çıkar; kayıtlardaki değerleri silinmez.` }); continue; }
    if (s.zorunlu && s.varsayilan === undefined) {
      const n = kayitlar.filter((r) => bos(r[s.ad])).length;
      if (n) o.push({ seviye: "uyari", metin: `"${s.ad}" zorunlu ama ${n} kayıtta boş; bu kayıtlar sonraki düzenlemede hata verir. Varsayılan değer ver ya da önce doldur.`, adet: n });
    }
    if (f.durum === "degisti" && f.alanlar?.includes("tur") || f.durum === "eklendi") {
      const n = kayitlar.filter((r) => !bos(r[s.ad]) && "hata" in degerCevir(s, r[s.ad])).length;
      if (n) o.push({ seviye: "uyari", metin: `"${s.ad}" ${TUR_AD[s.tur]} türüne geçiyor; ${n} kayıttaki değer bu türe uymuyor.`, adet: n });
    }
    if (s.benzersiz) {
      const say = new Map<string, number>();
      for (const r of kayitlar) if (!bos(r[s.ad])) { const v = String(r[s.ad]); say.set(v, (say.get(v) ?? 0) + 1); }
      const tekrar = [...say.values()].filter((n) => n > 1).reduce((t, n) => t + n, 0);
      if (tekrar) o.push({ seviye: "engel", metin: `"${s.ad}" benzersiz olacak ama ${tekrar} kayıtta tekrar eden değer var. Önce tekrarları düzelt.`, adet: tekrar });
    }
    if (s.tur === "secim" && s.secenekler?.length) {
      const n = kayitlar.filter((r) => !bos(r[s.ad]) && !s.secenekler!.includes(String(r[s.ad]))).length;
      if (n) o.push({ seviye: "uyari", metin: `"${s.ad}" seçeneklerinde olmayan ${n} değer var.`, adet: n });
    }
    if (s.tur === "iliski" && s.iliski && !hedefDb.koleksiyonlar[s.iliski] && !aktarilan.has(s.iliski)) o.push({ seviye: "uyari", metin: `"${s.ad}" sütunu "${s.iliski}" tablosuna bağlı ama o tablo hedefte yok.` });
  }
  if (h) for (const a of ["okuma", "ekleme", "duzenleme"] as const) if (ACIKLIK[k.kurallar[a]] > ACIKLIK[h.kurallar[a]]) o.push({ seviye: k.kurallar[a] === "herkes" ? "uyari" : "bilgi", metin: `${ALAN_AD[a][0].toLocaleUpperCase("tr")}${ALAN_AD[a].slice(1)} genişliyor: ${KURAL_AD[h.kurallar[a]]} yerine ${KURAL_AD[k.kurallar[a]]}.` });
  if (!h && Object.keys(hedefDb.koleksiyonlar).length >= SINIR.koleksiyon) o.push({ seviye: "engel", metin: "Hedefte tablo sınırı dolu (50); yeni tablo açılamaz." });
  void ad;
  return o;
}

/** Kaynak ile hedef arasındaki ayrıntılı fark, ön denetim ve geçiş planı. */
export async function semaFarkiAyrinti(kaynak: Uc, hedef: Uc, secili?: string[]): Promise<TabloAyrinti[]> {
  const [a, b] = await Promise.all([veriOku(kaynak.id, kaynak.ortam), veriOku(hedef.id, hedef.ortam)]);
  const adlar = [...new Set([...Object.keys(a.koleksiyonlar), ...Object.keys(b.koleksiyonlar)])].sort();
  const aktarilan = new Set(secili?.length ? secili : Object.keys(a.koleksiyonlar));
  return adlar.map((ad) => {
    const k = a.koleksiyonlar[ad], h = b.koleksiyonlar[ad];
    if (!k) return { ad, durum: "yalnizHedefte" as const, sutunlar: [], kural: [], aciklama: false, kaynakAdet: 0, hedefAdet: h?.kayitlar.length ?? 0, ortamaOzgu: ORTAMA_OZGU.has(ad), denetimler: [], plan: [] };
    const sutunlar = sutunFarklari(k.sema, h?.sema);
    const kural = h ? (["okuma", "ekleme", "duzenleme"] as const).filter((x) => k.kurallar[x] !== h.kurallar[x]).map((x) => ({ alan: x, once: h.kurallar[x], sonra: k.kurallar[x] })) : [];
    const aciklama = (k.aciklama ?? "") !== (h?.aciklama ?? "");
    const durum = !h ? "yeni" as const : sutunlar.length || kural.length || aciklama ? "degisti" as const : "ayni" as const;
    const plan: string[] = [];
    if (!h) plan.push(`"${ad}" tablosu açılır (okuma ${KURAL_AD[k.kurallar.okuma]}, ekleme ${KURAL_AD[k.kurallar.ekleme]}, düzenleme ${KURAL_AD[k.kurallar.duzenleme]})`);
    for (const s of sutunlar) {
      if (s.durum === "eklendi") plan.push(`"${ad}" tablosuna "${s.ad}" sütunu eklenir: ${sutunTanim(s.sonra!)}`);
      else if (s.durum === "kaldirildi") plan.push(`"${ad}" tablosunun şemasından "${s.ad}" çıkarılır`);
      else if (s.alanlar?.length === 1 && s.alanlar[0] === "aciklama") plan.push(`"${ad}.${s.ad}" sütununun açıklaması güncellenir`);
      else plan.push(`"${ad}.${s.ad}" değişir: ${sutunTanim(s.once!)} yerine ${sutunTanim(s.sonra!)}`);
    }
    for (const x of kural) plan.push(`"${ad}" ${ALAN_AD[x.alan]} kuralı: ${KURAL_AD[x.once]} yerine ${KURAL_AD[x.sonra]}`);
    if (aciklama && h) plan.push(`"${ad}" açıklaması güncellenir`);
    return { ad, durum, sutunlar, kural, aciklama, kaynakAdet: k.kayitlar.length, hedefAdet: h?.kayitlar.length ?? 0, ortamaOzgu: ORTAMA_OZGU.has(ad), denetimler: durum === "ayni" ? [] : onDenetim(ad, k, h, sutunlar, b, aktarilan), plan };
  });
}

/* ───────── Veri kopyası ve maskeleme ───────── */

const KISISEL: [RegExp, (i: number) => unknown][] = [
  [/e-?posta|email|mail/i, (i) => `kisi${i + 1}@deneme.vayra.app`],
  [/telefon|^tel$|gsm|cep/i, (i) => `0500 000 ${String(i + 1).padStart(4, "0")}`],
  [/^(ad|adi|adı|soyad|soyadi|soyadı|isim|ad_?soyad|adsoyad|tam_?ad|musteri|müşteri|name|full_?name)$/i, (i) => `Kişi ${i + 1}`],
  [/adres|address/i, () => "Deneme adresi"],
  [/^tc|kimlik|tckn|vergi_?no/i, () => "00000000000"],
  [/iban/i, () => "TR00 0000 0000 0000 0000 0000 00"],
  [/dogum|doğum|birth/i, () => null],
  [/^ip$|ip_?adres/i, () => "0.0.0.0"],
];
/** Kişisel alanları maskeler (e-posta türündeki sütunlar ve ad, telefon, adres, kimlik, IBAN gibi alan adları). */
export function maskele(k: Koleksiyon): { k: Koleksiyon; alanlar: string[] } {
  const epostaSutun = new Set((k.sema ?? []).filter((s) => s.tur === "eposta").map((s) => s.ad));
  // Düz "ad" ya da "isim" ürün adı da olabilir: yalnız tabloda e-posta ya da telefon da varsa kişi adı sayılır.
  const alanAdlari = new Set([...(k.sema ?? []).map((s) => s.ad), ...k.kayitlar.slice(0, 20).flatMap((r) => Object.keys(r))]);
  const kisiTablosu = epostaSutun.size > 0 || [...alanAdlari].some((a) => KISISEL[0][0].test(a) || KISISEL[1][0].test(a));
  const alanlar = new Set<string>();
  const kayitlar = k.kayitlar.map((r, i) => {
    const x: Kayit = { ...r };
    for (const a of Object.keys(x)) {
      if (a === "id" || a === "olusturma" || a === "guncelleme" || a === "uyeId" || bos(x[a])) continue;
      if (/^(ad|adi|adı|isim|name)$/i.test(a) && !kisiTablosu) continue;
      const kural = epostaSutun.has(a) ? KISISEL[0] : KISISEL.find(([re]) => re.test(a));
      if (kural) { x[a] = kural[1](i); alanlar.add(a); }
    }
    if (x.uyeId) { x.uyeId = `deneme-${i + 1}`; alanlar.add("uyeId"); }
    return x;
  });
  return { k: { ...k, kayitlar }, alanlar: [...alanlar] };
}

export type KopyaKip = "sema" | "son" | "tum";
/**
 * Kaynaktan hedefe tablo kopyalar. kip: sema (yalnız şema ve kurallar; hedef kayıtları boşalır), son (son adet kayıt),
 * tum (bütün kayıtlar). maske: kişisel alanlar değiştirilir. Siparişler tablosu (ortama özgü) kopyalanmaz.
 * Hedef Canlı ise önce yedeklenir. Değişen her hedef tablonun önceki hâli geçmişe düşer.
 */
export async function veriKopyala(kaynak: Uc, hedef: Uc, g: { tablolar?: string[]; kip: KopyaKip; adet?: number; maske?: boolean; kim: Kim; aciklama: string }) {
  const a = await veriOku(kaynak.id, kaynak.ortam);
  const secili = (g.tablolar?.length ? g.tablolar : Object.keys(a.koleksiyonlar)).filter((t) => a.koleksiyonlar[t] && !ORTAMA_OZGU.has(t));
  if (hedef.ortam === "canli") await yedekAl(hedef.id, "geri-yukleme-oncesi").catch(() => null);
  const adet = Math.min(SINIR.kayit, Math.max(1, Math.round(Number(g.adet) || 50)));
  const maskeli = new Set<string>();
  const sonuc = await veriDegistir(hedef.id, (v) => {
    const o: { tablo: string; kayit: number }[] = [];
    for (const t of secili) {
      if (!v.koleksiyonlar[t] && Object.keys(v.koleksiyonlar).length >= SINIR.koleksiyon) continue;
      let k = kopya(a.koleksiyonlar[t]);
      k.kayitlar = g.kip === "sema" ? [] : g.kip === "son" ? k.kayitlar.slice(-adet) : k.kayitlar;
      if (g.maske && k.kayitlar.length) { const m = maskele(k); k = m.k; m.alanlar.forEach((x) => maskeli.add(`${t}.${x}`)); }
      anlikAl(hedef.id, hedef.ortam, t, v.koleksiyonlar[t], "toplu", g.aciklama, g.kim);
      v.koleksiyonlar[t] = k;
      o.push({ tablo: t, kayit: k.kayitlar.length });
    }
    return o;
  }, hedef.ortam);
  return { tablolar: sonuc, maskelenen: [...maskeli] };
}

/** Kaynağın şemasını, kurallarını ve açıklamasını hedefe uygular (kayıtlara dokunmaz; olmayan tablo boş açılır). */
export async function semaUygula(kaynak: Uc, hedef: Uc, tablolar: string[], kim: Kim, aciklama: string) {
  const a = await veriOku(kaynak.id, kaynak.ortam);
  if (hedef.ortam === "canli") await yedekAl(hedef.id, "yayin-oncesi").catch(() => null);
  return veriDegistir(hedef.id, (v) => {
    const l: string[] = [];
    for (const t of tablolar) {
      const k = a.koleksiyonlar[t];
      if (!k) continue;
      if (!v.koleksiyonlar[t] && Object.keys(v.koleksiyonlar).length >= SINIR.koleksiyon) continue;
      anlikAl(hedef.id, hedef.ortam, t, v.koleksiyonlar[t], "toplu", aciklama, kim);
      const h = v.koleksiyonlar[t] ??= { kurallar: { ...k.kurallar }, kayitlar: [] };
      h.kurallar = { ...k.kurallar };
      if (k.sema) h.sema = kopya(k.sema); else delete h.sema;
      if (k.aciklama) h.aciklama = k.aciklama; else delete h.aciklama;
      l.push(t);
    }
    return l;
  }, hedef.ortam);
}

/** Veritabanının kısa özeti: tablo ve kayıt sayısı. */
export async function ucOzeti(u: Uc) {
  const v = await veriOku(u.id, u.ortam);
  const l = Object.values(v.koleksiyonlar);
  return { tablo: l.length, kayit: l.reduce((t, k) => t + k.kayitlar.length, 0) };
}
