import { NextResponse } from "next/server";
import { sesSil } from "@/lib/saglayicilar/eleven";

export const runtime = "nodejs";

/** Kullanıcının kendi sesini (klon ya da tasarım) sağlayıcıdan siler. */
export async function DELETE(_: Request, { params }: { params: Promise<{ sesId: string }> }) {
  const { sesId } = await params;
  if (!/^[A-Za-z0-9]{10,40}$/.test(sesId)) return NextResponse.json({ ok: false, hata: "Geçersiz ses." }, { status: 400 });
  if (!process.env.ELEVENLABS_API_KEY) return NextResponse.json({ ok: false, hata: "Ses sağlayıcısı bağlı değil." }, { status: 503 });
  try { await sesSil(sesId); return NextResponse.json({ ok: true }); }
  catch (e) { return NextResponse.json({ ok: false, hata: String(e instanceof Error ? e.message : e).slice(0, 300) }, { status: 502 }); }
}
