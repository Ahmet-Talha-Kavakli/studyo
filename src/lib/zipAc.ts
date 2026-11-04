import { inflateRawSync } from "zlib";

/**
 * Küçük ZIP okuyucu (yalnız sunucu). Merkez dizinden dosyaları çıkarır; "stored" (0) ve
 * "deflate" (8) sıkıştırmayı destekler — sağlayıcıların döndürdüğü stem arşivleri için yeterli.
 */
export function zipAc(veri: Buffer): { ad: string; bayt: Buffer }[] {
  // Merkez dizin sonu (EOCD) imzası: 0x06054b50 — sondan geriye aranır.
  let eocd = -1;
  for (let i = veri.length - 22; i >= Math.max(0, veri.length - 65557); i--) {
    if (veri.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("Geçersiz ZIP arşivi.");
  const adet = veri.readUInt16LE(eocd + 10);
  let p = veri.readUInt32LE(eocd + 16);
  const cikti: { ad: string; bayt: Buffer }[] = [];
  for (let n = 0; n < adet; n++) {
    if (veri.readUInt32LE(p) !== 0x02014b50) throw new Error("Bozuk ZIP merkez dizini.");
    const yontem = veri.readUInt16LE(p + 10);
    const sikisik = veri.readUInt32LE(p + 20);
    const adUz = veri.readUInt16LE(p + 28), ekUz = veri.readUInt16LE(p + 30), notUz = veri.readUInt16LE(p + 32);
    const yerel = veri.readUInt32LE(p + 42);
    const ad = veri.subarray(p + 46, p + 46 + adUz).toString("utf8");
    p += 46 + adUz + ekUz + notUz;
    if (ad.endsWith("/")) continue;
    const yAdUz = veri.readUInt16LE(yerel + 26), yEkUz = veri.readUInt16LE(yerel + 28);
    const bas = yerel + 30 + yAdUz + yEkUz;
    const ham = veri.subarray(bas, bas + sikisik);
    if (yontem === 0) cikti.push({ ad, bayt: Buffer.from(ham) });
    else if (yontem === 8) cikti.push({ ad, bayt: inflateRawSync(ham) });
    else throw new Error(`Desteklenmeyen ZIP sıkıştırması (${yontem}).`);
  }
  return cikti;
}
