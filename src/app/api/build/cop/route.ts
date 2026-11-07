import { COP_GUN, copKaliciSil, copListesi, projeGeriAl } from "@/lib/build/depo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Çöp kutusundaki projeler (en son silinen önce); 30 günü dolanlar bu sırada kalıcı silinir. */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  return Response.json({ ok: true, projeler: await copListesi(sahip), gun: COP_GUN });
}

/** { islem: "geri", id } geri getirir · { islem: "sil", id } kalıcı siler · { islem: "bosalt" } hepsini kalıcı siler. */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: { islem?: string; id?: string } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const id = String(g.id ?? "");
  if (g.islem === "geri") {
    const r = await projeGeriAl(id, sahip);
    return r.ok ? Response.json({ ok: true, altAlan: r.altAlan, ...(r.uyari ? { uyari: r.uyari } : {}) }) : hata("Proje çöp kutusunda bulunamadı.", 404);
  }
  if (g.islem === "sil") return (await copKaliciSil(id, sahip)) ? Response.json({ ok: true }) : hata("Proje çöp kutusunda bulunamadı.", 404);
  if (g.islem === "bosalt") {
    const l = await copListesi(sahip);
    for (const x of l) await copKaliciSil(x.id, sahip).catch(() => {});
    return Response.json({ ok: true, silinen: l.length });
  }
  return hata("Bilinmeyen işlem.");
}
