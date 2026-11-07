import "server-only";
import { formlariOku } from "./depo";
import { SIPARIS_TABLOSU, type Siparis } from "./odeme";
import { uyeleriListele } from "./uye";
import { veriOku } from "./veri";
import { listeOku } from "./isletme";
import type { Abone, Randevu } from "./isletmeTipler";
import { davetKodu, dogumTemizle, epostaGecerli, kisiAnahtari, type EkVeri, type Kisi, type KisiKaynak, type KisiOlay } from "./buyumeEkTipler";

/**
 * Kişiler (hafif CRM): site üyeleri, İşletme bülten aboneleri, form gönderenler, randevu alanlar ve canlı sipariş verenler e-posta (yoksa telefon) üzerinden
 * tek kişide birleşir; sahibin etiketleri, notu ve izin kaydı (EkVeri.kisiMeta) üstüne biner. Kampanya olayları zaman
 * çizelgesine eklenir. Formdaki onay alanı (izin, onay, kvkk, bülten, abone, pazarlama) işaretliyse izin "onay" olur
 * ve kaynağı yazılır; reddedenler ve abonelikten çıkanlar hiçbir pazarlama iletisi almaz.
 */
const EPOSTA_ALAN = /^(e-?posta|e-?mail|mail|email|eposta_adresi|e_posta)$/i;
const AD_ALAN = /^(ad|isim|name|ad ?soyad|adsoyad|ad_soyad|full ?name|fullname|adiniz|adınız)$/i;
const TEL_ALAN = /^(tel|telefon|phone|gsm|cep|cep ?telefonu|telefon_numarasi)$/i;
const IZIN_ALAN = /^(izin|onay|kvkk|bulten|bülten|abone|abonelik|pazarlama|iletisim_izni|ticari_ileti|newsletter|consent)$/i;
const EVET = /^(on|true|evet|1|yes|kabul|onay|onaylıyorum|var)$/i;
const DOGUM_ALAN = /^(dogum|doğum|dogum_tarihi|doğum_tarihi|dogum ?gunu|doğum ?günü|dogum_gunu|birthday|birthdate|dob)$/i;

function alanBul(a: Record<string, string>, re: RegExp) { for (const [k, v] of Object.entries(a)) if (re.test(k.trim())) return v.trim(); return ""; }
function epostaBul(a: Record<string, string>) { const e = alanBul(a, EPOSTA_ALAN); if (epostaGecerli(e)) return e; for (const v of Object.values(a)) if (epostaGecerli(v.trim())) return v.trim(); return ""; }

export async function kisileriKur(id: string, ek: EkVeri): Promise<Kisi[]> {
  const harita = new Map<string, Kisi>();
  const al = (anahtar: string, z: number, kaynak: KisiKaynak, g: { eposta?: string; ad?: string; telefon?: string; sehir?: string }): Kisi => {
    let k = harita.get(anahtar);
    if (!k) { k = { id: anahtar, eposta: g.eposta?.toLocaleLowerCase("tr-TR"), ad: "", kaynaklar: [], ilk: z, son: z, formSayisi: 0, siparisSayisi: 0, harcama: 0, etiketler: [], izin: "bilinmiyor", olaylar: [] }; harita.set(anahtar, k); }
    if (!k.kaynaklar.includes(kaynak)) k.kaynaklar.push(kaynak);
    k.ilk = Math.min(k.ilk, z); k.son = Math.max(k.son, z);
    if (g.ad && !k.ad) k.ad = g.ad; if (g.telefon && !k.telefon) k.telefon = g.telefon; if (g.sehir && !k.sehir) k.sehir = g.sehir;
    if (g.eposta && !k.eposta) k.eposta = g.eposta.toLocaleLowerCase("tr-TR");
    return k;
  };
  const olay = (k: Kisi, o: KisiOlay) => { if (k.olaylar.length < 200) k.olaylar.push(o); };

  const [uyeler, formlar, siparisler, aboneler, randevular] = await Promise.all([
    uyeleriListele(id).catch(() => []),
    formlariOku(id).catch(() => []),
    veriOku(id, "canli").then((v) => (v.koleksiyonlar[SIPARIS_TABLOSU]?.kayitlar ?? []) as Siparis[]).catch(() => [] as Siparis[]),
    listeOku<Abone>(id, "aboneler").catch(() => [] as Abone[]),
    listeOku<Randevu>(id, "randevular").catch(() => [] as Randevu[]),
  ]);
  // İşletme bülten aboneleri (açılır pencere ve bülten formu): onay kutusu işaretliyse izin "onay".
  for (const a of aboneler) {
    if (!epostaGecerli(a.eposta)) continue;
    const k = al(kisiAnahtari(a.eposta), a.olusturma, "abone", { eposta: a.eposta, ad: a.ad });
    olay(k, { z: a.olusturma, tur: "abone", metin: `Bültene abone oldu${a.kaynak ? ` (${a.kaynak}${a.sayfa ? `, ${a.sayfa}` : ""})` : ""}` });
    if (a.izin && k.izin !== "onay") { k.izin = "onay"; k.izinKaynak = a.onayZaman ? `Çift onaylı bülten aboneliği: e-posta bağlantısı doğrulandı${a.ip ? `, IP ${a.ip}` : ""}${a.sayfa ? ` (${a.sayfa})` : ""}` : `Bülten aboneliği onay kutusu${a.sayfa ? ` (${a.sayfa})` : ""}`; k.izinZaman = a.onayZaman ?? a.olusturma; }
    else if (!a.izin && a.onayKodu && k.izin === "bilinmiyor") { k.izinKaynak = "Çift onay bekleniyor: onay e-postasındaki bağlantıya henüz tıklanmadı"; }
  }
  // İşletme randevuları: iletişim bilgisi ve zaman çizelgesi (izin vermez).
  for (const r of randevular) {
    const anahtar = kisiAnahtari(r.eposta, r.telefon);
    if (!anahtar) continue;
    const k = al(anahtar, r.olusturma, "randevu", { eposta: r.eposta || undefined, ad: r.ad, telefon: r.telefon || undefined });
    k.randevuSayisi = (k.randevuSayisi ?? 0) + 1;
    if (r.durum === "geldi") k.son = Math.max(k.son, r.bit);
    olay(k, { z: r.olusturma, tur: "randevu", metin: `${r.hizmetAd} randevusu${r.durum === "iptal" ? ", iptal edildi" : r.durum === "geldi" ? ", geldi" : r.durum === "gelmedi" ? ", gelmedi" : ""}` });
  }
  for (const u of uyeler) {
    const k = al(kisiAnahtari(u.eposta), u.olusturma, "uye", { eposta: u.eposta, ad: u.ad });
    k.son = Math.max(k.son, u.sonGiris || 0);
    olay(k, { z: u.olusturma, tur: "uye", metin: `Siteye üye oldu${u.saglayicilar?.includes("google") ? " (Google ile)" : ""}` });
  }
  const davetler: { kod: string; anahtar: string; z: number }[] = [];
  for (const f of formlar) {
    const eposta = epostaBul(f.alanlar), tel = alanBul(f.alanlar, TEL_ALAN);
    const anahtar = kisiAnahtari(eposta, tel);
    if (!anahtar) continue;
    const k = al(anahtar, f.zaman, "form", { eposta: eposta || undefined, ad: alanBul(f.alanlar, AD_ALAN), telefon: tel || undefined });
    k.formSayisi++;
    olay(k, { z: f.zaman, tur: "form", metin: `"${f.form}" formunu gönderdi${f.sayfa ? ` (${f.sayfa})` : ""}` });
    const izin = Object.entries(f.alanlar).find(([a]) => IZIN_ALAN.test(a.trim()));
    if (izin && EVET.test(izin[1].trim()) && k.izin !== "onay") { k.izin = "onay"; k.izinKaynak = `"${f.form}" formundaki onay kutusu`; k.izinZaman = f.zaman; }
    const dg = dogumTemizle(alanBul(f.alanlar, DOGUM_ALAN));
    if (dg && !k.dogum) k.dogum = dg;
    const dk = alanBul(f.alanlar, /^(davet|davet_kodu|tavsiye|referans|ref)$/i).toUpperCase();
    if (dk) davetler.push({ kod: dk, anahtar, z: f.zaman });
  }
  for (const s of siparisler) {
    if (s.durum !== "odendi" && s.durum !== "iade") continue;
    const eposta = s.eposta || s.alici?.eposta;
    const anahtar = kisiAnahtari(eposta, s.alici?.telefon);
    if (!anahtar) continue;
    const k = al(anahtar, s.olusturma, "siparis", { eposta, ad: [s.alici?.ad, s.alici?.soyad].filter(Boolean).join(" "), telefon: s.alici?.telefon, sehir: s.alici?.sehir });
    k.siparisSayisi++;
    if (s.durum === "odendi") { k.harcama += s.tutar; k.sonSiparis = Math.max(k.sonSiparis ?? 0, s.olusturma); }
    olay(k, { z: s.olusturma, tur: "siparis", metin: `${s.siparisNo} siparişi: ${s.tutar.toLocaleString("tr-TR")} ${s.paraBirimi || "TL"}${s.durum === "iade" ? ", iade edildi" : ""}` });
  }
  // Elle eklenenler ve sahip bilgileri
  for (const [anahtar, m] of Object.entries(ek.kisiMeta)) {
    if ((m.elle || m.bio) && !harita.has(anahtar)) al(anahtar, m.eklenme ?? Date.now(), m.bio ? "bio" : "elle", { eposta: anahtar.startsWith("tel:") ? undefined : anahtar, ad: m.ad, telefon: m.telefon });
    const k = harita.get(anahtar);
    if (!k) continue;
    if (m.elle && !k.kaynaklar.includes("elle")) k.kaynaklar.push("elle");
    if (m.bio && !k.kaynaklar.includes("bio")) k.kaynaklar.push("bio");
    if (m.dogum) k.dogum = m.dogum;
    if (m.izinGecmis?.length) { k.izinGecmis = m.izinGecmis; for (const g of m.izinGecmis.slice(-5)) olay(k, { z: g.z, tur: "izin", metin: `İzin: ${g.durum === "onay" ? "onaylandı" : g.durum === "ret" ? "reddedildi" : "belirsiz"} (${g.kaynak})` }); }
    if (m.ad) k.ad = m.ad; if (m.telefon) k.telefon = m.telefon;
    k.etiketler = m.etiketler ?? []; k.not = m.not;
    if (m.izin) { k.izin = m.izin; k.izinKaynak = m.izinKaynak; k.izinZaman = m.izinZaman; }
    if (m.eklenme) olay(k, { z: m.eklenme, tur: "elle", metin: m.bio ? "Bio sayfasından abone oldu" : "Elle eklendi" });
  }
  for (const [e, c] of Object.entries(ek.cikanlar)) { const k = harita.get(e); if (k) { k.cikti = c.z; k.izin = "ret"; olay(k, { z: c.z, tur: "cikti", metin: `Abonelikten çıktı (${c.kaynak})` }); } }
  // Kampanya olayları
  for (const kp of ek.kampanyalar) for (const a of kp.alicilar) {
    const k = harita.get(a.e);
    if (!k) continue;
    if (a.d === "gonderildi" && kp.gonderimBas) olay(k, { z: kp.gonderimBas, tur: "eposta", metin: `"${kp.ad}" e-postası gönderildi` });
    if (a.a) olay(k, { z: a.a, tur: "acildi", metin: `"${kp.ad}" e-postasını açtı` });
    if (a.t) { olay(k, { z: a.t, tur: "tik", metin: `"${kp.ad}" e-postasında bağlantıya tıkladı` }); k.son = Math.max(k.son, a.t); }
  }
  // Tavsiye: davet kodu ve kimin davet ettiği
  const kodla = new Map<string, Kisi>();
  for (const k of harita.values()) if (k.eposta) { k.davetKodu = davetKodu(k.eposta); kodla.set(k.davetKodu, k); }
  for (const d of davetler) {
    const eden = kodla.get(d.kod), gelen = harita.get(d.anahtar);
    if (!eden || !gelen || eden === gelen || gelen.davetEden) continue;
    gelen.davetEden = eden.eposta; eden.davetSayisi = (eden.davetSayisi ?? 0) + 1;
    olay(eden, { z: d.z, tur: "davet", metin: `${gelen.ad || gelen.eposta || "Bir kişi"} davet koduyla geldi` });
  }
  // Unutulma hakkıyla silinenler listeye dönmez (siparişlerde yasal saklama için kalan kayıtlardan yeniden kurulmaz).
  const silinen = ek.silinenler ?? {};
  if (Object.keys(silinen).length) { const { epostaOzeti } = await import("./buyumeEposta"); for (const [a, k] of harita) if (k.eposta && silinen[epostaOzeti(k.eposta)]) harita.delete(a); }
  const l = [...harita.values()];
  for (const k of l) { k.olaylar.sort((a, b) => b.z - a.z); if (!k.ad) k.ad = k.eposta?.split("@")[0] ?? k.telefon ?? "Kişi"; }
  return l.sort((a, b) => b.son - a.son);
}
