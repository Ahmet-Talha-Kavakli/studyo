import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import type { StripeAyar } from "./ayar";
import { OdemeHatasi } from "./hata";

/**
 * Stripe REST çağrıları (Checkout Sessions, Subscriptions, Invoices, Products, Coupons, Refunds). SDK yok: fetch ile.
 * API sürümü sabitlenir; webhook gövdesi uç noktanın sürümüyle gelebileceği için olaydaki nesne güvenilmez, kimliğiyle
 * bu sürümde yeniden çekilir.
 *
 * Webhook imzası: Stripe-Signature "t=..,v1=.."; v1 = HMAC-SHA256(`${t}.${gövde}`, whsec) hex; 5 dakika tolerans.
 * Belgeler: docs.stripe.com (Checkout, Billing subscriptions, Prorations, Webhook signatures).
 */
export const STRIPE_SURUM = "2024-06-20";
const ZAMAN = 15_000;
type J = Record<string, unknown>;

export async function stripeIstek(a: StripeAyar, yontem: "GET" | "POST" | "DELETE", yol: string, govde?: URLSearchParams, idem?: string): Promise<J> {
  let r: Response;
  try {
    r = await fetch(a.taban + yol, {
      method: yontem, signal: AbortSignal.timeout(ZAMAN), cache: "no-store",
      headers: { Authorization: `Bearer ${a.secretKey}`, "Stripe-Version": STRIPE_SURUM, ...(govde ? { "Content-Type": "application/x-www-form-urlencoded" } : {}), ...(idem ? { "Idempotency-Key": idem } : {}) },
      body: govde?.toString(),
    });
  } catch { throw new OdemeHatasi("Stripe'a ulaşılamadı; biraz sonra yeniden dene.", 502); }
  let j: J | null = null;
  try { j = (await r.json()) as J; } catch { /* boş */ }
  if (!r.ok || !j) {
    const e = (j?.error ?? {}) as { message?: string; code?: string; decline_code?: string };
    throw new OdemeHatasi(`Stripe: ${e.message ?? `yanıt vermedi (${r.status})`}`, r.status === 402 ? 402 : 502, e.code === "resource_already_exists" ? "var" : e.code);
  }
  return j;
}

/** İmza doğru ve zaman toleransı içindeyse true. */
export function imzaDogrula(a: StripeAyar, baslik: string | null, govde: string, tolerans = 300): boolean {
  if (!baslik) return false;
  const parca = baslik.split(",").map((x) => x.trim().split("="));
  const t = parca.find(([k]) => k === "t")?.[1];
  const v1 = parca.filter(([k]) => k === "v1").map(([, v]) => v ?? "");
  if (!t || !/^\d+$/.test(t) || !v1.length || Math.abs(Date.now() / 1000 - Number(t)) > tolerans) return false;
  const beklenen = createHmac("sha256", a.webhookSecret).update(`${t}.${govde}`).digest("hex");
  const b = Buffer.from(beklenen);
  return v1.some((x) => { const y = Buffer.from(x); return y.length === b.length && timingSafeEqual(y, b); });
}

/* ── Yardımcılar: sürüm farklarına dayanıklı okuma ── */

export const kimlikAl = (v: unknown): string | null => (typeof v === "string" ? v : v && typeof v === "object" && typeof (v as J).id === "string" ? String((v as J).id) : null);
export function abonelikDonemi(sub: J): { bas: number; bit: number } {
  const oge = ((sub.items as J | undefined)?.data as J[] | undefined)?.[0];
  const bas = Number(sub.current_period_start ?? oge?.current_period_start ?? 0);
  const bit = Number(sub.current_period_end ?? oge?.current_period_end ?? 0);
  return { bas: bas * 1000, bit: bit * 1000 };
}
export const abonelikOgesi = (sub: J) => kimlikAl(((sub.items as J | undefined)?.data as J[] | undefined)?.[0]);
export const ogeUrunu = (sub: J) => kimlikAl((((sub.items as J | undefined)?.data as J[] | undefined)?.[0]?.price as J | undefined)?.product);
export function faturaAboneligi(inv: J): string | null {
  return kimlikAl(inv.subscription) ?? kimlikAl(((inv.parent as J | undefined)?.subscription_details as J | undefined)?.subscription);
}

/* ── Ürünler ve kupon (yükseltmede price_data için ürün kimliği gerekir) ── */

const urunOnbellek = new Map<string, string>();
export async function urunKimligi(a: StripeAyar, anahtar: string, ad: string): Promise<string> {
  const v = urunOnbellek.get(`${a.mod}:${anahtar}`);
  if (v) return v;
  const kimlik = `vayra_${a.mod}_${anahtar}`.replace(/[^A-Za-z0-9_]/g, "_");
  try {
    const j = await stripeIstek(a, "GET", `/v1/products/${kimlik}`);
    urunOnbellek.set(`${a.mod}:${anahtar}`, String(j.id));
    return String(j.id);
  } catch { /* yok: oluştur */ }
  try {
    const j = await stripeIstek(a, "POST", "/v1/products", new URLSearchParams({ id: kimlik, name: ad, "metadata[vayra]": anahtar }));
    urunOnbellek.set(`${a.mod}:${anahtar}`, String(j.id));
    return String(j.id);
  } catch (e) {
    if ((e as OdemeHatasi).kod === "var") { urunOnbellek.set(`${a.mod}:${anahtar}`, kimlik); return kimlik; }
    throw e;
  }
}

/** Davet indirimi kuponu: ilk ödemede bir kez, yüzde oranında. */
export async function davetKuponu(a: StripeAyar, oran: number): Promise<string> {
  const kimlik = `vayra-davet-${Math.round(oran * 100)}`;
  try { await stripeIstek(a, "GET", `/v1/coupons/${kimlik}`); return kimlik; } catch { /* yok */ }
  try { await stripeIstek(a, "POST", "/v1/coupons", new URLSearchParams({ id: kimlik, percent_off: String(Math.round(oran * 100)), duration: "once", name: "Davet indirimi" })); }
  catch (e) { if ((e as OdemeHatasi).kod !== "var") throw e; }
  return kimlik;
}
