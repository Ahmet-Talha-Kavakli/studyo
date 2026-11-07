/**
 * Şablonların ortak tarayıcı yardımcıları (her şablonun app.js dosyasının başına eklenir; proje kendi içinde bağımsız kalır).
 * Düz modern JavaScript; şablon dizgesi (ters tırnak) kullanılmaz, çünkü dosya içerikleri String.raw ile gömülür.
 */
export const ORTAK_JS = String.raw`/* ── Ortak yardımcılar ── */
var $ = function (s, k) { return (k || document).querySelector(s); };
var $$ = function (s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); };
/** HTML'e yazılan her veri bu işlevden geçer (tablodan gelen metin sayfayı bozamaz). */
function kacir(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
/**
 * Sitenin para birimi, yerel biçimi ve saat dilimi: <html data-para-birimi="USD" data-yerel="en-US" data-saat-dilimi="America/New_York">.
 * Nitelik yoksa şablonun kendi ülkesi (Türk lirası, Türkiye saati) kullanılır; ajan siteyi başka ülkeye uyarlarken nitelikleri değiştirir.
 */
function siteAyar(ad, vars) { try { var v = document.documentElement.getAttribute(ad); return v || vars; } catch (e) { return vars; } }
function tl(n) {
  var kod = siteAyar("data-para-birimi", "TRY"), yerel = siteAyar("data-yerel", "tr-TR");
  if (kod === "TRY" && /^tr/.test(yerel)) return Number(n || 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 }) + " TL";
  try { return new Intl.NumberFormat(yerel, { style: "currency", currency: kod, maximumFractionDigits: 2 }).format(Number(n || 0)); } catch (e) { return Number(n || 0).toFixed(2) + " " + kod; }
}
/** Vayra Veri bağlı mı? Şablon galerisindeki canlı önizlemede bağlı değildir; sayfa o zaman gömülü verilerle çalışır. */
function veriVar() { return !!(window.vayra && window.vayra.veri); }
/** Analitik olayı (Bulut > Analitik); kişisel veri gönderilmez. */
function olay(ad, veri) { try { if (window.vayra && window.vayra.olay) window.vayra.olay(ad, veri || {}); } catch (e) { /* yok say */ } }
/** İşletmenin saat dilimine göre an (data-saat-dilimi, yoksa İstanbul): { tarih: "2026-11-05", gun: 0 (pazar) ile 6 (cumartesi) arası, dakika: gün içindeki dakika }. */
function istanbul(an) {
  var o = {};
  new Intl.DateTimeFormat("en-CA", { timeZone: siteAyar("data-saat-dilimi", "Europe/Istanbul"), year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short" })
    .formatToParts(an || new Date()).forEach(function (p) { o[p.type] = p.value; });
  return { tarih: o.year + "-" + o.month + "-" + o.day, gun: { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday], dakika: Number(o.hour) * 60 + Number(o.minute) };
}
/** "2026-11-05" biçimli tarihe gün ekler (saat dilimi kaymaz). */
function gunEkle(tarih, n) { var d = new Date(tarih + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function haftaGunu(tarih) { return new Date(tarih + "T12:00:00Z").getUTCDay(); }
function tarihYaz(tarih, secenek) { return new Date(tarih + "T12:00:00Z").toLocaleDateString("tr-TR", Object.assign({ day: "numeric", month: "long", timeZone: "UTC" }, secenek || {})); }
function saatDakika(s) { var p = String(s || "0:0").split(":"); return Number(p[0]) * 60 + Number(p[1] || 0); }
function dakikaSaat(d) { d = ((d % 1440) + 1440) % 1440; return String(Math.floor(d / 60)).padStart(2, "0") + ":" + String(d % 60).padStart(2, "0"); }
/** Saat sonrası Türkçe ek, okunuşa göre: saatEki(1380, "e") "e" (23.00'e), saatEki(30, "e") "a" (00.30'a), saatEki(720, "de") "de" (12.00'de). */
function saatEki(d, tur) {
  d = ((d % 1440) + 1440) % 1440;
  var n = d % 60 || Math.floor(d / 60), k = n === 0 ? "sıfır" : n % 10 ? ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"][n % 10] : ["", "on", "yirmi", "otuz", "kırk", "elli"][Math.floor(n / 10)];
  var kalin = /[aıou]/.test((k.match(/[aeıioöuü]/g) || ["e"]).pop());
  if (tur === "e") return (/[aeıioöuü]$/.test(k) ? "y" : "") + (kalin ? "a" : "e");
  return (/[çfhkpsşt]$/.test(k) ? "t" : "d") + (kalin ? "a" : "e");
}
/** Sunucu fonksiyonunu (api/<ad>.js) sade bir GET isteğiyle okur. Oturum başlığı göndermez, bu yüzden tarayıcı ön kontrol
 * isteği yapmaz; kimlik gerektirmeyen okuma fonksiyonları (doluluk, sayım) için. Şablon galerisinde fonksiyon yoktur. */
function fonksiyonVar() { return !!(window.vayra && window.vayra.fonksiyon); }
function fonksiyonOku(ad, sorgu) {
  var u = new URL("api/" + ad + (sorgu ? "?" + new URLSearchParams(sorgu).toString() : ""), document.baseURI).href;
  return fetch(u).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.hata || "Sunucu fonksiyonu yanıt vermedi (" + r.status + ")"); return j; }); });
}
/** Kısa bildirim (ekran okuyucular için role=status). */
function bildir(metin, tur) {
  var b = $("#bildirim");
  if (!b) { b = document.createElement("div"); b.id = "bildirim"; b.className = "bildirim"; b.setAttribute("role", "status"); b.setAttribute("aria-live", "polite"); document.body.appendChild(b); }
  b.textContent = metin; b.dataset.tur = tur || "bilgi"; b.classList.add("acik");
  clearTimeout(bildir.z); bildir.z = setTimeout(function () { b.classList.remove("acik"); }, 3800);
}
/** Mobil menü düğmesi: [data-menu-ac] düğmesi [data-menu] panelini açar ve kapatır. */
(function () {
  var d = $("[data-menu-ac]"), p = $("[data-menu]");
  if (!d || !p) return;
  d.addEventListener("click", function () { var a = d.getAttribute("aria-expanded") === "true"; d.setAttribute("aria-expanded", String(!a)); p.classList.toggle("acik", !a); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && p.classList.contains("acik")) { p.classList.remove("acik"); d.setAttribute("aria-expanded", "false"); d.focus(); } });
})();
`;
