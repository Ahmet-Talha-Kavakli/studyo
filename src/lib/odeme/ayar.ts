import "server-only";
import { gelistirme } from "@/lib/hesap/guvenlik";
import type { OdemeDurumu, OdemeModu, Para, SaglayiciKimligi } from "./tipler";

/**
 * Vayra'nın kendi satışı için ödeme sağlayıcılarının ayarları (ortam değişkenleri).
 *
 *  VAYRA_IYZICO_API_KEY, VAYRA_IYZICO_SECRET_KEY, VAYRA_IYZICO_ORTAM=sandbox|canli
 *  VAYRA_STRIPE_SECRET_KEY, VAYRA_STRIPE_WEBHOOK_SECRET
 *
 * Güvenlik: üretimde (NODE_ENV=production) sandbox ya da sk_test anahtarıyla satış açılmaz; test kartıyla kredi ve
 * plan alınabilirdi. Yalnız VAYRA_DENEME_ODEME=1 olan deneme ortamında test anahtarı kabul edilir.
 * Yerel deneme sunucusu: yalnız geliştirmede VAYRA_ODEME_TABAN_IYZICO ve VAYRA_ODEME_TABAN_STRIPE (localhost adresi).
 */

const e = (ad: string) => (process.env[ad] ?? "").trim();
export const denemeAcik = () => gelistirme() || process.env.VAYRA_DENEME_ODEME === "1";
const uretim = () => process.env.NODE_ENV === "production";

export interface IyzicoAyar { apiKey: string; secretKey: string; mod: OdemeModu; taban: string }
export interface StripeAyar { secretKey: string; webhookSecret: string; mod: OdemeModu; taban: string }

const YEREL = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{2,5})?$/;
function yerelTaban(s: "iyzico" | "stripe"): string | null {
  if (uretim()) return null;
  const x = e(`VAYRA_ODEME_TABAN_${s.toUpperCase()}`).replace(/\/+$/, "");
  return x && YEREL.test(x) ? x : null;
}

export function iyzicoAyar(): IyzicoAyar | null {
  const apiKey = e("VAYRA_IYZICO_API_KEY"), secretKey = e("VAYRA_IYZICO_SECRET_KEY");
  if (!apiKey || !secretKey) return null;
  const ortam = e("VAYRA_IYZICO_ORTAM").toLowerCase();
  const mod: OdemeModu = ortam === "canli" ? "canli" : ortam === "sandbox" ? "test" : apiKey.startsWith("sandbox-") ? "test" : "canli";
  if (mod === "test" && uretim() && process.env.VAYRA_DENEME_ODEME !== "1") return null;
  if (mod === "canli" && apiKey.startsWith("sandbox-")) return null;
  return { apiKey, secretKey, mod, taban: yerelTaban("iyzico") ?? (mod === "test" ? "https://sandbox-api.iyzipay.com" : "https://api.iyzipay.com") };
}

export function stripeAyar(): StripeAyar | null {
  const secretKey = e("VAYRA_STRIPE_SECRET_KEY"), webhookSecret = e("VAYRA_STRIPE_WEBHOOK_SECRET");
  if (!/^(sk|rk)_(test|live)_/.test(secretKey)) return null;
  // Webhook sırrı olmadan Stripe'ın sunucu bildirimleri doğrulanamaz: abonelik yenilemesi ve iptali kaçar. Satış açılmaz.
  if (!webhookSecret.startsWith("whsec_")) return null;
  const mod: OdemeModu = /_live_/.test(secretKey) ? "canli" : "test";
  if (mod === "test" && uretim() && process.env.VAYRA_DENEME_ODEME !== "1") return null;
  return { secretKey, webhookSecret, mod, taban: yerelTaban("stripe") ?? "https://api.stripe.com" };
}

/** Eksik ya da yanlış ayar için yöneticiye gösterilecek uyarılar (değerler dönmez). */
export function ayarUyarilari(): string[] {
  const l: string[] = [];
  const ik = e("VAYRA_IYZICO_API_KEY"), is = e("VAYRA_IYZICO_SECRET_KEY");
  if ((ik && !is) || (!ik && is)) l.push("iyzico için API anahtarı ve gizli anahtar birlikte tanımlanmalı.");
  if (ik && is && !iyzicoAyar()) l.push(uretim() && ik.startsWith("sandbox-") ? "Üretimde iyzico sandbox anahtarıyla satış açılmaz." : "iyzico anahtarları ortamla uyuşmuyor (VAYRA_IYZICO_ORTAM).");
  const sk = e("VAYRA_STRIPE_SECRET_KEY");
  if (sk && !/^(sk|rk)_(test|live)_/.test(sk)) l.push("Stripe gizli anahtarı sk_live_ ya da sk_test_ ile başlar.");
  if (sk && !e("VAYRA_STRIPE_WEBHOOK_SECRET").startsWith("whsec_")) l.push("Stripe webhook imza sırrı (whsec_) olmadan Stripe ile satış açılmaz.");
  if (sk && /_test_/.test(sk) && uretim() && process.env.VAYRA_DENEME_ODEME !== "1") l.push("Üretimde Stripe test anahtarıyla satış açılmaz.");
  return l;
}

/** Bu para birimi için sağlayıcı: TRY önce iyzico (taksit), USD önce Stripe; biri yoksa diğeri. Hiçbiri yoksa deneme (izinliyse). */
export function saglayiciSec(para: Para): SaglayiciKimligi | null {
  const iy = !!iyzicoAyar(), st = !!stripeAyar();
  if (para === "TRY") return iy ? "iyzico" : st ? "stripe" : !iy && !st && denemeAcik() ? "deneme" : null;
  return st ? "stripe" : iy ? "iyzico" : !iy && !st && denemeAcik() ? "deneme" : null;
}

export function saglayiciModu(s: SaglayiciKimligi): OdemeModu {
  if (s === "iyzico") return iyzicoAyar()?.mod ?? "test";
  if (s === "stripe") return stripeAyar()?.mod ?? "test";
  return "test";
}

export function odemeDurumu(): OdemeDurumu {
  const iy = iyzicoAyar(), st = stripeAyar();
  const deneme = !iy && !st && denemeAcik();
  const paralar: Para[] = iy || st || deneme ? ["TRY", ...(st || iy ? (["USD"] as Para[]) : [])] : [];
  return { altyapi: !!(iy || st || deneme), saglayicilar: { iyzico: iy?.mod ?? null, stripe: st?.mod ?? null }, deneme, paralar, efatura: false };
}
