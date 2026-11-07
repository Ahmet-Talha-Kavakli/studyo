import { ajanGetir, ajanGuncelle, ajanlariListele, ajanOlustur, ayarAl, ozetle, yeniKimlik } from "@/lib/build/ajanDepo";
import { paketCoz } from "@/lib/build/ajanPaket";
import { AJAN_SABLONLARI } from "@/lib/build/ajanKatalog";
import { taslakKur } from "@/lib/build/ajanTaslak";
import { ajanZamanlayiciBaslat, tetikHazirla } from "@/lib/build/ajanZamanlayici";
import { kuralAcikla, zamanCozumle } from "@/lib/build/ajanZaman";
import { baglantilariListele } from "@/lib/build/baglantiDepo";
import { hata, sahipAl } from "@/lib/build/sunucu";
import { icerikDenetle } from "@/lib/moderasyon";

export const dynamic = "force-dynamic";
ajanZamanlayiciBaslat();

/** Sahibin ajanları (özet). */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return Response.json({ ok: true, ajanlar: [] });
  return Response.json({ ok: true, ajanlar: await ajanlariListele(sahip) });
}

/**
 * Yeni ajan: { sablon } hazır ajandan (gereken bağlantılar sahipte varsa bağlanır, hazır zamanlama kapalı tetik
 * olarak eklenir), { tarif } anlatılandan (taslak), ya da boş. Dönüş: { id, yapayZeka?, eksik? }
 */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return hata("Oturum anahtarı eksik; sayfayı yenile.", 401);
  let g: { sablon?: string; tarif?: string; ad?: string; kopya?: string; paket?: unknown } = {};
  try { g = await req.json(); } catch { /* boş */ }
  // Çoğalt: bütün ayarlar, bilgi kaynakları ve testler; yayın, tetikler, konuşmalar ve bellek kopyalanmaz.
  if (typeof g.kopya === "string") {
    const k = await ajanGetir(g.kopya, sahip);
    if (!k) return hata("Ajan bulunamadı.", 404);
    const { bellek: _b, bilgi, ...ayar } = ayarAl(k); void _b;
    const a = await ajanOlustur(sahip, { ...ayar, ad: `${k.ad} kopyası`.slice(0, 60) });
    await ajanGuncelle(a.id, sahip, (x) => {
      x.bilgi = bilgi.map((b) => ({ ...b, id: yeniKimlik(8), eklenme: Date.now() }));
      x.testler = k.testler.map((t) => ({ ...t, id: yeniKimlik(8), olusturma: Date.now() }));
    });
    return Response.json({ ok: true, id: a.id, ajan: ozetle(a) });
  }
  // İçe aktar: Vayra ajan paketi (JSON).
  if (g.paket !== undefined) {
    const p = paketCoz(g.paket);
    if ("hata" in p) return hata(p.hata);
    const d = icerikDenetle([p.ayar.ad, p.ayar.aciklama, p.ayar.talimat].filter(Boolean).join(" "));
    if (!d.izin) return hata(d.mesaj, 422);
    const a = await ajanOlustur(sahip, p.ayar);
    if (p.bilgi.length || p.testler.length) await ajanGuncelle(a.id, sahip, (x) => { x.bilgi = p.bilgi; x.testler = p.testler; });
    return Response.json({ ok: true, id: a.id, ajan: ozetle(a), uyarilar: p.uyarilar });
  }
  if (g.sablon) {
    const s = AJAN_SABLONLARI.find((x) => x.id === g.sablon);
    if (!s) return hata("Hazır ajan bulunamadı.", 404);
    const a = await ajanOlustur(sahip, { sablon: g.sablon });
    const sahipBag = (await baglantilariListele(sahip)).filter((b) => b.durum === "etkin");
    const bagla = (s.gerekli ?? []).map((k) => sahipBag.find((b) => b.katalogId === k)?.id).filter((x): x is string => !!x);
    const eksik = (s.gerekli ?? []).filter((k) => !sahipBag.some((b) => b.katalogId === k));
    const kural = s.tetik ? zamanCozumle(s.tetik.metin) : null;
    if (bagla.length || kural) {
      await ajanGuncelle(a.id, sahip, (x) => {
        if (bagla.length) x.baglantilar = bagla;
        if (kural && s.tetik) {
          const t = { id: yeniKimlik(8), tur: "zaman" as const, ad: kuralAcikla(kural), acik: false, olusturma: Date.now(), gorev: s.tetik.gorev, metin: s.tetik.metin, kural, ustUsteHata: 0 };
          tetikHazirla(t);
          x.tetikler = [t];
        }
      });
    }
    return Response.json({ ok: true, id: a.id, ajan: ozetle(a), eksik });
  }
  const tarif = String(g.tarif ?? "").trim().slice(0, 4000);
  if (tarif) {
    const d = icerikDenetle(tarif);
    if (!d.izin) return hata(d.mesaj, 422);
    const { yapayZeka, ...t } = await taslakKur(tarif);
    const a = await ajanOlustur(sahip, t);
    return Response.json({ ok: true, id: a.id, yapayZeka, ajan: ozetle(a) });
  }
  const a = await ajanOlustur(sahip, { ad: g.ad?.slice(0, 60) || "Yeni ajan" });
  return Response.json({ ok: true, id: a.id, ajan: ozetle(a) });
}
