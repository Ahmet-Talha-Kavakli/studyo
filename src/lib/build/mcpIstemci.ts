import "server-only";
import { adresGecerli } from "./kaynak";
import { guvenliFetch } from "@/lib/guvenliAg";

/**
 * Uzak MCP sunucusu istemcisi (Streamable HTTP, protokol 2025-06-18). Her istekte JSON-RPC gönderilir; yanıt
 * application/json ya da text/event-stream (SSE) olabilir. Oturum kimliği (Mcp-Session-Id) varsa sonraki
 * isteklere eklenir. 401 yanıtında WWW-Authenticate başlığındaki kaynak meta verisi adresi döndürülür (OAuth).
 */
export const PROTOKOL = "2025-06-18";
/** MCP Apps uzantısı (protokol 2026-01-26): araç sonucu kum havuzlu HTML görünümle çizilir. */
export const UI_UZANTI = "io.modelcontextprotocol/ui";
export const UI_MIME = "text/html;profile=mcp-app";
export type McpArac = {
  name: string; title?: string; description?: string; inputSchema?: Record<string, unknown>;
  annotations?: { title?: string; readOnlyHint?: boolean; destructiveHint?: boolean; idempotentHint?: boolean; openWorldHint?: boolean };
  /** Araç meta verisi (MCP Apps: ui.resourceUri, ui.visibility; eski biçim "ui/resourceUri"). */
  _meta?: Record<string, unknown>;
};
export type McpSunucu = { name?: string; version?: string; title?: string };
/** Ham CallToolResult (görünüme olduğu gibi iletilir). */
export type McpIcerik = { type: string; text?: string; data?: string; mimeType?: string; uri?: string; name?: string; resource?: { uri?: string; mimeType?: string; text?: string; blob?: string }; [k: string]: unknown };
export type McpAracSonucu = { content: McpIcerik[]; structuredContent?: unknown; isError?: boolean; _meta?: Record<string, unknown> };
export type McpKaynakIcerigi = { uri: string; mimeType?: string; text?: string; blob?: string; _meta?: Record<string, unknown> };

const nesne = (v: unknown): Record<string, unknown> | undefined => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined);
/** Aracın arayüz kaynağı: _meta.ui.resourceUri (eski: _meta["ui/resourceUri"]); yalnız ui:// adresleri kabul edilir. */
export function aracArayuzu(a?: Pick<McpArac, "_meta"> | null): string | undefined {
  const m = nesne(a?._meta);
  const u = nesne(m?.ui)?.resourceUri ?? m?.["ui/resourceUri"];
  return typeof u === "string" && /^ui:\/\/\S{1,500}$/.test(u) ? u : undefined;
}
/** Aracı kim görebilir: "model" (modele sunulur), "app" (görünüm çağırabilir). Varsayılan ikisi de. */
export function aracGorunurlugu(a?: Pick<McpArac, "_meta"> | null): ("model" | "app")[] {
  const v = nesne(nesne(a?._meta)?.ui)?.visibility;
  if (!Array.isArray(v)) return ["model", "app"];
  return v.filter((x): x is "model" | "app" => x === "model" || x === "app");
}
/** Araç meta verisi büyükse yalnız arayüz alanları tutulur (önbellek küçük kalsın). */
function metaKirp(m: unknown): Record<string, unknown> | undefined {
  const o = nesne(m);
  if (!o) return undefined;
  if (JSON.stringify(o).length <= 4000) return o;
  const ui = nesne(o.ui);
  const k: Record<string, unknown> = {};
  if (ui) k.ui = { ...(typeof ui.resourceUri === "string" ? { resourceUri: ui.resourceUri } : {}), ...(Array.isArray(ui.visibility) ? { visibility: ui.visibility } : {}) };
  if (typeof o["ui/resourceUri"] === "string") k["ui/resourceUri"] = o["ui/resourceUri"];
  return Object.keys(k).length ? k : undefined;
}

export class McpHata extends Error {
  constructor(mesaj: string, public durum: number, public yetkiAdresi?: string) { super(mesaj); }
}

type Oturum = { url: string; basliklar: Record<string, string>; oturum?: string; surum?: string };

/** Sunucu adresi denetimi (SSRF). Geliştirmede BUILD_MCP_YEREL=1 ile localhost'a izin verilir (sahte sunucu testi). */
/** MCP sunucusuna ve yetkilendirme uçlarına güvenli istek: çözülen IP ve yönlendirmeler denetlenir. */
export const mcpFetch = (u: string | URL, init: RequestInit = {}) =>
  guvenliFetch(u, init, { yalnizHttps: process.env.NODE_ENV === "production", yerel: process.env.BUILD_MCP_YEREL === "1" });

export function mcpAdresi(url: string): URL | null {
  if (process.env.BUILD_MCP_YEREL === "1") { try { const u = new URL(url); if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return u; } catch { /* aşağıda */ } }
  const u = adresGecerli(url);
  return u && u.protocol === "https:" ? u : u && process.env.NODE_ENV !== "production" ? u : null;
}
let sayac = 1;

async function gonder(o: Oturum, govde: Record<string, unknown>, bildirim = false): Promise<unknown> {
  const u = mcpAdresi(o.url);
  if (!u) throw new McpHata("Geçersiz ya da izin verilmeyen sunucu adresi (https gerekli).", 400);
  const id = bildirim ? undefined : sayac++;
  const r = await mcpFetch(u, {
    method: "POST", signal: AbortSignal.timeout(45_000),
    headers: {
      "Content-Type": "application/json", Accept: "application/json, text/event-stream", "User-Agent": "VayraBuild/1.0 (MCP istemcisi)",
      ...(o.oturum ? { "Mcp-Session-Id": o.oturum } : {}), ...(o.surum ? { "MCP-Protocol-Version": o.surum } : {}), ...o.basliklar,
    },
    body: JSON.stringify({ jsonrpc: "2.0", ...(id !== undefined ? { id } : {}), ...govde }),
  });
  const oturum = r.headers.get("mcp-session-id");
  if (oturum) o.oturum = oturum;
  if (r.status === 401 || r.status === 403) {
    const w = r.headers.get("www-authenticate") ?? "";
    const meta = /resource_metadata="([^"]+)"/i.exec(w)?.[1];
    throw new McpHata(r.status === 401 ? "Sunucu giriş istiyor." : "Bu işlem için yetki yok.", r.status, meta);
  }
  if (bildirim) return null;
  if (!r.ok) throw new McpHata(`Sunucu yanıt vermedi (${r.status}).`, r.status);
  const tur = r.headers.get("content-type") ?? "";
  let mesaj: { id?: number; result?: unknown; error?: { message?: string; code?: number } } | undefined;
  if (tur.includes("text/event-stream")) {
    const metin = await r.text();
    for (const olay of metin.split(/\r?\n\r?\n/)) {
      const veri = olay.split(/\r?\n/).filter((s) => s.startsWith("data:")).map((s) => s.slice(5).trimStart()).join("\n");
      if (!veri) continue;
      try { const j = JSON.parse(veri); if (j.id === id) { mesaj = j; break; } } catch { /* başka olay */ }
    }
  } else mesaj = await r.json().catch(() => undefined);
  if (!mesaj) throw new McpHata("Sunucunun yanıtı okunamadı.", 502);
  if (mesaj.error) throw new McpHata(mesaj.error.message ?? "Sunucu hata döndürdü.", 400);
  return mesaj.result;
}

/** Bağlanır (initialize + initialized). Dönüş: oturum nesnesi ve sunucu bilgisi. */
export async function mcpBaglan(url: string, basliklar: Record<string, string>): Promise<{ o: Oturum; sunucu: McpSunucu; talimat?: string }> {
  const o: Oturum = { url, basliklar };
  // MCP Apps desteği bildirilir: arayüzlü sunucular araçlarında _meta.ui ile görünüm adresi verir.
  const capabilities = { extensions: { [UI_UZANTI]: { mimeTypes: [UI_MIME] } } };
  const r = (await gonder(o, { method: "initialize", params: { protocolVersion: PROTOKOL, capabilities, clientInfo: { name: "Vayra Build", title: "Vayra Build", version: "1.0.0" } } })) as { protocolVersion?: string; serverInfo?: McpSunucu; instructions?: string };
  o.surum = r?.protocolVersion ?? PROTOKOL;
  await gonder(o, { method: "notifications/initialized" }, true).catch(() => {});
  return { o, sunucu: r?.serverInfo ?? {}, talimat: r?.instructions };
}

export async function mcpAraclar(o: Oturum): Promise<McpArac[]> {
  const l: McpArac[] = [];
  let imlec: string | undefined;
  for (let i = 0; i < 10; i++) {
    const r = (await gonder(o, { method: "tools/list", params: imlec ? { cursor: imlec } : {} })) as { tools?: McpArac[]; nextCursor?: string };
    // _meta korunur (MCP Apps görünüm adresi ve görünürlük); büyükse yalnız arayüz alanları kalır.
    l.push(...(r?.tools ?? []).map((t) => { const m = metaKirp(t._meta); const { _meta: _x, ...g } = t; void _x; return m ? { ...g, _meta: m } : g; }));
    imlec = r?.nextCursor;
    if (!imlec) break;
  }
  return l.slice(0, 300);
}

/** Kaynağı okur (resources/read); MCP Apps görünümünün HTML'i buradan gelir. */
export async function mcpKaynakOku(o: Oturum, uri: string): Promise<{ contents: McpKaynakIcerigi[] }> {
  const r = (await gonder(o, { method: "resources/read", params: { uri } })) as { contents?: McpKaynakIcerigi[] };
  return { contents: Array.isArray(r?.contents) ? r.contents : [] };
}

/** Aracı çağırır; metin içeriği birleştirilir, görseller veri adresi olarak döner. ham: görünüme gidecek CallToolResult. */
export async function mcpCagir(o: Oturum, ad: string, girdi: unknown): Promise<{ metin: string; hata: boolean; gorseller: string[]; ham: McpAracSonucu }> {
  const r = (await gonder(o, { method: "tools/call", params: { name: ad, arguments: girdi && typeof girdi === "object" ? girdi : {} } })) as {
    content?: McpIcerik[]; structuredContent?: unknown; isError?: boolean; _meta?: Record<string, unknown>;
  };
  const parcalar: string[] = [];
  const gorseller: string[] = [];
  for (const c of r?.content ?? []) {
    if (c.type === "text" && c.text) parcalar.push(c.text);
    else if (c.type === "image" && c.data && /^image\//.test(c.mimeType ?? "")) gorseller.push(`data:${c.mimeType};base64,${c.data}`);
    else if (c.type === "resource" && c.resource?.text) parcalar.push(c.resource.text);
    else if (c.type === "resource_link" || c.type === "resource") parcalar.push(`[kaynak: ${c.resource?.uri ?? ""}]`);
  }
  if (!parcalar.length && r?.structuredContent) parcalar.push(JSON.stringify(r.structuredContent));
  const ham: McpAracSonucu = { content: Array.isArray(r?.content) ? r.content : [], ...(r?.structuredContent !== undefined ? { structuredContent: r.structuredContent } : {}), ...(r?.isError ? { isError: true } : {}), ...(nesne(r?._meta) ? { _meta: r._meta } : {}) };
  return { metin: parcalar.join("\n").slice(0, 60_000) || "(boş yanıt)", hata: !!r?.isError, gorseller: gorseller.slice(0, 4), ham };
}
