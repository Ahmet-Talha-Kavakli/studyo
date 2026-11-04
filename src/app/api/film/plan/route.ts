import { NextRequest, NextResponse } from "next/server";
import { istemHazir, filmPlani } from "@/lib/saglayicilar/istem";
import { icerikDenetle } from "@/lib/moderasyon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Film planlayıcısı (Gemini) bağlı mı. Bağlı değilse istemci türün perde şablonunu kullanır. */
export function GET() {
  return NextResponse.json({ hazir: istemHazir() });
}

/** { logline, tur, ton, hedefDk, bolumSayisi, cekimBasina } → { bolumler } */
export async function POST(req: NextRequest) {
  if (!istemHazir()) return NextResponse.json({ ok: false, hata: "Planlayıcı (Gemini) bağlı değil." }, { status: 503 });
  const g = (await req.json().catch(() => ({}))) as { logline?: string; tur?: string; ton?: string; hedefDk?: number; bolumSayisi?: number; cekimBasina?: number };
  const logline = (g.logline ?? "").trim();
  if (logline.length < 8) return NextResponse.json({ ok: false, hata: "Hikâyeyi bir iki cümleyle anlat." }, { status: 400 });
  const d = icerikDenetle(logline);
  if (!d.izin) return NextResponse.json({ ok: false, hata: d.mesaj }, { status: 422 });
  try {
    const bolumler = await filmPlani({ logline, tur: g.tur ?? "kısa film", ton: g.ton ?? "sinematik", hedefDk: Math.min(60, Math.max(1, g.hedefDk ?? 3)), bolumSayisi: Math.min(12, Math.max(3, g.bolumSayisi ?? 5)), cekimBasina: Math.min(8, Math.max(2, g.cekimBasina ?? 4)) });
    return NextResponse.json({ ok: true, bolumler });
  } catch (e) {
    return NextResponse.json({ ok: false, hata: e instanceof Error ? e.message : "Plan oluşturulamadı." }, { status: 502 });
  }
}
