import type { KatalogYetenek } from "./yetenekKatalog";

/** Pazarlama, içerik, marka, müşteri hizmetleri ve iş operasyonu yetenekleri. */
export const YETENEKLER_PAZARLAMA: KatalogYetenek[] = [
  {
    id: "sosyal-medya-gonderisi", ad: "sosyal-medya-gonderisi", baslik: "Sosyal medya gönderisi ve karusel metni", kategori: "icerik", simge: "/gercek/panel/gal-pazarlama-0.webp",
    aciklama: "Instagram, LinkedIn, X ya da TikTok için tek bir gönderi, kaydırmalı karusel slaytlarının metni, gönderi açıklaması, etiketler ve görsel tarifi yazarken kullan. Platformun karakter sınırını, açıklamanın kesildiği noktayı, etiket kuralını, görsel oranını ve platforma özgü tonu uygular; kanca seçenekleri üretir. 'Gönderi yaz', 'karusel hazırla', 'post metni', 'caption', 'LinkedIn paylaşımı', 'tweet at', 'flood yaz', 'TikTok açıklaması' gibi isteklerde kullan. Haftalık ya da aylık plan istenirse icerik-takvimi yeteneğine geç; bu yeteneği tek tek gönderiyi yazarken kullan.",
    ornekler: ["Yeni kahve çekirdeğimiz için Instagram karuseli yaz", "Bu blog yazısından LinkedIn paylaşımı çıkar", "Kampanyamızı X için kısa bir flooda çevir"],
    govde: `# Sosyal medya gönderisi ve karusel metni

Bu yetenek tek bir gönderiyi yayına hazır hâle getirir: kanca, gövde, eylem çağrısı, etiketler, slayt slayt karusel metni ve görsel tarifi. Her platformun okuma alışkanlığı farklıdır; aynı metni dört platforma kopyalama, her biri için ayrı sürüm yaz.

## Önce topla
Eksikse en çok iki soruda sor:
- Platform ya da platformlar
- Gönderinin tek amacı: kaydetme, yorum, profil ziyareti, bağlantı tıklaması ya da satış
- Konu, ürün ya da duyuru; varsa somut rakam, tarih, fiyat
- Marka tonu ve hitap (sen ya da siz); marka kılavuzu varsa oradan al
- Ücretli ya da hediye ürünlü iş birliği mi? Öyleyse influencer-is-birligi yeteneğindeki reklam ibaresi kuralı geçerli

## Adımlar
1. **Tek fikir seç.** Bir gönderi bir şey söyler. İki fikir varsa iki gönderi öner.
2. **Kancayı yaz.** Açıklamanın kesildiği yerden önce okunan kısım kancadır (sınırlar references/platform-sinirlari.md içinde). Üç seçenek üret: merak (soru ya da yarım bilgi), fayda (somut sonuç), karşı görüş (yaygın bir yanlışı düzelt).
3. **Gövdeyi kur.** Kısa paragraflar, satır başına bir düşünce. Somut ayrıntı ve rakam, genel övgüden her zaman iyidir.
4. **Çağrıyı tek eyleme bağla.** "Kaydet, sonra lazım olur", "Yorumlara şehrini yaz", "Bağlantı profilde". Aynı gönderide üç ayrı çağrı olmaz.
5. **Etiketleri seç.** Konuyu tarif eden ve gerçekten aranan etiketler; marka etiketi bir tane. Sayı platform kuralına uysun.
6. **Görsel tarifini yaz.** Oran, ana nesne, metin yerleşimi, marka renkleri. Görsel üretilecekse bu tarif doğrudan istem olur.

## Karusel kuralları
- 1. slayt: büyük başlık, en çok 8 kelime; kaydırmak için neden versin ("7 hata, 4. en pahalısı").
- 2. slayt: sorunu ya da vaadi netleştir.
- Ara slaytlar: her slaytta tek madde, en çok 25 ile 30 kelime; numaralı ilerle.
- Son slayt: kısa özet ve tek çağrı (kaydet, paylaş, takip et ya da bağlantı).
- Telefonda okunurluk: 1080 piksel genişlikte başlık en az 60 px, gövde en az 32 px.
- LinkedIn karuseli PDF belge olarak yüklenir; slaytları kare ya da 4:5 hazırla.

## Platform tonu
- **Instagram**: görsel önce gelir; açıklama sohbet eder; emoji ölçülü.
- **LinkedIn**: birinci tekil kişi, deneyim ve öğrenilen ders; dış bağlantıyı ilk yoruma koymayı öner.
- **X**: tek cümle güçtür; flood yazılıyorsa her gönderi tek başına anlaşılır, ilk gönderi bütün diziyi satar.
- **TikTok**: asıl kanca videonun ilk karesindeki yazıdır; açıklama kısa, aranan kelimeler açıklamada geçsin.

## Çıktı biçimi
Her platform için şu blok:

**Platform ve format:** Instagram karusel, 4:5, 8 slayt
**Kanca seçenekleri:** 1) ... 2) ... 3) ...
**Açıklama:** tam metin, satır kırılımlarıyla
**Etiketler:** #... #...
**Slaytlar:**

| No | Başlık | Metin | Görsel tarifi |
|---|---|---|---|
| 1 | ... | ... | ... |

**Ölçülecek:** kaydetme ve paylaşım sayısı (amaca göre)

## Yapma
- Etkileşim dilenen kalıplar ("herkese gönder", "beğenmeden geçme") kullanma.
- Doğrulanmamış rakam ya da "Türkiye'nin en iyisi" gibi kanıtsız üstünlük iddiası yazma.
- Alakasız popüler etiket yığma.
- Ücretli ya da hediye ürünlü içerikte reklam ibaresini atlama.
- Instagram açıklamasına bağlantı koyup tıklanacağını varsayma; açıklamadaki bağlantı tıklanmaz.`,
    dosyalar: [{ yol: "references/platform-sinirlari.md", icerik: `# Platform sınırları (2026 sonu)

Platformlar sınırları sık değiştirir. Kesin değeri yayından önce uygulamanın kendisinde kontrol et ve kullanıcıya da bunu söyle.

## Instagram
- Açıklama en çok 2.200 karakter; akışta yaklaşık ilk 125 karakter görünür, sonrası "devamı" ile açılır.
- Etiket: Instagram 2025 sonunda gönderi başına etiket sayısını 5 ile sınırladı; 3 ile 5 alakalı etiket yeterli.
- Karusel en çok 20 görsel ya da video.
- Oran: akış gönderisi 4:5 (1080x1350) ya da 3:4 (1080x1440); Reels ve hikâye 9:16 (1080x1920). Profil ızgarası dikey kırpar; önemli öğeyi ortada tut.
- Reels 3 dakikaya kadar.

## LinkedIn
- Gönderi en çok 3.000 karakter; ilk 2 ile 3 satır (yaklaşık 200 karakter) "daha fazla" bağlantısından önce görünür.
- Belge (PDF karusel) en çok 300 sayfa ve 100 MB; uygulamada 8 ile 12 slayt iyi çalışır.
- 3 ile 5 etiket.

## X (eski adıyla Twitter)
- Ücretsiz hesapta gönderi en çok 280 karakter; Türkçe karakterler tek sayılır, her bağlantı 23 karakter sayılır.
- Görsel 16:9 (1600x900) ya da 1:1; gönderi başına en çok 4 görsel.

## TikTok
- Açıklama en çok 4.000 karakter; akışta ilk satır görünür.
- Fotoğraf karuseli en çok 35 fotoğraf.
- Video 9:16 (1080x1920); alt kısma ve sağ kenara yazı koyma, arayüz düğmeleri orayı kapatır.
` }],
  },
  {
    id: "eposta-bulten-otomasyon", ad: "eposta-bulten-otomasyon", baslik: "E-posta bülteni ve otomasyon dizisi", kategori: "pazarlama", simge: "/gercek/panel/gal-pazarlama-1.webp",
    aciklama: "E-posta bülteni, tek seferlik kampanya e-postası ya da tetiklenen otomatik akış (hoş geldin dizisi, terk edilen sepet, satın alma sonrası, geri kazanma) yazarken ve kurgularken kullan. Konu satırı ve ön izleme metni seçenekleri, gönderim zamanlaması, segment, çıkış koşulu, İYS onayı ve teslim edilebilirlik kurallarını (SPF, DKIM, DMARC, tek tıkla abonelikten çıkma) uygular. 'Bülten yaz', 'newsletter', 'mail kampanyası', 'sepeti terk edenlere e-posta', 'hoş geldin maili', 'Klaviyo akışı', 'Mailchimp otomasyonu' gibi isteklerde kullan.",
    ornekler: ["Mağazam için terk edilen sepet e-posta dizisi kur", "Bu ayın bülteni için konu satırı seçenekleri yaz", "Yeni abonelere üç e-postalık hoş geldin dizisi hazırla"],
    govde: `# E-posta bülteni ve otomasyon dizisi

Amaç: açılan, okunan, tıklanan ve spam klasörüne düşmeyen e-postalar. Tek seferlik bülten ile tetiklenen otomatik dizileri aynı disiplinle yaz.

## Önce topla
- Gönderen adı (kişi mi marka mı) ve gönderen adresi
- Liste kaynağı ve onay durumu: alıcılar ticari ileti onayı verdi mi, onaylar İYS'ye kayıtlı mı (ayrıntı için iys-kvkk-ticari-ileti)
- Tek seferlik bülten mi, otomatik dizi mi; diziyse tetikleyici olay
- Teklif ya da içerik, indirim kodu ve geçerlilik tarihi
- Kullanılan araç (Klaviyo, Mailchimp, Brevo ya da kendi sunucusu) ve kullanılabilen kişiselleştirme alanları

## Tek e-postanın yapısı
1. **Konu satırı**: 30 ile 50 karakter; ilk 30 karakter mobilde kesin görünür. Üç seçenek yaz: fayda, merak, aciliyet (aciliyet yalnız gerçekse).
2. **Ön izleme metni**: 40 ile 90 karakter; konuyu tekrar etmez, tamamlar.
3. **Üst blok**: tek mesaj, tek görsel, tek düğme. Düğme metni eylem söyler: "Sepetime dön", "Rehberi indir".
4. **Gövde**: 50 ile 150 kelime, kısa paragraflar. Görseller kapalıyken de mesaj anlaşılsın; her görsele alt metin yaz.
5. **Alt bilgi**: ticari unvan, adres, iletişim, MERSİS numarası, tek tıkla ret bağlantısı ve alıcının bu e-postayı neden aldığı.

## Otomatik diziler
Konu, ön izleme ve gövde şablonları assets/akis-sablonlari.md içinde. Özet:
- **Hoş geldin (3 e-posta)**: hemen karşılama ve söz verilen hediye; 2. gün marka hikâyesi; 5. gün sosyal kanıt ve hatırlatma.
- **Terk edilen sepet (3 e-posta)**: 1 saat sonra hatırlatma (indirimsiz); 24 saat sonra itirazları gider (kargo, iade, güvenli ödeme); 72 saat sonra son hatırlatma, gerekiyorsa küçük teşvik.
- **Satın alma sonrası**: sipariş ve kargo bilgisi işlem iletisidir; yorum isteği ve çapraz satış ise ticari iletidir, onay ister.
- **Geri kazanma**: 90 gün etkileşimsiz alıcıya iki deneme; yanıt yoksa gönderim listesinden çıkar.
- Her diziye çıkış koşulu koy: alıcı satın aldıysa sepet dizisi hemen durur.

## Teslim edilebilirlik
- Gönderen alan adında SPF, DKIM ve DMARC kayıtları olsun; Gmail ve Yahoo toplu gönderenden bunu ister.
- List-Unsubscribe ve List-Unsubscribe-Post başlıklarıyla tek tıkla abonelikten çıkma sun. Gmail ret talebinin 2 gün içinde, İYS kuralı 3 iş günü içinde uygulanmasını ister; kısa olanı uygula.
- Spam şikâyet oranını binde 1'in altında tut; binde 3 düzeyine yaklaşırsan teslim düşer.
- Yeni alan adını yavaş ısıt: önce en etkileşimli alıcılar, hacmi haftalar içinde artır.
- Satın alınmış liste kullanma; onaysız adrese ticari e-posta Türkiye'de idari para cezası doğurur.

## Ölçüm
- Apple Mail gizlilik koruması açılma oranını şişirir; kararı tıklama, dönüşüm ve gelirle ver.
- Her dizi için e-posta başına tıklama, dönüşüm ve abonelikten çıkma oranını ayrı izle.

## Çıktı biçimi
Her e-posta için şu tablo, ardından tam metin:

| Alan | İçerik |
|---|---|
| Tetikleyici ve zamanlama | ... |
| Segment | ... |
| Konu seçenekleri | 1) ... 2) ... 3) ... |
| Ön izleme metni | ... |
| Düğme metni | ... |
| Çıkış koşulu | ... |
| Ölçülecek | ... |

## Yapma
- Konu satırında yanıltıcı "Ynt:" ya da "İlet:" kullanma.
- Büyük harfle bağıran konu ya da art arda ünlem yazma.
- Tek büyük görselden oluşan e-posta hazırlama.
- Kargo ya da fatura gibi bilgilendirme iletisinin içine reklam sıkıştırma; bu, iletiyi ticari ileti yapar.`,
    dosyalar: [{ yol: "assets/akis-sablonlari.md", icerik: `# Otomatik akış şablonları

Köşeli parantezli alanları doldur. Konu seçeneklerinden birini kullan, ötekini A/B testine ayır.

## Hoş geldin dizisi

### 1. e-posta: kayıttan hemen sonra
- Konu: "Hoş geldin [ad], söz verdiğimiz [hediye] burada" ya da "[Marka] ailesine katıldın"
- Ön izleme: "Kodun 7 gün geçerli; nereden başlayacağını da yazdık."
- Gövde: tek cümle teşekkür, büyük ve kopyalanabilir kod, markanın tek cümlelik vaadi, en çok satan 3 ürün ya da başlangıç rehberi.
- Düğme: "Kodumu kullan"

### 2. e-posta: 2. gün
- Konu: "[Marka] neden var?" ya da "[Kurucu adı] anlatıyor: ilk [ürün] nasıl doğdu"
- Gövde: kısa kuruluş hikâyesi, üretim ya da hizmet farkı, bir müşteri yorumu.
- Düğme: "Hikâyenin devamı"

### 3. e-posta: 5. gün
- Konu: "Kodunun bitmesine 2 gün kaldı" (yalnız gerçekten öyleyse)
- Gövde: 3 müşteri yorumu ya da puan, en sık 3 soru (kargo, iade, ödeme), kod hatırlatması.
- Düğme: "Alışverişe başla"
- Çıkış: alıcı satın aldıysa bu e-posta gitmez, satın alma sonrası akışa geçer.

## Terk edilen sepet dizisi
Önce kontrol: alıcının ticari ileti onayı ve İYS kaydı var mı? Yoksa dizi o alıcı için çalışmaz.

### 1. e-posta: 1 saat sonra
- Konu: "Sepetinde bir şey unuttun" ya da "[Ürün adı] seni bekliyor"
- Ön izleme: "Sepetini senin için sakladık."
- Gövde: ürün görseli, adı, seçilen beden ya da renk, fiyat; tek düğme. İndirim yok.
- Düğme: "Sepetime dön"

### 2. e-posta: 24 saat sonra
- Konu: "Aklında bir soru mu kaldı?"
- Gövde: en sık üç itirazın yanıtı (kargo ücreti ve süresi, 14 gün iade, güvenli ödeme ve taksit), bir müşteri yorumu, destek iletişim yolu.
- Düğme: "Sepetimi tamamla"

### 3. e-posta: 72 saat sonra
- Konu: "Sepetini bir süre daha tutuyoruz" ya da "Son hatırlatma: [ürün]"
- Gövde: stok gerçekten azsa belirt. Küçük teşvik (ücretsiz kargo ya da kısa süreli kod) yalnız kâr marjı izin veriyorsa ve her sepette verilmiyorsa; aksi hâlde müşteri sepeti bilerek terk etmeyi öğrenir.
- Düğme: "Sepetime git"
- Çıkış: satın alma olursa dizi hemen durur; aynı alıcıya 30 gün içinde ikinci sepet dizisi başlatma.
` }],
  },
  {
    id: "google-meta-reklam-metni", ad: "google-meta-reklam-metni", baslik: "Google ve Meta reklam metni", kategori: "pazarlama", simge: "/gercek/panel/gal-pazarlama-2.webp",
    aciklama: "Google Ads (duyarlı arama reklamı, Performance Max, site bağlantısı ve açıklama uzantıları) ile Meta (Facebook ve Instagram) reklamları için başlık, açıklama ve birincil metin yazarken kullan. Her varlığın karakter sınırını sayar, anahtar kelime ile açılış sayfası teklifini eşler, farkındalık düzeyine göre farklı açılar üretir ve Türkiye'deki ticari reklam kurallarını (indirim öncesi fiyat, kanıtsız üstünlük iddiası, sağlık beyanı, karşılaştırmalı reklam) denetler. 'Google reklamı yaz', 'arama reklamı başlıkları', 'Meta reklam metni', 'Instagram sponsorlu gönderi', 'reklam başlığı öner' gibi isteklerde kullan.",
    ornekler: ["Diş kliniğim için Google arama reklamı başlıkları yaz", "Yeni koleksiyon için üç farklı açıdan Meta reklam metni hazırla", "Bu reklam metni Türkiye kurallarına uygun mu, kontrol et"],
    govde: `# Google ve Meta reklam metni

Reklam metni, dar bir karakter sınırı içinde tek bir tıklama nedeni verir. Bu yetenek her varlığı kendi sınırına göre yazar, karakteri sayar ve yasal açıdan riskli ifadeleri ayıklar.

## Önce topla
- Ürün ya da hizmet, açılış sayfası ve o sayfadaki teklif
- Arama için hedef anahtar kelimeler; Meta için hedef kitle ve farkındalık düzeyi
- Ayırt edici özellikler: fiyat, kargo, garanti, teslim süresi, yerel varlık
- Kampanya hedefi: satış, potansiyel müşteri, arama, mağaza ziyareti
- Kanıtlanabilir iddialar ve belgesi (ödül, müşteri sayısı, test sonucu)

## Google duyarlı arama reklamı
1. 15 başlık yaz, her biri en çok 30 karakter: 3 ile 5 tanesi anahtar kelimeyi içersin, 3'ü fayda, 2'si teklif ya da fiyat, 2'si güven (garanti, yorum puanı), 2'si eylem çağrısı, 1'i marka adı.
2. 4 açıklama yaz, her biri en çok 90 karakter. Her açıklama tek başına anlamlı olsun; başlıklar hangi sırayla birleşirse birleşsin cümle bozulmasın.
3. Görünen yol: iki alan, her biri en çok 15 karakter (kahve / cekirdek).
4. Sabitlemeyi az kullan: yalnız yasal ya da marka zorunluluğu olan başlığı 1. konuma sabitle; fazla sabitleme reklam gücünü düşürür.
5. Uzantılar: 4 site bağlantısı, 4 ile 6 açıklama metni, bir yapılandırılmış snippet; varsa fiyat ve konum uzantısı.

## Meta reklamı
1. Birincil metin: ilk 125 karakterde kanca ve fayda; uzun sürüm istenirse sosyal kanıtla sürdür.
2. Başlık: kısa ve somut (önerilen 27 ile 40 karakter); görselde yazanı tekrar etme.
3. Açıklama: birçok yerleşimde görünmez; önemli bilgiyi buraya koyma.
4. Farkındalık düzeyine göre üç açı yaz: sorunu henüz fark etmeyen, çözüm arayan, ürünü tanıyan ama karar vermemiş.
5. Görsel ya da video için ilk karede görünecek yazıyı ayrıca öner.

## Karakter sayımı
Her varlığın yanına karakter sayısını yaz; sınırı aşanı kısalt. Türkçe karakterler tek sayılır. Bütün sınırlar references/karakter-sinirlari.md içinde.

## Yasal denetim (Türkiye)
- İndirimli fiyat gösteriliyorsa indirim öncesi fiyat, indirimden önceki son 30 günde uygulanan en düşük fiyat olmalı.
- "En ucuz", "bir numara", "Türkiye'nin ilk" gibi üstünlük iddiaları belgelenebilir olmalı; belge yoksa çıkar ya da yumuşat.
- Fiyatlar vergiler dahil yazılır; "başlayan fiyatlarla" ifadesi yalnız o fiyattan gerçekten ürün varsa kullanılır.
- Gıda, takviye ve kozmetikte "tedavi eder", "zayıflatır" gibi sağlık beyanı yazma.
- Karşılaştırmalı reklamda karşılaştırma nesnel, ölçülebilir ve aynı ihtiyaca yönelik olmalı; rakibi kötüleyemezsin.
- Emin olmadığın kuralda kullanıcıya güncel Ticari Reklam ve Haksız Ticari Uygulamalar Yönetmeliği'ni ve Reklam Kurulu kararlarını kontrol etmesini öner.

## Çıktı biçimi

| Varlık | Metin | Karakter | Rol |
|---|---|---|---|
| Başlık 1 | ... | 28/30 | anahtar kelime |
| Açıklama 1 | ... | 84/90 | fayda ve çağrı |

Meta için her açıya ayrı blok: açı, birincil metin, başlık, ilk kare yazısı, görsel tarifi. Sonunda yasal denetimde değiştirilen ifadelerin kısa listesi.

## Yapma
- Bütün kelimeyi büyük harfle yazma, art arda ünlem ya da süs sembolü kullanma; Google reddeder.
- Açılış sayfasında olmayan teklifi reklama yazma.
- Kişisel özellik ima eden Meta metni yazma ("Borçların mı var?", "Kilolu musun?"); Meta reklam politikası bunu yasaklar.
- Bütün başlıkları birbirinin eşanlamlısı yapma; çeşitlilik yoksa sistem iyi birleşim kuramaz.`,
    dosyalar: [{ yol: "references/karakter-sinirlari.md", icerik: `# Reklam varlıkları karakter sınırları

Sınırlar platform tarafından değiştirilebilir; yayından önce reklam panelinin uyarılarını kontrol et.

## Google duyarlı arama reklamı

| Varlık | Sınır | Adet |
|---|---|---|
| Başlık | 30 | en az 3, en çok 15 |
| Açıklama | 90 | en az 2, en çok 4 |
| Görünen yol | 15 | 2 alan |
| Site bağlantısı metni | 25 | önerilen en az 4 |
| Site bağlantısı açıklama satırı | 35 | bağlantı başına 2 |
| Açıklama metni (callout) | 25 | önerilen 4 ile 6 |
| Yapılandırılmış snippet değeri | 25 | başlık başına en az 3 değer |

## Google Performance Max

| Varlık | Sınır | Adet |
|---|---|---|
| Başlık | 30 | 3 ile 15 |
| Uzun başlık | 90 | 1 ile 5 |
| Açıklama | 90 | 2 ile 5; en az biri 60 karakteri geçmesin |
| İşletme adı | 25 | 1 |

## Meta (Facebook ve Instagram)

| Varlık | Önerilen | Not |
|---|---|---|
| Birincil metin | 125 | daha uzunu yazılabilir ama kesilir |
| Başlık | 27 ile 40 | yerleşime göre kesilir |
| Açıklama | 27 ile 30 | birçok yerleşimde görünmez |

Görsel oranları: akış için 1:1 ya da 4:5, hikâye ve Reels için 9:16. Görselde yazıyı az tut, ana mesajı metne bırak.
` }],
  },
  {
    id: "reklam-ab-test-plani", ad: "reklam-ab-test-plani", baslik: "Reklam ve kampanya A/B test planı", kategori: "pazarlama", simge: "/gercek/panel/gal-pazarlama-3.webp",
    aciklama: "Reklam metni, görsel, açılış sayfası, e-posta konu satırı ya da teklif için A/B testi tasarlarken ve sonucunu yorumlarken kullan. Hipotez, tek birincil ölçüt, koruyucu ölçütler, varyant başına örneklem büyüklüğü, süre, bütçe bölüşümü, önceden yazılmış durma kuralı ve karar tablosu üretir; Google Ads denemeleri ve Meta A/B testi araçlarında kurulum adımlarını verir. 'A/B test', 'split test', 'hangi reklam daha iyi', 'test planı yap', 'sonuç anlamlı mı', 'kazanan varyant' gibi isteklerde kullan.",
    ornekler: ["Açılış sayfamdaki iki başlığı test etmek için plan yaz", "Bu iki reklamın sonucu anlamlı mı, yorumla", "Günde 800 ziyaretçiyle bu test kaç gün sürer?"],
    govde: `# Reklam ve kampanya A/B test planı

İyi bir test tek bir soruyu yanıtlar ve sonuç gelmeden önce hangi sonuçta ne yapılacağı bellidir. Bu yetenek planı yazar, örneklemi hesaplar ve sonucu dürüstçe yorumlar.

## Önce topla
- Test edilecek tek değişken (başlık, görsel, teklif, açılış sayfası, konu satırı)
- Mevcut dönüşüm oranı ya da tıklama oranı (son 30 gün)
- Günlük trafik ya da gösterim ve günlük bütçe
- Kazanan bulunursa ne yapılacağı (bütçe kaydırma, sayfayı değiştirme)

## Adımlar
1. **Hipotezi yaz.** "Başlıkta ücretsiz kargo vurgusu sepete ekleme oranını artırır, çünkü yorumlarda en sık itiraz kargo ücreti." Neden kısmı yoksa test bir şey öğretmez.
2. **Birincil ölçütü seç.** Tek ölçüt, iş sonucuna en yakın olan (satın alma, form gönderimi). Tıklama oranı yalnız metin testinde birincil olabilir. Bir ya da iki koruyucu ölçüt ekle: iade oranı, sepet tutarı, edinme maliyeti.
3. **En küçük anlamlı etkiyi belirle.** İş kararını değiştirecek en küçük göreli artış; çoğu zaman yüzde 10 ile 20.
4. **Örneklemi hesapla.** Yüzde 95 güven ve yüzde 80 güç için varyant başına gereken kişi sayısı kabaca şudur: 16 çarpı p çarpı (1 eksi p), bölü beklenen mutlak farkın karesi. Burada p mevcut orandır. Hazır tablo references/orneklem-tablosu.md içinde.
5. **Süreyi hesapla.** Toplam gereken kişi bölü günlük trafik; en az 7 gün ve tam haftalar (hafta içi ile hafta sonu davranışı farklıdır). 4 haftayı aşıyorsa daha büyük bir değişiklik test et ya da daha sık gerçekleşen bir ölçüt seç.
6. **Bölüşümü kur.** Trafik yarı yarıya, rastgele ve aynı dönemde. Önce A sonra B çalıştırmak test değildir.
7. **Durma kuralını önceden yaz.** Örneklem dolmadan sonucu ilan etme; her gün bakıp iyi göründüğü an durdurmak yanlış kazanan üretir.
8. **Sonucu yorumla.** Göreli fark, yüzde 95 güven aralığı, p değeri ve koruyucu ölçütler. Anlamlı değilse "fark bulunamadı" yaz, "B kaybetti" değil.

## Araçlarda kurulum
- **Google Ads**: Deneyler bölümünden özel deneme; trafik bölüşümü yüzde 50; duyarlı arama reklamında varlık testi için reklam varyasyonları.
- **Meta**: Reklam Yöneticisi içindeki A/B testi; kitleler çakışmasın diye aracın kendi bölüşümünü kullan, elle iki reklam seti açma.
- **Açılış sayfası**: sunucu tarafında ya da test aracıyla bölüşüm; aynı ziyaretçi her gelişte aynı varyantı görsün.
- **E-posta**: listenin yüzde 20'sine iki konu satırı, kazanan kalan yüzde 80'e; ölçüt açılma değil tıklama.

## Çıktı biçimi

| Alan | İçerik |
|---|---|
| Hipotez | ... |
| Değişken | ... |
| Birincil ölçüt | ... |
| Koruyucu ölçütler | ... |
| Mevcut oran | ... |
| En küçük anlamlı etki | ... |
| Varyant başına örneklem | ... |
| Süre | ... |
| Durma kuralı | ... |
| Karar | kazanırsa ..., fark yoksa ..., kaybederse ... |

Sonuç raporu: varyant, kişi, dönüşüm, oran, göreli fark, güven aralığı, karar. Hesabı göster; varsayımları yaz.

## Yapma
- Aynı anda birden çok değişkeni değiştirip hangisinin işe yaradığını iddia etme.
- Varyant başına 100'den az dönüşümle kesin hüküm verme.
- Test sürerken bütçeyi, hedeflemeyi ya da sayfayı değiştirme.
- Kampanya öğrenme aşamasındayken sonucu okuma.`,
    dosyalar: [{ yol: "references/orneklem-tablosu.md", icerik: `# Varyant başına gereken örneklem (kabaca)

Yüzde 95 güven ve yüzde 80 güç için hızlı hesap. Değerler varyant başınadır; toplam için ikiyle çarp. Kesin değer için iki oranlı güç hesabı yapan bir araç kullan.

| Mevcut oran | Göreli artış yüzde 10 | Göreli artış yüzde 20 | Göreli artış yüzde 30 |
|---|---|---|---|
| yüzde 1 | 158.400 | 39.600 | 17.600 |
| yüzde 2 | 78.400 | 19.600 | 8.700 |
| yüzde 3 | 51.700 | 12.900 | 5.750 |
| yüzde 5 | 30.400 | 7.600 | 3.400 |
| yüzde 10 | 14.400 | 3.600 | 1.600 |

## Nasıl okunur
Mevcut dönüşüm oranı yüzde 2 ve hedef göreli artış yüzde 20 ise (yüzde 2'den yüzde 2,4'e), her varyanta yaklaşık 19.600 ziyaretçi gerekir. Günde 1.000 ziyaretçi yarı yarıya bölünürse test yaklaşık 40 gün sürer; bu durumda daha büyük bir değişikliği test et ya da sepete ekleme gibi daha sık gerçekleşen bir ölçüt seç.

## Sonuç anlamlılığı (iki oranın karşılaştırması)
1. Her varyantın oranını hesapla: dönüşüm bölü kişi.
2. Ortak oranı hesapla: toplam dönüşüm bölü toplam kişi.
3. Standart hata: ortak oran çarpı (1 eksi ortak oran) çarpı (1 bölü n1 artı 1 bölü n2) ifadesinin karekökü.
4. z değeri: iki oranın farkı bölü standart hata. Mutlak değeri 1,96'yı geçiyorsa fark yüzde 95 güvenle anlamlıdır.
5. Göreli farkı ve güven aralığını mutlaka birlikte raporla.
` }],
  },
  {
    id: "influencer-is-birligi", ad: "influencer-is-birligi", baslik: "Influencer iş birliği brifi ve sözleşmesi", kategori: "pazarlama", simge: "/gercek/galeri/portre3.webp",
    aciklama: "Bir sosyal medya içerik üreticisiyle (influencer, fenomen, etkileyici, UGC üreticisi) iş birliği kurarken brif, teklif mesajı, içerik onay süreci, ölçüm planı ve sözleşme maddeleri hazırlarken kullan. Ticaret Bakanlığı Reklam Kurulu'nun sosyal medya etkileyicileri kılavuzuna göre Türkçe reklam ibaresini, hediye ürün bildirimini, kullanım hakkını, münhasırlığı, ödeme ve fesih maddelerini kapsar. 'Influencer brifi', 'fenomenle anlaşma', 'UGC iş birliği', 'reklam etiketi nasıl olmalı', 'sponsorlu içerik sözleşmesi' gibi isteklerde kullan.",
    ornekler: ["Cilt bakım ürünümüz için influencer brifi hazırla", "Fenomenle yapacağımız anlaşmaya hangi maddeler girmeli?", "Hediye ürün gönderdiğimiz hesap reklam etiketi kullanmalı mı?"],
    govde: `# Influencer iş birliği brifi ve sözleşmesi

Bu yetenek bir içerik üreticisiyle yapılan iş birliğini baştan sona yazılı hâle getirir: uygunluk kontrolü, brif, teklif mesajı, sözleşme maddeleri ve ölçüm. Sözleşme maddeleri şablondur; imzadan önce bir hukukçuya kontrol ettirmesini söyle.

## Önce topla
- Marka, ürün, kampanya amacı (farkındalık, satış, uygulama indirme), bütçe aralığı
- İçerik üreticisi: platform, kitle, ortalama izlenme ve etkileşim, önceki marka iş birlikleri
- Teslimatlar: format (Reels, hikâye, TikTok, YouTube entegrasyonu), adet, yayın tarihleri
- Karşılık: ücret, ürün, satış ortaklığı komisyonu ya da karma
- İçerik marka hesabında ya da ücretli reklamda kullanılacak mı

## Adımlar
1. **Uygunluğu denetle.** Kitlenin ülke, yaş ve ilgi dağılımı; sahte takipçi işaretleri (ani takipçi sıçraması, takipçiye göre çok düşük etkileşim, tekrar eden genel yorumlar). Medya kitini ve son 30 günün istatistik ekran görüntülerini iste.
2. **Brifi yaz.** assets/brif-ve-sozlesme.md şablonu: tek ana mesaj, en çok üç anlatım noktası, söylenmemesi gerekenler, zorunlu ibare, takvim. Senaryoyu kelime kelime dayatma; üreticinin kendi dilini koru, kitlesi onu bu dil için izliyor.
3. **Teklif mesajını yaz.** Kısa ve kişisel (son içeriklerinden birine somut atıf), teslimat ve karşılık açık, yanıt için tarih.
4. **Sözleşme maddelerini hazırla.** Aşağıdaki liste; boş alanları köşeli parantezle bırak.
5. **Ölçümü kur.** Kişiye özel indirim kodu ve UTM etiketli bağlantı; yayından 7 gün sonra ekran görüntüsüyle erişim, izlenme, kaydetme ve tıklama raporu.

## Reklam ibaresi (Türkiye)
Reklam Kurulu'nun sosyal medya etkileyicileri kılavuzuna göre:
- Ücret, ürün, hizmet, indirim ya da başka bir menfaat karşılığı yapılan paylaşım reklamdır ve bu açıkça belirtilmelidir.
- İbare Türkçe olmalı ve içeriğin başında, ilk bakışta görülecek yerde durmalı: "Reklam", "#reklam", "İşbirliği", "#işbirliği" gibi. Yalnız İngilizce ibare (#ad, #sponsored) ya da etiket yığınının sonuna gizlenmiş ibare yeterli sayılmaz.
- Videoda ibare başta yer almalı; hikâyelerde her karede tekrarlanmalı; canlı yayında yayın boyunca aralıklarla hatırlatılmalı.
- Platformun ücretli ortaklık etiketi kullanılsa bile Türkçe ibare ayrıca eklenmeli.
- Hediye ürün de menfaattir; ürünün hediye edildiği belirtilmeli.
- Sorumluluk hem reklam verende hem içerik üreticisindedir; idari yaptırım iki tarafa da uygulanabilir.

Kılavuz güncellenebilir; yayından önce Ticaret Bakanlığı'nın güncel metnini kontrol etmesini öner.

## Sözleşme maddeleri
- Taraflar ve kapsam: teslimat listesi, adet, format, süre
- Takvim: taslak teslimi, marka onayı (en çok iki düzeltme turu), yayın tarihi ve saati
- İçeriğin yayında kalma süresi (en az 30 gün kaldırılmaz)
- Reklam ibaresi yükümlülüğü ve platform etiketleri
- Kullanım hakkı: hangi kanallar, kaç ay, ücretli reklamda kullanım, bölge; süre bitince ne olacağı
- Münhasırlık: rakip kategori ve süre; makul tut ve bedelini ayrıca öde
- Ücret, fatura ve ödeme vadesi; stopaj ve vergi durumunu muhasebeciye sor
- Ölçüm raporu yükümlülüğü
- İtibar maddesi: iki taraftan birinin yanıltıcı ya da hukuka aykırı davranışında fesih hakkı
- KVKK: paylaşılan kişisel verilerin işlenmesi ve saklanması
- Gecikme, fesih ve uyuşmazlık durumunda yetkili mahkeme

## Çıktı biçimi
1. Doldurulmuş brif
2. Teklif mesajı (doğrudan mesaj ve e-posta sürümü)
3. Sözleşme maddeleri listesi
4. Ölçüm tablosu: içerik, yayın tarihi, erişim, izlenme, etkileşim, tıklama, kod kullanımı, maliyet, edinme maliyeti

## Yapma
- Reklam ibaresini gizlemeyi ya da "doğal görünsün" diye atlamayı önerme.
- Üreticiye kullanmadığı ürün için "yıllardır kullanıyorum" dedirtme; yanıltıcı tanıklık yasaktır.
- Sağlık, finans, alkol ya da çocuklara yönelik ürünlerde ek kuralları atlama; ilgili mevzuatı kontrol ettir.
- Ücreti yalnız takipçi sayısına göre belirleme; izlenme ve etkileşim verisini iste.`,
    dosyalar: [{ yol: "assets/brif-ve-sozlesme.md", icerik: `# İçerik üreticisi brifi

| Alan | Doldur |
|---|---|
| Marka ve ürün | [marka], [ürün] |
| Kampanyanın amacı | farkındalık, satış ya da indirme |
| Ana mesaj (tek cümle) | [mesaj] |
| Anlatım noktaları (en çok 3) | 1) ... 2) ... 3) ... |
| Söylenmemesi gerekenler | sağlık iddiası, rakip adı, fiyat garantisi, [diğer] |
| Zorunlu ibare | içeriğin başında "Reklam" ya da "#reklam"; hikâyelerde her karede |
| Zorunlu hesap ve etiketler | @[marka], #[kampanya] |
| Bağlantı ve kod | UTM etiketli bağlantı, kişiye özel kod [KOD] |
| Teslimatlar | [1 Reels, 30 ile 45 saniye], [3 hikâye karesi] |
| Takvim | taslak [tarih], onay [tarih], yayın [tarih ve saat] |
| Onay süreci | marka taslağa 2 iş günü içinde döner, en çok 2 düzeltme turu |
| Kullanım hakkı | [kanallar], [süre], ücretli reklamda kullanım [var ya da yok] |
| Raporlama | yayından 7 gün sonra ekran görüntüleriyle erişim, izlenme, kaydetme, tıklama |
| Ödeme | [tutar], fatura tarihinden itibaren [gün] içinde |

## Teklif mesajı
Merhaba [ad], [son içeriğinin konusu] videonu izledik; özellikle [somut ayrıntı] kısmı kitlemizle çok örtüşüyor. Biz [marka], [tek cümlede ne yaptığımız]. [Ay] ayında [teslimat] için ücretli bir iş birliği düşünüyoruz, bütçemiz [aralık]. Uygunsa ayrıntıları e-postayla gönderelim; [tarih] tarihine kadar dönebilirsen planlamamızı ona göre yaparız.

## Sözleşme kontrol listesi
- [ ] Teslimat, adet ve format yazıldı
- [ ] Takvim ve onay turu sayısı yazıldı
- [ ] Türkçe reklam ibaresi yükümlülüğü yazıldı
- [ ] Kullanım hakkı kanal, süre ve bölgeyle sınırlandı
- [ ] Münhasırlık kapsamı ve bedeli yazıldı
- [ ] Ücret, fatura ve vade yazıldı
- [ ] Raporlama yükümlülüğü yazıldı
- [ ] Fesih ve itibar maddesi yazıldı
- [ ] KVKK maddesi eklendi
- [ ] Hukukçu kontrolü yapıldı
` }],
  },
  {
    id: "basin-bulteni", ad: "basin-bulteni", baslik: "Basın bülteni", kategori: "icerik", simge: "/gercek/galeri/sinematik2.webp",
    aciklama: "Yeni ürün, yatırım turu, iş birliği, mağaza açılışı, yönetici ataması, ödül ya da araştırma sonucu için basın bülteni ve gazetecilere gönderilecek tanıtım e-postası yazarken kullan. Haber değerini sınar, ters piramit yapısını, 5N1K girişini, anlamlı alıntıyı, kurum hakkında bölümünü, medya iletişim bilgisini ve ambargo notunu uygular. 'Basın bülteni', 'press release', 'basın duyurusu', 'medyaya haber gönder', 'PR metni', 'gazetecilere e-posta' gibi isteklerde kullan.",
    ornekler: ["Aldığımız yatırım için basın bülteni yaz", "Yeni mağaza açılışımızı yerel basına duyuracak metin hazırla", "Bu bülteni gazetecilere gönderecek kısa bir e-posta yaz"],
    govde: `# Basın bülteni

Bülten reklam metni değildir; okuyucusu editördür ve onun bir sonraki adımı haber yazmaktır. Haberi başa koy, kanıtla destekle, süslü sıfatları çıkar.

## Önce topla
- Haber nedir: yeni olan şeyi tek cümlede yaz; neden şimdi
- Somut veri: rakam, tarih, yer, tutar, kullanıcı ya da müşteri sayısı
- Alıntı verecek kişi ve unvanı (en çok iki kişi)
- Görseller: yüksek çözünürlüklü fotoğraf, logo, ürün görseli (indirme bağlantısıyla)
- Ambargo var mı; hedef yayınlar (ekonomi, teknoloji, yerel, sektörel)

## Adımlar
1. **Haber değerini sına.** Yeni mi, kimi etkiliyor, rakam var mı, yerel ya da sektörel bağ var mı? "Yeni web sitemizi açtık" tek başına haber değildir; öyleyse kullanıcıya bir hikâye açısı öner: araştırma verisi, bir ilk, toplumsal etki, yerel istihdam.
2. **Başlık.** 80 ile 100 karakter; kurum adı, etken fiil ve haber. Alt başlık: bir cümlelik ek bilgi.
3. **Yer ve tarih satırı.** "İstanbul, 5 Kasım 2026" biçiminde, giriş paragrafının başında.
4. **Giriş paragrafı.** En çok 40 ile 50 kelime: ne, kim, ne zaman, nerede, neden. Nasıl sorusu ikinci paragrafa kalabilir.
5. **Gelişme paragrafları.** Önem sırasıyla (ters piramit): veri, bağlam, kullanıcıya etkisi. Editör sondan keserse haber yine ayakta kalmalı.
6. **Alıntı.** İnsan sesiyle; bir görüş, gerekçe ya da gelecek planı katsın. "Çok mutluyuz" türü boş cümle yazma.
7. **Pratik bilgi.** Fiyat, erişim, tarih, adres.
8. **Kurum hakkında.** 50 ile 80 kelime: ne yaptığı, kuruluş yılı, ölçek, web adresi.
9. **Medya iletişim.** Ad, unvan, telefon, e-posta; görsel klasörünün bağlantısı.

## Kurallar
- Toplam 300 ile 500 kelime, tek sayfa.
- Üçüncü tekil anlatım ("şirket açıkladı"); birinci çoğul yalnız alıntının içinde.
- Kanıtsız "devrim niteliğinde", "eşsiz", "sektör lideri" yok.
- Sayılar: ona kadar yazıyla, sonrası rakamla; para "2,5 milyon TL"; tarih "5 Kasım 2026".
- Kısaltmaları ilk geçtiği yerde açık yaz.
- Ambargo varsa en üste: "Ambargolu: 12 Kasım 2026 saat 10.00'a kadar yayımlanmamalıdır."

## Gönderim e-postası
- Konu: haberin kendisi, önek yok.
- Gövde: 3 ile 4 cümlelik özet, bülten metni e-postanın içinde (yalnız ek olarak değil), görsel bağlantısı, iletişim.
- İlk cümleyi gazetecinin alanına göre uyarla; toplu gönderimde alıcıları gizli kopyaya koy.
- Takip: bir kez ve yalnız yeni bir bilgiyle.

## Çıktı biçimi
1. assets/bulten-sablonu.md iskeletine göre doldurulmuş bülten
2. Üç alternatif başlık
3. Gönderim e-postası
4. Eksik bilgi listesi (yer tutucu bırakılan alanlar)

## Yapma
- Uydurma rakam, uydurma alıntı ya da kişinin onayı alınmamış söz yazma; yer tutucu bırak ve vurgula.
- Bülteni büyük harfli bir çığlıkla açma.
- "Şirketimiz ... olarak" diye başlama; haberle başla.
- Bülteni yalnız PDF ek olarak gönderme.`,
    dosyalar: [{ yol: "assets/bulten-sablonu.md", icerik: `Basın bülteni
[Ambargo notu, varsa]

# [Kurum adı] [etken fiil] [haber]
## [Alt başlık: bir cümlelik ek bilgi]

**[Şehir], [gün ay yıl]** – [Giriş: ne, kim, ne zaman, nerede, neden. En çok 50 kelime.]

[2. paragraf: en önemli ayrıntı ve veri. Nasıl yapıldığı.]

"[Alıntı: görüş, gerekçe ya da gelecek planı]" diyen [ad soyad], [unvan], [bir cümle bağlam].

[3. paragraf: kullanıcıya ya da sektöre etkisi, karşılaştırma, bağlam.]

[4. paragraf: pratik bilgi. Fiyat, tarih, erişim, adres.]

**[Kurum adı] hakkında**
[50 ile 80 kelime: ne yapar, kuruluş yılı, ölçek, merkez, web adresi.]

**Medya iletişim**
[Ad soyad], [unvan]
[Telefon] · [E-posta]
Görseller: [klasör bağlantısı]
` }],
  },
  {
    id: "blog-yazisi-okunabilirlik", ad: "blog-yazisi-okunabilirlik", baslik: "Blog yazısı yapısı ve okunabilirlik", kategori: "icerik", simge: "/gercek/galeri/manzara4.webp",
    aciklama: "Bir blog yazısı, rehber, liste yazısı ya da uzun makale planlarken, yazarken veya mevcut bir yazıyı düzeltirken kullan. Arama niyetini ve anahtar kelimeyi, başlık seçeneklerini, doğrudan cevap veren girişi, ara başlık iskeletini, Türkçe okunabilirlik ölçümünü (Ateşman formülü, cümle ve paragraf uzunluğu), yazım denetimini, iç bağlantıları ve kapanış çağrısını kapsar. 'Blog yazısı yaz', 'makale hazırla', 'rehber yazısı', 'yazımı okunur yap', 'içerik taslağı çıkar', 'SEO uyumlu yazı' gibi isteklerde kullan.",
    ornekler: ["Ev kahvesi demleme üzerine 1.500 kelimelik rehber yaz", "Bu yazının okunabilirliğini ölç ve düzelt", "Kargo süreleri konulu blog yazısı için iskelet çıkar"],
    govde: `# Blog yazısı yapısı ve okunabilirlik

Amaç: okuyucunun aradığı cevabı hızlıca veren, sonuna kadar okunan ve arama motorunda bulunan yazı. Başlık ve meta açıklama için turkce-seo yeteneğinin kurallarını da uygula.

## Önce topla
- Konu ve hedef okur (yeni başlayan mı, uzman mı)
- Ana anahtar kelime ve arama niyeti: bilgi, karşılaştırma, satın alma ya da yerel
- Yazının işletmeye katkısı: hangi ürüne ya da sayfaya yönlendirecek
- Uzunluk beklentisi, marka tonu, hitap (sen ya da siz)
- Kullanıcının kendi deneyimi, verisi, fotoğrafı (yazıyı benzersiz yapan şey)

## Adımlar
1. **Niyeti eşle.** Arama sonuçlarında üstte ne tür içerik var (rehber, liste, karşılaştırma)? Aynı türü daha iyi yap; farklı tür önermek istiyorsan gerekçesini yaz.
2. **Başlık.** Üç seçenek: anahtar kelime başa yakın, somut vaat, gerekiyorsa yıl ya da sayı ("Evde filtre kahve: 6 adımda dengeli fincan").
3. **Giriş.** 3 ile 4 cümle: okurun sorunu, bu yazının vaadi, kapsamı. Kısa cevap varsa ilk paragrafta ver. "Günümüzde" ya da "Hepimizin bildiği gibi" ile başlama.
4. **İskelet.** H2'ler okurun sorduğu sorular ya da adımlardır; H3 yalnız gerekiyorsa. İskeleti yazmadan önce kullanıcıya göster, onaylanınca metni yaz.
5. **Gövde.** Paragraf 2 ile 4 cümle; ortalama cümle 15 ile 20 kelime; etken çatı. Her bölüm bir somut ayrıntı içersin: rakam, araç adı, adım, hata.
6. **Biçim.** Adımlar numaralı, seçenekler madde işaretli, karşılaştırma tabloda. Her 250 ile 300 kelimede bir görsel, tablo ya da liste.
7. **Güven.** Kaynak gösterilecek veri, yazar adı ve uzmanlığı, güncelleme tarihi. Kişisel deneyim cümleleri ekle; kullanıcının deneyimi yoksa uydurma, yer tutucu bırak.
8. **İç bağlantı.** 3 ile 5 ilgili sayfaya açıklayıcı bağlantı metniyle bağlantı.
9. **Kapanış.** Kısa özet ve tek eylem çağrısı.
10. **Okunabilirliği ölç.** references/okunabilirlik.md içindeki Ateşman formülüyle puanla; hedef 60 ve üstü. Düşükse uzun cümleleri böl, soyut kelimeleri somutla değiştir.

## Çıktı biçimi
1. Brif tablosu: anahtar kelime, niyet, hedef okur, hedef uzunluk, yönlendirilecek sayfa
2. Başlık seçenekleri ve meta açıklama
3. Yazının tamamı (Markdown, H2 ve H3'lerle)
4. Okunabilirlik raporu:

| Ölçüt | Değer | Hedef |
|---|---|---|
| Kelime sayısı | ... | ... |
| Ortalama cümle uzunluğu | ... | 15 ile 20 kelime |
| 25 kelimeyi geçen cümle | ... | en çok 5 tane |
| Ateşman puanı | ... | 60 ve üstü |
| Edilgen cümle oranı | ... | yüzde 10 altı |

## Yapma
- Aynı anahtar kelimeyi doğal olmayan sıklıkta tekrar etme.
- Kaynağı olmayan istatistik ya da uydurma uzman görüşü yazma.
- İçeriği uzatmak için tanım ve tarihçe doldurma.
- Her paragrafı "Sonuç olarak", "Ayrıca" gibi aynı bağlaçlarla açma.`,
    dosyalar: [{ yol: "references/okunabilirlik.md", icerik: `# Türkçe okunabilirlik ve yazım denetimi

## Ateşman okunabilirlik formülü
Türkçe metinler için Ateşman (1997) formülü:

Puan, 198,825 eksi 40,175 çarpı (kelime başına ortalama hece) eksi 2,610 çarpı (cümle başına ortalama kelime) olarak hesaplanır.

- Türkçede her ünlü bir hecedir; hece saymak için ünlüleri say.
- Cümleyi nokta, soru işareti ve ünlemle ayır.

| Puan | Düzey |
|---|---|
| 90 ile 100 | çok kolay |
| 70 ile 89 | kolay |
| 50 ile 69 | orta güçlükte |
| 30 ile 49 | zor |
| 1 ile 29 | çok zor |

Genel okura yönelik blog için 60 ve üstü hedeflenir. Teknik yazıda 50 ile 60 kabul edilebilir.

## Puanı yükseltmenin yolları
- 25 kelimeyi geçen cümleyi ikiye böl.
- Uzun türetilmiş kelime yerine kısa karşılık: "gerçekleştirmek" yerine "yapmak", "kullanılabilirlik" yerine "kullanım kolaylığı".
- Edilgen ve ad-fiil yığınlarını etken fiile çevir: "kontrolün sağlanması gerekmektedir" yerine "kontrol edin".

## Sık yazım hataları (TDK)
- Bağlaç olan "de, da" ve "ki" ayrı yazılır: "ben de", "diyor ki". Ek olanlar bitişik: "evde", "akşamki".
- Soru eki "mi" ayrı yazılır: "geldi mi".
- "Bir şey", "her şey" ayrı; "herhangi", "hiçbir", "birçok" bitişik.
- Özel adlara gelen ekler kesme işaretiyle ayrılır: "İstanbul'da", "Vayra'nın". Kurum adlarına gelen eklerde kesme kullanılmaz: "Türk Dil Kurumunun".
- "Yalnız" doğru, "yanlız" yanlış; "yanlış" doğru, "yalnış" yanlış.
` }],
  },
  {
    id: "kisa-video-senaryosu", ad: "kisa-video-senaryosu", baslik: "Video senaryosu ve kısa video kancası", kategori: "icerik", simge: "/gercek/galeri/sinematik7.webp",
    aciklama: "Reels, TikTok, YouTube Shorts, reklam videosu ya da uzun YouTube videosu için senaryo, ilk 3 saniyelik kanca, sahne sahne çekim listesi, ekran yazısı, altyazı ve kapanış çağrısı hazırlarken kullan. Kanca türlerini, izlenme süresini koruyan yapıyı, ses ve görüntü tablosunu, platform süre ve güvenli alan kurallarını uygular; video yapay zekâyla üretilecekse sahne istemlerini de yazar. 'Video senaryosu', 'Reels fikri', 'TikTok kancası', 'çekim listesi', 'storyboard', 'reklam filmi metni', 'YouTube girişi' gibi isteklerde kullan.",
    ornekler: ["Pastanemiz için 30 saniyelik Reels senaryosu yaz", "Bu ürün videosu için beş farklı kanca öner", "YouTube videomun ilk 30 saniyesini yeniden yaz"],
    govde: `# Video senaryosu ve kısa video kancası

Kısa videoda izleyici ilk birkaç saniyede kalıp kalmayacağına karar verir. Bu yetenek kancayı, akışı ve çekim listesini birlikte yazar; görüntü, ses ve ekran yazısı aynı anda aynı şeyi söyler.

## Önce topla
- Platform ve süre (6, 15, 30, 60 saniye ya da uzun video)
- Amaç: izlenme, takipçi, satış, uygulama indirme
- Kim anlatıyor: kameraya konuşan kişi, dış ses, yalnız ekran yazısı
- Çekim imkânı: telefon, stüdyo, ürün çekimi, yapay zekâ ile video üretimi
- Ürün ya da konu, tek ana mesaj, marka tonu

## Adımlar
1. **Tek vaadi yaz.** İzleyici videonun sonunda ne kazanacak? Tek cümle.
2. **Kanca üret.** Beş seçenek; her birinde ilk karenin görüntüsü, ekran yazısı ve ilk söz birlikte yazılır. Kanca türleri:
   - Sonuçla başla: bitmiş hâli ilk karede göster.
   - Hata uyarısı: "Kahveyi böyle saklıyorsan aromasını çöpe atıyorsun."
   - Karşıtlık: önce ve sonra, ucuz ve pahalı.
   - Süreç ortası: hareketin içinden başla, giriş yapma.
   - Rakam ya da liste: "3 malzeme, 5 dakika."
3. **Akışı kur.**
   - 0 ile 3. saniye: kanca
   - 3 ile 8. saniye: bağlam, neden izlemeli
   - Orta bölüm: değer ya da gösterim; her 2 ile 4 saniyede görüntü değişsin (açı, yakın çekim, yazı)
   - Kanıt: sonuç, yorum, rakam
   - Son 3 saniye: tek çağrı; mümkünse başa dönen döngü
4. **Ekran yazısı.** Satır başına en çok 5 kelime; üst ve orta bölgede, platform düğmelerinden uzak.
5. **Altyazı.** İzleyicilerin önemli kısmı sesi kapalı izler; konuşmanın tamamı altyazılı olsun.
6. **Uzun video ise.** İlk 30 saniyede vaat ve kısa ön izleme; bölümler ve zaman damgaları; ortada yeniden kanca ("asıl fark yaratan adım birazdan").
7. **Yapay zekâ ile üretilecekse.** Her sahne için video_uret istemi yaz: özne, eylem, kamera hareketi, ışık, ortam, oran (kısa video için 9:16) ve süre. Marka renklerini ve ürün ayrıntısını isteme ekle.

## Süre ve biçim
- Reels ve YouTube Shorts 3 dakikaya, TikTok 10 dakikaya kadar; ama çoğu kısa video için 15 ile 45 saniye en verimli aralıktır.
- Reklam için 6, 15 ve 30 saniyelik kesimler ayrı ayrı yazılır; 6 saniyelikte tek mesaj.
- Oran 9:16, 1080x1920; alt yüzde 20 ve sağ kenarda yazı olmasın.

## Çıktı biçimi
**Vaat:** ...
**Kanca seçenekleri:** 1) ... 5) ...
**Senaryo:**

| Süre | Görüntü | Ses ya da konuşma | Ekran yazısı | Not |
|---|---|---|---|---|
| 0 ile 3 sn | ... | ... | ... | ... |

**Çekim listesi:** çekim numarası, açı, nesne, hareket, süre
**Açıklama metni ve etiketler**

## Yapma
- "Merhaba arkadaşlar, bugün size..." ile ya da logo animasyonuyla başlama.
- Telifli popüler müzik önerme; işletme hesapları yalnız ticari kullanıma lisanslı müzik kitaplığını kullanabilir.
- Görüntünün göstermediğini sözle anlatma; göster.
- Ücretli iş birliğinde reklam ibaresini unutma.`,
    dosyalar: [],
  },
  {
    id: "musteri-destek-yaniti", ad: "musteri-destek-yaniti", baslik: "Müşteri destek yanıtı", kategori: "musteri", simge: "/gercek/galeri/portre6.webp",
    aciklama: "E-posta, canlı destek, WhatsApp, sosyal medya mesajı ya da yorumdaki bir müşteri sorusuna, sorununa veya talebine yanıt yazarken ve ekip için hazır yanıt şablonları üretirken kullan. Marka tonunu, somut empatiyi, tek seferde çözümü, net sonraki adımı, kızgın müşteriyi yatıştırmayı, gerekçeli olumsuz yanıtı ve Türkiye'deki tüketici haklarını (cayma, ayıplı mal, iade süresi) doğru aktarmayı kapsar. 'Müşteriye cevap yaz', 'destek yanıtı', 'iade talebine yanıt', 'kargo gecikti mesajı', 'hazır cevap', 'kızgın müşteri' gibi isteklerde kullan.",
    ornekler: ["Kargosu 6 gündür gelmeyen müşteriye yanıt yaz", "İade süresi geçmiş bir talebe kibarca olumsuz yanıt hazırla", "Destek ekibimiz için en sık 10 soruya hazır yanıt şablonları çıkar"],
    govde: `# Müşteri destek yanıtı

Amaç: müşterinin sorunu tek yanıtta çözülsün ya da ne olacağını tam olarak bilsin; marka tonu korunsun. Yasal haklarla ilgili bilgi verirken references/tuketici-haklari.md içindeki özeti kullan.

## Önce topla
- Müşterinin mesajının tamamı ve önceki yazışmalar
- Sipariş, hesap ya da kayıt durumu (kargo hareketi, ödeme, tarih)
- Şirket politikası: iade, değişim, kargo, telafi yetkisi (indirim, ücretsiz kargo)
- Kanal ve marka tonu (sen ya da siz, resmîlik düzeyi)

## Adımlar
1. **Sınıflandır.** Tür: soru, sorun, şikâyet, talep, öneri. Duygu: sakin, kırgın, öfkeli. Aciliyet: bugün mü, bu hafta mı.
2. **Gerçek isteği bul.** Söylenen ("kargo nerede") ile kastedilen ("yarın doğum günü, yetişecek mi") farklı olabilir; ikisine de yanıt ver.
3. **Yanıtı beş parçada kur.**
   - Adıyla hitap.
   - Somut empati, tek cümle: "Doğum günü hediyesinin gecikmesi gerçekten can sıkıcı."
   - Sorumluluk: hata bizdeyse açıkça özür; savunmaya geçme, kargo firmasını suçlama.
   - Çözüm: ne yaptık ve ne yapacağız, rakam ve tarihle.
   - Sonraki adım ve kapanış: müşterinin bir şey yapması gerekiyorsa tek adım; değilse "ben takip edeceğim".
4. **Hayır demek gerekiyorsa.** Nedeni sade dille söyle, yapılabilecek bir alternatif sun. "Politikamız gereği" kalıbı yerine gerçek neden.
5. **Kanala uyarla.** Canlı destekte kısa mesajlar; e-postada tam ve tek parça; herkese açık yorumda kısa yanıt ve özel mesaja davet (sipariş numarasını ya da telefonu açıkta isteme).
6. **İç not yaz.** Etiket, kök neden, takip tarihi, telafi verildiyse ne kadar.

## Ton kuralları
- Kısa cümle, günlük dil, jargon yok.
- Etken çatı: "hata yapıldı" değil "hata yaptık".
- "Maalesef" ile başlama, "anlayışınız için teşekkürler" ile karşı tarafa yük bindirme.
- Öfkeli müşteriye aynı tonla dönme; sakin, kısa ve somut ol.
- Söz verdiğin her şeyin sahibi ve tarihi olsun.

## Hazır yanıt şablonları
Şablon istendiğinde her biri için: başlık, kullanım durumu, değişken alanlar köşeli parantezle ([ad], [sipariş no], [tarih]), metin, kişiselleştirilecek cümle. Şablon kopyala yapıştır hissi vermesin; her birinde temsilcinin dolduracağı bir kişisel cümle yeri bırak.

## Çıktı biçimi
1. Yanıt metni (kanala uygun uzunlukta)
2. İki alternatif ton: daha resmî ve daha sıcak
3. İç not:

| Alan | Değer |
|---|---|
| Tür ve duygu | ... |
| Kök neden | ... |
| Verilen telafi | ... |
| Takip tarihi | ... |

## Yapma
- Tutamayacağın tarih ya da sonuç vaat etme.
- Müşteriyi suçlama ya da yanlış anladığını ima etme.
- Açık kanalda kişisel veri isteme ya da paylaşma.
- Yasal hakkı kısıtlayan ifade kullanma ("indirimli ürün iade edilmez" gibi, cayma hakkı varsa).
- Bilmediğin bir bilgiyi tahminle kesinmiş gibi yazma; "kontrol edip [saat] içinde döneceğim" de.`,
    dosyalar: [{ yol: "references/tuketici-haklari.md", icerik: `# Tüketici hakları özeti (6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği)

Bu özet destek yanıtlarında doğru bilgi vermek içindir; hukuki görüş değildir. Güncel mevzuatı kontrol et.

## Cayma hakkı (mesafeli satış)
- Süre 14 gün: malda teslimden, hizmette sözleşme tarihinden başlar. Gerekçe gösterilmesi ve cezai şart istenemez.
- Tüketici cayma bildiriminden sonra 10 gün içinde malı geri gönderir.
- Satıcı cayma bildirimi kendisine ulaştıktan sonra 14 gün içinde bütün ödemeleri iade eder.
- Satıcının ön bilgilendirmede belirttiği taşıyıcıyla iade edilirse iade kargo ücretini tüketici ödemez.
- İstisnalar: kişiye özel üretilen, çabuk bozulan, ambalajı açılmış hijyen ürünleri, anında ifa edilen dijital içerik ve benzerleri.
- İndirimli ürün de cayma hakkı kapsamındadır.

## Ayıplı mal
- Tüketicinin seçimlik hakları: sözleşmeden dönme, ayıp oranında bedel indirimi, ücretsiz onarım, ayıpsız misliyle değişim. Seçimi tüketici yapar.
- Teslimden sonraki 6 ay içinde ortaya çıkan ayıbın teslimde var olduğu kabul edilir.
- Ayıplı maldan sorumluluk için zamanaşımı teslimden itibaren 2 yıldır (ağır kusur ve hile hâlleri hariç).
- Garanti süresi en az 2 yıldır; garanti kapsamındaki onarım en çok 20 iş günü sürer.

## Teslimat
- Mesafeli satışta mal, sipariş tarihinden itibaren en geç 30 gün içinde teslim edilir; daha kısa süre taahhüt edildiyse o geçerlidir.
- Süresinde teslim edilmezse tüketici sözleşmeyi feshedebilir.

## Şikâyet yolları
- Tüketici hakem heyetleri ve tüketici mahkemeleri; başvurular e-Devlet üzerinden yapılabilir.
- Hakem heyeti parasal sınırı her yıl yeniden belirlenir; güncel tutarı kontrol et.
` }],
  },
  {
    id: "yardim-merkezi-makalesi", ad: "yardim-merkezi-makalesi", baslik: "SSS ve yardım merkezi makalesi", kategori: "musteri", simge: "/gercek/galeri/manzara8.webp",
    aciklama: "Sık sorulan sorular sayfası, yardım merkezi ya da bilgi bankası makalesi, nasıl yapılır rehberi, sorun giderme adımları ve kategori yapısı yazarken kullan. Destek kayıtlarından soru çıkarmayı, kategori ağacını, tek görevli makale yapısını, ekrandaki adlarla adım adım talimatı, ekran görüntüsü notunu, arama dostu başlığı, FAQPage yapılandırılmış verisini ve makale bakım takvimini kapsar. 'SSS yaz', 'sıkça sorulan sorular', 'yardım sayfası', 'bilgi bankası', 'nasıl yapılır makalesi', 'destek dokümanı' gibi isteklerde kullan.",
    ornekler: ["Mağazam için kargo ve iade SSS sayfası yaz", "Uygulamamda şifre sıfırlama için yardım makalesi hazırla", "Bu destek kayıtlarından yardım merkezi kategorileri çıkar"],
    govde: `# SSS ve yardım merkezi makalesi

İyi yardım içeriği destek talebini azaltır: kullanıcı aradığı cevabı kendi kelimeleriyle bulur ve tek okumada sorununu çözer.

## Önce topla
- Ürün ya da hizmet ve kullanıcı türleri (alıcı, satıcı, yönetici)
- En sık gelen sorular: destek kayıtları, canlı destek dökümleri, yorumlar, site içi arama sorguları
- Geçerli politikalar: kargo, iade, ödeme, hesap
- Ekran adları ve düğme metinleri (arayüz Türkçe ise birebir)

## Adımlar
1. **Soruları topla ve kümele.** Aynı sorunun farklı söylenişlerini birleştir; her kümeyi sıklık ve etkiye göre sırala. İlk 20 küme çoğu talebi karşılar.
2. **Kategori ağacı kur.** En çok 6 ile 8 üst kategori, kullanıcının diliyle: Siparişler, Ödeme, Kargo ve teslimat, İade ve değişim, Hesap ve güvenlik, Ürün kullanımı.
3. **Makale türünü seç.**
   - Nasıl yapılır: tek görev, numaralı adımlar.
   - Sorun giderme: belirti, olası neden, çözüm sırası.
   - Kavram: bir özelliğin ne olduğu ve ne işe yaradığı.
   - Politika: kural, istisnalar ve hangi koşulda geçerli olduğu.
4. **Başlığı kullanıcının cümlesiyle yaz.** "Siparişimi nasıl iptal ederim?" Arayüz adı değil, kullanıcının yazacağı kelimeler.
5. **İlk cümlede cevap ver.** Ayrıntı sonra gelir.
6. **Adımları yaz.** Her adım tek eylem; düğme ve menü adları kalın ve ekrandaki gibi; her adımın sonunda ne görüleceği ("Onay e-postası gelir").
7. **Koşulları ayır.** "Kargoya verilmediyse" ve "kargoya verildiyse" iki ayrı alt başlık.
8. **Çıkış yolu ekle.** İlgili 2 ile 3 makale ve "Sorun çözülmedi mi?" altında destek kanalı.
9. **Tarih ve sahip.** Son güncelleme tarihi; iç kayıtta makale sahibi ve gözden geçirme tarihi.

## SSS sayfası kuralları
- Cevap 2 ile 4 cümle; soru başına tek konu; uzun cevap gerekiyorsa makaleye bağlantı.
- Sorular kategori başlıkları altında; en sık sorulan en üstte.
- FAQPage yapılandırılmış verisi yalnız sayfada görünen soru ve cevaplarla birebir aynıysa eklenir.

## Bakım
- Her makalenin altında "Bu makale yardımcı oldu mu?" geri bildirimi.
- Sonuç vermeyen arama sorgularını ayda bir listele; yeni makale adayı olarak kullan.
- Arayüz değiştiğinde ilgili makaleleri güncelle; ekran görüntüsü eskidiyse kaldır.

## Çıktı biçimi
Makale için:

**Başlık:** kullanıcının sorusu
**Kısa cevap:** bir ya da iki cümle
**Adımlar:** numaralı
**Ekran görüntüsü notu:** hangi ekran, hangi alan işaretlenecek
**İlgili makaleler:** ...
**Etiketler ve eşanlamlılar:** arama için (iptal, vazgeçmek, siparişi durdurmak)

Kategori ağacı istenirse tablo: kategori, makale başlığı, tür, öncelik.

## Yapma
- Pazarlama dili ve övgü kullanma; yardım metni satış yapmaz.
- "Kolayca", "basitçe" deme; kullanıcı zaten zorlandığı için burada.
- Bir makalede beş ayrı konuyu anlatma.
- Ekran görüntüsünde gerçek müşteri verisi bırakma.`,
    dosyalar: [],
  },
  {
    id: "sikayet-kriz-iletisimi", ad: "sikayet-kriz-iletisimi", baslik: "Şikâyet ve kriz iletişimi", kategori: "musteri", simge: "/gercek/galeri/sinematik10.webp",
    aciklama: "Şikayetvar, Google Haritalar, uygulama mağazası ya da sosyal medyadaki herkese açık bir şikâyete yanıt yazarken; olumsuz yorum dalgası, viral eleştiri, veri ihlali, ürün geri çağırma ya da hizmet kesintisi gibi kriz anlarında açıklama hazırlarken kullan. Krizin düzeyini belirler; bekletme açıklamasını, tam açıklamayı, kamuya açık yanıtı, çalışan bilgilendirmesini, olası soru ve cevapları ve KVKK ihlal bildirimi takvimini planlar. 'Şikayetvar yanıtı', 'kötü yoruma cevap', 'kriz açıklaması', 'kamuoyu duyurusu', 'özür metni', 'veri sızıntısı duyurusu' gibi isteklerde kullan.",
    ornekler: ["Şikayetvar'daki geç teslimat şikâyetine yanıt yaz", "Sitemiz 6 saat çöktü, müşterilere açıklama hazırla", "Haksız olduğunu düşündüğümüz bir Google yorumuna nasıl yanıt verelim?"],
    govde: `# Şikâyet ve kriz iletişimi

Herkese açık yanıt yalnız şikâyet edene değil, onu okuyan yüzlerce kişiye yazılır. Kriz anında hız, dürüstlük ve tutarlılık; mükemmel cümleden önemlidir. Şablonlar assets/kriz-sablonlari.md içinde.

## Önce topla
- Ne oldu, ne zaman, kaç kişi etkilendi; zarar sürüyor mu
- Doğrulanmış bilgi ile söylentinin ayrımı
- Şirketin sorumluluğu: kesin, olası, yok
- Açıklamayı kim onaylayacak (yönetim, hukuk)
- Kanallar: Şikayetvar, Google yorumları, mağaza yorumları, X, Instagram, e-posta listesi, basın

## Düzeyi belirle

| Düzey | Durum | İlk yanıt | Onay |
|---|---|---|---|
| 1 | Tek müşteri şikâyeti | aynı iş günü | destek ekibi |
| 2 | Aynı konuda çok şikâyet ya da yayılan gönderi | 2 ile 4 saat | ekip lideri ve iletişim |
| 3 | Güvenlik, sağlık, veri ihlali, ana akım medya | ilk 1 saat içinde bekletme açıklaması | yönetim ve hukuk |

## Herkese açık şikâyete yanıt
1. Adıyla hitap; yaşananı kabul et: "Siparişinizin 9 gündür ulaşmaması kabul edilebilir değil."
2. Sorumluluk ve özür (gerekliyse); mazeret sıralama.
3. Ne yaptığını söyle: somut eylem ve tarih.
4. Kişisel veriyi açıkta isteme ya da yazma; sipariş ve iletişim için özel kanala davet et.
5. Çözülünce kısa ikinci yanıt: "Yeni ürün bugün teslim edildi, ilginiz için teşekkür ederiz."
6. Şikayetvar'da çözüm sonrası müşteriden değerlendirme isteyebilirsin; değerlendirme karşılığı hediye ya da indirim teklif etme.
7. Haksız iddiada: kişiyi değil olguyu düzelt, sakin ve kanıtla ("Kayıtlarımızda ürün 3 Kasım'da teslim görünüyor; kontrol için size ulaştık").

## Kriz açıklaması
- **Bekletme açıklaması**: ne biliyoruz, ne yapıyoruz, bir sonraki bilgilendirme ne zaman. Bilinmeyeni tahmin etme.
- **Tam açıklama**: ne oldu, kim etkilendi, neden (biliniyorsa), şirketin sorumluluğu, alınan önlemler, etkilenenler için ne yapılacak (iade, telafi, iletişim hattı), tekrarlamaması için yapılan değişiklik.
- **Özür**: kim, kimden, ne için. "Rahatsızlık yaşandıysa" gibi koşullu özür yazma.
- **Veri ihlali**: KVKK'ya göre veri sorumlusu ihlali öğrendikten sonra gecikmeksizin ve en geç 72 saat içinde Kişisel Verileri Koruma Kurulu'na bildirir; etkilenen kişilere de makul en kısa sürede bildirim yapılır. Bu adımı hukuk ekibiyle birlikte yürüt; güncel Kurul kararını kontrol ettir.
- **Ürün güvenliği ve geri çağırma**: ilgili bakanlık bildirimi ve sektör mevzuatı hukukçuyla kontrol edilir.

## Sonrası
- Çalışanlara aynı açıklama ve soru cevap listesi; kimse kendi yorumunu yapmasın.
- Sosyal medyada sabitlenmiş güncel durum; 24 ile 48 saat sonra durum özeti.
- Olay sonrası değerlendirme: neyi daha erken görebilirdik, ne değişecek.

## Çıktı biçimi
1. Düzey ve kısa durum özeti
2. Kanal başına açıklama metinleri
3. Olası 5 soru ve onaylı cevapları
4. Zaman çizelgesi: saat, eylem, sorumlu

## Yapma
- Müşteriyle herkese açık tartışma, alay ya da espri.
- Yorum silme, sahte olumlu yorum yazdırma; bu tüketiciyi yanıltan haksız ticari uygulamadır.
- Suçun kimde olduğu netleşmeden çalışanı ya da tedarikçiyi suçlama.
- Hukuk onayı gereken açıklamayı onaysız yayımlama; sessizliği uzatma.`,
    dosyalar: [{ yol: "assets/kriz-sablonlari.md", icerik: `# Şikâyet ve kriz yanıt şablonları

Köşeli parantezli alanları doldur; her şablonda en az bir cümleyi duruma göre kişiselleştir.

## Şikayetvar: geç teslimat
Merhaba [ad], siparişinizin [gün] gündür ulaşmamasının ne kadar can sıkıcı olduğunu anlıyoruz ve bu bekleyiş için özür dileriz. Kargo firmasıyla görüştük; paketiniz [durum]. [Çözüm: yeniden gönderim ya da iade] işlemini başlattık. Ayrıntılar için kayıtlı e-posta adresinize yazdık; oradan bize dönmeniz yeterli. [İmza, unvan]

## Google yorumu: olgusal hata içeren olumsuz yorum
Merhaba [ad], yorumunuz için teşekkür ederiz. Kayıtlarımızda [olgu] görünüyor; yine de yaşadığınız deneyimin sizin için iyi olmadığını anlıyoruz. Konuyu birlikte netleştirmek için [iletişim kanalı] üzerinden bize ulaşabilir misiniz? [İmza]

## Bekletme açıklaması (kriz, ilk saat)
[Saat] itibarıyla [sorun] yaşandığının farkındayız. Ekibimiz konuyu inceliyor. Şu an bildiğimiz: [doğrulanmış bilgi]. Bir sonraki bilgilendirmeyi en geç [saat] yapacağız. Acil durumlar için: [iletişim].

## Tam açıklama
[Tarih ve saat] arasında [ne oldu]. Bu durumdan [kimler, kaç kişi] etkilendi. Nedeni [neden]. Sorumluluk bizdedir ve [kime] özür dileriz. Şu adımları attık: [önlemler]. Etkilenen müşterilerimiz için [telafi]. Bunun tekrarlanmaması için [değişiklik]. Sorularınız için [iletişim].

## Veri ihlali bildirimi (ilgili kişilere) iskeleti
- İhlalin ne zaman gerçekleştiği ve ne zaman fark edildiği
- Etkilenen veri kategorileri (kimlik, iletişim, ödeme ve benzerleri)
- Olası sonuçlar ve kişinin alabileceği önlemler (şifre değiştirme, dolandırıcılık uyarısı)
- Şirketin aldığı ve alacağı önlemler
- İrtibat kişisi ve başvuru kanalı
Metni hukuk ekibi onaylamadan gönderme.
` }],
  },
  {
    id: "nps-memnuniyet-anketi", ad: "nps-memnuniyet-anketi", baslik: "Müşteri memnuniyeti anketi ve NPS analizi", kategori: "musteri", simge: "/gercek/panel/gal-soul2-1.webp",
    aciklama: "Net tavsiye skoru (NPS), müşteri memnuniyeti (CSAT) ya da müşteri çaba skoru (CES) anketi tasarlarken, anket sorularını yazarken, gelen yanıtları hesaplayıp yorumlarken ve yönetime rapor hazırlarken kullan. Ölçüt seçimini, gönderim zamanını ve kanalını, yönlendirmeyen soru dilini, puan hesabını, örneklem büyüklüğüne göre hata payını, açık uçlu yorumları temalara ayırmayı, kapalı döngü takibini ve KVKK aydınlatmasını kapsar. 'NPS', 'memnuniyet anketi', 'müşteri anketi hazırla', 'anket sonuçlarını yorumla', 'geri bildirim formu' gibi isteklerde kullan.",
    ornekler: ["Kargo sonrası gönderilecek kısa bir memnuniyet anketi hazırla", "Bu 340 NPS yanıtını analiz edip temalara ayır", "Destek ekibimiz için CSAT ölçümü kur"],
    govde: `# Müşteri memnuniyeti anketi ve NPS analizi

Anket bir karar için yapılır. Bu yetenek doğru ölçütü seçer, kısa ve yönlendirmeyen bir anket yazar, sonuçları hata payıyla birlikte raporlar ve yorumları aksiyona çevirir.

## Önce topla
- Hangi karar verilecek (ürün yol haritası, destek kalitesi, kargo firması seçimi)
- Hedef kitle ve kanal (e-posta, SMS, uygulama içi, sipariş sonrası sayfa)
- Mevcut veri ya da önceki dönem sonuçları
- Anket aracı (Google Forms, Typeform, kendi formu)

## Ölçüt seç

| Ölçüt | Soru | Ölçek | Ne zaman |
|---|---|---|---|
| NPS | [Marka]'yı bir arkadaşınıza tavsiye etme olasılığınız nedir? | 0 ile 10 | ilişki ölçümü, 3 ile 6 ayda bir; ilk değer anından sonra |
| CSAT | [Etkileşim] deneyiminizden ne kadar memnun kaldınız? | 1 ile 5 | teslimat ya da destek kaydı kapandıktan hemen sonra |
| CES | Sorununuzu çözmek ne kadar kolaydı? | 1 ile 7 | destek, iade, kurulum sonrası |

## Anket tasarımı
1. En çok 3 ile 5 soru: bir ölçek sorusu, bir açık uçlu "neden", en çok iki ek soru.
2. Açık uçlu soruyu puana göre değiştir: 9 ve 10 için "En çok neyi sevdiniz?", 7 ve 8 için "10 olması için ne değişmeli?", 0 ile 6 için "Neyi daha iyi yapabilirdik?".
3. Yönlendirici soru ("Harika hizmetimizden memnun musunuz?") ve çift konulu soru ("hız ve fiyattan") yazma.
4. Ölçek uçlarını etiketle: 0 "hiç olası değil", 10 "kesinlikle".
5. İlk soru e-postanın içinden tek tıkla yanıtlanabilsin; form mobil uyumlu olsun.
6. KVKK: anketin amacını ve yanıtların nasıl kullanılacağını yaz; anonim değilse açıkça söyle. Çekiliş ya da hediye ile teşvik edilecekse çekiliş izni gerekebilir, güncel mevzuatı kontrol ettir.

## Hesaplama
- NPS: 9 ve 10 verenler destekçi, 7 ve 8 pasif, 0 ile 6 kötüleyen. Puan, destekçi yüzdesinden kötüleyen yüzdesi çıkarılarak bulunur; eksi 100 ile artı 100 arasında bir tam sayı olarak yazılır (yüzde değil, puan).
- CSAT: 4 ve 5 verenlerin bütün yanıtlara oranı.
- Hata payı: 100 yanıtta NPS hata payı yaklaşık 15 puan, 400 yanıtta yaklaşık 8 puandır. Dönemler arası küçük farkları "düşüş" diye raporlama; yanıt sayısını her zaman yaz.
- Yanıt oranını da raporla; düşük yanıt oranında yalnız çok memnun ve çok kızgın müşteriler yanıt verir.

## Açık uçlu yorum analizi
1. Temaları çıkar (kargo, fiyat, ürün kalitesi, destek, uygulama); her yoruma en çok iki tema.
2. Tema başına yorum sayısı ve kötüleyenler içindeki payı.
3. Her tema için kişisel verisi çıkarılmış iki temsilî alıntı.
4. Sıklık ve etkiye göre önceliklendir; her aksiyona sahip ata.

## Kapalı döngü
- Kötüleyenlere 48 saat içinde kişisel dönüş (şablon değil).
- Destekçilerden yorum ya da tavsiye iste.
- Yapılan değişikliği müşterilere "geri bildiriminizle değişti" diye duyur.

## Rapor biçimi

| Dönem | Yanıt | Destekçi | Pasif | Kötüleyen | NPS | Önceki dönem |
|---|---|---|---|---|---|---|

| Tema | Yorum sayısı | Kötüleyenlerdeki payı | Alıntı | Önerilen aksiyon | Sahip |
|---|---|---|---|---|---|

## Yapma
- Müşteriden yüksek puan isteme ("lütfen 10 verin").
- Anketi yalnız memnun müşterilere gönderme.
- NPS'i yanıt sayısı olmadan ya da ondalıklı raporlama.
- Tek dönemlik dalgalanmadan kesin sonuç çıkarma.`,
    dosyalar: [],
  },
  {
    id: "toplanti-notu-aksiyon", ad: "toplanti-notu-aksiyon", baslik: "Toplantı notu ve aksiyon listesi", kategori: "operasyon", simge: "/gercek/panel/gal-soul2-3.webp",
    aciklama: "Bir toplantının dökümünden, ses kaydı metninden ya da dağınık notlardan karar özeti, sahipli ve tarihli aksiyon listesi, açık sorular ve takip e-postası çıkarırken kullan; toplantı öncesi gündem hazırlamayı da kapsar. Kararları, aksiyonları, açık soruları, riskleri ve bilgiyi birbirinden ayırır, belirsiz kalanı uydurmadan işaretler. 'Toplantı notu', 'tutanak', 'aksiyon listesi çıkar', 'toplantı özeti', 'görüşme notlarını derle', 'takip maili yaz', 'gündem hazırla' gibi isteklerde kullan.",
    ornekler: ["Bu toplantı dökümünden kararları ve aksiyonları çıkar", "Yarınki pazarlama toplantısı için gündem hazırla", "Müşteri görüşmesi notlarından takip e-postası yaz"],
    govde: `# Toplantı notu ve aksiyon listesi

İyi bir toplantı notu, toplantıya katılmayan birinin iki dakikada ne kararlaştırıldığını ve kimin ne yapacağını anlamasını sağlar. Dakika dakika döküm değil, sonuç belgesidir.

## Önce topla
- Kaynak: döküm, ses kaydı metni ya da elle tutulan notlar
- Katılımcılar ve rolleri
- Toplantının amacı ve tarihi
- Görev aracı (Jira, Trello, Asana, Notion) varsa aksiyonların oraya aktarılacak biçimi

## Adımlar
1. **Dört kovaya ayır.** Kaynağı oku, her parçayı işaretle: karar, aksiyon, açık soru, bilgi.
2. **Kararları yaz.** Her karar tek cümle, kısa gerekçe ve kimin onayladığı. Farklı görüş varsa tek satırda belirt.
3. **Aksiyonları yaz.** Fiille başlar; tek sahip (kişi adı, "ekip" değil); bitiş tarihi; "bitti sayılır" ölçütü. Sahip ya da tarih konuşulmadıysa "sahip atanmadı" yaz ve açık sorulara da ekle.
4. **Açık soruları yaz.** Kim yanıtlayacak, ne zamana.
5. **Riskleri ve bağımlılıkları yaz.** Hangi aksiyon hangisini bekliyor.
6. **Takip e-postasını hazırla.** Toplantıdan sonraki 24 saat içinde; en üstte kararlar ve aksiyonlar.

## Kurallar
- Söylenmemiş bir kararı uydurma; belirsizse "karar netleşmedi" yaz.
- Tarihleri mutlak yaz: "Cuma" değil "14 Kasım 2026 Cuma".
- Kişisel yorumlar, performans konuşmaları ve sağlık gibi hassas bilgiler genel dağıtım notuna girmez.
- Alıntı gerekiyorsa kısa ve konuşanın adıyla.
- Döküm otomatik çıkarıldıysa isimleri, rakamları ve tarihleri katılımcılarla doğrulatmayı öner.
- Toplantıda olmayan birine aksiyon yazıldıysa "bilgilendirilecek" notu düş.

## Gündem (toplantı öncesi istenirse)
- Amaç tek cümle ve beklenen çıktı (karar, onay, fikir)
- Maddeler süreli ve sahipli; karar gereken maddeler başta
- Ön okuma bağlantıları
- Katılımcı listesi: yalnız katkısı gereken kişiler

## Çıktı biçimi

**[Toplantı adı] · [tarih] · [süre]**
Katılımcılar: ... · Not alan: ...

### Kararlar
1. ...

### Aksiyonlar

| No | Aksiyon | Sahip | Bitiş | Bitti sayılır | Durum |
|---|---|---|---|---|---|
| 1 | ... | ... | ... | ... | açık |

### Açık sorular

| Soru | Yanıtlayacak | Tarih |
|---|---|---|

### Riskler ve bağımlılıklar
- ...

### Bir sonraki toplantı
Tarih ve gündem başlıkları.

Ardından takip e-postası taslağı; konu satırı: "[Toplantı adı]: kararlar ve aksiyonlar, [tarih]".

## Yapma
- Dakika dakika kim ne dedi dökümü yazma.
- "Ekip bakacak" ya da "en kısa sürede" gibi sahipsiz, tarihsiz aksiyon bırakma.
- Kararı ve fikri karıştırma; önerilen her şey karar değildir.
- Notu toplantıdan günler sonra gönderme.`,
    dosyalar: [],
  },
  {
    id: "okr-durum-raporu", ad: "okr-durum-raporu", baslik: "OKR ve haftalık durum raporu", kategori: "operasyon", simge: "/gercek/galeri/manzara11.webp",
    aciklama: "Çeyreklik OKR (hedef ve anahtar sonuç) yazarken, mevcut OKR'leri ölçülebilir hâle getirirken, haftalık ya da aylık durum raporu, yönetime özet ve proje ilerleme raporu hazırlarken kullan. Başlangıç ve hedef değerli anahtar sonucu, çıktı ile sonuç ayrımını, güven puanını, yolunda, riskte ve sapmış durum etiketlerini, engelleri ve yardım talebini, gelecek hafta planını kapsar. 'OKR yaz', 'hedef belirle', 'KPI', 'haftalık rapor', 'durum raporu', 'yönetime özet', 'çeyrek hedefleri' gibi isteklerde kullan.",
    ornekler: ["Pazarlama ekibimiz için bu çeyreğin OKR'lerini yaz", "Bu haftaki notlarımdan yönetime bir sayfalık durum raporu çıkar", "Şu hedefleri ölçülebilir anahtar sonuçlara çevir"],
    govde: `# OKR ve haftalık durum raporu

OKR ekibin neyi başarmak istediğini ve bunu nasıl ölçeceğini söyler; durum raporu ise hedefe göre nerede olunduğunu ve neye ihtiyaç duyulduğunu. İkisi aynı ölçütlerle konuşmalı.

## Önce topla
- Şirket ya da üst ekip hedefleri (OKR bunlara bağlanır)
- Ekip, dönem (çeyrek), mevcut ölçütler ve son değerleri
- Rapor için: geçen haftanın notları, ölçüt değerleri, engeller, okuyucu (ekip mi yönetim mi)

## OKR yazma
1. **Hedef**: niteliksel, kısa, yön veren bir cümle ("Yeni müşteriler ilk haftada değeri görsün"). Dönem başına en çok 3 hedef.
2. **Anahtar sonuç**: her hedefe 2 ile 4 tane; her biri ölçüt, başlangıç değeri, hedef değer ve tarih içerir: "İlk hafta aktivasyon oranını yüzde 32'den yüzde 45'e çıkar."
3. **Çıktı ile sonucu ayır.** "10 blog yazısı yayımla" bir görevdir; "organik aylık ziyareti 8.000'den 15.000'e çıkar" anahtar sonuçtur. Görevleri ayrı bir girişim listesine taşı.
4. **Denge.** Bir büyüme ölçütüne bir koruyucu ölçüt eşlik etsin (kayıt sayısı artarken iade oranı).
5. **İddia düzeyi.** İddialı OKR'de dönem sonunda 0,7 başarı iyi sayılır; taahhüt OKR'sinde hedef 1,0'dır. Hangisi olduğunu yaz.
6. **Sahip.** Her anahtar sonucun tek sahibi.

## Haftalık durum raporu
1. **Kısa özet** (en çok 3 cümle): genel durum, en önemli gelişme, en önemli risk.
2. **Ölçütler tablosu**: geçen haftayla karşılaştırmalı.
3. **Bu hafta biten**: yalnız sonuca etkisi olanlar.
4. **Engeller ve ihtiyaçlar**: kimden, ne, ne zamana kadar isteniyor.
5. **Gelecek hafta**: en çok 3 öncelik.
6. **Durum etiketi**: yolunda, riskte ya da sapmış; riskte ve sapmış için neden ve kurtarma planı.

## Kurallar
- Önce sonuç, sonra ayrıntı; yönetim raporu tek sayfa.
- Her sayı karşılaştırmalı: önceki hafta, hedef ya da geçen yıl.
- Kötü haberi erken ve açık ver; her şeyi "yolunda" göstermek güveni bozar.
- Anahtar sonuçta "iyileştir", "artır", "güçlendir" gibi sayısız fiil bırakma.
- Kısaltmaları ilk kullanımda aç; okuyucu her ekibin jargonunu bilmez.

## Çıktı biçimi

### OKR tablosu

| Hedef | Anahtar sonuç | Başlangıç | Hedef değer | Sahip | Tür |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | iddialı ya da taahhüt |

### Haftalık rapor

**[Ekip] · [hafta, tarih aralığı] · Durum: yolunda**

Kısa özet: ...

| Anahtar sonuç | Başlangıç | Hedef | Şu an | Geçen hafta | Güven (1 ile 10) | Durum |
|---|---|---|---|---|---|---|

**Bu hafta biten:** ...
**Engeller ve ihtiyaçlar:** [kimden] [ne] [tarih]
**Gelecek hafta:** 1) ... 2) ... 3) ...

## Yapma
- Beşten fazla hedef ya da hedef başına beşten fazla anahtar sonuç yazma.
- Yapılan işlerin uzun listesini rapor diye sunma.
- Ölçülemeyen ya da verisi toplanamayan anahtar sonuç yazma; önce ölçümün nasıl yapılacağını belirle.
- Dönem ortasında hedefi sessizce değiştirme; değişikliği gerekçesiyle rapora yaz.`,
    dosyalar: [],
  },
  {
    id: "is-ilani-mulakat", ad: "is-ilani-mulakat", baslik: "İş ilanı ve mülakat soruları", kategori: "operasyon", simge: "/gercek/galeri/portre9.webp",
    aciklama: "Bir pozisyon için iş ilanı, rol tanımı, yapılandırılmış mülakat soruları, değerlendirme puan anahtarı ve adaylara başvuru alındı, mülakat daveti, olumsuz dönüş ya da teklif e-postası yazarken kullan. Ayrımcılık içermeyen dili (İş Kanunu eşit davranma ilkesi ve Türkiye İnsan Hakları ve Eşitlik Kurumu Kanunu), kapsayıcı ifadeyi, sorulmaması gereken soruları, yetkinlik bazlı davranışsal soruları ve KVKK aday aydınlatma metnini kapsar. 'İş ilanı yaz', 'eleman arıyorum', 'mülakat soruları', 'kariyer sayfası', 'aday değerlendirme formu', 'ret maili' gibi isteklerde kullan.",
    ornekler: ["Kafemiz için barista iş ilanı yaz", "Kıdemli yazılımcı mülakatı için soru seti ve puan anahtarı hazırla", "Elenen adaylara nazik bir dönüş e-postası yaz"],
    govde: `# İş ilanı ve mülakat soruları

Amaç: doğru adayın başvurduğu, yanlış adayın kendini elediği bir ilan ve her adaya aynı ölçütle bakan bir mülakat. Ayrımcılık denetimi için references/ayrimcilik-kontrol.md listesini her ilanda uygula.

## Önce topla
- Pozisyon, ekip, kime bağlı
- Sorumluluklar ve ilk 90 günde beklenen sonuçlar
- Olmazsa olmaz yetkinlikler ve tercih sebepleri (ayrı listeler)
- Çalışma biçimi (ofis, hibrit, uzaktan), yer, çalışma saatleri
- Ücret aralığı (paylaşılabiliyorsa) ve yan haklar
- Süreç adımları ve takvim

## İlan yapısı
1. **Başlık**: yaygın unvan ve düzey ("Kıdemli Ön Yüz Geliştirici"); "ninja", "rockstar" gibi süs yok.
2. **Şirket ve ekip**: 2 ile 3 cümle, somut.
3. **Rolün amacı**: bu kişi neden işe alınıyor.
4. **İlk 90 gün**: 3 somut beklenti.
5. **Sorumluluklar**: 5 ile 7 madde, fiille başlar.
6. **Olmazsa olmazlar**: en çok 5 madde; yıl şartı yerine yetkinlik ("3 yıl deneyim" yerine "canlıda çalışan bir ürünü uçtan uca geliştirmiş olmak").
7. **Tercih sebepleri**: ayrı başlık; "hepsini karşılamıyorsan da başvur" cümlesi.
8. **Ne sunuyoruz**: ücret aralığı, yan haklar, gelişim, esneklik.
9. **Süreç**: adımlar ve yaklaşık takvim.
10. **Başvuru ve KVKK**: başvuru yolu, aday aydınlatma metni bağlantısı, eşit fırsat cümlesi; engelli adaylar için başvuru sırasında ihtiyaç duyulan düzenlemeyi belirtme yolu.

## Yapılandırılmış mülakat
1. Rol için 4 ile 6 yetkinlik seç.
2. Her yetkinlik için 2 davranışsal soru ("Bir projenin geciktiğini fark ettiğin bir zamanı anlat: ne yaptın, sonuç ne oldu?") ve 1 durumsal soru yaz.
3. Her adaya aynı sorular aynı sırayla sorulur; değerlendirme mülakattan hemen sonra, adaylar karşılaştırılmadan önce yapılır.
4. Puan anahtarı 1 ile 4: her puan düzeyi için gözlenebilir davranış tarifi.
5. İşin gerektirdiği koşulları ayrımcı olmadan sor: "Bu rol ayda iki kez şehir dışı seyahat gerektiriyor; bu sizin için uygun mu?"

## Sorulmaması gerekenler
Medeni durum, çocuk ya da hamilelik planı, yaş, memleket ve etnik köken, din ve mezhep, siyasi görüş, sendika üyeliği, sağlık geçmişi (işin gerektirdiği yeterlilik dışında), engellilik ayrıntısı, eşinin mesleği.

## Aday iletişimi
- Başvuru alındı: süreç ve takvim.
- Mülakat daveti: tarih seçenekleri, süre, kimlerle, nasıl hazırlanmalı.
- Olumsuz dönüş: kısa, saygılı, kişisel; ayrıntılı gerekçe zorunlu değil; verinin ne kadar süre saklanacağı.
- Teklif: rol, ücret, başlama tarihi, yanıt süresi.

## Çıktı biçimi
1. İlan metni
2. Soru seti tablosu: yetkinlik, soru, iyi yanıtta aranan işaretler
3. Puan anahtarı tablosu: yetkinlik, 1, 2, 3, 4 düzeyleri
4. İstenen e-posta şablonları

## Yapma
- Yaş, cinsiyet, medeni durum, görünüş ya da memleket şartı yazma.
- Fotoğraf zorunluluğu koyma.
- Adaya mülakatta kişisel yaşamıyla ilgili soru sorma.
- Kesin yasal yaptırım tutarı yazma; şüphede kullanıcıya iş hukukçusuna danışmasını öner.`,
    dosyalar: [{ yol: "references/ayrimcilik-kontrol.md", icerik: `# İş ilanı ayrımcılık kontrol listesi

Dayanak: 4857 sayılı İş Kanunu 5. madde (eşit davranma ilkesi) ve 6701 sayılı Türkiye İnsan Hakları ve Eşitlik Kurumu Kanunu. 6701 sayılı Kanun iş ilanı ve işe alım süreçlerinde cinsiyet, ırk, renk, dil, din, inanç, mezhep, felsefi ve siyasi görüş, etnik köken, servet, doğum, medeni hâl, sağlık durumu, engellilik ve yaş temelli ayrımcılığı yasaklar; Kurum başvuru üzerine idari para cezası verebilir. Güncel metni kontrol et.

| Kaçın | Yerine yaz |
|---|---|
| "25 ile 35 yaş arası" | yaş yazma; gereken deneyimi ya da yetkinliği yaz |
| "Bayan eleman", "erkek personel" | "Satış danışmanı" gibi cinsiyetsiz unvan |
| "Hoş görünümlü", "boy kilo orantılı" | "Müşteriyle güler yüzlü ve özenli iletişim kurabilen" |
| "Evli", "bekâr", "çocuksuz" | yazma |
| "Askerliğini yapmış" | yalnız işin niteliği gerçekten gerektiriyorsa ve gerekçesiyle; çoğu ilanda gereksiz |
| "İstanbul doğumlu", "yerel" | "İstanbul'da ofiste çalışabilecek" (yer şartı işe dairse) |
| "Genç ve dinamik ekip" | "Hızlı karar alan, deneme yapmayı seven ekip" |
| "Anadili Türkçe" | "Türkçeyi ileri düzeyde yazılı ve sözlü kullanan" |
| "Fotoğraflı CV" | fotoğraf isteme |
| "Sağlık sorunu olmayan" | işin gerektirdiği fiziksel koşulu tarif et: "10 kg'a kadar yük taşıyabilecek" |

## Ek kontroller
- Ücret ve yan haklar herkes için aynı ölçütle belirlenmiş mi?
- Engelli adaylara erişilebilir başvuru yolu sunuluyor mu? 50 ve üstü çalışanı olan özel sektör işyerlerinde yüzde 3 engelli çalışan istihdam yükümlülüğü vardır.
- KVKK: aday verilerinin işlenme amacı, saklama süresi ve aktarıldığı taraflar aday aydınlatma metninde yazıyor mu? Gelecekteki pozisyonlar için saklanacaksa adayın açık rızası alınmış mı?
- Referans kontrolü adayın bilgisi ve izniyle mi yapılıyor?
` }],
  },
  {
    id: "iys-kvkk-ticari-ileti", ad: "iys-kvkk-ticari-ileti", baslik: "KVKK açık rıza ve İYS uyumlu ticari ileti", kategori: "pazarlama", simge: "/gercek/panel/gal-pazarlama-5.webp",
    aciklama: "SMS, e-posta, telefon araması ya da mesajlaşma uygulamasıyla kampanya, bülten veya duyuru gönderecek bir işletme için izin metni, onay kutusu, İleti Yönetim Sistemi (İYS) kayıt akışı, ret yolu, KVKK aydınlatma ve açık rıza metni hazırlarken ya da mevcut izin akışını denetlerken kullan. Ticari ileti ile bilgilendirme iletisi ayrımını, onay ve ret sürelerini, tacir ve esnaf istisnasını, kayıt saklamayı ve yurt dışındaki gönderim servislerine veri aktarımını kapsar. 'İYS', 'ticari ileti onayı', 'SMS izni', 'e-posta izni', 'açık rıza metni', 'pazarlama izni', 'KVKK onay kutusu' gibi isteklerde kullan.",
    ornekler: ["Kayıt formuma İYS uyumlu SMS ve e-posta izni ekle", "Kampanya SMS'imizin sonuna ne yazmalıyız?", "Terk edilen sepet e-postası için onay gerekir mi?"],
    govde: `# KVKK açık rıza ve İYS uyumlu ticari ileti

Pazarlama iletisi göndermeden önce iki ayrı yükümlülük vardır: 6563 sayılı Kanun kapsamında ticari elektronik ileti onayı (İYS) ve 6698 sayılı KVKK kapsamında aydınlatma ile gerekiyorsa açık rıza. Bu yetenek ikisini ayrı kurar. Metinler şablondur; kullanıcıya yayından önce hukukçuya kontrol ettirmesini ve İYS kurallarının güncel hâlini doğrulamasını söyle.

## Önce topla
- Ticari unvan, MERSİS numarası, İYS'ye kayıtlı mı (marka kodu)
- Kanallar: SMS, e-posta, arama, mesajlaşma uygulaması
- Alıcılar tüketici mi, tacir ve esnaf mı
- İzin nerede alınıyor: üyelik formu, ödeme adımı, mağaza, etkinlik, çağrı merkezi
- İletinin içeriği: kampanya, bülten, kişiselleştirilmiş öneri
- Gönderim servisinin sunucusu yurt dışında mı

## İki izni ayır

| Konu | Ticari elektronik ileti onayı | KVKK açık rızası |
|---|---|---|
| Dayanak | 6563 sayılı Kanun ve Ticari İletişim ve Ticari Elektronik İletiler Hakkında Yönetmelik | 6698 sayılı KVKK |
| Ne için | kanal başına pazarlama iletisi göndermek | açık rızaya dayanan veri işleme, profilleme ve kişiselleştirilmiş pazarlama gibi |
| Kayıt yeri | İYS ve şirket kayıtları | şirket kayıtları |
| Geri alma | İYS ya da iletideki ret yolu | şirketin başvuru kanalı |

İleti onayı ile açık rızayı aynı kutuda birleştirme.

## Onay toplama kuralları
1. Kanal başına ayrı ve önceden işaretlenmemiş onay kutusu: SMS, e-posta, arama.
2. Onay, üyeliğin ya da satın almanın ön koşulu yapılmaz; kayıt düğmesi onay verilmeden de çalışır.
3. Onay metni kimin, hangi kanaldan, ne tür ileti göndereceğini söyler.
4. Onay kanıtı saklanır: tarih, saat, kaynak (form adresi, IP), metnin sürümü.
5. Alınan onay en geç 3 iş günü içinde İYS'ye yüklenir; İYS'de onayı görünmeyen tüketiciye ticari ileti gönderilmez. Alıcı onaylarını İYS üzerinden görebilir ve geri alabilir.
6. Onay kayıtları onayın geçerliliği sona erdikten sonra 3 yıl saklanır.

## İleti içeriği
- Gönderenin kimliği: ticari unvan ya da İYS'ye kayıtlı marka adı, MERSİS numarası ya da iletişim bilgisi.
- Kolay ve ücretsiz ret yolu: SMS'te kısa numaraya ret yazma, e-postada tek tıkla abonelikten çıkma bağlantısı.
- Ret talebi en geç 3 iş günü içinde uygulanır; sonrasında "son bir kampanya" gönderilmez.
- SMS biçimine operatör ve İYS ek ibareler isteyebilir; SMS servis sağlayıcısının güncel biçimini kullan.

## Bilgilendirme iletisi ayrımı
Sipariş onayı, kargo durumu, fatura, şifre sıfırlama, hesap güvenliği, abonelik yenileme hatırlatması gibi mevcut ilişkiye dair iletiler onay gerektirmez. İçine kampanya, indirim, kutlama ya da tanıtım eklenirse ticari ileti olur. Terk edilen sepet hatırlatması ve "beğendiğin ürün indirimde" iletileri tanıtım amaçlıdır; onaysız alıcıya gönderme.

## Tacir ve esnaf
Tacir ve esnafa önceden onay alınmadan ticari ileti gönderilebilir; ancak ret hakları vardır. İYS'de ret kaydı olan tacir ve esnafa gönderilmez; gönderimden önce İYS sorgusu yap.

## KVKK aydınlatma ve açık rıza
- Aydınlatma metni: veri sorumlusu, işleme amaçları, hukuki sebepler, aktarılan taraflar (e-posta ve SMS servis sağlayıcısı, yurt dışı sunucu), toplama yöntemi, KVKK 11. madde hakları ve başvuru yolu.
- Açık rıza: belirli bir konuya ilişkin, bilgilendirmeye dayanan, özgür iradeyle verilir; aydınlatma metninden ayrı sunulur ve her zaman geri alınabilir.
- Yurt dışı aktarım: 2024 değişikliğinden beri öncelik uygun güvencelerdedir (Kurul'un ilan ettiği standart sözleşme gibi); standart sözleşme imzalandıktan sonra 5 iş günü içinde Kurum'a bildirilir.

## Çıktı biçimi
references/izin-metinleri.md içindeki şablonları doldur, ardından denetim tablosu ver:

| Madde | Durum | Düzeltme |
|---|---|---|

## Yapma
- "Aydınlatma metnini okudum ve kampanya iletisi almak istiyorum" gibi birleşik tek kutu kullanma.
- Satın alınmış ya da başka bir şirketten devralınmış liste kullanma.
- Kesin ceza tutarı yazma; tutarlar her yıl yeniden değerleme oranıyla güncellenir.`,
    dosyalar: [{ yol: "references/izin-metinleri.md", icerik: `# İzin metni şablonları

Köşeli parantezli alanları doldur. Kutular önceden işaretli olmaz ve üyeliğin ön koşulu yapılmaz.

## Onay kutuları (kanal başına ayrı)
- [ ] [Ticari unvan] tarafından kampanya, indirim ve yeniliklerle ilgili **e-posta** almak istiyorum.
- [ ] [Ticari unvan] tarafından kampanya, indirim ve yeniliklerle ilgili **SMS** almak istiyorum.
- [ ] [Ticari unvan] tarafından kampanya ve yeniliklerle ilgili **telefonla aranmak** istiyorum.

Kutuların altına: "İzinlerinizi dilediğiniz zaman hesap ayarlarından, iletilerdeki ret bağlantısından ya da İYS üzerinden geri alabilirsiniz. Kişisel verilerinizin işlenmesine ilişkin [aydınlatma metni] bağlantısı."

## Açık rıza kutusu (yalnız gerekiyorsa, ayrı)
- [ ] Alışveriş geçmişime göre bana özel öneriler sunulması amacıyla kişisel verilerimin [açık rıza metni] kapsamında işlenmesine açık rıza veriyorum.

## SMS sonu
"[Marka] · Mersis [numara] · Ret için RET yazıp [kısa numara] numarasına ücretsiz gönderin."
Operatör ve İYS'nin istediği ek ibareleri SMS servis sağlayıcısından teyit et.

## E-posta alt bilgisi
"Bu e-postayı [tarih] tarihinde verdiğiniz izinle aldınız. [Ticari unvan], [adres], Mersis [numara]. Artık almak istemiyorsanız [abonelikten çık] bağlantısını kullanın."

## Denetim listesi
- [ ] Kanal başına ayrı ve boş onay kutusu
- [ ] Onay üyeliğin ön koşulu değil
- [ ] Onay kanıtı (tarih, saat, kaynak, metin sürümü) saklanıyor
- [ ] Onaylar 3 iş günü içinde İYS'ye yükleniyor
- [ ] Gönderimden önce İYS sorgusu yapılıyor
- [ ] Her iletide gönderen kimliği ve ücretsiz ret yolu var
- [ ] Ret talepleri 3 iş günü içinde uygulanıyor
- [ ] Bilgilendirme iletilerinde tanıtım yok
- [ ] Aydınlatma metni ile açık rıza ayrı
- [ ] Yurt dışı aktarım için uygun güvence ve bildirim yapıldı
` }],
  },
  {
    id: "marka-adi-slogan", ad: "marka-adi-slogan", baslik: "Marka adı ve slogan üretimi", kategori: "marka", simge: "/gercek/panel/gal-soul2-5.webp",
    aciklama: "Yeni bir şirket, ürün, uygulama, mağaza ya da hizmet için marka adı, ürün adı, slogan ve kısa marka cümlesi üretirken ve aday adları elerken kullan. Konumlandırma cümlesini, ad türlerini, söyleniş ve yazılış denetimini, Türkçe ve yabancı dillerde olumsuz anlam kontrolünü, puan tablosunu, TÜRKPATENT marka araştırması ve Nice sınıfı önerisini, alan adı ve sosyal medya kullanıcı adı kontrolünü kapsar. 'Marka adı bul', 'isim öner', 'şirket adı', 'slogan yaz', 'tagline', 'ürünüme isim', 'uygulama adı' gibi isteklerde kullan.",
    ornekler: ["Organik zeytinyağı markam için isim öner", "Muhasebe uygulamamız için kısa ve akılda kalır bir slogan yaz", "Bu beş aday adı puanla ve ele"],
    govde: `# Marka adı ve slogan üretimi

İyi bir ad, konumlandırmaya hizmet eder, duyulduğunda yazılabilir, tescil edilebilir ve markayla birlikte büyüyebilir. Bu yetenek önce konumlandırmayı netleştirir, sonra geniş üretir ve dürüstçe eler.

## Önce topla
- Ne yapıyor, kime, neden farklı
- Rakipler ve onların ad tarzı
- Markanın kişiliği: üç sıfat
- Kaçınılacak çağrışımlar
- Pazar: yalnız Türkiye mi, yurt dışı da mı (ad dili ve Türkçe karakter kararı buna bağlı)
- Uzunluk ve alan adı beklentisi

## Adımlar
1. **Konumlandırma cümlesi yaz.** "[Hedef kitle] için [kategori] olan [marka], [ana fayda] sağlar, çünkü [kanıt]." Kullanıcıya onaylat; adlar bu cümleye göre üretilir.
2. **Ad türlerinden geniş üret** (toplam 20 ile 30 aday, en az dört türden):

| Tür | Tarif | Güçlü yanı | Zayıf yanı |
|---|---|---|---|
| Tarif edici | ne yaptığını söyler | hemen anlaşılır | tescili zor, genişlemesi dar |
| Çağrışımlı | faydayı ya da duyguyu ima eder (Getir) | akılda kalır | açıklama ister |
| Birleşik | iki kelimeyi birleştirir (Yemeksepeti) | anlaşılır ve özgün | uzayabilir |
| Uydurma | yeni kelime | tescili kolay, alan adı boşta olabilir | anlam yüklemek pahalı |
| Yabancı kökenli | başka dilden kelime | uluslararası ses | yanlış telaffuz riski |
| Kişi ya da yer adı | kurucu ya da yöre | sıcak ve köklü | devri ve genişlemesi zor |

3. **Ele.** Ölçütler:
   - Duyulduğunda tek biçimde yazılabiliyor mu, tek biçimde okunuyor mu?
   - 2 ile 3 hece ideal; 4'ü geçiyorsa gerekçesi olsun.
   - Türkçe karakter (ş, ğ, ı) alan adında ve yabancı pazarda sorun çıkarır mı?
   - Türkçe argoda ya da hedef pazar dillerinde olumsuz anlamı var mı?
   - Büyük bir markaya ses ya da yazım olarak benziyor mu?
   - Kategoriyi kilitliyor mu (ileride başka ürüne geçişi zorlaştırır mı)?
4. **Kontrolleri listele.** Kullanıcıya yaptır, sonucu uydurma:
   - TÜRKPATENT marka araştırması, ilgili Nice sınıflarında benzer ad (yazılım için 9 ve 42, giyim için 25, yeme içme hizmeti için 43, perakende ve reklam hizmetleri için 35)
   - Alan adı (.com, .com.tr, .tr); .tr uzantılı adlar 2022'den beri TRABİS üzerinden çoğunlukla belge istenmeden alınabiliyor
   - Instagram, X, TikTok, LinkedIn kullanıcı adları
   - Uygulama mağazalarında aynı ya da çok benzer ad
   - Ticaret unvanı çakışması
5. **Kısa liste.** En iyi 5 ad, puan tablosuyla.
6. **Slogan.** Ad seçildikten sonra 10 seçenek; 2 ile 6 kelime. Her birinin yaklaşımını yaz: fayda, tavır, söz, kelime oyunu. Ritim ve ses tekrarı kullan; adın anlamını tekrarlama, tamamla.

## Puan tablosu

| Ad | Tür | Anlam (1 ile 5) | Söyleniş (1 ile 5) | Ayırt edicilik (1 ile 5) | Genişleyebilirlik (1 ile 5) | Alan adı | Kontrol edilecek |
|---|---|---|---|---|---|---|---|

## Kurallar
- Yalnız genel ve tarif edici kelimelerden oluşan ad ("Lezzetli Kahve") tescilde ayırt edici bulunmayabilir; kullanıcıyı uyar.
- "Bu ad boşta" diye kesin hüküm verme; nihai araştırmayı marka vekiline yaptırmasını öner.
- Slogan ile kampanya başlığını karıştırma: slogan yıllarca kalır, kampanya başlığı dönemliktir.

## Yapma
- Var olan büyük bir markanın adını küçük değişiklikle önerme.
- "Pro", "Plus", "Tech" eklerini yığma.
- Sloganda "kalite", "güven", "en iyi" gibi herkesin kullandığı klişeleri kullanma.
- Kısa listeyi gerekçesiz bırakma; her adın neden listede olduğunu bir cümleyle yaz.`,
    dosyalar: [],
  },
  {
    id: "rakip-analizi-tablosu", ad: "rakip-analizi-tablosu", baslik: "Rakip analizi tablosu", kategori: "marka", simge: "/gercek/panel/gal-pazarlama-7.webp",
    aciklama: "Bir ürün, site, uygulama ya da yerel işletme için rakipleri belirlerken; özellik, fiyat, mesaj ve kanal karşılaştırma tablosu, konumlandırma haritası, güçlü ve zayıf yanlar ile fırsat listesi çıkarırken kullan. Doğrudan, dolaylı ve ikame rakip ayrımını, kanıta dayalı ve tarih damgalı tablo düzenini, müşteri yorumlarından itiraz çıkarmayı, reklam kütüphanelerinden kanal incelemesini ve bilinmeyen veriyi uydurmadan işaretlemeyi kapsar. 'Rakip analizi', 'rakiplerimi incele', 'karşılaştırma tablosu', 'pazar araştırması', 'rakip fiyatları', 'SWOT', 'konumlandırma' gibi isteklerde kullan.",
    ornekler: ["Kadıköy'deki beş kahveciyle bizi karşılaştıran tablo hazırla", "Rakip muhasebe uygulamalarının fiyat ve özelliklerini kıyasla", "Rakiplerin yorumlarından en sık şikâyetleri çıkar"],
    govde: `# Rakip analizi tablosu

Rakip analizi bir karar için yapılır: fiyatlandırma, özellik önceliği, mesaj ya da reklam stratejisi. Bu yetenek kanıta dayalı, tarih damgalı ve aksiyona dönük bir karşılaştırma üretir.

## Önce topla
- Kendi ürün ya da işletme, pazar ve hedef kitle
- Bilinen rakipler (kullanıcı bildiği kadarıyla)
- Analizin hangi karara hizmet edeceği
- Coğrafya (yerel işletmede semt ya da şehir)

## Adımlar
1. **Rakip listesini çıkar.** 5 ile 8 rakip, üç türde:
   - Doğrudan: aynı çözüm, aynı kitle.
   - Dolaylı: farklı çözüm, aynı sorun (muhasebe uygulaması için mali müşavir).
   - İkame: hiçbir şey yapmamak, Excel, elle çözmek.
   Kaynaklar: arama sonuçları, uygulama mağazaları, pazar yerleri, Google Haritalar, sektör listeleri ve müşterilere "bizden önce ne kullanıyordunuz?" sorusu.
2. **Her rakip için kanıt topla.**
   - Ana sayfa vaadi: başlığı kelimesi kelimesine al.
   - Fiyat ve paketler, ücretsiz deneme, taahhüt.
   - Ana özellikler ve eksikler.
   - Hedef kitle ve kullandığı dil.
   - Kanallar: Meta Reklam Kütüphanesi ve Google Reklam Şeffaflık Merkezi'nde aktif reklamlar, sosyal medya sıklığı, içerik türleri.
   - Müşteri yorumları: Google, uygulama mağazası, Şikayetvar, pazar yeri puanları; en sık övgü ve en sık şikâyet.
   Web araştırma aracı varsa kullan; yoksa kullanıcıdan bağlantı ve ekran görüntüsü iste. Bulamadığın veri için "bilinmiyor" yaz, tahmin etme.
3. **Karşılaştırma tablosunu kur** (aşağıdaki biçim).
4. **Konumlandırma haritası çiz.** Karar için anlamlı iki eksen seç (fiyat ve uzmanlık, kendin yap ve tam hizmet, hız ve kişiselleştirme); rakipleri yerleştir, boş alanı göster. Metin olarak dört bölgeli tablo yeterli.
5. **Mesajı çöz.** Herkesin söylediği (kategorinin olmazsa olmazı, fark yaratmaz) ve kimsenin söylemediği (fırsat) ayrı liste.
6. **Fırsatları yaz.** 3 ile 5 somut öneri; her biri bir kanıta bağlı ("Üç rakibin yorumlarında en sık şikâyet geç kurulum; ilk gün kurulum sözünü ana mesaja taşı").
7. **Tarih ve kaynak.** Her bilginin kaynağı ve toplandığı tarih; fiyatlar hızla eskir.

## Çıktı biçimi

### Karşılaştırma tablosu

| Ölçüt | Biz | Rakip A | Rakip B | Rakip C |
|---|---|---|---|---|
| Tür | ... | doğrudan | dolaylı | ikame |
| Ana vaat | ... | ... | ... | ... |
| Başlangıç fiyatı | ... | ... | ... | ... |
| Öne çıkan özellik | ... | ... | ... | ... |
| Eksik | ... | ... | ... | ... |
| Ana kanal | ... | ... | ... | ... |
| Yorum puanı ve yorum sayısı | ... | ... | ... | ... |
| En sık övgü | ... | ... | ... | ... |
| En sık şikâyet | ... | ... | ... | ... |

### Güçlü ve zayıf yanlar, fırsatlar ve tehditler
Dört başlık, her biri en çok 4 madde; her madde bir kanıta dayanır.

### Fırsat listesi

| Fırsat | Kanıt | Önerilen aksiyon | Etki | Çaba |
|---|---|---|---|---|

### Kaynaklar
Bağlantı ya da kaynak adı ve erişim tarihi.

## Yapma
- Rakibi kötüleyen dil kullanma; analiz nesnel olmalı.
- Rakibin gizli bilgisine ulaşmak için sahte müşteri olup sözleşme isteme ya da çalışanlarından bilgi alma gibi yöntemler önerme.
- Tek bir yorumdan genelleme yapma.
- Tarihsiz fiyat yazma.
- Analizi karşılaştırmalı reklama dönüştürürken google-meta-reklam-metni yeteneğindeki karşılaştırmalı reklam kuralını atlama.`,
    dosyalar: [],
  },
];
