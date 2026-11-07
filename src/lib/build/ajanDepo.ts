import "server-only";
import { createHash, randomBytes } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { sahipOzeti } from "./depo";
import { AJAN_SABLONLARI, AJAN_SIMGELERI, ARAC_KATALOG, type AracIzni } from "./ajanKatalog";
import { VARSAYILAN_MODEL } from "./modeller";
import { prosedurTemizle, type Prosedur } from "./ajanProsedurTip";

/**
 * Vayra Build ajanları. Ajan = kimlik + talimat + model + araç izinleri + bilgi + bellek + başlangıç önerileri +
 * koruma, insana devir ve ekip (davranışı belirleyen, sürümlenen alanlar) ile tetikler, onay politikası, test seti ve
 * kanal ayarları (işletim alanları, sürümlenmez).
 * "Kaydet" taslağı günceller; "Yayınla" taslağın anlık görüntüsünü yeni sürüm olarak dondurur (paylaşım sayfası,
 * web widget'ı, API, Telegram ve WhatsApp yalnız yayındaki sürümü kullanır). Eski kayıtlar okunurken yeni alanlar
 * varsayılanlarla tamamlanır (göç). Dosyalar: .veri/build/ajanlar/<id>.json, sahip dizini .veri/build/ajan-sahip/<özet>.json
 */
export type AjanBilgi = {
  id: string; ad: string; tur: "dosya" | "metin" | "adres"; icerik: string; boyut: number; eklenme: number; url?: string;
  /** "Ne zaman kullanılır": modele bu kaynağın hangi sorular için olduğunu söyler. */
  ne?: string;
  /** Web adresi kaynaklarında zamanlı yenileme. */
  yenile?: "kapali" | "gunluk" | "haftalik" | "aylik";
  /** Alt sayfalar da okunsun mu (aynı siteden; sınır tarama ayarında, varsayılan 8). */
  altSayfa?: boolean;
  /** Tarama ayarı: sayfa sınırı (en çok 50), site haritası, dahil ve hariç yollar. */
  tarama?: { sinir?: number; harita?: boolean; dahil?: string[]; haric?: string[] };
  /** Sayfa başına içerik parmak izi ve son yenilemedeki değişim. */
  parmak?: Record<string, string>; degisim?: { eklenen: number; degisen: number; kaldirilan: number; zaman: number };
  durum?: "hazir" | "yenileniyor" | "hata"; sonYenileme?: number; hata?: string; sayfa?: number;
};
export type BellekNotu = { id: string; metin: string; zaman: number; guncelleme?: number };
/** Ziyaretçiye özel bellek notu: yalnız o ziyaretçinin konuşmalarında kullanılır. */
export type ZiyaretciNotu = BellekNotu & { ziyaretci: string; etiket: string };
export type Koruma = { kisisel: boolean; enjeksiyon: boolean; yasakKonular: string[]; yasakYanit: string };
/** Mesai saatleri: dışında devredilen konuşmada ziyaretçiye ekibin ne zaman döneceği söylenir. gunler: 0 pazar ... 6 cumartesi. */
export type Mesai = { acik: boolean; gunler: number[]; bas: string; bit: string; disari: string };
export type Devir = { acik: boolean; kurallar: string; mesaj: string; mesai?: Mesai };
/** Uzman ajan: ön kapı ajanı konuşmayı ona devreder; "ne" hangi konularda devredileceğini anlatır. */
export type Uzman = { id: string; ne: string };
export type Yonlendirme = { acik: boolean; uzmanlar: Uzman[]; geriDonus: boolean };
export type AjanAyar = {
  ad: string; aciklama: string; talimat: string; simge: string; model: string; efor: "low" | "medium" | "high";
  /** Ana model hata verirse (kesinti, sınır, bağlantı yok) aynı mesajı bir kez yanıtlayan yedek model. */
  yedekModel?: string;
  araclar: Record<string, AracIzni>; bilgi: AjanBilgi[]; baslangiclar: string[]; karsilama: string;
  /** Bağlı yeteneklerin kimlikleri (sahibin yetenekleri). */
  yetenekler: string[];
  /** Bağlı servislerin (MCP bağlantıları) kimlikleri. */
  baglantilar: string[];
  /** Bu ajanın görev verebildiği diğer ajanlar (ekip). */
  ekip: string[];
  koruma: Koruma;
  devir: Devir;
  /** Çoklu ajan yönlendirme (ön kapı ajanı + uzmanlar). */
  yonlendirme: Yonlendirme;
  bellek: { acik: boolean; notlar: BellekNotu[]; ziyaretci?: boolean; ziyaretciNotlar?: ZiyaretciNotu[] };
  /** Deterministik prosedürler (adım adım iş akışları). */
  prosedurler: Prosedur[];
  /** İşletme araçlarının okuduğu Build projesi (sipariş, randevu, stok, yorum). */
  isletmeProje?: string;
};
export type SurumAyar = Omit<AjanAyar, "bellek">;
export type AjanSurum = { no: number; tarih: number; not?: string; ayar: SurumAyar };

/** Web sitesi kutusu görünümü ve davranışı. */
export type KutuAyar = {
  font: "sistem" | "inter" | "serif" | "yuvarlak" | "ozel"; ozelFont: string;
  konum: "sag" | "sol"; bosluk: number;
  baslatici: { tur: "simge" | "etiket" | "gorsel"; etiket: string; gorsel?: string };
  baslik: string;
  proaktif: { acik: boolean; metin: string; gecikme: number };
  form: { acik: boolean; baslik: string; alanlar: ("ad" | "eposta" | "telefon")[] };
  aciklama: string; gizlilik: string; oneriler: boolean;
  /** Tarayıcıda sesli sohbet (mikrofon + sesli yanıt). */
  ses: boolean;
  /** Memnuniyet anketi (1-5) ve mesaj başına beğeni. */
  csat: boolean; begeni: boolean;
  /** Sayfa kuralları: adres yolu eşleşince karşılama balonu bu metinle çıkar (* joker). */
  kurallar: { yol: string; metin: string }[];
  /** Ziyaretçi dosya yüklemesi: açık mı, dosya başına en çok MB (1-10), izinli türler. */
  dosya?: { acik: boolean; enCokMb: number; turler: ("gorsel" | "pdf" | "belge")[] };
};
export type TelegramAyar = { tokenSifreli?: string; tokenSonu?: string; bot?: string; gizli: string; bagli: boolean; hata?: string; adres?: string; sonOlay?: number };
/** Slack uygulaması: bot belirteci (xoxb) ve imza anahtarı şifreli; olaylar imzayla doğrulanır. */
export type SlackAyar = { tokenSifreli?: string; imzaSifreli?: string; tokenSonu?: string; takim?: string; takimId?: string; bot?: string; botKullanici?: string; bagli: boolean; hata?: string; sonOlay?: number };
/** E-posta kanalı: gelen ileti webhook'la gelir (gizli değer adreste); yanıt Resend ile gönderilir. */
export type EpostaAyar = { gizli: string; anahtarSifreli?: string; anahtarSonu?: string; gonderen?: string; imza?: string; sonOlay?: number; hata?: string };
/** Meta Messenger ve Instagram: sayfa erişim belirteci şifreli; webhook doğrulama belirteci ve isteğe bağlı uygulama gizli anahtarı. */
export type MetaAyar = { tokenSifreli?: string; tokenSonu?: string; sayfaId?: string; sayfaAd?: string; igId?: string; igAd?: string; dogrulama: string; uygulamaSifreli?: string; hata?: string; sonOlay?: number };
/** Twilio: sesli arama ve SMS. Auth Token şifreli; istek imzası onunla doğrulanır. */
export type TwilioAyar = { hesap?: string; tokenSifreli?: string; tokenSonu?: string; numara?: string; ses: string; karsilama: string; aktarma?: string; hata?: string; sonOlay?: number };
/** Sürümler arası A/B: yeni konuşmaların "oran" kadarı B sürümüyle konuşur; konuşma kolunda kalır. */
export type AbAyar = { acik: boolean; surum: number; oran: number; baslangic: number };
/** Discord uygulaması: etkileşim uç noktası (Ed25519 imzalı), bölü komutu ve mesaj komutu. Bot belirteci şifreli. */
export type DiscordAyar = { uygulama?: string; anahtar?: string; tokenSifreli?: string; tokenSonu?: string; bot?: string; komut?: boolean; hata?: string; sonOlay?: number };
/** Microsoft Teams (Azure Bot Service): uygulama kimliği, istemci gizli anahtarı şifreli, kiracı; gelen istek JWT ile doğrulanır. */
export type TeamsAyar = { uygulama?: string; sifreSifreli?: string; sifreSonu?: string; kiraci?: string; tur?: "cok" | "tek"; hata?: string; sonOlay?: number; dogrulandi?: boolean };
/** LINE Messaging API: kanal gizli anahtarı (imza) ve kanal erişim belirteci şifreli. */
export type LineAyar = { gizliSifreli?: string; tokenSifreli?: string; tokenSonu?: string; bot?: string; basicId?: string; hata?: string; sonOlay?: number };
/** Kademeli yayın: yeni sürüm yeni konuşmaların "oran" kadarına gider; koruma eşikleri aşılınca kendiliğinden geri alınır. */
export type KademeAyar = {
  acik: boolean; surum: number; onceki: number; oran: number; baslangic: number;
  plan: number[]; otomatik: boolean; adimSaat: number; sonAdim: number;
  koruma: { acik: boolean; devirPuan: number; hataPuan: number; enAz: number };
  gecmis: { zaman: number; olay: string }[];
};
export type WhatsappAyar = { tokenSifreli?: string; tokenSonu?: string; telefonId?: string; /** WhatsApp İşletme Hesabı kimliği (şablon listesi için). */ wabaId?: string; dogrulama: string; uygulamaSifreli?: string; dogrulandi?: boolean; hata?: string; sonOlay?: number };
export type AjanYayin = {
  durum: "taslak" | "yayinda"; surum: number;
  kanallar: { sayfa: boolean; widget: boolean; api: boolean; telegram: boolean; whatsapp: boolean; slack: boolean; eposta: boolean; messenger: boolean; instagram: boolean; telefon: boolean; sms: boolean; discord: boolean; teams: boolean; line: boolean; site: boolean };
  /** Widget/sayfa yalnız bu alan adlarında çalışır (boşsa her yerde). */
  alanlar: string[];
  tema: { vurgu: string; koyu: boolean };
  kutu: KutuAyar;
  telegram: TelegramAyar;
  whatsapp: WhatsappAyar;
  slack: SlackAyar;
  eposta: EpostaAyar;
  meta: MetaAyar;
  twilio: TwilioAyar;
  ab?: AbAyar;
  discord: DiscordAyar; teams: TeamsAyar; line: LineAyar;
  /** Kademeli yayın ve deneme ortamı (canlıdan ayrı adres ve anahtarla açılan sürüm). */
  kademe?: KademeAyar;
  ortam?: { deneme?: { surum: number; zaman: number }; anahtarOzeti?: string; anahtarSonu?: string };
  /** Web kutusunda kimlik doğrulama: site, ziyaretçinin e-postasını bu anahtarla HMAC imzalar (şifreli). */
  kimlik?: { anahtarSifreli?: string; anahtarSonu?: string; zorunlu?: boolean };
  /** Vayra İşletme sitelerinin canlı sohbet eklentisi: ilk yanıtı bu ajan verir. */
  siteSohbet?: { projeler: string[] };
  /** API anahtarının özeti (anahtar yalnız bir kez gösterilir). */
  anahtarOzeti?: string; anahtarSonu?: string;
  /** Günlük ziyaretçi mesaj tavanı (kredi koruması). */
  gunlukTavan: number;
};

import type { ZamanKural } from "./ajanZaman";
export type { ZamanKural };
export type AjanTetik = {
  id: string; tur: "zaman" | "webhook"; ad: string; acik: boolean; olusturma: number;
  /** Ajana verilecek görev. Webhook'ta {{veri}} gelen yükle doldurulur. */
  gorev: string;
  metin?: string; kural?: ZamanKural; sonraki?: number;
  gizli?: string; filtre?: string;
  sonCalisma?: number; sonDurum?: string; ustUsteHata: number; duraklatma?: string;
};
/** Onay politikası: araç başına "bir daha sorma", bağlantı başına "yalnız yazmada sor", günlük tavanlar. */
export type OnayPolitika = {
  /** Günde en çok kaç araç işlemi onaysız (otomatik) çalışır; 0 sınırsız. Aşılınca ajan sorar. */
  otomatikTavan: number;
  /** Günde en çok kaç zamanlı ya da webhook çalışması; 0 sınırsız. */
  tetikTavan: number;
  /** Onayda "bir daha sorma" denen araçlar (bağlantı araçları dahil). */
  birDahaSorma: string[];
  /** Bağlantı başına: bağlantının kendi izni, yalnız yazma işlemlerinde sor ya da her işlemde sor. */
  baglantiIzin: Record<string, "baglanti" | "yazmada" | "hep">;
  sayac?: { gun: string; otomatik: number; tetik: number };
};
/**
 * Test: tek soru ya da persona (yapay zekâ müşteriyi canlandırır, çok turlu konuşma). Persona testinde soru isteğe bağlı
 * ilk mesajdır; boşsa ilk mesajı da canlandırıcı yazar. kaynak: elle, CSV ya da gerçek bir konuşmadan üretildi.
 */
export type AjanTest = { id: string; soru: string; beklenen: string; olusturma: number; tur?: "tek" | "persona"; persona?: string; turSiniri?: number; kaynak?: "elle" | "csv" | "konusma" };

export type Ajan = AjanAyar & {
  id: string; olusturma: number; guncelleme: number; sablon?: string;
  yayin: AjanYayin; surumler: AjanSurum[];
  istatistik: { sohbet: number; mesaj: number; kredi: number; ziyaretciMesaj: number; gunluk?: { gun: string; sayi: number } };
  tetikler: AjanTetik[];
  onay: OnayPolitika;
  testler: AjanTest[];
  /** Konuşma etiketleri (konu kümeleri) ve yapay zekâyla otomatik etiketleme. */
  konular: { etiketler: { ad: string; tarif?: string }[]; otomatik: boolean };
  /** Kalite kuralları: her konuşma bu cümlelere göre yapay zekâyla denetlenir, uymayanlar işaretlenir. */
  kalite: { kurallar: string[] };
  /** Prosedür başına sayaçlar. */
  prosedurIstat?: Record<string, { baslayan: number; tamamlanan: number; devredilen: number; iptal: number; son?: number }>;
  /** Düzenleyicideki eski test sohbeti (genel sohbet altyapısı). */
  testSohbet?: string;
};
export type AjanOzet = Pick<Ajan, "id" | "ad" | "aciklama" | "simge" | "model" | "guncelleme" | "sablon"> & { yayinda: boolean; surum: number; araclar: string[]; sohbet: number; tetik: number };

const KOK = path.join(DEPO_KOK, "build");
const dosya = (id: string) => path.join(KOK, "ajanlar", `${id}.json`);
const dizin = (sahip: string) => path.join(KOK, "ajan-sahip", `${sahipOzeti(sahip)}.json`);
const dizinOz = (sahipOz: string) => path.join(KOK, "ajan-sahip", `${sahipOz}.json`);
/** Arka plan işleri için dizin: tetikli ya da yenilenen kaynaklı ajanlar (kimlik, sahip özeti). */
const ARKA = path.join(KOK, "ajan-arka.json");
export const KIMLIK = /^[A-Za-z0-9_-]{10}$/;

async function oku<T>(f: string): Promise<T | null> { try { return JSON.parse(await readFile(f, "utf8")) as T; } catch { return null; } }
async function yaz(f: string, v: unknown) { await mkdir(path.dirname(f), { recursive: true }); await writeFile(f, JSON.stringify(v)); }
type Kayitli = Ajan & { sahip: string };
const rastgele = (n = 9) => randomBytes(n).toString("base64url");

export const varsayilanKoruma = (): Koruma => ({ kisisel: false, enjeksiyon: true, yasakKonular: [], yasakYanit: "Bu konuda yardımcı olamıyorum. Başka bir sorunda yardımcı olabilirim." });
export const varsayilanMesai = (): Mesai => ({ acik: false, gunler: [1, 2, 3, 4, 5], bas: "09:00", bit: "18:00", disari: "Ekibimiz şu an mesai dışında. Mesajını aldık; ilk iş gününde buradan yanıt vereceğiz." });
export const varsayilanDevir = (): Devir => ({ acik: false, kurallar: "", mesaj: "Sorunu ekibimize ilettim; bir temsilci en kısa sürede buradan yanıt verecek.", mesai: varsayilanMesai() });
export const varsayilanYonlendirme = (): Yonlendirme => ({ acik: false, uzmanlar: [], geriDonus: true });
const devirTamamla = (d?: Partial<Devir>): Devir => { const v = varsayilanDevir(); return { ...v, ...(d ?? {}), mesai: { ...v.mesai!, ...(d?.mesai ?? {}) } }; };
/** Kutu dosya ayarı: sınırlar sunucuda zorlanır (en çok 10 MB, bilinen türler). */
export function kutuDosyaTemizle(x: unknown): NonNullable<KutuAyar["dosya"]> {
  const d = (x ?? {}) as Partial<NonNullable<KutuAyar["dosya"]>>;
  const turler = (Array.isArray(d.turler) ? d.turler : ["gorsel", "pdf"]).filter((t): t is "gorsel" | "pdf" | "belge" => t === "gorsel" || t === "pdf" || t === "belge");
  return { acik: d.acik === true, enCokMb: Math.min(10, Math.max(1, Math.round(Number(d.enCokMb) || 5))), turler: turler.length ? [...new Set(turler)] : ["gorsel"] };
}
export const varsayilanKutu = (): KutuAyar => ({
  font: "sistem", ozelFont: "", konum: "sag", bosluk: 20, baslatici: { tur: "simge", etiket: "Sohbet et" }, baslik: "",
  proaktif: { acik: false, metin: "Merhaba! Yardımcı olabileceğim bir şey var mı?", gecikme: 8 },
  form: { acik: false, baslik: "Başlamadan önce seni tanıyalım", alanlar: ["ad", "eposta"] },
  aciklama: "Yanıtları yapay zekâ üretir; önemli bilgileri doğrula.", gizlilik: "", oneriler: true,
  ses: false, csat: true, begeni: true, kurallar: [],
});
const bosYayin = (): AjanYayin => ({
  durum: "taslak", surum: 0, kanallar: { sayfa: true, widget: true, api: false, telegram: false, whatsapp: false, slack: false, eposta: false, messenger: false, instagram: false, telefon: false, sms: false, discord: false, teams: false, line: false, site: false }, alanlar: [],
  tema: { vurgu: "#55d6fd", koyu: true }, kutu: varsayilanKutu(), telegram: { gizli: rastgele(18), bagli: false },
  whatsapp: { dogrulama: rastgele(12) }, slack: { bagli: false }, eposta: { gizli: rastgele(15) }, meta: { dogrulama: rastgele(12) },
  twilio: { ses: "Polly.Filiz", karsilama: "Merhaba, size nasıl yardımcı olabilirim?" }, gunlukTavan: 300, discord: {}, teams: { tur: "cok" }, line: {},
});
const bosOnay = (): OnayPolitika => ({ otomatikTavan: 0, tetikTavan: 50, birDahaSorma: [], baglantiIzin: {} });

/** Surum anlık görüntüsünü yeni alanlarla tamamlar (eski sürümler). */
export function surumAyarTamamla(s: Partial<SurumAyar>): SurumAyar {
  return {
    ad: s.ad ?? "Adsız ajan", aciklama: s.aciklama ?? "", talimat: s.talimat ?? "", simge: s.simge ?? AJAN_SIMGELERI[0], model: s.model ?? VARSAYILAN_MODEL, ...(s.yedekModel ? { yedekModel: s.yedekModel } : {}),
    efor: s.efor ?? "medium", araclar: s.araclar ?? {}, bilgi: s.bilgi ?? [], baslangiclar: s.baslangiclar ?? [], karsilama: s.karsilama ?? "",
    yetenekler: s.yetenekler ?? [], baglantilar: s.baglantilar ?? [], ekip: s.ekip ?? [],
    koruma: { ...varsayilanKoruma(), ...(s.koruma ?? {}) }, devir: devirTamamla(s.devir),
    yonlendirme: { ...varsayilanYonlendirme(), ...(s.yonlendirme ?? {}) },
    prosedurler: (s.prosedurler ?? []).map(prosedurTemizle), ...(s.isletmeProje ? { isletmeProje: s.isletmeProje } : {}),
  };
}

/** Okunan kaydı güncel biçime getirir (eksik alanlar varsayılanlarla). Yerinde değiştirir. */
export function ajanTamamla<T extends Partial<Ajan>>(a: T): T & Ajan {
  const x = a as T & Ajan;
  x.yetenekler ??= []; x.baglantilar ??= []; x.ekip ??= []; x.bilgi ??= []; x.baslangiclar ??= []; x.karsilama ??= "";
  x.koruma = { ...varsayilanKoruma(), ...(x.koruma ?? {}) };
  x.devir = devirTamamla(x.devir);
  x.yonlendirme = { ...varsayilanYonlendirme(), ...(x.yonlendirme ?? {}) };
  x.prosedurler ??= [];
  x.konular = { ...{ etiketler: [] as { ad: string; tarif?: string }[], otomatik: false }, ...(x.konular ?? {}) };
  x.kalite = { ...{ kurallar: [] as string[] }, ...(x.kalite ?? {}) };
  x.bellek = { ...{ acik: false, notlar: [] as BellekNotu[] }, ...(x.bellek ?? {}) };
  x.bellek.ziyaretciNotlar ??= [];
  const y = bosYayin();
  x.yayin = { ...y, ...(x.yayin ?? {}) } as AjanYayin;
  x.yayin.kanallar = { ...y.kanallar, ...(x.yayin.kanallar ?? {}) };
  x.yayin.tema = { ...y.tema, ...(x.yayin.tema ?? {}) };
  const k = x.yayin.kutu ?? {} as Partial<KutuAyar>;
  x.yayin.kutu = { ...y.kutu, ...k, kurallar: k.kurallar ?? [], baslatici: { ...y.kutu.baslatici, ...(k.baslatici ?? {}) }, proaktif: { ...y.kutu.proaktif, ...(k.proaktif ?? {}) }, form: { ...y.kutu.form, ...(k.form ?? {}) }, dosya: kutuDosyaTemizle(k.dosya) };
  x.yayin.telegram = { ...y.telegram, ...(x.yayin.telegram ?? {}) };
  x.yayin.whatsapp = { ...y.whatsapp, ...(x.yayin.whatsapp ?? {}) };
  x.yayin.slack = { ...y.slack, ...(x.yayin.slack ?? {}) };
  x.yayin.eposta = { ...y.eposta, ...(x.yayin.eposta ?? {}) };
  x.yayin.meta = { ...y.meta, ...(x.yayin.meta ?? {}) };
  x.yayin.twilio = { ...y.twilio, ...(x.yayin.twilio ?? {}) };
  x.yayin.discord = { ...y.discord, ...(x.yayin.discord ?? {}) };
  x.yayin.teams = { ...y.teams, ...(x.yayin.teams ?? {}) };
  x.yayin.line = { ...y.line, ...(x.yayin.line ?? {}) };
  x.surumler = (x.surumler ?? []).map((s) => ({ ...s, ayar: surumAyarTamamla(s.ayar ?? {}) }));
  x.istatistik = { ...{ sohbet: 0, mesaj: 0, kredi: 0, ziyaretciMesaj: 0 }, ...(x.istatistik ?? {}) };
  x.tetikler = (x.tetikler ?? []).map((t) => ({ ...t, ustUsteHata: t.ustUsteHata ?? 0 }));
  x.onay = { ...bosOnay(), ...(x.onay ?? {}) };
  x.testler ??= [];
  return x;
}

export const ozetle = (a: Ajan): AjanOzet => ({
  id: a.id, ad: a.ad, aciklama: a.aciklama, simge: a.simge, model: a.model, guncelleme: a.guncelleme, sablon: a.sablon,
  yayinda: a.yayin.durum === "yayinda", surum: a.yayin.surum, araclar: Object.entries(a.araclar).filter(([, v]) => v !== "kapali").map(([k]) => k), sohbet: a.istatistik.sohbet,
  tetik: (a.tetikler ?? []).filter((t) => t.acik).length,
});

async function hamOku(id: string): Promise<Kayitli | null> {
  if (!KIMLIK.test(id)) return null;
  const a = await oku<Kayitli>(dosya(id));
  return a ? (ajanTamamla(a) as Kayitli) : null;
}
const sahipsiz = (a: Kayitli): Ajan => { const { sahip: _s, ...t } = a; void _s; return t; };

export async function ajanGetir(id: string, sahip: string): Promise<Ajan | null> {
  const a = await hamOku(id);
  return a && a.sahip === sahipOzeti(sahip) ? sahipsiz(a) : null;
}
/** Sahip özetiyle ajan (sistemler ve zamanlayıcı arka planda çalışırken). */
export async function ajanGetirOz(id: string, sahipOz: string): Promise<Ajan | null> {
  const a = await hamOku(id);
  return a && a.sahip === sahipOz ? sahipsiz(a) : null;
}
/** Sahip denetimi olmadan ajan + sahip özeti (webhook, Telegram, WhatsApp uçları kendi gizli değerleriyle doğrular). */
export async function ajanHam(id: string): Promise<{ ajan: Ajan; sahipOz: string } | null> {
  const a = await hamOku(id);
  return a ? { ajan: sahipsiz(a), sahipOz: a.sahip } : null;
}
/** Yayındaki ajan (sahip denetimi olmadan): paylaşım sayfası, widget, API. Sahip özeti de döner (kredi/sohbet için). */
export async function yayindakiAjan(id: string): Promise<{ ajan: Ajan; ayar: SurumAyar; sahipOzeti: string } | null> {
  const a = await hamOku(id);
  if (!a || a.yayin.durum !== "yayinda") return null;
  const s = a.surumler.find((x) => x.no === a.yayin.surum) ?? a.surumler.at(-1);
  if (!s) return null;
  // Web sitesi kaynakları canlı eşitlenir: yayındaki sürüm, aynı kaynağın taslaktaki son okunan içeriğini kullanır.
  const canli = new Map(a.bilgi.filter((b) => b.tur === "adres").map((b) => [b.id, b]));
  const ayar = canli.size ? { ...s.ayar, bilgi: s.ayar.bilgi.map((b) => { const c = b.tur === "adres" ? canli.get(b.id) : undefined; return c && c.durum !== "hata" ? { ...b, icerik: c.icerik, boyut: c.boyut, sayfa: c.sayfa, sonYenileme: c.sonYenileme } : b; }) } : s.ayar;
  return { ajan: sahipsiz(a), ayar, sahipOzeti: a.sahip };
}
export async function ajanKaydet(a: Ajan, sahip: string) {
  a.guncelleme = Date.now();
  await yaz(dosya(a.id), { ...a, sahip: sahipOzeti(sahip) });
  await arkaGuncelle(a, sahipOzeti(sahip));
}
/* Aynı ajana eşzamanlı yazımlar sıraya girer (oku-değiştir-yaz yarışı olmasın). */
const kilitler = new Map<string, Promise<unknown>>();
function kilitle<T>(id: string, f: () => Promise<T>): Promise<T> {
  const once = kilitler.get(id) ?? Promise.resolve();
  const p = once.catch(() => {}).then(f);
  kilitler.set(id, p);
  p.finally(() => { if (kilitler.get(id) === p) kilitler.delete(id); }).catch(() => {});
  return p;
}

type GuncelleSonuc = Promise<{ ajan: Ajan; hata?: undefined } | { hata: string; ajan?: undefined } | null>;
/**
 * Ajanı kilit altında taze okuyup günceller. f bir hata metni döndürürse yazılmaz.
 * Dönüş: { ajan } ya da { hata } ya da ajan yoksa null.
 */
export function ajanGuncelle(id: string, sahip: string, f: (a: Ajan) => void | string | Promise<void | string>): GuncelleSonuc {
  return ajanGuncelleOz(id, sahipOzeti(sahip), f);
}
export function ajanGuncelleOz(id: string, sahipOz: string, f: (a: Ajan) => void | string | Promise<void | string>): GuncelleSonuc {
  return kilitle(id, async () => {
    const a = await ajanGetirOz(id, sahipOz);
    if (!a) return null;
    const h = await f(a);
    if (typeof h === "string") return { hata: h };
    a.guncelleme = Date.now();
    await yaz(dosya(id), { ...a, sahip: sahipOz });
    await arkaGuncelle(a, sahipOz);
    return { ajan: a };
  });
}

/** Sayaç ve bellek gibi küçük güncellemeler (sahip anahtarı olmadan; yayındaki ajan için de). */
export function ajanSayacArtir(id: string, f: (a: Ajan) => void) {
  return kilitle(id, async () => {
    const a = await hamOku(id);
    if (!a) return;
    f(a);
    await yaz(dosya(id), a);
  });
}

const varsayilanAraclar = () => Object.fromEntries(ARAC_KATALOG.filter((a) => a.kategori === "arastirma").map((a) => [a.id, "her-zaman" as AracIzni]));

export async function ajanOlustur(sahip: string, g: Partial<AjanAyar> & { sablon?: string }): Promise<Ajan> {
  const id = randomBytes(8).toString("base64url").slice(0, 10);
  const s = g.sablon ? AJAN_SABLONLARI.find((x) => x.id === g.sablon) : undefined;
  const a: Ajan = ajanTamamla({
    id, olusturma: Date.now(), guncelleme: Date.now(), sablon: s?.id,
    ad: (g.ad ?? s?.ad ?? "Yeni ajan").slice(0, 60),
    aciklama: (g.aciklama ?? s?.aciklama ?? "").slice(0, 300),
    talimat: (g.talimat ?? s?.talimat ?? "").slice(0, 32000),
    simge: g.simge ?? s?.simge ?? AJAN_SIMGELERI[Math.floor(Math.random() * AJAN_SIMGELERI.length)],
    model: g.model ?? s?.model ?? VARSAYILAN_MODEL, ...(g.yedekModel ? { yedekModel: g.yedekModel } : {}), efor: g.efor ?? "medium",
    araclar: g.araclar ?? (s ? { ...s.araclar } : varsayilanAraclar()),
    bilgi: [], baslangiclar: (g.baslangiclar ?? s?.baslangiclar ?? []).slice(0, 4), yetenekler: g.yetenekler ?? [], baglantilar: g.baglantilar ?? [], ekip: g.ekip ?? [],
    karsilama: g.karsilama ?? s?.karsilama ?? "",
    koruma: g.koruma ?? { ...varsayilanKoruma(), ...(s?.koruma ?? {}) }, devir: g.devir ?? devirTamamla(s?.devir), yonlendirme: g.yonlendirme ?? varsayilanYonlendirme(),
    prosedurler: (g.prosedurler ?? s?.prosedurler ?? []).map(prosedurTemizle),
    konular: { etiketler: (s?.etiketler ?? []).map((ad) => ({ ad })), otomatik: false }, kalite: { kurallar: [] },
    bellek: { acik: false, notlar: [] },
    yayin: bosYayin(), surumler: [],
    istatistik: { sohbet: 0, mesaj: 0, kredi: 0, ziyaretciMesaj: 0 },
    tetikler: [], onay: bosOnay(), testler: [],
  });
  await ajanKaydet(a, sahip);
  const l = (await oku<string[]>(dizin(sahip))) ?? [];
  await yaz(dizin(sahip), [id, ...l.filter((x) => x !== id)].slice(0, 500));
  return a;
}
export async function ajanlariListele(sahip: string): Promise<AjanOzet[]> {
  return (await ajanlariListeleOz(sahipOzeti(sahip))).map(ozetle).sort((a, b) => b.guncelleme - a.guncelleme);
}
/** Sahibin ajanlarının tamamı (görevler, ekip seçimi). */
export async function ajanlariListeleOz(sahipOz: string): Promise<Ajan[]> {
  const l = (await oku<string[]>(dizinOz(sahipOz))) ?? [];
  const o: Ajan[] = [];
  for (const id of l.slice(0, 300)) { const a = await hamOku(id); if (a && a.sahip === sahipOz) o.push(sahipsiz(a)); }
  return o;
}
export async function ajanSil(id: string, sahip: string) {
  if (!(await ajanGetir(id, sahip))) return false;
  await rm(dosya(id), { force: true });
  const l = (await oku<string[]>(dizin(sahip))) ?? [];
  await yaz(dizin(sahip), l.filter((x) => x !== id));
  await arkaKaldir(id);
  return true;
}

/* ───────────── Arka plan dizini (zamanlayıcı) ───────────── */
type Arka = Record<string, string>;
let arkaZincir: Promise<unknown> = Promise.resolve();
const arkaGerekli = (a: Ajan) => !!a.yayin.kademe?.acik || a.tetikler.some((t) => t.tur === "zaman" && t.acik) || a.bilgi.some((b) => b.tur === "adres" && b.yenile && b.yenile !== "kapali") || !!a.konular?.otomatik || !!a.kalite?.kurallar.length;
function arkaYaz(f: (d: Arka) => boolean) {
  const p = arkaZincir.catch(() => {}).then(async () => { const d = (await oku<Arka>(ARKA)) ?? {}; if (f(d)) await yaz(ARKA, d); });
  arkaZincir = p;
  return p;
}
async function arkaGuncelle(a: Ajan, sahipOz: string) {
  const gerek = arkaGerekli(a);
  const d = (await oku<Arka>(ARKA)) ?? {};
  if (gerek === (d[a.id] === sahipOz)) return;
  await arkaYaz((x) => { if (gerek) x[a.id] = sahipOz; else delete x[a.id]; return true; });
}
const arkaKaldir = (id: string) => arkaYaz((x) => { if (!(id in x)) return false; delete x[id]; return true; });
export async function arkaAjanlar(): Promise<{ id: string; sahipOz: string }[]> {
  return Object.entries((await oku<Arka>(ARKA)) ?? {}).map(([id, sahipOz]) => ({ id, sahipOz }));
}

/* ───────────── Sürümler ───────────── */
/** Taslağı yeni sürüm olarak dondurur ve yayına alır. */
export function surumDondur(a: Ajan, not?: string): AjanSurum {
  const ayar = surumAyari(a);
  const no = (a.surumler.at(-1)?.no ?? 0) + 1;
  const s: AjanSurum = { no, tarih: Date.now(), not: not?.slice(0, 140), ayar: JSON.parse(JSON.stringify(ayar)) };
  a.surumler = [...a.surumler, s].slice(-30);
  a.yayin.surum = no; a.yayin.durum = "yayinda";
  return s;
}
export function ayarAl(a: Ajan): AjanAyar {
  return {
    ad: a.ad, aciklama: a.aciklama, talimat: a.talimat, simge: a.simge, model: a.model, ...(a.yedekModel ? { yedekModel: a.yedekModel } : {}), efor: a.efor, araclar: a.araclar, bilgi: a.bilgi,
    baslangiclar: a.baslangiclar, karsilama: a.karsilama, yetenekler: a.yetenekler ?? [], baglantilar: a.baglantilar ?? [], ekip: a.ekip ?? [],
    koruma: a.koruma, devir: a.devir, yonlendirme: a.yonlendirme, bellek: a.bellek, prosedurler: a.prosedurler ?? [], ...(a.isletmeProje ? { isletmeProje: a.isletmeProje } : {}),
  };
}
/** Taslağın sürümlenen kısmı (bellek hariç; bilgi kaynaklarının durum alanları karşılaştırmaya girmez). */
export function surumAyari(a: Ajan): SurumAyar {
  const { bellek: _b, ...t } = ayarAl(a); void _b;
  return surumAyarTamamla(t);
}
const karsilastirilabilir = (s: SurumAyar) => JSON.stringify({ ...s, prosedurler: s.prosedurler.map((p) => ({ ...p, guncelleme: 0 })), bilgi: s.bilgi.map((b) => ({ id: b.id, ad: b.ad, icerik: b.tur === "adres" ? b.url ?? "" : b.icerik, ne: b.ne ?? "" })) });
/** Taslak yayındaki sürümden farklı mı (yayınlanmamış değişiklik var mı)? */
export function taslakFarkli(a: Ajan): boolean {
  const s = a.surumler.find((x) => x.no === a.yayin.surum);
  if (!s) return true;
  return karsilastirilabilir(surumAyari(a)) !== karsilastirilabilir(surumAyarTamamla(s.ayar));
}

export const anahtarOzeti = (k: string) => createHash("sha256").update(`vayra-ajan:${k}`).digest("hex");
export function yeniApiAnahtari(): string { return `vyr_${randomBytes(24).toString("base64url")}`; }
export const yeniKimlik = (n = 8) => randomBytes(n).toString("base64url").slice(0, n);

/** Türkiye günü (YYYY-MM-DD). */
export const trGun = (t = Date.now()) => new Date(t + 3 * 3600_000).toISOString().slice(0, 10);

/** Tarayıcıya giden ajan: şifreli belirteçler, gizli değerler ve ziyaretçi belleği çıkarılır. */
export type IstemciAjan = Omit<Ajan, "yayin" | "bellek"> & {
  yayin: Omit<AjanYayin, "anahtarOzeti" | "telegram" | "whatsapp" | "slack" | "eposta" | "meta" | "twilio" | "discord" | "teams" | "line" | "kimlik" | "ortam"> & {
    discord: Omit<DiscordAyar, "tokenSifreli">; teams: Omit<TeamsAyar, "sifreSifreli">; line: Omit<LineAyar, "tokenSifreli" | "gizliSifreli"> & { gizli: boolean };
    kimlik?: { anahtarSonu?: string; zorunlu?: boolean }; ortam?: { deneme?: { surum: number; zaman: number }; anahtarSonu?: string }; telegram: Omit<TelegramAyar, "tokenSifreli" | "gizli">; whatsapp: Omit<WhatsappAyar, "tokenSifreli" | "uygulamaSifreli"> & { uygulama: boolean }; slack: Omit<SlackAyar, "tokenSifreli" | "imzaSifreli">;
    eposta: Omit<EpostaAyar, "anahtarSifreli">; meta: Omit<MetaAyar, "tokenSifreli" | "uygulamaSifreli"> & { uygulama: boolean }; twilio: Omit<TwilioAyar, "tokenSifreli"> };
  bellek: Omit<Ajan["bellek"], "ziyaretciNotlar"> & { ziyaretciSayi: number };
};
export function istemciAjan(a: Ajan): IstemciAjan {
  const { anahtarOzeti: _o, telegram, whatsapp, slack, eposta, meta, twilio, discord, teams, line, kimlik, ortam, ...y } = a.yayin; void _o;
  const { tokenSifreli: _d, ...dc } = discord ?? {}; void _d;
  const { sifreSifreli: _ms, ...ms } = teams ?? {}; void _ms;
  const { tokenSifreli: _l, gizliSifreli: lg, ...ln } = line ?? {}; void _l;
  const yeni = { discord: dc, teams: ms, line: { ...ln, gizli: !!lg }, ...(kimlik ? { kimlik: { anahtarSonu: kimlik.anahtarSonu, zorunlu: kimlik.zorunlu } } : {}), ...(ortam ? { ortam: { deneme: ortam.deneme, anahtarSonu: ortam.anahtarSonu } } : {}) };
  const { anahtarSifreli: _e, ...ep } = eposta; void _e;
  const { tokenSifreli: _m, uygulamaSifreli: mu, ...me } = meta; void _m;
  const { tokenSifreli: _tw, ...tw } = twilio; void _tw;
  const { tokenSifreli: _s, imzaSifreli: _i, ...sl } = slack ?? { bagli: false }; void _s; void _i;
  const { tokenSifreli: _t, gizli: _g, ...tg } = telegram; void _t; void _g;
  const { tokenSifreli: _w, uygulamaSifreli, ...wa } = whatsapp; void _w;
  const { ziyaretciNotlar, ...b } = a.bellek;
  return { ...a, yayin: { ...y, ...yeni, telegram: tg, whatsapp: { ...wa, uygulama: !!uygulamaSifreli }, slack: sl, eposta: ep, meta: { ...me, uygulama: !!mu }, twilio: tw }, bellek: { ...b, ziyaretciSayi: ziyaretciNotlar?.length ?? 0 } };
}
