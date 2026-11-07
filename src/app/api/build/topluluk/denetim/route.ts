import { PaylasimHatasi } from "@/lib/build/paylasim";
import { toplulukDenetle } from "@/lib/build/topluluk";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Ekleme öncesi otomatik güvenlik denetimi: POST { projeId, surum? } → { bulgular, surumNo, dosyaSayisi, girisVar } */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: { projeId?: string; surum?: string };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  try { return Response.json({ ok: true, ...(await toplulukDenetle(String(g.projeId ?? ""), sahip, g.surum)) }); }
  catch (e) { return e instanceof PaylasimHatasi ? hata(e.message, e.durum) : hata("Denetlenemedi.", 500); }
}
