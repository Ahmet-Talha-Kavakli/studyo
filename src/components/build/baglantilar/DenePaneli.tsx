"use client";

import { useEffect, useMemo, useState } from "react";
import { Braces, Lock, LockOpen, Loader2, Play, ShieldAlert } from "lucide-react";
import { AcilirSecim, Anahtar, Secici, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { AracTuru, Bolum, HataKutusu, Kopyala, type BaglantiAcik, type McpArac } from "./ortak";

type Ozellik = { type?: string | string[]; description?: string; enum?: unknown[]; items?: { type?: string }; default?: unknown; title?: string };
type Sonuc = { metin: string; hata: boolean; sinir: boolean; ham: unknown; sure: number; gorseller: string[] };
const turu = (o: Ozellik) => (Array.isArray(o.type) ? o.type.find((t) => t !== "null") : o.type) ?? (o.enum ? "string" : "object");
const basit = (o: Ozellik) => ["string", "integer", "number", "boolean"].includes(turu(o)) || (turu(o) === "array" && ["string", "integer", "number"].includes(o.items?.type ?? ""));

/** Form değerini JSON değerine çevirir; boş alan gönderilmez. */
function cevir(o: Ozellik, v: unknown): { ok: true; deger?: unknown } | { ok: false; hata: string } {
  const t = turu(o);
  if (t === "boolean") return { ok: true, deger: v === true ? true : v === false ? false : undefined };
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return { ok: true };
  if (t === "integer" || t === "number") { const n = Number(s.replace(",", ".")); return Number.isFinite(n) && (t !== "integer" || Number.isInteger(n)) ? { ok: true, deger: n } : { ok: false, hata: "sayı olmalı" }; }
  if (t === "array" && basit(o)) { const l = s.split(/\n|,/).map((x) => x.trim()).filter(Boolean); return { ok: true, deger: o.items?.type === "string" ? l : l.map(Number) }; }
  if (t === "string") return { ok: true, deger: s };
  try { return { ok: true, deger: JSON.parse(s) }; } catch { return { ok: false, hata: "geçerli JSON değil" }; }
}
const gosterim = (o: Ozellik, v: unknown): string | boolean => (turu(o) === "boolean" ? v === true : v === undefined ? "" : typeof v === "string" ? v : turu(o) === "array" && basit(o) && Array.isArray(v) ? v.join("\n") : JSON.stringify(v, null, 1));

/** Araç deneme alanı: şemadan form (ya da JSON), alan sabitleme, onaylı çalıştırma, metin ve ham yanıt. */
export function AracDene({ b, setB, ilk }: { b: BaglantiAcik; setB: (b: BaglantiAcik) => void; ilk?: string }) {
  const [ad, setAd] = useState(ilk ?? b.araclar[0]?.name ?? "");
  const a = b.araclar.find((x) => x.name === ad) as (McpArac & { inputSchema?: { properties?: Record<string, Ozellik>; required?: string[] } }) | undefined;
  const props = useMemo(() => Object.entries((a?.inputSchema?.properties ?? {}) as Record<string, Ozellik>), [a]);
  const zorunlu = new Set(a?.inputSchema?.required ?? []);
  const [degerler, setDegerler] = useState<Record<string, string | boolean>>({});
  const [kilit, setKilit] = useState<Record<string, boolean>>({});
  const [json, setJson] = useState(false);
  const [jsonMetin, setJsonMetin] = useState("{}");
  const [onay, setOnay] = useState(false);
  const [gidiyor, setGidiyor] = useState<"" | "calistir" | "kaydet">("");
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");
  const [s, setS] = useState<Sonuc | null>(null);
  const [gorunum, setGorunum] = useState<"metin" | "ham">("metin");
  const okuma = !!a?.annotations?.readOnlyHint;
  useEffect(() => {
    // Araç değişince form, sabit alanların kayıtlı değerleriyle dolar.
    const sabit = b.sabitAlanlar?.[ad] ?? {};
    const d: Record<string, string | boolean> = {};
    for (const [k, o] of props) { const v = sabit[k] ?? o.default; if (v !== undefined) d[k] = gosterim(o, v); }
    setDegerler(d); setKilit(Object.fromEntries(Object.keys(sabit).map((k) => [k, true]))); setS(null); setHata(""); setBilgi(""); setOnay(false);
    setJsonMetin(JSON.stringify(Object.fromEntries(props.filter(([k]) => zorunlu.has(k)).map(([k, o]) => [k, sabit[k] ?? (turu(o) === "string" ? "" : null)])), null, 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ad, props]);
  if (!b.araclar.length) return <Bolum baslik="Dene"><p className="px-4 py-3 text-[13px] text-white/50">Bağlantı kurulunca araçları burada elle deneyebilirsin.</p></Bolum>;

  const girdiKur = (): { girdi?: Record<string, unknown>; hata?: string } => {
    if (json) { try { const v = JSON.parse(jsonMetin || "{}"); return v && typeof v === "object" && !Array.isArray(v) ? { girdi: v } : { hata: "Girdi bir JSON nesnesi olmalı." }; } catch { return { hata: "JSON okunamadı." }; } }
    const g: Record<string, unknown> = {};
    for (const [k, o] of props) {
      const c = cevir(o, degerler[k]);
      if (!c.ok) return { hata: `${k}: ${c.hata}` };
      if (c.deger !== undefined) g[k] = c.deger;
      else if (zorunlu.has(k)) return { hata: `${k} gerekli.` };
    }
    return { girdi: g };
  };
  const calistir = async () => {
    const g = girdiKur();
    if (g.hata) { setHata(g.hata); return; }
    setGidiyor("calistir"); setHata(""); setBilgi("");
    try { setS(await api<Sonuc>(`/api/build/baglantilar/${b.id}/dene`, { govde: { arac: ad, girdi: g.girdi, onay } })); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Çalıştırılamadı."); }
    finally { setGidiyor(""); }
  };
  const sabitKaydet = async () => {
    const g: Record<string, unknown> = {};
    for (const [k, o] of props) if (kilit[k]) { const c = cevir(o, degerler[k]); if (!c.ok || c.deger === undefined) { setHata(`${k}: sabitlemek için bir değer yaz.`); return; } g[k] = c.deger; }
    setGidiyor("kaydet"); setHata("");
    try { const v = await api<{ baglanti: BaglantiAcik }>(`/api/build/baglantilar/${b.id}`, { method: "PATCH", govde: { sabitAlanlar: { [ad]: Object.keys(g).length ? g : null } } }); setB(v.baglanti); setBilgi(Object.keys(g).length ? `${Object.keys(g).length} alan sabitlendi: model bu alanları görmez, her çağrıda bu değerler kullanılır.` : "Sabit alan kalmadı."); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kaydedilemedi."); }
    finally { setGidiyor(""); }
  };
  const kayitliSabit = JSON.stringify(Object.keys(b.sabitAlanlar?.[ad] ?? {}).sort()), seciliSabit = JSON.stringify(Object.keys(kilit).filter((k) => kilit[k]).sort());
  const hamMetin = s ? (typeof s.ham === "string" ? s.ham : JSON.stringify(s.ham, null, 2)) : "";

  return (
    <>
      <Bolum baslik="Araç" alt="Aracı Vayra sunucusundan senin kimliğinle çağırır; izinler, sabit alanlar ve sınırlar gerçek çağrıdaki gibi uygulanır">
        <div className="space-y-3 p-4">
          <AcilirSecim deger={ad} set={setAd} l={b.araclar.map((x) => ({ id: x.name, ad: x.annotations?.title ?? x.title ?? x.name, alt: `${x.annotations?.readOnlyHint ? "Okuma" : "Yazma"} · ${x.name}` }))} />
          {a && <div className="space-y-1.5"><span className="flex items-center gap-2"><span className="truncate text-[13.5px] font-medium text-white">{a.annotations?.title ?? a.title ?? a.name}</span><AracTuru a={a} /></span>{a.description && <p className="text-[12.5px] leading-relaxed text-white/55">{a.description.slice(0, 600)}</p>}</div>}
        </div>
      </Bolum>
      <Bolum baslik={json ? "Girdi (JSON)" : `Girdi (${props.length} alan)`} sag={<button type="button" onClick={() => { if (!json) { const g = girdiKur(); if (g.girdi) setJsonMetin(JSON.stringify(g.girdi, null, 2)); } setJson((x) => !x); }} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12px] text-white hover:bg-white/[0.12]"><Braces className="h-3.5 w-3.5" />{json ? "Forma dön" : "JSON yaz"}</button>}>
        {json ? <div className="p-4"><textarea value={jsonMetin} onChange={(e) => setJsonMetin(e.target.value)} rows={10} spellCheck={false} className={cn(alanSinif, "resize-y py-2.5 font-mono text-[12.5px] leading-relaxed")} /></div>
          : props.length ? (
            <div className="divide-y divide-white/[0.05]">
              {props.map(([k, o]) => { const t = turu(o); const kilitli = !!kilit[k]; return (
                <div key={k} className="space-y-1.5 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1"><span className="text-[13px] font-medium text-white">{k}</span>{zorunlu.has(k) && <span className="ml-1.5 text-[11.5px] text-amber-200/80">zorunlu</span>}<span className="ml-1.5 text-[11.5px] text-white/35">{t}</span></span>
                    <button type="button" onClick={() => setKilit((x) => ({ ...x, [k]: !kilitli }))} title={kilitli ? "Sabit: model bu alanı görmez" : "Bu değeri sabitle"} aria-pressed={kilitli}
                      className={cn("inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11.5px]", kilitli ? "bg-[#55d6fd]/[0.14] text-[#8be6ff]" : "bg-white/[0.06] text-white/55 hover:text-white")}>{kilitli ? <Lock className="h-3 w-3" /> : <LockOpen className="h-3 w-3" />}{kilitli ? "Sabit" : "Sabitle"}</button>
                  </div>
                  {o.description && <p className="text-[11.5px] leading-snug text-white/45">{o.description.slice(0, 300)}</p>}
                  {t === "boolean" ? <Anahtar acik={degerler[k] === true} set={(v) => setDegerler((x) => ({ ...x, [k]: v }))} etiket={k} />
                    : o.enum?.length ? (
                      <select value={String(degerler[k] ?? "")} onChange={(e) => setDegerler((x) => ({ ...x, [k]: e.target.value }))} className={cn(alanSinif, "h-10 text-[13px]")}>
                        <option value="">Seçilmedi</option>{o.enum.slice(0, 80).map((e) => <option key={String(e)} value={String(e)}>{String(e)}</option>)}
                      </select>
                    ) : basit(o) && t !== "array" ? <input value={String(degerler[k] ?? "")} onChange={(e) => setDegerler((x) => ({ ...x, [k]: e.target.value }))} inputMode={t === "string" ? undefined : "decimal"} spellCheck={false} className={cn(alanSinif, "h-10 text-[13px]")} />
                      : <textarea value={String(degerler[k] ?? "")} onChange={(e) => setDegerler((x) => ({ ...x, [k]: e.target.value }))} rows={t === "array" ? 3 : 4} spellCheck={false} placeholder={t === "array" && basit(o) ? "Her satıra bir değer" : "JSON"} className={cn(alanSinif, "resize-y py-2 font-mono text-[12.5px]")} />}
                </div>
              ); })}
              {seciliSabit !== kayitliSabit && <div className="flex items-center gap-2 px-4 py-3"><p className="flex-1 text-[12px] text-white/50">Sabit alanlar modelden gizlenir; her çağrıda bu değerler kullanılır.</p><button type="button" onClick={sabitKaydet} disabled={!!gidiyor} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[12.5px] font-semibold text-black disabled:opacity-50">{gidiyor === "kaydet" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Sabit alanları kaydet</button></div>}
            </div>
          ) : <p className="px-4 py-3 text-[13px] text-white/50">Bu araç girdi almıyor.</p>}
      </Bolum>
      {!okuma && (
        <label className="flex items-start gap-3 rounded-[16px] bg-amber-400/[0.06] px-4 py-3 ring-1 ring-inset ring-amber-300/15">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
          <span className="min-w-0 flex-1 text-[12.5px] leading-relaxed text-amber-100/90">Bu araç veri oluşturur, değiştirir ya da siler. Çalıştırınca işlem gerçekten {b.ad} hesabında yapılır.</span>
          <Anahtar acik={onay} set={setOnay} etiket="Gerçek işlemi onayla" />
        </label>
      )}
      <div className="flex items-center gap-2">
        <span className="flex-1 text-[12px] text-white/40">{b.saltOkunur && !okuma ? "Salt okunur: yazma araçları çalışmaz" : "Çağrı Kayıtlar sekmesine deneme olarak yazılır"}</span>
        <button type="button" onClick={calistir} disabled={!!gidiyor || (!okuma && (!onay || b.saltOkunur)) || b.durum !== "etkin"} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black disabled:opacity-40">{gidiyor === "calistir" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}Çalıştır</button>
      </div>
      {b.durum !== "etkin" && <HataKutusu tur="uyari">Bağlantı sağlıklı değil; denemeden önce Genel sekmesinden bağlantıyı yenile.</HataKutusu>}
      {hata && <HataKutusu>{hata}</HataKutusu>}
      {bilgi && <HataKutusu tur="bilgi">{bilgi}</HataKutusu>}
      {s && (
        <Bolum baslik={<span className="flex items-center gap-2"><span className={cn("h-2 w-2 rounded-full", s.hata ? "bg-rose-400" : "bg-[#55d6fd]")} />{s.sinir ? "Sınıra takıldı" : s.hata ? "Hata döndü" : "Başarılı"}</span>} alt={`${s.sure} ms`}
          sag={<><Secici id="dene-gorunum" kucuk deger={gorunum} set={setGorunum} l={[{ id: "metin", ad: "Modelin gördüğü" }, { id: "ham", ad: "Ham yanıt", kapali: s.ham === null }]} /><Kopyala metin={gorunum === "ham" ? hamMetin : s.metin} etiket="Yanıtı kopyala" /></>}>
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words px-4 py-3 font-mono text-[12px] leading-relaxed text-white/80 [scrollbar-width:thin]">{gorunum === "ham" ? hamMetin : s.metin}</pre>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {s.gorseller.length > 0 && <div className="flex flex-wrap gap-2 px-4 pb-4">{s.gorseller.map((g, i) => <img key={i} src={g} alt="" className="h-28 rounded-[12px] object-cover ring-1 ring-white/10" />)}</div>}
        </Bolum>
      )}
    </>
  );
}
