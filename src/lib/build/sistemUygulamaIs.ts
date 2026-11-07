import { b64, dolu, enc, evet, gqlDenetle, isoZaman, liste, m, nesne, ozetAl, siteKoku, sorgu, t, tamsayi, tarihGun, temel, virgul, zorunlu, type Sirlar, type UygIstek, type Uygulama } from "./sistemUygulamaOrtak";

/**
 * Verimlilik, proje, geliştirme, CRM, destek, randevu ve form servisleri. Kaynaklar: developers.notion.com,
 * airtable.com/developers, developer.atlassian.com (Trello, Jira Cloud v3), developers.asana.com, developer.clickup.com,
 * developer.todoist.com (API v1), linear.app/developers, docs.github.com/rest, docs.gitlab.com/api, developer.monday.com,
 * developers.hubspot.com, developer.salesforce.com (REST v62, istemci kimliği akışı), developers.pipedrive.com,
 * zoho.com/crm/developer (v7), developer.close.com, docs.attio.com, developers.intercom.com, developer.zendesk.com,
 * developers.freshdesk.com, developer.calendly.com, cal.com/docs/api-reference/v2, typeform.com/developers,
 * api.jotform.com/docs, developers.zoom.us (sunucudan sunucuya OAuth).
 */
const notionB = (s: Sirlar) => ({ Authorization: `Bearer ${s("NOTION_TOKEN")}`, "Notion-Version": "2022-06-28" });
const paragraflar = (v: string) => v.split(/\n{2,}/).filter((p) => p.trim()).slice(0, 50).map((p) => ({ object: "block", type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content: p.slice(0, 2000) } }] } }));
const notionId = (v: string) => v.replace(/^.*([0-9a-f]{32}).*$/i, "$1").replace(/-/g, "");
const at = (g: Record<string, unknown>) => `https://api.airtable.com/v0/${enc(zorunlu(g, "taban", "Taban kimliği"))}/${enc(zorunlu(g, "tablo", "Tablo"))}`;
const atB = (s: Sirlar) => ({ Authorization: `Bearer ${s("AIRTABLE_TOKEN")}` });
const AT_TABAN = [{ ad: "taban", etiket: "Taban kimliği", zorunlu: true, yer: "appXXXXXXXXXXXXXX" }, { ad: "tablo", etiket: "Tablo adı ya da kimliği", zorunlu: true, yer: "Siparişler" }];
const trello = (s: Sirlar, yol: string, ek: Record<string, unknown> = {}) => `https://api.trello.com/1${yol}${sorgu({ key: s("TRELLO_KEY"), token: s("TRELLO_TOKEN"), ...ek })}`;
const TR = ["TRELLO_KEY", "TRELLO_TOKEN"];
const asana = (s: Sirlar) => ({ Authorization: `Bearer ${s("ASANA_TOKEN")}` });
const cu = (s: Sirlar) => ({ Authorization: s("CLICKUP_TOKEN") });
const td = (s: Sirlar) => ({ Authorization: `Bearer ${s("TODOIST_TOKEN")}` });
const jira = (s: Sirlar, yol: string) => `${siteKoku(s("JIRA_SITE"))}/rest/api/3${yol}`;
const jiraB = (s: Sirlar) => ({ Authorization: temel(s("JIRA_EPOSTA"), s("JIRA_TOKEN")) });
const JI = ["JIRA_SITE", "JIRA_EPOSTA", "JIRA_TOKEN"];
const adf = (v: string) => ({ type: "doc", version: 1, content: v.split(/\n{2,}/).map((p) => ({ type: "paragraph", content: [{ type: "text", text: p }] })) });
const linear = (s: Sirlar, query: string, variables: Record<string, unknown>): UygIstek => ({ yontem: "POST", url: "https://api.linear.app/graphql", basliklar: { Authorization: s("LINEAR_API_KEY") }, json: { query, variables } });
const ghB = (s: Sirlar) => ({ Authorization: `Bearer ${s("GITHUB_TOKEN")}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" });
const depo = (g: Record<string, unknown>) => { const d = zorunlu(g, "depo", "Depo"); if (!/^[\w.-]+\/[\w.-]+$/.test(d)) throw new Error("Depo sahip/depo biçiminde olmalı."); return d; };
const GH_DEPO = { ad: "depo", etiket: "Depo", zorunlu: true, yer: "sahip/depo" };
const gl = (s: Sirlar, yol: string) => `${siteKoku(s("GITLAB_SUNUCU") || "https://gitlab.com")}/api/v4${yol}`;
const glB = (s: Sirlar) => ({ "PRIVATE-TOKEN": s("GITLAB_TOKEN") });
const monday = (s: Sirlar, query: string, variables: Record<string, unknown>): UygIstek => ({ yontem: "POST", url: "https://api.monday.com/v2", basliklar: { Authorization: s("MONDAY_TOKEN") }, json: { query, variables } });
const hs = (s: Sirlar) => ({ Authorization: `Bearer ${s("HUBSPOT_TOKEN")}` });
const sf = (s: Sirlar, yol: string) => `${s("_SF_ADRES").replace(/\/+$/, "")}/services/data/v62.0${yol}`;
const sfB = (s: Sirlar) => ({ Authorization: `Bearer ${s("_SF_ERISIM")}` });
const SF = ["_SF_ERISIM", "_SF_ADRES"];
const pd = (s: Sirlar) => ({ "x-api-token": s("PIPEDRIVE_TOKEN") });
const PD = "https://api.pipedrive.com/v1";
/** Kişi, kuruluş, fırsat ve etkinlik uçlarının v1 sürümü 2026-08-01 itibarıyla desteklenmiyor; bunlar API v2 ile. Notlar v1. */
const PD2 = "https://api.pipedrive.com/api/v2";
const zoB = (s: Sirlar) => ({ Authorization: `Zoho-oauthtoken ${s("_ZOHO_ERISIM")}` });
const zo = (s: Sirlar, yol: string) => `${s("_ZOHO_API").replace(/\/+$/, "")}/crm/v7${yol}`;
const ZO = ["_ZOHO_ERISIM", "_ZOHO_API"];
const zdB = (s: Sirlar) => ({ Authorization: temel(`${s("ZENDESK_EPOSTA")}/token`, s("ZENDESK_TOKEN")) });
const zd = (s: Sirlar, yol: string) => `https://${s("ZENDESK_ALT_ALAN").replace(/\.zendesk\.com.*$/, "").replace(/^https?:\/\//, "").replace(/[^\w-]/g, "")}.zendesk.com/api/v2${yol}`;
const ZD = ["ZENDESK_ALT_ALAN", "ZENDESK_EPOSTA", "ZENDESK_TOKEN"];
const fd = (s: Sirlar, yol: string) => `https://${s("FRESHDESK_ALAN").replace(/\.freshdesk\.com.*$/, "").replace(/^https?:\/\//, "").replace(/[^\w-]/g, "")}.freshdesk.com/api/v2${yol}`;
const fdB = (s: Sirlar) => ({ Authorization: temel(s("FRESHDESK_API_KEY"), "X") });
const clB = (s: Sirlar) => ({ Authorization: `Bearer ${s("CALENDLY_TOKEN")}` });
const calB = (s: Sirlar) => ({ Authorization: `Bearer ${s("CALCOM_API_KEY")}`, "cal-api-version": "2024-08-13" });
const jfTaban = (s: Sirlar) => (s("JOTFORM_BOLGE") === "eu" ? "https://eu-api.jotform.com" : "https://api.jotform.com");

export const UYG_IS: Uygulama[] = [
  {
    id: "notion", ad: "Notion", logo: "/marka/notion.svg", kategori: "Verimlilik", aciklama: "Veritabanına sayfa ekle, ara, güncelle ve içerik ekle", belge: "https://developers.notion.com/reference/intro",
    sirlar: [{ ad: "NOTION_TOKEN", etiket: "Entegrasyon belirteci", nasil: "notion.so/my-integrations içinde iç entegrasyon oluştur; veritabanını entegrasyonla paylaş (Bağlantılar menüsü)." }],
    eylemler: [
      { id: "sayfa", ad: "Veritabanına sayfa ekle", aciklama: "Başlık ve isteğe bağlı özelliklerle", sirlar: ["NOTION_TOKEN"], alanlar: [{ ad: "veritabani", etiket: "Veritabanı kimliği", zorunlu: true, yer: "Adresteki 32 karakterlik kimlik" }, { ad: "baslikAlani", etiket: "Başlık sütunu", yer: "Name", varsayilan: "Name" }, { ad: "baslik", etiket: "Başlık", zorunlu: true }, { ad: "icerik", etiket: "Sayfa metni", tur: "uzunMetin" }, { ad: "ozellikler", etiket: "Diğer özellikler (Notion JSON)", tur: "json", yer: "{\"Durum\": {\"select\": {\"name\": \"Yeni\"}}}" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.notion.com/v1/pages", basliklar: notionB(s), json: { parent: { database_id: notionId(zorunlu(g, "veritabani", "Veritabanı kimliği")) }, properties: { [t(g.baslikAlani) || "Name"]: { title: [{ text: { content: zorunlu(g, "baslik", "Başlık").slice(0, 2000) } }] }, ...nesne(g.ozellikler, "Diğer özellikler") }, ...(t(g.icerik) ? { children: paragraflar(m(g.icerik)) } : {}) } }), sonuc: ozetAl("url") },
      { id: "ara", ad: "Veritabanında ara", aciklama: "Notion süzgeci ve sıralamayla", okuma: true, sirlar: ["NOTION_TOKEN"], alanlar: [{ ad: "veritabani", etiket: "Veritabanı kimliği", zorunlu: true }, { ad: "suzgec", etiket: "Süzgeç (Notion JSON, isteğe bağlı)", tur: "json", yer: "{\"property\": \"Durum\", \"select\": {\"equals\": \"Yeni\"}}" }, { ad: "adet", etiket: "Kaç kayıt", tur: "sayi", varsayilan: "25", yer: "25" }],
        istek: (g, s) => ({ yontem: "POST", url: `https://api.notion.com/v1/databases/${notionId(zorunlu(g, "veritabani", "Veritabanı kimliği"))}/query`, basliklar: notionB(s), json: dolu({ filter: t(g.suzgec) ? nesne(g.suzgec, "Süzgeç") : undefined, page_size: tamsayi(g.adet, 25, 1, 100), sorts: [{ timestamp: "created_time", direction: "descending" }] }) }), sonuc: (y) => ({ ozet: `${((y as { results?: unknown[] })?.results ?? []).length} sayfa` }) },
      { id: "guncelle", ad: "Sayfa özelliklerini güncelle", aciklama: "Durum, tarih, sayı gibi sütunlar", sirlar: ["NOTION_TOKEN"], alanlar: [{ ad: "sayfa", etiket: "Sayfa kimliği", zorunlu: true }, { ad: "ozellikler", etiket: "Özellikler (Notion JSON)", tur: "json", zorunlu: true, yer: "{\"Durum\": {\"select\": {\"name\": \"Tamam\"}}}" }],
        istek: (g, s) => ({ yontem: "PATCH", url: `https://api.notion.com/v1/pages/${notionId(zorunlu(g, "sayfa", "Sayfa kimliği"))}`, basliklar: notionB(s), json: { properties: nesne(g.ozellikler, "Özellikler") } }), sonuc: ozetAl("url") },
      { id: "icerik", ad: "Sayfaya metin ekle", aciklama: "Sayfanın sonuna paragraflar", sirlar: ["NOTION_TOKEN"], alanlar: [{ ad: "sayfa", etiket: "Sayfa kimliği", zorunlu: true }, { ad: "metin", etiket: "Metin", tur: "uzunMetin", zorunlu: true }],
        istek: (g, s) => ({ yontem: "PATCH", url: `https://api.notion.com/v1/blocks/${notionId(zorunlu(g, "sayfa", "Sayfa kimliği"))}/children`, basliklar: notionB(s), json: { children: paragraflar(zorunlu(g, "metin", "Metin")) } }) },
      { id: "getir", ad: "Sayfayı getir", aciklama: "Özellikleriyle", okuma: true, sirlar: ["NOTION_TOKEN"], alanlar: [{ ad: "sayfa", etiket: "Sayfa kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.notion.com/v1/pages/${notionId(zorunlu(g, "sayfa", "Sayfa kimliği"))}`, basliklar: notionB(s) }), sonuc: ozetAl("url") },
    ],
  },
  {
    id: "airtable", ad: "Airtable", logo: "/marka/baglanti/airtable.svg", kategori: "Veri", aciklama: "Kayıt ekle, ara, getir, güncelle, sil ve eşleştir", belge: "https://airtable.com/developers/web/api/introduction",
    sirlar: [{ ad: "AIRTABLE_TOKEN", etiket: "Kişisel erişim belirteci", nasil: "airtable.com/create/tokens adresinde data.records:read ve write izinli belirteç oluştur, tabanı seç." }],
    baglanti: [{ katalog: "airtable", esle: { AIRTABLE_TOKEN: "anahtar" } }],
    eylemler: [
      { id: "ekle", ad: "Kayıt ekle", aciklama: "Alanları JSON nesnesiyle", sirlar: ["AIRTABLE_TOKEN"], alanlar: [...AT_TABAN, { ad: "alanlar", etiket: "Alanlar (JSON)", tur: "json", zorunlu: true, yer: "{\"Ad\": \"{{tetik.ad}}\", \"Tutar\": {{tetik.tutar}}}" }],
        istek: (g, s) => ({ yontem: "POST", url: at(g), basliklar: atB(s), json: { fields: nesne(g.alanlar, "Alanlar"), typecast: true } }), sonuc: ozetAl("id") },
      { id: "ara", ad: "Kayıt ara", aciklama: "Formülle süz, en çok 100 kayıt", okuma: true, sirlar: ["AIRTABLE_TOKEN"], alanlar: [...AT_TABAN, { ad: "formul", etiket: "Süzgeç formülü (isteğe bağlı)", yer: "{E-posta} = 'ayse@ornek.com'" }, { ad: "sinir", etiket: "En çok kayıt", tur: "sayi", yer: "20", varsayilan: "20" }],
        istek: (g, s) => ({ yontem: "GET", url: `${at(g)}${sorgu({ maxRecords: tamsayi(g.sinir, 20, 1, 100), filterByFormula: t(g.formul) })}`, basliklar: atB(s) }), sonuc: (y) => ({ ozet: `${((y as { records?: unknown[] })?.records ?? []).length} kayıt` }) },
      { id: "getir", ad: "Kaydı getir", aciklama: "Kayıt kimliğiyle", okuma: true, sirlar: ["AIRTABLE_TOKEN"], alanlar: [...AT_TABAN, { ad: "kayit", etiket: "Kayıt kimliği", zorunlu: true, yer: "recXXXXXXXX" }],
        istek: (g, s) => ({ yontem: "GET", url: `${at(g)}/${enc(zorunlu(g, "kayit", "Kayıt kimliği"))}`, basliklar: atB(s) }) },
      { id: "guncelle", ad: "Kaydı güncelle", aciklama: "Yalnız verilen alanlar değişir", sirlar: ["AIRTABLE_TOKEN"], alanlar: [...AT_TABAN, { ad: "kayit", etiket: "Kayıt kimliği", zorunlu: true }, { ad: "alanlar", etiket: "Alanlar (JSON)", tur: "json", zorunlu: true }],
        istek: (g, s) => ({ yontem: "PATCH", url: `${at(g)}/${enc(zorunlu(g, "kayit", "Kayıt kimliği"))}`, basliklar: atB(s), json: { fields: nesne(g.alanlar, "Alanlar"), typecast: true } }) },
      { id: "eslestir", ad: "Varsa güncelle, yoksa ekle", aciklama: "Eşleşme alanına göre tek kayıt", sirlar: ["AIRTABLE_TOKEN"], alanlar: [...AT_TABAN, { ad: "eslesme", etiket: "Eşleşme alanları (virgülle)", zorunlu: true, yer: "E-posta" }, { ad: "alanlar", etiket: "Alanlar (JSON)", tur: "json", zorunlu: true }],
        istek: (g, s) => ({ yontem: "PATCH", url: at(g), basliklar: atB(s), json: { performUpsert: { fieldsToMergeOn: virgul(zorunlu(g, "eslesme", "Eşleşme alanı")) }, records: [{ fields: nesne(g.alanlar, "Alanlar") }], typecast: true } }) },
      { id: "sil", ad: "Kaydı sil", aciklama: "Kayıt kimliğiyle", sirlar: ["AIRTABLE_TOKEN"], alanlar: [...AT_TABAN, { ad: "kayit", etiket: "Kayıt kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "DELETE", url: `${at(g)}/${enc(zorunlu(g, "kayit", "Kayıt kimliği"))}`, basliklar: atB(s) }) },
    ],
  },
  {
    id: "trello", ad: "Trello", logo: "/marka/baglanti/trello.svg", kategori: "Proje", aciklama: "Kart oluştur, taşı, yorumla ve ara", belge: "https://developer.atlassian.com/cloud/trello/rest/api-group-cards/",
    sirlar: [{ ad: "TRELLO_KEY", etiket: "API anahtarı", nasil: "trello.com/power-ups/admin üzerinden Power-Up oluşturup API anahtarını al." }, { ad: "TRELLO_TOKEN", etiket: "Belirteç", nasil: "Aynı sayfadaki Token bağlantısıyla yetki ver." }],
    eylemler: [
      { id: "kart", ad: "Kart oluştur", aciklama: "Listeye ad, açıklama ve bitiş tarihiyle", sirlar: TR, alanlar: [{ ad: "liste", etiket: "Liste kimliği", zorunlu: true, yer: "Liste adresinde .json ile bulunur" }, { ad: "ad", etiket: "Kart adı", zorunlu: true }, { ad: "aciklama", etiket: "Açıklama", tur: "uzunMetin" }, { ad: "bitis", etiket: "Bitiş tarihi (isteğe bağlı)", yer: "2026-11-10" }],
        istek: (g, s) => ({ yontem: "POST", url: trello(s, "/cards"), json: dolu({ idList: zorunlu(g, "liste", "Liste kimliği"), name: zorunlu(g, "ad", "Kart adı"), desc: m(g.aciklama), due: t(g.bitis) }) }), sonuc: ozetAl("shortUrl") },
      { id: "tasi", ad: "Kartı başka listeye taşı", aciklama: "Ör. Yapılıyor listesinden Bitti listesine", sirlar: TR, alanlar: [{ ad: "kart", etiket: "Kart kimliği", zorunlu: true }, { ad: "liste", etiket: "Hedef liste kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "PUT", url: trello(s, `/cards/${enc(zorunlu(g, "kart", "Kart kimliği"))}`, { idList: zorunlu(g, "liste", "Liste kimliği") }) }), sonuc: ozetAl("shortUrl") },
      { id: "yorum", ad: "Karta yorum ekle", aciklama: "Kart etkinliğine metin", sirlar: TR, alanlar: [{ ad: "kart", etiket: "Kart kimliği", zorunlu: true }, { ad: "metin", etiket: "Yorum", tur: "uzunMetin", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: trello(s, `/cards/${enc(zorunlu(g, "kart", "Kart kimliği"))}/actions/comments`, { text: zorunlu(g, "metin", "Yorum") }) }) },
      { id: "ara", ad: "Kart ara", aciklama: "Bütün panolarda", okuma: true, sirlar: TR, alanlar: [{ ad: "sorgu", etiket: "Arama", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: trello(s, "/search", { query: zorunlu(g, "sorgu", "Arama"), modelTypes: "cards", cards_limit: 20 }) }) },
    ],
  },
  {
    id: "asana", ad: "Asana", logo: "/marka/baglanti/asana.svg", kategori: "Proje", aciklama: "Görev, alt görev, yorum ve tamamlama", belge: "https://developers.asana.com/reference/rest-api-reference",
    sirlar: [{ ad: "ASANA_TOKEN", etiket: "Kişisel erişim belirteci", nasil: "app.asana.com/0/my-apps adresinden oluştur." }],
    eylemler: [
      { id: "gorev", ad: "Görev oluştur", aciklama: "Projeye ad ve notla", sirlar: ["ASANA_TOKEN"], alanlar: [{ ad: "proje", etiket: "Proje kimliği", zorunlu: true }, { ad: "ad", etiket: "Görev adı", zorunlu: true }, { ad: "not", etiket: "Not", tur: "uzunMetin" }, { ad: "bitis", etiket: "Bitiş günü", yer: "2026-11-10" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://app.asana.com/api/1.0/tasks", basliklar: asana(s), json: { data: dolu({ name: zorunlu(g, "ad", "Görev adı"), notes: m(g.not), projects: [zorunlu(g, "proje", "Proje kimliği")], due_on: t(g.bitis) }) } }), sonuc: ozetAl("data.permalink_url") },
      { id: "alt", ad: "Alt görev ekle", aciklama: "Görevin altına", sirlar: ["ASANA_TOKEN"], alanlar: [{ ad: "gorev", etiket: "Üst görev kimliği", zorunlu: true }, { ad: "ad", etiket: "Alt görev adı", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: `https://app.asana.com/api/1.0/tasks/${enc(zorunlu(g, "gorev", "Görev kimliği"))}/subtasks`, basliklar: asana(s), json: { data: { name: zorunlu(g, "ad", "Alt görev adı") } } }) },
      { id: "yorum", ad: "Göreve yorum ekle", aciklama: "Görev akışına metin", sirlar: ["ASANA_TOKEN"], alanlar: [{ ad: "gorev", etiket: "Görev kimliği", zorunlu: true }, { ad: "metin", etiket: "Yorum", tur: "uzunMetin", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: `https://app.asana.com/api/1.0/tasks/${enc(zorunlu(g, "gorev", "Görev kimliği"))}/stories`, basliklar: asana(s), json: { data: { text: zorunlu(g, "metin", "Yorum") } } }) },
      { id: "tamamla", ad: "Görevi tamamla", aciklama: "Tamamlandı işaretler", sirlar: ["ASANA_TOKEN"], alanlar: [{ ad: "gorev", etiket: "Görev kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "PUT", url: `https://app.asana.com/api/1.0/tasks/${enc(zorunlu(g, "gorev", "Görev kimliği"))}`, basliklar: asana(s), json: { data: { completed: true } } }) },
    ],
  },
  {
    id: "clickup", ad: "ClickUp", logo: "/marka/baglanti/clickup.svg", kategori: "Proje", aciklama: "Görev oluştur, güncelle, yorumla ve listele", belge: "https://developer.clickup.com/reference/createtask",
    sirlar: [{ ad: "CLICKUP_TOKEN", etiket: "Kişisel belirteç", nasil: "ClickUp ayarlarında Apps bölümünden pk_ ile başlayan belirteç." }],
    eylemler: [
      { id: "gorev", ad: "Görev oluştur", aciklama: "Listeye ad, açıklama ve önceliğiyle", sirlar: ["CLICKUP_TOKEN"], alanlar: [{ ad: "liste", etiket: "Liste kimliği", zorunlu: true }, { ad: "ad", etiket: "Görev adı", zorunlu: true }, { ad: "aciklama", etiket: "Açıklama", tur: "uzunMetin" }, { ad: "oncelik", etiket: "Öncelik", tur: "secim", secenekler: [{ id: "", ad: "Yok" }, { id: "1", ad: "Acil" }, { id: "2", ad: "Yüksek" }, { id: "3", ad: "Normal" }, { id: "4", ad: "Düşük" }] }],
        istek: (g, s) => ({ yontem: "POST", url: `https://api.clickup.com/api/v2/list/${enc(zorunlu(g, "liste", "Liste kimliği"))}/task`, basliklar: cu(s), json: dolu({ name: zorunlu(g, "ad", "Görev adı"), description: m(g.aciklama), priority: t(g.oncelik) ? Number(g.oncelik) : undefined }) }), sonuc: ozetAl("url") },
      { id: "durum", ad: "Görev durumunu değiştir", aciklama: "Durum adıyla, ör. complete", sirlar: ["CLICKUP_TOKEN"], alanlar: [{ ad: "gorev", etiket: "Görev kimliği", zorunlu: true }, { ad: "durum", etiket: "Yeni durum", zorunlu: true, yer: "complete" }],
        istek: (g, s) => ({ yontem: "PUT", url: `https://api.clickup.com/api/v2/task/${enc(zorunlu(g, "gorev", "Görev kimliği"))}`, basliklar: cu(s), json: { status: zorunlu(g, "durum", "Durum") } }), sonuc: ozetAl("status.status") },
      { id: "yorum", ad: "Göreve yorum ekle", aciklama: "Metin yorumu", sirlar: ["CLICKUP_TOKEN"], alanlar: [{ ad: "gorev", etiket: "Görev kimliği", zorunlu: true }, { ad: "metin", etiket: "Yorum", tur: "uzunMetin", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: `https://api.clickup.com/api/v2/task/${enc(zorunlu(g, "gorev", "Görev kimliği"))}/comment`, basliklar: cu(s), json: { comment_text: zorunlu(g, "metin", "Yorum"), notify_all: false } }) },
      { id: "listele", ad: "Listedeki görevleri getir", aciklama: "Açık görevler", okuma: true, sirlar: ["CLICKUP_TOKEN"], alanlar: [{ ad: "liste", etiket: "Liste kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.clickup.com/api/v2/list/${enc(zorunlu(g, "liste", "Liste kimliği"))}/task`, basliklar: cu(s) }), sonuc: (y) => ({ ozet: `${((y as { tasks?: unknown[] })?.tasks ?? []).length} görev` }) },
    ],
  },
  {
    id: "todoist", ad: "Todoist", logo: "/marka/todoist.svg", kategori: "Verimlilik", aciklama: "Görev ekle, tamamla, listele ve yorumla", belge: "https://developer.todoist.com/api/v1/",
    sirlar: [{ ad: "TODOIST_TOKEN", etiket: "API belirteci", nasil: "Todoist ayarlarında Integrations, Developer bölümündeki API token." }],
    eylemler: [
      { id: "gorev", ad: "Görev ekle", aciklama: "Doğal dille tarih: yarın 10:00", sirlar: ["TODOIST_TOKEN"], alanlar: [{ ad: "icerik", etiket: "Görev", zorunlu: true }, { ad: "zaman", etiket: "Ne zaman (isteğe bağlı)", yer: "yarın 10:00" }, { ad: "oncelik", etiket: "Öncelik", tur: "secim", secenekler: [{ id: "1", ad: "Normal" }, { id: "2", ad: "Orta" }, { id: "3", ad: "Yüksek" }, { id: "4", ad: "Acil" }] }, { ad: "proje", etiket: "Proje kimliği (isteğe bağlı)" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.todoist.com/api/v1/tasks", basliklar: td(s), json: dolu({ content: zorunlu(g, "icerik", "Görev"), due_string: t(g.zaman), due_lang: t(g.zaman) ? "tr" : undefined, priority: t(g.oncelik) ? Number(g.oncelik) : undefined, project_id: t(g.proje) }) }), sonuc: ozetAl("id") },
      { id: "tamamla", ad: "Görevi tamamla", aciklama: "Görev kimliğiyle", sirlar: ["TODOIST_TOKEN"], alanlar: [{ ad: "gorev", etiket: "Görev kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: `https://api.todoist.com/api/v1/tasks/${enc(zorunlu(g, "gorev", "Görev kimliği"))}/close`, basliklar: td(s), yanit: "metin" }) },
      { id: "listele", ad: "Görevleri listele", aciklama: "Projeye göre açık görevler", okuma: true, sirlar: ["TODOIST_TOKEN"], alanlar: [{ ad: "proje", etiket: "Proje kimliği (isteğe bağlı)" }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.todoist.com/api/v1/tasks${sorgu({ project_id: t(g.proje), limit: 100 })}`, basliklar: td(s) }), sonuc: (y) => ({ ozet: `${((y as { results?: unknown[] })?.results ?? []).length} görev` }) },
      { id: "yorum", ad: "Göreve yorum ekle", aciklama: "Görev notu", sirlar: ["TODOIST_TOKEN"], alanlar: [{ ad: "gorev", etiket: "Görev kimliği", zorunlu: true }, { ad: "metin", etiket: "Yorum", tur: "uzunMetin", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.todoist.com/api/v1/comments", basliklar: td(s), json: { task_id: zorunlu(g, "gorev", "Görev kimliği"), content: zorunlu(g, "metin", "Yorum") } }) },
    ],
  },
  {
    id: "jira", ad: "Jira", logo: "/marka/jira.svg", kategori: "Proje", aciklama: "İş kaydı, yorum, geçiş, atama ve JQL arama", belge: "https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/",
    sirlar: [{ ad: "JIRA_SITE", etiket: "Site adresi", nasil: "https://firman.atlassian.net biçiminde." }, { ad: "JIRA_EPOSTA", etiket: "Hesap e-postası", nasil: "Atlassian hesabının e-postası." }, { ad: "JIRA_TOKEN", etiket: "API belirteci", nasil: "id.atlassian.com/manage-profile/security/api-tokens adresinden oluştur." }],
    eylemler: [
      { id: "kayit", ad: "İş kaydı oluştur", aciklama: "Projeye özet ve açıklamayla", sirlar: JI, alanlar: [{ ad: "proje", etiket: "Proje anahtarı", zorunlu: true, yer: "DESTEK" }, { ad: "tur", etiket: "Kayıt türü", yer: "Task", varsayilan: "Task" }, { ad: "ozet", etiket: "Özet", zorunlu: true }, { ad: "aciklama", etiket: "Açıklama", tur: "uzunMetin" }, { ad: "etiketler", etiket: "Etiketler (virgülle)" }],
        istek: (g, s) => ({ yontem: "POST", url: jira(s, "/issue"), basliklar: jiraB(s), json: { fields: dolu({ project: { key: zorunlu(g, "proje", "Proje anahtarı") }, issuetype: { name: t(g.tur) || "Task" }, summary: zorunlu(g, "ozet", "Özet").slice(0, 250), description: t(g.aciklama) ? adf(m(g.aciklama)) : undefined, labels: virgul(g.etiketler).map((x) => x.replace(/\s+/g, "-")) }) } }), sonuc: ozetAl("key") },
      { id: "yorum", ad: "Kayda yorum ekle", aciklama: "Kayıt anahtarıyla", sirlar: JI, alanlar: [{ ad: "kayit", etiket: "Kayıt anahtarı", zorunlu: true, yer: "DESTEK-12" }, { ad: "metin", etiket: "Yorum", tur: "uzunMetin", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: jira(s, `/issue/${enc(zorunlu(g, "kayit", "Kayıt anahtarı"))}/comment`), basliklar: jiraB(s), json: { body: adf(zorunlu(g, "metin", "Yorum")) } }) },
      { id: "gecis", ad: "Kaydın durumunu değiştir", aciklama: "Geçiş kimliğiyle (ör. Done)", sirlar: JI, alanlar: [{ ad: "kayit", etiket: "Kayıt anahtarı", zorunlu: true }, { ad: "gecis", etiket: "Geçiş kimliği", zorunlu: true, yer: "31", aciklama: "Kaydın transitions listesinden" }],
        istek: (g, s) => ({ yontem: "POST", url: jira(s, `/issue/${enc(zorunlu(g, "kayit", "Kayıt anahtarı"))}/transitions`), basliklar: jiraB(s), json: { transition: { id: zorunlu(g, "gecis", "Geçiş kimliği") } }, yanit: "metin" }) },
      { id: "ata", ad: "Kaydı kişiye ata", aciklama: "Atlassian hesap kimliğiyle", sirlar: JI, alanlar: [{ ad: "kayit", etiket: "Kayıt anahtarı", zorunlu: true }, { ad: "kisi", etiket: "Hesap kimliği (accountId)", zorunlu: true }],
        istek: (g, s) => ({ yontem: "PUT", url: jira(s, `/issue/${enc(zorunlu(g, "kayit", "Kayıt anahtarı"))}/assignee`), basliklar: jiraB(s), json: { accountId: zorunlu(g, "kisi", "Hesap kimliği") }, yanit: "metin" }) },
      { id: "ara", ad: "JQL ile ara", aciklama: "Kayıtları sorguyla bul", okuma: true, sirlar: JI, alanlar: [{ ad: "jql", etiket: "JQL", zorunlu: true, yer: "project = DESTEK AND status = \"To Do\" ORDER BY created DESC" }, { ad: "adet", etiket: "Kaç kayıt", tur: "sayi", varsayilan: "25", yer: "25" }],
        istek: (g, s) => ({ yontem: "POST", url: jira(s, "/search/jql"), basliklar: jiraB(s), json: { jql: zorunlu(g, "jql", "JQL"), maxResults: tamsayi(g.adet, 25, 1, 100), fields: ["summary", "status", "assignee", "created", "priority"] } }), sonuc: (y) => ({ ozet: `${((y as { issues?: unknown[] })?.issues ?? []).length} kayıt` }) },
    ],
  },
  {
    id: "linear", ad: "Linear", logo: "/marka/linear.svg", kategori: "Geliştirme", aciklama: "Konu oluştur, yorumla, durum değiştir ve ara", belge: "https://linear.app/developers/graphql",
    sirlar: [{ ad: "LINEAR_API_KEY", etiket: "API anahtarı", nasil: "Linear ayarlarında Security & access, Personal API keys bölümünden lin_api_ ile başlayan anahtar." }],
    baglanti: [{ katalog: "linear", esle: { LINEAR_API_KEY: "anahtar" } }],
    eylemler: [
      { id: "konu", ad: "Konu oluştur", aciklama: "Takıma başlık ve açıklamayla", sirlar: ["LINEAR_API_KEY"], alanlar: [{ ad: "takim", etiket: "Takım kimliği", zorunlu: true, yer: "Takım ayarlarındaki kimlik" }, { ad: "baslik", etiket: "Başlık", zorunlu: true }, { ad: "aciklama", etiket: "Açıklama (Markdown)", tur: "uzunMetin" }, { ad: "oncelik", etiket: "Öncelik", tur: "secim", secenekler: [{ id: "0", ad: "Yok" }, { id: "1", ad: "Acil" }, { id: "2", ad: "Yüksek" }, { id: "3", ad: "Orta" }, { id: "4", ad: "Düşük" }] }],
        istek: (g, s) => linear(s, "mutation($i: IssueCreateInput!) { issueCreate(input: $i) { success issue { id identifier url } } }", { i: dolu({ teamId: zorunlu(g, "takim", "Takım kimliği"), title: zorunlu(g, "baslik", "Başlık"), description: m(g.aciklama), priority: t(g.oncelik) ? Number(g.oncelik) : undefined }) }), sonuc: gqlDenetle((d) => m((d.issueCreate as { issue?: { url?: string } })?.issue?.url)) },
      { id: "yorum", ad: "Konuya yorum ekle", aciklama: "Markdown yorum", sirlar: ["LINEAR_API_KEY"], alanlar: [{ ad: "konu", etiket: "Konu kimliği", zorunlu: true }, { ad: "metin", etiket: "Yorum", tur: "uzunMetin", zorunlu: true }],
        istek: (g, s) => linear(s, "mutation($i: CommentCreateInput!) { commentCreate(input: $i) { success comment { id url } } }", { i: { issueId: zorunlu(g, "konu", "Konu kimliği"), body: zorunlu(g, "metin", "Yorum") } }), sonuc: gqlDenetle((d) => m((d.commentCreate as { comment?: { url?: string } })?.comment?.url)) },
      { id: "durum", ad: "Konunun durumunu değiştir", aciklama: "İş akışı durum kimliğiyle", sirlar: ["LINEAR_API_KEY"], alanlar: [{ ad: "konu", etiket: "Konu kimliği", zorunlu: true }, { ad: "durum", etiket: "Durum kimliği (stateId)", zorunlu: true }],
        istek: (g, s) => linear(s, "mutation($id: String!, $i: IssueUpdateInput!) { issueUpdate(id: $id, input: $i) { success issue { identifier state { name } } } }", { id: zorunlu(g, "konu", "Konu kimliği"), i: { stateId: zorunlu(g, "durum", "Durum kimliği") } }), sonuc: gqlDenetle() },
      { id: "ara", ad: "Konu ara", aciklama: "Başlıkta geçen kelimeyle", okuma: true, sirlar: ["LINEAR_API_KEY"], alanlar: [{ ad: "sorgu", etiket: "Arama", zorunlu: true }],
        istek: (g, s) => linear(s, "query($q: String!) { issues(first: 20, filter: { title: { containsIgnoreCase: $q } }) { nodes { id identifier title url state { name } } } }", { q: zorunlu(g, "sorgu", "Arama") }), sonuc: gqlDenetle() },
    ],
  },
  {
    id: "github", ad: "GitHub", logo: "/marka/github.svg", kategori: "Geliştirme", aciklama: "Konu, yorum, sürüm, iş akışı ve dosya", belge: "https://docs.github.com/rest",
    sirlar: [{ ad: "GITHUB_TOKEN", etiket: "Erişim belirteci", nasil: "github.com/settings/tokens adresinde Issues, Contents ve Actions izinli ince taneli belirteç oluştur." }],
    baglanti: [{ katalog: "github", esle: { GITHUB_TOKEN: "anahtar" } }],
    eylemler: [
      { id: "konu", ad: "Konu (issue) aç", aciklama: "Başlık, gövde ve etiketlerle", sirlar: ["GITHUB_TOKEN"], alanlar: [GH_DEPO, { ad: "baslik", etiket: "Başlık", zorunlu: true }, { ad: "govde", etiket: "Gövde", tur: "uzunMetin" }, { ad: "etiketler", etiket: "Etiketler (virgülle)", yer: "hata, destek" }],
        istek: (g, s) => ({ yontem: "POST", url: `https://api.github.com/repos/${depo(g)}/issues`, basliklar: ghB(s), json: { title: zorunlu(g, "baslik", "Başlık"), body: m(g.govde), labels: virgul(g.etiketler) } }), sonuc: ozetAl("html_url") },
      { id: "yorum", ad: "Konuya yorum yaz", aciklama: "Konu ya da çekme isteği numarasıyla", sirlar: ["GITHUB_TOKEN"], alanlar: [GH_DEPO, { ad: "no", etiket: "Numara", zorunlu: true, tur: "sayi" }, { ad: "metin", etiket: "Yorum", tur: "uzunMetin", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: `https://api.github.com/repos/${depo(g)}/issues/${tamsayi(g.no, 0, 1, 1e9)}/comments`, basliklar: ghB(s), json: { body: zorunlu(g, "metin", "Yorum") } }), sonuc: ozetAl("html_url") },
      { id: "kapat", ad: "Konuyu kapat", aciklama: "Tamamlandı nedeniyle", sirlar: ["GITHUB_TOKEN"], alanlar: [GH_DEPO, { ad: "no", etiket: "Konu numarası", zorunlu: true, tur: "sayi" }],
        istek: (g, s) => ({ yontem: "PATCH", url: `https://api.github.com/repos/${depo(g)}/issues/${tamsayi(g.no, 0, 1, 1e9)}`, basliklar: ghB(s), json: { state: "closed", state_reason: "completed" } }), sonuc: ozetAl("state") },
      { id: "surum", ad: "Sürüm yayınla", aciklama: "Etiket, başlık ve notla release", sirlar: ["GITHUB_TOKEN"], alanlar: [GH_DEPO, { ad: "etiket", etiket: "Etiket", zorunlu: true, yer: "v1.4.0" }, { ad: "ad", etiket: "Başlık" }, { ad: "not", etiket: "Sürüm notu", tur: "uzunMetin" }, { ad: "taslak", etiket: "Taslak", tur: "evet-hayir" }],
        istek: (g, s) => ({ yontem: "POST", url: `https://api.github.com/repos/${depo(g)}/releases`, basliklar: ghB(s), json: dolu({ tag_name: zorunlu(g, "etiket", "Etiket"), name: t(g.ad), body: m(g.not), draft: evet(g.taslak), generate_release_notes: !t(g.not) }) }), sonuc: ozetAl("html_url") },
      { id: "is-akisi", ad: "İş akışını tetikle", aciklama: "Actions workflow_dispatch", sirlar: ["GITHUB_TOKEN"], alanlar: [GH_DEPO, { ad: "dosya", etiket: "İş akışı dosyası", zorunlu: true, yer: "deploy.yml" }, { ad: "dal", etiket: "Dal", yer: "main", varsayilan: "main" }, { ad: "girdiler", etiket: "Girdiler (JSON)", tur: "json" }],
        istek: (g, s) => ({ yontem: "POST", url: `https://api.github.com/repos/${depo(g)}/actions/workflows/${enc(zorunlu(g, "dosya", "İş akışı dosyası"))}/dispatches`, basliklar: ghB(s), json: dolu({ ref: t(g.dal) || "main", inputs: t(g.girdiler) ? nesne(g.girdiler, "Girdiler") : undefined }), yanit: "metin" }) },
      { id: "dosya", ad: "Dosya oluştur", aciklama: "Depoya yeni dosya commit'le", sirlar: ["GITHUB_TOKEN"], alanlar: [GH_DEPO, { ad: "yol", etiket: "Dosya yolu", zorunlu: true, yer: "raporlar/2026-11.md" }, { ad: "icerik", etiket: "İçerik", tur: "uzunMetin", zorunlu: true }, { ad: "mesaj", etiket: "Commit mesajı", yer: "Vayra raporu", varsayilan: "Vayra raporu" }, { ad: "dal", etiket: "Dal (isteğe bağlı)" }],
        istek: (g, s) => ({ yontem: "PUT", url: `https://api.github.com/repos/${depo(g)}/contents/${zorunlu(g, "yol", "Dosya yolu").replace(/^\/+/, "").split("/").map(enc).join("/")}`, basliklar: ghB(s), json: dolu({ message: t(g.mesaj) || "Vayra raporu", content: b64(m(g.icerik)), branch: t(g.dal) }) }), sonuc: ozetAl("content.html_url") },
      { id: "cekme", ad: "Açık çekme isteklerini listele", aciklama: "Son güncellenenler", okuma: true, sirlar: ["GITHUB_TOKEN"], alanlar: [GH_DEPO],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.github.com/repos/${depo(g)}/pulls?state=open&sort=updated&direction=desc&per_page=30`, basliklar: ghB(s) }), sonuc: (y) => ({ ozet: `${Array.isArray(y) ? y.length : 0} çekme isteği` }) },
    ],
  },
  {
    id: "gitlab", ad: "GitLab", logo: "/marka/uyg/gitlab.svg", kategori: "Geliştirme", aciklama: "Konu, not ve işlem hattı", belge: "https://docs.gitlab.com/api/rest/",
    sirlar: [{ ad: "GITLAB_TOKEN", etiket: "Kişisel erişim belirteci", nasil: "GitLab, Profil, Access tokens; api kapsamlı belirteç." }, { ad: "GITLAB_SUNUCU", etiket: "Sunucu", nasil: "Boşsa gitlab.com; kendi sunucunsa adresi.", istege: true }],
    eylemler: [
      { id: "konu", ad: "Konu aç", aciklama: "Projeye başlık, açıklama ve etiketle", sirlar: ["GITLAB_TOKEN"], alanlar: [{ ad: "proje", etiket: "Proje kimliği ya da yolu", zorunlu: true, yer: "grup/proje" }, { ad: "baslik", etiket: "Başlık", zorunlu: true }, { ad: "aciklama", etiket: "Açıklama", tur: "uzunMetin" }, { ad: "etiketler", etiket: "Etiketler (virgülle)" }],
        istek: (g, s) => ({ yontem: "POST", url: gl(s, `/projects/${enc(zorunlu(g, "proje", "Proje"))}/issues`), basliklar: glB(s), json: dolu({ title: zorunlu(g, "baslik", "Başlık"), description: t(g.aciklama), labels: virgul(g.etiketler).join(",") }) }), sonuc: ozetAl("web_url") },
      { id: "not", ad: "Konuya not ekle", aciklama: "Konu numarasıyla", sirlar: ["GITLAB_TOKEN"], alanlar: [{ ad: "proje", etiket: "Proje kimliği ya da yolu", zorunlu: true }, { ad: "no", etiket: "Konu numarası (iid)", zorunlu: true, tur: "sayi" }, { ad: "metin", etiket: "Not", tur: "uzunMetin", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: gl(s, `/projects/${enc(zorunlu(g, "proje", "Proje"))}/issues/${tamsayi(g.no, 0, 1, 1e9)}/notes`), basliklar: glB(s), json: { body: zorunlu(g, "metin", "Not") } }) },
      { id: "hat", ad: "İşlem hattını başlat", aciklama: "Dal ya da etiket için pipeline", sirlar: ["GITLAB_TOKEN"], alanlar: [{ ad: "proje", etiket: "Proje kimliği ya da yolu", zorunlu: true }, { ad: "dal", etiket: "Dal", yer: "main", varsayilan: "main" }],
        istek: (g, s) => ({ yontem: "POST", url: gl(s, `/projects/${enc(zorunlu(g, "proje", "Proje"))}/pipeline`), basliklar: glB(s), json: { ref: t(g.dal) || "main" } }), sonuc: ozetAl("web_url") },
    ],
  },
  {
    id: "monday", ad: "monday.com", logo: "/marka/baglanti/monday.svg", kategori: "Proje", aciklama: "Öğe oluştur, sütun güncelle ve güncelleme yaz", belge: "https://developer.monday.com/api-reference/",
    sirlar: [{ ad: "MONDAY_TOKEN", etiket: "API belirteci", nasil: "monday.com, Profil, Developers, My access tokens." }],
    baglanti: [{ katalog: "monday", esle: { MONDAY_TOKEN: "anahtar" } }],
    eylemler: [
      { id: "oge", ad: "Öğe oluştur", aciklama: "Panoya ad ve sütun değerleriyle", sirlar: ["MONDAY_TOKEN"], alanlar: [{ ad: "pano", etiket: "Pano kimliği", zorunlu: true }, { ad: "grup", etiket: "Grup kimliği (isteğe bağlı)", yer: "topics" }, { ad: "ad", etiket: "Öğe adı", zorunlu: true }, { ad: "sutunlar", etiket: "Sütun değerleri (JSON)", tur: "json", yer: "{\"status\": {\"label\": \"Yeni\"}}" }],
        istek: (g, s) => monday(s, "mutation($b: ID!, $g: String, $n: String!, $c: JSON) { create_item(board_id: $b, group_id: $g, item_name: $n, column_values: $c) { id url } }", dolu({ b: zorunlu(g, "pano", "Pano kimliği"), g: t(g.grup), n: zorunlu(g, "ad", "Öğe adı"), c: t(g.sutunlar) ? JSON.stringify(nesne(g.sutunlar, "Sütun değerleri")) : undefined })), sonuc: gqlDenetle((d) => m((d.create_item as { url?: string })?.url)) },
      { id: "sutun", ad: "Sütunları güncelle", aciklama: "Öğenin bir ya da çok sütunu", sirlar: ["MONDAY_TOKEN"], alanlar: [{ ad: "pano", etiket: "Pano kimliği", zorunlu: true }, { ad: "oge", etiket: "Öğe kimliği", zorunlu: true }, { ad: "sutunlar", etiket: "Sütun değerleri (JSON)", tur: "json", zorunlu: true }],
        istek: (g, s) => monday(s, "mutation($b: ID!, $i: ID!, $c: JSON!) { change_multiple_column_values(board_id: $b, item_id: $i, column_values: $c) { id } }", { b: zorunlu(g, "pano", "Pano kimliği"), i: zorunlu(g, "oge", "Öğe kimliği"), c: JSON.stringify(nesne(g.sutunlar, "Sütun değerleri")) }), sonuc: gqlDenetle() },
      { id: "guncelleme", ad: "Güncelleme yaz", aciklama: "Öğeye yorum (update)", sirlar: ["MONDAY_TOKEN"], alanlar: [{ ad: "oge", etiket: "Öğe kimliği", zorunlu: true }, { ad: "metin", etiket: "Metin", tur: "uzunMetin", zorunlu: true }],
        istek: (g, s) => monday(s, "mutation($i: ID!, $t: String!) { create_update(item_id: $i, body: $t) { id } }", { i: zorunlu(g, "oge", "Öğe kimliği"), t: zorunlu(g, "metin", "Metin") }), sonuc: gqlDenetle() },
    ],
  },
  {
    id: "hubspot", ad: "HubSpot", logo: "/marka/hubspot.svg", kategori: "Satış", aciklama: "Kişi, şirket, fırsat, bilet ve not", belge: "https://developers.hubspot.com/docs/api-reference/crm-contacts-v3/guide",
    sirlar: [{ ad: "HUBSPOT_TOKEN", etiket: "Özel uygulama belirteci", nasil: "HubSpot ayarlarında Integrations, Private Apps bölümünden crm.objects izinli uygulama oluştur." }],
    eylemler: [
      { id: "kisi", ad: "Kişi oluştur", aciklama: "E-posta, ad, telefon ve şirket", sirlar: ["HUBSPOT_TOKEN"], alanlar: [{ ad: "eposta", etiket: "E-posta", zorunlu: true }, { ad: "ad", etiket: "Ad" }, { ad: "soyad", etiket: "Soyad" }, { ad: "telefon", etiket: "Telefon" }, { ad: "sirket", etiket: "Şirket" }, { ad: "ek", etiket: "Diğer özellikler (JSON)", tur: "json", yer: "{\"lifecyclestage\": \"lead\"}" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.hubapi.com/crm/v3/objects/contacts", basliklar: hs(s), json: { properties: dolu({ email: zorunlu(g, "eposta", "E-posta"), firstname: t(g.ad), lastname: t(g.soyad), phone: t(g.telefon), company: t(g.sirket), ...nesne(g.ek, "Diğer özellikler") }) } }), sonuc: ozetAl("id") },
      { id: "kisi-ara", ad: "Kişiyi e-postayla bul", aciklama: "Var mı diye bakmak için", okuma: true, sirlar: ["HUBSPOT_TOKEN"], alanlar: [{ ad: "eposta", etiket: "E-posta", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.hubapi.com/crm/v3/objects/contacts/search", basliklar: hs(s), json: { filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: zorunlu(g, "eposta", "E-posta") }] }], properties: ["email", "firstname", "lastname", "phone", "lifecyclestage"], limit: 1 } }), sonuc: (y) => ({ ozet: `${(y as { total?: number })?.total ?? 0} kişi` }) },
      { id: "kisi-guncelle", ad: "Kişiyi güncelle", aciklama: "Kişi kimliğiyle özellikler", sirlar: ["HUBSPOT_TOKEN"], alanlar: [{ ad: "kisi", etiket: "Kişi kimliği", zorunlu: true }, { ad: "ozellikler", etiket: "Özellikler (JSON)", tur: "json", zorunlu: true }],
        istek: (g, s) => ({ yontem: "PATCH", url: `https://api.hubapi.com/crm/v3/objects/contacts/${enc(zorunlu(g, "kisi", "Kişi kimliği"))}`, basliklar: hs(s), json: { properties: nesne(g.ozellikler, "Özellikler") } }) },
      { id: "sirket", ad: "Şirket oluştur", aciklama: "Ad ve alan adıyla", sirlar: ["HUBSPOT_TOKEN"], alanlar: [{ ad: "ad", etiket: "Şirket adı", zorunlu: true }, { ad: "alan", etiket: "Alan adı", yer: "firma.com" }, { ad: "sehir", etiket: "Şehir" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.hubapi.com/crm/v3/objects/companies", basliklar: hs(s), json: { properties: dolu({ name: zorunlu(g, "ad", "Şirket adı"), domain: t(g.alan), city: t(g.sehir) }) } }), sonuc: ozetAl("id") },
      { id: "firsat", ad: "Fırsat oluştur", aciklama: "Ad, tutar ve aşama", sirlar: ["HUBSPOT_TOKEN"], alanlar: [{ ad: "ad", etiket: "Fırsat adı", zorunlu: true }, { ad: "tutar", etiket: "Tutar", tur: "sayi" }, { ad: "asama", etiket: "Aşama", yer: "appointmentscheduled", varsayilan: "appointmentscheduled" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.hubapi.com/crm/v3/objects/deals", basliklar: hs(s), json: { properties: dolu({ dealname: zorunlu(g, "ad", "Fırsat adı"), amount: t(g.tutar), dealstage: t(g.asama) || "appointmentscheduled" }) } }), sonuc: ozetAl("id") },
      { id: "bilet", ad: "Destek bileti oluştur", aciklama: "Konu ve içerikle", sirlar: ["HUBSPOT_TOKEN"], alanlar: [{ ad: "konu", etiket: "Konu", zorunlu: true }, { ad: "icerik", etiket: "İçerik", tur: "uzunMetin" }, { ad: "hat", etiket: "Hat kimliği", yer: "0", varsayilan: "0" }, { ad: "asama", etiket: "Aşama kimliği", yer: "1", varsayilan: "1" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.hubapi.com/crm/v3/objects/tickets", basliklar: hs(s), json: { properties: dolu({ subject: zorunlu(g, "konu", "Konu"), content: t(g.icerik), hs_pipeline: t(g.hat) || "0", hs_pipeline_stage: t(g.asama) || "1" }) } }), sonuc: ozetAl("id") },
      { id: "not", ad: "Kişiye not ekle", aciklama: "Zaman çizelgesine not", sirlar: ["HUBSPOT_TOKEN"], alanlar: [{ ad: "kisi", etiket: "Kişi kimliği", zorunlu: true }, { ad: "metin", etiket: "Not", tur: "uzunMetin", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.hubapi.com/crm/v3/objects/notes", basliklar: hs(s), json: { properties: { hs_note_body: zorunlu(g, "metin", "Not"), hs_timestamp: new Date().toISOString() }, associations: [{ to: { id: zorunlu(g, "kisi", "Kişi kimliği") }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }] }] } }), sonuc: ozetAl("id") },
    ],
  },
  {
    id: "salesforce", ad: "Salesforce", logo: "/marka/salesforce_alt.svg", kategori: "Satış", aciklama: "Aday, kayıt oluştur ve güncelle, SOQL sorgu", belge: "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/",
    sirlar: [{ ad: "SALESFORCE_ALAN", etiket: "My Domain adresi", nasil: "https://firman.my.salesforce.com biçiminde." }, { ad: "SALESFORCE_CLIENT_ID", etiket: "Consumer key", nasil: "Setup, App Manager, Connected App; Client Credentials Flow etkin ve bir çalıştırma kullanıcısı atanmış olmalı." }, { ad: "SALESFORCE_CLIENT_SECRET", etiket: "Consumer secret", nasil: "Aynı uygulamanın gizli anahtarı." }],
    kimlik: { sirlar: ["SALESFORCE_ALAN", "SALESFORCE_CLIENT_ID", "SALESFORCE_CLIENT_SECRET"], istek: (s) => ({ yontem: "POST", url: `${siteKoku(s("SALESFORCE_ALAN"))}/services/oauth2/token`, form: { grant_type: "client_credentials", client_id: s("SALESFORCE_CLIENT_ID"), client_secret: s("SALESFORCE_CLIENT_SECRET") } }),
      coz: (y) => { const o = y as { access_token?: string; instance_url?: string; error_description?: string }; if (!o?.access_token || !o.instance_url) throw new Error(`Salesforce belirteç vermedi${o?.error_description ? `: ${o.error_description}` : ""}.`); return { degerler: { _SF_ERISIM: o.access_token, _SF_ADRES: o.instance_url }, omur: 50 * 60_000 }; } },
    eylemler: [
      { id: "aday", ad: "Aday (Lead) oluştur", aciklama: "Soyad ve şirket zorunlu", sirlar: SF, alanlar: [{ ad: "soyad", etiket: "Soyad", zorunlu: true }, { ad: "ad", etiket: "Ad" }, { ad: "sirket", etiket: "Şirket", zorunlu: true }, { ad: "eposta", etiket: "E-posta" }, { ad: "telefon", etiket: "Telefon" }, { ad: "kaynak", etiket: "Kaynak", yer: "Web" }],
        istek: (g, s) => ({ yontem: "POST", url: sf(s, "/sobjects/Lead"), basliklar: sfB(s), json: dolu({ LastName: zorunlu(g, "soyad", "Soyad"), FirstName: t(g.ad), Company: zorunlu(g, "sirket", "Şirket"), Email: t(g.eposta), Phone: t(g.telefon), LeadSource: t(g.kaynak) }) }), sonuc: ozetAl("id") },
      { id: "kayit", ad: "Kayıt oluştur", aciklama: "Herhangi bir nesne (Account, Contact, Case…)", sirlar: SF, alanlar: [{ ad: "nesne", etiket: "Nesne adı", zorunlu: true, yer: "Case" }, { ad: "alanlar", etiket: "Alanlar (JSON)", tur: "json", zorunlu: true, yer: "{\"Subject\": \"İade talebi\"}" }],
        istek: (g, s) => ({ yontem: "POST", url: sf(s, `/sobjects/${enc(zorunlu(g, "nesne", "Nesne"))}`), basliklar: sfB(s), json: nesne(g.alanlar, "Alanlar") }), sonuc: ozetAl("id") },
      { id: "guncelle", ad: "Kaydı güncelle", aciklama: "Nesne ve kimlikle", sirlar: SF, alanlar: [{ ad: "nesne", etiket: "Nesne adı", zorunlu: true }, { ad: "kayit", etiket: "Kayıt kimliği", zorunlu: true }, { ad: "alanlar", etiket: "Alanlar (JSON)", tur: "json", zorunlu: true }],
        istek: (g, s) => ({ yontem: "PATCH", url: sf(s, `/sobjects/${enc(zorunlu(g, "nesne", "Nesne"))}/${enc(zorunlu(g, "kayit", "Kayıt kimliği"))}`), basliklar: sfB(s), json: nesne(g.alanlar, "Alanlar"), yanit: "metin" }) },
      { id: "sorgu", ad: "SOQL sorgusu çalıştır", aciklama: "Kayıtları sorguyla getir", okuma: true, sirlar: SF, alanlar: [{ ad: "soql", etiket: "SOQL", zorunlu: true, yer: "SELECT Id, Name FROM Lead WHERE Email = 'ayse@firma.com'" }],
        istek: (g, s) => ({ yontem: "GET", url: sf(s, `/query${sorgu({ q: zorunlu(g, "soql", "SOQL") })}`), basliklar: sfB(s) }), sonuc: (y) => ({ ozet: `${(y as { totalSize?: number })?.totalSize ?? 0} kayıt` }) },
    ],
  },
  {
    id: "pipedrive", ad: "Pipedrive", logo: "/marka/baglanti/pipedrive.png", kategori: "Satış", aciklama: "Kişi, kuruluş, fırsat, etkinlik ve not (API v2)", belge: "https://developers.pipedrive.com/docs/api/v1",
    sirlar: [{ ad: "PIPEDRIVE_TOKEN", etiket: "API belirteci", nasil: "Pipedrive, Kişisel tercihler, API sekmesi." }],
    eylemler: [
      { id: "kisi", ad: "Kişi ekle", aciklama: "Ad, e-posta, telefon ve kuruluş", sirlar: ["PIPEDRIVE_TOKEN"], alanlar: [{ ad: "ad", etiket: "Ad soyad", zorunlu: true }, { ad: "eposta", etiket: "E-posta" }, { ad: "telefon", etiket: "Telefon" }, { ad: "kurulus", etiket: "Kuruluş kimliği (isteğe bağlı)" }],
        istek: (g, s) => ({ yontem: "POST", url: `${PD2}/persons`, basliklar: pd(s), json: dolu({ name: zorunlu(g, "ad", "Ad soyad"), emails: t(g.eposta) ? [{ value: t(g.eposta), primary: true, label: "work" }] : undefined, phones: t(g.telefon) ? [{ value: t(g.telefon), primary: true, label: "work" }] : undefined, org_id: t(g.kurulus) ? Number(g.kurulus) : undefined }) }), sonuc: ozetAl("data.id") },
      { id: "kisi-ara", ad: "Kişi ara", aciklama: "E-posta, ad ya da telefonla", okuma: true, sirlar: ["PIPEDRIVE_TOKEN"], alanlar: [{ ad: "sorgu", etiket: "Arama", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `${PD2}/persons/search${sorgu({ term: zorunlu(g, "sorgu", "Arama"), limit: 10 })}`, basliklar: pd(s) }), sonuc: ozetAl("data.items.0.item.id") },
      { id: "kurulus", ad: "Kuruluş ekle", aciklama: "Şirket kaydı", sirlar: ["PIPEDRIVE_TOKEN"], alanlar: [{ ad: "ad", etiket: "Kuruluş adı", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: `${PD2}/organizations`, basliklar: pd(s), json: { name: zorunlu(g, "ad", "Kuruluş adı") } }), sonuc: ozetAl("data.id") },
      { id: "firsat", ad: "Fırsat ekle", aciklama: "Başlık, tutar, kişi ve kuruluşla", sirlar: ["PIPEDRIVE_TOKEN"], alanlar: [{ ad: "baslik", etiket: "Başlık", zorunlu: true }, { ad: "tutar", etiket: "Tutar", tur: "sayi" }, { ad: "para", etiket: "Para birimi", yer: "USD", varsayilan: "USD" }, { ad: "kisi", etiket: "Kişi kimliği (isteğe bağlı)" }, { ad: "kurulus", etiket: "Kuruluş kimliği (isteğe bağlı)" }, { ad: "asama", etiket: "Aşama kimliği (isteğe bağlı)" }],
        istek: (g, s) => ({ yontem: "POST", url: `${PD2}/deals`, basliklar: pd(s), json: dolu({ title: zorunlu(g, "baslik", "Başlık"), value: t(g.tutar) ? Number(g.tutar) : undefined, currency: (t(g.para) || "USD").toUpperCase(), person_id: t(g.kisi) ? Number(g.kisi) : undefined, org_id: t(g.kurulus) ? Number(g.kurulus) : undefined, stage_id: t(g.asama) ? Number(g.asama) : undefined }) }), sonuc: ozetAl("data.id") },
      { id: "firsat-getir", ad: "Fırsatı getir", aciklama: "Durum, aşama ve tutar", okuma: true, sirlar: ["PIPEDRIVE_TOKEN"], alanlar: [{ ad: "firsat", etiket: "Fırsat kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `${PD2}/deals/${enc(zorunlu(g, "firsat", "Fırsat kimliği"))}`, basliklar: pd(s) }), sonuc: ozetAl("data.status") },
      { id: "firsat-guncelle", ad: "Fırsatı güncelle", aciklama: "Aşama, durum (won, lost) ya da tutar", sirlar: ["PIPEDRIVE_TOKEN"], alanlar: [{ ad: "firsat", etiket: "Fırsat kimliği", zorunlu: true }, { ad: "durum", etiket: "Durum", tur: "secim", secenekler: [{ id: "", ad: "Değiştirme" }, { id: "open", ad: "Açık" }, { id: "won", ad: "Kazanıldı" }, { id: "lost", ad: "Kaybedildi" }] }, { ad: "asama", etiket: "Aşama kimliği (isteğe bağlı)" }, { ad: "tutar", etiket: "Yeni tutar (isteğe bağlı)", tur: "sayi" }],
        istek: (g, s) => ({ yontem: "PATCH", url: `${PD2}/deals/${enc(zorunlu(g, "firsat", "Fırsat kimliği"))}`, basliklar: pd(s), json: dolu({ status: t(g.durum), stage_id: t(g.asama) ? Number(g.asama) : undefined, value: t(g.tutar) ? Number(g.tutar) : undefined }) }), sonuc: ozetAl("data.status") },
      { id: "etkinlik", ad: "Etkinlik ekle", aciklama: "Arama, toplantı ya da görev; fırsata ve kişiye bağlı", sirlar: ["PIPEDRIVE_TOKEN"], alanlar: [{ ad: "konu", etiket: "Konu", zorunlu: true }, { ad: "tur", etiket: "Tür", tur: "secim", secenekler: [{ id: "call", ad: "Arama" }, { id: "meeting", ad: "Toplantı" }, { id: "task", ad: "Görev" }, { id: "email", ad: "E-posta" }], varsayilan: "call" }, { ad: "gun", etiket: "Tarih", yer: "2026-11-20" }, { ad: "saat", etiket: "Saat", yer: "14:30" }, { ad: "firsat", etiket: "Fırsat kimliği" }, { ad: "kisi", etiket: "Kişi kimliği" }, { ad: "not", etiket: "Not", tur: "uzunMetin" }],
        istek: (g, s) => ({ yontem: "POST", url: `${PD2}/activities`, basliklar: pd(s), json: dolu({ subject: zorunlu(g, "konu", "Konu"), type: t(g.tur) || "call", due_date: tarihGun(g.gun), due_time: t(g.saat), deal_id: t(g.firsat) ? Number(g.firsat) : undefined, participants: t(g.kisi) ? [{ person_id: Number(g.kisi), primary: true }] : undefined, note: t(g.not) }) }), sonuc: ozetAl("data.id") },
      { id: "not", ad: "Not ekle", aciklama: "Fırsata ya da kişiye", sirlar: ["PIPEDRIVE_TOKEN"], alanlar: [{ ad: "metin", etiket: "Not", tur: "uzunMetin", zorunlu: true }, { ad: "firsat", etiket: "Fırsat kimliği" }, { ad: "kisi", etiket: "Kişi kimliği" }],
        istek: (g, s) => { if (!t(g.firsat) && !t(g.kisi)) throw new Error("Fırsat ya da kişi kimliği yaz."); return { yontem: "POST", url: `${PD}/notes`, basliklar: pd(s), json: dolu({ content: zorunlu(g, "metin", "Not"), deal_id: t(g.firsat) ? Number(g.firsat) : undefined, person_id: t(g.kisi) ? Number(g.kisi) : undefined }) }; } },
    ],
  },
  {
    id: "zoho-crm", ad: "Zoho CRM", logo: "/marka/uyg/zoho.svg", kategori: "Satış", aciklama: "Aday ekle ve ara", belge: "https://www.zoho.com/crm/developer/docs/api/v7/",
    sirlar: [{ ad: "ZOHO_CLIENT_ID", etiket: "Client ID", nasil: "api-console.zoho.com, Server-based Applications." }, { ad: "ZOHO_CLIENT_SECRET", etiket: "Client Secret", nasil: "Aynı istemcinin gizli anahtarı." }, { ad: "ZOHO_REFRESH_TOKEN", etiket: "Yenileme belirteci", nasil: "ZohoCRM.modules.ALL kapsamıyla yetki kodundan alınan refresh_token." }, { ad: "ZOHO_VERI_MERKEZI", etiket: "Veri merkezi", nasil: "com, eu, in, com.au gibi; boşsa eu.", istege: true }],
    kimlik: { sirlar: ["ZOHO_CLIENT_ID", "ZOHO_CLIENT_SECRET", "ZOHO_REFRESH_TOKEN"], istek: (s) => ({ yontem: "POST", url: `https://accounts.zoho.${(s("ZOHO_VERI_MERKEZI") || "eu").replace(/[^a-z.]/g, "")}/oauth/v2/token`, form: { grant_type: "refresh_token", client_id: s("ZOHO_CLIENT_ID"), client_secret: s("ZOHO_CLIENT_SECRET"), refresh_token: s("ZOHO_REFRESH_TOKEN") } }),
      coz: (y) => { const o = y as { access_token?: string; api_domain?: string; expires_in?: number; error?: string }; if (!o?.access_token) throw new Error(`Zoho belirteç vermedi${o?.error ? `: ${o.error}` : ""}.`); return { degerler: { _ZOHO_ERISIM: o.access_token, _ZOHO_API: o.api_domain ?? "https://www.zohoapis.eu" }, omur: (o.expires_in ?? 3600) * 1000 }; } },
    eylemler: [
      { id: "aday", ad: "Aday ekle", aciklama: "Soyad zorunlu", sirlar: ZO, alanlar: [{ ad: "soyad", etiket: "Soyad", zorunlu: true }, { ad: "ad", etiket: "Ad" }, { ad: "sirket", etiket: "Şirket" }, { ad: "eposta", etiket: "E-posta" }, { ad: "telefon", etiket: "Telefon" }],
        istek: (g, s) => ({ yontem: "POST", url: zo(s, "/Leads"), basliklar: zoB(s), json: { data: [dolu({ Last_Name: zorunlu(g, "soyad", "Soyad"), First_Name: t(g.ad), Company: t(g.sirket), Email: t(g.eposta), Phone: t(g.telefon) })] } }), sonuc: ozetAl("data.0.details.id") },
      { id: "ara", ad: "Adayı e-postayla ara", aciklama: "Var mı diye bakmak için", okuma: true, sirlar: ZO, alanlar: [{ ad: "eposta", etiket: "E-posta", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: zo(s, `/Leads/search${sorgu({ email: zorunlu(g, "eposta", "E-posta") })}`), basliklar: zoB(s) }) },
    ],
  },
  {
    id: "close", ad: "Close", logo: "/marka/baglanti/close-crm.png", kategori: "Satış", aciklama: "Potansiyel müşteri ve kişi oluştur", belge: "https://developer.close.com/resources/leads/",
    sirlar: [{ ad: "CLOSE_API_KEY", etiket: "API anahtarı", nasil: "Close, Settings, Developer, API Keys." }],
    eylemler: [{ id: "lead", ad: "Potansiyel müşteri oluştur", aciklama: "Şirket ve ilk kişiyle", sirlar: ["CLOSE_API_KEY"], alanlar: [{ ad: "ad", etiket: "Şirket ya da müşteri adı", zorunlu: true }, { ad: "kisi", etiket: "Kişi adı" }, { ad: "eposta", etiket: "E-posta" }, { ad: "telefon", etiket: "Telefon" }],
      istek: (g, s) => ({ yontem: "POST", url: "https://api.close.com/api/v1/lead/", basliklar: { Authorization: temel(s("CLOSE_API_KEY"), "") }, json: dolu({ name: zorunlu(g, "ad", "Ad"), contacts: t(g.kisi) || t(g.eposta) ? [dolu({ name: t(g.kisi), emails: t(g.eposta) ? [{ email: t(g.eposta), type: "office" }] : undefined, phones: t(g.telefon) ? [{ phone: t(g.telefon), type: "office" }] : undefined })] : undefined }) }), sonuc: ozetAl("id") }],
  },
  {
    id: "attio", ad: "Attio", logo: "/marka/baglanti/attio.svg", kategori: "Satış", aciklama: "Kişiyi eşleştir ve not ekle", belge: "https://docs.attio.com/rest-api/overview",
    sirlar: [{ ad: "ATTIO_TOKEN", etiket: "Erişim belirteci", nasil: "Attio, Workspace settings, Developers, yeni entegrasyon belirteci." }],
    eylemler: [
      { id: "kisi", ad: "Kişiyi ekle ya da güncelle", aciklama: "E-postaya göre eşleştirir", sirlar: ["ATTIO_TOKEN"], alanlar: [{ ad: "eposta", etiket: "E-posta", zorunlu: true }, { ad: "ad", etiket: "Ad" }, { ad: "soyad", etiket: "Soyad" }],
        istek: (g, s) => ({ yontem: "PUT", url: "https://api.attio.com/v2/objects/people/records?matching_attribute=email_addresses", basliklar: { Authorization: `Bearer ${s("ATTIO_TOKEN")}` }, json: { data: { values: dolu({ email_addresses: [zorunlu(g, "eposta", "E-posta")], name: t(g.ad) || t(g.soyad) ? [{ first_name: t(g.ad), last_name: t(g.soyad), full_name: `${t(g.ad)} ${t(g.soyad)}`.trim() }] : undefined }) } } }), sonuc: ozetAl("data.id.record_id") },
      { id: "not", ad: "Kayda not ekle", aciklama: "Kişi ya da şirket kaydına", sirlar: ["ATTIO_TOKEN"], alanlar: [{ ad: "nesne", etiket: "Nesne", tur: "secim", secenekler: [{ id: "people", ad: "Kişi" }, { id: "companies", ad: "Şirket" }], varsayilan: "people" }, { ad: "kayit", etiket: "Kayıt kimliği", zorunlu: true }, { ad: "baslik", etiket: "Başlık", zorunlu: true }, { ad: "metin", etiket: "Not", tur: "uzunMetin", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.attio.com/v2/notes", basliklar: { Authorization: `Bearer ${s("ATTIO_TOKEN")}` }, json: { data: { parent_object: t(g.nesne) || "people", parent_record_id: zorunlu(g, "kayit", "Kayıt kimliği"), title: zorunlu(g, "baslik", "Başlık"), format: "plaintext", content: zorunlu(g, "metin", "Not") } } }) },
    ],
  },
  {
    id: "intercom", ad: "Intercom", logo: "/marka/baglanti/intercom.svg", kategori: "Destek", aciklama: "Kişi oluştur ve not ekle", belge: "https://developers.intercom.com/docs/references/rest-api/api.intercom.io/contacts",
    sirlar: [{ ad: "INTERCOM_TOKEN", etiket: "Erişim belirteci", nasil: "Intercom Developer Hub, uygulaman, Authentication sayfası." }, { ad: "INTERCOM_BOLGE", etiket: "Bölge", nasil: "AB çalışma alanı için eu, Avustralya için au; boşsa ABD.", istege: true }],
    eylemler: [
      { id: "kisi", ad: "Kişi oluştur", aciklama: "Kullanıcı ya da potansiyel", sirlar: ["INTERCOM_TOKEN"], alanlar: [{ ad: "eposta", etiket: "E-posta", zorunlu: true }, { ad: "ad", etiket: "Ad soyad" }, { ad: "rol", etiket: "Rol", tur: "secim", secenekler: [{ id: "user", ad: "Kullanıcı" }, { id: "lead", ad: "Potansiyel" }], varsayilan: "user" }],
        istek: (g, s) => ({ yontem: "POST", url: `https://api.${s("INTERCOM_BOLGE") === "eu" ? "eu." : s("INTERCOM_BOLGE") === "au" ? "au." : ""}intercom.io/contacts`, basliklar: { Authorization: `Bearer ${s("INTERCOM_TOKEN")}`, "Intercom-Version": "2.11" }, json: dolu({ role: t(g.rol) || "user", email: zorunlu(g, "eposta", "E-posta"), name: t(g.ad) }) }), sonuc: ozetAl("id") },
      { id: "not", ad: "Kişiye not ekle", aciklama: "Ekibin göreceği not", sirlar: ["INTERCOM_TOKEN"], alanlar: [{ ad: "kisi", etiket: "Kişi kimliği", zorunlu: true }, { ad: "metin", etiket: "Not", tur: "uzunMetin", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: `https://api.${s("INTERCOM_BOLGE") === "eu" ? "eu." : s("INTERCOM_BOLGE") === "au" ? "au." : ""}intercom.io/contacts/${enc(zorunlu(g, "kisi", "Kişi kimliği"))}/notes`, basliklar: { Authorization: `Bearer ${s("INTERCOM_TOKEN")}`, "Intercom-Version": "2.11" }, json: { body: zorunlu(g, "metin", "Not") } }) },
    ],
  },
  {
    id: "zendesk", ad: "Zendesk", logo: "/marka/uyg/zendesk.svg", kategori: "Destek", aciklama: "Talep aç, yanıtla, ara, etiketle ve kullanıcı ekle", belge: "https://developer.zendesk.com/api-reference/ticketing/tickets/tickets/",
    sirlar: [{ ad: "ZENDESK_ALT_ALAN", etiket: "Alt alan adı", nasil: "firman.zendesk.com adresindeki firman kısmı." }, { ad: "ZENDESK_EPOSTA", etiket: "Temsilci e-postası", nasil: "API belirtecini kullanacak temsilcinin e-postası." }, { ad: "ZENDESK_TOKEN", etiket: "API belirteci", nasil: "Yönetici Merkezi, Uygulamalar ve entegrasyonlar, Zendesk API, Belirteç ekle." }],
    eylemler: [
      { id: "talep", ad: "Destek talebi aç", aciklama: "Konu, açıklama ve talep edenle", sirlar: ZD, alanlar: [{ ad: "konu", etiket: "Konu", zorunlu: true }, { ad: "aciklama", etiket: "Açıklama", tur: "uzunMetin", zorunlu: true }, { ad: "ad", etiket: "Talep edenin adı" }, { ad: "eposta", etiket: "Talep edenin e-postası" }, { ad: "oncelik", etiket: "Öncelik", tur: "secim", secenekler: [{ id: "low", ad: "Düşük" }, { id: "normal", ad: "Normal" }, { id: "high", ad: "Yüksek" }, { id: "urgent", ad: "Acil" }], varsayilan: "normal" }, { ad: "etiketler", etiket: "Etiketler (virgülle)" }],
        istek: (g, s) => ({ yontem: "POST", url: zd(s, "/tickets.json"), basliklar: zdB(s), json: { ticket: dolu({ subject: zorunlu(g, "konu", "Konu"), comment: { body: zorunlu(g, "aciklama", "Açıklama") }, requester: t(g.eposta) ? dolu({ name: t(g.ad), email: t(g.eposta) }) : undefined, priority: t(g.oncelik) || "normal", tags: virgul(g.etiketler) }) } }), sonuc: ozetAl("ticket.id") },
      { id: "yanit", ad: "Talebe yanıt yaz", aciklama: "Müşteriye görünen ya da iç not", sirlar: ZD, alanlar: [{ ad: "talep", etiket: "Talep numarası", zorunlu: true }, { ad: "metin", etiket: "Yanıt", tur: "uzunMetin", zorunlu: true }, { ad: "ic", etiket: "İç not (müşteri görmez)", tur: "evet-hayir" }, { ad: "durum", etiket: "Yeni durum", tur: "secim", secenekler: [{ id: "", ad: "Değiştirme" }, { id: "open", ad: "Açık" }, { id: "pending", ad: "Bekliyor" }, { id: "solved", ad: "Çözüldü" }] }],
        istek: (g, s) => ({ yontem: "PUT", url: zd(s, `/tickets/${enc(zorunlu(g, "talep", "Talep numarası"))}.json`), basliklar: zdB(s), json: { ticket: dolu({ comment: { body: zorunlu(g, "metin", "Yanıt"), public: !evet(g.ic) }, status: t(g.durum) }) } }), sonuc: ozetAl("ticket.status") },
      { id: "getir", ad: "Talebi getir", aciklama: "Durum ve ayrıntılar", okuma: true, sirlar: ZD, alanlar: [{ ad: "talep", etiket: "Talep numarası", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: zd(s, `/tickets/${enc(zorunlu(g, "talep", "Talep numarası"))}.json`), basliklar: zdB(s) }), sonuc: ozetAl("ticket.status") },
      { id: "ara", ad: "Talepleri ara", aciklama: "Zendesk arama söz dizimiyle (ör. status:open requester:ali@firma.com)", okuma: true, sirlar: ZD, alanlar: [{ ad: "sorgu", etiket: "Arama", zorunlu: true, yer: "status:open priority:urgent" }],
        istek: (g, s) => ({ yontem: "GET", url: zd(s, `/search.json${sorgu({ query: `type:ticket ${zorunlu(g, "sorgu", "Arama")}`, sort_by: "created_at", sort_order: "desc" })}`), basliklar: zdB(s) }), sonuc: ozetAl("count") },
      { id: "etiket", ad: "Talebe etiket ekle", aciklama: "Var olan etiketler korunur", sirlar: ZD, alanlar: [{ ad: "talep", etiket: "Talep numarası", zorunlu: true }, { ad: "etiketler", etiket: "Etiketler (virgülle)", zorunlu: true }],
        istek: (g, s) => ({ yontem: "PUT", url: zd(s, `/tickets/${enc(zorunlu(g, "talep", "Talep numarası"))}/tags.json`), basliklar: zdB(s), json: { tags: virgul(zorunlu(g, "etiketler", "Etiketler")) } }) },
      { id: "kullanici", ad: "Kullanıcı ekle ya da güncelle", aciklama: "E-postaya göre eşleştirir", sirlar: ZD, alanlar: [{ ad: "ad", etiket: "Ad soyad", zorunlu: true }, { ad: "eposta", etiket: "E-posta", zorunlu: true }, { ad: "telefon", etiket: "Telefon" }],
        istek: (g, s) => ({ yontem: "POST", url: zd(s, "/users/create_or_update.json"), basliklar: zdB(s), json: { user: dolu({ name: zorunlu(g, "ad", "Ad soyad"), email: zorunlu(g, "eposta", "E-posta"), phone: t(g.telefon) }) } }), sonuc: ozetAl("user.id") },
    ],
  },
  {
    id: "freshdesk", ad: "Freshdesk", logo: "/marka/uyg/freshdesk.svg", kategori: "Destek", aciklama: "Talep aç, yanıtla, güncelle, not ve kişi", belge: "https://developers.freshdesk.com/api/",
    sirlar: [{ ad: "FRESHDESK_ALAN", etiket: "Alt alan adı", nasil: "firman.freshdesk.com adresindeki firman kısmı." }, { ad: "FRESHDESK_API_KEY", etiket: "API anahtarı", nasil: "Profil ayarları, View API Key." }],
    eylemler: [
      { id: "talep", ad: "Destek talebi aç", aciklama: "E-posta, konu ve açıklamayla", sirlar: ["FRESHDESK_ALAN", "FRESHDESK_API_KEY"], alanlar: [{ ad: "eposta", etiket: "Talep edenin e-postası", zorunlu: true }, { ad: "konu", etiket: "Konu", zorunlu: true }, { ad: "aciklama", etiket: "Açıklama", tur: "uzunMetin", zorunlu: true }, { ad: "oncelik", etiket: "Öncelik", tur: "secim", secenekler: [{ id: "1", ad: "Düşük" }, { id: "2", ad: "Orta" }, { id: "3", ad: "Yüksek" }, { id: "4", ad: "Acil" }], varsayilan: "1" }],
        istek: (g, s) => ({ yontem: "POST", url: fd(s, "/tickets"), basliklar: fdB(s), json: { email: zorunlu(g, "eposta", "E-posta"), subject: zorunlu(g, "konu", "Konu"), description: zorunlu(g, "aciklama", "Açıklama"), priority: Number(t(g.oncelik) || 1), status: 2 } }), sonuc: ozetAl("id") },
      { id: "not", ad: "Talebe not ekle", aciklama: "Özel ya da herkese açık not", sirlar: ["FRESHDESK_ALAN", "FRESHDESK_API_KEY"], alanlar: [{ ad: "talep", etiket: "Talep numarası", zorunlu: true }, { ad: "metin", etiket: "Not", tur: "uzunMetin", zorunlu: true }, { ad: "ozel", etiket: "Özel not", tur: "evet-hayir" }],
        istek: (g, s) => ({ yontem: "POST", url: fd(s, `/tickets/${enc(zorunlu(g, "talep", "Talep numarası"))}/notes`), basliklar: fdB(s), json: { body: zorunlu(g, "metin", "Not"), private: evet(g.ozel) } }) },
      { id: "yanit", ad: "Talebe yanıt yaz", aciklama: "Müşteriye e-postayla gider", sirlar: ["FRESHDESK_ALAN", "FRESHDESK_API_KEY"], alanlar: [{ ad: "talep", etiket: "Talep numarası", zorunlu: true }, { ad: "metin", etiket: "Yanıt", tur: "uzunMetin", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: fd(s, `/tickets/${enc(zorunlu(g, "talep", "Talep numarası"))}/reply`), basliklar: fdB(s), json: { body: zorunlu(g, "metin", "Yanıt") } }) },
      { id: "getir", ad: "Talebi getir", aciklama: "Durum, öncelik ve açıklama", okuma: true, sirlar: ["FRESHDESK_ALAN", "FRESHDESK_API_KEY"], alanlar: [{ ad: "talep", etiket: "Talep numarası", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: fd(s, `/tickets/${enc(zorunlu(g, "talep", "Talep numarası"))}`), basliklar: fdB(s) }), sonuc: ozetAl("status") },
      { id: "guncelle", ad: "Talebi güncelle", aciklama: "Durum ve öncelik", sirlar: ["FRESHDESK_ALAN", "FRESHDESK_API_KEY"], alanlar: [{ ad: "talep", etiket: "Talep numarası", zorunlu: true }, { ad: "durum", etiket: "Durum", tur: "secim", secenekler: [{ id: "", ad: "Değiştirme" }, { id: "2", ad: "Açık" }, { id: "3", ad: "Bekliyor" }, { id: "4", ad: "Çözüldü" }, { id: "5", ad: "Kapandı" }] }, { ad: "oncelik", etiket: "Öncelik", tur: "secim", secenekler: [{ id: "", ad: "Değiştirme" }, { id: "1", ad: "Düşük" }, { id: "2", ad: "Orta" }, { id: "3", ad: "Yüksek" }, { id: "4", ad: "Acil" }] }],
        istek: (g, s) => { const j = dolu({ status: t(g.durum) ? Number(g.durum) : undefined, priority: t(g.oncelik) ? Number(g.oncelik) : undefined }); if (!Object.keys(j).length) throw new Error("Durum ya da öncelik seç."); return { yontem: "PUT", url: fd(s, `/tickets/${enc(zorunlu(g, "talep", "Talep numarası"))}`), basliklar: fdB(s), json: j }; }, sonuc: ozetAl("status") },
      { id: "kisi", ad: "Kişi oluştur", aciklama: "Ad ve e-posta ya da telefon", sirlar: ["FRESHDESK_ALAN", "FRESHDESK_API_KEY"], alanlar: [{ ad: "ad", etiket: "Ad soyad", zorunlu: true }, { ad: "eposta", etiket: "E-posta" }, { ad: "telefon", etiket: "Telefon" }],
        istek: (g, s) => { if (!t(g.eposta) && !t(g.telefon)) throw new Error("E-posta ya da telefon yaz."); return { yontem: "POST", url: fd(s, "/contacts"), basliklar: fdB(s), json: dolu({ name: zorunlu(g, "ad", "Ad soyad"), email: t(g.eposta), phone: t(g.telefon) }) }; }, sonuc: ozetAl("id") },
    ],
  },
  {
    id: "calendly", ad: "Calendly", logo: "/marka/baglanti/calendly.svg", kategori: "Randevu", aciklama: "Randevuları listele, tek kullanımlık bağlantı ve iptal", belge: "https://developer.calendly.com/api-docs",
    sirlar: [{ ad: "CALENDLY_TOKEN", etiket: "Kişisel erişim belirteci", nasil: "Calendly, Integrations, API & Webhooks, Personal access token." }, { ad: "CALENDLY_KULLANICI", etiket: "Kullanıcı URI", nasil: "https://api.calendly.com/users/me yanıtındaki resource.uri değeri (randevu listesi için)." , istege: true }],
    eylemler: [
      { id: "randevular", ad: "Yaklaşan randevuları listele", aciklama: "Kullanıcının etkin randevuları", okuma: true, sirlar: ["CALENDLY_TOKEN", "CALENDLY_KULLANICI"], alanlar: [{ ad: "adet", etiket: "Kaç randevu", tur: "sayi", varsayilan: "20", yer: "20" }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.calendly.com/scheduled_events${sorgu({ user: s("CALENDLY_KULLANICI"), status: "active", min_start_time: new Date().toISOString(), sort: "start_time:asc", count: tamsayi(g.adet, 20, 1, 100) })}`, basliklar: clB(s) }), sonuc: (y) => ({ ozet: `${((y as { collection?: unknown[] })?.collection ?? []).length} randevu` }) },
      { id: "baglanti", ad: "Tek kullanımlık randevu bağlantısı", aciklama: "Bir etkinlik türü için tek seferlik adres", sirlar: ["CALENDLY_TOKEN"], alanlar: [{ ad: "tur", etiket: "Etkinlik türü URI", zorunlu: true, yer: "https://api.calendly.com/event_types/…" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.calendly.com/scheduling_links", basliklar: clB(s), json: { max_event_count: 1, owner: zorunlu(g, "tur", "Etkinlik türü"), owner_type: "EventType" } }), sonuc: ozetAl("resource.booking_url") },
      { id: "iptal", ad: "Randevuyu iptal et", aciklama: "Nedenle; davetliye bildirilir", sirlar: ["CALENDLY_TOKEN"], alanlar: [{ ad: "randevu", etiket: "Randevu kimliği (uuid)", zorunlu: true }, { ad: "neden", etiket: "Neden" }],
        istek: (g, s) => ({ yontem: "POST", url: `https://api.calendly.com/scheduled_events/${enc(zorunlu(g, "randevu", "Randevu kimliği").split("/").pop()!)}/cancellation`, basliklar: clB(s), json: dolu({ reason: t(g.neden) }) }) },
    ],
  },
  {
    id: "cal-com", ad: "Cal.com", logo: "/marka/uyg/cal-com.svg", kategori: "Randevu", aciklama: "Rezervasyonları listele ve iptal et", belge: "https://cal.com/docs/api-reference/v2/introduction",
    sirlar: [{ ad: "CALCOM_API_KEY", etiket: "API anahtarı", nasil: "Cal.com, Settings, Developer, API Keys; cal_live_ ile başlar." }],
    eylemler: [
      { id: "rezervasyonlar", ad: "Yaklaşan rezervasyonları listele", aciklama: "Duruma göre", okuma: true, sirlar: ["CALCOM_API_KEY"], alanlar: [{ ad: "durum", etiket: "Durum", tur: "secim", secenekler: [{ id: "upcoming", ad: "Yaklaşan" }, { id: "past", ad: "Geçmiş" }, { id: "cancelled", ad: "İptal" }, { id: "unconfirmed", ad: "Onay bekleyen" }], varsayilan: "upcoming" }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.cal.com/v2/bookings${sorgu({ status: t(g.durum) || "upcoming", take: 50 })}`, basliklar: calB(s) }) },
      { id: "iptal", ad: "Rezervasyonu iptal et", aciklama: "Rezervasyon uid'siyle", sirlar: ["CALCOM_API_KEY"], alanlar: [{ ad: "uid", etiket: "Rezervasyon uid", zorunlu: true }, { ad: "neden", etiket: "Neden" }],
        istek: (g, s) => ({ yontem: "POST", url: `https://api.cal.com/v2/bookings/${enc(zorunlu(g, "uid", "Rezervasyon uid"))}/cancel`, basliklar: calB(s), json: dolu({ cancellationReason: t(g.neden) }) }) },
    ],
  },
  {
    id: "typeform", ad: "Typeform", logo: "/marka/baglanti/typeform.svg", kategori: "Form", aciklama: "Yanıtları ve formları getir", belge: "https://www.typeform.com/developers/responses/",
    sirlar: [{ ad: "TYPEFORM_TOKEN", etiket: "Kişisel erişim belirteci", nasil: "Typeform, Account, Personal tokens; responses:read ve forms:read izinli." }],
    eylemler: [
      { id: "yanitlar", ad: "Yanıtları getir", aciklama: "Formun son yanıtları", okuma: true, sirlar: ["TYPEFORM_TOKEN"], alanlar: [{ ad: "form", etiket: "Form kimliği", zorunlu: true, yer: "Form adresindeki kimlik" }, { ad: "adet", etiket: "Kaç yanıt", tur: "sayi", varsayilan: "25", yer: "25" }, { ad: "sonra", etiket: "Bu zamandan sonra (isteğe bağlı)", yer: "2026-11-01T00:00:00Z" }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.typeform.com/forms/${enc(zorunlu(g, "form", "Form kimliği"))}/responses${sorgu({ page_size: tamsayi(g.adet, 25, 1, 1000), since: t(g.sonra) })}`, basliklar: { Authorization: `Bearer ${s("TYPEFORM_TOKEN")}` } }), sonuc: (y) => ({ ozet: `${(y as { total_items?: number })?.total_items ?? 0} yanıt` }) },
      { id: "formlar", ad: "Formları listele", aciklama: "Hesaptaki formlar", okuma: true, sirlar: ["TYPEFORM_TOKEN"], alanlar: [],
        istek: (_g, s) => ({ yontem: "GET", url: "https://api.typeform.com/forms?page_size=50", basliklar: { Authorization: `Bearer ${s("TYPEFORM_TOKEN")}` } }) },
    ],
  },
  {
    id: "jotform", ad: "Jotform", logo: "/marka/baglanti/jotform.png", kategori: "Form", aciklama: "Gönderimleri ve formları getir", belge: "https://api.jotform.com/docs/",
    sirlar: [{ ad: "JOTFORM_API_KEY", etiket: "API anahtarı", nasil: "Jotform, Settings, API; Full Access ya da Read Access anahtarı." }, { ad: "JOTFORM_BOLGE", etiket: "Bölge", nasil: "AB hesabı için eu; boşsa genel.", istege: true }],
    eylemler: [
      { id: "gonderimler", ad: "Gönderimleri getir", aciklama: "Formun son gönderimleri", okuma: true, sirlar: ["JOTFORM_API_KEY"], alanlar: [{ ad: "form", etiket: "Form kimliği", zorunlu: true }, { ad: "adet", etiket: "Kaç gönderim", tur: "sayi", varsayilan: "20", yer: "20" }],
        istek: (g, s) => ({ yontem: "GET", url: `${jfTaban(s)}/form/${enc(zorunlu(g, "form", "Form kimliği"))}/submissions${sorgu({ limit: tamsayi(g.adet, 20, 1, 1000), orderby: "created_at" })}`, basliklar: { APIKEY: s("JOTFORM_API_KEY") } }) },
      { id: "formlar", ad: "Formları listele", aciklama: "Hesaptaki formlar", okuma: true, sirlar: ["JOTFORM_API_KEY"], alanlar: [],
        istek: (_g, s) => ({ yontem: "GET", url: `${jfTaban(s)}/user/forms?limit=50`, basliklar: { APIKEY: s("JOTFORM_API_KEY") } }) },
    ],
  },
  {
    id: "zoom", ad: "Zoom", logo: "/marka/baglanti/zoom.svg", kategori: "Randevu", aciklama: "Toplantı oluştur ve listele", belge: "https://developers.zoom.us/docs/api/meetings/",
    sirlar: [{ ad: "ZOOM_HESAP_ID", etiket: "Account ID", nasil: "marketplace.zoom.us, Develop, Server-to-Server OAuth uygulaması; meeting:write izni." }, { ad: "ZOOM_CLIENT_ID", etiket: "Client ID", nasil: "Aynı uygulamanın App Credentials bölümü." }, { ad: "ZOOM_CLIENT_SECRET", etiket: "Client Secret", nasil: "Aynı bölüm." }],
    kimlik: { sirlar: ["ZOOM_HESAP_ID", "ZOOM_CLIENT_ID", "ZOOM_CLIENT_SECRET"], istek: (s) => ({ yontem: "POST", url: `https://zoom.us/oauth/token${sorgu({ grant_type: "account_credentials", account_id: s("ZOOM_HESAP_ID") })}`, basliklar: { Authorization: temel(s("ZOOM_CLIENT_ID"), s("ZOOM_CLIENT_SECRET")) } }),
      coz: (y) => { const o = y as { access_token?: string; expires_in?: number; reason?: string }; if (!o?.access_token) throw new Error(`Zoom belirteç vermedi${o?.reason ? `: ${o.reason}` : ""}.`); return { degerler: { _ZOOM_ERISIM: o.access_token }, omur: (o.expires_in ?? 3600) * 1000 }; } },
    eylemler: [
      { id: "toplanti", ad: "Toplantı oluştur", aciklama: "Zamanlı toplantı ve katılım bağlantısı", sirlar: ["_ZOOM_ERISIM"], alanlar: [{ ad: "konu", etiket: "Konu", zorunlu: true }, { ad: "baslangic", etiket: "Başlangıç", zorunlu: true, yer: "2026-11-07 14:00" }, { ad: "sure", etiket: "Süre (dakika)", tur: "sayi", varsayilan: "30", yer: "30" }, { ad: "gundem", etiket: "Gündem", tur: "uzunMetin" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.zoom.us/v2/users/me/meetings", basliklar: { Authorization: `Bearer ${s("_ZOOM_ERISIM")}` }, json: dolu({ topic: zorunlu(g, "konu", "Konu").slice(0, 200), type: 2, start_time: isoZaman(zorunlu(g, "baslangic", "Başlangıç")).replace(/\.\d{3}Z$/, "Z"), duration: tamsayi(g.sure, 30, 1, 1440), timezone: "Europe/Istanbul", agenda: t(g.gundem).slice(0, 2000) }) }), sonuc: ozetAl("join_url") },
      { id: "listele", ad: "Yaklaşan toplantıları listele", aciklama: "Hesabın toplantıları", okuma: true, sirlar: ["_ZOOM_ERISIM"], alanlar: [],
        istek: (_g, s) => ({ yontem: "GET", url: "https://api.zoom.us/v2/users/me/meetings?type=upcoming&page_size=30", basliklar: { Authorization: `Bearer ${s("_ZOOM_ERISIM")}` } }), sonuc: (y) => ({ ozet: `${((y as { meetings?: unknown[] })?.meetings ?? []).length} toplantı` }) },
    ],
  },
];
void liste;
