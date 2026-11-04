/**
 * İstemci tarafı biçim doğrulamaları — resmi algoritmalar.
 * Sunucu doğrulamasının (NVİ, banka) yerine geçmez; hatalı girişi erkenden yakalar.
 */

/** TR IBAN: "TR" + 24 hane, ISO 13616 mod-97 kontrolü. */
export function ibanGecerli(ham: string): boolean {
  const iban = ham.replace(/\s/g, "").toUpperCase();
  if (!/^TR\d{24}$/.test(iban)) return false;
  const yeniden = iban.slice(4) + iban.slice(0, 4);
  const sayisal = yeniden.replace(/[A-Z]/g, (h) => String(h.charCodeAt(0) - 55));
  let kalan = 0;
  for (const c of sayisal) kalan = (kalan * 10 + Number(c)) % 97;
  return kalan === 1;
}

/** T.C. kimlik numarası: 11 hane, ilk hane 0 değil, 10. ve 11. hane kontrolleri. */
export function tcknGecerli(tckn: string): boolean {
  if (!/^[1-9]\d{10}$/.test(tckn)) return false;
  const d = tckn.split("").map(Number);
  const tek = d[0] + d[2] + d[4] + d[6] + d[8];
  const cift = d[1] + d[3] + d[5] + d[7];
  const h10 = (((tek * 7 - cift) % 10) + 10) % 10;
  const h11 = d.slice(0, 10).reduce((a, b) => a + b, 0) % 10;
  return d[9] === h10 && d[10] === h11;
}

/** Papara hesap numarası: 10 hane. */
export const paparaGecerli = (no: string) => /^\d{10}$/.test(no.replace(/\s/g, ""));

/** Kullanıcı adından davet kodu: Türkçe harfler sadeleşir, 3–16 karakter. */
export function kodUret(kaynak: string): string {
  const sade = kaynak.toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşü]/g, (h) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" })[h]!)
    .replace(/[^a-z0-9]/g, "");
  return (sade || "vayra").slice(0, 16).padEnd(3, "0");
}
