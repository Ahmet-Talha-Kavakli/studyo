import { projeOku, projeOlustur, sahipProjeleri, projeYaz } from "@/lib/build/depo";
import { sablonBul } from "@/lib/build/sablonlar";
import { sablonTablolariniKur } from "@/lib/build/sablonlar/kurulum";
import { hata, sahipAl } from "@/lib/build/sunucu";
import { PROJE_TURLERI, yolGecerli, type ProjeTur } from "@/lib/build/tipler";

export const dynamic = "force-dynamic";

/** Sahibin projeleri (özet). */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return Response.json({ ok: true, projeler: [] });
  // Paralel görev dalları proje listesinde görünmez; çalışma alanındaki Görevler panelinden yönetilir.
  return Response.json({ ok: true, projeler: (await sahipProjeleri(sahip)).filter((o) => !o.taslak?.gorev) });
}

/**
 * Yeni proje. Gövde: { sablon } (hazır şablonu remix eder), { kopya: id } (kendi projesini çoğaltır: dosyalar
 * kopyalanır; sohbet, sürüm geçmişi ve yayın kopyalanmaz) ya da { tur, ad, istem } (boş proje; ajan ilk istemi işler).
 */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return hata("Oturum anahtarı eksik; sayfayı yenile.", 401);
  let g: { sablon?: string; kopya?: string; taslak?: boolean; tur?: string; ad?: string; istem?: string; iceAktar?: { ad?: string; tur?: string; dosyalar?: Record<string, unknown> } };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  if (g.iceAktar) {
    // Zip ya da klasörden içe aktarma: yalnız metin dosyaları (html, css, js, json, svg, md …), yol güvenliği, boyut sınırları.
    const d = g.iceAktar.dosyalar ?? {};
    const temiz: Record<string, string> = {};
    let toplam = 0;
    for (const [yol, icerik] of Object.entries(d).slice(0, 300)) {
      if (!yolGecerli(yol) || typeof icerik !== "string" || icerik.length > 400_000) continue;
      toplam += icerik.length;
      if (toplam > 4_000_000) return hata("Proje çok büyük (4 MB sınırı).", 413);
      temiz[yol] = icerik;
    }
    if (!Object.keys(temiz).length) return hata("İçe aktarılacak dosya bulunamadı.");
    if (!temiz["index.html"]) {
      const ilk = Object.keys(temiz).find((y) => y.endsWith("/index.html"));
      if (!ilk) return hata("Projede index.html yok. Giriş sayfası olan bir site klasörü seç.");
      // Tek üst klasörde gelen zip'ler (proje/index.html): kökü o klasöre taşı.
      const onek = ilk.slice(0, -"index.html".length);
      for (const y of Object.keys(temiz)) { const v = temiz[y]; delete temiz[y]; if (y.startsWith(onek)) temiz[y.slice(onek.length)] = v; }
    }
    const tur = (PROJE_TURLERI.some((t) => t.id === g.iceAktar!.tur) ? g.iceAktar.tur : "site") as ProjeTur;
    const p = await projeOlustur({ ad: String(g.iceAktar.ad || "İçe aktarılan proje").slice(0, 60), tur, dosyalar: temiz, sahip, aciklama: "İçe aktarıldı" });
    return Response.json({ ok: true, id: p.id });
  }
  if (g.kopya) {
    const k = await projeOku(String(g.kopya), sahip);
    if (!k) return hata("Proje bulunamadı.", 404);
    if (g.taslak) {
      // Taslak: ana projenin kopyası; ajan talimatları ve ayarlar taşınır, yayın ve alan adı taşınmaz. Sonra ana projeye uygulanır.
      if (k.taslak) return hata("Deneme dalından yeni dal açılamaz; ana projeden aç.");
      const p = await projeOlustur({ ad: `${k.ad} · deneme`.slice(0, 60), tur: k.tur, dosyalar: { ...k.dosyalar }, sahip, kapak: k.kapak, aciklama: `${k.ad} projesinden deneme dalı açıldı` });
      p.taslak = { anaId: k.id, anaAd: k.ad, anaSurumNo: k.surumler.at(-1)?.no ?? 0, olusturma: Date.now() };
      p.ayarlar.talimat = k.ayarlar.talimat;
      p.ayarlar.seo = { ...k.ayarlar.seo, indeks: false };
      p.klasor = k.klasor;
      await projeYaz(p, sahip);
      return Response.json({ ok: true, id: p.id });
    }
    const p = await projeOlustur({ ad: `${k.ad} kopyası`.slice(0, 60), tur: k.tur, dosyalar: { ...k.dosyalar }, sahip, kapak: k.kapak, aciklama: `${k.ad} projesinden kopyalandı` });
    return Response.json({ ok: true, id: p.id });
  }
  if (g.sablon) {
    const s = sablonBul(String(g.sablon));
    if (!s) return hata("Şablon bulunamadı.", 404);
    const p = await projeOlustur({ ad: String(g.ad || s.ad).slice(0, 60), tur: s.tur, dosyalar: { ...s.dosyalar }, sahip, kapak: s.kapak, sablon: s.id, aciklama: `${s.ad} şablonundan oluşturuldu` });
    // Şablonun hazır tabloları (şema, erişim kuralları, başlangıç kayıtları) yeni projenin veritabanına kurulur.
    if (s.tablolar) await sablonTablolariniKur(p.id, s.tablolar).catch(() => {});
    return Response.json({ ok: true, id: p.id });
  }
  const tur = (PROJE_TURLERI.some((t) => t.id === g.tur) ? g.tur : "site") as ProjeTur;
  const istem = String(g.istem ?? "").trim();
  const ad = String(g.ad || istem.split(/[.,;:!?\n]/)[0] || "Yeni proje").trim().slice(0, 48) || "Yeni proje";
  const p = await projeOlustur({ ad, tur, dosyalar: {}, sahip });
  return Response.json({ ok: true, id: p.id });
}
