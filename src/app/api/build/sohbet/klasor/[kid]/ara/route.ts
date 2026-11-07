import { sohbetAra } from "@/lib/build/sohbetDepo";
import { klasorErisimi } from "@/lib/build/sohbetOrtak";
import { katla, sorguBos, sorguCoz } from "@/lib/build/sohbetTipler";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { calisanSohbetler } from "../../../calisanlar";

export const dynamic = "force-dynamic";

/**
 * Klasör içinde arama (?q=): klasördeki sohbetler (senin sohbetlerin), bilgi dosyaları, talimat ve klasör belleği.
 * "tam ifade", -hariç ve Türkçe karakter duyarsız eşleşme; dosyalarda eşleşen parçalar döner.
 */
export async function GET(req: Request, { params }: { params: Promise<{ kid: string }> }) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const kid = (await params).kid;
  const e = await klasorErisimi(req, kid);
  if (!e) return hata("Klasör bulunamadı.", 404);
  const q = (new URL(req.url).searchParams.get("q") ?? "").slice(0, 160);
  const s = sorguCoz(q);
  if (sorguBos(s)) return Response.json({ ok: true, sohbetler: [], dosyalar: [], bellek: [], talimat: [] });
  const terimler = [...s.ifadeler, ...s.kelimeler];
  const tutar = (m: string) => { const k = katla(m); return terimler.every((t) => k.includes(t)) && !s.haric.some((t) => k.includes(t)); };
  const parcalar = (metin: string, n = 3) => {
    const o: string[] = [], k = katla(metin);
    let i = k.indexOf(terimler[0]);
    while (i >= 0 && o.length < n) { const b = Math.max(0, i - 80); o.push(`${b > 0 ? "…" : ""}${metin.slice(b, i + 160).replace(/\s+/g, " ").trim()}…`); i = k.indexOf(terimler[0], i + 200); }
    return o;
  };
  const sohbetler = (await sohbetAra(sahip, q, new Set(calisanSohbetler.keys()), { klasor: kid, sinir: 20, arsiv: true }))
    .map((x) => ({ id: x.id, baslik: x.baslik, guncelleme: x.guncelleme, eslesmeler: (x.eslesmeler ?? []).map((m) => ({ mesajId: m.mesajId, parca: m.parca })) }));
  const dosyalar = e.k.dosyalar.filter((d) => tutar(`${d.ad}\n${d.icerik}`)).map((d) => ({ id: d.id, ad: d.ad, tur: d.tur, parcalar: parcalar(d.icerik) }));
  const bellek = (e.k.kayitlar ?? []).filter((x) => tutar(x.metin)).map((x) => ({ id: x.id, metin: x.metin }));
  const talimat = tutar(e.k.talimat) ? parcalar(e.k.talimat, 2) : [];
  return Response.json({ ok: true, sohbetler, dosyalar, bellek, talimat });
}
