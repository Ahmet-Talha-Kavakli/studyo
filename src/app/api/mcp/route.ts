import { NextRequest, NextResponse } from "next/server";
import { MODELLER } from "@/lib/catalog";
import { MCP_ARACLAR, MCP_SURUMLER, MCP_SUNUCU } from "@/lib/mcp/araclar";

export const runtime = "nodejs";

/**
 * Vayra MCP sunucusu — Model Context Protocol, Streamable HTTP taşıması (JSON yanıt kipi).
 *
 *   POST /api/mcp   JSON-RPC 2.0 (tekli ya da toplu)
 *   GET  /api/mcp   405 — sunucu tarafından başlatılan akış (SSE) yok
 *
 * Kimlik: "Authorization: Bearer vy_live_…" — /api/v1 ile aynı anahtarlar. initialize, ping ve
 * tools/list anahtarsız çalışır (istemciler araçları kurulumda görebilsin); tools/call anahtar ister.
 * Araç çağrıları aynı başlıkla /api/v1'e iletilir: doğrulama, kredi, hız sınırı, harcama sınırı,
 * webhook'lar ve istek günlüğü REST API ile birebir aynıdır.
 */

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
  "access-control-allow-headers": "authorization, content-type, mcp-session-id, mcp-protocol-version, accept",
  "access-control-expose-headers": "mcp-session-id",
};

type Istek = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };
type Sonuc = { jsonrpc: "2.0"; id: string | number | null; result?: unknown; error?: { code: number; message: string; data?: unknown } };

const hataYaniti = (id: Istek["id"], code: number, message: string, data?: unknown): Sonuc => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message, ...(data !== undefined ? { data } : {}) } });

function kokAdres(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  return `${proto}://${host}`;
}

/** /api/v1'e aynı kimlikle iç istek. */
async function v1(req: NextRequest, yontem: "GET" | "POST", yol: string, govde?: unknown) {
  const r = await fetch(`${kokAdres(req)}/api/v1${yol}`, {
    method: yontem,
    headers: { authorization: req.headers.get("authorization") ?? "", "content-type": "application/json", "user-agent": "vayra-mcp/1.0" },
    body: govde === undefined ? undefined : JSON.stringify(govde),
    cache: "no-store",
  });
  const j = await r.json().catch(() => null);
  return { durum: r.status, j: j as Record<string, unknown> | null };
}

/** Araç sonucu: okunur özet + makine için structuredContent. Hata ise isError (protokol hatası değil). */
function aracSonucu(veri: unknown, ozet: string, hata = false) {
  return { content: [{ type: "text", text: `${ozet}\n\n${JSON.stringify(veri, null, 2)}` }], structuredContent: veri, ...(hata ? { isError: true } : {}) };
}

function uretimOzeti(g: Record<string, unknown>) {
  const out = g.output as { urls?: string[] } | null;
  const durum: Record<string, string> = { queued: "kuyrukta", processing: "işleniyor", succeeded: "tamamlandı", failed: "başarısız", canceled: "iptal edildi" };
  const satirlar = [`Üretim ${g.id} · ${g.model} · ${durum[String(g.status)] ?? g.status} · ${g.credits ?? 0} kredi`];
  if (out?.urls?.length) satirlar.push(...out.urls.map((u, i) => `Çıktı ${i + 1}: ${u}`));
  if (g.status === "queued" || g.status === "processing") satirlar.push(`Bitince sonucu almak için get_generation aracını id="${g.id}" ile çağır.`);
  const err = g.error as { message?: string } | null;
  if (err?.message) satirlar.push(`Hata: ${err.message}`);
  return satirlar.join("\n");
}

async function aracCalistir(req: NextRequest, ad: string, a: Record<string, unknown>) {
  const v1Hata = (j: Record<string, unknown> | null) => {
    const e = (j?.error ?? {}) as { code?: string; message?: string };
    return aracSonucu(j ?? {}, `Hata (${e.code ?? "bilinmiyor"}): ${e.message ?? "İstek başarısız."}`, true);
  };
  switch (ad) {
    case "list_models": {
      const { durum, j } = await v1(req, "GET", `/models${a.type ? `?type=${encodeURIComponent(String(a.type))}` : ""}`);
      if (durum !== 200) return v1Hata(j);
      const liste = (j!.data as { id: string; name: string; type: string; credits?: number }[]);
      return aracSonucu(j, `${liste.length} model:\n${liste.map((m) => `• ${m.id} — ${m.name} (${m.type}${m.credits ? `, ${m.credits} kredi` : ""})`).join("\n")}`);
    }
    case "get_model": {
      const { durum, j } = await v1(req, "GET", `/models/${encodeURIComponent(String(a.model ?? ""))}`);
      if (durum !== 200) return v1Hata(j);
      return aracSonucu(j, `${j!.name} (${j!.id}) — girdi şeması aşağıda.`);
    }
    case "generate": {
      const { durum, j } = await v1(req, "POST", "/generations", { model: a.model, input: a.input ?? {}, sync: a.wait !== false, ...(a.metadata ? { metadata: a.metadata } : {}) });
      if (durum !== 200 && durum !== 201) return v1Hata(j);
      return aracSonucu(j, uretimOzeti(j!), j!.status === "failed");
    }
    case "get_generation": {
      const { durum, j } = await v1(req, "GET", `/generations/${encodeURIComponent(String(a.id ?? ""))}`);
      if (durum !== 200) return v1Hata(j);
      return aracSonucu(j, uretimOzeti(j!));
    }
    case "list_generations": {
      const q = new URLSearchParams();
      if (a.limit) q.set("limit", String(a.limit));
      if (a.status) q.set("status", String(a.status));
      if (a.model) q.set("model", String(a.model));
      const { durum, j } = await v1(req, "GET", `/generations${q.size ? `?${q}` : ""}`);
      if (durum !== 200) return v1Hata(j);
      const liste = (j!.data as Record<string, unknown>[]) ?? [];
      return aracSonucu(j, liste.length ? liste.map((g) => `• ${g.id} · ${g.model} · ${g.status} · ${g.created_at}`).join("\n") : "Bu anahtarla son 24 saatte üretim yok.");
    }
    case "cancel_generation": {
      const { durum, j } = await v1(req, "POST", `/generations/${encodeURIComponent(String(a.id ?? ""))}/cancel`);
      if (durum !== 200) return v1Hata(j);
      return aracSonucu(j, `Üretim ${j!.id} iptal edildi; kredisi iade edildi.`);
    }
    case "get_account": {
      const { durum, j } = await v1(req, "GET", "/account");
      if (durum !== 200) return v1Hata(j);
      const c = (j!.credits ?? {}) as { available?: number | null; monthly_limit?: number | null; spent_this_month?: number };
      return aracSonucu(j, `Kullanılabilir kredi: ${c.available ?? "test anahtarı (kredi harcamaz)"} · bu ay harcanan: ${c.spent_this_month ?? 0}${c.monthly_limit ? ` / ${c.monthly_limit}` : ""}`);
    }
  }
  return null;
}

async function isle(req: NextRequest, m: Istek): Promise<Sonuc | null> {
  if (m.jsonrpc !== "2.0" || typeof m.method !== "string") return hataYaniti(m.id, -32600, "Geçersiz JSON-RPC isteği");
  const bildirim = m.id === undefined;
  if (bildirim) return null; // notifications/initialized, notifications/cancelled … yanıt gerektirmez

  switch (m.method) {
    case "initialize": {
      const istenen = String(m.params?.protocolVersion ?? "");
      return { jsonrpc: "2.0", id: m.id!, result: {
        protocolVersion: MCP_SURUMLER.includes(istenen) ? istenen : MCP_SURUMLER[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: MCP_SUNUCU,
        instructions: "Vayra ile görsel, video, ses, müzik ve 3D üret. Önce list_models ile modeli seç, get_model ile girdileri öğren, generate ile üret. Uzun videolarda wait=false verip get_generation ile durumu sorgula. Her üretim kredi harcar; get_account bakiyeyi gösterir.",
      } };
    }
    case "ping": return { jsonrpc: "2.0", id: m.id!, result: {} };
    case "tools/list": return { jsonrpc: "2.0", id: m.id!, result: { tools: MCP_ARACLAR } };
    case "tools/call": {
      const ad = String(m.params?.name ?? "");
      if (!MCP_ARACLAR.some((t) => t.name === ad)) return hataYaniti(m.id, -32602, `Bilinmeyen araç: ${ad}`);
      if (!req.headers.get("authorization")) return hataYaniti(m.id, -32001, "Kimlik gerekli: Authorization: Bearer <Vayra API anahtarı> başlığı ekle.");
      const s = await aracCalistir(req, ad, (m.params?.arguments ?? {}) as Record<string, unknown>);
      return { jsonrpc: "2.0", id: m.id!, result: s };
    }
    case "resources/list": return { jsonrpc: "2.0", id: m.id!, result: { resources: [] } };
    case "prompts/list": return { jsonrpc: "2.0", id: m.id!, result: { prompts: [] } };
  }
  return hataYaniti(m.id, -32601, `Desteklenmeyen yöntem: ${m.method}`);
}

export async function POST(req: NextRequest) {
  let govde: unknown;
  try { govde = await req.json(); } catch { return NextResponse.json(hataYaniti(null, -32700, "JSON ayrıştırılamadı"), { status: 400, headers: CORS }); }
  const toplu = Array.isArray(govde);
  const mesajlar = (toplu ? govde : [govde]) as Istek[];
  if (!mesajlar.length) return NextResponse.json(hataYaniti(null, -32600, "Boş toplu istek"), { status: 400, headers: CORS });

  // Anahtar verildiyse daha initialize'da doğrula — hatalı yapılandırma kurulumda fark edilsin
  const ilk = mesajlar[0];
  const basliklar: Record<string, string> = { ...CORS };
  if (ilk?.method === "initialize") {
    basliklar["mcp-session-id"] = crypto.randomUUID();
    if (req.headers.get("authorization")) {
      const { durum, j } = await v1(req, "GET", "/account");
      if (durum === 401 || durum === 403) {
        const e = (j?.error ?? {}) as { message?: string };
        return NextResponse.json(hataYaniti(ilk.id, -32001, e.message ?? "API anahtarı geçersiz"), { status: 401, headers: { ...basliklar, "www-authenticate": 'Bearer realm="vayra"' } });
      }
    }
  }

  const yanitlar = (await Promise.all(mesajlar.map((x) => isle(req, x)))).filter((x): x is Sonuc => x !== null);
  if (!yanitlar.length) return new NextResponse(null, { status: 202, headers: basliklar });
  return NextResponse.json(toplu ? yanitlar : yanitlar[0], { headers: basliklar });
}

export function GET() {
  return NextResponse.json({ name: MCP_SUNUCU.name, transport: "streamable-http", note: "JSON-RPC isteklerini POST ile gönder. Sunucu kaynaklı akış (SSE) desteklenmez.", models: MODELLER.length }, { status: 405, headers: { ...CORS, allow: "POST, OPTIONS" } });
}
export function DELETE() { return new NextResponse(null, { status: 204, headers: CORS }); }
export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }); }
