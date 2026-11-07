import { projeOku, projeOkuHam, projeYaz } from "@/lib/build/depo";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { istemciIp, tarayiciAdi, ulkeBul } from "@/lib/build/bulutAyar";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { OTURUM_KIMLIK, PAKET_KIMLIK, oturumListesi, oturumSil, paketEkle } from "@/lib/build/oturumDepo";
import { OTURUM_SINIR, oturumAyarTamamla, type HamOlay } from "@/lib/build/oturumTipler";
import type { OturumAyar } from "@/lib/build/tipler";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ projeId: string }> };

/**
 * Ziyaretçi oturum kaydı.
 *  POST   (herkese açık, yayındaki sitenin kaydedicisi) { o: oturum, p: sayfa yüklemesi, s: sıra, e: rrweb olayları }
 *         text/plain gelir (kum havuzundaki sayfadan ön uçuşsuz). Yanıt { ok, dur }: dur geldiğinde kaydedici durur.
 *  GET    (sahip) ayar, oturum özetleri, toplam boyut
 *  PATCH  (sahip ya da düzenleyici) { ayar } kayıt ayarlarını değiştirir
 *  DELETE (sahip ya da düzenleyici) ?oturum=<id> tek oturumu, yoksa bütün oturumları siler
 * İzleyici rolündeki ekip üyesi listeyi görür ve oynatır, ayar değiştiremez ve silemez (403).
 */
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-build-sahip" };
const yanit = (b: Record<string, unknown>, durum = 200) => Response.json(b, { status: durum, headers: CORS });
/** IP başına dakikada en çok 90 paket (bellekte; IP yazılmaz). */
const hiz: Map<string, number[]> = ((globalThis as unknown as { __vayraOturumHiz?: Map<string, number[]> }).__vayraOturumHiz ??= new Map());
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|prerender/i;

export async function POST(req: Request, { params }: Ctx) {
  const id = (await params).projeId;
  if (Number(req.headers.get("content-length") || 0) > OTURUM_SINIR.istekBayt) return yanit({ ok: false, dur: true }, 413);
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return yanit({ ok: false, dur: true });
  const anahtar = `${id}:${istemciIp(req)}`, simdi = Date.now();
  const l = (hiz.get(anahtar) ?? []).filter((t) => simdi - t < 60_000);
  l.push(simdi); hiz.set(anahtar, l);
  if (hiz.size > 20_000) for (const [k, v] of hiz) if (!v.length || simdi - v[v.length - 1] > 60_000) hiz.delete(k);
  if (l.length > 90) return yanit({ ok: false }, 429);

  const p = await projeOkuHam(id);
  const ayar = oturumAyarTamamla(p?.ayarlar.oturum);
  if (!p?.yayin || !ayar.acik) return yanit({ ok: false, dur: true });
  const ham = await req.text();
  if (ham.length > OTURUM_SINIR.istekBayt) return yanit({ ok: false, dur: true }, 413);
  let g: { o?: unknown; p?: unknown; s?: unknown; e?: unknown };
  try { g = JSON.parse(ham); } catch { return yanit({ ok: false }, 400); }
  const o = String(g.o ?? ""), pk = String(g.p ?? ""), s = Number(g.s);
  if (!OTURUM_KIMLIK.test(o) || !PAKET_KIMLIK.test(pk) || !Number.isInteger(s) || s < 1 || s > 1e6 || !Array.isArray(g.e)) return yanit({ ok: false }, 400);
  const e = (g.e as unknown[]).slice(0, 20_000).filter((x): x is HamOlay => !!x && typeof x === "object" && Number.isInteger((x as HamOlay).type) && (x as HamOlay).type >= 0 && (x as HamOlay).type <= 6 && Number.isFinite((x as HamOlay).timestamp));
  if (!e.length) return yanit({ ok: true });
  const dil = (req.headers.get("accept-language") ?? "").slice(0, 2).toLowerCase();
  const r = await paketEkle(id, { o, p: pk, s, e }, { bayt: ham.length, saklama: ayar.saklama, tarayici: tarayiciAdi(ua), ulke: ulkeBul(req), dil: /^[a-z]{2}$/.test(dil) ? dil : undefined });
  return yanit(r);
}

export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).projeId;
  const p = await projeOku(id, sahip);
  if (!p) return bulunamadi();
  const ayar = oturumAyarTamamla(p.ayarlar.oturum);
  const oturumlar = await oturumListesi(id, ayar.saklama);
  return Response.json({
    ok: true, ayar, yayinda: !!p.yayin, oturumlar,
    toplam: { adet: oturumlar.length, bayt: oturumlar.reduce((t, x) => t + x.bayt, 0), sinir: OTURUM_SINIR.projeBayt },
    // Vayra Build sitelere çerez bandı eklemez; onay mekanizması vayra.kayit.onayla() ile sitenin kendi bandına bırakılır.
    cerezBandi: false,
  });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).projeId;
  const p = await projeOku(id, sahip);
  if (!p) return bulunamadi();
  { const engel = await izleyiciEngeli(id, sahip); if (engel) return engel; }
  let g: { ayar?: Partial<OturumAyar> };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  if (!g.ayar || typeof g.ayar !== "object") return hata("Ayar eksik.");
  const ayar = oturumAyarTamamla({ ...oturumAyarTamamla(p.ayarlar.oturum), ...g.ayar });
  p.ayarlar.oturum = ayar;
  try { await projeYaz(p, sahip); } catch (e) { return hata((e as Error).message); }
  return Response.json({ ok: true, ayar });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).projeId;
  if (!(await projeOku(id, sahip))) return bulunamadi();
  { const engel = await izleyiciEngeli(id, sahip); if (engel) return engel; }
  const o = new URL(req.url).searchParams.get("oturum");
  if (o && !OTURUM_KIMLIK.test(o)) return hata("Geçersiz oturum.");
  return Response.json({ ok: true, silinen: await oturumSil(id, o ?? undefined) });
}

export function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }
