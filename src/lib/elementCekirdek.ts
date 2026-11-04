/**
 * Element çekirdeği — ad kuralı, @mention ayrıştırma ve istemi üretime çözme (SSR güvenli).
 *
 * Kurallar (tek kaynak; tüm oluşturma yolları ve @ girdileri bunu kullanır):
 *  • Ad: 2–32 karakter; harf (Türkçe dahil), rakam ve alt çizgi. Boşluk yok. Büyük/küçük
 *    harf duyarsız tekil (aynı adda iki element olamaz) — @Zara her zaman tek elemente çözülür.
 *  • @mention: `@` + ad; Unicode harfleri tanır (@Gölge, @Rüzgâr).
 */

export type ElementTur = "karakter" | "mekan" | "obje" | "stil";

/** Üretim için çözülmüş element: modele açıklama metni + (varsa) referans görsel(ler)i. */
export type ElementReferans = { ad: string; tur: ElementTur; aciklama: string; gorseller: string[] };

export const AD_MIN = 2;
export const AD_MAX = 20;
const AD_DESEN = /^[\p{L}\p{N}_]+$/u;
/** Metindeki tüm @mention'lar (global). */
export const MENTION_DESEN = /@([\p{L}\p{N}_]+)/gu;
/** İmlecin hemen solundaki yarım @mention ("@Gö" yazılırken öneri için). */
export const MENTION_SON_DESEN = /(?:^|\s)@([\p{L}\p{N}_]*)$/u;

/** Serbest metni geçerli bir element adına çevirir (boşluk ve işaretler atılır). */
export function adTemizle(s: string): string {
  return s.normalize("NFC").replace(/[^\p{L}\p{N}_]/gu, "").slice(0, AD_MAX);
}

/** Ad geçerli mi; değilse kullanıcıya gösterilecek neden. `mevcut`: diğer elementlerin adları. */
export function adHatasi(ad: string, mevcut: string[]): string | null {
  if (ad.length < AD_MIN) return `Ad en az ${AD_MIN} karakter olmalı`;
  if (ad.length > AD_MAX) return `Ad en fazla ${AD_MAX} karakter olabilir`;
  if (!AD_DESEN.test(ad)) return "Adda yalnız harf, rakam ve alt çizgi olabilir";
  const k = ad.toLocaleLowerCase("tr");
  if (mevcut.some((m) => m.toLocaleLowerCase("tr") === k)) return `@${ad} adında bir element zaten var`;
  return null;
}

/** Bir adın kopyası için boştaki ilk ad: Zara → Zara2, Zara3… */
export function bostakiAd(taban: string, mevcut: string[]): string {
  const kume = new Set(mevcut.map((m) => m.toLocaleLowerCase("tr")));
  const t = adTemizle(taban).slice(0, AD_MAX - 2) || "Element";
  if (!kume.has(t.toLocaleLowerCase("tr"))) return t;
  for (let i = 2; i < 1000; i++) if (!kume.has(`${t}${i}`.toLocaleLowerCase("tr"))) return `${t}${i}`;
  return `${t}${Date.now() % 1000}`;
}

/** Metindeki @ad'ları (sırayla, tekil) döner. */
export function mentionAdlari(metin: string): string[] {
  const goruldu = new Set<string>(); const l: string[] = [];
  for (const m of metin.matchAll(MENTION_DESEN)) {
    const k = m[1].toLocaleLowerCase("tr");
    if (!goruldu.has(k)) { goruldu.add(k); l.push(m[1]); }
  }
  return l;
}

const TUR_KISA: Record<ElementTur, string> = { karakter: "karakter", mekan: "mekân", obje: "obje", stil: "stil" };

/**
 * İstemi üretime hazırlar: @Ad → "Ad (açıklama)" metni; elementlerin görselleri referans olarak
 * döner. Bilinmeyen @ad'lar olduğu gibi kalır. Stil elementleri isteme "stil:" notu olarak eklenir.
 */
export function elementleriCoz<T extends { ad: string; tur: ElementTur; aciklama: string; gorseller: string[] }>(
  istem: string, elementler: T[],
): { istem: string; referanslar: ElementReferans[]; bulunan: T[] } {
  const harita = new Map(elementler.map((e) => [e.ad.toLocaleLowerCase("tr"), e]));
  const bulunan: T[] = [];
  const metin = istem.replace(MENTION_DESEN, (tam, ad: string) => {
    const e = harita.get(ad.toLocaleLowerCase("tr"));
    if (!e) return tam;
    if (!bulunan.includes(e)) bulunan.push(e);
    if (e.tur === "stil") return e.ad; // stil tanımı aşağıda tek not olarak eklenir
    const tanim = e.aciklama.trim();
    return tanim ? `${e.ad} (${TUR_KISA[e.tur]}: ${tanim})` : e.ad;
  });
  const stiller = bulunan.filter((e) => e.tur === "stil" && e.aciklama.trim());
  const son = stiller.length ? `${metin.trim()}\n\nStil: ${stiller.map((s) => s.aciklama.trim()).join("; ")}` : metin;
  return {
    istem: son,
    bulunan,
    referanslar: bulunan.map((e) => ({ ad: e.ad, tur: e.tur, aciklama: e.aciklama, gorseller: e.gorseller.filter(Boolean).slice(0, e.tur === "karakter" ? 5 : 4) })),
  };
}
