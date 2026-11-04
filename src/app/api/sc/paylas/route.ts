import { scPaylas, scPaylasimKaldir } from "@/lib/scPaylasim";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Usta sohbet paylaşımı: POST oluşturur/günceller, DELETE kaldırır (gizli anahtarla). */
export async function POST(req: Request) {
  try {
    const g = await req.json();
    const { id, anahtar } = await scPaylas(g);
    return Response.json({ ok: true, id, anahtar, yol: `/s/${id}` });
  } catch (e) {
    return Response.json({ ok: false, hata: e instanceof Error ? e.message : "Paylaşılamadı." }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id, anahtar } = (await req.json()) as { id?: string; anahtar?: string };
    const ok = !!id && !!anahtar && (await scPaylasimKaldir(id, anahtar));
    return Response.json({ ok }, { status: ok ? 200 : 404 });
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
}
