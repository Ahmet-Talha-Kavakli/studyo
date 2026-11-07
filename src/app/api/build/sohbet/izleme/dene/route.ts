import { izlemeDene, kosulTemizle } from "@/lib/build/sohbetIzleme";
import { hata, sahipAl } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Kaydetmeden dene: { kosul } → koşulun şu anki değeri ve şu an tutup tutmadığı. */
export async function POST(req: Request) {
  if (!sahipAl(req)) return hata("Oturum anahtarı eksik; sayfayı yenile.", 401);
  let g: { kosul?: unknown };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const k = kosulTemizle(g.kosul);
  if ("hata" in k) return hata(k.hata);
  return Response.json({ ok: true, onizleme: await izlemeDene(k) });
}
