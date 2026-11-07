import { ajanGetir, ajanSayacArtir } from "@/lib/build/ajanDepo";
import { sohbetleriListele, sohbetOlustur } from "@/lib/build/sohbetDepo";
import { klasorGetir } from "@/lib/build/sohbetKlasor";
import { klasorErisimi } from "@/lib/build/sohbetOrtak";
import { modelBul } from "@/lib/build/modeller";
import { hata, sahipAl } from "@/lib/build/sunucu";
import { calisanSohbetler } from "./calisanlar";
import { gorevleriEsitle } from "@/lib/build/sohbetGorev";

export const dynamic = "force-dynamic";

/** Sahibin sohbetleri (özet, sabitlenenler önde). ?arsiv=1 yalnız arşiv, ?klasor=<id> o klasör, ?hepsi=1 hepsi. */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return Response.json({ ok: true, sohbetler: [] });
  const u = new URL(req.url).searchParams;
  // Zamanlanmış görevlerin biten çalışmaları sohbetlerine aktarılır (sıralama ve son yanıt güncel olsun).
  await gorevleriEsitle(sahip).catch(() => 0);
  const f = { arsiv: u.get("arsiv") === "1", hepsi: u.get("hepsi") === "1", ...(u.get("klasor") ? { klasor: u.get("klasor")! } : {}) };
  return Response.json({ ok: true, sohbetler: await sohbetleriListele(sahip, new Set(calisanSohbetler.keys()), f) });
}

/** Yeni sohbet: { model?, ajanId?, klasor?, gecici?, izinModu? } → { id }. Ajanla sohbette model ajanınkidir. */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return hata("Oturum anahtarı eksik; sayfayı yenile.", 401);
  let g: { model?: string; ajanId?: string; klasor?: string; gecici?: boolean; izinModu?: "otomatik" | "onay"; ortakSahip?: string } = {};
  try { g = await req.json(); } catch { /* boş */ }
  if (g.ajanId) {
    const a = await ajanGetir(String(g.ajanId), sahip);
    if (!a) return hata("Ajan bulunamadı.", 404);
    const s = await sohbetOlustur(sahip, a.model, { ajanId: a.id, gecici: !!g.gecici });
    await ajanSayacArtir(a.id, (x) => { x.istatistik.sohbet += 1; });
    return Response.json({ ok: true, id: s.id });
  }
  // Seninle paylaşılan klasörde sohbet: ekipte olman gerekir; klasör sahibinin talimatı ve dosyaları kullanılır.
  if (g.klasor && typeof g.ortakSahip === "string") {
    const u = new URL(req.url); u.searchParams.set("sahip", g.ortakSahip);
    const e = await klasorErisimi(new Request(u, { headers: req.headers }), String(g.klasor));
    if (!e) return hata("Bu klasöre erişimin yok.", 403);
    const s = await sohbetOlustur(sahip, modelBul(g.model).id, { klasor: e.k.id, ortakKlasor: { sahipOz: e.oz, id: e.k.id }, izinModu: g.izinModu });
    return Response.json({ ok: true, id: s.id });
  }
  const klasor = g.klasor ? await klasorGetir(sahip, String(g.klasor)) : null;
  if (g.klasor && !klasor) return hata("Klasör bulunamadı.", 404);
  const s = await sohbetOlustur(sahip, modelBul(g.model).id, { klasor: klasor?.id, gecici: !!g.gecici && !klasor, izinModu: g.izinModu });
  return Response.json({ ok: true, id: s.id });
}
