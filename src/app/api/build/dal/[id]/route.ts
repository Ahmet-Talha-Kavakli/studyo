import { projeOku, projeSil, projeYaz, surumEkle } from "@/lib/build/depo";
import { gunlukYaz } from "@/lib/build/gunluk";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** İki dosya kümesi arasındaki değişen yollar. */
function farklar(a: Record<string, string>, b: Record<string, string>) {
  const yollar = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...yollar].filter((y) => a[y] !== b[y]).map((y) => ({ yol: y, tur: !(y in a) ? "eklendi" as const : !(y in b) ? "silindi" as const : "degisti" as const }));
}

/**
 * Deneme dalı (proje taslağı) ↔ ana proje.
 *  GET                    durum: ana proje, dal açıldığından beri ana değişti mi, dalda değişen dosyalar
 *  POST { zorla?, sil? }  dalın dosyalarını ana projeye yeni sürüm olarak uygular; ana bu arada değiştiyse zorla gerekir.
 *                         sil (varsayılan açık): uyguladıktan sonra dalı siler.
 */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const d = await projeOku((await params).id, sahip);
  if (!d?.taslak) return bulunamadi();
  const a = await projeOku(d.taslak.anaId, sahip);
  if (!a) return Response.json({ ok: true, ana: null, degisen: [] });
  const baslangic = a.surumler.find((s) => s.no === d.taslak!.anaSurumNo)?.dosyalar ?? a.dosyalar;
  return Response.json({
    ok: true,
    ana: { id: a.id, ad: a.ad, sonSurumNo: a.surumler.at(-1)?.no ?? 0 },
    anaDegisti: (a.surumler.at(-1)?.no ?? 0) > d.taslak.anaSurumNo,
    degisen: farklar(baslangic, d.dosyalar),
    anaDegisen: farklar(baslangic, a.dosyalar).map((x) => x.yol),
  });
}

export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const d = await projeOku((await params).id, sahip);
  { const engel = await izleyiciEngeli((await params).id, sahip); if (engel) return engel; }
  if (!d?.taslak) return bulunamadi();
  const a = await projeOku(d.taslak.anaId, sahip);
  if (!a) return hata("Ana proje bulunamadı; silinmiş olabilir.", 404);
  let g: { zorla?: boolean; sil?: boolean } = {};
  try { g = await req.json(); } catch { /* boş */ }
  const anaSon = a.surumler.at(-1)?.no ?? 0;
  // Dosya düzeyinde üç yollu birleştirme: taban = dal açıldığındaki ana sürüm. Yalnız dalda değişen dosya dalın,
  // yalnız anada değişen dosya ananın olur; ikisinde de farklı değişen dosya çakışmadır (zorla ile dalınki geçer).
  const taban = a.surumler.find((s) => s.no === d.taslak!.anaSurumNo)?.dosyalar ?? a.dosyalar;
  const sonuc: Record<string, string> = { ...a.dosyalar };
  const catisan: string[] = [];
  for (const y of new Set([...Object.keys(taban), ...Object.keys(d.dosyalar), ...Object.keys(a.dosyalar)])) {
    const t = taban[y], dl = d.dosyalar[y], an = a.dosyalar[y];
    if (dl === t) continue;
    if (an !== t && an !== dl) { catisan.push(y); if (!g.zorla) continue; }
    if (dl === undefined) delete sonuc[y]; else sonuc[y] = dl;
  }
  if (catisan.length && !g.zorla) return Response.json({ ok: false, hata: `Ana proje dal açıldıktan sonra değişti ve şu dosyalar iki tarafta da farklı değişti: ${catisan.slice(0, 5).join(", ")}${catisan.length > 5 ? " ve diğerleri" : ""}. Uygularsan bu dosyalarda dalın hali geçer.`, catisma: catisan }, { status: 409 });
  const s = surumEkle(a, sonuc, `Deneme dalı uygulandı: ${d.ad}`.slice(0, 120), "elle");
  await projeYaz(a, sahip);
  gunlukYaz(a.id, { t: "yayin", m: `Deneme dalı uygulandı: ${d.ad}${s ? ` (sürüm ${s.no})` : ""}` });
  if (g.sil !== false) await projeSil(d.id, sahip).catch(() => {});
  else { d.taslak = { ...d.taslak, anaSurumNo: s?.no ?? anaSon }; await projeYaz(d, sahip); }
  return Response.json({ ok: true, anaId: a.id, surumNo: s?.no ?? anaSon, degisen: s?.degisen.length ?? 0 });
}
