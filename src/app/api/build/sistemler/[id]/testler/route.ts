import { sahipOzeti } from "@/lib/build/depo";
import { sistemGetir, sistemGuncelle, yeniKimlik } from "@/lib/build/sistemDepo";
import { testleriCalistir, type TestOlcut, type TestVakasi } from "@/lib/build/sistemDegerlendir";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const OLCUT: TestOlcut[] = ["basarili", "esit", "iceriyor", "benzerlik", "yz"];

/** Test vakaları ve son koşular. */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const s = await sistemGetir((await params).id, sahip);
  if (!s) return hata("Sistem bulunamadı.", 404);
  return Response.json({ ok: true, testler: s.testler ?? [], kosular: s.degerlendirmeler ?? [] });
}

/** { islem: "kaydet", testler } vakaları yazar (en çok 50); { islem: "calistir", secili? } koşuyu başlatır. */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  let g: { islem?: string; testler?: Partial<TestVakasi>[]; secili?: string[] } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  if (g.islem === "kaydet") {
    if (!Array.isArray(g.testler)) return hata("Test listesi yok.");
    if (JSON.stringify(g.testler).length > 200_000) return hata("Testler çok büyük.");
    const l: TestVakasi[] = g.testler.slice(0, 50).map((t, i) => ({
      id: typeof t.id === "string" && /^[A-Za-z0-9_-]{1,16}$/.test(t.id) ? t.id : yeniKimlik(8), ad: String(t.ad ?? `Test ${i + 1}`).slice(0, 80) || `Test ${i + 1}`,
      girdi: t.girdi ?? {}, beklenen: typeof t.beklenen === "string" ? t.beklenen.slice(0, 4000) : undefined, olcut: OLCUT.includes(t.olcut as TestOlcut) ? t.olcut as TestOlcut : "basarili",
      ...(Number(t.esik) > 0 ? { esik: Math.min(100, Math.round(Number(t.esik))) } : {}),
    }));
    const r = await sistemGuncelle(id, sahip, (s) => { s.testler = l; });
    return r?.sistem ? Response.json({ ok: true, testler: r.sistem.testler }) : hata("Sistem bulunamadı.", 404);
  }
  if (g.islem === "calistir") {
    const s = await sistemGetir(id, sahip);
    if (!s) return hata("Sistem bulunamadı.", 404);
    if ((s.degerlendirmeler ?? []).some((k) => !k.bitti && Date.now() - k.zaman < 15 * 60_000)) return hata("Bir test koşusu zaten sürüyor.");
    const r = await testleriCalistir(id, sahipOzeti(sahip), Array.isArray(g.secili) ? g.secili.filter((x) => typeof x === "string") : undefined);
    return "hata" in r ? hata(r.hata) : Response.json({ ok: true, kosu: r.kosu });
  }
  return hata("Bilinmeyen işlem.");
}
