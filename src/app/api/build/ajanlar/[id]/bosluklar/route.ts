import { randomBytes } from "crypto";
import { ajanGetir, ajanGuncelle, istemciAjan } from "@/lib/build/ajanDepo";
import { bilgiAra, normal, terimler } from "@/lib/build/ajanBilgi";
import { metinParcalari } from "@/lib/build/ajanCalistir";
import { zekaJson } from "@/lib/build/ajanZeka";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { konusmalariOku } from "@/lib/build/ziyaretciDepo";
import { icerikDenetle } from "@/lib/moderasyon";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const GUN = 86_400_000;
/** Ajanın yanıtlayamadığını gösteren ifadeler. */
const BILEMEDI = /bilgim yok|kesin bilgim|yardımcı olamıyorum|bilmiyorum|emin değilim|anlayamadım|bu konuda bilgi|kaynaklarımda|belgelerde (yer )?almıyor|bulamadım|ekibimize yönlendir/i;
const SSS_AD = "Gelen kutusundan sık sorulanlar";

/**
 * İçerik boşlukları: ajanın yanıtlayamadığı sorular. Kaynak: "bilmiyorum" türü yanıtlar, ardından insana devredilen
 * sorular ve yararlı bulunmayan yanıtlar. Benzer sorular anahtar terimlerine göre gruplanır ve etkilenen konuşma
 * sayısına göre sıralanır; sık sorulanlar kaynağına zaten eklenmiş sorular gösterilmez. ?gun=30
 */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const a = await ajanGetir(id, sahip);
  if (!a) return hata("Ajan bulunamadı.", 404);
  const gun = Math.max(1, Math.min(365, Number(new URL(req.url).searchParams.get("gun")) || 30));
  const l = await konusmalariOku(id, Date.now() - gun * GUN);
  const sss = normal(a.bilgi.find((b) => b.ad === SSS_AD)?.icerik ?? "");
  const gruplar = new Map<string, { soru: string; ornekler: string[]; konusmalar: Set<string>; neden: Set<string>; son: number }>();
  for (const k of l) {
    k.mesajlar.forEach((m, i) => {
      if (m.rol !== "asistan" || m.olay || m.insan) return;
      const yazi = metinParcalari(m);
      const devir = k.mesajlar.slice(i + 1, i + 3).some((x) => x.olay?.tur === "devir");
      const neden = m.begeni === -1 ? "Yararlı bulunmadı" : BILEMEDI.test(yazi) ? "Yanıtlayamadı" : devir ? "İnsana devredildi" : "";
      if (!neden) return;
      const soru = [...k.mesajlar.slice(0, i)].reverse().find((x) => x.rol === "kullanici")?.metin?.replace(/\s+/g, " ").trim();
      if (!soru || soru.length < 6 || /^\[arac:/.test(soru)) return;
      const t = [...new Set(terimler(soru))].filter((x) => x.length > 2).sort().slice(0, 4);
      if (!t.length) return;
      if (sss && t.every((x) => sss.includes(x))) return;
      const anahtar = t.join(" ");
      const g = gruplar.get(anahtar) ?? { soru, ornekler: [], konusmalar: new Set<string>(), neden: new Set<string>(), son: 0 };
      if (!g.ornekler.includes(soru) && g.ornekler.length < 3) g.ornekler.push(soru.slice(0, 300));
      g.konusmalar.add(k.id); g.neden.add(neden); g.son = Math.max(g.son, m.zaman);
      gruplar.set(anahtar, g);
    });
  }
  const bosluklar = [...gruplar.entries()].map(([anahtar, g]) => ({ anahtar, soru: g.soru.slice(0, 300), ornekler: g.ornekler, sayi: g.konusmalar.size, nedenler: [...g.neden], son: g.son }))
    .sort((x, y) => y.sayi - x.sayi || y.son - x.son).slice(0, 30);
  return Response.json({ ok: true, gun, bosluklar, konusma: l.length });
}

/**
 * { islem: "oner", soru } bilgi kaynaklarına ve talimata dayanarak bilgi bankasına eklenecek kısa bir yanıt önerir
 * (bağlı model yoksa modelYok) · { islem: "ekle", soru, yanit } soru ve yanıtı "Gelen kutusundan sık sorulanlar"
 * metin kaynağına ekler (taslağa; yayınlayınca ziyaretçilere gelir).
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const a = await ajanGetir(id, sahip);
  if (!a) return hata("Ajan bulunamadı.", 404);
  let g: { islem?: string; soru?: string; yanit?: string } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const soru = String(g.soru ?? "").replace(/\s+/g, " ").trim().slice(0, 300);
  if (!soru) return hata("Soru boş.");
  if (g.islem === "oner") {
    const b = bilgiAra(a.bilgi, soru, 4);
    const z = await zekaJson<{ yanit?: string }>({
      model: a.model, enCok: 600,
      sistem: `Bir yapay zekâ ajanının yanıtlayamadığı müşteri sorusu için bilgi bankasına eklenecek kısa bir yanıt taslağı yazıyorsun. Ajan talimatına ve verilen bilgi bölümlerine dayan; bilgi yoksa sahibin doldurması için köşeli parantezle boşluk bırak, örneğin [teslim süresi]. Türkçe, en çok üç cümle. JSON: {"yanit": "..."}\n\n<talimat>\n${a.talimat.slice(0, 2500)}\n</talimat>${b.length ? `\n\n<bilgi>\n${b.map((x) => x.metin.slice(0, 800)).join("\n\n")}\n</bilgi>` : ""}`,
      istem: soru,
    });
    if (!z) return Response.json({ ok: true, modelYok: true });
    return Response.json({ ok: true, yanit: String(z.veri?.yanit ?? z.metin).trim().slice(0, 1500) });
  }
  if (g.islem === "ekle") {
    const yanit = String(g.yanit ?? "").trim().slice(0, 3000);
    if (!yanit) return hata("Yanıt boş.");
    const d = icerikDenetle(`${soru}\n${yanit}`);
    if (!d.izin) return hata(d.mesaj, 422);
    const blok = `Soru: ${soru}\nYanıt: ${yanit}`;
    const r = await ajanGuncelle(id, sahip, (x) => {
      const b = x.bilgi.find((y) => y.ad === SSS_AD && y.tur === "metin");
      if (b) { b.icerik = `${b.icerik.trim()}\n\n${blok}`.slice(0, 800_000); b.boyut = b.icerik.length; return; }
      if (x.bilgi.length >= 40) return "En çok 40 bilgi kaynağı eklenebilir.";
      x.bilgi.push({ id: randomBytes(5).toString("hex"), ad: SSS_AD, tur: "metin", icerik: blok, boyut: blok.length, eklenme: Date.now(), durum: "hazir", ne: "Ziyaretçilerin daha önce yanıtsız kalan soruları" });
    });
    if (!r) return hata("Ajan bulunamadı.", 404);
    if (!r.ajan) return hata(r.hata);
    return Response.json({ ok: true, ajan: istemciAjan(r.ajan) });
  }
  return hata("Bilinmeyen işlem.");
}
