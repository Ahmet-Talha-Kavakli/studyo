/** Bağımlılıksız ZIP (sıkıştırmasız "store"): proje dosyalarını tek arşiv olarak indirmek için. */

const TABLO = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(b: Uint8Array) { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = TABLO[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

export function zipOlustur(dosyalar: Record<string, string>, kok = "proje"): Blob {
  const kod = new TextEncoder();
  const parcalar: Uint8Array[] = [];
  const merkez: Uint8Array[] = [];
  let ofset = 0;
  const z = new Date();
  const saat = ((z.getHours() << 11) | (z.getMinutes() << 5) | (z.getSeconds() >> 1)) & 0xffff;
  const tarih = (((z.getFullYear() - 1980) << 9) | ((z.getMonth() + 1) << 5) | z.getDate()) & 0xffff;
  for (const [yol, icerik] of Object.entries(dosyalar)) {
    const ad = kod.encode(`${kok}/${yol}`);
    const veri = kod.encode(icerik);
    const crc = crc32(veri);
    const yerel = new DataView(new ArrayBuffer(30));
    yerel.setUint32(0, 0x04034b50, true); yerel.setUint16(4, 20, true); yerel.setUint16(6, 0x0800, true); yerel.setUint16(8, 0, true);
    yerel.setUint16(10, saat, true); yerel.setUint16(12, tarih, true); yerel.setUint32(14, crc, true);
    yerel.setUint32(18, veri.length, true); yerel.setUint32(22, veri.length, true); yerel.setUint16(26, ad.length, true); yerel.setUint16(28, 0, true);
    parcalar.push(new Uint8Array(yerel.buffer), ad, veri);
    const m = new DataView(new ArrayBuffer(46));
    m.setUint32(0, 0x02014b50, true); m.setUint16(4, 20, true); m.setUint16(6, 20, true); m.setUint16(8, 0x0800, true); m.setUint16(10, 0, true);
    m.setUint16(12, saat, true); m.setUint16(14, tarih, true); m.setUint32(16, crc, true); m.setUint32(20, veri.length, true); m.setUint32(24, veri.length, true);
    m.setUint16(28, ad.length, true); m.setUint32(42, ofset, true);
    merkez.push(new Uint8Array(m.buffer), ad);
    ofset += 30 + ad.length + veri.length;
  }
  const merkezBoyut = merkez.reduce((t, x) => t + x.length, 0);
  const son = new DataView(new ArrayBuffer(22));
  son.setUint32(0, 0x06054b50, true); son.setUint16(8, Object.keys(dosyalar).length, true); son.setUint16(10, Object.keys(dosyalar).length, true);
  son.setUint32(12, merkezBoyut, true); son.setUint32(16, ofset, true);
  return new Blob([...parcalar, ...merkez, new Uint8Array(son.buffer)].map((x) => x.slice().buffer as ArrayBuffer), { type: "application/zip" });
}
