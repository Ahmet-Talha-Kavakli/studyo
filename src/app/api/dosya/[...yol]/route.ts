import { NextRequest, NextResponse } from "next/server";
import { open, stat } from "fs/promises";
import path from "path";
import { DEPO_KOK, MIME } from "@/lib/dosyaDepo";

export const runtime = "nodejs";

/** Depodaki üretim dosyasını sunar. Range desteklidir (ses/videoda ileri-geri sarma için gerekli). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ yol: string[] }> }) {
  const { yol } = await params;
  // Yalnız <klasör>/<uuid>.<uzantı> biçimi; dizin dışına çıkış (../) mümkün değil.
  if (yol.length !== 2 || !/^[a-z]+$/.test(yol[0]) || !/^[0-9a-f-]{36}\.[a-z0-9]{2,4}$/.test(yol[1])) {
    return new NextResponse("Bulunamadı", { status: 404 });
  }
  const dosya = path.join(DEPO_KOK, yol[0], yol[1]);
  let boyut: number;
  try { boyut = (await stat(dosya)).size; } catch { return new NextResponse("Bulunamadı", { status: 404 }); }
  const tip = MIME[yol[1].split(".").pop()!] ?? "application/octet-stream";
  // CSP: depodaki SVG gibi belgeler betik çalıştıramaz (yalnız görüntülenir).
  const ortak = { "Content-Type": tip, "Accept-Ranges": "bytes", "Cache-Control": "private, max-age=31536000, immutable", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:", "X-Content-Type-Options": "nosniff" };

  const aralik = req.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  let bas = 0, son = boyut - 1, durum = 200;
  if (aralik) {
    bas = aralik[1] ? Number(aralik[1]) : Math.max(0, boyut - Number(aralik[2]));
    son = aralik[1] && aralik[2] ? Math.min(Number(aralik[2]), boyut - 1) : boyut - 1;
    if (bas > son || bas >= boyut) {
      return new NextResponse(null, { status: 416, headers: { ...ortak, "Content-Range": `bytes */${boyut}` } });
    }
    durum = 206;
  }
  const uzunluk = son - bas + 1;
  const fh = await open(dosya, "r");
  const tampon = Buffer.alloc(uzunluk);
  try { await fh.read(tampon, 0, uzunluk, bas); } finally { await fh.close(); }
  return new NextResponse(new Uint8Array(tampon), {
    status: durum,
    headers: { ...ortak, "Content-Length": String(uzunluk), ...(durum === 206 ? { "Content-Range": `bytes ${bas}-${son}/${boyut}` } : {}) },
  });
}
