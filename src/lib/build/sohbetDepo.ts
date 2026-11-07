import "server-only";
import { randomBytes } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import type { DosyaBilgisi } from "./belgeTipler";
import { sahipOzeti } from "./depo";
import { bellekEtiketiniGizle, etkinYol } from "./sohbetYol";
import { katla, type DuzenleIstegi, type EkSonuc } from "./sohbetTipler";
import type { SohbetKilidi } from "./sohbetKilit";

/**
 * Vayra Build sohbetleri (Claude benzeri genel asistan). Sürüm 2: mesajlar bir ağaçtır (düzenleme ve yeniden deneme
 * dal açar; `ust` + `secim`, bkz. sohbetYol). Modelin API geçmişi her asistan mesajında kendi parçası olarak durur
 * (`api`; yalnız sona eklenir, düşünme blokları değişmez); kullanıcı iletisi metin ve eklerden her turda kurulur.
 * Eski (doğrusal) sohbetler okunurken göç eder: tek parça geçmiş `eskiGecmis` olarak son mesaja bağlanır.
 * Dosyalar: .veri/build/sohbetler/<id>.json, sahip dizini .veri/build/sohbet-sahip/<özet>.json,
 * geçici sohbetler .veri/build/sohbet-gecici/<özet>.json (dizinde görünmez, bir gün sonra silinir).
 */
export type Alinti = { url: string; baslik: string; metin?: string };
export type SohbetParca =
  | { tur: "metin"; metin: string; alintilar?: Alinti[] }
  | { tur: "dusunce"; metin: string; sure?: number }
  | { tur: "arac"; id: string; ad: string; baslik: string; durum: "suruyor" | "bitti" | "hata" | "onay" | "reddedildi"; ayrinti?: string; sonuc?: AracSonucu; girdi?: Record<string, string>; etiket?: string }
  | { tur: "plan"; baslik: string; adimlar: string[]; durum: "hazirlaniyor" | "bekliyor" | "basladi" };
export type AracSonucu =
  | { tur: "gorsel"; urller: string[] }
  | { tur: "video"; url: string; kapak?: string }
  | { tur: "ses"; url: string; baslik?: string }
  | { tur: "3d"; url: string; kapak?: string }
  | { tur: "proje"; id: string; ad: string; projeTur: string; istem: string }
  | { tur: "arama"; kaynaklar: { baslik: string; url: string }[]; sorgu?: string }
  | { tur: "sayfa"; url: string; baslik?: string }
  | { tur: "kod"; cikti?: string; hata?: string }
  /** Sohbette üretilen Word, Excel ya da PowerPoint dosyası (kaynakAd: düzenlenen önceki sürüm). */
  | { tur: "dosya"; dosya: DosyaBilgisi; kaynakAd?: string }
  /** Yanıt içi etkileşimli görsel (HTML, SVG, JS; kum havuzlu çerçevede çizilir). */
  | { tur: "gorsellestirme"; baslik: string; html: string; tip?: string }
  /** v4: tuval, veri analizi, test, bilgi kartları, görev, geçmiş sohbet araması, sesli özet (sohbetTipler). */
  | EkSonuc
  | UygulamaSonucu;
/**
 * MCP Apps: arayüzü olan bir bağlantı aracının sonucu. Görünüm (ui:// kaynağı) sohbette kum havuzlu çerçevede canlı
 * çizilir; girdi ve ham CallToolResult görünüme iletilir. Modelin gördüğü metin sonucu ayrıdır (değişmez).
 * belirtec: yayındaki ajan sayfasında ziyaretçinin görünümü okuyabilmesi için kısa ömürlü şifreli belirteç.
 */
export type UygulamaSonucu = {
  tur: "uygulama"; baglantiId: string; arac: string; baslik?: string; resourceUri: string;
  girdi: Record<string, unknown>;
  sonuc?: { content: unknown[]; structuredContent?: unknown; isError?: boolean; _meta?: Record<string, unknown> };
  /** Çağrı tamamlanamadıysa nedeni (görünüme tool-cancelled gider). */
  iptal?: string;
  servis: { ad: string; logo?: string; acik?: boolean; genis?: boolean };
  ajanId?: string; belirtec?: string;
};
/** Ek: görsel, PDF, metin ya da Office dosyası (ofis: belge deposundaki kayıt). Eski sohbetlerde görsel data URL olarak durur. */
export type SohbetEki = { tur: "gorsel" | "pdf" | "metin" | "ofis"; url: string; ad: string; boyut?: number; mime?: string; bicim?: "docx" | "xlsx" | "pptx"; belge?: string };
/** Kullanıcı mesajıyla gelen tur seçenekleri (yeniden denemede aynen kullanılır). */
export type TurIstegi = {
  arastirma?: boolean; arac?: string; yetenekler?: string[]; baglantilar?: string[]; ajan?: string;
  kurul?: { modeller: string[]; sentez: string };
  /** Seçime sor: önceki yanıttan alıntılanan parça. */
  alinti?: string;
  /** v4: tuvalde çalış, görev çalışması (zamanlanmış), görsel düzenleme, bağlam olarak anılan sohbetler. */
  tuval?: boolean; gorev?: { id: string; ad: string }; duzenle?: DuzenleIstegi; sohbetler?: { id: string; baslik: string }[];
  /** v5: izleme görevinin tetiklenme mesajı. */
  izleme?: { id: string; ad: string };
};
/** Bağlam sıkıştırma: sonMesaj'a kadar (dahil) yol bu özetle değiştirilir (ağaçta kökten o mesaja yol tektir). */
export type SohbetOzeti = { id: string; sonMesaj: string; metin: string; zaman: number; mesaj: number; once: number; sonra: number; model: string; elle?: boolean };
export type IceKaynak = "chatgpt" | "claude" | "ozel";
export type KurulCevabi = { model: string; metin: string; durum: "suruyor" | "bitti" | "hata" | "durduruldu"; hata?: string; kredi?: number; sureMs?: number };
export type Kullanim = { girdi: number; cikti: number; onbellek: number; yazilan: number };
export type SohbetMesaji = {
  id: string; rol: "kullanici" | "asistan"; zaman: number;
  /** Ağaçtaki üst mesaj (ilk mesajda yok). */
  ust?: string | null;
  metin?: string; ekler?: SohbetEki[]; istek?: TurIstegi;
  parcalar?: SohbetParca[]; model?: string; sureMs?: number; kredi?: number; kullanim?: Kullanim; aracKredi?: number;
  durum?: "suruyor" | "bitti" | "durduruldu" | "hata" | "anahtar-yok" | "onay-bekliyor" | "plan-bekliyor"; hata?: string;
  /** Bu turun API iletileri (asistan + araç sonuçları). İstemciye gönderilmez. */
  api?: unknown[];
  mod?: "arastirma" | "kurul";
  kurul?: { cevaplar: KurulCevabi[]; sentez: string };
  /** Yanıtın dayandığı bellek kayıtları. */
  bellek?: { id: string; metin: string }[];
  /** @ ile çağrılan ajan. */
  ajan?: { id: string; ad: string; simge: string };
  /** Sesli okuma dosyası (önbellek). */
  ses?: string;
  /** Ajan çalıştırıcısının iz kaydı (onay sonrası aynı çalışma sürer) ve bilgi kaynağı alıntıları. */
  calisma?: string;
  kaynaklar?: { no: number; ad: string; url?: string; parca: string; bilgiId?: string }[];
  geri?: "iyi" | "kotu";
  /** Turun sonunda bağlamın token büyüklüğü (model bildirdiyse gerçek, yoksa tahmin). */
  baglam?: number;
  /** Yanıtı değiştir: bu sürümün yönü (ör. "Daha kısa"). */
  degistir?: string;
  /** Son yanıtın altındaki takip soruları. */
  oneriler?: string[];
  /** @ ile anılan sohbetlerin metni (kullanıcı mesajında; modele gider, istemciye gönderilmez). */
  ekBaglam?: string;
};
export type BekleyenCagri = { id: string; name: string; input: unknown };
export type IzinModu = "otomatik" | "onay";
export type Sohbet = {
  id: string; baslik: string; olusturma: number; guncelleme: number; model: string; mesajlar: SohbetMesaji[];
  /** Eski tek parça geçmiş (sürüm 1). Sürüm 2'de boş kalır; araç sohbetleri (ajan testi) uyum için tutar. */
  gecmis: unknown[]; sabit?: boolean;
  surum?: 2;
  secim?: Record<string, string>;
  eskiGecmis?: unknown[]; eskiSon?: string;
  /** Ajanla sohbet (ajanın talimatı, araçları, bilgisi ve belleği kullanılır). */
  ajanId?: string;
  /** Ajan düzenleyicisindeki test sohbeti: son çalışmalarda listelenmez. */
  test?: boolean;
  /** Bu sohbette ek olarak açık yetenekler (yetenek düzenleyicisindeki test). */
  yetenekler?: string[];
  /** Kullanıcı onayı bekleyen araç çağrıları (ajan izni "sor" ya da sohbet "Onay iste" modunda). */
  bekleyen?: { asistanId: string; cagrilar: BekleyenCagri[] };
  klasor?: string; arsiv?: boolean; gecici?: boolean;
  izinModu?: IzinModu; izinliAraclar?: string[];
  /** Bu sohbette açık bağlantılar (tanımsızsa "sohbette açık" olanlar). */
  baglantiSecimi?: string[];
  /** Bu sohbette kapatılan "her sohbette" yetenekleri. */
  kapaliYetenekler?: string[];
  bellekKapali?: boolean;
  efor?: "low" | "medium" | "high" | "max";
  paylasim?: { id: string; zaman: number };
  /** Bağlam sıkıştırma özetleri. */
  ozetler?: SohbetOzeti[];
  /** Başka bir asistandan içe aktarılan sohbet. */
  ice?: { kaynak: IceKaynak; kimlik: string; zaman: number };
  /** v4: bu sohbetin tuvalleri, öğrenme kipi, hazır asistan, bağlı zamanlanmış görevler. */
  tuvaller?: string[]; ogrenme?: boolean; asistan?: string; gorevler?: string[];
  /** v5: kilitli sohbet (PIN özeti; istemciye yalnız "kilitli" gider). */
  kilit?: SohbetKilidi;
  /** v5: seninle paylaşılan bir klasördeki sohbet (klasör başka sahibin; talimat ve dosyaları oradan gelir). */
  ortakKlasor?: { sahipOz: string; id: string };
};
export type SohbetOzet = {
  id: string; baslik: string; guncelleme: number; olusturma: number; calisiyor?: boolean; sabit?: boolean; ajanId?: string;
  arsiv?: boolean; klasor?: string; model: string; ozet: string; mesaj: number; kaynak?: IceKaynak; kilitli?: boolean;
};

const KOK = path.join(DEPO_KOK, "build");
const dosya = (id: string) => path.join(KOK, "sohbetler", `${id}.json`);
const dizin = (sahip: string) => path.join(KOK, "sohbet-sahip", `${sahipOzeti(sahip)}.json`);
const geciciDizin = (sahip: string) => path.join(KOK, "sohbet-gecici", `${sahipOzeti(sahip)}.json`);
const KIMLIK = /^[A-Za-z0-9_-]{12}$/;
export const sohbetKimligiGecerli = (id: string) => KIMLIK.test(id);

async function oku<T>(f: string): Promise<T | null> { try { return JSON.parse(await readFile(f, "utf8")) as T; } catch { return null; } }
async function yaz(f: string, v: unknown) { await mkdir(path.dirname(f), { recursive: true }); await writeFile(f, JSON.stringify(v)); }

type Kayitli = Sohbet & { sahip: string };

/** Sürüm 1 → 2: mesajlar doğrusal zincir olur, tek parça geçmiş son mesaja bağlanır. Okurken yapılır, ilk yazışta kalıcı. */
function goc(s: Sohbet): Sohbet {
  if (s.surum === 2) return s;
  let ust: string | null = null;
  for (const m of s.mesajlar) { m.ust = ust; ust = m.id; }
  if (s.gecmis?.length && s.mesajlar.length) { s.eskiGecmis = s.gecmis; s.eskiSon = s.mesajlar[s.mesajlar.length - 1].id; }
  s.gecmis = [];
  s.secim = {};
  s.surum = 2;
  return s;
}

export async function sohbetGetir(id: string, sahip: string): Promise<Sohbet | null> {
  if (!KIMLIK.test(id)) return null;
  const s = await oku<Kayitli>(dosya(id));
  if (!s || s.sahip !== sahipOzeti(sahip)) return null;
  const { sahip: _s, ...t } = s; void _s;
  return goc(t);
}
/** Sahip denetimi olmadan (paylaşım kopyası gibi iç işler için). */
export async function sohbetHam(id: string): Promise<(Sohbet & { sahip: string }) | null> {
  if (!KIMLIK.test(id)) return null;
  const s = await oku<Kayitli>(dosya(id));
  return s ? { ...goc(s), sahip: s.sahip } : null;
}
export async function sohbetKaydet(s: Sohbet, sahip: string) {
  s.gecmis = (s.gecmis ?? []).slice(-600);
  await yaz(dosya(s.id), { ...s, sahip: sahipOzeti(sahip) });
}
/** Sahip özetiyle kaydet (zamanlayıcılar ham anahtarı bilmez). */
export async function sohbetKaydetOz(s: Sohbet, oz: string) {
  s.gecmis = (s.gecmis ?? []).slice(-600);
  await yaz(dosya(s.id), { ...s, sahip: oz });
}
/** Sahip özetiyle yeni sohbet (izleme görevinin sohbeti gibi); dizinin başına eklenir. */
export async function sohbetOlusturOz(oz: string, model: string, baslik: string): Promise<Sohbet> {
  const id = randomBytes(9).toString("base64url").slice(0, 12);
  const s: Sohbet = { id, baslik: baslik.slice(0, 80), olusturma: Date.now(), guncelleme: Date.now(), model, mesajlar: [], gecmis: [], surum: 2, secim: {} };
  await yaz(dosya(id), { ...s, sahip: oz });
  const d = path.join(KOK, "sohbet-sahip", `${oz}.json`);
  const l = (await oku<string[]>(d)) ?? [];
  await yaz(d, [id, ...l.filter((x) => x !== id)].slice(0, 2000));
  return s;
}

/** İstemciye giden görünüm: API geçmişleri çıkarılır. */
export function sohbetAcik(s: Sohbet) {
  const { gecmis: _g, eskiGecmis: _e, kilit, ...acik } = s; void _g; void _e;
  return { ...acik, ...(kilit ? { kilitli: true } : {}), mesajlar: s.mesajlar.map(({ api: _a, ekBaglam: _b, ...m }) => { void _a; void _b; return m; }) };
}

const GECICI_OMUR = 24 * 3600 * 1000;
export async function sohbetOlustur(sahip: string, model: string, ek: { ajanId?: string; test?: boolean; baslik?: string; yetenekler?: string[]; klasor?: string; gecici?: boolean; izinModu?: IzinModu; ortakKlasor?: { sahipOz: string; id: string } } = {}): Promise<Sohbet> {
  const id = randomBytes(9).toString("base64url").slice(0, 12);
  const s: Sohbet = {
    id, baslik: ek.baslik ?? (ek.gecici ? "Geçici sohbet" : "Yeni sohbet"), olusturma: Date.now(), guncelleme: Date.now(), model, mesajlar: [], gecmis: [], surum: 2, secim: {},
    ...(ek.ajanId ? { ajanId: ek.ajanId } : {}), ...(ek.test ? { test: true } : {}), ...(ek.yetenekler?.length ? { yetenekler: ek.yetenekler } : {}),
    ...(ek.klasor ? { klasor: ek.klasor } : {}), ...(ek.ortakKlasor ? { ortakKlasor: ek.ortakKlasor } : {}), ...(ek.gecici ? { gecici: true } : {}), ...(ek.izinModu === "onay" ? { izinModu: "onay" as const } : {}),
  };
  await sohbetKaydet(s, sahip);
  // Süresi dolan geçici sohbetler her yeni sohbette temizlenir.
  const gl = (await oku<{ id: string; zaman: number }[]>(geciciDizin(sahip))) ?? [];
  const kalan = gl.filter((x) => Date.now() - x.zaman < GECICI_OMUR);
  for (const x of gl) if (!kalan.includes(x)) await rm(dosya(x.id), { force: true }).catch(() => {});
  if (ek.gecici) kalan.unshift({ id, zaman: Date.now() });
  if (kalan.length !== gl.length || ek.gecici) await yaz(geciciDizin(sahip), kalan.slice(0, 200));
  if (!ek.test && !ek.gecici) {
    const l = (await oku<string[]>(dizin(sahip))) ?? [];
    await yaz(dizin(sahip), [id, ...l.filter((x) => x !== id)].slice(0, 2000));
  }
  return s;
}

const metinOf = (m: SohbetMesaji) => m.rol === "kullanici" ? m.metin ?? "" : bellekEtiketiniGizle((m.parcalar ?? []).filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join(" ")) || m.kurul?.sentez || "";

function ozetle(id: string, s: Kayitli, calisanlar: Set<string>): SohbetOzet {
  const g = goc(s);
  const yol = etkinYol(g.mesajlar, g.secim);
  const son = [...yol].reverse().find((m) => m.rol === "asistan" && metinOf(m)) ?? yol[yol.length - 1];
  return {
    id, baslik: s.baslik, guncelleme: s.guncelleme, olusturma: s.olusturma ?? s.guncelleme, calisiyor: calisanlar.has(id), sabit: s.sabit, ajanId: s.ajanId,
    arsiv: s.arsiv, klasor: s.klasor, model: s.model, ...(s.ice ? { kaynak: s.ice.kaynak } : {}), ...(s.kilit ? { kilitli: true } : {}), ozet: s.kilit ? "" : son ? metinOf(son).replace(/^\s*[-*]\s+/gm, "").replace(/[#*`>_|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 140) : "", mesaj: yol.length,
  };
}

/** Sahibin sohbetleri. Varsayılan: arşivsiz; { arsiv: true } yalnız arşiv; { klasor } o klasör; { hepsi } hepsi. */
export async function sohbetleriListele(sahip: string, calisanlar: Set<string>, f: { arsiv?: boolean; klasor?: string; hepsi?: boolean } = {}): Promise<SohbetOzet[]> {
  const l = (await oku<string[]>(dizin(sahip))) ?? [];
  const o: SohbetOzet[] = [];
  for (const id of l.slice(0, 400)) {
    const s = await oku<Kayitli>(dosya(id));
    if (!s || !s.mesajlar.length || s.test || s.gecici) continue;
    if (!f.hepsi) {
      if (f.klasor !== undefined) { if (s.klasor !== f.klasor) continue; }
      else if (!!s.arsiv !== !!f.arsiv) continue;
    }
    o.push(ozetle(id, s, calisanlar));
  }
  return o.sort((a, b) => Number(!!b.sabit) - Number(!!a.sabit) || b.guncelleme - a.guncelleme);
}

export type Eslesme = { mesajId: string; rol: "kullanici" | "asistan"; parca: string };
export type AramaSonucu = SohbetOzet & { parca?: string; baslikta: boolean; eslesmeler?: Eslesme[]; gorseller?: string[]; puan?: number };
export type AramaSuzgeci = { gun?: number; tur?: "dosya" | "gorsel" | "kod" | "tuval"; saglayici?: string; klasor?: string; arsiv?: boolean; haric?: string; sinir?: number };

/** Mesajın aranabilir metni: metin, ek adları, araç sonuçlarının başlıkları ve dosya adları. */
function aramaMetni(m: SohbetMesaji): string {
  const p = [metinOf(m), ...(m.ekler ?? []).map((e) => e.ad)];
  for (const x of m.parcalar ?? []) {
    if (x.tur !== "arac" || !x.sonuc) continue;
    const s = x.sonuc;
    if (s.tur === "dosya") p.push(s.dosya.ad);
    else if (s.tur === "tuval" || s.tur === "gorsellestirme" || s.tur === "test" || s.tur === "kartlar" || s.tur === "sesliOzet") p.push(s.baslik);
    else if (s.tur === "gorev") p.push(s.ad);
  }
  return p.filter(Boolean).join(" \n");
}
function turUyar(s: Sohbet, tur: NonNullable<AramaSuzgeci["tur"]>): boolean {
  return s.mesajlar.some((m) => {
    if (tur === "dosya") return (m.ekler ?? []).some((e) => e.tur !== "gorsel") || (m.parcalar ?? []).some((p) => p.tur === "arac" && p.sonuc?.tur === "dosya");
    if (tur === "gorsel") return (m.ekler ?? []).some((e) => e.tur === "gorsel") || (m.parcalar ?? []).some((p) => p.tur === "arac" && p.sonuc?.tur === "gorsel");
    if (tur === "tuval") return (m.parcalar ?? []).some((p) => p.tur === "arac" && p.sonuc?.tur === "tuval");
    return /```/.test(metinOf(m)) || (m.parcalar ?? []).some((p) => p.tur === "arac" && (p.sonuc?.tur === "analiz" || p.sonuc?.tur === "kod"));
  });
}

/**
 * Derin arama (bütün dallar): "tam ifade", -hariç ve kelimeler (hepsi geçmeli; Türkçe karakter ve büyük harf
 * duyarsız). Başlık, mesajlar, ek ve dosya adları aranır. Sohbet başına en çok 3 eşleşme (mesaj kimliğiyle; sonuçtan
 * mesaja atlanır). Puan: başlıkta geçme, eşleşme sayısı, tazelik. Süzgeç: gün, tür, sağlayıcı, klasör, arşiv.
 */
export async function sohbetAra(sahip: string, q: string, calisanlar: Set<string>, f: AramaSuzgeci = {}): Promise<AramaSonucu[]> {
  const ifadeler: string[] = [], kelimeler: string[] = [], haric: string[] = [];
  const kalan = q.replace(/"([^"]{2,120})"/g, (_, x: string) => { ifadeler.push(katla(x.trim())); return " "; });
  for (const p of kalan.split(/\s+/)) { if (!p) continue; if (p.startsWith("-") && p.length > 2) haric.push(katla(p.slice(1))); else if (p.length >= 2 || /\d/.test(p)) kelimeler.push(katla(p)); }
  const terimler = [...ifadeler, ...kelimeler];
  const suzgecVar = !!(f.tur || f.gun || f.saglayici || f.klasor);
  if (!terimler.length && !suzgecVar) return [];
  const l = (await oku<string[]>(dizin(sahip))) ?? [];
  const sinirZaman = f.gun ? Date.now() - f.gun * 86_400_000 : 0;
  const o: AramaSonucu[] = [];
  for (const id of l.slice(0, 800)) {
    if (id === f.haric) continue;
    const s = await oku<Kayitli>(dosya(id));
    if (!s || !s.mesajlar.length || s.test || s.gecici) continue;
    if (!f.arsiv && s.arsiv) continue;
    if (sinirZaman && s.guncelleme < sinirZaman) continue;
    if (f.klasor && s.klasor !== f.klasor) continue;
    if (f.saglayici && !s.model.startsWith(f.saglayici) && !(f.saglayici === "claude" && s.model.includes("claude"))) continue;
    if (f.tur && !turUyar(s, f.tur)) continue;
    const baslikK = katla(s.baslik);
    // Kilitli sohbetin içeriği taranmaz; yalnız başlığıyla bulunur.
    const butun = katla(s.kilit ? s.baslik : [s.baslik, ...s.mesajlar.map(aramaMetni)].join(" \n"));
    if (terimler.some((t) => !butun.includes(t)) || haric.some((t) => butun.includes(t))) continue;
    const eslesmeler: Eslesme[] = [];
    let isabet = 0;
    for (const m of s.kilit ? [] : s.mesajlar) {
      if (!terimler.length) break;
      const t = aramaMetni(m), tk = katla(t);
      const ilkTerim = terimler.find((x) => tk.includes(x));
      if (!ilkTerim) continue;
      for (const x of terimler) isabet += Math.min(5, tk.split(x).length - 1);
      if (eslesmeler.length < 3) {
        const i = tk.indexOf(ilkTerim), b = Math.max(0, i - 60);
        eslesmeler.push({ mesajId: m.id, rol: m.rol, parca: `${b > 0 ? "…" : ""}${t.slice(b, i + ilkTerim.length + 90).replace(/\s+/g, " ").trim()}` });
      }
    }
    const baslikta = terimler.length > 0 && terimler.every((t) => baslikK.includes(t));
    const gorseller = f.tur === "gorsel" ? s.mesajlar.flatMap((m) => [...(m.ekler ?? []).filter((e) => e.tur === "gorsel").map((e) => e.url), ...(m.parcalar ?? []).flatMap((p) => (p.tur === "arac" && p.sonuc?.tur === "gorsel" ? p.sonuc.urller : []))]).slice(0, 4) : undefined;
    const tazelik = Math.max(0, 30 - (Date.now() - s.guncelleme) / 86_400_000) / 10;
    o.push({ ...ozetle(id, s, calisanlar), parca: eslesmeler[0]?.parca, baslikta, eslesmeler, ...(gorseller?.length ? { gorseller } : {}), puan: (baslikta ? 6 : 0) + Math.min(isabet, 20) + tazelik });
  }
  return o.sort((a, b) => (b.puan ?? 0) - (a.puan ?? 0) || b.guncelleme - a.guncelleme).slice(0, f.sinir ?? 40);
}

export async function sohbetSil(id: string, sahip: string) {
  if (!(await sohbetGetir(id, sahip))) return false;
  await rm(dosya(id), { force: true });
  const l = (await oku<string[]>(dizin(sahip))) ?? [];
  if (l.includes(id)) await yaz(dizin(sahip), l.filter((x) => x !== id));
  return true;
}

/** Klasör silinince içindeki sohbetler klasörsüz kalır. */
export async function klasoruBosalt(sahip: string, klasor: string) {
  const l = (await oku<string[]>(dizin(sahip))) ?? [];
  for (const id of l) {
    const s = await oku<Kayitli>(dosya(id));
    if (s?.klasor === klasor) { delete s.klasor; await writeFile(dosya(id), JSON.stringify(s)); }
  }
}

export const yeniMesajId = () => randomBytes(6).toString("base64url");

/* ───────────── İçe aktarma (ChatGPT, Claude, özel JSON) ───────────── */
export type IceSohbet = { kimlik: string; baslik: string; olusturma: number; guncelleme: number; mesajlar: { rol: "kullanici" | "asistan"; metin: string; zaman?: number }[] };
const iceDizin = (sahip: string) => path.join(KOK, "sohbet-ice", `${sahipOzeti(sahip)}.json`);
/** Daha önce aktarılanlar: "<kaynak>:<kimlik>" → sohbet kimliği. */
export async function aktarilanlar(sahip: string): Promise<Record<string, string>> { return (await oku<Record<string, string>>(iceDizin(sahip))) ?? {}; }

/** Sohbetleri Vayra sohbeti olarak ekler (doğrusal zincir, özgün tarihler). Aynı kaynak sohbet ikinci kez eklenmez. */
export async function sohbetleriIceAktar(sahip: string, kaynak: IceKaynak, l: IceSohbet[], model: string): Promise<{ eklenen: { kimlik: string; id: string }[]; atlanan: number }> {
  const harita = await aktarilanlar(sahip);
  const eklenen: { kimlik: string; id: string }[] = [];
  let atlanan = 0;
  const yeniler: string[] = [];
  for (const x of [...l].sort((a, b) => b.guncelleme - a.guncelleme)) {
    const anahtar = `${kaynak}:${x.kimlik}`;
    if (harita[anahtar] && (await oku(dosya(harita[anahtar])))) { atlanan++; continue; }
    const mesajlar: SohbetMesaji[] = [];
    let ust: string | null = null;
    for (const m of x.mesajlar) {
      const metin = m.metin.trim().slice(0, 60000);
      if (!metin) continue;
      const id = yeniMesajId();
      const zaman = m.zaman && Number.isFinite(m.zaman) ? m.zaman : x.olusturma;
      mesajlar.push(m.rol === "kullanici" ? { id, rol: "kullanici", zaman, ust, metin } : { id, rol: "asistan", zaman, ust, parcalar: [{ tur: "metin", metin }], durum: "bitti" });
      ust = id;
    }
    if (!mesajlar.length) { atlanan++; continue; }
    const id = randomBytes(9).toString("base64url").slice(0, 12);
    const s: Sohbet = {
      id, baslik: x.baslik.trim().slice(0, 80) || "İçe aktarılan sohbet", olusturma: x.olusturma, guncelleme: x.guncelleme || x.olusturma, model, mesajlar, gecmis: [], surum: 2, secim: {},
      ice: { kaynak, kimlik: x.kimlik.slice(0, 120), zaman: Date.now() },
    };
    await sohbetKaydet(s, sahip);
    harita[anahtar] = id;
    yeniler.push(id);
    eklenen.push({ kimlik: x.kimlik, id });
  }
  if (yeniler.length) {
    const d = (await oku<string[]>(dizin(sahip))) ?? [];
    // Aktarılanlar eski tarihli olduğundan dizinin sonuna eklenir (yerel sohbetler önde kalır).
    await yaz(dizin(sahip), [...d.filter((x) => !yeniler.includes(x)), ...yeniler].slice(0, 2000));
    await yaz(iceDizin(sahip), harita);
  }
  return { eklenen, atlanan };
}
