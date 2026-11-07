import { projeOku } from "@/lib/build/depo";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { denetimKim, denetimYaz } from "@/lib/build/bulutGecmis";
import {
  calismaYenidenCalistir, denemeAyariYaz, gecikmeliEkle, gecikmeliIptal, gecikmeliSimdi, gecikmeliTemizle, gecikmeliTopluIptal, gecikmeliYenidenDene,
  kuyrukOzeti, zamanliBaslat, zamanliOku, ZamanliHata, type GecikmeliIs,
} from "@/lib/build/bulutZamanli";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Kuyruk izleme (gecikmeli işler ve zamanlanmış çalışmalar; yalnız sahip ve ekip, yazma izleyiciye kapalı).
 *  GET ?durum=bekliyor|hata|basarili|iptal|hepsi&fonksiyon=&ara=   → { ozet, isler, calismalar }
 *  POST { islem: "yenidenDene", idler } | { islem: "simdi", id } | { islem: "iptal", id } | { islem: "topluIptal", fonksiyon? }
 *       { islem: "temizle", durumlar } | { islem: "deneme", enCok, bekleme, saniye } | { islem: "calismaYeniden", id }
 *       { islem: "ekle", fonksiyon, saniye, veri? }   (elle iş: fonksiyonu kuyruktan denemek için)
 */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const p = await projeOku((await params).id, sahip);
  if (!p) return bulunamadi();
  zamanliBaslat();
  const q = new URL(req.url).searchParams;
  const durum = q.get("durum") ?? "hepsi", fonksiyon = q.get("fonksiyon") ?? "", ara = (q.get("ara") ?? "").toLocaleLowerCase("tr").trim();
  const d = await zamanliOku(p.id);
  const isler = d.gecikmeli.filter((x) => (durum === "hepsi" || x.durum === durum) && (!fonksiyon || x.fonksiyon === fonksiyon) && (!ara || `${x.id} ${x.fonksiyon} ${x.sonHata ?? ""} ${JSON.stringify(x.veri ?? "")}`.toLocaleLowerCase("tr").includes(ara)))
    .sort((a, b) => (a.durum === "bekliyor" ? 0 : 1) - (b.durum === "bekliyor" ? 0 : 1) || (a.durum === "bekliyor" ? a.zaman - b.zaman : (b.bitis ?? b.olusturma) - (a.bitis ?? a.olusturma))).slice(0, 200);
  const calismalar = d.calismalar.filter((c) => (!fonksiyon || c.fonksiyon === fonksiyon) && (durum === "hepsi" || durum === "bekliyor" || durum === "iptal" || c.durum === durum)).slice(0, 100);
  return Response.json({ ok: true, yayinda: !!p.yayin, ozet: await kuyrukOzeti(p.id), isler, calismalar });
}

export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const p = await projeOku(id, sahip);
  if (!p) return bulunamadi();
  { const engel = await izleyiciEngeli(id, sahip); if (engel) return engel; }
  zamanliBaslat();
  let g: { islem?: string; id?: string; idler?: string[]; fonksiyon?: string; durumlar?: string[]; enCok?: number; bekleme?: string; saniye?: number; veri?: unknown } = {};
  try { g = await req.json(); } catch { return hata("İstek okunamadı."); }
  const kim = await denetimKim(id, sahip);
  try {
    switch (g.islem) {
      case "yenidenDene": { const idler = Array.isArray(g.idler) ? g.idler.map(String).slice(0, 200) : []; const n = await gecikmeliYenidenDene(id, idler); denetimYaz(id, { tur: "zamanli", kim, mesaj: `Kuyrukta ${n} iş yeniden denemeye alındı` }); return Response.json({ ok: true, adet: n }); }
      case "simdi": { await gecikmeliSimdi(id, String(g.id)); return Response.json({ ok: true }); }
      case "iptal": { await gecikmeliIptal(id, String(g.id)); denetimYaz(id, { tur: "zamanli", kim, mesaj: `Kuyruktaki iş iptal edildi (${g.id})` }); return Response.json({ ok: true }); }
      case "topluIptal": { const n = await gecikmeliTopluIptal(id, g.fonksiyon ? String(g.fonksiyon) : undefined); denetimYaz(id, { tur: "zamanli", kim, mesaj: `Kuyrukta bekleyen ${n} iş iptal edildi${g.fonksiyon ? ` (${g.fonksiyon})` : ""}` }); return Response.json({ ok: true, adet: n }); }
      case "temizle": { const l = (Array.isArray(g.durumlar) ? g.durumlar : []).filter((x): x is GecikmeliIs["durum"] => x === "basarili" || x === "hata" || x === "iptal"); if (!l.length) return hata("Temizlenecek durum seç."); const n = await gecikmeliTemizle(id, l); return Response.json({ ok: true, adet: n }); }
      case "deneme": { const a = await denemeAyariYaz(id, { enCok: g.enCok, saniye: g.saniye, bekleme: g.bekleme as "ustel" }); denetimYaz(id, { tur: "zamanli", kim, mesaj: `Kuyruk yeniden deneme kuralı: en çok ${a.enCok} deneme, ${a.bekleme === "ustel" ? "üstel" : a.bekleme === "sabit" ? "sabit" : "doğrusal"} bekleme, ${a.saniye} sn` }); return Response.json({ ok: true, deneme: a }); }
      case "calismaYeniden": { const c = await calismaYenidenCalistir(id, String(g.id)); return Response.json({ ok: true, calisma: c }); }
      case "ekle": {
        const fonksiyon = String(g.fonksiyon ?? "");
        const yayindaki = p.yayin ? p.surumler.find((s) => s.id === p.yayin!.surumId)?.dosyalar ?? {} : {};
        if (!yayindaki[`api/${fonksiyon}.js`]) return hata(p.yayin ? `Yayındaki sürümde api/${fonksiyon}.js yok.` : "Proje yayında değil; kuyruktaki işler yayındaki kodu çalıştırır.");
        const is = await gecikmeliEkle(id, { fonksiyon, gecikme: Math.max(1, Number(g.saniye) || 1) * 1000, veri: g.veri, kaynak: "panel" });
        denetimYaz(id, { tur: "zamanli", kim, mesaj: `Kuyruğa elle iş eklendi: ${fonksiyon}` });
        return Response.json({ ok: true, is });
      }
    }
    return hata("Bilinmeyen işlem.");
  } catch (e) {
    return hata(e instanceof ZamanliHata ? e.message : "İşlem yapılamadı.", e instanceof ZamanliHata ? 400 : 500);
  }
}
