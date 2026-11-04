import { NextRequest } from "next/server";
import { rss } from "@/lib/durumAkis";

/** Olay geçmişi — RSS 2.0. */
export function GET(req: NextRequest) {
  return new Response(rss(req.nextUrl.origin), { headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=300" } });
}
