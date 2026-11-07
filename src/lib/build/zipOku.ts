"use client";

/**
 * Bağımlılıksız zip okuyucu (tarayıcı): merkez dizini okur, "store" ve "deflate" kayıtlarını DecompressionStream
 * ile açar. Yalnız metin dosyaları döner (html, css, js, json, svg, md, txt, webmanifest, xml); ikili dosyalar
 * (görsel, font) atlanır ve sayısı bildirilir. macOS çöpleri (__MACOSX, .DS_Store) yok sayılır.
 */
const METIN = /\.(html?|css|m?js|json|svg|md|txt|webmanifest|xml)$/i;

async function ac(veri: Uint8Array, yontem: number): Promise<Uint8Array> {
  if (yontem === 0) return veri;
  if (yontem !== 8) throw new Error("Desteklenmeyen sıkıştırma");
  const ds = new DecompressionStream("deflate-raw");
  const akis = new Blob([veri.slice().buffer as ArrayBuffer]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(akis).arrayBuffer());
}

export async function zipOku(dosya: File): Promise<{ dosyalar: Record<string, string>; atlanan: number }> {
  const b = new Uint8Array(await dosya.arrayBuffer());
  const v = new DataView(b.buffer);
  // Merkez dizin sonu kaydını sondan ara.
  let son = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65_557); i--) if (v.getUint32(i, true) === 0x06054b50) { son = i; break; }
  if (son < 0) throw new Error("Bu bir zip dosyası değil.");
  const adet = v.getUint16(son + 10, true);
  let o = v.getUint32(son + 16, true);
  const coz = new TextDecoder();
  const dosyalar: Record<string, string> = {};
  let atlanan = 0;
  for (let n = 0; n < adet; n++) {
    if (v.getUint32(o, true) !== 0x02014b50) throw new Error("Zip dizini bozuk.");
    const yontem = v.getUint16(o + 10, true);
    const boyut = v.getUint32(o + 20, true);
    const adUz = v.getUint16(o + 28, true), ekUz = v.getUint16(o + 30, true), yorumUz = v.getUint16(o + 32, true);
    const yerel = v.getUint32(o + 42, true);
    const ad = coz.decode(b.subarray(o + 46, o + 46 + adUz));
    o += 46 + adUz + ekUz + yorumUz;
    if (ad.endsWith("/") || ad.startsWith("__MACOSX/") || ad.endsWith(".DS_Store")) continue;
    if (!METIN.test(ad)) { atlanan++; continue; }
    const lAdUz = v.getUint16(yerel + 26, true), lEkUz = v.getUint16(yerel + 28, true);
    const bas = yerel + 30 + lAdUz + lEkUz;
    try { dosyalar[ad.replace(/^\.\//, "")] = coz.decode(await ac(b.subarray(bas, bas + boyut), yontem)); } catch { atlanan++; }
  }
  return { dosyalar, atlanan };
}
