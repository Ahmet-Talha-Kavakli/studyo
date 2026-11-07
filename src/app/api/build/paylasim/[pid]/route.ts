import { gorunum, paylasimCoz, PaylasimHatasi, paylasimGuncelle, paylasimKaldir } from "@/lib/build/paylasim";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ pid: string }> };

/** Herkese açık paylaşım bilgisi (proje kimliği, sahip ve sırlar yok). */
export async function GET(_req: Request, { params }: Ctx) {
  const c = await paylasimCoz((await params).pid);
  return c ? Response.json({ ok: true, paylasim: gorunum(c) }) : hata("Bu bağlantı artık çalışmıyor.", 404);
}

/** Sahip: { remix?, kod?, surum? ("son" | sürüm kimliği), aciklama?, yazar? } */
export async function PATCH(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: Record<string, unknown>;
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  try { return Response.json({ ok: true, paylasim: await paylasimGuncelle((await params).pid, sahip, g) }); }
  catch (e) { return e instanceof PaylasimHatasi ? hata(e.message, e.durum) : hata("Kaydedilemedi.", 500); }
}

/** Sahip: bağlantıyı kaldırır. */
export async function DELETE(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  return (await paylasimKaldir((await params).pid, sahip)) ? Response.json({ ok: true }) : hata("Paylaşım bulunamadı.", 404);
}
