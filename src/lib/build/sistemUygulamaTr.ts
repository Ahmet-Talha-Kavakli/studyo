import {
  MESAJ, b64, bul, dolu, enc, evet, hmacB64, hmacHex, liste, m, md5, nesne, ozetAl, rastgele, sayi, siteKoku, soap, sorgu, t, tamsayi, temel, virgul, xk, xmlOgeler, zorunlu,
  type UygAlan, type UygIstek, type Uygulama,
} from "./sistemUygulamaOrtak";

/**
 * Türkiye servisleri. Uç noktalar, kimlik biçimleri ve gövdeler resmî belgelerden (2026-11-05/06):
 *  Trendyol developers.trendyol.com · n11 developer.n11.com · ikas ikas.dev (GraphQL, istemci kimliği belirteci) ·
 *  Ticimax canlı WSDL (Servis/SiparisServis.svc, UrunServis.svc; ad alanı tempuri.org) · Shopier developer.shopier.com ·
 *  iyzico docs.iyzico.com (IYZWSv2) · PayTR dev.paytr.com · Paraşüt devhub.parasut.com (OpenAPI 4.1, Keycloak) ·
 *  Papara merchant-api.papara.com · BizimHesap apidocs.bizimhesap.com · Nilvera developer.nilvera.com ·
 *  Mikro apidocs.mikro.com.tr (V2, günlük MD5 şifre) · Netgsm resmî SDK (@netgsm/sms, netiys) · İleti Merkezi iletimerkezi.com/docs ·
 *  Verimor, KobiKom, Organik Haberleşme resmî API belgeleri · Yurtiçi Kargo ve Aras Kargo resmî WSDL ·
 *  MNG Kargo apizone.mngkargo.com.tr Swagger · Geliver docs.geliver.io · Basit Kargo basitkargo.com/api · CollectAPI docs.collectapi.com.
 * Hepsiburada (portal erişime kapalı), IdeaSoft (belge sitesi kilitli) ve Logo (herkese açık API belgesi yok) belge
 * doğrulanamadığı için eklenmedi; Aras Kargo takip sorgusunun iç biçimi resmî belgede bulunamadığı için yalnız gönderi ve iptal var.
 */
const trGun = (fark = 0) => new Date(Date.now() + 3 * 3600_000 + fark * 86_400_000).toISOString().slice(0, 10);
const gunMs = (v: unknown, son = false) => { const s = t(v); if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined; return Date.parse(`${s}T${son ? "23:59:59" : "00:00:00"}+03:00`); };
const SAYFA: UygAlan = { ad: "boyut", etiket: "Kaç kayıt", tur: "sayi", yer: "50", varsayilan: "50" };

/* ───────────── Trendyol ───────────── */
const tyTaban = (s: (a: string) => string) => (s("TRENDYOL_ORTAM") === "test" ? "https://stageapigw.trendyol.com/integration" : "https://apigw.trendyol.com/integration");
const tyBas = (s: (a: string) => string) => ({ Authorization: temel(s("TRENDYOL_API_KEY"), s("TRENDYOL_API_SECRET")), "User-Agent": `${s("TRENDYOL_SATICI")} - SelfIntegration` });
const TY = ["TRENDYOL_SATICI", "TRENDYOL_API_KEY", "TRENDYOL_API_SECRET"];
const tyId = (s: (a: string) => string) => enc(s("TRENDYOL_SATICI"));

/* ───────────── ikas ───────────── */
const ikasGql = (query: string, variables?: Record<string, unknown>) => (s: (a: string) => string): UygIstek => ({ yontem: "POST", url: "https://api.myikas.com/api/v1/admin/graphql", basliklar: { Authorization: `Bearer ${s("_IKAS_ERISIM")}` }, json: { query, ...(variables ? { variables } : {}) } });
/** GraphQL giriş değeri (değişmez yazım): anahtarlar tırnaksız, metinler JSON tırnaklı. */
const gqlDeger = (v: unknown): string => (Array.isArray(v) ? `[${v.map(gqlDeger).join(", ")}]` : v && typeof v === "object" ? `{ ${Object.entries(v as Record<string, unknown>).filter(([, x]) => x !== undefined).map(([k, x]) => `${k}: ${gqlDeger(x)}`).join(", ")} }` : JSON.stringify(v ?? null));
const gqlHata = (y: unknown) => { const o = y as { errors?: { message?: string }[] } | null; return o?.errors?.length ? { hata: o.errors.map((e) => e.message).join("; ").slice(0, 400) } : {}; };

/* ───────────── Ticimax (SOAP, WCF) ───────────── */
const TCX_DC = "http://schemas.datacontract.org/2004/07/";
const tcxUrl = (s: (a: string) => string, servis: string) => `${siteKoku(s("TICIMAX_SITE"))}/Servis/${servis}.svc`;
const tcxIstek = (s: (a: string) => string, servis: "SiparisServis" | "UrunServis", islem: string, ic: string) =>
  soap(tcxUrl(s, servis), `http://tempuri.org/I${servis}/${islem}`, `<${islem} xmlns="http://tempuri.org/"><UyeKodu>${xk(s("TICIMAX_UYE_KODU"))}</UyeKodu>${ic}</${islem}>`);
const soapHata = (y: unknown) => { const f = bul(y, "Fault") as Record<string, unknown> | undefined; return f ? { hata: `SOAP hatası: ${m(f.faultstring ?? bul(f, "Text") ?? "bilinmiyor").slice(0, 300)}` } : {}; };

/* ───────────── iyzico (IYZWSv2) ───────────── */
async function iyzico(s: (a: string) => string, yol: string, govde?: Record<string, unknown>, sorguMetni = ""): Promise<UygIstek> {
  const taban = s("IYZICO_ORTAM") === "canli" ? "https://api.iyzipay.com" : "https://sandbox-api.iyzipay.com";
  const rnd = `${Date.now()}${rastgele(6)}`;
  const metin = govde ? JSON.stringify(govde) : "";
  const imza = await hmacHex(s("IYZICO_SECRET_KEY"), rnd + yol + metin);
  return {
    yontem: govde ? "POST" : "GET", url: `${taban}${yol}${sorguMetni}`, ...(govde ? { metin, tur: "application/json" } : {}),
    basliklar: { Authorization: `IYZWSv2 ${b64(`apiKey:${s("IYZICO_API_KEY")}&randomKey:${rnd}&signature:${imza}`)}`, "x-iyzi-rnd": rnd },
  };
}
const iyziSonuc = (y: unknown) => { const o = y as { status?: string; errorMessage?: string; errorCode?: string } | null; return o?.status && o.status !== "success" ? { hata: `iyzico: ${o.errorMessage ?? "hata"}${o.errorCode ? ` (kod ${o.errorCode})` : ""}` } : {}; };
const IYZ = ["IYZICO_API_KEY", "IYZICO_SECRET_KEY"];
const iyzOrtak = () => ({ locale: "tr", conversationId: `vayra-${Date.now()}` });

/* ───────────── PayTR ───────────── */
async function paytr(s: (a: string) => string, url: string, alanlar: Record<string, string>, imzaMetni: string): Promise<UygIstek> {
  const paytr_token = await hmacB64(s("PAYTR_MERCHANT_KEY"), imzaMetni + s("PAYTR_MERCHANT_SALT"));
  return { yontem: "POST", url, form: { merchant_id: s("PAYTR_MERCHANT_ID"), ...alanlar, paytr_token } };
}
const paytrSonuc = (y: unknown) => { const o = y as { status?: string; err_msg?: string; reason?: string } | null; return o?.status === "error" ? { hata: `PayTR: ${o.err_msg ?? o.reason ?? "hata"}` } : {}; };
const PTR = ["PAYTR_MERCHANT_ID", "PAYTR_MERCHANT_KEY", "PAYTR_MERCHANT_SALT"];

/* ───────────── Paraşüt ───────────── */
const PRS = ["PARASUT_FIRMA_NO", "_PARASUT_ERISIM"];
const prs = (s: (a: string) => string, yontem: UygIstek["yontem"], yol: string, json?: unknown): UygIstek => {
  const f = s("PARASUT_FIRMA_NO").replace(/\D/g, "");
  if (!f) throw new Error("Paraşüt firma numarası (PARASUT_FIRMA_NO) eksik.");
  return { yontem, url: `https://api.parasut.com/v4/${f}${yol}`, basliklar: { Authorization: `Bearer ${s("_PARASUT_ERISIM")}`, Accept: "application/vnd.api+json", ...(json ? { "Content-Type": "application/vnd.api+json" } : {}) }, ...(json ? { metin: JSON.stringify(json), tur: "application/vnd.api+json" } : {}) };
};
const prsId = (y: unknown) => ({ ozet: m((y as { data?: { id?: string } } | null)?.data?.id) || undefined });

/* ───────────── Mikro ───────────── */
const mikroKimlik = (s: (a: string) => string) => ({
  ApiKey: s("MIKRO_API_KEY"), CalismaYili: s("MIKRO_CALISMA_YILI") || trGun().slice(0, 4), FirmaKodu: s("MIKRO_FIRMA_KODU"), KullaniciKodu: s("MIKRO_KULLANICI"),
  Sifre: md5(`${trGun()} ${s("MIKRO_SIFRE")}`),
});
const MIK = ["MIKRO_SUNUCU", "MIKRO_API_KEY", "MIKRO_FIRMA_KODU", "MIKRO_KULLANICI", "MIKRO_SIFRE"];
const mikroUrl = (s: (a: string) => string, islem: string) => `${siteKoku(s("MIKRO_SUNUCU"))}/Api/APIMethods/${islem}`;

/* ───────────── Netgsm ───────────── */
const NG = ["NETGSM_KULLANICI", "NETGSM_SIFRE"];
const ngBas = (s: (a: string) => string) => ({ Authorization: temel(s("NETGSM_KULLANICI"), s("NETGSM_SIFRE")) });
const ngSonuc = (y: unknown) => { const o = y as { code?: string | number; description?: string } | null; return o?.code !== undefined && String(o.code) !== "00" && String(o.code) !== "0" ? { hata: `Netgsm kodu ${o.code}: ${o.description ?? "işlem yapılmadı"}` } : {}; };
const ngNo = (v: string) => v.replace(/[^\d]/g, "").replace(/^(90|0)(?=5\d{9}$)/, "");

/* ───────────── İleti Merkezi ───────────── */
const imIstek = (s: (a: string) => string, uc: string, ek: Record<string, unknown> = {}): UygIstek => ({ yontem: "POST", url: `https://api.iletimerkezi.com/v1/${uc}/json`, json: { request: { authentication: { key: s("ILETIMERKEZI_KEY"), hash: s("ILETIMERKEZI_HASH") }, ...ek } } });
const imSonuc = (y: unknown) => { const o = (y as { response?: { status?: { code?: string | number; message?: string } } } | null)?.response?.status; return o && String(o.code) !== "200" ? { hata: `İleti Merkezi ${o.code}: ${o.message ?? ""}` } : {}; };

/* ───────────── Yurtiçi Kargo ───────────── */
const YK_NS = "http://yurticikargo.com.tr/ShippingOrderDispatcherServices";
const ykUrl = (s: (a: string) => string) => (s("YURTICI_ORTAM") === "test" ? "https://testws.yurticikargo.com/KOPSWebServices/ShippingOrderDispatcherServices" : "https://ws.yurticikargo.com/KOPSWebServices/ShippingOrderDispatcherServices");
const ykIstek = (s: (a: string) => string, islem: string, ic: string): UygIstek => soap(ykUrl(s), "", `<ship:${islem}>${ic}</ship:${islem}>`, ` xmlns:ship="${YK_NS}"`);
const ykSonuc = (y: unknown) => { const f = soapHata(y); if (f.hata) return f; const fl = bul(y, "outFlag"); const er = bul(y, "errMessage") ?? bul(y, "outResult"); return fl !== undefined && String(fl) !== "0" ? { hata: `Yurtiçi Kargo: ${m(er).slice(0, 300) || "işlem yapılmadı"}` } : { ozet: m(bul(y, "jobId") ?? bul(y, "operationMessage") ?? "").slice(0, 200) || undefined }; };
const YK = ["YURTICI_KULLANICI", "YURTICI_SIFRE"];

/* ───────────── Aras Kargo ───────────── */
const arasUrl = (s: (a: string) => string) => (s("ARAS_ORTAM") === "test" ? "https://customerservicestest.araskargo.com.tr/arascargoservice/arascargoservice.asmx" : "https://customerws.araskargo.com.tr/arascargoservice.asmx");
const arasSonuc = (y: unknown) => { const f = soapHata(y); if (f.hata) return f; const k = m(bul(y, "ResultCode")); const msj = m(bul(y, "ResultMessage")); return k && k !== "0" ? { hata: `Aras Kargo ${k}: ${msj}` } : { ozet: msj || undefined }; };

/* ───────────── MNG Kargo ───────────── */
const MNG_TABAN = "https://api.mngkargo.com.tr/mngapi/api";
const mngBas = (s: (a: string) => string, belirtec = true) => ({ "X-IBM-Client-Id": s("MNG_CLIENT_ID"), "X-IBM-Client-Secret": s("MNG_CLIENT_SECRET"), ...(belirtec ? { Authorization: `Bearer ${s("_MNG_ERISIM")}` } : {}) });
const MNG = ["MNG_CLIENT_ID", "MNG_CLIENT_SECRET", "_MNG_ERISIM"];

export const UYG_TR: Uygulama[] = [
  {
    id: "trendyol", ad: "Trendyol", logo: "/marka/baglanti/trendyol.svg", kategori: "E-ticaret", turkiye: true, aciklama: "Siparişler, ürünler, stok ve müşteri soruları", belge: "https://developers.trendyol.com/",
    sirlar: [{ ad: "TRENDYOL_SATICI", etiket: "Satıcı kimliği", nasil: "Satıcı panelinde Hesap Bilgilerim, Entegrasyon Bilgileri bölümündeki Satıcı ID." }, { ad: "TRENDYOL_API_KEY", etiket: "API anahtarı", nasil: "Aynı bölümdeki API Key." }, { ad: "TRENDYOL_API_SECRET", etiket: "API gizli anahtarı", nasil: "Aynı bölümdeki API Secret." }, { ad: "TRENDYOL_ORTAM", etiket: "Ortam", nasil: "Boş bırak ya da canli yaz; test ortamı için test (IP izni ister).", istege: true }],
    baglanti: [{ katalog: "trendyol", esle: { TRENDYOL_SATICI: "alan:satici_id", TRENDYOL_API_KEY: "alan:api_key", TRENDYOL_API_SECRET: "alan:api_secret", TRENDYOL_ORTAM: "alan:ortam" } }],
    eylemler: [
      { id: "siparisler", ad: "Siparişleri listele", aciklama: "Duruma ve tarihe göre son sipariş paketleri", okuma: true, sirlar: TY,
        alanlar: [{ ad: "durum", etiket: "Durum", tur: "secim", secenekler: [{ id: "Created", ad: "Yeni" }, { id: "Picking", ad: "Hazırlanıyor" }, { id: "Invoiced", ad: "Faturalandı" }, { id: "Shipped", ad: "Kargoda" }, { id: "Delivered", ad: "Teslim edildi" }, { id: "Cancelled", ad: "İptal" }, { id: "UnDelivered", ad: "Teslim edilemedi" }, { id: "Returned", ad: "İade" }], varsayilan: "Created" }, { ad: "baslangic", etiket: "Başlangıç günü (isteğe bağlı)", yer: "2026-11-01" }, { ad: "bitis", etiket: "Bitiş günü (isteğe bağlı)", yer: "2026-11-06" }, { ad: "siparisNo", etiket: "Sipariş numarası (isteğe bağlı)" }, SAYFA],
        istek: (g, s) => ({ yontem: "GET", url: `${tyTaban(s)}/order/sellers/${tyId(s)}/orders${sorgu({ status: t(g.durum) || "Created", startDate: gunMs(g.baslangic), endDate: gunMs(g.bitis, true), orderNumber: t(g.siparisNo), page: 0, size: tamsayi(g.boyut, 50, 1, 200), orderByField: "PackageLastModifiedDate", orderByDirection: "DESC" })}`, basliklar: tyBas(s) }),
        sonuc: (y) => ({ ozet: `${(y as { totalElements?: number })?.totalElements ?? 0} sipariş paketi` }) },
      { id: "stok", ad: "Stok ve fiyat güncelle", aciklama: "Barkoda göre adet ve satış fiyatı", sirlar: TY, alanlar: [{ ad: "barkod", etiket: "Barkod", zorunlu: true }, { ad: "adet", etiket: "Stok adedi", tur: "sayi", zorunlu: true }, { ad: "satis", etiket: "Satış fiyatı", tur: "sayi" }, { ad: "liste", etiket: "Liste fiyatı", tur: "sayi" }],
        istek: (g, s) => ({ yontem: "POST", url: `${tyTaban(s)}/inventory/sellers/${tyId(s)}/products/price-and-inventory`, basliklar: tyBas(s), json: { items: [dolu({ barcode: zorunlu(g, "barkod", "Barkod"), quantity: tamsayi(g.adet, 0, 0, 20_000), salePrice: Number(g.satis) > 0 ? Number(g.satis) : undefined, listPrice: Number(g.liste) > 0 ? Number(g.liste) : Number(g.satis) > 0 ? Number(g.satis) : undefined })] } }),
        sonuc: ozetAl("batchRequestId") },
      { id: "toplu-sonuc", ad: "Toplu işlem sonucunu getir", aciklama: "Fiyat ve stok güncellemesinin ürün ürün sonucu", okuma: true, sirlar: TY, alanlar: [{ ad: "islem", etiket: "İşlem kimliği (batchRequestId)", zorunlu: true, yer: "/ ile stok adımının çıktısı" }],
        istek: (g, s) => ({ yontem: "GET", url: `${tyTaban(s)}/product/sellers/${tyId(s)}/products/batch-requests/${enc(zorunlu(g, "islem", "İşlem kimliği"))}`, basliklar: tyBas(s) }) },
      { id: "paket-durumu", ad: "Paket durumunu bildir", aciklama: "Siparişi Hazırlanıyor ya da Faturalandı yap", sirlar: TY,
        alanlar: [{ ad: "paket", etiket: "Paket kimliği (shipmentPackageId)", zorunlu: true }, { ad: "kalemler", etiket: "Kalemler (JSON)", tur: "json", zorunlu: true, yer: "[{\"lineId\": 123, \"quantity\": 1}]", aciklama: "Sipariş listesindeki lines dizisinden id ve quantity" }, { ad: "durum", etiket: "Yeni durum", tur: "secim", secenekler: [{ id: "Picking", ad: "Hazırlanıyor" }, { id: "Invoiced", ad: "Faturalandı" }], varsayilan: "Picking" }, { ad: "faturaNo", etiket: "Fatura numarası (Faturalandı için)" }],
        istek: (g, s) => ({ yontem: "PUT", url: `${tyTaban(s)}/order/sellers/${tyId(s)}/shipment-packages/${enc(zorunlu(g, "paket", "Paket kimliği"))}`, basliklar: tyBas(s), json: { lines: liste(g.kalemler, "Kalemler").map((x) => { const o = nesne(x, "Kalem"); return { lineId: Number(o.lineId ?? o.id), quantity: Number(o.quantity ?? 1) }; }), params: t(g.durum) === "Invoiced" && t(g.faturaNo) ? { invoiceNumber: t(g.faturaNo) } : {}, status: t(g.durum) === "Invoiced" ? "Invoiced" : "Picking" } }) },
      { id: "urunler", ad: "Onaylı ürünleri listele", aciklama: "Barkod ya da stok koduyla ürün bul", okuma: true, sirlar: TY, alanlar: [{ ad: "barkod", etiket: "Barkod (isteğe bağlı)" }, { ad: "stokKodu", etiket: "Stok kodu (isteğe bağlı)" }, SAYFA],
        istek: (g, s) => ({ yontem: "GET", url: `${tyTaban(s)}/product/sellers/${tyId(s)}/products/approved${sorgu({ barcode: t(g.barkod), stockCode: t(g.stokKodu), page: 0, size: tamsayi(g.boyut, 50, 1, 100) })}`, basliklar: tyBas(s) }) },
      { id: "sorular", ad: "Müşteri sorularını listele", aciklama: "Yanıt bekleyen ürün soruları", okuma: true, sirlar: TY, alanlar: [{ ad: "durum", etiket: "Durum", tur: "secim", secenekler: [{ id: "WAITING_FOR_ANSWER", ad: "Yanıt bekliyor" }, { id: "ANSWERED", ad: "Yanıtlandı" }, { id: "REJECTED", ad: "Reddedildi" }], varsayilan: "WAITING_FOR_ANSWER" }, SAYFA],
        istek: (g, s) => ({ yontem: "GET", url: `${tyTaban(s)}/qna/sellers/${tyId(s)}/questions/filter${sorgu({ status: t(g.durum) || "WAITING_FOR_ANSWER", page: 0, size: tamsayi(g.boyut, 50, 1, 200), orderByDirection: "DESC" })}`, basliklar: tyBas(s) }) },
      { id: "soru-yanitla", ad: "Soruyu yanıtla", aciklama: "Mağaza adına yanıt (10 ile 2000 karakter)", sirlar: TY, alanlar: [{ ad: "soru", etiket: "Soru kimliği", zorunlu: true }, { ad: "yanit", etiket: "Yanıt", tur: "uzunMetin", zorunlu: true }],
        istek: (g, s) => { const y = zorunlu(g, "yanit", "Yanıt"); if (y.length < 10) throw new Error("Yanıt en az 10 karakter olmalı."); return { yontem: "POST", url: `${tyTaban(s)}/qna/sellers/${tyId(s)}/questions/${enc(zorunlu(g, "soru", "Soru kimliği"))}/answers`, basliklar: tyBas(s), json: { text: y.slice(0, 2000) } }; } },
    ],
  },
  {
    id: "n11", ad: "n11", logo: "/marka/baglanti/n11.svg", kategori: "E-ticaret", turkiye: true, aciklama: "Sipariş paketleri, onay, fiyat ve stok", belge: "https://developer.n11.com/",
    sirlar: [{ ad: "N11_APP_KEY", etiket: "API anahtarı (appKey)", nasil: "n11 Satıcı Paneli (so.n11.com), Hesabım, API Hesapları." }, { ad: "N11_APP_SECRET", etiket: "API şifresi (appSecret)", nasil: "Aynı sayfadaki appSecret." }],
    baglanti: [{ katalog: "n11", esle: { N11_APP_KEY: "alan:anahtar", N11_APP_SECRET: "alan:ek.appsecret" } }],
    eylemler: [
      { id: "siparisler", ad: "Sipariş paketlerini listele", aciklama: "Duruma göre, en çok 15 günlük aralık", okuma: true, sirlar: ["N11_APP_KEY", "N11_APP_SECRET"],
        alanlar: [{ ad: "durum", etiket: "Durum", tur: "secim", secenekler: [{ id: "Created", ad: "Yeni" }, { id: "Picking", ad: "Hazırlanıyor" }, { id: "Shipped", ad: "Kargoda" }, { id: "Delivered", ad: "Teslim edildi" }, { id: "Cancelled", ad: "İptal" }], varsayilan: "Created" }, { ad: "baslangic", etiket: "Başlangıç günü (isteğe bağlı)", yer: "2026-11-01" }, { ad: "bitis", etiket: "Bitiş günü (isteğe bağlı)", yer: "2026-11-06" }, SAYFA],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.n11.com/rest/delivery/v1/shipmentPackages${sorgu({ status: t(g.durum) || "Created", startDate: gunMs(g.baslangic), endDate: gunMs(g.bitis, true), page: 0, size: tamsayi(g.boyut, 50, 1, 100), orderByDirection: "DESC" })}`, basliklar: { appkey: s("N11_APP_KEY"), appsecret: s("N11_APP_SECRET") } }) },
      { id: "onayla", ad: "Sipariş kalemlerini onayla", aciklama: "Yeni kalemleri Hazırlanıyor durumuna alır", sirlar: ["N11_APP_KEY", "N11_APP_SECRET"], alanlar: [{ ad: "kalemler", etiket: "Kalem kimlikleri (virgülle)", zorunlu: true, yer: "orderLineId değerleri" }],
        istek: (g, s) => ({ yontem: "PUT", url: "https://api.n11.com/rest/order/v1/update", basliklar: { appkey: s("N11_APP_KEY"), appsecret: s("N11_APP_SECRET") }, json: { lines: virgul(g.kalemler).map((x) => ({ lineId: Number(x) })), status: "Picking" } }) },
      { id: "urunler", ad: "Ürünleri sorgula", aciklama: "Stok koduna ya da satış durumuna göre", okuma: true, sirlar: ["N11_APP_KEY", "N11_APP_SECRET"], alanlar: [{ ad: "stokKodu", etiket: "Stok kodu (isteğe bağlı)" }, { ad: "satis", etiket: "Satış durumu", tur: "secim", secenekler: [{ id: "", ad: "Hepsi" }, { id: "On_Sale", ad: "Satışta" }, { id: "Out_Of_Stock", ad: "Stokta yok" }] }, SAYFA],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.n11.com/ms/product-query${sorgu({ stockCode: t(g.stokKodu), saleStatus: t(g.satis), page: 0, size: tamsayi(g.boyut, 50, 1, 100) })}`, basliklar: { appkey: s("N11_APP_KEY"), appsecret: s("N11_APP_SECRET") } }) },
      { id: "fiyat-stok", ad: "Fiyat ve stok güncelle", aciklama: "Stok koduna göre; görev numarasıyla izlenir", sirlar: ["N11_APP_KEY", "N11_APP_SECRET"], alanlar: [{ ad: "stokKodu", etiket: "Stok kodu", zorunlu: true }, { ad: "adet", etiket: "Stok adedi", tur: "sayi" }, { ad: "satis", etiket: "Satış fiyatı", tur: "sayi" }, { ad: "liste", etiket: "Liste fiyatı", tur: "sayi" }, { ad: "entegrator", etiket: "Entegratör adı", yer: "Vayra", varsayilan: "Vayra" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.n11.com/ms/product/tasks/price-stock-update", basliklar: { appkey: s("N11_APP_KEY"), appsecret: s("N11_APP_SECRET") }, json: { payload: { integrator: t(g.entegrator) || "Vayra", skus: [dolu({ stockCode: zorunlu(g, "stokKodu", "Stok kodu"), quantity: t(g.adet) ? tamsayi(g.adet, 0, 0, 1e6) : undefined, salePrice: Number(g.satis) > 0 ? Number(g.satis) : undefined, listPrice: Number(g.liste) > 0 ? Number(g.liste) : Number(g.satis) > 0 ? Number(g.satis) : undefined, currencyType: "TL" })] } } }) },
      { id: "gorev", ad: "Toplu işlem sonucunu getir", aciklama: "Fiyat ve stok görevinin ürün bazlı sonucu", okuma: true, sirlar: ["N11_APP_KEY", "N11_APP_SECRET"], alanlar: [{ ad: "gorev", etiket: "Görev numarası (taskId)", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.n11.com/ms/product/task-details/page-query", basliklar: { appkey: s("N11_APP_KEY"), appsecret: s("N11_APP_SECRET") }, json: { taskId: Number(zorunlu(g, "gorev", "Görev numarası")), pageable: { page: 0, size: 100 } } }) },
    ],
  },
  {
    id: "ikas", ad: "ikas", logo: "/marka/baglanti/ikas.svg", kategori: "E-ticaret", turkiye: true, aciklama: "Siparişler, ürünler, stok, fiyat ve gönderim", belge: "https://ikas.dev/docs/api/getting-started/authentication",
    sirlar: [{ ad: "IKAS_MAGAZA", etiket: "Mağaza adı", nasil: "magazam.myikas.com adresindeki magazam kısmı." }, { ad: "IKAS_CLIENT_ID", etiket: "Client ID", nasil: "ikas yönetim paneli, Uygulamalar, Özel uygulama oluştur." }, { ad: "IKAS_CLIENT_SECRET", etiket: "Client Secret", nasil: "Aynı özel uygulamanın gizli anahtarı." }],
    baglanti: [{ katalog: "ikas", esle: { IKAS_MAGAZA: "sablon:magaza", IKAS_CLIENT_ID: "alan:istemci_id", IKAS_CLIENT_SECRET: "alan:istemci_gizli" } }],
    kimlik: { sirlar: ["IKAS_MAGAZA", "IKAS_CLIENT_ID", "IKAS_CLIENT_SECRET"], istek: (s) => ({ yontem: "POST", url: `https://${s("IKAS_MAGAZA").replace(/\.myikas\.com.*$/, "").replace(/[^\w-]/g, "")}.myikas.com/api/admin/oauth/token`, form: { grant_type: "client_credentials", client_id: s("IKAS_CLIENT_ID"), client_secret: s("IKAS_CLIENT_SECRET") } }), coz: (y) => { const o = y as { access_token?: string; expires_in?: number }; if (!o?.access_token) throw new Error("ikas belirteç vermedi; Client ID ve Secret'ı denetle."); return { degerler: { _IKAS_ERISIM: o.access_token }, omur: (o.expires_in ?? 14_400) * 1000 }; } },
    eylemler: [
      { id: "siparisler", ad: "Siparişleri listele", aciklama: "En yeni siparişler, durum ve kalemlerle", okuma: true, sirlar: ["_IKAS_ERISIM"], alanlar: [{ ad: "adet", etiket: "Kaç sipariş", tur: "sayi", varsayilan: "50", yer: "50" }],
        istek: (g, s) => ikasGql("query($p: PaginationInput) { listOrder(pagination: $p) { count hasNext data { id orderNumber status orderPackageStatus totalFinalPrice orderedAt customer { email } orderLineItems { id quantity variant { sku } } } } }", { p: { page: 1, limit: tamsayi(g.adet, 50, 1, 200) } })(s), sonuc: gqlHata },
      { id: "urunler", ad: "Ürünleri listele", aciklama: "Ürünler ve varyantları, fiyat ve stokla", okuma: true, sirlar: ["_IKAS_ERISIM"], alanlar: [{ ad: "adet", etiket: "Kaç ürün", tur: "sayi", varsayilan: "50", yer: "50" }],
        istek: (g, s) => ikasGql("query($p: PaginationInput) { listProduct(pagination: $p) { count hasNext data { id name variants { id sku } } } }", { p: { page: 1, limit: tamsayi(g.adet, 50, 1, 200) } })(s), sonuc: gqlHata },
      { id: "stok", ad: "Stok adedini güncelle", aciklama: "Varyantın bir depodaki stoğu", sirlar: ["_IKAS_ERISIM"], alanlar: [{ ad: "urun", etiket: "Ürün kimliği", zorunlu: true }, { ad: "varyant", etiket: "Varyant kimliği", zorunlu: true }, { ad: "depo", etiket: "Stok konumu kimliği", zorunlu: true }, { ad: "adet", etiket: "Stok adedi", tur: "sayi", zorunlu: true }],
        istek: (g, s) => ikasGql(`mutation { saveProductStockLocations(input: ${gqlDeger({ productStockLocationInputs: [{ productId: zorunlu(g, "urun", "Ürün kimliği"), variantId: zorunlu(g, "varyant", "Varyant kimliği"), stockLocationId: zorunlu(g, "depo", "Stok konumu"), stockCount: tamsayi(g.adet, 0, 0, 1e7) }] })}) }`)(s), sonuc: gqlHata },
      { id: "fiyat", ad: "Satış fiyatını güncelle", aciklama: "Varyantın satış ve alış fiyatı", sirlar: ["_IKAS_ERISIM"], alanlar: [{ ad: "urun", etiket: "Ürün kimliği", zorunlu: true }, { ad: "varyant", etiket: "Varyant kimliği", zorunlu: true }, { ad: "satis", etiket: "Satış fiyatı", tur: "sayi", zorunlu: true }, { ad: "alis", etiket: "Alış fiyatı", tur: "sayi" }, { ad: "fiyatListesi", etiket: "Fiyat listesi kimliği (isteğe bağlı)" }],
        istek: (g, s) => ikasGql("mutation($i: SaveVariantPricesInput!) { saveVariantPrices(input: $i) }", { i: dolu({ priceListId: t(g.fiyatListesi) || undefined, variantPriceInputs: [{ productId: zorunlu(g, "urun", "Ürün kimliği"), variantId: zorunlu(g, "varyant", "Varyant kimliği"), price: dolu({ sellPrice: sayi(g.satis, 0, 0, 1e9), buyPrice: t(g.alis) ? sayi(g.alis, 0, 0, 1e9) : undefined }) }] }) })(s), sonuc: gqlHata },
      { id: "gonder", ad: "Siparişi kargoya hazırla", aciklama: "Kalemleri paketle, takip numarasıyla", sirlar: ["_IKAS_ERISIM"], alanlar: [{ ad: "siparis", etiket: "Sipariş kimliği", zorunlu: true }, { ad: "kalemler", etiket: "Kalemler (JSON)", tur: "json", zorunlu: true, yer: "[{\"orderLineItemId\": \"…\", \"quantity\": 1}]" }, { ad: "firma", etiket: "Kargo firması (isteğe bağlı)", yer: "Yurtiçi Kargo" }, { ad: "takip", etiket: "Takip numarası (isteğe bağlı)" }, { ad: "bildir", etiket: "Müşteriye bildir", tur: "evet-hayir" }],
        istek: (g, s) => ikasGql("mutation($i: FulFillOrderInput!) { fulfillOrder(input: $i) { id orderNumber orderPackageStatus } }", { i: dolu({ orderId: zorunlu(g, "siparis", "Sipariş kimliği"), lines: liste(g.kalemler, "Kalemler"), markAsReadyForShipment: true, sendNotificationToCustomer: evet(g.bildir), trackingInfoDetail: t(g.takip) ? dolu({ trackingNumber: t(g.takip), cargoCompany: t(g.firma), isSendNotification: evet(g.bildir) }) : undefined }) })(s), sonuc: gqlHata },
    ],
  },
  {
    id: "ticimax", ad: "Ticimax", logo: "/marka/uyg/ticimax.svg", kategori: "E-ticaret", turkiye: true, aciklama: "Siparişler, kargo bilgisi ve stok (web servisleri)", belge: "https://static.ticimax.com/dokumanlar/SiparisServis.pdf",
    sirlar: [{ ad: "TICIMAX_SITE", etiket: "Mağaza adresi", nasil: "Ticimax mağazanın alan adı, ör. www.magazam.com." }, { ad: "TICIMAX_UYE_KODU", etiket: "Web servis yetki kodu (UyeKodu)", nasil: "Ticimax yönetim paneli, Ayarlar, Web Servis bölümünde tanımlanan yetki kodu." }],
    eylemler: [
      { id: "siparisler", ad: "Siparişleri listele", aciklama: "Entegrasyona aktarılmamış son siparişler", okuma: true, sirlar: ["TICIMAX_SITE", "TICIMAX_UYE_KODU"], alanlar: [{ ad: "aktarilan", etiket: "Hangileri", tur: "secim", secenekler: [{ id: "0", ad: "Aktarılmamışlar" }, { id: "1", ad: "Aktarılmışlar" }, { id: "-1", ad: "Hepsi" }], varsayilan: "0" }, { ad: "adet", etiket: "Kaç sipariş", tur: "sayi", varsayilan: "50", yer: "50" }],
        istek: (g, s) => tcxIstek(s, "SiparisServis", "SelectSiparis", `<f xmlns:a="${TCX_DC}"><a:EntegrasyonAktarildi>${tamsayi(g.aktarilan, 0, -1, 1)}</a:EntegrasyonAktarildi><a:IptalEdilmisUrunler>false</a:IptalEdilmisUrunler><a:KargoFirmaID>-1</a:KargoFirmaID><a:OdemeDurumu>-1</a:OdemeDurumu><a:OdemeTipi>-1</a:OdemeTipi><a:SiparisDurumu>-1</a:SiparisDurumu><a:SiparisID>-1</a:SiparisID><a:TedarikciID>-1</a:TedarikciID><a:UrunGetir>true</a:UrunGetir><a:UyeID>-1</a:UyeID></f><s xmlns:a="${TCX_DC}"><a:BaslangicIndex>0</a:BaslangicIndex><a:KayitSayisi>${tamsayi(g.adet, 50, 1, 500)}</a:KayitSayisi><a:SiralamaDegeri>id</a:SiralamaDegeri><a:SiralamaYonu>Desc</a:SiralamaYonu></s>`),
        sonuc: soapHata },
      { id: "kargoya-verildi", ad: "Siparişi kargoya verildi yap", aciklama: "Sipariş durumunu Kargoya verildi olarak işaretler", sirlar: ["TICIMAX_SITE", "TICIMAX_UYE_KODU"], alanlar: [{ ad: "siparis", etiket: "Sipariş kimliği (SiparisID)", zorunlu: true }],
        istek: (g, s) => tcxIstek(s, "SiparisServis", "SetSiparisKargoyaVerildi", `<siparisId>${tamsayi(zorunlu(g, "siparis", "Sipariş kimliği"), 0, 0, 2e9)}</siparisId>`), sonuc: soapHata },
      { id: "takip-no", ad: "Kargo takip numarası kaydet", aciklama: "Takip numarası ve bağlantısı", sirlar: ["TICIMAX_SITE", "TICIMAX_UYE_KODU"], alanlar: [{ ad: "siparis", etiket: "Sipariş kimliği", zorunlu: true }, { ad: "kargoKodu", etiket: "Kargo kodu", yer: "Ticimax'taki kargo firması kodu" }, { ad: "takip", etiket: "Takip numarası", zorunlu: true }, { ad: "link", etiket: "Takip bağlantısı (isteğe bağlı)" }],
        istek: (g, s) => tcxIstek(s, "SiparisServis", "SaveKargoTakipNo", `<siparisId>${tamsayi(zorunlu(g, "siparis", "Sipariş kimliği"), 0, 0, 2e9)}</siparisId><kargoKodu>${xk(g.kargoKodu)}</kargoKodu><kargoTakipNo>${xk(zorunlu(g, "takip", "Takip numarası"))}</kargoTakipNo><kargoTakipLink>${xk(g.link)}</kargoTakipLink><BarkodBilgisi></BarkodBilgisi><KargoTakipLinkGoster>${t(g.link) ? "true" : "false"}</KargoTakipLinkGoster>`), sonuc: soapHata },
      { id: "durum", ad: "Sipariş durumunu değiştir", aciklama: "Onaylandı, Paketleniyor, Teslim edildi gibi", sirlar: ["TICIMAX_SITE", "TICIMAX_UYE_KODU"],
        alanlar: [{ ad: "siparis", etiket: "Sipariş kimliği", zorunlu: true }, { ad: "durum", etiket: "Yeni durum", tur: "secim", secenekler: ["Onaylandi", "Paketleniyor", "TedarikEdiliyor", "KargoyaVerildi", "TeslimEdildi", "Iptal", "Iade"].map((x) => ({ id: x, ad: { Onaylandi: "Onaylandı", Paketleniyor: "Paketleniyor", TedarikEdiliyor: "Tedarik ediliyor", KargoyaVerildi: "Kargoya verildi", TeslimEdildi: "Teslim edildi", Iptal: "İptal", Iade: "İade" }[x]! })), varsayilan: "Onaylandi" }, { ad: "eposta", etiket: "Müşteriye e-posta gönder", tur: "evet-hayir" }],
        istek: (g, s) => tcxIstek(s, "SiparisServis", "SetSiparisDurum", `<request xmlns:a="${TCX_DC}"><a:Durum>${xk(t(g.durum) || "Onaylandi")}</a:Durum><a:MailBilgilendir>${evet(g.eposta)}</a:MailBilgilendir><a:SiparisID>${tamsayi(zorunlu(g, "siparis", "Sipariş kimliği"), 0, 0, 2e9)}</a:SiparisID></request>`), sonuc: soapHata },
      { id: "stok", ad: "Stok adedini güncelle", aciklama: "Varyasyon kimliğine göre", sirlar: ["TICIMAX_SITE", "TICIMAX_UYE_KODU"], alanlar: [{ ad: "varyasyon", etiket: "Varyasyon kimliği", zorunlu: true }, { ad: "adet", etiket: "Stok adedi", tur: "sayi", zorunlu: true }],
        istek: (g, s) => tcxIstek(s, "UrunServis", "StokAdediGuncelle", `<urunler xmlns:a="${TCX_DC}"><a:Varyasyon><a:ID>${tamsayi(zorunlu(g, "varyasyon", "Varyasyon kimliği"), 0, 0, 2e9)}</a:ID><a:StokAdedi>${tamsayi(g.adet, 0, 0, 1e7)}</a:StokAdedi></a:Varyasyon></urunler>`), sonuc: soapHata },
    ],
  },
  {
    id: "shopier", ad: "Shopier", logo: "/marka/baglanti/shopier.svg", kategori: "E-ticaret", turkiye: true, aciklama: "Siparişler, kargo ve iade", belge: "https://developer.shopier.com/reference/introduction",
    sirlar: [{ ad: "SHOPIER_TOKEN", etiket: "Kişisel erişim belirteci", nasil: "Shopier hesabı, Account, Personal Access Token (önce iki adımlı doğrulamayı aç)." }],
    baglanti: [{ katalog: "shopier", esle: { SHOPIER_TOKEN: "alan:anahtar" } }],
    eylemler: [
      { id: "siparisler", ad: "Siparişleri listele", aciklama: "Gönderilmemiş ya da tüm siparişler", okuma: true, sirlar: ["SHOPIER_TOKEN"], alanlar: [{ ad: "durum", etiket: "Teslimat", tur: "secim", secenekler: [{ id: "unfulfilled", ad: "Gönderilmemiş" }, { id: "fulfilled", ad: "Gönderilmiş" }, { id: "", ad: "Hepsi" }], varsayilan: "unfulfilled" }, SAYFA],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.shopier.com/v1/orders${sorgu({ fulfillmentStatus: t(g.durum), limit: tamsayi(g.boyut, 50, 1, 50), page: 1, sort: "dateDesc" })}`, basliklar: { Authorization: `Bearer ${s("SHOPIER_TOKEN")}` } }) },
      { id: "siparis", ad: "Siparişi getir", aciklama: "Alıcı, ürünler ve ödeme", okuma: true, sirlar: ["SHOPIER_TOKEN"], alanlar: [{ ad: "siparis", etiket: "Sipariş kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.shopier.com/v1/orders/${enc(zorunlu(g, "siparis", "Sipariş kimliği"))}`, basliklar: { Authorization: `Bearer ${s("SHOPIER_TOKEN")}` } }) },
      { id: "kargo", ad: "Siparişi kargoya ver", aciklama: "Kargo firması ve takip numarası", sirlar: ["SHOPIER_TOKEN"], alanlar: [{ ad: "siparis", etiket: "Sipariş kimliği", zorunlu: true }, { ad: "firma", etiket: "Kargo firması", tur: "secim", secenekler: ["yurtici", "mng", "aras", "ptt", "surat", "hepsijet", "ups", "dhl", "other"].map((x) => ({ id: x, ad: { yurtici: "Yurtiçi", mng: "MNG", aras: "Aras", ptt: "PTT", surat: "Sürat", hepsijet: "Hepsijet", ups: "UPS", dhl: "DHL", other: "Diğer" }[x]! })), varsayilan: "yurtici" }, { ad: "takip", etiket: "Takip numarası", zorunlu: true }],
        istek: (g, s) => ({ yontem: "PUT", url: `https://api.shopier.com/v1/orders/${enc(zorunlu(g, "siparis", "Sipariş kimliği"))}`, basliklar: { Authorization: `Bearer ${s("SHOPIER_TOKEN")}` }, json: { fulfillments: { productType: "physical", shippingCompany: t(g.firma) || "yurtici", trackingNumber: zorunlu(g, "takip", "Takip numarası") } } }) },
      { id: "iade", ad: "İade oluştur", aciklama: "Siparişe tam ya da kısmi iade", sirlar: ["SHOPIER_TOKEN"], alanlar: [{ ad: "siparis", etiket: "Sipariş kimliği", zorunlu: true }, { ad: "tutar", etiket: "Tutar", tur: "sayi", zorunlu: true }, { ad: "not", etiket: "Alıcıya not" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.shopier.com/v1/refunds", basliklar: { Authorization: `Bearer ${s("SHOPIER_TOKEN")}` }, json: dolu({ orderId: zorunlu(g, "siparis", "Sipariş kimliği"), amount: String(sayi(g.tutar, 0, 0, 1e9)), note: t(g.not) }) }) },
    ],
  },
  {
    id: "iyzico", ad: "iyzico", logo: "/marka/baglanti/iyzico.svg", kategori: "Ödeme", turkiye: true, aciklama: "Ödeme sorgu, iade, taksit ve ödeme bağlantıları", belge: "https://docs.iyzico.com/",
    sirlar: [{ ad: "IYZICO_API_KEY", etiket: "API anahtarı", nasil: "iyzico Merchant Panel, Ayarlar, Firma Ayarları, API Anahtarları." }, { ad: "IYZICO_SECRET_KEY", etiket: "Gizli anahtar", nasil: "Aynı sayfadaki güvenlik anahtarı." }, { ad: "IYZICO_ORTAM", etiket: "Ortam", nasil: "Canlı için canli yaz; boşsa test (sandbox) ortamı kullanılır.", istege: true }],
    baglanti: [{ katalog: "iyzico", esle: { IYZICO_API_KEY: "alan:api_key", IYZICO_SECRET_KEY: "alan:secret_key", IYZICO_ORTAM: "alan:ortam" } }],
    eylemler: [
      { id: "odeme", ad: "Ödemeyi sorgula", aciklama: "paymentId ya da sipariş numarasıyla ayrıntı", okuma: true, sirlar: IYZ, alanlar: [{ ad: "odeme", etiket: "Ödeme kimliği (paymentId)" }, { ad: "siparis", etiket: "Sipariş numarası (paymentConversationId)" }],
        istek: (g, s) => { if (!t(g.odeme) && !t(g.siparis)) throw new Error("Ödeme kimliği ya da sipariş numarası yaz."); return iyzico(s, "/payment/detail", { ...iyzOrtak(), ...(t(g.odeme) ? { paymentId: t(g.odeme) } : { paymentConversationId: t(g.siparis) }) }); }, sonuc: iyziSonuc },
      { id: "iade", ad: "İade et", aciklama: "Ödeme kalemine tam ya da kısmi iade", sirlar: IYZ, alanlar: [{ ad: "islem", etiket: "Ödeme kalemi kimliği (paymentTransactionId)", zorunlu: true }, { ad: "tutar", etiket: "Tutar", tur: "sayi", zorunlu: true }, { ad: "ip", etiket: "İstemci IP", yer: "85.34.78.112", varsayilan: "85.34.78.112" }],
        istek: (g, s) => iyzico(s, "/payment/refund", { ...iyzOrtak(), paymentTransactionId: zorunlu(g, "islem", "Ödeme kalemi kimliği"), price: String(sayi(g.tutar, 0, 0, 1e9)), currency: "TRY", ip: t(g.ip) || "85.34.78.112" }), sonuc: iyziSonuc },
      { id: "taksit", ad: "Taksit seçeneklerini getir", aciklama: "Tutara ve kartın ilk hanelerine göre", okuma: true, sirlar: IYZ, alanlar: [{ ad: "tutar", etiket: "Tutar", tur: "sayi", zorunlu: true }, { ad: "bin", etiket: "Kartın ilk 6 ya da 8 hanesi (isteğe bağlı)" }],
        istek: (g, s) => iyzico(s, "/payment/iyzipos/installment", { ...iyzOrtak(), price: String(sayi(g.tutar, 0, 0, 1e9)), ...(/^\d{6,8}$/.test(t(g.bin)) ? { binNumber: t(g.bin) } : {}) }), sonuc: iyziSonuc },
      { id: "bin", ad: "Kart bilgisini sorgula", aciklama: "Banka, kart türü ve ailesi", okuma: true, sirlar: IYZ, alanlar: [{ ad: "bin", etiket: "Kartın ilk 6 ya da 8 hanesi", zorunlu: true }],
        istek: (g, s) => { const b = zorunlu(g, "bin", "Kartın ilk haneleri"); if (!/^\d{6,8}$/.test(b)) throw new Error("6 ya da 8 hane yaz."); return iyzico(s, "/payment/bin/check", { ...iyzOrtak(), binNumber: b }); }, sonuc: iyziSonuc },
      { id: "baglantilar", ad: "Ödeme bağlantılarını listele", aciklama: "iyzilink ürünleri", okuma: true, sirlar: IYZ, alanlar: [{ ad: "adet", etiket: "Kaç kayıt", tur: "sayi", varsayilan: "20", yer: "20" }],
        istek: (g, s) => { const o = iyzOrtak(); return iyzico(s, "/v2/iyzilink/products", undefined, sorgu({ locale: o.locale, conversationId: o.conversationId, page: 1, count: tamsayi(g.adet, 20, 1, 100) })); }, sonuc: iyziSonuc },
    ],
  },
  {
    id: "paytr", ad: "PayTR", logo: "/marka/baglanti/paytr.svg", kategori: "Ödeme", turkiye: true, aciklama: "Ödeme durumu, iade ve ödeme linkleri", belge: "https://dev.paytr.com/",
    sirlar: [{ ad: "PAYTR_MERCHANT_ID", etiket: "Mağaza no", nasil: "PayTR Mağaza Paneli, Destek ve Kurulum, Entegrasyon Bilgileri." }, { ad: "PAYTR_MERCHANT_KEY", etiket: "Mağaza parolası", nasil: "Aynı sayfadaki merchant_key." }, { ad: "PAYTR_MERCHANT_SALT", etiket: "Mağaza gizli anahtarı", nasil: "Aynı sayfadaki merchant_salt." }],
    baglanti: [{ katalog: "paytr", esle: { PAYTR_MERCHANT_ID: "alan:merchant_id", PAYTR_MERCHANT_KEY: "alan:merchant_key", PAYTR_MERCHANT_SALT: "alan:merchant_salt" } }],
    eylemler: [
      { id: "durum", ad: "Ödeme durumunu sorgula", aciklama: "Sipariş numarasına göre", okuma: true, sirlar: PTR, alanlar: [{ ad: "siparis", etiket: "Sipariş numarası (merchant_oid)", zorunlu: true }],
        istek: (g, s) => { const oid = zorunlu(g, "siparis", "Sipariş numarası"); return paytr(s, "https://www.paytr.com/odeme/durum-sorgu", { merchant_oid: oid }, s("PAYTR_MERCHANT_ID") + oid); }, sonuc: paytrSonuc },
      { id: "iade", ad: "İade et", aciklama: "Siparişe tam ya da kısmi iade", sirlar: PTR, alanlar: [{ ad: "siparis", etiket: "Sipariş numarası", zorunlu: true }, { ad: "tutar", etiket: "İade tutarı (TL)", tur: "sayi", zorunlu: true, yer: "149.90" }],
        istek: (g, s) => { const oid = zorunlu(g, "siparis", "Sipariş numarası"); const tutar = sayi(g.tutar, 0, 0, 1e9).toFixed(2); return paytr(s, "https://www.paytr.com/odeme/iade", { merchant_oid: oid, return_amount: tutar }, s("PAYTR_MERCHANT_ID") + oid + tutar); }, sonuc: paytrSonuc },
      { id: "link", ad: "Ödeme linki oluştur", aciklama: "Ürün linki, taksit seçeneğiyle", sirlar: PTR, alanlar: [{ ad: "ad", etiket: "Ürün ya da hizmet adı", zorunlu: true }, { ad: "tutar", etiket: "Tutar (TL)", tur: "sayi", zorunlu: true }, { ad: "taksit", etiket: "En çok taksit", tur: "sayi", varsayilan: "1", yer: "1" }],
        istek: (g, s) => { const name = zorunlu(g, "ad", "Ad").slice(0, 200); if (name.length < 4) throw new Error("Ad en az 4 karakter olmalı."); const price = String(Math.round(sayi(g.tutar, 0, 0, 1e9) * 100)), currency = "TL", max_installment = String(tamsayi(g.taksit, 1, 1, 12)), link_type = "product", lang = "tr", min_count = "1"; return paytr(s, "https://www.paytr.com/odeme/api/link/create", { name, price, currency, max_installment, link_type, lang, min_count }, name + price + currency + max_installment + link_type + lang + min_count); },
        sonuc: (y) => ({ ...paytrSonuc(y), ozet: m((y as { link?: string })?.link) || undefined }) },
      { id: "link-sil", ad: "Ödeme linkini sil", aciklama: "Link kimliğiyle", sirlar: PTR, alanlar: [{ ad: "link", etiket: "Link kimliği", zorunlu: true }],
        istek: (g, s) => { const id = zorunlu(g, "link", "Link kimliği"); return paytr(s, "https://www.paytr.com/odeme/api/link/delete", { id }, id + s("PAYTR_MERCHANT_ID")); }, sonuc: paytrSonuc },
      { id: "dokum", ad: "İşlem dökümünü getir", aciklama: "Gün aralığındaki ödemeler", okuma: true, sirlar: PTR, alanlar: [{ ad: "baslangic", etiket: "Başlangıç günü", zorunlu: true, yer: "2026-11-01" }, { ad: "bitis", etiket: "Bitiş günü", zorunlu: true, yer: "2026-11-06" }],
        istek: (g, s) => { const a = `${zorunlu(g, "baslangic", "Başlangıç").slice(0, 10)} 00:00:00`, b = `${zorunlu(g, "bitis", "Bitiş").slice(0, 10)} 23:59:59`; return paytr(s, "https://www.paytr.com/rapor/islem-dokumu", { start_date: a, end_date: b }, s("PAYTR_MERCHANT_ID") + a + b); }, sonuc: paytrSonuc },
    ],
  },
  {
    id: "parasut", ad: "Paraşüt", logo: "/marka/baglanti/parasut.png", kategori: "Muhasebe", turkiye: true, aciklama: "Cari, ürün, satış faturası, e-Arşiv ve e-Fatura", belge: "https://devhub.parasut.com/",
    sirlar: [{ ad: "PARASUT_FIRMA_NO", etiket: "Firma numarası", nasil: "Paraşüt adres çubuğunda uygulama.parasut.com/<firma numarası> olarak görünür." }, { ad: "PARASUT_CLIENT_ID", etiket: "Client ID", nasil: "Paraşüt destekten alınan API uygulama kimliği; Bağlantılar'da Paraşüt bağlıysa gerekmez.", istege: true }, { ad: "PARASUT_CLIENT_SECRET", etiket: "Client Secret", nasil: "Aynı uygulamanın gizli anahtarı.", istege: true }, { ad: "PARASUT_REFRESH_TOKEN", etiket: "Yenileme belirteci", nasil: "OAuth girişinden alınan refresh_token; her yenilemede Vayra yeni değeri bu sırra kendisi yazar.", istege: true }],
    baglanti: [{ katalog: "parasut", esle: { PARASUT_FIRMA_NO: "alan:firma_no", _PARASUT_ERISIM: "oauth" } }],
    kimlik: { sirlar: ["PARASUT_CLIENT_ID", "PARASUT_CLIENT_SECRET", "PARASUT_REFRESH_TOKEN"], istek: (s) => ({ yontem: "POST", url: "https://id.parasut.com/realms/parasut/protocol/openid-connect/token", form: { grant_type: "refresh_token", client_id: s("PARASUT_CLIENT_ID"), client_secret: s("PARASUT_CLIENT_SECRET"), refresh_token: s("PARASUT_REFRESH_TOKEN") } }),
      coz: (y, s) => { const o = y as { access_token?: string; expires_in?: number; refresh_token?: string }; if (!o?.access_token) throw new Error("Paraşüt belirteç vermedi; yenileme belirtecini yenile."); return { degerler: { _PARASUT_ERISIM: o.access_token }, omur: (o.expires_in ?? 7200) * 1000, ...(o.refresh_token && o.refresh_token !== s("PARASUT_REFRESH_TOKEN") ? { yeniSirlar: { PARASUT_REFRESH_TOKEN: o.refresh_token } } : {}) }; } },
    eylemler: [
      { id: "cari", ad: "Müşteri ya da tedarikçi oluştur", aciklama: "Ad, vergi bilgisi ve iletişim", sirlar: PRS, alanlar: [{ ad: "ad", etiket: "Ad ya da unvan", zorunlu: true }, { ad: "tur", etiket: "Hesap türü", tur: "secim", secenekler: [{ id: "customer", ad: "Müşteri" }, { id: "supplier", ad: "Tedarikçi" }], varsayilan: "customer" }, { ad: "kisi", etiket: "Kişi mi şirket mi", tur: "secim", secenekler: [{ id: "person", ad: "Kişi" }, { id: "company", ad: "Şirket" }], varsayilan: "person" }, { ad: "eposta", etiket: "E-posta" }, { ad: "telefon", etiket: "Telefon" }, { ad: "vergiNo", etiket: "Vergi ya da TC kimlik no" }, { ad: "vergiDairesi", etiket: "Vergi dairesi" }, { ad: "sehir", etiket: "Şehir" }, { ad: "ilce", etiket: "İlçe" }, { ad: "adres", etiket: "Adres", tur: "uzunMetin" }],
        istek: (g, s) => prs(s, "POST", "/contacts", { data: { type: "contacts", attributes: dolu({ name: zorunlu(g, "ad", "Ad"), account_type: t(g.tur) === "supplier" ? "supplier" : "customer", contact_type: t(g.kisi) === "company" ? "company" : "person", email: t(g.eposta), phone: t(g.telefon), tax_number: t(g.vergiNo), tax_office: t(g.vergiDairesi), city: t(g.sehir), district: t(g.ilce), address: t(g.adres) }) } }), sonuc: prsId },
      { id: "cari-ara", ad: "Cari ara", aciklama: "Ada, e-postaya ya da vergi numarasına göre", okuma: true, sirlar: PRS, alanlar: [{ ad: "ad", etiket: "Ad" }, { ad: "eposta", etiket: "E-posta" }, { ad: "vergiNo", etiket: "Vergi numarası" }],
        istek: (g, s) => prs(s, "GET", `/contacts${sorgu({ "filter[name]": t(g.ad), "filter[email]": t(g.eposta), "filter[tax_number]": t(g.vergiNo), "page[size]": 25 })}`) },
      { id: "urun", ad: "Ürün oluştur", aciklama: "Ad, kod, KDV ve satış fiyatı", sirlar: PRS, alanlar: [{ ad: "ad", etiket: "Ürün adı", zorunlu: true }, { ad: "kod", etiket: "Ürün kodu" }, { ad: "fiyat", etiket: "Satış fiyatı (KDV hariç)", tur: "sayi" }, { ad: "kdv", etiket: "KDV oranı", tur: "secim", secenekler: ["20", "10", "1", "0"].map((x) => ({ id: x, ad: `yüzde ${x}` })), varsayilan: "20" }, { ad: "birim", etiket: "Birim", yer: "Adet", varsayilan: "Adet" }],
        istek: (g, s) => prs(s, "POST", "/products", { data: { type: "products", attributes: dolu({ name: zorunlu(g, "ad", "Ürün adı"), code: t(g.kod), list_price: t(g.fiyat) ? sayi(g.fiyat, 0, 0, 1e9) : undefined, vat_rate: Number(t(g.kdv) || 20), unit: t(g.birim) || "Adet", currency: "TRL" }) } }), sonuc: prsId },
      { id: "fatura", ad: "Satış faturası oluştur", aciklama: "Cariye kalemli fatura (e-Arşiv ya da e-Fatura için önce bu)", sirlar: PRS,
        alanlar: [{ ad: "cari", etiket: "Cari kimliği", zorunlu: true }, { ad: "tarih", etiket: "Fatura tarihi", yer: "2026-11-06" }, { ad: "aciklama", etiket: "Açıklama" }, { ad: "kalemler", etiket: "Kalemler (JSON)", tur: "json", zorunlu: true, yer: "[{\"urun\": \"123\", \"adet\": 1, \"fiyat\": 100, \"kdv\": 20}]", aciklama: "urun: Paraşüt ürün kimliği; fiyat KDV hariç birim fiyat" }, { ad: "referans", etiket: "Tekil referans (isteğe bağlı)", yer: "/ ile sipariş numarası", aciklama: "Aynı referansla ikinci fatura kesilmez" }],
        istek: (g, s) => { const k = liste(g.kalemler, "Kalemler").map((x) => nesne(x, "Kalem")); if (!k.length) throw new Error("En az bir kalem ekle."); return prs(s, "POST", "/sales_invoices", { data: { type: "sales_invoices", attributes: dolu({ item_type: "invoice", issue_date: t(g.tarih).slice(0, 10) || trGun(), description: t(g.aciklama), currency: "TRL" }), relationships: dolu({ contact: { data: { id: zorunlu(g, "cari", "Cari kimliği"), type: "contacts" } }, details: { data: k.map((x) => ({ type: "sales_invoice_details", attributes: dolu({ quantity: sayi(x.adet ?? x.quantity, 1, 0, 1e9), unit_price: sayi(x.fiyat ?? x.unit_price, 0, 0, 1e12), vat_rate: sayi(x.kdv ?? x.vat_rate, 20, 0, 100), description: t(x.aciklama ?? x.description) }), ...(t(x.urun ?? x.product) ? { relationships: { product: { data: { id: t(x.urun ?? x.product), type: "products" } } } } : {}) })) }, external_reference_key: t(g.referans) ? { data: { id: t(g.referans), type: "external_reference_keys" } } : undefined }) } }); }, sonuc: prsId },
      { id: "faturalar", ad: "Satış faturalarını listele", aciklama: "Cariye ya da ödeme durumuna göre", okuma: true, sirlar: PRS, alanlar: [{ ad: "cari", etiket: "Cari kimliği (isteğe bağlı)" }, { ad: "odeme", etiket: "Ödeme durumu", tur: "secim", secenekler: [{ id: "", ad: "Hepsi" }, { id: "overdue", ad: "Gecikmiş" }, { id: "not_due", ad: "Vadesi gelmemiş" }, { id: "paid", ad: "Ödenmiş" }] }],
        istek: (g, s) => prs(s, "GET", `/sales_invoices${sorgu({ "filter[contact_id]": t(g.cari), "filter[payment_status]": t(g.odeme), sort: "-issue_date", "page[size]": 25, include: "contact" })}`) },
      { id: "e-arsiv", ad: "e-Arşiv fatura oluştur", aciklama: "Satış faturasını e-Arşive gönderir; iş kimliği döner", sirlar: PRS,
        alanlar: [{ ad: "fatura", etiket: "Satış faturası kimliği", zorunlu: true, yer: "/ ile fatura adımının çıktısı" }, { ad: "internet", etiket: "İnternet satışı", tur: "evet-hayir", aciklama: "İnternetten satışta site ve ödeme bilgisi zorunlu" }, { ad: "site", etiket: "Satış sitesi", yer: "https://magazam.com" }, { ad: "odemeTipi", etiket: "Ödeme tipi", tur: "secim", secenekler: [{ id: "KREDIKARTI/BANKAKARTI", ad: "Kredi ya da banka kartı" }, { id: "EFT/HAVALE", ad: "EFT ya da havale" }, { id: "KAPIDAODEME", ad: "Kapıda ödeme" }, { id: "ODEMEARACISI", ad: "Ödeme aracısı" }], varsayilan: "KREDIKARTI/BANKAKARTI" }, { ad: "platform", etiket: "Ödeme platformu", yer: "iyzico" }, { ad: "odemeTarihi", etiket: "Ödeme tarihi", yer: "2026-11-06" }, { ad: "not", etiket: "Fatura notu" }],
        istek: (g, s) => prs(s, "POST", "/e_archives", { data: { type: "e_archives", attributes: dolu({ note: t(g.not), internet_sale: evet(g.internet) ? dolu({ url: t(g.site), payment_type: t(g.odemeTipi) || "KREDIKARTI/BANKAKARTI", payment_platform: t(g.platform), payment_date: t(g.odemeTarihi).slice(0, 10) || trGun() }) : undefined }), relationships: { sales_invoice: { data: { id: zorunlu(g, "fatura", "Fatura kimliği"), type: "sales_invoices" } } } } }), sonuc: prsId },
      { id: "e-fatura", ad: "e-Fatura gönder", aciklama: "e-Fatura mükellefine satış faturasını gönderir", sirlar: PRS, alanlar: [{ ad: "fatura", etiket: "Satış faturası kimliği", zorunlu: true }, { ad: "senaryo", etiket: "Senaryo", tur: "secim", secenekler: [{ id: "basic", ad: "Temel" }, { id: "commercial", ad: "Ticari" }], varsayilan: "basic" }, { ad: "kutu", etiket: "Alıcının gelen kutusu (isteğe bağlı)", aciklama: "Boşsa varsayılan etiket kullanılır; Gelen kutusunu sorgula eylemiyle bulunur" }, { ad: "not", etiket: "Fatura notu" }],
        istek: (g, s) => prs(s, "POST", "/e_invoices", { data: { type: "e_invoices", attributes: dolu({ scenario: t(g.senaryo) === "commercial" ? "commercial" : "basic", to: t(g.kutu), note: t(g.not) }), relationships: { invoice: { data: { id: zorunlu(g, "fatura", "Fatura kimliği"), type: "sales_invoices" } } } } }), sonuc: prsId },
      { id: "gelen-kutusu", ad: "e-Fatura gelen kutusunu sorgula", aciklama: "Vergi numarasının e-Fatura mükellefi olup olmadığı", okuma: true, sirlar: PRS, alanlar: [{ ad: "vkn", etiket: "Vergi ya da TC kimlik no", zorunlu: true }],
        istek: (g, s) => prs(s, "GET", `/e_invoice_inboxes${sorgu({ "filter[vkn]": zorunlu(g, "vkn", "Vergi numarası") })}`) },
      { id: "tahsilat", ad: "Tahsilat ekle", aciklama: "Faturaya kasa ya da banka hesabından tahsilat", sirlar: PRS, alanlar: [{ ad: "fatura", etiket: "Satış faturası kimliği", zorunlu: true }, { ad: "hesap", etiket: "Kasa ya da banka hesabı kimliği", zorunlu: true }, { ad: "tutar", etiket: "Tutar", tur: "sayi", zorunlu: true }, { ad: "tarih", etiket: "Tarih", yer: "2026-11-06" }, { ad: "aciklama", etiket: "Açıklama" }],
        istek: (g, s) => prs(s, "POST", `/sales_invoices/${enc(zorunlu(g, "fatura", "Fatura kimliği"))}/payments`, { data: { type: "payments", attributes: dolu({ account_id: Number(zorunlu(g, "hesap", "Hesap kimliği")), amount: sayi(g.tutar, 0, 0, 1e12), date: t(g.tarih).slice(0, 10) || trGun(), description: t(g.aciklama) }) } }) },
      { id: "is", ad: "e-Belge işinin durumunu sorgula", aciklama: "e-Arşiv ve e-Fatura gönderiminin sonucu", okuma: true, sirlar: PRS, alanlar: [{ ad: "is", etiket: "İş kimliği (trackable_job)", zorunlu: true }],
        istek: (g, s) => prs(s, "GET", `/trackable_jobs/${enc(zorunlu(g, "is", "İş kimliği"))}`), sonuc: ozetAl("data.attributes.status") },
    ],
  },
  {
    id: "papara", ad: "Papara", logo: "/marka/baglanti/papara.png", kategori: "Ödeme", turkiye: true, aciklama: "Hesap, hareketler ve ödeme linkleri", belge: "https://merchant-api.papara.com",
    sirlar: [{ ad: "PAPARA_API_KEY", etiket: "API anahtarı", nasil: "Papara Üye İşyeri Paneli, API Key; IP kısıtı varsa sunucu IP adresini ekle." }],
    baglanti: [{ katalog: "papara", esle: { PAPARA_API_KEY: "alan:anahtar" } }],
    eylemler: [
      { id: "hesap", ad: "Hesap bilgisi ve bakiye", aciklama: "Üye işyeri hesabı", okuma: true, sirlar: ["PAPARA_API_KEY"], alanlar: [], istek: (_g, s) => ({ yontem: "GET", url: "https://merchant-api.papara.com/account", basliklar: { ApiKey: s("PAPARA_API_KEY") } }) },
      { id: "link", ad: "Ödeme linki oluştur", aciklama: "Tutar, ad ve açıklamayla; SMS ile gönderilebilir", sirlar: ["PAPARA_API_KEY"], alanlar: [{ ad: "tutar", etiket: "Tutar", tur: "sayi", zorunlu: true }, { ad: "ad", etiket: "Kişinin adı soyadı", zorunlu: true }, { ad: "aciklama", etiket: "Açıklama", zorunlu: true }, { ad: "urun", etiket: "Ürün adı" }, { ad: "telefon", etiket: "SMS gönderilecek telefon (isteğe bağlı)", yer: "+905321234567" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://merchant-api.papara.com/paymentlinks/create", basliklar: { ApiKey: s("PAPARA_API_KEY") }, json: dolu({ amount: sayi(g.tutar, 0, 0, 1e9), nameSurname: zorunlu(g, "ad", "Ad soyad"), description: zorunlu(g, "aciklama", "Açıklama").slice(0, 500), productName: t(g.urun), currency: 0, isSendSmsNotification: !!t(g.telefon), smsNotificationPhoneNumber: t(g.telefon) }) }) },
      { id: "linkler", ad: "Ödeme linklerini listele", aciklama: "Tarih aralığına göre", okuma: true, sirlar: ["PAPARA_API_KEY"], alanlar: [{ ad: "baslangic", etiket: "Başlangıç günü", yer: "2026-11-01" }, { ad: "bitis", etiket: "Bitiş günü", yer: "2026-11-06" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://merchant-api.papara.com/paymentlinks", basliklar: { ApiKey: s("PAPARA_API_KEY") }, json: { page: 1, pageSize: 50, startDate: t(g.baslangic).slice(0, 10) || trGun(-30), endDate: t(g.bitis).slice(0, 10) || trGun() } }) },
      { id: "link-iptal", ad: "Ödeme linkini iptal et", aciklama: "Link kimliğiyle", sirlar: ["PAPARA_API_KEY"], alanlar: [{ ad: "link", etiket: "Link kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: "https://merchant-api.papara.com/paymentlinks/cancel", basliklar: { ApiKey: s("PAPARA_API_KEY") }, json: { paymentLinkId: Number(zorunlu(g, "link", "Link kimliği")) } }) },
    ],
  },
  {
    id: "bizimhesap", ad: "BizimHesap", logo: "/marka/baglanti/bizimhesap.svg", kategori: "Muhasebe", turkiye: true, aciklama: "Ürünler, depolar ve fatura", belge: "https://apidocs.bizimhesap.com/",
    sirlar: [{ ad: "BIZIMHESAP_TOKEN", etiket: "B2B API belirteci", nasil: "BizimHesap hesabına ait B2B API token (Token başlığı)." }, { ad: "BIZIMHESAP_FIRMA", etiket: "Firma kimliği", nasil: "BizimHesap'ın verdiği firma kimliği (fatura eklemek için).", istege: true }],
    baglanti: [{ katalog: "bizimhesap", esle: { BIZIMHESAP_TOKEN: "alan:anahtar" } }],
    eylemler: [
      { id: "urunler", ad: "Ürünleri listele", aciklama: "Fiyat ve stok bilgisiyle", okuma: true, sirlar: ["BIZIMHESAP_TOKEN"], alanlar: [], istek: (_g, s) => ({ yontem: "GET", url: "https://bizimhesap.com/api/b2b/products", basliklar: { Token: s("BIZIMHESAP_TOKEN"), Key: "BZMHB2B724018943908D0B82491F203F" } }) },
      { id: "depo", ad: "Depo stoğunu getir", aciklama: "Depo kimliğiyle ürün adetleri", okuma: true, sirlar: ["BIZIMHESAP_TOKEN"], alanlar: [{ ad: "depo", etiket: "Depo kimliği", zorunlu: true }], istek: (g, s) => ({ yontem: "GET", url: `https://bizimhesap.com/api/b2b/inventory/${enc(zorunlu(g, "depo", "Depo kimliği"))}`, basliklar: { Token: s("BIZIMHESAP_TOKEN"), Key: "BZMHB2B724018943908D0B82491F203F" } }) },
      { id: "fatura", ad: "Satış faturası ekle", aciklama: "Müşteri, kalemler ve tutarlarla (BizimHesap JSON)", sirlar: ["BIZIMHESAP_TOKEN", "BIZIMHESAP_FIRMA"], alanlar: [{ ad: "fatura", etiket: "Fatura (JSON)", tur: "json", zorunlu: true, yer: "{\"invoiceNo\": \"A-1\", \"customer\": {…}, \"details\": […], \"amounts\": {…}}", aciklama: "Alanlar apidocs.bizimhesap.com addinvoice belgesindeki gibidir; firmId ve invoiceType kendiliğinden eklenir" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://bizimhesap.com/api/b2b/addinvoice", basliklar: { Token: s("BIZIMHESAP_TOKEN"), Key: "BZMHB2B724018943908D0B82491F203F" }, json: { firmId: s("BIZIMHESAP_FIRMA"), invoiceType: 3, ...nesne(g.fatura, "Fatura") } }) },
    ],
  },
  {
    id: "nilvera", ad: "Nilvera", logo: "/marka/baglanti/nilvera.svg", kategori: "Muhasebe", turkiye: true, aciklama: "e-Fatura gelen ve giden kutusu, mükellef sorgusu", belge: "https://developer.nilvera.com/",
    sirlar: [{ ad: "NILVERA_TOKEN", etiket: "API anahtarı", nasil: "Nilvera Portal, API Tanımları, Yeni Anahtar." }],
    baglanti: [{ katalog: "nilvera", esle: { NILVERA_TOKEN: "alan:anahtar" } }],
    eylemler: [
      { id: "gelen", ad: "Gelen e-faturaları listele", aciklama: "Tarih aralığı ve aramayla", okuma: true, sirlar: ["NILVERA_TOKEN"], alanlar: [{ ad: "baslangic", etiket: "Başlangıç günü", yer: "2026-11-01" }, { ad: "bitis", etiket: "Bitiş günü", yer: "2026-11-06" }, { ad: "ara", etiket: "Arama" }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.nilvera.com/einvoice/Purchase${sorgu({ Page: 1, PageSize: 50, StartDate: t(g.baslangic), EndDate: t(g.bitis), Search: t(g.ara) })}`, basliklar: { Authorization: `Bearer ${s("NILVERA_TOKEN")}` } }) },
      { id: "giden", ad: "Giden e-faturaları listele", aciklama: "Tarih aralığı ve aramayla", okuma: true, sirlar: ["NILVERA_TOKEN"], alanlar: [{ ad: "baslangic", etiket: "Başlangıç günü", yer: "2026-11-01" }, { ad: "bitis", etiket: "Bitiş günü", yer: "2026-11-06" }, { ad: "ara", etiket: "Arama" }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.nilvera.com/einvoice/Sale${sorgu({ Page: 1, PageSize: 50, StartDate: t(g.baslangic), EndDate: t(g.bitis), Search: t(g.ara) })}`, basliklar: { Authorization: `Bearer ${s("NILVERA_TOKEN")}` } }) },
      { id: "yanitla", ad: "Gelen faturayı kabul ya da reddet", aciklama: "Ticari faturaya yanıt", sirlar: ["NILVERA_TOKEN"], alanlar: [{ ad: "ettn", etiket: "Faturanın ETTN numarası", zorunlu: true }, { ad: "karar", etiket: "Karar", tur: "secim", secenekler: [{ id: "approved", ad: "Kabul" }, { id: "rejected", ad: "Red" }], varsayilan: "approved" }, { ad: "neden", etiket: "Red gerekçesi" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.nilvera.com/einvoice/Purchase/SendAnswer", basliklar: { Authorization: `Bearer ${s("NILVERA_TOKEN")}` }, json: dolu({ UUID: zorunlu(g, "ettn", "ETTN"), AnswerCode: t(g.karar) === "rejected" ? "rejected" : "approved", RejectNote: t(g.neden) }) }) },
      { id: "mukellef", ad: "e-Fatura mükellefi mi sorgula", aciklama: "Vergi numarasına göre", okuma: true, sirlar: ["NILVERA_TOKEN"], alanlar: [{ ad: "vkn", etiket: "Vergi ya da TC kimlik no", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.nilvera.com/general/GlobalCompany/Check/TaxNumber/${enc(zorunlu(g, "vkn", "Vergi numarası"))}?globalUserType=Invoice`, basliklar: { Authorization: `Bearer ${s("NILVERA_TOKEN")}` } }) },
    ],
  },
  {
    id: "mikro", ad: "Mikro", logo: "/marka/uyg/mikro.png", kategori: "Muhasebe", turkiye: true, aciklama: "Cari kart, stok listesi ve sipariş (Mikro API sunucusu)", belge: "https://apidocs.mikro.com.tr",
    sirlar: [{ ad: "MIKRO_SUNUCU", etiket: "API sunucusu", nasil: "Mikro API servisinin internete açık adresi ve bağlantı noktası, ör. https://mikro.firman.com:8094." }, { ad: "MIKRO_API_KEY", etiket: "API anahtarı", nasil: "Mikro API yönetiminde tanımlanan anahtar." }, { ad: "MIKRO_FIRMA_KODU", etiket: "Firma kodu", nasil: "Mikro'daki firma kodu." }, { ad: "MIKRO_KULLANICI", etiket: "Kullanıcı kodu", nasil: "API yetkisi olan Mikro kullanıcısı." }, { ad: "MIKRO_SIFRE", etiket: "Kullanıcı şifresi", nasil: "Düz şifre; Vayra her gün tarih ile birlikte MD5 özetine çevirir." }, { ad: "MIKRO_CALISMA_YILI", etiket: "Çalışma yılı", nasil: "Boşsa bu yıl.", istege: true }],
    eylemler: [
      { id: "cari", ad: "Cari kart kaydet", aciklama: "Kod, unvan, vergi ve iletişim bilgisi", sirlar: MIK, alanlar: [{ ad: "kod", etiket: "Cari kodu", zorunlu: true }, { ad: "unvan", etiket: "Unvan", zorunlu: true }, { ad: "vergiDairesi", etiket: "Vergi dairesi" }, { ad: "vergiNo", etiket: "Vergi numarası" }, { ad: "eposta", etiket: "E-posta" }, { ad: "telefon", etiket: "Cep telefonu" }, { ad: "il", etiket: "İl" }, { ad: "ilce", etiket: "İlçe" }, { ad: "adres", etiket: "Adres" }],
        istek: (g, s) => ({ yontem: "POST", url: mikroUrl(s, "CariKaydetV2"), json: { Mikro: { ...mikroKimlik(s), cariler: [dolu({ cari_kod: zorunlu(g, "kod", "Cari kodu"), cari_unvan1: zorunlu(g, "unvan", "Unvan"), cari_vdaire_adi: t(g.vergiDairesi), cari_vdaire_no: t(g.vergiNo), cari_EMail: t(g.eposta), cari_CepTel: t(g.telefon), adres: t(g.adres) || t(g.il) ? [dolu({ adr_cadde: t(g.adres), adr_il: t(g.il), adr_ilce: t(g.ilce) })] : undefined })] } } }) },
      { id: "stok", ad: "Stok listesini getir", aciklama: "Stok koduna ya da tarihe göre", okuma: true, sirlar: MIK, alanlar: [{ ad: "kod", etiket: "Stok kodu (isteğe bağlı)" }, { ad: "adet", etiket: "Kaç kayıt", tur: "sayi", varsayilan: "50", yer: "50" }],
        istek: (g, s) => ({ yontem: "POST", url: mikroUrl(s, "StokListesiV2"), json: { Mikro: mikroKimlik(s), ...dolu({ StokKod: t(g.kod) }), Index: 0, Size: String(tamsayi(g.adet, 50, 1, 500)), Sort: "sto_kod" } }) },
      { id: "siparis", ad: "Sipariş kaydet", aciklama: "Müşteri siparişi, satır satır", sirlar: MIK, alanlar: [{ ad: "musteri", etiket: "Müşteri cari kodu", zorunlu: true }, { ad: "seri", etiket: "Evrak serisi", yer: "WEB", varsayilan: "WEB" }, { ad: "satirlar", etiket: "Satırlar (JSON)", tur: "json", zorunlu: true, yer: "[{\"stok\": \"STK-1\", \"miktar\": 2, \"fiyat\": 100}]" }, { ad: "depo", etiket: "Depo no", yer: "1", varsayilan: "1" }, { ad: "aciklama", etiket: "Açıklama" }],
        istek: (g, s) => ({ yontem: "POST", url: mikroUrl(s, "SiparisKaydetV2"), json: { Mikro: { ...mikroKimlik(s), evraklar: [dolu({ evrak_aciklamalari: t(g.aciklama) ? [{ aciklama: t(g.aciklama) }] : undefined, satirlar: liste(g.satirlar, "Satırlar").map((x) => { const o = nesne(x, "Satır"); const miktar = sayi(o.miktar, 1, 0, 1e9), fiyat = sayi(o.fiyat, 0, 0, 1e12); return { sip_tarih: trGun(), sip_tip: 0, sip_cins: 0, sip_evrakno_seri: t(g.seri) || "WEB", sip_musteri_kod: zorunlu(g, "musteri", "Müşteri kodu"), sip_stok_kod: t(o.stok), sip_miktar: miktar, sip_b_fiyat: fiyat, sip_tutar: Math.round(miktar * fiyat * 100) / 100, sip_depono: tamsayi(g.depo, 1, 0, 9999) }; }) })] } } }) },
    ],
  },
  {
    id: "netgsm", ad: "Netgsm", logo: "/marka/baglanti/netgsm.png", kategori: "SMS", turkiye: true, aciklama: "SMS, OTP, rapor, bakiye ve İYS izni", belge: "https://github.com/netgsm/netgsm-sms-js",
    sirlar: [{ ad: "NETGSM_KULLANICI", etiket: "Abone numarası", nasil: "Netgsm panelinde API kullanıcısı olarak tanımlanan abone numarası (850 ile başlar)." }, { ad: "NETGSM_SIFRE", etiket: "API şifresi", nasil: "Netgsm panelinde API alt kullanıcısı için belirlediğin şifre." }, { ad: "NETGSM_MARKA_KODU", etiket: "İYS marka kodu", nasil: "İYS'deki marka kodun (yalnız izin eklemek için).", istege: true }],
    baglanti: [{ katalog: "netgsm", esle: { NETGSM_KULLANICI: "alan:kullanici", NETGSM_SIFRE: "alan:sifre" } }],
    eylemler: [
      { id: "sms", ad: "SMS gönder", aciklama: "Onaylı başlıkla, Türkçe karakterli, çoklu alıcı", sirlar: NG, alanlar: [{ ad: "baslik", etiket: "Gönderici başlığı", zorunlu: true, yer: "FIRMAADI" }, { ad: "alici", etiket: "Alıcı numara (virgülle birden çok)", zorunlu: true, yer: "5321234567" }, MESAJ, { ad: "iys", etiket: "İYS süzgeci", tur: "secim", secenekler: [{ id: "0", ad: "Bilgilendirme" }, { id: "11", ad: "Ticari, bireysel" }, { id: "12", ad: "Ticari, tacir" }], varsayilan: "0" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.netgsm.com.tr/sms/rest/v2/send", basliklar: ngBas(s), json: { msgheader: zorunlu(g, "baslik", "Gönderici başlığı"), encoding: "TR", iysfilter: ["0", "11", "12"].includes(t(g.iys)) ? t(g.iys) : "0", messages: virgul(zorunlu(g, "alici", "Alıcı numara")).map((no) => ({ msg: zorunlu(g, "metin", "Mesaj"), no: ngNo(no) })) } }), sonuc: (y) => ({ ...ngSonuc(y), ozet: m((y as { jobid?: string })?.jobid) || undefined }) },
      { id: "otp", ad: "Doğrulama kodu gönder (OTP)", aciklama: "Tek alıcıya hızlı OTP SMS; OTP paketi gerekir", sirlar: NG, alanlar: [{ ad: "baslik", etiket: "Gönderici başlığı", zorunlu: true }, { ad: "alici", etiket: "Alıcı numara", zorunlu: true }, { ad: "metin", etiket: "Mesaj", tur: "uzunMetin", zorunlu: true, yer: "Doğrulama kodun: 482913" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.netgsm.com.tr/sms/rest/v2/otp", basliklar: ngBas(s), json: { msgheader: zorunlu(g, "baslik", "Gönderici başlığı"), msg: zorunlu(g, "metin", "Mesaj"), no: ngNo(zorunlu(g, "alici", "Alıcı numara")) } }), sonuc: ngSonuc },
      { id: "rapor", ad: "Gönderim raporunu getir", aciklama: "Görev kimliğiyle iletim durumu", okuma: true, sirlar: NG, alanlar: [{ ad: "gorev", etiket: "Görev kimlikleri (virgülle)", zorunlu: true, yer: "/ ile SMS adımının çıktısı" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.netgsm.com.tr/sms/rest/v2/report", basliklar: ngBas(s), json: { jobids: virgul(zorunlu(g, "gorev", "Görev kimliği")) } }), sonuc: ngSonuc },
      { id: "basliklar", ad: "Gönderici başlıklarını listele", aciklama: "Onaylı başlıklar", okuma: true, sirlar: NG, alanlar: [], istek: (_g, s) => ({ yontem: "GET", url: "https://api.netgsm.com.tr/sms/rest/v2/msgheader", basliklar: ngBas(s) }), sonuc: ngSonuc },
      { id: "bakiye", ad: "Kalan krediyi sorgula", aciklama: "Paket ve kredi bilgisi", okuma: true, sirlar: NG, alanlar: [], istek: (_g, s) => ({ yontem: "POST", url: "https://api.netgsm.com.tr/balance", json: { usercode: s("NETGSM_KULLANICI"), password: s("NETGSM_SIFRE"), stip: 2 } }), sonuc: ngSonuc },
      { id: "iys", ad: "İYS iletişim izni ekle", aciklama: "Müşterinin SMS, arama ya da e-posta izni", sirlar: [...NG, "NETGSM_MARKA_KODU"], alanlar: [{ ad: "alici", etiket: "Telefon ya da e-posta", zorunlu: true, yer: "+905321234567" }, { ad: "tur", etiket: "İzin türü", tur: "secim", secenekler: [{ id: "MESAJ", ad: "SMS" }, { id: "ARAMA", ad: "Arama" }, { id: "EPOSTA", ad: "E-posta" }], varsayilan: "MESAJ" }, { ad: "durum", etiket: "Durum", tur: "secim", secenekler: [{ id: "ONAY", ad: "Onay" }, { id: "RET", ad: "Ret" }], varsayilan: "ONAY" }, { ad: "alici_tipi", etiket: "Alıcı tipi", tur: "secim", secenekler: [{ id: "BIREYSEL", ad: "Bireysel" }, { id: "TACIR", ad: "Tacir" }], varsayilan: "BIREYSEL" }],
        istek: (g, s) => { const z = new Date(Date.now() + 3 * 3600_000).toISOString().replace("T", " ").slice(0, 19); const a = zorunlu(g, "alici", "Alıcı"); return { yontem: "POST", url: "https://api.netgsm.com.tr/iys/add", json: { header: { username: s("NETGSM_KULLANICI"), password: s("NETGSM_SIFRE"), brandCode: s("NETGSM_MARKA_KODU") }, body: { data: [{ type: t(g.tur) || "MESAJ", source: "HS_WEB", recipient: a.includes("@") ? a : `+90${ngNo(a)}`, status: t(g.durum) || "ONAY", consentDate: z, recipientType: t(g.alici_tipi) || "BIREYSEL" }] } } }; }, sonuc: ngSonuc },
    ],
  },
  {
    id: "iletimerkezi", ad: "İleti Merkezi", logo: "/marka/uyg/iletimerkezi.png", kategori: "SMS", turkiye: true, aciklama: "SMS gönder, rapor ve bakiye", belge: "https://www.iletimerkezi.com/en/docs/api/overview.md",
    sirlar: [{ ad: "ILETIMERKEZI_KEY", etiket: "API anahtarı", nasil: "Panelde Ayarlar, Güvenlik, API Erişimi; API erişimine izin ver ve anahtarı kopyala." }, { ad: "ILETIMERKEZI_HASH", etiket: "API hash", nasil: "Aynı sayfada panelin hazır verdiği hash; kendin üretme." }],
    eylemler: [
      { id: "sms", ad: "SMS gönder", aciklama: "Onaylı başlıkla bir ya da çok alıcıya", sirlar: ["ILETIMERKEZI_KEY", "ILETIMERKEZI_HASH"], alanlar: [{ ad: "baslik", etiket: "Gönderici başlığı", zorunlu: true }, { ad: "alici", etiket: "Alıcı numara (virgülle)", zorunlu: true, yer: "905321234567" }, MESAJ, { ad: "iys", etiket: "Ticari ileti", tur: "evet-hayir" }],
        istek: (g, s) => imIstek(s, "send-sms", { order: { sender: zorunlu(g, "baslik", "Gönderici başlığı"), iys: evet(g.iys) ? "1" : "0", message: { text: zorunlu(g, "metin", "Mesaj"), receipents: { number: virgul(zorunlu(g, "alici", "Alıcı")).map((x) => x.replace(/[^\d]/g, "")) } } } }), sonuc: (y) => ({ ...imSonuc(y), ozet: m((y as { response?: { order?: { id?: string } } })?.response?.order?.id) || undefined }) },
      { id: "rapor", ad: "Gönderim raporunu getir", aciklama: "Sipariş kimliğiyle iletim durumu", okuma: true, sirlar: ["ILETIMERKEZI_KEY", "ILETIMERKEZI_HASH"], alanlar: [{ ad: "siparis", etiket: "Gönderim kimliği", zorunlu: true }],
        istek: (g, s) => imIstek(s, "get-report", { order: { id: zorunlu(g, "siparis", "Gönderim kimliği"), page: 1, rowCount: 1000 } }), sonuc: imSonuc },
      { id: "bakiye", ad: "Bakiye sorgula", aciklama: "TL ve SMS adedi", okuma: true, sirlar: ["ILETIMERKEZI_KEY", "ILETIMERKEZI_HASH"], alanlar: [], istek: (_g, s) => imIstek(s, "get-balance"), sonuc: imSonuc },
    ],
  },
  {
    id: "verimor", ad: "Verimor", logo: "/marka/baglanti/verimor.png", kategori: "SMS", turkiye: true, aciklama: "SMS gönder, rapor ve kredi", belge: "https://developer.verimor.com.tr/smsapi",
    sirlar: [{ ad: "VERIMOR_KULLANICI", etiket: "Kullanıcı adı", nasil: "Verimor hesabının 12 haneli telefon numarası (908501234567 gibi)." }, { ad: "VERIMOR_SIFRE", etiket: "API şifresi", nasil: "Online İşlem Merkezi, SMS Ayarlarım, API şifresi ve izinli IP adresleri." }],
    baglanti: [{ katalog: "verimor", esle: { VERIMOR_KULLANICI: "alan:ek.username", VERIMOR_SIFRE: "alan:anahtar" } }],
    eylemler: [
      { id: "sms", ad: "SMS gönder", aciklama: "Başlıkla, isteğe bağlı ileri tarihli", sirlar: ["VERIMOR_KULLANICI", "VERIMOR_SIFRE"], alanlar: [{ ad: "alici", etiket: "Alıcı numara (virgülle)", zorunlu: true, yer: "905321234567" }, MESAJ, { ad: "baslik", etiket: "Gönderici başlığı (isteğe bağlı)" }, { ad: "ticari", etiket: "Ticari ileti", tur: "evet-hayir" }],
        istek: (g, s) => ({ yontem: "GET", url: `https://sms.verimor.com.tr/v2/send${sorgu({ username: s("VERIMOR_KULLANICI"), password: s("VERIMOR_SIFRE"), dest: virgul(zorunlu(g, "alici", "Alıcı")).map((x) => x.replace(/[^\d]/g, "")).join(","), msg: zorunlu(g, "metin", "Mesaj"), source_addr: t(g.baslik), is_commercial: evet(g.ticari) ? "true" : undefined, iys_recipient_type: evet(g.ticari) ? "BIREYSEL" : undefined })}`, yanit: "metin" }) },
      { id: "durum", ad: "Gönderim durumunu sorgula", aciklama: "Kampanya kimliğiyle", okuma: true, sirlar: ["VERIMOR_KULLANICI", "VERIMOR_SIFRE"], alanlar: [{ ad: "kimlik", etiket: "Kampanya kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `https://sms.verimor.com.tr/v2/status${sorgu({ username: s("VERIMOR_KULLANICI"), password: s("VERIMOR_SIFRE"), id: zorunlu(g, "kimlik", "Kampanya kimliği") })}` }) },
      { id: "bakiye", ad: "Kalan krediyi sorgula", aciklama: "SMS kredisi", okuma: true, sirlar: ["VERIMOR_KULLANICI", "VERIMOR_SIFRE"], alanlar: [], istek: (_g, s) => ({ yontem: "GET", url: `https://sms.verimor.com.tr/v2/balance${sorgu({ username: s("VERIMOR_KULLANICI"), password: s("VERIMOR_SIFRE") })}`, yanit: "metin" }) },
    ],
  },
  {
    id: "kobikom", ad: "KobiKom", logo: "/marka/baglanti/kobikom.svg", kategori: "SMS", turkiye: true, aciklama: "Tekli ve toplu SMS, bakiye", belge: "https://developer.kobikom.com.tr/",
    sirlar: [{ ad: "KOBIKOM_TOKEN", etiket: "API belirteci", nasil: "KobiKom SMS Paneli, Ayarlar, SMS API." }],
    baglanti: [{ katalog: "kobikom", esle: { KOBIKOM_TOKEN: "alan:anahtar" } }],
    eylemler: [
      { id: "sms", ad: "Toplu SMS gönder", aciklama: "Başlıkla bir ya da çok alıcıya", sirlar: ["KOBIKOM_TOKEN"], alanlar: [{ ad: "baslik", etiket: "SMS başlığı", zorunlu: true }, { ad: "alici", etiket: "Alıcı numara (virgülle)", zorunlu: true, yer: "+905321234567" }, MESAJ],
        istek: (g, s) => ({ yontem: "POST", url: `https://sms.kobikom.com.tr/api/message?api_token=${enc(s("KOBIKOM_TOKEN"))}`, json: { from: zorunlu(g, "baslik", "SMS başlığı"), message: zorunlu(g, "metin", "Mesaj"), to: virgul(zorunlu(g, "alici", "Alıcı")).map((x) => { const d = x.replace(/[^\d]/g, "").replace(/^0/, ""); return `+${d.startsWith("90") ? d : `90${d}`}`; }) } }) },
      { id: "bakiye", ad: "Bakiye sorgula", aciklama: "Kalan SMS kredisi", okuma: true, sirlar: ["KOBIKOM_TOKEN"], alanlar: [], istek: (_g, s) => ({ yontem: "GET", url: `https://sms.kobikom.com.tr/api/balance?api_token=${enc(s("KOBIKOM_TOKEN"))}` }) },
    ],
  },
  {
    id: "organik-sms", ad: "Organik Haberleşme", logo: "/marka/baglanti/organik-sms.png", kategori: "SMS", turkiye: true, aciklama: "SMS gönder ve bakiye", belge: "https://apidocs.organikhaberlesme.com/",
    sirlar: [{ ad: "ORGANIK_API", etiket: "API kodu", nasil: "Organik Haberleşme Paneli, API Kontrolü, Yeni API Kodu." }],
    baglanti: [{ katalog: "organik-sms", esle: { ORGANIK_API: "alan:anahtar" } }],
    eylemler: [
      { id: "sms", ad: "SMS gönder", aciklama: "Başlık kimliğiyle, Türkçe karakterli", sirlar: ["ORGANIK_API"], alanlar: [{ ad: "baslik", etiket: "Başlık kimlik numarası", zorunlu: true, tur: "sayi" }, { ad: "alici", etiket: "Alıcı numara (virgülle)", zorunlu: true, yer: "905321234567" }, MESAJ],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.organikhaberlesme.com/sms/send", basliklar: { "X-Organik-Auth": s("ORGANIK_API") }, json: { message: zorunlu(g, "metin", "Mesaj"), header: Number(zorunlu(g, "baslik", "Başlık")), type: "turkish", recipients: virgul(zorunlu(g, "alici", "Alıcı")).map((x) => x.replace(/[^\d]/g, "")) } }) },
      { id: "bakiye", ad: "Bakiye sorgula", aciklama: "Kalan kredi", okuma: true, sirlar: ["ORGANIK_API"], alanlar: [], istek: (_g, s) => ({ yontem: "GET", url: "https://api.organikhaberlesme.com/user/payment/balance", basliklar: { "X-Organik-Auth": s("ORGANIK_API") } }) },
    ],
  },
  {
    id: "yurtici", ad: "Yurtiçi Kargo", logo: "/marka/uyg/yurtici-kargo.svg", kategori: "Kargo", turkiye: true, aciklama: "Gönderi oluştur, takip et ve iptal", belge: "https://ws.yurticikargo.com/KOPSWebServices/ShippingOrderDispatcherServices?wsdl",
    sirlar: [{ ad: "YURTICI_KULLANICI", etiket: "Web servis kullanıcı adı", nasil: "Yurtiçi Kargo müşteri temsilcinin verdiği wsUserName." }, { ad: "YURTICI_SIFRE", etiket: "Web servis şifresi", nasil: "Aynı hesabın wsPassword değeri." }, { ad: "YURTICI_ORTAM", etiket: "Ortam", nasil: "Test için test yaz; boşsa canlı.", istege: true }],
    eylemler: [
      { id: "gonderi", ad: "Gönderi oluştur", aciklama: "Alıcı ve adresle kargo kaydı açar", sirlar: YK,
        alanlar: [{ ad: "kargoAnahtari", etiket: "Kargo anahtarı (cargoKey)", zorunlu: true, yer: "/ ile sipariş numarası", aciklama: "Senin verdiğin tekil gönderi numarası; takipte bu kullanılır" }, { ad: "faturaAnahtari", etiket: "Fatura anahtarı (invoiceKey)", zorunlu: true, yer: "/ ile sipariş numarası" }, { ad: "ad", etiket: "Alıcı adı", zorunlu: true }, { ad: "adres", etiket: "Adres", zorunlu: true, tur: "uzunMetin" }, { ad: "il", etiket: "İl", zorunlu: true }, { ad: "ilce", etiket: "İlçe", zorunlu: true }, { ad: "telefon", etiket: "Telefon", zorunlu: true }, { ad: "eposta", etiket: "E-posta" }, { ad: "desi", etiket: "Desi", tur: "sayi" }, { ad: "kg", etiket: "Kilogram", tur: "sayi" }, { ad: "parca", etiket: "Parça sayısı", tur: "sayi", varsayilan: "1", yer: "1" }, { ad: "aciklama", etiket: "Açıklama" }],
        istek: (g, s) => ykIstek(s, "createShipment", `<wsUserName>${xk(s("YURTICI_KULLANICI"))}</wsUserName><wsPassword>${xk(s("YURTICI_SIFRE"))}</wsPassword><userLanguage>TR</userLanguage><ShippingOrderVO>${xmlOgeler(dolu({
          cargoKey: zorunlu(g, "kargoAnahtari", "Kargo anahtarı").slice(0, 20), invoiceKey: zorunlu(g, "faturaAnahtari", "Fatura anahtarı").slice(0, 20), receiverCustName: zorunlu(g, "ad", "Alıcı adı").slice(0, 200), receiverAddress: zorunlu(g, "adres", "Adres").slice(0, 500), cityName: zorunlu(g, "il", "İl"), townName: zorunlu(g, "ilce", "İlçe"),
          receiverPhone1: zorunlu(g, "telefon", "Telefon").replace(/[^\d]/g, ""), emailAddress: t(g.eposta), taxOfficeId: "0", desi: t(g.desi) ? String(sayi(g.desi, 1, 0, 9999)) : undefined, kg: t(g.kg) ? String(sayi(g.kg, 1, 0, 9999)) : undefined, cargoCount: String(tamsayi(g.parca, 1, 1, 999)), ttDocumentId: "0", dcSelectedCredit: "0", dcCreditRule: "0", description: t(g.aciklama).slice(0, 200),
        }) as Record<string, unknown>)}</ShippingOrderVO>`), sonuc: ykSonuc },
      { id: "takip", ad: "Gönderiyi takip et", aciklama: "Kargo anahtarıyla durum, hareketler ve takip adresi", okuma: true, sirlar: YK, alanlar: [{ ad: "kargoAnahtari", etiket: "Kargo anahtarı (virgülle birden çok)", zorunlu: true }, { ad: "gecmis", etiket: "Hareket geçmişiyle", tur: "evet-hayir" }],
        istek: (g, s) => ykIstek(s, "queryShipment", `<wsUserName>${xk(s("YURTICI_KULLANICI"))}</wsUserName><wsPassword>${xk(s("YURTICI_SIFRE"))}</wsPassword><wsLanguage>TR</wsLanguage>${virgul(zorunlu(g, "kargoAnahtari", "Kargo anahtarı")).map((k) => `<keys>${xk(k)}</keys>`).join("")}<keyType>0</keyType><addHistoricalData>${evet(g.gecmis)}</addHistoricalData><onlyTracking>false</onlyTracking>`), sonuc: ykSonuc },
      { id: "iptal", ad: "Gönderiyi iptal et", aciklama: "Henüz kargoya verilmemiş kaydı siler", sirlar: YK, alanlar: [{ ad: "kargoAnahtari", etiket: "Kargo anahtarı (virgülle)", zorunlu: true }],
        istek: (g, s) => ykIstek(s, "cancelShipment", `<wsUserName>${xk(s("YURTICI_KULLANICI"))}</wsUserName><wsPassword>${xk(s("YURTICI_SIFRE"))}</wsPassword><userLanguage>TR</userLanguage>${virgul(zorunlu(g, "kargoAnahtari", "Kargo anahtarı")).map((k) => `<cargoKeys>${xk(k)}</cargoKeys>`).join("")}`), sonuc: ykSonuc },
    ],
  },
  {
    id: "aras", ad: "Aras Kargo", logo: "/marka/uyg/aras-kargo.svg", kategori: "Kargo", turkiye: true, aciklama: "Gönderi siparişi oluştur ve iptal", belge: "https://customerws.araskargo.com.tr/arascargoservice.asmx",
    sirlar: [{ ad: "ARAS_KULLANICI", etiket: "Kullanıcı adı", nasil: "Aras Kargo entegrasyon başvurusunda verilen web servis kullanıcısı." }, { ad: "ARAS_SIFRE", etiket: "Şifre", nasil: "Aynı hesabın şifresi." }, { ad: "ARAS_ORTAM", etiket: "Ortam", nasil: "Test için test yaz; boşsa canlı.", istege: true }],
    eylemler: [
      { id: "gonderi", ad: "Gönderi siparişi oluştur", aciklama: "Entegrasyon koduyla alıcı ve adres", sirlar: ["ARAS_KULLANICI", "ARAS_SIFRE"],
        alanlar: [{ ad: "kod", etiket: "Entegrasyon kodu", zorunlu: true, yer: "/ ile sipariş numarası", aciklama: "Senin verdiğin tekil kod; iptal bu kodla yapılır" }, { ad: "irsaliye", etiket: "İrsaliye ya da fatura no", zorunlu: true }, { ad: "ad", etiket: "Alıcı adı", zorunlu: true }, { ad: "adres", etiket: "Adres", tur: "uzunMetin", zorunlu: true }, { ad: "il", etiket: "İl", zorunlu: true }, { ad: "ilce", etiket: "İlçe", zorunlu: true }, { ad: "telefon", etiket: "Telefon", zorunlu: true }, { ad: "parca", etiket: "Parça sayısı", tur: "sayi", varsayilan: "1", yer: "1" }, { ad: "desi", etiket: "Desi", tur: "sayi" }, { ad: "kg", etiket: "Kilogram", tur: "sayi" }, { ad: "aciklama", etiket: "Açıklama" }],
        istek: (g, s) => { const o = dolu({ UserName: s("ARAS_KULLANICI"), Password: s("ARAS_SIFRE"), TradingWaybillNumber: zorunlu(g, "irsaliye", "İrsaliye no").slice(0, 16), InvoiceNumber: t(g.irsaliye).slice(0, 20), ReceiverName: zorunlu(g, "ad", "Alıcı adı").slice(0, 100), ReceiverAddress: zorunlu(g, "adres", "Adres").slice(0, 250), ReceiverPhone1: zorunlu(g, "telefon", "Telefon").replace(/[^\d]/g, ""), ReceiverCityName: zorunlu(g, "il", "İl"), ReceiverTownName: zorunlu(g, "ilce", "İlçe"), VolumetricWeight: t(g.desi) ? String(sayi(g.desi, 1, 0, 9999)) : undefined, Weight: t(g.kg) ? String(sayi(g.kg, 1, 0, 9999)) : undefined, PieceCount: String(tamsayi(g.parca, 1, 1, 999)), IntegrationCode: zorunlu(g, "kod", "Entegrasyon kodu").slice(0, 32), Description: t(g.aciklama).slice(0, 255), IsCod: "0" }) as Record<string, unknown>;
          return soap(arasUrl(s), "http://tempuri.org/SetOrder", `<SetOrder xmlns="http://tempuri.org/"><orderInfo><Order>${xmlOgeler(o)}</Order></orderInfo><userName>${xk(s("ARAS_KULLANICI"))}</userName><password>${xk(s("ARAS_SIFRE"))}</password></SetOrder>`); }, sonuc: arasSonuc },
      { id: "iptal", ad: "Gönderiyi iptal et", aciklama: "Entegrasyon koduyla", sirlar: ["ARAS_KULLANICI", "ARAS_SIFRE"], alanlar: [{ ad: "kod", etiket: "Entegrasyon kodu", zorunlu: true }],
        istek: (g, s) => soap(arasUrl(s), "http://tempuri.org/CancelDispatch", `<CancelDispatch xmlns="http://tempuri.org/"><userName>${xk(s("ARAS_KULLANICI"))}</userName><password>${xk(s("ARAS_SIFRE"))}</password><integrationCode>${xk(zorunlu(g, "kod", "Entegrasyon kodu"))}</integrationCode></CancelDispatch>`), sonuc: arasSonuc },
    ],
  },
  {
    id: "mng", ad: "MNG Kargo", logo: "/marka/uyg/mng-kargo.svg", kategori: "Kargo", turkiye: true, aciklama: "Gönderi oluştur, durum, hareketler ve iptal", belge: "https://apizone.mngkargo.com.tr/tr/product",
    sirlar: [{ ad: "MNG_CLIENT_ID", etiket: "Client ID", nasil: "apizone.mngkargo.com.tr üzerinde uygulama oluşturup aldığın X-IBM-Client-Id." }, { ad: "MNG_CLIENT_SECRET", etiket: "Client Secret", nasil: "Aynı uygulamanın X-IBM-Client-Secret değeri." }, { ad: "MNG_MUSTERI_NO", etiket: "Müşteri numarası", nasil: "MNG Kargo müşteri numaran." }, { ad: "MNG_SIFRE", etiket: "Şifre", nasil: "MNG Kargo müşteri şifren." }],
    kimlik: { sirlar: ["MNG_CLIENT_ID", "MNG_CLIENT_SECRET", "MNG_MUSTERI_NO", "MNG_SIFRE"], istek: (s) => ({ yontem: "POST", url: `${MNG_TABAN}/token`, basliklar: mngBas(s, false), json: { customerNumber: s("MNG_MUSTERI_NO"), password: s("MNG_SIFRE"), identityType: 1 } }),
      coz: (y) => { const o = y as { jwt?: string }; if (!o?.jwt) throw new Error("MNG Kargo belirteç vermedi; müşteri numarası ve şifreyi denetle."); return { degerler: { _MNG_ERISIM: o.jwt }, omur: 50 * 60_000 }; } },
    eylemler: [
      { id: "gonderi", ad: "Gönderi oluştur", aciklama: "Standart gönderi, alıcı ve parça bilgisiyle", sirlar: MNG,
        alanlar: [{ ad: "referans", etiket: "Referans numarası", zorunlu: true, yer: "/ ile sipariş numarası", aciklama: "Büyük harfle; takip ve iptalde bu kullanılır" }, { ad: "ad", etiket: "Alıcı adı", zorunlu: true }, { ad: "adres", etiket: "Adres", tur: "uzunMetin", zorunlu: true }, { ad: "ilKodu", etiket: "İl kodu", zorunlu: true, tur: "sayi", yer: "34" }, { ad: "ilceKodu", etiket: "İlçe kodu", zorunlu: true, tur: "sayi" }, { ad: "telefon", etiket: "Cep telefonu", zorunlu: true }, { ad: "eposta", etiket: "E-posta" }, { ad: "icerik", etiket: "İçerik", zorunlu: true, yer: "Seramik kupa" }, { ad: "desi", etiket: "Desi", tur: "sayi", varsayilan: "1", yer: "1" }, { ad: "kg", etiket: "Kilogram", tur: "sayi", varsayilan: "1", yer: "1" }, { ad: "odeme", etiket: "Ücreti kim öder", tur: "secim", secenekler: [{ id: "1", ad: "Gönderici" }, { id: "2", ad: "Alıcı" }], varsayilan: "1" }],
        istek: (g, s) => { const ref = zorunlu(g, "referans", "Referans").toUpperCase().slice(0, 20); return { yontem: "POST", url: `${MNG_TABAN}/standardcmdapi/createOrder`, basliklar: mngBas(s), json: { order: { referenceId: ref, barcode: ref, billOfLandingId: ref, isCOD: 0, codAmount: 0, shipmentServiceType: 1, packagingType: 3, content: zorunlu(g, "icerik", "İçerik").slice(0, 100), smsPreference1: 1, smsPreference2: 0, smsPreference3: 0, paymentType: Number(t(g.odeme) || 1), deliveryType: 1, description: zorunlu(g, "icerik", "İçerik").slice(0, 100), marketPlaceShortCode: "", marketPlaceSaleCode: "", pudoId: "" }, orderPieceList: [{ barcode: `${ref}1`, desi: tamsayi(g.desi, 1, 1, 9999), kg: tamsayi(g.kg, 1, 1, 9999), content: zorunlu(g, "icerik", "İçerik").slice(0, 100) }], recipient: dolu({ customerId: "", refCustomerId: "", cityCode: tamsayi(g.ilKodu, 0, 1, 81), districtCode: tamsayi(g.ilceKodu, 0, 0, 99999), address: zorunlu(g, "adres", "Adres").slice(0, 250), email: t(g.eposta), fullName: zorunlu(g, "ad", "Alıcı adı").slice(0, 100), mobilePhoneNumber: zorunlu(g, "telefon", "Telefon").replace(/[^\d]/g, "") }) } }; },
        sonuc: (y) => ({ ozet: m((y as { orderInvoiceId?: string }[])?.[0]?.orderInvoiceId) || undefined }) },
      { id: "durum", ad: "Gönderi durumunu getir", aciklama: "Teslim durumu ve takip adresi", okuma: true, sirlar: MNG, alanlar: [{ ad: "referans", etiket: "Referans numarası", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `${MNG_TABAN}/standardqueryapi/getshipmentstatus/${enc(zorunlu(g, "referans", "Referans").toUpperCase())}`, basliklar: mngBas(s) }) },
      { id: "hareketler", ad: "Gönderi hareketlerini getir", aciklama: "Şube ve olay geçmişi", okuma: true, sirlar: MNG, alanlar: [{ ad: "referans", etiket: "Referans numarası", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `${MNG_TABAN}/standardqueryapi/trackshipment/${enc(zorunlu(g, "referans", "Referans").toUpperCase())}`, basliklar: mngBas(s) }) },
      { id: "iptal", ad: "Gönderiyi iptal et", aciklama: "Referans numarasıyla", sirlar: MNG, alanlar: [{ ad: "referans", etiket: "Referans numarası", zorunlu: true }],
        istek: (g, s) => ({ yontem: "PUT", url: `${MNG_TABAN}/standardcmdapi/cancelorder/${enc(zorunlu(g, "referans", "Referans").toUpperCase())}`, basliklar: mngBas(s), yanit: "metin" }) },
    ],
  },
  {
    id: "geliver", ad: "Geliver", logo: "/marka/baglanti/geliver.png", kategori: "Kargo", turkiye: true, aciklama: "Kargo fiyatları, gönderiler ve iptal", belge: "https://docs.geliver.io/docs/home",
    sirlar: [{ ad: "GELIVER_TOKEN", etiket: "API belirteci", nasil: "Geliver Paneli, Ayarlar, API Tokenları." }],
    baglanti: [{ katalog: "geliver", esle: { GELIVER_TOKEN: "alan:anahtar" } }],
    eylemler: [
      { id: "fiyat", ad: "Kargo fiyatlarını getir", aciklama: "Ölçü ve ağırlığa göre firmaların fiyatı", okuma: true, sirlar: ["GELIVER_TOKEN"], alanlar: [{ ad: "en", etiket: "En (cm)", tur: "sayi", zorunlu: true }, { ad: "boy", etiket: "Boy (cm)", tur: "sayi", zorunlu: true }, { ad: "yukseklik", etiket: "Yükseklik (cm)", tur: "sayi", zorunlu: true }, { ad: "kg", etiket: "Ağırlık (kg)", tur: "sayi", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.geliver.io/api/v1/priceList${sorgu({ paramType: "parcel", length: sayi(g.boy, 1, 0, 999), width: sayi(g.en, 1, 0, 999), height: sayi(g.yukseklik, 1, 0, 999), weight: sayi(g.kg, 1, 0, 999) })}`, basliklar: { Authorization: `Bearer ${s("GELIVER_TOKEN")}` } }) },
      { id: "gonderiler", ad: "Gönderileri listele", aciklama: "Duruma ya da sipariş numarasına göre", okuma: true, sirlar: ["GELIVER_TOKEN"], alanlar: [{ ad: "siparis", etiket: "Sipariş numarası (isteğe bağlı)" }, { ad: "durum", etiket: "Durum", tur: "secim", secenekler: [{ id: "", ad: "Hepsi" }, { id: "SHIPPED", ad: "Kargoda" }, { id: "DELIVERED", ad: "Teslim edildi" }, { id: "CANCELED", ad: "İptal" }] }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.geliver.io/api/v1/shipments${sorgu({ orderNumber: t(g.siparis), statusFilter: t(g.durum), limit: 50, page: 1 })}`, basliklar: { Authorization: `Bearer ${s("GELIVER_TOKEN")}` } }) },
      { id: "gonderi", ad: "Gönderiyi getir", aciklama: "Takip kodu ve durum", okuma: true, sirlar: ["GELIVER_TOKEN"], alanlar: [{ ad: "gonderi", etiket: "Gönderi kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.geliver.io/api/v1/shipments/${enc(zorunlu(g, "gonderi", "Gönderi kimliği"))}`, basliklar: { Authorization: `Bearer ${s("GELIVER_TOKEN")}` } }) },
      { id: "iptal", ad: "Gönderiyi iptal et", aciklama: "Gönderi kimliğiyle", sirlar: ["GELIVER_TOKEN"], alanlar: [{ ad: "gonderi", etiket: "Gönderi kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "DELETE", url: `https://api.geliver.io/api/v1/shipments/${enc(zorunlu(g, "gonderi", "Gönderi kimliği"))}`, basliklar: { Authorization: `Bearer ${s("GELIVER_TOKEN")}` } }) },
    ],
  },
  {
    id: "basit-kargo", ad: "Basit Kargo", logo: "/marka/baglanti/basit-kargo.png", kategori: "Kargo", turkiye: true, aciklama: "Siparişler, takip ve iptal", belge: "https://basitkargo.com/api",
    sirlar: [{ ad: "BASITKARGO_TOKEN", etiket: "API belirteci", nasil: "Basit Kargo Paneli, Hesap Ayarları, API Token." }],
    baglanti: [{ katalog: "basit-kargo", esle: { BASITKARGO_TOKEN: "alan:anahtar" } }],
    eylemler: [
      { id: "siparisler", ad: "Siparişleri listele", aciklama: "Anahtar kelime ya da tarih aralığıyla", okuma: true, sirlar: ["BASITKARGO_TOKEN"], alanlar: [{ ad: "ara", etiket: "Arama (alıcı, sipariş no, takip kodu)" }, SAYFA],
        istek: (g, s) => ({ yontem: "POST", url: "https://basitkargo.com/api/v2/order/filter", basliklar: { Authorization: `Bearer ${s("BASITKARGO_TOKEN")}` }, json: dolu({ keyword: t(g.ara), page: 0, size: tamsayi(g.boyut, 20, 1, 100) }) }) },
      { id: "takip", ad: "Takip koduyla sorgula", aciklama: "Kargo firmasının takip numarası", okuma: true, sirlar: ["BASITKARGO_TOKEN"], alanlar: [{ ad: "kod", etiket: "Takip kodu", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `https://basitkargo.com/api/v2/order/handler-shipment-code/${enc(zorunlu(g, "kod", "Takip kodu"))}`, basliklar: { Authorization: `Bearer ${s("BASITKARGO_TOKEN")}` } }) },
      { id: "iptal", ad: "Kargo kodunu iptal et", aciklama: "Barkodla", sirlar: ["BASITKARGO_TOKEN"], alanlar: [{ ad: "barkod", etiket: "Barkod", zorunlu: true }],
        istek: (g, s) => ({ yontem: "DELETE", url: `https://basitkargo.com/api/order/barcode/${enc(zorunlu(g, "barkod", "Barkod"))}`, basliklar: { Authorization: `Bearer ${s("BASITKARGO_TOKEN")}` } }) },
    ],
  },
  {
    id: "collectapi", ad: "CollectAPI", logo: "/marka/baglanti/collectapi.png", kategori: "Veri", turkiye: true, aciklama: "Nöbetçi eczane, döviz, altın ve akaryakıt", belge: "https://docs.collectapi.com/docs/general",
    sirlar: [{ ad: "COLLECTAPI_TOKEN", etiket: "API belirteci", nasil: "CollectAPI, Accounts, Profile, Token sekmesi (apikey ile başlayan değerin tamamı)." }],
    baglanti: [{ katalog: "collectapi", esle: { COLLECTAPI_TOKEN: "alan:anahtar" } }],
    eylemler: [
      { id: "eczane", ad: "Nöbetçi eczaneleri getir", aciklama: "İl ve ilçeye göre", okuma: true, sirlar: ["COLLECTAPI_TOKEN"], alanlar: [{ ad: "il", etiket: "İl", zorunlu: true, yer: "İstanbul" }, { ad: "ilce", etiket: "İlçe", yer: "Kadıköy" }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.collectapi.com/health/dutyPharmacy${sorgu({ il: zorunlu(g, "il", "İl"), ilce: t(g.ilce) })}`, basliklar: { authorization: s("COLLECTAPI_TOKEN").startsWith("apikey") ? s("COLLECTAPI_TOKEN") : `apikey ${s("COLLECTAPI_TOKEN")}`, "content-type": "application/json" } }) },
      { id: "doviz", ad: "Döviz kurlarını getir", aciklama: "Tüm kurlar", okuma: true, sirlar: ["COLLECTAPI_TOKEN"], alanlar: [],
        istek: (_g, s) => ({ yontem: "GET", url: "https://api.collectapi.com/economy/allCurrency", basliklar: { authorization: s("COLLECTAPI_TOKEN").startsWith("apikey") ? s("COLLECTAPI_TOKEN") : `apikey ${s("COLLECTAPI_TOKEN")}`, "content-type": "application/json" } }) },
      { id: "altin", ad: "Altın fiyatlarını getir", aciklama: "Gram, çeyrek, cumhuriyet", okuma: true, sirlar: ["COLLECTAPI_TOKEN"], alanlar: [],
        istek: (_g, s) => ({ yontem: "GET", url: "https://api.collectapi.com/economy/goldPrice", basliklar: { authorization: s("COLLECTAPI_TOKEN").startsWith("apikey") ? s("COLLECTAPI_TOKEN") : `apikey ${s("COLLECTAPI_TOKEN")}`, "content-type": "application/json" } }) },
      { id: "akaryakit", ad: "Akaryakıt fiyatlarını getir", aciklama: "İl ve ilçeye göre benzin fiyatı", okuma: true, sirlar: ["COLLECTAPI_TOKEN"], alanlar: [{ ad: "il", etiket: "İl", zorunlu: true, yer: "istanbul" }, { ad: "ilce", etiket: "İlçe", zorunlu: true, yer: "kadikoy" }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.collectapi.com/gasPrice/turkeyGasoline${sorgu({ city: zorunlu(g, "il", "İl"), district: zorunlu(g, "ilce", "İlçe") })}`, basliklar: { authorization: s("COLLECTAPI_TOKEN").startsWith("apikey") ? s("COLLECTAPI_TOKEN") : `apikey ${s("COLLECTAPI_TOKEN")}`, "content-type": "application/json" } }) },
    ],
  },
];
