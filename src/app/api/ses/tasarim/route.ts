import { NextRequest, NextResponse } from "next/server";
import { sesTasarla } from "@/lib/saglayicilar/eleven";

export const runtime = "nodejs";

/** Metinden ses tasarımı: { aciklama, metin?, gelistir?, loudness?, guidanceScale?, seed? } → 3 önizleme. */
export async function POST(req: NextRequest) {
  if (!process.env.ELEVENLABS_API_KEY) return NextResponse.json({ ok: false, hata: "Ses sağlayıcısı bağlı değil; ses tasarımı yapılamıyor." }, { status: 503 });
  const g = (await req.json().catch(() => ({}))) as { aciklama?: string; metin?: string; gelistir?: boolean; loudness?: number; guidanceScale?: number; seed?: number };
  const aciklama = g.aciklama?.trim() ?? "";
  if (aciklama.length < 20) return NextResponse.json({ ok: false, hata: "Sesi en az 20 karakterle tarif et." }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, ...(await sesTasarla(aciklama, g.metin?.trim(), g.gelistir, { loudness: g.loudness, guidanceScale: g.guidanceScale, seed: g.seed })) });
  } catch (e) {
    return NextResponse.json({ ok: false, hata: String(e instanceof Error ? e.message : e).slice(0, 300) }, { status: 502 });
  }
}
