/**
 * Vayra Build ziyaretçi oturum kaydı: istemci ve sunucu ortak tipleri, varsayılanlar ve rrweb olaylarından
 * sade işaret listesi (oynatıcının zaman çubuğu, olay listesi ve yapay zekâ dökümü aynı kaynaktan beslenir).
 *
 * Kaydedicinin eklediği özel olaylar (rrweb Custom, tür 5):
 *  vayra-sayfa    { y: yol, b: başlık, r: yönlendiren alan adı, en, boy }
 *  vayra-tik      { e: etiket, m: metin, x, y }
 *  vayra-ofkeli   { n: tık sayısı, e, m, x, y }      aynı yere 1 saniyede 3 ve daha çok tık
 *  vayra-olu      { e, m, x, y }                     tıklanabilir görünen öğede 1,2 saniye içinde hiçbir tepki yok
 *  vayra-hata     { s: "hata" | "uyari", t: "js" | "promise" | "konsol" | "ag", m: mesaj, k: kaynak, l: satır }
 *  vayra-alan     { a: alan adı, t: tür, ms: odak süresi, d: dolduruldu mu }   değer hiçbir zaman gönderilmez
 *  vayra-kaydirma { p: görülen yüzde (25, 50, 75, 100) }
 */
import type { OturumAyar } from "./tipler";

export const OTURUM_VARSAYILAN: OturumAyar = { acik: false, oran: 100, saklama: 30, metinMaskele: false, onayBekle: false, izlemeIstemeyen: true };

/** Eksik ya da bozuk ayarı varsayılanlarla tamamlar ve sınırlar. */
export function oturumAyarTamamla(a?: Partial<OturumAyar> | null): OturumAyar {
  const v = OTURUM_VARSAYILAN;
  const sayi = (x: unknown, alt: number, ust: number, d: number) => { const n = Math.round(Number(x)); return Number.isFinite(n) ? Math.min(ust, Math.max(alt, n)) : d; };
  return {
    acik: typeof a?.acik === "boolean" ? a.acik : v.acik,
    oran: sayi(a?.oran, 1, 100, v.oran),
    saklama: sayi(a?.saklama, 1, 90, v.saklama),
    metinMaskele: typeof a?.metinMaskele === "boolean" ? a.metinMaskele : v.metinMaskele,
    onayBekle: typeof a?.onayBekle === "boolean" ? a.onayBekle : v.onayBekle,
    izlemeIstemeyen: typeof a?.izlemeIstemeyen === "boolean" ? a.izlemeIstemeyen : v.izlemeIstemeyen,
  };
}

/** Kaydedici dosyasının sürümü (önbellek kırıcı): rrweb sürümü ve Vayra yapıştırıcısının sürümü. */
export const KAYDEDICI_SURUM = "2.1.7-v4";
export const KAYDEDICI_ADRESI = `/api/build/oturum/kaydedici.js?s=${KAYDEDICI_SURUM}`;

/** Sınırlar: oturum başına 5 MB, istek başına 1,5 MB, proje başına 300 MB ya da 5000 oturum (en eskiler silinir). */
export const OTURUM_SINIR = { oturumBayt: 5 * 1024 * 1024, istekBayt: 1_500_000, projeBayt: 300 * 1024 * 1024, projeOturum: 5000 };

export type OturumCihaz = "masaustu" | "tablet" | "telefon";
export const CIHAZ_AD: Record<OturumCihaz, string> = { masaustu: "Masaüstü", tablet: "Tablet", telefon: "Telefon" };
export const cihazBul = (en: number): OturumCihaz => (en > 0 && en < 640 ? "telefon" : en > 0 && en < 1024 ? "tablet" : "masaustu");

export type OturumAi = {
  /** Ziyaretçinin büyük olasılıkla ne yapmaya çalıştığı. */
  amac: string;
  ozet: string;
  surtunmeler: { baslik: string; ayrinti: string; /** Oturum başından ms. */ an?: number }[];
  oneriler: { baslik: string; ayrinti: string }[];
  model: string;
  zaman: number;
};

export type OturumOzet = {
  id: string;
  /** İlk ve son olayın zamanı (ziyaretçinin saati). */
  bas: number;
  son: number;
  sure: number;
  /** Sunucunun ilk ve son aldığı an (saklama süresi buna göre). */
  alinma: number;
  guncel: number;
  sayfalar: { yol: string; z: number; baslik?: string }[];
  cihaz: OturumCihaz;
  en: number;
  boy: number;
  tarayici?: string;
  ulke?: string;
  dil?: string;
  ref?: string;
  tik: number;
  ofkeli: number;
  olu: number;
  hata: number;
  uyari: number;
  alan: number;
  bayt: number;
  olay: number;
  /** Boyut sınırına ulaşıldı, kayıt durdu. */
  dolu?: boolean;
  ai?: OturumAi;
};

export type HamOlay = { type: number; timestamp: number; data?: unknown };
export type IsaretTur = "sayfa" | "tik" | "ofkeli" | "olu" | "hata" | "uyari" | "alan" | "kaydirma";
export type Isaret = { z: number; tur: IsaretTur; baslik: string; ayrinti?: string; yol?: string };

const ETIKET_AD: Record<string, string> = { a: "bağlantısı", button: "düğmesi", img: "görseli", svg: "simgesi", input: "alanı", select: "seçim kutusu", textarea: "metin alanı", label: "etiketi", summary: "açılır başlığı", li: "liste öğesi", h1: "başlığı", h2: "başlığı", h3: "başlığı", p: "paragrafı", span: "metni", div: "alanı" };
const ETIKET_TEK: Record<string, string> = { a: "Bağlantı", button: "Düğme", img: "Görsel", svg: "Simge", input: "Alan", select: "Seçim kutusu", textarea: "Metin alanı", label: "Etiket", summary: "Açılır başlık", li: "Liste öğesi", h1: "Başlık", h2: "Başlık", h3: "Başlık", p: "Paragraf", span: "Metin", div: "Boş alan" };
/** Tıklanan öğenin okunur adı: "Menü" bağlantısı, Görsel, Boş alan. */
export function hedefAdi(e?: string, m?: string): string {
  const t = (e ?? "").toLowerCase();
  if (m) return `"${m.length > 48 ? m.slice(0, 47) + "…" : m}" ${ETIKET_AD[t] ?? "öğesi"}`;
  return ETIKET_TEK[t] ?? "Sayfa öğesi";
}
const HATA_TUR: Record<string, string> = { js: "JavaScript hatası", promise: "İşlenmeyen Promise", konsol: "Konsol", ag: "Ağ isteği" };
export const hataTurAdi = (t?: string) => HATA_TUR[t ?? ""] ?? "Hata";

/** Okunur süre: 14 sn, 2 dk 14 sn, 1 sa 3 dk. */
export function sureYazi(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} sn`;
  if (s < 3600) return `${Math.floor(s / 60)} dk${s % 60 ? ` ${s % 60} sn` : ""}`;
  return `${Math.floor(s / 3600)} sa${Math.floor((s % 3600) / 60) ? ` ${Math.floor((s % 3600) / 60)} dk` : ""}`;
}
/** Oynatıcı zamanı: 1:05, 12:40, 1:02:03. */
export function anYazi(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000)), sa = Math.floor(s / 3600), d = Math.floor((s % 3600) / 60), n = s % 60;
  return sa ? `${sa}:${String(d).padStart(2, "0")}:${String(n).padStart(2, "0")}` : `${d}:${String(n).padStart(2, "0")}`;
}

type Ozel = { tag?: string; payload?: Record<string, unknown> };
const yazi = (x: unknown, n = 200) => (typeof x === "string" ? x.slice(0, n) : typeof x === "number" ? String(x) : "");

/** rrweb olaylarından oynatıcı işaretleri (z: oturum başından ms). Olaylar zamana göre sıralı olmalı. */
export function isaretleriCikar(olaylar: HamOlay[]): { bas: number; son: number; isaretler: Isaret[] } {
  const bas = olaylar[0]?.timestamp ?? 0, son = olaylar.at(-1)?.timestamp ?? bas;
  const l: Isaret[] = [];
  let yol = "";
  for (const e of olaylar) {
    if (e.type !== 5) continue;
    const d = (e.data ?? {}) as Ozel, p = d.payload ?? {}, z = e.timestamp - bas;
    switch (d.tag) {
      case "vayra-sayfa": yol = yazi(p.y, 120) || "index.html"; l.push({ z, tur: "sayfa", baslik: yol, ayrinti: yazi(p.b, 120) || undefined, yol }); break;
      case "vayra-tik": l.push({ z, tur: "tik", baslik: hedefAdi(yazi(p.e, 20), yazi(p.m, 80)), yol }); break;
      case "vayra-ofkeli": l.push({ z, tur: "ofkeli", baslik: `Öfkeli tık, ${Number(p.n) || 3} kez`, ayrinti: hedefAdi(yazi(p.e, 20), yazi(p.m, 80)), yol }); break;
      case "vayra-olu": l.push({ z, tur: "olu", baslik: "Sonuçsuz tık", ayrinti: hedefAdi(yazi(p.e, 20), yazi(p.m, 80)), yol }); break;
      case "vayra-hata": {
        const k = yazi(p.k, 120), sat = Number(p.l) || 0;
        l.push({ z, tur: p.s === "uyari" ? "uyari" : "hata", baslik: yazi(p.m, 300) || "Hata", ayrinti: [hataTurAdi(yazi(p.t, 10)), k ? `${k}${sat ? `:${sat}` : ""}` : ""].filter(Boolean).join(", "), yol });
        break;
      }
      case "vayra-alan": {
        const ad = yazi(p.a, 60) || "Adsız";
        l.push({ z, tur: "alan", baslik: `${ad} alanı`, ayrinti: `${sureYazi(Number(p.ms) || 0)} odaklandı, ${p.d ? "dolduruldu" : "boş bırakıldı"}`, yol });
        break;
      }
      case "vayra-kaydirma": l.push({ z, tur: "kaydirma", baslik: `Sayfanın yüzde ${Number(p.p) || 0} kadarı görüldü`, yol }); break;
    }
  }
  return { bas, son, isaretler: l };
}

/** Yapay zekâ için sade metin dökümü: cihaz, sayfalar ve kalış süreleri, tıklar, takılmalar, form alanları, hatalar. */
export function dokumYaz(o: OturumOzet, isaretler: Isaret[], sure: number): string {
  const sayfalar = isaretler.filter((x) => x.tur === "sayfa");
  const satir: string[] = [];
  satir.push(`Ziyaret süresi: ${sureYazi(sure)}. Cihaz: ${CIHAZ_AD[o.cihaz]} (${o.en} piksel genişlik)${o.tarayici ? `, ${o.tarayici}` : ""}${o.ulke ? `, ülke ${o.ulke}` : ""}${o.dil ? `, dil ${o.dil}` : ""}. Geliş: ${o.ref || "doğrudan"}.`);
  satir.push("", "Sayfalar (sırayla, kalış süresi):");
  sayfalar.forEach((s, i) => satir.push(`${i + 1}. ${s.baslik}${s.ayrinti ? ` ("${s.ayrinti}")` : ""}: ${sureYazi((sayfalar[i + 1]?.z ?? sure) - s.z)}`));
  satir.push("", "Olaylar (oturum başından dakika:saniye, köşeli parantezde sayfa):");
  const olaylar = isaretler.filter((x) => x.tur !== "sayfa");
  for (const x of olaylar.slice(0, 260)) {
    const tur = { tik: "tık", ofkeli: "öfkeli tık", olu: "sonuçsuz tık", hata: "hata", uyari: "uyarı", alan: "form alanı", kaydirma: "kaydırma", sayfa: "sayfa" }[x.tur];
    satir.push(`${anYazi(x.z)} [${x.yol || "?"}] ${tur}: ${x.baslik}${x.ayrinti ? ` (${x.ayrinti})` : ""}`);
  }
  if (olaylar.length > 260) satir.push(`… ve ${olaylar.length - 260} olay daha`);
  satir.push("", `Sayılar: ${o.tik} tık, ${o.ofkeli} öfkeli tık, ${o.olu} sonuçsuz tık, ${o.hata} hata, ${o.uyari} uyarı, ${o.alan} form alanı.`);
  return satir.join("\n");
}
