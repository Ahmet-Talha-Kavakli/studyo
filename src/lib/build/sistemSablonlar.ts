/**
 * Hazır sistemler kütüphanesi (istemci ve sunucu ortak): sistemKatalog'daki ilk şablonlara ek olarak işe ve sektöre göre
 * kurulabilir sistemler. Her şablon gerçek adımlardan kurulur; dış servis adımları Uygulama eylemi (resmî API) ya da HTTP
 * isteğidir ve gereken sırlar kurulum listesinde yazar. Kimlikler şablon içinde sabittir (s1, s2…); kurulurken yenilenir.
 */
import { servisOlayBul } from "./sistemTetikKatalog";
import { SISTEM_SABLONLARI, VARSAYILAN_AYAR, type Adim, type AdimTuru, type CiktiAlani, type GirdiAlani, type KimliksizTetik, type Kosul, type SablonKategori, type SistemSablon } from "./sistemKatalog";

const yap = (id: string, ad: string, tur: AdimTuru, ayar: Record<string, unknown>, ek: Partial<Adim> = {}): Adim => ({ id, ad, tur, ayar, hata: "durdur", ...ek });
const TEKRAR = { sayi: 2, bekleme: 5, artan: true };
const ajan = (id: string, ad: string, istem: string, alanlar?: [string, CiktiAlani["tur"], string?][]) => yap(id, ad, "ajan", { istem }, alanlar ? { alanlar: alanlar.map(([x, tur, aciklama]) => ({ ad: x, tur, ...(aciklama ? { aciklama } : {}) })) } : {});
const uyg = (id: string, ad: string, servis: string, eylem: string, f: Record<string, string>) => yap(id, ad, "uygulama", { servis, eylem, ...f }, { tekrar: TEKRAR });
const kayit = (id: string, ad: string, koleksiyon: string, alanlar: string, ek: Record<string, unknown> = {}) => yap(id, ad, "veri", { projeId: "", koleksiyon, alanlar, islem: "ekle", ...ek });
const bul = (id: string, ad: string, koleksiyon: string, kosullar: Kosul[] = [], ek: Record<string, unknown> = {}) => yap(id, ad, "veri", { projeId: "", koleksiyon, islem: "bul", sinir: 100, ...ek }, kosullar.length ? { kosullar } : {});
const guncelle = (id: string, ad: string, koleksiyon: string, kayitId: string, alanlar: string) => yap(id, ad, "veri", { projeId: "", koleksiyon, islem: "guncelle", hedef: "kimlik", kayitId, alanlar });
const upsert = (id: string, ad: string, koleksiyon: string, eslesme: string, alanlar: string) => yap(id, ad, "veri", { projeId: "", koleksiyon, islem: "upsert", eslesme, alanlar });
const suz = (id: string, ad: string, kosullar: Kosul[], baglac: "ve" | "veya" = "ve") => yap(id, ad, "kosul", {}, { kosullar, baglac });
const k = (sol: string, islec: string, sag = ""): Kosul => ({ sol, islec, sag });
const yanit = (id: string, icerik: string, bicim: "metin" | "json" = "metin") => yap(id, "Yanıt ver", "yanit", { icerik, bicim, durum: 200 });
const depo = (id: string, ad: string, islem: string, anahtar: string, ek: Record<string, unknown> = {}) => yap(id, ad, "depo", { islem, anahtar, kapsam: "sistem", deger: "", miktar: 1, sure: 0, gorulduyse: "dur", ...ek });
const don = (id: string, ad: string, grup: string, islem: string, deger: string, p1 = "", p2 = "") => yap(id, ad, "donustur", { grup, islem, deger, p1, p2 });
const ayarla = (id: string, ad: string, satirlar: [string, string, string?][]) => yap(id, ad, "donustur", { grup: "json", islem: "ayarla", satirlar: JSON.stringify(satirlar.map(([x, deger, tur]) => ({ ad: x, deger, tur: tur ?? "otomatik" }))) });
const sinif = (id: string, ad: string, girdi: string, dallar: [string, string, Adim[]][], yedek: Adim[] = [], talimat = "") => yap(id, ad, "siniflandir", { girdi, talimat, esik: 50 }, { dallar: [...dallar.map(([x, aciklama, adimlar], i) => ({ id: `d${i + 1}`, ad: x, aciklama, adimlar })), { id: "yedek", ad: "Hiçbiri uymazsa", yedek: true, aciklama: "Yukarıdakilerden hiçbirine uymuyor", adimlar: yedek }] });
const yon = (id: string, ad: string, dallar: [string, Kosul[], Adim[]][], yedek: Adim[] = []) => yap(id, ad, "yonlendirici", { mod: "ilk" }, { dallar: [...dallar.map(([x, kosullar, adimlar], i) => ({ id: `d${i + 1}`, ad: x, kosullar, baglac: "ve" as const, adimlar })), { id: "yedek", ad: "Hiçbiri uymazsa", yedek: true, adimlar: yedek }] });
const onay = (id: string, ad: string, baslik: string, icerik: string, onayL: Adim[], retL: Adim[] = [], ek: Record<string, unknown> = {}) => yap(id, ad, "onay", { baslik, icerik, duzenlenebilir: true, zamanAsimiMiktar: 1, zamanAsimiBirim: "gun", varsayilan: "ret", ...ek }, { dallar: [{ id: "onay", ad: "Onaylanırsa", adimlar: onayL }, { id: "ret", ad: "Reddedilirse", adimlar: retL }] });
const dongu = (id: string, ad: string, liste: string, govde: Adim[], ek: Record<string, unknown> = {}) => yap(id, ad, "dongu", { liste, sinir: 100, topla: "liste", toplaDeger: "", ...ek }, { govde });
const paralel = (id: string, ad: string, dallar: [string, Adim[]][]) => yap(id, ad, "paralel", { birlestir: "nesne" }, { dallar: dallar.map(([x, adimlar], i) => ({ id: `p${i + 1}`, ad: x, adimlar })) });
const bekle = (id: string, ad: string, miktar: number, birim: string) => yap(id, ad, "bekle", { mod: "sure", miktar, birim });
const http = (id: string, ad: string, yontem: string, url: string, ek: Record<string, unknown> = {}) => yap(id, ad, "http", { yontem, url, basliklar: "", govde: "", ...ek }, { tekrar: TEKRAR });
const kod = (id: string, ad: string, kaynak: string) => yap(id, ad, "kod", { kod: kaynak });
const guv = (id: string, ad: string, metin: string, mod: "maskele" | "engelle" = "maskele", temiz: Adim[] = [], ihlal: Adim[] = []) => yap(id, ad, "guvenlik", { ...VARSAYILAN_AYAR.guvenlik, metin, mod, ihlalSonrasi: mod === "engelle" ? "dur" : "devam" }, { dallar: [{ id: "temiz", ad: "Temizse", adimlar: temiz }, { id: "ihlal", ad: "İhlal varsa", adimlar: ihlal }] });
const arac = (id: string, ad: string, aracId: string, istem: string, oran = "1:1") => yap(id, ad, "arac", { arac: aracId, istem, oran }, { hata: "devam" });
const cagir = (id: string, ad: string, girdi: string) => yap(id, ad, "cagir", { sistemId: "", girdi, mod: "bekle", zamanAsimiMiktar: 1, zamanAsimiBirim: "gun" });

/* Tetikler */
const elle = (): KimliksizTetik => ({ tur: "elle" });
const elleForm = (): KimliksizTetik => ({ tur: "elle", form: true });
const kanca = (yanitMetni?: string): KimliksizTetik => ({ tur: "webhook", ...(yanitMetni ? { yanit: yanitMetni } : {}) });
const gunluk = (saat: string): KimliksizTetik => ({ tur: "zaman", zaman: { siklik: "gunluk", saat } });
const haftaici = (saat: string): KimliksizTetik => ({ tur: "zaman", zaman: { siklik: "haftalik", saat, gunler: [1, 2, 3, 4, 5] } });
const haftalik = (gun: number, saat: string): KimliksizTetik => ({ tur: "zaman", zaman: { siklik: "haftalik", saat, gunler: [gun] } });
const aylik = (gun: number, saat: string): KimliksizTetik => ({ tur: "zaman", zaman: { siklik: "aylik", saat, ayGunu: gun } });
const dakikada = (her: number): KimliksizTetik => ({ tur: "zaman", zaman: { siklik: "dakikalik", her } });
const saatlik = (): KimliksizTetik => ({ tur: "zaman", zaman: { siklik: "saatlik", saat: "00:00", her: 1 } });
const formS = (baslik: string, aciklama: string, ek: Partial<Extract<KimliksizTetik, { tur: "formSayfasi" }>> = {}): KimliksizTetik => ({ tur: "formSayfasi", baslik, aciklama, bitis: "mesaj", ...ek });
const sohbet = (baslik: string, karsilama: string, oneriler: string[], altBaslik = ""): KimliksizTetik => ({ tur: "sohbet", baslik, karsilama, oneriler, ...(altBaslik ? { altBaslik } : {}), gecmis: 10 });
const tablo = (koleksiyon: string, olaylar: ("ekle" | "guncelle" | "sil")[] = ["ekle"]): KimliksizTetik => ({ tur: "veri", projeId: "", koleksiyon, olaylar });
const odeme = (durumlar: ("odendi" | "iade" | "basarisiz")[] = ["odendi"]): KimliksizTetik => ({ tur: "odeme", projeId: "", durumlar });
const rss = (adres: string): KimliksizTetik => ({ tur: "rss", adres, aralik: 30 });
const eposta = (): KimliksizTetik => ({ tur: "eposta" });

/* Girdi alanları */
const g = (ad: string, etiket: string, tur: GirdiAlani["tur"] = "metin", ek: Partial<GirdiAlani> = {}): GirdiAlani => ({ ad, etiket, tur, ...ek });
const z = (ad: string, etiket: string, tur: GirdiAlani["tur"] = "metin", ek: Partial<GirdiAlani> = {}): GirdiAlani => g(ad, etiket, tur, { zorunlu: true, ...ek });

/* Kurulum cümleleri */
const SIR = (servis: string, ...adlar: string[]) => `${servis} için ${adlar.join(", ")} ${adlar.length > 1 ? "sırlarını" : "sırrını"} Değişkenler ve sırlar panelinden ekle`;
const PROJE = "Kayıt adımlarında ve tetikte Build projeni seç";
const FORM = "Form sayfası tetiğindeki adresi müşterilerinle paylaş ya da sitene göm";
const SOHBET = "Sohbet tetiğindeki gömme kodunu sitene ekle";
const t = (id: string, kategori: SablonKategori, ad: string, aciklama: string, tetik: KimliksizTetik, adimlar: Adim[], kurulum: string[] = [], ek: Partial<SistemSablon> = {}): SistemSablon => ({ id, kategori, ad, aciklama, tetik, adimlar, kurulum, ...ek });

const EK: SistemSablon[] = [
  /* ───────── Satış ve e-ticaret ───────── */
  t("shopify-siparis-slack", "satis", "Shopify siparişini Slack'e bildir", "Shopify'da yeni sipariş oluşunca müşteri, tutar ve ürünlerle ekip kanalına kısa bir bildirim düşer.", kanca(), [
    don("s1", "Ürün adları", "liste", "alan", "{{tetik.line_items}}", "title"),
    uyg("s2", "Kanala bildir", "slack", "kanca", { metin: "Yeni sipariş {{tetik.name}}: {{tetik.total_price | tl}}\nMüşteri: {{tetik.customer.first_name}} {{tetik.customer.last_name}}\nÜrünler: {{adim.s1.sonuc | birlestir}}" }),
  ], ["Shopify yönetiminde Ayarlar, Bildirimler, Web kancaları bölümünde Sipariş oluşturma için bu sistemin web kancası adresini gir", SIR("Slack", "SLACK_WEBHOOK_URL")], { sektor: ["eticaret"] }),
  t("trendyol-yeni-siparis", "satis", "Trendyol yeni siparişlerini Telegram'a gönder", "Her 15 dakikada Trendyol'daki yeni siparişleri çeker, daha önce bildirilmeyenleri tek tek Telegram'a yazar.", dakikada(15), [
    uyg("s1", "Yeni siparişler", "trendyol", "siparisler", { durum: "Created", boyut: "50" }),
    dongu("s2", "Her sipariş", "{{adim.s1.yanit.content}}", [
      depo("s3", "Bildirildi mi", "goruldu", "trendyol_bildirilen", { deger: "{{dongu.oge.orderNumber}}" }),
      uyg("s4", "Telegram'a yaz", "telegram", "mesaj", { sohbet: "{{degisken.telegram_sohbet}}", metin: "Trendyol siparişi {{dongu.oge.orderNumber}}\n{{dongu.oge.customerFirstName}} {{dongu.oge.customerLastName}}, {{dongu.oge.totalPrice | tl}}" }),
    ]),
  ], [SIR("Trendyol", "TRENDYOL_SATICI", "TRENDYOL_API_KEY", "TRENDYOL_API_SECRET"), SIR("Telegram", "TELEGRAM_BOT_TOKEN"), "telegram_sohbet adlı değişkene bildirimlerin gideceği sohbet kimliğini yaz"], { sektor: ["eticaret"] }),
  t("stok-azaldi", "satis", "Stok azalınca uyar", "Ürün tablosunda stok 5'in altına düşünce ekibe Slack'ten haber verir; aynı ürün için günde bir kez uyarır.", tablo("urunler", ["guncelle"]), [
    suz("s1", "Stok az mı", [k("{{tetik.kayit.stok}}", "kucuk", "5")]),
    depo("s2", "Bugün uyarıldı mı", "goruldu", "stok_uyari_{{tarih}}", { deger: "{{tetik.kayit.id}}", sure: 2 }),
    uyg("s3", "Ekibe haber ver", "slack", "kanca", { metin: "Stok azaldı: {{tetik.kayit.ad}} için {{tetik.kayit.stok}} adet kaldı." }),
  ], [PROJE, SIR("Slack", "SLACK_WEBHOOK_URL")], { sektor: ["eticaret"] }),
  t("sepet-hatirlatma", "satis", "Terk edilen sepeti hatırlat", "Sepet olayı gelince 2 saat bekler; bu sürede sipariş verilmediyse kişiye nazik bir hatırlatma e-postası yazıp gönderir.", kanca(), [
    bekle("s1", "2 saat bekle", 2, "saat"),
    bul("s2", "Sipariş verdi mi", "siparisler", [k("eposta", "esit", "{{tetik.eposta}}")], { sinir: 1 }),
    suz("s3", "Sipariş yoksa", [k("{{adim.s2.sayi}}", "esit", "0")]),
    ajan("s4", "Hatırlatma yaz", "{{tetik.ad}} sepetine şunları ekledi ama siparişi tamamlamadı: {{tetik.urunler}}. Baskı yapmayan, sıcak, 3 cümlelik bir Türkçe hatırlatma e-postası yaz.", [["konu", "metin"], ["metin", "metin"]]),
    uyg("s5", "E-postayı gönder", "resend", "eposta", { gonderen: "{{degisken.gonderen_eposta}}", alici: "{{tetik.eposta}}", konu: "{{adim.s4.konu}}", govde: "{{adim.s4.metin}}" }),
  ], ["Sitenden sepet olayını (ad, eposta, urunler) bu sistemin web kancasına gönder", PROJE, SIR("Resend", "RESEND_API_KEY"), "gonderen_eposta değişkenine doğrulanmış gönderen adresini yaz"], { sektor: ["eticaret"] }),
  t("odeme-tesekkur", "satis", "Ödemeden sonra teşekkür e-postası", "Vayra Ödeme ile sipariş ödenince müşteriye ürünlerini sayan kişisel bir teşekkür e-postası gider.", odeme(), [
    don("s1", "Ürünler", "liste", "alan", "{{tetik.urunler}}", "ad"),
    ajan("s2", "Teşekkür yaz", "{{tetik.alici.ad}} adlı müşteri {{tetik.tutar | tl}} tutarında sipariş verdi ({{tetik.siparisNo}}). Ürünler: {{adim.s1.sonuc | birlestir}}. Sıcak, kısa bir Türkçe teşekkür e-postası yaz.", [["konu", "metin"], ["metin", "metin"]]),
    uyg("s3", "Gönder", "resend", "eposta", { gonderen: "{{degisken.gonderen_eposta}}", alici: "{{tetik.alici.eposta}}", konu: "{{adim.s2.konu}}", govde: "{{adim.s2.metin}}" }),
  ], ["Tetikte ödemeleri dinlenecek projeyi seç", SIR("Resend", "RESEND_API_KEY"), "gonderen_eposta değişkenini ekle"], { sektor: ["eticaret"] }),
  t("iade-talebi", "satis", "İade talebini onaya sun", "Müşteri iade formunu doldurur; talep onay kutuna düşer, onaylarsan iade kaydı açılır ve müşteriye e-posta gider.", formS("İade talebi", "Siparişin için iade talebini bu formla ilet; 1 iş günü içinde dönüş yaparız.", { bitis: "mesaj", mesaj: "Talebin alındı {{tetik.ad}}. Sonucu e-postayla bildireceğiz." }), [
    kayit("s1", "Talebi kaydet", "iade_talepleri", "{\"siparis\": \"{{tetik.siparis}}\", \"ad\": \"{{tetik.ad}}\", \"eposta\": \"{{tetik.eposta}}\", \"neden\": \"{{tetik.neden}}\", \"durum\": \"bekliyor\"}"),
    onay("s2", "İade onayı", "İade talebi {{tetik.siparis}}", "{{tetik.ad}} ({{tetik.eposta}}) iade istiyor.\nNeden: {{tetik.neden}}\nAçıklama: {{tetik.aciklama}}", [
      guncelle("s3", "Onaylandı yaz", "iade_talepleri", "{{adim.s1.id}}", "{\"durum\": \"onaylandi\"}"),
      uyg("s4", "Müşteriye bildir", "resend", "eposta", { gonderen: "{{degisken.gonderen_eposta}}", alici: "{{tetik.eposta}}", konu: "İade talebin onaylandı", govde: "Merhaba {{tetik.ad}}, {{tetik.siparis}} numaralı siparişin için iade talebin onaylandı. Kargo kodu: {{adim.s2.not | varsayilan(\"e-postayla ayrıca gönderilecek\")}}" }),
    ], [
      guncelle("s5", "Reddedildi yaz", "iade_talepleri", "{{adim.s1.id}}", "{\"durum\": \"reddedildi\"}"),
    ]),
  ], [PROJE, SIR("Resend", "RESEND_API_KEY"), FORM], { girdi: [z("siparis", "Sipariş numarası"), z("ad", "Adın soyadın"), z("eposta", "E-posta", "eposta"), z("neden", "İade nedeni", "secim", { secenekler: ["Ürün hasarlı", "Yanlış ürün", "Beğenmedim", "Diğer"] }), g("aciklama", "Açıklama", "uzunMetin")], sektor: ["eticaret"] }),
  t("buyuk-firsat-hubspot", "satis", "Büyük siparişte HubSpot fırsatı aç", "5.000 TL üstü ödenen siparişler için HubSpot'ta fırsat açar ve satış ekibine Slack'ten haber verir.", odeme(), [
    suz("s1", "Büyük sipariş mi", [k("{{tetik.tutar}}", "buyuk", "5000")]),
    paralel("s2", "Aynı anda", [
      ["Fırsat", [uyg("s3", "HubSpot fırsatı", "hubspot", "firsat", { ad: "{{tetik.alici.ad}} siparişi {{tetik.siparisNo}}", tutar: "{{tetik.tutar}}", asama: "closedwon" })]],
      ["Bildirim", [uyg("s4", "Satış ekibine yaz", "slack", "kanca", { metin: "Büyük sipariş: {{tetik.alici.ad}}, {{tetik.tutar | tl}} ({{tetik.siparisNo}})" })]],
    ]),
  ], ["Tetikte projeyi seç", SIR("HubSpot", "HUBSPOT_TOKEN"), SIR("Slack", "SLACK_WEBHOOK_URL")], { sektor: ["eticaret", "saas"] }),
  t("odeme-musteri-crm", "satis", "Ödeyen müşteriyi HubSpot'a ekle", "Her ödemede müşteriyi HubSpot kişilerine ekler; aynı e-posta ikinci kez gelirse yeniden eklemez.", odeme(), [
    depo("s1", "Daha önce eklendi mi", "goruldu", "hubspot_kisiler", { deger: "{{tetik.alici.eposta}}" }),
    uyg("s2", "Kişi oluştur", "hubspot", "kisi", { eposta: "{{tetik.alici.eposta}}", ad: "{{tetik.alici.ad}}", soyad: "{{tetik.alici.soyad}}", telefon: "{{tetik.alici.telefon}}", ek: "{\"lifecyclestage\": \"customer\"}" }),
  ], ["Tetikte projeyi seç", SIR("HubSpot", "HUBSPOT_TOKEN")], { sektor: ["eticaret"] }),
  t("odeme-baglantisi-formu", "satis", "Formdan ödeme bağlantısı üret", "Müşteri ürünü ve adedi seçer; Stripe ödeme bağlantısı oluşur ve formda hemen gösterilir.", formS("Hızlı ödeme", "Ürününü seç, ödeme bağlantın hemen oluşsun.", { bitis: "sonuc", mesaj: "Bağlantın hazır" }), [
    don("s1", "Fiyat kimliği", "yardimci", "arama", "{{tetik.urun}}", "Başlangıç paketi: price_BASLANGIC\nProfesyonel paket: price_PROFESYONEL", ""),
    uyg("s2", "Stripe bağlantısı", "stripe", "baglanti", { fiyat: "{{adim.s1.sonuc}}", adet: "{{tetik.adet}}" }),
    yanit("s3", "Ödeme bağlantın: {{adim.s2.yanit.url}}"),
  ], [SIR("Stripe", "STRIPE_SECRET_KEY"), "Arama tablosu adımına Stripe'taki fiyat kimliklerini yaz", FORM], { girdi: [z("urun", "Ürün", "secim", { secenekler: ["Başlangıç paketi", "Profesyonel paket"] }), z("adet", "Adet", "sayi", { varsayilan: "1" })], sektor: ["saas", "hizmet"] }),
  t("trendyol-stok-esitle", "satis", "Stok değişince Trendyol'u güncelle", "Kendi ürün tablonda stok ya da fiyat değişince aynı barkodla Trendyol'daki stok ve fiyatı günceller.", tablo("urunler", ["guncelle"]), [
    suz("s1", "Barkod var mı", [k("{{tetik.kayit.barkod}}", "bos-degil")]),
    uyg("s2", "Trendyol'u güncelle", "trendyol", "stok", { barkod: "{{tetik.kayit.barkod}}", adet: "{{tetik.kayit.stok}}", satis: "{{tetik.kayit.fiyat}}", liste: "{{tetik.kayit.listeFiyati}}" }),
  ], [PROJE, SIR("Trendyol", "TRENDYOL_SATICI", "TRENDYOL_API_KEY", "TRENDYOL_API_SECRET")], { sektor: ["eticaret"] }),
  t("gunluk-satis-ozeti", "satis", "Günlük satış özeti", "Her akşam 21.00'de son siparişleri toplar, toplam ciroyu ve en çok satanları çıkarıp ekibe gönderir.", gunluk("21:00"), [
    bul("s1", "Son siparişler", "siparisler", [], { sinir: 200 }),
    don("s2", "Ciroyu topla", "liste", "ozetle", "{{adim.s1.kayitlar}}", "tutar"),
    ajan("s3", "Özet yaz", "Bugün {{tarih}}. Son siparişler: {{adim.s1.kayitlar | ilk_n(50) | json}}. Toplam ciro {{adim.s2.toplam | tl}}, sipariş sayısı {{adim.s2.oge}}. Ekip için 4 satırlık Türkçe bir gün sonu özeti yaz."),
    uyg("s4", "Ekibe gönder", "slack", "kanca", { metin: "{{adim.s3.cikti}}" }),
  ], [PROJE, SIR("Slack", "SLACK_WEBHOOK_URL")], { sektor: ["eticaret", "restoran"] }),
  t("kupon-uret", "satis", "Formla indirim kuponu üret", "Ziyaretçi e-postasını bırakır; kişiye özel tek kullanımlık kupon kodu üretilir, kaydedilir ve formda gösterilir.", formS("Yüzde 10 indirim kazan", "E-postanı bırak, ilk siparişine özel kodun hemen gelsin.", { bitis: "sonuc", mesaj: "Kodun hazır" }), [
    depo("s1", "Daha önce aldı mı", "goruldu", "kupon_alanlar", { deger: "{{tetik.eposta | kucuk}}", gorulduyse: "devam" }),
    yon("s2", "Durum", [["Daha önce aldıysa", [k("{{adim.s1.goruldu}}", "dogru")], [yanit("s3", "Bu e-postaya daha önce kod gönderildi; e-postanı kontrol et.")]]], [
      kod("s4", "Kod üret", "export default function (girdi) {\n  const harf = \"ABCDEFGHJKLMNPRSTUVYZ23456789\";\n  let k = \"HOSGELDIN-\";\n  for (let i = 0; i < 6; i++) k += harf[Math.floor(Math.random() * harf.length)];\n  return { kod: k };\n}\n"),
      kayit("s5", "Kuponu kaydet", "kuponlar", "{\"eposta\": \"{{tetik.eposta}}\", \"kod\": \"{{adim.s4.kod}}\", \"kullanildi\": false}"),
      yanit("s6", "Kodun: {{adim.s4.kod}}. Sepette indirim kodu alanına yaz."),
    ]),
  ], [PROJE, FORM], { girdi: [z("eposta", "E-posta", "eposta")], sektor: ["eticaret"] }),
  t("whatsapp-siparis-onay", "satis", "Ödemede WhatsApp sipariş onayı", "Sipariş ödenince müşteriye onaylı WhatsApp şablon mesajıyla sipariş numarası ve tutar gider.", odeme(), [
    suz("s1", "Telefon var mı", [k("{{tetik.alici.telefon}}", "bos-degil")]),
    uyg("s2", "WhatsApp gönder", "whatsapp", "sablon", { telefon: "{{tetik.alici.telefon}}", sablon: "siparis_onay", dil: "tr", degiskenler: "{{tetik.alici.ad}}, {{tetik.siparisNo}}, {{tetik.tutar | tl}}" }),
  ], ["Tetikte projeyi seç", SIR("WhatsApp", "WHATSAPP_TOKEN", "WHATSAPP_PHONE_ID"), "Meta'da üç gövde değişkenli siparis_onay şablonunu onaylat"], { sektor: ["eticaret", "restoran"] }),
  t("kargo-bildirimi", "satis", "Kargo numarası girilince müşteriye yaz", "Siparişe kargo takip numarası eklenince müşteriye takip bağlantılı e-posta gönderir.", tablo("siparisler", ["guncelle"]), [
    suz("s1", "Kargo numarası yeni mi", [k("{{tetik.kayit.kargoNo}}", "bos-degil"), k("{{tetik.onceki.kargoNo}}", "bos")]),
    uyg("s2", "E-posta gönder", "resend", "eposta", { gonderen: "{{degisken.gonderen_eposta}}", alici: "{{tetik.kayit.eposta}}", konu: "Siparişin yola çıktı", govde: "Merhaba {{tetik.kayit.ad}},\n\n{{tetik.kayit.siparisNo}} numaralı siparişin kargoya verildi. Takip numaran: {{tetik.kayit.kargoNo}}\n\nİyi günlerde kullan." }),
  ], [PROJE, SIR("Resend", "RESEND_API_KEY")], { sektor: ["eticaret"] }),
  t("teklif-formu", "satis", "Teklif talebini değerlendir", "Teklif formu gelince yapay zekâ talebi puanlar; sıcak talepler HubSpot'a ve satış kanalına, diğerleri bültene gider.", formS("Teklif iste", "İhtiyacını anlat, 24 saat içinde teklifimizi gönderelim.", { mesaj: "Teşekkürler {{tetik.ad}}, talebin satış ekibimize ulaştı." }), [
    ajan("s1", "Talebi puanla", "Teklif talebi: firma {{tetik.firma}}, bütçe {{tetik.butce}}, ihtiyaç: {{tetik.ihtiyac}}. 0 ile 100 arası bir satın alma puanı ve tek cümlelik gerekçe ver.", [["puan", "sayi"], ["gerekce", "metin"]]),
    yon("s2", "Puana göre", [["Sıcak talep", [k("{{adim.s1.puan}}", "buyuk-esit", "60")], [
      uyg("s3", "HubSpot kişisi", "hubspot", "kisi", { eposta: "{{tetik.eposta}}", ad: "{{tetik.ad}}", sirket: "{{tetik.firma}}", ek: "{\"lifecyclestage\": \"salesqualifiedlead\"}" }),
      uyg("s4", "Satışa haber ver", "slack", "kanca", { metin: "Sıcak talep ({{adim.s1.puan}} puan): {{tetik.firma}}, {{tetik.butce}}. {{adim.s1.gerekce}}" }),
    ]]], [kayit("s5", "Bülten listesine ekle", "bulten", "{\"eposta\": \"{{tetik.eposta}}\", \"kaynak\": \"teklif\"}")]),
  ], [FORM, SIR("HubSpot", "HUBSPOT_TOKEN"), SIR("Slack", "SLACK_WEBHOOK_URL"), PROJE], { girdi: [z("ad", "Adın"), z("eposta", "İş e-postan", "eposta"), z("firma", "Firma"), g("butce", "Bütçe", "secim", { secenekler: ["10.000 TL altı", "10.000 ile 50.000 TL", "50.000 TL üstü"] }), z("ihtiyac", "İhtiyacın", "uzunMetin")], sektor: ["ajans", "saas", "hizmet"] }),

  /* ───────── Pazarlama ve içerik ───────── */
  t("rss-sosyal-taslak", "icerik", "Blog yazısından sosyal medya taslağı", "Blogunda yeni yazı çıkınca LinkedIn ve Instagram için ayrı taslaklar yazar, taslaklar tablosuna ekler.", rss("https://blogun.com/feed"), [
    ajan("s1", "Taslakları yaz", "Yeni blog yazımız: {{tetik.baslik}}\nÖzet: {{tetik.ozet}}\nBağlantı: {{tetik.baglanti}}\n\nLinkedIn için profesyonel bir paylaşım ve Instagram için kısa, emojisiz bir açıklama yaz.", [["linkedin", "metin"], ["instagram", "metin"]]),
    kayit("s2", "Taslakları kaydet", "sosyal_taslaklar", "{\"baslik\": \"{{tetik.baslik}}\", \"linkedin\": \"{{adim.s1.linkedin}}\", \"instagram\": \"{{adim.s1.instagram}}\", \"durum\": \"taslak\"}"),
  ], ["RSS tetiğine kendi blogunun akış adresini yaz", PROJE], { sektor: ["ajans", "saas"] }),
  t("haftalik-blog-wordpress", "icerik", "Her hafta WordPress'e blog taslağı", "Her pazartesi sektörüne uygun bir blog yazısı yazar, HTML'e çevirir ve WordPress'e taslak olarak kaydeder.", haftalik(1, "08:00"), [
    ajan("s1", "Yazıyı yaz", "Sektörümüz: {{degisken.sektor | varsayilan(\"kahve dükkânı\")}}. Bu hafta için arama motorunda iyi sıralanacak, 600 kelimelik Türkçe bir blog yazısı yaz. Markdown kullan.", [["baslik", "metin"], ["yazi", "metin", "Markdown"]]),
    don("s2", "HTML'e çevir", "yardimci", "markdown", "{{adim.s1.yazi}}"),
    uyg("s3", "WordPress taslağı", "wordpress", "yazi", { baslik: "{{adim.s1.baslik}}", icerik: "{{adim.s2.sonuc}}", durum: "draft" }),
  ], [SIR("WordPress", "WORDPRESS_SITE", "WORDPRESS_KULLANICI", "WORDPRESS_UYGULAMA_SIFRESI"), "sektor değişkenine işini kısaca yaz"], { sektor: ["ajans", "hizmet"] }),
  t("webflow-cms-icerik", "icerik", "Onaylı içeriği Webflow'a ekle", "Yapay zekâ taslağı yazar, sen onaylayınca Webflow koleksiyonuna taslak öğe olarak eklenir.", elleForm(), [
    ajan("s1", "Taslak yaz", "Konu: {{tetik.konu}}. Hedef kitle: {{tetik.kitle}}. 400 kelimelik Türkçe bir yazı ve 160 karakterlik açıklama yaz.", [["baslik", "metin"], ["ozet", "metin"], ["yazi", "metin"]]),
    onay("s2", "İçerik onayı", "{{adim.s1.baslik}}", "{{adim.s1.yazi}}", [
      uyg("s3", "Webflow öğesi", "webflow", "oge", { koleksiyon: "{{degisken.webflow_koleksiyon}}", ad: "{{adim.s1.baslik}}", adres: "{{adim.s1.baslik | adres_dostu}}", alanlar: "{\"ozet\": \"{{adim.s1.ozet}}\", \"icerik\": \"{{adim.s2.icerik}}\"}", taslak: "true" }),
    ]),
  ], [SIR("Webflow", "WEBFLOW_TOKEN"), "webflow_koleksiyon değişkenine blog koleksiyonunun kimliğini yaz"], { girdi: [z("konu", "Konu"), g("kitle", "Hedef kitle", "metin", { varsayilan: "küçük işletme sahipleri" })], sektor: ["ajans"] }),
  t("haftalik-bulten", "icerik", "Haftalık bülten taslağı", "Her cuma haftanın içeriklerinden bülten taslağı hazırlar ve onaylaman için sana e-postayla gönderir.", haftalik(5, "15:00"), [
    bul("s1", "Haftanın içerikleri", "icerikler", [], { sinir: 20 }),
    ajan("s2", "Bülteni yaz", "Bu haftanın içerikleri: {{adim.s1.kayitlar | alan(\"baslik\") | birlestir(\", \")}}. Okuyucuya hitap eden, 3 bölümlük kısa bir Türkçe bülten yaz. HTML kullan.", [["konu", "metin"], ["html", "metin"]]),
    uyg("s3", "Bana gönder", "resend", "eposta", { gonderen: "{{degisken.gonderen_eposta}}", alici: "{{degisken.benim_epostam}}", konu: "Taslak: {{adim.s2.konu}}", govde: "{{adim.s2.html}}" }),
  ], [PROJE, SIR("Resend", "RESEND_API_KEY"), "gonderen_eposta ve benim_epostam değişkenlerini ekle"], { sektor: ["ajans", "saas", "topluluk"] }),
  t("instagram-gorsel-uret", "icerik", "Instagram gönderisi ve görseli", "Konu ve tonu yazarsın; metin, etiketler ve 4:5 görsel birlikte üretilip içerik tablosuna kaydedilir.", elleForm(), [
    ajan("s1", "Metni yaz", "Marka: {{degisken.marka | varsayilan(\"markamız\")}}. Konu: {{tetik.konu}}. Ton: {{tetik.ton}}. Bir Instagram gönderisi yaz: kanca cümlesi, 3 cümle metin, 5 etiket ve İngilizce tek paragraf görsel tarifi.", [["metin", "metin"], ["etiketler", "metin"], ["gorselTarifi", "metin"]]),
    arac("s2", "Görseli üret", "gorsel_uret", "{{adim.s1.gorselTarifi}}", "4:5"),
    kayit("s3", "Kaydet", "instagram_icerik", "{\"metin\": \"{{adim.s1.metin}}\", \"etiketler\": \"{{adim.s1.etiketler}}\", \"gorsel\": \"{{adim.s2.gorseller | ilk}}\"}"),
  ], [PROJE], { girdi: [z("konu", "Konu"), g("ton", "Ton", "secim", { secenekler: ["Samimi", "Profesyonel", "Esprili"], varsayilan: "Samimi" })], sektor: ["restoran", "eticaret", "ajans"] }),
  t("youtube-fikir-notion", "icerik", "Haftalık video fikirleri Notion'a", "Her pazartesi kanalın için 5 video fikri üretir; her biri Notion veritabanında ayrı sayfa olur.", haftalik(1, "09:00"), [
    ajan("s1", "Fikir üret", "Kanal konusu: {{degisken.kanal_konusu}}. Bu hafta için 5 YouTube video fikri ver. Her biri için başlık ve 2 cümlelik açıklama.", [["fikirler", "liste", "baslik ve aciklama alanlı nesneler"]]),
    dongu("s2", "Her fikir", "{{adim.s1.fikirler}}", [
      uyg("s3", "Notion sayfası", "notion", "sayfa", { veritabani: "{{degisken.notion_fikir_db}}", baslikAlani: "Name", baslik: "{{dongu.oge.baslik}}", icerik: "{{dongu.oge.aciklama}}" }),
    ]),
  ], [SIR("Notion", "NOTION_TOKEN"), "kanal_konusu ve notion_fikir_db değişkenlerini ekle"], { sektor: ["ajans", "topluluk"] }),
  t("rakip-sayfa-takip", "icerik", "Rakip sayfasını izle", "Her gün rakibinin fiyat ya da ürün sayfasını okur; içerik değiştiyse neyin değiştiğini özetleyip haber verir.", gunluk("08:00"), [
    uyg("s1", "Sayfayı oku", "firecrawl", "oku", { adres: "{{degisken.rakip_adres}}" }),
    depo("s2", "Önceki hali", "oku", "rakip_onceki"),
    ajan("s3", "Karşılaştır", "Önceki içerik:\n{{adim.s2.deger | kisalt(6000)}}\n\nYeni içerik:\n{{adim.s1.yanit.data.markdown | kisalt(6000)}}\n\nFiyat, ürün ya da kampanya açısından anlamlı bir değişiklik var mı? Varsa iki cümleyle anlat.", [["degisti", "evet-hayir"], ["ozet", "metin"]]),
    depo("s4", "Yeni hali sakla", "yaz", "rakip_onceki", { deger: "{{adim.s1.yanit.data.markdown | kisalt(20000)}}" }),
    suz("s5", "Değiştiyse", [k("{{adim.s3.degisti}}", "dogru")]),
    uyg("s6", "Haber ver", "slack", "kanca", { metin: "Rakip sayfasında değişiklik: {{adim.s3.ozet}}\n{{degisken.rakip_adres}}" }),
  ], [SIR("Firecrawl", "FIRECRAWL_API_KEY"), SIR("Slack", "SLACK_WEBHOOK_URL"), "rakip_adres değişkenine izlenecek sayfayı yaz"], { sektor: ["eticaret", "saas"] }),
  t("etkinlik-kayit", "icerik", "Etkinlik kayıt formu", "Katılımcı formu doldurur; kontenjan dolmadıysa kaydedilir, onay e-postası gider; dolduysa bekleme listesine alınır.", formS("Etkinliğe kayıt ol", "Yerini ayırt; onay e-postası hemen gelsin.", { bitis: "sonuc", mesaj: "Teşekkürler {{tetik.ad}}" }), [
    depo("s1", "Kayıt sayısı", "artir", "etkinlik_kayit", { miktar: 1 }),
    yon("s2", "Kontenjan", [["Yer var", [k("{{adim.s1.deger}}", "kucuk-esit", "{{degisken.kontenjan | varsayilan(\"50\")}}")], [
      kayit("s3", "Katılımcıyı kaydet", "katilimcilar", "{\"ad\": \"{{tetik.ad}}\", \"eposta\": \"{{tetik.eposta}}\", \"sira\": {{adim.s1.deger}}}"),
      uyg("s4", "Onay e-postası", "resend", "eposta", { gonderen: "{{degisken.gonderen_eposta}}", alici: "{{tetik.eposta}}", konu: "Kaydın tamam", govde: "Merhaba {{tetik.ad}}, etkinliğe kaydın alındı. Görüşmek üzere." }),
      yanit("s5", "Kaydın alındı, onay e-postası yolda. Sıra numaran {{adim.s1.deger}}."),
    ]]], [
      kayit("s6", "Bekleme listesi", "bekleme_listesi", "{\"ad\": \"{{tetik.ad}}\", \"eposta\": \"{{tetik.eposta}}\"}"),
      yanit("s7", "Kontenjan doldu; seni bekleme listesine aldık. Yer açılırsa haber vereceğiz."),
    ]),
  ], [PROJE, SIR("Resend", "RESEND_API_KEY"), "kontenjan değişkenine kişi sayısını yaz", FORM], { girdi: [z("ad", "Ad soyad"), z("eposta", "E-posta", "eposta"), g("telefon", "Telefon", "telefon"), g("kaynak", "Kaynak", "gizli", { varsayilan: "site" })], sektor: ["egitim", "topluluk"] }),
  t("bulten-abonelik", "icerik", "Bülten abonelik formu", "E-posta bırakan kişiyi tekrar etmeden abone listesine ekler ve karşılama e-postası gönderir.", formS("Bültene katıl", "Ayda iki e-posta; istediğin an ayrılabilirsin.", { mesaj: "Hoş geldin! İlk bültenimiz yakında e-postanda." }), [
    depo("s1", "Zaten abone mi", "goruldu", "aboneler", { deger: "{{tetik.eposta | kucuk}}" }),
    kayit("s2", "Aboneyi kaydet", "aboneler", "{\"eposta\": \"{{tetik.eposta | kucuk}}\", \"ilgi\": {{tetik.ilgi}}, \"kaynak\": \"{{tetik.kaynak}}\"}"),
    uyg("s3", "Karşılama e-postası", "resend", "eposta", { gonderen: "{{degisken.gonderen_eposta}}", alici: "{{tetik.eposta}}", konu: "Bültenimize hoş geldin", govde: "Merhaba, aramıza katıldığın için teşekkürler. İlgi alanların: {{tetik.ilgi | birlestir}}." }),
  ], [PROJE, SIR("Resend", "RESEND_API_KEY"), FORM], { girdi: [z("eposta", "E-posta", "eposta"), g("ilgi", "Nelerle ilgilenirsin", "coklu", { secenekler: ["Yeni ürünler", "Kampanyalar", "Rehberler"] }), g("kaynak", "Kaynak", "gizli", { varsayilan: "site" })], sektor: ["eticaret", "topluluk", "saas"] }),
  t("marka-bahsetme", "icerik", "Web'de markanın geçtiği yeni sayfalar", "Her gün markanı web'de arar, daha önce görmediğin her yeni sonuç için kısa bir bildirim yazar.", gunluk("10:00"), [
    uyg("s1", "Web'de ara", "exa", "ara", { sorgu: "{{degisken.marka}} yorum haber", adet: "10" }),
    dongu("s2", "Her sonuç", "{{adim.s1.yanit.results}}", [
      depo("s3", "Yeni mi", "goruldu", "marka_sonuclari", { deger: "{{dongu.oge.url}}" }),
      uyg("s4", "Bildir", "slack", "kanca", { metin: "Markamız geçti: {{dongu.oge.title}}\n{{dongu.oge.url}}" }),
    ]),
  ], [SIR("Exa", "EXA_API_KEY"), SIR("Slack", "SLACK_WEBHOOK_URL"), "marka değişkenine marka adını yaz"], { sektor: ["ajans", "eticaret"] }),
  t("seo-fikir", "icerik", "Anahtar kelimeden içerik planı", "Bir anahtar kelime yazarsın; arama niyetine göre 10 başlık önerisi ve kısa plan üretilip kaydedilir.", elleForm(), [
    ajan("s1", "Plan çıkar", "Anahtar kelime: {{tetik.kelime}}. Arama niyetini belirt ve bu kelime için 10 Türkçe blog başlığı, her birine bir cümlelik plan yaz.", [["niyet", "metin"], ["basliklar", "liste"]]),
    kayit("s2", "Planı kaydet", "seo_plan", "{\"kelime\": \"{{tetik.kelime}}\", \"niyet\": \"{{adim.s1.niyet}}\", \"basliklar\": {{adim.s1.basliklar}}}"),
  ], [PROJE], { girdi: [z("kelime", "Anahtar kelime")], sektor: ["ajans", "eticaret"] }),
  t("urun-aciklamasi", "icerik", "Yeni ürüne açıklama yaz", "Ürün tablosuna yeni ürün eklenince satış odaklı açıklama ve SEO başlığı yazıp aynı kayda geri yazar.", tablo("urunler"), [
    suz("s1", "Açıklama boş mu", [k("{{tetik.kayit.aciklama}}", "bos")]),
    ajan("s2", "Açıklama yaz", "Ürün: {{tetik.kayit.ad}}, kategori: {{tetik.kayit.kategori}}, özellikler: {{tetik.kayit.ozellikler}}. 80 kelimelik Türkçe ürün açıklaması ve 60 karakterlik SEO başlığı yaz.", [["aciklama", "metin"], ["seoBaslik", "metin"]]),
    guncelle("s3", "Ürüne yaz", "urunler", "{{tetik.kayit.id}}", "{\"aciklama\": \"{{adim.s2.aciklama}}\", \"seoBaslik\": \"{{adim.s2.seoBaslik}}\"}"),
  ], [PROJE], { sektor: ["eticaret"] }),
  t("bolum-ozeti-notion", "icerik", "Podcast ya da video özetini Notion'a yaz", "Transkript web kancasıyla gelir; özet, bölüm başlıkları ve 3 alıntı çıkarılıp Notion'da sayfa olur.", kanca(), [
    ajan("s1", "Özetle", "Bölüm: {{tetik.baslik}}\nTranskript:\n{{tetik.transkript | kisalt(30000)}}\n\nTürkçe 5 cümlelik özet, zaman damgalı bölüm başlıkları ve 3 çarpıcı alıntı çıkar.", [["ozet", "metin"], ["bolumler", "metin"], ["alintilar", "metin"]]),
    uyg("s2", "Notion sayfası", "notion", "sayfa", { veritabani: "{{degisken.notion_bolum_db}}", baslik: "{{tetik.baslik}}", icerik: "{{adim.s1.ozet}}\n\n{{adim.s1.bolumler}}\n\n{{adim.s1.alintilar}}" }),
  ], ["Transkripti (baslik, transkript) bu sistemin web kancasına gönder", SIR("Notion", "NOTION_TOKEN"), "notion_bolum_db değişkenine veritabanı kimliğini yaz"], { sektor: ["ajans", "topluluk"] }),
  t("influencer-basvuru", "icerik", "Influencer başvurularını ayıkla", "Başvuru formu gelince profil uygunluğunu değerlendirir; uygunları Airtable'a ekler, diğerlerine kibar bir e-posta gönderir.", formS("İş birliği başvurusu", "Markamızla çalışmak istersen bilgilerini bırak.", { mesaj: "Başvurun alındı; uygun bulursak 5 iş günü içinde dönüş yapacağız." }), [
    sinif("s1", "Uygunluk", "Takipçi: {{tetik.takipci}}, platform: {{tetik.platform}}, konu: {{tetik.konu}}, neden biz: {{tetik.neden}}", [
      ["Uygun", "Markamızın kitlesine uygun, gerçekçi takipçi ve içerik", [uyg("s2", "Airtable'a ekle", "airtable", "ekle", { taban: "{{degisken.airtable_taban}}", tablo: "Influencerlar", alanlar: "{\"Ad\": \"{{tetik.ad}}\", \"Platform\": \"{{tetik.platform}}\", \"Takipçi\": \"{{tetik.takipci}}\", \"E-posta\": \"{{tetik.eposta}}\"}" })]],
      ["Uygun değil", "Konu ya da kitle markamızla ilgisiz", [uyg("s3", "Kibar ret", "resend", "eposta", { gonderen: "{{degisken.gonderen_eposta}}", alici: "{{tetik.eposta}}", konu: "Başvurun hakkında", govde: "Merhaba {{tetik.ad}}, ilgin için teşekkürler. Şu an farklı bir profil arıyoruz; ileride yeniden değerlendirmek isteriz." })]],
    ], [], "Bir kahve markası için influencer başvurusu değerlendiriyorsun."),
  ], [FORM, SIR("Airtable", "AIRTABLE_TOKEN"), SIR("Resend", "RESEND_API_KEY"), "airtable_taban değişkenini ekle"], { girdi: [z("ad", "Ad"), z("eposta", "E-posta", "eposta"), z("platform", "Platform", "secim", { secenekler: ["Instagram", "TikTok", "YouTube"] }), z("takipci", "Takipçi sayısı", "sayi"), z("konu", "İçerik konun"), g("neden", "Neden biz", "uzunMetin")], sektor: ["eticaret", "ajans"] }),

  /* ───────── Müşteri ve destek ───────── */
  t("site-destek-sohbet", "destek", "Sitene destek sohbeti", "Sitene gömülen sohbet kutusu: yapay zekâ önceki mesajları da okuyarak işletmen adına kısa ve kibar yanıt verir.", sohbet("Destek", "Merhaba! Sipariş, kargo ya da ürünlerle ilgili sorunu yaz.", ["Kargom nerede?", "İade nasıl yapılır?", "Çalışma saatleriniz"], "Genellikle birkaç saniyede yanıt verir"), [
    ajan("s1", "Yanıtı yaz", "İşletme bilgisi: {{degisken.isletme_bilgisi | varsayilan(\"Çevrimiçi mağaza; kargo 1 ile 3 iş günü, iade 14 gün.\")}}\n\nÖnceki konuşma:\n{{tetik.gecmisMetni}}\n\nMüşterinin yeni mesajı: {{tetik.mesaj}}\n\nKısa, kibar, yardımcı bir Türkçe yanıt yaz. Bilmediğin konuda uydurma; ekibe ileteceğini söyle."),
    yanit("s2", "{{adim.s1.cikti}}"),
  ], [SOHBET, "isletme_bilgisi değişkenine kargo, iade ve çalışma saatlerini yaz"], { sektor: ["eticaret", "hizmet", "restoran"] }),
  t("sohbet-insana-devir", "destek", "Sohbetten insana devret", "Sohbet botu mesajın konusunu ayırır: insan isteyen ya da şikâyet eden müşteriyi ekibe Slack'ten aktarır, diğerlerine yanıt verir.", sohbet("Canlı destek", "Merhaba, nasıl yardımcı olabilirim?", ["Bir temsilciyle görüşmek istiyorum", "Siparişimle ilgili sorum var"]), [
    sinif("s1", "Ne istiyor", "{{tetik.mesaj}}", [
      ["İnsan istiyor", "Temsilci, yetkili ya da gerçek kişiyle görüşmek istiyor ya da çok öfkeli", [
        uyg("s2", "Ekibe aktar", "slack", "kanca", { metin: "Sohbetten insan desteği isteniyor.\nMesaj: {{tetik.mesaj}}\nKonuşma: {{tetik.gecmisMetni | kisalt(1500)}}\nOturum: {{tetik.oturum}}" }),
        yanit("s3", "Seni ekibimize aktardım; bir temsilci en kısa sürede buradan ya da e-postayla dönecek."),
      ]],
    ], [
      ajan("s4", "Yanıt yaz", "Önceki konuşma:\n{{tetik.gecmisMetni}}\n\nYeni mesaj: {{tetik.mesaj}}\n\nKısa ve yardımcı bir Türkçe yanıt yaz."),
      yanit("s5", "{{adim.s4.cikti}}"),
    ]),
  ], [SOHBET, SIR("Slack", "SLACK_WEBHOOK_URL")], { sektor: ["eticaret", "saas", "hizmet"] }),
  t("destek-talebi-linear", "destek", "Destek talebini önceliklendir", "Destek formu gelince kişisel verileri maskeler, önceliği belirler ve Linear'da konu açar; müşteri talep numarasını formda görür.", formS("Destek talebi", "Sorunu anlat, ekibimiz hemen ilgilensin.", { bitis: "sonuc", mesaj: "Talebin alındı" }), [
    guv("s1", "Kişisel veriyi maskele", "{{tetik.sorun}}"),
    ajan("s2", "Önceliği belirle", "Destek talebi: {{adim.s1.metin}}\nKonu: {{tetik.konu}}. Önceliği belirle (1 acil, 2 yüksek, 3 orta, 4 düşük) ve tek satırlık başlık yaz.", [["oncelik", "sayi"], ["baslik", "metin"]]),
    uyg("s3", "Linear konusu", "linear", "konu", { takim: "{{degisken.linear_takim}}", baslik: "{{adim.s2.baslik}}", aciklama: "Gönderen: {{tetik.eposta}}\n\n{{adim.s1.metin}}", oncelik: "{{adim.s2.oncelik}}" }),
    yanit("s4", "Talep numaran {{adim.s3.yanit.data.issueCreate.issue.identifier | varsayilan(\"oluşturuldu\")}}. En geç 1 iş günü içinde dönüş yapacağız."),
  ], [FORM, SIR("Linear", "LINEAR_API_KEY"), "linear_takim değişkenine takım kimliğini yaz"], { girdi: [z("eposta", "E-posta", "eposta"), z("konu", "Konu", "secim", { secenekler: ["Hesap", "Ödeme", "Hata", "Öneri"] }), z("sorun", "Sorun", "uzunMetin")], sektor: ["saas"] }),
  t("eposta-destek-kutusu", "destek", "Destek e-postalarına taslak yanıt", "Destek adresine gelen e-postayı sınıflandırır, yanıt taslağı yazar; onaylarsan müşteriye gider.", eposta(), [
    ajan("s1", "Taslak yaz", "Gönderen: {{tetik.gonderen}}\nKonu: {{tetik.konu}}\nMetin:\n{{tetik.metin | kisalt(8000)}}\n\nMüşteriye kibar, net bir Türkçe yanıt taslağı yaz.", [["kategori", "metin", "siparis, iade, teknik ya da diger"], ["yanit", "metin"]]),
    onay("s2", "Yanıt onayı", "Yanıt: {{tetik.konu}}", "{{adim.s1.yanit}}", [
      uyg("s3", "Yanıtı gönder", "resend", "eposta", { gonderen: "{{degisken.destek_eposta}}", alici: "{{tetik.gonderen}}", konu: "Yanıt: {{tetik.konu}}", govde: "{{adim.s2.icerik}}" }),
    ]),
  ], ["Gelen e-posta tetiğindeki adrese destek postanı yönlendir", SIR("Resend", "RESEND_API_KEY"), "destek_eposta değişkenini ekle"], { sektor: ["eticaret", "saas", "hizmet"] }),
  t("telegram-destek-botu", "destek", "Telegram destek botu", "Telegram botuna yazılan mesaja yapay zekâ yanıt verir ve aynı sohbete gönderir.", kanca("ok"), [
    suz("s1", "Metin mesajı mı", [k("{{tetik.message.text}}", "bos-degil")]),
    ajan("s2", "Yanıt yaz", "Telegram'dan bir müşteri yazdı: {{tetik.message.text}}\nİşletme bilgisi: {{degisken.isletme_bilgisi}}\nKısa ve yardımcı bir Türkçe yanıt yaz."),
    uyg("s3", "Yanıtla", "telegram", "mesaj", { sohbet: "{{tetik.message.chat.id}}", metin: "{{adim.s2.cikti}}" }),
  ], [SIR("Telegram", "TELEGRAM_BOT_TOKEN"), "Telegram setWebhook ile bot adresini bu sistemin web kancasına bağla"], { sektor: ["hizmet", "eticaret"] }),
  t("memnuniyet-anketi", "destek", "Memnuniyet anketi ve kötü puan uyarısı", "Müşteri 1 ile 5 arası puan verir; tüm yanıtlar kaydedilir, 2 ve altı puanlarda ekibe hemen uyarı gider.", formS("Bizi nasıl buldun?", "İki soruluk anketimize katıldığın için teşekkürler.", { mesaj: "Görüşün için teşekkürler!" }), [
    kayit("s1", "Yanıtı kaydet", "anket", "{\"puan\": {{tetik.puan}}, \"yorum\": \"{{tetik.yorum}}\", \"siparis\": \"{{tetik.siparis}}\"}"),
    suz("s2", "Kötü puan mı", [k("{{tetik.puan}}", "kucuk-esit", "2")]),
    uyg("s3", "Ekibi uyar", "slack", "kanca", { metin: "Düşük puan ({{tetik.puan}}): {{tetik.yorum | varsayilan(\"yorum yok\")}}. Sipariş {{tetik.siparis}}" }),
  ], [PROJE, SIR("Slack", "SLACK_WEBHOOK_URL"), "Anket adresinin sonuna siparis parametresiyle sipariş numarasını ekleyerek gönder"], { girdi: [z("puan", "Puanın", "secim", { secenekler: ["1", "2", "3", "4", "5"] }), g("yorum", "Eklemek istediğin", "uzunMetin"), g("siparis", "Sipariş", "gizli")], sektor: ["eticaret", "restoran", "hizmet"] }),
  t("nps-takip", "destek", "Memnun müşteriden yorum iste", "Anket puanı 5 olan müşteriye 1 gün sonra Google yorum bağlantılı bir teşekkür e-postası gönderir.", tablo("anket"), [
    suz("s1", "Tam puan mı", [k("{{tetik.kayit.puan}}", "buyuk-esit", "5"), k("{{tetik.kayit.eposta}}", "bos-degil")]),
    bekle("s2", "1 gün bekle", 1, "gun"),
    uyg("s3", "Yorum iste", "resend", "eposta", { gonderen: "{{degisken.gonderen_eposta}}", alici: "{{tetik.kayit.eposta}}", konu: "Teşekkürler, bir ricamız var", govde: "Bizi bu kadar beğenmene çok sevindik. İki dakikanı ayırıp Google'da yorum bırakır mısın? {{degisken.yorum_baglantisi}}" }),
  ], [PROJE, SIR("Resend", "RESEND_API_KEY"), "yorum_baglantisi değişkenine Google yorum adresini yaz"], { sektor: ["restoran", "hizmet", "saglik"] }),
  t("randevu-formu", "destek", "Randevu talep formu ve SMS onayı", "Müşteri hizmet ve saati seçer; randevu kaydedilir, müşteriye Netgsm ile SMS onayı gider, formda özet görünür.", formS("Randevu al", "Uygun gün ve saati seç; SMS ile onaylayalım.", { bitis: "sonuc", mesaj: "Randevun alındı" }), [
    kayit("s1", "Randevuyu kaydet", "randevular", "{\"ad\": \"{{tetik.ad}}\", \"telefon\": \"{{tetik.telefon}}\", \"hizmet\": \"{{tetik.hizmet}}\", \"tarih\": \"{{tetik.tarih}}\", \"saat\": \"{{tetik.saat}}\", \"durum\": \"bekliyor\"}"),
    uyg("s2", "SMS onayı", "netgsm", "sms", { baslik: "{{degisken.sms_baslik}}", alici: "{{tetik.telefon}}", metin: "Sayın {{tetik.ad}}, {{tetik.tarih | tarih(\"uzun\")}} saat {{tetik.saat}} için {{tetik.hizmet}} randevunuz alındı." }),
    yanit("s3", "{{tetik.tarih | tarih(\"gunlu\")}}, saat {{tetik.saat}}. {{tetik.hizmet}} için seni bekliyoruz. SMS onayı yolda."),
  ], [PROJE, SIR("Netgsm", "NETGSM_KULLANICI", "NETGSM_SIFRE"), "sms_baslik değişkenine onaylı SMS başlığını yaz", FORM], { girdi: [z("ad", "Ad soyad"), z("telefon", "Telefon", "telefon"), z("hizmet", "Hizmet", "secim", { secenekler: ["Muayene", "Kontrol", "Danışmanlık"] }), z("tarih", "Gün", "tarih"), z("saat", "Saat", "secim", { secenekler: ["10:00", "11:00", "13:00", "14:00", "15:00", "16:00"] })], sektor: ["saglik", "hizmet"] }),
  t("randevu-hatirlatma", "destek", "Yarınki randevuları SMS ile hatırlat", "Her akşam 18.00'de ertesi günün randevularını bulur ve her kişiye hatırlatma SMS'i gönderir.", gunluk("18:00"), [
    bul("s1", "Yarınki randevular", "randevular", [k("tarih", "esit", "{{simdi | gun_ekle(1) | tarih(\"YYYY-AA-GG\")}}")], { sinir: 200 }),
    dongu("s2", "Her randevu", "{{adim.s1.kayitlar}}", [
      uyg("s3", "Hatırlatma SMS'i", "netgsm", "sms", { baslik: "{{degisken.sms_baslik}}", alici: "{{dongu.oge.telefon}}", metin: "Sayın {{dongu.oge.ad}}, yarın saat {{dongu.oge.saat}} randevunuzu hatırlatırız. İptal için bizi arayın." }),
    ]),
  ], [PROJE, SIR("Netgsm", "NETGSM_KULLANICI", "NETGSM_SIFRE"), "Randevu tarihleri YYYY-AA-GG biçiminde kaydedilmeli (Randevu formu böyle yazar)"], { sektor: ["saglik", "hizmet"] }),
  t("discord-duyuru", "destek", "Blog yazısını Discord'da duyur", "Blogunda ya da haber akışında yeni yazı çıkınca topluluk kanalına başlık ve bağlantıyla duyurur.", rss("https://blogun.com/feed"), [
    uyg("s1", "Discord'a yaz", "discord", "mesaj", { metin: "Yeni yazı: **{{tetik.baslik}}**\n{{tetik.ozet | kisalt(200)}}\n{{tetik.baglanti}}", kullanici: "Duyurular" }),
  ], ["RSS adresini yaz", SIR("Discord", "DISCORD_WEBHOOK_URL")], { sektor: ["topluluk", "saas"] }),
  t("sikayet-jira", "destek", "Şikâyeti Jira kaydına çevir", "Şikâyet web kancasıyla gelir; kişisel veriler maskelenir, özet ve kategoriyle Jira kaydı açılır.", kanca(), [
    guv("s1", "Kişisel veriyi maskele", "{{tetik.mesaj}}"),
    ajan("s2", "Özetle", "Şikâyet: {{adim.s1.metin}}. Tek satırlık özet ve kategori çıkar.", [["ozet", "metin"], ["kategori", "metin"]]),
    uyg("s3", "Jira kaydı", "jira", "kayit", { proje: "{{degisken.jira_proje}}", tur: "Task", ozet: "[{{adim.s2.kategori}}] {{adim.s2.ozet}}", aciklama: "{{adim.s1.metin}}" }),
  ], ["Şikâyetleri (mesaj) bu web kancasına gönder", SIR("Jira", "JIRA_SITE", "JIRA_EPOSTA", "JIRA_TOKEN"), "jira_proje değişkenine proje anahtarını yaz"], { sektor: ["saas", "hizmet"] }),
  t("yorum-yanit-taslagi", "destek", "Olumsuz yoruma yanıt taslağı", "Yorum tablosuna 3 yıldız altı yorum eklenince özür ve çözüm içeren yanıt taslağı yazar, onaya sunar.", tablo("yorumlar"), [
    suz("s1", "Düşük puan mı", [k("{{tetik.kayit.puan}}", "kucuk", "3")]),
    ajan("s2", "Yanıt taslağı", "Müşteri yorumu ({{tetik.kayit.puan}} yıldız): {{tetik.kayit.metin}}. Özür dileyen, somut çözüm öneren 3 cümlelik Türkçe yanıt yaz."),
    onay("s3", "Yanıtı onayla", "Yorum yanıtı", "{{adim.s2.cikti}}", [guncelle("s4", "Yanıtı kaydet", "yorumlar", "{{tetik.kayit.id}}", "{\"yanit\": \"{{adim.s3.icerik}}\", \"yanitlandi\": true}")]),
  ], [PROJE], { sektor: ["restoran", "eticaret", "turizm"] }),

  /* ───────── Operasyon ───────── */
  t("site-izleme", "operasyon", "Site çalışıyor mu, 5 dakikada bir", "Sitene 5 dakikada bir istek atar; ulaşılamazsa ya da hata dönerse Telegram'dan haber verir, düzelince bir kez bildirir.", dakikada(5), [
    yap("s1", "Siteyi denetle", "http", { yontem: "GET", url: "{{degisken.site_adresi}}", basliklar: "", govde: "", zamanAsimi: 15 }, { hata: "dal", hataSonrasi: "bitir", hataDali: [
      depo("s2", "Kapalı say", "yaz", "site_durum", { deger: "kapali" }),
      uyg("s3", "Haber ver", "telegram", "mesaj", { sohbet: "{{degisken.telegram_sohbet}}", metin: "Site yanıt vermiyor: {{degisken.site_adresi}}\n{{hata.mesaj}}" }),
    ] }),
    depo("s4", "Önceki durum", "oku", "site_durum", { deger: "acik" }),
    suz("s5", "Az önce kapalıysa", [k("{{adim.s4.deger}}", "esit", "kapali")]),
    depo("s6", "Açık say", "yaz", "site_durum", { deger: "acik" }),
    uyg("s7", "Düzeldi", "telegram", "mesaj", { sohbet: "{{degisken.telegram_sohbet}}", metin: "Site yeniden çalışıyor: {{degisken.site_adresi}}" }),
  ], [SIR("Telegram", "TELEGRAM_BOT_TOKEN"), "site_adresi ve telegram_sohbet değişkenlerini ekle"], { sektor: ["saas", "eticaret"] }),
  t("is-talebi-clickup", "operasyon", "İş talebini ClickUp görevine çevir", "Ekipten gelen iş talebi formu ClickUp'ta görev olur; talep edene görev bağlantısı gösterilir.", formS("İş talebi", "İhtiyacını yaz; ilgili ekibe görev olarak düşsün.", { bitis: "sonuc", mesaj: "Talebin görev oldu" }), [
    uyg("s1", "Görev oluştur", "clickup", "gorev", { liste: "{{degisken.clickup_liste}}", ad: "[{{tetik.ekip}}] {{tetik.baslik}}", aciklama: "Talep eden: {{tetik.ad}}\nSon tarih: {{tetik.tarih}}\n\n{{tetik.ayrinti}}" }),
    yanit("s2", "Görev bağlantısı: {{adim.s1.yanit.url}}"),
  ], [SIR("ClickUp", "CLICKUP_TOKEN"), "clickup_liste değişkenini ekle", FORM], { girdi: [z("ad", "Adın"), z("ekip", "Hangi ekip", "secim", { secenekler: ["Tasarım", "Yazılım", "Pazarlama", "Operasyon"] }), z("baslik", "Kısa başlık"), z("ayrinti", "Ayrıntı", "uzunMetin"), g("tarih", "Son tarih", "tarih")], sektor: ["ajans", "saas"] }),
  t("toplanti-notu", "operasyon", "Toplantı notunu özetle ve dağıt", "Toplantı transkripti gelince kararları ve yapılacakları çıkarır; Notion'a yazar ve ekip kanalına özet gönderir.", kanca(), [
    ajan("s1", "Özetle", "Toplantı: {{tetik.baslik}}\n{{tetik.transkript | kisalt(30000)}}\n\nKararlar, yapılacaklar (kim, ne, ne zaman) ve 3 cümlelik özet çıkar.", [["ozet", "metin"], ["kararlar", "metin"], ["yapilacaklar", "metin"]]),
    paralel("s2", "Aynı anda", [
      ["Notion", [uyg("s3", "Notion sayfası", "notion", "sayfa", { veritabani: "{{degisken.notion_toplanti_db}}", baslik: "{{tetik.baslik}} {{tarih}}", icerik: "{{adim.s1.ozet}}\n\nKararlar\n{{adim.s1.kararlar}}\n\nYapılacaklar\n{{adim.s1.yapilacaklar}}" })]],
      ["Slack", [uyg("s4", "Ekibe gönder", "slack", "kanca", { metin: "{{tetik.baslik}} özeti\n{{adim.s1.ozet}}\n\nYapılacaklar:\n{{adim.s1.yapilacaklar}}" })]],
    ]),
  ], ["Toplantı aracından transkripti (baslik, transkript) web kancasına gönder", SIR("Notion", "NOTION_TOKEN"), SIR("Slack", "SLACK_WEBHOOK_URL")], { sektor: ["ajans", "saas"] }),
  t("haftalik-ekip-ozeti", "operasyon", "Cuma günü haftanın özeti", "Her cuma 17.00'de görev tablosundan bu haftanın biten işlerini toplar ve Google Chat'e özet atar.", haftalik(5, "17:00"), [
    bul("s1", "Biten görevler", "gorevler", [k("durum", "esit", "bitti")], { sinir: 100 }),
    don("s2", "Kişiye göre", "liste", "grupla", "{{adim.s1.kayitlar}}", "sorumlu"),
    ajan("s3", "Özet yaz", "Bu hafta biten görevler: {{adim.s1.kayitlar | alan(\"baslik\") | birlestir(\"; \")}}. Kişilere göre sayılar: {{adim.s2.sayilar | json}}. Ekibe 5 satırlık, teşekkür eden bir hafta sonu özeti yaz."),
    uyg("s4", "Google Chat'e gönder", "google-chat", "mesaj", { metin: "{{adim.s3.cikti}}" }),
  ], [PROJE, SIR("Google Chat", "GOOGLE_CHAT_WEBHOOK_URL")], { sektor: ["ajans", "saas"] }),
  t("tedarikci-siparis", "operasyon", "Tedarikçi siparişini onayla ve gönder", "Depo sorumlusu sipariş formunu doldurur; yönetici onaylayınca tedarikçiye e-posta gider ve sipariş kaydedilir.", formS("Tedarikçi siparişi", "Eksik ürünleri yaz; onaylanınca tedarikçiye gider.", { mesaj: "Sipariş onaya gönderildi." }), [
    onay("s1", "Yönetici onayı", "Tedarikçi siparişi: {{tetik.tedarikci}}", "{{tetik.urunler}}\nTahmini tutar: {{tetik.tutar | tl}}", [
      uyg("s2", "Tedarikçiye gönder", "resend", "eposta", { gonderen: "{{degisken.gonderen_eposta}}", alici: "{{tetik.tedarikciEposta}}", konu: "Sipariş talebi {{tarih}}", govde: "Merhaba,\n\nAşağıdaki ürünleri sipariş etmek istiyoruz:\n{{adim.s1.icerik}}\n\nTeşekkürler." }),
      kayit("s3", "Siparişi kaydet", "tedarik_siparisleri", "{\"tedarikci\": \"{{tetik.tedarikci}}\", \"urunler\": \"{{adim.s1.icerik}}\", \"tutar\": {{tetik.tutar}}}"),
    ]),
  ], [FORM, SIR("Resend", "RESEND_API_KEY"), PROJE], { girdi: [z("tedarikci", "Tedarikçi"), z("tedarikciEposta", "Tedarikçi e-postası", "eposta"), z("urunler", "Ürünler ve adetler", "uzunMetin"), g("tutar", "Tahmini tutar", "sayi")], sektor: ["restoran", "eticaret"] }),
  t("fatura-hatirlatma", "operasyon", "Bekleyen faturaları hatırlat", "Her sabah vadesi geçen faturaları bulur, müşteriye kibar bir hatırlatma yazıp gönderir; aynı faturaya haftada bir kez.", haftaici("09:30"), [
    bul("s1", "Bekleyen faturalar", "faturalar", [k("durum", "esit", "bekliyor")], { sinir: 100 }),
    dongu("s2", "Her fatura", "{{adim.s1.kayitlar}}", [
      suz("s3", "Vadesi geçti mi", [k("{{dongu.oge.vade}}", "tarih-once", "{{simdi}}")]),
      depo("s4", "Bu hafta hatırlatıldı mı", "goruldu", "fatura_hatirlatma", { deger: "{{dongu.oge.id}}", sure: 7 }),
      uyg("s5", "Hatırlat", "resend", "eposta", { gonderen: "{{degisken.gonderen_eposta}}", alici: "{{dongu.oge.eposta}}", konu: "{{dongu.oge.faturaNo}} numaralı fatura", govde: "Merhaba {{dongu.oge.firma}},\n\n{{dongu.oge.vade | tarih}} vadeli {{dongu.oge.tutar | tl}} tutarındaki faturamız henüz ödenmemiş görünüyor. Ödediysen bu e-postayı dikkate alma.\n\nTeşekkürler." }),
    ]),
  ], [PROJE, SIR("Resend", "RESEND_API_KEY")], { sektor: ["hizmet", "ajans", "saas"] }),
  t("e-posta-kuyrugu", "operasyon", "E-posta kuyruğunu yavaşça gönder", "Başka sistemlerin kuyruğa eklediği e-postaları 5 dakikada bir sırayla gönderir; gönderici hız sınırına takılmaz.", dakikada(5), [
    depo("s1", "Sıradakini al", "cek", "eposta_kuyrugu", { kapsam: "hesap" }),
    suz("s2", "Kuyruk boş değilse", [k("{{adim.s1.bos}}", "yanlis")]),
    uyg("s3", "Gönder", "resend", "eposta", { gonderen: "{{degisken.gonderen_eposta}}", alici: "{{adim.s1.deger.alici}}", konu: "{{adim.s1.deger.konu}}", govde: "{{adim.s1.deger.metin}}" }),
  ], [SIR("Resend", "RESEND_API_KEY"), "Diğer sistemlerde Depo adımıyla eposta_kuyrugu anahtarına (bütün sistemler) alici, konu, metin alanlı nesne ekle"], { sektor: ["saas", "eticaret"] }),
  t("envanter-sayim", "operasyon", "Envanter sayımını tabloya yaz", "Sayım formuyla gelen ürün adedini barkoda göre günceller; ürün yoksa yeni kayıt açar.", formS("Envanter sayımı", "Barkodu ve saydığın adedi gir.", { mesaj: "{{tetik.barkod}} için {{tetik.adet}} adet kaydedildi.", tekrar: true }), [
    upsert("s1", "Stoğu yaz", "urunler", "barkod", "{\"barkod\": \"{{tetik.barkod}}\", \"stok\": {{tetik.adet}}, \"sayimTarihi\": \"{{simdi}}\", \"sayan\": \"{{tetik.sayan}}\"}"),
  ], [PROJE, FORM], { girdi: [z("barkod", "Barkod"), z("adet", "Adet", "sayi"), g("sayan", "Sayan kişi")], sektor: ["eticaret", "restoran"] }),
  t("vardiya-raporu", "operasyon", "Gün sonu kasa raporu", "Vardiya sorumlusu gün sonu formunu doldurur; açık varsa yöneticiye anında uyarı gider, rapor kaydedilir.", formS("Gün sonu raporu", "Kasa ve notları gir.", { mesaj: "Rapor kaydedildi, iyi akşamlar." }), [
    kayit("s1", "Raporu kaydet", "gun_sonu", "{\"sube\": \"{{tetik.sube}}\", \"ciro\": {{tetik.ciro}}, \"kasa\": {{tetik.kasa}}, \"not\": \"{{tetik.not}}\"}"),
    don("s2", "Farkı hesapla", "sayi", "cikar", "{{tetik.ciro}}", "{{tetik.kasa}}"),
    suz("s3", "Açık var mı", [k("{{adim.s2.sonuc | mutlak}}", "buyuk", "50")]),
    uyg("s4", "Yöneticiye yaz", "telegram", "mesaj", { sohbet: "{{degisken.telegram_sohbet}}", metin: "{{tetik.sube}} kasasında {{adim.s2.sonuc | tl}} fark var. Not: {{tetik.not | varsayilan(\"yok\")}}" }),
  ], [PROJE, SIR("Telegram", "TELEGRAM_BOT_TOKEN"), "telegram_sohbet değişkenini ekle", FORM], { girdi: [z("sube", "Şube", "secim", { secenekler: ["Merkez", "Kadıköy", "Beşiktaş"] }), z("ciro", "Sistemdeki ciro", "sayi"), z("kasa", "Kasadaki tutar", "sayi"), g("not", "Not", "uzunMetin")], sektor: ["restoran"] }),
  t("emlak-talep-eslestir", "operasyon", "Emlak talebine uygun ilanları gönder", "Alıcı formda bütçe ve semti yazar; ilan tablosundan uygun ilanlar süzülür ve e-postayla gönderilir.", formS("Ev arıyorum", "Bütçeni ve semtini yaz, uygun ilanları gönderelim.", { bitis: "sonuc", mesaj: "Talebin alındı" }), [
    bul("s1", "İlanları bul", "ilanlar", [k("semt", "icerir", "{{tetik.semt}}"), k("fiyat", "kucukEsit", "{{tetik.butce}}")], { sinir: 10, sirala: "fiyat", yon: "artan" }),
    yon("s2", "Sonuç", [["İlan bulundu", [k("{{adim.s1.sayi}}", "buyuk", "0")], [
      ajan("s3", "E-posta yaz", "Alıcı: {{tetik.ad}}, bütçe {{tetik.butce | tl}}, semt {{tetik.semt}}. Uygun ilanlar: {{adim.s1.kayitlar | json}}. İlanları kısaca tanıtan sıcak bir Türkçe e-posta yaz.", [["konu", "metin"], ["metin", "metin"]]),
      uyg("s4", "Gönder", "resend", "eposta", { gonderen: "{{degisken.gonderen_eposta}}", alici: "{{tetik.eposta}}", konu: "{{adim.s3.konu}}", govde: "{{adim.s3.metin}}" }),
      yanit("s5", "{{adim.s1.sayi}} uygun ilan e-postana gönderildi."),
    ]]], [kayit("s6", "Talebi beklet", "alici_talepleri", "{\"ad\": \"{{tetik.ad}}\", \"eposta\": \"{{tetik.eposta}}\", \"semt\": \"{{tetik.semt}}\", \"butce\": {{tetik.butce}}}"), yanit("s7", "Şu an uygun ilan yok; yeni ilan gelince haber vereceğiz.")]),
  ], [PROJE, SIR("Resend", "RESEND_API_KEY"), FORM], { girdi: [z("ad", "Ad"), z("eposta", "E-posta", "eposta"), z("semt", "Semt"), z("butce", "En çok bütçe (TL)", "sayi")], sektor: ["emlak"] }),
  t("rezervasyon-formu", "operasyon", "Restoran rezervasyonu", "Misafir gün, saat ve kişi sayısını seçer; rezervasyon kaydedilir, mekâna bildirim gider, misafire onay gösterilir.", formS("Masa ayırt", "Gün, saat ve kişi sayısını seç.", { bitis: "sonuc", mesaj: "Rezervasyon talebin alındı" }), [
    kayit("s1", "Rezervasyonu kaydet", "rezervasyonlar", "{\"ad\": \"{{tetik.ad}}\", \"telefon\": \"{{tetik.telefon}}\", \"tarih\": \"{{tetik.tarih}}\", \"saat\": \"{{tetik.saat}}\", \"kisi\": {{tetik.kisi}}, \"not\": \"{{tetik.not}}\"}"),
    uyg("s2", "Mekâna bildir", "telegram", "mesaj", { sohbet: "{{degisken.telegram_sohbet}}", metin: "Rezervasyon: {{tetik.ad}}, {{tetik.kisi}} kişi, {{tetik.tarih | tarih(\"gunlu\")}} {{tetik.saat}}. Tel: {{tetik.telefon}}" }),
    yanit("s3", "{{tetik.tarih | tarih(\"gunlu\")}} saat {{tetik.saat}}, {{tetik.kisi}} kişi. Görüşmek üzere!"),
  ], [PROJE, SIR("Telegram", "TELEGRAM_BOT_TOKEN"), "telegram_sohbet değişkenini ekle", FORM], { girdi: [z("ad", "Ad soyad"), z("telefon", "Telefon", "telefon"), z("tarih", "Gün", "tarih"), z("saat", "Saat", "secim", { secenekler: ["12:00", "13:00", "19:00", "20:00", "21:00"] }), z("kisi", "Kişi sayısı", "sayi", { varsayilan: "2" }), g("not", "Not", "uzunMetin")], sektor: ["restoran"] }),
  t("otel-misafir-karsilama", "operasyon", "Otel misafirine varıştan önce mesaj", "Rezervasyon tablosundaki giriş tarihinden 1 gün önce misafire WhatsApp ile karşılama ve yol tarifi gönderir.", gunluk("10:00"), [
    bul("s1", "Yarın gelenler", "rezervasyonlar", [k("giris", "esit", "{{simdi | gun_ekle(1) | tarih(\"YYYY-AA-GG\")}}")], { sinir: 100 }),
    dongu("s2", "Her misafir", "{{adim.s1.kayitlar}}", [
      uyg("s3", "WhatsApp karşılama", "whatsapp", "sablon", { telefon: "{{dongu.oge.telefon}}", sablon: "varis_karsilama", dil: "tr", degiskenler: "{{dongu.oge.ad}}, {{dongu.oge.giris | tarih}}" }),
    ]),
  ], [PROJE, SIR("WhatsApp", "WHATSAPP_TOKEN", "WHATSAPP_PHONE_ID"), "Meta'da varis_karsilama şablonunu onaylat"], { sektor: ["turizm"] }),

  /* ───────── İnsan kaynakları ───────── */
  t("is-basvurusu", "ik", "İş başvurusunu ön değerlendir", "Başvuru formu gelince yapay zekâ ilana uygunluğu puanlar; aday kaydedilir, 70 puan üstü adaylar ekibe bildirilir.", formS("Bize katıl", "Başvurunu yap; 5 iş günü içinde dönüş yapacağız.", { mesaj: "Başvurun alındı {{tetik.ad}}, teşekkürler." }), [
    ajan("s1", "Değerlendir", "Pozisyon: {{tetik.pozisyon}}. Aday deneyimi: {{tetik.deneyim}} yıl. Ön yazı: {{tetik.onYazi}}. Bağlantı: {{tetik.baglanti}}. 0 ile 100 arası uygunluk puanı, güçlü yönler ve sorulacak 2 soru çıkar.", [["puan", "sayi"], ["guclu", "metin"], ["sorular", "metin"]]),
    kayit("s2", "Adayı kaydet", "adaylar", "{\"ad\": \"{{tetik.ad}}\", \"eposta\": \"{{tetik.eposta}}\", \"pozisyon\": \"{{tetik.pozisyon}}\", \"puan\": {{adim.s1.puan}}, \"durum\": \"yeni\"}"),
    suz("s3", "Güçlü aday mı", [k("{{adim.s1.puan}}", "buyuk-esit", "70")]),
    uyg("s4", "İK'ya bildir", "slack", "kanca", { metin: "Güçlü aday ({{adim.s1.puan}}): {{tetik.ad}}, {{tetik.pozisyon}}\n{{adim.s1.guclu}}\nSorular: {{adim.s1.sorular}}" }),
  ], [PROJE, SIR("Slack", "SLACK_WEBHOOK_URL"), FORM], { girdi: [z("ad", "Ad soyad"), z("eposta", "E-posta", "eposta"), z("pozisyon", "Pozisyon", "secim", { secenekler: ["Yazılım geliştirici", "Tasarımcı", "Satış uzmanı", "Müşteri temsilcisi"] }), z("deneyim", "Deneyim (yıl)", "sayi"), g("baglanti", "LinkedIn ya da portföy bağlantısı"), z("onYazi", "Kısa ön yazı", "uzunMetin")], sektor: ["saas", "ajans"] }),
  t("mulakat-daveti", "ik", "Mülakat aşamasındaki adaya davet", "Aday kaydı mülakat durumuna geçince adaya takvim bağlantılı davet e-postası gider.", tablo("adaylar", ["guncelle"]), [
    suz("s1", "Mülakata geçti mi", [k("{{tetik.kayit.durum}}", "esit", "mulakat"), k("{{tetik.onceki.durum}}", "esit-degil", "mulakat")]),
    uyg("s2", "Davet gönder", "resend", "eposta", { gonderen: "{{degisken.ik_eposta}}", alici: "{{tetik.kayit.eposta}}", konu: "{{tetik.kayit.pozisyon}} görüşme daveti", govde: "Merhaba {{tetik.kayit.ad}},\n\nBaşvurunu beğendik. Görüşme için uygun bir saati buradan seçebilirsin: {{degisken.takvim_baglantisi}}\n\nGörüşmek üzere." }),
  ], [PROJE, SIR("Resend", "RESEND_API_KEY"), "ik_eposta ve takvim_baglantisi değişkenlerini ekle"], { sektor: ["saas", "ajans"] }),
  t("ise-alisma", "ik", "Yeni çalışanın ilk günü", "Yeni çalışan bilgileri girilince duyuru, Asana işe alışma görevi ve Notion sayfası aynı anda açılır, kişiye hoş geldin e-postası gider.", elleForm(), [
    paralel("s1", "Aynı anda", [
      ["Duyuru", [uyg("s2", "Ekibe duyur", "slack", "kanca", { metin: "Aramıza hoş geldin {{tetik.ad}}! {{tetik.baslangic | tarih}} itibarıyla {{tetik.ekip}} ekibinde." })]],
      ["Görev", [uyg("s3", "İşe alışma görevi", "asana", "gorev", { proje: "{{degisken.asana_ik_proje}}", ad: "{{tetik.ad}} işe alışma", not: "Hesaplar, ekipman ve tanışma toplantıları", bitis: "{{tetik.baslangic}}" })]],
      ["Notion", [uyg("s4", "Çalışan sayfası", "notion", "sayfa", { veritabani: "{{degisken.notion_calisan_db}}", baslik: "{{tetik.ad}}", icerik: "Ekip: {{tetik.ekip}}\nBaşlangıç: {{tetik.baslangic}}" })]],
    ]),
    uyg("s5", "Hoş geldin e-postası", "resend", "eposta", { gonderen: "{{degisken.ik_eposta}}", alici: "{{tetik.eposta}}", konu: "Hoş geldin {{tetik.ad}}", govde: "Merhaba {{tetik.ad}},\n\n{{tetik.baslangic | tarih(\"gunlu\")}} günü seni bekliyoruz. İlk günün planı ekte; sorun olursa bu adrese yaz." }),
  ], [SIR("Slack", "SLACK_WEBHOOK_URL"), SIR("Asana", "ASANA_TOKEN"), SIR("Notion", "NOTION_TOKEN"), SIR("Resend", "RESEND_API_KEY"), "asana_ik_proje, notion_calisan_db ve ik_eposta değişkenlerini ekle"], { girdi: [z("ad", "Ad soyad"), z("eposta", "E-posta", "eposta"), z("ekip", "Ekip"), z("baslangic", "Başlangıç günü", "tarih")], sektor: ["saas", "ajans"] }),
  t("izin-talebi", "ik", "İzin talebi ve yönetici onayı", "Çalışan izin formunu doldurur; yönetici onaylar ya da reddeder, sonuç çalışana e-postayla gider ve kaydedilir.", formS("İzin talebi", "Tarihleri ve izin türünü seç.", { mesaj: "Talebin yöneticine iletildi." }), [
    don("s1", "Gün sayısı", "tarih", "fark", "{{tetik.baslangic}}", "{{tetik.bitis}}", "gun"),
    onay("s2", "Yönetici onayı", "{{tetik.ad}} izin talebi", "{{tetik.tur}}: {{tetik.baslangic | tarih}} ile {{tetik.bitis | tarih}} arası, {{adim.s1.sonuc | arti(1)}} gün.\nNot: {{tetik.not}}", [
      kayit("s3", "İzni kaydet", "izinler", "{\"ad\": \"{{tetik.ad}}\", \"tur\": \"{{tetik.tur}}\", \"baslangic\": \"{{tetik.baslangic}}\", \"bitis\": \"{{tetik.bitis}}\", \"gun\": {{adim.s1.sonuc | arti(1)}}}"),
      uyg("s4", "Onay e-postası", "resend", "eposta", { gonderen: "{{degisken.ik_eposta}}", alici: "{{tetik.eposta}}", konu: "İzin talebin onaylandı", govde: "İyi tatiller {{tetik.ad}}! {{tetik.baslangic | tarih}} ile {{tetik.bitis | tarih}} arası iznin onaylandı." }),
    ], [uyg("s5", "Ret e-postası", "resend", "eposta", { gonderen: "{{degisken.ik_eposta}}", alici: "{{tetik.eposta}}", konu: "İzin talebin hakkında", govde: "Merhaba {{tetik.ad}}, izin talebin bu tarihler için onaylanmadı. Not: {{adim.s2.not | varsayilan(\"yöneticinle görüşebilirsin\")}}" })]),
  ], [FORM, PROJE, SIR("Resend", "RESEND_API_KEY"), "ik_eposta değişkenini ekle"], { girdi: [z("ad", "Ad soyad"), z("eposta", "E-posta", "eposta"), z("tur", "İzin türü", "secim", { secenekler: ["Yıllık izin", "Hastalık", "Mazeret"] }), z("baslangic", "Başlangıç", "tarih"), z("bitis", "Bitiş", "tarih"), g("not", "Not", "uzunMetin")], sektor: ["saas", "ajans", "hizmet"] }),
  t("dogum-gunu", "ik", "Doğum günlerini kutla", "Her sabah çalışan tablosunda bugün doğum günü olanları bulur ve ekip kanalında kutlar.", haftaici("09:00"), [
    bul("s1", "Çalışanlar", "calisanlar", [], { sinir: 500 }),
    dongu("s2", "Her çalışan", "{{adim.s1.kayitlar}}", [
      suz("s3", "Bugün mü", [k("{{dongu.oge.dogumGunu | tarih(\"GG.AA\")}}", "esit", "{{simdi | tarih(\"GG.AA\")}}")]),
      uyg("s4", "Kutla", "slack", "kanca", { metin: "Bugün {{dongu.oge.ad}} için doğum günü! İyi ki varsın." }),
    ]),
  ], [PROJE, SIR("Slack", "SLACK_WEBHOOK_URL")], { sektor: ["saas", "ajans"] }),
  t("cikis-gorusmesi", "ik", "Ayrılan çalışandan geri bildirim", "Çıkış anketi formu gelince yanıtlar kaydedilir; yapay zekâ temaları özetleyip İK'ya gönderir.", formS("Ayrılış anketi", "Deneyimini paylaşırsan daha iyi bir iş yeri oluruz. Yanıtların gizli tutulur.", { mesaj: "Teşekkürler, yolun açık olsun." }), [
    guv("s1", "Kişisel veriyi maskele", "{{tetik.neden}} {{tetik.oneriler}}"),
    ajan("s2", "Temaları çıkar", "Ayrılan çalışan geri bildirimi: {{adim.s1.metin}}. Ana temaları ve en önemli öneriyi 3 madde halinde yaz."),
    kayit("s3", "Kaydet", "cikis_anketleri", "{\"ekip\": \"{{tetik.ekip}}\", \"puan\": \"{{tetik.puan}}\", \"ozet\": \"{{adim.s2.cikti}}\"}"),
  ], [FORM, PROJE], { girdi: [z("ekip", "Ekibin"), z("puan", "Genel memnuniyet", "secim", { secenekler: ["1", "2", "3", "4", "5"] }), z("neden", "Ayrılma nedenin", "uzunMetin"), g("oneriler", "Önerilerin", "uzunMetin")], sektor: ["saas", "ajans"] }),
  t("masraf-talebi", "ik", "Masraf talebi ve onay", "Çalışan masraf formunu doldurur; 1.000 TL üstü talepler onaya gider, onaylananlar masraf tablosuna yazılır.", formS("Masraf bildir", "Tutarı, kategoriyi ve fiş bağlantısını gir.", { mesaj: "Masraf talebin alındı." }), [
    yon("s1", "Tutara göre", [["1.000 TL üstü", [k("{{tetik.tutar}}", "buyuk", "1000")], [
      onay("s2", "Masraf onayı", "{{tetik.ad}} masrafı", "{{tetik.kategori}}: {{tetik.tutar | tl}}\n{{tetik.aciklama}}\nFiş: {{tetik.fis}}", [kayit("s3", "Masrafı kaydet", "masraflar", "{\"ad\": \"{{tetik.ad}}\", \"kategori\": \"{{tetik.kategori}}\", \"tutar\": {{tetik.tutar}}, \"onay\": \"yonetici\"}")]),
    ]]], [kayit("s4", "Masrafı kaydet", "masraflar", "{\"ad\": \"{{tetik.ad}}\", \"kategori\": \"{{tetik.kategori}}\", \"tutar\": {{tetik.tutar}}, \"onay\": \"otomatik\"}")]),
  ], [FORM, PROJE], { girdi: [z("ad", "Ad soyad"), z("kategori", "Kategori", "secim", { secenekler: ["Yol", "Yemek", "Konaklama", "Yazılım", "Diğer"] }), z("tutar", "Tutar (TL)", "sayi"), g("aciklama", "Açıklama"), g("fis", "Fiş bağlantısı")], sektor: ["saas", "ajans", "hizmet"] }),
  t("egitim-kaydi", "ik", "Eğitim kaydı ve hatırlatma görevi", "Çalışan eğitime kaydolur; kayıt yazılır ve kişinin Todoist'ine eğitim günü için hatırlatma görevi eklenir.", formS("Eğitime katıl", "Eğitimi ve gününü seç.", { mesaj: "Kaydın alındı; hatırlatma görevin eklendi." }), [
    kayit("s1", "Kaydı yaz", "egitim_kayitlari", "{\"ad\": \"{{tetik.ad}}\", \"egitim\": \"{{tetik.egitim}}\", \"tarih\": \"{{tetik.tarih}}\"}"),
    uyg("s2", "Hatırlatma görevi", "todoist", "gorev", { icerik: "{{tetik.egitim}} eğitimine katıl", zaman: "{{tetik.tarih | tarih(\"kisa\")}} 09:30", oncelik: "3" }),
  ], [FORM, PROJE, SIR("Todoist", "TODOIST_TOKEN")], { girdi: [z("ad", "Ad soyad"), z("egitim", "Eğitim", "secim", { secenekler: ["Satış teknikleri", "İlk yardım", "Yapay zekâ araçları"] }), z("tarih", "Gün", "tarih")], sektor: ["egitim", "saas"] }),
  t("vardiya-degisikligi", "ik", "Vardiya değişikliği talebi", "Çalışan vardiya değişikliği ister; sorumlu onaylarsa ekip grubuna Telegram'dan duyurulur.", formS("Vardiya değişikliği", "Hangi vardiyayı kiminle değiştirmek istiyorsun?", { mesaj: "Talebin sorumluya iletildi." }), [
    onay("s1", "Sorumlu onayı", "Vardiya değişikliği", "{{tetik.ad}}, {{tetik.tarih | tarih}} {{tetik.vardiya}} vardiyasını {{tetik.yerine}} ile değiştirmek istiyor.", [
      uyg("s2", "Gruba duyur", "telegram", "mesaj", { sohbet: "{{degisken.telegram_sohbet}}", metin: "Vardiya değişti: {{tetik.tarih | tarih}} {{tetik.vardiya}} vardiyasında {{tetik.ad}} yerine {{tetik.yerine}} çalışacak." }),
    ]),
  ], [FORM, SIR("Telegram", "TELEGRAM_BOT_TOKEN"), "telegram_sohbet değişkenini ekle"], { girdi: [z("ad", "Adın"), z("tarih", "Gün", "tarih"), z("vardiya", "Vardiya", "secim", { secenekler: ["Sabah", "Akşam", "Gece"] }), z("yerine", "Yerine çalışacak kişi")], sektor: ["restoran", "saglik", "turizm"] }),
  t("aday-ret-nazik", "ik", "Reddedilen adaya nazik e-posta", "Aday kaydı reddedildi durumuna geçince kişiye özel, kibar bir bilgilendirme e-postası yazıp gönderir.", tablo("adaylar", ["guncelle"]), [
    suz("s1", "Reddedildi mi", [k("{{tetik.kayit.durum}}", "esit", "reddedildi"), k("{{tetik.onceki.durum}}", "esit-degil", "reddedildi")]),
    ajan("s2", "E-posta yaz", "{{tetik.kayit.ad}} adlı aday {{tetik.kayit.pozisyon}} pozisyonu için olumsuz sonuçlandı. Saygılı, teşekkür eden, kapıyı açık bırakan 4 cümlelik Türkçe e-posta yaz."),
    uyg("s3", "Gönder", "resend", "eposta", { gonderen: "{{degisken.ik_eposta}}", alici: "{{tetik.kayit.eposta}}", konu: "Başvurun hakkında", govde: "{{adim.s2.cikti}}" }),
  ], [PROJE, SIR("Resend", "RESEND_API_KEY"), "ik_eposta değişkenini ekle"], { sektor: ["saas", "ajans"] }),

  /* ───────── Finans ───────── */
  t("fatura-eposta-cikar", "finans", "Gelen faturayı tabloya işle", "Faturalar adresine gelen e-postadan firma, tutar, vade ve fatura numarasını çıkarıp faturalar tablosuna yazar.", eposta(), [
    ajan("s1", "Bilgileri çıkar", "E-posta konusu: {{tetik.konu}}\nGönderen: {{tetik.gonderen}}\nMetin:\n{{tetik.metin | kisalt(10000)}}\n\nFaturadaki bilgileri çıkar. Tutar sayı olsun, vade YYYY-AA-GG.", [["firma", "metin"], ["faturaNo", "metin"], ["tutar", "sayi"], ["vade", "metin"], ["kdv", "sayi"]]),
    kayit("s2", "Faturayı kaydet", "faturalar", "{\"firma\": \"{{adim.s1.firma}}\", \"faturaNo\": \"{{adim.s1.faturaNo}}\", \"tutar\": {{adim.s1.tutar}}, \"vade\": \"{{adim.s1.vade}}\", \"kdv\": {{adim.s1.kdv}}, \"durum\": \"bekliyor\", \"kaynak\": \"{{tetik.gonderen}}\"}"),
  ], ["Gelen e-posta tetiğindeki adrese fatura e-postalarını yönlendir", PROJE], { sektor: ["hizmet", "ajans", "eticaret"] }),
  t("odeme-muhasebe-airtable", "finans", "Ödemeleri muhasebe tablosuna aktar", "Her ödenen siparişi tarih, tutar, KDV ve sağlayıcıyla düzenleyip Airtable muhasebe tablosuna ekler.", odeme(["odendi", "iade"]), [
    ayarla("s1", "Kaydı hazırla", [["Tarih", "{{simdi | tarih(\"kisa\")}}", "metin"], ["Sipariş", "{{tetik.siparisNo}}", "metin"], ["Tutar", "{{tetik.tutar}}", "sayi"], ["KDV", "{{tetik.tutar | carpi(0.2) | bolu(1.2) | yuvarla(2)}}", "sayi"], ["Tür", "{{tetik.durum | esitse(\"iade\", \"İade\", \"Satış\")}}", "metin"], ["Sağlayıcı", "{{tetik.saglayici}}", "metin"]]),
    uyg("s2", "Airtable'a ekle", "airtable", "ekle", { taban: "{{degisken.airtable_taban}}", tablo: "Muhasebe", alanlar: "{{adim.s1}}" }),
  ], ["Tetikte projeyi seç", SIR("Airtable", "AIRTABLE_TOKEN"), "airtable_taban değişkenini ekle"], { sektor: ["eticaret"] }),
  t("doviz-kuru", "finans", "Günlük döviz kurunu kaydet ve paylaş", "Her iş günü 10.00'da Avrupa Merkez Bankası kaynaklı dolar ve avro kurunu çeker, değişkene yazar ve ekibe paylaşır.", haftaici("10:00"), [
    http("s1", "Kurları çek", "GET", "https://api.frankfurter.app/latest?from=USD&to=TRY,EUR"),
    depo("s2", "Önceki kur", "oku", "usd_try", { kapsam: "hesap", deger: "0" }),
    depo("s3", "Yeni kuru yaz", "yaz", "usd_try", { kapsam: "hesap", deger: "{{adim.s1.govde.rates.TRY}}" }),
    uyg("s4", "Ekibe paylaş", "slack", "kanca", { metin: "Bugün 1 dolar {{adim.s1.govde.rates.TRY | yuvarla(4)}} TL (dün {{adim.s2.deger | yuvarla(4)}})." }),
  ], [SIR("Slack", "SLACK_WEBHOOK_URL"), "Diğer sistemlerde Depo adımıyla usd_try anahtarını (bütün sistemler) okuyabilirsin"], { sektor: ["eticaret", "turizm"] }),
  t("abonelik-yenileme", "finans", "Abonelik yenileme hatırlatması", "Her sabah abonelik tablosunda 3 gün içinde yenilenecekleri bulur ve müşteriye hatırlatma e-postası gönderir.", gunluk("09:00"), [
    bul("s1", "Abonelikler", "abonelikler", [k("durum", "esit", "aktif")], { sinir: 500 }),
    dongu("s2", "Her abonelik", "{{adim.s1.kayitlar}}", [
      suz("s3", "3 gün kaldı mı", [k("{{dongu.oge.yenileme | gun_farki}}", "esit", "3")]),
      uyg("s4", "Hatırlat", "resend", "eposta", { gonderen: "{{degisken.gonderen_eposta}}", alici: "{{dongu.oge.eposta}}", konu: "Aboneliğin 3 gün sonra yenileniyor", govde: "Merhaba {{dongu.oge.ad}}, {{dongu.oge.paket}} aboneliğin {{dongu.oge.yenileme | tarih}} günü {{dongu.oge.tutar | tl}} ile yenilenecek." }),
    ]),
  ], [PROJE, SIR("Resend", "RESEND_API_KEY")], { sektor: ["saas"] }),
  t("geciken-odeme", "finans", "Geciken ödemeye kibar hatırlatma", "Durumu gecikti olan her fatura için yapay zekâ kişiye özel kibar bir hatırlatma yazar ve gönderir; aynı faturaya 3 günde bir.", haftaici("11:00"), [
    bul("s1", "Geciken faturalar", "faturalar", [k("durum", "esit", "gecikti")], { sinir: 50 }),
    dongu("s2", "Her fatura", "{{adim.s1.kayitlar}}", [
      depo("s3", "Yakın zamanda yazıldı mı", "goruldu", "geciken_hatirlatma", { deger: "{{dongu.oge.id}}", sure: 3 }),
      ajan("s4", "Hatırlatma yaz", "{{dongu.oge.firma}} firmasının {{dongu.oge.faturaNo}} numaralı {{dongu.oge.tutar | tl}} faturası {{dongu.oge.vade | gun_farki | mutlak}} gün gecikti. İlişkiyi koruyan, kibar 4 cümlelik Türkçe hatırlatma yaz."),
      uyg("s5", "Gönder", "resend", "eposta", { gonderen: "{{degisken.gonderen_eposta}}", alici: "{{dongu.oge.eposta}}", konu: "Ödeme hatırlatması: {{dongu.oge.faturaNo}}", govde: "{{adim.s4.cikti}}" }),
    ]),
  ], [PROJE, SIR("Resend", "RESEND_API_KEY")], { sektor: ["hizmet", "ajans"] }),
  t("fis-siniflandir", "finans", "Masraf fişini kategorile", "Fiş e-postası gelince masrafı kategoriye ayırır (yemek, ulaşım, yazılım, diğer) ve tutarıyla kaydeder.", eposta(), [
    ajan("s1", "Fişi oku", "Konu: {{tetik.konu}}\n{{tetik.metin | kisalt(6000)}}\n\nFişteki toplam tutarı ve satıcıyı çıkar.", [["tutar", "sayi"], ["satici", "metin"]]),
    sinif("s2", "Kategori", "{{adim.s1.satici}}: {{tetik.konu}}", [
      ["Yemek", "Restoran, kafe, market, yemek siparişi", [kayit("s3", "Kaydet", "masraflar", "{\"kategori\": \"Yemek\", \"tutar\": {{adim.s1.tutar}}, \"satici\": \"{{adim.s1.satici}}\"}")]],
      ["Ulaşım", "Taksi, uçak, otobüs, yakıt, otopark", [kayit("s4", "Kaydet", "masraflar", "{\"kategori\": \"Ulaşım\", \"tutar\": {{adim.s1.tutar}}, \"satici\": \"{{adim.s1.satici}}\"}")]],
      ["Yazılım", "Yazılım aboneliği, bulut, alan adı", [kayit("s5", "Kaydet", "masraflar", "{\"kategori\": \"Yazılım\", \"tutar\": {{adim.s1.tutar}}, \"satici\": \"{{adim.s1.satici}}\"}")]],
    ], [kayit("s6", "Kaydet", "masraflar", "{\"kategori\": \"Diğer\", \"tutar\": {{adim.s1.tutar}}, \"satici\": \"{{adim.s1.satici}}\"}")]),
  ], ["Fiş e-postalarını gelen e-posta adresine yönlendir", PROJE], { sektor: ["hizmet", "ajans", "saas"] }),
  t("aylik-gelir-raporu", "finans", "Aylık gelir raporu", "Her ayın 1'inde siparişleri kategoriye göre gruplar, ciroyu hesaplar ve yönetime yorumlu rapor e-postası gönderir.", aylik(1, "08:00"), [
    bul("s1", "Siparişler", "siparisler", [], { sinir: 1000 }),
    paralel("s2", "Hesapla", [
      ["Toplam", [don("s3", "Ciro", "liste", "ozetle", "{{adim.s1.kayitlar}}", "tutar")]],
      ["Kategoriler", [don("s4", "Kategoriye göre", "liste", "grupla", "{{adim.s1.kayitlar}}", "kategori", "tutar")]],
    ]),
    ajan("s5", "Raporu yaz", "Geçen ayın cirosu {{adim.s3.toplam | tl}}, sipariş {{adim.s3.oge}}, ortalama sepet {{adim.s3.ortalama | tl}}. Kategoriler: {{adim.s4.sonuc | json}}. Yönetim için kısa yorumlu bir aylık rapor yaz. HTML kullan.", [["konu", "metin"], ["html", "metin"]]),
    uyg("s6", "Gönder", "resend", "eposta", { gonderen: "{{degisken.gonderen_eposta}}", alici: "{{degisken.yonetim_eposta}}", konu: "{{adim.s5.konu}}", govde: "{{adim.s5.html}}" }),
  ], [PROJE, SIR("Resend", "RESEND_API_KEY"), "yonetim_eposta değişkenini ekle"], { sektor: ["eticaret", "restoran"] }),
  t("stripe-musteri-formu", "finans", "Kayıt formundan Stripe müşterisi", "Kurumsal kayıt formu gelince Stripe'ta müşteri açılır, aynı kişi HubSpot'a eklenir; kimlik formda gösterilir.", formS("Kurumsal kayıt", "Faturalandırma için bilgilerini gir.", { bitis: "sonuc", mesaj: "Kaydın tamam" }), [
    uyg("s1", "Stripe müşterisi", "stripe", "musteri", { eposta: "{{tetik.eposta}}", ad: "{{tetik.firma}}", telefon: "{{tetik.telefon}}" }),
    uyg("s2", "HubSpot kişisi", "hubspot", "kisi", { eposta: "{{tetik.eposta}}", sirket: "{{tetik.firma}}", telefon: "{{tetik.telefon}}", ek: "{\"lifecyclestage\": \"customer\"}" }),
    yanit("s3", "Müşteri numaran {{adim.s1.yanit.id}}. Faturaların bu e-postaya gelecek."),
  ], [FORM, SIR("Stripe", "STRIPE_SECRET_KEY"), SIR("HubSpot", "HUBSPOT_TOKEN")], { girdi: [z("firma", "Firma adı"), z("eposta", "Fatura e-postası", "eposta"), g("telefon", "Telefon", "telefon")], sektor: ["saas"] }),
  t("butce-asimi", "finans", "Aylık bütçe aşılınca uyar", "Her yeni masrafta ayın toplamını depoda biriktirir; bütçeyi aşınca yöneticiye bir kez uyarı gönderir.", tablo("masraflar"), [
    depo("s1", "Ay toplamına ekle", "artir", "masraf_{{simdi | tarih(\"YYYY-AA\")}}", { miktar: "{{tetik.kayit.tutar}}", sure: 40 }),
    suz("s2", "Bütçe aşıldı mı", [k("{{adim.s1.deger}}", "buyuk", "{{degisken.aylik_butce | varsayilan(\"50000\")}}")]),
    depo("s3", "Bu ay uyarıldı mı", "goruldu", "butce_uyari", { deger: "{{simdi | tarih(\"YYYY-AA\")}}" }),
    uyg("s4", "Uyar", "slack", "kanca", { metin: "Bu ayın masrafı {{adim.s1.deger | tl}} oldu; bütçe {{degisken.aylik_butce | tl}}." }),
  ], [PROJE, SIR("Slack", "SLACK_WEBHOOK_URL"), "aylik_butce değişkenine tutarı yaz"], { sektor: ["ajans", "saas"] }),
  t("iade-kaydi-onay", "finans", "İade kaydını onaydan geçir", "İadeler tablosuna kayıt düşünce muhasebe onayı istenir; onaylanırsa kayıt güncellenir ve muhasebe kanalına not düşülür.", tablo("iadeler"), [
    onay("s1", "Muhasebe onayı", "İade {{tetik.kayit.siparisNo}}", "{{tetik.kayit.tutar | tl}} iade, neden: {{tetik.kayit.neden}}", [
      guncelle("s2", "Onaylandı", "iadeler", "{{tetik.kayit.id}}", "{\"durum\": \"onaylandi\", \"onayTarihi\": \"{{simdi}}\"}"),
      uyg("s3", "Kanala not", "slack", "kanca", { metin: "İade onaylandı: {{tetik.kayit.siparisNo}}, {{tetik.kayit.tutar | tl}}" }),
    ], [guncelle("s4", "Reddedildi", "iadeler", "{{tetik.kayit.id}}", "{\"durum\": \"reddedildi\"}")]),
  ], [PROJE, SIR("Slack", "SLACK_WEBHOOK_URL")], { sektor: ["eticaret"] }),

  /* ───────── Yazılım ve BT ───────── */
  t("hata-github-konu", "yazilim", "Hata bildirimini GitHub konusuna çevir", "Hata izleme aracından gelen bildirim özetlenir; aynı hata ilk kez geliyorsa GitHub'da etiketli konu açılır.", kanca(), [
    depo("s1", "Daha önce açıldı mı", "goruldu", "acilan_hatalar", { deger: "{{tetik.data.issue.id}}{{tetik.id}}" }),
    ajan("s2", "Özetle", "Hata bildirimi: {{tetik | json | kisalt(8000)}}. Geliştirici için başlık, olası neden ve yeniden üretme adımlarını yaz.", [["baslik", "metin"], ["govde", "metin"]]),
    uyg("s3", "GitHub konusu", "github", "konu", { depo: "{{degisken.github_depo}}", baslik: "{{adim.s2.baslik}}", govde: "{{adim.s2.govde}}", etiketler: "hata, otomatik" }),
  ], ["Sentry ya da benzeri araçta web kancası olarak bu sistemin adresini gir", SIR("GitHub", "GITHUB_TOKEN"), "github_depo değişkenine sahip/depo yaz"], { sektor: ["saas"] }),
  t("hata-formu-linear", "yazilim", "Kullanıcı hata raporu formu", "Kullanıcılar hata raporu formunu doldurur; Linear'da öncelikli konu açılır, rapor numarası gösterilir.", formS("Hata bildir", "Gördüğün sorunu anlat, hemen bakalım.", { bitis: "sonuc", mesaj: "Teşekkürler" }), [
    uyg("s1", "Linear konusu", "linear", "konu", { takim: "{{degisken.linear_takim}}", baslik: "[Kullanıcı] {{tetik.baslik}}", aciklama: "Sayfa: {{tetik.sayfa}}\nTarayıcı: {{tetik.tarayici}}\nGönderen: {{tetik.eposta}}\n\n{{tetik.ayrinti}}", oncelik: "{{tetik.etki | esitse(\"Hiç kullanamıyorum\", \"1\", \"3\")}}" }),
    yanit("s2", "Rapor numaran {{adim.s1.yanit.data.issueCreate.issue.identifier | varsayilan(\"oluşturuldu\")}}."),
  ], [FORM, SIR("Linear", "LINEAR_API_KEY"), "linear_takim değişkenini ekle"], { girdi: [z("baslik", "Kısa başlık"), z("ayrinti", "Ne oldu", "uzunMetin"), g("sayfa", "Hangi sayfada"), g("tarayici", "Tarayıcı", "secim", { secenekler: ["Chrome", "Safari", "Firefox", "Edge", "Mobil uygulama"] }), z("etki", "Etkisi", "secim", { secenekler: ["Hiç kullanamıyorum", "Can sıkıcı", "Küçük"] }), g("eposta", "E-posta", "eposta")], sektor: ["saas"] }),
  t("surum-notu-discord", "yazilim", "GitHub sürümünü Türkçe duyur", "GitHub'da sürüm yayınlanınca değişiklikleri kullanıcı diliyle Türkçeye çevirip Discord'da duyurur.", kanca(), [
    suz("s1", "Yayın olayı mı", [k("{{tetik.action}}", "esit", "published")]),
    ajan("s2", "Notu yaz", "Sürüm {{tetik.release.tag_name}}: {{tetik.release.body | kisalt(8000)}}. Kullanıcıların anlayacağı dille, madde madde kısa bir Türkçe sürüm notu yaz."),
    uyg("s3", "Discord'da duyur", "discord", "mesaj", { metin: "**{{tetik.release.tag_name}} yayında**\n{{adim.s2.cikti | kisalt(1700)}}\n{{tetik.release.html_url}}" }),
  ], ["GitHub deposunda Settings, Webhooks bölümünde Releases olayı için web kancası ekle", SIR("Discord", "DISCORD_WEBHOOK_URL")], { sektor: ["saas", "topluluk"] }),
  t("kayit-posthog", "yazilim", "Yeni üyeyi PostHog'a olay olarak yaz", "Uygulamana yeni üye eklenince PostHog'a kayıt olayı gönderir; paket ve kaynak özellik olarak eklenir.", tablo("uyeler"), [
    uyg("s1", "Olay gönder", "posthog", "olay", { olay: "uye_oldu", kisi: "{{tetik.kayit.eposta}}", ozellikler: "{\"paket\": \"{{tetik.kayit.paket}}\", \"kaynak\": \"{{tetik.kayit.kaynak}}\"}", bolge: "eu" }),
  ], [PROJE, SIR("PostHog", "POSTHOG_PROJE_ANAHTARI")], { sektor: ["saas"] }),
  t("form-supabase", "yazilim", "Form yanıtlarını Supabase'e yaz", "Herkese açık form gönderimlerini Supabase tablona satır olarak ekler.", formS("İletişim", "Bize yaz, en kısa sürede dönelim.", { mesaj: "Mesajın alındı." }), [
    uyg("s1", "Satır ekle", "supabase", "ekle", { tablo: "iletisim", satir: "{\"ad\": \"{{tetik.ad}}\", \"eposta\": \"{{tetik.eposta}}\", \"mesaj\": \"{{tetik.mesaj}}\"}" }),
  ], [FORM, SIR("Supabase", "SUPABASE_URL", "SUPABASE_KEY"), "Supabase'te ad, eposta, mesaj sütunlu iletisim tablosunu oluştur"], { girdi: [z("ad", "Ad"), z("eposta", "E-posta", "eposta"), z("mesaj", "Mesaj", "uzunMetin")], sektor: ["saas"] }),
  t("sizinti-denetimi", "yazilim", "Paylaşılan metinde gizli anahtar avı", "Gelen metinde API anahtarı, kart ya da kimlik numarası varsa engeller ve güvenlik kanalına uyarı düşer.", kanca(), [
    guv("s1", "Gizli veri denetimi", "{{tetik.metin}}", "engelle", [], [uyg("s2", "Güvenlik uyarısı", "slack", "kanca", { metin: "Gizli veri yakalandı: {{adim.s1.ihlaller | alan(\"ad\") | birlestir}}. Kaynak: {{tetik.kaynak | varsayilan(\"bilinmiyor\")}}" })]),
    yanit("s3", "{\"temiz\": {{adim.s1.temiz}}}", "json"),
  ], ["Denetlenecek metni (metin, kaynak) web kancasına gönder", SIR("Slack", "SLACK_WEBHOOK_URL")], { sektor: ["saas"] }),
  t("api-saglik-kaydi", "yazilim", "API sağlığını kaydet", "Her saat API'ni çağırır, durum kodunu ve yanıt süresini kaydeder; 200 dışı yanıtta Telegram uyarısı gönderir.", saatlik(), [
    yap("s1", "API'yi çağır", "http", { yontem: "GET", url: "{{degisken.api_saglik_adresi}}", basliklar: "", govde: "", zamanAsimi: 20 }, { hata: "devam" }),
    kayit("s2", "Kaydet", "api_saglik", "{\"durum\": {{adim.s1.durum | varsayilan(0)}}, \"zaman\": \"{{simdi}}\", \"hata\": \"{{adim.s1.hata}}\"}"),
    suz("s3", "Sorun var mı", [k("{{adim.s1.durum | varsayilan(0)}}", "esit-degil", "200")]),
    uyg("s4", "Uyar", "telegram", "mesaj", { sohbet: "{{degisken.telegram_sohbet}}", metin: "API sorunu: {{adim.s1.durum | varsayilan(\"yanıt yok\")}} {{adim.s1.hata}}" }),
  ], [PROJE, SIR("Telegram", "TELEGRAM_BOT_TOKEN"), "api_saglik_adresi ve telegram_sohbet değişkenlerini ekle"], { sektor: ["saas"] }),
  t("deploy-bildirimi", "yazilim", "Yayın bildirimini ekibe ilet", "Vercel ya da Netlify yayın olayı gelince başarılı ve başarısız yayınları ayrı mesajla ekip kanalına yazar.", kanca(), [
    yon("s1", "Sonuç", [["Başarısız", [k("{{tetik.type}} {{tetik.state}}", "desen", "error|failed")], [uyg("s2", "Hata bildir", "slack", "kanca", { metin: "Yayın başarısız: {{tetik.payload.name}}{{tetik.name}} {{tetik.payload.url}}{{tetik.url}}" })]]], [uyg("s3", "Başarı bildir", "slack", "kanca", { metin: "Yayın tamam: {{tetik.payload.name}}{{tetik.name}} {{tetik.payload.url}}{{tetik.url}}" })]),
  ], ["Vercel ya da Netlify'da yayın web kancası olarak bu adresi gir", SIR("Slack", "SLACK_WEBHOOK_URL")], { sektor: ["saas", "ajans"] }),
  t("musteri-talebi-jira", "yazilim", "Özellik isteğini Jira'ya taşı", "Ürün içi özellik isteği formu Jira'da Story olur; benzer istek daha önce geldiyse sayaç artar.", formS("Özellik iste", "Ürünümüzde ne görmek istersin?", { mesaj: "Teşekkürler, isteğin ürün ekibine ulaştı." }), [
    depo("s1", "İstek sayacı", "artir", "istek_{{tetik.baslik | adres_dostu | kisalt(40)}}", { miktar: 1 }),
    yon("s2", "İlk kez mi", [["İlk kez", [k("{{adim.s1.deger}}", "esit", "1")], [uyg("s3", "Jira Story", "jira", "kayit", { proje: "{{degisken.jira_proje}}", tur: "Story", ozet: "{{tetik.baslik}}", aciklama: "{{tetik.ayrinti}}\n\nİsteyen: {{tetik.eposta}}" })]]], [uyg("s4", "Sayacı bildir", "slack", "kanca", { metin: "\"{{tetik.baslik}}\" isteği {{adim.s1.deger}}. kez geldi." })]),
  ], [FORM, SIR("Jira", "JIRA_SITE", "JIRA_EPOSTA", "JIRA_TOKEN"), SIR("Slack", "SLACK_WEBHOOK_URL"), "jira_proje değişkenini ekle"], { girdi: [z("baslik", "İstek"), g("ayrinti", "Ayrıntı", "uzunMetin"), g("eposta", "E-posta", "eposta")], sektor: ["saas"] }),

  /* ───────── Yapay zekâ servisleri (API ve MCP olarak yayınlanmaya hazır) ───────── */
  t("metin-siniflandir-api", "yz", "Metin sınıflandırma servisi", "Gelen metni kategoriye ayırıp JSON döndürür; API ya da MCP aracı olarak yayınlayıp başka uygulamalardan çağır.", elleForm(), [
    sinif("s1", "Kategori", "{{tetik.metin}}", [["Satış", "Satın alma, fiyat, teklif", []], ["Destek", "Sorun, hata, şikâyet", []], ["Diğer konular", "İş birliği, basın, iş başvurusu", []]]),
    yanit("s2", "{\"kategori\": \"{{adim.s1.dalAdi}}\", \"guven\": {{adim.s1.guven}}, \"gerekce\": \"{{adim.s1.gerekce}}\"}", "json"),
  ], ["Sağ üstteki Dışarı aç düğmesiyle API ya da MCP olarak yayınla"], { girdi: [z("metin", "Sınıflandırılacak metin", "uzunMetin", { aciklama: "Müşteri mesajı ya da e-posta metni" })], sektor: ["saas"] }),
  t("ozet-api", "yz", "Belge özetleme servisi", "Uzun metni istenen uzunlukta özetler ve ana maddeleri çıkarır; API ve MCP olarak çağrılabilir.", elleForm(), [
    ajan("s1", "Özetle", "Şu metni {{tetik.uzunluk}} uzunlukta Türkçe özetle ve 3 ana maddeyi çıkar:\n\n{{tetik.metin | kisalt(40000)}}", [["ozet", "metin"], ["maddeler", "liste"]]),
    yanit("s2", "{\"ozet\": \"{{adim.s1.ozet}}\", \"maddeler\": {{adim.s1.maddeler}}}", "json"),
  ], ["Dışarı aç ile API ya da MCP olarak yayınla"], { girdi: [z("metin", "Metin", "uzunMetin"), g("uzunluk", "Uzunluk", "secim", { secenekler: ["kısa", "orta", "ayrıntılı"], varsayilan: "kısa" })] }),
  t("ceviri-api", "yz", "Çeviri servisi", "Metni hedef dile çevirir, tonu korur; sözlük değişkeniyle marka terimlerini sabit tutar.", elleForm(), [
    ajan("s1", "Çevir", "Şu metni {{tetik.hedef}} diline çevir. Tonu koru. Şu terimleri çevirme: {{degisken.ceviri_sozlugu | varsayilan(\"yok\")}}.\n\n{{tetik.metin}}"),
    yanit("s2", "{{adim.s1.cikti}}"),
  ], ["Dışarı aç ile API olarak yayınla"], { girdi: [z("metin", "Metin", "uzunMetin"), z("hedef", "Hedef dil", "secim", { secenekler: ["İngilizce", "Almanca", "Arapça", "Rusça", "Türkçe"] })] }),
  t("web-arastirma-raporu", "yz", "Web araştırması ve Notion raporu", "Konu yazarsın; web'de kaynak arar, kaynaklı bir rapor yazar ve Notion'a sayfa olarak ekler.", elleForm(), [
    uyg("s1", "Kaynak ara", "exa", "ara", { sorgu: "{{tetik.konu}}", adet: "8" }),
    ajan("s2", "Raporu yaz", "Konu: {{tetik.konu}}. Kaynaklar: {{adim.s1.yanit.results | json | kisalt(20000)}}. Kaynak bağlantılarıyla, başlıklı, 500 kelimelik Türkçe bir rapor yaz."),
    uyg("s3", "Notion'a kaydet", "notion", "sayfa", { veritabani: "{{degisken.notion_arastirma_db}}", baslik: "{{tetik.konu}}", icerik: "{{adim.s2.cikti}}" }),
  ], [SIR("Exa", "EXA_API_KEY"), SIR("Notion", "NOTION_TOKEN"), "notion_arastirma_db değişkenini ekle"], { girdi: [z("konu", "Araştırma konusu")] }),
  t("sayfa-ozetleyici", "yz", "Web sayfası özetleyici", "Bir adres verirsin; sayfa okunur, özet ve ana fikirler döner. Sohbet ya da API olarak kullanılabilir.", elleForm(), [
    uyg("s1", "Sayfayı oku", "firecrawl", "oku", { adres: "{{tetik.adres}}" }),
    ajan("s2", "Özetle", "Sayfa: {{adim.s1.yanit.data.metadata.title}}\n{{adim.s1.yanit.data.markdown | kisalt(30000)}}\n\nTürkçe 5 cümlelik özet ve 3 ana fikir yaz."),
    yanit("s3", "{{adim.s2.cikti}}"),
  ], [SIR("Firecrawl", "FIRECRAWL_API_KEY")], { girdi: [z("adres", "Sayfa adresi")] }),
  t("toplu-icerik", "yz", "Konu listesinden toplu içerik", "Her satıra bir konu yazarsın; her konu için ürün açıklaması üretilip tabloya ayrı kayıt olarak yazılır.", elleForm(), [
    dongu("s1", "Her konu", "{{tetik.konular}}", [
      ajan("s2", "Yaz", "{{dongu.oge}} için 60 kelimelik satış odaklı Türkçe açıklama ve 5 anahtar kelime yaz.", [["aciklama", "metin"], ["kelimeler", "liste"]]),
      kayit("s3", "Kaydet", "toplu_icerik", "{\"konu\": \"{{dongu.oge}}\", \"aciklama\": \"{{adim.s2.aciklama}}\", \"kelimeler\": {{adim.s2.kelimeler}}}"),
    ], { sinir: 50 }),
  ], [PROJE], { girdi: [z("konular", "Konular, her satıra bir tane", "uzunMetin")], sektor: ["eticaret", "ajans"] }),
  t("gorsel-telegram", "yz", "İstemden görsel üret ve Telegram'a yolla", "İstemi yazarsın; Vayra görseli üretir ve Telegram sohbetine açıklamasıyla gönderir.", elleForm(), [
    arac("s1", "Görseli üret", "gorsel_uret", "{{tetik.istem}}", "1:1"),
    uyg("s2", "Telegram'a gönder", "telegram", "gorsel", { sohbet: "{{degisken.telegram_sohbet}}", gorsel: "{{adim.s1.gorseller | ilk}}", aciklama: "{{tetik.istem | kisalt(200)}}" }),
  ], [SIR("Telegram", "TELEGRAM_BOT_TOKEN"), "telegram_sohbet değişkenini ekle"], { girdi: [z("istem", "Görsel istemi", "uzunMetin")] }),
  t("kisisel-veri-temizle", "yz", "Kişisel veri temizleme servisi", "Gelen metindeki TC kimlik, IBAN, telefon, e-posta ve kart numaralarını maskeleyip temiz metni döndürür.", elleForm(), [
    guv("s1", "Maskele", "{{tetik.metin}}"),
    yanit("s2", "{\"metin\": \"{{adim.s1.metin}}\", \"bulunan\": {{adim.s1.ihlaller | alan(\"ad\")}}}", "json"),
  ], ["Dışarı aç ile API olarak yayınla"], { girdi: [z("metin", "Metin", "uzunMetin")], sektor: ["saas", "saglik"] }),
  t("duygu-api", "yz", "Duygu analizi servisi", "Yorum ya da mesajın duygusunu (olumlu, olumsuz, nötr) ve güven puanını JSON olarak döndürür.", elleForm(), [
    sinif("s1", "Duygu", "{{tetik.metin}}", [["Olumlu", "Memnun, öven, teşekkür eden", []], ["Olumsuz", "Şikâyet eden, kızgın, hayal kırıklığı", []], ["Nötr", "Bilgi soran ya da duygusu belirsiz", []]]),
    yanit("s2", "{\"duygu\": \"{{adim.s1.dalAdi}}\", \"guven\": {{adim.s1.guven}}}", "json"),
  ], ["Dışarı aç ile API ya da MCP olarak yayınla"], { girdi: [z("metin", "Metin", "uzunMetin")] }),
  t("seslendirme-api", "yz", "Metni seslendir", "Gelen metni Vayra sesiyle seslendirir ve ses dosyasının adresini döndürür.", elleForm(), [
    arac("s1", "Seslendir", "ses_uret", "{{tetik.metin}}"),
    yanit("s2", "{\"ses\": \"{{adim.s1.url}}\"}", "json"),
  ], ["Dışarı aç ile API olarak yayınla"], { girdi: [z("metin", "Metin", "uzunMetin")] }),
  t("e-posta-yazici-sohbet", "yz", "E-posta yazma asistanı sohbeti", "Ekibin için sohbet sayfası: ne yazmak istediğini anlatırsın, asistan önceki mesajları da hatırlayarak e-postayı yazar.", sohbet("E-posta asistanı", "Kime, ne hakkında e-posta yazalım?", ["Ödemesi geciken müşteriye kibar hatırlatma", "Toplantı erteleme e-postası"]), [
    ajan("s1", "Yaz", "Önceki konuşma:\n{{tetik.gecmisMetni}}\n\nİstek: {{tetik.mesaj}}\n\nİsteğe uygun, konu satırlı, Türkçe ve profesyonel bir e-posta yaz. Düzeltme istenirse önceki taslağı güncelle."),
    yanit("s2", "{{adim.s1.cikti}}"),
  ], ["Sohbet sayfasının adresini ekibinle paylaş"], { sektor: ["ajans", "saas", "hizmet"] }),

  /* ───────── Kişisel verimlilik ───────── */
  t("sabah-plani", "verimlilik", "Her sabah günün planı", "Hafta içi her sabah 07.30'da günün öncelikleri, hava durumu ve kısa bir motivasyon notu Telegram'a gelir.", haftaici("07:30"), [
    http("s1", "Hava durumu", "GET", "https://api.open-meteo.com/v1/forecast?latitude=41.01&longitude=28.98&current=temperature_2m,precipitation&timezone=Europe%2FIstanbul"),
    ajan("s2", "Planı yaz", "Bugün {{tarih}}, {{simdi | gun_adi}}. İstanbul'da hava {{adim.s1.govde.current.temperature_2m}} derece, yağış {{adim.s1.govde.current.precipitation}} mm. Önceliklerim: {{degisken.haftalik_hedefler | varsayilan(\"belirtilmedi\")}}. 4 satırlık sabah planı ve bir cümlelik motivasyon yaz."),
    uyg("s3", "Telegram'a gönder", "telegram", "mesaj", { sohbet: "{{degisken.telegram_sohbet}}", metin: "{{adim.s2.cikti}}" }),
  ], [SIR("Telegram", "TELEGRAM_BOT_TOKEN"), "telegram_sohbet ve haftalik_hedefler değişkenlerini ekle", "Hava durumu adresindeki enlem ve boylamı kendi şehrine göre değiştir"]),
  t("okuma-listesi", "verimlilik", "Bağlantıyı okuma listesine ekle", "Telefondan gönderdiğin bağlantının başlığı ve özeti çıkarılır, Notion okuma listene sayfa olarak eklenir.", kanca(), [
    uyg("s1", "Sayfayı oku", "firecrawl", "oku", { adres: "{{tetik.adres}}" }),
    ajan("s2", "Özetle", "{{adim.s1.yanit.data.markdown | kisalt(15000)}}\n\nİki cümlelik Türkçe özet yaz.", [["ozet", "metin"]]),
    uyg("s3", "Notion'a ekle", "notion", "sayfa", { veritabani: "{{degisken.notion_okuma_db}}", baslik: "{{adim.s1.yanit.data.metadata.title | varsayilan(\"Okunacak yazı\")}}", icerik: "{{adim.s2.ozet}}\n\n{{tetik.adres}}" }),
  ], ["Kısayollar uygulamasıyla bağlantıyı (adres) web kancasına gönder", SIR("Firecrawl", "FIRECRAWL_API_KEY"), SIR("Notion", "NOTION_TOKEN"), "notion_okuma_db değişkenini ekle"]),
  t("hatirlatici-bot", "verimlilik", "Telegram'dan hatırlatıcı ekle", "Telegram botuna doğal dille yazarsın (yarın 10'da faturayı öde); Todoist'e tarihli görev olarak eklenir ve bot onaylar.", kanca("ok"), [
    suz("s1", "Mesaj var mı", [k("{{tetik.message.text}}", "bos-degil")]),
    ajan("s2", "Ayrıştır", "Şu hatırlatma isteğini görev ve zaman olarak ayır: {{tetik.message.text}}. Zamanı Todoist'in anlayacağı Türkçe ifadeyle yaz (ör. yarın 10:00).", [["gorev", "metin"], ["zaman", "metin"]]),
    uyg("s3", "Todoist görevi", "todoist", "gorev", { icerik: "{{adim.s2.gorev}}", zaman: "{{adim.s2.zaman}}", oncelik: "2" }),
    uyg("s4", "Onayla", "telegram", "mesaj", { sohbet: "{{tetik.message.chat.id}}", metin: "Eklendi: {{adim.s2.gorev}} ({{adim.s2.zaman}})" }),
  ], [SIR("Telegram", "TELEGRAM_BOT_TOKEN"), SIR("Todoist", "TODOIST_TOKEN"), "Telegram setWebhook ile botu bu web kancasına bağla"]),
  t("kur-alarmi", "verimlilik", "Dolar kuru eşiği geçince haber ver", "Her saat doları denetler; belirlediğin eşiği geçerse Telegram'a yazar, aynı gün tekrar rahatsız etmez.", saatlik(), [
    http("s1", "Kuru çek", "GET", "https://api.frankfurter.app/latest?from=USD&to=TRY"),
    suz("s2", "Eşik geçildi mi", [k("{{adim.s1.govde.rates.TRY}}", "buyuk", "{{degisken.kur_esigi | varsayilan(\"45\")}}")]),
    depo("s3", "Bugün bildirildi mi", "goruldu", "kur_alarmi", { deger: "{{tarih}}", sure: 2 }),
    uyg("s4", "Haber ver", "telegram", "mesaj", { sohbet: "{{degisken.telegram_sohbet}}", metin: "Dolar {{adim.s1.govde.rates.TRY | yuvarla(3)}} TL oldu; eşiğin {{degisken.kur_esigi}}." }),
  ], [SIR("Telegram", "TELEGRAM_BOT_TOKEN"), "kur_esigi ve telegram_sohbet değişkenlerini ekle"]),
  t("hizli-not", "verimlilik", "Hızlı not formu Notion'a", "Kendine özel kısa bir form: başlık ve not yazarsın, etiketiyle birlikte Notion'a sayfa olur.", formS("Hızlı not", "Aklına geleni yaz, Notion'a düşsün.", { mesaj: "Not eklendi.", tekrar: true }), [
    uyg("s1", "Notion sayfası", "notion", "sayfa", { veritabani: "{{degisken.notion_not_db}}", baslik: "{{tetik.baslik}}", icerik: "{{tetik.not}}", ozellikler: "{\"Etiket\": {\"select\": {\"name\": \"{{tetik.etiket}}\"}}}" }),
  ], [FORM, SIR("Notion", "NOTION_TOKEN"), "Notion veritabanında Etiket adlı seçim sütunu olsun"], { girdi: [z("baslik", "Başlık"), g("not", "Not", "uzunMetin"), g("etiket", "Etiket", "secim", { secenekler: ["Fikir", "Yapılacak", "Okunacak"], varsayilan: "Fikir" })] }),
  t("haftalik-hedef", "verimlilik", "Pazartesi hedef, cuma değerlendirme", "Pazartesi sabahı haftalık hedeflerini sorar ve depoya yazar; cuma günü aynı hedeflerle değerlendirme mesajı gönderir.", haftalik(1, "08:00"), [
    depo("s1", "Geçen haftanın hedefleri", "oku", "haftalik_hedefler", { kapsam: "hesap", deger: "henüz yok" }),
    ajan("s2", "Mesaj yaz", "Geçen haftanın hedefleri: {{adim.s1.deger}}. Yeni haftaya başlarken 3 hedef belirlememe yardım eden kısa, enerjik bir Türkçe mesaj yaz."),
    uyg("s3", "Telegram'a gönder", "telegram", "mesaj", { sohbet: "{{degisken.telegram_sohbet}}", metin: "{{adim.s2.cikti}}" }),
  ], [SIR("Telegram", "TELEGRAM_BOT_TOKEN"), "Hedeflerini Depo adımıyla haftalik_hedefler anahtarına yazan küçük bir form sistemi kurabilirsin"]),
  t("fatura-gun-hatirlat", "verimlilik", "Ayın son günlerinde ödemeleri hatırlat", "Her ayın 25'inde düzenli ödemelerini listeler ve Todoist'e o ayın görevleri olarak ekler.", aylik(25, "09:00"), [
    don("s1", "Ödemeler", "metin", "bol", "{{degisken.duzenli_odemeler | varsayilan(\"Kira, Elektrik, İnternet\")}}", ","),
    dongu("s2", "Her ödeme", "{{adim.s1.sonuc}}", [uyg("s3", "Todoist görevi", "todoist", "gorev", { icerik: "{{dongu.oge}} öde", zaman: "ayın 30'u", oncelik: "3" })]),
  ], [SIR("Todoist", "TODOIST_TOKEN"), "duzenli_odemeler değişkenine virgülle ödemelerini yaz"]),
  t("su-icme", "verimlilik", "Gün içinde su hatırlatması", "Hafta içi 10.00 ile 18.00 arası her 2 saatte bir Telegram'dan kısa ve her seferinde farklı bir su hatırlatması gelir.", { tur: "zaman", zaman: { siklik: "haftalik", gunler: [1, 2, 3, 4, 5], saatler: ["10:00", "12:00", "14:00", "16:00", "18:00"] } }, [
    don("s1", "Mesaj seç", "yardimci", "sec", "[\"Bir bardak su zamanı.\", \"Masadan kalk, su iç, biraz esne.\", \"Su şişene bak: yarıladın mı?\", \"Kısa bir mola ve bir bardak su.\"]", "rastgele"),
    uyg("s2", "Hatırlat", "telegram", "mesaj", { sohbet: "{{degisken.telegram_sohbet}}", metin: "{{adim.s1.sonuc}}" }),
  ], [SIR("Telegram", "TELEGRAM_BOT_TOKEN"), "telegram_sohbet değişkenini ekle"]),

  /* ───────── Sektöre özel ek sistemler ───────── */
  t("klinik-hasta-formu", "destek", "Klinik ön kayıt formu", "Hasta ön kayıt formunu doldurur; kişisel veriler maskelenerek özetlenir, kayıt açılır ve sekreterya bilgilendirilir.", formS("Ön kayıt", "Muayeneden önce bilgilerini doldur.", { mesaj: "Ön kaydın alındı; seni arayacağız." }), [
    guv("s1", "Hassas veriyi maskele", "{{tetik.sikayet}}"),
    kayit("s2", "Kaydı aç", "hastalar", "{\"ad\": \"{{tetik.ad}}\", \"telefon\": \"{{tetik.telefon}}\", \"sikayet\": \"{{adim.s1.metin}}\", \"tercih\": \"{{tetik.tercih}}\"}"),
    uyg("s3", "Sekreteryaya yaz", "telegram", "mesaj", { sohbet: "{{degisken.telegram_sohbet}}", metin: "Yeni ön kayıt: {{tetik.ad}}, {{tetik.telefon}}. Tercih: {{tetik.tercih}}" }),
  ], [FORM, PROJE, SIR("Telegram", "TELEGRAM_BOT_TOKEN"), "telegram_sohbet değişkenini ekle"], { girdi: [z("ad", "Ad soyad"), z("telefon", "Telefon", "telefon"), g("dogum", "Doğum tarihi", "tarih"), z("sikayet", "Şikâyetin", "uzunMetin"), g("tercih", "Tercih ettiğin gün", "secim", { secenekler: ["Hafta içi sabah", "Hafta içi öğleden sonra", "Cumartesi"] })], sektor: ["saglik"] }),
  t("kurs-kayit-odeme", "satis", "Kurs kaydı ve ödeme bağlantısı", "Öğrenci kursu seçer; kayıt açılır, Stripe ödeme bağlantısı üretilir ve e-postayla gönderilir, formda da gösterilir.", formS("Kursa kayıt", "Kursunu seç, ödeme bağlantın hemen gelsin.", { bitis: "sonuc", mesaj: "Kaydın açıldı" }), [
    don("s1", "Fiyat kimliği", "yardimci", "arama", "{{tetik.kurs}}", "Başlangıç: price_BASLANGIC\nİleri: price_ILERI", ""),
    uyg("s2", "Ödeme bağlantısı", "stripe", "baglanti", { fiyat: "{{adim.s1.sonuc}}", adet: "1" }),
    kayit("s3", "Kaydı yaz", "kurs_kayitlari", "{\"ad\": \"{{tetik.ad}}\", \"eposta\": \"{{tetik.eposta}}\", \"kurs\": \"{{tetik.kurs}}\", \"odeme\": \"{{adim.s2.yanit.url}}\"}"),
    uyg("s4", "E-postayla gönder", "resend", "eposta", { gonderen: "{{degisken.gonderen_eposta}}", alici: "{{tetik.eposta}}", konu: "{{tetik.kurs}} kaydın", govde: "Merhaba {{tetik.ad}}, ödemeni buradan tamamlayabilirsin: {{adim.s2.yanit.url}}" }),
    yanit("s5", "Ödeme bağlantın: {{adim.s2.yanit.url}} (e-postana da gönderdik)"),
  ], [FORM, PROJE, SIR("Stripe", "STRIPE_SECRET_KEY"), SIR("Resend", "RESEND_API_KEY"), "Arama tablosuna Stripe fiyat kimliklerini yaz"], { girdi: [z("ad", "Ad soyad"), z("eposta", "E-posta", "eposta"), z("kurs", "Kurs", "secim", { secenekler: ["Başlangıç", "İleri"] })], sektor: ["egitim"] }),
  t("odev-teslim", "operasyon", "Ödev teslim formu", "Öğrenci ödev bağlantısını teslim eder; geç teslimler işaretlenir, öğretmene günlük toplu özet gider.", formS("Ödev teslimi", "Ödevinin bağlantısını yapıştır.", { mesaj: "Teslimin alındı {{tetik.ad}}." }), [
    don("s1", "Teslim zamanı", "tarih", "bicim", "{{simdi}}", "kisa-saatli"),
    kayit("s2", "Teslimi kaydet", "teslimler", "{\"ogrenci\": \"{{tetik.ad}}\", \"sinif\": \"{{tetik.sinif}}\", \"odev\": \"{{tetik.odev}}\", \"baglanti\": \"{{tetik.baglanti}}\", \"zaman\": \"{{adim.s1.sonuc}}\"}"),
  ], [FORM, PROJE], { girdi: [z("ad", "Ad soyad"), z("sinif", "Sınıf", "secim", { secenekler: ["9-A", "9-B", "10-A", "10-B"] }), z("odev", "Ödev", "secim", { secenekler: ["Ödev 1", "Ödev 2", "Proje"] }), z("baglanti", "Ödev bağlantısı")], sektor: ["egitim"] }),
  t("emlak-ilan-duyuru", "icerik", "Yeni ilanı sosyal medyaya hazırla", "İlan tablosuna yeni ilan eklenince Instagram metni ve görsel tarifi hazırlanır, ilan görseli üretilip kaydedilir.", tablo("ilanlar"), [
    ajan("s1", "Metni yaz", "Yeni ilan: {{tetik.kayit.baslik}}, {{tetik.kayit.semt}}, {{tetik.kayit.oda}} oda, {{tetik.kayit.metrekare}} metrekare, {{tetik.kayit.fiyat | tl}}. Instagram için dikkat çekici bir ilan metni ve İngilizce görsel tarifi yaz.", [["metin", "metin"], ["gorselTarifi", "metin"]]),
    arac("s2", "Görsel üret", "gorsel_uret", "{{adim.s1.gorselTarifi}}", "4:5"),
    guncelle("s3", "İlana yaz", "ilanlar", "{{tetik.kayit.id}}", "{\"sosyalMetin\": \"{{adim.s1.metin}}\", \"sosyalGorsel\": \"{{adim.s2.gorseller | ilk}}\"}"),
  ], [PROJE], { sektor: ["emlak"] }),
  t("otel-yorum-takip", "destek", "Konaklama sonrası yorum isteği", "Misafirin çıkışından 1 gün sonra memnuniyet anketi bağlantısı içeren kişisel bir e-posta gönderir.", tablo("rezervasyonlar", ["guncelle"]), [
    suz("s1", "Çıkış yaptı mı", [k("{{tetik.kayit.durum}}", "esit", "cikis"), k("{{tetik.onceki.durum}}", "esit-degil", "cikis")]),
    bekle("s2", "1 gün bekle", 1, "gun"),
    uyg("s3", "Anket gönder", "resend", "eposta", { gonderen: "{{degisken.gonderen_eposta}}", alici: "{{tetik.kayit.eposta}}", konu: "Konaklaman nasıldı {{tetik.kayit.ad}}?", govde: "Bizi tercih ettiğin için teşekkürler. Bir dakikanı ayırıp deneyimini paylaşır mısın? {{degisken.anket_adresi}}?siparis={{tetik.kayit.id}}" }),
  ], [PROJE, SIR("Resend", "RESEND_API_KEY"), "anket_adresi değişkenine Memnuniyet anketi formunun adresini yaz"], { sektor: ["turizm"] }),
  t("spor-salonu-uyelik", "satis", "Spor salonu deneme dersi", "Deneme dersi formu gelince kayıt açılır, eğitmene haber gider; 3 gün sonra üyelik teklifiyle takip e-postası yollanır.", formS("Ücretsiz deneme dersi", "Gün ve dersi seç, seni arayalım.", { mesaj: "Talebin alındı; eğitmenimiz seni arayacak." }), [
    kayit("s1", "Kaydı aç", "deneme_dersleri", "{\"ad\": \"{{tetik.ad}}\", \"telefon\": \"{{tetik.telefon}}\", \"eposta\": \"{{tetik.eposta}}\", \"ders\": \"{{tetik.ders}}\"}"),
    uyg("s2", "Eğitmene haber ver", "telegram", "mesaj", { sohbet: "{{degisken.telegram_sohbet}}", metin: "Deneme dersi: {{tetik.ad}}, {{tetik.ders}}, {{tetik.telefon}}" }),
    bekle("s3", "3 gün bekle", 3, "gun"),
    uyg("s4", "Teklif e-postası", "resend", "eposta", { gonderen: "{{degisken.gonderen_eposta}}", alici: "{{tetik.eposta}}", konu: "Deneme dersin nasıldı?", govde: "Merhaba {{tetik.ad}}, {{tetik.ders}} dersini beğendiysen bu hafta üye olanlara ilk ay yarı fiyat. Yanıtla, yerini ayıralım." }),
  ], [FORM, PROJE, SIR("Telegram", "TELEGRAM_BOT_TOKEN"), SIR("Resend", "RESEND_API_KEY"), "telegram_sohbet değişkenini ekle"], { girdi: [z("ad", "Ad soyad"), z("telefon", "Telefon", "telefon"), z("eposta", "E-posta", "eposta"), z("ders", "Ders", "secim", { secenekler: ["Pilates", "Fitness", "Yoga", "Kickboks"] })], sektor: ["hizmet"] }),
  t("restoran-menu-gunu", "icerik", "Günün menüsünü paylaşıma hazırla", "Her sabah 10.00'da günün menü tablosundaki yemeklerden Instagram hikâyesi metni ve WhatsApp duyurusu hazırlanır.", gunluk("10:00"), [
    bul("s1", "Günün menüsü", "menu", [k("gun", "esit", "{{simdi | gun_adi}}")], { sinir: 20 }),
    ajan("s2", "Duyuru yaz", "Bugün {{simdi | gun_adi}}. Menü: {{adim.s1.kayitlar | alan(\"ad\") | birlestir(\", \")}}. Restoranımız için iştah açıcı, kısa bir Instagram hikâyesi metni ve WhatsApp duyurusu yaz.", [["hikaye", "metin"], ["whatsapp", "metin"]]),
    kayit("s3", "Kaydet", "gunun_duyurusu", "{\"tarih\": \"{{tarih}}\", \"hikaye\": \"{{adim.s2.hikaye}}\", \"whatsapp\": \"{{adim.s2.whatsapp}}\"}"),
  ], [PROJE, "menu tablosunda ad ve gun (Pazartesi, Salı…) sütunları olsun"], { sektor: ["restoran"] }),
  t("ajans-musteri-raporu", "operasyon", "Müşteriye haftalık iş raporu", "Her cuma müşteri bazında o hafta biten işleri gruplar ve her müşteriye kendi raporunu e-postayla gönderir.", haftalik(5, "16:00"), [
    bul("s1", "Biten işler", "isler", [k("durum", "esit", "bitti")], { sinir: 500 }),
    don("s2", "Müşteriye göre grupla", "liste", "grupla", "{{adim.s1.kayitlar}}", "musteri"),
    dongu("s3", "Her müşteri", "{{adim.s2.sonuc}}", [
      bul("s4", "Müşteri bilgisi", "musteriler", [k("ad", "esit", "{{dongu.oge.grup}}")], { sinir: 1 }),
      ajan("s5", "Rapor yaz", "{{dongu.oge.grup}} müşterisi için bu hafta biten {{dongu.oge.sayi}} iş: {{adim.s2.gruplar | json | kisalt(4000)}}. Bu müşterinin işlerini anlatan kısa, profesyonel bir haftalık rapor yaz."),
      uyg("s6", "Gönder", "resend", "eposta", { gonderen: "{{degisken.gonderen_eposta}}", alici: "{{adim.s4.ilk.eposta}}", konu: "Haftalık iş raporu", govde: "{{adim.s5.cikti}}" }),
    ]),
  ], [PROJE, SIR("Resend", "RESEND_API_KEY")], { sektor: ["ajans"] }),
  t("topluluk-uyelik-onay", "destek", "Topluluk üyelik başvurusunu onayla", "Başvuru formu onay kutusuna düşer; onaylanan kişiye Discord davet bağlantısı gider ve üye listesine eklenir.", formS("Topluluğa katıl", "Kendini kısaca tanıt.", { mesaj: "Başvurun alındı; onaylanınca davet bağlantını e-postayla göndereceğiz." }), [
    onay("s1", "Üyelik onayı", "Üyelik: {{tetik.ad}}", "{{tetik.tanitim}}\nNeden: {{tetik.neden}}", [
      kayit("s2", "Üyeyi ekle", "uyeler", "{\"ad\": \"{{tetik.ad}}\", \"eposta\": \"{{tetik.eposta}}\"}"),
      uyg("s3", "Davet gönder", "resend", "eposta", { gonderen: "{{degisken.gonderen_eposta}}", alici: "{{tetik.eposta}}", konu: "Aramıza hoş geldin", govde: "Merhaba {{tetik.ad}}, başvurun onaylandı. Discord davetin: {{degisken.discord_davet}}" }),
    ]),
  ], [FORM, PROJE, SIR("Resend", "RESEND_API_KEY"), "discord_davet değişkenine davet bağlantısını yaz"], { girdi: [z("ad", "Ad"), z("eposta", "E-posta", "eposta"), z("tanitim", "Kendini tanıt", "uzunMetin"), g("neden", "Neden katılmak istiyorsun", "uzunMetin")], sektor: ["topluluk"] }),
  t("sss-sohbet-kayit", "destek", "Sohbet sorularını SSS için topla", "Sohbet botuna gelen her soru sınıflandırılıp kaydedilir; ayda bir en çok sorulanlar SSS önerisi olarak raporlanabilir.", sohbet("Soru sor", "Merak ettiğini sor.", ["Fiyatlarınız nedir?", "Nasıl kayıt olurum?"]), [
    paralel("s1", "Aynı anda", [
      ["Yanıt", [ajan("s2", "Yanıtla", "İşletme bilgisi: {{degisken.isletme_bilgisi}}\nKonuşma:\n{{tetik.gecmisMetni}}\nSoru: {{tetik.mesaj}}\nKısa ve doğru bir Türkçe yanıt ver.")]],
      ["Konu", [ajan("s3", "Konusu", "Şu sorunun konusunu tek kelimeyle yaz: {{tetik.mesaj}}", [["konu", "metin"]])]],
    ]),
    { ...kayit("s4", "Soruyu kaydet", "sohbet_sorulari", "{\"soru\": \"{{tetik.mesaj}}\", \"konu\": \"{{adim.s3.konu}}\"}"), hata: "devam" },
    yanit("s5", "{{adim.s2.cikti}}"),
  ], [SOHBET, PROJE, "isletme_bilgisi değişkenini doldur"], { sektor: ["saas", "egitim", "hizmet"] }),
  t("kampanya-sms", "icerik", "Seçili müşterilere kampanya SMS'i", "Elle çalıştırırsın: müşteri tablosundan izin veren ve seçtiğin şehirdekileri bulur, onaydan sonra kampanya SMS'i gönderir.", elleForm(), [
    bul("s1", "Hedef müşteriler", "musteriler", [k("smsIzni", "esit", "true"), k("sehir", "esit", "{{tetik.sehir}}")], { sinir: 500 }),
    onay("s2", "Gönderim onayı", "{{adim.s1.sayi}} kişiye SMS", "{{tetik.mesaj}}", [
      dongu("s3", "Her müşteri", "{{adim.s1.kayitlar}}", [uyg("s4", "SMS", "netgsm", "sms", { baslik: "{{degisken.sms_baslik}}", alici: "{{dongu.oge.telefon}}", metin: "{{tetik.mesaj}} SMS almamak için RET yazın." })], { sinir: 500 }),
    ], [], { zamanAsimiMiktar: 2, zamanAsimiBirim: "saat" }),
  ], [PROJE, SIR("Netgsm", "NETGSM_KULLANICI", "NETGSM_SIFRE"), "sms_baslik değişkenini ekle", "Yalnız ticari ileti izni olan müşterilere gönder"], { girdi: [z("sehir", "Şehir"), z("mesaj", "Kampanya mesajı", "uzunMetin")], sektor: ["eticaret", "restoran"] }),
  t("csv-ice-aktar", "operasyon", "CSV dosyasını tabloya aktar", "CSV metnini yapıştırırsın; satırlar okunur, e-postaya göre tekrar etmeden müşteri tablosuna yazılır.", elleForm(), [
    don("s1", "CSV'yi oku", "yardimci", "csvOku", "{{tetik.csv}}", ""),
    dongu("s2", "Her satır", "{{adim.s1.sonuc}}", [upsert("s3", "Yaz", "musteriler", "eposta", "{{dongu.oge}}")], { sinir: 500 }),
    yanit("s4", "{{adim.s1.sayi}} satır işlendi."),
  ], [PROJE, "CSV'nin ilk satırı sütun adları olmalı ve eposta sütunu içermeli"], { girdi: [z("csv", "CSV metni", "uzunMetin")] }),
  t("tablo-disari-csv", "operasyon", "Tabloyu her hafta CSV olarak gönder", "Her pazartesi siparişler tablosunu CSV'ye çevirir ve muhasebeye e-postayla gönderir.", haftalik(1, "07:00"), [
    bul("s1", "Kayıtları al", "siparisler", [], { sinir: 1000 }),
    don("s2", "CSV yap", "yardimci", "csvYaz", "{{adim.s1.kayitlar}}", ";"),
    uyg("s3", "Muhasebeye gönder", "resend", "eposta", { gonderen: "{{degisken.gonderen_eposta}}", alici: "{{degisken.muhasebe_eposta}}", konu: "Haftalık sipariş dökümü {{tarih}}", govde: "<pre>{{adim.s2.sonuc | kisalt(90000)}}</pre>" }),
  ], [PROJE, SIR("Resend", "RESEND_API_KEY"), "muhasebe_eposta değişkenini ekle"], { sektor: ["eticaret"] }),
  t("alt-sistem-ortak-bildirim", "operasyon", "Ortak bildirim sistemi", "Diğer sistemlerin Sistemi çağır ile kullandığı tek bildirim kapısı: mesajı önceliğine göre Slack, Telegram ya da e-postaya yollar.", elleForm(), [
    yon("s1", "Önceliğe göre", [
      ["Acil", [k("{{tetik.oncelik}}", "esit", "acil")], [paralel("s2", "Her kanaldan", [["Slack", [uyg("s3", "Slack", "slack", "kanca", { metin: "ACİL: {{tetik.mesaj}}" })]], ["Telegram", [uyg("s4", "Telegram", "telegram", "mesaj", { sohbet: "{{degisken.telegram_sohbet}}", metin: "Acil: {{tetik.mesaj}}" })]]])]],
      ["Normal", [k("{{tetik.oncelik}}", "esit", "normal")], [uyg("s5", "Slack", "slack", "kanca", { metin: "{{tetik.mesaj}}" })]],
    ], [depo("s6", "E-posta kuyruğuna ekle", "ekle", "eposta_kuyrugu", { kapsam: "hesap", deger: "{\"alici\": \"{{degisken.benim_epostam}}\", \"konu\": \"Bildirim\", \"metin\": \"{{tetik.mesaj}}\"}" })]),
    yanit("s7", "Bildirim gönderildi."),
  ], [SIR("Slack", "SLACK_WEBHOOK_URL"), SIR("Telegram", "TELEGRAM_BOT_TOKEN"), "Diğer sistemlerde Sistemi çağır adımıyla bu sistemi mesaj ve oncelik girdisiyle çağır"], { girdi: [z("mesaj", "Mesaj", "uzunMetin"), z("oncelik", "Öncelik", "secim", { secenekler: ["acil", "normal", "dusuk"], varsayilan: "normal" })] }),
  t("cagir-ortak-bildirim", "operasyon", "Hata olunca ortak bildirim sistemini çağır", "Sistem hatası tetiklerinde kullanılan küçük köprü: hata bilgisini ortak bildirim sistemine acil öncelikle iletir.", { tur: "sistem", sistemId: "" }, [
    cagir("s1", "Bildirim sistemini çağır", "{\"mesaj\": \"{{tetik.sistem}} bildirimi: {{tetik.hata}}{{tetik.cikti | kisalt(400)}}\", \"oncelik\": \"acil\"}"),
  ], ["Sistemi çağır adımında Ortak bildirim sistemini seç", "Başka sistem tetiğinde izlenecek sistemi seç ya da bunu sistem ayarlarındaki Hata olunca şu sistemi çalıştır olarak kullan"]),
];


/* ───────── v5: servis tetikleri, işletme olayları ve yeni uygulama eylemleri ───────── */
const servisT = (olay: string, ayar: Record<string, string> = {}, aralik = 5): KimliksizTetik => ({ tur: "servis", servis: servisOlayBul(olay)?.servis ?? "", olay, ayar, aralik });
const isletmeT = (olay: "siparis" | "siparisAsama" | "randevu" | "randevuIptal" | "yorum" | "abone" | "terkSepet"): KimliksizTetik => ({ tur: "isletme", projeId: "", olay });
const imzaliKanca = (imza: string, yanitModu?: "bitince"): KimliksizTetik => ({ tur: "webhook", imza, ...(yanitModu ? { yanitModu } : {}) });
const IS = "Tetikte İşletme sekmesi açık Build projeni seç";
const BAG = (servis: string) => `${servis} kimliğini Bağlantılar'dan seç ya da sırlarını ekle`;
const GOOGLE = SIR("Google", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN");
const TY = BAG("Trendyol");
const tg = (id: string, metin: string) => uyg(id, "Telegram'a yaz", "telegram", "mesaj", { sohbet: "{{degisken.telegram_sohbet}}", metin });
const sl = (id: string, metin: string) => uyg(id, "Slack'e yaz", "slack", "kanca", { metin });
const sms = (id: string, alici: string, metin: string) => uyg(id, "SMS gönder", "netgsm", "sms", { baslik: "{{degisken.sms_baslik}}", alici, metin, iys: "0" });
const wa = (id: string, telefon: string, sablon: string, degiskenler: string) => uyg(id, "WhatsApp şablonu", "whatsapp", "sablon", { telefon, sablon, dil: "tr", degiskenler });
const satirEkle = (id: string, ad: string, degerler: string) => uyg(id, ad, "google-sheets", "satir-ekle", { tablo: "{{degisken.tablo_kimligi}}", aralik: "Sayfa1", degerler });
const mail = (id: string, alici: string, konu: string, govde: string) => uyg(id, "E-posta gönder", "resend", "eposta", { gonderen: "{{degisken.gonderen_eposta}}", alici, konu, govde });

/** Bir olaydan birden çok kanala bildirim: Zapier'deki "yeni X olunca Y'ye yaz" ailesi. */
type Olay = { id: string; ad: string; tetik: KimliksizTetik; metin: string; kurulum: string[]; sektor?: string[]; kategori: SablonKategori };
const BILDIRIM_OLAYLARI: Olay[] = [
  { id: "shopify", ad: "Shopify siparişi", tetik: servisT("shopify-siparis"), metin: "Shopify siparişi {{tetik.name}}: {{tetik.total_price | tl}}, {{tetik.email}}", kurulum: [SIR("Shopify", "SHOPIFY_MAGAZA", "SHOPIFY_TOKEN")], sektor: ["eticaret"], kategori: "satis" },
  { id: "woo", ad: "WooCommerce siparişi", tetik: servisT("woo-siparis"), metin: "WooCommerce siparişi #{{tetik.number}}: {{tetik.total | tl}}, {{tetik.billing.first_name}} {{tetik.billing.last_name}}", kurulum: [SIR("WooCommerce", "WOO_SITE", "WOO_KEY", "WOO_SECRET")], sektor: ["eticaret"], kategori: "satis" },
  { id: "isletme", ad: "mağaza siparişi", tetik: isletmeT("siparis"), metin: "Mağazada yeni sipariş {{tetik.siparisNo}}: {{tetik.tutar | tl}}, {{tetik.alici.ad}} {{tetik.alici.soyad}}", kurulum: [IS], sektor: ["eticaret"], kategori: "satis" },
  { id: "randevu", ad: "randevu", tetik: isletmeT("randevu"), metin: "Yeni randevu: {{tetik.ad}}, {{tetik.hizmetAd}}, {{tetik.baslangic | tarih}}", kurulum: [IS], sektor: ["saglik", "hizmet"], kategori: "operasyon" },
  { id: "typeform", ad: "Typeform yanıtı", tetik: servisT("typeform-yanit", { form: "" }), metin: "Yeni Typeform yanıtı: {{tetik.answers | json | kisalt(600)}}", kurulum: [SIR("Typeform", "TYPEFORM_TOKEN"), "Tetikte form kimliğini yaz"], kategori: "destek" },
  { id: "calendly", ad: "Calendly randevusu", tetik: servisT("calendly-randevu"), metin: "Yeni Calendly randevusu: {{tetik.name}}, {{tetik.start_time | tarih}}", kurulum: [SIR("Calendly", "CALENDLY_TOKEN", "CALENDLY_KULLANICI")], kategori: "operasyon" },
  { id: "github", ad: "çekme isteği", tetik: servisT("github-cekme", { depo: "" }), metin: "Yeni çekme isteği: {{tetik.title}} ({{tetik.user.login}}) {{tetik.html_url}}", kurulum: [BAG("GitHub"), "Tetikte depoyu sahip/depo biçiminde yaz"], kategori: "yazilim" },
  { id: "trendyol", ad: "Trendyol siparişi", tetik: servisT("trendyol-siparis"), metin: "Trendyol siparişi {{tetik.orderNumber}}: {{tetik.totalPrice | tl}}, {{tetik.customerFirstName}} {{tetik.customerLastName}}", kurulum: [TY], sektor: ["eticaret"], kategori: "satis" },
  { id: "n11", ad: "n11 siparişi", tetik: servisT("n11-siparis"), metin: "n11 siparişi {{tetik.orderNumber}} geldi", kurulum: [BAG("n11")], sektor: ["eticaret"], kategori: "satis" },
  { id: "ikas", ad: "ikas siparişi", tetik: servisT("ikas-siparis"), metin: "ikas siparişi {{tetik.orderNumber}}: {{tetik.totalFinalPrice | tl}}, {{tetik.customer.email}}", kurulum: [BAG("ikas")], sektor: ["eticaret"], kategori: "satis" },
];
const BILDIRIM_KANALLARI: { id: string; ad: string; adim: (metin: string) => Adim; kurulum: string[] }[] = [
  { id: "slack", ad: "Slack'e", adim: (metin) => sl("s1", metin), kurulum: [SIR("Slack", "SLACK_WEBHOOK_URL")] },
  { id: "telegram", ad: "Telegram'a", adim: (metin) => tg("s1", metin), kurulum: [SIR("Telegram", "TELEGRAM_BOT_TOKEN"), "telegram_sohbet değişkenine sohbet kimliğini yaz"] },
  { id: "teams", ad: "Teams'e", adim: (metin) => uyg("s1", "Teams kanalına yaz", "teams", "mesaj", { metin }), kurulum: [SIR("Microsoft Teams", "TEAMS_WEBHOOK_URL")] },
  { id: "discord", ad: "Discord'a", adim: (metin) => uyg("s1", "Discord'a yaz", "discord", "mesaj", { metin }), kurulum: [SIR("Discord", "DISCORD_WEBHOOK_URL")] },
  { id: "sheets", ad: "E-Tablolar'a", adim: (metin) => satirEkle("s1", "Satır ekle", `["{{tarih}} {{saat}}", ${JSON.stringify(metin)}]`), kurulum: [GOOGLE, "tablo_kimligi değişkenine e-tablonun kimliğini yaz"] },
];
const BILDIRIMLER: SistemSablon[] = BILDIRIM_OLAYLARI.flatMap((o) => BILDIRIM_KANALLARI.filter((k2) => !(o.id === "github" && k2.id === "sheets")).map((k2) => t(`v5-${o.id}-${k2.id}`, o.kategori, `Yeni ${o.ad} olunca ${k2.ad} yaz`, `${o.ad.charAt(0).toLocaleUpperCase("tr")}${o.ad.slice(1)} geldiğinde ayrıntıları ${k2.ad.replace(/'[ae]$|'ya$|'ye$/, "")} kanalına tek satırda iletir.`, o.tetik, [k2.adim(o.metin)], [...o.kurulum, ...k2.kurulum], { ...(o.sektor ? { sektor: o.sektor } : {}) })));

const V5: SistemSablon[] = [
  /* ── E-ticaret: Türkiye ── */
  t("v5-trendyol-hazirla", "satis", "Trendyol siparişini otomatik hazırlanıyor yap", "Yeni Trendyol siparişi gelince paketi Hazırlanıyor durumuna alır ve depo kanalına bildirir.", servisT("trendyol-siparis"), [
    don("s1", "Kalemleri hazırla", "liste", "alan", "{{tetik.lines}}", "id"),
    uyg("s2", "Hazırlanıyor yap", "trendyol", "paket-durumu", { paket: "{{tetik.shipmentPackageId}}", kalemler: "{{tetik.lines}}", durum: "Picking" }),
    sl("s3", "Hazırlanıyor: {{tetik.orderNumber}} ({{adim.s1.sonuc | uzunluk}} kalem)"),
  ], [TY, SIR("Slack", "SLACK_WEBHOOK_URL")], { sektor: ["eticaret"] }),
  t("v5-trendyol-soru-yz", "destek", "Trendyol sorularına yapay zekâyla yanıt taslağı", "Yeni müşteri sorusu gelince yapay zekâ ürün bilgisine göre yanıt yazar; onaylarsan mağaza adına gönderilir.", servisT("trendyol-soru"), [
    ajan("s1", "Yanıt yaz", "Trendyol mağazamıza şu soru geldi: \"{{tetik.text}}\" Ürün: {{tetik.productName}}. Kibar, kısa ve doğru bir Türkçe yanıt yaz; bilmediğin bilgiyi uydurma.", [["yanit", "metin", "Müşteriye yanıt"]]),
    onay("s2", "Yanıtı onayla", "Trendyol sorusu: {{tetik.productName}}", "{{adim.s1.yanit}}", [uyg("s3", "Yanıtla", "trendyol", "soru-yanitla", { soru: "{{tetik.id}}", yanit: "{{adim.s2.icerik}}" })]),
  ], [TY], { sektor: ["eticaret"] }),
  t("v5-trendyol-stok-sheets", "operasyon", "E-Tablolar'dan Trendyol stoğunu güncelle", "Stok tablosuna yeni satır girilince barkod, adet ve fiyatla Trendyol stoğunu ve fiyatını günceller.", servisT("sheets-satir", { tablo: "", aralik: "Stok!A1:D500" }), [
    uyg("s1", "Stok ve fiyat", "trendyol", "stok", { barkod: "{{tetik.alanlar.barkod}}", adet: "{{tetik.alanlar.adet}}", satis: "{{tetik.alanlar.fiyat}}" }),
  ], [TY, GOOGLE, "Tabloda barkod, adet ve fiyat başlıklı sütunlar olsun"], { sektor: ["eticaret"] }),
  t("v5-ikas-kargo-sms", "satis", "ikas siparişi kargoya verilince SMS", "Her yeni ikas siparişini Yurtiçi Kargo'ya kaydeder ve müşteriye takip anahtarıyla SMS gönderir.", servisT("ikas-siparis"), [
    uyg("s1", "Kargo kaydı", "yurtici", "gonderi", { kargoAnahtari: "{{tetik.orderNumber}}", faturaAnahtari: "{{tetik.orderNumber}}", ad: "{{tetik.shippingAddress.firstName}} {{tetik.shippingAddress.lastName}}", adres: "{{tetik.shippingAddress.addressLine1}}", il: "{{tetik.shippingAddress.city.name}}", ilce: "{{tetik.shippingAddress.district.name}}", telefon: "{{tetik.shippingAddress.phone}}", parca: "1" }),
    sms("s2", "{{tetik.shippingAddress.phone}}", "Siparişiniz {{tetik.orderNumber}} Yurtiçi Kargo'ya verildi. Takip numarası: {{tetik.orderNumber}}"),
  ], [BAG("ikas"), SIR("Yurtiçi Kargo", "YURTICI_KULLANICI", "YURTICI_SIFRE"), SIR("Netgsm", "NETGSM_KULLANICI", "NETGSM_SIFRE"), "sms_baslik değişkenini ekle"], { sektor: ["eticaret"] }),
  t("v5-ticimax-aktar", "operasyon", "Ticimax siparişlerini E-Tablolar'a aktar", "Yeni Ticimax siparişleri sipariş numarası, tutar ve müşteriyle tabloya satır olarak eklenir.", servisT("ticimax-siparis"), [
    satirEkle("s1", "Siparişi yaz", "[\"{{tetik.SiparisNo}}\", \"{{tetik.SiparisTarihi}}\", \"{{tetik.AdiSoyadi}}\", \"{{tetik.SiparisToplamTutari}}\"]"),
  ], [SIR("Ticimax", "TICIMAX_SITE", "TICIMAX_UYE_KODU"), GOOGLE, "tablo_kimligi değişkenini ekle"], { sektor: ["eticaret"] }),
  t("v5-shopier-kargo", "satis", "Shopier siparişini MNG Kargo ile gönder", "Gönderilmemiş Shopier siparişi gelince MNG Kargo'da gönderi açar ve Shopier'de siparişi kargoya verildi yapar.", servisT("shopier-siparis"), [
    uyg("s1", "MNG gönderisi", "mng", "gonderi", { referans: "{{tetik.id}}", ad: "{{tetik.shippingInfo.firstName}} {{tetik.shippingInfo.lastName}}", adres: "{{tetik.shippingInfo.address}}", ilKodu: "{{degisken.mng_il_kodu}}", ilceKodu: "{{degisken.mng_ilce_kodu}}", telefon: "{{tetik.shippingInfo.phone}}", icerik: "Sipariş {{tetik.id}}", desi: "1", kg: "1", odeme: "1" }),
    uyg("s2", "Shopier'de kargoya ver", "shopier", "kargo", { siparis: "{{tetik.id}}", firma: "mng", takip: "{{tetik.id}}" }),
  ], [BAG("Shopier"), SIR("MNG Kargo", "MNG_CLIENT_ID", "MNG_CLIENT_SECRET", "MNG_MUSTERI_NO", "MNG_SIFRE"), "MNG il ve ilçe kodu değişkenlerini ekle ya da adımda alıcının kodlarını seç"], { sektor: ["eticaret"] }),
  t("v5-woo-tamamla", "satis", "WooCommerce siparişini Aras Kargo'ya ver ve tamamla", "Yeni WooCommerce siparişi Aras Kargo'ya kaydedilir, siparişe not düşülür ve durumu tamamlandı yapılır.", servisT("woo-siparis"), [
    uyg("s1", "Aras gönderisi", "aras", "gonderi", { kod: "WOO{{tetik.id}}", irsaliye: "{{tetik.number}}", ad: "{{tetik.shipping.first_name}} {{tetik.shipping.last_name}}", adres: "{{tetik.shipping.address_1}}", il: "{{tetik.shipping.state}}", ilce: "{{tetik.shipping.city}}", telefon: "{{tetik.billing.phone}}", parca: "1" }),
    uyg("s2", "Siparişe not", "woocommerce", "not", { siparis: "{{tetik.id}}", not: "Aras Kargo entegrasyon kodu: WOO{{tetik.id}}", musteri: "true" }),
    uyg("s3", "Tamamlandı", "woocommerce", "durum", { siparis: "{{tetik.id}}", durum: "completed" }),
  ], [SIR("WooCommerce", "WOO_SITE", "WOO_KEY", "WOO_SECRET"), SIR("Aras Kargo", "ARAS_KULLANICI", "ARAS_SIFRE")], { sektor: ["eticaret"] }),
  t("v5-shopify-imzali", "satis", "Shopify siparişini imzalı web kancasıyla Paraşüt'e faturala", "Shopify sipariş web kancası imzasıyla doğrulanır, müşteri Paraşüt'te açılır ve satış faturası kesilir.", imzaliKanca("shopify"), [
    uyg("s1", "Cari oluştur", "parasut", "cari", { ad: "{{tetik.customer.first_name}} {{tetik.customer.last_name}}", eposta: "{{tetik.email}}", tur: "customer", kisi: "person" }),
    uyg("s2", "Fatura", "parasut", "fatura", { cari: "{{adim.s1.yanit.data.id}}", aciklama: "Shopify {{tetik.name}}", kalemler: "[{\"adet\": 1, \"fiyat\": {{tetik.subtotal_price}}, \"kdv\": 20, \"aciklama\": \"Shopify {{tetik.name}}\"}]", referans: "shopify-{{tetik.id}}" }),
  ], ["Shopify'da sipariş oluşturma web kancasına bu sistemin adresini gir", SIR("Shopify imzası", "SHOPIFY_WEBHOOK_SECRET"), BAG("Paraşüt")], { sektor: ["eticaret"] }),
  t("v5-isletme-earsiv", "finans", "Mağaza siparişine Paraşüt e-Arşiv fatura", "İşletme mağazasında ödeme alınınca müşteri Paraşüt'te açılır, satış faturası kesilir ve e-Arşive gönderilir.", isletmeT("siparis"), [
    uyg("s1", "Cari", "parasut", "cari", { ad: "{{tetik.alici.ad}} {{tetik.alici.soyad}}", eposta: "{{tetik.eposta}}", telefon: "{{tetik.alici.telefon}}", sehir: "{{tetik.alici.sehir}}", adres: "{{tetik.alici.adres}}", tur: "customer", kisi: "person" }),
    uyg("s2", "Satış faturası", "parasut", "fatura", { cari: "{{adim.s1.yanit.data.id}}", aciklama: "Sipariş {{tetik.siparisNo}}", kalemler: "[{\"adet\": 1, \"fiyat\": {{tetik.tutar}}, \"kdv\": 20, \"aciklama\": \"Sipariş {{tetik.siparisNo}}\"}]", referans: "{{tetik.siparisNo}}" }),
    uyg("s3", "e-Arşiv", "parasut", "e-arsiv", { fatura: "{{adim.s2.yanit.data.id}}", internet: "true", site: "{{degisken.site_adresi}}", odemeTipi: "KREDIKARTI/BANKAKARTI", platform: "iyzico" }),
  ], [IS, BAG("Paraşüt"), "site_adresi değişkenine mağaza adresini yaz", "Tutar KDV hariç değilse fiyat alanını kendi hesabına göre düzenle"], { sektor: ["eticaret"] }),
  t("v5-isletme-kargo-yurtici", "operasyon", "Sipariş hazırlanınca Yurtiçi Kargo kaydı aç", "Mağaza siparişinin aşaması hazırlanıyor olunca Yurtiçi Kargo'da gönderi açılır ve müşteriye SMS gider.", isletmeT("siparisAsama"), [
    suz("s1", "Hazırlanıyor mu", [k("{{tetik.yeniDurum}}", "esit", "hazirlaniyor")]),
    uyg("s2", "Gönderi oluştur", "yurtici", "gonderi", { kargoAnahtari: "{{tetik.siparisNo}}", faturaAnahtari: "{{tetik.siparisNo}}", ad: "{{tetik.alici.ad}} {{tetik.alici.soyad}}", adres: "{{tetik.alici.adres}}", il: "{{tetik.alici.sehir}}", ilce: "{{tetik.alici.ilce}}", telefon: "{{tetik.alici.telefon}}", parca: "1" }),
    sms("s3", "{{tetik.alici.telefon}}", "{{tetik.siparisNo}} numaralı siparişiniz kargoya hazırlanıyor; Yurtiçi Kargo takip anahtarı {{tetik.siparisNo}}."),
  ], [IS, SIR("Yurtiçi Kargo", "YURTICI_KULLANICI", "YURTICI_SIFRE"), SIR("Netgsm", "NETGSM_KULLANICI", "NETGSM_SIFRE"), "sms_baslik değişkenini ekle"], { sektor: ["eticaret"] }),
  t("v5-isletme-kargoda-wa", "destek", "Sipariş kargoya çıkınca WhatsApp bildirimi", "Aşama kargoda olunca müşteriye onaylı WhatsApp şablonuyla takip bilgisi gider.", isletmeT("siparisAsama"), [
    suz("s1", "Kargoda mı", [k("{{tetik.yeniDurum}}", "esit", "kargoda")]),
    wa("s2", "{{tetik.alici.telefon}}", "kargo_takip", "{{tetik.alici.ad}}, {{tetik.siparisNo}}, {{tetik.isletme.kargo.takipNo}}"),
  ], [IS, SIR("WhatsApp", "WHATSAPP_TOKEN", "WHATSAPP_PHONE_ID"), "kargo_takip adında üç değişkenli şablonu Meta'da onaylat"], { sektor: ["eticaret"] }),
  t("v5-isletme-teslim-yorum", "icerik", "Teslimden 3 gün sonra yorum iste", "Sipariş teslim edilince 3 gün bekler ve müşteriden e-postayla yorum ister.", isletmeT("siparisAsama"), [
    suz("s1", "Teslim edildi mi", [k("{{tetik.yeniDurum}}", "esit", "teslim")]),
    bekle("s2", "3 gün bekle", 3, "gun"),
    mail("s3", "{{tetik.eposta}}", "Siparişinizi nasıl buldunuz?", "<p>Merhaba {{tetik.alici.ad}},</p><p>{{tetik.siparisNo}} numaralı siparişinizi değerlendirir misiniz? <a href=\"{{degisken.site_adresi}}/yorum\">Yorum yaz</a></p>"),
  ], [IS, SIR("Resend", "RESEND_API_KEY"), "gonderen_eposta ve site_adresi değişkenlerini ekle"], { sektor: ["eticaret"] }),
  t("v5-terk-sepet", "satis", "Terk edilen sepete hatırlatma ve kupon", "Ödemesi yarım kalan sepet için 1 saat sonra hatırlatma, ertesi gün de indirim kuponuyla ikinci e-posta gider.", isletmeT("terkSepet"), [
    bekle("s1", "1 saat bekle", 1, "saat"),
    mail("s2", "{{tetik.eposta}}", "Sepetinizde ürün kaldı", "<p>Merhaba {{tetik.ad}},</p><p>Sepetinizdeki {{tetik.tutar | tl}} tutarındaki ürünler sizi bekliyor.</p><p><a href=\"{{degisken.site_adresi}}/sepet\">Alışverişe dön</a></p>"),
    bekle("s3", "1 gün bekle", 1, "gun"),
    mail("s4", "{{tetik.eposta}}", "Size özel yüzde 10 indirim", "<p>{{tetik.ad}}, sepetiniz için {{degisken.terk_kuponu}} koduyla yüzde 10 indirim tanımladık.</p>"),
  ], [IS, SIR("Resend", "RESEND_API_KEY"), "site_adresi ve terk_kuponu değişkenlerini ekle"], { sektor: ["eticaret"] }),
  t("v5-yorum-dusuk", "destek", "Düşük puanlı yorumda ekibi uyar", "1 ya da 2 yıldızlı yorum gelince yapay zekâ özetler, destek kanalına ve yöneticiye bildirir.", isletmeT("yorum"), [
    suz("s1", "Puan düşük mü", [k("{{tetik.puan}}", "kucuk-esit", "2")]),
    ajan("s2", "Özetle", "Bu müşteri yorumunun sorununu tek cümlede özetle ve bir çözüm öner: {{tetik.metin}}", [["ozet", "metin"], ["oneri", "metin"]]),
    paralel("s3", "Bildir", [["Slack", [sl("s4", "{{tetik.puan}} yıldız: {{tetik.ad}}. {{adim.s2.ozet}} Öneri: {{adim.s2.oneri}}")]], ["Telegram", [tg("s5", "Düşük puanlı yorum: {{adim.s2.ozet}}")]]]),
  ], [IS, SIR("Slack", "SLACK_WEBHOOK_URL"), SIR("Telegram", "TELEGRAM_BOT_TOKEN")]),
  t("v5-yorum-yanit-yz", "destek", "Yeni yoruma yapay zekâyla yanıt taslağı", "Her yeni yorum için kibar bir yanıt taslağı yazılır ve onay kutusuna düşer; yanıtı İşletme panelinden yayınlarsın.", isletmeT("yorum"), [
    ajan("s1", "Yanıt yaz", "İşletmemize {{tetik.puan}} yıldızlı şu yorum geldi: \"{{tetik.metin}}\". Samimi, kısa ve özür ya da teşekkür içeren bir yanıt yaz.", [["yanit", "metin"]]),
    onay("s2", "Yanıtı gözden geçir", "{{tetik.ad}} yorumuna yanıt", "{{adim.s1.yanit}}", [sl("s3", "Onaylı yorum yanıtı ({{tetik.ad}}): {{adim.s2.icerik}}")]),
  ], [IS, SIR("Slack", "SLACK_WEBHOOK_URL")]),
  t("v5-abone-brevo", "icerik", "Yeni aboneyi Brevo listesine ekle", "Siteden abone olan kişi Brevo'da kişi olarak açılır ve bülten listesine eklenir.", isletmeT("abone"), [
    uyg("s1", "Brevo kişisi", "brevo", "kisi", { eposta: "{{tetik.eposta}}", ozellikler: "{\"FIRSTNAME\": \"{{tetik.ad}}\", \"KAYNAK\": \"{{tetik.kaynak}}\"}", listeler: "{{degisken.brevo_liste}}" }),
  ], [IS, SIR("Brevo", "BREVO_API_KEY"), "brevo_liste değişkenine liste numarasını yaz"]),
  t("v5-abone-mailchimp", "icerik", "Yeni aboneyi Mailchimp'e ekle ve etiketle", "Abone Mailchimp kitlesine eklenir ve geldiği kaynağa göre etiketlenir.", isletmeT("abone"), [
    uyg("s1", "Kitleye ekle", "mailchimp", "abone", { liste: "{{degisken.mailchimp_kitle}}", eposta: "{{tetik.eposta}}", ad: "{{tetik.ad}}", durum: "subscribed" }),
    uyg("s2", "Etiketle", "mailchimp", "etiket", { liste: "{{degisken.mailchimp_kitle}}", eposta: "{{tetik.eposta}}", etiketler: "site, {{tetik.kaynak}}" }),
  ], [IS, SIR("Mailchimp", "MAILCHIMP_API_KEY"), "mailchimp_kitle değişkenini ekle"]),
  t("v5-abone-hosgeldin", "icerik", "Yeni aboneye hoş geldin e-postası", "Abone olan kişiye hemen hoş geldin e-postası, varsa açılır penceredeki kupon koduyla gider.", isletmeT("abone"), [
    mail("s1", "{{tetik.eposta}}", "Aramıza hoş geldin", "<p>Merhaba {{tetik.ad | varsayilan(\"\")}},</p><p>Bültenimize katıldığın için teşekkürler.{{tetik.kupon}}</p>"),
  ], [IS, SIR("Resend", "RESEND_API_KEY"), "gonderen_eposta değişkenini ekle"]),
  /* ── Randevu ── */
  t("v5-randevu-sms", "operasyon", "Yeni randevuya SMS onayı", "Siteden alınan randevu için müşteriye tarih, saat ve hizmetle onay SMS'i gider.", isletmeT("randevu"), [
    sms("s1", "{{tetik.telefon}}", "Sayın {{tetik.ad}}, {{tetik.hizmetAd}} randevunuz {{tetik.baslangic | tarih}} için alındı. İptal için bizi arayın."),
  ], [IS, SIR("Netgsm", "NETGSM_KULLANICI", "NETGSM_SIFRE"), "sms_baslik değişkenini ekle"], { sektor: ["saglik", "hizmet"] }),
  t("v5-randevu-takvim", "operasyon", "Randevuyu Google Takvim'e ekle", "Her yeni randevu çalışanın Google Takvim'ine müşteri bilgisiyle etkinlik olarak eklenir.", isletmeT("randevu"), [
    uyg("s1", "Etkinlik", "google-calendar", "olustur", { baslik: "{{tetik.hizmetAd}}: {{tetik.ad}}", baslangic: "{{tetik.baslangic}}", bitis: "{{tetik.bitis}}", aciklama: "Telefon: {{tetik.telefon}}\nNot: {{tetik.not}}", takvim: "{{degisken.takvim_kimligi | varsayilan(\"primary\")}}" }),
  ], [IS, GOOGLE], { sektor: ["saglik", "hizmet"] }),
  t("v5-randevu-outlook", "operasyon", "Randevuyu Outlook takvimine ekle", "Yeni randevu Microsoft 365 takvimine eklenir; istersen Teams toplantısı da açılır.", isletmeT("randevu"), [
    uyg("s1", "Outlook etkinliği", "outlook", "etkinlik", { baslik: "{{tetik.hizmetAd}}: {{tetik.ad}}", baslangic: "{{tetik.baslangic}}", bitis: "{{tetik.bitis}}", aciklama: "{{tetik.telefon}} {{tetik.eposta}}", teams: "false" }),
  ], [IS, SIR("Microsoft", "MICROSOFT_CLIENT_ID", "MICROSOFT_REFRESH_TOKEN")], { sektor: ["saglik", "hizmet"] }),
  t("v5-randevu-iptal-bildir", "operasyon", "Randevu iptalini ekibe bildir", "Randevu iptal edilince boşalan saat Telegram'a yazılır ve bekleme listesindekilere duyurmak için hatırlatılır.", isletmeT("randevuIptal"), [
    tg("s1", "İptal: {{tetik.ad}}, {{tetik.hizmetAd}}, {{tetik.baslangic | tarih}}. Neden: {{tetik.iptalNeden | varsayilan(\"belirtilmedi\")}}"),
  ], [IS, SIR("Telegram", "TELEGRAM_BOT_TOKEN")], { sektor: ["saglik", "hizmet"] }),
  t("v5-randevu-hatirlat-wa", "destek", "Randevudan bir gün önce WhatsApp hatırlatması", "Randevu alınınca başlangıçtan 24 saat öncesine kadar bekler ve WhatsApp şablonuyla hatırlatır.", isletmeT("randevu"), [
    don("s1", "Hatırlatma zamanı", "tarih", "ekle", "{{tetik.baslangic}}", "-1", "gun"),
    yap("s2", "O zamana kadar bekle", "bekle", { mod: "tarih", tarih: "{{adim.s1.sonuc}}" }),
    wa("s3", "{{tetik.telefon}}", "randevu_hatirlatma", "{{tetik.ad}}, {{tetik.hizmetAd}}, {{tetik.baslangic | tarih}}"),
  ], [IS, SIR("WhatsApp", "WHATSAPP_TOKEN", "WHATSAPP_PHONE_ID"), "randevu_hatirlatma şablonunu Meta'da onaylat"], { sektor: ["saglik", "hizmet"] }),
  /* ── Google ── */
  t("v5-sheets-crm", "satis", "E-Tablolar'a eklenen adayı HubSpot'a aktar", "Aday tablosuna yeni satır gelince kişi HubSpot'ta açılır, satış kanalına haber verilir.", servisT("sheets-satir", { tablo: "", aralik: "Adaylar!A1:E2000" }), [
    uyg("s1", "HubSpot kişisi", "hubspot", "kisi", { eposta: "{{tetik.alanlar.eposta}}", ad: "{{tetik.alanlar.ad}}", soyad: "{{tetik.alanlar.soyad}}", telefon: "{{tetik.alanlar.telefon}}", sirket: "{{tetik.alanlar.sirket}}" }),
    sl("s2", "Yeni aday HubSpot'a eklendi: {{tetik.alanlar.ad}} {{tetik.alanlar.soyad}} ({{tetik.alanlar.sirket}})"),
  ], [GOOGLE, SIR("HubSpot", "HUBSPOT_TOKEN"), SIR("Slack", "SLACK_WEBHOOK_URL"), "Tablonun ilk satırında ad, soyad, eposta, telefon, sirket başlıkları olsun"], { sektor: ["saas", "ajans"] }),
  t("v5-sheets-sms", "icerik", "E-Tablolar satırından SMS gönder", "Tabloya telefon ve mesaj içeren satır eklendikçe Netgsm ile SMS gönderilir ve sonuç tabloya işlenir.", servisT("sheets-satir", { tablo: "", aralik: "SMS!A1:C1000" }), [
    sms("s1", "{{tetik.alanlar.telefon}}", "{{tetik.alanlar.mesaj}}"),
    uyg("s2", "Sonucu yaz", "google-sheets", "guncelle", { tablo: "{{degisken.tablo_kimligi}}", aralik: "SMS!C{{tetik.satir}}", degerler: "[[\"Gönderildi {{simdi.tr}}\"]]" }),
  ], [GOOGLE, SIR("Netgsm", "NETGSM_KULLANICI", "NETGSM_SIFRE"), "tablo_kimligi ve sms_baslik değişkenlerini ekle"]),
  t("v5-gmail-fatura", "finans", "Gmail'e gelen faturaları Drive'a kaydet", "Konusunda fatura geçen yeni e-postalar okunur, yapay zekâ tutarı ve tedarikçiyi çıkarır, E-Tablolar'a yazılır.", servisT("gmail-ileti", { sorgu: "subject:fatura newer_than:2d" }, 15), [
    uyg("s1", "İletiyi oku", "gmail", "oku", { ileti: "{{tetik.id}}" }),
    ajan("s2", "Bilgileri çıkar", "Bu e-postadan tedarikçi adını, fatura tutarını ve tarihini çıkar: {{adim.s1.yanit.snippet}}", [["tedarikci", "metin"], ["tutar", "sayi"], ["tarih", "metin"]]),
    satirEkle("s3", "Tabloya yaz", "[\"{{adim.s2.tarih}}\", \"{{adim.s2.tedarikci}}\", \"{{adim.s2.tutar}}\", \"{{tetik.id}}\"]"),
  ], [GOOGLE, "tablo_kimligi değişkenini ekle"]),
  t("v5-gmail-ozet", "verimlilik", "Önemli Gmail iletilerini Telegram'a özetle", "Önemli olarak işaretlenen yeni iletiler kısaca özetlenip Telegram'a yollanır.", servisT("gmail-ileti", { sorgu: "is:important is:unread newer_than:1d" }, 15), [
    uyg("s1", "İletiyi oku", "gmail", "oku", { ileti: "{{tetik.id}}" }),
    ajan("s2", "Özetle", "Bu e-postayı iki cümlede Türkçe özetle ve yanıt gerekiyor mu söyle: {{adim.s1.yanit.snippet}}", [["ozet", "metin"]]),
    tg("s3", "Yeni önemli e-posta: {{adim.s2.ozet}}"),
  ], [GOOGLE, SIR("Telegram", "TELEGRAM_BOT_TOKEN")]),
  t("v5-gmail-destek", "destek", "Destek e-postasını Zendesk talebine çevir", "destek etiketiyle gelen Gmail iletileri Zendesk'te talep olarak açılır ve okundu işaretlenir.", servisT("gmail-ileti", { sorgu: "label:destek is:unread" }, 5), [
    uyg("s1", "İletiyi oku", "gmail", "oku", { ileti: "{{tetik.id}}" }),
    uyg("s2", "Zendesk talebi", "zendesk", "talep", { konu: "E-posta: {{adim.s1.yanit.snippet | kisalt(80)}}", aciklama: "{{adim.s1.yanit.snippet}}", oncelik: "normal" }),
    uyg("s3", "Okundu", "gmail", "etiketle", { ileti: "{{tetik.id}}", kaldir: "UNREAD" }),
  ], [GOOGLE, SIR("Zendesk", "ZENDESK_ALT_ALAN", "ZENDESK_EPOSTA", "ZENDESK_TOKEN")]),
  t("v5-takvim-hatirlat", "verimlilik", "Toplantıdan 15 dakika önce Telegram hatırlatması", "Takvimdeki etkinlik başlamadan 15 dakika önce başlık ve Meet bağlantısıyla hatırlatır.", servisT("takvim-baslangic", { takvim: "primary", dakika: "15" }, 5), [
    tg("s1", "15 dakika sonra: {{tetik.summary}} {{tetik.hangoutLink}}"),
  ], [GOOGLE, SIR("Telegram", "TELEGRAM_BOT_TOKEN")], { sektor: ["ajans", "saas"] }),
  t("v5-takvim-musteri-sms", "destek", "Randevudan önce müşteriye SMS", "Takvimdeki müşteri etkinliğinden 2 saat önce açıklamadaki telefona hatırlatma SMS'i gider.", servisT("takvim-baslangic", { takvim: "primary", dakika: "120", ara: "Müşteri" }, 15), [
    don("s1", "Telefonu bul", "metin", "desen", "{{tetik.description}}", "\\+?\\d[\\d ]{9,14}"),
    suz("s2", "Telefon var mı", [k("{{adim.s1.sonuc}}", "bos-degil")]),
    sms("s3", "{{adim.s1.sonuc}}", "Bugün {{tetik.start.dateTime | tarih}} randevunuzu hatırlatırız."),
  ], [GOOGLE, SIR("Netgsm", "NETGSM_KULLANICI", "NETGSM_SIFRE"), "Etkinlik açıklamasına müşterinin telefonunu yaz"], { sektor: ["saglik", "hizmet"] }),
  t("v5-drive-yeni-dosya", "operasyon", "Drive klasörüne dosya gelince ekibe haber ver", "Paylaşılan klasöre yeni dosya eklenince adı ve bağlantısıyla Slack'e yazar.", servisT("drive-dosya", { klasor: "" }, 15), [
    sl("s1", "Yeni dosya: {{tetik.name}} {{tetik.webViewLink}}"),
  ], [GOOGLE, SIR("Slack", "SLACK_WEBHOOK_URL"), "Tetikte klasör kimliğini yaz"]),
  t("v5-gunluk-rapor-drive", "operasyon", "Günlük sipariş raporunu Drive'a CSV olarak kaydet", "Her gece siparişler tablosu CSV'ye çevrilir ve tarihli dosya olarak Drive'a yüklenir.", gunluk("23:30"), [
    bul("s1", "Bugünün siparişleri", "siparisler", [], { sinir: 1000 }),
    don("s2", "CSV", "yardimci", "csvYaz", "{{adim.s1.kayitlar}}", ";"),
    uyg("s3", "Drive'a yükle", "google-drive", "yukle", { ad: "siparisler-{{tarih}}.csv", icerik: "{{adim.s2.sonuc}}", tur: "text/csv", ust: "{{degisken.drive_klasor}}" }),
  ], [PROJE, GOOGLE, "drive_klasor değişkenine klasör kimliğini yaz"], { sektor: ["eticaret"] }),
  t("v5-form-dokuman", "operasyon", "Form yanıtından Google Dokümanı üret", "Form sayfası doldurulunca yapay zekâ teklif metnini yazar, yeni dokümana ekler ve bağlantıyı gönderir.", formS("Teklif iste", "İhtiyacını anlat, teklif hazırlayalım."), [
    ajan("s1", "Teklif yaz", "Şu ihtiyaç için kısa, kalemli bir Türkçe teklif metni yaz: {{tetik.ihtiyac}}. Firma: {{tetik.firma}}", [["metin", "metin"]]),
    uyg("s2", "Doküman", "google-docs", "olustur", { ad: "Teklif: {{tetik.firma}}" }),
    uyg("s3", "Metni ekle", "google-docs", "ekle", { dokuman: "{{adim.s2.yanit.documentId}}", metin: "{{adim.s1.metin}}" }),
    mail("s4", "{{degisken.benim_epostam}}", "Yeni teklif taslağı: {{tetik.firma}}", "https://docs.google.com/document/d/{{adim.s2.yanit.documentId}}"),
  ], [GOOGLE, SIR("Resend", "RESEND_API_KEY"), FORM], { girdi: [z("firma", "Firma"), z("eposta", "E-posta", "eposta"), z("ihtiyac", "İhtiyacınız", "uzunMetin")], sektor: ["ajans"] }),
  t("v5-gorev-google", "verimlilik", "Sohbetten Google Görevler'e görev ekle", "Sohbet kutusuna yazdığın işi yapay zekâ başlık ve tarihe ayırır, Google Görevler'e ekler.", sohbet("Görev ekle", "Ne yapman gerekiyor?", ["Yarın faturayı kes", "Cuma günü tedarikçiyi ara"]), [
    ajan("s1", "Ayır", "Bu cümleden görev başlığını ve YYYY-AA-GG biçiminde bitiş gününü çıkar (bugün {{tarih}}): {{tetik.mesaj}}", [["baslik", "metin"], ["gun", "metin"]]),
    uyg("s2", "Görev", "google-tasks", "ekle", { baslik: "{{adim.s1.baslik}}", bitis: "{{adim.s1.gun}}" }),
    yanit("s3", "Eklendi: {{adim.s1.baslik}} ({{adim.s1.gun}})"),
  ], [GOOGLE, SOHBET]),
  t("v5-ceviri-google", "icerik", "Ürün açıklamasını dört dile çevir", "Elle girdiğin metin Google Çeviri ile İngilizce, Almanca, Arapça ve Rusçaya aynı anda çevrilir.", elleForm(), [
    paralel("s1", "Aynı anda çevir", [["İngilizce", [uyg("s2", "İngilizce", "google-translate", "cevir", { metin: "{{tetik.metin}}", hedef: "en" })]], ["Almanca", [uyg("s3", "Almanca", "google-translate", "cevir", { metin: "{{tetik.metin}}", hedef: "de" })]], ["Arapça", [uyg("s4", "Arapça", "google-translate", "cevir", { metin: "{{tetik.metin}}", hedef: "ar" })]], ["Rusça", [uyg("s5", "Rusça", "google-translate", "cevir", { metin: "{{tetik.metin}}", hedef: "ru" })]]]),
  ], [SIR("Google Çeviri", "GOOGLE_API_KEY")], { girdi: [z("metin", "Metin", "uzunMetin")], sektor: ["eticaret", "turizm"] }),
  t("v5-ga-satis", "icerik", "Mağaza satışını Google Analytics'e gönder", "Her ödemesi alınan sipariş GA4'e purchase olayı olarak sunucudan iletilir.", isletmeT("siparis"), [
    uyg("s1", "GA4 olayı", "google-analytics", "olay", { istemci: "{{tetik.siparisNo}}", olay: "purchase", parametreler: "{\"transaction_id\": \"{{tetik.siparisNo}}\", \"value\": {{tetik.tutar}}, \"currency\": \"{{degisken.para_birimi}}\"}" }),
  ], [IS, SIR("Google Analytics", "GA_OLCUM_KIMLIGI", "GA_API_SECRET"), "para_birimi değişkenine mağazanın para birimini yaz (ör. USD, EUR, TRY)"], { sektor: ["eticaret"] }),
  /* ── Microsoft ── */
  t("v5-outlook-ozet", "verimlilik", "Outlook'taki okunmamış iletileri Teams'e özetle", "Yeni okunmamış e-postalar yapay zekâyla özetlenip Teams kanalına düşer.", servisT("outlook-ileti", {}, 15), [
    ajan("s1", "Özetle", "Şu e-postayı bir cümlede özetle: {{tetik.subject}} - {{tetik.bodyPreview}}", [["ozet", "metin"]]),
    uyg("s2", "Teams", "teams", "mesaj", { metin: "{{tetik.from.emailAddress.name}}: {{adim.s1.ozet}}" }),
  ], [SIR("Microsoft", "MICROSOFT_CLIENT_ID", "MICROSOFT_REFRESH_TOKEN"), SIR("Teams", "TEAMS_WEBHOOK_URL")]),
  t("v5-excel-siparis", "operasyon", "Mağaza siparişlerini Excel tablosuna yaz", "Her yeni siparişi OneDrive'daki Excel çalışma kitabının tablosuna satır olarak ekler.", isletmeT("siparis"), [
    uyg("s1", "Excel satırı", "microsoft-excel", "satir", { dosya: "{{degisken.excel_dosya}}", tablo: "Siparisler", degerler: "[\"{{tetik.siparisNo}}\", \"{{tarih}}\", \"{{tetik.alici.ad}} {{tetik.alici.soyad}}\", {{tetik.tutar}}]" }),
  ], [IS, SIR("Microsoft", "MICROSOFT_CLIENT_ID", "MICROSOFT_REFRESH_TOKEN"), "excel_dosya değişkenine dosya yolunu yaz ve tabloyu Siparisler adıyla oluştur"], { sektor: ["eticaret"] }),
  t("v5-outlook-teklif", "satis", "Form talebine Outlook'tan teklif e-postası", "Teklif formu doldurulunca yapay zekâ kişisel bir yanıt yazar, onayından sonra Outlook'tan gönderilir.", formS("Teklif formu", "Bilgilerini bırak, sana özel teklif hazırlayalım."), [
    ajan("s1", "Teklif e-postası", "{{tetik.ad}} için {{tetik.hizmet}} hizmetine dair nazik, kısa bir teklif e-postası yaz.", [["govde", "metin"]]),
    onay("s2", "Gönderilsin mi", "Teklif: {{tetik.ad}}", "{{adim.s1.govde}}", [uyg("s3", "Outlook", "outlook", "gonder", { alici: "{{tetik.eposta}}", konu: "{{tetik.hizmet}} teklifimiz", govde: "{{adim.s2.icerik}}" })]),
  ], [SIR("Microsoft", "MICROSOFT_CLIENT_ID", "MICROSOFT_REFRESH_TOKEN"), FORM], { girdi: [z("ad", "Ad soyad"), z("eposta", "E-posta", "eposta"), z("hizmet", "Hizmet", "secim", { secenekler: ["Web sitesi", "Sosyal medya", "Reklam"] })], sektor: ["ajans"] }),
  /* ── CRM ve satış ── */
  t("v5-typeform-pipedrive", "satis", "Typeform yanıtından Pipedrive fırsatı", "Talep formu yanıtlanınca kişi ve fırsat Pipedrive'da açılır.", servisT("typeform-yanit", { form: "" }), [
    ayarla("s1", "Alanları topla", [["ad", "{{tetik.answers.0.text}}"], ["eposta", "{{tetik.answers.1.email}}"]]),
    uyg("s2", "Kişi", "pipedrive", "kisi", { ad: "{{adim.s1.ad}}", eposta: "{{adim.s1.eposta}}" }),
    uyg("s3", "Fırsat", "pipedrive", "firsat", { baslik: "{{adim.s1.ad}} talebi", kisi: "{{adim.s2.yanit.data.id}}", para: "{{degisken.para_birimi | varsayilan(\"USD\")}}" }),
  ], [SIR("Typeform", "TYPEFORM_TOKEN"), SIR("Pipedrive", "PIPEDRIVE_TOKEN"), "Alanları ayarla adımında formundaki soru sırasına göre yanıtları seç"], { sektor: ["saas", "ajans"] }),
  t("v5-calendly-hubspot", "satis", "Calendly randevusunu HubSpot'a not olarak işle", "Yeni Calendly randevusunda kişi HubSpot'ta aranır, yoksa açılır ve toplantı notu eklenir.", servisT("calendly-randevu"), [
    uyg("s1", "Kişiyi ara", "hubspot", "kisi-ara", { eposta: "{{tetik.event_guests.0.email | varsayilan(\"\")}}" }),
    uyg("s2", "Not ekle", "hubspot", "not", { kisi: "{{adim.s1.yanit.results.0.id}}", metin: "Calendly toplantısı: {{tetik.name}}, {{tetik.start_time | tarih}}" }, ),
  ], [SIR("Calendly", "CALENDLY_TOKEN", "CALENDLY_KULLANICI"), SIR("HubSpot", "HUBSPOT_TOKEN")], { sektor: ["saas"] }),
  t("v5-salesforce-form", "satis", "Form sayfasından Salesforce adayı", "Herkese açık formu dolduran kişi Salesforce'ta aday olarak açılır ve satış ekibine e-posta gider.", formS("Bize ulaşın", "Uzmanımız sizi arasın."), [
    uyg("s1", "Aday", "salesforce", "aday", { soyad: "{{tetik.soyad}}", ad: "{{tetik.ad}}", sirket: "{{tetik.sirket}}", eposta: "{{tetik.eposta}}", telefon: "{{tetik.telefon}}", kaynak: "Web" }),
    mail("s2", "{{degisken.satis_eposta}}", "Yeni aday: {{tetik.sirket}}", "{{tetik.ad}} {{tetik.soyad}} ({{tetik.eposta}}) Salesforce kaydı: {{adim.s1.yanit.id}}"),
  ], [SIR("Salesforce", "SALESFORCE_ALAN", "SALESFORCE_CLIENT_ID", "SALESFORCE_CLIENT_SECRET"), SIR("Resend", "RESEND_API_KEY"), FORM], { girdi: [z("ad", "Ad"), z("soyad", "Soyad"), z("sirket", "Şirket"), z("eposta", "E-posta", "eposta"), g("telefon", "Telefon", "telefon")], sektor: ["saas"] }),
  t("v5-zoho-sohbet", "satis", "Sohbetten gelen talebi Zoho CRM'e aday yap", "Sohbet kutusunda iletişim bilgisi veren ziyaretçi Zoho CRM'e aday olarak eklenir.", sohbet("Satış ekibi", "Size nasıl yardımcı olalım?", ["Fiyat almak istiyorum", "Demo talebi"]), [
    ajan("s1", "Bilgileri çıkar", "Bu mesajdan ad, soyad, şirket ve e-postayı çıkar; yoksa boş bırak: {{tetik.mesaj}}", [["ad", "metin"], ["soyad", "metin"], ["sirket", "metin"], ["eposta", "metin"]]),
    suz("s2", "E-posta var mı", [k("{{adim.s1.eposta}}", "bos-degil")]),
    uyg("s3", "Zoho adayı", "zoho-crm", "aday", { soyad: "{{adim.s1.soyad | varsayilan(\"Bilinmiyor\")}}", ad: "{{adim.s1.ad}}", sirket: "{{adim.s1.sirket}}", eposta: "{{adim.s1.eposta}}" }),
    yanit("s4", "Teşekkürler, ekibimiz size e-postayla dönecek."),
  ], [SIR("Zoho", "ZOHO_CLIENT_ID", "ZOHO_CLIENT_SECRET", "ZOHO_REFRESH_TOKEN"), SOHBET], { sektor: ["saas"] }),
  t("v5-hunter-zenginlestir", "satis", "Yeni adayın e-postasını Hunter ile doğrula", "Aday tablosuna kayıt eklenince e-posta Hunter'da doğrulanır ve sonuç kayda yazılır.", tablo("adaylar"), [
    uyg("s1", "Doğrula", "hunter", "dogrula", { eposta: "{{tetik.kayit.eposta}}" }),
    guncelle("s2", "Sonucu yaz", "adaylar", "{{tetik.kayit.id}}", "{\"epostaDurumu\": \"{{adim.s1.yanit.data.status}}\"}"),
  ], [PROJE, SIR("Hunter", "HUNTER_API_KEY")], { sektor: ["saas", "ajans"] }),
  t("v5-attio-kisi", "satis", "Yeni aboneyi Attio'ya kişi olarak ekle", "Siteden abone olan kişi Attio'da e-postaya göre eşleştirilip açılır.", isletmeT("abone"), [
    uyg("s1", "Attio kişisi", "attio", "kisi", { eposta: "{{tetik.eposta}}", ad: "{{tetik.ad}}" }),
  ], [IS, SIR("Attio", "ATTIO_TOKEN")]),
  t("v5-close-lead", "satis", "Web kancasıyla gelen talebi Close'a aktar", "Dış formdan gelen talep Close'ta potansiyel müşteri olarak açılır.", kanca(), [
    uyg("s1", "Close", "close", "lead", { ad: "{{tetik.sirket}}", kisi: "{{tetik.ad}}", eposta: "{{tetik.eposta}}", telefon: "{{tetik.telefon}}" }),
  ], [SIR("Close", "CLOSE_API_KEY"), "Formunu bu sistemin web kancası adresine gönderecek şekilde ayarla"], { sektor: ["saas"] }),
  /* ── Destek ── */
  t("v5-freshdesk-form", "destek", "Destek formundan Freshdesk talebi", "Herkese açık destek formu Freshdesk'te talep açar, müşteriye talep numarasını gösterir.", formS("Destek talebi", "Sorununu anlat, en kısa sürede dönelim.", { bitis: "sonuc" }), [
    uyg("s1", "Talep aç", "freshdesk", "talep", { eposta: "{{tetik.eposta}}", konu: "{{tetik.konu}}", aciklama: "{{tetik.aciklama}}", oncelik: "2" }),
    yanit("s2", "Talebiniz alındı. Numara: {{adim.s1.yanit.id}}"),
  ], [SIR("Freshdesk", "FRESHDESK_ALAN", "FRESHDESK_API_KEY"), FORM], { girdi: [z("eposta", "E-posta", "eposta"), z("konu", "Konu"), z("aciklama", "Açıklama", "uzunMetin")] }),
  t("v5-intercom-not", "destek", "Mağaza siparişini Intercom kişisine not düş", "Sipariş veren müşteri Intercom'da açılır ve sipariş bilgisi not olarak eklenir.", isletmeT("siparis"), [
    uyg("s1", "Kişi", "intercom", "kisi", { eposta: "{{tetik.eposta}}", ad: "{{tetik.alici.ad}} {{tetik.alici.soyad}}", rol: "user" }),
    uyg("s2", "Not", "intercom", "not", { kisi: "{{adim.s1.yanit.id}}", metin: "Sipariş {{tetik.siparisNo}}: {{tetik.tutar | tl}}" }),
  ], [IS, SIR("Intercom", "INTERCOM_TOKEN")], { sektor: ["eticaret", "saas"] }),
  t("v5-zendesk-yz-yanit", "destek", "Zendesk talebine yapay zekâyla ilk yanıt", "Web kancasıyla gelen yeni Zendesk talebine yapay zekâ ilk yanıtı iç not olarak yazar.", kanca(), [
    uyg("s1", "Talebi getir", "zendesk", "getir", { talep: "{{tetik.ticket_id}}" }),
    ajan("s2", "Yanıt öner", "Bu destek talebine kısa bir ilk yanıt öner: {{adim.s1.yanit.ticket.subject}} - {{adim.s1.yanit.ticket.description}}", [["yanit", "metin"]]),
    uyg("s3", "İç not", "zendesk", "yanit", { talep: "{{tetik.ticket_id}}", metin: "Önerilen yanıt:\n{{adim.s2.yanit}}", ic: "true" }),
  ], [SIR("Zendesk", "ZENDESK_ALT_ALAN", "ZENDESK_EPOSTA", "ZENDESK_TOKEN"), "Zendesk tetikleyicisinde bu web kancasına ticket_id gönder"], { sektor: ["saas"] }),
  t("v5-whatsapp-imzali", "destek", "WhatsApp mesajına yapay zekâyla yanıt", "Meta imzasıyla doğrulanan WhatsApp mesajı sınıflandırılır; sık sorulara anında, diğerlerine ekip yanıt verir.", imzaliKanca("meta"), [
    suz("s1", "Mesaj var mı", [k("{{tetik.entry.0.changes.0.value.messages.0.text.body}}", "bos-degil")]),
    sinif("s2", "Ne soruyor", "{{tetik.entry.0.changes.0.value.messages.0.text.body}}", [
      ["Sipariş durumu", "Siparişinin nerede olduğunu soruyor", [uyg("s3", "Yanıtla", "whatsapp", "metin", { telefon: "{{tetik.entry.0.changes.0.value.messages.0.from}}", metin: "Sipariş numaranı yazarsan durumunu hemen iletelim." })]],
      ["Çalışma saatleri", "Açık olduğu saatleri soruyor", [uyg("s4", "Yanıtla", "whatsapp", "metin", { telefon: "{{tetik.entry.0.changes.0.value.messages.0.from}}", metin: "Hafta içi 09.00 ile 18.00 arası açığız." })]],
    ], [sl("s5", "WhatsApp mesajı ekip bekliyor: {{tetik.entry.0.changes.0.value.messages.0.text.body}}")]),
  ], [SIR("WhatsApp", "WHATSAPP_TOKEN", "WHATSAPP_PHONE_ID", "META_APP_SECRET"), "Meta panelinde web kancası adresine bu sistemin canlı adresini, doğrulama belirtecine tetikteki belirteci gir"], { sektor: ["eticaret", "restoran"] }),
  t("v5-telegram-bot", "destek", "Telegram botu sorulara yapay zekâyla yanıt versin", "Telegram'a gelen mesaj gizli belirteçle doğrulanır, yapay zekâ yanıtı aynı sohbete yazılır.", imzaliKanca("telegram"), [
    suz("s1", "Metin var mı", [k("{{tetik.message.text}}", "bos-degil")]),
    ajan("s2", "Yanıt", "Kullanıcının mesajına kısa ve yardımsever bir Türkçe yanıt ver: {{tetik.message.text}}", [["yanit", "metin"]]),
    uyg("s3", "Gönder", "telegram", "mesaj", { sohbet: "{{tetik.message.chat.id}}", metin: "{{adim.s2.yanit}}" }),
  ], [SIR("Telegram", "TELEGRAM_BOT_TOKEN", "TELEGRAM_WEBHOOK_SECRET"), "setWebhook ile bu adresi ve secret_token değerini kaydet"]),
  /* ── Kargo ── */
  t("v5-mng-takip", "operasyon", "MNG Kargo gönderisi teslim edilince bildir", "Her saat kargoda olan siparişlerin MNG durumu sorgulanır; teslim edilenler tabloda güncellenir ve müşteriye SMS gider.", saatlik(), [
    bul("s1", "Kargodakiler", "siparisler", [k("durum", "esit", "kargoda")], { sinir: 100 }),
    dongu("s2", "Her gönderi", "{{adim.s1.kayitlar}}", [
      uyg("s3", "MNG durumu", "mng", "durum", { referans: "{{dongu.oge.siparisNo}}" }),
      suz("s4", "Teslim mi", [k("{{adim.s3.yanit.isDelivered}}", "dogru")]),
      guncelle("s5", "Teslim edildi", "siparisler", "{{dongu.oge.id}}", "{\"durum\": \"teslim\"}"),
      sms("s6", "{{dongu.oge.telefon}}", "{{dongu.oge.siparisNo}} numaralı gönderiniz teslim edildi. Teşekkür ederiz."),
    ]),
  ], [PROJE, SIR("MNG Kargo", "MNG_CLIENT_ID", "MNG_CLIENT_SECRET", "MNG_MUSTERI_NO", "MNG_SIFRE"), SIR("Netgsm", "NETGSM_KULLANICI", "NETGSM_SIFRE")], { sektor: ["eticaret"] }),
  t("v5-yurtici-takip-form", "destek", "Kargom nerede formu", "Müşteri sipariş numarasını yazar; Yurtiçi Kargo'dan son hareket ve takip adresi anında formda gösterilir.", formS("Kargom nerede", "Sipariş numaranı yaz.", { bitis: "sonuc" }), [
    uyg("s1", "Sorgula", "yurtici", "takip", { kargoAnahtari: "{{tetik.siparisNo}}", gecmis: "false" }),
    yanit("s2", "Durum: {{adim.s1.yanit.queryShipmentResponse.ShippingDeliveryVO.shippingDeliveryDetailVO.operationMessage | varsayilan(\"Kayıt bulunamadı\")}}\nTakip: {{adim.s1.yanit.queryShipmentResponse.ShippingDeliveryVO.shippingDeliveryDetailVO.shippingDeliveryItemDetailVO.trackingUrl | varsayilan(\"\")}}"),
  ], [SIR("Yurtiçi Kargo", "YURTICI_KULLANICI", "YURTICI_SIFRE"), FORM], { girdi: [z("siparisNo", "Sipariş numarası")], sektor: ["eticaret"] }),
  t("v5-aras-iptal", "operasyon", "İptal edilen siparişin Aras gönderisini iptal et", "Mağaza siparişi iptal aşamasına geçince Aras Kargo kaydı da iptal edilir.", isletmeT("siparisAsama"), [
    suz("s1", "İptal mi", [k("{{tetik.yeniDurum}}", "esit", "iptal")]),
    uyg("s2", "Aras iptali", "aras", "iptal", { kod: "{{tetik.siparisNo}}" }),
  ], [IS, SIR("Aras Kargo", "ARAS_KULLANICI", "ARAS_SIFRE")], { sektor: ["eticaret"] }),
  t("v5-geliver-fiyat", "operasyon", "Kargo fiyatlarını karşılaştır", "Ölçü ve ağırlığı yazınca Geliver'deki firmaların fiyatlarını getirir, en uygununu söyler.", elleForm(), [
    uyg("s1", "Fiyatlar", "geliver", "fiyat", { en: "{{tetik.en}}", boy: "{{tetik.boy}}", yukseklik: "{{tetik.yukseklik}}", kg: "{{tetik.kg}}" }),
    ajan("s2", "Karşılaştır", "Bu kargo fiyat listesinden en uygun üç firmayı fiyatıyla sırala: {{adim.s1.yanit | json | kisalt(4000)}}"),
  ], [SIR("Geliver", "GELIVER_TOKEN")], { girdi: [z("en", "En (cm)", "sayi"), z("boy", "Boy (cm)", "sayi"), z("yukseklik", "Yükseklik (cm)", "sayi"), z("kg", "Ağırlık (kg)", "sayi")], sektor: ["eticaret"] }),
  /* ── Finans ve ödeme ── */
  t("v5-paytr-link", "finans", "Formdan PayTR ödeme linki üret", "Tutar ve ürün adını yazınca PayTR ödeme linki oluşturulur ve müşteriye WhatsApp'tan gider.", elleForm(), [
    uyg("s1", "Link", "paytr", "link", { ad: "{{tetik.urun}}", tutar: "{{tetik.tutar}}", taksit: "1" }),
    uyg("s2", "WhatsApp", "whatsapp", "metin", { telefon: "{{tetik.telefon}}", metin: "Ödeme bağlantınız: {{adim.s1.yanit.link}}" }),
  ], [BAG("PayTR"), SIR("WhatsApp", "WHATSAPP_TOKEN", "WHATSAPP_PHONE_ID")], { girdi: [z("urun", "Ürün ya da hizmet"), z("tutar", "Tutar", "sayi"), z("telefon", "Müşteri telefonu", "telefon")], sektor: ["hizmet", "eticaret"] }),
  t("v5-iyzico-iade-onay", "finans", "Onaylı iyzico iadesi", "İade talebi formdan gelir, yönetici onaylarsa iyzico'da iade yapılır ve müşteriye bilgi verilir.", formS("İade talebi", "Siparişini ve nedenini yaz."), [
    onay("s1", "İade onayı", "İade: {{tetik.siparisNo}}", "Tutar: {{tetik.tutar}}\nNeden: {{tetik.neden}}", [
      uyg("s2", "iyzico iadesi", "iyzico", "iade", { islem: "{{tetik.islemNo}}", tutar: "{{tetik.tutar}}", ip: "85.34.78.112" }),
      mail("s3", "{{tetik.eposta}}", "İadeniz yapıldı", "{{tetik.siparisNo}} için {{tetik.tutar | tl}} iade edildi."),
    ], [mail("s4", "{{tetik.eposta}}", "İade talebiniz hakkında", "Talebinizi inceledik; ekibimiz sizinle iletişime geçecek.")]),
  ], [BAG("iyzico"), SIR("Resend", "RESEND_API_KEY"), FORM], { girdi: [z("siparisNo", "Sipariş no"), z("islemNo", "Ödeme kalemi no"), z("tutar", "Tutar", "sayi"), z("eposta", "E-posta", "eposta"), z("neden", "Neden", "uzunMetin")], sektor: ["eticaret"] }),
  t("v5-stripe-imzali", "finans", "Stripe ödemesini doğrula ve faturala", "Stripe web kancası imzasıyla doğrulanır; başarılı ödemede Paraşüt'te fatura kesilir.", imzaliKanca("stripe"), [
    suz("s1", "Ödeme başarılı mı", [k("{{tetik.type}}", "esit", "checkout.session.completed")]),
    uyg("s2", "Cari", "parasut", "cari", { ad: "{{tetik.data.object.customer_details.name}}", eposta: "{{tetik.data.object.customer_details.email}}", tur: "customer", kisi: "person" }),
    uyg("s3", "Fatura", "parasut", "fatura", { cari: "{{adim.s2.yanit.data.id}}", aciklama: "Stripe {{tetik.data.object.id}}", kalemler: "[{\"adet\": 1, \"fiyat\": {{tetik.data.object.amount_subtotal | bolu(100)}}, \"kdv\": 20}]", referans: "{{tetik.data.object.id}}" }),
  ], [SIR("Stripe imzası", "STRIPE_WEBHOOK_SECRET"), BAG("Paraşüt"), "Stripe'ta checkout.session.completed olayı için bu sistemin adresini web kancası olarak ekle"], { sektor: ["saas"] }),
  t("v5-paddle-iptal-anket", "finans", "Paddle abonelik iptalinde geri bildirim iste", "İmzalı Paddle olayında abonelik iptal edilince müşteriye kısa bir anket e-postası gider.", imzaliKanca("paddle"), [
    suz("s1", "İptal mi", [k("{{tetik.event_type}}", "esit", "subscription.canceled")]),
    mail("s2", "{{tetik.data.customer.email}}", "Neden ayrıldığını öğrenebilir miyiz?", "Aboneliğin iptal edildi. Bir dakikanı ayırıp bize nedenini yazar mısın?"),
  ], [SIR("Paddle imzası", "PADDLE_WEBHOOK_SECRET"), SIR("Resend", "RESEND_API_KEY")], { sektor: ["saas"] }),
  t("v5-nilvera-mukellef", "finans", "Kurumsal siparişte e-Fatura mükellefi mi bak", "Mağaza siparişinde vergi numarası varsa Nilvera'dan mükellefiyet sorgulanır ve muhasebeye bildirilir.", isletmeT("siparis"), [
    suz("s1", "Vergi numarası var mı", [k("{{tetik.isletme.fatura.vergiNo}}", "bos-degil")]),
    uyg("s2", "Mükellef sorgusu", "nilvera", "mukellef", { vkn: "{{tetik.isletme.fatura.vergiNo}}" }),
    mail("s3", "{{degisken.muhasebe_eposta}}", "Kurumsal sipariş {{tetik.siparisNo}}", "{{tetik.isletme.fatura.unvan}} ({{tetik.isletme.fatura.vergiNo}}) e-Fatura kaydı: {{adim.s2.yanit | json | kisalt(500)}}"),
  ], [IS, SIR("Nilvera", "NILVERA_TOKEN"), SIR("Resend", "RESEND_API_KEY"), "muhasebe_eposta değişkenini ekle"], { sektor: ["eticaret"] }),
  t("v5-mikro-siparis", "finans", "Mağaza siparişini Mikro'ya aktar", "Ödemesi alınan sipariş Mikro'da cari ve sipariş evrakı olarak açılır.", isletmeT("siparis"), [
    uyg("s1", "Cari", "mikro", "cari", { kod: "WEB-{{tetik.eposta | kisalt(20)}}", unvan: "{{tetik.alici.ad}} {{tetik.alici.soyad}}", eposta: "{{tetik.eposta}}", telefon: "{{tetik.alici.telefon}}", il: "{{tetik.alici.sehir}}" }),
    uyg("s2", "Sipariş", "mikro", "siparis", { musteri: "WEB-{{tetik.eposta | kisalt(20)}}", seri: "WEB", satirlar: "[{\"stok\": \"{{degisken.mikro_stok_kodu}}\", \"miktar\": 1, \"fiyat\": {{tetik.tutar}}}]", aciklama: "Web siparişi {{tetik.siparisNo}}" }),
  ], [IS, SIR("Mikro", "MIKRO_SUNUCU", "MIKRO_API_KEY", "MIKRO_FIRMA_KODU", "MIKRO_KULLANICI", "MIKRO_SIFRE"), "Satırlarda kalemleri kendi stok kodlarınla eşleştir"], { sektor: ["eticaret"] }),
  t("v5-papara-link", "finans", "Papara ödeme linkini SMS ile gönder", "Tutar ve müşteri bilgisini yazınca Papara ödeme linki oluşturulur ve SMS ile gönderilir.", elleForm(), [
    uyg("s1", "Papara linki", "papara", "link", { tutar: "{{tetik.tutar}}", ad: "{{tetik.ad}}", aciklama: "{{tetik.aciklama}}", telefon: "{{tetik.telefon}}" }),
  ], [BAG("Papara")], { girdi: [z("ad", "Ad soyad"), z("tutar", "Tutar", "sayi"), z("aciklama", "Açıklama"), z("telefon", "Telefon", "telefon")], sektor: ["hizmet"] }),
  t("v5-doviz-sabah", "finans", "Her sabah döviz ve altın özetini Telegram'a gönder", "Hafta içi 09.00'da CollectAPI'den döviz ve altın fiyatları alınır, kısa özet olarak yazılır.", haftaici("09:00"), [
    paralel("s1", "Aynı anda al", [["Döviz", [uyg("s2", "Döviz", "collectapi", "doviz", {})]], ["Altın", [uyg("s3", "Altın", "collectapi", "altin", {})]]]),
    ajan("s4", "Özetle", "Şu döviz ve altın verilerinden USD, EUR, gram altın ve çeyrek altını tek mesajda özetle: {{adim.s1.veri | json | kisalt(6000)}}"),
    tg("s5", "{{adim.s4.cikti}}"),
  ], [SIR("CollectAPI", "COLLECTAPI_TOKEN"), SIR("Telegram", "TELEGRAM_BOT_TOKEN")]),
  t("v5-nobetci-eczane", "verimlilik", "Nöbetçi eczaneyi sor", "Sohbette ilçeni yazınca CollectAPI'den o ilçedeki nöbetçi eczaneler gelir.", sohbet("Nöbetçi eczane", "Hangi il ve ilçedesin?", ["İstanbul Kadıköy", "İzmir Bornova"]), [
    ajan("s1", "İl ve ilçe", "Bu mesajdan il ve ilçeyi çıkar: {{tetik.mesaj}}", [["il", "metin"], ["ilce", "metin"]]),
    uyg("s2", "Eczaneler", "collectapi", "eczane", { il: "{{adim.s1.il}}", ilce: "{{adim.s1.ilce}}" }),
    ajan("s3", "Listele", "Bu nöbetçi eczaneleri ad, adres ve telefonla kısa listele: {{adim.s2.yanit.result | json | kisalt(5000)}}"),
    yanit("s4", "{{adim.s3.cikti}}"),
  ], [SIR("CollectAPI", "COLLECTAPI_TOKEN"), SOHBET], { sektor: ["saglik"] }),
  /* ── Yazılım ── */
  t("v5-github-imzali", "yazilim", "GitHub olayını imzalı web kancasıyla al", "GitHub imzası doğrulanan push olayları Discord'a commit listesiyle yazılır.", imzaliKanca("github"), [
    suz("s1", "Push mu", [k("{{tetik.ref}}", "bos-degil")]),
    don("s2", "Commit mesajları", "liste", "alan", "{{tetik.commits}}", "message"),
    uyg("s3", "Discord", "discord", "kart", { baslik: "{{tetik.repository.full_name}}: {{tetik.commits | uzunluk}} commit", aciklama: "{{adim.s2.sonuc | birlestir(\"\\n\")}}", adres: "{{tetik.compare}}" }),
  ], [SIR("GitHub imzası", "GITHUB_WEBHOOK_SECRET"), SIR("Discord", "DISCORD_WEBHOOK_URL")], { sektor: ["saas"] }),
  t("v5-github-surum-notu", "yazilim", "Yapay zekâyla sürüm notu yazıp GitHub'da yayınla", "Etiket ve değişiklik listesini girince yapay zekâ kullanıcı dostu sürüm notunu yazar, GitHub sürümü taslak olarak açar.", elleForm(), [
    ajan("s1", "Sürüm notu", "Şu değişikliklerden kullanıcıya dönük, maddeli bir Türkçe sürüm notu yaz: {{tetik.degisiklikler}}"),
    uyg("s2", "GitHub sürümü", "github", "surum", { depo: "{{degisken.github_depo}}", etiket: "{{tetik.etiket}}", ad: "{{tetik.etiket}}", not: "{{adim.s1.cikti}}", taslak: "true" }),
  ], [BAG("GitHub"), "github_depo değişkenine sahip/depo yaz"], { girdi: [z("etiket", "Etiket"), z("degisiklikler", "Değişiklikler", "uzunMetin")], sektor: ["saas"] }),
  t("v5-jira-linear", "yazilim", "Yeni Jira kaydını Linear'a kopyala", "JQL'e uyan yeni Jira kayıtları Linear'da konu olarak açılır.", servisT("jira-kayit", { jql: "project = DESTEK ORDER BY created DESC" }, 15), [
    uyg("s1", "Linear konusu", "linear", "konu", { takim: "{{degisken.linear_takim}}", baslik: "[{{tetik.key}}] {{tetik.fields.summary}}", aciklama: "Jira: {{tetik.key}}" }),
  ], [SIR("Jira", "JIRA_SITE", "JIRA_EPOSTA", "JIRA_TOKEN"), BAG("Linear"), "linear_takim değişkenini ekle"], { sektor: ["saas"] }),
  t("v5-pagerduty-hata", "yazilim", "Sistem hatasında PagerDuty olayı aç", "İzlenen sistem başarısız olunca PagerDuty'de kritik olay açılır.", { tur: "sistem", sistemId: "" }, [
    uyg("s1", "Olay aç", "pagerduty", "ac", { ozet: "{{tetik.sistem}} hata verdi: {{tetik.cikti | kisalt(300)}}", kaynak: "vayra-sistem", onem: "critical", anahtar: "{{tetik.calisma}}" }),
  ], [SIR("PagerDuty", "PAGERDUTY_ROUTING_KEY"), "Başka sistem tetiğinde izlenecek sistemi seç ya da bunu hata sistemi olarak ata"], { sektor: ["saas"] }),
  t("v5-vercel-dagit", "yazilim", "İçerik değişince siteyi yeniden dağıt", "Notion veritabanına yeni sayfa eklenince Vercel dağıtım kancası çalışır.", servisT("notion-sayfa", { veritabani: "" }, 15), [
    uyg("s1", "Dağıt", "vercel", "dagit", {}),
    sl("s2", "Yeni içerik için dağıtım başladı: {{tetik.url}}"),
  ], [SIR("Notion", "NOTION_TOKEN"), SIR("Vercel", "VERCEL_DEPLOY_HOOK"), SIR("Slack", "SLACK_WEBHOOK_URL")], { sektor: ["saas", "ajans"] }),
  t("v5-supabase-hosgeldin", "yazilim", "Supabase'e yeni kullanıcı gelince hoş geldin e-postası", "profiles tablosuna yeni satır gelince Postmark şablonuyla hoş geldin e-postası gider.", servisT("supabase-satir", { tablo: "profiles", suzgec: "order=created_at.desc" }, 5), [
    uyg("s1", "Postmark", "postmark", "sablon", { gonderen: "{{degisken.gonderen_eposta}}", alici: "{{tetik.email}}", sablon: "hosgeldin", model: "{\"ad\": \"{{tetik.full_name}}\"}" }),
  ], [SIR("Supabase", "SUPABASE_URL", "SUPABASE_KEY"), SIR("Postmark", "POSTMARK_TOKEN"), "Postmark'ta hosgeldin takma adlı şablon oluştur"], { sektor: ["saas"] }),
  t("v5-upstash-sayac", "yazilim", "Web kancası isteklerini Upstash'te say", "Her gelen istek Upstash Redis sayacını artırır; günlük toplam API ile okunabilir.", kanca(), [
    uyg("s1", "Sayaç", "upstash", "artir", { anahtar: "istek:{{tarih}}", miktar: "1" }),
    yanit("s2", "{\"ok\": true, \"bugun\": {{adim.s1.yanit.result}}}", "json"),
  ], [SIR("Upstash", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN")], { sektor: ["saas"] }),
  t("v5-gitlab-hata", "yazilim", "Destek formundaki hatayı GitLab konusu yap", "Hata bildirim formu GitLab'da etiketli konu açar ve bildirene numarasını gösterir.", formS("Hata bildir", "Ne oldu, nasıl tekrarlanır?", { bitis: "sonuc" }), [
    uyg("s1", "GitLab konusu", "gitlab", "konu", { proje: "{{degisken.gitlab_proje}}", baslik: "{{tetik.baslik}}", aciklama: "{{tetik.aciklama}}\n\nBildiren: {{tetik.eposta}}", etiketler: "hata, kullanici" }),
    yanit("s2", "Teşekkürler, kayıt açıldı: {{adim.s1.yanit.web_url}}"),
  ], [SIR("GitLab", "GITLAB_TOKEN"), "gitlab_proje değişkenine grup/proje yaz", FORM], { girdi: [z("baslik", "Kısa başlık"), z("aciklama", "Açıklama", "uzunMetin"), g("eposta", "E-posta", "eposta")], sektor: ["saas"] }),
  /* ── Proje ve verimlilik ── */
  t("v5-clickup-gorev-slack", "verimlilik", "Yeni ClickUp görevini Slack'e duyur", "Listeye eklenen görevler atananlarla birlikte Slack'e yazılır.", servisT("clickup-gorev", { liste: "" }, 15), [
    sl("s1", "Yeni görev: {{tetik.name}} {{tetik.url}}"),
  ], [SIR("ClickUp", "CLICKUP_TOKEN"), SIR("Slack", "SLACK_WEBHOOK_URL")]),
  t("v5-todoist-takvim", "verimlilik", "Todoist görevini takvime blok olarak ekle", "Tarihli yeni Todoist görevi Google Takvim'de bir saatlik çalışma bloğu olur.", servisT("todoist-gorev", {}, 15), [
    suz("s1", "Tarihi var mı", [k("{{tetik.due.date}}", "bos-degil")]),
    uyg("s2", "Takvim bloğu", "google-calendar", "olustur", { baslik: "Odak: {{tetik.content}}", baslangic: "{{tetik.due.date}} 10:00", bitis: "{{tetik.due.date}} 11:00", takvim: "primary" }),
  ], [SIR("Todoist", "TODOIST_TOKEN"), GOOGLE]),
  t("v5-monday-form", "operasyon", "Form talebini monday.com panosuna ekle", "Talep formu monday.com'da öğe olarak açılır ve açıklama güncelleme olarak yazılır.", formS("İş talebi", "Talebini ekibe ilet."), [
    uyg("s1", "Öğe", "monday", "oge", { pano: "{{degisken.monday_pano}}", ad: "{{tetik.baslik}}" }),
    uyg("s2", "Açıklama", "monday", "guncelleme", { oge: "{{adim.s1.yanit.data.create_item.id}}", metin: "{{tetik.aciklama}}\nTalep eden: {{tetik.ad}}" }),
  ], [SIR("monday.com", "MONDAY_TOKEN"), "monday_pano değişkenini ekle", FORM], { girdi: [z("ad", "Ad"), z("baslik", "Talep"), z("aciklama", "Ayrıntı", "uzunMetin")], sektor: ["ajans"] }),
  t("v5-airtable-notion", "verimlilik", "Airtable kaydını Notion'a sayfa yap", "Airtable tablosundaki yeni kayıt Notion veritabanında sayfa olarak açılır.", servisT("airtable-kayit", { taban: "", tablo: "" }, 15), [
    uyg("s1", "Notion sayfası", "notion", "sayfa", { veritabani: "{{degisken.notion_veritabani}}", baslikAlani: "Name", baslik: "{{tetik.fields.Ad}}", icerik: "{{tetik.fields | json}}" }),
  ], [SIR("Airtable", "AIRTABLE_TOKEN"), SIR("Notion", "NOTION_TOKEN"), "notion_veritabani değişkenini ekle"]),
  t("v5-asana-form", "operasyon", "Form talebinden Asana görevi ve alt görevler", "İçerik talebi formu Asana'da görev açar; hazırlık, tasarım ve yayın alt görevlerini ekler.", formS("İçerik talebi", "Neye ihtiyacın var?"), [
    uyg("s1", "Görev", "asana", "gorev", { proje: "{{degisken.asana_proje}}", ad: "{{tetik.konu}}", not: "{{tetik.ayrinti}}" }),
    paralel("s2", "Alt görevler", [["Hazırlık", [uyg("s3", "Hazırlık", "asana", "alt", { gorev: "{{adim.s1.yanit.data.gid}}", ad: "Metin hazırla" })]], ["Tasarım", [uyg("s4", "Tasarım", "asana", "alt", { gorev: "{{adim.s1.yanit.data.gid}}", ad: "Görsel tasarla" })]], ["Yayın", [uyg("s5", "Yayın", "asana", "alt", { gorev: "{{adim.s1.yanit.data.gid}}", ad: "Yayınla ve paylaş" })]]]),
  ], [SIR("Asana", "ASANA_TOKEN"), "asana_proje değişkenini ekle", FORM], { girdi: [z("konu", "Konu"), z("ayrinti", "Ayrıntı", "uzunMetin")], sektor: ["ajans"] }),
  t("v5-zoom-toplanti", "operasyon", "Randevuya Zoom toplantısı aç", "Yeni randevuda Zoom toplantısı açılır ve katılım bağlantısı müşteriye e-postayla gider.", isletmeT("randevu"), [
    uyg("s1", "Zoom", "zoom", "toplanti", { konu: "{{tetik.hizmetAd}}: {{tetik.ad}}", baslangic: "{{tetik.baslangic}}", sure: "{{tetik.sure}}" }),
    mail("s2", "{{tetik.eposta}}", "Görüşme bağlantınız", "Randevunuz için bağlantı: {{adim.s1.yanit.join_url}}"),
  ], [IS, SIR("Zoom", "ZOOM_HESAP_ID", "ZOOM_CLIENT_ID", "ZOOM_CLIENT_SECRET"), SIR("Resend", "RESEND_API_KEY")], { sektor: ["saglik", "egitim", "hizmet"] }),
  t("v5-cal-iptal", "operasyon", "Cal.com rezervasyonunu sohbetten iptal et", "Sohbette rezervasyon kodunu veren kişinin Cal.com rezervasyonu iptal edilir.", sohbet("Rezervasyon", "Rezervasyon kodunu yaz, iptal edelim.", []), [
    ajan("s1", "Kodu çıkar", "Bu mesajdaki rezervasyon kodunu (uid) çıkar: {{tetik.mesaj}}", [["uid", "metin"]]),
    uyg("s2", "İptal", "cal-com", "iptal", { uid: "{{adim.s1.uid}}", neden: "Müşteri sohbetten iptal etti" }),
    yanit("s3", "Rezervasyonun iptal edildi."),
  ], [SIR("Cal.com", "CALCOM_API_KEY"), SOHBET]),
  t("v5-jotform-sheets", "operasyon", "Jotform gönderimini E-Tablolar'a yaz", "Yeni Jotform gönderimi cevaplarıyla birlikte tabloya satır olarak eklenir.", servisT("jotform-gonderim", { form: "" }, 15), [
    satirEkle("s1", "Satır", "[\"{{tetik.created_at}}\", {{tetik.answers | json}}]"),
  ], [SIR("Jotform", "JOTFORM_API_KEY"), GOOGLE, "tablo_kimligi değişkenini ekle"]),
  /* ── Pazarlama ve sosyal medya ── */
  t("v5-urun-sosyal", "icerik", "Yeni ürünü Instagram ve Facebook'ta paylaş", "Ürün tablosuna kayıt eklenince yapay zekâ açıklama yazar ve iki hesapta aynı anda paylaşılır.", tablo("urunler"), [
    ajan("s1", "Gönderi metni", "{{tetik.kayit.ad}} ürünü için emojisiz, kısa bir Türkçe sosyal medya metni ve 5 etiket yaz.", [["metin", "metin"]]),
    paralel("s2", "Paylaş", [["Instagram", [uyg("s3", "Instagram", "instagram", "gorsel", { gorsel: "{{tetik.kayit.gorsel}}", aciklama: "{{adim.s1.metin}}" })]], ["Facebook", [uyg("s4", "Facebook", "facebook-sayfa", "gorsel", { gorsel: "{{tetik.kayit.gorsel}}", aciklama: "{{adim.s1.metin}}" })]]]),
  ], [PROJE, SIR("Instagram", "INSTAGRAM_TOKEN", "INSTAGRAM_HESAP_ID"), SIR("Facebook", "FACEBOOK_PAGE_TOKEN", "FACEBOOK_PAGE_ID")], { sektor: ["eticaret", "restoran"] }),
  t("v5-blog-linkedin", "icerik", "Yeni blog yazısını LinkedIn ve Bluesky'de paylaş", "RSS'te yeni yazı çıkınca yapay zekâ kısa tanıtım yazar, LinkedIn ve Bluesky'de paylaşır.", rss("https://siten.com/feed"), [
    ajan("s1", "Tanıtım", "Şu yazı için 250 karakteri geçmeyen merak uyandırıcı bir tanıtım yaz: {{tetik.baslik}} - {{tetik.ozet}}", [["metin", "metin"]]),
    paralel("s2", "Paylaş", [["LinkedIn", [uyg("s3", "LinkedIn", "linkedin", "gonderi", { metin: "{{adim.s1.metin}}\n{{tetik.baglanti}}" })]], ["Bluesky", [uyg("s4", "Bluesky", "bluesky", "gonderi", { metin: "{{adim.s1.metin}} {{tetik.baglanti}}" })]]]),
  ], [SIR("LinkedIn", "LINKEDIN_TOKEN", "LINKEDIN_YAZAR"), SIR("Bluesky", "BLUESKY_KULLANICI", "BLUESKY_UYGULAMA_SIFRESI"), "RSS adresini kendi blogunla değiştir"], { sektor: ["ajans", "saas"] }),
  t("v5-mastodon-x", "icerik", "Duyuruyu Mastodon ve X'te paylaş", "Yazdığın duyuru Mastodon ve X hesaplarında aynı anda paylaşılır.", elleForm(), [
    paralel("s1", "Paylaş", [["Mastodon", [uyg("s2", "Mastodon", "mastodon", "durum", { metin: "{{tetik.metin}}", gorunurluk: "public" })]], ["X", [uyg("s3", "X", "x", "gonderi", { metin: "{{tetik.metin}}" })]]]),
  ], [SIR("Mastodon", "MASTODON_SUNUCU", "MASTODON_TOKEN"), SIR("X", "X_CLIENT_ID", "X_REFRESH_TOKEN")], { girdi: [z("metin", "Duyuru", "uzunMetin")] }),
  t("v5-pinterest-urun", "icerik", "Yeni ürünü Pinterest panosuna ekle", "Ürün tablosuna eklenen her ürün görseli ve bağlantısıyla Pinterest'e pin olur.", tablo("urunler"), [
    uyg("s1", "Pin", "pinterest", "pin", { pano: "{{degisken.pinterest_pano}}", gorsel: "{{tetik.kayit.gorsel}}", baslik: "{{tetik.kayit.ad}}", aciklama: "{{tetik.kayit.aciklama | kisalt(500)}}", adres: "{{degisken.site_adresi}}/urun/{{tetik.kayit.id}}" }),
  ], [PROJE, SIR("Pinterest", "PINTEREST_TOKEN"), "pinterest_pano değişkenini ekle"], { sektor: ["eticaret"] }),
  t("v5-klaviyo-siparis", "icerik", "Mağaza siparişini Klaviyo'ya olay olarak gönder", "Her ödemesi alınan sipariş Klaviyo'da profil ve Sipariş verdi olayı olarak kaydedilir; akışların tetiklenir.", isletmeT("siparis"), [
    uyg("s1", "Olay", "klaviyo", "olay", { eposta: "{{tetik.eposta}}", olay: "Sipariş verdi", deger: "{{tetik.tutar}}", ozellikler: "{\"siparisNo\": \"{{tetik.siparisNo}}\"}" }),
  ], [IS, SIR("Klaviyo", "KLAVIYO_API_KEY")], { sektor: ["eticaret"] }),
  t("v5-sendgrid-bulten", "icerik", "Bülten kaydını SendGrid listesine ekle", "Form sayfasından bültene kaydolan kişi SendGrid pazarlama listesine eklenir.", formS("Bültene katıl", "Yeniliklerden haberdar ol."), [
    uyg("s1", "SendGrid kişisi", "sendgrid", "kisi", { eposta: "{{tetik.eposta}}", ad: "{{tetik.ad}}", liste: "{{degisken.sendgrid_liste}}" }),
  ], [SIR("SendGrid", "SENDGRID_API_KEY"), FORM], { girdi: [z("eposta", "E-posta", "eposta"), g("ad", "Ad")] }),
  t("v5-mailerlite-kit", "icerik", "Yeni aboneyi MailerLite ve Kit'e ekle", "Abone iki bülten aracına aynı anda eklenir.", isletmeT("abone"), [
    paralel("s1", "Aynı anda", [["MailerLite", [uyg("s2", "MailerLite", "mailerlite", "abone", { eposta: "{{tetik.eposta}}", ad: "{{tetik.ad}}" })]], ["Kit", [uyg("s3", "Kit", "kit", "abone", { eposta: "{{tetik.eposta}}", ad: "{{tetik.ad}}" })]]]),
  ], [IS, SIR("MailerLite", "MAILERLITE_TOKEN"), SIR("Kit", "KIT_API_KEY")]),
  t("v5-onesignal-kampanya", "icerik", "Kampanya başlayınca anlık bildirim gönder", "Belirlediğin saatte tüm abonelere OneSignal ile anlık bildirim gider.", elleForm(), [
    yap("s1", "Başlangıca kadar bekle", "bekle", { mod: "tarih", tarih: "{{tetik.zaman}}" }),
    uyg("s2", "Bildirim", "onesignal", "bildirim", { baslik: "{{tetik.baslik}}", metin: "{{tetik.metin}}", adres: "{{tetik.adres}}" }),
  ], [SIR("OneSignal", "ONESIGNAL_APP_ID", "ONESIGNAL_API_KEY")], { girdi: [z("zaman", "Gönderim zamanı", "tarih"), z("baslik", "Başlık"), z("metin", "Metin", "uzunMetin"), g("adres", "Bağlantı")], sektor: ["eticaret", "saas"] }),
  t("v5-iletimerkezi-kampanya", "icerik", "Seçili müşterilere İleti Merkezi ile SMS kampanyası", "Tablodaki izinli müşterilere onaydan sonra İleti Merkezi üzerinden tek seferde SMS gönderir.", elleForm(), [
    bul("s1", "İzinli müşteriler", "musteriler", [k("smsIzni", "esit", "true")], { sinir: 1000 }),
    don("s2", "Telefonlar", "liste", "alan", "{{adim.s1.kayitlar}}", "telefon"),
    onay("s3", "Gönderim onayı", "{{adim.s1.sayi}} kişiye SMS", "{{tetik.mesaj}}", [uyg("s4", "SMS", "iletimerkezi", "sms", { baslik: "{{degisken.sms_baslik}}", alici: "{{adim.s2.sonuc | birlestir(\",\")}}", metin: "{{tetik.mesaj}}", iys: "true" })]),
  ], [PROJE, SIR("İleti Merkezi", "ILETIMERKEZI_KEY", "ILETIMERKEZI_HASH"), "sms_baslik değişkenini ekle"], { girdi: [z("mesaj", "Mesaj", "uzunMetin")], sektor: ["eticaret", "restoran"] }),
  t("v5-netgsm-otp", "yazilim", "Telefon doğrulama kodu API'si", "API ile çağrılır: 6 haneli kod üretir, depoda 5 dakika saklar ve Netgsm OTP ile gönderir.", kanca(), [
    kod("s1", "Kod üret", "export default function () {\n  return { kod: String(Math.floor(100000 + Math.random() * 900000)) };\n}\n"),
    depo("s2", "Kodu sakla", "yaz", "otp:{{tetik.telefon}}", { deger: "{{adim.s1.kod}}", sure: 300 }),
    uyg("s3", "OTP SMS", "netgsm", "otp", { baslik: "{{degisken.sms_baslik}}", alici: "{{tetik.telefon}}", metin: "Doğrulama kodunuz: {{adim.s1.kod}}" }),
    yanit("s4", "{\"gonderildi\": true}", "json"),
  ], [SIR("Netgsm", "NETGSM_KULLANICI", "NETGSM_SIFRE"), "Netgsm'de OTP paketi aç", "Kodu denetleyen ikinci sistemde Depo adımıyla otp:telefon anahtarını oku"], { sektor: ["saas"] }),
  t("v5-twilio-dogrulama", "yazilim", "Twilio Verify ile telefon doğrula", "Form sayfasında telefonu alır, Twilio Verify ile kod gönderir; ikinci adımda girilen kodu denetler.", elleForm(), [
    uyg("s1", "Kod gönder", "twilio", "dogrulama", { alici: "{{tetik.telefon}}", kanal: "sms" }),
    yap("s2", "Kodu bekle", "bekle", { mod: "webhook", zamanAsimiMiktar: 10, zamanAsimiBirim: "dakika", zamanAsiminda: "hata" }),
    uyg("s3", "Kodu denetle", "twilio", "dogrula", { alici: "{{tetik.telefon}}", kod: "{{adim.s2.veri.kod}}" }),
  ], [SIR("Twilio", "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_VERIFY_SID"), "Kullanıcının girdiği kodu {{calisma.devam}} adresine kod alanıyla gönder"], { girdi: [z("telefon", "Telefon", "telefon")], sektor: ["saas"] }),
  /* ── Yapay zekâ servisleri ── */
  t("v5-claude-ozet", "yz", "Uzun metni Claude ile özetle", "Yapıştırdığın uzun metni Anthropic Claude kısa maddelere döker.", elleForm(), [
    uyg("s1", "Claude", "anthropic", "mesaj", { istem: "Şu metni en fazla 7 maddede Türkçe özetle:\n\n{{tetik.metin}}", model: "claude-opus-5-5", uzunluk: "4000" }),
    yanit("s2", "{{adim.s1.cikti}}"),
  ], [SIR("Anthropic", "ANTHROPIC_API_KEY")], { girdi: [z("metin", "Metin", "uzunMetin")] }),
  t("v5-openai-denetim", "yz", "Yorumları OpenAI ile içerik denetiminden geçir", "Yeni yorum gelince OpenAI moderasyonu çalışır; işaretlenen yorum ekibe bildirilir.", isletmeT("yorum"), [
    uyg("s1", "Denetle", "openai", "denetle", { metin: "{{tetik.metin}}" }),
    suz("s2", "İşaretlendi mi", [k("{{adim.s1.yanit.results.0.flagged}}", "dogru")]),
    sl("s3", "Uygunsuz olabilecek yorum: {{tetik.ad}}: {{tetik.metin | kisalt(300)}}"),
  ], [IS, SIR("OpenAI", "OPENAI_API_KEY"), SIR("Slack", "SLACK_WEBHOOK_URL")]),
  t("v5-gemini-urun", "yz", "Gemini ile ürün açıklaması yaz", "Ürün adı ve özelliklerinden Gemini SEO uyumlu açıklama yazar ve tabloya işler.", tablo("urunler"), [
    suz("s1", "Açıklama boş mu", [k("{{tetik.kayit.aciklama}}", "bos")]),
    uyg("s2", "Gemini", "gemini", "uret", { istem: "{{tetik.kayit.ad}} için 80 kelimelik, SEO uyumlu Türkçe ürün açıklaması yaz. Özellikler: {{tetik.kayit.ozellikler}}" }),
    guncelle("s3", "Açıklamayı yaz", "urunler", "{{tetik.kayit.id}}", "{\"aciklama\": {{adim.s2.cikti | json}}}"),
  ], [PROJE, SIR("Gemini", "GEMINI_API_KEY")], { sektor: ["eticaret"] }),
  t("v5-perplexity-rakip", "yz", "Haftalık rakip araştırması", "Her pazartesi Perplexity rakiplerinin son haberlerini kaynaklarıyla araştırır, Notion'a sayfa olarak kaydeder.", haftalik(1, "08:00"), [
    uyg("s1", "Araştır", "perplexity", "sor", { istem: "Şu rakiplerin son bir haftadaki ürün, fiyat ve kampanya haberlerini kaynaklarıyla özetle: {{degisken.rakipler}}", model: "sonar" }),
    uyg("s2", "Notion", "notion", "sayfa", { veritabani: "{{degisken.notion_veritabani}}", baslik: "Rakip özeti {{tarih}}", icerik: "{{adim.s1.cikti}}" }),
  ], [SIR("Perplexity", "PERPLEXITY_API_KEY"), SIR("Notion", "NOTION_TOKEN"), "rakipler ve notion_veritabani değişkenlerini ekle"], { sektor: ["saas", "eticaret"] }),
  t("v5-deepl-destek", "yz", "Yabancı dildeki destek mesajını DeepL ile çevir", "Sohbete gelen mesaj Türkçe değilse DeepL ile çevrilir, ekibe çevirisiyle iletilir.", sohbet("Support", "How can we help?", []), [
    uyg("s1", "Türkçeye çevir", "deepl", "cevir", { metin: "{{tetik.mesaj}}", hedef: "TR" }),
    sl("s2", "Yabancı müşteri: {{tetik.mesaj}}\nÇeviri: {{adim.s1.cikti}}"),
    yanit("s3", "Thanks, our team will reply shortly."),
  ], [SIR("DeepL", "DEEPL_API_KEY"), SIR("Slack", "SLACK_WEBHOOK_URL"), SOHBET], { sektor: ["turizm", "eticaret"] }),
  t("v5-firecrawl-fiyat", "yz", "Rakip fiyatını her gün izle", "Rakibin ürün sayfası her gün okunur, fiyat değişince Telegram'a haber verilir.", gunluk("10:00"), [
    uyg("s1", "Sayfayı oku", "firecrawl", "oku", { adres: "{{degisken.rakip_urun_adresi}}" }),
    ajan("s2", "Fiyatı bul", "Bu sayfadaki ürün fiyatını yalnız sayı olarak ver: {{adim.s1.yanit.data.markdown | kisalt(8000)}}", [["fiyat", "sayi"]]),
    depo("s3", "Önceki fiyat", "oku", "rakip_fiyat"),
    suz("s4", "Değişti mi", [k("{{adim.s2.fiyat}}", "esit-degil", "{{adim.s3.deger}}")]),
    depo("s5", "Yeni fiyatı yaz", "yaz", "rakip_fiyat", { deger: "{{adim.s2.fiyat}}" }),
    tg("s6", "Rakip fiyatı değişti: {{adim.s3.deger}} yerine {{adim.s2.fiyat}}"),
  ], [SIR("Firecrawl", "FIRECRAWL_API_KEY"), SIR("Telegram", "TELEGRAM_BOT_TOKEN"), "rakip_urun_adresi değişkenini ekle"], { sektor: ["eticaret"] }),
  t("v5-tavily-arastir", "yz", "Konu araştırıp e-posta raporu gönder", "Formda yazdığın konuyu Tavily ile araştırır, yapay zekâ raporlar ve e-postana yollar.", elleForm(), [
    uyg("s1", "Ara", "tavily", "ara", { sorgu: "{{tetik.konu}}", adet: "8", derinlik: "advanced" }),
    ajan("s2", "Rapor", "Şu arama sonuçlarından kaynaklı, başlıklı bir Türkçe rapor yaz: {{adim.s1.yanit | json | kisalt(12000)}}"),
    mail("s3", "{{degisken.benim_epostam}}", "Araştırma: {{tetik.konu}}", "{{adim.s2.cikti}}"),
  ], [SIR("Tavily", "TAVILY_API_KEY"), SIR("Resend", "RESEND_API_KEY")], { girdi: [z("konu", "Konu")] }),
  t("v5-serp-sira", "yz", "Google sıralamasını haftalık izle", "Anahtar kelimenin Google'daki ilk sonuçlarını SerpApi ile çeker, sitenin sırasını tabloya yazar.", haftalik(1, "09:00"), [
    uyg("s1", "Google", "serpapi", "ara", { sorgu: "{{degisken.anahtar_kelime}}", motor: "google" }),
    kod("s2", "Sırayı bul", "export default function (girdi) {\n  const l = (girdi.adim[\"1\"].yanit.organic_results || []);\n  const i = l.findIndex((x) => String(x.link).includes(girdi.degisken.site_alan_adi));\n  return { sira: i < 0 ? null : i + 1 };\n}\n"),
    satirEkle("s3", "Tabloya yaz", "[\"{{tarih}}\", \"{{degisken.anahtar_kelime}}\", \"{{adim.s2.sira | varsayilan(\"ilk 10 dışında\")}}\"]"),
  ], [SIR("SerpApi", "SERPAPI_KEY"), GOOGLE, "anahtar_kelime, site_alan_adi ve tablo_kimligi değişkenlerini ekle"], { sektor: ["ajans", "eticaret"] }),
  t("v5-replicate-gorsel", "yz", "Ürün için Replicate'te görsel üret", "Ürün adından görsel istemi yazılır, Replicate'te açık kaynak modelle görsel üretilip Cloudinary'ye yüklenir.", elleForm(), [
    uyg("s1", "Görsel üret", "replicate", "calistir", { model: "black-forest-labs/flux-schnell", girdi: "{\"prompt\": \"{{tetik.istem}}\"}" }),
    uyg("s2", "Cloudinary'ye yükle", "cloudinary", "yukle", { adres: "{{adim.s1.yanit.output.0}}", klasor: "urunler" }),
    yanit("s3", "{{adim.s2.yanit.secure_url}}"),
  ], [SIR("Replicate", "REPLICATE_API_TOKEN"), SIR("Cloudinary", "CLOUDINARY_BULUT", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET")], { girdi: [z("istem", "Görsel istemi", "uzunMetin")], sektor: ["eticaret"] }),
  t("v5-mistral-siniflandir", "yz", "Gelen e-postayı Mistral ile sınıflandır", "Sisteme gelen e-posta Mistral ile kategoriye ayrılır ve doğru ekibe iletilir.", eposta(), [
    uyg("s1", "Kategori", "mistral", "uret", { istem: "Bu e-postayı yalnız bir kelimeyle sınıflandır (satis, destek, fatura, diger): {{tetik.konu}} {{tetik.metin | kisalt(2000)}}" }),
    yon("s2", "Ekibe gönder", [["Satış", [k("{{adim.s1.cikti}}", "iceriyor", "satis")], [sl("s3", "Satış e-postası: {{tetik.konu}}")]], ["Fatura", [k("{{adim.s1.cikti}}", "iceriyor", "fatura")], [mail("s4", "{{degisken.muhasebe_eposta}}", "Fatura e-postası: {{tetik.konu}}", "{{tetik.metin}}")]]], [sl("s5", "Destek ya da diğer: {{tetik.konu}}")]),
  ], [SIR("Mistral", "MISTRAL_API_KEY"), SIR("Slack", "SLACK_WEBHOOK_URL")]),
  t("v5-groq-hizli", "yz", "Sohbet kutusuna Groq ile anlık yanıt", "Sitene gömülen sohbet kutusu Groq'taki açık modelle çok hızlı yanıt verir.", sohbet("Asistan", "Merhaba, nasıl yardımcı olabilirim?", ["Fiyatlar", "Kargo süresi"]), [
    uyg("s1", "Groq", "groq", "uret", { istem: "{{tetik.gecmisMetni}}\nKullanıcı: {{tetik.mesaj}}", sistem: "Bir e-ticaret mağazasının kısa ve kibar Türkçe asistanısın." }),
    yanit("s2", "{{adim.s1.cikti}}"),
  ], [SIR("Groq", "GROQ_API_KEY"), SOHBET], { sektor: ["eticaret"] }),
  t("v5-hava-kampanya", "icerik", "Yağmurlu günde kampanya SMS'i", "Her sabah hava durumuna bakar; yağmur bekleniyorsa izinli müşterilere paket servis kampanyası SMS'i gider.", gunluk("10:00"), [
    uyg("s1", "Hava", "openweather", "simdi", { sehir: "{{degisken.sehir | varsayilan(\"Istanbul,TR\")}}" }),
    suz("s2", "Yağmur mu", [k("{{adim.s1.yanit.weather.0.main}}", "esit", "Rain")]),
    bul("s3", "İzinli müşteriler", "musteriler", [k("smsIzni", "esit", "true")], { sinir: 300 }),
    dongu("s4", "Her müşteri", "{{adim.s3.kayitlar}}", [sms("s5", "{{dongu.oge.telefon}}", "Yağmurlu günde paket servis yüzde 15 indirimli! Kod: YAGMUR")], { sinir: 300 }),
  ], [PROJE, SIR("OpenWeather", "OPENWEATHER_API_KEY"), SIR("Netgsm", "NETGSM_KULLANICI", "NETGSM_SIFRE")], { sektor: ["restoran"] }),
  t("v5-apify-yorumlar", "yz", "Google Haritalar yorumlarını haftalık topla", "Apify kazıyıcısıyla işletmenin Haritalar yorumları toplanır, yapay zekâ özetler ve e-postayla gönderir.", haftalik(1, "08:30"), [
    uyg("s1", "Yorumları topla", "apify", "calistir", { actor: "compass/google-maps-reviews-scraper", girdi: "{\"startUrls\": [{\"url\": \"{{degisken.harita_adresi}}\"}], \"maxReviews\": 50}" }),
    ajan("s2", "Özetle", "Bu yorumlardan olumlu ve olumsuz temaları çıkar: {{adim.s1.yanit | json | kisalt(12000)}}"),
    mail("s3", "{{degisken.benim_epostam}}", "Haftalık yorum özeti", "{{adim.s2.cikti}}"),
  ], [SIR("Apify", "APIFY_TOKEN"), SIR("Resend", "RESEND_API_KEY"), "harita_adresi değişkenine Google Haritalar bağlantını yaz"], { sektor: ["restoran", "turizm", "hizmet"] }),
  t("v5-exa-benzer", "yz", "Örnek siteye benzeyenleri bul", "Bir site adresi verince Exa benzer siteleri bulur, yapay zekâ kısa rakip listesi çıkarır.", elleForm(), [
    uyg("s1", "Benzerleri bul", "exa", "benzer", { adres: "{{tetik.adres}}", adet: "10" }),
    ajan("s2", "Listele", "Bu sonuçlardan rakip listesini ad, adres ve tek cümlelik açıklamayla çıkar: {{adim.s1.yanit | json | kisalt(8000)}}"),
  ], [SIR("Exa", "EXA_API_KEY")], { girdi: [z("adres", "Site adresi")], sektor: ["ajans", "saas"] }),
  t("v5-jina-ozet", "yz", "Bağlantıyı okuyup özetle", "Sohbete bir bağlantı yapıştırınca Jina okuyucu sayfayı okur, yapay zekâ özetler.", sohbet("Bağlantı özetleyici", "Bir bağlantı yapıştır, özetleyeyim.", []), [
    don("s1", "Adresi bul", "metin", "desen", "{{tetik.mesaj}}", "https?://\\S+"),
    uyg("s2", "Oku", "jina", "oku", { adres: "{{adim.s1.sonuc}}" }),
    ajan("s3", "Özetle", "Bu sayfayı beş maddede özetle: {{adim.s2.yanit.data.content | kisalt(12000)}}"),
    yanit("s4", "{{adim.s3.cikti}}"),
  ], [SIR("Jina", "JINA_API_KEY"), SOHBET]),
  t("v5-cohere-etiket", "yz", "Destek talebini Cohere ile etiketle", "Destek formuna gelen talep Cohere ile konu etiketine ayrılır ve tabloya yazılır.", formS("Destek", "Sorununu yaz."), [
    uyg("s1", "Etiket", "cohere", "uret", { istem: "Bu destek talebine tek kelimelik konu etiketi ver (odeme, kargo, iade, hesap, diger): {{tetik.mesaj}}" }),
    kayit("s2", "Tabloya yaz", "destek", "{\"eposta\": \"{{tetik.eposta}}\", \"mesaj\": {{tetik.mesaj | json}}, \"etiket\": \"{{adim.s1.cikti}}\"}"),
  ], [PROJE, SIR("Cohere", "COHERE_API_KEY"), FORM], { girdi: [z("eposta", "E-posta", "eposta"), z("mesaj", "Mesaj", "uzunMetin")] }),
  t("v5-deepseek-rapor", "yz", "Aylık satışları DeepSeek ile yorumla", "Her ayın ilk günü geçen ayın siparişleri DeepSeek ile yorumlanır ve rapor e-postası gider.", aylik(1, "08:00"), [
    bul("s1", "Siparişler", "siparisler", [], { sinir: 1000 }),
    don("s2", "Toplamlar", "liste", "ozetle", "{{adim.s1.kayitlar}}", "tutar"),
    uyg("s3", "Yorumla", "deepseek", "uret", { istem: "Geçen ayın sipariş özeti: {{adim.s2.sonuc | json}}. Yöneticiye üç bulgu ve üç öneriyle kısa rapor yaz." }),
    mail("s4", "{{degisken.benim_epostam}}", "Aylık satış raporu", "{{adim.s3.cikti}}"),
  ], [PROJE, SIR("DeepSeek", "DEEPSEEK_API_KEY"), SIR("Resend", "RESEND_API_KEY")], { sektor: ["eticaret"] }),
  t("v5-mailgun-bildirim", "operasyon", "Kritik olayda Mailgun ile e-posta", "Web kancasıyla gelen kritik olay Mailgun üzerinden ekibe e-postalanır.", kanca(), [
    uyg("s1", "Mailgun", "mailgun", "eposta", { gonderen: "Vayra <uyari@{{degisken.mailgun_alan}}>", alici: "{{degisken.ekip_eposta}}", konu: "Kritik: {{tetik.baslik}}", govde: "{{tetik.mesaj}}", etiket: "kritik" }),
  ], [SIR("Mailgun", "MAILGUN_API_KEY", "MAILGUN_DOMAIN"), "mailgun_alan ve ekip_eposta değişkenlerini ekle"]),
  t("v5-pushover-siparis", "satis", "Büyük siparişte telefona anlık bildirim", "1.000 TL üstü mağaza siparişinde Pushover ile telefona yüksek öncelikli bildirim gider.", isletmeT("siparis"), [
    suz("s1", "Büyük mü", [k("{{tetik.tutar}}", "buyuk", "1000")]),
    uyg("s2", "Pushover", "pushover", "bildirim", { metin: "{{tetik.siparisNo}}: {{tetik.tutar | tl}}", baslik: "Büyük sipariş", oncelik: "1" }),
  ], [IS, SIR("Pushover", "PUSHOVER_TOKEN", "PUSHOVER_USER")], { sektor: ["eticaret"] }),
  t("v5-ntfy-yedek", "yazilim", "Her gece yedek tamamlandı bildirimi", "Gece yarısı yedek web kancası çağrılır; sonuç ntfy konusuna anlık bildirim olarak düşer.", gunluk("03:00"), [
    http("s1", "Yedekle", "POST", "{{degisken.yedek_adresi}}"),
    uyg("s2", "ntfy", "ntfy", "bildirim", { konu: "{{degisken.ntfy_konu}}", metin: "Yedek tamam: {{adim.s1.durum}}", baslik: "Gece yedeği", oncelik: "3", etiketler: "floppy_disk" }),
  ], ["yedek_adresi ve ntfy_konu değişkenlerini ekle"], { sektor: ["saas"] }),
  t("v5-mattermost-deploy", "yazilim", "Netlify derlemesini başlat ve Mattermost'a yaz", "Elle tetiklenince Netlify derlemesi başlar, ekip Mattermost'tan haberdar edilir.", elleForm(), [
    uyg("s1", "Derle", "netlify", "derle", { baslik: "{{tetik.neden}}" }),
    uyg("s2", "Mattermost", "mattermost", "mesaj", { metin: "Netlify derlemesi başlatıldı: {{tetik.neden}}" }),
  ], [SIR("Netlify", "NETLIFY_BUILD_HOOK"), SIR("Mattermost", "MATTERMOST_WEBHOOK_URL")], { girdi: [z("neden", "Neden")], sektor: ["saas", "ajans"] }),
  t("v5-webflow-blog", "icerik", "Yapay zekâ taslağını Webflow bloguna ekle", "Konuyu yazınca yapay zekâ blog yazısı üretir, onaydan sonra Webflow CMS'e taslak olarak eklenir.", elleForm(), [
    ajan("s1", "Yazı", "{{tetik.konu}} hakkında 600 kelimelik, başlıklı bir Türkçe blog yazısı yaz.", [["baslik", "metin"], ["icerik", "metin"]]),
    onay("s2", "Yazıyı onayla", "{{adim.s1.baslik}}", "{{adim.s1.icerik}}", [uyg("s3", "Webflow", "webflow", "oge", { koleksiyon: "{{degisken.webflow_koleksiyon}}", ad: "{{adim.s1.baslik}}", alanlar: "{\"post-body\": {{adim.s2.icerik | json}}}", taslak: "true" })]),
  ], [SIR("Webflow", "WEBFLOW_TOKEN"), "webflow_koleksiyon değişkenini ekle"], { girdi: [z("konu", "Konu")], sektor: ["ajans"] }),
  t("v5-wordpress-sayfa", "icerik", "Kampanya sayfasını WordPress'te aç", "Kampanya bilgilerini yazınca yapay zekâ sayfa metnini üretir ve WordPress'te taslak sayfa açılır.", elleForm(), [
    ajan("s1", "Sayfa metni", "{{tetik.kampanya}} kampanyası için başlık, kısa giriş ve maddeli koşullarla HTML sayfa içeriği yaz."),
    uyg("s2", "WordPress", "wordpress", "sayfa", { baslik: "{{tetik.kampanya}}", icerik: "{{adim.s1.cikti}}", durum: "draft" }),
  ], [SIR("WordPress", "WORDPRESS_SITE", "WORDPRESS_KULLANICI", "WORDPRESS_UYGULAMA_SIFRESI")], { girdi: [z("kampanya", "Kampanya")], sektor: ["eticaret"] }),
  t("v5-posthog-abone", "icerik", "Yeni aboneyi PostHog'da işaretle", "Abone olan kişi PostHog'da kişi özelliği ve olay olarak kaydedilir.", isletmeT("abone"), [
    uyg("s1", "Olay", "posthog", "olay", { olay: "bulten_abone", kisi: "{{tetik.eposta}}", ozellikler: "{\"kaynak\": \"{{tetik.kaynak}}\"}", bolge: "eu" }),
    uyg("s2", "Kişi", "posthog", "kisi", { kisi: "{{tetik.eposta}}", ozellikler: "{\"bulten\": true}", bolge: "eu" }),
  ], [IS, SIR("PostHog", "POSTHOG_PROJE_ANAHTARI")], { sektor: ["saas"] }),
  t("v5-lemon-odeme", "finans", "Lemon Squeezy siparişini Slack'e bildir", "İmzası doğrulanan Lemon Squeezy sipariş olayı Slack'e tutar ve müşteriyle yazılır.", imzaliKanca("lemonsqueezy"), [
    suz("s1", "Sipariş mi", [k("{{tetik.meta.event_name}}", "esit", "order_created")]),
    sl("s2", "Lemon Squeezy siparişi: {{tetik.data.attributes.total_formatted}} ({{tetik.data.attributes.user_email}})"),
  ], [SIR("Lemon Squeezy imzası", "LEMONSQUEEZY_WEBHOOK_SECRET"), SIR("Slack", "SLACK_WEBHOOK_URL")], { sektor: ["saas"] }),
  t("v5-paypal-link", "finans", "PayPal ödeme bağlantısı oluştur", "Yurt dışı müşteri için tutarı yazınca PayPal siparişi açılır ve onay bağlantısı döner.", elleForm(), [
    uyg("s1", "PayPal", "paypal", "siparis", { tutar: "{{tetik.tutar}}", para: "{{tetik.para | varsayilan(\"USD\")}}", aciklama: "{{tetik.aciklama}}" }),
    yanit("s2", "{{adim.s1.cikti}}"),
  ], [SIR("PayPal", "PAYPAL_CLIENT_ID", "PAYPAL_SECRET")], { girdi: [z("tutar", "Tutar", "sayi"), g("para", "Para birimi"), z("aciklama", "Açıklama")], sektor: ["turizm", "ajans"] }),
  t("v5-n11-onayla", "satis", "n11 siparişini otomatik onayla", "Yeni n11 siparişinin kalemleri onaylanıp hazırlanıyor durumuna alınır.", servisT("n11-siparis"), [
    don("s1", "Kalem kimlikleri", "liste", "alan", "{{tetik.lines}}", "orderLineId"),
    uyg("s2", "Onayla", "n11", "onayla", { kalemler: "{{adim.s1.sonuc | birlestir(\",\")}}" }),
  ], [BAG("n11")], { sektor: ["eticaret"] }),
  t("v5-bizimhesap-fatura", "finans", "Mağaza siparişini BizimHesap'a fatura olarak ekle", "Ödemesi alınan sipariş BizimHesap'ta satış faturası olarak açılır.", isletmeT("siparis"), [
    uyg("s1", "Fatura", "bizimhesap", "fatura", { fatura: "{\"invoiceNo\": \"{{tetik.siparisNo}}\", \"note\": \"Web siparişi\", \"customer\": {\"title\": \"{{tetik.alici.ad}} {{tetik.alici.soyad}}\", \"email\": \"{{tetik.eposta}}\", \"phone\": \"{{tetik.alici.telefon}}\", \"address\": \"{{tetik.alici.adres}}\"}, \"amounts\": {\"currency\": \"TL\", \"gross\": {{tetik.tutar}}, \"total\": {{tetik.tutar}}}, \"details\": []}" }),
  ], [IS, SIR("BizimHesap", "BIZIMHESAP_TOKEN", "BIZIMHESAP_FIRMA"), "Kalemleri BizimHesap belgesindeki details biçimine göre ekle"], { sektor: ["eticaret"] }),
  t("v5-verimor-randevu", "operasyon", "Randevu iptalinde Verimor SMS'i", "Randevu iptal edilince müşteriye Verimor ile bilgilendirme SMS'i gider.", isletmeT("randevuIptal"), [
    uyg("s1", "SMS", "verimor", "sms", { alici: "{{tetik.telefon}}", metin: "Sayın {{tetik.ad}}, {{tetik.baslangic | tarih}} randevunuz iptal edildi. Yeni randevu için sitemizi ziyaret edin." }),
  ], [IS, SIR("Verimor", "VERIMOR_KULLANICI", "VERIMOR_SIFRE")], { sektor: ["saglik", "hizmet"] }),
  t("v5-basit-kargo-takip", "destek", "Basit Kargo takip sorgusu sohbeti", "Sohbette takip kodunu yazan müşteriye Basit Kargo'daki son durum söylenir.", sohbet("Kargo takip", "Takip kodunu yaz.", []), [
    ajan("s1", "Kodu çıkar", "Bu mesajdaki kargo takip kodunu çıkar: {{tetik.mesaj}}", [["kod", "metin"]]),
    uyg("s2", "Sorgula", "basit-kargo", "takip", { kod: "{{adim.s1.kod}}" }),
    ajan("s3", "Açıkla", "Bu kargo kaydının durumunu müşteriye bir cümleyle açıkla: {{adim.s2.yanit | json | kisalt(3000)}}"),
    yanit("s4", "{{adim.s3.cikti}}"),
  ], [SIR("Basit Kargo", "BASITKARGO_TOKEN"), SOHBET], { sektor: ["eticaret"] }),
];

/* ───────── Dünya geneli: muhasebe, kargo, ödeme ve pazar yerleri (listenin başında) ───────── */
/** Depo (gönderen) adresi değişkenlerden: kargo eylemlerinin gon* alanları. */
const DEPO = { gonAd: "{{degisken.depo_ad}}", gonSirket: "{{degisken.depo_sirket}}", gonAdres: "{{degisken.depo_adres}}", gonSehir: "{{degisken.depo_sehir}}", gonEyalet: "{{degisken.depo_eyalet}}", gonPosta: "{{degisken.depo_posta}}", gonUlke: "{{degisken.depo_ulke}}", gonTelefon: "{{degisken.depo_telefon}}" };
const DEPO_KUR = "depo_ad, depo_adres, depo_sehir, depo_eyalet, depo_posta, depo_ulke ve depo_telefon değişkenlerine gönderen depo adresini yaz";
const QBK = SIR("QuickBooks", "QUICKBOOKS_CLIENT_ID", "QUICKBOOKS_CLIENT_SECRET", "QUICKBOOKS_REFRESH_TOKEN", "QUICKBOOKS_SIRKET");
const XRK = SIR("Xero", "XERO_CLIENT_ID", "XERO_CLIENT_SECRET", "XERO_REFRESH_TOKEN", "XERO_TENANT_ID");
const SHEETS = [GOOGLE, "tablo_kimligi değişkenine e-tablonun kimliğini yaz"];
/** Pazar yeri siparişlerini yoklayıp yeni olanları E-Tablolar'a yazan sistem. */
const pazarSheets = (id: string, ad: string, servis: string, liste_: string, anahtar: string, satir: string, kur: string[]) => t(id, "satis", `${ad} siparişlerini E-Tablolar'a yaz`, `Her 15 dakikada ${ad} siparişlerini çeker; daha önce yazılmayan her sipariş tabloya yeni satır olarak eklenir.`, dakikada(15), [
  uyg("s1", "Siparişleri çek", servis, "siparisler", {}),
  dongu("s2", "Her sipariş", `{{adim.s1.yanit.${liste_}}}`, [
    depo("s3", "Yazıldı mı", "goruldu", `${servis}_sheets`, { deger: `{{dongu.oge.${anahtar}}}` }),
    satirEkle("s4", "Satır ekle", satir),
  ]),
], [...kur, ...SHEETS], { sektor: ["eticaret"] });
const kargoSecimi = (kod: string) => k("{{tetik.firma}}", "esit", kod);

const GLOBAL: SistemSablon[] = [
  t("g-stripe-quickbooks", "finans", "Stripe ödemesini QuickBooks'a satış fişi olarak işle", "İmzası doğrulanan Stripe ödemesi QuickBooks Online'da müşterinin e-postasıyla satış fişi olarak kaydedilir, muhasebeye elle girmek gerekmez.", imzaliKanca("stripe"), [
    suz("s1", "Ödeme tamamlandı mı", [k("{{tetik.type}}", "esit", "checkout.session.completed")]),
    uyg("s2", "Satış fişi", "quickbooks", "satis-fisi", { urun: "{{degisken.quickbooks_urun}}", aciklama: "Stripe ödemesi {{tetik.data.object.id}}", adet: "1", fiyat: "{{tetik.data.object.amount_total | bolu(100)}}", eposta: "{{tetik.data.object.customer_details.email}}", referans: "{{tetik.data.object.payment_intent}}" }),
  ], [SIR("Stripe imzası", "STRIPE_WEBHOOK_SECRET"), QBK, "quickbooks_urun değişkenine QuickBooks'taki satış kaleminin kimliğini yaz", "Stripe'ta checkout.session.completed olayı için bu sistemin adresini web kancası olarak ekle"], { sektor: ["saas", "eticaret"] }),
  t("g-form-quickbooks-fatura", "finans", "Formdan QuickBooks faturası kes ve gönder", "Müşteri ve tutar formdan girilir; QuickBooks'ta müşteri açılır, fatura kesilir ve müşteriye e-postayla gider.", elleForm(), [
    uyg("s1", "Müşteri", "quickbooks", "musteri", { ad: "{{tetik.ad}}", sirket: "{{tetik.sirket}}", eposta: "{{tetik.eposta}}" }),
    uyg("s2", "Fatura", "quickbooks", "fatura", { musteri: "{{adim.s1.yanit.Customer.Id}}", urun: "{{degisken.quickbooks_urun}}", aciklama: "{{tetik.aciklama}}", adet: "1", fiyat: "{{tetik.tutar}}", eposta: "{{tetik.eposta}}" }),
    uyg("s3", "E-postayla gönder", "quickbooks", "fatura-gonder", { fatura: "{{adim.s2.yanit.Invoice.Id}}", eposta: "{{tetik.eposta}}" }),
  ], [QBK, "quickbooks_urun değişkenine faturadaki hizmet kaleminin kimliğini yaz"], { girdi: [z("ad", "Müşteri adı"), g("sirket", "Şirket"), z("eposta", "E-posta", "eposta"), z("aciklama", "Hizmet açıklaması"), z("tutar", "Tutar", "sayi")], sektor: ["ajans", "hizmet"] }),
  t("g-paypal-xero", "finans", "PayPal ödemesini Xero'ya işle", "PayPal'da tahsilat tamamlanınca Xero'da onaylı satış faturası açılır ve PayPal hesabına ödeme olarak kapatılır.", kanca(), [
    suz("s1", "Tahsilat mı", [k("{{tetik.event_type}}", "esit", "PAYMENT.CAPTURE.COMPLETED")]),
    uyg("s2", "Xero faturası", "xero", "fatura", { kisi: "{{degisken.xero_paypal_kisi}}", aciklama: "PayPal tahsilatı {{tetik.resource.id}}", adet: "1", fiyat: "{{tetik.resource.amount.value}}", para: "{{tetik.resource.amount.currency_code}}", referans: "{{tetik.resource.id}}", durum: "AUTHORISED" }),
    uyg("s3", "Ödeme kaydı", "xero", "odeme", { fatura: "{{adim.s2.yanit.Invoices.0.InvoiceID}}", hesap: "{{degisken.xero_paypal_hesap}}", tutar: "{{tetik.resource.amount.value}}", referans: "{{tetik.resource.id}}" }),
  ], [XRK, "xero_paypal_kisi değişkenine PayPal satışları için açtığın Xero kişisinin kimliğini, xero_paypal_hesap değişkenine PayPal banka hesabının kodunu yaz", "PayPal geliştirici panelinde PAYMENT.CAPTURE.COMPLETED olayı için bu sistemin adresini web kancası olarak ekle"], { sektor: ["eticaret", "saas"] }),
  t("g-form-xero-fatura", "finans", "Formdan Xero faturası kes ve e-postala", "Müşteri adı ve tutarla Xero'da kişi ve onaylı fatura açılır, fatura müşteriye Xero üzerinden gönderilir.", elleForm(), [
    uyg("s1", "Kişi", "xero", "kisi", { ad: "{{tetik.ad}}", eposta: "{{tetik.eposta}}" }),
    uyg("s2", "Fatura", "xero", "fatura", { kisi: "{{adim.s1.yanit.Contacts.0.ContactID}}", aciklama: "{{tetik.aciklama}}", adet: "1", fiyat: "{{tetik.tutar}}", para: "{{tetik.para | varsayilan(\"USD\")}}", durum: "AUTHORISED" }),
    uyg("s3", "E-postala", "xero", "fatura-gonder", { fatura: "{{adim.s2.yanit.Invoices.0.InvoiceID}}" }),
  ], [XRK], { girdi: [z("ad", "Müşteri ya da şirket adı"), z("eposta", "E-posta", "eposta"), z("aciklama", "Hizmet açıklaması"), z("tutar", "Tutar", "sayi"), g("para", "Para birimi")], sektor: ["ajans", "hizmet"] }),
  t("g-freshbooks-fatura", "finans", "Formdan FreshBooks faturası gönder", "Müşteri FreshBooks'ta açılır, tek kalemli fatura kesilir ve PDF ekiyle e-postayla gider.", elleForm(), [
    uyg("s1", "Müşteri", "freshbooks", "musteri", { eposta: "{{tetik.eposta}}", ad: "{{tetik.ad}}", sirket: "{{tetik.sirket}}" }),
    uyg("s2", "Fatura", "freshbooks", "fatura", { musteri: "{{adim.s1.yanit.response.result.client.id}}", kalem: "{{tetik.aciklama}}", adet: "1", fiyat: "{{tetik.tutar}}", para: "{{tetik.para | varsayilan(\"USD\")}}", vade: "30" }),
    uyg("s3", "Gönder", "freshbooks", "fatura-gonder", { fatura: "{{adim.s2.yanit.response.result.invoice.id}}", alicilar: "{{tetik.eposta}}", pdf: "true" }),
  ], [SIR("FreshBooks", "FRESHBOOKS_CLIENT_ID", "FRESHBOOKS_CLIENT_SECRET", "FRESHBOOKS_REFRESH_TOKEN", "FRESHBOOKS_YONLENDIRME", "FRESHBOOKS_HESAP")], { girdi: [z("ad", "Müşteri adı"), g("sirket", "Şirket"), z("eposta", "E-posta", "eposta"), z("aciklama", "Hizmet"), z("tutar", "Tutar", "sayi"), g("para", "Para birimi")], sektor: ["ajans", "hizmet"] }),
  t("g-shopify-shipstation", "operasyon", "Shopify siparişini ShipStation'a aktar", "Yeni Shopify siparişi kalemleri ve teslimat adresiyle ShipStation'a gönderim bekleyen sipariş olarak düşer; ekibe Slack'ten haber gider.", servisT("shopify-siparis"), [
    kod("s1", "Kalemleri çevir", "export default function (girdi) {\n  const l = (girdi.tetik.line_items || []).map((x) => ({ sku: x.sku || undefined, name: x.title, quantity: x.quantity, unitPrice: Number(x.price) }));\n  return { kalemler: JSON.stringify(l) };\n}\n"),
    uyg("s2", "ShipStation siparişi", "shipstation", "siparis", { numara: "{{tetik.name}}", aliAd: "{{tetik.shipping_address.name}}", aliSirket: "{{tetik.shipping_address.company}}", aliAdres: "{{tetik.shipping_address.address1}}", aliAdres2: "{{tetik.shipping_address.address2}}", aliSehir: "{{tetik.shipping_address.city}}", aliEyalet: "{{tetik.shipping_address.province_code}}", aliPosta: "{{tetik.shipping_address.zip}}", aliUlke: "{{tetik.shipping_address.country_code}}", aliTelefon: "{{tetik.shipping_address.phone}}", aliEposta: "{{tetik.email}}", kalemler: "{{adim.s1.kalemler}}", odenen: "{{tetik.total_price}}" }),
    sl("s3", "ShipStation'a aktarıldı: {{tetik.name}}, {{tetik.shipping_address.name}}"),
  ], [SIR("Shopify", "SHOPIFY_MAGAZA", "SHOPIFY_TOKEN"), SIR("ShipStation", "SHIPSTATION_API_KEY", "SHIPSTATION_API_SECRET"), SIR("Slack", "SLACK_WEBHOOK_URL")], { sektor: ["eticaret"] }),
  t("g-shopify-easypost", "operasyon", "Shopify siparişine EasyPost etiketi al ve gönderildi yap", "Yeni Shopify siparişi için en ucuz kargo etiketi EasyPost'tan alınır; takip numarasıyla sipariş Shopify'da gönderildi yapılır ve müşteri bilgilendirilir.", servisT("shopify-siparis"), [
    uyg("s1", "Etiket", "easypost", "etiket", { ...DEPO, aliAd: "{{tetik.shipping_address.name}}", aliAdres: "{{tetik.shipping_address.address1}}", aliAdres2: "{{tetik.shipping_address.address2}}", aliSehir: "{{tetik.shipping_address.city}}", aliEyalet: "{{tetik.shipping_address.province_code}}", aliPosta: "{{tetik.shipping_address.zip}}", aliUlke: "{{tetik.shipping_address.country_code}}", aliTelefon: "{{tetik.shipping_address.phone}}", aliEposta: "{{tetik.email}}", kg: "{{tetik.total_weight | bolu(1000)}}", firma: "{{degisken.kargo_firmasi}}", referans: "{{tetik.name}}" }),
    uyg("s2", "Gönderim emirleri", "shopify", "gonderim-emirleri", { siparis: "{{tetik.id}}" }),
    uyg("s3", "Gönderildi yap", "shopify", "gonder", { emir: "{{adim.s2.yanit.fulfillment_orders.0.id}}", takip: "{{adim.s1.yanit.tracking_code}}", firma: "{{adim.s1.yanit.selected_rate.carrier}}", adres: "{{adim.s1.yanit.tracker.public_url}}", bildir: "true" }),
  ], [SIR("Shopify", "SHOPIFY_MAGAZA", "SHOPIFY_TOKEN"), SIR("EasyPost", "EASYPOST_API_KEY"), DEPO_KUR, "kargo_firmasi değişkenine tercih ettiğin firmayı yaz (ör. USPS); boşsa en ucuzu seçilir"], { sektor: ["eticaret"] }),
  t("g-woo-shippo", "operasyon", "WooCommerce siparişine Shippo etiketi al", "Hazırlanan WooCommerce siparişi için Shippo'dan en ucuz etiket alınır, takip numarası siparişe müşteri notu olarak yazılır ve sipariş tamamlanır.", servisT("woo-siparis"), [
    suz("s1", "Hazırlanıyor mu", [k("{{tetik.status}}", "esit", "processing")]),
    uyg("s2", "Shippo etiketi", "shippo", "etiket", { ...DEPO, aliAd: "{{tetik.shipping.first_name}} {{tetik.shipping.last_name}}", aliSirket: "{{tetik.shipping.company}}", aliAdres: "{{tetik.shipping.address_1}}", aliAdres2: "{{tetik.shipping.address_2}}", aliSehir: "{{tetik.shipping.city}}", aliEyalet: "{{tetik.shipping.state}}", aliPosta: "{{tetik.shipping.postcode}}", aliUlke: "{{tetik.shipping.country}}", aliTelefon: "{{tetik.billing.phone}}", aliEposta: "{{tetik.billing.email}}", kg: "{{degisken.varsayilan_kg | varsayilan(\"1\")}}" }),
    uyg("s3", "Müşteriye not", "woocommerce", "not", { siparis: "{{tetik.id}}", not: "Siparişin kargoya verildi. Takip numarası: {{adim.s2.yanit.tracking_number}} {{adim.s2.yanit.tracking_url_provider}}", musteri: "true" }),
    uyg("s4", "Tamamla", "woocommerce", "durum", { siparis: "{{tetik.id}}", durum: "completed" }),
  ], [SIR("WooCommerce", "WOO_SITE", "WOO_KEY", "WOO_SECRET"), SIR("Shippo", "SHIPPO_API_KEY"), DEPO_KUR, "varsayilan_kg değişkenine ortalama paket ağırlığını yaz"], { sektor: ["eticaret"] }),
  t("g-kargo-takip-form", "destek", "Kargom nerede: UPS, FedEx ve DHL", "Müşteri firmayı ve takip numarasını seçer; ilgili firmanın resmî takip servisinden son durum anında formda gösterilir.", formS("Kargom nerede", "Kargo firmanı ve takip numaranı yaz.", { bitis: "sonuc" }), [
    yon("s1", "Firma", [
      ["UPS", [kargoSecimi("UPS")], [uyg("s2", "UPS takip", "ups", "takip", { takip: "{{tetik.takip}}" }), yanit("s3", "Durum: {{adim.s2.cikti | varsayilan(\"Kayıt bulunamadı\")}}")]],
      ["FedEx", [kargoSecimi("FedEx")], [uyg("s4", "FedEx takip", "fedex", "takip", { takip: "{{tetik.takip}}" }), yanit("s5", "Durum: {{adim.s4.cikti | varsayilan(\"Kayıt bulunamadı\")}}")]],
    ], [uyg("s6", "DHL takip", "dhl", "takip", { takip: "{{tetik.takip}}", dil: "en" }), yanit("s7", "Durum: {{adim.s6.cikti | varsayilan(\"Kayıt bulunamadı\")}}")]),
  ], [SIR("UPS", "UPS_CLIENT_ID", "UPS_CLIENT_SECRET"), SIR("FedEx", "FEDEX_CLIENT_ID", "FEDEX_CLIENT_SECRET"), SIR("DHL", "DHL_API_KEY"), FORM], { girdi: [z("firma", "Kargo firması", "secim", { secenekler: ["UPS", "FedEx", "DHL"] }), z("takip", "Takip numarası")], sektor: ["eticaret"] }),
  t("g-zendesk-slack", "destek", "Yeni Zendesk talebini Slack'e bildir", "Zendesk tetikleyicisi yeni talebi gönderir; acil olanlar ayrı bir uyarıyla, diğerleri kısa özetle destek kanalına düşer.", kanca(), [
    yon("s1", "Öncelik", [["Acil", [k("{{tetik.priority}}", "esit", "urgent")], [sl("s2", "ACİL talep #{{tetik.ticket_id}}: {{tetik.subject}} ({{tetik.requester}})")]]], [sl("s3", "Yeni talep #{{tetik.ticket_id}}: {{tetik.subject}} ({{tetik.requester}}, {{tetik.priority}})")]),
  ], ["Zendesk Yönetici Merkezi'nde web kancası olarak bu sistemin adresini ekle; Ticket is Created tetikleyicisi ticket_id, subject, priority ve requester alanlarını JSON olarak göndersin", SIR("Slack", "SLACK_WEBHOOK_URL")], { sektor: ["saas"] }),
  t("g-form-pipedrive", "satis", "Formdan Pipedrive kişisi, kuruluşu ve fırsatı", "İletişim formunu dolduran kişi Pipedrive'da kuruluşuyla açılır, tahmini bütçeyle fırsat oluşur ve satış ekibine Slack'ten haber gider.", formS("Bize ulaşın", "Ekibimiz bir iş günü içinde dönüş yapar."), [
    uyg("s1", "Kuruluş", "pipedrive", "kurulus", { ad: "{{tetik.sirket}}" }),
    uyg("s2", "Kişi", "pipedrive", "kisi", { ad: "{{tetik.ad}}", eposta: "{{tetik.eposta}}", telefon: "{{tetik.telefon}}", kurulus: "{{adim.s1.yanit.data.id}}" }),
    uyg("s3", "Fırsat", "pipedrive", "firsat", { baslik: "{{tetik.sirket}}: {{tetik.ihtiyac}}", tutar: "{{tetik.butce}}", para: "{{degisken.para_birimi | varsayilan(\"USD\")}}", kisi: "{{adim.s2.yanit.data.id}}", kurulus: "{{adim.s1.yanit.data.id}}" }),
    sl("s4", "Yeni fırsat: {{tetik.sirket}} ({{tetik.ad}}, {{tetik.eposta}}), bütçe {{tetik.butce}}"),
  ], [SIR("Pipedrive", "PIPEDRIVE_TOKEN"), SIR("Slack", "SLACK_WEBHOOK_URL"), "para_birimi değişkenine fırsatların para birimini yaz (boşsa USD)", FORM], { girdi: [z("ad", "Ad soyad"), z("sirket", "Şirket"), z("eposta", "E-posta", "eposta"), g("telefon", "Telefon", "telefon"), z("ihtiyac", "İhtiyacınız"), g("butce", "Tahmini bütçe", "sayi")], sektor: ["saas", "ajans"] }),
  t("g-pipedrive-kazanildi-quickbooks", "satis", "Kazanılan Pipedrive fırsatını QuickBooks'ta faturala", "Pipedrive web kancası kazanılan fırsatı gönderir; QuickBooks'ta müşteri açılır ve fırsat tutarıyla fatura kesilir.", kanca(), [
    suz("s1", "Kazanıldı mı", [k("{{tetik.data.status}}", "esit", "won")]),
    uyg("s2", "Müşteri", "quickbooks", "musteri", { ad: "{{tetik.data.title}}" }),
    uyg("s3", "Fatura", "quickbooks", "fatura", { musteri: "{{adim.s2.yanit.Customer.Id}}", urun: "{{degisken.quickbooks_urun}}", aciklama: "{{tetik.data.title}}", adet: "1", fiyat: "{{tetik.data.value}}" }),
  ], [SIR("Pipedrive", "PIPEDRIVE_TOKEN"), QBK, "Pipedrive'da Ayarlar, Web kancaları bölümünde fırsat güncellemesi (change.deal) için bu sistemin adresini ekle", "quickbooks_urun değişkenine hizmet kaleminin kimliğini yaz"], { sektor: ["saas", "ajans"] }),
  pazarSheets("g-etsy-sheets", "Etsy", "etsy", "results", "receipt_id", "[\"{{dongu.oge.receipt_id}}\", \"{{dongu.oge.name}}\", \"{{dongu.oge.buyer_email}}\", \"{{dongu.oge.grandtotal.amount | bolu(100)}}\", \"{{dongu.oge.grandtotal.currency_code}}\"]", [SIR("Etsy", "ETSY_API_KEY", "ETSY_SHARED_SECRET", "ETSY_REFRESH_TOKEN", "ETSY_MAGAZA")]),
  pazarSheets("g-ebay-sheets", "eBay", "ebay", "orders", "orderId", "[\"{{dongu.oge.orderId}}\", \"{{dongu.oge.buyer.username}}\", \"{{dongu.oge.pricingSummary.total.value}}\", \"{{dongu.oge.pricingSummary.total.currency}}\", \"{{dongu.oge.creationDate}}\"]", [SIR("eBay", "EBAY_CLIENT_ID", "EBAY_CLIENT_SECRET", "EBAY_REFRESH_TOKEN")]),
  pazarSheets("g-amazon-sheets", "Amazon", "amazon-sp", "orders", "orderId", "[\"{{dongu.oge.orderId}}\", \"{{dongu.oge.createdTime}}\", \"{{dongu.oge.fulfillment.fulfillmentStatus}}\", \"{{dongu.oge | json | kisalt(400)}}\"]", [SIR("Amazon", "AMAZON_CLIENT_ID", "AMAZON_CLIENT_SECRET", "AMAZON_REFRESH_TOKEN", "AMAZON_PAZAR")]),
  t("g-ebay-takip", "operasyon", "Tablodaki takip numarasını eBay siparişine yaz", "Sipariş tablosunda kargo takip numarası girilince eBay siparişi gönderildi yapılır ve alıcı takip bilgisini görür.", tablo("siparisler", ["guncelle"]), [
    suz("s1", "eBay siparişi ve takip var mı", [k("{{tetik.kayit.ebaySiparis}}", "bos-degil"), k("{{tetik.kayit.takip}}", "bos-degil")]),
    uyg("s2", "eBay'e yaz", "ebay", "gonderi", { siparis: "{{tetik.kayit.ebaySiparis}}", takip: "{{tetik.kayit.takip}}", firma: "{{tetik.kayit.kargoFirmasi | varsayilan(\"USPS\")}}" }),
  ], [PROJE, SIR("eBay", "EBAY_CLIENT_ID", "EBAY_CLIENT_SECRET", "EBAY_REFRESH_TOKEN")], { sektor: ["eticaret"] }),
  t("g-bigcommerce-slack", "satis", "Yeni BigCommerce siparişini Slack'e bildir", "Her 10 dakikada karşılanmayı bekleyen BigCommerce siparişlerine bakar, yenilerini tutar ve müşteriyle Slack'e yazar.", dakikada(10), [
    uyg("s1", "Siparişler", "bigcommerce", "siparisler", { durum: "11", adet: "50" }),
    dongu("s2", "Her sipariş", "{{adim.s1.yanit}}", [
      depo("s3", "Bildirildi mi", "goruldu", "bigcommerce_bildirilen", { deger: "{{dongu.oge.id}}" }),
      sl("s4", "BigCommerce siparişi #{{dongu.oge.id}}: {{dongu.oge.total_inc_tax}} {{dongu.oge.currency_code}}, {{dongu.oge.billing_address.first_name}} {{dongu.oge.billing_address.last_name}}"),
    ]),
  ], [SIR("BigCommerce", "BIGCOMMERCE_MAGAZA", "BIGCOMMERCE_TOKEN"), SIR("Slack", "SLACK_WEBHOOK_URL")], { sektor: ["eticaret"] }),
  t("g-mollie-bildirim", "finans", "Mollie ödeme bildirimini işle", "Mollie ödeme durumu değişince ödeme sorgulanır; ödenenler tabloya yazılır, başarısız ya da süresi dolanlar için ekibe haber gider.", kanca("ok"), [
    uyg("s1", "Ödemeyi sorgula", "mollie", "odeme-getir", { odeme: "{{tetik.id}}" }),
    yon("s2", "Durum", [
      ["Ödendi", [k("{{adim.s1.yanit.status}}", "esit", "paid")], [satirEkle("s3", "Tabloya yaz", "[\"{{tarih}}\", \"{{adim.s1.yanit.id}}\", \"{{adim.s1.yanit.amount.value}}\", \"{{adim.s1.yanit.amount.currency}}\", \"{{adim.s1.yanit.description}}\"]")]],
      ["Başarısız", [k("{{adim.s1.yanit.status}}", "esit", "failed")], [sl("s4", "Mollie ödemesi başarısız: {{adim.s1.yanit.description}} ({{adim.s1.yanit.amount.value}} {{adim.s1.yanit.amount.currency}})")]],
      ["Süresi doldu", [k("{{adim.s1.yanit.status}}", "esit", "expired")], [sl("s5", "Mollie ödemesinin süresi doldu: {{adim.s1.yanit.description}}")]],
    ]),
  ], [SIR("Mollie", "MOLLIE_API_KEY"), ...SHEETS, SIR("Slack", "SLACK_WEBHOOK_URL"), "Mollie ödeme oluştururken bildirim adresi alanına bu sistemin adresini yaz"], { sektor: ["eticaret", "saas"] }),
  t("g-adyen-bildirim", "finans", "Adyen bildirimlerini ekibe ilet", "Adyen web kancası yetkilendirme, iade ve itiraz olaylarını gönderir; başarılı ödemeler kanala, itirazlar ayrı uyarıyla yazılır.", kanca("[accepted]"), [
    dongu("s1", "Her bildirim", "{{tetik.notificationItems}}", [
      yon("s2", "Olay", [
        ["Ödeme onaylandı", [k("{{dongu.oge.NotificationRequestItem.eventCode}}", "esit", "AUTHORISATION"), k("{{dongu.oge.NotificationRequestItem.success}}", "esit", "true")], [sl("s3", "Adyen ödemesi onaylandı: {{dongu.oge.NotificationRequestItem.merchantReference}}, {{dongu.oge.NotificationRequestItem.amount.value | bolu(100)}} {{dongu.oge.NotificationRequestItem.amount.currency}}")]],
        ["İade", [k("{{dongu.oge.NotificationRequestItem.eventCode}}", "esit", "REFUND")], [sl("s4", "Adyen iadesi: {{dongu.oge.NotificationRequestItem.merchantReference}} ({{dongu.oge.NotificationRequestItem.success}})")]],
        ["İtiraz", [k("{{dongu.oge.NotificationRequestItem.eventCode}}", "esit", "CHARGEBACK")], [sl("s5", "DİKKAT, Adyen itirazı: {{dongu.oge.NotificationRequestItem.merchantReference}}, PSP {{dongu.oge.NotificationRequestItem.pspReference}}")]],
      ]),
    ]),
  ], ["Adyen Customer Area'da Developers, Webhooks bölümünde Standard webhook olarak bu sistemin adresini ekle", SIR("Slack", "SLACK_WEBHOOK_URL")], { sektor: ["eticaret", "saas"] }),
  t("g-square-baglanti", "satis", "Formdan Square ödeme bağlantısı", "Ürün adı ve tutarla Square hızlı ödeme bağlantısı oluşur ve formda hemen gösterilir.", formS("Hızlı ödeme", "Ürünü ve tutarı yaz, ödeme bağlantın hemen oluşsun.", { bitis: "sonuc" }), [
    uyg("s1", "Square bağlantısı", "square", "baglanti", { ad: "{{tetik.urun}}", tutar: "{{tetik.tutar}}", para: "{{tetik.para | varsayilan(\"USD\")}}", eposta: "{{tetik.eposta}}" }),
    yanit("s2", "Ödeme bağlantın: {{adim.s1.yanit.payment_link.url}}"),
  ], [SIR("Square", "SQUARE_ACCESS_TOKEN", "SQUARE_KONUM"), FORM], { girdi: [z("urun", "Ürün ya da hizmet"), z("tutar", "Tutar", "sayi"), g("para", "Para birimi"), g("eposta", "E-posta", "eposta")], sektor: ["hizmet", "restoran"] }),
  t("g-razorpay-baglanti", "finans", "Razorpay ödeme bağlantısı oluştur ve gönder", "Tutar ve müşteri bilgisiyle Razorpay ödeme bağlantısı açılır, Razorpay müşteriye SMS ve e-postayla iletir.", elleForm(), [
    uyg("s1", "Bağlantı", "razorpay", "baglanti", { tutar: "{{tetik.tutar}}", para: "{{tetik.para | varsayilan(\"INR\")}}", aciklama: "{{tetik.aciklama}}", ad: "{{tetik.ad}}", eposta: "{{tetik.eposta}}", telefon: "{{tetik.telefon}}", bildir: "true" }),
    yanit("s2", "Bağlantı gönderildi: {{adim.s1.yanit.short_url}}"),
  ], [SIR("Razorpay", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET")], { girdi: [z("tutar", "Tutar", "sayi"), g("para", "Para birimi"), z("aciklama", "Açıklama"), z("ad", "Müşteri adı"), g("eposta", "E-posta", "eposta"), g("telefon", "Telefon", "telefon")], sektor: ["hizmet", "eticaret"] }),
  t("g-paypal-fatura", "finans", "Formdan PayPal faturası gönder", "Müşteri e-postası ve tutarla PayPal faturası oluşur ve müşteriye PayPal'dan gönderilir; kart ya da PayPal ile öder.", elleForm(), [
    uyg("s1", "PayPal faturası", "paypal", "fatura", { eposta: "{{tetik.eposta}}", ad: "{{tetik.ad}}", kalem: "{{tetik.aciklama}}", adet: "1", tutar: "{{tetik.tutar}}", para: "{{tetik.para | varsayilan(\"USD\")}}" }),
    yanit("s2", "Fatura gönderildi: {{adim.s1.cikti}}"),
  ], [SIR("PayPal", "PAYPAL_CLIENT_ID", "PAYPAL_SECRET")], { girdi: [z("eposta", "Müşteri e-postası", "eposta"), g("ad", "Müşteri adı"), z("aciklama", "Hizmet"), z("tutar", "Tutar", "sayi"), g("para", "Para birimi")], sektor: ["ajans", "hizmet"] }),
  t("g-freshdesk-yz", "destek", "Freshdesk talebine yapay zekâyla ilk yanıt", "Freshdesk otomasyonu yeni talebi gönderir; yapay zekâ kısa bir yanıt taslağı yazar ve talebe özel not olarak ekler.", kanca(), [
    uyg("s1", "Talebi getir", "freshdesk", "getir", { talep: "{{tetik.ticket_id}}" }),
    ajan("s2", "Yanıt öner", "Bu destek talebine kısa, nazik bir ilk yanıt öner. Konu: {{adim.s1.yanit.subject}}. Açıklama: {{adim.s1.yanit.description_text}}", [["yanit", "metin"]]),
    uyg("s3", "Özel not", "freshdesk", "not", { talep: "{{tetik.ticket_id}}", metin: "Önerilen yanıt:\n{{adim.s2.yanit}}", ozel: "true" }),
  ], [SIR("Freshdesk", "FRESHDESK_ALAN", "FRESHDESK_API_KEY"), "Freshdesk'te Ticket Creation otomasyonuna bu sistemin adresine ticket_id gönderen web kancası eylemi ekle"], { sektor: ["saas"] }),
];

/** Bütün hazır sistemler (önce dünya geneli şablonlar, sonra ilk şablonlar, kütüphane, v5 servis ve işletme sistemleri, bildirim ailesi). */
export const TUM_SABLONLAR: SistemSablon[] = [...GLOBAL, ...SISTEM_SABLONLARI, ...EK, ...V5, ...BILDIRIMLER];
