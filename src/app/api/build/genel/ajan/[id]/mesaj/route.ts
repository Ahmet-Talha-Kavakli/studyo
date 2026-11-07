import { dusunceSiz, metinParcalari } from "@/lib/build/ajanCalistir";
import { ziyaretciMesaji } from "@/lib/build/ajanZiyaret";
import { olayMesaji } from "@/lib/build/ajanYonlendir";
import { hizSiniri, konusmaKilidi, konusmaKimligi, konusmaOku, konusmaYaz, type KMesaj } from "@/lib/build/ziyaretciDepo";
import { icerikDenetle } from "@/lib/moderasyon";
import { prosedurZamanAsimlari } from "@/lib/build/ajanProsedurDevam";
import { EPOSTA, erisim } from "@/lib/build/ajanErisim";
import { konusmaDosyalari } from "@/lib/build/ajanDosya";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization, x-vayra-ziyaretci, x-vayra-site, x-vayra-ortam, x-vayra-kimlik, x-vayra-kimlik-imza" };
const yanit = (v: unknown, durum = 200) => Response.json(v, { status: durum, headers: CORS });
const hata = (mesaj: string, durum = 400) => yanit({ ok: false, hata: mesaj }, durum);

export function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }

/**
 * Konuşma geçmişi (sayfa yenilenince kaldığı yerden) + durum (temsilcide mi) + form doldurulmuş mu + temsilci şu an
 * yazıyor mu + memnuniyet anketi yanıtlandı mı + konuşmayı şu an yürüten uzman ajan.
 */
export async function GET(req: Request, { params }: Ctx) {
  const id = (await params).id;
  const e = await erisim(req, id, new URL(req.url).searchParams.get("oturum") ?? undefined);
  if ("hata" in e) return e.hata;
  let k = await konusmaOku(id, e.kimlik);
  // Süresi dolan prosedür beklemesi: ziyaretçi yoklarken de zaman aşımı yoluna gider.
  if (k?.prosedur?.bekleme?.tur === "webhook" && (k.prosedur.bekleme.bitis ?? Infinity) < Date.now()) { await prosedurZamanAsimlari().catch(() => 0); k = await konusmaOku(id, e.kimlik); }
  const pb = k?.prosedur?.bekleme?.tur;
  return yanit({
    ok: true, mesajlar: (k?.mesajlar ?? []).map(dusunceSiz), durum: k?.durum ?? "acik", form: !!k?.iletisim || !!e.dogrulanmis, bekliyor: pb === "temsilci" || pb === "webhook" ? pb : null, ortam: e.ortam ?? null,
    yaziyor: !!k?.yaziyor && Date.now() - k.yaziyor < 7000, csat: k?.csat?.puan ?? null, aktif: k?.aktifAjan ? { ad: k.aktifAjan.ad, simge: k.aktifAjan.simge } : null,
  });
}

const TELEFON = /^[+\d][\d\s()-]{6,20}$/;

/**
 * Ziyaretçi mesajı: { metin, oturum?, akis?, yeni? } ya da sohbet öncesi form { iletisim: { ad, eposta, telefon } }.
 * Varsayılan NDJSON akışı (sohbet olaylarıyla aynı + calisma, kaynaklar, insan); { akis: false } ya da API çağrısında
 * bekleyip { metin, mesaj } döner. Yayındaki sürüm kullanılır; "Sor" izinli araçlar ve sahibin hesabına dokunan
 * araçlar ziyaretçiye kapalıdır. Konuşma insana devredildiyse ajan yanıt vermez, mesaj temsilciye iletilir.
 */
export async function POST(req: Request, { params }: Ctx) {
  const id = (await params).id;
  let g: { metin?: string; oturum?: string; akis?: boolean; yeni?: boolean; iletisim?: { ad?: string; eposta?: string; telefon?: string }; csat?: { puan?: number; yorum?: string }; begeni?: { mesaj?: string; deger?: number }; form?: Record<string, unknown>; dosyalar?: string[] };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const e = await erisim(req, id, g.oturum);
  if ("hata" in e) return e.hata;
  const { y, kimlik, kaynak, site, ortam, dogrulanmis } = e;
  const kutu = y.ajan.yayin.kutu;

  if (g.iletisim) {
    const i = g.iletisim;
    const ad = String(i.ad ?? "").trim().slice(0, 80), eposta = String(i.eposta ?? "").trim().slice(0, 200), telefon = String(i.telefon ?? "").trim().slice(0, 30);
    if (kutu.form.alanlar.includes("ad") && !ad) return hata("Adını yaz.");
    if (kutu.form.alanlar.includes("eposta") && !EPOSTA.test(eposta)) return hata("Geçerli bir e-posta adresi yaz.");
    if (kutu.form.alanlar.includes("telefon") && !TELEFON.test(telefon)) return hata("Geçerli bir telefon numarası yaz.");
    await konusmaKilidi(`${id}:${konusmaKimligi(id, kimlik)}`, async () => {
      const k = (await konusmaOku(id, kimlik)) ?? { mesajlar: [], gecmis: [], olusturma: Date.now(), guncelleme: Date.now(), kaynak, site, durum: "acik" as const };
      k.iletisim = { ...(ad ? { ad } : {}), ...(eposta ? { eposta } : {}), ...(telefon ? { telefon } : {}), zaman: Date.now() };
      await konusmaYaz(id, kimlik, k);
    });
    return yanit({ ok: true });
  }

  // Memnuniyet anketi (1-5 + isteğe bağlı yorum) ve mesaj başına beğeni: yalnız bu konuşmanın sahibi ziyaretçi.
  if (g.csat || g.begeni) {
    if (!hizSiniri(`geri:${id}:${kimlik}`, 20)) return hata("Çok sık gönderdin; biraz sonra tekrar dene.", 429);
    if (g.csat && !kutu.csat) return hata("Bu ajanda anket kapalı.", 403);
    if (g.begeni && !kutu.begeni) return hata("Bu ajanda beğeni kapalı.", 403);
    const yorum = String(g.csat?.yorum ?? "").trim().slice(0, 600);
    if (yorum) { const d = icerikDenetle(yorum); if (!d.izin) return hata(d.mesaj, 422); }
    const sonuc = await konusmaKilidi(`${id}:${konusmaKimligi(id, kimlik)}`, async () => {
      const k = await konusmaOku(id, kimlik);
      if (!k) return "Konuşma bulunamadı.";
      if (g.csat) {
        const puan = Math.round(Number(g.csat.puan));
        if (!(puan >= 1 && puan <= 5)) return "Puan 1 ile 5 arasında olmalı.";
        const ilk = !k.csat;
        k.csat = { puan, ...(yorum ? { yorum } : {}), zaman: Date.now() };
        if (ilk) k.mesajlar.push(olayMesaji("csat", `Memnuniyet puanı 5 üzerinden ${puan}`));
      } else {
        const m = k.mesajlar.find((x) => x.id === g.begeni!.mesaj && x.rol === "asistan" && !x.olay);
        if (!m) return "Mesaj bulunamadı.";
        const v = Number(g.begeni!.deger);
        m.begeni = v === 1 ? 1 : v === -1 ? -1 : undefined;
      }
      await konusmaYaz(id, kimlik, k);
      return null;
    });
    return sonuc ? hata(sonuc) : yanit({ ok: true });
  }

  const durdur = new AbortController();
  req.signal.addEventListener("abort", () => durdur.abort());
  const formZorunlu = kutu.form.acik && kutu.form.alanlar.length > 0 && (kaynak === "sayfa" || kaynak === "kutu");
  const akisli = g.akis !== false && kaynak !== "api" ? true : g.akis === true;
  const form = g.form && typeof g.form === "object" ? Object.fromEntries(Object.entries(g.form).slice(0, 20).map(([a, v]) => [String(a).slice(0, 40), String(v ?? "").slice(0, 1000)])) : undefined;
  // Web kutusundan yüklenen dosyalar: yalnız bu konuşmaya yüklenmiş ve ayarda dosya yükleme açıksa.
  const dosyalar = g.dosyalar?.length && kutu.dosya?.acik && kaynak !== "api" ? await konusmaDosyalari(id, konusmaKimligi(id, kimlik), g.dosyalar) : [];
  const calistir = (yaz?: (o: Record<string, unknown>) => void) => ziyaretciMesaji({ y, kimlik, kaynak, site, metin: String(g.metin ?? "").trim() || (dosyalar.length ? `Dosya gönderdim: ${dosyalar.map((d) => d.ad).join(", ")}` : ""), yeni: g.yeni, yaz, signal: durdur.signal, formZorunlu, form, ortam, dogrulanmis, ...(dosyalar.length ? { dosyalar } : {}) });

  if (!akisli) {
    const r = await calistir();
    if (r.tur === "hata") return hata(r.hata, r.kod);
    if (r.tur === "insanda") return yanit({ ok: true, metin: "", insanda: true, durum: r.konusma.durum });
    if (r.tur === "anket") return yanit({ ok: true, metin: r.yanit, anket: true });
    const a = r.sonuc.asistan as KMesaj;
    return yanit({
      ok: a.durum !== "hata", metin: r.sonuc.metinler.join("\n\n") || metinParcalari(a), mesaj: dusunceSiz(a), mesajlar: r.sonuc.turlar.map((t) => dusunceSiz(t.asistan as KMesaj)),
      kaynaklar: a.kaynaklar ?? [], calisma: r.sonuc.calisma.id, hata: a.hata, devredildi: !!r.sonuc.devredildi, yanitlayan: a.yanitlayan ?? null,
    });
  }
  // Akışta önce ön denetimleri yap: hata varsa JSON döner (istemci gösterir).
  const kodla = new TextEncoder();
  let ilkHata: { hata: string; kod: number } | null = null;
  let hazir: (v: void) => void = () => {};
  const basladi = new Promise<void>((r) => { hazir = r; });
  const akis = new ReadableStream<Uint8Array>({
    async start(c) {
      let kapali = false;
      const yaz = (o: Record<string, unknown>) => { hazir(); if (!kapali) try { c.enqueue(kodla.encode(JSON.stringify(o) + "\n")); } catch { kapali = true; } };
      try {
        const r = await calistir(yaz);
        if (r.tur === "hata") { ilkHata = { hata: r.hata, kod: r.kod }; hazir(); }
      } catch (x) { yaz({ t: "hata", mesaj: (x as Error).message }); }
      finally { hazir(); kapali = true; try { c.close(); } catch { /* kapalı */ } }
    },
  });
  await basladi;
  if (ilkHata) { const h = ilkHata as { hata: string; kod: number }; return hata(h.hata, h.kod); }
  return new Response(akis, { headers: { ...CORS, "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" } });
}
