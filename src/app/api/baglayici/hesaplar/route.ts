import { NextResponse } from "next/server";
import { pdClient, pdHazir } from "@/lib/pipedream/sunucu";

/**
 * Pipedream Connect — bir kullanıcının bağlı hesaplarını listele / sil.
 * GET  ?kullaniciId=... → bağlı hesaplar (Gmail, Slack, ...)
 * DELETE ?id=...        → bir bağlantıyı kaldır
 */
export async function GET(req: Request) {
  if (!pdHazir()) return NextResponse.json({ hesaplar: [], yapilandirilmadi: true });
  try {
    const url = new URL(req.url);
    const kullaniciId = url.searchParams.get("kullaniciId") || "misafir";
    const pd = pdClient();
    const yanit = await pd.accounts.list({ externalUserId: kullaniciId });
    const hesaplar = (yanit.data ?? []).map((h) => ({
      id: h.id,
      app: h.app?.nameSlug ?? h.app?.name,
      appAd: h.app?.name,
      ad: h.name,
      saglikli: h.healthy,
      olusturma: h.createdAt,
    }));
    return NextResponse.json({ hesaplar });
  } catch (e) {
    const mesaj = e instanceof Error ? e.message : "bilinmeyen hata";
    return NextResponse.json({ hata: mesaj, hesaplar: [] }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!pdHazir()) return NextResponse.json({ hata: "Pipedream yapılandırılmadı." }, { status: 503 });
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ hata: "id gerekli" }, { status: 400 });
    const pd = pdClient();
    await pd.accounts.delete(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const mesaj = e instanceof Error ? e.message : "bilinmeyen hata";
    return NextResponse.json({ hata: mesaj }, { status: 500 });
  }
}
