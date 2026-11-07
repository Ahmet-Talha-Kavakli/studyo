import { projeOku } from "@/lib/build/depo";
import { gunlukYaz } from "@/lib/build/gunluk";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { denetimKim, denetimYaz } from "@/lib/build/bulutGecmis";
import { zamanaDon, zamandaOzet, zamandaTablo } from "@/lib/build/bulutYedek";
import { koleksiyonAdiGecerli, type VeriOrtami } from "@/lib/build/veri";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Zamana göre geri dönüş (kayıt geçmişinden; yalnız sahip ve ekip).
 *  GET ?an=<ms>&ortam=canli|test[&hepsi=1]   → o anda değişecek tablolar ve farkları
 *  GET ?an=<ms>&tablo=<ad>                    → tablonun o andaki kayıtları (önizleme, en çok 200)
 *  POST { an, tablolar, hedef: "yerinde" | "kopya", ortam? }  → uygula (önce yedek; geri alınabilir)
 */
function anCoz(v: unknown) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n > Date.now()) return null;
  if (n < Date.now() - 31 * 864e5) return null;
  return n;
}

export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await projeOku(id, sahip))) return bulunamadi();
  const q = new URL(req.url).searchParams;
  const an = anCoz(q.get("an"));
  if (!an) return hata("Geçmişte, son 30 gün içinde bir an seç.");
  const ortam: VeriOrtami = q.get("ortam") === "test" ? "test" : "canli";
  const tablo = q.get("tablo");
  if (tablo) {
    if (!koleksiyonAdiGecerli(tablo)) return hata("Tablo adı geçersiz.");
    return Response.json({ ok: true, ...(await zamandaTablo(id, ortam, tablo, an)) });
  }
  return Response.json({ ok: true, an, tablolar: await zamandaOzet(id, ortam, an, q.get("hepsi") === "1") });
}

export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await projeOku(id, sahip))) return bulunamadi();
  { const engel = await izleyiciEngeli(id, sahip); if (engel) return engel; }
  let g: { an?: number; tablolar?: string[]; hedef?: string; ortam?: string } = {};
  try { g = await req.json(); } catch { return hata("İstek okunamadı."); }
  const an = anCoz(g.an);
  if (!an) return hata("Geçmişte, son 30 gün içinde bir an seç.");
  const tablolar = (Array.isArray(g.tablolar) ? g.tablolar : []).map(String).filter(koleksiyonAdiGecerli).slice(0, 50);
  if (!tablolar.length) return hata("En az bir tablo seç.");
  const ortam: VeriOrtami = g.ortam === "test" ? "test" : "canli";
  const hedef = g.hedef === "kopya" ? "kopya" : "yerinde";
  const kim = await denetimKim(id, sahip);
  const sonuc = await zamanaDon(id, ortam, tablolar, an, hedef, kim);
  const anMetni = new Date(an).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "medium", timeStyle: "short" });
  denetimYaz(id, { tur: "yedek", kim, ortam, mesaj: `Zamana göre geri dönüş (${anMetni}, ${hedef === "kopya" ? "yeni tabloya kopya" : "yerinde"}): ${sonuc.map((s) => `${s.tablo} ${s.sonuc.toLocaleLowerCase("tr")}`).join("; ")}` });
  gunlukYaz(id, { t: "veri", m: `Zamana göre geri dönüş: ${tablolar.length} tablo, ${anMetni}` });
  return Response.json({ ok: true, sonuc });
}
