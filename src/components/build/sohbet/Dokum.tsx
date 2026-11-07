"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, AudioLines, ChevronLeft, Download, FileAudio, Gavel, ListChecks, Loader2, MessageSquare, Mic, Pause, Play, RefreshCw, Square, Trash2, Upload, Users, X } from "lucide-react";
import { api, gorece, sahipAnahtari } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { Secici, SagPanel, dosyaAdi, indir } from "./ortak";

/**
 * Ses kaydı ve toplantı dökümü paneli: tarayıcıda kaydet (canlı dalga ve canlı tanıma) ya da dosya yükle; döküm
 * hazırlanırken durum, sonra konuşmacılar (renkli, yeniden adlandırılır), zaman damgalı döküm (oynatıcıyla eşli),
 * özet, kararlar, eylem maddeleri ve bölümler. Sağlayıcı yoksa dürüst uyarı; uydurma döküm yok.
 */
type Konusmaci = { id: string; ad: string };
type Parca = { k: string; bas: number; son: number; metin: string };
type Eylem = { metin: string; sorumlu?: string; tarih?: string; bitti?: boolean };
export type Dokum = {
  id: string; baslik: string; olusturma: number; sure: number; boyut: number; kaynak: "yukleme" | "kayit"; durum: "isleniyor" | "ozetleniyor" | "bitti" | "hata"; hata?: string; adim?: string;
  saglayici?: string; tanimaModeli?: string; uyari?: string; konusmacilar: Konusmaci[]; parcalar: Parca[]; ozet?: string; kararlar?: string[]; eylemler?: Eylem[]; bolumler?: { baslik: string; bas: number }[]; ozetModel?: string; ozetHata?: string; kelime?: number;
};
const RENK = ["#55d6fd", "#f472b6", "#a78bfa", "#34d399", "#fb923c", "#facc15", "#60a5fa", "#f87171"];
const sure = (sn: number) => { const s = Math.max(0, Math.round(sn)); const sa = Math.floor(s / 3600), dk = Math.floor((s % 3600) / 60), x = s % 60; return sa ? `${sa}.${String(dk).padStart(2, "0")}.${String(x).padStart(2, "0")}` : `${dk}.${String(x).padStart(2, "0")}`; };
const srtZaman = (sn: number) => { const ms = Math.round(sn * 1000); const p = (n: number, l = 2) => String(n).padStart(l, "0"); return `${p(Math.floor(ms / 3600000))}:${p(Math.floor((ms % 3600000) / 60000))}:${p(Math.floor((ms % 60000) / 1000))},${p(ms % 1000, 3)}`; };

type TanimaOlayi = { results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } }; resultIndex: number };
type Tanima = { lang: string; continuous: boolean; interimResults: boolean; start: () => void; stop: () => void; onresult: ((e: TanimaOlayi) => void) | null; onend: (() => void) | null; onerror: ((e: { error: string }) => void) | null };

/** Tarayıcıda kayıt: MediaRecorder + canlı dalga (AnalyserNode) + varsa canlı konuşma tanıma. */
function Kaydedici({ bitti, iptal }: { bitti: (f: File, sureSn: number, tarayici: { bas: number; son: number; metin: string }[]) => void; iptal: () => void }) {
  const [durum, setDurum] = useState<"hazir" | "kayit" | "duraklatildi">("hazir");
  const [sn, setSn] = useState(0);
  const [canli, setCanli] = useState<{ kesin: { bas: number; son: number; metin: string }[]; ara: string }>({ kesin: [], ara: "" });
  const [hata, setHata] = useState("");
  const [cubuklar, setCubuklar] = useState<number[]>(Array(48).fill(0.04));
  const kayitci = useRef<MediaRecorder | null>(null);
  const parcalar = useRef<Blob[]>([]);
  const akis = useRef<MediaStream | null>(null);
  const tanima = useRef<Tanima | null>(null);
  const bas = useRef(0), birikim = useRef(0), cerceve = useRef(0), sonParca = useRef(0);
  const tanimaVar = typeof window !== "undefined" && !!((window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition);
  const gecen = () => birikim.current + (durum === "kayit" ? (Date.now() - bas.current) / 1000 : 0);
  useEffect(() => () => { cancelAnimationFrame(cerceve.current); akis.current?.getTracks().forEach((t) => t.stop()); try { tanima.current?.stop(); } catch { /* yok */ } }, []);
  useEffect(() => { if (durum !== "kayit") return; const t = setInterval(() => setSn(birikim.current + (Date.now() - bas.current) / 1000), 250); return () => clearInterval(t); }, [durum]);
  const tanimaBaslat = () => {
    const T = ((window as unknown as { SpeechRecognition?: new () => Tanima }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: new () => Tanima }).webkitSpeechRecognition);
    if (!T) return;
    const r = new T(); r.lang = "tr-TR"; r.continuous = true; r.interimResults = true;
    r.onresult = (e) => {
      let ara = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const x = e.results[i];
        if (x.isFinal) { const simdi = birikim.current + (Date.now() - bas.current) / 1000; const metin = x[0].transcript.trim(); if (metin) setCanli((c) => ({ kesin: [...c.kesin, { bas: sonParca.current, son: simdi, metin }], ara: "" })); sonParca.current = simdi; }
        else ara += x[0].transcript;
      }
      if (ara) setCanli((c) => ({ ...c, ara }));
    };
    r.onend = () => { if (kayitci.current?.state === "recording") { try { r.start(); } catch { /* yeniden başlamadı */ } } };
    r.onerror = () => {};
    try { r.start(); tanima.current = r; } catch { /* yok */ }
  };
  const basla = async () => {
    setHata("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      akis.current = s;
      const tur = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((x) => MediaRecorder.isTypeSupported(x)) ?? "";
      const m = new MediaRecorder(s, tur ? { mimeType: tur, audioBitsPerSecond: 64_000 } : undefined);
      parcalar.current = [];
      m.ondataavailable = (e) => { if (e.data.size) parcalar.current.push(e.data); };
      m.start(1000);
      kayitci.current = m;
      bas.current = Date.now(); birikim.current = 0; sonParca.current = 0;
      setDurum("kayit");
      const ses = new AudioContext(), kaynak = ses.createMediaStreamSource(s), an = ses.createAnalyser();
      an.fftSize = 256; kaynak.connect(an);
      const veri = new Uint8Array(an.frequencyBinCount);
      const ciz = () => { an.getByteFrequencyData(veri); setCubuklar((l) => [...l.slice(1), Math.max(0.04, Math.min(1, (veri.slice(2, 40).reduce((t, x) => t + x, 0) / 38) / 150))]); cerceve.current = requestAnimationFrame(ciz); };
      ciz();
      tanimaBaslat();
    } catch (e) { setHata((e as Error).name === "NotAllowedError" ? "Mikrofon izni verilmedi. Tarayıcının adres çubuğundaki izinlerden mikrofona izin ver." : "Mikrofon açılamadı."); }
  };
  const duraklat = () => { if (!kayitci.current) return; if (durum === "kayit") { kayitci.current.pause(); birikim.current += (Date.now() - bas.current) / 1000; setDurum("duraklatildi"); try { tanima.current?.stop(); } catch { /* yok */ } } else { kayitci.current.resume(); bas.current = Date.now(); setDurum("kayit"); tanimaBaslat(); } };
  const bitir = () => {
    const m = kayitci.current;
    if (!m) return;
    const toplam = gecen();
    m.onstop = () => {
      cancelAnimationFrame(cerceve.current);
      akis.current?.getTracks().forEach((t) => t.stop());
      const tur = m.mimeType || "audio/webm";
      const f = new File(parcalar.current, `kayit.${tur.includes("mp4") ? "m4a" : tur.includes("ogg") ? "ogg" : "webm"}`, { type: tur.split(";")[0] });
      bitti(f, toplam, canli.kesin);
    };
    try { tanima.current?.stop(); } catch { /* yok */ }
    m.stop();
  };
  return (
    <div className="space-y-3">
      <div className="rounded-[20px] bg-white/[0.035] p-4 ring-1 ring-inset ring-white/[0.08]">
        <div className="flex items-center gap-3">
          <span className={cn("relative flex h-11 w-11 items-center justify-center rounded-full", durum === "kayit" ? "bg-rose-500/20 text-rose-200" : "bg-white/[0.07] text-white/80")}><Mic className="h-5 w-5" />{durum === "kayit" && <span className="absolute inset-0 animate-ping rounded-full bg-rose-500/20" />}</span>
          <span className="min-w-0 flex-1"><span className="block text-[26px] font-semibold tabular-nums tracking-[-0.02em] text-white">{sure(sn)}</span><span className="block text-[12px] text-white/50">{durum === "hazir" ? "Hazır" : durum === "kayit" ? "Kaydediliyor" : "Duraklatıldı"}</span></span>
        </div>
        <div className="mt-3 flex h-14 items-center gap-[3px]">{cubuklar.map((x, i) => <span key={i} style={{ height: `${Math.round(x * 100)}%` }} className={cn("w-full rounded-full transition-[height] duration-75", durum === "kayit" ? "bg-[#55d6fd]" : "bg-white/20")} />)}</div>
      </div>
      <div className="min-h-[96px] rounded-[18px] bg-black/20 p-3.5 ring-1 ring-inset ring-white/[0.06]">
        <p className="mb-1.5 text-[12px] font-medium text-white/45">Canlı metin{tanimaVar ? "" : " (bu tarayıcı canlı tanıma yapmıyor)"}</p>
        <p className="max-h-[180px] overflow-y-auto text-[13.5px] leading-relaxed text-white/80 [scrollbar-width:thin]">{canli.kesin.map((x) => x.metin).join(" ")} <span className="text-white/40">{canli.ara}</span>{!canli.kesin.length && !canli.ara && <span className="text-white/35">{durum === "hazir" ? "Kayda başlayınca konuşulanlar burada akar." : tanimaVar ? "Dinleniyor…" : "Kayıt bitince sunucuda metne dökülür."}</span>}</p>
      </div>
      {hata && <p className="flex items-center gap-2 text-[12.5px] text-rose-300"><AlertTriangle className="h-3.5 w-3.5" />{hata}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={iptal} className="h-10 rounded-full px-4 text-[13px] text-white/70 hover:bg-white/[0.06]">Vazgeç</button>
        <span className="ml-auto" />
        {durum === "hazir" ? <button type="button" onClick={basla} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black"><Mic className="h-4 w-4" />Kayda başla</button> : <>
          <button type="button" onClick={duraklat} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] text-white hover:bg-white/[0.13]">{durum === "kayit" ? <><Pause className="h-4 w-4" />Duraklat</> : <><Play className="h-4 w-4" />Sürdür</>}</button>
          <button type="button" onClick={bitir} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black"><Square className="h-3.5 w-3.5 fill-current" />Bitir ve dök</button>
        </>}
      </div>
    </div>
  );
}

/** Tek dökümün ayrıntısı (oynatıcı, özet, eylemler, bölümler, konuşmacılar, döküm). */
export function DokumAyrinti({ id, geri, kapat }: { id: string; geri?: () => void; kapat?: () => void }) {
  const router = useRouter();
  const [d, setD] = useState<Dokum | null>(null);
  const [hata, setHata] = useState("");
  const [zaman, setZaman] = useState(0);
  const [is, setIs] = useState("");
  const [adDuzen, setAdDuzen] = useState<string | null>(null);
  const [silOnay, setSilOnay] = useState(false);
  const oynatici = useRef<HTMLAudioElement>(null);
  const yukle = useCallback(() => api<{ dokum: Dokum }>(`/api/build/sohbet/dokum/${id}`).then((v) => setD(v.dokum)).catch((e) => setHata(e instanceof Error ? e.message : "Açılamadı.")), [id]);
  useEffect(() => { yukle(); }, [yukle]);
  useEffect(() => { if (!d || (d.durum !== "isleniyor" && d.durum !== "ozetleniyor")) return; const t = setTimeout(yukle, 2500); return () => clearTimeout(t); }, [d, yukle]);
  const renk = useMemo(() => new Map((d?.konusmacilar ?? []).map((k, i) => [k.id, RENK[i % RENK.length]])), [d?.konusmacilar]);
  const ad = (k: string) => d?.konusmacilar.find((x) => x.id === k)?.ad ?? k;
  const yama = async (g: Record<string, unknown>) => { try { const v = await api<{ dokum: Dokum }>(`/api/build/sohbet/dokum/${id}`, { method: "PATCH", govde: g }); setD(v.dokum); } catch { /* yok */ } };
  const git = (sn: number) => { const a = oynatici.current; if (!a) return; a.currentTime = sn; a.play().catch(() => {}); };
  if (hata) return <p className="flex items-center gap-2 text-[13px] text-rose-300"><AlertTriangle className="h-4 w-4" />{hata}</p>;
  if (!d) return <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-[16px] bg-white/[0.03]" />)}</div>;
  const metinTxt = () => d.parcalar.map((p) => `[${sure(p.bas)}] ${ad(p.k)}: ${p.metin}`).join("\n");
  const srt = () => d.parcalar.map((p, i) => `${i + 1}\n${srtZaman(p.bas)} --> ${srtZaman(Math.max(p.son, p.bas + 1))}\n${ad(p.k)}: ${p.metin}\n`).join("\n");
  const md = () => [`# ${d.baslik}`, "", d.ozet ? `## Özet\n\n${d.ozet}\n` : "", d.kararlar?.length ? `## Kararlar\n\n${d.kararlar.map((x) => `- ${x}`).join("\n")}\n` : "", d.eylemler?.length ? `## Eylem maddeleri\n\n${d.eylemler.map((x) => `- [${x.bitti ? "x" : " "}] ${x.metin}${x.sorumlu ? ` (${x.sorumlu}${x.tarih ? `, ${x.tarih}` : ""})` : ""}`).join("\n")}\n` : "", `## Döküm\n\n${d.parcalar.map((p) => `**${ad(p.k)}** (${sure(p.bas)}): ${p.metin}`).join("\n\n")}`].filter(Boolean).join("\n");
  const aktif = d.parcalar.findIndex((p, i) => zaman >= p.bas && (zaman < (d.parcalar[i + 1]?.bas ?? Infinity)));
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        {geri && <button type="button" onClick={geri} aria-label="Kayıtlara dön" className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white"><ChevronLeft className="h-4 w-4" /></button>}
        <div className="min-w-0 flex-1">
          {adDuzen !== null
            ? <form onSubmit={(e) => { e.preventDefault(); if (adDuzen.trim()) yama({ baslik: adDuzen }); setAdDuzen(null); }}><input autoFocus value={adDuzen} onChange={(e) => setAdDuzen(e.target.value)} onBlur={(e) => e.currentTarget.form?.requestSubmit()} maxLength={100} className="h-9 w-full rounded-[10px] bg-white/[0.06] px-2.5 text-[16px] font-semibold text-white outline-none ring-1 ring-inset ring-white/20" /></form>
            : <button type="button" onClick={() => setAdDuzen(d.baslik)} className="block max-w-full truncate text-left text-[17px] font-semibold tracking-[-0.01em] text-white hover:text-white/80">{d.baslik}</button>}
          <p className="text-[12.5px] text-white/50">{sure(d.sure)} · {d.konusmacilar.length || "?"} konuşmacı · {gorece(d.olusturma)}{d.tanimaModeli ? ` · ${d.tanimaModeli}` : ""}</p>
        </div>
      </div>
      <audio ref={oynatici} src={`/api/build/sohbet/dokum/${d.id}/ses?s=${encodeURIComponent(sahipAnahtari())}`} controls preload="metadata" onTimeUpdate={(e) => setZaman(e.currentTarget.currentTime)} className="w-full" />
      {(d.durum === "isleniyor" || d.durum === "ozetleniyor") && <p className="flex items-center gap-2 rounded-[14px] bg-[#55d6fd]/[0.07] px-3.5 py-2.5 text-[13px] text-[#8be6ff] ring-1 ring-inset ring-[#55d6fd]/15"><Loader2 className="h-4 w-4 animate-spin" />{d.adim ?? "İşleniyor"}…</p>}
      {d.durum === "hata" && <p className="flex items-start gap-2 rounded-[14px] bg-rose-500/[0.08] px-3.5 py-2.5 text-[13px] text-rose-200 ring-1 ring-inset ring-rose-400/20"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{d.hata}</p>}
      {d.uyari && <p className="flex items-start gap-2 rounded-[14px] bg-amber-400/[0.07] px-3.5 py-2.5 text-[12.5px] text-amber-100/90 ring-1 ring-inset ring-amber-300/15"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{d.uyari}</p>}
      {d.ozetHata && <p className="flex items-start gap-2 rounded-[14px] bg-amber-400/[0.07] px-3.5 py-2.5 text-[12.5px] text-amber-100/90 ring-1 ring-inset ring-amber-300/15"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{d.ozetHata}</p>}
      {d.parcalar.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={!!is} onClick={async () => { setIs("sohbet"); try { const v = await api<{ id: string }>(`/api/build/sohbet/dokum/${d.id}/sohbet`, { govde: { model: d.ozetModel } }); kapat?.(); router.push(`/panel/build/sohbet/${v.id}`); } catch (e) { setHata(e instanceof Error ? e.message : "Açılamadı."); } finally { setIs(""); } }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[12.5px] font-semibold text-black disabled:opacity-50">{is === "sohbet" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}Bu dökümle sohbet et</button>
          <button type="button" onClick={() => indir(`${dosyaAdi(d.baslik)}.md`, md())} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white hover:bg-white/[0.13]"><Download className="h-3.5 w-3.5" />Markdown</button>
          <button type="button" onClick={() => indir(`${dosyaAdi(d.baslik)}.txt`, metinTxt(), "text/plain;charset=utf-8")} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white hover:bg-white/[0.13]">TXT</button>
          <button type="button" onClick={() => indir(`${dosyaAdi(d.baslik)}.srt`, srt(), "application/x-subrip;charset=utf-8")} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white hover:bg-white/[0.13]">Altyazı</button>
          {d.durum === "bitti" && <button type="button" disabled={!!is} onClick={async () => { setIs("ozet"); try { const v = await api<{ dokum: Dokum }>(`/api/build/sohbet/dokum/${d.id}/ozet`, { govde: {} }); setD(v.dokum); } catch { /* yok */ } finally { setIs(""); } }} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-white/65 hover:bg-white/[0.06] hover:text-white">{is === "ozet" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}Özeti yenile</button>}
        </div>
      )}
      {d.ozet && <section className="rounded-[18px] bg-white/[0.035] p-4 ring-1 ring-inset ring-white/[0.07]"><p className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-white"><AudioLines className="h-4 w-4 text-[#8be6ff]" />Özet</p><p className="text-[13.5px] leading-relaxed text-white/80">{d.ozet}</p></section>}
      {(d.eylemler?.length ?? 0) > 0 && (
        <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
          <p className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5 text-[13px] font-semibold text-white"><ListChecks className="h-4 w-4 text-[#8be6ff]" />Eylem maddeleri<span className="ml-auto text-[12px] font-normal text-white/45">{d.eylemler!.filter((x) => x.bitti).length} / {d.eylemler!.length}</span></p>
          {d.eylemler!.map((x, i) => (
            <button key={i} type="button" onClick={() => yama({ eylem: { i, bitti: !x.bitti } })} className="flex w-full items-start gap-3 border-t border-white/[0.05] px-4 py-2.5 text-left first:border-0 hover:bg-white/[0.03]">
              <span className={cn("mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ring-2 ring-inset", x.bitti ? "ring-white" : "ring-white/30")}>{x.bitti && <span className="h-2 w-2 rounded-full bg-white" />}</span>
              <span className="min-w-0 flex-1"><span className={cn("block text-[13.5px]", x.bitti ? "text-white/45 line-through" : "text-white/90")}>{x.metin}</span>{(x.sorumlu || x.tarih) && <span className="block text-[12px] text-white/45">{[x.sorumlu, x.tarih].filter(Boolean).join(" · ")}</span>}</span>
            </button>
          ))}
        </section>
      )}
      {(d.kararlar?.length ?? 0) > 0 && <section className="rounded-[18px] p-4 ring-1 ring-inset ring-white/[0.08]"><p className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-white"><Gavel className="h-4 w-4 text-[#8be6ff]" />Kararlar</p><ul className="list-disc space-y-1 pl-5 text-[13.5px] text-white/80">{d.kararlar!.map((x, i) => <li key={i}>{x}</li>)}</ul></section>}
      {(d.bolumler?.length ?? 0) > 0 && <section><p className="mb-1.5 px-1 text-[13px] font-semibold text-white">Bölümler</p><div className="flex flex-wrap gap-1.5">{d.bolumler!.map((b, i) => <button key={i} type="button" onClick={() => git(b.bas)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/80 hover:bg-white/[0.1]"><span className="tabular-nums text-[#8be6ff]">{sure(b.bas)}</span>{b.baslik}</button>)}</div></section>}
      {d.konusmacilar.length > 0 && (
        <section><p className="mb-1.5 flex items-center gap-2 px-1 text-[13px] font-semibold text-white"><Users className="h-4 w-4 text-white/60" />Konuşmacılar</p>
          <div className="flex flex-wrap gap-1.5">{d.konusmacilar.map((k) => <label key={k.id} className="flex h-9 items-center gap-2 rounded-full bg-white/[0.05] pl-2 pr-1 ring-1 ring-inset ring-white/[0.07]"><span className="h-3 w-3 shrink-0 rounded-full" style={{ background: renk.get(k.id) }} /><input defaultValue={k.ad} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== k.ad) yama({ konusmaci: { id: k.id, ad: v } }); }} aria-label="Konuşmacının adı" className="w-[120px] bg-transparent text-[13px] text-white outline-none" /></label>)}</div>
        </section>
      )}
      {d.parcalar.length > 0 && (
        <section className="space-y-1">
          <p className="mb-1.5 px-1 text-[13px] font-semibold text-white">Döküm</p>
          {d.parcalar.map((p, i) => (
            <div key={i} className={cn("flex gap-3 rounded-[14px] px-2.5 py-2 transition-colors", i === aktif ? "bg-[#55d6fd]/[0.07]" : "hover:bg-white/[0.03]")}>
              <button type="button" onClick={() => git(p.bas)} className="w-11 shrink-0 pt-0.5 text-left text-[12px] tabular-nums text-white/40 hover:text-[#8be6ff]">{sure(p.bas)}</button>
              <div className="min-w-0 flex-1"><p className="text-[12.5px] font-semibold" style={{ color: renk.get(p.k) }}>{ad(p.k)}</p><p className="text-[13.5px] leading-relaxed text-white/85">{p.metin}</p></div>
            </div>
          ))}
        </section>
      )}
      <div className="flex justify-end border-t border-white/[0.06] pt-3">
        <button type="button" onClick={async () => { if (!silOnay) { setSilOnay(true); setTimeout(() => setSilOnay(false), 3000); return; } await api(`/api/build/sohbet/dokum/${d.id}`, { method: "DELETE" }).catch(() => {}); geri?.(); }} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-rose-300 hover:bg-rose-500/[0.08]", silOnay && "bg-rose-500/[0.12] font-semibold")}><Trash2 className="h-3.5 w-3.5" />{silOnay ? "Silmek için tekrar tıkla" : "Kaydı ve dökümü sil"}</button>
      </div>
    </div>
  );
}

/** Ses kaydı ve döküm paneli: Yeni (kaydet ya da yükle) ve Kayıtlar. */
export function DokumPaneli({ acik, kapat, ilkId, model }: { acik: boolean; kapat: () => void; ilkId?: string | null; model?: string }) {
  const [sekme, setSekme] = useState<"yeni" | "kayitlar">("yeni");
  const [kip, setKip] = useState<"" | "kayit">("");
  const [secili, setSecili] = useState<string | null>(null);
  const [l, setL] = useState<Dokum[] | null>(null);
  const [tanima, setTanima] = useState<boolean | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");
  const [surukle, setSurukle] = useState(false);
  const dosya = useRef<HTMLInputElement>(null);
  const yenile = useCallback(() => api<{ dokumler: Dokum[]; tanima: boolean }>("/api/build/sohbet/dokum").then((v) => { setL(v.dokumler); setTanima(v.tanima); }).catch(() => setL([])), []);
  useEffect(() => { if (!acik) return; setHata(""); setKip(""); yenile(); if (ilkId) { setSecili(ilkId); setSekme("kayitlar"); } else setSecili(null); }, [acik, ilkId, yenile]);
  const gonder = async (f: File, sureSn: number, kaynak: "kayit" | "yukleme", tarayici?: { bas: number; son: number; metin: string }[]) => {
    setYukleniyor(true); setHata("");
    try {
      if (f.size > 25 * 1024 * 1024) throw new Error("Dosya 25 MB sınırını aşıyor.");
      let sn = sureSn;
      if (!sn) sn = await new Promise<number>((r) => { const a = new Audio(URL.createObjectURL(f)); a.onloadedmetadata = () => r(Number.isFinite(a.duration) ? a.duration : 0); a.onerror = () => r(0); });
      const fd = new FormData(); fd.append("ses", f, f.name); fd.append("kaynak", kaynak); fd.append("sure", String(Math.round(sn))); if (model) fd.append("model", model);
      if (tarayici?.length) fd.append("tarayici", JSON.stringify(tarayici));
      const r = await fetch("/api/build/sohbet/dokum", { method: "POST", headers: { "x-build-sahip": sahipAnahtari() }, body: fd });
      const v = await r.json();
      if (!v.ok) throw new Error(v.hata);
      setKip(""); setSecili(v.dokum.id); setSekme("kayitlar"); yenile();
    } catch (e) { setHata(e instanceof Error ? e.message : "Yüklenemedi."); } finally { setYukleniyor(false); }
  };
  return (
    <SagPanel acik={acik} kapat={kapat} baslik="Ses kaydı ve döküm" alt="Kaydet ya da yükle; konuşmacılarıyla metne dök, özetle" ikon={<AudioLines className="h-[18px] w-[18px]" />} genislik={640}
      ust={!secili ? <Secici id="dokum-sekme" kucuk deger={sekme} set={(v) => { setSekme(v); setKip(""); }} l={[{ id: "yeni", ad: "Yeni" }, { id: "kayitlar", ad: l?.length ? `Kayıtlar ${l.length}` : "Kayıtlar" }]} /> : undefined}>
      {secili ? <DokumAyrinti key={secili} id={secili} geri={() => { setSecili(null); yenile(); }} kapat={kapat} />
        : sekme === "yeni" ? (
          <div className="space-y-4">
            {tanima === false && <p className="flex items-start gap-2 rounded-[14px] bg-amber-400/[0.07] px-3.5 py-2.5 text-[12.5px] leading-snug text-amber-100/90 ring-1 ring-inset ring-amber-300/15"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />Sunucuda konuşma tanıma sağlayıcısı yok (OPENAI_API_KEY). Yüklenen ses metne dökülemez; tarayıcıda canlı kayıt alırsan tarayıcının kendi tanımasıyla, konuşmacı ayrımı olmadan döküm çıkarılır.</p>}
            {tanima && <p className="flex items-center gap-2 text-[12.5px] text-white/55"><Users className="h-3.5 w-3.5 text-[#8be6ff]" />OpenAI konuşma tanıma bağlı: konuşmacılar ayrılır, Türkçe ve diğer diller desteklenir.</p>}
            {kip === "kayit" ? <Kaydedici iptal={() => setKip("")} bitti={(f, sn, t) => gonder(f, sn, "kayit", t)} /> : (
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => setKip("kayit")} disabled={yukleniyor} className="group flex flex-col items-start gap-2 rounded-[20px] bg-white/[0.035] p-4 text-left ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.06]">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-500/15 text-rose-200 transition-transform group-hover:scale-105"><Mic className="h-5 w-5" /></span>
                  <span className="text-[14.5px] font-semibold text-white">Kaydet</span><span className="text-[12.5px] leading-snug text-white/55">Toplantıyı, dersi ya da sesli notunu tarayıcıda kaydet; konuşulanlar canlı akar.</span>
                </button>
                <button type="button" onClick={() => dosya.current?.click()} onDragOver={(e) => { e.preventDefault(); setSurukle(true); }} onDragLeave={() => setSurukle(false)} onDrop={(e) => { e.preventDefault(); setSurukle(false); const f = e.dataTransfer.files[0]; if (f) gonder(f, 0, "yukleme"); }} disabled={yukleniyor}
                  className={cn("group flex flex-col items-start gap-2 rounded-[20px] bg-white/[0.035] p-4 text-left ring-1 ring-inset transition-colors hover:bg-white/[0.06]", surukle ? "ring-2 ring-white" : "ring-white/[0.08]")}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#55d6fd]/[0.14] text-[#8be6ff] transition-transform group-hover:scale-105">{yukleniyor ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}</span>
                  <span className="text-[14.5px] font-semibold text-white">Dosya yükle</span><span className="text-[12.5px] leading-snug text-white/55">mp3, m4a, wav, webm, ogg; en çok 25 MB. Sürükle bırak da olur.</span>
                </button>
                <input ref={dosya} type="file" hidden accept="audio/*,video/mp4,video/webm,.m4a,.mp3,.wav,.webm,.ogg,.flac" onChange={(e) => { const f = e.target.files?.[0]; if (f) gonder(f, 0, "yukleme"); e.target.value = ""; }} />
              </div>
            )}
            {yukleniyor && <p className="flex items-center gap-2 text-[13px] text-white/60"><Loader2 className="h-4 w-4 animate-spin" />Yükleniyor…</p>}
            {hata && <p className="flex items-start gap-2 rounded-[14px] bg-rose-500/[0.08] px-3.5 py-2.5 text-[12.5px] text-rose-200 ring-1 ring-inset ring-rose-400/20"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{hata}</p>}
            <ul className="space-y-1.5 rounded-[18px] bg-white/[0.025] p-3.5 text-[12.5px] text-white/55 ring-1 ring-inset ring-white/[0.06]">
              <li>Döküm bitince özet, kararlar ve eylem maddeleri seçili modelle çıkarılır.</li>
              <li>Konuşmacıların adını değiştirebilir, dökümden sohbete geçip soru sorabilirsin.</li>
              <li>Kaydetmeden önce konuşanların iznini al.</li>
            </ul>
          </div>
        ) : (
          l === null ? <div className="space-y-2">{[0, 1].map((i) => <div key={i} className="h-16 animate-pulse rounded-[16px] bg-white/[0.03]" />)}</div>
            : !l.length ? <p className="rounded-[18px] bg-white/[0.035] p-4 text-[13px] text-white/55 ring-1 ring-inset ring-white/[0.06]">Henüz kayıt yok. Yeni sekmesinden kaydet ya da bir ses dosyası yükle.</p>
              : (
                <ul className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
                  <AnimatePresence initial={false}>
                    {l.map((x) => (
                      <motion.li key={x.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-t border-white/[0.06] first:border-0">
                        <button type="button" onClick={() => setSecili(x.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03]">
                          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]", x.kaynak === "kayit" ? "bg-rose-500/15 text-rose-200" : "bg-[#55d6fd]/[0.12] text-[#8be6ff]")}>{x.kaynak === "kayit" ? <Mic className="h-4 w-4" /> : <FileAudio className="h-4 w-4" />}</span>
                          <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-semibold text-white">{x.baslik}</span><span className="block truncate text-[12px] text-white/50">{sure(x.sure)} · {x.konusmacilar.length || "?"} konuşmacı · {gorece(x.olusturma)}{x.ozet ? ` · ${x.ozet.slice(0, 60)}` : ""}</span></span>
                          {x.durum === "isleniyor" || x.durum === "ozetleniyor" ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#8be6ff]" /> : x.durum === "hata" ? <X className="h-4 w-4 shrink-0 text-rose-300" /> : (x.eylemler?.length ?? 0) > 0 && <span className="shrink-0 rounded-full bg-white/[0.07] px-2 py-0.5 text-[11.5px] text-white/60">{x.eylemler!.length} eylem</span>}
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )
        )}
    </SagPanel>
  );
}

/** Sohbetteki döküm kartı: başlık, süre, konuşmacı ve eylem sayısı; "Dökümü aç" paneli açar. */
export function DokumKarti({ d }: { d: { id: string; baslik: string; sure: number; konusmaci: number; ozet: string; eylem: number } }) {
  const [acik, setAcik] = useState(false);
  return (
    <div className="my-3 flex max-w-[620px] flex-wrap items-center gap-3 rounded-[20px] bg-white/[0.035] p-3.5 ring-1 ring-inset ring-white/[0.08]">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><AudioLines className="h-5 w-5" /></span>
      <span className="min-w-[200px] flex-1"><span className="block truncate text-[14px] font-semibold text-white">{d.baslik}</span><span className="block text-[12.5px] text-white/55">{sure(d.sure)} · {d.konusmaci} konuşmacı{d.eylem ? ` · ${d.eylem} eylem maddesi` : ""}</span></span>
      <button type="button" onClick={() => setAcik(true)} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black">Dökümü aç</button>
      <SagPanel acik={acik} kapat={() => setAcik(false)} baslik="Ses dökümü" ikon={<AudioLines className="h-[18px] w-[18px]" />} genislik={640}>{acik && <DokumAyrinti id={d.id} kapat={() => setAcik(false)} />}</SagPanel>
    </div>
  );
}
