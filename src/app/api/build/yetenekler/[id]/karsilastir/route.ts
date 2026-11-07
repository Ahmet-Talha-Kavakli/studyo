import { etkinYetenek, yetenekKaydi } from "@/lib/build/yetenekDepo";
import { karsilastir } from "@/lib/build/yetenekDene";
import { modelBul } from "@/lib/build/modeller";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { icerikDenetle } from "@/lib/moderasyon";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Yeteneği dene: { istem, model } aynı modelle yetenek yüklüyken ve yokken yan yana yanıt. */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const y = await yetenekKaydi((await params).id, sahip);
  if (!y) return hata("Yetenek bulunamadı.", 404);
  let g: { istem?: string; model?: string } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const istem = String(g.istem ?? "").trim().slice(0, 4000);
  if (!istem) return hata("Bir istek yaz.");
  const d = icerikDenetle(istem);
  if (!d.izin) return hata(d.mesaj, 422);
  const e = etkinYetenek({ ...y, tarama: undefined })!;
  const m = modelBul(g.model);
  return Response.json({ ok: true, model: m.id, ...(await karsilastir(e, istem, m.id)) });
}
