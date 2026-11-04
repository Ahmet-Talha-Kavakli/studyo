import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Usta takip önerileri — yanıttan sonra kullanıcının sorabileceği 3 kısa soru.
   Hızlı model (Haiku) ile tek istek; kimlik bilgisi yoksa genel ama işe yarar öneriler döner (demo). */

const DEMO = ["Bunu daha kısa özetler misin?", "Somut bir örnekle açıklar mısın?", "Adım adım nasıl uygularım?"];

const SISTEM = `Bir sohbetteki son soru ve yanıt verilecek. Kullanıcının bundan sonra sorabileceği en faydalı 3 takip sorusunu yaz.
Kurallar: kullanıcının dilinde, kullanıcının ağzından, her biri en çok 60 karakter, birbirinden farklı yönlerde.
Yalnızca 3 satır yaz; numara, tırnak ya da açıklama ekleme.`;

export async function POST(req: Request) {
  let g: { soru?: string; yanit?: string };
  try { g = await req.json(); } catch { return Response.json({ oneriler: [] }, { status: 400 }); }
  if (!g.soru?.trim()) return Response.json({ oneriler: [] });
  if (!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN)) return Response.json({ oneriler: DEMO, demo: true });
  try {
    const client = new Anthropic();
    const m = await client.messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 300,
      system: SISTEM,
      messages: [{ role: "user", content: `<soru>\n${g.soru.slice(0, 2000)}\n</soru>\n<yanit>\n${(g.yanit ?? "").slice(0, 6000)}\n</yanit>` }],
    }, { signal: req.signal });
    const metin = m.content.map((b) => (b.type === "text" ? b.text : "")).join("\n");
    const oneriler = metin.split("\n").map((s) => s.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").replace(/^["“]|["”]$/g, "").trim()).filter((s) => s.length > 3 && s.length < 120).slice(0, 3);
    return Response.json({ oneriler });
  } catch {
    return Response.json({ oneriler: [] });
  }
}
