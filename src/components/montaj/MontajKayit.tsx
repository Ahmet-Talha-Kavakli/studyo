"use client";

import { useEffect, useRef, useState } from "react";
import { MonitorUp, Camera, Mic, Square, Circle, Loader2, X, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useMontaj, type MontajProje } from "@/store/useMontaj";
import { dosyalariIceAl, medyayiEkle, kisaSure } from "./ortak";
import { PKart } from "./ui";

type Mod = "ekran" | "kamera" | "ses";
const MODLAR: [Mod, string, typeof Mic, string][] = [["ekran", "Ekran", MonitorUp, "+ mikrofon"], ["kamera", "Kamera", Camera, "Yüz kamerası"], ["ses", "Ses", Mic, "Seslendirme"]];

/**
 * Tarayıcıda kayıt: ekran (sistem sesi + mikrofon), kamera ya da yalnız mikrofon.
 * Kayıt bitince dosya yüklenir, projenin medyasına ve playhead konumuna eklenir.
 */
export function MontajKayit({ proje }: { proje: MontajProje }) {
  const [mod, setMod] = useState<Mod | null>(null);
  const [durum, setDurum] = useState<"bos" | "geri" | "kayit" | "isleniyor">("bos");
  const [sayac, setSayac] = useState(0);
  const [geri, setGeri] = useState(3);
  const akisRef = useRef<MediaStream[]>([]);
  const kayitRef = useRef<MediaRecorder | null>(null);
  const onizRef = useRef<HTMLVideoElement>(null);
  const goruntuRef = useRef<MediaStream | null>(null);
  const [seviye, setSeviye] = useState(0);

  const temizle = () => { akisRef.current.forEach((s) => s.getTracks().forEach((t) => t.stop())); akisRef.current = []; };
  useEffect(() => () => { kayitRef.current?.state === "recording" && kayitRef.current.stop(); temizle(); }, []);
  // Canlı önizleme (kayıt kutusu açılınca bağlanır)
  useEffect(() => { const v = onizRef.current; if (v && goruntuRef.current && v.srcObject !== goruntuRef.current) { v.srcObject = goruntuRef.current; void v.play().catch(() => {}); } }, [durum]);
  useEffect(() => { if (durum !== "kayit") return; const i = setInterval(() => setSayac((s) => s + 1), 1000); return () => clearInterval(i); }, [durum]);

  const basla = async (m: Mod) => {
    if (!navigator.mediaDevices) return void toast.error("Kayıt desteklenmiyor", { description: "Bu tarayıcı ekran ve kamera kaydını desteklemiyor. Chrome, Edge ya da Firefox ile dene." });
    try {
      setMod(m);
      const izler: MediaStreamTrack[] = [];
      let goruntu: MediaStream | null = null;
      if (m === "ekran") { goruntu = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true }); akisRef.current.push(goruntu); }
      if (m === "kamera") { goruntu = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: { echoCancellation: true, noiseSuppression: true } }); akisRef.current.push(goruntu); }
      let mik: MediaStream | null = null;
      if (m !== "kamera") { try { mik = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); akisRef.current.push(mik); } catch { if (m === "ses") throw new Error("Mikrofon izni verilmedi"); } }
      if (goruntu) izler.push(...goruntu.getVideoTracks());
      // Sesleri tek iz halinde karıştır (ekran sesi + mikrofon)
      const sesler = [...(goruntu?.getAudioTracks() ?? []), ...(mik?.getAudioTracks() ?? [])];
      const ctx = new AudioContext(); const hedef = ctx.createMediaStreamDestination(); const analiz = ctx.createAnalyser(); analiz.fftSize = 256;
      for (const t of sesler) { const k = ctx.createMediaStreamSource(new MediaStream([t])); k.connect(hedef); k.connect(analiz); }
      if (sesler.length) izler.push(...hedef.stream.getAudioTracks());
      const veri = new Uint8Array(analiz.frequencyBinCount);
      const olc = () => { if (ctx.state === "closed") return; analiz.getByteTimeDomainData(veri); let m2 = 0; for (const v of veri) m2 = Math.max(m2, Math.abs(v - 128)); setSeviye(m2 / 128); requestAnimationFrame(olc); };
      olc();
      const akis = new MediaStream(izler);
      goruntuRef.current = goruntu;
      // 3-2-1 geri sayım (ekran kaydında paylaşım zaten seçildi)
      setDurum("geri");
      for (let i = 3; i > 0; i--) { setGeri(i); await new Promise((ok) => setTimeout(ok, 700)); }
      const mime = m === "ses" ? (MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/mp4")
        : (["video/mp4;codecs=avc1.42E01F,mp4a.40.2", "video/webm;codecs=vp9,opus", "video/webm"].find((x) => MediaRecorder.isTypeSupported(x)) ?? "video/webm");
      const parcalar: Blob[] = [];
      const kayit = new MediaRecorder(akis, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
      kayit.ondataavailable = (e) => { if (e.data.size) parcalar.push(e.data); };
      kayit.onstop = async () => {
        setDurum("isleniyor"); temizle(); void ctx.close();
        try {
          const tip = mime.split(";")[0];
          const uz = tip.includes("mp4") ? (m === "ses" ? "m4a" : "mp4") : "webm";
          const ad = `${m === "ekran" ? "Ekran kaydı" : m === "kamera" ? "Kamera kaydı" : "Ses kaydı"} ${new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`;
          const dosya = new File([new Blob(parcalar, { type: tip })], `${ad}.${uz}`, { type: tip });
          const [oge] = await dosyalariIceAl(proje.id, [dosya]);
          if (oge) { const id = medyayiEkle(proje.id, { ...oge, ad }, useMontaj.getState().playhead); if (id) useMontaj.getState().klipSec(id); toast.success(`${ad} eklendi`, { description: "Oynatma çizgisinin olduğu yere yerleştirildi." }); }
        } catch (e) { toast.error("Kayıt eklenemedi", { description: `${e instanceof Error ? e.message : "Kayıt dosyası işlenemedi."} Yeniden kaydetmeyi dene.` }); }
        finally { setDurum("bos"); setMod(null); setSayac(0); }
      };
      // Kullanıcı tarayıcının "paylaşımı durdur" düğmesine basarsa da kayıt biter
      izler.forEach((t) => t.addEventListener("ended", () => kayit.state === "recording" && kayit.stop()));
      kayitRef.current = kayit;
      kayit.start(1000);
      setSayac(0); setDurum("kayit");
    } catch (e) {
      temizle(); setDurum("bos"); setMod(null);
      if ((e as DOMException)?.name !== "NotAllowedError") toast.error("Kayıt başlatılamadı", { description: `${e instanceof Error ? e.message : "Kayıt aygıtına ulaşılamadı."} Yeniden dene.` });
      else toast.warning("Kayıt iptal edildi", { description: "Tarayıcı izni verilmedi. Adres çubuğundaki kilit simgesinden izin verip yeniden dene." });
    }
  };
  const durdur = () => kayitRef.current?.state === "recording" && kayitRef.current.stop();
  const vazgec = () => { if (kayitRef.current?.state === "recording") { kayitRef.current.onstop = null; kayitRef.current.stop(); } temizle(); setDurum("bos"); setMod(null); };

  if (durum === "bos") {
    return (
      <PKart baslik="Kayıt al" alt="Ekran, kamera ya da ses doğrudan montaja" ikon={CircleDot}>
        <div className="grid grid-cols-3 gap-1.5">
          {MODLAR.map(([id, ad, Ik, alt]) => (
            <button key={id} onClick={() => void basla(id)} title={alt} className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-white/[0.085] text-[12.5px] font-medium text-metin-2 transition hover:bg-white/[0.12] hover:text-metin active:scale-95">
              <Ik className="h-3.5 w-3.5 text-rose-300" />{ad}
            </button>
          ))}
        </div>
      </PKart>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl bg-rose-500/[0.06] ring-1 ring-inset ring-rose-400/30">
      {mod !== "ses" && <video ref={onizRef} muted playsInline className={cn("aspect-video w-full bg-black object-contain", mod === "kamera" && "-scale-x-100")} />}
      <div className="flex items-center gap-2.5 p-3">
        {durum === "isleniyor" ? <Loader2 className="h-4 w-4 animate-spin text-rose-300" /> : <span className="relative flex h-3 w-3"><span className="absolute inset-0 animate-ping rounded-full bg-rose-400/60" /><span className="relative h-3 w-3 rounded-full bg-rose-500" /></span>}
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold text-metin">{durum === "geri" ? `${geri}…` : durum === "isleniyor" ? "Kayıt işleniyor" : `Kaydediliyor · ${kisaSure(sayac)}`}</span>
          <span className="mt-1 block h-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-rose-400 transition-[width] duration-75" style={{ width: `${Math.min(100, seviye * 140)}%` }} /></span>
        </span>
        {durum === "kayit" && <button onClick={durdur} className="hf-btn flex h-8 items-center gap-1.5 rounded-lg bg-rose-500 px-3 text-[12px] font-semibold text-white hover:bg-rose-400"><Square className="h-3 w-3 fill-current" /> Bitir</button>}
        {durum !== "isleniyor" && <button onClick={vazgec} aria-label="Kaydı iptal et" className="flex h-8 w-8 items-center justify-center rounded-lg text-metin-3 hover:bg-white/[0.07] hover:text-metin"><X className="h-4 w-4" /></button>}
      </div>
      {durum === "geri" && <p className="flex items-center gap-1.5 px-3 pb-3 text-[11px] text-metin-3"><Circle className="h-2.5 w-2.5" /> Kayıt birazdan başlıyor</p>}
    </div>
  );
}
