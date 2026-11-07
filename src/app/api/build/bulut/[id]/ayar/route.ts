import { randomBytes } from "crypto";
import { projeOku } from "@/lib/build/depo";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { gunlukYaz } from "@/lib/build/gunluk";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { denetimKim, denetimYaz } from "@/lib/build/bulutGecmis";
import { BILDIRIM_TURLERI, bulutAyarDegistir, bulutAyarOku, ipOzeti, type BulutAyar, type DuvarKurali } from "@/lib/build/bulutAyar";
import { kuralAdi } from "@/lib/build/bulutDuvar";
import { epostaKurulu } from "@/lib/build/bulutEposta";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Bulut proje ayarları (yalnız sahip): bakım modu, yapay zekâ duraklatma, kota davranışı, bildirim tercihleri,
 * güvenlik duvarı kuralları ve saldırı modu. Tuz hiçbir zaman dışarı verilmez.
 *  GET → { ayar, eposta: { kurulu } }
 *  PATCH { bakim?, aiDuraklat?, kota?, bildirim?, saldiriModu?, kuralEkle?, kuralGuncelle?: { id, acik }, kuralSil?: id }
 */
const disari = (a: BulutAyar) => { const { tuz: _t, ...x } = a; void _t; return x; };
const ULKE = /^[A-Z]{2}$/;

function kuralTemizle(g: Record<string, unknown>, tuz: string): DuvarKurali | string {
  const tur = String(g.tur);
  const yol = typeof g.yol === "string" ? "/" + g.yol.trim().replace(/^\/+/, "").slice(0, 120) : "/";
  const temel = { id: randomBytes(5).toString("base64url"), acik: true, olusturma: Date.now(), ...(typeof g.not === "string" && g.not.trim() ? { not: g.not.trim().slice(0, 120) } : {}) };
  if (tur === "hiz") {
    const sinir = Math.round(Number(g.sinir)), pencere = Math.round(Number(g.pencere));
    if (!(sinir >= 1 && sinir <= 10_000)) return "İstek sayısı 1 ile 10.000 arasında olmalı.";
    if (!(pencere >= 1 && pencere <= 3600)) return "Süre 1 saniye ile 1 saat arasında olmalı.";
    return { ...temel, tur, yol, sinir, pencere };
  }
  if (tur === "yol-engelle") { if (yol === "/") return "Bütün siteyi engellemek için bakım modunu kullan."; return { ...temel, tur, yol }; }
  if (tur === "ulke-engelle" || tur === "ulke-izin") {
    const ulkeler = [...new Set((Array.isArray(g.ulkeler) ? g.ulkeler : String(g.ulkeler ?? "").split(/[\s,]+/)).map((x) => String(x).trim().toUpperCase()).filter((x) => ULKE.test(x)))].slice(0, 60);
    if (!ulkeler.length) return "En az bir ülke kodu yaz (TR, DE gibi).";
    return { ...temel, tur, ulkeler };
  }
  if (tur === "ip-engelle") {
    const ham = String(g.ip ?? "").trim();
    // Düz IP verilirse burada özetlenir ve atılır; günlükteki özet verilirse olduğu gibi kullanılır.
    const ip = /^[A-Za-z0-9_-]{12}$/.test(ham) ? ham : /^[0-9a-fA-F:.]{3,45}$/.test(ham) ? ipOzeti(tuz, ham) : "";
    if (!ip) return "Geçerli bir IP adresi ya da günlükteki IP özetini yaz.";
    return { ...temel, tur, ip };
  }
  return "Kural türü geçersiz.";
}

export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await projeOku(id, sahip))) return bulunamadi();
  return Response.json({ ok: true, ayar: disari(await bulutAyarOku(id)), eposta: { kurulu: epostaKurulu() } });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await projeOku(id, sahip))) return bulunamadi();
  { const engel = await izleyiciEngeli(id, sahip); if (engel) return engel; }
  let g: Record<string, unknown> = {};
  try { g = await req.json(); } catch { return hata("İstek okunamadı."); }
  const olaylar: string[] = [];
  let sorun = "";
  const a = await bulutAyarDegistir(id, (a) => {
    if (g.bakim && typeof g.bakim === "object") {
      const b = g.bakim as { acik?: boolean; mesaj?: string };
      if (typeof b.acik === "boolean" && b.acik !== a.bakim.acik) { a.bakim.acik = b.acik; a.bakim.zaman = Date.now(); olaylar.push(b.acik ? "Site bakım moduna alındı" : "Bakım modu kapatıldı"); }
      if (typeof b.mesaj === "string") a.bakim.mesaj = b.mesaj.slice(0, 300);
    }
    if (typeof g.aiDuraklat === "boolean" && g.aiDuraklat !== a.aiDuraklat) { a.aiDuraklat = g.aiDuraklat; olaylar.push(g.aiDuraklat ? "Sitenin yapay zekâsı duraklatıldı" : "Sitenin yapay zekâsı yeniden açıldı"); }
    if (g.kota && typeof g.kota === "object") { const d = (g.kota as { dolunca?: string }).dolunca; if (d === "uyar" || d === "bakim") a.kota.dolunca = d; }
    if (g.bildirim && typeof g.bildirim === "object") {
      const b = g.bildirim as { turler?: Record<string, boolean>; eposta?: string };
      for (const t of BILDIRIM_TURLERI) if (typeof b.turler?.[t] === "boolean") a.bildirim.turler[t] = b.turler[t];
      if (typeof b.eposta === "string") { const e = b.eposta.trim(); if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) sorun = "E-posta adresi geçersiz."; else a.bildirim.eposta = e; }
    }
    if (g.izleme && typeof g.izleme === "object") {
      const z = g.izleme as { ga4?: string; metaPixel?: string; onaysiz?: boolean };
      if (typeof z.ga4 === "string") { const v = z.ga4.trim().toUpperCase(); if (v && !/^G-[A-Z0-9]{4,16}$/.test(v)) sorun = "GA4 ölçüm kimliği G- ile başlamalı (G-XXXXXXXXXX)."; else if (v !== a.izleme.ga4) { a.izleme.ga4 = v; olaylar.push(v ? `GA4 ölçümü eklendi: ${v}` : "GA4 ölçümü kaldırıldı"); } }
      if (typeof z.metaPixel === "string") { const v = z.metaPixel.trim(); if (v && !/^\d{8,20}$/.test(v)) sorun = "Meta Pixel kimliği yalnız rakamlardan oluşur."; else if (v !== a.izleme.metaPixel) { a.izleme.metaPixel = v; olaylar.push(v ? `Meta Pixel eklendi: ${v}` : "Meta Pixel kaldırıldı"); } }
      if (typeof z.onaysiz === "boolean" && z.onaysiz !== a.izleme.onaysiz) { a.izleme.onaysiz = z.onaysiz; olaylar.push(z.onaysiz ? "Ölçüm betikleri çerez onayı beklemeden yüklenecek" : "Ölçüm betikleri çerez onayını bekleyecek"); }
    }
    if (typeof g.saldiriModu === "boolean" && g.saldiriModu !== a.duvar.saldiriModu) { a.duvar.saldiriModu = g.saldiriModu; olaylar.push(g.saldiriModu ? "Saldırı modu açıldı" : "Saldırı modu kapatıldı"); }
    if (g.kuralEkle && typeof g.kuralEkle === "object") {
      if (a.duvar.kurallar.length >= 50) sorun = "En çok 50 kural eklenebilir.";
      else { const k = kuralTemizle(g.kuralEkle as Record<string, unknown>, a.tuz); if (typeof k === "string") sorun = k; else { a.duvar.kurallar.push(k); olaylar.push(`Güvenlik duvarı kuralı eklendi: ${kuralAdi(k)}`); } }
    }
    if (g.kuralGuncelle && typeof g.kuralGuncelle === "object") {
      const u = g.kuralGuncelle as { id?: string; acik?: boolean };
      const k = a.duvar.kurallar.find((x) => x.id === u.id);
      if (k && typeof u.acik === "boolean") { k.acik = u.acik; olaylar.push(`${kuralAdi(k)} ${u.acik ? "açıldı" : "kapatıldı"}`); }
    }
    if (typeof g.kuralSil === "string") { const k = a.duvar.kurallar.find((x) => x.id === g.kuralSil); if (k) { a.duvar.kurallar = a.duvar.kurallar.filter((x) => x.id !== g.kuralSil); olaylar.push(`Güvenlik duvarı kuralı silindi: ${kuralAdi(k)}`); } }
    return a;
  });
  const kim = await denetimKim(id, sahip);
  for (const m of olaylar) { gunlukYaz(id, { t: "bulut", m }); denetimYaz(id, { tur: /kural|Saldırı/i.test(m) ? "duvar" : "ayar", kim, mesaj: m }); }
  if (sorun) return Response.json({ ok: false, hata: sorun, ayar: disari(a) }, { status: 400 });
  return Response.json({ ok: true, ayar: disari(a) });
}
