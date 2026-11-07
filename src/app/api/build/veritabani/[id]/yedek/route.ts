import { readFile } from "fs/promises";
import { projeOku } from "@/lib/build/depo";
import { gunlukYaz } from "@/lib/build/gunluk";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { denetimKim, denetimYaz } from "@/lib/build/bulutGecmis";
import { sonrakiYedek, yedekDogrula, yedekIcerik } from "@/lib/build/bulutYedek";
import { veriAyarDegistir, veriAyarOku } from "@/lib/build/bulutVeriAyar";
import { veriIcerigiYukle, yedekAl, yedekler, yedektenDon, yedekYolu } from "@/lib/build/veri";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Veritabanı yedekleri (Canlı).
 *  GET                      → { yedekler, ayar, sonraki }
 *  GET ?icerik=<ad>         → yedekteki tablolar ve bugünkü hâlle karşılaştırma
 *  GET ?indir=<ad>          → yedek dosyası (JSON indirme)
 *  POST {}                  → elle yedek
 *  POST { geriYukle: ad, tablolar? }        → yedekten dön (seçili tablolar ya da hepsi; önce mevcut durum yedeklenir)
 *  POST { yukle: metin, geriYukle?: true, tablolar? }  → dışarıdan Vayra yedeği yükle (yedek olarak saklanır; istenirse hemen geri yüklenir)
 *  PATCH { acik?, saat?, saklama? }          → otomatik günlük yedek ayarı
 */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await projeOku(id, sahip))) return bulunamadi();
  const q = new URL(req.url).searchParams;
  if (q.get("indir")) {
    const y = yedekYolu(id, q.get("indir")!);
    const metin = y ? await readFile(y).catch(() => null) : null;
    if (!metin) return hata("Yedek bulunamadı.", 404);
    const ad = `vayra-yedek-${id}-${q.get("indir")!.replace(/\.json$/, "")}.json`;
    return new Response(new Uint8Array(metin), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="${ad}"`, "Cache-Control": "no-store" } });
  }
  if (q.get("icerik")) {
    const r = await yedekIcerik(id, q.get("icerik")!);
    return r ? Response.json({ ok: true, ...r }) : hata("Yedek okunamadı.", 404);
  }
  const ayar = (await veriAyarOku(id)).yedek;
  return Response.json({ ok: true, yedekler: await yedekler(id), ayar, sonraki: ayar.acik ? sonrakiYedek(ayar.saat) : null });
}

export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await projeOku(id, sahip))) return bulunamadi();
  { const engel = await izleyiciEngeli(id, sahip); if (engel) return engel; }
  let g: { geriYukle?: string | boolean; tablolar?: string[]; yukle?: string } = {};
  try { g = await req.json(); } catch { /* boş: elle yedek */ }
  const kim = await denetimKim(id, sahip);
  const tablolar = Array.isArray(g.tablolar) ? g.tablolar.map(String).slice(0, 50) : undefined;
  if (typeof g.yukle === "string") {
    if (g.yukle.length > 60 * 1024 * 1024) return hata("Yedek en çok 60 MB olabilir.", 413);
    const d = yedekDogrula(g.yukle);
    if ("hata" in d) return hata(d.hata);
    const y = await yedekAl(id, "yukleme", JSON.stringify(d.v));
    denetimYaz(id, { tur: "yedek", kim, mesaj: `Dışarıdan yedek yüklendi: ${d.tablo} tablo, ${d.kayit} kayıt` });
    if (g.geriYukle === true) {
      const r = await veriIcerigiYukle(id, d.v, tablolar, "Yüklenen yedekten geri yükleme");
      denetimYaz(id, { tur: "yedek", kim, mesaj: `Yüklenen yedek geri yüklendi: ${r.tablolar.length} tablo değişti (${r.tablolar.join(", ") || "değişiklik yok"})` });
      gunlukYaz(id, { t: "veri", m: "Veritabanı yüklenen yedekten geri yüklendi" });
      return Response.json({ ok: true, yedek: y, degisen: r.tablolar, yedekler: await yedekler(id) });
    }
    return Response.json({ ok: true, yedek: y, tablo: d.tablo, kayit: d.kayit, yedekler: await yedekler(id) });
  }
  if (typeof g.geriYukle === "string" && g.geriYukle) {
    const r = await yedektenDon(id, g.geriYukle, tablolar);
    if (!r) return hata("Yedek bulunamadı.");
    gunlukYaz(id, { t: "veri", m: `Veritabanı yedekten geri yüklendi${tablolar?.length ? ` (${tablolar.join(", ")})` : ""}` });
    denetimYaz(id, { tur: "yedek", kim, mesaj: `Yedekten geri yüklendi (${new Date(Number(g.geriYukle.split("-")[0])).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}): ${r.tablolar.length} tablo değişti${r.tablolar.length ? ` (${r.tablolar.join(", ")})` : ""}` });
    return Response.json({ ok: true, degisen: r.tablolar, yedekler: await yedekler(id) });
  }
  const y = await yedekAl(id, "elle");
  if (!y) return hata("Yedeklenecek veri yok.");
  gunlukYaz(id, { t: "veri", m: "Veritabanı elle yedeklendi" });
  denetimYaz(id, { tur: "yedek", kim, mesaj: "Veritabanı elle yedeklendi" });
  return Response.json({ ok: true, yedek: y, yedekler: await yedekler(id) });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await projeOku(id, sahip))) return bulunamadi();
  { const engel = await izleyiciEngeli(id, sahip); if (engel) return engel; }
  let g: { acik?: boolean; saat?: number; saklama?: number } = {};
  try { g = await req.json(); } catch { return hata("İstek okunamadı."); }
  if (g.saat !== undefined && !(Number.isInteger(g.saat) && g.saat >= 0 && g.saat <= 23)) return hata("Saat 0 ile 23 arasında olmalı.");
  if (g.saklama !== undefined && !(Number.isInteger(g.saklama) && g.saklama >= 1 && g.saklama <= 60)) return hata("Saklanacak yedek sayısı 1 ile 60 arasında olmalı.");
  const ayar = await veriAyarDegistir(id, (a) => {
    if (typeof g.acik === "boolean") a.yedek.acik = g.acik;
    if (g.saat !== undefined) a.yedek.saat = g.saat;
    if (g.saklama !== undefined) a.yedek.saklama = g.saklama;
    return a.yedek;
  });
  denetimYaz(id, { tur: "yedek", kim: await denetimKim(id, sahip), mesaj: ayar.acik ? `Otomatik günlük yedek: her gün ${String(ayar.saat).padStart(2, "0")}:00, son ${ayar.saklama} yedek saklanır` : "Otomatik günlük yedek kapatıldı" });
  return Response.json({ ok: true, ayar, sonraki: ayar.acik ? sonrakiYedek(ayar.saat) : null });
}
