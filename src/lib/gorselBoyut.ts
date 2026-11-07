import "server-only";
import { open } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";

/** PNG, JPEG, WebP ve GIF başlığından piksel boyutu (dosyanın tamamı çözülmez). */
export function boyutCoz(b: Buffer): { w: number; h: number } | null {
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b.length > 10 && b.toString("latin1", 0, 3) === "GIF") return { w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
  if (b.length > 30 && b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP") {
    const t = b.toString("latin1", 12, 16);
    if (t === "VP8X") return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    if (t === "VP8L") { const x = b.readUInt32LE(21); return { w: (x & 0x3fff) + 1, h: ((x >> 14) & 0x3fff) + 1 }; }
    if (t === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length - 9) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}

/** Depodaki (/api/dosya/<klasör>/<ad>) görselin boyutu; okunamazsa null. İlk 256 KB okunur. */
export async function depoGorselBoyutu(url: string): Promise<{ w: number; h: number } | null> {
  const m = url.match(/^(?:https?:\/\/[^/]+)?\/api\/dosya\/([a-z]+)\/([0-9a-f-]{36}\.[a-z0-9]{2,4})$/);
  if (!m) return null;
  let fh;
  try {
    fh = await open(path.join(DEPO_KOK, m[1], m[2]), "r");
    const b = Buffer.alloc(262_144);
    const { bytesRead } = await fh.read(b, 0, b.length, 0);
    const s = boyutCoz(b.subarray(0, bytesRead));
    return s && s.w > 0 && s.h > 0 ? s : null;
  } catch { return null; } finally { await fh?.close(); }
}
