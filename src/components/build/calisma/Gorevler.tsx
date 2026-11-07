"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, Check, CircleStop, Eye, FileDiff, GitMerge, Layers, Loader2, MessageCircleQuestion, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { ModelSecici, SaglayiciLogo } from "@/components/build/ModelSecici";
import { YanPanel, birincil, ikincil } from "@/components/build/paylasim/ortak";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { BUILD_MODELLERI, modelBul } from "@/lib/build/modeller";
import type { GorevDurum, GorevOzet } from "@/app/api/build/gorevler/[id]/route";
import { useAuth } from "@/store/useAuth";
import { buildKrediEsitle } from "@/lib/build/istemciKredi";
import { cn } from "@/lib/utils";

const KREDI_ANAHTARI = "vayra-build-gorev-kredi";
const ORNEKLER = ["Telefon görünümünü gözden geçir, taşan ve sıkışan yerleri düzelt", "Bütün sayfalarda SEO başlığı, açıklaması ve paylaşım görselini tamamla", "Erişilebilirlik denetimi yap: kontrast, alt metin, klavye ile gezinme"];
const DURUM: Record<GorevDurum, { ad: string; sinif: string }> = {
  sirada: { ad: "Başlıyor", sinif: "bg-white/[0.08] text-white/70" },
  calisiyor: { ad: "Çalışıyor", sinif: "bg-[#55d6fd]/[0.14] text-[#8be6ff]" },
  bekliyor: { ad: "Yanıt bekliyor", sinif: "bg-amber-400/[0.12] text-amber-200" },
  hazir: { ad: "İncelemeye hazır", sinif: "bg-emerald-400/[0.12] text-emerald-200" },
  hata: { ad: "Hata", sinif: "bg-rose-500/[0.12] text-rose-200" },
  durdu: { ad: "Durduruldu", sinif: "bg-white/[0.08] text-white/60" },
};
const surer = (d: GorevDurum) => d === "calisiyor" || d === "sirada";
const sureYaz = (ms: number) => { const s = Math.max(0, Math.round(ms / 1000)); return s < 60 ? `${s} sn` : s < 3600 ? `${Math.floor(s / 60)} dk ${s % 60 ? `${s % 60} sn` : ""}`.trim() : `${Math.floor(s / 3600)} sa ${Math.floor((s % 3600) / 60)} dk`; };

/** Görev listesi ve yoklama: süren görev varken 3 sn, panel kapalıyken 10 sn aralıkla. Biten görevin kredisi bir kez düşülür. */
export function useGorevler(projeId: string, etkin: boolean, panelAcik: boolean) {
  const [l, setL] = useState<GorevOzet[] | null>(null);
  const [sinir, setSinir] = useState(4);
  const yukle = useCallback(async () => {
    if (!etkin) return;
    try {
      const v = await api<{ gorevler: GorevOzet[]; sinir: number }>(`/api/build/gorevler/${projeId}`);
      setL(v.gorevler); setSinir(v.sinir);
      // Biten görevlerin kredisi (sunucuda hesaplandı) bu tarayıcıda bir kez düşülür.
      let dusulen: string[] = [];
      try { dusulen = JSON.parse(localStorage.getItem(KREDI_ANAHTARI) ?? "[]"); } catch { /* yok */ }
      const yeni = v.gorevler.filter((g) => !surer(g.durum) && g.kredi > 0 && g.mesajId && !dusulen.includes(g.mesajId));
      if (yeni.length) {
        buildKrediEsitle(yeni.reduce((t, g) => t + g.kredi, 0));
        try { localStorage.setItem(KREDI_ANAHTARI, JSON.stringify([...dusulen, ...yeni.map((g) => g.mesajId!)].slice(-300))); } catch { /* yok */ }
      }
    } catch { /* sessiz */ }
  }, [projeId, etkin]);
  useEffect(() => { yukle(); }, [yukle, panelAcik]);
  const suren = (l ?? []).some((g) => surer(g.durum));
  useEffect(() => {
    if (!etkin || (!suren && !panelAcik)) return;
    const t = setInterval(yukle, suren ? 3000 : 10000);
    return () => clearInterval(t);
  }, [etkin, suren, panelAcik, yukle]);
  const rozet = (l ?? []).filter((g) => surer(g.durum) || g.durum === "hazir" || g.durum === "bekliyor").length;
  return { l, sinir, yukle, rozet, suren };
}

export function GorevDugmesi({ ac, rozet, suren }: { ac: () => void; rozet: number; suren: boolean }) {
  return (
    <button type="button" onClick={ac} title="Paralel görevler" aria-label="Paralel görevler" className="relative flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[13px] text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white active:scale-[0.97]">
      {suren ? <Loader2 className="h-4 w-4 animate-spin text-[#8be6ff]" /> : <Layers className="h-4 w-4" />}<span className="hidden 2xl:inline">Görevler</span>
      {rozet > 0 && <span className="min-w-[18px] rounded-full bg-[#55d6fd] px-1 text-center text-[10.5px] font-semibold tabular-nums text-[#04212b]">{rozet}</span>}
    </button>
  );
}

/**
 * Paralel görevler (sağ panel): her görev ana projenin kopyası olan bir deneme dalında arka planda çalışır; sekme
 * kapansa da sürer. Bitince önizlemesi ve değişen dosyaları incelenir, ana projeye uygulanır (üç yollu birleştirme).
 * Aynı görev 2 ya da 3 modelle başlatılırsa sonuçlar yan yana karşılaştırılır, biri seçilir.
 */
export function GorevPaneli({ projeId, acik, kapat, g, anaYenile, model, baglantilar, ilkIstem }: {
  projeId: string; acik: boolean; kapat: () => void; g: ReturnType<typeof useGorevler>; anaYenile: () => void;
  /** Çalışma alanında seçili model (ilk görev modeli) ve bağlı modeller. */
  model: string; baglantilar?: Record<string, string | null>;
  /** "/gorev" komutuyla açılınca kutuya gelen metin. */
  ilkIstem?: string;
}) {
  const [istem, setIstem] = useState("");
  const [modeller, setModeller] = useState<string[]>([model]);
  const [mod, setMod] = useState<"yap" | "plan">("yap");
  const [is, setIs] = useState("");
  const [hata, setHata] = useState("");
  const [uyari, setUyari] = useState("");
  const [acikGorev, setAcikGorev] = useState<string | null>(null);
  const [catisma, setCatisma] = useState<{ id: string; mesaj: string } | null>(null);
  const alan = useRef<HTMLTextAreaElement>(null);

  // Panel açılınca ilk model çalışma alanında seçili olanla eşitlenir (karşılaştırma eklenmemişse).
  useEffect(() => { if (acik) { setHata(""); setUyari(""); setModeller((m) => (m.length === 1 ? [model] : m)); } }, [acik, model]);
  useEffect(() => { if (acik && ilkIstem) { setIstem(ilkIstem); setTimeout(() => alan.current?.focus(), 250); } }, [acik, ilkIstem]);

  const suren = (g.l ?? []).filter((x) => surer(x.durum)).length;
  const yer = g.sinir - suren;
  const baslat = async () => {
    const metin = istem.trim();
    if (metin.length < 3 || is) return;
    setIs("baslat"); setHata(""); setUyari("");
    try {
      const yazar = useAuth.getState().kullanici?.ad?.trim() || undefined;
      const v = await api<{ gorevler: string[]; uyari?: string }>(`/api/build/gorevler/${projeId}`, { govde: { istem: metin, modeller, mod, yazar } });
      setIstem(""); if (v.uyari) setUyari(v.uyari);
      await g.yukle();
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Görev başlatılamadı."); }
    finally { setIs(""); }
  };
  const islem = async (anahtar: string, f: () => Promise<unknown>) => {
    setIs(anahtar); setHata("");
    try { await f(); await g.yukle(); } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "İşlem yapılamadı."); }
    finally { setIs(""); }
  };
  const uygula = (x: GorevOzet, zorla = false, kardesler: GorevOzet[] = []) => islem(`uygula-${x.id}`, async () => {
    setCatisma(null);
    try {
      await api(`/api/build/dal/${x.id}`, { govde: { zorla } });
    } catch (e) {
      if (e instanceof ApiHatasi && e.durum === 409) { setCatisma({ id: x.id, mesaj: e.message }); return; }
      throw e;
    }
    // Karşılaştırmada seçilmeyen dallar silinir.
    for (const k of kardesler) await api(`/api/build/proje/${k.id}`, { method: "DELETE" }).catch(() => {});
    anaYenile();
  });
  const sil = (x: GorevOzet) => islem(`sil-${x.id}`, async () => {
    if (surer(x.durum)) await api(`/api/build/ajan/${x.id}`, { method: "DELETE" }).catch(() => {});
    await api(`/api/build/proje/${x.id}`, { method: "DELETE" });
  });
  const durdur = (x: GorevOzet) => islem(`durdur-${x.id}`, () => api(`/api/build/ajan/${x.id}`, { method: "DELETE" }));
  const yeniden = (x: GorevOzet) => islem(`yeniden-${x.id}`, async () => {
    await api(`/api/build/proje/${x.id}`, { method: "DELETE" }).catch(() => {});
    await api(`/api/build/gorevler/${projeId}`, { govde: { istem: x.istem, modeller: [x.model], mod: x.mod } });
  });

  /** Gruplar: karşılaştırmalı görevler bir arada, tekler ayrı. */
  const gruplar = useMemo(() => {
    const l = g.l ?? [];
    const out: { anahtar: string; gorevler: GorevOzet[] }[] = [];
    for (const x of l) {
      const k = x.grup ? `g-${x.grup}` : x.id;
      const var_ = out.find((o) => o.anahtar === k);
      if (var_) var_.gorevler.push(x); else out.push({ anahtar: k, gorevler: [x] });
    }
    return out;
  }, [g.l]);

  const kart = (x: GorevOzet, kardesler: GorevOzet[] = [], dar = false) => {
    const m = modelBul(x.model);
    const d = DURUM[x.durum];
    const genis = acikGorev === x.id;
    return (
      <div key={x.id} className={cn("rounded-[16px] bg-white/[0.03] ring-1 ring-inset", genis ? "ring-white/[0.16]" : "ring-white/[0.07]")}>
        <div className="p-3.5">
          <div className="flex items-center gap-2">
            <SaglayiciLogo m={m} boyut={15} />
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-white/70">{m.id === x.model ? m.ad : x.model}</span>
            <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium", d.sinif)}>
              {surer(x.durum) && <Loader2 className="h-3 w-3 animate-spin" />}{x.durum === "bekliyor" && <MessageCircleQuestion className="h-3 w-3" />}{x.durum === "hazir" && <Check className="h-3 w-3" />}{d.ad}
            </span>
          </div>
          {!kardesler.length && <p className="mt-2 line-clamp-2 text-[13.5px] font-medium leading-snug text-white">{x.istem}</p>}
          {x.durum === "hata" ? <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-snug text-rose-200/85">{x.hataMetni}</p>
            : x.ozet ? <p className={cn("mt-1.5 text-[12.5px] leading-snug text-white/55", genis ? "" : "line-clamp-2")}>{x.ozet}</p>
            : surer(x.durum) ? <p className="mt-1.5 text-[12.5px] text-white/45">Projenin kopyasında çalışıyor; bu sekmeyi kapatsan da sürer.</p> : null}
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-white/45">
            <span>{x.degisen.length ? `${x.degisen.length} dosya değişti` : "Dosya değişmedi"}</span><span>·</span>
            <span className="tabular-nums">{x.kredi} kredi</span><span>·</span>
            <span>{surer(x.durum) ? sureYaz(Date.now() - x.olusturma) : gorece(x.guncelleme)}</span>
          </p>
          {x.anaDegisti && x.degisen.length > 0 && !surer(x.durum) && <p className="mt-2 flex items-start gap-1.5 text-[11.5px] leading-snug text-amber-200/85"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />Ana proje bu arada değişti; uygularken iki tarafta da değişen dosyalar denetlenir.</p>}
          {catisma?.id === x.id && (
            <div className="mt-2.5 rounded-[12px] bg-amber-400/[0.07] p-2.5 ring-1 ring-inset ring-amber-300/20">
              <p className="text-[12px] leading-snug text-amber-100/90">{catisma.mesaj}</p>
              <div className="mt-2 flex gap-2"><button type="button" onClick={() => uygula(x, true, kardesler)} className={cn(birincil, "h-8 text-[12.5px]")}>Görevdekiyle değiştir</button><button type="button" onClick={() => setCatisma(null)} className={cn(ikincil, "h-8 text-[12.5px]")}>Vazgeç</button></div>
            </div>
          )}
          <div className="mt-3 flex items-start gap-1">
            <div className={cn("flex min-w-0 flex-1 flex-wrap items-center gap-1.5", dar && "gap-1")}>
            {x.durum === "hazir" && x.degisen.length > 0 && <button type="button" disabled={!!is} onClick={() => uygula(x, false, kardesler)} className={cn(birincil, "h-8 px-3 text-[12.5px]")}>{is === `uygula-${x.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitMerge className="h-3.5 w-3.5" />}{kardesler.length ? "Bunu seç" : "Uygula"}</button>}
            {!surer(x.durum) && x.degisen.length > 0 && <button type="button" onClick={() => setAcikGorev(genis ? null : x.id)} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><Eye className="h-3.5 w-3.5" />{genis ? "Kapat" : "İncele"}</button>}
            {(x.durum === "bekliyor" || surer(x.durum)) && <a href={`/panel/build/${x.id}`} target="_blank" rel="noreferrer" className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>{x.durum === "bekliyor" ? "Yanıtla" : "İzle"}<ArrowUpRight className="h-3.5 w-3.5" /></a>}
            {surer(x.durum) && <button type="button" disabled={!!is} onClick={() => durdur(x)} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><CircleStop className="h-3.5 w-3.5" />Durdur</button>}
            {(x.durum === "hata" || x.durum === "durdu") && <button type="button" disabled={!!is || yer < 1} onClick={() => yeniden(x)} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><RotateCcw className="h-3.5 w-3.5" />Yeniden dene</button>}
            </div>
            {!surer(x.durum) && <a href={`/panel/build/${x.id}`} target="_blank" rel="noreferrer" title="Dalda aç ve sohbetle sürdür" aria-label="Dalda aç" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.07] hover:text-white"><ArrowUpRight className="h-3.5 w-3.5" /></a>}
            <button type="button" disabled={!!is} onClick={() => sil(x)} title="Görevi sil" aria-label="Görevi sil" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.07] hover:text-rose-200">{is === `sil-${x.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}</button>
          </div>
        </div>
        <AnimatePresence initial={false}>
          {genis && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/[0.06]">
              <div className="space-y-3 p-3.5">
                <a href={x.onizleme} target="_blank" rel="noreferrer" title="Önizlemeyi yeni sekmede aç" className="group relative block aspect-[16/10] overflow-hidden rounded-[12px] bg-white ring-1 ring-white/[0.08]">
                  <iframe title="Görev önizlemesi" src={x.onizleme} sandbox="allow-scripts" loading="lazy" tabIndex={-1} className="pointer-events-none absolute left-0 top-0 h-[250%] w-[250%] origin-top-left scale-[0.4] border-0" />
                  <span className="absolute bottom-2 right-2 inline-flex h-7 items-center gap-1 rounded-full bg-black/70 px-2.5 text-[11.5px] text-white opacity-0 transition-opacity group-hover:opacity-100">Tam önizleme<ArrowUpRight className="h-3 w-3" /></span>
                </a>
                {x.degisen.length > 0 && (
                  <ul className="space-y-1">
                    {x.degisen.slice(0, 12).map((f) => (
                      <li key={f.yol} className="flex items-center gap-2 text-[12px]">
                        <FileDiff className="h-3.5 w-3.5 shrink-0 text-white/40" /><span className="min-w-0 flex-1 truncate text-white/75">{f.yol}</span>
                        <span className={cn("shrink-0 rounded-full px-1.5 py-px text-[10.5px]", f.tur === "eklendi" ? "bg-emerald-400/[0.12] text-emerald-200" : f.tur === "silindi" ? "bg-rose-500/[0.12] text-rose-200" : "bg-white/[0.07] text-white/60")}>{f.tur === "eklendi" ? "Yeni" : f.tur === "silindi" ? "Silindi" : "Değişti"}</span>
                      </li>
                    ))}
                    {x.degisen.length > 12 && <li className="text-[11.5px] text-white/40">ve {x.degisen.length - 12} dosya daha</li>}
                  </ul>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <YanPanel acik={acik} kapat={kapat} genislik={600} baslik="Paralel görevler" alt="Her görev projenin bir kopyasında arka planda çalışır; sen uygulayana kadar ana proje değişmez"
      alt2={<><span className="min-w-0 flex-1 truncate text-[12.5px] text-white/45">{suren ? `${suren} görev çalışıyor, ${Math.max(0, yer)} yer boş` : `Aynı anda en çok ${g.sinir} görev`}</span><button type="button" onClick={kapat} className={birincil}>Bitti</button></>}>
      <div className="space-y-5">
        <section className="cam-istemci rounded-[20px] p-3">
          <textarea ref={alan} value={istem} onChange={(e) => setIstem(e.target.value)} rows={3} maxLength={8000}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); baslat(); } }}
            placeholder="Arka planda ne yapılsın? Örneğin: iletişim sayfasına harita ve çalışma saatleri ekle"
            className="w-full resize-none bg-transparent px-1.5 py-1 text-[14px] leading-relaxed text-white outline-none placeholder:text-white/35" />
          <div className="mt-1 space-y-2">
            {modeller.map((mid, i) => (
              <div key={i} className="flex items-center gap-2">
                <ModelSecici deger={mid} sec={(y) => setModeller((l) => l.map((x, j) => (j === i ? y : x)))} baglantilar={baglantilar} />
                <span className="min-w-0 truncate text-[12.5px] text-white/75 sm:hidden">{modelBul(mid).ad}</span>
                {modeller.length > 1 && <span className="shrink-0 text-[11.5px] text-white/40">Seçenek {String.fromCharCode(65 + i)}</span>}
                <span className="flex-1" />
                {i > 0 && <button type="button" onClick={() => setModeller((l) => l.filter((_, j) => j !== i))} aria-label="Modeli çıkar" title="Modeli çıkar" className="flex h-7 w-7 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.07] hover:text-white"><X className="h-3.5 w-3.5" /></button>}
              </div>
            ))}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-2.5">
            <div role="radiogroup" aria-label="Kip" className="flex rounded-full bg-white/[0.05] p-0.5">
              {([["yap", "Doğrudan yap"], ["plan", "Önce plan"]] as const).map(([k, ad]) => (
                <button key={k} type="button" role="radio" aria-checked={mod === k} onClick={() => setMod(k)} className={cn("h-7 rounded-full px-3 text-[12px] font-medium transition-colors", mod === k ? "bg-white text-black" : "text-white/60 hover:text-white")}>{ad}</button>
              ))}
            </div>
            {modeller.length < 3 && (
              <button type="button" onClick={() => setModeller((l) => [...l, BUILD_MODELLERI.find((x) => !l.includes(x.id) && (!baglantilar || baglantilar[x.id]))?.id ?? BUILD_MODELLERI.find((x) => !l.includes(x.id))!.id])}
                className="inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] text-white/65 hover:bg-white/[0.07] hover:text-white"><Plus className="h-3.5 w-3.5" />{modeller.length === 1 ? "Başka modelle karşılaştır" : "Model ekle"}</button>
            )}
            <span className="flex-1" />
            <button type="button" disabled={istem.trim().length < 3 || !!is || yer < modeller.length} onClick={baslat} className={cn(birincil, "h-8")}>
              {is === "baslat" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{modeller.length > 1 ? `${modeller.length} modelle başlat` : "Görevi başlat"}
            </button>
          </div>
        </section>
        {yer < modeller.length && <p className="-mt-3 text-[12px] text-amber-200/85">Aynı anda en çok {g.sinir} görev çalışır; biri bitince yenisini başlatabilirsin.</p>}
        {hata && <p className="-mt-2 text-[12.5px] text-rose-300">{hata}</p>}
        {uyari && <p className="-mt-2 text-[12.5px] text-amber-200/85">Bir model başlatılamadı: {uyari}</p>}

        {g.l === null ? <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-white/35" /></div>
          : !g.l.length ? (
            <div className="rounded-[18px] bg-white/[0.025] p-4 ring-1 ring-inset ring-white/[0.06]">
              <p className="text-[13.5px] font-medium text-white">Birden çok işi aynı anda yaptır</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-white/55">Sen sohbette çalışırken görevler arka planda ilerler. Bir görevi iki ya da üç modelle başlatırsan sonuçları yan yana görür, en iyisini seçersin.</p>
              <div className="mt-3 flex flex-col gap-1.5">
                {ORNEKLER.map((o) => <button key={o} type="button" onClick={() => { setIstem(o); alan.current?.focus(); }} className="rounded-[12px] bg-white/[0.04] px-3 py-2 text-left text-[12.5px] text-white/75 hover:bg-white/[0.07] hover:text-white">{o}</button>)}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {gruplar.map((gr) => gr.gorevler.length > 1 ? (
                <div key={gr.anahtar} className="rounded-[18px] bg-white/[0.02] p-3 ring-1 ring-inset ring-white/[0.07]">
                  <p className="text-[11.5px] text-white/45">Model karşılaştırması</p>
                  <p className="mt-0.5 line-clamp-2 text-[13.5px] font-medium text-white">{gr.gorevler[0].istem}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {gr.gorevler.map((x) => kart(x, gr.gorevler.filter((y) => y.id !== x.id), true))}
                  </div>
                </div>
              ) : kart(gr.gorevler[0]))}
            </div>
          )}
      </div>
    </YanPanel>
  );
}
