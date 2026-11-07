import { projeOku } from "@/lib/build/depo";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { kancaDegistir, kancaDene, kancaOku, kancaTemizle, yeniSir, type Kanca } from "@/lib/build/bulutKanca";
import { denetimKim, denetimYaz } from "@/lib/build/bulutGecmis";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Veri kancaları (sahip ve ekip; yazma izleyiciye kapalı). GET → { kancalar, teslimler }; POST { islem: ekle | guncelle | sil | dene | sirYenile, ... } */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const p = await projeOku((await params).id, sahip);
  if (!p) return bulunamadi();
  return Response.json({ ok: true, ...(await kancaOku(p.id)) });
}

export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await projeOku(id, sahip))) return bulunamadi();
  { const engel = await izleyiciEngeli(id, sahip); if (engel) return engel; }
  let g: Partial<Kanca> & { islem?: string } = {};
  try { g = await req.json(); } catch { return hata("İstek okunamadı."); }
  const kim = await denetimKim(id, sahip);
  try {
    if (g.islem === "ekle") {
      const k = kancaTemizle(g);
      await kancaDegistir(id, (d) => { if (d.kancalar.length >= 20) throw new Error("En çok 20 kanca olabilir."); d.kancalar.push(k); });
      denetimYaz(id, { tur: "veri", kim, mesaj: `Veri kancası eklendi: ${k.ad} (${k.tablo}, ${new URL(k.adres).host})` });
      return Response.json({ ok: true, kanca: k, ...(await kancaOku(id)) });
    }
    if (g.islem === "dene") {
      const k = (await kancaOku(id)).kancalar.find((x) => x.id === g.id);
      if (!k) return hata("Kanca bulunamadı.", 404);
      return Response.json({ ok: true, teslim: await kancaDene(id, k), ...(await kancaOku(id)) });
    }
    if (g.islem === "guncelle" || g.islem === "sil" || g.islem === "sirYenile") {
      let ad = "";
      await kancaDegistir(id, (d) => {
        const i = d.kancalar.findIndex((x) => x.id === g.id);
        if (i < 0) throw new Error("Kanca bulunamadı.");
        ad = d.kancalar[i].ad;
        if (g.islem === "sil") d.kancalar.splice(i, 1);
        else if (g.islem === "sirYenile") d.kancalar[i].sir = yeniSir();
        else d.kancalar[i] = kancaTemizle(g, d.kancalar[i]);
      });
      denetimYaz(id, { tur: "veri", kim, mesaj: `Veri kancası ${g.islem === "sil" ? "silindi" : g.islem === "sirYenile" ? "imza sırrı yenilendi" : "güncellendi"}: ${ad}` });
      return Response.json({ ok: true, ...(await kancaOku(id)) });
    }
    return hata("Bilinmeyen işlem.");
  } catch (e) { return hata((e as Error).message); }
}
