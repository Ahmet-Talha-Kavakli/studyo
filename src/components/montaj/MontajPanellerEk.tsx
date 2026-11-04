"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { KrediYildiz } from "@/components/ui/KrediHap";
import {
  Sparkles, Film, Image as ImageIcon, Music2, Mic, Loader2, Lock, Square, Circle, Minus, Frame, Tag, IdCard, Upload, Captions, Wand2,
  Trash2, Check, Type as TypeIcon, Play, Gauge, Download, Scissors, SkipBack, SkipForward, Aperture, Shapes, LayoutTemplate, type LucideIcon,
} from "lucide-react";
import { cn, saltUrl } from "@/lib/utils";
import { useMasaustu } from "@/hooks/useMasaustu";
import { toast } from "@/lib/toast";
import { HapKaydirici, MarkaKare, Rozet } from "@/components/studyo/hf";
import { useAuth } from "@/store/useAuth";
import { useProjeler } from "@/store/useProjeler";
import { useSaglayicilar } from "@/hooks/useSaglayicilar";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { icerikDenetle } from "@/lib/moderasyon";
import { videoKrediHesap } from "@/lib/videoModelVeri";
import { videoErisim } from "@/lib/videoSaglayici";
import { muzikKredi } from "@/lib/muzikVeri";
import { SESLER } from "@/lib/sesVeri";
import { besteWavUrl } from "@/lib/muzikMotoru";
import {
  useMontaj, klipSure, montajToplamSure, type MontajProje, type MontajKlip, type MontajOge, type MetinStil, type MontajOran, type MontajEfekt, type MontajGecis,
} from "@/store/useMontaj";
import { medyaSuresi, videoKaynak } from "@/lib/montajMotor";
import { PanelSerit, PKart, SayiHap, Segment } from "./ui";
import { katmanBul, medyayiEkle, dosyaYukle, kisaSure, zamanKodu, tumKlipler, araligiKes, altyaziMetni, sonrakileriKaydir } from "./ortak";
import { kareYakala } from "@/components/studyo/VideoGoruntuleyici";

const PANEL_IKON: Record<string, LucideIcon> = { "AI ile üret": Sparkles, "Öğeler": Shapes, "Altyazı": Captions, "Şablonlar": LayoutTemplate };
function PanelBaslik({ baslik, alt }: { baslik: string; alt?: string }) {
  if (!useMasaustu()) return null; // mobilde alt sayfanın kendi başlığı var
  return <PanelSerit baslik={baslik} alt={alt} ikon={PANEL_IKON[baslik]} />;
}

/* ═══════════════════════════ AI ÜRET ═══════════════════════════ */

type UretTur = "video" | "gorsel" | "muzik" | "ses";
/** kaydir: sonuç eklenmeden önce o katmanda konumdan sonrası üretilen süre kadar sağa kayar (araya ekleme). */
type Bekleyen = { id: string; tur: UretTur; konum: number; ad: string; baslama: number; kaydir?: string };
type KlipAi = "devam" | "once" | "kare";
/** Metinden video üretebilen, sağlayıcısı bağlı modeller (kapanan ya da yalnız görselden çalışanlar yok). */
const VIDEO_MODELLER = ["Kling 3.0", "Kling 4.0", "Seedance 2.5", "Seedance 2.0", "MiniMax H3 Max", "Gemini Omni Flash", "HappyHorse 1.1", "FLUX 3 Max Video", "Kling 3.0 Turbo"]
  .filter((m) => { const e = videoErisim(m); return e.durum === "gercek" && !e.gorselGerekli; });
/** Modelin desteklediği sürelerden en çok dört seçenek (yoksa 5 / 10 sn). */
function modelSureleri(m: string): number[] {
  const e = videoErisim(m);
  const l = e.durum === "gercek" && e.sureler.length ? e.sureler : [5, 10];
  if (l.length <= 4) return l;
  // Uzun aralıklarda (3..15 gibi) yuvarlak değerler: 5, 8, 10, 15 içinden desteklenenler
  const yuvarlak = [5, 8, 10, 15].filter((n) => l.includes(n));
  return yuvarlak.length >= 2 ? yuvarlak : [l[0], l[Math.floor(l.length / 2)], l[l.length - 1]];
}
const GORSEL_MODELLER = [["Nano Banana Pro", 4], ["Vayra Ruh Sinema", 3], ["GPT Image 2.5", 8]] as const;

export function UretPanel({ proje }: { proje: MontajProje }) {
  const uretimler = useProjeler((s) => s.uretimler);
  const saglayici = useSaglayicilar();
  const [tur, setTur] = useState<UretTur>("video");
  const [istem, setIstem] = useState("");
  const [vModel, setVModel] = useState(VIDEO_MODELLER[0]);
  const [gModel, setGModel] = useState<string>(GORSEL_MODELLER[0][0]);
  const [sure, setSure] = useState(5);
  const [ses, setSes] = useState(SESLER[0].ad);
  const [muzikSn, setMuzikSn] = useState(30);
  const [bekleyen, setBekleyen] = useState<Bekleyen[]>([]);
  const [mesgul, setMesgul] = useState(false);
  const elevenBagli = saglayici?.eleven === true;

  /* Tamamlanan üretimler playhead'deki konuma, doğru katmana düşer. */
  useEffect(() => {
    for (const b of bekleyen) {
      const u = uretimler.find((x) => x.id === b.id);
      if (!u || (u.durum !== "tamam" && u.durum !== "hata")) continue;
      setBekleyen((l) => l.filter((x) => x.id !== b.id));
      if (u.durum === "hata") { toast.error("Üretim başarısız", { description: `${u.hata ?? "Sağlayıcı bir hata döndürdü."} Yeniden üretmeyi dene.` }); continue; }
      void (async () => {
        if (b.tur === "video" && u.videoUrl) {
          const s = (await medyaSuresi(u.videoUrl, "video")) ?? sure;
          if (b.kaydir) { useMontaj.getState().anlikKaydet(proje.id); sonrakileriKaydir(proje.id, b.kaydir, "", b.konum, s); }
          medyayiEkle(proje.id, { id: u.id, ad: u.baslik, tur: "video", url: u.videoUrl, poster: saltUrl(u.gorselUrl), sure: s, kaynakId: u.id }, b.konum, b.kaydir);
        } else if (b.tur === "gorsel" && saltUrl(u.gorselUrl)) {
          medyayiEkle(proje.id, { id: u.id, ad: u.baslik, tur: "gorsel", url: saltUrl(u.gorselUrl)!, poster: saltUrl(u.gorselUrl), kaynakId: u.id }, b.konum);
        } else if (b.tur === "ses" && u.sesUrl) {
          const s = (await medyaSuresi(u.sesUrl, "ses")) ?? 5;
          const kat = katmanBul(proje.id, "ses", [b.konum, b.konum + s]);
          if (kat) useMontaj.getState().klipEkle(proje.id, kat, { ad: u.baslik, tur: "ses", sesUrl: u.sesUrl, sure: s, baslangic: b.konum, kaynakId: u.id });
        } else return void toast.error("Üretim çıktısı eklenemedi", { description: "Sağlayıcı bağlı değilse Örnek çıktı oynatılabilir medya içermeyebilir. Sağlayıcıyı bağlayıp yeniden üret." });
        toast.success(`${b.ad} montaja eklendi`, { description: `${zamanKodu(b.konum, proje.fps)} konumuna yerleştirildi.` });
      })();
    }
  }, [uretimler, bekleyen, proje.id, proje.fps, sure]);

  const sureler = modelSureleri(vModel);
  useEffect(() => { if (!sureler.includes(sure)) setSure(sureler.includes(5) ? 5 : sureler[0]); }, [vModel]); // eslint-disable-line react-hooks/exhaustive-deps
  const vKredi = videoKrediHesap(vModel);
  const gKredi = GORSEL_MODELLER.find(([a]) => a === gModel)?.[1] ?? 4;
  const mKredi = muzikKredi("Eleven Music v2.5", muzikSn);
  const sKredi = Math.max(1, Math.ceil(istem.length / 1000));
  const kredi = tur === "video" ? vKredi : tur === "gorsel" ? gKredi : tur === "muzik" ? (elevenBagli ? mKredi : 0) : (elevenBagli ? sKredi : 0);

  /* Seçili video klip üzerinde AI: devamını/öncesini üret ya da playhead karesinden yeni çekim. Kaynağın gerçek karesi kullanılır. */
  const seciliId = useMontaj((s) => s.seciliKlipId);
  const playhead = useMontaj((s) => s.playhead);
  const secK = tumKlipler(proje).find((k) => k.id === seciliId && k.tur === "video" && videoKaynak(k));
  const klipAi = async (mod: KlipAi) => {
    if (!secK) return;
    const src = videoKaynak(secK)!;
    const kat = proje.katmanlar.find((x) => x.klipler.some((c) => c.id === secK.id))!;
    setMesgul(true);
    try {
      const hiz = Math.max(0.25, secK.hiz);
      const an = mod === "devam" ? secK.sure - secK.sonKirp - 0.05 : mod === "once" ? secK.basKirp + 0.02 : secK.basKirp + Math.max(0, playhead - secK.baslangic) * hiz;
      const kare = await kareYakala(src, an);
      const varsayilan = mod === "devam" ? "Sahnenin doğal devamı, aynı ışık ve kamera hareketi" : mod === "once" ? "Bu sahneye götüren önceki an, aynı ışık ve üslup" : "Bu kareden başlayan yeni çekim";
      const metin = istem.trim() || varsayilan;
      const ad = `${mod === "devam" ? "Devamı" : mod === "once" ? "Öncesi" : "Yeni çekim"} · ${secK.ad}`.slice(0, 48);
      const r = uretimBaslat({ baslik: ad, tur: "video", model: vModel, prompt: metin, kredi: vKredi, arac: "Montaj Stüdyosu",
        meta: { oran: proje.enBoy === "4:5" ? "1:1" : proje.enBoy, sure: `${sure}sn`, hamIstem: metin, ...(secK.kaynakId ? { kaynakId: secK.kaynakId } : {}), ...(mod === "once" ? { bitisKareUrl: kare } : { gorselUrl: kare }) } });
      if (!r.ok) return uretimHataToast(r);
      const konum = mod === "devam" ? secK.baslangic + klipSure(secK) : mod === "once" ? secK.baslangic : playhead;
      if (r.id) setBekleyen((l) => [...l, { id: r.id!, tur: "video", konum, ad, baslama: Date.now(), kaydir: mod === "kare" ? undefined : kat.id }]);
      toast(mod === "devam" ? "Devamı üretiliyor" : mod === "once" ? "Öncesi üretiliyor" : "Yeni çekim üretiliyor", { description: mod === "kare" ? "Bitince oynatma çizgisinin olduğu yerde üst katmana eklenir." : "Bitince araya eklenir, sonraki klipler kayar." });
    } catch {
      toast.error("Klibin karesi alınamadı", { description: "Klip henüz yüklenmemiş olabilir. Biraz bekleyip yeniden dene." });
    } finally { setMesgul(false); }
  };

  const uret = async () => {
    if (istem.trim().length < 3) return void toast.error(tur === "ses" ? "Metin çok kısa" : "İstem çok kısa", { description: tur === "ses" ? "Seslendirilecek metni en az birkaç kelimeyle yaz." : "Ne üretileceğini birkaç kelimeyle anlat." });
    const d = icerikDenetle(istem); if (!d.izin) return void toast.error("İçerik engellendi", { description: `${d.mesaj} İstemi değiştirip yeniden dene.` });
    const konum = useMontaj.getState().playhead;
    const ad = istem.trim().slice(0, 40);
    if (tur === "muzik") {
      setMesgul(true);
      try {
        const kat = katmanBul(proje.id, "ses", [konum, konum + muzikSn]); if (!kat) return;
        let url: string, gercek = false;
        if (elevenBagli) {
          if (!useAuth.getState().krediDus(mKredi)) throw new Error(`Yetersiz kredi (${mKredi})`);
          const r = (await (await fetch("/api/muzik/uret", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "Eleven Music v2.5", istem: istem.trim(), sozler: "", stiller: [], haric: [], enstrumantal: true, sureSn: muzikSn }) })).json()) as { ok: boolean; sesUrl?: string; hata?: string };
          if (!r.ok || !r.sesUrl) { useAuth.getState().krediEkle(mKredi); throw new Error(r.hata ?? "Müzik üretilemedi"); }
          url = r.sesUrl; gercek = true;
        } else {
          // Demo: tarayıcıda gerçek bir enstrümantal sentezlenir (kredi düşmez)
          const tohum = istem.trim();
          const hizli = /hızlı|enerjik|aksiyon|dans|tempo|heyecan/i.test(tohum), huzun = /hüzün|duygusal|yavaş|sakin|melankolik/i.test(tohum);
          const wav = await besteWavUrl({ tohum, bpm: hizli ? 128 : huzun ? 78 : 104, key: "A", minor: huzun || !hizli, sure: Math.min(60, muzikSn), yogunluk: hizli ? 0.85 : huzun ? 0.35 : 0.6, parlaklik: hizli ? 0.75 : 0.5, enstrumantal: true });
          url = await dosyaYukle(await (await fetch(wav)).blob(), "audio/wav");
        }
        const s = (await medyaSuresi(url, "ses")) ?? muzikSn;
        const st = useMontaj.getState();
        st.katmanGuncelle(proje.id, kat, { rol: "muzik" });
        st.klipEkle(proje.id, kat, { ad: `Müzik · ${ad}`, tur: "ses", sesUrl: url, sure: s, baslangic: konum, sesDuzey: 70 });
        useProjeler.getState().ekle({ baslik: ad, tur: "muzik", model: gercek ? "Eleven Music v2.5" : "Vayra beste (tarayıcı)", prompt: istem.trim(), durum: "tamam", ilerleme: 100, kredi: gercek ? mKredi : 0, arac: "Montaj Stüdyosu", sesUrl: url, gercek, saglayici: gercek ? "eleven" : "tarayici" });
        toast.success("Müzik eklendi", { description: gercek ? `${mKredi} kredi harcandı.` : "Tarayıcıda sentezlendi, kredi düşmedi." });
      } catch (e) { toast.error("Müzik üretilemedi", { description: `${e instanceof Error ? e.message : "Beklenmeyen bir sorun çıktı."} Yeniden dene.` }); }
      finally { setMesgul(false); }
      return;
    }
    if (tur === "ses" && !elevenBagli) return void toast.error("ElevenLabs bağlı değil", { description: "Seslendirme için ElevenLabs bağlantısı gerekli. Ayarlar'dan bağlayıp yeniden dene." });
    const r = tur === "video"
      ? uretimBaslat({ baslik: ad, tur: "video", model: vModel, prompt: istem.trim(), kredi: vKredi, arac: "Montaj Stüdyosu", meta: { oran: proje.enBoy === "4:5" ? "1:1" : proje.enBoy, sure: `${sure}sn`, hamIstem: istem.trim() } })
      : tur === "gorsel"
        ? uretimBaslat({ baslik: ad, tur: "gorsel", model: gModel, prompt: istem.trim(), kredi: gKredi, arac: "Montaj Stüdyosu", meta: { oran: proje.enBoy, islem: "uret", hamIstem: istem.trim() } })
        : uretimBaslat({ baslik: ad, tur: "ses", model: "Eleven Multilingual v2", prompt: istem.trim(), kredi: sKredi, arac: "Montaj Stüdyosu", meta: { mod: "seslendirme", ses, sesId: SESLER.find((x) => x.ad === ses)?.sesId, hamIstem: istem.trim(), karakter: istem.trim().length } });
    if (!r.ok) return uretimHataToast(r);
    if (r.id) setBekleyen((l) => [...l, { id: r.id!, tur, konum, ad, baslama: Date.now() }]);
    toast(tur === "video" ? "Video üretiliyor" : tur === "gorsel" ? "Görsel üretiliyor" : "Seslendirme hazırlanıyor", { description: `Bitince ${zamanKodu(konum, proje.fps)} konumuna eklenecek.` });
  };

  const SEKMELER: [UretTur, string, typeof Film][] = [["video", "Video", Film], ["gorsel", "Görsel", ImageIcon], ["muzik", "Müzik", Music2], ["ses", "Ses", Mic]];
  return (
    <>
      <PanelBaslik baslik="AI ile üret" alt="Oynatma çizgisinin olduğu yere eklenir" />
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4 [scrollbar-width:thin]">
        {secK && (
          <PKart baslik="Seçili klipten üret" alt={secK.ad} ikon={Film} govde="p-0">
            <div className="grid grid-cols-3 gap-1.5 p-2.5">
              {([["once", "Öncesi", SkipBack, "Araya, başa"], ["devam", "Devamı", SkipForward, "Araya, sona"], ["kare", "Bu kareden", Aperture, kisaSure(Math.max(0, playhead - secK.baslangic))]] as const).map(([m, ad, Ik, alt]) => (
                <button key={m} onClick={() => void klipAi(m)} disabled={mesgul} title={`${ad} · ${vModel} · ${sure} sn · ${vKredi} kredi`}
                  className="flex flex-col items-center gap-1 rounded-[12px] bg-white/[0.065] px-1 pb-2 pt-2.5 transition-[background-color,transform] hover:bg-white/[0.1] active:scale-[0.97] disabled:opacity-50">
                  <Ik className="h-4 w-4 text-white/80" />
                  <span className="text-[12.5px] font-medium text-metin">{ad}</span>
                  <span className="-mt-0.5 text-[11px] tabular-nums text-metin-3">{alt}</span>
                </button>
              ))}
            </div>
            <p className="border-t border-white/[0.06] px-3 py-2 text-[11.5px] leading-snug text-metin-3">Klibin gerçek karesinden aşağıdaki istem ve modelle {sure} sn üretir · {vKredi} kredi</p>
          </PKart>
        )}
        <Segment etiket="Ne üretilsin" deger={tur} onDegis={setTur} secenekler={SEKMELER} />
        <div className="rounded-[16px] bg-white/[0.045] p-3 ring-1 ring-inset ring-white/[0.08] focus-within:ring-white/25">
          <div className="mb-1.5 flex items-center justify-between"><span className="text-[12.5px] font-medium text-white/70">{tur === "ses" ? "Metin" : "İstem"}</span>{istem.length > 0 && <span className="text-[11px] tabular-nums text-metin-3">{istem.length}</span>}</div>
          <textarea value={istem} onChange={(e) => setIstem(e.target.value.slice(0, tur === "ses" ? 3000 : 800))} rows={4} spellCheck={false}
            placeholder={tur === "video" ? "ör. gün batımında sahilde koşan köpek, yavaş takip çekimi" : tur === "gorsel" ? "ör. minimal beyaz zeminde kırmızı spor ayakkabı, stüdyo ışığı" : tur === "muzik" ? "ör. enerjik, umut veren elektronik altyapı" : "Seslendirilecek metni yaz…"}
            className="block w-full resize-none bg-transparent text-[13.5px] leading-relaxed text-metin outline-none placeholder:text-white/40" />
        </div>
        {tur === "video" && (
          <>
            <PKart baslik="Model" ikon={Film} govde="p-1.5">
              {VIDEO_MODELLER.map((m) => <ModelSatir key={m} ad={m} kredi={videoKrediHesap(m)} secili={vModel === m} onSec={() => setVModel(m)} />)}
            </PKart>
            <PKart baslik="Süre" ikon={Gauge} govde="p-2.5"><Segment etiket="Süre" deger={sure} onDegis={setSure} secenekler={sureler.map((n) => [n, `${n} sn`] as const)} /></PKart>
          </>
        )}
        {tur === "gorsel" && (
          <PKart baslik="Model" alt={`${proje.enBoy} oranında üretilir, 4 sn'lik klip olarak eklenir`} ikon={ImageIcon} govde="p-1.5">
            {GORSEL_MODELLER.map(([m, k]) => <ModelSatir key={m} ad={m} kredi={k} secili={gModel === m} onSec={() => setGModel(m)} />)}
          </PKart>
        )}
        {tur === "muzik" && (
          <PKart baslik="Süre" ikon={Music2} govde="space-y-2.5 p-3">
            <HapKaydirici ad="Uzunluk" deger={muzikSn} min={10} max={elevenBagli ? 180 : 60} adim={5} onDegis={setMuzikSn} solUc="10 sn" sagUc={elevenBagli ? "3 dk" : "1 dk"} yaz={(n) => kisaSure(n)} />
            <button onClick={() => setMuzikSn(Math.max(10, Math.min(elevenBagli ? 180 : 60, Math.ceil(montajToplamSure(proje)))))} className="flex h-8 items-center rounded-full bg-white/[0.085] px-3 text-[12px] font-medium text-white transition hover:bg-white/[0.12] active:scale-[0.97]">Montaj süresine eşitle · {kisaSure(montajToplamSure(proje))}</button>
            {!elevenBagli && <p className="text-[11.5px] leading-snug text-white/55">İstemin ruh haline göre enstrümantal bir parça bestelenir, ücretsiz.</p>}
          </PKart>
        )}
        {tur === "ses" && (
          <PKart baslik="Ses" ikon={Mic}>
            <div className="grid grid-cols-2 gap-1.5">
              {SESLER.slice(0, 8).map((s) => (
                <button key={s.ad} onClick={() => setSes(s.ad)} aria-pressed={ses === s.ad} className={cn("flex items-center gap-2 rounded-[12px] px-2 py-2 text-left outline outline-2 -outline-offset-2 transition-[outline-color,background-color] active:scale-[0.98]", ses === s.ad ? "bg-white/[0.08] outline-white" : "bg-white/[0.045] outline-transparent hover:bg-white/[0.06]")}>
                  <span className="h-6 w-6 shrink-0 rounded-full" style={{ background: s.renk }} />
                  <span className="min-w-0"><span className="block truncate text-[12.5px] font-semibold text-metin">{s.ad}</span><span className="block truncate text-[11px] text-metin-3">{s.cinsiyet}</span></span>
                </button>
              ))}
            </div>
          </PKart>
        )}
        <button onClick={() => void uret()} disabled={mesgul}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white text-[14px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.98] disabled:bg-white/[0.08] disabled:text-white/40">
          {mesgul ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Üret ve ekle {kredi > 0 && <span className="flex items-center gap-0.5 tabular-nums text-black/55"><KrediYildiz className="h-3 w-3" />{kredi}</span>}
        </button>
        {bekleyen.length > 0 && (
          <PKart baslik="Üretiliyor" ikon={Loader2} sag={<SayiHap n={bekleyen.length} />} govde="space-y-1.5 p-1.5">
            {bekleyen.map((b) => {
              const u = uretimler.find((x) => x.id === b.id);
              return (
                <div key={b.id} className="rounded-[12px] p-2">
                  <span className="flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-white" /><span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-metin">{b.ad}</span><span className="text-[11.5px] tabular-nums text-metin-2">%{u?.ilerleme ?? 0}</span></span>
                  <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/[0.1]"><span className="block h-full rounded-full bg-white transition-[width] duration-500" style={{ width: `${u?.ilerleme ?? 0}%` }} /></span>
                  <span className="mt-1 block text-[11px] tabular-nums text-metin-3">{zamanKodu(b.konum, proje.fps)} konumuna eklenecek</span>
                </div>
              );
            })}
          </PKart>
        )}
      </div>
    </>
  );
}

/** Model satırı: gerçek logo + ad + kredi; seçili satır beyaz halkalı (tik yok). */
function ModelSatir({ ad, kredi, secili, onSec }: { ad: string; kredi: number; secili: boolean; onSec: () => void }) {
  return (
    <button onClick={onSec} aria-pressed={secili} className={cn("flex w-full items-center gap-2.5 rounded-[12px] p-1.5 text-left ring-inset transition-[background-color,box-shadow] active:scale-[0.99]", secili ? "bg-white/[0.08] ring-2 ring-white" : "ring-0 hover:bg-white/[0.08]")}>
      <MarkaKare ad={ad} boyut={32} />
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-metin">{ad}</span>
      <span className={cn("flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-semibold tabular-nums", secili ? "bg-white text-black" : "text-white/75")}><KrediYildiz className="h-3 w-3" />{kredi}</span>
    </button>
  );
}

/* ═══════════════════════════ ÖĞELER ═══════════════════════════ */

const OGE_HAZIR: { ad: string; alt: string; oge: MontajOge; ikon: typeof Square; sure: number }[] = [
  { ad: "Alt bant", alt: "İsim · unvan", oge: { tip: "altbant", renk: "#22d3ee", baslik: "Ad Soyad", alt: "Unvan · Şirket" }, ikon: IdCard, sure: 4 },
  { ad: "Haber bandı", alt: "Son dakika · duyuru", oge: { tip: "altbant", renk: "#ef4444", baslik: "SON DAKİKA", alt: "Duyuru metni" }, ikon: IdCard, sure: 4 },
  { ad: "İlerleme çubuğu", alt: "Videoyla dolar", oge: { tip: "ilerleme", renk: "#22d3ee" }, ikon: Gauge, sure: 0 },
  { ad: "Köşe etiketi", alt: "Yeni · indirim", oge: { tip: "sekil", sekil: "kose", renk: "#facc15", renk2: "#1c1400", baslik: "Yeni" }, ikon: Tag, sure: 3 },
  { ad: "Çerçeve", alt: "Kenar çizgisi", oge: { tip: "sekil", sekil: "cerceve", renk: "#ffffff" }, ikon: Frame, sure: 0 },
  { ad: "Dikdörtgen", alt: "Arka plan kutusu", oge: { tip: "sekil", sekil: "dikdortgen", renk: "#0b0d10", koseler: 8 }, ikon: Square, sure: 3 },
  { ad: "Daire", alt: "Vurgu", oge: { tip: "sekil", sekil: "daire", renk: "#22d3ee" }, ikon: Circle, sure: 3 },
  { ad: "Çizgi", alt: "Ayırıcı", oge: { tip: "sekil", sekil: "cizgi", renk: "#ffffff" }, ikon: Minus, sure: 3 },
];

export function OgelerPanel({ proje }: { proje: MontajProje }) {
  const dosyaRef = useRef<HTMLInputElement>(null);
  const ekle = (o: (typeof OGE_HAZIR)[number], ek?: Partial<MontajKlip>) => {
    const st = useMontaj.getState();
    const tamSure = montajToplamSure(proje);
    const bas = o.sure === 0 ? 0 : st.playhead;
    const kat = katmanBul(proje.id, "metin", [bas, bas + (o.sure === 0 ? Math.max(3, tamSure) : o.sure)]); if (!kat) return;
    const id = st.klipEkle(proje.id, kat, { ad: o.ad, tur: "metin", oge: { ...o.oge }, sure: o.sure === 0 ? Math.max(3, tamSure) : o.sure, baslangic: bas, ...ek });
    st.klipSec(id);
    toast.success(`${o.ad} eklendi`, { description: o.sure === 0 ? "Tüm montaj boyunca görünür." : "Tuvalde sürükleyip boyutlandırabilirsin." });
  };
  const logo = async (d: File) => {
    try {
      const url = await dosyaYukle(d);
      ekle({ ad: "Logo", alt: "", oge: { tip: "logo", renk: "#ffffff" }, ikon: ImageIcon, sure: 0 }, { gorselUrl: url, opaklik: 90 });
    } catch (e) { toast.error("Logo yüklenemedi", { description: `${e instanceof Error ? e.message : "Beklenmeyen bir sorun çıktı."} Yeniden dene.` }); }
  };
  return (
    <>
      <PanelBaslik baslik="Öğeler" alt="Alt bant, etiket, şekil ve logo" />
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4 [scrollbar-width:thin]">
        <input ref={dosyaRef} type="file" accept="image/png,image/webp,image/jpeg" hidden onChange={(e) => { const d = e.target.files?.[0]; e.target.value = ""; if (d) void logo(d); }} />
        <button onClick={() => dosyaRef.current?.click()} className="group flex w-full items-center gap-3 rounded-2xl bg-white/[0.045] px-3.5 py-3 text-left ring-1 ring-inset ring-white/[0.08] transition-[background-color,transform] hover:bg-white/[0.05] active:scale-[0.99]">
          <span className="bg-white/[0.085] text-white flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"><Upload className="h-[18px] w-[18px]" /></span>
          <span className="min-w-0"><span className="block text-[13.5px] font-semibold text-metin">Logo ya da filigran ekle</span><span className="block text-[11.5px] text-metin-3">Şeffaf PNG önerilir · tüm montaj boyunca köşede</span></span>
        </button>
        <PKart baslik="Hazır öğeler" alt="Tıkla, oynatma çizgisinin olduğu yere eklensin" ikon={Shapes}>
        <div className="grid grid-cols-2 gap-2">
          {OGE_HAZIR.map((o) => (
            <button key={o.ad} onClick={() => ekle(o)} className="group overflow-hidden rounded-[12px] text-left ring-1 ring-inset ring-white/[0.08] transition-[box-shadow,transform] hover:ring-white/40 active:scale-[0.98]">
              <span className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-[url(/gercek/video-hareket/focus-pull-poster.webp)] bg-cover bg-center shadow-[inset_0_0_0_999px_rgba(0,0,0,0.45)]">
                <span className="absolute inset-0 flex items-center justify-center"><OgeOnizleme o={o.oge} /></span>
              </span>
              <span className="flex items-center gap-1.5 bg-white/[0.045] px-2 py-1.5"><o.ikon className="h-3.5 w-3.5 shrink-0 text-white/60" /><span className="min-w-0"><span className="block truncate text-[12px] font-semibold text-metin">{o.ad}</span><span className="block truncate text-[11px] text-metin-3">{o.alt}</span></span></span>
            </button>
          ))}
        </div>
        </PKart>
      </div>
    </>
  );
}

function OgeOnizleme({ o }: { o: MontajOge }) {
  if (o.tip === "altbant") return <span className="absolute bottom-3 left-3 flex h-7 w-24 overflow-hidden rounded bg-black/80"><span className="w-1" style={{ background: o.renk }} /><span className="flex flex-col justify-center px-1.5"><span className="h-1.5 w-12 rounded bg-white" /><span className="mt-1 h-1 w-9 rounded bg-white/50" /></span></span>;
  if (o.tip === "ilerleme") return <span className="absolute inset-x-0 bottom-0 h-1.5 bg-white/20"><span className="block h-full w-3/5" style={{ background: o.renk }} /></span>;
  if (o.sekil === "kose") return <span className="absolute right-3 top-3 rounded px-2 py-0.5 text-[10px] font-extrabold" style={{ background: o.renk, color: o.renk2 }}>YENİ</span>;
  if (o.sekil === "cerceve") return <span className="absolute inset-2.5 rounded border-2" style={{ borderColor: o.renk }} />;
  if (o.sekil === "daire") return <span className="h-12 w-12 rounded-full" style={{ background: o.renk }} />;
  if (o.sekil === "cizgi") return <span className="h-1 w-20 rounded-full" style={{ background: o.renk }} />;
  return <span className="h-10 w-20 rounded-md ring-1 ring-white/20" style={{ background: o.renk }} />;
}

/* ═══════════════════════════ ALTYAZI ═══════════════════════════ */

const ALTYAZI_STILLERI: [MetinStil, string, string][] = [["altyazi", "Klasik", "Kutulu, okunaklı"], ["karaoke", "Karaoke", "Sözcük vurgulu"], ["tiktok", "TikTok", "Kalın, konturlu"], ["neon", "Neon", "Parlayan"]];

export function AltyaziPanel({ proje }: { proje: MontajProje }) {
  const seciliId = useMontaj((s) => s.seciliKlipId);
  const saglayici = useSaglayicilar();
  const elevenBagli = saglayici?.eleven === true;
  const [metin, setMetin] = useState("");
  const [mesgul, setMesgul] = useState(false);
  const [stil, setStil] = useState<MetinStil>("karaoke");
  const altyaziKat = proje.katmanlar.find((k) => k.tur === "metin" && k.ad === "Altyazı");
  const satirlar = useMemo(() => [...(altyaziKat?.klipler ?? [])].sort((a, b) => a.baslangic - b.baslangic), [altyaziKat]);
  const klipler = tumKlipler(proje);
  const sesli = klipler.filter((k) => (k.tur === "ses" && k.sesUrl) || (k.tur === "video" && videoKaynak(k)));
  const hedef = sesli.find((k) => k.id === seciliId) ?? sesli[0];

  const katmanHazirla = () => {
    const st = useMontaj.getState();
    let kat = useMontaj.getState().projeler.find((x) => x.id === proje.id)!.katmanlar.find((k) => k.tur === "metin" && k.ad === "Altyazı");
    if (!kat) { st.katmanEkle(proje.id, "metin"); const yeni = useMontaj.getState().projeler.find((x) => x.id === proje.id)!.katmanlar.find((k) => k.tur === "metin" && k.klipler.length === 0 && k.ad !== "Altyazı"); if (yeni) st.katmanGuncelle(proje.id, yeni.id, { ad: "Altyazı" }); kat = useMontaj.getState().projeler.find((x) => x.id === proje.id)!.katmanlar.find((k) => k.tur === "metin" && k.ad === "Altyazı"); }
    return kat!.id;
  };
  const yerlestir = (parcalar: { metin: string; b: number; s: number; kelimeler?: { k: string; b: number; s: number }[] }[]) => {
    const kat = katmanHazirla();
    const st = useMontaj.getState();
    st.anlikKaydet(proje.id);
    for (const c of parcalar) st.klipEkle(proje.id, kat, { ad: c.metin.slice(0, 30), tur: "metin", metin: c.metin, baslangic: c.b, sure: Math.max(0.5, c.s - c.b), metinStil: stil, metinBoyut: stil === "tiktok" ? 64 : 48, metinKonum: "alt", metinAnim: stil === "tiktok" ? "pop" : "fade", metinCikis: "yok", metinRenk: "#ffffff", kelimeler: c.kelimeler });
    toast.success(`${parcalar.length} altyazı eklendi`, { description: "Aşağıdaki listeden düzenleyebilirsin." });
  };

  /* Metinden: cümlelere böler, okuma hızına göre (karakter sayısıyla orantılı) montaj süresine yayar. */
  const metindenOlustur = () => {
    const temiz = metin.trim(); if (temiz.length < 3) return void toast.error("Altyazı metni boş", { description: "Altyazı oluşturmak için metni kutuya yapıştır." });
    const cumleler = temiz.replace(/\s+/g, " ").split(/(?<=[.!?…])\s+/).flatMap((c) => {
      const kel = c.split(" "); const l: string[] = [];
      for (let i = 0; i < kel.length; i += 7) l.push(kel.slice(i, i + 7).join(" "));
      return l;
    }).filter(Boolean);
    const bas = hedef ? hedef.baslangic : 0;
    const toplam = hedef ? klipSure(hedef) : Math.max(3, montajToplamSure(proje));
    const harf = cumleler.reduce((n, c) => n + c.length, 0);
    let t = bas;
    yerlestir(cumleler.map((c) => { const s = (c.length / harf) * toplam; const p = { metin: c, b: t, s: t + s }; t += s; return p; }));
  };

  const otomatik = async () => {
    if (!hedef) return void toast.error("Konuşma içeren klip yok", { description: "Otomatik altyazı için konuşma içeren bir video ya da ses klibi ekle." });
    if (!elevenBagli) return void toast.error("ElevenLabs bağlı değil", { description: "Otomatik altyazı için ElevenLabs bağlantısı gerekli. Metni yapıştırarak da altyazı oluşturabilirsin." });
    setMesgul(true);
    try {
      const url = hedef.tur === "ses" ? hedef.sesUrl! : videoKaynak(hedef)!;
      const blob = await (await fetch(url)).blob();
      if (blob.size > 45 * 1024 * 1024) throw new Error("Dosya 45 MB'tan büyük.");
      const dataUrl = await new Promise<string>((ok, red) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => red(new Error("Okunamadı")); r.readAsDataURL(blob); });
      const j = (await (await fetch("/api/uretim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tur: "ses", model: "Eleven Scribe", prompt: `Altyazı: ${hedef.ad}`, meta: { mod: "transkript", kaynakAd: hedef.ad }, girdi: { kaynak: dataUrl } }) })).json()) as { ok: boolean; gercek?: boolean; hata?: string; detay?: { kelimeler?: { k: string; b: number; s: number }[] } };
      if (!j.ok || !j.gercek) throw new Error(j.hata ?? "Yazıya dökülemedi");
      const hiz = Math.max(0.25, hedef.hiz);
      const kel = (j.detay?.kelimeler ?? []).filter((w) => !/^\(.*\)$/.test(w.k) && w.b >= hedef.basKirp && w.b <= hedef.sure - hedef.sonKirp)
        .map((w) => ({ k: w.k, b: hedef.baslangic + (w.b - hedef.basKirp) / hiz, s: hedef.baslangic + (w.s - hedef.basKirp) / hiz }));
      if (!kel.length) throw new Error("Klipte konuşma bulunamadı");
      const parcalar: { metin: string; b: number; s: number; kelimeler: { k: string; b: number; s: number }[] }[] = [];
      let p: { k: typeof kel } | null = null;
      for (const w of kel) {
        if (!p) p = { k: [] };
        p.k.push(w);
        if (p.k.length >= 6 || w.s - p.k[0].b > 2.8 || /[.!?]$/.test(w.k)) { const b = p.k[0].b; parcalar.push({ metin: p.k.map((x) => x.k).join(" "), b, s: w.s + 0.1, kelimeler: p.k.map((x) => ({ k: x.k, b: x.b - b, s: x.s - b })) }); p = null; }
      }
      if (p) { const b = p.k[0].b; parcalar.push({ metin: p.k.map((x) => x.k).join(" "), b, s: p.k[p.k.length - 1].s + 0.1, kelimeler: p.k.map((x) => ({ k: x.k, b: x.b - b, s: x.s - b })) }); }
      yerlestir(parcalar);
    } catch (e) { toast.error("Altyazı oluşturulamadı", { description: `${e instanceof Error ? e.message : "Beklenmeyen bir sorun çıktı."} Yeniden dene.` }); }
    finally { setMesgul(false); }
  };

  const hepsineStil = (s: MetinStil) => {
    setStil(s);
    if (!satirlar.length) return;
    const st = useMontaj.getState(); st.anlikKaydet(proje.id);
    for (const c of satirlar) st.klipGuncelle(proje.id, c.id, { metinStil: s, metinBoyut: s === "tiktok" ? 64 : 48 });
    toast.success("Altyazı stili uygulandı");
  };

  return (
    <>
      <PanelBaslik baslik="Altyazı" alt="Metinden zamanlamalı altyazı katmanı" />
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4 [scrollbar-width:thin]">
        <PKart baslik="Stil" alt={satirlar.length ? "Seçince tüm altyazılara uygulanır" : "Yeni altyazılar bu stille eklenir"} ikon={Captions}>
          <div className="grid grid-cols-2 gap-1.5">
            {ALTYAZI_STILLERI.map(([s, a, alt]) => (
              <button key={s} onClick={() => hepsineStil(s)} aria-pressed={stil === s} title={alt} className="relative overflow-hidden rounded-[12px] text-left ring-1 ring-inset ring-white/[0.08] transition-[box-shadow,transform] hover:ring-white/30 active:scale-[0.98]">
                <span className="flex h-12 items-center justify-center bg-[url(/gercek/video-hareket/focus-pull-poster.webp)] bg-cover bg-center shadow-[inset_0_0_0_999px_rgba(0,0,0,0.45)] px-2 text-[12px]">
                  {s === "altyazi" && <span className="rounded bg-black/70 px-1.5 py-0.5 font-bold text-white">Merhaba dünya</span>}
                  {s === "karaoke" && <span className="font-extrabold text-white [text-shadow:0_0_2px_#000,0_0_2px_#000]">Merhaba <span className="text-[#55d6fd]">dünya</span></span>}
                  {s === "tiktok" && <span className="font-black uppercase tracking-tight text-white [paint-order:stroke_fill] [-webkit-text-stroke:3px_#000]">MERHABA DÜNYA</span>}
                  {s === "neon" && <span className="font-bold text-white [text-shadow:0_0_8px_#22d3ee,0_0_14px_#22d3ee]">Merhaba dünya</span>}
                </span>
                <span className={cn("block px-2 py-1.5 text-[12px] font-semibold", stil === s ? "text-white" : "text-metin-2")}>{a}</span>
                {stil === s && <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[12px] ring-2 ring-inset ring-white" />}
              </button>
            ))}
          </div>
        </PKart>
        <button onClick={() => void otomatik()} disabled={mesgul} className="flex w-full items-start gap-3 rounded-[16px] bg-white/[0.045] p-3 text-left ring-1 ring-inset ring-white/[0.07] transition-[background-color,transform] hover:bg-white/[0.06] active:scale-[0.99] disabled:opacity-60">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.085] text-white">{mesgul ? <Loader2 className="h-4 w-4 animate-spin" /> : <Captions className="h-4 w-4" />}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold text-metin">Konuşmadan otomatik</span>
            <span className="block text-[11.5px] leading-snug text-metin-3">{hedef ? `"${hedef.ad}" klibindeki konuşma sözcük zamanlamasıyla yazıya dökülür.` : "Önce konuşmalı bir klip ekle."}</span>
          </span>
        </button>
        <PKart baslik="Metinden oluştur" alt="Okuma hızına göre süreye yayılır" ikon={TypeIcon} govde="space-y-2 p-2.5">
          <textarea value={metin} onChange={(e) => setMetin(e.target.value.slice(0, 5000))} rows={4} placeholder="Senaryoyu ya da konuşma metnini yapıştır"
            className="block w-full resize-none rounded-[12px] bg-white/[0.055] p-2.5 text-[13px] leading-relaxed text-metin outline-none ring-1 ring-inset ring-white/[0.06] placeholder:text-white/40 focus:ring-white/25" />
          <button onClick={metindenOlustur} disabled={metin.trim().length < 3} className="flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-white text-[12.5px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.98] disabled:bg-white/[0.07] disabled:text-white/40"><Wand2 className="h-3.5 w-3.5" /><span className="truncate">{hedef ? `${hedef.ad.slice(0, 18)} süresine yay` : "Montaj süresine yay"}</span></button>
        </PKart>
        {satirlar.length > 0 && (
          <PKart baslik="Altyazılar" ikon={Captions} govde="space-y-2 p-2.5"
            sag={<><SayiHap n={satirlar.length} /><button onClick={() => { const st = useMontaj.getState(); st.anlikKaydet(proje.id); for (const c of satirlar) st.klipSil(proje.id, c.id); toast("Altyazılar silindi", { description: "Ctrl+Z ile geri alabilirsin." }); }} aria-label="Tüm altyazıları sil" title="Tümünü sil" className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 transition hover:bg-white/[0.07] hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button></>}>
            <div className="grid grid-cols-2 gap-1.5">
              {(["srt", "vtt"] as const).map((b) => (
                <button key={b} onClick={() => { const blob = new Blob([altyaziMetni(satirlar, b)], { type: b === "srt" ? "application/x-subrip" : "text/vtt" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${(proje.ad || "montaj").replace(/[\/:*?"<>|]+/g, "-")}.${b}`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast.success(`${b.toUpperCase()} indirildi`, { description: "YouTube, Vimeo ve oynatıcılara yüklenebilir." }); }}
                  className="flex h-8 items-center justify-center gap-1.5 rounded-full bg-white/[0.085] text-[12px] font-medium text-white transition hover:bg-white/[0.12] active:scale-[0.97]"><Download className="h-3.5 w-3.5" /> {b.toUpperCase()} indir</button>
              ))}
            </div>
            <p className="flex items-start gap-1.5 text-[11.5px] leading-snug text-metin-3"><Scissors className="mt-0.5 h-3 w-3 shrink-0" />Satırın makasına basınca o konuşma tüm katmanlardan kesilir, sonrası kayar.</p>
            <div className="space-y-1.5">
              {satirlar.map((c) => (
                <div key={c.id} className={cn("group rounded-[12px] p-2 ring-1 ring-inset transition-colors", seciliId === c.id ? "bg-white/[0.085] ring-white/30" : "bg-white/[0.025] ring-white/[0.06]")}>
                  <div className="mb-1 flex items-center">
                    <button onClick={() => { useMontaj.getState().klipSec(c.id); useMontaj.getState().oynatDurdur(false); useMontaj.getState().playheadAyarla(c.baslangic + 0.01); }} className="rounded-full bg-white/[0.085] px-2 py-0.5 text-[11px] tabular-nums text-white/80 transition hover:bg-white/[0.13] hover:text-white">{zamanKodu(c.baslangic, proje.fps)} · {kisaSure(klipSure(c))}</button>
                    <button onClick={() => { araligiKes(proje.id, c.baslangic, c.baslangic + klipSure(c)); toast.success("Bölüm kesildi", { description: `"${(c.metin ?? "").slice(0, 28)}" tüm katmanlardan çıkarıldı. Ctrl+Z ile geri alabilirsin.` }); }}
                      title="Bu konuşmayı videodan kes" aria-label="Bu bölümü kes" className="ml-auto flex h-6 w-6 items-center justify-center rounded-md text-metin-3 opacity-0 transition-opacity hover:bg-rose-500/15 hover:text-rose-300 focus:opacity-100 group-hover:opacity-100"><Scissors className="h-3.5 w-3.5" /></button>
                  </div>
                  <textarea value={c.metin ?? ""} rows={1} onChange={(e) => useMontaj.getState().klipGuncelle(proje.id, c.id, { metin: e.target.value, ad: e.target.value.slice(0, 30), kelimeler: undefined })}
                    className="block w-full resize-none bg-transparent text-[12.5px] leading-snug text-metin outline-none [field-sizing:content]" />
                </div>
              ))}
            </div>
          </PKart>
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════ ŞABLONLAR ═══════════════════════════ */

/** Örnek klip dosyalarının Türkçe adları. */
export const KLIP_AD: Record<string, string> = {
  "skate-cruise": "Kaykay", "snowboard-carve": "Snowboard", "fpv-dive": "FPV dalış", "whip-pan": "Hızlı pan", "crash-zoom": "Ani zoom", "viral-spin": "Dönüş",
  "orbit-left": "Sola yörünge", "orbit-right": "Sağa yörünge", "dolly-in": "Dolly ileri", "push-to-glass": "Cama doğru", "drone-orbit": "Drone yörünge", "jib-up": "Vinç yukarı",
  "tilt-up": "Yukarı tilt", "zoom-out": "Geniş açı", "dolly-out": "Dolly geri", "dutch-angle": "Eğik açı", "slow-motion": "Ağır çekim", "bullet-time": "Zaman dondurma",
  "emotion-zoom": "Duygu yakını", "focus-pull": "Odak kayması", "handheld": "El kamerası", "camera-orbit": "Kamera yörüngesi", "low-shutter": "Düşük enstantane",
};
export const klipAdi = (d: string) => KLIP_AD[d] ?? d.replace(/-/g, " ");
/** Şablon açıklaması: oran zaten rozette yazdığı için baştaki "16:9 · " atılır. */
export const sablonAlt = (s: { alt: string; oran: string }) => (s.alt.startsWith(`${s.oran} · `) ? s.alt.slice(s.oran.length + 3) : s.alt);

export type Sablon = {
  id: string; ad: string; alt: string; oran: MontajOran; kapak: string; klipler: string[]; sure: number;
  gecis: MontajGecis; efekt?: MontajEfekt[]; baslik?: { metin: string; stil: MetinStil; boyut: number }; altbant?: boolean; ilerleme?: boolean; kose?: string; altyazi?: string[]; sigdir?: MontajKlip["sigdir"];
};
export const SABLONLAR: Sablon[] = [
  { id: "reel", ad: "Hızlı Reel", alt: "9:16 · 6 kesim · TikTok yazı", oran: "9:16", kapak: "skate-cruise", klipler: ["skate-cruise", "snowboard-carve", "fpv-dive", "whip-pan", "crash-zoom", "viral-spin"], sure: 1.6, gecis: "yakinlas", efekt: ["grade-sinematik"], baslik: { metin: "Hafta sonu modu", stil: "tiktok", boyut: 80 }, ilerleme: true },
  { id: "urun", ad: "Ürün tanıtımı", alt: "1:1 · etiket · alt yazı", oran: "1:1", kapak: "orbit-left", klipler: ["orbit-left", "orbit-right", "dolly-in", "push-to-glass"], sure: 3, gecis: "fade", efekt: ["keskinlik"], baslik: { metin: "Yeni sezon", stil: "baslik", boyut: 96 }, kose: "%30 indirim" },
  { id: "seyahat", ad: "Seyahat vlogu", alt: "16:9 · sıcak ton · yumuşak geçiş", oran: "16:9", kapak: "drone-orbit", klipler: ["drone-orbit", "jib-up", "tilt-up", "zoom-out", "dolly-out"], sure: 3, gecis: "fade", efekt: ["grade-sicak"], baslik: { metin: "Alplerde 5 gün", stil: "sinematik", boyut: 64 } },
  { id: "fragman", ad: "Sinematik fragman", alt: "16:9 · gren · vinyet · flaş geçiş", oran: "16:9", kapak: "dutch-angle", klipler: ["dutch-angle", "slow-motion", "bullet-time", "emotion-zoom"], sure: 2.4, gecis: "beyazparla", efekt: ["grade-sinematik", "vinyet", "grenli"], baslik: { metin: "Yakında", stil: "sinematik", boyut: 72 } },
  { id: "roportaj", ad: "Röportaj", alt: "16:9 · alt bant · karaoke altyazı", oran: "16:9", kapak: "focus-pull", klipler: ["focus-pull", "handheld"], sure: 5, gecis: "kesme", altbant: true, altyazi: ["Bu proje bizim için", "bir dönüm noktası oldu."] },
  { id: "duyuru", ad: "Sosyal duyuru", alt: "4:5 · neon yazı · bulanık dolgu", oran: "4:5", kapak: "push-to-glass", klipler: ["push-to-glass", "camera-orbit", "low-shutter"], sure: 2.5, gecis: "kaydir", baslik: { metin: "Bu cuma canlı yayında", stil: "neon", boyut: 70 }, sigdir: "bulanik", ilerleme: true },
];

/** Şablonu yeni bir montaj olarak kurar (klipler, yazılar, öğeler ve tarayıcıda sentezlenen altyapı müziği). */
export async function sablonKur(s: Sablon) {
  const st = useMontaj.getState();
  const id = st.projeOlustur({ ad: s.ad, enBoy: s.oran });
  let t = 0;
  for (const [i, d] of s.klipler.entries()) {
    const url = `/gercek/video-hareket/${d}.mp4`;
    const kaynak = (await medyaSuresi(url, "video")) ?? s.sure;
    const kid = medyayiEkle(id, { id: d, ad: klipAdi(d), tur: "video", url, poster: `/gercek/video-hareket/${d}-poster.webp`, sure: kaynak }, t);
    if (kid) useMontaj.getState().klipGuncelle(id, kid, { sonKirp: Math.max(0, kaynak - s.sure), efektler: s.efekt ?? [], gecis: i ? s.gecis : "fade", gecisSure: s.gecis === "beyazparla" ? 0.35 : 0.45, sigdir: s.sigdir });
    t += Math.min(kaynak, s.sure);
  }
  {
    const ek = (k: Partial<MontajKlip> & { ad: string; tur: MontajKlip["tur"] }) => {
      const kat = katmanBul(id, "metin", [k.baslangic ?? 0, (k.baslangic ?? 0) + (k.sure ?? 3)]);
      if (kat) useMontaj.getState().klipEkle(id, kat, k);
    };
    if (s.baslik) ek({ ad: s.baslik.metin, tur: "metin", metin: s.baslik.metin, baslangic: 0.2, sure: Math.min(3, t - 0.2), metinStil: s.baslik.stil, metinBoyut: s.baslik.boyut, metinKonum: s.oran === "9:16" ? "ust" : "orta", metinAnim: "pop", metinCikis: "fade" });
    if (s.ilerleme) ek({ ad: "İlerleme", tur: "metin", oge: { tip: "ilerleme", renk: "#22d3ee" }, baslangic: 0, sure: t });
    if (s.kose) ek({ ad: "Köşe etiketi", tur: "metin", oge: { tip: "sekil", sekil: "kose", renk: "#facc15", renk2: "#1c1400", baslik: s.kose }, baslangic: 0.5, sure: t - 0.5 });
    if (s.altbant) ek({ ad: "Alt bant", tur: "metin", oge: { tip: "altbant", renk: "#22d3ee", baslik: "Deniz Yılmaz", alt: "Kurucu · Vayra" }, baslangic: 0.6, sure: 4 });
    if (s.altyazi) { const ad = t / s.altyazi.length; s.altyazi.forEach((m, i) => ek({ ad: m, tur: "metin", metin: m, baslangic: i * ad, sure: ad, metinStil: "karaoke", metinBoyut: 50, metinKonum: "alt", metinAnim: "fade", metinCikis: "yok" })); }
  }
  // Örnek müzik: tarayıcıda sentezlenen kısa altyapı
  try {
    const wav = await besteWavUrl({ tohum: s.id, bpm: s.id === "reel" ? 124 : s.id === "fragman" ? 84 : 100, key: "A", minor: s.id === "fragman", sure: Math.ceil(t), yogunluk: s.id === "reel" ? 0.85 : 0.5, parlaklik: 0.6, enstrumantal: true });
    const url = await dosyaYukle(await (await fetch(wav)).blob(), "audio/wav");
    const kat = katmanBul(id, "ses");
    if (kat) { useMontaj.getState().katmanGuncelle(id, kat, { rol: "muzik" }); useMontaj.getState().klipEkle(id, kat, { ad: "Altyapı müziği", tur: "ses", sesUrl: url, sure: Math.ceil(t), baslangic: 0, sesDuzey: 60, sesCikis: 1.2 }); }
  } catch { /* müziksiz devam */ }
  useMontaj.getState().playheadAyarla(Math.min(1.2, t / 2)); // ilk kare geçişin karanlık başlangıcı olmasın
  toast.success(`${s.ad} şablonu hazır`, { description: "Klipleri kendi medyanla değiştirmek için medyayı klibin üstüne sürükle." });
}

export function SablonPanel({ proje }: { proje: MontajProje }) {
  void proje;
  const [kuruluyor, setKuruluyor] = useState<string | null>(null);
  const kur = async (s: Sablon) => { setKuruluyor(s.id); try { await sablonKur(s); } finally { setKuruluyor(null); } };
  return (
    <>
      <PanelBaslik baslik="Şablonlar" alt="Yeni montaj olarak açılır" />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 [scrollbar-width:thin]">
        <div className="grid grid-cols-2 gap-2.5">
          {SABLONLAR.map((s) => (
            <button key={s.id} onClick={() => void kur(s)} disabled={!!kuruluyor} className="group overflow-hidden rounded-[14px] text-left ring-1 ring-inset ring-white/[0.08] transition-[box-shadow,transform] hover:ring-white/40 active:scale-[0.98] disabled:opacity-60">
              <span className="relative block aspect-[4/5] overflow-hidden bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/gercek/video-hareket/${s.kapak}-poster.webp`} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                <span className="absolute left-1.5 top-1.5 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">{s.oran}</span>
                <span className="absolute right-1.5 top-1.5 rounded-full bg-black/50 px-2 py-0.5 text-[11px] tabular-nums text-white backdrop-blur">{kisaSure(s.klipler.length * s.sure)}</span>
                {kuruluyor === s.id && <span className="absolute inset-0 flex items-center justify-center bg-black/60"><Loader2 className="h-6 w-6 animate-spin text-white" /></span>}
                <span className="absolute inset-x-2 bottom-2"><span className="block text-[13.5px] font-semibold text-white">{s.ad}</span><span className="line-clamp-2 block text-[11px] leading-tight text-white/70">{sablonAlt(s)}</span></span>
              </span>
            </button>
          ))}
        </div>

      </div>
    </>
  );
}

