import { projeOku, sahipProjeleri } from "@/lib/build/depo";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { gunlukYaz } from "@/lib/build/gunluk";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { denetimKim, denetimYaz } from "@/lib/build/bulutGecmis";
import { semaFarkiAyrinti, semaUygula, ucOzeti, veriKopyala, type KopyaKip, type Uc } from "@/lib/build/bulutDal";
import { ortamAyariOku, testiCanliyaAktar, testOrtamiAc, testOrtamiKapat, yedekler, yedektenDon, type VeriOrtami } from "@/lib/build/veri";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Ortamlar ve dallar (yalnız sahip ve ekip; yazma izleyiciye kapalı).
 *  GET  ?kaynak=test|canli|dal:<id>&hedef=canli|test|dal:<id>   → ortam ayarı, özetler, deneme dalları, ayrıntılı fark
 *  POST { islem: "testAc" | "testKapat" (sil?) }
 *       { islem: "aktar", tablolar?, veri?, zorla? }        Test'i Canlı'ya taşı (ön denetimde engel varsa zorla gerekir)
 *       { islem: "yenile", tablolar?, kip, adet?, maske? }   Test'i Canlı'dan yeniden kopyala
 *       { islem: "dalaKopyala", dal, kaynak: "canli"|"test", tablolar?, kip, adet?, maske? }   ana projeden dala veri
 *       { islem: "daldanAl", dal, tablolar }                  dalın şemasını ana projenin Test'ine uygula
 *       { islem: "anadanAl", kaynak, tablolar?, kip, adet?, maske? }  (dalın kendisinde) ana projeden veri al
 *       { islem: "geriAl", yedek }                            aktarımdan önceki Canlı yedeğine dön
 */
const KIP: KopyaKip[] = ["sema", "son", "tum"];

async function ucCoz(ham: string | null, p: { id: string; taslak?: { anaId: string } }, dallar: { id: string }[], varsayilan: Uc): Promise<Uc | null> {
  if (!ham) return varsayilan;
  if (ham === "canli" || ham === "test") return { id: p.id, ortam: ham };
  const m = /^dal:([A-Za-z0-9_-]{6,20})$/.exec(ham);
  if (m && dallar.some((d) => d.id === m[1])) return { id: m[1], ortam: "canli" };
  const a = /^ana:(canli|test)$/.exec(ham);
  if (a && p.taslak) return { id: p.taslak.anaId, ortam: a[1] as VeriOrtami };
  return null;
}

export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const p = await projeOku((await params).id, sahip);
  if (!p) return bulunamadi();
  const q = new URL(req.url).searchParams;
  const ayar = await ortamAyariOku(p.id);
  const dallarHam = (await sahipProjeleri(sahip).catch(() => [])).filter((x) => x.taslak?.anaId === p.id);
  const dallar = await Promise.all(dallarHam.map(async (d) => ({ id: d.id, ad: d.ad, olusturma: d.olusturma, guncelleme: d.guncelleme, gorev: !!d.taslak?.gorev, ozet: await ucOzeti({ id: d.id, ortam: "canli" }) })));
  const ana = p.taslak ? await projeOku(p.taslak.anaId, sahip) : null;
  const kaynak = await ucCoz(q.get("kaynak"), p, dallar, { id: p.id, ortam: "test" });
  const hedef = await ucCoz(q.get("hedef"), p, dallar, { id: p.id, ortam: "canli" });
  if (!kaynak || !hedef) return hata("Kaynak ya da hedef geçersiz.");
  const farkGerekli = !(kaynak.id === p.id && kaynak.ortam === "test" && !ayar.test);
  return Response.json({
    ok: true, ortamAyari: ayar,
    canli: await ucOzeti({ id: p.id, ortam: "canli" }), test: ayar.test || ayar.kurulum ? await ucOzeti({ id: p.id, ortam: "test" }) : null,
    dallar, ana: ana ? { id: ana.id, ad: ana.ad, test: (await ortamAyariOku(ana.id)).test } : null,
    onizleme: `/api/build/onizleme/${p.id}/${p.onizlemeBelirteci}/`,
    fark: farkGerekli ? await semaFarkiAyrinti(kaynak, hedef) : [],
    yedekler: (await yedekler(p.id)).filter((y) => y.tur === "yayin-oncesi" || y.tur === "geri-yukleme-oncesi").slice(0, 10),
  });
}

export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const p = await projeOku(id, sahip);
  if (!p) return bulunamadi();
  { const engel = await izleyiciEngeli(id, sahip); if (engel) return engel; }
  let g: { islem?: string; sil?: boolean; tablolar?: string[]; veri?: boolean; zorla?: boolean; kip?: string; adet?: number; maske?: boolean; dal?: string; kaynak?: string; yedek?: string } = {};
  try { g = await req.json(); } catch { return hata("İstek okunamadı."); }
  const kim = await denetimKim(id, sahip);
  const tablolar = Array.isArray(g.tablolar) ? g.tablolar.map(String).slice(0, 50) : undefined;
  const kip = KIP.includes(g.kip as KopyaKip) ? g.kip as KopyaKip : "sema";
  const kipMetni = kip === "sema" ? "yalnız şema" : kip === "son" ? `son ${Math.round(Number(g.adet) || 50)} kayıt` : "bütün kayıtlar";
  try {
    switch (g.islem) {
      case "testAc": { const a = await testOrtamiAc(id); denetimYaz(id, { tur: "ortam", kim, mesaj: "Test ortamı açıldı" }); gunlukYaz(id, { t: "veri", m: "Test ortamı açıldı" }); return Response.json({ ok: true, ortamAyari: a }); }
      case "testKapat": { const a = await testOrtamiKapat(id, !!g.sil); denetimYaz(id, { tur: "ortam", kim, mesaj: g.sil ? "Test ortamı kapatıldı, Test verisi silindi" : "Test ortamı kapatıldı" }); return Response.json({ ok: true, ortamAyari: a }); }
      case "aktar": {
        if (!(await ortamAyariOku(id)).test) return hata("Test ortamı kapalı.");
        const fark = (await semaFarkiAyrinti({ id, ortam: "test" }, { id, ortam: "canli" }, tablolar)).filter((t) => (!tablolar?.length || tablolar.includes(t.ad)) && t.durum !== "yalnizHedefte");
        const engeller = fark.flatMap((t) => t.denetimler.filter((d) => d.seviye === "engel").map((d) => `${t.ad}: ${d.metin}`));
        if (engeller.length && !g.zorla) return Response.json({ ok: false, hata: "Ön denetimde engel var; düzelt ya da yine de aktar.", engeller }, { status: 409 });
        const r = await testiCanliyaAktar(id, { veri: !!g.veri, tablolar });
        denetimYaz(id, { tur: "ortam", kim, mesaj: `Test Canlı'ya taşındı: ${r.tablolar.length} tablo (${r.tablolar.join(", ") || "yok"})${r.veri ? ", kayıtlarıyla" : ", yalnız şema ve kurallar"}${engeller.length ? `, ${engeller.length} engel yok sayıldı` : ""}` });
        gunlukYaz(id, { t: "veri", m: `Test Canlı'ya aktarıldı: ${r.tablolar.length} tablo` });
        return Response.json({ ok: true, ...r, ortamAyari: await ortamAyariOku(id) });
      }
      case "yenile": {
        if (!(await ortamAyariOku(id)).test) await testOrtamiAc(id);
        const r = await veriKopyala({ id, ortam: "canli" }, { id, ortam: "test" }, { tablolar, kip, adet: g.adet, maske: !!g.maske, kim, aciklama: `Canlı'dan yeniden kopyalandı (${kipMetni})` });
        denetimYaz(id, { tur: "ortam", kim, ortam: "test", mesaj: `Test, Canlı'dan yeniden kopyalandı: ${r.tablolar.length} tablo, ${kipMetni}${g.maske ? `, kişisel alanlar maskeli (${r.maskelenen.length})` : ""}` });
        return Response.json({ ok: true, ...r });
      }
      case "dalaKopyala": {
        const dal = await projeOku(String(g.dal ?? ""), sahip);
        if (!dal || dal.taslak?.anaId !== id) return hata("Deneme dalı bulunamadı.", 404);
        { const engel = await izleyiciEngeli(dal.id, sahip); if (engel) return engel; }
        const kaynak: Uc = { id, ortam: g.kaynak === "test" ? "test" : "canli" };
        const r = await veriKopyala(kaynak, { id: dal.id, ortam: "canli" }, { tablolar, kip, adet: g.adet, maske: !!g.maske, kim, aciklama: `Ana projeden (${kaynak.ortam === "test" ? "Test" : "Canlı"}) kopyalandı, ${kipMetni}` });
        denetimYaz(id, { tur: "ortam", kim, mesaj: `"${dal.ad}" dalına veri kopyalandı: ${r.tablolar.length} tablo, ${kipMetni}${g.maske ? ", maskeli" : ""}` });
        denetimYaz(dal.id, { tur: "ortam", kim, mesaj: `Ana projeden veri alındı: ${r.tablolar.length} tablo, ${kipMetni}${g.maske ? ", maskeli" : ""}` });
        return Response.json({ ok: true, ...r });
      }
      case "daldanAl": {
        const dal = await projeOku(String(g.dal ?? ""), sahip);
        if (!dal || dal.taslak?.anaId !== id) return hata("Deneme dalı bulunamadı.", 404);
        if (!tablolar?.length) return hata("Taşınacak tabloları seç.");
        if (!(await ortamAyariOku(id)).test) await testOrtamiAc(id);
        const l = await semaUygula({ id: dal.id, ortam: "canli" }, { id, ortam: "test" }, tablolar, kim, `"${dal.ad}" dalının şeması uygulandı`);
        denetimYaz(id, { tur: "ortam", kim, ortam: "test", mesaj: `"${dal.ad}" dalının şeması Test'e uygulandı: ${l.join(", ")}` });
        return Response.json({ ok: true, tablolar: l });
      }
      case "anadanAl": {
        if (!p.taslak) return hata("Bu proje bir deneme dalı değil.");
        const ana = await projeOku(p.taslak.anaId, sahip);
        if (!ana) return hata("Ana proje bulunamadı.", 404);
        const r = await veriKopyala({ id: ana.id, ortam: g.kaynak === "test" ? "test" : "canli" }, { id, ortam: "canli" }, { tablolar, kip, adet: g.adet, maske: !!g.maske, kim, aciklama: `Ana projeden kopyalandı, ${kipMetni}` });
        denetimYaz(id, { tur: "ortam", kim, mesaj: `Ana projeden veri alındı: ${r.tablolar.length} tablo, ${kipMetni}${g.maske ? ", maskeli" : ""}` });
        return Response.json({ ok: true, ...r });
      }
      case "geriAl": {
        const ad = String(g.yedek ?? "");
        const r = await yedektenDon(id, ad);
        if (!r) return hata("Yedek bulunamadı.");
        denetimYaz(id, { tur: "yedek", kim, mesaj: `Canlı, aktarım öncesi yedeğe döndürüldü: ${r.tablolar.length} tablo değişti` });
        return Response.json({ ok: true, ...r });
      }
    }
    return hata("Bilinmeyen işlem.");
  } catch (e) { return hata((e as Error).message || "İşlem yapılamadı."); }
}
