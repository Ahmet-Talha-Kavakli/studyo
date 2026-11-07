import { paylasimAc, paylasimKapat } from "@/lib/build/yetenekDepo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Paylaşım bağlantısı açar (varsa aynısını döner). Bağlantıyı bilen herkes yeteneği görüp kopyalayabilir. */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const a = await paylasimAc((await params).id, sahip);
  return a ? Response.json({ ok: true, anahtar: a }) : hata("Yetenek bulunamadı.", 404);
}

/** Paylaşımı kapatır; eski bağlantı artık açılmaz. */
export async function DELETE(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  return (await paylasimKapat((await params).id, sahip)) ? Response.json({ ok: true }) : hata("Paylaşım yok.", 404);
}
