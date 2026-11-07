import { cimdBelgesi, istekKokeni } from "@/lib/build/mcpOauth";

export const dynamic = "force-dynamic";

/**
 * Vayra Build'in MCP OAuth istemci kimliği meta veri belgesi (CIMD). Yetkilendirme sunucusu
 * client_id_metadata_document_supported bildiriyorsa client_id olarak bu belgenin https adresi kullanılır;
 * sunucu belgeyi buradan okur, geri dönüş adresini ve istemci adını doğrular.
 */
export async function GET(req: Request) {
  return Response.json(cimdBelgesi(istekKokeni(req)), { headers: { "Cache-Control": "public, max-age=3600", "Access-Control-Allow-Origin": "*" } });
}
