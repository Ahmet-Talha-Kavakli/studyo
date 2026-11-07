import { projeOku } from "@/lib/build/depo";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { veriOku } from "@/lib/build/veri";
import { sorguCalistir, SorguHatasi, sorguDeposu, sorguDeposuDegistir, yeniSorguId } from "@/lib/build/bulutSorgu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Sorgu konsolu (salt okunur; sahip ve ekip). Kayıtlı sorgular projede paylaşılır, geçmiş son 40 çalıştırmadır.
 *  GET                                   → { kayitli, gecmis, tablolar: [{ ad, adet, sutunlar }] }   ?ortam=test
 *  POST { islem: "calistir", metin, ortam? } → { sutunlar, satirlar, toplam, kesildi, sure, plan, uyarilar } | { hata, konum }
 *  POST { islem: "kaydet", ad, metin, id? }   POST { islem: "sil", id }   POST { islem: "yildiz", id }
 */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const p = await projeOku((await params).id, sahip);
  if (!p) return bulunamadi();
  const ortam = new URL(req.url).searchParams.get("ortam") === "test" ? "test" : "canli";
  const [d, v] = await Promise.all([sorguDeposu(p.id), veriOku(p.id, ortam)]);
  const tablolar = Object.entries(v.koleksiyonlar).map(([ad, k]) => {
    const sutunlar = new Map<string, string>((k.sema ?? []).map((s) => [s.ad, s.tur]));
    for (const r of k.kayitlar.slice(-50)) for (const [a, x] of Object.entries(r)) if (!sutunlar.has(a) && !["id", "olusturma", "guncelleme", "uyeId"].includes(a)) sutunlar.set(a, typeof x === "number" ? "sayi" : typeof x === "boolean" ? "mantiksal" : "metin");
    return { ad, adet: k.kayitlar.length, sutunlar: [...sutunlar.entries()].map(([a, tur]) => ({ ad: a, tur, iliski: k.sema?.find((s) => s.ad === a)?.iliski })) };
  });
  return Response.json({ ok: true, ...d, tablolar });
}

export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await projeOku(id, sahip))) return bulunamadi();
  let g: { islem?: string; metin?: string; ortam?: string; ad?: string; id?: string } = {};
  try { g = await req.json(); } catch { return hata("İstek okunamadı."); }
  if (g.islem === "calistir") {
    const metin = String(g.metin ?? "");
    try {
      const s = await sorguCalistir(id, metin, g.ortam === "test" ? "test" : "canli");
      await sorguDeposuDegistir(id, (d) => { d.gecmis = [{ metin, z: Date.now(), sure: s.sure, adet: s.toplam }, ...d.gecmis.filter((x) => x.metin !== metin)]; });
      return Response.json({ ok: true, ...s });
    } catch (e) {
      const m = e instanceof SorguHatasi ? e.message : "Sorgu çalıştırılamadı.";
      await sorguDeposuDegistir(id, (d) => { d.gecmis = [{ metin, z: Date.now(), sure: 0, adet: 0, hata: m }, ...d.gecmis.filter((x) => x.metin !== metin)]; }).catch(() => {});
      return Response.json({ ok: false, hata: m, konum: e instanceof SorguHatasi ? e.konum ?? null : null }, { status: 400 });
    }
  }
  { const engel = await izleyiciEngeli(id, sahip); if (engel) return engel; }
  if (g.islem === "kaydet") {
    const ad = String(g.ad ?? "").trim().slice(0, 60), metin = String(g.metin ?? "").slice(0, 5000);
    if (!ad || !metin.trim()) return hata("Ad ve sorgu gerekli.");
    const k = await sorguDeposuDegistir(id, (d) => {
      const var_ = g.id ? d.kayitli.find((x) => x.id === g.id) : undefined;
      if (var_) { var_.ad = ad; var_.metin = metin; var_.z = Date.now(); return var_; }
      const y = { id: yeniSorguId(), ad, metin, z: Date.now() };
      d.kayitli.unshift(y);
      return y;
    });
    return Response.json({ ok: true, sorgu: k, ...(await sorguDeposu(id)) });
  }
  if (g.islem === "sil" || g.islem === "yildiz") {
    await sorguDeposuDegistir(id, (d) => { if (g.islem === "sil") d.kayitli = d.kayitli.filter((x) => x.id !== g.id); else { const x = d.kayitli.find((y) => y.id === g.id); if (x) x.yildiz = !x.yildiz; } });
    return Response.json({ ok: true, ...(await sorguDeposu(id)) });
  }
  return hata("Bilinmeyen işlem.");
}
