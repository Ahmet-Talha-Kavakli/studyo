import type { Zamanlama } from "@/lib/build/sistemKatalog";
import { gorevGorunumleri, gorevleriEsitle, gorevOlustur } from "@/lib/build/sohbetGorev";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Zamanlanmış görevler (biten çalışmalar önce sohbetlere aktarılır). */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return Response.json({ ok: true, gorevler: [] });
  await gorevleriEsitle(sahip).catch(() => 0);
  return Response.json({ ok: true, gorevler: await gorevGorunumleri(sahip) });
}

/** Yeni görev: { ad, istem, zaman, model?, sohbet?, sablon? } → { gorev }. Sohbet verilmezse görevin sohbeti açılır. */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: { ad?: string; istem?: string; zaman?: Zamanlama; model?: string; sohbet?: string; sablon?: string };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  if (!g.zaman || typeof g.zaman !== "object") return hata("Zamanlama gerekli.");
  const r = await gorevOlustur(sahip, { ad: String(g.ad ?? ""), istem: String(g.istem ?? ""), zaman: g.zaman, model: g.model, sohbet: g.sohbet, sablon: g.sablon });
  if ("hata" in r) return hata(r.hata);
  return Response.json({ ok: true, gorev: r.gorev });
}
