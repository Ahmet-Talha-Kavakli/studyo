import { kullanimRaporu } from "@/lib/build/kullanim";
import { sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Build kredi kullanımı: ?gun=30 (1 ile 365 arası). */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const gun = Math.min(365, Math.max(1, Math.round(Number(new URL(req.url).searchParams.get("gun")) || 30)));
  return Response.json({ ok: true, rapor: await kullanimRaporu(sahip, gun) });
}
