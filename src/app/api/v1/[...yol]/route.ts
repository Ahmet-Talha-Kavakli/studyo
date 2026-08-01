import { NextRequest, NextResponse } from "next/server";
import { MODELLER } from "@/lib/catalog";
import { anahtarDogrula, bearerCikar } from "@/lib/apiAnahtarDogrula";
import {
  rateLimit, istekOlustur, istekGetir, istekGuncelle,
  hataGovde, HATA_KODLARI, rndHex, type IstekDurum,
} from "@/lib/apiSunucu";
import { icerikDenetle } from "@/lib/moderasyon";

export const runtime = "nodejs";
export const maxDuration = 60;

/* ============================================================
   VAYRA API v1 — GERÇEK REST katmanı (catch-all).

   Desteklenen yollar (Higgsfield Cloud deseni):
     POST /v1/text2image/{model}     görsel üret
     POST /v1/image2video/{model}    video üret
     POST /v1/text2speech/{model}    ses üret
     POST /v1/text2music/{model}     müzik üret
     POST /v1/text2threed/{model}    3D üret
     GET  /v1/requests/{id}/status   istek durumu (request_id ile)
     GET  /v1/requests/{id}          istek detayı
     GET  /v1/models                 model kataloğu
     GET  /v1/account/balance        kredi bakiyesi (anahtar bazlı sim.)
     GET  /v1/ping                   sağlık kontrolü (auth gerektirmez)

   Tümü Bearer anahtar + hız limiti + moderasyon uygular. curl ile ÇALIŞIR.
   ============================================================ */

const YOL_TUR: Record<string, "gorsel" | "video" | "ses" | "muzik" | "3d"> = {
  text2image: "gorsel", image2video: "video", text2speech: "ses", text2music: "muzik", text2threed: "3d",
};

function json(govde: unknown, durum = 200, baslik?: Record<string, string>) {
  return NextResponse.json(govde, { status: durum, headers: { "x-vayra-api": "v1", ...baslik } });
}
function hata(kod: keyof typeof HATA_KODLARI, ekMesaj?: string, ek?: Record<string, unknown>) {
  const h = HATA_KODLARI[kod];
  return json(hataGovde(kod, ekMesaj ?? h.mesaj, ek), h.http);
}

/** Ortak auth + rate limit. Başarısızsa NextResponse döner, başarılıysa doğrulama bilgisi. */
async function yetkilendir(req: NextRequest) {
  const anahtar = bearerCikar(req.headers.get("authorization"));
  const c = await anahtarDogrula(anahtar);
  if (!c.gecerli) return { hata: hata("yetkisiz", c.neden) } as const;
  // canlı anahtar: 60/dk, test: 20/dk
  const limit = c.ortam === "canli" ? 60 : 20;
  const rl = rateLimit(anahtar!, limit);
  if (!rl.izin) {
    return {
      hata: json(hataGovde("hiz_limiti", HATA_KODLARI.hiz_limiti.mesaj, { retry_after: rl.sifirlanma }), 429, {
        "x-ratelimit-limit": String(limit), "x-ratelimit-remaining": "0", "x-ratelimit-reset": String(rl.sifirlanma),
      }),
    } as const;
  }
  return { anahtar: anahtar!, ortam: c.ortam!, rl, limit } as const;
}

// ── GET ──
export async function GET(req: NextRequest, { params }: { params: Promise<{ yol: string[] }> }) {
  const { yol } = await params;
  const [ilk, ikinci, ucuncu] = yol;

  // /v1/ping — auth gerektirmez
  if (ilk === "ping") return json({ ok: true, service: "vayra-api", version: "v1", time: new Date().toISOString() });

  const yetki = await yetkilendir(req);
  if ("hata" in yetki) return yetki.hata;
  const rlBaslik = { "x-ratelimit-limit": String(yetki.limit), "x-ratelimit-remaining": String(yetki.rl.kalan), "x-ratelimit-reset": String(yetki.rl.sifirlanma) };

  // /v1/models
  if (ilk === "models" && !ikinci) {
    return json({
      data: MODELLER.map((m) => ({ id: m.id, name: m.ad, type: m.tur, provider: m.saglayici, credits: m.kredi, endpoint: yolTur(m.tur) })),
      total: MODELLER.length,
    }, 200, rlBaslik);
  }
  // /v1/models/{id}
  if (ilk === "models" && ikinci) {
    const m = MODELLER.find((x) => x.id === ikinci);
    if (!m) return hata("gecersiz_model");
    return json({ id: m.id, name: m.ad, type: m.tur, provider: m.saglayici, credits: m.kredi, capabilities: m.yetenekler, endpoint: yolTur(m.tur) }, 200, rlBaslik);
  }
  // /v1/account/balance
  if (ilk === "account" && ikinci === "balance") {
    // sim.: anahtar bazlı deterministik "kalan kredi" (demoda sabit havuz)
    return json({ credits_available: 10000, credits_used: 0, environment: yetki.ortam }, 200, rlBaslik);
  }
  // /v1/requests/{id} veya /v1/requests/{id}/status
  if (ilk === "requests" && ikinci) {
    const kayit = istekGetir(ikinci);
    if (!kayit) return hata("bulunamadi", "Böyle bir request_id yok.");
    if (ucuncu === "status") return json({ request_id: kayit.request_id, status: kayit.status, progress: kayit.status === "completed" ? 100 : kayit.status === "in_progress" ? 60 : 0 }, 200, rlBaslik);
    return json(kayit, 200, rlBaslik);
  }

  return hata("bulunamadi", `GET /v1/${yol.join("/")} bilinmiyor.`);
}

// ── POST ──
export async function POST(req: NextRequest, { params }: { params: Promise<{ yol: string[] }> }) {
  const { yol } = await params;
  const [ilk, ikinci] = yol;

  const yetki = await yetkilendir(req);
  if ("hata" in yetki) return yetki.hata;
  const rlBaslik = { "x-ratelimit-limit": String(yetki.limit), "x-ratelimit-remaining": String(yetki.rl.kalan), "x-ratelimit-reset": String(yetki.rl.sifirlanma) };

  // üretim uç noktaları: /v1/{text2image|image2video|...}/{model}
  const tur = YOL_TUR[ilk];
  if (!tur) return hata("bulunamadi", `POST /v1/${yol.join("/")} bilinmiyor.`);
  const modelId = ikinci;
  const model = MODELLER.find((m) => m.id === modelId && m.tur === tur);
  if (!model) return hata("gecersiz_model", `'${modelId}' bu uç nokta için geçerli bir ${tur} modeli değil.`);

  let govde: Record<string, unknown>;
  try { govde = await req.json(); } catch { return hata("gecersiz_json"); }
  const prompt = typeof govde.prompt === "string" ? govde.prompt.trim() : "";
  if (!prompt) return hata("eksik_prompt");

  // moderasyon
  const denetim = icerikDenetle(prompt);
  if (!denetim.izin) return hata("moderasyon", denetim.mesaj, { category: denetim.kategori });

  // istek kaydı oluştur (queued)
  const kayit = istekOlustur({ model: model.id, tur, prompt, credits: model.kredi, meta: (govde as Record<string, unknown>) });

  // test ortamı: anında tamamla, sahte çıktı (kredi harcamaz)
  // canlı ortam: kuyruğa al → durum sorgulamayla ilerler (gerçekçi async)
  if (yetki.ortam === "test") {
    istekGuncelle(kayit.request_id, {
      status: "completed", completed_at: Date.now(),
      output_url: sahteCikti(tur, model.id), credits: 0,
    });
  } else {
    // canlıda: kuyrukta bırak; ilk status sorgusunda in_progress, ikincide completed olur (aşağıda ilerleme sim.)
    istekGuncelle(kayit.request_id, { status: "in_progress" });
    // 1.2sn sonra tamamlanmış say (gerçek async üretim yerine simülasyon)
    setTimeout(() => { istekGuncelle(kayit.request_id, { status: "completed", completed_at: Date.now(), output_url: sahteCikti(tur, model.id) }); }, 1200);
  }

  const son = istekGetir(kayit.request_id)!;
  return json({
    request_id: son.request_id,
    status: son.status,
    model: model.id,
    type: tur,
    credits: son.credits,
    output_url: son.output_url,
    status_url: `/v1/requests/${son.request_id}/status`,
    created_at: new Date(son.created_at).toISOString(),
  }, 202, rlBaslik);
}

function yolTur(tur: string): string {
  return tur === "gorsel" ? "text2image" : tur === "video" ? "image2video" : tur === "ses" ? "text2speech" : tur === "muzik" ? "text2music" : "text2threed";
}
function sahteCikti(tur: string, model: string): string {
  const uzanti = tur === "video" ? "mp4" : tur === "ses" || tur === "muzik" ? "mp3" : tur === "3d" ? "glb" : "png";
  return `https://cdn.vayra.ai/outputs/${model}/${rndHex(8)}.${uzanti}`;
}
