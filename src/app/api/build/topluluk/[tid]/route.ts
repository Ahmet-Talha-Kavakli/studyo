import { toplulukKaldir, toplulukOgesi } from "@/lib/build/topluluk";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ tid: string }> };

/** Tek topluluk şablonu (dosyalar hariç). */
export async function GET(req: Request, { params }: Ctx) {
  const o = await toplulukOgesi((await params).tid, sahipAl(req));
  return o ? Response.json({ ok: true, oge: o }) : hata("Şablon bulunamadı.", 404);
}

/** Sahip: topluluktan kaldırır (remix edilmiş kopyalar etkilenmez). */
export async function DELETE(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  return (await toplulukKaldir((await params).tid, sahip)) ? Response.json({ ok: true }) : hata("Şablon bulunamadı.", 404);
}
