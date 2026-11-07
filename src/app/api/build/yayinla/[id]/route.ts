import { guvenlikDenetimi } from "@/lib/build/bulut";
import { projeOku, projeYaz } from "@/lib/build/depo";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { gunlukYaz } from "@/lib/build/gunluk";
import { ortamAyariOku, testiCanliyaAktar } from "@/lib/build/veri";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Yayınla: { surumId? } verilmezse son sürüm yayına alınır. Her yayın değişmez bir sürüme işaret eder;
 * geçmişteki herhangi bir sürüm de yayına alınabilir (tek tık geri alma).
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const p = await projeOku((await params).id, sahip);
  { const engel = await izleyiciEngeli((await params).id, sahip); if (engel) return engel; }
  if (!p) return bulunamadi();
  let g: { surumId?: string; zorla?: boolean } = {};
  try { g = await req.json(); } catch { /* gövdesiz */ }
  const s = g.surumId ? p.surumler.find((x) => x.id === g.surumId) : p.surumler.at(-1);
  if (!s) return hata("Yayınlanacak bir sürüm yok; önce projeyi oluştur.");
  if (!s.dosyalar["index.html"]) return hata("Projede index.html yok; giriş sayfası olmadan yayınlanamaz.");
  if (p.ayarlar.gorunurluk === "sifreli" && !p.ayarlar.sifre) return hata("Şifreli yayın için önce bir şifre belirle.");
  // Kritik güvenlik bulgusu varken yayın durur (ayar kapalıysa ya da kullanıcı bilerek zorladıysa geçer).
  if (p.ayarlar.kritikteDurdur !== false && !g.zorla) {
    const kritik = (await guvenlikDenetimi(p, s.dosyalar)).filter((b) => b.seviye === "kritik" && !b.yoksayildi);
    if (kritik.length) gunlukYaz(p.id, { t: "yayin", d: 409, m: `Yayın durduruldu: ${kritik.length} kritik güvenlik sorunu` });
    if (kritik.length) return Response.json({ ok: false, hata: `Yayın durduruldu: ${kritik.length} kritik güvenlik sorunu var. Düzelt, gerekçeyle yok say ya da bilerek yayınla.`, kritik }, { status: 409 });
  }
  const once = p.yayin;
  p.yayin = { surumId: s.id, surumNo: s.no, zaman: Date.now() };
  // Yayın geçmişi (Bulut > Yayınlar): eski bir sürüme dönmek "geri" olarak işaretlenir.
  const geri = !!once && s.no < once.surumNo;
  p.yayinGecmisi = [{ surumId: s.id, surumNo: s.no, zaman: p.yayin.zaman, olay: geri ? "geri" as const : "yayin" as const }, ...(p.yayinGecmisi ?? [])].slice(0, 100);
  await projeYaz(p, sahip);
  gunlukYaz(p.id, { t: "yayin", m: geri ? `Sürüm ${s.no} yeniden yayına alındı (geri alma)` : `Sürüm ${s.no} yayınlandı: ${s.aciklama}` });
  // Test ortamı açıksa son sürüm yayınlanırken tablo yapısı (şema ve kurallar, kayıtlar değil) Canlı'ya aktarılır; önce yedek alınır.
  let aktarim: { tablolar: string[] } | null = null;
  if (!geri && s.id === p.surumler.at(-1)?.id && (await ortamAyariOku(p.id)).test) {
    aktarim = await testiCanliyaAktar(p.id).catch(() => null);
    if (aktarim?.tablolar.length) gunlukYaz(p.id, { t: "yayin", m: `Test ortamındaki ${aktarim.tablolar.length} tablonun yapısı Canlı'ya aktarıldı` });
  }
  return Response.json({ ok: true, yayin: p.yayin, adres: `/b/${p.ayarlar.altAlan}/`, aktarilanTablolar: aktarim?.tablolar ?? [] });
}

/** Yayından kaldır (dosyalar ve sürümler korunur). */
export async function DELETE(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const p = await projeOku((await params).id, sahip);
  { const engel = await izleyiciEngeli((await params).id, sahip); if (engel) return engel; }
  if (!p) return bulunamadi();
  if (p.yayin) p.yayinGecmisi = [{ surumId: p.yayin.surumId, surumNo: p.yayin.surumNo, zaman: Date.now(), olay: "kaldir" as const }, ...(p.yayinGecmisi ?? [])].slice(0, 100);
  p.yayin = null;
  await projeYaz(p, sahip);
  gunlukYaz(p.id, { t: "yayin", m: "Yayından kaldırıldı" });
  return Response.json({ ok: true });
}
