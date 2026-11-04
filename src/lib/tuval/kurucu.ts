import { KATALOG, dugumKredi, type DugumTur } from "./katalog";
import { dugumOlustur, yeniId, type Dugum, type Kenar } from "@/store/useTuval";

/**
 * Akış kurucu: şablonlar ve asistanın istekten kurduğu akışlar aynı tarifle (düğümler + bağlantılar) tanımlanır.
 * Asistan kural tabanlıdır (istemcide): isteği teslim türlerine ayırır, yalnız Canvas'ın gerçekten çalıştırabildiği düğümleri kurar.
 */
type TarifDugum = { k: string; tur: DugumTur; kol: number; sira: number; metin?: string; model?: string; ayar?: Record<string, string | number | boolean>; ad?: string };
export type Tarif = { baslik: string; dugumler: TarifDugum[]; kenarlar: [string, string, string][] };

const KOL = 380, SIRA = 450;

export function tarifKur(t: Tarif, x0 = 120, y0 = 120): { dugumler: Dugum[]; kenarlar: Kenar[] } {
  const harita = new Map<string, string>();
  const dugumler = t.dugumler.map((d) => {
    const n = dugumOlustur(d.tur, x0 + d.kol * KOL, y0 + d.sira * SIRA, { ...(d.metin !== undefined ? { metin: d.metin } : {}), ...(d.model ? { model: d.model } : {}), ...(d.ad ? { ad: d.ad } : {}) });
    if (d.ayar) n.ayar = { ...n.ayar, ...d.ayar };
    harita.set(d.k, n.id); return n;
  });
  const kenarlar = t.kenarlar.map(([a, b, port]) => ({ id: yeniId("e"), kaynak: harita.get(a)!, hedef: harita.get(b)!, port }));
  return { dugumler, kenarlar };
}

export const tarifKredi = (t: Tarif) => t.dugumler.reduce((s, d) => s + dugumKredi({ tur: d.tur, model: d.model ?? KATALOG[d.tur].model, ayar: { adet: 1, ...(d.ayar ?? {}) }, metin: d.metin ?? "" }), 0);

/* ── Şablonlar ── */
export type Sablon = { id: string; ad: string; alt: string; kapak: string; tarif: Tarif; sure: string };
const G = "/gercek";
export const SABLONLAR: Sablon[] = [
  {
    id: "gorselden-video", ad: "Görselden videoya", alt: "İstem, görsel, canlanan video", kapak: `${G}/canvas/sablon-seed.webp`, sure: "yaklaşık 1 dk",
    tarif: { baslik: "Görselden videoya", dugumler: [
      { k: "i", tur: "istem", kol: 0, sira: 0, metin: "Sisli bir kuzey ormanında kırmızı pelerinli genç bir kaşif, sinematik, 35 mm, altın saat ışığı" },
      { k: "g", tur: "gorsel", kol: 1, sira: 0, ayar: { oran: "16:9" } },
      { k: "v", tur: "video", kol: 2, sira: 0, metin: "Kamera yavaşça yaklaşır, pelerin rüzgârda dalgalanır", model: "Seedance 2.0 Fast" },
    ], kenarlar: [["i", "g", "istem"], ["g", "v", "kare"]] },
  },
  {
    id: "kisa-film", ad: "Sahne sahne kısa film", alt: "Ortak stil, 3 sahne, 3 görsel, 3 video", kapak: `${G}/canvas/sablon-uzun.webp`, sure: "yaklaşık 4 dk",
    tarif: { baslik: "Kısa film", dugumler: [
      { k: "s", tur: "istem", kol: 0, sira: 1, metin: "Stil: sinematik, çöl gün batımı, sıcak tonlar, anamorfik 2.39:1", ad: "Ortak stil" },
      { k: "a", tur: "istem", kol: 1, sira: 0, metin: "Sahne 1: Yalnız bir gezgin kum tepesinin üstünde ufka bakıyor" },
      { k: "b", tur: "istem", kol: 1, sira: 1, metin: "Sahne 2: Gezgin terk edilmiş taş bir tapınağa giriyor" },
      { k: "c", tur: "istem", kol: 1, sira: 2, metin: "Sahne 3: Tapınağın içinde mavi ışık saçan bir küre" },
      { k: "ga", tur: "gorsel", kol: 2, sira: 0, ayar: { oran: "16:9" }, model: "Vayra Ruh 2.0" }, { k: "gb", tur: "gorsel", kol: 2, sira: 1, ayar: { oran: "16:9" }, model: "Vayra Ruh 2.0" }, { k: "gc", tur: "gorsel", kol: 2, sira: 2, ayar: { oran: "16:9" }, model: "Vayra Ruh 2.0" },
      { k: "va", tur: "video", kol: 3, sira: 0, metin: "Yavaş dolly in", model: "Seedance 2.0 Fast" }, { k: "vb", tur: "video", kol: 3, sira: 1, metin: "Takip çekimi", model: "Seedance 2.0 Fast" }, { k: "vc", tur: "video", kol: 3, sira: 2, metin: "Işık yoğunlaşır, kamera yükselir", model: "Seedance 2.0 Fast" },
    ], kenarlar: [["s", "ga", "istem"], ["s", "gb", "istem"], ["s", "gc", "istem"], ["a", "ga", "istem"], ["b", "gb", "istem"], ["c", "gc", "istem"], ["ga", "va", "kare"], ["gb", "vb", "kare"], ["gc", "vc", "kare"]] },
  },
  {
    id: "karakter", ad: "Referanstan karakter", alt: "Bir yüz, üç farklı sahnede aynı kişi", kapak: `${G}/canvas/sablon-ref.webp`, sure: "yaklaşık 1 dk",
    tarif: { baslik: "Karakter tutarlılığı", dugumler: [
      { k: "r", tur: "yukle", kol: 0, sira: 1, ad: "Karakter referansı" },
      { k: "g1", tur: "gorsel", kol: 1, sira: 0, metin: "Aynı kişi, bir kafede pencere kenarında kahve içiyor, doğal ışık", model: "Seedream 5.0 Pro", ayar: { oran: "4:5" } },
      { k: "g2", tur: "gorsel", kol: 1, sira: 1, metin: "Aynı kişi, gece neon ışıklı bir sokakta yürüyor", model: "Seedream 5.0 Pro", ayar: { oran: "4:5" } },
      { k: "g3", tur: "gorsel", kol: 1, sira: 2, metin: "Aynı kişi, stüdyoda beyaz fon önünde portre", model: "Seedream 5.0 Pro", ayar: { oran: "4:5" } },
      { k: "k", tur: "karsilastir", kol: 2, sira: 1 },
    ], kenarlar: [["r", "g1", "ref"], ["r", "g2", "ref"], ["r", "g3", "ref"], ["r", "k", "a"], ["g1", "k", "b"]] },
  },
  {
    id: "tanitim", ad: "Seslendirmeli tanıtım", alt: "Asistan metni yazar, ses, görsel, video", kapak: `${G}/canvas/sablon-ses.webp`, sure: "yaklaşık 2 dk",
    tarif: { baslik: "Seslendirmeli tanıtım", dugumler: [
      { k: "i", tur: "istem", kol: 0, sira: 0, metin: "Ürün: Demlik — Etiyopya Yirgacheffe filtre kahve, çiçeksi ve hafif", ad: "Konu" },
      { k: "a", tur: "asistan", kol: 1, sira: 0, metin: "Bu ürün için 20 saniyelik, sıcak tonlu bir tanıtım seslendirme metni yaz." },
      { k: "s", tur: "ses", kol: 2, sira: 0 },
      { k: "g", tur: "gorsel", kol: 1, sira: 1, metin: "Kahve fincanından yükselen buhar, sıcak sabah ışığı, ürün çekimi", ayar: { oran: "16:9" } },
      { k: "v", tur: "video", kol: 2, sira: 1, metin: "Buhar yavaşça yükselir, kamera hafifçe yaklaşır", model: "Seedance 2.0 Fast" },
    ], kenarlar: [["i", "a", "baglam"], ["a", "s", "metin"], ["i", "g", "istem"], ["g", "v", "kare"]] },
  },
  {
    id: "storyboard", ad: "Storyboard", alt: "Ortak stille 4 kare", kapak: `${G}/canvas/sablon-sb.webp`, sure: "yaklaşık 1 dk",
    tarif: { baslik: "Storyboard", dugumler: [
      { k: "s", tur: "istem", kol: 0, sira: 1, metin: "Stil: siyah-beyaz film noir, sert gölgeler, 1940'lar", ad: "Ortak stil" },
      ...[0, 1, 2, 3].map((i) => ({ k: `p${i}`, tur: "istem" as const, kol: 1, sira: i * 0.8, metin: ["Kare 1: Yağmurlu bir sokak, şapkalı bir dedektif", "Kare 2: Ofiste masa lambası altında bir dosya", "Kare 3: Pencere panjurundan süzülen ışık", "Kare 4: Merdiven boşluğunda bir siluet"][i] })),
      ...[0, 1, 2, 3].map((i) => ({ k: `g${i}`, tur: "gorsel" as const, kol: 2, sira: i * 0.8, ayar: { oran: "16:9" }, model: "Nano Banana 2.1" })),
    ], kenarlar: [0, 1, 2, 3].flatMap((i) => [["s", `g${i}`, "istem"], [`p${i}`, `g${i}`, "istem"]] as [string, string, string][]) },
  },
  {
    id: "urun", ad: "Ürün çekimi", alt: "Ürün fotoğrafı, dekupe, yeni sahne, 4K", kapak: `${G}/panel/gal-pazarlama-1.webp`, sure: "yaklaşık 1 dk",
    tarif: { baslik: "Ürün çekimi", dugumler: [
      { k: "u", tur: "yukle", kol: 0, sira: 0, ad: "Ürün fotoğrafı" },
      { k: "a", tur: "arkaplan", kol: 1, sira: 0 },
      { k: "g", tur: "gorsel", kol: 2, sira: 0, metin: "Ürün krem rengi saten üzerinde, yumuşak stüdyo ışığı, lüks reklam çekimi", model: "Nano Banana 2.1", ayar: { oran: "4:5" } },
      { k: "b", tur: "buyut", kol: 3, sira: 0, ayar: { olcek: 2 } },
    ], kenarlar: [["u", "a", "gorsel"], ["a", "g", "ref"], ["g", "b", "gorsel"]] },
  },
  {
    id: "afis", ad: "Reklam afişi", alt: "Ürün, dekupe, yeni zemin, yazı, 4:5", kapak: `${G}/panel/gal-pazarlama-3.webp`, sure: "yaklaşık 1 dk",
    tarif: { baslik: "Reklam afişi", dugumler: [
      { k: "u", tur: "yukle", kol: 0, sira: 0, ad: "Ürün fotoğrafı" },
      { k: "z", tur: "zemin", kol: 1, sira: 0, metin: "Krem rengi mermer tezgâh, yumuşak sabah ışığı, sade lüks reklam çekimi" },
      { k: "y", tur: "yazi", kol: 2, sira: 0, metin: "YENİ SEZON", ayar: { stil: "etiket", konum: "alt", renk: "#ffffff" } },
      { k: "c", tur: "kirp", kol: 3, sira: 0, ayar: { oran: "4:5" }, ad: "Instagram 4:5" },
      { k: "c2", tur: "kirp", kol: 3, sira: 1, ayar: { oran: "9:16" }, ad: "Hikâye 9:16" },
    ], kenarlar: [["u", "z", "gorsel"], ["z", "y", "gorsel"], ["y", "c", "gorsel"], ["y", "c2", "gorsel"]] },
  },
  {
    id: "montaj", ad: "Klip montajı", alt: "Görsel, video, devamı, müzikle birleştir", kapak: `${G}/panel/gal-seedance-2.webp`, sure: "yaklaşık 3 dk",
    tarif: { baslik: "Klip montajı", dugumler: [
      { k: "i", tur: "istem", kol: 0, sira: 0, metin: "Gece yağmurunda neon ışıklı bir sokakta yürüyen kırmızı paltolu kadın, sinematik" },
      { k: "g", tur: "gorsel", kol: 1, sira: 0, ayar: { oran: "16:9" } },
      { k: "v", tur: "video", kol: 2, sira: 0, metin: "Kamera yavaşça takip eder", model: "Seedance 2.0 Fast" },
      { k: "u", tur: "videoUzat", kol: 3, sira: 0, metin: "Kadın durur, kameraya döner, neon yansımaları", model: "Seedance 2.0 Fast" },
      { k: "m", tur: "muzik", kol: 2, sira: 1, metin: "Karanlık synthwave, 90 bpm, gerilimli", ayar: { sure: "30", enstrumantal: true } },
      { k: "b", tur: "videoBirlestir", kol: 4, sira: 0, ayar: { gecis: "karartma" } },
    ], kenarlar: [["i", "g", "istem"], ["g", "v", "kare"], ["v", "u", "video"], ["v", "b", "v1"], ["u", "b", "v2"], ["m", "b", "ses"]] },
  },
  {
    id: "podcast", ad: "Çok dilli podcast", alt: "Kayıt, temizle, transkript, 2 dilde dublaj", kapak: `${G}/kabuk/auth-muzik-neon-studio.webp`, sure: "yaklaşık 2 dk",
    tarif: { baslik: "Çok dilli podcast", dugumler: [
      { k: "s", tur: "sesYukle", kol: 0, sira: 1, ad: "Podcast kaydı" },
      { k: "t", tur: "sesTemizle", kol: 1, sira: 1 },
      { k: "x", tur: "transkript", kol: 2, sira: 0 },
      { k: "en", tur: "dublaj", kol: 2, sira: 1, ayar: { hedefDil: "en" }, ad: "İngilizce" },
      { k: "de", tur: "dublaj", kol: 2, sira: 2, ayar: { hedefDil: "de" }, ad: "Almanca" },
    ], kenarlar: [["s", "t", "ses"], ["t", "x", "ses"], ["t", "en", "ses"], ["t", "de", "ses"]] },
  },
  {
    id: "giydir", ad: "Sanal deneme", alt: "Model, kıyafet, giydir, ışık, büyüt", kapak: `${G}/panel/gal-pazarlama-5.webp`, sure: "yaklaşık 1 dk",
    tarif: { baslik: "Sanal deneme", dugumler: [
      { k: "m", tur: "yukle", kol: 0, sira: 0, ad: "Model fotoğrafı" },
      { k: "k", tur: "yukle", kol: 0, sira: 1, ad: "Kıyafet" },
      { k: "g", tur: "giydir", kol: 1, sira: 0 },
      { k: "i", tur: "isik", kol: 2, sira: 0, ayar: { yon: "Sol", renk: "Altın saat" } },
      { k: "b", tur: "aiBuyut", kol: 3, sira: 0 },
    ], kenarlar: [["m", "g", "model"], ["k", "g", "kiyafet"], ["g", "i", "gorsel"], ["i", "b", "gorsel"]] },
  },
  {
    id: "hikaye", ad: "Hikâyeden storyboard", alt: "Hikâye, sahneler, her sahneye görsel, kolaj", kapak: `${G}/panel/app-charsheet.webp`, sure: "yaklaşık 2 dk",
    tarif: { baslik: "Hikâyeden storyboard", dugumler: [
      { k: "i", tur: "istem", kol: 0, sira: 0, metin: "Küçük bir robot, terk edilmiş bir serada son kalan çiçeği korumaya çalışıyor.", ad: "Hikâye" },
      { k: "s", tur: "sahneler", kol: 1, sira: 0, ayar: { adet: "4" } },
      { k: "st", tur: "istem", kol: 1, sira: 1, metin: "Stil: suluboya, yumuşak pastel, Ghibli esintili", ad: "Ortak stil" },
      { k: "g", tur: "gorsel", kol: 2, sira: 0, ayar: { oran: "16:9" }, model: "Nano Banana 2.1" },
      { k: "k", tur: "kolaj", kol: 3, sira: 0, ayar: { sutun: "2" } },
    ], kenarlar: [["i", "s", "metin"], ["s", "g", "istem"], ["st", "g", "istem"], ["g", "k", "gorsel"]] },
  },
];

/* ── Asistan: istekten akış ── */
const SAYI: Record<string, number> = { bir: 1, iki: 2, üç: 3, dört: 4 };
function adet(k: string) {
  const m = k.match(/(\d+|bir|iki|üç|dört)\s*(?:adet\s*|tane\s*|farklı\s*|ayrı\s*)?(?:[\p{L}-]+\s+){0,2}(?:görsel|fotoğraf|varyasyon|kare|sahne|video|reklam)/u);
  if (!m) return 0;
  return Math.max(1, Math.min(4, /\d/.test(m[1]) ? Number(m[1]) : SAYI[m[1]] ?? 1));
}

export type AsistanPlan = { tarif: Tarif; adimlar: { ad: string; tur: DugumTur; kredi: number }[]; kredi: number };

export function akisPlanla(istek: string): AsistanPlan {
  const t = istek.trim(); const k = t.toLocaleLowerCase("tr");
  const video = /(video|klip|reels|canlandır|hareket)/.test(k);
  const ses = /(seslendir|anlatım|anlatıcı|ses|voice)/.test(k);
  const n = adet(k);
  let tarif: Tarif;
  if (/(dublaj|çevir|çeviri|transkript|altyazı|podcast)/.test(k)) {
    const diller = [...k.matchAll(/(ingilizce|almanca|fransızca|ispanyolca|italyanca|arapça|rusça|japonca)/g)].map((m) => m[1]);
    const KOD: Record<string, string> = { ingilizce: "en", almanca: "de", fransızca: "fr", ispanyolca: "es", italyanca: "it", arapça: "ar", rusça: "ru", japonca: "ja" };
    const l = (diller.length ? diller : ["ingilizce"]).slice(0, 4);
    tarif = { baslik: "Ses akışı", dugumler: [
      { k: "s", tur: "sesYukle", kol: 0, sira: 0, ad: "Kayıt" },
      ...(/transkript|altyazı|yazıya/.test(k) || !diller.length ? [{ k: "x", tur: "transkript" as const, kol: 1, sira: 0 }] : []),
      ...l.map((d, i) => ({ k: `d${i}`, tur: "dublaj" as const, kol: 1, sira: i + 1, ayar: { hedefDil: KOD[d] }, ad: d.charAt(0).toLocaleUpperCase("tr") + d.slice(1) })),
    ], kenarlar: [...(/transkript|altyazı|yazıya/.test(k) || !diller.length ? [["s", "x", "ses"] as [string, string, string]] : []), ...l.map((_, i) => ["s", `d${i}`, "ses"] as [string, string, string])] };
  } else if (/(afiş|banner|poster|kampanya görseli|yazılı görsel)/.test(k)) {
    const yazi = t.match(/["“'](.+?)["”']/)?.[1] ?? "YENİ SEZON";
    tarif = { baslik: "Afiş akışı", dugumler: [
      { k: "i", tur: "istem", kol: 0, sira: 0, metin: t },
      { k: "g", tur: "gorsel", kol: 1, sira: 0, ayar: { oran: "4:5" } },
      { k: "y", tur: "yazi", kol: 2, sira: 0, metin: yazi, ayar: { stil: "etiket" } },
      { k: "c", tur: "kirp", kol: 3, sira: 0, ayar: { oran: "9:16" }, ad: "Hikâye 9:16" },
    ], kenarlar: [["i", "g", "istem"], ["g", "y", "gorsel"], ["y", "c", "gorsel"]] };
  } else if (/(giydir|kıyafet|elbise|deneme|try ?on)/.test(k)) {
    tarif = { baslik: "Sanal deneme", dugumler: [{ k: "m", tur: "yukle", kol: 0, sira: 0, ad: "Model fotoğrafı" }, { k: "c", tur: "yukle", kol: 0, sira: 1, ad: "Kıyafet" }, { k: "g", tur: "giydir", kol: 1, sira: 0 }, { k: "b", tur: "aiBuyut", kol: 2, sira: 0 }],
      kenarlar: [["m", "g", "model"], ["c", "g", "kiyafet"], ["g", "b", "gorsel"]] };
  } else if (/(montaj|birleştir|klipleri|uzat|devam)/.test(k) && video) {
    const sayi = Math.min(4, n || 2);
    tarif = { baslik: "Montaj", dugumler: [
      { k: "i", tur: "istem", kol: 0, sira: 0, metin: t },
      { k: "g", tur: "gorsel", kol: 1, sira: 0, ayar: { oran: "16:9" } },
      { k: "v0", tur: "video", kol: 2, sira: 0, metin: "Sinematik kamera hareketi", model: "Seedance 2.0 Fast" },
      ...Array.from({ length: sayi - 1 }, (_, i) => ({ k: `v${i + 1}`, tur: "videoUzat" as const, kol: 3 + i, sira: 0, metin: "Sahne doğal biçimde devam eder", model: "Seedance 2.0 Fast" })),
      ...(/müzik|şarkı/.test(k) ? [{ k: "m", tur: "muzik" as const, kol: 2, sira: 1, metin: "Sinematik, duygusal, 30 sn", ayar: { sure: "30", enstrumantal: true } }] : []),
      { k: "b", tur: "videoBirlestir", kol: 2 + sayi, sira: 0, ayar: { gecis: "karartma" } },
    ], kenarlar: [["i", "g", "istem"], ["g", "v0", "kare"], ...Array.from({ length: sayi - 1 }, (_, i) => [`v${i}`, `v${i + 1}`, "video"] as [string, string, string]),
      ...Array.from({ length: sayi }, (_, i) => [`v${i}`, "b", `v${i + 1}`] as [string, string, string]), ...(/müzik|şarkı/.test(k) ? [["m", "b", "ses"] as [string, string, string]] : [])] };
  } else if (/(ürün|product|ambalaj|şişe|paket)/.test(k)) {
    const sayi = n || 3;
    tarif = { baslik: "Ürün akışı", dugumler: [
      { k: "u", tur: "yukle", kol: 0, sira: 1, ad: "Ürün fotoğrafı" }, { k: "a", tur: "arkaplan", kol: 1, sira: 1 },
      ...Array.from({ length: sayi }, (_, i) => ({ k: `g${i}`, tur: "gorsel" as const, kol: 2, sira: i, metin: `${t} — reklam sahnesi ${i + 1}, farklı bir mekân ve ışık`, model: "Nano Banana 2.1", ayar: { oran: "4:5" } })),
      ...(video ? Array.from({ length: sayi }, (_, i) => ({ k: `v${i}`, tur: "video" as const, kol: 3, sira: i, metin: "Ürün etrafında yavaş bir kamera hareketi", model: "Seedance 2.0 Fast", ayar: { oran: "9:16" } })) : []),
    ], kenarlar: [["u", "a", "gorsel"], ...Array.from({ length: sayi }, (_, i) => ["a", `g${i}`, "ref"] as [string, string, string]), ...(video ? Array.from({ length: sayi }, (_, i) => [`g${i}`, `v${i}`, "kare"] as [string, string, string]) : [])] };
  } else if (/(karakter|tutarlı|aynı kişi|aynı yüz)/.test(k)) {
    const sayi = n || 3;
    tarif = { baslik: "Karakter akışı", dugumler: [
      { k: "r", tur: "yukle", kol: 0, sira: 1, ad: "Karakter referansı" }, { k: "i", tur: "istem", kol: 0, sira: 0, metin: t },
      ...Array.from({ length: sayi }, (_, i) => ({ k: `g${i}`, tur: "gorsel" as const, kol: 1, sira: i, metin: `Aynı kişi, sahne ${i + 1}`, model: "Seedream 5.0 Pro", ayar: { oran: "4:5" } })),
    ], kenarlar: Array.from({ length: sayi }, (_, i) => [["r", `g${i}`, "ref"], ["i", `g${i}`, "istem"]] as [string, string, string][]).flat() };
  } else if (/(storyboard|sahne|kısa film|hikâye|hikaye|senaryo)/.test(k)) {
    const sayi = n || 3;
    tarif = { baslik: "Sahne akışı", dugumler: [
      { k: "s", tur: "istem", kol: 0, sira: 1, metin: t, ad: "Konu ve stil" },
      ...Array.from({ length: sayi }, (_, i) => ({ k: `p${i}`, tur: "istem" as const, kol: 1, sira: i, metin: `Sahne ${i + 1}: ` })),
      ...Array.from({ length: sayi }, (_, i) => ({ k: `g${i}`, tur: "gorsel" as const, kol: 2, sira: i, ayar: { oran: "16:9" } })),
      ...(video ? Array.from({ length: sayi }, (_, i) => ({ k: `v${i}`, tur: "video" as const, kol: 3, sira: i, metin: "Sinematik kamera hareketi", model: "Seedance 2.0 Fast" })) : []),
    ], kenarlar: [...Array.from({ length: sayi }, (_, i) => [["s", `g${i}`, "istem"], [`p${i}`, `g${i}`, "istem"]] as [string, string, string][]).flat(), ...(video ? Array.from({ length: sayi }, (_, i) => [`g${i}`, `v${i}`, "kare"] as [string, string, string]) : [])] };
  } else if (/(büyüt|4k|8k|upscale|netleştir)/.test(k)) {
    tarif = { baslik: "Büyütme", dugumler: [{ k: "u", tur: "yukle", kol: 0, sira: 0 }, { k: "b", tur: "aiBuyut", kol: 1, sira: 0, ayar: { olcek: /8k/.test(k) ? "4" : "2" } }], kenarlar: [["u", "b", "gorsel"]] };
  } else {
    const sayi = n || 1;
    tarif = { baslik: "Akış", dugumler: [
      { k: "i", tur: "istem", kol: 0, sira: 0, metin: t },
      ...Array.from({ length: sayi }, (_, i) => ({ k: `g${i}`, tur: "gorsel" as const, kol: 1, sira: i, ayar: { oran: video ? "16:9" : "1:1" }, ...(sayi > 1 ? { metin: `Varyasyon ${i + 1}` } : {}) })),
      ...(video ? Array.from({ length: sayi }, (_, i) => ({ k: `v${i}`, tur: "video" as const, kol: 2, sira: i, metin: "Doğal, sinematik hareket", model: "Seedance 2.0 Fast" })) : []),
    ], kenarlar: [...Array.from({ length: sayi }, (_, i) => ["i", `g${i}`, "istem"] as [string, string, string]), ...(video ? Array.from({ length: sayi }, (_, i) => [`g${i}`, `v${i}`, "kare"] as [string, string, string]) : [])] };
  }
  if (/(müzik|şarkı|fon müziği)/.test(k) && !tarif.dugumler.some((d) => d.tur === "muzik")) {
    const satir = Math.max(...tarif.dugumler.map((d) => d.sira)) + 1;
    tarif.dugumler.push({ k: "muz", tur: "muzik", kol: 1, sira: satir, metin: `${t} için fon müziği`, ayar: { sure: "30", enstrumantal: true } });
  }
  if (ses && !tarif.dugumler.some((d) => d.tur === "dublaj" || d.tur === "transkript")) {
    const enSag = Math.max(...tarif.dugumler.map((d) => d.kol));
    const satir = Math.max(...tarif.dugumler.map((d) => d.sira)) + 1;
    tarif.dugumler.push({ k: "asis", tur: "asistan", kol: 0, sira: satir, metin: `Şu iş için 20 saniyelik bir seslendirme metni yaz: ${t}` }, { k: "sesd", tur: "ses", kol: Math.min(2, enSag), sira: satir });
    tarif.kenarlar.push(["asis", "sesd", "metin"]);
  }
  const adimlar = tarif.dugumler.map((d) => ({ ad: d.ad ?? KATALOG[d.tur].ad, tur: d.tur, kredi: dugumKredi({ tur: d.tur, model: d.model ?? KATALOG[d.tur].model, ayar: { adet: 1, ...(d.ayar ?? {}) }, metin: d.metin ?? "" }) }));
  return { tarif, adimlar, kredi: adimlar.reduce((s, a) => s + a.kredi, 0) };
}
