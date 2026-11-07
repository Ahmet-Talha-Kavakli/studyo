import { NextRequest, NextResponse } from "next/server";
import { gercekUretimMumkun, uretimYonlendir, type SaglayiciIstek, type SaglayiciSonuc, type UretimTuru } from "@/lib/saglayicilar";
import { icerikDenetle } from "@/lib/moderasyon";
import { muzikUret, muzikDurumu } from "@/lib/saglayicilar/muzik";
import { modelBul, MUZIK_MODELLERI } from "@/lib/muzikVeri";
import { ciktiKalicilastir } from "@/lib/dosyaDepo";
import { seslendirAkis, seslendirmeAkisiMumkun } from "@/lib/saglayicilar/eleven";
import { hakAc, hakGeriVer, hakKullan, krediAl, saglayiciyla } from "@/lib/hesap/krediKapi";
import { oturumGerekli } from "@/lib/hesap/yetki";
import { hizHakki, sinirsizHakki } from "@/lib/hesap/hakKapi";
import { SES_UCRETSIZ_HAK, uretimTutari } from "@/lib/krediTarife";
import { alanUretimKaydet } from "@/lib/alan/kitaplik";

export const runtime = "nodejs";
// 3D/video uzun sürebilir; makul bir üst sınır.

const GECERLI_TURLER: (UretimTuru | "muzik")[] = ["gorsel", "video", "ses", "3d", "muzik"];
const TUR_ADI: Record<string, string> = { gorsel: "Görsel", video: "Video", ses: "Ses", "3d": "3D model", muzik: "Şarkı" };

/** Sınama (yalnız geliştirme, x-vayra-sahte-saglayici: gercek): sağlayıcı yerine sabit bir gerçek çıktı. */
function sahteCikti(tur: string, model: string): SaglayiciSonuc {
  const url = tur === "gorsel" ? "/gercek/galeri/3d1.webp" : tur === "video" ? "/gercek/video-hareket/action-run.mp4" : tur === "3d" ? "/gercek/3d/kask.glb" : undefined;
  return { saglayici: "sinama", gercek: true, ...(url ? { ciktiUrl: url } : {}), detay: { model } };
}

/**
 * Üretim uç noktası. İstek gövdesi: { tur, model, prompt, meta, girdi?, kredi? }.
 * Oturum gerekir (yoksa 401). Bedel sunucuda hesaplanır (lib/krediTarife) ve sağlayıcı çağrılmadan önce
 * `x-islem-anahtari` ile kesilir; kredi yetmezse 402 { hata, gereken, bakiye }. Sağlayıcı hata verirse,
 * çıktı örnek dönerse ya da istemci bağlantıyı keserse kesinti iade edilir.
 * Gerçek sağlayıcı bağlı değilse simülasyon çalışır ve kredi kesilmez: yanıt { gercek: false, kredi: { harcanan: 0 } }.
 */
export async function POST(req: NextRequest) {
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;

  let govde: Partial<Omit<SaglayiciIstek, "tur">> & { tur?: UretimTuru | "muzik"; kredi?: unknown };
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

  // Sunucu tarafı moderasyon (katmanlı savunma): reddedilen istekte kredi hiç kesilmez.
  const denetim = icerikDenetle(prompt);
  if (!denetim.izin) {
    return NextResponse.json(
      { ok: false, moderasyon: true, kategori: denetim.kategori, hata: denetim.mesaj },
      { status: 422 }
    );
  }

  const taban = uretimTutari({ tur, model, prompt, meta: meta as Record<string, unknown> | undefined });
  const aciklama = `${TUR_ADI[tur] ?? "Üretim"} · ${String(model ?? "").slice(0, 60) || "Vayra"}`;

  // Müzik: gerçek müzik sağlayıcısı (ElevenLabs Music / Lyria). Model tanımlı değilse varsayılan.
  if (tur === "muzik") {
    const m = (meta ?? {}) as { sure?: string; enstrumantal?: boolean; stiller?: string[]; sozler?: string };
    const ad = MUZIK_MODELLERI.some((x) => x.ad === model) ? model! : MUZIK_MODELLERI[0].ad;
    const k = await krediAl(req, { oturum: o, kaynak: "uretim", aciklama, taban, istemci: govde.kredi, ucretli: muzikDurumu()[modelBul(ad).saglayici] });
    if (k instanceof Response) return k;
    if (!k.tutar && !k.sahte) return NextResponse.json({ ok: true, saglayici: "simulasyon", gercek: false, detay: { model: ad }, ...k.alanlar() });
    try {
      const sn = m.sure ? parseInt(m.sure, 10) : NaN;
      const s = await saglayiciyla(k,
        () => muzikUret({ model: ad, istem: prompt, sozler: m.sozler, stiller: m.stiller, enstrumantal: m.enstrumantal, sureSn: Number.isFinite(sn) ? sn : null }),
        () => ({ saglayici: "sinama", model: ad, sesUrl: undefined as unknown as string }));
      if (req.signal.aborted) await k.iade("İstemci bağlantıyı kesti; üretim teslim edilemedi");
      else await alanUretimKaydet(k, { tur: "muzik", model: ad, istem: prompt, url: s.sesUrl });
      return NextResponse.json({ ok: true, gercek: true, saglayici: s.saglayici, ciktiUrl: s.sesUrl, detay: { model: s.model }, ...k.alanlar() });
    } catch (hata) {
      await k.iade("Sağlayıcı hatası: kredi iade edildi");
      return NextResponse.json({ ok: false, hata: String(hata instanceof Error ? hata.message : hata).slice(0, 300), ...k.alanlar() }, { status: 502 });
    }
  }

  // Seslendirmede ücretsiz yeniden üretim: ilk ücretli işin sunucuda açtığı hak (meta.sesHak) geçerliyse kesilmez.
  const hakMeta = (meta ?? {}) as { mod?: string; ucretsiz?: boolean; sesHak?: string };
  const sesMod = tur === "ses" ? String(hakMeta.mod ?? "seslendirme") : "";
  const hakli = (sesMod === "seslendirme" || sesMod === "diyalog") && hakMeta.ucretsiz === true && (await hakKullan(o.hesap.uid, hakMeta.sesHak, taban));
  // Süreli sınırsız erişim: yalnız sunucudaki ödeme kaydı esas (istemcinin meta.sinirsiz bayrağı yok sayılır).
  const sinirsiz = await sinirsizHakki(o.hesap.uid, { tur, model, meta: meta as Record<string, unknown> | undefined });
  const ucretsiz = hakli || !!sinirsiz;
  const k = await krediAl(req, { oturum: o, kaynak: "uretim", aciklama, taban: ucretsiz ? 0 : taban, istemci: ucretsiz ? 0 : govde.kredi, ucretli: gercekUretimMumkun(tur, model) });
  if (k instanceof Response) { if (hakli) await hakGeriVer(String(hakMeta.sesHak)); return k; }
  /** Yanıtta sunucunun uyguladığı haklar: sınırsız erişim ve hız (istemci akış hızını ve eşzamanlı sınırı buradan alır). */
  const hiz = await hizHakki(o.hesap.uid);
  const hakAlanlari = { haklar: { sinirsiz: !!sinirsiz, hiz: hiz.seviye, ekEsZamanli: hiz.ekEsZamanli } };
  /** Başarısız iş hak yemez; ücretli seslendirme bitince ücretsiz yeniden üretim hakkı açılır. */
  const hakSonu = async (basarili: boolean): Promise<{ sesHak?: string }> => {
    if (hakli && !basarili) await hakGeriVer(String(hakMeta.sesHak));
    if (basarili && !hakli && k.tutar > 0 && (sesMod === "seslendirme" || sesMod === "diyalog")) return { sesHak: await hakAc(o.hesap.uid, k.tutar, SES_UCRETSIZ_HAK) };
    return {};
  };

  // Akışlı seslendirme: istemci isterse ve ElevenLabs bağlıysa ses parçaları üretilirken gönderilir (NDJSON).
  if (tur === "ses" && !k.sahte && meta?.akis === true && seslendirmeAkisiMumkun(meta) && /eleven/i.test(model ?? "")) {
    return new Response(seslendirAkis({ tur: "ses", model: model!, prompt, meta, girdi }, async (veri) => {
      if (!veri.ok) await k.iade("Sağlayıcı hatası: kredi iade edildi");
      return { ...(await hakSonu(veri.ok)), ...hakAlanlari, ...k.alanlar() };
    }), {
      headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no", ...k.basliklar() },
    });
  }

  try {
    const sonuc = await saglayiciyla(k, () => uretimYonlendir({ tur: tur as UretimTuru, model: model ?? "vayra", prompt, meta, girdi }), () => sahteCikti(tur, model ?? "vayra"));
    // Sağlayıcı bağlı değilse gerçek üretim yoktur: kesinti varsa geri verilir (istemci hata gösterir).
    if (!sonuc.gercek) await k.iade("Sağlayıcı bağlı değil: üretim yapılmadı, kredi alınmadı");
    else if (req.signal.aborted) await k.iade("İstemci bağlantıyı kesti; üretim teslim edilemedi");
    const hak = await hakSonu(!!sonuc.gercek && !req.signal.aborted);
    // Görsel çıktısı depoya yazılır: data URI tarayıcı deposunu doldurmasın, geçici sağlayıcı adresi (24 sa) ölmesin.
    if (tur === "gorsel" && sonuc.gercek && !k.sahte && (sonuc.dataUri || sonuc.ciktiUrl)) {
      const url = await ciktiKalicilastir("gorsel", (sonuc.dataUri ?? sonuc.ciktiUrl)!);
      if (!req.signal.aborted) await alanUretimKaydet(k, { tur, model, istem: prompt, url });
      return NextResponse.json({ ok: true, ...sonuc, dataUri: undefined, ciktiUrl: url, ...hakAlanlari, ...k.alanlar() });
    }
    // Etkin çalışma alanında biten gerçek çıktı alan kitaplığına da yazılır (kalıcı adresi olanlar).
    if (sonuc.gercek && !req.signal.aborted && sonuc.ciktiUrl && !sonuc.ciktiUrl.startsWith("data:")) await alanUretimKaydet(k, { tur, model, istem: prompt, url: sonuc.ciktiUrl, kapak: (sonuc as { thumbnailUrl?: string }).thumbnailUrl });
    return NextResponse.json({ ok: true, ...sonuc, ...hak, ...hakAlanlari, ...k.alanlar() });
  } catch (hata) {
    await k.iade("Sağlayıcı hatası: kredi iade edildi");
    await hakSonu(false);
    return NextResponse.json(
      { ok: false, hata: String(hata instanceof Error ? hata.message : hata).slice(0, 300), ...hakAlanlari, ...k.alanlar() },
      { status: 500 }
    );
  }
}
