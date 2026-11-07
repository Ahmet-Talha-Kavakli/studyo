import { iyzicoAyar } from "@/lib/odeme/ayar";
import { SIPARIS_DESENI, olayAl, olayBirak } from "@/lib/odeme/depo";
import { bildirimImzasiDogru } from "@/lib/odeme/iyzico";
import { iyzicoSonucIsle } from "@/lib/odeme/motor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yanit = (durum: number, veri: Record<string, unknown>) => new Response(JSON.stringify(veri), { status: durum, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

/**
 * iyzico bildirimi (Merchant Notification / webhook): <VAYRA_KOKEN>/api/odeme/bildirim/iyzico
 * Kullanıcı dönüşten önce tarayıcıyı kapatsa da ödeme işlenir. İmza (X-IYZ-SIGNATURE-V3) zorunlu; bildirim yalnız
 * tetiktir, sonuç belirteçle iyzico'dan sorgulanır. Aynı bildirim ikinci kez işlenmez.
 */
export async function POST(req: Request) {
  const a = iyzicoAyar();
  if (!a) return yanit(503, { ok: false });
  const metin = await req.text();
  if (metin.length > 64_000) return yanit(413, { ok: false });
  let g: Record<string, unknown>;
  try { g = JSON.parse(metin); } catch { return yanit(400, { ok: false }); }
  if (!bildirimImzasiDogru(a, req.headers.get("x-iyz-signature-v3"), g)) return yanit(400, { ok: false, hata: "İmza doğrulanamadı." });
  const no = String(g.paymentConversationId ?? "");
  const token = String(g.token ?? "");
  if (!SIPARIS_DESENI.test(no) || !token) return yanit(200, { ok: true, sonuc: "sipariş yok" });
  const kimlik = `${no}:${token.slice(0, 80)}:${String(g.status ?? "")}:${String(g.iyziEventTime ?? "")}`;
  if (!(await olayAl("iyzico", kimlik))) return yanit(200, { ok: true, sonuc: "tekrar" });
  try {
    const s = await iyzicoSonucIsle(no, token, "Bildirim");
    return yanit(200, { ok: true, sonuc: s.durum });
  } catch (e) {
    await olayBirak("iyzico", kimlik);
    console.error("[odeme-iyzico-bildirim]", (e as Error).message);
    return yanit((e as { durum?: number }).durum === 404 || (e as { durum?: number }).durum === 400 ? 200 : 500, { ok: false });
  }
}
