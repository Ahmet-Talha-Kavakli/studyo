import { istekKimligi, ortakListe } from "@/lib/build/sohbetOrtak";

export const dynamic = "force-dynamic";

/** Seninle paylaşılan sohbetler ve klasörler (oturumdaki e-postaya gelen davetler). Oturum yoksa boş liste ve oturum: false. */
export async function GET(req: Request) {
  const k = istekKimligi(req);
  if (!k) return Response.json({ ok: true, oturum: false, ogeler: [] });
  return Response.json({ ok: true, oturum: true, eposta: k.eposta, ogeler: await ortakListe(k.eposta) });
}
