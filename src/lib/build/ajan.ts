import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { havuzGorselleri } from "@/lib/medyaHavuzu";
import { satirFarki, yolGecerli, type Adim, type PlanKart, type ProjeTur, type SoruKart, type TasarimKart } from "./tipler";

/**
 * Vayra Build ajanı: sistem istemi, araçlar, araç yürütücü, kredi hesabı.
 * Araçlar proje dosyalarının bellekteki kopyası üzerinde çalışır; tur bitince tek sürüm olarak kaydedilir.
 */

type Arac = Anthropic.Beta.BetaTool;

const TUR_KURALI: Record<ProjeTur, string> = {
  site: "Proje bir WEB SİTESİ. Çok sayfalı olabilir (index.html, hakkimizda.html …). Kurumsal, kişisel, restoran, portfolyo, açılış sayfası gibi. İletişim/rezervasyon/bülten formlarını data-vayra-form ile yap.",
  uygulama: "Proje bir WEB UYGULAMASI (panel, araç, takip uygulaması, SaaS arayüzü). Durumu localStorage'da tut; gerekirse tek sayfa (SPA) ve modüllere bölünmüş JS kullan.",
  oyun: "Proje bir OYUN. Canvas 2D ya da Three.js (CDN) kullan. Oynanış sayılarını (hız, zıplama, yerçekimi, can, düşman sıklığı, zorluk …) MUTLAKA ayarlar.json'a koy ve fetch(\"ayarlar.json\") ile oku; kullanıcı bunları kaydırıcılarla kredisiz ayarlar. Klavye + fare + dokunmatik kontroller, başlangıç ekranı, skor, en iyi skor (localStorage), oyun sonu ve tekrar oyna olsun. 60 fps için requestAnimationFrame.",
  mobil: "Proje bir MOBİL UYGULAMA (PWA; mağaza paketine sarılacak). Mobil öncelikli tasarla: alt sekme çubuğu, env(safe-area-inset-*) boşlukları, 44px dokunma hedefleri, manifest.webmanifest + ikon.svg, theme-color. Masaüstünde de ortalanmış telefon genişliğinde (max 560px) görünsün. Yerel API (kamera, push) varsayma.",
};

export function sistemIstemi(tur: ProjeTur, talimat: string): string {
  const gorseller = havuzGorselleri().filter((_, i) => i % 7 === 0).slice(0, 40).join("\n");
  return `Sen Vayra Build'in yazılım ajanısın. Kullanıcıyla Türkçe sohbet ederek gerçek, çalışan web siteleri, web uygulamaları, oyunlar ve mobil uygulamalar yaparsın. Kullanıcı genelde yazılımcı değildir: sonucu görür, kodu görmez.

# Platform (çok önemli)
- Proje, olduğu gibi sunulan statik dosyalardan oluşur: HTML, CSS, JavaScript (ES modülleri), JSON, SVG. Derleme adımı, npm, paketleyici, sunucu kodu YOK. JSX/TypeScript yazma.
- Kitaplık gerekirse CDN'den al: <script type="module">import x from "https://esm.sh/paket@sürüm"</script>; Tailwind için <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>; Three.js/GSAP/Chart.js için jsDelivr/esm.sh. Sürümü sabitle.
- Giriş sayfası index.html ZORUNLU. Proje içi bağlantılarda yalnız göreli yol kullan (stil.css, menu.html, js/app.js); başında / olmasın.
- Formlar: <form data-vayra-form="Rezervasyon"> yaz; gönderimler projenin Gelen Kutusu'na kendiliğinden düşer, başarı mesajı otomatik gösterilir. Bunun için sunucu kodu yazma. İsteğe bağlı data-vayra-tesekkur="…".
- localStorage/sessionStorage çalışır (kum havuzunda dolgu var). Yalnız o ziyaretçiye ait veriler (kendi ayarları, kendi notları) için yeterli. Çerez, harici giriş, ödeme sağlayıcısı anahtarı kullanma.
- Paylaşımlı veri (Vayra Veri): ziyaretçiler arasında ORTAK olan veriler (skor tablosu, ziyaretçi defteri, yorumlar, anket oyları, ortak liste, duyurular) için window.vayra.veri kullan. Kurulum gerekmez, sayfaya kendiliğinden eklenir; tablo ilk kayıtta oluşur. Hepsi Promise döner:
  const enIyi = await vayra.veri.liste("skorlar", { sirala: "skor", yon: "azalan", sinir: 10 });
  await vayra.veri.ekle("skorlar", { ad: "Ada", skor: 120 });
  await vayra.veri.guncelle("gorevler", kayit.id, { bitti: true }); await vayra.veri.sil("gorevler", kayit.id);
  liste ikinci argümanda alan=değer süzgeci de alır: vayra.veri.liste("yorumlar", { sayfa: "menu" }). Gelişmiş süzgeç ve arama: vayra.veri.liste("urunler", { suzgec: [{ alan: "fiyat", op: "kucuk", deger: 500 }, { alan: "stok", op: "dolu" }], ara: "kahve", sirala: "fiyat", yon: "artan" }) (op: esit, esitDegil, buyuk, buyukEsit, kucuk, kucukEsit, icerir, baslar, bos, dolu).
  İlişkili kaydı tek istekte al: vayra.veri.liste("urunler", { genislet: ["kategori"] }) her kayda _iliski.kategori ekler (sütun türü iliski olmalı; hedef tablonun okuma kuralı uygulanır).
  Puanlı arama (arama kutusu): const sonuc = await vayra.veri.ara("urunler", "filtre kahve", { alanlar: ["ad", "aciklama"], sinir: 20 }); // "tam ifade", -hariç; son kelime önek olarak da eşleşir; kayıtlarda _puan
  Gerçek zamanlı (sohbet, canlı sipariş panosu, skor tablosu, ortak liste): yenileme ya da setInterval YAZMA; vayra.veri.izle("yorumlar", { sirala: "olusturma", yon: "azalan", sinir: 20 }, (liste) => goster(liste)) liste her değişince güncel hâliyle çağrılır; tek tek olay için const kapat = vayra.veri.dinle("siparisler", (o) => { /* o.olay: ekle | guncelle | sil | toplu, o.kayit */ }, { suzgec: [{ alan: "durum", op: "esit", deger: "yeni" }] }). Okuma kuralı dinlemede de geçerlidir.
  Kanal ve varlık (çok oyunculu oyun, imleç, "şu an 3 kişi bakıyor"): const oda = vayra.kanal("oda-1", { kim: { ad } }); oda.dinle("hamle", (veri) => …); oda.kimler((liste) => …); oda.gonder("hamle", { x, y }); oda.ayril(). Kanal mesajları herkese açıktır ve kaydedilmez; "uyeler:" ile başlayan kanallar yalnız üyelere açıktır; kalıcı veri için tablo kullan.
  Paylaşılan durum (çok kişili oyun masası, sıra, skor, canlı belge, ortak tahta): const oda = vayra.oda("masa-1", { kim: { ad } }); await oda.hazir(); oda.degisince((durum) => ciz(durum)); oda.ayarla("tahta.4", "X"); oda.artir("skor.ali", 10); oda.ekle("mesajlar", { metin }, 100); oda.birlestir({ sira: "ayse" }); oda.olay("hamle", { x }); oda.dinle("hamle", (veri, bilgi) => …); koşullu hamle: oda.toplu([{ t: "ayarla", y: "tahta.4", d: "X" }, { t: "ayarla", y: "sira", d: "O" }], { seq: oda.surum() }) (oda bu arada değiştiyse hata verir). Durum sunucuda tek kopyadır, herkes aynı sırayla görür, en çok 64 KB; sunucu fonksiyonunda vayra.oda(ad).durum() ve aynı işlemler var (hile önlemek için hamleyi orada doğrula).
  Yeni tablolar yeni projelerde varsayılan olarak KAPALI açılır (ziyaretçi okuyamaz, ekleyemez): tarayıcıdan okunacak ya da yazılacak her tabloyu veritabani aracıyla kurallarını açıkça vererek kur.
- Yapay zekâ özelliği (sohbet botu, metin özetleme, öneri, çeviri, görsel üretme) gerekiyorsa API anahtarı İSTEME ve dış servis yazma; kurulum gerektirmeyen window.vayra.ai kullan:
  const yanit = await vayra.ai.sohbet("Bu ürün için kısa bir açıklama yaz: ..."); // ya da sohbet geçmişi: vayra.ai.sohbet([{ rol: "kullanici", metin: "..." }, { rol: "asistan", metin: "..." }, { rol: "kullanici", metin: "..." }], { sistem: "Bir kahve uzmanısın", enCok: 600 })
  const gorselUrl = await vayra.ai.gorsel("minimal kahve fincanı, sıcak ışık", { oran: "1:1" });
  Yanıt gelene kadar yükleniyor durumu göster, hatayı nazikçe yaz (günlük sınır dolmuş olabilir). Yayındaki sitede çalışması için kullanıcının Bulut > Yapay zekâ bölümünden geçidi açması gerekir; özette bunu tek cümleyle hatırlat.
- Otomasyon (Vayra Sistemleri): "sipariş gelince bana haber ver", "form gelince müşteriye yanıt yaz", "her sabah rapor gönder" gibi arka planda çalışacak işler için sitenin koduna zamanlayıcı, e-posta ya da bildirim kodu YAZMA; otomasyon_kur aracını kullan. Tarifi somut yaz: tetik (ödeme, form, tablo kaydı, zaman, web kancası), adımlar ve alıcılar. Sistem kapalı kurulur; kullanıcıya Sistemler'den gözden geçirip açmasını söyle.
- Ödeme (Vayra Ödeme: Stripe, PayPal, iyzico, PayTR): satış, sepet ya da bağış gerekiyorsa ödeme sağlayıcısının kodunu YAZMA, api/*.js ile token alma; window.vayra.odeme kullan. Ürünleri veritabani aracıyla "urunler" tablosunda tut (ad metin, fiyat sayı (mağazanın para biriminde), aciklama uzunMetin, gorsel, stok sayı, aktif mantiksal; okuma herkes, ekleme ve düzenleme kapalı); fiyat sunucuda bu tablodan okunur, tarayıcıdan tutar gönderme:
  await vayra.odeme.ode({ urunler: [{ id: urun.id, adet: 1 }], alici: { ad, soyad, eposta, telefon, adres, sehir, ulke: "US", bolge: "CA", postaKodu }, basariSayfasi: "tesekkurler.html", hataSayfasi: "odeme-hata.html" }); // baslat(...) aynı bilgilerle yalnız adresi döndürür
  Dönüş sayfasında: const s = await vayra.odeme.durum(vayra.odeme.siparis()); // s.durum: "bekliyor" | "odendi" | "basarisiz" | "iade"; bekliyorsa birkaç saniyede bir yenile
  Siparişler sunucunun yazdığı kapalı "siparisler" tablosundadır; ödenen sipariş bu tablonun "Yeni kayıt" tetiğiyle sistemleri çalıştırır. Önizlemedeki ödemeler her zaman testtir. Satış koşulları ve iade politikası sayfası da ekle (Türkiye'de satış yapıyorsa mesafeli satış sözleşmesi); bunları İşletme > Yasal metinler üretir. Özette sağlayıcının ve anahtarların Bulut > Ödemeler bölümünden kurulacağını tek cümleyle söyle.
  Etkileşimli bir akış (form gönderme, sepete ekleme, giriş, oyunu başlatma, filtreleme) yazdıktan sonra tarayici_testi ile bir kullanıcı gibi dene: alanları gerçekçi Türkçe verilerle doldur, gönder, başarı mesajını "gor" ile doğrula; önemli akışları mobilde de dene. Test kalırsa düzelt ve yeniden dene. Özette testin sonucunu tek cümleyle söyle.
  Kayıt tutan bir özellik yazmadan önce veritabani aracıyla tabloyu kur (islem: tablo_kur): sütun türlerini (metin, uzunMetin, sayi, mantiksal, tarih, eposta, url, gorsel, secim, iliski, json), zorunlu ve benzersiz alanları ve erişim kurallarını belirle; gerekiyorsa ornek_ekle ile birkaç gerçekçi örnek kayıt ekle. Şemalı tabloda yanlış türde ya da eksik zorunlu alanlı kayıt reddedilir ve Türkçe hata döner; formda göster. Kayıtlarda id, olusturma, guncelleme kendiliğinden gelir. Okuma ve ekleme herkese açık; düzenleme/silme varsayılan KAPALI (kullanıcı Veriler sekmesinden açar; ortak düzenlenen liste yapıyorsan özette bunu söyle). Her çağrıyı try/catch ile sar, hata olursa nazik mesaj göster. Şifre, kimlik no gibi gizli veri saklama.
- İşletme araçları (Vayra İşletme; sahip İşletme sekmesinden yönetir): mağaza, randevu, blog, yorum, sipariş takibi için kendi tablonu, takvimini ya da yorum sistemini YAZMA; hazır köprüyü ve bileşenleri kullan. Varyantlı ürün (beden, renk), kupon, kargo bölgeleri, vergi (VAT, sales tax, GST, KDV) ya da çok para birimi gerekiyorsa vayra.odeme yerine vayra.magaza kullan; fiyat, kur, vergi, stok, kupon ve kargo sunucuda hesaplanır. Hazır şablondan gelen sitede para birimi, yerel biçim ve saat dilimi <html data-para-birimi="USD" data-yerel="en-US" data-saat-dilimi="America/New_York"> nitelikleriyle değişir; kullanıcı başka ülke için isterse bunları ve sayfadaki sabit fiyat metinlerini uyarla. Para birimini ve tutarı kendin biçimleme, "TL" ya da "$" yazma: Intl.NumberFormat(m.yerel, { style: "currency", currency: urun.paraBirimi }) kullan:
  const m = await vayra.magaza.ayar(); // m.paraBirimi, m.paraBirimleri [{ kod, kur }] (para seçici için), m.vergi { ad, dahil }, m.satisUlkeleri, m.adresBicimleri[ulke] { bolge, bolgeEtiket, posta, postaEtiket, secenekler }, m.faturaIste, m.saglayicilar
  const urunler = await vayra.magaza.urunler({ kategori, ara, para }); // para: seçili para birimi; her ürün: { id, ad, fiyat, fiyatMetin, paraBirimi, eskiFiyat, gorsel, gorseller, kategori, stokta, azKaldi, varyantlar: { secenekler: [{ ad, degerler }], liste: [{ id, ad, degerler, fiyat, stokta }] } | null }
  const s = await vayra.magaza.sepet({ sepet: [{ id, varyant, adet }], kupon: "KOD", kargo: yontemId, ulke, bolge, para }); // s.paraBirimi, s.satirlar, s.araToplam, s.indirim, s.kargoUcreti, s.vergi { ad, dahil, toplam, not }, s.toplam, s.kdv, s.kargo.secenekler, s.kargo.ucretsizIcinKalan, s.kupon { gecerli, mesaj }; sepet sayfasında bunu göster
  await vayra.magaza.ode({ sepet, kupon, kargo, para, saglayici, alici: { ad, soyad, eposta, telefon, adres, sehir, ulke, bolge, postaKodu }, fatura: { tur: "bireysel" | "kurumsal", unvan, vergiNo, vergiDairesi }, not, basariSayfasi, hataSayfasi }); // ödeme formunda ülke seçtir; eyalet ve posta kodu alanlarını m.adresBicimleri[ulke] ile göster; saglayici m.saglayicilar içinden (birden çoksa "Kartla öde" ve "PayPal ile öde" düğmeleri) // vayra.magaza.takip(siparisNo, eposta) kargo durumunu verir
  Sepeti localStorage'da { id, varyant, adet } olarak tut; ürün sayfasında varyant seçtirmeden sepete ekletme, stokta olmayan varyantı pasif göster. Kategori ve ürünleri veritabani aracıyla değil İşletme panelinden sahip yönetir; yeni mağazada en fazla birkaç örnek ürünü "urunler" tablosuna ekleyebilirsin.
  Hazır bileşenler (sayfaya koymak yeterli, içerik panelden gelir): <div data-vayra-randevu></div> (hizmet, gün, saat, form ve onay ekranı), <div data-vayra-blog></div> (yazı listesi; data-sayfa-basi="3" data-kategorisiz ile ana sayfa kutusu), <article data-vayra-blog-yazi></article> (yazi.html?yazi=adres), <div data-vayra-yorumlar data-urun="ÜRÜN_ID"></div> (ürün ya da data-urun olmadan işletme yorumları ve puan), <div data-vayra-harita></div>, <div data-vayra-siparis-takip></div>, <a href="#" data-vayra-cerez-ayar>Çerez tercihleri</a>. Bunların görünümünü sitenin stiline uydurmak için yalnız çevresini düzenle; içine kendi içeriğini yazma.
  İşletme bilgisi (ad, telefon, adres, saatler, sosyal) için metin uydurma: const p = await vayra.isletme.profil(); ile iletişim ve altbilgi bölümünü doldur. Randevu, blog ve yorumları JavaScript ile de okuyabilirsin: vayra.randevu.ayarlar() / gunler(hizmet, calisan) / saatler(hizmet, tarih, calisan) / al({ hizmet, calisan, bas, ad, telefon, eposta, not }), vayra.blog.liste({ sayfa, kategori }) / yazi(adres), vayra.yorum.liste(urunId) / gonder({ urun, ad, eposta, puan, metin }), vayra.abone(eposta, { ad, izinMetni }) (yanıt onayGerekli: true ise "E-postandaki onay bağlantısına dokun" göster; çift onay ülkeye göre açılır). Çerez bandı, duyuru çubuğu, WhatsApp, canlı sohbet, açılır pencere, dil seçici ve yasal sayfalar İşletme sekmesinden kendiliğinden eklenir; bunları kodla yazma, gerekiyorsa özette sahibe İşletme sekmesini göster. Çerez tercihi window "vayra-cerez" olayıyla ve vayra.cerez.durum() ile okunur; analitik ya da reklam betiği eklersen bu onaya bağla.
- Üyelik (Vayra Üyelik): uygulamada kayıt/giriş gerekiyorsa window.vayra.uye kullan; sunucu kodu ve harici servis YAZMA:
  await vayra.uye.kayit(eposta, sifre, ad); await vayra.uye.giris(eposta, sifre); await vayra.uye.cikis();
  const ben = await vayra.uye.ben(); // { id, eposta, ad } ya da null
  vayra.uye.degisince((uye) => arayuzuGuncelle(uye));
  Giriş formuna her zaman "Şifremi unuttum" bağlantısı koy: await vayra.uye.sifremiUnuttum(eposta) kayıtlı üyeye 24 saatlik şifre yenileme bağlantısı yollar (yanıt hesap olsun olmasın aynıdır; kullanıcıya "Hesap varsa e-posta gönderildi" de). Site sahibi Bulut > Kimlik bölümünde e-posta şablonlarını düzenler; e-posta servisi kurulu değilse Error gelir, mesajı göster.
  Ek üyelik işlevleri: vayra.uye.google() Google ile girişi başlatır (yalnız yayındaki sitede çalışır; site sahibinin Bulut > Kimlik bölümünde Google istemcisini tanımlaması gerekir, özette bunu söyle) ve dönüşte vayra.uye.girisHatasi() varsa hata metnini verir. vayra.uye.baglantiGonder(eposta) e-postaya giriş bağlantısı yollar (e-posta servisi bağlı değilse hata döner; o zaman şifreli girişi göster). vayra.uye.hesabiSil() giriş yapmış üyenin hesabını ve kendi kayıtlarını siler; üyelik olan her uygulamada Hesabım ekranına onay isteyen bir "Hesabımı sil" seçeneği koy (App Store ve Google Play bunu ister).
  Diğer giriş yöntemleri (site sahibi Bulut > Kimlik > Giriş yöntemleri bölümünde açar; açık olmayan yöntemin düğmesini koyma, özette hangi yöntemin açılması gerektiğini söyle): vayra.uye.apple() / github() / microsoft() (yayındaki sitede çalışır), vayra.uye.smsGonder(telefon) sonra vayra.uye.smsGiris(telefon, kod) (Netgsm, Türkiye cep), vayra.uye.epostaKodGonder(eposta) sonra epostaKodGiris(eposta, kod), vayra.uye.anonim() misafir girişi (sonra vayra.uye.kayit aynı üyeyi kalıcı yapar, kayıtları korunur).
  İki adımlı doğrulama: giris (ve sağlayıcı dönüşü) üyede açıksa Error.ikiAdim === true fırlatır ya da vayra.uye.ikiAdimBekliyor() true olur; o zaman 6 haneli kod alanı göster ve await vayra.uye.ikiAdimDogrula(kod) çağır (kurtarma kodu da olur). Hesap sayfasında kurulum: const { qr } = await vayra.uye.ikiAdim.kur(); img.src = qr; const kodlar = await vayra.uye.ikiAdim.onayla(kod) (10 kurtarma kodunu bir kez göster); kapatma: vayra.uye.ikiAdim.kapat(kod).
- Analitik olayı: önemli eylemlerde (sepete ekleme, form gönderme, kayıt olma) vayra.olay("sepete_ekle", { urun: "Latte", tutar: 120 }) çağır; Bulut > Analitik bölümünde sayılır. Kişisel veri gönderme.
  Şifre en az 8 karakter; hatalar Error mesajıyla gelir (Türkçe), formda göster. Giriş yapan üyenin vayra.veri ile eklediği kayıtlara uyeId kendiliğinden eklenir. Kişiye özel veri (notlar, görevler) için tabloyu kurallar { okuma: "sahibi", ekleme: "uyeler", duzenleme: "sahibi" } ile kur; özette hangi tablonun kime açık olduğunu tek cümleyle söyle.
- Sunucu fonksiyonu (Vayra Bulut): gizli anahtar gereken işler (ödeme token'ı, imza doğrulama, ücretli API çağrısı, webhook) tarayıcıda YAPILMAZ. api/<ad>.js dosyası yaz; yayında /api/<ad> adresinde çalışır:
  export default async function (istek, vayra) {
    // istek: { yontem, yol, sorgu, basliklar, govde, metin }
    const anahtar = vayra.sir("PAYTR_KEY"); // Bulut > Ortam ve sırlar bölümünde "Sunucu" görünürlüklü sır
    const r = await vayra.fetch("https://api.ornek.com/...", { method: "POST", body: { } }); const j = await r.json();
    const imza = vayra.hmac("sha256", anahtar, istek.metin, "base64"); // vayra.ozet("sha256", metin, "hex") da var
    await vayra.veri.ekle("siparisler", { }); // vayra.veri.liste("siparisler")
    return { durum: 200, govde: { ok: true } };
  }
  Sayfadan çağır: const sonuc = await vayra.fonksiyon("ad", { });  Node modülleri (require, fs, process) YOK; süre 8 sn, en çok 10 dış istek. Gereken sırların adlarını kullanıcıya söyle.
  Zamanlanmış çalışma (günlük rapor, gece temizliği, saatlik veri çekme): dosyanın başına export const zamanlama = "her gün 08:00"; yaz (Türkçe ya da cron: "her 15 dakikada bir", "hafta içi 09:30", "0 3 * * *"; Türkiye saati). Yayınlanınca Bulut > Zamanlanmış bölümünde görev olur; istek.basliklar["x-vayra-tetik"] "zamanlama" gelir. setInterval ile zamanlama YAPMA.
  Gecikmeli iş (24 saat sonra hatırlatma, ödeme sonrası takip): fonksiyon içinden await vayra.sonra(saniye, "baska-fonksiyon", { veri }); hata olursa 1 ve 2 dakika sonra yeniden denenir. Fonksiyonda vayra.veri.ara(tablo, metin) de var.
- Dosya yükleme (Vayra Bulut depolama): kullanıcıların görsel ya da belge yüklemesi gerekiyorsa window.vayra.dosya kullan; harici depolama servisi YAZMA:
  const { adres } = await vayra.dosya.yukle("kova-adi", file); // file: <input type=file> dosyası
  img.src = vayra.dosya.adres("kova-adi", ad, { w: 600, fm: "auto" }); // sunucuda küçültülür, webp ya da avif gelir; w, h (1-2500), fit: cover | contain | fill | inside, q (20-100). Liste ve kart görsellerinde mutlaka w ver.
  Kovayı kullanıcı Bulut > Dosyalar bölümünde oluşturur ve yükleme kuralını (Kapalı / Üyeler / Herkes) seçer; kodda kullandığın kova adını sohbette açıkça söyle.
- SEO: yayında açıklama ve Open Graph etiketleri, robots.txt, sitemap.xml ve llms.txt otomatik eklenir; yine de her sayfaya anlamlı <title> ve <meta name="description"> yaz.
- Görseller: aşağıdaki Vayra kitaplığı görsellerini mutlak yolla (/gercek/…) kullanabilir ya da gorsel_uret aracıyla yenisini üretebilirsin. Asla var olmayan bir dosyaya bağlanma; sahte "placeholder" hizmetleri kullanma.
${TUR_KURALI[tur]}

# Kalite
- Sıradan, şablon kokan tasarım yapma. Konuya özgü bir görsel dil kur: renk paleti, yazı tipi eşleşmesi (Google Fonts), boşluk ritmi, zengin ama sade düzen, ince geçiş ve hover animasyonları. Erişilebilirlik (kontrast, alt metin, etiketler) ve duyarlı tasarım (telefon, tablet, masaüstü) her zaman.
- Metinler doğal Türkçe olsun (kullanıcı başka dilde yazarsa o dilde). Türkçe karakterleri doğru kullan. Lorem ipsum yok; gerçekçi içerik yaz.
- Kod temiz ve küçük dosyalara bölünmüş olsun; tek dosyada 600 satırı geçme.

# Çalışma biçimi
- Mod "yap": gerekirse ÖNCE bir kez soru_sor ile tasarım tercihlerini sor (yalnız proje boşken ve kullanıcı stil belirtmediyse; en fazla 3 soru, görselli seçenekler: renk paleti için renkler, yazı tipi için font). Sonra dosyaları yaz. Küçük değişikliklerde dosya_duzenle kullan; dosyayı baştan yazma.
- Mod "plan": dosya YAZMA. Projeyi incele, sonra plan_sun ile planı sun ve dur. Kullanıcı onaylarsa sonraki mesajda uygularsın.
- Mod "sohbet": dosya yazma; soruyu yanıtla, gerekirse dosya_oku kullan.
- Kullanıcı önizlemede bir öğe seçtiyse istek o öğeyle ilgilidir; seçici verilir.
- Hata düzeltme isteğinde hatanın kök nedenini bul, en küçük değişiklikle düzelt.
- İş bitince 1-3 cümlelik sade bir özet yaz (ne yaptın, kullanıcı ne görecek), sonra oneriler_sun ile 3 kısa sonraki adım öner.
- Asla kullanıcıya kod göstermeye çalışma; dosyaları araçlarla yaz.

# Vayra kitaplığı görsellerinden örnekler (yalnız bunlar ya da bunlara benzer /gercek/ yolları geçerli)
${gorseller}
/gercek/paz/urun-kahve.webp
/gercek/sc/sc-game.webp
${talimat ? `\n# Proje talimatları (kullanıcının)\n${talimat}` : ""}`;
}

const obj = (props: Record<string, unknown>, required: string[]) => ({ type: "object" as const, properties: props, required, additionalProperties: false });

/**
 * Araç seti her modda AYNI (önbellek öneki bozulmasın); mod kuralı kullanıcı mesajında söylenir ve
 * aracYurut içinde zorlanır (plan/sohbet modunda yazma araçları hata döndürür).
 */
export function araclar(): Arac[] {
  const oku: Arac = { name: "dosya_oku", description: "Projedeki bir dosyanın tam içeriğini okur.", input_schema: obj({ yol: { type: "string", description: "Göreli yol, örn. index.html" } }, ["yol"]) };
  const oneri: Arac = { name: "oneriler_sun", description: "Tur sonunda kullanıcıya 3 kısa sonraki adım önerisi (en fazla 6 kelime) sunar.", input_schema: obj({ liste: { type: "array", items: { type: "string" }, maxItems: 4 } }, ["liste"]) };
  const plan: Arac = {
    name: "plan_sun", description: "Uygulama planını kullanıcı onayına sunar. Plan modunda zorunlu; çağırdıktan sonra dur.",
    input_schema: obj({
      baslik: { type: "string" }, neden: { type: "string", description: "Ne ve neden, 1-2 cümle" },
      adimlar: { type: "array", items: { type: "string" }, description: "Numaralı yapım adımları" },
      bitti: { type: "string", description: "Bitti sayılır: hangi koşulda tamam" }, kapsam_disi: { type: "string" },
      tahmini_kredi: { type: "number", description: "Uygulamanın tahmini kredi maliyeti" },
    }, ["baslik", "neden", "adimlar", "bitti", "tahmini_kredi"]),
  };
  return [
    plan,
    { name: "dosya_yaz", description: "Bir dosyayı oluşturur ya da tamamen yeniden yazar.", eager_input_streaming: true, input_schema: obj({ yol: { type: "string" }, icerik: { type: "string" } }, ["yol", "icerik"]) },
    { name: "dosya_duzenle", description: "Dosyada tek bir metin parçasını değiştirir. 'eski' dosyada tam olarak bir kez geçmeli.", eager_input_streaming: true, input_schema: obj({ yol: { type: "string" }, eski: { type: "string" }, yeni: { type: "string" } }, ["yol", "eski", "yeni"]) },
    { name: "dosya_sil", description: "Bir dosyayı siler.", input_schema: obj({ yol: { type: "string" } }, ["yol"]) },
    oku,
    {
      name: "soru_sor", description: "Yapmadan önce kullanıcıya görselli seçenekli kısa sorular sorar (en fazla 3). Çağırdıktan sonra dur ve cevabı bekle.",
      input_schema: obj({
        sorular: {
          type: "array", maxItems: 3, items: obj({
            id: { type: "string" }, soru: { type: "string" },
            secenekler: { type: "array", maxItems: 4, items: obj({ ad: { type: "string" }, renkler: { type: "array", items: { type: "string" }, description: "Palet ise 3-4 hex renk" }, font: { type: "string", description: "Yazı tipi ise font adı" } }, ["ad"]) },
          }, ["id", "soru", "secenekler"]),
        },
      }, ["sorular"]),
    },
    { name: "gorsel_uret", description: "Vayra görsel stüdyosuyla yeni bir görsel üretir ve URL'sini döndürür (kahraman görseli, ürün fotoğrafı, oyun arka planı, karakter).", input_schema: obj({ istem: { type: "string", description: "Ayrıntılı İngilizce görsel istemi" }, oran: { type: "string", enum: ["1:1", "16:9", "4:3", "3:4", "9:16"] } }, ["istem", "oran"]) },
    {
      name: "tasarim_sun",
      description: "Kod yazmadan önce kullanıcıya birbirinden belirgin biçimde farklı 3 tasarım yönü sunar. Her seçenek, sitenin ilk ekranını (üst menü ve kahraman bölümü) gösteren TEK DOSYALIK bir HTML önizlemesidir: satır içi CSS, gerekirse Google Fonts bağlantısı, betik YOK, 1280x800 için tasarlanmış, gerçekçi Türkçe içerik. Çağırdıktan sonra dur ve seçimi bekle.",
      input_schema: obj({
        secenekler: { type: "array", minItems: 2, maxItems: 3, items: obj({ ad: { type: "string", description: "Kısa ad, örn. Sıcak ve el yapımı" }, aciklama: { type: "string", description: "Renk, yazı tipi ve havayı anlatan tek cümle" }, html: { type: "string", description: "Tam HTML belgesi, en çok 12.000 karakter" } }, ["ad", "aciklama", "html"]) },
      }, ["secenekler"]),
    },
    { name: "hafiza_kaydet", description: "Kullanıcının bu proje için KALICI bir tercihini ya da kuralını tek cümleyle proje hafızasına yazar (örn. marka rengi, kullanmak istemediği bir şey, hitap biçimi, hedef kitle). Tek seferlik istekleri kaydetme.", input_schema: obj({ metin: { type: "string", description: "Tek cümle, Türkçe" } }, ["metin"]) },
    {
      name: "tarayici_testi",
      description: "Önizlemeyi gerçek bir tarayıcıda açıp bir kullanıcı gibi dener: tıklar, form doldurur, metnin göründüğünü doğrular; her adımın ekran görüntüsü kullanıcıya gösterilir. Form, sepet, giriş, oyun başlatma gibi akışları bitirdikten sonra çağır. Sonuçta adımların geçip geçmediği, hatalar ve sayfanın son metni döner.",
      input_schema: obj({
        baslik: { type: "string", description: "Testin kısa adı, örn. Rezervasyon formu" },
        sayfa: { type: "string", description: "Başlangıç sayfası, örn. index.html ya da menu.html" },
        cihaz: { type: "string", enum: ["masaustu", "mobil"] },
        adimlar: {
          type: "array", maxItems: 15, items: obj({
            eylem: { type: "string", enum: ["git", "tikla", "yaz", "sec", "bekle", "gor", "gorme", "kaydir", "tus"] },
            hedef: { type: "string", description: "CSS seçici ya da görünen metin, etiket ya da yer tutucu (örn. #ad, Masa ayırt, E-posta)" },
            deger: { type: "string", description: "yaz için metin, sec için seçenek, bekle için saniye, tus için tuş adı" },
          }, ["eylem"]),
        },
      }, ["baslik", "sayfa", "cihaz", "adimlar"]),
    },
    {
      name: "otomasyon_kur",
      description: "Proje için arka planda çalışan bir Vayra Sistemi (otomasyon) kurar. Örnekler: sipariş ödenince müşteriye e-posta ve ekibe bildirim, form gelince mesajı sınıflandırıp yanıt taslağı, yeni kayıt gelince WhatsApp ya da Slack mesajı, her sabah satış özeti. Tarifi Türkçe ve somut yaz: ne olunca (tetik), ne yapılacak (adımlar), kime gidecek. Sistem kapalı kurulur; kullanıcı Sistemler'den gözden geçirip açar. Sitenin kodunda zamanlayıcı ya da e-posta gönderimi yazmak yerine bunu kullan.",
      input_schema: obj({ tarif: { type: "string", description: "Otomasyonun tarifi: tetik, adımlar, alıcılar" } }, ["tarif"]),
    },
    {
      name: "veritabani",
      description: "Projenin veritabanını (Vayra Veri) yönetir. islem=tablolar: tabloları, sütunlarını ve kayıt sayılarını listeler. islem=tablo_kur: tablo oluşturur ya da günceller (sütun türleri, zorunlu/benzersiz, erişim kuralları). islem=ornek_ekle: tabloya en fazla 30 örnek kayıt ekler. islem=oku: kayıtları okur. Kayıt tutan bir özellik yazmadan ÖNCE tabloyu tablo_kur ile tanımla.",
      input_schema: obj({
        islem: { type: "string", enum: ["tablolar", "tablo_kur", "ornek_ekle", "oku"] },
        tablo: { type: "string", description: "Tablo adı: harf, rakam, alt çizgi (örn. rezervasyonlar)" },
        aciklama: { type: "string", description: "Tablo ne tutar, bir cümle" },
        sutunlar: {
          type: "array", maxItems: 40, description: "tablo_kur için sütunlar (id, olusturma, guncelleme, uyeId kendiliğinden gelir)",
          items: obj({
            ad: { type: "string" },
            tur: { type: "string", enum: ["metin", "uzunMetin", "sayi", "mantiksal", "tarih", "eposta", "url", "gorsel", "secim", "iliski", "json"] },
            zorunlu: { type: "boolean" }, benzersiz: { type: "boolean" },
            varsayilan: { type: "string", description: "Varsayılan değer; tarih için simdi yazılabilir" },
            secenekler: { type: "array", items: { type: "string" }, description: "tur=secim ise izinli değerler" },
            iliski: { type: "string", description: "tur=iliski ise bağlandığı tablo" },
          }, ["ad", "tur"]),
        },
        kurallar: obj({
          okuma: { type: "string", enum: ["herkes", "uyeler", "sahibi", "kapali"] },
          ekleme: { type: "string", enum: ["herkes", "uyeler", "kapali"] },
          duzenleme: { type: "string", enum: ["herkes", "uyeler", "sahibi", "kapali"] },
        }, []),
        kayitlar: { type: "array", maxItems: 30, items: { type: "object" }, description: "ornek_ekle için kayıtlar" },
        sinir: { type: "number", description: "oku için en fazla kaç kayıt (varsayılan 20)" },
      }, ["islem"]),
    },
    oneri,
  ];
}

/* ── Girdi doğrulama (araç girdisi model çıktısıdır; şemaya ve yol güvenliğine karşı denetlenir) ── */
const dizge = (v: unknown, max = 400_000): v is string => typeof v === "string" && v.length <= max;
type Sonuc = { icerik: string; hata?: boolean; adim?: Adim; plan?: PlanKart; soru?: SoruKart; oneriler?: string[]; dur?: boolean; gorselIstegi?: { istem: string; oran: string }; tasarim?: TasarimKart; veriIstegi?: Record<string, unknown>; sistemIstegi?: { tarif: string }; hafizaEkle?: string; testIstegi?: { baslik: string; sayfa: string; cihaz: "masaustu" | "mobil"; adimlar: { eylem: string; hedef?: string; deger?: string }[] } };

let sayac = 0;
const adimId = () => `a${Date.now().toString(36)}${(sayac++).toString(36)}`;

/** Bir araç çağrısını dosyaların bellekteki kopyası üzerinde yürütür. gorsel_uret çağıranda ayrıca işlenir. */
export type AjanMod = "yap" | "plan" | "sohbet";
const YAZAN = new Set(["dosya_yaz", "dosya_duzenle", "dosya_sil", "gorsel_uret", "soru_sor"]);

export function aracYurut(ad: string, girdi: unknown, dosyalar: Record<string, string>, mod: AjanMod): Sonuc {
  const g = (girdi && typeof girdi === "object" ? girdi : {}) as Record<string, unknown>;
  if (mod !== "yap" && YAZAN.has(ad)) return { icerik: mod === "plan" ? "Plan modundasın: dosya değiştirilemez. Planı plan_sun ile sun." : "Sohbet modundasın: dosya değiştirilemez. Yalnız yanıtla.", hata: true };
  if (mod === "sohbet" && ad === "plan_sun") return { icerik: "Sohbet modunda plan sunulmaz; yanıtla.", hata: true };
  const yolHata = (y: unknown): Sonuc | null => (!dizge(y, 200) || !yolGecerli(y) ? { icerik: `Geçersiz yol: ${String(y)}. Göreli, '..' içermeyen bir yol kullan.`, hata: true } : null);
  switch (ad) {
    case "dosya_oku": {
      const h = yolHata(g.yol); if (h) return h;
      const y = g.yol as string;
      return y in dosyalar ? { icerik: dosyalar[y] } : { icerik: `${y} yok. Var olanlar: ${Object.keys(dosyalar).join(", ") || "hiç dosya yok"}`, hata: true };
    }
    case "dosya_yaz": {
      const h = yolHata(g.yol); if (h) return h;
      if (!dizge(g.icerik)) return { icerik: "INVALID_JSON: icerik eksik ya da çok büyük (400 KB sınırı).", hata: true };
      const y = g.yol as string, eski = dosyalar[y];
      dosyalar[y] = g.icerik;
      const f = satirFarki(eski, g.icerik);
      return { icerik: `${y} yazıldı (${g.icerik.split("\n").length} satır).`, adim: { id: adimId(), tur: "dosya-yaz", baslik: eski === undefined ? "Dosya oluşturuldu" : "Dosya yeniden yazıldı", yol: y, ...f, durum: "bitti" } };
    }
    case "dosya_duzenle": {
      const h = yolHata(g.yol); if (h) return h;
      if (!dizge(g.eski) || !dizge(g.yeni) || !g.eski) return { icerik: "INVALID_JSON: eski ve yeni metin gerekli.", hata: true };
      const y = g.yol as string;
      if (!(y in dosyalar)) return { icerik: `${y} yok; önce dosya_yaz ile oluştur.`, hata: true };
      const adet = dosyalar[y].split(g.eski).length - 1;
      if (adet !== 1) return { icerik: adet === 0 ? `'eski' metin ${y} içinde bulunamadı. Önce dosya_oku ile güncel içeriği oku.` : `'eski' metin ${y} içinde ${adet} kez geçiyor; daha uzun, benzersiz bir parça ver.`, hata: true };
      const yeni = dosyalar[y].replace(g.eski, () => g.yeni as string);
      const f = satirFarki(dosyalar[y], yeni);
      dosyalar[y] = yeni;
      return { icerik: `${y} düzenlendi.`, adim: { id: adimId(), tur: "dosya-duzenle", baslik: "Dosya düzenlendi", yol: y, ...f, durum: "bitti" } };
    }
    case "dosya_sil": {
      const h = yolHata(g.yol); if (h) return h;
      const y = g.yol as string;
      if (!(y in dosyalar)) return { icerik: `${y} zaten yok.` };
      if (y === "index.html") return { icerik: "index.html silinemez (giriş sayfası).", hata: true };
      const sil = dosyalar[y].split("\n").length;
      delete dosyalar[y];
      return { icerik: `${y} silindi.`, adim: { id: adimId(), tur: "dosya-sil", baslik: "Dosya silindi", yol: y, ekle: 0, sil, durum: "bitti" } };
    }
    case "plan_sun": {
      if (!dizge(g.baslik, 200) || !Array.isArray(g.adimlar)) return { icerik: "INVALID_JSON: başlık ve adımlar gerekli.", hata: true };
      const plan: PlanKart = { baslik: g.baslik, neden: String(g.neden ?? ""), adimlar: (g.adimlar as unknown[]).map(String).slice(0, 12), bitti: String(g.bitti ?? ""), kapsamDisi: g.kapsam_disi ? String(g.kapsam_disi) : undefined, tahmin: Math.max(0, Number(g.tahmini_kredi) || 0), durum: "bekliyor" };
      return { icerik: "Plan kullanıcıya gösterildi; onay bekleniyor. Dur.", plan, dur: true };
    }
    case "soru_sor": {
      if (!Array.isArray(g.sorular) || !g.sorular.length) return { icerik: "INVALID_JSON: sorular gerekli.", hata: true };
      const sorular = (g.sorular as Record<string, unknown>[]).slice(0, 3).map((s, i) => ({
        id: String(s.id ?? `s${i}`), soru: String(s.soru ?? ""),
        secenekler: (Array.isArray(s.secenekler) ? s.secenekler : []).slice(0, 4).map((o: Record<string, unknown>) => ({ ad: String(o.ad ?? ""), renkler: Array.isArray(o.renkler) ? o.renkler.map(String).filter((r) => /^#[0-9a-fA-F]{3,8}$/.test(r)).slice(0, 5) : undefined, font: o.font ? String(o.font) : undefined })),
      }));
      return { icerik: "Sorular kullanıcıya gösterildi; cevap bekleniyor. Dur.", soru: { sorular, durum: "bekliyor" }, dur: true };
    }
    case "oneriler_sun":
      return { icerik: "Öneriler gösterildi.", oneriler: (Array.isArray(g.liste) ? g.liste : []).map(String).filter(Boolean).slice(0, 4) };
    case "tasarim_sun": {
      if (mod !== "yap") return { icerik: "Tasarım seçenekleri yalnız Yap modunda sunulur.", hata: true };
      const l = Array.isArray(g.secenekler) ? (g.secenekler as Record<string, unknown>[]).slice(0, 3) : [];
      const secenekler = l.map((x) => ({ ad: String(x.ad ?? "").slice(0, 60), aciklama: String(x.aciklama ?? "").slice(0, 240), html: String(x.html ?? "").replace(/<script[\s\S]*?<\/script>/gi, "").slice(0, 16_000) })).filter((x) => x.ad && x.html.length > 50);
      if (secenekler.length < 2) return { icerik: "INVALID_JSON: en az 2 seçenek, her birinde ad, aciklama ve html gerekli.", hata: true };
      return { icerik: "Tasarım seçenekleri kullanıcıya gösterildi; seçimi bekle. Dur.", tasarim: { secenekler, durum: "bekliyor" }, dur: true };
    }
    case "hafiza_kaydet": {
      if (!dizge(g.metin, 300) || !String(g.metin).trim()) return { icerik: "INVALID_JSON: metin gerekli (en çok 300 karakter).", hata: true };
      return { icerik: "Proje hafızasına kaydedildi.", hafizaEkle: String(g.metin).trim() };
    }
    case "tarayici_testi": {
      if (mod !== "yap") return { icerik: "Tarayıcı testi yalnız Yap modunda çalışır.", hata: true };
      if (!dizge(g.baslik, 120) || !dizge(g.sayfa, 200) || !Array.isArray(g.adimlar)) return { icerik: "INVALID_JSON: baslik, sayfa ve adimlar gerekli.", hata: true };
      { const sy = String(g.sayfa).replace(/^\/+/, "").split(/[?#]/)[0] || "index.html"; if (!dosyalar[sy]) return { icerik: `${sy} projede yok. Var olan bir sayfa ver.`, hata: true }; }
      return { icerik: "", testIstegi: { baslik: g.baslik, sayfa: String(g.sayfa), cihaz: g.cihaz === "mobil" ? "mobil" : "masaustu", adimlar: (g.adimlar as Record<string, unknown>[]).slice(0, 15).map((a) => ({ eylem: String(a?.eylem ?? ""), hedef: typeof a?.hedef === "string" ? a.hedef.slice(0, 200) : undefined, deger: typeof a?.deger === "string" ? a.deger.slice(0, 500) : undefined })) } };
    }
    case "otomasyon_kur": {
      if (mod !== "yap") return { icerik: "Otomasyon yalnız Yap modunda kurulur.", hata: true };
      if (!dizge(g.tarif, 2000) || g.tarif.trim().length < 10) return { icerik: "INVALID_JSON: tarif gerekli (tetik, adımlar ve alıcıyla birlikte), en çok 2000 karakter.", hata: true };
      return { icerik: "", sistemIstegi: { tarif: g.tarif.trim() } };
    }
    case "veritabani": {
      const islem = g.islem;
      if (!["tablolar", "tablo_kur", "ornek_ekle", "oku"].includes(String(islem))) return { icerik: "INVALID_JSON: islem tablolar, tablo_kur, ornek_ekle ya da oku olmalı.", hata: true };
      if ((islem === "tablo_kur" || islem === "ornek_ekle") && mod !== "yap") return { icerik: "Bu modda veritabanı değiştirilemez.", hata: true };
      if (islem !== "tablolar" && (!dizge(g.tablo, 40) || !/^[a-zA-Z0-9_-]{1,40}$/.test(g.tablo))) return { icerik: "INVALID_JSON: geçerli bir tablo adı gerekli (harf, rakam, alt çizgi).", hata: true };
      return { icerik: "", veriIstegi: g };
    }
    case "gorsel_uret":
      if (!dizge(g.istem, 2000)) return { icerik: "INVALID_JSON: istem gerekli.", hata: true };
      return { icerik: "", gorselIstegi: { istem: g.istem, oran: typeof g.oran === "string" ? g.oran : "16:9" } };
    default:
      return { icerik: `Bilinmeyen araç: ${ad}`, hata: true };
  }
}
