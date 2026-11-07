import { randomBytes } from "crypto";
import { aracTanimi, disaridanBul, disaridanCalistir } from "@/lib/build/sistemDisari";
import { hizSiniri } from "@/lib/build/ziyaretciDepo";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ anahtar: string }> };

/**
 * Sistemin MCP sunucusu (Model Context Protocol, streamable HTTP, JSON yanıtlarla): POST gövdesi JSON-RPC 2.0 ileti
 * ya da toplu dizi. initialize, notifications/initialized, ping, tools/list, tools/call desteklenir. Tek araç: sistemin
 * kendisi; girdi şeması girdi alanlarından oluşur, sonuç son adımın çıktısıdır. Sunucu akışı (GET) sunulmaz.
 */
const SURUMLER = ["2025-06-18", "2025-03-26", "2024-11-05"];
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, Mcp-Session-Id, MCP-Protocol-Version", "Access-Control-Expose-Headers": "Mcp-Session-Id" };
type Ileti = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };
const sonuc = (id: Ileti["id"], result: unknown) => ({ jsonrpc: "2.0", id: id ?? null, result });
const hataYaz = (id: Ileti["id"], code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

async function isle(m: Ileti, h: NonNullable<Awaited<ReturnType<typeof disaridanBul>>>): Promise<unknown | null> {
  if (!m || m.jsonrpc !== "2.0" || typeof m.method !== "string") return hataYaz(m?.id, -32600, "Geçersiz JSON-RPC iletisi.");
  const bildirim = m.id === undefined;
  switch (m.method) {
    case "initialize": {
      const istenen = String(m.params?.protocolVersion ?? "");
      return sonuc(m.id, { protocolVersion: SURUMLER.includes(istenen) ? istenen : SURUMLER[0], capabilities: { tools: { listChanged: false } }, serverInfo: { name: `vayra-${aracTanimi(h.s).name}`, title: `Vayra: ${h.s.ad}`, version: String(h.s.yayin?.surum ?? 0) }, instructions: `Bu sunucu Vayra Build'deki "${h.s.ad}" sistemini tek araç olarak sunar.` });
    }
    case "notifications/initialized": case "notifications/cancelled": return null;
    case "ping": return sonuc(m.id, {});
    case "tools/list": return sonuc(m.id, { tools: [aracTanimi(h.s)] });
    case "tools/call": {
      const ad = String(m.params?.name ?? "");
      if (ad !== aracTanimi(h.s).name) return hataYaz(m.id, -32602, `Bilinmeyen araç: ${ad}`);
      if (!hizSiniri(`sistem-mcp:${h.s.id}`, 60, 60_000)) return sonuc(m.id, { content: [{ type: "text", text: "Çok fazla çağrı; dakikada en çok 60." }], isError: true });
      const r = await disaridanCalistir(h, m.params?.arguments ?? {}, "mcp", 55_000);
      if (r.tur === "hata") return sonuc(m.id, { content: [{ type: "text", text: `${r.hata}${r.ayrinti?.length ? ` ${r.ayrinti.join(", ")}.` : ""}` }], isError: true });
      if (r.tur === "suruyor") return sonuc(m.id, { content: [{ type: "text", text: `Çalışma sürüyor (kimlik ${r.c.id}); sonuç Vayra'daki çalışma geçmişinde görünecek.` }], isError: false });
      const x = r.sonuc;
      const basarili = x.durum === "basarili" || x.durum === "durdu";
      const yapili = x.veri && typeof x.veri === "object" && !Array.isArray(x.veri) ? x.veri : undefined;
      return sonuc(m.id, { content: [{ type: "text", text: basarili ? (x.cikti || JSON.stringify(x.veri ?? null)) : `Sistem başarısız oldu: ${x.hata ?? "bilinmeyen hata"}` }], ...(basarili && yapili ? { structuredContent: yapili } : {}), isError: !basarili });
    }
    case "resources/list": return sonuc(m.id, { resources: [] });
    case "prompts/list": return sonuc(m.id, { prompts: [] });
  }
  return bildirim ? null : hataYaz(m.id, -32601, `Desteklenmeyen yöntem: ${m.method}`);
}

export async function POST(req: Request, { params }: Ctx) {
  const h = await disaridanBul((await params).anahtar);
  if (!h || !h.s.disari?.mcp) return Response.json(hataYaz(null, -32001, "Geçersiz anahtar ya da MCP kapalı."), { status: 404, headers: CORS });
  let g: unknown;
  try { g = await req.json(); } catch { return Response.json(hataYaz(null, -32700, "Gövde JSON değil."), { status: 400, headers: CORS }); }
  const l = Array.isArray(g) ? (g as Ileti[]) : [g as Ileti];
  const cevaplar = (await Promise.all(l.slice(0, 20).map((m) => isle(m, h)))).filter((x) => x !== null);
  const baslik: Record<string, string> = { ...CORS, "Cache-Control": "no-store" };
  if (l.some((m) => m?.method === "initialize")) baslik["Mcp-Session-Id"] = randomBytes(16).toString("hex");
  if (!cevaplar.length) return new Response(null, { status: 202, headers: baslik });
  return Response.json(Array.isArray(g) ? cevaplar : cevaplar[0], { headers: baslik });
}

/** Sunucudan istemciye akış sunulmuyor (yalnız istek ve yanıt). */
export function GET() { return new Response(null, { status: 405, headers: { ...CORS, Allow: "POST, DELETE, OPTIONS" } }); }
export function DELETE() { return new Response(null, { status: 204, headers: CORS }); }
export function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }
