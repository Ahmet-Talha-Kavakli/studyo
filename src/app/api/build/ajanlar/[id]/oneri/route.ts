import { ajanGetir } from "@/lib/build/ajanDepo";
import { ajanOnerisi } from "@/lib/build/ajanOneri";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { icerikDenetle } from "@/lib/moderasyon";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Sohbetle düzenle: { istek } için alan alan öneri kartları döndürür; hiçbir şey kaydetmez. */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const a = await ajanGetir((await params).id, sahip);
  if (!a) return hata("Ajan bulunamadı.", 404);
  let g: { istek?: string } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const istek = String(g.istek ?? "").trim().slice(0, 2000);
  if (istek.length < 3) return hata("Ne değişmesini istediğini yaz.");
  const d = icerikDenetle(istek);
  if (!d.izin) return hata(d.mesaj, 422);
  const r = await ajanOnerisi(a, istek);
  if ("hata" in r) return hata(r.hata);
  return Response.json({ ok: true, ...r });
}
