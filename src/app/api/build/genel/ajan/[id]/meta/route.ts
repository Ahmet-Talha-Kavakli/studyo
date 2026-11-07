import { ajanHam, ajanSayacArtir, yayindakiAjan } from "@/lib/build/ajanDepo";
import { kanalMesaji } from "@/lib/build/ajanMesajKanal";
import { metaGonder, metaImzaDogru, metaMesajlari } from "@/lib/build/ajanMeta";
import { coz } from "@/lib/build/sifre";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Meta webhook doğrulaması (Messenger ve Instagram aynı adres): hub.verify_token ajanın doğrulama belirteciyse hub.challenge döner. */
export async function GET(req: Request, { params }: Ctx) {
  const h = await ajanHam((await params).id);
  const u = new URL(req.url).searchParams;
  if (h && u.get("hub.mode") === "subscribe" && u.get("hub.verify_token") === h.ajan.yayin.meta?.dogrulama) return new Response(u.get("hub.challenge") ?? "", { status: 200 });
  return new Response("Doğrulama başarısız", { status: 403 });
}

/**
 * Messenger (object: page) ve Instagram (object: instagram) mesaj olayları. Uygulama gizli anahtarı girildiyse
 * X-Hub-Signature-256 imzası denetlenir. Metin mesajlarına yayındaki sürüm yanıt verir; yanıt Graph API ile gider.
 * Meta yeniden denemesin diye hemen 200 döner; ?bekle=1 ile sonuç beklenir.
 */
export async function POST(req: Request, { params }: Ctx) {
  const ham = await req.text();
  const id = (await params).id;
  const y = await yayindakiAjan(id);
  if (!y) return Response.json({ ok: false }, { status: 404 });
  const m = y.ajan.yayin.meta;
  const gizli = coz(m?.uygulamaSifreli);
  if (gizli && !metaImzaDogru(gizli, ham, req.headers.get("x-hub-signature-256"))) return Response.json({ ok: false }, { status: 401 });
  const token = coz(m?.tokenSifreli);
  if (!token) return Response.json({ ok: true, yok: "sayfa bağlı değil" });
  let o: unknown = {};
  try { o = JSON.parse(ham); } catch { return Response.json({ ok: true }); }
  const k = y.ajan.yayin.kanallar;
  const mesajlar = metaMesajlari(o).filter((x) => (x.kanal === "messenger" ? k.messenger : k.instagram)).slice(0, 5);
  const isle = async () => {
    const s: { durum: string; hata?: string }[] = [];
    for (const x of mesajlar) {
      const gonder = (t: string) => metaGonder(token, x.gonderen, t, x.kanal === "instagram");
      if (!x.metin) { s.push({ durum: "metinsiz", hata: (await gonder("Şimdilik yalnız yazılı mesajları anlayabiliyorum.")) ?? undefined }); continue; }
      s.push(await kanalMesaji({ y, kaynak: x.kanal, kimlik: `${x.kanal === "instagram" ? "ig" : "fb"}:${x.gonderen}`.padEnd(8, "_"), adres: x.gonderen, metin: x.metin.slice(0, 8000), gonder }));
    }
    if (mesajlar.length) await ajanSayacArtir(id, (a) => { a.yayin.meta = { ...a.yayin.meta, sonOlay: Date.now() }; }).catch(() => {});
    return s;
  };
  if (new URL(req.url).searchParams.get("bekle") === "1") return Response.json({ ok: true, sonuclar: await isle() });
  isle().catch(() => {});
  return Response.json({ ok: true });
}
