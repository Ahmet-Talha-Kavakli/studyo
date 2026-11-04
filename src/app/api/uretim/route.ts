import { NextRequest, NextResponse } from "next/server";
import { uretimYonlendir, type SaglayiciIstek, type UretimTuru } from "@/lib/saglayicilar";
import { icerikDenetle } from "@/lib/moderasyon";
import { muzikUret, muzikDurumu } from "@/lib/saglayicilar/muzik";
import { modelBul, MUZIK_MODELLERI } from "@/lib/muzikVeri";
import { ciktiKalicilastir } from "@/lib/dosyaDepo";
import { seslendirAkis, seslendirmeAkisiMumkun } from "@/lib/saglayicilar/eleven";

export const runtime = "nodejs";
// 3D/video uzun sürebilir; makul bir üst sınır.
export const maxDuration = 300;

const GECERLI_TURLER: (UretimTuru | "muzik")[] = ["gorsel", "video", "ses", "3d", "muzik"];

/**
 * Gerçek üretim uç noktası. İstek gövdesi: { tur, model, prompt, meta }.
 * Anahtar varsa gerçek sağlayıcı, yoksa simülasyon çalışır — istemciye
 * { gercek, saglayici, ciktiUrl?, dataUri? } döner.
 */
export async function POST(req: NextRequest) {
  let govde: Partial<Omit<SaglayiciIstek, "tur">> & { tur?: UretimTuru | "muzik" };
  try {
    govde = await req.json();
  } catch {
    return NextResponse.json({ ok: false, hata: "Geçersiz JSON gövdesi." }, { status: 400 });
  }

  const { tur, model, prompt, meta, girdi } = govde;
  if (!tur || !GECERLI_TURLER.includes(tur)) {
    return NextResponse.json({ ok: false, hata: "Geçersiz üretim türü." }, { status: 400 });
  }
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ ok: false, hata: "Prompt boş olamaz." }, { status: 400 });
  }

  // Sunucu tarafı moderasyon (katmanlı savunma). Higgsfield'ın API'sinde de
  // status enum'unda "nsfw" vardır — reddedilen istek 422 döner, istemci krediyi iade eder.
  const denetim = icerikDenetle(prompt);
  if (!denetim.izin) {
    return NextResponse.json(
      { ok: false, moderasyon: true, kategori: denetim.kategori, hata: denetim.mesaj },
      { status: 422 }
    );
  }

  // Müzik: gerçek müzik sağlayıcısı (ElevenLabs Music / Lyria). Model tanımlı değilse varsayılan.
  if (tur === "muzik") {
    const m = (meta ?? {}) as { sure?: string; enstrumantal?: boolean; stiller?: string[]; sozler?: string };
    const ad = MUZIK_MODELLERI.some((x) => x.ad === model) ? model! : MUZIK_MODELLERI[0].ad;
    if (!muzikDurumu()[modelBul(ad).saglayici]) return NextResponse.json({ ok: true, saglayici: "simulasyon", gercek: false, detay: { model: ad } });
    try {
      const sn = m.sure ? parseInt(m.sure, 10) : NaN;
      const s = await muzikUret({ model: ad, istem: prompt, sozler: m.sozler, stiller: m.stiller, enstrumantal: m.enstrumantal, sureSn: Number.isFinite(sn) ? sn : null });
      return NextResponse.json({ ok: true, gercek: true, saglayici: s.saglayici, ciktiUrl: s.sesUrl, detay: { model: s.model } });
    } catch (hata) {
      return NextResponse.json({ ok: false, hata: String(hata instanceof Error ? hata.message : hata).slice(0, 300) }, { status: 502 });
    }
  }

  // Akışlı seslendirme: istemci isterse ve ElevenLabs bağlıysa ses parçaları üretilirken gönderilir (NDJSON).
  if (tur === "ses" && meta?.akis === true && seslendirmeAkisiMumkun(meta) && /eleven/i.test(model ?? "")) {
    return new Response(seslendirAkis({ tur: "ses", model: model!, prompt, meta, girdi }), {
      headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
    });
  }

  try {
    const sonuc = await uretimYonlendir({ tur: tur as UretimTuru, model: model ?? "vayra", prompt, meta, girdi });
    // Görsel çıktısı depoya yazılır: data URI tarayıcı deposunu doldurmasın, geçici sağlayıcı adresi (24 sa) ölmesin.
    if (tur === "gorsel" && sonuc.gercek && (sonuc.dataUri || sonuc.ciktiUrl)) {
      const url = await ciktiKalicilastir("gorsel", (sonuc.dataUri ?? sonuc.ciktiUrl)!);
      return NextResponse.json({ ok: true, ...sonuc, dataUri: undefined, ciktiUrl: url });
    }
    return NextResponse.json({ ok: true, ...sonuc });
  } catch (hata) {
    return NextResponse.json(
      { ok: false, hata: String(hata instanceof Error ? hata.message : hata).slice(0, 300) },
      { status: 500 }
    );
  }
}
