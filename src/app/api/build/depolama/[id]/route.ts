import { projeOku } from "@/lib/build/depo";
import { KOVA_ADI, KOVA_BOYUT_SINIRI, kovaSil, kovalar, kovalariYaz, kullanim, parcaOturumlari, PROJE_SINIRI, VARSAYILAN_ONBELLEK, type Kova } from "@/lib/build/depolama";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { gunlukYaz } from "@/lib/build/gunluk";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { denetimKim, denetimYaz } from "@/lib/build/bulutGecmis";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

async function sahipli(req: Request, ctx: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return { y: yetkisiz() };
  const id = (await ctx.params).id;
  const p = await projeOku(id, sahip);
  if (p && req.method !== "GET") { const engel = await izleyiciEngeli(id, sahip); if (engel) return { y: engel }; }
  return p ? { id, sahip } : { y: bulunamadi() };
}

/** Kovalar + kullanım. */
export async function GET(req: Request, ctx: Ctx) {
  const s = await sahipli(req, ctx);
  if (!("id" in s)) return s.y;
  return Response.json({ ok: true, kovalar: (await kovalar(s.id!)).map((k) => ({ ...k, onbellek: k.onbellek ?? VARSAYILAN_ONBELLEK })), kullanim: await kullanim(s.id!), sinir: PROJE_SINIRI, kovaSiniri: KOVA_BOYUT_SINIRI, yarim: await parcaOturumlari(s.id!) });
}

const kovaTemizle = (g: Partial<Kova>, eski?: Kova): Kova | string => {
  const ad = String(g.ad ?? eski?.ad ?? "").trim().toLowerCase();
  if (!KOVA_ADI.test(ad)) return "Kova adı küçük harf, rakam ve tire olmalı (2 ile 31 karakter).";
  return {
    ad, okuma: g.okuma === "imzali" || g.okuma === "herkes" ? g.okuma : eski?.okuma ?? "herkes",
    yukleme: g.yukleme === "herkes" || g.yukleme === "uyeler" || g.yukleme === "kapali" ? g.yukleme : eski?.yukleme ?? "kapali",
    boyutMb: Math.max(1, Math.min(KOVA_BOYUT_SINIRI, Math.round(Number(g.boyutMb ?? eski?.boyutMb ?? 10)))),
    turler: Array.isArray(g.turler) ? g.turler.map(String).filter((t) => /^[a-z]+\/?[a-z0-9.+-]*$/.test(t)).slice(0, 10) : eski?.turler ?? [],
    olusturma: eski?.olusturma ?? Date.now(),
    onbellek: g.onbellek && typeof g.onbellek === "object" ? { sure: Math.max(0, Math.min(31_536_000, Math.round(Number(g.onbellek.sure) || 0))), degismez: !!g.onbellek.degismez } : eski?.onbellek ?? { ...VARSAYILAN_ONBELLEK },
  };
};

/** Kova oluştur: { ad, okuma, yukleme, boyutMb, turler } */
export async function POST(req: Request, ctx: Ctx) {
  const s = await sahipli(req, ctx);
  if (!("id" in s)) return s.y;
  let g: Partial<Kova>;
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const l = await kovalar(s.id!);
  if (l.length >= 20) return hata("En çok 20 kova oluşturulabilir.");
  const k = kovaTemizle(g);
  if (typeof k === "string") return hata(k);
  if (l.some((x) => x.ad === k.ad)) return hata("Bu adla bir kova var.");
  await kovalariYaz(s.id!, [...l, k]);
  gunlukYaz(s.id!, { t: "dosya", m: `"${k.ad}" kovası oluşturuldu` });
  denetimYaz(s.id!, { tur: "dosya", kim: await denetimKim(s.id!, s.sahip!), mesaj: `"${k.ad}" kovası oluşturuldu (okuma ${k.okuma === "herkes" ? "herkese açık" : "süreli bağlantı"}, yükleme ${k.yukleme})` });
  return Response.json({ ok: true, kova: k });
}

/** Kova kurallarını güncelle: { ad, okuma?, yukleme?, boyutMb?, turler? } */
export async function PATCH(req: Request, ctx: Ctx) {
  const s = await sahipli(req, ctx);
  if (!("id" in s)) return s.y;
  let g: Partial<Kova>;
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const l = await kovalar(s.id!);
  const i = l.findIndex((x) => x.ad === g.ad);
  if (i < 0) return hata("Kova bulunamadı.", 404);
  const k = kovaTemizle(g, l[i]);
  if (typeof k === "string") return hata(k);
  const eski = l[i];
  l[i] = k;
  await kovalariYaz(s.id!, l);
  const oe = eski.onbellek ?? VARSAYILAN_ONBELLEK, oy = k.onbellek ?? VARSAYILAN_ONBELLEK;
  const fark = [(oe.sure !== oy.sure || oe.degismez !== oy.degismez) && `önbellek ${oy.sure ? `${oy.sure} sn${oy.degismez ? ", değişmez" : ""}` : "kapalı"}`, eski.okuma !== k.okuma && `okuma ${k.okuma === "herkes" ? "herkese açık" : "süreli bağlantı"}`, eski.yukleme !== k.yukleme && `yükleme ${k.yukleme}`, eski.boyutMb !== k.boyutMb && `dosya sınırı ${k.boyutMb} MB`, JSON.stringify(eski.turler) !== JSON.stringify(k.turler) && `türler ${k.turler.join(", ") || "hepsi"}`].filter(Boolean);
  if (fark.length) denetimYaz(s.id!, { tur: "dosya", kim: await denetimKim(s.id!, s.sahip!), mesaj: `"${k.ad}" kovası: ${fark.join(", ")}` });
  return Response.json({ ok: true, kova: k });
}

/** ?kova=<ad> kovayı ve içindeki bütün dosyaları siler. */
export async function DELETE(req: Request, ctx: Ctx) {
  const s = await sahipli(req, ctx);
  if (!("id" in s)) return s.y;
  const ad = new URL(req.url).searchParams.get("kova") ?? "";
  const l = await kovalar(s.id!);
  if (!l.some((x) => x.ad === ad)) return hata("Kova bulunamadı.", 404);
  await kovaSil(s.id!, ad);
  await kovalariYaz(s.id!, l.filter((x) => x.ad !== ad));
  gunlukYaz(s.id!, { t: "dosya", m: `"${ad}" kovası silindi` });
  denetimYaz(s.id!, { tur: "dosya", kim: await denetimKim(s.id!, s.sahip!), mesaj: `"${ad}" kovası ve içindeki dosyalar silindi` });
  return Response.json({ ok: true });
}
