import { sahipOzeti } from "@/lib/build/depo";
import { calismaOku, calismaOzetleri, sistemGetirOz, sistemKimlikleri, type CalismaOzeti } from "@/lib/build/sistemDepo";
import { sahipAl } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/**
 * Tüm sistemlerin çalışmaları: ?durum=basarisiz,bekliyor &sistem=<id> &tetik=webhook &bas=2026-11-01 &son=2026-11-05
 * &q=metin (özette; "derin=1" ile adım girdi ve çıktılarında da) &sayfa=0 (50'şer).
 */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return Response.json({ ok: true, calismalar: [], toplam: 0, sistemler: [], sayilar: {} });
  const oz = sahipOzeti(sahip);
  const q = new URL(req.url).searchParams;
  const durum = new Set((q.get("durum") ?? "").split(",").filter(Boolean));
  const sistem = q.get("sistem") ?? "";
  const tetik = q.get("tetik") ?? "";
  const tarih = (v: string | null, son = false) => { if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null; const [y, a, g] = v.split("-").map(Number); return Date.UTC(y, a - 1, g + (son ? 1 : 0)) - 3 * 3600_000; };
  const bas = tarih(q.get("bas")), son = tarih(q.get("son"), true);
  const ara = (q.get("q") ?? "").trim().toLocaleLowerCase("tr").slice(0, 100);
  const derin = q.get("derin") === "1";
  const sayfa = Math.max(0, Number(q.get("sayfa")) || 0);

  const sistemler: { id: string; ad: string }[] = [];
  let l: (CalismaOzeti & { sistemAd: string })[] = [];
  for (const id of await sistemKimlikleri(oz)) {
    const s = await sistemGetirOz(id, oz);
    if (!s) continue;
    sistemler.push({ id: s.id, ad: s.ad });
    if (sistem && sistem !== id) continue;
    for (const c of await calismaOzetleri(id)) l.push({ ...c, sistemAd: s.ad });
  }
  // Durum sayıları diğer süzgeçlerden sonra, durum süzgecinden önce.
  l = l.filter((c) => (!tetik || c.tetikTur === tetik) && (bas === null || c.baslangic >= bas) && (son === null || c.baslangic < son));
  if (ara) {
    const eslesen: typeof l = [];
    for (const c of l) {
      if (`${c.sistemAd} ${c.ara} ${c.id}`.toLocaleLowerCase("tr").includes(ara)) { eslesen.push(c); continue; }
      if (derin && eslesen.length < 500) { const t = await calismaOku(c.sistemId, c.id); if (t && JSON.stringify(t.adimlar.map((x) => [x.girdi, x.veri, x.hata])).toLocaleLowerCase("tr").includes(ara)) eslesen.push(c); }
    }
    l = eslesen;
  }
  const sayilar: Record<string, number> = {};
  for (const c of l) sayilar[c.durum] = (sayilar[c.durum] ?? 0) + 1;
  if (durum.size) l = l.filter((c) => durum.has(c.durum));
  l.sort((a, b) => b.baslangic - a.baslangic);
  return Response.json({ ok: true, calismalar: l.slice(sayfa * 50, sayfa * 50 + 50).map(({ ara: _a, ...c }) => c), toplam: l.length, sistemler, sayilar });
}
