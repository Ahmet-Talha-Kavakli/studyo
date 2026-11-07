import type { SaglayiciAdapter, SaglayiciIstek, SaglayiciSonuc, UretimTuru } from "./tipler";
import { SESLER, SES_URETIM_MODELLERI } from "@/lib/sesVeri";
import { dosyaKaydet } from "@/lib/dosyaDepo";

/**
 * ElevenLabs adaptörü — gerçek API (native fetch, bağımlılık yok). ELEVENLABS_API_KEY tanımlıysa çalışır.
 *  • Seslendirme      → POST /v1/text-to-speech/{voice_id}
 *  • Ses değiştirme   → POST /v1/speech-to-speech/{voice_id}   (kaynak dosya multipart)
 *  • Çeviri (dublaj)  → POST /v1/dubbing → durum sorgusu → GET /v1/dubbing/{id}/audio/{dil}
 * Ses klonlama ayrı uç noktadadır (bkz. sesKlonla).
 */

const API = "https://api.elevenlabs.io/v1";

/** Stüdyo model adı → ElevenLabs model_id. */
const MODEL_ID: Record<string, string> = {
  "Eleven v4": "eleven_v4",
  "Eleven v4 Turbo": "eleven_v4_turbo",
  "Eleven v3": "eleven_v3",
  "Eleven v3 Conversational": "eleven_v3_conversational",
  "Eleven Multilingual v2": "eleven_multilingual_v2",
  "Eleven Flash v2.5": "eleven_flash_v2_5",
};
const VARSAYILAN_MODEL = "eleven_multilingual_v2";

/** Seçilen ses → voice_id. Özel (klonlanmış) seste kimlik doğrudan gelir. */
function sesKimligi(istek: SaglayiciIstek): string {
  if (istek.meta?.sesId) return istek.meta.sesId;
  const hazir = SESLER.find((s) => s.ad === istek.meta?.ses);
  if (!hazir?.sesId) throw new Error(`"${istek.meta?.ses ?? "?"}" sesi sağlayıcıda tanımlı değil.`);
  return hazir.sesId;
}

/** data:<mime>;base64,... → Blob */
function dataUrlBlob(dataUrl: string): Blob {
  const m = dataUrl.match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
  if (!m) throw new Error("Kaynak dosya okunamadı.");
  const bayt = m[2] ? Buffer.from(m[3], "base64") : Buffer.from(decodeURIComponent(m[3]));
  return new Blob([bayt], { type: m[1] || "application/octet-stream" });
}

async function hata(yanit: Response, ne: string): Promise<never> {
  const govde = await yanit.text().catch(() => "");
  let mesaj = govde.slice(0, 240);
  try { const j = JSON.parse(govde); mesaj = j?.detail?.message ?? j?.detail ?? mesaj; } catch { /* düz metin */ }
  throw new Error(`${ne} başarısız (${yanit.status}): ${typeof mesaj === "string" ? mesaj : JSON.stringify(mesaj).slice(0, 240)}`);
}

/** Sağlayıcının döndürdüğü sesi depoya yazar; istemciye kalıcı URL gider (data URI tarayıcı deposunu şişirirdi). */
async function sesSonucu(yanit: Response, detay: Record<string, unknown>): Promise<SaglayiciSonuc> {
  const dizi = await yanit.arrayBuffer();
  const tip = yanit.headers.get("content-type")?.split(";")[0] || "audio/mpeg";
  return {
    ciktiUrl: await dosyaKaydet("ses", dizi, tip),
    saglayici: "eleven",
    gercek: true,
    detay: { ...detay, bytes: dizi.byteLength },
  };
}

/** İzin verilen çıktı biçimleri (kademe gerektirenler sağlayıcıda reddedilirse hata kullanıcıya iletilir). */
const BICIMLER = new Set(["mp3_44100_128", "mp3_44100_192", "wav_44100", "opus_48000_128"]);
const bicim = (b?: string) => (b && BICIMLER.has(b) ? b : "mp3_44100_128");
const tohumu = (t?: number) => (typeof t === "number" && Number.isInteger(t) && t >= 0 && t <= 4294967295 ? t : undefined);

const sinirla = (n: number | undefined, alt: number, ust: number, v: number) =>
  typeof n === "number" && Number.isFinite(n) ? Math.min(ust, Math.max(alt, n)) : v;

/** Topluluk kütüphanesindeki bir ses, kullanılmadan önce hesaba eklenmelidir (zaten ekliyse sorun değil). */
async function toplulukSesiEkle(sahip: string, sesId: string, ad: string, anahtar: string) {
  const yanit = await fetch(`${API}/voices/add/${sahip}/${sesId}`, {
    method: "POST", headers: { "xi-api-key": anahtar, "Content-Type": "application/json" }, body: JSON.stringify({ new_name: ad.slice(0, 60) }),
  });
  if (yanit.ok) return;
  const govde = await yanit.text().catch(() => "");
  if (/already|exists/i.test(govde)) return;
  throw new Error(`Topluluk sesi hesaba eklenemedi (${yanit.status}): ${govde.slice(0, 160)}`);
}

/** Ton etiketlerini desteklemeyen modellere giden metinden köşeli etiketler ayıklanır (yoksa sesli okunur). */
const etiketleriAyikla = (t: string) => t.replace(/\[[^\]\n]{1,40}\]\s*/g, "").replace(/[ \t]{2,}/g, " ").trim();

/** Telaffuz sözlüğü — aynı kural kümesi için bir kez oluşturulur, kimliği bellekte tutulur. */
const sozlukOnbellek = new Map<string, { pronunciation_dictionary_id: string; version_id: string }>();
async function telaffuzSozlugu(kurallar: { kelime: string; okunus: string }[], anahtar: string) {
  const temiz = kurallar.map((k) => ({ kelime: k.kelime.trim(), okunus: k.okunus.trim() })).filter((k) => k.kelime && k.okunus).slice(0, 100);
  if (!temiz.length) return undefined;
  const kimlik = JSON.stringify(temiz);
  const onceki = sozlukOnbellek.get(kimlik);
  if (onceki) return onceki;
  const yanit = await fetch(`${API}/pronunciation-dictionaries/add-from-rules`, {
    method: "POST", headers: { "xi-api-key": anahtar, "Content-Type": "application/json" },
    body: JSON.stringify({ name: `vayra-${Date.now().toString(36)}`, rules: temiz.map((k) => ({ type: "alias", string_to_replace: k.kelime, alias: k.okunus })) }),
  });
  if (!yanit.ok) await hata(yanit, "Telaffuz sözlüğü");
  const j = (await yanit.json()) as { id: string; version_id: string };
  const loc = { pronunciation_dictionary_id: j.id, version_id: j.version_id };
  sozlukOnbellek.set(kimlik, loc);
  return loc;
}

/** Karakter hizalamasından kelime zamanları (karaoke vurgusu ve SRT/VTT için). */
function kelimeZamanlari(h?: { characters?: string[]; character_start_times_seconds?: number[]; character_end_times_seconds?: number[] }) {
  if (!h?.characters?.length) return undefined;
  const kelimeler: { k: string; b: number; s: number }[] = [];
  let k = "", b = 0, son = 0;
  h.characters.forEach((c, i) => {
    const bas = h.character_start_times_seconds?.[i] ?? 0, bit = h.character_end_times_seconds?.[i] ?? bas;
    if (/\s/.test(c)) { if (k) kelimeler.push({ k, b, s: son }); k = ""; return; }
    if (!k) b = bas;
    k += c; son = bit;
  });
  if (k) kelimeler.push({ k, b, s: son });
  return kelimeler.slice(0, 4000).map((x) => ({ k: x.k, b: Math.round(x.b * 100) / 100, s: Math.round(x.s * 100) / 100 }));
}

/** Seslendirme isteğinin ElevenLabs gövdesi (normal ve akışlı uç nokta aynı gövdeyi kullanır). */
async function seslendirmeHazirla(istek: SaglayiciIstek, anahtar: string) {
  const tanim = SES_URETIM_MODELLERI.find((m) => m.ad === istek.model);
  const modelId = MODEL_ID[istek.model] ?? VARSAYILAN_MODEL;
  const sinir = tanim?.karakterSiniri ?? 5000;
  // Sessizce kesmek yerine reddet: kullanıcı neyin seslendirilmediğini bilmez.
  if (istek.prompt.length > sinir) throw new Error(`Metin ${istek.model} için çok uzun (${istek.prompt.length}/${sinir} karakter).`);
  const voiceId = sesKimligi(istek);
  const m = istek.meta ?? {};
  if (m.paylasimSahibi && m.sesId) await toplulukSesiEkle(m.paylasimSahibi, m.sesId, m.ses ?? "Topluluk sesi", anahtar);
  // v3 yalnız üç kademeli kararlılık alır (0 yaratıcı · 0.5 doğal · 1 dengeli); v4 yalnız kararlılık; diğerleri tam ayar seti.
  const ayarlar = modelId === "eleven_v3"
    ? { stability: (() => { const k = sinirla(m.kararlilik, 0, 1, 0.5); return k < 0.25 ? 0 : k < 0.75 ? 0.5 : 1; })() }
    : modelId === "eleven_v4" || modelId === "eleven_v4_turbo" || modelId === "eleven_v3_conversational" ? { stability: sinirla(m.kararlilik, 0, 1, 0.5) }
    : {
        stability: sinirla(m.kararlilik, 0, 1, 0.5),
        similarity_boost: sinirla(m.benzerlik, 0, 1, 0.75),
        style: sinirla(m.stil, 0, 1, 0),
        use_speaker_boost: m.konusmaciGuclendir !== false,
        speed: sinirla(m.hiz, 0.7, 1.2, 1),
      };
  const metin = tanim?.etiketler ? istek.prompt : etiketleriAyikla(istek.prompt);
  const govde: Record<string, unknown> = { text: metin, model_id: modelId, voice_settings: ayarlar };
  // Dil zorlama yalnız destekleyen modellerde gönderilir (diğerleri dili metinden algılar).
  if (m.dil && tanim?.dilZorla) govde.language_code = m.dil;
  if (tohumu(m.tohum) !== undefined) govde.seed = tohumu(m.tohum);
  if (m.normalizasyon && m.normalizasyon !== "auto") govde.apply_text_normalization = m.normalizasyon;
  if (m.telaffuz?.length) { const loc = await telaffuzSozlugu(m.telaffuz, anahtar); if (loc) govde.pronunciation_dictionary_locators = [loc]; }
  // Ses ortamı (Ekim 2026 audio effects): yalnız kullanıcı seçtiyse gönderilir.
  if (m.ortam?.filtre) govde.filter_preset_id = m.ortam.filtre;
  if (m.ortam?.gurultu) govde.background_noise_id = m.ortam.gurultu;
  if (m.ortam?.mekan) govde.environment_id = m.ortam.mekan;
  if (typeof m.ortam?.mesafe === "number") govde.distance = sinirla(m.ortam.mesafe, 0, 1, 0);
  const b = bicim(m.bicim);
  const tip = b.startsWith("wav") ? "audio/wav" : b.startsWith("opus") ? "audio/ogg" : "audio/mpeg";
  return { voiceId, modelId, govde, bicim: b, tip };
}

async function seslendir(istek: SaglayiciIstek, anahtar: string): Promise<SaglayiciSonuc> {
  const { voiceId, modelId, govde, bicim: b, tip } = await seslendirmeHazirla(istek, anahtar);
  // Zaman damgalı uç nokta: ses + karakter hizalaması (karaoke ve SRT/VTT).
  if (istek.meta?.zamanDamgasi !== false) {
    const y = await fetch(`${API}/text-to-speech/${voiceId}/with-timestamps?output_format=${b}`, {
      method: "POST", headers: { "xi-api-key": anahtar, "Content-Type": "application/json" }, body: JSON.stringify(govde),
    });
    if (!y.ok) await hata(y, "Seslendirme");
    const j = (await y.json()) as { audio_base64: string; alignment?: Hizalama; normalized_alignment?: Hizalama };
    const bayt = Buffer.from(j.audio_base64, "base64");
    const kelimeler = kelimeZamanlari(j.alignment ?? j.normalized_alignment);
    return {
      ciktiUrl: await dosyaKaydet("ses", bayt.buffer.slice(bayt.byteOffset, bayt.byteOffset + bayt.byteLength) as ArrayBuffer, tip),
      saglayici: "eleven", gercek: true,
      detay: { voiceId, model: modelId, bytes: bayt.byteLength, ...(kelimeler ? { kelimeler, sureSn: kelimeler[kelimeler.length - 1]?.s } : {}) },
    };
  }
  const yanit = await fetch(`${API}/text-to-speech/${voiceId}?output_format=${b}`, {
    method: "POST",
    headers: { "xi-api-key": anahtar, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify(govde),
  });
  if (!yanit.ok) await hata(yanit, "Seslendirme");
  return sesSonucu(yanit, { voiceId, model: modelId });
}

type Hizalama = { characters?: string[]; character_start_times_seconds?: number[]; character_end_times_seconds?: number[] };

/** Akışlı seslendirme yalnız MP3'te (tarayıcıda MediaSource ile parça parça çalınabilen biçim) ve anahtar varken. */
export const seslendirmeAkisiMumkun = (meta?: SaglayiciIstek["meta"]) =>
  Boolean(process.env.ELEVENLABS_API_KEY) && (!meta?.mod || meta.mod === "seslendirme") && bicim(meta?.bicim).startsWith("mp3");

/**
 * Akışlı seslendirme — POST /v1/text-to-speech/{voice_id}/stream/with-timestamps.
 * Sağlayıcıdan gelen her ses parçası anında istemciye satır satır JSON (NDJSON) olarak iletilir:
 *   {"t":"s","b":"<base64 mp3 parçası>"}   … çalınmaya hemen başlanır
 *   {"t":"son","veri":{ok,gercek,saglayici,ciktiUrl,detay}}   … /api/uretim'in normal yanıtıyla aynı biçim
 * Ses bitince parçalar birleştirilip depoya yazılır; kayıt, kredi ve iade akışı değişmez.
 */
/** sonda: son satır yazılmadan önce çağrılır; kredi iadesi ve bakiye gibi alanları son satıra ekler. */
export function seslendirAkis(istek: SaglayiciIstek, sonda?: (veri: { ok: boolean }) => Promise<Record<string, unknown> | void>): ReadableStream<Uint8Array> {
  const anahtar = process.env.ELEVENLABS_API_KEY!;
  const kod = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(c) {
      const yaz = (o: unknown) => c.enqueue(kod.encode(JSON.stringify(o) + "\n"));
      try {
        const { voiceId, modelId, govde, bicim: b, tip } = await seslendirmeHazirla(istek, anahtar);
        const y = await fetch(`${API}/text-to-speech/${voiceId}/stream/with-timestamps?output_format=${b}`, {
          method: "POST", headers: { "xi-api-key": anahtar, "Content-Type": "application/json" }, body: JSON.stringify(govde),
        });
        if (!y.ok || !y.body) await hata(y, "Seslendirme");
        const parcalar: Buffer[] = [];
        const hiza: Required<Hizalama> = { characters: [], character_start_times_seconds: [], character_end_times_seconds: [] };
        let ofset = 0, sonBitis = 0;
        const satirIsle = (satir: string) => {
          if (!satir.trim()) return;
          const j = JSON.parse(satir) as { audio_base64?: string; alignment?: Hizalama | null; normalized_alignment?: Hizalama | null };
          if (j.audio_base64) { parcalar.push(Buffer.from(j.audio_base64, "base64")); yaz({ t: "s", b: j.audio_base64 }); }
          const h = j.alignment ?? j.normalized_alignment;
          if (h?.characters?.length) {
            // Parça zamanları parçaya göre de gelebilir: geri giderse önceki parçanın sonunu ekle.
            const ilk = h.character_start_times_seconds?.[0] ?? 0;
            if (ilk + 0.001 < sonBitis - ofset) ofset = sonBitis;
            h.characters.forEach((ch, i) => {
              const bas = (h.character_start_times_seconds?.[i] ?? 0) + ofset, bit = (h.character_end_times_seconds?.[i] ?? 0) + ofset;
              hiza.characters.push(ch); hiza.character_start_times_seconds.push(bas); hiza.character_end_times_seconds.push(bit);
              sonBitis = Math.max(sonBitis, bit);
            });
          }
        };
        const okuyucu = y.body!.getReader();
        const coz = new TextDecoder();
        let tampon = "";
        for (;;) {
          const { value, done } = await okuyucu.read();
          if (done) break;
          tampon += coz.decode(value, { stream: true });
          let i: number;
          while ((i = tampon.indexOf("\n")) >= 0) { satirIsle(tampon.slice(0, i)); tampon = tampon.slice(i + 1); }
        }
        satirIsle(tampon);
        if (!parcalar.length) throw new Error("Sağlayıcı ses döndürmedi.");
        const bayt = Buffer.concat(parcalar);
        const kelimeler = kelimeZamanlari(hiza);
        const veri = {
          ok: true, gercek: true, saglayici: "eleven",
          ciktiUrl: await dosyaKaydet("ses", bayt.buffer.slice(bayt.byteOffset, bayt.byteOffset + bayt.byteLength) as ArrayBuffer, tip),
          detay: { voiceId, model: modelId, bytes: bayt.byteLength, akis: true, ...(kelimeler ? { kelimeler, sureSn: kelimeler[kelimeler.length - 1]?.s } : {}) },
        };
        yaz({ t: "son", veri: { ...veri, ...(await sonda?.(veri).catch(() => undefined)) } });
      } catch (e) {
        const veri = { ok: false, hata: String(e instanceof Error ? e.message : e).slice(0, 300) };
        yaz({ t: "son", veri: { ...veri, ...(await sonda?.(veri).catch(() => undefined)) } });
      } finally {
        c.close();
      }
    },
  });
}

async function sesDegistir(istek: SaglayiciIstek, anahtar: string): Promise<SaglayiciSonuc> {
  const kaynak = istek.girdi?.kaynak;
  if (!kaynak) throw new Error("Dönüştürülecek kaynak dosya gönderilmedi.");
  const voiceId = sesKimligi(istek);
  if (istek.meta?.paylasimSahibi) await toplulukSesiEkle(istek.meta.paylasimSahibi, voiceId, istek.meta.ses ?? "Topluluk sesi", anahtar);
  const form = new FormData();
  form.append("audio", dataUrlBlob(kaynak), istek.meta?.kaynakAd || "kaynak");
  form.append("model_id", "eleven_multilingual_sts_v2");
  form.append("remove_background_noise", String(!!istek.meta?.gurultuTemizle));
  form.append("voice_settings", JSON.stringify({ stability: sinirla(istek.meta?.kararlilik, 0, 1, 0.5), similarity_boost: sinirla(istek.meta?.benzerlik, 0, 1, 0.75), style: sinirla(istek.meta?.stil, 0, 1, 0), use_speaker_boost: true }));
  if (tohumu(istek.meta?.tohum) !== undefined) form.append("seed", String(tohumu(istek.meta?.tohum)));
  const yanit = await fetch(`${API}/speech-to-speech/${voiceId}?output_format=${bicim(istek.meta?.bicim)}`, {
    method: "POST", headers: { "xi-api-key": anahtar }, body: form,
  });
  if (!yanit.ok) await hata(yanit, "Ses değiştirme");
  return sesSonucu(yanit, { voiceId, model: "eleven_multilingual_sts_v2" });
}

async function cevir(istek: SaglayiciIstek, anahtar: string): Promise<SaglayiciSonuc> {
  const kaynak = istek.girdi?.kaynak;
  const hedef = istek.meta?.hedefDil;
  const url = istek.meta?.kaynakUrl;
  if (!kaynak && !url) throw new Error("Çevrilecek kaynak dosya ya da bağlantı gönderilmedi.");
  if (!hedef) throw new Error("Hedef dil seçilmedi.");
  const form = new FormData();
  if (kaynak) form.append("file", dataUrlBlob(kaynak), istek.meta?.kaynakAd || "kaynak");
  else form.append("source_url", url!);
  form.append("target_lang", hedef);
  form.append("source_lang", istek.meta?.kaynakDil || "auto");
  form.append("num_speakers", String(Math.max(0, Math.round(istek.meta?.konusmaciSayisi ?? 0))));
  const baslat = await fetch(`${API}/dubbing`, { method: "POST", headers: { "xi-api-key": anahtar }, body: form });
  if (!baslat.ok) await hata(baslat, "Çeviri");
  const { dubbing_id: id } = (await baslat.json()) as { dubbing_id: string };
  // Dublaj eşzamansızdır: uç noktanın süre sınırı içinde (≈280 sn) tamamlanmasını bekle.
  const bitis = Date.now() + 280_000;
  for (;;) {
    await new Promise((r) => setTimeout(r, 5000));
    const d = await fetch(`${API}/dubbing/${id}`, { headers: { "xi-api-key": anahtar } });
    if (!d.ok) await hata(d, "Çeviri durumu");
    const { status, error } = (await d.json()) as { status: string; error?: string };
    if (status === "dubbed") break;
    if (status === "failed") throw new Error(`Çeviri başarısız: ${error ?? "sağlayıcı işi tamamlayamadı"}`);
    if (Date.now() > bitis) throw new Error("Çeviri beklenenden uzun sürdü; daha kısa bir klip dene.");
  }
  const sonuc = await fetch(`${API}/dubbing/${id}/audio/${hedef}`, { headers: { "xi-api-key": anahtar } });
  if (!sonuc.ok) await hata(sonuc, "Çeviri çıktısı");
  return sesSonucu(sonuc, { dubbingId: id, hedef });
}

/** Çok konuşmacılı diyalog — POST /v1/text-to-dialogue (≤2.000 karakter, ≤10 farklı ses). */
async function diyalog(istek: SaglayiciIstek, anahtar: string): Promise<SaglayiciSonuc> {
  const satirlar = (istek.meta?.diyalog ?? []).filter((s) => s.metin.trim() && s.sesId);
  if (satirlar.length < 1) throw new Error("Diyalogda en az bir dolu satır olmalı.");
  const toplam = satirlar.reduce((n, s) => n + s.metin.length, 0);
  if (toplam > 2000) throw new Error(`Diyalog çok uzun (${toplam}/2000 karakter).`);
  if (new Set(satirlar.map((s) => s.sesId)).size > 10) throw new Error("Diyalogda en fazla 10 farklı ses olabilir.");
  // Topluluk sesleri önce hesaba eklenmeli (her ses bir kez).
  for (const s of new Map(satirlar.filter((x) => x.sahip).map((x) => [x.sesId, x])).values()) await toplulukSesiEkle(s.sahip!, s.sesId, s.ses ?? "Topluluk sesi", anahtar);
  const modelId = ["eleven_v4", "eleven_v4_turbo"].includes(MODEL_ID[istek.model]) ? MODEL_ID[istek.model] : "eleven_v3";
  const govde: Record<string, unknown> = {
    inputs: satirlar.map((s) => ({ text: s.metin, voice_id: s.sesId })),
    model_id: modelId,
    settings: { stability: sinirla(istek.meta?.kararlilik, 0, 1, 0.5) },
  };
  if (istek.meta?.dil) govde.language_code = istek.meta.dil;
  if (tohumu(istek.meta?.tohum) !== undefined) govde.seed = tohumu(istek.meta?.tohum);
  const yanit = await fetch(`${API}/text-to-dialogue?output_format=${bicim(istek.meta?.bicim)}`, {
    method: "POST", headers: { "xi-api-key": anahtar, "Content-Type": "application/json" }, body: JSON.stringify(govde),
  });
  if (!yanit.ok) await hata(yanit, "Diyalog");
  return sesSonucu(yanit, { model: modelId, satir: satirlar.length });
}

/** Ses efekti — POST /v1/sound-generation (0,5–30 sn, döngü). */
async function efekt(istek: SaglayiciIstek, anahtar: string): Promise<SaglayiciSonuc> {
  const m = istek.meta ?? {};
  const govde: Record<string, unknown> = {
    text: istek.prompt.slice(0, 1000),
    model_id: "eleven_text_to_sound_v2",
    prompt_influence: sinirla(m.istemEtkisi, 0, 1, 0.3),
    loop: !!m.dongu,
  };
  if (typeof m.efektSn === "number") govde.duration_seconds = sinirla(m.efektSn, 0.5, 30, 5);
  const yanit = await fetch(`${API}/sound-generation?output_format=${bicim(m.bicim)}`, {
    method: "POST", headers: { "xi-api-key": anahtar, "Content-Type": "application/json" }, body: JSON.stringify(govde),
  });
  if (!yanit.ok) await hata(yanit, "Ses efekti");
  return sesSonucu(yanit, { model: "eleven_text_to_sound_v2" });
}

/** Ses ayırma (Voice Isolator) — POST /v1/audio-isolation: konuşmayı arka plan gürültüsünden ayırır. */
async function temizle(istek: SaglayiciIstek, anahtar: string): Promise<SaglayiciSonuc> {
  const kaynak = istek.girdi?.kaynak;
  if (!kaynak) throw new Error("Temizlenecek kaynak dosya gönderilmedi.");
  const form = new FormData();
  form.append("audio", dataUrlBlob(kaynak), istek.meta?.kaynakAd || "kaynak");
  const yanit = await fetch(`${API}/audio-isolation`, { method: "POST", headers: { "xi-api-key": anahtar }, body: form });
  if (!yanit.ok) await hata(yanit, "Ses ayırma");
  return sesSonucu(yanit, { model: "audio-isolation" });
}

/** Konuşmadan metne (Scribe) — POST /v1/speech-to-text: konuşmacı ayrımı + kelime zamanları. Kaynak ses saklanır. */
async function transkript(istek: SaglayiciIstek, anahtar: string): Promise<SaglayiciSonuc> {
  const kaynak = istek.girdi?.kaynak;
  if (!kaynak) throw new Error("Yazıya dökülecek kaynak dosya gönderilmedi.");
  const blob = dataUrlBlob(kaynak);
  const form = new FormData();
  form.append("file", blob, istek.meta?.kaynakAd || "kaynak");
  form.append("model_id", "scribe_v1");
  form.append("diarize", "true");
  form.append("tag_audio_events", "true");
  form.append("timestamps_granularity", "word");
  if (istek.meta?.kaynakDil) form.append("language_code", istek.meta.kaynakDil);
  const yanit = await fetch(`${API}/speech-to-text`, { method: "POST", headers: { "xi-api-key": anahtar }, body: form });
  if (!yanit.ok) await hata(yanit, "Transkript");
  const j = (await yanit.json()) as { text?: string; language_code?: string; words?: { text: string; start?: number; end?: number; type?: string; speaker_id?: string }[] };
  const kelimeler = (j.words ?? []).filter((w) => w.type !== "spacing").slice(0, 8000)
    .map((w) => ({ k: w.text, b: Math.round((w.start ?? 0) * 100) / 100, s: Math.round((w.end ?? w.start ?? 0) * 100) / 100, ...(w.speaker_id ? { kon: w.speaker_id } : {}) }));
  const bayt = await blob.arrayBuffer();
  return {
    ciktiUrl: await dosyaKaydet("ses", bayt, blob.type || "audio/mpeg"),
    saglayici: "eleven", gercek: true,
    detay: { model: "scribe_v1", transkript: (j.text ?? "").slice(0, 60000), dil: j.language_code, kelimeler, sureSn: kelimeler[kelimeler.length - 1]?.s },
  };
}

export const elevenAdapter: SaglayiciAdapter = {
  ad: "eleven",
  hazir() {
    return Boolean(process.env.ELEVENLABS_API_KEY);
  },
  destekler(tur: UretimTuru) {
    return tur === "ses";
  },
  async uret(istek: SaglayiciIstek): Promise<SaglayiciSonuc> {
    const anahtar = process.env.ELEVENLABS_API_KEY!;
    if (istek.meta?.mod === "sesdegistir") return sesDegistir(istek, anahtar);
    if (istek.meta?.mod === "ceviri") return cevir(istek, anahtar);
    if (istek.meta?.mod === "diyalog") return diyalog(istek, anahtar);
    if (istek.meta?.mod === "efekt") return efekt(istek, anahtar);
    if (istek.meta?.mod === "temizle") return temizle(istek, anahtar);
    if (istek.meta?.mod === "transkript") return transkript(istek, anahtar);
    return seslendir(istek, anahtar);
  },
};

/** Anlık ses klonu (Instant Voice Cloning) — POST /v1/voices/add. 1–5 örnek dosya (`files` tekrarlı),
 *  isteğe bağlı açıklama, etiketler ve arka plan gürültüsü temizleme. Dönen voice_id özel seste saklanır. */
export async function sesKlonla(ad: string, ornekler: { veri: string; ad: string }[], ek: { aciklama?: string; etiketler?: Record<string, string>; gurultuTemizle?: boolean } = {}): Promise<{ sesId: string }> {
  const anahtar = process.env.ELEVENLABS_API_KEY;
  if (!anahtar) throw new Error("Ses sağlayıcısı bağlı değil.");
  if (!ornekler.length) throw new Error("En az bir örnek ses gerekli.");
  const form = new FormData();
  form.append("name", ad);
  for (const o of ornekler.slice(0, 5)) form.append("files", dataUrlBlob(o.veri), o.ad || "ornek");
  form.append("remove_background_noise", String(ek.gurultuTemizle ?? true));
  if (ek.aciklama?.trim()) form.append("description", ek.aciklama.trim().slice(0, 500));
  if (ek.etiketler && Object.keys(ek.etiketler).length) form.append("labels", JSON.stringify(ek.etiketler));
  const yanit = await fetch(`${API}/voices/add`, { method: "POST", headers: { "xi-api-key": anahtar }, body: form });
  if (!yanit.ok) await hata(yanit, "Klonlama");
  const { voice_id } = (await yanit.json()) as { voice_id: string };
  return { sesId: voice_id };
}

/** Metinden ses tasarımı — POST /v1/text-to-voice/design. 3 önizleme döner (base64 MP3 + geçici kimlik). */
export type TasarimAyar = { loudness?: number; guidanceScale?: number; seed?: number };
type TasarimSonuc = { onizlemeler: { kimlik: string; ses: string; sn: number }[]; metin: string };
const tasarimAyarlari = (a: TasarimAyar = {}) => ({
  ...(typeof a.loudness === "number" && Number.isFinite(a.loudness) ? { loudness: Math.min(1, Math.max(-1, a.loudness)) } : {}),
  ...(typeof a.guidanceScale === "number" && Number.isFinite(a.guidanceScale) ? { guidance_scale: Math.min(100, Math.max(0, a.guidanceScale)) } : {}),
  ...(typeof a.seed === "number" && Number.isInteger(a.seed) && a.seed >= 0 && a.seed <= 4294967295 ? { seed: a.seed } : {}),
});
async function onizlemeleriAl(yanit: Response): Promise<TasarimSonuc> {
  const j = (await yanit.json()) as { previews: { audio_base_64: string; generated_voice_id: string; media_type?: string; duration_secs?: number }[]; text: string };
  return {
    metin: j.text,
    onizlemeler: j.previews.map((p) => ({ kimlik: p.generated_voice_id, ses: `data:${p.media_type || "audio/mpeg"};base64,${p.audio_base_64}`, sn: p.duration_secs ?? 0 })),
  };
}

export async function sesTasarla(aciklama: string, metin?: string, gelistir?: boolean, ayar?: TasarimAyar): Promise<TasarimSonuc> {
  const anahtar = process.env.ELEVENLABS_API_KEY;
  if (!anahtar) throw new Error("Ses sağlayıcısı bağlı değil.");
  const govde: Record<string, unknown> = { voice_description: aciklama.slice(0, 1000), model_id: "eleven_ttv_v3", should_enhance: !!gelistir, ...tasarimAyarlari(ayar) };
  if (metin && metin.length >= 100) govde.text = metin.slice(0, 1000); else govde.auto_generate_text = true;
  const yanit = await fetch(`${API}/text-to-voice/design?output_format=mp3_44100_128`, {
    method: "POST", headers: { "xi-api-key": anahtar, "Content-Type": "application/json" }, body: JSON.stringify(govde),
  });
  if (!yanit.ok) await hata(yanit, "Ses tasarımı");
  return onizlemeleriAl(yanit);
}

/** Tasarlanan önizlemeyi kalıcı sese çevirir — POST /v1/text-to-voice. */
export async function tasarimKaydet(ad: string, aciklama: string, kimlik: string, secilmeyenler: string[] = []): Promise<{ sesId: string }> {
  const anahtar = process.env.ELEVENLABS_API_KEY;
  if (!anahtar) throw new Error("Ses sağlayıcısı bağlı değil.");
  const yanit = await fetch(`${API}/text-to-voice`, {
    method: "POST", headers: { "xi-api-key": anahtar, "Content-Type": "application/json" },
    body: JSON.stringify({ voice_name: ad.slice(0, 60), voice_description: aciklama.slice(0, 1000), generated_voice_id: kimlik, played_not_selected_voice_ids: secilmeyenler }),
  });
  if (!yanit.ok) await hata(yanit, "Ses kaydetme");
  const { voice_id } = (await yanit.json()) as { voice_id: string };
  return { sesId: voice_id };
}

/** Kullanıcının kendi sesini sağlayıcıdan siler — DELETE /v1/voices/{id}. */
export async function sesSil(sesId: string): Promise<void> {
  const anahtar = process.env.ELEVENLABS_API_KEY;
  if (!anahtar) throw new Error("Ses sağlayıcısı bağlı değil.");
  const yanit = await fetch(`${API}/voices/${sesId}`, { method: "DELETE", headers: { "xi-api-key": anahtar } });
  if (!yanit.ok && yanit.status !== 404) await hata(yanit, "Ses silme");
}

/** Var olan bir sesi yeniden yorumlar (Remix) — POST /v1/text-to-voice/{voice_id}/remix. Tasarımla aynı önizleme biçimi. */
export async function sesRemix(sesId: string, aciklama: string, metin?: string, gelistir?: boolean, ayar?: TasarimAyar): Promise<TasarimSonuc> {
  const anahtar = process.env.ELEVENLABS_API_KEY;
  if (!anahtar) throw new Error("Ses sağlayıcısı bağlı değil.");
  const govde: Record<string, unknown> = { voice_description: aciklama.slice(0, 1000), should_enhance: !!gelistir, ...tasarimAyarlari(ayar) };
  if (metin && metin.length >= 100) govde.text = metin.slice(0, 1000); else govde.auto_generate_text = true;
  const yanit = await fetch(`${API}/text-to-voice/${encodeURIComponent(sesId)}/remix?output_format=mp3_44100_128`, {
    method: "POST", headers: { "xi-api-key": anahtar, "Content-Type": "application/json" }, body: JSON.stringify(govde),
  });
  if (!yanit.ok) await hata(yanit, "Ses remiksi");
  return onizlemeleriAl(yanit);
}
