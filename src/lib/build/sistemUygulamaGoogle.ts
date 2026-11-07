import { b64, b64url, dolu, enc, evet, isoZaman, liste, m, nesne, ozetAl, rastgele, sorgu, t, tamsayi, virgul, zorunlu, type Sirlar, type UygIstek, type UygKimlik, type UygSir, type Uygulama } from "./sistemUygulamaOrtak";

/**
 * Google Workspace ve Microsoft 365 servisleri. Kimlik: kullanıcının kendi OAuth istemcisi ve yenileme belirteci
 * (Google: oauth2.googleapis.com/token, Microsoft: login.microsoftonline.com/.../oauth2/v2.0/token); erişim belirteci
 * her saat kendiliğinden yenilenir. Kaynaklar: developers.google.com (Sheets v4, Gmail v1, Calendar v3, Drive v3,
 * Docs v1, Tasks v1, Cloud Translation v2, GA4 Measurement Protocol) ve learn.microsoft.com/graph (v1.0).
 */
const G_SIR: UygSir[] = [
  { ad: "GOOGLE_CLIENT_ID", etiket: "OAuth istemci kimliği", nasil: "console.cloud.google.com, API'ler ve Hizmetler, Kimlik bilgileri; Web uygulaması türünde OAuth istemcisi oluştur ve ilgili API'yi etkinleştir." },
  { ad: "GOOGLE_CLIENT_SECRET", etiket: "OAuth istemci gizli anahtarı", nasil: "Aynı istemcinin gizli anahtarı." },
  { ad: "GOOGLE_REFRESH_TOKEN", etiket: "Yenileme belirteci", nasil: "developers.google.com/oauthplayground adresinde kendi istemcini seçip gereken kapsamla yetki ver; çıkan refresh_token değeri." },
];
const G_KIMLIK: UygKimlik = {
  sirlar: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN"],
  istek: (s) => ({ yontem: "POST", url: "https://oauth2.googleapis.com/token", form: { grant_type: "refresh_token", client_id: s("GOOGLE_CLIENT_ID"), client_secret: s("GOOGLE_CLIENT_SECRET"), refresh_token: s("GOOGLE_REFRESH_TOKEN") } }),
  coz: (y) => { const o = y as { access_token?: string; expires_in?: number; error_description?: string }; if (!o?.access_token) throw new Error(`Google belirteç vermedi${o?.error_description ? `: ${o.error_description}` : ""}; yenileme belirtecini denetle.`); return { degerler: { _GOOGLE_ERISIM: o.access_token }, omur: (o.expires_in ?? 3600) * 1000 }; },
};
const GA = ["_GOOGLE_ERISIM"];
const gB = (s: Sirlar) => ({ Authorization: `Bearer ${s("_GOOGLE_ERISIM")}` });
const tablo = (g: Record<string, unknown>) => zorunlu(g, "tablo", "Tablo kimliği").replace(/^.*\/d\/([\w-]+).*$/, "$1");
const SHEETS = "https://sheets.googleapis.com/v4/spreadsheets";
/** Satır değerleri: JSON listesi ([…] ya da [[…],[…]]) ya da virgülle ayrılmış tek satır. */
const satirlar = (v: unknown): unknown[][] => {
  const l = typeof v === "string" && !v.trim().startsWith("[") ? [virgul(v)] : liste(v, "Satır değerleri");
  return l.length && Array.isArray(l[0]) ? (l as unknown[][]) : [l];
};
const TZ = "Europe/Istanbul";
const zaman = (v: unknown) => ({ dateTime: isoZaman(v), timeZone: TZ });
/** Türkçe karakterli konu ve gövdeyle RFC 2822 ileti (Gmail raw alanı için base64url). */
const mime = (g: { kime: string; konu: string; govde: string; kimden?: string; cc?: string; yanitla?: string }) => {
  const html = /<[a-z][\s\S]*>/i.test(g.govde);
  const satir = [
    `To: ${g.kime}`, ...(g.kimden ? [`From: ${g.kimden}`] : []), ...(g.cc ? [`Cc: ${g.cc}`] : []), ...(g.yanitla ? [`Reply-To: ${g.yanitla}`] : []),
    `Subject: =?UTF-8?B?${b64(g.konu)}?=`, "MIME-Version: 1.0", `Content-Type: ${html ? "text/html" : "text/plain"}; charset=UTF-8`, "Content-Transfer-Encoding: base64", "", b64(g.govde).replace(/.{76}/g, "$&\r\n"),
  ];
  return b64url(satir.join("\r\n"));
};
const takvim = (g: Record<string, unknown>) => enc(t(g.takvim) || "primary");
const CAL = "https://www.googleapis.com/calendar/v3";
const DRIVE = "https://www.googleapis.com/drive/v3";
const ALANLAR = "id,name,mimeType,webViewLink,modifiedTime,parents";

/* ── Microsoft Graph ── */
const MS_SIR: UygSir[] = [
  { ad: "MICROSOFT_CLIENT_ID", etiket: "Uygulama (istemci) kimliği", nasil: "entra.microsoft.com, Uygulama kayıtları; Mail.Send, Calendars.ReadWrite, Files.ReadWrite ve offline_access izinli uygulama." },
  { ad: "MICROSOFT_CLIENT_SECRET", etiket: "İstemci gizli anahtarı", nasil: "Aynı uygulamanın Sertifikalar ve gizli anahtarlar bölümü (genel istemcide boş bırak).", istege: true },
  { ad: "MICROSOFT_REFRESH_TOKEN", etiket: "Yenileme belirteci", nasil: "Uygulamayla OAuth girişinden alınan refresh_token; her yenilemede Vayra yeni değeri bu sırra yazar." },
  { ad: "MICROSOFT_KIRACI", etiket: "Kiracı", nasil: "Boşsa common; kurumsal hesapta kiracı kimliği.", istege: true },
];
const MS_KIMLIK: UygKimlik = {
  sirlar: ["MICROSOFT_CLIENT_ID", "MICROSOFT_REFRESH_TOKEN"],
  istek: (s) => ({ yontem: "POST", url: `https://login.microsoftonline.com/${enc(s("MICROSOFT_KIRACI") || "common")}/oauth2/v2.0/token`, form: dolu({ grant_type: "refresh_token", client_id: s("MICROSOFT_CLIENT_ID"), client_secret: s("MICROSOFT_CLIENT_SECRET"), refresh_token: s("MICROSOFT_REFRESH_TOKEN"), scope: "https://graph.microsoft.com/.default offline_access" }) as Record<string, string> }),
  coz: (y, s) => { const o = y as { access_token?: string; expires_in?: number; refresh_token?: string; error_description?: string }; if (!o?.access_token) throw new Error(`Microsoft belirteç vermedi${o?.error_description ? `: ${o.error_description.split("\r\n")[0]}` : ""}.`); return { degerler: { _MS_ERISIM: o.access_token }, omur: (o.expires_in ?? 3600) * 1000, ...(o.refresh_token && o.refresh_token !== s("MICROSOFT_REFRESH_TOKEN") ? { yeniSirlar: { MICROSOFT_REFRESH_TOKEN: o.refresh_token } } : {}) }; },
};
const GRAPH = "https://graph.microsoft.com/v1.0";
const msB = (s: Sirlar) => ({ Authorization: `Bearer ${s("_MS_ERISIM")}` });
/** Graph dateTime: Türkiye saatinde ofsetsiz. */
const msZaman = (v: unknown) => { const i = isoZaman(v); const d = new Date(Date.parse(i) + 3 * 3600_000).toISOString().slice(0, 19); return { dateTime: d, timeZone: "Turkey Standard Time" }; };
const msAlici = (v: unknown) => virgul(v).map((address) => ({ emailAddress: { address } }));

export const UYG_GOOGLE: Uygulama[] = [
  {
    id: "google-sheets", ad: "Google E-Tablolar", logo: "/marka/google-sheets.svg", kategori: "Veri", aciklama: "Satır ekle, oku, güncelle, temizle ve sayfa aç", belge: "https://developers.google.com/workspace/sheets/api/reference/rest",
    sirlar: G_SIR, kimlik: G_KIMLIK,
    eylemler: [
      { id: "satir-ekle", ad: "Satır ekle", aciklama: "Tablonun sonuna bir ya da çok satır", sirlar: GA, alanlar: [{ ad: "tablo", etiket: "Tablo kimliği ya da adresi", zorunlu: true, yer: "docs.google.com/spreadsheets/d/… adresi" }, { ad: "aralik", etiket: "Sayfa ya da aralık", yer: "Sayfa1", varsayilan: "Sayfa1" }, { ad: "degerler", etiket: "Satır değerleri", tur: "json", zorunlu: true, yer: "[\"{{tetik.ad}}\", \"{{tetik.tutar}}\"] ya da virgülle", aciklama: "Birden çok satır için [[…], […]]" }],
        istek: (g, s) => ({ yontem: "POST", url: `${SHEETS}/${enc(tablo(g))}/values/${enc(t(g.aralik) || "Sayfa1")}:append${sorgu({ valueInputOption: "USER_ENTERED", insertDataOption: "INSERT_ROWS" })}`, basliklar: gB(s), json: { values: satirlar(g.degerler) } }), sonuc: ozetAl("updates.updatedRange") },
      { id: "oku", ad: "Aralığı oku", aciklama: "Hücre değerlerini satır satır getirir", okuma: true, sirlar: GA, alanlar: [{ ad: "tablo", etiket: "Tablo kimliği ya da adresi", zorunlu: true }, { ad: "aralik", etiket: "Aralık", zorunlu: true, yer: "Sayfa1!A1:F100" }],
        istek: (g, s) => ({ yontem: "GET", url: `${SHEETS}/${enc(tablo(g))}/values/${enc(zorunlu(g, "aralik", "Aralık"))}`, basliklar: gB(s) }), sonuc: (y) => ({ ozet: `${((y as { values?: unknown[] })?.values ?? []).length} satır` }) },
      { id: "guncelle", ad: "Aralığı güncelle", aciklama: "Hücrelerin üstüne yazar", sirlar: GA, alanlar: [{ ad: "tablo", etiket: "Tablo kimliği ya da adresi", zorunlu: true }, { ad: "aralik", etiket: "Aralık", zorunlu: true, yer: "Sayfa1!B2" }, { ad: "degerler", etiket: "Değerler", tur: "json", zorunlu: true, yer: "[[\"Kargoda\"]]" }],
        istek: (g, s) => ({ yontem: "PUT", url: `${SHEETS}/${enc(tablo(g))}/values/${enc(zorunlu(g, "aralik", "Aralık"))}?valueInputOption=USER_ENTERED`, basliklar: gB(s), json: { values: satirlar(g.degerler) } }), sonuc: ozetAl("updatedRange") },
      { id: "temizle", ad: "Aralığı temizle", aciklama: "Değerleri siler, biçim kalır", sirlar: GA, alanlar: [{ ad: "tablo", etiket: "Tablo kimliği ya da adresi", zorunlu: true }, { ad: "aralik", etiket: "Aralık", zorunlu: true, yer: "Sayfa1!A2:F" }],
        istek: (g, s) => ({ yontem: "POST", url: `${SHEETS}/${enc(tablo(g))}/values/${enc(zorunlu(g, "aralik", "Aralık"))}:clear`, basliklar: gB(s), json: {} }), sonuc: ozetAl("clearedRange") },
      { id: "sayfa", ad: "Sayfa ekle", aciklama: "Tabloya yeni sekme", sirlar: GA, alanlar: [{ ad: "tablo", etiket: "Tablo kimliği ya da adresi", zorunlu: true }, { ad: "ad", etiket: "Sayfa adı", zorunlu: true, yer: "Kasım 2026" }],
        istek: (g, s) => ({ yontem: "POST", url: `${SHEETS}/${enc(tablo(g))}:batchUpdate`, basliklar: gB(s), json: { requests: [{ addSheet: { properties: { title: zorunlu(g, "ad", "Sayfa adı").slice(0, 100) } } }] } }) },
      { id: "olustur", ad: "Yeni tablo oluştur", aciklama: "Başlıkla boş e-tablo", sirlar: GA, alanlar: [{ ad: "ad", etiket: "Tablo adı", zorunlu: true }, { ad: "basliklar", etiket: "İlk satır başlıkları (virgülle)", yer: "Tarih, Müşteri, Tutar" }],
        istek: (g, s) => ({ yontem: "POST", url: SHEETS, basliklar: gB(s), json: { properties: { title: zorunlu(g, "ad", "Tablo adı") }, ...(t(g.basliklar) ? { sheets: [{ data: [{ startRow: 0, startColumn: 0, rowData: [{ values: virgul(g.basliklar).map((x) => ({ userEnteredValue: { stringValue: x } })) }] }] }] } : {}) } }), sonuc: ozetAl("spreadsheetUrl") },
    ],
  },
  {
    id: "gmail", ad: "Gmail", logo: "/marka/gmail.svg", kategori: "E-posta", aciklama: "Gönder, taslak, ara, oku ve etiketle", belge: "https://developers.google.com/workspace/gmail/api/reference/rest",
    sirlar: G_SIR, kimlik: G_KIMLIK,
    eylemler: [
      { id: "gonder", ad: "E-posta gönder", aciklama: "Kendi Gmail hesabından, HTML ya da düz metin", sirlar: GA, alanlar: [{ ad: "alici", etiket: "Alıcı", zorunlu: true }, { ad: "konu", etiket: "Konu", zorunlu: true }, { ad: "govde", etiket: "İçerik", tur: "uzunMetin", zorunlu: true }, { ad: "cc", etiket: "Bilgi (cc)" }, { ad: "yanitla", etiket: "Yanıt adresi" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://gmail.googleapis.com/gmail/v1/users/me/messages/send", basliklar: gB(s), json: { raw: mime({ kime: zorunlu(g, "alici", "Alıcı"), konu: zorunlu(g, "konu", "Konu"), govde: zorunlu(g, "govde", "İçerik"), cc: t(g.cc), yanitla: t(g.yanitla) }) } }), sonuc: ozetAl("id") },
      { id: "taslak", ad: "Taslak oluştur", aciklama: "Göndermeden taslaklara koyar", sirlar: GA, alanlar: [{ ad: "alici", etiket: "Alıcı", zorunlu: true }, { ad: "konu", etiket: "Konu", zorunlu: true }, { ad: "govde", etiket: "İçerik", tur: "uzunMetin", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: "https://gmail.googleapis.com/gmail/v1/users/me/drafts", basliklar: gB(s), json: { message: { raw: mime({ kime: zorunlu(g, "alici", "Alıcı"), konu: zorunlu(g, "konu", "Konu"), govde: zorunlu(g, "govde", "İçerik") }) } } }), sonuc: ozetAl("id") },
      { id: "ara", ad: "İletileri ara", aciklama: "Gmail arama söz dizimiyle", okuma: true, sirlar: GA, alanlar: [{ ad: "sorgu", etiket: "Arama", zorunlu: true, yer: "from:siparis@trendyol.com is:unread newer_than:1d" }, { ad: "adet", etiket: "Kaç ileti", tur: "sayi", varsayilan: "10", yer: "10" }],
        istek: (g, s) => ({ yontem: "GET", url: `https://gmail.googleapis.com/gmail/v1/users/me/messages${sorgu({ q: zorunlu(g, "sorgu", "Arama"), maxResults: tamsayi(g.adet, 10, 1, 100) })}`, basliklar: gB(s) }), sonuc: (y) => ({ ozet: `${((y as { messages?: unknown[] })?.messages ?? []).length} ileti` }) },
      { id: "oku", ad: "İletiyi getir", aciklama: "Başlıklar, özet ve gövde", okuma: true, sirlar: GA, alanlar: [{ ad: "ileti", etiket: "İleti kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `https://gmail.googleapis.com/gmail/v1/users/me/messages/${enc(zorunlu(g, "ileti", "İleti kimliği"))}?format=full`, basliklar: gB(s) }), sonuc: ozetAl("snippet") },
      { id: "etiketle", ad: "Okundu işaretle ya da etiketle", aciklama: "Etiket ekle ve kaldır", sirlar: GA, alanlar: [{ ad: "ileti", etiket: "İleti kimliği", zorunlu: true }, { ad: "ekle", etiket: "Eklenecek etiket kimlikleri (virgülle)", yer: "STARRED" }, { ad: "kaldir", etiket: "Kaldırılacak etiketler (virgülle)", yer: "UNREAD", varsayilan: "UNREAD" }],
        istek: (g, s) => ({ yontem: "POST", url: `https://gmail.googleapis.com/gmail/v1/users/me/messages/${enc(zorunlu(g, "ileti", "İleti kimliği"))}/modify`, basliklar: gB(s), json: { addLabelIds: virgul(g.ekle), removeLabelIds: virgul(g.kaldir) } }) },
    ],
  },
  {
    id: "google-calendar", ad: "Google Takvim", logo: "/marka/google-calendar.svg", kategori: "Verimlilik", aciklama: "Etkinlik oluştur, listele, güncelle, sil ve boşluk bul", belge: "https://developers.google.com/workspace/calendar/api/v3/reference",
    sirlar: G_SIR, kimlik: G_KIMLIK,
    eylemler: [
      { id: "olustur", ad: "Etkinlik oluştur", aciklama: "Katılımcı davetli, isteğe bağlı Meet bağlantılı", sirlar: GA, alanlar: [{ ad: "baslik", etiket: "Başlık", zorunlu: true }, { ad: "baslangic", etiket: "Başlangıç", zorunlu: true, yer: "2026-11-07 14:00" }, { ad: "bitis", etiket: "Bitiş", zorunlu: true, yer: "2026-11-07 15:00" }, { ad: "aciklama", etiket: "Açıklama", tur: "uzunMetin" }, { ad: "yer", etiket: "Yer" }, { ad: "katilimcilar", etiket: "Katılımcılar (virgülle e-posta)" }, { ad: "meet", etiket: "Google Meet bağlantısı ekle", tur: "evet-hayir" }, { ad: "takvim", etiket: "Takvim kimliği", yer: "primary", varsayilan: "primary" }],
        istek: (g, s) => ({ yontem: "POST", url: `${CAL}/calendars/${takvim(g)}/events${sorgu({ sendUpdates: virgul(g.katilimcilar).length ? "all" : "none", conferenceDataVersion: evet(g.meet) ? 1 : undefined })}`, basliklar: gB(s), json: dolu({ summary: zorunlu(g, "baslik", "Başlık"), description: t(g.aciklama), location: t(g.yer), start: zaman(zorunlu(g, "baslangic", "Başlangıç")), end: zaman(zorunlu(g, "bitis", "Bitiş")), attendees: virgul(g.katilimcilar).map((email) => ({ email })), conferenceData: evet(g.meet) ? { createRequest: { requestId: rastgele(8), conferenceSolutionKey: { type: "hangoutsMeet" } } } : undefined }) }), sonuc: ozetAl("htmlLink") },
      { id: "listele", ad: "Etkinlikleri listele", aciklama: "Zaman aralığında, aramayla", okuma: true, sirlar: GA, alanlar: [{ ad: "baslangic", etiket: "Başlangıç (boşsa şimdi)", yer: "2026-11-07 00:00" }, { ad: "bitis", etiket: "Bitiş (isteğe bağlı)", yer: "2026-11-08 00:00" }, { ad: "ara", etiket: "Arama" }, { ad: "takvim", etiket: "Takvim kimliği", yer: "primary", varsayilan: "primary" }],
        istek: (g, s) => ({ yontem: "GET", url: `${CAL}/calendars/${takvim(g)}/events${sorgu({ timeMin: t(g.baslangic) ? isoZaman(g.baslangic) : new Date().toISOString(), timeMax: t(g.bitis) ? isoZaman(g.bitis) : undefined, q: t(g.ara), singleEvents: "true", orderBy: "startTime", maxResults: 50 })}`, basliklar: gB(s) }), sonuc: (y) => ({ ozet: `${((y as { items?: unknown[] })?.items ?? []).length} etkinlik` }) },
      { id: "guncelle", ad: "Etkinliği güncelle", aciklama: "Yalnız doldurulan alanlar değişir", sirlar: GA, alanlar: [{ ad: "etkinlik", etiket: "Etkinlik kimliği", zorunlu: true }, { ad: "baslik", etiket: "Başlık" }, { ad: "baslangic", etiket: "Başlangıç" }, { ad: "bitis", etiket: "Bitiş" }, { ad: "aciklama", etiket: "Açıklama", tur: "uzunMetin" }, { ad: "takvim", etiket: "Takvim kimliği", yer: "primary", varsayilan: "primary" }],
        istek: (g, s) => ({ yontem: "PATCH", url: `${CAL}/calendars/${takvim(g)}/events/${enc(zorunlu(g, "etkinlik", "Etkinlik kimliği"))}?sendUpdates=all`, basliklar: gB(s), json: dolu({ summary: t(g.baslik), description: t(g.aciklama), start: t(g.baslangic) ? zaman(g.baslangic) : undefined, end: t(g.bitis) ? zaman(g.bitis) : undefined }) }), sonuc: ozetAl("htmlLink") },
      { id: "sil", ad: "Etkinliği sil", aciklama: "Katılımcılara iptal bildirimi gider", sirlar: GA, alanlar: [{ ad: "etkinlik", etiket: "Etkinlik kimliği", zorunlu: true }, { ad: "takvim", etiket: "Takvim kimliği", yer: "primary", varsayilan: "primary" }],
        istek: (g, s) => ({ yontem: "DELETE", url: `${CAL}/calendars/${takvim(g)}/events/${enc(zorunlu(g, "etkinlik", "Etkinlik kimliği"))}?sendUpdates=all`, basliklar: gB(s), yanit: "metin" }) },
      { id: "hizli", ad: "Hızlı etkinlik ekle", aciklama: "Doğal dille (İngilizce): Lunch with Ayşe tomorrow 1pm", sirlar: GA, alanlar: [{ ad: "metin", etiket: "Etkinlik metni", zorunlu: true }, { ad: "takvim", etiket: "Takvim kimliği", yer: "primary", varsayilan: "primary" }],
        istek: (g, s) => ({ yontem: "POST", url: `${CAL}/calendars/${takvim(g)}/events/quickAdd${sorgu({ text: zorunlu(g, "metin", "Etkinlik metni") })}`, basliklar: gB(s) }), sonuc: ozetAl("htmlLink") },
      { id: "bosluk", ad: "Boş ve dolu zamanları getir", aciklama: "Takvimlerin meşgul aralıkları", okuma: true, sirlar: GA, alanlar: [{ ad: "baslangic", etiket: "Başlangıç", zorunlu: true }, { ad: "bitis", etiket: "Bitiş", zorunlu: true }, { ad: "takvimler", etiket: "Takvimler (virgülle)", yer: "primary", varsayilan: "primary" }],
        istek: (g, s) => ({ yontem: "POST", url: `${CAL}/freeBusy`, basliklar: gB(s), json: { timeMin: isoZaman(zorunlu(g, "baslangic", "Başlangıç")), timeMax: isoZaman(zorunlu(g, "bitis", "Bitiş")), timeZone: TZ, items: (virgul(g.takvimler).length ? virgul(g.takvimler) : ["primary"]).map((id) => ({ id })) } }) },
    ],
  },
  {
    id: "google-drive", ad: "Google Drive", logo: "/marka/google-drive.svg", kategori: "Dosya", aciklama: "Klasör, dosya yükle, ara, paylaş ve kopyala", belge: "https://developers.google.com/workspace/drive/api/reference/rest/v3",
    sirlar: G_SIR, kimlik: G_KIMLIK,
    eylemler: [
      { id: "klasor", ad: "Klasör oluştur", aciklama: "İsteğe bağlı üst klasörde", sirlar: GA, alanlar: [{ ad: "ad", etiket: "Klasör adı", zorunlu: true }, { ad: "ust", etiket: "Üst klasör kimliği (isteğe bağlı)" }],
        istek: (g, s) => ({ yontem: "POST", url: `${DRIVE}/files?fields=${ALANLAR}`, basliklar: gB(s), json: dolu({ name: zorunlu(g, "ad", "Klasör adı"), mimeType: "application/vnd.google-apps.folder", parents: t(g.ust) ? [t(g.ust)] : undefined }) }), sonuc: ozetAl("webViewLink") },
      { id: "yukle", ad: "Metin dosyası yükle", aciklama: "CSV, JSON, Markdown ya da düz metin", sirlar: GA, alanlar: [{ ad: "ad", etiket: "Dosya adı", zorunlu: true, yer: "rapor.csv" }, { ad: "icerik", etiket: "İçerik", tur: "uzunMetin", zorunlu: true }, { ad: "tur", etiket: "Dosya türü", tur: "secim", secenekler: [{ id: "text/plain", ad: "Düz metin" }, { id: "text/csv", ad: "CSV" }, { id: "application/json", ad: "JSON" }, { id: "text/markdown", ad: "Markdown" }, { id: "text/html", ad: "HTML" }], varsayilan: "text/plain" }, { ad: "ust", etiket: "Klasör kimliği (isteğe bağlı)" }, { ad: "dokuman", etiket: "Google dosyasına çevir", tur: "evet-hayir", aciklama: "CSV e-tabloya, metin dokümana dönüşür" }],
        istek: (g, s) => { const sinir = `vayra${rastgele(8)}`; const tur = t(g.tur) || "text/plain"; const hedef = evet(g.dokuman) ? (tur === "text/csv" ? "application/vnd.google-apps.spreadsheet" : "application/vnd.google-apps.document") : undefined; const meta = dolu({ name: zorunlu(g, "ad", "Dosya adı"), parents: t(g.ust) ? [t(g.ust)] : undefined, mimeType: hedef });
          return { yontem: "POST", url: `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=${ALANLAR}`, basliklar: gB(s), tur: `multipart/related; boundary=${sinir}`, metin: `--${sinir}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${sinir}\r\nContent-Type: ${tur}; charset=UTF-8\r\n\r\n${m(g.icerik)}\r\n--${sinir}--` }; }, sonuc: ozetAl("webViewLink") },
      { id: "ara", ad: "Dosya ara", aciklama: "Ada ya da klasöre göre", okuma: true, sirlar: GA, alanlar: [{ ad: "ad", etiket: "Adında geçen" }, { ad: "klasor", etiket: "Klasör kimliği" }, { ad: "sorgu", etiket: "Özel Drive sorgusu (isteğe bağlı)", yer: "mimeType = 'application/pdf'" }],
        istek: (g, s) => { const q = [t(g.sorgu), t(g.ad) ? `name contains '${t(g.ad).replace(/'/g, "\\'")}'` : "", t(g.klasor) ? `'${t(g.klasor).replace(/'/g, "")}' in parents` : "", "trashed = false"].filter(Boolean).join(" and "); return { yontem: "GET", url: `${DRIVE}/files${sorgu({ q, pageSize: 50, fields: `files(${ALANLAR})`, orderBy: "modifiedTime desc" })}`, basliklar: gB(s) }; }, sonuc: (y) => ({ ozet: `${((y as { files?: unknown[] })?.files ?? []).length} dosya` }) },
      { id: "paylas", ad: "Dosyayı paylaş", aciklama: "Kişiye ya da bağlantıya sahip herkese", sirlar: GA, alanlar: [{ ad: "dosya", etiket: "Dosya kimliği", zorunlu: true }, { ad: "eposta", etiket: "Kişinin e-postası (boşsa bağlantıya sahip herkes)" }, { ad: "rol", etiket: "Yetki", tur: "secim", secenekler: [{ id: "reader", ad: "Görüntüleyen" }, { id: "commenter", ad: "Yorumcu" }, { id: "writer", ad: "Düzenleyen" }], varsayilan: "reader" }],
        istek: (g, s) => ({ yontem: "POST", url: `${DRIVE}/files/${enc(zorunlu(g, "dosya", "Dosya kimliği"))}/permissions${sorgu({ sendNotificationEmail: t(g.eposta) ? "true" : undefined })}`, basliklar: gB(s), json: t(g.eposta) ? { type: "user", role: t(g.rol) || "reader", emailAddress: t(g.eposta) } : { type: "anyone", role: t(g.rol) || "reader" } }) },
      { id: "kopyala", ad: "Dosyayı kopyala", aciklama: "Şablondan yeni dosya", sirlar: GA, alanlar: [{ ad: "dosya", etiket: "Kaynak dosya kimliği", zorunlu: true }, { ad: "ad", etiket: "Yeni ad", zorunlu: true }, { ad: "ust", etiket: "Hedef klasör (isteğe bağlı)" }],
        istek: (g, s) => ({ yontem: "POST", url: `${DRIVE}/files/${enc(zorunlu(g, "dosya", "Dosya kimliği"))}/copy?fields=${ALANLAR}`, basliklar: gB(s), json: dolu({ name: zorunlu(g, "ad", "Yeni ad"), parents: t(g.ust) ? [t(g.ust)] : undefined }) }), sonuc: ozetAl("webViewLink") },
    ],
  },
  {
    id: "google-docs", ad: "Google Dokümanlar", logo: "/marka/google-docs.svg", kategori: "Dosya", aciklama: "Doküman oluştur ve metin ekle", belge: "https://developers.google.com/workspace/docs/api/reference/rest",
    sirlar: G_SIR, kimlik: G_KIMLIK,
    eylemler: [
      { id: "olustur", ad: "Doküman oluştur", aciklama: "Başlıkla boş doküman", sirlar: GA, alanlar: [{ ad: "ad", etiket: "Başlık", zorunlu: true }], istek: (g, s) => ({ yontem: "POST", url: "https://docs.googleapis.com/v1/documents", basliklar: gB(s), json: { title: zorunlu(g, "ad", "Başlık") } }), sonuc: ozetAl("documentId") },
      { id: "ekle", ad: "Sonuna metin ekle", aciklama: "Dokümanın sonuna paragraf", sirlar: GA, alanlar: [{ ad: "dokuman", etiket: "Doküman kimliği", zorunlu: true }, { ad: "metin", etiket: "Metin", tur: "uzunMetin", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: `https://docs.googleapis.com/v1/documents/${enc(zorunlu(g, "dokuman", "Doküman kimliği").replace(/^.*\/d\/([\w-]+).*$/, "$1"))}:batchUpdate`, basliklar: gB(s), json: { requests: [{ insertText: { endOfSegmentLocation: {}, text: `\n${zorunlu(g, "metin", "Metin")}` } }] } }) },
    ],
  },
  {
    id: "google-tasks", ad: "Google Görevler", logo: "/marka/uyg/google-tasks.svg", kategori: "Verimlilik", aciklama: "Görev ekle ve tamamla", belge: "https://developers.google.com/workspace/tasks/reference/rest",
    sirlar: G_SIR, kimlik: G_KIMLIK,
    eylemler: [
      { id: "ekle", ad: "Görev ekle", aciklama: "Not ve bitiş günüyle", sirlar: GA, alanlar: [{ ad: "baslik", etiket: "Görev", zorunlu: true }, { ad: "not", etiket: "Not", tur: "uzunMetin" }, { ad: "bitis", etiket: "Bitiş günü", yer: "2026-11-10" }, { ad: "liste", etiket: "Liste kimliği", yer: "@default", varsayilan: "@default" }],
        istek: (g, s) => ({ yontem: "POST", url: `https://tasks.googleapis.com/tasks/v1/lists/${enc(t(g.liste) || "@default")}/tasks`, basliklar: gB(s), json: dolu({ title: zorunlu(g, "baslik", "Görev"), notes: t(g.not), due: t(g.bitis) ? `${t(g.bitis).slice(0, 10)}T00:00:00.000Z` : undefined }) }), sonuc: ozetAl("id") },
      { id: "tamamla", ad: "Görevi tamamla", aciklama: "Tamamlandı işaretler", sirlar: GA, alanlar: [{ ad: "gorev", etiket: "Görev kimliği", zorunlu: true }, { ad: "liste", etiket: "Liste kimliği", yer: "@default", varsayilan: "@default" }],
        istek: (g, s) => ({ yontem: "PATCH", url: `https://tasks.googleapis.com/tasks/v1/lists/${enc(t(g.liste) || "@default")}/tasks/${enc(zorunlu(g, "gorev", "Görev kimliği"))}`, basliklar: gB(s), json: { status: "completed" } }) },
    ],
  },
  {
    id: "google-translate", ad: "Google Çeviri", logo: "/marka/uyg/google-translate.svg", kategori: "Yapay zekâ", aciklama: "Metni çevir ve dilini bul", belge: "https://cloud.google.com/translate/docs/reference/rest/v2/translate",
    sirlar: [{ ad: "GOOGLE_API_KEY", etiket: "API anahtarı", nasil: "console.cloud.google.com, Kimlik bilgileri, API anahtarı; Cloud Translation API'yi etkinleştir." }],
    eylemler: [
      { id: "cevir", ad: "Metni çevir", aciklama: "Kaynak dil kendiliğinden bulunur", sirlar: ["GOOGLE_API_KEY"], alanlar: [{ ad: "metin", etiket: "Metin", tur: "uzunMetin", zorunlu: true }, { ad: "hedef", etiket: "Hedef dil", yer: "en", varsayilan: "en" }, { ad: "kaynak", etiket: "Kaynak dil (isteğe bağlı)", yer: "tr" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://translation.googleapis.com/language/translate/v2", basliklar: { "x-goog-api-key": s("GOOGLE_API_KEY") }, json: dolu({ q: zorunlu(g, "metin", "Metin"), target: t(g.hedef) || "en", source: t(g.kaynak), format: "text" }) }), sonuc: ozetAl("data.translations.0.translatedText") },
      { id: "dil", ad: "Dilini bul", aciklama: "Metnin dili ve güven", okuma: true, sirlar: ["GOOGLE_API_KEY"], alanlar: [{ ad: "metin", etiket: "Metin", tur: "uzunMetin", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: "https://translation.googleapis.com/language/translate/v2/detect", basliklar: { "x-goog-api-key": s("GOOGLE_API_KEY") }, json: { q: zorunlu(g, "metin", "Metin") } }), sonuc: ozetAl("data.detections.0.0.language") },
    ],
  },
  {
    id: "google-analytics", ad: "Google Analytics", logo: "/marka/uyg/google-analytics.svg", kategori: "Analitik", aciklama: "Sunucudan GA4 olayı gönder", belge: "https://developers.google.com/analytics/devguides/collection/protocol/ga4/sending-events",
    sirlar: [{ ad: "GA_OLCUM_KIMLIGI", etiket: "Ölçüm kimliği", nasil: "GA4, Yönetici, Veri akışları; G- ile başlayan kimlik." }, { ad: "GA_API_SECRET", etiket: "Measurement Protocol gizli anahtarı", nasil: "Aynı veri akışında Measurement Protocol API secrets, Oluştur." }],
    eylemler: [{ id: "olay", ad: "Olay gönder", aciklama: "purchase, generate_lead gibi olaylar", sirlar: ["GA_OLCUM_KIMLIGI", "GA_API_SECRET"], alanlar: [{ ad: "istemci", etiket: "İstemci kimliği (client_id)", zorunlu: true, yer: "/ ile ziyaretçi kimliği" }, { ad: "olay", etiket: "Olay adı", zorunlu: true, yer: "purchase" }, { ad: "parametreler", etiket: "Parametreler (JSON)", tur: "json", yer: "{\"value\": 120, \"currency\": \"TRY\"}" }, { ad: "kullanici", etiket: "Kullanıcı kimliği (isteğe bağlı)" }],
      istek: (g, s) => ({ yontem: "POST", url: `https://www.google-analytics.com/mp/collect${sorgu({ measurement_id: s("GA_OLCUM_KIMLIGI"), api_secret: s("GA_API_SECRET") })}`, json: dolu({ client_id: zorunlu(g, "istemci", "İstemci kimliği"), user_id: t(g.kullanici), events: [{ name: zorunlu(g, "olay", "Olay adı").replace(/[^\w]/g, "_").slice(0, 40), params: nesne(g.parametreler, "Parametreler") }] }), yanit: "metin" }) }],
  },
  {
    id: "outlook", ad: "Outlook", logo: "/marka/uyg/microsoft-outlook.svg", kategori: "E-posta", aciklama: "E-posta gönder, gelen kutusu ve takvim etkinliği", belge: "https://learn.microsoft.com/graph/api/user-sendmail",
    sirlar: MS_SIR, kimlik: MS_KIMLIK,
    eylemler: [
      { id: "gonder", ad: "E-posta gönder", aciklama: "Microsoft hesabından", sirlar: ["_MS_ERISIM"], alanlar: [{ ad: "alici", etiket: "Alıcı (virgülle)", zorunlu: true }, { ad: "konu", etiket: "Konu", zorunlu: true }, { ad: "govde", etiket: "İçerik", tur: "uzunMetin", zorunlu: true }, { ad: "cc", etiket: "Bilgi (cc)" }],
        istek: (g, s) => { const v = zorunlu(g, "govde", "İçerik"); return { yontem: "POST", url: `${GRAPH}/me/sendMail`, basliklar: msB(s), json: { message: dolu({ subject: zorunlu(g, "konu", "Konu"), body: { contentType: /<[a-z][\s\S]*>/i.test(v) ? "HTML" : "Text", content: v }, toRecipients: msAlici(zorunlu(g, "alici", "Alıcı")), ccRecipients: msAlici(g.cc) }), saveToSentItems: true }, yanit: "metin" }; } },
      { id: "gelen", ad: "Okunmamış iletileri getir", aciklama: "Gelen kutusundaki son iletiler", okuma: true, sirlar: ["_MS_ERISIM"], alanlar: [{ ad: "adet", etiket: "Kaç ileti", tur: "sayi", varsayilan: "10", yer: "10" }],
        istek: (g, s) => ({ yontem: "GET", url: `${GRAPH}/me/mailFolders/inbox/messages${sorgu({ $top: tamsayi(g.adet, 10, 1, 50), $filter: "isRead eq false", $orderby: "receivedDateTime desc", $select: "id,subject,from,receivedDateTime,bodyPreview,webLink" })}`, basliklar: msB(s) }), sonuc: (y) => ({ ozet: `${((y as { value?: unknown[] })?.value ?? []).length} ileti` }) },
      { id: "etkinlik", ad: "Takvime etkinlik ekle", aciklama: "Katılımcı davetli, isteğe bağlı Teams toplantısı", sirlar: ["_MS_ERISIM"], alanlar: [{ ad: "baslik", etiket: "Başlık", zorunlu: true }, { ad: "baslangic", etiket: "Başlangıç", zorunlu: true, yer: "2026-11-07 14:00" }, { ad: "bitis", etiket: "Bitiş", zorunlu: true, yer: "2026-11-07 15:00" }, { ad: "aciklama", etiket: "Açıklama", tur: "uzunMetin" }, { ad: "katilimcilar", etiket: "Katılımcılar (virgülle)" }, { ad: "teams", etiket: "Teams toplantısı", tur: "evet-hayir" }],
        istek: (g, s) => ({ yontem: "POST", url: `${GRAPH}/me/events`, basliklar: msB(s), json: dolu({ subject: zorunlu(g, "baslik", "Başlık"), body: t(g.aciklama) ? { contentType: "Text", content: t(g.aciklama) } : undefined, start: msZaman(zorunlu(g, "baslangic", "Başlangıç")), end: msZaman(zorunlu(g, "bitis", "Bitiş")), attendees: virgul(g.katilimcilar).map((address) => ({ emailAddress: { address }, type: "required" })), isOnlineMeeting: evet(g.teams) || undefined, onlineMeetingProvider: evet(g.teams) ? "teamsForBusiness" : undefined }) }), sonuc: ozetAl("webLink") },
    ],
  },
  {
    id: "microsoft-excel", ad: "Excel ve OneDrive", logo: "/marka/uyg/microsoft-excel.svg", kategori: "Veri", aciklama: "Excel tablosuna satır ekle, OneDrive'a dosya yükle", belge: "https://learn.microsoft.com/graph/api/table-post-rows",
    sirlar: MS_SIR, kimlik: MS_KIMLIK,
    eylemler: [
      { id: "satir", ad: "Tabloya satır ekle", aciklama: "OneDrive'daki çalışma kitabının tablosuna", sirlar: ["_MS_ERISIM"], alanlar: [{ ad: "dosya", etiket: "Çalışma kitabı yolu", zorunlu: true, yer: "Belgeler/Siparisler.xlsx" }, { ad: "tablo", etiket: "Tablo adı", zorunlu: true, yer: "Tablo1" }, { ad: "degerler", etiket: "Satır değerleri", tur: "json", zorunlu: true, yer: "[\"{{tetik.ad}}\", {{tetik.tutar}}]" }],
        istek: (g, s) => ({ yontem: "POST", url: `${GRAPH}/me/drive/root:/${zorunlu(g, "dosya", "Dosya yolu").replace(/^\/+/, "").split("/").map(enc).join("/")}:/workbook/tables/${enc(zorunlu(g, "tablo", "Tablo adı"))}/rows`, basliklar: msB(s), json: { values: satirlar(g.degerler) } }), sonuc: ozetAl("index") },
      { id: "yukle", ad: "OneDrive'a metin dosyası yükle", aciklama: "4 MB'a kadar; varsa üstüne yazar", sirlar: ["_MS_ERISIM"], alanlar: [{ ad: "dosya", etiket: "Dosya yolu", zorunlu: true, yer: "Vayra/rapor.csv" }, { ad: "icerik", etiket: "İçerik", tur: "uzunMetin", zorunlu: true }],
        istek: (g, s) => ({ yontem: "PUT", url: `${GRAPH}/me/drive/root:/${zorunlu(g, "dosya", "Dosya yolu").replace(/^\/+/, "").split("/").map(enc).join("/")}:/content`, basliklar: msB(s), metin: m(g.icerik), tur: "text/plain; charset=utf-8" }), sonuc: ozetAl("webUrl") },
    ],
  },
];
void ({} as UygIstek);
