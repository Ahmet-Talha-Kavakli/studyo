import { dolu, enc, evet, liste, m, nesne, ozetAl, sayi, siteKoku, sorgu, t, tamsayi, temel, zorunlu, type Sirlar, type UygIstek, type Uygulama } from "./sistemUygulamaOrtak";

/**
 * Uluslararası e-ticaret ve ödeme servisleri. Kaynaklar: shopify.dev (Admin REST 2026-10), woocommerce.github.io
 * (REST v3), docs.stripe.com/api, developer.paypal.com (Orders v2, OAuth istemci kimliği), docs.lemonsqueezy.com,
 * developer.paddle.com (Billing API).
 */
const SHOPIFY_SURUM = "2026-10";
const shop = (s: Sirlar, yol: string) => `https://${s("SHOPIFY_MAGAZA").replace(/\.myshopify\.com.*$/, "").replace(/^https?:\/\//, "").replace(/[^\w-]/g, "")}.myshopify.com/admin/api/${SHOPIFY_SURUM}${yol}`;
const shopB = (s: Sirlar) => ({ "X-Shopify-Access-Token": s("SHOPIFY_TOKEN") });
const SH = ["SHOPIFY_MAGAZA", "SHOPIFY_TOKEN"];
const woo = (s: Sirlar, yol: string) => `${siteKoku(s("WOO_SITE"))}/wp-json/wc/v3${yol}`;
const wooB = (s: Sirlar) => ({ Authorization: temel(s("WOO_KEY"), s("WOO_SECRET")) });
const WO = ["WOO_SITE", "WOO_KEY", "WOO_SECRET"];
const stp = (s: Sirlar) => ({ Authorization: `Bearer ${s("STRIPE_SECRET_KEY")}` });
const ppTaban = (s: Sirlar) => (s("PAYPAL_ORTAM") === "test" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com");
const ppB = (s: Sirlar) => ({ Authorization: `Bearer ${s("_PAYPAL_ERISIM")}` });
const tutar = (v: unknown) => sayi(v, 0, 0, 1e9).toFixed(2);
const lsB = (s: Sirlar) => ({ Authorization: `Bearer ${s("LEMONSQUEEZY_API_KEY")}`, Accept: "application/vnd.api+json" });
const pdTaban = (s: Sirlar) => (s("PADDLE_ORTAM") === "test" ? "https://sandbox-api.paddle.com" : "https://api.paddle.com");
const pdB = (s: Sirlar) => ({ Authorization: `Bearer ${s("PADDLE_API_KEY")}` });
const DURUM_WOO = ["pending", "processing", "on-hold", "completed", "cancelled", "refunded", "failed"].map((x) => ({ id: x, ad: { pending: "Ödeme bekliyor", processing: "Hazırlanıyor", "on-hold": "Beklemede", completed: "Tamamlandı", cancelled: "İptal", refunded: "İade", failed: "Başarısız" }[x]! }));

export const UYG_TICARET: Uygulama[] = [
  {
    id: "shopify", ad: "Shopify", logo: "/marka/baglanti/shopify.svg", kategori: "E-ticaret", aciklama: "Siparişler, gönderim, stok ve müşteriler", belge: "https://shopify.dev/docs/api/admin-rest",
    sirlar: [{ ad: "SHOPIFY_MAGAZA", etiket: "Mağaza adı", nasil: "magazan.myshopify.com adresindeki magazan kısmı." }, { ad: "SHOPIFY_TOKEN", etiket: "Admin API belirteci", nasil: "Shopify yönetiminde Ayarlar, Uygulamalar, Özel uygulama; shpat_ ile başlayan belirteç." }],
    eylemler: [
      { id: "siparisler", ad: "Siparişleri listele", aciklama: "Son 60 günün siparişleri, duruma göre", okuma: true, sirlar: SH, alanlar: [{ ad: "durum", etiket: "Durum", tur: "secim", secenekler: [{ id: "any", ad: "Hepsi" }, { id: "open", ad: "Açık" }, { id: "closed", ad: "Kapalı" }, { id: "cancelled", ad: "İptal" }], varsayilan: "any" }, { ad: "adet", etiket: "Kaç sipariş", tur: "sayi", varsayilan: "50", yer: "50" }],
        istek: (g, s) => ({ yontem: "GET", url: shop(s, `/orders.json${sorgu({ status: t(g.durum) || "any", limit: tamsayi(g.adet, 50, 1, 250) })}`), basliklar: shopB(s) }) },
      { id: "siparis", ad: "Siparişi getir", aciklama: "Kimlikle siparişin tamamı", okuma: true, sirlar: SH, alanlar: [{ ad: "siparis", etiket: "Sipariş kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: shop(s, `/orders/${enc(zorunlu(g, "siparis", "Sipariş kimliği"))}.json`), basliklar: shopB(s) }) },
      { id: "not", ad: "Siparişe not yaz", aciklama: "Siparişin not alanını günceller", sirlar: SH, alanlar: [{ ad: "siparis", etiket: "Sipariş kimliği", zorunlu: true }, { ad: "not", etiket: "Not", tur: "uzunMetin", zorunlu: true }],
        istek: (g, s) => ({ yontem: "PUT", url: shop(s, `/orders/${enc(zorunlu(g, "siparis", "Sipariş kimliği"))}.json`), basliklar: shopB(s), json: { order: { id: Number(g.siparis), note: zorunlu(g, "not", "Not") } } }) },
      { id: "gonderim-emirleri", ad: "Gönderim emirlerini getir", aciklama: "Siparişin fulfillment order kimlikleri", okuma: true, sirlar: SH, alanlar: [{ ad: "siparis", etiket: "Sipariş kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: shop(s, `/orders/${enc(zorunlu(g, "siparis", "Sipariş kimliği"))}/fulfillment_orders.json`), basliklar: shopB(s) }) },
      { id: "gonder", ad: "Gönderim oluştur", aciklama: "Takip numarasıyla siparişi gönderildi yap", sirlar: SH, alanlar: [{ ad: "emir", etiket: "Gönderim emri kimliği", zorunlu: true, yer: "/ ile önceki adımdaki fulfillment_orders.0.id" }, { ad: "takip", etiket: "Takip numarası" }, { ad: "firma", etiket: "Kargo firması", yer: "Yurtiçi Kargo" }, { ad: "adres", etiket: "Takip adresi" }, { ad: "bildir", etiket: "Müşteriye bildir", tur: "evet-hayir" }],
        istek: (g, s) => ({ yontem: "POST", url: shop(s, "/fulfillments.json"), basliklar: shopB(s), json: { fulfillment: dolu({ notify_customer: evet(g.bildir), tracking_info: t(g.takip) ? dolu({ number: t(g.takip), company: t(g.firma), url: t(g.adres) }) : undefined, line_items_by_fulfillment_order: [{ fulfillment_order_id: Number(zorunlu(g, "emir", "Gönderim emri")) }] }) } }) },
      { id: "stok", ad: "Stok adedini ayarla", aciklama: "Bir konumdaki ürün stoğu", sirlar: SH, alanlar: [{ ad: "konum", etiket: "Konum kimliği", zorunlu: true }, { ad: "kalem", etiket: "Stok kalemi kimliği (inventory_item_id)", zorunlu: true }, { ad: "adet", etiket: "Adet", tur: "sayi", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: shop(s, "/inventory_levels/set.json"), basliklar: shopB(s), json: { location_id: Number(zorunlu(g, "konum", "Konum")), inventory_item_id: Number(zorunlu(g, "kalem", "Stok kalemi")), available: tamsayi(g.adet, 0, -1e6, 1e7) } }) },
      { id: "musteri", ad: "Müşteri oluştur", aciklama: "Ad, e-posta ve telefon", sirlar: SH, alanlar: [{ ad: "eposta", etiket: "E-posta", zorunlu: true }, { ad: "ad", etiket: "Ad" }, { ad: "soyad", etiket: "Soyad" }, { ad: "telefon", etiket: "Telefon", yer: "+905321234567" }, { ad: "etiketler", etiket: "Etiketler (virgülle)" }],
        istek: (g, s) => ({ yontem: "POST", url: shop(s, "/customers.json"), basliklar: shopB(s), json: { customer: dolu({ email: zorunlu(g, "eposta", "E-posta"), first_name: t(g.ad), last_name: t(g.soyad), phone: t(g.telefon), tags: t(g.etiketler) }) } }), sonuc: ozetAl("customer.id") },
    ],
  },
  {
    id: "woocommerce", ad: "WooCommerce", logo: "/marka/uyg/woocommerce.svg", kategori: "E-ticaret", aciklama: "Siparişler, notlar, stok ve müşteriler", belge: "https://woocommerce.github.io/woocommerce-rest-api-docs/",
    sirlar: [{ ad: "WOO_SITE", etiket: "Site adresi", nasil: "https://magazan.com biçiminde (https zorunlu)." }, { ad: "WOO_KEY", etiket: "Consumer key", nasil: "WooCommerce, Ayarlar, Gelişmiş, REST API; okuma ve yazma izinli anahtar oluştur (ck_ ile başlar)." }, { ad: "WOO_SECRET", etiket: "Consumer secret", nasil: "Aynı anahtarın cs_ ile başlayan gizli değeri." }],
    eylemler: [
      { id: "siparisler", ad: "Siparişleri listele", aciklama: "Duruma göre en yeniler", okuma: true, sirlar: WO, alanlar: [{ ad: "durum", etiket: "Durum", tur: "secim", secenekler: [{ id: "any", ad: "Hepsi" }, ...DURUM_WOO], varsayilan: "processing" }, { ad: "adet", etiket: "Kaç sipariş", tur: "sayi", varsayilan: "20", yer: "20" }],
        istek: (g, s) => ({ yontem: "GET", url: woo(s, `/orders${sorgu({ status: t(g.durum) || "any", per_page: tamsayi(g.adet, 20, 1, 100), orderby: "date", order: "desc" })}`), basliklar: wooB(s) }) },
      { id: "siparis", ad: "Siparişi getir", aciklama: "Kalemler, adres ve ödeme", okuma: true, sirlar: WO, alanlar: [{ ad: "siparis", etiket: "Sipariş kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: woo(s, `/orders/${enc(zorunlu(g, "siparis", "Sipariş kimliği"))}`), basliklar: wooB(s) }) },
      { id: "durum", ad: "Sipariş durumunu değiştir", aciklama: "Tamamlandı, iptal ya da beklemede", sirlar: WO, alanlar: [{ ad: "siparis", etiket: "Sipariş kimliği", zorunlu: true }, { ad: "durum", etiket: "Yeni durum", tur: "secim", secenekler: DURUM_WOO, varsayilan: "completed" }],
        istek: (g, s) => ({ yontem: "PUT", url: woo(s, `/orders/${enc(zorunlu(g, "siparis", "Sipariş kimliği"))}`), basliklar: wooB(s), json: { status: t(g.durum) || "completed" } }) },
      { id: "not", ad: "Siparişe not ekle", aciklama: "İç not ya da müşteriye giden not", sirlar: WO, alanlar: [{ ad: "siparis", etiket: "Sipariş kimliği", zorunlu: true }, { ad: "not", etiket: "Not", tur: "uzunMetin", zorunlu: true }, { ad: "musteri", etiket: "Müşteriye gönder", tur: "evet-hayir" }],
        istek: (g, s) => ({ yontem: "POST", url: woo(s, `/orders/${enc(zorunlu(g, "siparis", "Sipariş kimliği"))}/notes`), basliklar: wooB(s), json: { note: zorunlu(g, "not", "Not"), customer_note: evet(g.musteri) } }) },
      { id: "urunler", ad: "Ürünleri listele", aciklama: "Arama ya da SKU ile", okuma: true, sirlar: WO, alanlar: [{ ad: "ara", etiket: "Arama" }, { ad: "sku", etiket: "SKU" }],
        istek: (g, s) => ({ yontem: "GET", url: woo(s, `/products${sorgu({ search: t(g.ara), sku: t(g.sku), per_page: 50 })}`), basliklar: wooB(s) }) },
      { id: "stok", ad: "Stok adedini güncelle", aciklama: "Ürünün stok takibi açılır", sirlar: WO, alanlar: [{ ad: "urun", etiket: "Ürün kimliği", zorunlu: true }, { ad: "adet", etiket: "Stok adedi", tur: "sayi", zorunlu: true }, { ad: "fiyat", etiket: "Normal fiyat (isteğe bağlı)", tur: "sayi" }],
        istek: (g, s) => ({ yontem: "PUT", url: woo(s, `/products/${enc(zorunlu(g, "urun", "Ürün kimliği"))}`), basliklar: wooB(s), json: dolu({ manage_stock: true, stock_quantity: tamsayi(g.adet, 0, 0, 1e7), regular_price: t(g.fiyat) ? String(sayi(g.fiyat, 0, 0, 1e9)) : undefined }) }) },
      { id: "musteri", ad: "Müşteri oluştur", aciklama: "E-posta zorunlu", sirlar: WO, alanlar: [{ ad: "eposta", etiket: "E-posta", zorunlu: true }, { ad: "ad", etiket: "Ad" }, { ad: "soyad", etiket: "Soyad" }, { ad: "telefon", etiket: "Telefon" }],
        istek: (g, s) => ({ yontem: "POST", url: woo(s, "/customers"), basliklar: wooB(s), json: dolu({ email: zorunlu(g, "eposta", "E-posta"), first_name: t(g.ad), last_name: t(g.soyad), billing: t(g.telefon) ? { phone: t(g.telefon) } : undefined }) }), sonuc: ozetAl("id") },
    ],
  },
  {
    id: "stripe", ad: "Stripe", logo: "/marka/baglanti/stripe.svg", kategori: "Ödeme", aciklama: "Müşteri, ödeme bağlantısı, ödeme sayfası, iade ve abonelik", belge: "https://docs.stripe.com/api",
    sirlar: [{ ad: "STRIPE_SECRET_KEY", etiket: "Gizli anahtar", nasil: "Stripe panelinde Geliştiriciler, API anahtarları; sk_ ya da kısıtlı rk_ ile başlayan anahtar (deneme için sk_test_)." }],
    baglanti: [{ katalog: "stripe", esle: { STRIPE_SECRET_KEY: "anahtar" } }],
    eylemler: [
      { id: "musteri", ad: "Müşteri oluştur", aciklama: "E-posta, ad ve telefonla", sirlar: ["STRIPE_SECRET_KEY"], alanlar: [{ ad: "eposta", etiket: "E-posta", zorunlu: true }, { ad: "ad", etiket: "Ad soyad" }, { ad: "telefon", etiket: "Telefon" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.stripe.com/v1/customers", basliklar: stp(s), form: dolu({ email: zorunlu(g, "eposta", "E-posta"), name: t(g.ad), phone: t(g.telefon) }) as Record<string, string> }), sonuc: ozetAl("id") },
      { id: "musteri-ara", ad: "Müşteri ara", aciklama: "E-postaya göre", okuma: true, sirlar: ["STRIPE_SECRET_KEY"], alanlar: [{ ad: "eposta", etiket: "E-posta", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.stripe.com/v1/customers/search${sorgu({ query: `email:'${zorunlu(g, "eposta", "E-posta").replace(/'/g, "")}'` })}`, basliklar: stp(s) }) },
      { id: "baglanti", ad: "Ödeme bağlantısı oluştur", aciklama: "Fiyat kimliğiyle paylaşılabilir bağlantı", sirlar: ["STRIPE_SECRET_KEY"], alanlar: [{ ad: "fiyat", etiket: "Fiyat kimliği", zorunlu: true, yer: "price_123" }, { ad: "adet", etiket: "Adet", tur: "sayi", yer: "1", varsayilan: "1" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.stripe.com/v1/payment_links", basliklar: stp(s), form: { "line_items[0][price]": zorunlu(g, "fiyat", "Fiyat kimliği"), "line_items[0][quantity]": String(tamsayi(g.adet, 1, 1, 999)) } }), sonuc: ozetAl("url") },
      { id: "odeme-sayfasi", ad: "Ödeme sayfası oluştur", aciklama: "Checkout oturumu; dönüş adresleriyle", sirlar: ["STRIPE_SECRET_KEY"], alanlar: [{ ad: "fiyat", etiket: "Fiyat kimliği", zorunlu: true }, { ad: "adet", etiket: "Adet", tur: "sayi", varsayilan: "1", yer: "1" }, { ad: "mod", etiket: "Tür", tur: "secim", secenekler: [{ id: "payment", ad: "Tek seferlik ödeme" }, { id: "subscription", ad: "Abonelik" }], varsayilan: "payment" }, { ad: "basari", etiket: "Başarı adresi", zorunlu: true, yer: "https://magazan.com/tesekkurler" }, { ad: "iptal", etiket: "İptal adresi" }, { ad: "eposta", etiket: "Müşteri e-postası (isteğe bağlı)" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.stripe.com/v1/checkout/sessions", basliklar: stp(s), form: dolu({ mode: t(g.mod) === "subscription" ? "subscription" : "payment", "line_items[0][price]": zorunlu(g, "fiyat", "Fiyat kimliği"), "line_items[0][quantity]": String(tamsayi(g.adet, 1, 1, 999)), success_url: zorunlu(g, "basari", "Başarı adresi"), cancel_url: t(g.iptal), customer_email: t(g.eposta) }) as Record<string, string> }), sonuc: ozetAl("url") },
      { id: "odeme", ad: "Ödemeyi getir", aciklama: "PaymentIntent durumu ve tutarı", okuma: true, sirlar: ["STRIPE_SECRET_KEY"], alanlar: [{ ad: "odeme", etiket: "Ödeme kimliği (pi_…)", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.stripe.com/v1/payment_intents/${enc(zorunlu(g, "odeme", "Ödeme kimliği"))}`, basliklar: stp(s) }), sonuc: ozetAl("status") },
      { id: "iade", ad: "İade et", aciklama: "Tam ya da kısmi iade (kuruş cinsinden tutar)", sirlar: ["STRIPE_SECRET_KEY"], alanlar: [{ ad: "odeme", etiket: "Ödeme kimliği (pi_…)", zorunlu: true }, { ad: "tutar", etiket: "Tutar (en küçük birim, boşsa tamamı)", tur: "sayi", yer: "1500" }, { ad: "neden", etiket: "Neden", tur: "secim", secenekler: [{ id: "requested_by_customer", ad: "Müşteri istedi" }, { id: "duplicate", ad: "Yinelenen ödeme" }, { id: "fraudulent", ad: "Dolandırıcılık" }], varsayilan: "requested_by_customer" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.stripe.com/v1/refunds", basliklar: stp(s), form: dolu({ payment_intent: zorunlu(g, "odeme", "Ödeme kimliği"), amount: t(g.tutar) ? String(tamsayi(g.tutar, 0, 1, 1e12)) : undefined, reason: t(g.neden) }) as Record<string, string> }), sonuc: ozetAl("status") },
      { id: "abonelik-iptal", ad: "Aboneliği iptal et", aciklama: "Hemen iptal eder", sirlar: ["STRIPE_SECRET_KEY"], alanlar: [{ ad: "abonelik", etiket: "Abonelik kimliği (sub_…)", zorunlu: true }],
        istek: (g, s) => ({ yontem: "DELETE", url: `https://api.stripe.com/v1/subscriptions/${enc(zorunlu(g, "abonelik", "Abonelik kimliği"))}`, basliklar: stp(s) }), sonuc: ozetAl("status") },
    ],
  },
  {
    id: "paypal", ad: "PayPal", logo: "/marka/baglanti/paypal.svg", kategori: "Ödeme", aciklama: "Sipariş, tahsilat, iade, fatura ve para gönderme", belge: "https://developer.paypal.com/docs/api/orders/v2/",
    sirlar: [{ ad: "PAYPAL_CLIENT_ID", etiket: "Client ID", nasil: "developer.paypal.com, Apps & Credentials, uygulamanın Client ID değeri." }, { ad: "PAYPAL_SECRET", etiket: "Secret", nasil: "Aynı uygulamanın Secret değeri." }, { ad: "PAYPAL_ORTAM", etiket: "Ortam", nasil: "Sandbox için test yaz; boşsa canlı.", istege: true }],
    kimlik: { sirlar: ["PAYPAL_CLIENT_ID", "PAYPAL_SECRET"], istek: (s) => ({ yontem: "POST", url: `${ppTaban(s)}/v1/oauth2/token`, basliklar: { Authorization: temel(s("PAYPAL_CLIENT_ID"), s("PAYPAL_SECRET")) }, form: { grant_type: "client_credentials" } }), coz: (y) => { const o = y as { access_token?: string; expires_in?: number }; if (!o?.access_token) throw new Error("PayPal belirteç vermedi."); return { degerler: { _PAYPAL_ERISIM: o.access_token }, omur: (o.expires_in ?? 3000) * 1000 }; } },
    eylemler: [
      { id: "siparis", ad: "Sipariş oluştur", aciklama: "Onay bağlantısı döner; müşteri bu adreste öder", sirlar: ["_PAYPAL_ERISIM"], alanlar: [{ ad: "tutar", etiket: "Tutar", tur: "sayi", zorunlu: true }, { ad: "para", etiket: "Para birimi", yer: "USD", varsayilan: "USD" }, { ad: "aciklama", etiket: "Açıklama" }, { ad: "referans", etiket: "Referans (isteğe bağlı)" }],
        istek: (g, s) => ({ yontem: "POST", url: `${ppTaban(s)}/v2/checkout/orders`, basliklar: ppB(s), json: { intent: "CAPTURE", purchase_units: [dolu({ amount: { currency_code: (t(g.para) || "USD").toUpperCase(), value: tutar(zorunlu(g, "tutar", "Tutar")) }, description: t(g.aciklama).slice(0, 127), reference_id: t(g.referans) })] } }),
        sonuc: (y) => ({ ozet: m(((y as { links?: { rel: string; href: string }[] })?.links ?? []).find((l) => l.rel === "approve" || l.rel === "payer-action")?.href) || undefined }) },
      { id: "getir", ad: "Siparişi getir", aciklama: "Durum ve ödeyen bilgisi", okuma: true, sirlar: ["_PAYPAL_ERISIM"], alanlar: [{ ad: "siparis", etiket: "Sipariş kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `${ppTaban(s)}/v2/checkout/orders/${enc(zorunlu(g, "siparis", "Sipariş kimliği"))}`, basliklar: ppB(s) }), sonuc: ozetAl("status") },
      { id: "tahsil", ad: "Ödemeyi tahsil et", aciklama: "Onaylanan siparişin parasını çeker", sirlar: ["_PAYPAL_ERISIM"], alanlar: [{ ad: "siparis", etiket: "Sipariş kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: `${ppTaban(s)}/v2/checkout/orders/${enc(zorunlu(g, "siparis", "Sipariş kimliği"))}/capture`, basliklar: ppB(s), json: {} }), sonuc: ozetAl("status") },
      { id: "iade", ad: "İade et", aciklama: "Tahsilata tam ya da kısmi iade", sirlar: ["_PAYPAL_ERISIM"], alanlar: [{ ad: "tahsilat", etiket: "Tahsilat kimliği (capture id)", zorunlu: true }, { ad: "tutar", etiket: "Tutar (boşsa tamamı)", tur: "sayi" }, { ad: "para", etiket: "Para birimi", yer: "USD", varsayilan: "USD" }],
        istek: (g, s) => ({ yontem: "POST", url: `${ppTaban(s)}/v2/payments/captures/${enc(zorunlu(g, "tahsilat", "Tahsilat kimliği"))}/refund`, basliklar: ppB(s), json: t(g.tutar) ? { amount: { value: tutar(g.tutar), currency_code: (t(g.para) || "USD").toUpperCase() } } : {} }), sonuc: ozetAl("status") },
      { id: "fatura", ad: "Fatura oluştur ve gönder", aciklama: "Müşteriye PayPal faturası e-postayla gider", sirlar: ["_PAYPAL_ERISIM"], alanlar: [{ ad: "eposta", etiket: "Müşteri e-postası", zorunlu: true }, { ad: "ad", etiket: "Müşteri adı" }, { ad: "soyad", etiket: "Müşteri soyadı" }, { ad: "kalem", etiket: "Kalem adı", zorunlu: true }, { ad: "adet", etiket: "Adet", tur: "sayi", varsayilan: "1" }, { ad: "tutar", etiket: "Birim fiyat", tur: "sayi", zorunlu: true }, { ad: "para", etiket: "Para birimi", yer: "USD", varsayilan: "USD" }, { ad: "not", etiket: "Not" }],
        istek: (g, s) => { const pb = (t(g.para) || "USD").toUpperCase(); return { yontem: "POST", url: `${ppTaban(s)}/v2/invoicing/invoices`, basliklar: { ...ppB(s), Prefer: "return=representation" }, json: { detail: dolu({ currency_code: pb, note: t(g.not) }), primary_recipients: [{ billing_info: dolu({ email_address: zorunlu(g, "eposta", "E-posta"), name: t(g.ad) || t(g.soyad) ? dolu({ given_name: t(g.ad), surname: t(g.soyad) }) : undefined }) }], items: [{ name: zorunlu(g, "kalem", "Kalem adı").slice(0, 200), quantity: String(sayi(g.adet, 1, 0, 1e6)), unit_amount: { currency_code: pb, value: tutar(g.tutar) } }] } }; },
        devam: (y, _g, s) => { const id = (y as { id?: string })?.id; if (!id) throw new Error("PayPal fatura kimliği vermedi."); return { yontem: "POST", url: `${ppTaban(s)}/v2/invoicing/invoices/${enc(id)}/send`, basliklar: ppB(s), json: { send_to_invoicer: false, send_to_recipient: true } }; },
        sonuc: ozetAl("href") },
      { id: "para-gonder", ad: "Para gönder (Payouts)", aciklama: "E-posta adresine PayPal ile ödeme yapar", sirlar: ["_PAYPAL_ERISIM"], alanlar: [{ ad: "alici", etiket: "Alıcı e-postası", zorunlu: true }, { ad: "tutar", etiket: "Tutar", tur: "sayi", zorunlu: true }, { ad: "para", etiket: "Para birimi", yer: "USD", varsayilan: "USD" }, { ad: "not", etiket: "Not" }, { ad: "konu", etiket: "E-posta konusu", yer: "Ödemeniz gönderildi" }],
        istek: (g, s) => ({ yontem: "POST", url: `${ppTaban(s)}/v1/payments/payouts`, basliklar: ppB(s), json: { sender_batch_header: dolu({ sender_batch_id: `vayra-${Date.now()}`, email_subject: t(g.konu) }), items: [dolu({ recipient_type: "EMAIL", amount: { value: tutar(g.tutar), currency: (t(g.para) || "USD").toUpperCase() }, receiver: zorunlu(g, "alici", "Alıcı e-postası"), note: t(g.not) })] } }), sonuc: ozetAl("batch_header.payout_batch_id") },
    ],
  },
  {
    id: "lemonsqueezy", ad: "Lemon Squeezy", logo: "/marka/uyg/lemon-squeezy.svg", kategori: "Ödeme", aciklama: "Siparişler, abonelikler ve ödeme sayfası", belge: "https://docs.lemonsqueezy.com/api",
    sirlar: [{ ad: "LEMONSQUEEZY_API_KEY", etiket: "API anahtarı", nasil: "Lemon Squeezy, Settings, API; yeni anahtar oluştur." }],
    eylemler: [
      { id: "siparisler", ad: "Siparişleri listele", aciklama: "Mağazanın son siparişleri", okuma: true, sirlar: ["LEMONSQUEEZY_API_KEY"], alanlar: [{ ad: "magaza", etiket: "Mağaza kimliği (isteğe bağlı)" }, { ad: "eposta", etiket: "Müşteri e-postası (isteğe bağlı)" }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.lemonsqueezy.com/v1/orders${sorgu({ "filter[store_id]": t(g.magaza), "filter[user_email]": t(g.eposta) })}`, basliklar: lsB(s) }) },
      { id: "abonelik", ad: "Aboneliği getir", aciklama: "Durum, plan ve yenileme tarihi", okuma: true, sirlar: ["LEMONSQUEEZY_API_KEY"], alanlar: [{ ad: "abonelik", etiket: "Abonelik kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.lemonsqueezy.com/v1/subscriptions/${enc(zorunlu(g, "abonelik", "Abonelik kimliği"))}`, basliklar: lsB(s) }), sonuc: ozetAl("data.attributes.status") },
      { id: "odeme-sayfasi", ad: "Ödeme sayfası oluştur", aciklama: "Mağaza ve varyant için özel ödeme adresi", sirlar: ["LEMONSQUEEZY_API_KEY"], alanlar: [{ ad: "magaza", etiket: "Mağaza kimliği", zorunlu: true }, { ad: "varyant", etiket: "Varyant kimliği", zorunlu: true }, { ad: "eposta", etiket: "Müşteri e-postası (isteğe bağlı)" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.lemonsqueezy.com/v1/checkouts", basliklar: lsB(s), metin: JSON.stringify({ data: { type: "checkouts", attributes: t(g.eposta) ? { checkout_data: { email: t(g.eposta) } } : {}, relationships: { store: { data: { type: "stores", id: zorunlu(g, "magaza", "Mağaza kimliği") } }, variant: { data: { type: "variants", id: zorunlu(g, "varyant", "Varyant kimliği") } } } } }), tur: "application/vnd.api+json" }), sonuc: ozetAl("data.attributes.url") },
    ],
  },
  {
    id: "paddle", ad: "Paddle", logo: "/marka/uyg/paddle.svg", kategori: "Ödeme", aciklama: "İşlemler, müşteriler ve abonelik iptali", belge: "https://developer.paddle.com/api-reference/overview",
    sirlar: [{ ad: "PADDLE_API_KEY", etiket: "API anahtarı", nasil: "Paddle, Developer tools, Authentication; yeni API anahtarı." }, { ad: "PADDLE_ORTAM", etiket: "Ortam", nasil: "Sandbox için test yaz; boşsa canlı.", istege: true }],
    eylemler: [
      { id: "islemler", ad: "İşlemleri listele", aciklama: "Duruma göre son işlemler", okuma: true, sirlar: ["PADDLE_API_KEY"], alanlar: [{ ad: "durum", etiket: "Durum", tur: "secim", secenekler: [{ id: "", ad: "Hepsi" }, { id: "completed", ad: "Tamamlandı" }, { id: "paid", ad: "Ödendi" }, { id: "past_due", ad: "Gecikmiş" }] }],
        istek: (g, s) => ({ yontem: "GET", url: `${pdTaban(s)}/transactions${sorgu({ status: t(g.durum), per_page: 50, order_by: "created_at[DESC]" })}`, basliklar: pdB(s) }) },
      { id: "musteri", ad: "Müşteri oluştur", aciklama: "E-posta ve ad", sirlar: ["PADDLE_API_KEY"], alanlar: [{ ad: "eposta", etiket: "E-posta", zorunlu: true }, { ad: "ad", etiket: "Ad" }],
        istek: (g, s) => ({ yontem: "POST", url: `${pdTaban(s)}/customers`, basliklar: pdB(s), json: dolu({ email: zorunlu(g, "eposta", "E-posta"), name: t(g.ad) }) }), sonuc: ozetAl("data.id") },
      { id: "abonelik-iptal", ad: "Aboneliği iptal et", aciklama: "Hemen ya da dönem sonunda", sirlar: ["PADDLE_API_KEY"], alanlar: [{ ad: "abonelik", etiket: "Abonelik kimliği (sub_…)", zorunlu: true }, { ad: "zaman", etiket: "Ne zaman", tur: "secim", secenekler: [{ id: "next_billing_period", ad: "Dönem sonunda" }, { id: "immediately", ad: "Hemen" }], varsayilan: "next_billing_period" }],
        istek: (g, s) => ({ yontem: "POST", url: `${pdTaban(s)}/subscriptions/${enc(zorunlu(g, "abonelik", "Abonelik kimliği"))}/cancel`, basliklar: pdB(s), json: { effective_from: t(g.zaman) === "immediately" ? "immediately" : "next_billing_period" } }), sonuc: ozetAl("data.status") },
    ],
  },
];
void liste; void nesne; void ({} as UygIstek);
