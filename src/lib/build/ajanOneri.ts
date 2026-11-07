import "server-only";
import { ARAC_KATALOG, type AracIzni } from "./ajanKatalog";
import type { Ajan, Devir, Koruma } from "./ajanDepo";
import { zekaJson } from "./ajanZeka";

/**
 * Sohbetle düzenle: kullanıcı ajanda neyin değişmesini istediğini yazar; yapay zekâ alan alan öneri kartları çıkarır.
 * Hiçbir öneri kendiliğinden uygulanmaz; kullanıcı her kartı tek tek kabul eder ya da geçer (Dust ve Copilot Studio kalıbı).
 */
export type AjanOneri =
  | { alan: "talimat"; baslik: string; neden: string; yeni: string }
  | { alan: "aciklama"; baslik: string; neden: string; yeni: string }
  | { alan: "karsilama"; baslik: string; neden: string; yeni: string }
  | { alan: "baslangiclar"; baslik: string; neden: string; yeni: string[] }
  | { alan: "arac"; baslik: string; neden: string; arac: string; izin: AracIzni }
  | { alan: "devir"; baslik: string; neden: string; yeni: Partial<Devir> }
  | { alan: "koruma"; baslik: string; neden: string; yeni: Partial<Koruma> };

const IZIN = new Set(["her-zaman", "sor", "kapali"]);
const metin = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export async function ajanOnerisi(a: Ajan, istek: string): Promise<{ ozet: string; oneriler: AjanOneri[]; sorular: string[] } | { hata: string }> {
  const araclar = ARAC_KATALOG.map((t) => `${t.id} (${t.ad}): şu an ${a.araclar[t.id] ?? "kapali"}`).join("\n");
  const z = await zekaJson<{ ozet?: string; degisiklikler?: Record<string, unknown>[]; sorular?: unknown[] }>({
    model: a.model, enCok: 6000,
    sistem: `Bir yapay zekâ ajanının ayarlarını sahibinin isteğine göre düzenliyorsun. Yalnız istenen değişikliği yap; istenmeyen alana dokunma. Her değişiklik ayrı bir öğe olsun.
Alanlar ve "yeni" biçimi:
- talimat: talimatın TAMAMININ yeni hali (mevcut talimatı koru, yalnız gereken yeri değiştir ya da ekle)
- aciklama: tek cümle (en çok 300 karakter)
- karsilama: ziyaretçiye ilk mesaj (en çok 300 karakter)
- baslangiclar: en çok 4 kısa başlangıç önerisi (dizi)
- arac: {"arac": "araç kimliği", "izin": "her-zaman" | "sor" | "kapali"}
- devir: {"acik": true ya da false, "kurallar": "hangi durumda insana devredileceği", "mesaj": "devirde ziyaretçiye söylenecek"}
- koruma: {"kisisel": true ya da false (kişisel veri maskeleme), "enjeksiyon": true ya da false, "yasakKonular": ["..."]}
İstek belirsizse değişiklik uydurma; sorular dizisine en çok 2 kısa soru yaz.
JSON: {"ozet": "tek cümle", "degisiklikler": [{"alan": "...", "baslik": "değişikliği anlatan kısa başlık", "neden": "tek cümle", "yeni": ...}], "sorular": []}`,
    istem: `Ajan: ${a.ad}\nAçıklama: ${a.aciklama}\nKarşılama: ${a.karsilama}\nBaşlangıç önerileri: ${a.baslangiclar.join(" | ")}\nDevir: ${JSON.stringify(a.devir)}\nKoruma: ${JSON.stringify(a.koruma)}\nAraçlar:\n${araclar}\n\nŞimdiki talimat:\n${a.talimat.slice(0, 12000)}\n\nSahibin isteği: ${istek}`,
  });
  if (!z) return { hata: "Yapay zekâ bu sunucuya bağlı değil; değişikliği ayarlardan elle yapabilirsin." };
  if (!z.veri || !Array.isArray(z.veri.degisiklikler)) return { hata: "Model geçerli bir öneri döndürmedi; isteği biraz daha açık yazıp yeniden dene." };
  const oneriler: AjanOneri[] = [];
  for (const d of z.veri.degisiklikler.slice(0, 10)) {
    const baslik = metin(d.baslik, 120) || "Değişiklik", neden = metin(d.neden, 300);
    const y = d.yeni as unknown;
    if (d.alan === "talimat" && typeof y === "string" && y.trim() && y.trim() !== a.talimat.trim()) oneriler.push({ alan: "talimat", baslik, neden, yeni: y.slice(0, 32000) });
    else if ((d.alan === "aciklama" || d.alan === "karsilama") && typeof y === "string" && y.trim()) oneriler.push({ alan: d.alan as "aciklama", baslik, neden, yeni: y.trim().slice(0, 300) });
    else if (d.alan === "baslangiclar" && Array.isArray(y)) { const l = y.filter((x): x is string => typeof x === "string" && !!x.trim()).slice(0, 4).map((x) => x.trim().slice(0, 200)); if (l.length) oneriler.push({ alan: "baslangiclar", baslik, neden, yeni: l }); }
    else if (d.alan === "arac" && y && typeof y === "object") {
      const o = y as Record<string, unknown>;
      const arac = String(o.arac ?? ""), izin = String(o.izin ?? "");
      if (ARAC_KATALOG.some((t) => t.id === arac) && IZIN.has(izin) && (a.araclar[arac] ?? "kapali") !== izin) oneriler.push({ alan: "arac", baslik, neden, arac, izin: izin as AracIzni });
    } else if (d.alan === "devir" && y && typeof y === "object") {
      const o = y as Record<string, unknown>;
      const yeni: Partial<Devir> = {};
      if (typeof o.acik === "boolean") yeni.acik = o.acik;
      if (typeof o.kurallar === "string") yeni.kurallar = o.kurallar.slice(0, 2000);
      if (typeof o.mesaj === "string" && o.mesaj.trim()) yeni.mesaj = o.mesaj.slice(0, 300);
      if (Object.keys(yeni).length) oneriler.push({ alan: "devir", baslik, neden, yeni });
    } else if (d.alan === "koruma" && y && typeof y === "object") {
      const o = y as Record<string, unknown>;
      const yeni: Partial<Koruma> = {};
      if (typeof o.kisisel === "boolean") yeni.kisisel = o.kisisel;
      if (typeof o.enjeksiyon === "boolean") yeni.enjeksiyon = o.enjeksiyon;
      if (Array.isArray(o.yasakKonular)) yeni.yasakKonular = o.yasakKonular.filter((x): x is string => typeof x === "string").slice(0, 30).map((x) => x.slice(0, 120));
      if (Object.keys(yeni).length) oneriler.push({ alan: "koruma", baslik, neden, yeni });
    }
  }
  const sorular = (Array.isArray(z.veri.sorular) ? z.veri.sorular : []).filter((x): x is string => typeof x === "string").slice(0, 2);
  return { ozet: metin(z.veri.ozet, 300), oneriler, sorular };
}
