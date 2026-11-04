import { NextRequest, NextResponse } from "next/server";
import { durumGetir } from "@/lib/durumSunucu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Bileşenlerin anlık durumu ve günlük ölçüm geçmişi (durum sayfası). */
export async function GET(req: NextRequest) {
  const veri = await durumGetir(req.nextUrl.origin);
  return NextResponse.json(veri, { headers: { "cache-control": "no-store" } });
}
