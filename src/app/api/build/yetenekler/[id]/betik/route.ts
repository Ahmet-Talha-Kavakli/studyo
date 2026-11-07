import { yetenekKaydi } from "@/lib/build/yetenekDepo";
import { yetenekBetigiCalistir } from "@/lib/build/yetenekBetik";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Yeteneğin betiğini kum havuzunda çalıştırır (düzenleyicideki taslak): { yol, girdi } → dönüş, günlük, dosyalar, süre. */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const y = await yetenekKaydi((await params).id, sahip);
  if (!y) return hata("Yetenek bulunamadı.", 404);
  let g: { yol?: string; girdi?: unknown } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  if (typeof g.yol !== "string") return hata("Betik yolu gerekli.");
  if (g.girdi !== undefined && JSON.stringify(g.girdi).length > 500_000) return hata("Girdi çok büyük.");
  if (y.tarama?.sonuc === "kritik") return hata("Güvenlik taramasında kritik bulgu var; düzeltmeden betik çalışmaz.", 403);
  return Response.json({ ok: true, ...(await yetenekBetigiCalistir(y, g.yol, g.girdi ?? {})) });
}
