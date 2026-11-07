import { ajanGetir, trGun } from "@/lib/build/ajanDepo";
import { konusmaGorunum, konusmaMetni, temsilciIslem, type TemsilciGovde } from "@/lib/build/ajanGelen";
import { KANAL_AD, type Kanal } from "@/lib/build/ajanKatalog";
import { sahipOzeti } from "@/lib/build/depo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { konusmaGuncelle, konusmalariListele, konusmalariOku } from "@/lib/build/ziyaretciDepo";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const csvHucre = (v: unknown) => { const s = String(v ?? "").replace(/\r?\n/g, " ").replace(/^[=+\-@\t]/, "'$&"); return /[",;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

/**
 * Ziyaretçi konuşmaları (sahip): liste + sayaçlar; ?k=<kimlik> tek konuşma (okundu sayılır); ?durum= ve ?etiket=
 * süzgeç; ?csv=1 dönemdeki (?gun=30) konuşmaları CSV olarak indirir (döküm dahil).
 */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const a = await ajanGetir(id, sahip);
  if (!a) return hata("Ajan bulunamadı.", 404);
  const u = new URL(req.url).searchParams;
  const k = u.get("k");
  if (k) {
    const v = await konusmaGuncelle(id, k, (x) => { x.okunmadi = false; }, true);
    if (!v || typeof v === "string") return hata("Konuşma bulunamadı.", 404);
    return Response.json({ ok: true, konusma: konusmaGorunum(k, v) });
  }
  if (u.get("csv")) {
    const gun = Math.max(1, Math.min(365, Number(u.get("gun")) || 30));
    const l = (await konusmalariOku(id, Date.now() - gun * 86_400_000)).sort((x, y) => y.guncelleme - x.guncelleme);
    const satirlar = [["Konuşma", "Kanal", "Başladı", "Son mesaj", "Durum", "Sonuç", "Konular", "Memnuniyet", "Tahmini memnuniyet", "A/B kolu", "Ad", "E-posta", "Telefon", "Mesaj sayısı", "Döküm"]];
    for (const x of l) satirlar.push([x.id, KANAL_AD[x.kaynak as Kanal] ?? x.kaynak, new Date(x.olusturma).toISOString(), new Date(x.guncelleme).toISOString(), x.durum ?? "acik", x.etiket?.sonuc ?? "", (x.etiketler ?? []).join(", "), x.csat ? String(x.csat.puan) : "", x.tahmin ? String(x.tahmin.puan) : "", x.kol ?? "", x.iletisim?.ad ?? "", x.iletisim?.eposta ?? "", x.iletisim?.telefon ?? "", String(x.mesajlar.length), konusmaMetni(x).slice(0, 30_000)]);
    const govde = "﻿" + satirlar.map((r) => r.map(csvHucre).join(",")).join("\r\n");
    return new Response(govde, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="konusmalar-${trGun()}.csv"; filename*=UTF-8''${encodeURIComponent(`${a.ad.replace(/[^\p{L}\p{N}-]+/gu, "-").slice(0, 40) || "ajan"}-konusmalar-${trGun()}.csv`)}` } });
  }
  const bugun = trGun();
  const tum = await konusmalariListele(id, 300);
  const d = u.get("durum"), e = u.get("etiket");
  return Response.json({
    ok: true, konusmalar: tum.filter((x) => (!d || x.durum === d || (d === "bekliyor" && (x.durum === "devredildi" || x.durum === "insan")) || (d === "kalite" && !!x.kaliteIhlal)) && (!e || x.etiketler?.includes(e))),
    sayilar: { hepsi: tum.length, bekliyor: tum.filter((x) => x.durum === "devredildi" || x.durum === "insan").length, cozuldu: tum.filter((x) => x.durum === "cozuldu").length, form: tum.filter((x) => x.iletisim).length, kalite: tum.filter((x) => x.kaliteIhlal).length },
    etiketler: [...new Set([...a.konular.etiketler.map((x) => x.ad), ...tum.flatMap((x) => x.etiketler ?? [])])],
    istatistik: { ...a.istatistik, bugun: a.istatistik.gunluk?.gun === bugun ? a.istatistik.gunluk.sayi : 0, tavan: a.yayin.gunlukTavan },
  });
}

/**
 * Temsilci işlemleri (gelen kutusuyla ortak): yanit · not · durum (acik, insan, cozuldu) · etiket · yaziyor · taslak
 * (yapay zekâ yanıt taslağı) · ozet · sil. Yanıt konuşmanın kanalına (Telegram, WhatsApp, Slack, Messenger,
 * Instagram, SMS, e-posta) da gönderilir; gönderilemezse kanalHata döner.
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const a = await ajanGetir(id, sahip);
  if (!a) return hata("Ajan bulunamadı.", 404);
  let g: TemsilciGovde = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const r = await temsilciIslem(a, sahip, sahipOzeti(sahip), g);
  if (r.hata) return hata(r.hata, r.kod ?? 400);
  return Response.json({ ok: true, ...r });
}
