import { ajanGetir } from "@/lib/build/ajanDepo";
import { calismaGetir, calismaGuncelle, calismalariListele, suz } from "@/lib/build/ajanCalismaDepo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Çalışma geçmişi. ?c=<kimlik> tek çalışmanın tam izi (alt ajan çalışmaları ?ajan=<altAjan> ile, sahip aynıysa);
 * aksi halde süzgeçli liste: ?kanal= ?durum= ?ara= ?gun= ?tetik= ?sayfa= (50'şer) + kanal ve durum sayaçları.
 */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await ajanGetir(id, sahip))) return hata("Ajan bulunamadı.", 404);
  const u = new URL(req.url).searchParams;
  const c = u.get("c");
  if (c) {
    const alt = u.get("ajan");
    if (alt && alt !== id && !(await ajanGetir(alt, sahip))) return hata("Çalışma bulunamadı.", 404);
    const x = await calismaGetir(alt || id, c);
    if (!x) return hata("Çalışma bulunamadı.", 404);
    const { bekleme, ...acik } = x;
    return Response.json({ ok: true, calisma: { ...acik, bekleyen: bekleme?.aciklama } });
  }
  const hepsi = await calismalariListele(id);
  const gun = Number(u.get("gun")) || undefined;
  const donem = suz(hepsi, { gun });
  const l = suz(donem, { kanal: u.get("kanal") ?? undefined, durum: u.get("durum") ?? undefined, ara: u.get("ara") ?? undefined, tetik: u.get("tetik") ?? undefined });
  const sayfa = Math.max(0, Number(u.get("sayfa")) || 0);
  const say = (f: (x: (typeof hepsi)[number]) => string) => donem.reduce<Record<string, number>>((o, x) => { const k = f(x); o[k] = (o[k] ?? 0) + 1; return o; }, {});
  return Response.json({ ok: true, calismalar: l.slice(sayfa * 50, sayfa * 50 + 50), toplam: l.length, kanallar: say((x) => x.kanal), durumlar: say((x) => x.durum) });
}

/** { goruldu: [kimlikler] } görevler kutusunda okundu işareti. */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await ajanGetir(id, sahip))) return hata("Ajan bulunamadı.", 404);
  let g: { goruldu?: string[] } = {};
  try { g = await req.json(); } catch { /* boş */ }
  for (const c of (g.goruldu ?? []).slice(0, 200)) await calismaGuncelle(id, c, (x) => { x.goruldu = true; });
  return Response.json({ ok: true });
}
