import { etkinYetenek, yetenekGuncelle, yetenekKaydi } from "@/lib/build/yetenekDepo";
import { paketCalistir, vakalariTemizle } from "@/lib/build/yetenekDegerlendir";
import { modelBul } from "@/lib/build/modeller";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Değerlendirme paketi ve geçmiş çalışmalar. */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const y = await yetenekKaydi((await params).id, sahip);
  if (!y) return hata("Yetenek bulunamadı.", 404);
  return Response.json({ ok: true, vakalar: y.degerlendirme?.vakalar ?? [], calismalar: y.degerlendirme?.calismalar ?? [] });
}

/** { vakalar, calistir?, model? }: paketi kaydeder; calistir ise taslağı yetenekli ve yeteneksiz çalıştırıp sonucu sürümüyle saklar. */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const y = await yetenekKaydi(id, sahip);
  if (!y) return hata("Yetenek bulunamadı.", 404);
  let g: { vakalar?: unknown; calistir?: boolean; model?: string } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const vakalar = vakalariTemizle(g.vakalar);
  if (typeof vakalar === "string") return hata(vakalar);
  await yetenekGuncelle(id, sahip, (x) => { x.degerlendirme = { vakalar, calismalar: x.degerlendirme?.calismalar ?? [] }; });
  if (!g.calistir) return Response.json({ ok: true, vakalar });
  if (!vakalar.length) return hata("En az bir vaka yaz.");
  const c = await paketCalistir(etkinYetenek({ ...y, sabitSurum: undefined, tarama: undefined })!, vakalar, modelBul(g.model).id);
  const r = await yetenekGuncelle(id, sahip, (x) => { x.degerlendirme = { vakalar, calismalar: [c, ...(x.degerlendirme?.calismalar ?? [])].slice(0, 20) }; });
  return Response.json({ ok: true, calisma: c, calismalar: r?.yetenek?.degerlendirme?.calismalar ?? [c] });
}
