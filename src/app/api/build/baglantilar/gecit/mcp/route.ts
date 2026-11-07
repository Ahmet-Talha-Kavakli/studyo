import { gecitIstegi } from "@/lib/build/baglantiGecit";

export const dynamic = "force-dynamic";

/** Vayra MCP ağ geçidi uç noktası (Streamable HTTP). Kimlik: Authorization: Bearer vyr_gw_… */
export const POST = (req: Request) => gecitIstegi(req);
export const GET = (req: Request) => gecitIstegi(req);
export const DELETE = (req: Request) => gecitIstegi(req);
export const OPTIONS = (req: Request) => gecitIstegi(req);
