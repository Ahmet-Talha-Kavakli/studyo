"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle, ArrowLeft, Cake, CalendarCheck, GitBranch, Hourglass, Mail, Pause, PenLine, Play, Plus, RotateCcw, RotateCw, Send, ShoppingBag, ShoppingCart, Tag, Trash2, UserPlus, Wand2, Workflow,
} from "lucide-react";
import { gorece } from "@/lib/build/istemci";
import { kampanyaHtml, konuIpuclari } from "@/lib/build/buyumeEkTipler";
import {
  ADIM_TURLERI, AKIS_ETIKETLERI, adimAl, akisBloklari, akisDoldur, akisSorunlari, bekleMetni, butunAdimlar, GONDERIM_SAATLERI, KOSULLAR, kosulMetni, saatYaz, TETIKLER, tetikAdi, tetikOzeti,
  type Adim, type AdimEposta, type AkisIstemci, type KosulTur, type TetikTur,
} from "@/lib/build/buyumeAkisTipler";
import { cn } from "@/lib/utils";
import { Secici } from "./ortak";
import { AcilirMenu, alan, birincil, Cip, Etiket, Halka, HataSatiri, ikincil, Kart, ModelYokKart, Rozet, SecenekMenusu, simgeDugme, Suruyor, YanPanel } from "./ortak";
import { BlokListesi, oranYaz, SayiSatiri } from "./bloklar";
import { markaOzetiIstemci } from "./Eposta";
import { ModelYokEk } from "./useBuyumeEk";
import type { BolumProps } from "./BuyumeSekme";

type Ikon = typeof Mail;
export const TETIK_SIMGE: Record<TetikTur, Ikon> = { hosgeldin: UserPlus, siparis: ShoppingBag, "terk-sepet": ShoppingCart, "dogum-gunu": Cake, "geri-kazan": RotateCcw, randevu: CalendarCheck, etiket: Tag };
const ADIM_SIMGE: Record<Adim["tur"], Ikon> = { bekle: Hourglass, eposta: Mail, kosul: GitBranch, etiket: Tag };
const DURUM: Record<AkisIstemci["durum"], { ad: string; ton: "soluk" | "aksan" | "amber" }> = { taslak: { ad: "Taslak", ton: "soluk" }, acik: { ad: "Açık", ton: "aksan" }, durdu: { ad: "Durduruldu", ton: "amber" } };
const kid = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
const tl = (n: number) => `${Math.round(n).toLocaleString("tr-TR")} TL`;

/* ── Ağaç yardımcıları (istemci tarafı düzenleme) ── */
type Yer = { kosul?: string; dal?: "evet" | "hayir" };
function listeDegistir(l: Adim[], yer: Yer, f: (l: Adim[]) => Adim[]): Adim[] {
  if (!yer.kosul) return f(l);
  return l.map((a) => (a.tur !== "kosul" ? a : a.id === yer.kosul ? { ...a, [yer.dal!]: f(a[yer.dal!]) } : { ...a, evet: listeDegistir(a.evet, yer, f), hayir: listeDegistir(a.hayir, yer, f) }));
}
function adimGuncelle(l: Adim[], id: string, y: Partial<Adim>): Adim[] { return l.map((a) => (a.id === id ? ({ ...a, ...y } as Adim) : a.tur === "kosul" ? { ...a, evet: adimGuncelle(a.evet, id, y), hayir: adimGuncelle(a.hayir, id, y) } : a)); }
function adimSil(l: Adim[], id: string): Adim[] { return l.filter((a) => a.id !== id).map((a) => (a.tur === "kosul" ? { ...a, evet: adimSil(a.evet, id), hayir: adimSil(a.hayir, id) } : a)); }
function yeniAdim(tur: Adim["tur"], site: string): Adim {
  if (tur === "bekle") return { id: kid(), tur, sure: 1, birim: "gun" };
  if (tur === "kosul") return { id: kid(), tur, kosul: "tikladi", evet: [], hayir: [] };
  if (tur === "etiket") return { id: kid(), tur, etiket: "" };
  return { id: kid(), tur, ad: "E-posta", konu: "", onMetin: "", saat: "hemen", bloklar: [{ id: kid(), tur: "baslik", metin: "" }, { id: kid(), tur: "metin", metin: "Merhaba {ad},\n\n" }, { id: kid(), tur: "dugme", metin: "Siteye git", adres: site }] };
}
const yapi = (l: Adim[]): string => l.map((a) => (a.tur === "kosul" ? `${a.id}(${yapi(a.evet)}|${yapi(a.hayir)})` : a.id)).join(",");

export function OtomasyonBolumu(pr: BolumProps) {
  const { e, git } = pr;
  const d = e.d!;
  const [acik, setAcik] = useState<string | null>(null);
  const [hata, setHata] = useState("");
  const [kuruluyor, setKuruluyor] = useState<string | null>(null);
  const a = d.ek.akislar.find((x) => x.id === acik);
  if (a) return <AkisDuzenleyici pr={pr} a={a} geri={() => setAcik(null)} />;
  const kur = async (tetik: TetikTur | "bos") => {
    setHata(""); setKuruluyor(tetik);
    try { const j = await e.duzenle("akis", { akis: tetik === "bos" ? { tetik: "hosgeldin", bos: true } : { tetik, kupon: d.isletme.kuponlar[0]?.kod ?? "" } }); setAcik((j.ek as { akislar: AkisIstemci[] }).akislar[0].id); }
    catch (x) { setHata(x instanceof Error ? x.message : "Kurulamadı."); } finally { setKuruluyor(null); }
  };
  const top = d.ek.akislar.reduce((t, x) => ({ aktif: t.aktif + x.ist.aktif, g: t.g + x.ist.gonderilen, ac: t.ac + x.ist.acilan, tk: t.tk + x.ist.tiklayan, s: t.s + x.ist.siparis, c: t.c + x.ist.ciro }), { aktif: 0, g: 0, ac: 0, tk: 0, s: 0, c: 0 });
  const acikSayi = d.ek.akislar.filter((x) => x.durum === "acik").length;
  return (
    <div className="space-y-4">
      <Kart baslik={<span className="flex flex-wrap items-center gap-2">Otomasyonlar<Rozet ton={acikSayi ? "aksan" : "soluk"}>{acikSayi ? `${acikSayi} akış açık` : "Açık akış yok"}</Rozet></span>}
        aciklama="Hoş geldin, sipariş sonrası, terk edilen sepet, doğum günü, geri kazanma ve randevu sonrası e-postaları kendiliğinden gider. Her adımda izin yeniden denetlenir; abonelikten çıkan hiçbir zaman almaz.">
        <SayiSatiri sutun={5} l={[["Şu an akışta", top.aktif.toLocaleString("tr-TR")], ["Gönderilen", top.g.toLocaleString("tr-TR")], ["Açılma", oranYaz(top.ac, top.g)], ["Tıklama", oranYaz(top.tk, top.g)], ["Akıştan sipariş", top.s ? `${top.s}, ${tl(top.c)}` : "yok"]]} />
        {d.akisSon && <p className="mt-2 text-[11.5px] text-white/40">Son denetim {gorece(d.akisSon)}. Akışlar dakikada bir denetlenir.</p>}
      </Kart>
      <Uyarilar pr={pr} />
      <AnimatePresence>{hata && <HataSatiri mesaj={hata} kapat={() => setHata("")} />}</AnimatePresence>
      <Kart baslik="Hazır akışlar" aciklama="Her biri Türkçe metinleri, bekleme süreleri ve koşullarıyla gelir; kurduktan sonra her adımı değiştirebilirsin.">
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TETIKLER.map((t) => { const I = TETIK_SIMGE[t.id]; const var_ = d.ek.akislar.filter((x) => x.tetik === t.id).length; return (
            <li key={t.id}>
              <button type="button" disabled={!!kuruluyor} onClick={() => kur(t.id)} className="group flex h-full w-full flex-col gap-2 rounded-[16px] bg-white/[0.03] p-3.5 text-left ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.055] disabled:opacity-60">
                <span className="flex w-full items-center gap-2.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#55d6fd]/[0.1]"><I className="h-4 w-4 text-[#8be6ff]" /></span><span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-white">{t.ad}</span>{kuruluyor === t.id ? <span className="build-nokta" /> : var_ > 0 && <Rozet className="h-5 px-2 text-[10.5px]">{var_} akış</Rozet>}</span>
                <span className="text-[12px] leading-snug text-white/55">{t.alt}</span>
                <span className="mt-auto text-[11px] text-white/35">Veri: {t.kaynak}</span>
              </button>
            </li>
          ); })}
          <li>
            <button type="button" disabled={!!kuruluyor} onClick={() => kur("bos")} className="flex h-full w-full flex-col gap-2 rounded-[16px] border border-dashed border-white/[0.12] p-3.5 text-left transition-colors hover:bg-white/[0.03] disabled:opacity-60">
              <span className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-white/[0.06]"><PenLine className="h-4 w-4 text-white/75" /></span><span className="text-[13.5px] font-medium text-white">Özel: boş akış</span></span>
              <span className="text-[12px] leading-snug text-white/55">Tetiği ve adımları kendin kur.</span>
            </button>
          </li>
        </ul>
      </Kart>
      <Kart baslik={<span className="flex items-center gap-2">Akışlarım<Rozet>{d.ek.akislar.length}</Rozet></span>}>
        {d.ek.akislar.length ? (
          <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
            {d.ek.akislar.map((x) => { const I = TETIK_SIMGE[x.tetik]; return (
              <li key={x.id}>
                <button type="button" onClick={() => setAcik(x.id)} className="flex w-full flex-wrap items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-white/[0.03] sm:flex-nowrap">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.06]"><I className="h-4 w-4 text-white/70" /></span>
                  <span className="min-w-[160px] flex-1"><span className="block truncate text-[13.5px] font-medium text-white">{x.ad}</span><span className="block truncate text-[12px] text-white/50">{tetikOzeti(x)}</span></span>
                  <Rozet ton={DURUM[x.durum].ton}>{x.durum === "acik" && <span className="h-1.5 w-1.5 rounded-full bg-[#55d6fd]" />}{DURUM[x.durum].ad}</Rozet>
                  <span className="w-[220px] shrink-0 text-right text-[12px] tabular-nums text-white/55 max-sm:w-auto max-sm:text-left">{x.ist.giren ? `${x.ist.aktif} kişi akışta, ${x.ist.gonderilen} e-posta, açılma ${oranYaz(x.ist.acilan, x.ist.gonderilen)}` : `${butunAdimlar(x.adimlar).length} adım, ${gorece(x.guncelleme)}`}</span>
                </button>
              </li>
            ); })}
          </ul>
        ) : <p className="text-[12.5px] text-white/50">Henüz akış yok. Yukarıdan hazır bir akış seç; en çok kazandıran ikisi hoş geldin ve terk edilen sepettir.</p>}
      </Kart>
      {!d.ek.marka?.iletisim?.trim() && <p className="text-[12px] text-white/45">Not: akışlar açılmadan önce <button type="button" onClick={() => git("marka")} className="text-[#8be6ff] underline-offset-2 hover:underline">marka kitine</button> gönderen bilgisi yazılmalı.</p>}
    </div>
  );
}

function Uyarilar({ pr, tetik }: { pr: BolumProps; tetik?: TetikTur }) {
  const d = pr.e.d!;
  const l: { m: string; git?: () => void; d?: string }[] = [];
  if (!d.eposta.kurulu) l.push({ m: "E-posta servisi kurulu değil. Akışlar kurulabilir ama açılamaz; yöneticinin sunucuya RESEND_API_KEY ve doğrulanmış gönderen (BUILD_EPOSTA_GONDEREN) eklemesi gerekir." });
  if (d.eposta.deneme) l.push({ m: "Bu sunucuda yerel deneme gönderimi açık: e-postalar gerçek alıcılara değil deneme adresine yazılır." });
  if (!d.ek.marka?.iletisim?.trim()) l.push({ m: "Marka kitinde gönderen bilgisi yok; ticari iletide işletme adı ve iletişim bilgisi zorunlu (6563 sayılı Kanun).", git: () => pr.git("marka"), d: "Marka kitini aç" });
  if ((!tetik || tetik === "terk-sepet") && d.isletme.terkAcik) l.push({ m: "İşletme sekmesinde terk edilen sepet hatırlatması da açık. İkisi birlikte açık kalırsa müşteri iki hatırlatma alır; birini kapat." });
  if (!l.length) return null;
  return <div className="space-y-2">{l.map((x) => <div key={x.m} className="flex flex-wrap items-center gap-3 rounded-[14px] bg-amber-400/[0.05] px-3.5 py-3 ring-1 ring-inset ring-amber-300/15"><AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" /><p className="min-w-[200px] flex-1 text-[12.5px] leading-relaxed text-white/75">{x.m}</p>{x.git && <button type="button" onClick={x.git} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>{x.d}</button>}</div>)}</div>;
}

type Taslak = Pick<AkisIstemci, "ad" | "tetik" | "ayar" | "adimlar" | "izin" | "siparisCikis" | "akilli" | "sessiz" | "yeniden" | "gecmis">;
const taslakAl = (a: AkisIstemci): Taslak => ({ ad: a.ad, tetik: a.tetik, ayar: a.ayar, adimlar: a.adimlar, izin: a.izin, siparisCikis: a.siparisCikis, akilli: a.akilli, sessiz: a.sessiz, yeniden: a.yeniden, gecmis: a.gecmis });

function AkisDuzenleyici({ pr, a, geri }: { pr: BolumProps; a: AkisIstemci; geri: () => void }) {
  const { e, p } = pr;
  const d = e.d!;
  const [t, setT] = useState<Taslak>(() => taslakAl(a));
  const [kirli, setKirli] = useState(false);
  const [secili, setSecili] = useState<string | null>(null);
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");
  const [baslat, setBaslat] = useState(false);
  const [beyan, setBeyan] = useState(false);
  const [sil, setSil] = useState(false);
  const son = useRef(a.id);
  useEffect(() => { if (son.current !== a.id || !kirli) { son.current = a.id; setT(taslakAl(a)); setKirli(false); } }, [a]); // eslint-disable-line react-hooks/exhaustive-deps
  const degis = (y: Partial<Taslak>) => { setT((x) => ({ ...x, ...y })); setKirli(true); };
  const acikMi = a.durum === "acik";
  const yapiKilit = acikMi;
  const kaydet = async () => { if (!kirli) return true; try { await e.duzenle("akis", { akis: { id: a.id, ...t } }); setKirli(false); return true; } catch (x) { setHata(x instanceof Error ? x.message : "Kaydedilemedi."); return false; } };
  const yap = async (f: () => Promise<unknown>, ok?: string) => { setHata(""); setBilgi(""); try { await f(); if (ok) setBilgi(ok); } catch (x) { setHata(x instanceof Error ? x.message : "İşlem yapılamadı."); } };
  const sorunlar = akisSorunlari(t);
  const ekle = (yer: Yer, i: number, tur: Adim["tur"]) => { const y = yeniAdim(tur, d.site); degis({ adimlar: listeDegistir(t.adimlar, yer, (l) => [...l.slice(0, i), y, ...l.slice(i)]) }); if (tur !== "kosul") setSecili(y.id); };
  const adim = secili && secili !== "tetik" ? butunAdimlar(t.adimlar).find((x) => x.id === secili) ?? null : null;
  const ist = a.ist;
  const ac = async () => {
    if (!(await kaydet())) return;
    if (t.izin === "belirsiz-dahil" && !beyan) { setBaslat(true); return; }
    await yap(() => e.islem("akis-baslat", { akisId: a.id, izinBeyan: beyan }, "akis-baslat"), "Akış açıldı; tetiğe uyan kişiler dakikalar içinde girmeye başlar.");
    setBaslat(false);
  };
  const etiketler = useMemo(() => [...new Set(d.kisiler.flatMap((k) => k.etiketler))], [d.kisiler]);

  return (
    <div className="space-y-4">
      <Kart baslik={<span className="flex min-w-0 items-center gap-2"><button type="button" onClick={async () => { await kaydet(); geri(); }} className={cn(simgeDugme, "-ml-1.5")} aria-label="Akışlara dön"><ArrowLeft className="h-4 w-4" /></button>
        <input value={t.ad} onChange={(x) => degis({ ad: x.target.value })} maxLength={80} aria-label="Akış adı" className="min-w-0 flex-1 bg-transparent text-[14.5px] font-semibold text-white outline-none" /><Rozet ton={DURUM[a.durum].ton}>{DURUM[a.durum].ad}</Rozet></span>}
        aciklama={acikMi ? `${a.acilis ? `${gorece(a.acilis)} açıldı. ` : ""}Açıkken içerik ve süreler değişebilir; adım eklemek ya da silmek için durdur.` : "Taslak: kimse girmez. Hazır olunca aç."}
        sag={<>
          <button type="button" onClick={() => { if (!sil) { setSil(true); setTimeout(() => setSil(false), 3000); return; } yap(async () => { await e.duzenle("akisSil", { id: a.id }); geri(); }); }} className={cn(sil ? "inline-flex h-8 items-center gap-1.5 rounded-full bg-rose-500/15 px-3 text-[12.5px] text-rose-100" : simgeDugme, "hover:text-rose-200")} aria-label="Akışı sil">{sil ? "Silmek için yeniden bas" : <Trash2 className="h-4 w-4" />}</button>
          {acikMi && <button type="button" disabled={e.suruyor("akis-calistir")} onClick={() => yap(() => e.islem("akis-calistir", {}, "akis-calistir"), "Denetlendi.")} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>{e.suruyor("akis-calistir") ? <span className="build-nokta" /> : <RotateCw className="h-3.5 w-3.5" />}Şimdi denetle</button>}
          <button type="button" disabled={!kirli} onClick={() => yap(kaydet, "Kaydedildi.")} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>Kaydet</button>
          {acikMi ? <button type="button" onClick={() => yap(() => e.islem("akis-durdur", { akisId: a.id }), "Durduruldu; akıştaki kişiler bekler, açınca kaldıkları yerden sürer.")} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><Pause className="h-3.5 w-3.5" />Durdur</button>
            : <button type="button" disabled={!!sorunlar.length || e.suruyor("akis-baslat")} onClick={ac} className={cn(birincil, "h-8 px-3 text-[12.5px]")}>{e.suruyor("akis-baslat") ? <span className="build-nokta" /> : <Play className="h-3.5 w-3.5" />}Aç</button>}
        </>} />
      <AnimatePresence>{hata && <HataSatiri mesaj={hata} kapat={() => setHata("")} />}</AnimatePresence>
      {bilgi && <p className="rounded-[12px] bg-[#55d6fd]/[0.08] px-3 py-2 text-[12.5px] text-[#8be6ff] ring-1 ring-inset ring-[#55d6fd]/20">{bilgi}</p>}
      <Uyarilar pr={pr} tetik={t.tetik} />
      {sorunlar.length > 0 && <ul className="space-y-1 rounded-[14px] bg-white/[0.03] px-3.5 py-3 ring-1 ring-inset ring-white/[0.07]">{sorunlar.map((s) => <li key={s} className="flex gap-2 text-[12.5px] text-amber-100/85"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-amber-300" />{s}</li>)}</ul>}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 rounded-[18px] bg-white/[0.02] p-3 ring-1 ring-inset ring-white/[0.06] sm:p-5">
          <button type="button" onClick={() => setSecili("tetik")} className={cn("mx-auto flex w-full max-w-[460px] items-center gap-3 rounded-[16px] bg-[#55d6fd]/[0.07] p-3.5 text-left ring-1 ring-inset transition-colors", secili === "tetik" ? "ring-2 ring-white" : "ring-[#55d6fd]/20 hover:bg-[#55d6fd]/[0.1]")}>
            {(() => { const I = TETIK_SIMGE[t.tetik]; return <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#55d6fd]/[0.14]"><I className="h-[18px] w-[18px] text-[#8be6ff]" /></span>; })()}
            <span className="min-w-0 flex-1"><span className="block text-[11.5px] text-[#8be6ff]/80">Tetik</span><span className="block truncate text-[14px] font-medium text-white">{tetikAdi(t.tetik)}</span><span className="block text-[12px] leading-snug text-white/55">{tetikOzeti(t)}</span></span>
            <span className="shrink-0 text-right text-[11.5px] tabular-nums text-white/55">{ist.giren} kişi girdi</span>
          </button>
          <AdimAgaci l={t.adimlar} yer={{}} derinlik={0} secili={secili} sec={setSecili} ekle={ekle} kilit={yapiKilit} ist={ist} />
          <div className="mx-auto mt-1 flex w-full max-w-[460px] items-center justify-center gap-2 rounded-full bg-white/[0.03] py-2 text-[12px] text-white/45 ring-1 ring-inset ring-white/[0.06]">Akış sonu{ist.biten ? `, ${ist.biten} kişi tamamladı` : ""}</div>
        </div>
        <div className="min-w-0 space-y-4">
          <Kurallar t={t} degis={degis} />
          <Kart baslik="Performans" aciklama="Akıştan sipariş: açılan ya da tıklanan akış e-postasından sonraki 5 gün içinde verilen ödenmiş sipariş.">
            <SayiSatiri sutun={2} l={[["Giren", ist.giren], ["Şu an akışta", ist.aktif], ["Tamamlayan", ist.biten], ["Çıkan", ist.cikan], ["Gönderilen", ist.gonderilen], ["Açılma", oranYaz(ist.acilan, ist.gonderilen)], ["Tıklama", oranYaz(ist.tiklayan, ist.gonderilen)], ["Abonelikten çıkma", ist.cikis], ["Atlanan", ist.atlanan], ["Sipariş", ist.siparis ? `${ist.siparis}, ${tl(ist.ciro)}` : "yok"]]} />
          </Kart>
          <SonKisiler a={a} t={t} cikar={(k) => yap(() => e.islem("akis-cikar", { akisId: a.id, kayitId: k }), "Akıştan çıkarıldı.")} />
        </div>
      </div>

      <TetikPaneli acik={secili === "tetik"} kapat={() => setSecili(null)} t={t} degis={degis} kilit={yapiKilit} pr={pr} etiketler={etiketler} />
      <AdimPaneli adim={adim} kapat={() => setSecili(null)} pr={pr} akis={a} t={t} kirli={kirli} kaydet={kaydet} kilit={yapiKilit} etiketler={etiketler}
        degis={(y) => degis({ adimlar: adimGuncelle(t.adimlar, adim!.id, y) })} sil={() => { degis({ adimlar: adimSil(t.adimlar, adim!.id) }); setSecili(null); }} />
      <YanPanel acik={baslat} kapat={() => setBaslat(false)} baslik="Akışı aç" alt="İzni belirsiz kişiler de katılacak"
        alt2={<><button type="button" onClick={() => setBaslat(false)} className={cn(ikincil, "ml-auto")}>Vazgeç</button><button type="button" disabled={!beyan} onClick={ac} className={birincil}><Play className="h-3.5 w-3.5" />Aç</button></>}>
        <button type="button" role="checkbox" aria-checked={beyan} onClick={() => setBeyan(!beyan)} className="flex w-full items-start gap-2.5 rounded-[14px] bg-amber-400/[0.05] p-3 text-left ring-1 ring-inset ring-amber-300/15">
          <span className="mt-0.5"><Halka dolu={beyan} boyut={18} /></span>
          <span className="text-[12.5px] leading-relaxed text-white/80">İzni belirsiz kişilerden ticari elektronik ileti onayı aldığımı ya da bu kişilerin tacir veya esnaf olduğunu beyan ederim. Onayın ispatı bana aittir; reddeden ve abonelikten çıkan kişiler akış e-postası almaz.</span>
        </button>
      </YanPanel>
    </div>
  );
}

function Baglanti() { return <span className="mx-auto block h-4 w-px bg-white/[0.12]" />; }

function AdimAgaci({ l, yer, derinlik, secili, sec, ekle, kilit, ist }: { l: Adim[]; yer: Yer; derinlik: number; secili: string | null; sec: (id: string) => void; ekle: (yer: Yer, i: number, tur: Adim["tur"]) => void; kilit: boolean; ist: AkisIstemci["ist"] }) {
  const EkleDugme = ({ i }: { i: number }) => (
    <div className="flex flex-col items-center">
      <Baglanti />
      {kilit ? <span className="h-1.5 w-1.5 rounded-full bg-white/20" /> : (
        <AcilirMenu genislik={260} hiza="sol" tetik={(ac, acik) => <button type="button" onClick={ac} aria-label="Adım ekle" className={cn("flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] text-white/60 ring-1 ring-inset ring-white/[0.1] transition-colors hover:bg-white/[0.12] hover:text-white", acik && "bg-white/[0.14] text-white")}><Plus className="h-3.5 w-3.5" /></button>}>
          {(kapat) => <div><p className="px-2.5 pb-1.5 pt-1 text-[12px] font-medium text-white/45">Adım ekle</p>{ADIM_TURLERI.filter((x) => x.id !== "kosul" || derinlik < 2).map((x) => { const I = ADIM_SIMGE[x.id]; return <button key={x.id} type="button" onClick={() => { ekle(yer, i, x.id); kapat(); }} className="flex w-full items-center gap-2.5 rounded-[11px] px-2.5 py-2 text-left hover:bg-white/[0.06]"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-white/[0.07]"><I className="h-3.5 w-3.5 text-white/75" /></span><span className="min-w-0 flex-1"><span className="block text-[13.5px] text-white">{x.ad}</span><span className="block truncate text-[12px] text-white/50">{x.alt}</span></span></button>; })}</div>}
        </AcilirMenu>
      )}
      <Baglanti />
    </div>
  );
  return (
    <div>
      {l.map((x, i) => {
        const I = ADIM_SIMGE[x.tur];
        const s = ist.adim[x.id];
        return (
          <Fragment key={x.id}>
            <EkleDugme i={i} />
            <motion.button layout="position" type="button" onClick={() => sec(x.id)} className={cn("mx-auto flex w-full max-w-[460px] items-start gap-3 rounded-[16px] bg-[#141518] p-3.5 text-left ring-1 ring-inset transition-colors", secili === x.id ? "ring-2 ring-white" : "ring-white/[0.08] hover:bg-[#18191d]")}>
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]", x.tur === "eposta" ? "bg-[#55d6fd]/[0.1]" : "bg-white/[0.06]")}><I className={cn("h-4 w-4", x.tur === "eposta" ? "text-[#8be6ff]" : "text-white/70")} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11.5px] text-white/45">{ADIM_TURLERI.find((y) => y.id === x.tur)?.ad}</span>
                <span className="block truncate text-[13.5px] font-medium text-white">{x.tur === "bekle" ? bekleMetni(x) : x.tur === "eposta" ? x.ad || "E-posta" : x.tur === "kosul" ? kosulMetni(x) : `"${x.etiket || "etiket"}" etiketini ekle`}</span>
                {x.tur === "eposta" && <span className="block truncate text-[12px] text-white/50">{x.konu || "Konu satırı yok"}{x.saat === "kisisel" ? ", kişinin en iyi saatinde" : x.saat === "sabit" && x.sabitSaat ? `, saat ${x.sabitSaat}` : ""}{x.kupon ? `, kupon ${x.kupon}` : ""}</span>}
                {s && (s.gecen > 0 || s.gonderilen > 0 || s.atlanan > 0) && <span className="mt-1.5 flex flex-wrap gap-1">
                  {x.tur === "eposta" ? <><Rozet className="h-5 px-2 text-[10.5px]">{s.gonderilen} gönderildi</Rozet><Rozet className="h-5 px-2 text-[10.5px]">açılma {oranYaz(s.acilan, s.gonderilen)}</Rozet><Rozet className="h-5 px-2 text-[10.5px]">tık {oranYaz(s.tiklayan, s.gonderilen)}</Rozet>{s.atlanan > 0 && <Rozet ton="amber" className="h-5 px-2 text-[10.5px]">{s.atlanan} atlandı</Rozet>}{s.hata > 0 && <Rozet ton="rose" className="h-5 px-2 text-[10.5px]">{s.hata} hata</Rozet>}</>
                    : x.tur === "kosul" ? <><Rozet ton="aksan" className="h-5 px-2 text-[10.5px]">evet {s.evet}</Rozet><Rozet className="h-5 px-2 text-[10.5px]">hayır {s.hayir}</Rozet></> : <Rozet className="h-5 px-2 text-[10.5px]">{s.gecen} kişi geçti</Rozet>}
                </span>}
              </span>
            </motion.button>
            {x.tur === "kosul" && (
              <div className="mx-auto mt-0 grid w-full max-w-[720px] gap-3 pt-0 sm:grid-cols-2">
                {(["evet", "hayir"] as const).map((dal) => (
                  <div key={dal} className="min-w-0 rounded-[16px] bg-white/[0.02] px-2 pb-2 ring-1 ring-inset ring-white/[0.06]">
                    <p className="flex items-center justify-center gap-1.5 pt-2.5 text-[12px] font-medium text-white/70"><span className={cn("h-1.5 w-1.5 rounded-full", dal === "evet" ? "bg-[#55d6fd]" : "bg-white/40")} />{dal === "evet" ? "Evet" : "Hayır"}</p>
                    <AdimAgaci l={x[dal]} yer={{ kosul: x.id, dal }} derinlik={derinlik + 1} secili={secili} sec={sec} ekle={ekle} kilit={kilit} ist={ist} />
                    {!x[dal].length && kilit && <p className="pb-2 text-center text-[11.5px] text-white/35">Adım yok; akış koşuldan sonrasıyla sürer.</p>}
                  </div>
                ))}
              </div>
            )}
          </Fragment>
        );
      })}
      <EkleDugme i={l.length} />
    </div>
  );
}

function Kurallar({ t, degis }: { t: Taslak; degis: (y: Partial<Taslak>) => void }) {
  const [yenidenOzel, setYenidenOzel] = useState(String(t.yeniden || ""));
  const Satir = ({ k, ad, alt }: { k: "akilli" | "sessiz" | "siparisCikis" | "gecmis"; ad: string; alt: string }) => (
    <button type="button" role="checkbox" aria-checked={t[k]} onClick={() => degis({ [k]: !t[k] })} className="flex w-full items-start gap-2.5 rounded-[12px] px-1 py-2 text-left">
      <span className="mt-0.5"><Halka dolu={t[k]} boyut={18} /></span><span className="min-w-0"><span className="block text-[13px] text-white">{ad}</span><span className="block text-[11.5px] leading-snug text-white/50">{alt}</span></span>
    </button>
  );
  const YENIDEN = [{ id: "0", ad: "Olay başına bir kez", alt: "Aynı olay kişiyi bir kez sokar" }, { id: "7", ad: "7 günde bir", alt: "En erken bir hafta sonra yeniden" }, { id: "30", ad: "30 günde bir", alt: "Ayda en çok bir kez" }, { id: "90", ad: "90 günde bir", alt: "Üç ayda en çok bir kez" }];
  const yd = YENIDEN.some((x) => x.id === String(t.yeniden)) ? String(t.yeniden) : "ozel";
  return (
    <Kart baslik="Kurallar">
      <div className="space-y-1">
        <p className="mb-1 text-[12px] text-white/50">İzin kuralı</p>
        <div className="flex max-w-full overflow-x-auto [scrollbar-width:none]"><Secici id="akis-izin" kucuk deger={t.izin} set={(v) => degis({ izin: v })} l={[{ id: "onayli" as const, ad: "Yalnız onaylılar" }, { id: "belirsiz-dahil" as const, ad: "İzni belirsizler de" }]} /></div>
        <p className="pb-2 text-[11.5px] leading-snug text-white/45">{t.izin === "onayli" ? "Ticari ileti onayı olmayanlar adımda atlanır." : "Açarken onay aldığını ya da alıcıların tacir veya esnaf olduğunu beyan etmen istenir."}</p>
        <Satir k="akilli" ad="Akıllı gönderim" alt="Son 16 saatte bizden e-posta alan kişi bu adımı atlar." />
        <Satir k="sessiz" ad="Sessiz saatler" alt="21:00 ile 09:00 arasına denk gelen e-posta sabah 09:00'da gider." />
        <Satir k="siparisCikis" ad="Sipariş verirse akıştan çık" alt="Terk edilen sepet ve geri kazanmada önerilir." />
        <Satir k="gecmis" ad="Açılınca geçmişi kat" alt={t.tetik === "geri-kazan" ? "Açıldığında son bir yılda süresi dolmuş müşteriler de girer." : "Açıldığında son 7 günün olayları da girer."} />
        <div className="pt-2">
          <p className="mb-1.5 text-[12px] text-white/50">Yeniden giriş</p>
          <SecenekMenusu genislik={280} baslik="Aynı kişi ne sıklıkla girebilir" deger={yd} sec={(id) => { if (id !== "ozel") degis({ yeniden: Number(id) }); else degis({ yeniden: Number(yenidenOzel) || 14 }); }} l={YENIDEN}
            ozel={{ deger: yenidenOzel, set: (v) => { const n = v.replace(/\D/g, "").slice(0, 3); setYenidenOzel(n); if (n) degis({ yeniden: Number(n) }); }, yer: "Gün sayısı", alt: "Gün sayısını kendin yaz" }}
            tetik={(ac, acik) => <Cip onClick={ac} acik={acik} className="pl-3">{yd === "ozel" ? `${t.yeniden} günde bir` : YENIDEN.find((x) => x.id === yd)?.ad}</Cip>} />
        </div>
      </div>
    </Kart>
  );
}

function SonKisiler({ a, t, cikar }: { a: AkisIstemci; t: Taslak; cikar: (id: string) => void }) {
  const l = a.sonKayitlar;
  return (
    <Kart baslik={<span className="flex items-center gap-2">Son kişiler<Rozet>{l.length}</Rozet></span>}>
      {l.length ? (
        <ul className="max-h-[360px] space-y-1.5 overflow-y-auto [scrollbar-width:thin]">
          {l.map((k) => { const ad = adimAl(t.adimlar, k.konum); return (
            <li key={k.id} className="flex items-center gap-2 rounded-[12px] bg-white/[0.03] px-2.5 py-2 ring-1 ring-inset ring-white/[0.06]">
              <span className="min-w-0 flex-1"><span className="block truncate text-[12.5px] text-white">{k.ad}</span><span className="block truncate text-[11px] text-white/45">{k.durum === "aktif" ? `${ad ? (ad.tur === "eposta" ? ad.ad : ad.tur === "bekle" ? `Bekliyor, ${bekleMetni(ad)}` : ADIM_TURLERI.find((x) => x.id === ad.tur)?.ad) : "Adım"}${k.sonraki > Date.now() + 60_000 ? `, ${new Date(k.sonraki).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""}${k.neden ? `. ${k.neden}` : ""}` : k.neden ?? (k.durum === "bitti" ? "Tamamladı" : "Çıktı")}</span></span>
              <Rozet ton={k.durum === "aktif" ? "aksan" : k.durum === "bitti" ? "notr" : "soluk"} className="h-5 px-2 text-[10.5px]">{k.durum === "aktif" ? "Akışta" : k.durum === "bitti" ? "Bitti" : "Çıktı"}</Rozet>
              {k.durum === "aktif" && <button type="button" onClick={() => cikar(k.id)} className="text-[11.5px] text-white/45 hover:text-rose-200">Çıkar</button>}
            </li>
          ); })}
        </ul>
      ) : <p className="text-[12.5px] text-white/50">{a.durum === "acik" ? "Henüz kimse girmedi. Tetiğe uyan ilk kişi dakikalar içinde görünür." : "Akış açılınca girenler burada görünür."}</p>}
    </Kart>
  );
}

function TetikPaneli({ acik, kapat, t, degis, kilit, pr, etiketler }: { acik: boolean; kapat: () => void; t: Taslak; degis: (y: Partial<Taslak>) => void; kilit: boolean; pr: BolumProps; etiketler: string[] }) {
  const d = pr.e.d!;
  const s = t.ayar;
  const ayar = (y: Partial<Taslak["ayar"]>) => degis({ ayar: { ...s, ...y } });
  const [ozelGun, setOzelGun] = useState(String(s.gun ?? ""));
  const [ozelOnce, setOzelOnce] = useState(String(s.gunOnce ?? ""));
  const dogumlu = d.kisiler.filter((k) => k.dogum && k.eposta).length;
  return (
    <YanPanel acik={acik} kapat={kapat} baslik="Tetik" alt="Kim, ne zaman akışa girer" alt2={<button type="button" onClick={kapat} className={cn(birincil, "ml-auto")}>Tamam</button>}>
      <div className="space-y-5">
        <ul className="space-y-1.5">
          {TETIKLER.map((x) => { const I = TETIK_SIMGE[x.id]; return (
            <li key={x.id}><button type="button" disabled={kilit && t.tetik !== x.id} onClick={() => degis({ tetik: x.id })} className={cn("flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left transition-colors disabled:opacity-40", t.tetik === x.id ? "bg-white/[0.07] ring-2 ring-inset ring-white" : "bg-white/[0.02] ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.05]")}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06]"><I className="h-4 w-4 text-white/75" /></span>
              <span className="min-w-0 flex-1"><span className="block text-[13px] text-white">{x.ad}</span><span className="block text-[11.5px] leading-snug text-white/50">{x.alt}</span></span>
            </button></li>
          ); })}
        </ul>
        {kilit && <p className="text-[12px] text-white/45">Açık akışın tetiği değiştirilemez; önce durdur.</p>}
        {t.tetik === "hosgeldin" && (
          <div><p className="mb-1.5 text-[12.5px] text-white/60">Kimler girsin</p>
            <div className="space-y-1">{([["abone", "Bülten abonesi olanlar", "İşletme açılır penceresi, bülten formu ve bio sayfası"], ["uye", "Siteye üye olanlar", "Vayra Bulut üyeleri"], ["form", "Onay kutulu form gönderenler", "Formda izin ya da bülten alanı işaretli olanlar"]] as const).map(([k, ad, alt]) => { const sec = !s.kaynak?.length || s.kaynak.includes(k); return (
              <button key={k} type="button" role="checkbox" aria-checked={sec} onClick={() => { const l = s.kaynak?.length ? s.kaynak : (["abone", "uye", "form"] as const).slice(); ayar({ kaynak: sec ? l.filter((x) => x !== k) : [...l, k] }); }} className="flex w-full items-start gap-2.5 rounded-[12px] px-1 py-1.5 text-left"><span className="mt-0.5"><Halka dolu={sec} boyut={18} /></span><span><span className="block text-[13px] text-white">{ad}</span><span className="block text-[11.5px] text-white/45">{alt}</span></span></button>
            ); })}</div></div>
        )}
        {t.tetik === "siparis" && (
          <div className="space-y-3">
            <div className="flex max-w-full overflow-x-auto [scrollbar-width:none]"><Secici id="akis-siparis" kucuk deger={s.ilk ? "ilk" : "her"} set={(v) => ayar({ ilk: v === "ilk" })} l={[{ id: "ilk" as const, ad: "Yalnız ilk sipariş" }, { id: "her" as const, ad: "Her sipariş" }]} /></div>
            <Etiket ad="En az sipariş tutarı (isteğe bağlı)"><input inputMode="numeric" value={s.enAzTutar ?? ""} onChange={(x) => ayar({ enAzTutar: Number(x.target.value.replace(/\D/g, "")) || undefined })} placeholder="TL" className={cn(alan, "h-9")} /></Etiket>
          </div>
        )}
        {t.tetik === "terk-sepet" && <p className="rounded-[12px] bg-white/[0.03] px-3 py-2.5 text-[12.5px] leading-relaxed text-white/65 ring-1 ring-inset ring-white/[0.07]">Ödeme sayfasını açıp 30 dakika içinde ödemeyen canlı müşteri girer. {"{sepet}"} ürünleri, {"{tutar}"} toplamı yazar. Ödeme yaparsa akıştan çıkar.{d.isletme.terkAcik ? " İşletme sekmesindeki terk edilen sepet hatırlatması da açık; birini kapat." : ""}</p>}
        {t.tetik === "dogum-gunu" && (
          <div className="space-y-3">
            <p className="text-[12px] text-white/50">{dogumlu ? `${dogumlu} kişinin doğum günü kayıtlı.` : "Henüz doğum günü kayıtlı kişi yok. Formuna doğum günü alanı ekle ya da Kişiler'den elle yaz."}</p>
            <SecenekMenusu genislik={260} baslik="Ne zaman" deger={[0, 1, 3, 7].includes(s.gunOnce ?? 0) ? String(s.gunOnce ?? 0) : "ozel"} sec={(id) => id !== "ozel" ? ayar({ gunOnce: Number(id) }) : ayar({ gunOnce: Number(ozelOnce) || 2 })} l={[{ id: "0", ad: "Doğum gününde" }, { id: "1", ad: "Bir gün önce" }, { id: "3", ad: "Üç gün önce" }, { id: "7", ad: "Bir hafta önce" }]}
              ozel={{ deger: ozelOnce, set: (v) => { const n = v.replace(/\D/g, "").slice(0, 2); setOzelOnce(n); if (n) ayar({ gunOnce: Math.min(14, Number(n)) }); }, yer: "Kaç gün önce (en çok 14)" }}
              tetik={(ac, a) => <Cip onClick={ac} acik={a} className="pl-3">{s.gunOnce ? `${s.gunOnce} gün önce` : "Doğum gününde"}</Cip>} />
            <Etiket ad="Saat (Türkiye)"><input type="time" value={s.saat ?? "10:00"} onChange={(x) => ayar({ saat: x.target.value || undefined })} className={cn(alan, "h-9 w-[140px] [color-scheme:dark]")} /></Etiket>
          </div>
        )}
        {t.tetik === "geri-kazan" && (
          <div className="space-y-3">
            <SecenekMenusu genislik={260} baslik="Kaç gündür sipariş yok" deger={[60, 90, 120, 180].includes(s.gun ?? 90) ? String(s.gun ?? 90) : "ozel"} sec={(id) => id !== "ozel" ? ayar({ gun: Number(id) }) : ayar({ gun: Number(ozelGun) || 45 })} l={[{ id: "60", ad: "60 gün" }, { id: "90", ad: "90 gün", alt: "Çoğu işletme için önerilen" }, { id: "120", ad: "120 gün" }, { id: "180", ad: "180 gün" }]}
              ozel={{ deger: ozelGun, set: (v) => { const n = v.replace(/\D/g, "").slice(0, 3); setOzelGun(n); if (n) ayar({ gun: Math.max(14, Number(n)) }); }, yer: "Gün sayısı (en az 14)" }}
              tetik={(ac, a) => <Cip onClick={ac} acik={a} className="pl-3">{s.gun ?? 90} gün</Cip>} />
            <Etiket ad="Saat (Türkiye)"><input type="time" value={s.saat ?? "11:00"} onChange={(x) => ayar({ saat: x.target.value || undefined })} className={cn(alan, "h-9 w-[140px] [color-scheme:dark]")} /></Etiket>
          </div>
        )}
        {t.tetik === "randevu" && (
          d.isletme.hizmetler.length ? <SecenekMenusu genislik={300} baslik="Hangi hizmet" deger={s.hizmet || "tum"} sec={(id) => ayar({ hizmet: id === "tum" ? "" : id })} l={[{ id: "tum", ad: "Bütün hizmetler" }, ...d.isletme.hizmetler.map((h) => ({ id: h.id, ad: h.ad }))]}
            tetik={(ac, a) => <Cip onClick={ac} acik={a} className="pl-3">{d.isletme.hizmetler.find((h) => h.id === s.hizmet)?.ad ?? "Bütün hizmetler"}</Cip>} />
            : <p className="text-[12.5px] text-white/50">İşletme sekmesinde randevu hizmeti yok. Randevu açılınca bu akış gelen müşterilere gider.</p>
        )}
        {t.tetik === "etiket" && (
          <Etiket ad="Etiket"><input list="akis-etiketler" value={s.etiket ?? ""} onChange={(x) => ayar({ etiket: x.target.value })} placeholder="vip" className={cn(alan, "h-9")} /><datalist id="akis-etiketler">{etiketler.map((x) => <option key={x} value={x} />)}</datalist></Etiket>
        )}
      </div>
    </YanPanel>
  );
}

function AdimPaneli({ adim, kapat, pr, akis, t, kirli, kaydet, kilit, etiketler, degis, sil }: { adim: Adim | null; kapat: () => void; pr: BolumProps; akis: AkisIstemci; t: Taslak; kirli: boolean; kaydet: () => Promise<boolean>; kilit: boolean; etiketler: string[]; degis: (y: Partial<Adim>) => void; sil: () => void }) {
  const { e, p } = pr;
  const d = e.d!;
  const [deneme, setDeneme] = useState("");
  const [amac, setAmac] = useState("");
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");
  const [modelYok, setModelYok] = useState(false);
  const [ozelSure, setOzelSure] = useState("");
  const [ozelKupon, setOzelKupon] = useState("");
  const marka = markaOzetiIstemci(p, e);
  const ornek = { kupon: (adim?.tur === "eposta" && adim.kupon) || "KUPON", sepet: "1 x Sepetteki ürün\n2 x Başka bir ürün", tutar: "450 TL", siparis_no: "SP-1042", hizmet: "Saç kesimi", yorum_baglantisi: d.isletme.googleProfil || d.site };
  const html = useMemo(() => adim?.tur === "eposta" ? kampanyaHtml({ konu: akisDoldur(adim.konu, ornek), onMetin: akisDoldur(adim.onMetin, ornek), bloklar: akisBloklari(adim.bloklar, ornek) }, marka, { ad: "Ayşe", eposta: "ayse@alanadi.com", davetKodu: "AYS3K2", davetBaglantisi: `${d.site}?davet=AYS3K2` }) : "", [adim, marka.renk, marka.logo, marka.iletisim]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!adim) return <YanPanel acik={false} kapat={kapat} baslik=""><span /></YanPanel>;
  const I = ADIM_SIMGE[adim.tur];
  const yap = async (f: () => Promise<unknown>, ok?: string) => { setHata(""); setBilgi(""); setModelYok(false); try { await f(); if (ok) setBilgi(ok); } catch (x) { if (x instanceof ModelYokEk) setModelYok(true); else setHata(x instanceof Error ? x.message : "İşlem yapılamadı."); } };
  const kuponlar = d.isletme.kuponlar;
  const prof = d.saatProfili;
  return (
    <YanPanel acik={!!adim} kapat={() => { setBilgi(""); setHata(""); kapat(); }} genis={adim.tur === "eposta"} baslik={<span className="flex items-center gap-2"><I className="h-4 w-4 text-white/70" />{ADIM_TURLERI.find((x) => x.id === adim.tur)?.ad}</span>} alt={akis.ad}
      alt2={<>{!kilit && <button type="button" onClick={sil} className="mr-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" />Adımı sil</button>}<button type="button" onClick={kapat} className={cn(birincil, kilit && "ml-auto")}>Tamam</button></>}>
      <div className="space-y-4">
        <AnimatePresence>{hata && <HataSatiri mesaj={hata} kapat={() => setHata("")} />}</AnimatePresence>
        {bilgi && <p className="rounded-[12px] bg-[#55d6fd]/[0.08] px-3 py-2 text-[12.5px] text-[#8be6ff] ring-1 ring-inset ring-[#55d6fd]/20">{bilgi}</p>}
        {adim.tur === "bekle" && (() => { const hazir = [[1, "saat"], [1, "gun"], [3, "gun"], [7, "gun"]] as const; const ozelMi = !hazir.some(([s, b]) => s === adim.sure && b === adim.birim); return (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">{hazir.map(([s, b]) => <button key={`${s}${b}`} type="button" onClick={() => degis({ sure: s, birim: b })} className={cn("h-8 rounded-full px-3 text-[12.5px]", adim.sure === s && adim.birim === b ? "bg-white/[0.08] text-white ring-2 ring-inset ring-white" : "bg-white/[0.04] text-white/70 ring-1 ring-inset ring-white/[0.08] hover:text-white")}>{bekleMetni({ sure: s, birim: b })}</button>)}<span className={cn("h-8 rounded-full px-3 text-[12.5px] leading-8", ozelMi ? "bg-white/[0.08] text-white ring-2 ring-inset ring-white" : "text-white/45")}>Özel</span></div>
            <div className="flex items-center gap-2"><input inputMode="numeric" value={ozelSure || String(adim.sure)} onChange={(x) => { const n = x.target.value.replace(/\D/g, "").slice(0, 3); setOzelSure(n); if (Number(n) > 0) degis({ sure: Number(n) }); }} aria-label="Süre" className={cn(alan, "h-9 w-[90px] tabular-nums")} /><Secici id="akis-birim" kucuk deger={adim.birim} set={(b) => degis({ birim: b })} l={[{ id: "dakika" as const, ad: "dakika" }, { id: "saat" as const, ad: "saat" }, { id: "gun" as const, ad: "gün" }]} /></div>
            <p className="text-[12px] text-white/45">Kişi bu adıma gelince {bekleMetni(adim)} bekler, sonra sıradaki adıma geçer.</p>
          </div>
        ); })()}
        {adim.tur === "kosul" && (
          <div className="space-y-3">
            <SecenekMenusu genislik={340} baslik="Koşul" deger={adim.kosul} sec={(id) => degis({ kosul: id as KosulTur })} l={KOSULLAR.map((k) => ({ id: k.id, ad: k.ad, alt: k.alt }))}
              tetik={(ac, a) => <Cip onClick={ac} acik={a} className="pl-3"><GitBranch className="h-3.5 w-3.5 text-white/50" />{KOSULLAR.find((k) => k.id === adim.kosul)?.ad}</Cip>} />
            {KOSULLAR.find((k) => k.id === adim.kosul)?.deger === "etiket" && <Etiket ad="Etiket"><input list="akis-etiketler-k" value={adim.deger ?? ""} onChange={(x) => degis({ deger: x.target.value })} className={cn(alan, "h-9")} /><datalist id="akis-etiketler-k">{etiketler.map((x) => <option key={x} value={x} />)}</datalist></Etiket>}
            {KOSULLAR.find((k) => k.id === adim.kosul)?.deger === "sayi" && <Etiket ad={adim.kosul === "harcama" ? "En az tutar (TL)" : "En az sipariş"}><input inputMode="numeric" value={adim.deger ?? ""} onChange={(x) => degis({ deger: x.target.value.replace(/\D/g, "") })} className={cn(alan, "h-9 w-[160px]")} /></Etiket>}
            <p className="text-[12px] leading-relaxed text-white/45">Koşul, kişi bu adıma geldiği an denetlenir. Evet dalı ve hayır dalı bitince akış koşuldan sonraki adımla sürer.</p>
          </div>
        )}
        {adim.tur === "etiket" && <Etiket ad="Eklenecek etiket"><input list="akis-etiketler-e" value={adim.etiket} onChange={(x) => degis({ etiket: x.target.value })} placeholder="hosgeldin-tamam" className={cn(alan, "h-9")} /><datalist id="akis-etiketler-e">{etiketler.map((x) => <option key={x} value={x} />)}</datalist></Etiket>}
        {adim.tur === "eposta" && (
          <div className="space-y-4">
            <Etiket ad="Adım adı"><input value={adim.ad} onChange={(x) => degis({ ad: x.target.value })} maxLength={60} className={cn(alan, "h-9")} /></Etiket>
            <Etiket ad="Konu satırı" sag={<span className={cn("text-[11.5px] tabular-nums", [...adim.konu].length > 60 ? "text-amber-200/90" : "text-white/40")}>{[...adim.konu].length} karakter</span>}><input value={adim.konu} onChange={(x) => degis({ konu: x.target.value })} maxLength={150} className={cn(alan, "h-10")} /></Etiket>
            {!!adim.konu && <ul className="flex flex-wrap gap-1.5">{konuIpuclari(adim.konu).map((x) => <li key={x.metin}><Rozet ton={x.iyi ? "aksan" : "amber"} className="h-6 text-[11px]">{x.metin}</Rozet></li>)}</ul>}
            <Etiket ad="Önizleme metni"><input value={adim.onMetin} onChange={(x) => degis({ onMetin: x.target.value })} maxLength={150} className={cn(alan, "h-9")} /></Etiket>
            <div className="flex flex-wrap gap-2">
              <SecenekMenusu genislik={320} baslik="Gönderim saati" deger={adim.saat} sec={(id) => degis({ saat: id as AdimEposta["saat"], ...(id === "sabit" && !adim.sabitSaat ? { sabitSaat: saatYaz(prof.enIyiSaat) } : {}) })} l={GONDERIM_SAATLERI.map((x) => ({ id: x.id, ad: x.ad, alt: x.id === "kisisel" ? `${x.alt}. Proje: ${saatYaz(prof.enIyiSaat)}${prof.toplam < 10 ? " (veri az, varsayılan)" : ""}` : x.alt }))}
                tetik={(ac, a) => <Cip onClick={ac} acik={a} className="pl-3">{GONDERIM_SAATLERI.find((x) => x.id === adim.saat)?.ad}</Cip>} />
              {adim.saat === "sabit" && <input type="time" value={adim.sabitSaat ?? ""} onChange={(x) => degis({ sabitSaat: x.target.value || undefined })} aria-label="Saat" className="h-8 rounded-full bg-white/[0.05] px-3 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/[0.08] [color-scheme:dark]" />}
              <SecenekMenusu genislik={320} baslik="Kupon ({kupon} etiketine yazılır)" deger={!adim.kupon ? "yok" : kuponlar.some((k) => k.kod === adim.kupon) ? adim.kupon : "ozel"} sec={(id) => id === "ozel" ? degis({ kupon: ozelKupon.toUpperCase() || adim.kupon }) : degis({ kupon: id === "yok" ? undefined : id })}
                l={[{ id: "yok", ad: "Kupon yok" }, ...kuponlar.map((k) => ({ id: k.kod, ad: k.kod, alt: `${k.ozet}${k.bitis ? `, ${k.bitis} tarihine kadar` : ""}` }))]}
                ozel={{ deger: ozelKupon, set: (v) => { setOzelKupon(v.toUpperCase()); degis({ kupon: v.toUpperCase() || undefined }); }, yer: "İşletme'deki kupon kodu", alt: "Kodu kendin yaz; İşletme'de etkin olmalı" }}
                tetik={(ac, a) => <Cip onClick={ac} acik={a} className="pl-3"><Tag className="h-3.5 w-3.5 text-white/50" />{adim.kupon || "Kupon yok"}</Cip>} />
            </div>
            {!kuponlar.length && <p className="text-[11.5px] text-white/45">İşletme sekmesinde etkin kupon yok. Kupon ödemede gerçekten uygulanır; Büyüme'deki tavsiye kodları uygulanmaz.</p>}
            <div className="rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
              <div className="flex gap-2"><input value={amac} onChange={(x) => setAmac(x.target.value)} maxLength={300} placeholder="Yapay zekâya ne anlatsın? İlk siparişe yüzde 10 indirim hatırlat" className={cn(alan, "h-9 min-w-0 flex-1 text-[12.5px]")} /><button type="button" disabled={e.suruyor("akis-eposta-yaz")} onClick={() => yap(async () => { if (kirli && !(await kaydet())) throw new Error("Önce değişiklikler kaydedilmeli."); await e.islem("akis-eposta-yaz", { akisId: akis.id, adimId: adim.id, amac: amac.trim() }, "akis-eposta-yaz"); }, "Yazıldı; metni gözden geçir.")} className={cn(ikincil, "h-9")}>{e.suruyor("akis-eposta-yaz") ? <span className="build-nokta" /> : <Wand2 className="h-3.5 w-3.5" />}Yaz</button></div>
              {e.suruyor("akis-eposta-yaz") && <Suruyor className="mt-2" metin="E-posta yazılıyor" alt="Ajan akışın amacını, siteni ve marka kitini okuyor." />}
              {modelYok && <div className="mt-2"><ModelYokKart /></div>}
            </div>
            <div><p className="mb-1.5 text-[12.5px] text-white/60">İçerik</p><p className="mb-2 text-[11.5px] text-white/45">Kişiselleştirme: {AKIS_ETIKETLERI.map((x) => <code key={x} className="sc-kod mr-1 rounded-[5px] bg-white/[0.07] px-1 text-[11px] text-white/80">{x}</code>)}</p>
              <BlokListesi bloklar={adim.bloklar} set={(l) => degis({ bloklar: l })} site={d.site} /></div>
            <div className="overflow-hidden rounded-[14px] bg-[#f4f5f7]">
              <div className="border-b border-black/10 bg-white px-3.5 py-2.5"><p className="truncate text-[12px] text-black/55">{p.ad}</p><p className="truncate text-[13px] font-semibold text-black">{akisDoldur(adim.konu || "Konu satırı yok", ornek).replace(/\{ad\}/g, "Ayşe").replace(/\{site\}/g, p.ad)}</p></div>
              <iframe title="Akış e-postası önizlemesi" sandbox="" srcDoc={html} className="block h-[520px] w-full bg-[#f4f5f7]" />
            </div>
            <div className="rounded-[14px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
              <p className="text-[13px] font-medium text-white">Deneme gönderimi</p>
              <p className="mt-0.5 text-[12px] text-white/50">Konu başına "Deneme:" eklenir; etiketler örnek değerlerle dolar, izleme yapılmaz.</p>
              <div className="mt-2.5 flex gap-2"><input value={deneme} onChange={(x) => setDeneme(x.target.value)} type="email" placeholder="sen@alanadi.com" className={cn(alan, "h-9 min-w-0 flex-1")} /><button type="button" disabled={!d.eposta.kurulu || !deneme.trim() || e.suruyor("akis-deneme")} onClick={() => yap(async () => { if (kirli && !(await kaydet())) throw new Error("Önce kaydedilmeli."); await e.islem("akis-deneme", { akisId: akis.id, adimId: adim.id, kime: deneme.trim() }, "akis-deneme"); }, `${deneme.trim()} adresine gönderildi.`)} className={cn(ikincil, "h-9")}>{e.suruyor("akis-deneme") ? <span className="build-nokta" /> : <Send className="h-3.5 w-3.5" />}Gönder</button></div>
              {!d.eposta.kurulu && <p className="mt-1.5 text-[11.5px] text-amber-200/80">E-posta servisi kurulu değil.</p>}
            </div>
          </div>
        )}
        {kilit && adim.tur !== "eposta" && <p className="text-[12px] text-white/45">Akış açık: bu adımın ayarı değişebilir ama adım silinemez.</p>}
      </div>
    </YanPanel>
  );
}

/** Kişiler ve E-posta'dan kullanılan özet: akış sayısı ve simge. */
export const OtomasyonSimge = Workflow;
