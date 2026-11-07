"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CalendarClock, CheckCircle2, Loader2, MessageSquare, MoreHorizontal, Pause, Pencil, Play, Plus, Trash2, XCircle } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { ModelSecici } from "@/components/build/ModelSecici";
import { api, gorece } from "@/lib/build/istemci";
import { VARSAYILAN_MODEL } from "@/lib/build/modeller";
import { GUNLER, sonrakiZamanlar, zamanMetni, type Zamanlama } from "@/lib/build/sistemKatalog";
import { GOREV_SABLONLARI, GOREV_SINIRI, KALIPLAR, formYap, zamanlamaYap, type GorevFormu, type GorevSablonu } from "@/lib/build/sohbetGorevOrtak";
import { cn } from "@/lib/utils";
import { Acilir, MenuSatir, SagPanel, useAcilir, Secici } from "./ortak";
import { IzlemeListesi } from "./Izlemeler";

export type Gorev = {
  id: string; sohbet: string; ad: string; istem: string; zaman: Zamanlama; model: string; okunmamis: number; sablon?: string;
  durum: "acik" | "duraklatildi" | "taslak" | "yok"; aciklama: string; sonraki?: number; calisma: number; basarili: number; basarisiz: number; sonCalisma?: number; sonDurum?: string; calisiyor: boolean; sohbetBaslik?: string;
};
const bugun = () => { const d = new Date(Date.now() + 3 * 3600_000); return d.toISOString().slice(0, 10); };
const tarihSaat = (t: number) => new Date(t).toLocaleString("tr-TR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/**
 * Görev paneli: ad, ne yapılacağı, ne zaman (Bir kez, Her gün, Hafta içi, Haftalık, Aylık, Özel cron), model;
 * sonraki üç çalışma canlı gösterilir. Yeni görevde sohbet verilirse sonuçlar o sohbete düşer.
 */
export function GorevPaneli({ acik, kapat, gorev, ilk, sohbet, model: ilkModel, bitti }: {
  acik: boolean; kapat: () => void; gorev?: Gorev | null; ilk?: { ad?: string; istem?: string; sablon?: GorevSablonu }; sohbet?: string; model?: string; bitti?: (g: { id: string; sohbet: string }) => void;
}) {
  const [ad, setAd] = useState("");
  const [istem, setIstem] = useState("");
  const [form, setForm] = useState<GorevFormu>({ kalip: "gunluk", saat: "09:00", gunler: [1], ayGunu: 1, tarih: bugun(), cron: "0 9 * * 1" });
  const [model, setModel] = useState(VARSAYILAN_MODEL);
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  const [baglantilar, setBaglantilar] = useState<Record<string, string | null>>();
  useEffect(() => {
    if (!acik) return;
    setHata("");
    fetch("/api/build/modeller").then((r) => r.json()).then((v) => setBaglantilar(v.baglantilar)).catch(() => {});
    if (gorev) { setAd(gorev.ad); setIstem(gorev.istem); setForm({ ...formYap(gorev.zaman), tarih: gorev.zaman.baslangic ?? bugun(), cron: gorev.zaman.cron ?? "0 9 * * 1" }); setModel(gorev.model); return; }
    const s = ilk?.sablon;
    setAd(s?.ad ?? ilk?.ad ?? ""); setIstem(s?.istem ?? ilk?.istem ?? "");
    setForm({ kalip: s?.form.kalip ?? "gunluk", saat: s?.form.saat ?? "09:00", gunler: s?.form.gunler ?? [1], ayGunu: s?.form.ayGunu ?? 1, tarih: bugun(), cron: "0 9 * * 1" });
    setModel(ilkModel ?? VARSAYILAN_MODEL);
  }, [acik, gorev, ilk, ilkModel]);
  const zaman = useMemo(() => zamanlamaYap(form), [form]);
  const sonraki = useMemo(() => sonrakiZamanlar(zaman, 3), [zaman]);
  const kaydet = async () => {
    if (!ad.trim() || !istem.trim()) { setHata("Görevin adını ve ne yapılacağını yaz."); return; }
    if (!sonraki.length) { setHata("Bu zamanlamayla görev hiç çalışmaz; tarihi ve saati kontrol et."); return; }
    setGidiyor(true); setHata("");
    try {
      if (gorev) { await api(`/api/build/sohbet/gorev/${gorev.id}`, { method: "PATCH", govde: { ad, istem, zaman, model } }); bitti?.({ id: gorev.id, sohbet: gorev.sohbet }); }
      else { const v = await api<{ gorev: { id: string; sohbet: string } }>("/api/build/sohbet/gorev", { govde: { ad, istem, zaman, model, sohbet, sablon: ilk?.sablon?.id } }); bitti?.(v.gorev); }
      kapat();
    } catch (e) { setHata(e instanceof Error ? e.message : "Kaydedilemedi."); } finally { setGidiyor(false); }
  };
  const satir = "flex items-center gap-3 border-t border-white/[0.06] px-4 py-3 first:border-0";
  return (
    <SagPanel acik={acik} kapat={kapat} baslik={gorev ? "Görevi düzenle" : "Zamanlanmış görev"} alt={sohbet && !gorev ? "Sonuçlar bu sohbete düşer" : "Sonuçlar görevin sohbetine düşer"} ikon={<CalendarClock className="h-[18px] w-[18px]" />} genislik={560}
      alt2={<>
        {hata && <p className="flex items-center gap-1.5 text-[12.5px] text-rose-300"><AlertTriangle className="h-3.5 w-3.5" />{hata}</p>}
        <span className="ml-auto" />
        <button type="button" onClick={kapat} className="h-10 rounded-full px-4 text-[13px] text-white/70 hover:bg-white/[0.06]">Vazgeç</button>
        <button type="button" onClick={kaydet} disabled={gidiyor} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black disabled:opacity-50">{gidiyor && <Loader2 className="h-4 w-4 animate-spin" />}{gorev ? "Kaydet" : "Görevi kur"}</button>
      </>}>
      <div className="space-y-4">
        <div className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
          <label className={satir}><span className="w-24 shrink-0 text-[13px] text-white/55">Ad</span><input value={ad} onChange={(e) => setAd(e.target.value)} maxLength={80} placeholder="Örneğin: Sabah haber özeti" autoComplete="off" name="gorev-adi" className="min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/40" /></label>
          <label className={cn(satir, "items-start")}><span className="w-24 shrink-0 pt-0.5 text-[13px] text-white/55">Ne yapılsın</span><textarea value={istem} onChange={(e) => setIstem(e.target.value)} rows={4} maxLength={6000} placeholder="Her çalışmada Vayra'ya verilecek istek. Kendi başına anlaşılır yaz." className="min-w-0 flex-1 resize-y bg-transparent text-[14px] leading-relaxed text-white outline-none placeholder:text-white/40" /></label>
          <div className={satir}><span className="w-24 shrink-0 text-[13px] text-white/55">Model</span><ModelSecici deger={model} sec={setModel} baglantilar={baglantilar} ayrinti /></div>
        </div>
        <div>
          <p className="mb-2 text-[13px] font-medium text-white/75">Ne zaman</p>
          <div className="flex flex-wrap gap-1.5">
            {KALIPLAR.map((k) => <button key={k.id} type="button" onClick={() => setForm({ ...form, kalip: k.id })} className={cn("h-9 rounded-full px-3.5 text-[13px] transition-colors", form.kalip === k.id ? "bg-white text-black" : "bg-white/[0.06] text-white/75 hover:text-white")}>{k.ad}</button>)}
          </div>
          <div className="mt-3 overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
            {form.kalip === "bir-kez" && <label className={satir}><span className="w-24 shrink-0 text-[13px] text-white/55">Tarih</span><input type="date" value={form.tarih} min={bugun()} onChange={(e) => setForm({ ...form, tarih: e.target.value })} className="bg-transparent text-[14px] text-white outline-none [color-scheme:dark]" /></label>}
            {form.kalip === "haftalik" && (
              <div className={satir}><span className="w-24 shrink-0 text-[13px] text-white/55">Günler</span>
                <div className="flex flex-wrap gap-1">{GUNLER.map((g, i) => { const n = i + 1, on = form.gunler.includes(n); return <button key={g} type="button" onClick={() => setForm({ ...form, gunler: on ? form.gunler.filter((x) => x !== n) : [...form.gunler, n].sort() })} className={cn("h-8 w-11 rounded-full text-[12.5px]", on ? "bg-white text-black" : "bg-white/[0.06] text-white/70")}>{g}</button>; })}</div>
              </div>
            )}
            {form.kalip === "aylik" && <label className={satir}><span className="w-24 shrink-0 text-[13px] text-white/55">Ayın günü</span><input type="number" min={1} max={31} value={form.ayGunu === 32 ? "" : form.ayGunu} disabled={form.ayGunu === 32} onChange={(e) => setForm({ ...form, ayGunu: Math.min(31, Math.max(1, Number(e.target.value) || 1)) })} className="w-16 rounded-[8px] bg-white/[0.06] px-2 py-1 text-[14px] text-white outline-none disabled:opacity-40" /><button type="button" onClick={() => setForm({ ...form, ayGunu: form.ayGunu === 32 ? 1 : 32 })} className={cn("h-8 rounded-full px-3 text-[12.5px]", form.ayGunu === 32 ? "bg-white text-black" : "bg-white/[0.06] text-white/70")}>Ayın son günü</button></label>}
            {form.kalip === "ozel" ? (
              <label className={satir}><span className="w-24 shrink-0 text-[13px] text-white/55">Cron</span><input value={form.cron} onChange={(e) => setForm({ ...form, cron: e.target.value })} placeholder="0 9 * * 1" className="sc-kod min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none" /><span className="text-[11.5px] text-white/40">dakika saat gün ay haftagünü</span></label>
            ) : (
              <label className={satir}><span className="w-24 shrink-0 text-[13px] text-white/55">Saat</span><input type="time" value={form.saat} onChange={(e) => setForm({ ...form, saat: e.target.value })} className="bg-transparent text-[14px] text-white outline-none [color-scheme:dark]" /><span className="text-[12px] text-white/40">Türkiye saati</span></label>
            )}
          </div>
        </div>
        <div className="rounded-[18px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.06]">
          <p className="text-[13px] font-medium text-white">{zamanMetni(zaman)}</p>
          {sonraki.length ? <ul className="mt-1.5 space-y-0.5 text-[12.5px] text-white/55">{sonraki.map((t) => <li key={t}>{tarihSaat(t)}</li>)}</ul> : <p className="mt-1 text-[12.5px] text-amber-200/80">Bu zamanlamayla görev hiç çalışmayacak.</p>}
          <p className="mt-2 text-[12px] leading-relaxed text-white/40">Her çalışma, seçtiğin modelin kredisini harcar. En çok {GOREV_SINIRI} görev aynı anda etkin olabilir; görevler Sistemler sayfasında da görünür.</p>
        </div>
      </div>
    </SagPanel>
  );
}

function GorevMenu({ g, degisti, duzenle }: { g: Gorev; degisti: () => void; duzenle: () => void }) {
  const a = useAcilir(240);
  const [sil, setSil] = useState(false);
  useEffect(() => { if (!a.acik) setSil(false); }, [a.acik]);
  return (
    <div ref={a.kok}>
      <button type="button" onClick={() => a.setAcik(!a.acik)} aria-label="Görev menüsü" className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.08] hover:text-white"><MoreHorizontal className="h-4 w-4" /></button>
      <Acilir a={a}>
        <MenuSatir ikon={<Pencil className="h-4 w-4" />} ad="Düzenle" onClick={() => { a.setAcik(false); duzenle(); }} />
        <MenuSatir ikon={<MessageSquare className="h-4 w-4" />} ad="Sohbete git" alt={g.sohbetBaslik} onClick={() => { location.href = `/panel/build/sohbet/${g.sohbet}`; }} />
        <div className="my-1 h-px bg-white/[0.07]" />
        <MenuSatir tehlike secili={sil} ikon={<Trash2 className="h-4 w-4" />} ad={sil ? "Silmek için tekrar tıkla" : "Sil"} alt={sil ? "Sohbet ve geçmiş sonuçlar kalır" : undefined} onClick={async () => { if (!sil) { setSil(true); return; } a.setAcik(false); await api(`/api/build/sohbet/gorev/${g.id}`, { method: "DELETE" }).catch(() => {}); degisti(); }} />
      </Acilir>
    </div>
  );
}

/** Zamanlanmış görevler sayfası (ChatGPT Scheduled, Gemini Schedules gibi): liste, durum, sonraki çalışma, hazır görevler. */
export function GorevlerSayfasi() {
  const [l, setL] = useState<Gorev[] | null>(null);
  const [panel, setPanel] = useState<{ gorev?: Gorev | null; sablon?: GorevSablonu } | null>(null);
  const [filtre, setFiltre] = useState<"hepsi" | "acik" | "duraklatildi">("hepsi");
  const [islem, setIslem] = useState("");
  const [hata, setHata] = useState("");
  const yenile = useCallback(() => api<{ gorevler: Gorev[] }>("/api/build/sohbet/gorev").then((v) => setL(v.gorevler)).catch(() => setL([])), []);
  useEffect(() => { yenile(); }, [yenile]);
  useEffect(() => { if (!l?.some((g) => g.calisiyor)) return; const t = setTimeout(yenile, 4000); return () => clearTimeout(t); }, [l, yenile]);
  const durumDegis = async (g: Gorev) => { setIslem(g.id); await api(`/api/build/sohbet/gorev/${g.id}`, { method: "PATCH", govde: { durum: g.durum === "acik" ? "duraklatildi" : "acik" } }).then(() => setHata("")).catch((e) => setHata(e instanceof Error ? e.message : "Değiştirilemedi.")); await yenile(); setIslem(""); };
  const calistir = async (g: Gorev) => { setIslem(`c-${g.id}`); await api(`/api/build/sohbet/gorev/${g.id}/calistir`, { govde: {} }).catch(() => {}); setTimeout(() => { yenile(); setIslem(""); }, 1500); };
  const gorunen = (l ?? []).filter((g) => filtre === "hepsi" || g.durum === filtre);
  const etkin = (l ?? []).filter((g) => g.durum === "acik").length;
  // Sekme: zamanlanmış görevler ya da izleme (koşul olunca bildir). ?sekme=izleme&yeni=1 doğrudan izleme panelini açar.
  const [sekme, setSekme] = useState<"gorev" | "izleme">("gorev");
  const [yeniIzleme, setYeniIzleme] = useState(false);
  useEffect(() => { const p = new URLSearchParams(location.search); if (p.get("sekme") === "izleme") setSekme("izleme"); if (p.get("yeni") === "1") setYeniIzleme(true); }, []);
  const sekmeSec = (v: "gorev" | "izleme") => { setSekme(v); setYeniIzleme(false); history.replaceState(null, "", v === "izleme" ? "?sekme=izleme" : location.pathname); };
  return (
    <div className="mx-auto max-w-[1100px] space-y-5 px-4 pb-24 pt-16 sm:px-6 md:pt-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-white">Görevler</h1>
        <Secici id="gorev-sekme" deger={sekme} set={sekmeSec} l={[{ id: "gorev", ad: "Zamanlanmış" }, { id: "izleme", ad: "İzleme" }]} />
        <span className="min-w-[200px] flex-1 text-right text-[12.5px] text-white/45 max-sm:hidden">{sekme === "gorev" ? "Belirlediğin zamanda çalışır" : "Koşul gerçekleşince haber verir"}</span>
      </div>
      {sekme === "izleme" ? <IzlemeListesi yeniAc={yeniIzleme} /> : <>
      <Kart ikon={CalendarClock} baslik={<span className="flex items-center gap-2">Zamanlanmış görevler{l && <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[12px] font-medium tabular-nums text-white/65">{etkin} / {GOREV_SINIRI}<span className="max-sm:hidden"> etkin</span></span>}</span>}
        alt="Vayra belirlediğin zamanda çalışır, sonucu görevin sohbetine bırakır" govde=""
        sag={<>
          {l && l.length > 0 && <span className="max-sm:hidden"><Secici id="gorev-filtre" deger={filtre} set={setFiltre} l={[{ id: "hepsi", ad: "Tümü" }, { id: "acik", ad: "Etkin" }, { id: "duraklatildi", ad: "Duraklatılan" }]} /></span>}
          <button type="button" onClick={() => setPanel({})} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black max-sm:w-9 max-sm:justify-center max-sm:px-0"><Plus className="h-4 w-4" /><span className="max-sm:hidden">Yeni görev</span></button>
        </>}>
        {hata && <p className="flex items-center gap-2 border-b border-white/[0.06] bg-rose-500/[0.07] px-5 py-2.5 text-[13px] text-rose-200"><AlertTriangle className="h-4 w-4" />{hata}</p>}
        {l === null ? <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-[14px] bg-white/[0.03]" />)}</div>
          : !l.length ? (
            <div className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-3 rounded-[18px] bg-white/[0.035] p-4 ring-1 ring-inset ring-white/[0.06]">
                <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><CalendarClock className="h-5 w-5" /></span>
                <span className="min-w-[200px] flex-1"><span className="block text-[14.5px] font-semibold text-white">Henüz görev yok</span><span className="block text-[13px] text-white/55">Aşağıdan hazır bir görev seç ya da sohbette &quot;her sabah 8&apos;de bana ... yap&quot; de.</span></span>
                <Link href="/panel/build/sohbet/yeni" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] text-white hover:bg-white/[0.13]"><MessageSquare className="h-4 w-4" />Sohbette kur</Link>
                <button type="button" onClick={() => setPanel({})} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><Plus className="h-4 w-4" />Yeni görev</button>
              </div>
            </div>
          ) : (
            <ul key={filtre} className="divide-y divide-white/[0.05]">
              <AnimatePresence initial={false}>
                {gorunen.map((g) => (
                  <motion.li key={g.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                    <span className={cn("relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px]", g.durum === "acik" ? "bg-[#55d6fd]/[0.12] text-[#8be6ff]" : "bg-white/[0.06] text-white/45")}>
                      {g.calisiyor ? <Loader2 className="h-5 w-5 animate-spin" /> : g.durum === "acik" ? <CalendarClock className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                      {g.okunmamis > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#55d6fd] px-1 text-[11px] font-semibold text-black">{g.okunmamis}</span>}
                    </span>
                    <span className="min-w-[200px] flex-1">
                      <span className="flex items-center gap-2"><Link href={`/panel/build/sohbet/${g.sohbet}`} className="truncate text-[14.5px] font-semibold text-white hover:underline">{g.ad}</Link>{g.durum !== "acik" && <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11.5px] text-white/55">{g.durum === "yok" ? "Sistemi silinmiş" : "Duraklatıldı"}</span>}</span>
                      <span className="block truncate text-[12.5px] text-white/50">{g.aciklama}{g.sonraki ? ` · sonraki ${tarihSaat(g.sonraki)}` : ""}</span>
                    </span>
                    <span className="hidden min-w-[140px] items-center gap-1.5 text-[12.5px] text-white/55 md:flex">
                      {g.sonCalisma ? <>{g.sonDurum === "basarili" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> : g.sonDurum === "basarisiz" ? <XCircle className="h-3.5 w-3.5 text-rose-300" /> : <Loader2 className="h-3.5 w-3.5 animate-spin" />}Son çalışma {gorece(g.sonCalisma)}</> : "Henüz çalışmadı"}
                    </span>
                    <span className="flex items-center gap-1">
                      <button type="button" disabled={!!islem || g.durum === "yok"} onClick={() => calistir(g)} title="Şimdi çalıştır" className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-white hover:bg-white/[0.12] disabled:opacity-40">{islem === `c-${g.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}<span className="max-sm:hidden">Şimdi çalıştır</span></button>
                      <button type="button" disabled={!!islem || g.durum === "yok"} onClick={() => durumDegis(g)} role="switch" aria-checked={g.durum === "acik"} title={g.durum === "acik" ? "Duraklat" : "Sürdür"} className={cn("relative h-[24px] w-[40px] shrink-0 rounded-full transition-colors disabled:opacity-40", g.durum === "acik" ? "bg-white" : "bg-white/[0.14]")}>
                        <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 34 }} className={cn("absolute top-[3px] h-[18px] w-[18px] rounded-full", g.durum === "acik" ? "right-[3px] bg-[#0a0a0b]" : "left-[3px] bg-white")} />
                      </button>
                      <GorevMenu g={g} degisti={yenile} duzenle={() => setPanel({ gorev: g })} />
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
              {!gorunen.length && <li className="px-5 py-8 text-center text-[13.5px] text-white/50">Bu süzgeçte görev yok.</li>}
            </ul>
          )}
      </Kart>
      <Kart ikon={Plus} baslik="Hazır görevler" alt="Bir şablon seç, saatini ve metnini dilediğin gibi değiştir" govde="p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GOREV_SABLONLARI.map((s) => (
            <button key={s.id} type="button" onClick={() => setPanel({ sablon: s })} className="group relative flex h-[132px] flex-col justify-end overflow-hidden rounded-[18px] p-3.5 text-left ring-1 ring-inset ring-white/[0.08]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.kapak} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-500 group-hover:scale-[1.04]" />
              <span className="absolute inset-0 bg-gradient-to-t from-[#0b0c0d] via-[#0b0c0d]/70 to-transparent" />
              <span className="relative block text-[14.5px] font-semibold text-white">{s.ad}</span>
              <span className="relative mt-0.5 flex items-center gap-1.5 text-[12.5px] text-white/65"><CalendarClock className="h-3.5 w-3.5 text-[#8be6ff]" />{s.alt}</span>
              <span className="relative mt-1 line-clamp-1 text-[12px] text-white/45">{s.istem}</span>
            </button>
          ))}
        </div>
      </Kart>
      </>}
      <GorevPaneli acik={!!panel} kapat={() => setPanel(null)} gorev={panel?.gorev} ilk={panel?.sablon ? { sablon: panel.sablon } : undefined} bitti={() => yenile()} />
    </div>
  );
}
