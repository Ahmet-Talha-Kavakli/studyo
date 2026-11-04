"use client";

import { SesAvatar } from "@/components/studyo/ses/ortak";
import { useEffect, useMemo, useRef, useState } from "react";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  Mic, Upload, Loader2, Check, X, Users, AudioLines, ScanFace, Sun, Maximize, Type, Square, Play, Pause, Trash2, FileText,
  ImageIcon, AlertTriangle, Film, RotateCcw, Smile, Plus, Lock, Wand2, Sparkles, Clock, Layers, Minus, Camera,
} from "lucide-react";
import Link from "next/link";
import { OzelGirdi } from "@/components/film/ortak";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn, saltUrl } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { useMasaustu } from "@/hooks/useMasaustu";
import { useSaglayicilar } from "@/hooks/useSaglayicilar";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { videoKrediHesap } from "@/lib/videoModelVeri";
import { sesCalici, useCalici } from "@/lib/sesCalici";
import { useAuth } from "@/store/useAuth";
import { useElements } from "@/store/useElements";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useOzelSesler } from "@/store/useOzelSesler";
import { ElementKapak } from "@/components/panel/element/elementMeta";
import { UretimGoruntuleyici } from "@/components/studyo/UretimGoruntuleyici";
import { MarkaKare } from "@/components/studyo/hf";
import { KlonModal } from "@/components/studyo/ses/KlonModal";
import { Bayrak } from "@/components/ui/Bayrak";
import { Yuzen } from "@/components/ui/Yuzen";
import { dosyaYukle } from "@/components/montaj/ortak";
import { Kaydirici, Segment, AnahtarSatir } from "@/components/montaj/ui";
import {
  ARAC_ADI, AVATARLAR, ETIKETLER, SENARYO_SABLON, DUYGULAR, JESTLER, JEST_EN, KAMERALAR, ARKAPLANLAR, DILLER, MODELLER, modelSinir, konusmaSuresi, temizSoz,
} from "./speakVeri";
import { KCip, IzgaraSec } from "@/components/studyo/Cip";
import { konuAnlamli } from "@/components/shorts/konuSenaryo";
import { SesListe, sesBilgi, Dalga, useSesOnizle, type SesAnahtar } from "./SesSecici";

type Portre = { url: string; ad: string; hazir: boolean; elementAd?: string; cinsiyet?: "Kadın" | "Erkek" };
type Kaynak = "metin" | "dosya" | "kayit";
type SesDosya = { url: string; veri: string; ad: string; sn: number; tepeler: number[] };
type Gorunum = "studyo" | "avatar" | "sonuc";

const MAKS_KARAKTER = 1500;
const VIDEO_HAZIR = (s: Record<string, boolean> | null, saglayici: string) => !!s?.[saglayici];

/** Ses dosyasından süre + dalga tepeleri (görsel dalga formu için). */
async function sesCoz(veri: ArrayBuffer): Promise<{ sn: number; tepeler: number[] }> {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const b = await ctx.decodeAudioData(veri.slice(0));
    const k = b.getChannelData(0), adet = 64, adim = Math.floor(k.length / adet) || 1;
    const tepeler = Array.from({ length: adet }, (_, i) => { let m = 0; for (let j = i * adim; j < (i + 1) * adim && j < k.length; j += 16) m = Math.max(m, Math.abs(k[j])); return m; });
    const enb = Math.max(...tepeler, 0.01);
    void ctx.close();
    return { sn: b.duration, tepeler: tepeler.map((t) => Math.max(0.08, t / enb)) };
  } catch { return { sn: 0, tepeler: [] }; }
}
const dataUrl = (b: Blob) => new Promise<string>((ok, red) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = red; r.readAsDataURL(b); });
/** Uzun metni sözcük sınırında kısaltır. */
const kisalt = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n).replace(/\s+\S*$/, "")}…`);
const snYaz = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

/** Komut kutusundaki seçenek çipi (yukarı açılır panel). */
const ARAC = "flex h-8 shrink-0 items-center whitespace-nowrap gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] font-medium text-metin-2 transition-[color,background-color,transform] hover:bg-white/[0.13] hover:text-metin active:scale-95";
/** Menü içinde başlık şeritli tek kart (dış kutu dolgusuz). */
const MENU = "overflow-hidden rounded-[18px] border border-white/[0.09] bg-[#1b1c1f]";

export function SpeakStudyo() {
  const masaustu = useMasaustu();
  const sag = useSaglayicilar();
  const krediBakiye = useAuth((s) => s.kullanici?.krediler ?? 0);
  const elementler = useElements((s) => s.elementler);
  const karakterler = useMemo(() => elementler.filter((e) => e.tur === "karakter" && e.gorseller.length), [elementler]);
  const uretimler = useProjeler((s) => s.uretimler);
  const sonuclar = useMemo(() => uretimler.filter((u) => u.arac === ARAC_ADI).sort((a, b) => b.olusturma - a.olusturma), [uretimler]);
  const ozelSesler = useOzelSesler((s) => s.sesler);

  const [portre, setPortre] = useState<Portre>({ url: AVATARLAR[0].gorsel, ad: AVATARLAR[0].ad, hazir: true, cinsiyet: AVATARLAR[0].cinsiyet });
  const [cozunurluk, setCozunurluk] = useState<{ w: number; h: number } | null>(null);
  const [kaynak, setKaynak] = useState<Kaynak>("metin");
  const [metin, setMetin] = useState("");
  const [sesDosya, setSesDosya] = useState<SesDosya | null>(null);
  const [kayitta, setKayitta] = useState<number | null>(null);
  const [yaziyor, setYaziyor] = useState(false);
  const [ses, setSes] = useState<SesAnahtar>("hazir:Bella");
  const [dil, setDil] = useState("tr");
  const [hiz, setHiz] = useState(1);
  const [duygu, setDuygu] = useState("samimi");
  const [yogunluk, setYogunluk] = useState(60);
  const [jest, setJest] = useState("dogal");
  const [kamera, setKamera] = useState("sabit");
  const [arka, setArka] = useState("orijinal");
  const [model, setModel] = useState<string>("Kling 3.0");
  const [oran, setOran] = useState("9:16");
  const [coz, setCoz] = useState("1080p");
  const [elleSure, setElleSure] = useState<number | null>(null);
  const [eleven, setEleven] = useState(false);
  const [riza, setRiza] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [mesgul, setMesgul] = useState(false);
  const [gorunum, setGorunum] = useState<Gorunum>("studyo");
  const [cip, setCip] = useState<string | null>(null);
  const [acik, setAcik] = useState<Uretim | null>(null);
  const [klon, setKlon] = useState(false);
  const [adet, setAdet] = useState(1);
  const [ozelDuygu, setOzelDuygu] = useState("");
  const [ozelKamera, setOzelKamera] = useState("");
  const [ozelArka, setOzelArka] = useState("");
  const dosyaRef = useRef<HTMLInputElement>(null);
  const sesRef = useRef<HTMLInputElement>(null);
  const metinRef = useRef<HTMLTextAreaElement>(null);
  const kayitRef = useRef<{ r: MediaRecorder; p: Blob[]; t: ReturnType<typeof setInterval> } | null>(null);
  const calici = useCalici();
  const onizle = useSesOnizle();

  const M = MODELLER.find((m) => m.deger === model) ?? MODELLER[0];
  useEffect(() => { if (!MODELLER.some((m) => m.deger === model)) setModel(MODELLER[0].deger); }, [model]);
  const sinir = modelSinir(model);
  const enUzun = sinir.sureler[sinir.sureler.length - 1];
  const sesBilgisi = sesBilgi(ses, ozelSesler);
  const L = DILLER.find((d) => d.deger === dil)!;
  const elevenBagli = sag?.eleven === true;
  const demo = sag !== null && !VIDEO_HAZIR(sag, M.saglayici);

  useEffect(() => {
    if (!sinir.oranlar.includes(oran)) setOran(sinir.oranlar[0] ?? "9:16");
    if (!sinir.cozler.includes(coz)) setCoz(sinir.cozler[sinir.cozler.length - 1]);
    if (elleSure !== null && !sinir.sureler.includes(elleSure)) setElleSure(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);
  useEffect(() => { const i = new Image(); i.onload = () => setCozunurluk({ w: i.naturalWidth, h: i.naturalHeight }); i.src = portre.url; }, [portre.url]);
  useEffect(() => () => { const k = kayitRef.current; if (k) { clearInterval(k.t); try { k.r.stop(); } catch { /* */ } } }, []);

  const sesModu = kaynak !== "metin";
  const konusma = sesModu ? Math.round((sesDosya?.sn ?? 0) * 10) / 10 : konusmaSuresi(metin, hiz);
  const otoSure = sinir.sureler.find((s) => s >= konusma + 0.5) ?? enUzun;
  const sure = elleSure ?? otoSure;
  const sigmiyor = konusma > enUzun;
  const kisaKaliyor = elleSure !== null && konusma > elleSure + 0.5;
  const uzunModel = MODELLER.find((m) => modelSinir(m.deger).sureler.slice(-1)[0] >= konusma);
  const kendiPortre = !portre.hazir;
  const elevenKredi = eleven && elevenBagli && !sesModu ? Math.max(1, Math.ceil(temizSoz(metin).length / 1000)) : 0;
  const videoKredi = videoKrediHesap(model);
  const kredi = (videoKredi + elevenKredi) * adet;
  const yeterli = demo || krediBakiye >= kredi;
  const engel = sesModu && !sesDosya ? (kaynak === "kayit" ? "Sesini kaydet" : "Bir ses dosyası yükle")
    : temizSoz(metin).length < 3 ? (sesModu ? "Kaydın metnini yaz ya da yazıya dök" : "Avatarın ne söyleyeceğini yaz")
    : !konuAnlamli(temizSoz(metin)) ? "Metin anlaşılmadı; avatarın söyleyeceği gerçek cümleleri yaz"
    : sigmiyor ? `Konuşma yaklaşık ${konusma} sn; ${model} en çok ${enUzun} sn`
    : kendiPortre && !riza ? "Görüntü kullanım iznini onayla"
    : !yeterli ? "Kredin yetersiz" : null;
  const cipAc = (id: string) => (v: boolean) => setCip(v ? id : null);

  const portreKoy = (p: Portre, sessiz = false) => {
    setPortre(p); setRiza(false); setGorunum("studyo"); setCip(null);
    if (!sessiz) toast.success(`${p.ad} seçildi`);
    if (p.cinsiyet && ses.startsWith("hazir:") && sesBilgisi.cinsiyet !== p.cinsiyet) setSes(p.cinsiyet === "Kadın" ? "hazir:Bella" : "hazir:Brian");
  };
  const fotoYukle = async (d: File) => {
    if (!d.type.startsWith("image/")) return void mesaj.desteklenmeyenDosya("JPG, PNG ya da WebP");
    if (d.size > 20 * 1024 * 1024) return void mesaj.dosyaCokBuyuk(20);
    setYukleniyor(true);
    try { portreKoy({ url: await dosyaYukle(d, d.type), ad: d.name.replace(/\.[^.]+$/, "").slice(0, 24) || "Fotoğrafım", hazir: false }, true); toast.success("Fotoğraf yüklendi", { description: "Konuşturmadan önce kullanım iznini onayla." }); }
    catch { mesaj.yuklenemedi("Fotoğraf"); } finally { setYukleniyor(false); }
  };
  const sesKoy = async (b: Blob, ad: string) => {
    if (b.size > 25 * 1024 * 1024) return void mesaj.dosyaCokBuyuk(25);
    const { sn, tepeler } = await sesCoz(await b.arrayBuffer());
    if (sn > 0 && sn < 1) return void toast.error("Kayıt çok kısa", { description: "En az 1 saniyelik bir ses kaydet ya da yükle." });
    if (sesDosya) URL.revokeObjectURL(sesDosya.url);
    setSesDosya({ url: URL.createObjectURL(b), veri: await dataUrl(b), ad, sn, tepeler });
  };
  const kayitBaslat = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return void toast.error("Ses kaydı desteklenmiyor", { description: "Bu tarayıcı mikrofonla kaydı desteklemiyor. Ses dosyası yükleyebilir ya da Chrome ile deneyebilirsin." });
    try {
      const akis = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(akis); const p: Blob[] = [];
      r.ondataavailable = (e) => { if (e.data.size) p.push(e.data); };
      r.onstop = () => { akis.getTracks().forEach((t) => t.stop()); void sesKoy(new Blob(p, { type: r.mimeType || "audio/webm" }), "Kaydım"); };
      const bas = Date.now();
      const t = setInterval(() => { const s = (Date.now() - bas) / 1000; setKayitta(s); if (s >= 60) kayitBitir(); }, 200);
      kayitRef.current = { r, p, t }; r.start(); setKayitta(0);
    } catch { mesaj.izinGerekli("Mikrofon"); }
  };
  const kayitBitir = () => { const k = kayitRef.current; if (!k) return; clearInterval(k.t); if (k.r.state !== "inactive") k.r.stop(); kayitRef.current = null; setKayitta(null); };
  const yaziyaDok = async () => {
    if (!sesDosya) return;
    if (!elevenBagli) return void toast.info("Yazıya dökme kapalı", { description: "Ses sağlayıcısı bağlı değil. Kayıtta söylenenleri metin kutusuna yaz." });
    setYaziyor(true);
    try {
      const r = await fetch("/api/uretim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tur: "ses", model: "Eleven Scribe", prompt: `Speak: ${sesDosya.ad}`, meta: { mod: "transkript", kaynakAd: sesDosya.ad }, girdi: { kaynak: sesDosya.veri } }) });
      const j = (await r.json()) as { ok: boolean; gercek?: boolean; hata?: string; detay?: { transkript?: string } };
      if (!j.ok || !j.gercek || !j.detay?.transkript) throw new Error(j.hata ?? "Metin çıkarılamadı");
      setMetin(j.detay.transkript.trim().slice(0, MAKS_KARAKTER)); toast.success("Kayıt yazıya döküldü");
    } catch (e) { toast.error("Yazıya dökülemedi", { description: e instanceof Error ? e.message : "Ses çözümlenemedi. Metni elle yazabilir ya da yeniden deneyebilirsin." }); }
    finally { setYaziyor(false); }
  };
  const etiketEkle = (t: string) => {
    const el = metinRef.current;
    const bas = el?.selectionStart ?? metin.length, son = el?.selectionEnd ?? metin.length;
    const once = metin.slice(0, bas), sonra = metin.slice(son);
    const ek = `${once && !once.endsWith(" ") ? " " : ""}${t} `;
    setMetin((once + ek + sonra).slice(0, MAKS_KARAKTER));
    requestAnimationFrame(() => { el?.focus(); const k = once.length + ek.length; el?.setSelectionRange(k, k); });
  };
  const metniDinle = () => {
    const id = "speak:senaryo";
    if (calici.id === id && calici.calisiyor) return sesCalici.durdur();
    if (!temizSoz(metin)) return void toast.error("Metin yok", { description: "Dinlemek için önce avatarın söyleyeceği metni yaz." });
    void sesCalici.cal(id, { tur: "tarayici", metin: temizSoz(metin), dil: dil === "tr" ? "tr-TR" : undefined, cinsiyet: sesBilgisi.cinsiyet, hiz });
  };

  const uret = () => {
    if (engel) return void toast.error("Üretim başlatılamadı", { description: `${engel}.` });
    setMesgul(true);
    const temiz = metin.trim();
    const grupId = `speak_${Date.now().toString(36)}`;
    const guc = yogunluk < 35 ? "subtle" : yogunluk < 70 ? "natural" : "highly expressive";
    const sesTarif = sesModu ? "a voice matching the uploaded recording's tone and pace" : `a ${sesBilgisi.cinsiyet === "Kadın" ? "female" : sesBilgisi.cinsiyet === "Erkek" ? "male" : "neutral"} voice that is ${sesBilgisi.tanim.toLowerCase()}`;
    const prompt = `${portre.elementAd ? `@${portre.elementAd} ` : ""}Talking-head video of the person in the image${A.en ? `, ${A.en}` : ""}. Camera: ${C.en}. They speak directly to the camera in ${L.en} with ${sesTarif}${hiz !== 1 ? `, at ${hiz > 1 ? "a slightly faster" : "a slightly slower"} pace` : ""}. Performance: ${D.en}, ${guc} facial expression, ${JEST_EN[jest]}, natural blinking and accurate lip-sync. They say: "${temiz}". Bracketed cues like [gülümser] or [duraksar] are performance directions, not spoken words. Keep the face and identity identical to the image.`;
    let ok = 0;
    for (let i = 0; i < adet; i++) {
      const r = uretimBaslat({
        baslik: `${portre.ad} · ${kisalt(temizSoz(temiz), 42)}`, tur: "video", model, prompt, kredi: videoKredi, arac: ARAC_ADI,
        // Sağlayıcı bağlı değilken başka birinin klibi gösterilmez: seçilen yüz durağan kare olarak kalır.
        meta: { demoKlip: { video: "", poster: portre.url }, gorselUrl: portre.url, oran, cozunurluk: coz, sure: `${sure}sn`, ses: "Açık", hamIstem: temiz, dil: L.ad, grupId, sira: i, sesId: sesBilgisi.sesId },
      });
      if (!r.ok) { uretimHataToast(r); break; }
      ok++;
    }
    if (!ok) { setMesgul(false); return; }
    if (elevenKredi && sesBilgisi.sesId) {
      const sr = uretimBaslat({ baslik: `${portre.ad} · stüdyo sesi`, tur: "ses", model: "Eleven Multilingual v2", prompt: temizSoz(temiz), kredi: elevenKredi, arac: ARAC_ADI, meta: { mod: "seslendirme", ses: sesBilgisi.ad, sesId: sesBilgisi.sesId, hamIstem: temiz, grupId, hiz } });
      if (!sr.ok) uretimHataToast(sr);
    }
    setMesgul(false);
    setTimeout(() => sonRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    toast.success(ok > 1 ? `${ok} konuşan video üretiliyor` : "Konuşan video üretiliyor", { description: `${model} · ${sure} sn · ${demo ? "Kredi düşmez." : `${(videoKredi + elevenKredi) * ok} kredi.`}` });
  };
  const uretRef = useRef(uret); uretRef.current = uret;
  const sonRef = useRef<HTMLDivElement>(null);
  const ayarlariKullan = (u: Uretim, sessiz = false) => {
    if (u.meta?.hamIstem) setMetin(u.meta.hamIstem);
    if (u.meta?.gorselUrl) { const av = AVATARLAR.find((a) => a.gorsel === u.meta!.gorselUrl); setPortre(av ? { url: av.gorsel, ad: av.ad, hazir: true, cinsiyet: av.cinsiyet } : { url: u.meta.gorselUrl, ad: u.baslik.split(" · ")[0], hazir: false }); }
    if (MODELLER.some((m) => m.deger === u.model)) setModel(u.model);
    if (u.meta?.oran) setOran(u.meta.oran);
    setKaynak("metin"); setGorunum("studyo");
    if (!sessiz) toast.success("Ayarlar yüklendi", { description: "Senaryo ve avatar kutuya geldi; değiştirip yeniden konuştur." });
  };

  const A = arka === "ozel" ? { deger: "ozel", ad: ozelArka.trim() || "Özel", alt: "Kendi tarifin", kapak: "", en: ozelArka.trim() ? `in ${ozelArka.trim()}` : "" } : ARKAPLANLAR.find((x) => x.deger === arka)!;
  const C = kamera === "ozel" ? { deger: "ozel", ad: ozelKamera.trim() || "Özel", alt: "Kendi tarifin", kapak: "", video: undefined, en: ozelKamera.trim() } : KAMERALAR.find((x) => x.deger === kamera)!;
  const D = duygu === "ozel" ? { deger: "ozel", ad: ozelDuygu.trim() || "Özel", alt: "Kendi tarifin", ikon: Sparkles, en: ozelDuygu.trim() } : DUYGULAR.find((x) => x.deger === duygu)!;
  const J = JESTLER.find((x) => x[0] === jest)!;
  const altyazi = temizSoz(metin);
  const kalite = cozunurluk ? Math.min(cozunurluk.w, cozunurluk.h) : 0;
  const calisan = sonuclar.filter((u) => u.durum === "kuyrukta" || u.durum === "isleniyor").length;

  /* ═════════ ÖNİZLEME: hero'daki cam panelde canlı taslak ═════════ */
  const [w, h] = oran.split(":").map(Number);
  const yatay = w > h;
  const sahne = (
    <div className="relative mx-auto overflow-hidden rounded-[18px] bg-black ring-1 ring-inset ring-white/15"
      style={{ aspectRatio: `${w} / ${h}`, ...(yatay ? { width: masaustu ? "min(100%, 560px)" : "calc(100vw - 80px)" } : { height: masaustu ? "min(400px, 52vh)" : "320px" }) }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {A.kapak && <img src={A.kapak} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-md" />}
      <AnimatePresence initial={false}>
        <motion.img key={portre.url} src={portre.url} alt={portre.ad} initial={{ clipPath: "inset(0 100% 0 0)" }} animate={{ clipPath: "inset(0 0% 0 0)" }} transition={{ duration: 0.6, ease: EASE }}
          className="absolute inset-0 h-full w-full object-cover object-top" />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
      <div className="absolute inset-x-2.5 bottom-2.5 flex items-end gap-2.5 rounded-[14px] bg-black/50 p-2.5 backdrop-blur-xl">
        <Dalga ad={sesModu ? "kayit" : sesBilgisi.ad} renk="#ffffff" adet={9} yukseklik={22} canli={!!altyazi} />
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={altyazi ? "dolu" : "bos"} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
            className={cn("line-clamp-3 min-w-0 flex-1 text-[13px] leading-snug", altyazi ? "font-medium text-white" : "text-white/65")}>{altyazi || "Yazdığın senaryo burada altyazı olur."}</motion.p>
        </AnimatePresence>
      </div>
    </div>
  );

  /* ═════════ KOMUT KUTUSU ═════════ */
  const avatarCip = (
    <div className="relative">
      <button onClick={() => setCip(cip === "avatar" ? null : "avatar")} aria-label={`Avatar: ${portre.ad}, değiştir`} title="Avatarı değiştir"
        className={cn("group relative block h-[92px] w-[70px] shrink-0 overflow-hidden rounded-[14px] bg-black transition active:scale-95 max-sm:h-[76px] max-sm:w-[58px]", cip === "avatar" ? "outline outline-2 -outline-offset-2 outline-white" : "outline outline-1 -outline-offset-1 outline-white/15 hover:outline-white/40")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={portre.url} alt="" className="absolute inset-0 -z-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-1 pb-1 pt-4 text-center text-[11px] font-medium text-white">{portre.ad}</span>
        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"><RotateCcw className="h-3 w-3" /></span>
      </button>
      <Yuzen acik={cip === "avatar"} onKapat={() => setCip(null)} yerlesim="ust-sol" bosluk={10} etiket="Avatar"
        className="flex max-h-[min(72vh,620px)] flex-col overflow-hidden rounded-[18px] border border-white/[0.09] bg-[#1b1c1f]" style={{ width: "min(460px, calc(100vw - 24px))" }}>
        <div className="flex min-h-[44px] shrink-0 items-center justify-between border-b border-white/[0.06] px-3.5 py-2"><p className="text-[13.5px] font-semibold text-metin">Avatar</p><button onClick={() => { setCip(null); setGorunum("avatar"); }} className="flex h-7 items-center gap-1 rounded-full bg-white/[0.08] px-2.5 text-[12px] font-medium text-metin-2 hover:bg-white/[0.13] hover:text-metin">Tümü<span className="tabular-nums text-metin-3">{AVATARLAR.length + karakterler.length}</span></button></div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2.5 [scrollbar-width:thin]"><div className="grid grid-cols-5 gap-2">
          <button onClick={() => dosyaRef.current?.click()} className="flex aspect-[3/4] flex-col items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-white/20 text-metin-2 transition-colors hover:border-white/45 hover:text-metin">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08]">{yukleniyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}</span><span className="text-[11px] font-medium">Fotoğraf</span>
          </button>
          {karakterler.map((k) => (
            <button key={k.id} onClick={() => portreKoy({ url: k.gorseller[0], ad: k.ad, hazir: !!k.ornek, elementAd: k.ad }, true)} title={`@${k.ad}`} className={cn("relative aspect-[3/4] overflow-hidden rounded-[10px]", portre.url === k.gorseller[0] ? "outline outline-2 -outline-offset-2 outline-white" : "outline outline-1 -outline-offset-1 outline-white/10 hover:outline-white/35")}>
              <ElementKapak e={k} className="absolute inset-0 -z-0 h-full w-full" />
              <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/85 to-transparent px-1 pb-0.5 pt-3 text-center text-[10.5px] font-medium text-white">@{k.ad}</span>
            </button>
          ))}
          {AVATARLAR.map((a) => (
            <button key={a.id} onClick={() => portreKoy({ url: a.gorsel, ad: a.ad, hazir: true, cinsiyet: a.cinsiyet }, true)} title={a.ad} className={cn("relative aspect-[3/4] overflow-hidden rounded-[10px]", portre.url === a.gorsel ? "outline outline-2 -outline-offset-2 outline-white" : "outline outline-1 -outline-offset-1 outline-white/10 hover:outline-white/35")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.gorsel} alt="" loading="lazy" className="absolute inset-0 -z-0 h-full w-full object-cover object-top" />
              <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/85 to-transparent px-1 pb-0.5 pt-3 text-center text-[10.5px] font-medium text-white">{a.ad}</span>
            </button>
          ))}
        </div></div>
      </Yuzen>
    </div>
  );

  const KAYNAKLAR: [Kaynak, string, typeof Type][] = [["metin", "Metin", Type], ["dosya", "Ses yükle", Upload], ["kayit", "Kaydet", Mic]];
  const metinAraclari = !sesModu && (
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <button onClick={() => setCip(cip === "etiket" ? null : "etiket")} aria-expanded={cip === "etiket"} className={cn(ARAC, cip === "etiket" && "bg-white/[0.12] text-metin")}><Smile className="h-4 w-4" />İfade<span className="max-sm:hidden"> ekle</span></button>
            <Yuzen acik={cip === "etiket"} onKapat={() => setCip(null)} yerlesim="ust-sag" bosluk={8} etiket="İfade ekle" className={cn(MENU, "w-[300px]")}>
              <div className="flex min-h-[44px] items-center gap-2 border-b border-white/[0.06] px-3.5 py-2"><span className="flex-1 text-[13.5px] font-semibold text-metin">İfade ekle</span><span className="text-[11.5px] text-metin-3">İmlecin olduğu yere</span></div>
              <div className="p-1.5">
                {ETIKETLER.map((t) => (
                  <button key={t.etiket} onClick={() => { etiketEkle(t.etiket); setCip(null); }} className="flex w-full items-center gap-2.5 rounded-[12px] px-2 py-2 text-left transition-colors hover:bg-white/[0.05]">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06]"><t.ikon className="h-4 w-4 text-metin-2" /></span><span className="flex-1 text-[13.5px] font-medium text-metin">{t.ad}</span><span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11.5px] text-metin-3">{t.etiket}</span>
                  </button>
                ))}
              </div>
            </Yuzen>
          </div>
          <div className="relative">
            <button onClick={() => setCip(cip === "sablon" ? null : "sablon")} aria-expanded={cip === "sablon"} className={cn(ARAC, cip === "sablon" && "bg-white/[0.12] text-metin")}><Wand2 className="h-4 w-4" /><span className="max-sm:hidden">Hazır senaryo</span></button>
            <Yuzen acik={cip === "sablon"} onKapat={() => setCip(null)} yerlesim="ust-sag" bosluk={8} etiket="Hazır senaryo" className={cn(MENU, "w-[360px]")}>
              <div className="flex min-h-[44px] items-center gap-2 border-b border-white/[0.06] px-3.5 py-2"><span className="flex-1 text-[13.5px] font-semibold text-metin">Hazır senaryo</span><span className="text-[11.5px] tabular-nums text-metin-3">{SENARYO_SABLON.length}</span></div>
              <div className="p-1.5">
                {SENARYO_SABLON.map((x) => (
                  <button key={x.ad} onClick={() => { setMetin(x.metin); setCip(null); }} aria-pressed={metin === x.metin} className={cn("flex w-full items-center gap-3 rounded-[12px] p-2 text-left ring-1 ring-inset transition-colors", metin === x.metin ? "bg-white/[0.07] ring-white/60" : "ring-transparent hover:bg-white/[0.05]")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={x.kapak} alt="" className="h-11 w-11 shrink-0 rounded-[10px] object-cover" />
                    <span className="min-w-0"><span className="block text-[13.5px] font-medium text-metin">{x.ad}</span><span className="block truncate text-[12px] text-metin-3">{temizSoz(x.metin)}</span></span>
                  </button>
                ))}
              </div>
            </Yuzen>
          </div>
          {metin && <button onClick={() => setMetin("")} title="Metni temizle" aria-label="Metni temizle" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-3 transition-colors hover:bg-white/[0.06] hover:text-metin"><Trash2 className="h-4 w-4" /></button>}
          <div className="flex h-8 shrink-0 items-center whitespace-nowrap rounded-full bg-white/[0.08]">
            <button onClick={metniDinle} title="Taslağı tarayıcı sesiyle dinle" className="flex h-full items-center gap-1.5 rounded-l-full pl-2.5 pr-2 text-[12.5px] font-medium text-metin-2 transition-colors hover:text-metin">
              {calici.id === "speak:senaryo" && calici.calisiyor ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}<span className="max-sm:hidden">Dinle</span>
            </button>
            <span className="h-4 w-px bg-white/[0.12]" />
            <span title="Tahmini konuşma süresi" className={cn("flex items-center gap-1 px-2.5 text-[12.5px] font-medium tabular-nums", sigmiyor ? "text-rose-300" : kisaKaliyor ? "text-amber-200" : "text-metin")}><Clock className="h-3.5 w-3.5 text-metin-3" />{konusma < 1 ? "0 sn" : `${Math.round(konusma)} sn`}</span>
          </div>
        </div>
  );
  const girdi = !sesModu ? (
    <div className="min-w-0">
      <textarea ref={metinRef} value={metin} onChange={(e) => setMetin(e.target.value.slice(0, MAKS_KARAKTER))} rows={2} aria-label="Senaryo"
        onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); uret(); } }}
        placeholder="Avatar ne söylesin? Örneğin: Merhaba! [gülümser] Bugün size harika bir şey göstereceğim."
        className="block max-h-[160px] min-h-[56px] w-full resize-none bg-transparent px-1 pt-1 text-[16px] leading-relaxed text-metin outline-none placeholder:text-metin-2 [field-sizing:content] [scrollbar-width:thin]" />
    </div>
  ) : (
    <div className="min-w-0">
      <input ref={sesRef} type="file" accept="audio/*" hidden onChange={(e) => { const d = e.target.files?.[0]; e.target.value = ""; if (d) void sesKoy(d, d.name); }} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={sesDosya ? "dosya" : kaynak} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
          {sesDosya ? (
            <div className="flex items-center gap-3 rounded-[16px] bg-white/[0.08] p-2.5 ring-1 ring-inset ring-white/[0.08]">
              <button onClick={() => (calici.id === "speak:kayit" && calici.calisiyor ? sesCalici.durdur() : void sesCalici.cal("speak:kayit", { tur: "dosya", url: sesDosya.url }))} aria-label="Kaydı dinle"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#0b0c0e] transition active:scale-90">{calici.id === "speak:kayit" && calici.calisiyor ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 translate-x-px fill-current" />}</button>
              <div className="min-w-0 flex-1">
                <div className="flex h-7 items-center gap-[2px]">
                  {(sesDosya.tepeler.length ? sesDosya.tepeler : Array(64).fill(0.3)).map((t, i) => {
                    const ilerleme = calici.id === "speak:kayit" && calici.toplam ? calici.an / calici.toplam : 0;
                    return <span key={i} className={cn("flex-1 rounded-full transition-colors", i / 64 < ilerleme ? "bg-white" : "bg-white/25")} style={{ height: `${t * 100}%` }} />;
                  })}
                </div>
                <p className="mt-0.5 truncate text-[12px] tabular-nums text-metin-3">{sesDosya.ad} · {sesDosya.sn ? snYaz(sesDosya.sn) : "süre okunamadı"}{sesDosya.sn > enUzun ? ` · ${model} en çok ${enUzun} sn` : ""}</p>
              </div>
              <button onClick={() => void yaziyaDok()} disabled={yaziyor} title="Yazıya dök" className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.1] px-3 text-[12.5px] font-medium text-metin transition hover:bg-white/[0.15] disabled:opacity-50">
                {yaziyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : elevenBagli ? <FileText className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}<span className="max-sm:hidden">Yazıya dök</span>
              </button>
              <button onClick={() => { URL.revokeObjectURL(sesDosya.url); setSesDosya(null); }} aria-label="Kaydı kaldır" className="flex h-9 w-9 items-center justify-center rounded-full text-metin-3 transition hover:bg-white/[0.07] hover:text-metin active:scale-90"><X className="h-4 w-4" /></button>
            </div>
          ) : kaynak === "kayit" ? (
            <div className="flex items-center gap-3 rounded-[16px] bg-white/[0.08] p-2.5 ring-1 ring-inset ring-white/[0.08]">
              <button onClick={() => (kayitta !== null ? kayitBitir() : void kayitBaslat())} aria-label={kayitta !== null ? "Kaydı bitir" : "Kayda başla"}
                className={cn("relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-90", kayitta !== null ? "bg-rose-500 text-white" : "bg-white text-[#0b0c0e]")}>
                {kayitta !== null && <span className="absolute inset-0 animate-ping rounded-full bg-rose-500/40" />}
                {kayitta !== null ? <Square className="relative h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}
              </button>
              <span className="min-w-0"><span className="block text-[14.5px] font-semibold tabular-nums text-metin">{kayitta !== null ? `Kaydediliyor · ${snYaz(kayitta)} / 1:00` : "Kayda başlamak için mikrofona bas"}</span><span className="block text-[12.5px] text-metin-3">Sessiz bir ortamda, mikrofona 20 cm uzaktan konuş</span></span>
            </div>
          ) : (
            <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const d = e.dataTransfer.files[0]; if (d?.type.startsWith("audio/")) void sesKoy(d, d.name); }}
              className="flex items-center gap-3 rounded-[16px] bg-white/[0.08] p-2.5 ring-1 ring-inset ring-white/[0.08] max-sm:flex-col max-sm:items-stretch">
              <span className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-metin"><AudioLines className="h-5 w-5" /></span>
                <span className="min-w-0"><span className="block text-[15px] font-medium text-metin">Ses dosyanı sürükle ya da seç</span><span className="block text-[12.5px] text-metin-3">MP3, WAV, M4A, 25 MB'a kadar, tek konuşmacı</span></span>
              </span>
              <span className="flex-1" />
              <button onClick={() => sesRef.current?.click()} className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-black transition active:scale-95"><Upload className="h-4 w-4" />Bilgisayardan</button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <textarea ref={metinRef} value={metin} onChange={(e) => setMetin(e.target.value.slice(0, MAKS_KARAKTER))} rows={1} aria-label="Kaydın metni"
        placeholder="Kayıtta söylenenleri yaz; dudaklar bu sözlerle eşlenir" className="mt-2 block w-full resize-none bg-transparent px-1 text-[14.5px] leading-relaxed text-metin outline-none placeholder:text-metin-2 [field-sizing:content]" />
    </div>
  );

  const secenekler = (
    <>
      <KCip buyuk okGizli etiket="Ses" ikon={<SesAvatar ad={sesBilgisi.ad} renk={sesBilgisi.renk} boyut={28} />} deger={sesModu ? "Kaydın" : sesBilgisi.ad} acik={cip === "ses"} setAcik={cipAc("ses")} genislik={560} sag={<span className="text-[11.5px] text-metin-3">Dinlemek için küreye bas</span>}>
        {sesModu ? <p className="p-2 text-[13px] text-metin-2">Ses, yüklediğin ya da kaydettiğin dosyadan gelir. Hazır ses kullanmak için kaynağı Metin yap.</p>
          : <div className="-m-2 flex h-[min(520px,60vh)] flex-col"><SesListe secili={ses} onSec={(a) => { setSes(a); setCip(null); }} onKlonla={() => { setCip(null); setKlon(true); }} onerilen={portre.cinsiyet} cal={onizle.cal} calan={onizle.calan} /></div>}
      </KCip>
      <KCip buyuk okGizli etiket="Performans" ikon={<D.ikon className="h-4 w-4" />} deger={`${D.ad} · ${J[1]}`} acik={cip === "duygu"} setAcik={cipAc("duygu")} genislik={380}>
        <div className="space-y-2 p-0.5">
          <OzelGirdi deger={ozelDuygu} set={setOzelDuygu} secili={duygu === "ozel"} ph="Ör. gururlu ama alçakgönüllü, hafif gülümseyen" alt="Listede yoksa tavrı tarif et" uygula={() => setDuygu("ozel")} />
          <MenuKart baslik="Duygu" sag={<span className="text-[11.5px] text-metin-3">Yüz ifadesi ve ses tonu</span>}>
            <div className="grid grid-cols-3 gap-1.5 p-1.5">
              {DUYGULAR.map((d) => {
                const sec = duygu === d.deger;
                return (
                  <button key={d.deger} onClick={() => setDuygu(d.deger)} aria-pressed={sec}
                    className={cn("flex flex-col items-center gap-1.5 rounded-[12px] px-1.5 pb-2.5 pt-3 text-center ring-1 ring-inset transition-[background-color,box-shadow,transform] active:scale-95", sec ? "bg-white/[0.08] ring-white/70" : "ring-white/[0.06] hover:bg-white/[0.05]")}>
                    <span className={cn("flex h-9 w-9 items-center justify-center rounded-full transition-colors", sec ? "bg-white text-black" : "bg-white/[0.08] text-metin-2")}><d.ikon className="h-[18px] w-[18px]" /></span>
                    <span className="text-[13px] font-medium leading-tight text-metin">{d.ad}</span>
                    <span className="-mt-1 text-[11.5px] leading-tight text-metin-3">{d.alt}</span>
                  </button>
                );
              })}
            </div>
          </MenuKart>
          <MenuKart baslik="Yüz ve beden">
            <div className="space-y-2.5 p-2.5">
              <div className="flex items-center gap-2"><span className="w-[52px] shrink-0 text-[12.5px] text-metin-2">İfade</span><div className="min-w-0 flex-1"><Segment etiket="İfade yoğunluğu" deger={yogunluk < 45 ? 30 : yogunluk < 75 ? 60 : 90} onDegis={setYogunluk} secenekler={[[30, "Ölçülü"], [60, "Doğal"], [90, "Çok ifadeli"]]} /></div></div>
              <div className="flex items-center gap-2"><span className="w-[52px] shrink-0 text-[12.5px] text-metin-2">Jestler</span><div className="min-w-0 flex-1"><Segment etiket="Jest" deger={jest} onDegis={setJest} secenekler={JESTLER.map(([v, a]) => [v, a] as const)} /></div></div>
            </div>
          </MenuKart>
          {!sesModu && (
            <MenuKart baslik="Konuşma hızı" sag={<span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[12px] font-medium tabular-nums text-metin">{hiz === 1 ? "Normal" : hiz < 1 ? `%${Math.round((1 - hiz) * 100)} yavaş` : `%${Math.round((hiz - 1) * 100)} hızlı`}</span>}>
              <div className="px-3 pb-3 pt-2"><Kaydirici ad="Yavaş" deger={hiz} min={0.8} max={1.2} adim={0.05} varsayilan={1} onDegis={setHiz} yaz={() => "Hızlı"} /></div>
            </MenuKart>
          )}
        </div>
      </KCip>
      <KCip buyuk okGizli etiket="Kamera" ikon={C.kapak ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={C.kapak} alt="" className="h-full w-full object-cover" /> : <Camera className="h-4 w-4" />} deger={C.ad.length > 14 ? `${C.ad.slice(0, 13).trim()}…` : C.ad} acik={cip === "kamera"} setAcik={cipAc("kamera")} genislik={460}>
        <OzelGirdi deger={ozelKamera} set={setOzelKamera} secili={kamera === "ozel"} ph="Ör. yavaşça yaklaşıp yüzde dursun" alt="Listede yoksa kamerayı tarif et" uygula={() => { setKamera("ozel"); setCip(null); }} />
        <div className="grid grid-cols-3 gap-2 p-1">{KAMERALAR.map((k) => <IzgaraSec key={k.deger} sec={kamera === k.deger} ad={k.ad} alt={k.alt} kapak={k.kapak} video={k.video} onClick={() => { setKamera(k.deger); setCip(null); }} />)}</div>
      </KCip>
      <KCip buyuk okGizli etiket="Arka plan" ikon={A.kapak ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={A.kapak} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4" />} deger={A.ad.length > 14 ? `${A.ad.slice(0, 13).trim()}…` : A.ad} acik={cip === "arka"} setAcik={cipAc("arka")} genislik={460}>
        <OzelGirdi deger={ozelArka} set={setOzelArka} secili={arka === "ozel"} ph="Ör. kitaplarla dolu sıcak bir çalışma odası" alt="Listede yoksa mekânı tarif et" uygula={() => { setArka("ozel"); setCip(null); }} />
        <div className="grid grid-cols-3 gap-2 p-1">{ARKAPLANLAR.map((a) => <IzgaraSec key={a.deger} sec={arka === a.deger} ad={a.ad} alt={a.alt} kapak={a.kapak || portre.url} onClick={() => { setArka(a.deger); setCip(null); }} />)}</div>
      </KCip>
      <KCip buyuk okGizli etiket="Dil" ikon={<Bayrak b={L.bayrak} boyut={18} />} deger={L.ad} acik={cip === "dil"} setAcik={cipAc("dil")} genislik={440}
        sag={<span className="text-[11.5px] text-metin-3">Türkçe dışında metin çevrilir</span>}>
        <div className="grid grid-cols-2 gap-1.5 p-0.5">
          {DILLER.map((d) => {
            const sec = dil === d.deger;
            return (
              <button key={d.deger} onClick={() => { setDil(d.deger); setCip(null); }} aria-pressed={sec}
                className={cn("flex min-w-0 items-center gap-2.5 rounded-[12px] p-2 text-left ring-1 ring-inset transition-colors", sec ? "bg-white/[0.08] ring-white/70" : "ring-white/[0.06] hover:bg-white/[0.05]")} style={sec ? undefined : { background: "rgba(255,255,255,0.025)" }}>
                <Bayrak b={d.bayrak} boyut={22} /><span className="min-w-0 flex-1 leading-tight"><span className="block truncate text-[13px] font-medium text-metin">{d.ad}</span><span className="block truncate text-[11.5px] text-metin-3">{d.aksan}</span></span>
              </button>
            );
          })}
        </div>
      </KCip>
      <KCip buyuk okGizli etiket="Model" ikon={<MarkaKare ad={model} boyut={26} />} deger={M.ad} acik={cip === "model"} setAcik={cipAc("model")} genislik={500}>
        <div className="space-y-2 p-0.5">
          <MenuKart baslik="Dudak senkronu modelleri" sag={<span className="text-[11.5px] text-metin-3">Kredi video başına</span>}>
            <div className="grid grid-cols-2 gap-1.5 p-1.5">
              {MODELLER.map((m) => {
                const sec = model === m.deger, ms = modelSinir(m.deger);
                return (
                  <button key={m.deger} onClick={() => setModel(m.deger)} aria-pressed={sec}
                    className={cn("flex flex-col gap-2 rounded-[14px] p-2.5 text-left ring-1 ring-inset transition-[background-color,box-shadow]", sec ? "bg-white/[0.08] ring-white/70" : "ring-white/[0.06] hover:bg-white/[0.05] hover:ring-white/20")} style={sec ? undefined : { background: "rgba(255,255,255,0.025)" }}>
                    <span className="flex items-center gap-2">
                      <MarkaKare ad={m.deger} boyut={30} />
                      <span className="whitespace-nowrap rounded-full bg-white/[0.08] px-2 py-0.5 text-[11px] font-medium tabular-nums text-metin-2 max-sm:hidden">en çok {ms.sureler[ms.sureler.length - 1]} sn</span>
                      <span className={cn("ml-auto flex h-6 items-center gap-1 rounded-full px-2 text-[11.5px] font-semibold tabular-nums", sec ? "bg-white text-black" : "bg-white/[0.08] text-metin-2")}><KrediYildiz className="h-3 w-3" />{videoKrediHesap(m.deger)}</span>
                    </span>
                    <span className="min-w-0 leading-tight">
                      <span className="flex items-center gap-1.5"><span className="truncate text-[13.5px] font-semibold text-metin">{m.ad}</span>{m.rozet && <span className="shrink-0 rounded-full bg-white/[0.08] px-1.5 py-px text-[10.5px] font-medium text-metin-2">{m.rozet}</span>}</span>
                      <span className="mt-0.5 block truncate text-[11.5px] text-metin-3">{m.alt}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </MenuKart>
          <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-2">
            <MenuKart baslik="En-boy oranı"><div className="p-2"><Segment etiket="Oran" deger={oran} onDegis={setOran} secenekler={sinir.oranlar.map((o) => [o, o] as const)} /></div></MenuKart>
            <MenuKart baslik="Kalite"><div className="p-2"><Segment etiket="Kalite" deger={coz} onDegis={setCoz} secenekler={sinir.cozler.map((c) => [c, c] as const)} /></div></MenuKart>
          </div>
          <MenuKart baslik="Video süresi" sag={<span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[12px] font-medium tabular-nums text-metin">{sure} sn</span>}>
            <div className="space-y-3 p-3">
              <AnahtarSatir ad="Metne göre ayarla" alt={elleSure !== null ? "Kapalı; süreyi aşağıdan seç" : konusma < 1 ? "Senaryo yazınca konuşma süresine göre seçilir" : `Konuşma ${Math.round(konusma)} sn, en yakın süre seçildi`} acik={elleSure === null}
                onDegis={() => setElleSure(elleSure === null ? sure : null)} />
              {elleSure !== null && (sinir.sureler.length <= 4
                ? <Segment etiket="Süre" deger={elleSure} onDegis={setElleSure} secenekler={sinir.sureler.map((x) => [x, `${x} sn`] as const)} />
                : <Kaydirici ad="Süre" deger={elleSure} min={sinir.sureler[0]} max={sinir.sureler[sinir.sureler.length - 1]} adim={1}
                    onDegis={(v) => setElleSure(sinir.sureler.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a)))} yaz={(n) => `${n} sn`} />)}
              {kisaKaliyor && <p className="flex items-center gap-1.5 text-[12px] text-amber-200"><AlertTriangle className="h-3.5 w-3.5" />Konuşma {Math.round(konusma)} sn; {elleSure} sn&apos;de sonu kesilir.</p>}
            </div>
          </MenuKart>
          {elevenBagli && !sesModu && (
            <MenuKart baslik="Ses kaydı"><div className="p-3"><AnahtarSatir ad="Ayrıca stüdyo ses kaydı" alt="Seçili sesle ayrı temiz kayıt da üretilir" acik={eleven} onDegis={() => setEleven((v) => !v)} /></div></MenuKart>
          )}
        </div>
      </KCip>
      <div className="flex h-12 shrink-0 items-center gap-0.5 rounded-full bg-white/[0.08] pl-1.5 pr-1 text-[13.5px] text-metin max-sm:col-span-2">
        <span className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.1] text-white/85"><Layers className="h-4 w-4" /></span>
        <span className="flex flex-col items-start pl-0.5 leading-tight max-sm:flex-1"><span className="text-[11px] text-white/55">Adet</span><span className="whitespace-nowrap font-medium tabular-nums">{adet}</span></span>
        <button onClick={() => setAdet(Math.max(1, adet - 1))} disabled={adet <= 1} aria-label="Azalt" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition hover:bg-white/[0.1] hover:text-metin active:scale-90 disabled:opacity-30"><Minus className="h-3.5 w-3.5" /></button>
        <button onClick={() => setAdet(Math.min(4, adet + 1))} disabled={adet >= 4} aria-label="Artır" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition hover:bg-white/[0.1] hover:text-metin active:scale-90 disabled:opacity-30"><Plus className="h-3.5 w-3.5" /></button>
      </div>
    </>
  );

  // Uyarı hapı: kullanıcı bir şey yazdıysa ve eksik varsa onu söyler; yoksa demo durumunu bir kez gösterir.
  const durumHap = (metin.trim() || sesDosya) && engel && !sigmiyor ? (
    <Tooltip side="top" label={engel}>
      <span className="flex h-8 max-w-[360px] items-center gap-1.5 rounded-full bg-amber-300/[0.08] px-3 text-[12px] text-amber-200/90 ring-1 ring-inset ring-amber-300/20 max-sm:hidden"><AlertTriangle className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{engel}</span></span>
    </Tooltip>
  ) : null;

  const kaynakSecici = (
    <div role="radiogroup" aria-label="Ses kaynağı" className="cam-istemci pointer-events-auto isolate mb-2 inline-grid grid-cols-3 gap-0.5 self-start rounded-full p-1 max-sm:grid max-sm:w-full">
      {KAYNAKLAR.map(([id, ad, I]) => (
        <button key={id} role="radio" aria-checked={kaynak === id} onClick={() => { setKaynak(id); if (id !== "kayit") kayitBitir(); }}
          className={cn("relative flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[13px] font-medium transition-colors max-sm:px-1 max-sm:text-[12.5px]", kaynak === id ? "text-black" : "text-metin-2 hover:text-metin")}>
          {kaynak === id && <motion.span layoutId="sp-kaynak" transition={{ type: "spring", stiffness: 480, damping: 36 }} className="absolute inset-0 -z-10 rounded-full bg-white" />}
          <I className="h-3.5 w-3.5" />{ad}
        </button>
      ))}
    </div>
  );
  const komut = (
    <div className="pointer-events-auto flex w-full flex-col">
    {kaynakSecici}
    <div className="cam-istemci relative w-full rounded-[26px] p-3">
      {(durumHap || metinAraclari) && (
        <div className="mb-1 flex items-center gap-2 px-0.5 max-sm:flex-wrap">
          {durumHap}
          <span className="flex-1" />
          {metinAraclari}
        </div>
      )}
      <div className="mt-1 flex gap-3 max-sm:gap-2.5">
        {avatarCip}
        <div className="min-w-0 flex-1">{girdi}</div>
      </div>
      <AnimatePresence initial={false}>
        {sigmiyor && (
          <motion.div key="sigmiyor" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-2 flex items-center gap-2 rounded-[14px] bg-rose-500/[0.08] px-3 py-2 text-[12.5px] text-rose-100 ring-1 ring-inset ring-rose-400/25">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-300" /><span className="min-w-0 flex-1">Konuşma {Math.round(konusma)} sn; {model} en çok {enUzun} sn. Metni kısalt{uzunModel ? " ya da uzun modele geç." : "."}</span>
              {uzunModel && <button onClick={() => setModel(uzunModel.deger)} className="shrink-0 rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-black">{uzunModel.ad}</button>}
            </div>
          </motion.div>
        )}
        {kendiPortre && (
          <motion.div key="riza" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div onClick={() => setRiza((v) => !v)} onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setRiza((v) => !v); } }} role="checkbox" aria-checked={riza} tabIndex={0}
              className={cn("mt-2 flex w-full cursor-pointer items-start gap-2.5 rounded-[14px] px-3 py-2.5 text-left outline-none ring-1 ring-inset transition-colors focus-visible:ring-white/50", riza ? "bg-white/[0.04] ring-white/60" : "bg-amber-300/[0.06] ring-amber-300/25")}>
              <span className={cn("mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] ring-1 ring-inset transition-colors", riza ? "bg-white text-black ring-white" : "ring-white/30")}>{riza && <Check className="h-3 w-3" strokeWidth={3} />}</span>
              <span className="text-[12.5px] leading-snug text-metin-2">
                <Link href="/kimlik-kosullari" target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="font-semibold text-metin underline decoration-white/30 underline-offset-[3px] transition-colors hover:decoration-white">Kimlik ve Benzerlik Kullanım Koşulları</Link>&apos;nı okudum, onaylıyorum ve kabul ediyorum; fotoğraftaki kişi benim ya da açık rızası var.
                {cozunurluk && <span className={cn("ml-1", kalite >= 720 ? "text-metin-3" : "text-amber-200")}>Fotoğraf {cozunurluk.w}×{cozunurluk.h}{kalite < 720 ? ", düşük çözünürlük" : ""}.</span>}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-2.5 flex items-center gap-2 border-t border-white/[0.08] pt-2.5 max-sm:flex-col max-sm:items-stretch">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] max-sm:grid max-sm:grid-cols-2 max-sm:overflow-visible [&>*]:shrink-0 max-sm:[&>*>button]:w-full max-sm:[&>*>button>span:nth-child(2)]:min-w-0 max-sm:[&>*>button>span:nth-child(2)]:flex-1 max-sm:[&_.whitespace-nowrap]:block max-sm:[&_.whitespace-nowrap]:max-w-full max-sm:[&_.whitespace-nowrap]:truncate">{secenekler}</div>
        <button onClick={uret} disabled={mesgul} title={engel ?? "Ctrl+Enter"} className="group flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 text-[14.5px] font-semibold text-black transition active:scale-95 max-sm:w-full">
          {mesgul ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Konuştur
          {!demo && <span className="flex items-center gap-0.5 rounded-full bg-black/10 px-2 py-0.5 text-[12px] tabular-nums"><KrediYildiz className="h-3 w-3" />{kredi}</span>}
        </button>
      </div>
    </div>
    </div>
  );

  /* ═════════ BAŞLIK KARTI ═════════ */
  const ust = (
    <div className="flex min-h-[64px] items-center gap-3 rounded-[22px] bg-[#121315] px-3 py-2.5 ring-1 ring-inset ring-white/[0.07] sm:px-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.07] text-white"><Mic className="h-5 w-5" /></span>
      <span className="min-w-0 max-sm:hidden"><span className="block truncate text-[15.5px] font-semibold tracking-[-0.01em] text-white">Konuştur stüdyosu</span><span className="block truncate text-[12.5px] text-white/50">Bir yüz, bir senaryo: dudak senkronlu konuşan video</span></span>
      <span className="flex-1" />
      <div role="tablist" className="isolate flex gap-0.5 rounded-full p-[3px] ring-1 ring-inset ring-white/[0.08] max-sm:w-full" style={{ background: "rgba(255,255,255,0.04)" }}>
        {([["studyo", "Stüdyo", Sparkles, 0], ["avatar", "Avatarlar", ScanFace, AVATARLAR.length + karakterler.length], ["sonuc", "Videolarım", Film, sonuclar.length]] as const).map(([id, ad, I, n]) => (
          <button key={id} role="tab" aria-selected={gorunum === id} onClick={() => setGorunum(id)} className={cn("relative flex h-9 items-center justify-center gap-1.5 rounded-full px-4 text-[13.5px] font-medium transition-colors max-sm:flex-1 max-sm:px-2 max-sm:text-[12.5px]", gorunum === id ? "text-black" : "text-metin-2 hover:text-metin")}>
            {gorunum === id && <motion.span layoutId="sp-ust" transition={{ type: "spring", stiffness: 480, damping: 36 }} className="absolute inset-0 -z-10 rounded-full bg-white" />}
            <I className="h-4 w-4 max-sm:hidden" />{ad}
            {id === "sonuc" && calisan > 0 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : n > 0 && <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", gorunum === id ? "bg-black/10" : "bg-white/[0.08]")}>{n}</span>}
          </button>
        ))}
      </div>
    </div>
  );

  /* ═════════ STÜDYO: hero + kartlar ═════════ */
  const hizli = AVATARLAR.slice(0, 7);
  const hero = (
    <section className="relative isolate overflow-hidden rounded-[28px] bg-[#0b0c0e] ring-1 ring-inset ring-white/[0.08] lg:min-h-[480px]">
      <AnimatePresence initial={false}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <motion.img key={`bg-${A.kapak || portre.url}`} src={A.kapak || portre.url} alt="" aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 0.9 }} exit={{ opacity: 0 }} transition={{ duration: 1, ease: EASE }}
          className="absolute inset-0 -z-10 h-full w-full scale-110 object-cover object-[50%_25%] blur-[26px] saturate-[1.15]" />
      </AnimatePresence>
      <span aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#0b0c0e_0%,rgba(11,12,14,0.9)_32%,rgba(11,12,14,0.5)_65%,rgba(11,12,14,0.35)_100%)] max-lg:bg-[linear-gradient(180deg,rgba(11,12,14,0.55)_0%,rgba(11,12,14,0.85)_55%,#0b0c0e_100%)]" />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 px-5 py-7 sm:px-10 lg:min-h-[480px] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12 lg:py-10">
        <div className="min-w-0">
          <h2 className="text-[40px] font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-[58px]">Bir yüz seç.<br /><span className="hero-isilti">Konuşsun.</span></h2>
          <p className="mt-4 max-w-[460px] text-[15.5px] leading-relaxed text-white/70">Hazır bir avatar seç ya da kendi fotoğrafını yükle, ne söyleyeceğini yaz. Ses, ifade ve kamerayla dudak senkronlu video kurulur.</p>
          <ol className="mt-6 flex flex-wrap gap-2">
            {([["Avatarını seç", ScanFace], ["Senaryonu yaz", Type], ["Konuşan video", Film]] as const).map(([a, I], i) => (
              <motion.li key={a} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.06 }} className="flex h-9 items-center gap-2 rounded-full bg-white/[0.07] pl-1 pr-3.5 text-[12.5px] text-white/85 ring-1 ring-inset ring-white/[0.1] backdrop-blur-xl">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.1] text-[12px] font-semibold tabular-nums text-white">{i + 1}</span><I className="h-3.5 w-3.5 text-white/60" />{a}
              </motion.li>
            ))}
          </ol>
          <div className="mt-7 flex flex-wrap items-center gap-2">
            {hizli.map((a, i) => {
              const sec = portre.url === a.gorsel;
              return (
                <motion.button key={a.id} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + i * 0.04, type: "spring", stiffness: 380, damping: 26 }} whileHover={{ y: -2 }} whileTap={{ scale: 0.92 }}
                  onClick={() => portreKoy({ url: a.gorsel, ad: a.ad, hazir: true, cinsiyet: a.cinsiyet }, true)} title={a.ad} aria-pressed={sec}
                  className={cn("relative h-12 w-12 overflow-hidden rounded-full ring-2 transition-[box-shadow]", sec ? "ring-white" : "ring-white/15 hover:ring-white/40")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.gorsel} alt="" className="h-full w-full object-cover object-top" />
                </motion.button>
              );
            })}
            <button onClick={() => setGorunum("avatar")} className="flex h-12 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] font-medium text-white ring-1 ring-inset ring-white/[0.12] backdrop-blur-xl transition hover:bg-white/[0.14] active:scale-95">Tümü<span className="tabular-nums text-white/55">{AVATARLAR.length + karakterler.length}</span></button>
          </div>
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE, delay: 0.1 }} className="cam-istemci relative mx-auto rounded-[24px] p-3 max-lg:w-fit">
          {sahne}
        </motion.div>
      </div>
    </section>
  );

  /* Son video: en yenisi büyük oynar, yanında bilgisi ve eylemleri; öncekiler altta küçük kareler */
  const son = sonuclar.find((u) => u.tur === "video");
  const sonBitti = son?.durum === "tamam";
  const sonKapak = son ? son.meta?.gorselUrl ?? saltUrl(son.gorselUrl) : undefined;
  /** Son videonun senaryosunu ve ayarlarını alır, avatarı değiştirip hemen yeniden üretir. */
  const baskaAvatar = (a: (typeof AVATARLAR)[number]) => {
    if (!son) return;
    ayarlariKullan(son, true);
    portreKoy({ url: a.gorsel, ad: a.ad, hazir: true, cinsiyet: a.cinsiyet }, true);
    setTimeout(() => uretRef.current(), 80);
  };
  const videolarKart = son && (
    <Kart ikon={Film} baslik="Son video" alt={calisan ? `${calisan} video üretiliyor` : "En son ürettiğin konuşan video burada oynar"}
      sag={<span className="flex items-center gap-2">{sonuclar.length > 1 && <button onClick={() => setGorunum("sonuc")} className="flex h-8 items-center rounded-full bg-white/[0.07] px-3 text-[12.5px] font-medium text-metin-2 transition hover:bg-white/[0.12] hover:text-metin">Tümü</button>}<SayiRozet n={sonuclar.length} /></span>}>
      <div className="grid gap-4 p-3.5 sm:grid-cols-[auto_minmax(0,1fr)] sm:p-4">
        <button onClick={() => sonBitti && setAcik(son)} className="group relative mx-auto block aspect-[9/16] h-[340px] overflow-hidden rounded-[18px] bg-black ring-1 ring-inset ring-white/[0.1] max-sm:h-[300px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {sonKapak && <img src={sonKapak} alt="" className={cn("absolute inset-0 h-full w-full object-cover object-top", !sonBitti && "opacity-40 blur-[2px]")} />}
          {sonBitti && son.videoUrl && <video key={son.videoUrl} src={son.videoUrl} poster={sonKapak} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />}
          {sonBitti && !son.videoUrl && son.meta?.hamIstem && (
            <span className="absolute inset-x-2.5 bottom-2.5 flex items-end gap-2 rounded-[12px] bg-black/55 p-2 text-left backdrop-blur-xl">
              <Dalga ad={son.id} renk="#ffffff" adet={7} yukseklik={18} canli />
              <span className="line-clamp-2 min-w-0 flex-1 text-[12px] font-medium leading-snug text-white">{temizSoz(son.meta.hamIstem)}</span>
            </span>
          )}
          {!sonBitti && (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-[13px] font-medium text-white">
              {son.durum === "hata" ? <AlertTriangle className="h-5 w-5 text-rose-300" /> : <Loader2 className="h-5 w-5 animate-spin" />}
              {son.durum === "hata" ? "Başarısız" : `%${Math.round(son.ilerleme ?? 0)}`}
              {son.durum !== "hata" && <span className="h-1 w-28 overflow-hidden rounded-full bg-white/15"><motion.span className="block h-full rounded-full bg-white" animate={{ width: `${Math.max(3, son.ilerleme ?? 0)}%` }} transition={{ duration: 0.4 }} /></span>}
            </span>
          )}
          {sonBitti && <span className="absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-xl transition group-hover:opacity-100"><Play className="h-4 w-4 fill-current" /></span>}
        </button>
        <div className="flex min-w-0 flex-col gap-3">
          <MenuKart baslik={son.baslik.split(" · ")[0]} sag={<span className="flex items-center gap-1.5"><span className="flex items-center gap-1.5 rounded-full bg-white/[0.07] py-0.5 pl-0.5 pr-2.5 text-[12px] text-metin-2"><MarkaKare ad={son.model} boyut={20} />{son.model}</span>{son.meta?.sure && <span className="rounded-full bg-white/[0.07] px-2.5 py-0.5 text-[12px] tabular-nums text-metin-2 max-sm:hidden">{son.meta.sure.replace("sn", " sn")}</span>}{son.meta?.oran && <span className="rounded-full bg-white/[0.07] px-2.5 py-0.5 text-[12px] tabular-nums text-metin-2 max-sm:hidden">{son.meta.oran}</span>}</span>}>
            <div className="flex gap-3 p-4">
              <span className="w-[3px] shrink-0 self-stretch rounded-full bg-white/25" />
              <p className="line-clamp-4 min-w-0 text-[17px] font-medium leading-snug tracking-[-0.01em] text-metin">{son.meta?.hamIstem ? temizSoz(son.meta.hamIstem) : son.baslik}</p>
            </div>
            {son.durum === "hata" && <p className="px-4 pb-3 text-[13px] text-rose-200/90">{son.hata ?? "Video üretilemedi."}</p>}
            <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] px-3 py-2.5">
              {sonBitti && <button onClick={() => setAcik(son)} className="flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition active:scale-95"><Play className="h-3.5 w-3.5 fill-current" />Büyük izle</button>}
              <button onClick={() => ayarlariKullan(son)} className="flex h-10 items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[13.5px] font-medium text-metin transition hover:bg-white/[0.12] active:scale-95"><RotateCcw className="h-3.5 w-3.5" />Düzenleyip yeniden</button>
              <span className="flex-1" />
              {son.olusturma && <span className="text-[12px] text-metin-3 max-sm:hidden">{new Date(son.olusturma).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>}
            </div>
          </MenuKart>
          {sonBitti && (
            <MenuKart baslik="Aynı senaryo, başka yüz" sag={<span className="text-[12px] text-metin-3 max-sm:hidden">Tıkla, aynı ayarlarla üretilsin</span>}>
              <div className="grid grid-cols-4 gap-2 p-2.5 sm:grid-cols-8">
                {AVATARLAR.filter((a) => a.gorsel !== son.meta?.gorselUrl).slice(0, 8).map((a, i) => (
                  <motion.button key={a.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} onClick={() => baskaAvatar(a)} disabled={mesgul} title={`${a.ad} ile üret`}
                    className="group relative aspect-[3/4] overflow-hidden rounded-[12px] bg-black ring-1 ring-inset ring-white/[0.08] transition hover:-translate-y-0.5 hover:ring-white/40 disabled:opacity-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.gorsel} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-1 pb-1.5 pt-5 text-center text-[12px] font-medium text-white transition-opacity group-hover:opacity-0">{a.ad}</span>
                    <span className="absolute inset-x-1.5 bottom-1.5 flex h-7 translate-y-[140%] items-center justify-center gap-1 rounded-full bg-white text-[12px] font-semibold text-black transition-transform duration-300 group-hover:translate-y-0 [@media(hover:none)]:hidden"><Sparkles className="h-3 w-3" />Üret</span>
                  </motion.button>
                ))}
              </div>
            </MenuKart>
          )}
          {sonuclar.length > 1 && (
            <MenuKart baslik="Öncekiler">
              <div className="p-2.5 flex gap-2 overflow-x-auto [scrollbar-width:none]">
                {sonuclar.filter((u) => u.id !== son.id).slice(0, 10).map((u) => {
                  const kp = u.meta?.gorselUrl ?? saltUrl(u.gorselUrl);
                  return (
                    <button key={u.id} onClick={() => setAcik(u)} title={u.baslik} className="relative aspect-[3/4] h-[96px] shrink-0 overflow-hidden rounded-[10px] bg-black ring-1 ring-inset ring-white/[0.08] transition hover:-translate-y-0.5 hover:ring-white/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {kp && u.tur !== "ses" && <img src={kp} alt="" className={cn("absolute inset-0 h-full w-full object-cover object-top", u.durum !== "tamam" && "opacity-40")} />}
                      {u.tur === "ses" && <AudioLines className="absolute inset-0 m-auto h-4 w-4 text-white" />}
                      {u.durum === "isleniyor" || u.durum === "kuyrukta" ? <Loader2 className="absolute inset-0 m-auto h-4 w-4 animate-spin text-white" /> : u.durum === "hata" ? <AlertTriangle className="absolute inset-0 m-auto h-4 w-4 text-rose-300" /> : null}
                    </button>
                  );
                })}
              </div>
            </MenuKart>
          )}
        </div>
      </div>
    </Kart>
  );
  const senaryoKart = (
    <Kart ikon={Wand2} baslik="Bir senaryoyla başla" alt="Tıkla, kutuya yazılsın; köşeli parantezler ifade yönergesidir" sag={<SayiRozet n={SENARYO_SABLON.length} />}>
      <div className="grid grid-cols-2 gap-3 p-3.5 sm:grid-cols-3 lg:grid-cols-5">
        {SENARYO_SABLON.map((x, i) => (
          <motion.button key={x.ad} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setMetin(x.metin); setKaynak("metin"); requestAnimationFrame(() => metinRef.current?.focus()); }}
            className={cn("group flex flex-col overflow-hidden rounded-[16px] text-left ring-inset transition-[box-shadow]", metin === x.metin ? "ring-2 ring-white" : "ring-1 ring-white/[0.07] hover:ring-white/[0.2]")} style={{ background: "rgba(255,255,255,0.03)" }}>
            <span className="relative block aspect-[4/3] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={x.kapak} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </span>
            <span className="block p-3">
              <span className="block text-[14px] font-semibold text-metin">{x.ad}</span>
              <span className="mt-1 line-clamp-2 block text-[12.5px] leading-snug text-metin-3 max-sm:line-clamp-1">{temizSoz(x.metin)}</span>
            </span>
          </motion.button>
        ))}
      </div>
    </Kart>
  );
  const studyoGovde = <div className="space-y-4">{videolarKart && <div ref={sonRef} className="scroll-mt-4">{videolarKart}</div>}{hero}{senaryoKart}</div>;

  const govde = gorunum === "studyo" ? studyoGovde
    : gorunum === "avatar" ? <AvatarGaleri secili={portre.url} yukleniyor={yukleniyor} onYukle={() => dosyaRef.current?.click()} onDosya={(d) => void fotoYukle(d)} onSec={(p) => portreKoy(p)} karakterler={karakterler} />
    : <SonucPanel sonuclar={sonuclar} onAc={setAcik} onKullan={ayarlariKullan} onYeni={() => setGorunum("studyo")} onAvatar={() => setGorunum("avatar")} onSablon={(m) => { setMetin(m); setKaynak("metin"); setGorunum("studyo"); }} />;

  const modallar = (
    <>
      <input ref={dosyaRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { const d = e.target.files?.[0]; e.target.value = ""; if (d) void fotoYukle(d); }} />
      <AnimatePresence>{acik && <UretimGoruntuleyici key="d" u={sonuclar.find((x) => x.id === acik.id) ?? acik} liste={sonuclar.filter((x) => x.durum === "tamam")} onSec={(id) => { const u = sonuclar.find((x) => x.id === id); if (u) setAcik(u); }} onKapat={() => setAcik(null)} />}</AnimatePresence>
      <AnimatePresence>{klon && <KlonModal gercek={sag ? elevenBagli : null} onKapat={() => setKlon(false)} onKlonlandi={(ad) => { const o = useOzelSesler.getState().sesler.find((x) => x.ad === ad); if (o) setSes(`ozel:${o.id}`); }} />}</AnimatePresence>
    </>
  );
  const gecis = <AnimatePresence mode="wait" initial={false}><motion.div key={gorunum} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>{govde}</motion.div></AnimatePresence>;

  if (!masaustu) {
    return (
      <MotionConfig reducedMotion="user">
        <div className="min-h-[calc(100dvh-var(--ust-nav))] space-y-3 overflow-x-hidden bg-zemin px-3 pb-10 pt-3">
          {ust}
          {gorunum === "studyo" && komut}
          {gecis}
          {modallar}
        </div>
      </MotionConfig>
    );
  }
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex h-[calc(100dvh-var(--ust-nav))] flex-col overflow-hidden bg-zemin">
        <div className="mx-auto w-full max-w-[1440px] shrink-0 px-6 pt-4">{ust}</div>
        <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
          <div className={cn("mx-auto max-w-[1440px] px-6 pt-4", gorunum === "studyo" ? "pb-[300px]" : "pb-10")}>{gecis}</div>
        </div>
        <AnimatePresence>
          {gorunum === "studyo" && (
            <motion.div key="komut" initial={{ y: 28, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 28, opacity: 0 }} transition={{ type: "spring", stiffness: 420, damping: 34 }} className="pointer-events-none absolute inset-x-0 bottom-0 z-40">
              <div className="flex justify-center px-6 pb-5 pt-6"><div className="w-full max-w-[1240px]">{komut}</div></div>
            </motion.div>
          )}
        </AnimatePresence>
        {modallar}
      </div>
    </MotionConfig>
  );
}

/* ─────────── Parçalar ─────────── */

const EASE = [0.22, 1, 0.36, 1] as const;

/** Başlık şeritli kart: kartsız yüzen başlık yok. */
function Kart({ ikon: I, baslik, alt, sag, children }: { ikon: typeof Film; baslik: React.ReactNode; alt?: React.ReactNode; sag?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[24px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-5 py-3.5 max-sm:px-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07]"><I className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1 leading-tight"><span className="block text-[15px] font-semibold text-metin">{baslik}</span>{alt && <span className="block text-[12.5px] text-metin-3">{alt}</span>}</span>
        {sag}
      </div>
      {children}
    </section>
  );
}
/** Açılır menü içindeki başlık şeritli küçük kart. */
function MenuKart({ baslik, sag, children }: { baslik: string; sag?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex min-h-[38px] items-center gap-2 border-b border-white/[0.06] px-3 py-2"><span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-metin">{baslik}</span>{sag}</div>
      {children}
    </div>
  );
}
const SayiRozet = ({ n }: { n: number }) => <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[12px] font-medium tabular-nums text-metin-2">{n}</span>;

function SonucKart({ u, i, onAc, onKullan }: { u: Uretim; i: number; onAc: () => void; onKullan?: () => void }) {
  const bitti = u.durum === "tamam", ses = u.tur === "ses";
  const kapak = u.meta?.gorselUrl ?? saltUrl(u.gorselUrl);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }} className="group/k relative min-w-0">
      <motion.button whileHover={{ y: -3 }} onClick={onAc} className="group relative block aspect-[3/4] w-full overflow-hidden rounded-[16px] bg-black text-left ring-1 ring-inset ring-white/[0.08] hover:ring-white/25">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {kapak && !ses && <img src={kapak} alt="" className={cn("absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105", !bitti && "opacity-40 blur-[2px]")} />}
        {ses && <span className="absolute inset-0 flex items-center justify-center"><Dalga ad={u.id} renk="#ffffff" adet={12} yukseklik={40} /></span>}
        {bitti && u.tur === "video" && u.videoUrl && <video src={u.videoUrl} muted loop playsInline preload="none" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity group-hover:opacity-100" onMouseEnter={(e) => void e.currentTarget.play().catch(() => {})} onMouseLeave={(e) => e.currentTarget.pause()} />}
        {!bitti && <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-[12.5px] font-medium text-white">{u.durum === "hata" ? <AlertTriangle className="h-5 w-5 text-rose-300" /> : <Loader2 className="h-5 w-5 animate-spin" />}{u.durum === "hata" ? "Başarısız" : `%${Math.round(u.ilerleme ?? 0)}`}</span>}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 backdrop-blur">{ses ? <AudioLines className="h-3.5 w-3.5 text-white" /> : <Film className="h-3.5 w-3.5 text-white" />}</span>
        
        <span className="absolute inset-x-2.5 bottom-2 leading-tight">
          <span className="block truncate text-[11.5px] font-medium text-white/65">{u.model}{u.meta?.sure ? ` · ${u.meta.sure.replace("sn", " sn")}` : ""}</span>
          <span className="mt-0.5 line-clamp-2 block text-[12.5px] font-semibold text-white">{u.baslik.split(" · ").slice(1).join(" · ") || u.baslik}</span>
        </span>
        <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">{u.baslik.split(" · ")[0]}</span>
      </motion.button>
      {onKullan && u.tur === "video" && (
        <Tooltip side="top" label="Bu ayarlarla yeniden">
          <button onClick={onKullan} aria-label="Bu ayarlarla yeniden" className="absolute right-2 top-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur transition hover:bg-black/75 group-hover/k:opacity-100 [@media(hover:none)]:opacity-100"><RotateCcw className="h-3.5 w-3.5" /></button>
        </Tooltip>
      )}
    </motion.div>
  );
}

type AvFiltre = "tumu" | "Kadın" | "Erkek" | "is" | "gundelik";
function AvatarGaleri({ secili, yukleniyor, onYukle, onDosya, onSec, karakterler }: {
  secili: string; yukleniyor: boolean; onYukle: () => void; onDosya: (d: File) => void; onSec: (p: Portre) => void; karakterler: ReturnType<typeof useElements.getState>["elementler"];
}) {
  const [f, setF] = useState<AvFiltre>("tumu");
  const [surukle, setSurukle] = useState(false);
  const liste = AVATARLAR.filter((a) => f === "tumu" || a.cinsiyet === f || a.tarz === f);
  const uretimGorsel = useProjeler((s) => s.uretimler).filter((u) => u.durum === "tamam" && u.tur === "gorsel" && saltUrl(u.gorselUrl)).slice(0, 12);
  const kart = (key: string, url: string, ad: string, p: Portre, i: number, ust?: React.ReactNode, kapak?: React.ReactNode) => (
    <motion.button key={key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 18) * 0.02 }} onClick={() => onSec(p)} aria-pressed={secili === url} className="group min-w-0 text-left">
      <span className={cn("relative block aspect-[3/4] overflow-hidden rounded-[16px] bg-black transition duration-300 group-hover:-translate-y-0.5", secili === url ? "outline outline-2 -outline-offset-2 outline-white" : "outline outline-1 -outline-offset-1 outline-white/[0.08] group-hover:outline-white/30")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {kapak ?? <img src={url} alt="" loading="lazy" className="absolute inset-0 -z-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />}
        {ust}
        <span className="absolute inset-x-0 bottom-0 flex h-10 translate-y-full items-center justify-center bg-white text-[13px] font-semibold text-black transition-transform duration-300 group-hover:translate-y-0 [@media(hover:none)]:hidden">Konuştur</span>
      </span>
      <span className={cn("mt-1.5 block truncate text-[13px] font-medium", secili === url ? "text-metin" : "text-metin-2")}>{ad}</span>
    </motion.button>
  );
  const KURAL: [boolean, string, string, React.ComponentType<{ className?: string }>][] = [
    [true, "Yüz önden ve net", "/gercek/paz/av-emma.webp", ScanFace],
    [true, "Omuz hizası, iyi ışık", "/gercek/paz/av-malik.webp", Sun],
    [false, "Uzak ya da tam boy", "/gercek/paz/av-felix.webp", Maximize],
    [false, "Kalabalık ya da karanlık", "/gercek/paz/ortam-sokak.webp", Users],
  ];
  return (
    <div className="space-y-4">
      <div onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setSurukle(true); } }} onDragLeave={() => setSurukle(false)} onDrop={(e) => { e.preventDefault(); setSurukle(false); const d = e.dataTransfer.files[0]; if (d) onDosya(d); }}
        className={cn("rounded-[24px] transition-shadow", surukle && "ring-2 ring-white")}>
        <Kart ikon={Upload} baslik={surukle ? "Bırak, yüklensin" : "Kendi fotoğrafın"} alt={<><span className="max-sm:hidden">JPG, PNG ya da WebP, en az 720 px; sürükleyip bırakabilirsin</span><span className="sm:hidden">JPG, PNG, WebP; en az 720 px</span></>}
          sag={<button onClick={onYukle} disabled={yukleniyor} className="flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition active:scale-95 disabled:opacity-70">{yukleniyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}<span className="max-sm:hidden">Fotoğraf yükle</span><span className="sm:hidden">Yükle</span></button>}>
          <div className="grid grid-cols-2 gap-3 p-3.5 sm:grid-cols-4">
            {KURAL.map(([iyi, ad, g, I]) => (
              <div key={ad} className="flex min-w-0 items-center gap-3 rounded-[16px] p-2 ring-1 ring-inset ring-white/[0.07] max-sm:flex-col max-sm:items-stretch max-sm:gap-2" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[12px] max-sm:aspect-[4/3] max-sm:h-auto max-sm:w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g} alt="" className={cn("h-full w-full object-cover object-top", !iyi && "grayscale-[50%]")} />
                  <span className={cn("absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full", iyi ? "bg-emerald-400 text-[#052e1b]" : "bg-rose-500 text-white")}>{iyi ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" strokeWidth={3} />}</span>
                </div>
                <span className="min-w-0 max-sm:px-1 max-sm:pb-1"><span className="flex items-center gap-1.5 text-[13px] font-medium leading-tight text-metin"><I className="h-3.5 w-3.5 shrink-0 text-metin-3" />{iyi ? "Böyle" : "Böyle değil"}</span><span className="mt-0.5 block text-[12.5px] leading-snug text-metin-2">{ad}</span></span>
              </div>
            ))}
          </div>
        </Kart>
      </div>
      {karakterler.length > 0 && (
        <Kart ikon={Users} baslik="Karakterlerin" alt="Elementlerden; @adıyla istemde de kullanılır" sag={<SayiRozet n={karakterler.length} />}>
          <div className="grid grid-cols-3 gap-3 p-3.5 sm:grid-cols-4 lg:grid-cols-6">
            {karakterler.map((k, i) => kart(k.id, k.gorseller[0], `@${k.ad}`, { url: k.gorseller[0], ad: k.ad, hazir: !!k.ornek, elementAd: k.ad }, i, undefined, <ElementKapak e={k} className="absolute inset-0 -z-0 h-full w-full transition-transform duration-500 group-hover:scale-105" />))}
          </div>
        </Kart>
      )}
      <Kart ikon={ScanFace} baslik="Hazır avatarlar" alt="İzin onayı gerekmez; tıkla, stüdyoda seçili gelsin"
        sag={<div className="w-[360px] max-w-full max-sm:w-full"><Segment etiket="Filtre" deger={f} onDegis={setF} secenekler={[["tumu", "Tümü"], ["Kadın", "Kadın"], ["Erkek", "Erkek"], ["is", "İş"], ["gundelik", "Günlük"]]} /></div>}>
        <div className="grid grid-cols-3 gap-3 p-3.5 sm:grid-cols-4 lg:grid-cols-6">
          {liste.map((a, i) => kart(a.id, a.gorsel, a.ad, { url: a.gorsel, ad: a.ad, hazir: true, cinsiyet: a.cinsiyet }, i, a.cekim === "boy" ? <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white/90 backdrop-blur">Tam boy</span> : undefined))}
        </div>
      </Kart>
      {uretimGorsel.length > 0 && (
        <Kart ikon={ImageIcon} baslik="Üretimlerinden" alt="Ürettiğin görseller; kişi sensen ya da iznin varsa kullan" sag={<SayiRozet n={uretimGorsel.length} />}>
          <div className="grid grid-cols-3 gap-3 p-3.5 sm:grid-cols-4 lg:grid-cols-6">
            {uretimGorsel.map((u, i) => kart(u.id, saltUrl(u.gorselUrl)!, u.baslik.slice(0, 18), { url: saltUrl(u.gorselUrl)!, ad: u.baslik.slice(0, 20), hazir: false }, i,
              undefined))}
          </div>
        </Kart>
      )}
    </div>
  );
}

function SonucPanel({ sonuclar, onAc, onKullan, onYeni, onAvatar, onSablon }: { sonuclar: Uretim[]; onAc: (u: Uretim) => void; onKullan: (u: Uretim) => void; onYeni: () => void; onAvatar: () => void; onSablon: (m: string) => void }) {
  const [f, setF] = useState<"tumu" | "video" | "ses">("tumu");
  if (!sonuclar.length) return (
    <Kart ikon={Film} baslik="Henüz konuşan video yok" alt="Bir senaryo seç ya da stüdyoda kendi metnini yaz"
      sag={<span className="flex gap-2"><button onClick={onAvatar} className="flex h-10 items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[13.5px] font-medium text-metin transition hover:bg-white/[0.12] active:scale-95"><ScanFace className="h-4 w-4" /><span className="max-sm:hidden">Avatar seç</span></button><button onClick={onYeni} className="flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition active:scale-95"><Plus className="h-4 w-4" />Video üret</button></span>}>
      <div className="grid grid-cols-2 gap-3 p-3.5 sm:grid-cols-3 lg:grid-cols-5">
        {SENARYO_SABLON.map((x, i) => (
          <motion.button key={x.ad} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} whileHover={{ y: -3 }} onClick={() => onSablon(x.metin)} className="group flex flex-col overflow-hidden rounded-[16px] bg-white/[0.03] text-left ring-1 ring-inset ring-white/[0.07] transition-colors hover:ring-white/[0.2]">
            <span className="relative block aspect-[4/3] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={x.kapak} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </span>
            <span className="block p-3">
              <span className="block text-[14px] font-semibold text-metin">{x.ad}</span>
              <span className="mt-1 line-clamp-2 block text-[12.5px] leading-snug text-metin-3 max-sm:line-clamp-1">{temizSoz(x.metin)}</span>
            </span>
          </motion.button>
        ))}
      </div>
    </Kart>
  );
  const liste = sonuclar.filter((u) => f === "tumu" || u.tur === f);
  return (
    <Kart ikon={Film} baslik="Videolarım" alt="Ürettiğin konuşan videolar ve ayrı ses kayıtları"
      sag={<div className="w-[320px] max-w-full max-sm:w-full"><Segment etiket="Filtre" deger={f} onDegis={setF} secenekler={[["tumu", `Tümü ${sonuclar.length}`], ["video", "Videolar"], ["ses", "Ses kayıtları"]]} /></div>}>
      {liste.length ? (
        <div className="grid grid-cols-2 gap-3 p-3.5 sm:grid-cols-3 lg:grid-cols-5">
          {liste.map((u, i) => <SonucKart key={u.id} u={u} i={i} onAc={() => onAc(u)} onKullan={() => onKullan(u)} />)}
        </div>
      ) : <p className="px-6 py-14 text-center text-[13.5px] text-metin-2">Bu filtrede kayıt yok.</p>}
    </Kart>
  );
}
