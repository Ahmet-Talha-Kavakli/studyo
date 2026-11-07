import { sahipOzeti } from "@/lib/build/depo";
import { calismaDegiskenleri } from "@/lib/build/sistemDegisken";
import { sistemGetir, sistemGuncelle } from "@/lib/build/sistemDepo";
import { duzListe } from "@/lib/build/sistemKatalog";
import { kodYaz } from "@/lib/build/sistemKodYaz";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { yanittanKes } from "@/lib/hesap/buildKredi";
import { hizSiniri } from "@/lib/build/ziyaretciDepo";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Kod adımı için yapay zekâyla yaz: { adimId, tarif, kod? }. Örnek girdi deneme verisinden kurulur (tetik, önceki
 * adımların son çıktıları, değişkenler; sırlar gönderilmez). Dönen kod örnek girdiyle denenir. Kredi sisteme yazılır.
 */
/** Yapay zekâ bedeli sunucuda düşülür (yanıttaki kredi). */
export async function POST(req: Request, ctx: Ctx) {
  return yanittanKes(await postIsle(req, ctx), sahipAl(req), { kaynak: "build:sistem", aciklama: "Sistem: kod yazımı" });
}

async function postIsle(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const s = await sistemGetir(id, sahip);
  if (!s) return hata("Sistem bulunamadı.", 404);
  let g: { adimId?: string; tarif?: string; kod?: string } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const tarif = String(g.tarif ?? "").trim();
  if (tarif.length < 4) return hata("Kodun ne yapacağını bir cümleyle yaz.");
  if (!hizSiniri(`kod-yaz:${sahipOzeti(sahip)}`, 20, 10 * 60_000)) return hata("Çok sık istek; birkaç dakika sonra yeniden dene.", 429);
  const duz = duzListe(s.adimlar);
  const hedef = duz.find((x) => x.a.id === g.adimId);
  const adim: Record<string, unknown> = {};
  for (const x of duz) {
    if (hedef && x.no >= hedef.no) break;
    const t = s.test?.adimlar?.[x.a.id];
    if (t?.veri !== undefined) { adim[String(x.no)] = t.veri; adim[x.a.id] = t.veri; }
  }
  const degisken = (await calismaDegiskenleri(sahipOzeti(sahip)).catch(() => ({ degisken: {} }))).degisken;
  const ornek = { tetik: s.test?.sabitTetik ?? s.test?.tetik ?? s.test?.sonTetik ?? {}, adim, degisken, sir: {} };
  const r = await kodYaz(s.ayar.model, tarif, ornek, String(g.kod ?? ""));
  if ("hata" in r) return hata(r.hata, 502);
  if (r.kredi) await sistemGuncelle(id, sahip, (x) => { x.ozet.kredi += r.kredi; }).catch(() => {});
  return Response.json({ ok: true, ...r });
}
