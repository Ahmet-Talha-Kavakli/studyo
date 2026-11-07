import { kilitAcik, kilitliYanit } from "@/lib/build/sohbetKilit";
import { modelBagli } from "@/lib/build/disAjan";
import { modelBul } from "@/lib/build/modeller";
import { sohbetGetir, sohbetKaydet } from "@/lib/build/sohbetDepo";
import { baglamTahmini } from "@/lib/build/sohbetGecmis";
import { sohbetiSikistir } from "@/lib/build/sohbetOzet";
import { yayinlar } from "@/lib/build/sohbetYayin";
import { etkinYol } from "@/lib/build/sohbetYol";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Elle sıkıştır: etkin yolun eski mesajları seçili modelle özetlenir (son iki mesaj korunur). { model? } → { ozet, baglam }. */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const s = await sohbetGetir(id, sahip);
  if (!s) return hata("Sohbet bulunamadı.", 404);
  if (!kilitAcik(req, s)) return kilitliYanit();
  if (yayinlar.get(id) && !yayinlar.get(id)!.bitti) return hata("Yanıt sürerken özetlenemez.", 409);
  let g: { model?: string } = {};
  try { g = await req.json(); } catch { /* boş */ }
  const model = modelBul(s.ajanId ? s.model : g.model ?? s.model);
  if (!modelBagli(model)) return hata(`${model.ad} bu sunucuda bağlı değil; özet çıkarılamadı.`, 424);
  const yol = etkinYol(s.mesajlar, s.secim);
  const r = await sohbetiSikistir({ s, yol, model, signal: AbortSignal.timeout(180_000), elle: true });
  if ("yok" in r) return hata(r.yok, 422);
  await sohbetKaydet(s, sahip);
  return Response.json({ ok: true, ozet: r.ozet, baglam: baglamTahmini(s, yol) });
}
