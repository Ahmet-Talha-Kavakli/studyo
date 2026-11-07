import { randomBytes } from "crypto";
import { guvenliFetch } from "@/lib/guvenliAg";
import { projeOku } from "@/lib/build/depo";
import { epostaKurulu } from "@/lib/build/bulutEposta";
import { yardimciModel } from "@/lib/build/ajanZeka";
import { buyumeOku } from "@/lib/build/buyumeDepo";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { bulunamadi, hata, sahipAl } from "@/lib/build/sunucu";
import { yanittanKes } from "@/lib/hesap/buildKredi";
import { isletmeDegistir, isletmeOku, kokenBul, listeDegistir, listeOku, sinirli, trTarih, trYaz } from "@/lib/build/isletme";
import { alanOnerileri, alanSorgula, gerekenKayitlar, kayitlariDenetle } from "@/lib/build/isletmeAlan";
import {
  aiBlogTaslak, aiCevir, aiUrunAciklama, aiYorumYaniti, blogSayfalari, ceviriTablosunuGuncelle, metinleriCikar, ModelYokHata, projeyeYaz, yasalEksikler, yasalMetin, yasalSayfalari, yaziTemizle,
} from "@/lib/build/isletmeIcerik";
import {
  csvHucre, kurlariGuncelle, magazaKur, magazaRaporu, mutabakat, siparisGuncelle, siparisler, siparisPanel, siteAdresi, stokGuncelle, terkEdilenler, terkHatirlat, urunKaydet, urunler, urunSil,
} from "@/lib/build/isletmeMagaza";
import { musaitSaatler, randevuDurumu, randevuEpostalari, randevuOlustur, randevuTasi, RandevuHata } from "@/lib/build/isletmeRandevu";
import {
  blogAyarTemizle, dilAyarTemizle, DILLER, ulkeKargoVarsayilani, ulkeVergiVarsayilani, eklentiTemizle, kuponTemizle, kurumsalEpostaTemizle, magazaTemizle, profilEksikleri, profilTemizle, randevuAyarTemizle, metin, nesne, yasalTemizle, YASAL_TURLER,
  type Abone, type CeviriSatir, type Randevu, type RandevuDurum, type Sohbet, type Yazi, type YasalTur, type Yorum,
} from "@/lib/build/isletmeTipler";
import { isletmeZamanlayici, kokenNotEt, sahipGorundu } from "@/lib/build/isletmeZamanlayici";
import { OdemeHata, odemeAyarOku } from "@/lib/build/odeme";
import { ulkeBul } from "@/lib/build/bolge";
import { ortamAyariOku, type VeriOrtami } from "@/lib/build/veri";
import type { Proje } from "@/lib/build/tipler";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string; yol?: string[] }> };

/**
 * Vayra İşletme sahip API'si (tek fonksiyon). Okuma: sahip ve ekip; yazma: sahip ve düzenleyici (izleyici engellenir).
 *  GET  ""                      bütün işletme ayarları, özet sayılar, servis durumları
 *  POST ""  { bolum, deger }     profil | magaza | randevu | blog | dil | eklentiler | yasal | eposta kaydı
 *  Mağaza:   GET magaza, siparisler, siparisler.csv, sepetler, rapor · POST magaza/kur, magaza/urun, magaza/stok, magaza/ai, siparis/<no>, sepet/<no>/hatirlat, kupon · DELETE magaza/urun/<id>, kupon/<id>
 *  Randevu:  GET randevular, randevu/saatler · POST randevu, randevu/<id>, randevu/takvim-anahtari · DELETE randevu/<id>
 *  Blog:     GET yazilar · POST yazi, yazi/ai, yazi/ice-aktar, blog/siteye-yaz · DELETE yazi/<id>
 *  Dil:      GET ceviriler · POST dil/tara, dil/cevir, dil/metin · DELETE dil/<id>
 *  Yasal:    GET yasal/onizle?tur · POST yasal/siteye-yaz
 *  Yorum, sohbet, abone: GET yorumlar, sohbetler, aboneler(.csv) · POST yorum/<id>, yorum/<id>/ai, sohbet/<id> · DELETE yorum/<id>, sohbet/<id>, abone/<id>
 *  Alan ve e-posta: GET eposta/dns, alan?ad=, alan/oneri · Profil: GET profil/denetle · Çerez: GET cerez
 */
const tamam = (v: Record<string, unknown> = {}) => Response.json({ ok: true, ...v }, { headers: { "Cache-Control": "no-store" } });
function hataYaniti(e: unknown) {
  if (e instanceof OdemeHata || e instanceof RandevuHata) return hata(e.message, e.durum);
  if (e instanceof ModelYokHata) return Response.json({ ok: false, hata: e.message, kod: "model-yok" }, { status: 409 });
  return hata((e as Error).message || "İşlem yapılamadı.", 500);
}
async function hazirla(req: Request, ctx: Ctx, yazma: boolean) {
  const { id, yol = [] } = await ctx.params;
  isletmeZamanlayici();
  const sahip = sahipAl(req);
  if (!sahip) return { r: hata("Oturum yok.", 401) } as const;
  const p = await projeOku(id, sahip);
  if (!p) return { r: bulunamadi() } as const;
  if (yazma) { const e = await izleyiciEngeli(id, sahip); if (e) return { r: e } as const; }
  const koken = kokenBul(req);
  kokenNotEt(id, koken);
  return { id, yol, p, sahip, koken } as const;
}
const ortamAl = (x: unknown): VeriOrtami => (x === "test" ? "test" : "canli");

export async function GET(req: Request, ctx: Ctx) {
  const h = await hazirla(req, ctx, false);
  if ("r" in h) return h.r;
  const { id, yol, p, koken } = h;
  const u = new URL(req.url);
  const q = (a: string) => u.searchParams.get(a) ?? "";
  const [a, b] = yol;
  try {
    if (!a) {
      const [v, odeme, ortam, randevular, yazilar, yorumlar, sohbetler, aboneler] = await Promise.all([
        isletmeOku(id), odemeAyarOku(id), ortamAyariOku(id), listeOku<Randevu>(id, "randevular"), listeOku<Yazi>(id, "yazilar"), listeOku<Yorum>(id, "yorumlar"), listeOku<Sohbet>(id, "sohbetler"), listeOku<Abone>(id, "aboneler"),
      ]);
      mutabakat(id, koken).catch(() => 0);
      const sl = await siparisler(id, "canli");
      const simdi = Date.now();
      return tamam({
        veri: v, site: siteAdresi(p, koken), yayinda: !!p.yayin, tur: p.tur,
        servis: { eposta: epostaKurulu(), ai: !!yardimciModel(), odeme: odeme.saglayici, odemeMod: odeme.mod, testOrtami: ortam.test },
        ozet: {
          bekleyenSiparis: sl.filter((s) => s.durum === "odendi" && (!s.isletme?.asama || s.isletme.asama === "yeni" || s.isletme.asama === "hazirlaniyor")).length,
          bugunRandevu: randevular.filter((r) => r.durum !== "iptal" && trTarih(r.bas, v.profil.saatDilimi) === trTarih(simdi, v.profil.saatDilimi)).length,
          onayBekleyenRandevu: randevular.filter((r) => r.durum === "bekliyor" && r.bas > simdi).length,
          yazi: yazilar.length, taslak: yazilar.filter((y) => y.durum === "taslak").length,
          bekleyenYorum: yorumlar.filter((y) => y.durum === "bekliyor").length, okunmamisSohbet: sohbetler.filter((s) => !s.okundu && !s.kapali).length, abone: aboneler.length,
          profilEksik: profilEksikleri(v.profil), yasalEksik: yasalEksikler(v),
        },
      });
    }
    if (a === "magaza") {
      const ortam = ortamAl(q("ortam"));
      const r = await urunler(id, ortam);
      return tamam({ ...r, kategoriler: [...new Set(r.urunler.map((x) => x.kategori).filter(Boolean))] });
    }
    if (a === "siparisler" || a === "siparisler.csv") {
      const ortam = ortamAl(q("ortam"));
      await mutabakat(id, koken).catch(() => 0);
      const l = await siparisler(id, ortam);
      if (a === "siparisler.csv") {
        const satir = [["Sipariş no", "Tarih", "Durum", "Aşama", "Müşteri", "E-posta", "Telefon", "Adres", "Şehir", "Eyalet ya da bölge", "Posta kodu", "Ülke", "Ürünler", "Para birimi", "Ara toplam", "İndirim", "Kupon", "Kargo", "Vergi", "Vergi türü", "Toplam", "Kargo firması", "Takip no", "Fatura türü", "Unvan", "Vergi dairesi", "Vergi no"].join(";")];
        const tz = (await isletmeOku(id)).profil.saatDilimi;
        for (const s of l) { const i = s.isletme; satir.push([s.siparisNo, trYaz(s.olusturma, tz), s.durum, i?.asama ?? "yeni", `${s.alici?.ad ?? ""} ${s.alici?.soyad ?? ""}`, s.eposta, s.alici?.telefon, s.alici?.adres, s.alici?.sehir, s.alici?.bolge ?? "", s.alici?.postaKodu ?? "", s.alici?.ulke ?? "", s.kalemler.filter((k) => k.id !== "vergi").map((k) => `${k.adet} x ${k.ad}`).join(", "), s.paraBirimi, i?.araToplam ?? s.tutar, i?.indirim ?? 0, i?.kupon?.kod ?? "", i?.kargoUcreti ?? 0, i?.vergi?.toplam ?? (i?.kdv ?? []).reduce((t, x) => t + x.tutar, 0), i?.vergi ? `${i.vergi.ad}${i.vergi.dahil ? " (dahil)" : " (eklendi)"}${i.vergi.tersIbraz ? ", ters ibraz" : ""}` : "KDV (dahil)", s.tutar, i?.kargo?.firma ?? "", i?.kargo?.takipNo ?? "", i?.fatura?.tur ?? "", i?.fatura?.unvan ?? "", i?.fatura?.vergiDairesi ?? "", i?.fatura?.vergiNo ?? ""].map(csvHucre).join(";")); }
        return new Response("﻿" + satir.join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="siparisler-${ortam}.csv"`, "Cache-Control": "no-store" } });
      }
      return tamam({ siparisler: l.slice(0, 500).map(siparisPanel), toplam: l.length });
    }
    if (a === "sepetler") return tamam({ sepetler: await terkEdilenler(id), eposta: epostaKurulu() });
    if (a === "rapor") return tamam({ rapor: await magazaRaporu(id, ortamAl(q("ortam")), [7, 30, 90].includes(Number(q("gun"))) ? Number(q("gun")) : 30) });
    if (a === "randevular") {
      const l = await listeOku<Randevu>(id, "randevular");
      const bas = Number(q("bas")) || Date.now() - 7 * 864e5, bit = Number(q("bit")) || Date.now() + 60 * 864e5;
      return tamam({ randevular: l.filter((r) => r.bas >= bas && r.bas <= bit).sort((x, y) => x.bas - y.bas), yaklasan: l.filter((r) => r.bas > Date.now() && r.durum !== "iptal").sort((x, y) => x.bas - y.bas).slice(0, 50), toplam: l.length });
    }
    if (a === "randevu" && b === "saatler") {
      const v = await isletmeOku(id);
      return tamam({ saatler: musaitSaatler(v.randevu, q("hizmet"), q("calisan"), q("tarih"), await listeOku<Randevu>(id, "randevular"), Date.now(), true) });
    }
    if (a === "yazilar") {
      const l = await listeOku<Yazi>(id, "yazilar");
      let makaleler: { id: string; baslik: string; olusturma: number }[] = [];
      try { makaleler = (await buyumeOku(id)).blog.makaleler.map((m) => ({ id: m.id, baslik: m.baslik, olusturma: m.olusturma })); } catch { /* Büyüme verisi yok */ }
      const kurulu = p.dosyalar[(await isletmeOku(id)).blog.sayfa] !== undefined;
      return tamam({ yazilar: l.slice().sort((x, y) => y.guncelleme - x.guncelleme), buyume: makaleler.filter((m) => !l.some((y) => y.kaynak === `buyume:${m.id}`)), sayfaKurulu: kurulu });
    }
    if (a === "ceviriler") return tamam({ satirlar: await listeOku<CeviriSatir>(id, "ceviriler"), diller: DILLER });
    if (a === "yorumlar") return tamam({ yorumlar: (await listeOku<Yorum>(id, "yorumlar")).slice().sort((x, y) => y.olusturma - x.olusturma).map(({ ip: _i, ...y }) => { void _i; return y; }) });
    if (a === "sohbetler") {
      sahipGorundu(id);
      return tamam({ sohbetler: (await listeOku<Sohbet>(id, "sohbetler")).slice().sort((x, y) => y.guncelleme - x.guncelleme).slice(0, 300).map(({ ip: _i, anahtar: _a, ...s }) => { void _i; void _a; return s; }) });
    }
    if (a === "aboneler" || a === "aboneler.csv") {
      const l = (await listeOku<Abone>(id, "aboneler")).slice().sort((x, y) => y.olusturma - x.olusturma);
      const tz = (await isletmeOku(id)).profil.saatDilimi;
      if (a === "aboneler.csv") return new Response("﻿" + [["E-posta", "Ad", "Kaynak", "Sayfa", "Kupon", "Tarih", "İzin"].join(";"), ...l.map((x) => [x.eposta, x.ad, x.kaynak, x.sayfa, x.kupon, trYaz(x.olusturma, tz), x.izin ? "evet" : "hayır"].map(csvHucre).join(";"))].join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="aboneler.csv"' } });
      return tamam({ aboneler: l });
    }
    if (a === "cerez") return tamam({ gunler: (await listeOku<{ gun: string; hepsi: number; kismi: number; red: number }>(id, "olaylar")).slice(-60) });
    if (a === "eposta" && b === "dns") {
      const v = await isletmeOku(id);
      if (!v.eposta.saglayici || !v.eposta.alan) return tamam({ kayitlar: [], notlar: [], uyarilar: [] });
      const g = gerekenKayitlar(v.eposta);
      if (sinirli(`ied:${id}`, 15)) return tamam({ ...g, uyarilar: ["Çok sık denetlendi; bir dakika sonra yeniden dene."], denetlenmedi: true });
      const d = await kayitlariDenetle(v.eposta.alan, g.kayitlar);
      const bagli = p.alanAdlari.find((x) => x.ad === v.eposta.alan || x.ad.endsWith(`.${v.eposta.alan}`));
      return tamam({ kayitlar: d.kayitlar, notlar: g.notlar, uyarilar: [...d.uyarilar, ...(bagli ? [] : ["Bu alan adı projeye bağlı değil; e-posta yine çalışır ama siteyi bu adreste açmak için Ayarlar menüsündeki Alan adları bölümünden bağla."])] });
    }
    if (a === "alan") {
      if (sinirli(`ias:${id}`, 30)) return hata("Çok sık sorgulandı; bir dakika bekle.", 429);
      if (b === "oneri") {
        const v = await isletmeOku(id);
        const l = alanOnerileri(q("ad") || v.profil.ad || p.ad);
        return tamam({ sonuclar: await Promise.all(l.map((x) => alanSorgula(x))) });
      }
      return tamam({ sonuc: await alanSorgula(q("ad")) });
    }
    if (a === "yasal" && b === "onizle") {
      const v = await isletmeOku(id);
      const tur = q("tur") as YasalTur;
      if (!YASAL_TURLER.some((x) => x.id === tur)) return hata("Metin türü geçersiz.");
      return tamam({ ...yasalMetin(tur, v, p, siteAdresi(p, koken)), eksikler: yasalEksikler(v) });
    }
    if (a === "profil" && b === "denetle") return tamam({ denetim: profilDenetle(p, await isletmeOku(id)) });
    if (a === "profil" && b === "konum") {
      // Adresten koordinat (OpenStreetMap Nominatim; kullanım kuralı gereği tanıtıcı başlık ve düşük hız).
      if (sinirli(`ikn:${id}`, 5)) return hata("Çok sık soruldu; biraz bekle.", 429);
      const adres = q("adres").slice(0, 300);
      if (adres.length < 5) return hata("Adres çok kısa.");
      const r = await guvenliFetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&countrycodes=tr&accept-language=tr&q=${encodeURIComponent(adres)}`, { headers: { "User-Agent": "VayraBuild/1.0 (isletme profili)", Accept: "application/json" }, signal: AbortSignal.timeout(8000) }, { yalnizHttps: true });
      if (!r.ok) return hata(`Harita servisi yanıt vermedi (${r.status}).`, 502);
      const l = (await r.json().catch(() => [])) as { lat: string; lon: string; display_name: string }[];
      return tamam({ sonuclar: l.slice(0, 3).map((x) => ({ enlem: Number(x.lat), boylam: Number(x.lon), ad: String(x.display_name).slice(0, 200) })) });
    }
    return hata("Bulunamadı.", 404);
  } catch (e) { return hataYaniti(e); }
}

/** Yapay zekâ kullanan işlemlerin (çeviri) bedeli sunucuda düşülür. */
export async function POST(req: Request, ctx: Ctx) {
  return yanittanKes(await postIsle(req, ctx), sahipAl(req), { kaynak: "build:isletme", aciklama: "İşletme: yapay zekâ çevirisi" });
}

async function postIsle(req: Request, ctx: Ctx) {
  const h = await hazirla(req, ctx, true);
  if ("r" in h) return h.r;
  const { id, yol, p, sahip, koken } = h;
  let g: Record<string, unknown> = {};
  try { const t = await req.text(); if (t.length > 300_000) return hata("İstek çok büyük.", 413); g = nesne(JSON.parse(t || "{}")); } catch { return hata("Geçersiz gövde."); }
  const [a, b, c] = yol;
  try {
    if (!a) {
      const bolum = String(g.bolum ?? "");
      const d = g.deger;
      const v = await isletmeDegistir(id, (x) => {
        switch (bolum) {
          case "profil": {
            const eskiUlke = x.profil.ulkeKodu;
            x.profil = profilTemizle(d); x.randevu.saatDilimi = x.profil.saatDilimi;
            // Mağaza ayarlarına hiç dokunulmadıysa ülkenin para birimi, vergi düzeni ve kargo varsayılanları uygulanır.
            const u = ulkeBul(x.profil.ulkeKodu);
            if (u && u.kod !== eskiUlke && !x.magaza.guncelleme) x.magaza = { ...x.magaza, paraBirimi: u.para, vergi: ulkeVergiVarsayilani(u.kod), varsayilanKdv: u.vergi.oran, kargo: ulkeKargoVarsayilani(u.kod), faturaIste: u.kod === "TR" };
            break;
          }
          case "magaza": x.magaza = { ...magazaTemizle(d, x.profil.ulkeKodu), kurlar: x.magaza.kurlar ?? null }; break;
          case "randevu": x.randevu = { ...randevuAyarTemizle(d), saatDilimi: x.profil.saatDilimi, ...(x.randevu.takvimAnahtari ? { takvimAnahtari: x.randevu.takvimAnahtari } : {}) }; break;
          case "blog": x.blog = blogAyarTemizle(d); break;
          case "dil": x.dil = dilAyarTemizle(d); break;
          case "eklentiler": x.eklentiler = eklentiTemizle(d); break;
          case "yasal": x.yasal = yasalTemizle(d, x.yasal); break;
          case "eposta": x.eposta = kurumsalEpostaTemizle(d); break;
          case "kurulum": { const ad = metin(nesne(d).adim, 40); if (ad && !x.kurulum.bitti.includes(ad)) x.kurulum.bitti.push(ad); break; }
          default: throw new OdemeHata("Bölüm geçersiz.");
        }
        return x;
      });
      return tamam({ veri: v });
    }
    if (a === "kupon") {
      const v = await isletmeDegistir(id, (x) => {
        const eski = typeof g.id === "string" ? x.kuponlar.find((k) => k.id === g.id) : undefined;
        const k = kuponTemizle(g.kupon, eski);
        if (!k) throw new OdemeHata("Kupon kodu 3-30 karakter olmalı; yalnız harf, rakam, tire ve alt çizgi.");
        if (x.kuponlar.some((y) => y.kod === k.kod && y.id !== k.id)) throw new OdemeHata(`${k.kod} kodu zaten var.`);
        if (eski) Object.assign(eski, k); else { if (x.kuponlar.length >= 200) throw new OdemeHata("En çok 200 kupon olabilir."); x.kuponlar.unshift(k); }
        return x;
      });
      return tamam({ kuponlar: v.kuponlar });
    }
    if (a === "magaza") {
      const ortam = ortamAl(g.ortam);
      if (b === "kur") return tamam(await magazaKur(id, ortam));
      if (b === "doviz") return tamam({ kurlar: await kurlariGuncelle(id), veri: await isletmeOku(id) });
      if (b === "urun") return tamam({ urun: await urunKaydet(id, ortam, typeof g.id === "string" && g.id ? g.id : null, g.urun) });
      if (b === "stok") return tamam({ guncellenen: await stokGuncelle(id, ortam, g.satirlar) });
      if (b === "ai") {
        if (sinirli(`iai:${id}`, 10)) return hata("Çok sık istendi; biraz bekle.", 429);
        return tamam(await aiUrunAciklama(await isletmeOku(id), { ad: metin(g.ad, 120), kategori: metin(g.kategori, 60), notlar: metin(g.notlar, 600) }));
      }
    }
    if (a === "siparis" && b) return tamam(await siparisGuncelle(id, ortamAl(g.ortam), b, g, koken));
    if (a === "sepet" && b && c === "hatirlat") { const r = await terkHatirlat(id, b, koken); return r.ok ? tamam() : hata(r.hata ?? "Gönderilemedi.", 409); }
    if (a === "randevu") {
      if (b === "takvim-anahtari") {
        const v = await isletmeDegistir(id, (x) => { x.randevu.takvimAnahtari = randomBytes(18).toString("base64url"); return x; });
        return tamam({ adres: `${koken}/api/build/isletme-genel/${id}/randevu/takvim/${v.randevu.takvimAnahtari}.ics` });
      }
      if (!b) {
        const r = await randevuOlustur(id, g, { kaynak: "panel", zorla: g.zorla === true });
        const gitti = g.bildir === true ? await randevuEpostalari(id, r, koken, "onay").catch(() => false) : false;
        return tamam({ randevu: r, eposta: gitti });
      }
      if (typeof g.bas === "number") {
        const r = await randevuTasi(id, b, g.bas, g.zorla === true);
        const gitti = g.bildir === true ? await randevuEpostalari(id, r, koken, "degisti").catch(() => false) : false;
        return tamam({ randevu: r, eposta: gitti });
      }
      const durum = String(g.durum ?? "") as RandevuDurum;
      if (!["bekliyor", "onaylandi", "iptal", "geldi", "gelmedi"].includes(durum)) return hata("Durum geçersiz.");
      const x = await randevuDurumu(id, b, durum, metin(g.neden, 200));
      let gitti = false;
      if (g.bildir === true && x.onceki !== durum && (durum === "onaylandi" || durum === "iptal")) gitti = await randevuEpostalari(id, x.r, koken, durum === "onaylandi" ? "onay" : "iptal").catch(() => false);
      return tamam({ randevu: x.r, eposta: gitti });
    }
    if (a === "yazi") {
      if (b === "ai") {
        if (sinirli(`iai:${id}`, 10)) return hata("Çok sık istendi; biraz bekle.", 429);
        return tamam(await aiBlogTaslak(p, await isletmeOku(id), metin(g.konu, 300), metin(g.ton, 80)));
      }
      if (b === "ice-aktar") {
        const m = (await buyumeOku(id)).blog.makaleler.find((x) => x.id === g.makaleId);
        if (!m) return hata("Büyüme makalesi bulunamadı.", 404);
        const y = await listeDegistir<Yazi, Yazi>(id, "yazilar", (l) => { const yeni = yaziTemizle({ baslik: m.baslik, icerik: m.markdown.replace(/^#\s+.*\n+/, ""), seoBaslik: m.metaBaslik, seoAciklama: m.metaAciklama, slug: m.slug, etiketler: [m.anahtarKelime], kaynak: `buyume:${m.id}` }, undefined, l); l.push(yeni); return yeni; }, 2000);
        return tamam({ yazi: y });
      }
      const yaziTz = (await isletmeOku(id)).profil.saatDilimi;
      const y = await listeDegistir<Yazi, Yazi>(id, "yazilar", (l) => {
        const eski = typeof g.id === "string" ? l.find((x) => x.id === g.id) : undefined;
        if (!eski && l.length >= 2000) throw new OdemeHata("En çok 2000 yazı olabilir.");
        const yeni = yaziTemizle(g.yazi, eski, l, yaziTz);
        if (eski) Object.assign(eski, yeni); else l.push(yeni);
        return yeni;
      }, 2000);
      return tamam({ yazi: y });
    }
    if (a === "blog" && b === "siteye-yaz") {
      const v = await isletmeOku(id);
      const l = await listeOku<Yazi>(id, "yazilar");
      const s = blogSayfalari(p, v, l, siteAdresi(p, koken));
      const r = await projeyeYaz(id, sahip, s.dosyalar, `Blog sayfaları güncellendi (${s.statik.length} yazı)`);
      await listeDegistir<Yazi>(id, "yazilar", (x) => { const z = Date.now(); for (const y of x) { if (s.statik.includes(y.id)) y.statik = z; } }, 2000);
      return tamam(r);
    }
    if (a === "dil") {
      if (b === "tara") {
        const bulunan = metinleriCikar(p.dosyalar);
        const r = await listeDegistir<CeviriSatir, { yeni: number; toplam: number }>(id, "ceviriler", (l) => ceviriTablosunuGuncelle(l, bulunan), 4000);
        return tamam(r);
      }
      if (b === "cevir") {
        const v = await isletmeOku(id);
        const dil = metin(g.dil, 2);
        if (!v.dil.diller.includes(dil)) return hata("Önce bu dili ekle.");
        if (sinirli(`icv:${id}`, 20)) return hata("Çok sık istendi; biraz bekle.", 429);
        const l = await listeOku<CeviriSatir>(id, "ceviriler");
        const istenen = Array.isArray(g.idler) ? new Set(g.idler.map(String)) : null;
        const bekleyen = l.filter((s) => (istenen ? istenen.has(s.id) : !s.ceviri[dil]?.metin || s.ceviri[dil].durum === "eski"));
        if (!bekleyen.length) return tamam({ cevrilen: 0, kalan: 0 });
        const r = await aiCevir(v, bekleyen.slice(0, 60), dil);
        await listeDegistir<CeviriSatir>(id, "ceviriler", (x) => { for (const s of x) if (r.ceviriler[s.id]) s.ceviri[dil] = { metin: r.ceviriler[s.id], durum: "ai", z: Date.now() }; }, 4000);
        return tamam({ cevrilen: Object.keys(r.ceviriler).length, kalan: Math.max(0, bekleyen.length - 60), kredi: r.kredi });
      }
      if (b === "metin") {
        const dil = metin(g.dil, 2), sid = String(g.id ?? ""), m = metin(g.metin, 1000, true);
        await listeDegistir<CeviriSatir>(id, "ceviriler", (x) => { const s = x.find((y) => y.id === sid); if (!s) throw new OdemeHata("Satır bulunamadı.", 404); if (m) s.ceviri[dil] = { metin: m, durum: "elle", z: Date.now() }; else delete s.ceviri[dil]; }, 4000);
        return tamam();
      }
    }
    if (a === "yasal" && b === "siteye-yaz") {
      const v = await isletmeOku(id);
      const turler = (Array.isArray(g.turler) ? g.turler : []).map(String).filter((t): t is YasalTur => YASAL_TURLER.some((x) => x.id === t));
      if (!turler.length) return hata("En az bir metin seç.");
      const dosyalar = yasalSayfalari(p, v, turler, siteAdresi(p, koken));
      const r = await projeyeYaz(id, sahip, dosyalar, `Yasal metinler eklendi: ${turler.length} sayfa`);
      await isletmeDegistir(id, (x) => { for (const t of turler) x.yasal.sayfalar[t] = { dosya: YASAL_TURLER.find((y) => y.id === t)!.dosya, zaman: Date.now(), ...(r.surumNo ? { surumNo: r.surumNo } : {}) }; });
      return tamam(r);
    }
    if (a === "yorum" && b) {
      if (c === "ai") {
        const y = (await listeOku<Yorum>(id, "yorumlar")).find((x) => x.id === b);
        if (!y) return hata("Yorum bulunamadı.", 404);
        return tamam(await aiYorumYaniti(await isletmeOku(id), y));
      }
      await listeDegistir<Yorum>(id, "yorumlar", (l) => { const y = l.find((x) => x.id === b); if (!y) throw new OdemeHata("Yorum bulunamadı.", 404); if (g.durum === "onayli" || g.durum === "gizli" || g.durum === "bekliyor") y.durum = g.durum; if (typeof g.yanit === "string") y.yanit = metin(g.yanit, 1000, true); }, 5000);
      return tamam();
    }
    if (a === "sohbet" && b) {
      sahipGorundu(id);
      const icerik = metin(g.metin, 2000, true);
      await listeDegistir<Sohbet>(id, "sohbetler", (l) => {
        const s = l.find((x) => x.id === b);
        if (!s) throw new OdemeHata("Sohbet bulunamadı.", 404);
        if (icerik) { s.mesajlar.push({ z: Date.now(), kim: "isletme", metin: icerik }); s.guncelleme = Date.now(); }
        if (typeof g.kapali === "boolean") s.kapali = g.kapali;
        s.okundu = true;
      }, 2000);
      return tamam();
    }
    return hata("Bulunamadı.", 404);
  } catch (e) { return hataYaniti(e); }
}

export async function DELETE(req: Request, ctx: Ctx) {
  const h = await hazirla(req, ctx, true);
  if ("r" in h) return h.r;
  const { id, yol } = h;
  const u = new URL(req.url);
  const [a, b, c] = yol;
  try {
    if (a === "magaza" && b === "urun" && c) return tamam({ silindi: await urunSil(id, ortamAl(u.searchParams.get("ortam")), c) });
    if (a === "kupon" && b) { const v = await isletmeDegistir(id, (x) => { x.kuponlar = x.kuponlar.filter((k) => k.id !== b); return x; }); return tamam({ kuponlar: v.kuponlar }); }
    const sil = async <T extends { id: string }>(tur: "randevular" | "yazilar" | "yorumlar" | "sohbetler" | "aboneler" | "ceviriler") => { await listeDegistir<T>(id, tur, (l) => { const i = l.findIndex((x) => x.id === b); if (i >= 0) l.splice(i, 1); }, 8000); return tamam(); };
    if (b && a === "randevu") return sil<Randevu>("randevular");
    if (b && a === "yazi") return sil<Yazi>("yazilar");
    if (b && a === "yorum") return sil<Yorum>("yorumlar");
    if (b && a === "sohbet") return sil<Sohbet>("sohbetler");
    if (b && a === "abone") return sil<Abone>("aboneler");
    if (b && a === "dil") return sil<CeviriSatir>("ceviriler");
    return hata("Bulunamadı.", 404);
  } catch (e) { return hataYaniti(e); }
}

/** NAP (ad, adres, telefon) tutarlılığı: sitede geçen bilgiler profille aynı mı; Google İşletme Profili bağlantısı var mı. */
function profilDenetle(p: Proje, v: Awaited<ReturnType<typeof isletmeOku>>) {
  const metinler = Object.entries(p.dosyalar).filter(([y]) => y.endsWith(".html")).map(([, d]) => d.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " "));
  const hepsi = metinler.join("\n");
  const duz = hepsi.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  const rakam = (s: string) => s.replace(/\D/g, "").replace(/^(90|0)/, "");
  const telefonlar = [...new Set([...duz.matchAll(/(?:\+90|0)?\s?\(?5\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}|(?:\+90|0)\s?\(?[2-4]\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}|0?850[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/g)].map((m) => m[0].trim()))];
  const pr = v.profil;
  const tel = rakam(pr.telefon);
  const epostalar = [...new Set([...duz.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/g)].map((m) => m[0].toLowerCase()))].filter((x) => !/\.(png|jpe?g|webp|svg)$/.test(x));
  const maddeler: { id: string; ad: string; durum: "tamam" | "uyari" | "eksik"; alt: string }[] = [];
  maddeler.push({ id: "ad", ad: "İşletme adı sitede geçiyor", durum: !pr.ad ? "eksik" : duz.toLocaleLowerCase("tr").includes(pr.ad.toLocaleLowerCase("tr")) ? "tamam" : "uyari", alt: !pr.ad ? "Profilde ad yok" : duz.toLocaleLowerCase("tr").includes(pr.ad.toLocaleLowerCase("tr")) ? pr.ad : `"${pr.ad}" sitede yazmıyor; Google'daki adla aynı olmalı` });
  const farkliTel = telefonlar.filter((t) => rakam(t) !== tel);
  maddeler.push({ id: "telefon", ad: "Telefon tutarlı", durum: !tel ? "eksik" : farkliTel.length ? "uyari" : telefonlar.length ? "tamam" : "uyari", alt: !tel ? "Profilde telefon yok" : farkliTel.length ? `Sitede farklı numara var: ${farkliTel.slice(0, 3).join(", ")}` : telefonlar.length ? pr.telefon : "Telefon sitede yazmıyor; iletişim bölümüne ekle" });
  const farkliEposta = epostalar.filter((e) => e !== pr.eposta);
  maddeler.push({ id: "eposta", ad: "E-posta tutarlı", durum: !pr.eposta ? "eksik" : farkliEposta.length ? "uyari" : epostalar.length ? "tamam" : "uyari", alt: !pr.eposta ? "Profilde e-posta yok" : farkliEposta.length ? `Sitede farklı adres var: ${farkliEposta.slice(0, 3).join(", ")}` : epostalar.length ? pr.eposta : "E-posta sitede yazmıyor" });
  const sokakParca = pr.adres.sokak.split(/[,\s]+/).filter((x) => x.length > 3).slice(0, 3);
  const adresVar = !!pr.adres.sokak && sokakParca.every((x) => duz.toLocaleLowerCase("tr").includes(x.toLocaleLowerCase("tr")));
  maddeler.push({ id: "adres", ad: "Adres sitede geçiyor", durum: pr.adresGizli ? "tamam" : !pr.adres.sokak ? "eksik" : adresVar ? "tamam" : "uyari", alt: pr.adresGizli ? "Adres gizli; hizmet bölgesi kullanılıyor" : !pr.adres.sokak ? "Profilde adres yok" : adresVar ? "Sitedeki adres profille uyumlu" : "Sitedeki adres profildekiyle aynı yazılmamış" });
  const ldVar = /application\/ld\+json/.test(hepsi) || v.eklentiler.yapisalVeri;
  maddeler.push({ id: "yapisal", ad: "Yapılandırılmış veri (LocalBusiness)", durum: ldVar && pr.ad ? "tamam" : "uyari", alt: v.eklentiler.yapisalVeri ? "Ana sayfaya otomatik ekleniyor" : ldVar ? "Sitede kendi yapılandırılmış verisi var" : "Eklentiler bölümünden aç" });
  maddeler.push({ id: "google", ad: "Google İşletme Profili bağlantısı", durum: pr.googleProfil ? "tamam" : "uyari", alt: pr.googleProfil ? "Profil adresi kayıtlı; sitedeki bilgilerle aynı tut" : "business.google.com üzerinden profil açıp adresini ekle" });
  maddeler.push({ id: "saat", ad: "Çalışma saatleri", durum: pr.saatler.some((x) => x.acik) ? "tamam" : "eksik", alt: pr.saatler.some((x) => x.acik) ? "Yapılandırılmış veride yer alıyor" : "Saat girilmemiş" });
  return { maddeler, telefonlar, epostalar };
}
