import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { AracIzni } from "./ajanKatalog";
import { baglantiBul, claudeIcinTemizle, DisHata, disTur, type TurSonucu } from "./disAjan";
import type { BuildModel } from "./modeller";
import { ARAC_BASLIK, ARAC_BITTI, girdiOzeti, type AracCiktisi } from "./sohbetAjan";
import type { BekleyenCagri, SohbetParca } from "./sohbetDepo";

/**
 * Sohbet motoru: bir asistan cevabını (birden çok model turu + araç çağrıları) yürütür. Hem sahibin sohbeti hem
 * yayındaki ajanın ziyaretçi sohbeti bunu kullanır. Olaylar parça dizisini dizinle günceller:
 *  ekle {parca}  metin {i, ek}  dusunce {i, ek}  guncelle {i, parca}
 * Claude: Anthropic SDK + sunucu araçları; diğer modeller: OpenAI uyumlu akış, yalnız Vayra araçları.
 * İzni "sor" olan araç çağrısında tur durur ve çağrılar onay kartı olur (onay-bekliyor).
 */
type AracParca = Extract<SohbetParca, { tur: "arac" }>;
export type Kullanim = { girdi: number; cikti: number; onbellek: number; yazilan: number };
/** turlar: her model turunun token kullanımı (sırayla; iz kayıtları tur başına token gösterebilsin). */
export type MotorSonucu = { durum: "bitti" | "durduruldu" | "hata" | "onay-bekliyor"; hata?: string; kullanim: Kullanim; aracKredi: number; bekleyen?: BekleyenCagri[]; turlar?: Kullanim[] };

const TUR_SINIRI = 14;
const alanAdi = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return "Sayfa"; } };
export const yeniAramaModeli = (m: BuildModel) => m.id === "claude-opus-5-5" || m.id === "claude-sonnet-5-5";

/** Claude'un sunucuda çalıştırdığı araçlar (web arama, sayfa okuma, kod çalıştırma); açık olanlar. Araştırma kipinde sınırlar yükselir. */
export function sunucuAraclari(model: BuildModel, acik: (ad: string) => boolean, sinir: { arama?: number; okuma?: number } = {}): Anthropic.Beta.BetaToolUnion[] {
  if (model.saglayici !== "anthropic") return [];
  const yeni = yeniAramaModeli(model);
  const l: Anthropic.Beta.BetaToolUnion[] = [];
  const arama = sinir.arama ?? 8, okuma = sinir.okuma ?? 6;
  if (acik("web_search")) l.push(yeni ? { type: "web_search_20260209", name: "web_search", max_uses: arama } : { type: "web_search_20250305", name: "web_search", max_uses: arama });
  if (acik("web_fetch") && yeni) l.push({ type: "web_fetch_20260209", name: "web_fetch", max_uses: okuma });
  if (acik("code_execution")) l.push({ type: "code_execution_20260120", name: "code_execution" });
  return l;
}

export async function motoruCalistir(g: {
  model: BuildModel; sistem: string; gecmis: unknown[]; efor: "low" | "medium" | "high" | "max";
  izin: (ad: string) => AracIzni; ozel: Anthropic.Beta.BetaTool[]; sunucu: Anthropic.Beta.BetaToolUnion[];
  parcalar: SohbetParca[]; yaz: (o: Record<string, unknown>) => void;
  /** Araç yürütücü; üçüncü bağımsız değişken modelin araç çağrısı kimliğidir (onay adımlarını çağrıya bağlamak için). */
  yurut: (ad: string, girdi: unknown, cagriId?: string) => Promise<AracCiktisi>; kaydet: () => Promise<void>; signal: AbortSignal;
  devam?: { cagrilar: BekleyenCagri[]; ret: boolean };
  /** Bağlantı araçları gibi dinamik araçların görünen adı. */
  etiket?: (ad: string) => string | undefined;
  /** En çok model turu (araştırma kipinde daha yüksek). */
  turSiniri?: number;
  /** Her model turu bitince o turun token kullanımı (tur sırası 0'dan). */
  turKullanimi?: (k: Kullanim, tur: number) => void;
}): Promise<MotorSonucu> {
  const { model, sistem, gecmis, izin, parcalar: p, yaz, signal } = g;
  const bas = (n: string) => ARAC_BASLIK[n] ?? g.etiket?.(n) ?? n;
  const bitti = (n: string) => ARAC_BITTI[n] ?? g.etiket?.(n) ?? "Tamam";
  const ekle = (x: SohbetParca) => { p.push(x); yaz({ t: "ekle", parca: x }); return p.length - 1; };
  const guncelle = (i: number) => yaz({ t: "guncelle", i, parca: p[i] });
  const kullanim: Kullanim = { girdi: 0, cikti: 0, onbellek: 0, yazilan: 0 };
  let aracKredi = 0;

  let blokParca: Record<number, number> = {};
  const metinBlok = (i: number) => { const k = blokParca[i]; return k ?? (blokParca[i] = ekle({ tur: "metin", metin: "" })); };
  const olay = {
    dusunce: (ek: string, i = -1) => {
      const k = i >= 0 ? (blokParca[i] ??= ekle({ tur: "dusunce", metin: "" })) : (p.at(-1)?.tur === "dusunce" ? p.length - 1 : ekle({ tur: "dusunce", metin: "" }));
      (p[k] as { metin: string }).metin += ek; yaz({ t: "dusunce", i: k, ek });
    },
    metin: (ek: string, i = -1) => {
      const k = i >= 0 ? metinBlok(i) : (p.at(-1)?.tur === "metin" ? p.length - 1 : ekle({ tur: "metin", metin: "" }));
      (p[k] as { metin: string }).metin += ek; yaz({ t: "metin", i: k, ek });
    },
    aracBasla: () => {}, aracGirdi: () => {},
  };

  const claudeTur = async (): Promise<TurSonucu & { pause: boolean }> => {
    const client = new Anthropic();
    blokParca = {};
    const yeni = yeniAramaModeli(model);
    const stream = client.beta.messages.stream({
      model: model.id, max_tokens: 32000, system: sistem, tools: [...g.sunucu, ...g.ozel],
      messages: claudeIcinTemizle(gecmis),
      thinking: { type: "adaptive", display: "summarized" },
      output_config: { effort: g.efor },
      cache_control: { type: "ephemeral" },
      ...(yeni ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
    }, { signal });
    const sunucuParca: Record<string, number> = {};
    // Sunucu aracının girdisi (arama sorgusu, okunan adres) akarken birikir; blok bitince karta yazılır.
    const sunucuGirdi: Record<number, { k: number; json: string }> = {};
    for await (const o of stream) {
      if (o.type === "content_block_start") {
        const b = o.content_block;
        if (b.type === "thinking") blokParca[o.index] = ekle({ tur: "dusunce", metin: "" });
        else if (b.type === "tool_use") blokParca[o.index] = ekle({ tur: "arac", id: b.id, ad: b.name, baslik: bas(b.name), durum: "suruyor", ...(g.etiket?.(b.name) ? { etiket: g.etiket(b.name) } : {}) });
        else if (b.type === "server_tool_use") { sunucuParca[b.id] = ekle({ tur: "arac", id: b.id, ad: b.name, baslik: ARAC_BASLIK[b.name] ?? "Çalışıyor", durum: "suruyor" }); sunucuGirdi[o.index] = { k: sunucuParca[b.id], json: "" }; }
        else if (b.type === "web_search_tool_result") {
          const k = sunucuParca[b.tool_use_id];
          if (k !== undefined) {
            const ic = b.content;
            const x = p[k] as AracParca;
            p[k] = { ...x, durum: Array.isArray(ic) ? "bitti" : "hata", baslik: Array.isArray(ic) ? `${ic.length} kaynak bulundu` : "Arama yapılamadı", sonuc: Array.isArray(ic) ? { tur: "arama", kaynaklar: ic.slice(0, 10).map((r) => ({ baslik: r.title, url: r.url })), ...(x.girdi?.Sorgu ? { sorgu: x.girdi.Sorgu } : {}) } : undefined };
            guncelle(k);
          }
        } else if (b.type === "bash_code_execution_tool_result" || b.type === "text_editor_code_execution_tool_result" || b.type === "web_fetch_tool_result") {
          const k = sunucuParca[(b as { tool_use_id: string }).tool_use_id];
          if (k !== undefined) {
            const ic = (b as { content: { type: string; stdout?: string; stderr?: string; url?: string; content?: { title?: string | null } } }).content;
            const hatali = ic.type.endsWith("_error");
            const x = p[k] as AracParca;
            const sonuc: AracParca["sonuc"] = b.type === "bash_code_execution_tool_result" ? { tur: "kod", cikti: ic.stdout?.slice(0, 8000), hata: ic.stderr?.slice(0, 4000) || undefined }
              : b.type === "web_fetch_tool_result" && !hatali && ic.url ? { tur: "sayfa", url: ic.url, ...(ic.content?.title ? { baslik: ic.content.title.slice(0, 200) } : {}) } : undefined;
            p[k] = { ...x, durum: hatali ? "hata" : "bitti", baslik: hatali ? (b.type === "web_fetch_tool_result" ? "Sayfa okunamadı" : "Çalıştırılamadı") : ARAC_BITTI[x.ad] ?? "Tamam", sonuc };
            guncelle(k);
          }
        }
      } else if (o.type === "content_block_delta") {
        const d = o.delta;
        if (d.type === "thinking_delta") olay.dusunce(d.thinking, o.index);
        else if (d.type === "text_delta") olay.metin(d.text, o.index);
        else if (d.type === "input_json_delta" && sunucuGirdi[o.index]) sunucuGirdi[o.index].json += d.partial_json;
        else if (d.type === "citations_delta") {
          // Alıntı: metin bloğuna bağlanır (arayüz numaralı kaynak çipi ve kaynak listesi gösterir).
          const c = d.citation as { type: string; url?: string; title?: string | null; cited_text?: string };
          if (c.url) {
            const k = metinBlok(o.index);
            const x = p[k] as Extract<SohbetParca, { tur: "metin" }>;
            const l = x.alintilar ?? [];
            if (!l.some((a) => a.url === c.url && a.metin === c.cited_text)) l.push({ url: c.url, baslik: (c.title || alanAdi(c.url)).slice(0, 200), ...(c.cited_text ? { metin: c.cited_text.slice(0, 400) } : {}) });
            p[k] = { ...x, alintilar: l };
            guncelle(k);
          }
        }
      } else if (o.type === "content_block_stop" && sunucuGirdi[o.index]) {
        const { k, json } = sunucuGirdi[o.index];
        delete sunucuGirdi[o.index];
        try {
          const v = JSON.parse(json || "{}") as { query?: string; url?: string };
          const x = p[k] as AracParca;
          if (x.durum === "suruyor" && (v.query || v.url)) {
            p[k] = { ...x, girdi: v.query ? { Sorgu: v.query.slice(0, 200) } : { Adres: String(v.url).slice(0, 400) }, baslik: v.query ? `"${v.query.slice(0, 80)}" aranıyor` : `${alanAdi(String(v.url))} okunuyor` };
            guncelle(k);
          }
        } catch { /* yarım girdi */ }
      }
    }
    const y = await stream.finalMessage();
    const u = y.usage;
    return {
      ileti: { role: "assistant", content: y.content as unknown as TurSonucu["ileti"]["content"] },
      cagrilar: y.content.filter((x): x is Anthropic.Beta.BetaToolUseBlock => x.type === "tool_use").map((x) => ({ id: x.id, name: x.name, input: x.input })),
      durma: y.stop_reason === "refusal" ? "refusal" : y.stop_reason === "max_tokens" ? "max_tokens" : y.stop_reason === "tool_use" ? "tool_use" : "end_turn",
      kullanim: { girdi: u.input_tokens ?? 0, cikti: u.output_tokens ?? 0, onbellek: u.cache_read_input_tokens ?? 0, yazilan: u.cache_creation_input_tokens ?? 0 },
      pause: y.stop_reason === "pause_turn",
    };
  };

  /** Araç çağrılarını yürütür (reddedilenler/kapalılar hata sonucu döner) ve sonuçları geçmişe yazar. */
  const yurut = async (cagrilar: BekleyenCagri[], ret?: boolean) => {
    const sonuclar: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const cg of cagrilar) {
      let k = p.findIndex((x) => x.tur === "arac" && x.id === cg.id);
      if (k < 0) k = ekle({ tur: "arac", id: cg.id, ad: cg.name, baslik: bas(cg.name), durum: "suruyor", ...(g.etiket?.(cg.name) ? { etiket: g.etiket(cg.name) } : {}) });
      const iz = izin(cg.name);
      if (iz === "kapali" || (ret && iz === "sor")) {
        p[k] = { ...(p[k] as AracParca), durum: "reddedildi", baslik: iz === "kapali" ? "Bu araç kapalı" : "Onaylanmadı" };
        guncelle(k);
        sonuclar.push({ type: "tool_result", tool_use_id: cg.id, content: iz === "kapali" ? "Bu araç kapalı." : "Kullanıcı bu işlemi onaylamadı. Israr etme; gerekirse başka bir yol öner.", is_error: true });
        continue;
      }
      p[k] = { ...(p[k] as AracParca), durum: "suruyor", baslik: bas(cg.name) };
      guncelle(k);
      const r = await g.yurut(cg.name, cg.input, cg.id);
      aracKredi += r.kredi ?? 0;
      p[k] = { ...(p[k] as AracParca), durum: r.hata ? "hata" : "bitti", baslik: r.hata ? (r.icerik.includes("bağlı değil") ? "Sağlayıcı bağlı değil" : "Yapılamadı") : bitti(cg.name), ayrinti: r.hata ? r.icerik.slice(0, 300) : undefined, sonuc: r.sonuc };
      guncelle(k);
      sonuclar.push({ type: "tool_result", tool_use_id: cg.id, content: r.icerik, ...(r.hata ? { is_error: true } : {}) });
    }
    gecmis.push({ role: "user", content: sonuclar });
    await g.kaydet().catch(() => {});
  };

  const turlar: Kullanim[] = [];
  let durum: MotorSonucu["durum"] = "bitti";
  let hata: string | undefined;
  let bekleyen: BekleyenCagri[] | undefined;
  try {
    if (g.devam) await yurut(g.devam.cagrilar, g.devam.ret);
    for (let tur = 0; tur < (g.turSiniri ?? TUR_SINIRI); tur++) {
      const y = model.saglayici === "anthropic" ? await claudeTur()
        : { ...(await disTur({ model, baglanti: baglantiBul(model)!, sistem, gecmis: gecmis as never, araclar: g.ozel, efor: g.efor, signal, olay: { ...olay, dusunce: (e: string) => olay.dusunce(e), metin: (e: string) => olay.metin(e) } })), pause: false };
      kullanim.girdi += y.kullanim.girdi; kullanim.cikti += y.kullanim.cikti; kullanim.onbellek += y.kullanim.onbellek; kullanim.yazilan += y.kullanim.yazilan;
      turlar.push({ ...y.kullanim });
      try { g.turKullanimi?.({ ...y.kullanim }, tur); } catch { /* çağıranın hatası turu bozmasın */ }
      if (y.durma === "refusal") { durum = "hata"; hata = "Bu isteğe yardımcı olamıyorum."; break; }
      gecmis.push(y.ileti);
      if (y.pause) continue;
      if (!y.cagrilar.length) break;
      if (y.cagrilar.some((cg) => izin(cg.name) === "sor")) {
        for (const cg of y.cagrilar) {
          let k = p.findIndex((x) => x.tur === "arac" && x.id === cg.id);
          if (k < 0) k = ekle({ tur: "arac", id: cg.id, ad: cg.name, baslik: bas(cg.name), durum: "suruyor", ...(g.etiket?.(cg.name) ? { etiket: g.etiket(cg.name) } : {}) });
          p[k] = izin(cg.name) === "sor"
            ? { ...(p[k] as AracParca), durum: "onay", baslik: "Onayın bekleniyor", girdi: girdiOzeti(cg.name, cg.input) }
            : { ...(p[k] as AracParca), durum: "onay", baslik: "Onaydan sonra çalışacak" };
          guncelle(k);
        }
        bekleyen = y.cagrilar;
        durum = "onay-bekliyor";
        break;
      }
      await yurut(y.cagrilar);
    }
  } catch (e) {
    if (signal.aborted) durum = "durduruldu";
    else {
      durum = "hata";
      hata = e instanceof Anthropic.RateLimitError || (e instanceof DisHata && e.durum === 429) ? "Yoğunluk var, biraz sonra tekrar dene."
        : e instanceof Anthropic.AuthenticationError ? "Model anahtarı geçersiz."
          : e instanceof Anthropic.APIError ? `Model hatası (${e.status ?? "?"}). Tekrar dene.`
            : e instanceof DisHata ? `${model.ad} hatası (${e.durum}).` : "Bağlantı koptu. Tekrar dene.";
    }
  }
  p.forEach((x, i) => { if (x.tur === "arac" && x.durum === "suruyor") p[i] = { ...x, durum: "hata", baslik: "Yarıda kaldı" }; });
  return { durum, hata, kullanim, aracKredi, bekleyen, turlar };
}
