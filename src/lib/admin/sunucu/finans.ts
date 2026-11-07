import "server-only";
import { epostaNormal } from "@/lib/hesap/depo";
import { gunAnahtari, GUN_MS, tumHesaplar, tumOdemeKayitlari, tumSiparisler } from "./veri";

/**
 * Finans: siparişler (ödeme sağlayıcısından gelen gerçek kayıtlar), gelir, abonelikler, iadeler, makbuzlar.
 * Çok para birimli: her tutar kendi para biriminde toplanır (USD, EUR, TRY ...), çevrim yapılmaz; hiçbir para birimi varsayılan değildir.
 * Ülke kırılımı fatura bilgisindeki ülkeden gelir; yoksa "Bilinmiyor".
 * Tutarlar kuruş ya da sent olarak döner, arayüz böler. Deneme ödemeleri (sağlayıcısız geliştirme akışı) gelire katılmaz.
 */

export type ParaToplam = Record<string, number>;
const ekle = (m: ParaToplam, para: string, n: number) => { m[para] = (m[para] ?? 0) + n; };
const ULKE_AD: Record<string, string> = { Turkey: "Türkiye", TR: "Türkiye", "Türkiye": "Türkiye", US: "ABD", "United States": "ABD", DE: "Almanya", Germany: "Almanya", GB: "Birleşik Krallık", "United Kingdom": "Birleşik Krallık" };
const ulkeAdi = (u?: string) => (u ? ULKE_AD[u] ?? u : "Bilinmiyor");

export async function finansRaporu(s: { bas?: number; bit?: number; deneme?: boolean }) {
  const simdi = Date.now();
  const bit = s.bit && s.bit > 0 ? s.bit : simdi;
  const bas = s.bas && s.bas > 0 ? s.bas : bit - 30 * GUN_MS;
  const [siparisler, kayitlar, hesaplar] = await Promise.all([tumSiparisler(), tumOdemeKayitlari(), tumHesaplar()]);
  const email = new Map(hesaplar.map((h) => [h.uid, epostaNormal(h.email)]));
  const kayitUlke = new Map(kayitlar.map((k) => [k.uid, k.fatura?.ulke]));
  const gercek = (x: { saglayici: string }) => s.deneme || x.saglayici !== "deneme";

  const aralikta = siparisler.filter((x) => { const t = x.odemeZamani ?? x.olusturma; return t >= bas && t <= bit; });
  const brut: ParaToplam = {}, iade: ParaToplam = {}, kdv: ParaToplam = {}, net: ParaToplam = {};
  const durumSay: Record<string, number> = {};
  const turGelir: Record<string, ParaToplam> = {};
  const saglayiciGelir: Record<string, ParaToplam> = {};
  const ulke: Record<string, { gelir: ParaToplam; siparis: number; musteri: Set<string> }> = {};
  let denemeSayisi = 0;
  for (const x of aralikta) {
    durumSay[x.durum] = (durumSay[x.durum] ?? 0) + 1;
    if (x.saglayici === "deneme") denemeSayisi++;
    if (!gercek(x)) continue;
    if (x.durum === "odendi" || x.durum === "iade") {
      const tutar = x.tahsil ?? x.toplam;
      ekle(brut, x.para, tutar); ekle(kdv, x.para, x.kdv); ekle(net, x.para, x.net);
      ekle((turGelir[x.tur] ??= {}), x.para, tutar);
      ekle((saglayiciGelir[x.saglayici] ??= {}), x.para, tutar);
      const u = ulkeAdi(x.fatura?.ulke ?? kayitUlke.get(x.uid));
      const ul = (ulke[u] ??= { gelir: {}, siparis: 0, musteri: new Set() });
      ekle(ul.gelir, x.para, tutar); ul.siparis++; ul.musteri.add(x.uid);
    }
    if (x.iade) ekle(iade, x.para, x.iade.tutar);
  }
  const paralar = [...new Set(aralikta.filter(gercek).map((x) => x.para as string))].sort((a, b) => (brut[b] ?? 0) - (brut[a] ?? 0));

  // Günlük gelir serisi (aralık en çok 366 gün), para birimi başına.
  const gunSayisi = Math.min(366, Math.max(1, Math.ceil((bit - bas) / GUN_MS)));
  const gunler = Array.from({ length: gunSayisi }, (_, i) => gunAnahtari(bit - (gunSayisi - 1 - i) * GUN_MS));
  const seri = new Map(gunler.map((g) => [g, { gun: g, tutar: {} as ParaToplam, adet: 0 }]));
  for (const x of aralikta) {
    if (!gercek(x) || (x.durum !== "odendi" && x.durum !== "iade")) continue;
    const g = seri.get(gunAnahtari(x.odemeZamani ?? x.olusturma));
    if (g) { ekle(g.tutar, x.para, x.tahsil ?? x.toplam); g.adet++; }
  }

  const ozet = (x: (typeof siparisler)[number]) => ({
    no: x.no, uid: x.uid, email: email.get(x.uid) ?? (x.uid === "silindi" ? "Silinmiş hesap" : x.fatura?.eposta ?? ""), tur: x.tur, ad: x.ad, durum: x.durum,
    para: x.para as string, toplam: x.toplam, tahsil: x.tahsil, net: x.net, kdv: x.kdv, saglayici: x.saglayici, mod: x.mod, olusturma: x.olusturma,
    odemeZamani: x.odemeZamani, makbuzNo: x.makbuzNo, kart: x.kart, taksit: x.taksit, iade: x.iade, hata: x.hata?.slice(0, 200), amac: x.amac,
    ulke: ulkeAdi(x.fatura?.ulke ?? kayitUlke.get(x.uid)),
  });
  const sirali = [...aralikta].sort((a, b) => (b.odemeZamani ?? b.olusturma) - (a.odemeZamani ?? a.olusturma));

  const abonelikler = kayitlar.filter((k) => k.abonelik).map((k) => {
    const a = k.abonelik!;
    return {
      uid: k.uid, email: email.get(k.uid) ?? "", plan: a.plan, kota: a.kota, donem: a.donem, para: a.para as string, durum: a.durum, saglayici: a.saglayici, mod: a.mod,
      baslangic: a.baslangic, donemBitis: a.donemBitis, otomatik: a.otomatik, iptalTarihi: a.iptalTarihi, sonOdeme: a.sonOdeme, sonraki: a.sonraki, ulke: ulkeAdi(k.fatura?.ulke),
    };
  }).sort((a, b) => b.donemBitis - a.donemBitis);
  const etkin = abonelikler.filter((a) => (a.durum === "etkin" || a.durum === "odenemedi") && a.donemBitis > simdi && (s.deneme || a.saglayici !== "deneme"));
  // Aylık yinelenen gelir: etkin, iptal edilmemiş aboneliklerin son ödeme tutarı (yıllıkta on ikiye bölünür), para birimi başına.
  const mrr: ParaToplam = {};
  for (const a of etkin) if (a.sonOdeme && !a.iptalTarihi) ekle(mrr, a.para, a.donem === "yillik" ? a.sonOdeme.toplam / 12 : a.sonOdeme.toplam);

  return {
    aralik: { bas, bit },
    paralar: [...new Set([...paralar, ...Object.keys(mrr)])],
    gelir: { brut, iade, kdv, net, mrr },
    sayilar: { siparis: aralikta.length, durum: durumSay, deneme: denemeSayisi, odenen: aralikta.filter((x) => x.durum === "odendi" && gercek(x)).length, etkinAbonelik: etkin.length },
    turGelir, saglayiciGelir,
    ulkeler: Object.entries(ulke).map(([ad, v]) => ({ ulke: ad, gelir: v.gelir, siparis: v.siparis, musteri: v.musteri.size })).sort((a, b) => b.siparis - a.siparis),
    seri: [...seri.values()],
    siparisler: sirali.slice(0, 500).map(ozet),
    iadeler: sirali.filter((x) => x.durum === "iade" || x.iade).map(ozet),
    basarisiz: sirali.filter((x) => x.durum === "basarisiz").map(ozet),
    makbuzlar: sirali.filter((x) => x.makbuzNo).map(ozet),
    abonelikler,
  };
}
