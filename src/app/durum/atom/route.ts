import { NextRequest } from "next/server";
import { atom } from "@/lib/durumAkis";

/** Olay geçmişi — Atom 1.0. */
export function GET(req: NextRequest) {
  return new Response(atom(req.nextUrl.origin), { headers: { "content-type": "application/atom+xml; charset=utf-8", "cache-control": "public, max-age=300" } });
}
