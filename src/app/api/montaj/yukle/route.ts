import { NextRequest, NextResponse } from "next/server";
import { dosyaKaydet, type DepoKlasor } from "@/lib/dosyaDepo";

export const runtime = "nodejs";

/** Türüne göre izinli dosya tipleri ve depo klasörü. */
const IZINLI: Record<string, DepoKlasor> = {
  "video/mp4": "video", "video/webm": "video", "video/quicktime": "video",
  "audio/mpeg": "ses", "audio/mp3": "ses", "audio/wav": "ses", "audio/x-wav": "ses", "audio/ogg": "ses", "audio/webm": "ses", "audio/mp4": "ses",
  "image/png": "gorsel", "image/jpeg": "gorsel", "image/webp": "gorsel",
};
const MAX_MB = 300;

/**
 * Montaj Stüdyosu medyası: kullanıcının yüklediği video/ses/görsel ve tarayıcıda dışa aktarılan
 * montaj videosu. Gövde ham dosyadır (Content-Type dosyanın türü). → { ok, url }
 */
export async function POST(req: NextRequest) {
  const tip = (req.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  const klasor = IZINLI[tip];
  if (!klasor) return NextResponse.json({ ok: false, hata: "Desteklenmeyen dosya türü. MP4, WebM, MOV, MP3, WAV, PNG, JPG ya da WebP yükle." }, { status: 415 });
  const uzunluk = Number(req.headers.get("content-length") ?? 0);
  if (uzunluk > MAX_MB * 1024 * 1024) return NextResponse.json({ ok: false, hata: `Dosya en fazla ${MAX_MB} MB olabilir.` }, { status: 413 });
  const bayt = await req.arrayBuffer();
  if (!bayt.byteLength) return NextResponse.json({ ok: false, hata: "Dosya boş." }, { status: 400 });
  if (bayt.byteLength > MAX_MB * 1024 * 1024) return NextResponse.json({ ok: false, hata: `Dosya en fazla ${MAX_MB} MB olabilir.` }, { status: 413 });
  return NextResponse.json({ ok: true, url: await dosyaKaydet(klasor, bayt, tip === "audio/mp3" ? "audio/mpeg" : tip) });
}
