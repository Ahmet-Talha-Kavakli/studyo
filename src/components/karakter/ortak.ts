"use client";

import { useElements, type VElement } from "@/store/useElements";
import { adTemizle, bostakiAd } from "@/lib/elementCekirdek";
import { toast } from "@/lib/toast";
import { gorselYukle } from "@/components/arac/kit";

/**
 * Karakter = görsel referanslı element (`useElements`, tur:"karakter"). Eğitim yok: fotoğraflar
 * her üretimde kimlik referansı olarak sağlayıcıya gider (istemde @Ad). Bu yüzden kaydetmek anında
 * ve ücretsizdir; kredi yalnız üretimde, seçilen modelin ücreti kadar düşer.
 */
export const KARAKTER_MAKS = 5;
export const YUVALAR: { ad: string; ipucu: string }[] = [
  { ad: "Ön (kapak)", ipucu: "Kameraya bakan net yüz" },
  { ad: "Yarım profil", ipucu: "Başını hafif çevir" },
  { ad: "Profil", ipucu: "Yandan görünüm" },
  { ad: "Yakın plan", ipucu: "Gözler ve cilt detayı" },
  { ad: "Boy", ipucu: "Beden ve duruş" },
];

export const karakterler = (l: VElement[]) => l.filter((e) => e.tur === "karakter");

/** Çözünürlük derecesi (kısa kenar). */
export function cozunurlukDerece(kisa: number): { ad: string; renk: string; puan: number } {
  if (!kisa) return { ad: "Ölçülemedi", renk: "text-metin-3", puan: 0 };
  if (kisa < 512) return { ad: "Zayıf", renk: "text-rose-300", puan: 1 };
  if (kisa < 960) return { ad: "Orta", renk: "text-amber-200", puan: 2 };
  return { ad: "İyi", renk: "text-emerald-300", puan: 3 };
}
export function adetDerece(n: number): { ad: string; renk: string } {
  if (n <= 1) return { ad: "Zayıf", renk: "text-rose-300" };
  if (n <= 3) return { ad: "İyi", renk: "text-amber-200" };
  return { ad: "Mükemmel", renk: "text-emerald-300" };
}

/** Dosya içeriğinin özeti (kopya algılama). */
export async function icerikOzeti(veri: Blob): Promise<string> {
  const h = await crypto.subtle.digest("SHA-1", await veri.arrayBuffer());
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Hazır sahne şablonları (fotoğraflı kartlar). {ad} → @Ad. */
export const SAHNELER: { ad: string; gorsel: string; istem: string }[] = [
  { ad: "Editöryel portre", gorsel: "/gercek/panel/gal-soul2-1.webp", istem: "@{ad} editöryel moda portresi, koyu yeşil ceket, eskitilmiş turkuaz duvar önünde, yumuşak pencere ışığı, 85 mm" },
  { ad: "Doğal ışık", gorsel: "/gercek/panel/gal-soul2-3.webp", istem: "@{ad} evde doğal gün ışığında samimi portre, sade tişört, hafif gülümseme, sığ alan derinliği" },
  { ad: "Festival makyajı", gorsel: "/gercek/panel/gal-soul2-0.webp", istem: "@{ad} renkli festival makyajıyla gece pazarında, bokeh ışıklar, canlı renkler, yakın plan" },
  { ad: "Geleneksel kostüm", gorsel: "/gercek/panel/gal-soul2-2.webp", istem: "@{ad} işlemeli geleneksel kostümle tarihi avluda, altın saat ışığı, tam boy" },
  { ad: "Çiçek taç", gorsel: "/gercek/panel/gal-soul2-4.webp", istem: "@{ad} başında gösterişli çiçek tacıyla, romantik bahçe, pastel tonlar, moda çekimi" },
  { ad: "Fütüristik", gorsel: "/gercek/panel/gal-soul2-5.webp", istem: "@{ad} metalik makyaj ve deri ceketle, gün batımı stüdyo ışığı, bilim kurgu moda editöryeli" },
  { ad: "Stüdyo, ıslak saç", gorsel: "/gercek/panel/gal-soul2-6.webp", istem: "@{ad} ıslak saç görünümüyle siyah balıkçı yakada, koyu mavi stüdyo fonu, sert yan ışık" },
  { ad: "Sokak modası", gorsel: "/gercek/panel/gal-soul2-7.webp", istem: "@{ad} renkli katmanlı sokak modası kıyafetiyle, vintage mağaza önünde, flaşlı çekim, neşeli" },
];

/**
 * Tek tıkla çok sahne: her öğe ayrı bir üretimdir (istemsiz paket). {ad} → @Ad.
 * Karakter sayfası ve ifade seti aynı kıyafet ve fonda kalsın diye tek tip sahne tarifi kullanır.
 */
export const PAKETLER: { id: string; ad: string; alt: string; istemler: { ad: string; istem: string }[] }[] = [
  {
    id: "set", ad: "Fotoğraf seti", alt: "4 farklı sahne",
    istemler: [
      { ad: "Editöryel", istem: "@{ad} editöryel moda portresi, yumuşak pencere ışığı, 85 mm, sade arka plan" },
      { ad: "Sokak", istem: "@{ad} şehirde sokak modası çekimi, akşam üstü ışığı, doğal poz, tam boy" },
      { ad: "Kafe", istem: "@{ad} kafede pencere kenarında oturuyor, sabah ışığı, samimi an, yarım plan" },
      { ad: "Stüdyo", istem: "@{ad} stüdyoda siyah balıkçı yaka, koyu fon, sert yan ışık, yakın plan" },
    ],
  },
  {
    id: "sayfa", ad: "Karakter sayfası", alt: "Ön · 3/4 · profil · boy",
    istemler: [
      { ad: "Ön", istem: "@{ad} önden portre, kameraya bakıyor, düz gri stüdyo fonu, eşit yumuşak ışık, sade beyaz tişört" },
      { ad: "3/4", istem: "@{ad} dörtte üç açıdan portre, başı hafif sağa dönük, düz gri stüdyo fonu, eşit yumuşak ışık, sade beyaz tişört" },
      { ad: "Profil", istem: "@{ad} tam profilden yan portre, düz gri stüdyo fonu, eşit yumuşak ışık, sade beyaz tişört" },
      { ad: "Boy", istem: "@{ad} tam boy ayakta, önden, düz gri stüdyo fonu, eşit yumuşak ışık, sade beyaz tişört ve kot" },
    ],
  },
  {
    id: "ifade", ad: "İfade seti", alt: "4 farklı duygu",
    istemler: [
      { ad: "Gülüş", istem: "@{ad} içten gülümsüyor, yakın plan portre, düz bej fon, yumuşak ışık" },
      { ad: "Ciddi", istem: "@{ad} ciddi ve kararlı bakış, yakın plan portre, düz bej fon, yumuşak ışık" },
      { ad: "Kahkaha", istem: "@{ad} kahkaha atıyor, yakın plan portre, düz bej fon, yumuşak ışık" },
      { ad: "Şaşkın", istem: "@{ad} şaşırmış ifade, kaşlar kalkık, yakın plan portre, düz bej fon, yumuşak ışık" },
    ],
  },
  {
    id: "kiyafet", ad: "Kıyafet seti", alt: "4 farklı stil",
    istemler: [
      { ad: "Resmi", istem: "@{ad} koyu takım elbiseyle, modern ofis lobisi, doğal ışık, yarım plan" },
      { ad: "Spor", istem: "@{ad} spor kıyafetle koşu parkurunda, sabah güneşi, dinamik poz" },
      { ad: "Gece", istem: "@{ad} şık gece kıyafetiyle, şehir ışıkları önünde, sinematik ışık" },
      { ad: "Günlük", istem: "@{ad} kot ceket ve beyaz tişörtle, güneşli sokak, rahat poz" },
    ],
  },
];

/** Hazır örnek karakterler (kendi fotoğrafı olmadan denemek için; "Örnek" diye işaretlenir). */
export const ORNEK_KARAKTERLER: { ad: string; gorsel: string; aciklama: string; gorseller?: string[] }[] = [
  { ad: "Kael", gorsel: "/gercek/element/kael-portre.webp", gorseller: ["kael-portre", "kael-yan", "kael-aksiyon", "kael-cokme"].map((x) => `/gercek/element/${x}.webp`), aciklama: "gümüş saçlı, mavi pelerinli zırhlı genç savaşçı, anime çizim" },
  { ad: "Nova", gorsel: "/gercek/element/nova-on.webp", gorseller: ["nova-on", "nova-yakin", "nova-tam", "nova-kilic", "nova-ofke"].map((x) => `/gercek/element/${x}.webp`), aciklama: "koyu saçlı, siyah-mavi zırhlı süper kahraman" },
  { ad: "Aria", gorsel: "/gercek/gorsel/gorsel-karakter-Aria.webp", aciklama: "kıvırcık koyu saçlı, açık renk gözlü genç kadın" },
  { ad: "Kai", gorsel: "/gercek/gorsel/gorsel-karakter-Kai.webp", aciklama: "kısa siyah saçlı genç erkek" },
  { ad: "Emma", gorsel: "/gercek/gorsel/gorsel-karakter-Emma.webp", aciklama: "dalgalı sarı saçlı, mavi gözlü genç kadın" },
  { ad: "Talha", gorsel: "/gercek/gorsel/gorsel-karakter-Talha.webp", aciklama: "kısa sakallı, koyu saçlı genç erkek" },
];

/**
 * Eski "eğitimli karakter" deposunu (vayra-karakterler) bir kez element deposuna taşır. O depoda
 * gerçek bir eğitim yoktu; fotoğraflar data URI olarak tarayıcıda duruyordu. Şimdi sunucu deposuna
 * yüklenir ve karakter @Ad ile gerçekten kullanılabilir hale gelir.
 */
let tasiniyor = false;
export async function eskiKarakterleriTasi() {
  if (tasiniyor) return;
  let ham: string | null = null;
  try { ham = localStorage.getItem("vayra-karakterler"); } catch { return; }
  if (!ham) return;
  tasiniyor = true;
  let l: { id: string; ad: string; fotolar?: { url: string }[] }[] = [];
  try { l = (JSON.parse(ham) as { state?: { karakterler?: typeof l } }).state?.karakterler ?? []; } catch { /* bozuk kayıt */ }
  let tasinan = 0, kayip = 0;
  for (const k of l) {
    const gorseller: string[] = [];
    for (const f of (k.fotolar ?? []).slice(0, KARAKTER_MAKS)) {
      try { gorseller.push(await gorselYukle(f.url, "/api/element/gorsel")); } catch { kayip++; }
    }
    const mevcut = useElements.getState().elementler.map((e) => e.ad);
    const r = useElements.getState().ekle({ ad: bostakiAd(adTemizle(k.ad) || "Karakter", mevcut), tur: "karakter", aciklama: "", gorseller, tohum: k.id });
    if (r.id) tasinan++;
  }
  try { localStorage.removeItem("vayra-karakterler"); } catch { /* yok */ }
  tasiniyor = false;
  if (tasinan) toast.success(`${tasinan} karakter yeni kitaplığa taşındı`, { description: kayip ? `${kayip} fotoğraf taşınamadı. Eksik fotoğrafları karakter sayfasından yeniden ekleyebilirsin.` : "Artık @Ad ile her görsel modelinde kullanılabilir." });
}
