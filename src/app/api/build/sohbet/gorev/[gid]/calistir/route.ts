import { gorevCalistir } from "@/lib/build/sohbetGorev";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Şimdi çalıştır: arka planda başlar, sonuç birkaç saniye içinde görevin sohbetine düşer. */
export async function POST(req: Request, { params }: { params: Promise<{ gid: string }> }) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  return (await gorevCalistir(sahip, (await params).gid)) ? Response.json({ ok: true }) : hata("Görev bulunamadı.", 404);
}
