import { deneyIzEkle, hizAsildi, istekIp, projeKimligiGecerli } from "@/lib/build/buyumeEkDepo";
import { canliDeneyler } from "@/lib/build/buyumeDeneyCanli";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
const bos = () => new Response(null, { status: 204, headers: CORS });

/**
 * A/B denemesi işareti (yayındaki siteden, herkese açık): { d: deneme, k: "a" | "b", z: ziyaretçi kimliği, t: "gor" | "don" }.
 * Yalnız çalışan denemeler kabul edilir; tekil ziyaretçi sayılır; IP başına dakikada 60 işaret.
 */
export async function POST(req: Request, { params }: Ctx) {
  const id = (await params).id;
  if (!projeKimligiGecerli(id)) return bos();
  if (/bot|crawl|spider|headless/i.test(req.headers.get("user-agent") ?? "") || hizAsildi(`deney:${istekIp(req)}`, 60)) return bos();
  let g: { d?: unknown; k?: unknown; z?: unknown; t?: unknown } = {};
  try { g = JSON.parse((await req.text()).slice(0, 600)); } catch { return bos(); }
  const d = String(g.d ?? ""), k = g.k === "b" ? "b" : g.k === "a" ? "a" : null, z = String(g.z ?? ""), t = g.t === "don" ? "don" : g.t === "gor" ? "gor" : null;
  if (!k || !t || !/^[a-z0-9]{8,24}$/.test(z) || !canliDeneyler(id).some((x) => x.i === d)) return bos();
  deneyIzEkle(id, d, k, z, t);
  return bos();
}
export function OPTIONS() { return bos(); }
