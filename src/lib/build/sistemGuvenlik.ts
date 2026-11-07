/**
 * Güvenlik denetimi adımının yerel (modelsiz) kalıp denetimleri: TC kimlik no (sağlama), IBAN (mod 97), telefon,
 * e-posta, kart no (Luhn) ve gizli anahtar sızıntısı. Her bulgu için konum ve maskeli örnek döner; maskeleme bulunan
 * parçanın yerine etiket yazar. Uygunsuz içerik denetimi modelle motorda yapılır.
 */
export type GuvenlikTur = "tc" | "iban" | "telefon" | "eposta" | "kart" | "anahtar" | "ozel";
export type Bulgu = { tur: GuvenlikTur; bas: number; son: number; ornek: string };
export const GUVENLIK_ETIKET: Record<GuvenlikTur, string> = {
  tc: "[TC kimlik no gizlendi]", iban: "[IBAN gizlendi]", telefon: "[telefon gizlendi]", eposta: "[e-posta gizlendi]",
  kart: "[kart no gizlendi]", anahtar: "[gizli anahtar gizlendi]", ozel: "[gizlendi]",
};
export const GUVENLIK_AD: Record<GuvenlikTur, string> = { tc: "TC kimlik no", iban: "IBAN", telefon: "Telefon", eposta: "E-posta", kart: "Kart no", anahtar: "Gizli anahtar", ozel: "Özel kalıp" };

const rakam = (s: string) => s.replace(/\D/g, "");
export function tcGecerli(s: string): boolean {
  const d = rakam(s);
  if (!/^[1-9]\d{10}$/.test(d)) return false;
  const n = d.split("").map(Number);
  const tek = n[0] + n[2] + n[4] + n[6] + n[8], cift = n[1] + n[3] + n[5] + n[7];
  if ((((tek * 7 - cift) % 10) + 10) % 10 !== n[9]) return false;
  return n.slice(0, 10).reduce((t, x) => t + x, 0) % 10 === n[10];
}
export function ibanGecerli(s: string): boolean {
  const t = s.replace(/[\s-]/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(t)) return false;
  if (t.startsWith("TR") && t.length !== 26) return false;
  const d = (t.slice(4) + t.slice(0, 4)).replace(/[A-Z]/g, (h) => String(h.charCodeAt(0) - 55));
  let k = 0;
  for (const c of d) k = (k * 10 + Number(c)) % 97;
  return k === 1;
}
export function luhnGecerli(s: string): boolean {
  const d = rakam(s);
  if (d.length < 13 || d.length > 19 || /^(\d)\1+$/.test(d)) return false;
  let t = 0;
  for (let i = 0; i < d.length; i++) { let x = Number(d[d.length - 1 - i]); if (i % 2) { x *= 2; if (x > 9) x -= 9; } t += x; }
  return t % 10 === 0;
}

/** Gizli anahtar kalıpları (yaygın sağlayıcılar ve genel biçimler). */
const ANAHTAR_KALIPLARI: RegExp[] = [
  /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY(?: BLOCK)?-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY(?: BLOCK)?-----/g,
  /\bsk-(?:ant-|proj-|svcacct-|or-v1-)?[A-Za-z0-9_-]{20,}\b/g,
  /\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g,
  /\bAKIA[0-9A-Z]{16}\b/g, /\bASIA[0-9A-Z]{16}\b/g,
  /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g, /\bgithub_pat_[A-Za-z0-9_]{40,}\b/g, /\bglpat-[A-Za-z0-9_-]{20,}\b/g,
  /\bxox[abposr]-[A-Za-z0-9-]{10,}\b/g, /\bAIza[0-9A-Za-z_-]{35}\b/g, /\bya29\.[0-9A-Za-z_-]{20,}\b/g,
  /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/g, /\bhf_[A-Za-z0-9]{30,}\b/g, /\bnpm_[A-Za-z0-9]{36}\b/g,
  /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  /\b(?:bearer|token|api[_-]?key|apikey|secret|password|parola|şifre)\s*[:=]\s*["']?[A-Za-z0-9_\-./+]{12,}["']?/giu,
];

function kalipBul(metin: string, re: RegExp, tur: GuvenlikTur, sina?: (s: string) => boolean): Bulgu[] {
  const o: Bulgu[] = [];
  re.lastIndex = 0;
  for (const m of metin.matchAll(re)) {
    const s = m[0];
    if (sina && !sina(s)) continue;
    o.push({ tur, bas: m.index!, son: m.index! + s.length, ornek: maskeliOrnek(s) });
  }
  return o;
}
/** Bulgu örneği: baştan 2 ve sondan 2 karakter, arası gizli. */
const maskeliOrnek = (s: string) => { const t = s.trim(); return t.length <= 6 ? "••••" : `${t.slice(0, 2)}••••${t.slice(-2)}`; };

export type GuvenlikAyar = { tc?: boolean; iban?: boolean; telefon?: boolean; eposta?: boolean; kart?: boolean; anahtar?: boolean; ozelDesen?: string };
/** Metindeki bulgular (çakışanlardan önce gelen ve uzun olan kalır). */
export function kalipDenetle(metin: string, a: GuvenlikAyar): { bulgular: Bulgu[]; hata?: string } {
  const l: Bulgu[] = [];
  let hata: string | undefined;
  if (a.anahtar) for (const re of ANAHTAR_KALIPLARI) l.push(...kalipBul(metin, re, "anahtar"));
  if (a.eposta) l.push(...kalipBul(metin, /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "eposta"));
  if (a.iban) l.push(...kalipBul(metin, /\b[A-Z]{2}\d{2}(?:[ -]?[A-Z0-9]{4}){2,7}(?:[ -]?[A-Z0-9]{1,4})?\b/g, "iban", ibanGecerli));
  if (a.kart) l.push(...kalipBul(metin, /\b\d(?:[ -]?\d){12,18}\b/g, "kart", luhnGecerli));
  if (a.tc) l.push(...kalipBul(metin, /\b[1-9]\d{10}\b/g, "tc", tcGecerli));
  if (a.telefon) {
    l.push(...kalipBul(metin, /(?<![\d+])(?:\+90[\s-]?|0090[\s-]?|0)?\(?5\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}(?!\d)/g, "telefon"));
    l.push(...kalipBul(metin, /(?<![\d+])(?:\+90[\s-]?|0)\(?[2-4]\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}(?!\d)/g, "telefon"));
    l.push(...kalipBul(metin, /(?<![\w+])\+(?!90)[1-9]\d{0,2}[\s-]?\(?\d{2,4}\)?(?:[\s-]?\d{2,4}){2,4}(?!\d)/g, "telefon", (s) => rakam(s).length >= 9 && rakam(s).length <= 15));
  }
  if (a.ozelDesen?.trim()) {
    try { l.push(...kalipBul(metin, new RegExp(a.ozelDesen, "giu"), "ozel", (s) => s.length > 0)); } catch { hata = "Özel kalıp geçerli bir düzenli ifade değil."; }
  }
  // Önceliğe göre çakışmaları ayıkla: önce başlayan, sonra uzun olan.
  l.sort((x, y) => x.bas - y.bas || y.son - y.bas - (x.son - x.bas));
  const o: Bulgu[] = [];
  for (const b of l) { const son = o.at(-1); if (son && b.bas < son.son) continue; o.push(b); }
  return { bulgular: o, hata };
}

/** Bulguların yerine etiket yazar. */
export function maskeUygula(metin: string, bulgular: Bulgu[]): string {
  let o = "", i = 0;
  for (const b of [...bulgular].sort((x, y) => x.bas - y.bas)) { o += metin.slice(i, b.bas) + GUVENLIK_ETIKET[b.tur]; i = b.son; }
  return o + metin.slice(i);
}
