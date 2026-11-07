"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, BookOpen, Check, FileAudio, Loader2, Mic, Pause, Play, Plus, Square, Tag, Upload, Wind, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { neden } from "@/components/studyo/bildirim";
import { mesaj } from "@/lib/mesaj";
import { useAuth } from "@/store/useAuth";
import { krediliIstek } from "@/lib/krediIstek";
import { SABIT_KREDI } from "@/lib/krediTarife";
import { useOzelSesler } from "@/store/useOzelSesler";
import { yerelDepo } from "@/lib/yerelDepo";
import { sesCalici, useCalici, sureYaz } from "@/lib/sesCalici";
import { AnahtarKart, KartBolum } from "@/components/studyo/hf";
import { useOdakTuzagi } from "@/hooks/useOdakTuzagi";

/** Klonlama bedeli: tek kaynak lib/krediTarife (sunucu da bunu keser). */
export const KLON_KREDI = SABIT_KREDI.sesKlon;
const MIN_SN = 10;
const MAX_SN = 120;
const MAX_MB = 10;
const MAX_ORNEK = 5;

const OKUMA_METNI = {
  tr: "En iyi fikirler tam biçimlenmiş gelmez. Küçük bir sezgi olarak başlar, peşini bırakmayan bir şey. Taslağını çıkarır, tartışır, yarısını atar ve kalanı yeniden kurarsın. Süreç budur: dağınık, sabır isteyen ve arada bir muhteşem.",
  en: "The best ideas rarely arrive fully formed. They start as a small hunch, something that won't let go. You sketch it, argue with it, throw half of it away and rebuild the rest. That is the process: messy, patient, and every now and then, brilliant.",
} as const;

type Cinsiyet = "Kadın" | "Erkek" | "Nötr";
/** Örnek kalitesi — tarayıcıda decodeAudioData ile ölçülür. */
type Kalite = { tepeDb: number; kirpma: boolean };
type Ornek = { id: string; blob: Blob; sn: number; ad: string; kalite?: Kalite | null };

function blobDataUrl(b: Blob): Promise<string> {
  return new Promise((ok, hata) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => hata(r.error); r.readAsDataURL(b); });
}
function sureOlc(b: Blob): Promise<number> {
  return new Promise((ok) => {
    const a = new Audio(); const url = URL.createObjectURL(b);
    a.preload = "metadata";
    a.onloadedmetadata = () => {
      // webm kayıtlarında süre Infinity gelebilir: sona sararak gerçek süreyi öğren.
      if (isFinite(a.duration)) { URL.revokeObjectURL(url); return ok(a.duration); }
      a.currentTime = 1e7;
      a.ontimeupdate = () => { a.ontimeupdate = null; const d = a.duration; URL.revokeObjectURL(url); ok(isFinite(d) ? d : 0); };
    };
    a.onerror = () => { URL.revokeObjectURL(url); ok(0); };
    a.src = url;
  });
}
/** Tepe seviyesi (dBFS) ve kırpma: örneklerin %0,05'inden fazlası tam ölçekteyse kırpılmış sayılır. */
async function kaliteOlc(b: Blob): Promise<Kalite | null> {
  try {
    const ctx = new AudioContext();
    const tampon = await ctx.decodeAudioData(await b.arrayBuffer());
    void ctx.close();
    let tepe = 0, tam = 0, toplam = 0;
    for (let k = 0; k < tampon.numberOfChannels; k++) {
      const v = tampon.getChannelData(k);
      for (let i = 0; i < v.length; i++) { const a = Math.abs(v[i]); if (a > tepe) tepe = a; if (a >= 0.999) tam++; }
      toplam += v.length;
    }
    return { tepeDb: tepe > 0 ? 20 * Math.log10(tepe) : -120, kirpma: toplam > 0 && tam / toplam > 0.0005 };
  } catch {
    return null;
  }
}
const yeniId = () => Math.random().toString(36).slice(2, 9);

export function KlonModal({ onKapat, gercek, onKlonlandi, klonlanacak }: {
  onKapat: () => void;
  gercek: boolean | null;
  onKlonlandi?: (ad: string) => void;
  /** Daha önce kaydedilmiş bir örneği klonlamak için (örnek → klon). */
  klonlanacak?: { id: string; ad: string; cinsiyet: Cinsiyet; ornekAnahtar: string; ornekSn: number };
}) {
  const ekle = useOzelSesler((s) => s.ekle);
  const guncelle = useOzelSesler((s) => s.guncelle);
  const kullanici = useAuth((s) => s.kullanici);
  const [ad, setAd] = useState(klonlanacak?.ad ?? "");
  const [cinsiyet, setCinsiyet] = useState<Cinsiyet>(klonlanacak?.cinsiyet ?? "Kadın");
  const [ornekler, setOrnekler] = useState<Ornek[]>([]);
  const [kayitta, setKayitta] = useState(false);
  const [kayitSn, setKayitSn] = useState(0);
  const [seviye, setSeviye] = useState(0);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [izin, setIzin] = useState(!!klonlanacak);
  const [dil, setDil] = useState<"tr" | "en">("tr");
  const [gurultu, setGurultu] = useState(true);
  const [aciklama, setAciklama] = useState("");
  const [etiket, setEtiket] = useState({ aksan: "", yas: "", kullanim: "" });
  const kayitci = useRef<MediaRecorder | null>(null);
  const akis = useRef<MediaStream | null>(null);
  const parcalar = useRef<Blob[]>([]);
  const baslangic = useRef(0);
  const dosyaRef = useRef<HTMLInputElement>(null);
  const cal = useCalici();
  const ornekUrl = useRef<string | null>(null);

  const ornekEkle = (o: Omit<Ornek, "id" | "kalite">) => {
    const id = yeniId();
    setOrnekler((l) => [...l, { ...o, id, kalite: undefined }].slice(0, MAX_ORNEK));
    void kaliteOlc(o.blob).then((kalite) => setOrnekler((l) => l.map((x) => (x.id === id ? { ...x, kalite } : x))));
  };

  // Mevcut örneği (klonlanacak) depodan yükle.
  useEffect(() => {
    if (!klonlanacak) return;
    void yerelDepo.oku(klonlanacak.ornekAnahtar).then((b) => { if (b) ornekEkle({ blob: b, sn: klonlanacak.ornekSn, ad: "ornek.webm" }); });
  }, [klonlanacak]); // eslint-disable-line react-hooks/exhaustive-deps

  const kayitBitir = () => {
    kayitci.current?.state === "recording" && kayitci.current.stop();
  };
  // Kapanırken mikrofon ve oynatma serbest bırakılır.
  useEffect(() => () => {
    if (kayitci.current?.state === "recording") kayitci.current.stop();
    akis.current?.getTracks().forEach((t) => t.stop());
    if (ornekUrl.current) URL.revokeObjectURL(ornekUrl.current);
    if (sesCalici.durum().id?.startsWith("klon-ornek")) sesCalici.durdur();
  }, []);

  // Kayıt süresi + üst sınır
  useEffect(() => {
    if (!kayitta) return;
    const t = setInterval(() => {
      const sn = (performance.now() - baslangic.current) / 1000;
      setKayitSn(sn);
      if (sn >= MAX_SN) kayitBitir();
    }, 200);
    return () => clearInterval(t);
  }, [kayitta]);

  const kayitBaslat = async () => {
    if (ornekler.length >= MAX_ORNEK) return void toast.error("Örnek sınırına ulaşıldı", { description: `En çok ${MAX_ORNEK} örnek eklenebilir. Yenisi için birini sil.` });
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      return void toast.error("Ses kaydı desteklenmiyor", { description: "Tarayıcın kayıt yapamıyor. Bunun yerine bir ses dosyası yükleyebilirsin." });
    }
    let s: MediaStream;
    try { s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
    catch { return void mesaj.izinGerekli("Mikrofon"); }
    akis.current = s;
    const tip = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
    const r = new MediaRecorder(s, tip ? { mimeType: tip, audioBitsPerSecond: 64000 } : undefined);
    parcalar.current = [];
    r.ondataavailable = (e) => { if (e.data.size) parcalar.current.push(e.data); };
    r.onstop = () => {
      s.getTracks().forEach((t) => t.stop());
      setKayitta(false); setSeviye(0);
      const blob = new Blob(parcalar.current, { type: r.mimeType || "audio/webm" });
      const sn = (performance.now() - baslangic.current) / 1000;
      if (sn < 1) return void toast.error("Kayıt çok kısa", { description: "En az 1 saniye konuş ve yeniden kaydet." });
      ornekEkle({ blob, sn, ad: `kayit-${ornekler.length + 1}.${(r.mimeType || "audio/webm").includes("mp4") ? "m4a" : "webm"}` });
    };
    // Seviye göstergesi
    const ctx = new AudioContext();
    const analiz = ctx.createAnalyser(); analiz.fftSize = 256;
    ctx.createMediaStreamSource(s).connect(analiz);
    const veri = new Uint8Array(analiz.frequencyBinCount);
    const olc = () => {
      if (r.state !== "recording") { void ctx.close(); return; }
      analiz.getByteTimeDomainData(veri);
      let tepe = 0; for (const v of veri) tepe = Math.max(tepe, Math.abs(v - 128));
      setSeviye(Math.min(1, tepe / 64));
      requestAnimationFrame(olc);
    };
    kayitci.current = r;
    baslangic.current = performance.now();
    setKayitSn(0); setKayitta(true);
    r.start(1000);
    requestAnimationFrame(olc);
  };

  const dosyalariSec = async (liste?: FileList | null) => {
    const dosyalar = Array.from(liste ?? []);
    for (const f of dosyalar) {
      if (ornekler.length >= MAX_ORNEK) { toast.error("Örnek sınırına ulaşıldı", { description: `En çok ${MAX_ORNEK} örnek eklenebilir. Kalan dosyalar eklenmedi.` }); break; }
      if (!f.type.startsWith("audio/")) { toast.error("Bu dosya türü desteklenmiyor", { description: `${f.name} bir ses dosyası değil. MP3, WAV, M4A ya da WebM seç.` }); continue; }
      if (f.size > MAX_MB * 1024 * 1024) { toast.error("Dosya çok büyük", { description: `${f.name} eklenmedi. En çok ${MAX_MB} MB yükleyebilirsin.` }); continue; }
      const sn = await sureOlc(f);
      if (!sn) { toast.error("Dosya okunamadı", { description: `${f.name} bozuk olabilir. Başka bir dosyayla dene.` }); continue; }
      ornekEkle({ blob: f, sn, ad: f.name });
    }
  };

  const ornekDinle = (o: Ornek) => {
    const id = "klon-ornek-" + o.id;
    if (cal.id === id && cal.calisiyor) return sesCalici.duraklat();
    if (ornekUrl.current) URL.revokeObjectURL(ornekUrl.current);
    ornekUrl.current = URL.createObjectURL(o.blob);
    void sesCalici.cal(id, { tur: "dosya", url: ornekUrl.current });
  };
  const ornekSil = (o: Ornek) => {
    if (cal.id === "klon-ornek-" + o.id) sesCalici.durdur();
    const sira = ornekler.findIndex((x) => x.id === o.id);
    setOrnekler((l) => l.filter((x) => x.id !== o.id));
    mesaj.kaldirildi("Örnek", () => setOrnekler((l) => (l.some((x) => x.id === o.id) ? l : [...l.slice(0, Math.max(0, sira)), o, ...l.slice(Math.max(0, sira))])));
  };

  const temizAd = ad.trim();
  const toplamSn = ornekler.reduce((n, o) => n + o.sn, 0);
  const eksik = temizAd.length < 2 ? "Sese bir ad ver" : !ornekler.length ? "Bir örnek kaydet ya da yükle" : toplamSn < MIN_SN ? `Örnekler toplamı en az ${MIN_SN} sn olmalı (${Math.round(toplamSn)} sn)` : !izin ? "Ses sahibinin iznini onayla" : null;
  // Yerel önizleme için en uzun örnek saklanır.
  const anaOrnek = [...ornekler].sort((a, b) => b.sn - a.sn)[0];
  const etiketler = Object.fromEntries(([["accent", etiket.aksan], ["age", etiket.yas], ["use_case", etiket.kullanim]] as const).filter(([, v]) => v.trim()).map(([k, v]) => [k, v.trim()]));

  const kaydet = async () => {
    if (eksik || !anaOrnek || gonderiliyor) return;
    // Sağlayıcı bağlı değilse: örnek kredisiz saklanır, bağlantı kurulunca klonlanır.
    if (!gercek) {
      const anahtar = klonlanacak?.ornekAnahtar ?? `ornek-${Date.now().toString(36)}`;
      await yerelDepo.yaz(anahtar, anaOrnek.blob);
      if (!klonlanacak) ekle({ ad: temizAd, cinsiyet, durum: "ornek", ornekAnahtar: anahtar, ornekSn: anaOrnek.sn, ...(aciklama.trim() ? { aciklama: aciklama.trim() } : {}), ...(Object.keys(etiketler).length ? { etiketler } : {}) });
      toast.success("Ses örneği kaydedildi", { description: "Ses sağlayıcısı bağlanınca tek tıkla klonlayabilirsin. Kredi düşmedi." });
      return onKapat();
    }
    if ((kullanici?.krediler ?? 0) < KLON_KREDI) return void mesaj.yetersizKredi(KLON_KREDI, kullanici?.krediler ?? 0);
    setGonderiliyor(true);
    try {
      // Kredi sunucuda kesilir; klon oluşmazsa sunucuda iade edilir. Ekrandaki bakiye yanıtla eşitlenir.
      const s = await krediliIstek<{ sesId?: string }>("/api/ses/klon", {
        kredi: KLON_KREDI,
        json: {
          ad: temizAd, aciklama: aciklama.trim() || undefined, etiketler, gurultuTemizle: gurultu,
          ornekler: await Promise.all(ornekler.map(async (o) => ({ veri: await blobDataUrl(o.blob), ad: o.ad }))),
        },
      });
      if (s.durum === 401 || s.durum === 402) return;
      const j = s.j;
      if (!j?.ok || !j.sesId) throw new Error(j?.hata ?? "Klonlama başarısız.");
      const anahtar = klonlanacak?.ornekAnahtar ?? `ornek-${Date.now().toString(36)}`;
      await yerelDepo.yaz(anahtar, anaOrnek.blob);
      const ek = { ...(aciklama.trim() ? { aciklama: aciklama.trim() } : {}), ...(Object.keys(etiketler).length ? { etiketler } : {}) };
      if (klonlanacak) guncelle(klonlanacak.id, { durum: "klonlandi", sesId: j.sesId, ad: temizAd, cinsiyet, ...ek });
      else ekle({ ad: temizAd, cinsiyet, durum: "klonlandi", sesId: j.sesId, ornekAnahtar: anahtar, ornekSn: anaOrnek.sn, ...ek });
      toast.success(`${temizAd} sesi klonlandı`, { description: `Artık seslendirmelerde kullanabilirsin. ${KLON_KREDI} kredi düştü.` });
      onKlonlandi?.(temizAd);
      onKapat();
    } catch (e) {
      toast.error("Ses klonlanamadı", { description: `${neden(e, "Sağlayıcı yanıt vermedi.")} Kredi düşmedi, biraz sonra yeniden dene.` });
    } finally {
      setGonderiliyor(false);
    }
  };

  const kucukBaslik = "text-[11px] font-semibold text-metin-3";
  const kaliteCipleri = (o: Ornek) => {
    const k = o.kalite;
    const seviyeIyi = k ? k.tepeDb >= -23 && k.tepeDb <= -3 : false;
    return (
      <span className="mt-1 flex flex-wrap gap-1">
        <span className="glass-cip rounded px-1.5 py-0.5 text-[10.5px] font-medium tabular-nums text-metin-2">{sureYaz(o.sn)}</span>
        {k === undefined ? <span className="glass-cip flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] text-metin-3"><Loader2 className="h-2.5 w-2.5 animate-spin" />Ölçülüyor</span>
          : k === null ? <span className="glass-cip rounded px-1.5 py-0.5 text-[10.5px] text-metin-3">Kalite ölçülemedi</span>
          : (
            <>
              <span className={cn("flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums", seviyeIyi ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-300/15 text-amber-200")}
                title={seviyeIyi ? "Tepe seviyesi ideal aralıkta" : k.tepeDb < -23 ? "Kayıt çok kısık; mikrofona yaklaş" : "Kayıt çok yüksek; biraz uzaklaş"}>
                {seviyeIyi ? <Check className="h-2.5 w-2.5" /> : <AlertTriangle className="h-2.5 w-2.5" />}{k.tepeDb.toFixed(1).replace(".", ",")} dB
              </span>
              <span className={cn("flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10.5px] font-semibold", k.kirpma ? "bg-rose-500/15 text-rose-300" : "bg-emerald-400/15 text-emerald-300")}>
                {k.kirpma ? <AlertTriangle className="h-2.5 w-2.5" /> : <Check className="h-2.5 w-2.5" />}{k.kirpma ? "Kırpma var" : "Kırpma yok"}
              </span>
            </>
          )}
      </span>
    );
  };

  const odakRef = useOdakTuzagi();
  return (
    <div className="fixed inset-0 z-[80] flex justify-end" ref={odakRef} role="dialog" aria-modal="true" aria-label="Sesini klonla">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="perde absolute inset-0 bg-black/75" onClick={() => !kayitta && onKapat()} />
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%", transition: { duration: 0.2 } }} transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="relative flex h-full w-full max-w-[640px] flex-col overflow-hidden border-l border-white/[0.08] bg-[#151618]">
        <input ref={dosyaRef} type="file" accept="audio/*" multiple className="hidden" onChange={(e) => { void dosyalariSec(e.target.files); e.target.value = ""; }} />
        <div className="flex items-center gap-3 px-6 pb-3 pt-5">
          <span className="bg-white/[0.085] text-metin flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"><Mic className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[18px] font-semibold tracking-tight text-metin">{klonlanacak ? "Sesi klonla" : "Sesini klonla"}</h3>
            <p className="text-[12.5px] text-metin-3">1–{MAX_ORNEK} net kayıt ekle; toplam en az {MIN_SN} sn. Metinlerin bu sesle okunsun.</p>
          </div>
          <button onClick={onKapat} disabled={kayitta} className="hf-btn glass-cip flex h-9 w-9 items-center justify-center rounded-full text-metin-2 hover:text-metin disabled:opacity-40" aria-label="Kapat"><X className="h-4 w-4" /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 pb-5 pt-2 [scrollbar-width:thin]">
          {/* Örnekler */}
          {kayitta ? (
            <div className="panel-ic relative flex flex-col items-center overflow-hidden rounded-2xl px-6 py-7 text-center">
              <span className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(240px 120px at 50% 0%, rgba(244,63,94,0.18), transparent 70%)" }} />
              <span className="relative flex h-10 items-end gap-[3px]" aria-label="Ses seviyesi">
                {Array.from({ length: 22 }, (_, i) => (
                  <span key={i} className="w-1 rounded-full bg-rose-400 transition-[height] duration-75" style={{ height: `${Math.max(12, Math.min(100, seviye * 100 * (0.5 + ((i * 7) % 5) / 6)))}%` }} />
                ))}
              </span>
              <p className="relative mt-3 text-[20px] font-medium tabular-nums text-metin">{sureYaz(kayitSn)}</p>
              <button onClick={kayitBitir} className="hf-btn relative mt-4 flex h-10 items-center gap-2 rounded-full bg-rose-500 px-5 text-[14px] font-semibold text-white shadow-[0_0_24px_-4px_rgba(244,63,94,0.7)]"><Square className="h-3.5 w-3.5 fill-current" /> Kaydı bitir</button>
            </div>
          ) : ornekler.length === 0 ? (
            <div className="panel-ic relative flex flex-col items-center overflow-hidden rounded-2xl px-6 py-7 text-center">
              <span className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(240px 120px at 50% 0%, color-mix(in srgb, var(--color-aksan) 18%, transparent), transparent 70%)" }} />
              <button onClick={() => void kayitBaslat()} aria-label="Kaydı başlat" className="group relative flex h-20 w-20 items-center justify-center rounded-full">
                <span className="bg-white/[0.085] text-metin flex h-20 w-20 items-center justify-center rounded-full transition-transform group-hover:scale-105"><Mic className="h-8 w-8" /></span>
              </button>
              <p className="relative mt-3 text-[15px] font-semibold text-metin">Kaydet ya da dosya yükle</p>
              <span className="relative mt-2 flex flex-wrap justify-center gap-1">
                {[`${MIN_SN} sn – 2 dk`, "MP3", "WAV", "M4A", `≤ ${MAX_MB} MB`, `${MAX_ORNEK} örneğe kadar`].map((c) => <span key={c} className="glass-cip rounded px-1.5 py-0.5 text-[10.5px] font-medium text-metin-2">{c}</span>)}
              </span>
              <div className="relative mt-4 flex flex-wrap justify-center gap-2">
                <button onClick={() => void kayitBaslat()} className="hf-btn flex h-10 items-center gap-2 rounded-full bg-aksan px-5 text-[14px] font-semibold text-zemin shadow-[0_0_20px_-4px_var(--color-aksan)]"><Mic className="h-4 w-4" /> Kaydı başlat</button>
                <button onClick={() => dosyaRef.current?.click()} className="hf-btn glass-cip flex h-10 items-center gap-2 rounded-full px-5 text-[14px] font-medium text-metin"><Upload className="h-4 w-4" /> Dosya yükle</button>
              </div>
            </div>
          ) : (
            <div className="panel-ic rounded-2xl p-2.5">
              <div className="flex items-center justify-between px-1 pb-2">
                <span className={kucukBaslik}>Örnekler</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold tabular-nums", toplamSn >= MIN_SN ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-300/15 text-amber-200")}>
                  {ornekler.length}/{MAX_ORNEK} · toplam {sureYaz(toplamSn)}
                </span>
              </div>
              <div className="space-y-1.5">
                {ornekler.map((o) => {
                  const c = cal.id === "klon-ornek-" + o.id && cal.calisiyor;
                  return (
                    <div key={o.id} className="flex items-center gap-3 rounded-xl bg-black/20 p-2 ring-1 ring-inset ring-white/[0.06]">
                      <button onClick={() => ornekDinle(o)} aria-label={c ? "Duraklat" : "Örneği dinle"}
                        className="hf-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-aksan text-zemin shadow-[0_0_16px_-4px_var(--color-aksan)]">
                        {c ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
                      </button>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-[13.5px] font-medium text-metin"><FileAudio className="h-3.5 w-3.5 shrink-0 text-metin-3" /><span className="truncate">{o.ad}</span></span>
                        {kaliteCipleri(o)}
                      </span>
                      <button onClick={() => ornekSil(o)} aria-label={`${o.ad} örneğini kaldır`} className="hf-btn glass-cip flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-metin-2 hover:text-rose-300"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  );
                })}
              </div>
              {ornekler.length < MAX_ORNEK && (
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <button onClick={() => void kayitBaslat()} className="hf-btn glass-cip flex h-10 items-center justify-center gap-1.5 rounded-xl text-[12.5px] font-medium text-metin"><Mic className="h-3.5 w-3.5 text-aksan" /> Kayıt ekle</button>
                  <button onClick={() => dosyaRef.current?.click()} className="hf-btn glass-cip flex h-10 items-center justify-center gap-1.5 rounded-xl text-[12.5px] font-medium text-metin"><Plus className="h-3.5 w-3.5 text-aksan" /> Dosya ekle</button>
                </div>
              )}
            </div>
          )}

          {/* Okuma metni */}
          <div className="panel-ic rounded-2xl p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <p className={cn(kucukBaslik, "flex items-center gap-1.5")}><BookOpen className="h-3.5 w-3.5" /> Kaydederken oku</p>
              <div role="radiogroup" aria-label="Okuma metni dili" className="glass-cip flex items-center gap-1 rounded-full p-0.5">
                {(["tr", "en"] as const).map((d) => (
                  <button key={d} role="radio" aria-checked={dil === d} onClick={() => setDil(d)}
                    className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors", dil === d ? "glass-cip-aktif text-aksan" : "text-metin-3 hover:text-metin")}>{d === "tr" ? "Türkçe" : "English"}</button>
                ))}
              </div>
            </div>
            <p className="text-[16px] leading-7 text-metin">{OKUMA_METNI[dil]}</p>
            <span className="mt-2.5 flex flex-wrap gap-1">{["Doğal hızında", "Sessiz bir odada", "Mikrofona 15 cm"].map((c) => <span key={c} className="glass-cip rounded px-1.5 py-0.5 text-[10.5px] font-medium text-metin-2">{c}</span>)}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="block">
              <span className={cn(kucukBaslik, "mb-1.5 block")}>Ad</span>
              <input value={ad} onChange={(e) => setAd(e.target.value)} maxLength={40} placeholder="Ör. Benim sesim" spellCheck={false}
                className="panel-ic h-11 w-full rounded-xl px-3.5 text-[14px] text-metin outline-none placeholder:text-metin-3 focus:ring-1 focus:ring-aksan/60" />
            </label>
            <div>
              <span className={cn(kucukBaslik, "mb-1.5 block")}>Ses tonu</span>
              <div className="glass-cip flex h-11 gap-1 rounded-xl p-1" role="radiogroup" aria-label="Ses tonu">
                {(["Kadın", "Erkek", "Nötr"] as const).map((c) => (
                  <button key={c} role="radio" aria-checked={cinsiyet === c} onClick={() => setCinsiyet(c)}
                    className={cn("rounded-[9px] px-3.5 text-[13px] transition-colors", cinsiyet === c ? "glass-cip-aktif font-semibold text-aksan" : "text-metin-2 hover:text-metin")}>{c}</button>
                ))}
              </div>
            </div>
          </div>

          <AnahtarKart ikon={<Wind className="h-4 w-4" />} renk="yesil" baslik="Arka plan gürültüsünü temizle" ipucu="Örneklerdeki uğultu ve oda sesi klonlamadan önce ayıklanır. Temiz stüdyo kaydında kapatabilirsin." acik={gurultu} onDegis={() => setGurultu((v) => !v)} />

          <KartBolum baslik="Açıklama ve etiketler · isteğe bağlı" ikon={<Tag className="h-3.5 w-3.5" />}>
            <textarea value={aciklama} onChange={(e) => setAciklama(e.target.value.slice(0, 500))} rows={2} spellCheck={false}
              placeholder="Ör. Sıcak, samimi bir anlatıcı; podcast ve belgesel için."
              className="block w-full resize-none rounded-xl bg-black/25 px-3 py-2.5 text-[13.5px] leading-relaxed text-metin outline-none ring-1 ring-inset ring-white/[0.06] placeholder:text-metin-3 focus:ring-aksan/50" />
            <div className="grid grid-cols-3 gap-1.5">
              {([["aksan", "Aksan", "İstanbul"], ["yas", "Yaş", "Genç"], ["kullanim", "Kullanım", "Anlatım"]] as const).map(([k, et, yer]) => (
                <label key={k} className="block">
                  <span className="mb-1 block text-[10.5px] text-metin-3">{et}</span>
                  <input value={etiket[k]} onChange={(e) => setEtiket((x) => ({ ...x, [k]: e.target.value.slice(0, 40) }))} placeholder={yer} spellCheck={false}
                    className="glass-cip h-9 w-full rounded-lg px-2.5 text-[12.5px] text-metin outline-none placeholder:text-metin-3 focus:ring-1 focus:ring-aksan/60" />
                </label>
              ))}
            </div>
          </KartBolum>

          <label className={cn("panel-ic flex cursor-pointer items-start gap-3 rounded-xl p-3 transition-shadow", izin && "ring-1 ring-aksan/60")}>
            <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors", izin ? "border-aksan bg-aksan shadow-[0_0_10px_var(--color-aksan)]" : "border-white/25")}>
              {izin && <Check className="h-3 w-3 text-zemin" strokeWidth={3.5} />}
            </span>
            <input type="checkbox" checked={izin} onChange={(e) => setIzin(e.target.checked)} className="sr-only" />
            <span className="text-[12.5px] leading-relaxed text-metin-2">Bu ses bana ait ya da sahibinden açık izin aldım. Aldatma, taklit veya izinsiz ticari kullanım için kullanmayacağım.</span>
          </label>
        </div>

        <div className="flex items-center gap-3 border-t border-kenar px-6 py-4">
          {gercek === false ? (
            <span className="glass-cip flex min-w-0 items-center gap-2 rounded-full px-3 py-1.5 text-[12px] text-metin-2" title="Örnek bu cihazda saklanır; sağlayıcı bağlanınca tek tıkla klonlanır. Kredi düşmez."><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300 shadow-[0_0_8px_#fcd34d]" />Örnek saklanır, sonra klonlanır</span>
          ) : (
            <span className="glass-cip min-w-0 truncate rounded-full px-3 py-1.5 text-[12px] text-metin-2">{eksik ?? `Klonlama · ${KLON_KREDI} kredi`}</span>
          )}
          <span className="flex-1" />
          <button onClick={() => void kaydet()} disabled={!!eksik || gonderiliyor || kayitta} title={eksik ?? undefined}
            className="hf-cta flex h-10 items-center gap-2 !rounded-full px-5 text-[14px] disabled:cursor-not-allowed">
            {gonderiliyor ? <><Loader2 className="h-4 w-4 animate-spin" /> Klonlanıyor</> : gercek ? `Sesi klonla · ${KLON_KREDI}` : "Örneği kaydet"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
