"use client";

import { useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Film, Mic, Upload, Sparkles, Loader2, Lock, Play, Pause, RotateCcw, Check, ChevronRight, Images, X, Plus, Image as ImageIcon, Languages, ArrowRight } from "lucide-react";
import { cn, saltUrl } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { useSaglayicilar } from "@/hooks/useSaglayicilar";
import { useProjeler } from "@/store/useProjeler";
import { useMontaj } from "@/store/useMontaj";
import { useExplainer, type ExProje, type ExSahne, type ExAltyazi, type ExMuzik } from "@/store/useExplainer";
import { EX_STILLER, stilBul, stilPoster, stilVideo, sahneSure, tahminiSure, MUZIK_RUH } from "@/lib/explainerMotor";
import { dosyaYukle } from "@/components/montaj/ortak";
import { Kaydirici, Segment, AnahtarSatir, Sifirla } from "@/components/montaj/ui";
import { Bolum, Hap, AnlaticiSec } from "./ExParca";
import { sahneUret, bekleyenVar, KREDI, ceviriKopya } from "./exUretim";

const GORSEL_HAZIR = (s: Record<string, boolean> | null) => !!s && ["gemini", "seedream", "openai", "fal"].some((k) => s[k]);
const VIDEO_HAZIR = (s: Record<string, boolean> | null) => !!s && ["kling", "seedance", "minimax", "omni"].some((k) => s[k]);
const ikinci = "flex h-10 items-center justify-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[13px] font-medium text-metin ring-1 ring-inset ring-white/[0.09] transition-colors hover:bg-white/[0.1] disabled:opacity-45";

/* ═══════════ Görsel ═══════════ */

export function ExGorselPanel({ p, s }: { p: ExProje; s: ExSahne }) {
  const sag = useSaglayicilar();
  const uretimler = useProjeler((x) => x.uretimler);
  const g = (patch: Partial<ExSahne>) => useExplainer.getState().sahneGuncelle(p.id, s.id, patch);
  const [yuk, setYuk] = useState(false);
  const [secici, setSecici] = useState(false);
  const dosyaRef = useRef<HTMLInputElement>(null);
  const gorselHazir = GORSEL_HAZIR(sag), videoHazir = VIDEO_HAZIR(sag);
  const uretiliyor = s.gorselDurum === "uretiliyor";
  const kaynak = s.videoUrl ? "Hareketli klip" : s.gorselUrl ? (s.gorselKaynak === "yukleme" ? "Yüklenen görsel" : s.gorselKaynak === "uretim" ? "Üretimlerinden" : "AI görsel") : `Stil klibi · ${stilBul(p.ayar.stil).ad}`;
  const hazirMedya = uretimler.filter((u) => u.durum === "tamam" && !u.id.startsWith("seed_") && (u.tur === "gorsel" || u.tur === "video") && saltUrl(u.gorselUrl)).slice(0, 24);

  const yukle = async (d: File) => {
    if (!d.type.startsWith("image/") && !d.type.startsWith("video/")) return void mesaj.desteklenmeyenDosya("Görsel ya da video");
    setYuk(true);
    try {
      const url = await dosyaYukle(d, d.type);
      if (d.type.startsWith("video/")) g({ videoUrl: url, gorselUrl: undefined, gorselKaynak: "yukleme", gorselDurum: "hazir" });
      else g({ gorselUrl: url, videoUrl: undefined, gorselKaynak: "yukleme", gorselDurum: "hazir" });
      toast.success("Sahne görseli değiştirildi");
    } catch { mesaj.yuklenemedi(d.type.startsWith("video/") ? "Video" : "Görsel"); } finally { setYuk(false); }
  };

  return (
    <>
      <Bolum>
        <div className="relative aspect-video overflow-hidden rounded-[14px] bg-black outline outline-1 -outline-offset-1 outline-white/10">
          {s.videoUrl ? <video src={s.videoUrl} muted loop autoPlay playsInline className="h-full w-full object-cover" />
            /* eslint-disable-next-line @next/next/no-img-element */
            : s.gorselUrl ? <img src={s.gorselUrl} alt="" className="h-full w-full object-cover" />
              : <video src={stilVideo(p.ayar.stil)} poster={stilPoster(p.ayar.stil)} muted loop autoPlay playsInline className="h-full w-full object-cover" />}
          {uretiliyor && <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-[13px] text-white backdrop-blur-sm"><Loader2 className="h-5 w-5 animate-spin" />Üretiliyor</span>}
          <span className="absolute left-2.5 top-2.5 rounded-full bg-black/60 px-2.5 py-1 text-[11.5px] font-medium text-white backdrop-blur">{kaynak}</span>
          {(s.gorselUrl || s.videoUrl) && <button onClick={() => g({ gorselUrl: undefined, videoUrl: undefined, gorselKaynak: "stil", gorselDurum: "bos" })} title="Stil klibine dön" aria-label="Stil klibine dön" className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"><RotateCcw className="h-3.5 w-3.5" /></button>}
        </div>
      </Bolum>
      <Bolum baslik="AI ile üret" sag={<Hap>{stilBul(p.ayar.stil).ad}</Hap>}>
        <textarea value={s.gorselIstem} onChange={(e) => g({ gorselIstem: e.target.value.slice(0, 500) })} rows={3} placeholder="Sahnede ne görünsün? Örn. masasında dizüstü bilgisayarla çalışan genç kadın, akşam ışığı"
          className="block w-full resize-none rounded-[12px] bg-white/[0.05] p-3 text-[13.5px] leading-relaxed text-metin outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-metin-2 focus:ring-white/25" />
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => (gorselHazir ? sahneUret(p, s, "gorsel") : toast.info("Görsel sağlayıcısı bağlı değil", { description: "Sahne stil klibiyle gösteriliyor. Kendi görselini yükleyebilir ya da üretimlerinden seçebilirsin." }))} disabled={uretiliyor}
            className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-white text-black transition active:scale-95 disabled:opacity-45 text-[13px] font-semibold">
            {gorselHazir ? <Sparkles className="h-4 w-4" /> : <Lock className="h-4 w-4" />}Görsel üret<span className="tabular-nums opacity-75">· {KREDI.gorsel}</span>
          </button>
          <button onClick={() => (videoHazir ? sahneUret(p, s, "video") : toast.info("Video sağlayıcısı bağlı değil", { description: "Görsel şimdilik yavaş yakınlaşma hareketiyle oynuyor. Sağlayıcı bağlanınca hareketli klip üretebilirsin." }))} disabled={uretiliyor || !s.gorselUrl}
            title={!s.gorselUrl ? "Önce sahne görseli gerekli" : undefined} className={ikinci}>
            {videoHazir ? <Film className="h-4 w-4" /> : <Lock className="h-4 w-4" />}Hareketli yap<span className="tabular-nums text-metin-3">· {KREDI.video}</span>
          </button>
        </div>
        {!gorselHazir && <p className="text-[12px] leading-snug text-metin-3">Görsel sağlayıcısı bağlı olmadığı için sahne seçtiğin stilin gerçek klibiyle gösterilir.</p>}
      </Bolum>
      <Bolum baslik="Kendi görselin">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => dosyaRef.current?.click()} disabled={yuk} className={ikinci}>{yuk ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Yükle</button>
          <button onClick={() => (hazirMedya.length ? setSecici((v) => !v) : toast.info("Hazır üretimin yok", { description: "Henüz tamamlanmış görsel ya da video üretimin yok. Kendi dosyanı yükleyebilirsin." }))} className={cn(ikinci, secici && "bg-white/[0.12]")}><Images className="h-4 w-4" />Üretimlerimden</button>
        </div>
        <input ref={dosyaRef} type="file" accept="image/*,video/mp4,video/webm" hidden onChange={(e) => { const d = e.target.files?.[0]; e.target.value = ""; if (d) void yukle(d); }} />
        {secici && (
          <div className="grid max-h-52 grid-cols-3 gap-1.5 overflow-y-auto pr-0.5 [scrollbar-width:thin]">
            {hazirMedya.map((u) => (
              <button key={u.id} onClick={() => { g(u.tur === "video" && u.videoUrl ? { videoUrl: u.videoUrl, gorselUrl: saltUrl(u.gorselUrl), gorselKaynak: "uretim", gorselDurum: "hazir" } : { gorselUrl: saltUrl(u.gorselUrl), videoUrl: undefined, gorselKaynak: "uretim", gorselDurum: "hazir" }); setSecici(false); }}
                className="relative aspect-video overflow-hidden rounded-[8px] outline outline-1 -outline-offset-1 outline-white/10 hover:outline-white/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={saltUrl(u.gorselUrl)} alt="" className="-z-10 h-full w-full object-cover" />
                {u.tur === "video" && <Film className="absolute left-1 top-1 h-3 w-3 text-white" />}
                
              </button>
            ))}
          </div>
        )}
      </Bolum>
    </>
  );
}

/* ═══════════ Ses ═══════════ */

export function ExSesPanel({ p, s }: { p: ExProje; s: ExSahne }) {
  const sag = useSaglayicilar();
  const g = (patch: Partial<ExSahne>) => useExplainer.getState().sahneGuncelle(p.id, s.id, patch);
  const [dinle, setDinle] = useState(false);
  const sesRef = useRef<HTMLAudioElement | null>(null);
  const sesHazir = sag?.eleven === true;
  const sesBekliyor = bekleyenVar(p.id, s.id, "ses");
  const sesCal = () => {
    if (!s.sesUrl) return;
    if (dinle) { sesRef.current?.pause(); setDinle(false); return; }
    sesRef.current?.pause(); const a = new Audio(s.sesUrl); sesRef.current = a; a.onended = () => setDinle(false); void a.play(); setDinle(true);
  };
  return (
    <>
      <Bolum baslik="Seslendirme">
        <div className="flex items-center gap-3 rounded-[14px] bg-white/[0.04] p-3 ring-1 ring-inset ring-white/[0.07]">
          <button onClick={sesCal} disabled={!s.sesUrl} aria-label={dinle ? "Durdur" : "Dinle"} className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", s.sesUrl ? "bg-white text-[#0b0c0e]" : "bg-white/[0.06] text-metin-3")}>{dinle ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}</button>
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-semibold text-metin">{s.sesUrl ? (s.sesMetni === s.anlatim ? `Hazır · ${s.sesSure?.toFixed(1) ?? "?"} sn` : "Metin değişti, yeniden seslendir") : sesBekliyor ? "Seslendiriliyor" : "Henüz seslendirilmedi"}</span>
            <span className="mt-0.5 block truncate text-[12px] text-metin-3">{p.ayar.ses} · {s.anlatim.length} karakter</span>
          </span>
        </div>
        <button onClick={() => (sesHazir ? sahneUret(p, s, "ses") : toast.info("ElevenLabs bağlı değil", { description: "Seslendirme ElevenLabs anahtarıyla açılır. Şimdilik önizleme ve dışa aktarma altyazı ve müzikle sessiz anlatım olarak çalışır." }))} disabled={sesBekliyor || !s.anlatim.trim()}
          className={cn(ikinci, "w-full")}>
          {sesBekliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : sesHazir ? <Mic className="h-4 w-4" /> : <Lock className="h-4 w-4" />}{s.sesUrl ? "Yeniden seslendir" : "Bu sahneyi seslendir"}<span className="tabular-nums text-metin-3">· {KREDI.ses(s.anlatim)}</span>
        </button>
      </Bolum>
      <Bolum baslik="Anlatıcı" sag={<Hap>Tüm sahneler</Hap>}>
        <AnlaticiSec secili={p.ayar.ses} alt={sag?.eleven ? undefined : "ElevenLabs bağlanınca seslendirir"} onSec={(x) => { useExplainer.getState().ayarGuncelle(p.id, { ses: x.ad, sesId: x.sesId }); toast.success(`Anlatıcı ${x.ad} olarak seçildi`, { description: "Yeni seslendirmelerde geçerli olur." }); }} />
      </Bolum>
      <Bolum baslik="Süre" sag={s.sure ? <Sifirla etiket="Otomatik" fn={() => g({ sure: undefined })} /> : undefined}>
        <Kaydirici ad={s.sure ? "Kilitli süre" : "Otomatik süre"} deger={sahneSure(s)} min={2} max={30} adim={0.5} onDegis={(v) => g({ sure: v })} yaz={(n) => `${n.toFixed(1)} sn`}
          aciklama={`Okuma tahmini ${tahminiSure(s).toFixed(1)} sn${s.sesSure ? ` · seslendirme ${s.sesSure.toFixed(1)} sn` : ""}. Elle değiştirirsen kilitlenir.`} />
      </Bolum>
    </>
  );
}

/* ═══════════ Video (proje) ayarları ═══════════ */

export function ExVideoAyar({ p, yazar, onUretToplu }: { p: ExProje; yazar: boolean; onUretToplu: (tur: "gorsel" | "ses") => void }) {
  const a = (patch: Partial<ExProje["ayar"]>) => useExplainer.getState().ayarGuncelle(p.id, patch);
  const sag = useSaglayicilar();
  const sozluk = useExplainer((s) => s.sozluk);
  const marka = useMontaj((s) => s.marka);
  const [yeniK, setYeniK] = useState({ yazim: "", okunus: "" });
  const [ceviri, setCeviri] = useState(false);
  const gorselsiz = p.sahneler.filter((s) => !s.gorselUrl && !s.videoUrl).length;
  const sessiz = p.sahneler.filter((s) => s.anlatim.trim() && (!s.sesUrl || s.sesMetni !== s.anlatim)).length;
  const sesKredi = p.sahneler.filter((s) => s.anlatim.trim() && (!s.sesUrl || s.sesMetni !== s.anlatim)).reduce((x, s) => x + KREDI.ses(s.anlatim), 0);
  const girdi = "h-9 min-w-0 flex-1 rounded-[10px] bg-white/[0.05] px-3 text-[13px] text-metin outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-metin-2 focus:ring-white/25";

  return (
    <>
      <Bolum baslik="Toplu üretim">
        {([
          ["gorsel", ImageIcon, "Eksik görselleri üret", `${gorselsiz} sahne · ${gorselsiz * KREDI.gorsel} kredi`, GORSEL_HAZIR(sag), gorselsiz === 0, "Görsel sağlayıcısı bağlı değil; sahneler stil klibiyle oynuyor"],
          ["ses", Mic, "Tümünü seslendir", `${sessiz} sahne · ${sesKredi} kredi · ${p.ayar.ses}`, sag?.eleven === true, sessiz === 0, "ElevenLabs bağlı değil; anlatım altyazıyla gösteriliyor"],
        ] as const).map(([tur, Ik, ad, alt, hazir, bitti, kilit]) => (
          <button key={tur} onClick={() => (hazir ? onUretToplu(tur) : toast.info("Sağlayıcı bağlı değil", { description: `${kilit}.` }))} disabled={bitti}
            className="flex w-full items-center gap-3 rounded-[14px] bg-white/[0.04] p-3 text-left ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.07] disabled:opacity-60">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-metin-2">{hazir ? <Ik className="h-4 w-4" /> : <Lock className="h-4 w-4" />}</span>
            <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-semibold text-metin">{bitti ? (tur === "gorsel" ? "Tüm sahnelerin görseli var" : "Tüm sahneler seslendirildi") : ad}</span><span className="mt-0.5 block truncate text-[12px] tabular-nums text-metin-3">{bitti ? "Tamam" : hazir ? alt : "Bağlantı gerekli"}</span></span>
            {bitti ? <Check className="h-4 w-4 text-emerald-300" /> : <ChevronRight className="h-4 w-4 text-metin-3" />}
          </button>
        ))}
      </Bolum>
      <Bolum baslik="Görsel stil">
        <div className="grid grid-cols-3 gap-2">
          {EX_STILLER.map((x) => (
            <button key={x.tohum} onClick={() => a({ stil: x.tohum })} aria-pressed={p.ayar.stil === x.tohum} className="group min-w-0 text-left">
              <span className={cn("relative block aspect-video overflow-hidden rounded-[9px]", p.ayar.stil === x.tohum ? "outline outline-2 -outline-offset-2 outline-white" : "outline outline-1 -outline-offset-1 outline-white/10 group-hover:outline-white/30")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={stilPoster(x.tohum)} alt="" className="-z-10 h-full w-full object-cover" />
              </span>
              <span className={cn("mt-1 block truncate text-[11.5px]", p.ayar.stil === x.tohum ? "text-metin" : "text-metin-3")}>{x.ad}</span>
            </button>
          ))}
        </div>
      </Bolum>
      <Bolum baslik="Altyazı">
        <Segment etiket="Altyazı" deger={p.ayar.altyazi} onDegis={(v) => a({ altyazi: v })} secenekler={[["karaoke", "Karaoke"], ["tiktok", "Kalın"], ["altyazi", "Klasik"], ["yok", "Kapalı"]] as [ExAltyazi, string][]} />
      </Bolum>
      <Bolum baslik="Müzik ve efekt">
        <Segment etiket="Müzik" deger={p.ayar.muzik} onDegis={(v) => a({ muzik: v })} secenekler={(["yok", "sakin", "kurumsal", "enerjik", "duygusal"] as ExMuzik[]).map((m) => [m, m === "yok" ? "Yok" : MUZIK_RUH[m].ad] as [ExMuzik, string])} />
        <p className="text-[12px] leading-snug text-metin-3">Müzik videonun süresine göre tarayıcıda bestelenir ve konuşmada kısılır; kredi harcamaz.</p>
        <AnahtarSatir ad="Geçiş sesleri" alt="Sahne geçişlerinde hafif bir efekt." acik={p.ayar.sfx} onDegis={() => a({ sfx: !p.ayar.sfx })} />
      </Bolum>
      <Bolum baslik="Görünüm">
        <AnahtarSatir ad="İlerleme çubuğu" alt="Altta dolan çizgi." acik={p.ayar.ilerleme} onDegis={() => a({ ilerleme: !p.ayar.ilerleme })} />
        <AnahtarSatir ad="Marka setini uygula" alt={`Montaj Stüdyosu'ndaki marka seti: ${marka.font ? "yazı tipi, " : ""}${marka.renkler.length} renk${marka.logo ? ", logo" : ""}.`} acik={p.ayar.marka} onDegis={() => a({ marka: !p.ayar.marka })} />
      </Bolum>
      <Bolum baslik="Telaffuz sözlüğü">
        <p className="text-[12.5px] leading-snug text-metin-2">Seslendirmede kelimenin nasıl okunacağı; ekrandaki yazı değişmez.</p>
        {sozluk.map((x, i) => (
          <div key={i} className="flex items-center gap-2 rounded-[10px] bg-white/[0.04] px-3 py-2 text-[13px] ring-1 ring-inset ring-white/[0.06]">
            <span className="min-w-0 flex-1 truncate font-semibold text-metin">{x.yazim}</span><ArrowRight className="h-3.5 w-3.5 shrink-0 text-metin-3" /><span className="min-w-0 flex-1 truncate text-metin-2">{x.okunus}</span>
            <button onClick={() => useExplainer.getState().sozlukAyarla(sozluk.filter((_, j) => j !== i))} aria-label="Kaldır" className="text-metin-3 hover:text-metin"><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        <form onSubmit={(e) => { e.preventDefault(); if (!yeniK.yazim.trim() || !yeniK.okunus.trim()) return; useExplainer.getState().sozlukAyarla([...sozluk, { yazim: yeniK.yazim.trim(), okunus: yeniK.okunus.trim() }]); setYeniK({ yazim: "", okunus: "" }); }} className="flex gap-1.5">
          <input value={yeniK.yazim} onChange={(e) => setYeniK((k) => ({ ...k, yazim: e.target.value.slice(0, 40) }))} placeholder="Yazım (SaaS)" aria-label="Yazım" className={girdi} />
          <input value={yeniK.okunus} onChange={(e) => setYeniK((k) => ({ ...k, okunus: e.target.value.slice(0, 60) }))} placeholder="Okunuş (sas)" aria-label="Okunuş" className={girdi} />
          <button type="submit" aria-label="Ekle" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#0b0c0e]"><Plus className="h-4 w-4" /></button>
        </form>
      </Bolum>
      <Bolum baslik="Başka dilde kopya">
        <p className="text-[12.5px] leading-snug text-metin-2">Senaryonun çevrilmiş kopyası oluşturulur; görseller ve ayarlar korunur.</p>
        <button onClick={async () => { if (!yazar) return void toast.info("AI yazar bağlı değil", { description: "Çeviri için AI yazar gerekli. Metni elle düzenleyebilirsin." }); setCeviri(true); try { const id = await ceviriKopya(p, p.ayar.dil === "tr" ? "en" : "tr"); useExplainer.getState().sec(id); toast.success("Çevrilmiş kopya oluşturuldu", { description: "Özgün proje olduğu gibi kalır." }); } catch (e) { toast.error("Çevrilemedi", { description: `${e instanceof Error ? e.message : "Beklenmeyen bir sorun çıktı."} Yeniden dene.` }); } finally { setCeviri(false); } }}
          disabled={ceviri} className={cn(ikinci, "w-full")}>
          {ceviri ? <Loader2 className="h-4 w-4 animate-spin" /> : yazar ? <Languages className="h-4 w-4" /> : <Lock className="h-4 w-4" />}{p.ayar.dil === "tr" ? "İngilizce kopya oluştur" : "Türkçe kopya oluştur"}
        </button>
      </Bolum>
    </>
  );
}
