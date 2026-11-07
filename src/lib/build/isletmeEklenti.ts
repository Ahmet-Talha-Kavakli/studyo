import "server-only";
import { EKLENTI_KODU } from "./isletmeEklentiKod";
import { DILLER, GUN_SCHEMA, type IsletmeVeri, type Yorum } from "./isletmeTipler";
import { paraSimgesi } from "./bolge";

/**
 * Site eklentisinin yapılandırması ve betiği. Yalnız açık olan bileşenlerin ayarları siteye gider; e-posta adresleri,
 * kupon listesi ve iç ayarlar gitmez (açılır pencerenin kupon kodu yalnız e-posta bırakılınca sunucudan döner).
 */
export function yapisalVeri(v: IsletmeVeri, site: string, yorumlar: Yorum[]) {
  const p = v.profil;
  if (!p.ad) return null;
  const acikGunler = p.saatler.map((g, i) => ({ g, i })).filter((x) => x.g.acik);
  const saatler = acikGunler.flatMap(({ g, i }) => (g.molaBas && g.molaBit
    ? [{ "@type": "OpeningHoursSpecification", dayOfWeek: GUN_SCHEMA[i], opens: g.bas, closes: g.molaBas }, { "@type": "OpeningHoursSpecification", dayOfWeek: GUN_SCHEMA[i], opens: g.molaBit, closes: g.bit }]
    : [{ "@type": "OpeningHoursSpecification", dayOfWeek: GUN_SCHEMA[i], opens: g.bas, closes: g.bit }]));
  const ozel = p.ozelGunler.filter((o) => o.tarih >= new Date().toISOString().slice(0, 10)).slice(0, 20).map((o) => ({ "@type": "OpeningHoursSpecification", validFrom: o.tarih, validThrough: o.tarih, ...(o.acik ? { opens: o.bas, closes: o.bit } : { opens: "00:00", closes: "00:00" }) }));
  const onayli = yorumlar.filter((y) => y.durum === "onayli" && y.hedef === "isletme");
  const sameAs = Object.values(p.sosyal).filter(Boolean).concat(p.googleProfil ? [p.googleProfil] : []);
  return {
    "@context": "https://schema.org", "@type": p.tur || "LocalBusiness", name: p.ad, url: site,
    ...(p.aciklama ? { description: p.aciklama.slice(0, 500) } : {}), ...(p.logo ? { logo: p.logo } : {}), ...(p.gorsel || p.logo ? { image: p.gorsel || p.logo } : {}),
    ...(p.telefon ? { telephone: p.telefon } : {}), ...(p.eposta ? { email: p.eposta } : {}), ...(p.fiyatAraligi ? { priceRange: paraSimgesi(v.magaza.paraBirimi, p.yerel || "en-US").repeat(Number(p.fiyatAraligi) || 1) } : {}),
    ...(!p.adresGizli && (p.adres.sokak || p.adres.il) ? { address: { "@type": "PostalAddress", streetAddress: p.adres.sokak, addressLocality: p.ulkeKodu === "TR" ? p.adres.ilce || p.adres.il : p.adres.il, addressRegion: p.ulkeKodu === "TR" ? p.adres.il : p.adres.bolge || undefined, postalCode: p.adres.postaKodu, addressCountry: p.ulkeKodu || p.adres.ulke } } : {}),
    ...(p.adresGizli && p.hizmetBolgesi ? { areaServed: p.hizmetBolgesi } : {}),
    ...(!p.adresGizli && p.konum.enlem !== null && p.konum.boylam !== null ? { geo: { "@type": "GeoCoordinates", latitude: p.konum.enlem, longitude: p.konum.boylam } } : {}),
    ...(saatler.length ? { openingHoursSpecification: [...saatler, ...ozel] } : {}), ...(sameAs.length ? { sameAs } : {}),
    ...(onayli.length >= 1 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: Math.round((onayli.reduce((t, y) => t + y.puan, 0) / onayli.length) * 10) / 10, reviewCount: onayli.length, bestRating: 5, worstRating: 1 } } : {}),
  };
}

export function eklentiBetigi(v: IsletmeVeri, g: { adres: string; koken: string; kok: string; site: string; yorumlar: Yorum[] }): string {
  const e = v.eklentiler;
  const herhangi = e.whatsapp.acik || e.sohbet.acik || e.duyuru.acik || e.popup.acik || e.cerez.acik || v.dil.diller.length > 0 || !!v.profil.ad;
  const p = v.profil;
  const C = {
    a: g.adres, o: g.koken, k: g.kok,
    pb: { kod: v.magaza.paraBirimi, yerel: p.yerel || "tr-TR" }, tz: p.saatDilimi || "UTC",
    e: {
      ...(e.cerez.acik ? { cerez: e.cerez } : {}),
      ...(e.duyuru.acik ? { duyuru: e.duyuru } : {}),
      ...(e.whatsapp.acik && e.whatsapp.numara ? { whatsapp: e.whatsapp } : {}),
      ...(e.sohbet.acik ? { sohbet: { acik: true, baslik: e.sohbet.baslik, karsilama: e.sohbet.karsilama, cevrimdisi: e.sohbet.cevrimdisi, eposta: e.sohbet.eposta, konum: e.sohbet.konum } } : {}),
      ...(e.popup.acik ? { popup: { ...e.popup, kuponKod: undefined } } : {}),
    },
    p: e.harita && !p.adresGizli ? { enlem: p.konum.enlem, boylam: p.konum.boylam, adres: [p.adres.sokak, p.adres.ilce, p.adres.il].filter(Boolean).join(", ") } : {},
    d: v.dil.diller.length ? { kaynak: v.dil.kaynak, diller: v.dil.diller, secici: v.dil.secici, tarayici: v.dil.tarayiciDili, adlar: Object.fromEntries(DILLER.filter((d) => d.kod === v.dil.kaynak || v.dil.diller.includes(d.kod)).map((d) => [d.kod, d.yerel])) } : null,
    ld: e.yapisalVeri ? yapisalVeri(v, g.site, g.yorumlar) : null,
  };
  // Bileşen kapalıyken de data-vayra-* öğeleri (blog, randevu, yorum, takip) çalışsın diye betik her zaman yüklenir.
  void herhangi;
  return `(function(C){try{(function(){${EKLENTI_KODU}})()}catch(e){try{console.warn("Vayra eklentisi:",e)}catch(x){}}})(${JSON.stringify(C).replace(/</g, "\\u003c")});`;
}
