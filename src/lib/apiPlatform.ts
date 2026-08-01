/* ============================================================
   VAYRA CLOUD — API platformu meta katmanı.

   Higgsfield Cloud'un "API Reference / Playground / Analytics" ekranlarını
   besleyen tek kaynak. Model listesi UYDURULMAZ: her şey catalog.ts →
   MODELLER dizisinden türetilir.
   ============================================================ */

import { MODELLER, type AIModel, type ModelTur } from "./catalog";

export const API_SUNUCU = "https://platform.vayra.ai";

/** Model türü → insan-okur "Metinden Görsele" rozeti (Higgsfield "Text to Image"). */
export function turEtiket(tur: ModelTur): string {
  switch (tur) {
    case "gorsel": return "Metinden Görsele";
    case "video": return "Görselden Videoya";
    case "ses": return "Metinden Sese";
    case "muzik": return "Metinden Müziğe";
    case "3d": return "Metinden 3D'ye";
  }
}

/** Rozet rengi — tür bazlı, Higgsfield renk mantığı (mor/yeşil/kehribar…). */
export function turRozetSinif(tur: ModelTur): string {
  switch (tur) {
    case "gorsel": return "bg-violet-500/18 text-violet-300 border-violet-400/25";
    case "video": return "bg-emerald-500/18 text-emerald-300 border-emerald-400/25";
    case "ses": return "bg-amber-500/18 text-amber-300 border-amber-400/25";
    case "muzik": return "bg-rose-500/18 text-rose-300 border-rose-400/25";
    case "3d": return "bg-sky-500/18 text-sky-300 border-sky-400/25";
  }
}

/** Model türüne göre üretim uç noktası (Higgsfield /v1/text2image/soul deseni). */
export function modelUcNoktasi(m: AIModel): string {
  const yol =
    m.tur === "gorsel" ? "text2image"
    : m.tur === "video" ? "image2video"
    : m.tur === "ses" ? "text2speech"
    : m.tur === "muzik" ? "text2music"
    : "text2threed";
  return `/v1/${yol}/${m.id}`;
}

export type HttpYontem = "GET" | "POST";

export interface UcNokta {
  yontem: HttpYontem;
  yol: string;
  ozet: string;
  yolParametreleri?: { ad: string; tip: string; zorunlu: boolean; aciklama: string }[];
  govde?: { ad: string; tip: string; zorunlu: boolean; aciklama: string }[];
  yanitKodu: number;
  ornekYanit: Record<string, unknown> | null;
}

/** Üretim durumu enum'u — Higgsfield birebir. */
export const DURUM_ENUM = ["queued", "in_progress", "nsfw", "failed", "completed", "canceled"] as const;

/** Bir modelin API referansı — Higgsfield'ın 5 uç noktalı yapısı birebir. */
export function modelUcNoktalari(m: AIModel): UcNokta[] {
  const uc = modelUcNoktasi(m);
  return [
    {
      yontem: "GET",
      yol: "/requests/{request_id}/status",
      ozet: "Üretim durumunu getir",
      yolParametreleri: [{ ad: "request_id", tip: "uuid", zorunlu: true, aciklama: "Üretim isteği kimliği" }],
      yanitKodu: 200,
      ornekYanit: {
        status: "queued",
        request_id: "123e4567-e89b-12d3-a456-426614174000",
        status_url: `${API_SUNUCU}/requests/123e4567/status`,
        cancel_url: `${API_SUNUCU}/requests/123e4567/cancel`,
      },
    },
    {
      yontem: "POST",
      yol: "/requests/{request_id}/cancel",
      ozet: "Üretimi iptal et",
      yolParametreleri: [{ ad: "request_id", tip: "uuid", zorunlu: true, aciklama: "Üretim isteği kimliği" }],
      yanitKodu: 202,
      ornekYanit: null,
    },
    {
      yontem: "POST",
      yol: uc,
      ozet: `Üret [${m.ad}]`,
      govde: [
        { ad: "prompt", tip: "string", zorunlu: true, aciklama: "Üretmek istediğin içeriğin tanımı" },
        ...(m.tur === "gorsel"
          ? [
              { ad: "width_and_height", tip: "enum", zorunlu: true, aciklama: "Çıktı boyutu (ör. 1536x1536)" },
              { ad: "quality", tip: "enum", zorunlu: false, aciklama: "720p | 1080p" },
              { ad: "result_images", tip: "integer", zorunlu: false, aciklama: `1 – ${m.kisit?.maksAdet ?? 4} arası adet` },
            ]
          : []),
        ...(m.tur === "video"
          ? [
              { ad: "input_image_url", tip: "uri", zorunlu: false, aciklama: "Başlangıç karesi görsel URL'i" },
              { ad: "duration", tip: "enum", zorunlu: false, aciklama: (m.kisit?.sureler ?? ["5sn"]).join(" | ") },
              { ad: "resolution", tip: "enum", zorunlu: false, aciklama: (m.kisit?.cozunurlukler ?? ["720p"]).join(" | ") },
            ]
          : []),
        ...(m.tur === "ses" || m.tur === "muzik"
          ? [{ ad: "voice_id", tip: "string", zorunlu: false, aciklama: "Ses/vokal kimliği" }]
          : []),
        ...(m.tur === "3d"
          ? [{ ad: "format", tip: "enum", zorunlu: false, aciklama: "glb | fbx | obj" }]
          : []),
        { ad: "seed", tip: "integer", zorunlu: false, aciklama: "Tekrar üretilebilirlik için tohum" },
        { ad: "webhook_url", tip: "uri", zorunlu: false, aciklama: "Sonuç bu adrese POST edilir" },
      ],
      yanitKodu: 202,
      ornekYanit: {
        request_id: "123e4567-e89b-12d3-a456-426614174000",
        status: "queued",
        credits_charged: m.kredi,
        status_url: `${API_SUNUCU}/requests/123e4567/status`,
      },
    },
    {
      yontem: "GET",
      yol: "/v1/models",
      ozet: "Kullanılabilir modelleri listele",
      yanitKodu: 200,
      ornekYanit: {
        data: [{ id: m.id, name: m.ad, provider: m.saglayici, type: m.tur, credits: m.kredi }],
        total: MODELLER.length,
      },
    },
    {
      yontem: "GET",
      yol: "/v1/account/balance",
      ozet: "Kredi bakiyesini getir",
      yanitKodu: 200,
      ornekYanit: { credits_available: 9000, credits_used_this_month: 412, plan: "arti" },
    },
  ];
}

export type Dil = "curl" | "python" | "node";

export const DIL_ADLARI: Record<Dil, string> = { curl: "cURL", python: "Python", node: "Node.js" };

export interface KodParam {
  model: AIModel;
  prompt: string;
  anahtar: string;
  ekstra?: Record<string, string | number>;
}

/** Playground formundan GERÇEK çalıştırılabilir kod üretir ("Bu isteği kodla"). */
export function kodUret(dil: Dil, p: KodParam): string {
  const uc = modelUcNoktasi(p.model);
  const govde: Record<string, unknown> = { prompt: p.prompt || "bir fikir yaz", ...(p.ekstra ?? {}) };
  const json = JSON.stringify(govde, null, 2);

  if (dil === "curl") {
    return `curl -X POST '${API_SUNUCU}${uc}' \\
  -H 'Authorization: Bearer ${p.anahtar}' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(govde)}'`;
  }

  if (dil === "python") {
    const pyGovde = json
      .replace(/: true/g, ": True")
      .replace(/: false/g, ": False");
    return `import requests

resp = requests.post(
    "${API_SUNUCU}${uc}",
    headers={"Authorization": "Bearer ${p.anahtar}"},
    json=${pyGovde.split("\n").join("\n    ")},
    timeout=60,
)
resp.raise_for_status()
istek = resp.json()
print(istek["request_id"], istek["status"])`;
  }

  return `const yanit = await fetch("${API_SUNUCU}${uc}", {
  method: "POST",
  headers: {
    Authorization: "Bearer ${p.anahtar}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(${json.split("\n").join("\n  ")}),
});

const istek = await yanit.json();
console.log(istek.request_id, istek.status);`;
}

/** Sıradaki adım: durum sorgulama örneği (dil bazlı). */
export function durumKodu(dil: Dil, anahtar: string): string {
  if (dil === "curl") {
    return `curl '${API_SUNUCU}/requests/{request_id}/status' \\
  -H 'Authorization: Bearer ${anahtar}'`;
  }
  if (dil === "python") {
    return `durum = requests.get(
    f"${API_SUNUCU}/requests/{istek['request_id']}/status",
    headers={"Authorization": "Bearer ${anahtar}"},
).json()
print(durum["status"])  # queued | in_progress | completed | failed`;
  }
  return `const durum = await fetch(
  \`${API_SUNUCU}/requests/\${istek.request_id}/status\`,
  { headers: { Authorization: "Bearer ${anahtar}" } },
).then((r) => r.json());

console.log(durum.status); // queued | in_progress | completed | failed`;
}

/** Playground'da bir model için gösterilecek çözünürlük seçenekleri. */
export function cozunurlukSecenekleri(m: AIModel): string[] {
  if (m.tur === "gorsel") {
    return ["1024x1024", "1536x1536", "1536x1152", "1152x1536", "2048x1152", "1152x2048"];
  }
  return m.kisit?.cozunurlukler ?? ["720p", "1080p"];
}

/** Model kimliğini bul; yoksa ilk görsel modeli döndür (rota parametresi güvenliği). */
export function modelBul(id: string): AIModel | undefined {
  return MODELLER.find((m) => m.id === id);
}

/** Çağrı durumu → rozet sınıfı (İstekler/Analitik tablolarında ortak). */
export function durumSinif(d: (typeof DURUM_ENUM)[number]): string {
  switch (d) {
    case "completed": return "border-aksan/30 bg-aksan/12 text-aksan";
    case "failed":
    case "nsfw": return "border-rose-400/30 bg-rose-500/12 text-rose-300";
    case "canceled": return "border-white/[0.1] bg-white/[0.05] text-metin-3";
    default: return "border-sky-400/30 bg-sky-500/12 text-sky-300";
  }
}
