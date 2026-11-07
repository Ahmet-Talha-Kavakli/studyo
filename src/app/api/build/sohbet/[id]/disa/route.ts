import { kilitAcik, kilitliYanit } from "@/lib/build/sohbetKilit";
import { belgeBilgisi, dosyaOlustur } from "@/lib/build/belgeDepo";
import { modelBul } from "@/lib/build/modeller";
import { sohbetGetir } from "@/lib/build/sohbetDepo";
import { sohbetBelgesi } from "@/lib/build/sohbetDisa";
import { etkinYol } from "@/lib/build/sohbetYol";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Sohbeti Word belgesi olarak dışa aktarır (görünen dal): → { dosya } (indirme adresi). */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const s = await sohbetGetir((await params).id, sahip);
  if (!s) return hata("Sohbet bulunamadı.", 404);
  if (!kilitAcik(req, s)) return kilitliYanit();
  const yol = etkinYol(s.mesajlar, s.secim);
  if (!yol.length) return hata("Dışa aktarılacak mesaj yok.");
  try {
    const { kayit } = await dosyaOlustur("docx", sohbetBelgesi(s.baslik, yol, (m) => modelBul(m).ad), { sahip, sohbet: s.id });
    return Response.json({ ok: true, dosya: belgeBilgisi(kayit) });
  } catch (e) {
    return hata((e as Error).message || "Word dosyası üretilemedi.", 500);
  }
}
