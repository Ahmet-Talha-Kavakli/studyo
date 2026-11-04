import { base64Parca, dataUriYap } from "./gorselOrtak";
import { gorselHazirla } from "./video";

/**
 * İstem yardımcıları (Gemini metin modeli, Interactions API): istemi geliştirme / çevirme ve
 * görselden istem çıkarma. Ucuz ve hızlı model kullanılır. GEMINI_API_KEY yoksa çağrılmaz.
 * Model: gemini-3.5-flash-lite (Google'ın önerdiği hızlı/uygun metin modeli, 22.10.2026).
 */
export const istemHazir = () => Boolean(process.env.GEMINI_API_KEY);
const MODEL = "gemini-3.5-flash-lite";

async function metinUret(parcalar: Record<string, unknown>[]): Promise<string> {
  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
    body: JSON.stringify({ model: MODEL, input: parcalar }),
  });
  if (!r.ok) throw new Error(`İstem yardımcısı ${r.status}: ${(await r.text()).slice(0, 160)}`);
  const d = (await r.json()) as { steps?: { type?: string; content?: { type?: string; text?: string }[] }[]; output_text?: string };
  let metin = d.output_text ?? "";
  for (const s of d.steps ?? []) for (const c of s.content ?? []) if (c.type === "text" && c.text) metin = c.text;
  if (!metin.trim()) throw new Error("İstem yardımcısı yanıt vermedi.");
  return metin.trim();
}

/** Türkçe karakter ya da yaygın Türkçe sözcük varsa çeviri gerekir. */
export const turkceMi = (s: string) => /[çğıöşüÇĞİÖŞÜ]|\b(ve|bir|ile|için|gibi|olan|arka|ışık)\b/i.test(s);

const TEMIZLE = (s: string) => s.replace(/^```[a-z]*\n?|```$/g, "").replace(/^["'“]|["'”]$/g, "").trim();

/**
 * `gelistir`: istemi görsel modeli için zenginleştirir (özne, ortam, ışık, kamera, stil) ve
 * İngilizceye çevirir; kullanıcının niyetine sadık kalır, yeni öğe uydurmaz.
 * `cevir`: yalnız İngilizceye çevirir (araç talimatları için).
 */
export async function istemIsle(istem: string, mod: "gelistir" | "cevir"): Promise<string> {
  const yonerge = mod === "gelistir"
    ? `You rewrite prompts for an image generation model. Rewrite the user's prompt below into one rich, specific English prompt (max 90 words): keep every subject, attribute, text in quotes and @mentions exactly; add concrete details about composition, lighting, lens/camera and style only where the user left them open; never add new subjects or change the intent. Output ONLY the rewritten prompt.`
    : `Translate the following image-editing instruction into clear English. Keep @mentions, hex colors, numbers and quoted text unchanged. Output ONLY the translation.`;
  return TEMIZLE(await metinUret([{ type: "text", text: `${yonerge}\n\nUser prompt:\n${istem}` }]));
}

/** Görselden 1–4 istem önerisi (Türkçe; üretimde geliştirici İngilizceye çevirir). */
export async function gorselTarifEt(gorselUrl: string, adet = 3): Promise<string[]> {
  const kaynak = await gorselHazirla(gorselUrl);
  if (!kaynak) throw new Error("Görsel okunamadı.");
  const p = base64Parca(await dataUriYap(kaynak));
  const metin = await metinUret([
    { type: "image", mime_type: p.mime, data: p.veri },
    { type: "text", text: `Describe this image as ${adet} different text-to-image prompts in Turkish, each 25–60 words, varying focus (subject, style/lighting, composition). Number them 1. 2. 3. Output only the prompts.` },
  ]);
  return metin.split(/\n+/).map((s) => s.replace(/^\s*\d+[.)]\s*/, "").trim()).filter((s) => s.length > 12).slice(0, adet);
}

/**
 * Hikâyeyi sahnelere böler (storyboard). Her sahne tek görsellik, kendi başına
 * anlaşılır bir istemdir; karakter ve mekân tarifleri her sahnede tekrarlanır ki seri tutarlı kalsın.
 */
export async function sahnelereBol(hikaye: string, adet: number): Promise<{ istem: string; cekim: string; aci: string }[]> {
  const metin = await metinUret([{ type: "text", text: `You are a storyboard artist. Split this story into exactly ${adet} sequential scenes for still images.
Story (may be Turkish): """${hikaye.slice(0, 1500)}"""
Rules: each scene is ONE image prompt in Turkish, 20-45 words, self-contained (repeat the main character's look and the setting briefly in every scene so the series stays consistent), describe action, setting and light. Also pick a shot type from [genis, orta, yakin, detay, omuz] and a camera angle from [goz, alt, ust, kus, hollanda].
Output ONLY JSON: [{"istem":"...","cekim":"orta","aci":"goz"}, ...]` }]);
  const j = metin.slice(metin.indexOf("["), metin.lastIndexOf("]") + 1);
  const l = JSON.parse(j) as { istem?: string; cekim?: string; aci?: string }[];
  return l.filter((x) => x.istem && x.istem.length > 8).slice(0, adet).map((x) => ({ istem: x.istem!.trim(), cekim: x.cekim ?? "orta", aci: x.aci ?? "goz" }));
}

/**
 * Şarkı sözü yazar (Suno Lyrics / MiniMax lyrics_optimizer karşılığı). Çıktı [Verse] / [Chorus]
 * gibi bölüm başlıklı düz metindir; ElevenLabs Music ve Lyria bu başlıkları doğrudan anlar.
 * `devam`: verilen sözlerin üslubunu koruyup sonraki bölümleri ekler (yalnız yeni kısmı döner).
 */
export async function sozYaz(i: { istem: string; stiller: string[]; dil?: string; mevcut?: string; mod: "yaz" | "devam" }): Promise<string> {
  const dil = i.dil?.trim() || (turkceMi(i.istem + " " + (i.mevcut ?? "")) ? "Turkish" : "the language of the description");
  const ortak = `Song description: ${i.istem || "(none)"}\nStyles: ${i.stiller.join(", ") || "(none)"}\nLanguage: ${dil}.`;
  const yonerge = i.mod === "devam"
    ? `You are a professional songwriter. Continue the existing lyrics below with the next 2–3 sections, matching rhyme, meter, voice and story. Use section headers in square brackets on their own line ([Verse 2], [Chorus], [Bridge], [Outro]). Never use artist or song names. Output ONLY the new lines.\n\n${ortak}\n\nExisting lyrics:\n${(i.mevcut ?? "").slice(0, 3000)}`
    : `You are a professional songwriter. Write complete, singable, original song lyrics for the description below: memorable chorus, vivid imagery, natural rhyme and consistent meter. Structure with section headers in square brackets on their own line: [Intro] (optional), [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Chorus], [Bridge], [Outro]. 120–260 words. Never use artist or song names. Output ONLY the lyrics.\n\n${ortak}`;
  return TEMIZLE(await metinUret([{ type: "text", text: yonerge }])).slice(0, 3000);
}

/** Kısa müzik istemini zengin bir tarife genişletir (tür, tempo, enstrümanlar, vokal, atmosfer); dili korur. */
export async function muzikIstemGelistir(istem: string): Promise<string> {
  return TEMIZLE(await metinUret([{ type: "text", text: `You improve prompts for an AI music generator. Expand the user's short song idea into one vivid description (max 60 words) covering genre, mood, tempo/BPM, key instruments, vocal type and production feel. Keep the user's intent and language (if Turkish, answer in Turkish). Never mention artist or song names. Output ONLY the description.\n\nIdea:\n${istem}` }])).slice(0, 1000);
}

/**
 * Seslendirme metnini geliştirir (ElevenLabs v3/v4 "Enhance" karşılığı): kelimelere dokunmadan
 * uygun yerlere ses etiketleri ([excited], [whispers], [pause] …) ekler. Etiketsiz modeller için çağrılmaz.
 */
export async function sesMetniGelistir(metin: string): Promise<string> {
  return TEMIZLE(await metinUret([{ type: "text", text: `You add expressive audio tags for the ElevenLabs v3/v4 text-to-speech model. Insert tags in square brackets (e.g. [excited], [whispers], [sighs], [laughs], [thoughtful], [pause], [softly], [dramatic]) where they make the delivery more natural and emotional. Rules: do NOT change, add, remove or translate ANY original word or punctuation; only insert tags; keep tags in English; use at most one tag per sentence; keep existing tags. Output ONLY the tagged text.\n\nText:\n${metin}` }])).slice(0, 12000);
}

export type ExSenaryoSahne = { tur: string; baslik: string; anlatim: string; maddeler?: string[]; deger?: string; etiket?: string; gorsel: string };
const JSON_DIZI = (m: string) => JSON.parse(m.slice(m.indexOf("["), m.lastIndexOf("]") + 1));

/**
 * Explainer senaryosu: konu (ve varsa kaynak metin) → sahne sahne seslendirme + ekran yazısı + görsel istemi.
 * Sahne türleri: baslik, anlatim, liste, istatistik, alinti, cta. Rakamlar uydurulmaz (kaynakta yoksa istatistik kullanılmaz).
 */
export async function explainerSenaryo(i: { konu: string; kaynak?: string; ton: string; kitle: string; dil: string; hedefSn: number; stil: string }): Promise<ExSenaryoSahne[]> {
  const sahne = Math.max(3, Math.min(14, Math.round(i.hedefSn / 8)));
  const kelime = Math.round(i.hedefSn * 2.4);
  const metin = await metinUret([{ type: "text", text: `You are an award-winning explainer video scriptwriter.
Write a ${i.hedefSn}-second explainer video script (about ${kelime} spoken words in total) in ${i.dil === "en" ? "English" : "Turkish"}.
Topic: """${i.konu.slice(0, 600)}"""
${i.kaynak ? `Source material (use its facts, do not invent new numbers): """${i.kaynak.slice(0, 9000)}"""` : "No source material: do NOT invent precise statistics; if you use the istatistik type, phrase the number as an example the user should verify."}
Tone: ${i.ton}. Audience: ${i.kitle}. Visual style: ${i.stil}.
Structure: hook → problem → solution → how it works → proof → close with a clear call to action. Exactly ${sahne} scenes.
Each scene: "tur" one of [baslik, anlatim, liste, istatistik, alinti, cta] (first is baslik, last is cta, use liste and istatistik where they fit), "baslik" = on-screen text max 6 words, "anlatim" = voiceover 1–3 natural spoken sentences, "maddeler" = 2–4 items max 4 words each (only for liste), "deger" + "etiket" (only for istatistik, e.g. "%73" and "of users say…"), "gorsel" = one English image prompt describing a concrete scene in the visual style, no text in image.
Output ONLY JSON array.` }]);
  const l = JSON_DIZI(metin) as ExSenaryoSahne[];
  return l.filter((x) => x && typeof x.anlatim === "string").slice(0, 16);
}

/** Tek sahnenin metnini dönüştürür: kisalt | sadelestir | enerjik | genislet | yeniden. */
export async function sahneYaz(i: { anlatim: string; baslik: string; mod: string; konu: string; dil: string }): Promise<{ baslik: string; anlatim: string }> {
  const ne = { kisalt: "Make it about 40% shorter", sadelestir: "Make it simpler for a beginner", enerjik: "Make it more energetic and punchy", genislet: "Expand it with one more concrete sentence", yeniden: "Rewrite it with a fresh angle" }[i.mod] ?? "Improve it";
  const metin = await metinUret([{ type: "text", text: `You edit one scene of an explainer video about "${i.konu.slice(0, 200)}". ${ne}. Keep the meaning, keep the language (${i.dil === "en" ? "English" : "Turkish"}), never invent statistics.
On-screen title (max 6 words): """${i.baslik}"""
Voiceover: """${i.anlatim}"""
Output ONLY JSON: {"baslik":"...","anlatim":"..."}` }]);
  const j = JSON.parse(metin.slice(metin.indexOf("{"), metin.lastIndexOf("}") + 1)) as { baslik?: string; anlatim?: string };
  return { baslik: (j.baslik ?? i.baslik).trim(), anlatim: (j.anlatim ?? i.anlatim).trim() };
}

/** Sahneleri başka dile çevirir (ekran yazısı + seslendirme + maddeler + etiket). Sıra ve sayı korunur. */
export async function senaryoCevir(l: { baslik: string; anlatim: string; maddeler?: string[]; etiket?: string }[], hedef: string): Promise<typeof l> {
  const metin = await metinUret([{ type: "text", text: `Translate this explainer video script into ${hedef}. Keep the JSON structure, order and item counts exactly; keep numbers, brand names and @mentions. Natural spoken style for the voiceover.
${JSON.stringify(l)}
Output ONLY the JSON array.` }]);
  const c = JSON_DIZI(metin) as typeof l;
  if (!Array.isArray(c) || c.length !== l.length) throw new Error("Çeviri eksik döndü, yeniden dene.");
  return c;
}

export type FilmPlanBolum = { baslik: string; ozet: string; anlatim?: string; mekan?: string; zaman?: string; hava?: string; cekimler: { baslik: string; istem: string; boy: string; kamera: string }[] };

/**
 * Uzun video planı: logline → bölümler (hedef süreye oranlı) ve her bölümün ilk çekimleri.
 * Çekim istemleri Türkçe, görsel ve kendi başına anlaşılır; karakter/mekân her çekimde kısaca tekrarlanır.
 */
export async function filmPlani(i: { logline: string; tur: string; ton: string; hedefDk: number; bolumSayisi: number; cekimBasina: number }): Promise<FilmPlanBolum[]> {
  const metin = await metinUret([{ type: "text", text: `You are a film director planning a ${i.hedefDk}-minute ${i.tur} video.
Logline (Turkish): """${i.logline.slice(0, 1200)}"""
Tone: ${i.ton}.
Create exactly ${i.bolumSayisi} sequential chapters (acts) with a strong dramatic structure. For each chapter give: "baslik" (Turkish, max 4 words), "ozet" (Turkish, one sentence), "anlatim" (optional Turkish voiceover line, may be empty), "mekan" (Turkish, the chapter's main location in 2-5 words), "zaman" one of [safak, gunduz, altin, aksam, gece], "hava" one of [acik, bulutlu, yagmur, sis, kar], and exactly ${i.cekimBasina} shots. Each shot: "baslik" (Turkish, max 4 words), "istem" (Turkish, 20-40 words, ONE visual moment, self-contained: briefly repeat the main character's look and the location so shots stay consistent; describe action, setting, light), "boy" one of [genis, orta, yakin, detay, omuz], "kamera" one of [sabit, dolly-in, dolly-out, orbit, drone, crane, elde, tilt, whip, fpv, arc, slowmo].
Output ONLY JSON array.` }]);
  const j = metin.slice(metin.indexOf("["), metin.lastIndexOf("]") + 1);
  const l = JSON.parse(j) as FilmPlanBolum[];
  return l.filter((b) => b && b.baslik && Array.isArray(b.cekimler)).slice(0, i.bolumSayisi);
}

/**
 * Element için görsellerden tür, ad önerisi ve tarif çıkarır (Kling "AI Auto-Description" karşılığı).
 * Tarif Türkçe, modele giden kimlik bilgisidir: yalnız kalıcı özellikler (yüz, saç, kıyafet,
 * malzeme, ışık…), sahneye özgü geçici şeyler (poz, arka plan) yazılmaz.
 */
export async function elementTarifEt(gorseller: string[]): Promise<{ tur: "karakter" | "mekan" | "obje" | "stil"; ad: string; aciklama: string }> {
  const parcalar: Record<string, unknown>[] = [];
  for (const g of gorseller.slice(0, 4)) {
    const k = await gorselHazirla(g);
    if (!k) continue;
    const p = base64Parca(await dataUriYap(k));
    parcalar.push({ type: "image", mime_type: p.mime, data: p.veri });
  }
  if (!parcalar.length) throw new Error("Görsel okunamadı.");
  parcalar.push({ type: "text", text: `These images show ONE reusable element for an AI image/video generator. Reply with strict JSON only: {"tur": "karakter"|"mekan"|"obje"|"stil", "ad": a short single-word Turkish-friendly name (letters only, max 12 chars), "aciklama": Turkish description, 35-70 words, listing only permanent identifying traits (for a character: age range, face, hair colour and cut, skin, outfit, accessories; for a place: architecture, materials, light, mood; for an object: material, colour, shape, distinctive details; for a style: palette, lighting, texture, lens). No pose, no background unless it is a place, no opinions.}` });
  const ham = TEMIZLE(await metinUret(parcalar));
  const j = JSON.parse(ham.slice(ham.indexOf("{"), ham.lastIndexOf("}") + 1)) as { tur?: string; ad?: string; aciklama?: string };
  const tur = (["karakter", "mekan", "obje", "stil"] as const).find((t) => t === j.tur) ?? "karakter";
  return { tur, ad: String(j.ad ?? "").replace(/[^\p{L}\p{N}_]/gu, "").slice(0, 20), aciklama: String(j.aciklama ?? "").trim().slice(0, 600) };
}

/** AI influencer gönderisi için Türkçe caption + hashtag yazar (karakterin sesi, nişi ve sahnesiyle). */
export async function captionYaz(i: { ad: string; nis: string; ton: string; biyografi: string; sahne: string; not?: string; platform: string }): Promise<{ caption: string; etiketler: string[] }> {
  const yonerge = `You write social media captions for a virtual influencer. Write in natural, modern Turkish.
Influencer: ${i.ad}. Niche: ${i.nis}. Voice/tone: ${i.ton}. Bio: ${i.biyografi || "(none)"}.
Post: ${i.sahne}${i.not ? `, ${i.not}` : ""}. Platform: ${i.platform}.
Rules: 1-3 short sentences, first person, sounds human (no "AI", no clichés like "hayatın tadını çıkar"), at most 2 fitting emojis, then a short question or call to action. Then 8 relevant Turkish/English hashtags without spaces.
Answer ONLY as JSON: {"caption": "...", "etiketler": ["#...", ...]}`;
  const ham = TEMIZLE(await metinUret([{ type: "text", text: yonerge }]));
  const j = JSON.parse(ham.slice(ham.indexOf("{"), ham.lastIndexOf("}") + 1)) as { caption?: string; etiketler?: string[] };
  return { caption: (j.caption ?? "").slice(0, 600), etiketler: (j.etiketler ?? []).filter((x) => /^#\S+$/.test(x)).slice(0, 12) };
}
