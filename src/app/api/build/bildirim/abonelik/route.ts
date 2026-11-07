import { abonelikEkle, abonelikSil, cihazAdi, kanalKurulumu } from "@/lib/build/bildirim";
import { hata, sahipAl } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Tarayıcının PushSubscription'ı: { endpoint, keys: { p256dh, auth } }. */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return hata("Oturum anahtarı eksik; sayfayı yenile.", 401);
  if (!kanalKurulumu().push.kurulu) return hata("Sunucuda tarayıcı bildirimi kurulu değil (VAPID anahtarları yok).", 503);
  let g: { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const r = await abonelikEkle(sahip, g, cihazAdi(req.headers.get("user-agent") ?? ""));
  if ("hata" in r) return hata(r.hata);
  return Response.json({ ok: true });
}

/** { endpoint? }: verilmezse bütün cihazların aboneliği kaldırılır. */
export async function DELETE(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return hata("Oturum anahtarı eksik; sayfayı yenile.", 401);
  let g: { endpoint?: string } = {};
  try { g = await req.json(); } catch { /* hepsi */ }
  await abonelikSil(sahip, typeof g.endpoint === "string" ? g.endpoint : undefined);
  return Response.json({ ok: true });
}
