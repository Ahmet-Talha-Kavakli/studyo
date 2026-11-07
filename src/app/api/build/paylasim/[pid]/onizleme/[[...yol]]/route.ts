import { onizlemeSun, paylasimCoz } from "@/lib/build/paylasim";
import { CORS } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/**
 * Paylaşılan projenin canlı önizlemesi: kum havuzu başlığıyla, yalnız dosyalar. Sunucu fonksiyonları çalışmaz,
 * formlar kaydedilmez, Vayra Veri ve üyelik bağlanmaz (projenin gerçek verisine erişim yok).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ pid: string; yol?: string[] }> }) {
  const { pid, yol } = await params;
  const c = await paylasimCoz(pid);
  if (!c) return new Response("Bu bağlantı artık çalışmıyor.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8", ...CORS } });
  return onizlemeSun(c, yol, `/api/build/paylasim/${pid}/onizleme`);
}
export function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }
