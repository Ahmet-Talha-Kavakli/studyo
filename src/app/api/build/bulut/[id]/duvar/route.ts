import { projeOku } from "@/lib/build/depo";
import { gunlukOku, kovaBoyu } from "@/lib/build/gunluk";
import { bulunamadi, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { bulutAyarOku } from "@/lib/build/bulutAyar";
import { kuralAdi, kuralOnizle } from "@/lib/build/bulutDuvar";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const ZAMAN: Record<string, number> = { "1s": 3600_000, "24s": 864e5, "7g": 7 * 864e5, "14g": 14 * 864e5 };

/**
 * Güvenlik duvarı trafiği (günlüklerden): ?zaman=1s|24s|7g|14g|ozel&bas&bit →
 *  { kurallar, saldiriModu, toplam, engel, sinav, hacim[{ z, izin, engel }], yollar, ulkeler, ipler, nedenler, ulkeBilgisi }
 * IP'ler yalnız tuzlu özet olarak gelir.
 */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await projeOku(id, sahip))) return bulunamadi();
  const q = new URL(req.url).searchParams;
  const ozel = q.get("zaman") === "ozel";
  const bit = ozel ? Math.min(Date.now(), Number(q.get("bit")) || Date.now()) : Date.now();
  const bas = ozel ? Math.max(Date.now() - 14 * 864e5, Number(q.get("bas")) || bit - 864e5) : bit - (ZAMAN[q.get("zaman") ?? "24s"] ?? 864e5);
  const [a, l] = await Promise.all([bulutAyarOku(id), gunlukOku(id, { turler: ["istek", "fonksiyon"], bas, bit, sinir: 100_000 })]);
  const boy = kovaBoyu(bit - bas), n = Math.max(1, Math.ceil((bit - bas) / boy)), ilk = bit - n * boy;
  const hacim = Array.from({ length: n }, (_, i) => ({ z: ilk + i * boy, izin: 0, engel: 0 }));
  const yol: Record<string, { adet: number; engel: number }> = {}, ulke: Record<string, { adet: number; engel: number }> = {}, ip: Record<string, { adet: number; engel: number; son: number; ua?: string }> = {}, neden: Record<string, number> = {};
  let engel = 0, sinav = 0, ulkeBilgisi = 0;
  for (const g of l) {
    if (g.m === "Bakım modu" && !g.e) continue;
    const e = !!g.e && g.e !== "Saldırı modu sınavı";
    if (g.e === "Saldırı modu sınavı") sinav++;
    if (e) { engel++; neden[g.e!] = (neden[g.e!] ?? 0) + 1; }
    const k = hacim[Math.floor((g.z - ilk) / boy)];
    if (k) { if (e || g.e) k.engel++; else k.izin++; }
    const y = (g.y ?? "/").replace(/ \((önizleme|deneme)\)$/, "");
    const yx = (yol[y] ??= { adet: 0, engel: 0 }); yx.adet++; if (e) yx.engel++;
    if (g.u) { ulkeBilgisi++; const ux = (ulke[g.u] ??= { adet: 0, engel: 0 }); ux.adet++; if (e) ux.engel++; }
    if (g.ip) { const ix = (ip[g.ip] ??= { adet: 0, engel: 0, son: 0 }); ix.adet++; if (e) ix.engel++; if (g.z > ix.son) { ix.son = g.z; ix.ua = g.ua; } }
  }
  const sirali = <T extends { adet: number }>(o: Record<string, T>, s = 12) => Object.entries(o).sort((x, y) => y[1].adet - x[1].adet).slice(0, s).map(([ad, v]) => ({ ad, ...v }));
  return Response.json({
    ok: true, kurallar: a.duvar.kurallar.map((k) => ({ ...k, ad: kuralAdi(k) })), saldiriModu: a.duvar.saldiriModu, kova: boy,
    toplam: l.length, engel, sinav, hacim, yollar: sirali(yol), ulkeler: sirali(ulke), ipler: sirali(ip, 10), nedenler: Object.entries(neden).sort((x, y) => y[1] - x[1]).map(([ad, adet]) => ({ ad, adet })), ulkeBilgisi,
  });
}

/** Kural önizlemesi: { kural } → son 24 saatte kaç istek bu kurala takılırdı. Kayıt yapmaz. */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await projeOku(id, sahip))) return bulunamadi();
  let g: { kural?: Record<string, unknown> } = {};
  try { g = await req.json(); } catch { return Response.json({ ok: false, hata: "İstek okunamadı." }, { status: 400 }); }
  const k = g.kural ?? {};
  const bit = Date.now();
  const l = (await gunlukOku(id, { turler: ["istek", "fonksiyon"], bas: bit - 864e5, bit, sinir: 100_000 })).filter((x) => !/ \((önizleme|deneme)\)$/.test(x.y ?? ""));
  const ip = typeof k.ip === "string" ? k.ip.trim() : undefined;
  const sonuc = kuralOnizle({ tur: String(k.tur) as never, yol: typeof k.yol === "string" ? k.yol : undefined, sinir: Number(k.sinir) || undefined, pencere: Number(k.pencere) || undefined, ulkeler: Array.isArray(k.ulkeler) ? k.ulkeler.map(String) : undefined, ip }, l);
  return Response.json({ ok: true, ...sonuc });
}
