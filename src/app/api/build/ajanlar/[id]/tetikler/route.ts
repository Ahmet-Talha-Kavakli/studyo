import { ajanGetir, ajanGuncelle, istemciAjan, yeniKimlik, type AjanTetik } from "@/lib/build/ajanDepo";
import { kuralAcikla, sonrakiler } from "@/lib/build/ajanZaman";
import { ajanZamanlayiciBaslat, tetikCalistirVeIsle, tetikHazirla, yeniGizli, zamanCozumleSunucu } from "@/lib/build/ajanZamanlayici";
import { sahipOzeti } from "@/lib/build/depo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { icerikDenetle } from "@/lib/moderasyon";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
ajanZamanlayiciBaslat();

const ozet = (t: AjanTetik) => ({ ...t, aciklama: t.kural ? kuralAcikla(t.kural) : undefined, sonrakiler: t.kural && t.acik && !t.duraklatma ? sonrakiler(t.kural, 3) : [] });

/** Tetikler (zamanlamalar ve webhook'lar), her zamanlamanın anlatımı ve sonraki 3 çalışması. */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const a = await ajanGetir((await params).id, sahip);
  if (!a) return hata("Ajan bulunamadı.", 404);
  return Response.json({ ok: true, tetikler: a.tetikler.map(ozet), tavan: a.onay.tetikTavan, bugun: a.onay.sayac?.tetik ?? 0 });
}

type Govde = { islem?: string; id?: string; tur?: "zaman" | "webhook"; ad?: string; gorev?: string; metin?: string; filtre?: string; acik?: boolean; veri?: unknown; saatDilimi?: string };

/**
 * İşlemler: cozumle { metin } önizleme · ekle { tur, ad, gorev, metin | filtre } · guncelle { id, ...alanlar } ·
 * sil { id } · calistir { id, veri? } şimdi çalıştır · gizli { id } webhook adresini yenile · devam { id } duraklatmayı kaldır.
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const ajanId = (await params).id;
  const a = await ajanGetir(ajanId, sahip);
  if (!a) return hata("Ajan bulunamadı.", 404);
  let g: Govde = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }

  if (g.islem === "cozumle") {
    const m = String(g.metin ?? "").slice(0, 200);
    const r = await zamanCozumleSunucu(m, a.model, typeof g.saatDilimi === "string" ? g.saatDilimi : undefined);
    if (!r) return hata("Bu zamanlamayı anlayamadım. Şöyle yazabilirsin: her pazartesi 09.00, hafta içi her gün 8.30, her 30 dakikada bir.", 422);
    return Response.json({ ok: true, ...r });
  }
  if (g.islem === "calistir") {
    const t = a.tetikler.find((x) => x.id === g.id);
    if (!t) return hata("Tetik bulunamadı.", 404);
    const c = await tetikCalistirVeIsle(ajanId, sahipOzeti(sahip), t.id, { elle: true, veri: t.tur === "webhook" ? g.veri ?? { deneme: true, zaman: new Date().toISOString() } : undefined });
    return Response.json({ ok: true, calisma: c ? { id: c.id, durum: c.durum, hata: c.hata } : null });
  }
  const metinler = [g.ad, g.gorev, g.filtre].filter((x): x is string => typeof x === "string").join("\n");
  if (metinler) { const d = icerikDenetle(metinler); if (!d.izin) return hata(d.mesaj, 422); }

  let cozum: Awaited<ReturnType<typeof zamanCozumleSunucu>> = null;
  if (typeof g.metin === "string" && (g.islem === "ekle" ? g.tur === "zaman" : true)) {
    cozum = await zamanCozumleSunucu(g.metin.slice(0, 200), a.model, typeof g.saatDilimi === "string" ? g.saatDilimi : undefined);
    if (!cozum) return hata("Bu zamanlamayı anlayamadım. Şöyle yazabilirsin: her pazartesi 09.00, hafta içi her gün 8.30, her 30 dakikada bir.", 422);
  }
  let yeni: AjanTetik | undefined;
  const r = await ajanGuncelle(ajanId, sahip, (x) => {
    switch (g.islem) {
      case "ekle": {
        if (x.tetikler.length >= 20) return "Bir ajanda en çok 20 tetik olabilir.";
        const tur = g.tur === "webhook" ? "webhook" : "zaman";
        if (tur === "zaman" && !cozum) return "Zamanlama gerekli.";
        if (!String(g.gorev ?? "").trim()) return "Ajanın ne yapacağını yaz.";
        yeni = {
          id: yeniKimlik(8), tur, ad: String(g.ad ?? "").trim().slice(0, 60) || (tur === "zaman" ? "Zamanlama" : "Webhook"), acik: g.acik ?? true, olusturma: Date.now(),
          gorev: String(g.gorev).slice(0, 8000), ustUsteHata: 0,
          ...(tur === "zaman" ? { metin: String(g.metin).slice(0, 200), kural: cozum!.kural } : { filtre: String(g.filtre ?? "").slice(0, 1000), gizli: yeniGizli() }),
        };
        tetikHazirla(yeni);
        x.tetikler.push(yeni);
        return;
      }
      case "guncelle": {
        const t = x.tetikler.find((y) => y.id === g.id);
        if (!t) return "Tetik bulunamadı.";
        if (typeof g.ad === "string") t.ad = g.ad.trim().slice(0, 60) || t.ad;
        if (typeof g.gorev === "string") { if (!g.gorev.trim()) return "Ajanın ne yapacağını yaz."; t.gorev = g.gorev.slice(0, 8000); }
        if (typeof g.filtre === "string" && t.tur === "webhook") t.filtre = g.filtre.slice(0, 1000);
        if (cozum && t.tur === "zaman") { t.metin = String(g.metin).slice(0, 200); t.kural = cozum.kural; }
        if (typeof g.acik === "boolean") { t.acik = g.acik; if (g.acik) { t.duraklatma = undefined; t.ustUsteHata = 0; } }
        tetikHazirla(t);
        return;
      }
      case "devam": {
        const t = x.tetikler.find((y) => y.id === g.id);
        if (!t) return "Tetik bulunamadı.";
        t.duraklatma = undefined; t.ustUsteHata = 0; t.acik = true; tetikHazirla(t);
        return;
      }
      case "gizli": {
        const t = x.tetikler.find((y) => y.id === g.id && y.tur === "webhook");
        if (!t) return "Webhook bulunamadı.";
        t.gizli = yeniGizli();
        return;
      }
      case "sil": x.tetikler = x.tetikler.filter((y) => y.id !== g.id); return;
      default: return "Bilinmeyen işlem.";
    }
  });
  if (!r) return hata("Ajan bulunamadı.", 404);
  if (!r.ajan) return hata(r.hata);
  return Response.json({ ok: true, tetikler: r.ajan.tetikler.map(ozet), ajan: istemciAjan(r.ajan), ...(yeni ? { yeni: yeni.id } : {}) });
}
