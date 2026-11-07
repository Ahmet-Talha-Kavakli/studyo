import { baglantiBul, claudeBagli } from "@/lib/build/disAjan";
import { BUILD_MODELLERI } from "@/lib/build/modeller";

export const dynamic = "force-dynamic";

/** Hangi modelin bu sunucuda bağlı olduğu (anahtarın kendisi asla dönmez): dogrudan | openrouter | null. */
export function GET() {
  return Response.json({
    ok: true,
    openrouter: Boolean(process.env.OPENROUTER_API_KEY),
    baglantilar: Object.fromEntries(BUILD_MODELLERI.map((m) => [m.id, m.saglayici === "anthropic" ? (claudeBagli() ? "dogrudan" : null) : baglantiBul(m)?.yol ?? null])),
  });
}
