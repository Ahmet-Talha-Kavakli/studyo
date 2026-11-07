import { istekKimligi, istekSahipOzeti } from "@/lib/build/sohbetOrtak";
import { paylasimOku, paylasimRolu } from "@/lib/build/sohbetPaylasim";
import { sonIcerik, tuvalHam } from "@/lib/build/sohbetTuval";
import { hata } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Paylaşılan sohbetteki tuvalin son hâli (salt okunur). Yalnız paylaşımın mesajlarında geçen tuvaller açılır. */
export async function GET(req: Request, { params }: { params: Promise<{ pid: string; tid: string }> }) {
  const { pid, tid } = await params;
  const p = await paylasimOku(pid);
  if (!p) return hata("Paylaşım bulunamadı.", 404);
  if (!paylasimRolu(p, { sahipOz: istekSahipOzeti(req), eposta: istekKimligi(req)?.eposta })) return hata("Bu sohbet kişiye özel.", 403);
  const var_ = p.mesajlar.some((m) => (m.parcalar ?? []).some((x) => x.tur === "arac" && x.sonuc?.tur === "tuval" && x.sonuc.id === tid));
  if (!var_) return hata("Tuval bulunamadı.", 404);
  const t = await tuvalHam(tid);
  if (!t) return hata("Tuval bulunamadı.", 404);
  return Response.json({ ok: true, tuval: { id: t.id, baslik: t.baslik, tip: t.tip, dil: t.dil, icerik: sonIcerik(t), surum: t.surumler[t.surumler.length - 1]?.no ?? 1 } });
}
