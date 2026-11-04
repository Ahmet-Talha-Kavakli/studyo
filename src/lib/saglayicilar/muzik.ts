import { dosyaKaydet } from "@/lib/dosyaDepo";
import { zipAc } from "@/lib/zipAc";
import { modelBul, MUZIK_BICIMLERI, BOLUM_MIN_MS, BOLUM_MAX_MS, PLAN_MAX_BOLUM, type MuzikPlan, type PlanBolumu } from "@/lib/muzikVeri";

/**
 * Müzik sağlayıcıları (yalnız sunucu).
 *  • ElevenLabs Music: POST /v1/music/detailed — multipart yanıt (JSON + ses), "song-id" başlığı.
 *    Bölüm planı: POST /v1/music/plan (kredi harcamaz). Stem: POST /v1/music/stem-separation (ZIP).
 *  • Google Lyria: POST /v1beta/interactions — yanıt adımlarında base64 ses + metin (sözler).
 */

const ELEVEN = "https://api.elevenlabs.io/v1";
const GEMINI = "https://generativelanguage.googleapis.com/v1beta";
const ELEVEN_MODEL: Record<string, string> = { "Eleven Music v2.5": "music_v2_5", "Eleven Music v2": "music_v2", "Eleven Music v1": "music_v1" };
const LYRIA_MODEL: Record<string, string> = { "Lyria 3.5": "lyria-3.5", "Lyria 3 Clip": "lyria-3-clip-preview" };

export type MuzikIstek = {
  model: string;
  istem?: string;
  sozler?: string;
  stiller?: string[];
  haric?: string[];
  enstrumantal?: boolean;
  /** null/undefined: model seçer. */
  sureSn?: number | null;
  plan?: MuzikPlan;
  tohum?: number;
  bicim?: string;
  c2pa?: boolean;
};
export type MuzikSonuc = {
  sesUrl: string;
  saglayici: "eleven" | "lyria";
  model: string;
  plan?: MuzikPlan;
  baslik?: string;
  aciklama?: string;
  turler?: string[];
  diller?: string[];
  acik?: boolean;
  sozler?: string;
  sarkiId?: string;
};

export const muzikDurumu = () => ({ eleven: !!process.env.ELEVENLABS_API_KEY, lyria: !!process.env.GEMINI_API_KEY });

async function hata(yanit: Response, islem: string): Promise<never> {
  const govde = await yanit.text().catch(() => "");
  let mesaj = govde.slice(0, 240);
  try {
    const j = JSON.parse(govde);
    const d = j.detail ?? j.error;
    mesaj = typeof d === "string" ? d : Array.isArray(d) ? d.map((x: { msg?: string }) => x.msg).filter(Boolean).join("; ") : d?.message ?? mesaj;
  } catch { /* metin olarak kalır */ }
  throw new Error(`${islem} başarısız (${yanit.status})${mesaj ? `: ${mesaj}` : ""}`);
}

const temizListe = (l?: string[]) => (l ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 50);
const bicimSec = (b?: string) => (MUZIK_BICIMLERI.some((x) => x.id === b) ? b! : "mp3_44100_128");
const sinirla = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
const mimeBul = (bicim: string) => (bicim.startsWith("opus") ? "audio/opus" : "audio/mpeg");

/* ── Plan dönüşümleri ── */
type V1Plan = { positive_global_styles: string[]; negative_global_styles: string[]; sections: { section_name: string; positive_local_styles: string[]; negative_local_styles: string[]; duration_ms: number; lines: string[] }[] };
type V2Parca = { text: string; duration_ms: number; positive_styles: string[]; negative_styles?: string[] };
type V2Plan = { chunks: (V2Parca | { song_id: string })[] };

function bolumTemiz(b: PlanBolumu) {
  return {
    ad: (b.ad || "Section").slice(0, 100),
    sureMs: Math.round(sinirla(b.sureMs, BOLUM_MIN_MS, BOLUM_MAX_MS)),
    satirlar: b.satirlar.map((s) => s.trim()).filter(Boolean).slice(0, 30).map((s) => s.slice(0, 200)),
    pozitif: temizListe(b.pozitif), negatif: temizListe(b.negatif),
  };
}

/** Vayra planı → sağlayıcı planı (v1: sections, v2/v2.5: chunks). */
export function planSaglayiciya(p: MuzikPlan, modelId: string): V1Plan | V2Plan {
  const bolumler = p.bolumler.slice(0, PLAN_MAX_BOLUM).map(bolumTemiz);
  if (!bolumler.length) throw new Error("Planda en az bir bölüm olmalı.");
  if (modelId === "music_v1") {
    return {
      positive_global_styles: temizListe(p.pozitif), negative_global_styles: temizListe(p.negatif),
      sections: bolumler.map((b) => ({ section_name: b.ad, positive_local_styles: b.pozitif, negative_local_styles: b.negatif, duration_ms: b.sureMs, lines: b.satirlar })),
    };
  }
  // v2: genel stiller ilk bölüme taşınır (ilk parça şarkının tonunu belirler).
  return {
    chunks: bolumler.map((b, i) => ({
      text: [`[${b.ad}]`, ...b.satirlar].join("\n"),
      duration_ms: b.sureMs,
      positive_styles: i === 0 ? [...new Set([...temizListe(p.pozitif), ...b.pozitif])].slice(0, 50) : b.pozitif,
      negative_styles: i === 0 ? [...new Set([...temizListe(p.negatif), ...b.negatif])].slice(0, 50) : b.negatif,
    })),
  };
}

/** Sağlayıcı planı → Vayra planı. */
export function planVayraya(ham: unknown): MuzikPlan | undefined {
  const k = ham as Partial<V1Plan & V2Plan> | null;
  if (!k) return undefined;
  const id = (i: number) => `b${i}_${Math.random().toString(36).slice(2, 7)}`;
  if (Array.isArray(k.sections)) {
    return {
      pozitif: k.positive_global_styles ?? [], negatif: k.negative_global_styles ?? [],
      bolumler: k.sections.map((s, i) => ({ id: id(i), ad: s.section_name, sureMs: s.duration_ms, satirlar: s.lines ?? [], pozitif: s.positive_local_styles ?? [], negatif: s.negative_local_styles ?? [] })),
    };
  }
  if (Array.isArray(k.chunks)) {
    const parcalar = k.chunks.filter((c): c is V2Parca => typeof (c as V2Parca).text === "string");
    return {
      pozitif: [], negatif: [],
      bolumler: parcalar.map((c, i) => {
        const satirlar = c.text.split("\n");
        const bas = satirlar[0]?.match(/^\[(.+)\]$/);
        return { id: id(i), ad: bas ? bas[1] : `Bölüm ${i + 1}`, sureMs: c.duration_ms, satirlar: (bas ? satirlar.slice(1) : satirlar).filter((s) => s.trim()), pozitif: c.positive_styles ?? [], negatif: c.negative_styles ?? [] };
      }),
    };
  }
  return undefined;
}

/** İstem modunda tek metin: anlatım + stiller + hariç + sözler. */
function istemMetni(i: MuzikIstek, negatifAyri: boolean): string {
  const parca: string[] = [];
  if (i.istem?.trim()) parca.push(i.istem.trim());
  const st = temizListe(i.stiller);
  if (st.length) parca.push(`Style: ${st.join(", ")}.`);
  const hr = temizListe(i.haric);
  if (hr.length && !negatifAyri) parca.push(`Avoid: ${hr.join(", ")}.`);
  if (i.enstrumantal) parca.push("Instrumental only, no vocals.");
  else if (i.sozler?.trim()) parca.push(`Lyrics:\n${i.sozler.trim()}`);
  return parca.join("\n");
}

/** multipart/mixed yanıtı: JSON parçası + ses parçası. */
function cokParcaliAc(bayt: Buffer, icerikTipi: string): { json?: Record<string, unknown>; ses?: Buffer; sesTipi?: string } {
  const sinir = icerikTipi.match(/boundary="?([^";]+)"?/i)?.[1] ?? bayt.subarray(0, 200).toString("latin1").split(/\r?\n/)[0].replace(/^--/, "").trim();
  const ayrac = Buffer.from(`--${sinir}`);
  const sonuc: { json?: Record<string, unknown>; ses?: Buffer; sesTipi?: string } = {};
  let i = bayt.indexOf(ayrac);
  while (i >= 0) {
    const sonraki = bayt.indexOf(ayrac, i + ayrac.length);
    if (sonraki < 0) break;
    const parca = bayt.subarray(i + ayrac.length, sonraki);
    const bas = parca.indexOf("\r\n\r\n") >= 0 ? parca.indexOf("\r\n\r\n") + 4 : parca.indexOf("\n\n") + 2;
    const baslik = parca.subarray(0, bas).toString("latin1");
    let govde = parca.subarray(bas);
    if (govde.subarray(-2).toString("latin1") === "\r\n") govde = govde.subarray(0, -2);
    else if (govde.subarray(-1).toString("latin1") === "\n") govde = govde.subarray(0, -1);
    const tip = baslik.match(/content-type:\s*([^\r\n;]+)/i)?.[1]?.trim().toLowerCase() ?? "";
    if (tip.includes("json")) { try { sonuc.json = JSON.parse(govde.toString("utf8")); } catch { /* yok say */ } }
    else if (tip.startsWith("audio/") || /filename=/i.test(baslik)) { sonuc.ses = Buffer.from(govde); sonuc.sesTipi = tip || "audio/mpeg"; }
    i = sonraki;
  }
  return sonuc;
}

async function eleven(i: MuzikIstek, anahtar: string): Promise<MuzikSonuc> {
  const modelId = ELEVEN_MODEL[i.model];
  const bicim = bicimSec(i.bicim);
  const govde: Record<string, unknown> = { model_id: modelId };
  if (i.plan) {
    govde.composition_plan = planSaglayiciya(i.plan, modelId);
    if (typeof i.tohum === "number" && Number.isInteger(i.tohum) && i.tohum >= 0) govde.seed = i.tohum;
  } else {
    const metin = istemMetni(i, false);
    if (metin.length < 3) throw new Error("Şarkıyı anlatan bir istem yaz.");
    govde.prompt = metin.slice(0, 4100);
    if (typeof i.sureSn === "number") govde.music_length_ms = Math.round(sinirla(i.sureSn, 3, 600) * 1000);
    if (i.enstrumantal) govde.force_instrumental = true;
  }
  if (i.c2pa && bicim.startsWith("mp3")) govde.sign_with_c2pa = true;
  const yanit = await fetch(`${ELEVEN}/music/detailed?output_format=${bicim}`, {
    method: "POST", headers: { "xi-api-key": anahtar, "Content-Type": "application/json" }, body: JSON.stringify(govde),
  });
  if (!yanit.ok) await hata(yanit, "Müzik üretimi");
  const bayt = Buffer.from(await yanit.arrayBuffer());
  const tip = yanit.headers.get("content-type") ?? "";
  const { json, ses } = tip.startsWith("audio/") ? { json: undefined, ses: bayt } : cokParcaliAc(bayt, tip);
  if (!ses?.length) throw new Error("Sağlayıcı ses döndürmedi.");
  const md = (json?.song_metadata ?? {}) as { title?: string; description?: string; genres?: string[]; languages?: string[]; is_explicit?: boolean };
  return {
    sesUrl: await dosyaKaydet("muzik", ses, mimeBul(bicim)), saglayici: "eleven", model: modelId,
    plan: planVayraya(json?.composition_plan), baslik: md.title, aciklama: md.description, turler: md.genres, diller: md.languages, acik: md.is_explicit,
    sarkiId: yanit.headers.get("song-id") ?? undefined,
  };
}

/** Lyria yanıtını dolaşıp ses ve metin bloklarını toplar (adım yapısına bağımlı kalmadan). */
function lyriaAc(j: unknown): { ses?: { data: string; mime: string }; metin: string[] } {
  const metin: string[] = []; let ses: { data: string; mime: string } | undefined;
  const gez = (o: unknown) => {
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o)) return o.forEach(gez);
    const k = o as Record<string, unknown>;
    if (k.type === "audio" && typeof k.data === "string") ses = { data: k.data, mime: String(k.mime_type ?? k.mimeType ?? "audio/mpeg") };
    else if (k.type === "text" && typeof k.text === "string") metin.push(k.text);
    Object.values(k).forEach(gez);
  };
  gez(j);
  return { ses, metin };
}

async function lyria(i: MuzikIstek, anahtar: string): Promise<MuzikSonuc> {
  const model = LYRIA_MODEL[i.model];
  const tanim = modelBul(i.model);
  let metin = istemMetni(i, false);
  if (tanim.sure.tur === "istem" && typeof i.sureSn === "number") metin += `\nDuration: about ${Math.round(i.sureSn / 60) || 1} minute(s).`;
  if (metin.length < 3) throw new Error("Şarkıyı anlatan bir istem yaz.");
  const yanit = await fetch(`${GEMINI}/interactions`, {
    method: "POST", headers: { "x-goog-api-key": anahtar, "Content-Type": "application/json" },
    body: JSON.stringify({ model, input: metin.slice(0, 8000) }),
  });
  if (!yanit.ok) await hata(yanit, "Müzik üretimi");
  const { ses, metin: metinler } = lyriaAc(await yanit.json());
  if (!ses) throw new Error("Sağlayıcı ses döndürmedi (içerik filtresi olabilir).");
  const mime = ses.mime.includes("wav") ? "audio/wav" : "audio/mpeg";
  return { sesUrl: await dosyaKaydet("muzik", Buffer.from(ses.data, "base64"), mime), saglayici: "lyria", model, sozler: metinler.join("\n").trim() || undefined };
}

export async function muzikUret(i: MuzikIstek): Promise<MuzikSonuc> {
  const tanim = modelBul(i.model);
  if (tanim.ad !== i.model) throw new Error(`"${i.model}" tanımlı bir müzik modeli değil.`);
  if (tanim.saglayici === "eleven") {
    const k = process.env.ELEVENLABS_API_KEY; if (!k) throw new Error("Müzik sağlayıcısı (ElevenLabs) bağlı değil.");
    return eleven(i, k);
  }
  const k = process.env.GEMINI_API_KEY; if (!k) throw new Error("Müzik sağlayıcısı (Google Lyria) bağlı değil.");
  if (i.plan) throw new Error("Bölüm planı yalnız Eleven Music modellerinde kullanılabilir.");
  return lyria(i, k);
}

/** İstemden bölüm planı (ElevenLabs; kredi harcamaz). */
export async function planOlustur(istem: string, model: string, sureSn?: number | null): Promise<MuzikPlan> {
  const k = process.env.ELEVENLABS_API_KEY; if (!k) throw new Error("Müzik sağlayıcısı (ElevenLabs) bağlı değil.");
  const modelId = ELEVEN_MODEL[model] ?? "music_v2_5";
  const govde: Record<string, unknown> = { prompt: istem.slice(0, 4100), model_id: modelId };
  if (typeof sureSn === "number") govde.music_length_ms = Math.round(sinirla(sureSn, 3, 600) * 1000);
  const yanit = await fetch(`${ELEVEN}/music/plan`, { method: "POST", headers: { "xi-api-key": k, "Content-Type": "application/json" }, body: JSON.stringify(govde) });
  if (!yanit.ok) await hata(yanit, "Bölüm planı");
  const plan = planVayraya(await yanit.json());
  if (!plan?.bolumler.length) throw new Error("Sağlayıcı boş plan döndürdü.");
  return plan;
}

/** Stem ayırma — ZIP açılır, her stem ayrı dosya olarak saklanır. */
export async function stemAyir(dosya: Blob, ad: string): Promise<{ ad: string; url: string }[]> {
  const k = process.env.ELEVENLABS_API_KEY; if (!k) throw new Error("Müzik sağlayıcısı (ElevenLabs) bağlı değil.");
  const form = new FormData();
  form.append("file", dosya, ad || "parca.mp3");
  const yanit = await fetch(`${ELEVEN}/music/stem-separation?output_format=mp3_44100_128`, { method: "POST", headers: { "xi-api-key": k }, body: form });
  if (!yanit.ok) await hata(yanit, "Stem ayırma");
  const dosyalar = zipAc(Buffer.from(await yanit.arrayBuffer())).filter((d) => /\.(mp3|wav|opus|ogg)$/i.test(d.ad));
  if (!dosyalar.length) throw new Error("Arşivde stem bulunamadı.");
  return Promise.all(dosyalar.map(async (d) => ({
    ad: d.ad.split("/").pop()!.replace(/\.[a-z0-9]+$/i, ""),
    url: await dosyaKaydet("muzik", d.bayt, /\.wav$/i.test(d.ad) ? "audio/wav" : "audio/mpeg"),
  })));
}

/** Videodan müzik — POST /v1/music/video-to-music (multipart). Videolar sırayla birleştirilir;
 *  ayriKanal açıksa ZIP döner (müzik + efekt kanalları ayrı dosya olur). */
export async function videodanMuzik(videolar: Blob[], s: {
  aciklama?: string; etiketler?: string[]; model?: string; efekt?: boolean; ayriKanal?: boolean; sesReferans?: boolean; c2pa?: boolean; bicim?: string;
}): Promise<{ sesUrl: string; kanallar?: { ad: string; url: string }[] }> {
  const k = process.env.ELEVENLABS_API_KEY; if (!k) throw new Error("Müzik sağlayıcısı (ElevenLabs) bağlı değil.");
  const bicim = bicimSec(s.bicim);
  const form = new FormData();
  videolar.forEach((v, i) => form.append("videos", v, `video-${i + 1}.mp4`));
  if (s.aciklama?.trim()) form.append("description", s.aciklama.trim().slice(0, 4100));
  for (const t of (s.etiketler ?? []).slice(0, 10)) form.append("tags", t);
  if (s.model && ELEVEN_MODEL[s.model]) form.append("model_id", ELEVEN_MODEL[s.model]);
  if (s.efekt) form.append("add_sfx", "true");
  if (s.ayriKanal) form.append("separate_tracks", "true");
  if (s.sesReferans) form.append("use_audio_as_reference", "true");
  if (s.c2pa && bicim.startsWith("mp3")) form.append("sign_with_c2pa", "true");
  const yanit = await fetch(`${ELEVEN}/music/video-to-music?output_format=${bicim}`, { method: "POST", headers: { "xi-api-key": k }, body: form });
  if (!yanit.ok) await hata(yanit, "Videodan müzik");
  const bayt = Buffer.from(await yanit.arrayBuffer());
  const zip = (yanit.headers.get("content-type") ?? "").includes("zip") || (bayt[0] === 0x50 && bayt[1] === 0x4b);
  if (!zip) return { sesUrl: await dosyaKaydet("muzik", bayt, mimeBul(bicim)) };
  const dosyalar = zipAc(bayt).filter((d) => /\.(mp3|wav|opus|ogg)$/i.test(d.ad));
  if (!dosyalar.length) throw new Error("Arşivde ses bulunamadı.");
  const kanallar = await Promise.all(dosyalar.map(async (d) => ({
    ad: d.ad.split("/").pop()!.replace(/\.[a-z0-9]+$/i, ""),
    url: await dosyaKaydet("muzik", d.bayt, /\.wav$/i.test(d.ad) ? "audio/wav" : mimeBul(bicim)),
  })));
  const ana = kanallar.find((x) => /music|muzik/i.test(x.ad)) ?? kanallar[0];
  return { sesUrl: ana.url, kanallar };
}
