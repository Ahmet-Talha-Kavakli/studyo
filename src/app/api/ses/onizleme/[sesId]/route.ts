import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Hazır sesin resmi örnek kaydına yönlendirir. Ses listesi herkese açıktır; anahtar gerekmez. */
export async function GET(_: Request, { params }: { params: Promise<{ sesId: string }> }) {
  const { sesId } = await params;
  if (!/^[A-Za-z0-9]{10,40}$/.test(sesId)) return NextResponse.json({ ok: false, hata: "Geçersiz ses." }, { status: 400 });
  const anahtar = process.env.ELEVENLABS_API_KEY;
  try {
    const yanit = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: anahtar ? { "xi-api-key": anahtar } : {}, next: { revalidate: 86400 },
    });
    if (!yanit.ok) throw new Error(String(yanit.status));
    const { voices } = (await yanit.json()) as { voices: { voice_id: string; preview_url?: string }[] };
    const url = voices.find((v) => v.voice_id === sesId)?.preview_url;
    if (!url) return NextResponse.json({ ok: false, hata: "Bu sesin örneği yok." }, { status: 404 });
    return NextResponse.redirect(url, 302);
  } catch {
    return NextResponse.json({ ok: false, hata: "Ses örneğine ulaşılamadı." }, { status: 502 });
  }
}
