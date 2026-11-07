import "server-only";
import { createHash } from "crypto";
import type { Proje } from "./tipler";

/**
 * Sızdırılmış anahtar taraması (GitHub secret scanning, GitGuardian benzeri). Taslak dosyalar, bütün sürümler ve
 * herkese açık ortam değişkenleri taranır; bilinen sağlayıcı biçimleri (AWS, Stripe, OpenAI, Anthropic, Google, GitHub,
 * Slack, Discord, Telegram, SendGrid, Mailgun, Twilio, Resend, Mapbox, özel anahtar blokları, Supabase service_role,
 * Firebase hizmet hesabı, iyzico ve PayTR gizli değerleri) ve tarayıcı kodunda düz yazılmış parola ya da gizli anahtar
 * atamaları aranır. Değer hiçbir zaman tam gösterilmez; özet ile tekilleştirilir.
 * Önem: yayınlanmış bir sürümde tarayıcıya giden dosyada ise kritik (herkes görebilir ya da gördü), yalnız taslakta ya
 * da sunucu fonksiyonunda (api/) ise uyarı. Sürümden silmek yetmez: anahtar sağlayıcıda iptal edilip yenilenmeli.
 */
export type Sizinti = {
  id: string; tur: string; saglayici: string; seviye: "kritik" | "uyari"; maske: string;
  yerler: { dosya: string; satir: number; surum: number | "taslak" | "ortam"; yayinlandi: boolean }[];
  ilkSurum: number | null; yayinda: boolean; yayinlanmisti: boolean; tarayicida: boolean; iptal?: string; ajan: string;
};
type Desen = { tur: string; saglayici: string; re: RegExp; iptal?: string; dogrula?: (m: RegExpExecArray) => boolean; deger?: (m: RegExpExecArray) => string };

const jwtRol = (t: string) => { try { return (JSON.parse(Buffer.from(t.split(".")[1], "base64url").toString("utf8")) as { role?: string }).role; } catch { return undefined; } };
const DESENLER: Desen[] = [
  { tur: "AWS erişim anahtarı", saglayici: "AWS", re: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/g, iptal: "https://console.aws.amazon.com/iam/home#/security_credentials" },
  { tur: "Stripe gizli anahtarı (canlı)", saglayici: "Stripe", re: /\b(sk|rk)_live_[0-9a-zA-Z]{20,}\b/g, iptal: "https://dashboard.stripe.com/apikeys" },
  { tur: "Stripe gizli anahtarı (test)", saglayici: "Stripe", re: /\bsk_test_[0-9a-zA-Z]{20,}\b/g, iptal: "https://dashboard.stripe.com/test/apikeys" },
  { tur: "Stripe webhook sırrı", saglayici: "Stripe", re: /\bwhsec_[0-9a-zA-Z]{24,}\b/g, iptal: "https://dashboard.stripe.com/webhooks" },
  { tur: "Anthropic API anahtarı", saglayici: "Anthropic", re: /\bsk-ant-(?:api|admin)\d{2}-[A-Za-z0-9_-]{40,}\b/g, iptal: "https://console.anthropic.com/settings/keys" },
  { tur: "OpenAI API anahtarı", saglayici: "OpenAI", re: /\bsk-(?:proj-|svcacct-|admin-)?[A-Za-z0-9_-]{20,}T3BlbkFJ[A-Za-z0-9_-]{20,}\b|\bsk-proj-[A-Za-z0-9_-]{40,}\b/g, iptal: "https://platform.openai.com/api-keys" },
  { tur: "Google API anahtarı", saglayici: "Google", re: /\bAIza[0-9A-Za-z_-]{35}\b/g, iptal: "https://console.cloud.google.com/apis/credentials" },
  { tur: "Google OAuth istemci sırrı", saglayici: "Google", re: /\bGOCSPX-[0-9A-Za-z_-]{28}\b/g, iptal: "https://console.cloud.google.com/apis/credentials" },
  { tur: "GitHub erişim belirteci", saglayici: "GitHub", re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{60,}\b/g, iptal: "https://github.com/settings/tokens" },
  { tur: "Slack belirteci", saglayici: "Slack", re: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g, iptal: "https://api.slack.com/apps" },
  { tur: "Slack gelen webhook adresi", saglayici: "Slack", re: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]{20,}/g, iptal: "https://api.slack.com/apps" },
  { tur: "Discord webhook adresi", saglayici: "Discord", re: /https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]{50,}/g },
  { tur: "Telegram bot belirteci", saglayici: "Telegram", re: /\b\d{8,10}:AA[A-Za-z0-9_-]{33}\b/g, iptal: "https://t.me/BotFather" },
  { tur: "SendGrid API anahtarı", saglayici: "SendGrid", re: /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/g, iptal: "https://app.sendgrid.com/settings/api_keys" },
  { tur: "Mailgun API anahtarı", saglayici: "Mailgun", re: /\bkey-[0-9a-f]{32}\b/g },
  { tur: "Twilio API anahtarı", saglayici: "Twilio", re: /\bSK[0-9a-f]{32}\b/g, iptal: "https://console.twilio.com/" },
  { tur: "Resend API anahtarı", saglayici: "Resend", re: /\bre_[A-Za-z0-9]{8}_[A-Za-z0-9]{20,}\b/g, iptal: "https://resend.com/api-keys" },
  { tur: "Mapbox gizli belirteci", saglayici: "Mapbox", re: /\bsk\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g, iptal: "https://account.mapbox.com/access-tokens/" },
  { tur: "Özel anahtar bloğu", saglayici: "Sertifika", re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY(?: BLOCK)?-----/g },
  { tur: "Supabase service_role anahtarı", saglayici: "Supabase", re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g, dogrula: (m) => jwtRol(m[0]) === "service_role", iptal: "https://supabase.com/dashboard/project/_/settings/api" },
  { tur: "Firebase hizmet hesabı", saglayici: "Google", re: /"private_key_id"\s*:\s*"[0-9a-f]{40}"/g, iptal: "https://console.cloud.google.com/iam-admin/serviceaccounts" },
  { tur: "iyzico gizli anahtarı", saglayici: "iyzico", re: /\b(?:secret_?key|secretKey|IYZICO_SECRET(?:_KEY)?)\s*[:=]\s*["'`]((?:sandbox-)?[A-Za-z0-9]{30,})["'`]/g, deger: (m) => m[1], iptal: "https://merchant.iyzipay.com/settings" },
  { tur: "PayTR mağaza anahtarı", saglayici: "PayTR", re: /\bmerchant_(?:key|salt)\s*[:=]\s*["'`]([A-Za-z0-9]{12,})["'`]/g, deger: (m) => m[1], iptal: "https://www.paytr.com/magaza/bilgi" },
  { tur: "Koda yazılmış parola ya da gizli değer", saglayici: "Genel", re: /\b(?:password|passwd|sifre|şifre|parola|secret|client_?secret|api_?secret|private_?key|access_?token|auth_?token)\s*[:=]\s*["'`]([^"'`\s]{12,})["'`]/gi, deger: (m) => m[1], dogrula: (m) => !/^(?:\*+|x+|örnek|ornek|placeholder|your|senin|changeme|değiştir|degistir|test|demo|\$\{)/i.test(m[1]) && !/process\.env|VAYRA_ENV|vayra\.sir/.test(m[1]) && new Set(m[1]).size > 5 },
];

const maskele = (v: string) => (v.length <= 12 ? `${v.slice(0, 2)}${"•".repeat(Math.max(3, v.length - 4))}${v.slice(-2)}` : `${v.slice(0, 6)}${"•".repeat(8)}${v.slice(-4)}`);
const tarayiciDosyasi = (yol: string) => !yol.startsWith("api/") && /\.(m?js|html?|css|json|jsx|tsx?|txt|xml|svg|map)$/i.test(yol);

/** Projenin bütün sürümlerini, taslağı ve ortam değişkenlerini tarar. */
export function sizintiTara(p: Proje): Sizinti[] {
  const yayinlanan = new Set<string>([...(p.yayinGecmisi ?? []).filter((y) => y.olay !== "kaldir").map((y) => y.surumId), ...(p.yayin ? [p.yayin.surumId] : [])]);
  const harita = new Map<string, Sizinti>();
  const kumeler: { dosyalar: Record<string, string>; surum: number | "taslak"; yayinlandi: boolean; yayinda: boolean }[] = [
    ...p.surumler.map((s) => ({ dosyalar: s.dosyalar, surum: s.no, yayinlandi: yayinlanan.has(s.id), yayinda: p.yayin?.surumId === s.id })),
    { dosyalar: p.dosyalar, surum: "taslak" as const, yayinlandi: false, yayinda: false },
  ];
  // Aynı dosya içeriği birçok sürümde aynı: içerik özetiyle bir kez taranır, yerler birleştirilir.
  const tarandi = new Map<string, { d: Desen; deger: string; satir: number }[]>();
  for (const k of kumeler) {
    for (const [yol, icerik] of Object.entries(k.dosyalar)) {
      if (typeof icerik !== "string" || icerik.length > 2_000_000 || icerik.startsWith("data:")) continue;
      const oz = createHash("sha1").update(icerik).digest("base64url");
      let bulunan = tarandi.get(oz);
      if (!bulunan) {
        bulunan = [];
        for (const d of DESENLER) {
          d.re.lastIndex = 0;
          for (const m of icerik.matchAll(d.re)) {
            const mm = m as unknown as RegExpExecArray;
            if (d.dogrula && !d.dogrula(mm)) continue;
            const deger = d.deger ? d.deger(mm) : mm[0];
            bulunan.push({ d, deger, satir: icerik.slice(0, m.index ?? 0).split("\n").length });
            if (bulunan.length > 50) break;
          }
        }
        tarandi.set(oz, bulunan);
      }
      for (const b of bulunan) {
        const id = createHash("sha256").update(`${b.d.tur}|${b.deger}`).digest("base64url").slice(0, 16);
        const tarayicida = tarayiciDosyasi(yol);
        const x = harita.get(id) ?? { id, tur: b.d.tur, saglayici: b.d.saglayici, seviye: "uyari" as const, maske: maskele(b.deger), yerler: [], ilkSurum: null, yayinda: false, yayinlanmisti: false, tarayicida: false, ...(b.d.iptal ? { iptal: b.d.iptal } : {}), ajan: "" };
        if (x.yerler.length < 30) x.yerler.push({ dosya: yol, satir: b.satir, surum: k.surum, yayinlandi: k.yayinlandi });
        if (typeof k.surum === "number" && (x.ilkSurum === null || k.surum < x.ilkSurum)) x.ilkSurum = k.surum;
        if (k.yayinda) x.yayinda = true;
        if (k.yayinlandi && tarayicida) x.yayinlanmisti = true;
        if (tarayicida) x.tarayicida = true;
        harita.set(id, x);
      }
    }
  }
  // Herkese açık ortam değişkeni olarak girilmiş gizli biçimli değerler.
  for (const s of p.ayarlar.sirlar ?? []) {
    if (s.gorunurluk !== "herkese" || !s.deger) continue;
    for (const d of DESENLER.slice(0, -1)) {
      d.re.lastIndex = 0;
      const m = d.re.exec(s.deger);
      if (!m || (d.dogrula && !d.dogrula(m)) || /Google API anahtarı|Stripe gizli anahtarı \(test\)/.test(d.tur)) continue;
      const deger = d.deger ? d.deger(m) : m[0];
      const id = createHash("sha256").update(`${d.tur}|${deger}`).digest("base64url").slice(0, 16);
      const x = harita.get(id) ?? { id, tur: d.tur, saglayici: d.saglayici, seviye: "kritik" as const, maske: maskele(deger), yerler: [], ilkSurum: null, yayinda: !!p.yayin, yayinlanmisti: !!p.yayin, tarayicida: true, ...(d.iptal ? { iptal: d.iptal } : {}), ajan: "" };
      x.yerler.push({ dosya: `Ortam değişkeni ${s.ad} (herkese açık)`, satir: 0, surum: "ortam", yayinlandi: !!p.yayin });
      harita.set(id, x);
    }
  }
  const oncelik = (s: Sizinti) => (s.yayinlanmisti ? 0 : s.tarayicida ? 1 : 2);
  return [...harita.values()].map((s) => {
    const kritik = s.yayinlanmisti || s.yerler.some((y) => y.surum === "ortam") || (s.tarayicida && /canlı|AWS|Anthropic|OpenAI|GitHub|service_role|Özel anahtar|hizmet hesabı|iyzico|PayTR/.test(s.tur));
    const dosyalar = [...new Set(s.yerler.filter((y) => y.surum !== "ortam").map((y) => y.dosya))];
    const ajan = `${s.tur} (${s.maske}) ${dosyalar.length ? `${dosyalar.join(", ")} dosyasında` : "ortam değişkenlerinde"} düz yazılmış. Değeri koddan tamamen kaldır; gerekiyorsa sunucu sırrı olarak sakla (Ortam ve sırlar, görünürlük: sunucu) ve yalnız api/ altındaki bir sunucu fonksiyonunda vayra.sir("AD") ile oku; tarayıcı kodu bu fonksiyonu vayra.fonksiyon ile çağırsın. Değeri sohbete ya da koda yeniden yazma.`;
    return { ...s, seviye: kritik ? "kritik" as const : "uyari" as const, ajan };
  }).sort((a, b) => (a.seviye === b.seviye ? 0 : a.seviye === "kritik" ? -1 : 1) || oncelik(a) - oncelik(b));
}
