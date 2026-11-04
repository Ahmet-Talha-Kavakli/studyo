import { GORSEL_MODELLER as GORSEL_KATALOG, gorselModelBul, cozunurlukCarpani, type GorselModel } from "@/lib/gorselModelVeri";
import { MODEL_AILELERI, videoModelBul, videoModelOzellik } from "@/lib/videoModelVeri";
import { videoKredi, HAREKETLER } from "@/components/studyo/video/veri";
import { SES_URETIM_MODELLERI, CIKTI_BICIMLERI, DILLER_SIRALI } from "@/lib/sesVeri";
import { MUZIK_MODELLERI, MUZIK_BICIMLERI, muzikKredi } from "@/lib/muzikVeri";
import { UPSCALE_MODELLERI, TOPAZ_ALT, upscaleKredi, type UpscaleModelId } from "@/lib/upscaleVeri";
import { MODELLER_3D, STILLER, POLIGON_HAZIR } from "@/components/studyo/ucboyut/veri";
import type { DugumTur } from "./katalog";

/**
 * Düğüm ayar şeması: her düğümün kontrolleri, seçili MODELİN gerçek yeteneklerinden türetilir (stüdyolarla aynı kaynak).
 * Görsel: oran, çözünürlük, kalite, adet, şeffaf, negatif, tohum. Video: oran, süre, çözünürlük, ses, kamera hareketi, çok çekim.
 * Ses: dil, hız, kararlılık, benzerlik, stil, biçim, tohum. Müzik: süre, enstrümantal, biçim. Efekt: süre, döngü, istem etkisi.
 * `cip`: düğümün üstünde hızlı çip olarak da görünür; diğerleri Ayarlar panelinde.
 */
export type Secenek = { deger: string; ad: string; alt?: string };
export type Kontrol =
  | { id: string; ad: string; tur: "secim"; secenekler: Secenek[]; varsayilan: string; cip?: boolean; aciklama?: string }
  | { id: string; ad: string; tur: "anahtar"; varsayilan: boolean; cip?: boolean; aciklama?: string }
  | { id: string; ad: string; tur: "kaydirici"; min: number; max: number; adim: number; varsayilan: number; birim?: string; aciklama?: string }
  | { id: string; ad: string; tur: "tohum"; aciklama?: string }
  | { id: string; ad: string; tur: "metin"; yerTutucu: string; aciklama?: string };

export type ModelSecenek = { ad: string; alt: string; kredi: number; rozet?: string; grup: string; not?: string };

/* ── Modeller ── */
export const gorselModelleri = (): ModelSecenek[] => GORSEL_KATALOG.filter((m) => !m.gizli).map((m) => ({ ad: m.ad, alt: m.ozet, kredi: m.kredi ?? 4, rozet: m.rozet, grup: m.grup === "one" ? "Öne çıkan" : "Tüm modeller", not: m.api.refZorunlu ? "Referans görsel gerekir" : m.tip === "swap" ? "İki görsel gerekir" : undefined }));
export const videoModelleri = (): ModelSecenek[] => MODEL_AILELERI.flatMap((a) => a.varyantlar.map((v) => ({ ad: v.ad, alt: `${a.ozet} · ${v.coz} · ${v.sureAralik.replace("sn", " sn")}${v.ses ? " · sesli" : ""}`, kredi: v.kredi, rozet: v.rozet, grup: a.grup === "one" ? "Öne çıkan" : a.ad })))
  .filter((m, i, l) => l.findIndex((x) => x.ad === m.ad) === i);
export const sesModelleri = (): ModelSecenek[] => SES_URETIM_MODELLERI.map((m) => ({ ad: m.ad, alt: m.ozet, kredi: 1, rozet: m.rozet, grup: m.saglayici ? "Kullanılabilir" : "Yakında", not: m.saglayici ? undefined : "Yakında" }));
export const muzikModelleri = (): ModelSecenek[] => MUZIK_MODELLERI.map((m) => ({ ad: m.ad, alt: m.ozet, kredi: muzikKredi(m.ad, 30), rozet: m.rozet, grup: m.saglayici === "eleven" ? "ElevenLabs" : "Google" }));

export function modelListesi(tur: DugumTur): ModelSecenek[] {
  if (tur === "gorsel" || tur === "duzenle") return gorselModelleri().filter((m) => tur === "gorsel" || /Banana|Kontext|Seedream|GPT Image|FLUX|Çoklu|Kling O3|Grok/.test(m.ad));
  if (tur === "video" || tur === "videoUzat") return videoModelleri();
  if (tur === "ucBoyut") return MODELLER_3D.map((m) => ({ ad: m.ad, alt: `${m.alt} · ${m.sure}`, kredi: m.taslak, rozet: "rozet" in m ? m.rozet : undefined, grup: "3D" }));
  if (tur === "aiBuyut" || tur === "videoBuyut") return UPSCALE_MODELLERI.filter((m) => m.tur === (tur === "aiBuyut" ? "gorsel" : "video")).map((m) => ({ ad: m.id, alt: `${m.ad} · ${m.ozet}`, kredi: upscaleKredi(m.id, 8, 5, 2), grup: m.eksen, rozet: m.hiz }));
  if (tur === "ses") return sesModelleri();
  if (tur === "muzik") return muzikModelleri();
  return [];
}

const ORAN_AD: Record<string, string> = { "1:1": "Kare", "16:9": "Yatay", "9:16": "Dikey", "4:5": "Portre", "3:4": "Portre", "2:3": "Portre", "21:9": "Sinema", "4:3": "Klasik", "3:2": "Fotoğraf", "5:4": "Kare+", Auto: "Otomatik" };
const oranSecenek = (l: string[]): Secenek[] => l.map((o) => ({ deger: o, ad: o === "Auto" ? "Otomatik" : o, alt: ORAN_AD[o] }));

/* ── Şema ── */
export function kontroller(tur: DugumTur, model?: string): Kontrol[] {
  if (tur === "gorsel" || tur === "duzenle") {
    const m: GorselModel | undefined = gorselModelBul(model ?? "") ?? GORSEL_KATALOG[0];
    const l: Kontrol[] = [];
    const oranlar = m.api.oranlar.length ? m.api.oranlar : ["1:1"];
    if (tur === "gorsel" || m.api.oranlar.length) l.push({ id: "oran", ad: "Oran", tur: "secim", secenekler: oranSecenek(tur === "duzenle" ? ["Auto", ...oranlar] : oranlar), varsayilan: tur === "duzenle" ? "Auto" : m.varsayilanOran && oranlar.includes(m.varsayilanOran) ? m.varsayilanOran : oranlar[0], cip: true });
    if (m.cozunurluk && m.api.cozunurluklar.length) l.push({ id: "cozunurluk", ad: "Çözünürlük", tur: "secim", secenekler: m.api.cozunurluklar.map((c) => ({ deger: c, ad: c, alt: c === "4K" ? "×2 kredi" : c === "3K" ? "×1,5 kredi" : undefined })), varsayilan: m.api.cozunurluklar[0], cip: true });
    if (m.kaliteSeviye?.length) l.push({ id: "kalite", ad: "Kalite", tur: "secim", secenekler: m.kaliteSeviye.map((k) => ({ deger: k, ad: k })), varsayilan: m.kaliteSeviye[Math.min(1, m.kaliteSeviye.length - 1)], cip: true });
    if (!m.adetGizli) l.push({ id: "adet", ad: "Adet", tur: "secim", secenekler: ["1", "2", "3", "4"].map((n) => ({ deger: n, ad: `${n} görsel` })), varsayilan: "1", cip: true });
    if (m.api.seffaf) l.push({ id: "seffaf", ad: "Şeffaf arka plan", tur: "anahtar", varsayilan: false, aciklama: "PNG, arka plansız çıktı" });
    if (m.api.negatif) l.push({ id: "negatif", ad: "Negatif istem", tur: "metin", yerTutucu: "İstemediğin öğeler: bulanık, yazı, filigran…" });
    if (m.api.tohum) l.push({ id: "tohum", ad: "Tohum", tur: "tohum", aciklama: "Aynı tohum aynı istemle benzer sonuç verir" });
    return l;
  }
  if (tur === "video" || tur === "videoUzat") {
    const oz = videoModelOzellik(model ?? "Seedance 2.0 Fast");
    const v = videoModelBul(model ?? "");
    const l: Kontrol[] = [];
    if (!oz.oranGizli && oz.oranlar.length) l.push({ id: "oran", ad: "Oran", tur: "secim", secenekler: oranSecenek(oz.oranlar), varsayilan: oz.oran ?? oz.oranlar[0], cip: true });
    if (!oz.sureGizli && oz.sureler.length) l.push({ id: "sure", ad: "Süre", tur: "secim", secenekler: oz.sureler.map((s) => ({ deger: String(s), ad: `${s} sn` })), varsayilan: String(oz.sure), cip: true });
    if (oz.cozler.length) l.push({ id: "cozunurluk", ad: "Çözünürlük", tur: "secim", secenekler: oz.cozler.map((c) => ({ deger: c, ad: c })), varsayilan: oz.coz, cip: true });
    if (oz.sesToggle) l.push({ id: "ses", ad: "Ses üret", tur: "anahtar", varsayilan: false, cip: true, aciklama: "Ortam sesi ve diyalog (×1,25 kredi)" });
    l.push({ id: "hareket", ad: "Kamera hareketi", tur: "secim", secenekler: [{ deger: "", ad: "Serbest", alt: "Model karar verir" }, ...HAREKETLER.map((h) => ({ deger: h.ad, ad: h.ad.charAt(0) + h.ad.slice(1).toLocaleLowerCase("tr"), alt: h.not }))], varsayilan: "" });
    if (oz.cokCekim) l.push({ id: "cokCekim", ad: "Çok çekimli", tur: "anahtar", varsayilan: false, aciklama: "Model sahneyi birden çok çekime böler" });
    void v;
    return l;
  }
  if (tur === "ses") {
    const m = SES_URETIM_MODELLERI.find((x) => x.ad === model) ?? SES_URETIM_MODELLERI[0];
    const l: Kontrol[] = [
      { id: "dil", ad: "Dil", tur: "secim", secenekler: [{ deger: "", ad: "Otomatik", alt: "Metinden algılanır" }, ...DILLER_SIRALI.map((d) => ({ deger: d.kod, ad: `${d.bayrak} ${d.ad.charAt(0)}${d.ad.slice(1).toLocaleLowerCase("tr")}` }))], varsayilan: "", cip: true },
      { id: "kararlilik", ad: "Kararlılık", tur: "kaydirici", min: 0, max: 1, adim: 0.05, varsayilan: 0.5, aciklama: "Düşük: daha duygulu ve değişken · Yüksek: daha tekdüze" },
    ];
    if (m.ayrintiliAyar) l.push(
      { id: "hiz", ad: "Hız", tur: "kaydirici", min: 0.7, max: 1.2, adim: 0.05, varsayilan: 1, birim: "×" },
      { id: "benzerlik", ad: "Benzerlik", tur: "kaydirici", min: 0, max: 1, adim: 0.05, varsayilan: 0.75, aciklama: "Özgün sese ne kadar yakın" },
      { id: "stil", ad: "Stil abartısı", tur: "kaydirici", min: 0, max: 1, adim: 0.05, varsayilan: 0 },
    );
    l.push({ id: "bicim", ad: "Biçim", tur: "secim", secenekler: CIKTI_BICIMLERI.map((b) => ({ deger: b.id, ad: b.ad, alt: b.not })), varsayilan: CIKTI_BICIMLERI[0].id }, { id: "tohum", ad: "Tohum", tur: "tohum" });
    return l;
  }
  if (tur === "muzik") {
    const m = MUZIK_MODELLERI.find((x) => x.ad === model) ?? MUZIK_MODELLERI[0];
    const l: Kontrol[] = [];
    if (m.sure.tur === "aralik") l.push({ id: "sure", ad: "Süre", tur: "secim", secenekler: [["", "Otomatik"], ["15", "15 sn"], ["30", "30 sn"], ["60", "1 dk"], ["120", "2 dk"], ["180", "3 dk"]].map(([d, a]) => ({ deger: d, ad: a })), varsayilan: "30", cip: true });
    l.push({ id: "enstrumantal", ad: "Enstrümantal", tur: "anahtar", varsayilan: true, cip: true, aciklama: "Kapalıysa vokal ve söz üretilir" });
    if (m.negatif) l.push({ id: "haric", ad: "Hariç tut", tur: "metin", yerTutucu: "İstemediğin stiller: davul, vokal…" });
    l.push({ id: "bicim", ad: "Biçim", tur: "secim", secenekler: MUZIK_BICIMLERI.map((b) => ({ deger: b.id, ad: b.ad, alt: b.not })), varsayilan: MUZIK_BICIMLERI[0].id });
    return l;
  }
  if (tur === "efekt") return [
    { id: "sure", ad: "Süre", tur: "secim", secenekler: [["", "Otomatik"], ["2", "2 sn"], ["5", "5 sn"], ["10", "10 sn"], ["20", "20 sn"], ["30", "30 sn"]].map(([d, a]) => ({ deger: d, ad: a })), varsayilan: "5", cip: true },
    { id: "dongu", ad: "Döngü", tur: "anahtar", varsayilan: false, cip: true, aciklama: "Kesintisiz tekrar eden ortam sesi" },
    { id: "istemEtkisi", ad: "İsteme bağlılık", tur: "kaydirici", min: 0, max: 1, adim: 0.05, varsayilan: 0.3 },
  ];
  if (tur === "maske") return [{ id: "mod", ad: "İşlem", tur: "secim", secenekler: [{ deger: "duzenle", ad: "Değiştir", alt: "Boyanan alanı isteme göre yeniden üret" }, { deger: "sil", ad: "Nesneyi sil", alt: "Boyanan nesneyi kaldır, arkayı doldur" }], varsayilan: "duzenle", cip: true }];
  if (tur === "videoKes") return [
    { id: "bas", ad: "Başlangıç", tur: "kaydirici", min: 0, max: 60, adim: 0.1, varsayilan: 0, birim: "sn" },
    { id: "son", ad: "Bitiş (0 = sonuna kadar)", tur: "kaydirici", min: 0, max: 60, adim: 0.1, varsayilan: 0, birim: "sn" },
    { id: "hiz", ad: "Hız", tur: "secim", secenekler: ["0.5", "0.75", "1", "1.25", "1.5", "2", "3"].map((x) => ({ deger: x, ad: `${x.replace(".", ",")}×` })), varsayilan: "1", cip: true },
  ];
  if (tur === "videoBirlestir") return [
    { id: "gecis", ad: "Geçiş", tur: "secim", secenekler: [{ deger: "yok", ad: "Kesme" }, { deger: "karartma", ad: "Karartma" }, { deger: "beyaz", ad: "Beyaza geçiş" }], varsayilan: "karartma", cip: true },
    { id: "gecisSn", ad: "Geçiş süresi", tur: "kaydirici", min: 0.1, max: 1.5, adim: 0.1, varsayilan: 0.4, birim: "sn" },
    { id: "klipSes", ad: "Klip sesi", tur: "kaydirici", min: 0, max: 1, adim: 0.05, varsayilan: 1 },
    { id: "muzikSes", ad: "Müzik seviyesi", tur: "kaydirici", min: 0, max: 1, adim: 0.05, varsayilan: 0.6 },
  ];
  if (tur === "sesEkle") return [
    { id: "klipSes", ad: "Videonun kendi sesi", tur: "kaydirici", min: 0, max: 1, adim: 0.05, varsayilan: 0.3 },
    { id: "yeniSes", ad: "Eklenen ses", tur: "kaydirici", min: 0, max: 1, adim: 0.05, varsayilan: 1 },
    { id: "dongu", ad: "Ses kısaysa döngüle", tur: "anahtar", varsayilan: true, cip: true },
  ];
  if (tur === "yazi") return [
    { id: "konum", ad: "Konum", tur: "secim", secenekler: [{ deger: "alt", ad: "Alt" }, { deger: "orta", ad: "Orta" }, { deger: "ust", ad: "Üst" }], varsayilan: "alt", cip: true },
    { id: "stil", ad: "Stil", tur: "secim", secenekler: [{ deger: "golge", ad: "Gölgeli" }, { deger: "serit", ad: "Şerit" }, { deger: "etiket", ad: "Etiket" }, { deger: "sade", ad: "Sade" }], varsayilan: "golge", cip: true },
    { id: "boyut", ad: "Boyut", tur: "kaydirici", min: 2, max: 14, adim: 0.5, varsayilan: 6, birim: "%" },
    { id: "kalin", ad: "Kalın", tur: "anahtar", varsayilan: true },
    { id: "renk", ad: "Renk", tur: "secim", secenekler: [{ deger: "#ffffff", ad: "Beyaz" }, { deger: "#111111", ad: "Siyah" }, { deger: "#fbbf24", ad: "Sarı" }, { deger: "#22d3ee", ad: "Turkuaz" }, { deger: "#f472b6", ad: "Pembe" }], varsayilan: "#ffffff" },
  ];
  if (tur === "katman") return [
    { id: "konum", ad: "Konum", tur: "secim", secenekler: [{ deger: "orta", ad: "Orta" }, { deger: "solUst", ad: "Sol üst" }, { deger: "sagUst", ad: "Sağ üst" }, { deger: "solAlt", ad: "Sol alt" }, { deger: "sagAlt", ad: "Sağ alt" }, { deger: "kapla", ad: "Tamamını kapla" }], varsayilan: "orta", cip: true },
    { id: "olcek", ad: "Boyut", tur: "kaydirici", min: 5, max: 100, adim: 1, varsayilan: 40, birim: "%" },
    { id: "opaklik", ad: "Opaklık", tur: "kaydirici", min: 0, max: 100, adim: 1, varsayilan: 100, birim: "%" },
    { id: "karisim", ad: "Karışım", tur: "secim", secenekler: [{ deger: "source-over", ad: "Normal" }, { deger: "multiply", ad: "Çarp" }, { deger: "screen", ad: "Ekran" }, { deger: "overlay", ad: "Bindir" }, { deger: "soft-light", ad: "Yumuşak ışık" }, { deger: "difference", ad: "Fark" }], varsayilan: "source-over", cip: true },
    { id: "kenar", ad: "Kenar boşluğu", tur: "kaydirici", min: 0, max: 20, adim: 1, varsayilan: 4, birim: "%" },
  ];
  if (tur === "sonKare") return [
    { id: "an", ad: "Hangi kare", tur: "secim", secenekler: [{ deger: "son", ad: "Son kare" }, { deger: "orta", ad: "Ortadaki kare" }, { deger: "ilk", ad: "İlk kare" }], varsayilan: "son", cip: true },
  ];
  if (tur === "kolaj") return [
    { id: "sutun", ad: "Sütun", tur: "secim", secenekler: ["0", "1", "2", "3", "4"].map((n) => ({ deger: n, ad: n === "0" ? "Otomatik" : n })), varsayilan: "0", cip: true },
    { id: "bosluk", ad: "Boşluk", tur: "kaydirici", min: 0, max: 48, adim: 2, varsayilan: 12, birim: "px" },
    { id: "zemin", ad: "Zemin", tur: "secim", secenekler: [{ deger: "#000000", ad: "Siyah" }, { deger: "#ffffff", ad: "Beyaz" }, { deger: "#121214", ad: "Koyu" }], varsayilan: "#121214" },
  ];
  if (tur === "sec") return [
    { id: "yontem", ad: "Seçim", tur: "secim", secenekler: [{ deger: "sira", ad: "Sıradaki" }, { deger: "rastgele", ad: "Rastgele" }], varsayilan: "sira", cip: true },
    { id: "sira", ad: "Sıra", tur: "kaydirici", min: 1, max: 20, adim: 1, varsayilan: 1 },
  ];
  if (tur === "ucBoyut") {
    const m = MODELLER_3D.find((x) => x.ad === model) ?? MODELLER_3D[0];
    return [
      { id: "stil", ad: "Stil", tur: "secim", secenekler: STILLER.map((s) => ({ deger: s.id, ad: s.ad })), varsayilan: STILLER[0].id, cip: true },
      { id: "poligon", ad: "Poligon", tur: "secim", secenekler: POLIGON_HAZIR.map((p) => ({ deger: String(p), ad: p >= 1000 ? `${p / 1000}B` : String(p) })), varsayilan: "30000", cip: true },
      ...("quad" in m && m.quad ? [] : [{ id: "topoloji", ad: "Topoloji", tur: "secim" as const, secenekler: [{ deger: "triangle", ad: "Üçgen" }, { deger: "quad", ad: "Dörtgen" }], varsayilan: "triangle" }]),
    ];
  }
  if (tur === "genislet") return [{ id: "oran", ad: "Hedef oran", tur: "secim", secenekler: oranSecenek(["16:9", "9:16", "1:1", "4:5", "3:2", "2:3", "21:9"]), varsayilan: "16:9", cip: true }];
  if (tur === "isik") return [
    { id: "yon", ad: "Işık yönü", tur: "secim", secenekler: ["Sol", "Sağ", "Üst", "Arka", "Ön", "Alt"].map((x) => ({ deger: x, ad: x })), varsayilan: "Sol", cip: true },
    { id: "sertlik", ad: "Sertlik", tur: "secim", secenekler: ["Yumuşak", "Orta", "Sert"].map((x) => ({ deger: x, ad: x })), varsayilan: "Yumuşak", cip: true },
    { id: "renk", ad: "Işık rengi", tur: "secim", secenekler: ["Gün ışığı", "Altın saat", "Mavi saat", "Neon", "Mum ışığı", "Stüdyo beyazı"].map((x) => ({ deger: x, ad: x })), varsayilan: "Gün ışığı", cip: true },
  ];
  if (tur === "giydir") return [
    { id: "kategori", ad: "Kıyafet türü", tur: "secim", secenekler: [{ deger: "auto", ad: "Otomatik" }, { deger: "tops", ad: "Üst" }, { deger: "bottoms", ad: "Alt" }, { deger: "one-pieces", ad: "Tek parça" }], varsayilan: "auto", cip: true },
    { id: "foto", ad: "Kıyafet fotoğrafı", tur: "secim", secenekler: [{ deger: "auto", ad: "Otomatik" }, { deger: "model", ad: "Mankende" }, { deger: "flat-lay", ad: "Serili" }], varsayilan: "auto" },
    { id: "mod", ad: "Kalite", tur: "secim", secenekler: [{ deger: "performance", ad: "Hızlı" }, { deger: "balanced", ad: "Dengeli" }, { deger: "quality", ad: "En iyi" }], varsayilan: "balanced", cip: true },
  ];
  if (tur === "aiBuyut" || tur === "videoBuyut") {
    const m = UPSCALE_MODELLERI.find((x) => x.id === model) ?? UPSCALE_MODELLERI.find((x) => x.tur === (tur === "aiBuyut" ? "gorsel" : "video"))!;
    const l: Kontrol[] = [];
    if (m.olcekler.length) l.push({ id: "olcek", ad: "Ölçek", tur: "secim", secenekler: m.olcekler.map((o) => ({ deger: String(o), ad: `${o}×` })), varsayilan: String(m.olcekler[0]), cip: true });
    if (m.id === "topaz") l.push({ id: "topazModel", ad: "İçerik türü", tur: "secim", secenekler: TOPAZ_ALT.map((x) => ({ deger: x.id, ad: x.ad, alt: x.ozet })), varsayilan: "Standard V2", cip: true }, { id: "yuz", ad: "Yüz iyileştirme", tur: "anahtar", varsayilan: true });
    if (m.id === "clarity") l.push({ id: "yaraticilik", ad: "Yaratıcılık", tur: "kaydirici", min: 0, max: 1, adim: 0.05, varsayilan: 0.35 }, { id: "benzerlik", ad: "Benzerlik", tur: "kaydirici", min: 0, max: 1, adim: 0.05, varsayilan: 0.6 });
    if (m.id === "crystal") l.push({ id: "yaraticilik", ad: "Yaratıcılık", tur: "kaydirici", min: 0, max: 10, adim: 1, varsayilan: 2 });
    if (m.id === "seedvr" || m.id === "seedvr-video") l.push({ id: "gren", ad: "Gren", tur: "kaydirici", min: 0, max: 1, adim: 0.05, varsayilan: 0.1 });
    if (m.id === "flashvsr") l.push({ id: "sesKoru", ad: "Sesi koru", tur: "anahtar", varsayilan: true });
    return l;
  }
  if (tur === "kirp") return [
    { id: "oran", ad: "Oran", tur: "secim", secenekler: [{ deger: "Orijinal", ad: "Orijinal" }, ...oranSecenek(["1:1", "16:9", "9:16", "4:5", "3:2", "2:3", "21:9"])], varsayilan: "Orijinal", cip: true },
    { id: "konum", ad: "Kırpma yeri", tur: "secim", secenekler: [{ deger: "orta", ad: "Orta" }, { deger: "ust", ad: "Üst / sol" }, { deger: "alt", ad: "Alt / sağ" }], varsayilan: "orta" },
    { id: "donme", ad: "Döndür", tur: "secim", secenekler: [{ deger: "0", ad: "Yok" }, { deger: "90", ad: "90°" }, { deger: "180", ad: "180°" }, { deger: "270", ad: "270°" }], varsayilan: "0", cip: true },
    { id: "yatay", ad: "Yatay çevir", tur: "anahtar", varsayilan: false },
    { id: "dikey", ad: "Dikey çevir", tur: "anahtar", varsayilan: false },
    { id: "genislik", ad: "En fazla genişlik", tur: "secim", secenekler: [{ deger: "0", ad: "Değiştirme" }, { deger: "512", ad: "512 px" }, { deger: "1024", ad: "1024 px" }, { deger: "1536", ad: "1536 px" }, { deger: "2048", ad: "2048 px" }], varsayilan: "0" },
  ];
  if (tur === "renk") return [
    { id: "hazir", ad: "Hazır görünüm", tur: "secim", secenekler: ["Yok", "Sıcak", "Soğuk", "Sinematik", "Soluk film", "Canlı", "Siyah beyaz", "Sepya"].map((x) => ({ deger: x, ad: x })), varsayilan: "Yok", cip: true },
    { id: "parlaklik", ad: "Parlaklık", tur: "kaydirici", min: -50, max: 50, adim: 1, varsayilan: 0 },
    { id: "kontrast", ad: "Kontrast", tur: "kaydirici", min: -50, max: 50, adim: 1, varsayilan: 0 },
    { id: "doygunluk", ad: "Doygunluk", tur: "kaydirici", min: -100, max: 100, adim: 1, varsayilan: 0 },
    { id: "sicaklik", ad: "Sıcaklık", tur: "kaydirici", min: -50, max: 50, adim: 1, varsayilan: 0 },
    { id: "bulaniklik", ad: "Bulanıklık", tur: "kaydirici", min: 0, max: 20, adim: 0.5, varsayilan: 0, birim: "px" },
    { id: "vinyet", ad: "Vinyet", tur: "kaydirici", min: 0, max: 100, adim: 1, varsayilan: 0 },
    { id: "keskinlik", ad: "Keskinlik", tur: "kaydirici", min: 0, max: 100, adim: 1, varsayilan: 0 },
    { id: "ters", ad: "Negatif", tur: "anahtar", varsayilan: false },
  ];
  if (tur === "sesDegistir") return [
    { id: "kararlilik", ad: "Kararlılık", tur: "kaydirici", min: 0, max: 1, adim: 0.05, varsayilan: 0.5 },
    { id: "benzerlik", ad: "Benzerlik", tur: "kaydirici", min: 0, max: 1, adim: 0.05, varsayilan: 0.75 },
    { id: "gurultu", ad: "Arka plan gürültüsünü temizle", tur: "anahtar", varsayilan: true },
  ];
  if (tur === "dublaj") return [
    { id: "hedefDil", ad: "Hedef dil", tur: "secim", secenekler: DILLER_SIRALI.map((d) => ({ deger: d.kod, ad: `${d.bayrak} ${d.ad.charAt(0)}${d.ad.slice(1).toLocaleLowerCase("tr")}` })), varsayilan: "en", cip: true },
    { id: "konusmaci", ad: "Konuşmacı sayısı", tur: "secim", secenekler: ["0", "1", "2", "3", "4"].map((n) => ({ deger: n, ad: n === "0" ? "Otomatik" : n })), varsayilan: "0" },
  ];
  if (tur === "transkript") return [{ id: "dil", ad: "Konuşma dili", tur: "secim", secenekler: [{ deger: "", ad: "Otomatik" }, ...DILLER_SIRALI.map((d) => ({ deger: d.kod, ad: `${d.bayrak} ${d.ad.charAt(0)}${d.ad.slice(1).toLocaleLowerCase("tr")}` }))], varsayilan: "", cip: true }];
  if (tur === "tarif") return [{ id: "odak", ad: "Odak", tur: "secim", secenekler: [{ deger: "tam", ad: "Tam tarif" }, { deger: "stil", ad: "Yalnız stil" }, { deger: "ozne", ad: "Yalnız özne" }], varsayilan: "tam", cip: true }];
  if (tur === "sahneler") return [{ id: "adet", ad: "Sahne sayısı", tur: "secim", secenekler: ["2", "3", "4", "5", "6", "8"].map((n) => ({ deger: n, ad: `${n} sahne` })), varsayilan: "4", cip: true }];
  if (tur === "buyut") return [{ id: "olcek", ad: "Ölçek", tur: "secim", secenekler: [{ deger: "2", ad: "2×" }, { deger: "4", ad: "4×" }], varsayilan: "2", cip: true }, { id: "keskinlik", ad: "Keskinlik", tur: "kaydirici", min: 0, max: 1, adim: 0.05, varsayilan: 0.35 }];
  if (tur === "asistan") return [{ id: "cikti", ad: "Çıktı", tur: "secim", secenekler: [{ deger: "metin", ad: "Tek metin" }, { deger: "liste", ad: "Liste", alt: "Her satır ayrı öğe; sonraki düğüm her biri için çalışır" }], varsayilan: "metin", cip: true },
    { id: "uzunluk", ad: "Uzunluk", tur: "secim", secenekler: [{ deger: "kisa", ad: "Kısa" }, { deger: "orta", ad: "Orta" }, { deger: "uzun", ad: "Uzun" }], varsayilan: "orta" }];
  return [];
}

/** Modele özgü bilgi notu (ör. "yalnız görselden video üretir"). */
export function modelNotu(tur: DugumTur, model?: string): string | undefined {
  if (tur === "video" || tur === "videoUzat") return videoModelOzellik(model ?? "Seedance 2.0 Fast").not;
  if (tur === "aiBuyut" || tur === "videoBuyut") return UPSCALE_MODELLERI.find((x) => x.id === model)?.ozet;
  if (tur === "transkript" || tur === "dublaj" || tur === "sesTemizle" || tur === "sesDegistir") return "Kayıt dakikası başına ücretlendirilir; tahmin 1 dakikalık kayıt içindir.";
  if (tur === "birlestir") return "İstem kutusunda {1}, {2}, {3} bağlı metinlerin yerine geçer. Boş bırakırsan sırayla alt alta birleşir.";
  if (tur === "gorsel" || tur === "duzenle") { const m = gorselModelBul(model ?? ""); return m?.api.refZorunlu ? "Bu model en az bir referans görsel ister." : undefined; }
  if (tur === "ses") { const m = SES_URETIM_MODELLERI.find((x) => x.ad === model); return m && !m.saglayici ? "Bu model yakında; şimdilik başka bir model seç." : undefined; }
  return undefined;
}
/** Video modeli son kareyi destekliyor mu. */
export const sonKareDestek = (model?: string) => videoModelOzellik(model ?? "Seedance 2.0 Fast").kutu === "kareler";

/** Ayar değeri (yoksa şemadaki varsayılan). */
export function ayarDeger(k: Kontrol, ayar: Record<string, unknown>): string | number | boolean | undefined {
  const v = ayar[k.id];
  if (v !== undefined && v !== "") return v as string | number | boolean;
  return "varsayilan" in k ? k.varsayilan : undefined;
}
/** Şemaya göre tam ayar (model değişince geçersiz değerler varsayılana döner). */
export function ayarNormalize(tur: DugumTur, model: string | undefined, ayar: Record<string, unknown>) {
  const n: Record<string, string | number | boolean> = {};
  for (const k of kontroller(tur, model)) {
    const v = ayar[k.id];
    if (k.tur === "secim") n[k.id] = k.secenekler.some((s) => s.deger === String(v ?? "")) ? String(v ?? "") : k.varsayilan;
    else if (k.tur === "anahtar") n[k.id] = typeof v === "boolean" ? v : k.varsayilan;
    else if (k.tur === "kaydirici") n[k.id] = typeof v === "number" ? Math.min(k.max, Math.max(k.min, v)) : k.varsayilan;
    else if (v !== undefined && v !== "") n[k.id] = v as string | number;
  }
  return n;
}

/** Kredi tahmini (stüdyolarla aynı formüller). */
export function ayarKredi(tur: DugumTur, model: string | undefined, ayar: Record<string, unknown>, metinUzunluk = 0, oge = 1): number {
  const a = ayarNormalize(tur, model, ayar);
  let k = 0;
  if (tur === "gorsel" || tur === "duzenle") { const m = gorselModelBul(model ?? "") ?? GORSEL_KATALOG[0]; k = Math.ceil((m.kredi ?? 4) * cozunurlukCarpani(String(a.cozunurluk ?? "")) * Number(a.adet ?? 1) * 100) / 100; }
  else if (tur === "video") k = videoKredi(model ?? "Seedance 2.0 Fast", { sure: a.sure ? Number(a.sure) : undefined, coz: a.cozunurluk ? String(a.cozunurluk) : undefined, ses: !!a.ses });
  else if (tur === "ses") k = Math.max(1, Math.ceil((metinUzunluk || 1) / 1000)) * (/Flash/.test(model ?? "") ? 0.5 : 1);
  else if (tur === "muzik") k = muzikKredi(model ?? MUZIK_MODELLERI[0].ad, a.sure ? Number(a.sure) : null);
  else if (tur === "efekt") k = a.sure ? Math.max(1, Math.ceil(Number(a.sure) / 10)) : 2;
  else if (tur === "arkaplan") k = 1;
  else if (tur === "genislet" || tur === "isik" || tur === "zemin" || tur === "yuz" || tur === "eskiz") k = 2;
  else if (tur === "maske") k = 3;
  else if (tur === "ucBoyut") k = (MODELLER_3D.find((x) => x.ad === model) ?? MODELLER_3D[0]).taslak;
  else if (tur === "giydir") k = a.mod === "quality" ? 4 : 3;
  else if (tur === "aiBuyut") k = upscaleKredi((model ?? "seedvr") as UpscaleModelId, 8 * Math.pow(Number(a.olcek ?? 2) / 2, 2), 0, Number(a.olcek ?? 2));
  else if (tur === "videoBuyut") k = upscaleKredi((model ?? "flashvsr") as UpscaleModelId, 0, 5, Number(a.olcek ?? 2));
  else if (tur === "videoUzat") k = videoKredi(model ?? "Seedance 2.0 Fast", { sure: a.sure ? Number(a.sure) : undefined, coz: a.cozunurluk ? String(a.cozunurluk) : undefined, ses: !!a.ses });
  else if (tur === "transkript" || tur === "sesDegistir" || tur === "sesTemizle") k = 1;
  else if (tur === "dublaj") k = 12;
  return Math.ceil(k * oge * 100) / 100;
}
