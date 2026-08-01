import { NextResponse } from "next/server";
import { saglayiciDurumu } from "@/lib/saglayicilar";

export const runtime = "nodejs";

/** Her üretim türünün o an gerçek API'yle mi simülasyonla mı çalıştığını döner. */
export async function GET() {
  return NextResponse.json({ durum: saglayiciDurumu() });
}
