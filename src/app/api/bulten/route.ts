import { NextRequest, NextResponse } from "next/server";
import { bultenKaydet } from "@/lib/bultenDepo";

export const runtime = "nodejs";

/** Blog bülteni aboneliği: e-posta ve ilgi alanları. Kalıcı depoya yazılır (.veri/bulten); yönetim panelinde Büyüme bölümünde görünür. */
const KONULAR = new Set(["Ürün", "Yaratıcılık", "Şirket", "Teknik"]);

export async function POST(req: NextRequest) {
  let b: { email?: string; konular?: unknown };
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false, hata: "Geçersiz istek" }, { status: 400 }); }
  const email = String(b.email ?? "").trim().toLowerCase();
  if (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return NextResponse.json({ ok: false, hata: "Geçerli bir e-posta gir." }, { status: 422 });
  const konular = (Array.isArray(b.konular) ? b.konular : [...KONULAR]).map(String).filter((k) => KONULAR.has(k));
  try {
    const once = await bultenKaydet(email, konular.length ? konular : [...KONULAR]);
    return NextResponse.json({ ok: true, guncellendi: once });
  } catch (e) {
    console.error("[bulten] kaydedilemedi:", (e as Error).message);
    return NextResponse.json({ ok: false, hata: "Abonelik kaydedilemedi. Biraz sonra yeniden dene." }, { status: 500 });
  }
}
