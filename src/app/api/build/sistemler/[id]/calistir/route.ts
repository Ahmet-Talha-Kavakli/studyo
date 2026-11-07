import { sahipOzeti } from "@/lib/build/depo";
import { calismaOku, calismaOzetleri, calismalariOku, sistemGetir, sistemGuncelle } from "@/lib/build/sistemDepo";
import { sistemBaslat } from "@/lib/build/sistemMotoru";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Çalıştır: { veri?, kaynak? } — kaynak "taslak" (varsayılan; düzenleyicideki deneme, kuyruğa girmez) ya da "canli"
 * (yayındaki sürüm, "Elle" tetik; eşzamanlılık sınırı doluysa kuyruğa girer). Çalışma arka planda sürer; yanıt
 * ilk kayıt yazılınca döner, ilerleme GET ile izlenir.
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const s = await sistemGetir(id, sahip);
  if (!s) return hata("Sistem bulunamadı.", 404);
  let g: { veri?: unknown; kaynak?: "taslak" | "canli"; baslangic?: string } = {};
  try { g = await req.json(); } catch { /* boş */ }
  const canli = g.kaynak === "canli";
  if (canli && !s.yayin && !s.adimlar.length) return hata("Önce bir adım ekle ve yayınla.");
  if (!canli && !s.adimlar.length) return hata("Önce bir adım ekle.");
  if (JSON.stringify(g.veri ?? null).length > 100_000) return hata("Deneme verisi çok büyük.");
  const koken = new URL(req.url).origin.replace("0.0.0.0", "localhost");
  if (s.koken !== koken || (!canli && s.test?.tetik === undefined)) await sistemGuncelle(id, sahip, (x) => { x.koken = koken; if (!canli && x.test?.tetik === undefined) x.test = { ...(x.test ?? {}), tetik: g.veri ?? {} }; });
  // Sistem kendini çağırıyorsa en yeni çalışma alt çalışma olabilir: başlatılan çalışmanın kimliğini bekle.
  const baslangic = !canli && typeof g.baslangic === "string" && /^[A-Za-z0-9_-]{1,16}$/.test(g.baslangic) ? g.baslangic : undefined;
  const r = await sistemBaslat(id, sahipOzeti(sahip), { tur: canli ? "elle" : "deneme", veri: g.veri ?? {} }, { zorla: true, baslangic });
  if (!r) return hata(baslangic ? "Bu adımdan başlatılamıyor: döngü, paralel dal ya da hata dalı içindeki adımlar için baştan dene." : "Sistem bulunamadı.", baslangic ? 400 : 404);
  r.bitti.catch(() => {});
  for (let i = 0; i < 30; i++) {
    const c = await calismaOku(id, r.c.id);
    if (c) return Response.json({ ok: true, calisma: c });
    await new Promise((x) => setTimeout(x, 100));
  }
  return Response.json({ ok: true, calisma: null });
}

/** Son çalışma özetleri (?n=, en çok 200) ve en sonuncunun tamamı. */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await sistemGetir(id, sahip))) return hata("Sistem bulunamadı.", 404);
  const n = Math.max(1, Math.min(200, Number(new URL(req.url).searchParams.get("n")) || 40));
  const l = (await calismaOzetleri(id)).slice(0, n);
  return Response.json({ ok: true, calismalar: l, sonCalisma: l[0] ? (await calismalariOku(id, 1))[0] ?? null : null });
}
