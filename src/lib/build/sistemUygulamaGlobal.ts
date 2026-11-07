import { dolu, enc, evet, liste, m, ozetAl, rastgele, sayi, sorgu, t, tamsayi, temel, virgul, zorunlu, type Sirlar, type UygAlan, type UygKimlik, type Uygulama } from "./sistemUygulamaOrtak";

/**
 * Uluslararası muhasebe, ödeme ve pazar yeri servisleri. Uç noktalar, kimlik biçimleri ve gövdeler resmî belgelerden
 * (2026-11-07): QuickBooks Online developer.intuit.com (Accounting API v3, minorversion 75, OAuth yenileme belirteci) ·
 * Xero developer.xero.com (Accounting API 2.0, xero-tenant-id) · FreshBooks freshbooks.com/api (tek kullanımlık yenileme
 * belirteci) · Square developer.squareup.com (Square-Version 2026-09-16) · Adyen docs.adyen.com (Checkout API v72) ·
 * Mollie docs.mollie.com (v2) · Razorpay razorpay.com/docs/api · BigCommerce developer.bigcommerce.com (Orders v2,
 * Catalog ve Customers v3) · Etsy developers.etsy.com (Open API v3; x-api-key anahtar:gizli biçiminde) · Amazon
 * developer-docs.amazon.com/sp-api (LWA belirteci, Orders API v2026-01-01, FBA Inventory v1, Listings Items 2021-08-01) ·
 * eBay developer.ebay.com (Sell Fulfillment v1, Inventory v1).
 */
type G = Record<string, unknown>;

/** Yenileme belirteciyle OAuth kimlik adımı (servis yeni yenileme belirteci verirse sır güncellenir). */
function yenilemeKimlik(o: { ad: string; sirlar: [string, string, string]; deger: string; istek: UygKimlik["istek"]; ek?: (y: Record<string, unknown>) => Record<string, string> }): UygKimlik {
  const [, , yenileme] = o.sirlar;
  return {
    sirlar: [...o.sirlar], istek: o.istek,
    coz: (y, s) => {
      const r = (y ?? {}) as Record<string, unknown> & { access_token?: string; expires_in?: number | string; refresh_token?: string; error?: string; error_description?: string };
      if (!r.access_token) throw new Error(`${o.ad} belirteç vermedi${r.error ? `: ${r.error_description ?? r.error}` : ""}; yenileme belirtecini yenile.`);
      return { degerler: { [o.deger]: r.access_token, ...(o.ek?.(r) ?? {}) }, omur: Number(r.expires_in ?? 3600) * 1000, ...(r.refresh_token && r.refresh_token !== s(yenileme) ? { yeniSirlar: { [yenileme]: r.refresh_token } } : {}) };
    },
  };
}

/** Ondalıksız para birimleri (en küçük birim tutarın kendisi). */
const ONDALIKSIZ = new Set(["JPY", "KRW", "VND", "CLP", "ISK", "XAF", "XOF", "UGX", "PYG", "RWF", "KMF", "GNF", "BIF", "DJF", "MGA", "VUV", "XPF"]);
const para = (g: G, vars = "USD") => (t(g.para) || vars).toUpperCase().slice(0, 3);
const tutarSay = (g: G, ad = "tutar") => { const v = sayi(g[ad], 0, 0, 1e10); if (!v) throw new Error("Tutar boş ya da sıfır."); return v; };
/** 12.50 USD için 1250; 1200 JPY için 1200. */
const kucuk = (v: number, pb: string) => Math.round(ONDALIKSIZ.has(pb) ? v : v * 100);
const ondalik = (v: number, pb: string) => (ONDALIKSIZ.has(pb) ? String(Math.round(v)) : v.toFixed(2));
const PARA: UygAlan = { ad: "para", etiket: "Para birimi", yer: "USD", varsayilan: "USD" };
const gun = (v: unknown) => { const s = t(v); return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : new Date().toISOString().slice(0, 10); };
const gunSonra = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

/* ───────────── QuickBooks Online ───────────── */
const qbTaban = (s: Sirlar) => (s("QUICKBOOKS_ORTAM") === "test" ? "https://sandbox-quickbooks.api.intuit.com" : "https://quickbooks.api.intuit.com");
const qb = (s: Sirlar, yol: string, ek: Record<string, unknown> = {}) => `${qbTaban(s)}/v3/company/${enc(s("QUICKBOOKS_SIRKET"))}${yol}${sorgu({ ...ek, minorversion: 75 })}`;
const qbB = (s: Sirlar) => ({ Authorization: `Bearer ${s("_QB_ERISIM")}` });
const QB = ["_QB_ERISIM", "QUICKBOOKS_SIRKET"];
const qbTirnak = (v: string) => v.replace(/\\/g, "").replace(/'/g, "\\'");
const QB_KALEM: UygAlan[] = [{ ad: "urun", etiket: "Ürün ya da hizmet kimliği (ItemRef)", zorunlu: true, yer: "1" }, { ad: "aciklama", etiket: "Kalem açıklaması" }, { ad: "adet", etiket: "Adet", tur: "sayi", varsayilan: "1", yer: "1" }, { ad: "fiyat", etiket: "Birim fiyat", tur: "sayi", zorunlu: true }, { ad: "kalemler", etiket: "Ek kalemler (JSON listesi, isteğe bağlı)", tur: "json", yer: "[{\"urun\": \"1\", \"aciklama\": \"Kurulum\", \"adet\": 1, \"fiyat\": 50}]" }];
const qbSatirlar = (g: G) => {
  const l = [{ urun: g.urun, aciklama: g.aciklama, adet: g.adet, fiyat: g.fiyat }, ...(liste(g.kalemler, "Ek kalemler") as Record<string, unknown>[])];
  const d = l.filter((x) => t(x.urun) && t(x.fiyat));
  if (!d.length) throw new Error("En az bir kalem için ürün kimliği ve birim fiyat yaz.");
  return d.map((x) => { const adet = sayi(x.adet, 1, 0, 1e6); const fiyat = sayi(x.fiyat, 0, -1e9, 1e9); return { DetailType: "SalesItemLineDetail", Amount: Math.round(adet * fiyat * 100) / 100, Description: t(x.aciklama) || undefined, SalesItemLineDetail: { ItemRef: { value: t(x.urun) }, Qty: adet, UnitPrice: fiyat } }; });
};
const qbHata = (y: unknown) => { const f = (y as { Fault?: { Error?: { Message?: string; Detail?: string }[] } } | null)?.Fault; return f ? { hata: (f.Error ?? []).map((e) => e.Detail ?? e.Message).join("; ") || "QuickBooks hata döndürdü." } : {}; };
const qbOzet = (yol: string) => (y: unknown) => { const h = qbHata(y); return h.hata ? h : ozetAl(yol)(y); };

/* ───────────── Xero ───────────── */
const XR = "https://api.xero.com/api.xro/2.0";
const xrB = (s: Sirlar) => ({ Authorization: `Bearer ${s("_XERO_ERISIM")}`, "xero-tenant-id": s("XERO_TENANT_ID") });
const XS = ["_XERO_ERISIM", "XERO_TENANT_ID"];

/* ───────────── FreshBooks ───────────── */
const fb = (s: Sirlar, yol: string) => `https://api.freshbooks.com/accounting/account/${enc(s("FRESHBOOKS_HESAP"))}${yol}`;
const fbB = (s: Sirlar) => ({ Authorization: `Bearer ${s("_FB_ERISIM")}` });
const FB = ["_FB_ERISIM", "FRESHBOOKS_HESAP"];

/* ───────────── Square ───────────── */
const sqTaban = (s: Sirlar) => (s("SQUARE_ORTAM") === "test" ? "https://connect.squareupsandbox.com/v2" : "https://connect.squareup.com/v2");
const sqB = (s: Sirlar) => ({ Authorization: `Bearer ${s("SQUARE_ACCESS_TOKEN")}`, "Square-Version": "2026-09-16" });
const SQ = ["SQUARE_ACCESS_TOKEN"];

/* ───────────── Adyen ───────────── */
const adTaban = (s: Sirlar) => { const o = s("ADYEN_CANLI_ONEK").trim().replace(/[^\w-]/g, ""); return o ? `https://${o}-checkout-live.adyenpayments.com/checkout/v72` : "https://checkout-test.adyen.com/v72"; };
const adB = (s: Sirlar) => ({ "X-API-Key": s("ADYEN_API_KEY"), "Idempotency-Key": rastgele(16) });
const AD = ["ADYEN_API_KEY", "ADYEN_MERCHANT_ACCOUNT"];

/* ───────────── Mollie ───────────── */
const MO = "https://api.mollie.com/v2";
const moB = (s: Sirlar) => ({ Authorization: `Bearer ${s("MOLLIE_API_KEY")}` });

/* ───────────── Razorpay ───────────── */
const RZ = "https://api.razorpay.com/v1";
const rzB = (s: Sirlar) => ({ Authorization: temel(s("RAZORPAY_KEY_ID"), s("RAZORPAY_KEY_SECRET")) });
const RZS = ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"];

/* ───────────── BigCommerce ───────────── */
const bc = (s: Sirlar, yol: string) => `https://api.bigcommerce.com/stores/${enc(s("BIGCOMMERCE_MAGAZA").replace(/^stores\//, "").trim())}${yol}`;
const bcB = (s: Sirlar) => ({ "X-Auth-Token": s("BIGCOMMERCE_TOKEN") });
const BC = ["BIGCOMMERCE_MAGAZA", "BIGCOMMERCE_TOKEN"];
const BC_DURUM = [{ id: "11", ad: "Karşılanmayı bekliyor" }, { id: "9", ad: "Gönderim bekliyor" }, { id: "2", ad: "Gönderildi" }, { id: "3", ad: "Kısmen gönderildi" }, { id: "10", ad: "Tamamlandı" }, { id: "5", ad: "İptal" }, { id: "4", ad: "İade edildi" }, { id: "1", ad: "Beklemede" }, { id: "7", ad: "Ödeme bekliyor" }];

/* ───────────── Etsy ───────────── */
const ET = "https://api.etsy.com/v3/application";
const etB = (s: Sirlar) => ({ Authorization: `Bearer ${s("_ETSY_ERISIM")}`, "x-api-key": `${s("ETSY_API_KEY")}:${s("ETSY_SHARED_SECRET")}` });
const etMagaza = (s: Sirlar) => `${ET}/shops/${enc(s("ETSY_MAGAZA"))}`;
const ETS = ["_ETSY_ERISIM", "ETSY_SHARED_SECRET", "ETSY_MAGAZA"];

/* ───────────── Amazon SP-API ───────────── */
const amTaban = (s: Sirlar) => `https://sellingpartnerapi-${({ na: "na", eu: "eu", fe: "fe" } as Record<string, string>)[s("AMAZON_BOLGE").toLowerCase()] ?? "eu"}.amazon.com`;
const amB = (s: Sirlar) => ({ "x-amz-access-token": s("_AMAZON_ERISIM") });
const AM = ["_AMAZON_ERISIM", "AMAZON_PAZAR"];
const AM_VERI: UygAlan = { ad: "veri", etiket: "Eklenecek bilgiler (virgülle)", yer: "FULFILLMENT, PROCEEDS, BUYER, RECIPIENT", varsayilan: "FULFILLMENT,PROCEEDS" };
const amVeri = (g: G) => virgul(g.veri).map((x) => x.toUpperCase()).join(",");

/* ───────────── eBay ───────────── */
const ebTaban = (s: Sirlar) => (s("EBAY_ORTAM") === "test" ? "https://api.sandbox.ebay.com" : "https://api.ebay.com");
const ebB = (s: Sirlar) => ({ Authorization: `Bearer ${s("_EBAY_ERISIM")}` });
const EB = ["_EBAY_ERISIM"];

export const UYG_GLOBAL: Uygulama[] = [
  /* ───────── Muhasebe ───────── */
  {
    id: "quickbooks", ad: "QuickBooks Online", logo: "/marka/uyg/quickbooks.svg", kategori: "Muhasebe", aciklama: "Müşteri, fatura, satış fişi ve tahsilat", belge: "https://developer.intuit.com/app/developer/qbo/docs/api/accounting/most-commonly-used/invoice",
    sirlar: [
      { ad: "QUICKBOOKS_CLIENT_ID", etiket: "Client ID", nasil: "developer.intuit.com, My Apps, uygulaman, Keys and credentials." },
      { ad: "QUICKBOOKS_CLIENT_SECRET", etiket: "Client Secret", nasil: "Aynı sayfadaki Client Secret." },
      { ad: "QUICKBOOKS_REFRESH_TOKEN", etiket: "Yenileme belirteci", nasil: "com.intuit.quickbooks.accounting kapsamıyla alınan refresh_token (OAuth Playground ile alınabilir); yenilendikçe kendiliğinden güncellenir." },
      { ad: "QUICKBOOKS_SIRKET", etiket: "Şirket kimliği (Realm ID)", nasil: "Yetki verirken dönen realmId; QuickBooks'ta Ayarlar, Hesap ve ayarlar, Şirket kimliği." },
      { ad: "QUICKBOOKS_ORTAM", etiket: "Ortam", nasil: "Sandbox şirketi için test yaz; boşsa canlı.", istege: true },
    ],
    kimlik: yenilemeKimlik({ ad: "QuickBooks", deger: "_QB_ERISIM", sirlar: ["QUICKBOOKS_CLIENT_ID", "QUICKBOOKS_CLIENT_SECRET", "QUICKBOOKS_REFRESH_TOKEN"], istek: (s) => ({ yontem: "POST", url: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", basliklar: { Authorization: temel(s("QUICKBOOKS_CLIENT_ID"), s("QUICKBOOKS_CLIENT_SECRET")) }, form: { grant_type: "refresh_token", refresh_token: s("QUICKBOOKS_REFRESH_TOKEN") } }) }),
    eylemler: [
      { id: "musteri", ad: "Müşteri oluştur", aciklama: "Görünen ad, e-posta ve telefonla", sirlar: QB, alanlar: [{ ad: "ad", etiket: "Görünen ad", zorunlu: true }, { ad: "sirket", etiket: "Şirket" }, { ad: "eposta", etiket: "E-posta" }, { ad: "telefon", etiket: "Telefon" }],
        istek: (g, s) => ({ yontem: "POST", url: qb(s, "/customer"), basliklar: qbB(s), json: dolu({ DisplayName: zorunlu(g, "ad", "Görünen ad"), CompanyName: t(g.sirket), PrimaryEmailAddr: t(g.eposta) ? { Address: t(g.eposta) } : undefined, PrimaryPhone: t(g.telefon) ? { FreeFormNumber: t(g.telefon) } : undefined }) }), sonuc: qbOzet("Customer.Id") },
      { id: "musteri-ara", ad: "Müşteri ara", aciklama: "E-postaya ya da görünen ada göre", okuma: true, sirlar: QB, alanlar: [{ ad: "eposta", etiket: "E-posta" }, { ad: "ad", etiket: "Görünen ad" }],
        istek: (g, s) => { const e = t(g.eposta), a = t(g.ad); if (!e && !a) throw new Error("E-posta ya da ad yaz."); return { yontem: "GET", url: qb(s, "/query", { query: `select * from Customer where ${e ? `PrimaryEmailAddr = '${qbTirnak(e)}'` : `DisplayName LIKE '%${qbTirnak(a)}%'`} maxresults 10` }), basliklar: qbB(s) }; }, sonuc: qbOzet("QueryResponse.Customer.0.Id") },
      { id: "fatura", ad: "Fatura oluştur", aciklama: "Müşteriye kalemli satış faturası", sirlar: QB, alanlar: [{ ad: "musteri", etiket: "Müşteri kimliği", zorunlu: true }, ...QB_KALEM, { ad: "eposta", etiket: "Fatura e-postası" }, { ad: "vade", etiket: "Vade günü", yer: "2026-12-01" }, { ad: "numara", etiket: "Fatura numarası (boşsa otomatik)" }],
        istek: (g, s) => ({ yontem: "POST", url: qb(s, "/invoice"), basliklar: qbB(s), json: dolu({ CustomerRef: { value: zorunlu(g, "musteri", "Müşteri kimliği") }, Line: qbSatirlar(g), BillEmail: t(g.eposta) ? { Address: t(g.eposta) } : undefined, DueDate: t(g.vade) ? gun(g.vade) : undefined, DocNumber: t(g.numara) }) }), sonuc: qbOzet("Invoice.Id") },
      { id: "fatura-gonder", ad: "Faturayı e-postayla gönder", aciklama: "Faturayı müşterinin e-postasına yollar", sirlar: QB, alanlar: [{ ad: "fatura", etiket: "Fatura kimliği", zorunlu: true }, { ad: "eposta", etiket: "Alıcı e-postası (boşsa faturadaki)" }],
        istek: (g, s) => ({ yontem: "POST", url: qb(s, `/invoice/${enc(zorunlu(g, "fatura", "Fatura kimliği"))}/send`, { sendTo: t(g.eposta) }), basliklar: qbB(s), metin: "", tur: "application/octet-stream" }), sonuc: qbOzet("Invoice.EmailStatus") },
      { id: "satis-fisi", ad: "Satış fişi oluştur", aciklama: "Peşin tahsil edilmiş satış (ör. kartla ödenen sipariş)", sirlar: QB, alanlar: [{ ad: "musteri", etiket: "Müşteri kimliği" }, ...QB_KALEM, { ad: "eposta", etiket: "Fiş e-postası" }, { ad: "referans", etiket: "Ödeme referansı", yer: "Stripe ödeme kimliği" }],
        istek: (g, s) => ({ yontem: "POST", url: qb(s, "/salesreceipt"), basliklar: qbB(s), json: dolu({ CustomerRef: t(g.musteri) ? { value: t(g.musteri) } : undefined, Line: qbSatirlar(g), BillEmail: t(g.eposta) ? { Address: t(g.eposta) } : undefined, PaymentRefNum: t(g.referans).slice(0, 21) }) }), sonuc: qbOzet("SalesReceipt.Id") },
      { id: "tahsilat", ad: "Faturaya ödeme kaydet", aciklama: "Faturayı tamamen ya da kısmen kapatır", sirlar: QB, alanlar: [{ ad: "musteri", etiket: "Müşteri kimliği", zorunlu: true }, { ad: "fatura", etiket: "Fatura kimliği", zorunlu: true }, { ad: "tutar", etiket: "Tutar", tur: "sayi", zorunlu: true }],
        istek: (g, s) => { const v = tutarSay(g); return { yontem: "POST", url: qb(s, "/payment"), basliklar: qbB(s), json: { CustomerRef: { value: zorunlu(g, "musteri", "Müşteri kimliği") }, TotalAmt: v, Line: [{ Amount: v, LinkedTxn: [{ TxnId: zorunlu(g, "fatura", "Fatura kimliği"), TxnType: "Invoice" }] }] } }; }, sonuc: qbOzet("Payment.Id") },
      { id: "fatura-getir", ad: "Faturayı getir", aciklama: "Bakiye, durum ve kalemler", okuma: true, sirlar: QB, alanlar: [{ ad: "fatura", etiket: "Fatura kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: qb(s, `/invoice/${enc(zorunlu(g, "fatura", "Fatura kimliği"))}`), basliklar: qbB(s) }), sonuc: qbOzet("Invoice.Balance") },
    ],
  },
  {
    id: "xero", ad: "Xero", logo: "/marka/baglanti/xero.svg", kategori: "Muhasebe", aciklama: "Kişi, satış faturası, e-posta ve ödeme", belge: "https://developer.xero.com/documentation/api/accounting/invoices",
    sirlar: [
      { ad: "XERO_CLIENT_ID", etiket: "Client ID", nasil: "developer.xero.com, My Apps, uygulaman, Configuration." },
      { ad: "XERO_CLIENT_SECRET", etiket: "Client Secret", nasil: "Aynı sayfada Generate a secret." },
      { ad: "XERO_REFRESH_TOKEN", etiket: "Yenileme belirteci", nasil: "offline_access ve accounting.transactions accounting.contacts kapsamlarıyla alınan refresh_token; yenilendikçe kendiliğinden güncellenir." },
      { ad: "XERO_TENANT_ID", etiket: "Kuruluş kimliği (tenant id)", nasil: "https://api.xero.com/connections yanıtındaki tenantId." },
    ],
    kimlik: yenilemeKimlik({ ad: "Xero", deger: "_XERO_ERISIM", sirlar: ["XERO_CLIENT_ID", "XERO_CLIENT_SECRET", "XERO_REFRESH_TOKEN"], istek: (s) => ({ yontem: "POST", url: "https://identity.xero.com/connect/token", basliklar: { Authorization: temel(s("XERO_CLIENT_ID"), s("XERO_CLIENT_SECRET")) }, form: { grant_type: "refresh_token", refresh_token: s("XERO_REFRESH_TOKEN") } }) }),
    eylemler: [
      { id: "kisi", ad: "Kişi oluştur", aciklama: "Müşteri ya da tedarikçi", sirlar: XS, alanlar: [{ ad: "ad", etiket: "Ad ya da unvan", zorunlu: true }, { ad: "eposta", etiket: "E-posta" }, { ad: "isim", etiket: "Yetkili adı" }, { ad: "soyisim", etiket: "Yetkili soyadı" }],
        istek: (g, s) => ({ yontem: "POST", url: `${XR}/Contacts`, basliklar: xrB(s), json: { Contacts: [dolu({ Name: zorunlu(g, "ad", "Ad"), EmailAddress: t(g.eposta), FirstName: t(g.isim), LastName: t(g.soyisim) })] } }), sonuc: ozetAl("Contacts.0.ContactID") },
      { id: "kisi-ara", ad: "Kişi ara", aciklama: "Ad, e-posta ya da hesap numarasıyla", okuma: true, sirlar: XS, alanlar: [{ ad: "ara", etiket: "Arama", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `${XR}/Contacts${sorgu({ searchTerm: zorunlu(g, "ara", "Arama"), summaryOnly: "true" })}`, basliklar: xrB(s) }), sonuc: ozetAl("Contacts.0.ContactID") },
      { id: "fatura", ad: "Satış faturası oluştur", aciklama: "Kişiye kalemli fatura; taslak ya da onaylı", sirlar: XS, alanlar: [{ ad: "kisi", etiket: "Kişi kimliği (ContactID)", zorunlu: true }, { ad: "aciklama", etiket: "Kalem açıklaması", zorunlu: true }, { ad: "adet", etiket: "Adet", tur: "sayi", varsayilan: "1" }, { ad: "fiyat", etiket: "Birim fiyat", tur: "sayi", zorunlu: true }, { ad: "hesap", etiket: "Gelir hesabı kodu", yer: "200", varsayilan: "200" }, PARA, { ad: "vade", etiket: "Vade günü", yer: "2026-12-01" }, { ad: "referans", etiket: "Referans" }, { ad: "durum", etiket: "Durum", tur: "secim", secenekler: [{ id: "AUTHORISED", ad: "Onaylı" }, { id: "DRAFT", ad: "Taslak" }], varsayilan: "AUTHORISED" }],
        istek: (g, s) => ({ yontem: "POST", url: `${XR}/Invoices`, basliklar: xrB(s), json: { Invoices: [dolu({ Type: "ACCREC", Contact: { ContactID: zorunlu(g, "kisi", "Kişi kimliği") }, Date: gun(""), DueDate: t(g.vade) ? gun(g.vade) : gunSonra(14), LineItems: [dolu({ Description: zorunlu(g, "aciklama", "Açıklama"), Quantity: sayi(g.adet, 1, 0, 1e6), UnitAmount: sayi(g.fiyat, 0, -1e9, 1e9), AccountCode: t(g.hesap) || "200" })], CurrencyCode: para(g), Reference: t(g.referans), Status: t(g.durum) === "DRAFT" ? "DRAFT" : "AUTHORISED" })] } }), sonuc: ozetAl("Invoices.0.InvoiceID") },
      { id: "fatura-gonder", ad: "Faturayı e-postayla gönder", aciklama: "Onaylı faturayı kişinin e-postasına yollar", sirlar: XS, alanlar: [{ ad: "fatura", etiket: "Fatura kimliği (InvoiceID)", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: `${XR}/Invoices/${enc(zorunlu(g, "fatura", "Fatura kimliği"))}/Email`, basliklar: xrB(s), json: {} }) },
      { id: "odeme", ad: "Faturaya ödeme kaydet", aciklama: "Banka hesabına tahsilat işler", sirlar: XS, alanlar: [{ ad: "fatura", etiket: "Fatura kimliği (InvoiceID)", zorunlu: true }, { ad: "hesap", etiket: "Banka hesabı kodu", zorunlu: true, yer: "090" }, { ad: "tutar", etiket: "Tutar", tur: "sayi", zorunlu: true }, { ad: "referans", etiket: "Referans", yer: "PayPal işlem kimliği" }],
        istek: (g, s) => ({ yontem: "PUT", url: `${XR}/Payments`, basliklar: xrB(s), json: { Payments: [dolu({ Invoice: { InvoiceID: zorunlu(g, "fatura", "Fatura kimliği") }, Account: { Code: zorunlu(g, "hesap", "Banka hesabı kodu") }, Date: gun(""), Amount: tutarSay(g), Reference: t(g.referans) })] } }), sonuc: ozetAl("Payments.0.PaymentID") },
      { id: "faturalar", ad: "Faturaları listele", aciklama: "Duruma göre", okuma: true, sirlar: XS, alanlar: [{ ad: "durum", etiket: "Durum", tur: "secim", secenekler: [{ id: "AUTHORISED", ad: "Ödenmemiş" }, { id: "PAID", ad: "Ödendi" }, { id: "DRAFT", ad: "Taslak" }, { id: "VOIDED", ad: "İptal" }], varsayilan: "AUTHORISED" }],
        istek: (g, s) => ({ yontem: "GET", url: `${XR}/Invoices${sorgu({ Statuses: t(g.durum) || "AUTHORISED", page: 1, order: "Date DESC" })}`, basliklar: xrB(s) }) },
    ],
  },
  {
    id: "freshbooks", ad: "FreshBooks", logo: "/marka/baglanti/freshbooks.svg", kategori: "Muhasebe", aciklama: "Müşteri, fatura, e-posta ve ödeme", belge: "https://www.freshbooks.com/api/invoices",
    sirlar: [
      { ad: "FRESHBOOKS_CLIENT_ID", etiket: "Client ID", nasil: "my.freshbooks.com/#/developer, uygulaman." },
      { ad: "FRESHBOOKS_CLIENT_SECRET", etiket: "Client Secret", nasil: "Aynı uygulamanın gizli anahtarı." },
      { ad: "FRESHBOOKS_REFRESH_TOKEN", etiket: "Yenileme belirteci", nasil: "Yetki kodundan alınan refresh_token; tek kullanımlıktır, her yenilemede kendiliğinden güncellenir." },
      { ad: "FRESHBOOKS_YONLENDIRME", etiket: "Yönlendirme adresi", nasil: "Uygulamada kayıtlı https yönlendirme adresi (redirect_uri)." },
      { ad: "FRESHBOOKS_HESAP", etiket: "Hesap kimliği (accountId)", nasil: "https://api.freshbooks.com/auth/api/v1/users/me yanıtındaki business_memberships.0.business.account_id." },
    ],
    kimlik: yenilemeKimlik({ ad: "FreshBooks", deger: "_FB_ERISIM", sirlar: ["FRESHBOOKS_CLIENT_ID", "FRESHBOOKS_CLIENT_SECRET", "FRESHBOOKS_REFRESH_TOKEN"], istek: (s) => ({ yontem: "POST", url: "https://api.freshbooks.com/auth/oauth/token", json: { grant_type: "refresh_token", client_id: s("FRESHBOOKS_CLIENT_ID"), client_secret: s("FRESHBOOKS_CLIENT_SECRET"), refresh_token: s("FRESHBOOKS_REFRESH_TOKEN"), redirect_uri: s("FRESHBOOKS_YONLENDIRME") } }) }),
    eylemler: [
      { id: "musteri", ad: "Müşteri oluştur", aciklama: "Ad, e-posta ve şirket", sirlar: FB, alanlar: [{ ad: "eposta", etiket: "E-posta", zorunlu: true }, { ad: "ad", etiket: "Ad" }, { ad: "soyad", etiket: "Soyad" }, { ad: "sirket", etiket: "Şirket" }, { ad: "telefon", etiket: "Telefon" }],
        istek: (g, s) => ({ yontem: "POST", url: fb(s, "/users/clients"), basliklar: fbB(s), json: { client: dolu({ email: zorunlu(g, "eposta", "E-posta"), fname: t(g.ad), lname: t(g.soyad), organization: t(g.sirket), mob_phone: t(g.telefon) }) } }), sonuc: ozetAl("response.result.client.id") },
      { id: "musteri-ara", ad: "Müşteriyi e-postayla bul", aciklama: "Var mı diye bakmak için", okuma: true, sirlar: FB, alanlar: [{ ad: "eposta", etiket: "E-posta", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: fb(s, `/users/clients${sorgu({ "search[email]": zorunlu(g, "eposta", "E-posta") })}`), basliklar: fbB(s) }), sonuc: ozetAl("response.result.clients.0.id") },
      { id: "fatura", ad: "Fatura oluştur", aciklama: "Müşteriye tek ya da çok kalemli fatura", sirlar: FB, alanlar: [{ ad: "musteri", etiket: "Müşteri kimliği", zorunlu: true }, { ad: "kalem", etiket: "Kalem adı", zorunlu: true }, { ad: "aciklama", etiket: "Açıklama" }, { ad: "adet", etiket: "Adet", tur: "sayi", varsayilan: "1" }, { ad: "fiyat", etiket: "Birim fiyat", tur: "sayi", zorunlu: true }, PARA, { ad: "vade", etiket: "Vade (gün)", tur: "sayi", varsayilan: "30" }],
        istek: (g, s) => { const pb = para(g); return { yontem: "POST", url: fb(s, "/invoices/invoices"), basliklar: fbB(s), json: { invoice: { customerid: Number(zorunlu(g, "musteri", "Müşteri kimliği")), create_date: gun(""), currency_code: pb, due_offset_days: tamsayi(g.vade, 30, 0, 365), lines: [dolu({ type: 0, name: zorunlu(g, "kalem", "Kalem adı"), description: t(g.aciklama), qty: sayi(g.adet, 1, 0, 1e6), unit_cost: { amount: String(sayi(g.fiyat, 0, -1e9, 1e9)), code: pb } })] } } }; }, sonuc: ozetAl("response.result.invoice.id") },
      { id: "fatura-gonder", ad: "Faturayı e-postayla gönder", aciklama: "Alıcılara bağlantı ve isteğe bağlı PDF", sirlar: FB, alanlar: [{ ad: "fatura", etiket: "Fatura kimliği", zorunlu: true }, { ad: "alicilar", etiket: "Alıcı e-postaları (virgülle)", zorunlu: true }, { ad: "pdf", etiket: "PDF ekle", tur: "evet-hayir" }],
        istek: (g, s) => ({ yontem: "PUT", url: fb(s, `/invoices/invoices/${enc(zorunlu(g, "fatura", "Fatura kimliği"))}`), basliklar: fbB(s), json: { invoice: { action_email: true, email_recipients: virgul(zorunlu(g, "alicilar", "Alıcılar")), email_include_pdf: evet(g.pdf) } } }), sonuc: ozetAl("response.result.invoice.v3_status") },
      { id: "faturalar", ad: "Faturaları listele", aciklama: "Müşteriye ya da duruma göre", okuma: true, sirlar: FB, alanlar: [{ ad: "musteri", etiket: "Müşteri kimliği" }, { ad: "durum", etiket: "Durum", tur: "secim", secenekler: [{ id: "", ad: "Hepsi" }, { id: "unpaid", ad: "Ödenmemiş" }, { id: "paid", ad: "Ödendi" }, { id: "overdue", ad: "Gecikmiş" }, { id: "draft", ad: "Taslak" }] }],
        istek: (g, s) => ({ yontem: "GET", url: fb(s, `/invoices/invoices${sorgu({ "search[customerid]": t(g.musteri), "search[v3_status]": t(g.durum), per_page: 50 })}`), basliklar: fbB(s) }) },
      { id: "odeme", ad: "Faturaya ödeme kaydet", aciklama: "Tutar ve ödeme türüyle", sirlar: FB, alanlar: [{ ad: "fatura", etiket: "Fatura kimliği", zorunlu: true }, { ad: "tutar", etiket: "Tutar", tur: "sayi", zorunlu: true }, { ad: "tur", etiket: "Ödeme türü", tur: "secim", secenekler: [{ id: "Credit Card", ad: "Kredi kartı" }, { id: "Bank Transfer", ad: "Banka havalesi" }, { id: "PayPal", ad: "PayPal" }, { id: "Cash", ad: "Nakit" }, { id: "Check", ad: "Çek" }, { id: "Other", ad: "Diğer" }], varsayilan: "Credit Card" }],
        istek: (g, s) => ({ yontem: "POST", url: fb(s, "/payments/payments"), basliklar: fbB(s), json: { payment: { invoiceid: Number(zorunlu(g, "fatura", "Fatura kimliği")), amount: { amount: String(tutarSay(g)) }, date: gun(""), type: t(g.tur) || "Credit Card" } } }), sonuc: ozetAl("response.result.payment.id") },
    ],
  },
  /* ───────── Ödeme ───────── */
  {
    id: "square", ad: "Square", logo: "/marka/baglanti/square.svg", kategori: "Ödeme", aciklama: "Müşteri, ödeme bağlantısı, ödeme, iade ve siparişler", belge: "https://developer.squareup.com/reference/square",
    sirlar: [{ ad: "SQUARE_ACCESS_TOKEN", etiket: "Erişim belirteci", nasil: "developer.squareup.com, Applications, uygulaman, Credentials; Production ya da Sandbox Access token." }, { ad: "SQUARE_KONUM", etiket: "Konum kimliği", nasil: "Locations sayfasındaki Location ID; ödeme bağlantısı ve sipariş listesi için.", istege: true }, { ad: "SQUARE_ORTAM", etiket: "Ortam", nasil: "Sandbox için test yaz; boşsa canlı.", istege: true }],
    eylemler: [
      { id: "musteri", ad: "Müşteri oluştur", aciklama: "Ad, e-posta ve telefon", sirlar: SQ, alanlar: [{ ad: "ad", etiket: "Ad" }, { ad: "soyad", etiket: "Soyad" }, { ad: "eposta", etiket: "E-posta" }, { ad: "telefon", etiket: "Telefon", yer: "+15551234567" }],
        istek: (g, s) => { if (!t(g.ad) && !t(g.soyad) && !t(g.eposta) && !t(g.telefon)) throw new Error("Ad, e-posta ya da telefondan en az birini yaz."); return { yontem: "POST", url: `${sqTaban(s)}/customers`, basliklar: sqB(s), json: dolu({ idempotency_key: rastgele(16), given_name: t(g.ad), family_name: t(g.soyad), email_address: t(g.eposta), phone_number: t(g.telefon) }) }; }, sonuc: ozetAl("customer.id") },
      { id: "musteri-ara", ad: "Müşteriyi e-postayla bul", aciklama: "Tam eşleşme", okuma: true, sirlar: SQ, alanlar: [{ ad: "eposta", etiket: "E-posta", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: `${sqTaban(s)}/customers/search`, basliklar: sqB(s), json: { limit: 10, query: { filter: { email_address: { exact: zorunlu(g, "eposta", "E-posta") } } } } }), sonuc: ozetAl("customers.0.id") },
      { id: "baglanti", ad: "Ödeme bağlantısı oluştur", aciklama: "Ad ve tutarla hızlı ödeme sayfası", sirlar: [...SQ, "SQUARE_KONUM"], alanlar: [{ ad: "ad", etiket: "Ürün ya da hizmet adı", zorunlu: true }, { ad: "tutar", etiket: "Tutar", tur: "sayi", zorunlu: true, yer: "49.90" }, PARA, { ad: "donus", etiket: "Ödeme sonrası dönüş adresi" }, { ad: "eposta", etiket: "Müşteri e-postası (isteğe bağlı)" }],
        istek: (g, s) => { const pb = para(g); return { yontem: "POST", url: `${sqTaban(s)}/online-checkout/payment-links`, basliklar: sqB(s), json: dolu({ idempotency_key: rastgele(16), quick_pay: { name: zorunlu(g, "ad", "Ad"), price_money: { amount: kucuk(tutarSay(g), pb), currency: pb }, location_id: s("SQUARE_KONUM") }, checkout_options: t(g.donus) ? { redirect_url: t(g.donus) } : undefined, pre_populated_data: t(g.eposta) ? { buyer_email: t(g.eposta) } : undefined }) }; }, sonuc: ozetAl("payment_link.url") },
      { id: "odeme", ad: "Ödemeyi getir", aciklama: "Durum, tutar ve kart bilgisi", okuma: true, sirlar: SQ, alanlar: [{ ad: "odeme", etiket: "Ödeme kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `${sqTaban(s)}/payments/${enc(zorunlu(g, "odeme", "Ödeme kimliği"))}`, basliklar: sqB(s) }), sonuc: ozetAl("payment.status") },
      { id: "iade", ad: "İade et", aciklama: "Ödemeye tam ya da kısmi iade", sirlar: SQ, alanlar: [{ ad: "odeme", etiket: "Ödeme kimliği", zorunlu: true }, { ad: "tutar", etiket: "Tutar", tur: "sayi", zorunlu: true }, PARA, { ad: "neden", etiket: "Neden" }],
        istek: (g, s) => { const pb = para(g); return { yontem: "POST", url: `${sqTaban(s)}/refunds`, basliklar: sqB(s), json: dolu({ idempotency_key: rastgele(16), payment_id: zorunlu(g, "odeme", "Ödeme kimliği"), amount_money: { amount: kucuk(tutarSay(g), pb), currency: pb }, reason: t(g.neden).slice(0, 192) }) }; }, sonuc: ozetAl("refund.status") },
      { id: "siparisler", ad: "Siparişleri listele", aciklama: "Konumdaki en yeni siparişler", okuma: true, sirlar: [...SQ, "SQUARE_KONUM"], alanlar: [{ ad: "durum", etiket: "Durum", tur: "secim", secenekler: [{ id: "OPEN", ad: "Açık" }, { id: "COMPLETED", ad: "Tamamlandı" }, { id: "CANCELED", ad: "İptal" }], varsayilan: "OPEN" }, { ad: "adet", etiket: "Kaç sipariş", tur: "sayi", varsayilan: "50" }],
        istek: (g, s) => ({ yontem: "POST", url: `${sqTaban(s)}/orders/search`, basliklar: sqB(s), json: { location_ids: [s("SQUARE_KONUM")], limit: tamsayi(g.adet, 50, 1, 500), query: { filter: { state_filter: { states: [t(g.durum) || "OPEN"] } }, sort: { sort_field: "CREATED_AT", sort_order: "DESC" } } } }) },
    ],
  },
  {
    id: "adyen", ad: "Adyen", logo: "/marka/uyg/adyen.svg", kategori: "Ödeme", aciklama: "Ödeme bağlantısı, tahsilat, iptal ve iade", belge: "https://docs.adyen.com/api-explorer/Checkout/latest/overview",
    sirlar: [{ ad: "ADYEN_API_KEY", etiket: "API anahtarı", nasil: "Customer Area, Developers, API credentials; Checkout yetkili web servis kullanıcısının API key değeri." }, { ad: "ADYEN_MERCHANT_ACCOUNT", etiket: "Üye işyeri hesabı", nasil: "Customer Area'daki merchant account adı." }, { ad: "ADYEN_CANLI_ONEK", etiket: "Canlı adres öneki", nasil: "Canlı ortamda Developers, API URLs sayfasındaki önek (ör. 1797a841fbb37ca7-AdyenDemo); boşsa test ortamı kullanılır.", istege: true }],
    eylemler: [
      { id: "baglanti", ad: "Ödeme bağlantısı oluştur", aciklama: "Paylaşılabilir ödeme sayfası", sirlar: AD, alanlar: [{ ad: "tutar", etiket: "Tutar", tur: "sayi", zorunlu: true }, PARA, { ad: "referans", etiket: "Referans", zorunlu: true, yer: "Sipariş numarası" }, { ad: "aciklama", etiket: "Açıklama" }, { ad: "eposta", etiket: "Müşteri e-postası" }, { ad: "ulke", etiket: "Ülke kodu", yer: "NL" }, { ad: "donus", etiket: "Dönüş adresi" }],
        istek: (g, s) => { const pb = para(g, "EUR"); return { yontem: "POST", url: `${adTaban(s)}/paymentLinks`, basliklar: adB(s), json: dolu({ merchantAccount: s("ADYEN_MERCHANT_ACCOUNT"), amount: { value: kucuk(tutarSay(g), pb), currency: pb }, reference: zorunlu(g, "referans", "Referans"), description: t(g.aciklama), shopperEmail: t(g.eposta), countryCode: t(g.ulke).toUpperCase(), returnUrl: t(g.donus) }) }; }, sonuc: ozetAl("url") },
      { id: "baglanti-getir", ad: "Ödeme bağlantısını getir", aciklama: "Durum: aktif, tamamlandı ya da süresi doldu", okuma: true, sirlar: ["ADYEN_API_KEY"], alanlar: [{ ad: "baglanti", etiket: "Bağlantı kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `${adTaban(s)}/paymentLinks/${enc(zorunlu(g, "baglanti", "Bağlantı kimliği"))}`, basliklar: adB(s) }), sonuc: ozetAl("status") },
      { id: "tahsil", ad: "Ödemeyi tahsil et", aciklama: "Yetkilendirilmiş ödemenin parasını çeker", sirlar: AD, alanlar: [{ ad: "psp", etiket: "PSP referansı", zorunlu: true }, { ad: "tutar", etiket: "Tutar", tur: "sayi", zorunlu: true }, PARA, { ad: "referans", etiket: "Referans" }],
        istek: (g, s) => { const pb = para(g, "EUR"); return { yontem: "POST", url: `${adTaban(s)}/payments/${enc(zorunlu(g, "psp", "PSP referansı"))}/captures`, basliklar: adB(s), json: dolu({ merchantAccount: s("ADYEN_MERCHANT_ACCOUNT"), amount: { value: kucuk(tutarSay(g), pb), currency: pb }, reference: t(g.referans) }) }; }, sonuc: ozetAl("status") },
      { id: "iptal", ad: "Ödemeyi iptal et", aciklama: "Tahsil edilmemiş yetkilendirmeyi kaldırır", sirlar: AD, alanlar: [{ ad: "psp", etiket: "PSP referansı", zorunlu: true }, { ad: "referans", etiket: "Referans" }],
        istek: (g, s) => ({ yontem: "POST", url: `${adTaban(s)}/payments/${enc(zorunlu(g, "psp", "PSP referansı"))}/cancels`, basliklar: adB(s), json: dolu({ merchantAccount: s("ADYEN_MERCHANT_ACCOUNT"), reference: t(g.referans) }) }), sonuc: ozetAl("status") },
      { id: "iade", ad: "İade et", aciklama: "Tahsil edilmiş ödemeye tam ya da kısmi iade", sirlar: AD, alanlar: [{ ad: "psp", etiket: "PSP referansı", zorunlu: true }, { ad: "tutar", etiket: "Tutar", tur: "sayi", zorunlu: true }, PARA, { ad: "referans", etiket: "Referans" }],
        istek: (g, s) => { const pb = para(g, "EUR"); return { yontem: "POST", url: `${adTaban(s)}/payments/${enc(zorunlu(g, "psp", "PSP referansı"))}/refunds`, basliklar: adB(s), json: dolu({ merchantAccount: s("ADYEN_MERCHANT_ACCOUNT"), amount: { value: kucuk(tutarSay(g), pb), currency: pb }, reference: t(g.referans) }) }; }, sonuc: ozetAl("status") },
    ],
  },
  {
    id: "mollie", ad: "Mollie", logo: "/marka/baglanti/mollie.png", kategori: "Ödeme", aciklama: "Ödeme, ödeme bağlantısı, müşteri ve iade", belge: "https://docs.mollie.com/reference/overview",
    sirlar: [{ ad: "MOLLIE_API_KEY", etiket: "API anahtarı", nasil: "Mollie panelinde Developers, API keys; live_ ya da test_ ile başlayan anahtar." }],
    eylemler: [
      { id: "odeme", ad: "Ödeme oluştur", aciklama: "Müşterinin ödeyeceği sayfa adresi döner", sirlar: ["MOLLIE_API_KEY"], alanlar: [{ ad: "tutar", etiket: "Tutar", tur: "sayi", zorunlu: true }, { ...PARA, yer: "EUR", varsayilan: "EUR" }, { ad: "aciklama", etiket: "Açıklama", zorunlu: true }, { ad: "donus", etiket: "Dönüş adresi", zorunlu: true, yer: "https://magazan.com/tesekkurler" }, { ad: "bildirim", etiket: "Bildirim adresi (web kancası)" }, { ad: "siparis", etiket: "Sipariş numarası (meta veri)" }],
        istek: (g, s) => { const pb = para(g, "EUR"); return { yontem: "POST", url: `${MO}/payments`, basliklar: moB(s), json: dolu({ amount: { currency: pb, value: ondalik(tutarSay(g), pb) }, description: zorunlu(g, "aciklama", "Açıklama").slice(0, 255), redirectUrl: zorunlu(g, "donus", "Dönüş adresi"), webhookUrl: t(g.bildirim), metadata: t(g.siparis) ? { siparis: t(g.siparis) } : undefined }) }; }, sonuc: ozetAl("_links.checkout.href") },
      { id: "odeme-getir", ad: "Ödemeyi getir", aciklama: "Durum: open, paid, failed, expired", okuma: true, sirlar: ["MOLLIE_API_KEY"], alanlar: [{ ad: "odeme", etiket: "Ödeme kimliği (tr_ ile başlar)", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `${MO}/payments/${enc(zorunlu(g, "odeme", "Ödeme kimliği"))}`, basliklar: moB(s) }), sonuc: ozetAl("status") },
      { id: "odemeler", ad: "Ödemeleri listele", aciklama: "En yeni ödemeler", okuma: true, sirlar: ["MOLLIE_API_KEY"], alanlar: [{ ad: "adet", etiket: "Kaç ödeme", tur: "sayi", varsayilan: "50" }],
        istek: (g, s) => ({ yontem: "GET", url: `${MO}/payments${sorgu({ limit: tamsayi(g.adet, 50, 1, 250) })}`, basliklar: moB(s) }) },
      { id: "baglanti", ad: "Ödeme bağlantısı oluştur", aciklama: "Süreli ya da süresiz paylaşılabilir bağlantı", sirlar: ["MOLLIE_API_KEY"], alanlar: [{ ad: "tutar", etiket: "Tutar", tur: "sayi", zorunlu: true }, { ...PARA, yer: "EUR", varsayilan: "EUR" }, { ad: "aciklama", etiket: "Açıklama", zorunlu: true }, { ad: "donus", etiket: "Dönüş adresi" }, { ad: "bitis", etiket: "Son geçerlilik günü", yer: "2026-12-31" }],
        istek: (g, s) => { const pb = para(g, "EUR"); return { yontem: "POST", url: `${MO}/payment-links`, basliklar: moB(s), json: dolu({ description: zorunlu(g, "aciklama", "Açıklama"), amount: { currency: pb, value: ondalik(tutarSay(g), pb) }, redirectUrl: t(g.donus), expiresAt: t(g.bitis) ? `${gun(g.bitis)}T23:59:59+00:00` : undefined }) }; }, sonuc: ozetAl("_links.paymentLink.href") },
      { id: "iade", ad: "İade et", aciklama: "Ödemeye tam ya da kısmi iade", sirlar: ["MOLLIE_API_KEY"], alanlar: [{ ad: "odeme", etiket: "Ödeme kimliği (tr_ ile başlar)", zorunlu: true }, { ad: "tutar", etiket: "Tutar", tur: "sayi", zorunlu: true }, { ...PARA, yer: "EUR", varsayilan: "EUR" }, { ad: "aciklama", etiket: "Açıklama" }],
        istek: (g, s) => { const pb = para(g, "EUR"); return { yontem: "POST", url: `${MO}/payments/${enc(zorunlu(g, "odeme", "Ödeme kimliği"))}/refunds`, basliklar: moB(s), json: dolu({ amount: { currency: pb, value: ondalik(tutarSay(g), pb) }, description: t(g.aciklama) }) }; }, sonuc: ozetAl("status") },
      { id: "musteri", ad: "Müşteri oluştur", aciklama: "Ad ve e-posta", sirlar: ["MOLLIE_API_KEY"], alanlar: [{ ad: "ad", etiket: "Ad soyad" }, { ad: "eposta", etiket: "E-posta" }],
        istek: (g, s) => ({ yontem: "POST", url: `${MO}/customers`, basliklar: moB(s), json: dolu({ name: t(g.ad), email: t(g.eposta) }) }), sonuc: ozetAl("id") },
    ],
  },
  {
    id: "razorpay", ad: "Razorpay", logo: "/marka/baglanti/razorpay.png", kategori: "Ödeme", aciklama: "Ödeme bağlantısı, sipariş, tahsilat ve iade", belge: "https://razorpay.com/docs/api/",
    sirlar: [{ ad: "RAZORPAY_KEY_ID", etiket: "Key ID", nasil: "Razorpay panelinde Account and Settings, API Keys; rzp_live_ ya da rzp_test_ ile başlar." }, { ad: "RAZORPAY_KEY_SECRET", etiket: "Key Secret", nasil: "Anahtar oluşturulurken bir kez gösterilen gizli değer." }],
    eylemler: [
      { id: "baglanti", ad: "Ödeme bağlantısı oluştur", aciklama: "SMS ve e-postayla müşteriye de gönderebilir", sirlar: RZS, alanlar: [{ ad: "tutar", etiket: "Tutar", tur: "sayi", zorunlu: true }, { ...PARA, yer: "INR", varsayilan: "INR" }, { ad: "aciklama", etiket: "Açıklama" }, { ad: "ad", etiket: "Müşteri adı" }, { ad: "eposta", etiket: "Müşteri e-postası" }, { ad: "telefon", etiket: "Müşteri telefonu", yer: "+919000090000" }, { ad: "bildir", etiket: "Müşteriye gönder", tur: "evet-hayir" }, { ad: "referans", etiket: "Referans", yer: "Sipariş numarası" }, { ad: "donus", etiket: "Dönüş adresi" }],
        istek: (g, s) => { const pb = para(g, "INR"); return { yontem: "POST", url: `${RZ}/payment_links`, basliklar: rzB(s), json: dolu({ amount: kucuk(tutarSay(g), pb), currency: pb, description: t(g.aciklama), customer: t(g.ad) || t(g.eposta) || t(g.telefon) ? dolu({ name: t(g.ad), email: t(g.eposta), contact: t(g.telefon) }) : undefined, notify: { sms: evet(g.bildir) && !!t(g.telefon), email: evet(g.bildir) && !!t(g.eposta) }, reference_id: t(g.referans), callback_url: t(g.donus), callback_method: t(g.donus) ? "get" : undefined }) }; }, sonuc: ozetAl("short_url") },
      { id: "siparis", ad: "Sipariş oluştur", aciklama: "Ödeme formu için sipariş kimliği", sirlar: RZS, alanlar: [{ ad: "tutar", etiket: "Tutar", tur: "sayi", zorunlu: true }, { ...PARA, yer: "INR", varsayilan: "INR" }, { ad: "makbuz", etiket: "Makbuz numarası", yer: "Sipariş numarası" }],
        istek: (g, s) => { const pb = para(g, "INR"); return { yontem: "POST", url: `${RZ}/orders`, basliklar: rzB(s), json: dolu({ amount: kucuk(tutarSay(g), pb), currency: pb, receipt: t(g.makbuz).slice(0, 40) }) }; }, sonuc: ozetAl("id") },
      { id: "odeme", ad: "Ödemeyi getir", aciklama: "Durum, yöntem ve tutar", okuma: true, sirlar: RZS, alanlar: [{ ad: "odeme", etiket: "Ödeme kimliği (pay_ ile başlar)", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `${RZ}/payments/${enc(zorunlu(g, "odeme", "Ödeme kimliği"))}`, basliklar: rzB(s) }), sonuc: ozetAl("status") },
      { id: "odemeler", ad: "Ödemeleri listele", aciklama: "En yeni ödemeler", okuma: true, sirlar: RZS, alanlar: [{ ad: "adet", etiket: "Kaç ödeme", tur: "sayi", varsayilan: "50" }],
        istek: (g, s) => ({ yontem: "GET", url: `${RZ}/payments${sorgu({ count: tamsayi(g.adet, 50, 1, 100) })}`, basliklar: rzB(s) }) },
      { id: "tahsil", ad: "Ödemeyi tahsil et", aciklama: "Yetkilendirilmiş ödemeyi çeker", sirlar: RZS, alanlar: [{ ad: "odeme", etiket: "Ödeme kimliği", zorunlu: true }, { ad: "tutar", etiket: "Tutar", tur: "sayi", zorunlu: true }, { ...PARA, yer: "INR", varsayilan: "INR" }],
        istek: (g, s) => { const pb = para(g, "INR"); return { yontem: "POST", url: `${RZ}/payments/${enc(zorunlu(g, "odeme", "Ödeme kimliği"))}/capture`, basliklar: rzB(s), json: { amount: kucuk(tutarSay(g), pb), currency: pb } }; }, sonuc: ozetAl("status") },
      { id: "iade", ad: "İade et", aciklama: "Tutar boşsa tamamı iade edilir", sirlar: RZS, alanlar: [{ ad: "odeme", etiket: "Ödeme kimliği", zorunlu: true }, { ad: "tutar", etiket: "Tutar (boşsa tamamı)", tur: "sayi" }, { ...PARA, yer: "INR", varsayilan: "INR" }, { ad: "hiz", etiket: "Hız", tur: "secim", secenekler: [{ id: "normal", ad: "Normal" }, { id: "optimum", ad: "Mümkünse anında" }], varsayilan: "normal" }],
        istek: (g, s) => ({ yontem: "POST", url: `${RZ}/payments/${enc(zorunlu(g, "odeme", "Ödeme kimliği"))}/refund`, basliklar: rzB(s), json: dolu({ amount: t(g.tutar) ? kucuk(tutarSay(g), para(g, "INR")) : undefined, speed: t(g.hiz) === "optimum" ? "optimum" : "normal" }) }), sonuc: ozetAl("status") },
    ],
  },
  /* ───────── E-ticaret ───────── */
  {
    id: "bigcommerce", ad: "BigCommerce", logo: "/marka/uyg/bigcommerce.svg", kategori: "E-ticaret", aciklama: "Siparişler, durum, gönderi, stok ve müşteriler", belge: "https://developer.bigcommerce.com/docs/rest-management/orders",
    sirlar: [{ ad: "BIGCOMMERCE_MAGAZA", etiket: "Mağaza kodu (store hash)", nasil: "API yolundaki stores/ sonrası kod; Settings, API, Store-level API accounts sayfasında görünür." }, { ad: "BIGCOMMERCE_TOKEN", etiket: "Erişim belirteci", nasil: "Store-level API account oluştururken verilen Access token (Orders ve Products yazma izinli)." }],
    eylemler: [
      { id: "siparisler", ad: "Siparişleri listele", aciklama: "Duruma göre en yeniler", okuma: true, sirlar: BC, alanlar: [{ ad: "durum", etiket: "Durum", tur: "secim", secenekler: [{ id: "", ad: "Hepsi" }, ...BC_DURUM], varsayilan: "11" }, { ad: "adet", etiket: "Kaç sipariş", tur: "sayi", varsayilan: "50" }],
        istek: (g, s) => ({ yontem: "GET", url: bc(s, `/v2/orders${sorgu({ status_id: t(g.durum), limit: tamsayi(g.adet, 50, 1, 250), sort: "date_created:desc" })}`), basliklar: bcB(s) }) },
      { id: "siparis", ad: "Siparişi getir", aciklama: "Tutar, müşteri ve adres", okuma: true, sirlar: BC, alanlar: [{ ad: "siparis", etiket: "Sipariş numarası", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: bc(s, `/v2/orders/${enc(zorunlu(g, "siparis", "Sipariş numarası"))}`), basliklar: bcB(s) }), sonuc: ozetAl("status") },
      { id: "durum", ad: "Sipariş durumunu değiştir", aciklama: "Gönderildi, tamamlandı ya da iptal", sirlar: BC, alanlar: [{ ad: "siparis", etiket: "Sipariş numarası", zorunlu: true }, { ad: "durum", etiket: "Yeni durum", tur: "secim", secenekler: BC_DURUM, varsayilan: "2" }],
        istek: (g, s) => ({ yontem: "PUT", url: bc(s, `/v2/orders/${enc(zorunlu(g, "siparis", "Sipariş numarası"))}`), basliklar: bcB(s), json: { status_id: Number(t(g.durum) || 2) } }), sonuc: ozetAl("status") },
      { id: "gonderi", ad: "Gönderi oluştur", aciklama: "Siparişin bütün ürünlerini takip numarasıyla gönderir", sirlar: BC, alanlar: [{ ad: "siparis", etiket: "Sipariş numarası", zorunlu: true }, { ad: "takip", etiket: "Takip numarası", zorunlu: true }, { ad: "firma", etiket: "Kargo firması", yer: "ups, fedex, usps, dhl" }, { ad: "yontem", etiket: "Gönderim yöntemi", yer: "Ground" }],
        istek: (g, s) => ({ yontem: "GET", url: bc(s, `/v2/orders/${enc(zorunlu(g, "siparis", "Sipariş numarası"))}/products`), basliklar: bcB(s) }),
        devam: (y, g, s) => { const l = (Array.isArray(y) ? y : []) as { id: number; quantity: number; order_address_id: number }[]; if (!l.length) throw new Error("Siparişte gönderilecek ürün bulunamadı."); return { yontem: "POST", url: bc(s, `/v2/orders/${enc(t(g.siparis))}/shipments`), basliklar: bcB(s), json: dolu({ order_address_id: l[0].order_address_id, tracking_number: zorunlu(g, "takip", "Takip numarası"), shipping_provider: t(g.firma).toLowerCase(), shipping_method: t(g.yontem), items: l.map((x) => ({ order_product_id: x.id, quantity: x.quantity })) }) }; }, sonuc: ozetAl("id") },
      { id: "stok", ad: "Ürün stoğunu güncelle", aciklama: "Ürün düzeyinde stok takibi açılır", sirlar: BC, alanlar: [{ ad: "urun", etiket: "Ürün kimliği", zorunlu: true }, { ad: "adet", etiket: "Stok adedi", tur: "sayi", zorunlu: true }, { ad: "fiyat", etiket: "Fiyat (isteğe bağlı)", tur: "sayi" }],
        istek: (g, s) => ({ yontem: "PUT", url: bc(s, `/v3/catalog/products/${enc(zorunlu(g, "urun", "Ürün kimliği"))}`), basliklar: bcB(s), json: dolu({ inventory_tracking: "product", inventory_level: tamsayi(g.adet, 0, 0, 1e7), price: t(g.fiyat) ? sayi(g.fiyat, 0, 0, 1e9) : undefined }) }), sonuc: ozetAl("data.inventory_level") },
      { id: "musteri", ad: "Müşteri oluştur", aciklama: "E-posta, ad ve soyad", sirlar: BC, alanlar: [{ ad: "eposta", etiket: "E-posta", zorunlu: true }, { ad: "ad", etiket: "Ad", zorunlu: true }, { ad: "soyad", etiket: "Soyad", zorunlu: true }, { ad: "telefon", etiket: "Telefon" }],
        istek: (g, s) => ({ yontem: "POST", url: bc(s, "/v3/customers"), basliklar: bcB(s), json: [dolu({ email: zorunlu(g, "eposta", "E-posta"), first_name: zorunlu(g, "ad", "Ad"), last_name: zorunlu(g, "soyad", "Soyad"), phone: t(g.telefon) })] }), sonuc: ozetAl("data.0.id") },
    ],
  },
  {
    id: "etsy", ad: "Etsy", logo: "/marka/uyg/etsy.svg", kategori: "E-ticaret", aciklama: "Siparişler, takip numarası, ürünler ve yorumlar", belge: "https://developers.etsy.com/documentation/reference",
    sirlar: [
      { ad: "ETSY_API_KEY", etiket: "Keystring", nasil: "etsy.com/developers/your-apps, uygulamanın keystring değeri." },
      { ad: "ETSY_SHARED_SECRET", etiket: "Shared secret", nasil: "Aynı uygulamanın shared secret değeri." },
      { ad: "ETSY_REFRESH_TOKEN", etiket: "Yenileme belirteci", nasil: "transactions_r transactions_w listings_r kapsamlarıyla OAuth (PKCE) sonucu alınan refresh_token; yenilendikçe güncellenir." },
      { ad: "ETSY_MAGAZA", etiket: "Mağaza kimliği (shop_id)", nasil: "https://api.etsy.com/v3/application/users/me yanıtındaki shop_id." },
    ],
    kimlik: yenilemeKimlik({ ad: "Etsy", deger: "_ETSY_ERISIM", sirlar: ["ETSY_API_KEY", "ETSY_SHARED_SECRET", "ETSY_REFRESH_TOKEN"], istek: (s) => ({ yontem: "POST", url: "https://api.etsy.com/v3/public/oauth/token", form: { grant_type: "refresh_token", client_id: s("ETSY_API_KEY"), refresh_token: s("ETSY_REFRESH_TOKEN") } }) }),
    eylemler: [
      { id: "siparisler", ad: "Siparişleri listele", aciklama: "Ödenmiş, gönderilmemiş siparişler (receipts)", okuma: true, sirlar: [...ETS, "ETSY_API_KEY"], alanlar: [{ ad: "gonderildi", etiket: "Gönderilenler de gelsin", tur: "evet-hayir" }, { ad: "adet", etiket: "Kaç sipariş", tur: "sayi", varsayilan: "25" }],
        istek: (g, s) => ({ yontem: "GET", url: `${etMagaza(s)}/receipts${sorgu({ was_paid: "true", was_shipped: evet(g.gonderildi) ? undefined : "false", limit: tamsayi(g.adet, 25, 1, 100), sort_on: "created", sort_order: "desc" })}`, basliklar: etB(s) }) },
      { id: "siparis", ad: "Siparişi getir", aciklama: "Alıcı, adres ve kalemler", okuma: true, sirlar: [...ETS, "ETSY_API_KEY"], alanlar: [{ ad: "siparis", etiket: "Sipariş kimliği (receipt_id)", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `${etMagaza(s)}/receipts/${enc(zorunlu(g, "siparis", "Sipariş kimliği"))}`, basliklar: etB(s) }), sonuc: ozetAl("status") },
      { id: "takip", ad: "Takip numarası ekle", aciklama: "Siparişi gönderildi yapar, alıcıya bildirir", sirlar: [...ETS, "ETSY_API_KEY"], alanlar: [{ ad: "siparis", etiket: "Sipariş kimliği (receipt_id)", zorunlu: true }, { ad: "takip", etiket: "Takip numarası", zorunlu: true }, { ad: "firma", etiket: "Kargo firması", zorunlu: true, yer: "usps, ups, fedex, dhl" }],
        istek: (g, s) => ({ yontem: "POST", url: `${etMagaza(s)}/receipts/${enc(zorunlu(g, "siparis", "Sipariş kimliği"))}/tracking`, basliklar: etB(s), form: { tracking_code: zorunlu(g, "takip", "Takip numarası"), carrier_name: zorunlu(g, "firma", "Kargo firması") } }), sonuc: ozetAl("status") },
      { id: "urunler", ad: "Ürünleri listele", aciklama: "Duruma göre ilanlar", okuma: true, sirlar: [...ETS, "ETSY_API_KEY"], alanlar: [{ ad: "durum", etiket: "Durum", tur: "secim", secenekler: [{ id: "active", ad: "Yayında" }, { id: "inactive", ad: "Pasif" }, { id: "sold_out", ad: "Tükendi" }, { id: "draft", ad: "Taslak" }], varsayilan: "active" }],
        istek: (g, s) => ({ yontem: "GET", url: `${etMagaza(s)}/listings${sorgu({ state: t(g.durum) || "active", limit: 100 })}`, basliklar: etB(s) }) },
      { id: "yorumlar", ad: "Yorumları listele", aciklama: "Mağazanın son yorumları", okuma: true, sirlar: [...ETS, "ETSY_API_KEY"], alanlar: [{ ad: "adet", etiket: "Kaç yorum", tur: "sayi", varsayilan: "25" }],
        istek: (g, s) => ({ yontem: "GET", url: `${etMagaza(s)}/reviews${sorgu({ limit: tamsayi(g.adet, 25, 1, 100) })}`, basliklar: etB(s) }) },
    ],
  },
  {
    id: "amazon-sp", ad: "Amazon Seller", logo: "/marka/baglanti/amazon-selling-partner.png", kategori: "E-ticaret", aciklama: "Siparişler, FBA stoğu ve ilan stoğu (Selling Partner API)", belge: "https://developer-docs.amazon.com/sp-api/docs/orders-api",
    sirlar: [
      { ad: "AMAZON_CLIENT_ID", etiket: "LWA Client ID", nasil: "Seller Central, Develop Apps, uygulaman, LWA credentials." },
      { ad: "AMAZON_CLIENT_SECRET", etiket: "LWA Client Secret", nasil: "Aynı yerdeki Client Secret." },
      { ad: "AMAZON_REFRESH_TOKEN", etiket: "Yenileme belirteci", nasil: "Uygulamayı kendi mağazana yetkilendirince verilen Atzr| ile başlayan refresh token." },
      { ad: "AMAZON_PAZAR", etiket: "Pazar yeri kimliği", nasil: "ABD ATVPDKIKX0DER, Birleşik Krallık A1F83G8C2ARO7P, Almanya A1PA6795UKMFR9, Türkiye A33AVAJ2PDY3EV gibi." },
      { ad: "AMAZON_BOLGE", etiket: "Bölge", nasil: "Kuzey Amerika için na, Avrupa ve Türkiye için eu, Uzak Doğu için fe; boşsa eu.", istege: true },
      { ad: "AMAZON_SATICI", etiket: "Satıcı kimliği", nasil: "Seller Central, Hesap bilgileri, Merchant Token; yalnız ilan stoğu için.", istege: true },
    ],
    kimlik: yenilemeKimlik({ ad: "Amazon", deger: "_AMAZON_ERISIM", sirlar: ["AMAZON_CLIENT_ID", "AMAZON_CLIENT_SECRET", "AMAZON_REFRESH_TOKEN"], istek: (s) => ({ yontem: "POST", url: "https://api.amazon.com/auth/o2/token", form: { grant_type: "refresh_token", refresh_token: s("AMAZON_REFRESH_TOKEN"), client_id: s("AMAZON_CLIENT_ID"), client_secret: s("AMAZON_CLIENT_SECRET") } }) }),
    eylemler: [
      { id: "siparisler", ad: "Siparişleri listele", aciklama: "Son günlerin siparişleri, karşılanma durumuna göre", okuma: true, sirlar: AM, alanlar: [{ ad: "gun", etiket: "Kaç günlük", tur: "sayi", varsayilan: "2" }, { ad: "durum", etiket: "Durum", tur: "secim", secenekler: [{ id: "", ad: "Hepsi" }, { id: "UNSHIPPED", ad: "Gönderilmedi" }, { id: "PARTIALLY_SHIPPED", ad: "Kısmen gönderildi" }, { id: "SHIPPED", ad: "Gönderildi" }, { id: "PENDING", ad: "Beklemede" }, { id: "CANCELLED", ad: "İptal" }], varsayilan: "UNSHIPPED" }, AM_VERI, { ad: "adet", etiket: "Kaç sipariş", tur: "sayi", varsayilan: "50" }],
        istek: (g, s) => ({ yontem: "GET", url: `${amTaban(s)}/orders/2026-01-01/orders${sorgu({ marketplaceIds: s("AMAZON_PAZAR"), createdAfter: new Date(Date.now() - sayi(g.gun, 2, 0.01, 180) * 86_400_000).toISOString(), fulfillmentStatuses: t(g.durum), includedData: amVeri(g), maxResultsPerPage: tamsayi(g.adet, 50, 1, 100) })}`, basliklar: amB(s) }) },
      { id: "siparis", ad: "Siparişi getir", aciklama: "Kalemler, gönderim ve tutarlar", okuma: true, sirlar: ["_AMAZON_ERISIM"], alanlar: [{ ad: "siparis", etiket: "Amazon sipariş numarası", zorunlu: true, yer: "123-1234567-1234567" }, AM_VERI],
        istek: (g, s) => ({ yontem: "GET", url: `${amTaban(s)}/orders/2026-01-01/orders/${enc(zorunlu(g, "siparis", "Sipariş numarası"))}${sorgu({ includedData: amVeri(g) })}`, basliklar: amB(s) }) },
      { id: "fba-stok", ad: "FBA stoğunu getir", aciklama: "Amazon depolarındaki satılabilir adet", okuma: true, sirlar: AM, alanlar: [{ ad: "sku", etiket: "SKU listesi (virgülle, boşsa hepsi)" }],
        istek: (g, s) => ({ yontem: "GET", url: `${amTaban(s)}/fba/inventory/v1/summaries${sorgu({ details: "true", granularityType: "Marketplace", granularityId: s("AMAZON_PAZAR"), marketplaceIds: s("AMAZON_PAZAR"), sellerSkus: virgul(g.sku).slice(0, 50).join(",") })}`, basliklar: amB(s) }), sonuc: ozetAl("payload.inventorySummaries.0.inventoryDetails.fulfillableQuantity") },
      { id: "stok", ad: "İlan stoğunu güncelle", aciklama: "Satıcı gönderimli (FBM) ilanın adedi", sirlar: [...AM, "AMAZON_SATICI"], alanlar: [{ ad: "sku", etiket: "SKU", zorunlu: true }, { ad: "adet", etiket: "Adet", tur: "sayi", zorunlu: true }, { ad: "tur", etiket: "Ürün türü (productType)", zorunlu: true, yer: "SHIRT" }],
        istek: (g, s) => ({ yontem: "PATCH", url: `${amTaban(s)}/listings/2021-08-01/items/${enc(s("AMAZON_SATICI"))}/${enc(zorunlu(g, "sku", "SKU"))}${sorgu({ marketplaceIds: s("AMAZON_PAZAR") })}`, basliklar: amB(s), json: { productType: zorunlu(g, "tur", "Ürün türü"), patches: [{ op: "replace", path: "/attributes/fulfillment_availability", value: [{ fulfillment_channel_code: "DEFAULT", quantity: tamsayi(g.adet, 0, 0, 1e6) }] }] } }), sonuc: ozetAl("status") },
    ],
  },
  {
    id: "ebay", ad: "eBay", logo: "/marka/uyg/ebay.svg", kategori: "E-ticaret", aciklama: "Siparişler, gönderim, iade ve stok", belge: "https://developer.ebay.com/api-docs/sell/fulfillment/overview.html",
    sirlar: [
      { ad: "EBAY_CLIENT_ID", etiket: "App ID (Client ID)", nasil: "developer.ebay.com, Application Keys; Production ya da Sandbox App ID." },
      { ad: "EBAY_CLIENT_SECRET", etiket: "Cert ID (Client Secret)", nasil: "Aynı anahtar setindeki Cert ID." },
      { ad: "EBAY_REFRESH_TOKEN", etiket: "Kullanıcı yenileme belirteci", nasil: "sell.fulfillment ve sell.inventory kapsamlarıyla kullanıcı yetkisinden alınan refresh token (18 ay geçerli)." },
      { ad: "EBAY_ORTAM", etiket: "Ortam", nasil: "Sandbox için test yaz; boşsa canlı.", istege: true },
    ],
    kimlik: yenilemeKimlik({ ad: "eBay", deger: "_EBAY_ERISIM", sirlar: ["EBAY_CLIENT_ID", "EBAY_CLIENT_SECRET", "EBAY_REFRESH_TOKEN"], istek: (s) => ({ yontem: "POST", url: `${ebTaban(s)}/identity/v1/oauth2/token`, basliklar: { Authorization: temel(s("EBAY_CLIENT_ID"), s("EBAY_CLIENT_SECRET")) }, form: { grant_type: "refresh_token", refresh_token: s("EBAY_REFRESH_TOKEN") } }) }),
    eylemler: [
      { id: "siparisler", ad: "Siparişleri listele", aciklama: "Gönderilmeyi bekleyen ya da bütün siparişler", okuma: true, sirlar: EB, alanlar: [{ ad: "bekleyen", etiket: "Yalnız gönderilmeyi bekleyenler", tur: "evet-hayir", varsayilan: "true" }, { ad: "adet", etiket: "Kaç sipariş", tur: "sayi", varsayilan: "50" }],
        istek: (g, s) => ({ yontem: "GET", url: `${ebTaban(s)}/sell/fulfillment/v1/order${sorgu({ filter: evet(g.bekleyen) ? "orderfulfillmentstatus:{NOT_STARTED|IN_PROGRESS}" : undefined, limit: tamsayi(g.adet, 50, 1, 200) })}`, basliklar: ebB(s) }) },
      { id: "siparis", ad: "Siparişi getir", aciklama: "Alıcı, kalemler ve tutar", okuma: true, sirlar: EB, alanlar: [{ ad: "siparis", etiket: "Sipariş kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `${ebTaban(s)}/sell/fulfillment/v1/order/${enc(zorunlu(g, "siparis", "Sipariş kimliği"))}`, basliklar: ebB(s) }), sonuc: ozetAl("orderFulfillmentStatus") },
      { id: "gonderi", ad: "Gönderildi yap ve takip ekle", aciklama: "Siparişin bütün kalemleri için", sirlar: EB, alanlar: [{ ad: "siparis", etiket: "Sipariş kimliği", zorunlu: true }, { ad: "takip", etiket: "Takip numarası", zorunlu: true }, { ad: "firma", etiket: "Kargo firması kodu", zorunlu: true, yer: "USPS, UPS, FEDEX, DHL" }],
        istek: (g, s) => ({ yontem: "GET", url: `${ebTaban(s)}/sell/fulfillment/v1/order/${enc(zorunlu(g, "siparis", "Sipariş kimliği"))}`, basliklar: ebB(s) }),
        devam: (y, g, s) => { const l = ((y as { lineItems?: { lineItemId: string; quantity: number }[] })?.lineItems ?? []); if (!l.length) throw new Error("Siparişte kalem bulunamadı."); return { yontem: "POST", url: `${ebTaban(s)}/sell/fulfillment/v1/order/${enc(t(g.siparis))}/shipping_fulfillment`, basliklar: ebB(s), json: { lineItems: l.map((x) => ({ lineItemId: x.lineItemId, quantity: x.quantity })), shippedDate: new Date().toISOString(), shippingCarrierCode: zorunlu(g, "firma", "Kargo firması").toUpperCase(), trackingNumber: zorunlu(g, "takip", "Takip numarası") } }; } },
      { id: "iade", ad: "İade et", aciklama: "Sipariş düzeyinde tam ya da kısmi iade", sirlar: EB, alanlar: [{ ad: "siparis", etiket: "Sipariş kimliği", zorunlu: true }, { ad: "tutar", etiket: "Tutar", tur: "sayi", zorunlu: true }, PARA, { ad: "neden", etiket: "Neden", tur: "secim", secenekler: [{ id: "BUYER_RETURN", ad: "Alıcı iade etti" }, { id: "BUYER_CANCEL", ad: "Alıcı iptal etti" }, { id: "ITEM_NOT_RECEIVED", ad: "Ürün ulaşmadı" }, { id: "OTHER_ADJUSTMENT", ad: "Diğer" }], varsayilan: "BUYER_RETURN" }, { ad: "not", etiket: "Not" }],
        istek: (g, s) => { const pb = para(g); return { yontem: "POST", url: `${ebTaban(s)}/sell/fulfillment/v1/order/${enc(zorunlu(g, "siparis", "Sipariş kimliği"))}/issue_refund`, basliklar: ebB(s), json: dolu({ reasonForRefund: t(g.neden) || "BUYER_RETURN", comment: t(g.not).slice(0, 100), orderLevelRefundAmount: { value: ondalik(tutarSay(g), pb), currency: pb } }) }; }, sonuc: ozetAl("refundStatus") },
      { id: "stok", ad: "Stok ve fiyat güncelle", aciklama: "SKU'nun satılabilir adedi ve isteğe bağlı fiyatı", sirlar: EB, alanlar: [{ ad: "sku", etiket: "SKU", zorunlu: true }, { ad: "adet", etiket: "Adet", tur: "sayi", zorunlu: true }, { ad: "teklif", etiket: "Teklif kimliği (fiyat için)" }, { ad: "fiyat", etiket: "Fiyat", tur: "sayi" }, PARA],
        istek: (g, s) => ({ yontem: "POST", url: `${ebTaban(s)}/sell/inventory/v1/bulk_update_price_quantity`, basliklar: ebB(s), json: { requests: [dolu({ sku: zorunlu(g, "sku", "SKU"), shipToLocationAvailability: { quantity: tamsayi(g.adet, 0, 0, 1e6) }, offers: t(g.teklif) && t(g.fiyat) ? [{ offerId: t(g.teklif), availableQuantity: tamsayi(g.adet, 0, 0, 1e6), price: { value: ondalik(sayi(g.fiyat, 0, 0, 1e9), para(g)), currency: para(g) } }] : undefined })] } }), sonuc: ozetAl("responses.0.statusCode") },
    ],
  },
];
void m;
