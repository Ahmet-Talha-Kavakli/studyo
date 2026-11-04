import { NextRequest, NextResponse } from "next/server";
import { dosyaKaydet } from "@/lib/dosyaDepo";

export const runtime = "nodejs";

const IZINLI = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_MB = 12;

/**
 * Element referans görselini sunucu deposuna yazar: { dataUrl } → { url }.
 * Görseller tarayıcı deposunu (localStorage) doldurmasın diye istemcide yalnız adres tutulur.
 */
export async function POST(req: NextRequest) {
  const g = (await req.json().catch(() => ({}))) as { dataUrl?: string };
  const m = g.dataUrl?.match(/^data:([^;]+);base64,(.+)$/);
  if (!m || !IZINLI.has(m[1])) return NextResponse.json({ ok: false, hata: "PNG, JPG ya da WebP görsel gönder." }, { status: 400 });
  const bayt = Buffer.from(m[2], "base64");
  if (bayt.length > MAX_MB * 1024 * 1024) return NextResponse.json({ ok: false, hata: `Görsel en fazla ${MAX_MB} MB olabilir.` }, { status: 413 });
  return NextResponse.json({ ok: true, url: await dosyaKaydet("element", bayt, m[1]) });
}
