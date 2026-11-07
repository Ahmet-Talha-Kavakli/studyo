"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, ArrowUpRight, Ban, Check, ChevronRight, Copy, CornerLeftUp, FlaskConical, Inbox, Loader2, RotateCcw, ScrollText, Sparkles, SquareFunction, StepForward, Trash2 } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { adimBul, adimTuruAdi, duzListe, type Adim, type Tetikleyici } from "@/lib/build/sistemKatalog";
import { cn } from "@/lib/utils";
import { ADIM_DURUM, ADIM_IKON, BEKLEME_ADI, CALISMA_SINIF, JsonGorunum, Segment, TETIK_ADI, TETIK_IKON, adimOzeti, sureYaz, tarihSaat, type AdimSonucu, type Calisma } from "./ortak";
import { TuvalGorunumu } from "./Gorunum";
import { Tuval, type AdimDurumu, type Secim } from "./Tuval";

type Yanit = { calisma: Calisma & { devamAdresi?: string }; akis: Adim[]; akisGuncel: boolean; surumAdi?: string; suruyor: boolean; sistem: { id: string; ad: string; durum: string; model: string; yayin: number | null; tetikler: Tetikleyici[] } };

/** Modelin açıklamasını basit biçimle gösterir (başlık, liste, kalın). */
function Aciklama({ metin }: { metin: string }) {
  return (
    <div className="space-y-1.5 text-[13px] leading-relaxed text-white/80">
      {metin.split("\n").map((s, i) => {
        const t = s.trim();
        if (!t) return null;
        const kalin = (x: string) => x.split(/\*\*(.+?)\*\*/g).map((p, j) => (j % 2 ? <b key={j} className="font-semibold text-white">{p}</b> : p));
        if (/^#{1,4}\s/.test(t)) return <p key={i} className="pt-1.5 text-[13.5px] font-semibold text-white">{t.replace(/^#+\s*/, "")}</p>;
        if (/^([-*]|\d+[.)])\s/.test(t)) return <p key={i} className="flex gap-2 pl-1"><span className="shrink-0 text-[#8be6ff]">{/^\d/.test(t) ? t.match(/^\d+/)![0] : ""}{/^\d/.test(t) ? "." : "•"}</span><span>{kalin(t.replace(/^([-*]|\d+[.)])\s/, ""))}</span></p>;
        if (t.startsWith("```")) return null;
        return <p key={i}>{kalin(t)}</p>;
      })}
    </div>
  );
}

export function CalismaAyrinti({ sistemId, cid }: { sistemId: string; cid: string }) {
  const router = useRouter();
  const [v, setV] = useState<Yanit | null>(null);
  const [yok, setYok] = useState(false);
  const [secim, setSecim] = useState<Secim>(null);
  const [tur, setTur] = useState(0);
  const [sekme, setSekme] = useState<"girdi" | "cikti" | "hata" | "sure">("cikti");
  const [gidiyor, setGidiyor] = useState<string | null>(null);
  const [mesaj, setMesaj] = useState<{ tur: "ok" | "hata"; metin: string } | null>(null);
  const [aciklama, setAciklama] = useState<{ metin: string; zaman: number } | null>(null);
  const [kopya, setKopya] = useState(false);
  const [silOnay, setSilOnay] = useState(false);

  const yukle = useCallback(async () => {
    try { const x = await api<Yanit>(`/api/build/sistemler/${sistemId}/calismalar/${cid}`); setV(x); if (x.calisma.aciklama) setAciklama(x.calisma.aciklama); }
    catch (e) { if (e instanceof ApiHatasi && e.durum === 404) setYok(true); else setTimeout(() => setDeneme((x) => x + 1), 2000); }
  }, [sistemId, cid]);
  const [deneme, setDeneme] = useState(0);
  useEffect(() => { if (deneme) yukle(); }, [deneme, yukle]);
  useEffect(() => { yukle(); }, [yukle]);
  const c = v?.calisma;
  const etkin = c && (c.durum === "calisiyor" || c.durum === "kuyrukta" || c.durum === "bekliyor");
  useEffect(() => { if (!etkin) return; const z = setInterval(yukle, c?.durum === "bekliyor" ? 4000 : 1200); return () => clearInterval(z); }, [etkin, c?.durum, yukle]);
  // Varsayılan seçim: hatalı ya da bekleyen adım, yoksa ilk adım.
  useEffect(() => {
    if (!c || secim) return;
    const r = c.adimlar.find((x) => x.durum === "basarisiz") ?? c.adimlar.find((x) => x.durum === "bekliyor") ?? c.adimlar[0];
    if (r) { setSecim({ tur: "adim", id: r.id }); setSekme(r.durum === "basarisiz" ? "hata" : "cikti"); } else setSecim({ tur: "tetik", i: 0 });
  }, [c, secim]);

  const durumlar = useMemo(() => {
    const m = new Map<string, AdimDurumu>();
    for (const r of c?.adimlar ?? []) { const o = m.get(r.id); m.set(r.id, { durum: r.durum === "basarisiz" || o?.durum === "basarisiz" ? "basarisiz" : r.durum, sure: (o?.sure ?? 0) + r.sure, tur: (o?.tur ?? 0) + 1, hata: r.hata ?? o?.hata }); }
    return m;
  }, [c]);
  const numara = useMemo(() => new Map(duzListe(v?.akis ?? []).map((x) => [x.a.id, x.no])), [v?.akis]);

  if (yok) return <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center"><p className="text-[17px] font-semibold">Çalışma bulunamadı</p><p className="mt-1 text-[13px] text-white/50">30 günden eski çalışmalar silinir.</p><Link href="/panel/build/sistemler/calismalar" className="mt-4 inline-flex h-10 items-center rounded-full bg-white px-5 text-[14px] font-semibold text-black">Çalışmalara dön</Link></div>;
  if (!v || !c) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>;

  const D = CALISMA_SINIF[c.durum];
  const T = TETIK_IKON[c.tetik.tur] ?? FlaskConical;
  const sonuclar = secim?.tur === "adim" ? c.adimlar.filter((x) => x.id === secim.id) : [];
  const r: AdimSonucu | undefined = sonuclar[Math.min(tur, sonuclar.length - 1)];
  const a = secim?.tur === "adim" ? adimBul(v.akis, secim.id) : undefined;
  const hataVar = c.durum === "basarisiz" || c.adimlar.some((x) => x.durum === "basarisiz");
  const devamOlur = c.durum === "basarisiz" || c.durum === "iptal";
  const islem = async (ad: string) => {
    setGidiyor(ad); setMesaj(null);
    try {
      const x = await api<{ calismaId?: string; aciklama?: { metin: string; zaman: number } }>(`/api/build/sistemler/${sistemId}/calismalar/${cid}`, { govde: { islem: ad, ...(ad === "acikla" && aciklama ? { yenile: true } : {}), ...(ad === "adimdan" && secim?.tur === "adim" ? { adimId: secim.id } : {}) } });
      if (ad === "acikla" && x.aciklama) setAciklama(x.aciklama);
      if ((ad === "devam" || ad === "yeniden" || ad === "adimdan") && x.calismaId) router.push(`/panel/build/sistemler/${sistemId}/calisma/${x.calismaId}`);
      if (ad === "test-verisi") setMesaj({ tur: "ok", metin: "Tetik verisi ve adım çıktıları düzenleyicide deneme verisi oldu." });
      if (ad === "iptal") { setMesaj({ tur: "ok", metin: "Çalışma iptal edildi." }); yukle(); }
    } catch (e) { setMesaj({ tur: "hata", metin: e instanceof ApiHatasi ? e.message : "İşlem yapılamadı." }); }
    finally { setGidiyor(null); }
  };
  const Dugme = ({ ad, ikon: I, metin, birincil, kapali }: { ad: string; ikon: typeof Check; metin: string; birincil?: boolean; kapali?: boolean }) => (
    <button type="button" onClick={() => islem(ad)} disabled={!!gidiyor || kapali} className={cn("inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium disabled:opacity-40", birincil ? "bg-white font-semibold text-black" : "bg-white/[0.07] text-white/85 hover:bg-white/[0.12]")}>{gidiyor === ad ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <I className="h-3.5 w-3.5" />}{metin}</button>
  );

  return (
    <div className="mx-auto max-w-[1560px] space-y-4 px-4 pb-16 pt-16 sm:px-6 md:pt-6">
      <Kart ikon={ScrollText} baslik={<span className="flex items-center gap-2"><Link href={`/panel/build/sistemler/${sistemId}`} className="truncate hover:underline">{v.sistem.ad}</Link><span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-medium", D.hap)}>{D.ad}</span>{c.hataEleAlindi && <span className="shrink-0 rounded-full bg-rose-500/[0.1] px-2 py-0.5 text-[11.5px] font-medium text-rose-200">Hata dalı çalıştı</span>}</span>}
        alt={`Çalışma ${c.id} · ${tarihSaat(c.baslangic)}`} sag={<><Link href={`/panel/build/sistemler/calismalar?sistem=${sistemId}`} className="hidden h-9 items-center rounded-full px-3 text-[13px] text-white/60 hover:bg-white/[0.06] hover:text-white sm:inline-flex">Tüm çalışmalar</Link><Link href={`/panel/build/sistemler/${sistemId}`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[13px] text-white/85 hover:bg-white/[0.12]"><ArrowLeft className="h-3.5 w-3.5" /><span className="max-sm:hidden">Düzenleyici</span></Link></>} govde="p-4 sm:p-5">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Tetik", <span key="t" className="flex items-center gap-1.5"><T className="h-3.5 w-3.5 text-white/50" />{TETIK_ADI[c.tetik.tur] ?? c.tetik.tur}</span>],
            ["Sürüm", typeof c.surum === "number" ? `${c.surum}${v.surumAdi && v.surumAdi !== `Sürüm ${c.surum}` ? `, ${v.surumAdi}` : ""}` : "Taslak"],
            ["Süre", c.bitis ? sureYaz(c.bitis - c.baslangic) : etkin ? `${sureYaz(Date.now() - c.baslangic)}, sürüyor` : "Bilinmiyor"],
            ["Adım", `${c.adimlar.filter((x) => x.durum === "basarili").length} tamam${c.adimlar.some((x) => x.durum === "basarisiz") ? `, ${c.adimlar.filter((x) => x.durum === "basarisiz").length} hata` : ""}`],
            ["Kredi", `${c.kredi}`],
            ["Kaynak", c.ust ? <Link key="u" href={`/panel/build/sistemler/${c.ust.sistemId}/calisma/${c.ust.calismaId}`} className="text-[#8be6ff] hover:underline">{c.ust.sistemAd} çağırdı</Link> : c.kaynak ? <Link key="k" href={`/panel/build/sistemler/${sistemId}/calisma/${c.kaynak.calismaId}`} className="text-[#8be6ff] hover:underline">{c.kaynak.tur === "devam" ? "Hatadan devam" : "Yeniden çalıştırma"}</Link> : "Doğrudan"],
          ].map(([e, d]) => <div key={String(e)} className="min-w-0"><dt className="text-[11.5px] text-white/45">{e}</dt><dd className="mt-0.5 truncate text-[13.5px] font-medium text-white">{d}</dd></div>)}
        </dl>
        {c.ust && (
          <Link href={`/panel/build/sistemler/${c.ust.sistemId}/calisma/${c.ust.calismaId}`} className="mt-4 flex items-center gap-3 rounded-[16px] bg-white/[0.03] px-3.5 py-2.5 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.05]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.07] text-white/75"><CornerLeftUp className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium text-white">Çağıran çalışma: {c.ust.sistemAd}</span><span className="block truncate text-[12px] text-white/50">"{c.ust.adimAd}" adımı {c.ust.bekle ? (etkin ? "bitmesini bekliyor" : "bitmesini bekledi") : "başlatıp beklemeden devam etti"} · zincirde {c.ust.derinlik}. düzey</span></span>
            <ChevronRight className="h-4 w-4 shrink-0 text-white/35" />
          </Link>
        )}
        {c.hata && <p className="mt-4 flex items-start gap-2 rounded-[14px] bg-rose-500/[0.07] px-3.5 py-2.5 text-[13px] leading-relaxed text-rose-200 ring-1 ring-inset ring-rose-400/15"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{c.hata}</p>}
        {c.durum === "bekliyor" && c.bekleme && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[14px] bg-amber-400/[0.06] px-3.5 py-2.5 text-[13px] text-amber-100 ring-1 ring-inset ring-amber-300/15">
            <span className="min-w-0 flex-1">{BEKLEME_ADI[c.bekleme.tur] ?? "Bekliyor"}{c.bekleme.zaman ? `: ${tarihSaat(c.bekleme.zaman)} zamanında sürer` : c.bekleme.zamanAsimi ? `: en geç ${tarihSaat(c.bekleme.zamanAsimi)}` : ""}.{(c.beklemeler?.length ?? 0) > 1 ? ` Paralel dallarda ${c.beklemeler!.length} adım aynı anda bekliyor; her biri kendi zamanında sürer.` : ""} Sunucu yeniden başlasa da kaldığı yerden devam eder.</span>
            {c.bekleme.tur === "onay" && <Link href="/panel/build/sistemler/onaylar" className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black"><Inbox className="h-3.5 w-3.5" />Onaylara git</Link>}
            {c.bekleme.tur === "webhook" && c.devamAdresi && <button type="button" onClick={() => { navigator.clipboard?.writeText(c.devamAdresi!); setKopya(true); setTimeout(() => setKopya(false), 1200); }} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.1] px-3 text-[12.5px] text-white">{kopya ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}Devam adresini kopyala</button>}
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {devamOlur && <Dugme ad="devam" ikon={StepForward} metin={c.durum === "iptal" ? "Kaldığı yerden devam et" : "Hatalı adımdan devam et"} birincil />}
          {!etkin && <Dugme ad="yeniden" ikon={RotateCcw} metin="Aynı veriyle yeniden çalıştır" birincil={!devamOlur} />}
          {!etkin && secim?.tur === "adim" && <Dugme ad="adimdan" ikon={StepForward} metin={`${numara.get(secim.id) ?? ""}. adımdan yeniden çalıştır`} />}
          <Dugme ad="test-verisi" ikon={FlaskConical} metin="Test verisi olarak yükle" />
          {hataVar && !etkin && <Dugme ad="acikla" ikon={Sparkles} metin={aciklama ? "Yeniden açıkla" : "Hatayı açıkla"} />}
          {etkin && <Dugme ad="iptal" ikon={Ban} metin="İptal et" />}
          {!etkin && <button type="button" onClick={async () => { if (!silOnay) { setSilOnay(true); return; } await api(`/api/build/sistemler/${sistemId}/calismalar/${cid}`, { method: "DELETE" }).catch(() => {}); router.push(`/panel/build/sistemler/calismalar?sistem=${sistemId}`); }} className={cn("ml-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px]", silOnay ? "bg-rose-500/[0.14] font-semibold text-rose-200" : "text-white/50 hover:bg-white/[0.06] hover:text-rose-200")}><Trash2 className="h-3.5 w-3.5" />{silOnay ? "Silmek için tekrar tıkla" : "Sil"}</button>}
        </div>
        <AnimatePresence>{mesaj && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={cn("mt-3 text-[12.5px]", mesaj.tur === "ok" ? "text-emerald-200" : "text-rose-300")}>{mesaj.metin}</motion.p>}</AnimatePresence>
        <AnimatePresence>
          {aciklama && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-4 rounded-[18px] bg-[#55d6fd]/[0.05] p-4 ring-1 ring-inset ring-[#55d6fd]/15">
                <p className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[#8be6ff]"><Sparkles className="h-4 w-4" />Hatanın açıklaması<span className="font-normal text-white/40">· {gorece(aciklama.zaman)}</span></p>
                <Aciklama metin={aciklama.metin} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Kart>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_440px]">
        <section className="h-[62vh] min-h-[420px] overflow-hidden rounded-[26px] bg-[#0f0f11] ring-1 ring-inset ring-white/[0.07] lg:h-[calc(100vh-330px)]">
          <TuvalGorunumu anahtar={`calisma-${sistemId}`} className="h-full" ust={v.akisGuncel ? <p className="inline-block rounded-full bg-[#141416] px-3 py-1 text-[11.5px] text-white/50 ring-1 ring-inset ring-white/[0.1]">Bu çalışmanın akış kopyası yok; güncel taslak gösteriliyor</p> : undefined}>
            <Tuval tetikler={v.sistem.tetikler.slice(0, 1)} adimlar={v.akis} secim={secim} sec={(x) => { setSecim(x); setTur(0); const d = x?.tur === "adim" ? c.adimlar.find((y) => y.id === x.id) : undefined; setSekme(d?.durum === "basarisiz" ? "hata" : "cikti"); }}
            durum={(id) => durumlar.get(id)} dalCalisti={(aid, did) => c.adimlar.some((y) => y.id === aid && y.dal?.includes(did))} ozet={(x) => adimOzeti(x)} numara={numara} />
          </TuvalGorunumu>
        </section>
        <Kart ikon={secim?.tur === "adim" && a ? ADIM_IKON[a.tur] : T} baslik={secim?.tur === "adim" ? (a ? `${numara.get(a.id)}. ${a.ad}` : r?.ad ?? "Adım") : "Tetik verisi"} alt={secim?.tur === "adim" ? (r ? `${adimTuruAdi(r.tur)} · ${ADIM_DURUM[r.durum].ad}${r.deneme && r.deneme > 1 ? ` · ${r.deneme}. denemede` : ""}` : "Bu çalışmada çalışmadı") : TETIK_ADI[c.tetik.tur]} govde="p-4" className="lg:h-[calc(100vh-330px)]">
          {secim?.tur !== "adim" ? <JsonGorunum id="tetik" v={c.tetik.veri} bos="Tetik verisi yok" /> : !r ? (
            <p className="rounded-[14px] bg-white/[0.02] px-3.5 py-3 text-[12.5px] leading-relaxed text-white/50 ring-1 ring-inset ring-white/[0.06]">Bu adım bu çalışmada çalışmadı: başka bir dal seçildi, süzgeç durdurdu ya da çalışma bundan önce bitti.</p>
          ) : (
            <div className="space-y-3">
              {sonuclar.length > 1 && (
                <div className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:thin]">{sonuclar.map((x, i) => <button key={x.anahtar} type="button" onClick={() => setTur(i)} className={cn("flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px]", i === tur ? "bg-white/[0.1] text-white ring-2 ring-inset ring-white" : "bg-white/[0.05] text-white/60 hover:text-white")}><span className={cn("h-1.5 w-1.5 rounded-full", ADIM_DURUM[x.durum].nokta)} />{i + 1}. tur</button>)}</div>
              )}
              <Segment id="calisma-sekme" kucuk deger={sekme} set={setSekme} l={[{ id: "cikti", ad: "Çıktı" }, { id: "girdi", ad: "Girdi" }, { id: "hata", ad: r.hata ? "Hata" : "Hata yok", kapali: !r.hata }, { id: "sure", ad: "Süre" }]} />
              {r.ek?.alt && (
                <Link href={`/panel/build/sistemler/${r.ek.alt.sistemId}/calisma/${r.ek.alt.calismaId}`} className="flex items-center gap-3 rounded-[16px] bg-[#55d6fd]/[0.05] px-3.5 py-2.5 ring-1 ring-inset ring-[#55d6fd]/15 hover:bg-[#55d6fd]/[0.08]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><SquareFunction className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium text-white">Çağrılan çalışma: {r.ek.alt.sistemAd}</span><span className="block truncate text-[12px] text-white/50">{r.ek.alt.durum === "calisiyor" ? "Başlatıldı, beklenmedi" : r.ek.alt.durum ? CALISMA_SINIF[r.ek.alt.durum].ad : "Durum bilinmiyor"} · çalışma {r.ek.alt.calismaId}</span></span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-[#8be6ff]/70" />
                </Link>
              )}
              {sekme === "cikti" && (<>
                {r.ek?.gorseller?.length ? <div className="grid grid-cols-3 gap-1.5">{r.ek.gorseller.slice(0, 6).map((g) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={g} src={g} alt="" className="aspect-square w-full rounded-[10px] object-cover" />)}</div> : null}
                <JsonGorunum id={`c-${r.anahtar}`} v={r.veri} bos={r.durum === "bekliyor" ? "Adım bekliyor; çıktı gelince burada görünür." : "Çıktı yok"} />
                {r.sabit && <p className="text-[12px] text-[#8be6ff]/80">Bu çıktı sabitlenmiş deneme verisinden geldi; adım çalıştırılmadı.</p>}
              </>)}
              {sekme === "girdi" && <JsonGorunum id={`g-${r.anahtar}`} v={r.girdi} bos="Girdi kaydı yok" />}
              {sekme === "hata" && r.hata && <p className="whitespace-pre-wrap break-words rounded-[14px] bg-rose-500/[0.07] px-3.5 py-3 text-[13px] leading-relaxed text-rose-200 ring-1 ring-inset ring-rose-400/15">{r.hata}</p>}
              {sekme === "sure" && (
                <dl className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
                  {[["Süre", sureYaz(r.sure)], ["Başladı", r.baslangic ? tarihSaat(r.baslangic) : "Bilinmiyor"], ["Deneme", `${r.deneme ?? 1}`], ["Kredi", `${r.kredi}`], ...(sonuclar.length > 1 ? [["Toplam tur", `${sonuclar.length}`], ["Tüm turlar", sureYaz(sonuclar.reduce((t, x) => t + x.sure, 0))]] : [])].map(([e, d]) => <div key={e} className="flex items-center justify-between px-3.5 py-2.5 text-[13px]"><dt className="text-white/50">{e}</dt><dd className="font-medium tabular-nums text-white">{d}</dd></div>)}
                </dl>
              )}
              {r.ek?.loglar?.length ? <div><p className="mb-1 text-[12px] font-medium text-white/60">Günlük</p><pre className="sc-kod max-h-40 overflow-auto rounded-[12px] bg-[#0c0d0f] p-2.5 text-[11.5px] text-white/70 ring-1 ring-inset ring-white/[0.07]">{r.ek.loglar.join("\n")}</pre></div> : null}
              {a && <p className="text-[11.5px] leading-relaxed text-white/40">Ayar: {adimOzeti(a)}</p>}
            </div>
          )}
        </Kart>
      </div>
    </div>
  );
}
