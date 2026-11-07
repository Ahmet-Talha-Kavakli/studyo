import { EPOSTA_DESENI, epostaNormal, epostadanUid, hesapOku, ozet } from "@/lib/hesap/depo";
import { govdeOku, hata, hizHatasi, hizSiniri, istemciIp, kokenDenetle, tamam } from "@/lib/hesap/guvenlik";

export const runtime = "nodejs";

/**
 * Giriş akışının ilk adımı: e-posta için hangi adım gösterilecek (şifre, kayıt ya da sosyal giriş).
 * Bu yanıt hesabın varlığını gösterdiği için sıkı hız sınırına tabidir: IP başına 10 dakikada 20, e-posta başına 8.
 * Kayıt ve giriş uçlarının kendisi ayrıca hesabın varlığını hiçbir yanıtta açığa çıkarmaz.
 */
export async function POST(req: Request) {
  const k = kokenDenetle(req);
  if (k) return k;
  const g = await govdeOku<{ email?: string }>(req);
  const email = epostaNormal(String(g?.email ?? ""));
  if (!EPOSTA_DESENI.test(email)) return hata("Geçerli bir e-posta adresi gir.", 400, { kod: "eposta" });
  const ipBekle = hizSiniri(`kontrol:ip:${istemciIp(req)}`, 20, 600_000);
  if (ipBekle) return hizHatasi(ipBekle);
  const eBekle = hizSiniri(`kontrol:e:${ozet(email)}`, 8, 600_000, false);
  if (eBekle) return hizHatasi(eBekle);
  const uid = await epostadanUid(email);
  const h = uid ? await hesapOku(uid) : null;
  if (!h) return tamam({ adim: "kayit" });
  if (!h.sifre && h.saglayicilar.length) return tamam({ adim: "sosyal", saglayicilar: [...new Set(h.saglayicilar.map((s) => s.tur))] });
  return tamam({ adim: "sifre" });
}
