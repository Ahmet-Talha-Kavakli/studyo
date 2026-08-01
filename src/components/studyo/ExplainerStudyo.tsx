"use client";

import type { StudyoGomuluProps } from "@/components/studyo/tipler";

import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Pencil, Paperclip, Link2, X, ChevronDown, ChevronRight, Check, Play, Pause,
  Search, HelpCircle, Grid3x3, FolderClock, BookOpen, Heart, Download, Share2, MoreHorizontal,
  VolumeX, MessageCircle, Copy,
  Pin, Briefcase, AtSign as XIkon,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { onizlemeArka, saltUrl, cn, gorseliIndir } from "@/lib/utils";
import { uretimIndir } from "@/lib/gercekEylem";
import { uretimBaslat as uretimBaslatHam, uretimHataToast } from "@/lib/uretimMotoru";
import { useRouter } from "next/navigation";
import { useAktifProje } from "@/lib/useAktifProje";
import {
  MobilComposerKabuk, MobilIstemKutusu, MobilCip, MobilAltCip, MobilUretButonu, MobilSablonIzgarasi,
} from "@/components/panel/MobilComposer";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useSecim } from "@/store/useSecim";
import { Tooltip } from "@/components/ui/Tooltip";
import { UretimDetay } from "@/components/panel/UretimDetay";
import { UretimKarti, oranSayi } from "@/components/panel/UretimKarti";
import { SesSeciciModal } from "@/components/panel/SesSeciciModal";
import { YuklenenOnizleme } from "@/components/panel/YuklenenOnizleme";
import { SecimToolbar } from "@/components/panel/SecimToolbar";

/* ============================================================
   VAYRA EXPLAINER — Higgsfield /explainer BİREBİR (higg-explainer 10 ekran).
   AI açıklayıcı video üreticisi: konu yaz + sanat stili preseti seç + ses/süre/oran → video.
   Lime aksan (.sinema-kapsam). Sol panel (topic + Aspect/Duration/Voice + Üret) +
   Presetler/Geçmiş/Nasıl çalışır sekmeleri + 16:9 yatay preset ızgarası +
   Voice modalı + Duration dropdown + üretim lightbox + Geçmiş.
   ============================================================ */

const LIME = "var(--sn-lime)";

type Preset = { ad: string; kategori: string; tohum: string };

// Higgsfield Explainer preset adları BİREBİR Türkçeleştirilmiş (higg-explainer 01-03 ölçüldü).
const PRESETLER: Preset[] = [
  { ad: "Piksel Sanat", kategori: "soyut", tohum: "ex-pixelart" },
  { ad: "Kil Animasyon", kategori: "urun", tohum: "ex-claymotion" },
  { ad: "Karışık Medya", kategori: "sinematik", tohum: "ex-mixedmedia" },
  { ad: "3D Kağıt Katlama", kategori: "soyut", tohum: "ex-papercraft" },
  { ad: "2D İllüstratör", kategori: "portre", tohum: "ex-2dillustrator" },
  { ad: "Beyaz Tahta Karalama", kategori: "manzara", tohum: "ex-whiteboard" },
  { ad: "Düşük Poligon", kategori: "3d", tohum: "ex-lowpoly" },
  { ad: "3D Karışım", kategori: "sinematik", tohum: "ex-3dmix" },
  { ad: "İzometrik Düz Vektör", kategori: "3d", tohum: "ex-isometric" },
  { ad: "İğne Keçe", kategori: "urun", tohum: "ex-needlefelt" },
];

/** Her stil preseti için GERÇEK 10sn tanıtım videosu (fal Kling ile üretildi).
 * Tohum adı dosya adıyla birebir: public/gercek/explainer-video/<tohum>.mp4
 * Kartlarda SÜREKLİ döngüde otomatik oynar (Higgsfield birebir). */
function presetVideo(tohum: string): string {
  return `/gercek/explainer-video/${tohum}.mp4`;
}
/** Preset videosunun GERÇEK poster karesi (video yüklenene dek + saltUrl için).
 * Her tohum için videodan çıkarılan kare: public/gercek/explainer-video/<tohum>.webp */
function presetPoster(tohum: string): string {
  return `url("/gercek/explainer-video/${tohum}.webp") center/cover no-repeat`;
}

const ORANLAR = ["16:9", "9:16", "1:1"];
// Higgsfield Duration dropdown BİREBİR (higg-explainer 03): 20sn / 30sn / 1dk / 3dk / 5dk / 10dk / Manuel
const SURELER = [
  { ad: "20 saniye", sn: 20 }, { ad: "30 saniye", sn: 30 }, { ad: "1 dakika", sn: 60 },
  { ad: "3 dakika", sn: 180 }, { ad: "5 dakika", sn: 300 }, { ad: "10 dakika", sn: 600 },
];
// Higgsfield "SELECT OR ADD A VOICE" — 8 ses (renk + cinsiyet + LED-font ad)
const SESLER: { ad: string; cinsiyet: "Kadın" | "Erkek"; renk: string }[] = [
  { ad: "ROXIE", cinsiyet: "Kadın", renk: "linear-gradient(135deg,#4fe3d0,#2bb8b0)" },
  { ad: "ARTHUR", cinsiyet: "Erkek", renk: "linear-gradient(135deg,#f5b45a,#e07f2b)" },
  { ad: "CILLIAN", cinsiyet: "Erkek", renk: "linear-gradient(135deg,#ff9a6c,#f0563f)" },
  { ad: "BROOKS", cinsiyet: "Erkek", renk: "linear-gradient(135deg,#6cc8ff,#3a9be0)" },
  { ad: "TALLULAH", cinsiyet: "Kadın", renk: "linear-gradient(135deg,#7ee08a,#43b04a)" },
  { ad: "HANA", cinsiyet: "Kadın", renk: "linear-gradient(135deg,#5ce0c8,#2bb8a0)" },
  { ad: "GIDEON", cinsiyet: "Erkek", renk: "linear-gradient(135deg,#e0566c,#c13b52)" },
  { ad: "ROMAN", cinsiyet: "Erkek", renk: "linear-gradient(135deg,#9a7cff,#6c5cf0)" },
];

const SEKMELER = [
  { id: "presetler", ad: "Presetler", ik: Grid3x3 },
  { id: "gecmis", ad: "Geçmiş", ik: FolderClock },
  { id: "nasil", ad: "Nasıl çalışır", ik: BookOpen },
] as const;
type SekmeId = (typeof SEKMELER)[number]["id"];

/** createPortal yalnızca istemcide çalışır — SSR'da document yok. */
function usePortalHazir() {
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  return hazir;
}

// Süreye göre kredi (Higgsfield: 1dk ≈ ✦200, 7dk ≈ ✦1384) → yaklaşık 200/dk
function krediHesap(sn: number) { return Math.max(50, Math.round((sn / 60) * 200)); }
function sureEtiket(sn: number) {
  const m = Math.floor(sn / 60), s = sn % 60;
  return m > 0 ? (s > 0 ? `${m}dk ${s}sn` : `${m}dk`) : `${s}sn`;
}

export function ExplainerStudyo({ gomulu, projeId, onUretildi }: StudyoGomuluProps = {}) {
  /* Gömülüyken üretim, gömüldüğü projeye yazılır ve dış sayfaya haber verilir.
     Tek sarmalayıcı: her `uretimBaslat` çağrısını ayrı ayrı değiştirmeye gerek
     kalmadan hepsi buradan geçer (2026-08-02). */
  const uretimBaslat: typeof uretimBaslatHam = (istek) => {
    const s = uretimBaslatHam(gomulu && projeId ? { ...istek, projeId } : istek);
    if (s.ok && s.id) onUretildi?.(s.id);
    return s;
  };

  const { aktifProjeId } = useAktifProje();
  const router = useRouter();
  const [mobilPresetAcik, setMobilPresetAcik] = useState(false);
  const [seciliAd, setSeciliAd] = useState(PRESETLER[0].ad); // Piksel Sanat
  const [konu, setKonu] = useState("");
  const [oran, setOran] = useState("16:9");
  const [sure, setSure] = useState(425); // 7dk 5sn (Higgsfield varsayılan görselde)
  const [manuelSure, setManuelSure] = useState(true);
  const [ses, setSes] = useState("CILLIAN");
  const [linkAcik, setLinkAcik] = useState(false);
  const [link, setLink] = useState("");
  const [dosyalar, setDosyalar] = useState<string[]>([]);
  const [baglantilar, setBaglantilar] = useState<string[]>([]);
  /** m41: URL'yi normalize et + GERÇEK alan adı doğrula. Ne yazılırsa eklenmez;
      geçerli bir alan adı (nokta + en az 2 harfli uzantı) gerekir. */
  const baglantiEkle = () => {
    let u = link.trim();
    if (!u) return;
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    // hostname çıkar ve alan adı geçerliliğini kontrol et (ör: site.com, alt.site.co.uk)
    let host = "";
    try { host = new URL(u).hostname.replace(/^www\./, ""); } catch { host = ""; }
    const gecerliAlan = /^([a-z0-9](-?[a-z0-9])*\.)+[a-z]{2,}$/i.test(host);
    if (!gecerliAlan) {
      toast.error("Geçerli bir alan adı gir", { description: "Örn: siteniz.com — sadece kelime yazmak yetmez." });
      return;
    }
    setBaglantilar((v) => (v.includes(u) ? v : [...v, u]));
    setLink("");
    setLinkAcik(false);
    toast.success("Bağlantı eklendi 🔗", { description: host });
  };
  const alanAdi = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };
  const [oranAcik, setOranAcik] = useState(false);
  const [sureAcik, setSureAcik] = useState(false);
  const [sesModal, setSesModal] = useState(false);
  /* Ses seçici konumu — kutunun SAĞINDA açılır. Ekranın sağına sığmazsa
     soluna düşer; dikeyde ekran dışına taşmaması için üstten kırpılır. */
  const sesBtnRef = useRef<HTMLButtonElement>(null);
  const [sesKonum, setSesKonum] = useState<{ top: number; left: number } | null>(null);
  /** Seçili sesin buton ikonundaki renk (SESLER gradyanından ilk durak). */
  const seciliSesRenk = (SESLER.find((s) => s.ad === ses)?.renk.match(/#[0-9a-f]{3,8}/i)?.[0]) ?? "#55d6fd";
  const sesSeciciAc = () => {
    const r = sesBtnRef.current?.getBoundingClientRect();
    if (r) {
      const GEN = 720, YUK = Math.min(window.innerHeight * 0.88, 620);
      const sagaSigar = r.right + 12 + GEN < window.innerWidth;
      setSesKonum({
        top: Math.max(12, Math.min(r.top - 40, window.innerHeight - 12 - YUK)),
        left: sagaSigar ? r.right + 12 : Math.max(12, r.left - 12 - GEN),
      });
    }
    setSesModal(true);
  };
  const [sekme, setSekme] = useState<SekmeId>("presetler");
  const [ara, setAra] = useState("");
  const [uretiliyor, setUretiliyor] = useState(false);
  const [begeniFiltre, setBegeniFiltre] = useState(false);
  const [lightbox, setLightbox] = useState<Uretim | null>(null);
  const dosyaRef = useRef<HTMLInputElement>(null);

  const tumUretimler = useProjeler((s) => s.uretimler);
  const explainerUretimleri = useMemo(() => {
    const liste = tumUretimler.filter((u) => u.arac === "Explainer Stüdyosu");
    return begeniFiltre ? liste.filter((u) => u.favori) : liste;
  }, [tumUretimler, begeniFiltre]);

  /* Lightbox'ın geçmiş listesindeki konumu — prev/next gezinmesi için.
     Kayıt store'dan CANLI okunur: beğeni gibi değişiklikler açık lightbox'a
     da yansısın (prop bir anlık görüntü olurdu). */
  const lbIndex = lightbox ? explainerUretimleri.findIndex((u) => u.id === lightbox.id) : -1;
  const lbCanli = lbIndex >= 0 ? explainerUretimleri[lbIndex] : lightbox;

  const secili = PRESETLER.find((p) => p.ad === seciliAd) ?? PRESETLER[0];
  const secArka = presetPoster(secili.tohum);
  const filtre = PRESETLER.filter((p) => p.ad.toLocaleLowerCase("tr").includes(ara.toLocaleLowerCase("tr")));
  const kredi = krediHesap(sure);

  const dosyaEkle = (list: FileList | null) => {
    if (!list?.length) return;
    Array.from(list).slice(0, 5).forEach((d) => {
      const r = new FileReader();
      r.onload = () => setDosyalar((v) => [...v, String(r.result)].slice(0, 5));
      r.readAsDataURL(d);
    });
    toast.success("Dosya eklendi 📎");
  };

  const uret = () => {
    if (konu.trim().length < 3 && dosyalar.length === 0 && !link) {
      return toast.error("Video neyi anlatsın?", { description: "Bir konu yaz veya dosya/bağlantı ekle." });
    }
    setUretiliyor(true);
    const sonuc = uretimBaslat({
      baslik: `${konu.slice(0, 40) || secili.ad} · Açıklayıcı`,
      tur: "video",
      model: "Explainer Stüdyosu",
      prompt: `${konu || secili.ad} · ${secili.ad} stili · ${oran} · ${sureEtiket(sure)} · ${ses} sesi`,
      kredi,
      arac: "Explainer Stüdyosu",
      projeId: aktifProjeId ?? undefined,
      meta: { oran, cozunurluk: "1080p", sure: sureEtiket(sure) },
    });
    if (!sonuc.ok) { setUretiliyor(false); return uretimHataToast(sonuc); }
    toast.success("Açıklayıcı video üretiliyor ✦", { description: `${secili.ad} · ${sureEtiket(sure)} · ${kredi} kredi` });
    setTimeout(() => { setUretiliyor(false); setSekme("gecmis"); }, 1600);
  };

  /* ── MOBİL COMPOSER ──
     Referansta Explainer: stil önizleme (preset) + konu kutusu + oran/süre/ses.
     Masaüstündeki panelli düzen mobilde gizli. */
  return (
    <>
    <div className="sinema-kapsam sm:hidden">
      <MobilComposerKabuk
        baslik="Explainer"
        modId="explainer"
        onKapat={() => router.push("/panel")}
        altCipler={
          <>
            <MobilAltCip tip="sure" deger={sureEtiket(sure)} secenekler={["20sn", "30sn", "1dk", "3dk", "5dk", "10dk"]}
              onSec={(v) => { const m = v.match(/(\d+)(dk|sn)/); if (m) setSure(m[2] === "dk" ? Number(m[1]) * 60 : Number(m[1])); }} />
            <MobilAltCip tip="oran" deger={oran} secenekler={["16:9", "9:16", "1:1"]} onSec={setOran} />
            <MobilCip baslik="Ses" deger={ses} secenekler={["CILLIAN", "ROXIE", "ARTHUR", "BROOKS", "HANA"]} onSec={setSes} />
          </>
        }
        uretButonu={<MobilUretButonu kredi={kredi} onTikla={uret} devreDisi={!konu.trim()} />}
      >
        {/* Stil önizleme — seçili stilin GERÇEK videosu sürekli döngüde oynar */}
        <div className="relative aspect-video overflow-hidden rounded-[12px] bg-cover bg-center" style={{ background: presetPoster(secili.tohum) }}>
          <video key={secili.tohum} src={presetVideo(secili.tohum)} autoPlay muted loop playsInline preload="metadata"
            className="absolute inset-0 h-full w-full object-cover" />
          <span className="absolute bottom-3 left-3 z-10 text-[15px] font-bold uppercase text-white drop-shadow">{secili.ad}</span>
          <button onClick={() => setMobilPresetAcik(true)}
            className="glass-cip absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium text-white">
            <Pencil className="h-3.5 w-3.5" /> Değiştir
          </button>
        </div>
        <MobilIstemKutusu deger={konu} onDegis={setKonu} yerTutucu="Videonun ne anlatacağını yaz…"
          modelAdi={secili.ad} onModelTikla={() => setMobilPresetAcik(true)} satir={4} />

        {mobilPresetAcik && (
          <div className="rounded-[12px] bg-yuzey-2 p-2">
            <MobilSablonIzgarasi sablonlar={filtre.map((p) => ({ id: p.ad, ad: p.ad, arka: presetPoster(p.tohum) }))}
              tekSutun seciliId={seciliAd} onSec={(id) => { setSeciliAd(id); setMobilPresetAcik(false); }} />
          </div>
        )}
      </MobilComposerKabuk>
    </div>

    <div className="sinema-kapsam hidden h-[calc(100vh-3rem)] overflow-hidden bg-[var(--sn-zemin)] text-[var(--sn-metin)] sm:flex">
      <input ref={dosyaRef} type="file" accept="image/*,video/*,application/pdf" multiple hidden onChange={(e) => { dosyaEkle(e.target.files); e.target.value = ""; }} />

      {/* ═══════════ SOL PANEL ═══════════ */}
      <aside className="flex w-[356px] shrink-0 flex-col overflow-y-auto border-r border-[var(--sn-kenar)] bg-[var(--sn-yuzey)] p-4">
        <h1 className="hf-baslik mb-3.5 text-[16px]" style={{ color: LIME }}>VAYRA EXPLAINER</h1>

        {/* 16:9 önizleme — seçili stilin GERÇEK videosu sürekli döngüde oynar + Değiştir */}
        <div className="hf-kart relative aspect-video w-full overflow-hidden">
          <span className="absolute inset-0" style={{ background: secArka }} />
          <video key={secili.tohum} src={presetVideo(secili.tohum)} autoPlay muted loop playsInline preload="metadata"
            className="absolute inset-0 h-full w-full object-cover" />
          <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
          <span className="pointer-events-none absolute inset-0 rounded-[20px] ring-1 ring-inset ring-white/10" />
          <span className="absolute bottom-2.5 left-3 z-10 text-[13px] font-semibold text-white drop-shadow">{secili.ad.toLocaleUpperCase("tr")}</span>
          <button onClick={() => setSekme("presetler")} className="hf-btn glass-cip absolute right-2 top-2 flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium text-white">
            <Pencil className="h-3 w-3" /> Değiştir
          </button>
        </div>

        {/* Konu textarea */}
        <div className="glass-cip mt-3 rounded-xl p-3">
          <p className="mb-1 text-[13px] text-[var(--sn-metin-2)]">Video neyi anlatmalı?</p>
          <textarea value={konu} onChange={(e) => setKonu(e.target.value)} rows={3}
            placeholder="Bir konu yaz ya da aşağıdan dosya ekle" className="w-full resize-none bg-transparent text-[14px] outline-none placeholder:text-[var(--sn-metin-3)]" />
          {/* Eklenen dosyalar */}
          {dosyalar.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {/* Eklenen dosya: hover'da SAĞA doğru büyük önizleme
                  (/panel/gorsel deseni — kullanıcı isteği 2026-07-31).
                  overflow-hidden KALDIRILDI: önizleme portal'a çıkıyor ama
                  kutu kırpması hover alanını da daraltıyordu. */}
              {dosyalar.map((d, i) => (
                <span key={i} className="group/df relative h-12 w-12 rounded-lg border border-[var(--sn-kenar)]">
                  <YuklenenOnizleme url={d} yuvarlak="rounded-lg" />
                  <button onClick={() => setDosyalar((v) => v.filter((_, j) => j !== i))}
                    aria-label="Kaldır"
                    className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/60 opacity-0 transition-opacity group-hover/df:opacity-100">
                    <X className="h-4 w-4 text-white" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {/* Eklenen bağlantı KUTULARI (Higgsfield birebir: 🔗 URL / alan adı + X) */}
          {baglantilar.length > 0 && (
            <div className="mb-2 space-y-1.5">
              {baglantilar.map((b, i) => (
                <div key={i} className="flex items-center gap-2.5 rounded-xl border border-[var(--sn-kenar)] bg-white/[0.03] px-2.5 py-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--sn-kenar)] text-[var(--sn-metin-2)]"><Link2 className="h-4 w-4" style={{ color: LIME }} /></span>
                  <span className="min-w-0 flex-1">
                    <a href={b} target="_blank" rel="noopener noreferrer" className="block truncate text-[13px] font-medium text-white hover:underline">{b}</a>
                    <span className="block truncate text-[11.5px] text-[var(--sn-metin-3)]">{alanAdi(b)}</span>
                  </span>
                  <button onClick={() => setBaglantilar((v) => v.filter((_, j) => j !== i))} aria-label="Bağlantıyı kaldır" className="shrink-0 text-[var(--sn-metin-3)] hover:text-white"><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          )}
          {/* Link ekleme satırı */}
          {linkAcik && (
            <div className="glass-cip mb-2 flex items-center gap-2 rounded-lg px-2.5 py-1.5">
              <input autoFocus value={link} onChange={(e) => setLink(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") baglantiEkle(); }}
                placeholder="Bir bağlantı yapıştır — makale, sayfa" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--sn-metin-3)]" />
              <button onClick={baglantiEkle} className="hf-btn rounded-md bg-white px-2.5 py-1 text-[12px] font-semibold text-black">Ekle</button>
              <button onClick={() => { setLinkAcik(false); setLink(""); }} className="text-[var(--sn-metin-3)] hover:text-white"><X className="h-4 w-4" /></button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button onClick={() => dosyaRef.current?.click()} className="hf-btn glass-cip flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] text-[var(--sn-metin-2)] hover:text-white"><Paperclip className="h-3.5 w-3.5" /> Dosya ekle</button>
            <button onClick={() => setLinkAcik((v) => !v)} className={cn("hf-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px]", linkAcik ? "glass-cip-aktif text-white" : "glass-cip text-[var(--sn-metin-2)] hover:text-white")}><Link2 className="h-3.5 w-3.5" /> Bağlantı</button>
          </div>
        </div>

        {/* Aspect Ratio + Duration (yan yana) */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {/* Oran */}
          <div className="relative">
            <button onClick={() => { setOranAcik((v) => !v); setSureAcik(false); }} className="hf-btn glass-cip flex w-full flex-col items-start rounded-xl px-3 py-2.5 text-left">
              <span className="text-[11px] text-[var(--sn-metin-3)]">En-boy oranı</span>
              <span className="flex w-full items-center justify-between text-[14px] font-medium">{oran} <ChevronRight className="h-4 w-4 text-[var(--sn-metin-3)]" /></span>
            </button>
            <AnimatePresence>
              {oranAcik && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setOranAcik(false)} />
                  {/* Bir tık ÜSTTE açılır (Higgsfield: menü tetikleyicinin üstüne biner) */}
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="menu-surface absolute bottom-full left-0 z-40 mb-2 w-full rounded-xl p-1.5">
                    {ORANLAR.map((o) => (
                      <button key={o} onClick={() => { setOran(o); setOranAcik(false); }} className={cn("flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[13px] hover:bg-white/8", o === oran ? "text-white" : "text-[var(--sn-metin-2)]")}>{o} {o === oran && <Check className="h-3.5 w-3.5" style={{ color: LIME }} />}</button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          {/* Süre */}
          <div className="relative">
            <button onClick={() => { setSureAcik((v) => !v); setOranAcik(false); }} className="hf-btn glass-cip flex w-full flex-col items-start rounded-xl px-3 py-2.5 text-left">
              <span className="text-[11px] text-[var(--sn-metin-3)]">Süre</span>
              <span className="flex w-full items-center justify-between text-[14px] font-medium">{sureEtiket(sure)} <ChevronRight className="h-4 w-4 text-[var(--sn-metin-3)]" /></span>
            </button>
            <AnimatePresence>
              {sureAcik && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setSureAcik(false)} />
                  {/* Bir tık ÜSTTE açılır (Higgsfield: menü tetikleyicinin üstüne biner) */}
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="menu-surface absolute bottom-full right-0 z-40 mb-2 w-52 rounded-xl p-1.5">
                    {SURELER.map((s) => (
                      <button key={s.ad} onClick={() => { setSure(s.sn); setManuelSure(false); setSureAcik(false); }} className={cn("flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[13px] hover:bg-white/8", !manuelSure && sure === s.sn ? "text-white" : "text-[var(--sn-metin-2)]")}>{s.ad} {!manuelSure && sure === s.sn && <Check className="h-3.5 w-3.5" style={{ color: LIME }} />}</button>
                    ))}
                    <div className={cn("mt-1 rounded-lg px-2.5 py-2", manuelSure && "bg-white/[0.06]")}>
                      <span className="flex items-center justify-between text-[13px] text-[var(--sn-metin)]">Manuel {manuelSure && <Check className="h-3.5 w-3.5" style={{ color: LIME }} />}</span>
                      <span className="block text-[11px] text-[var(--sn-metin-3)]">Süreyi elle seç</span>
                      <input type="range" min={10} max={600} value={sure} onChange={(e) => { setSure(+e.target.value); setManuelSure(true); }} className="mt-2 w-full accent-[var(--sn-lime)]" />
                      <span className="mt-1 block text-center text-[12px] font-medium">{sureEtiket(sure)}</span>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Ses seçici — kutunun SAĞINA açılır (kullanıcı isteği 2026-07-31).
            Ortalanmış pop-up yerine tetikleyicinin yanında durur; seçili sesin
            adı ve rengi butonda görünür. */}
        <button ref={sesBtnRef} onClick={sesSeciciAc}
          className="hf-btn glass-cip mt-2 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-black text-black/35"
            style={{ background: `linear-gradient(135deg, ${seciliSesRenk}, ${seciliSesRenk}66)` }}>
            {ses.slice(0, 1)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] text-[var(--sn-metin-3)]">Ses</span>
            <span className="block truncate text-[14px] font-medium">{ses}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--sn-metin-3)]" />
        </button>

        {/* ÜRET CTA — süreye göre kredi */}
        <button onClick={uret} disabled={uretiliyor} className="hf-uret mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-[14px] font-bold">
          {uretiliyor ? <span className="opacity-70">Üretiliyor…</span> : <>Üret <Sparkles className="h-4 w-4" /> ~{kredi}</>}
        </button>
        <button onClick={() => toast("Kredi video süresine göre hesaplanır — dakika başına ~✦200.")}
          className="mt-2.5 flex items-center justify-center gap-1 text-[12px] text-[var(--sn-metin-3)] underline underline-offset-2 transition-colors hover:text-[var(--sn-metin-2)]">
          Hesaplama nasıl çalışır? <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </aside>

      {/* ═══════════ ANA ALAN ═══════════ */}
      <section className={cn("min-w-0 flex-1 flex-col overflow-hidden", gomulu ? "hidden" : "flex")}>
        <div className="flex items-center justify-between gap-3 px-6 pt-5">
          <div className="glass-cip flex items-center gap-1 rounded-xl p-1">
            {SEKMELER.map((s) => (
              <button key={s.id} onClick={() => setSekme(s.id)}
                className={cn("hf-btn flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px]", sekme === s.id ? "glass-cip-aktif text-white" : "text-[var(--sn-metin-2)] hover:text-white")}>
                <s.ik className="h-3.5 w-3.5" /> {s.ad}
              </button>
            ))}
          </div>
          {sekme === "gecmis" ? (
            <button onClick={() => setBegeniFiltre((v) => !v)} className="flex items-center gap-2 text-[13px] text-[var(--sn-metin-2)]">
              <Heart className={cn("h-4 w-4", begeniFiltre && "fill-current")} style={begeniFiltre ? { color: LIME } : undefined} /> Beğenilenler
              <span className={cn("relative h-5 w-9 rounded-full transition-colors", begeniFiltre ? "" : "bg-white/15")} style={begeniFiltre ? { background: LIME } : undefined}>
                <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", begeniFiltre ? "left-4" : "left-0.5")} />
              </span>
            </button>
          ) : (
            <div className="glass-cip flex items-center gap-2 rounded-full px-3 py-1.5">
              <Search className="h-4 w-4 text-[var(--sn-metin-3)]" />
              <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ara" className="w-40 bg-transparent text-[13px] outline-none placeholder:text-[var(--sn-metin-3)]" />
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {/* ─── PRESETLER (16:9 yatay kartlar) ─── */}
          {sekme === "presetler" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtre.map((p, i) => {
                const arka = presetPoster(p.tohum);
                const url = saltUrl(arka);
                const aktif = p.ad === seciliAd;
                return (
                  <motion.button key={p.ad} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.25) }}
                    onClick={() => { setSeciliAd(p.ad); toast.success(`${p.ad} uygulandı ✦`); }}
                    className={cn("hf-kart group relative aspect-video overflow-hidden text-left", aktif && "hf-kart-secili")}>
                    <span className="absolute inset-0" style={{ background: arka }} />
                    {url && <img src={url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />}
                    {/* GERÇEK stil videosu — SÜREKLİ döngüde otomatik oynar (Higgsfield birebir) */}
                    <video src={presetVideo(p.tohum)} autoPlay muted loop playsInline preload="metadata"
                      className="absolute inset-0 h-full w-full object-cover" />
                    <span className="pointer-events-none absolute inset-0 rounded-[20px] ring-1 ring-inset ring-white/10" />
                    {aktif ? (
                      <span className="absolute left-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full" style={{ background: LIME }}><Check className="h-3.5 w-3.5 text-black" strokeWidth={3} /></span>
                    ) : null}
                    {/* Sağ üst sessize-al rozeti (Higgsfield birebir) */}
                    <span className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center glass-cip rounded-full text-white/80"><VolumeX className="h-3.5 w-3.5" /></span>
                    <span className="absolute bottom-2.5 left-3 text-[13px] font-semibold uppercase text-white drop-shadow-lg">{p.ad}</span>
                  </motion.button>
                );
              })}
              {filtre.length === 0 && <p className="col-span-full py-16 text-center text-sm text-[var(--sn-metin-2)]">&ldquo;{ara}&rdquo; için preset bulunamadı.</p>}
            </div>
          )}

          {/* ─── GEÇMİŞ ───
              ORTAK UretimKarti kullanılır (kullanıcı isteği 2026-07-31:
              "üretime dair herşey panel/videodaki gibi olacak"). Buradaki
              yerel `ExplainerKart` videodakinin eksik bir kopyasıydı: kalıcı
              beğeni rozeti, gerçek klasör alt-menüsü, format seçimli indirme,
              ad düzenleme, Çevir/Sesi Değiştir yoktu. Tek bileşene geçince
              hepsi otomatik geldi ve ileride tek yerden bakımı yapılır. */}
          {sekme === "gecmis" && (
            explainerUretimleri.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {explainerUretimleri.map((u) => (
                  <UretimKarti key={u.id} u={u} gorselOran={oranSayi(u)} kutuBoyut="buyuk" />
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--sn-kenar-2)] py-20 text-center">
                <Sparkles className="mb-2 h-7 w-7 text-[var(--sn-metin-3)]" />
                <p className="text-sm text-[var(--sn-metin-2)]">{begeniFiltre ? "Henüz beğenilen açıklayıcı yok." : "Henüz açıklayıcı video üretmedin."}</p>
                <button onClick={() => { setBegeniFiltre(false); setSekme("presetler"); }} className="hf-btn glass-cip mt-3 rounded-full px-4 py-2 text-[13px]">Bir preset seç</button>
              </div>
            )
          )}

          {/* ─── NASIL ÇALIŞIR ─── */}
          {sekme === "nasil" && (
            <div className="mx-auto max-w-2xl rounded-2xl border border-[var(--sn-kenar)] bg-[var(--sn-yuzey)] p-6">
              <h2 className="hf-baslik mb-4 text-[16px]" style={{ color: LIME }}>NASIL ÇALIŞIR</h2>
              <ol className="space-y-3.5 text-sm text-[var(--sn-metin-2)]">
                {[
                  "Videonun neyi anlatacağını yaz — ya da bir makale/dosya ekle.",
                  "Bir sanat stili preseti seç (Piksel Sanat, Kil Animasyon, Beyaz Tahta…).",
                  "En-boy oranı, süre ve seslendirmeyi belirle.",
                  "Üret'e bas; AI konuyu sahnelere böler, seslendirir ve açıklayıcı video hazır.",
                ].map((t, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-black" style={{ background: LIME }}>{i + 1}</span>
                    <span className="pt-0.5">{t}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </section>

      {/* Seçim çubuğu — kartlarda seçim yapılınca altta belirir
          (/panel/video ile aynı bileşen; kullanıcı isteği 2026-07-31). */}
      <SecimToolbar />

      {/* ═══════════ SES SEÇİCİ ═══════════
          Ortak SesSeciciModal (arama + özel sesler + GERÇEK "Ses ekle"/klonlama)
          kullanılır ve `yan` ile kutunun SAĞINA oturur. Eskiden buradaki yerel
          `SesModal` ekranın ortasında açılıyordu ve ses ekleme akışı yoktu. */}
      <AnimatePresence>
        {sesModal && (
          <SesSeciciModal
            seciliAd={ses}
            yan={sesKonum}
            onSec={(s) => { setSes(s.ad); toast.success(`Ses: ${s.ad}`); }}
            onKapat={() => setSesModal(false)}
          />
        )}
      </AnimatePresence>

      {/* ═══════════ ÜRETİM DETAY — TAM EKRAN ═══════════
          Görsel üretme sayfasındaki ORTAK lightbox (UretimDetay) kullanılır:
          Esc ile kapatma + scroll kilidi + gerçek tam ekran + prev/next gezinme
          hepsi hazır gelir. Eskiden burada explainer'a özel, gezinmesi ve
          Esc'i olmayan ayrı bir lightbox vardı — kaldırıldı. */}
      <AnimatePresence>
        {lightbox && lbCanli && (
          <UretimDetay
            u={lbCanli}
            onClose={() => setLightbox(null)}
            onOnceki={lbIndex > 0 ? () => setLightbox(explainerUretimleri[lbIndex - 1]) : undefined}
            onSonraki={lbIndex >= 0 && lbIndex < explainerUretimleri.length - 1 ? () => setLightbox(explainerUretimleri[lbIndex + 1]) : undefined}
          />
        )}
      </AnimatePresence>
    </div>
    </>
  );
}

/* ── Geçmiş kartı (9:16 dikey — üretilen açıklayıcı) ── */
/* NOT: Yerel `ExplainerKart` KALDIRILDI (2026-07-31). Ortak `UretimKarti`
   ile değiştirildi — kullanıcı isteği: "üretime dair herşey panel/videodaki
   gibi olacak". Yerel kopya videodakinin eksik bir sürümüydü (kalıcı beğeni
   rozeti, gerçek klasör alt-menüsü, formatlı indirme, ad düzenleme yoktu). */


/* NOT: Yerel `SesModal` KALDIRILDI (2026-07-31). Ortak `SesSeciciModal`
   kullanılıyor: arama + özel sesler + GERÇEK "Ses ekle" (klonlama) akışı
   var ve `yan` ile composer kutusunun SAĞINA açılıyor. */
