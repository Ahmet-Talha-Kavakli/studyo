import Anthropic from "@anthropic-ai/sdk";
import { oturumGerekli } from "@/lib/hesap/yetki";
import { icerikDenetle } from "@/lib/moderasyon";
import { SC_MODELLER, SC_VARSAYILAN_MODEL, type ScOlay, type ScGidenEk, type ScKisisel, type ScProjeBaglam } from "@/lib/scSohbet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Usta sohbet rotası — Claude Messages API'yi akışlı çağırır ve istemciye satır başına
   bir JSON olay (NDJSON) yollar: düşünme özeti, web araması, kaynak, metin, bitiş.
   Kimlik bilgisi yoksa { demo: true } döner; istemci dürüst "Demo" etiketiyle yanıt üretir. */

type Govde = {
  mesajlar: { rol: "kullanici" | "asistan"; metin: string; ekler?: ScGidenEk[] }[];
  model?: string;
  dusun?: boolean;
  web?: boolean;
  stil?: "normal" | "kisa" | "resmi" | "aciklayici";
  /** Kullanıcının oluşturduğu özel yanıt stili. */
  ozelStil?: { ad: string; talimat: string };
  /** Düşünme düzeyi; verilmezse dusun bayrağına göre. */
  efor?: "dusuk" | "orta" | "yuksek" | "max";
  /** Derin araştırma: çok adımlı web araması + kaynaklı rapor. */
  arastir?: boolean;
  proje?: ScProjeBaglam;
  kisisel?: ScKisisel;
  /** Çalışan (özel asistan) rolü. */
  calisan?: { ad: string; talimat: string; dosyalar?: { ad: string; icerik: string }[] };
  /** Bu mesaj için seçilen beceri (zorunlu uygulanır). */
  beceri?: { ad: string; talimat: string };
  /** Kod çalıştırma (Python/bash, yalıtılmış kapsayıcı). */
  kod?: boolean;
  /** Özel MCP bağlayıcıları (Claude'a uzak MCP sunucusu olarak verilir). */
  mcp?: { ad: string; url: string; token?: string }[];
  /** Açık beceriler (ilgili olduğunda ya da kullanıcı "/komut" yazdığında uygulanır). */
  beceriler?: { ad: string; komut: string; talimat: string }[];
};

const calisanIstemi = (c?: Govde["calisan"]) => {
  if (!c?.talimat) return "";
  const dosyalar = (c.dosyalar ?? []).slice(0, 10).map((d) => `<dosya ad="${String(d.ad).replace(/"/g, "")}">\n${String(d.icerik).slice(0, 60000)}\n</dosya>`).join("\n");
  return [`Bu sohbette "${String(c.ad).slice(0, 60)}" adlı asistan rolündesin. Rol talimatı:\n${String(c.talimat).slice(0, 8000)}`, dosyalar && `Asistanın bilgi dosyaları:\n${dosyalar}`].filter(Boolean).join("\n\n");
};

const beceriIstemi = (g: Govde) => {
  const kes = (s: unknown, n: number) => String(s ?? "").slice(0, n);
  const parca: string[] = [];
  if (g.beceri?.talimat) parca.push(`Bu mesajda "${kes(g.beceri.ad, 60)}" becerisini uygula. Talimat:\n${kes(g.beceri.talimat, 8000)}`);
  const liste = (g.beceriler ?? []).filter((b) => b && b.ad !== g.beceri?.ad).slice(0, 12);
  if (liste.length) parca.push(`Kullanıcının açık becerileri (yalnız istek gerçekten uyuyorsa ya da kullanıcı /komut yazarsa uygula):\n${liste.map((b) => `<beceri ad="${kes(b.ad, 60).replace(/"/g, "")}" komut="/${kes(b.komut, 20)}">\n${kes(b.talimat, 1500)}\n</beceri>`).join("\n")}`);
  return parca.join("\n\n");
};

/** Kişisel talimatlar ve bellek sistem istemine eklenir (geçici sohbette istemci göndermez). */
const kisiselIstem = (k?: ScKisisel) => {
  if (!k) return "";
  const kes = (s?: string, n = 1500) => (typeof s === "string" ? s.trim().slice(0, n) : "");
  const satirlar = [
    kes(k.hitap, 120) && `Kullanıcıya şöyle hitap et: ${kes(k.hitap, 120)}`,
    kes(k.is, 600) && `Kullanıcının işi / bağlamı: ${kes(k.is, 600)}`,
    kes(k.tercih) && `Kullanıcının yanıt tercihleri: ${kes(k.tercih)}`,
    Array.isArray(k.bellek) && k.bellek.length ? `Kullanıcı hakkında hatırladıkların (yalnız ilgili olduğunda kullan, her yanıtta anma):\n${k.bellek.slice(0, 60).map((b) => `- ${String(b).slice(0, 300)}`).join("\n")}` : "",
  ].filter(Boolean);
  return satirlar.length ? `Kişiselleştirme:\n${satirlar.join("\n")}` : "";
};

const ARASTIRMA = `Derin araştırma modundasın. Önce soruyu alt sorulara böl; her biri için farklı sorgularla web'de ara (en az 5 arama), kaynakları karşılaştır ve çelişkileri not et.
Sonra Markdown bir rapor yaz: "## Özet" (2-3 cümle), "## Bulgular" (alt başlıklar, her iddia kaynağa dayansın), uygunsa bir karşılaştırma tablosu, "## Sonuç". Kaynakları alıntıla.`;

/** Proje talimatı ve bilgi dosyaları sistem istemine eklenir. */
const projeIstemi = (p?: ScProjeBaglam) => {
  if (!p) return "";
  const dosyalar = (p.dosyalar ?? []).slice(0, 20).map((d) => `<dosya ad="${d.ad.replace(/"/g, "")}">\n${d.icerik.slice(0, 100000)}\n</dosya>`).join("\n");
  return [`Bu sohbet "${p.ad}" projesine ait.`, p.talimat?.trim() && `Proje talimatı:\n${p.talimat.trim().slice(0, 8000)}`, dosyalar && `Proje bilgi dosyaları:\n${dosyalar}`].filter(Boolean).join("\n\n");
};

const STIL: Record<NonNullable<Govde["stil"]>, string> = {
  normal: "",
  kisa: "Yanıtlarını kısa ve öz tut; gereksiz açıklama yapma.",
  resmi: "Resmî, profesyonel bir dil kullan.",
  aciklayici: "Konuyu adım adım, örneklerle ve öğretici biçimde açıkla.",
};

const KOD_ISTEMI = `Kod çalıştırma aracın açık: hesap, veri analizi ve grafik gerektiğinde Python kodunu gerçekten çalıştır, sonucu tahmin etme. Grafikleri PNG olarak kaydet. Sonucu kısa bir özetle açıkla.`;

const SISTEM = `Sen Vayra Usta'sın: Vayra yaratıcı yapay zekâ platformunun sohbet asistanı.
Kullanıcıyla Türkçe konuş (kullanıcı başka dilde yazarsa o dilde yanıt ver).
Markdown kullan: başlık, liste, tablo ve dil etiketli kod blokları. Web'den bilgi aldıysan kaynakları alıntıla.
Bilmediğin bir şeyi uydurma; emin değilsen söyle.
Sayısal bir karşılaştırma ya da zaman içindeki değişim grafikle daha iyi anlaşılacaksa, tablonun yerine ya da yanına bir grafik bloğu ekle:
\`\`\`grafik
{"tur":"cubuk","baslik":"Kısa başlık","birim":"₺","etiketler":["Oca","Şub"],"seriler":[{"ad":"2025","degerler":[120,140]}]}
\`\`\`
"tur" karşılaştırma için "cubuk", zaman serisi için "cizgi" olsun; en çok 6 seri, tek birim, yalnızca geçerli JSON. Veriyi uydurma: sayılar kullanıcıdan, araç sonuçlarından ya da açıkça belirtilen tahminden gelmeli.`;

const kimlikVar = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

export async function POST(req: Request) {
  // Oturum gerekir: sağlayıcı maliyeti olan uç misafire açık değil (bu iş kredi harcamaz).
  const oturum = await oturumGerekli(req);
  if (oturum instanceof Response) return oturum;
  let g: Govde;
  try { g = (await req.json()) as Govde; } catch { return Response.json({ ok: false, hata: "Geçersiz istek." }, { status: 400 }); }
  const mesajlar = (g.mesajlar ?? []).filter((m) => m.metin?.trim()).slice(-40);
  if (!mesajlar.length || mesajlar[mesajlar.length - 1].rol !== "kullanici") return Response.json({ ok: false, hata: "Mesaj boş." }, { status: 400 });
  const denetim = icerikDenetle(mesajlar[mesajlar.length - 1].metin);
  if (!denetim.izin) return Response.json({ ok: false, moderasyon: true, hata: denetim.mesaj }, { status: 422 });
  if (!kimlikVar() && !/^(gpt-|gemini-)/.test(g.model ?? "")) return Response.json({ ok: true, demo: true });

  // Otomatik model: kısa ve basit sorular hızlı modele, araştırma/kod/uzun ve zor işler güçlü modele.
  const sonMetin = mesajlar[mesajlar.length - 1].metin;
  const otomatikSec = () => {
    if (g.arastir || g.kod || g.efor === "max" || g.efor === "yuksek" || sonMetin.length > 1500 || /```|analiz|kanıtla|strateji|mimari|karşılaştır|rapor|hata ayıkla|debug|neden/i.test(sonMetin)) return "claude-opus-5-5";
    if (sonMetin.length < 160 && mesajlar.length <= 6 && !(mesajlar[mesajlar.length - 1].ekler?.length)) return "claude-haiku-5-5";
    return "claude-sonnet-5-5";
  };
  const modelId = g.model === "otomatik" ? otomatikSec() : g.model;
  const model = SC_MODELLER.find((m) => m.id === modelId) ?? SC_MODELLER.find((m) => m.id === SC_VARSAYILAN_MODEL)!;
  if (model.saglayici !== "anthropic") return disAkis(model.saglayici, model.id, [SISTEM_KISA(g), projeIstemi(g.proje), calisanIstemi(g.calisan), kisiselIstem(g.kisisel), beceriIstemi(g)].filter(Boolean).join("\n\n"), mesajlar, req.signal);
  const client = new Anthropic();
  const sistem = [SISTEM, g.ozelStil?.talimat ? `Yanıt stili ("${String(g.ozelStil.ad).slice(0, 40)}"): yanıtlarını bu üslupla yaz; içerik doğruluğundan ödün verme.\n${String(g.ozelStil.talimat).slice(0, 3000)}` : STIL[g.stil ?? "normal"], g.arastir && ARASTIRMA, g.kod && KOD_ISTEMI, projeIstemi(g.proje), calisanIstemi(g.calisan), kisiselIstem(g.kisisel), beceriIstemi(g)].filter(Boolean).join("\n\n");
  // Ekler yalnız son kullanıcı mesajında gelir: görseller görüntü bloğu, metin dosyaları belge metni olur.
  const gecmis: Anthropic.Beta.BetaMessageParam[] = mesajlar.map((m, i) => {
    const ekler = i === mesajlar.length - 1 ? (m.ekler ?? []).slice(0, 8) : [];
    if (m.rol !== "kullanici" || !ekler.length) return { role: m.rol === "kullanici" ? "user" : "assistant", content: m.metin || " " };
    const bloklar: Anthropic.Beta.BetaContentBlockParam[] = [];
    for (const e of ekler) {
      if (e.tur === "gorsel") {
        const eslesme = /^data:(image\/(?:png|jpeg|webp|gif));base64,(.+)$/.exec(e.veri);
        if (eslesme) bloklar.push({ type: "image", source: { type: "base64", media_type: eslesme[1] as "image/png", data: eslesme[2] } });
      } else bloklar.push({ type: "text", text: `<dosya ad="${e.ad.replace(/"/g, "")}">
${e.icerik.slice(0, 200000)}
</dosya>` });
    }
    bloklar.push({ type: "text", text: m.metin || "Eklediğim dosyalara bak." });
    return { role: "user", content: bloklar };
  });
  const araclar: Anthropic.Beta.BetaToolUnion[] = g.web || g.arastir ? [model.arama === "yeni" ? { type: "web_search_20260209", name: "web_search", max_uses: g.arastir ? 25 : 6 } : { type: "web_search_20250305", name: "web_search", max_uses: g.arastir ? 25 : 6 }] : [];

  // Özel MCP sunucuları: yalnız https, en çok 5; ad API'nin istediği biçime çevrilir.
  const mcp = (g.mcp ?? []).filter((s) => { try { return new URL(s.url).protocol === "https:"; } catch { return false; } }).slice(0, 5)
    .map((s, i) => ({ type: "url" as const, url: s.url, name: (String(s.ad).toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "mcp") + `-${i + 1}`, ...(s.token ? { authorization_token: String(s.token).slice(0, 4000) } : {}) }));
  for (const s of mcp) araclar.push({ type: "mcp_toolset", mcp_server_name: s.name });
  if (g.kod) araclar.push({ type: "code_execution_20260120", name: "code_execution" });
  const betalar = [...(model.yedek ? ["server-side-fallback-2026-07-01"] : []), ...(mcp.length ? ["mcp-client-2025-11-20"] : [])];

  const kodla = new TextEncoder();
  const akis = new ReadableStream<Uint8Array>({
    async start(c) {
      const yaz = (o: ScOlay) => c.enqueue(kodla.encode(JSON.stringify(o) + "\n"));
      const baslangic = Date.now();
      try {
        // Sunucu araçları uzun sürerse yanıt pause_turn ile durur; aynı geçmişle sürdürülür.
        for (let tur = 0; tur < (g.arastir ? 10 : 4); tur++) {
          const stream = client.beta.messages.stream({
            model: model.id,
            max_tokens: 64000,
            system: sistem,
            messages: gecmis,
            thinking: { type: "adaptive", display: "summarized" },
            output_config: { effort: g.arastir ? (g.efor === "max" ? "max" : "high") : g.efor ? ({ dusuk: "low", orta: "medium", yuksek: "high", max: "max" } as const)[g.efor] : g.dusun ? "high" : "low" },
            ...(araclar.length ? { tools: araclar } : {}),
            ...(betalar.length ? { betas: betalar } : {}),
            ...(model.yedek ? { fallbacks: "default" as const } : {}),
            ...(mcp.length ? { mcp_servers: mcp } : {}),
          }, { signal: req.signal });

          const bloklar: Record<number, { tur: string; json?: string; atif?: string[]; ad?: string }> = {};
          for await (const o of stream) {
            if (o.type === "content_block_start") {
              const b = o.content_block;
              bloklar[o.index] = { tur: b.type, json: "", ...(b.type === "server_tool_use" ? { ad: b.name } : {}) };
              if (b.type === "thinking") yaz({ t: "dusunme_basla" });
              else if (b.type === "mcp_tool_use") yaz({ t: "arac_basla", ad: b.name, sunucu: (g.mcp ?? [])[Number(b.server_name.split("-").pop()) - 1]?.ad ?? b.server_name });
              else if (b.type === "bash_code_execution_tool_result") {
                const k = b.content;
                if (k.type === "bash_code_execution_result") yaz({ t: "kod_sonuc", cikti: k.stdout.slice(0, 20000), hata: k.stderr.slice(0, 8000) || undefined, kod: k.return_code, dosyalar: k.content.map((f) => f.file_id).slice(0, 8) });
                else yaz({ t: "kod_sonuc", hata: `Çalıştırılamadı (${k.error_code})` });
              }
              else if (b.type === "text_editor_code_execution_tool_result") {
                const k = b.content as { type: string; error_code?: string };
                yaz(k.type.endsWith("_error") ? { t: "kod_sonuc", hata: `Dosya işlemi başarısız (${k.error_code})` } : { t: "kod_sonuc", cikti: "" });
              }
              else if (b.type === "mcp_tool_result") yaz({ t: "arac_bitti", hata: !!b.is_error });
              else if (b.type === "web_search_tool_result") {
                const icerik = b.content;
                if (Array.isArray(icerik)) yaz({ t: "arama_sonuc", sonuclar: icerik.map((r) => ({ baslik: r.title, url: r.url, yas: r.page_age ?? undefined })) });
                else yaz({ t: "arama_hata", kod: icerik.error_code });
              }
            } else if (o.type === "content_block_delta") {
              const d = o.delta;
              if (d.type === "thinking_delta") yaz({ t: "dusunme", metin: d.thinking });
              else if (d.type === "text_delta") yaz({ t: "metin", metin: d.text });
              else if (d.type === "input_json_delta" && bloklar[o.index]) bloklar[o.index].json += d.partial_json;
              else if (d.type === "citations_delta" && d.citation.type === "web_search_result_location") {
                yaz({ t: "kaynak", url: d.citation.url, baslik: d.citation.title ?? d.citation.url, alinti: d.citation.cited_text });
                const b = bloklar[o.index]; if (b) (b.atif ??= []).push(d.citation.url);
              }
            } else if (o.type === "content_block_stop") {
              const b = bloklar[o.index];
              if (b?.tur === "thinking") yaz({ t: "dusunme_bitti" });
              // Alıntılı metin bloğu bitti → numaralı atıf (Claude gibi cümlenin sonunda kaynak çipi).
              if (b?.tur === "text" && b.atif?.length) yaz({ t: "atif", urller: b.atif });
              if (b?.tur === "server_tool_use" && b.ad && b.ad !== "web_search") {
                // Kod çalıştırma çağrısı: girdi tamamlanınca komutu yayınla.
                let girdi: { command?: string; path?: string; file_text?: string } = {};
                try { girdi = JSON.parse(b.json || "{}"); } catch { /* yarım girdi */ }
                if (b.ad === "bash_code_execution") yaz({ t: "kod_basla", tur: "bash", komut: String(girdi.command ?? "").slice(0, 4000) });
                else yaz({ t: "kod_basla", tur: "dosya", komut: `${girdi.command ?? "dosya"} ${girdi.path ?? ""}`.trim(), icerik: girdi.file_text?.slice(0, 20000) });
              } else if (b?.tur === "server_tool_use") {
                let sorgu = "";
                try { sorgu = (JSON.parse(b.json || "{}") as { query?: string }).query ?? ""; } catch { /* yarım girdi */ }
                yaz({ t: "arama_basla", sorgu });
              }
            }
          }
          const son = await stream.finalMessage();
          if (son.stop_reason === "refusal") { yaz({ t: "red" }); break; }
          if (son.stop_reason === "pause_turn") { gecmis.push({ role: "assistant", content: son.content }); continue; }
          yaz({ t: "bitti", sureMs: Date.now() - baslangic, girdi: son.usage.input_tokens, cikti: son.usage.output_tokens, model: son.model, kesildi: son.stop_reason === "max_tokens" });
          break;
        }
      } catch (e) {
        if (!req.signal.aborted) {
          const mesaj = e instanceof Anthropic.RateLimitError ? "Yoğunluk var, biraz sonra tekrar dene."
            : e instanceof Anthropic.AuthenticationError ? "Model anahtarı geçersiz."
              : e instanceof Anthropic.APIError ? `Model hatası (${e.status ?? "?"}).` : "Bağlantı koptu.";
          yaz({ t: "hata", mesaj });
        }
      } finally { c.close(); }
    },
  });
  return new Response(akis, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}

/** OpenAI ve Google modelleri için sistem istemi: ana istem + stil. */
function SISTEM_KISA(g: Govde) { return [SISTEM, g.ozelStil?.talimat ? String(g.ozelStil.talimat).slice(0, 3000) : STIL[g.stil ?? "normal"]].filter(Boolean).join("\n\n"); }

/** OpenAI (chat completions) ya da Gemini (streamGenerateContent) metin akışı → aynı NDJSON olayları. */
function disAkis(saglayici: "openai" | "google", modelId: string, sistem: string, mesajlar: Govde["mesajlar"], signal: AbortSignal) {
  const kodla = new TextEncoder();
  const akis = new ReadableStream<Uint8Array>({
    async start(c) {
      const yaz = (o: ScOlay) => c.enqueue(kodla.encode(JSON.stringify(o) + "\n"));
      const baslangic = Date.now();
      let girdi = 0, cikti = 0;
      try {
        const anahtar = saglayici === "openai" ? process.env.OPENAI_API_KEY : process.env.GEMINI_API_KEY || process.env.GEMINI_KEY;
        if (!anahtar) { yaz({ t: "hata", mesaj: saglayici === "openai" ? "OpenAI anahtarı tanımlı değil." : "Google Gemini anahtarı tanımlı değil." }); return; }
        const sirali = (mesajlar ?? []).map((m) => ({ rol: m.rol === "kullanici" ? "user" : "assistant", metin: m.metin || " " }));
        let yanit: Response;
        if (saglayici === "openai") {
          yanit = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST", signal,
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${anahtar}` },
            body: JSON.stringify({ model: modelId, stream: true, stream_options: { include_usage: true }, messages: [{ role: "system", content: sistem }, ...sirali.map((m) => ({ role: m.rol, content: m.metin }))] }),
          });
        } else {
          yanit = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:streamGenerateContent?alt=sse`, {
            method: "POST", signal,
            headers: { "Content-Type": "application/json", "x-goog-api-key": anahtar },
            body: JSON.stringify({ systemInstruction: { parts: [{ text: sistem }] }, contents: sirali.map((m) => ({ role: m.rol === "user" ? "user" : "model", parts: [{ text: m.metin }] })) }),
          });
        }
        if (!yanit.ok || !yanit.body) { yaz({ t: "hata", mesaj: yanit.status === 429 ? "Yoğunluk var, biraz sonra tekrar dene." : yanit.status === 401 || yanit.status === 403 ? "Model anahtarı geçersiz." : `Model hatası (${yanit.status}).` }); return; }
        const okuyucu = yanit.body.getReader(); const coz = new TextDecoder(); let tampon = "";
        for (;;) {
          const { done, value } = await okuyucu.read(); if (done) break;
          tampon += coz.decode(value, { stream: true });
          const satirlar = tampon.split("\n"); tampon = satirlar.pop() ?? "";
          for (const satir of satirlar) {
            const v = satir.startsWith("data:") ? satir.slice(5).trim() : ""; if (!v || v === "[DONE]") continue;
            try {
              const o = JSON.parse(v);
              if (saglayici === "openai") {
                const d = o.choices?.[0]?.delta?.content; if (d) yaz({ t: "metin", metin: d });
                if (o.usage) { girdi = o.usage.prompt_tokens ?? girdi; cikti = o.usage.completion_tokens ?? cikti; }
              } else {
                const parcalar = o.candidates?.[0]?.content?.parts ?? [];
                for (const p of parcalar) if (p.text && !p.thought) yaz({ t: "metin", metin: p.text });
                if (o.usageMetadata) { girdi = o.usageMetadata.promptTokenCount ?? girdi; cikti = o.usageMetadata.candidatesTokenCount ?? cikti; }
              }
            } catch { /* yarım satır */ }
          }
        }
        yaz({ t: "bitti", sureMs: Date.now() - baslangic, girdi, cikti, model: modelId, kesildi: false });
      } catch {
        if (!signal.aborted) yaz({ t: "hata", mesaj: "Bağlantı koptu." });
      } finally { c.close(); }
    },
  });
  return new Response(akis, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}
