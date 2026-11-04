import { NextResponse } from "next/server";
import { falBagli } from "@/lib/saglayicilar/upscale";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Büyütme sağlayıcısı bağlı mı (anahtarın kendisi asla dönmez). */
export function GET() {
  return NextResponse.json({ fal: falBagli() });
}
