import type { Prosedur } from "./ajanProsedurTip";

/**
 * Hazır prosedürler: düzenleyicide tek tıkla eklenir, hazır ajanlarda da kullanılır. Adresler ve araçlar sahibin
 * kendi sistemine göre değiştirilmek üzere yazılmıştır; HTTP adımlarında deneme yanıtı vardır (denemede çalışır,
 * canlıda gerçek adres gerekir).
 */
type Hazir = Omit<Prosedur, "guncelleme">;
const p = (x: Hazir): Hazir => x;

export const PROSEDUR_HAZIR: Hazir[] = [
  p({
    id: "iade", ad: "İade talebi", ne: "Ziyaretçi bir ürünü iade etmek, değiştirmek ya da parasını geri almak istediğinde", anahtarlar: ["iade etmek istiyorum", "iade talebi", "ürünü geri göndermek"], acik: true, iptal: true, gecis: true,
    adimlar: [
      { id: "a1", tur: "mesaj", metin: "İade talebini hemen oluşturalım. Birkaç bilgiye ihtiyacım var." },
      { id: "a2", tur: "topla", alanlar: [
        { ad: "siparis_no", etiket: "Sipariş numarası", soru: "Sipariş numaran nedir? Sipariş onay e-postasında yazar.", tur: "siparis", zorunlu: true },
        { ad: "eposta", etiket: "E-posta", soru: "Siparişte kullandığın e-posta adresi?", tur: "eposta", zorunlu: true },
        { ad: "neden", etiket: "İade nedeni", soru: "İade nedenin hangisi?", tur: "secim", secenekler: ["Beden ya da ölçü uymadı", "Ürün hasarlı geldi", "Yanlış ürün geldi", "Fikrimi değiştirdim", "Diğer"], zorunlu: true },
      ] },
      { id: "a3", tur: "istek", baslik: "Siparişi sorgula", yontem: "POST", url: "https://api.magazan.com/iade/kontrol", govde: "{\"siparis\": \"{{siparis_no}}\", \"eposta\": \"{{eposta}}\"}", basliklar: [], kaydet: "siparis", hataGit: "a8", deneme: "{\"bulundu\": true, \"gun\": 6, \"tutar\": 749.9, \"urun\": \"Koşu ayakkabısı\"}" },
      { id: "a4", tur: "kosul", baslik: "İade süresi", dallar: [{ kosullar: [{ degisken: "siparis.bulundu", op: "esitDegil", deger: "true" }], hepsi: true, git: "a8" }, { kosullar: [{ degisken: "siparis.gun", op: "buyuk", deger: "14" }], hepsi: true, git: "a9" }], aksi: "a5" },
      { id: "a5", tur: "onay", kim: "ziyaretci", metin: "{{siparis.urun}} için {{siparis.tutar}} TL iade talebi oluşturuyorum (neden: {{neden}}). Onaylıyor musun?", evet: "a6", hayir: "son" },
      { id: "a6", tur: "istek", baslik: "İade kaydı aç", yontem: "POST", url: "https://api.magazan.com/iade", govde: "{\"siparis\": \"{{siparis_no}}\", \"neden\": \"{{neden}}\"}", basliklar: [], kaydet: "iade", hataGit: "a8", deneme: "{\"iadeKodu\": \"IA-48213\", \"kargoKodu\": \"7720419\"}" },
      { id: "a7", tur: "bitir", sonuc: "cozuldu", metin: "İade talebin oluşturuldu. İade kodun {{iade.iadeKodu}}. Ürünü 7 gün içinde anlaşmalı kargoya {{iade.kargoKodu}} kargo koduyla ücretsiz teslim edebilirsin; ürün depoya ulaşınca ödemen 3 iş günü içinde kartına iade edilir." },
      { id: "a8", tur: "devret", neden: "İade için sipariş doğrulanamadı: {{siparis_no}}", metin: "Siparişini sistemde doğrulayamadım; seni hemen bir temsilciye aktarıyorum." },
      { id: "a9", tur: "devret", neden: "14 günlük iade süresi geçmiş ({{siparis.gun}} gün), istisna değerlendirmesi", metin: "Siparişin 14 günlük iade süresini geçmiş görünüyor. Durumunu bir temsilcinin değerlendirmesi için aktarıyorum." },
    ],
  }),
  p({
    id: "kargo", ad: "Kargo takibi", ne: "Ziyaretçi siparişinin ya da kargosunun nerede olduğunu sorduğunda", anahtarlar: ["kargom nerede", "siparişim nerede", "kargo takip"], acik: true, iptal: true, gecis: true,
    adimlar: [
      { id: "k1", tur: "topla", alanlar: [{ ad: "siparis_no", etiket: "Sipariş numarası", soru: "Kontrol edebilmem için sipariş numaranı yazar mısın?", tur: "siparis", zorunlu: true }] },
      { id: "k2", tur: "istek", baslik: "Kargo durumu", yontem: "GET", url: "https://api.magazan.com/kargo/{{siparis_no}}", govde: "", basliklar: [], kaydet: "kargo", hataGit: "k5", deneme: "{\"durum\": \"Dağıtımda\", \"firma\": \"Yurtiçi Kargo\", \"takip\": \"YK123456789\", \"tahmini\": \"bugün 18.00'e kadar\"}" },
      { id: "k3", tur: "kosul", dallar: [{ kosullar: [{ degisken: "kargo.durum", op: "bos", deger: "" }], hepsi: true, git: "k5" }], aksi: "k4" },
      { id: "k4", tur: "bitir", sonuc: "cozuldu", metin: "Siparişin {{kargo.firma}} ile yolda, şu an: {{kargo.durum}}. Tahmini teslim {{kargo.tahmini}}. Takip numaran {{kargo.takip}}." },
      { id: "k5", tur: "devret", neden: "Kargo bilgisi bulunamadı: {{siparis_no}}", metin: "Bu siparişin kargo bilgisine ulaşamadım; bir temsilci hemen bakacak." },
    ],
  }),
  p({
    id: "randevu", ad: "Randevu alma", ne: "Ziyaretçi randevu almak, saat ayırtmak ya da muayene planlamak istediğinde", anahtarlar: ["randevu almak", "randevu istiyorum"], acik: true, iptal: true, gecis: true,
    adimlar: [
      { id: "r1", tur: "topla", alanlar: [
        { ad: "hizmet", etiket: "Hizmet", soru: "Hangi hizmet için randevu istiyorsun?", tur: "secim", secenekler: ["Muayene", "Kontrol", "Diş temizliği", "Danışma"], zorunlu: true },
        { ad: "tarih", etiket: "Tarih", soru: "Hangi gün uygun? (yarın, cuma ya da 12.11.2026 gibi)", tur: "tarih", zorunlu: true },
        { ad: "ad_soyad", etiket: "Ad soyad", soru: "Randevu kimin adına?", tur: "metin", zorunlu: true },
        { ad: "telefon", etiket: "Telefon", soru: "Sana ulaşabileceğimiz telefon numarası?", tur: "telefon", zorunlu: true },
      ] },
      { id: "r2", tur: "onay", kim: "ziyaretci", metin: "{{tarih}} için {{hizmet}} randevusu, {{ad_soyad}} adına ({{telefon}}). Talep oluşturayım mı?", evet: "r3", hayir: "son" },
      { id: "r3", tur: "onay", kim: "temsilci", metin: "Talebini sekreterliğe ilettim; saat onaylanınca buradan yazacağım.", evet: "r4", hayir: "r5" },
      { id: "r4", tur: "bitir", sonuc: "cozuldu", metin: "Randevun onaylandı: {{tarih}}, {{hizmet}}. {{onay_notu}} Görüşmek üzere!" },
      { id: "r5", tur: "bitir", sonuc: "cozuldu", metin: "Bu gün için uygun saat bulamadık. {{onay_notu}} Başka bir gün denemek istersen yazman yeterli." },
    ],
  }),
  p({
    id: "adres", ad: "Teslimat adresi değişikliği", ne: "Ziyaretçi verdiği siparişin teslimat adresini değiştirmek istediğinde", anahtarlar: ["adresimi değiştirmek", "adres değişikliği"], acik: true, iptal: true, gecis: true,
    adimlar: [
      { id: "d1", tur: "topla", alanlar: [
        { ad: "siparis_no", etiket: "Sipariş numarası", soru: "Hangi sipariş için adres değişecek? Sipariş numarasını yazar mısın?", tur: "siparis", zorunlu: true },
        { ad: "eposta", etiket: "E-posta", soru: "Siparişteki e-posta adresin?", tur: "eposta", zorunlu: true },
      ] },
      { id: "d2", tur: "dogrula", degisken: "eposta", kanal: "eposta", evet: "d3", hayir: "d6" },
      { id: "d3", tur: "topla", alanlar: [{ ad: "yeni_adres", etiket: "Yeni adres", soru: "Yeni teslimat adresini mahalle, sokak, numara, ilçe ve il ile yaz.", tur: "metin", zorunlu: true }] },
      { id: "d4", tur: "istek", baslik: "Adresi güncelle", yontem: "PATCH", url: "https://api.magazan.com/siparis/{{siparis_no}}/adres", govde: "{\"adres\": \"{{yeni_adres}}\"}", basliklar: [], kaydet: "sonuc", hataGit: "d6", deneme: "{\"tamam\": true}" },
      { id: "d5", tur: "bitir", sonuc: "cozuldu", metin: "Adres güncellendi; siparişin {{yeni_adres}} adresine gönderilecek." },
      { id: "d6", tur: "devret", neden: "Adres değişikliği yapılamadı (kimlik ya da kargo durumu)", metin: "Bu değişikliği otomatik yapamadım; bir temsilci hemen yardımcı olacak." },
    ],
  }),
  p({
    id: "iptal", ad: "Sipariş iptali", ne: "Ziyaretçi henüz kargoya verilmemiş bir siparişi iptal etmek istediğinde", anahtarlar: ["siparişimi iptal", "sipariş iptali"], acik: true, iptal: false, gecis: true,
    adimlar: [
      { id: "i1", tur: "topla", alanlar: [{ ad: "siparis_no", etiket: "Sipariş numarası", soru: "İptal etmek istediğin siparişin numarası?", tur: "siparis", zorunlu: true }] },
      { id: "i2", tur: "istek", baslik: "Sipariş durumu", yontem: "GET", url: "https://api.magazan.com/siparis/{{siparis_no}}", govde: "", basliklar: [], kaydet: "siparis", hataGit: "i6", deneme: "{\"asama\": \"hazirlaniyor\", \"tutar\": 1299}" },
      { id: "i3", tur: "kosul", dallar: [{ kosullar: [{ degisken: "siparis.asama", op: "esit", deger: "kargoda" }], hepsi: true, git: "i7" }], aksi: "i4" },
      { id: "i4", tur: "onay", kim: "ziyaretci", metin: "{{siparis.tutar}} TL tutarındaki {{siparis_no}} numaralı siparişi iptal ediyorum. Emin misin?", evet: "i5", hayir: "son" },
      { id: "i5", tur: "bitir", sonuc: "cozuldu", metin: "Siparişin iptal edildi; ödemen 3 ile 7 iş günü içinde kartına iade edilir." },
      { id: "i6", tur: "devret", neden: "Sipariş bulunamadı", metin: "Bu siparişi bulamadım; seni bir temsilciye aktarıyorum." },
      { id: "i7", tur: "bitir", sonuc: "serbest", metin: "Siparişin kargoya verilmiş, artık iptal edilemiyor. Teslim aldıktan sonra iade talebi oluşturabilirsin." },
    ],
  }),
];
/** Hazır prosedürden yeni kimlikle kopya. */
export function hazirKopya(id: string): Prosedur | null {
  const h = PROSEDUR_HAZIR.find((x) => x.id === id);
  return h ? { ...JSON.parse(JSON.stringify(h)), id: `${h.id}${Math.random().toString(36).slice(2, 6)}`, guncelleme: Date.now() } : null;
}
