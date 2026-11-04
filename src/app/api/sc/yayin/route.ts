import { scYayinKaldir, scYayinOku, scYayinla } from "@/lib/scYayin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Site/uygulama yayını: POST yayınlar/günceller, DELETE kaldırır (gizli anahtarla), GET ?id= remix için içeriği verir (yalnız remix açıksa). */
export async function POST(req: Request) {
  try {
    const r = await scYayinla(await req.json());
    return Response.json({ ok: true, ...r, yol: `/y/${r.id}` });
  } catch (e) {
    return Response.json({ ok: false, hata: e instanceof Error ? e.message : "Yayınlanamadı." }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id, anahtar } = (await req.json()) as { id?: string; anahtar?: string };
    const ok = !!id && !!anahtar && (await scYayinKaldir(id, anahtar));
    return Response.json({ ok }, { status: ok ? 200 : 404 });
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const k = await scYayinOku(id);
  if (!k) return Response.json({ ok: false, hata: "Bulunamadı." }, { status: 404 });
  if (!k.remix) return Response.json({ ok: false, hata: "Bu uygulamanın sahibi remixe izin vermiyor." }, { status: 403 });
  return Response.json({ ok: true, ad: k.ad, html: k.html, tur: k.tur });
}
