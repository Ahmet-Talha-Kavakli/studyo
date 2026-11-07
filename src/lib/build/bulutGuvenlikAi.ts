import "server-only";
import type { GuvenlikBulgusu } from "./bulut";
import type { Proje } from "./tipler";
import { KURALLAR, veriOku, type Kural, type Kurallar } from "./veri";
import { aiMetin } from "./yapayZeka";

/**
 * Güvenlik bulgusu için yapay zekâ düzeltme önerisi. Model, bulguyu, ilgili tablonun şemasını ve kurallarını, sitenin
 * o tabloyu nasıl kullandığını (vayra.veri çağrıları) görür ve iki şey önerir: doğrudan uygulanabilir erişim kuralı
 * (yalnız veri bulgularında) ve Build ajanına gidecek kesin bir düzeltme isteği. Öneri uygulanmadan önce gösterilir.
 */
export type AiOneri = { ozet: string; kurallar?: Kurallar; gerekce?: string; ajanIstemi: string; etki: string[]; model: "yapay-zeka" };

const KURAL_AD: Record<string, string> = { herkes: "herkes", uyeler: "üyeler", sahibi: "kaydın sahibi", kapali: "yalnız sen" };

/** Sitenin bir tabloyu nerede ve nasıl kullandığı (satır parçalarıyla). */
export function tabloKullanimi(dosyalar: Record<string, string>, tablo: string) {
  const o: { dosya: string; satir: number; islem: string; metin: string }[] = [];
  const re = new RegExp(`vayra\\.veri\\.(liste|ekle|guncelle|sil|ara|dinle|izle)\\(\\s*["'\`]${tablo.replace(/[-]/g, "\\-")}["'\`]`, "g");
  for (const [yol, icerik] of Object.entries(dosyalar)) {
    if (typeof icerik !== "string" || icerik.length > 500_000) continue;
    const satirlar = icerik.split("\n");
    for (const m of icerik.matchAll(re)) {
      const n = icerik.slice(0, m.index ?? 0).split("\n").length;
      o.push({ dosya: yol, satir: n, islem: m[1], metin: satirlar[n - 1].trim().slice(0, 200) });
      if (o.length > 30) return o;
    }
  }
  return o;
}

export async function aiDuzeltmeOner(p: Proje, b: GuvenlikBulgusu, dosyalar: Record<string, string>, signal?: AbortSignal): Promise<AiOneri> {
  const tablo = b.duzelt?.tur === "kural" ? b.duzelt.tablo : /"([a-zA-Z0-9_-]{1,40})"/.exec(b.baslik)?.[1];
  const v = b.yer === "veri" && tablo ? await veriOku(p.id) : null;
  const k = tablo ? v?.koleksiyonlar[tablo] : undefined;
  const kullanim = tablo && k ? tabloKullanimi(dosyalar, tablo) : [];
  const dosyaParcasi = b.yer !== "veri" ? (() => {
    const yol = /\(([^()\s]+\.(?:m?js|html?|css))\)/.exec(b.ayrinti)?.[1] ?? /\(([^()\s]+\.(?:m?js|html?|css))\)/.exec(b.baslik)?.[1];
    const ic = yol ? dosyalar[yol] : undefined;
    return yol && ic ? `\nİlgili dosya (${yol}, ilk 4000 karakter):\n${ic.slice(0, 4000)}` : "";
  })() : "";
  const baglam = [
    `Proje: ${p.ad} (${p.tur}).`,
    `Bulgu [${b.seviye}] ${b.baslik}: ${b.ayrinti}`,
    k ? `Tablo "${tablo}": ${k.kayitlar.length} kayıt. Kurallar: okuma ${k.kurallar.okuma}, ekleme ${k.kurallar.ekleme}, düzenleme ${k.kurallar.duzenleme}. Sütunlar: ${(k.sema ?? []).map((s) => `${s.ad}:${s.tur}`).join(", ") || [...new Set(k.kayitlar.slice(-10).flatMap((r) => Object.keys(r)))].join(", ")}.` : "",
    kullanim.length ? `Sitenin bu tabloyu kullanımı:\n${kullanim.map((x) => `- ${x.dosya}:${x.satir} ${x.islem}: ${x.metin}`).join("\n")}` : k ? "Site kodu bu tabloyu tarayıcıdan kullanmıyor." : "",
    dosyaParcasi,
  ].filter(Boolean).join("\n");
  let metin: string;
  try {
    metin = await aiMetin({
      sistem: "Sen bir web uygulaması güvenlik uzmanısın. Yalnız geçerli JSON üret; markdown ya da açıklama yazma. Türkçe yaz.",
      mesajlar: [{ rol: "kullanici", metin: `Aşağıdaki güvenlik bulgusunu düzeltmek için öneri ver.\n${baglam}\n\nErişim kuralı değerleri: herkes, uyeler (giriş yapmış üyeler), sahibi (her üye yalnız kendi kaydı), kapali (yalnız proje sahibi ve sunucu fonksiyonları).\nSitenin çalışmaya devam etmesi gerekir: site bir tabloyu tarayıcıdan listeliyorsa okumayı kapatmak o özelliği bozar; bu durumda listelemeyi sunucu fonksiyonuna taşıyan kod değişikliği öner.\nJSON biçimi: {"ozet": "bir cümle", ${k ? `"kurallar": {"okuma": "...", "ekleme": "...", "duzenleme": "..."}, "gerekce": "kuralların nedeni", ` : ""}"ajanIstemi": "Build ajanına verilecek kesin, adım adım düzeltme isteği (dosya adlarıyla)", "etki": ["bu değişiklik sitede neyi etkiler", "..."]}` }],
      enCok: 1200, signal,
    });
  } catch (e) { throw new Error((e as Error).message === "AI_YOK" ? "Yapay zekâ motoru bu sunucuya bağlı değil; öneri üretilemiyor. Bulguyu doğrudan Build ajanına gönderebilirsin." : "Öneri üretilemedi; yeniden dene."); }
  let j: { ozet?: string; kurallar?: Partial<Kurallar>; gerekce?: string; ajanIstemi?: string; etki?: unknown };
  try { const bas = metin.indexOf("{"), son = metin.lastIndexOf("}"); j = JSON.parse(metin.slice(bas, son + 1)); }
  catch {
    // Model JSON yerine düz metin döndürdüyse metin ajan isteği olarak kullanılır (kural önerisi yok).
    const t = metin.trim();
    if (t.length < 20) throw new Error("Model geçerli bir öneri döndürmedi; yeniden dene.");
    j = { ozet: t.split(/(?<=[.!?])s/)[0].slice(0, 300), ajanIstemi: `${b.ajan ?? `${b.baslik}: ${b.ayrinti}`}

Uzman önerisi:
${t.slice(0, 1500)}` };
  }
  const kurallar = k && j.kurallar && (["okuma", "ekleme", "duzenleme"] as const).every((x) => KURALLAR.includes(j.kurallar![x] as Kural)) ? { okuma: j.kurallar.okuma!, ekleme: j.kurallar.ekleme!, duzenleme: j.kurallar.duzenleme! } as Kurallar : undefined;
  const etki = Array.isArray(j.etki) ? j.etki.map(String).filter(Boolean).slice(0, 6) : [];
  // Kural önerisi, sitenin tarayıcıdan yaptığı işlemleri bozacaksa açıkça yazılır (model atlasa bile).
  if (kurallar && k) {
    const islem = new Set(kullanim.map((x) => x.islem));
    if ((islem.has("liste") || islem.has("ara") || islem.has("izle") || islem.has("dinle")) && kurallar.okuma === "kapali") etki.unshift(`Site "${tablo}" tablosunu tarayıcıdan okuyor; okuma ${KURAL_AD.kapali} olursa bu kısım boş görünür.`);
    if (islem.has("ekle") && kurallar.ekleme === "kapali") etki.unshift(`Site "${tablo}" tablosuna tarayıcıdan kayıt ekliyor; ekleme kapanırsa bu form çalışmaz.`);
  }
  return {
    ozet: String(j.ozet ?? "Öneri hazır.").slice(0, 300), ...(kurallar ? { kurallar, gerekce: String(j.gerekce ?? "").slice(0, 400) } : {}),
    ajanIstemi: String(j.ajanIstemi ?? b.ajan ?? `${b.baslik}: ${b.ayrinti} Düzelt.`).slice(0, 2000), etki: [...new Set(etki)].slice(0, 6), model: "yapay-zeka",
  };
}
