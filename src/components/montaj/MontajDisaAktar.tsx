"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, X, Loader2, Check, AlertTriangle, Library, RefreshCw, Film, Info, Music2, ImageIcon, Scissors, Flag, Smartphone, MonitorPlay, Square, RectangleVertical, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useEscKapat, useScrollKilit } from "@/hooks/useScrollKilit";
import { useOdakTuzagi } from "@/hooks/useOdakTuzagi";
import { Segment } from "./ui";
import { useProjeler } from "@/store/useProjeler";
import { useMontaj, montajToplamSure, klipSure, type MontajProje, type MontajOran } from "@/store/useMontaj";
import { disaAktar, kareAl, gifAl, kayitBicimi, sesKayitBicimi, OLCU, type DisaAktarDurum } from "@/lib/montajMotor";
import { dosyaYukle, kisaSure, zamanKodu } from "./ortak";
import { fontlariYukle } from "./fontlar";

type Kalite = "standart" | "yuksek" | "enIyi";
type Tur = "video" | "ses" | "kare" | "gif";
type GifBoy = 320 | 480 | 720;
type Aralik = "tum" | "secili" | "isaret";
/** Platform hazır ayarları: biçim + çözünürlük + kare hızı tek dokunuşta. */
const PLATFORMLAR: { id: string; ad: string; alt: string; ikon: typeof Film; oran: MontajOran; coz: MontajProje["cozunurluk"]; fps: MontajProje["fps"] }[] = [
  { id: "tiktok", ad: "TikTok · Reels", alt: "9:16 · 1080p · 30", ikon: Smartphone, oran: "9:16", coz: "1080p", fps: 30 },
  { id: "youtube", ad: "YouTube", alt: "16:9 · 1080p · 30", ikon: MonitorPlay, oran: "16:9", coz: "1080p", fps: 30 },
  { id: "kare", ad: "Instagram gönderi", alt: "1:1 · 1080p · 30", ikon: Square, oran: "1:1", coz: "1080p", fps: 30 },
  { id: "dikey", ad: "Instagram dikey", alt: "4:5 · 1080p · 30", ikon: RectangleVertical, oran: "4:5", coz: "1080p", fps: 30 },
];
const BIT: Record<string, Record<Kalite, number>> = {
  "720p": { standart: 4e6, yuksek: 7e6, enIyi: 10e6 },
  "1080p": { standart: 8e6, yuksek: 14e6, enIyi: 22e6 },
  "4K": { standart: 25e6, yuksek: 40e6, enIyi: 60e6 },
};

/**
 * Gerçek dışa aktarma: zaman çizelgesi tarayıcıda kare kare çizilir ve kaydedilir (montaj süresi kadar sürer).
 * Kredi harcamaz; sonuç indirilebilir ya da Kitaplığa kaydedilir.
 */
/** Başlık şeritli ayar kartı: başlık solda, kısa açıklama sağda (havada etiket yok). */
const Alan = ({ ad, alt, children }: { ad: string; alt?: string; children: React.ReactNode }) => (
  <section className="overflow-hidden rounded-[16px] bg-white/[0.045] ring-1 ring-inset ring-white/[0.07]">
    <div className="flex min-h-[40px] items-center gap-2 border-b border-white/[0.06] px-3 py-2"><span className="shrink-0 text-[13px] font-semibold text-white">{ad}</span>{alt && <span className="ml-auto truncate text-[11.5px] text-white/50">{alt}</span>}</div>
    <div className="p-2.5">{children}</div>
  </section>
);

export function MontajDisaAktar({ proje, onKapat, onOran }: { proje: MontajProje; onKapat: () => void; /** Proje montaj deposunda değilse (ör. explainer) format değişikliğini sahibine bildirir. */ onOran?: (o: MontajOran) => void }) {
  const [ad, setAd] = useState(proje.ad || "Montaj");
  const [coz, setCoz] = useState<MontajProje["cozunurluk"]>(proje.cozunurluk);
  const [fps, setFps] = useState<MontajProje["fps"]>(proje.fps);
  const [kalite, setKalite] = useState<Kalite>("yuksek");
  const [tur, setTur] = useState<Tur>("video");
  const [gifBoy, setGifBoy] = useState<GifBoy>(480);
  const [gifFps, setGifFps] = useState<10 | 15 | 24>(15);
  const seciliId = useMontaj((s) => s.seciliKlipId);
  const playhead = useMontaj((s) => s.playhead);
  const secK = seciliId ? proje.katmanlar.flatMap((k) => k.klipler).find((k) => k.id === seciliId) : undefined;
  const isaretler = [...(proje.isaretler ?? [])].sort((a, b) => a.t - b.t);
  const [aralik, setAralik] = useState<Aralik>("tum");
  const [durum, setDurum] = useState<DisaAktarDurum | null>(null);
  const [sonuc, setSonuc] = useState<{ url: string; blob: Blob; uzanti: string; kapak: string } | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [kaydedildi, setKaydedildi] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const iptal = useRef<AbortController | null>(null);
  const kutu = useOdakTuzagi<HTMLDivElement>(true);
  const calisiyor = !!durum && durum.asama !== "bitti" && !sonuc;
  useScrollKilit(true);
  useEscKapat(!calisiyor, onKapat);
  const bicim = useMemo(() => (typeof window !== "undefined" ? kayitBicimi() : null), []);
  const tumSure = montajToplamSure(proje);
  const [bas, son] = aralik === "secili" && secK ? [secK.baslangic, secK.baslangic + klipSure(secK)]
    : aralik === "isaret" && isaretler.length >= 2 ? [isaretler[0].t, isaretler[isaretler.length - 1].t] : [0, tumSure];
  const toplam = Math.max(0, Math.min(tumSure, son) - bas);
  const [W, H] = OLCU[coz][proje.enBoy];
  const sesBicim = useMemo(() => (typeof window !== "undefined" ? sesKayitBicimi() : null), []);
  const tahminiMb = tur === "ses" ? (256_000 * toplam) / 8 / 1024 / 1024 : ((BIT[coz][kalite] + 192_000) * toplam) / 8 / 1024 / 1024;
  const platform = PLATFORMLAR.find((x) => x.oran === proje.enBoy && x.coz === coz && x.fps === fps)?.id;
  const uzanti = tur === "kare" ? "png" : tur === "gif" ? "gif" : tur === "ses" ? sesBicim?.uzanti ?? "m4a" : bicim?.uzanti ?? "mp4";
  // GIF ölçüsü: kısa kenar değil genişlik esas (dikeyde yükseklik)
  const [gW, gH] = W >= H ? [gifBoy, Math.round((gifBoy * H) / W / 2) * 2] : [Math.round((gifBoy * W) / H / 2) * 2, gifBoy];
  const gifSure = Math.min(20, toplam);
  const gifMb = (gW * gH * gifSure * gifFps * 0.32) / 1024 / 1024;
  useEffect(() => () => { iptal.current?.abort(); if (sonuc) URL.revokeObjectURL(sonuc.url); }, [sonuc]);

  const basla = async () => {
    setHata(null); setSonuc(null); setKaydedildi(false);
    iptal.current = new AbortController();
    try {
      await fontlariYukle();
      if (tur === "kare") {
        setDurum({ asama: "hazirlaniyor", ilerleme: 0.5 });
        const b = await kareAl(proje, playhead, W, H);
        const url = URL.createObjectURL(b);
        setSonuc({ url, blob: b, uzanti: "png", kapak: url });
        setDurum({ asama: "bitti", ilerleme: 1 });
        return;
      }
      if (tur === "gif") {
        const b = await gifAl(proje, { W: gW, H: gH, fps: gifFps, bas, son }, setDurum, iptal.current.signal);
        const url = URL.createObjectURL(b);
        setSonuc({ url, blob: b, uzanti: "gif", kapak: url });
        return;
      }
      const r = await disaAktar(proje, { W, H, fps, bitHizi: BIT[coz][kalite], bas, son, sadeceSes: tur === "ses" }, setDurum, iptal.current.signal);
      setSonuc({ url: URL.createObjectURL(r.blob), blob: r.blob, uzanti: r.uzanti, kapak: r.kapak });
    } catch (e) {
      setDurum(null);
      if ((e as DOMException)?.name === "AbortError") return void toast("Dışa aktarma iptal edildi", { description: "Ayarları değiştirip yeniden başlatabilirsin." });
      setHata(e instanceof Error ? e.message : "Dışa aktarılamadı");
    }
  };
  const dosyaAdi = `${(ad.trim() || "montaj").replace(/[\\/:*?"<>|]+/g, "-")}.${sonuc?.uzanti ?? "mp4"}`;
  const indir = () => { if (!sonuc) return; const a = document.createElement("a"); a.href = sonuc.url; a.download = dosyaAdi; a.click(); toast.success("Montaj indirildi", { description: `${dosyaAdi} indirilenler klasörüne kaydedildi.` }); };
  const kaydet = async () => {
    if (!sonuc) return;
    setKaydediliyor(true);
    try {
      const [videoUrl, kapak] = await Promise.all([dosyaYukle(sonuc.blob, sonuc.blob.type), dosyaYukle(await (await fetch(sonuc.kapak)).blob(), "image/jpeg")]);
      useProjeler.getState().ekle({
        baslik: ad.trim() || "Montaj", tur: "video", model: "Montaj Stüdyosu", prompt: `${proje.katmanlar.reduce((a, k) => a + k.klipler.length, 0)} klipten montaj`,
        durum: "tamam", ilerleme: 100, kredi: 0, arac: "Montaj Stüdyosu", videoUrl, gorselUrl: kapak, gercek: true, saglayici: "tarayici",
        meta: { oran: proje.enBoy, cozunurluk: coz, sure: `${Math.round(toplam)}sn`, sureSn: toplam, boyutKb: Math.round(sonuc.blob.size / 1024) },
      });
      setKaydedildi(true);
      toast.success("Kitaplığa kaydedildi", { description: "Video stüdyosunda ve Kitaplık'ta görünür." });
    } catch (e) {
      toast.error("Kitaplığa kaydedilemedi", { description: `${e instanceof Error ? e.message : "Dosya yüklenemedi."} Videoyu indirip yeniden dene.` });
    } finally { setKaydediliyor(false); }
  };
  const yuzde = Math.round((durum?.ilerleme ?? 0) * 100);

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/55" onClick={() => !calisiyor && onKapat()} />
      <motion.div ref={kutu} role="dialog" aria-modal="true" aria-label="Dışa aktar" initial={{ opacity: 0, x: 48 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 48 }} transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="fixed bottom-3 right-3 top-3 z-[201] flex w-[min(calc(100vw-24px),520px)] flex-col overflow-hidden rounded-[22px] border border-white/[0.09] bg-[#1b1c1f]">
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
          <span className="min-w-0 flex-1"><span className="block text-[17px] font-semibold text-metin">Dışa aktar</span><span className="mt-0.5 block text-[13px] text-metin-2">Tarayıcında oluşturulur · kredi harcamaz</span></span>
          <button onClick={onKapat} disabled={calisiyor} aria-label="Kapat" className="flex h-9 w-9 items-center justify-center rounded-full text-metin-2 hover:bg-white/[0.07] hover:text-metin disabled:opacity-40"><X className="h-4 w-4" /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 [scrollbar-width:thin]">
          {sonuc ? (
            <>
              <div className="overflow-hidden rounded-[16px] bg-black ring-1 ring-white/10">
                {sonuc.uzanti === "png" || sonuc.uzanti === "gif" ? <img src={sonuc.url} alt="Dışa aktarılan kare" className="max-h-[42vh] w-full object-contain" />
                  : tur === "ses" ? <div className="flex flex-col items-center gap-3 bg-[#111316] p-6"><span className="bg-white/[0.075] text-metin-2 flex h-14 w-14 items-center justify-center rounded-2xl"><Music2 className="h-6 w-6" /></span><audio src={sonuc.url} controls className="w-full" /></div>
                  : <video src={sonuc.url} controls playsInline className="max-h-[42vh] w-full" />}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {([["Biçim", sonuc.uzanti.toUpperCase()], ["Boyut", `${(sonuc.blob.size / 1024 / 1024).toFixed(1)} MB`], [tur === "ses" ? "Süre" : "Çözünürlük", tur === "ses" ? kisaSure(toplam) : tur === "gif" ? `${gW}×${gH}` : `${W}×${H}`]] as const).map(([a, v]) => (
                  <div key={a} className="rounded-[14px] bg-white/[0.045] px-2.5 py-2 ring-1 ring-inset ring-white/[0.07]"><span className="block text-[12px] font-medium text-metin-3">{a}</span><span className="mt-0.5 block text-[13px] font-semibold tabular-nums text-metin">{v}</span></div>
                ))}
              </div>
            </>
          ) : calisiyor ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="relative h-28 w-28">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90"><circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" /><circle cx="50" cy="50" r="44" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${276.5 * (durum?.ilerleme ?? 0)} 276.5`} /></svg>
                <span className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-[22px] font-bold tabular-nums text-metin">yüzde {yuzde}</span><span className="text-[10.5px] text-metin-3">{durum?.asama === "hazirlaniyor" ? "hazırlanıyor" : "kaydediliyor"}</span></span>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-metin">{durum?.asama === "hazirlaniyor" ? "Medya yükleniyor…" : tur === "gif" ? "GIF kareleri çiziliyor" : "Montaj kaydediliyor"}</p>
                <p className="mt-1 text-[12px] tabular-nums text-metin-3">{kisaSure((durum?.ilerleme ?? 0) * toplam)} / {kisaSure(toplam)} · {W}×{H} · {fps} fps</p>
              </div>
              {tur !== "gif" && <p className="flex items-start gap-1.5 rounded-xl bg-amber-300/[0.07] px-3 py-2 text-left text-[11.5px] leading-snug text-amber-100/90 ring-1 ring-inset ring-amber-300/20"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />Kayıt gerçek zamanlıdır. Bu sekmeyi açık ve önde tut; arka plana alınırsa tarayıcı kareleri yavaşlatır.</p>}
            </div>
          ) : (
            <>
              <Alan ad="Dosya adı">
                <label className="flex items-center rounded-[12px] bg-white/[0.065] px-3 ring-1 ring-inset ring-white/[0.06] focus-within:ring-white/25">
                  <input value={ad} onChange={(e) => setAd(e.target.value.slice(0, 80))} aria-label="Dosya adı" className="h-10 min-w-0 flex-1 bg-transparent text-[14px] text-metin outline-none" />
                  <span className="text-[12.5px] text-metin-3">.{uzanti}</span>
                </label>
              </Alan>
              <Alan ad="Ne dışa aktarılsın" alt={tur === "video" ? "MP4 · ses dahil" : tur === "gif" ? "Sessiz döngü · en çok 20 sn" : tur === "ses" ? "Tüm katmanların ses karışımı" : `Oynatma çizgisindeki kare (${kisaSure(playhead)}) · PNG`}>
                <Segment etiket="Ne dışa aktarılsın" deger={tur} onDegis={setTur} secenekler={[["video", "Video", Film], ["gif", "GIF", Repeat], ["ses", "Ses", Music2], ["kare", "Kare", ImageIcon]]} />
              </Alan>
              {tur !== "ses" && (
                <Alan ad="Platform" alt="Format, çözünürlük ve kare hızı birlikte ayarlanır">
                  <div className="grid grid-cols-2 gap-1.5">
                    {PLATFORMLAR.map((x) => (
                      <button key={x.id} onClick={() => { if (proje.enBoy !== x.oran) (onOran ? onOran(x.oran) : useMontaj.getState().projeGuncelle(proje.id, { enBoy: x.oran })); setCoz(x.coz); setFps(x.fps); }} aria-pressed={platform === x.id}
                        className={cn("flex items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-left outline outline-2 -outline-offset-2 transition-[outline-color,background-color] active:scale-[0.98]", platform === x.id ? "bg-white/[0.08] outline-white" : "bg-white/[0.045] outline-transparent hover:bg-white/[0.06]")}>
                        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]", platform === x.id ? "bg-white text-black" : "bg-white/[0.085] text-white/75")}><x.ikon className="h-4 w-4" /></span>
                        <span className="min-w-0"><span className="block truncate text-[12.5px] font-semibold text-metin">{x.ad}</span><span className="block text-[11px] tabular-nums text-metin-3">{x.alt}</span></span>
                      </button>
                    ))}
                  </div>
                </Alan>
              )}
              {tur !== "kare" && (
                <Alan ad="Aralık" alt={aralik === "tum" ? `Montajın tamamı · ${kisaSure(tumSure)}` : aralik === "secili" ? `Seçili klip · ${kisaSure(toplam)}` : `İlk ve son işaretçi arası · ${kisaSure(toplam)}`}>
                  <Segment etiket="Aralık" deger={aralik} onDegis={setAralik} secenekler={[["tum", "Tümü", Film], ["secili", "Seçili klip", Scissors], ["isaret", "İşaretler arası", Flag]]}
                    kapali={[...(secK ? [] : ["secili" as const]), ...(isaretler.length >= 2 ? [] : ["isaret" as const])]} />
                </Alan>
              )}
              {tur === "gif" && <>
                <Alan ad="GIF boyutu"><Segment etiket="GIF boyutu" deger={gifBoy} onDegis={setGifBoy} secenekler={[[320, "320 px"], [480, "480 px"], [720, "720 px"]]} /></Alan>
                <Alan ad="Kare hızı"><Segment etiket="Kare hızı" deger={gifFps} onDegis={setGifFps} secenekler={[[10, "10 fps"], [15, "15 fps"], [24, "24 fps"]]} /></Alan>
              </>}
              {tur !== "ses" && tur !== "gif" && <Alan ad="Çözünürlük" alt={coz === "4K" ? "4K kayıt yavaş cihazlarda zorlayabilir." : undefined}><Segment etiket="Çözünürlük" deger={coz} onDegis={setCoz} secenekler={[["720p", "720p"], ["1080p", "1080p"], ["4K", "4K"]]} /></Alan>}
              {tur === "video" && <><Alan ad="Kare hızı"><Segment etiket="Kare hızı" deger={fps} onDegis={setFps} secenekler={[[24, "24 fps"], [30, "30 fps"], [60, "60 fps"]]} /></Alan>
              <Alan ad="Kalite" alt={kalite === "yuksek" ? "Önerilen, dengeli boyut" : kalite === "standart" ? "Daha küçük dosya" : "Büyük dosya"}><Segment etiket="Kalite" deger={kalite} onDegis={setKalite} secenekler={[["standart", "Standart"], ["yuksek", "Yüksek"], ["enIyi", "En iyi"]]} /></Alan></>}
              <div className="overflow-hidden rounded-[16px] bg-white/[0.045] ring-1 ring-inset ring-white/[0.07]"><div className="grid grid-cols-3 divide-x divide-white/[0.06] py-3 text-center">
                {([[tur === "kare" ? "An" : "Süre", tur === "kare" ? zamanKodu(playhead, proje.fps) : kisaSure(tur === "gif" ? gifSure : toplam)], [tur === "kare" ? "Boyut" : "Tahmini boyut", tur === "kare" ? `${W}×${H}` : tur === "gif" ? `yaklaşık ${gifMb < 1 ? gifMb.toFixed(1) : Math.round(gifMb)} MB` : `yaklaşık ${tahminiMb < 1 ? tahminiMb.toFixed(1) : Math.round(tahminiMb)} MB`], ["Biçim", uzanti.toUpperCase()]] as const).map(([a, v]) => (
                  <span key={a}><span className="block text-[12px] font-medium text-metin-3">{a}</span><span className="block text-[13.5px] font-semibold tabular-nums text-metin">{v}</span></span>
                ))}
              </div>
              {(tur === "video" || tur === "ses") && <p className="border-t border-white/[0.06] px-3 py-2 text-center text-[11.5px] text-metin-3">Kayıt gerçek zamanlı sürer, yaklaşık {kisaSure(toplam)}</p>}</div>
              {hata && <p className="flex items-start gap-1.5 rounded-xl bg-rose-500/[0.08] px-3 py-2 text-[12px] text-rose-200 ring-1 ring-inset ring-rose-400/25"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{hata}</p>}
              {!bicim && <p className="flex items-start gap-1.5 text-[12px] text-amber-200"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Bu tarayıcı video kaydını desteklemiyor. Chrome, Edge ya da Firefox kullan.</p>}
              {bicim?.uzanti === "webm" && <p className="flex items-start gap-1.5 text-[11.5px] leading-snug text-metin-3"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Tarayıcın MP4 kaydı sunmuyor; dosya WebM olarak iner (YouTube ve çoğu oynatıcı açar).</p>}
              {tur === "gif" && toplam > 20 && <p className="flex items-start gap-1.5 rounded-xl bg-amber-300/[0.07] px-3 py-2 text-[11.5px] leading-snug text-amber-100/90 ring-1 ring-inset ring-amber-300/20"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />GIF en çok 20 sn olur; aralığın ilk 20 saniyesi alınır. Daha kısası için “Seçili klip” ya da işaretleri kullan.</p>}
              {tur === "gif" && <p className="text-[11.5px] leading-snug text-metin-3">Kare kare çizilir; sekmeyi arka plana alsan da doğru sonuç verir.</p>}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-white/[0.06] p-4">
          {sonuc ? (
            <>
              <button onClick={() => void basla()} className="flex h-11 items-center gap-1.5 rounded-full bg-white/[0.085] px-4 text-[13px] font-medium text-metin-2 transition hover:bg-white/[0.12] hover:text-metin active:scale-[0.97]"><RefreshCw className="h-4 w-4" /> Yeniden</button>
              {tur === "video" && <button onClick={() => void kaydet()} disabled={kaydedildi || kaydediliyor} className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-white/[0.085] text-[13.5px] font-medium text-metin transition hover:bg-white/[0.12] active:scale-[0.98] disabled:opacity-60">
                {kaydediliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : kaydedildi ? <Check className="h-4 w-4 text-white" /> : <Library className="h-4 w-4" />} {kaydedildi ? "Kitaplıkta" : "Kitaplığa kaydet"}
              </button>}
              <button onClick={indir} className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-[14px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.98]"><Download className="h-4 w-4" /> İndir</button>
            </>
          ) : calisiyor ? (
            <button onClick={() => iptal.current?.abort()} className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-white/[0.085] text-[13.5px] font-medium text-metin transition hover:bg-white/[0.12] hover:text-rose-300 active:scale-[0.98]"><X className="h-4 w-4" /> İptal et</button>
          ) : (
            <button onClick={() => void basla()} disabled={tur === "kare" || tur === "gif" ? tumSure <= 0 : tur === "ses" ? !sesBicim || toplam <= 0 : !bicim || toplam <= 0} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white text-[14px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.98] disabled:bg-white/[0.08] disabled:text-white/40">
              {tur === "kare" ? <ImageIcon className="h-4 w-4" /> : tur === "ses" ? <Music2 className="h-4 w-4" /> : tur === "gif" ? <Repeat className="h-4 w-4" /> : <Download className="h-4 w-4" />} {tur === "kare" ? "Kareyi PNG olarak al" : tur === "ses" ? "Sesi dışa aktar" : tur === "gif" ? "GIF oluştur" : "Dışa aktarmayı başlat"}
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}
