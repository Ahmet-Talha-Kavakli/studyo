import { ajanGetir } from "@/lib/build/ajanDepo";
import { calismaGuncelle } from "@/lib/build/ajanCalismaDepo";
import { bekleyeniSurdur, gorevleriTopla } from "@/lib/build/ajanGorev";
import { ajanZamanlayiciBaslat } from "@/lib/build/ajanZamanlayici";
import { sahipOzeti } from "@/lib/build/depo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
ajanZamanlayiciBaslat();

/** Görevler kutusu: ?sayac=1 yalnız bildirim sayısı; aksi halde sekmeler + ajan listesi. */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return Response.json({ ok: true, sayac: 0, onay: [], hata: [], tamam: [], devir: [], ajanlar: [] });
  const v = await gorevleriTopla(sahipOzeti(sahip));
  if (new URL(req.url).searchParams.get("sayac")) return Response.json({ ok: true, sayac: v.sayac, onay: v.onay.length });
  return Response.json({ ok: true, ...v });
}

type Oge = { ajanId: string; calisma: string };
/**
 * Toplu işlem: { islem: "onayla" | "reddet", ogeler: [{ ajanId, calisma }], hep? } onay bekleyen çalışmaları sürdürür
 * (sırayla); { islem: "goruldu", ogeler } hataları okundu sayar. Dönüş: öğe başına sonuç.
 */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: { islem?: string; ogeler?: Oge[]; hep?: boolean } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const ogeler = (g.ogeler ?? []).filter((x) => x && typeof x.ajanId === "string" && typeof x.calisma === "string").slice(0, 50);
  if (!ogeler.length) return hata("Seçili öğe yok.");
  const sahipOz = sahipOzeti(sahip);
  const sonuclar: { ajanId: string; calisma: string; durum?: string; hata?: string }[] = [];
  for (const o of ogeler) {
    if (!(await ajanGetir(o.ajanId, sahip))) { sonuclar.push({ ...o, hata: "Ajan bulunamadı." }); continue; }
    if (g.islem === "goruldu") { await calismaGuncelle(o.ajanId, o.calisma, (c) => { c.goruldu = true; }); sonuclar.push({ ...o, durum: "goruldu" }); continue; }
    if (g.islem !== "onayla" && g.islem !== "reddet") return hata("Bilinmeyen işlem.");
    const r = await bekleyeniSurdur(o.ajanId, sahipOz, o.calisma, g.islem === "onayla" ? "onay" : "ret", !!g.hep);
    sonuclar.push({ ...o, durum: r.calisma?.durum, hata: r.hata });
  }
  return Response.json({ ok: true, sonuclar });
}
