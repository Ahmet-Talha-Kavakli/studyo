/* ============================================================
   AJAN OLAY MODELİ — Claude'un araç kullanım akışı.

   Önceki akış SABİT-KODLUYDU: sohbet ekranı her üretimde aynı 7 adımı
   (`gorevListesi()`) diziyordu; motorun gerçekte ne yaptığıyla ilgisi yoktu.
   Claude ise her ARAÇ ÇAĞRISINI ayrı bir olay olarak akıtır: düşünme, web
   arama, dosya okuma/yazma, komut çalıştırma, artifact üretme…

   Burada o olay tipleri tanımlanır. Sohbet ekranı bu listeyi render eder,
   üretim motoru da olayları üretir — böylece görsel akış gerçek işi yansıtır.
   ============================================================ */

/** Bir ajan adımının türü — hangi aracı kullandığını belirler. */
export type OlayTur =
  | "dusunme"      // iç akıl yürütme (katlanabilir)
  | "arama"        // web arama (sorgu + sonuç listesi)
  | "gezinme"      // sayfa açma/okuma
  | "dosyaOku"
  | "dosyaYaz"     // diff sayaçlı
  | "komut"        // terminal komutu (girdi/çıktı)
  | "kod"          // kod yazma/düzenleme (dosya + diff)
  | "artifact"     // üretilen çıktı → sağ panelde açılır
  | "model"        // model/beceri seçimi
  | "gorev"        // üst düzey plan adımı
  | "hata";        // başarısız araç çağrısı

/** Bir adımın yaşam döngüsü. */
export type OlayDurum = "bekliyor" | "calisiyor" | "bitti" | "hata";

/** Web arama sonucu tek satırı. */
export type AramaSonucu = { baslik: string; url: string; alan: string; ozet?: string };

export interface AjanOlay {
  id: string;
  tur: OlayTur;
  /** Satırda görünen etiket — "Web'de arandı", "app.tsx düzenlendi"… */
  etiket: string;
  /** Etiketin yanındaki soluk ikincil bilgi (dosya adı, model, sorgu). */
  arg?: string;
  durum: OlayDurum;
  /** Katlanabilir gövde metni (düşünme, komut çıktısı, okunan içerik). */
  govde?: string;
  /** Kod/dosya adımlarında satır sayaçları. */
  diff?: { ekle?: number; sil?: number };
  /** Arama sonuçları (tur === "arama"). */
  sonuclar?: AramaSonucu[];
  /** Bu adımın ürettiği artifact kimliği (tur === "artifact"). */
  artifactId?: string;
  /** Alt adımlar — Claude ağaç yapısı (ör. bir görevin altındaki araç çağrıları). */
  cocuklar?: AjanOlay[];
  /** Adımın sürdüğü süre (ms) — bitmiş adımlarda gösterilir. */
  sureMs?: number;
}

/** Olay türü → okunur grup adı (rozet/başlık için). */
export const OLAY_ETIKET: Record<OlayTur, string> = {
  dusunme: "Düşünme",
  arama: "Web arama",
  gezinme: "Sayfa okuma",
  dosyaOku: "Dosya okuma",
  dosyaYaz: "Dosya yazma",
  komut: "Komut",
  kod: "Kod",
  artifact: "Çıktı",
  model: "Model",
  gorev: "Görev",
  hata: "Hata",
};

let sayac = 0;
/** Deterministik olmayan id — Math.random yerine artan sayaç + zaman. */
export function olayId(): string {
  sayac += 1;
  return `o${sayac}_${Math.floor(performance.now())}`;
}

export function olay(
  tur: OlayTur,
  etiket: string,
  ek: Partial<Omit<AjanOlay, "id" | "tur" | "etiket">> = {},
): AjanOlay {
  return { id: olayId(), tur, etiket, durum: ek.durum ?? "bitti", ...ek };
}
