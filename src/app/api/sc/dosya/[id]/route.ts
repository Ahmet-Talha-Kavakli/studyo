import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Kod çalıştırmanın ürettiği dosyayı (grafik, CSV…) Anthropic Files API'den indirip aktarır. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^file_[A-Za-z0-9]{8,80}$/.test(id)) return new Response("Geçersiz dosya", { status: 400 });
  if (!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN)) return new Response("Model bağlı değil", { status: 503 });
  try {
    const r = await new Anthropic().files.download(id);
    return new Response(r.body, { headers: { "Content-Type": r.headers.get("content-type") ?? "application/octet-stream", "Cache-Control": "private, max-age=3600" } });
  } catch {
    return new Response("Dosya bulunamadı", { status: 404 });
  }
}
