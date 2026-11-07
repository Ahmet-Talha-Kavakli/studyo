"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarClock, Copy, History, Loader2, MoreHorizontal, Pause, Pencil, Play, Plus, RefreshCw, Trash2, Webhook } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Kart } from "@/components/film/ortak";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { zamanYaz } from "@/lib/build/ajanZaman";
import { cn } from "@/lib/utils";
import { Anahtar, KodKutusu, alanSinif } from "./AjanDuzenleyici";
import type { CalismaOzetI } from "./Calismalar";
import { BosDurum, DurumHapi, YanPanel, birincil, ikincil, type Ajan } from "./ortak";
/** Bu cihazın saat dilimi: zamanlama bu saate göre kurulur ("her gün 09:00" senin 09:00'ın). */
const cihazDilimi = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; } };

type Tetik = Ajan["tetikler"][number] & { aciklama?: string; sonrakiler: number[] };
type Liste = { tetikler: Tetik[]; tavan: number; bugun: number };
const HAZIR_ZAMAN = ["Her gün 09.00", "Hafta içi her gün 08.30", "Her pazartesi 09.00", "Her saat başı", "Her ayın 1'i 10.00"];

function Menu({ l }: { l: { ad: string; ikon: typeof Play; f: () => void; tehlike?: boolean }[] }) {
  const [acik, setAcik] = useState(false);
  const kok = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!acik) return; const f = (e: PointerEvent) => { if (!kok.current?.contains(e.target as Node)) setAcik(false); }; addEventListener("pointerdown", f); return () => removeEventListener("pointerdown", f); }, [acik]);
  return (
    <div ref={kok} className="relative">
      <button type="button" onClick={() => setAcik((x) => !x)} aria-label="Tetik menüsü" className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.08] hover:text-white"><MoreHorizontal className="h-4 w-4" /></button>
      <AnimatePresence>
        {acik && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }} className="bd-panel absolute right-0 top-9 z-30 w-[200px] rounded-[14px] p-1.5">
            {l.map((x) => <button key={x.ad} type="button" onClick={() => { setAcik(false); x.f(); }} className={cn("flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13px]", x.tehlike ? "text-rose-300/90 hover:bg-rose-500/[0.1]" : "text-white/85 hover:bg-white/[0.07]")}><x.ikon className="h-3.5 w-3.5 opacity-70" />{x.ad}</button>)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Zamanlama ya da webhook düzenleme paneli. */
function TetikPaneli({ a, t, tur, kapat, kaydedildi, izAc }: { a: Ajan; t: Tetik | null; tur: "zaman" | "webhook"; kapat: () => void; kaydedildi: (l: Liste["tetikler"]) => void; izAc: (id: string) => void }) {
  const [ad, setAd] = useState(t?.ad ?? "");
  const [metin, setMetin] = useState(t?.metin ?? "Her gün 09.00");
  const [gorev, setGorev] = useState(t?.gorev ?? (tur === "webhook" ? "Gelen olayı incele ve kısa bir özet çıkar:\n\n{{veri}}" : ""));
  const [filtre, setFiltre] = useState(t?.filtre ?? "");
  const [onizleme, setOnizleme] = useState<{ aciklama: string; sonrakiler: number[]; yapayZeka?: boolean } | null>(null);
  const [cozumHata, setCozumHata] = useState("");
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  const [teslim, setTeslim] = useState<CalismaOzetI[] | null>(null);
  const [koken, setKoken] = useState("");
  const girdi = useRef<HTMLInputElement>(null);
  useEffect(() => setKoken(location.origin), []);
  useEffect(() => {
    if (tur !== "zaman") return;
    const m = metin.trim();
    if (m.length < 3) { setOnizleme(null); return; }
    const z = setTimeout(() => {
      api<{ aciklama: string; sonrakiler: number[]; yapayZeka?: boolean }>(`/api/build/ajanlar/${a.id}/tetikler`, { govde: { islem: "cozumle", metin: m, saatDilimi: cihazDilimi() } })
        .then((v) => { setOnizleme(v); setCozumHata(""); }).catch((e) => { setOnizleme(null); setCozumHata(e instanceof ApiHatasi ? e.message : "Anlaşılamadı."); });
    }, 350);
    return () => clearTimeout(z);
  }, [metin, tur, a.id]);
  useEffect(() => {
    if (!t) return;
    api<{ calismalar: CalismaOzetI[] }>(`/api/build/ajanlar/${a.id}/calismalar?tetik=${t.id}&gun=${t.tur === "webhook" ? 1 : 30}`).then((v) => setTeslim(v.calismalar.slice(0, 8))).catch(() => setTeslim([]));
  }, [a.id, t]);
  const kaydet = async () => {
    setGidiyor(true); setHata("");
    try {
      const g = { ad, gorev, ...(tur === "zaman" ? { metin } : { filtre }) };
      const v = await api<Liste>(`/api/build/ajanlar/${a.id}/tetikler`, { govde: t ? { islem: "guncelle", id: t.id, saatDilimi: cihazDilimi(), ...g } : { islem: "ekle", tur, saatDilimi: cihazDilimi(), ...g } });
      kaydedildi(v.tetikler); kapat();
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kaydedilemedi."); } finally { setGidiyor(false); }
  };
  const url = t?.gizli ? `${koken}/api/build/genel/ajan/${a.id}/tetik/${t.gizli}` : "";
  const ayni = (x: string) => x.toLocaleLowerCase("tr") === metin.trim().toLocaleLowerCase("tr");
  const ozel = !HAZIR_ZAMAN.some(ayni);
  return (
    <YanPanel acik kapat={kapat} baslik={t ? (tur === "zaman" ? "Zamanlamayı düzenle" : "Web kancasını düzenle") : tur === "zaman" ? "Yeni zamanlama" : "Yeni web kancası"}
      alt={tur === "zaman" ? "Ajan belirlediğin zamanlarda kendiliğinden çalışır; sonuç Görevler'e düşer" : "Başka bir uygulama bu adrese olay gönderince ajan çalışır"}
      alt2={<><span className="flex-1 text-[12px] text-white/40">{a.yayin.durum === "yayinda" ? `Yayındaki sürüm ${a.yayin.surum} çalışır` : "Ajan yayında değil; taslak çalışır"}</span><button type="button" onClick={kapat} className={ikincil}>Vazgeç</button><button type="button" onClick={kaydet} disabled={gidiyor || !gorev.trim() || (tur === "zaman" && !onizleme)} className={birincil}>{gidiyor && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Kaydet</button></>}>
      <div className="space-y-4">
        <label className="block"><span className="mb-1.5 block text-[12.5px] font-medium text-white/60">Ad</span><input value={ad} onChange={(e) => setAd(e.target.value)} maxLength={60} placeholder={tur === "zaman" ? "Örneğin Pazartesi raporu" : "Örneğin Yeni sipariş"} className={cn(alanSinif, "h-10")} /></label>
        {tur === "zaman" ? (
          <div>
            <span className="mb-1.5 block text-[12.5px] font-medium text-white/60">Ne zaman</span>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {HAZIR_ZAMAN.map((x) => <button key={x} type="button" onClick={() => setMetin(x)} className={cn("h-8 rounded-full px-3 text-[12.5px] ring-1 ring-inset transition-colors", ayni(x) ? "bg-white/[0.1] text-white ring-white" : "bg-white/[0.04] text-white/65 ring-white/[0.08] hover:text-white")}>{x}</button>)}
              <button type="button" onClick={() => { if (!ozel) setMetin(""); girdi.current?.focus(); }} className={cn("h-8 rounded-full px-3 text-[12.5px] ring-1 ring-inset transition-colors", ozel ? "bg-white/[0.1] text-white ring-white" : "bg-white/[0.04] text-white/65 ring-white/[0.08] hover:text-white")}>Özel</button>
            </div>
            <input ref={girdi} value={metin} onChange={(e) => setMetin(e.target.value)} maxLength={200} placeholder="Düz Türkçe yaz: her salı ve perşembe 17.30" className={cn(alanSinif, "h-10")} />
            <div className="mt-2.5 rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
              {onizleme ? (
                <>
                  <p className="flex items-center gap-2 text-[13.5px] font-medium text-white"><CalendarClock className="h-4 w-4 text-[#8be6ff]" />{onizleme.aciklama}</p>
                  <p className="mt-2 text-[11.5px] text-white/40">Sonraki çalışmalar · Türkiye saati</p>
                  <ul className="mt-1 space-y-1">{onizleme.sonrakiler.map((x) => <li key={x} className="text-[12.5px] tabular-nums text-white/75">{zamanYaz(x, cihazDilimi())}</li>)}</ul>
                </>
              ) : <p className="text-[12.5px] text-white/50">{cozumHata || "Zamanlamayı yaz; anlaşılınca sonraki çalışmalar burada görünür."}</p>}
            </div>
          </div>
        ) : (
          <>
            <label className="block"><span className="mb-1.5 block text-[12.5px] font-medium text-white/60">Yalnız şu durumda çalış</span>
              <textarea value={filtre} onChange={(e) => setFiltre(e.target.value)} rows={2} maxLength={1000} placeholder="Düz dille yaz: sipariş tutarı 1000 liradan büyükse ve ödeme alındıysa. Boş bırakırsan her olayda çalışır." className={cn(alanSinif, "resize-none py-2.5 leading-relaxed")} />
            </label>
            {url && (
              <div>
                <span className="mb-1.5 block text-[12.5px] font-medium text-white/60">Adres</span>
                <KodKutusu kod={url} />
                <div className="mt-2"><KodKutusu kod={`curl -X POST "${url}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"olay": "siparis", "tutar": 1500}'`} /></div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-white/40">JSON, form ya da düz metin gönderebilirsin. Sonucu beklemek için adresin sonuna ?bekle=1 ekle.</p>
              </div>
            )}
          </>
        )}
        <label className="block"><span className="mb-1.5 block text-[12.5px] font-medium text-white/60">Ajan ne yapsın</span>
          <textarea value={gorev} onChange={(e) => setGorev(e.target.value)} rows={5} maxLength={8000} placeholder={tur === "zaman" ? "Örneğin: Sektör haberlerini tara, en önemli 5 gelişmeyi kaynaklarıyla özetle." : "Gelen veri {{veri}} yerine konur."} className={cn(alanSinif, "resize-y py-2.5 leading-relaxed")} />
          {tur === "webhook" && <span className="mt-1 block text-[12px] text-white/40">Gelen veri metindeki {"{{veri}}"} yerine konur; yoksa sona eklenir.</span>}
        </label>
        {hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}
        {t && (
          <section>
            <p className="mb-1.5 text-[12.5px] font-medium text-white/60">{t.tur === "webhook" ? "Son 24 saatte gelenler" : "Son çalışmalar"}</p>
            {teslim === null ? <Loader2 className="h-4 w-4 animate-spin text-white/40" /> : !teslim.length ? <p className="rounded-[12px] bg-white/[0.03] px-3 py-2.5 text-[12.5px] text-white/45 ring-1 ring-inset ring-white/[0.06]">Henüz çalışma yok.</p> : (
              <div className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
                {teslim.map((c) => <button key={c.id} type="button" onClick={() => izAc(c.id)} className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-white/[0.03]"><span className="min-w-0 flex-1"><span className="block truncate text-[12.5px] text-white/80">{c.durum === "atlandi" ? c.cikti || c.girdi : c.cikti || c.girdi}</span><span className="block text-[11px] text-white/40">{gorece(c.baslangic)}</span></span><DurumHapi d={c.durum} /></button>)}
              </div>
            )}
          </section>
        )}
      </div>
    </YanPanel>
  );
}

/** Tetikler sekmesi: zamanlamalar ve webhook'lar. */
export function Tetikler({ a, izAc }: { a: Ajan; izAc: (id: string) => void }) {
  const [v, setV] = useState<Liste | null>(null);
  const [panel, setPanel] = useState<{ tur: "zaman" | "webhook"; t: Tetik | null } | null>(null);
  const [gidiyor, setGidiyor] = useState<string | null>(null);
  const [koken, setKoken] = useState("");
  useEffect(() => setKoken(location.origin), []);
  const yukle = useCallback(() => api<Liste>(`/api/build/ajanlar/${a.id}/tetikler`).then(setV).catch(() => setV({ tetikler: [], tavan: 0, bugun: 0 })), [a.id]);
  useEffect(() => { yukle(); }, [yukle]);
  const islem = async (g: Record<string, unknown>) => {
    setGidiyor(String(g.id ?? g.islem));
    try {
      if (g.islem === "calistir") { const r = await api<{ calisma: { id: string } | null }>(`/api/build/ajanlar/${a.id}/tetikler`, { govde: g }); await yukle(); if (r.calisma) izAc(r.calisma.id); }
      else { const r = await api<Liste>(`/api/build/ajanlar/${a.id}/tetikler`, { govde: g }); setV((x) => (x ? { ...x, tetikler: r.tetikler } : x)); }
    } catch { /* gösterildi */ } finally { setGidiyor(null); }
  };
  const zamanlar = v?.tetikler.filter((t) => t.tur === "zaman") ?? [];
  const webhooklar = v?.tetikler.filter((t) => t.tur === "webhook") ?? [];
  const satirSonu = (t: Tetik) => (
    <>
      {gidiyor === t.id ? <Loader2 className="h-4 w-4 animate-spin text-white/40" /> : <Anahtar acik={t.acik && !t.duraklatma} set={(x) => islem({ islem: "guncelle", id: t.id, acik: x })} etiket={`${t.ad} açık`} />}
      <Menu l={[
        { ad: "Şimdi çalıştır", ikon: Play, f: () => islem({ islem: "calistir", id: t.id }) },
        { ad: "Düzenle", ikon: Pencil, f: () => setPanel({ tur: t.tur, t }) },
        { ad: "Çalışmaları gör", ikon: History, f: () => setPanel({ tur: t.tur, t }) },
        ...(t.tur === "webhook" ? [{ ad: "Adresi yenile", ikon: RefreshCw, f: () => islem({ islem: "gizli", id: t.id }) }] : []),
        { ad: "Sil", ikon: Trash2, f: () => islem({ islem: "sil", id: t.id }), tehlike: true },
      ]} />
    </>
  );
  const durum = (t: Tetik) => t.duraklatma
    ? <span className="mt-1 flex items-center gap-1.5 text-[12px] text-amber-200"><Pause className="h-3 w-3" />Duraklatıldı: {t.duraklatma}<button type="button" onClick={() => islem({ islem: "devam", id: t.id })} className="ml-1 underline underline-offset-2 hover:text-white">Sürdür</button></span>
    : t.sonCalisma ? <span className="mt-1 flex items-center gap-1.5 text-[11.5px] text-white/40">Son çalışma {gorece(t.sonCalisma)}{t.sonDurum && <DurumHapi d={t.sonDurum as Parameters<typeof DurumHapi>[0]["d"]} className="py-0 text-[10.5px]" />}</span> : null;

  return (
    <div className="space-y-4">
      <Kart ikon={CalendarClock} baslik="Zamanlamalar" alt="Ajan belirlediğin saatlerde kendiliğinden çalışır" sag={<button type="button" onClick={() => setPanel({ tur: "zaman", t: null })} className={ikincil}><Plus className="h-3.5 w-3.5" />Zamanlama</button>}
        altSerit={v ? <span className="text-[12px] text-white/45">Bugün {v.bugun} tetikli çalışma{v.tavan ? `, günlük sınır ${v.tavan}` : ""} · Üst üste 3 hatada tetik kendini duraklatır · {a.yayin.durum === "yayinda" ? `Yayındaki sürüm ${a.yayin.surum} çalışır` : "Ajan yayında değil; taslak çalışır"}</span> : undefined}>
        {!v ? <div className="h-24 animate-pulse" /> : !zamanlar.length ? (
          <BosDurum ikon={CalendarClock} baslik="Zamanlama yok" alt="Her sabah haber özeti, her pazartesi rakip fiyat raporu, her saat stok denetimi. Düz Türkçe yaz, Vayra kurala çevirsin.">
            <button type="button" onClick={() => setPanel({ tur: "zaman", t: null })} className={birincil}><Plus className="h-3.5 w-3.5" />Zamanlama kur</button>
          </BosDurum>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {zamanlar.map((t) => (
              <div key={t.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                <span className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ring-1 ring-inset", t.acik && !t.duraklatma ? "bg-[#55d6fd]/[0.1] text-[#8be6ff] ring-[#55d6fd]/20" : "bg-white/[0.05] text-white/45 ring-white/[0.07]")}><CalendarClock className="h-4 w-4" /></span>
                <button type="button" onClick={() => setPanel({ tur: "zaman", t })} className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-[13.5px] font-medium text-white">{t.ad}</span>
                  <span className="block truncate text-[12.5px] text-white/60">{t.aciklama}{t.acik && !t.duraklatma && t.sonrakiler[0] ? ` · sonraki ${zamanYaz(t.sonrakiler[0], cihazDilimi())}` : !t.acik ? " · kapalı" : ""}</span>
                  {durum(t)}
                </button>
                <span className="flex shrink-0 items-center gap-1">{satirSonu(t)}</span>
              </div>
            ))}
          </div>
        )}
      </Kart>
      <Kart ikon={Webhook} baslik="Web kancaları" alt="Başka bir uygulama olay gönderince ajan çalışır" sag={<button type="button" onClick={() => setPanel({ tur: "webhook", t: null })} className={ikincil}><Plus className="h-3.5 w-3.5" />Webhook</button>}>
        {!v ? <div className="h-24 animate-pulse" /> : !webhooklar.length ? (
          <BosDurum ikon={Webhook} baslik="Webhook yok" alt="Shopify siparişi, form gönderimi, ödeme olayı: ajana özel bir adres al, düz dille filtre yaz, yalnız uyan olaylarda çalışsın.">
            <button type="button" onClick={() => setPanel({ tur: "webhook", t: null })} className={birincil}><Plus className="h-3.5 w-3.5" />Webhook oluştur</button>
          </BosDurum>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {webhooklar.map((t) => {
              const url = `${koken}/api/build/genel/ajan/${a.id}/tetik/${t.gizli}`;
              return (
                <div key={t.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                  <span className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ring-1 ring-inset", t.acik && !t.duraklatma ? "bg-[#55d6fd]/[0.1] text-[#8be6ff] ring-[#55d6fd]/20" : "bg-white/[0.05] text-white/45 ring-white/[0.07]")}><Webhook className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <button type="button" onClick={() => setPanel({ tur: "webhook", t })} className="block max-w-full text-left">
                      <span className="block truncate text-[13.5px] font-medium text-white">{t.ad}</span>
                      <span className="block truncate text-[12.5px] text-white/55">{t.filtre ? `Filtre: ${t.filtre}` : "Her olayda çalışır"}</span>
                    </button>
                    <span className="mt-1.5 flex min-w-0 items-center gap-1.5">
                      <span className="sc-kod min-w-0 truncate rounded-[8px] bg-white/[0.05] px-2 py-1 text-[11.5px] text-white/60 ring-1 ring-inset ring-white/[0.06]">{url}</span>
                      <button type="button" onClick={() => navigator.clipboard?.writeText(url)} aria-label="Adresi kopyala" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.08] hover:text-white"><Copy className="h-3.5 w-3.5" /></button>
                    </span>
                    {durum(t)}
                  </div>
                  <span className="flex shrink-0 items-center gap-1">{satirSonu(t)}</span>
                </div>
              );
            })}
          </div>
        )}
      </Kart>
      {panel && <TetikPaneli a={a} t={panel.t} tur={panel.tur} kapat={() => setPanel(null)} kaydedildi={(l) => setV((x) => (x ? { ...x, tetikler: l as Tetik[] } : x))} izAc={izAc} />}
    </div>
  );
}
