import { NextRequest, NextResponse } from "next/server";
import { sesRemix } from "@/lib/saglayicilar/eleven";

export const runtime = "nodejs";

/** Var olan sesi yeniden yorumla: { sesId, aciklama, metin?, gelistir?, loudness?, guidanceScale?, seed? } → 3 önizleme. */
export async function POST(req: NextRequest) {
  if (!process.env.ELEVENLABS_API_KEY) return NextResponse.json({ ok: false, hata: "Ses sağlayıcısı bağlı değil; remiks yapılamıyor." }, { status: 503 });
  const g = (await req.json().catch(() => ({}))) as { sesId?: string; aciklama?: string; metin?: string; gelistir?: boolean; loudness?: number; guidanceScale?: number; seed?: number };
  const sesId = g.sesId?.trim() ?? "";
  if (!/^[A-Za-z0-9_-]{4,64}$/.test(sesId)) return NextResponse.json({ ok: false, hata: "Geçersiz ses kimliği." }, { status: 400 });
  const aciklama = g.aciklama?.trim() ?? "";
  if (aciklama.length < 5) return NextResponse.json({ ok: false, hata: "Sesin nasıl değişeceğini anlat (en az 5 karakter)." }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, ...(await sesRemix(sesId, aciklama, g.metin?.trim(), g.gelistir, { loudness: g.loudness, guidanceScale: g.guidanceScale, seed: g.seed })) });
  } catch (e) {
    return NextResponse.json({ ok: false, hata: String(e instanceof Error ? e.message : e).slice(0, 300) }, { status: 502 });
  }
}
