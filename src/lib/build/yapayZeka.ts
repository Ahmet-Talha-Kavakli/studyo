import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK, ciktiKalicilastir } from "@/lib/dosyaDepo";
import { gorselUret } from "@/lib/saglayicilar/gorselMotor";
import { baglantiBul, claudeBagli } from "./disAjan";
import { BUILD_MODELLERI } from "./modeller";

/**
 * Vayra Yapay Zekâ geçidi: Build ile yapılan sitelerin ve uygulamaların anahtar gerektirmeden metin ve görsel üretmesi.
 * Site kodu window.vayra.ai.sohbet(...) / vayra.ai.gorsel(...) çağırır; istek /api/build/ai/<proje>/<islem> üzerinden gelir.
 * Sahip Bulut > Yapay zekâ bölümünden açar, günlük sınır ve sistem talimatı koyar. Kullanım proje başına günlük sayılır.
 */
export type AiAyar = { acik: boolean; gunlukSinir: number; sistem: string };
export const AI_VARSAYILAN: AiAyar = { acik: false, gunlukSinir: 200, sistem: "" };

export type AiMesaj = { rol: "kullanici" | "asistan"; metin: string };

/** Hangi motorun bağlı olduğunu söyler (arayüzde dürüst durum için). */
export function aiMotoru(): { metin: string | null; gorsel: boolean } {
  if (claudeBagli()) return { metin: "Claude Haiku 5.5", gorsel: true };
  const m = BUILD_MODELLERI.filter((x) => x.saglayici !== "anthropic").sort((a, b) => a.fiyat[0] - b.fiyat[0]).find((x) => baglantiBul(x));
  return { metin: m?.ad ?? null, gorsel: true };
}

/** Metin üretir: Claude bağlıysa Haiku 5.5, değilse bağlı en ucuz OpenAI uyumlu model. */
export async function aiMetin(g: { sistem: string; mesajlar: AiMesaj[]; enCok: number; signal?: AbortSignal }): Promise<string> {
  const mesajlar = g.mesajlar.filter((m) => m.metin.trim()).slice(-20);
  if (!mesajlar.length || mesajlar.at(-1)!.rol !== "kullanici") throw new Error("Son mesaj kullanıcıdan olmalı.");
  if (claudeBagli()) {
    const c = new Anthropic();
    const y = await c.messages.create({
      model: "claude-haiku-5-5", max_tokens: g.enCok, system: g.sistem,
      messages: mesajlar.map((m) => ({ role: m.rol === "kullanici" ? "user" as const : "assistant" as const, content: m.metin })),
    }, { signal: g.signal });
    return y.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("").trim();
  }
  const model = BUILD_MODELLERI.filter((x) => x.saglayici !== "anthropic").sort((a, b) => a.fiyat[0] - b.fiyat[0]).find((x) => baglantiBul(x));
  const b = model ? baglantiBul(model) : null;
  if (!model || !b) throw new Error("AI_YOK");
  const r = await fetch(`${b.url}/chat/completions`, {
    method: "POST", signal: g.signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${b.anahtar}` },
    body: JSON.stringify({ model: b.model, max_tokens: g.enCok, stream: false, messages: [{ role: "system", content: g.sistem }, ...mesajlar.map((m) => ({ role: m.rol === "kullanici" ? "user" : "assistant", content: m.metin }))] }),
  });
  const ham = await r.text();
  if (!r.ok) throw new Error(`Model yanıt vermedi (${r.status})`);
  // Akış dönen sağlayıcılar için SSE parçalarını da birleştir.
  if (ham.startsWith("data:")) return ham.split("\n").filter((x) => x.startsWith("data:") && !x.includes("[DONE]")).map((x) => { try { return JSON.parse(x.slice(5)).choices?.[0]?.delta?.content ?? ""; } catch { return ""; } }).join("").trim();
  const j = JSON.parse(ham) as { choices?: { message?: { content?: string } }[] };
  return (j.choices?.[0]?.message?.content ?? "").trim();
}

export async function aiGorsel(istem: string, oran: string): Promise<string> {
  const s = await gorselUret({ tur: "gorsel", model: "Auto", prompt: istem, meta: { oran } });
  const kaynak = s?.ciktiUrl || s?.dataUri;
  if (!kaynak) throw new Error("GORSEL_YOK");
  return ciktiKalicilastir("gorsel", kaynak);
}

/* ── Günlük kullanım sayacı (proje başına, Türkiye günü) ── */
const KOK = path.join(DEPO_KOK, "build", "ai-kullanim");
const gun = () => new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);
type Sayac = { gun: string; metin: number; gorsel: number; hata: number; gecmis: { gun: string; metin: number; gorsel: number; hata: number }[] };
const kilit = new Map<string, Promise<unknown>>();

async function oku(id: string): Promise<Sayac> {
  try { return JSON.parse(await readFile(path.join(KOK, `${id}.json`), "utf8")) as Sayac; } catch { return { gun: gun(), metin: 0, gorsel: 0, hata: 0, gecmis: [] }; }
}
export async function aiKullanim(id: string): Promise<Sayac> {
  const s = await oku(id);
  if (s.gun !== gun()) return { gun: gun(), metin: 0, gorsel: 0, hata: 0, gecmis: [{ gun: s.gun, metin: s.metin, gorsel: s.gorsel, hata: s.hata }, ...s.gecmis].slice(0, 30) };
  return s;
}
/** Sayaç artırır; sınır aşıldıysa false döner (artırmaz). */
export async function aiSay(id: string, tur: "metin" | "gorsel" | "hata", sinir?: number): Promise<boolean> {
  const onceki = kilit.get(id) ?? Promise.resolve();
  let sonuc = true;
  const is = onceki.then(async () => {
    const s = await aiKullanim(id);
    if (sinir !== undefined && tur !== "hata" && s.metin + s.gorsel >= sinir) { sonuc = false; return; }
    s[tur]++;
    await mkdir(KOK, { recursive: true });
    await writeFile(path.join(KOK, `${id}.json`), JSON.stringify(s));
  });
  kilit.set(id, is.catch(() => {}));
  await is;
  return sonuc;
}
