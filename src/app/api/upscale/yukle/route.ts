import { NextRequest, NextResponse } from "next/server";
import { dosyaKaydet } from "@/lib/dosyaDepo";
import { GIRDI_MAX_MB } from "@/lib/upscaleVeri";

export const runtime = "nodejs";

const GORSEL = new Set(["image/png", "image/jpeg", "image/webp"]);
const VIDEO = new Set(["video/mp4", "video/webm", "video/quicktime"]);

/**
 * Büyütülecek kaynağı (ya da tarayıcıda yerel büyütülmüş sonucu) depoya yazar: multipart `dosya` → { url }.
 * Medya tarayıcı deposuna data URI olarak yazılmaz; istemci yalnız adresi tutar.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const d = form?.get("dosya");
  if (!d || typeof d === "string") return NextResponse.json({ ok: false, hata: "Dosya yok." }, { status: 400 });
  const video = VIDEO.has(d.type);
  if (!video && !GORSEL.has(d.type)) return NextResponse.json({ ok: false, hata: "PNG, JPG, WebP görsel ya da MP4, WebM, MOV video yükle." }, { status: 415 });
  const sinir = (video ? GIRDI_MAX_MB.video : GIRDI_MAX_MB.gorsel) * (form?.get("sonuc") ? 4 : 1);
  if (d.size > sinir * 1024 * 1024) return NextResponse.json({ ok: false, hata: `Dosya en fazla ${sinir} MB olabilir.` }, { status: 413 });
  return NextResponse.json({ ok: true, url: await dosyaKaydet("upscale", await d.arrayBuffer(), d.type) });
}
