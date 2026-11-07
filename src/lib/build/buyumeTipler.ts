/**
 * Vayra Build — Büyüme (pazarlama ajanı) ortak tipleri ve saf yardımcıları (istemci + sunucu).
 * Veri projeden ayrı tutulur: .veri/build/buyume/<projeId>.json (bkz. buyumeDepo.ts).
 * Normalleştiriciler hem model çıktısını hem de istemciden gelen düzenlemeleri aynı kurallardan geçirir.
 */

/* ── Kanallar ── */
export type PlanKanalId = "instagram" | "tiktok" | "google-ads" | "meta" | "eposta" | "seo" | "whatsapp" | "linkedin" | "x" | "ozel";
export type IcerikKanalId = "instagram" | "hikaye" | "tiktok" | "linkedin" | "x" | "whatsapp" | "eposta" | "ozel";

/** Logo: resmî renkli işaret (public/marka). Logo yoksa (e-posta) simge adı. */
export type KanalTanim = { id: PlanKanalId; ad: string; logo?: string; simge?: "posta" | "ozel"; alt: string };
export const PLAN_KANALLARI: KanalTanim[] = [
  { id: "instagram", ad: "Instagram", logo: "/marka/renkli/instagram-color.svg", alt: "Gönderi, hikâye ve Reels" },
  { id: "tiktok", ad: "TikTok", logo: "/marka/renkli/tiktok-color.svg", alt: "Kısa dikey video" },
  { id: "google-ads", ad: "Google Ads", logo: "/marka/renkli/google-ads.svg", alt: "Arama ağı reklamları" },
  { id: "meta", ad: "Meta reklam", logo: "/marka/renkli/meta-color.svg", alt: "Instagram ve Facebook reklamları" },
  { id: "eposta", ad: "E-posta", simge: "posta", alt: "Bülten ve otomatik e-postalar" },
  { id: "seo", ad: "SEO", logo: "/marka/renkli/google-color.svg", alt: "Google aramada görünmek" },
  { id: "whatsapp", ad: "WhatsApp", logo: "/marka/renkli/whatsapp-color.svg", alt: "Durum, katalog ve mesaj" },
  { id: "linkedin", ad: "LinkedIn", logo: "/marka/renkli/linkedin-color.svg", alt: "Profesyonel kitle" },
  { id: "x", ad: "X", logo: "/marka/renkli/x-beyaz.svg", alt: "Kısa metin ve gündem" },
  { id: "ozel", ad: "Özel", simge: "ozel", alt: "Listede olmayan bir kanal" },
];
export const planKanali = (id: string) => PLAN_KANALLARI.find((k) => k.id === id) ?? PLAN_KANALLARI[PLAN_KANALLARI.length - 1];

/** İçerik kanalları: karakter sınırı (metin ve hashtag'ler birlikte), önerilen hashtag sayısı, görsel oranı. */
export type IcerikKanal = { id: IcerikKanalId; ad: string; plan: PlanKanalId; sinir: number; hashtag: [number, number]; oran: string; oranAd: string; konu?: number; aciklama: string };
export const ICERIK_KANALLARI: IcerikKanal[] = [
  { id: "instagram", ad: "Instagram gönderisi", plan: "instagram", sinir: 2200, hashtag: [3, 8], oran: "4:5", oranAd: "4:5 dikey", aciklama: "Akışta en çok yer kaplayan dikey kare" },
  { id: "hikaye", ad: "Instagram hikâyesi", plan: "instagram", sinir: 200, hashtag: [0, 3], oran: "9:16", oranAd: "9:16 tam ekran", aciklama: "Görselin üstünde kısa yazı" },
  { id: "tiktok", ad: "TikTok", plan: "tiktok", sinir: 4000, hashtag: [3, 6], oran: "9:16", oranAd: "9:16 tam ekran", aciklama: "Kapak görseli ve açıklama" },
  { id: "linkedin", ad: "LinkedIn", plan: "linkedin", sinir: 3000, hashtag: [2, 5], oran: "1.91:1", oranAd: "1.91:1 yatay", aciklama: "Profesyonel ton, bağlantılı görsel" },
  { id: "x", ad: "X gönderisi", plan: "x", sinir: 280, hashtag: [0, 2], oran: "16:9", oranAd: "16:9 yatay", aciklama: "Kısa ve net tek mesaj" },
  { id: "whatsapp", ad: "WhatsApp durumu", plan: "whatsapp", sinir: 700, hashtag: [0, 0], oran: "9:16", oranAd: "9:16 tam ekran", aciklama: "Müşteri listene görünen durum" },
  { id: "eposta", ad: "E-posta bülteni", plan: "eposta", sinir: 2000, hashtag: [0, 0], oran: "2:1", oranAd: "2:1 üst görsel", konu: 60, aciklama: "Konu satırı, metin ve üst görsel" },
  { id: "ozel", ad: "Özel kanal", plan: "ozel", sinir: 1000, hashtag: [0, 5], oran: "1:1", oranAd: "1:1 kare", aciklama: "Adını, sınırını ve oranını sen belirle" },
];
export const icerikKanali = (id: string) => ICERIK_KANALLARI.find((k) => k.id === id) ?? ICERIK_KANALLARI[ICERIK_KANALLARI.length - 1];
/** Plan kanalından içerik kanalına (takvim öğesinden gönderi üretirken). Reklam ve SEO kanallarının gönderisi yok. */
export const PLANDAN_ICERIGE: Partial<Record<PlanKanalId, IcerikKanalId>> = { instagram: "instagram", tiktok: "tiktok", linkedin: "linkedin", x: "x", whatsapp: "whatsapp", eposta: "eposta", meta: "instagram" };
export const ORANLAR = ["1:1", "4:5", "9:16", "16:9", "1.91:1", "2:1", "3:4", "4:3"];

/* ── Hedef, ton, niyet, eşleme ── */
export type HedefId = "ilk-100" | "rezervasyon" | "ziyaretci" | "satis" | "bilinirlik" | "eposta" | "indirme" | "oyuncu" | "ozel";
export const HEDEFLER: { id: HedefId; ad: string; alt: string }[] = [
  { id: "ilk-100", ad: "İlk 100 müşteri", alt: "Sıfırdan ilk ödeyen müşterilere ulaş" },
  { id: "rezervasyon", ad: "Rezervasyon artışı", alt: "Masa, randevu ya da kayıt sayısını artır" },
  { id: "ziyaretci", ad: "Daha çok ziyaretçi", alt: "Siteye gelen trafiği büyüt" },
  { id: "satis", ad: "Online satış", alt: "Sepet ve siparişleri artır" },
  { id: "bilinirlik", ad: "Marka bilinirliği", alt: "Bölgende ve sektöründe tanın" },
  { id: "eposta", ad: "E-posta listesi", alt: "Abone topla, tekrar gelenleri artır" },
  { id: "indirme", ad: "Uygulama indirme", alt: "Mağazada indirme ve aktif kullanıcı" },
  { id: "oyuncu", ad: "Oyuncu kazanmak", alt: "Oynayan ve geri dönen oyuncu sayısı" },
  { id: "ozel", ad: "Özel", alt: "Hedefini kendi cümlenle yaz" },
];
export const hedefAdi = (p: { hedef: HedefId; hedefOzel?: string }) => (p.hedef === "ozel" ? p.hedefOzel?.trim() || "Özel hedef" : HEDEFLER.find((h) => h.id === p.hedef)?.ad ?? "Hedef");

export type TonId = "samimi" | "profesyonel" | "esprili" | "ilham" | "bilgi" | "ozel";
export const TONLAR: { id: TonId; ad: string; alt: string }[] = [
  { id: "samimi", ad: "Samimi", alt: "Sıcak, sen diliyle" },
  { id: "profesyonel", ad: "Profesyonel", alt: "Net, güven veren" },
  { id: "esprili", ad: "Esprili", alt: "Hafif, akılda kalan" },
  { id: "ilham", ad: "İlham verici", alt: "Hikâye anlatan" },
  { id: "bilgi", ad: "Bilgilendirici", alt: "İpucu ve rehber" },
  { id: "ozel", ad: "Özel", alt: "Tonu kendin tarif et" },
];

export type NiyetId = "bilgi" | "karsilastirma" | "satin-alma" | "yerel" | "marka";
export const NIYETLER: { id: NiyetId; ad: string; alt: string }[] = [
  { id: "bilgi", ad: "Bilgi edinme", alt: "Nasıl yapılır, nedir" },
  { id: "karsilastirma", ad: "Karşılaştırma", alt: "En iyi, hangisi, fark" },
  { id: "satin-alma", ad: "Satın alma", alt: "Fiyat, sipariş, rezervasyon" },
  { id: "yerel", ad: "Yerel arama", alt: "Yakınımda, semt adıyla" },
  { id: "marka", ad: "Marka araması", alt: "Markanın adıyla arayanlar" },
];
export type EslemeId = "genis" | "sirali" | "tam";
export const ESLEMELER: { id: EslemeId; ad: string }[] = [{ id: "genis", ad: "Geniş eşleme" }, { id: "sirali", ad: "Sıralı eşleme" }, { id: "tam", ad: "Tam eşleme" }];

/** Meta reklamlarının harekete geçirici düğmeleri (Türkçe arayüzdeki adlarıyla) ve Özel. */
export const META_CTA = ["Daha Fazla Bilgi Al", "Şimdi Alışveriş Yap", "Rezervasyon Yap", "Kaydol", "Sipariş Ver", "Bize Ulaşın", "Mesaj Gönder", "Hemen Ara", "Menüyü Gör", "Teklif Al", "İndir"];

export const SINIR = { gBaslik: 30, gAciklama: 90, gYol: 15, gBaslikSayi: 15, gAciklamaSayi: 4, mBirincil: 125, mBaslik: 40, mAciklama: 30, metaBaslik: 60, metaAciklama: 155 };

/* ── Veri tipleri ── */
export type Oncelik = "yuksek" | "orta" | "dusuk";
export type Persona = { id: string; ad: string; yas: string; tanim: string; ihtiyaclar: string[]; kanallar: string[] };
export type PlanKanal = { id: string; kanal: PlanKanalId; ozelAd?: string; oncelik: Oncelik; neden: string; siklik: string; butce: number };
export type TakvimTur = "gonderi" | "reklam" | "eposta" | "blog" | "gorev";
export type TakvimOgesi = { id: string; gun: number; kanal: PlanKanalId; tur: TakvimTur; baslik: string; aciklama: string };
export type OlcumId = "ziyaretci" | "sosyal" | "ucretli" | "eposta" | "arama" | "form" | "yok";
export type Metrik = { id: string; ad: string; hedef: string; neden: string; olcum: OlcumId };
export type ButceKalemi = { id: string; ad: string; kanal?: PlanKanalId; tutar: number; not?: string };
export type GorevTur = "site" | "icerik" | "reklam" | "blog" | "elle";
export type Gorev = { id: string; baslik: string; aciklama: string; tur: GorevTur; kanal?: IcerikKanalId; ajanIstemi?: string; bitti: boolean };

export type BuyumePlan = {
  hedef: HedefId; hedefOzel?: string; butceSiniri?: number; not?: string;
  ozet: string; konumlandirma: string;
  personalar: Persona[]; kanallar: PlanKanal[]; takvim: TakvimOgesi[]; metrikler: Metrik[];
  butce: { kalemler: ButceKalemi[]; not: string };
  gorevler: Gorev[];
  /** Takvimin ilk günü (YYYY-MM-DD, Türkiye günü). */
  baslangic: string;
  olusturma: number; model?: string;
};

export type GonderiDurum = "taslak" | "hazir" | "paylasildi";
export const DURUMLAR: { id: GonderiDurum; ad: string }[] = [{ id: "taslak", ad: "Taslak" }, { id: "hazir", ad: "Hazır" }, { id: "paylasildi", ad: "Paylaşıldı" }];
export type OzelKanal = { ad: string; sinir: number; oran: string };
export type Gonderi = {
  id: string; kanal: IcerikKanalId; ozelKanal?: OzelKanal; konu: string; ton?: string;
  /** Yalnız e-posta: konu satırı. */ baslik?: string;
  metin: string; hashtagler: string[]; gorselIstemi: string;
  gorsel?: string; gorselHata?: string;
  durum: GonderiDurum; tarih?: string; takvimId?: string;
  /** Paylaşım saati (SS:DD, Türkiye); kuyruk ve elle paylaşım hatırlatması için. */ saat?: string;
  /** Elle paylaşımdan sonra yapıştırılan gönderi adresi. */ paylasimAdresi?: string;
  olusturma: number; guncelleme: number;
};

export type AnahtarKelime = { id: string; kelime: string; eslesme: EslemeId; niyet: NiyetId };
export type ReklamSeti = {
  google: { basliklar: string[]; aciklamalar: string[]; yol1: string; yol2: string };
  meta: { birincil: string; baslik: string; aciklama: string; cta: string };
  anahtarKelimeler: AnahtarKelime[]; negatifler: string[];
  olusturma: number; model?: string;
};

export type BlogKonu = { id: string; baslik: string; anahtarKelime: string; niyet: NiyetId; neden: string };
export type BlogMakale = { id: string; konuId?: string; baslik: string; anahtarKelime: string; slug: string; metaBaslik: string; metaAciklama: string; markdown: string; olusturma: number; guncelleme: number; siteyeEklendi?: number; model?: string };

export type BuyumeVeri = {
  plan: BuyumePlan | null;
  /** "Yeniden oluştur" öncesi plan: tek tıkla geri dönülür. */
  oncekiPlan?: BuyumePlan | null;
  gonderiler: Gonderi[];
  reklam: ReklamSeti | null;
  blog: { konular: BlogKonu[]; makaleler: BlogMakale[]; konuZaman?: number };
  /** Lansman listesinde kullanıcının elle işaretledikleri. */
  kontrol: Record<string, boolean>;
  guncelleme: number;
};
export const bosVeri = (): BuyumeVeri => ({ plan: null, oncekiPlan: null, gonderiler: [], reklam: null, blog: { konular: [], makaleler: [] }, kontrol: {}, guncelleme: 0 });

/* ── Saf yardımcılar ── */
export const kimlik = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
/** Karakter sayısı (emoji ve Türkçe harfler tek sayılır). */
export const say = (s: string) => [...(s ?? "")].length;
export const gonderiUzunlugu = (g: Pick<Gonderi, "metin" | "hashtagler">) => say(g.metin) + (g.hashtagler.length ? 2 + say(g.hashtagler.join(" ")) : 0);
export const gonderiSiniri = (g: Pick<Gonderi, "kanal" | "ozelKanal">) => (g.kanal === "ozel" && g.ozelKanal ? g.ozelKanal.sinir : icerikKanali(g.kanal).sinir);
export const gonderiOrani = (g: Pick<Gonderi, "kanal" | "ozelKanal">) => (g.kanal === "ozel" && g.ozelKanal ? g.ozelKanal.oran : icerikKanali(g.kanal).oran);
export const gonderiKanalAdi = (g: Pick<Gonderi, "kanal" | "ozelKanal">) => (g.kanal === "ozel" && g.ozelKanal?.ad ? g.ozelKanal.ad : icerikKanali(g.kanal).ad);
export const oranSayi = (o: string) => { const [a, b] = o.split(":").map(Number); return a > 0 && b > 0 ? a / b : 1; };
export const gonderiMetni = (g: Pick<Gonderi, "metin" | "hashtagler" | "baslik">) => [g.baslik ? `Konu: ${g.baslik}` : "", g.metin.trim(), g.hashtagler.join(" ")].filter(Boolean).join("\n\n");

/** Türkiye günü (YYYY-MM-DD). */
/** Bugünün tarihi: saat dilimi verilirse o dilimde, verilmezse bu cihazın saat diliminde (panel), sunucuda UTC. */
export const bugunTR = (t = Date.now(), tz?: string) => { try { return new Date(t).toLocaleDateString("en-CA", tz ? { timeZone: tz } : {}); } catch { return new Date(t).toISOString().slice(0, 10); } };
export const tarihGecerli = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + "T12:00:00Z"));
export function tarihEkle(iso: string, gun: number): string { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + gun); return d.toISOString().slice(0, 10); }
export const gunFarki = (a: string, b: string) => Math.round((Date.parse(a + "T12:00:00Z") - Date.parse(b + "T12:00:00Z")) / 864e5);
export const ogeTarihi = (plan: Pick<BuyumePlan, "baslangic">, o: Pick<TakvimOgesi, "gun">) => tarihEkle(plan.baslangic, o.gun - 1);

export function slugUret(s: string): string {
  const tr: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };
  return s.toLocaleLowerCase("tr-TR").replace(/[çğıöşüâîû]/g, (h) => tr[h] ?? h).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "yazi";
}

/**
 * Arayüzde yasak simgeleri düz kelimeye çevirir (model çıktısı için): yüzde işareti, yaklaşık işaretleri, ok.
 * Markdown yapısını (>, =) bozmamak için yalnız bu simgelere dokunur.
 */
export function simgeTemizle(s: string): string {
  return s
    .replace(/%\s?(\d+(?:[.,]\d+)?)/g, "yüzde $1").replace(/(\d+(?:[.,]\d+)?)\s?%/g, "yüzde $1").replace(/%/g, " yüzde ")
    .replace(/\s*[≈~]\s*(?=\d)/g, " yaklaşık ").replace(/[≈~]/g, "")
    .replace(/\s*(→|⇒|->)\s*/g, ", ").replace(/≠/g, " farklı ")
    .replace(/[ \t]{2,}/g, " ").trim();
}

/* ── Normalleştiriciler (model çıktısı ve istemci düzenlemesi) ── */
type Ham = Record<string, unknown>;
const nesne = (x: unknown): Ham => (x && typeof x === "object" && !Array.isArray(x) ? (x as Ham) : {});
const dizi = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);
/** Model çıktısında simgeler temizlenir; kullanıcının kendi yazdığına dokunulmaz (kullaniciGirdisi). */
let TEMIZLE = true;
export function kullaniciGirdisi<T>(f: () => T): T { TEMIZLE = false; try { return f(); } finally { TEMIZLE = true; } }
const metin = (x: unknown, n = 400, temizle = true) => { const s = typeof x === "string" ? x : typeof x === "number" ? String(x) : ""; return (temizle && TEMIZLE ? simgeTemizle(s) : s.trim()).slice(0, n); };
const tamsayi = (x: unknown, en = 10_000_000) => { const n = typeof x === "number" ? x : Number(String(x ?? "").replace(/[^\d.-]/g, "")); return Number.isFinite(n) ? Math.max(0, Math.min(en, Math.round(n))) : 0; };
const secim = <T extends string>(x: unknown, l: readonly T[], v: T): T => (l.includes(x as T) ? (x as T) : v);
const id = (x: unknown) => (typeof x === "string" && /^[a-z0-9]{4,20}$/i.test(x) ? x : kimlik());
const PLAN_IDLER = PLAN_KANALLARI.map((k) => k.id);
const ICERIK_IDLER = ICERIK_KANALLARI.map((k) => k.id);

/** Kanal adını kimliğe çevirir ("Google Ads", "meta reklam", "e-posta" gibi yazımlar da tanınır). */
export function kanalCoz(x: unknown): PlanKanalId {
  const s = String(x ?? "").toLocaleLowerCase("tr-TR").trim();
  if (PLAN_IDLER.includes(s as PlanKanalId)) return s as PlanKanalId;
  if (/google.?ads|adwords|arama ağı/.test(s)) return "google-ads";
  if (/meta|facebook/.test(s)) return "meta";
  if (/insta/.test(s)) return "instagram";
  if (/tik.?tok/.test(s)) return "tiktok";
  if (/e-?posta|mail|bülten/.test(s)) return "eposta";
  if (/seo|arama|google/.test(s)) return "seo";
  if (/whats/.test(s)) return "whatsapp";
  if (/linked/.test(s)) return "linkedin";
  if (/^x$|twitter/.test(s)) return "x";
  return "ozel";
}

export function hashtagNormalize(x: unknown, en = 30): string[] {
  const l = (Array.isArray(x) ? x : typeof x === "string" ? x.split(/[\s,]+/) : []).map((h) => String(h ?? "").trim().replace(/^#+/, "").replace(/[^\p{L}\p{N}_]/gu, "")).filter((h) => h.length >= 2 && h.length <= 40);
  return [...new Set(l.map((h) => "#" + h))].slice(0, en);
}

export function planNormalize(x: unknown, ek: Partial<BuyumePlan> = {}): BuyumePlan {
  const h = nesne(x);
  const kanallar = dizi(h.kanallar).slice(0, 10).map((k0) => { const k = nesne(k0); const kanal = kanalCoz(k.kanal ?? k.ad); return { id: id(k.id), kanal, ozelAd: kanal === "ozel" ? metin(k.ozelAd ?? k.ad, 40) || "Özel kanal" : undefined, oncelik: secim(k.oncelik, ["yuksek", "orta", "dusuk"] as const, "orta"), neden: metin(k.neden, 400), siklik: metin(k.siklik, 80), butce: tamsayi(k.butce) }; });
  const b = nesne(h.butce);
  const plan: BuyumePlan = {
    hedef: secim(h.hedef ?? ek.hedef, HEDEFLER.map((x) => x.id), "ziyaretci"),
    hedefOzel: metin(h.hedefOzel ?? ek.hedefOzel, 160) || undefined,
    butceSiniri: h.butceSiniri !== undefined || ek.butceSiniri !== undefined ? tamsayi(h.butceSiniri ?? ek.butceSiniri) || undefined : undefined,
    not: metin(h.not ?? ek.not, 600) || undefined,
    ozet: metin(h.ozet, 600),
    konumlandirma: metin(h.konumlandirma, 400),
    personalar: dizi(h.personalar).slice(0, 4).map((p0) => { const p = nesne(p0); return { id: id(p.id), ad: metin(p.ad, 80) || "Kitle", yas: metin(p.yas, 40), tanim: metin(p.tanim, 400), ihtiyaclar: dizi(p.ihtiyaclar).slice(0, 5).map((s) => metin(s, 160)).filter(Boolean), kanallar: dizi(p.kanallar).slice(0, 6).map((s) => metin(s, 40)).filter(Boolean) }; }),
    kanallar,
    takvim: dizi(h.takvim).slice(0, 60).map((o0) => { const o = nesne(o0); return { id: id(o.id), gun: Math.min(90, Math.max(1, tamsayi(o.gun) || 1)), kanal: kanalCoz(o.kanal), tur: secim(o.tur, ["gonderi", "reklam", "eposta", "blog", "gorev"] as const, "gonderi"), baslik: metin(o.baslik, 120) || "Adım", aciklama: metin(o.aciklama, 500) }; }).sort((a, b) => a.gun - b.gun),
    metrikler: dizi(h.metrikler).slice(0, 8).map((m0) => { const m = nesne(m0); return { id: id(m.id), ad: metin(m.ad, 80) || "Metrik", hedef: metin(m.hedef, 80), neden: metin(m.neden, 300), olcum: secim(m.olcum, ["ziyaretci", "sosyal", "ucretli", "eposta", "arama", "form", "yok"] as const, "yok") }; }),
    butce: { kalemler: dizi(b.kalemler).slice(0, 12).map((k0) => { const k = nesne(k0); const kanal = k.kanal ? kanalCoz(k.kanal) : undefined; return { id: id(k.id), ad: metin(k.ad, 80) || (kanal ? planKanali(kanal).ad : "Kalem"), kanal, tutar: tamsayi(k.tutar), not: metin(k.not, 200) || undefined }; }), not: metin(b.not, 500) },
    gorevler: dizi(h.gorevler).slice(0, 12).map((g0) => { const g = nesne(g0); const tur = secim(g.tur, ["site", "icerik", "reklam", "blog", "elle"] as const, "elle"); return { id: id(g.id), baslik: metin(g.baslik, 140) || "Görev", aciklama: metin(g.aciklama, 500), tur, kanal: tur === "icerik" ? secim(g.kanal, ICERIK_IDLER, "instagram") : undefined, ajanIstemi: tur === "site" ? metin(g.ajanIstemi, 1200, false) || metin(g.aciklama, 500) : undefined, bitti: g.bitti === true }; }),
    baslangic: tarihGecerli(h.baslangic) ? h.baslangic : ek.baslangic ?? bugunTR(),
    olusturma: tamsayi(h.olusturma, 9e15) || ek.olusturma || Date.now(),
    model: metin(h.model ?? ek.model, 60, false) || undefined,
  };
  // Bütçe kalemi yoksa kanallardan kur; kullanıcı sınırını aşan bütçe oransal küçültülür.
  if (!plan.butce.kalemler.length) plan.butce.kalemler = kanallar.filter((k) => k.butce > 0).map((k) => ({ id: kimlik(), ad: k.kanal === "ozel" ? k.ozelAd ?? "Özel" : planKanali(k.kanal).ad, kanal: k.kanal, tutar: k.butce }));
  const toplam = plan.butce.kalemler.reduce((t, k) => t + k.tutar, 0);
  if (plan.butceSiniri && toplam > plan.butceSiniri) { const o = plan.butceSiniri / toplam; plan.butce.kalemler = plan.butce.kalemler.map((k) => ({ ...k, tutar: Math.floor((k.tutar * o) / 50) * 50 })); }
  return plan;
}
export const butceToplami = (p: Pick<BuyumePlan, "butce">) => p.butce.kalemler.reduce((t, k) => t + k.tutar, 0);

export function gonderiNormalize(x: unknown, ek: Partial<Gonderi> = {}): Gonderi {
  const g = nesne(x);
  const kanal = secim(g.kanal ?? ek.kanal, ICERIK_IDLER, "instagram");
  const ok = nesne(g.ozelKanal ?? ek.ozelKanal);
  const ozelKanal = kanal === "ozel" ? { ad: metin(ok.ad, 40) || "Özel kanal", sinir: Math.min(20000, Math.max(20, tamsayi(ok.sinir) || 1000)), oran: ORANLAR.includes(String(ok.oran)) ? String(ok.oran) : "1:1" } : undefined;
  const k = icerikKanali(kanal);
  return {
    id: id(g.id ?? ek.id), kanal, ozelKanal, konu: metin(g.konu ?? ek.konu, 300), ton: metin(g.ton ?? ek.ton, 80) || undefined,
    baslik: k.konu ? metin(g.baslik ?? ek.baslik, 120) || undefined : undefined,
    metin: metin(g.metin ?? ek.metin, 20000).replace(/\n{3,}/g, "\n\n"),
    hashtagler: hashtagNormalize(g.hashtagler ?? ek.hashtagler, kanal === "instagram" ? 30 : k.hashtag[1] > 0 ? Math.max(10, k.hashtag[1]) : 0),
    gorselIstemi: metin(g.gorselIstemi ?? ek.gorselIstemi, 1500),
    gorsel: typeof (g.gorsel ?? ek.gorsel) === "string" && /^\/api\/dosya\/gorsel\/[\w.-]+$/.test(String(g.gorsel ?? ek.gorsel)) ? String(g.gorsel ?? ek.gorsel) : undefined,
    gorselHata: metin(g.gorselHata ?? ek.gorselHata, 300, false) || undefined,
    durum: secim(g.durum ?? ek.durum, ["taslak", "hazir", "paylasildi"] as const, "taslak"),
    tarih: tarihGecerli(g.tarih ?? ek.tarih) ? String(g.tarih ?? ek.tarih) : undefined,
    takvimId: typeof (g.takvimId ?? ek.takvimId) === "string" ? String(g.takvimId ?? ek.takvimId).slice(0, 20) : undefined,
    saat: typeof (g.saat ?? ek.saat) === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(String(g.saat ?? ek.saat)) ? String(g.saat ?? ek.saat) : undefined,
    paylasimAdresi: typeof (g.paylasimAdresi ?? ek.paylasimAdresi) === "string" && /^https:\/\/[^\s"'<>]{4,500}$/.test(String(g.paylasimAdresi ?? ek.paylasimAdresi)) ? String(g.paylasimAdresi ?? ek.paylasimAdresi) : undefined,
    olusturma: tamsayi(g.olusturma ?? ek.olusturma, 9e15) || Date.now(), guncelleme: Date.now(),
  };
}

export function reklamNormalize(x: unknown, ek: Partial<ReklamSeti> = {}): ReklamSeti {
  const r = nesne(x), g = nesne(r.google), m = nesne(r.meta);
  const tekil = (l: string[]) => [...new Set(l.filter(Boolean))];
  return {
    google: {
      basliklar: tekil(dizi(g.basliklar).map((s) => metin(s, 60))).slice(0, SINIR.gBaslikSayi),
      aciklamalar: tekil(dizi(g.aciklamalar).map((s) => metin(s, 180))).slice(0, SINIR.gAciklamaSayi),
      yol1: metin(g.yol1, 30).replace(/\s+/g, "-"), yol2: metin(g.yol2, 30).replace(/\s+/g, "-"),
    },
    meta: { birincil: metin(m.birincil, 1000), baslik: metin(m.baslik, 80), aciklama: metin(m.aciklama, 80), cta: metin(m.cta, 30) || META_CTA[0] },
    anahtarKelimeler: dizi(r.anahtarKelimeler).slice(0, 40).map((k0) => { const k = nesne(k0); return { id: id(k.id), kelime: metin(k.kelime, 80).toLocaleLowerCase("tr-TR"), eslesme: secim(k.eslesme, ["genis", "sirali", "tam"] as const, "sirali"), niyet: secim(k.niyet, NIYETLER.map((n) => n.id), "satin-alma") }; }).filter((k) => k.kelime),
    negatifler: tekil(dizi(r.negatifler).map((s) => metin(s, 60).toLocaleLowerCase("tr-TR"))).slice(0, 30),
    olusturma: tamsayi(r.olusturma, 9e15) || ek.olusturma || Date.now(), model: metin(r.model ?? ek.model, 60, false) || undefined,
  };
}

export function konuNormalize(x: unknown): BlogKonu {
  const k = nesne(x);
  return { id: id(k.id), baslik: metin(k.baslik, 140) || "Konu", anahtarKelime: metin(k.anahtarKelime, 80).toLocaleLowerCase("tr-TR"), niyet: secim(k.niyet, NIYETLER.map((n) => n.id), "bilgi"), neden: metin(k.neden, 300) };
}

export function makaleNormalize(x: unknown, ek: Partial<BlogMakale> = {}): BlogMakale {
  const m = nesne(x);
  const baslik = metin(m.baslik ?? ek.baslik, 160) || "Yazı";
  return {
    id: id(m.id ?? ek.id), konuId: typeof (m.konuId ?? ek.konuId) === "string" ? String(m.konuId ?? ek.konuId).slice(0, 20) : undefined,
    baslik, anahtarKelime: metin(m.anahtarKelime ?? ek.anahtarKelime, 80), slug: slugUret(metin(m.slug ?? ek.slug, 80) || baslik),
    metaBaslik: metin(m.metaBaslik ?? ek.metaBaslik, 120), metaAciklama: metin(m.metaAciklama ?? ek.metaAciklama, 300),
    markdown: (typeof (m.markdown ?? ek.markdown) === "string" ? String(m.markdown ?? ek.markdown) : "").slice(0, 60_000),
    olusturma: tamsayi(m.olusturma ?? ek.olusturma, 9e15) || Date.now(), guncelleme: Date.now(),
    siteyeEklendi: tamsayi(m.siteyeEklendi ?? ek.siteyeEklendi, 9e15) || undefined, model: metin(m.model ?? ek.model, 60, false) || undefined,
  };
}

/* ── Dışa aktarma (istemcide) ── */
const icsKacir = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
/** RFC 5545 satır katlama: 75 sekizlikte bir CRLF + boşluk. */
function icsKatla(satir: string): string {
  const b = new TextEncoder();
  if (b.encode(satir).length <= 75) return satir;
  const parcalar: string[] = [];
  let suanki = "";
  for (const h of satir) { if (b.encode(suanki + h).length > (parcalar.length ? 74 : 75)) { parcalar.push(suanki); suanki = h; } else suanki += h; }
  parcalar.push(suanki);
  return parcalar.join("\r\n ");
}
export function icsOlustur(ad: string, olaylar: { id: string; tarih: string; baslik: string; aciklama?: string }[]): string {
  const damga = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const s = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Vayra Build//Buyume//TR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${icsKacir(ad)}`];
  for (const o of olaylar) {
    const bas = o.tarih.replace(/-/g, ""), bit = tarihEkle(o.tarih, 1).replace(/-/g, "");
    s.push("BEGIN:VEVENT", `UID:${o.id}@buyume.vayra`, `DTSTAMP:${damga}`, `DTSTART;VALUE=DATE:${bas}`, `DTEND;VALUE=DATE:${bit}`, `SUMMARY:${icsKacir(o.baslik)}`);
    if (o.aciklama) s.push(`DESCRIPTION:${icsKacir(o.aciklama)}`);
    s.push("TRANSP:TRANSPARENT", "END:VEVENT");
  }
  s.push("END:VCALENDAR");
  return s.map(icsKatla).join("\r\n") + "\r\n";
}

/** Reklam metinleri tablosu (Excel Türkçe için noktalı virgül, UTF-8 BOM). */
export function reklamCsv(r: ReklamSeti, adres: string): string {
  const h = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
  const satirlar: (string | number)[][] = [["Platform", "Alan", "Sıra", "Metin", "Karakter", "Sınır", "Eşleme"]];
  r.google.basliklar.forEach((b, i) => satirlar.push(["Google Ads", "Başlık", i + 1, b, say(b), SINIR.gBaslik, ""]));
  r.google.aciklamalar.forEach((b, i) => satirlar.push(["Google Ads", "Açıklama", i + 1, b, say(b), SINIR.gAciklama, ""]));
  if (r.google.yol1) satirlar.push(["Google Ads", "Görünen yol", 1, r.google.yol1, say(r.google.yol1), SINIR.gYol, ""]);
  if (r.google.yol2) satirlar.push(["Google Ads", "Görünen yol", 2, r.google.yol2, say(r.google.yol2), SINIR.gYol, ""]);
  satirlar.push(["Google Ads", "Son URL", 1, adres, say(adres), "", ""]);
  r.anahtarKelimeler.forEach((k, i) => satirlar.push(["Google Ads", "Anahtar kelime", i + 1, k.eslesme === "tam" ? `[${k.kelime}]` : k.eslesme === "sirali" ? `"${k.kelime}"` : k.kelime, say(k.kelime), "", ESLEMELER.find((e) => e.id === k.eslesme)?.ad ?? ""]));
  r.negatifler.forEach((k, i) => satirlar.push(["Google Ads", "Negatif anahtar kelime", i + 1, k, say(k), "", ""]));
  satirlar.push(["Meta", "Birincil metin", 1, r.meta.birincil, say(r.meta.birincil), SINIR.mBirincil, ""]);
  satirlar.push(["Meta", "Başlık", 1, r.meta.baslik, say(r.meta.baslik), SINIR.mBaslik, ""]);
  satirlar.push(["Meta", "Açıklama", 1, r.meta.aciklama, say(r.meta.aciklama), SINIR.mAciklama, ""]);
  satirlar.push(["Meta", "Harekete geçirici düğme", 1, r.meta.cta, say(r.meta.cta), "", ""]);
  return "\uFEFF" + satirlar.map((s) => s.map(h).join(";")).join("\r\n") + "\r\n";
}
