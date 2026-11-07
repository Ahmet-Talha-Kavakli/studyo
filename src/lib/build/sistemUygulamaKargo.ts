import { dolu, enc, evet, liste, m, ozetAl, rastgele, sayi, sorgu, t, tamsayi, temel, zorunlu, type Sirlar, type UygAlan, type Uygulama } from "./sistemUygulamaOrtak";

/**
 * Uluslararası kargo servisleri. Uç noktalar, kimlik biçimleri ve gövdeler resmî belgelerden (2026-11-07):
 *  EasyPost docs.easypost.com (v2, API anahtarı Basic kullanıcı adı) · Shippo docs.goshippo.com (ShippoToken başlığı) ·
 *  ShipStation shipstation.com/docs/api (V1, ssapi.shipstation.com, Basic anahtar:gizli) ·
 *  DHL developer.dhl.com (Shipment Tracking Unified, Location Finder: DHL-API-Key; MyDHL API Express: Basic) ·
 *  FedEx developer.fedex.com (OAuth istemci kimliği, Track v1, Rate v1, Ship v1, Address Validation v1) ·
 *  UPS developer.ups.com ve resmî OpenAPI deposu (OAuth istemci kimliği, Track v1, Rating v2409, Shipping v2409).
 * Ölçüler arayüzde santimetre ve kilogramdır; ABD birimi isteyen servislerde (EasyPost) çevrilir.
 */
type G = Record<string, unknown>;

/* ───────────── Ortak adres ve paket alanları ───────────── */
const ADRES = (o: string, kim: string, ulke = "US"): UygAlan[] => [
  { ad: `${o}Ad`, etiket: `${kim} adı`, zorunlu: true },
  { ad: `${o}Sirket`, etiket: `${kim} şirketi` },
  { ad: `${o}Adres`, etiket: `${kim} adresi`, zorunlu: true, yer: "417 Montgomery St" },
  { ad: `${o}Adres2`, etiket: `${kim} adresi, ikinci satır` },
  { ad: `${o}Sehir`, etiket: `${kim} şehri`, zorunlu: true, yer: "San Francisco" },
  { ad: `${o}Eyalet`, etiket: `${kim} eyalet ya da bölge kodu`, yer: "CA" },
  { ad: `${o}Posta`, etiket: `${kim} posta kodu`, zorunlu: true, yer: "94104" },
  { ad: `${o}Ulke`, etiket: `${kim} ülke kodu`, zorunlu: true, yer: ulke, varsayilan: ulke },
  { ad: `${o}Telefon`, etiket: `${kim} telefonu` },
  { ad: `${o}Eposta`, etiket: `${kim} e-postası` },
];
const GONDEREN = ADRES("gon", "Gönderen");
const ALICI = ADRES("ali", "Alıcı");
const PAKET: UygAlan[] = [
  { ad: "kg", etiket: "Ağırlık (kg)", tur: "sayi", zorunlu: true, yer: "1.2" },
  { ad: "en", etiket: "En (cm)", tur: "sayi", yer: "20" },
  { ad: "boy", etiket: "Boy (cm)", tur: "sayi", yer: "30" },
  { ad: "yukseklik", etiket: "Yükseklik (cm)", tur: "sayi", yer: "10" },
];
type Adres = { ad: string; sirket: string; satir1: string; satir2: string; sehir: string; eyalet: string; posta: string; ulke: string; telefon: string; eposta: string };
const adres = (g: G, o: "gon" | "ali"): Adres => {
  const kim = o === "gon" ? "Gönderen" : "Alıcı";
  return {
    ad: zorunlu(g, `${o}Ad`, `${kim} adı`), sirket: t(g[`${o}Sirket`]), satir1: zorunlu(g, `${o}Adres`, `${kim} adresi`), satir2: t(g[`${o}Adres2`]),
    sehir: zorunlu(g, `${o}Sehir`, `${kim} şehri`), eyalet: t(g[`${o}Eyalet`]), posta: zorunlu(g, `${o}Posta`, `${kim} posta kodu`),
    ulke: zorunlu(g, `${o}Ulke`, `${kim} ülke kodu`).toUpperCase(), telefon: t(g[`${o}Telefon`]), eposta: t(g[`${o}Eposta`]),
  };
};
const kg = (g: G) => { const v = sayi(g.kg, 0, 0, 10_000); if (!v) throw new Error("Ağırlık boş; kilogram olarak yaz."); return v; };
const cm = (v: unknown) => sayi(v, 0, 0, 1000);
const yuvarla = (x: number, n = 2) => Math.round(x * 10 ** n) / 10 ** n;
const bugun = () => new Date().toISOString().slice(0, 10);

/* ───────────── EasyPost ───────────── */
const EP = "https://api.easypost.com/v2";
const epB = (s: Sirlar) => ({ Authorization: temel(s("EASYPOST_API_KEY"), "") });
const epAdres = (a: Adres) => dolu({ name: a.ad, company: a.sirket, street1: a.satir1, street2: a.satir2, city: a.sehir, state: a.eyalet, zip: a.posta, country: a.ulke, phone: a.telefon, email: a.eposta });
/** EasyPost ölçüleri inç ve ons ister. */
const epPaket = (g: G) => dolu({ weight: yuvarla(kg(g) * 35.274, 1), length: cm(g.boy) ? yuvarla(cm(g.boy) / 2.54) : undefined, width: cm(g.en) ? yuvarla(cm(g.en) / 2.54) : undefined, height: cm(g.yukseklik) ? yuvarla(cm(g.yukseklik) / 2.54) : undefined });
const epGonderi = (g: G) => ({ shipment: dolu({ to_address: epAdres(adres(g, "ali")), from_address: epAdres(adres(g, "gon")), parcel: epPaket(g), reference: t(g.referans) }) });
type Fiyat = { id?: string; object_id?: string; rate?: string; amount?: string; carrier?: string; provider?: string; service?: string };
/** Firma ve hizmet süzgecine uyan en ucuz fiyat. */
function enUcuz(l: Fiyat[], firma: string, hizmet: string): Fiyat | undefined {
  const f = firma.toLowerCase(), h = hizmet.toLowerCase();
  return l.filter((r) => (!f || m(r.carrier ?? r.provider).toLowerCase().includes(f)) && (!h || m(r.service ?? (r as { servicelevel?: { token?: string } }).servicelevel?.token).toLowerCase().includes(h)))
    .sort((a, b) => Number(a.rate ?? a.amount) - Number(b.rate ?? b.amount))[0];
}
const FIRMA_SUZ: UygAlan[] = [{ ad: "firma", etiket: "Kargo firması (boşsa en ucuzu)", yer: "USPS" }, { ad: "hizmet", etiket: "Hizmet (boşsa en ucuzu)", yer: "Priority" }];

/* ───────────── Shippo ───────────── */
const SP = "https://api.goshippo.com";
const spB = (s: Sirlar) => ({ Authorization: `ShippoToken ${s("SHIPPO_API_KEY")}` });
const spAdres = (a: Adres) => dolu({ name: a.ad, company: a.sirket, street1: a.satir1, street2: a.satir2, city: a.sehir, state: a.eyalet, zip: a.posta, country: a.ulke, phone: a.telefon, email: a.eposta });
const spGonderi = (g: G) => ({
  address_from: spAdres(adres(g, "gon")), address_to: spAdres(adres(g, "ali")),
  parcels: [{ length: String(cm(g.boy) || 10), width: String(cm(g.en) || 10), height: String(cm(g.yukseklik) || 10), distance_unit: "cm", weight: String(kg(g)), mass_unit: "kg" }],
  async: false,
});
const spHata = (y: unknown) => { const o = y as { status?: string; messages?: { text?: string }[] } | null; return o?.status === "ERROR" ? { hata: (o.messages ?? []).map((x) => x.text).join("; ") || "Shippo işlemi tamamlanamadı." } : {}; };

/* ───────────── ShipStation ───────────── */
const SS = "https://ssapi.shipstation.com";
const ssB = (s: Sirlar) => ({ Authorization: temel(s("SHIPSTATION_API_KEY"), s("SHIPSTATION_API_SECRET")) });
const SSS = ["SHIPSTATION_API_KEY", "SHIPSTATION_API_SECRET"];

/* ───────────── DHL ───────────── */
const dhlB = (s: Sirlar) => ({ "DHL-API-Key": s("DHL_API_KEY") });
const dhlX = (s: Sirlar) => (s("DHL_ORTAM") === "test" ? "https://express.api.dhl.com/mydhlapi/test" : "https://express.api.dhl.com/mydhlapi");
const dhlXB = (s: Sirlar) => ({ Authorization: temel(s("DHL_EXPRESS_KULLANICI"), s("DHL_EXPRESS_SIFRE")) });
const DHLX = ["DHL_EXPRESS_KULLANICI", "DHL_EXPRESS_SIFRE"];

/* ───────────── FedEx ───────────── */
const fdxTaban = (s: Sirlar) => (s("FEDEX_ORTAM") === "test" ? "https://apis-sandbox.fedex.com" : "https://apis.fedex.com");
const fdxB = (s: Sirlar) => ({ Authorization: `Bearer ${s("_FEDEX_ERISIM")}`, "X-locale": "en_US" });
const fdxAdres = (a: Adres) => dolu({ streetLines: [a.satir1, a.satir2].filter(Boolean), city: a.sehir, stateOrProvinceCode: a.eyalet, postalCode: a.posta, countryCode: a.ulke });
const fdxKisi = (a: Adres) => ({ contact: dolu({ personName: a.ad, companyName: a.sirket, phoneNumber: a.telefon || "0000000000", emailAddress: a.eposta }), address: fdxAdres(a) });
const fdxPaket = (g: G) => [dolu({ weight: { units: "KG", value: kg(g) }, dimensions: cm(g.boy) && cm(g.en) && cm(g.yukseklik) ? { length: Math.ceil(cm(g.boy)), width: Math.ceil(cm(g.en)), height: Math.ceil(cm(g.yukseklik)), units: "CM" } : undefined })];
const FDX = ["_FEDEX_ERISIM", "FEDEX_HESAP_NO"];
const FDX_HIZMET = [{ id: "FEDEX_GROUND", ad: "FedEx Ground" }, { id: "FEDEX_2_DAY", ad: "FedEx 2Day" }, { id: "STANDARD_OVERNIGHT", ad: "Standard Overnight" }, { id: "PRIORITY_OVERNIGHT", ad: "Priority Overnight" }, { id: "INTERNATIONAL_PRIORITY", ad: "International Priority" }, { id: "INTERNATIONAL_ECONOMY", ad: "International Economy" }, { id: "FEDEX_INTERNATIONAL_PRIORITY", ad: "FedEx International Priority" }];

/* ───────────── UPS ───────────── */
const upsTaban = (s: Sirlar) => (s("UPS_ORTAM") === "test" ? "https://wwwcie.ups.com" : "https://onlinetools.ups.com");
const upsB = (s: Sirlar) => ({ Authorization: `Bearer ${s("_UPS_ERISIM")}`, transId: rastgele(12), transactionSrc: "vayra" });
const upsAdres = (a: Adres) => dolu({ AddressLine: [a.satir1, a.satir2].filter(Boolean), City: a.sehir, StateProvinceCode: a.eyalet, PostalCode: a.posta, CountryCode: a.ulke });
const upsKisi = (a: Adres) => dolu({ Name: (a.sirket || a.ad).slice(0, 35), AttentionName: a.ad.slice(0, 35), Phone: a.telefon ? { Number: a.telefon.replace(/[^\d]/g, "") } : undefined, Address: upsAdres(a) });
const upsPaket = (g: G, alan: "PackagingType" | "Packaging") => dolu({
  [alan]: { Code: "02" },
  Dimensions: cm(g.boy) && cm(g.en) && cm(g.yukseklik) ? { UnitOfMeasurement: { Code: "CM" }, Length: String(Math.ceil(cm(g.boy))), Width: String(Math.ceil(cm(g.en))), Height: String(Math.ceil(cm(g.yukseklik))) } : undefined,
  PackageWeight: { UnitOfMeasurement: { Code: "KGS" }, Weight: String(kg(g)) },
});
const UPS = ["_UPS_ERISIM", "UPS_HESAP_NO"];
const UPS_HIZMET = [{ id: "03", ad: "UPS Ground" }, { id: "02", ad: "2nd Day Air" }, { id: "01", ad: "Next Day Air" }, { id: "12", ad: "3 Day Select" }, { id: "11", ad: "UPS Standard" }, { id: "07", ad: "Worldwide Express" }, { id: "08", ad: "Worldwide Expedited" }, { id: "65", ad: "Worldwide Saver" }];

export const UYG_KARGO: Uygulama[] = [
  {
    id: "easypost", ad: "EasyPost", logo: "/marka/uyg/easypost.svg", kategori: "Kargo", aciklama: "100'den çok firmada fiyat, etiket, takip ve iade", belge: "https://docs.easypost.com/docs",
    sirlar: [{ ad: "EASYPOST_API_KEY", etiket: "API anahtarı", nasil: "EasyPost panelinde Account Settings, API Keys; canlı ya da test anahtarı." }],
    eylemler: [
      { id: "etiket", ad: "Etiket satın al", aciklama: "Gönderi açar, seçilen firmanın en ucuz fiyatıyla etiketi alır", sirlar: ["EASYPOST_API_KEY"], alanlar: [...GONDEREN, ...ALICI, ...PAKET, ...FIRMA_SUZ, { ad: "referans", etiket: "Referans", yer: "Sipariş numarası" }],
        istek: (g, s) => ({ yontem: "POST", url: `${EP}/shipments`, basliklar: epB(s), json: epGonderi(g) }),
        devam: (y, g, s) => { const o = y as { id?: string; rates?: Fiyat[] }; const r = enUcuz(o?.rates ?? [], t(g.firma), t(g.hizmet)); if (!o?.id || !r?.id) throw new Error("Bu gönderi için uygun fiyat bulunamadı; firma ve hizmet süzgecini denetle."); return { yontem: "POST", url: `${EP}/shipments/${enc(o.id)}/buy`, basliklar: epB(s), json: { rate: { id: r.id } } }; },
        sonuc: (y) => { const o = y as { tracking_code?: string; postage_label?: { label_url?: string } }; return { ozet: [o?.tracking_code, o?.postage_label?.label_url].filter(Boolean).join(" ") || undefined }; } },
      { id: "fiyatlar", ad: "Fiyatları getir", aciklama: "Gönderi oluşturur, bütün firmaların fiyatlarını döndürür (ücret alınmaz)", sirlar: ["EASYPOST_API_KEY"], alanlar: [...GONDEREN, ...ALICI, ...PAKET],
        istek: (g, s) => ({ yontem: "POST", url: `${EP}/shipments`, basliklar: epB(s), json: epGonderi(g) }),
        sonuc: (y) => { const r = enUcuz((y as { rates?: Fiyat[] })?.rates ?? [], "", ""); return { ozet: r ? `${r.carrier} ${r.service}: ${r.rate}` : undefined }; } },
      { id: "takip", ad: "Takip başlat", aciklama: "Takip numarasıyla izleyici açar; durum ve hareketler döner", sirlar: ["EASYPOST_API_KEY"], alanlar: [{ ad: "takip", etiket: "Takip numarası", zorunlu: true }, { ad: "firma", etiket: "Kargo firması", yer: "UPS" }],
        istek: (g, s) => ({ yontem: "POST", url: `${EP}/trackers`, basliklar: epB(s), json: { tracker: dolu({ tracking_code: zorunlu(g, "takip", "Takip numarası"), carrier: t(g.firma) }) } }), sonuc: ozetAl("status") },
      { id: "takip-getir", ad: "Takip durumunu getir", aciklama: "İzleyici kimliğiyle son durum", okuma: true, sirlar: ["EASYPOST_API_KEY"], alanlar: [{ ad: "izleyici", etiket: "İzleyici kimliği (trk_ ile başlar)", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `${EP}/trackers/${enc(zorunlu(g, "izleyici", "İzleyici kimliği"))}`, basliklar: epB(s) }), sonuc: ozetAl("status") },
      { id: "iade", ad: "Etiket ücretini iade iste", aciklama: "Kullanılmamış etiket için", sirlar: ["EASYPOST_API_KEY"], alanlar: [{ ad: "gonderi", etiket: "Gönderi kimliği (shp_ ile başlar)", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: `${EP}/shipments/${enc(zorunlu(g, "gonderi", "Gönderi kimliği"))}/refund`, basliklar: epB(s), json: {} }), sonuc: ozetAl("refund_status") },
      { id: "adres", ad: "Adresi doğrula", aciklama: "Adresi düzeltir ve teslim edilebilir mi söyler", sirlar: ["EASYPOST_API_KEY"], alanlar: ALICI,
        istek: (g, s) => ({ yontem: "POST", url: `${EP}/addresses/create_and_verify`, basliklar: epB(s), json: { address: epAdres(adres(g, "ali")) } }), sonuc: ozetAl("address.verifications.delivery.success") },
    ],
  },
  {
    id: "shippo", ad: "Shippo", logo: "/marka/baglanti/shippo.png", kategori: "Kargo", aciklama: "Fiyat karşılaştır, etiket al, takip ve iade", belge: "https://docs.goshippo.com/shippoapi/public-api/",
    sirlar: [{ ad: "SHIPPO_API_KEY", etiket: "API belirteci", nasil: "Shippo, Settings, Advanced, API; shippo_live_ ya da shippo_test_ ile başlayan belirteç." }],
    eylemler: [
      { id: "etiket", ad: "Etiket satın al", aciklama: "Gönderi açar, en ucuz uygun fiyatla etiketi alır", sirlar: ["SHIPPO_API_KEY"], alanlar: [...GONDEREN, ...ALICI, ...PAKET, { ad: "firma", etiket: "Kargo firması (boşsa en ucuzu)", yer: "USPS" }, { ad: "hizmet", etiket: "Hizmet kodu (boşsa en ucuzu)", yer: "usps_priority" }],
        istek: (g, s) => ({ yontem: "POST", url: `${SP}/shipments/`, basliklar: spB(s), json: spGonderi(g) }),
        devam: (y, g, s) => { const r = enUcuz((y as { rates?: Fiyat[] })?.rates ?? [], t(g.firma), t(g.hizmet)); if (!r?.object_id) throw new Error("Bu gönderi için uygun fiyat bulunamadı."); return { yontem: "POST", url: `${SP}/transactions/`, basliklar: spB(s), json: { rate: r.object_id, label_file_type: "PDF", async: false } }; },
        sonuc: (y) => { const h = spHata(y); if (h.hata) return h; const o = y as { tracking_number?: string; label_url?: string }; return { ozet: [o?.tracking_number, o?.label_url].filter(Boolean).join(" ") || undefined }; } },
      { id: "fiyatlar", ad: "Fiyatları getir", aciklama: "Bütün bağlı firmaların fiyatları", sirlar: ["SHIPPO_API_KEY"], alanlar: [...GONDEREN, ...ALICI, ...PAKET],
        istek: (g, s) => ({ yontem: "POST", url: `${SP}/shipments/`, basliklar: spB(s), json: spGonderi(g) }),
        sonuc: (y) => { const r = enUcuz((y as { rates?: Fiyat[] })?.rates ?? [], "", ""); return { ozet: r ? `${r.provider}: ${r.amount}` : undefined }; } },
      { id: "takip", ad: "Gönderiyi takip et", aciklama: "Firma ve takip numarasıyla son durum", okuma: true, sirlar: ["SHIPPO_API_KEY"], alanlar: [{ ad: "firma", etiket: "Firma kodu", zorunlu: true, yer: "usps, ups, fedex, dhl_express" }, { ad: "takip", etiket: "Takip numarası", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `${SP}/tracks/${enc(zorunlu(g, "firma", "Firma kodu").toLowerCase())}/${enc(zorunlu(g, "takip", "Takip numarası"))}`, basliklar: spB(s) }), sonuc: ozetAl("tracking_status.status") },
      { id: "etiket-getir", ad: "Etiketi getir", aciklama: "İşlem kimliğiyle etiket adresi ve takip numarası", okuma: true, sirlar: ["SHIPPO_API_KEY"], alanlar: [{ ad: "islem", etiket: "İşlem kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `${SP}/transactions/${enc(zorunlu(g, "islem", "İşlem kimliği"))}`, basliklar: spB(s) }), sonuc: ozetAl("label_url") },
      { id: "iade", ad: "Etiket iadesi iste", aciklama: "Kullanılmamış etiketin ücreti", sirlar: ["SHIPPO_API_KEY"], alanlar: [{ ad: "islem", etiket: "İşlem kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: `${SP}/refunds/`, basliklar: spB(s), json: { transaction: zorunlu(g, "islem", "İşlem kimliği"), async: false } }), sonuc: ozetAl("status") },
      { id: "adres", ad: "Adresi doğrula", aciklama: "Adres geçerli mi ve önerilen düzeltme", sirlar: ["SHIPPO_API_KEY"], alanlar: ALICI,
        istek: (g, s) => ({ yontem: "POST", url: `${SP}/addresses/`, basliklar: spB(s), json: { ...spAdres(adres(g, "ali")), validate: true } }), sonuc: ozetAl("validation_results.is_valid") },
    ],
  },
  {
    id: "shipstation", ad: "ShipStation", logo: "/marka/uyg/shipstation.svg", kategori: "Kargo", aciklama: "Siparişler, etiket, gönderildi işareti ve gönderiler", belge: "https://www.shipstation.com/docs/api/",
    sirlar: [{ ad: "SHIPSTATION_API_KEY", etiket: "API anahtarı", nasil: "ShipStation, Settings, Account, API Settings; API Key." }, { ad: "SHIPSTATION_API_SECRET", etiket: "API gizli anahtarı", nasil: "Aynı sayfadaki API Secret." }],
    eylemler: [
      { id: "siparisler", ad: "Siparişleri listele", aciklama: "Duruma göre en yeniler", okuma: true, sirlar: SSS, alanlar: [{ ad: "durum", etiket: "Durum", tur: "secim", secenekler: [{ id: "awaiting_shipment", ad: "Gönderim bekliyor" }, { id: "awaiting_payment", ad: "Ödeme bekliyor" }, { id: "on_hold", ad: "Beklemede" }, { id: "shipped", ad: "Gönderildi" }, { id: "cancelled", ad: "İptal" }], varsayilan: "awaiting_shipment" }, { ad: "adet", etiket: "Kaç sipariş", tur: "sayi", varsayilan: "50", yer: "50" }],
        istek: (g, s) => ({ yontem: "GET", url: `${SS}/orders${sorgu({ orderStatus: t(g.durum) || "awaiting_shipment", pageSize: tamsayi(g.adet, 50, 1, 500), sortBy: "OrderDate", sortDir: "DESC" })}`, basliklar: ssB(s) }) },
      { id: "siparis-ara", ad: "Siparişi numarayla bul", aciklama: "Mağazadaki sipariş numarasıyla", okuma: true, sirlar: SSS, alanlar: [{ ad: "numara", etiket: "Sipariş numarası", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `${SS}/orders${sorgu({ orderNumber: zorunlu(g, "numara", "Sipariş numarası") })}`, basliklar: ssB(s) }), sonuc: ozetAl("orders.0.orderId") },
      { id: "siparis", ad: "Sipariş oluştur", aciklama: "Başka kanaldan gelen siparişi ShipStation'a ekler", sirlar: SSS, alanlar: [{ ad: "numara", etiket: "Sipariş numarası", zorunlu: true }, ...ALICI, { ad: "kalemler", etiket: "Kalemler (JSON listesi)", tur: "json", yer: "[{\"sku\": \"A1\", \"name\": \"Tişört\", \"quantity\": 1, \"unitPrice\": 20}]" }, { ad: "odenen", etiket: "Ödenen tutar", tur: "sayi" }],
        istek: (g, s) => { const a = adres(g, "ali"); const kisi = dolu({ name: a.ad, company: a.sirket, street1: a.satir1, street2: a.satir2, city: a.sehir, state: a.eyalet, postalCode: a.posta, country: a.ulke, phone: a.telefon }); return { yontem: "POST", url: `${SS}/orders/createorder`, basliklar: ssB(s), json: dolu({ orderNumber: zorunlu(g, "numara", "Sipariş numarası"), orderDate: new Date().toISOString(), orderStatus: "awaiting_shipment", customerEmail: a.eposta, billTo: kisi, shipTo: kisi, items: liste(g.kalemler, "Kalemler"), amountPaid: t(g.odenen) ? sayi(g.odenen, 0, 0, 1e9) : undefined }) }; }, sonuc: ozetAl("orderId") },
      { id: "etiket", ad: "Siparişe etiket oluştur", aciklama: "Firma ve hizmet koduyla etiket alır", sirlar: SSS, alanlar: [{ ad: "siparis", etiket: "ShipStation sipariş kimliği (orderId)", zorunlu: true }, { ad: "firma", etiket: "Firma kodu", zorunlu: true, yer: "stamps_com, ups_walleted, fedex" }, { ad: "hizmet", etiket: "Hizmet kodu", zorunlu: true, yer: "usps_priority_mail" }, { ad: "kg", etiket: "Ağırlık (kg)", tur: "sayi" }, { ad: "deneme", etiket: "Deneme etiketi (ücret alınmaz)", tur: "evet-hayir" }],
        istek: (g, s) => ({ yontem: "POST", url: `${SS}/orders/createlabelfororder`, basliklar: ssB(s), json: dolu({ orderId: Number(zorunlu(g, "siparis", "Sipariş kimliği")), carrierCode: zorunlu(g, "firma", "Firma kodu"), serviceCode: zorunlu(g, "hizmet", "Hizmet kodu"), packageCode: "package", confirmation: "none", shipDate: bugun(), weight: t(g.kg) ? { value: Math.round(sayi(g.kg, 0, 0, 10_000) * 1000), units: "grams" } : undefined, testLabel: evet(g.deneme) }) }), sonuc: ozetAl("trackingNumber") },
      { id: "gonderildi", ad: "Gönderildi olarak işaretle", aciklama: "Takip numarasıyla; müşteriye ve satış kanalına bildirir", sirlar: SSS, alanlar: [{ ad: "siparis", etiket: "ShipStation sipariş kimliği (orderId)", zorunlu: true }, { ad: "firma", etiket: "Firma kodu", zorunlu: true, yer: "ups" }, { ad: "takip", etiket: "Takip numarası" }, { ad: "musteri", etiket: "Müşteriye bildir", tur: "evet-hayir", varsayilan: "true" }, { ad: "kanal", etiket: "Satış kanalına bildir", tur: "evet-hayir", varsayilan: "true" }],
        istek: (g, s) => ({ yontem: "POST", url: `${SS}/orders/markasshipped`, basliklar: ssB(s), json: dolu({ orderId: Number(zorunlu(g, "siparis", "Sipariş kimliği")), carrierCode: zorunlu(g, "firma", "Firma kodu"), shipDate: bugun(), trackingNumber: t(g.takip), notifyCustomer: evet(g.musteri), notifySalesChannel: evet(g.kanal) }) }), sonuc: ozetAl("orderNumber") },
      { id: "gonderiler", ad: "Gönderileri listele", aciklama: "Sipariş ya da takip numarasına göre", okuma: true, sirlar: SSS, alanlar: [{ ad: "numara", etiket: "Sipariş numarası" }, { ad: "takip", etiket: "Takip numarası" }],
        istek: (g, s) => ({ yontem: "GET", url: `${SS}/shipments${sorgu({ orderNumber: t(g.numara), trackingNumber: t(g.takip), sortBy: "CreateDate", sortDir: "DESC", pageSize: 50 })}`, basliklar: ssB(s) }) },
    ],
  },
  {
    id: "dhl", ad: "DHL", logo: "/marka/uyg/dhl.svg", kategori: "Kargo", aciklama: "Bütün DHL birimlerinde takip, şube bulma ve Express fiyat", belge: "https://developer.dhl.com/api-reference/shipment-tracking",
    sirlar: [
      { ad: "DHL_API_KEY", etiket: "API anahtarı (takip ve şube)", nasil: "developer.dhl.com, My Apps; Shipment Tracking Unified ve Location Finder erişimi olan uygulamanın Consumer Key değeri." },
      { ad: "DHL_EXPRESS_KULLANICI", etiket: "MyDHL API kullanıcı adı", nasil: "DHL Express hesabın için verilen MyDHL API kullanıcı adı; yalnız Express eylemleri için.", istege: true },
      { ad: "DHL_EXPRESS_SIFRE", etiket: "MyDHL API şifresi", nasil: "Aynı hesabın MyDHL API şifresi.", istege: true },
      { ad: "DHL_EXPRESS_HESAP", etiket: "DHL Express hesap numarası", nasil: "Fiyat sorgusunda kullanılan müşteri numarası.", istege: true },
      { ad: "DHL_ORTAM", etiket: "Express ortamı", nasil: "Test ortamı için test yaz; boşsa canlı.", istege: true },
    ],
    eylemler: [
      { id: "takip", ad: "Gönderiyi takip et", aciklama: "Express, eCommerce, Parcel ve diğer birimler tek uçta", okuma: true, sirlar: ["DHL_API_KEY"], alanlar: [{ ad: "takip", etiket: "Takip numarası", zorunlu: true }, { ad: "birim", etiket: "DHL birimi", tur: "secim", secenekler: [{ id: "", ad: "Kendiliğinden bul" }, { id: "express", ad: "Express" }, { id: "ecommerce", ad: "eCommerce" }, { id: "ecommerce-europe", ad: "eCommerce Avrupa" }, { id: "ecommerce-tr", ad: "eCommerce Türkiye" }, { id: "parcel-uk", ad: "Parcel UK" }, { id: "svb", ad: "Post ve Parcel Almanya" }, { id: "sameday", ad: "Aynı gün" }] }, { ad: "dil", etiket: "Dil", yer: "en", varsayilan: "en" }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api-eu.dhl.com/track/shipments${sorgu({ trackingNumber: zorunlu(g, "takip", "Takip numarası"), service: t(g.birim), language: t(g.dil) || "en" })}`, basliklar: dhlB(s) }), sonuc: ozetAl("shipments.0.status.description") },
      { id: "sube", ad: "Yakındaki DHL noktalarını bul", aciklama: "Şube, paket dolabı ve teslim noktaları", okuma: true, sirlar: ["DHL_API_KEY"], alanlar: [{ ad: "ulke", etiket: "Ülke kodu", zorunlu: true, yer: "DE" }, { ad: "sehir", etiket: "Şehir", yer: "Berlin" }, { ad: "posta", etiket: "Posta kodu", yer: "10115" }, { ad: "adet", etiket: "Kaç sonuç", tur: "sayi", varsayilan: "10" }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.dhl.com/location-finder/v1/find-by-address${sorgu({ countryCode: zorunlu(g, "ulke", "Ülke kodu").toUpperCase(), addressLocality: t(g.sehir), postalCode: t(g.posta), limit: tamsayi(g.adet, 10, 1, 50) })}`, basliklar: dhlB(s) }), sonuc: ozetAl("locations.0.name") },
      { id: "express-fiyat", ad: "Express fiyatı al", aciklama: "Ülke, şehir, posta kodu ve paket ölçüsüyle", okuma: true, sirlar: [...DHLX, "DHL_EXPRESS_HESAP"], alanlar: [{ ad: "cikisUlke", etiket: "Çıkış ülke kodu", zorunlu: true, yer: "TR" }, { ad: "cikisSehir", etiket: "Çıkış şehri", zorunlu: true, yer: "Istanbul" }, { ad: "cikisPosta", etiket: "Çıkış posta kodu" }, { ad: "varisUlke", etiket: "Varış ülke kodu", zorunlu: true, yer: "DE" }, { ad: "varisSehir", etiket: "Varış şehri", zorunlu: true, yer: "Berlin" }, { ad: "varisPosta", etiket: "Varış posta kodu" }, ...PAKET, { ad: "tarih", etiket: "Gönderim günü", yer: "2026-11-10" }, { ad: "gumruk", etiket: "Gümrüğe tabi", tur: "evet-hayir" }],
        istek: (g, s) => ({ yontem: "GET", url: `${dhlX(s)}/rates${sorgu({ accountNumber: s("DHL_EXPRESS_HESAP"), originCountryCode: zorunlu(g, "cikisUlke", "Çıkış ülkesi").toUpperCase(), originCityName: zorunlu(g, "cikisSehir", "Çıkış şehri"), originPostalCode: t(g.cikisPosta), destinationCountryCode: zorunlu(g, "varisUlke", "Varış ülkesi").toUpperCase(), destinationCityName: zorunlu(g, "varisSehir", "Varış şehri"), destinationPostalCode: t(g.varisPosta), weight: kg(g), length: cm(g.boy) || 10, width: cm(g.en) || 10, height: cm(g.yukseklik) || 10, plannedShippingDate: t(g.tarih) || bugun(), isCustomsDeclarable: evet(g.gumruk) ? "true" : "false", unitOfMeasurement: "metric" })}`, basliklar: dhlXB(s) }), sonuc: ozetAl("products.0.totalPrice.0.price") },
      { id: "express-takip", ad: "Express gönderisini takip et", aciklama: "MyDHL API ile ayrıntılı hareketler", okuma: true, sirlar: DHLX, alanlar: [{ ad: "takip", etiket: "Express takip numarası", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `${dhlX(s)}/shipments/${enc(zorunlu(g, "takip", "Takip numarası"))}/tracking${sorgu({ trackingView: "all-checkpoints", levelOfDetail: "all" })}`, basliklar: dhlXB(s) }), sonuc: ozetAl("shipments.0.status") },
    ],
  },
  {
    id: "fedex", ad: "FedEx", logo: "/marka/uyg/fedex.svg", kategori: "Kargo", aciklama: "Takip, fiyat, gönderi oluşturma, iptal ve adres doğrulama", belge: "https://developer.fedex.com/api/en-us/catalog.html",
    sirlar: [{ ad: "FEDEX_CLIENT_ID", etiket: "API anahtarı (Client ID)", nasil: "developer.fedex.com, My Projects; projenin API Key değeri." }, { ad: "FEDEX_CLIENT_SECRET", etiket: "Gizli anahtar", nasil: "Aynı projenin Secret Key değeri." }, { ad: "FEDEX_HESAP_NO", etiket: "FedEx hesap numarası", nasil: "Fiyat ve gönderi için 9 haneli hesap numarası; yalnız takip için gerekmez.", istege: true }, { ad: "FEDEX_ORTAM", etiket: "Ortam", nasil: "Sandbox için test yaz; boşsa canlı.", istege: true }],
    kimlik: { sirlar: ["FEDEX_CLIENT_ID", "FEDEX_CLIENT_SECRET"], istek: (s) => ({ yontem: "POST", url: `${fdxTaban(s)}/oauth/token`, form: { grant_type: "client_credentials", client_id: s("FEDEX_CLIENT_ID"), client_secret: s("FEDEX_CLIENT_SECRET") } }),
      coz: (y) => { const o = y as { access_token?: string; expires_in?: number }; if (!o?.access_token) throw new Error("FedEx belirteç vermedi; API anahtarını denetle."); return { degerler: { _FEDEX_ERISIM: o.access_token }, omur: (o.expires_in ?? 3600) * 1000 }; } },
    eylemler: [
      { id: "takip", ad: "Gönderiyi takip et", aciklama: "Son durum ve ayrıntılı hareketler", okuma: true, sirlar: ["_FEDEX_ERISIM"], alanlar: [{ ad: "takip", etiket: "Takip numarası", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: `${fdxTaban(s)}/track/v1/trackingnumbers`, basliklar: fdxB(s), json: { includeDetailedScans: true, trackingInfo: [{ trackingNumberInfo: { trackingNumber: zorunlu(g, "takip", "Takip numarası") } }] } }), sonuc: ozetAl("output.completeTrackResults.0.trackResults.0.latestStatusDetail.description") },
      { id: "fiyat", ad: "Fiyat al", aciklama: "Posta kodları ve ağırlıkla hizmet fiyatları", okuma: true, sirlar: FDX, alanlar: [{ ad: "cikisPosta", etiket: "Çıkış posta kodu", zorunlu: true }, { ad: "cikisUlke", etiket: "Çıkış ülke kodu", zorunlu: true, varsayilan: "US", yer: "US" }, { ad: "varisPosta", etiket: "Varış posta kodu", zorunlu: true }, { ad: "varisUlke", etiket: "Varış ülke kodu", zorunlu: true, varsayilan: "US", yer: "US" }, ...PAKET, { ad: "hizmet", etiket: "Hizmet (boşsa hepsi)", tur: "secim", secenekler: [{ id: "", ad: "Hepsi" }, ...FDX_HIZMET] }],
        istek: (g, s) => ({ yontem: "POST", url: `${fdxTaban(s)}/rate/v1/rates/quotes`, basliklar: fdxB(s), json: { accountNumber: { value: s("FEDEX_HESAP_NO") }, requestedShipment: dolu({ shipper: { address: { postalCode: zorunlu(g, "cikisPosta", "Çıkış posta kodu"), countryCode: zorunlu(g, "cikisUlke", "Çıkış ülkesi").toUpperCase() } }, recipient: { address: { postalCode: zorunlu(g, "varisPosta", "Varış posta kodu"), countryCode: zorunlu(g, "varisUlke", "Varış ülkesi").toUpperCase() } }, serviceType: t(g.hizmet), pickupType: "DROPOFF_AT_FEDEX_LOCATION", rateRequestType: ["ACCOUNT", "LIST"], requestedPackageLineItems: fdxPaket(g) }) } }),
        sonuc: ozetAl("output.rateReplyDetails.0.ratedShipmentDetails.0.totalNetCharge") },
      { id: "gonderi", ad: "Gönderi ve etiket oluştur", aciklama: "Etiket adresi ve takip numarası döner", sirlar: FDX, alanlar: [...GONDEREN, ...ALICI, ...PAKET, { ad: "hizmet", etiket: "Hizmet", tur: "secim", secenekler: FDX_HIZMET, varsayilan: "FEDEX_GROUND" }],
        istek: (g, s) => ({ yontem: "POST", url: `${fdxTaban(s)}/ship/v1/shipments`, basliklar: fdxB(s), json: { labelResponseOptions: "URL_ONLY", accountNumber: { value: s("FEDEX_HESAP_NO") }, requestedShipment: { shipper: fdxKisi(adres(g, "gon")), recipients: [fdxKisi(adres(g, "ali"))], shipDatestamp: bugun(), serviceType: t(g.hizmet) || "FEDEX_GROUND", packagingType: "YOUR_PACKAGING", pickupType: "USE_SCHEDULED_PICKUP", blockInsightVisibility: false, shippingChargesPayment: { paymentType: "SENDER" }, labelSpecification: { imageType: "PDF", labelStockType: "PAPER_85X11_TOP_HALF_LABEL" }, requestedPackageLineItems: fdxPaket(g) } } }),
        sonuc: (y) => { const p = (y as { output?: { transactionShipments?: { masterTrackingNumber?: string; pieceResponses?: { packageDocuments?: { url?: string }[] }[] }[] } })?.output?.transactionShipments?.[0]; return { ozet: [p?.masterTrackingNumber, p?.pieceResponses?.[0]?.packageDocuments?.[0]?.url].filter(Boolean).join(" ") || undefined }; } },
      { id: "iptal", ad: "Gönderiyi iptal et", aciklama: "Takip numarasıyla", sirlar: FDX, alanlar: [{ ad: "takip", etiket: "Takip numarası", zorunlu: true }, { ad: "ulke", etiket: "Gönderen ülke kodu", varsayilan: "US", yer: "US" }],
        istek: (g, s) => ({ yontem: "PUT", url: `${fdxTaban(s)}/ship/v1/shipments/cancel`, basliklar: fdxB(s), json: { accountNumber: { value: s("FEDEX_HESAP_NO") }, emailShipment: false, senderCountryCode: (t(g.ulke) || "US").toUpperCase(), deletionControl: "DELETE_ALL_PACKAGES", trackingNumber: zorunlu(g, "takip", "Takip numarası") } }), sonuc: ozetAl("output.cancelledShipment") },
      { id: "adres", ad: "Adresi doğrula", aciklama: "Adresi standart biçime çevirir ve sınıflandırır", okuma: true, sirlar: ["_FEDEX_ERISIM"], alanlar: ALICI,
        istek: (g, s) => ({ yontem: "POST", url: `${fdxTaban(s)}/address/v1/addresses/resolve`, basliklar: fdxB(s), json: { addressesToValidate: [{ address: fdxAdres(adres(g, "ali")) }] } }), sonuc: ozetAl("output.resolvedAddresses.0.classification") },
    ],
  },
  {
    id: "ups", ad: "UPS", logo: "/marka/uyg/ups.svg", kategori: "Kargo", aciklama: "Takip, fiyat, gönderi oluşturma ve iptal", belge: "https://developer.ups.com/catalog",
    sirlar: [{ ad: "UPS_CLIENT_ID", etiket: "Client ID", nasil: "developer.ups.com, Apps; uygulamanın Client ID değeri (Tracking, Rating ve Shipping ürünleri ekli olmalı)." }, { ad: "UPS_CLIENT_SECRET", etiket: "Client Secret", nasil: "Aynı uygulamanın Client Secret değeri." }, { ad: "UPS_HESAP_NO", etiket: "UPS hesap numarası", nasil: "6 haneli gönderici numarası; fiyat ve gönderi için.", istege: true }, { ad: "UPS_ORTAM", etiket: "Ortam", nasil: "Test ortamı için test yaz; boşsa canlı.", istege: true }],
    kimlik: { sirlar: ["UPS_CLIENT_ID", "UPS_CLIENT_SECRET"], istek: (s) => ({ yontem: "POST", url: `${upsTaban(s)}/security/v1/oauth/token`, basliklar: { Authorization: temel(s("UPS_CLIENT_ID"), s("UPS_CLIENT_SECRET")) }, form: { grant_type: "client_credentials" } }),
      coz: (y) => { const o = y as { access_token?: string; expires_in?: string | number }; if (!o?.access_token) throw new Error("UPS belirteç vermedi; Client ID ve Secret değerlerini denetle."); return { degerler: { _UPS_ERISIM: o.access_token }, omur: Number(o.expires_in ?? 14399) * 1000 }; } },
    eylemler: [
      { id: "takip", ad: "Gönderiyi takip et", aciklama: "Son durum ve hareketler", okuma: true, sirlar: ["_UPS_ERISIM"], alanlar: [{ ad: "takip", etiket: "Takip numarası (1Z…)", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `${upsTaban(s)}/api/track/v1/details/${enc(zorunlu(g, "takip", "Takip numarası"))}${sorgu({ locale: "en_US", returnSignature: "false" })}`, basliklar: upsB(s) }), sonuc: ozetAl("trackResponse.shipment.0.package.0.currentStatus.description") },
      { id: "fiyat", ad: "Fiyat al", aciklama: "Bir hizmetin ya da bütün hizmetlerin fiyatı", okuma: true, sirlar: UPS, alanlar: [...GONDEREN, ...ALICI, ...PAKET, { ad: "hizmet", etiket: "Hizmet (boşsa hepsi)", tur: "secim", secenekler: [{ id: "", ad: "Hepsi" }, ...UPS_HIZMET] }],
        istek: (g, s) => { const gon = adres(g, "gon"); const h = t(g.hizmet); return { yontem: "POST", url: `${upsTaban(s)}/api/rating/v2409/${h ? "Rate" : "Shop"}`, basliklar: upsB(s), json: { RateRequest: { Request: { RequestOption: h ? "Rate" : "Shop" }, Shipment: dolu({ Shipper: { ...upsKisi(gon), ShipperNumber: s("UPS_HESAP_NO") }, ShipTo: upsKisi(adres(g, "ali")), ShipFrom: upsKisi(gon), PaymentDetails: { ShipmentCharge: [{ Type: "01", BillShipper: { AccountNumber: s("UPS_HESAP_NO") } }] }, Service: h ? { Code: h } : undefined, NumOfPieces: "1", Package: upsPaket(g, "PackagingType") }) } } }; },
        sonuc: ozetAl("RateResponse.RatedShipment.0.TotalCharges.MonetaryValue") },
      { id: "gonderi", ad: "Gönderi ve etiket oluştur", aciklama: "Takip numarası ve etiket görüntüsü döner", sirlar: UPS, alanlar: [...GONDEREN, ...ALICI, ...PAKET, { ad: "hizmet", etiket: "Hizmet", tur: "secim", secenekler: UPS_HIZMET, varsayilan: "03" }, { ad: "aciklama", etiket: "İçerik açıklaması", yer: "Giyim" }],
        istek: (g, s) => { const gon = adres(g, "gon"); return { yontem: "POST", url: `${upsTaban(s)}/api/shipments/v2409/ship`, basliklar: upsB(s), json: { ShipmentRequest: { Request: { RequestOption: "nonvalidate" }, Shipment: { Description: t(g.aciklama) || "Goods", Shipper: { ...upsKisi(gon), ShipperNumber: s("UPS_HESAP_NO") }, ShipTo: upsKisi(adres(g, "ali")), ShipFrom: upsKisi(gon), PaymentInformation: { ShipmentCharge: { Type: "01", BillShipper: { AccountNumber: s("UPS_HESAP_NO") } } }, Service: { Code: t(g.hizmet) || "03" }, Package: upsPaket(g, "Packaging") }, LabelSpecification: { LabelImageFormat: { Code: "GIF" } } } } }; },
        sonuc: ozetAl("ShipmentResponse.ShipmentResults.ShipmentIdentificationNumber") },
      { id: "iptal", ad: "Gönderiyi iptal et", aciklama: "Gönderi kimlik numarasıyla", sirlar: ["_UPS_ERISIM"], alanlar: [{ ad: "gonderi", etiket: "Gönderi kimlik numarası", zorunlu: true }],
        istek: (g, s) => ({ yontem: "DELETE", url: `${upsTaban(s)}/api/shipments/v2409/void/cancel/${enc(zorunlu(g, "gonderi", "Gönderi kimlik numarası"))}`, basliklar: upsB(s) }), sonuc: ozetAl("VoidShipmentResponse.SummaryResult.Status.Description") },
    ],
  },
];
