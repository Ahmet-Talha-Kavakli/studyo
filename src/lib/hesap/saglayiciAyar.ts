import "server-only";
import type { SaglayiciKimligi } from "./tipler";

/**
 * Sosyal giriş sağlayıcılarının sunucu ayarları (ortam değişkenleri). Tanımlı değilse sağlayıcı "kurulu değil"
 * sayılır ve arayüz bunu açıkça söyler; sahte giriş yapılmaz.
 *
 *  Google:    VAYRA_GOOGLE_CLIENT_ID, VAYRA_GOOGLE_CLIENT_SECRET
 *  Microsoft: VAYRA_MICROSOFT_CLIENT_ID, VAYRA_MICROSOFT_CLIENT_SECRET, VAYRA_MICROSOFT_TENANT (varsayılan common)
 *  Apple:     VAYRA_APPLE_CLIENT_ID (Services ID), VAYRA_APPLE_TEAM_ID, VAYRA_APPLE_KEY_ID, VAYRA_APPLE_PRIVATE_KEY (.p8 içeriği)
 * Yönlendirme adresi: <kök>/api/hesap/oauth/<sağlayıcı>/donus
 */
const e = (k: string) => process.env[k]?.trim() || "";

export function saglayiciKurulu(s: SaglayiciKimligi): boolean {
  if (s === "google") return !!(e("VAYRA_GOOGLE_CLIENT_ID") && e("VAYRA_GOOGLE_CLIENT_SECRET"));
  if (s === "microsoft") return !!(e("VAYRA_MICROSOFT_CLIENT_ID") && e("VAYRA_MICROSOFT_CLIENT_SECRET"));
  return !!(e("VAYRA_APPLE_CLIENT_ID") && e("VAYRA_APPLE_TEAM_ID") && e("VAYRA_APPLE_KEY_ID") && e("VAYRA_APPLE_PRIVATE_KEY"));
}

export const ortam = e;
