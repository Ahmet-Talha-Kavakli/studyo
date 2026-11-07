import { bioBul, ekGuncelle, ekOku, hizAsildi, istekIp } from "@/lib/build/buyumeEkDepo";
import { bioHedef, bioOgeGorunur, bosBioIst } from "@/lib/build/buyumeBio";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ kod: string; oge: string }> };

/** Bio sayfası öğe tıkı: sayar (gün başına, botlar hariç) ve öğenin hedefine yönlenir. Açık yönlendirme yoktur: yalnız kayıtlı öğe. */
const BOT = /bot|crawl|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|headless|curl|wget|python|go-http/i;
const trGun = () => new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);

export async function GET(req: Request, { params }: Ctx) {
  const { kod: k0, oge } = await params;
  const kod = k0.toLowerCase();
  const id = /^[a-z0-9][a-z0-9_-]{2,31}$/.test(kod) ? bioBul(kod) : null;
  const ek = id ? await ekOku(id) : null;
  const o = ek?.bio?.acik && ek.bio.kod === kod ? ek.bio.ogeler.find((x) => x.id === oge && bioOgeGorunur(x, trGun())) : undefined;
  const hedef = o ? bioHedef(o) : null;
  if (!id || !o || !hedef) return new Response(null, { status: 302, headers: { Location: `/l/${kod}` } });
  if (!BOT.test(req.headers.get("user-agent") ?? "") && !hizAsildi(`biot:${istekIp(req)}:${kod}`, 40)) {
    ekGuncelle(id, (v) => {
      if (!v.bio) return;
      const s = (v.bio.ist ??= bosBioIst());
      const g = trGun(), l = (s.tik[oge] ??= {});
      l[g] = (l[g] ?? 0) + 1;
      for (const x of Object.keys(l).sort().slice(0, -120)) delete l[x];
      for (const x of Object.keys(s.tik)) if (!v.bio.ogeler.some((y) => y.id === x)) delete s.tik[x];
    }).catch(() => {});
  }
  return new Response(null, { status: 302, headers: { Location: hedef, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer-when-downgrade" } });
}
