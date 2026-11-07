import { paylasimGetir, skillMd } from "@/lib/build/yetenekDepo";
import { zipYap } from "@/lib/build/yetenekPaket";
import { hata } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ anahtar: string }> };

/** Paylaşılan yetenek (herkese açık, salt okuma): ?bicim=json (varsayılan) | md (SKILL.md) | zip (klasör). */
export async function GET(req: Request, { params }: Ctx) {
  const y = await paylasimGetir((await params).anahtar);
  if (!y) return hata("Paylaşım bulunamadı ya da kapatılmış.", 404);
  const bicim = new URL(req.url).searchParams.get("bicim");
  const md = skillMd(y);
  if (bicim === "md") return new Response(md, { headers: { "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="${y.ad}-SKILL.md"` } });
  if (bicim === "zip") {
    const d: Record<string, string> = { "SKILL.md": md };
    for (const f of y.dosyalar) d[f.yol] = f.icerik;
    return new Response(new Uint8Array(zipYap(d, y.ad)), { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${y.ad}.zip"` } });
  }
  return Response.json({ ok: true, yetenek: { ad: y.ad, baslik: y.baslik, aciklama: y.aciklama, govde: y.govde, simge: y.simge, dosyalar: y.dosyalar.map((d) => ({ yol: d.yol, boyut: d.icerik.length })), surum: y.sabitSurum ?? y.surum, cagri: y.cagri ?? "model", gerekenBaglantilar: y.gerekenBaglantilar ?? [], kaynak: y.kaynak, guncelleme: y.guncelleme }, skillMd: md });
}
