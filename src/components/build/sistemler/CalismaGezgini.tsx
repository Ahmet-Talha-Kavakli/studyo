"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, FlaskConical, LayoutGrid, Loader2, Plus, ScrollText, Search, X } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { AcilirSecim, Anahtar, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { BEKLEME_ADI, CALISMA_SINIF, SistemSekmeleri, TETIK_ADI, TETIK_IKON, sureYaz, tarihSaat, type CalismaDurum, type CalismaOzeti } from "./ortak";

type Satir = CalismaOzeti & { sistemAd: string };
const DURUMLAR: CalismaDurum[] = ["basarisiz", "bekliyor", "calisiyor", "kuyrukta", "basarili", "durdu", "iptal"];
const gun = (t: number) => new Date(t + 3 * 3600_000).toISOString().slice(0, 10);

/** Tüm sistemlerin çalışmaları: durum, sistem, tetik, tarih süzgeçleri ve arama (adım verilerinde de). */
export function CalismaGezgini() {
  const router = useRouter();
  const q = useSearchParams();
  const [durum, setDurum] = useState<Set<string>>(new Set((q.get("durum") ?? "").split(",").filter(Boolean)));
  const [sistem, setSistem] = useState(q.get("sistem") ?? "");
  const [tetik, setTetik] = useState("");
  const [aralik, setAralik] = useState<"" | "bugun" | "7" | "30" | "ozel">("");
  const [bas, setBas] = useState(""); const [son, setSon] = useState("");
  const [ara, setAra] = useState(""); const [derin, setDerin] = useState(false);
  const [l, setL] = useState<Satir[] | null>(null);
  const [toplam, setToplam] = useState(0);
  const [sayilar, setSayilar] = useState<Record<string, number>>({});
  const [sistemler, setSistemler] = useState<{ id: string; ad: string }[]>([]);
  const [sayfa, setSayfa] = useState(0);
  const [yukleniyor, setYukleniyor] = useState(false);
  const istek = useRef(0);
  /** Toplu yeniden çalıştırma: seçili çalışmalar (sistem/çalışma kimliği). */
  const [secim, setSecim] = useState<Set<string>>(new Set());
  const [toplu, setToplu] = useState<{ islem: string; bitti: number; hata: number; toplam: number } | null>(null);
  const sec = (k: string) => setSecim((x) => { const y = new Set(x); if (y.has(k)) y.delete(k); else y.add(k); return y; });
  const topluCalistir = async (islem: "devam" | "yeniden") => {
    const l2 = [...secim];
    setToplu({ islem, bitti: 0, hata: 0, toplam: l2.length });
    for (const k of l2) {
      const [sid, cid] = k.split("/");
      try { await api(`/api/build/sistemler/${sid}/calismalar/${cid}`, { govde: { islem } }); setToplu((t) => (t ? { ...t, bitti: t.bitti + 1 } : t)); }
      catch { setToplu((t) => (t ? { ...t, bitti: t.bitti + 1, hata: t.hata + 1 } : t)); }
    }
    setSecim(new Set());
    // Listeyi tazele (yeni çalışmalar ve güncel durumlar).
    api<{ calismalar: Satir[]; toplam: number; sayilar: Record<string, number> }>(`/api/build/sistemler/calismalar?${sorgu(0)}`).then((v) => { setL(v.calismalar); setToplam(v.toplam); setSayilar(v.sayilar); setSayfa(0); }).catch(() => {});
    setTimeout(() => setToplu(null), 4000);
  };

  const sorgu = useCallback((s: number) => {
    const p = new URLSearchParams();
    if (durum.size) p.set("durum", [...durum].join(","));
    if (sistem) p.set("sistem", sistem);
    if (tetik) p.set("tetik", tetik);
    const simdi = Date.now();
    if (aralik === "bugun") p.set("bas", gun(simdi));
    else if (aralik === "7") p.set("bas", gun(simdi - 6 * 86_400_000));
    else if (aralik === "30") p.set("bas", gun(simdi - 29 * 86_400_000));
    else if (aralik === "ozel") { if (bas) p.set("bas", bas); if (son) p.set("son", son); }
    if (ara.trim()) { p.set("q", ara.trim()); if (derin) p.set("derin", "1"); }
    p.set("sayfa", String(s));
    return p.toString();
  }, [durum, sistem, tetik, aralik, bas, son, ara, derin]);

  useEffect(() => {
    const n = ++istek.current;
    setYukleniyor(true);
    const z = setTimeout(() => {
      api<{ calismalar: Satir[]; toplam: number; sistemler: { id: string; ad: string }[]; sayilar: Record<string, number> }>(`/api/build/sistemler/calismalar?${sorgu(0)}`)
        .then((v) => { if (n !== istek.current) return; setL(v.calismalar); setToplam(v.toplam); setSistemler(v.sistemler); setSayilar(v.sayilar); setSayfa(0); })
        .catch(() => { if (n === istek.current) setL([]); }).finally(() => { if (n === istek.current) setYukleniyor(false); });
    }, ara ? 300 : 0);
    return () => clearTimeout(z);
  }, [sorgu, ara]);
  // Etkin çalışma varsa listeyi tazele.
  useEffect(() => {
    if (!l?.some((c) => c.durum === "calisiyor" || c.durum === "kuyrukta")) return;
    const z = setInterval(() => { api<{ calismalar: Satir[]; toplam: number; sayilar: Record<string, number> }>(`/api/build/sistemler/calismalar?${sorgu(0)}`).then((v) => { setL((x) => [...v.calismalar, ...(x ?? []).slice(v.calismalar.length)]); setToplam(v.toplam); setSayilar(v.sayilar); }).catch(() => {}); }, 3000);
    return () => clearInterval(z);
  }, [l, sorgu]);
  const dahaFazla = async () => {
    const v = await api<{ calismalar: Satir[] }>(`/api/build/sistemler/calismalar?${sorgu(sayfa + 1)}`).catch(() => null);
    if (v) { setL((x) => [...(x ?? []), ...v.calismalar]); setSayfa(sayfa + 1); }
  };
  const tumSayi = Object.values(sayilar).reduce((t, x) => t + x, 0);
  const temiz = durum.size || sistem || tetik || aralik || ara;

  return (
    <div className="mx-auto max-w-[1320px] space-y-5 px-4 pb-24 pt-16 sm:px-6 md:pt-8">
      <SistemSekmeleri sayilar={{ hata: sayilar.basarisiz }} />
      <Kart ikon={ScrollText} baslik="Çalışmalar" alt="Tüm sistemlerin çalışmaları; 30 gün ya da 2000 çalışma saklanır" govde="p-4 sm:p-5"
        sag={temiz ? <button type="button" onClick={() => { setDurum(new Set()); setSistem(""); setTetik(""); setAralik(""); setAra(""); setDerin(false); router.replace("/panel/build/sistemler/calismalar"); }} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-white/60 hover:bg-white/[0.06] hover:text-white"><X className="h-3.5 w-3.5" />Süzgeçleri temizle</button> : undefined}>
        <div className="space-y-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <label className={cn(alanSinif, "flex h-11 min-w-0 shrink-0 items-center gap-2 md:flex-1")}><Search className="h-4 w-4 shrink-0 text-white/40" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Hata, tetik verisi, adım ya da kimlik ara" className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-white/35" />{yukleniyor && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/40" />}</label>
            <label className="flex h-11 shrink-0 items-center gap-2.5 rounded-[14px] bg-white/[0.03] px-3.5 text-[13px] text-white/70 ring-1 ring-inset ring-white/[0.07]">Adım girdi ve çıktılarında da ara<Anahtar acik={derin} etiket="Derin arama" set={setDerin} /></label>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <AcilirSecim deger={sistem} set={setSistem} l={sistemler} bos="Tüm sistemler" />
            <AcilirSecim deger={tetik} set={setTetik} l={["deneme", "elle", "zaman", "webhook", "form", "veri", "sistem", "rss", "eposta", "odeme", "servis", "isletme", "cagri", "api", "mcp"].map((x) => ({ id: x, ad: TETIK_ADI[x] }))} bos="Tüm tetikler" />
            <AcilirSecim deger={aralik} set={(v) => setAralik(v as typeof aralik)} l={[{ id: "bugun", ad: "Bugün" }, { id: "7", ad: "Son 7 gün" }, { id: "30", ad: "Son 30 gün" }, { id: "ozel", ad: "Özel", alt: "Başlangıç ve bitiş seç" }]} bos="Tüm tarihler" />
            {aralik === "ozel" ? (
              <div className="flex gap-2"><input type="date" value={bas} onChange={(e) => setBas(e.target.value)} aria-label="Başlangıç" className={cn(alanSinif, "h-10 min-w-0 flex-1 text-[13px] [color-scheme:dark]")} /><input type="date" value={son} onChange={(e) => setSon(e.target.value)} aria-label="Bitiş" className={cn(alanSinif, "h-10 min-w-0 flex-1 text-[13px] [color-scheme:dark]")} /></div>
            ) : <span className="hidden lg:block" />}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
            <button type="button" onClick={() => setDurum(new Set())} className={cn("flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] ring-1 ring-inset transition", !durum.size ? "bg-white/[0.08] text-white ring-2 ring-white" : "bg-white/[0.03] text-white/60 ring-white/[0.08] hover:text-white")}>Tümü<span className="tabular-nums text-white/45">{tumSayi}</span></button>
            {DURUMLAR.map((d) => { const D = CALISMA_SINIF[d]; const on = durum.has(d); return (
              <button key={d} type="button" onClick={() => setDurum((x) => { const y = new Set(x); if (y.has(d)) y.delete(d); else y.add(d); return y; })} className={cn("flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] ring-1 ring-inset transition", on ? "bg-white/[0.08] text-white ring-2 ring-white" : "bg-white/[0.03] text-white/60 ring-white/[0.08] hover:text-white")}>
                <span className={cn("h-1.5 w-1.5 rounded-full", D.nokta)} />{D.ad}<span className="tabular-nums text-white/45">{sayilar[d] ?? 0}</span>
              </button>
            ); })}
          </div>
        </div>
      </Kart>

      {l === null ? <div className="h-[260px] animate-pulse rounded-[26px] bg-white/[0.03]" /> : !l.length ? (
        <div className="flex flex-col gap-3 rounded-[22px] bg-[#121315] p-4 ring-1 ring-inset ring-white/[0.07] sm:flex-row sm:items-center sm:p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-white/[0.07] text-white/70"><ScrollText className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1"><p className="text-[14.5px] font-semibold text-white">{temiz ? "Bu süzgeçlere uyan çalışma yok" : "Henüz çalışma yok"}</p><p className="text-[12.5px] text-white/50">{temiz ? "Süzgeçleri gevşet ya da aramayı değiştir." : "Bir sistemi deneyince ya da tetik gelince çalışmalar burada listelenir."}</p></div>
          <div className="flex gap-2"><Link href="/panel/build/sistemler" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><Plus className="h-3.5 w-3.5" />Sistem kur</Link><Link href="/panel/build/sistemler#hazir" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[13px] text-white/85 hover:bg-white/[0.12]"><LayoutGrid className="h-3.5 w-3.5" />Hazır sistemler</Link></div>
        </div>
      ) : (
        <Kart ikon={ScrollText} baslik={<span className="flex items-center gap-2">Sonuçlar<span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[12px] font-medium tabular-nums text-white/70">{toplam}</span></span>} alt="Yeniden eskiye">
          <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_150px_110px_90px_28px] gap-3 border-b border-white/[0.05] px-5 py-2 text-[11.5px] text-white/40 lg:grid"><span>Sistem ve durum</span><span>Tetik ve sürüm</span><span>Başladı</span><span>Süre</span><span>Kredi</span><span /></div>
          <div className="divide-y divide-white/[0.05]">
            <AnimatePresence initial={false}>
              {l.map((c) => { const D = CALISMA_SINIF[c.durum]; const T = TETIK_IKON[c.tetikTur] ?? FlaskConical; return (
                <motion.div key={`${c.sistemId}-${c.id}`} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Link href={`/panel/build/sistemler/${c.sistemId}/calisma/${c.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-white/[0.02] sm:px-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_150px_110px_90px_28px]">
                    <span className="min-w-0">
                      <span className="flex min-w-0 items-center gap-2"><button type="button" role="checkbox" aria-checked={secim.has(`${c.sistemId}/${c.id}`)} aria-label="Çalışmayı seç" onClick={(e) => { e.preventDefault(); e.stopPropagation(); sec(`${c.sistemId}/${c.id}`); }} className={cn("flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] ring-inset transition-colors", secim.has(`${c.sistemId}/${c.id}`) ? "bg-white/[0.12] ring-2 ring-white" : "ring-1 ring-white/25 hover:ring-white/50")}>{secim.has(`${c.sistemId}/${c.id}`) && <span className="h-2 w-2 rounded-[3px] bg-white" />}</button><span className="truncate text-[14px] font-semibold text-white">{c.sistemAd}</span><span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", D.hap)}>{D.ad}</span></span>
                      {c.hata && c.durum !== "basarili" ? <span className="mt-0.5 block truncate text-[12px] text-rose-300/90">{c.hata}</span> : c.durum === "bekliyor" && c.beklemeTur ? <span className="mt-0.5 block truncate text-[12px] text-amber-200/80">{BEKLEME_ADI[c.beklemeTur]}</span> : <span className="mt-0.5 block truncate text-[12px] text-white/40">{c.adimSayisi} adım çalıştı{c.ust ? ` · ${c.ust} çağırdı` : ""}{c.kaynak ? ` · ${c.kaynak === "devam" ? "hatadan devam" : "yeniden çalıştırma"}` : ""}</span>}
                    </span>
                    <ChevronRight className="h-4 w-4 text-white/30 lg:hidden" />
                    <span className="col-span-2 flex min-w-0 items-center gap-1.5 text-[12.5px] text-white/60 lg:col-span-1"><T className="h-3.5 w-3.5 shrink-0 text-white/45" /><span className="truncate">{TETIK_ADI[c.tetikTur] ?? c.tetikTur} · {typeof c.surum === "number" ? `sürüm ${c.surum}` : "taslak"}</span><span className="text-white/35 lg:hidden">· {tarihSaat(c.baslangic)}{c.bitis ? ` · ${sureYaz(c.bitis - c.baslangic)}` : ""}</span></span>
                    <span className="hidden text-[12.5px] tabular-nums text-white/60 lg:block">{tarihSaat(c.baslangic)}</span>
                    <span className="hidden text-[12.5px] tabular-nums text-white/60 lg:block">{c.bitis ? sureYaz(c.bitis - c.baslangic) : "sürüyor"}</span>
                    <span className="hidden text-[12.5px] tabular-nums text-white/60 lg:block">{c.kredi}</span>
                    <ChevronRight className="hidden h-4 w-4 text-white/30 lg:block" />
                  </Link>
                </motion.div>
              ); })}
            </AnimatePresence>
          </div>
          {l.length < toplam && <div className="border-t border-white/[0.05] p-3 text-center"><button type="button" onClick={dahaFazla} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[13px] text-white/85 hover:bg-white/[0.12]">Daha fazla göster<span className="text-white/45">{toplam - l.length} kaldı</span></button></div>}
        </Kart>
      )}
      <AnimatePresence>
        {(secim.size > 0 || toplu) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="cam-istemci fixed bottom-5 left-1/2 z-50 flex w-[min(680px,calc(100vw-24px))] -translate-x-1/2 flex-wrap items-center gap-2 rounded-[22px] px-3 py-2.5">
            {toplu ? (
              <span className="flex items-center gap-2 px-1.5 text-[13px] text-white">{toplu.bitti < toplu.toplam && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{toplu.bitti} / {toplu.toplam} çalışma {toplu.islem === "devam" ? "sürdürüldü" : "yeniden başlatıldı"}{toplu.hata ? `, ${toplu.hata} hata` : ""}</span>
            ) : (
              <>
                <span className="px-1.5 text-[13px] font-medium text-white">{secim.size} çalışma seçili</span>
                <span className="flex-1" />
                <button type="button" onClick={() => topluCalistir("devam")} className="inline-flex h-9 items-center rounded-full bg-white px-4 text-[12.5px] font-semibold text-black">Hatalı adımdan sürdür</button>
                <button type="button" onClick={() => topluCalistir("yeniden")} className="inline-flex h-9 items-center rounded-full bg-white/[0.08] px-4 text-[12.5px] text-white hover:bg-white/[0.13]">Aynı veriyle yeniden çalıştır</button>
                <button type="button" aria-label="Seçimi kaldır" onClick={() => setSecim(new Set())} className="flex h-9 w-9 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
