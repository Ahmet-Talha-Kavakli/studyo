import { NextRequest, NextResponse } from "next/server";
import { muzikUret, type MuzikIstek } from "@/lib/saglayicilar/muzik";
import { icerikDenetle } from "@/lib/moderasyon";

export const runtime = "nodejs";

/** Gerçek müzik üretimi. Sağlayıcı bağlı değilse 503 döner; istemci demo moduna geçer. */
export async function POST(req: NextRequest) {
  const g = (await req.json().catch(() => null)) as MuzikIstek | null;
  if (!g?.model) return NextResponse.json({ ok: false, hata: "Model seçilmedi." }, { status: 400 });
  const denetim = icerikDenetle([g.istem, g.sozler, ...(g.stiller ?? []), ...(g.plan?.bolumler.flatMap((b) => b.satirlar) ?? [])].filter(Boolean).join("\n"));
  if (!denetim.izin) return NextResponse.json({ ok: false, hata: denetim.mesaj }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, ...(await muzikUret(g)) });
  } catch (e) {
    const mesaj = String(e instanceof Error ? e.message : e).slice(0, 400);
    return NextResponse.json({ ok: false, hata: mesaj }, { status: /bağlı değil/.test(mesaj) ? 503 : 502 });
  }
}
