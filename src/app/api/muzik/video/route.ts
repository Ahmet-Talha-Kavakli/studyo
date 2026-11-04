import { NextRequest, NextResponse } from "next/server";
import { videodanMuzik } from "@/lib/saglayicilar/muzik";
import { icerikDenetle } from "@/lib/moderasyon";

export const runtime = "nodejs";

const EN_FAZLA_MB = 200;

/** Videodan müzik (multipart): videos[] (en çok 10, toplam 200 MB), aciklama, etiketler (JSON), model, efekt, ayriKanal, sesReferans, c2pa, bicim. */
export async function POST(req: NextRequest) {
  if (!process.env.ELEVENLABS_API_KEY) return NextResponse.json({ ok: false, hata: "Videodan müzik için müzik sağlayıcısı bağlantısı gerekli." }, { status: 503 });
  const f = await req.formData().catch(() => null);
  if (!f) return NextResponse.json({ ok: false, hata: "Geçersiz istek." }, { status: 400 });
  const videolar = f.getAll("videos").filter((v): v is File => v instanceof Blob);
  if (!videolar.length) return NextResponse.json({ ok: false, hata: "Video gönderilmedi." }, { status: 400 });
  if (videolar.length > 10) return NextResponse.json({ ok: false, hata: "En fazla 10 video." }, { status: 400 });
  if (videolar.reduce((n, v) => n + v.size, 0) > EN_FAZLA_MB * 1024 * 1024) return NextResponse.json({ ok: false, hata: `Videolar toplam en fazla ${EN_FAZLA_MB} MB olabilir.` }, { status: 413 });
  const aciklama = String(f.get("aciklama") ?? "");
  let etiketler: string[] = [];
  try { etiketler = (JSON.parse(String(f.get("etiketler") ?? "[]")) as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 10); } catch { /* boş */ }
  const d = icerikDenetle([aciklama, ...etiketler].join("\n"));
  if (!d.izin) return NextResponse.json({ ok: false, hata: d.mesaj }, { status: 422 });
  const evet = (a: string) => f.get(a) === "true";
  try {
    const s = await videodanMuzik(videolar, { aciklama, etiketler, model: String(f.get("model") ?? ""), efekt: evet("efekt"), ayriKanal: evet("ayriKanal"), sesReferans: evet("sesReferans"), c2pa: evet("c2pa"), bicim: String(f.get("bicim") ?? "") });
    return NextResponse.json({ ok: true, ...s });
  } catch (e) {
    return NextResponse.json({ ok: false, hata: String(e instanceof Error ? e.message : e).slice(0, 300) }, { status: 502 });
  }
}
