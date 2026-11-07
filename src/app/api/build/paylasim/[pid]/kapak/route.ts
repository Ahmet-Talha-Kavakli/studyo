import { kapakBaytlari, paylasimCoz } from "@/lib/build/paylasim";

export const dynamic = "force-dynamic";

/** Paylaşılan projenin kapağı (ekran görüntüsü); proje kimliği adreste görünmez. */
export async function GET(_req: Request, { params }: { params: Promise<{ pid: string }> }) {
  const c = await paylasimCoz((await params).pid);
  const b = c ? await kapakBaytlari(c) : null;
  if (!b) return new Response("Kapak yok", { status: 404 });
  return new Response(new Uint8Array(b), { headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=300" } });
}
