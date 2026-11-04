import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { DEPO_KOK, MIME } from "@/lib/dosyaDepo";
import { stemAyir } from "@/lib/saglayicilar/muzik";
import { MUZIK_KAYNAK_MB } from "@/lib/muzikVeri";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Stem ayırma: { url: "/api/dosya/..." } (kitaplıktaki parça) ya da { kaynak: dataURL, ad }. */
export async function POST(req: NextRequest) {
  if (!process.env.ELEVENLABS_API_KEY) return NextResponse.json({ ok: false, hata: "Stem ayırma için müzik sağlayıcısı bağlantısı gerekli." }, { status: 503 });
  const g = (await req.json().catch(() => ({}))) as { url?: string; kaynak?: string; ad?: string };
  let blob: Blob; let ad = g.ad ?? "parca.mp3";
  try {
    if (g.url) {
      const m = g.url.match(/^\/api\/dosya\/([a-z]+)\/([0-9a-f-]{36}\.([a-z0-9]{2,4}))$/);
      if (!m) return NextResponse.json({ ok: false, hata: "Geçersiz kaynak." }, { status: 400 });
      blob = new Blob([await readFile(path.join(DEPO_KOK, m[1], m[2]))], { type: MIME[m[3]] ?? "audio/mpeg" });
      ad = m[2];
    } else if (g.kaynak?.startsWith("data:")) {
      const [bas, veri] = g.kaynak.split(",");
      const bayt = Buffer.from(veri, "base64");
      if (bayt.length > MUZIK_KAYNAK_MB * 1024 * 1024) return NextResponse.json({ ok: false, hata: `Dosya en fazla ${MUZIK_KAYNAK_MB} MB olabilir.` }, { status: 413 });
      blob = new Blob([bayt], { type: bas.match(/data:([^;]+)/)?.[1] ?? "audio/mpeg" });
    } else return NextResponse.json({ ok: false, hata: "Ayrılacak parça gönderilmedi." }, { status: 400 });
    return NextResponse.json({ ok: true, stemler: await stemAyir(blob, ad) });
  } catch (e) {
    return NextResponse.json({ ok: false, hata: String(e instanceof Error ? e.message : e).slice(0, 300) }, { status: 502 });
  }
}
