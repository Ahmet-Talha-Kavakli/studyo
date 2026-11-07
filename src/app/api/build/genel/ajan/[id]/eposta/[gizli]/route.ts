import { timingSafeEqual } from "crypto";
import { ajanSayacArtir, yayindakiAjan } from "@/lib/build/ajanDepo";
import { epostaKimligi, epostaYanitGonder, konuKoku, otomatikIleti, yeniMetin } from "@/lib/build/ajanEposta";
import { kanalMesaji } from "@/lib/build/ajanMesajKanal";
import { istektenEposta } from "@/lib/build/sistemEposta";
import { hizSiniri } from "@/lib/build/ziyaretciDepo";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string; gizli: string }> };
const esit = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/**
 * Ajanın gelen e-posta adresi. E-posta altyapısı (Cloudflare Email Routing worker'ı, Postmark Inbound, SendGrid
 * Inbound Parse, Mailgun Routes) iletiyi JSON, form ya da ham MIME olarak buraya POST eder; adresteki gizli değer
 * kimliktir. Aynı gönderen ve aynı konu tek konuşmadır; yanıt aynı konuya Resend ile gider (anahtar yoksa yanıt
 * konuşmada bekler, hata çalışma izine ve gelen kutusuna düşer). Otomatik yanıtlar ve teslim hataları atlanır.
 * Hemen 200 döner; ?bekle=1 ile sonuç beklenir (deneme için).
 */
export async function POST(req: Request, { params }: Ctx) {
  const { id, gizli } = await params;
  const y = await yayindakiAjan(id);
  if (!y || !esit(gizli, y.ajan.yayin.eposta?.gizli ?? "")) return Response.json({ ok: false, hata: "Adres geçersiz." }, { status: 404 });
  if (!y.ajan.yayin.kanallar.eposta) return Response.json({ ok: false, hata: "Bu ajanın e-posta kanalı kapalı." }, { status: 403 });
  if (!hizSiniri(`eposta:${id}`, 120, 60 * 60_000)) return Response.json({ ok: false, hata: "Saatlik e-posta sınırı aşıldı." }, { status: 429 });
  let e: Awaited<ReturnType<typeof istektenEposta>>;
  try { e = await istektenEposta(req); } catch { return Response.json({ ok: false, hata: "İleti okunamadı." }, { status: 400 }); }
  if (!e.gonderen || !/@/.test(e.gonderen)) return Response.json({ ok: false, hata: "Gönderen adresi yok." }, { status: 400 });
  const kendi = (y.ajan.yayin.eposta?.gonderen ?? "").toLowerCase();
  if (otomatikIleti(e.gonderen, e.konu, e.basliklar) || (kendi && kendi.includes(e.gonderen))) return Response.json({ ok: true, atlandi: "Otomatik ileti" });
  const govde = yeniMetin(e.metin) || e.metin.trim();
  if (!govde && !e.konu) return Response.json({ ok: true, atlandi: "Boş ileti" });
  const konu = e.konu || "Konusuz";
  const mesajId = e.basliklar["message-id"];
  const referanslar = e.basliklar.references;
  const metin = `${konuKoku(konu) !== "Konusuz" ? `Konu: ${konuKoku(konu)}\n\n` : ""}${govde}`.slice(0, 8000);
  const isle = async () => {
    const r = await kanalMesaji({
      y, kaynak: "eposta", kimlik: epostaKimligi(e.gonderen, konu), adres: e.gonderen, metin,
      iletisim: { ...(e.gonderenAdi ? { ad: e.gonderenAdi.slice(0, 80) } : {}), eposta: e.gonderen.slice(0, 200), zaman: Date.now() },
      hazirla: (k) => { k.eposta = { konu: konuKoku(konu), mesajId, referanslar }; },
      gonder: (m) => epostaYanitGonder(y.ajan, { alici: e.gonderen, konu: konuKoku(konu), mesajId, referanslar, metin: m }),
    });
    await ajanSayacArtir(id, (a) => { a.yayin.eposta = { ...a.yayin.eposta, sonOlay: Date.now(), hata: r.hata?.startsWith("E-posta gönderim servisi") || r.hata?.startsWith("Gönderen adresi") ? r.hata : undefined }; }).catch(() => {});
    return r;
  };
  if (new URL(req.url).searchParams.get("bekle") === "1") return Response.json({ ok: true, ...(await isle()) });
  isle().catch(() => {});
  return Response.json({ ok: true });
}
