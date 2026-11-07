import { ajanGuncelle, ajanlariListeleOz } from "@/lib/build/ajanDepo";
import { yetenekKaydi } from "@/lib/build/yetenekDepo";
import { sahipOzeti } from "@/lib/build/depo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Kullanım yeri: sahibin ajanları ve bu yeteneği kullanıp kullanmadıkları. */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await yetenekKaydi(id, sahip))) return hata("Yetenek bulunamadı.", 404);
  const l = await ajanlariListeleOz(sahipOzeti(sahip));
  return Response.json({ ok: true, ajanlar: l.map((a) => ({ id: a.id, ad: a.ad, simge: a.simge, yayinda: a.yayin?.durum === "yayinda", kullaniyor: (a.yetenekler ?? []).includes(id) })) });
}

/** { ajanId, acik }: yeteneği ajanın listesine ekler ya da çıkarır (yayındaki sürüm bir sonraki yayında güncellenir). */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await yetenekKaydi(id, sahip))) return hata("Yetenek bulunamadı.", 404);
  let g: { ajanId?: string; acik?: boolean } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  if (typeof g.ajanId !== "string" || typeof g.acik !== "boolean") return hata("Geçersiz istek.");
  const r = await ajanGuncelle(g.ajanId, sahip, (a) => { const s = new Set(a.yetenekler ?? []); if (g.acik) s.add(id); else s.delete(id); a.yetenekler = [...s].slice(0, 30); });
  return r ? Response.json({ ok: true }) : hata("Ajan bulunamadı.", 404);
}
