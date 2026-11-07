import { epostadanUid, hesapOku, UID_DESENI } from "@/lib/hesap/depo";
import { govdeOku, hata, hizHatasi, hizSiniri, tamam } from "@/lib/hesap/guvenlik";
import { adminGerekli } from "@/lib/hesap/yetki";
import { epostaGonder, epostaKurulu } from "@/lib/build/bulutEposta";
import { kategoriEtiket, kuralOzeti, type IhlalKategori } from "@/lib/moderasyon";
import { talepGuncelle, talepler, talepOku, type TalepDurum } from "@/lib/admin/destekDepo";
import { MODERASYON_DOSYASI, moderasyonKaydiniKur } from "@/lib/admin/moderasyonKaydi";
import { denetimOku, denetimYaz, panelAcilisiYaz } from "@/lib/admin/sunucu/denetim";
import { finansRaporu } from "@/lib/admin/sunucu/finans";
import { paylasimKaldir, paylasimlar, PAYLASIM_TURLERI } from "@/lib/admin/sunucu/icerik";
import { basvuruKarar, tumBasvurular } from "@/lib/hesap/earnDepo";
import { islemYap } from "@/lib/admin/sunucu/islemler";
import { jobAyrinti, jobListesi } from "@/lib/admin/sunucu/joblar";
import { kullaniciAyrinti, kullaniciListesi, type Durum as KDurum, type Siralama } from "@/lib/admin/sunucu/kullanicilar";
import { analitikRaporu, buyumeRaporu, davranisRaporu, kvkkRaporu, panoOzeti, veriDokumu } from "@/lib/admin/sunucu/raporlar";
import { gelistiriciRaporu, modelRaporu, saglayiciRaporu, sistemRaporu } from "@/lib/admin/sunucu/sistem";
import { satirDosya, tumHesaplar } from "@/lib/admin/sunucu/veri";
import { yayinHazirligi } from "@/lib/admin/sunucu/yayin";
import { zamanlayicilariIzle } from "@/lib/admin/zamanlayiciIzle";
import { rolHesapla } from "@/lib/hesap/hesap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Yönetim panelinin veri uçları (tek rota, yol ile dağıtılır). Her istek önce adminGerekli: oturum yoksa 401, rol admin değilse 403.
 * GET  /api/admin/<bölüm>[/<kimlik>]   rapor ve listeler
 * POST /api/admin/kullanicilar/<uid>/islem, /api/admin/destek/<referans>, /api/admin/icerik/kaldir
 * Durum değiştiren her işlem denetim günlüğüne yazılır.
 */

type Baglam = { params: Promise<{ yol: string[] }> };

const sayi = (v: string | null, vars?: number) => { const n = Number(v); return v !== null && v !== "" && Number.isFinite(n) ? n : vars; };

export async function GET(req: Request, { params }: Baglam) {
  const o = await adminGerekli(req);
  if (o instanceof Response) return o;
  zamanlayicilariIzle();
  moderasyonKaydiniKur();
  const yol = (await params).yol ?? [];
  const u = new URL(req.url).searchParams;
  const [bolum, kimlik, alt] = yol;
  try {
    switch (bolum) {
      case "ben":
        await panelAcilisiYaz(o, req);
        return tamam({ uid: o.hesap.uid, email: o.hesap.email, ad: o.hesap.profil?.ad ?? "", avatar: o.hesap.profil?.avatar ?? null, ikiAdim: !!o.hesap.ikiAdim, oturum: { tarayici: o.oturum.tarayici, isletim: o.oturum.isletim } });
      case "pano":
        return tamam(await panoOzeti());
      case "kullanicilar": {
        if (!kimlik) return tamam(await kullaniciListesi({ q: u.get("q") ?? "", plan: u.get("plan") ?? "", durum: (u.get("durum") ?? "hepsi") as KDurum, sirala: (u.get("sirala") ?? "yeni") as Siralama, sayfa: sayi(u.get("sayfa"), 1), boyut: sayi(u.get("boyut"), 25) }));
        if (!UID_DESENI.test(kimlik)) return hata("Hesap bulunamadı.", 404);
        const h = await hesapOku(kimlik);
        if (!h) return hata("Hesap bulunamadı.", 404);
        if (alt === "dokum") {
          const d = await veriDokumu(h);
          await denetimYaz(o, req, { tur: "veri-dokumu", eylem: "Kişisel veri dökümü indirildi", hedef: { uid: h.uid, email: h.email }, onem: "uyari" });
          return new Response(JSON.stringify(d, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="vayra-veri-${h.uid}.json"`, "Cache-Control": "no-store" } });
        }
        return tamam(await kullaniciAyrinti(h));
      }
      case "finans":
        return tamam(await finansRaporu({ bas: sayi(u.get("bas")), bit: sayi(u.get("bit")), deneme: u.get("deneme") === "1" }));
      case "joblar":
        if (kimlik) { const j = await jobAyrinti(decodeURIComponent(kimlik)); return j ? tamam(j) : hata("İş bulunamadı.", 404); }
        return tamam(await jobListesi({ q: u.get("q") ?? "", tur: u.get("tur") ?? "", durum: u.get("durum") ?? "", gun: sayi(u.get("gun"), 0), sayfa: sayi(u.get("sayfa"), 1), boyut: sayi(u.get("boyut"), 30) }));
      case "analitik":
        return tamam(await analitikRaporu(sayi(u.get("gun"), 30)));
      case "davranis":
        return tamam(await davranisRaporu());
      case "buyume":
        return tamam(await buyumeRaporu());
      case "kvkk":
        return tamam(await kvkkRaporu());
      case "modeller":
        return tamam(await modelRaporu());
      case "saglayici":
        return tamam(await saglayiciRaporu());
      case "sistem":
        return tamam(await sistemRaporu(u.get("yenile") === "1"));
      case "gelistirici":
        return tamam(await gelistiriciRaporu());
      case "yayin":
        return tamam(await yayinHazirligi(req, { tarayiciDene: u.get("tarayici") === "1" }));
      case "guvenlik": {
        const [kayitlar, hesaplar] = await Promise.all([denetimOku(1000), tumHesaplar()]);
        const adminler = hesaplar.filter((h) => rolHesapla(h) === "admin").map((h) => ({
          uid: h.uid, email: h.email, ad: h.profil?.ad ?? "", ikiAdim: !!h.ikiAdim, kayitli: h.rol === "admin", olusturma: h.olusturma,
          sonGiris: (h.olaylar ?? []).find((e) => e.tur === "giris")?.zaman ?? null, oturum: h.oturumlar.filter((x) => x.bitis > Date.now()).length,
        }));
        const simdi = Date.now();
        const olay = { kilit: 0, hatali: 0, ikiAdimKapat: 0, sifirla: 0 };
        const riskli: { zaman: number; tur: string; uid: string; email: string; ayrinti?: string }[] = [];
        for (const h of hesaplar) for (const e of h.olaylar ?? []) {
          if (e.zaman < simdi - 7 * 864e5) continue;
          if (e.tur === "kilit") olay.kilit++; else if (e.tur === "giris-hatali") olay.hatali++; else if (e.tur === "2fa-kapat") olay.ikiAdimKapat++; else if (e.tur === "sifirla") olay.sifirla++;
          if (["kilit", "giris-hatali", "2fa-kapat", "sifirla", "sifre", "eposta"].includes(e.tur)) riskli.push({ zaman: e.zaman, tur: e.tur, uid: h.uid, email: h.email, ayrinti: e.ayrinti });
        }
        const listeAdmin = (process.env.VAYRA_ADMIN_EPOSTALARI ?? "").split(/[\s,;]+/).filter(Boolean).length;
        return tamam({ kayitlar, adminler, olay, riskli: riskli.sort((a, b) => b.zaman - a.zaman).slice(0, 100), listeAdmin, ben: o.hesap.uid });
      }
      case "moderasyon": {
        const kayit = (await satirDosya<{ zaman: number; kategori: IhlalKategori; istem: string }>(MODERASYON_DOSYASI)).slice(-2000).reverse();
        const kategori: Record<string, number> = {};
        for (const k of kayit) kategori[k.kategori] = (kategori[k.kategori] ?? 0) + 1;
        const askida = (await tumHesaplar()).filter((h) => h.askida).map((h) => ({ uid: h.uid, email: h.email, ad: h.profil?.ad ?? "", ...h.askida! }));
        return tamam({
          kayitlar: kayit.slice(0, 300).map((k) => ({ ...k, etiket: kategoriEtiket(k.kategori) ?? k.kategori })), toplam: kayit.length,
          kategori: Object.entries(kategori).map(([k, v]) => ({ kategori: k, etiket: kategoriEtiket(k as IhlalKategori) ?? k, sayi: v })).sort((a, b) => b.sayi - a.sayi),
          kurallar: kuralOzeti().map((k) => ({ ...k, etiket: kategoriEtiket(k.kategori) })), askida,
        });
      }
      case "destek": {
        if (kimlik) { const t = await talepOku(kimlik); return t ? tamam({ talep: t, uid: await epostadanUid(t.email) }) : hata("Talep bulunamadı.", 404); }
        const l = await talepler();
        return tamam({ talepler: l.map(({ notlar, yanitlar, ...t }) => ({ ...t, notSayisi: notlar.length, yanitSayisi: yanitlar.length, sonYanit: yanitlar[yanitlar.length - 1]?.zaman ?? null })), eposta: epostaKurulu() });
      }
      case "icerik":
        return tamam({ paylasimlar: await paylasimlar(), turler: Object.entries(PAYLASIM_TURLERI).map(([id, t]) => ({ id, ad: t.ad, yol: t.yol })), earn: await tumBasvurular() });
      default:
        return hata("Bölüm bulunamadı.", 404);
    }
  } catch (e) {
    console.error("[admin]", bolum, (e as Error).message);
    return hata("Veri okunamadı. Sunucu günlüğüne bak.", 500);
  }
}

export async function POST(req: Request, { params }: Baglam) {
  const o = await adminGerekli(req);
  if (o instanceof Response) return o;
  const bekle = hizSiniri(`admin:${o.hesap.uid}`, 60, 60_000, false);
  if (bekle) return hizHatasi(bekle);
  const [bolum, kimlik, alt] = (await params).yol ?? [];
  const g = (await govdeOku<Record<string, unknown>>(req)) ?? {};
  try {
    if (bolum === "kullanicilar" && kimlik && alt === "islem") {
      if (!UID_DESENI.test(kimlik)) return hata("Hesap bulunamadı.", 404);
      const r = await islemYap(o, req, kimlik, g);
      return r.ok ? tamam(r) : hata(r.hata, r.durum);
    }
    if (bolum === "destek" && kimlik) {
      const t0 = await talepOku(kimlik);
      if (!t0) return hata("Talep bulunamadı.", 404);
      const islem = String(g.islem ?? "");
      const metin = String(g.metin ?? "").replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").trim().slice(0, 5000);
      if (islem === "durum") {
        const d = String(g.durum) as TalepDurum;
        if (!["acik", "yanitlandi", "kapandi"].includes(d)) return hata("Durum tanınmadı.");
        const t = await talepGuncelle(kimlik, (x) => { x.durum = d; });
        await denetimYaz(o, req, { tur: "destek", eylem: `Destek talebi ${d === "kapandi" ? "kapatıldı" : d === "acik" ? "yeniden açıldı" : "yanıtlandı olarak işaretlendi"}`, hedef: { kimlik, email: t0.email } });
        return tamam({ talep: t });
      }
      if (islem === "not") {
        if (metin.length < 2) return hata("Notu yaz.");
        const t = await talepGuncelle(kimlik, (x) => { x.notlar.push({ zaman: Date.now(), admin: o.hesap.email, metin }); });
        return tamam({ talep: t });
      }
      if (islem === "yanit") {
        if (metin.length < 5) return hata("Yanıtı yaz.");
        let gonderildi = false, hataMetni: string | undefined;
        if (!epostaKurulu()) hataMetni = "E-posta servisi kurulu değil; yanıt kaydedildi ama gönderilmedi.";
        else {
          const r = await epostaGonder({ kime: t0.email, konu: `Re: ${t0.konu} talebin (${t0.referans})`, metin: `Merhaba ${t0.ad},\n\n${metin}\n\nVayra Destek\nTalep numarası: ${t0.referans}` });
          gonderildi = r.ok; if (!r.ok) hataMetni = r.hata;
        }
        const t = await talepGuncelle(kimlik, (x) => { x.yanitlar.push({ zaman: Date.now(), admin: o.hesap.email, metin, gonderildi, ...(hataMetni ? { hata: hataMetni } : {}) }); if (gonderildi) x.durum = "yanitlandi"; });
        await denetimYaz(o, req, { tur: "destek", eylem: gonderildi ? "Destek talebine e-postayla yanıt verildi" : "Destek yanıtı kaydedildi (gönderilemedi)", hedef: { kimlik, email: t0.email } });
        return tamam({ talep: t, gonderildi, hata: hataMetni });
      }
      return hata("İşlem tanınmadı.");
    }
    if (bolum === "icerik" && kimlik === "earn") {
      const uid = String(g.uid ?? ""), id = String(g.id ?? ""), durum = String(g.durum ?? "");
      if (durum !== "onaylandi" && durum !== "reddedildi") return hata("Karar tanınmadı.");
      const red = String(g.red ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 300);
      const b = await basvuruKarar(uid, id, durum, o.hesap.email, red || undefined);
      if (!b) return hata("Başvuru bulunamadı.", 404);
      await denetimYaz(o, req, { tur: "icerik", eylem: durum === "onaylandi" ? "Earn başvurusu onaylandı" : "Earn başvurusu reddedildi", hedef: { uid, kimlik: id }, ayrinti: red || undefined });
      return tamam({ basvuru: b });
    }
    if (bolum === "icerik" && kimlik === "kaldir") {
      const tur = String(g.tur ?? ""), id = String(g.id ?? "");
      if (!(await paylasimKaldir(tur, id))) return hata("Kayıt bulunamadı.", 404);
      await denetimYaz(o, req, { tur: "icerik", eylem: "Paylaşım yayından kaldırıldı", hedef: { kimlik: `${tur}:${id}` }, ayrinti: String(g.neden ?? "").slice(0, 300) || undefined, onem: "uyari" });
      return tamam({ kaldirildi: true });
    }
    return hata("İşlem bulunamadı.", 404);
  } catch (e) {
    console.error("[admin]", bolum, (e as Error).message);
    return hata("İşlem tamamlanamadı. Sunucu günlüğüne bak.", 500);
  }
}
