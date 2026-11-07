import { NextRequest, NextResponse } from "next/server";
import { oturumGerekli } from "@/lib/hesap/yetki";
import { elementTarifEt, istemHazir } from "@/lib/saglayicilar/istem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST { gorseller: string[] } → { tur, ad, aciklama }. Gemini anahtarı yoksa 503 (arayüz düğmeyi kilitli gösterir). */
export async function POST(req: NextRequest) {
  // Oturum gerekir: sağlayıcı maliyeti olan uç misafire açık değil (bu iş kredi harcamaz).
  const oturum = await oturumGerekli(req);
  if (oturum instanceof Response) return oturum;
  if (!istemHazir()) return NextResponse.json({ ok: false, hata: "Otomatik tarif için yapay zekâ anahtarı bağlı değil." }, { status: 503 });
  const { gorseller } = (await req.json().catch(() => ({}))) as { gorseller?: string[] };
  const l = (gorseller ?? []).filter((g) => typeof g === "string" && /^(\/api\/dosya\/|https?:|data:image)/.test(g));
  if (!l.length) return NextResponse.json({ ok: false, hata: "Önce bir görsel ekle." }, { status: 400 });
  // Göreli depo adresleri sunucuda tam adrese çevrilir.
  const tam = l.map((g) => (g.startsWith("/") ? new URL(g, req.nextUrl.origin).toString() : g));
  try {
    return NextResponse.json({ ok: true, ...(await elementTarifEt(tam)) });
  } catch (e) {
    return NextResponse.json({ ok: false, hata: e instanceof Error ? e.message : "Tarif çıkarılamadı." }, { status: 502 });
  }
}
