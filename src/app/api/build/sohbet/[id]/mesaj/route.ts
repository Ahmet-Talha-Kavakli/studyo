import { kilitAcik, kilitliYanit } from "@/lib/build/sohbetKilit";
import { sohbetGetir } from "@/lib/build/sohbetDepo";
import { turIstegi, type TurGovdesi } from "@/lib/build/sohbetTur";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { calisanSohbetler } from "../../calisanlar";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Sohbet turu (NDJSON akışı; olaylar lib/build/sohbetTur'da). Gövde:
 *  { metin, ekler?, model?, efor?, ust?, istek? }  yeni mesaj (istek: araştırma, Vayra aracı, @ bahsetmeleri, model kurulu)
 *  { duzenle: kullanıcıMesajı, metin, ekler? }    düzenleme: aynı üstün altına yeni dal
 *  { yenidenDene: asistanMesajı, model? }         aynı soruya yeni sürüm (istenirse başka modelle)
 *  { tekrar: true }                               eski istemci: son yanıtı yeniden dene
 *  { onay: { karar, hep? } }                      onay kartı yanıtı
 *  { arastirmaBaslat: { mesajId, plan } }         düzenlenen araştırma planını başlat
 * Tur istekten bağımsız sürer; sayfa yenilenirse GET /akis ile yeniden bağlanılır.
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const s = await sohbetGetir((await params).id, sahip);
  if (!s) return hata("Sohbet bulunamadı.", 404);
  if (!kilitAcik(req, s)) return kilitliYanit();
  let g: TurGovdesi;
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  return turIstegi(req, s, sahip, g);
}

/** Durdur. */
export async function DELETE(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await sohbetGetir(id, sahip))) return hata("Sohbet bulunamadı.", 404);
  calisanSohbetler.get(id)?.abort();
  return Response.json({ ok: true });
}
