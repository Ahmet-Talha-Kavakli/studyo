import { ajanSayacArtir, yayindakiAjan } from "@/lib/build/ajanDepo";
import { kanalMesaji } from "@/lib/build/ajanMesajKanal";
import { servisGecerli, teamsJwtDogrula, teamsMesaj, teamsMetni, type TeamsEtkinlik } from "@/lib/build/ajanTeams";
import { coz } from "@/lib/build/sifre";
import { hizSiniri } from "@/lib/build/ziyaretciDepo";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const j = (v: unknown, durum = 200) => Response.json(v, { status: durum });

/**
 * Microsoft Teams (Bot Framework) mesajlaşma uç noktası. Authorization JWT'si doğrulanmadan hiçbir şey yapılmaz.
 * message etkinliğine yayındaki sürüm yanıt verir (kanalda bahsedilince ya da birebir sohbette); bot konuşmaya
 * eklenince karşılama gönderilir. Yanıt Bot Framework REST ile serviceUrl'e gider. Hemen 200 döner; ?bekle=1 bekler.
 */
export async function POST(req: Request, { params }: Ctx) {
  const id = (await params).id;
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "yerel";
  if (!hizSiniri(`teams:${ip}`, 120, 60_000)) return j({ ok: false }, 429);
  const govde = await req.text();
  if (govde.length > 300_000) return j({ ok: false }, 413);
  const y = await yayindakiAjan(id);
  const t = y?.ajan.yayin.teams;
  if (!y || !t?.uygulama) return j({ ok: false }, 404);
  let e: TeamsEtkinlik;
  try { e = JSON.parse(govde); } catch { return j({ ok: false }, 400); }
  const servis = String(e.serviceUrl ?? "");
  if (!servisGecerli(servis.endsWith("/") ? servis : `${servis}/`)) return j({ ok: false, hata: "serviceUrl Microsoft alan adı değil." }, 401);
  const h = await teamsJwtDogrula(req.headers.get("authorization"), t.uygulama, servis);
  if (h) return j({ ok: false, hata: h }, 401);
  ajanSayacArtir(id, (a) => { a.yayin.teams = { ...a.yayin.teams, sonOlay: Date.now(), dogrulandi: true }; }).catch(() => {});
  const sifre = coz(t.sifreSifreli);
  if (!sifre || !y.ajan.yayin.kanallar.teams || !e.conversation?.id) return j({ ok: true, yok: "kanal kapalı" });
  const kiraci = t.tur === "tek" ? t.kiraci : undefined;
  const konusmaId = e.conversation.id;
  const adres = `${servis.replace(/\/$/, "")}|${konusmaId}`;
  const bekle = new URL(req.url).searchParams.get("bekle") === "1";
  let son = "";
  const gonder = async (m: string) => { son = m; return bekle ? null : teamsMesaj(t.uygulama!, sifre, kiraci, adres, m, e.id); };
  const isle = async (): Promise<{ durum: string; hata?: string | null }> => {
    if (e.type === "conversationUpdate") {
      if (!(e.membersAdded ?? []).some((m) => m.id === e.recipient?.id)) return { durum: "yok" };
      return { durum: "karsilama", hata: await gonder(y.ayar.karsilama || `Merhaba! Ben ${y.ayar.ad}. Nasıl yardımcı olabilirim?`) };
    }
    if (e.type !== "message") return { durum: "yok" };
    const metin = teamsMetni(String(e.text ?? ""));
    if (!metin) return { durum: "metinsiz", hata: await gonder("Şimdilik yalnız yazılı mesajları anlayabiliyorum.") };
    const kim = e.from?.aadObjectId ?? e.from?.id ?? konusmaId;
    return kanalMesaji({ y, kaynak: "teams", kimlik: `ms:${e.conversation?.conversationType === "personal" ? kim : konusmaId}`.replace(/[^A-Za-z0-9_.:-]/g, "_").slice(0, 80).padEnd(8, "_"), adres, metin: metin.slice(0, 8000), iletisim: e.from?.name ? { ad: e.from.name, zaman: Date.now() } : undefined, gonder });
  };
  if (bekle) { const r = await isle(); return j({ ok: true, yanit: son, ...r }); }
  isle().catch(() => {});
  return j({ ok: true });
}
