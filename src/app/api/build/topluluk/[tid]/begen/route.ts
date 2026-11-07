import { PaylasimHatasi } from "@/lib/build/paylasim";
import { toplulukBegen } from "@/lib/build/topluluk";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Beğeniyi aç ya da kapat (sahip anahtarı başına bir beğeni). */
export async function POST(req: Request, { params }: { params: Promise<{ tid: string }> }) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  try {
    const v = await toplulukBegen((await params).tid, sahip);
    return v ? Response.json({ ok: true, ...v }) : hata("Şablon bulunamadı.", 404);
  } catch (e) { return e instanceof PaylasimHatasi ? hata(e.message, e.durum) : hata("Kaydedilemedi.", 500); }
}
