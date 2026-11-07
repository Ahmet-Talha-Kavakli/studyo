import { NextRequest, NextResponse } from "next/server";
import { oturumGerekli } from "@/lib/hesap/yetki";
import { planOlustur } from "@/lib/saglayicilar/muzik";

export const runtime = "nodejs";

/** İstemden bölüm planı (kredi harcamaz): { istem, model, sureSn? }. */
export async function POST(req: NextRequest) {
  // Oturum gerekir: sağlayıcı maliyeti olan uç misafire açık değil (bu iş kredi harcamaz).
  const oturum = await oturumGerekli(req);
  if (oturum instanceof Response) return oturum;
  const g = (await req.json().catch(() => ({}))) as { istem?: string; model?: string; sureSn?: number | null };
  if (!g.istem || g.istem.trim().length < 3) return NextResponse.json({ ok: false, hata: "Şarkıyı anlatan bir istem yaz." }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, plan: await planOlustur(g.istem.trim(), g.model ?? "Eleven Music v2.5", g.sureSn) });
  } catch (e) {
    const mesaj = String(e instanceof Error ? e.message : e).slice(0, 300);
    return NextResponse.json({ ok: false, hata: mesaj }, { status: /bağlı değil/.test(mesaj) ? 503 : 502 });
  }
}
