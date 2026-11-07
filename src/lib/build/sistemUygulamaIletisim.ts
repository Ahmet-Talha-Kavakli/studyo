import { MESAJ, b64url, dolu, enc, evet, liste, m, md5, nesne, okDenetle, ozetAl, siteKoku, sorgu, t, tamsayi, telefon, temel, virgul, zorunlu, type Sirlar, type UygAlan, type UygIstek, type Uygulama } from "./sistemUygulamaOrtak";

/**
 * Mesajlaşma, bildirim, e-posta ve sosyal medya servisleri. Kaynaklar: api.slack.com, discord.com/developers,
 * core.telegram.org/bots/api, developers.facebook.com (WhatsApp Cloud, Messenger, Pages, Instagram Graph),
 * developers.google.com/workspace/chat, learn.microsoft.com (Teams iş akışı web kancası), twilio.com/docs, mattermost.com,
 * pushover.net/api, docs.ntfy.sh, documentation.onesignal.com, resend.com/docs, sendgrid.com/docs, documentation.mailgun.com,
 * postmarkapp.com/developer, developers.brevo.com, mailchimp.com/developer, developers.mailerlite.com,
 * developers.klaviyo.com, developers.kit.com, learn.microsoft.com/linkedin, docs.bsky.app, docs.joinmastodon.org,
 * developers.pinterest.com, docs.x.com.
 */
const GRAPH = "https://graph.facebook.com/v21.0";
const wa = (s: Sirlar, json: unknown): UygIstek => ({ yontem: "POST", url: `${GRAPH}/${enc(s("WHATSAPP_PHONE_ID"))}/messages`, basliklar: { Authorization: `Bearer ${s("WHATSAPP_TOKEN")}` }, json: { messaging_product: "whatsapp", ...(json as object) } });
const WA = ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_ID"];
const waNo = (g: Record<string, unknown>) => zorunlu(g, "telefon", "Alıcı telefon").replace(/[^\d]/g, "");
const tg = (s: Sirlar, yontem: string, json: unknown): UygIstek => ({ yontem: "POST", url: `https://api.telegram.org/bot${s("TELEGRAM_BOT_TOKEN")}/${yontem}`, json });
const TG_SOHBET: UygAlan = { ad: "sohbet", etiket: "Sohbet kimliği", zorunlu: true, yer: "123456789 ya da @kanaladi" };
const tgSonuc = okDenetle("ok", "description");
const slackBot = (s: Sirlar, yontem: string, json: unknown): UygIstek => ({ yontem: "POST", url: `https://slack.com/api/${yontem}`, basliklar: { Authorization: `Bearer ${s("SLACK_BOT_TOKEN")}` }, json });
const twA = (s: Sirlar) => ({ Authorization: temel(s("TWILIO_ACCOUNT_SID"), s("TWILIO_AUTH_TOKEN")) });
const TW = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"];
const icerik = (v: string) => (/<[a-z][\s\S]*>/i.test(v) ? { html: v } : { text: v });
const EPOSTA_ALAN: UygAlan[] = [{ ad: "gonderen", etiket: "Gönderen", zorunlu: true, yer: "Mağaza <siparis@alanadin.com>" }, { ad: "alici", etiket: "Alıcı (virgülle birden çok)", zorunlu: true, yer: "/ ile müşteri e-postası" }, { ad: "konu", etiket: "Konu", zorunlu: true }, { ad: "govde", etiket: "İçerik", tur: "uzunMetin", zorunlu: true, aciklama: "HTML yazarsan HTML olarak gider" }];
/** "Ad <eposta>" biçimini ayırır. */
const adres = (v: string) => { const x = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(v); return x ? { email: x[2].trim(), ...(x[1] ? { name: x[1].replace(/^"|"$/g, "") } : {}) } : { email: v.trim() }; };
const mcDc = (s: Sirlar) => { const d = s("MAILCHIMP_API_KEY").split("-").pop() ?? ""; if (!/^[a-z]+\d+$/.test(d)) throw new Error("Mailchimp anahtarı -us21 gibi veri merkezi ekiyle bitmeli."); return d; };
const mcUye = (s: Sirlar, liste_: string, eposta: string) => `https://${mcDc(s)}.api.mailchimp.com/3.0/lists/${enc(liste_)}/members/${md5(eposta.trim().toLowerCase())}`;
const KLAVIYO_REV = "2025-07-15";
const klB = (s: Sirlar) => ({ Authorization: `Klaviyo-API-Key ${s("KLAVIYO_API_KEY")}`, revision: KLAVIYO_REV, Accept: "application/vnd.api+json" });
const LINKEDIN_SURUM = "202601";

export const UYG_ILETISIM: Uygulama[] = [
  {
    id: "slack", ad: "Slack", logo: "/marka/baglanti/slack.svg", kategori: "Mesajlaşma", aciklama: "Mesaj, güncelleme, tepki, kanal ve kişi arama", belge: "https://api.slack.com/methods",
    sirlar: [{ ad: "SLACK_WEBHOOK_URL", etiket: "Gelen web kancası adresi", nasil: "Slack uygulamasında Incoming Webhooks açıp kanal seç; https://hooks.slack.com/services/ ile başlayan adresi kopyala." }, { ad: "SLACK_BOT_TOKEN", etiket: "Bot belirteci", nasil: "api.slack.com/apps içinde OAuth & Permissions bölümünden xoxb- ile başlayan belirteç; chat:write, reactions:write, channels:manage, users:read.email izinleri." }],
    eylemler: [
      { id: "kanca", ad: "Kanala mesaj gönder", aciklama: "Gelen web kancasıyla, kurulumu en kolay yol", sirlar: ["SLACK_WEBHOOK_URL"], alanlar: [MESAJ], istek: (g, s) => ({ yontem: "POST", url: s("SLACK_WEBHOOK_URL"), json: { text: zorunlu(g, "metin", "Mesaj") }, yanit: "metin" }) },
      { id: "bot", ad: "Bot olarak mesaj gönder", aciklama: "İstediğin kanala ya da kişiye, isteğe bağlı yanıt dizisine", sirlar: ["SLACK_BOT_TOKEN"], alanlar: [{ ad: "kanal", etiket: "Kanal", zorunlu: true, yer: "#siparisler ya da C0123456" }, MESAJ, { ad: "dizi", etiket: "Yanıt dizisi (thread_ts, isteğe bağlı)" }],
        istek: (g, s) => slackBot(s, "chat.postMessage", dolu({ channel: zorunlu(g, "kanal", "Kanal"), text: zorunlu(g, "metin", "Mesaj"), thread_ts: t(g.dizi) })), sonuc: okDenetle() },
      { id: "guncelle", ad: "Mesajı güncelle", aciklama: "Bot mesajının metnini değiştir", sirlar: ["SLACK_BOT_TOKEN"], alanlar: [{ ad: "kanal", etiket: "Kanal kimliği", zorunlu: true }, { ad: "ts", etiket: "Mesaj zamanı (ts)", zorunlu: true, yer: "/ ile mesaj adımının ts değeri" }, MESAJ],
        istek: (g, s) => slackBot(s, "chat.update", { channel: zorunlu(g, "kanal", "Kanal"), ts: zorunlu(g, "ts", "Mesaj zamanı"), text: zorunlu(g, "metin", "Mesaj") }), sonuc: okDenetle() },
      { id: "tepki", ad: "Mesaja tepki ekle", aciklama: "Emoji adıyla, ör. white_check_mark", sirlar: ["SLACK_BOT_TOKEN"], alanlar: [{ ad: "kanal", etiket: "Kanal kimliği", zorunlu: true }, { ad: "ts", etiket: "Mesaj zamanı (ts)", zorunlu: true }, { ad: "emoji", etiket: "Emoji adı", zorunlu: true, yer: "eyes" }],
        istek: (g, s) => slackBot(s, "reactions.add", { channel: zorunlu(g, "kanal", "Kanal"), timestamp: zorunlu(g, "ts", "Mesaj zamanı"), name: zorunlu(g, "emoji", "Emoji").replace(/:/g, "") }), sonuc: okDenetle() },
      { id: "kisi", ad: "E-postayla kişi bul", aciklama: "Slack kullanıcı kimliğini getirir", okuma: true, sirlar: ["SLACK_BOT_TOKEN"], alanlar: [{ ad: "eposta", etiket: "E-posta", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `https://slack.com/api/users.lookupByEmail${sorgu({ email: zorunlu(g, "eposta", "E-posta") })}`, basliklar: { Authorization: `Bearer ${s("SLACK_BOT_TOKEN")}` } }), sonuc: (y) => ({ ...okDenetle()(y), ozet: m((y as { user?: { id?: string } })?.user?.id) || undefined }) },
      { id: "kanal", ad: "Kanal oluştur", aciklama: "Herkese açık ya da özel kanal", sirlar: ["SLACK_BOT_TOKEN"], alanlar: [{ ad: "ad", etiket: "Kanal adı", zorunlu: true, yer: "musteri-ayse" }, { ad: "ozel", etiket: "Özel kanal", tur: "evet-hayir" }],
        istek: (g, s) => slackBot(s, "conversations.create", { name: zorunlu(g, "ad", "Kanal adı").toLocaleLowerCase("tr").replace(/[^a-z0-9_-]+/g, "-").slice(0, 80), is_private: evet(g.ozel) }), sonuc: okDenetle() },
    ],
  },
  {
    id: "discord", ad: "Discord", logo: "/marka/discord.svg", kategori: "Mesajlaşma", aciklama: "Web kancası ya da bot ile mesaj ve gömülü kart", belge: "https://discord.com/developers/docs/resources/webhook",
    sirlar: [{ ad: "DISCORD_WEBHOOK_URL", etiket: "Web kancası adresi", nasil: "Kanal ayarları, Entegrasyonlar, Web kancaları bölümünde yeni web kancası oluşturup adresini kopyala." }, { ad: "DISCORD_BOT_TOKEN", etiket: "Bot belirteci", nasil: "discord.com/developers/applications, Bot sekmesi, Reset Token; botu sunucuya ekle.", istege: true }],
    eylemler: [
      { id: "mesaj", ad: "Kanala mesaj gönder", aciklama: "En çok 2000 karakter", sirlar: ["DISCORD_WEBHOOK_URL"], alanlar: [MESAJ, { ad: "kullanici", etiket: "Görünen ad (isteğe bağlı)", yer: "Vayra" }],
        istek: (g, s) => ({ yontem: "POST", url: `${s("DISCORD_WEBHOOK_URL")}${s("DISCORD_WEBHOOK_URL").includes("?") ? "&" : "?"}wait=true`, json: dolu({ content: zorunlu(g, "metin", "Mesaj").slice(0, 2000), username: t(g.kullanici) }) }) },
      { id: "kart", ad: "Gömülü kart gönder", aciklama: "Başlık, açıklama, renk ve bağlantıyla", sirlar: ["DISCORD_WEBHOOK_URL"], alanlar: [{ ad: "baslik", etiket: "Başlık", zorunlu: true }, { ad: "aciklama", etiket: "Açıklama", tur: "uzunMetin" }, { ad: "adres", etiket: "Bağlantı" }, { ad: "renk", etiket: "Renk (onaltılık)", yer: "55d6fd", varsayilan: "55d6fd" }, { ad: "gorsel", etiket: "Görsel adresi" }],
        istek: (g, s) => ({ yontem: "POST", url: `${s("DISCORD_WEBHOOK_URL")}${s("DISCORD_WEBHOOK_URL").includes("?") ? "&" : "?"}wait=true`, json: { embeds: [dolu({ title: zorunlu(g, "baslik", "Başlık").slice(0, 256), description: t(g.aciklama).slice(0, 4096), url: t(g.adres), color: parseInt((t(g.renk) || "55d6fd").replace("#", ""), 16) || 0x55d6fd, image: t(g.gorsel) ? { url: t(g.gorsel) } : undefined })] } }) },
      { id: "bot", ad: "Bot olarak mesaj gönder", aciklama: "Kanal kimliğine bot belirteciyle", sirlar: ["DISCORD_BOT_TOKEN"], alanlar: [{ ad: "kanal", etiket: "Kanal kimliği", zorunlu: true }, MESAJ],
        istek: (g, s) => ({ yontem: "POST", url: `https://discord.com/api/v10/channels/${enc(zorunlu(g, "kanal", "Kanal kimliği"))}/messages`, basliklar: { Authorization: `Bot ${s("DISCORD_BOT_TOKEN")}` }, json: { content: zorunlu(g, "metin", "Mesaj").slice(0, 2000) } }) },
    ],
  },
  {
    id: "telegram", ad: "Telegram", logo: "/marka/telegram.svg", kategori: "Mesajlaşma", aciklama: "Mesaj, görsel, belge, düğmeli mesaj ve konum", belge: "https://core.telegram.org/bots/api",
    sirlar: [{ ad: "TELEGRAM_BOT_TOKEN", etiket: "Bot belirteci", nasil: "Telegram'da @BotFather ile /newbot yaz; verdiği 123456:ABC biçimindeki belirteci kopyala." }],
    eylemler: [
      { id: "mesaj", ad: "Mesaj gönder", aciklama: "Kişiye, gruba ya da kanala", sirlar: ["TELEGRAM_BOT_TOKEN"], alanlar: [TG_SOHBET, MESAJ, { ad: "bicim", etiket: "Biçim", tur: "secim", secenekler: [{ id: "duz", ad: "Düz metin" }, { id: "HTML", ad: "HTML" }, { id: "MarkdownV2", ad: "Markdown" }] }],
        istek: (g, s) => tg(s, "sendMessage", { chat_id: zorunlu(g, "sohbet", "Sohbet kimliği"), text: zorunlu(g, "metin", "Mesaj"), ...(t(g.bicim) && t(g.bicim) !== "duz" ? { parse_mode: t(g.bicim) } : {}) }), sonuc: tgSonuc },
      { id: "gorsel", ad: "Görsel gönder", aciklama: "Görsel adresi ve açıklamayla", sirlar: ["TELEGRAM_BOT_TOKEN"], alanlar: [TG_SOHBET, { ad: "gorsel", etiket: "Görsel adresi", zorunlu: true, yer: "https://… ya da / ile üretilen görsel" }, { ad: "aciklama", etiket: "Açıklama", tur: "uzunMetin" }],
        istek: (g, s) => tg(s, "sendPhoto", dolu({ chat_id: zorunlu(g, "sohbet", "Sohbet kimliği"), photo: zorunlu(g, "gorsel", "Görsel adresi"), caption: t(g.aciklama).slice(0, 1024) })), sonuc: tgSonuc },
      { id: "belge", ad: "Belge gönder", aciklama: "PDF ya da dosya adresiyle", sirlar: ["TELEGRAM_BOT_TOKEN"], alanlar: [TG_SOHBET, { ad: "belge", etiket: "Dosya adresi", zorunlu: true }, { ad: "aciklama", etiket: "Açıklama" }],
        istek: (g, s) => tg(s, "sendDocument", dolu({ chat_id: zorunlu(g, "sohbet", "Sohbet kimliği"), document: zorunlu(g, "belge", "Dosya adresi"), caption: t(g.aciklama).slice(0, 1024) })), sonuc: tgSonuc },
      { id: "dugmeli", ad: "Düğmeli mesaj gönder", aciklama: "Bağlantı düğmeleriyle (satır başına bir düğme)", sirlar: ["TELEGRAM_BOT_TOKEN"], alanlar: [TG_SOHBET, MESAJ, { ad: "dugmeler", etiket: "Düğmeler (her satır: Ad | adres)", tur: "uzunMetin", zorunlu: true, yer: "Siparişimi gör | https://magazan.com/siparis" }],
        istek: (g, s) => tg(s, "sendMessage", { chat_id: zorunlu(g, "sohbet", "Sohbet kimliği"), text: zorunlu(g, "metin", "Mesaj"), reply_markup: { inline_keyboard: m(g.dugmeler).split("\n").map((x) => x.split("|").map((y) => y.trim())).filter((x) => x[0] && x[1]).slice(0, 10).map(([text, url]) => [{ text, url }]) } }), sonuc: tgSonuc },
      { id: "duzenle", ad: "Mesajı düzenle", aciklama: "Gönderilen mesajın metnini değiştir", sirlar: ["TELEGRAM_BOT_TOKEN"], alanlar: [TG_SOHBET, { ad: "mesaj", etiket: "Mesaj kimliği", zorunlu: true, yer: "/ ile result.message_id" }, MESAJ],
        istek: (g, s) => tg(s, "editMessageText", { chat_id: zorunlu(g, "sohbet", "Sohbet kimliği"), message_id: Number(zorunlu(g, "mesaj", "Mesaj kimliği")), text: zorunlu(g, "metin", "Mesaj") }), sonuc: tgSonuc },
      { id: "konum", ad: "Konum gönder", aciklama: "Enlem ve boylamla", sirlar: ["TELEGRAM_BOT_TOKEN"], alanlar: [TG_SOHBET, { ad: "enlem", etiket: "Enlem", zorunlu: true, yer: "41.0082" }, { ad: "boylam", etiket: "Boylam", zorunlu: true, yer: "28.9784" }],
        istek: (g, s) => tg(s, "sendLocation", { chat_id: zorunlu(g, "sohbet", "Sohbet kimliği"), latitude: Number(zorunlu(g, "enlem", "Enlem")), longitude: Number(zorunlu(g, "boylam", "Boylam")) }), sonuc: tgSonuc },
    ],
  },
  {
    id: "whatsapp", ad: "WhatsApp Business", logo: "/marka/whatsapp.svg", kategori: "Mesajlaşma", aciklama: "Metin, şablon, görsel, belge ve düğmeli mesaj", belge: "https://developers.facebook.com/docs/whatsapp/cloud-api/messages",
    sirlar: [{ ad: "WHATSAPP_TOKEN", etiket: "Erişim belirteci", nasil: "Meta geliştirici panelinde WhatsApp, API Setup bölümünden kalıcı sistem kullanıcısı belirteci al." }, { ad: "WHATSAPP_PHONE_ID", etiket: "Telefon numarası kimliği", nasil: "Aynı sayfadaki Phone number ID değeri." }],
    eylemler: [
      { id: "metin", ad: "Metin mesajı gönder", aciklama: "Son 24 saatte yazan müşteriye", sirlar: WA, alanlar: [{ ad: "telefon", etiket: "Alıcı telefon", zorunlu: true, yer: "905321234567" }, MESAJ],
        istek: (g, s) => wa(s, { to: waNo(g), type: "text", text: { body: zorunlu(g, "metin", "Mesaj") } }), sonuc: ozetAl("messages.0.id") },
      { id: "sablon", ad: "Şablon mesajı gönder", aciklama: "Onaylı şablonla, 24 saat sınırı olmadan", sirlar: WA, alanlar: [{ ad: "telefon", etiket: "Alıcı telefon", zorunlu: true, yer: "905321234567" }, { ad: "sablon", etiket: "Şablon adı", zorunlu: true, yer: "siparis_onay" }, { ad: "dil", etiket: "Dil kodu", yer: "tr", varsayilan: "tr" }, { ad: "degiskenler", etiket: "Gövde değişkenleri (virgülle)", yer: "Ayşe, 1.250 TL" }],
        istek: (g, s) => { const d = virgul(g.degiskenler); return wa(s, { to: waNo(g), type: "template", template: { name: zorunlu(g, "sablon", "Şablon adı"), language: { code: t(g.dil) || "tr" }, ...(d.length ? { components: [{ type: "body", parameters: d.map((text) => ({ type: "text", text })) }] } : {}) } }); }, sonuc: ozetAl("messages.0.id") },
      { id: "gorsel", ad: "Görsel gönder", aciklama: "Görsel adresi ve açıklamayla", sirlar: WA, alanlar: [{ ad: "telefon", etiket: "Alıcı telefon", zorunlu: true }, { ad: "gorsel", etiket: "Görsel adresi", zorunlu: true }, { ad: "aciklama", etiket: "Açıklama" }],
        istek: (g, s) => wa(s, { to: waNo(g), type: "image", image: dolu({ link: zorunlu(g, "gorsel", "Görsel adresi"), caption: t(g.aciklama) }) }), sonuc: ozetAl("messages.0.id") },
      { id: "belge", ad: "Belge gönder", aciklama: "Fatura ya da PDF adresiyle", sirlar: WA, alanlar: [{ ad: "telefon", etiket: "Alıcı telefon", zorunlu: true }, { ad: "belge", etiket: "Dosya adresi", zorunlu: true }, { ad: "dosyaAdi", etiket: "Dosya adı", yer: "fatura.pdf" }, { ad: "aciklama", etiket: "Açıklama" }],
        istek: (g, s) => wa(s, { to: waNo(g), type: "document", document: dolu({ link: zorunlu(g, "belge", "Dosya adresi"), filename: t(g.dosyaAdi), caption: t(g.aciklama) }) }), sonuc: ozetAl("messages.0.id") },
      { id: "dugmeli", ad: "Düğmeli mesaj gönder", aciklama: "En çok 3 yanıt düğmesi", sirlar: WA, alanlar: [{ ad: "telefon", etiket: "Alıcı telefon", zorunlu: true }, MESAJ, { ad: "dugmeler", etiket: "Düğmeler (virgülle, en çok 3)", zorunlu: true, yer: "Onayla, İptal et" }],
        istek: (g, s) => wa(s, { to: waNo(g), type: "interactive", interactive: { type: "button", body: { text: zorunlu(g, "metin", "Mesaj") }, action: { buttons: virgul(zorunlu(g, "dugmeler", "Düğmeler")).slice(0, 3).map((x, i) => ({ type: "reply", reply: { id: `d${i + 1}`, title: x.slice(0, 20) } })) } } }), sonuc: ozetAl("messages.0.id") },
      { id: "okundu", ad: "Mesajı okundu işaretle", aciklama: "Gelen mesajın mavi tikini yakar", sirlar: WA, alanlar: [{ ad: "mesaj", etiket: "Gelen mesaj kimliği (wamid)", zorunlu: true }],
        istek: (g, s) => wa(s, { status: "read", message_id: zorunlu(g, "mesaj", "Mesaj kimliği") }) },
    ],
  },
  {
    id: "google-chat", ad: "Google Chat", logo: "/marka/baglanti/google-chat.svg", kategori: "Mesajlaşma", aciklama: "Alana mesaj ve kart", belge: "https://developers.google.com/workspace/chat/quickstart/webhooks",
    sirlar: [{ ad: "GOOGLE_CHAT_WEBHOOK_URL", etiket: "Web kancası adresi", nasil: "Alan ayarlarında Uygulamalar ve entegrasyonlar, Web kancaları bölümünden adres oluştur." }],
    eylemler: [
      { id: "mesaj", ad: "Alana mesaj gönder", aciklama: "Düz metin", sirlar: ["GOOGLE_CHAT_WEBHOOK_URL"], alanlar: [MESAJ], istek: (g, s) => ({ yontem: "POST", url: s("GOOGLE_CHAT_WEBHOOK_URL"), json: { text: zorunlu(g, "metin", "Mesaj") } }) },
      { id: "kart", ad: "Kart gönder", aciklama: "Başlık, metin ve bağlantı düğmesi", sirlar: ["GOOGLE_CHAT_WEBHOOK_URL"], alanlar: [{ ad: "baslik", etiket: "Başlık", zorunlu: true }, { ad: "metin", etiket: "Metin", tur: "uzunMetin", zorunlu: true }, { ad: "dugme", etiket: "Düğme adı" }, { ad: "adres", etiket: "Düğme adresi" }],
        istek: (g, s) => ({ yontem: "POST", url: s("GOOGLE_CHAT_WEBHOOK_URL"), json: { cardsV2: [{ cardId: "vayra", card: { header: { title: zorunlu(g, "baslik", "Başlık") }, sections: [{ widgets: [{ textParagraph: { text: zorunlu(g, "metin", "Metin") } }, ...(t(g.dugme) && t(g.adres) ? [{ buttonList: { buttons: [{ text: t(g.dugme), onClick: { openLink: { url: t(g.adres) } } }] } }] : [])] }] } }] } }) },
    ],
  },
  {
    id: "teams", ad: "Microsoft Teams", logo: "/marka/renkli/microsoft-teams.svg", kategori: "Mesajlaşma", aciklama: "Kanala mesaj ve kart (iş akışı web kancası)", belge: "https://learn.microsoft.com/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook",
    sirlar: [{ ad: "TEAMS_WEBHOOK_URL", etiket: "İş akışı web kancası adresi", nasil: "Teams kanalında Workflows, \"Post to a channel when a webhook request is received\" şablonuyla akış kur; verdiği adresi kopyala." }],
    eylemler: [
      { id: "mesaj", ad: "Kanala mesaj gönder", aciklama: "Uyarlanabilir kart içinde metin", sirlar: ["TEAMS_WEBHOOK_URL"], alanlar: [MESAJ],
        istek: (g, s) => ({ yontem: "POST", url: s("TEAMS_WEBHOOK_URL"), json: { type: "message", attachments: [{ contentType: "application/vnd.microsoft.card.adaptive", content: { $schema: "http://adaptivecards.io/schemas/adaptive-card.json", type: "AdaptiveCard", version: "1.4", body: [{ type: "TextBlock", text: zorunlu(g, "metin", "Mesaj"), wrap: true }] } }] }, yanit: "metin" }) },
      { id: "kart", ad: "Kart gönder", aciklama: "Başlık, ayrıntı ve bağlantı düğmesi", sirlar: ["TEAMS_WEBHOOK_URL"], alanlar: [{ ad: "baslik", etiket: "Başlık", zorunlu: true }, { ad: "metin", etiket: "Metin", tur: "uzunMetin" }, { ad: "dugme", etiket: "Düğme adı" }, { ad: "adres", etiket: "Düğme adresi" }],
        istek: (g, s) => ({ yontem: "POST", url: s("TEAMS_WEBHOOK_URL"), json: { type: "message", attachments: [{ contentType: "application/vnd.microsoft.card.adaptive", content: { $schema: "http://adaptivecards.io/schemas/adaptive-card.json", type: "AdaptiveCard", version: "1.4", body: [{ type: "TextBlock", text: zorunlu(g, "baslik", "Başlık"), weight: "Bolder", size: "Medium", wrap: true }, ...(t(g.metin) ? [{ type: "TextBlock", text: t(g.metin), wrap: true }] : [])], ...(t(g.dugme) && t(g.adres) ? { actions: [{ type: "Action.OpenUrl", title: t(g.dugme), url: t(g.adres) }] } : {}) } }] }, yanit: "metin" }) },
    ],
  },
  {
    id: "twilio", ad: "Twilio", logo: "/marka/twilio_alt.svg", kategori: "SMS", aciklama: "SMS, WhatsApp, sesli arama ve doğrulama kodu", belge: "https://www.twilio.com/docs/messaging/api/message-resource",
    sirlar: [{ ad: "TWILIO_ACCOUNT_SID", etiket: "Hesap kimliği", nasil: "Twilio konsolunun ana sayfasındaki Account SID." }, { ad: "TWILIO_AUTH_TOKEN", etiket: "Yetki belirteci", nasil: "Aynı sayfadaki Auth Token." }, { ad: "TWILIO_VERIFY_SID", etiket: "Verify hizmet kimliği", nasil: "Konsolda Verify, Services; VA ile başlayan kimlik (yalnız doğrulama eylemleri için).", istege: true }],
    eylemler: [
      { id: "sms", ad: "SMS gönder", aciklama: "Twilio numarasından", sirlar: TW, alanlar: [{ ad: "gonderen", etiket: "Gönderen numara", zorunlu: true, yer: "+15005550006" }, { ad: "alici", etiket: "Alıcı numara", zorunlu: true, yer: "+905321234567" }, MESAJ],
        istek: (g, s) => ({ yontem: "POST", url: `https://api.twilio.com/2010-04-01/Accounts/${enc(s("TWILIO_ACCOUNT_SID"))}/Messages.json`, basliklar: twA(s), form: { From: zorunlu(g, "gonderen", "Gönderen numara"), To: zorunlu(g, "alici", "Alıcı numara"), Body: zorunlu(g, "metin", "Mesaj") } }), sonuc: ozetAl("sid") },
      { id: "whatsapp", ad: "WhatsApp mesajı gönder", aciklama: "Twilio WhatsApp göndericisinden", sirlar: TW, alanlar: [{ ad: "gonderen", etiket: "Gönderen numara", zorunlu: true, yer: "+14155238886" }, { ad: "alici", etiket: "Alıcı numara", zorunlu: true, yer: "+905321234567" }, MESAJ],
        istek: (g, s) => ({ yontem: "POST", url: `https://api.twilio.com/2010-04-01/Accounts/${enc(s("TWILIO_ACCOUNT_SID"))}/Messages.json`, basliklar: twA(s), form: { From: `whatsapp:${telefon(zorunlu(g, "gonderen", "Gönderen"))}`, To: `whatsapp:${telefon(zorunlu(g, "alici", "Alıcı"))}`, Body: zorunlu(g, "metin", "Mesaj") } }), sonuc: ozetAl("sid") },
      { id: "arama", ad: "Sesli arama başlat", aciklama: "Aranan kişiye metni sesli okur", sirlar: TW, alanlar: [{ ad: "gonderen", etiket: "Arayan numara", zorunlu: true }, { ad: "alici", etiket: "Aranan numara", zorunlu: true }, { ad: "metin", etiket: "Okunacak metin", tur: "uzunMetin", zorunlu: true }, { ad: "dil", etiket: "Dil", yer: "tr-TR", varsayilan: "tr-TR" }],
        istek: (g, s) => ({ yontem: "POST", url: `https://api.twilio.com/2010-04-01/Accounts/${enc(s("TWILIO_ACCOUNT_SID"))}/Calls.json`, basliklar: twA(s), form: { From: zorunlu(g, "gonderen", "Arayan"), To: zorunlu(g, "alici", "Aranan"), Twiml: `<Response><Say language="${(t(g.dil) || "tr-TR").replace(/[^\w-]/g, "")}">${zorunlu(g, "metin", "Metin").replace(/[<>&]/g, " ")}</Say></Response>` } }), sonuc: ozetAl("sid") },
      { id: "dogrulama", ad: "Doğrulama kodu gönder", aciklama: "Twilio Verify ile SMS kodu", sirlar: [...TW, "TWILIO_VERIFY_SID"], alanlar: [{ ad: "alici", etiket: "Telefon", zorunlu: true, yer: "+905321234567" }, { ad: "kanal", etiket: "Kanal", tur: "secim", secenekler: [{ id: "sms", ad: "SMS" }, { id: "whatsapp", ad: "WhatsApp" }, { id: "call", ad: "Arama" }, { id: "email", ad: "E-posta" }], varsayilan: "sms" }],
        istek: (g, s) => ({ yontem: "POST", url: `https://verify.twilio.com/v2/Services/${enc(s("TWILIO_VERIFY_SID"))}/Verifications`, basliklar: twA(s), form: { To: zorunlu(g, "alici", "Telefon"), Channel: t(g.kanal) || "sms" } }), sonuc: ozetAl("status") },
      { id: "dogrula", ad: "Kodu denetle", aciklama: "Girilen kod doğru mu", sirlar: [...TW, "TWILIO_VERIFY_SID"], alanlar: [{ ad: "alici", etiket: "Telefon", zorunlu: true }, { ad: "kod", etiket: "Kod", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: `https://verify.twilio.com/v2/Services/${enc(s("TWILIO_VERIFY_SID"))}/VerificationCheck`, basliklar: twA(s), form: { To: zorunlu(g, "alici", "Telefon"), Code: zorunlu(g, "kod", "Kod") } }), sonuc: ozetAl("status") },
    ],
  },
  {
    id: "messenger", ad: "Messenger", logo: "/marka/renkli/messenger.svg", kategori: "Mesajlaşma", aciklama: "Facebook sayfası adına mesaj", belge: "https://developers.facebook.com/docs/messenger-platform/reference/send-api",
    sirlar: [{ ad: "FACEBOOK_PAGE_TOKEN", etiket: "Sayfa erişim belirteci", nasil: "Meta geliştirici panelinde uygulamana sayfayı bağla; pages_messaging izinli sayfa belirteci." }, { ad: "FACEBOOK_PAGE_ID", etiket: "Sayfa kimliği", nasil: "Sayfa ayarları, Sayfa bilgileri bölümündeki kimlik." }],
    eylemler: [
      { id: "mesaj", ad: "Mesaj gönder", aciklama: "Son 24 saatte yazan kişiye", sirlar: ["FACEBOOK_PAGE_TOKEN", "FACEBOOK_PAGE_ID"], alanlar: [{ ad: "kisi", etiket: "Kişi kimliği (PSID)", zorunlu: true }, MESAJ],
        istek: (g, s) => ({ yontem: "POST", url: `${GRAPH}/${enc(s("FACEBOOK_PAGE_ID"))}/messages`, basliklar: { Authorization: `Bearer ${s("FACEBOOK_PAGE_TOKEN")}` }, json: { recipient: { id: zorunlu(g, "kisi", "Kişi kimliği") }, messaging_type: "RESPONSE", message: { text: zorunlu(g, "metin", "Mesaj").slice(0, 2000) } } }), sonuc: ozetAl("message_id") },
    ],
  },
  {
    id: "mattermost", ad: "Mattermost", logo: "/marka/uyg/mattermost.svg", kategori: "Mesajlaşma", aciklama: "Kanala mesaj (gelen web kancası)", belge: "https://developers.mattermost.com/integrate/webhooks/incoming/",
    sirlar: [{ ad: "MATTERMOST_WEBHOOK_URL", etiket: "Gelen web kancası adresi", nasil: "Ana menü, Entegrasyonlar, Gelen web kancaları, Ekle." }],
    eylemler: [{ id: "mesaj", ad: "Kanala mesaj gönder", aciklama: "Markdown destekli", sirlar: ["MATTERMOST_WEBHOOK_URL"], alanlar: [MESAJ, { ad: "kullanici", etiket: "Görünen ad (isteğe bağlı)" }], istek: (g, s) => ({ yontem: "POST", url: s("MATTERMOST_WEBHOOK_URL"), json: dolu({ text: zorunlu(g, "metin", "Mesaj"), username: t(g.kullanici) }), yanit: "metin" }) }],
  },
  {
    id: "pushover", ad: "Pushover", logo: "/marka/uyg/pushover.png", kategori: "Bildirim", aciklama: "Telefona anlık bildirim", belge: "https://pushover.net/api",
    sirlar: [{ ad: "PUSHOVER_TOKEN", etiket: "Uygulama belirteci", nasil: "pushover.net, Your Applications, Create an Application." }, { ad: "PUSHOVER_USER", etiket: "Kullanıcı anahtarı", nasil: "pushover.net ana sayfasındaki User Key." }],
    eylemler: [{ id: "bildirim", ad: "Bildirim gönder", aciklama: "Başlık, öncelik ve bağlantıyla", sirlar: ["PUSHOVER_TOKEN", "PUSHOVER_USER"], alanlar: [MESAJ, { ad: "baslik", etiket: "Başlık" }, { ad: "adres", etiket: "Bağlantı" }, { ad: "oncelik", etiket: "Öncelik", tur: "secim", secenekler: [{ id: "-1", ad: "Sessiz" }, { id: "0", ad: "Normal" }, { id: "1", ad: "Yüksek" }], varsayilan: "0" }],
      istek: (g, s) => ({ yontem: "POST", url: "https://api.pushover.net/1/messages.json", form: dolu({ token: s("PUSHOVER_TOKEN"), user: s("PUSHOVER_USER"), message: zorunlu(g, "metin", "Mesaj").slice(0, 1024), title: t(g.baslik), url: t(g.adres), priority: t(g.oncelik) || "0" }) as Record<string, string> }), sonuc: (y) => ((y as { status?: number })?.status === 1 ? {} : { hata: m((y as { errors?: unknown })?.errors) }) }],
  },
  {
    id: "ntfy", ad: "ntfy", logo: "/marka/uyg/ntfy.svg", kategori: "Bildirim", aciklama: "Konuya anlık bildirim", belge: "https://docs.ntfy.sh/publish/",
    sirlar: [{ ad: "NTFY_SUNUCU", etiket: "Sunucu", nasil: "Boşsa https://ntfy.sh; kendi sunucunsa adresini yaz.", istege: true }, { ad: "NTFY_TOKEN", etiket: "Erişim belirteci", nasil: "Korumalı konu için tk_ ile başlayan belirteç; açık konuda gerekmez.", istege: true }],
    eylemler: [{ id: "bildirim", ad: "Bildirim gönder", aciklama: "Başlık, öncelik ve etiketlerle", sirlar: [], alanlar: [{ ad: "konu", etiket: "Konu", zorunlu: true, yer: "magaza-siparisler" }, MESAJ, { ad: "baslik", etiket: "Başlık" }, { ad: "oncelik", etiket: "Öncelik", tur: "secim", secenekler: [{ id: "1", ad: "En düşük" }, { id: "3", ad: "Normal" }, { id: "5", ad: "Acil" }], varsayilan: "3" }, { ad: "etiketler", etiket: "Etiketler (virgülle)", yer: "tada, para" }],
      istek: (g, s) => ({ yontem: "POST", url: `${siteKoku(s("NTFY_SUNUCU") || "https://ntfy.sh")}/${enc(zorunlu(g, "konu", "Konu"))}`, metin: zorunlu(g, "metin", "Mesaj"), tur: "text/plain; charset=utf-8", basliklar: dolu({ Title: t(g.baslik) ? encodeURIComponent(t(g.baslik)) : undefined, Priority: t(g.oncelik) || "3", Tags: virgul(g.etiketler).join(","), Authorization: s("NTFY_TOKEN") ? `Bearer ${s("NTFY_TOKEN")}` : undefined }) as Record<string, string> }) }],
  },
  {
    id: "onesignal", ad: "OneSignal", logo: "/marka/baglanti/onesignal.svg", kategori: "Bildirim", aciklama: "Web ve mobil anlık bildirim", belge: "https://documentation.onesignal.com/reference/push-notification",
    sirlar: [{ ad: "ONESIGNAL_APP_ID", etiket: "Uygulama kimliği", nasil: "OneSignal, Settings, Keys & IDs, App ID." }, { ad: "ONESIGNAL_API_KEY", etiket: "REST API anahtarı", nasil: "Aynı sayfadaki App API Key." }],
    eylemler: [{ id: "bildirim", ad: "Bildirim gönder", aciklama: "Segmente ya da harici kullanıcı kimliğine", sirlar: ["ONESIGNAL_APP_ID", "ONESIGNAL_API_KEY"], alanlar: [{ ad: "baslik", etiket: "Başlık" }, MESAJ, { ad: "kullanici", etiket: "Harici kullanıcı kimlikleri (virgülle, boşsa herkes)" }, { ad: "adres", etiket: "Tıklayınca açılacak adres" }],
      istek: (g, s) => { const k = virgul(g.kullanici); return { yontem: "POST", url: "https://api.onesignal.com/notifications", basliklar: { Authorization: `Key ${s("ONESIGNAL_API_KEY")}` }, json: dolu({ app_id: s("ONESIGNAL_APP_ID"), target_channel: "push", contents: { en: zorunlu(g, "metin", "Mesaj"), tr: zorunlu(g, "metin", "Mesaj") }, headings: t(g.baslik) ? { en: t(g.baslik), tr: t(g.baslik) } : undefined, url: t(g.adres), ...(k.length ? { include_aliases: { external_id: k } } : { included_segments: ["Total Subscriptions"] }) }) }; }, sonuc: ozetAl("id") }],
  },
  {
    id: "resend", ad: "Resend", logo: "/marka/baglanti/resend.svg", koyu: true, kategori: "E-posta", aciklama: "İşlem e-postası gönder, zamanla ve durumunu getir", belge: "https://resend.com/docs/api-reference/emails/send-email",
    sirlar: [{ ad: "RESEND_API_KEY", etiket: "API anahtarı", nasil: "resend.com, API Keys bölümünden re_ ile başlayan anahtar; gönderen alan adını Domains bölümünde doğrula." }],
    baglanti: [{ katalog: "resend", esle: { RESEND_API_KEY: "anahtar" } }],
    eylemler: [
      { id: "eposta", ad: "E-posta gönder", aciklama: "HTML ya da düz metin, isteğe bağlı zamanlı", sirlar: ["RESEND_API_KEY"], alanlar: [...EPOSTA_ALAN, { ad: "yanitla", etiket: "Yanıt adresi (isteğe bağlı)" }, { ad: "zaman", etiket: "Gönderim zamanı (isteğe bağlı)", yer: "2026-11-07T09:00:00+03:00 ya da in 1 hour" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.resend.com/emails", basliklar: { Authorization: `Bearer ${s("RESEND_API_KEY")}` }, json: { from: zorunlu(g, "gonderen", "Gönderen"), to: virgul(zorunlu(g, "alici", "Alıcı")), subject: zorunlu(g, "konu", "Konu"), ...icerik(zorunlu(g, "govde", "İçerik")), ...dolu({ reply_to: t(g.yanitla), scheduled_at: t(g.zaman) }) } }), sonuc: ozetAl("id") },
      { id: "durum", ad: "E-postanın durumunu getir", aciklama: "Teslim, açılma ve hata durumu", okuma: true, sirlar: ["RESEND_API_KEY"], alanlar: [{ ad: "eposta", etiket: "E-posta kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.resend.com/emails/${enc(zorunlu(g, "eposta", "E-posta kimliği"))}`, basliklar: { Authorization: `Bearer ${s("RESEND_API_KEY")}` } }), sonuc: ozetAl("last_event") },
    ],
  },
  {
    id: "sendgrid", ad: "SendGrid", logo: "/marka/renkli/sendgrid.svg", kategori: "E-posta", aciklama: "E-posta, dinamik şablon ve kişi listesi", belge: "https://www.twilio.com/docs/sendgrid/api-reference/mail-send/mail-send",
    sirlar: [{ ad: "SENDGRID_API_KEY", etiket: "API anahtarı", nasil: "SendGrid, Settings, API Keys; Mail Send ve Marketing izinli, SG. ile başlayan anahtar." }],
    eylemler: [
      { id: "eposta", ad: "E-posta gönder", aciklama: "HTML ya da düz metin", sirlar: ["SENDGRID_API_KEY"], alanlar: EPOSTA_ALAN,
        istek: (g, s) => { const v = zorunlu(g, "govde", "İçerik"); return { yontem: "POST", url: "https://api.sendgrid.com/v3/mail/send", basliklar: { Authorization: `Bearer ${s("SENDGRID_API_KEY")}` }, json: { personalizations: [{ to: virgul(zorunlu(g, "alici", "Alıcı")).map(adres) }], from: adres(zorunlu(g, "gonderen", "Gönderen")), subject: zorunlu(g, "konu", "Konu"), content: [{ type: /<[a-z][\s\S]*>/i.test(v) ? "text/html" : "text/plain", value: v }] }, yanit: "metin" }; } },
      { id: "sablon", ad: "Şablonla e-posta gönder", aciklama: "Dinamik şablon ve verileriyle", sirlar: ["SENDGRID_API_KEY"], alanlar: [{ ad: "gonderen", etiket: "Gönderen", zorunlu: true }, { ad: "alici", etiket: "Alıcı", zorunlu: true }, { ad: "sablon", etiket: "Şablon kimliği", zorunlu: true, yer: "d-…" }, { ad: "veri", etiket: "Şablon verisi (JSON)", tur: "json", yer: "{\"ad\": \"{{tetik.ad}}\"}" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.sendgrid.com/v3/mail/send", basliklar: { Authorization: `Bearer ${s("SENDGRID_API_KEY")}` }, json: { personalizations: [{ to: virgul(zorunlu(g, "alici", "Alıcı")).map(adres), dynamic_template_data: nesne(g.veri, "Şablon verisi") }], from: adres(zorunlu(g, "gonderen", "Gönderen")), template_id: zorunlu(g, "sablon", "Şablon kimliği") }, yanit: "metin" }) },
      { id: "kisi", ad: "Kişi ekle ya da güncelle", aciklama: "Pazarlama kişisi, isteğe bağlı listeye", sirlar: ["SENDGRID_API_KEY"], alanlar: [{ ad: "eposta", etiket: "E-posta", zorunlu: true }, { ad: "ad", etiket: "Ad" }, { ad: "soyad", etiket: "Soyad" }, { ad: "liste", etiket: "Liste kimlikleri (virgülle)" }],
        istek: (g, s) => ({ yontem: "PUT", url: "https://api.sendgrid.com/v3/marketing/contacts", basliklar: { Authorization: `Bearer ${s("SENDGRID_API_KEY")}` }, json: dolu({ list_ids: virgul(g.liste), contacts: [dolu({ email: zorunlu(g, "eposta", "E-posta"), first_name: t(g.ad), last_name: t(g.soyad) })] }) }), sonuc: ozetAl("job_id") },
    ],
  },
  {
    id: "mailgun", ad: "Mailgun", logo: "/marka/renkli/mailgun.svg", kategori: "E-posta", aciklama: "Alan adından e-posta gönder", belge: "https://documentation.mailgun.com/docs/mailgun/api-reference/send/mailgun/messages",
    sirlar: [{ ad: "MAILGUN_API_KEY", etiket: "API anahtarı", nasil: "Mailgun, API Security, Add new key." }, { ad: "MAILGUN_DOMAIN", etiket: "Gönderen alan adı", nasil: "Mailgun'da doğruladığın alan adı, ör. mg.alanadin.com." }, { ad: "MAILGUN_BOLGE", etiket: "Bölge", nasil: "AB sunucusu için eu yaz; boşsa ABD.", istege: true }],
    eylemler: [{ id: "eposta", ad: "E-posta gönder", aciklama: "HTML ya da düz metin, etiketle", sirlar: ["MAILGUN_API_KEY", "MAILGUN_DOMAIN"], alanlar: [...EPOSTA_ALAN, { ad: "etiket", etiket: "Etiket (isteğe bağlı)" }],
      istek: (g, s) => { const v = zorunlu(g, "govde", "İçerik"); return { yontem: "POST", url: `https://${s("MAILGUN_BOLGE") === "eu" ? "api.eu.mailgun.net" : "api.mailgun.net"}/v3/${enc(s("MAILGUN_DOMAIN"))}/messages`, basliklar: { Authorization: temel("api", s("MAILGUN_API_KEY")) }, form: dolu({ from: zorunlu(g, "gonderen", "Gönderen"), to: virgul(zorunlu(g, "alici", "Alıcı")).join(","), subject: zorunlu(g, "konu", "Konu"), ...(/<[a-z][\s\S]*>/i.test(v) ? { html: v } : { text: v }), "o:tag": t(g.etiket) }) as Record<string, string> }; }, sonuc: ozetAl("id") }],
  },
  {
    id: "postmark", ad: "Postmark", logo: "/marka/uyg/postmark.svg", kategori: "E-posta", aciklama: "İşlem e-postası ve şablonla gönderim", belge: "https://postmarkapp.com/developer/api/email-api",
    sirlar: [{ ad: "POSTMARK_TOKEN", etiket: "Sunucu belirteci", nasil: "Postmark sunucusu, API Tokens sekmesi." }],
    eylemler: [
      { id: "eposta", ad: "E-posta gönder", aciklama: "HTML ya da düz metin", sirlar: ["POSTMARK_TOKEN"], alanlar: [...EPOSTA_ALAN, { ad: "akis", etiket: "İleti akışı", yer: "outbound", varsayilan: "outbound" }],
        istek: (g, s) => { const v = zorunlu(g, "govde", "İçerik"); return { yontem: "POST", url: "https://api.postmarkapp.com/email", basliklar: { "X-Postmark-Server-Token": s("POSTMARK_TOKEN") }, json: { From: zorunlu(g, "gonderen", "Gönderen"), To: virgul(zorunlu(g, "alici", "Alıcı")).join(","), Subject: zorunlu(g, "konu", "Konu"), ...(/<[a-z][\s\S]*>/i.test(v) ? { HtmlBody: v } : { TextBody: v }), MessageStream: t(g.akis) || "outbound" } }; }, sonuc: (y) => { const o = y as { ErrorCode?: number; Message?: string; MessageID?: string }; return o?.ErrorCode ? { hata: `Postmark ${o.ErrorCode}: ${o.Message}` } : { ozet: o?.MessageID }; } },
      { id: "sablon", ad: "Şablonla e-posta gönder", aciklama: "Şablon takma adı ve modeliyle", sirlar: ["POSTMARK_TOKEN"], alanlar: [{ ad: "gonderen", etiket: "Gönderen", zorunlu: true }, { ad: "alici", etiket: "Alıcı", zorunlu: true }, { ad: "sablon", etiket: "Şablon takma adı", zorunlu: true, yer: "siparis-onay" }, { ad: "model", etiket: "Şablon modeli (JSON)", tur: "json" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.postmarkapp.com/email/withTemplate", basliklar: { "X-Postmark-Server-Token": s("POSTMARK_TOKEN") }, json: { From: zorunlu(g, "gonderen", "Gönderen"), To: zorunlu(g, "alici", "Alıcı"), TemplateAlias: zorunlu(g, "sablon", "Şablon"), TemplateModel: nesne(g.model, "Şablon modeli") } }), sonuc: (y) => { const o = y as { ErrorCode?: number; Message?: string; MessageID?: string }; return o?.ErrorCode ? { hata: `Postmark ${o.ErrorCode}: ${o.Message}` } : { ozet: o?.MessageID }; } },
    ],
  },
  {
    id: "brevo", ad: "Brevo", logo: "/marka/uyg/brevo.svg", kategori: "E-posta", aciklama: "İşlem e-postası ve kişi yönetimi", belge: "https://developers.brevo.com/reference/sendtransacemail",
    sirlar: [{ ad: "BREVO_API_KEY", etiket: "API anahtarı", nasil: "Brevo, SMTP & API, API Keys; xkeysib- ile başlayan anahtar." }],
    eylemler: [
      { id: "eposta", ad: "İşlem e-postası gönder", aciklama: "HTML içerik ya da şablon numarasıyla", sirlar: ["BREVO_API_KEY"], alanlar: [{ ad: "gonderen", etiket: "Gönderen", zorunlu: true, yer: "Mağaza <siparis@alanadin.com>" }, { ad: "alici", etiket: "Alıcı (virgülle)", zorunlu: true }, { ad: "konu", etiket: "Konu" }, { ad: "govde", etiket: "HTML içerik", tur: "uzunMetin" }, { ad: "sablon", etiket: "Şablon numarası (isteğe bağlı)", tur: "sayi" }, { ad: "degiskenler", etiket: "Şablon değişkenleri (JSON)", tur: "json" }],
        istek: (g, s) => { if (!t(g.govde) && !t(g.sablon)) throw new Error("İçerik ya da şablon numarası gerekli."); return { yontem: "POST", url: "https://api.brevo.com/v3/smtp/email", basliklar: { "api-key": s("BREVO_API_KEY") }, json: dolu({ sender: adres(zorunlu(g, "gonderen", "Gönderen")), to: virgul(zorunlu(g, "alici", "Alıcı")).map(adres), subject: t(g.konu), htmlContent: t(g.govde), templateId: t(g.sablon) ? Number(g.sablon) : undefined, params: t(g.degiskenler) ? nesne(g.degiskenler, "Değişkenler") : undefined }) }; }, sonuc: ozetAl("messageId") },
      { id: "kisi", ad: "Kişi oluştur ya da güncelle", aciklama: "Özellikler ve listelerle", sirlar: ["BREVO_API_KEY"], alanlar: [{ ad: "eposta", etiket: "E-posta", zorunlu: true }, { ad: "ozellikler", etiket: "Özellikler (JSON)", tur: "json", yer: "{\"FIRSTNAME\": \"Ayşe\"}" }, { ad: "listeler", etiket: "Liste numaraları (virgülle)" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.brevo.com/v3/contacts", basliklar: { "api-key": s("BREVO_API_KEY") }, json: dolu({ email: zorunlu(g, "eposta", "E-posta"), attributes: t(g.ozellikler) ? nesne(g.ozellikler, "Özellikler") : undefined, listIds: virgul(g.listeler).map(Number).filter(Number.isFinite), updateEnabled: true }) }) },
      { id: "listeden-cikar", ad: "Kişiyi listeden çıkar", aciklama: "Liste numarasıyla", sirlar: ["BREVO_API_KEY"], alanlar: [{ ad: "liste", etiket: "Liste numarası", zorunlu: true, tur: "sayi" }, { ad: "eposta", etiket: "E-posta", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: `https://api.brevo.com/v3/contacts/lists/${enc(zorunlu(g, "liste", "Liste"))}/contacts/remove`, basliklar: { "api-key": s("BREVO_API_KEY") }, json: { emails: [zorunlu(g, "eposta", "E-posta")] } }) },
    ],
  },
  {
    id: "mailchimp", ad: "Mailchimp", logo: "/marka/uyg/mailchimp.svg", kategori: "E-posta", aciklama: "Aboneyi ekle, etiketle ve olay kaydet", belge: "https://mailchimp.com/developer/marketing/api/list-members/",
    sirlar: [{ ad: "MAILCHIMP_API_KEY", etiket: "API anahtarı", nasil: "Mailchimp, Profile, Extras, API keys; -us21 gibi bir ekle biter." }],
    eylemler: [
      { id: "abone", ad: "Abone ekle ya da güncelle", aciklama: "Kitleye ekler; varsa günceller", sirlar: ["MAILCHIMP_API_KEY"], alanlar: [{ ad: "liste", etiket: "Kitle kimliği", zorunlu: true }, { ad: "eposta", etiket: "E-posta", zorunlu: true }, { ad: "ad", etiket: "Ad" }, { ad: "soyad", etiket: "Soyad" }, { ad: "durum", etiket: "Durum", tur: "secim", secenekler: [{ id: "subscribed", ad: "Abone" }, { id: "pending", ad: "Onay bekliyor" }, { id: "unsubscribed", ad: "Abonelikten çıktı" }], varsayilan: "subscribed" }],
        istek: (g, s) => ({ yontem: "PUT", url: mcUye(s, zorunlu(g, "liste", "Kitle"), zorunlu(g, "eposta", "E-posta")), basliklar: { Authorization: temel("vayra", s("MAILCHIMP_API_KEY")) }, json: dolu({ email_address: zorunlu(g, "eposta", "E-posta"), status_if_new: t(g.durum) || "subscribed", merge_fields: t(g.ad) || t(g.soyad) ? dolu({ FNAME: t(g.ad), LNAME: t(g.soyad) }) : undefined }) }), sonuc: ozetAl("status") },
      { id: "etiket", ad: "Aboneyi etiketle", aciklama: "Etiket ekle ya da kaldır", sirlar: ["MAILCHIMP_API_KEY"], alanlar: [{ ad: "liste", etiket: "Kitle kimliği", zorunlu: true }, { ad: "eposta", etiket: "E-posta", zorunlu: true }, { ad: "etiketler", etiket: "Etiketler (virgülle)", zorunlu: true }, { ad: "kaldir", etiket: "Kaldır", tur: "evet-hayir" }],
        istek: (g, s) => ({ yontem: "POST", url: `${mcUye(s, zorunlu(g, "liste", "Kitle"), zorunlu(g, "eposta", "E-posta"))}/tags`, basliklar: { Authorization: temel("vayra", s("MAILCHIMP_API_KEY")) }, json: { tags: virgul(zorunlu(g, "etiketler", "Etiketler")).map((name) => ({ name, status: evet(g.kaldir) ? "inactive" : "active" })) }, yanit: "metin" }) },
      { id: "olay", ad: "Olay kaydet", aciklama: "Aboneye özel olay (otomasyon tetiği)", sirlar: ["MAILCHIMP_API_KEY"], alanlar: [{ ad: "liste", etiket: "Kitle kimliği", zorunlu: true }, { ad: "eposta", etiket: "E-posta", zorunlu: true }, { ad: "olay", etiket: "Olay adı", zorunlu: true, yer: "siparis_verdi" }, { ad: "ozellikler", etiket: "Özellikler (JSON)", tur: "json" }],
        istek: (g, s) => ({ yontem: "POST", url: `${mcUye(s, zorunlu(g, "liste", "Kitle"), zorunlu(g, "eposta", "E-posta"))}/events`, basliklar: { Authorization: temel("vayra", s("MAILCHIMP_API_KEY")) }, json: dolu({ name: zorunlu(g, "olay", "Olay adı").replace(/[^\w-]/g, "_").slice(0, 30), properties: t(g.ozellikler) ? nesne(g.ozellikler, "Özellikler") : undefined }), yanit: "metin" }) },
    ],
  },
  {
    id: "mailerlite", ad: "MailerLite", logo: "/marka/baglanti/mailerlite.png", kategori: "E-posta", aciklama: "Abone ekle ya da güncelle", belge: "https://developers.mailerlite.com/docs/subscribers.html",
    sirlar: [{ ad: "MAILERLITE_TOKEN", etiket: "API belirteci", nasil: "MailerLite, Integrations, MailerLite API, Generate new token." }],
    eylemler: [{ id: "abone", ad: "Abone ekle ya da güncelle", aciklama: "Ad ve gruplarla", sirlar: ["MAILERLITE_TOKEN"], alanlar: [{ ad: "eposta", etiket: "E-posta", zorunlu: true }, { ad: "ad", etiket: "Ad" }, { ad: "gruplar", etiket: "Grup kimlikleri (virgülle)" }],
      istek: (g, s) => ({ yontem: "POST", url: "https://connect.mailerlite.com/api/subscribers", basliklar: { Authorization: `Bearer ${s("MAILERLITE_TOKEN")}` }, json: dolu({ email: zorunlu(g, "eposta", "E-posta"), fields: t(g.ad) ? { name: t(g.ad) } : undefined, groups: virgul(g.gruplar) }) }), sonuc: ozetAl("data.id") }],
  },
  {
    id: "klaviyo", ad: "Klaviyo", logo: "/marka/baglanti/klaviyo.png", kategori: "E-posta", aciklama: "Profil oluştur ve olay kaydet", belge: "https://developers.klaviyo.com/en/reference/api_overview",
    sirlar: [{ ad: "KLAVIYO_API_KEY", etiket: "Özel API anahtarı", nasil: "Klaviyo, Settings, API keys; pk_ ile başlayan özel anahtar." }],
    eylemler: [
      { id: "profil", ad: "Profil oluştur", aciklama: "E-posta, ad ve telefonla", sirlar: ["KLAVIYO_API_KEY"], alanlar: [{ ad: "eposta", etiket: "E-posta", zorunlu: true }, { ad: "ad", etiket: "Ad" }, { ad: "soyad", etiket: "Soyad" }, { ad: "telefon", etiket: "Telefon", yer: "+905321234567" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://a.klaviyo.com/api/profiles", basliklar: klB(s), metin: JSON.stringify({ data: { type: "profile", attributes: dolu({ email: zorunlu(g, "eposta", "E-posta"), first_name: t(g.ad), last_name: t(g.soyad), phone_number: t(g.telefon) }) } }), tur: "application/vnd.api+json" }), sonuc: ozetAl("data.id") },
      { id: "olay", ad: "Olay kaydet", aciklama: "Profil için metrik olayı (akışları tetikler)", sirlar: ["KLAVIYO_API_KEY"], alanlar: [{ ad: "eposta", etiket: "E-posta", zorunlu: true }, { ad: "olay", etiket: "Olay adı", zorunlu: true, yer: "Sipariş verdi" }, { ad: "ozellikler", etiket: "Özellikler (JSON)", tur: "json" }, { ad: "deger", etiket: "Değer (tutar)", tur: "sayi" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://a.klaviyo.com/api/events", basliklar: klB(s), metin: JSON.stringify({ data: { type: "event", attributes: dolu({ properties: nesne(g.ozellikler, "Özellikler"), value: t(g.deger) ? Number(g.deger) : undefined, metric: { data: { type: "metric", attributes: { name: zorunlu(g, "olay", "Olay adı") } } }, profile: { data: { type: "profile", attributes: { email: zorunlu(g, "eposta", "E-posta") } } } }) } }), tur: "application/vnd.api+json", yanit: "metin" }) },
    ],
  },
  {
    id: "kit", ad: "Kit", logo: "/marka/baglanti/kit.png", kategori: "E-posta", aciklama: "Abone ekle (eski adıyla ConvertKit)", belge: "https://developers.kit.com/api-reference/subscribers/create-a-subscriber",
    sirlar: [{ ad: "KIT_API_KEY", etiket: "API anahtarı (v4)", nasil: "Kit, Settings, Developer; v4 API anahtarı." }],
    eylemler: [{ id: "abone", ad: "Abone ekle", aciklama: "E-posta ve adla", sirlar: ["KIT_API_KEY"], alanlar: [{ ad: "eposta", etiket: "E-posta", zorunlu: true }, { ad: "ad", etiket: "Ad" }],
      istek: (g, s) => ({ yontem: "POST", url: "https://api.kit.com/v4/subscribers", basliklar: { "X-Kit-Api-Key": s("KIT_API_KEY") }, json: dolu({ email_address: zorunlu(g, "eposta", "E-posta"), first_name: t(g.ad) }) }), sonuc: ozetAl("subscriber.id") }],
  },
  {
    id: "facebook-sayfa", ad: "Facebook Sayfası", logo: "/marka/facebook.svg", kategori: "Sosyal medya", aciklama: "Sayfada gönderi ve görsel paylaş", belge: "https://developers.facebook.com/docs/pages-api/posts",
    sirlar: [{ ad: "FACEBOOK_PAGE_TOKEN", etiket: "Sayfa erişim belirteci", nasil: "pages_manage_posts izinli uzun ömürlü sayfa belirteci." }, { ad: "FACEBOOK_PAGE_ID", etiket: "Sayfa kimliği", nasil: "Sayfa ayarları, Sayfa bilgileri." }],
    eylemler: [
      { id: "gonderi", ad: "Gönderi paylaş", aciklama: "Metin ve isteğe bağlı bağlantı", sirlar: ["FACEBOOK_PAGE_TOKEN", "FACEBOOK_PAGE_ID"], alanlar: [MESAJ, { ad: "adres", etiket: "Bağlantı (isteğe bağlı)" }],
        istek: (g, s) => ({ yontem: "POST", url: `${GRAPH}/${enc(s("FACEBOOK_PAGE_ID"))}/feed`, basliklar: { Authorization: `Bearer ${s("FACEBOOK_PAGE_TOKEN")}` }, json: dolu({ message: zorunlu(g, "metin", "Mesaj"), link: t(g.adres) }) }), sonuc: ozetAl("id") },
      { id: "gorsel", ad: "Görsel paylaş", aciklama: "Görsel adresi ve açıklamayla", sirlar: ["FACEBOOK_PAGE_TOKEN", "FACEBOOK_PAGE_ID"], alanlar: [{ ad: "gorsel", etiket: "Görsel adresi", zorunlu: true }, { ad: "aciklama", etiket: "Açıklama", tur: "uzunMetin" }],
        istek: (g, s) => ({ yontem: "POST", url: `${GRAPH}/${enc(s("FACEBOOK_PAGE_ID"))}/photos`, basliklar: { Authorization: `Bearer ${s("FACEBOOK_PAGE_TOKEN")}` }, json: dolu({ url: zorunlu(g, "gorsel", "Görsel adresi"), caption: t(g.aciklama) }) }), sonuc: ozetAl("post_id") },
    ],
  },
  {
    id: "instagram", ad: "Instagram", logo: "/marka/renkli/instagram-color.svg", kategori: "Sosyal medya", aciklama: "İşletme hesabında görsel paylaş", belge: "https://developers.facebook.com/docs/instagram-platform/content-publishing",
    sirlar: [{ ad: "INSTAGRAM_TOKEN", etiket: "Erişim belirteci", nasil: "instagram_content_publish izinli, Facebook sayfasına bağlı işletme hesabının belirteci." }, { ad: "INSTAGRAM_HESAP_ID", etiket: "Instagram işletme hesabı kimliği", nasil: "Graph API Explorer'da sayfa?fields=instagram_business_account ile bulunur." }],
    eylemler: [
      { id: "gorsel", ad: "Görsel paylaş", aciklama: "Önce kap oluşturur, sonra yayınlar", sirlar: ["INSTAGRAM_TOKEN", "INSTAGRAM_HESAP_ID"], alanlar: [{ ad: "gorsel", etiket: "Görsel adresi (JPEG)", zorunlu: true }, { ad: "aciklama", etiket: "Açıklama", tur: "uzunMetin" }],
        istek: (g, s) => ({ yontem: "POST", url: `${GRAPH}/${enc(s("INSTAGRAM_HESAP_ID"))}/media`, basliklar: { Authorization: `Bearer ${s("INSTAGRAM_TOKEN")}` }, json: dolu({ image_url: zorunlu(g, "gorsel", "Görsel adresi"), caption: t(g.aciklama).slice(0, 2200) }) }),
        devam: (y, _g, s) => { const id = m((y as { id?: string })?.id); if (!id) throw new Error("Instagram kap kimliği vermedi."); return { yontem: "POST", url: `${GRAPH}/${enc(s("INSTAGRAM_HESAP_ID"))}/media_publish`, basliklar: { Authorization: `Bearer ${s("INSTAGRAM_TOKEN")}` }, json: { creation_id: id } }; }, sonuc: ozetAl("id") },
    ],
  },
  {
    id: "linkedin", ad: "LinkedIn", logo: "/marka/renkli/linkedin-color.svg", kategori: "Sosyal medya", aciklama: "Kişi ya da şirket sayfası adına gönderi", belge: "https://learn.microsoft.com/linkedin/marketing/community-management/shares/posts-api",
    sirlar: [{ ad: "LINKEDIN_TOKEN", etiket: "Erişim belirteci", nasil: "w_member_social ya da w_organization_social izinli OAuth belirteci (60 gün geçerli)." }, { ad: "LINKEDIN_YAZAR", etiket: "Yazar URN", nasil: "urn:li:person:… ya da urn:li:organization:… biçiminde." }],
    eylemler: [{ id: "gonderi", ad: "Gönderi paylaş", aciklama: "Herkese açık metin gönderisi", sirlar: ["LINKEDIN_TOKEN", "LINKEDIN_YAZAR"], alanlar: [MESAJ],
      istek: (g, s) => ({ yontem: "POST", url: "https://api.linkedin.com/rest/posts", basliklar: { Authorization: `Bearer ${s("LINKEDIN_TOKEN")}`, "LinkedIn-Version": LINKEDIN_SURUM, "X-Restli-Protocol-Version": "2.0.0" }, json: { author: s("LINKEDIN_YAZAR"), commentary: zorunlu(g, "metin", "Mesaj").slice(0, 3000), visibility: "PUBLIC", distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] }, lifecycleState: "PUBLISHED", isReshareDisabledByAuthor: false }, yanit: "metin" }) }],
  },
  {
    id: "bluesky", ad: "Bluesky", logo: "/marka/uyg/bluesky.svg", kategori: "Sosyal medya", aciklama: "Gönderi paylaş", belge: "https://docs.bsky.app/docs/advanced-guides/posts",
    sirlar: [{ ad: "BLUESKY_KULLANICI", etiket: "Kullanıcı adı", nasil: "ad.bsky.social biçiminde." }, { ad: "BLUESKY_UYGULAMA_SIFRESI", etiket: "Uygulama şifresi", nasil: "Ayarlar, Gizlilik ve güvenlik, Uygulama şifreleri." }],
    kimlik: { sirlar: ["BLUESKY_KULLANICI", "BLUESKY_UYGULAMA_SIFRESI"], istek: (s) => ({ yontem: "POST", url: "https://bsky.social/xrpc/com.atproto.server.createSession", json: { identifier: s("BLUESKY_KULLANICI"), password: s("BLUESKY_UYGULAMA_SIFRESI") } }), coz: (y) => { const o = y as { accessJwt?: string; did?: string }; if (!o?.accessJwt || !o.did) throw new Error("Bluesky oturum açmadı; kullanıcı adı ve uygulama şifresini denetle."); return { degerler: { _BSKY_ERISIM: o.accessJwt, _BSKY_DID: o.did }, omur: 60 * 60_000 }; } },
    eylemler: [{ id: "gonderi", ad: "Gönderi paylaş", aciklama: "En çok 300 karakter", sirlar: ["_BSKY_ERISIM", "_BSKY_DID"], alanlar: [MESAJ],
      istek: (g, s) => ({ yontem: "POST", url: "https://bsky.social/xrpc/com.atproto.repo.createRecord", basliklar: { Authorization: `Bearer ${s("_BSKY_ERISIM")}` }, json: { repo: s("_BSKY_DID"), collection: "app.bsky.feed.post", record: { $type: "app.bsky.feed.post", text: [...zorunlu(g, "metin", "Mesaj")].slice(0, 300).join(""), createdAt: new Date().toISOString(), langs: ["tr"] } } }), sonuc: ozetAl("uri") }],
  },
  {
    id: "mastodon", ad: "Mastodon", logo: "/marka/uyg/mastodon.svg", kategori: "Sosyal medya", aciklama: "Durum paylaş", belge: "https://docs.joinmastodon.org/methods/statuses/",
    sirlar: [{ ad: "MASTODON_SUNUCU", etiket: "Sunucu", nasil: "Hesabının sunucusu, ör. mastodon.social." }, { ad: "MASTODON_TOKEN", etiket: "Erişim belirteci", nasil: "Tercihler, Geliştirme, Yeni uygulama; write:statuses izni." }],
    eylemler: [{ id: "durum", ad: "Durum paylaş", aciklama: "Görünürlük seçimiyle", sirlar: ["MASTODON_SUNUCU", "MASTODON_TOKEN"], alanlar: [MESAJ, { ad: "gorunurluk", etiket: "Görünürlük", tur: "secim", secenekler: [{ id: "public", ad: "Herkese açık" }, { id: "unlisted", ad: "Listelenmemiş" }, { id: "private", ad: "Yalnız takipçiler" }], varsayilan: "public" }],
      istek: (g, s) => ({ yontem: "POST", url: `${siteKoku(s("MASTODON_SUNUCU"))}/api/v1/statuses`, basliklar: { Authorization: `Bearer ${s("MASTODON_TOKEN")}` }, json: { status: zorunlu(g, "metin", "Mesaj"), visibility: t(g.gorunurluk) || "public" } }), sonuc: ozetAl("url") }],
  },
  {
    id: "pinterest", ad: "Pinterest", logo: "/marka/pinterest.svg", kategori: "Sosyal medya", aciklama: "Panoya pin ekle", belge: "https://developers.pinterest.com/docs/api/v5/pins-create/",
    sirlar: [{ ad: "PINTEREST_TOKEN", etiket: "Erişim belirteci", nasil: "developers.pinterest.com uygulamasından pins:write ve boards:read izinli belirteç." }],
    eylemler: [{ id: "pin", ad: "Pin oluştur", aciklama: "Görsel adresi, başlık ve bağlantıyla", sirlar: ["PINTEREST_TOKEN"], alanlar: [{ ad: "pano", etiket: "Pano kimliği", zorunlu: true }, { ad: "gorsel", etiket: "Görsel adresi", zorunlu: true }, { ad: "baslik", etiket: "Başlık" }, { ad: "aciklama", etiket: "Açıklama" }, { ad: "adres", etiket: "Bağlantı" }],
      istek: (g, s) => ({ yontem: "POST", url: "https://api.pinterest.com/v5/pins", basliklar: { Authorization: `Bearer ${s("PINTEREST_TOKEN")}` }, json: dolu({ board_id: zorunlu(g, "pano", "Pano kimliği"), title: t(g.baslik).slice(0, 100), description: t(g.aciklama).slice(0, 800), link: t(g.adres), media_source: { source_type: "image_url", url: zorunlu(g, "gorsel", "Görsel adresi") } }) }), sonuc: ozetAl("id") }],
  },
  {
    id: "x", ad: "X", logo: "/marka/renkli/x-beyaz.svg", koyu: true, kategori: "Sosyal medya", aciklama: "Gönderi paylaş", belge: "https://docs.x.com/x-api/posts/creation-of-a-post",
    sirlar: [{ ad: "X_CLIENT_ID", etiket: "OAuth 2.0 Client ID", nasil: "developer.x.com, uygulamanın Keys and tokens bölümü." }, { ad: "X_CLIENT_SECRET", etiket: "OAuth 2.0 Client Secret", nasil: "Aynı bölüm (gizli istemci için).", istege: true }, { ad: "X_REFRESH_TOKEN", etiket: "Yenileme belirteci", nasil: "tweet.write ve offline.access izinli OAuth girişinden; her yenilemede Vayra yeni değeri bu sırra yazar." }],
    kimlik: { sirlar: ["X_CLIENT_ID", "X_REFRESH_TOKEN"], istek: (s) => ({ yontem: "POST", url: "https://api.x.com/2/oauth2/token", ...(s("X_CLIENT_SECRET") ? { basliklar: { Authorization: temel(s("X_CLIENT_ID"), s("X_CLIENT_SECRET")) } } : {}), form: { grant_type: "refresh_token", refresh_token: s("X_REFRESH_TOKEN"), client_id: s("X_CLIENT_ID") } }),
      coz: (y, s) => { const o = y as { access_token?: string; expires_in?: number; refresh_token?: string }; if (!o?.access_token) throw new Error("X belirteç vermedi; yeniden giriş gerekebilir."); return { degerler: { _X_ERISIM: o.access_token }, omur: (o.expires_in ?? 7200) * 1000, ...(o.refresh_token && o.refresh_token !== s("X_REFRESH_TOKEN") ? { yeniSirlar: { X_REFRESH_TOKEN: o.refresh_token } } : {}) }; } },
    eylemler: [{ id: "gonderi", ad: "Gönderi paylaş", aciklama: "Metin gönderisi", sirlar: ["_X_ERISIM"], alanlar: [MESAJ], istek: (g, s) => ({ yontem: "POST", url: "https://api.x.com/2/tweets", basliklar: { Authorization: `Bearer ${s("_X_ERISIM")}` }, json: { text: zorunlu(g, "metin", "Mesaj") } }), sonuc: ozetAl("data.id") }],
  },
];
void b64url; void liste; void tamsayi;
