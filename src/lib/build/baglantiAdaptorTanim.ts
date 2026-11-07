/**
 * Vayra adaptörleri: resmî uzak MCP sunucusu olmayan Türk servisleri (iyzico, Paraşüt, Trendyol, NetGSM, PayTR).
 * Araçlar Vayra sunucusunda çalışır, servisin resmî REST API'sini kullanıcının kendi anahtarlarıyla çağırır ve
 * MCP bağlantılarıyla aynı araç arayüzünden sunulur. Bu dosya istemci ve sunucu ortaktır (tanımlar); çağrılar
 * baglantiAdaptor.ts içindedir. Yazma araçları varsayılan olarak "sor" iznindedir.
 */
export type AdaptorId = "iyzico" | "parasut" | "trendyol" | "netgsm" | "paytr";

/** Kimlik alanı (kasada şifreli saklanır). gizli: arayüzde maskelenir. */
export type AdaptorAlan = { id: string; ad: string; gizli?: boolean; ipucu?: string; ornek?: string; desen?: string; secenekler?: { id: string; ad: string }[]; varsayilan?: string; istege?: boolean };
export type AdaptorArac = {
  name: string; title: string; description: string; okuma: boolean; yikici?: boolean;
  inputSchema: { type: "object"; properties: Record<string, unknown>; required?: string[] };
};
export type AdaptorTanim = { id: AdaptorId; alanlar: AdaptorAlan[]; araclar: AdaptorArac[]; oauth?: { yetkiUrl: string; tokenUrl: string; kapsam?: string } };

const s = (description: string, ek: Record<string, unknown> = {}) => ({ type: "string", description, ...ek });
const n = (description: string, ek: Record<string, unknown> = {}) => ({ type: "integer", description, ...ek });
const o = (properties: Record<string, unknown>, required: string[] = []) => ({ type: "object" as const, properties, ...(required.length ? { required } : {}) });

export const ADAPTORLER: Record<AdaptorId, AdaptorTanim> = {
  iyzico: {
    id: "iyzico",
    alanlar: [
      { id: "ortam", ad: "Ortam", secenekler: [{ id: "sandbox", ad: "Test (sandbox)" }, { id: "canli", ad: "Canlı" }], varsayilan: "sandbox", ipucu: "Test anahtarları sandbox- ile başlar" },
      { id: "api_key", ad: "API anahtarı", gizli: true, ipucu: "iyzico Merchant Panel › Ayarlar › Firma Ayarları › API Anahtarları" },
      { id: "secret_key", ad: "Gizli anahtar", gizli: true },
    ],
    araclar: [
      { name: "odeme_sorgula", title: "Ödemeyi sorgula", okuma: true, description: "Bir ödemenin ayrıntısını getirir (tutar, durum, taksit, kart bilgisinin maskeli hâli). paymentId ya da ödemeyi başlatırken verilen conversationId ile.", inputSchema: o({ odeme_id: s("iyzico paymentId"), siparis_id: s("Ödeme başlatılırken verilen paymentConversationId (odeme_id yoksa)") }) },
      { name: "gunluk_islemler", title: "Günlük işlemler", okuma: true, description: "Seçilen gündeki ödeme ve iade işlemlerini sayfa sayfa listeler (iyzico raporlama v2).", inputSchema: o({ tarih: s("YYYY-AA-GG biçiminde gün", { pattern: "^\\d{4}-\\d{2}-\\d{2}$" }), sayfa: n("1'den başlar", { minimum: 1 }) }, ["tarih"]) },
      { name: "taksit_sorgula", title: "Taksit seçenekleri", okuma: true, description: "Bir tutar için bankaların taksit seçeneklerini ve toplam tutarları getirir; kart BIN'i verilirse yalnız o kartın seçenekleri.", inputSchema: o({ tutar: s("Tutar, ör. 1250.90"), bin: s("Kartın ilk 6 ya da 8 hanesi", { pattern: "^\\d{6,8}$" }) }, ["tutar"]) },
      { name: "bin_sorgula", title: "Kart BIN sorgula", okuma: true, description: "Kartın ilk 6-8 hanesinden banka, kart türü ve kart ailesini bulur.", inputSchema: o({ bin: s("Kartın ilk 6 ya da 8 hanesi", { pattern: "^\\d{6,8}$" }) }, ["bin"]) },
      { name: "odeme_baglantilari", title: "Ödeme bağlantıları", okuma: true, description: "iyzico Link ile oluşturulmuş ödeme bağlantılarını listeler.", inputSchema: o({ sayfa: n("1'den başlar", { minimum: 1 }), adet: n("Sayfa başına kayıt", { minimum: 1, maximum: 100 }) }) },
      { name: "odeme_baglantisi_olustur", title: "Ödeme bağlantısı oluştur", okuma: false, description: "iyzico Link ile paylaşılabilir bir ödeme bağlantısı oluşturur. Ürün görseli zorunludur (https adresi).", inputSchema: o({ ad: s("Ürün ya da hizmet adı"), aciklama: s("Kısa açıklama"), tutar: s("Tutar, ör. 499.90"), para_birimi: s("TRY, USD, EUR", { enum: ["TRY", "USD", "EUR", "GBP"] }), gorsel_url: s("Ürün görselinin https adresi (jpg ya da png)"), taksit: { type: "boolean", description: "Taksit seçilebilsin mi" } }, ["ad", "aciklama", "tutar", "gorsel_url"]) },
    ],
  },
  parasut: {
    id: "parasut",
    oauth: { yetkiUrl: "https://id.parasut.com/realms/parasut/protocol/openid-connect/auth", tokenUrl: "https://id.parasut.com/realms/parasut/protocol/openid-connect/token" },
    alanlar: [
      { id: "firma_no", ad: "Firma numarası", desen: "^\\d{1,12}$", ornek: "123456", ipucu: "Paraşüt adres çubuğunda uygulama.parasut.com/<firma numarası> olarak görünür" },
    ],
    araclar: [
      { name: "kisileri_listele", title: "Müşteri ve tedarikçiler", okuma: true, description: "Müşteri ve tedarikçi kayıtlarını listeler; ada, e-postaya, vergi numarasına ya da türe göre süzer.", inputSchema: o({ ad: s("Adda geçen metin"), eposta: s("E-posta"), vergi_no: s("Vergi numarası"), tur: s("customer: müşteri, supplier: tedarikçi", { enum: ["customer", "supplier"] }), sayfa: n("1'den başlar", { minimum: 1 }) }) },
      { name: "kisi_getir", title: "Kişi ayrıntısı", okuma: true, description: "Bir müşteri ya da tedarikçinin bakiyesi ve iletişim bilgileriyle ayrıntısı.", inputSchema: o({ id: s("Paraşüt kişi kimliği") }, ["id"]) },
      { name: "satis_faturalari", title: "Satış faturaları", okuma: true, description: "Satış faturalarını listeler; müşteriye, ödeme durumuna ve türe göre süzer, en yeniden eskiye sıralar.", inputSchema: o({ musteri_id: s("Kişi kimliği"), odeme_durumu: s("overdue: gecikmiş, not_due: vadesi gelmemiş, unscheduled: vadesiz, paid: ödenmiş", { enum: ["overdue", "not_due", "unscheduled", "paid"] }), tur: s("invoice, refund, estimate, export", { enum: ["invoice", "refund", "estimate", "export"] }), sayfa: n("1'den başlar", { minimum: 1 }) }) },
      { name: "fatura_getir", title: "Fatura ayrıntısı", okuma: true, description: "Bir satış faturasını satırları ve müşterisiyle getirir.", inputSchema: o({ id: s("Fatura kimliği") }, ["id"]) },
      { name: "urunleri_listele", title: "Ürünler", okuma: true, description: "Ürün ve hizmetleri listeler; ada ya da koda göre süzer.", inputSchema: o({ ad: s("Adda geçen metin"), kod: s("Ürün kodu"), sayfa: n("1'den başlar", { minimum: 1 }) }) },
      { name: "hesaplari_listele", title: "Kasa ve banka hesapları", okuma: true, description: "Kasa ve banka hesaplarını bakiyeleriyle listeler.", inputSchema: o({ tur: s("cash: kasa, bank: banka", { enum: ["cash", "bank"] }) }) },
      { name: "kisi_olustur", title: "Müşteri ya da tedarikçi ekle", okuma: false, description: "Paraşüt'e yeni müşteri ya da tedarikçi kaydı ekler.", inputSchema: o({ ad: s("Ad ya da unvan"), tur: s("customer: müşteri, supplier: tedarikçi", { enum: ["customer", "supplier"] }), kisi_turu: s("person: şahıs, company: şirket", { enum: ["person", "company"] }), eposta: s("E-posta"), telefon: s("Telefon"), vergi_no: s("Vergi ya da TC kimlik numarası"), vergi_dairesi: s("Vergi dairesi"), sehir: s("Şehir"), ilce: s("İlçe"), adres: s("Adres") }, ["ad", "tur"]) },
    ],
  },
  trendyol: {
    id: "trendyol",
    alanlar: [
      { id: "satici_id", ad: "Satıcı ID", desen: "^\\d{1,12}$", ornek: "123456", ipucu: "Trendyol Satıcı Paneli › Hesap Bilgilerim › Entegrasyon Bilgileri" },
      { id: "api_key", ad: "API Key", gizli: true },
      { id: "api_secret", ad: "API Secret", gizli: true },
      { id: "ortam", ad: "Ortam", secenekler: [{ id: "canli", ad: "Canlı" }, { id: "test", ad: "Test (stage, IP izni ister)" }], varsayilan: "canli" },
    ],
    araclar: [
      { name: "siparisler", title: "Siparişler", okuma: true, description: "Sipariş paketlerini listeler; duruma ve tarih aralığına göre süzer (en çok 200 kayıt/sayfa).", inputSchema: o({ durum: s("Sipariş durumu", { enum: ["Created", "Picking", "Invoiced", "Shipped", "Cancelled", "Delivered", "UnDelivered", "Returned", "AtCollectionPoint", "UnSupplied", "Awaiting"] }), baslangic: s("Başlangıç tarihi YYYY-AA-GG"), bitis: s("Bitiş tarihi YYYY-AA-GG"), siparis_no: s("Sipariş numarası"), sayfa: n("0'dan başlar", { minimum: 0 }), boyut: n("Sayfa boyutu", { minimum: 1, maximum: 200 }) }) },
      { name: "urunler", title: "Onaylı ürünler", okuma: true, description: "Onaylı ürünleri stok, fiyat ve satış durumuyla listeler; barkoda ya da stok koduna göre süzer.", inputSchema: o({ barkod: s("Barkod"), stok_kodu: s("Stok kodu"), durum: s("onSale: satışta, archived, locked, blacklisted", { enum: ["onSale", "archived", "locked", "blacklisted"] }), sayfa: n("0'dan başlar", { minimum: 0 }), boyut: n("Sayfa boyutu", { minimum: 1, maximum: 100 }) }) },
      { name: "musteri_sorulari", title: "Müşteri soruları", okuma: true, description: "Ürünlere gelen müşteri sorularını listeler (varsayılan: yanıt bekleyenler).", inputSchema: o({ durum: s("Soru durumu", { enum: ["WAITING_FOR_ANSWER", "ANSWERED", "REJECTED", "REPORTED"] }), barkod: s("Barkod"), sayfa: n("0'dan başlar", { minimum: 0 }), boyut: n("Sayfa boyutu", { minimum: 1, maximum: 200 }) }) },
      { name: "toplu_islem_sonucu", title: "Toplu işlem sonucu", okuma: true, description: "Fiyat ve stok güncellemesinin (batchRequestId) sonucunu ürün ürün getirir; sonuçlar 4 saat saklanır.", inputSchema: o({ islem_id: s("batchRequestId") }, ["islem_id"]) },
      { name: "fiyat_stok_guncelle", title: "Fiyat ve stok güncelle", okuma: false, description: "Barkoda göre satış fiyatı, liste fiyatı ve stok adedini günceller (en çok 1000 ürün). Sonuç için toplu_islem_sonucu aracını kullan.", inputSchema: o({ urunler: { type: "array", maxItems: 1000, items: o({ barkod: s("Barkod"), stok: n("Stok adedi", { minimum: 0, maximum: 20000 }), satis_fiyati: { type: "number", description: "İndirimli satış fiyatı" }, liste_fiyati: { type: "number", description: "Liste fiyatı" } }, ["barkod"]) } }, ["urunler"]) },
      { name: "soru_yanitla", title: "Soruyu yanıtla", okuma: false, description: "Bir müşteri sorusuna mağaza adına yanıt yazar (10-2000 karakter).", inputSchema: o({ soru_id: s("Soru kimliği"), yanit: s("Yanıt metni", { minLength: 10, maxLength: 2000 }) }, ["soru_id", "yanit"]) },
    ],
  },
  netgsm: {
    id: "netgsm",
    alanlar: [
      { id: "kullanici", ad: "Kullanıcı adı", desen: "^\\d{8,12}$", ornek: "850xxxxxxx", ipucu: "Abone numaran (850...). Şifre, Netgsm panelinde oluşturduğun API kullanıcısının şifresidir." },
      { id: "sifre", ad: "API kullanıcısı şifresi", gizli: true },
      { id: "baslik", ad: "Varsayılan gönderici başlığı", istege: true, ornek: "FIRMAADI", ipucu: "Netgsm'de onaylı başlık; boşsa gönderirken seçilir" },
    ],
    araclar: [
      { name: "gonderici_basliklari", title: "Gönderici başlıkları", okuma: true, description: "Hesaptaki onaylı SMS gönderici başlıklarını listeler.", inputSchema: o({}) },
      { name: "bakiye", title: "Bakiye", okuma: true, description: "Kalan SMS paketi ve kredi bakiyesini getirir.", inputSchema: o({}) },
      { name: "gonderim_raporu", title: "Gönderim raporu", okuma: true, description: "Gönderilen SMS'lerin iletim durumunu görev kimliğine (jobid) ya da tarih aralığına göre getirir.", inputSchema: o({ gorev_idleri: { type: "array", items: { type: "string" }, maxItems: 50, description: "jobid listesi" }, baslangic: s("GG.AA.YYYY SS:dd:ss"), bitis: s("GG.AA.YYYY SS:dd:ss") }) },
      { name: "gelen_kutusu", title: "Gelen SMS'ler", okuma: true, description: "Hesaba gelen SMS'leri tarih aralığıyla getirir (en çok 30 gün).", inputSchema: o({ baslangic: s("GGAAYYYYSSdd, ör. 010420260000"), bitis: s("GGAAYYYYSSdd") }) },
      { name: "sms_gonder", title: "SMS gönder", okuma: false, description: "Bir ya da daha çok numaraya SMS gönderir. Ticari iletiler için İYS türünü doğru seç (11 bireysel, 12 tacir).", inputSchema: o({ mesaj: s("Mesaj metni", { maxLength: 900 }), numaralar: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 100, description: "5xxxxxxxxx biçiminde numaralar" }, baslik: s("Gönderici başlığı (boşsa varsayılan)"), iys: s("0: bilgilendirme, 11: bireysel ticari, 12: tacir ticari", { enum: ["0", "11", "12"] }) }, ["mesaj", "numaralar"]) },
    ],
  },
  paytr: {
    id: "paytr",
    alanlar: [
      { id: "merchant_id", ad: "Mağaza no (merchant_id)", desen: "^\\d{1,12}$", ipucu: "PayTR Mağaza Paneli › Destek ve Kurulum › Entegrasyon Bilgileri" },
      { id: "merchant_key", ad: "Mağaza parolası (merchant_key)", gizli: true },
      { id: "merchant_salt", ad: "Mağaza gizli anahtarı (merchant_salt)", gizli: true },
    ],
    araclar: [
      { name: "odeme_durumu", title: "Ödeme durumu", okuma: true, description: "Sipariş numarasıyla (merchant_oid) ödemenin durumunu, tutarını, taksidini ve iadelerini getirir.", inputSchema: o({ siparis_no: s("merchant_oid") }, ["siparis_no"]) },
      { name: "islem_dokumu", title: "İşlem dökümü", okuma: true, description: "Tarih aralığındaki satış ve iade işlemlerini listeler (en çok 3 gün).", inputSchema: o({ baslangic: s("YYYY-AA-GG SS:dd:ss"), bitis: s("YYYY-AA-GG SS:dd:ss") }, ["baslangic", "bitis"]) },
      { name: "taksit_oranlari", title: "Taksit oranları", okuma: true, description: "Mağazanın kart ailelerine göre taksit oranlarını getirir.", inputSchema: o({}) },
      { name: "bin_sorgula", title: "Kart BIN sorgula", okuma: true, description: "Kartın ilk 6-8 hanesinden banka, kart türü ve taksit ailesini bulur.", inputSchema: o({ bin: s("Kartın ilk 6 ya da 8 hanesi", { pattern: "^\\d{6,8}$" }) }, ["bin"]) },
      { name: "odeme_linki_olustur", title: "Ödeme linki oluştur", okuma: false, description: "PayTR Link API ile ürün ya da tahsilat ödeme linki oluşturur.", inputSchema: o({ ad: s("Ürün ya da tahsilat adı (4-200 karakter)"), tutar: { type: "number", description: "Tutar, ör. 14.45" }, para_birimi: s("TL, USD, EUR", { enum: ["TL", "USD", "EUR", "GBP"] }), tur: s("product: ürün (adetli), collection: tahsilat (e-postaya)", { enum: ["product", "collection"] }), en_az_adet: n("Ürün linkinde en az adet", { minimum: 1 }), eposta: s("Tahsilat linkinde müşteri e-postası"), en_cok_taksit: n("1-12", { minimum: 1, maximum: 12 }), son_tarih: s("YYYY-AA-GG SS:dd:ss (isteğe bağlı)") }, ["ad", "tutar", "tur"]) },
      { name: "odeme_linki_sil", title: "Ödeme linkini sil", okuma: false, yikici: true, description: "Daha önce oluşturulan ödeme linkini siler.", inputSchema: o({ link_id: s("Link kimliği, ör. NB2Zlz3") }, ["link_id"]) },
    ],
  },
};

/** Adaptör araçları MCP araç biçiminde (okuma/yazma ipuçlarıyla). */
export const adaptorAraclari = (id: AdaptorId) => ADAPTORLER[id].araclar.map((a) => ({
  name: a.name, title: a.title, description: a.description, inputSchema: a.inputSchema,
  annotations: { title: a.title, readOnlyHint: a.okuma, destructiveHint: a.yikici ?? false, openWorldHint: true },
}));
