import { projeOku } from "@/lib/build/depo";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { denetimKim, denetimYaz } from "@/lib/build/bulutGecmis";
import {
  cronAciklama, gecikmeliIptal, isCalistir, isEkle, isGuncelle, isSil, kodZamanlamalariniEsitle, koddakiZamanlamalar, sonrakiler, zamanlamaCoz, zamanliBaslat, zamanliOku, ZamanliHata, type IsGirdi, type SaatDilimi,
} from "@/lib/build/bulutZamanli";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Zamanlanmış fonksiyonlar ve gecikmeli işler (yalnız sahip ve ekip; yazma izleyiciye kapalı).
 *  GET                         → { isler (aciklama, sonrakiler), calismalar, gecikmeli, fonksiyonlar, yayinda, kodUyarilari }
 *  GET ?is=<id>                → o görevin çalışmaları
 *  POST { islem: "cevir", metin, saatDilimi? }      → { cron, aciklama, sonrakiler } (yazmaz; canlı önizleme)
 *  POST { islem: "ekle", ad, fonksiyon, zamanlama, saatDilimi?, govde?, acik? }
 *  POST { islem: "guncelle", id, … }   POST { islem: "sil", id }   POST { islem: "calistir", id }   POST { islem: "iptal", id }
 */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const p = await projeOku((await params).id, sahip);
  if (!p) return bulunamadi();
  zamanliBaslat();
  await kodZamanlamalariniEsitle(p, true).catch(() => {});
  const d = await zamanliOku(p.id);
  const q = new URL(req.url).searchParams;
  const isId = q.get("is");
  const yayindaki = p.yayin ? p.surumler.find((s) => s.id === p.yayin!.surumId)?.dosyalar ?? {} : {};
  const ad = (y: string) => /^api\/([A-Za-z0-9_-]+)\.js$/.exec(y)?.[1];
  const fonksiyonlar = [...new Set([...Object.keys(yayindaki), ...Object.keys(p.dosyalar)].map(ad).filter((x): x is string => !!x))].sort().map((f) => ({ ad: f, yayinda: !!yayindaki[`api/${f}.js`], taslakta: !!p.dosyalar[`api/${f}.js`] }));
  const kodUyarilari = koddakiZamanlamalar(yayindaki).filter((x) => !x.cron).map((x) => `api/${x.fonksiyon}.js içindeki zamanlama anlaşılmadı: "${x.ifade}"`);
  return Response.json({
    ok: true, yayinda: !!p.yayin, fonksiyonlar, kodUyarilari,
    isler: d.isler.map((x) => ({ ...x, aciklama: cronAciklama(x.zamanlama), sonrakiler: x.acik ? sonrakiler(x.zamanlama, x.saatDilimi, 3) : [] })),
    calismalar: (isId ? d.calismalar.filter((c) => c.isId === isId) : d.calismalar).slice(0, isId ? 100 : 60),
    gecikmeli: d.gecikmeli.slice(-100).reverse(),
  });
}

export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const p = await projeOku(id, sahip);
  if (!p) return bulunamadi();
  let g: IsGirdi & { islem?: string; id?: string; metin?: string } = {};
  try { g = await req.json(); } catch { return hata("İstek okunamadı."); }
  if (g.islem === "cevir") {
    const z = zamanlamaCoz(String(g.metin ?? ""));
    const sd: SaatDilimi = g.saatDilimi === "UTC" ? "UTC" : "Europe/Istanbul";
    return z ? Response.json({ ok: true, ...z, sonrakiler: sonrakiler(z.cron, sd, 3) }) : Response.json({ ok: false, hata: "Bu ifade anlaşılmadı." });
  }
  { const engel = await izleyiciEngeli(id, sahip); if (engel) return engel; }
  zamanliBaslat();
  const kim = await denetimKim(id, sahip);
  try {
    switch (g.islem) {
      case "ekle": { const is = await isEkle(id, g); denetimYaz(id, { tur: "zamanli", kim, mesaj: `Zamanlanmış görev eklendi: ${is.ad} (/api/${is.fonksiyon}, ${cronAciklama(is.zamanlama)})` }); return Response.json({ ok: true, is }); }
      case "guncelle": { const is = await isGuncelle(id, String(g.id), g); denetimYaz(id, { tur: "zamanli", kim, mesaj: `Zamanlanmış görev ${typeof g.acik === "boolean" && Object.keys(g).length <= 3 ? (g.acik ? "açıldı" : "kapatıldı") : "güncellendi"}: ${is.ad}` }); return Response.json({ ok: true, is }); }
      case "sil": { const is = await isSil(id, String(g.id)); denetimYaz(id, { tur: "zamanli", kim, mesaj: `Zamanlanmış görev silindi: ${is.ad}` }); return Response.json({ ok: true }); }
      case "calistir": { const c = await isCalistir(id, String(g.id)); return Response.json({ ok: true, calisma: c }); }
      case "iptal": { await gecikmeliIptal(id, String(g.id)); return Response.json({ ok: true }); }
    }
    return hata("Bilinmeyen işlem.");
  } catch (e) {
    return hata(e instanceof ZamanliHata ? e.message : "İşlem yapılamadı.", e instanceof ZamanliHata ? 400 : 500);
  }
}
