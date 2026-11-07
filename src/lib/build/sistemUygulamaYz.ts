import { dolu, enc, liste, m, nesne, ozetAl, shaHex, siteKoku, sorgu, t, tamsayi, temel, virgul, zorunlu, type Sirlar, type UygAlan, type UygIstek, type Uygulama } from "./sistemUygulamaOrtak";

/**
 * Yapay zekâ, web, veri ve geliştirici servisleri. Kaynaklar: platform.openai.com/docs/api-reference,
 * docs.claude.com/en/api, ai.google.dev/api, docs.mistral.ai, api-docs.deepseek.com, console.groq.com/docs,
 * docs.perplexity.ai, docs.cohere.com/v2, replicate.com/docs, developers.deepl.com, docs.firecrawl.dev, docs.exa.ai,
 * docs.tavily.com, jina.ai/reader, docs.apify.com/api/v2, serpapi.com/search-api, hunter.io/api-documentation,
 * openweathermap.org/current, supabase.com/docs/guides/api, upstash.com/docs/redis/features/restapi,
 * developers.webflow.com, developer.wordpress.org/rest-api, posthog.com/docs/api, vercel.com/docs/deploy-hooks,
 * docs.netlify.com (build hooks), developer.pagerduty.com (Events API v2), cloudinary.com/documentation (imzalı yükleme).
 */
const ISTEM: UygAlan = { ad: "istem", etiket: "İstem", tur: "uzunMetin", zorunlu: true, yer: "Bu yorumu özetle: / ile veri seç" };
const SISTEM: UygAlan = { ad: "sistem", etiket: "Sistem talimatı (isteğe bağlı)", tur: "uzunMetin", yer: "Kısa ve Türkçe yanıt ver." };
const model = (vars: string, aciklama?: string): UygAlan => ({ ad: "model", etiket: "Model", yer: vars, varsayilan: vars, aciklama });
/** OpenAI uyumlu sohbet tamamlama (Mistral, DeepSeek, Groq, Perplexity). */
const sohbet = (url: string, anahtar: string, vars: string) => (g: Record<string, unknown>, s: Sirlar): UygIstek => ({ yontem: "POST", url, basliklar: { Authorization: `Bearer ${s(anahtar)}` }, json: { model: t(g.model) || vars, messages: [...(t(g.sistem) ? [{ role: "system", content: t(g.sistem) }] : []), { role: "user", content: zorunlu(g, "istem", "İstem") }] } });
const sohbetOzet = (y: unknown) => ({ ozet: m((y as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content).slice(0, 300) || undefined });
const sbUrl = (s: Sirlar, yol: string) => `${siteKoku(s("SUPABASE_URL"))}/rest/v1${yol}`;
const sbB = (s: Sirlar) => ({ apikey: s("SUPABASE_KEY"), Authorization: `Bearer ${s("SUPABASE_KEY")}` });
const sbSuzgec = (v: unknown) => t(v).replace(/^[?&]/, "");
const upstash = (s: Sirlar, komut: unknown[]): UygIstek => ({ yontem: "POST", url: siteKoku(s("UPSTASH_REDIS_REST_URL")), basliklar: { Authorization: `Bearer ${s("UPSTASH_REDIS_REST_TOKEN")}` }, json: komut.map((x) => (typeof x === "string" ? x : JSON.stringify(x))) });
const upSonuc = (y: unknown) => { const o = y as { result?: unknown; error?: string } | null; return o?.error ? { hata: `Upstash: ${o.error}` } : { ozet: o?.result === null ? "boş" : m(o?.result).slice(0, 200) }; };
const UP = ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"];
const wp = (s: Sirlar, yol: string) => `${siteKoku(s("WORDPRESS_SITE"))}/wp-json/wp/v2${yol}`;
const wpB = (s: Sirlar) => ({ Authorization: temel(s("WORDPRESS_KULLANICI"), s("WORDPRESS_UYGULAMA_SIFRESI").replace(/\s+/g, "")) });
const WPS = ["WORDPRESS_SITE", "WORDPRESS_KULLANICI", "WORDPRESS_UYGULAMA_SIFRESI"];
const WP_DURUM: UygAlan = { ad: "durum", etiket: "Durum", tur: "secim", secenekler: [{ id: "draft", ad: "Taslak" }, { id: "publish", ad: "Yayında" }, { id: "pending", ad: "İnceleme bekliyor" }], varsayilan: "draft" };
const wf = (s: Sirlar) => ({ Authorization: `Bearer ${s("WEBFLOW_TOKEN")}` });
const deepl = (s: Sirlar) => (s("DEEPL_API_KEY").endsWith(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com");
const fc = (s: Sirlar) => ({ Authorization: `Bearer ${s("FIRECRAWL_API_KEY")}` });

export const UYG_YZ: Uygulama[] = [
  {
    id: "openai", ad: "OpenAI", logo: "/marka/renkli/openai.svg", kategori: "Yapay zekâ", aciklama: "Metin üret, içerik denetle ve gömme vektörü çıkar", belge: "https://platform.openai.com/docs/api-reference/responses",
    sirlar: [{ ad: "OPENAI_API_KEY", etiket: "API anahtarı", nasil: "platform.openai.com, API keys; sk- ile başlayan anahtar." }],
    eylemler: [
      { id: "yanit", ad: "Metin üret", aciklama: "Responses API ile tek yanıt", sirlar: ["OPENAI_API_KEY"], alanlar: [ISTEM, SISTEM, model("gpt-5", "Hesabında açık olan model adı")],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.openai.com/v1/responses", basliklar: { Authorization: `Bearer ${s("OPENAI_API_KEY")}` }, json: dolu({ model: t(g.model) || "gpt-5", input: zorunlu(g, "istem", "İstem"), instructions: t(g.sistem) }) }),
        sonuc: (y) => { const o = y as { output_text?: string; output?: { content?: { type?: string; text?: string }[] }[] }; const metin = o?.output_text ?? (o?.output ?? []).flatMap((x) => x.content ?? []).filter((c) => c.type === "output_text").map((c) => c.text).join("\n"); return { ozet: m(metin).slice(0, 300) || undefined }; } },
      { id: "denetle", ad: "İçeriği denetle", aciklama: "Taciz, nefret, şiddet ve cinsellik sınıfları", okuma: true, sirlar: ["OPENAI_API_KEY"], alanlar: [{ ad: "metin", etiket: "Metin", tur: "uzunMetin", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.openai.com/v1/moderations", basliklar: { Authorization: `Bearer ${s("OPENAI_API_KEY")}` }, json: { model: "omni-moderation-latest", input: zorunlu(g, "metin", "Metin") } }), sonuc: (y) => ({ ozet: (y as { results?: { flagged?: boolean }[] })?.results?.[0]?.flagged ? "İşaretlendi" : "Temiz" }) },
      { id: "gomme", ad: "Gömme vektörü çıkar", aciklama: "Benzerlik araması için", okuma: true, sirlar: ["OPENAI_API_KEY"], alanlar: [{ ad: "metin", etiket: "Metin", tur: "uzunMetin", zorunlu: true }, model("text-embedding-3-small")],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.openai.com/v1/embeddings", basliklar: { Authorization: `Bearer ${s("OPENAI_API_KEY")}` }, json: { model: t(g.model) || "text-embedding-3-small", input: zorunlu(g, "metin", "Metin") } }), sonuc: (y) => ({ ozet: `${(y as { data?: { embedding?: unknown[] }[] })?.data?.[0]?.embedding?.length ?? 0} boyut` }) },
    ],
  },
  {
    id: "anthropic", ad: "Anthropic", logo: "/marka/anthropic.svg", kategori: "Yapay zekâ", aciklama: "Claude ile metin üret ve belirteç say", belge: "https://docs.claude.com/en/api/messages",
    sirlar: [{ ad: "ANTHROPIC_API_KEY", etiket: "API anahtarı", nasil: "console.anthropic.com, API Keys; sk-ant- ile başlayan anahtar." }],
    eylemler: [
      { id: "mesaj", ad: "Claude ile metin üret", aciklama: "Messages API ile tek yanıt", sirlar: ["ANTHROPIC_API_KEY"], alanlar: [ISTEM, SISTEM, model("claude-opus-5-5"), { ad: "uzunluk", etiket: "En çok çıktı belirteci", tur: "sayi", varsayilan: "16000", yer: "16000" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.anthropic.com/v1/messages", basliklar: { "x-api-key": s("ANTHROPIC_API_KEY"), "anthropic-version": "2023-06-01" }, json: dolu({ model: t(g.model) || "claude-opus-5-5", max_tokens: tamsayi(g.uzunluk, 16000, 1, 64000), system: t(g.sistem), messages: [{ role: "user", content: zorunlu(g, "istem", "İstem") }] }) }),
        sonuc: (y) => { const o = y as { stop_reason?: string; content?: { type: string; text?: string }[] }; if (o?.stop_reason === "refusal") return { hata: "Claude bu isteği yanıtlamadı (refusal)." }; return { ozet: (o?.content ?? []).filter((c) => c.type === "text").map((c) => c.text).join("\n").slice(0, 300) || undefined }; } },
      { id: "say", ad: "Belirteç say", aciklama: "İstemin kaç belirteç tuttuğu", okuma: true, sirlar: ["ANTHROPIC_API_KEY"], alanlar: [ISTEM, SISTEM, model("claude-opus-5-5")],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.anthropic.com/v1/messages/count_tokens", basliklar: { "x-api-key": s("ANTHROPIC_API_KEY"), "anthropic-version": "2023-06-01" }, json: dolu({ model: t(g.model) || "claude-opus-5-5", system: t(g.sistem), messages: [{ role: "user", content: zorunlu(g, "istem", "İstem") }] }) }), sonuc: ozetAl("input_tokens") },
    ],
  },
  {
    id: "gemini", ad: "Google Gemini", logo: "/marka/renkli/gemini-color.svg", kategori: "Yapay zekâ", aciklama: "Gemini ile metin üret", belge: "https://ai.google.dev/api/generate-content",
    sirlar: [{ ad: "GEMINI_API_KEY", etiket: "API anahtarı", nasil: "aistudio.google.com, Get API key." }],
    eylemler: [{ id: "uret", ad: "Metin üret", aciklama: "generateContent ile tek yanıt", sirlar: ["GEMINI_API_KEY"], alanlar: [ISTEM, SISTEM, model("gemini-2.5-flash")],
      istek: (g, s) => ({ yontem: "POST", url: `https://generativelanguage.googleapis.com/v1beta/models/${enc(t(g.model) || "gemini-2.5-flash")}:generateContent`, basliklar: { "x-goog-api-key": s("GEMINI_API_KEY") }, json: dolu({ contents: [{ role: "user", parts: [{ text: zorunlu(g, "istem", "İstem") }] }], systemInstruction: t(g.sistem) ? { parts: [{ text: t(g.sistem) }] } : undefined }) }),
      sonuc: (y) => ({ ozet: m((y as { candidates?: { content?: { parts?: { text?: string }[] } }[] })?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("")).slice(0, 300) || undefined }) }],
  },
  {
    id: "mistral", ad: "Mistral AI", logo: "/marka/renkli/mistral-color.svg", kategori: "Yapay zekâ", aciklama: "Mistral modelleriyle metin üret", belge: "https://docs.mistral.ai/api/",
    sirlar: [{ ad: "MISTRAL_API_KEY", etiket: "API anahtarı", nasil: "console.mistral.ai, API Keys." }],
    eylemler: [{ id: "uret", ad: "Metin üret", aciklama: "Sohbet tamamlama", sirlar: ["MISTRAL_API_KEY"], alanlar: [ISTEM, SISTEM, model("mistral-large-latest")], istek: sohbet("https://api.mistral.ai/v1/chat/completions", "MISTRAL_API_KEY", "mistral-large-latest"), sonuc: sohbetOzet }],
  },
  {
    id: "deepseek", ad: "DeepSeek", logo: "/marka/renkli/deepseek-color.svg", kategori: "Yapay zekâ", aciklama: "DeepSeek modelleriyle metin üret", belge: "https://api-docs.deepseek.com/api/create-chat-completion",
    sirlar: [{ ad: "DEEPSEEK_API_KEY", etiket: "API anahtarı", nasil: "platform.deepseek.com, API keys." }],
    eylemler: [{ id: "uret", ad: "Metin üret", aciklama: "Sohbet tamamlama", sirlar: ["DEEPSEEK_API_KEY"], alanlar: [ISTEM, SISTEM, model("deepseek-chat")], istek: sohbet("https://api.deepseek.com/chat/completions", "DEEPSEEK_API_KEY", "deepseek-chat"), sonuc: sohbetOzet }],
  },
  {
    id: "groq", ad: "Groq", logo: "/marka/uyg/groq.svg", kategori: "Yapay zekâ", aciklama: "Açık modelleri çok hızlı çalıştır", belge: "https://console.groq.com/docs/api-reference#chat-create",
    sirlar: [{ ad: "GROQ_API_KEY", etiket: "API anahtarı", nasil: "console.groq.com, API Keys; gsk_ ile başlar." }],
    eylemler: [{ id: "uret", ad: "Metin üret", aciklama: "Sohbet tamamlama", sirlar: ["GROQ_API_KEY"], alanlar: [ISTEM, SISTEM, model("llama-3.3-70b-versatile")], istek: sohbet("https://api.groq.com/openai/v1/chat/completions", "GROQ_API_KEY", "llama-3.3-70b-versatile"), sonuc: sohbetOzet }],
  },
  {
    id: "perplexity", ad: "Perplexity", logo: "/marka/uyg/perplexity.svg", kategori: "Yapay zekâ", aciklama: "Web kaynaklı yanıt", belge: "https://docs.perplexity.ai/api-reference/chat-completions-post",
    sirlar: [{ ad: "PERPLEXITY_API_KEY", etiket: "API anahtarı", nasil: "perplexity.ai, Settings, API; pplx- ile başlar." }],
    eylemler: [{ id: "sor", ad: "Web'de araştırıp yanıtla", aciklama: "Kaynak bağlantılarıyla", sirlar: ["PERPLEXITY_API_KEY"], alanlar: [ISTEM, SISTEM, model("sonar")], istek: sohbet("https://api.perplexity.ai/chat/completions", "PERPLEXITY_API_KEY", "sonar"), sonuc: sohbetOzet }],
  },
  {
    id: "cohere", ad: "Cohere", logo: "/marka/renkli/cohere-color.svg", kategori: "Yapay zekâ", aciklama: "Command modelleriyle metin üret", belge: "https://docs.cohere.com/reference/chat",
    sirlar: [{ ad: "COHERE_API_KEY", etiket: "API anahtarı", nasil: "dashboard.cohere.com, API keys." }],
    eylemler: [{ id: "uret", ad: "Metin üret", aciklama: "Chat v2", sirlar: ["COHERE_API_KEY"], alanlar: [ISTEM, SISTEM, model("command-a-03-2025")],
      istek: (g, s) => ({ yontem: "POST", url: "https://api.cohere.com/v2/chat", basliklar: { Authorization: `Bearer ${s("COHERE_API_KEY")}` }, json: { model: t(g.model) || "command-a-03-2025", messages: [...(t(g.sistem) ? [{ role: "system", content: t(g.sistem) }] : []), { role: "user", content: zorunlu(g, "istem", "İstem") }] } }),
      sonuc: (y) => ({ ozet: m((y as { message?: { content?: { text?: string }[] } })?.message?.content?.[0]?.text).slice(0, 300) || undefined }) }],
  },
  {
    id: "replicate", ad: "Replicate", logo: "/marka/uyg/replicate.svg", kategori: "Yapay zekâ", aciklama: "Açık kaynak bir modeli çalıştır", belge: "https://replicate.com/docs/reference/http#models.predictions.create",
    sirlar: [{ ad: "REPLICATE_API_TOKEN", etiket: "API belirteci", nasil: "replicate.com, Account, API tokens; r8_ ile başlar." }],
    eylemler: [{ id: "calistir", ad: "Modeli çalıştır", aciklama: "60 saniyeye kadar sonucu bekler", sirlar: ["REPLICATE_API_TOKEN"], alanlar: [{ ad: "model", etiket: "Model", zorunlu: true, yer: "black-forest-labs/flux-schnell" }, { ad: "girdi", etiket: "Girdi (JSON)", tur: "json", zorunlu: true, yer: "{\"prompt\": \"…\"}" }],
      istek: (g, s) => { const md = zorunlu(g, "model", "Model"); if (!/^[\w.-]+\/[\w.-]+$/.test(md)) throw new Error("Model sahip/ad biçiminde olmalı."); return { yontem: "POST", url: `https://api.replicate.com/v1/models/${md}/predictions`, basliklar: { Authorization: `Bearer ${s("REPLICATE_API_TOKEN")}`, Prefer: "wait=60" }, json: { input: nesne(g.girdi, "Girdi") } }; }, sonuc: (y) => { const o = y as { status?: string; error?: string; output?: unknown }; return o?.status === "failed" ? { hata: `Replicate: ${o.error ?? "çalışmadı"}` } : { ozet: m(Array.isArray(o?.output) ? o.output[0] : o?.output).slice(0, 300) || o?.status }; } }],
  },
  {
    id: "deepl", ad: "DeepL", logo: "/marka/baglanti/deepl.svg", kategori: "Yapay zekâ", aciklama: "Yüksek kaliteli çeviri", belge: "https://developers.deepl.com/api-reference/translate",
    sirlar: [{ ad: "DEEPL_API_KEY", etiket: "API anahtarı", nasil: "deepl.com, Hesap, API Keys; ücretsiz anahtar :fx ile biter." }],
    eylemler: [{ id: "cevir", ad: "Metni çevir", aciklama: "Kaynak dil kendiliğinden bulunur", sirlar: ["DEEPL_API_KEY"], alanlar: [{ ad: "metin", etiket: "Metin", tur: "uzunMetin", zorunlu: true }, { ad: "hedef", etiket: "Hedef dil", yer: "EN-US", varsayilan: "EN-US" }, { ad: "kaynak", etiket: "Kaynak dil (isteğe bağlı)", yer: "TR" }, { ad: "resmiyet", etiket: "Hitap", tur: "secim", secenekler: [{ id: "default", ad: "Varsayılan" }, { id: "prefer_more", ad: "Resmî" }, { id: "prefer_less", ad: "Samimi" }], varsayilan: "default" }],
      istek: (g, s) => ({ yontem: "POST", url: `${deepl(s)}/v2/translate`, basliklar: { Authorization: `DeepL-Auth-Key ${s("DEEPL_API_KEY")}` }, json: dolu({ text: [zorunlu(g, "metin", "Metin")], target_lang: (t(g.hedef) || "EN-US").toUpperCase(), source_lang: t(g.kaynak).toUpperCase(), formality: t(g.resmiyet) && t(g.resmiyet) !== "default" ? t(g.resmiyet) : undefined }) }), sonuc: ozetAl("translations.0.text") }],
  },
  {
    id: "firecrawl", ad: "Firecrawl", logo: "/marka/baglanti/firecrawl.svg", koyu: true, kategori: "Web", aciklama: "Sayfa oku, site haritası, web araması ve tarama", belge: "https://docs.firecrawl.dev/api-reference/introduction",
    sirlar: [{ ad: "FIRECRAWL_API_KEY", etiket: "API anahtarı", nasil: "firecrawl.dev panelindeki fc- ile başlayan anahtar." }],
    baglanti: [{ katalog: "firecrawl", esle: { FIRECRAWL_API_KEY: "anahtar" } }],
    eylemler: [
      { id: "oku", ad: "Sayfayı oku", aciklama: "Ana içerik Markdown olarak döner", okuma: true, sirlar: ["FIRECRAWL_API_KEY"], alanlar: [{ ad: "adres", etiket: "Sayfa adresi", zorunlu: true, yer: "https://…" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.firecrawl.dev/v1/scrape", basliklar: fc(s), json: { url: zorunlu(g, "adres", "Sayfa adresi"), formats: ["markdown"], onlyMainContent: true } }), sonuc: (y) => { const o = y as { success?: boolean; error?: string; data?: { metadata?: { title?: string } } }; return o?.success === false ? { hata: o.error ?? "Sayfa okunamadı." } : { ozet: o?.data?.metadata?.title }; } },
      { id: "harita", ad: "Sitenin adreslerini çıkar", aciklama: "Bir sitedeki bütün sayfa adresleri", okuma: true, sirlar: ["FIRECRAWL_API_KEY"], alanlar: [{ ad: "adres", etiket: "Site adresi", zorunlu: true }, { ad: "ara", etiket: "Adreste geçen (isteğe bağlı)", yer: "blog" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.firecrawl.dev/v1/map", basliklar: fc(s), json: dolu({ url: zorunlu(g, "adres", "Site adresi"), search: t(g.ara) }) }), sonuc: (y) => ({ ozet: `${((y as { links?: unknown[] })?.links ?? []).length} adres` }) },
      { id: "ara", ad: "Web'de ara ve oku", aciklama: "Arama sonuçlarının içeriğiyle", okuma: true, sirlar: ["FIRECRAWL_API_KEY"], alanlar: [{ ad: "sorgu", etiket: "Sorgu", zorunlu: true }, { ad: "adet", etiket: "Kaç sonuç", tur: "sayi", varsayilan: "5", yer: "5" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.firecrawl.dev/v1/search", basliklar: fc(s), json: { query: zorunlu(g, "sorgu", "Sorgu"), limit: tamsayi(g.adet, 5, 1, 20), lang: "tr" } }) },
      { id: "tara", ad: "Siteyi taramaya başla", aciklama: "Arka planda; iş kimliği döner", sirlar: ["FIRECRAWL_API_KEY"], alanlar: [{ ad: "adres", etiket: "Başlangıç adresi", zorunlu: true }, { ad: "sinir", etiket: "En çok sayfa", tur: "sayi", varsayilan: "50", yer: "50" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.firecrawl.dev/v1/crawl", basliklar: fc(s), json: { url: zorunlu(g, "adres", "Başlangıç adresi"), limit: tamsayi(g.sinir, 50, 1, 1000), scrapeOptions: { formats: ["markdown"], onlyMainContent: true } } }), sonuc: ozetAl("id") },
    ],
  },
  {
    id: "exa", ad: "Exa", logo: "/marka/baglanti/exa.svg", kategori: "Web", aciklama: "Anlamsal arama, içerik ve benzer sayfalar", belge: "https://docs.exa.ai/reference/search",
    sirlar: [{ ad: "EXA_API_KEY", etiket: "API anahtarı", nasil: "dashboard.exa.ai API Keys bölümü." }],
    baglanti: [{ katalog: "exa", esle: { EXA_API_KEY: "anahtar" } }],
    eylemler: [
      { id: "ara", ad: "Web'de ara", aciklama: "Başlık, adres ve metin parçalarıyla", okuma: true, sirlar: ["EXA_API_KEY"], alanlar: [{ ad: "sorgu", etiket: "Sorgu", zorunlu: true }, { ad: "adet", etiket: "Kaç sonuç", tur: "sayi", varsayilan: "5", yer: "5" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.exa.ai/search", basliklar: { "x-api-key": s("EXA_API_KEY") }, json: { query: zorunlu(g, "sorgu", "Sorgu"), numResults: tamsayi(g.adet, 5, 1, 25), contents: { text: { maxCharacters: 1500 } } } }) },
      { id: "icerik", ad: "Sayfa içeriklerini getir", aciklama: "Adres listesinden metin", okuma: true, sirlar: ["EXA_API_KEY"], alanlar: [{ ad: "adresler", etiket: "Adresler (virgülle)", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.exa.ai/contents", basliklar: { "x-api-key": s("EXA_API_KEY") }, json: { urls: virgul(zorunlu(g, "adresler", "Adresler")).slice(0, 10), text: { maxCharacters: 4000 } } }) },
      { id: "benzer", ad: "Benzer sayfaları bul", aciklama: "Rakip ya da örnek site araması", okuma: true, sirlar: ["EXA_API_KEY"], alanlar: [{ ad: "adres", etiket: "Adres", zorunlu: true }, { ad: "adet", etiket: "Kaç sonuç", tur: "sayi", varsayilan: "5", yer: "5" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.exa.ai/findSimilar", basliklar: { "x-api-key": s("EXA_API_KEY") }, json: { url: zorunlu(g, "adres", "Adres"), numResults: tamsayi(g.adet, 5, 1, 25) } }) },
    ],
  },
  {
    id: "tavily", ad: "Tavily", logo: "/marka/baglanti/tavily.svg", kategori: "Web", aciklama: "Yapay zekâ için web araması ve içerik çıkarma", belge: "https://docs.tavily.com/documentation/api-reference/endpoint/search",
    sirlar: [{ ad: "TAVILY_API_KEY", etiket: "API anahtarı", nasil: "app.tavily.com, API Keys; tvly- ile başlar." }],
    baglanti: [{ katalog: "tavily", esle: { TAVILY_API_KEY: "anahtar" } }],
    eylemler: [
      { id: "ara", ad: "Web'de ara", aciklama: "Özet yanıt ve kaynaklarla", okuma: true, sirlar: ["TAVILY_API_KEY"], alanlar: [{ ad: "sorgu", etiket: "Sorgu", zorunlu: true }, { ad: "adet", etiket: "Kaç sonuç", tur: "sayi", varsayilan: "5", yer: "5" }, { ad: "derinlik", etiket: "Derinlik", tur: "secim", secenekler: [{ id: "basic", ad: "Hızlı" }, { id: "advanced", ad: "Derin" }], varsayilan: "basic" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.tavily.com/search", basliklar: { Authorization: `Bearer ${s("TAVILY_API_KEY")}` }, json: { query: zorunlu(g, "sorgu", "Sorgu"), max_results: tamsayi(g.adet, 5, 1, 20), search_depth: t(g.derinlik) || "basic", include_answer: true } }), sonuc: ozetAl("answer") },
      { id: "cikar", ad: "Sayfalardan içerik çıkar", aciklama: "Adres listesinin ham metni", okuma: true, sirlar: ["TAVILY_API_KEY"], alanlar: [{ ad: "adresler", etiket: "Adresler (virgülle)", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: "https://api.tavily.com/extract", basliklar: { Authorization: `Bearer ${s("TAVILY_API_KEY")}` }, json: { urls: virgul(zorunlu(g, "adresler", "Adresler")).slice(0, 20) } }) },
    ],
  },
  {
    id: "jina", ad: "Jina AI", logo: "/marka/baglanti/jina.png", kategori: "Web", aciklama: "Sayfayı okunur metne çevir ve ara", belge: "https://jina.ai/reader/",
    sirlar: [{ ad: "JINA_API_KEY", etiket: "API anahtarı", nasil: "jina.ai sayfasında API bölümünden jina_ ile başlayan anahtar." }],
    baglanti: [{ katalog: "jina", esle: { JINA_API_KEY: "anahtar" } }],
    eylemler: [
      { id: "oku", ad: "Sayfayı oku", aciklama: "Markdown içerik ve başlık", okuma: true, sirlar: ["JINA_API_KEY"], alanlar: [{ ad: "adres", etiket: "Sayfa adresi", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `https://r.jina.ai/${zorunlu(g, "adres", "Sayfa adresi")}`, basliklar: { Authorization: `Bearer ${s("JINA_API_KEY")}`, Accept: "application/json" } }), sonuc: ozetAl("data.title") },
      { id: "ara", ad: "Web'de ara", aciklama: "Sonuçlar okunur metinle", okuma: true, sirlar: ["JINA_API_KEY"], alanlar: [{ ad: "sorgu", etiket: "Sorgu", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `https://s.jina.ai/${sorgu({ q: zorunlu(g, "sorgu", "Sorgu") })}`, basliklar: { Authorization: `Bearer ${s("JINA_API_KEY")}`, Accept: "application/json" } }) },
    ],
  },
  {
    id: "apify", ad: "Apify", logo: "/marka/baglanti/apify.svg", kategori: "Web", aciklama: "Hazır kazıyıcı (actor) çalıştır", belge: "https://docs.apify.com/api/v2/act-run-sync-get-dataset-items-post",
    sirlar: [{ ad: "APIFY_TOKEN", etiket: "API belirteci", nasil: "Apify Console, Settings, API & Integrations." }],
    baglanti: [{ katalog: "apify", esle: { APIFY_TOKEN: "anahtar" } }],
    eylemler: [{ id: "calistir", ad: "Actor çalıştır ve sonucu al", aciklama: "En çok 5 dakika; veri kümesi öğeleri döner", sirlar: ["APIFY_TOKEN"], alanlar: [{ ad: "actor", etiket: "Actor", zorunlu: true, yer: "apify/web-scraper" }, { ad: "girdi", etiket: "Girdi (JSON)", tur: "json", yer: "{\"startUrls\": [{\"url\": \"https://…\"}]}" }],
      istek: (g, s) => ({ yontem: "POST", url: `https://api.apify.com/v2/acts/${enc(zorunlu(g, "actor", "Actor").replace("/", "~"))}/run-sync-get-dataset-items?timeout=300`, basliklar: { Authorization: `Bearer ${s("APIFY_TOKEN")}` }, json: nesne(g.girdi, "Girdi") }), sonuc: (y) => ({ ozet: `${Array.isArray(y) ? y.length : 0} öğe` }) }],
  },
  {
    id: "serpapi", ad: "SerpApi", logo: "/marka/uyg/serpapi.svg", kategori: "Web", aciklama: "Google arama sonuçları", belge: "https://serpapi.com/search-api",
    sirlar: [{ ad: "SERPAPI_KEY", etiket: "API anahtarı", nasil: "serpapi.com, Dashboard, Your Private API Key." }],
    eylemler: [{ id: "ara", ad: "Google'da ara", aciklama: "Türkçe ve Türkiye konumuyla", okuma: true, sirlar: ["SERPAPI_KEY"], alanlar: [{ ad: "sorgu", etiket: "Sorgu", zorunlu: true }, { ad: "motor", etiket: "Arama türü", tur: "secim", secenekler: [{ id: "google", ad: "Web" }, { id: "google_news", ad: "Haberler" }, { id: "google_maps", ad: "Haritalar" }, { id: "google_shopping", ad: "Alışveriş" }], varsayilan: "google" }],
      istek: (g, s) => ({ yontem: "GET", url: `https://serpapi.com/search.json${sorgu({ engine: t(g.motor) || "google", q: zorunlu(g, "sorgu", "Sorgu"), hl: "tr", gl: "tr", api_key: s("SERPAPI_KEY") })}` }) }],
  },
  {
    id: "hunter", ad: "Hunter", logo: "/marka/uyg/hunter.svg", kategori: "Satış", aciklama: "Alan adından e-posta bul ve doğrula", belge: "https://hunter.io/api-documentation/v2",
    sirlar: [{ ad: "HUNTER_API_KEY", etiket: "API anahtarı", nasil: "hunter.io, API, Your API key." }],
    eylemler: [
      { id: "alan", ad: "Alan adındaki e-postalar", aciklama: "Şirketin bilinen adresleri", okuma: true, sirlar: ["HUNTER_API_KEY"], alanlar: [{ ad: "alan", etiket: "Alan adı", zorunlu: true, yer: "firma.com" }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.hunter.io/v2/domain-search${sorgu({ domain: zorunlu(g, "alan", "Alan adı"), limit: 10, api_key: s("HUNTER_API_KEY") })}` }) },
      { id: "bul", ad: "Kişinin e-postasını bul", aciklama: "Ad, soyad ve alan adıyla", okuma: true, sirlar: ["HUNTER_API_KEY"], alanlar: [{ ad: "alan", etiket: "Alan adı", zorunlu: true }, { ad: "ad", etiket: "Ad", zorunlu: true }, { ad: "soyad", etiket: "Soyad", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.hunter.io/v2/email-finder${sorgu({ domain: zorunlu(g, "alan", "Alan adı"), first_name: zorunlu(g, "ad", "Ad"), last_name: zorunlu(g, "soyad", "Soyad"), api_key: s("HUNTER_API_KEY") })}` }), sonuc: ozetAl("data.email") },
      { id: "dogrula", ad: "E-postayı doğrula", aciklama: "Teslim edilebilir mi", okuma: true, sirlar: ["HUNTER_API_KEY"], alanlar: [{ ad: "eposta", etiket: "E-posta", zorunlu: true }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.hunter.io/v2/email-verifier${sorgu({ email: zorunlu(g, "eposta", "E-posta"), api_key: s("HUNTER_API_KEY") })}` }), sonuc: ozetAl("data.status") },
    ],
  },
  {
    id: "openweather", ad: "OpenWeather", logo: "/marka/uyg/openweather.svg", kategori: "Veri", aciklama: "Anlık hava ve 5 günlük tahmin", belge: "https://openweathermap.org/current",
    sirlar: [{ ad: "OPENWEATHER_API_KEY", etiket: "API anahtarı", nasil: "home.openweathermap.org, API keys." }],
    eylemler: [
      { id: "simdi", ad: "Anlık hava durumu", aciklama: "Şehre göre, Türkçe açıklamayla", okuma: true, sirlar: ["OPENWEATHER_API_KEY"], alanlar: [{ ad: "sehir", etiket: "Şehir", zorunlu: true, yer: "Istanbul,TR" }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.openweathermap.org/data/2.5/weather${sorgu({ q: zorunlu(g, "sehir", "Şehir"), units: "metric", lang: "tr", appid: s("OPENWEATHER_API_KEY") })}` }), sonuc: ozetAl("weather.0.description") },
      { id: "tahmin", ad: "5 günlük tahmin", aciklama: "3 saatlik aralıklarla", okuma: true, sirlar: ["OPENWEATHER_API_KEY"], alanlar: [{ ad: "sehir", etiket: "Şehir", zorunlu: true, yer: "Izmir,TR" }],
        istek: (g, s) => ({ yontem: "GET", url: `https://api.openweathermap.org/data/2.5/forecast${sorgu({ q: zorunlu(g, "sehir", "Şehir"), units: "metric", lang: "tr", appid: s("OPENWEATHER_API_KEY") })}` }) },
    ],
  },
  {
    id: "supabase", ad: "Supabase", logo: "/marka/supabase.svg", kategori: "Veri", aciklama: "Tabloya ekle, oku, güncelle, sil ve işlev çağır", belge: "https://supabase.com/docs/guides/api",
    sirlar: [{ ad: "SUPABASE_URL", etiket: "Proje adresi", nasil: "Proje ayarlarında API bölümündeki https://xxxx.supabase.co adresi." }, { ad: "SUPABASE_KEY", etiket: "Hizmet anahtarı", nasil: "Aynı bölümdeki service_role ya da gizli anahtar; yalnız sunucuda kullanılır." }],
    eylemler: [
      { id: "ekle", ad: "Satır ekle", aciklama: "JSON nesnesiyle", sirlar: ["SUPABASE_URL", "SUPABASE_KEY"], alanlar: [{ ad: "tablo", etiket: "Tablo", zorunlu: true }, { ad: "satir", etiket: "Satır (JSON)", tur: "json", zorunlu: true, yer: "{\"ad\": \"{{tetik.ad}}\"}" }],
        istek: (g, s) => ({ yontem: "POST", url: sbUrl(s, `/${enc(zorunlu(g, "tablo", "Tablo"))}`), basliklar: { ...sbB(s), Prefer: "return=representation" }, json: nesne(g.satir, "Satır") }) },
      { id: "oku", ad: "Satırları oku", aciklama: "PostgREST süzgeciyle", okuma: true, sirlar: ["SUPABASE_URL", "SUPABASE_KEY"], alanlar: [{ ad: "tablo", etiket: "Tablo", zorunlu: true }, { ad: "suzgec", etiket: "Süzgeç (isteğe bağlı)", yer: "durum=eq.yeni&order=created_at.desc" }, { ad: "sinir", etiket: "En çok satır", tur: "sayi", varsayilan: "50", yer: "50" }],
        istek: (g, s) => ({ yontem: "GET", url: sbUrl(s, `/${enc(zorunlu(g, "tablo", "Tablo"))}?select=*&limit=${tamsayi(g.sinir, 50, 1, 1000)}${sbSuzgec(g.suzgec) ? `&${sbSuzgec(g.suzgec)}` : ""}`), basliklar: sbB(s) }), sonuc: (y) => ({ ozet: `${Array.isArray(y) ? y.length : 0} satır` }) },
      { id: "guncelle", ad: "Satırları güncelle", aciklama: "Süzgece uyanları değiştirir", sirlar: ["SUPABASE_URL", "SUPABASE_KEY"], alanlar: [{ ad: "tablo", etiket: "Tablo", zorunlu: true }, { ad: "suzgec", etiket: "Süzgeç", zorunlu: true, yer: "id=eq.42" }, { ad: "degerler", etiket: "Değerler (JSON)", tur: "json", zorunlu: true }],
        istek: (g, s) => ({ yontem: "PATCH", url: sbUrl(s, `/${enc(zorunlu(g, "tablo", "Tablo"))}?${sbSuzgec(zorunlu(g, "suzgec", "Süzgeç"))}`), basliklar: { ...sbB(s), Prefer: "return=representation" }, json: nesne(g.degerler, "Değerler") }) },
      { id: "sil", ad: "Satırları sil", aciklama: "Süzgece uyanları siler (süzgeç zorunlu)", sirlar: ["SUPABASE_URL", "SUPABASE_KEY"], alanlar: [{ ad: "tablo", etiket: "Tablo", zorunlu: true }, { ad: "suzgec", etiket: "Süzgeç", zorunlu: true, yer: "id=eq.42" }],
        istek: (g, s) => ({ yontem: "DELETE", url: sbUrl(s, `/${enc(zorunlu(g, "tablo", "Tablo"))}?${sbSuzgec(zorunlu(g, "suzgec", "Süzgeç"))}`), basliklar: { ...sbB(s), Prefer: "return=representation" } }) },
      { id: "islev", ad: "Veritabanı işlevini çağır", aciklama: "RPC ile Postgres işlevi", sirlar: ["SUPABASE_URL", "SUPABASE_KEY"], alanlar: [{ ad: "islev", etiket: "İşlev adı", zorunlu: true }, { ad: "parametreler", etiket: "Parametreler (JSON)", tur: "json" }],
        istek: (g, s) => ({ yontem: "POST", url: sbUrl(s, `/rpc/${enc(zorunlu(g, "islev", "İşlev adı"))}`), basliklar: sbB(s), json: nesne(g.parametreler, "Parametreler") }) },
    ],
  },
  {
    id: "upstash", ad: "Upstash Redis", logo: "/marka/uyg/upstash.svg", kategori: "Veri", aciklama: "Anahtar yaz, oku, say ve komut çalıştır", belge: "https://upstash.com/docs/redis/features/restapi",
    sirlar: [{ ad: "UPSTASH_REDIS_REST_URL", etiket: "REST adresi", nasil: "Upstash konsolu, veritabanı, REST API bölümündeki UPSTASH_REDIS_REST_URL." }, { ad: "UPSTASH_REDIS_REST_TOKEN", etiket: "REST belirteci", nasil: "Aynı bölümdeki UPSTASH_REDIS_REST_TOKEN." }],
    eylemler: [
      { id: "yaz", ad: "Değer yaz", aciklama: "İsteğe bağlı süre sonuyla", sirlar: UP, alanlar: [{ ad: "anahtar", etiket: "Anahtar", zorunlu: true }, { ad: "deger", etiket: "Değer", zorunlu: true }, { ad: "sure", etiket: "Süre sonu (saniye, isteğe bağlı)", tur: "sayi" }],
        istek: (g, s) => upstash(s, ["SET", zorunlu(g, "anahtar", "Anahtar"), m(g.deger), ...(t(g.sure) ? ["EX", String(tamsayi(g.sure, 60, 1, 31_536_000))] : [])]), sonuc: upSonuc },
      { id: "oku", ad: "Değer oku", aciklama: "Anahtarın değeri", okuma: true, sirlar: UP, alanlar: [{ ad: "anahtar", etiket: "Anahtar", zorunlu: true }], istek: (g, s) => upstash(s, ["GET", zorunlu(g, "anahtar", "Anahtar")]), sonuc: upSonuc },
      { id: "artir", ad: "Sayacı artır", aciklama: "Atomik artırma", sirlar: UP, alanlar: [{ ad: "anahtar", etiket: "Anahtar", zorunlu: true }, { ad: "miktar", etiket: "Miktar", tur: "sayi", varsayilan: "1", yer: "1" }],
        istek: (g, s) => upstash(s, ["INCRBY", zorunlu(g, "anahtar", "Anahtar"), String(tamsayi(g.miktar, 1, -1e9, 1e9))]), sonuc: upSonuc },
      { id: "komut", ad: "Komut çalıştır", aciklama: "Herhangi bir Redis komutu (JSON listesi)", sirlar: UP, alanlar: [{ ad: "komut", etiket: "Komut (JSON listesi)", tur: "json", zorunlu: true, yer: "[\"LPUSH\", \"kuyruk\", \"{{tetik.id}}\"]" }],
        istek: (g, s) => { const l = liste(g.komut, "Komut"); if (!l.length) throw new Error("Komut boş."); return upstash(s, l); }, sonuc: upSonuc },
    ],
  },
  {
    id: "webflow", ad: "Webflow", logo: "/marka/baglanti/webflow.svg", kategori: "Web sitesi", aciklama: "CMS öğesi ekle, güncelle ve siteyi yayınla", belge: "https://developers.webflow.com/data/reference/rest-introduction",
    sirlar: [{ ad: "WEBFLOW_TOKEN", etiket: "Site API belirteci", nasil: "Webflow site ayarlarında Apps & Integrations, API access bölümünden CMS ve site yayınlama izinli belirteç." }],
    eylemler: [
      { id: "oge", ad: "CMS öğesi ekle", aciklama: "Koleksiyona ad, adres ve alanlarla", sirlar: ["WEBFLOW_TOKEN"], alanlar: [{ ad: "koleksiyon", etiket: "Koleksiyon kimliği", zorunlu: true }, { ad: "ad", etiket: "Ad", zorunlu: true }, { ad: "adres", etiket: "Adres parçası (slug)", yer: "yeni-urun" }, { ad: "alanlar", etiket: "Diğer alanlar (JSON)", tur: "json", yer: "{\"aciklama\": \"…\"}" }, { ad: "taslak", etiket: "Taslak olarak", tur: "evet-hayir" }],
        istek: (g, s) => ({ yontem: "POST", url: `https://api.webflow.com/v2/collections/${enc(zorunlu(g, "koleksiyon", "Koleksiyon kimliği"))}/items`, basliklar: wf(s), json: { isDraft: g.taslak === true || g.taslak === "true", fieldData: { name: zorunlu(g, "ad", "Ad"), ...(t(g.adres) ? { slug: t(g.adres) } : {}), ...nesne(g.alanlar, "Diğer alanlar") } } }), sonuc: ozetAl("id") },
      { id: "guncelle", ad: "CMS öğesini güncelle", aciklama: "Alanları değiştir", sirlar: ["WEBFLOW_TOKEN"], alanlar: [{ ad: "koleksiyon", etiket: "Koleksiyon kimliği", zorunlu: true }, { ad: "oge", etiket: "Öğe kimliği", zorunlu: true }, { ad: "alanlar", etiket: "Alanlar (JSON)", tur: "json", zorunlu: true }],
        istek: (g, s) => ({ yontem: "PATCH", url: `https://api.webflow.com/v2/collections/${enc(zorunlu(g, "koleksiyon", "Koleksiyon kimliği"))}/items/${enc(zorunlu(g, "oge", "Öğe kimliği"))}`, basliklar: wf(s), json: { fieldData: nesne(g.alanlar, "Alanlar") } }) },
      { id: "yayinla", ad: "Siteyi yayınla", aciklama: "webflow.io alt alanında", sirlar: ["WEBFLOW_TOKEN"], alanlar: [{ ad: "site", etiket: "Site kimliği", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: `https://api.webflow.com/v2/sites/${enc(zorunlu(g, "site", "Site kimliği"))}/publish`, basliklar: wf(s), json: { publishToWebflowSubdomain: true } }) },
    ],
  },
  {
    id: "wordpress", ad: "WordPress", logo: "/marka/baglanti/wordpress.svg", kategori: "Web sitesi", aciklama: "Yazı ve sayfa yayınla, güncelle", belge: "https://developer.wordpress.org/rest-api/reference/posts/",
    sirlar: [{ ad: "WORDPRESS_SITE", etiket: "Site adresi", nasil: "https://blogun.com biçiminde." }, { ad: "WORDPRESS_KULLANICI", etiket: "Kullanıcı adı", nasil: "Yazı yazma yetkisi olan kullanıcı." }, { ad: "WORDPRESS_UYGULAMA_SIFRESI", etiket: "Uygulama şifresi", nasil: "Profil sayfasında Uygulama şifreleri bölümünden oluştur." }],
    eylemler: [
      { id: "yazi", ad: "Yazı oluştur", aciklama: "Taslak ya da yayında", sirlar: WPS, alanlar: [{ ad: "baslik", etiket: "Başlık", zorunlu: true }, { ad: "icerik", etiket: "İçerik (HTML)", tur: "uzunMetin", zorunlu: true }, WP_DURUM, { ad: "ozet", etiket: "Özet" }],
        istek: (g, s) => ({ yontem: "POST", url: wp(s, "/posts"), basliklar: wpB(s), json: dolu({ title: zorunlu(g, "baslik", "Başlık"), content: zorunlu(g, "icerik", "İçerik"), status: t(g.durum) || "draft", excerpt: t(g.ozet) }) }), sonuc: ozetAl("link") },
      { id: "guncelle", ad: "Yazıyı güncelle", aciklama: "Başlık, içerik ya da durum", sirlar: WPS, alanlar: [{ ad: "yazi", etiket: "Yazı kimliği", zorunlu: true }, { ad: "baslik", etiket: "Başlık" }, { ad: "icerik", etiket: "İçerik (HTML)", tur: "uzunMetin" }, { ...WP_DURUM, varsayilan: undefined }],
        istek: (g, s) => ({ yontem: "POST", url: wp(s, `/posts/${enc(zorunlu(g, "yazi", "Yazı kimliği"))}`), basliklar: wpB(s), json: dolu({ title: t(g.baslik), content: t(g.icerik), status: t(g.durum) }) }), sonuc: ozetAl("link") },
      { id: "sayfa", ad: "Sayfa oluştur", aciklama: "Kalıcı sayfa", sirlar: WPS, alanlar: [{ ad: "baslik", etiket: "Başlık", zorunlu: true }, { ad: "icerik", etiket: "İçerik (HTML)", tur: "uzunMetin", zorunlu: true }, WP_DURUM],
        istek: (g, s) => ({ yontem: "POST", url: wp(s, "/pages"), basliklar: wpB(s), json: { title: zorunlu(g, "baslik", "Başlık"), content: zorunlu(g, "icerik", "İçerik"), status: t(g.durum) || "draft" } }), sonuc: ozetAl("link") },
    ],
  },
  {
    id: "posthog", ad: "PostHog", logo: "/marka/baglanti/posthog.svg", kategori: "Analitik", aciklama: "Olay kaydet ve kişi özelliği yaz", belge: "https://posthog.com/docs/api/capture",
    sirlar: [{ ad: "POSTHOG_PROJE_ANAHTARI", etiket: "Proje API anahtarı", nasil: "Proje ayarlarındaki phc_ ile başlayan anahtar." }],
    eylemler: [
      { id: "olay", ad: "Olay kaydet", aciklama: "Kişi ve özelliklerle", sirlar: ["POSTHOG_PROJE_ANAHTARI"], alanlar: [{ ad: "olay", etiket: "Olay adı", zorunlu: true, yer: "siparis_verildi" }, { ad: "kisi", etiket: "Kişi kimliği", zorunlu: true, yer: "/ ile e-posta" }, { ad: "ozellikler", etiket: "Özellikler (JSON)", tur: "json" }, { ad: "bolge", etiket: "Bölge", tur: "secim", secenekler: [{ id: "eu", ad: "Avrupa" }, { id: "us", ad: "ABD" }], varsayilan: "eu" }],
        istek: (g, s) => ({ yontem: "POST", url: `https://${t(g.bolge) === "us" ? "us" : "eu"}.i.posthog.com/capture/`, json: { api_key: s("POSTHOG_PROJE_ANAHTARI"), event: zorunlu(g, "olay", "Olay adı"), distinct_id: zorunlu(g, "kisi", "Kişi kimliği"), properties: nesne(g.ozellikler, "Özellikler") } }) },
      { id: "kisi", ad: "Kişi özelliklerini yaz", aciklama: "$set ile profil güncelleme", sirlar: ["POSTHOG_PROJE_ANAHTARI"], alanlar: [{ ad: "kisi", etiket: "Kişi kimliği", zorunlu: true }, { ad: "ozellikler", etiket: "Özellikler (JSON)", tur: "json", zorunlu: true, yer: "{\"plan\": \"pro\"}" }, { ad: "bolge", etiket: "Bölge", tur: "secim", secenekler: [{ id: "eu", ad: "Avrupa" }, { id: "us", ad: "ABD" }], varsayilan: "eu" }],
        istek: (g, s) => ({ yontem: "POST", url: `https://${t(g.bolge) === "us" ? "us" : "eu"}.i.posthog.com/capture/`, json: { api_key: s("POSTHOG_PROJE_ANAHTARI"), event: "$identify", distinct_id: zorunlu(g, "kisi", "Kişi kimliği"), properties: { $set: nesne(g.ozellikler, "Özellikler") } } }) },
    ],
  },
  {
    id: "vercel", ad: "Vercel", logo: "/marka/uyg/vercel.svg", kategori: "Geliştirme", aciklama: "Dağıtım kancasıyla yeniden dağıt", belge: "https://vercel.com/docs/deploy-hooks",
    sirlar: [{ ad: "VERCEL_DEPLOY_HOOK", etiket: "Dağıtım kancası adresi", nasil: "Proje, Settings, Git, Deploy Hooks; dal seçip adresi kopyala." }],
    eylemler: [{ id: "dagit", ad: "Yeniden dağıt", aciklama: "Dalın son halini dağıtır", sirlar: ["VERCEL_DEPLOY_HOOK"], alanlar: [], istek: (_g, s) => ({ yontem: "POST", url: s("VERCEL_DEPLOY_HOOK") }), sonuc: ozetAl("job.state") }],
  },
  {
    id: "netlify", ad: "Netlify", logo: "/marka/uyg/netlify.svg", kategori: "Geliştirme", aciklama: "Derleme kancasıyla yeniden derle", belge: "https://docs.netlify.com/configure-builds/build-hooks/",
    sirlar: [{ ad: "NETLIFY_BUILD_HOOK", etiket: "Derleme kancası adresi", nasil: "Site, Build & deploy, Build hooks, Add build hook." }],
    eylemler: [{ id: "derle", ad: "Yeniden derle ve yayınla", aciklama: "İsteğe bağlı başlıkla", sirlar: ["NETLIFY_BUILD_HOOK"], alanlar: [{ ad: "baslik", etiket: "Derleme başlığı", yer: "Vayra: yeni ürün" }],
      istek: (g, s) => ({ yontem: "POST", url: `${s("NETLIFY_BUILD_HOOK")}${t(g.baslik) ? `${s("NETLIFY_BUILD_HOOK").includes("?") ? "&" : "?"}trigger_title=${enc(t(g.baslik))}` : ""}`, metin: "{}", tur: "application/json", yanit: "metin" }) }],
  },
  {
    id: "pagerduty", ad: "PagerDuty", logo: "/marka/uyg/pagerduty.svg", kategori: "Geliştirme", aciklama: "Olay aç ve çöz", belge: "https://developer.pagerduty.com/docs/events-api-v2/trigger-events/",
    sirlar: [{ ad: "PAGERDUTY_ROUTING_KEY", etiket: "Entegrasyon anahtarı", nasil: "Hizmet, Integrations, Events API V2 entegrasyonunun Integration Key değeri." }],
    eylemler: [
      { id: "ac", ad: "Olay aç", aciklama: "Nöbetçiye bildirim gider", sirlar: ["PAGERDUTY_ROUTING_KEY"], alanlar: [{ ad: "ozet", etiket: "Özet", zorunlu: true }, { ad: "kaynak", etiket: "Kaynak", yer: "vayra-sistem", varsayilan: "vayra-sistem" }, { ad: "onem", etiket: "Önem", tur: "secim", secenekler: [{ id: "critical", ad: "Kritik" }, { id: "error", ad: "Hata" }, { id: "warning", ad: "Uyarı" }, { id: "info", ad: "Bilgi" }], varsayilan: "error" }, { ad: "anahtar", etiket: "Tekilleştirme anahtarı (isteğe bağlı)" }],
        istek: (g, s) => ({ yontem: "POST", url: "https://events.pagerduty.com/v2/enqueue", json: dolu({ routing_key: s("PAGERDUTY_ROUTING_KEY"), event_action: "trigger", dedup_key: t(g.anahtar), payload: { summary: zorunlu(g, "ozet", "Özet").slice(0, 1024), source: t(g.kaynak) || "vayra-sistem", severity: t(g.onem) || "error" } }) }), sonuc: ozetAl("dedup_key") },
      { id: "coz", ad: "Olayı çöz", aciklama: "Tekilleştirme anahtarıyla", sirlar: ["PAGERDUTY_ROUTING_KEY"], alanlar: [{ ad: "anahtar", etiket: "Tekilleştirme anahtarı", zorunlu: true }],
        istek: (g, s) => ({ yontem: "POST", url: "https://events.pagerduty.com/v2/enqueue", json: { routing_key: s("PAGERDUTY_ROUTING_KEY"), event_action: "resolve", dedup_key: zorunlu(g, "anahtar", "Anahtar") } }), sonuc: ozetAl("status") },
    ],
  },
  {
    id: "cloudinary", ad: "Cloudinary", logo: "/marka/uyg/cloudinary.svg", kategori: "Dosya", aciklama: "Adresten görsel yükle (imzalı)", belge: "https://cloudinary.com/documentation/image_upload_api_reference#upload",
    sirlar: [{ ad: "CLOUDINARY_BULUT", etiket: "Bulut adı", nasil: "Cloudinary konsolu, Dashboard, Cloud name." }, { ad: "CLOUDINARY_API_KEY", etiket: "API anahtarı", nasil: "Aynı sayfadaki API Key." }, { ad: "CLOUDINARY_API_SECRET", etiket: "API gizli anahtarı", nasil: "Aynı sayfadaki API Secret." }],
    eylemler: [{ id: "yukle", ad: "Görsel yükle", aciklama: "Adresten, isteğe bağlı klasöre", sirlar: ["CLOUDINARY_BULUT", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"], alanlar: [{ ad: "adres", etiket: "Görsel adresi", zorunlu: true }, { ad: "klasor", etiket: "Klasör", yer: "urunler" }, { ad: "kimlik", etiket: "Genel kimlik (public_id, isteğe bağlı)" }],
      istek: async (g, s) => { const p = dolu({ folder: t(g.klasor), public_id: t(g.kimlik), timestamp: String(Math.floor(Date.now() / 1000)) }) as Record<string, string>; const imza = await shaHex(Object.keys(p).sort().map((k) => `${k}=${p[k]}`).join("&") + s("CLOUDINARY_API_SECRET"), "SHA-1"); return { yontem: "POST", url: `https://api.cloudinary.com/v1_1/${enc(s("CLOUDINARY_BULUT"))}/image/upload`, form: { ...p, file: zorunlu(g, "adres", "Görsel adresi"), api_key: s("CLOUDINARY_API_KEY"), signature: imza } }; }, sonuc: ozetAl("secure_url") }],
  },
];
