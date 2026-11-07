/**
 * Tarayıcı tarafı güvenlik yardımcıları: yalnız şifre güç ölçer ve cihaz adı.
 *
 * Şifre özeti, iki adımlı doğrulama sırrı ve yedek kodlar artık tarayıcıda tutulmaz; hepsi sunucuda
 * (src/lib/hesap: scrypt, TOTP, yedek kod özetleri). Bu dosya yalnız arayüzün ölçtüğü şeyleri hesaplar.
 */
import { YAYGIN_SIFRE } from "@/lib/hesap/tipler";

export function sifreGucu(s: string): { puan: 0 | 1 | 2 | 3 | 4; etiket: string; eksikler: string[] } {
  const eksikler: string[] = [];
  if (s.length < 10) eksikler.push("en az 10 karakter");
  if (!/[a-zçğıöşü]/.test(s) || !/[A-ZÇĞİÖŞÜ]/.test(s)) eksikler.push("büyük ve küçük harf");
  if (!/\d/.test(s)) eksikler.push("rakam");
  if (!/[^A-Za-z0-9çğıöşüÇĞİÖŞÜ]/.test(s)) eksikler.push("sembol");
  const yaygin = YAYGIN_SIFRE.test(s);
  let puan = Math.min(4, Math.max(0, 4 - eksikler.length + (s.length >= 14 ? 1 : 0) - (yaygin ? 2 : 0))) as 0 | 1 | 2 | 3 | 4;
  if (s.length < 8) puan = Math.min(puan, 1) as 0 | 1;
  return { puan, etiket: ["Çok zayıf", "Zayıf", "Orta", "Güçlü", "Çok güçlü"][puan], eksikler };
}

/* ── Cihaz ── */

export function cihazBilgisi(ua = typeof navigator !== "undefined" ? navigator.userAgent : "") {
  const tarayici = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Tarayıcı";
  const surum = ua.match(/(?:Edg|OPR|Firefox|Chrome|Version)\/(\d+)/)?.[1];
  const isletim = /Windows NT 10/.test(ua) ? "Windows" : /Windows/.test(ua) ? "Windows" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS X/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /Linux/.test(ua) ? "Linux" : "Bilinmeyen sistem";
  const tur: "masaustu" | "mobil" | "tablet" = /iPad|Tablet/.test(ua) ? "tablet" : /Mobi|iPhone|Android/.test(ua) ? "mobil" : "masaustu";
  return { tarayici: surum ? `${tarayici} ${surum}` : tarayici, isletim, tur };
}
