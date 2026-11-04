import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** Vayra CLI ve Claude becerisi — sunucunun kendi adresi gömülü olarak indirilir. */
const DOSYALAR: Record<string, { kaynak: string; tur: string }> = {
  "vayra.mjs": { kaynak: "vayra.mjs", tur: "text/javascript; charset=utf-8" },
  "SKILL.md": { kaynak: "SKILL.md", tur: "text/markdown; charset=utf-8" },
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ dosya: string }> }) {
  const { dosya } = await params;
  const d = DOSYALAR[dosya];
  if (!d) return NextResponse.json({ error: "Dosya yok" }, { status: 404 });
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  const metin = (await fs.readFile(path.join(process.cwd(), "src/lib/mcp/dosyalar", d.kaynak), "utf8")).replaceAll("__BASE__", `${proto}://${host}`);
  const indir = req.nextUrl.searchParams.has("indir");
  return new NextResponse(metin, { headers: { "content-type": d.tur, "cache-control": "no-store", ...(indir ? { "content-disposition": `attachment; filename="${dosya}"` } : {}) } });
}
