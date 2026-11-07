import { toplulukOnizleme } from "@/lib/build/topluluk";
import { CORS } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Topluluk şablonunun canlı önizlemesi (kum havuzu; formlar kaydedilmez, veri bağlanmaz). */
export async function GET(_req: Request, { params }: { params: Promise<{ tid: string; yol?: string[] }> }) {
  const { tid, yol } = await params;
  return (await toplulukOnizleme(tid, yol)) ?? new Response("Şablon bulunamadı.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8", ...CORS } });
}
export function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }
