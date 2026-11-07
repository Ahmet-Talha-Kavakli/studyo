import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { DEPO_KOK, MIME } from "@/lib/dosyaDepo";
import { stemAyir } from "@/lib/saglayicilar/muzik";
import { MUZIK_KAYNAK_MB } from "@/lib/muzikVeri";
import { krediAl, sahteSaglayici, saglayiciyla } from "@/lib/hesap/krediKapi";
import { oturumGerekli } from "@/lib/hesap/yetki";
import { stemTutari } from "@/lib/krediTarife";

export const runtime = "nodejs";

/**
 * Stem ayırma: { url: "/api/dosya/..." } (kitaplıktaki parça) ya da { kaynak: dataURL, ad }; isteğe bağlı sureSn ve kredi.
 * Oturum gerekir. Başlayan her dakika 3 kredi; süre bilinmiyorsa en az bir dakika kesilir, arayüz parçanın süresine
 * göre daha yüksek bir bedel gösterdiyse o kesilir. Sağlayıcı hata verirse iade.
 */
export async function POST(req: NextRequest) {
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  if (!process.env.ELEVENLABS_API_KEY && !sahteSaglayici(req)) return NextResponse.json({ ok: false, hata: "Stem ayırma için müzik sağlayıcısı bağlantısı gerekli." }, { status: 503 });
  const g = (await req.json().catch(() => ({}))) as { url?: string; kaynak?: string; ad?: string; sureSn?: number; kredi?: unknown };
  let blob: Blob; let ad = g.ad ?? "parca.mp3";
  if (g.url) {
    const m = g.url.match(/^\/api\/dosya\/([a-z]+)\/([0-9a-f-]{36}\.([a-z0-9]{2,4}))$/);
    if (!m) return NextResponse.json({ ok: false, hata: "Geçersiz kaynak." }, { status: 400 });
    try { blob = new Blob([await readFile(path.join(DEPO_KOK, m[1], m[2]))], { type: MIME[m[3]] ?? "audio/mpeg" }); }
    catch { return NextResponse.json({ ok: false, hata: "Kaynak parça bulunamadı." }, { status: 404 }); }
    ad = m[2];
  } else if (g.kaynak?.startsWith("data:")) {
    const [bas, veri] = g.kaynak.split(",");
    const bayt = Buffer.from(veri, "base64");
    if (bayt.length > MUZIK_KAYNAK_MB * 1024 * 1024) return NextResponse.json({ ok: false, hata: `Dosya en fazla ${MUZIK_KAYNAK_MB} MB olabilir.` }, { status: 413 });
    blob = new Blob([bayt], { type: bas.match(/data:([^;]+)/)?.[1] ?? "audio/mpeg" });
  } else return NextResponse.json({ ok: false, hata: "Ayrılacak parça gönderilmedi." }, { status: 400 });
  const k = await krediAl(req, { oturum: o, kaynak: "muzik/stem", aciklama: "Stem ayırma", taban: stemTutari(g.sureSn), istemci: g.kredi, ucretli: true });
  if (k instanceof Response) return k;
  try {
    const stemler = await saglayiciyla(k, () => stemAyir(blob, ad), () => [{ ad: "Vokal", url: "/brand/vayra-logo-320.webm" }]);
    return NextResponse.json({ ok: true, stemler, ...k.alanlar() });
  } catch (e) {
    await k.iade("Sağlayıcı hatası: kredi iade edildi");
    return NextResponse.json({ ok: false, hata: String(e instanceof Error ? e.message : e).slice(0, 300), ...k.alanlar() }, { status: 502 });
  }
}
