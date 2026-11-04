import { NextResponse } from "next/server";
import { saglayiciDurumu, saglayiciHazirlik } from "@/lib/saglayicilar";

export const runtime = "nodejs";

/** Her üretim türünün o an gerçek API'yle mi simülasyonla mı çalıştığını döner. */
export async function GET() {
  // Yalnız ad + hazır bilgisi döner; anahtarların kendisi asla.
  return NextResponse.json({ durum: saglayiciDurumu(), saglayicilar: Object.fromEntries(saglayiciHazirlik().map((s) => [s.ad, s.hazir])) });
}
