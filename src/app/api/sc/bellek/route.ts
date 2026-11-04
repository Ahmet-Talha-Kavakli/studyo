import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Usta otomatik bellek — son mesajdan kullanıcı hakkında kalıcı bilgi çıkarır (Claude/ChatGPT "memory").
   Hızlı model (Haiku) ile tek istek. Kimlik bilgisi yoksa hiçbir şey eklemez: uydurma anı yazmak yanıltıcı olur. */

const SISTEM = `Bir sohbetten kullanıcının son mesajı ve asistanın yanıtı verilecek; ayrıca bellekte zaten kayıtlı bilgiler.
Görevin: kullanıcı hakkında GELECEKTEKİ sohbetlerde işe yarayacak kalıcı bilgileri çıkarmak (kimliği, işi, projeleri, kalıcı tercihleri).
Yazma: tek seferlik istekler, sorunun konusu, asistanın söyledikleri, tahminler, bellekte zaten olanlar,
hassas bilgiler (sağlık, din, siyasi görüş, cinsel yönelim, etnik köken, finansal hesap, şifre, kimlik numarası).
Çoğu mesajda yeni kalıcı bilgi yoktur; o zaman yalnızca YOK yaz.
Varsa en çok 2 satır yaz; her satır kullanıcının dilinde, kısa, tek cümle ve kullanıcıyı özne alan bir bilgi olsun
(ör. "Kadıköy'de bir kahve dükkânı işletiyor", "Yanıtların kısa ve maddeli olmasını istiyor"). Numara ya da açıklama ekleme.`;

export async function POST(req: Request) {
  let g: { soru?: string; yanit?: string; mevcut?: string[] };
  try { g = await req.json(); } catch { return Response.json({ anilar: [] }, { status: 400 }); }
  if (!g.soru?.trim() || g.soru.trim().length < 12) return Response.json({ anilar: [] });
  if (!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN)) return Response.json({ anilar: [], demo: true });
  try {
    const client = new Anthropic();
    const mevcut = (g.mevcut ?? []).slice(0, 60).map((m) => `- ${m}`).join("\n") || "(boş)";
    const m = await client.messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 200,
      system: SISTEM,
      messages: [{ role: "user", content: `<bellek>\n${mevcut}\n</bellek>\n<kullanici>\n${g.soru.slice(0, 3000)}\n</kullanici>\n<asistan>\n${(g.yanit ?? "").slice(0, 3000)}\n</asistan>` }],
    }, { signal: req.signal });
    const metin = m.content.map((b) => (b.type === "text" ? b.text : "")).join("\n").trim();
    if (/^YOK\b/i.test(metin)) return Response.json({ anilar: [] });
    const anilar = metin.split("\n").map((s) => s.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").replace(/^["“]|["”]$/g, "").trim())
      .filter((s) => s.length > 5 && s.length < 200 && !/^YOK\b/i.test(s)).slice(0, 2);
    return Response.json({ anilar });
  } catch {
    return Response.json({ anilar: [] });
  }
}
