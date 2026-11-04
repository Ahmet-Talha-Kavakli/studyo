import { tuvalPaylas, tuvalPaylasimKaldir, tuvalPaylasimOku } from "@/lib/tuvalPaylasim";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Canvas paylaşımı: POST oluşturur/günceller, DELETE kaldırır, GET ?id= kopyalamak için içeriği verir. */
export async function POST(req: Request) {
  try { const r = await tuvalPaylas(await req.json()); return Response.json({ ok: true, ...r, yol: `/t/${r.id}` }); }
  catch (e) { return Response.json({ ok: false, hata: e instanceof Error ? e.message : "Paylaşılamadı." }, { status: 400 }); }
}
export async function DELETE(req: Request) {
  try { const { id, anahtar } = (await req.json()) as { id?: string; anahtar?: string }; const ok = !!id && !!anahtar && (await tuvalPaylasimKaldir(id, anahtar)); return Response.json({ ok }, { status: ok ? 200 : 404 }); }
  catch { return Response.json({ ok: false }, { status: 400 }); }
}
export async function GET(req: Request) {
  const k = await tuvalPaylasimOku(new URL(req.url).searchParams.get("id") ?? "");
  return k ? Response.json({ ok: true, ...k }) : Response.json({ ok: false, hata: "Bulunamadı." }, { status: 404 });
}
