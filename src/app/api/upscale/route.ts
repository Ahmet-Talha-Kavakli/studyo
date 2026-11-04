import { NextRequest, NextResponse } from "next/server";
import { upscaleBaslat, upscaleSorgula } from "@/lib/saglayicilar/upscale";
import { upscaleModel, type UpscaleAyar, type UpscaleModelId } from "@/lib/upscaleVeri";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** İşi başlatır: { model, kaynakUrl, olcek, ayar } → { jeton }. Durum GET ?jeton= ile sorulur. */
export async function POST(req: NextRequest) {
  const g = (await req.json().catch(() => ({}))) as { model?: string; kaynakUrl?: string; olcek?: number; ayar?: UpscaleAyar };
  if (!g.model || !upscaleModel(g.model)) return NextResponse.json({ ok: false, hata: "Geçersiz model." }, { status: 400 });
  if (!g.kaynakUrl) return NextResponse.json({ ok: false, hata: "Kaynak dosya yok." }, { status: 400 });
  try {
    const { jeton } = await upscaleBaslat({ model: g.model as UpscaleModelId, kaynakUrl: g.kaynakUrl, olcek: Number(g.olcek) || 2, ayar: g.ayar });
    return NextResponse.json({ ok: true, jeton });
  } catch (e) {
    return NextResponse.json({ ok: false, hata: e instanceof Error ? e.message : "Başlatılamadı." }, { status: 502 });
  }
}

export async function GET(req: NextRequest) {
  const jeton = req.nextUrl.searchParams.get("jeton");
  if (!jeton) return NextResponse.json({ durum: "hata", hata: "İş yok." }, { status: 400 });
  try {
    return NextResponse.json(await upscaleSorgula(jeton));
  } catch (e) {
    return NextResponse.json({ durum: "hata", hata: e instanceof Error ? e.message : "Sorgulanamadı." });
  }
}
