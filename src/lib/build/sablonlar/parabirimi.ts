/**
 * Şablonların ortak para birimi yardımcısı (app.js içine gömülür). Para birimi bir ayardır: projede "ayarlar" tablosundaki
 * tek kayıtta (paraBirimi), galeri önizlemesinde bu cihazın belleğinde tutulur. Biçim Intl.NumberFormat ile yapılır;
 * ülkeye özel para birimi sabitlenmez. ORTAK_JS'teki tl() işlevi burada seçili para birimiyle yeniden tanımlanır.
 * Düz modern JavaScript; ters tırnak kullanılmaz (String.raw ile gömülür).
 */
import type { SablonTablo } from "./kurulum";

export const PARA_BIRIMLERI = [
  { kod: "TRY", ad: "Türk lirası" },
  { kod: "USD", ad: "ABD doları" },
  { kod: "EUR", ad: "Avro" },
  { kod: "GBP", ad: "İngiliz sterlini" },
  { kod: "CHF", ad: "İsviçre frangı" },
  { kod: "CAD", ad: "Kanada doları" },
  { kod: "AUD", ad: "Avustralya doları" },
  { kod: "AED", ad: "BAE dirhemi" },
  { kod: "SAR", ad: "Suudi riyali" },
  { kod: "JPY", ad: "Japon yeni" },
  { kod: "INR", ad: "Hindistan rupisi" },
  { kod: "BRL", ad: "Brezilya reali" },
  { kod: "MXN", ad: "Meksika pesosu" },
  { kod: "SEK", ad: "İsveç kronu" },
  { kod: "PLN", ad: "Polonya zlotisi" },
  { kod: "AZN", ad: "Azerbaycan manatı" },
];

/** Projede kurulan ayar tablosu (tek kayıt, id "ayarlar"). */
export const AYARLAR_TABLOSU = (ek?: { aciklama?: string }): SablonTablo => ({
  aciklama: ek?.aciklama || "Uygulama ayarları (tek kayıt, id ayarlar). paraBirimi: tutarların gösterildiği ISO 4217 para birimi kodu.",
  kurallar: { okuma: "kapali", ekleme: "kapali", duzenleme: "kapali" },
  sema: [{ ad: "paraBirimi", tur: "metin", varsayilan: "TRY", aciklama: "ISO 4217 para birimi kodu, örneğin TRY, USD, EUR" }],
  kayitlar: [{ id: "ayarlar", paraBirimi: "TRY" }],
});

/** anahtar: galeri önizlemesinde bu cihazda saklanan ayarın adı. */
export const PARA_JS = (anahtar: string) => "\nvar PARA_BIRIMLERI = " + JSON.stringify(PARA_BIRIMLERI) + ";\nvar PB = { kod: (typeof siteAyar === \"function\" ? siteAyar(\"data-para-birimi\", \"TRY\") : \"TRY\"), kayit: null, anahtar: " + JSON.stringify(anahtar) + " };\n" + String.raw`
/* ── Para birimi (ayar) ── */
function pbBicim(n, kisa) {
  n = Number(n || 0);
  try { return new Intl.NumberFormat(typeof siteAyar === "function" ? siteAyar("data-yerel", "tr-TR") : "tr-TR", { style: "currency", currency: PB.kod, minimumFractionDigits: 0, maximumFractionDigits: kisa ? 0 : 2 }).format(n); }
  catch (e) { return n.toLocaleString("tr-TR", { maximumFractionDigits: kisa ? 0 : 2 }) + " " + PB.kod; }
}
/* ORTAK_JS'teki tl() yerine geçer: seçili para birimiyle yazar. */
function tl(n) { return pbBicim(n, false); }
/* Büyük tutarlar için "3,9 milyon" ve para birimi simgesi. */
function pbKisa(n) {
  n = Number(n || 0);
  if (Math.abs(n) < 1e6) return pbBicim(Math.round(n), true);
  var s = pbBicim(0, true).replace(/[\d\s., ]/g, "") || PB.kod;
  return (n / 1e6).toLocaleString("tr-TR", { maximumFractionDigits: 2 }) + " milyon " + s;
}
function pbSecenekleri() {
  var l = PARA_BIRIMLERI.slice(); if (!l.some(function (x) { return x.kod === PB.kod; })) l.push({ kod: PB.kod, ad: PB.kod });
  return l.map(function (x) { return '<option value="' + x.kod + '"' + (x.kod === PB.kod ? " selected" : "") + ' title="' + x.ad + '">' + x.kod + "</option>"; }).join("");
}
function pbYukle() {
  if (!veriVar()) { try { var k = localStorage.getItem(PB.anahtar); if (k) PB.kod = k; } catch (e) { /* yok say */ } return Promise.resolve(); }
  return vayra.veri.liste("ayarlar", { sinir: 5 }).then(function (l) {
    var r = (l || []).find(function (x) { return x.id === "ayarlar"; }) || (l || [])[0] || null;
    PB.kayit = r; if (r && r.paraBirimi) PB.kod = String(r.paraBirimi);
  }).catch(function () { /* tablo yoksa varsayılan */ });
}
function pbKaydet(kod) {
  PB.kod = kod;
  if (!veriVar()) { try { localStorage.setItem(PB.anahtar, kod); } catch (e) { /* yok say */ } return Promise.resolve(); }
  var is = PB.kayit ? vayra.veri.guncelle("ayarlar", PB.kayit.id, { paraBirimi: kod }) : vayra.veri.ekle("ayarlar", { paraBirimi: kod });
  return is.then(function (r) { if (r) PB.kayit = r; });
}
`;
