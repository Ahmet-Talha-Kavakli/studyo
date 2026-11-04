/**
 * Topluluk presetleri (2026-10-31): Vayra'nın resmi presetlerinin yanında kullanıcıların yayınladığı presetler.
 * Sunucu bağlanana kadar topluluk örnek içerikle dolar (yaratıcılar ve sayılar örnektir; sayfada bir kez belirtilir).
 * Kullanıcının "Toplulukta yayınla" dediği kendi presetleri de bu akışa katılır.
 *
 * Kazanç kuralı (Earn > Marketplace ile aynı): yaratıcı taban bedelin üstüne ek fiyat koyar (0, 8, 16 ya da 24 kredi);
 * ek fiyatın yarısı yaratıcıya, yarısı Vayra'ya gider. Yaratıcının kendi kullanımı kazanç sayılmaz.
 */

import { RESMI_PRESETLER, OZEL_KREDI, type KatalogPreset } from "@/lib/presetKatalog";
import type { OzelPreset } from "@/store/usePresetler";
import type { Paylasim } from "@/store/usePaylasim";

export interface Yaratici { kullanici: string; ad: string; ton: number; dogrulanmis?: boolean; takipci: number; bio: string }

export const YARATICILAR: Yaratici[] = [
  { kullanici: "@neonmancer", ad: "Deniz Arslan", ton: 196, dogrulanmis: true, takipci: 18400, bio: "Neon, gece ve şehir efektleri." },
  { kullanici: "@velvetlens", ad: "Elif Kaya", ton: 24, dogrulanmis: true, takipci: 12100, bio: "Sinematik portre ve ışık." },
  { kullanici: "@studio.mira", ad: "Mira Stüdyo", ton: 282, takipci: 9300, bio: "Ürün ve reklam hareketleri." },
  { kullanici: "@0xrender", ad: "Kerem Ay", ton: 140, takipci: 7600, bio: "3B, dönüşüm ve fizik." },
  { kullanici: "@auroraflux", ad: "Aurora Flux", ton: 320, dogrulanmis: true, takipci: 15800, bio: "Fantastik ve masalsı sahneler." },
  { kullanici: "@filmisdead", ad: "Can Demir", ton: 48, takipci: 5200, bio: "Analog film ve eski dokular." },
  { kullanici: "@matrixcam", ad: "Selin Uçar", ton: 168, takipci: 6900, bio: "Kamera hareketleri ve bullet time." },
  { kullanici: "@sporvizyon", ad: "Burak Tan", ton: 8, takipci: 4100, bio: "Spor ve aksiyon anları." },
];
export const yaraticiBul = (k?: string) => YARATICILAR.find((y) => y.kullanici === k);

/** Basit deterministik karışım: aynı slug her yerde aynı sayıyı verir. */
function tohum(s: string) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return Math.abs(h); }

const GUN = 86_400_000;
const BUGUN = Date.UTC(2026, 9, 31);

/** [ad, açıklama, taban efekt (tarif ve kategori), yaratıcı, ek fiyat, istem görünür mü, gün önce, ek tarif, kapak]. Kapaklar resmi efektlerin görselleriyle çakışmaz. */
const TOHUMLAR: [string, string, string, string, number, boolean, number, string, string][] = [
  ["Neon Dalış", "Dünyadan neon bir şehre dalıp fotoğrafındaki kişiye inen gece versiyonu.", "earth-zoom", "@neonmancer", 16, false, 2, "Night version: the city below glows with pink and cyan neon signs, wet reflective streets, people with umbrellas.", "/gercek/kesfet/cyberpunk-sokak-yagmurusora-2.webp"],
  ["Altın Saat İkizi", "İkizin gün batımında yanına gelir; sıcak, yumuşak bir ışıkla.", "selfie-twin", "@velvetlens", 4, true, 3, "Golden hour backlight, warm soft haze, lens flare.", "/gercek/kesfet/altin-saat-portresiatlas-creative.webp"],
  ["Krom Zırh", "Kişinin üzerinde parça parça parlak krom bir zırh oluşur.", "liquid-metal", "@0xrender", 8, true, 5, "Polished chrome armor plates assemble piece by piece over the body, studio reflections.", "/gercek/kesfet/3d-robot2.webp"],
  ["Kask Vitrini", "Ürün havada süzülüp kendi ekseninde döner; temiz stüdyo ışığı.", "float-spin", "@studio.mira", 12, false, 1, "Premium product turntable, seamless white backdrop, soft reflections.", "/gercek/orig/seed-scifi-kask-meshy.webp"],
  ["Peri Ormanı", "Kişinin çevresinde ışıklı bir peri ormanı açılır, kanatlar belirir.", "fairytale-castle", "@auroraflux", 8, true, 4, "A glowing enchanted forest opens around the subject, translucent fairy wings appear, floating sparkles.", "/gercek/kesfet/fantastik-orman-perisiruh-sinema.webp"],
  ["Super 8 Anı", "70'lerden kalma bir ev videosu gibi; titreyen kare ve sıcak ton.", "orbit-360", "@filmisdead", 4, true, 9, "Super 8 film look, gate weave, warm faded colors, light leaks.", "/gercek/kesfet/gun-batimi-sahiliwanderer.webp"],
  ["Donan An 360", "Zaman durur, kamera havada asılı kalan kişinin etrafında tam tur atar.", "bullet-time", "@matrixcam", 8, false, 6, "Extreme slow motion, debris frozen in air, full 360 orbit.", "/gercek/kesfet/agir-cekim.webp"],
  ["Arena Girişi", "Kişi ışıklar içinde bir arenaya çıkar, kalabalık coşar.", "football-invasion", "@sporvizyon", 4, true, 3, "Huge arena, spotlights sweep, crowd erupts, broadcast camera.", "/gercek/orig/rec-arena.webp"],
  ["Kozmik Yükseliş", "Yerden yükselip yıldızların arasına çıkar.", "elevate", "@auroraflux", 12, false, 2, "Galaxy swirl, nebula colors, slow ascending camera.", "/gercek/kesfet/kozmik-bahcelunavisuals.webp"],
  ["Ürün Açılışı", "Ürün yüzeyden kalkar, yumuşak ışıkta döner ve logo alanı açılır.", "sticker-peel", "@studio.mira", 8, true, 7, "The product lifts off the surface, rotates in soft light and reveals a clean area for the logo.", "/gercek/orig/seed-deri-cuzdan-nanobanana.webp"],
  ["Yıldız Yağmuru", "Gece gökyüzünde kayan yıldızlar; kişi tepede ışığa döner.", "moonwalk", "@neonmancer", 4, true, 10, "Night sky full of shooting stars over mountains, the subject turns toward the light.", "/gercek/kesfet/kayan-yildizlar0xrender.webp"],
  ["Işık Kanatları", "Kişinin arkasında ışıktan kanatlar açılır, alevler yükselir.", "elevate", "@0xrender", 0, true, 12, "Wings made of light unfold behind the subject, embers rise, dramatic storm sky.", "/gercek/kesfet/karakter-donusum9.webp"],
  ["Kağıttan Kumaşa Moda", "Eskiz çizimi gerçek bir elbiseye dönüşür, podyum ışığında.", "sketch-to-fabric", "@velvetlens", 8, false, 4, "Runway spotlight, fabric flows into place.", "/gercek/kesfet/editorial-moda-serisistudio-ela.webp"],
  ["Yörünge Turu", "Kamera kişinin etrafında yörüngede döner, arkada ışıklı bir halka.", "orbit-360", "@matrixcam", 4, true, 8, "Smooth orbit around the subject, a ring of lights behind, night landscape.", "/gercek/kesfet/360-orbit.webp"],
  ["Patlama Anı", "Kişinin arkasında devasa bir patlama yükselir, kamera sarsılır.", "set-on-fire", "@sporvizyon", 8, false, 6, "A massive fireball rises behind the subject, shockwave, camera shake.", "/gercek/kesfet/alev-aldi.webp"],
  ["Lunapark Gecesi", "Kişi gece lunaparkta; ışıklar ve dönme dolap arkada döner.", "orbit-360", "@studio.mira", 4, true, 11, "Night carnival, ferris wheel and colorful rides spinning behind, bokeh lights.", "/gercek/kesfet/karnaval-gecesiatlas-creative.webp"],
];

function toplulukKatalog(): KatalogPreset[] {
  return TOHUMLAR.flatMap(([ad, aciklama, taban, yazar, ekKredi, istemGorunur, gun, ek, kapak], i) => {
    const t = RESMI_PRESETLER.find((p) => p.slug === taban);
    if (!t) return [];
    const h = tohum(ad);
    return [{
      ...t, slug: `t-${taban}-${i + 1}`, ad, aciklama, tarif: `${t.tarif} ${ek}`, kredi: t.kredi + ekKredi, kapak, video: undefined,
      etiket: gun <= 3 ? "Yeni" as const : undefined, oneCikan: false, pro: false, sira: 500 + i,
      yazar, ekKredi, istemGorunur, gorunurluk: "topluluk" as const, tarih: BUGUN - gun * GUN,
      kullanimSayi: 900 + (h % 26000), begeniSayi: 120 + (h % 5200), taban,
    }];
  });
}

/** Resmi presetlere deterministik kullanım ve beğeni sayısı. */
const RESMI_SAYILI: KatalogPreset[] = RESMI_PRESETLER.map((p) => {
  const h = tohum(p.slug);
  const carpan = p.etiket === "Trend" ? 3 : p.oneCikan ? 2 : 1;
  return { ...p, kullanimSayi: (4000 + (h % 30000)) * carpan, begeniSayi: (600 + (h % 7000)) * carpan, tarih: BUGUN - ((h % 60) + (p.etiket === "Yeni" ? 0 : 20)) * GUN };
});

export const TOPLULUK_PRESETLERI = toplulukKatalog();
export const VAYRA_PRESETLERI = RESMI_SAYILI;

/** Kullanıcının kendi presetini kataloğa çevirir (yazar = kullanıcının tutamacı). */
export function ozelKatalog(p: OzelPreset, yazar: string): KatalogPreset {
  const ek = p.ekKredi ?? 0;
  return {
    slug: p.slug, ad: p.ad, aciklama: p.aciklama, tarif: p.tarif, kredi: OZEL_KREDI + ek, kategoriler: [p.kategori],
    kapak: p.kapak ?? "", video: p.kapakVideo, ozel: true, taslak: p.durum === "taslak", sira: 1000, sureSn: 8,
    yazar, ekKredi: ek, istemGorunur: p.istemGorunur ?? true, gorunurluk: p.gorunurluk ?? "topluluk", tarih: p.guncelleme ?? p.olusturma,
    kullanimSayi: p.kullanim ?? 0, begeniSayi: p.begeni ?? 0,
  };
}

/** Earn > Marketplace'ten üretiminden yayınlanan presetler (stüdyodan yayınlananların kopyası atlanır). */
const EARN_KAT: Record<string, string> = { Portre: "SİNEMATİK", Sahne: "SİNEMATİK", Ürün: "DÖNÜŞÜM", Moda: "DÖNÜŞÜM", Anime: "FANTASTİK", Mimari: "SİNEMATİK" };
export function paylasimKatalog(p: Paylasim, yazar: string): KatalogPreset {
  return {
    slug: `p-${p.id}`, ad: p.ad, aciklama: p.aciklama, tarif: p.prompt ?? p.aciklama, kredi: (p.minFiyat ?? OZEL_KREDI) + (p.ekstraFiyat ?? 0),
    kategoriler: [EARN_KAT[p.kategori] ?? "SİNEMATİK"], kapak: p.gorsel ?? "", sira: 1000, sureSn: 8, ozel: true,
    yazar, ekKredi: p.ekstraFiyat ?? 0, istemGorunur: false, gorunurluk: "topluluk", tarih: p.olusturma, kullanimSayi: p.kullanim, begeniSayi: p.begeni,
  };
}

/** Bütün görünür presetler: kendi presetlerin, Vayra ve topluluk. */
export function tumPresetler(ozel: OzelPreset[], yazar: string, paylasimlar: Paylasim[] = []): KatalogPreset[] {
  const benim = ozel.map((p) => ozelKatalog(p, yazar));
  const earn = paylasimlar.filter((p) => p.tur === "preset" && !ozel.some((o) => o.slug === p.tohum)).map((p) => paylasimKatalog(p, yazar));
  return [...benim, ...earn, ...VAYRA_PRESETLERI, ...TOPLULUK_PRESETLERI];
}
export const resmiMi = (p: KatalogPreset) => !p.yazar;

/** Kullanıcının tutamacı (@ad) — yaratıcı adı ve kendi kullanımını ayırmak için. */
export const tutamac = (ad?: string | null) => "@" + ((ad ?? "ben").toLocaleLowerCase("tr").replace(/[^a-z0-9ğüşıöç._]+/g, "") || "ben");

export const sayiKisa = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(".", ",")} Mn` : n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(".", ",")} B` : String(n);

/** Ek fiyat seçenekleri: kullanıcının her kullanımda ek ödediği kredi; yarısı yaratıcıya. */
export const EK_PAYLAR = [
  { k: 0, ad: "Ücretsiz" },
  { k: 8, ad: "Düşük" },
  { k: 16, ad: "Orta" },
  { k: 24, ad: "Yüksek" },
] as const;
export const yaraticiPayi = (ek: number) => Math.floor(ek / 2);
