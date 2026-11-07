import { anthropicSkillMd } from "@/lib/build/yetenekPaket";
import { hata } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ad: string }> };

/** Dizindeki Anthropic yeteneğinin SKILL.md'si ve dosya listesi (GitHub'dan o anda; yalnız önizleme). */
export async function GET(_req: Request, { params }: Ctx) {
  try { return Response.json({ ok: true, ...(await anthropicSkillMd((await params).ad)) }); }
  catch (e) { return hata((e as Error).message, 502); }
}
