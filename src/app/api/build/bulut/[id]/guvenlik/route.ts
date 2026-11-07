import { guvenlikDenetimi } from "@/lib/build/bulut";
import { kovalar, kovalariYaz } from "@/lib/build/depolama";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { projeOku, projeYaz } from "@/lib/build/depo";
import { gunlukYaz } from "@/lib/build/gunluk";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { KURALLAR, veriDegistir, type Kural } from "@/lib/build/veri";
import { acikSorgula, bagimliliklariCikar } from "@/lib/build/bulutBagimlilik";
import { sizintiTara } from "@/lib/build/bulutSizinti";
import { aiDuzeltmeOner } from "@/lib/build/bulutGuvenlikAi";
import { denetimKim, denetimYaz } from "@/lib/build/bulutGecmis";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Güvenlik taraması.
 *  GET  ?surum=son|yayin            bulgular (varsayılan: son sürüm, yani bir sonraki yayın)
 *  POST { duzelt: id }              tek tıkla düzeltme (kural, kova, sır görünürlüğü)
 *  POST { yoksay: { id, neden } }   gerekçeyle yok say      POST { geriAl: id }  yok saymayı kaldır
 *  POST { kritikteDurdur: boolean } kritik bulguda yayını durdurma ayarı
 *  GET  ?kapsam=bagimlilik          bağımlılık listesi (SBOM) ve OSV.dev bilinen açıkları
 *  GET  ?kapsam=sizinti             sızdırılmış anahtar taraması (taslak, bütün sürümler, herkese açık ortam değişkenleri)
 *  POST { aiOner: id }              yapay zekâ düzeltme önerisi (kural ve ajan isteği; uygulamaz)
 *  POST { kuralUygula: { tablo, kurallar } }   önerilen ya da elle seçilen erişim kuralını uygular
 */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const p = await projeOku((await params).id, sahip);
  if (!p) return bulunamadi();
  const kapsam = new URL(req.url).searchParams.get("kapsam");
  if (kapsam === "bagimlilik") {
    const dosyalar = p.surumler.at(-1)?.dosyalar ?? p.dosyalar;
    const yayindaki = p.yayin ? p.surumler.find((x) => x.id === p.yayin!.surumId)?.dosyalar ?? {} : {};
    const l = bagimliliklariCikar({ ...dosyalar });
    const yayin = new Set(bagimliliklariCikar(yayindaki).map((b) => `${b.ad}@${b.surum ?? "?"}`));
    const r = await acikSorgula(l);
    return Response.json({ ok: true, ...r, bagimliliklar: r.bagimliliklar.map((b) => ({ ...b, yayinda: yayin.has(`${b.ad}@${b.surum ?? "?"}`) })) });
  }
  if (kapsam === "sizinti") return Response.json({ ok: true, sizintilar: sizintiTara(p), surum: p.surumler.length, zaman: Date.now() });
  const surum = new URL(req.url).searchParams.get("surum") === "yayin" ? null : p.surumler.at(-1);
  const bulgular = await guvenlikDenetimi(p, surum?.dosyalar ?? (p.yayin ? undefined : p.dosyalar));
  return Response.json({ ok: true, bulgular, kritikteDurdur: p.ayarlar.kritikteDurdur !== false, zaman: Date.now() });
}

export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const p = await projeOku((await params).id, sahip);
  { const engel = await izleyiciEngeli((await params).id, sahip); if (engel) return engel; }
  if (!p) return bulunamadi();
  let g: { duzelt?: string; yoksay?: { id?: string; neden?: string }; geriAl?: string; kritikteDurdur?: boolean; aiOner?: string; kuralUygula?: { tablo?: string; kurallar?: Record<string, string> } };
  try { g = await req.json(); } catch { return hata("Geçersiz gövde."); }

  if (g.aiOner) {
    const dosyalar = p.surumler.at(-1)?.dosyalar ?? p.dosyalar;
    const b = (await guvenlikDenetimi(p, dosyalar)).find((x) => x.id === g.aiOner) ?? (await guvenlikDenetimi(p)).find((x) => x.id === g.aiOner);
    if (!b) return hata("Bulgu artık yok; taramayı yenile.", 404);
    try { return Response.json({ ok: true, oneri: await aiDuzeltmeOner(p, b, dosyalar, req.signal) }); }
    catch (e) { return hata((e as Error).message, 503); }
  }
  if (g.kuralUygula) {
    const tablo = String(g.kuralUygula.tablo ?? "");
    const k = g.kuralUygula.kurallar ?? {};
    if (!(["okuma", "ekleme", "duzenleme"] as const).every((x) => KURALLAR.includes(k[x] as Kural))) return hata("Okuma, ekleme ve düzenleme kuralını seç.");
    const kim = await denetimKim(p.id, sahip);
    const var_ = await veriDegistir(p.id, (v) => {
      const t = v.koleksiyonlar[tablo];
      if (!t) return false;
      t.kurallar = { okuma: k.okuma as Kural, ekleme: k.ekleme as Kural, duzenleme: k.duzenleme as Kural };
      return true;
    });
    if (!var_) return hata("Tablo bulunamadı.", 404);
    denetimYaz(p.id, { tur: "kural", kim, mesaj: `"${tablo}" güvenlik danışmanından düzeltildi: okuma ${k.okuma}, ekleme ${k.ekleme}, düzenleme ${k.duzenleme}` });
    gunlukYaz(p.id, { t: "yayin", m: `Güvenlik düzeltmesi: "${tablo}" erişim kuralları güncellendi` });
    return Response.json({ ok: true });
  }
  if (typeof g.kritikteDurdur === "boolean") { p.ayarlar.kritikteDurdur = g.kritikteDurdur; await projeYaz(p, sahip); return Response.json({ ok: true }); }
  if (g.yoksay?.id) {
    const neden = String(g.yoksay.neden ?? "").trim().slice(0, 300);
    if (neden.length < 3) return hata("Yok sayma gerekçesi yaz.");
    p.ayarlar.guvenlikYoksay = [...(p.ayarlar.guvenlikYoksay ?? []).filter((x) => x.id !== g.yoksay!.id), { id: g.yoksay.id, neden, zaman: Date.now() }].slice(-100);
    await projeYaz(p, sahip);
    gunlukYaz(p.id, { t: "yayin", m: `Güvenlik bulgusu yok sayıldı: ${neden}` });
    return Response.json({ ok: true });
  }
  if (g.geriAl) { p.ayarlar.guvenlikYoksay = (p.ayarlar.guvenlikYoksay ?? []).filter((x) => x.id !== g.geriAl); await projeYaz(p, sahip); return Response.json({ ok: true }); }
  if (g.duzelt) {
    const b = (await guvenlikDenetimi(p, p.surumler.at(-1)?.dosyalar)).find((x) => x.id === g.duzelt) ?? (await guvenlikDenetimi(p)).find((x) => x.id === g.duzelt);
    if (!b?.duzelt) return hata("Bu bulgu için tek tıkla düzeltme yok.");
    const d = b.duzelt;
    if (d.tur === "kural") {
      await veriDegistir(p.id, (v) => {
        const k = v.koleksiyonlar[d.tablo];
        if (!k) return;
        for (const a of ["okuma", "ekleme", "duzenleme"] as const) { const yeni = d.kurallar[a] as Kural | undefined; if (yeni && KURALLAR.includes(yeni)) k.kurallar[a] = yeni; }
      });
    } else if (d.tur === "kova") {
      await kovalariYaz(p.id, (await kovalar(p.id)).map((k) => (k.ad === d.kova ? { ...k, yukleme: "uyeler" as const } : k)));
    } else if (d.tur === "sir") {
      p.ayarlar.sirlar = p.ayarlar.sirlar.map((x) => (x.ad === d.ad ? { ...x, gorunurluk: "sunucu" as const } : x));
      await projeYaz(p, sahip);
    }
    gunlukYaz(p.id, { t: "yayin", m: `Güvenlik düzeltmesi: ${d.etiket} (${b.baslik})` });
    return Response.json({ ok: true });
  }
  return hata("İşlem belirtilmedi.");
}
