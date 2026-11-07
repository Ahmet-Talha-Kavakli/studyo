"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, ChevronRight, LayoutGrid, ListChecks, Loader2, Network, Play, Plus, Search, Star, Tag, Variable, Wand2, Workflow, X } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Anahtar } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { ADIM_TURLERI, SABLON_KATEGORILERI, SABLON_SEKTORLERI, duzListe, sonrakiZaman, surumFarki, type SablonKategori, type SistemSablon } from "@/lib/build/sistemKatalog";
import { TUM_SABLONLAR } from "@/lib/build/sistemSablonlar";
import { UYGULAMALAR, uygulamaBul } from "@/lib/build/sistemUygulama";
import { cn } from "@/lib/utils";
import { ADIM_IKON, CALISMA_SINIF, DURUM_SINIF, Segment, SistemSekmeleri, TETIK_ADI, TETIK_IKON, adimOzeti, tetikOzeti, type SistemAcik } from "./ortak";
import type { Adim, Tetikleyici } from "@/lib/build/sistemKatalog";
import { SistemAyrinti } from "./Bagimlilik";
import { DegiskenPaneli } from "./Degiskenler";
import { GirdiFormu } from "./GirdiAlanlari";

type Etkin = Record<string, { onay: number; bekliyor: number; kuyrukta: number; calisiyor: number }>;
const ORNEKLER = [
  "Her sabah 08.30'da sektör haberlerini araştırıp özetlesin",
  "Sitemdeki form gelince mesajı sınıflandırıp yanıt taslağı yazsın",
  "Her pazartesi haftalık sosyal medya planı ve görseli hazırlasın",
  "Web kancasıyla sipariş gelince ekibe özet göndersin",
];

type Taslak = { ad: string; aciklama: string; tetikler: Tetikleyici[]; adimlar: Adim[]; notlar: string[] };
/** Taslak planı: tetikleyici ve adımlar sırayla, dallar girintili; kurmadan önce gözden geçirilir. */
function TaslakPlani({ t }: { t: Taslak }) {
  const Satir = ({ a, no, girinti }: { a: Adim; no: string; girinti: number }) => {
    const I = ADIM_IKON[a.tur];
    return (
      <>
        <div className="flex items-start gap-2.5 py-1.5" style={{ paddingLeft: girinti * 22 }}>
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-white/[0.06] text-white/75"><I className="h-3.5 w-3.5" /></span>
          <span className="min-w-0 flex-1"><span className="block text-[13px] text-white/90"><span className="mr-1.5 tabular-nums text-white/35">{no}</span>{a.ad}</span><span className="block truncate text-[12px] text-white/45">{adimOzeti(a)}</span></span>
        </div>
        {(a.dallar ?? []).filter((d) => d.adimlar.length > 0).map((d) => (
          <div key={d.id}>
            <p className="py-1 text-[11.5px] font-medium text-[#8be6ff]/80" style={{ paddingLeft: (girinti + 1) * 22 + 6 }}>{d.ad}</p>
            {d.adimlar.map((x, i) => <Satir key={x.id} a={x} no={`${no}.${i + 1}`} girinti={girinti + 1} />)}
          </div>
        ))}
      </>
    );
  };
  const T = TETIK_IKON[t.tetikler[0]?.tur ?? "elle"];
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2.5 rounded-[12px] bg-[#55d6fd]/[0.06] px-2.5 py-2 ring-1 ring-inset ring-[#55d6fd]/15">
        <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><T className="h-3.5 w-3.5" /></span>
        <span className="min-w-0 flex-1 truncate text-[13px] text-white/90">{t.tetikler[0] ? tetikOzeti(t.tetikler[0]) : "Elle"}</span>
      </div>
      <div className="pt-1">{t.adimlar.map((a, i) => <Satir key={a.id} a={a} no={String(i + 1)} girinti={0} />)}</div>
    </div>
  );
}

function KurKarti({ degiskenler }: { degiskenler: () => void }) {
  const router = useRouter();
  const [tarif, setTarif] = useState("");
  const [gidiyor, setGidiyor] = useState<"" | "tarif" | "bos">("");
  const [hata, setHata] = useState("");
  const [taslak, setTaslak] = useState<Taslak | null>(null);
  const [kuruluyor, setKuruluyor] = useState(false);
  const alan = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const t = alan.current; if (t) { t.style.height = "0px"; t.style.height = `${Math.min(t.scrollHeight, 180)}px`; } }, [tarif]);
  /** Tarif: önce yapay zekâ taslağı plan olarak gösterilir; model yoksa basit taslak doğrudan kurulur. Boş: boş sistem. */
  const kur = async (bos?: boolean) => {
    if (gidiyor || (!bos && !tarif.trim())) return;
    setGidiyor(bos ? "bos" : "tarif"); setHata(""); setTaslak(null);
    try {
      if (!bos) {
        const o = await api<{ taslak: Taslak | null; yapayZeka: boolean }>("/api/build/sistemler", { govde: { tarif: tarif.trim(), onizle: true } });
        if (o.taslak) { setTaslak(o.taslak); setGidiyor(""); return; }
      }
      const v = await api<{ id: string }>("/api/build/sistemler", { govde: bos ? {} : { tarif: tarif.trim() } });
      router.push(`/panel/build/sistemler/${v.id}`);
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kurulamadı."); setGidiyor(""); }
  };
  const taslagiKur = async () => {
    if (!taslak || kuruluyor) return;
    setKuruluyor(true); setHata("");
    try { const v = await api<{ id: string }>("/api/build/sistemler", { govde: { taslak } }); router.push(`/panel/build/sistemler/${v.id}`); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kurulamadı."); setKuruluyor(false); }
  };
  return (
    <Kart ikon={Wand2} baslik="Sistem kur" alt="Ne olunca ne yapılsın? Anlat; tetikleyiciyi ve adımları kuralım"
      sag={<><button type="button" onClick={degiskenler} title="Değişkenler ve sırlar" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[13px] font-medium text-white hover:bg-white/[0.13] sm:px-3.5"><Variable className="h-3.5 w-3.5" /><span className="max-sm:hidden">Değişkenler</span></button><button type="button" onClick={() => kur(true)} disabled={!!gidiyor} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[13px] font-medium text-white hover:bg-white/[0.13] disabled:opacity-50 sm:px-3.5">{gidiyor === "bos" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}<span className="max-sm:hidden">Boş sistem</span></button></>} govde="p-4 sm:p-5">
      <div className="cam-istemci rounded-[22px] p-2">
        <textarea ref={alan} value={tarif} onChange={(e) => setTarif(e.target.value)} rows={2} maxLength={2000}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); kur(); } }}
          placeholder="Örneğin: Her cuma 17.00'de haftanın satışlarını özetleyip ekibe göndersin…"
          className="block min-h-[64px] w-full resize-none bg-transparent px-3 pt-2 text-[15px] leading-relaxed text-white outline-none placeholder:text-white/35" />
        <div className="flex items-center justify-between gap-2 px-1 pb-0.5">
          <span className="truncate pl-2 text-[12px] text-white/40">Kurduktan sonra adımları tuvalde düzenlersin</span>
          <button type="button" onClick={() => kur()} disabled={!tarif.trim() || !!gidiyor} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white pl-4 pr-3 text-[14px] font-semibold text-black disabled:opacity-35">{gidiyor === "tarif" ? <><Loader2 className="h-4 w-4 animate-spin" />Kuruluyor</> : <>Kur<ArrowUp className="h-4 w-4" /></>}</button>
        </div>
      </div>
      {hata && <p className="mt-3 text-[13px] text-rose-300">{hata}</p>}
      {taslak && (
        <div className="mt-3.5 rounded-[18px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.09]">
          <div className="mb-2.5 flex flex-wrap items-start gap-2">
            <span className="min-w-[200px] flex-1"><span className="block text-[14.5px] font-semibold text-white">{taslak.ad}</span><span className="block text-[12.5px] leading-relaxed text-white/50">{taslak.aciklama}</span></span>
            <span className="flex shrink-0 gap-1.5">
              <button type="button" onClick={() => setTaslak(null)} className="inline-flex h-9 items-center rounded-full px-3 text-[12.5px] text-white/55 hover:text-white">Vazgeç</button>
              <button type="button" onClick={() => kur()} disabled={!!gidiyor || kuruluyor} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white hover:bg-white/[0.13] disabled:opacity-40">{gidiyor === "tarif" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Yeniden oluştur</button>
              <button type="button" onClick={taslagiKur} disabled={kuruluyor} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[12.5px] font-semibold text-black disabled:opacity-40">{kuruluyor && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Kur ve aç</button>
            </span>
          </div>
          <TaslakPlani t={taslak} />
          {taslak.notlar.length > 0 && (
            <div className="mt-3 space-y-1 rounded-[12px] bg-amber-400/[0.06] px-3 py-2.5 ring-1 ring-inset ring-amber-300/15">
              <p className="text-[12px] font-medium text-amber-100/85">Kurduktan sonra yapman gerekenler</p>
              {taslak.notlar.map((n) => <p key={n} className="text-[12px] leading-relaxed text-amber-100/70">{n}</p>)}
            </div>
          )}
          <p className="mt-2.5 text-[11.5px] text-white/35">Kurduğunda sistem kapalı başlar; adımları tuvalde düzenleyip denedikten sonra açarsın.</p>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">{ORNEKLER.map((o) => <button key={o} type="button" onClick={() => { setTarif(o); alan.current?.focus(); }} className="rounded-full bg-white/[0.06] px-3.5 py-1.5 text-left text-[12.5px] text-white/60 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.1] hover:text-white">{o}</button>)}</div>
    </Kart>
  );
}

function SistemSatiri({ s, e, yenile, ayrinti, yildiz, etiketSec }: { s: SistemAcik; e?: Etkin[string]; yenile: () => void; ayrinti: () => void; yildiz: () => void; etiketSec: (e: string) => void }) {
  const router = useRouter();
  const [form, setForm] = useState(false);
  const [acik, setAcik] = useState(s.durum === "acik");
  const [hata, setHata] = useState("");
  const [calisiyor, setCalisiyor] = useState(false);
  const canli = s.yayin ?? { tetikler: s.tetikler, adimlar: s.adimlar };
  const t = canli.tetikler[0] ?? s.tetikler[0];
  const T = t ? TETIK_IKON[t.tur] : Workflow;
  const sonraki = s.durum === "acik" ? canli.tetikler.flatMap((x) => (x.tur === "zaman" ? [sonrakiZaman(x.zaman)] : [])).filter((x): x is number => !!x).sort()[0] : undefined;
  const D = DURUM_SINIF[s.durum];
  const degisiklik = s.yayin ? surumFarki(s.yayin, s).length : null;
  const adimlar = duzListe(s.adimlar);
  return (
    <div className="relative flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] sm:px-5">
      <Link href={`/panel/build/sistemler/${s.id}`} className="absolute inset-0" aria-label={`${s.ad} sistemini aç`} />
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-white/[0.07] text-white/80 ring-1 ring-inset ring-white/[0.08]"><T className="h-[18px] w-[18px]" /></span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2"><span className="truncate text-[14.5px] font-semibold text-white">{s.ad}</span><span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", D.sinif, "max-sm:hidden")}>{D.ad}</span>
          {(s.etiketler ?? []).slice(0, 2).map((x) => <button key={x} type="button" onClick={() => etiketSec(x)} className="relative z-10 hidden shrink-0 items-center gap-1 rounded-full bg-violet-400/[0.1] px-2 py-0.5 text-[11px] font-medium text-violet-100 hover:bg-violet-400/[0.18] lg:inline-flex"><Tag className="h-3 w-3" />{x}</button>)}
          {(s.etiketler?.length ?? 0) > 2 && <span className="hidden shrink-0 text-[11px] text-white/40 lg:inline">ve {s.etiketler!.length - 2}</span>}
          {e?.onay ? <span className="shrink-0 rounded-full bg-amber-400/[0.12] px-2 py-0.5 text-[11px] font-medium text-amber-200">{e.onay} onay<span className="max-sm:hidden"> bekliyor</span></span> : null}
          {e?.kuyrukta ? <span className="hidden shrink-0 rounded-full bg-violet-400/[0.12] px-2 py-0.5 text-[11px] font-medium text-violet-200 sm:inline">{e.kuyrukta} kuyrukta</span> : null}
          {s.adimlar.length > 0 && (degisiklik === null ? s.durum !== "acik" : degisiklik > 0) && <span className="hidden shrink-0 text-[11.5px] text-white/40 md:inline">{degisiklik === null ? "Yayınlanmadı" : "Yayınlanmamış değişiklik"}</span>}
        </span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[12.5px] text-white/50">
          {!e?.onay && <span className={cn("shrink-0 rounded-full px-1.5 py-px text-[10.5px] font-medium sm:hidden", D.sinif)}>{D.ad}</span>}
          <span className="truncate">{t ? tetikOzeti(t) : "Tetik yok"}</span>
          <span className="shrink-0 text-white/25">·</span>
          <span className="flex shrink-0 items-center gap-0.5 max-sm:hidden">{adimlar.slice(0, 6).map((a) => { const I = ADIM_IKON[a.a.tur]; return <I key={a.a.id} className="h-3.5 w-3.5 text-white/45" />; })}</span>
          <span className="shrink-0">{adimlar.length} adım</span>
        </span>
        {hata && <span className="block text-[12px] text-rose-300">{hata}</span>}
      </span>
      <span className="hidden shrink-0 text-right text-[12px] text-white/45 md:block">
        {s.ozet.sonCalisma ? <span className="flex items-center justify-end gap-1.5"><span className={cn("h-1.5 w-1.5 rounded-full", CALISMA_SINIF[s.ozet.sonDurum ?? "durdu"].nokta)} />{CALISMA_SINIF[s.ozet.sonDurum ?? "durdu"].ad} · {gorece(s.ozet.sonCalisma)}</span> : "Henüz çalışmadı"}
        {sonraki ? <span className="block text-white/35">Sonraki: {new Date(sonraki).toLocaleString("tr-TR", { weekday: "short", hour: "2-digit", minute: "2-digit" })}</span> : null}
      </span>
      {s.durum === "acik" && t?.tur === "elle" && (
        <button type="button" title={t.form && s.girdi?.length ? "Girdi formuyla çalıştır" : "Yayındaki sürümü şimdi çalıştır"} disabled={calisiyor} onClick={() => { if (t.tur === "elle" && t.form && s.girdi?.length) { setForm(true); return; } calistir({}).catch(() => {}); }}
          className="relative z-10 hidden h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-white/85 hover:bg-white/[0.12] sm:inline-flex">{calisiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}Çalıştır</button>
      )}
      <button type="button" onClick={ayrinti} title="Ayrıntı ve bağımlılıklar" aria-label="Ayrıntı ve bağımlılıklar" className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.07] hover:text-white max-sm:-mr-1"><Network className="h-4 w-4" /></button>
      <button type="button" onClick={yildiz} aria-label={s.yildiz ? "Yıldızı kaldır" : "Yıldızla"} title={s.yildiz ? "Yıldızı kaldır" : "Yıldızla"} className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/[0.07]", s.yildiz ? "text-amber-300" : "text-white/35 hover:text-white")}><Star className={cn("h-4 w-4", s.yildiz && "fill-current")} /></button>
      <span className="relative z-10 shrink-0" title={acik ? "Kapat" : "Aç"}>
        <Anahtar acik={acik} etiket={`${s.ad} açık`} set={async (v) => { if (v && !s.yayin) { router.push(`/panel/build/sistemler/${s.id}`); return; } setAcik(v); setHata(""); try { await api(`/api/build/sistemler/${s.id}`, { method: "PATCH", govde: { durum: v ? "acik" : "taslak" } }); yenile(); } catch (x) { setAcik(!v); setHata(x instanceof ApiHatasi ? x.message : "Değiştirilemedi."); } }} />
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-white/30 max-sm:hidden" />
      <GirdiFormu acik={form} kapat={() => setForm(false)} alanlar={s.girdi ?? []} baslik={s.ad} alt="Yayındaki sürüm bu değerlerle çalışır" gonder={(v) => calistir(v)} />
    </div>
  );
  async function calistir(veri: Record<string, unknown>) {
    setCalisiyor(true); setHata("");
    try { const v = await api<{ calisma: { id: string } | null }>(`/api/build/sistemler/${s.id}/calistir`, { govde: { kaynak: "canli", veri } }); if (v.calisma) router.push(`/panel/build/sistemler/${s.id}/calisma/${v.calisma.id}`); else yenile(); }
    catch (x) { const m = x instanceof ApiHatasi ? x.message : "Çalıştırılamadı."; setHata(m); throw new Error(m); } finally { setCalisiyor(false); }
  }
}

/** Şablonun kullandığı servislerin gerçek logoları (uygulama adımları ve ödeme tetiği). */
const LOGO_ADI: Record<string, string> = { "/marka/baglanti/iyzico.svg": "iyzico", "/marka/baglanti/paytr.svg": "PayTR", "/marka/baglanti/trendyol.svg": "Trendyol", "/marka/whatsapp.svg": "WhatsApp" };
function sablonServisleri(s: SistemSablon): { id: string; ad: string; logo: string; koyu?: boolean }[] {
  const l: { id: string; ad: string; logo: string; koyu?: boolean }[] = duzListe(s.adimlar).map((x) => (x.a.tur === "uygulama" ? uygulamaBul(x.a.ayar.servis) : undefined)).filter((u): u is NonNullable<typeof u> => !!u).map((u) => ({ id: u.id, ad: u.ad, logo: u.logo, koyu: u.koyu }));
  if (s.logo) { const u = UYGULAMALAR.find((x) => x.logo === s.logo); l.unshift(u ? { id: u.id, ad: u.ad, logo: u.logo } : { id: s.logo, ad: LOGO_ADI[s.logo] ?? "Servis", logo: s.logo }); }
  return [...new Map(l.map((x) => [x.id, x])).values()];
}
const GRUP_TON: Record<string, string> = { ai: "bg-[#55d6fd]/[0.14] text-[#8be6ff]", eylem: "bg-white/[0.09] text-white/85", akis: "bg-violet-400/[0.15] text-violet-200", veri: "bg-amber-400/[0.14] text-amber-200" };
/** Akışın mekanizması: tetik, adımlar (servis adımlarında gerçek logo) ve aradaki çizgi. */
function AkisSeridi({ s }: { s: SistemSablon }) {
  const T = TETIK_IKON[s.tetik.tur];
  const ad = duzListe(s.adimlar).filter((x) => x.derinlik === 0 || x.a.tur === "uygulama");
  const gorunen = ad.slice(0, 5);
  return (
    <div className="flex items-center">
      <span title={TETIK_ADI[s.tetik.tur]} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#55d6fd]/[0.16] text-[#8be6ff] ring-1 ring-inset ring-[#55d6fd]/25"><T className="h-5 w-5" /></span>
      {gorunen.map((x, i) => {
        const u = x.a.tur === "uygulama" ? uygulamaBul(x.a.ayar.servis) : undefined;
        const I = ADIM_IKON[x.a.tur];
        return (
          <span key={x.a.id} className="flex items-center">
            <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.04 * i, duration: 0.25 }} className="h-px w-3 origin-left bg-white/20 sm:w-4" />
            {u ? <span title={u.ad} className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] p-1.5", u.koyu ? "bg-black ring-1 ring-inset ring-white/15" : "bg-white")}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={u.logo} alt={u.ad} className="max-h-full max-w-full object-contain" /></span>
              : <span title={ADIM_TURLERI.find((y) => y.tur === x.a.tur)?.ad} className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]", GRUP_TON[ADIM_TURLERI.find((y) => y.tur === x.a.tur)?.grup ?? "eylem"])}><I className="h-4 w-4" /></span>}
          </span>
        );
      })}
      {ad.length > gorunen.length && <span className="ml-2 shrink-0 rounded-full bg-white/[0.07] px-2 py-0.5 text-[11px] tabular-nums text-white/60">{ad.length - gorunen.length} adım daha</span>}
    </div>
  );
}

function HazirSistemler() {
  const router = useRouter();
  const [gidiyor, setGidiyor] = useState<string | null>(null);
  const [kat, setKat] = useState<"hepsi" | SablonKategori>("hepsi");
  const [sektor, setSektor] = useState<string | null>(null);
  const [servis, setServis] = useState<string | null>(null);
  const [ara, setAra] = useState("");
  const [sinir, setSinir] = useState(12);
  const [acik, setAcik] = useState<string | null>(null);
  const q = ara.trim().toLocaleLowerCase("tr");
  const l = useMemo(() => TUM_SABLONLAR.filter((s) => (kat === "hepsi" || s.kategori === kat) && (!sektor || s.sektor?.includes(sektor)) && (!servis || sablonServisleri(s).some((x) => x.id === servis))
    && (!q || `${s.ad} ${s.aciklama} ${sablonServisleri(s).map((x) => x.ad).join(" ")} ${TETIK_ADI[s.tetik.tur]}`.toLocaleLowerCase("tr").includes(q))), [kat, sektor, servis, q]);
  useEffect(() => setSinir(12), [kat, sektor, servis, q]);
  const kullanilan = useMemo(() => { const m = new Map<string, number>(); for (const s of TUM_SABLONLAR) for (const x of sablonServisleri(s)) m.set(x.id, (m.get(x.id) ?? 0) + 1); return UYGULAMALAR.filter((u) => m.has(u.id)).sort((a, b) => (m.get(b.id) ?? 0) - (m.get(a.id) ?? 0)); }, []);
  const kur = async (id: string) => { setGidiyor(id); try { const v = await api<{ id: string }>("/api/build/sistemler", { govde: { sablon: id } }); router.push(`/panel/build/sistemler/${v.id}`); } catch { setGidiyor(null); } };
  const temizle = () => { setKat("hepsi"); setSektor(null); setServis(null); setAra(""); };
  return (
    <div id="hazir" className="scroll-mt-6">
      <Kart ikon={LayoutGrid} baslik={<span className="flex items-center gap-2">Hazır sistemler<span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[12px] font-medium tabular-nums text-white/70">{TUM_SABLONLAR.length}</span></span>} alt="İşine ve sektörüne göre kur; projeni, sırlarını ve kanallarını bağla" govde="p-4 sm:p-5">
        <div className="mb-4 space-y-3">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <label className="cam-istemci flex h-10 min-w-0 items-center gap-2 rounded-full px-3.5 lg:w-[340px]"><Search className="h-4 w-4 shrink-0 text-white/45" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ara: sipariş, randevu, Slack, fatura" className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/40" />{ara && <button type="button" onClick={() => setAra("")} aria-label="Aramayı temizle" className="flex h-6 w-6 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.08]"><X className="h-3.5 w-3.5" /></button>}</label>
            <div className="min-w-0 flex-1"><Segment id="sablon-kat" kucuk deger={kat} set={setKat} l={[{ id: "hepsi", ad: "Tümü" }, ...SABLON_KATEGORILERI.map((k) => ({ id: k.id, ad: k.ad }))]} /></div>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
            {SABLON_SEKTORLERI.map((x) => { const on = sektor === x.id; return <button key={x.id} type="button" onClick={() => setSektor(on ? null : x.id)} className={cn("h-8 shrink-0 rounded-full px-3 text-[12.5px] transition", on ? "bg-white/[0.1] text-white ring-2 ring-inset ring-white" : "bg-white/[0.04] text-white/65 ring-1 ring-inset ring-white/[0.08] hover:text-white")}>{x.ad}</button>; })}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
            {kullanilan.map((u) => { const on = servis === u.id; return (
              <button key={u.id} type="button" onClick={() => setServis(on ? null : u.id)} title={u.ad} className={cn("flex h-9 shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[12.5px] transition", on ? "bg-white/[0.1] text-white ring-2 ring-inset ring-white" : "bg-white/[0.04] text-white/70 ring-1 ring-inset ring-white/[0.08] hover:text-white")}>
                <span className={cn("flex h-7 w-7 items-center justify-center rounded-full p-1", u.koyu ? "bg-black ring-1 ring-inset ring-white/15" : "bg-white")}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={u.logo} alt="" className="max-h-full max-w-full object-contain" /></span>{u.ad}
              </button>
            ); })}
          </div>
        </div>
        {!l.length ? (
          <div className="flex flex-col gap-3 rounded-[20px] bg-white/[0.02] p-4 ring-1 ring-inset ring-white/[0.06] sm:flex-row sm:items-center">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.06] text-white/60"><Search className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1"><p className="text-[14px] font-semibold text-white">Bu süzgece uyan hazır sistem yok</p><p className="text-[12.5px] text-white/50">Süzgeçleri gevşet ya da yukarıdaki kutuya ne istediğini yazıp yapay zekâyla kur.</p></div>
            <button type="button" onClick={temizle} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] text-white hover:bg-white/[0.13]"><X className="h-3.5 w-3.5" />Süzgeçleri temizle</button>
          </div>
        ) : (<>
          <p className="mb-3 text-[12.5px] text-white/45">{l.length} hazır sistem{kat !== "hepsi" || sektor || servis || q ? " bu süzgece uyuyor" : ""}</p>
          <motion.div layout className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence initial={false} mode="popLayout">
              {l.slice(0, sinir).map((s) => { const ad = duzListe(s.adimlar); const sv = sablonServisleri(s); const ac = acik === s.id; return (
                <motion.div key={s.id} layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="group flex flex-col overflow-hidden rounded-[22px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] transition hover:ring-white/[0.14]">
                  <div className="relative flex h-[104px] items-center overflow-hidden px-4 [background-image:radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:14px_14px]">
                    {s.kapak && <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={s.kapak} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-25 transition-transform duration-500 group-hover:scale-[1.04]" /><span className="absolute inset-0 bg-gradient-to-r from-[#121315] via-[#121315]/70 to-transparent" /></>}
                    <div className="relative min-w-0"><AkisSeridi s={s} /></div>
                  </div>
                  <div className="flex flex-1 flex-col p-4 pt-3">
                    <p className="truncate text-[11.5px] text-white/45">{[SABLON_KATEGORILERI.find((k) => k.id === s.kategori)?.ad, TETIK_ADI[s.tetik.tur], sv.map((x) => x.ad).join(", ")].filter(Boolean).join(" · ")}</p>
                    <p className="mt-1 text-[15px] font-semibold leading-snug text-white">{s.ad}</p>
                    <p className="mt-1 line-clamp-2 min-h-[38px] text-[13px] leading-[1.45] text-white/55">{s.aciklama}</p>
                    <AnimatePresence initial={false}>
                      {ac && s.kurulum?.length ? (
                        <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-2 space-y-1 overflow-hidden">
                          {s.kurulum.map((x, i) => <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-white/60"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#55d6fd]" />{x}</li>)}
                        </motion.ul>
                      ) : null}
                    </AnimatePresence>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                      {s.kurulum?.length ? <button type="button" onClick={() => setAcik(ac ? null : s.id)} className="flex min-w-0 items-center gap-1.5 rounded-full px-1 text-[12px] text-white/50 hover:text-white"><ListChecks className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{ac ? "Kurulumu gizle" : `Kurulumda ${s.kurulum.length} ayar`}</span></button> : <span className="text-[12px] text-white/45">{ad.length} adım, hazır</span>}
                      <motion.button whileTap={{ scale: 0.96 }} type="button" disabled={!!gidiyor} onClick={() => kur(s.id)} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-black disabled:opacity-60">{gidiyor === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}Kur</motion.button>
                    </div>
                  </div>
                </motion.div>
              ); })}
            </AnimatePresence>
          </motion.div>
          {l.length > sinir && <div className="mt-4 flex justify-center"><button type="button" onClick={() => setSinir((x) => x + 12)} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/[0.07] px-5 text-[13.5px] text-white hover:bg-white/[0.12]">Daha fazla göster<span className="tabular-nums text-white/50">{l.length - sinir}</span></button></div>}
        </>)}
      </Kart>
    </div>
  );
}

/** Sistemler sayfası: sekmeler, anlatarak kur, sistemlerin (aç/kapat, son çalışma, sonraki zaman), hazır sistemler. */
type Suzgec = "hepsi" | "acik" | "kapali" | "hatali" | "yildiz";
export function SistemListesi() {
  const [l, setL] = useState<SistemAcik[] | null>(null);
  const [etkin, setEtkin] = useState<Etkin>({});
  const [ara, setAra] = useState("");
  const [suzgec, setSuzgec] = useState<Suzgec>("hepsi");
  const [etiket, setEtiket] = useState<string | null>(null);
  const [ayrinti, setAyrinti] = useState<string | null>(null);
  const [degiskenAcik, setDegiskenAcik] = useState(false);
  const yenile = () => { api<{ sistemler: SistemAcik[]; etkin: Etkin }>("/api/build/sistemler").then((v) => { setL(v.sistemler); setEtkin(v.etkin ?? {}); }).catch(() => setL([])); };
  useEffect(yenile, []);
  useEffect(() => { if (new URLSearchParams(location.search).get("degiskenler")) setDegiskenAcik(true); }, []);
  const guncelle = (id: string, p: Partial<SistemAcik>) => {
    setL((x) => x?.map((y) => (y.id === id ? { ...y, ...p } : y)) ?? x);
    api(`/api/build/sistemler/${id}`, { method: "PATCH", govde: p }).catch(() => yenile());
  };
  const onay = Object.values(etkin).reduce((t, x) => t + x.onay, 0);
  const hatali = (l ?? []).filter((s) => s.ozet.sonDurum === "basarisiz" || s.durum === "duraklatildi").length;
  const etiketler = useMemo(() => { const m = new Map<string, number>(); for (const s of l ?? []) for (const e of s.etiketler ?? []) m.set(e, (m.get(e) ?? 0) + 1); return [...m.entries()].sort((a, b) => b[1] - a[1]); }, [l]);
  const q = ara.trim().toLocaleLowerCase("tr");
  const gorunen = useMemo(() => (l ?? []).filter((s) => {
    if (suzgec === "acik" && s.durum !== "acik") return false;
    if (suzgec === "kapali" && s.durum === "acik") return false;
    if (suzgec === "hatali" && s.ozet.sonDurum !== "basarisiz" && s.durum !== "duraklatildi") return false;
    if (suzgec === "yildiz" && !s.yildiz) return false;
    if (etiket && !(s.etiketler ?? []).includes(etiket)) return false;
    if (q && !`${s.ad} ${s.aciklama} ${(s.etiketler ?? []).join(" ")} ${s.tetikler.map((t) => TETIK_ADI[t.tur]).join(" ")}`.toLocaleLowerCase("tr").includes(q)) return false;
    return true;
  }).sort((a, b) => Number(!!b.yildiz) - Number(!!a.yildiz) || b.guncelleme - a.guncelleme), [l, suzgec, etiket, q]);
  const sayi = (x: Suzgec) => (l ?? []).filter((s) => x === "hepsi" || (x === "acik" ? s.durum === "acik" : x === "kapali" ? s.durum !== "acik" : x === "hatali" ? s.ozet.sonDurum === "basarisiz" || s.durum === "duraklatildi" : !!s.yildiz)).length;
  const secili = l?.find((s) => s.id === ayrinti) ?? null;
  return (
    <div className="mx-auto max-w-[1320px] space-y-5 px-4 pb-24 pt-16 sm:px-6 md:pt-8">
      <SistemSekmeleri sayilar={{ onay, hata: hatali }} />
      <KurKarti degiskenler={() => setDegiskenAcik(true)} />
      {l === null ? <div className="h-[140px] animate-pulse rounded-[26px] bg-white/[0.03]" /> : l.length > 0 && (
        <Kart ikon={Workflow} baslik={<span className="flex items-center gap-2">Sistemlerin<span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[12px] font-medium tabular-nums text-white/70">{l.length}</span></span>} alt={`${l.filter((s) => s.durum === "acik").length} açık${onay ? ` · ${onay} onay bekliyor` : ""}`}>
          <div className="space-y-3 border-b border-white/[0.05] px-4 py-3 sm:px-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <label className="cam-istemci flex h-10 min-w-0 items-center gap-2 rounded-full px-3.5 md:w-[320px]"><Search className="h-4 w-4 shrink-0 text-white/45" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Sistem, açıklama ya da etiket ara" className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/40" />{ara && <button type="button" onClick={() => setAra("")} aria-label="Aramayı temizle" className="flex h-6 w-6 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.08]"><X className="h-3.5 w-3.5" /></button>}</label>
              <Segment id="sistem-suzgec" kucuk deger={suzgec} set={setSuzgec} l={[{ id: "hepsi", ad: `Tümü ${sayi("hepsi")}` }, { id: "acik", ad: `Açık ${sayi("acik")}` }, { id: "kapali", ad: `Kapalı ${sayi("kapali")}` }, { id: "hatali", ad: `Hata veren ${sayi("hatali")}` }, { id: "yildiz", ad: `Yıldızlı ${sayi("yildiz")}` }]} />
            </div>
            {etiketler.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
                <button type="button" onClick={() => setEtiket(null)} className={cn("flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12px] transition", !etiket ? "bg-white/[0.08] text-white ring-2 ring-inset ring-white" : "bg-white/[0.03] text-white/60 ring-1 ring-inset ring-white/[0.08] hover:text-white")}>Tüm etiketler</button>
                {etiketler.map(([e, n]) => <button key={e} type="button" onClick={() => setEtiket(etiket === e ? null : e)} className={cn("flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12px] transition", etiket === e ? "bg-violet-400/[0.14] text-violet-50 ring-2 ring-inset ring-white" : "bg-violet-400/[0.07] text-violet-100/80 ring-1 ring-inset ring-violet-300/15 hover:text-white")}><Tag className="h-3 w-3" />{e}<span className="tabular-nums text-white/45">{n}</span></button>)}
              </div>
            )}
          </div>
          {gorunen.length ? (
            <motion.div layout className="divide-y divide-white/[0.05]">
              <AnimatePresence initial={false}>{gorunen.map((s) => <motion.div key={s.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><SistemSatiri s={s} e={etkin[s.id]} yenile={yenile} ayrinti={() => setAyrinti(s.id)} yildiz={() => guncelle(s.id, { yildiz: !s.yildiz })} etiketSec={(x) => setEtiket(x)} /></motion.div>)}</AnimatePresence>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.06] text-white/60"><Search className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1"><p className="text-[14px] font-semibold text-white">Bu süzgece uyan sistem yok</p><p className="text-[12.5px] text-white/50">Aramayı ya da süzgeci değiştir.</p></div>
              <button type="button" onClick={() => { setAra(""); setSuzgec("hepsi"); setEtiket(null); }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] text-white hover:bg-white/[0.13]"><X className="h-3.5 w-3.5" />Süzgeçleri temizle</button>
            </div>
          )}
        </Kart>
      )}
      <HazirSistemler />
      <SistemAyrinti s={secili} tum={l ?? []} kapat={() => setAyrinti(null)} guncelle={(p) => secili && guncelle(secili.id, p)} />
      <DegiskenPaneli acik={degiskenAcik} kapat={() => setDegiskenAcik(false)} />
    </div>
  );
}
