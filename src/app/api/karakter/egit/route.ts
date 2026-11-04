import { NextRequest, NextResponse } from "next/server";
import { loraEgitBaslat, loraSorgula } from "@/lib/saglayicilar/lora";

export const runtime = "nodejs";

/** GET ?jeton= → eğitim durumu · GET (jetonsuz) → { hazir } */
export async function GET(req: NextRequest) {
  const jeton = req.nextUrl.searchParams.get("jeton");
  if (!jeton) return NextResponse.json({ hazir: Boolean(process.env.FAL_KEY) });
  return NextResponse.json(await loraSorgula(jeton));
}

/** { gorseller: string[] (depo adresleri, 5–30), tetik } → { ok, jeton } */
export async function POST(req: NextRequest) {
  const g = (await req.json().catch(() => ({}))) as { gorseller?: string[]; tetik?: string };
  const tetik = (g.tetik ?? "").replace(/[^\p{L}\p{N}_]/gu, "").slice(0, 24);
  if (!tetik) return NextResponse.json({ ok: false, hata: "Tetik kelimesi gerekli." }, { status: 400 });
  try {
    const r = await loraEgitBaslat((g.gorseller ?? []).filter((u) => typeof u === "string"), tetik);
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return NextResponse.json({ ok: false, hata: e instanceof Error ? e.message : "Başlatılamadı." }, { status: 400 });
  }
}
