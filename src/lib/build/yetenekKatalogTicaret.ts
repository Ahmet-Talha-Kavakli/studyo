import type { KatalogYetenek } from "./yetenekKatalog";

export const YETENEKLER_TICARET: KatalogYetenek[] = [
  {
    id: "e-fatura-e-arsiv", ad: "e-fatura-e-arsiv", baslik: "e-Fatura ve e-Arşiv fatura", kategori: "finans", simge: "/gercek/galeri/soyut1.webp",
    aciklama: "e-Fatura ya da e-Arşiv fatura hazırlarken, kesilmiş bir faturanın GİB kurallarına uygunluğunu denetlerken, alıcıya göre belge türü, senaryo (temel, ticari) ve fatura tipi (satış, iade, tevkifat, istisna) seçerken, internet satışı faturasına zorunlu ibare ve kargo bilgilerini eklerken, fatura numarası, ETTN, KDV ve toplam hatalarını bulurken kullan. Tetikleyiciler: fatura kes, e-arşiv, e-fatura, ETTN, fatura kontrol, iade faturası, tevkifatlı fatura.",
    ornekler: ["Bu e-Arşiv faturayı GİB kurallarına göre kontrol et", "Kurumsal müşteriye iade faturası nasıl kesilir?", "İnternet satışı faturama hangi bilgiler eklenmeli?"],
    govde: `# e-Fatura ve e-Arşiv fatura

Bu yetenek Türkiye'de elektronik belge düzenleyen işletmelerin faturalarını hazırlar ve denetler. Zorunluluk eşikleri, oranlar ve kod listeleri sık değişir: her çıktıya "güncel eşik, oran ve kodları mali müşavirinizle doğrulayın" notunu düş.

## Önce topla
- Satıcı e-Fatura mükellefi mi; hangi özel entegratörü ya da GİB e-Belge portalını kullanıyor
- Alıcı e-Fatura kayıtlı kullanıcısı mı (VKN ya da TCKN ile GİB kayıtlı kullanıcı listesinden sorgulanır); değilse bireysel mi kurumsal mı
- Kalemler: mal ya da hizmet adı, miktar, birim, birim fiyat, iskonto, KDV oranı, varsa ÖTV, tevkifat ya da istisna
- Satış kanalı: kendi site, mağaza, pazaryeri
- Teslim ya da hizmetin tamamlandığı tarih (fatura bu tarihten itibaren en geç 7 gün içinde düzenlenir)

## Belge türünü seç
1. Alıcı e-Fatura kayıtlı kullanıcısıysa belge **e-Fatura**, değilse **e-Arşiv fatura** olur.
2. e-Fatura senaryosu: **TEMELFATURA** alıcıya sistem üzerinden kabul ya da ret hakkı vermez; **TICARIFATURA** alıcının 8 gün içinde sistem üzerinden kabul ya da ret yanıtı vermesine izin verir. Kamu idarelerine KAMU, gümrük çıkışlı satışta IHRACAT senaryosu kullanılır.
3. Fatura tipini belirle (\`references/fatura-tipleri.md\`). Emin değilsen tipi "mali müşavire sorulacak" diye işaretle; yanlış tip beyannameyi bozar.

## Zorunlu alanları kontrol et
- Fatura numarası 16 karakterdir: 3 karakterlik seri, 4 haneli yıl ve 9 haneli sıra numarası (ABC2026000000001). Sıra atlanmaz, aynı yıl içinde tekrarlanmaz.
- ETTN (UUID) her belgede benzersiz olmalı.
- Düzenleme tarihi ve saati; satıcı ve alıcının unvanı ya da adı soyadı, adresi, vergi dairesi, VKN ya da TCKN.
- Bireysel alıcının TCKN'si alınamıyorsa entegratörün tanımladığı genel kimlik numarası kullanılır; bunu mali müşavirle teyit et.
- Her kalemde ad, miktar, birim, birim fiyat, iskonto, KDV oranı ve tutarı, satır tutarı.
- Toplamlar: mal ve hizmet toplamı, toplam iskonto, KDV matrahı, oran bazında hesaplanan KDV, vergiler dahil toplam, ödenecek tutar ve yazıyla tutar.
- Tevkifatlı faturada tevkifat kodu ve oranı; istisnalı faturada istisna kodu ve gerekçesi bulunur.

## İnternet satışında e-Arşiv ek bilgileri
- "Bu satış internet üzerinden yapılmıştır." ibaresi
- Satışın yapıldığı web adresi
- Ödeme şekli ve ödeme tarihi
- Gönderim tarihi ve gönderiyi taşıyan firmanın unvanı ile VKN ya da TCKN'si
- Belge alıcıya elektronik ortamda (e-posta ya da hesabım sayfası) iletilir; istenirse kâğıt çıktısı verilir.

## Hesap kontrolü
Toplamları yeniden hesapla; kuruş yuvarlamasını satır bazında yap ve toplamı yuvarlanmış satırlardan topla.
\`\`\`
satir_net    = miktar * birim_fiyat - satir_iskonto
satir_otv    = satir_net * otv_orani / 100        (yalnız ÖTV'li kalemde)
satir_kdv    = yuvarla((satir_net + satir_otv) * kdv_orani / 100, 2)
genel_toplam = toplam(satir_net) + toplam(satir_otv) + toplam(satir_kdv)
\`\`\`
ÖTV, KDV matrahına dahildir. Tevkifatlı faturada ödenecek tutar, tevkif edilen KDV düşülerek bulunur.

## İptal, ret ve iade
- Gönderilmiş bir e-Fatura sistemden geri çekilemez. TICARIFATURA'da alıcı süresi içinde ret yanıtı verir; TEMELFATURA'da itiraz, kanunda sayılan yollarla ya da GİB portalındaki itiraz bildirimiyle yapılır.
- e-Arşiv fatura iptali entegratörün ve GİB'in güncel kurallarına göre yapılır; iptal edilen belgenin yerine yeni numarayla belge kesilir.
- Kayıtlı kullanıcı alıcı malı iade ederse iade faturasını alıcı düzenler; iade edilen faturanın numarası ve tarihi belirtilir.
- Tüketiciden gelen iadede belgeleme yöntemini (iade bölümü, gider pusulası ya da entegratörün iade belgesi) mali müşavirle belirle.

## Çıktı
Kontrol sonucunu tablo olarak ver:
| Alan | Durum | Bulunan değer | Düzeltme |
|---|---|---|---|
Ardından düzeltilmiş fatura verisini entegratöre girilecek alan listesi olarak yaz ve doğrulanması gereken maddeleri ayrıca sırala.

## Yapma
- Vergi oranı, istisna kodu, tevkifat oranı ya da zorunluluk eşiği uydurma; bilmiyorsan "doğrulanacak" yaz.
- Kesilmiş ve gönderilmiş bir faturayı sessizce değiştirmeyi önerme; iptal, ret ya da iade yolunu göster.
- Fatura numarasında sıra atlatma, boşluk bırakma ya da elle numara üretme.`,
    dosyalar: [{ yol: "references/fatura-tipleri.md", icerik: `# Fatura senaryoları ve tipleri

## Senaryolar
| Senaryo | Ne zaman | Alıcının yanıtı |
|---|---|---|
| TEMELFATURA | e-Fatura kayıtlı alıcıya olağan satış | Sistem üzerinden kabul ya da ret yok |
| TICARIFATURA | Alıcının sistem üzerinden kabul ya da ret vermesi istendiğinde | 8 gün içinde kabul ya da ret |
| KAMU | Kamu idarelerine satış | Kamu kurumunun kurallarına göre |
| IHRACAT | Gümrük çıkışlı ihracat | Gümrük beyannamesiyle ilişkilendirilir |
| EARSIVFATURA | e-Fatura kayıtlı olmayan alıcı | Yok |

## Tipler
| Tip | Kullanım |
|---|---|
| SATIS | Olağan mal ve hizmet satışı |
| IADE | Kayıtlı kullanıcı alıcının satıcıya iadesi; iade edilen faturanın numarası ve tarihi yazılır |
| TEVKIFAT | KDV'nin bir kısmının alıcı tarafından sorumlu sıfatıyla beyan edildiği teslim ve hizmetler; tevkifat kodu ve oranı zorunlu |
| ISTISNA | KDV'den istisna teslim ve hizmetler; istisna kodu ve dayanağı zorunlu |
| OZELMATRAH | Özel matrah şekline tabi teslimler (ikinci el araç, altın gibi) |
| IHRACKAYITLI | İhraç kaydıyla teslimler |

## Gönderim öncesi son kontrol
- Alıcı kayıtlı kullanıcı listesinde mi, doğru etiket (posta kutusu) seçildi mi
- Seri ve sıra numarası doğru, ETTN benzersiz
- Satır KDV'leri ve genel toplam yeniden hesaplandı
- İnternet satışında zorunlu ibare, web adresi, ödeme ve kargo bilgileri var
- Tevkifat ya da istisna kodu güncel listede

Kod listeleri GİB tarafından güncellenir; entegratörün güncel listesini ve mali müşaviri esas al.
` }],
  },
  {
    id: "kdv-otv-fiyat-etiketi", ad: "kdv-otv-fiyat-etiketi", baslik: "KDV, ÖTV ve fiyat etiketi", kategori: "finans", simge: "/gercek/galeri/soyut3.webp",
    aciklama: "KDV dahil fiyatı KDV hariç tutara ya da tersine çevirirken, ÖTV'li bir üründe vergi matrahını ve son fiyatı hesaplarken, sepet ve fatura arasında kuruş yuvarlaması farkı çıktığında, raf etiketi ya da site fiyatını ve birim fiyatı Fiyat Etiketi Yönetmeliği'ne uygun gösterirken kullan. Tetikleyiciler: KDV hesapla, KDV dahil, KDV hariç, net fiyat, ÖTV, fiyat etiketi, birim fiyat, kuruş farkı.",
    ornekler: ["1.250 TL KDV dahil fiyatın KDV'siz tutarı ne?", "ÖTV'li ürünün etiket fiyatını hesapla", "Sitemdeki fiyat gösterimi yönetmeliğe uygun mu?"],
    govde: `# KDV, ÖTV ve fiyat etiketi

Bu yetenek fiyatları vergi dahil ve hariç arasında doğru çevirir, ÖTV'li ürünlerde matrahı kurar ve etiket ile site fiyatını mevzuata uygun gösterir. Oranlar Cumhurbaşkanı kararıyla değişebilir: her hesapta kullandığın oranı yaz ve "güncel oranı doğrula" notunu düş.

## Önce topla
- Ürün ya da hizmetin türü, mümkünse GTİP ya da kategori (oran buna göre belirlenir)
- Verilen fiyat KDV dahil mi hariç mi
- ÖTV'ye tabi mi; tabiyse hangi liste ve oransal mı maktu mu
- Satış kanalı: raf etiketi, site, pazaryeri, kurumsal teklif
- Ambalaj miktarı ve birimi (birim fiyat için)

## Oranlar
2026 itibarıyla yaygın KDV oranları genel yüzde 20, indirimli yüzde 10 ve yüzde 1'dir. Bir ürünün hangi orana girdiğini kendi bilginle kesinleştirme; KDV Kanunu'na ekli listeler ve güncel kararlarla doğrulanmalı. ÖTV oranları ve maktu tutarlar daha da sık değişir; kullanıcının ya da mali müşavirin verdiği değerle çalış.

## Hesap adımları
1. Fiyatın türünü sabitle; bütün hesaplara KDV hariç net tutardan başla.
2. ÖTV varsa önce ÖTV'yi hesapla, sonra KDV'yi ÖTV eklenmiş tutar üzerinden hesapla.
3. Yuvarlamayı her satırda kuruşa yap, toplamı yuvarlanmış satırlardan topla. Sepet, sipariş ve fatura aynı yöntemi kullanmalı.
4. Vergiler dahil fiyattan geriye net bulduğunda, bulunan neti ileri hesaplayıp kuruş farkını kontrol et; fark varsa neti bir kuruş oynatarak etiket fiyatını tutturmayı dene.

\`\`\`
net              = brut / (1 + kdv/100)
kdv_tutari       = net * kdv/100
otv_oransal      = net * otv/100
otv_maktu        = birim_otv * adet
kdv_otvli        = (net + otv_tutari) * kdv/100
vergiler_dahil   = net + otv_tutari + kdv_tutari
otvli_geri_net   = brut / ((1 + otv/100) * (1 + kdv/100))
birim_fiyat      = satis_fiyati / ambalaj_miktari
\`\`\`
Hesap için \`scripts/vergi.js\` dosyasındaki işlevleri kullan.

## Fiyat etiketi ve site gösterimi
- Tüketiciye gösterilen satış fiyatı Türk lirası ve tüm vergiler dahil olur; tüketici satışında "artı KDV" gösterimi kullanılmaz.
- Etikette malın adı, ayırıcı özelliği, üretim yeri ve satış fiyatı bulunur.
- Kilogram, litre, metre, metrekare ya da metreküp üzerinden satılan ambalajlı ürünlerde satış fiyatının yanında birim fiyat da gösterilir (1 kg ya da 1 litre fiyatı gibi).
- İnternette kargo ücreti fiyattan ayrı ve açıkça belirtilir; ödeme adımında ilk kez çıkan ücret olmaz.
- İndirimli fiyatta eski fiyat olarak indirimden önceki son 30 gün içinde uygulanan en düşük fiyat gösterilir (kampanya kurgusu yeteneğine bak).
- Kurumsal tekliflerde KDV hariç fiyat yazılabilir; KDV oranı ve tutarı ayrı satırda gösterilir.

## Çıktı
| Ürün | Net | ÖTV | KDV oranı | KDV | Vergiler dahil | Birim fiyat |
|---|---|---|---|---|---|---|
Tablonun altına kullanılan oranları ve "oranlar bugünkü mevzuata göre doğrulanmalıdır" notunu yaz. Etiket ya da site için gösterim metnini ayrıca ver.

## Yapma
- Oranı tahmin etme; emin değilsen tabloya "doğrulanacak" yaz.
- KDV'yi ÖTV'siz tutar üzerinden hesaplama.
- Toplamı tek seferde yuvarlayıp satır toplamlarıyla uyumsuz bırakma.
- Tüketiciye gösterilen fiyatı vergi hariç yazma.`,
    dosyalar: [{ yol: "scripts/vergi.js", icerik: `// Vergi hesapları. Tutarlar TL, oranlar yüzde olarak verilir (20, 10, 1). Oranları her zaman güncel mevzuattan doğrula.
export function yuvarla(x) {
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

export function kdvDahil(net, kdvOrani) {
  return yuvarla(net * (1 + kdvOrani / 100));
}

export function kdvHaric(brut, kdvOrani) {
  return yuvarla(brut / (1 + kdvOrani / 100));
}

// Oransal ÖTV: KDV matrahı ÖTV dahil tutardır.
export function otvliFiyat(net, otvOrani, kdvOrani) {
  const otv = yuvarla(net * otvOrani / 100);
  const kdv = yuvarla((net + otv) * kdvOrani / 100);
  return { net: net, otv: otv, kdv: kdv, toplam: yuvarla(net + otv + kdv) };
}

// Maktu ÖTV: birim başına sabit tutar.
export function maktuOtvliFiyat(net, birimOtv, adet, kdvOrani) {
  const otv = yuvarla(birimOtv * adet);
  const kdv = yuvarla((net + otv) * kdvOrani / 100);
  return { net: net, otv: otv, kdv: kdv, toplam: yuvarla(net + otv + kdv) };
}

// Vergiler dahil fiyattan geriye: net, ÖTV ve KDV. Kuruş farkı döner.
export function otvliGeri(brut, otvOrani, kdvOrani) {
  const net = yuvarla(brut / ((1 + otvOrani / 100) * (1 + kdvOrani / 100)));
  const ileri = otvliFiyat(net, otvOrani, kdvOrani);
  return Object.assign(ileri, { kurusFarki: yuvarla(brut - ileri.toplam) });
}

// Birim fiyat: ambalaj miktarı kg, litre ya da metre gibi birimde verilir.
export function birimFiyat(satisFiyati, miktar) {
  return yuvarla(satisFiyati / miktar);
}
` }],
  },
  {
    id: "pazaryeri-urun-listeleme", ad: "pazaryeri-urun-listeleme", baslik: "Pazaryeri ürün listeleme", kategori: "eticaret", simge: "/gercek/galeri/urun2.webp",
    aciklama: "Trendyol, Hepsiburada, n11 ya da Amazon Türkiye'ye ürün yüklerken kullan: kurallara uygun ürün başlığı, kategori özellik alanları, varyant ve barkod yapısı, görsel düzeni ve toplu yükleme tablosu. Ürün onaya düşmüyorsa, aramada ve filtrede görünmüyorsa ya da başlıklar dağınıksa da kullan. Tetikleyiciler: pazaryeri, Trendyol başlık, Hepsiburada listeleme, n11, ürün yükleme, varyant, barkod, toplu yükleme şablonu.",
    ornekler: ["Bu ürünü Trendyol'a yükleyeceğim, başlık ve özellikleri hazırla", "Ürünlerim Hepsiburada'da filtrede çıkmıyor", "50 varyant için toplu yükleme tablosu çıkar"],
    govde: `# Pazaryeri ürün listeleme

Bu yetenek Trendyol, Hepsiburada, n11 ve Amazon Türkiye için ürün başlığı, özellik alanları, varyant yapısı ve toplu yükleme tablosu hazırlar. Pazaryerleri kurallarını sık günceller: kategori kurallarını ve görsel ölçülerini satıcı panelinden doğrulamasını kullanıcıya hatırlat.

## Önce topla
- Hangi pazaryeri ya da pazaryerleri, ürün kategorisi
- Marka: pazaryerinde onaylı mı, marka tescil ya da yetki belgesi var mı
- Barkod (GTIN, EAN-13): her varyant için ayrı ve GS1 kayıtlı mı
- Varyant boyutları: renk, beden, kapasite, paket adedi
- Teknik özellikler, malzeme, ölçü, ağırlık, menşe, garanti süresi
- Görseller, satış fiyatı, stok adedi, paket ölçüsü ve desi

## Başlık kurgusu
Sıra: **marka, ürün tipi, model ya da seri, ayırıcı özellik, varyant bilgisi.**
- "Lumen Seramik Kupa 350 ml El Yapımı Mat Yeşil" gibi okunur bir dizilim kur.
- Mobil listede başlığın yalnız ilk kısmı görünür; ürün tipini başa yakın tut.
- Kelimelerin ilk harfi büyük ya da cümle düzeni; tamamı büyük harfle yazma.
- Başlıkta fiyat, indirim, "kargo bedava", "en ucuz", emoji, özel simge ve rakip marka adı olmaz.
- Aynı kelimeyi tekrarlama, alakasız anahtar kelime doldurma.

## Özellik alanları
1. Kategorinin zorunlu özelliklerini eksiksiz doldur; filtrede çıkmanın yolu budur.
2. Değerleri pazaryerinin hazır listesinden seç; listede karşılığı olan değeri serbest metinle yazma.
3. Ölçüleri birimiyle ve tutarlı yaz (cm, ml, kg); aynı mağazada birim karıştırma.
4. Menşe, malzeme ve garanti bilgisi gerçeğe ve ambalaja uygun olmalı.

## Varyant ve barkod
- Her renk ve beden birleşimi ayrı stok birimidir: kendi barkodu, stok kodu ve stok adedi olur.
- Aynı ürünün varyantları ortak model koduyla gruplanır; farklı ürünü aynı model koduna bağlama.
- Barkodu başka bir ürünle paylaşma; pazaryeri ürünü yanlış katalog kaydına eşler.

## Görsel
- Ana görsel düz ve açık zeminde; ürün kadrajın büyük kısmını kaplar, üzerinde yazı ve logo yok.
- Ek görseller: kullanım anı, yakın detay, ölçü gösterimi, ambalaj ve kutu içeriği.
- En az dört görsel hedefle; bütün varyantların kendi renginde görseli olsun.
- Ölçü ve oranı her pazaryerinin güncel görsel kılavuzundan doğrula; giyimde dikey oran yaygındır.

## Fiyat
Pazaryerinde net kazancı komisyon, kargo, hizmet bedeli ve KDV düştükten sonra hesapla; fiyatlandırma stratejisi yeteneğindeki tabloyu kullan.

## Çıktı
Toplu yükleme için satır başına bir varyant:
| Barkod | Model kodu | Stok kodu | Başlık | Marka | Kategori | Renk | Beden | Fiyat | Stok | Desi | KDV oranı | Görsel adresleri |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
Tabloyu pazaryerinin Excel şablonundaki sütun adlarına eşle; boş kalan zorunlu alanları ve pazaryerine göre farkları (\`references/pazaryeri-farklari.md\`) ayrıca listele.

## Yapma
- Kullanıcının vermediği teknik özelliği ya da barkodu uydurma.
- Yetkili olmadığın bir markanın adını başlığa koyma; uyumluluk için yalnız "X ile uyumlu" ifadesini kullan.
- Tek görselle ya da zorunlu özellikleri boş bırakarak yayına almayı önerme.`,
    dosyalar: [{ yol: "references/pazaryeri-farklari.md", icerik: `# Pazaryerlerinde dikkat edilecek farklar

Bu notlar genel çalışma biçimini anlatır. Komisyon, görsel ölçüsü ve zorunlu alanlar sık değişir; satıcı panelinden doğrula.

## Trendyol
- Varyantlar aynı model kodunu paylaşarak tek ürün sayfasında gruplanır.
- Kategori özellikleri filtrede kullanılır; zorunlu özellik eksikse ürün onaya düşmez.
- Toplu yükleme Excel şablonu ya da satıcı API'siyle yapılır.

## Hepsiburada
- Aynı barkodlu ürün katalogda varsa yeni ürün açılmaz; mevcut ürüne satıcı olarak eklenirsin.
- Katalogdaki yanlış bilgi için içerik düzeltme talebi açılır.

## n11
- Özellik seti kategori ağacına göre değişir; katalog ürünü varsa ona bağlanmak tercih edilir.

## Amazon Türkiye
- Ürünler ASIN üzerinden eşleşir; aynı ürün için ikinci kayıt açmak politika ihlalidir.
- Barkodu olmayan markalı ürünlerde GTIN muafiyeti başvurusu, kendi markan için Marka Kayıt programı gerekir.
- Başlık ve madde işaretli özelliklerde kategori stil kılavuzu uygulanır.

## Ortak kontrol
- Barkod gerçekten bu ürüne ait mi (GS1 Türkiye kaydı)
- Marka yetki belgesi gerekiyor mu
- Başlık, görsel ve özellikler bütün pazaryerlerinde aynı ürünü anlatıyor mu
- Stok bütün kanallarda tek kaynaktan mı güncelleniyor (fazla satış riski)
` }],
  },
  {
    id: "urun-aciklamasi", ad: "urun-aciklamasi", baslik: "Dönüşüm odaklı ürün açıklaması", kategori: "eticaret", simge: "/gercek/galeri/urun7.webp",
    aciklama: "Bir ürün sayfası ya da pazaryeri ilanı için satın almaya götüren açıklama yazarken ya da mevcut açıklamayı iyileştirirken kullan: fayda odaklı açılış, özellik ve fayda maddeleri, teknik tablo, kutu içeriği, bakım, beden ve ölçü rehberi, sık sorulan sorular. Ürün sayfası çok ziyaret alıp az satıyorsa da kullan. Tetikleyiciler: ürün açıklaması yaz, ürün metni, ilan metni, satış metni, açıklamayı güçlendir.",
    ornekler: ["El yapımı seramik kupam için ürün açıklaması yaz", "Bu ürün sayfası çok ziyaret alıyor ama satmıyor, açıklamayı düzelt", "20 ürünün açıklamasını aynı yapıda yeniden yaz"],
    govde: `# Dönüşüm odaklı ürün açıklaması

Bu yetenek bir ürün sayfası ya da pazaryeri ilanı için taranabilir, doğru ve satın almaya götüren bir açıklama yazar. Amaç ürünü süslemek değil, alıcının karar verirken sorduğu soruları sırayla yanıtlamaktır.

## Önce topla
- Ürün adı, kategori, fiyat aralığı, hedef alıcı (kim alır, hangi durumda alır)
- Teknik özellikler ve ölçüler, malzeme, renk seçenekleri, kutu içeriği
- Ürünü benzerlerinden ayıran en çok üç somut özellik
- Sık gelen müşteri soruları, olumsuz yorumlardaki şikâyetler, iade nedenleri
- Kullanılacağı yer: kendi site, pazaryeri ya da ikisi
Eksikse en çok iki soru sor; kalan boşlukları köşeli parantezli yer tutucu olarak bırak.

## Yazım adımları
1. **Açılış (iki cümle):** ürünün kime ne kazandırdığını söyle. Özellik değil sonuç yaz: "Çift cidarlı gövde kahveni saatlerce sıcak tutar" gibi.
2. **Fayda maddeleri (üç ile beş madde):** her madde bir özelliği ve alıcıya etkisini birlikte verir; kalın kısa başlık, ardından tek cümle.
3. **Kullanım anı:** alıcının ürünü nerede ve nasıl kullandığını kısa bir paragrafla canlandır.
4. **Teknik tablo:** ölçü, ağırlık, malzeme, kapasite, uyumluluk, garanti, menşe.
5. **Kutu içeriği ve bakım:** kutudan ne çıkar, nasıl temizlenir, nelere dikkat edilir.
6. **Kaygı giderici bölüm:** beden ya da ölçü rehberi, kargo süresi, iade koşulu, garanti.
7. **Sık sorulan sorular:** gerçek müşteri sorularından üç ile beş soru ve kısa yanıt.

## Kurallar
- Her iddia doğrulanabilir olmalı. "En iyi", "bir numara", "en çok satan" gibi üstünlük iddiaları belgesi yoksa yazılmaz.
- Gıda, takviye, kozmetik ve tıbbi üründe "hastalığı önler", "tedavi eder" gibi sağlık beyanı yazma; yalnız mevzuatın izin verdiği beyanları kullan.
- Fiyatı, stok durumunu ve kampanyayı açıklamaya gömme; değişince metin yanlış kalır.
- Cümleler kısa, paragraflar en çok üç satır; mobilde taranabilir olsun.
- Ana anahtar kelime başlıkta ve ilk paragrafta doğal biçimde geçsin; tekrar doldurma yapma.
- Ses tonunu marka kılavuzundan al; kılavuz yoksa sade, sıcak ve net yaz.
- Olumsuz yorumlarda sık geçen konuyu (ölçü küçük, renk farklı) açıklamada dürüstçe yanıtla; iade oranını düşürür.
- Pazaryerlerinde HTML desteği sınırlı olabilir; düz metin sürümünü de ver.

## Çıktı biçimi
\`\`\`
Başlık: ...
Kısa açıklama (en çok 160 karakter): ...

[Açılış, iki cümle]

- **Fayda 1:** ...
- **Fayda 2:** ...
- **Fayda 3:** ...

[Kullanım anı paragrafı]

| Özellik | Değer |
|---|---|
| Ölçü | ... |
| Malzeme | ... |

Kutu içeriği: ...
Bakım: ...

Sık sorulan sorular
S: ...
C: ...
\`\`\`
Sonuna yazdığın her somut iddianın kaynağını gösteren kısa bir liste ekle: kullanıcının verdiği bilgi mi, yer tutucu mu.

## Yapma
- Ürünü bilmeden ölçü, malzeme ya da sertifika uydurma.
- Rakip markaları kötüleme ya da kanıtsız karşılaştırma yapma.
- Aynı metni bütün varyantlara kopyalayıp renk ya da beden farkını atlama.
- Yapay aciliyet ("son 2 ürün" gibi gerçek olmayan stok uyarısı) yazma.`,
    dosyalar: [],
  },
  {
    id: "kargo-entegrasyonu", ad: "kargo-entegrasyonu", baslik: "Kargo entegrasyonu ve kargo ücreti politikası", kategori: "eticaret", simge: "/gercek/galeri/3d4.webp",
    aciklama: "Bir mağazayı kargo firmasına bağlarken (gönderi kaydı, barkod etiketi, takip numarası, durum güncellemesi, kapıda ödeme, iade kodu), desi ve kargo ücretini hesaplarken, ücretsiz kargo eşiğini belirlerken ve müşteriye gösterilecek kargo ve teslimat politikasını yazarken kullan. Tetikleyiciler: kargo entegrasyonu, desi hesabı, ücretsiz kargo eşiği, kargo ücreti, teslim süresi, kapıda ödeme, kargo takip.",
    ornekler: ["Siteme kargo takip entegrasyonu kur", "Ücretsiz kargo eşiğimi kaç TL yapmalıyım?", "Kargo ve teslimat politikası sayfası yaz"],
    govde: `# Kargo entegrasyonu ve kargo ücreti politikası

Bu yetenek bir mağazanın kargo firmasıyla bağlantısını kurar, desi ve ücret hesabını belirler ve müşteriye gösterilecek kargo politikasını yazar.

## Önce topla
- Çalışılan kargo firmaları ve anlaşma türü (anlaşmalı müşteri numarası, API erişimi ya da kargo toplayıcı servis)
- Ortalama paket ölçüsü ve ağırlığı, en büyük ve en ağır ürün
- Ortalama sepet tutarı ve şu anki sipariş başı kargo maliyeti
- Kapıda ödeme sunulacak mı
- Hazırlama süresi ve günlük kesim saati
- Gönderim bölgesi: yalnız Türkiye mi, yurt dışı da mı

## Ücret hesabı
Kargo firmaları ücreti gerçek ağırlık ile hacimsel ağırlıktan (desi) büyük olana göre alır. Yurt içi gönderide desi bölücüsü genelde 3000'dir; anlaşmandaki değeri doğrula.
\`\`\`
desi             = en_cm * boy_cm * yukseklik_cm / 3000
ucretlendirilen  = max(desi, agirlik_kg)
\`\`\`
Paket ölçülerini ürün kartına kaydet. Sepette birden çok ürün varsa en küçük uygun koliyi seç; boş hacim desiyi gereksiz büyütür.

## Ücretsiz kargo eşiği
1. Mevcut ortalama sepeti ve ortalama kargo maliyetini al.
2. Eşiği ortalama sepetin biraz üzerine koy; amaç sepete bir ürün daha ekletmektir.
3. Eşik tutarındaki bir siparişte katkı payının kargo maliyetini karşıladığını kontrol et:
\`\`\`
katki_payi = esik_kdv_haric - urun_maliyeti - odeme_komisyonu - paket - kargo_maliyeti
\`\`\`
Katkı payı sıfırın altındaysa eşiği yükselt, sabit kargo ücreti uygula ya da ağır ürünleri eşik dışında tut.

## Entegrasyon adımları
1. Kargo firmasının API'siyle ya da kargo toplayıcı servisle bağlantı kur; anahtarlar yalnız sunucuda, ortam değişkeninde dursun.
2. Sipariş "hazırlanıyor" durumuna geçince gönderi kaydı oluştur ve barkod etiketini yazdır.
3. Takip numarasını siparişe yaz, müşteriye bildirim gönder (sipariş bildirimleri yeteneği).
4. Durumları (kargoya verildi, transfer merkezinde, dağıtımda, teslim edildi, teslim edilemedi, iade yolunda) bildirim adresi ya da periyodik sorguyla güncelle; aynı durumu iki kez işleme.
5. Kapıda ödemede tahsilat tutarını ve tahsilat hizmet bedelini ayrı tut; kargo firmasının tahsilat aktarımını siparişlerle eşleştir.
6. İade için anlaşmalı iade kodu üret; müşteri kodu şubede söyleyerek gönderir.
7. Hata durumları: adres eksik, telefon geçersiz, ilçe tanınmıyor. Gönderi kaydı başarısızsa siparişi "kargo bekliyor" listesine al ve ekibi uyar.

## Politika kuralları
- Kargo ücreti ürün sayfasında ve sepette açıkça görünür; ödeme adımında ilk kez çıkmaz.
- Teslim süresi taahhüdü gerçekçi olmalı; mesafeli satışta yasal üst sınır siparişten itibaren 30 gündür.
- Hasarlı pakette müşteriden teslim sırasında kargo görevlisine hasar tutanağı tutturmasını iste; kargo firmasından tazmin için gerekir.
- Kesim saatinden sonra gelen siparişin ertesi iş günü kargolanacağını ürün sayfasında belirt.

## Çıktı
1. Sepet kural tablosu:
| Koşul | Kargo ücreti | Teslim süresi | Not |
|---|---|---|---|
2. Müşteriye yönelik kargo politikası metni (\`assets/kargo-politikasi.md\` şablonundan).
3. Gönderi kaydı için alan listesi: gönderici, alıcı adı, adres, il, ilçe, telefon, parça sayısı, desi, ağırlık, tahsilat tutarı, sipariş numarası.

## Yapma
- Kargo firmasının fiyatını, API adresini ya da alan adlarını uydurma; firmanın güncel dokümanını iste.
- Teslim edilmemiş siparişi "teslim edildi" işaretleme.
- Kargo ücretini ürün fiyatına gizleyip "ücretsiz" diye sunarken eşik koşulunu saklama.`,
    dosyalar: [{ yol: "assets/kargo-politikasi.md", icerik: `# Kargo ve teslimat

**Kargo ücreti:** [TUTAR] TL. [EŞİK] TL ve üzeri siparişlerde kargo ücretsizdir.

**Hazırlama süresi:** Hafta içi saat [KESİM SAATİ] öncesinde verilen siparişler aynı gün, sonrasında verilenler ertesi iş günü kargoya verilir.

**Teslim süresi:** Kargoya verildikten sonra teslimat genelde [1 ile 3] iş günü sürer. Yasal azami teslim süresi siparişten itibaren 30 gündür.

**Kargo firması:** [FİRMA]. Takip numaran kargoya verildiğinde SMS ve e-postayla gönderilir.

**Kapıda ödeme:** [Var ya da yok]. Varsa [TUTAR] TL hizmet bedeli eklenir.

**Hasarlı paket:** Paket hasarlıysa teslim almadan önce kargo görevlisine hasar tespit tutanağı tutturun ve bize [KANAL] üzerinden fotoğrafla bildirin.

**Adreste bulunamama:** Kargo firması paketi [GÜN] gün şubede bekletir; sonra paket bize döner. Yeniden gönderim ücreti [TUTAR] TL'dir.

**Yurt dışı:** [Gönderim yapılan ülkeler ya da "Şu an yalnız Türkiye içine gönderim yapıyoruz."]

**Sorular:** [destek e-postası ve telefon]
` }],
  },
  {
    id: "iade-degisim-operasyonu", ad: "iade-degisim-operasyonu", baslik: "İade ve değişim operasyonu", kategori: "operasyon", simge: "/gercek/panel/gal-gpt-1.webp",
    aciklama: "İade ve değişim taleplerini talepten para iadesine kadar yöneten akışı kurarken kullan: iade kodu, depo kabul kontrolü, tam, kısmi ya da ret kararı, para iadesi süresi, değişimde stok ayırma, iade neden kodları ve iade oranı raporu, müşteriye gidecek yanıt şablonları. Tetikleyiciler: iade süreci, değişim talebi, cayma, iade reddi, para iadesi gecikti, iade oranı yüksek.",
    ornekler: ["Mağazam için iade ve değişim akışı kur", "Kullanılmış gelen iadeye nasıl yanıt vereyim?", "İade oranım yüksek, nedenlerini nasıl raporlarım?"],
    govde: `# İade ve değişim operasyonu

Bu yetenek iade ve değişim taleplerini talepten para iadesine kadar yönetecek akışı, karar kurallarını ve müşteri yanıtlarını hazırlar. Sitedeki iade politikasının yasal metni için Türk e-ticaret yasal sayfaları yeteneğini kullan; bu yetenek işin depo ve destek tarafıdır.

## Önce topla
- Satış kanalları: pazaryeri siparişlerinde iade, pazaryerinin kendi süreciyle işler
- Anlaşmalı iade kargosu ve iade kodu sistemi var mı
- Ürün grupları ve cayma istisnasına girenler (hijyen ürünü, kişiye özel üretim, çabuk bozulan)
- Değişimde stok ayrılıyor mu, fiyat farkı nasıl tahsil ediliyor
- Ödeme kuruluşu ve kart iadesinin nasıl yapıldığı

## Yasal süreler (tüketici satışı)
- Cayma süresi malın teslim alındığı günden itibaren 14 gündür; gerekçe istenmez.
- Tüketici cayma bildiriminden itibaren 10 gün içinde malı geri gönderir.
- Satıcı cayma bildiriminin kendisine ulaştığı tarihten itibaren 14 gün içinde, varsa teslim masrafı dahil bedeli tüketicinin ödeme aracına iade eder.
- Ön bilgilendirmede iade için taşıyıcı belirtilmemişse tüketiciden iade kargo ücreti istenemez.
- Ayıplı malda tüketici ücretsiz onarım, değişim, bedel indirimi ya da sözleşmeden dönme haklarından birini seçer.
Süreleri ve istisnaları güncel mevzuata göre hukukçuya doğrulat.

## Akış
1. **Talep:** sipariş numarası, ürün, neden kodu ve gerekiyorsa fotoğraf (hasar ve ayıpta zorunlu). Neden kodları: vazgeçtim, beden ya da ölçü uymadı, hasarlı geldi, ayıplı, yanlış ürün, eksik parça, açıklamadan farklı.
2. **Ön onay:** ürün cayma istisnasına girmiyorsa iade kodunu ve gönderim talimatını otomatik gönder.
3. **Depo kabul:** paketi kamerada aç; ürün, aksesuar, fatura ve ambalajı kontrol et; kullanım izi ya da değer kaybı varsa fotoğrafla kaydet.
4. **Karar:** tam iade, kısmi iade (yalnız olağan kullanım dışı değer kaybında ve fotoğraf kanıtıyla) ya da ret (dayanak ve fotoğrafla).
5. **Para iadesi:** ödeme kuruluşu üzerinden iade et; tutarın hesaba yansıma süresinin bankaya göre değiştiğini müşteriye söyle.
6. **Değişim:** yeni ürünü stoktan ayır; fiyat farkı varsa ödeme bağlantısı gönder ya da kısmi iade yap.
7. **Belge:** iade faturası ya da iade belgesini muhasebe kuralına göre düzenle (e-Fatura ve e-Arşiv yeteneği).
8. **Stoğa dönüş:** ürünü satılabilir, ikinci kalite ya da imha olarak sınıflandır ve stok kaydını güncelle.

## Süre hedefleri
| Adım | Sorumlu | Hedef süre |
|---|---|---|
| Talebe ilk yanıt | Destek | 1 iş günü |
| Depo kabul ve karar | Depo | Paket ulaştıktan sonra 2 iş günü |
| Para iadesinin başlatılması | Finans | Karardan sonra aynı gün |
Hedefler mağazanın kararıdır; yasal 14 günlük üst sınırın içinde kalmalı.

## Metrikler
| Ölçü | Tanım |
|---|---|
| İade oranı | İade edilen sipariş sayısının teslim edilen siparişlere oranı |
| Neden dağılımı | Neden kodu başına iade sayısı |
| Çözüm süresi | Talepten para iadesine geçen gün |
| Satılabilir dönüş | Yeniden satışa alınan iadelerin toplam iadeye oranı |
"Beden uymadı" oranı yüksek üründe ölçü rehberini, "hasarlı geldi" artıyorsa paketlemeyi, "açıklamadan farklı" artıyorsa ürün sayfasını düzelt.

## Çıktı
Akış tablosu (adım, sorumlu, süre hedefi, sistemdeki durum adı), karar kuralları listesi ve \`assets/yanit-sablonlari.md\` dosyasındaki yanıtların mağazaya uyarlanmış hâli.

## Yapma
- Cayma süresindeki iadeyi belgesiz "kullanılmış" gerekçesiyle reddetme.
- Para iadesi yerine hediye çeki ya da puan dayatma; müşteri isterse seçenek olarak sun.
- Pazaryeri siparişinin iadesini pazaryeri dışında çözmeye çalışma.`,
    dosyalar: [{ yol: "assets/yanit-sablonlari.md", icerik: `# İade ve değişim yanıt şablonları

Köşeli parantezli alanları doldur. Hitabı marka tonuna göre "sen" ya da "siz" olarak bütün şablonlarda aynı tut.

## İade talebi alındı
Merhaba [Ad], [sipariş no] numaralı siparişindeki [ürün] için iade talebini aldık. İade kodun: [kod]. Ürünü faturası ve mümkünse orijinal ambalajıyla birlikte [tarih] tarihine kadar en yakın [kargo firması] şubesine bu kodu söyleyerek teslim edebilirsin. Kargo ücreti [bize ait ya da sana ait].

## Ürün depoya ulaştı, iade onaylandı
Merhaba [Ad], iade ettiğin [ürün] bize ulaştı ve kontrolü tamamlandı. [Tutar] TL iadeni bugün [ödeme yöntemi] üzerinden başlattık. Tutarın hesabına yansıması bankana göre birkaç iş günü sürebilir.

## Kısmi iade
Merhaba [Ad], iade ettiğin üründe [tespit] tespit ettik; fotoğraflar ekte. Bu nedenle [tutar] TL iade ediyoruz. Değerlendirmeye itiraz etmek istersen bu mesaja yanıt vermen yeterli.

## İade kabul edilemedi
Merhaba [Ad], iade ettiğin [ürün], [neden] nedeniyle cayma hakkı kapsamında değil; bu durum ön bilgilendirme formunda belirtilmişti. Ürünü [tarih] tarihine kadar ücretsiz olarak sana geri gönderiyoruz. Tüketici hakem heyetine ya da tüketici mahkemesine başvuru hakkın saklıdır.

## Değişim onaylandı
Merhaba [Ad], [eski ürün] yerine [yeni ürün] için değişim talebini onayladık. Yeni ürünü senin için ayırdık; eski ürün bize ulaştığında [gün] iş günü içinde kargoya veriyoruz. [Fiyat farkı varsa: Aradaki [tutar] TL farkı şu bağlantıdan ödeyebilirsin: [bağlantı]]

## Hasarlı ya da yanlış ürün
Merhaba [Ad], yaşadığın sorun için özür dileriz. Fotoğrafları aldık; doğru ürünü bugün yeniden gönderiyoruz. Hatalı ürünü kargo görevlisi [tarih] tarihinde senden teslim alacak; ek ücret ödemeyeceksin.

## Para iadesi gecikti diyen müşteri
Merhaba [Ad], iadeni [tarih] tarihinde başlattık; işlem numarası [no]. Bankalar iadeyi genelde birkaç iş günü içinde hesaba yansıtır. [Gün] iş günü içinde görmezsen bu numarayla bankana sorabilir ya da bize yazabilirsin.
` }],
  },
  {
    id: "stok-tedarik-planlama", ad: "stok-tedarik-planlama", baslik: "Stok ve tedarik planlaması", kategori: "operasyon", simge: "/gercek/galeri/3d7.webp",
    aciklama: "Ürün bazında ne zaman ve ne kadar sipariş verileceğini hesaplarken kullan: yeniden sipariş noktası, emniyet stoğu, ekonomik sipariş miktarı, asgari sipariş miktarı ve koli katı, ABC analizi, stok günü ve yavaş dönen ürünler, kampanya ve sezon için ek talep. Stok tükeniyor ya da depoda fazla stok birikiyorsa da kullan. Tetikleyiciler: stok planı, yeniden sipariş, emniyet stoğu, tedarik süresi, stok tükendi, fazla stok, ABC analizi.",
    ornekler: ["Son 90 günlük satışlarıma göre hangi ürünü sipariş etmeliyim?", "Emniyet stoğumu nasıl hesaplarım?", "Depoda yavaş dönen ürünleri bul"],
    govde: `# Stok ve tedarik planlaması

Bu yetenek ürün bazında yeniden sipariş noktasını, emniyet stoğunu ve sipariş miktarını hesaplar; hangi ürünün ne zaman ve ne kadar sipariş edileceğini tablo olarak verir.

## Önce topla
- Ürün başına son 90 ile 180 günün günlük satış adedi; stoksuz kalınan günler işaretli
- Tedarik süresi (siparişten depoya giriş, gün) ve tedarikçinin gecikme geçmişi
- Eldeki stok, yoldaki sipariş, ayrılmış (ödenmiş ama gönderilmemiş) adet
- Asgari sipariş miktarı, koli içi adet, birim maliyet
- Hedef hizmet düzeyi (stoksuz kalmama olasılığı) ve yıllık stok tutma maliyeti oranı
- Yaklaşan kampanya, sezon ya da fiyat değişikliği

## Adımlar
1. **Talebi temizle:** stoksuz günleri ve tek seferlik toplu satışları seriden çıkar; kampanya günlerini ayrı say.
2. **Ortalama ve sapma:** temizlenmiş seriden günlük ortalama ve standart sapmayı hesapla.
3. **Emniyet stoğu ve yeniden sipariş noktası:**
\`\`\`
emniyet_stogu   = z * gunluk_sapma * karekok(tedarik_suresi_gun)
yeniden_siparis = gunluk_ortalama * tedarik_suresi_gun + emniyet_stogu
kullanilabilir  = eldeki + yoldaki - ayrilmis
siparis_ver     = kullanilabilir <= yeniden_siparis
\`\`\`
z değeri hizmet düzeyine göre seçilir: yüzde 90 için 1.28, yüzde 95 için 1.65, yüzde 98 için 2.05, yüzde 99 için 2.33.
4. **Sipariş miktarı:** ekonomik sipariş miktarını hesapla, sonra asgari sipariş miktarına ve koli katına yuvarla.
\`\`\`
eoq = karekok(2 * yillik_talep * siparis_basi_maliyet / (birim_maliyet * yillik_tutma_orani))
\`\`\`
5. **Tedarikçi gecikmesi:** tedarik süresi değişkense emniyet stoğuna tedarik sapmasını da kat; \`scripts/yeniden-siparis.js\` iki sapmayı birlikte hesaplar.
6. **ABC sınıflaması:** ciroya katkıya göre sırala; cironun yüzde 80'ini getiren ürünler A, sonraki yüzde 15 B, kalanı C. A ürünlerinde hizmet düzeyini yüksek tut; C ürünlerinde düşür ya da siparişe göre tedarik et.
7. **Kampanya ve sezon:** beklenen ek talebi ayrı satır olarak ekle ve kampanya sonrası fazla stok riskini yaz.

## Kontroller
\`\`\`
stok_gunu = eldeki_stok / gunluk_ortalama
\`\`\`
- Stok günü 180'i aşan ürünleri "yavaş dönen" diye işaretle; paket satış, indirim ya da tedarikçiye iade öner.
- Önerilen siparişlerin toplam tutarını ve ödeme günlerini nakit akışı tablosuna aktar.
- Çok kanallı satışta stok tek kaynaktan güncellenmiyorsa fazla satış riskini not et.

## Çıktı
| Ürün | ABC | Günlük ortalama | Tedarik (gün) | Emniyet | Yeniden sipariş noktası | Kullanılabilir | Durum | Önerilen adet | Tutar |
|---|---|---|---|---|---|---|---|---|---|
Durum değerleri: "Sipariş ver", "İzle", "Fazla stok". Tablonun altına varsayımları (hizmet düzeyi, tutma oranı, veri dönemi) yaz.

## Yapma
- Stoksuz kalınan günleri sıfır satış diye ortalamaya katma; talep olduğundan düşük çıkar.
- Sezonluk ürünü tek bir yıllık ortalamayla planlama; geçen yılın aynı dönemine bak.
- Asgari sipariş miktarını ve koli katını görmezden gelen adet önerme.`,
    dosyalar: [{ yol: "scripts/yeniden-siparis.js", icerik: `// Yeniden sipariş noktası ve sipariş miktarı.
// satislar: stoksuz günleri çıkarılmış günlük satış adetleri dizisi.
const Z = { 90: 1.28, 95: 1.65, 98: 2.05, 99: 2.33 };

function ortalama(d) {
  return d.reduce(function (a, b) { return a + b; }, 0) / d.length;
}

function sapma(d) {
  const o = ortalama(d);
  const kare = d.reduce(function (a, b) { return a + (b - o) * (b - o); }, 0);
  return Math.sqrt(kare / Math.max(d.length - 1, 1));
}

// g: { satislar, tedarikGun, tedarikSapmaGun, hizmet, eldeki, yoldaki, ayrilmis }
export function yenidenSiparis(g) {
  const ort = ortalama(g.satislar);
  const sap = sapma(g.satislar);
  const z = Z[g.hizmet] || 1.65;
  const tSap = g.tedarikSapmaGun || 0;
  // Talep ve tedarik süresi belirsizliği birlikte.
  const emniyet = Math.ceil(z * Math.sqrt(g.tedarikGun * sap * sap + ort * ort * tSap * tSap));
  const nokta = Math.ceil(ort * g.tedarikGun + emniyet);
  const kullanilabilir = g.eldeki + (g.yoldaki || 0) - (g.ayrilmis || 0);
  return {
    gunlukOrtalama: ort,
    gunlukSapma: sap,
    emniyetStogu: emniyet,
    yenidenSiparisNoktasi: nokta,
    kullanilabilir: kullanilabilir,
    stokGunu: ort > 0 ? g.eldeki / ort : null,
    siparisVer: kullanilabilir <= nokta,
  };
}

// Ekonomik sipariş miktarı, asgari sipariş ve koli katına yuvarlanmış.
export function siparisMiktari(yillikTalep, siparisBasiMaliyet, birimMaliyet, yillikTutmaOrani, asgari, koliIci) {
  const eoq = Math.sqrt((2 * yillikTalep * siparisBasiMaliyet) / (birimMaliyet * yillikTutmaOrani));
  const enAz = Math.max(eoq, asgari || 0);
  const koli = koliIci || 1;
  return Math.ceil(enAz / koli) * koli;
}
` }],
  },
  {
    id: "kampanya-indirim-kurgusu", ad: "kampanya-indirim-kurgusu", baslik: "Kampanya ve indirim kurgusu", kategori: "eticaret", simge: "/gercek/panel/gal-pazarlama-1.webp",
    aciklama: "Sepet indirimi, kupon kodu, çoklu alım (3 al 2 öde), ilk sipariş indirimi, kademeli indirim ya da ücretsiz kargo kampanyası kurarken kullan: kâr etkisi ve başa baş hesabı, kampanyaların birleşme ve öncelik kuralları, indirimin fatura satırlarına dağıtılması, kupon kodu üretimi, son 30 gün en düşük fiyat kuralı ve duyuru metni. Tetikleyiciler: kampanya kur, indirim kodu, kupon, sepette indirim, Black Friday, efsane cuma, 11.11, yüzde indirim.",
    ornekler: ["Efsane cuma için sepette indirim kampanyası kur", "Kupon ve ürün indirimi birlikte çalışsın mı?", "Yüzde 30 indirim yaparsam kâr etmek için kaç adet satmalıyım?"],
    govde: `# Kampanya ve indirim kurgusu

Bu yetenek sepet indirimi, kupon, çoklu alım ve ücretsiz kargo kampanyalarını kurar; kâr etkisini hesaplar, kuralları çakışmasız tanımlar ve mevzuata uygun duyurur.

## Önce topla
- Kampanyanın amacı: yeni müşteri, sepet büyütme, stok eritme, eski müşteriyi geri kazanma
- Kapsam: ürünler, kategoriler, kanallar, müşteri grubu; başlangıç ve bitiş günü ve saati
- Ürünlerin birim maliyeti, normal fiyatı ve son 30 günlük fiyat geçmişi
- Bütçe ya da kullanım sınırı, başka kampanyalarla birleşip birleşmeyeceği

## Kampanya türleri
| Tür | Ne işe yarar | Dikkat |
|---|---|---|
| Ürün indirimi (yüzde ya da tutar) | Stok eritme, sezon | Eski fiyat kuralı |
| Sepet tutarı indirimi | Sepet büyütme | Eşiği ortalama sepetin üzerine koy |
| Çoklu alım (3 al 2 öde) | Adet artırma | Hangi ürün bedava, indirim nasıl dağıtılır |
| Kupon kodu | Kanal ölçümü, kişiye özel teklif | Kodun paylaşılması ve kötüye kullanım |
| İlk sipariş indirimi | Yeni müşteri | Aynı kişinin yeni hesapla tekrar kullanması |
| Ücretsiz kargo | Dönüşüm | Kargo maliyetini marja kat |
| Kademeli indirim | Sepet büyütme | Her kademede marjı ayrı hesapla |

## Adımlar
1. **Kâr etkisi:** indirimli katkı payını ve aynı toplam katkı için gereken adedi hesapla.
\`\`\`
indirimli_katki = indirimli_net_fiyat - birim_maliyet - degisken_giderler
gereken_adet    = mevcut_adet * mevcut_birim_katki / indirimli_katki
\`\`\`
Katkı payı sıfırın altındaysa kampanyayı bilinçli olarak stok eritme diye işaretle ya da indirimi düşür.
2. **Kural tanımı:** her kampanya için koşul, eylem, öncelik, birleşebilirlik, kullanım sınırı (toplam ve kişi başı) ve geçerlilik aralığı yaz.
3. **Çakışma:** varsayılan olarak bir sepet indirimi ve bir kargo indirimi birleşebilsin; ürün indirimi üstüne kupon gerekiyorsa açıkça izin ver. Uygulama sırası: ürün indirimi, sepet indirimi, kupon, en son kargo.
4. **Satırlara dağıtım:** sepet ya da kupon indirimini satırlara tutarları oranında dağıt. Fatura satırları ve kısmi iade buna dayanır; iade edilen ürüne düşen indirim payı iade tutarından düşülür.
5. **Kupon kodu:** tek kullanımlık kodlarda en az 8 karakter, karışan karakterler (0 ve O, 1 ve I) olmadan rastgele üret; kampanya adı ön ek olabilir (YAZ26-K7P4QX).
6. **Duyuru metni:** süre, koşullar, kapsam dışı ürünler, kullanım ve stok sınırı açıkça yazılır.
7. **Sonuç ölçümü:** kampanya bitince gerçekleşen satış, indirim maliyeti, yeni müşteri, ortalama sepet ve sonraki iki haftadaki satış düşüşünü raporla.

## Mevzuat kontrolü
- İndirimli satışta indirimden önceki fiyat, indirimin başlamasından önceki son 30 gün içinde uygulanan en düşük fiyattır. Fiyatı kampanyadan hemen önce yükseltip indirim göstermek yasaktır.
- İndirim oranı ya da tutarı, indirim öncesi ve sonrası fiyatla birlikte gösterilir.
- Stokla sınırlı kampanyada stok adedi ya da sınır belirtilir; kampanya ilan edilen süreden önce sessizce kapatılmaz.
- Çekilişli kampanyalar izne tabidir; yetkili kurumu ve başvuru sürecini hukukçuya doğrulat.
- Kampanya SMS ya da e-postayla duyurulacaksa ticari elektronik ileti onayı ve İYS kaydı gerekir.

## Çıktı
\`assets/kampanya-brifi.md\` biçiminde kampanya brifi ve kural tablosu:
| Kampanya | Koşul | Eylem | Öncelik | Birleşir mi | Sınır | Başlangıç | Bitiş |
|---|---|---|---|---|---|---|---|

## Yapma
- Kâr etkisini hesaplamadan indirim oranı önerme.
- Bitişi belirsiz "son gün" kampanyası ya da sahte geri sayım kurma.
- Kupon indirimini tek satıra yükleyip faturayı ve kısmi iadeyi bozma.`,
    dosyalar: [{ yol: "assets/kampanya-brifi.md", icerik: `# Kampanya brifi

**Kampanya adı:** [ad]
**Amaç ve ölçü:** [yeni müşteri sayısı, ortalama sepet, eritilecek stok adedi]
**Tarih:** [başlangıç günü ve saati] ile [bitiş günü ve saati] arası
**Kapsam:** [ürünler, kategoriler, kanallar, müşteri grubu]
**Kapsam dışı:** [ürünler]
**Mekanik:** [ne alınca ne kazanılır]
**Birleşebilirlik:** [hangi kampanyalarla birleşir, hangileriyle birleşmez]
**Kullanım sınırı:** [toplam kullanım, kişi başı kullanım]
**Bütçe:** [en çok indirim tutarı]

## Fiyat kontrolü
| Ürün | Son 30 günün en düşük fiyatı | Gösterilecek eski fiyat | Kampanya fiyatı | Birim maliyet | İndirimli katkı payı |
|---|---|---|---|---|---|

## Duyuru
- Site bandı: [metin]
- Ürün sayfası rozeti: [metin]
- E-posta konu satırı: [metin] (yalnız ticari ileti onayı olanlara)
- SMS: [metin ve ret yolu] (yalnız ticari ileti onayı olanlara)

## Kampanya sonrası
- Gerçekleşen satış adedi ve ciro
- Toplam indirim maliyeti
- Yeni müşteri sayısı ve ortalama sepet
- Kampanya sonrası iki haftada satışta düşüş var mı
- Bir dahaki kampanya için ders
` }],
  },
  {
    id: "abonelik-tahsilat", ad: "abonelik-tahsilat", baslik: "Abonelik ödemeleri ve tekrarlayan tahsilat", kategori: "eticaret", simge: "/gercek/galeri/3d10.webp",
    aciklama: "Aylık ya da yıllık abonelik satan bir site veya uygulamaya kayıtlı kartla tekrarlayan tahsilat kurarken kullan: ilk ödemede 3D Secure ve kart saklama, dönem hesabı, deneme süresi, plan yükseltme ve düşürme, başarısız ödemede yeniden deneme takvimi, askıya alma, kolay iptal ve yenileme hatırlatması. Tetikleyiciler: abonelik, üyelik ödemesi, tekrarlayan ödeme, kart saklama, otomatik yenileme, churn, dunning, deneme süresi.",
    ornekler: ["Uygulamama aylık abonelik ödemesi ekle", "Kartı reddedilen abonelere ne yapmalıyım?", "Yıllık plana geçişte fark nasıl hesaplanır?"],
    govde: `# Abonelik ödemeleri ve tekrarlayan tahsilat

Bu yetenek aylık ya da yıllık abonelik satan bir site veya uygulama için kayıtlı kartla tekrarlayan tahsilatı, başarısız ödeme takibini, plan değişikliğini ve iptali kurar.

## Önce topla
- Ödeme kuruluşu (iyzico, PayTR, Param, Sipay ya da bankanın sanal POS'u); kart saklama veya abonelik ürünü hesabında açık mı
- Planlar: tutar, para birimi, dönem, deneme süresi
- Fatura: her dönem için e-Arşiv ya da e-Fatura kim tarafından, hangi entegratörle kesilecek
- Mobil uygulamada dijital içerik satılıyorsa App Store ve Google Play'in uygulama içi satın alma kuralları geçerlidir; kartla tahsilatın mağaza kurallarına uygunluğunu kontrol et
Türkiye'de kurulu şirketlere hangi ödeme sağlayıcılarının abonelik hizmeti verdiğini güncel olarak doğrula.

## Mimari
1. **İlk ödeme:** 3D Secure ile alınır; ödeme kuruluşu kartı kendi kasasında saklar ve bir kart anahtarı (token) döner. Kart numarası hiçbir zaman senin veritabanına yazılmaz.
2. **Sonraki dönemler:** zamanlanmış görev dönem gününde kart anahtarıyla tahsilat ister. Kuruluşun abonelik ürünü varsa zamanlamayı ona bırak, sen yalnız bildirimleri işle.
3. **Bildirim adresi:** her tahsilat sonucu sunucudan sunucuya gelir; imzayı doğrula, olayı kimliğiyle idempotent işle, siparişe ve faturaya bağla.

\`\`\`
abonelik: id, musteri_id, plan_id, durum, donem_baslangic, donem_bitis,
          kart_anahtari, deneme_bitis, iptal_istendi, iptal_donem_sonunda
tahsilat: id, abonelik_id, donem, tutar, durum, deneme_sayisi,
          saglayici_islem_id, hata_kodu, fatura_no
durum:    deneme | aktif | odeme_bekliyor | askida | iptal | sona_erdi
\`\`\`

## Dönem hesabı
- Ayın 29, 30 ya da 31'inde başlayan abonelikte kısa ayda ayın son günü tahsil et; sonraki ay asıl güne dön.
- Plan yükseltmede kalan günlerin farkını orantılı tahsil et ya da yeni dönemi hemen başlat; düşürmede değişikliği dönem sonuna bırak.
- Yıllık planda iade politikasını (kalan aylar iade edilir mi) baştan yaz.

## Başarısız ödeme takibi
1. Hata koduna göre ayır: yetersiz bakiye ve limit hatası yeniden denenir; kart kapalı, kayıp, çalıntı ya da süresi dolmuşsa yeniden deneme yapılmaz, müşteriden yeni kart istenir.
2. Yeniden deneme takvimi: 1., 3., 5. ve 7. gün. Her denemeden önce müşteriye kart güncelleme bağlantısı gönder.
3. Takvim bitince aboneliği askıya al; erişimi kapat ama veriyi silme, geri dönüşü tek tıkla mümkün kıl.
4. Gün sayıları mağaza kararıdır; satın alma öncesinde müşteriye açıkça bildir.

## Tüketici kuralları
- Dönem tutarı, yenileme tarihi ve iptal yolu satın alma öncesi açıkça gösterilir.
- Abonelik kurulduğu yolla ve aynı kolaylıkta sona erdirilebilmeli; çevrim içi alınan abonelik çevrim içi iptal edilebilir.
- Ücretli plana dönecek deneme süresinin bitişinden önce hatırlatma gönder.
- Yıllık yenilemeden önce e-postayla haber ver.
- Fiyat artışını yürürlüğe girmeden önce bildir ve iptal seçeneği sun.
Yükümlülüklerin ayrıntısını hukukçuya doğrulat.

## Çıktı
Durum makinesi tablosu (durum, olay, sonraki durum, müşteriye giden ileti), veri modeli, zamanlanmış görev listesi ve bildirim adresi doğrulama adımları.

## Yapma
- Kart numarası, son kullanma tarihi ya da CVV saklama; bunlar yalnız ödeme kuruluşunda durur.
- Başarısız tahsilatı sınırsız tekrar deneme; bankalar sık deneme yapan üye işyerini işaretler.
- İptal düğmesini gizleme ya da iptali yalnız telefona bağlama.`,
    dosyalar: [],
  },
  {
    id: "odeme-hatasi-ters-ibraz", ad: "odeme-hatasi-ters-ibraz", baslik: "Ödeme hatası ve ters ibraz yönetimi", kategori: "eticaret", simge: "/gercek/panel/gal-gpt-3.webp",
    aciklama: "Kart ödemesi başarısız olduğunda müşteriye anlaşılır hata mesajı ve çözüm yolu yazarken, şüpheli siparişleri dolandırıcılık sinyallerine göre işaretlerken ve bankadan gelen ters ibraz (chargeback) itirazına kanıt paketi ile itiraz yazısı hazırlarken kullan. Ters ibraz oranını düşürmek için önleme planı da çıkarır. Tetikleyiciler: ödeme reddedildi, 3D hatası, kart onaylanmadı, chargeback, ters ibraz, harcama itirazı, sahte sipariş, dolandırıcılık.",
    ornekler: ["Bankadan ters ibraz bildirimi geldi, itirazı hazırla", "Ödeme hata mesajlarımı müşterinin anlayacağı dile çevir", "Bu sipariş şüpheli mi?"],
    govde: `# Ödeme hatası ve ters ibraz yönetimi

Bu yetenek başarısız kart ödemelerini müşteriye anlaşılır biçimde açıklar, dolandırıcılık sinyallerini işaretler ve bankadan gelen ters ibraz (chargeback) itirazına kanıt paketi hazırlar.

## Önce topla
- Ödeme kuruluşu ve döndürdüğü hata kodu ya da mesajı
- Sipariş bilgisi: tutar, ürün, teslimat adresi, IP, cihaz, 3D Secure sonucu
- Ters ibrazda: bildirim tarihi, yanıt için son gün, bankanın bildirdiği neden
- Kargo takip kaydı, teslim belgesi, müşteriyle yazışmalar, iade kayıtları

## Ödeme hatasını müşteriye anlat
| Hata grubu | Müşteriye söylenecek | Önerilen eylem |
|---|---|---|
| Yetersiz bakiye ya da limit | Kartında bu tutar için yeterli limit görünmüyor | Başka kart ya da daha sonra tekrar |
| 3D doğrulama başarısız | Bankanın doğrulama adımı tamamlanmadı | SMS kodunu yeniden dene |
| İnternet alışverişine kapalı kart | Kartın internet alışverişine kapalı görünüyor | Banka uygulamasından aç |
| Kart reddedildi, neden belirtilmedi | Banka işlemi onaylamadı | Bankanı ara ya da başka kart dene |
| Teknik hata | Geçici bir sorun oluştu, kartından çekim yapılmadı | Birkaç dakika sonra tekrar |
Hata kodlarını ödeme kuruluşunun güncel listesinden bu gruplara eşle. Bankanın ham metnini ya da kodunu müşteriye gösterme; sepeti koru, müşteri baştan başlamasın.

## Dolandırıcılık sinyalleri
- Aynı karttan ya da cihazdan kısa sürede çok sayıda başarısız deneme
- Fatura ve teslimat şehrinin uyumsuz olması, son anda adres değişikliği
- Yüksek tutarlı ve kolay yeniden satılan üründen çok adet
- Yeni hesap, tek kullanımlık e-posta adresi, gece saatlerinde ilk sipariş
Sinyal varsa siparişi otomatik iptal etme; kargoyu beklet ve müşteriyle telefonda teyit et.

## Ters ibraz adımları
1. Bildirimi aldığın gün kaydet ve yanıt son gününü takvime yaz. Süre bankaya ve ödeme kuruluşuna göre değişir; kuruluşun bildirdiği tarihe uy.
2. Önce kendini kontrol et: iade zaten yapıldı mı, mükerrer çekim var mı. Müşteri haklıysa itiraz etme, iadeyi kabul et.
3. Nedene uygun kanıtı topla (\`assets/kanit-paketi.md\`).
4. Kısa bir itiraz yazısı yaz: olayların tarih sırasıyla özeti ve bankanın nedenine karşılık gelen kanıtlar.
5. Sonucu kaydet; kaybedilen dosyaların nedenini süreç düzeltmesine çevir.

## Önleme
- Kart ekstresinde görünen işyeri adı markanla tanınabilir olsun; müşteri "bu çekimi tanımıyorum" demesin.
- 3D Secure bütün ödemelerde açık olsun; dolandırıcılık nedenli itirazlarda sorumluluk çoğu durumda kart sahibinin bankasına geçer.
- Yüksek tutarlı siparişlerde teslimde imza ya da kod isteyen gönderim seçeneğini kullan.
- İade taleplerine hızlı yanıt ver; müşteri bankaya gitmeden sorun çözülsün.
- Ters ibraz oranını aylık izle; ödeme kuruluşları yüksek oranda ek güvence ister ya da sözleşmeyi feshedebilir.

## Çıktı
İtiraz yazısı, kanıt listesi (kanıt, dosya adı, neyi gösterdiği) ve önleme için yapılacaklar tablosu (eylem, sorumlu, tarih).

## Yapma
- Müşteriden kart bilgisini e-posta ya da mesajla isteme.
- Kanıtı değiştirme ya da sonradan belge üretme.
- Kart sahibinin kişisel verisini itiraz süreci dışında paylaşma.`,
    dosyalar: [{ yol: "assets/kanit-paketi.md", icerik: `# Ters ibraz kanıt paketi

## Her dosyada
- Sipariş özeti: sipariş numarası, tarih ve saat, tutar, ürünler
- Fatura (e-Arşiv ya da e-Fatura)
- Ödeme kaydı: işlem numarası, provizyon kodu, 3D Secure sonucu
- Müşteri bilgisi: ad, e-posta, telefon, IP adresi, cihaz bilgisi
- Ödeme öncesi onaylanan ön bilgilendirme formu ve mesafeli satış sözleşmesi, onay zamanı

## Nedene göre ek kanıt
| Bankanın nedeni | Ek kanıt |
|---|---|
| Ürün teslim edilmedi | Kargo takip dökümü, teslim tarihi, teslim alanın adı ya da imzası |
| İşlemi tanımıyorum | 3D Secure kaydı, aynı karttan önceki sorunsuz siparişler, teslimat adresinin kart sahibiyle ilişkisi |
| Ürün açıklamaya uymuyor | Ürün sayfasının o tarihteki görüntüsü, müşteriyle yazışma, sunulan iade seçeneği |
| İade yapılmadı | İade politikası, iade talebinin olmadığı ya da iade işlem kaydı |
| Mükerrer çekim | Her çekimin ayrı sipariş olduğunu gösteren kayıtlar |
| Dijital ürün ya da hizmet | Erişim ve kullanım kayıtları, giriş zamanları, indirme kaydı |

## İtiraz yazısı iskeleti
1. Tek cümlelik özet: işlemin geçerli olduğu ve nedeni
2. Tarih sırasıyla olaylar
3. Bankanın nedenine karşılık gelen kanıtlar, dosya adlarıyla
4. İletişim bilgisi

Dosya adlarını anlaşılır ver: 01-siparis-ozeti.pdf, 02-fatura.pdf, 03-kargo-teslim.pdf.
` }],
  },
  {
    id: "nakit-akisi-tablosu", ad: "nakit-akisi-tablosu", baslik: "Nakit akışı tablosu", kategori: "finans", simge: "/gercek/galeri/soyut5.webp",
    aciklama: "Bir işletme için haftalık ya da aylık nakit akışı tahmini kurarken kullan: 13 haftalık doğrudan yöntem tablosu, kart valörü ve pazaryeri hakediş takvimi, tedarikçi vadeleri, maaş, SGK ve vergi ödemeleri, çek ve senetler, asgari nakit eşiği, kötümser senaryo ve nakit sıkışmasına karşı önlemler. Tetikleyiciler: nakit akışı, nakit tahmini, ay sonunu çıkarır mıyım, ödemeleri yetiştiremiyorum, cash flow, likidite.",
    ornekler: ["Önümüzdeki 13 hafta için nakit akışı tablosu kur", "Pazaryeri hakedişleri gecikirse param yeter mi?", "Hangi hafta nakit sıkıntısı yaşarım?"],
    govde: `# Nakit akışı tablosu

Bu yetenek bir işletme için 13 haftalık nakit akışı tablosunu doğrudan yöntemle kurar, nakdin sıkışacağı haftayı önceden gösterir ve önlem önerir. Tahakkuk değil, paranın hesaba girdiği ve çıktığı gün esas alınır.

## Önce topla
- Bugünkü banka ve kasa bakiyeleri, kullanılabilir kredi limiti
- Tahsilat takvimi: kart satışlarının valör günü, pazaryeri hakediş günleri, açık hesap müşterilerin vadeleri, çek ve senetler
- Ödeme takvimi: tedarikçi vadeleri, maaş, SGK primi, vergiler (KDV, muhtasar, geçici vergi), kira, kredi taksitleri, reklam harcaması, yazılım abonelikleri
- Planlanan satış ve satın alma, yatırım harcamaları
- Döviz cinsinden borç ya da alacak varsa kur varsayımı

## Adımlar
1. **Açılış:** ilk haftanın açılış bakiyesi bugünkü kullanılabilir nakittir.
2. **Girişler:** satış tahminini tahsilat gününe kaydır. Kartlı satışta valör, pazaryerinde hakediş takvimi, açık hesapta vade ve müşterinin geçmiş gecikme ortalaması uygulanır.
3. **Çıkışlar:** sabit ödemeleri tarihine, değişken ödemeleri satış ve satın alma planına bağla. Vergi ve SGK son ödeme günlerini GİB ve SGK'nın güncel takviminden al.
4. **Kapanış:**
\`\`\`
kapanis              = acilis + toplam_giris - toplam_cikis
sonraki_hafta_acilis = kapanis
fark                 = kapanis - asgari_nakit_esigi
\`\`\`
5. **Asgari nakit eşiği:** iki haftalık sabit gideri başlangıç tamponu olarak öner ve kullanıcıyla teyit et; kapanışı bu eşiğin altına düşen haftaları işaretle.
6. **Senaryolar:** temel, kötümser (tahsilatlar bir hafta gecikir ve satış yüzde 20 düşer) ve iyimser. Kötümser senaryoda eşiğin altına düşülüyorsa önlem öner.
7. **Önlemler:** tahsilatı hızlandırma (erken ödeme iskontosu, hakediş öne çekme), ödeme erteleme görüşmesi, stok siparişini bölme, kredi limiti kullanımı. Her önlemin hangi haftayı ne kadar etkilediğini yaz.
8. **Haftalık güncelleme:** biten haftayı gerçekleşen değerlerle değiştir, sapmayı not et, tabloyu bir hafta ileri kaydır.

## Kurallar
- Tahsil edilen KDV işletmenin serbest parası değildir; ödenecek KDV'yi beyan ayında ayrı satırda göster.
- Pazaryeri hakedişinde komisyon, kargo ve hizmet bedeli kesintileri düşülmüş net tutarı kullan.
- Şirket kredi kartıyla yapılan harcamaları kart ekstresinin son ödeme gününe yaz.
- Büyük ve belirsiz kalemleri tek satırda toplama; ayrı satır açıp varsayımını yaz.
- Döviz kalemlerinde kullandığın kuru ve tarihini tabloya not et.

## Çıktı
\`assets/nakit-akisi-13-hafta.csv\` yapısında tablo: satırlar kalem, sütunlar hafta. Altına kısa özet:
- En düşük nakit haftası ve tutarı
- Eşiğin altına düşülen haftalar
- Önerilen önlemler ve etkileri
- Kullanılan varsayımlar ve doğrulanması gereken tarihler

## Yapma
- Satışı tahsilat gibi yazma; vade ve valör farkını atlama.
- Vergi ve prim tarihlerini ezbere yazma; takvimden doğrula.
- Kredi limitini açılış bakiyesine ekleme; ayrı satırda göster.`,
    dosyalar: [{ yol: "assets/nakit-akisi-13-hafta.csv", icerik: `Kalem,H1,H2,H3,H4,H5,H6,H7,H8,H9,H10,H11,H12,H13
Açılış bakiyesi,,,,,,,,,,,,,
Kart satışı tahsilatı,,,,,,,,,,,,,
Pazaryeri hakedişi,,,,,,,,,,,,,
Açık hesap tahsilatı,,,,,,,,,,,,,
Çek ve senet tahsilatı,,,,,,,,,,,,,
Diğer girişler,,,,,,,,,,,,,
Toplam giriş,,,,,,,,,,,,,
Tedarikçi ödemeleri,,,,,,,,,,,,,
Maaşlar,,,,,,,,,,,,,
SGK primi,,,,,,,,,,,,,
KDV ödemesi,,,,,,,,,,,,,
Muhtasar ve diğer vergiler,,,,,,,,,,,,,
Kira,,,,,,,,,,,,,
Kredi taksitleri,,,,,,,,,,,,,
Reklam,,,,,,,,,,,,,
Kargo ve lojistik,,,,,,,,,,,,,
Yazılım ve abonelikler,,,,,,,,,,,,,
Diğer çıkışlar,,,,,,,,,,,,,
Toplam çıkış,,,,,,,,,,,,,
Kapanış bakiyesi,,,,,,,,,,,,,
Asgari nakit eşiği,,,,,,,,,,,,,
Eşiğe göre fark,,,,,,,,,,,,,
Kullanılabilir kredi limiti,,,,,,,,,,,,,
` }],
  },
  {
    id: "aylik-kapanis-raporu", ad: "aylik-kapanis-raporu", baslik: "Gelir-gider raporu ve aylık kapanış", kategori: "finans", simge: "/gercek/galeri/soyut8.webp",
    aciklama: "Ay sonu kapanışını sırayla yürütürken ve yönetim için gelir-gider raporu hazırlarken kullan: banka mutabakatı, POS ve pazaryeri hakedişlerinin siparişlerle eşleşmesi, kesilen ve gelen fatura kontrolü, eksik belge listesi, stok farkı, gider tahakkukları, KDV ön hesabı, beyan takvimi, bütçe sapması ve mali müşavire gidecek belge paketi. Tetikleyiciler: ay sonu, aylık kapanış, gelir gider raporu, kâr zarar, mali müşavire ne göndereyim, bu ay ne kazandım.",
    ornekler: ["Ekim ayı kapanışını yapalım", "Bu ayki gelir-gider raporumu çıkar", "Mali müşavirime hangi belgeleri göndermeliyim?"],
    govde: `# Gelir-gider raporu ve aylık kapanış

Bu yetenek küçük ve orta ölçekli bir işletmenin ay sonu kapanışını sırayla yürütür, mali müşavire gidecek belge paketini hazırlar ve yönetim için gelir-gider raporu çıkarır. Resmî defter kayıtlarını mali müşavir tutar; bu çalışma onun işini hızlandırır ve işletmenin kendi rakamlarını görmesini sağlar.

## Önce topla
- Banka hesap dökümleri, POS ve ödeme kuruluşu hakediş raporları, pazaryeri hakediş dökümleri
- Ay içinde kesilen ve gelen faturaların listesi (entegratör ya da GİB portalından)
- Gider belgeleri: fatura, fiş, serbest meslek makbuzu, kira, abonelikler
- Maaş bordrosu ve SGK bildirgesi
- Ay sonu stok sayımı ya da stok raporu
- Bütçe ya da önceki ayın raporu

## Kapanış adımları
1. **Banka mutabakatı:** her hesap için banka bakiyesini kayıtlı bakiyeyle eşle; açıklanamayan hareketleri listele.
2. **Tahsilat eşleşmesi:** her kart, havale ve pazaryeri tahsilatını bir siparişe ya da faturaya bağla. Hakediş ile satış tutarı arasındaki farkı komisyon, kargo, iade ve ceza olarak ayır.
3. **Fatura kontrolü:** her satışın faturası kesildi mi, her gelen fatura kaydedildi mi; e-Fatura gelen kutusunda süresi içinde reddedilmesi gereken fatura var mı.
4. **Eksik belge:** belgesiz giderleri listele ve harcamayı yapana sor; belgesi olmayan harcama gider yazılamaz.
5. **Stok:** sayım ile sistem arasındaki farkı çıkar; fire ve kaybı ayrı göster.
6. **Tahakkuklar:** bu aya ait olup faturası gelecek ay gelecek giderleri (elektrik, kargo, danışmanlık) tahmini tutarla ekle.
7. **KDV ön hesabı:** hesaplanan KDV ile indirilecek KDV'yi karşılaştır; çıkan tutarı nakit akışı tablosuna yaz. Kesin tutarı mali müşavir belirler.
8. **Beyan takvimi:** KDV, muhtasar ve prim hizmet beyannamesi, Ba ve Bs formları gibi beyanların bu ayki son günlerini GİB vergi takviminden al ve listele.
9. **Rapor ve sapma:** gelir-gider raporunu hazırla; bütçe ve geçen ayla karşılaştır.

## Gelir-gider raporu
| Kalem | Bu ay | Geçen ay | Bütçe | Fark |
|---|---|---|---|---|
| Brüt satış | | | | |
| İade ve indirimler | | | | |
| Net satış | | | | |
| Satılan malın maliyeti | | | | |
| Brüt kâr | | | | |
| Pazarlama ve reklam | | | | |
| Kargo ve lojistik | | | | |
| Ödeme ve pazaryeri komisyonları | | | | |
| Personel | | | | |
| Kira ve genel giderler | | | | |
| Faaliyet kârı | | | | |
| Finansman giderleri | | | | |
| Vergi öncesi dönem sonucu | | | | |
Tutarlar KDV hariçtir. Altına brüt kâr marjını ve faaliyet kâr marjını oran olarak ekle.

## Sapma yorumu
Bütçeden yüzde 10'dan fazla sapan her kalem için tek cümlelik neden ve eylem yaz. Tek seferlik kalemleri (yıllık yazılım ödemesi, demirbaş) ayrıca belirt; aylık eğilimi bozmasın.

## Çıktı
1. Kapanış kontrol listesi (\`references/kapanis-kontrol-listesi.md\`) işaretlenmiş hâliyle
2. Gelir-gider raporu ve sapma yorumu
3. Mali müşavire gidecek paket: belge listesi, açık sorular, eksik belgeler

## Yapma
- KDV dahil tutarlarla gelir tablosu kurma.
- Açıklanamayan banka hareketini "diğer" diye kapatma; ayrı listede bırak.
- Vergi tutarını kesin sonuç gibi sunma; ön hesap olduğunu yaz.`,
    dosyalar: [{ yol: "references/kapanis-kontrol-listesi.md", icerik: `# Aylık kapanış kontrol listesi

## Ayın son iş günü
- [ ] Bütün satışların faturası kesildi
- [ ] Bekleyen iade ve iptallerin belgesi düzenlendi
- [ ] Ay sonu stok sayımı yapıldı ya da stok raporu alındı

## Ayın ilk üç iş günü
- [ ] Banka dökümleri indirildi, her hesap için mutabakat yapıldı
- [ ] POS, ödeme kuruluşu ve pazaryeri hakedişleri siparişlerle eşleşti
- [ ] Gelen e-Faturalar kontrol edildi; hatalı olanlar için süresi içinde ret ya da itiraz yapıldı
- [ ] Belgesiz giderler sahiplerine soruldu
- [ ] Gider tahakkukları eklendi
- [ ] Dövizli hesaplar ve dövizli alacak ile borçlar için ay sonu kuru not edildi

## Mali müşavire gönderim
- [ ] Satış ve alış fatura listeleri
- [ ] Banka dökümleri ve mutabakat notları
- [ ] Bordro için personel giriş, çıkış, izin ve fazla mesai bilgisi
- [ ] Demirbaş alımları ve faturaları
- [ ] Açık sorular listesi

## Beyan ve ödeme
- [ ] Bu ayın beyan son günleri GİB vergi takviminden doğrulandı
- [ ] KDV, muhtasar ve SGK ödeme tutarları nakit akışına yazıldı
- [ ] Ödemeler yapıldı, dekontlar arşivlendi

## Rapor
- [ ] Gelir-gider raporu hazırlandı
- [ ] Bütçe sapmaları yorumlandı
- [ ] Gelecek ayın nakit akışı güncellendi
` }],
  },
  {
    id: "fiyatlandirma-stratejisi", ad: "fiyatlandirma-stratejisi", baslik: "Fiyatlandırma stratejisi", kategori: "finans", simge: "/gercek/panel/gal-pazarlama-4.webp",
    aciklama: "Bir ürün ya da hizmetin satış fiyatını belirlerken veya mevcut fiyatların kârlı olup olmadığını kontrol ederken kullan: maliyet artı fiyat, kâr eklemesi ile marj farkı, pazaryeri komisyonu ve kargo dahil kanal bazında fiyat, rakip fiyat bandı, değer temelli düzeltme, psikolojik fiyat, kur ve enflasyona göre fiyat güncelleme kuralı. Tetikleyiciler: fiyat belirle, kaça satmalıyım, marj hesapla, zarar mı ediyorum, Trendyol fiyatı, zam yapmalı mıyım, maliyet artı.",
    ornekler: ["Maliyeti 180 TL olan ürünü Trendyol'da kaça satmalıyım?", "Fiyatlarım rakiplere göre nerede duruyor?", "Kur arttı, fiyatlarımı nasıl güncelleyeyim?"],
    govde: `# Fiyatlandırma stratejisi

Bu yetenek bir ürün ya da hizmet için maliyet, rakip ve değer temelli fiyatı hesaplar; site ve pazaryeri gibi her kanal için kârlı satış fiyatını ve fiyat güncelleme kuralını verir.

## Önce topla
- Birim maliyet (alış ya da üretim, KDV hariç) ve kur ile enflasyona duyarlılığı
- Kanal giderleri: pazaryeri komisyon oranı, ödeme komisyonu, kargo, paketleme, hizmet bedelleri
- Hedef marj ya da hedef birim kâr
- Rakip fiyatları (en az üç rakip, tarihiyle)
- Ürünün konumu (giriş, orta, üst segment) ve müşterinin algıladığı değer

## Kavram farkı
Kâr eklemesi (markup) maliyete göre, marj satış fiyatına göre hesaplanır; ikisini karıştırma.
\`\`\`
kar_eklemesi = (net_satis - maliyet) / maliyet
marj         = (net_satis - maliyet) / net_satis
\`\`\`
Yüzde 50 kâr eklemesi yalnız yüzde 33 marj demektir.

## Adımlar
1. **Maliyet artı taban fiyat:** satışa oranlı giderleri (komisyonlar) ve hedef marjı birlikte hesaba katan fiyatı bul.
\`\`\`
gerekli_net     = (maliyet + kargo + paket) / (1 - komisyon - odeme_komisyonu - hedef_marj)
satis_kdv_dahil = gerekli_net * (1 + kdv)
birim_kar       = net_satis - maliyet - kargo - paket - net_satis * (komisyon + odeme_komisyonu)
\`\`\`
Oranları 0 ile 1 arasında kullan (yüzde 18 için 0.18). Pazaryeri komisyonunun KDV dahil fiyat üzerinden mi alındığını sözleşmeden doğrula ve formülü ona göre uyarla.
2. **Rakip bandı:** rakiplerin en düşük, ortanca ve en yüksek fiyatını çıkar. Taban fiyat bandın üstündeyse farkı haklı çıkaran değeri (paket, garanti, hızlı teslim) açıkça yaz ya da maliyeti düşürmenin yolunu ara.
3. **Değer temelli düzeltme:** müşterinin elde ettiği sonucu ve alternatifinin maliyetini düşün; üst segmentte bandın üstünde kalmak bilinçli bir seçim olabilir.
4. **Psikolojik fiyat:** tüketici fiyatında 9 ile biten tutarlar (249,90 gibi) yaygındır; üst segmentte yuvarlak fiyat daha güven verir.
5. **Kanal farkı:** pazaryeri fiyatı daha yüksek giderle hesaplanır. Kendi sitende daha uygun fiyat ya da ek avantaj sunmadan önce pazaryeri sözleşmesinde fiyat eşitliği şartı olup olmadığını kontrol et.
6. **Güncelleme kuralı:** maliyet ya da kur belirlenen eşiği (yüzde 5 gibi) aştığında fiyatı yeniden hesapla. Yüksek enflasyon döneminde maliyet olarak eski alış fiyatını değil, aynı ürünü bugün yeniden alma maliyetini kullan.

## Çıktı
| Ürün | Kanal | Maliyet | Kargo ve paket | Komisyonlar | Satış (KDV dahil) | Net satış | Birim kâr | Marj | Rakip ortanca |
|---|---|---|---|---|---|---|---|---|---|
Altına varsayımları (oranlar, kur, tarih) ve rakip bandının dışında kalan ürünleri yaz. Zarar eden ürünleri en üste al.

## Yapma
- KDV dahil fiyattan doğrudan marj hesaplama.
- Komisyon oranını tahmin etme; kullanıcının sözleşmesindeki ya da panelindeki oranı iste.
- Rakip fiyatını tarihsiz kullanma.
- Rakiplerle fiyat konuşmayı ya da fiyat birlikteliğini önerme; rekabet hukukuna aykırıdır.`,
    dosyalar: [],
  },
  {
    id: "birim-ekonomisi", ad: "birim-ekonomisi", baslik: "Kâr marjı ve birim ekonomisi", kategori: "finans", simge: "/gercek/galeri/soyut10.webp",
    aciklama: "Bir e-ticaret ya da abonelik işinin müşteri ve sipariş başına ekonomisini hesaplarken kullan: sipariş başı katkı payı, kanal bazında müşteri edinme maliyeti (CAC), katkı payına dayalı müşteri yaşam boyu değeri (LTV), LTV ile CAC oranı, geri ödeme süresi, kohort tablosu ve hangi kanalın ölçeklenip hangisinin durdurulacağı kararı. Tetikleyiciler: birim ekonomisi, CAC, LTV, katkı payı, reklam kârlı mı, ROAS yeterli mi, müşteri başı kâr.",
    ornekler: ["Instagram reklamlarım kâr getiriyor mu, hesapla", "Aboneliğimin LTV ve CAC oranı ne?", "Sipariş başına gerçekte ne kadar kazanıyorum?"],
    govde: `# Kâr marjı ve birim ekonomisi

Bu yetenek bir e-ticaret ya da abonelik işinin müşteri başına ekonomisini hesaplar: katkı payı, müşteri edinme maliyeti (CAC), müşteri yaşam boyu değeri (LTV) ve geri ödeme süresi. Sonuçla hangi kanalın ölçeklenebileceğini söyler.

## Önce topla
- Dönem (en az son üç ay) ve iş modeli: tek seferlik satış, tekrar eden alım ya da abonelik
- Sipariş sayısı, ortalama sepet (KDV hariç), satılan malın maliyeti
- Sipariş başı değişken giderler: kargo, paketleme, ödeme komisyonu, pazaryeri komisyonu, iade maliyeti
- Kanal kanal pazarlama harcaması ve o kanaldan gelen yeni müşteri sayısı
- Tekrar alım oranı ya da aylık kayıp (churn) oranı; varsa müşteri grubu (kohort) verisi

## Hesaplar
\`\`\`
katki_payi   = ort_sepet - urun_maliyeti - kargo - paket - odeme_kom - pazaryeri_kom - iade_maliyeti
katki_marji  = katki_payi / ort_sepet
cac          = kanal_harcamasi / kanaldan_yeni_musteri
ltv_eticaret = katki_payi * musteri_basi_siparis_sayisi_12_ay
ltv_abonelik = aylik_gelir * katki_marji / aylik_churn
geri_odeme   = cac / (aylik_gelir * katki_marji)      (ay)
oran         = ltv / cac
\`\`\`
\`scripts/birim-ekonomisi.js\` bu hesapları tek seferde yapar.

## Adımlar
1. Katkı payını sipariş başına hesapla. Sıfıra yakın ya da altındaysa ölçeklemeden önce fiyat, sepet ya da gider düzeltilmeli.
2. CAC'yi kanal kanal hesapla. Karışık CAC (toplam harcama bölü toplam yeni müşteri) iyi kanalı kötü kanalın, kötü kanalı organik müşterilerin arkasına saklar.
3. LTV'yi ciro üzerinden değil katkı payı üzerinden hesapla. Veri kısa dönemliyse LTV'yi 12 ayla sınırla; ömür boyu varsayımı yapma.
4. Kohort tablosu kur: ilk alım ayına göre müşterilerin sonraki aylardaki birikimli katkısı. Yeni kohortlar eskilerden kötüyse kanal kalitesi düşüyor demektir.
5. Yorumla: LTV, CAC'nin üç katı ya da daha fazlasıysa kanal genelde sağlıklıdır; LTV, CAC'den küçükse her yeni müşteri zarar getirir. Geri ödeme süresini nakit gücüyle birlikte değerlendir; nakit tamponu zayıf işte 6 ayın altı hedeflenir.
6. Kaldıraçları sırala: ortalama sepet, kargo eşiği, iade oranı, tekrar alım, kanal karması. Her birinde makul bir iyileşmenin LTV ile CAC oranını ne kadar değiştirdiğini hesapla.

## Çıktı
| Kanal | Harcama | Yeni müşteri | CAC | Katkı payı (sipariş) | LTV (12 ay) | LTV ile CAC oranı | Geri ödeme (ay) | Karar |
|---|---|---|---|---|---|---|---|---|
Karar değerleri: "Ölçekle", "İyileştir", "Durdur". Tablonun altına varsayımları ve veri eksiklerini yaz.

Kohort tablosu:
| İlk alım ayı | Müşteri | 1. ay | 2. ay | 3. ay | 6. ay | 12. ay |
|---|---|---|---|---|---|---|

## Yapma
- Ciroyu kâr gibi kullanarak LTV hesaplama.
- Organik müşterileri ücretli kanalın CAC'sine katıp kanalı olduğundan iyi gösterme.
- Tek ayın verisiyle kesin "durdur" kararı önerme; en az üç ay ya da yeterli sipariş sayısı iste.`,
    dosyalar: [{ yol: "scripts/birim-ekonomisi.js", icerik: `// Birim ekonomisi hesapları. Tutarlar KDV hariç, oranlar 0 ile 1 arasında (yüzde 5 için 0.05).
// g: { ortSepet, urunMaliyeti, kargo, paket, odemeKomOrani, pazaryeriKomOrani, iadeMaliyeti,
//      harcama, yeniMusteri, musteriBasiSiparis, aylikGelir, aylikChurn }
export function birimEkonomisi(g) {
  const odemeKom = g.ortSepet * (g.odemeKomOrani || 0);
  const pazaryeriKom = g.ortSepet * (g.pazaryeriKomOrani || 0);
  const katki = g.ortSepet - g.urunMaliyeti - (g.kargo || 0) - (g.paket || 0)
    - odemeKom - pazaryeriKom - (g.iadeMaliyeti || 0);
  const katkiMarji = g.ortSepet > 0 ? katki / g.ortSepet : 0;
  const cac = g.yeniMusteri > 0 ? g.harcama / g.yeniMusteri : null;

  let ltv;
  if (g.aylikGelir && g.aylikChurn) {
    ltv = (g.aylikGelir * katkiMarji) / g.aylikChurn; // abonelik
  } else {
    ltv = katki * (g.musteriBasiSiparis || 1); // tekrar eden alım, 12 ay
  }

  const aylikKatki = g.aylikGelir ? g.aylikGelir * katkiMarji : null;
  return {
    katkiPayi: katki,
    katkiMarji: katkiMarji,
    cac: cac,
    ltv: ltv,
    ltvCacOrani: cac ? ltv / cac : null,
    geriOdemeAy: cac && aylikKatki ? cac / aylikKatki : null,
  };
}

// Kanal listesini karar etiketiyle döndürür.
export function kanalKarari(oran) {
  if (oran === null) return "Veri eksik";
  if (oran >= 3) return "Ölçekle";
  if (oran >= 1) return "İyileştir";
  return "Durdur";
}
` }],
  },
  {
    id: "teklif-proforma", ad: "teklif-proforma", baslik: "Teklif ve proforma fatura", kategori: "finans", simge: "/gercek/panel/gal-gpt-5.webp",
    aciklama: "Kurumsal bir müşteriye fiyat teklifi ya da ihracat ve ön ödeme için proforma fatura hazırlarken kullan: kalem tablosu, iskonto ve KDV gösterimi, para birimi ve kur maddesi, ödeme ve teslim koşulları, Incoterms teslim şekli, geçerlilik süresi, kapsam dışı işler ve kabul bölümü. Tetikleyiciler: teklif hazırla, fiyat teklifi, proforma, proforma invoice, teklif mektubu, dövizli teklif.",
    ornekler: ["Bu müşteriye 3 kalemlik fiyat teklifi hazırla", "Almanya'daki alıcı için euro proforma fatura çıkar", "Teklifime kur maddesi nasıl yazılır?"],
    govde: `# Teklif ve proforma fatura

Bu yetenek kurumsal müşteriye gönderilecek fiyat teklifini ve ihracat ya da ön ödeme için proforma faturayı hazırlar: kalemler, vergiler, ödeme ve teslim koşulları, geçerlilik ve kur maddesi.

## Önce topla
- Satıcı ve alıcı bilgileri: unvan, adres, vergi dairesi ve numarası, yetkili kişi
- Kalemler: ürün ya da hizmet, miktar, birim, birim fiyat, iskonto
- Para birimi (TL, USD, EUR) ve dövizliyse kur esası
- Ödeme koşulu: peşin, ön ödeme oranı, vade günü, ödeme yöntemi
- Teslim yeri ve süresi; ihracatta teslim şekli (EXW, FCA, FOB, CIF, DAP gibi Incoterms 2020 kuralları)
- Geçerlilik süresi ve özel şartlar (kurulum, eğitim, garanti, bakım)

## Teklif ile proforma farkı
- **Teklif:** satış öncesi fiyat önerisidir; kabul edilirse sözleşmenin temelini oluşturur.
- **Proforma fatura:** satış gerçekleşmeden düzenlenen bilgi belgesidir; vergi belgesi değildir ve deftere gelir olarak yazılmaz. Ön ödeme istemek, alıcının bankası, akreditif ya da ithalat izni için kullanılır. Teslimden sonra asıl fatura ayrıca kesilir.

## Adımlar
1. Teklif numarası ver (TKL-2026-0042 gibi); düzenleme ve geçerlilik tarihini yaz.
2. Kalem tablosunu kur: her satırda KDV hariç birim fiyat, iskonto, satır tutarı ve KDV oranı. KDV toplamını ayrı satırda göster.
3. Dövizli teklifte kur maddesi yaz: hangi kur (TCMB döviz satış kuru gibi) ve hangi günün kuru (fatura tarihi ya da ödeme günü).
4. Ödeme, teslim, garanti ve kapsam dışı işleri madde madde yaz; "ve diğer işler" gibi belirsiz ifade kullanma.
5. Fiyatın neleri içerdiğini ve içermediğini açıkça belirt: kargo, kurulum, yol ve konaklama, yazılım lisansı.
6. Proformada ayrıca: GTİP, menşe ülke, brüt ve net ağırlık, koli sayısı, banka bilgisi (IBAN, SWIFT), teslim şekli.
7. Kabul yolunu yaz: imza ve kaşe, e-posta onayı ya da satın alma sipariş numarası.

## Ödeme koşulu seçenekleri
| Koşul | Ne zaman | Risk |
|---|---|---|
| Peşin ya da tam ön ödeme | Yeni müşteri, ihracat, kişiye özel üretim | Alıcı için yüksek, satıcı için düşük |
| Kısmi ön ödeme ve teslimde kalan | Proje işleri, kurulum | Dengeli |
| Vadeli açık hesap (30 ya da 60 gün) | Güvenilir ve düzenli müşteri | Tahsilat ve kur riski satıcıda |
| Akreditif | Yüksek tutarlı ihracat | Banka masrafı, belge uyumu |
Vadeli satışta gecikme hâlinde uygulanacak faizi ya da vade farkını ayrıca yaz.

## Kontroller
- Kalem toplamları, iskonto ve KDV yeniden hesaplandı mı
- Para birimi her tutarın yanında yazılı mı
- Geçerlilik tarihi geçmiş teklif aynı fiyatla yeniden gönderilmiyor mu
- İmzalanıp kabul edilen teklif sözleşme niteliği kazanabilir ve damga vergisi doğabilir; bunu mali müşavire sor.
- İhracatta KDV istisnası ve gümrük işlemleri için gümrük müşavirine danışılmasını öner.

## Çıktı
\`assets/teklif-sablonu.md\` yapısında, kullanıcının bilgileriyle doldurulmuş teklif ya da proforma. Bilinmeyen alanları köşeli parantez içinde bırak ve sonunda soru listesi olarak sor.

## Yapma
- Proformayı fatura gibi sunma ya da "fatura yerine geçer" yazma.
- Dövizli bir teklifi kur maddesi olmadan TL ödemeye bağlama.
- Kullanıcının vermediği indirimi, garanti süresini ya da teslim tarihini ekleme.`,
    dosyalar: [{ yol: "assets/teklif-sablonu.md", icerik: `# [Satıcı unvanı]
[Adres] · [Telefon] · [E-posta] · Vergi dairesi ve no: [..]

## Fiyat teklifi
**Teklif no:** [TKL-2026-0001]
**Tarih:** [gün.ay.yıl]
**Geçerlilik:** [gün.ay.yıl] tarihine kadar
**Sayın:** [Alıcı unvanı], [yetkili kişi]
**Konu:** [teklifin konusu]

| No | Açıklama | Miktar | Birim | Birim fiyat | İskonto | Tutar | KDV oranı |
|---|---|---|---|---|---|---|---|
| 1 | [..] | [..] | [adet] | [..] | [..] | [..] | [güncel oranı doğrula] |

| Toplamlar | |
|---|---|
| Ara toplam | [..] |
| İskonto | [..] |
| KDV matrahı | [..] |
| KDV | [..] |
| Genel toplam | [..] |
| Yazıyla | [..] |

## Koşullar
- **Para birimi ve kur:** [TL] ya da [USD veya EUR; ödeme günündeki TCMB döviz satış kuru esas alınır]
- **Ödeme:** [sipariş onayında yüzde 50, teslimde yüzde 50]
- **Teslim:** [yer], [süre], [teslim şekli]
- **Fiyata dahil olanlar:** [..]
- **Fiyata dahil olmayanlar:** [..]
- **Garanti:** [süre ve kapsam]

## Kabul
Bu teklifi kabul ediyorsanız imzalayıp kaşeleyerek ya da e-postayla onaylayarak iletiniz.

Satıcı adına: [ad, imza]
Alıcı adına: [ad, imza, kaşe, tarih]

---
**Proforma fatura olarak kullanılacaksa:** başlığı "Proforma fatura" yap ve şu alanları ekle: GTİP, menşe ülke, brüt ve net ağırlık, koli sayısı, teslim şekli (Incoterms 2020), banka adı, IBAN, SWIFT. Altına "Bu belge fatura yerine geçmez." notunu yaz.
` }],
  },
  {
    id: "cari-hesap-mutabakati", ad: "cari-hesap-mutabakati", baslik: "Cari hesap mutabakatı", kategori: "finans", simge: "/gercek/galeri/soyut12.webp",
    aciklama: "Bir müşteri ya da tedarikçiyle cari hesap bakiyesini karşılaştırırken, iki ekstre arasındaki farkları belge belge eşleştirip nedenine göre sınıflandırırken (yoldaki fatura, kaydedilmemiş ödeme, iade, kur farkı, mükerrer kayıt), mutabakat mektubu yazarken, Ba ve Bs form tutarlarını karşılaştırırken ve pazaryeri hakediş dökümünü siparişlerle eşleştirirken kullan. Tetikleyiciler: cari mutabakat, ekstre farkı, bakiye tutmuyor, mutabakat mektubu, Ba Bs, hakediş kontrolü.",
    ornekler: ["Tedarikçinin ekstresiyle bizim kayıtlar tutmuyor, farkı bul", "Yıl sonu mutabakat mektubu hazırla", "Trendyol hakedişim eksik mi yattı?"],
    govde: `# Cari hesap mutabakatı

Bu yetenek bir müşteri ya da tedarikçiyle cari hesap bakiyesini karşılaştırır, farkları nedenine göre ayırır ve mutabakat mektubu ile düzeltme önerisini hazırlar. Pazaryeri ve ödeme kuruluşu hakediş kontrolünde de kullanılır.

## Önce topla
- Kendi kayıtlarındaki cari hesap ekstresi: tarih, belge numarası, açıklama, borç, alacak, bakiye
- Karşı tarafın ekstresi ya da bildirdiği bakiye
- Mutabakat tarihi (genelde ay ya da yıl sonu) ve para birimi
- Dövizli cari hesapta kayıtlarda kullanılan kurlar

## Adımlar
1. **Bakiyeleri karşılaştır:** iki tarafın aynı tarihli bakiyesini yan yana koy. Yönlerin ters olduğunu unutma; senin alacağın karşı tarafın borcudur.
2. **Belgeleri eşleştir:** önce belge numarasıyla, sonra tutar ve tarih yakınlığıyla eşleştir; eşleşenleri ayır.
3. **Farkları sınıflandır:**

| Fark türü | Tipik neden | Düzeltme |
|---|---|---|
| Yoldaki fatura | Fatura kesildi, karşı taraf henüz kaydetmedi | Zamanlama farkı, düzeltme gerekmez |
| Kaydedilmemiş ödeme | Havale ya da çek bir tarafta kayıtlı değil | Dekontla kayıt |
| İade ya da fiyat farkı | İade faturası veya fiyat farkı faturası eksik | Eksik belgeyi düzenle ya da iste |
| Kur farkı | Dövizli işlemde farklı kur | Kur farkı faturası ya da kaydı |
| Mükerrer kayıt | Aynı belge iki kez işlenmiş | Ters kayıtla düzelt |
| Hatalı tutar | Yazım hatası | Düzeltme kaydı |
| Kesinti | Pazaryeri ya da banka kesintisi | Kesinti belgesini iste, gider kaydet |

4. **Mutabakat mektubunu gönder:** bakiye, tarih ve "mutabıkız" ya da "mutabık değiliz" yanıt alanı olan mektubu (\`assets/mutabakat-mektubu.md\`) gönder; yanıt için makul bir süre ver.
5. **Ba ve Bs kontrolü:** aynı kişi ya da kurumla aylık alış veya satış toplamı yasal bildirim eşiğini aşıyorsa Form Ba ve Form Bs'deki belge sayısı ve tutarın iki tarafta eşleşmesi gerekir. Güncel eşiği ve muafiyetleri mali müşavire doğrulat.
6. **Pazaryeri hakedişi:** sipariş bazında satış tutarı, komisyon, kargo kesintisi, hizmet bedeli, iade ve yatan tutar sütunlarıyla eşleştir; açıklanamayan kesinti için pazaryerine kayıtlı destek talebi aç.

## Kurallar
- Fark kapanmadan bakiyeyi "mutabık" işaretleme.
- Zamanlama farklarını ayrıca göster; bir sonraki dönemde kapanmazsa gerçek fark sayılır.
- Karşı tarafa giden yazıda yalnız o tarafla ilgili işlemleri paylaş.
- Dövizli carilerde hem döviz hem TL bakiyesini karşılaştır.

## Çıktı
\`\`\`
Mutabakat tarihi            : ...
Bizim kayıtlara göre bakiye : ... (borç ya da alacak)
Karşı tarafa göre bakiye    : ...
Fark                        : ...
Açıklanan fark              : ...
Açıklanamayan fark          : ...
\`\`\`
Ardından fark tablosu (belge, tarih, tutar, tür, kimde eksik, yapılacak) ve karşı tarafa gönderilecek mektup metni.

## Yapma
- Farkı kapatmak için dayanaksız düzeltme kaydı önerme.
- Kur farkını hesaplamadan dövizli bakiyeyi yalnız TL üzerinden eşleştirmeye çalışma.
- Bildirim eşiğini ya da beyan süresini ezbere yazma.`,
    dosyalar: [{ yol: "assets/mutabakat-mektubu.md", icerik: `# Cari hesap mutabakat mektubu

**Kime:** [Karşı taraf unvanı], [muhasebe yetkilisi]
**Kimden:** [Şirket unvanı], [ad ve iletişim]
**Tarih:** [gün.ay.yıl]

Sayın yetkili,

Kayıtlarımıza göre [mutabakat tarihi] itibarıyla şirketiniz cari hesabı [tutar] [para birimi] [borç ya da alacak] bakiyesi vermektedir. Hesap ekstremiz ektedir.

Kayıtlarınızla uyumluysa "Mutabıkız" seçeneğini, uyumlu değilse "Mutabık değiliz" seçeneğini işaretleyip [son yanıt tarihi] tarihine kadar [e-posta ya da KEP adresi] adresine iletmenizi rica ederiz.

Saygılarımızla,
[Ad, unvan, imza]

---

## Yanıt

[ ] Mutabıkız.

[ ] Mutabık değiliz. Kayıtlarımıza göre bakiye [tutar] [para birimi] [borç ya da alacak]. Ekstremiz ektedir.

Yanıtlayan: [ad, unvan, imza, kaşe]
Tarih: [gün.ay.yıl]
` }],
  },
  {
    id: "siparis-bildirimleri", ad: "siparis-bildirimleri", baslik: "Sipariş durum bildirimleri", kategori: "eticaret", simge: "/gercek/panel/gal-pazarlama-6.webp",
    aciklama: "Sipariş alındı, kargoya verildi, dağıtımda, teslim edildi, teslim edilemedi, iptal ve para iadesi gibi her sipariş durumu için SMS ve e-posta şablonu yazarken, gönderim tetiklerini kurarken ve bilgilendirme iletisini İYS onayı gerektiren ticari iletiden ayırırken kullan. Tetikleyiciler: sipariş SMS'i, kargo bildirimi, sipariş e-postası, işlem e-postası, İYS, ticari ileti, bildirim şablonu.",
    ornekler: ["Sipariş durumları için SMS ve e-posta şablonları yaz", "Kargo SMS'ine indirim kodu ekleyebilir miyim?", "Teslim edildi e-postası hazırla"],
    govde: `# Sipariş durum bildirimleri

Bu yetenek sipariş yaşam döngüsünün her adımı için SMS ve e-posta şablonlarını yazar, gönderim tetiklerini tanımlar ve bilgilendirme iletilerini ticari ileti kurallarından ayırır.

## Önce topla
- Sipariş durumları ve sistemdeki adları
- Kanallar: SMS, e-posta, uygulama bildirimi, WhatsApp Business
- SMS sağlayıcısı ve kayıtlı gönderici adı (başlık)
- Marka tonu (sen ya da siz), destek kanalı, iade sayfası adresi
- Müşterinin ticari ileti onayı İYS'de kayıtlı mı

## Bilgilendirme ile ticari ileti ayrımı
- Sipariş, ödeme, kargo, teslim, iade ve fatura bildirimleri işlemle ilgili bilgilendirme iletileridir; ticari ileti onayı gerektirmez.
- Bu iletiye indirim kodu, kampanya ya da ürün önerisi eklenirse ileti ticari ileti sayılır: alıcının onayı ve İYS kaydı gerekir, iletide ret yolu bulunmalıdır.
- Bu yüzden işlem iletilerini yalnız işlem bilgisiyle sınırla; tanıtımı ayrı ve onaylı listeye gönder.
- Kapsamın ayrıntısı için güncel Ticari İletişim ve Ticari Elektronik İletiler Hakkında Yönetmelik'i hukukçuya doğrulat.

## Tetik tablosu
| Durum | Kanal | Ne zaman | İçerik |
|---|---|---|---|
| Sipariş alındı | E-posta, SMS | Ödeme onayı anında | Sipariş no, tutar, ürünler, tahmini kargo günü |
| Hazırlanıyor | Uygulama bildirimi | İsteğe bağlı | Kısa durum |
| Kargoya verildi | SMS, e-posta | Takip numarası oluşunca | Kargo firması, takip bağlantısı |
| Dağıtımda | SMS | Kargo durumu geldiğinde | Bugün teslim bilgisi |
| Teslim edildi | E-posta | Teslim sonrası | Fatura bağlantısı, iade yolu |
| Teslim edilemedi | SMS | Durum geldiğinde | Şube ve bekleme süresi |
| İptal | E-posta, SMS | İptal anında | Neden, para iadesi bilgisi |
| Para iadesi | E-posta | İade başlatıldığında | Tutar, yansıma süresi |

## SMS kuralları
- Türkçe karakterler (ç, ğ, ı, ö, ş, ü) mesajın kodlamasını değiştirip bir parçaya sığan karakter sayısını düşürebilir; sağlayıcıda kodlamayı test et ve mesajı tek parçada tut.
- Gönderici adı kayıtlı marka başlığı olsun; bağlantılar kısa ve markanın kendi alan adında olsun.
- Gece saatlerinde gönderme; dağıtım bildirimleri dışındaki iletileri sabaha ertele.

## E-posta kuralları
- Konu satırı durumu söyler: "Siparişin kargoda: 10482".
- Gövdede sipariş özeti tablosu, tek ana düğme (takip ya da sipariş detayı) ve destek bağlantısı.
- Düz metin sürümü de olsun; görseller kapalıyken okunabilsin.
- Gönderen adresi yanıtlanabilir olsun ya da destek adresini açıkça göster.

## Çıktı
\`assets/bildirim-sablonlari.md\` biçiminde durum başına SMS ve e-posta metni; değişkenler çift süslü parantezle ({{siparis_no}}). En sonda kullanılan değişkenlerin listesi ve hangi durum geçişinin hangi iletiyi tetiklediği.

## Yapma
- İşlem iletisine kampanya, kupon ya da "bunları da beğenebilirsin" ekleme.
- Tam adres, TCKN ya da kart bilgisini SMS'e yazma.
- Aynı durum için iki kez ileti gönderme; gönderilen bildirimi sipariş kaydına işle.`,
    dosyalar: [{ yol: "assets/bildirim-sablonlari.md", icerik: `# Sipariş bildirim şablonları

Değişkenler: {{ad}}, {{siparis_no}}, {{tutar}}, {{kargo_firmasi}}, {{takip_baglantisi}}, {{tarih}}, {{iade_tutari}}, {{destek_baglantisi}}, {{marka}}

## Sipariş alındı
SMS: {{marka}}: Merhaba {{ad}}, {{siparis_no}} numaralı siparişini aldık. Kargoya verdiğimizde haber vereceğiz.
E-posta konu: Siparişini aldık: {{siparis_no}}
E-posta gövde: Merhaba {{ad}}, siparişin için teşekkürler. Ödemen onaylandı ve siparişin hazırlanıyor. Tahmini kargo tarihi {{tarih}}. Sipariş özetin aşağıda.

## Kargoya verildi
SMS: {{marka}}: {{siparis_no}} numaralı siparişin {{kargo_firmasi}} ile yola çıktı. Takip: {{takip_baglantisi}}
E-posta konu: Siparişin kargoda: {{siparis_no}}
E-posta gövde: Merhaba {{ad}}, siparişini {{kargo_firmasi}} ile gönderdik. Kargonu şu bağlantıdan izleyebilirsin: {{takip_baglantisi}}

## Dağıtımda
SMS: {{marka}}: {{siparis_no}} numaralı siparişin bugün dağıtımda. Adreste bulunamazsan paket {{kargo_firmasi}} şubesinde bekletilir.

## Teslim edildi
E-posta konu: Siparişin teslim edildi
E-posta gövde: Merhaba {{ad}}, {{siparis_no}} numaralı siparişin teslim edildi. Faturan ekte. Bir sorun varsa {{destek_baglantisi}} üzerinden bize yaz. Cayma süren teslimden itibaren 14 gündür.

## Teslim edilemedi
SMS: {{marka}}: {{siparis_no}} teslim edilemedi. Paketin {{kargo_firmasi}} şubesinde {{tarih}} tarihine kadar bekliyor. Takip: {{takip_baglantisi}}

## İptal
SMS: {{marka}}: {{siparis_no}} numaralı siparişin iptal edildi. {{tutar}} TL iaden başlatıldı; hesabına yansıması bankana göre birkaç iş günü sürebilir.
E-posta konu: Siparişin iptal edildi: {{siparis_no}}

## Para iadesi
E-posta konu: {{iade_tutari}} TL iaden başlatıldı
E-posta gövde: Merhaba {{ad}}, iade ettiğin ürün bize ulaştı ve {{iade_tutari}} TL iadeni bugün başlattık. Tutarın hesabına yansıması bankana göre birkaç iş günü sürebilir. Sorun olursa {{destek_baglantisi}}
` }],
  },
  {
    id: "etbis-mevzuat-kontrolu", ad: "etbis-mevzuat-kontrolu", baslik: "ETBİS kaydı ve e-ticaret mevzuatı kontrolü", kategori: "eticaret", simge: "/gercek/galeri/3d11.webp",
    aciklama: "Türkiye'de internetten satış yapacak ya da yapan bir işletmenin kayıt ve bilgilendirme yükümlülüklerini denetlerken kullan: ETBİS kaydı ve karekod, site künyesi, ön bilgilendirme ve sözleşme akışı, fiyat gösterimi, e-Arşiv faturalama, KVKK ve VERBİS, İYS ve ticari ileti, tüketici yorumları, garanti belgesi ve ürün güvenliği. Satışa başlamadan önce ya da mevcut mağazayı denetlerken eksik listesi çıkarır. Tetikleyiciler: ETBİS, e-ticaret mevzuatı, yasal kontrol, site künyesi, satışa başlamadan önce ne lazım, uyum denetimi.",
    ornekler: ["E-ticaret sitemi açmadan önce yasal olarak neler eksik?", "ETBİS kaydı nasıl yapılır, sitemde ne göstermeliyim?", "Mağazamı e-ticaret mevzuatına göre denetle"],
    govde: `# ETBİS kaydı ve e-ticaret mevzuatı kontrolü

Bu yetenek Türkiye'de internetten satış yapacak ya da yapan bir işletmenin kayıt ve bilgilendirme yükümlülüklerini kontrol listesiyle denetler ve eksikleri öncelik sırasıyla verir. Kontrol bilgilendirme amaçlıdır; sonuçları bir hukukçu ve mali müşavirle doğrulatmasını kullanıcıya söyle. Yasal metinlerin kendisi için Türk e-ticaret yasal sayfaları yeteneğini kullan.

## Önce topla
- İşletme türü (şahıs şirketi, limited, anonim), vergi ve MERSİS numarası
- Satış kanalları: kendi alan adı, pazaryeri mağazaları, sosyal medya, mobil uygulama
- Satılan ürünler: fiziksel, dijital, hizmet; garanti belgesi ya da CE işareti gereken ürün var mı
- Kişisel veri işleme ölçeği ve yurt dışına veri aktarımı (sunucu, e-posta ve analitik servisleri)
- SMS ya da e-postayla tanıtım yapılıyor mu
- Sitenin adresi ya da ekran görüntüleri (denetim için)

## Kontrol alanları
1. **ETBİS kaydı:** Ticaret Bakanlığı Elektronik Ticaret Bilgi Sistemi'ne e-Devlet üzerinden kayıt; kendi alan adın ve pazaryerindeki mağazalarının bildirimi. Kayıttan sonra verilen karekodu ya da doğrulama bağlantısını sitende göster. Kayıt ve güncelleme sürelerini Bakanlığın güncel duyurusundan doğrula.
2. **Künye bilgileri:** sitede kolay ulaşılan bir yerde ticari unvan, MERSİS ya da vergi numarası, açık adres, telefon, e-posta, KEP adresi ve varsa meslek odası bilgisi.
3. **Sözleşme akışı:** ön bilgilendirme formu ve mesafeli satış sözleşmesi ödeme öncesi gösterilip onaylanıyor mu; sözleşme kalıcı veri saklayıcısıyla (e-posta gibi) müşteriye iletiliyor mu.
4. **Fiyat gösterimi:** vergiler dahil TL fiyat, kargo ücreti açık, birim fiyat gereken ürünlerde birim fiyat, indirimde son 30 gün en düşük fiyat kuralı.
5. **Faturalama:** e-Arşiv ya da e-Fatura kullanımı; internet satışı faturasında zorunlu ibare ve kargo bilgileri.
6. **KVKK:** aydınlatma metni, açık rıza gereken işlemler için ayrı onay, çerez tercihleri, yurt dışı aktarım dayanağı, VERBİS kayıt yükümlülüğü (eşik ve muafiyetleri doğrula), veri ihlali müdahale planı.
7. **Ticari ileti:** tanıtım iletileri için önceden onay, İYS'ye kayıt ve onayların İYS'ye aktarımı, her iletide ret yolu.
8. **Yorumlar:** yalnız ürünü gerçekten satın alan müşterilerin yorumları; olumsuz yorum gizlenmez, sahte yorum yazdırılmaz.
9. **Ürün güvenliği ve garanti:** gereken ürünlerde CE işareti ve uygunluk belgesi, Türkçe kullanım kılavuzu, garanti belgesi (elektronik garanti belgesi kullanılabilir), etiket bilgileri.
10. **Aracı hizmet sağlayıcı:** kendi platformunda başka satıcılara yer veriyorsan aracı hizmet sağlayıcı yükümlülükleri ve işlem hacmine göre lisans şartı doğabilir; eşikleri hukukçuya sor.
11. **Şikâyet ve iletişim:** müşterinin talep ve şikâyetini iletebileceği kanal ve yanıt süresi tanımlı mı.

## Satışa başlamadan önce sıra
1. Şirket ve vergi kaydı, e-Arşiv ya da e-Fatura kullanımı
2. Ödeme kuruluşu sözleşmesi (kuruluş da künye ve yasal sayfaları ister)
3. Yasal sayfalar: ön bilgilendirme, mesafeli satış, iade, KVKK, çerez
4. Künye ve iletişim bilgileri sitede
5. ETBİS kaydı ve karekodun siteye eklenmesi
6. İYS kaydı (tanıtım iletisi gönderilecekse) ve onay formları
7. Kargo anlaşması ve kargo politikası sayfası
8. Deneme siparişi: sözleşme onayı, ödeme, fatura, bildirim ve iade akışı uçtan uca çalışıyor mu

## Çıktı
| No | Alan | Durum | Bulunan | Yapılacak | Öncelik |
|---|---|---|---|---|---|
Durum değerleri: "Var", "Eksik", "Belirsiz". Satışı engelleyen ya da idari para cezası riski taşıyan maddeler "Yüksek" öncelik alır. Tablonun altına "doğrulanması gerekenler" listesini ayrıca yaz ve \`references/kontrol-listesi.md\` dosyasını işaretlenmiş hâliyle ekle.

## Yapma
- Ceza tutarı, eşik ya da süre değerini ezbere yazma; "güncel mevzuattan doğrulanacak" diye işaretle.
- Siteyi görmeden "uyumlu" sonucu verme; görmediğin alanı "Belirsiz" yaz.
- Bu kontrolün hukuki danışmanlık yerine geçtiğini ima etme.`,
    dosyalar: [{ yol: "references/kontrol-listesi.md", icerik: `# E-ticaret mevzuatı kontrol listesi

Her maddeyi işaretle; emin olunmayanları "doğrulanacak" diye not et.

## Kayıt
- [ ] ETBİS kaydı yapıldı; alan adları ve pazaryeri mağazaları bildirildi
- [ ] ETBİS karekodu ya da doğrulama bağlantısı sitede görünüyor
- [ ] Vergi kaydı tamam; e-Arşiv ya da e-Fatura kullanımı başladı
- [ ] VERBİS yükümlülüğü değerlendirildi

## Site
- [ ] Künye: unvan, MERSİS ya da vergi no, adres, telefon, e-posta, KEP adresi
- [ ] Ön bilgilendirme formu ve mesafeli satış sözleşmesi ödeme öncesi onaylanıyor
- [ ] İade ve cayma politikası sayfası
- [ ] KVKK aydınlatma metni ve gerekiyorsa açık rıza metni
- [ ] Çerez bandında kabul ve ret eşit ağırlıkta
- [ ] Fiyatlar vergiler dahil TL; kargo ücreti açık
- [ ] Yorumlar gerçek alıcılardan ve filtresiz

## Ödeme ve fatura
- [ ] 3D Secure açık
- [ ] Kart verisi sitede saklanmıyor
- [ ] İnternet satışı faturasında zorunlu ibare, web adresi, ödeme ve kargo bilgileri

## İletişim
- [ ] Tanıtım iletileri için onay alınıyor ve İYS'ye aktarılıyor
- [ ] İşlem bildirimleri tanıtım içermiyor
- [ ] Şikâyet ve talep kanalı ile yanıt süresi tanımlı

## Ürün
- [ ] Gereken ürünlerde CE işareti ve uygunluk belgesi
- [ ] Garanti belgesi ve Türkçe kullanım kılavuzu
- [ ] Ürün sayfasında etiket bilgileri ve gerekiyorsa birim fiyat

## Başvurulacak mevzuat
- 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun ve ilgili yönetmelikler
- 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği
- Ticari Reklam ve Haksız Ticari Uygulamalar Yönetmeliği
- Fiyat Etiketi Yönetmeliği
- Ticari İletişim ve Ticari Elektronik İletiler Hakkında Yönetmelik
- 6698 sayılı Kişisel Verilerin Korunması Kanunu
- Vergi Usul Kanunu ve e-belge genel tebliğleri

Güncel metinler için mevzuat.gov.tr ve ilgili bakanlık duyuruları esas alınır.
` }],
  },
];
