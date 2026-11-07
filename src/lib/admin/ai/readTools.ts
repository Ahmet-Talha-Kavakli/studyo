import "server-only";
import { hesapOku } from "@/lib/hesap/depo";
import { finansRaporu } from "@/lib/admin/sunucu/finans";
import { jobListesi } from "@/lib/admin/sunucu/joblar";
import { kullaniciAyrinti, kullaniciListesi } from "@/lib/admin/sunucu/kullanicilar";
import { analitikRaporu, panoOzeti } from "@/lib/admin/sunucu/raporlar";
import { yayinHazirligi } from "@/lib/admin/sunucu/yayin";

/**
 * Yönetim asistanının okuma araçları: depodaki gerçek veriden okur. Tutarlar kuruş/sent yerine ana birimde, para birimi başına ayrı döner.
 */
const tl = (k: number) => Math.round(k) / 100;

export async function readToolCalistir(name: string, girdi: Record<string, unknown>, req: Request): Promise<unknown> {
  switch (name) {
    case "kullanici_bul": {
      const l = await kullaniciListesi({ q: String(girdi.sorgu ?? ""), durum: (String(girdi.durum ?? "hepsi") as never), boyut: 10 });
      return { bulunan: l.toplam, kullanicilar: l.satirlar.map((k) => ({ id: k.id, ad: k.ad, email: k.email, plan: k.plan, kredi: k.bakiye, askida: k.askida, dogrulandi: k.dogrulandi, kayit: new Date(k.olusturma).toISOString().slice(0, 10) })) };
    }
    case "kullanici_detay": {
      const h = await hesapOku(String(girdi.kullaniciId ?? ""));
      if (!h) return { hata: "Kullanıcı bulunamadı" };
      const a = await kullaniciAyrinti(h);
      return {
        id: h.uid, ad: a.hesap.ad, email: a.hesap.email, plan: a.hesap.plan, kredi: a.defter?.bakiye ?? null, askida: a.hesap.askida, dogrulandi: a.hesap.dogrulandi,
        harcananKredi: a.kredi.harcanan, uretimSayisi: a.kredi.uretim, siparisSayisi: a.odeme.siparisler.length, abonelik: a.odeme.abonelik ? { plan: a.odeme.abonelik.plan, durum: a.odeme.abonelik.durum } : null,
        acikOturum: a.oturumlar.length, buildProje: a.build?.sayi ?? null,
      };
    }
    case "gelir_ozet": {
      const f = await finansRaporu({});
      const cevir = (m: Record<string, number>) => Object.fromEntries(Object.entries(m).map(([p, v]) => [p, tl(v)]));
      return {
        donem: "son 30 gün", paraBirimleri: f.paralar, brut: cevir(f.gelir.brut), iade: cevir(f.gelir.iade), aylikYinelenen: cevir(f.gelir.mrr),
        ulkeler: f.ulkeler.slice(0, 10).map((u) => ({ ulke: u.ulke, siparis: u.siparis, gelir: cevir(u.gelir) })),
        odenenSiparis: f.sayilar.odenen, etkinAbonelik: f.sayilar.etkinAbonelik, not: "Tutarlar para birimi başına ayrıdır, çevrim yapılmaz. Deneme ödemeleri gelire katılmaz.",
      };
    }
    case "job_ozet": {
      const j = await jobListesi({ boyut: 10 });
      return { ...j.ozet, enCokKullanilan: j.kaynakDagilim.slice(0, 8) };
    }
    case "kullanim_ozet": {
      const a = await analitikRaporu(30);
      return { aktif: a.aktif, huni: a.huni, kaynaklar: a.kaynaklar.slice(0, 10), planlar: a.planlar };
    }
    case "en_cok_harcayan": {
      const p = await panoOzeti();
      return { donem: "son 30 gün", kullanicilar: p.harcayan.slice(0, Math.min(20, Number(girdi.adet ?? 10))) };
    }
    case "yayin_durumu": {
      const y = await yayinHazirligi(req);
      return { genel: y.genel, sayi: y.sayi, eksikler: y.bolumler.flatMap((b) => b.maddeler.filter((m) => m.durum !== "hazir").map((m) => ({ baslik: m.baslik, durum: m.durum, ozet: m.ozet, yapilacak: m.yapilacak }))) };
    }
    default:
      return { hata: `Bilinmeyen araç: ${name}` };
  }
}
