import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { claudeBagli } from "./disAjan";
import { adUret } from "./yetenekDepo";

/**
 * "Ne öğretmek istiyorsun" kutusundan yetenek taslağı. Claude bağlıysa SKILL.md kurallarına uygun ad, ne zaman
 * kullanılacağını söyleyen açıklama ve adım adım gövde yazar; bağlı değilse tariften dürüst bir iskelet çıkar.
 */
export async function yetenekTaslagi(tarif: string): Promise<{ baslik: string; ad: string; aciklama: string; govde: string; ornekler: string[]; yapayZeka: boolean }> {
  const t = tarif.trim();
  const ilk = t.split(/[.!?\n]/)[0].trim();
  const baslik = (ilk.length > 48 ? ilk.slice(0, 48).replace(/\s+\S*$/, "") : ilk).replace(/^\p{Ll}/u, (h) => h.toLocaleUpperCase("tr")) || "Yeni yetenek";
  const iskelet = {
    baslik, ad: adUret(baslik), aciklama: `${t.replace(/\s+/g, " ").slice(0, 300)} gerektiğinde kullan.`,
    govde: `# ${baslik}\n\n## Amaç\n${t}\n\n## Adımlar\n1. …\n2. …\n3. …\n\n## Kurallar\n- …\n\n## Çıktı biçimi\n…`, ornekler: [], yapayZeka: false,
  };
  if (!claudeBagli()) return iskelet;
  try {
    const client = new Anthropic();
    const r = await client.messages.create({
      model: "claude-sonnet-5-5", max_tokens: 6000,
      system: "Sen yapay zekâ ajanları için yetenek (Agent Skill, SKILL.md) yazan bir uzmansın. Açıklama üçüncü şahısla, NE yaptığını ve NE ZAMAN kullanılacağını söyler (en çok 1024 karakter). Gövde Türkçe, adım adım, somut kurallar ve çıktı biçimiyle; gereksiz genel bilgi yok. Ad küçük harf ve tireli.",
      tools: [{
        name: "yetenek_yaz", description: "Yetenek taslağını kaydeder.",
        input_schema: {
          type: "object", additionalProperties: false, required: ["baslik", "ad", "aciklama", "govde", "ornekler"],
          properties: {
            baslik: { type: "string" }, ad: { type: "string", description: "küçük harf, rakam ve tire; en çok 64 karakter" },
            aciklama: { type: "string" }, govde: { type: "string", description: "Markdown talimat gövdesi" },
            ornekler: { type: "array", items: { type: "string" }, maxItems: 5, description: "Yeteneği tetiklemesi gereken örnek istekler" },
          },
        },
      }],
      tool_choice: { type: "tool", name: "yetenek_yaz" },
      messages: [{ role: "user", content: `Yeteneğin tarifi:\n<tarif>\n${t.slice(0, 4000)}\n</tarif>` }],
    });
    const b = r.content.find((x) => x.type === "tool_use");
    const g = (b && b.type === "tool_use" ? b.input : null) as Record<string, unknown> | null;
    if (!g || typeof g.govde !== "string") return iskelet;
    const ad = typeof g.ad === "string" && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(g.ad) ? g.ad.slice(0, 64) : adUret(String(g.baslik ?? baslik));
    return {
      baslik: String(g.baslik ?? baslik).slice(0, 80), ad, aciklama: String(g.aciklama ?? "").slice(0, 1024), govde: g.govde.slice(0, 80_000),
      ornekler: (Array.isArray(g.ornekler) ? g.ornekler : []).filter((x): x is string => typeof x === "string").slice(0, 5), yapayZeka: true,
    };
  } catch { return iskelet; }
}
