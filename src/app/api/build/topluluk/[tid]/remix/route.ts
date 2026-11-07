import { PaylasimHatasi } from "@/lib/build/paylasim";
import { toplulukRemix } from "@/lib/build/topluluk";
import { hata, sahipAl } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Topluluk şablonunu isteği yapanın projelerine kopyalar; ilk sürüm kaynağı anar, remix sayacı artar. */
export async function POST(req: Request, { params }: { params: Promise<{ tid: string }> }) {
  const sahip = sahipAl(req);
  if (!sahip) return hata("Oturum anahtarı eksik; sayfayı yenile.", 401);
  try { return Response.json({ ok: true, id: await toplulukRemix((await params).tid, sahip) }); }
  catch (e) { return e instanceof PaylasimHatasi ? hata(e.message, e.durum) : hata((e as Error).message || "Remix yapılamadı.", 500); }
}
