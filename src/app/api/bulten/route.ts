import { NextRequest, NextResponse } from "next/server";

/** Blog bülteni aboneliği — e-posta ve ilgi alanları. Bellekte tutulur ve günlüğe yazılır. */
const KONULAR = new Set(["Ürün", "Yaratıcılık", "Şirket", "Teknik"]);
const g = globalThis as unknown as { __vayraBulten?: Map<string, { konular: string[]; zaman: number }> };
const aboneler = (g.__vayraBulten ??= new Map());

export async function POST(req: NextRequest) {
  let b: { email?: string; konular?: unknown };
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false, hata: "Geçersiz istek" }, { status: 400 }); }
  const email = String(b.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return NextResponse.json({ ok: false, hata: "Geçerli bir e-posta gir." }, { status: 422 });
  const konular = (Array.isArray(b.konular) ? b.konular : [...KONULAR]).map(String).filter((k) => KONULAR.has(k));
  const once = aboneler.has(email);
  aboneler.set(email, { konular: konular.length ? konular : [...KONULAR], zaman: Date.now() });
  console.log(`[bulten] ${email}: ${konular.join(", ")}`);
  return NextResponse.json({ ok: true, guncellendi: once });
}
