import type { KatalogYetenek } from "./yetenekKatalog";

/** Yazılım geliştirme, web, mobil ve veri yetenekleri (Vayra Build ajanının site, uygulama ve oyun yaparken kullandığı paketler). */
export const YETENEKLER_GELISTIRME: KatalogYetenek[] = [
  {
    id: "acilis-sayfasi-donusum", ad: "acilis-sayfasi-donusum", baslik: "Dönüşüm odaklı açılış sayfası", kategori: "web", simge: "/gercek/galeri/soyut3.webp",
    aciklama: "Bir ürün, hizmet, uygulama ya da etkinlik için tek amaçlı açılış sayfası (landing page) kurarken veya var olan sayfanın kayıt, satış, başvuru oranını artırırken kullan: değer önerisi ve kahraman bölümü, güven şeridi, fayda blokları, sosyal kanıt, fiyat, itiraz gideren sık sorulan sorular, eylem çağrısı sırası, form sadeliği, A/B testi önceliği ve ölçülecek olaylar. Kullanıcı 'landing page', 'tanıtım sayfası', 'ön kayıt sayfası', 'bekleme listesi', 'kampanya sayfası' ya da 'dönüşüm düşük' dediğinde kullan.",
    ornekler: ["Uygulamam için ön kayıt sayfası yap", "Kampanya sayfamın dönüşümünü artır", "Kurs satışı için tek sayfalık site kur"],
    govde: `# Dönüşüm odaklı açılış sayfası

Bu yetenek tek bir hedefe (kayıt, satın alma, başvuru, indirme, arama) hizmet eden açılış sayfası kurar. Sayfadaki her bölüm ziyaretçiyi bu tek eyleme yaklaştırmalı; başka yere götüren her bağlantı dönüşümü düşürür.

## Önce topla
Eksik olanları en çok iki soruda sor:
- Tek hedef eylem ve başarı ölçütü (ön kayıt formu gönderimi, deneme başlatma, randevu)
- Hedef kitle, en büyük sorunu ve bugün kullandığı alternatif
- Ürünün somut faydası ve rakamla kanıtı (kullanıcı sayısı, puan, kazandırdığı süre)
- Elde gerçek yorum, müşteri logosu ya da basın haberi var mı
- Teklif ve fiyat; süre sınırı varsa gerçek mi
- Trafiğin kaynağı (reklam, e-posta, sosyal medya): başlık o kaynaktaki vaatle aynı olmalı

## Bölüm sırası
1. **Kahraman**: 6 ile 12 kelimelik sonuç odaklı başlık, kim için ve nasıl olduğunu söyleyen tek cümlelik alt başlık, tek birincil düğme, ürünü gösteren gerçek görsel ya da kısa döngü video. Düğme ilk ekranda görünmeli, 390 piksel genişlikli telefonda da.
2. **Güven şeridi**: müşteri logoları, mağaza puanı, kullanıcı sayısı. Yalnız doğrulanabilir veriler.
3. **Sorun ve çözüm**: ziyaretçinin derdini onun kelimeleriyle yaz, ürünün bunu nasıl çözdüğünü göster.
4. **Fayda blokları**: 3 ile 4 fayda; her biri başlık, tek cümle ve görsel. Özellik değil sonuç yaz: "otomatik yedekleme" yerine "tek bir dosyayı bile kaybetmezsin".
5. **Nasıl çalışır**: 3 adım, her adımda bir fiil.
6. **Sosyal kanıt**: ad, unvan ve fotoğraflı yorumlar; somut sonuç içerenler önce.
7. **Fiyat ya da teklif**: en çok 3 paket, önerilen paket vurgulu, iptal ve iade koşulu açık.
8. **Sık sorulan sorular**: satın almayı durduran 5 ile 8 itiraz (fiyat, süre, güvenlik, iptal, destek). FAQPage yapılandırılmış verisi ekle.
9. **Son çağrı**: başlığı tekrarlayan kısa bölüm ve aynı düğme.

## Kurallar
- Sayfada tek birincil eylem var. Düğme metni eylemi ve sonucu söyler ("Ücretsiz dene", "Yerimi ayır"); "Gönder" ya da "Tıkla" değil.
- Üst menüyü sadeleştir ya da kaldır; altbilgide yalnız yasal bağlantılar ve iletişim.
- Form en az alanla başlar: ön kayıtta yalnız e-posta; diğer bilgiler teşekkür ekranında ya da sonra.
- Düğmenin yanına kaygı giderici kısa not koy: "Kredi kartı gerekmez", "30 saniye sürer", "İstediğin an iptal".
- Hız dönüşümdür: kahraman görseli öncelikli yüklenir, LCP 2.5 saniyenin altında kalır (performans-butcesi yeteneği).
- Gönderimden sonra teşekkür ekranında bir sonraki adımı söyle ve paylaşım iste.
- Önemli eylemlerde olay gönder: \`vayra.olay("on_kayit", { kaynak })\`; kaynağı adresteki utm_source değerinden oku (analitik-olay-plani yeteneği).
- Reklam trafiği için her kampanyaya ayrı başlık sürümü hazırlanabilir; adres parametresine göre başlığı değiştir, sayfanın gerisi aynı kalsın.

## A/B testi
Etkisi büyük olandan başla: başlık, kahraman görseli, düğme metni, fiyat sunumu, form alan sayısı. Aynı anda tek değişken değiştir. Sürüm başına en az 100 dönüşüm ve tam bir hafta (hafta içi ve hafta sonu farkı için) dolmadan karar verme.

## Çıktı
Kodu yazmadan önce bölüm planını tablo olarak göster:

| Bölüm | Amaç | Başlık | İçerik | Eylem |
|---|---|---|---|---|
| Kahraman | Değeri 5 saniyede anlatmak | ... | ... | Ücretsiz dene |

Sonra sayfayı yaz. Özette hedef eylemi, ölçülen olayları ve gerçek içerikle doldurulması gereken yer tutucuları (yorum, logo, rakam) listele.

## Yapma
- Sahte yorum, uydurma kullanıcı sayısı, her açılışta yeniden başlayan geri sayım koyma.
- Eşit ağırlıkta birden çok düğmeyi (Kayıt ol, Bize ulaş, Blog) yan yana koyma.
- İlk saniyelerde açılır pencereyle ziyaretçiyi bölme.
- Kahramanda kayan slayt kullanma; ilk mesaj sabit olsun.
- Ürünü göstermeyen soyut stok görselle kahramanı doldurma.`,
    dosyalar: [],
  },
  {
    id: "form-dogrulama", ad: "form-dogrulama", baslik: "Form doğrulama ve Türkçe hata mesajları", kategori: "veri", simge: "/gercek/galeri/3d4.webp",
    aciklama: "Kayıt, iletişim, başvuru, ödeme ya da ayar formlarına istemci ve sunucu tarafı doğrulama eklerken, Türkçe ve yol gösteren hata mesajları yazarken kullan: zorunlu alan, e-posta, cep telefonu, parola kuralları, tarih, sayı aralığı, eşleşen alanlar, doğrulamanın ne zaman yapılacağı (yazarken, alandan çıkınca, gönderince), aria ile erişilebilir hata gösterimi, gönderim durumları ve çift gönderimi önleme. Hazır doğrulama betiği içerir. Kullanıcı 'form çalışmıyor', 'hata mesajı', 'validasyon', 'zorunlu alan' ya da 'form doğrula' dediğinde kullan.",
    ornekler: ["Kayıt formuma doğrulama ekle", "Form hata mesajlarını Türkçe ve anlaşılır yap", "Başvuru formu yanlış verilerle gönderiliyor, düzelt"],
    govde: `# Form doğrulama ve Türkçe hata mesajları

Amaç: kullanıcıyı suçlamadan neyin yanlış olduğunu ve nasıl düzeleceğini söyleyen, ekran okuyucuyla da anlaşılan formlar. İstemci doğrulaması kolaylık içindir, güvenlik değildir: aynı kurallar sunucuda (Vayra Bulut fonksiyonu ya da şemalı tablo) mutlaka yeniden çalışır.

## Önce topla
- Alan listesi: ad, tür, zorunlu mu, sınırlar (en az, en çok, biçim)
- Gönderim nereye gidiyor: vayra.veri tablosu, Bulut fonksiyonu, e-posta otomasyonu
- Kişisel veri alanları ve gereken onaylar (TCKN, adres ve il ilçe için tckn-adres-formu yeteneği)
- Sitenin hitap biçimi: "siz" mi "sen" mi

## Adımlar
1. **Doğru HTML ile başla**: her alana görünür label; doğru type ve inputmode; autocomplete değeri (email, tel, given-name, family-name, street-address, new-password, one-time-code). Tarayıcının otomatik doldurması formu hızlandırır.
2. **Zamanlama**: kullanıcı yazmaya başlar başlamaz hata gösterme. Alandan çıkınca (blur) doğrula; hatalı alan düzeltilirken her tuşta yeniden doğrula ki hata düzelir düzelmez kaybolsun. Gönderince bütün formu doğrula.
3. **Gösterim**: hata metni alanın hemen altında; renkle birlikte simge ve metin. Alana aria-invalid ve aria-describedby bağla. Gönderimde hata varsa ilk hatalı alana odaklan; uzun formda üstte bağlantılı hata özeti göster.
4. **Gönderim durumu**: gönderim sürerken düğmeyi pasif yap ve "Gönderiliyor" yaz (çift gönderimi önler). Başarıda net onay ver; ağ hatasında verileri silmeden "Bağlantı kurulamadı, tekrar deneyin" de.
5. **Sunucu hatalarını eşle**: sunucu alan bazlı hata dönerse (rest-api-tasarimi yeteneğindeki hatalar dizisi) mesajı aynı alanın altında göster; şemalı Vayra tablosunun Türkçe hatasını da formda göster.

## Mesaj yazımı
| Durum | Kötü | İyi |
|---|---|---|
| Zorunlu | Bu alan zorunludur | Ad soyad boş bırakılamaz |
| E-posta | Geçersiz giriş | E-posta adresi ad@alanadi.com biçiminde olmalı |
| Parola | Parola uygun değil | Parola en az 8 karakter olmalı |
| Telefon | Hatalı numara | Telefon numarası 5 ile başlayan 10 haneli cep numarası olmalı |
| Tarih | Geçersiz tarih | Doğum tarihi bugünden önce olmalı |
| Eşleşme | Hata oluştu | Parola tekrarı ile parola aynı değil |
| Sınır | Değer çok büyük | Adet en çok 20 olabilir |

Alanın adını söyle, ne beklendiğini söyle; büyük harfle bağırma, ünlem koyma, teknik terim (regex, null, 422) gösterme.

## Kurallar
- Parola alanında göster ve gizle düğmesi koy; parola tekrarı alanından iyidir. En az 8 karakter iste, zorunlu büyük harf ve sembol kuralı koyma (NIST SP 800-63B); sızmış ve çok yaygın parolaları reddetmek daha değerlidir.
- E-postada basit biçim kontrolü yeterli; karmaşık desenler geçerli adresleri reddeder. Asıl doğrulama onay e-postasıdır.
- Ad alanında Türkçe harfleri, kesme işaretini, tireyi ve boşluğu kabul et.
- Sayı ve para alanında virgüllü ondalığı ve binlik noktasını kabul et (1.250,50).
- Çoğu alan zorunluysa isteğe bağlı olanları "(isteğe bağlı)" diye işaretle; tersi durumda zorunluları işaretle.
- Başta ve sonda kalan boşlukları kırp; telefonu tek biçimde sakla (+905321234567).
- Onay kutuları önceden işaretli olmasın; KVKK ve ticari ileti onayı ayrı kutular.

## Betik
\`scripts/form-dogrulama.js\` değerleri kurallara göre denetler ve Türkçe mesajlar döner. Sunucu tarafı denetim için mantığı Bulut fonksiyonuna taşıyabilir ya da kuralları denemek için şu girdiyle çalıştırabilirsin:

\`\`\`json
{
  "degerler": { "ad": "Ayşe Yılmaz", "eposta": "ayse@", "telefon": "0532 123 45 67", "parola": "1234", "parola2": "12345", "kvkk": false },
  "kurallar": {
    "ad": { "zorunlu": true, "tur": "ad", "etiket": "Ad soyad", "enAz": 2 },
    "eposta": { "zorunlu": true, "tur": "eposta" },
    "telefon": { "tur": "telefon" },
    "parola": { "zorunlu": true, "tur": "parola" },
    "parola2": { "ayni": "parola", "etiket": "Parola tekrarı" },
    "kvkk": { "tur": "onay", "zorunlu": true, "etiket": "KVKK aydınlatma metni" }
  }
}
\`\`\`

Türler: metin, ad, eposta, telefon, parola, sayi, tamSayi, tarih (gecmis ya da gelecek seçeneğiyle), url, postaKodu, onay, secim (secenekler listesiyle). Ek kurallar: enAz, enCok, desen ve desenMesaji, ayni, mesaj (alan için tek özel mesaj). Dönüş: gecerli, hatalar (alan adına göre mesaj), ilkHatali (odaklanılacak alan) ve temiz (kırpılmış ve biçimlenmiş değerler).

## Yapma
- Yalnız istemcide doğrulayıp sunucuya güvenme.
- Hata olunca formu sıfırlama ya da sayfayı yenileme.
- Placeholder metnini label yerine kullanma.
- Yapıştırmayı engelleme; parola yöneticilerini bozar.
- Bütün hataları tek bir alert penceresinde gösterme.`,
    dosyalar: [
      { yol: "scripts/form-dogrulama.js", icerik: `// Form değerlerini kurallara göre denetler, Türkçe hata mesajları ve temizlenmiş değerler döner.
// Girdi: { degerler: { alan: deger }, kurallar: { alan: { zorunlu, tur, etiket, enAz, enCok, ayni, desen, desenMesaji, mesaj } } }
// tur: metin | ad | eposta | telefon | parola | sayi | tamSayi | tarih | url | postaKodu | onay | secim
module.exports = function (girdi, vayra) {
  var degerler = (girdi && girdi.degerler) || {};
  var kurallar = (girdi && girdi.kurallar) || {};
  var hatalar = {};
  var temiz = {};
  var hazirEtiket = { ad: "Ad", adSoyad: "Ad soyad", soyad: "Soyad", eposta: "E-posta adresi", telefon: "Telefon numarası", parola: "Parola", sifre: "Parola", mesaj: "Mesaj", adres: "Adres", tarih: "Tarih", dogumTarihi: "Doğum tarihi", postaKodu: "Posta kodu" };

  function buyukIlk(s) {
    var ilk = s.charAt(0);
    ilk = ilk === "i" ? "İ" : ilk === "ı" ? "I" : ilk.toUpperCase();
    return ilk + s.slice(1);
  }
  function etiketi(alan, k) {
    return k.etiket || hazirEtiket[alan] || buyukIlk(alan.replace(/([a-zçğıöşü])([A-ZÇĞİÖŞÜ])/g, "$1 $2").toLowerCase());
  }
  function sayiyaCevir(d) {
    if (typeof d === "number") return d;
    var s = String(d).replace(/\\s|TL|₺/gi, "");
    if (/^-?\\d{1,3}(\\.\\d{3})+(,\\d+)?$/.test(s)) s = s.replace(/\\./g, "").replace(",", ".");
    else if (/^-?\\d+,\\d+$/.test(s)) s = s.replace(",", ".");
    else if (/^-?\\d{1,3}(,\\d{3})+(\\.\\d+)?$/.test(s)) s = s.replace(/,/g, "");
    return /^-?\\d+(\\.\\d+)?$/.test(s) ? Number(s) : NaN;
  }
  function tariheCevir(d) {
    var s = String(d).trim(), m, y, a, g;
    if ((m = /^(\\d{4})-(\\d{2})-(\\d{2})/.exec(s))) { y = +m[1]; a = +m[2]; g = +m[3]; }
    else if ((m = /^(\\d{1,2})[.\\/-](\\d{1,2})[.\\/-](\\d{4})$/.exec(s))) { g = +m[1]; a = +m[2]; y = +m[3]; }
    else return null;
    var t = new Date(Date.UTC(y, a - 1, g));
    if (t.getUTCFullYear() !== y || t.getUTCMonth() !== a - 1 || t.getUTCDate() !== g) return null;
    return y + "-" + (a < 10 ? "0" : "") + a + "-" + (g < 10 ? "0" : "") + g;
  }
  function bugunIso() {
    var b = new Date();
    return tariheCevir(b.getFullYear() + "-" + ("0" + (b.getMonth() + 1)).slice(-2) + "-" + ("0" + b.getDate()).slice(-2));
  }

  Object.keys(kurallar).forEach(function (alan) {
    var k = kurallar[alan] || {};
    var tur = k.tur || "metin";
    var etiket = etiketi(alan, k);
    var ham = degerler[alan];
    var d = ham;
    if (typeof d === "string" && tur !== "parola") d = d.replace(/[ ​﻿]/g, " ").trim().replace(/\\s+/g, " ");
    var bos = d === undefined || d === null || d === "" || (tur === "onay" && d !== true);

    if (bos) {
      if (k.zorunlu) hatalar[alan] = k.mesaj || (tur === "onay" ? etiket + " onayı gerekli" : tur === "secim" ? etiket + " seçin" : etiket + " boş bırakılamaz");
      return;
    }

    var hata = null;
    if (tur === "eposta") {
      d = String(d).toLowerCase();
      if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(d)) hata = etiket + " ad@alanadi.com biçiminde olmalı";
    } else if (tur === "telefon") {
      var r = String(d).replace(/\\D/g, "");
      if (r.indexOf("90") === 0 && r.length === 12) r = r.slice(2);
      if (r.charAt(0) === "0" && r.length === 11) r = r.slice(1);
      if (!/^5\\d{9}$/.test(r)) hata = etiket + " 5 ile başlayan 10 haneli cep numarası olmalı";
      else d = "+90" + r;
    } else if (tur === "parola") {
      var enAzP = k.enAz || 8;
      if (String(d).length < enAzP) hata = etiket + " en az " + enAzP + " karakter olmalı";
      else if (String(d).length > (k.enCok || 128)) hata = etiket + " en çok " + (k.enCok || 128) + " karakter olabilir";
      else if (/^(.)\\1+$/.test(String(d)) || /^(12345678|123456789|password|parola123|qwertyui)/i.test(String(d))) hata = etiket + " tahmin edilmesi çok kolay, daha uzun ve farklı bir parola seçin";
    } else if (tur === "sayi" || tur === "tamSayi") {
      var n = sayiyaCevir(d);
      if (isNaN(n)) hata = etiket + " bir sayı olmalı";
      else if (tur === "tamSayi" && n % 1 !== 0) hata = etiket + " tam sayı olmalı";
      else if (k.enAz !== undefined && n < k.enAz) hata = etiket + " en az " + k.enAz + " olmalı";
      else if (k.enCok !== undefined && n > k.enCok) hata = etiket + " en çok " + k.enCok + " olabilir";
      else d = n;
    } else if (tur === "tarih") {
      var iso = tariheCevir(d);
      if (!iso) hata = etiket + " GG.AA.YYYY biçiminde gerçek bir tarih olmalı";
      else if (k.gecmis && iso >= bugunIso()) hata = etiket + " bugünden önce olmalı";
      else if (k.gelecek && iso < bugunIso()) hata = etiket + " bugün ya da sonrası olmalı";
      else d = iso;
    } else if (tur === "url") {
      if (!/^https?:\\/\\/[^\\s.]+\\.[^\\s]{2,}$/i.test(String(d))) hata = etiket + " https:// ile başlayan bir adres olmalı";
    } else if (tur === "postaKodu") {
      if (!/^(0[1-9]|[1-7]\\d|8[01])\\d{3}$/.test(String(d))) hata = etiket + " 5 haneli olmalı";
    } else if (tur === "ad") {
      if (!/^[A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû' .-]+$/.test(String(d))) hata = etiket + " yalnız harf, boşluk ve kesme işareti içerebilir";
    } else if (tur === "secim") {
      if (k.secenekler && k.secenekler.indexOf(d) === -1) hata = etiket + " için listeden bir seçenek seçin";
    }

    if (!hata && (tur === "metin" || tur === "ad")) {
      var uzunluk = String(d).length;
      if (k.enAz && uzunluk < k.enAz) hata = etiket + " en az " + k.enAz + " karakter olmalı";
      else if (k.enCok && uzunluk > k.enCok) hata = etiket + " en çok " + k.enCok + " karakter olabilir (şu an " + uzunluk + ")";
    }
    if (!hata && k.desen && !new RegExp(k.desen).test(String(d))) hata = k.desenMesaji || etiket + " beklenen biçimde değil";
    if (!hata && k.ayni) {
      var diger = degerler[k.ayni];
      if (diger !== ham) hata = k.mesaj || etiket + " ile " + etiketi(k.ayni, kurallar[k.ayni] || {}).toLowerCase() + " aynı değil";
    }

    if (hata) hatalar[alan] = k.mesaj && !k.ayni ? k.mesaj : hata;
    else temiz[alan] = d;
  });

  var ilkHatali = Object.keys(kurallar).filter(function (a) { return hatalar[a]; })[0] || null;
  return { gecerli: !ilkHatali, hatalar: hatalar, ilkHatali: ilkHatali, temiz: temiz };
};
` },
    ],
  },
  {
    id: "rest-api-tasarimi", ad: "rest-api-tasarimi", baslik: "REST API tasarımı ve hata biçimi", kategori: "gelistirme", simge: "/gercek/panel/gal-gpt-1.webp",
    aciklama: "Bir uygulamanın sunucu uç noktalarını (Vayra Bulut fonksiyonu api/*.js, Next.js route handler ya da başka bir arka uç) tasarlarken, adlandırırken veya gözden geçirirken kullan: kaynak adları, HTTP yöntemleri, durum kodları, RFC 9457 problem details hata gövdesi, alan hataları, sayfalama ve süzme, sürümleme, idempotency anahtarı, hız sınırı, webhook imza doğrulama ve OpenAPI sözleşmesi. Kullanıcı 'API yaz', 'endpoint', 'uç nokta', 'webhook', 'backend' ya da 'hangi hata kodu dönmeli' dediğinde kullan.",
    ornekler: ["Sipariş için API uç noktaları tasarla", "API hata yanıtlarımı standart hâle getir", "Webhook alan bir fonksiyon yaz"],
    govde: `# REST API tasarımı ve hata biçimi

Amaç: tutarlı, tahmin edilebilir ve güvenli uç noktalar. Aynı projedeki her uç nokta aynı adlandırmayı, aynı hata gövdesini ve aynı sayfalama kuralını kullanır.

## Önce topla
- Kaynaklar (sipariş, ürün, randevu) ve aralarındaki ilişkiler
- Kim çağıracak: kendi sayfan, mobil uygulama, üçüncü taraf, webhook gönderen servis
- Kimlik doğrulama: oturum çerezi, API anahtarı, imzalı webhook
- Gizli anahtar gerekiyor mu; gerekiyorsa yalnız sunucuda \`vayra.sir("AD")\` ile okunur

## Adımlar
1. **Kaynakları adlandır**: çoğul isim, küçük harf, kelimeler tireyle: \`/api/siparisler\`, \`/api/siparisler/{id}\`, \`/api/siparisler/{id}/kalemler\`. Fiili yola koyma; durum değiştiren özel eylemde alt kaynak kullan: \`POST /api/siparisler/{id}/iptal\`.
2. **Yöntemleri eşle**: GET okur ve yan etkisizdir; POST oluşturur; PATCH kısmi günceller; PUT bütünüyle değiştirir; DELETE siler. GET, PUT ve DELETE tekrarlandığında aynı sonucu verir.
3. **Durum kodunu seç** (aşağıdaki tablo). Hata varken 200 dönme.
4. **Hata gövdesini standartlaştır**: RFC 9457 problem details, içerik türü \`application/problem+json\`. Alan hataları için \`hatalar\` dizisi ekle; form bunları alanların altında gösterir (form-dogrulama yeteneği).
5. **Liste uç noktaları**: sayfalama, sıralama ve süzme parametreleri her listede aynı adla. Büyük ve sık değişen listelerde imleç, küçük listelerde sayfa numarası.
6. **Girdiyi doğrula**: gövdeyi şemaya göre denetle, sayı ve tarihleri sunucuda dönüştür, bilinmeyen alanları reddet. Fiyat, indirim, stok ve yetki istemciden alınmaz; sunucu kendi tablosundan okur.
7. **Dayanıklılık**: para ya da kayıt oluşturan POST isteği \`Idempotency-Key\` başlığı alır; aynı anahtarla gelen ikinci istek ilk sonucu döner (anahtarı 24 saat sakla). Hız sınırında 429 ve \`Retry-After\`.
8. **Webhook alırken**: imzayı ham gövde (\`istek.metin\`) üzerinden HMAC ile doğrula, zaman damgası 5 dakikadan eskiyse reddet, hızlıca 2xx dön, olayı kimliğiyle bir kez işle.
9. **Biçim kuralları**: alan adlarında tek stil (camelCase), tarih ISO 8601 ve UTC (\`2026-11-05T09:30:00Z\`), para kuruş cinsinden tam sayı ya da ondalık metin ve para birimi, kimlikler metin.
10. **Sürümleme**: yalnız dışarıya açık API'de \`/api/v1/\`. Alan eklemek sürüm gerektirmez; alan silmek ya da anlamını değiştirmek yeni sürüm ister.

## Durum kodları
| Kod | Ne zaman |
|---|---|
| 200 | Başarılı okuma ya da güncelleme |
| 201 | Oluşturuldu; Location başlığında yeni kaynağın adresi |
| 204 | Başarılı, gövde yok (silme) |
| 400 | Gövde okunamadı, JSON bozuk |
| 401 | Kimlik yok ya da süresi dolmuş |
| 403 | Kimlik var, bu işe yetki yok |
| 404 | Kaynak yok (yetkisiz kişiye kaydın varlığını sızdırmamak için de) |
| 405 | Yöntem desteklenmiyor; Allow başlığıyla |
| 409 | Çakışma: kayıt zaten var, durum uygun değil |
| 422 | Alan doğrulaması başarısız |
| 429 | Hız sınırı aşıldı |
| 500 | Beklenmeyen hata; ayrıntı günlükte, yanıtta değil |
| 503 | Bağlı servis geçici olarak yok |

## Hata gövdesi
\`\`\`json
{
  "type": "https://lumenkahve.com/hatalar/dogrulama",
  "title": "Gönderilen bilgiler eksik ya da hatalı",
  "status": 422,
  "detail": "2 alan düzeltilmeli",
  "instance": "/api/siparisler",
  "hatalar": [
    { "alan": "eposta", "mesaj": "E-posta adresi ad@alanadi.com biçiminde olmalı" },
    { "alan": "kalemler[0].adet", "mesaj": "Adet 1 ile 20 arasında olmalı" }
  ]
}
\`\`\`

## Liste yanıtı
\`\`\`text
GET /api/siparisler?durum=odendi&sirala=-olusturma&sinir=20&imlec=eyJpZCI6IjEyMyJ9
\`\`\`
\`\`\`json
{ "veriler": [ { "id": "s_123", "durum": "odendi" } ], "sonraki": "eyJpZCI6IjE0MyJ9" }
\`\`\`

## Vayra Bulut fonksiyonu iskeleti
\`\`\`js
// api/siparisler.js
export default async function (istek, vayra) {
  const problem = (status, title, ek) => ({
    durum: status,
    basliklar: { "content-type": "application/problem+json" },
    govde: Object.assign({ type: "about:blank", title, status, instance: istek.yol }, ek || {}),
  });
  if (istek.yontem !== "POST") return Object.assign(problem(405, "Bu adres yalnız POST kabul eder"), { basliklar: { allow: "POST", "content-type": "application/problem+json" } });
  const g = istek.govde || {};
  const hatalar = [];
  if (!g.eposta || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(String(g.eposta))) hatalar.push({ alan: "eposta", mesaj: "E-posta adresi geçersiz" });
  if (!Array.isArray(g.kalemler) || g.kalemler.length === 0) hatalar.push({ alan: "kalemler", mesaj: "En az bir ürün seçin" });
  if (hatalar.length) return problem(422, "Gönderilen bilgiler eksik ya da hatalı", { hatalar });
  try {
    const kayit = await vayra.veri.ekle("siparisler", { eposta: String(g.eposta).trim().toLowerCase(), durum: "bekliyor" });
    return { durum: 201, basliklar: { location: "/api/siparisler/" + kayit.id }, govde: kayit };
  } catch (h) {
    console.log("siparis eklenemedi", h && h.message);
    return problem(500, "Sipariş şu an kaydedilemedi, biraz sonra tekrar deneyin");
  }
}
\`\`\`

Uç nokta sözleşmesini belgelemek gerekirse \`references/openapi-iskelet.yaml\` dosyasını temel al.

## Çıktı
| Yöntem | Yol | Amaç | Girdi | Başarı | Hatalar | Yetki |
|---|---|---|---|---|---|---|

Tabloyu yazdıktan sonra kodu yaz; özette gereken sırların adlarını söyle.

## Yapma
- 200 durum koduyla gövdede hata dönme.
- Yanıtta yığın izi, SQL hatası ya da iç dosya yolu gösterme.
- GET isteğiyle kayıt değiştirme ya da silme.
- Her uç noktada farklı hata biçimi kullanma.
- Tutar ve fiyatı istemcinin gönderdiği değerden hesaplama.`,
    dosyalar: [
      { yol: "references/openapi-iskelet.yaml", icerik: `openapi: 3.1.0
info:
  title: Lumen Kahve API
  version: 1.0.0
  description: Sipariş ve ürün uç noktaları. Hatalar RFC 9457 (application/problem+json) biçimindedir.
servers:
  - url: https://lumenkahve.com/api
paths:
  /siparisler:
    get:
      summary: Siparişleri listeler
      parameters:
        - { name: durum, in: query, schema: { type: string, enum: [bekliyor, odendi, iptal] } }
        - { name: sinir, in: query, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
        - { name: imlec, in: query, schema: { type: string } }
      responses:
        "200":
          description: Sayfalı liste
          content:
            application/json:
              schema:
                type: object
                properties:
                  veriler: { type: array, items: { $ref: "#/components/schemas/Siparis" } }
                  sonraki: { type: [string, "null"], description: Sonraki sayfanın imleci; son sayfada null }
        "401": { $ref: "#/components/responses/Problem" }
    post:
      summary: Sipariş oluşturur
      parameters:
        - { name: Idempotency-Key, in: header, required: true, schema: { type: string, maxLength: 64 } }
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: "#/components/schemas/YeniSiparis" }
      responses:
        "201":
          description: Oluşturuldu
          headers:
            Location: { schema: { type: string }, description: /api/siparisler/{id} }
          content:
            application/json:
              schema: { $ref: "#/components/schemas/Siparis" }
        "409": { $ref: "#/components/responses/Problem" }
        "422": { $ref: "#/components/responses/Problem" }
        "429": { $ref: "#/components/responses/Problem" }
  /siparisler/{id}:
    parameters:
      - { name: id, in: path, required: true, schema: { type: string } }
    get:
      summary: Tek sipariş
      responses:
        "200":
          description: Sipariş
          content:
            application/json:
              schema: { $ref: "#/components/schemas/Siparis" }
        "404": { $ref: "#/components/responses/Problem" }
  /siparisler/{id}/iptal:
    post:
      summary: Siparişi iptal eder (yalnız bekliyor durumunda)
      parameters:
        - { name: id, in: path, required: true, schema: { type: string } }
      responses:
        "200": { description: İptal edildi }
        "409": { $ref: "#/components/responses/Problem" }
components:
  schemas:
    YeniSiparis:
      type: object
      required: [kalemler, alici]
      additionalProperties: false
      properties:
        kalemler:
          type: array
          minItems: 1
          maxItems: 50
          items:
            type: object
            required: [urunId, adet]
            properties:
              urunId: { type: string }
              adet: { type: integer, minimum: 1, maximum: 20 }
        alici:
          type: object
          required: [ad, eposta]
          properties:
            ad: { type: string, minLength: 2, maxLength: 80 }
            eposta: { type: string, format: email }
            telefon: { type: string, pattern: "^\\\\+905\\\\d{9}$" }
        not: { type: string, maxLength: 500 }
    Siparis:
      type: object
      properties:
        id: { type: string }
        durum: { type: string, enum: [bekliyor, odendi, iptal] }
        toplamKurus: { type: integer, description: Sunucuda ürün tablosundan hesaplanır }
        paraBirimi: { type: string, const: TRY }
        olusturma: { type: string, format: date-time }
    Problem:
      type: object
      required: [type, title, status]
      properties:
        type: { type: string, format: uri-reference }
        title: { type: string }
        status: { type: integer }
        detail: { type: string }
        instance: { type: string }
        hatalar:
          type: array
          items:
            type: object
            properties:
              alan: { type: string }
              mesaj: { type: string }
  responses:
    Problem:
      description: Hata (RFC 9457)
      content:
        application/problem+json:
          schema: { $ref: "#/components/schemas/Problem" }
` },
    ],
  },
  {
    id: "veri-semasi-goc", ad: "veri-semasi-goc", baslik: "Veri şeması ve göç planı", kategori: "veri", simge: "/gercek/galeri/soyut6.webp",
    aciklama: "Bir uygulamanın tablolarını, alanlarını, ilişkilerini ve erişim kurallarını tasarlarken ya da çalışan bir uygulamada şemayı değiştirirken (alan ekleme, ad değiştirme, tür değiştirme, tablo bölme) kullan: Vayra Veri sütun türleri, zorunlu ve benzersiz alanlar, bire çok ve çoka çok ilişkiler, tarihsel değerlerin kopyalanması, okuma ve yazma kuralları, genişlet taşı daralt göç adımları, veri doldurma, yedek ve geri dönüş planı. Kayıtları şemaya göre denetleyen betik içerir. Kullanıcı 'veritabanı', 'tablo kur', 'şema', 'migration', 'alan ekle' ya da 'veri modeli' dediğinde kullan.",
    ornekler: ["Randevu uygulamam için veritabanı şeması çıkar", "Ürünler tablosuna yeni alan eklemem lazım, güvenli yap", "Fiyat alanını metinden sayıya çevir"],
    govde: `# Veri şeması ve göç planı

Amaç: ihtiyaçtan şemaya, şemadan güvenli değişikliğe giden net bir yol. Vayra Veri'de tablolar \`veritabani\` aracıyla (islem: tablo_kur) kurulur; aynı ilkeler PostgreSQL, SQLite ya da Supabase için de geçerlidir.

## Önce topla
- Uygulamanın ekranları ve her ekranda gösterilen bilgiler
- Kim neyi görür, kim ekler, kim düzenler (misafir, üye, kaydın sahibi, yönetici)
- Beklenen kayıt sayısı ve en sık sorgu (liste, arama, süzme, sıralama)
- Değişiklikse: mevcut şema, kayıt sayısı, uygulama canlıda mı, eski sürümü kullanan mobil istemci var mı

## Şema tasarımı
1. **Varlıkları çıkar**: ekranlardaki isimleri topla (üye, ürün, sipariş, sipariş kalemi, yorum). Her varlık bir tablo; ad çoğul ve küçük harf: urunler, siparisler, siparisKalemleri.
2. **Alanları türle**: Vayra türleri metin, uzunMetin, sayi, mantiksal, tarih, eposta, url, gorsel, secim, iliski, json. Durum alanı secim türünde ve sabit listeyle (bekliyor, odendi, iptal). Para için projede tek yol seç: TL cinsinden sayı ya da kuruş cinsinden tam sayı.
3. **Kısıtları yaz**: zorunlu alanlar, benzersiz alanlar (e-posta, ürün kodu, adres kısaltması), varsayılan değerler. id, olusturma ve guncelleme Vayra'da kendiliğinden gelir.
4. **İlişkileri kur**: bire çok ilişkide "çok" tarafına iliski alanı koy (siparisKalemleri.siparis). Çoka çok ilişki için ara tablo (urunEtiketleri). Gösterim için kategori adını kopyalama, listede genislet ile al.
5. **Tarihsel değerleri kopyala**: sipariş anındaki ürün adı, birim fiyatı ve KDV oranı kaleme yazılır; ürün fiyatı sonra değişse de eski sipariş bozulmaz.
6. **Erişim kurallarını belirle**: her tablo için okuma, ekleme, düzenleme. Kişiye özel veride okuma ve düzenleme sahibi; sunucunun yazdığı tablolarda (ödeme, sipariş) istemciden ekleme kapalı.
7. **json türünü sınırla**: yalnız yapısı değişken ve üzerinde süzme yapılmayan veride (ayarlar, ham webhook gövdesi).
8. **Sorguya göre düşün**: en sık süzülen ve sıralanan alanları not et; SQL veritabanında bunlara indeks koy.

## Şema çıktısı
| Tablo | Alan | Tür | Zorunlu | Benzersiz | Varsayılan | Not |
|---|---|---|---|---|---|---|
| urunler | ad | metin | evet | hayır | | |
| urunler | kod | metin | evet | evet | | adres kısaltması |
| urunler | durum | secim | evet | hayır | taslak | taslak, yayinda, arsiv |

Altına erişim kurallarını yaz: | Tablo | Okuma | Ekleme | Düzenleme |

## Göç planı (canlı uygulamada değişiklik)
Kural: genişlet, taşı, daralt. Eski kod ve yeni kod bir süre birlikte çalışabilmeli.
1. **Genişlet**: yeni alanı isteğe bağlı olarak ekle; zorunlu yapma.
2. **Çift yaz**: kod hem eski hem yeni alana yazar.
3. **Doldur**: eski kayıtları küçük partilerle güncelle (500 kayıtlık gruplar); kaç kaydın güncellendiğini say.
4. **Okumayı taşı**: kod yeni alandan okur; yeni alan boşsa eskiye düşer.
5. **Daralt**: bütün kayıtlar dolunca yeni alanı zorunlu yap, eski alana yazmayı bırak, bir sürüm sonra eski alanı sil.

Ad değiştirme tek adımda yapılmaz: yeni alan ekle, kopyala, eskiyi kaldır. Tür değiştirmeden önce dönüşmeyecek değerleri listele (sayı alanına "on iki" yazılmış kayıtlar).

| Adım | Ne değişir | Geri dönüş | Kontrol |
|---|---|---|---|
| 1 | indirimOrani alanı eklenir | Alanı sil | Şema güncel |
| 3 | Eski kayıtlar doldurulur | Alanı boşalt | Boş kalan kayıt sayısı 0 |

Her göçten önce yedek al (Veriler sekmesinden dışa aktar); sonra kayıt sayısını ve boş alan sayısını karşılaştır.

## Betik
\`scripts/veri-semasi-goc.js\` kayıtları şemaya göre denetler; göçten önce hangi kayıtların yeni kurala uymayacağını ve hangilerinin güvenle dönüştürülebileceğini bulur. Kayıtları \`vayra.veri.liste\` ile ya da dışa aktarılan dosyadan al ve şu girdiyle çalıştır:

\`\`\`json
{
  "sema": {
    "ad": { "tur": "metin", "zorunlu": true, "enUzun": 80 },
    "fiyat": { "tur": "sayi", "enAz": 0 },
    "durum": { "tur": "secim", "secenekler": ["taslak", "yayinda"] },
    "kod": { "tur": "metin", "benzersiz": true }
  },
  "kayitlar": [ { "id": "1", "ad": "Latte", "fiyat": "95", "durum": "Yayinda", "kod": "L1" } ]
}
\`\`\`

Dönüş: toplam, uygun, uygunsuz, sorunlar (id, alan, sorun, deger), donusturulebilir (eski ve yeni değer; "95" sayıya, "evet" mantıksala, "05.11.2026" ISO tarihe), alanOzeti (dolu, boş, sorunlu) ve şemada olmayan alanlar.

## Yapma
- Her şeyi tek bir json alanına doldurma.
- Sayıyı metin olarak ya da tarihi "05.11.2026" metni olarak saklama; tarih ISO biçiminde durur.
- Canlı veride alanı silip yeniden ekleyerek ad değiştirme.
- Yedek almadan toplu güncelleme yapma.
- Sipariş toplamı gibi türetilmiş değeri, kalemlerle aynı işlemde güncellemeden saklama.`,
    dosyalar: [
      { yol: "scripts/veri-semasi-goc.js", icerik: `// Kayıtları bir şemaya göre denetler: göçten önce hangi kayıtların yeni kurala uymayacağını ve
// hangilerinin güvenle dönüştürülebileceğini bulur.
// Girdi: { sema: { alan: { tur, zorunlu, benzersiz, enAz, enCok, enUzun, secenekler } }, kayitlar: [ { id, ... } ], ornekSiniri }
// tur: metin | uzunMetin | sayi | mantiksal | tarih | eposta | url | gorsel | secim | iliski | json
module.exports = function (girdi, vayra) {
  var sema = (girdi && girdi.sema) || {};
  var kayitlar = (girdi && girdi.kayitlar) || [];
  var sinir = (girdi && girdi.ornekSiniri) || 50;
  var sorunlar = [];
  var donusturulebilir = [];
  var alanOzeti = {};
  var gorulen = {};
  var uygunsuzIdler = {};

  Object.keys(sema).forEach(function (a) { alanOzeti[a] = { dolu: 0, bos: 0, sorunlu: 0, donusur: 0 }; gorulen[a] = {}; });

  function sayiDene(d) {
    var s = String(d).replace(/\\s|TL|₺/gi, "");
    if (/^-?\\d{1,3}(\\.\\d{3})+(,\\d+)?$/.test(s)) s = s.replace(/\\./g, "").replace(",", ".");
    else if (/^-?\\d+,\\d+$/.test(s)) s = s.replace(",", ".");
    return /^-?\\d+(\\.\\d+)?$/.test(s) ? Number(s) : null;
  }
  function mantiksalDene(d) {
    var s = String(d).trim().toLowerCase();
    if (["true", "1", "evet", "var", "açık", "acik", "e"].indexOf(s) !== -1) return true;
    if (["false", "0", "hayır", "hayir", "yok", "kapalı", "kapali", "h"].indexOf(s) !== -1) return false;
    return null;
  }
  function tarihDene(d) {
    var s = String(d).trim(), m, y, a, g;
    if ((m = /^(\\d{4})-(\\d{2})-(\\d{2})(T[\\d:.]+(Z|[+-]\\d{2}:?\\d{2})?)?$/.exec(s))) { y = +m[1]; a = +m[2]; g = +m[3]; }
    else if ((m = /^(\\d{1,2})[.\\/](\\d{1,2})[.\\/](\\d{4})$/.exec(s))) { g = +m[1]; a = +m[2]; y = +m[3]; }
    else return null;
    var t = new Date(Date.UTC(y, a - 1, g));
    if (t.getUTCMonth() !== a - 1 || t.getUTCDate() !== g) return null;
    return m[4] ? s : y + "-" + ("0" + a).slice(-2) + "-" + ("0" + g).slice(-2);
  }
  function ekle(liste, nesne) { if (liste.length < sinir) liste.push(nesne); }

  kayitlar.forEach(function (k, sira) {
    var id = k.id !== undefined ? String(k.id) : "#" + (sira + 1);
    Object.keys(sema).forEach(function (alan) {
      var s = sema[alan] || {};
      var d = k[alan];
      var oz = alanOzeti[alan];
      var bos = d === undefined || d === null || (typeof d === "string" && d.trim() === "");
      if (bos) {
        oz.bos++;
        if (s.zorunlu) { oz.sorunlu++; uygunsuzIdler[id] = true; ekle(sorunlar, { id: id, alan: alan, sorun: "zorunlu alan boş", deger: d }); }
        return;
      }
      oz.dolu++;
      var sorun = null, yeni;
      var tur = s.tur || "metin";
      if (tur === "sayi") {
        if (typeof d !== "number") { yeni = sayiDene(d); if (yeni === null) sorun = "sayıya çevrilemiyor"; }
        var n = typeof d === "number" ? d : yeni;
        if (!sorun && s.enAz !== undefined && n < s.enAz) sorun = "en az " + s.enAz + " olmalı";
        if (!sorun && s.enCok !== undefined && n > s.enCok) sorun = "en çok " + s.enCok + " olabilir";
      } else if (tur === "mantiksal") {
        if (typeof d !== "boolean") { yeni = mantiksalDene(d); if (yeni === null) sorun = "evet ya da hayır değil"; }
      } else if (tur === "tarih") {
        var t = tarihDene(d);
        if (t === null) sorun = "tarih olarak okunamıyor";
        else if (t !== d) yeni = t;
      } else if (tur === "eposta") {
        var e = String(d).trim().toLowerCase();
        if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(e)) sorun = "e-posta biçiminde değil";
        else if (e !== d) yeni = e;
      } else if (tur === "url" || tur === "gorsel") {
        if (!/^(https?:\\/\\/|\\/)[^\\s]+$/i.test(String(d))) sorun = "adres biçiminde değil";
      } else if (tur === "secim") {
        if (s.secenekler && s.secenekler.indexOf(d) === -1) {
          var bulunan = (s.secenekler || []).filter(function (x) { return String(x).toLowerCase() === String(d).trim().toLowerCase(); })[0];
          if (bulunan !== undefined) yeni = bulunan; else sorun = "izin verilen seçeneklerden biri değil (" + s.secenekler.join(", ") + ")";
        }
      } else if (tur === "json") {
        if (typeof d === "string") { try { yeni = JSON.parse(d); } catch (h) { sorun = "geçerli JSON değil"; } }
      } else if (tur === "metin" || tur === "uzunMetin") {
        if (typeof d !== "string") yeni = String(d);
        else if (d !== d.trim()) yeni = d.trim();
        var uz = String(d).trim().length;
        if (s.enUzun && uz > s.enUzun) sorun = "en çok " + s.enUzun + " karakter olabilir (" + uz + ")";
        if (s.enAz && uz < s.enAz) sorun = "en az " + s.enAz + " karakter olmalı";
      } else if (tur === "iliski") {
        if (typeof d !== "string" && typeof d !== "number") sorun = "ilişki alanı bir kayıt kimliği olmalı";
      }
      if (!sorun && s.benzersiz) {
        var anahtar = String(yeni !== undefined ? yeni : d).trim().toLowerCase();
        if (gorulen[alan][anahtar]) sorun = "benzersiz olmalı, " + gorulen[alan][anahtar] + " ile aynı";
        else gorulen[alan][anahtar] = id;
      }
      if (sorun) { oz.sorunlu++; uygunsuzIdler[id] = true; ekle(sorunlar, { id: id, alan: alan, sorun: sorun, deger: d }); }
      else if (yeni !== undefined) { oz.donusur++; ekle(donusturulebilir, { id: id, alan: alan, eski: d, yeni: yeni }); }
    });
  });

  var bilinmeyen = {};
  kayitlar.forEach(function (k) {
    Object.keys(k).forEach(function (a) { if (!sema[a] && ["id", "olusturma", "guncelleme", "uyeId"].indexOf(a) === -1) bilinmeyen[a] = (bilinmeyen[a] || 0) + 1; });
  });

  var uygunsuz = Object.keys(uygunsuzIdler).length;
  return {
    toplam: kayitlar.length,
    uygun: kayitlar.length - uygunsuz,
    uygunsuz: uygunsuz,
    sorunlar: sorunlar,
    donusturulebilir: donusturulebilir,
    alanOzeti: alanOzeti,
    semadaOlmayanAlanlar: bilinmeyen,
    ozet: uygunsuz === 0
      ? "Bütün kayıtlar şemaya uyuyor" + (donusturulebilir.length ? "; " + donusturulebilir.length + " değer dönüştürülmeli" : "")
      : uygunsuz + " kayıt şemaya uymuyor; göçten önce düzeltin ya da alanı isteğe bağlı bırakın"
  };
};
` },
    ],
  },
  {
    id: "kimlik-dogrulama-akisi", ad: "kimlik-dogrulama-akisi", baslik: "Kimlik doğrulama akışı", kategori: "gelistirme", simge: "/gercek/panel/gal-seedance-2.webp",
    aciklama: "Bir site ya da uygulamaya kayıt, giriş, çıkış, parola sıfırlama, e-posta doğrulama, iki adımlı doğrulama, sosyal giriş, oturum yönetimi ve hesap silme eklerken veya bu akışların güvenliğini denetlerken kullan: Vayra Üyelik (vayra.uye) ile kurulum, ekranlar ve hata durumları, hesabın varlığını ele vermeyen mesajlar, güvenli dönüş yönlendirmesi, deneme sınırı, parola özetleme, çerez ve belirteç kuralları, passkey. Kullanıcı 'üyelik', 'login', 'giriş ekranı', 'şifremi unuttum', 'oturum' ya da '2FA' dediğinde kullan.",
    ornekler: ["Uygulamama üyelik sistemi ekle", "Şifremi unuttum akışını kur", "Giriş ekranım güvenli mi kontrol et"],
    govde: `# Kimlik doğrulama akışı

Amaç: hem kolay hem güvenli bir üyelik. Vayra Build projelerinde kendi parola tablonu ya da oturum kodunu yazma; \`vayra.uye\` işlevlerini kullan. Kendi arka ucunu yazıyorsan aşağıdaki güvenlik kuralları aynen geçerlidir.

## Önce topla
- Giriş yöntemleri: e-posta ve parola, e-postaya bağlantı ya da kod, Google, Apple, SMS, misafir
- Üye olmadan neler yapılabilir (misafir sepeti, anonim giriş sonra kalıcı hesap)
- Üyeye özel tablolar ve erişim kuralları
- Mobil uygulama mı: App Store, üçüncü taraf sosyal giriş sunan uygulamada gizlilik odaklı eşdeğer bir seçenek (genelde Apple ile giriş) ister

## Ekranlar ve durumlar
1. **Kayıt**: ad, e-posta, parola (göster düğmesiyle); KVKK aydınlatma bağlantısı; ticari ileti onayı ayrı ve işaretsiz. Kayıttan sonra boş ekrana değil, ilk değerli adıma götür.
2. **Giriş**: e-posta, parola, "Şifremi unuttum" bağlantısı ve yalnız açık olan sosyal düğmeler. Hata mesajı tek ve genel: "E-posta ya da parola hatalı".
3. **Şifremi unuttum**: \`vayra.uye.sifremiUnuttum(eposta)\`. Yanıt, hesap olsun olmasın aynı: "Bu adrese kayıtlı bir hesap varsa sıfırlama bağlantısı gönderdik".
4. **Yeni parola**: bağlantı tek kullanımlık ve süreli (Vayra'da 24 saat). Parola değişince diğer oturumlar kapanır ve kullanıcıya bildirim e-postası gider.
5. **İki adımlı doğrulama**: giriş \`err.ikiAdim\` ile durursa 6 haneli kod alanı göster (autocomplete one-time-code, inputmode numeric) ve \`vayra.uye.ikiAdimDogrula(kod)\` çağır; kurtarma kodu seçeneği de olsun.
6. **Hesabım**: ad ve e-posta değişikliği, parola değiştirme, iki adımlı doğrulamayı açma, çıkış ve onay isteyen "Hesabı sil" (\`vayra.uye.hesabiSil()\`). App Store ve Google Play hesap oluşturan uygulamada uygulama içinden silmeyi zorunlu tutar.
7. **Oturum durumu**: \`vayra.uye.degisince\` ile üst menüyü güncelle. Korumalı sayfada üye yoksa giriş sayfasına yönlendir, dönüş yolunu sakla; yalnız aynı sitedeki yollara geri dön (açık yönlendirme açığı).

## Giriş formu iskeleti
\`\`\`js
const form = document.getElementById("giris");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const dugme = form.querySelector("button[type=submit]");
  const hata = document.getElementById("giris-hata");
  dugme.disabled = true; hata.textContent = "";
  try {
    await vayra.uye.giris(form.eposta.value.trim(), form.parola.value);
    location.href = guvenliDonus(new URLSearchParams(location.search).get("donus"));
  } catch (err) {
    if (err && err.ikiAdim) return ikiAdimEkraniniGoster();
    hata.textContent = (err && err.message) || "Giriş yapılamadı, tekrar deneyin";
    form.parola.focus();
  } finally {
    dugme.disabled = false;
  }
});
function guvenliDonus(yol) {
  return yol && yol.startsWith("/") && !yol.startsWith("//") && !yol.startsWith("/\\\\") ? yol : "/hesabim.html";
}
\`\`\`

## Güvenlik kuralları (kendi arka ucunda)
- **Parola**: en az 8 karakter iste, en az 64 karakteri kabul et; Argon2id ya da bcrypt ile özetle; sızmış parola listesine karşı denetle. Bileşim kuralı ve zorunlu periyodik değişim yok (NIST SP 800-63B).
- **Oturum çerezi**: HttpOnly, Secure, SameSite Lax; girişte yeni oturum kimliği üret (session fixation). Erişim belirtecini localStorage'a koyma.
- **Deneme sınırı**: hesap ve IP başına; 15 dakikada 5 başarısız denemeden sonra artan bekleme ya da ek doğrulama. Hesabı kalıcı kilitleme; saldırgan başkasını kilitleyebilir.
- **Belirteçler**: sıfırlama ve doğrulama belirteçleri en az 128 bit rastgele, veritabanında özetli, tek kullanımlık ve kısa ömürlü.
- **Hassas işlem**: e-posta değiştirme, hesap silme ve iki adımlıyı kapatma için parolayı ya da kodu yeniden iste; eski e-posta adresine bildirim gönder.
- **Kayıtta hesap varlığı**: en güvenli yanıt "Doğrulama e-postası gönderdik" demektir; "Bu e-posta zaten kayıtlı" mesajını seçersen deneme sınırı şarttır.
- **Günlük**: giriş, çıkış, parola değişimi ve başarısız denemeleri yaz; parolayı ve belirteci asla yazma.
- **Passkey**: kendi arka ucunda WebAuthn ile parola yerine geçiş anahtarı sunmak 2026'da en güçlü ve en kolay seçenektir; parolayı yedek yol olarak tut.

## Çıktı
| Ekran | Girdi | Başarı | Hata durumları | Kullanılan işlev |
|---|---|---|---|---|
| Giriş | e-posta, parola | Dönüş sayfası | Hatalı bilgi, iki adım, ağ hatası | vayra.uye.giris |

Özette hangi giriş yöntemlerinin Bulut panelindeki Kimlik bölümünden açılması gerektiğini ve e-posta servisinin kurulu olup olmadığını söyle.

## Yapma
- "Bu e-posta kayıtlı değil" gibi hesabın varlığını ele veren giriş mesajı.
- Parolayı e-postayla gönderme ya da geri çözülebilir biçimde saklama.
- Giriş sonrası dış adrese dönüş parametresiyle yönlendirme.
- Açık olmayan bir giriş yönteminin düğmesini koyma.
- Kodu ya da parolayı adres çubuğunda (sorgu parametresi) taşıma.`,
    dosyalar: [],
  },
  {
    id: "web-guvenlik-basliklari", ad: "web-guvenlik-basliklari", baslik: "Web güvenlik başlıkları ve OWASP denetimi", kategori: "web", simge: "/gercek/galeri/3d10.webp",
    aciklama: "Bir site, web uygulaması ya da API yayına çıkmadan önce güvenlik denetimi yaparken, HTTP güvenlik başlıklarını (Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, frame-ancestors) ayarlarken veya OWASP Top 10 2025 maddelerine göre açık ararken kullan: sızmış gizli anahtar, XSS, yetki atlatma ve IDOR, enjeksiyon, CORS, CSRF, açık yönlendirme, SSRF, dosya yükleme ve bağımlılık riski. Kullanıcı 'güvenli mi', 'güvenlik açığı', 'CSP', 'hacklenir mi', 'güvenlik taraması' ya da 'yayına hazır mı' dediğinde kullan.",
    ornekler: ["Sitemi yayından önce güvenlik açısından denetle", "Siteme güvenlik başlıklarını ekle", "API anahtarım sızmış olabilir mi kontrol et"],
    govde: `# Web güvenlik başlıkları ve OWASP denetimi

Amaç: yayından önce en sık görülen açıkları kapatmak ve tarayıcının sunduğu korumaları açmak. Denetimi koddan yap, varsayımla değil; her bulguda dosya ve satır göster. OWASP Top 10 (2025) maddelerinin kısa kontrol listesi \`references/owasp-top10-2025.md\` dosyasında.

## Önce topla
- Sayfa türleri: statik, üyelikli, ödemeli, yönetim paneli
- Ziyaretçi girdisi alan yerler: formlar, yorumlar, adres parametreleri, dosya yükleme
- Dış betikler ve servisler (analitik, canlı sohbet, harita, yazı tipi, ödeme)
- Sunucu fonksiyonları ve kullandıkları sırlar; barındırma ortamı (Vayra yayını, Vercel, Netlify, kendi sunucusu)

## Denetim adımları
1. **Gizli anahtarlar**: istemci kodunda, HTML'de ve depo geçmişinde API anahtarı, sk_ ile başlayan anahtar, parola ara. Bulunursa anahtarı sağlayıcıda iptal edip yenilemesini söyle; koddan silmek yetmez. Next.js'te NEXT_PUBLIC_ ile başlayan değişkenler tarayıcıya gider.
2. **XSS**: ziyaretçi verisini innerHTML, insertAdjacentHTML, document.write ya da React'te dangerouslySetInnerHTML ile basan yerler. textContent kullan ya da kaçış fonksiyonundan geçir; zengin metin gerekiyorsa DOMPurify gibi bir temizleyici kullan. Bağlantı ve görsel adreslerinde javascript: şemasını reddet.
3. **Erişim denetimi (A01)**: her uç nokta ve tablo kuralı "bu kişi bu kaydı görebilir mi" sorusunu sunucuda yanıtlıyor mu? Adresteki kimlik değiştirilince başkasının kaydı açılıyor mu (IDOR)? Yönetim sayfası yalnız gizlenmiş değil, korunmuş mu?
4. **Enjeksiyon (A05)**: SQL'de parametreli sorgu; kabuk komutuna ve şablon motoruna ham girdi yok; NoSQL süzgecine istemciden nesne geçmiyor.
5. **Yapılandırma (A02)**: hata yanıtında yığın izi yok, varsayılan parola yok, dizin listeleme kapalı. CORS her kaynağa açık değil; kimlikli isteklerde joker kaynak kullanılmıyor.
6. **Tedarik zinciri (A03)**: npm audit ile tara, kilit dosyası depoda, CDN betiklerinde integrity özniteliği, bakımı bırakılmış paket yok, paket adları doğru.
7. **İstek sahteciliği**: çerezle oturum açan formlarda SameSite Lax ya da CSRF belirteci; durum değiştiren işlem GET ile yapılmıyor.
8. **Yönlendirme ve SSRF**: dönüş adresi yalnız aynı site; sunucunun çektiği adres kullanıcıdan geliyorsa izin listesi.
9. **Dosya yükleme**: tür ve boyut sunucuda denetleniyor, dosya adı yeniden üretiliyor, SVG ve HTML betik çalıştıramayacak biçimde sunuluyor.
10. **Hata ve günlük (A09, A10)**: beklenmeyen durumda erişim kapalı kalıyor; giriş ve yetki hataları günlükte; günlükte kişisel veri ve belirteç yok.
11. **Başlıklar**: aşağıdaki seti uygula ve tarayıcıda kontrol et.

## Önerilen başlıklar
\`\`\`http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests
Strict-Transport-Security: max-age=63072000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Cross-Origin-Opener-Policy: same-origin
\`\`\`

- CSP'yi önce Content-Security-Policy-Report-Only olarak yayınla, konsolda kırılan kaynakları tek tek izin listesine ekle, sonra zorunlu yap. Satır içi betik gerekiyorsa her istekte üretilen nonce kullan.
- Analitik, harita ya da ödeme betiği varsa yalnız o alan adını ilgili yönergeye ekle (script-src, connect-src, frame-src).
- frame-ancestors yeterlidir; eski tarayıcılar için X-Frame-Options DENY eklemek zararsız.
- X-XSS-Protection başlığını ekleme; eskidir ve kaldırılmıştır.
- HSTS preload listesine yalnız bütün alt alan adları HTTPS ise başvur; geri almak aylar sürer.
- Next.js'te başlıkları next.config içindeki headers işleviyle, nonce gerekiyorsa middleware ile ver.

\`\`\`js
// next.config.mjs
const guvenlik = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];
export default { async headers() { return [{ source: "/(.*)", headers: guvenlik }]; } };
\`\`\`

## Çıktı
| Önem | Madde | Bulgu | Yer | Düzeltme |
|---|---|---|---|---|
| kritik | A01 | Sipariş uç noktası sahibi denetlemiyor | api/siparis.js:14 | Kaydın uyeId alanını oturumla karşılaştır |

Önem dereceleri: kritik, yüksek, orta, düşük. Kritik ve yüksek bulguları hemen düzelt, sonra raporu güncelle. Test edemediğin maddeyi "denetlenemedi" diye yaz.

## Yapma
- Güvenliği yalnız istemci kontrolüne bırakma.
- CSP'ye 'unsafe-eval' ya da script-src içinde joker ekleyip politikayı anlamsızlaştırma.
- Bulguyu doğrulamadan "site güvenli" deme.
- Sızan anahtarı yalnız koddan silip iptal etmeden bırakma.`,
    dosyalar: [
      { yol: "references/owasp-top10-2025.md", icerik: `# OWASP Top 10 (2025) kısa kontrol listesi

Her madde için web uygulamasında bakılacak somut yerler.

## A01 Bozuk erişim denetimi
- Her uç nokta ve tablo kuralı yetkiyi sunucuda denetliyor; arayüzde gizlemek yetmez.
- Adresteki ya da gövdedeki kimliği değiştirerek başkasının kaydına ulaşılamıyor (IDOR).
- Sunucunun dışarıya istek attığı yerlerde hedef adres izin listesinden (SSRF bu maddeye katıldı).
- CORS yalnız bilinen kaynaklara açık.

## A02 Güvenlik yapılandırma hataları
- Hata yanıtlarında yığın izi, sürüm bilgisi, iç yol yok.
- Varsayılan hesaplar ve örnek sayfalar kaldırılmış; dizin listeleme kapalı.
- Güvenlik başlıkları (CSP, HSTS, nosniff, Referrer-Policy, Permissions-Policy) ayarlı.

## A03 Yazılım tedarik zinciri hataları
- Kilit dosyası depoda; bağımlılıklar düzenli taranıyor (npm audit, Dependabot).
- CDN'den yüklenen betiklerde integrity özniteliği; gereksiz üçüncü taraf betik yok.
- Derleme ve yayın hattında gizli anahtarlar korunuyor, paket adları doğru yazılmış (typosquatting).

## A04 Kriptografik hatalar
- Her yerde HTTPS; parolalar Argon2id ya da bcrypt ile özetli.
- Hassas veri (TCKN, sağlık, kart) gerekmedikçe saklanmıyor; saklanıyorsa şifreli.
- Rastgele belirteçler kriptografik üreteçle (crypto.getRandomValues).

## A05 Enjeksiyon
- SQL ve NoSQL sorguları parametreli; kullanıcı girdisi sorgu metnine eklenmiyor.
- HTML'e basılan ziyaretçi verisi kaçışlı (XSS); kabuk komutu ve şablon motoruna ham girdi yok.

## A06 Güvensiz tasarım
- Fiyat, indirim, stok, yetki gibi kararlar istemciden alınmıyor.
- Kötüye kullanım senaryoları düşünülmüş: kupon tekrar kullanımı, toplu kayıt, sınırsız SMS gönderimi.

## A07 Kimlik doğrulama hataları
- Deneme sınırı, sızmış parola kontrolü, iki adımlı doğrulama seçeneği.
- Oturum çerezi HttpOnly, Secure, SameSite; girişte oturum kimliği yenileniyor.
- Hata mesajı hesabın varlığını ele vermiyor.

## A08 Yazılım ve veri bütünlüğü hataları
- Webhook ve dış veri imzayla doğrulanıyor.
- Güvenilmeyen veri doğrudan nesneye çevrilip çalıştırılmıyor (güvensiz seri çözme, eval).

## A09 Güvenlik günlüğü ve uyarı hataları
- Giriş, yetki hatası, ödeme ve yönetim işlemleri günlükte; şüpheli artışta uyarı var.
- Günlükte parola, token, kart ve kişisel veri yok.

## A10 İstisnai durumların yanlış ele alınması
- Hata olduğunda sistem güvenli tarafta kalıyor (fail closed): yetki denetimi hata verirse erişim yok.
- Zaman aşımı, eksik alan, beklenmeyen tür ve kaynak tükenmesi durumları ele alınmış; hata yutulmuyor.
` },
    ],
  },
  {
    id: "birim-ve-uctan-uca-test", ad: "birim-ve-uctan-uca-test", baslik: "Birim ve uçtan uca test yazımı", kategori: "gelistirme", simge: "/gercek/galeri/soyut8.webp",
    aciklama: "Bir projeye test eklerken, bir hata düzeltmesini testle güvenceye alırken ya da hangi testin yazılacağına karar verirken kullan: test katmanları, Vitest ve node:test ile birim testi, Testing Library ile bileşen testi, Playwright ile masaüstü ve telefon profilinde uçtan uca test, erişilebilir seçiciler, sahte saat ve ağ, sınır değerleri, kararsız testleri önleme ve Vayra tarayici_testi ile akış denemesi. Kullanıcı 'test yaz', 'test ekle', 'bir daha bozulmasın', 'regresyon', 'e2e' ya da 'Playwright' dediğinde kullan.",
    ornekler: ["Sepet hesaplama fonksiyonuma test yaz", "Kayıt akışı için uçtan uca test ekle", "Bu hata bir daha çıkmasın, testle güvenceye al"],
    govde: `# Birim ve uçtan uca test yazımı

Amaç: az ama doğru yerde test. Saf mantığa (fiyat hesabı, doğrulama, tarih biçimi) çok sayıda hızlı birim testi; bozulunca para ya da veri kaybettiren akışlara (kayıt, ödeme, form gönderimi) az sayıda uçtan uca test.

## Önce topla
- Proje türü: statik HTML ve JS, React ya da Next.js, sunucu fonksiyonu
- Kritik akışlar: bozulursa işi durduran 3 ile 5 akış
- Mevcut test aracı ve komutu (package.json içindeki scripts)
- Hata düzeltmesiyse: hatayı yeniden üreten adımlar

## Hangi test
| Katman | Araç | Ne test edilir | Hız |
|---|---|---|---|
| Birim | Vitest ya da node:test | Saf fonksiyonlar, sınır değerleri | milisaniye |
| Bileşen | Testing Library | Kullanıcının gördüğü davranış | saniyenin altında |
| Uçtan uca | Playwright | Gerçek tarayıcıda tam akış | saniyeler |

Vayra Build içinde akışı yazdıktan sonra \`tarayici_testi\` aracıyla gerçekçi Türkçe verilerle dene; bağımsız projede Playwright testi yaz.

## Adımlar
1. **Davranışı adlandır**: test adı bir cümledir: "süresi geçmiş indirim kodunda hata gösterir".
2. **Hazırla, çalıştır, doğrula**: her test tek davranışı sınar; doğrulama sayısı az, anlamı net.
3. **Sınır değerlerini seç**: boş, tek eleman, en çok, sıfır, eksi, çok uzun metin, Türkçe harfler (İ ve ı dönüşümü), virgüllü ondalık, gece yarısı, ay sonu, artık yıl, Europe/Istanbul saat dilimi.
4. **Hata düzeltmesinde önce test**: hatayı gösteren ve başarısız olan testi yaz, sonra düzelt, testin geçtiğini gör.
5. **Sınırları sahtele**: ağ, saat ve rastgelelik sahte olur (vi.useFakeTimers, sabit tohum, sahte fetch). Kendi iç fonksiyonlarını sahteleme.
6. **Uçtan uca seçiciler**: öğeleri erişilebilir adıyla bul (getByRole, getByLabel, getByText). CSS sınıfına ve öğe sırasına bağlanma. Sabit bekleme yazma; Playwright doğrulamaları kendisi bekler.
7. **Mobil de dene**: kritik akışı bir telefon cihaz profiliyle de çalıştır.
8. **Çalıştır ve kanıtla**: komutu çalıştır, sonucu özetle; çalıştıramadıysan bunu açıkça yaz.

## Birim testi iskeleti
\`\`\`js
// fiyat.test.js (Vitest)
import { describe, it, expect } from "vitest";
import { sepetToplami } from "./fiyat.js";

describe("sepetToplami", () => {
  it("kuruş yuvarlamasını doğru yapar", () => {
    expect(sepetToplami([{ fiyat: 19.99, adet: 3 }])).toBe(59.97);
  });
  it("boş sepette 0 döner", () => {
    expect(sepetToplami([])).toBe(0);
  });
  it("eksi adedi reddeder", () => {
    expect(() => sepetToplami([{ fiyat: 10, adet: -1 }])).toThrow("Adet");
  });
});
\`\`\`

## Uçtan uca test iskeleti
\`\`\`js
// e2e/bulten.spec.js (Playwright)
import { test, expect } from "@playwright/test";

test("ziyaretçi bültene kayıt olur", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("E-posta").fill("ayse.yilmaz@ornek.com");
  await page.getByRole("button", { name: "Kayıt ol" }).click();
  await expect(page.getByText("Teşekkürler")).toBeVisible();
});

test("hatalı e-postada alanın altında mesaj gösterir", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("E-posta").fill("ayse@");
  await page.getByRole("button", { name: "Kayıt ol" }).click();
  await expect(page.getByText("E-posta adresi ad@alanadi.com biçiminde olmalı")).toBeVisible();
});
\`\`\`

\`\`\`js
// playwright.config.js
import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  use: { baseURL: "http://localhost:3000", locale: "tr-TR", timezoneId: "Europe/Istanbul" },
  projects: [
    { name: "masaustu", use: { ...devices["Desktop Chrome"] } },
    { name: "telefon", use: { ...devices["iPhone 15"] } },
  ],
});
\`\`\`

## Kararsız testleri önleme
- Her test kendi verisini kurar ve temizler; testler sıraya bağlı değil.
- Gerçek ödeme, e-posta ya da SMS servisi çağırma; test modu ya da sahte sunucu kullan.
- Tarih ve saat dilimini sabitle; animasyonları testte kapat.
- Kararsız testi yeniden deneme ayarıyla gizleme; nedenini bul.

## Çıktı
| Dosya | Test adı | Kapsadığı risk |
|---|---|---|

Altına çalıştırma komutunu ve sonucu yaz (geçen ve kalan sayısı).

## Yapma
- Uygulamanın iç durumunu ya da özel fonksiyonlarını test etme; davranışı test et.
- Kalan testi geçirmek için beklenen değeri değiştirme; önce nedeni bul.
- Büyük HTML için anlık görüntü (snapshot) testi yazma.
- Testi çalıştırmadan "testler geçti" deme.`,
    dosyalar: [],
  },
  {
    id: "hata-ayiklama-kok-neden", ad: "hata-ayiklama-kok-neden", baslik: "Hata ayıklama ve kök neden bulma", kategori: "gelistirme", simge: "/gercek/panel/gal-gpt-4.webp",
    aciklama: "Bir hata, çökme, beyaz ekran, konsol hatası, yanlış hesap, ara sıra olan sorun ya da 'dün çalışıyordu bugün çalışmıyor' durumunda kök nedeni sistemli biçimde bulurken kullan: hatayı yeniden üretme, istemci ve sunucu ayrımı, hipotez kurup en ucuz kontrolle eleme, sürüm geçmişinde ikiye bölerek arama, gözlem ve günlük ekleme, en küçük düzeltme, düzeltmeyi kanıtlama ve benzer hataları tarama. Sık görülen belirti ve neden tablosu içerir. Kullanıcı 'çalışmıyor', 'hata veriyor', 'bozuldu', 'neden böyle', 'bug' ya da 'düzelt' dediğinde kullan.",
    ornekler: ["Sitem beyaz ekran veriyor, neden?", "Form gönderilmiyor, sorunu bul", "Önizlemede çalışıyor ama yayında çalışmıyor"],
    govde: `# Hata ayıklama ve kök neden bulma

Amaç: belirtiyi değil nedeni düzeltmek. Tahminle kod değiştirmek yerine kanıt topla; her değişiklik bir hipotezi sınar.

## Önce topla
- Beklenen davranış ve gerçekleşen davranış, ikisi de tek cümle
- Tam hata metni, konsol ve ağ sekmesi çıktısı, sunucu fonksiyonu günlüğü
- Nerede: hangi sayfa, tarayıcı, cihaz; önizleme mi yayın mı; üye mi misafir mi
- Ne zaman başladı ve o sırada ne değişti (son düzenleme, sürüm, veri, sır)
- Her seferinde mi, ara sıra mı oluyor

## Adımlar
1. **Yeniden üret**: hatayı gösteren en kısa adım listesini bul. Üretemiyorsan önce gözlem ekle (günlük, genel hata yakalayıcı), tahmin yürütme.
2. **Sınırla**: sorun istemcide mi sunucuda mı, kodda mı veride mi? Ağ sekmesinde isteğin gidip gitmediğine, durum koduna ve yanıt gövdesine bak. Aynı işlem başka veriyle çalışıyor mu?
3. **Hipotezleri yaz**: olası 2 ile 4 neden ve her biri için onu doğrulayacak ya da çürütecek en ucuz kontrol. En olası ve en ucuz kontrolle başla.
4. **İkiye bölerek ara**: ne zaman bozulduğu bilinmiyorsa sürüm geçmişini ikiye bölerek tara (git bisect ya da Vayra sürümleri). Hangi kodda olduğu bilinmiyorsa kodun yarısını devre dışı bırakarak daralt.
5. **Kök nedeni adlandır**: "neden" sorusunu art arda sor. Liste neden boş? Çünkü alan adı değişmiş. Neden fark edilmedi? Çünkü hata yakalanıp yutuluyordu. Düzeltme en derin makul nedene yapılır; gerekiyorsa iki düzeltme (alan adı ve hata gösterimi).
6. **En küçük düzeltmeyi yap**: tek değişiklik, sonra yeniden üretme adımlarını tekrar çalıştır. Mümkünse hatayı yakalayan bir test ekle (birim-ve-uctan-uca-test yeteneği).
7. **Benzerlerini ara**: aynı kalıp başka dosyada da var mı, metin aramasıyla tara.
8. **Temizle**: geçici günlükleri ve deneme kodlarını kaldır.

## Sık görülen kök nedenler
| Belirti | Önce şuna bak |
|---|---|
| Beyaz ekran | Konsoldaki ilk hata (sonrakiler çoğu zaman onun sonucu), betik yükleme sırası |
| "undefined" özelliği okunamıyor | Veri gelmeden çizim, alan adı değişikliği, boş liste, yanlış iç içe yol |
| Önizlemede çalışıyor, yayında çalışmıyor | Göreli ve mutlak yollar, dosya adında büyük küçük harf, eksik sır, CSP, önbellek |
| Ara sıra oluyor | Eksik await ve yarış durumu, önbellek, saat dilimi, sayfalama sınırı, hız sınırı |
| Yanlış toplam | Ondalık yuvarlama, metin ile sayının toplanması, Türkçe ondalık virgül |
| Türkçe harf bozuk | Dosya ya da yanıt UTF-8 değil; toUpperCase yerine toLocaleUpperCase("tr-TR") |
| CORS hatası | Sunucu yanıt başlığı, yanlış adres, hata yanıtının başlıksız dönmesi |
| Form iki kez gönderiliyor | Düğme pasif yapılmıyor, olay dinleyicisi iki kez bağlanmış |
| Tıklama çalışmıyor | Üstte görünmez bir katman, öğe sonradan eklenmiş (olay devri gerekir), pointer-events |
| Mobilde bozuk | Görünüm alanı meta etiketi, 100vh yerine 100dvh, dokunma olayları, iOS Safari sürümü |

## Gözlem ekleme
\`\`\`js
// Önekli, geçici günlük: kişisel veri ve belirteç yazma
console.log("[sepet] toplam hesaplanıyor", { kalemSayisi: sepet.length, ilk: sepet[0] });

// Yakalanmamış hataları görünür yap
window.addEventListener("error", (e) => console.error("[genel]", e.message, e.filename + ":" + e.lineno));
window.addEventListener("unhandledrejection", (e) => console.error("[promise]", e.reason));
\`\`\`

Sunucu fonksiyonunda \`console.log\` çıktısı Bulut günlüğünde görünür; istek gövdesinin yalnız gerekli alanlarını yaz.

## Çıktı
\`\`\`text
Belirti:     Sepet sayfasında toplam 0 TL görünüyor
Kök neden:   urunler tablosunda "fiyat" alanı "birimFiyat" olarak yeniden adlandırılmış
Kanıt:       Ağ yanıtında fiyat alanı yok; birimFiyat var
Düzeltme:    sepet.js satır 42 alan adı güncellendi; eksik alan için hata gösterimi eklendi
Doğrulama:   3 ürünlü sepette toplam doğru (412,50 TL); boş sepette uyarı görünüyor
Önlem:       sepetToplami için birim testi eklendi
\`\`\`

## Yapma
- Hatayı try ve catch ile yutup sessizce geçme.
- Aynı anda birden çok şeyi değiştirme; hangisinin düzelttiği bilinmez.
- Kanıt olmadan "önbellek sorunu" ya da "tarayıcı hatası" deme.
- Düzeldiğini denemeden bildirme.
- Belirtiyi gizleyen yama yapma (boş değeri sessizce 0 saymak gibi).`,
    dosyalar: [],
  },
  {
    id: "kod-incelemesi", ad: "kod-incelemesi", baslik: "Kod incelemesi kontrol listesi", kategori: "gelistirme", simge: "/gercek/galeri/3d7.webp",
    aciklama: "Yazılmış bir kodu, değişikliği (diff), çekme isteğini (pull request) ya da yapay zekânın ürettiği bir projeyi yayından önce gözden geçirirken kullan: amaca uygunluk, doğruluk ve sınır durumları, hata yönetimi, güvenlik, veri ve göç uyumu, performans, erişilebilirlik, sadelik, okunabilirlik ve test kapsamı için dosya ve satır gösteren, önem dereceli (kritik, yüksek, orta, öneri) ve doğrulanmış bulgular üretir. Kullanıcı 'kodu incele', 'review', 'kontrol et', 'kod temiz mi', 'eksik var mı' ya da 'yayına hazır mı' dediğinde kullan.",
    ornekler: ["Projemin kodunu incele", "Son değişikliklerde hata var mı bak", "Bu kodu yayına almadan önce gözden geçir"],
    govde: `# Kod incelemesi kontrol listesi

Amaç: gerçek hataları bulmak, zevk tartışması yapmamak. Önce davranışı bozan sorunlar, sonra güvenlik ve veri, en son okunabilirlik.

## Önce topla
- Değişikliğin amacı: hangi sorunu çözüyor ya da hangi özelliği ekliyor
- Değişen dosyalar ve etkilenen akışlar
- Projenin kuralları: dil, biçimlendirici, adlandırma, klasör düzeni
- Kullanıcı yalnız rapor mu istiyor, düzeltme de mi

## İnceleme sırası
1. **Amaç tutuyor mu**: kod söylenen işi gerçekten yapıyor mu? Eksik kalan durum var mı: boş liste, yükleniyor, hata yanıtı, çevrimdışı, yetkisiz kullanıcı?
2. **Doğruluk**: sınır değerleri, null ve undefined, eksik await, yarış durumu, ondalık para hesabı, saat dilimi, Türkçe büyük küçük harf, sıfıra bölme, dizinin ilk ve son elemanı.
3. **Hata yönetimi**: hata kullanıcıya anlamlı mesajla gösteriliyor mu, yutuluyor mu? Yeniden denemede çift kayıt oluşuyor mu?
4. **Güvenlik**: ziyaretçi verisi kaçışsız HTML'e basılıyor mu, yetki sunucuda mı denetleniyor, sır istemciye sızıyor mu, fiyat istemciden mi alınıyor? Ayrıntı için web-guvenlik-basliklari yeteneği.
5. **Veri**: şema ve erişim kuralları kodla uyumlu mu, göç gerekiyor mu, eski kayıtlar yeni kodla çalışıyor mu (veri-semasi-goc yeteneği)?
6. **Performans**: döngü içinde ağ isteği (N artı 1), gereksiz yeniden çizim, sınırsız liste, sıkıştırılmamış büyük görsel, kaydırma olayında ağır iş.
7. **Erişilebilirlik**: düğme yerine div, eksik label, odak kaybı, yetersiz kontrast, yalnız renkle verilen bilgi.
8. **Sadelik**: kullanılmayan kod, kopyala yapıştır tekrar, gereksiz soyutlama, tek yerde kullanılan yardımcı. Daha kısa ve açık bir yol var mı?
9. **Okunabilirlik**: adlar işi anlatıyor mu, sihirli sayılar adlandırılmış sabit mi, yorumlar "ne" yerine "neden" anlatıyor mu?
10. **Test**: değişen davranış için test var mı; test, kod bozulduğunda gerçekten başarısız olur mu?

## Bulgu biçimi
\`\`\`text
[kritik] api/siparis.js:42
Sorun:     Toplam, istemcinin gönderdiği "tutar" alanından alınıyor
Etki:      Ziyaretçi tutarı 1 TL yapıp ödeme başlatabilir
Düzeltme:  Toplamı urunler tablosundaki fiyat ve adetten sunucuda hesapla
\`\`\`

Önem dereceleri:
- **kritik**: veri kaybı, güvenlik açığı, ödeme ya da giriş bozuk
- **yüksek**: yaygın senaryoda yanlış davranış
- **orta**: sınır durumda hata, belirgin performans sorunu
- **öneri**: okunabilirlik ve sadelik

## Kurallar
- Her bulguyu kodda doğrula: satırı oku, çağıranı bul, girdiyi izle. Emin değilsen "doğrulanmadı" diye işaretle.
- Bulguları önem sırasıyla ver; kritik yoksa açıkça "kritik bulgu yok" yaz.
- Biçim ve stil için proje kuralı yoksa yorum yapma; bunu biçimlendiriciye bırak.
- Kişiyi değil davranışı anlat: "bu fonksiyon boş listede çöker".
- Her bulguya uygulanabilir bir düzeltme yaz; gerekiyorsa kısa kod parçası ekle.
- Kullanıcı düzeltme istediyse kritik ve yüksek bulguları düzelt, testleri çalıştır, raporu güncelle.

## Özet
| Önem | Sayı |
|---|---|
| kritik | 0 |
| yüksek | 2 |
| orta | 1 |
| öneri | 3 |

Ardından en çok üç cümlelik değerlendirme: yayına hazır mı; değilse önce neyin düzelmesi gerekiyor.

## Yapma
- Gerçek hatayı yüzlerce küçük öneri arasına gömme.
- Değişiklik dışındaki eski kodu baştan yazmayı önerme; ayrı iş olarak not et.
- Çalıştırmadığın testin geçtiğini söyleme.
- Doğrulamadığın bulguyu kesinmiş gibi yazma.`,
    dosyalar: [],
  },
  {
    id: "pwa-cevrimdisi", ad: "pwa-cevrimdisi", baslik: "PWA ve çevrimdışı çalışma", kategori: "web", simge: "/gercek/panel/gal-seedance-4.webp",
    aciklama: "Bir siteyi ya da web uygulamasını ana ekrana eklenebilen ve çevrimdışı açılabilen bir PWA'ya dönüştürürken kullan: web app manifest, maskable simgeler, service worker kaydı, önbellek stratejileri (önce önbellek, önce ağ, eskiyi göster ve arka planda yenile), çevrimdışı sayfası, yeni sürüm bandı ve güncelleme, IndexedDB ile çevrimdışı form kuyruğu, kurulum düğmesi, iOS ve Android farkları. Hazır service worker iskeleti içerir. Kullanıcı 'uygulama gibi olsun', 'ana ekrana ekle', 'internetsiz çalışsın', 'PWA' ya da 'service worker' dediğinde kullan.",
    ornekler: ["Sitemi telefona yüklenebilir uygulama yap", "İnternet yokken de açılsın", "Yeni sürüm gelince kullanıcıya haber ver"],
    govde: `# PWA ve çevrimdışı çalışma

Amaç: site ana ekrana eklenir, kendi penceresinde açılır, bağlantı yokken de anlamlı bir şey gösterir ve yeni sürümü güvenle alır. Hazır service worker iskeleti \`references/sw.js\` dosyasında.

## Önce topla
- Çevrimdışıyken ne gerekiyor: yalnız açılış ekranı mı, son görülen veriler mi, çevrimdışı kayıt mı
- Simge için kare logo (en az 512 piksel, kenarlarda boşluklu)
- Tema rengi ve arka plan rengi (açık ve koyu tema varsa ikisi de)
- Bildirim isteniyor mu (push-bildirim-stratejisi yeteneği)

## Adımlar
1. **Manifest**: kök klasöre manifest.webmanifest koy ve her sayfanın head bölümünde bağla (aşağıdaki kod). name, short_name (12 karakter civarı), start_url, scope, display standalone, renkler ve lang tr.
2. **Simgeler**: 192 ve 512 piksel PNG; ayrıca purpose değeri maskable olan 512 piksel sürüm (logo ortadaki yüzde 80'lik güvenli alanda). iOS için 180 piksel apple-touch-icon.
3. **Service worker kaydı**: sayfa yüklendikten sonra kaydet. Yalnız HTTPS'te ve localhost'ta çalışır; Vayra önizlemesindeki iframe'de çalışmaz, yayındaki adreste dene.
4. **Önbellek stratejisini seç**:

| İçerik | Strateji |
|---|---|
| Uygulama kabuğu (HTML, CSS, JS, simgeler) | Kurulumda önbelleğe al; önbellek adında sürüm |
| Sayfa gezintisi | Önce ağ; ağ yoksa önbellek; o da yoksa çevrimdışı sayfası |
| Görsel ve yazı tipi | Önce önbellek; dosya sayısı sınırlı |
| Herkese açık API verisi (menü, ürünler) | Eskiyi hemen göster, arka planda yenile |
| Giriş, ödeme, sepet, kişiye özel veri | Asla önbelleğe alma |

5. **Çevrimdışı sayfası**: cevrimdisi.html; neyin çalıştığını söyler ve "Tekrar dene" düğmesi sunar.
6. **Güncelleme akışı**: her yayında SURUM değerini artır; activate olayında eski önbellekler silinir. Yeni service worker beklerken "Yeni sürüm hazır" bandı göster; kullanıcı onaylayınca bekleyen çalışana "guncelle" mesajı gönder ve controllerchange olayında sayfayı bir kez yenile.
7. **Çevrimdışı yazma**: form verisini IndexedDB'de kuyruğa al, online olayında gönder, kullanıcıya "Bağlantı gelince gönderilecek" de. Çakışma kuralını açıkça seç (son yazan kazanır ya da sunucu kazanır).
8. **Kurulum çağrısı**: Chromium tarayıcılarda beforeinstallprompt olayını sakla; kullanıcı değer gördükten sonra kendi "Uygulamayı yükle" düğmenle göster. iOS Safari'de bu olay yok; "Paylaş, sonra Ana Ekrana Ekle" yönergesini göster.
9. **Kalıcı depolama**: navigator.storage.persist() iste; kullanılmayan PWA verisi sistem tarafından silinebilir, kritik veriyi sunucuda da tut.

## Kod
\`\`\`json
{
  "name": "Lumen Kahve",
  "short_name": "Lumen",
  "start_url": "/?kaynak=pwa",
  "scope": "/",
  "display": "standalone",
  "background_color": "#0f1115",
  "theme_color": "#0f1115",
  "lang": "tr",
  "icons": [
    { "src": "/simge-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/simge-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/simge-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
\`\`\`

\`\`\`html
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#0f1115">
<link rel="apple-touch-icon" href="/simge-180.png">
<script>
  if ("serviceWorker" in navigator) {
    addEventListener("load", async () => {
      const kayit = await navigator.serviceWorker.register("/sw.js");
      kayit.addEventListener("updatefound", () => {
        const yeni = kayit.installing;
        yeni.addEventListener("statechange", () => {
          if (yeni.state === "installed" && navigator.serviceWorker.controller) yeniSurumBandiGoster(() => yeni.postMessage("guncelle"));
        });
      });
      let yenilendi = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => { if (!yenilendi) { yenilendi = true; location.reload(); } });
    });
  }
</script>
\`\`\`

## Kontrol
- Chrome geliştirici araçları, Application sekmesi: manifest hatasız, service worker etkin, önbellekte beklenen dosyalar.
- Network sekmesinde Offline seçip bütün sayfaları gez; çevrimdışı sayfası görünmeli.
- Lighthouse 2024'ten beri ayrı PWA puanı vermiyor; kurulabilirliği bu listeyle elle denetle.
- iPhone'da ana ekrana ekleyip uçak modunda aç.

## Yapma
- HTML'i yalnız önbellekten sunup güncellemeyi sonsuza dek engelleme.
- Kişiye özel ya da ödeme yanıtlarını önbelleğe alma.
- İlk ziyarette hemen kurulum ya da bildirim izni isteme.
- sw.js dosyasını uzun süreli önbellek başlığıyla sunma.`,
    dosyalar: [
      { yol: "references/sw.js", icerik: `// sw.js: sitenin kök klasörüne koy (kapsamı bulunduğu klasördür). Her yayında SURUM değerini artır.
var SURUM = "v1";
var KABUK = "kabuk-" + SURUM;
var CALISMA = "calisma-" + SURUM;
var KABUK_DOSYALARI = ["/", "/index.html", "/stil.css", "/uygulama.js", "/cevrimdisi.html", "/simge-192.png"];
// Yalnız herkese açık ve kişiye özel olmayan okuma uç noktaları. Giriş, ödeme, sepet ASLA buraya yazılmaz.
var ONBELLEK_API = ["/api/menu", "/api/urunler"];
var EN_COK_DOSYA = 80;

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(KABUK).then(function (c) { return c.addAll(KABUK_DOSYALARI); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (adlar) {
      return Promise.all(adlar.filter(function (a) { return a !== KABUK && a !== CALISMA; }).map(function (a) { return caches.delete(a); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Sayfadaki "Yenile" düğmesi: kayit.waiting.postMessage("guncelle")
self.addEventListener("message", function (e) { if (e.data === "guncelle") self.skipWaiting(); });

function sinirla(onbellek) {
  onbellek.keys().then(function (anahtarlar) {
    if (anahtarlar.length > EN_COK_DOSYA) onbellek.delete(anahtarlar[0]).then(function () { sinirla(onbellek); });
  });
}

function cevrimdisiYanit() {
  return new Response(JSON.stringify({ hata: "Bağlantı yok" }), { status: 503, headers: { "content-type": "application/json" } });
}

self.addEventListener("fetch", function (e) {
  var istek = e.request;
  if (istek.method !== "GET") return;
  var url = new URL(istek.url);
  if (url.origin !== location.origin) return;

  // API: eskiyi hemen göster, arka planda yenile (stale-while-revalidate)
  if (ONBELLEK_API.indexOf(url.pathname) !== -1) {
    e.respondWith(caches.open(CALISMA).then(function (c) {
      return c.match(istek).then(function (eski) {
        var yeni = fetch(istek).then(function (y) { if (y.ok) c.put(istek, y.clone()); return y; })
          .catch(function () { return eski || cevrimdisiYanit(); });
        return eski || yeni;
      });
    }));
    return;
  }
  if (url.pathname.indexOf("/api/") === 0) return; // diğer API istekleri doğrudan ağa

  // Sayfa gezintisi: önce ağ, yoksa önbellek, o da yoksa çevrimdışı sayfası
  if (istek.mode === "navigate") {
    e.respondWith(fetch(istek).then(function (y) {
      var kopya = y.clone();
      caches.open(CALISMA).then(function (c) { c.put(istek, kopya); sinirla(c); });
      return y;
    }).catch(function () {
      return caches.match(istek).then(function (k) { return k || caches.match("/cevrimdisi.html"); });
    }));
    return;
  }

  // Görsel, yazı tipi, CSS, JS: önce önbellek
  e.respondWith(caches.match(istek).then(function (k) {
    return k || fetch(istek).then(function (y) {
      if (y.ok && /\\.(png|jpe?g|webp|avif|svg|woff2|css|js)$/.test(url.pathname)) {
        var kopya = y.clone();
        caches.open(CALISMA).then(function (c) { c.put(istek, kopya); sinirla(c); });
      }
      return y;
    });
  }));
});
` },
    ],
  },
  {
    id: "karanlik-mod-belirtecler", ad: "karanlik-mod-belirtecler", baslik: "Karanlık mod ve tasarım belirteçleri", kategori: "web", simge: "/gercek/galeri/soyut11.webp",
    aciklama: "Bir siteye ya da uygulamaya karanlık tema eklerken, açık ve koyu temayı tek kaynaktan yöneten anlamsal tasarım belirteçleri (CSS değişkenleri, Tailwind v4 teması) kurarken veya renk çiftlerinin WCAG kontrastını ölçerken kullan: prefers-color-scheme, color-scheme, light-dark(), Açık, Koyu ve Sistem seçici, seçimi hatırlama, ilk yüklemede yanıp sönmeyi önleme, theme-color, logo ve simge uyarlaması. Kontrast oranı hesaplayıp düzeltilmiş renk öneren betik içerir. Kullanıcı 'dark mode', 'karanlık tema', 'gece modu', 'tema değiştir', 'renk değişkenleri' ya da 'kontrast yetersiz' dediğinde kullan.",
    ornekler: ["Siteme karanlık mod ekle", "Renklerimi tasarım belirteçlerine çevir", "Bu renklerin kontrastı yeterli mi?"],
    govde: `# Karanlık mod ve tasarım belirteçleri

Amaç: renkleri değeriyle değil anlamıyla (zemin, yüzey, metin, vurgu, sınır, hata) adlandırıp açık ve koyu temayı tek yerden yönetmek. Marka renklerinden ilk paleti çıkarmak marka-kilavuzu yeteneğinin işi; bu yetenek tema katmanını ve karanlık modu kurar.

## Önce topla
- Marka ve vurgu renkleri; CSS içindeki sabit renklerin listesi (taranır)
- Varsayılan tema: sistem tercihine mi uyacak, hep açık mı
- Kullanıcı seçimi gerekiyor mu (Açık, Koyu, Sistem)
- Kullanılan yapı: düz CSS, Tailwind v4, CSS-in-JS

## Adımlar
1. **Ham palet**: nötr ölçek (50 ile 950 arası) ve vurgu ölçeği. Ham renkler yalnız belirteç dosyasında görünür.
2. **Anlamsal belirteçler**: bileşenler yalnız bunları kullanır: zemin, yuzey, yuzey-ust, metin, metin-ikincil, sinir, sinir-alan, vurgu, vurgu-uzeri, basari, uyari, hata, odak. Süs ayırıcı çizgi kontrast şartı taşımaz, ama form alanının sınırı 3:1 ister; ikisini ayrı belirteç yap.
3. **Koyu temayı ayrıca tasarla**: renkleri ters çevirme. Zemin saf siyah değil koyu gri ya da hafif renkli; uzun metin saf beyaz değil hafif kırık beyaz. Derinliği gölgeyle değil yüzey açıklığıyla ver: yukarıdaki katman biraz daha açık. Vurgu rengini koyu zeminde bir ton açık ve biraz daha az doygun kullan.
4. **Tarayıcıya bildir**: color-scheme özelliği form öğelerini, kaydırma çubuklarını ve light-dark() işlevini temaya uydurur. theme-color meta etiketini iki tema için ayrı ver.
5. **Seçim ve hatırlama**: seçim localStorage'da; html öğesinde data-tema özniteliği. "Sistem" seçiliyse öznitelik yok, tarayıcı tercihi geçerli.
6. **Yanıp sönmeyi önle**: temayı uygulayan küçük betik head içinde, CSS bağlantısından önce ve satır içi çalışır.
7. **Görseller**: logonun koyu zemin sürümü (picture öğesi ve prefers-color-scheme), SVG simgelerde currentColor, fotoğraflarda gerekirse hafif parlaklık düşürme.
8. **Kontrastı ölç**: her metin ve zemin çiftini iki temada ölç. Normal metin en az 4.5:1, büyük metin ve arayüz öğeleri (sınır, simge, odak halkası) en az 3:1.

## İskelet
\`\`\`css
:root {
  color-scheme: light dark;
  --zemin: light-dark(#ffffff, #0f1115);
  --yuzey: light-dark(#f5f6f8, #171a21);
  --yuzey-ust: light-dark(#ffffff, #1f232c);
  --metin: light-dark(#14171f, #e6e8ec);
  --metin-ikincil: light-dark(#5b6270, #a1a8b5);
  --sinir: light-dark(#e3e6eb, #2a2f3a);        /* süs ayırıcı */
  --sinir-alan: light-dark(#8b919c, #6b7280);   /* form alanı sınırı, 3:1 */
  --vurgu: light-dark(#0e7490, #22d3ee);
  --vurgu-uzeri: light-dark(#ffffff, #06232b);
  --hata: light-dark(#b42318, #f97066);
  --odak: light-dark(#0e7490, #67e8f9);
}
:root[data-tema="acik"] { color-scheme: light; }
:root[data-tema="koyu"] { color-scheme: dark; }
body { background: var(--zemin); color: var(--metin); }
.dugme-birincil { background: var(--vurgu); color: var(--vurgu-uzeri); }
input, select, textarea { border: 1px solid var(--sinir-alan); background: var(--yuzey-ust); color: var(--metin); }
:focus-visible { outline: 2px solid var(--odak); outline-offset: 2px; }
\`\`\`

\`\`\`html
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0f1115">
<script>
  (function () {
    var t = localStorage.getItem("tema");
    if (t === "acik" || t === "koyu") document.documentElement.dataset.tema = t;
  })();
</script>
\`\`\`

light-dark() 2024'ten beri bütün güncel tarayıcılarda çalışır. Daha eski tarayıcı desteği gerekiyorsa aynı değişkenleri bir kez :root içinde açık değerlerle, bir kez de prefers-color-scheme dark medya sorgusu ve data-tema koyu seçicisinde koyu değerlerle tanımla.

Tailwind v4'te belirteçleri tema değişkenine bağla; böylece bg-zemin ve text-metin gibi sınıflar iki temada da doğru renge döner:
\`\`\`css
@import "tailwindcss";
@theme inline {
  --color-zemin: var(--zemin);
  --color-metin: var(--metin);
  --color-vurgu: var(--vurgu);
}
@custom-variant dark (&:where([data-tema="koyu"], [data-tema="koyu"] *));
\`\`\`

## Betik
\`scripts/karanlik-mod-belirtecler.js\` renk çiftlerinin WCAG 2 kontrast oranını hesaplar ve geçmeyen çift için eşiği geçen en yakın yazı rengini önerir:

\`\`\`json
{ "ciftler": [
  { "ad": "metin, koyu zemin", "on": "#e6e8ec", "arka": "#0f1115" },
  { "ad": "birincil düğme, koyu", "on": "#06232b", "arka": "#22d3ee" },
  { "ad": "ikincil metin, açık", "on": "#9aa0aa", "arka": "#ffffff" },
  { "ad": "giriş kutusu sınırı", "on": "#8b919c", "arka": "#ffffff", "arayuz": true }
] }
\`\`\`

Renkler #rgb, #rrggbb ya da rgb() biçiminde verilir; buyuk true ise büyük metin, arayuz true ise 3:1 eşiği kullanılır. Dönüş: her çift için oran, aa, aaa ve geçmeyenlerde oneri ile oneriOrani.

## Yapma
- Bileşende sabit renk kodu kullanma; her yerde belirteç.
- Koyu temayı filter invert ile üretme.
- Koyu temada saf siyah zemin üstüne saf beyaz uzun metin koyma.
- Temayı yalnız sayfa yüklendikten sonra uygulama; ilk karede yanıp söner.
- Yalnız renge dayalı durum gösterme; simge ya da metin de ekle.`,
    dosyalar: [
      { yol: "scripts/karanlik-mod-belirtecler.js", icerik: `// Renk çiftlerinin WCAG 2 kontrast oranını hesaplar; geçmeyen çiftler için yazı rengini
// zemine göre koyulaştırıp ya da açıp eşiği geçen en yakın rengi önerir.
// Girdi: { ciftler: [ { ad, on, arka, buyuk, arayuz } ] }  renkler: #rgb, #rrggbb, #rrggbbaa ya da rgb(r, g, b)
module.exports = function (girdi, vayra) {
  var ciftler = (girdi && girdi.ciftler) || [];

  function coz(renk) {
    var s = String(renk).trim().toLowerCase(), m;
    if ((m = /^#([0-9a-f]{3})$/.exec(s))) return [0, 1, 2].map(function (i) { return parseInt(m[1][i] + m[1][i], 16); });
    if ((m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/.exec(s))) return [0, 2, 4].map(function (i) { return parseInt(m[1].substr(i, 2), 16); });
    if ((m = /^rgba?\\(\\s*(\\d+)[\\s,]+(\\d+)[\\s,]+(\\d+)/.exec(s))) return [+m[1], +m[2], +m[3]];
    return null;
  }
  function hex(rgb) {
    return "#" + rgb.map(function (v) { var h = Math.round(Math.max(0, Math.min(255, v))).toString(16); return h.length < 2 ? "0" + h : h; }).join("");
  }
  function parlaklik(rgb) {
    var c = rgb.map(function (v) { v = v / 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function oran(a, b) {
    var l1 = parlaklik(a), l2 = parlaklik(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function karistir(rgb, hedef, t) {
    return rgb.map(function (v, i) { return v + (hedef[i] - v) * t; });
  }

  var sonuclar = ciftler.map(function (c) {
    var on = coz(c.on), arka = coz(c.arka);
    if (!on || !arka) return { ad: c.ad || String(c.on) + " / " + String(c.arka), hata: "Renk okunamadı: " + (!on ? c.on : c.arka) };
    var o = oran(on, arka);
    var esik = c.arayuz || c.buyuk ? 3 : 4.5;
    var sonuc = {
      ad: c.ad || c.on + " / " + c.arka,
      on: hex(on), arka: hex(arka),
      oran: Math.round(o * 100) / 100,
      esik: esik,
      aa: o >= esik,
      aaa: c.arayuz ? null : o >= (c.buyuk ? 4.5 : 7)
    };
    if (!sonuc.aa) {
      // Zemin koyuysa yazıyı beyaza, açıksa siyaha doğru adım adım kaydır.
      var hedef = parlaklik(arka) < 0.18 ? [255, 255, 255] : [0, 0, 0];
      for (var t = 0.02; t <= 1.0001; t += 0.02) {
        var aday = karistir(on, hedef, t).map(Math.round);
        if (oran(aday, arka) >= esik) { sonuc.oneri = hex(aday); sonuc.oneriOrani = Math.round(oran(aday, arka) * 100) / 100; break; }
      }
      if (!sonuc.oneri) sonuc.not = "Bu zeminde yazı rengini değiştirmek yetmiyor; zemini değiştirin.";
    }
    return sonuc;
  });

  var gecmeyen = sonuclar.filter(function (s) { return s.aa === false; }).length;
  return {
    sonuclar: sonuclar,
    ozet: gecmeyen ? gecmeyen + " çift AA eşiğinin altında" : "Bütün çiftler AA eşiğini geçiyor"
  };
};
` },
    ],
  },
  {
    id: "tarayici-oyun-dongusu", ad: "tarayici-oyun-dongusu", baslik: "Tarayıcı oyunu döngüsü ve oyun hissi", kategori: "gelistirme", simge: "/gercek/galeri/3d11.webp",
    aciklama: "Canvas ya da DOM ile tarayıcıda çalışan 2D oyun (platform, sonsuz koşu, bulmaca, nişancı, tuğla kırma, yılan, arcade) yazarken veya var olan oyunun akıcılığını ve hissini iyileştirirken kullan: requestAnimationFrame ile sabit adımlı güncelleme ve ara değerli çizim, yüksek yenileme hızlı ekranlarda aynı hız, durum makinesi, klavye ve dokunma girdisi, çarpışma, coyote time ve zıplama tamponu, vuruş donması, ekran sarsıntısı, ses, skor kaydı, mobil kontroller ve performans. Çalışan oyun iskeleti içerir. Kullanıcı 'oyun yap', 'canvas', 'oyun kasıyor', 'oyun çok hızlı', 'kontroller kötü' ya da 'oyun hissi' dediğinde kullan.",
    ornekler: ["Telefonda oynanan bir zıplama oyunu yap", "Oyunum 144 Hz ekranda çok hızlı gidiyor", "Oyunun hissini daha tatmin edici yap"],
    govde: `# Tarayıcı oyunu döngüsü ve oyun hissi

Amaç: her ekranda aynı hızda akan, girdiye anında tepki veren ve oynaması keyifli bir oyun. Mantık sabit adımda güncellenir, çizim her karede yapılır. Çalışan tam iskelet \`references/oyun-dongusu.js\` dosyasında.

## Önce topla
- Tür ve tek cümlelik çekirdek döngü ("zıpla, engelden kaç, altın topla")
- Hedef cihaz: masaüstü klavye, mobil dokunma ya da ikisi
- Bir oturumun süresi ve zorluğun nasıl artacağı
- Ortak skor tablosu gerekiyor mu (vayra.veri ile "skorlar" tablosu)

## Adımlar
1. **Durum makinesi**: menü, oyunda, duraklatıldı, bitti. Her durumun kendi güncelleme ve çizim davranışı; durum geçişleri tek fonksiyonda.
2. **Sabit adımlı döngü**: requestAnimationFrame süresini biriktir, mantığı saniyede 60 sabit adımda güncelle, çizimde son iki adım arasını ara değerle. 120 ve 144 Hz ekranlarda oyun hızlanmaz, 30 FPS'e düşen telefonda yavaşlamaz.
3. **Süre sınırı**: sekme arka plandan dönünce dev bir süre farkı gelir; tek karede en çok 250 ms işle. visibilitychange olayında otomatik duraklat.
4. **Keskin tuval**: iç çözünürlük devicePixelRatio ile çarpılır, CSS boyutu ayrı ayarlanır. Mantık sabit sanal boyutta (360 ile 640 gibi) çalışır, ekrana ölçeklenir. Piksel sanatında imageSmoothingEnabled kapalı.
5. **Girdi**: tuş durumlarını bir kümede tut (keydown ekler, keyup siler) ve güncellemede oku. Ok tuşları ve boşluk sayfayı kaydırmasın. Dokunmada pointer olayları, tuvalde touch-action none ve en az 48 piksellik ekran düğmeleri.
6. **Çarpışma**: dikdörtgenlerde eksen hizalı kutu (AABB), dairelerde uzaklığın karesi. Çok nesnede ızgaraya böl. Hızlı nesnede adımı bölerek duvarın içinden geçmeyi önle. Oyuncu kutusunu görselden biraz küçük tut; oyuncu lehine hata adil hissettirir.
7. **Oyun hissi**: sırayla ekle, her birini ölç ve abartma:
   - Kenardan düştükten sonra 0.1 saniye daha zıplayabilme (coyote time) ve yere değmeden hemen önce basılan zıplamayı hatırlama (zıplama tamponu)
   - Kısa basışta alçak, uzun basışta yüksek zıplama
   - Vuruşta 2 ile 4 karelik donma ve sönümlenen kısa ekran sarsıntısı
   - Parçacıklar, esneme ve ezilme (squash and stretch), kameranın yumuşak takibi
   - Her önemli olaya kısa ses; AudioContext ilk dokunuştan sonra başlar (tarayıcı kuralı)
   - prefers-reduced-motion açıksa sarsıntıyı ve yanıp sönmeyi kapat
8. **Zorluk eğrisi**: ilk 30 saniye öğretici kadar kolay, sonra kademeli artış. Kaybetme anı açık ve anlaşılır; "tekrar oyna" tek dokunuş.
9. **Kayıt**: en iyi skor localStorage'da. Ortak tablo için vayra.veri; oyuncu adını textContent ile göster, skoru sunucuda makul aralıkta denetle.
10. **Performans**: döngü içinde nesne üretme (nesne havuzu kullan), görselleri önceden yükle, değişmeyen arka planı ayrı tuvalde bir kez çiz, tek karede binlerce çizim yerine sprite sayfası kullan.

## Döngünün özü
\`\`\`js
const ADIM = 1 / 60;
let birikim = 0, onceki = performance.now();
function kare(simdi) {
  birikim += Math.min((simdi - onceki) / 1000, 0.25);
  onceki = simdi;
  while (birikim >= ADIM) { guncelle(ADIM); birikim -= ADIM; }
  ciz(birikim / ADIM); // 0 ile 1 arası ara değer katsayısı
  requestAnimationFrame(kare);
}
requestAnimationFrame(kare);
\`\`\`

Hızlar saniye başına birimle yazılır (piksel bölü saniye) ve her adımda ADIM ile çarpılır.

## Çıktı
Oyun tek sayfadır: tuval, başlangıç ekranı (nasıl oynanır ve tek düğme), oyun içi skor, duraklat düğmesi, bitiş ekranı (skor, en iyi skor, tekrar oyna). Yazdıktan sonra \`tarayici_testi\` ile başlat ve birkaç saniye oyna. Özette kontrolleri ve denediğin cihazları yaz.

## Yapma
- Hareketi kare başına sabit piksel olarak yazma; hız ekrana göre değişir.
- setInterval ile oyun döngüsü kurma.
- Sesi sayfa açılır açılmaz çalmaya çalışma.
- Mobilde yalnız klavyeyle oynanan kontrol bırakma.
- Her karede DOM öğesi ekleyip silme; tuvale çiz ya da öğeleri yeniden kullan.`,
    dosyalar: [
      { yol: "references/oyun-dongusu.js", icerik: `// Tarayıcı oyunu iskeleti: sabit adımlı döngü, durum makinesi, keskin canvas, klavye ve dokunma,
// ekran sarsıntısı, vuruş donması, otomatik duraklatma, en iyi skor. Sayfada <canvas id="oyun"></canvas> olmalı.
const tuval = document.getElementById("oyun");
const ctx = tuval.getContext("2d");
const GEN = 360, YUK = 640;          // mantık koordinatları; ekran boyutundan bağımsız
const ADIM = 1 / 60;                 // saniyede 60 sabit güncelleme
const azHareket = matchMedia("(prefers-reduced-motion: reduce)").matches;

function boyutla() {
  const oran = window.devicePixelRatio || 1;
  const olcek = Math.min(innerWidth / GEN, innerHeight / YUK);
  tuval.style.width = GEN * olcek + "px";
  tuval.style.height = YUK * olcek + "px";
  tuval.width = Math.round(GEN * olcek * oran);
  tuval.height = Math.round(YUK * olcek * oran);
  ctx.setTransform(olcek * oran, 0, 0, olcek * oran, 0, 0);
}
addEventListener("resize", boyutla);
boyutla();

// Girdi: tuş durumları bir kümede; basılma anı ayrıca tutulur (zıplama tamponu için)
const basili = new Set();
let sonBasma = -1;
const OYUN_TUSLARI = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"];
addEventListener("keydown", (e) => {
  if (OYUN_TUSLARI.includes(e.code)) e.preventDefault();   // sayfa kaymasın
  if (!basili.has(e.code)) sonBasma = zaman;
  basili.add(e.code);
  if (e.code === "Escape" || e.code === "KeyP") duraklatDegistir();
});
addEventListener("keyup", (e) => basili.delete(e.code));
tuval.style.touchAction = "none";
tuval.addEventListener("pointerdown", () => { basili.add("Space"); sonBasma = zaman; sesBaslat(); if (durum === "menu" || durum === "bitti") gec("oyunda"); });
tuval.addEventListener("pointerup", () => basili.delete("Space"));

// Ses: tarayıcı, kullanıcı etkileşiminden önce sese izin vermez
let ses = null;
function sesBaslat() { if (!ses) ses = new AudioContext(); }
function bip(frekans, sure) {
  if (!ses) return;
  const o = ses.createOscillator(), g = ses.createGain();
  o.frequency.value = frekans;
  g.gain.setValueAtTime(0.08, ses.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ses.currentTime + sure);
  o.connect(g).connect(ses.destination); o.start(); o.stop(ses.currentTime + sure);
}

// Durum makinesi
let durum = "menu", zaman = 0, skor = 0;
let enIyi = Number(localStorage.getItem("enIyiSkor") || 0);
const oyuncu = { x: 60, y: 500, oncekiX: 60, oncekiY: 500, vy: 0, yerde: true, sonYer: 0 };
let sarsinti = 0, donma = 0;

function gec(yeni) {
  durum = yeni;
  if (yeni === "oyunda") { skor = 0; zaman = 0; sonBasma = -1; Object.assign(oyuncu, { y: 500, oncekiY: 500, vy: 0, yerde: true }); }
  if (yeni === "bitti" && skor > enIyi) { enIyi = Math.floor(skor); localStorage.setItem("enIyiSkor", String(enIyi)); }
}
function duraklatDegistir() {
  if (durum === "oyunda") durum = "duraklatildi"; else if (durum === "duraklatildi") durum = "oyunda";
}
document.addEventListener("visibilitychange", () => { if (document.hidden && durum === "oyunda") durum = "duraklatildi"; });

function guncelle(dt) {
  if (durum !== "oyunda") return;
  zaman += dt;
  if (donma > 0) { donma -= dt; return; }          // vuruş donması
  oyuncu.oncekiX = oyuncu.x; oyuncu.oncekiY = oyuncu.y;
  const COYOTE = 0.1, TAMPON = 0.1;
  const zipla = zaman - sonBasma < TAMPON;
  const zeminSuresi = oyuncu.yerde || zaman - oyuncu.sonYer < COYOTE;
  if (zipla && zeminSuresi) { oyuncu.vy = -620; oyuncu.yerde = false; sonBasma = -1; bip(660, 0.08); }
  if (!basili.has("Space") && oyuncu.vy < -200) oyuncu.vy = -200;   // kısa basışta alçak zıplama
  oyuncu.vy += 1800 * dt;
  oyuncu.y += oyuncu.vy * dt;
  if (oyuncu.y >= 500) { if (!oyuncu.yerde && oyuncu.vy > 900) { sarsinti = 0.25; } oyuncu.y = 500; oyuncu.vy = 0; oyuncu.yerde = true; }
  if (oyuncu.yerde) oyuncu.sonYer = zaman;
  // Engel çarpışmasında: donma = 0.06; sarsinti = 0.3; bip(140, 0.3); gec("bitti");
  skor += dt * 10;
  sarsinti = Math.max(0, sarsinti - dt);
}

function ciz(alfa) {
  ctx.clearRect(0, 0, GEN, YUK);
  ctx.save();
  if (sarsinti > 0 && !azHareket) { const s = sarsinti * 24; ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s); }
  ctx.fillStyle = "#11151c"; ctx.fillRect(0, 0, GEN, YUK);
  ctx.fillStyle = "#2a3140"; ctx.fillRect(0, 532, GEN, 108);
  const y = oyuncu.oncekiY + (oyuncu.y - oyuncu.oncekiY) * alfa;  // ara değer
  const esnek = oyuncu.yerde ? 1 : Math.min(1.25, 1 + Math.abs(oyuncu.vy) / 3000);
  ctx.fillStyle = "#22d3ee"; ctx.fillRect(oyuncu.x - 16 / esnek, y - 32 * esnek, 32 / esnek, 32 * esnek);
  ctx.restore();
  ctx.fillStyle = "#e6e8ec"; ctx.font = "600 20px system-ui"; ctx.textAlign = "left";
  ctx.fillText("Skor " + Math.floor(skor), 16, 36);
  ctx.textAlign = "center";
  if (durum === "menu") ctx.fillText("Başlamak için dokun ya da boşluk", GEN / 2, YUK / 2);
  if (durum === "duraklatildi") ctx.fillText("Duraklatıldı, devam için P", GEN / 2, YUK / 2);
  if (durum === "bitti") ctx.fillText("Oyun bitti, en iyi " + enIyi, GEN / 2, YUK / 2);
}

// Sabit adımlı döngü: hız ekran yenileme hızından bağımsız
let birikim = 0, onceki = performance.now();
function kare(simdi) {
  birikim += Math.min((simdi - onceki) / 1000, 0.25);   // sekme dönüşünde dev sıçrama olmasın
  onceki = simdi;
  if ((durum === "menu" || durum === "bitti") && basili.has("Space")) { basili.delete("Space"); sesBaslat(); gec("oyunda"); }
  while (birikim >= ADIM) { guncelle(ADIM); birikim -= ADIM; }
  ciz(birikim / ADIM);
  requestAnimationFrame(kare);
}
requestAnimationFrame(kare);
` },
    ],
  },
  {
    id: "mobil-ekran-akisi", ad: "mobil-ekran-akisi", baslik: "Mobil uygulama ekran akışları ve gezinme", kategori: "mobil", simge: "/gercek/panel/gal-gpt-2.webp",
    aciklama: "Bir mobil uygulamanın ya da mobil öncelikli web uygulamasının ekranlarını, gezinme yapısını (alt sekme çubuğu, yığın, modal, alt sayfa, çekmece), ilk açılış ve izin akışlarını, yükleniyor, boş, hata ve çevrimdışı durumlarını planlarken veya Expo Router ve React Navigation ile kurarken kullan: iOS ve Android gezinme farkları, sistem geri hareketi, derin bağlantı, güvenli alan, başparmak bölgesi, dokunma hedefi, mobil form ekranları ve hesap silme. Kullanıcı 'mobil uygulama', 'ekran akışı', 'tab bar', 'onboarding', 'navigasyon' ya da 'kullanıcı akışı' dediğinde kullan.",
    ornekler: ["Yemek siparişi uygulamamın ekran akışını çıkar", "Uygulamama alt sekme çubuğu ekle", "İlk açılış ve izin ekranlarını tasarla"],
    govde: `# Mobil uygulama ekran akışları ve gezinme

Amaç: kullanıcının her an nerede olduğunu bildiği, tek elle kullanılabilen ve platform alışkanlıklarına uyan bir akış. Kod yazmadan önce ekran haritasını çıkar ve onaylat.

## Önce topla
- Uygulamanın 3 ile 5 ana işi (en sık yapılan eylemler)
- Üyelik gerekiyor mu; hangi ekranlar misafire açık
- Gereken izinler (bildirim, kamera, konum, fotoğraflar) ve hangi özellik için
- Hedef: Expo ve React Native, PWA ya da mobil öncelikli web

## Adımlar
1. **Ekran haritası**: her ana iş için başlangıçtan sona ekran listesi. Bir iş en çok 3 dokunuşta bitmeli.
2. **Gezinme modelini seç**:
   - Alt sekme çubuğu: 3 ile 5 eşit önemde ana bölüm; her sekme kendi yığınını korur; simge ve kısa etiket birlikte.
   - Yığın: ayrıntıya inmek için; üstte başlık ve geri.
   - Modal ya da alt sayfa: kendi içinde biten kısa iş (filtre, yeni kayıt, paylaşım); kapatma düğmesi ve aşağı kaydırarak kapatma.
   - Çekmece menü yalnız ikincil bölümler için; ana bölümleri çekmeceye saklama.
3. **Platform farkları**: iOS'ta kenardan kaydırarak geri dönülür ve birincil eylem çoğunlukla sağ üsttedir. Android'de sistem geri hareketi her ekranda çalışmalı ve açık modalı kapatmalı; Android 15 ve sonrasını hedefleyen uygulamalarda varsayılan olan tahmine dayalı geri animasyonunu (predictive back) bozma.
4. **İlk açılış**: en çok 3 tanıtım ekranı ya da hiç; "Atla" her zaman görünür. Kaydı, uygulamanın değeri görüldükten sonra iste; mümkünse misafir olarak devam ettir.
5. **İzinler**: izni ilgili özelliğe ilk dokunulduğunda, önce kendi açıklama ekranınla iste. Reddedilirse özelliğin içinde ayarlara giden yolu göster; uygulamayı kilitleme.
6. **Durumlar**: her liste ve ekran için yükleniyor (iskelet görünüm), boş (ne yapılacağını söyleyen düğmeli), hata (tekrar dene) ve çevrimdışı. Listelerde aşağı çekerek yenileme.
7. **Yerleşim**: güvenli alanlara (çentik, ana çubuk) uy; birincil düğme başparmağın rahat eriştiği alt bölgede. Dokunma hedefi en az 44 pt (iOS) ve 48 dp (Android).
8. **Formlar**: doğru klavye türü (e-posta, sayı, telefon), "Sonraki" ile alan geçişi, klavye açılınca etkin alan görünür kalır, otomatik doldurma (textContentType ve autoComplete) açık.
9. **Derin bağlantı**: bildirimden ya da paylaşılan adresten gelen kullanıcı doğrudan ilgili ekrana iner, altında doğru yığın kurulur; geri basınca uygulama kapanmaz, ana ekrana döner.
10. **Hesap silme**: üyelik varsa Profil altında uygulama içinden hesap silme (mağaza zorunluluğu).

## Expo Router yapısı
\`\`\`text
app/
  _layout.tsx              kök yığın, tema, yazı tipleri, filtre modalı
  (sekmeler)/_layout.tsx   alt sekme çubuğu
  (sekmeler)/index.tsx     Ana sayfa
  (sekmeler)/ara.tsx       Ara
  (sekmeler)/profil.tsx    Profil
  urun/[id].tsx            ayrıntı (yığın)
  filtre.tsx               modal
  giris.tsx
\`\`\`

\`\`\`tsx
// app/(sekmeler)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function SekmeDuzeni() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: "#0e7490" }}>
      <Tabs.Screen name="index" options={{ title: "Ana sayfa", tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }} />
      <Tabs.Screen name="ara" options={{ title: "Ara", tabBarIcon: ({ color, size }) => <Ionicons name="search" color={color} size={size} /> }} />
      <Tabs.Screen name="profil" options={{ title: "Profil", tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} /> }} />
    </Tabs>
  );
}
\`\`\`

\`\`\`tsx
// app/_layout.tsx
import { Stack } from "expo-router";
export default function KokDuzen() {
  return (
    <Stack>
      <Stack.Screen name="(sekmeler)" options={{ headerShown: false }} />
      <Stack.Screen name="urun/[id]" options={{ title: "Ürün" }} />
      <Stack.Screen name="filtre" options={{ presentation: "modal", title: "Filtrele" }} />
    </Stack>
  );
}
\`\`\`

## Çıktı
| Ekran | Nereden gelinir | Birincil eylem | Durumlar | Nereye gider |
|---|---|---|---|---|
| Ürün ayrıntısı | Ana sayfa, Ara, bildirim | Sepete ekle | yükleniyor, stok yok, hata | Sepet modalı |

Haritayı onaylattıktan sonra ekranları yaz; özette hangi izinlerin nerede istendiğini söyle.

## Yapma
- Ana bölümleri hamburger menüye gizleme.
- Uygulama açılır açılmaz bütün izinleri art arda isteme.
- Modal içinden başka modal açma; zincirleme modallar kullanıcıyı kaybettirir.
- Geri hareketini engelleme ya da kaydedilmemiş veriyi uyarmadan atma.
- Yalnız simgeli, etiketsiz sekmeler kullanma.`,
    dosyalar: [],
  },
  {
    id: "push-bildirim-stratejisi", ad: "push-bildirim-stratejisi", baslik: "Push bildirim stratejisi", kategori: "mobil", simge: "/gercek/panel/gal-seedance-6.webp",
    aciklama: "Bir mobil uygulama ya da PWA için bildirim planı kurarken, izin isteme anını ve metnini tasarlarken, bildirim türlerini, sıklık sınırlarını, sessiz saatleri ve kişiselleştirmeyi belirlerken veya Expo Notifications, Firebase Cloud Messaging, APNs ve Web Push ile teknik kurulum yaparken kullan: izin öncesi açıklama ekranı, Android 13 bildirim izni ve kanallar, iOS geçici izin, iOS ana ekran PWA şartı, derin bağlantı, belirteç yönetimi, ölçüm ve pazarlama onayı. Kullanıcı 'bildirim gönder', 'push', 'hatırlatma bildirimi', 'bildirim izni' ya da 'kullanıcıyı geri getir' dediğinde kullan.",
    ornekler: ["Uygulamama sipariş durumu bildirimleri ekle", "Bildirim iznini ne zaman istemeliyim?", "Randevudan bir gün önce hatırlatma gönder"],
    govde: `# Push bildirim stratejisi

Amaç: kullanıcının açmak istediği, zamanında ve az bildirim. Her bildirim bir değer taşımalı; yoksa izin kapatılır ya da uygulama silinir.

## Önce topla
- Kullanıcı için zamanı önemli bilgiler: sipariş durumu, randevu, mesaj, fiyat düşüşü, hatırlatma
- Hedef platformlar: iOS, Android, web (PWA)
- Altyapı: Expo push hizmeti, Firebase Cloud Messaging, APNs, Web Push, Vayra otomasyonu
- Kullanıcının açıp kapatabileceği bildirim türleri

## Adımlar
1. **Bildirim türlerini listele**:

| Tür | Ne zaman | Öncelik | Varsayılan |
|---|---|---|---|
| İşlem: ödeme alındı, sipariş kargoda | Olay anında | Yüksek | Açık |
| Hatırlatma: randevun yarın 10.00'da | Kullanıcının seçtiği zamanda | Orta | Açık |
| Sosyal: yeni mesaj, yoruma yanıt | Olay anında, gruplanmış | Orta | Açık |
| Pazarlama: kampanya, yeni ürün | Haftada en çok 1 ile 2 | Düşük | Kapalı, ayrı onay |

2. **İzin anı**: ilk açılışta isteme. Kullanıcı değer gördüğünde (ilk sipariş, randevu oluşturma) önce kendi açıklama ekranını göster: ne gönderileceğini ve ne sıklıkta olacağını söyle, "Bildirimleri aç" ve "Şimdi değil" düğmeleri koy. Sistem iznini yalnız kullanıcı kabul ederse iste. iOS sistem iznini bir kez sorar; reddedilirse ayarlara giden yolu göster.
3. **Platform kuralları**:
   - Android 13 ve sonrası POST_NOTIFICATIONS çalışma zamanı izni ister. Her tür için ayrı bildirim kanalı oluştur; kullanıcı kanal kanal kapatabilir.
   - iOS'ta geçici (provisional) izinle bildirimler sessizce bildirim merkezine düşer; izin oranını korumak için iyi bir başlangıçtır. Zamana duyarlı düzeyi yalnız gerçekten acil olana ver.
   - Web Push iOS ve iPadOS 16.4 ve sonrasında yalnız ana ekrana eklenmiş PWA'da çalışır. İzin isteği kullanıcı hareketiyle (düğme tıklaması) başlamalı. VAPID özel anahtarı yalnız sunucuda.
   - Expo SDK 53 ve sonrasında Android'de uzak bildirim Expo Go içinde çalışmaz; geliştirme derlemesi (development build) gerekir.
4. **Metin**: başlık kısa (40 ile 50 karakter), gövde bir ya da iki kısa cümle; kişiye ve bağlama özel ("Siparişin kargoya verildi, yarın kapında"); somut eylem; en çok bir emoji. Kilit ekranında görünecek hassas bilgi (sağlık, borç tutarı, kod) yazma.
5. **Zamanlama ve sıklık**: kullanıcının saat diliminde 21.00 ile 09.00 arası sessiz saat (işlem bildirimleri hariç); kullanıcı başına günlük üst sınır; aynı türü grupla ("3 yeni mesaj").
6. **Derin bağlantı**: her bildirim ilgili ekranı açar, ana sayfayı değil. Veri yükünde ekran yolunu taşı (mobil-ekran-akisi yeteneği).
7. **Belirteç yönetimi**: cihaz belirtecini kullanıcıyla eşle, çıkışta sil, geçersiz belirteç yanıtı gelince kaldır, uygulama açılışında yenile.
8. **Ölçüm**: gönderilen, iletilen, açılan, izin kapatma ve uygulama silme oranlarını tür bazında izle; açılma oranı düşen türü azalt.

## Vayra Build'de
Zamanlı ya da olaya bağlı bildirimleri sitenin koduna yazma; \`otomasyon_kur\` aracıyla tetik (tablo kaydı, ödeme, zaman) ve adım tanımla. Gecikmeli hatırlatma için Bulut fonksiyonunda \`vayra.sonra(saniye, "fonksiyon", veri)\` kullan.

## Expo iskeleti
\`\`\`js
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { router } from "expo-router";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export async function bildirimIzniAl() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("siparis", { name: "Sipariş durumu", importance: Notifications.AndroidImportance.HIGH });
    await Notifications.setNotificationChannelAsync("kampanya", { name: "Kampanyalar", importance: Notifications.AndroidImportance.LOW });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") return null;
  const belirtec = await Notifications.getExpoPushTokenAsync({ projectId: "EAS_PROJE_KIMLIGI" });
  return belirtec.data; // sunucuya kullanıcı kimliğiyle kaydet
}

// Bildirime dokununca ilgili ekranı aç
Notifications.addNotificationResponseReceivedListener((yanit) => {
  const ekran = yanit.notification.request.content.data && yanit.notification.request.content.data.ekran;
  if (ekran) router.push(ekran);
});
\`\`\`

## Çıktı
| Tür | Tetik | Başlık | Gövde | Açılan ekran | Sıklık sınırı | Kanal |
|---|---|---|---|---|---|---|
| İşlem | Sipariş kargoya verildi | Siparişin yolda | Yarın kapında olacak, takip için dokun | siparis/[id] | yok | siparis |

## Yapma
- İlk açılışta açıklamasız sistem izni isteme.
- Pazarlama bildirimini işlem kanalından gönderme.
- Aynı içeriği bildirim, e-posta ve SMS ile aynı anda yollama.
- Ticari ileti için ayrı onay almadan kampanya bildirimi gönderme.
- Kullanıcı uygulamadayken aynı bilgiyi hem bildirim hem ekran içi uyarıyla gösterme.`,
    dosyalar: [],
  },
  {
    id: "analitik-olay-plani", ad: "analitik-olay-plani", baslik: "Analitik olay planı", kategori: "veri", simge: "/gercek/galeri/soyut2.webp",
    aciklama: "Bir site, uygulama ya da oyun için hangi kullanıcı eylemlerinin ölçüleceğini planlarken, olay adlarını ve özelliklerini standartlaştırırken, dönüşüm hunisini tanımlarken veya var olan ölçümü denetlerken kullan: olay sözlüğü (tracking plan), ad kuralı, özellik sınırı, kişisel veri yasağı, çerez onayı, tetik anı, vayra.olay ve GA4 önerilen olay adları, huni ve elde tutma raporları. Sözlüğü ve koddaki çağrıları denetleyen betik içerir. Kullanıcı 'analitik', 'event', 'olay takibi', 'dönüşüm ölç', 'huni' ya da 'hangi butona tıklanıyor' dediğinde kullan.",
    ornekler: ["Mağazam için analitik olay planı çıkar", "Hangi olayları ölçmeliyim?", "Koddaki analitik olaylarını denetle"],
    govde: `# Analitik olay planı

Amaç: karar verdiren az sayıda, iyi adlandırılmış olay. "Her şeyi ölç" ile değil, "hangi soruyu yanıtlamak istiyoruz" ile başla.

## Önce topla
- İşin 1 ile 3 ana sorusu ("ziyaretçilerin kaçı ön kayıt oluyor, nerede bırakıyor")
- Ana hedef ölçütü ve onu besleyen ara adımlar
- Kullanılan araç: Vayra Analitik (vayra.olay), GA4, PostHog, Mixpanel
- Çerez onayı durumu: analitik çerezleri onay olmadan çalışmaz (turk-eticaret-yasal yeteneği)

## Adımlar
1. **Huniyi yaz**: hedefe giden 3 ile 6 adım (ürün görüntüleme, sepete ekleme, ödemeye başlama, satın alma).
2. **Olayları adlandır**: nesne ve eylem, küçük harf, kelimeler alt çizgiyle: urun_goruntule, sepete_ekle, odeme_basla, satin_al, kayit_ol, form_gonder. Projede tek kalıp; Türkçe harf yok; en çok 40 karakter (GA4 sınırı).
3. **Özellikleri belirle**: her olayda en çok 10 özellik, adlar aynı kuralla. Ortak özellikler: kaynak, sayfa, cihaz. Para için tutar (sayı) ve para_birimi (TRY).
4. **Kişisel veri gönderme**: e-posta, telefon, ad soyad, TCKN, açık adres, IP ve serbest metin alanlarının içeriği olaya girmez. Kullanıcıyı ayırt etmek gerekiyorsa rastgele iç kimlik.
5. **Tetik anını netleştir**: olay, eylem başarıyla bittiğinde gönderilir. form_gonder sunucudan başarı yanıtı gelince; satin_al ödeme doğrulandıktan sonra, mümkünse sunucuda.
6. **Sözlüğü yaz**: aşağıdaki tablo; kod ve sözlük aynı kalır. Yeni olay önce sözlüğe girer.
7. **Denetle**: her olayı önizlemede tetikle, analitik panelinde gör; adı ve özellikleri sözlükle karşılaştır (betik bunu yapar).
8. **Rapor**: huni dönüşümü ve adım adım bırakma, kaynağa göre dönüşüm, haftalık elde tutma (gosterge-paneli-tasarimi yeteneği).

## Olay sözlüğü
| Olay | Ne zaman | Özellikler | Türler | Huni adımı | GA4 karşılığı |
|---|---|---|---|---|---|
| urun_goruntule | Ürün sayfası açılınca | urun_id, kategori | metin, metin | 1 | view_item |
| sepete_ekle | Ürün sepete eklenince | urun_id, tutar, adet, para_birimi | metin, sayı, sayı, metin | 2 | add_to_cart |
| odeme_basla | Ödeme sayfası açılınca | tutar, para_birimi, kalem_sayisi | sayı, metin, sayı | 3 | begin_checkout |
| satin_al | Ödeme doğrulanınca | siparis_id, tutar, para_birimi | metin, sayı, metin | 4 | purchase |
| kayit_ol | Üyelik oluşunca | yontem | metin | | sign_up |

## Kod
\`\`\`js
// Vayra Analitik: Bulut panelindeki Analitik bölümünde sayılır
vayra.olay("sepete_ekle", { urun_id: urun.id, tutar: urun.fiyat, adet: 1, para_birimi: "TRY" });

// GA4 kullanılıyorsa önerilen e-ticaret adlarını kullan; hazır raporlar bunlarla çalışır
gtag("event", "add_to_cart", {
  currency: "TRY",
  value: urun.fiyat,
  items: [{ item_id: urun.id, item_name: urun.ad, quantity: 1 }],
});
\`\`\`

Ürün adı kişisel veri değildir; GA4 items dizisinde kullanılabilir.

## Betik
\`scripts/analitik-olay-plani.js\` olay sözlüğünü denetler: ad kuralı, yinelenen ve eş anlamlı adlar (kayit_ol ile uye_ol), kişisel veri gibi görünen özellikler, özellik sayısı, para birimi eksikliği ve huni adımlarındaki boşluk. koddakiler verilirse koddaki vayra.olay çağrılarını sözlükle karşılaştırır. Çağrıları proje dosyalarında "vayra.olay(" metnini arayarak topla.

\`\`\`json
{
  "olaylar": [
    { "ad": "urun_goruntule", "ozellikler": ["urun_id", "kategori"], "huni": 1 },
    { "ad": "sepete_ekle", "ozellikler": ["urun_id", "tutar", "adet", "para_birimi"], "huni": 2 },
    { "ad": "Form Gönder", "ozellikler": ["eposta"] }
  ],
  "koddakiler": [
    { "ad": "sepete_ekle", "ozellikler": ["urun_id", "tutar"] },
    { "ad": "odeme_basla", "ozellikler": [] }
  ]
}
\`\`\`

Dönüş: gecerli, sorunlar (olay, seviye, mesaj; ad hatalarında önerilen ad), karsilastirma (sözlükte olmayanlar, kodda kullanılmayanlar, özellik farkları) ve ozet.

## Yapma
- Her tıklamaya ayrı olay açma (tikla_mavi_dugme_3).
- Aynı eylem için iki ad kullanma (kayit_ol ve uye_ol).
- Olay özelliğine e-posta, telefon ya da form metni koyma.
- Çerez onayı vermeyen ziyaretçide analitik çerezi yazma.
- Sözlüğü güncellemeden yeni olay ekleme.`,
    dosyalar: [
      { yol: "scripts/analitik-olay-plani.js", icerik: `// Analitik olay sözlüğünü denetler: ad kuralı, yinelenen ve benzer adlar, kişisel veri gibi görünen
// özellikler, özellik sayısı, huni sırası; isteğe bağlı olarak koddaki çağrıları sözlükle karşılaştırır.
// Girdi: { olaylar: [ { ad, ozellikler: [..], huni } ], koddakiler: [ { ad, ozellikler: [..] } ], enCokOzellik }
module.exports = function (girdi, vayra) {
  var olaylar = (girdi && girdi.olaylar) || [];
  var koddakiler = (girdi && girdi.koddakiler) || null;
  var enCok = (girdi && girdi.enCokOzellik) || 10;
  var sorunlar = [];
  var AD = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;
  var KISISEL = /(^|_)(e?posta|email|mail|telefon|tel|phone|gsm|ad_?soyad|soyad|full_name|first_name|last_name|tckn|tc_?kimlik|kimlik_?no|adres|address|iban|kart_no|card_number|dogum_tarihi|sifre|parola|password|ip|ip_adresi|enlem|boylam|mesaj_metni)($|_)/;
  var ESANLAM = [["kayit_ol", "uye_ol", "kaydol", "sign_up"], ["satin_al", "odeme_tamamla", "siparis_ver", "purchase"], ["sepete_ekle", "sepet_ekle", "add_to_cart"], ["form_gonder", "form_gonderildi", "gonder"]];

  function sorun(olay, seviye, mesaj) { sorunlar.push({ olay: olay, seviye: seviye, mesaj: mesaj }); }
  function turkceVarMi(s) { return /[çğıöşüÇĞİÖŞÜ]/.test(s); }
  function oneriAd(s) {
    return String(s).replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
      .replace(/Ç/g, "c").replace(/Ğ/g, "g").replace(/İ/g, "i").replace(/I/g, "i").replace(/Ö/g, "o").replace(/Ş/g, "s").replace(/Ü/g, "u")
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  }

  var adlar = {};
  olaylar.forEach(function (o) {
    var ad = String(o.ad || "");
    if (!ad) { sorun("(adsız)", "hata", "Olayın adı yok"); return; }
    if (adlar[ad]) sorun(ad, "hata", "Bu ad sözlükte birden çok kez var");
    adlar[ad] = o;
    if (!AD.test(ad)) sorun(ad, "hata", "Ad küçük harf, rakam ve alt çizgiden oluşmalı" + (turkceVarMi(ad) ? "; Türkçe karakter kullanma" : "") + ". Önerilen: " + oneriAd(ad));
    if (ad.length > 40) sorun(ad, "hata", "Ad 40 karakterden uzun (GA4 sınırı)");
    if (/^(ga_|google_|firebase_)/.test(ad)) sorun(ad, "hata", "ga_, google_ ve firebase_ ön ekleri ayrılmış adlardır");
    var oz = o.ozellikler || [];
    if (oz.length > enCok) sorun(ad, "uyari", oz.length + " özellik var; en çok " + enCok + " önerilir");
    var gorulenOz = {};
    oz.forEach(function (p) {
      if (gorulenOz[p]) sorun(ad, "uyari", "'" + p + "' özelliği iki kez yazılmış");
      gorulenOz[p] = true;
      if (!AD.test(p)) sorun(ad, "hata", "'" + p + "' özellik adı kurala uymuyor. Önerilen: " + oneriAd(p));
      if (KISISEL.test(oneriAd(p))) sorun(ad, "hata", "'" + p + "' kişisel veri taşıyor gibi görünüyor; olaya kişisel veri gönderme, gerekiyorsa rastgele iç kimlik kullan");
    });
    if (/(tutar|fiyat|value|gelir)/.test(oz.join(" ")) && !/(para_birimi|currency)/.test(oz.join(" "))) sorun(ad, "uyari", "Tutar var ama para_birimi yok; TRY olarak ekle");
  });

  ESANLAM.forEach(function (grup) {
    var bulunan = grup.filter(function (g) { return adlar[g]; });
    if (bulunan.length > 1) sorun(bulunan.join(", "), "uyari", "Aynı eylem için birden çok ad var; birini seç");
  });

  var huni = olaylar.filter(function (o) { return typeof o.huni === "number"; }).sort(function (a, b) { return a.huni - b.huni; });
  for (var i = 0; i < huni.length; i++) {
    if (i > 0 && huni[i].huni === huni[i - 1].huni) sorun(huni[i].ad, "uyari", "Huni adımı " + huni[i].huni + " iki olayda tekrar ediyor (" + huni[i - 1].ad + ")");
    if (huni[i].huni !== i + 1 && (i === 0 || huni[i].huni !== huni[i - 1].huni)) {
      sorun(huni[i].ad, "uyari", "Huni adımları 1'den başlayıp ardışık gitmeli; " + huni[i].huni + " numaralı adımdan önce eksik adım var");
      break;
    }
  }

  var karsilastirma = null;
  if (koddakiler) {
    karsilastirma = { sozluktenEksik: [], koddaKullanilmayan: [], ozellikFarki: [] };
    var koddaAdlar = {};
    koddakiler.forEach(function (k) {
      koddaAdlar[k.ad] = true;
      var s = adlar[k.ad];
      if (!s) { karsilastirma.sozluktenEksik.push(k.ad); sorun(k.ad, "hata", "Kodda gönderiliyor ama sözlükte yok"); return; }
      var beklenen = s.ozellikler || [], gelen = k.ozellikler || [];
      var eksik = beklenen.filter(function (p) { return gelen.indexOf(p) === -1; });
      var fazla = gelen.filter(function (p) { return beklenen.indexOf(p) === -1; });
      if (eksik.length || fazla.length) {
        karsilastirma.ozellikFarki.push({ olay: k.ad, eksik: eksik, fazla: fazla });
        sorun(k.ad, "uyari", "Koddaki özellikler sözlükle aynı değil" + (eksik.length ? "; eksik: " + eksik.join(", ") : "") + (fazla.length ? "; sözlükte olmayan: " + fazla.join(", ") : ""));
      }
    });
    Object.keys(adlar).forEach(function (a) { if (!koddaAdlar[a]) karsilastirma.koddaKullanilmayan.push(a); });
  }

  var hataSayisi = sorunlar.filter(function (s) { return s.seviye === "hata"; }).length;
  return {
    gecerli: hataSayisi === 0,
    sorunlar: sorunlar,
    karsilastirma: karsilastirma,
    ozet: olaylar.length + " olay denetlendi: " + hataSayisi + " hata, " + (sorunlar.length - hataSayisi) + " uyarı"
  };
};
` },
    ],
  },
  {
    id: "csv-veri-temizleme", ad: "csv-veri-temizleme", baslik: "CSV ve Excel veri temizleme", kategori: "veri", simge: "/gercek/galeri/3d8.webp",
    aciklama: "Kullanıcının yüklediği CSV, TSV ya da Excel'den dışa aktarılmış tabloyu temizlerken, dönüştürürken veya uygulamanın veri tablosuna, ürün kataloğuna, müşteri listesine aktarmaya hazırlarken kullan: ayraç ve kodlama tespiti (noktalı virgül, UTF-8 BOM, Windows-1254), bozuk Türkçe harf onarımı, Türkçe sayı ve tarih biçimleri, Excel seri tarihleri, boşluk ve büyük küçük harf düzeltme, telefon ve e-posta normalleştirme, yinelenen kayıtları birleştirme, hatalı satır listesi ve temizlik raporu. Çalışan temizleme betiği içerir. Kullanıcı 'CSV', 'Excel', 'tabloyu temizle', 'içe aktar', 'veri bozuk' ya da 'yinelenenleri sil' dediğinde kullan.",
    ornekler: ["Bu müşteri listesini temizle ve içe aktar", "Excel'den gelen ürün tablosundaki Türkçe karakterler bozuk", "Yinelenen kayıtları bul ve birleştir"],
    govde: `# CSV ve Excel veri temizleme

Amaç: ham tabloyu kayıpsız ve açıklanabilir adımlarla temiz, tutarlı veriye çevirmek. Hiçbir satırı sessizce silme; her değişikliği raporla.

## Önce topla
- Dosyanın kaynağı (Excel, muhasebe programı, e-ticaret paneli, form aracı) ve yaklaşık satır sayısı
- Hedef: hangi tabloya, hangi alan türleriyle aktarılacak (veri-semasi-goc yeteneği)
- Benzersizlik anahtarı: e-posta, ürün kodu, müşteri numarası
- Yinelenen ve hatalı satırlar için karar: birleştir, ayrı listeye al ya da sor

## Adımlar
1. **Oku ve tanı**: kodlama (UTF-8, BOM'lu UTF-8 ya da Türkçe Excel'in Windows-1254 kodlaması; "ÅŸ" ya da "Ý" görünüyorsa kodlama yanlış okunmuştur), ayraç (Türkçe Excel çoğunlukla noktalı virgül kullanır), başlık satırı, tırnaklı alanlar ve alan içindeki satır sonları.
2. **Profil çıkar**: her sütunda dolu ve boş sayısı, benzersiz değer sayısı, tahmini tür, en sık 5 değer ve aykırı değerler. Kullanıcıya bu özeti göster.
3. **Başlıkları düzelt**: kırp, tekrar edenleri ayır, hedef alan adlarına eşle ("Ad Soyad" başlığı adSoyad alanına).
4. **Değerleri normalleştir**:
   - Boşluk: baştaki ve sondaki boşluk, çift boşluk, bölünmez boşluk ve sıfır genişlikli karakterler.
   - Sayı: "1.250,50" ve "1250.50" biçimleri sayıya döner; TL ve ₺ yazıları ayrılır; parantezli tutar eksi sayılır. Başında sıfır olan kodlar (posta kodu, müşteri no) metin kalır.
   - Tarih: 05.11.2026, 5/11/2026 ve 2026-11-05 biçimleri ISO tarihe döner. Gün ve ay belirsizse (03/04/2026) sütunun geri kalanına bakılır; yine belirsizse Türkiye biçimi (gün önde) kabul edilip raporlanır. Excel seri tarihleri (46000 gibi) 1899-12-30 tabanından çevrilir.
   - Metin: Türkçe kurallarla büyük küçük harf; "ISPARTA" Isparta, "istanbul" İstanbul olur. İl ve ilçe adlarını resmî yazıma eşle.
   - E-posta küçük harfe; telefon +90 ile başlayan 10 haneli biçime.
   - Mantıksal: evet, hayır, var, yok, 1, 0, true, false değerleri doğru ya da yanlışa.
5. **Yinelenenleri bul**: anahtar sütunu normalleştirilmiş hâliyle karşılaştır. Birleştirme kuralını yaz (ilk kayıt kalır, boş alanları diğerinden dolar) ve hangi satırların birleştiğini listele.
6. **Doğrula**: zorunlu alanı boş, biçimi bozuk ya da aralık dışı satırları ayrı hata listesine koy; satır numarası Excel'deki satırla aynı olsun.
7. **Çıktı ver**: temiz CSV (Excel'de Türkçe harfler doğru açılsın diye BOM'lu UTF-8) ya da JSON; ayrıca temizlik raporu. Eşittir, artı, eksi ya da @ ile başlayan metin hücrelerinin başına kesme işareti eklenir (Excel formül enjeksiyonuna karşı).
8. **Aktar**: kullanıcı onaylayınca kayıtları hedef tabloya küçük partilerle ekle ve eklenen sayıyı bildir.

## Betik
\`scripts/csv-veri-temizleme.js\` ham CSV metnini okur (ayraç tespiti, tırnaklı alanlar, bozuk kodlama onarımı), sütun türlerini tahmin eder, değerleri normalleştirir, yinelenenleri birleştirir ve rapor üretir. Excel dosyasını önce CSV olarak al ya da kullanıcıdan "CSV UTF-8" olarak kaydetmesini iste.

\`\`\`json
{
  "metin": "Ad Soyad;E-posta;Telefon;Tutar;Tarih\\n ayşe  yılmaz ;Ayse@Ornek.com;0532 123 45 67;1.250,50 TL;05.11.2026",
  "anahtar": "E-posta",
  "turler": { "Ad Soyad": "ad" },
  "birlestir": "ilk",
  "cikti": "ikisi"
}
\`\`\`

Seçenekler: ayrac (verilmezse bulunur), turler (sütun başına metin, ad, eposta, telefon, sayi, tarih, mantiksal ya da atla; verilmeyenler tahmin edilir), birlestir (ilk ya da son), cikti (json, csv ya da ikisi), cikisAyrac (varsayılan virgül), bom (varsayılan açık).

Dönüş: basliklar, turler, satirlar (her kayıtta Excel satır numarası _satir), csv, yinelenenler, hatalar (satır, sütun, değer, sorun) ve rapor (ayraç, kodlama onarımı, satır sayıları, sütun başına değişen değer sayısı, uyarılar).

## Rapor biçimi
| Ölçü | Değer |
|---|---|
| Okunan veri satırı | 1.240 |
| Atlanan boş satır | 6 |
| Birleştirilen yinelenen | 18 |
| Hatalı satır | 9 (ayrı listede) |
| Aktarılmaya hazır | 1.213 |

Altına sütun bazında yapılan değişiklikleri ve kullanıcının karar vermesi gereken belirsiz durumları yaz.

## Yapma
- Hatalı satırı sessizce silme; ayrı listede göster.
- Başında sıfır olan kodları sayıya çevirip sıfırı kaybetme.
- Türkçe harfleri ASCII'ye çevirme (Şahin, Sahin olmasın); bu yalnız adres kısaltmasında yapılır.
- Ham dosyanın üzerine yazma; temiz çıktı ayrı dosya olsun.
- Belirsiz tarih biçimine sormadan karar verip raporlamamak.`,
    dosyalar: [
      { yol: "scripts/csv-veri-temizleme.js", icerik: `// Ham CSV metnini okur ve temizler: ayraç tespiti, tırnaklı alanlar, bozuk Türkçe kodlama onarımı,
// sütun türü tahmini, Türkçe sayı, tarih, telefon, e-posta ve ad normalleştirme, yinelenen kayıtlar, rapor.
// Girdi: { metin, ayrac, anahtar, turler: { sutun: tur }, birlestir: "ilk" | "son", cikti: "json" | "csv" | "ikisi",
//          cikisAyrac, bom, ornekSiniri }
// tur: metin | ad | eposta | telefon | sayi | tarih | mantiksal | atla
module.exports = function (girdi, vayra) {
  var g = girdi || {};
  var metin = String(g.metin || "");
  var uyarilar = [];
  var kodlamaDuzeltildi = false;
  var SINIR = g.ornekSiniri || 100;

  // 1. Kodlama: BOM ve yaygın bozulmalar
  if (metin.charCodeAt(0) === 0xfeff) metin = metin.slice(1);
  if (/Ã[\\u0080-¿]|Å[\\u0080-¿]|Ä[\\u0080-¿]/.test(metin)) {
    var onarilan = utf8Onar(metin);
    if (onarilan !== null) { metin = onarilan; kodlamaDuzeltildi = true; uyarilar.push("Dosya UTF-8 iken Latin-1 olarak okunmuş; Türkçe karakterler onarıldı."); }
  } else if (/[ýþðÝÞÐ]/.test(metin) && !/[ışğİŞĞ]/.test(metin)) {
    metin = metin.replace(/ý/g, "ı").replace(/þ/g, "ş").replace(/ð/g, "ğ").replace(/Ý/g, "İ").replace(/Þ/g, "Ş").replace(/Ð/g, "Ğ");
    kodlamaDuzeltildi = true;
    uyarilar.push("Dosya Windows-1254 (Türkçe) kodlamalı; ı, ş, ğ, İ, Ş, Ğ harfleri onarıldı.");
  }

  // 2. Ayraç ve ayrıştırma
  var ayrac = g.ayrac || ayracBul(metin);
  var tablo = ayristir(metin, ayrac);
  var bosSatir = 0;
  tablo = tablo.filter(function (s) {
    var dolu = s.some(function (h) { return temizle(h) !== ""; });
    if (!dolu) bosSatir++;
    return dolu;
  });
  if (!tablo.length) return { hata: "Metinde veri yok" };

  var gorulenBaslik = {};
  var basliklar = tablo[0].map(function (b, i) {
    var ad = temizle(b) || "sutun_" + (i + 1);
    if (gorulenBaslik[ad]) { gorulenBaslik[ad]++; ad = ad + "_" + gorulenBaslik[ad]; uyarilar.push("Tekrar eden başlık yeniden adlandırıldı: " + ad); }
    else gorulenBaslik[ad] = 1;
    return ad;
  });
  var veri = tablo.slice(1);

  // 3. Sütun türleri
  var turler = {};
  basliklar.forEach(function (b, i) {
    turler[b] = (g.turler && g.turler[b]) || tahmin(veri.map(function (s) { return temizle(s[i] || ""); }));
  });
  var gunOnce = {};
  basliklar.forEach(function (b, i) { if (turler[b] === "tarih") gunOnce[b] = gunAySirasi(veri.map(function (s) { return temizle(s[i] || ""); }), b); });

  // 4. Satırları temizle
  var degisen = {};
  basliklar.forEach(function (b) { degisen[b] = 0; });
  var hatalar = [];
  var satirlar = [];
  veri.forEach(function (s, sira) {
    var excelSatiri = sira + 2;
    if (s.length !== basliklar.length) hatalar.push({ satir: excelSatiri, sutun: null, deger: null, sorun: basliklar.length + " sütun beklenirken " + s.length + " sütun var" });
    var kayit = {};
    basliklar.forEach(function (b, i) {
      var ham = s[i] === undefined ? "" : s[i];
      var tur = turler[b];
      if (tur === "atla") return;
      var sonuc = donustur(ham, tur, gunOnce[b]);
      if (sonuc.hata) hatalar.push({ satir: excelSatiri, sutun: b, deger: ham, sorun: sonuc.hata });
      if (String(sonuc.deger) !== String(ham)) degisen[b]++;
      kayit[b] = sonuc.deger;
    });
    kayit._satir = excelSatiri;
    satirlar.push(kayit);
  });

  // 5. Yinelenenler
  var yinelenenler = [];
  if (g.anahtar) {
    if (basliklar.indexOf(g.anahtar) === -1) uyarilar.push("Anahtar sütunu bulunamadı: " + g.anahtar);
    else {
      var gruplar = {}, sira = [];
      satirlar.forEach(function (k) {
        var a = String(k[g.anahtar] === null ? "" : k[g.anahtar]).toLowerCase();
        if (!a) { sira.push([k]); return; }
        if (!gruplar[a]) { gruplar[a] = [k]; sira.push(gruplar[a]); } else gruplar[a].push(k);
      });
      satirlar = sira.map(function (grup) {
        if (grup.length === 1) return grup[0];
        yinelenenler.push({ anahtar: grup[0][g.anahtar], satirlar: grup.map(function (k) { return k._satir; }) });
        var sirali = g.birlestir === "son" ? grup.slice().reverse() : grup;
        var birlesik = {};
        Object.keys(sirali[0]).forEach(function (alan) {
          for (var j = 0; j < sirali.length; j++) {
            var v = sirali[j][alan];
            if (v !== "" && v !== null && v !== undefined) { birlesik[alan] = v; return; }
          }
          birlesik[alan] = sirali[0][alan];
        });
        birlesik._satir = sirali[0]._satir;
        return birlesik;
      });
    }
  }

  var hataliSatirlar = {};
  hatalar.forEach(function (h) { hataliSatirlar[h.satir] = true; });
  var sonuc = {
    basliklar: basliklar.filter(function (b) { return turler[b] !== "atla"; }),
    turler: turler,
    satirlar: satirlar,
    yinelenenler: yinelenenler.slice(0, SINIR),
    hatalar: hatalar.slice(0, SINIR),
    rapor: {
      ayrac: ayrac === "\\t" ? "sekme" : ayrac,
      kodlamaDuzeltildi: kodlamaDuzeltildi,
      veriSatiri: veri.length,
      bosSatirAtlandi: bosSatir,
      ciktiSatiri: satirlar.length,
      yinelenenGrup: yinelenenler.length,
      birlestirilenSatir: yinelenenler.reduce(function (t, y) { return t + y.satirlar.length - 1; }, 0),
      hataliSatir: Object.keys(hataliSatirlar).length,
      hataSayisi: hatalar.length,
      degisenDeger: degisen,
      uyarilar: uyarilar
    }
  };
  if (g.cikti === "csv" || g.cikti === "ikisi") {
    sonuc.csv = csvYaz(sonuc.basliklar, satirlar, g.cikisAyrac || ",", g.bom !== false);
    if (g.cikti === "csv") delete sonuc.satirlar;
  }
  return sonuc;

  // Yardımcılar
  function temizle(s) {
    return String(s).replace(/[   ]/g, " ").replace(/[​-‍⁠﻿]/g, "").replace(/\\s+/g, " ").trim();
  }
  function utf8Onar(s) {
    var baytlar = [];
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c > 255) return null;
      baytlar.push(c);
    }
    var cikis = "", j = 0;
    while (j < baytlar.length) {
      var b = baytlar[j];
      if (b < 0x80) { cikis += String.fromCharCode(b); j++; }
      else if (b >= 0xc2 && b < 0xe0 && j + 1 < baytlar.length) { cikis += String.fromCharCode(((b & 0x1f) << 6) | (baytlar[j + 1] & 0x3f)); j += 2; }
      else if (b >= 0xe0 && b < 0xf0 && j + 2 < baytlar.length) { cikis += String.fromCharCode(((b & 0x0f) << 12) | ((baytlar[j + 1] & 0x3f) << 6) | (baytlar[j + 2] & 0x3f)); j += 3; }
      else return null;
    }
    return cikis;
  }
  function ayracBul(s) {
    var satirlar = s.split(/\\r?\\n/).filter(function (x) { return x.trim(); }).slice(0, 20);
    var adaylar = [";", ",", "\\t", "|"], enIyi = ",", enIyiPuan = -1;
    adaylar.forEach(function (a) {
      var sayilar = satirlar.map(function (x) { return x.replace(/"[^"]*"/g, "").split(a).length - 1; });
      if (!sayilar.length || sayilar[0] === 0) return;
      var ayni = sayilar.filter(function (n) { return n === sayilar[0]; }).length;
      var puan = ayni * 100 + sayilar[0];
      if (puan > enIyiPuan) { enIyiPuan = puan; enIyi = a; }
    });
    return enIyi;
  }
  function ayristir(s, a) {
    var satirlar = [], satir = [], alan = "", tirnak = false;
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (tirnak) {
        if (c === '"') { if (s.charAt(i + 1) === '"') { alan += '"'; i++; } else tirnak = false; }
        else alan += c;
      } else if (c === '"' && alan.trim() === "") { tirnak = true; alan = ""; }
      else if (c === a) { satir.push(alan); alan = ""; }
      else if (c === "\\n" || c === "\\r") {
        if (c === "\\r" && s.charAt(i + 1) === "\\n") i++;
        satir.push(alan); satirlar.push(satir); satir = []; alan = "";
      } else alan += c;
    }
    if (alan !== "" || satir.length) { satir.push(alan); satirlar.push(satir); }
    return satirlar;
  }
  function sayiCoz(s) {
    var t = String(s).replace(/\\s/g, "").replace(/^(TL|TRY|₺)|(TL|TRY|₺)$/gi, "");
    var eksi = /^\\(.*\\)$/.test(t);
    if (eksi) t = t.slice(1, -1);
    if (/^[+-]?\\d{1,3}(\\.\\d{3})+(,\\d+)?$/.test(t)) t = t.replace(/\\./g, "").replace(",", ".");
    else if (/^[+-]?\\d{1,3}(,\\d{3})+(\\.\\d+)?$/.test(t)) t = t.replace(/,/g, "");
    else if (/^[+-]?\\d+,\\d+$/.test(t)) t = t.replace(",", ".");
    if (!/^[+-]?\\d+(\\.\\d+)?$/.test(t)) return null;
    return eksi ? -Number(t) : Number(t);
  }
  function telefonCoz(s) {
    var r = String(s).replace(/\\D/g, "");
    if (r.indexOf("90") === 0 && r.length === 12) r = r.slice(2);
    if (r.charAt(0) === "0" && r.length === 11) r = r.slice(1);
    return /^[2-5]\\d{9}$/.test(r) ? "+90" + r : null;
  }
  function gunAySirasi(degerler, sutun) {
    var gunOnde = 0, ayOnde = 0, belirsiz = 0;
    degerler.forEach(function (d) {
      var m = /^(\\d{1,2})[.\\/-](\\d{1,2})[.\\/-](\\d{2,4})$/.exec(d);
      if (!m) return;
      if (+m[1] > 12) gunOnde++; else if (+m[2] > 12) ayOnde++; else if (m[1] !== m[2]) belirsiz++;
    });
    var sonuc = ayOnde > gunOnde ? false : true;
    if (gunOnde && ayOnde) uyarilar.push(sutun + " sütununda hem GG.AA hem AA.GG biçimli tarihler var; çoğunluğa göre " + (sonuc ? "gün önde" : "ay önde") + " kabul edildi.");
    else if (belirsiz && !gunOnde && !ayOnde) uyarilar.push(sutun + " sütununda " + belirsiz + " tarih belirsiz (gün ve ay 12'den küçük); Türkiye biçimi olarak gün önde kabul edildi.");
    return sonuc;
  }
  function tarihCoz(s, gunOnde) {
    var m, y, a, gun;
    var t = String(s).trim();
    if ((m = /^(\\d{4})[-\\/.](\\d{1,2})[-\\/.](\\d{1,2})([ T]\\d{1,2}:\\d{2}(:\\d{2})?)?$/.exec(t))) { y = +m[1]; a = +m[2]; gun = +m[3]; }
    else if ((m = /^(\\d{1,2})[.\\/-](\\d{1,2})[.\\/-](\\d{2,4})([ T]\\d{1,2}:\\d{2}(:\\d{2})?)?$/.exec(t))) {
      y = +m[3]; if (y < 100) y += y < 70 ? 2000 : 1900;
      if (gunOnde === false) { a = +m[1]; gun = +m[2]; } else { gun = +m[1]; a = +m[2]; }
    } else if (/^\\d{5}(\\.\\d+)?$/.test(t) && +t > 20000 && +t < 80000) {
      var d = new Date(Date.UTC(1899, 11, 30) + Math.floor(+t) * 86400000);
      return d.toISOString().slice(0, 10);
    } else return null;
    var dt = new Date(Date.UTC(y, a - 1, gun));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== a - 1 || dt.getUTCDate() !== gun) return null;
    return y + "-" + ("0" + a).slice(-2) + "-" + ("0" + gun).slice(-2);
  }
  function trKucuk(s) { return s.replace(/I/g, "ı").replace(/İ/g, "i").toLowerCase(); }
  function trBuyuk(s) { return s.replace(/i/g, "İ").replace(/ı/g, "I").toUpperCase(); }
  function adDuzelt(s) {
    return trKucuk(s).split(" ").map(function (k) {
      return k.split(/(['-])/).map(function (p) { return p.length ? trBuyuk(p.charAt(0)) + p.slice(1) : p; }).join("");
    }).join(" ");
  }
  function mantiksalCoz(s) {
    var t = trKucuk(String(s).trim());
    if (["evet", "var", "1", "true", "doğru", "e", "x", "açık"].indexOf(t) !== -1) return true;
    if (["hayır", "hayir", "yok", "0", "false", "yanlış", "h", "kapalı"].indexOf(t) !== -1) return false;
    return null;
  }
  function tahmin(degerler) {
    var dolu = degerler.filter(function (d) { return d !== ""; });
    if (!dolu.length) return "metin";
    // Kirli veride de tür bulunsun diye çoğunluk (yüzde 60) yeterli; uymayanlar hata listesine düşer.
    function cogu(f) { return dolu.filter(f).length / dolu.length >= 0.6; }
    if (cogu(function (d) { return /@/.test(d); })) return "eposta";
    if (cogu(function (d) { return /^[+(\\d][\\d\\s()+-]{9,}$/.test(d) && telefonCoz(d) !== null; })) return "telefon";
    if (cogu(function (d) { return /^\\d{1,4}[.\\/-]\\d{1,2}[.\\/-]\\d{2,4}([ T]\\d{1,2}:\\d{2}(:\\d{2})?)?$/.test(d); })) return "tarih";
    // Başında sıfır olan kodlar (posta kodu, müşteri no) sayıya çevrilmez, metin kalır.
    if (cogu(function (d) { return sayiCoz(d) !== null && !/^0\\d/.test(d.replace(/\\s/g, "")); })) return "sayi";
    if (cogu(function (d) { return mantiksalCoz(d) !== null; }) && dolu.some(function (d) { return !/^[01]$/.test(d); })) return "mantiksal";
    return "metin";
  }
  function donustur(ham, tur, gunOnde) {
    var d = temizle(ham);
    if (d === "" || /^(-|—|yok|null|n\\/a|#n\\/a|#yok)$/i.test(d) && tur !== "mantiksal") return { deger: d === "" ? "" : null };
    if (tur === "eposta") { var e = d.toLowerCase().replace(/^mailto:/, ""); return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(e) ? { deger: e } : { deger: e, hata: "E-posta biçiminde değil" }; }
    if (tur === "telefon") { var t = telefonCoz(d); return t ? { deger: t } : { deger: d, hata: "Telefon 10 haneli Türkiye numarası değil" }; }
    if (tur === "sayi") { var n = sayiCoz(d); return n === null ? { deger: d, hata: "Sayıya çevrilemedi" } : { deger: n }; }
    if (tur === "tarih") { var iso = tarihCoz(d, gunOnde); return iso ? { deger: iso } : { deger: d, hata: "Tarih okunamadı" }; }
    if (tur === "mantiksal") { var b = mantiksalCoz(d); return b === null ? { deger: d, hata: "Evet ya da hayır değil" } : { deger: b }; }
    if (tur === "ad") return { deger: adDuzelt(d) };
    return { deger: d };
  }
  function csvYaz(bas, kayitlar, a, bom) {
    function hucre(v) {
      if (v === null || v === undefined) return "";
      var s = String(v);
      if (typeof v === "string" && /^[=+\\-@\\t\\r]/.test(s) && !/^[+-]?[\\d\\s().]+$/.test(s)) s = "'" + s; // Excel formül enjeksiyonuna karşı (telefon ve sayı hariç)
      return /["\\r\\n]/.test(s) || s.indexOf(a) !== -1 ? '"' + s.replace(/"/g, '""') + '"' : s;
    }
    var satirlar = [bas.map(hucre).join(a)];
    kayitlar.forEach(function (k) { satirlar.push(bas.map(function (b) { return hucre(k[b]); }).join(a)); });
    return (bom ? "﻿" : "") + satirlar.join("\\r\\n") + "\\r\\n";
  }
};
` },
    ],
  },
  {
    id: "gosterge-paneli-tasarimi", ad: "gosterge-paneli-tasarimi", baslik: "Grafik seçimi ve gösterge paneli tasarımı", kategori: "veri", simge: "/gercek/panel/gal-gpt-5.webp",
    aciklama: "Bir yönetim paneli, satış raporu, analitik ekranı ya da KPI özet sayfası tasarlarken, veriye ve soruya uygun grafik türünü seçerken ve grafikleri okunur kılarken kullan: çizgi, sütun, çubuk, dağılım, ısı haritası, huni ve KPI kartı seçimi, karşılaştırma tabanı, yerleşim ve okuma sırası, süzgeçler, renk ve eksen kuralları, Türkçe sayı ve tarih biçimi, yükleniyor, boş ve hata durumları, Chart.js, Recharts ya da SVG ile uygulama ve Vayra Veri'den özet çekme. Kullanıcı 'dashboard', 'gösterge paneli', 'grafik ekle', 'rapor ekranı', 'admin panel' ya da 'KPI' dediğinde kullan.",
    ornekler: ["Mağazam için satış paneli yap", "Bu veriye hangi grafik uygun?", "Yönetim panelimdeki grafikleri daha okunur yap"],
    govde: `# Grafik seçimi ve gösterge paneli tasarımı

Amaç: panele bakan kişi 5 saniyede durumu anlar, 30 saniyede nedenine iner. Her grafik bir soruyu yanıtlar; yanıtlamıyorsa kaldırılır.

## Önce topla
- Paneli kim, ne sıklıkla kullanıyor (sahip her sabah, operasyon ekibi gün boyu)
- Yanıtlanacak 3 ile 5 soru ("bu hafta satış geçen haftadan iyi mi", "hangi kanal getiriyor")
- Veri kaynağı, güncellenme sıklığı ve varsayılan zaman aralığı
- Karşılaştırma tabanı: önceki dönem, hedef, geçen yılın aynı dönemi

## Grafik seçimi
| Soru | Grafik |
|---|---|
| Zaman içinde nasıl değişti | Çizgi (en çok 4 ile 5 seri); az sayıda dönem ve toplam tutar için sütun |
| Hangi kategori büyük | Yatay çubuk, büyükten küçüğe sıralı |
| Bütünün parçaları | Yığılmış çubuk ya da yüzdeli tek çubuk; pasta yalnız 2 ile 3 dilim ve tek an için |
| İki ölçü ilişkili mi | Dağılım grafiği |
| Değerler nasıl dağılıyor | Histogram ya da kutu grafiği |
| Gün ve saat yoğunluğu | Isı haritası |
| Adım adım nerede kayıp var | Huni ya da sıralı çubuk |
| Tek sayı ve değişimi | KPI kartı ve küçük çizgi (sparkline) |
| Hedefe ne kadar kaldı | Mermi grafiği ya da ilerleme çubuğu |

## Yerleşim
1. **Üst satır**: 3 ile 5 KPI kartı: değer, önceki döneme göre değişim ve küçük çizgi. Değişimi yalnız renkle değil kelimeyle de ver: "geçen haftadan yüzde 12 fazla".
2. **Orta**: ana trend grafiği tam genişlikte.
3. **Alt**: kırılımlar (kategori, kanal, şehir) ve ayrıntı tablosu.
4. **Okuma sırası**: önemli olan solda ve yukarıda.
5. **Süzgeç çubuğu**: üstte tarih aralığı ve en çok 2 ile 3 süzgeç; bütün grafiklere uygulanır, seçim adreste saklanır ki bağlantı paylaşılabilsin.

## Grafik kuralları
- Sütun ve çubukta eksen sıfırdan başlar; çizgide başlamak zorunda değil ama eksen açıkça etiketlenir.
- Başlık sonucu söyler: "Kasımda satışlar yüzde 18 arttı"; alt başlık birimi ve aralığı verir.
- Renk: tek vurgu rengi ve griler; kategorik renk en çok 6 ile 8. Kırmızı yeşil zıtlığına dayanma, etiketle destekle. Açık ve koyu temada aynı anlam korunur (karanlik-mod-belirtecler yeteneği).
- Mümkünse çizginin ucuna doğrudan etiket koy, ayrı lejant arama gerektirir. Izgara çizgileri silik; üç boyut, gölge ve gradyan yok.
- Sayılar Türkçe biçimde: 1.250.000 ₺ ya da 1,25 milyon ₺; tarih "5 Kas". Intl.NumberFormat ve Intl.DateTimeFormat ile tr-TR kullan.
- Araç ipucunda tam değer, tarih ve karşılaştırma görünür.
- Her grafiğin yükleniyor iskeleti, boş durumu ("Bu aralıkta sipariş yok") ve hata durumu olur.
- Mobilde kartlar alt alta dizilir; geniş tablo yatay kaydırılır ya da kart görünümüne geçer.

## Uygulama
- Basit panelde Chart.js ya da hafif SVG; React projesinde Recharts. Gruplama ve toplamayı mümkünse sunucuda yap, tarayıcı yalnız çizsin.
- Vayra Veri'den \`vayra.veri.liste\` ile çek ve günlere göre topla. Kayıt sayısı binleri aşıyorsa zamanlanmış Bulut fonksiyonuyla her gece özet tabloya yaz, panel özetten okusun.
- Canlı panelde (sipariş ekranı) yenileme döngüsü yazma; \`vayra.veri.izle\` kullan.

\`\`\`js
const tl = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
new Chart(document.getElementById("satis"), {
  type: "line",
  data: { labels: gunler, datasets: [{ label: "Satış", data: tutarlar, borderColor: "#0e7490", borderWidth: 2, tension: 0.3, pointRadius: 0 }] },
  options: {
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => tl.format(c.parsed.y) } } },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v) => tl.format(v) }, grid: { color: "rgba(127,127,127,.15)" } },
      x: { grid: { display: false } },
    },
  },
});
\`\`\`

## Çıktı
| Soru | Ölçü | Grafik | Süzgeç | Veri kaynağı | Güncellenme |
|---|---|---|---|---|---|
| Satış artıyor mu | Günlük ciro | Çizgi | Tarih, kanal | siparisler | Canlı |

Planı onaylattıktan sonra paneli yaz.

## Yapma
- Beşten fazla dilimli ya da zaman serisi gösteren pasta grafiği.
- İki farklı birimi tek grafikte çift y ekseniyle gösterme; iki grafik kullan.
- Karşılaştırma tabanı olmadan çıplak sayı gösterme.
- Her şeyi ilk ekrana sığdırmaya çalışma; ayrıntı alt bölümde.
- Grafiği ham kayıtlarla tarayıcıda her açılışta baştan hesaplama.`,
    dosyalar: [],
  },
  {
    id: "site-tasima-301", ad: "site-tasima-301", baslik: "Site taşıma ve 301 yönlendirme planı", kategori: "web", simge: "/gercek/panel/gal-seedance-1.webp",
    aciklama: "Bir siteyi yeni alan adına, yeni altyapıya (WordPress, Wix, Shopify, Ticimax ya da İdeasoft'tan Vayra'ya), yeni adres yapısına veya HTTPS'e taşırken ya da sayfaları birleştirip silerken arama trafiğini kaybetmemek için kullan: eski adres envanteri, eski ve yeni adres eşleme tablosu, 301 ile 410 seçimi, zincir ve döngü kontrolü, kanonik adres, site haritası, Search Console adres değişikliği ve taşıma sonrası izleme. Eşleme önerip Netlify, Next.js, nginx ya da Apache kuralı üreten betik içerir. Kullanıcı 'siteyi taşı', 'domain değiştir', 'yönlendirme', '301', 'eski linkler' ya da '404 hataları' dediğinde kullan.",
    ornekler: ["WordPress sitemi Vayra'ya taşıyorum, eski linkler ne olacak?", "Eski adreslerden yenilere yönlendirme listesi çıkar", "Alan adımı değiştiriyorum, SEO'yu nasıl korurum?"],
    govde: `# Site taşıma ve 301 yönlendirme planı

Amaç: taşımadan sonra her eski bağlantı tek adımda en yakın yeni karşılığına gitsin; arama sıralaması, paylaşılmış bağlantılar ve basılı QR kodları çalışmaya devam etsin.

## Önce topla
- Eski sitenin bütün adresleri: site haritası, Search Console sayfalar raporu, analitikte trafik alan sayfalar, dış bağlantı alan sayfalar
- Yeni sitenin adres listesi
- Alan adı değişiyor mu; HTTPS ve www tercihi ne
- Kampanyalarda, broşürlerde ve QR kodlarda basılı adresler
- Barındırma: Vayra yayını, Netlify, Vercel, nginx, Apache

## Adımlar
1. **Envanter**: eski adresleri tek listede topla; her birinin son 12 ay trafiği ve dış bağlantı sayısı yanına yazılsın. Trafik ya da bağlantı alan adresler önceliklidir.
2. **Eşle**: her eski adres için konu olarak en yakın yeni sayfa.
   - Birebir karşılığı varsa ona 301.
   - Sayfa başka sayfayla birleştiyse birleşen sayfaya 301.
   - Karşılığı yok ama değeri varsa en yakın kategori sayfasına 301.
   - Karşılığı ve değeri yoksa 410 (kalıcı olarak kaldırıldı).
   - Hepsini ana sayfaya yönlendirme; Google bunu soft 404 sayar.
3. **Kalıp kuralları**: aynı yapıdaki yüzlerce adres için tek kural yaz (ön ek değişimi gibi), sonra kuralın yakaladığı adresleri listeyle karşılaştır.
4. **Zincir ve döngü bırakma**: A adresi B'ye, B de C'ye gidiyorsa A'yı doğrudan C'ye bağla. Eski taşımalardan kalan yönlendirmeleri de güncelle.
5. **Sorgu parametreleri**: utm ve kampanya parametreleri korunur; sıralama ve oturum parametreleri atılır.
6. **Yeni sitede**: kanonik adresler yeni adresleri gösterir; iç bağlantılar doğrudan yeni adrese gider (yönlendirmeden geçmez); site haritasında yalnız yeni adresler; robots.txt yeni siteyi engellemez; hreflang ve yapılandırılmış verideki adresler güncel.
7. **Yayın günü**: yönlendirmeleri aynı anda aç. Alan adı değiştiyse iki mülkü de Search Console'da doğrula ve Adres değişikliği aracını kullan. Eski alan adını en az bir yıl, tercihen kalıcı olarak yenile ve yönlendirmede tut.
8. **İzle**: ilk iki hafta her gün, sonra haftada bir: 404 raporu, tarama hataları, trafik ve sıralama karşılaştırması. Yeni çıkan 404'leri eşleme tablosuna ekle.

## Yönlendirme biçimleri
\`\`\`text
# Netlify ve Cloudflare Pages: _redirects dosyası
/hakkimizda.html     /hakkimizda           301
/urun/*              /urunler/:splat       301
\`\`\`

\`\`\`js
// Next.js: next.config.mjs (permanent true, 308 döner; Google bunu 301 gibi değerlendirir)
export default {
  async redirects() {
    return [
      { source: "/hakkimizda.html", destination: "/hakkimizda", permanent: true },
      { source: "/urun/:yol*", destination: "/urunler/:yol*", permanent: true },
    ];
  },
};
\`\`\`

\`\`\`nginx
location = /hakkimizda.html { return 301 /hakkimizda$is_args$args; }
location = /eski-kampanya { return 410; }
\`\`\`

\`\`\`apache
RedirectMatch 301 ^/hakkimizda\\.html$ /hakkimizda
RedirectMatch 410 ^/eski-kampanya$
\`\`\`

## Betik
\`scripts/site-tasima-301.js\` eski ve yeni adres listelerinden eşleme tablosu önerir: Türkçe harfli adresleri ve uzantıları (html, php) normalleştirir, son parça ve kelime benzerliğiyle eşler, elle verilen eşlemeleri öncelikli alır, zincirleri çözer, döngüleri bildirir ve seçilen biçimde kural üretir.

\`\`\`json
{
  "eski": ["https://eskisite.com/hakkımızda.html", "/urun/123-kahve-fincani", "/blog/2023/latte-nasil-yapilir", "/iletisim.php", "/eski-kampanya"],
  "yeni": ["/hakkimizda", "/urunler/kahve-fincani", "/blog/latte-nasil-yapilir", "/iletisim"],
  "elle": { "/kampanya-2024": "/kampanyalar" },
  "bicim": "nginx",
  "eslesmeyen": "410"
}
\`\`\`

bicim: netlify, nginx, apache, next, vercel ya da csv. eslesmeyen 410 ise eşleşmeyen adresler için 410 kuralı yazılır (Netlify ve Next biçiminde elle410 listesine düşer). Dönüş: eslesmeler (eski, yeni, guven, yontem), elleKontrolEt (güveni 0.6'nın altındakiler), eslesmeyen, degismeyen, zincirler, donguler, kurallar ve ozet. Güveni düşük eşlemeleri kullanıcıya tabloyla onaylat.

## Çıktı
| Eski adres | Yeni adres | Kod | Trafik | Yöntem | Not |
|---|---|---|---|---|---|
| /hakkımızda.html | /hakkimizda | 301 | 820 | birebir | |
| /eski-kampanya | | 410 | 3 | | süresi bitti |

## Yapma
- Kalıcı taşımada 302 kullanma.
- Bütün eski adresleri ana sayfaya yönlendirme.
- Yönlendirmeleri birkaç ay sonra kaldırma.
- Yeni siteyi robots.txt ya da noindex engeliyle yayına alma.
- Sunucu yönlendirmesi mümkünken JavaScript ya da meta refresh ile yönlendirme.`,
    dosyalar: [
      { yol: "scripts/site-tasima-301.js", icerik: `// Eski ve yeni adres listelerinden 301 eşleme tablosu önerir, elle verilen eşlemeleri öncelikli alır,
// zincir ve döngüleri çözer, sunucu biçimine göre yönlendirme kuralları üretir.
// Girdi: { eski: [adres], yeni: [adres], elle: { eski: yeni }, bicim: "netlify" | "nginx" | "apache" | "next" | "vercel" | "csv",
//          esik: 0.34, eslesmeyen: "410" | "liste" }
module.exports = function (girdi, vayra) {
  var g = girdi || {};
  var eskiListe = (g.eski || []).map(yolu).filter(Boolean);
  var yeniListe = (g.yeni || []).map(yolu).filter(Boolean);
  var elle = {};
  Object.keys(g.elle || {}).forEach(function (k) { elle[yolu(k)] = yolu(g.elle[k]); });
  var esik = typeof g.esik === "number" ? g.esik : 0.34;
  var DURAK = { ve: 1, ile: 1, icin: 1, bir: 1, en: 1, de: 1, da: 1, the: 1, and: 1, of: 1, for: 1, a: 1, index: 1, sayfa: 1, page: 1 };

  function yolu(adres) {
    if (!adres) return "";
    var s = String(adres).trim().replace(/^https?:\\/\\/[^\\/]+/i, "");
    s = s.split("#")[0];
    if (s.charAt(0) !== "/") s = "/" + s;
    return s;
  }
  function cevir(s) {
    try { s = decodeURIComponent(s); } catch (h) { }
    return s.replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase()
      .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
      .replace(/â/g, "a").replace(/î/g, "i").replace(/û/g, "u");
  }
  function normal(yol) {
    var s = cevir(yol.split("?")[0]);
    s = s.replace(/\\/(index|default)\\.(html?|php|aspx?)$/, "/").replace(/\\.(html?|php|aspx?|jsp)$/, "");
    s = s.replace(/[^a-z0-9\\/]+/g, "-").replace(/-+/g, "-").replace(/\\/-|-\\//g, "/").replace(/\\/+/g, "/");
    if (s.length > 1) s = s.replace(/\\/$/, "");
    return s || "/";
  }
  function parcalar(yol) {
    return normal(yol).split(/[\\/-]/).filter(function (p) { return p && !/^\\d+$/.test(p) && !DURAK[p]; });
  }
  function sonParca(yol) {
    var p = normal(yol).split("/").pop();
    return p.replace(/^\\d+-/, "").replace(/-\\d+$/, "");
  }
  function benzerlik(a, b) {
    var pa = parcalar(a), pb = parcalar(b);
    if (!pa.length && !pb.length) return 1;
    var kume = {}, kesisim = 0, birlesim = {};
    pa.forEach(function (p) { kume[p] = 1; birlesim[p] = 1; });
    pb.forEach(function (p) { if (kume[p] === 1) { kesisim++; kume[p] = 2; } birlesim[p] = 1; });
    var j = kesisim / Object.keys(birlesim).length;
    var sa = sonParca(a), sb = sonParca(b);
    if (sa && sa === sb) j = Math.max(j, 0.9);
    return Math.round(j * 100) / 100;
  }

  var yeniNormal = {};
  yeniListe.forEach(function (y) { yeniNormal[normal(y)] = y; });

  var eslesmeler = [], eslesmeyen = [], ayni = [];
  var gorulen = {};
  eskiListe.forEach(function (e) {
    if (gorulen[e]) return;
    gorulen[e] = true;
    if (elle[e]) { eslesmeler.push({ eski: e, yeni: elle[e], guven: 1, yontem: "elle" }); return; }
    if (yeniListe.indexOf(e) !== -1) { ayni.push(e); return; }
    var n = normal(e);
    if (yeniNormal[n]) { eslesmeler.push({ eski: e, yeni: yeniNormal[n], guven: 1, yontem: "birebir" }); return; }
    var enIyi = null, enIyiPuan = 0;
    yeniListe.forEach(function (y) {
      var p = benzerlik(e, y);
      if (p > enIyiPuan) { enIyiPuan = p; enIyi = y; }
    });
    if (enIyi && enIyiPuan >= esik) eslesmeler.push({ eski: e, yeni: enIyi, guven: enIyiPuan, yontem: enIyiPuan >= 0.9 ? "son-parca" : "benzerlik" });
    else eslesmeyen.push({ eski: e, enYakin: enIyi, puan: enIyiPuan });
  });
  Object.keys(elle).forEach(function (e) {
    if (!gorulen[e]) { gorulen[e] = true; eslesmeler.push({ eski: e, yeni: elle[e], guven: 1, yontem: "elle" }); }
  });

  // Zincir ve döngü çözümü: hedef başka bir kuralın kaynağıysa son hedefe bağla.
  var harita = {};
  eslesmeler.forEach(function (m) { harita[m.eski] = m.yeni; });
  var zincirler = [], donguler = [];
  eslesmeler.forEach(function (m) {
    var yol = [m.eski], hedef = m.yeni, adim = 0;
    while (harita[hedef] && adim < 20) {
      if (yol.indexOf(hedef) !== -1) { donguler.push(yol.concat(hedef)); hedef = null; break; }
      yol.push(hedef); hedef = harita[hedef]; adim++;
    }
    if (hedef === null) { m.yeni = null; m.yontem = "dongu"; return; }
    if (yol.length > 1) { zincirler.push(yol.concat(hedef)); m.yeni = hedef; m.zincirCozuldu = true; }
    if (normal(m.eski) === normal(hedef) && m.eski === hedef) m.yeni = null;
  });
  var gecerli = eslesmeler.filter(function (m) { return m.yeni; });
  if (yeniListe.length) gecerli.forEach(function (m) {
    if (yeniListe.indexOf(m.yeni.split("?")[0]) === -1 && m.yontem === "elle") m.uyari = "Hedef yeni adres listesinde yok";
  });

  var bicim = g.bicim || "netlify";
  var kurallar = [];
  function rx(s) { return s.replace(/[.*+?^$()|[\\]\\\\{}]/g, "\\\\$&"); }
  gecerli.forEach(function (m) {
    if (bicim === "nginx") kurallar.push("location = " + m.eski.split("?")[0] + " { return 301 " + m.yeni + "$is_args$args; }");
    else if (bicim === "apache") kurallar.push("RedirectMatch 301 ^" + rx(m.eski.split("?")[0]) + "$ " + m.yeni);
    else if (bicim === "next" || bicim === "vercel") kurallar.push(JSON.stringify({ source: m.eski.split("?")[0], destination: m.yeni, permanent: true }));
    else if (bicim === "csv") kurallar.push(m.eski + "," + m.yeni + ",301," + m.guven);
    else kurallar.push(m.eski + "  " + m.yeni + "  301");
  });
  var elle410 = [];
  if (g.eslesmeyen === "410") eslesmeyen.forEach(function (e) {
    if (bicim === "nginx") kurallar.push("location = " + e.eski.split("?")[0] + " { return 410; }");
    else if (bicim === "apache") kurallar.push("RedirectMatch 410 ^" + rx(e.eski.split("?")[0]) + "$");
    else if (bicim === "csv") kurallar.push(e.eski + ",,410,");
    else elle410.push(e.eski); // bu biçimde 410 kuralı yok; sunucuda ya da barındırma panelinde tanımlanır
  });
  if (bicim === "next" || bicim === "vercel") kurallar = ["[\\n  " + kurallar.join(",\\n  ") + "\\n]"];
  if (bicim === "csv") kurallar.unshift("eski,yeni,kod,guven");

  return {
    eslesmeler: eslesmeler,
    elleKontrolEt: gecerli.filter(function (m) { return m.guven < 0.6; }).map(function (m) { return m.eski + " sonra " + m.yeni + " (" + m.guven + ")"; }),
    eslesmeyen: eslesmeyen,
    degismeyen: ayni,
    zincirler: zincirler,
    donguler: donguler,
    kurallar: kurallar.join("\\n"),
    elle410: elle410,
    ozet: gecerli.length + " yönlendirme, " + eslesmeyen.length + " eşleşmeyen, " + ayni.length + " değişmeyen adres, " + zincirler.length + " zincir çözüldü, " + donguler.length + " döngü"
  };
};
` },
    ],
  },
];
