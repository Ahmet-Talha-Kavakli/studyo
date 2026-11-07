import { sohbetGetir } from "@/lib/build/sohbetDepo";
import { sayfaYaz } from "@/lib/build/sohbetPaylasim";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Sohbette üretilen HTML sayfasını herkese açık bir bağlantıyla yayınla: { html } → { url } */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  if (!(await sohbetGetir((await params).id, sahip))) return hata("Sohbet bulunamadı.", 404);
  let g: { html?: string };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const html = String(g.html ?? "");
  if (!html.trim()) return hata("Sayfa boş.");
  if (html.length > 2_000_000) return hata("Sayfa çok büyük.", 413);
  return Response.json({ ok: true, url: `/api/build/sohbet/sayfa/${await sayfaYaz(html)}` });
}
