import { NextResponse } from "next/server";

/**
 * İletişim formu uç noktası (m63). Kurumsal /iletisim formu buraya POST eder.
 * Sunucu tarafında doğrular ve mesajı kaydeder/loglar — eskiden form yalnızca
 * client-side toast atıyordu, mesaj hiçbir yere gitmiyordu.
 *
 * Not: gerçek e-posta gönderimi bir SMTP/servis anahtarı gerektirir; anahtar
 * yoksa mesaj yine de sunucu loguna düşer (kaybolmaz) ve ok döner.
 */
export async function POST(req: Request) {
  let veri: { ad?: string; email?: string; konu?: string; mesaj?: string };
  try {
    veri = await req.json();
  } catch {
    return NextResponse.json({ ok: false, hata: "Geçersiz istek." }, { status: 400 });
  }

  const ad = (veri.ad ?? "").trim();
  const email = (veri.email ?? "").trim();
  const konu = (veri.konu ?? "Genel").trim();
  const mesaj = (veri.mesaj ?? "").trim();

  if (!ad || !email.includes("@") || mesaj.length < 5) {
    return NextResponse.json({ ok: false, hata: "Lütfen tüm alanları doğru doldur." }, { status: 422 });
  }

  // Mesajı sunucu loguna kaydet (kalıcı e-posta entegrasyonu için giriş noktası).
  console.log(`[iletisim] ${konu} · ${ad} <${email}>: ${mesaj.slice(0, 500)}`);

  // İleride: SMTP/Resend/SES ile ekip adresine ilet. Anahtar yoksa log yeterli.
  return NextResponse.json({ ok: true });
}
