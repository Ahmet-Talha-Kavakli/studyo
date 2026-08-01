import { NextResponse } from "next/server";
import { pdClient, pdHazir } from "@/lib/pipedream/sunucu";

/**
 * Pipedream Connect — kısa ömürlü bağlantı token'ı üret.
 * Frontend bu token'la Connect penceresini açar (kullanıcı OAuth ile bağlanır).
 * external_user_id = Vayra kullanıcı kimliği (her kullanıcının bağlantıları izole).
 */
export async function POST(req: Request) {
  if (!pdHazir()) {
    return NextResponse.json({ hata: "Pipedream yapılandırılmadı (CLIENT_ID/SECRET eksik)." }, { status: 503 });
  }
  try {
    const { kullaniciId } = await req.json().catch(() => ({}));
    const dışKullanici = String(kullaniciId || "misafir").slice(0, 128);

    // İzin verilen origin'ler — tarayıcıdan Connect için ZORUNLU (CORS).
    // İstek origin'i + geliştirme + ortam değişkeninden gelen canlı domain'ler.
    const origin = req.headers.get("origin");
    const izinliOriginler = Array.from(new Set([
      origin,
      "http://localhost:3100",
      "http://127.0.0.1:3100",
      ...(process.env.PIPEDREAM_ALLOWED_ORIGINS?.split(",").map((o) => o.trim()) ?? []),
    ].filter(Boolean))) as string[];

    const pd = pdClient();
    const token = await pd.tokens.create({
      externalUserId: dışKullanici,
      allowedOrigins: izinliOriginler,
    });
    return NextResponse.json({
      token: token.token,
      connectLinkUrl: token.connectLinkUrl,
      expiresAt: token.expiresAt,
      dışKullanici,
    });
  } catch (e) {
    const mesaj = e instanceof Error ? e.message : "bilinmeyen hata";
    return NextResponse.json({ hata: `Token üretilemedi: ${mesaj}` }, { status: 500 });
  }
}
