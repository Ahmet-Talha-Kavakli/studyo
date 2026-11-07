import { toplulukKapak } from "@/lib/build/topluluk";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ tid: string }> }) {
  const b = await toplulukKapak((await params).tid);
  if (!b) return new Response("Kapak yok", { status: 404 });
  return new Response(new Uint8Array(b), { headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=300" } });
}
