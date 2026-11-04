import Anthropic from "@anthropic-ai/sdk";
import { icerikDenetle } from "@/lib/moderasyon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Brif yazım yardımcısı (Notion AI gibi), akışlı. Gövde:
 *   { islem, metin?, istek?, sayfa?, proje? }
 *   islem: devam | ozetle | fikir | eylem | duzelt | kisalt | uzat | profesyonel | ingilizce | turkce | maddele | serbest
 *   metin: seçili metin (seçim işlemlerinde), istek: serbest istek, sayfa: brifin düz metni (bağlam).
 * Yanıt Server-Sent Events: {t:"metin", d} parçaları, sonda {t:"bitti"} ya da {t:"hata", m}.
 * Kimlik yoksa {ok:true, demo:true} döner; istemci yerel örnek sonuç üretir ve "Demo" diye işaretler.
 */

const ISLEM: Record<string, string> = {
  devam: "Sayfanın kaldığı yerden, aynı ton ve konuda bir paragraf daha yaz.",
  ozetle: "Sayfayı 4-6 maddede özetle. Her madde tek cümle.",
  fikir: "Bu proje için 6 yaratıcı fikir öner; her biri tek satırlık madde.",
  eylem: "Sayfadan yapılacak işleri çıkar; her biri '- [ ] ' ile başlayan kısa bir görev satırı olsun.",
  duzelt: "Seçili metnin yazım ve dilbilgisi hatalarını düzelt; anlamı ve tonu değiştirme.",
  kisalt: "Seçili metni anlamını koruyarak yaklaşık yarı uzunluğa indir.",
  uzat: "Seçili metni somut ayrıntılarla yaklaşık iki katına çıkar.",
  profesyonel: "Seçili metni bir ajans brifine uygun, net ve profesyonel bir tona çevir.",
  ingilizce: "Seçili metni doğal bir İngilizceye çevir.",
  turkce: "Seçili metni doğal bir Türkçeye çevir.",
  maddele: "Seçili metni kısa maddelere böl; her madde '- ' ile başlasın.",
  serbest: "Kullanıcının isteğini yerine getir.",
};
const SECIMLI = new Set(["duzelt", "kisalt", "uzat", "profesyonel", "ingilizce", "turkce", "maddele"]);

const kimlikVar = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

export async function POST(req: Request) {
  let g: { islem?: string; metin?: string; istek?: string; sayfa?: string; proje?: string };
  try { g = await req.json(); } catch { return Response.json({ ok: false, hata: "Geçersiz istek." }, { status: 400 }); }
  const islem = g.islem && ISLEM[g.islem] ? g.islem : "serbest";
  const metin = (g.metin ?? "").slice(0, 6000), istek = (g.istek ?? "").slice(0, 1000), sayfa = (g.sayfa ?? "").slice(0, 12000);
  if (SECIMLI.has(islem) && !metin.trim()) return Response.json({ ok: false, hata: "Önce bir metin seç." }, { status: 400 });
  if (islem === "serbest" && !istek.trim()) return Response.json({ ok: false, hata: "Ne yazmamı istediğini yaz." }, { status: 400 });
  const d = icerikDenetle(`${istek} ${metin}`);
  if (!d.izin) return Response.json({ ok: false, hata: d.mesaj }, { status: 422 });
  if (!kimlikVar()) return Response.json({ ok: true, demo: true });

  const sistem = `Sen Vayra'da bir yaratıcı projenin brif yazım yardımcısısın. Türkçe yazarsın (çeviri istenmedikçe).
Yalnız istenen metni döndür: giriş cümlesi, açıklama ya da kapanış ekleme. Emoji kullanma.
Biçim: düz paragraflar; gerekiyorsa "## " başlık, "- " madde, "1. " numaralı, "- [ ] " görev satırları. Kalın ya da tablo kullanma.`;
  const icerik = [
    g.proje ? `<proje>${g.proje}</proje>` : "",
    sayfa ? `<sayfa>\n${sayfa}\n</sayfa>` : "",
    metin ? `<secim>\n${metin}\n</secim>` : "",
    `<gorev>${ISLEM[islem]}${istek ? `\n${istek}` : ""}</gorev>`,
  ].filter(Boolean).join("\n\n");

  const kodla = new TextEncoder();
  const akis = new ReadableStream({
    async start(ctrl) {
      const yolla = (o: unknown) => { try { ctrl.enqueue(kodla.encode(`data: ${JSON.stringify(o)}\n\n`)); } catch { /* istemci ayrıldı */ } };
      try {
        const client = new Anthropic();
        const stream = client.messages.stream({
          model: "claude-opus-5-5",
          max_tokens: 4000,
          system: sistem,
          output_config: { effort: "low" },
          messages: [{ role: "user", content: icerik }],
        }, { signal: req.signal });
        for await (const e of stream) if (e.type === "content_block_delta" && e.delta.type === "text_delta") yolla({ t: "metin", d: e.delta.text });
        const son = await stream.finalMessage();
        if (son.stop_reason === "refusal") yolla({ t: "hata", m: "Bu isteği yazamadım; farklı anlatmayı dene." });
        else yolla({ t: "bitti" });
      } catch (e) {
        if ((e as Error).name !== "AbortError") yolla({ t: "hata", m: "Yazım yardımcısı yanıt veremedi. Biraz sonra yeniden dene." });
      }
      ctrl.close();
    },
  });
  return new Response(akis, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" } });
}
