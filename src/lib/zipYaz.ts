/**
 * Sıkıştırmasız (STORE) ZIP yazıcı — tarayıcıda çalışır, bağımlılık yok. Görseller zaten sıkıştırılmış
 * olduğundan (webp/png/jpg) DEFLATE ek kazanç sağlamaz; arşiv yalnız toplu indirme içindir.
 */
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(b: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export async function zipOlustur(dosyalar: { ad: string; veri: Blob }[]): Promise<Blob> {
  const kodla = new TextEncoder();
  const parcalar: BlobPart[] = [];
  const merkez: Uint8Array[] = [];
  let ofset = 0;
  const z = new Date();
  const dosZaman = ((z.getHours() << 11) | (z.getMinutes() << 5) | (z.getSeconds() >> 1)) & 0xffff;
  const dosTarih = (((z.getFullYear() - 1980) << 9) | ((z.getMonth() + 1) << 5) | z.getDate()) & 0xffff;
  for (const d of dosyalar) {
    const bayt = new Uint8Array(await d.veri.arrayBuffer());
    const ad = kodla.encode(d.ad);
    const crc = crc32(bayt);
    const yerel = new DataView(new ArrayBuffer(30));
    yerel.setUint32(0, 0x04034b50, true); yerel.setUint16(4, 20, true); yerel.setUint16(6, 0x0800, true); yerel.setUint16(8, 0, true);
    yerel.setUint16(10, dosZaman, true); yerel.setUint16(12, dosTarih, true); yerel.setUint32(14, crc, true);
    yerel.setUint32(18, bayt.length, true); yerel.setUint32(22, bayt.length, true); yerel.setUint16(26, ad.length, true); yerel.setUint16(28, 0, true);
    parcalar.push(yerel.buffer, ad, bayt);
    const m = new DataView(new ArrayBuffer(46));
    m.setUint32(0, 0x02014b50, true); m.setUint16(4, 20, true); m.setUint16(6, 20, true); m.setUint16(8, 0x0800, true); m.setUint16(10, 0, true);
    m.setUint16(12, dosZaman, true); m.setUint16(14, dosTarih, true); m.setUint32(16, crc, true); m.setUint32(20, bayt.length, true); m.setUint32(24, bayt.length, true);
    m.setUint16(28, ad.length, true); m.setUint32(42, ofset, true);
    const mb = new Uint8Array(46 + ad.length); mb.set(new Uint8Array(m.buffer)); mb.set(ad, 46);
    merkez.push(mb);
    ofset += 30 + ad.length + bayt.length;
  }
  const merkezBoy = merkez.reduce((n, x) => n + x.length, 0);
  const son = new DataView(new ArrayBuffer(22));
  son.setUint32(0, 0x06054b50, true); son.setUint16(8, dosyalar.length, true); son.setUint16(10, dosyalar.length, true);
  son.setUint32(12, merkezBoy, true); son.setUint32(16, ofset, true);
  return new Blob([...parcalar, ...merkez, son.buffer], { type: "application/zip" });
}

/** URL listesini indirip tek ZIP olarak kaydettirir. Başarısız olan dosyalar atlanır. */
export async function zipIndir(arsivAdi: string, ogeler: { ad: string; url: string }[]): Promise<{ eklenen: number; atlanan: number }> {
  const dosyalar: { ad: string; veri: Blob }[] = [];
  let atlanan = 0;
  for (const o of ogeler) {
    try {
      const r = await fetch(o.url);
      if (!r.ok) throw new Error();
      const b = await r.blob();
      const uz = b.type.includes("png") ? "png" : b.type.includes("jpeg") ? "jpg" : b.type.includes("webp") ? "webp" : (o.url.split("?")[0].split(".").pop() || "bin");
      dosyalar.push({ ad: `${o.ad}.${uz}`, veri: b });
    } catch { atlanan++; }
  }
  if (dosyalar.length) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(await zipOlustur(dosyalar));
    a.download = `${arsivAdi}.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  return { eklenen: dosyalar.length, atlanan };
}
