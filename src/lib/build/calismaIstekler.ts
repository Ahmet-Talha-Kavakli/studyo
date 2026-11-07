import type { ProjeTur } from "./tipler";

/** Çalışma alanında hazır istek çipleri: proje türüne göre kategoriler. Tıklayınca komut kutusuna yazılır. */
export type IstekKategori = { id: string; ad: string; istekler: string[] };

const ORTAK_BUYUME: IstekKategori = { id: "buyume", ad: "Yayın ve büyüme", istekler: [
  "SEO başlık ve açıklamalarını her sayfa için yaz",
  "Sosyal medyada paylaşılınca görünen kapak görselini hazırla",
  "Çerez bandı ve KVKK aydınlatma metni ekle",
  "Sayfaları hızlandır: görselleri küçült, tembel yükle",
  "Erişilebilirliği düzelt: alt metinler, etiketler, kontrast",
  "404 sayfası ve site haritası ekle",
] };

export const HAZIR_ISTEKLER: Record<ProjeTur, IstekKategori[]> = {
  site: [
    { id: "tasarim", ad: "Tasarım", istekler: ["Renkleri daha sıcak yap", "Başlıkları serif bir yazı tipine çevir", "Kahraman bölümünü tam ekran görselle yeniden tasarla", "Karanlık mod ekle", "Kartlara hafif hareket ve geçiş ekle", "Mobilde menüyü alttan açılan çekmeceye çevir"] },
    { id: "icerik", ad: "İçerik", istekler: ["İletişim sayfası ekle", "Sık sorulan sorular bölümü ekle", "Müşteri yorumları bölümü ekle", "Hakkımızda sayfasını hikâyeyle yeniden yaz", "Ekip tanıtım bölümü ekle", "Blog sayfası ve ilk üç yazıyı ekle"] },
    { id: "ozellik", ad: "Özellik", istekler: ["İngilizce dil seçeneği ekle", "Randevu formu ekle ve gelen kutusuna bağla", "Bülten kayıt kutusu ekle", "Haritada konum ve yol tarifi ekle", "WhatsApp ile yaz düğmesi ekle", "Ürünlere sepet ve ödeme ekle"] },
    ORTAK_BUYUME,
  ],
  uygulama: [
    { id: "tasarim", ad: "Tasarım", istekler: ["Karanlık mod ekle", "Kenar çubuğunu daraltılabilir yap", "Boş durum ekranlarını görselle güzelleştir", "Tabloları mobilde karta dönüştür", "Yükleme iskeletleri ekle"] },
    { id: "ozellik", ad: "Özellik", istekler: ["Üye girişi ve kayıt ekle", "Verileri CSV olarak dışa aktarma ekle", "Grafiklere tarih süzgeci ekle", "Arama ve sıralama ekle", "Bildirim merkezi ekle", "Rol ve yetki ekle: yönetici ve üye"] },
    { id: "veri", ad: "Veri", istekler: ["Verileri veritabanına taşı", "Gerçekçi deneme verisi ekle", "Kayıt silmeyi geri alınabilir yap", "Her değişikliği zaman damgasıyla kaydet"] },
    ORTAK_BUYUME,
  ],
  oyun: [
    { id: "oynanis", ad: "Oynanış", istekler: ["Oyunu zorlaştır", "Bölüm sistemi ekle", "Güçlendiriciler ekle", "Boss savaşı ekle", "Günlük görev ekle"] },
    { id: "his", ad: "His", istekler: ["Ses efektleri ve müzik ekle", "Ekran sarsıntısı ve parçacık efekti ekle", "Ana menü ve duraklatma ekranı ekle", "Piksel sanat görünümüne çevir"] },
    { id: "kontrol", ad: "Kontrol ve skor", istekler: ["Mobil dokunmatik kontrol ekle", "Oyun kolu desteği ekle", "Çevrimiçi skor tablosu ekle", "Başarımlar ve rozetler ekle"] },
  ],
  mobil: [
    { id: "ekran", ad: "Ekranlar", istekler: ["Hatırlatma ekranı ekle", "Profil ve ayarlar ekranı ekle", "İlk açılışta tanıtım ekranları ekle", "İstatistik ekranına grafik ekle"] },
    { id: "his", ad: "Görünüm", istekler: ["Karanlık mod ekle", "Alt sekme çubuğunu yenile", "Kaydırarak silme hareketi ekle", "Dokununca titreşim ve geçiş ekle"] },
    { id: "yayin", ad: "Mağaza", istekler: ["Uygulamayı mağaza yayınına hazırla", "Uygulama simgesi ve açılış ekranı üret", "Çevrimdışı çalışmayı ekle", "Gizlilik politikası sayfası ekle"] },
  ],
};
