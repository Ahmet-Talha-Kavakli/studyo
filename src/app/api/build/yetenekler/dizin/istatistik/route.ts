import { dizinIstatistigi } from "@/lib/build/yetenekDegerlendirme";

export const dynamic = "force-dynamic";

/** Dizindeki her yeteneğin kurulum sayısı ve puan ortalaması: { "vayra:<id>" | "anthropic:<ad>": { kurulum, puan, oy } }. */
export async function GET() {
  return Response.json({ ok: true, istatistik: await dizinIstatistigi() });
}
