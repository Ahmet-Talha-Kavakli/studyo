import { PaylasimHatasi } from "@/lib/build/paylasim";
import { toplulukEkle, toplulukListe } from "@/lib/build/topluluk";
import type { ToplulukSira } from "@/lib/build/toplulukOrtak";
import { yalnizSahip } from "@/lib/build/ekipRota";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/**
 * Topluluk galerisi.
 *  GET ?ara=&kategori=site|uygulama|oyun|mobil&etiket=&sira=populer|yeni&benim=1  (herkese açık; sahip anahtarı varsa benim/begendim)
 *  POST { projeId, surum?, baslik, aciklama, kategori, etiketler[], yazar, kapak? ("proje" | data adresi) }  (sahip; güvenlik denetimi)
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const sira = (q.get("sira") === "yeni" ? "yeni" : "populer") as ToplulukSira;
  const sahip = sahipAl(req);
  const ogeler = await toplulukListe({ ara: q.get("ara") ?? undefined, kategori: q.get("kategori") ?? undefined, etiket: q.get("etiket") ?? undefined, sira, sahip, benim: q.get("benim") === "1" });
  return Response.json({ ok: true, ogeler });
}

export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: Record<string, unknown>;
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const engel = await yalnizSahip(String(g.projeId ?? ""), sahip, "Projeyi topluluğa yalnız sahibi ekleyebilir.");
  if (engel) return engel;
  try { return Response.json({ ok: true, oge: await toplulukEkle(sahip, g) }); }
  catch (e) { return e instanceof PaylasimHatasi ? hata(e.message, e.durum) : hata("Topluluğa eklenemedi.", 500); }
}
