import { projeOku } from "@/lib/build/depo";
import { bulunamadi, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { kullanimOzeti } from "@/lib/build/bulutRapor";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Proje kullanımı: kalemler (kullanılan, sınır, dönem, uygulanıyor mu), son 6 ay, bakım ve yapay zekâ durumu. */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const p = await projeOku((await params).id, sahip);
  if (!p) return bulunamadi();
  return Response.json({ ok: true, ...(await kullanimOzeti(p)) });
}
