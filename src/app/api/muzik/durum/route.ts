import { NextResponse } from "next/server";
import { muzikDurumu } from "@/lib/saglayicilar/muzik";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Hangi müzik sağlayıcılarının bağlı olduğu (anahtarın kendisi asla dönmez). */
export function GET() {
  return NextResponse.json(muzikDurumu());
}
