import { digerleri, ortakKapat, ortakOku, ortakOlustur, ortakUygula, varlikYaz, type Kisi, type OrtakIslem } from "@/lib/tuvalOrtak";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * Birlikte düzenleme.
 * GET ?id&k&surum&kisi → { surum, belge? (yalnız yeniyse), kisiler }
 * POST { islem: "olustur", ad, dugumler, kenarlar, gruplar, yorumlar } → { id, anahtar }
 * POST { islem: "uygula", id, k, islemler } → { surum }
 * POST { islem: "varlik", id, k, kisi } → { kisiler }
 * DELETE { id, k } → bağlantıyı kapatır
 */
export async function GET(req: Request) {
  const u = new URL(req.url).searchParams;
  const id = u.get("id") ?? "", k = u.get("k") ?? "", surum = Number(u.get("surum") ?? 0), kisi = u.get("kisi") ?? "";
  const b = await ortakOku(id, k);
  if (!b) return Response.json({ ok: false, hata: "Bağlantı geçersiz ya da kapatılmış." }, { status: 404 });
  return Response.json({ ok: true, surum: b.surum, ...(b.surum !== surum ? { belge: b } : {}), kisiler: digerleri(id, kisi) });
}

export async function POST(req: Request) {
  try {
    const g = (await req.json()) as Record<string, unknown>;
    if (g.islem === "olustur") return Response.json({ ok: true, ...(await ortakOlustur(g)) });
    const id = String(g.id ?? ""), k = String(g.k ?? "");
    if (g.islem === "uygula") {
      const surum = await ortakUygula(id, k, (Array.isArray(g.islemler) ? g.islemler : []) as OrtakIslem[]);
      return surum ? Response.json({ ok: true, surum }) : Response.json({ ok: false, hata: "Bağlantı geçersiz." }, { status: 404 });
    }
    if (g.islem === "varlik") {
      if (!(await ortakOku(id, k))) return Response.json({ ok: false }, { status: 404 });
      const kisi = g.kisi as Kisi; if (kisi?.id) varlikYaz(id, kisi);
      return Response.json({ ok: true, kisiler: digerleri(id, String(kisi?.id ?? "")) });
    }
    return Response.json({ ok: false, hata: "Bilinmeyen işlem." }, { status: 400 });
  } catch (e) { return Response.json({ ok: false, hata: e instanceof Error ? e.message : "Hata" }, { status: 400 }); }
}

export async function DELETE(req: Request) {
  try { const { id, k } = (await req.json()) as { id?: string; k?: string }; const ok = !!id && !!k && (await ortakKapat(id, k)); return Response.json({ ok }, { status: ok ? 200 : 404 }); }
  catch { return Response.json({ ok: false }, { status: 400 }); }
}
