import { createHmac, timingSafeEqual } from "crypto";
import { ajanHam, yayindakiAjan } from "@/lib/build/ajanDepo";
import { whatsappGonder } from "@/lib/build/ajanKanal";
import { kanalMesaji } from "@/lib/build/ajanMesajKanal";
import { coz } from "@/lib/build/sifre";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
type Olay = { entry?: { changes?: { value?: { messages?: { from?: string; type?: string; text?: { body?: string } }[] } }[] }[] };

/** Meta webhook doğrulaması: hub.mode=subscribe ve hub.verify_token ajanın doğrulama belirteciyle eşleşirse hub.challenge döner. */
export async function GET(req: Request, { params }: Ctx) {
  const h = await ajanHam((await params).id);
  const u = new URL(req.url).searchParams;
  if (h && u.get("hub.mode") === "subscribe" && u.get("hub.verify_token") === h.ajan.yayin.whatsapp.dogrulama) return new Response(u.get("hub.challenge") ?? "", { status: 200 });
  return new Response("Doğrulama başarısız", { status: 403 });
}

/**
 * WhatsApp Cloud API mesaj olayı. Uygulama gizli anahtarı girildiyse X-Hub-Signature-256 imzası denetlenir. Metin
 * mesajlarına yayındaki sürüm yanıt verir ve yanıt Graph API ile gönderilir. Meta yeniden denemesin diye hemen 200 döner.
 */
export async function POST(req: Request, { params }: Ctx) {
  const ham = await req.text();
  const y = await yayindakiAjan((await params).id);
  if (!y) return Response.json({ ok: false }, { status: 404 });
  const w = y.ajan.yayin.whatsapp;
  const gizli = coz(w.uygulamaSifreli);
  if (gizli) {
    const imza = req.headers.get("x-hub-signature-256") ?? "";
    const bek = `sha256=${createHmac("sha256", gizli).update(ham).digest("hex")}`;
    if (imza.length !== bek.length || !timingSafeEqual(Buffer.from(imza), Buffer.from(bek))) return Response.json({ ok: false }, { status: 401 });
  }
  const token = coz(w.tokenSifreli);
  if (!token || !w.telefonId || !y.ajan.yayin.kanallar.whatsapp) return Response.json({ ok: true, yok: "kanal kapalı" });
  let o: Olay = {};
  try { o = JSON.parse(ham); } catch { return Response.json({ ok: true }); }
  const mesajlar = (o.entry ?? []).flatMap((e) => (e.changes ?? []).flatMap((c) => c.value?.messages ?? []));
  const isle = async () => {
    const s: { durum: string; hata?: string }[] = [];
    for (const m of mesajlar.slice(0, 5)) {
      if (!m.from) continue;
      const gonder = (x: string) => whatsappGonder(token, w.telefonId!, m.from!, x);
      if (m.type !== "text" || !m.text?.body) { s.push({ durum: "metinsiz", hata: (await gonder("Şimdilik yalnız yazılı mesajları anlayabiliyorum.")) ?? undefined }); continue; }
      s.push(await kanalMesaji({ y, kaynak: "whatsapp", kimlik: `wa:${m.from}`.padEnd(8, "_"), adres: m.from, metin: m.text.body.slice(0, 8000), gonder }));
    }
    return s;
  };
  if (new URL(req.url).searchParams.get("bekle") === "1") return Response.json({ ok: true, sonuclar: await isle() });
  isle().catch(() => {});
  return Response.json({ ok: true });
}
