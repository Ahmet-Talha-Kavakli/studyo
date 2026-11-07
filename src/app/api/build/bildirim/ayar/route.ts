import { ayarGuncelle } from "@/lib/build/bildirim";
import { hata, sahipAl } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** { eposta?, turler?: { izleme: { push, eposta } ... }, sessiz?: { acik, bas, bit } } */
export async function PATCH(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return hata("Oturum anahtarı eksik; sayfayı yenile.", 401);
  let g: Record<string, unknown>;
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const r = await ayarGuncelle(sahip, g);
  if ("hata" in r) return hata(r.hata);
  return Response.json({ ok: true, ayar: r });
}
