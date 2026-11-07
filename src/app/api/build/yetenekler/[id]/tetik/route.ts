import { etkinYetenek, yetenekGuncelle, yetenekKaydi, yetenekleriListele } from "@/lib/build/yetenekDepo";
import { aciklamaIyilestir, sorguUret, tetikTesti, type TetikSonuc } from "@/lib/build/yetenekDene";
import { modelBul } from "@/lib/build/modeller";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Açıklama tetik testi: { sorgular: [{ sorgu, beklenen }], model } her sorguyu sohbetteki gerçek seçim ortamında
 * (bütün etkin yeteneklerin listesi + yetenek_oku aracı) modele sorar. Sorgular yetenekte saklanır.
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const y = await yetenekKaydi(id, sahip);
  if (!y) return hata("Yetenek bulunamadı.", 404);
  let g: { islem?: string; sorgular?: { sorgu?: string; beklenen?: boolean }[]; model?: string; onceki?: TetikSonuc[] } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  if (g.islem === "uret") {
    const r = await sorguUret(y, modelBul(g.model).id);
    if (!r.sorgular.length) return hata(r.hata ?? "Sorgu üretilemedi.");
    return Response.json({ ok: true, sorgular: r.sorgular });
  }
  const sorgular = (g.sorgular ?? []).filter((x) => typeof x?.sorgu === "string" && x.sorgu.trim()).slice(0, 20).map((x) => ({ sorgu: String(x.sorgu).trim().slice(0, 300), beklenen: !!x.beklenen }));
  if (!sorgular.length) return hata("En az bir sorgu yaz.");
  await yetenekGuncelle(id, sahip, (x) => { x.tetikTestleri = sorgular; });
  const e = etkinYetenek({ ...y, tarama: undefined })!;
  const m = modelBul(g.model);
  const digerleri = (await yetenekleriListele(sahip)).filter((x) => x.id !== id);
  if (g.islem === "iyilestir") {
    const onceki = Array.isArray(g.onceki) ? g.onceki.slice(0, 20) : await tetikTesti(e, digerleri, sorgular, m.id);
    const r = await aciklamaIyilestir(e, digerleri, sorgular, onceki, m.id);
    if (!r.oneri || !r.sonra) return hata(r.hata ?? "Öneri üretilemedi.");
    const say = (l: TetikSonuc[]) => { const o = l.filter((x) => x.tetiklendi !== null); return { dogru: o.filter((x) => x.tetiklendi === x.beklenen).length, olculen: o.length }; };
    return Response.json({ ok: true, oneri: r.oneri, neden: r.neden, once: say(onceki), sonra: say(r.sonra), sonuclar: r.sonra });
  }
  const sonuclar = await tetikTesti(e, digerleri, sorgular, m.id);
  const olculen = sonuclar.filter((s) => s.tetiklendi !== null);
  return Response.json({ ok: true, model: m.id, sonuclar, dogru: olculen.filter((s) => s.tetiklendi === s.beklenen).length, olculen: olculen.length });
}
