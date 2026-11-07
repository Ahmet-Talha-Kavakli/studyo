import "server-only";
import { createHash } from "crypto";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import type { SohbetMesaji } from "./sohbetDepo";
import type { PDurum, PMesajBilgi } from "./ajanProsedur";

/**
 * Yayındaki ajanın ziyaretçi konuşmaları (paylaşım sayfası, web sitesi kutusu, API, Telegram, WhatsApp). Ziyaretçi
 * kimliği tarayıcıda üretilen rastgele bir belirteç, API çağıranın verdiği oturum adı ya da kanalın sohbet kimliğidir;
 * diske yalnız özeti yazılır. Konuşma insana devredilebilir: "devredildi" (temsilci bekleniyor) ve "insan"
 * (temsilci yanıtlıyor) durumlarında ajan yanıt vermez. Düzenleyicinin deneme sohbeti ayrı tutulur.
 * Dosyalar: .veri/build/ajan-ziyaret/<ajanId>/<özet>.json, .veri/build/ajan-deneme/<ajanId>.json
 */
export type Kaynak = "sayfa" | "kutu" | "api" | "telegram" | "whatsapp" | "slack" | "eposta" | "messenger" | "instagram" | "telefon" | "sms" | "discord" | "teams" | "line" | "site";
/** Yanıtın dayandığı bilgi kaynağı (alıntı). */
export type Kaynakca = { no: number; bilgiId: string; ad: string; url?: string; parca: string };
/** Konuşma içi olay satırı (yönlendirme, devir, geri devir, anket): sohbette ayraç olarak görünür. */
export type KOlay = { tur: "yonlendirme" | "geri" | "devir" | "insan" | "cozuldu" | "csat" | "prosedur" | "atama"; metin: string };
/** Yanıtı veren ajan (çoklu ajan yönlendirmesinde uzman). */
export type Yanitlayan = { id: string; ad: string; simge: string };
/** Ziyaretçinin web kutusundan yüklediği dosya (güvenli depoda; adres tahmin edilemez). */
export type ZDosya = { id: string; ad: string; tur: string; boyut: number; url: string };
export type KMesaj = SohbetMesaji & { insan?: string; kaynaklar?: Kaynakca[]; calisma?: string; olay?: KOlay; yanitlayan?: Yanitlayan; begeni?: 1 | -1; prosedur?: PMesajBilgi;
  /** Otomatik çeviri: ziyaretçi mesajında temsilcinin dilindeki çeviri; temsilci yanıtında temsilcinin yazdığı özgün metin. */
  ceviri?: { dil: string; metin: string };
  /** Mesajla gelen dosyalar (web kutusundan yükleme). */
  dosyalar?: ZDosya[];
  /** 24 saat penceresi dışında gönderilen WhatsApp şablonu. */
  sablon?: { ad: string; dil: string } };
export type Oncelik = "acil" | "yuksek" | "normal" | "dusuk";
export type Yonlendirme = { zaman: number; kimden: { id: string; ad: string }; kime: { id: string; ad: string }; neden: string; geri?: boolean };
export type IcNot = { id: string; metin: string; yazan: string; zaman: number };
export type KonusmaDurum = "acik" | "devredildi" | "insan" | "cozuldu";
export type ZiyaretciKonusma = {
  mesajlar: KMesaj[]; gecmis: unknown[]; olusturma: number; guncelleme: number; kaynak: Kaynak; site?: string;
  durum?: KonusmaDurum; devir?: { zaman: number; neden: string };
  /** Sohbet öncesi formdan (ad, e-posta, telefon). */
  iletisim?: { ad?: string; eposta?: string; telefon?: string; zaman: number };
  /** Yapay zekâ ya da sezgiyle konulan sonuç etiketi (analitik). */
  etiket?: { sonuc: "cozuldu" | "yukseltildi" | "terk"; kaynak: "model" | "sezgi"; zaman: number };
  /** Temsilci yanıtı bekleyen okunmamış ziyaretçi mesajı var. */
  okunmadi?: boolean;
  /** Kanalın yanıt adresi (Telegram sohbet kimliği, WhatsApp numarası). */
  adres?: string;
  /** Ziyaretçi bellek kapsamı için kimlik özeti. */
  ziyaretci?: string;
  /** Çoklu ajan: konuşmayı şu an yürüten uzman ajan (yoksa ön kapı ajanı) ve uzman başına model geçmişi. */
  aktifAjan?: Yanitlayan & { zaman: number };
  gecmisler?: Record<string, unknown[]>;
  yonlendirmeler?: Yonlendirme[];
  /** Temsilci iç notları (ziyaretçi görmez). */
  notlar?: IcNot[];
  /** Memnuniyet anketi (1-5) ve yapay zekâ tahmini. */
  csat?: { puan: number; yorum?: string; zaman: number };
  csatBekliyor?: boolean;
  tahmin?: { puan: number; neden: string; zaman: number };
  /** Konu etiketleri (elle ya da yapay zekâyla). */
  etiketler?: string[];
  etiketKaynak?: "model" | "elle";
  /** Kalite kuralı ihlalleri (yapay zekâ denetimi). */
  kalite?: { zaman: number; ihlaller: { kural: string; neden: string }[] };
  /** A/B: konuşmanın bağlı olduğu sürüm ve kol. */
  surum?: number; kol?: "A" | "B";
  /** İlk temsilci yanıtına kadar geçen süre (ms) ve temsilci yazıyor zamanı. */
  ilkYanit?: number; yaziyor?: number;
  /** E-posta kanalı: konu ve son iletinin kimliği (yanıt aynı konuya gider). */
  eposta?: { konu: string; mesajId?: string; referanslar?: string };
  /** Son yapay zekâ analizinin zamanı ve o andaki mesaj sayısı (yeni mesaj gelince yeniden analiz edilir). */
  analiz?: { zaman: number; mesaj: number };
  /** Süren prosedür (adım adım iş akışı). */
  prosedur?: PDurum;
  /** Kanallar arası kişi kimliği (Kişiler). */
  kisi?: string;
  /** Ekip: atanan temsilci, öncelik, yanıt bekleyen ilk ziyaretçi mesajının zamanı, çözülme zamanı. */
  atanan?: { id: string; ad: string; zaman: number; kim: "otomatik" | "elle" };
  oncelik?: Oncelik;
  bekleyenZiyaretci?: number;
  cozulme?: number;
  slaUyari?: string[];
  /** Kişi bağlamasında kullanılan kimliklerin özeti (değişmedikçe yeniden bağlanmaz). */
  kisiImza?: string;
  /** Otomatik çeviri: ziyaretçinin tespit edilen dili (ISO 639-1). */
  dil?: string;
  /** Deneme ortamındaki konuşma (canlı analitiğe girmez). */
  ortam?: "deneme";
};
export type KonusmaOzet = {
  id: string; ilk: string; son: string; mesaj: number; guncelleme: number; kaynak: Kaynak; site?: string;
  durum: KonusmaDurum; okunmadi: boolean; iletisim?: ZiyaretciKonusma["iletisim"]; etiket?: ZiyaretciKonusma["etiket"]; devir?: ZiyaretciKonusma["devir"];
  etiketler?: string[]; csat?: number; tahmin?: number; aktifAjan?: string; kol?: "A" | "B"; kaliteIhlal?: number; ilkYanit?: number;
  prosedur?: { ad: string; bekliyor?: string }; kisi?: string; atanan?: ZiyaretciKonusma["atanan"]; oncelik?: Oncelik; bekleyenZiyaretci?: number; cozulme?: number; olusturma: number; ortam?: "deneme";
};

const KOK = path.join(DEPO_KOK, "build", "ajan-ziyaret");
const DENEME = path.join(DEPO_KOK, "build", "ajan-deneme");
export const KIMLIK = /^[A-Za-z0-9_.:-]{8,80}$/;
export const konusmaKimligi = (ajanId: string, kimlik: string) => createHash("sha256").update(`vayra-ziyaret:${ajanId}:${kimlik}`).digest("hex").slice(0, 32);
const dosya = (ajanId: string, kimlik: string) => path.join(KOK, ajanId, `${konusmaKimligi(ajanId, kimlik)}.json`);
const dosyaIdden = (ajanId: string, dosyaId: string) => path.join(KOK, ajanId, `${dosyaId}.json`);

export async function konusmaOku(ajanId: string, kimlik: string): Promise<ZiyaretciKonusma | null> {
  try { return JSON.parse(await readFile(dosya(ajanId, kimlik), "utf8")) as ZiyaretciKonusma; } catch { return null; }
}
async function yazDosya(f: string, k: ZiyaretciKonusma, zamanKoru = false) {
  k.gecmis = k.gecmis.slice(-300);
  k.mesajlar = k.mesajlar.slice(-200);
  if (!zamanKoru || !k.guncelleme) k.guncelleme = Date.now();
  await mkdir(path.dirname(f), { recursive: true });
  await writeFile(f, JSON.stringify(k));
}
export const konusmaYaz = (ajanId: string, kimlik: string, k: ZiyaretciKonusma) => yazDosya(dosya(ajanId, kimlik), k);

const ozet = (id: string, v: ZiyaretciKonusma): KonusmaOzet => {
  const metinOf = (m?: KMesaj) => (m ? (m.rol === "kullanici" ? m.metin ?? "" : m.olay ? m.olay.metin : (m.parcalar ?? []).filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join(" ")) : "");
  return {
    id, ilk: v.mesajlar.find((m) => m.rol === "kullanici")?.metin?.slice(0, 140) ?? "", son: metinOf(v.mesajlar.at(-1)).replace(/```[\s\S]*?```/g, " ").replace(/[#*`>_|]+/g, "").replace(/\s+/g, " ").trim().slice(0, 140),
    mesaj: v.mesajlar.length, guncelleme: v.guncelleme, kaynak: v.kaynak, site: v.site, durum: v.durum ?? "acik", okunmadi: !!v.okunmadi,
    iletisim: v.iletisim, etiket: v.etiket, devir: v.devir,
    etiketler: v.etiketler, csat: v.csat?.puan, tahmin: v.tahmin?.puan, aktifAjan: v.aktifAjan?.ad, kol: v.kol, kaliteIhlal: v.kalite?.ihlaller.length, ilkYanit: v.ilkYanit,
    ...(v.prosedur ? { prosedur: { ad: v.prosedur.ad, bekliyor: v.prosedur.bekleme?.tur } } : {}), kisi: v.kisi, atanan: v.atanan, oncelik: v.oncelik, bekleyenZiyaretci: v.bekleyenZiyaretci, cozulme: v.cozulme, olusturma: v.olusturma, ortam: v.ortam,
  };
};

/** Sahip için: son konuşmaların özeti (ilk soru, son mesaj, kaynak, durum). */
export async function konusmalariListele(ajanId: string, sinir = 60): Promise<KonusmaOzet[]> {
  const k = path.join(KOK, ajanId);
  let l: string[] = [];
  try { l = (await readdir(k)).filter((x) => x.endsWith(".json")); } catch { return []; }
  const z = await Promise.all(l.map(async (f) => ({ f, t: (await stat(path.join(k, f)).catch(() => null))?.mtimeMs ?? 0 })));
  z.sort((a, b) => b.t - a.t);
  const o: KonusmaOzet[] = [];
  for (const { f } of z.slice(0, sinir)) {
    try { o.push(ozet(f.slice(0, -5), JSON.parse(await readFile(path.join(k, f), "utf8")) as ZiyaretciKonusma)); } catch { /* bozuk */ }
  }
  return o;
}
/** Analitik için: dönemdeki bütün konuşmalar (tam kayıt). */
export async function konusmalariOku(ajanId: string, baslangic = 0, sinir = 2000): Promise<(ZiyaretciKonusma & { id: string })[]> {
  const k = path.join(KOK, ajanId);
  let l: string[] = [];
  try { l = (await readdir(k)).filter((x) => x.endsWith(".json")); } catch { return []; }
  const o: (ZiyaretciKonusma & { id: string })[] = [];
  for (const f of l.slice(0, sinir)) {
    try { const v = JSON.parse(await readFile(path.join(k, f), "utf8")) as ZiyaretciKonusma; if (v.guncelleme >= baslangic) o.push({ ...v, id: f.slice(0, -5) }); } catch { /* bozuk */ }
  }
  return o;
}
export async function konusmaDosyadan(ajanId: string, dosyaId: string): Promise<ZiyaretciKonusma | null> {
  if (!/^[a-f0-9]{32}$/.test(dosyaId)) return null;
  try { return JSON.parse(await readFile(dosyaIdden(ajanId, dosyaId), "utf8")) as ZiyaretciKonusma; } catch { return null; }
}

/* Konuşma başına kilit: temsilci yanıtı ile ziyaretçi mesajı aynı anda yazmasın. */
const kilitler = new Map<string, Promise<unknown>>();
export function konusmaKilidi<T>(anahtar: string, f: () => Promise<T>): Promise<T> {
  const once = kilitler.get(anahtar) ?? Promise.resolve();
  const p = once.catch(() => {}).then(f);
  kilitler.set(anahtar, p);
  p.finally(() => { if (kilitler.get(anahtar) === p) kilitler.delete(anahtar); }).catch(() => {});
  return p;
}
/**
 * Sahip işlemi (temsilci yanıtı, durum, etiket): dosya kimliğiyle kilit altında günceller. zamanKoru: okundu
 * işareti, analiz ve "yazıyor" gibi konuşmanın akışını değiştirmeyen yazımlarda son etkinlik zamanı korunur.
 */
export function konusmaGuncelle(ajanId: string, dosyaId: string, f: (k: ZiyaretciKonusma) => void | string, zamanKoru = false): Promise<ZiyaretciKonusma | string | null> {
  return konusmaKilidi(`${ajanId}:${dosyaId}`, async () => {
    const k = await konusmaDosyadan(ajanId, dosyaId);
    if (!k) return null;
    const h = f(k);
    if (typeof h === "string") return h;
    await yazDosya(dosyaIdden(ajanId, dosyaId), k, zamanKoru);
    return k;
  });
}
/** Uzun süren (async) güncelleme: prosedür devamı gibi. f hata metni döndürürse yazılmaz. */
export function konusmaGuncelleAsenkron(ajanId: string, dosyaId: string, f: (k: ZiyaretciKonusma) => Promise<void | string>): Promise<ZiyaretciKonusma | string | null> {
  return konusmaKilidi(`${ajanId}:${dosyaId}`, async () => {
    const k = await konusmaDosyadan(ajanId, dosyaId);
    if (!k) return null;
    const h = await f(k);
    if (typeof h === "string") return h;
    await yazDosya(dosyaIdden(ajanId, dosyaId), k);
    return k;
  });
}
export async function konusmaSil(ajanId: string, dosyaId: string) {
  if (!/^[a-f0-9]{32}$/.test(dosyaId)) return;
  await rm(dosyaIdden(ajanId, dosyaId), { force: true });
}
export async function ajanKonusmalariniSil(ajanId: string) {
  await rm(path.join(KOK, ajanId), { recursive: true, force: true });
  await rm(path.join(DENEME, `${ajanId}.json`), { force: true });
}

/* ───────────── Deneme sohbeti (düzenleyicideki "Dene") ───────────── */
export type DenemeSohbet = {
  mesajlar: KMesaj[]; gecmis: unknown[]; olusturma: number; guncelleme: number;
  /** Taslakla mı yayındaki sürümle mi konuşuluyor. */
  hedef: "taslak" | "yayin";
  bekleyen?: { asistanId: string; cagrilar: { id: string; name: string; input: unknown }[]; calisma: string; ajanId?: string };
  /** Çoklu ajan yönlendirme (denemede de uzman konuşmayı sürdürür). */
  aktifAjan?: Yanitlayan & { zaman: number }; gecmisler?: Record<string, unknown[]>; yonlendirmeler?: Yonlendirme[];
  prosedur?: PDurum;
};
const denemeDosyasi = (ajanId: string) => path.join(DENEME, `${ajanId}.json`);
export async function denemeOku(ajanId: string): Promise<DenemeSohbet | null> {
  try { return JSON.parse(await readFile(denemeDosyasi(ajanId), "utf8")) as DenemeSohbet; } catch { return null; }
}
export async function denemeYaz(ajanId: string, d: DenemeSohbet) {
  d.gecmis = d.gecmis.slice(-300); d.mesajlar = d.mesajlar.slice(-200); d.guncelleme = Date.now();
  await mkdir(DENEME, { recursive: true });
  await writeFile(denemeDosyasi(ajanId), JSON.stringify(d));
}
export const denemeSil = (ajanId: string) => rm(denemeDosyasi(ajanId), { force: true });

/* Ziyaretçi başına hız sınırı (bellek içi): 5 dakikada en çok 15 mesaj. */
const izler = new Map<string, number[]>();
export function hizSiniri(anahtar: string, sinir = 15, pencere = 5 * 60_000): boolean {
  const simdi = Date.now();
  const l = (izler.get(anahtar) ?? []).filter((t) => simdi - t < pencere);
  if (l.length >= sinir) { izler.set(anahtar, l); return false; }
  l.push(simdi); izler.set(anahtar, l);
  if (izler.size > 5000) for (const [k, v] of izler) if (!v.some((t) => simdi - t < pencere)) izler.delete(k);
  return true;
}
