/**
 * Geliştirici platformu (dev.vayra) admin verileri — API anahtar kullanımı,
 * rate limit, endpoint istatistikleri, SDK dağılımı, webhook teslim.
 */
import { prng, tohumla, tamsayi, sec, normal, BUGUN, SAAT } from "../cekirdek";
import type { AdminEvren } from "./index";

export interface ApiKullanici {
  kullaniciId: string;
  ad: string;
  anahtarSayisi: number;
  cagri30: number;
  hizLimiti: number;
  plan: string;
  sonCagri: number;
}

export function apiKullanicilar(evren: AdminEvren): ApiKullanici[] {
  const ultraKul = evren.kullanicilar.filter((k) => k.plan === "ultra" || k.plan === "kurumsal");
  return ultraKul.slice(0, 40).map((k) => {
    const r = prng(tohumla(`apik-${k.id}`));
    return {
      kullaniciId: k.id, ad: k.ad, anahtarSayisi: tamsayi(r, 1, 5),
      cagri30: Math.round(normal(r) * 50000), hizLimiti: sec(r, [60, 120, 300, 600]),
      plan: k.plan, sonCagri: BUGUN - tamsayi(r, 1, 48) * SAAT,
    };
  }).sort((a, b) => b.cagri30 - a.cagri30);
}

export interface EndpointStat {
  endpoint: string;
  cagri: number;
  ortMs: number;
  hataOran: number;
}

export function endpointStatlari(): EndpointStat[] {
  const eps = [
    "POST /v1/text2image", "POST /v1/text2video", "POST /v1/image2video",
    "POST /v1/tts", "GET /v1/models", "GET /v1/account/balance", "GET /v1/requests/{id}",
  ];
  return eps.map((endpoint, i) => {
    const r = prng(tohumla(`ep-${i}`));
    return { endpoint, cagri: tamsayi(r, 5000, 120000), ortMs: tamsayi(r, 80, 2400), hataOran: +(normal(r) * 4).toFixed(2) };
  }).sort((a, b) => b.cagri - a.cagri);
}

export function sdkDagilim(): { etiket: string; deger: number; renk: string }[] {
  return [
    { etiket: "Python", deger: 4200, renk: "#55d6fd" },
    { etiket: "Node.js", deger: 3100, renk: "#34d399" },
    { etiket: "cURL / REST", deger: 2400, renk: "#a78bfa" },
    { etiket: "Go", deger: 800, renk: "#f472b6" },
  ];
}

export function apiMetrik() {
  return {
    toplamAnahtar: 342, aktifAnahtar: 218, cagri30: 4_200_000, ortLatency: 340,
    hataOran: 1.2, rateLimitAsim: 84, aylikCagriSeri: Array.from({ length: 30 }, (_, i) => {
      const r = prng(tohumla(`apiseri-${i}`));
      return Math.round(120000 + i * 3000 + normal(r) * 40000);
    }),
  };
}

export interface DevWebhook {
  id: string;
  url: string;
  olay: string;
  basari: number;
  basarisiz: number;
  sonTeslim: number;
  aktif: boolean;
}

export function devWebhooklar(): DevWebhook[] {
  const urls = ["https://app.acme.co/hooks/vayra", "https://api.studio.io/webhook", "https://n8n.brand.com/vayra"];
  const olaylar = ["job.completed", "job.failed", "balance.low"];
  return urls.map((url, i) => {
    const r = prng(tohumla(`devwh-${i}`));
    return { id: `dwh_${i}`, url, olay: sec(r, olaylar), basari: tamsayi(r, 800, 12000), basarisiz: tamsayi(r, 0, 200), sonTeslim: BUGUN - tamsayi(r, 1, 24) * SAAT, aktif: r() > 0.2 };
  });
}

/* ── API istek logları (deterministik) ───────────────────────────── */

export interface ApiLog {
  id: string;
  endpoint: string;
  method: "GET" | "POST" | "DELETE";
  status: number;
  latencyMs: number;
  apiKeyId: string;
  ip: string;
  zaman: number;
}

const LOG_ENDPOINTS: { endpoint: string; method: ApiLog["method"] }[] = [
  { endpoint: "/v1/generate", method: "POST" },
  { endpoint: "/v1/generate", method: "POST" },
  { endpoint: "/v1/generate", method: "POST" },
  { endpoint: "/v1/jobs/{id}", method: "GET" },
  { endpoint: "/v1/jobs/{id}", method: "GET" },
  { endpoint: "/v1/models", method: "GET" },
  { endpoint: "/v1/account/balance", method: "GET" },
  { endpoint: "/v1/tts", method: "POST" },
  { endpoint: "/v1/image2video", method: "POST" },
  { endpoint: "/v1/jobs/{id}", method: "DELETE" },
];
const LOG_KEYLER = ["key_prod01", "key_ci02", "key_admin03"];

let _loglar: ApiLog[] | null = null;

/** Son N API isteği (varsayılan 60), en yeni önce. Deterministik. */
export function uretApiLoglar(n = 60): ApiLog[] {
  if (_loglar && _loglar.length >= n) return _loglar.slice(0, n);
  const r = prng(tohumla("api-loglar-v1"));
  const list: ApiLog[] = [];
  let t = BUGUN;
  for (let i = 0; i < Math.max(n, 60); i++) {
    const ep = LOG_ENDPOINTS[tamsayi(r, 0, LOG_ENDPOINTS.length - 1)];
    // %92 başarı, kalan hata (POST'lar biraz daha riskli)
    const hataMi = r() < (ep.method === "POST" ? 0.11 : 0.05);
    const status = hataMi
      ? sec(r, [400, 401, 422, 429, 500, 503])
      : ep.method === "POST" ? sec(r, [200, 201, 202]) : 200;
    // latency: GET hızlı, POST ağır üretim
    const taban = ep.method === "GET" ? 60 : 900;
    const latencyMs = Math.max(12, Math.round(taban + normal(r) * (ep.method === "GET" ? 120 : 1400)));
    t -= tamsayi(r, 20, 900) * 1000; // her istek 20sn-15dk öncesi
    list.push({
      id: `log_${(BUGUN - t).toString(36)}_${i}`,
      endpoint: ep.endpoint,
      method: ep.method,
      status,
      latencyMs,
      apiKeyId: sec(r, LOG_KEYLER),
      ip: `${tamsayi(r, 34, 213)}.${tamsayi(r, 1, 254)}.${tamsayi(r, 1, 254)}.${tamsayi(r, 1, 254)}`,
      zaman: t,
    });
  }
  _loglar = list;
  return list.slice(0, n);
}
