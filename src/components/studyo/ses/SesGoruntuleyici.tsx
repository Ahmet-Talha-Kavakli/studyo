"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { KenarTutamac, useKenarStili } from "@/components/ui/KenarTutamac";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, X, Pencil, Info, Wand2, MessageCircle, Play, Pause, RotateCcw, RotateCw,
  Copy, RefreshCw, Download, Heart, Trash2, Volume2, VolumeX, FileText, AudioLines, Captions, Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { kopyala } from "@/lib/gercekEylem";
import { toast } from "@/lib/toast";
import { Yuzen } from "@/components/ui/Yuzen";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { paylasimBaglantisi } from "@/components/paylasim/paylas";
import { CIKTI_BICIMLERI, DILLER, SESLER, etiketRengi } from "@/lib/sesVeri";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { sesCalici, useCalici, sureYaz, type CalKaynak } from "@/lib/sesCalici";
import { Dalga, SesAvatar, altyaziUret, metinIndir, dosyaKoku, type Kelime } from "./ortak";
import { useOdakTuzagi } from "@/hooks/useOdakTuzagi";

const HIZLAR = [0.75, 1, 1.25, 1.5, 2];
const MOD_AD: Record<string, string> = { seslendirme: "Seslendirme", diyalog: "Diyalog", efekt: "Ses efekti", sesdegistir: "Ses değiştirme", ceviri: "Çeviri", temizle: "Ses temizleme", transkript: "Transkript" };
const KONUSMACI_RENK = ["#7dd3fc", "#f0abfc", "#fcd34d", "#86efac", "#fda4af", "#c4b5fd"];

/** Çıktı biçiminin dosya uzantısı (ör. "mp3_44100_128" → "mp3"); bilinmiyorsa "mp3". */
export function bicimUzantisi(meta?: { bicim?: string }): string {
  const b = meta?.bicim;
  return (b && (CIKTI_BICIMLERI.find((x) => x.id === b)?.uzanti ?? b.split("_")[0])) || "mp3";
}

/** Bir ses üretiminin çalınabilir kaynağı: gerçek dosya ya da (demo) tarayıcı sesi. */
export function uretimKaynagi(u: Uretim): CalKaynak | null {
  if (u.sesUrl) return { tur: "dosya", url: u.sesUrl };
  const m = u.meta;
  const metin = ((m?.hamIstem as string | undefined) ?? "").trim();
  const cinsiyetBul = (ad?: string) => SESLER.find((s) => s.ad === ad)?.cinsiyet ?? (ad && /kadın/i.test(ad) ? "Kadın" : "Erkek");
  if (m?.mod === "diyalog" && m.diyalog?.length) {
    return { tur: "tarayici", metin: m.diyalog.map((s) => s.metin).join(" "), dil: m.dil, cinsiyet: "Nötr",
      parcalar: m.diyalog.map((s) => ({ metin: s.metin, cinsiyet: cinsiyetBul(s.ses) })) };
  }
  if (!metin || (m?.mod && m.mod !== "seslendirme")) return null;
  return { tur: "tarayici", metin, dil: m?.dil, cinsiyet: cinsiyetBul(m?.ses), hiz: m?.hiz };
}

export function SesGoruntuleyici({
  u, sira, onGez, onKapat, onAdKaydet, yorumlar, yorumSayisi, ustKatmanAcik = false,
  onAyarlariYukle, onYenidenUret, ucretsizHak = 0, yenidenUretilemez, onIndir, onBegen, onSil, onSeslendir,
}: {
  u: Uretim; sira: { i: number; n: number } | null; onGez: (yon: 1 | -1) => void; onKapat: () => void;
  onAdKaydet: (ad: string) => void; yorumlar: ReactNode; yorumSayisi: number; ustKatmanAcik?: boolean;
  onAyarlariYukle: () => void; onYenidenUret: () => void; ucretsizHak?: number;
  /** Yeniden üretim yapılamıyorsa nedeni (ör. kaynak dosya saklanmadı). */
  yenidenUretilemez?: string;
  onIndir: () => void; onBegen: () => void; onSil: () => void;
  /** Transkript metnini seslendirme editörüne aktarır ("Bu metni seslendir"). */
  onSeslendir?: (metin: string) => void;
  /** Paylaşım bağlantısı altyapısı yok — bilerek desteklenmiyor. */
}) {
  const yanBoy = useKenarStili("goruntuleyici-ses", 380);
  const [sekme, setSekme] = useState<"bilgi" | "yorumlar">("bilgi");
  const [adDuzen, setAdDuzen] = useState(false);
  const [adTaslak, setAdTaslak] = useState(u.baslik);
  const [indirAcik, setIndirAcik] = useState(false);
  const [mobil, setMobil] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(max-width: 767px)");
    const g = () => setMobil(q.matches); g();
    q.addEventListener("change", g); return () => q.removeEventListener("change", g);
  }, []);
  const cal = useCalici();
  const kaynak = uretimKaynagi(u);
  const benim = cal.id === u.id;
  const calisiyor = benim && cal.calisiyor;
  const oran = benim && cal.toplam ? cal.an / cal.toplam : 0;
  const dosya = kaynak?.tur === "dosya";

  useEffect(() => { setAdTaslak(u.baslik); setAdDuzen(false); }, [u.id, u.baslik]);
  // Görüntüleyici kapanınca ya da başka sese geçince çalan bu sesse durur.
  useEffect(() => () => { if (sesCalici.durum().id === u.id) sesCalici.durdur(); }, [u.id]);

  const oynat = () => {
    if (!kaynak) return;
    if (calisiyor) sesCalici.duraklat();
    else void sesCalici.cal(u.id, kaynak);
  };

  useEffect(() => {
    const t = (e: KeyboardEvent) => {
      if (ustKatmanAcik) return;
      if (e.key === "Escape") { e.preventDefault(); onKapat(); return; }
      const h = e.target as HTMLElement;
      if (/INPUT|TEXTAREA|SELECT/.test(h.tagName) || h.isContentEditable) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); onGez(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); onGez(1); }
      if (e.key === " " && h.tagName !== "BUTTON") { e.preventDefault(); oynat(); }
    };
    window.addEventListener("keydown", t);
    return () => window.removeEventListener("keydown", t);
  });

  const adKaydet = () => { setAdDuzen(false); const y = adTaslak.trim(); if (y && y !== u.baslik) onAdKaydet(y); else setAdTaslak(u.baslik); };
  const m = u.meta;
  const istem = ((m?.hamIstem as string | undefined) ?? "").trim();
  const sesModel = SESLER.find((s) => s.ad === m?.ses);
  const dilAd = (kod?: string) => DILLER.find((d) => d.kod === kod)?.ad.toLocaleLowerCase("tr").replace(/^\p{L}/u, (c) => c.toLocaleUpperCase("tr"));
  const demo = u.gercek === false || !u.sesUrl;
  const tarih = new Date(u.olusturma).toLocaleString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const satirlar: [string, ReactNode][] = [
    ["İşlem", MOD_AD[m?.mod ?? "seslendirme"] ?? "Seslendirme"],
    ...(m?.ses ? [["Ses", <span key="s" className="flex items-center gap-1.5"><SesAvatar ad={m.ses} renk={sesModel?.renk ?? "#6d6bff"} boyut={18} />{m.ses}</span>] as [string, ReactNode]] : []),
    ["Model", u.model],
    ...(m?.dil ? [["Dil", dilAd(m.dil) ?? m.dil] as [string, ReactNode]] : []),
    ...(m?.hedefDil ? [["Hedef dil", dilAd(m.hedefDil) ?? m.hedefDil] as [string, ReactNode]] : []),
    ...(typeof m?.hiz === "number" && m.hiz !== 1 ? [["Hız", `${m.hiz.toFixed(2).replace(/\.?0+$/, "").replace(".", ",")}×`] as [string, ReactNode]] : []),
    ...(typeof m?.kararlilik === "number" ? [["Kararlılık", `%${Math.round(m.kararlilik * 100)}`] as [string, ReactNode]] : []),
    ...(typeof m?.benzerlik === "number" ? [["Benzerlik", `%${Math.round(m.benzerlik * 100)}`] as [string, ReactNode]] : []),
    ...(typeof m?.stil === "number" && m.stil > 0 ? [["Stil", `%${Math.round(m.stil * 100)}`] as [string, ReactNode]] : []),
    ...(m?.mod === "diyalog" && m.diyalog ? [["Konuşmacılar", [...new Set(m.diyalog.map((s) => s.ses ?? "?"))].join(", ")] as [string, ReactNode]] : []),
    ...(m?.mod === "efekt" ? [["Süre", typeof m.efektSn === "number" ? `${String(m.efektSn).replace(".", ",")} sn` : "Otomatik"] as [string, ReactNode], ["Döngü", m.dongu ? "Açık" : "Kapalı"] as [string, ReactNode], ["İstem etkisi", `%${Math.round((m.istemEtkisi ?? 0.3) * 100)}`] as [string, ReactNode]] : []),
    ...(m?.bicim && !demo ? [["Biçim", m.bicim.replace(/_/g, " · ").replace("44100", "44,1 kHz").replace("48000", "48 kHz")] as [string, ReactNode]] : []),
    ...(typeof m?.tohum === "number" ? [["Tohum (seed)", String(m.tohum)] as [string, ReactNode]] : []),
    ...(m?.kaynakAd ? [["Kaynak dosya", m.kaynakAd] as [string, ReactNode]] : []),
    ...(typeof m?.karakter === "number" ? [["Karakter", m.karakter.toLocaleString("tr-TR")] as [string, ReactNode]] : []),
    ...(dosya && benim && cal.toplam ? [["Süre", sureYaz(cal.toplam)] as [string, ReactNode]] : []),
    ["Kredi", u.kredi ? String(u.kredi) : "Ücretsiz"],
    ["Oluşturma", tarih],
    ...(m?.algilananDil ? [["Algılanan dil", dilAd(m.algilananDil) ?? m.algilananDil] as [string, ReactNode]] : []),
  ];
  const kelimeler: Kelime[] = m?.kelimeler ?? [];
  const transkript = m?.mod === "transkript" ? (m.transkript ?? "").trim() : "";
  const kok = dosyaKoku(u.baslik);
  const altyaziIndir = (tur: "srt" | "vtt") => { metinIndir(`${kok}.${tur}`, altyaziUret(kelimeler, tur), tur === "vtt" ? "text/vtt" : "application/x-subrip"); toast.success("Altyazı indirildi", { description: `${kok}.${tur}` }); };
  const txtIndir = () => { metinIndir(`${kok}.txt`, transkript); toast.success("Metin indirildi", { description: `${kok}.txt` }); };
  const konumaGit = (sn: number) => {
    if (benim) sesCalici.konum(sn);
    else if (kaynak) void sesCalici.cal(u.id, kaynak).then(() => sesCalici.konum(sn));
  };
  const indirSecenek = [
    { ad: `Ses dosyası (.${bicimUzantisi(m)})`, I: Download, f: onIndir, kapali: !u.sesUrl },
    ...(kelimeler.length ? [{ ad: "Altyazı (.srt)", I: Captions, f: () => altyaziIndir("srt"), kapali: false }, { ad: "Altyazı (.vtt)", I: Captions, f: () => altyaziIndir("vtt"), kapali: false }] : []),
    ...(transkript ? [{ ad: "Metin (.txt)", I: FileText, f: txtIndir, kapali: false }] : []),
  ];

  const [paylasiliyor, setPaylasiliyor] = useState(false);
  const paylasilir = !!u.sesUrl?.startsWith("/api/dosya/ses/");
  const paylas = async () => {
    if (!u.sesUrl || paylasiliyor) return;
    setPaylasiliyor(true);
    const m = u.meta ?? {};
    const id = await paylasimBaglantisi({
      tur: "ses", url: u.sesUrl, baslik: u.baslik, alt: [m.ses, u.model].filter(Boolean).join(" · "),
      metin: m.transkript ?? ((m.hamIstem as string | undefined) ?? u.prompt ?? "").replace(/\[[^\]\n]{1,40}\]\s*/g, ""), kelimeler: m.kelimeler,
    }, m.paylasimId);
    if (id && id !== m.paylasimId) useProjeler.getState().guncelle(u.id, { meta: { ...m, paylasimId: id } });
    setPaylasiliyor(false);
  };
  const odakRef = useOdakTuzagi();
  const renk = sesModel?.renk ?? "#6d6bff";
  const sahneMetni = m?.mod === "transkript" ? transkript : istem || u.prompt || "";
  const ilerliyor = benim && (calisiyor || oran > 0);
  const toplamSn = dosya && benim && cal.toplam ? cal.toplam : typeof m?.sureSn === "number" ? m.sureSn : null;
  const ikon = "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/[0.085] hover:text-metin disabled:pointer-events-none disabled:opacity-35";
  const sahneIkon = "flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.085] text-white/85 transition-colors hover:bg-white/[0.14] hover:text-white";

  /* Sahnede okunan metin: çalarken okunan kısım parlak, kalanı soluk (kelime zamanı varsa kelime kelime). */
  const sahne = (() => {
    if (dosya && kelimeler.length && m?.mod !== "transkript") return <Karaoke kelimeler={kelimeler} an={benim ? cal.an : -1} onGit={konumaGit} />;
    if (m?.mod === "diyalog" && m.diyalog?.length) {
      return (
        <div className="space-y-3">
          {m.diyalog.map((s, i) => {
            const r = SESLER.find((x) => x.ad === s.ses)?.renk ?? KONUSMACI_RENK[i % KONUSMACI_RENK.length];
            return (
              <p key={i} className="text-[20px] leading-relaxed text-white/90 max-md:text-[16px]">
                <span className="mr-2 inline-flex items-center gap-1.5 align-middle text-[13px] font-semibold" style={{ color: `color-mix(in srgb, ${r} 60%, white)` }}><SesAvatar ad={s.ses ?? "?"} renk={r} boyut={18} />{s.ses}</span>
                {etiketliMetin(s.metin)}
              </p>
            );
          })}
        </div>
      );
    }
    if (!sahneMetni) return <p className="text-[18px] text-white/50">Bu işlemde metin yok; kaynak dosya dönüştürüldü.</p>;
    const kes = ilerliyor ? Math.round(oran * sahneMetni.length) : sahneMetni.length;
    return (
      <p className="whitespace-pre-wrap break-words text-[24px] leading-[1.6] tracking-[-0.01em] max-md:text-[17px]">
        <span className="text-white">{etiketliMetin(sahneMetni.slice(0, kes))}</span>
        <span className="text-white/40 transition-colors">{etiketliMetin(sahneMetni.slice(kes))}</span>
      </p>
    );
  })();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }} transition={{ duration: 0.18 }}
      className="perde fixed inset-0 z-[60] flex flex-col overflow-hidden bg-black/90 md:flex-row" ref={odakRef} role="dialog" aria-modal="true" aria-label={u.baslik} onClick={onKapat}>
      {/* ── Sahne ── */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(50% 40% at 50% 40%, ${renk}18, transparent 70%)` }} />
        <div className="relative z-10 flex items-center gap-2 p-4 md:p-5">
          <button onClick={onKapat} className={sahneIkon} aria-label="Kapat (Esc)"><X className="h-5 w-5" /></button>
          <span className="flex-1" />
          {sira && sira.n > 1 && (
            <span className="flex items-center gap-1">
              <button onClick={() => onGez(-1)} disabled={sira.i === 0} className={cn(sahneIkon, "h-9 w-9 disabled:opacity-30")} aria-label="Önceki (←)"><ChevronLeft className="h-5 w-5" /></button>
              <span className="min-w-[52px] text-center text-[13px] tabular-nums text-white/70">{sira.i + 1} / {sira.n}</span>
              <button onClick={() => onGez(1)} disabled={sira.i >= sira.n - 1} className={cn(sahneIkon, "h-9 w-9 disabled:opacity-30")} aria-label="Sonraki (→)"><ChevronRight className="h-5 w-5" /></button>
            </span>
          )}
        </div>

        <div className="relative z-[1] mx-auto flex min-h-0 w-full max-w-[780px] flex-1 flex-col justify-center px-5 pb-5 md:px-10 md:pb-16">
          <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 380, damping: 34 }} className="flex min-h-0 flex-col">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] text-white/60">
              <SesAvatar ad={m?.ses ?? u.id} renk={renk} boyut={26} aktif={calisiyor} />
              <span className="font-semibold text-white">{m?.ses ?? MOD_AD[m?.mod ?? "seslendirme"]}</span>
              <span>·</span>
              <span className="flex items-center gap-1.5"><ModelLogo ad={u.model} boyut={12} />{u.model}</span>
              {toplamSn !== null && <><span>·</span><span className="tabular-nums">{sureYaz(toplamSn)}</span></>}
              
            </div>
            <div className="mt-5 max-h-[52vh] min-h-0 overflow-y-auto pr-1 [scrollbar-width:thin] md:mt-6">{sahne}</div>
          </motion.div>

          {/* Oynatıcı */}
          <div className="mt-7 shrink-0 rounded-[20px] bg-white/[0.065] p-3 ring-1 ring-inset ring-white/[0.08] md:p-3.5">
            <div className="flex items-center gap-3">
              <motion.button whileTap={{ scale: 0.92 }} onClick={oynat} disabled={!kaynak} aria-label={calisiyor ? "Duraklat" : "Oynat"}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#0b0c0e] disabled:opacity-40">
                {calisiyor ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
              </motion.button>
              {dosya && <button onClick={() => sesCalici.atla(-10)} disabled={!benim} aria-label="10 saniye geri" className={cn(ikon, "max-md:hidden")}><RotateCcw className="h-4 w-4" /></button>}
              <div className="min-w-0 flex-1">
                <Dalga url={u.sesUrl} tohum={u.id} n={mobil ? 48 : 110} oran={oran} sus={!dosya} className="h-10 w-full" toplamSn={toplamSn ?? undefined}
                  onKonum={dosya ? (o) => { if (!benim && kaynak) void sesCalici.cal(u.id, kaynak).then(() => sesCalici.konum(o * sesCalici.durum().toplam)); else sesCalici.konum(o * cal.toplam); } : undefined} />
              </div>
              {dosya && <button onClick={() => sesCalici.atla(10)} disabled={!benim} aria-label="10 saniye ileri" className={cn(ikon, "max-md:hidden")}><RotateCw className="h-4 w-4" /></button>}
              <span className="shrink-0 text-[12.5px] tabular-nums text-white/60">
                {dosya ? `${sureYaz(benim ? cal.an : 0)}${toplamSn !== null ? ` / ${sureYaz(toplamSn)}` : ""}` : benim && cal.toplam ? `%${Math.round(oran * 100)}` : toplamSn !== null ? `yaklaşık ${sureYaz(toplamSn)}` : ""}
              </span>
              {dosya && (
                <button onClick={() => { const i = HIZLAR.indexOf(cal.hiz); sesCalici.hiz(HIZLAR[(i + 1) % HIZLAR.length]); }} aria-label={`Oynatma hızı ${cal.hiz}×`} title="Oynatma hızı"
                  className="h-8 shrink-0 rounded-full px-2.5 text-[12.5px] font-semibold tabular-nums text-white/75 transition-colors hover:bg-white/[0.08] hover:text-white">{String(cal.hiz).replace(".", ",")}×</button>
              )}
              {dosya && (
                <button onClick={() => sesCalici.duzey(cal.duzey === 0 ? 1 : 0)} aria-label={cal.duzey === 0 ? "Sesi aç" : "Sesi kapat"} className={cn(ikon, "max-md:hidden")}>
                  {cal.duzey === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>
          {(benim && (cal.uyari || cal.hata)) || !kaynak ? (
            <p className={cn("mt-2.5 text-center text-[12.5px]", benim && cal.hata ? "text-rose-300" : "text-white/45")}>
              {benim && cal.hata ? cal.hata : !kaynak ? "Bu üretimin çalınabilir sesi yok." : benim && cal.uyari ? cal.uyari : ""}
            </p>
          ) : null}
        </div>
      </div>

      {/* ── Sağ panel ── */}
      <motion.aside initial={mobil ? { y: 320, opacity: 0 } : { x: 380, opacity: 0 }} animate={{ x: 0, y: 0, opacity: 1 }}
        exit={mobil ? { y: 320, opacity: 0, transition: { duration: 0.15, ease: "easeIn" } } : { x: 380, opacity: 0, transition: { duration: 0.15, ease: "easeIn" } }} transition={{ type: "spring", stiffness: 380, damping: 38 }}
        onClick={(e) => e.stopPropagation()}
        style={yanBoy.stil} className="flex w-full shrink-0 flex-col overflow-hidden bg-[#141517] max-md:max-h-[55vh] max-md:rounded-t-[24px] relative md:w-[var(--yan-en)] md:border-l md:border-white/[0.07]">
        <KenarTutamac en={yanBoy.en} anahtar={yanBoy.anahtar} varsayilan={yanBoy.varsayilan} min={yanBoy.min} max={yanBoy.max} etiket="Panelin genişliği" />
        <span className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/15 md:hidden" aria-hidden />
        <div className="flex items-start gap-2 px-4 pb-3 pt-4">
          <div className="min-w-0 flex-1">
            {adDuzen ? (
              <input autoFocus value={adTaslak} maxLength={60} onChange={(e) => setAdTaslak(e.target.value)} onBlur={adKaydet}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); adKaydet(); } if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setAdTaslak(u.baslik); setAdDuzen(false); } }}
                aria-label="Ses adı" className="w-full rounded-[9px] bg-white/[0.075] px-2 py-1 text-[15px] font-semibold text-metin outline-none ring-1 ring-aksan/50" />
            ) : (
              <button onClick={() => setAdDuzen(true)} className="group/ad flex w-full min-w-0 items-center gap-1.5 rounded-[9px] px-2 py-1 text-left transition-colors hover:bg-white/[0.065]" title="Adı düzenle (indirme dosya adı olur)">
                <span className="truncate text-[15px] font-semibold text-metin">{u.baslik}</span>
                <Pencil className="h-3.5 w-3.5 shrink-0 text-metin-3 group-hover/ad:text-metin" />
              </button>
            )}
            <p className="truncate px-2 text-[12.5px] text-metin-3">{MOD_AD[m?.mod ?? "seslendirme"]} · {tarih}</p>
          </div>
          <button onClick={onKapat} className={ikon} aria-label="Kapat"><X className="h-4 w-4" /></button>
        </div>

        {/* Eylemler */}
        <div className="flex items-center gap-1 px-4 pb-3">
          <motion.button whileTap={{ scale: 0.97 }} onClick={onYenidenUret} disabled={!!yenidenUretilemez}
            title={yenidenUretilemez ?? (ucretsizHak ? `Aynı metin ve ayarla ücretsiz · ${ucretsizHak} hak kaldı` : "Aynı ayarlarla yeniden üret")}
            className="hf-cta mr-1 flex h-10 flex-1 items-center justify-center gap-2 !rounded-full text-[14px] font-semibold disabled:cursor-not-allowed disabled:opacity-50">
            <RefreshCw className="h-4 w-4" />{ucretsizHak ? "Ücretsiz yeniden üret" : "Yeniden üret"}
            {ucretsizHak > 0 && <span className="rounded-full bg-black/20 px-1.5 py-px text-[11.5px] font-semibold tabular-nums">{ucretsizHak}</span>}
          </motion.button>
          {indirSecenek.length > 1 ? (
            <div className="relative">
              <button onClick={() => setIndirAcik((v) => !v)} aria-label="İndir" aria-haspopup="menu" aria-expanded={indirAcik} title="İndir" className={cn(ikon, indirAcik && "bg-white/[0.08] text-metin")}><Download className="h-4 w-4" /></button>
              <AnimatePresence>
                <Yuzen acik={indirAcik} onKapat={() => setIndirAcik(false)} yerlesim="alt-sag" bosluk={8} etiket="İndir" className="w-56 rounded-[16px] border border-white/[0.09] bg-[#1b1c1f] p-1.5">
                  {indirSecenek.map(({ ad, I, f, kapali }) => (
                    <button key={ad} role="menuitem" disabled={kapali} onClick={() => { f(); setIndirAcik(false); }} title={kapali ? "Örnek çıktı dosya değildir; indirilemez" : undefined}
                      className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] text-metin transition-colors hover:bg-white/[0.065] disabled:cursor-not-allowed disabled:text-metin-3">
                      <I className="h-4 w-4 text-metin-2" />{ad}
                    </button>
                  ))}
                </Yuzen>
              </AnimatePresence>
            </div>
          ) : (
            <button onClick={onIndir} disabled={!u.sesUrl} aria-label="İndir" title={u.sesUrl ? "Ses dosyasını indir" : "Örnek çıktı dosya değildir; indirilemez"} className={ikon}><Download className="h-4 w-4" /></button>
          )}
          <button onClick={() => void paylas()} disabled={!paylasilir || paylasiliyor} aria-label="Paylaş" title={paylasilir ? "Herkese açık bağlantı oluştur ve kopyala" : "Yalnız sağlayıcıyla üretilmiş ses paylaşılabilir"} className={ikon}><Share2 className="h-4 w-4" /></button>
          <motion.button whileTap={{ scale: 0.85 }} onClick={onBegen} aria-label={u.favori ? "Beğeniyi kaldır" : "Beğen"} aria-pressed={!!u.favori} className={cn(ikon, u.favori && "text-rose-400 hover:text-rose-400")}>
            <Heart className={cn("h-4 w-4", u.favori && "fill-current")} />
          </motion.button>
          <button onClick={onSil} aria-label="Sil" title="Sil" className={cn(ikon, "hover:bg-rose-500/10 hover:text-rose-300")}><Trash2 className="h-4 w-4" /></button>
        </div>
        {yenidenUretilemez && <p className="px-4 pb-3 text-[12px] text-metin-3">{yenidenUretilemez}</p>}

        <div className="border-y border-white/[0.06] px-4 py-2.5">
          <div role="tablist" className="isolate grid grid-cols-2 gap-0.5 rounded-full bg-white/[0.055] p-[3px] ring-1 ring-inset ring-white/[0.06]">
            {([["bilgi", "Bilgi", Info, 0], ["yorumlar", "Yorumlar", MessageCircle, yorumSayisi]] as const).map(([id, a, I, n]) => (
              <button key={id} role="tab" aria-selected={sekme === id} onClick={() => setSekme(id)}
                className={cn("relative flex h-8 items-center justify-center gap-1.5 rounded-full text-[13px] font-medium transition-colors", sekme === id ? "text-metin" : "text-metin-2 hover:text-metin")}>
                {sekme === id && <motion.span layoutId="ses-goruntu-sekme" transition={{ type: "spring", stiffness: 420, damping: 32 }} className="absolute inset-0 -z-10 rounded-full bg-white/[0.12]" />}
                <I className={cn("h-3.5 w-3.5", sekme === id && "text-aksan")} />{a}{n > 0 && <span className="rounded-full bg-white/10 px-1.5 text-[11px] tabular-nums">{n}</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
          {sekme === "yorumlar" ? yorumlar : (
            <>
              {m?.mod === "transkript" && <TranskriptKart metin={transkript} kelimeler={kelimeler} an={benim ? cal.an : -1} onGit={dosya ? konumaGit : undefined}
                onSrt={kelimeler.length ? () => altyaziIndir("srt") : undefined} onVtt={kelimeler.length ? () => altyaziIndir("vtt") : undefined} onTxt={transkript ? txtIndir : undefined}
                onSeslendir={onSeslendir && transkript ? () => onSeslendir(transkript) : undefined} />}
              <Bilgi istem={istem} satirlar={satirlar} onAyarlariYukle={onAyarlariYukle} />
            </>
          )}
        </div>
      </motion.aside>
    </motion.div>
  );
}

/** Ton etiketleri ve duraklamalar editördeki gibi grup renginde gösterilir. */
function etiketliMetin(t: string) {
  return t.split(/(\[[^\]\n]{1,30}\]|<break[^>]*\/?>)/g).map((p, i) => (i % 2
    ? <span key={i} className="rounded px-0.5" style={{ color: etiketRengi(p), background: `color-mix(in srgb, ${etiketRengi(p)} 14%, transparent)` }}>{p}</span> : p));
}

/** Ayarlar: tek bölmeli liste (ad solda, değer sağda) + metni kopyala + bu ayarlarla üret. */
function Bilgi({ istem, satirlar, onAyarlariYukle }: { istem: string; satirlar: [string, ReactNode][]; onAyarlariYukle: () => void }) {
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-metin">Ayarlar</span>
        {istem && (
          <button onClick={() => void kopyala(istem, "Metin kopyalandı")} className="flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium text-metin-2 transition-colors hover:bg-white/[0.075] hover:text-metin">
            <Copy className="h-3.5 w-3.5" />Metni kopyala
          </button>
        )}
      </div>
      <dl className="divide-y divide-white/[0.06] overflow-hidden rounded-[14px] bg-white/[0.045] ring-1 ring-inset ring-white/[0.06]">
        {satirlar.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 px-3.5 py-2.5">
            <dt className="shrink-0 text-[13px] text-metin-3">{k}</dt>
            <dd className="min-w-0 truncate text-right text-[13px] font-medium text-metin">{v}</dd>
          </div>
        ))}
      </dl>
      <motion.button whileTap={{ scale: 0.98 }} onClick={onAyarlariYukle}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white/[0.075] text-[13px] font-medium text-metin ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1]">
        <Wand2 className="h-4 w-4" />Bu ayarlarla üret
      </motion.button>
    </div>
  );
}

/** Etkin kelime: başlangıcı geçmiş, bitişi gelmemiş son kelime. */
const etkinKelime = (kelimeler: Kelime[], an: number) => {
  if (an < 0) return -1;
  for (let i = kelimeler.length - 1; i >= 0; i--) if (kelimeler[i].b <= an) return an <= kelimeler[i].s + 0.25 ? i : -1;
  return -1;
};

/** Karaoke: çalan kelime vurgulanır; kelimeye tıklayınca o ana gider. */
function Karaoke({ kelimeler, an, onGit }: { kelimeler: Kelime[]; an: number; onGit: (sn: number) => void }) {
  const etkin = etkinKelime(kelimeler, an);
  const kutu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const k = kutu.current, el = k?.querySelector<HTMLElement>(`[data-i="${etkin}"]`);
    if (!k || !el) return;
    const ust = el.offsetTop;
    if (ust < k.scrollTop || ust > k.scrollTop + k.clientHeight - 28) k.scrollTo({ top: ust - k.clientHeight / 3, behavior: "smooth" });
  }, [etkin]);
  return (
    <div ref={kutu} className="relative w-full text-[24px] leading-[1.6] tracking-[-0.01em] max-md:text-[17px]">
      <p className="text-left">
        {kelimeler.map((w, i) => (
          <button key={i} data-i={i} onClick={() => onGit(w.b)} title={sureYaz(w.b)}
            className={cn("rounded px-[1px] transition-colors hover:bg-white/10", i === etkin ? "bg-aksan/20 text-aksan" : an >= 0 && w.s <= an ? "text-white" : an >= 0 ? "text-white/40" : "text-white/90")}>
            {w.k}{" "}
          </button>
        ))}
      </p>
    </div>
  );
}

type Paragraf = { kon?: string; b: number; kelimeler?: { w: Kelime; i: number }[]; metin?: string };

/** Transkript kartı: konuşmacı paragrafları (renkli çip), Kopyala, TXT/SRT/VTT ve "Bu metni seslendir". */
function TranskriptKart({ metin, kelimeler, an, onGit, onTxt, onSrt, onVtt, onSeslendir }: {
  metin: string; kelimeler: Kelime[]; an: number; onGit?: (sn: number) => void;
  onTxt?: () => void; onSrt?: () => void; onVtt?: () => void; onSeslendir?: () => void;
}) {
  const paragraflar = useMemo<Paragraf[]>(() => {
    if (kelimeler.length) {
      const p: Paragraf[] = [];
      kelimeler.forEach((w, i) => {
        const son = p[p.length - 1];
        if (son && son.kon === w.kon) son.kelimeler!.push({ w, i }); else p.push({ kon: w.kon, b: w.b, kelimeler: [{ w, i }] });
      });
      return p;
    }
    return metin.split(/\n{2,}|\n(?=[^\n:]{1,30}:)/).map((x) => x.trim()).filter(Boolean).map((x) => {
      const e = x.match(/^([^\n:]{1,30}):\s*([\s\S]*)$/);
      return { kon: e?.[1], b: -1, metin: e ? e[2] : x };
    });
  }, [kelimeler, metin]);
  const konlar = [...new Set(paragraflar.map((p) => p.kon).filter(Boolean))] as string[];
  const renk = (k?: string) => KONUSMACI_RENK[Math.max(0, konlar.indexOf(k ?? "")) % KONUSMACI_RENK.length];
  const etkin = etkinKelime(kelimeler, an);
  const konAd = (k: string) => (/^speaker_?(\d+)$/i.test(k) ? `Konuşmacı ${Number(k.replace(/\D/g, "")) + 1}` : k);
  const dugme = "flex h-8 items-center gap-1.5 rounded-full bg-white/[0.075] px-3 text-[12.5px] font-medium text-metin-2 ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.1] hover:text-metin";
  return (
    <div className="px-4 pt-4">
      <div className="rounded-[14px] bg-white/[0.045] p-3.5 ring-1 ring-inset ring-white/[0.06]">
        <div className="mb-2.5 flex items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-metin-2" />
          <span className="flex-1 text-[13px] font-semibold text-metin">Transkript{konlar.length > 1 ? ` · ${konlar.length} konuşmacı` : ""}</span>
          {metin && <button onClick={() => void kopyala(metin, "Transkript kopyalandı")} aria-label="Transkripti kopyala" className="flex h-7 w-7 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/[0.075] hover:text-metin"><Copy className="h-3.5 w-3.5" /></button>}
        </div>
        {paragraflar.length ? (
          <div className="max-h-[38vh] space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin] md:max-h-[340px]">
            {paragraflar.map((p, j) => (
              <div key={j}>
                {(p.kon || p.b >= 0) && (
                  <span className="mb-1 flex items-center gap-1.5">
                    {p.kon && <span className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold" style={{ color: renk(p.kon), background: `color-mix(in srgb, ${renk(p.kon)} 14%, transparent)` }}>{konAd(p.kon)}</span>}
                    {p.b >= 0 && (onGit ? <button onClick={() => onGit(p.b)} className="text-[10.5px] tabular-nums text-metin-3 hover:text-aksan">{sureYaz(p.b)}</button> : <span className="text-[10.5px] tabular-nums text-metin-3">{sureYaz(p.b)}</span>)}
                  </span>
                )}
                <p className="whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-metin">
                  {p.kelimeler ? p.kelimeler.map(({ w, i }) => (onGit
                    ? <button key={i} onClick={() => onGit(w.b)} className={cn("rounded px-[1px] text-left hover:bg-white/8", i === etkin && "bg-aksan/20 text-aksan")}>{w.k}{" "}</button>
                    : <span key={i}>{w.k}{" "}</span>)) : p.metin}
                </p>
              </div>
            ))}
          </div>
        ) : <p className="text-[13px] text-metin-3">Kayıtta konuşma algılanmadı.</p>}
        {(onTxt || onSrt || onVtt) && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {onTxt && <button onClick={onTxt} className={dugme}><Download className="h-3 w-3" /> TXT</button>}
            {onSrt && <button onClick={onSrt} className={dugme}><Captions className="h-3 w-3" /> SRT</button>}
            {onVtt && <button onClick={onVtt} className={dugme}><Captions className="h-3 w-3" /> VTT</button>}
          </div>
        )}
        {onSeslendir && <button onClick={onSeslendir} className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-semibold text-[#0b0c0e]"><AudioLines className="h-3.5 w-3.5" /> Bu metni seslendir</button>}
      </div>
    </div>
  );
}
