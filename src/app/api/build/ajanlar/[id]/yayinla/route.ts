import { ajanGetir, ajanGuncelle, anahtarOzeti, istemciAjan, surumAyarTamamla, surumDondur, taslakFarkli, yeniApiAnahtari } from "@/lib/build/ajanDepo";
import { ayarFarki, ayarSec } from "@/lib/build/ajanSurum";
import { sahipOzeti } from "@/lib/build/depo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { kademeDenetle, kademeOlc, varsayilanKademe } from "@/lib/build/ajanOrtam";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Sürüm farkı: ?eski=<yayin | taslak | no>&yeni=<taslak | yayin | no> (varsayılan yayındaki ile taslak). */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const a = await ajanGetir((await params).id, sahip);
  if (!a) return hata("Ajan bulunamadı.", 404);
  const u = new URL(req.url).searchParams;
  if (u.get("kademe")) return Response.json({ ok: true, rapor: await kademeOlc(a) });
  const e = ayarSec(a, u.get("eski") ?? "yayin"), y = ayarSec(a, u.get("yeni") ?? "taslak");
  if (!e || !y) return hata("Karşılaştırılacak sürüm bulunamadı.", 404);
  return Response.json({ ok: true, farklar: await ayarFarki(e, y, sahipOzeti(sahip)) });
}

/**
 * Yayın işlemleri: { islem: "yayinla", not? } taslağı yeni sürüm olarak dondurur; { islem: "geri", surum } eski
 * sürümü yeniden yayına alır (tek tık geri alma); { islem: "taslaga", surum } sürümü taslağa yükler; { islem: "kaldir" }
 * yayından kaldırır; { islem: "ab-baslat", surum | taslak, oran } yeni konuşmaların yüzde oranını B sürümüne yollar;
 * { islem: "ab-oran", oran } · { islem: "ab-bitir", kol } kazananı yayına alır (B ise yayındaki sürüm olur); { islem: "anahtar" } yeni API anahtarı üretir (yalnız bu yanıtta görünür; saklanan özeti).
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: { islem?: string; not?: string; surum?: number; taslak?: boolean; oran?: number; kol?: "A" | "B"; plan?: number[]; otomatik?: boolean; adimSaat?: number; koruma?: { acik?: boolean; devirPuan?: number; hataPuan?: number; enAz?: number } } = {};
  try { g = await req.json(); } catch { /* boş */ }
  const sahipOz0 = sahipOzeti(sahip);
  const id0 = (await params).id;
  if (g.islem === "kademe-denetle") { const d = await kademeDenetle(id0, sahipOz0); const { ajanGetir: ag } = await import("@/lib/build/ajanDepo"); const a0 = await ag(id0, sahip); if (!a0) return hata("Ajan bulunamadı.", 404); return Response.json({ ok: true, ajan: istemciAjan(a0), degisiklik: taslakFarkli(a0), olay: d.olay, rapor: d.rapor ?? (await kademeOlc(a0)) }); }
  let anahtar: string | undefined;
  const r = await ajanGuncelle((await params).id, sahip, (a) => {
    switch (g.islem ?? "yayinla") {
      case "yayinla":
        if (!a.talimat.trim()) return "Yayınlamadan önce talimat yaz.";
        if (a.yayin.kademe?.acik) return "Kademeli yayın sürerken doğrudan yayınlanamaz; kademeyi ilerlet ya da geri al.";
        surumDondur(a, g.not);
        // Yeni sürüm yayına çıkınca süren A/B karşılaştırması biter (kollar artık aynı sürümü karşılaştırmaz).
        if (a.yayin.ab?.acik) a.yayin.ab = { ...a.yayin.ab, acik: false };
        return;
      case "geri": {
        const s = a.surumler.find((x) => x.no === Number(g.surum));
        if (!s) return "Sürüm bulunamadı.";
        a.yayin.surum = s.no; a.yayin.durum = "yayinda";
        return;
      }
      case "taslaga": {
        const s = a.surumler.find((x) => x.no === Number(g.surum));
        if (!s) return "Sürüm bulunamadı.";
        Object.assign(a, JSON.parse(JSON.stringify(surumAyarTamamla(s.ayar))));
        return;
      }
      case "ab-baslat": {
        if (a.yayin.durum !== "yayinda") return "A/B için önce ajanı yayınla.";
        if (a.yayin.kademe?.acik) return "Kademeli yayın sürerken A/B başlatılamaz; önce kademeyi bitir ya da geri al.";
        const oran = Math.round(Number(g.oran));
        if (!(oran >= 5 && oran <= 95)) return "B sürümüne giden pay yüzde 5 ile 95 arasında olmalı.";
        let no = Number(g.surum);
        if (g.taslak) {
          if (!a.talimat.trim()) return "Taslağın talimatı boş.";
          const canli = a.yayin.surum;
          no = surumDondur(a, g.not || "A/B adayı").no;
          a.yayin.surum = canli;
        }
        if (!a.surumler.some((x) => x.no === no)) return "B sürümü bulunamadı.";
        if (no === a.yayin.surum) return "B sürümü yayındaki sürümden farklı olmalı.";
        a.yayin.ab = { acik: true, surum: no, oran, baslangic: Date.now() };
        return;
      }
      case "ab-oran": {
        const oran = Math.round(Number(g.oran));
        if (!a.yayin.ab?.acik) return "Süren bir A/B karşılaştırması yok.";
        if (!(oran >= 5 && oran <= 95)) return "B sürümüne giden pay yüzde 5 ile 95 arasında olmalı.";
        a.yayin.ab.oran = oran;
        return;
      }
      case "ab-bitir": {
        const ab = a.yayin.ab;
        if (!ab) return "A/B karşılaştırması yok.";
        if (g.kol === "B") { if (!a.surumler.some((x) => x.no === ab.surum)) return "B sürümü bulunamadı."; a.yayin.surum = ab.surum; a.yayin.durum = "yayinda"; }
        a.yayin.ab = { ...ab, acik: false };
        return;
      }
      /* ── Kademeli yayın ── */
      case "kademe-baslat": {
        if (a.yayin.durum !== "yayinda") return "Kademeli yayın için önce bir sürümü yayınla.";
        if (a.yayin.ab?.acik) return "A/B karşılaştırması sürerken kademeli yayın başlatılamaz.";
        if (a.yayin.kademe?.acik) return "Zaten süren bir kademeli yayın var.";
        let no = Number(g.surum);
        if (g.taslak) { if (!a.talimat.trim()) return "Taslağın talimatı boş."; const canli = a.yayin.surum; no = surumDondur(a, g.not || "Kademeli yayın").no; a.yayin.surum = canli; }
        if (!a.surumler.some((x) => x.no === no)) return "Sürüm bulunamadı.";
        if (no === a.yayin.surum) return "Yeni sürüm yayındaki sürümden farklı olmalı.";
        const plan = [...new Set((Array.isArray(g.plan) ? g.plan : [10, 25, 50, 100]).map((x) => Math.round(Number(x))).filter((x) => x >= 1 && x <= 100))].sort((x, y2) => x - y2);
        if (!plan.length || plan.at(-1) !== 100) plan.push(100);
        a.yayin.kademe = varsayilanKademe(no, a.yayin.surum, { plan, otomatik: g.otomatik === true, adimSaat: Math.max(1, Math.min(168, Number(g.adimSaat) || 24)), koruma: { acik: g.koruma?.acik !== false, devirPuan: Math.max(1, Math.min(50, Number(g.koruma?.devirPuan) || 10)), hataPuan: Math.max(1, Math.min(50, Number(g.koruma?.hataPuan) || 5)), enAz: Math.max(5, Math.min(500, Number(g.koruma?.enAz) || 20)) } });
        return;
      }
      case "kademe-ilerle": case "kademe-oran": {
        const kd = a.yayin.kademe;
        if (!kd?.acik) return "Süren bir kademeli yayın yok.";
        const yeni = g.islem === "kademe-oran" ? Math.round(Number(g.oran)) : kd.plan.find((p) => p > kd.oran) ?? 100;
        if (!(yeni >= 1 && yeni <= 100)) return "Pay yüzde 1 ile 100 arasında olmalı.";
        if (yeni >= 100) { a.yayin.surum = kd.surum; kd.acik = false; kd.oran = 100; kd.gecmis = [...kd.gecmis, { zaman: Date.now(), olay: `Sürüm ${kd.surum} herkese açıldı` }].slice(-40); return; }
        kd.oran = yeni; kd.sonAdim = Date.now(); kd.gecmis = [...kd.gecmis, { zaman: Date.now(), olay: `Yüzde ${yeni} adımına çıkıldı` }].slice(-40);
        return;
      }
      case "kademe-geri": {
        const kd = a.yayin.kademe;
        if (!kd?.acik) return "Süren bir kademeli yayın yok.";
        kd.acik = false; kd.gecmis = [...kd.gecmis, { zaman: Date.now(), olay: `Elle geri alındı; herkes sürüm ${kd.onceki} ile konuşuyor` }].slice(-40);
        return;
      }
      case "kademe-ayar": {
        const kd = a.yayin.kademe;
        if (!kd?.acik) return "Süren bir kademeli yayın yok.";
        if (typeof g.otomatik === "boolean") kd.otomatik = g.otomatik;
        if (g.adimSaat) kd.adimSaat = Math.max(1, Math.min(168, Number(g.adimSaat) || 24));
        if (g.koruma) kd.koruma = { acik: g.koruma.acik !== false, devirPuan: Math.max(1, Math.min(50, Number(g.koruma.devirPuan) || kd.koruma.devirPuan)), hataPuan: Math.max(1, Math.min(50, Number(g.koruma.hataPuan) || kd.koruma.hataPuan)), enAz: Math.max(5, Math.min(500, Number(g.koruma.enAz) || kd.koruma.enAz)) };
        return;
      }
      /* ── Deneme ortamı ── */
      case "ortam-deneme": {
        let no = Number(g.surum);
        if (g.taslak) { if (!a.talimat.trim()) return "Taslağın talimatı boş."; const canli = a.yayin.surum, durum = a.yayin.durum; no = surumDondur(a, g.not || "Deneme ortamı").no; a.yayin.surum = canli; a.yayin.durum = durum; }
        if (!a.surumler.some((x) => x.no === no)) return "Sürüm bulunamadı.";
        a.yayin.ortam = { ...(a.yayin.ortam ?? {}), deneme: { surum: no, zaman: Date.now() } };
        return;
      }
      case "ortam-kaldir": a.yayin.ortam = { ...(a.yayin.ortam ?? {}), deneme: undefined }; return;
      case "ortam-anahtar": {
        anahtar = yeniApiAnahtari();
        a.yayin.ortam = { ...(a.yayin.ortam ?? {}), anahtarOzeti: anahtarOzeti(anahtar), anahtarSonu: anahtar.slice(-4) };
        return;
      }
      case "ortam-canliya": {
        const no = a.yayin.ortam?.deneme?.surum;
        if (!no || !a.surumler.some((x) => x.no === no)) return "Deneme ortamında sürüm yok.";
        if (a.yayin.kademe?.acik) return "Süren kademeli yayını önce bitir.";
        a.yayin.surum = no; a.yayin.durum = "yayinda";
        if (a.yayin.ab?.acik) a.yayin.ab = { ...a.yayin.ab, acik: false };
        return;
      }
      case "kaldir": a.yayin.durum = "taslak"; return;
      case "anahtar":
        anahtar = yeniApiAnahtari();
        a.yayin.anahtarOzeti = anahtarOzeti(anahtar); a.yayin.anahtarSonu = anahtar.slice(-4);
        a.yayin.kanallar.api = true;
        return;
      default: return "Bilinmeyen işlem.";
    }
  });
  if (!r) return hata("Ajan bulunamadı.", 404);
  if (!r.ajan) return hata(r.hata);
  return Response.json({ ok: true, ajan: istemciAjan(r.ajan), degisiklik: taslakFarkli(r.ajan), ...(anahtar ? { anahtar } : {}) });
}
