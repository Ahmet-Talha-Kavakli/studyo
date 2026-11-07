import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { kancaImzaBul } from "./sistemTetikKatalog";

/**
 * İmzalı web kancası doğrulaması (servislerin resmî kuralları):
 *  Shopify: X-Shopify-Hmac-Sha256 = base64(HMAC-SHA256(gövde)) · WooCommerce: X-WC-Webhook-Signature = base64(HMAC-SHA256(gövde))
 *  Stripe: Stripe-Signature "t=…,v1=…", v1 = hex(HMAC-SHA256("t.gövde")), 5 dakika tolerans
 *  GitHub ve Meta: X-Hub-Signature-256 = "sha256=" + hex(HMAC-SHA256(gövde))
 *  Slack: X-Slack-Signature = "v0=" + hex(HMAC-SHA256("v0:zaman:gövde")), X-Slack-Request-Timestamp 5 dakika içinde
 *  Typeform: Typeform-Signature = "sha256=" + base64(HMAC-SHA256(gövde)) · Calendly: "t=…,v1=…", hex(HMAC("t.gövde"))
 *  Cal.com: X-Cal-Signature-256 = hex(HMAC(gövde)) · Linear: Linear-Signature = hex(HMAC(gövde))
 *  Paddle: Paddle-Signature "ts=…;h1=…", h1 = hex(HMAC("ts:gövde")) · Lemon Squeezy: X-Signature = hex(HMAC(gövde))
 *  Telegram: X-Telegram-Bot-Api-Secret-Token sırla birebir · Özel: seçilen başlıkta hex ya da base64, isteğe bağlı sha256= öneki.
 */
const esit = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
const hmac = (k: string, v: string, kod: "hex" | "base64") => createHmac("sha256", k).update(v, "utf8").digest(kod);
const parcala = (v: string, ayrac: string) => Object.fromEntries(v.split(ayrac).map((x) => x.trim().split("=")).filter((x) => x.length >= 2).map(([k, ...r]) => [k, r.join("=")]));
const tazeMi = (sn: number) => Number.isFinite(sn) && Math.abs(Date.now() / 1000 - sn) <= 300;

export function kancaDogrula(tur: string, govde: string, h: Headers, sir: string, ozelBaslik?: string): { ok: true } | { ok: false; neden: string } {
  const t = kancaImzaBul(tur);
  if (!t) return { ok: false, neden: "Bilinmeyen imza türü." };
  if (!sir) return { ok: false, neden: `İmza sırrı (${t.sir}) tanımlı değil.` };
  const baslik = tur === "ozel" ? ozelBaslik || t.baslik : t.baslik;
  const v = (h.get(baslik) ?? "").trim();
  if (!v) return { ok: false, neden: `${baslik} başlığı yok.` };
  let ok = false;
  switch (tur) {
    case "shopify": case "woocommerce": ok = esit(v, hmac(sir, govde, "base64")); break;
    case "github": case "meta": ok = esit(v, `sha256=${hmac(sir, govde, "hex")}`); break;
    case "typeform": ok = esit(v, `sha256=${hmac(sir, govde, "base64")}`); break;
    case "calcom": case "linear": case "lemonsqueezy": ok = esit(v.toLowerCase(), hmac(sir, govde, "hex")); break;
    case "telegram": ok = esit(v, sir); break;
    case "stripe": case "calendly": {
      const p = parcala(v, ",");
      if (!tazeMi(Number(p.t))) return { ok: false, neden: "İmza zamanı 5 dakikadan eski." };
      const beklenen = hmac(sir, `${p.t}.${govde}`, "hex");
      ok = v.split(",").some((x) => x.trim().startsWith("v1=") && esit(x.trim().slice(3), beklenen));
      break;
    }
    case "slack": {
      const z = Number(h.get("x-slack-request-timestamp"));
      if (!tazeMi(z)) return { ok: false, neden: "İstek zamanı 5 dakikadan eski." };
      ok = esit(v, `v0=${hmac(sir, `v0:${z}:${govde}`, "hex")}`);
      break;
    }
    case "paddle": {
      const p = parcala(v, ";");
      if (!tazeMi(Number(p.ts))) return { ok: false, neden: "İmza zamanı 5 dakikadan eski." };
      ok = esit(p.h1 ?? "", hmac(sir, `${p.ts}:${govde}`, "hex"));
      break;
    }
    case "ozel": { const x = v.replace(/^sha256=/i, ""); ok = esit(x.toLowerCase(), hmac(sir, govde, "hex")) || esit(x, hmac(sir, govde, "base64")); break; }
  }
  return ok ? { ok: true } : { ok: false, neden: "İmza tutmadı." };
}
