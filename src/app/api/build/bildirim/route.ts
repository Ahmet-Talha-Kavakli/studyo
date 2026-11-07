import { bildirimleriGetir, bildirimSil, kanalKurulumu, okunduYap, okunmamisSayisi } from "@/lib/build/bildirim";
import { izlemeZamanlayicisi } from "@/lib/build/sohbetIzleme";
import { hata, sahipAl } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Bildirim merkezi: ?say=1 yalnız okunmamış sayısı (zil yoklaması). Zil her Build sayfasında yokladığı için izleme zamanlayıcısı da burada uyanır. */
export async function GET(req: Request) {
  izlemeZamanlayicisi();
  const sahip = sahipAl(req);
  if (!sahip) return Response.json({ ok: true, okunmamis: 0, bildirimler: [] });
  if (new URL(req.url).searchParams.get("say")) return Response.json({ ok: true, okunmamis: await okunmamisSayisi(sahip) });
  return Response.json({ ok: true, ...(await bildirimleriGetir(sahip)), kurulum: kanalKurulumu() });
}

/** { id?, okundu? }: id yoksa hepsi okundu. */
export async function PATCH(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return hata("Oturum anahtarı eksik; sayfayı yenile.", 401);
  let g: { id?: string; okundu?: boolean } = {};
  try { g = await req.json(); } catch { /* boş: hepsi */ }
  await okunduYap(sahip, typeof g.id === "string" ? g.id : undefined, g.okundu !== false);
  return Response.json({ ok: true, okunmamis: await okunmamisSayisi(sahip) });
}

/** ?id=<id> tek bildirimi, id yoksa okunmuşların hepsini siler. */
export async function DELETE(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return hata("Oturum anahtarı eksik; sayfayı yenile.", 401);
  await bildirimSil(sahip, new URL(req.url).searchParams.get("id") ?? undefined);
  return Response.json({ ok: true, okunmamis: await okunmamisSayisi(sahip) });
}
