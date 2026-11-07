import { NextRequest, NextResponse } from "next/server";
import { oturumGerekli } from "@/lib/hesap/yetki";
import { tasarimKaydet } from "@/lib/saglayicilar/eleven";

export const runtime = "nodejs";

/** Tasarlanan önizlemeyi kalıcı sese çevirir: { ad, aciklama, kimlik, secilmeyenler? }. */
export async function POST(req: NextRequest) {
  // Oturum gerekir (önizleme sese çevrilir; ücreti tasarım sırasında kesildi).
  const oturum = await oturumGerekli(req);
  if (oturum instanceof Response) return oturum;
  if (!process.env.ELEVENLABS_API_KEY) return NextResponse.json({ ok: false, hata: "Ses sağlayıcısı bağlı değil." }, { status: 503 });
  const g = (await req.json().catch(() => ({}))) as { ad?: string; aciklama?: string; kimlik?: string; secilmeyenler?: string[] };
  if (!g.ad?.trim() || g.ad.trim().length < 2) return NextResponse.json({ ok: false, hata: "Sese bir ad ver." }, { status: 400 });
  if (!g.kimlik || !g.aciklama) return NextResponse.json({ ok: false, hata: "Önizleme seçilmedi." }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, ...(await tasarimKaydet(g.ad.trim(), g.aciklama, g.kimlik, (g.secilmeyenler ?? []).slice(0, 5))) });
  } catch (e) {
    return NextResponse.json({ ok: false, hata: String(e instanceof Error ? e.message : e).slice(0, 300) }, { status: 502 });
  }
}
