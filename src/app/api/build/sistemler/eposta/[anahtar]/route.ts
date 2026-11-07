import { anahtarBul, canliAkis, sistemGuncelleOz, sistemHam, yeniKimlik } from "@/lib/build/sistemDepo";
import { gonderenUyar, istektenEposta } from "@/lib/build/sistemEposta";
import { sistemCalistir } from "@/lib/build/sistemMotoru";
import { hizSiniri } from "@/lib/build/ziyaretciDepo";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ anahtar: string }> };
const yanit = (v: unknown, durum = 200) => Response.json(v, { status: durum });

/**
 * Gelen e-posta tetiği (dahili uç nokta): e-posta yönlendirme kuralı (Cloudflare Email Routing worker'ı, Mailgun
 * route, SendGrid Inbound Parse, Postmark inbound) iletiyi bu adrese POST eder. Gövde JSON, form ya da ham MIME olabilir.
 * Sistem açıksa yayındaki sürüm çalışır; kapalıyken ileti deneme verisi olarak saklanır.
 */
export async function POST(req: Request, { params }: Ctx) {
  const anahtar = (await params).anahtar.toLowerCase().replace(/@.*$/, "").replace(/^sistem-/, "");
  if (!/^[a-z0-9]{8,16}$/.test(anahtar)) return yanit({ ok: false, hata: "Geçersiz adres." }, 404);
  const id = await anahtarBul(`eposta:${anahtar}`);
  const h = id ? await sistemHam(id) : null;
  if (!h || h.s.epostaAnahtari !== anahtar) return yanit({ ok: false, hata: "Bu adrese bağlı sistem yok." }, 404);
  if (!hizSiniri(`sistem-eposta:${h.s.id}`, 60, 60_000)) return yanit({ ok: false, hata: "Çok fazla ileti." }, 429);
  if (Number(req.headers.get("content-length") ?? 0) > 6_000_000) return yanit({ ok: false, hata: "İleti çok büyük." }, 413);
  let veri;
  try { veri = await istektenEposta(req); } catch { return yanit({ ok: false, hata: "İleti okunamadı." }, 400); }
  if (!veri.gonderen && !veri.konu && !veri.metin) return yanit({ ok: false, hata: "İletide gönderen, konu ya da metin bulunamadı." }, 400);
  const canli = h.s.durum === "acik" ? canliAkis(h.s).tetikler.find((t) => t.tur === "eposta") : undefined;
  if (!canli) {
    await sistemGuncelleOz(h.s.id, h.sahipOz, (s) => { s.test ??= {}; s.test.sonTetik = veri; if (s.test.tetik === undefined) s.test.tetik = veri; s.test.olaylar = [{ id: yeniKimlik(8), zaman: Date.now(), tur: "eposta", veri }, ...(s.test.olaylar ?? [])].slice(0, 10); });
    return yanit({ ok: true, deneme: true, mesaj: "Sistem kapalı: ileti çalıştırılmadı, deneme verisi olarak kaydedildi." }, 202);
  }
  if (canli.tur === "eposta" && !gonderenUyar(canli.gonderen, veri.gonderen)) return yanit({ ok: true, atlandi: true, mesaj: "Gönderen süzgece uymadı; çalıştırılmadı." }, 202);
  sistemCalistir(h.s.id, h.sahipOz, { tur: "eposta", veri }).catch(() => {});
  return yanit({ ok: true, kabul: true });
}
