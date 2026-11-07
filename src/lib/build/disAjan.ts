import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import type { BuildModel } from "./modeller";

/**
 * Claude dışındaki modeller (GPT, Gemini, Kimi, DeepSeek, Grok, Qwen, GLM, Mistral, MiniMax …) için ajan turu.
 * Hepsi OpenAI uyumlu Chat Completions + araç çağırma ile akıtılır: sağlayıcının anahtarı varsa doğrudan,
 * yoksa OPENROUTER_API_KEY ile OpenRouter üzerinden (OPENROUTER_BASE_URL ile başka bir OpenAI uyumlu ağ geçidi de verilebilir). Geçmiş sunucuda tek biçimde (Anthropic ileti biçimi) tutulur;
 * burada OpenAI biçimine çevrilir, yanıt da geri çevrilir. Sağlayıcıya özgü ekler (_ek: Gemini düşünce imzası,
 * DeepSeek/Kimi akıl yürütme metni) saklanır ve yalnız aynı sağlayıcıya geri gönderilir; Claude'a giderken atılır.
 */

const DOGRUDAN: Partial<Record<BuildModel["saglayici"], { url: string; env: string; akil?: "reasoning_content" }>> = {
  openai: { url: "https://api.openai.com/v1", env: "OPENAI_API_KEY" },
  google: { url: "https://generativelanguage.googleapis.com/v1beta/openai", env: "GEMINI_API_KEY" },
  moonshot: { url: "https://api.moonshot.ai/v1", env: "MOONSHOT_API_KEY", akil: "reasoning_content" },
  deepseek: { url: "https://api.deepseek.com/v1", env: "DEEPSEEK_API_KEY", akil: "reasoning_content" },
  xai: { url: "https://api.x.ai/v1", env: "XAI_API_KEY" },
};

export type Baglanti = { yol: "dogrudan" | "openrouter"; url: string; anahtar: string; model: string; akil?: "reasoning_content" | "reasoning" };

/** Modelin bu sunucuda nasıl çağrılacağı; bağlantı yoksa null. Claude yalnız Anthropic SDK ile (rotada). */
export function baglantiBul(m: BuildModel): Baglanti | null {
  if (m.saglayici === "anthropic") return null;
  const d = DOGRUDAN[m.saglayici];
  const anahtar = d ? process.env[d.env] || (m.saglayici === "google" ? process.env.GEMINI_KEY : "") : "";
  if (d && anahtar && m.dogrudan) return { yol: "dogrudan", url: d.url, anahtar, model: m.dogrudan, akil: d.akil };
  if (process.env.OPENROUTER_API_KEY && m.or) return { yol: "openrouter", url: (process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/+$/, ""), anahtar: process.env.OPENROUTER_API_KEY, model: m.or, akil: "reasoning" };
  return null;
}
export const claudeBagli = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
export const modelBagli = (m: BuildModel) => (m.saglayici === "anthropic" ? claudeBagli() : !!baglantiBul(m));

type Blok = Record<string, unknown> & { type: string };
type Ileti = { role: "user" | "assistant"; content: string | Blok[]; _ek?: { akil?: string; saglayici?: string } };

/** Claude'a gitmeden önce sağlayıcıya özgü ekleri atar (Claude'un kendi blokları değişmez; önek bozulmaz). */
export function claudeIcinTemizle(l: unknown[]): Anthropic.Beta.BetaMessageParam[] {
  return (l as Ileti[]).map((m) => {
    if (!m._ek && !(Array.isArray(m.content) && m.content.some((b) => "_ek" in b))) return m as Anthropic.Beta.BetaMessageParam;
    const content = Array.isArray(m.content) ? m.content.map((b) => { if (!("_ek" in b)) return b; const { _ek, ...temiz } = b; void _ek; return temiz; }) : m.content;
    return { role: m.role, content } as Anthropic.Beta.BetaMessageParam;
  });
}

type OaIleti = Record<string, unknown>;

function oaCevir(sistem: string, l: Ileti[], m: BuildModel, b: Baglanti): OaIleti[] {
  const out: OaIleti[] = [{ role: "system", content: sistem }];
  for (const x of l) {
    if (typeof x.content === "string") { out.push({ role: x.role, content: x.content }); continue; }
    if (x.role === "user") {
      for (const k of x.content.filter((k) => k.type === "tool_result")) {
        const ic = k.content as string | { type: string; text?: string }[];
        out.push({ role: "tool", tool_call_id: k.tool_use_id, content: typeof ic === "string" ? ic : (ic ?? []).map((p) => p.text ?? "").join("\n") || "Tamam." });
      }
      const parcalar: OaIleti[] = [];
      for (const k of x.content) {
        if (k.type === "text") parcalar.push({ type: "text", text: k.text });
        else if (k.type === "image") {
          const s = k.source as { type: string; media_type?: string; data?: string; url?: string };
          if (!m.gorsel) { parcalar.push({ type: "text", text: "(Kullanıcı bir görsel ekledi; bu model görsel okuyamıyor.)" }); continue; }
          parcalar.push({ type: "image_url", image_url: { url: s.type === "base64" ? `data:${s.media_type};base64,${s.data}` : s.url } });
        }
      }
      if (parcalar.length) out.push({ role: "user", content: parcalar });
    } else {
      const metin = x.content.filter((k) => k.type === "text").map((k) => k.text as string).join("\n");
      const cagrilar = x.content.filter((k) => k.type === "tool_use").map((k) => ({
        id: k.id, type: "function", function: { name: k.name, arguments: JSON.stringify(k.input ?? {}) },
        ...(k._ek && (k._ek as { saglayici?: string }).saglayici === m.saglayici ? { extra_content: (k._ek as { extra?: unknown }).extra } : {}),
      }));
      const i: OaIleti = { role: "assistant", content: metin || (cagrilar.length ? null : " ") };
      if (cagrilar.length) i.tool_calls = cagrilar;
      if (b.akil && x._ek?.akil && x._ek.saglayici === m.saglayici) i[b.akil === "reasoning" ? "reasoning" : "reasoning_content"] = x._ek.akil;
      out.push(i);
    }
  }
  return out;
}

export type TurSonucu = {
  /** Geçmişe eklenecek asistan iletisi (Anthropic biçimi + _ek). */
  ileti: Ileti;
  cagrilar: { id: string; name: string; input: unknown }[];
  durma: "end_turn" | "tool_use" | "max_tokens" | "refusal";
  kullanim: { girdi: number; cikti: number; onbellek: number; yazilan: number };
};

export type Olaylar = {
  dusunce: (s: string) => void;
  metin: (s: string) => void;
  aracBasla: (i: number, ad: string) => void;
  aracGirdi: (i: number, parca: string) => void;
};

/** Tek model çağrısı (akışlı). Araç tanımları Anthropic biçiminden çevrilir. */
export async function disTur(g: { model: BuildModel; baglanti: Baglanti; sistem: string; gecmis: unknown[]; araclar: Anthropic.Beta.BetaTool[]; efor: string; signal: AbortSignal; olay: Olaylar }): Promise<TurSonucu> {
  const { model: m, baglanti: b } = g;
  const govde: Record<string, unknown> = {
    model: b.model, stream: true, stream_options: { include_usage: true },
    messages: oaCevir(g.sistem, g.gecmis as Ileti[], m, b),
    tools: g.araclar.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.input_schema } })),
  };
  const efor = g.efor === "max" ? "high" : g.efor;
  if (b.yol === "openrouter") { govde.max_tokens = 32000; govde.reasoning = { effort: efor }; }
  else if (m.saglayici === "openai") { govde.max_completion_tokens = 64000; govde.reasoning_effort = efor; }
  else govde.max_tokens = 32000;

  const basliklar: Record<string, string> = { "Content-Type": "application/json", Authorization: `Bearer ${b.anahtar}` };
  if (b.yol === "openrouter") Object.assign(basliklar, { "HTTP-Referer": "https://vayra.app", "X-Title": "Vayra Build" });
  let r = await fetch(`${b.url}/chat/completions`, { method: "POST", headers: basliklar, body: JSON.stringify(govde), signal: g.signal });
  if (r.status === 400) {
    // Bazı modeller çıktı sınırını ya da akıl yürütme ayarını kabul etmez: bir kez sade istekle dene.
    const metin = await r.text();
    if (/max_(completion_)?tokens|reasoning/i.test(metin)) {
      delete govde.max_tokens; delete govde.max_completion_tokens; delete govde.reasoning; delete govde.reasoning_effort;
      r = await fetch(`${b.url}/chat/completions`, { method: "POST", headers: basliklar, body: JSON.stringify(govde), signal: g.signal });
    } else throw new DisHata(400, metin.slice(0, 300));
  }
  if (!r.ok || !r.body) throw new DisHata(r.status, (await r.text().catch(() => "")).slice(0, 300));

  let metin = "", akil = "", durma: TurSonucu["durma"] = "end_turn";
  const araclar: { id: string; ad: string; json: string; ek?: unknown }[] = [];
  const kullanim = { girdi: 0, cikti: 0, onbellek: 0, yazilan: 0 };
  const okuyucu = r.body.getReader(), coz = new TextDecoder();
  let tampon = "";
  for (;;) {
    const { done, value } = await okuyucu.read();
    if (done) break;
    tampon += coz.decode(value, { stream: true });
    let n: number;
    while ((n = tampon.indexOf("\n")) >= 0) {
      const satir = tampon.slice(0, n).trim(); tampon = tampon.slice(n + 1);
      if (!satir.startsWith("data:")) continue;
      const veri = satir.slice(5).trim();
      if (veri === "[DONE]") continue;
      let o: { choices?: { delta?: Record<string, unknown>; finish_reason?: string | null }[]; usage?: { prompt_tokens?: number; completion_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } }; error?: { message?: string; code?: number } };
      try { o = JSON.parse(veri); } catch { continue; }
      if (o.error) throw new DisHata(o.error.code ?? 500, o.error.message ?? "Sağlayıcı hatası");
      if (o.usage) {
        const onb = o.usage.prompt_tokens_details?.cached_tokens ?? 0;
        kullanim.girdi = Math.max(0, (o.usage.prompt_tokens ?? 0) - onb); kullanim.onbellek = onb; kullanim.cikti = o.usage.completion_tokens ?? 0;
      }
      const c = o.choices?.[0];
      if (!c) continue;
      const d = c.delta ?? {};
      const ak = (d.reasoning_content ?? d.reasoning) as string | undefined;
      if (typeof ak === "string" && ak) { akil += ak; g.olay.dusunce(ak); }
      if (typeof d.content === "string" && d.content) { metin += d.content; g.olay.metin(d.content); }
      for (const t of (d.tool_calls as { index?: number; id?: string; function?: { name?: string; arguments?: string }; extra_content?: unknown }[] | undefined) ?? []) {
        const i = t.index ?? araclar.length;
        if (!araclar[i]) { araclar[i] = { id: t.id || `cagri_${Date.now().toString(36)}_${i}`, ad: t.function?.name ?? "", json: "" }; if (araclar[i].ad) g.olay.aracBasla(i, araclar[i].ad); }
        const a = araclar[i];
        if (t.id && a.id.startsWith("cagri_")) a.id = t.id;
        if (t.function?.name && !a.ad) { a.ad = t.function.name; g.olay.aracBasla(i, a.ad); }
        if (t.extra_content) a.ek = t.extra_content;
        if (t.function?.arguments) { a.json += t.function.arguments; g.olay.aracGirdi(i, t.function.arguments); }
      }
      if (c.finish_reason) durma = c.finish_reason === "tool_calls" ? "tool_use" : c.finish_reason === "length" ? "max_tokens" : c.finish_reason === "content_filter" ? "refusal" : araclar.length ? "tool_use" : "end_turn";
    }
  }
  const cagrilar = araclar.filter(Boolean).map((a) => {
    let input: unknown = {};
    try { input = a.json ? JSON.parse(a.json) : {}; } catch { input = { __yarim: true }; }
    return { id: a.id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64), name: a.ad, input, ek: a.ek };
  });
  if (cagrilar.length && durma === "end_turn") durma = "tool_use";
  const content: Blok[] = [];
  if (metin) content.push({ type: "text", text: metin });
  for (const c of cagrilar) content.push({ type: "tool_use", id: c.id, name: c.name, input: c.input, ...(c.ek ? { _ek: { saglayici: m.saglayici, extra: c.ek } } : {}) });
  if (!content.length) content.push({ type: "text", text: " " });
  return { ileti: { role: "assistant", content, ...(akil ? { _ek: { akil: akil.slice(0, 60000), saglayici: m.saglayici } } : {}) }, cagrilar, durma, kullanim };
}

export class DisHata extends Error {
  constructor(public durum: number, ayrinti: string) { super(ayrinti); }
}
