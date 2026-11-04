/**
 * Vayra API — model girdi şemaları (tek kaynak).
 *
 * Aynı tanım üç yerde kullanılır: sunucu doğrulaması (/api/v1), oyun alanı
 * formu ve API referansı. Bir alanı burada değiştirmek üçünü birden günceller.
 * Şema MODELLER kataloğundan türetilir; model eklemek için burada iş yok.
 */

import { MODELLER, type AIModel, type ModelTur } from "@/lib/catalog";
import { SESLER } from "@/lib/sesVeri";

export type AlanTip = "string" | "integer" | "number" | "boolean" | "enum" | "uri" | "object";

export interface Alan {
  ad: string;
  tip: AlanTip;
  zorunlu?: boolean;
  aciklama: string;
  varsayilan?: string | number | boolean;
  secenekler?: (string | number)[];
  min?: number;
  max?: number;
  /** Uzun metin girişi (textarea) */
  uzun?: boolean;
  /** Oyun alanında "Gelişmiş" altında gösterilir */
  gelismis?: boolean;
  ornek?: string | number | boolean;
}

export const TUR_ADI: Record<ModelTur, string> = { gorsel: "Görsel", video: "Video", ses: "Ses", muzik: "Müzik", "3d": "3D" };
export const TUR_API: Record<ModelTur, string> = { gorsel: "image", video: "video", ses: "audio", muzik: "music", "3d": "3d" };
export const API_TUR: Record<string, ModelTur> = { image: "gorsel", video: "video", audio: "ses", music: "muzik", "3d": "3d" };

/** "5sn" → 5 */
const saniye = (s: string) => Number.parseInt(s, 10);

/** Bir modelin `input` şeması. */
export function modelSemasi(m: AIModel): Alan[] {
  const k = m.kisit ?? {};
  const alanlar: Alan[] = [];
  const istem = (aciklama: string, ornek: string): Alan => ({ ad: "prompt", tip: "string", zorunlu: true, uzun: true, max: 4000, aciklama, ornek });

  if (m.tur === "gorsel") {
    const oranlar = k.oranlar?.filter((o) => o !== "Auto") ?? ["1:1", "3:4", "4:3", "9:16", "16:9"];
    alanlar.push(
      istem("Üretilecek görselin tanımı. Konu, ışık, kadraj ve stil ne kadar açık yazılırsa sonuç o kadar isabetli olur.", "Kapadokya üzerinde gün doğumunda sıcak hava balonları, 35mm film, yumuşak sis"),
      { ad: "aspect_ratio", tip: "enum", secenekler: oranlar, varsayilan: oranlar.includes("1:1") ? "1:1" : oranlar[0], aciklama: "Çıktının en-boy oranı." },
      { ad: "resolution", tip: "enum", secenekler: k.cozunurlukler ?? ["1K", "2K"], varsayilan: (k.cozunurlukler ?? ["1K", "2K"])[0], aciklama: "Uzun kenar çözünürlüğü. 1K yaklaşık 1024 px, 2K yaklaşık 2048 px, 4K yaklaşık 4096 px." },
      { ad: "num_images", tip: "integer", min: 1, max: k.maksAdet ?? 4, varsayilan: 1, aciklama: `Tek istekte üretilecek görsel sayısı. Kredi adet başına düşer.` },
      { ad: "image_url", tip: "uri", aciklama: "Referans görsel. Verilirse kompozisyon ve kimlik bu görsele sadık kalır.", gelismis: true },
      { ad: "negative_prompt", tip: "string", uzun: true, max: 1000, aciklama: "Görselde istemediğin öğeler.", gelismis: true, ornek: "bulanık, filigran, metin" },
    );
  } else if (m.tur === "video") {
    const sureler = (k.sureler ?? ["5sn", "10sn"]).map(saniye);
    const oranlar = (k.oranlar ?? ["16:9", "9:16", "1:1"]).map((o) => (o === "Auto" ? "auto" : o));
    alanlar.push(
      istem("Sahnede ne olduğunu, kamera hareketini ve atmosferi anlat.", "Yağmurlu İstanbul sokağında neon tabelalar, kamera yavaşça ileri kayıyor"),
      { ad: "image_url", tip: "uri", aciklama: "Başlangıç karesi. Verilirse video bu görselden başlar (görselden videoya)." },
      { ad: "duration", tip: "enum", secenekler: sureler, varsayilan: sureler[0], aciklama: "Saniye cinsinden süre." },
      { ad: "resolution", tip: "enum", secenekler: k.cozunurlukler ?? ["720p", "1080p"], varsayilan: (k.cozunurlukler ?? ["720p"])[0], aciklama: "Çıktı çözünürlüğü." },
      { ad: "aspect_ratio", tip: "enum", secenekler: oranlar, varsayilan: oranlar[0], aciklama: "En-boy oranı. `auto` başlangıç karesine uyar." },
    );
    if (k.ses) alanlar.push({ ad: "audio", tip: "boolean", varsayilan: true, aciklama: "Sahneye uygun senkron ses ve efekt üret." });
  } else if (m.tur === "ses") {
    const sfx = /sfx/i.test(m.id);
    const muzik = /muzik/i.test(m.id);
    alanlar.push(istem(sfx ? "Ses efektinin tanımı." : muzik ? "Parçanın türü, temposu ve havası." : "Seslendirilecek metin.", sfx ? "Ahşap kapı yavaşça gıcırdayarak açılıyor" : muzik ? "Neşeli akustik jingle, el çırpma, 110 BPM" : "Merhaba, Vayra'ya hoş geldin."));
    if (!sfx && !muzik) {
      alanlar.push(
        { ad: "voice_id", tip: "string", varsayilan: "brian", aciklama: `Hazır sesin adı (${SESLER.slice(0, 6).map((x) => x.ad.toLowerCase()).join(", ")}…) ya da klonladığın sesin kimliği.`, ornek: "brian" },
        { ad: "language", tip: "enum", secenekler: ["tr", "en", "de", "fr", "es", "ar", "ru"], varsayilan: "tr", aciklama: "Metnin dili (boşsa otomatik algılanır)." },
        { ad: "stability", tip: "number", min: 0, max: 1, varsayilan: 0.5, aciklama: "Düşük değer daha duygulu, yüksek değer daha tutarlı okuma.", gelismis: true },
      );
    } else {
      alanlar.push({ ad: "duration", tip: "number", min: 0.5, max: sfx ? 22 : 120, varsayilan: sfx ? 4 : 30, aciklama: "Saniye cinsinden süre." });
    }
  } else if (m.tur === "muzik") {
    alanlar.push(
      istem("Tür, ruh hali, enstrümanlar ve tempo.", "Melankolik Anadolu rock, bağlama ve elektro gitar, 92 BPM"),
      { ad: "lyrics", tip: "string", uzun: true, max: 3000, aciklama: "Şarkı sözleri. Boş bırakılırsa istemden yazılır.", gelismis: true },
      { ad: "instrumental", tip: "boolean", varsayilan: m.id.includes("instrumental"), aciklama: "Vokalsiz üret." },
      { ad: "duration", tip: "integer", min: 30, max: 240, varsayilan: 120, aciklama: "Saniye cinsinden süre." },
    );
  } else {
    const gorselden = m.id.includes("gorsel") || m.id.includes("doku") || m.id.includes("animasyon");
    alanlar.push(
      istem("Nesnenin ya da karakterin tanımı.", "El yapımı seramik vazo, mat sır, organik form"),
      { ad: "image_url", tip: "uri", zorunlu: gorselden && !m.id.includes("doku"), aciklama: gorselden ? "Kaynak görsel ya da model (GLB) adresi." : "İsteğe bağlı referans görsel." },
      { ad: "format", tip: "enum", secenekler: ["glb", "fbx", "obj", "usdz"], varsayilan: "glb", aciklama: "Çıktı dosya biçimi." },
      { ad: "texture", tip: "boolean", varsayilan: true, aciklama: "PBR doku üret." },
      { ad: "topology", tip: "enum", secenekler: ["quad", "triangle"], varsayilan: "quad", aciklama: "Mesh topolojisi.", gelismis: true },
      { ad: "polycount", tip: "integer", min: 1000, max: 300000, varsayilan: 30000, aciklama: "Hedef poligon sayısı.", gelismis: true },
    );
  }
  alanlar.push({ ad: "seed", tip: "integer", min: 0, max: 2147483647, aciklama: "Aynı seed ve girdi aynı sonucu verir. Boşsa rastgele.", gelismis: true });
  return alanlar;
}

/** İstek gövdesinin üst düzey alanları (input dışında). */
export const UST_ALANLAR: Alan[] = [
  { ad: "model", tip: "string", zorunlu: true, aciklama: "Model kimliği, ör. `nano-banana-pro`. Liste için GET /v1/models." },
  { ad: "input", tip: "object", zorunlu: true, aciklama: "Modelin girdi alanları. Her modelin şeması kendi referans sayfasındadır." },
  { ad: "webhook_url", tip: "uri", aciklama: "Üretim bittiğinde imzalı bir `generation.completed` ya da `generation.failed` olayı bu adrese POST edilir." },
  { ad: "sync", tip: "boolean", varsayilan: false, aciklama: "true verilirse yanıt üretim bitene kadar (en çok 55 sn) bekletilir. Uzun işler için webhook ya da durum sorgusu kullan." },
  { ad: "metadata", tip: "object", aciklama: "En çok 16 anahtar–değer. Değişmeden geri döner; kendi kimliklerini taşımak için." },
];

/** Varsayılanlarla doldurulmuş örnek input. */
export function ornekInput(m: AIModel, tam = false): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const a of modelSemasi(m)) {
    if (a.zorunlu) o[a.ad] = a.ornek ?? a.varsayilan ?? "";
    else if (tam && a.varsayilan !== undefined) o[a.ad] = a.varsayilan;
  }
  return o;
}

export interface AlanHatasi { alan: string; mesaj: string }

/** input'u doğrular, varsayılanları uygular. Bilinmeyen alanlar hatadır (yazım hatası sessizce yutulmasın). */
export function inputDogrula(m: AIModel, ham: unknown): { temiz: Record<string, unknown>; hatalar: AlanHatasi[] } {
  const hatalar: AlanHatasi[] = [];
  const temiz: Record<string, unknown> = {};
  if (typeof ham !== "object" || ham === null || Array.isArray(ham)) return { temiz, hatalar: [{ alan: "input", mesaj: "input bir nesne olmalı." }] };
  const girdi = ham as Record<string, unknown>;
  const sema = modelSemasi(m);
  for (const anahtar of Object.keys(girdi)) {
    if (!sema.some((a) => a.ad === anahtar)) hatalar.push({ alan: `input.${anahtar}`, mesaj: `Bilinmeyen alan. Bu model şu alanları kabul eder: ${sema.map((a) => a.ad).join(", ")}.` });
  }
  for (const a of sema) {
    const v = girdi[a.ad];
    const yol = `input.${a.ad}`;
    if (v === undefined || v === null || v === "") {
      if (a.zorunlu) hatalar.push({ alan: yol, mesaj: "Zorunlu alan." });
      else if (a.varsayilan !== undefined) temiz[a.ad] = a.varsayilan;
      continue;
    }
    switch (a.tip) {
      case "string":
        if (typeof v !== "string") { hatalar.push({ alan: yol, mesaj: "Metin olmalı." }); break; }
        if (a.max && v.length > a.max) { hatalar.push({ alan: yol, mesaj: `En çok ${a.max} karakter.` }); break; }
        temiz[a.ad] = v.trim();
        break;
      case "uri":
        if (typeof v !== "string" || !/^(https?:\/\/|data:)/.test(v)) { hatalar.push({ alan: yol, mesaj: "http(s):// ya da data: ile başlayan bir adres olmalı." }); break; }
        temiz[a.ad] = v;
        break;
      case "boolean":
        if (typeof v !== "boolean") { hatalar.push({ alan: yol, mesaj: "true ya da false olmalı." }); break; }
        temiz[a.ad] = v;
        break;
      case "integer":
      case "number": {
        const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
        if (typeof n !== "number" || !Number.isFinite(n) || (a.tip === "integer" && !Number.isInteger(n))) { hatalar.push({ alan: yol, mesaj: a.tip === "integer" ? "Tam sayı olmalı." : "Sayı olmalı." }); break; }
        if (a.min !== undefined && n < a.min) { hatalar.push({ alan: yol, mesaj: `En az ${a.min}.` }); break; }
        if (a.max !== undefined && n > a.max) { hatalar.push({ alan: yol, mesaj: `En çok ${a.max}.` }); break; }
        temiz[a.ad] = n;
        break;
      }
      case "enum": {
        const s = a.secenekler ?? [];
        const eslesen = s.find((x) => x === v || String(x) === String(v));
        if (eslesen === undefined) { hatalar.push({ alan: yol, mesaj: `Şunlardan biri olmalı: ${s.join(", ")}.` }); break; }
        temiz[a.ad] = eslesen;
        break;
      }
      default:
        temiz[a.ad] = v;
    }
  }
  return { temiz, hatalar };
}

/** Bir üretimin kredi maliyeti — input'a göre (görselde adet, videoda saniye başı varsa süre). */
export function krediHesapla(m: AIModel, input: Record<string, unknown>): number {
  if (m.tur === "gorsel") return m.kredi * Math.max(1, Number(input.num_images ?? 1));
  if (m.tur === "video" && m.kisit?.krediSn) return Math.round(m.kisit.krediSn * Number(input.duration ?? 5));
  return m.kredi;
}

export const apiModelleri = () => MODELLER;
export const apiModelBul = (id: string) => MODELLER.find((m) => m.id === id);

/** /v1/models yanıtındaki model nesnesi. */
export function modelNesnesi(m: AIModel) {
  return {
    id: m.id,
    object: "model",
    name: m.ad,
    type: TUR_API[m.tur],
    provider: m.saglayici,
    description: m.aciklama,
    credits: m.kredi,
    pricing: m.tur === "gorsel" ? "per_image" : m.kisit?.krediSn ? "per_second" : "per_request",
    capabilities: m.yetenekler,
    input_schema: modelSemasi(m).map((a) => ({
      name: a.ad, type: a.tip, required: !!a.zorunlu, description: a.aciklama,
      ...(a.varsayilan !== undefined ? { default: a.varsayilan } : {}),
      ...(a.secenekler ? { enum: a.secenekler } : {}),
      ...(a.min !== undefined ? { minimum: a.min } : {}),
      ...(a.max !== undefined ? { maximum: a.max } : {}),
    })),
  };
}
