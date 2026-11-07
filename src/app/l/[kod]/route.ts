import { createHash } from "crypto";
import { bioBul, ekGuncelle, ekOku, hizAsildi, istekIp } from "@/lib/build/buyumeEkDepo";
import { bioHtml, bosBioIst } from "@/lib/build/buyumeBio";
import { epostaGecerli, izinYaz } from "@/lib/build/buyumeEkTipler";
import { isletmeOku } from "@/lib/build/isletme";
import { projeOkuHam } from "@/lib/build/depo";
import { siteAdresi } from "@/lib/build/bulutKimlik";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ kod: string }> };

/**
 * Vayra bio bağlantı sayfası (herkese açık): /l/<kod>. Görüntülenme sayılır (gün, tekil ziyaretçi, kaynak, cihaz; bot ve
 * önizleme tarayıcıları sayılmaz). Öğe tıkları /l/<kod>/<öğe> üzerinden sayılıp hedefe yönlenir.
 * POST: bülten kutusu. Açık onay kutusu zorunlu; kişi Kişiler'e "Bio sayfası" kaynağıyla, onay zamanı, kaynağı ve IP'siyle
 * yazılır (KVKK ve 6563 sayılı Kanun: onayın ispatı). Abonelikten çıkmış adres yeniden eklenmez.
 */
const BOT = /bot|crawl|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|headless|curl|wget|python|go-http|vercel/i;
const trGun = () => new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);
const GT = globalThis as unknown as { __vayraBioTekil?: { gun: string; l: Set<string> } };
const git = (kod: string, d: string) => new Response(null, { status: 303, headers: { Location: `/l/${kod}?abone=${d}`, "Cache-Control": "no-store" } });
const yok = () => new Response(`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Sayfa yok</title><body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#0b0c0f;color:#e9eef5;font:16px system-ui"><div style="text-align:center;padding:24px"><p style="font-size:20px;font-weight:600;margin:0">Bu sayfa bulunamadı</p><p style="color:#9aa3ad">Kapatılmış ya da adresi değişmiş olabilir.</p></div>`, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });

async function yukle(kod0: string) {
  const kod = kod0.toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{2,31}$/.test(kod)) return null;
  const id = bioBul(kod);
  if (!id) return null;
  const [ek, p] = await Promise.all([ekOku(id), projeOkuHam(id)]);
  if (!p || !ek.bio || ek.bio.kod !== kod || !ek.bio.acik) return null;
  return { id, p, b: ek.bio, ek };
}

async function ciz(req: Request, kod: string, durum?: "abone-tamam" | "abone-hata" | "abone-zaten") {
  const y = await yukle(kod);
  if (!y) return yok();
  const koken = new URL(req.url).origin;
  const v = await isletmeOku(y.id).catch(() => null);
  const kvkk = v?.yasal.sayfalar.kvkk?.dosya ? `${siteAdresi(y.p, koken).replace(/\/$/, "")}/${v.yasal.sayfalar.kvkk.dosya}` : undefined;
  return new Response(bioHtml(y.b, { tik: (o) => `/l/${y.b.kod}/${o}`, form: `/l/${y.b.kod}`, durum, kvkk, bugun: trGun() }), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Content-Security-Policy": "default-src 'self'; img-src 'self' https: data:; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'" } });
}

export async function GET(req: Request, { params }: Ctx) {
  const kod = (await params).kod.toLowerCase();
  const y = await yukle(kod);
  if (!y) return yok();
  const ua = req.headers.get("user-agent") ?? "";
  const ip = istekIp(req);
  if (!BOT.test(ua) && !new URL(req.url).searchParams.has("abone") && !hizAsildi(`bio:${ip}:${kod}`, 30)) {
    const gun = trGun();
    const t = (GT.__vayraBioTekil = GT.__vayraBioTekil?.gun === gun ? GT.__vayraBioTekil : { gun, l: new Set() });
    const iz = createHash("sha256").update(`${gun}|${ip}|${ua}|${kod}`).digest("base64url").slice(0, 16);
    const tekil = !t.l.has(iz); if (tekil && t.l.size < 200_000) t.l.add(iz);
    const ref = (() => { try { return new URL(req.headers.get("referer") ?? "").hostname.replace(/^www\./, "").replace(/^l\.instagram\.com$/, "instagram.com").replace(/^(m|lm)\.facebook\.com$/, "facebook.com") || "Doğrudan"; } catch { return "Doğrudan"; } })();
    const cihaz = /ipad|tablet/i.test(ua) ? "Tablet" : /mobile|iphone|android/i.test(ua) ? "Telefon" : "Masaüstü";
    ekGuncelle(y.id, (v) => {
      if (!v.bio) return;
      const s = (v.bio.ist ??= bosBioIst());
      s.gor[gun] = (s.gor[gun] ?? 0) + 1;
      if (tekil) s.tekil[gun] = (s.tekil[gun] ?? 0) + 1;
      for (const k of Object.keys(s.gor).sort().slice(0, -120)) { delete s.gor[k]; delete s.tekil[k]; }
      if (ref in s.kaynak || Object.keys(s.kaynak).length < 40) s.kaynak[ref] = (s.kaynak[ref] ?? 0) + 1;
      s.cihaz[cihaz] = (s.cihaz[cihaz] ?? 0) + 1;
    }).catch(() => {});
  }
  const ab = new URL(req.url).searchParams.get("abone");
  return ciz(req, kod, ab === "tamam" ? "abone-tamam" : ab === "zaten" ? "abone-zaten" : ab === "hata" ? "abone-hata" : undefined);
}

export async function POST(req: Request, { params }: Ctx) {
  const kod = (await params).kod.toLowerCase();
  const y = await yukle(kod);
  if (!y) return yok();
  const ip = istekIp(req);
  if (hizAsildi(`bio-abone:${ip}`, 6, 10 * 60_000)) return git(kod, "hata");
  let f: FormData;
  try { f = await req.formData(); } catch { return git(kod, "hata"); }
  if (String(f.get("site_adi") ?? "")) return git(kod, "tamam"); // tuzak alan: bot
  const e = String(f.get("eposta") ?? "").trim().toLocaleLowerCase("tr-TR").slice(0, 160);
  if (!epostaGecerli(e) || f.get("izin") !== "evet" || !y.b.ogeler.some((o) => o.tur === "abone" && o.acik)) return git(kod, "hata");
  const { sonuc } = await ekGuncelle(y.id, (v) => {
    if (v.cikanlar[e]) return "zaten" as const;
    const m = (v.kisiMeta[e] ??= { etiketler: [] });
    if (m.izin === "onay") return "zaten" as const;
    m.bio = true; m.eklenme ??= Date.now();
    m.etiketler = [...new Set([...m.etiketler, "bio"])].slice(0, 20);
    izinYaz(m, "onay", `Bio sayfası bülten kutusu (/l/${kod}), açık onay kutusu`, ip);
    if (v.bio) v.bio.ist.abone = (v.bio.ist.abone ?? 0) + 1;
    return "tamam" as const;
  });
  // Çıkmış bir adres için de aynı yanıt verilir (listede kim olduğu dışarıya sızmasın).
  return git(kod, sonuc === "tamam" ? "tamam" : "zaten");
}
