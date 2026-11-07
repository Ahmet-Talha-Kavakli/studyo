"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowUp, BookOpen, Clock3, History, Loader2, RotateCcw, Square, Users, Workflow } from "lucide-react";
import { AracKarti, Dusunce, Md } from "@/components/build/sohbet/SohbetEkrani";
import { akisOku, api, ApiHatasi } from "@/lib/build/istemci";
import { Secici } from "./AjanDuzenleyici";
import { AjanSimge, OlayAyrac, sayi, sureYaz, type Ajan } from "./ortak";

type Parca = Parameters<typeof AracKarti>[0]["a"] | { tur: "metin"; metin: string } | { tur: "dusunce"; metin: string };
type Kaynakca = { no: number; ad: string; url?: string; parca: string };
type Mesaj = { id: string; rol: "kullanici" | "asistan"; metin?: string; parcalar?: Parca[]; durum?: string; hata?: string; kredi?: number; sureMs?: number; calisma?: string; kaynaklar?: Kaynakca[]; insan?: string; olay?: { tur: string; metin: string }; yanitlayan?: { id: string; ad: string; simge: string }; prosedur?: { ad: string; form?: { ad: string; etiket: string }[]; secenekler?: string[]; bekliyor?: string } };

/**
 * Düzenleyicinin "Dene" bölmesi: taslakla (ya da yayındaki sürümle) konuşur. Ajan çalıştırıcısını kullanır, yani
 * bilgi alıntıları, koruma, devir, ekip ve onay politikası gerçek kanallardaki gibi çalışır. Her yanıtın altında
 * izine giden bağlantı, süre, kredi ve yanıtlayan kaynaklar görünür.
 */
export function DeneSohbet({ a, kaydet, izAc }: { a: Ajan; kaydet: () => Promise<void>; izAc: (id: string, ajanId?: string) => void }) {
  const [mesajlar, setMesajlar] = useState<Mesaj[] | null>(null);
  const [hedef, setHedef] = useState<"taslak" | "yayin">("taslak");
  const [bekleyen, setBekleyen] = useState<string | null>(null);
  const [deger, setDeger] = useState("");
  const [calisiyor, setCalisiyor] = useState(false);
  const [hata, setHata] = useState("");
  const [onizleme, setOnizleme] = useState<string | null>(null);
  const kutu = useRef<HTMLDivElement>(null);
  const alan = useRef<HTMLTextAreaElement>(null);
  const durdur = useRef<AbortController | null>(null);
  const yayinda = a.yayin.durum === "yayinda";

  const yukle = useCallback(async () => {
    const v = await api<{ mesajlar: Mesaj[]; hedef: "taslak" | "yayin"; bekleyen: string | null }>(`/api/build/ajanlar/${a.id}/dene`).catch(() => null);
    if (v) { setMesajlar(v.mesajlar); setHedef(v.hedef); setBekleyen(v.bekleyen); } else setMesajlar([]);
  }, [a.id]);
  useEffect(() => { yukle(); }, [yukle]);
  useEffect(() => { const k = kutu.current; if (k) k.scrollTop = k.scrollHeight; }, [mesajlar]);
  useEffect(() => { const t = alan.current; if (t) { t.style.height = "0px"; t.style.height = `${Math.min(t.scrollHeight, 180)}px`; } }, [deger]);
  useEffect(() => { if (!yayinda && hedef === "yayin") setHedef("taslak"); }, [yayinda, hedef]);

  const gonder = useCallback(async (g: { metin?: string; onay?: { karar: "onay" | "ret"; hep?: boolean } }) => {
    if (calisiyor || (!g.onay && !g.metin?.trim())) return;
    setHata(""); setCalisiyor(true);
    await kaydet();
    if (g.metin) setDeger("");
    const canliId = "canli";
    setMesajlar((l) => {
      const x = [...(l ?? [])];
      if (g.onay) return x.map((m) => (m.id === bekleyen ? { ...m, id: canliId, durum: "suruyor" } : m));
      if (bekleyen) { const i = x.findIndex((m) => m.id === bekleyen); if (i >= 0) x[i] = { ...x[i], durum: "bitti", parcalar: x[i].parcalar?.map((p) => (p.tur === "arac" && p.durum === "onay" ? { ...p, durum: "reddedildi", baslik: "Onaylanmadı" } : p)) }; }
      return [...x, { id: `k-${Date.now()}`, rol: "kullanici", metin: g.metin }, { id: canliId, rol: "asistan", parcalar: [], durum: "suruyor" }];
    });
    setBekleyen(null);
    const guncelle = (f: (m: Mesaj) => Mesaj) => setMesajlar((l) => (l ?? []).map((m) => (m.id === canliId ? f(m) : m)));
    durdur.current = new AbortController();
    try {
      const v = await akisOku(`/api/build/ajanlar/${a.id}/dene`, g.onay ? { onay: g.onay } : { metin: g.metin }, (o) => {
        if (o.t === "ekle") guncelle((m) => ({ ...m, parcalar: [...(m.parcalar ?? []), o.parca as Parca] }));
        else if (o.t === "metin" || o.t === "dusunce") guncelle((m) => ({ ...m, parcalar: (m.parcalar ?? []).map((p, j) => (j === o.i ? ({ ...p, metin: (p as { metin: string }).metin + String(o.ek) } as Parca) : p)) }));
        else if (o.t === "guncelle") guncelle((m) => ({ ...m, parcalar: (m.parcalar ?? []).map((p, j) => (j === o.i ? (o.parca as Parca) : p)) }));
        else if (o.t === "bitti") { const s = o.mesaj as Mesaj; setMesajlar((l) => (l ?? []).map((m) => (m.id === canliId ? s : m))); if (s.durum === "onay-bekliyor") setBekleyen(s.id); }
        else if (o.t === "yonlendirme") setMesajlar((l) => [...(l ?? []).filter((m) => m.id !== canliId), o.olay as Mesaj, { id: canliId, rol: "asistan", parcalar: [], durum: "suruyor", yanitlayan: o.yanitlayan as Mesaj["yanitlayan"] }]);
        else if (o.t === "hata") setHata(String(o.mesaj));
      }, durdur.current.signal);
      if (v) throw new ApiHatasi(400, String(v.hata ?? "Gönderilemedi."));
    } catch (e) {
      if ((e as Error).name !== "AbortError") { setHata(e instanceof ApiHatasi ? e.message : "Bağlantı koptu."); setMesajlar((l) => (l ?? []).filter((m) => m.id !== canliId)); }
    } finally {
      setCalisiyor(false);
      setMesajlar((l) => (l ?? []).map((m) => (m.id === canliId ? { ...m, id: `a-${Date.now()}`, durum: "durduruldu" } : m)));
    }
  }, [a.id, calisiyor, bekleyen, kaydet]);

  // MCP Apps görünümünün ui/message isteği yeni mesaj olarak gider (yanıt sürerken gönderilmez).
  const uygulamaAcicilari = useMemo(() => ({ gonder: (metin: string) => { if (calisiyor) return false; gonder({ metin }); return true; } }), [calisiyor, gonder]);

  const sifirla = async (h = hedef) => {
    durdur.current?.abort();
    await api(`/api/build/ajanlar/${a.id}/dene`, { govde: { yeni: true, hedef: h } }).catch(() => {});
    setMesajlar([]); setBekleyen(null); setHata(""); setHedef(h);
  };
  const bos = mesajlar !== null && !mesajlar.length;

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] bg-[#121315] ring-1 ring-inset ring-white/[0.07]">
      <header className="flex h-12 shrink-0 items-center gap-2.5 border-b border-white/[0.06] pl-4 pr-2">
        <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#55d6fd] opacity-60" /><span className="relative h-2 w-2 rounded-full bg-[#55d6fd]" /></span>
        <p className="text-[13.5px] font-semibold text-white">Dene</p>
        <p className="min-w-0 flex-1 truncate text-[12px] text-white/40 max-xl:hidden">{hedef === "yayin" ? `Yayındaki sürüm ${a.yayin.surum} ile konuşur` : "Taslakla konuşur; yayındaki sürüm etkilenmez"}</p>
        <span className="flex-1 xl:hidden" />
        {yayinda && <Secici id={`dene-hedef-${a.id}`} kucuk deger={hedef} set={(h) => sifirla(h)} l={[{ id: "taslak", ad: "Taslak" }, { id: "yayin", ad: `Sürüm ${a.yayin.surum}` }]} />}
        <button type="button" onClick={() => sifirla()} className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-white/60 hover:bg-white/[0.07] hover:text-white"><RotateCcw className="h-3.5 w-3.5" />Sıfırla</button>
      </header>
      <div ref={kutu} className="min-h-0 flex-1 overflow-y-auto px-4 [scrollbar-width:thin]">
        {mesajlar === null ? <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div> : bos ? (
          <div className="mx-auto flex min-h-full max-w-[560px] flex-col items-center justify-center py-8 text-center">
            <AjanSimge src={a.simge} boyut={64} />
            <p className="mt-4 text-[19px] font-semibold tracking-[-0.02em] text-white">{a.ad || "Adsız ajan"}</p>
            {a.aciklama && <p className="mt-1.5 max-w-[440px] text-[13.5px] leading-relaxed text-white/55">{a.aciklama}</p>}
            {a.karsilama && <div className="mt-5 max-w-[480px] rounded-[18px] bg-white/[0.05] px-4 py-3 text-left text-[14px] leading-relaxed text-white/85">{a.karsilama}</div>}
            {a.baslangiclar.length > 0 && <div className="mt-5 grid w-full gap-2 sm:grid-cols-2">{a.baslangiclar.map((x) => <button key={x} type="button" onClick={() => gonder({ metin: x })} className="rounded-[16px] bg-white/[0.04] px-3.5 py-3 text-left text-[13px] leading-snug text-white/75 ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.08]">{x}</button>)}</div>}
          </div>
        ) : (
          <div className="mx-auto max-w-[680px] space-y-6 py-5">
            {mesajlar.map((m) => m.olay ? <OlayAyrac key={m.id} tur={m.olay.tur} metin={m.olay.metin} /> : m.rol === "kullanici" ? (
              <div key={m.id} className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap break-words rounded-[20px] rounded-tr-[6px] bg-white/[0.09] px-4 py-2.5 text-[14.5px] leading-relaxed text-white">{m.metin}</div>
            ) : (
              <div key={m.id}>
                {m.insan && <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-amber-200/90"><Users className="h-3.5 w-3.5" />Temsilci yanıtı · {m.insan}</p>}
                {m.yanitlayan && m.yanitlayan.id !== a.id && <p className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-white/70"><AjanSimge src={m.yanitlayan.simge} boyut={18} />{m.yanitlayan.ad} yanıtlıyor</p>}
                {!m.parcalar?.length && m.durum === "suruyor" && <p className="flex items-center gap-2 text-[13.5px] text-white/50"><span className="build-nokta" /><span className="build-parilti">Düşünüyor</span></p>}
                {(m.parcalar ?? []).map((x, i) => x.tur === "metin" ? <Md key={i} metin={x.metin} akiyor={m.durum === "suruyor" && i === (m.parcalar?.length ?? 0) - 1} onizle={setOnizleme} />
                  : x.tur === "dusunce" ? <Dusunce key={i} metin={x.metin} suruyor={m.durum === "suruyor" && i === (m.parcalar?.length ?? 0) - 1} />
                    : <AracKarti key={i} a={x} onayla={m.id === bekleyen && !calisiyor ? (karar, hep) => gonder({ onay: { karar, hep } }) : undefined} acicilar={uygulamaAcicilari} />)}
                {m.durum === "hata" && <p className="mt-2 flex items-start gap-2 rounded-[14px] bg-rose-500/[0.07] px-3.5 py-2.5 text-[13px] text-rose-200/90 ring-1 ring-inset ring-rose-400/15"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{m.hata ?? "Bir sorun çıktı."}</p>}
                {m.kaynaklar?.length ? (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {m.kaynaklar.map((k) => <span key={k.no} title={k.parca} className="inline-flex h-7 max-w-[260px] items-center gap-1.5 rounded-full bg-[#55d6fd]/[0.08] px-2.5 text-[12px] text-[#bdf0ff] ring-1 ring-inset ring-[#55d6fd]/20"><BookOpen className="h-3 w-3 shrink-0" /><span className="tabular-nums text-[#8be6ff]">{k.no}</span><span className="truncate">{k.ad}</span></span>)}
                  </div>
                ) : null}
                {m.calisma && m.durum !== "suruyor" && (
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-white/35">
                    <button type="button" onClick={() => izAc(m.calisma!, m.yanitlayan && m.yanitlayan.id !== a.id ? m.yanitlayan.id : undefined)} className="inline-flex items-center gap-1 text-white/55 hover:text-white"><History className="h-3 w-3" />İzi gör</button>
                    {m.sureMs ? <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{sureYaz(m.sureMs)}</span> : null}
                    {m.kredi ? <span className="tabular-nums">{sayi(m.kredi)} kredi</span> : null}
                  </div>
                )}
              </div>
            ))}
            {(() => { const son = (mesajlar ?? []).filter((m) => !m.olay).at(-1); const p = son?.rol === "asistan" ? son.prosedur : undefined; if (!p || calisiyor) return null; return (
              <div className="space-y-2 rounded-[16px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
                <p className="flex items-center gap-1.5 text-[12px] text-white/50"><Workflow className="h-3.5 w-3.5" />{p.ad} prosedürü{p.form?.length ? ` · bekleyen: ${p.form.map((f) => f.etiket).join(", ")}` : ""}</p>
                {p.secenekler?.length ? <div className="flex flex-wrap gap-1.5">{p.secenekler.map((x) => <button key={x} type="button" onClick={() => gonder({ metin: x })} className="h-8 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-white ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.12]">{x}</button>)}</div> : null}
                {p.bekliyor === "temsilci" && <div className="flex flex-wrap gap-2"><button type="button" onClick={async () => { await api(`/api/build/ajanlar/${a.id}/prosedurler`, { govde: { islem: "karar", karar: "evet" } }).catch(() => {}); yukle(); }} className="inline-flex h-8 items-center rounded-full bg-white px-3 text-[12.5px] font-semibold text-black">Temsilci olarak onayla</button><button type="button" onClick={async () => { await api(`/api/build/ajanlar/${a.id}/prosedurler`, { govde: { islem: "karar", karar: "hayir" } }).catch(() => {}); yukle(); }} className="inline-flex h-8 items-center rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white">Reddet</button></div>}
                {p.bekliyor === "webhook" && <p className="text-[12px] leading-relaxed text-white/45">Web kancası bekleniyor; dış sistem bekleme adresine POST edince sohbet kendiliğinden ilerler. Prosedür düzenleyicisinin Dene sekmesinde web kancasını elle de gönderebilirsin.</p>}
              </div>
            ); })()}
            {hata && <p className="text-[13px] text-rose-300">{hata}</p>}
          </div>
        )}
      </div>
      <div className="shrink-0 px-3 pb-3">
        <form className="cam-istemci mx-auto flex max-w-[680px] items-end gap-2 rounded-[22px] p-1.5 pl-4" onSubmit={(e) => { e.preventDefault(); gonder({ metin: deger }); }}>
          <textarea ref={alan} value={deger} onChange={(e) => setDeger(e.target.value)} rows={1} maxLength={30000} placeholder={bekleyen ? "Yazarsan bekleyen işlem reddedilmiş sayılır" : `${a.ad || "Ajan"} ajanına yaz`}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); gonder({ metin: deger }); } }}
            className="max-h-[180px] min-h-[40px] flex-1 resize-none bg-transparent py-2.5 text-[14.5px] leading-relaxed text-white outline-none placeholder:text-white/40" />
          {calisiyor
            ? <button type="button" onClick={() => { durdur.current?.abort(); api(`/api/build/ajanlar/${a.id}/dene`, { method: "DELETE" }).catch(() => {}); }} aria-label="Durdur" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black"><Square className="h-3.5 w-3.5 fill-current" /></button>
            : <button type="submit" disabled={!deger.trim()} aria-label="Gönder" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black transition-opacity disabled:opacity-35"><ArrowUp className="h-4 w-4" /></button>}
        </form>
      </div>
      {onizleme && <div className="fixed inset-0 z-[130] flex flex-col bg-black/70 p-3" onClick={() => setOnizleme(null)}><iframe srcDoc={onizleme} title="Önizleme" sandbox="allow-scripts" className="min-h-0 flex-1 rounded-[16px] border-0 bg-white" /></div>}
    </section>
  );
}
