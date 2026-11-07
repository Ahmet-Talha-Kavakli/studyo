import { izlemeleriGetir, izlemeOlustur, izlemeZamanlayicisi } from "@/lib/build/sohbetIzleme";
import { hata, sahipAl } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** İzleme görevleri (koşul gerçekleşince bildir). */
export async function GET(req: Request) {
  izlemeZamanlayicisi();
  const sahip = sahipAl(req);
  if (!sahip) return Response.json({ ok: true, izlemeler: [] });
  const l = await izlemeleriGetir(sahip);
  return Response.json({ ok: true, izlemeler: l.map(({ durumVerisi: _d, ...x }) => { void _d; return x; }) });
}

/** { ad?, kosul, aralik (dakika), tekrar: "bir-kez" | "her-seferinde", sohbet? } */
export async function POST(req: Request) {
  izlemeZamanlayicisi();
  const sahip = sahipAl(req);
  if (!sahip) return hata("Oturum anahtarı eksik; sayfayı yenile.", 401);
  let g: { ad?: string; kosul?: unknown; aralik?: unknown; tekrar?: unknown; sohbet?: string };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const r = await izlemeOlustur(sahip, { ...g, kosul: g.kosul });
  if ("hata" in r) return hata(r.hata);
  const { durumVerisi: _d, ...x } = r.izleme; void _d;
  return Response.json({ ok: true, izleme: x });
}
