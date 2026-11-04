import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Webhook test alıcısı — panelden oluşturulan geçici bir adres. Gelen her POST'u
 * (başlıklar + ham gövde) bellekte tutar; panel GET ile okuyup imzayı doğrular.
 * Kanal başına son 50 olay, 24 saat.
 */

type Kayit = { id: string; at: string; headers: Record<string, string>; body: string };
const g = globalThis as unknown as { __vayraAlici?: Map<string, { olaylar: Kayit[]; zaman: number }> };
const depo = (g.__vayraAlici ??= new Map());

const gecerli = (k: string) => /^[a-z0-9]{12,40}$/.test(k);

export async function POST(req: NextRequest, { params }: { params: Promise<{ kanal: string }> }) {
  const { kanal } = await params;
  if (!gecerli(kanal)) return NextResponse.json({ ok: false }, { status: 404 });
  const body = (await req.text()).slice(0, 100_000);
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => { if (k.startsWith("vayra-") || k === "content-type" || k === "user-agent") headers[k] = v; });
  const k = depo.get(kanal) ?? { olaylar: [], zaman: Date.now() };
  k.olaylar.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), headers, body });
  k.olaylar = k.olaylar.slice(0, 50);
  k.zaman = Date.now();
  depo.set(kanal, k);
  for (const [ad, v] of depo) if (Date.now() - v.zaman > 86400_000) depo.delete(ad);
  return NextResponse.json({ ok: true, received: true });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ kanal: string }> }) {
  const { kanal } = await params;
  if (!gecerli(kanal)) return NextResponse.json({ data: [] }, { status: 404 });
  return NextResponse.json({ data: depo.get(kanal)?.olaylar ?? [] }, { headers: { "cache-control": "no-store" } });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ kanal: string }> }) {
  const { kanal } = await params;
  depo.delete(kanal);
  return NextResponse.json({ ok: true });
}
