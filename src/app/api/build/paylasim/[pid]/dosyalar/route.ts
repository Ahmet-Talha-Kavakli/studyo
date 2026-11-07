import { paylasimCoz } from "@/lib/build/paylasim";
import { hata } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Salt okunur kod görünümü: yalnız sahip "Kodu göster"i açık bıraktıysa, paylaşılan sürümün dosyaları. */
export async function GET(_req: Request, { params }: { params: Promise<{ pid: string }> }) {
  const c = await paylasimCoz((await params).pid);
  if (!c) return hata("Bu bağlantı artık çalışmıyor.", 404);
  if (!c.k.kod) return hata("Sahibi kodu gizledi.", 403);
  return Response.json({ ok: true, dosyalar: c.dosyalar }, { headers: { "Cache-Control": "no-store" } });
}
