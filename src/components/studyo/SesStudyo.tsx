"use client";

import type { StudyoGomuluProps } from "@/components/studyo/tipler";

import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, PanelLeftClose, PanelLeft, LayoutGrid, List, Users, X, Play, Pause,
  Heart, Copy, Download, Check, ChevronDown, RefreshCw, Share2, Trash2,
  Info as InfoIcon, MessageCircle, Sparkles, AudioLines, Upload, Mic, Repeat, Languages,
  RotateCcw, RotateCw, Rewind, FastForward, Volume2, VolumeX, Gauge, Pencil,
  Link2, Briefcase, AtSign as XIkon,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useProje } from "@/store/useSinema";
import { useSecim } from "@/store/useSecim";
import { useMuzik } from "@/store/useMuzik";
import { useYorumlar, goreliZaman } from "@/store/useYorumlar";
import { SecimToolbar } from "@/components/panel/SecimToolbar";
import { useRouter } from "next/navigation";
import { useAktifProje } from "@/lib/useAktifProje";
import { uretimBaslat as uretimBaslatHam, uretimHataToast } from "@/lib/uretimMotoru";
import { cn } from "@/lib/utils";
import { uretimIndir } from "@/lib/gercekEylem";
import { kopyala, baglantiyiKopyala } from "@/lib/gercekEylem";
import { SESLER, DILLER, SES_MODLARI, SES_URETIM_MODELLERI, sesGorsel, type SesMod, type SesModel } from "@/lib/sesVeri";
import { useSesOynat, sureBicim, sureCoz } from "@/components/panel/SesOynatMotoru";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  MobilComposerKabuk, MobilIstemKutusu, MobilCip, MobilAltCip, MobilUretButonu,
  MobilSecici, MobilAyarCekmecesi, type SeciciOge,
} from "@/components/panel/MobilComposer";

/**
 * Ses Stüdyosu — Higgsfield Audio'nun birebir Türkçe klonu (KOMPLE SIFIRDAN).
 * 3-bölge: sol Projeler + orta galeri + alt yüzen composer.
 * Composer: döner kadran mod seçici (Seslendirme/Ses Değiştir/Çeviri) + moda göre giriş
 * + ayar çipi (dot-matrix, Ses Ön-ayarı/Dil) + Üret butonu (gerçek uretimBaslat).
 * Ses seçici modal + Dil modal + çıktı detay drawer'ı. İmza: .hf-led dot-matrix font.
 */

// Higgsfield birebir ses dalgası: SIK + İNCE barlar, ortadan simetrik (gerçek waveform hissi).
// Konuşma zarfı taklidi: birkaç "hece kümesi" + aralarda sessizlik.
function dalga(tohum: string, n = 40): number[] {
  let h = 0; for (let i = 0; i < tohum.length; i++) h = (h * 31 + tohum.charCodeAt(i)) >>> 0;
  const rnd = () => { h = (h * 1103515245 + 12345) & 0x7fffffff; return h / 0x7fffffff; };
  return Array.from({ length: n }, (_, i) => {
    // konuşma zarfı: yavaş dalgalanan genlik + hızlı mikro değişim
    const zarf = 0.45 + 0.55 * Math.abs(Math.sin(i * 0.13 + (h % 7)) * Math.cos(i * 0.041));
    const sessizlik = Math.sin(i * 0.055) > 0.86 ? 0.12 : 1; // arada kısa duraklamalar
    return Math.max(6, Math.min(100, zarf * sessizlik * (55 + rnd() * 60)));
  });
}
function Waveform({ tohum, n = 40, className, aktif }: { tohum: string; n?: number; className?: string; aktif?: boolean }) {
  const bars = useMemo(() => dalga(tohum, n), [tohum, n]);
  return (
    <div className={cn("flex items-center gap-[1.5px]", className)}>
      {/* Barlar OPAK gri — yarı-saydam beyaz (bg-white/35) yüzlerce bar halinde üst üste
          binince kutunun içini "çamurlu" gri sise çeviriyordu. */}
      {bars.map((b, i) => (
        <span key={i} className="w-[2px] shrink-0 rounded-full" style={{ height: `${b}%`, background: aktif ? "var(--sn-lime)" : "#3d3d3d" }} />
      ))}
    </div>
  );
}

export function SesStudyo({ gomulu, projeId, onUretildi }: StudyoGomuluProps = {}) {
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
  const uretimler = useProjeler((s) => s.uretimler);
  const favoriToggle = useProjeler((s) => s.favoriToggle);
  const silUretim = useProjeler((s) => s.sil);
  /* GERÇEK "Yeniden çalıştır" — önce yalnız toast basıyordu (kullanıcı:
     "Yeniden çalıştır, kopyala sil gibi şeyler fake şuanda"). Artık aynı
     ayarlarla yeni bir üretim başlatır ve krediyi düşürür. */
  const yenidenCalistir = (u: Uretim) => {
    const sonuc = uretimBaslat({
      baslik: u.baslik, tur: u.tur, model: u.model, prompt: u.prompt,
      kredi: u.kredi, arac: u.arac, meta: u.meta,
    });
    if (!sonuc.ok) return uretimHataToast(sonuc);
    toast.success("Yeniden çalıştırılıyor 🔄", { description: u.baslik });
  };
  const projeler = useProje((s) => s.projeler);
  const projeOlustur = useProje((s) => s.projeOlustur);
  const secililer = useSecim((s) => s.secililer);
  const secimToggle = useSecim((s) => s.toggle);
  const secimTemizle = useSecim((s) => s.temizle);
  useEffect(() => () => secimTemizle(), [secimTemizle]); // sayfadan çıkınca seçimi bırak

  const [mod, setMod] = useState<SesMod>("seslendirme");
  const [metin, setMetin] = useState("");
  const [model, setModel] = useState("Eleven v3");
  const [modelAcik, setModelAcik] = useState(false);
  const [ses, setSes] = useState<SesModel>(SESLER[4]);
  const [dil, setDil] = useState(DILLER[1]);
  const [kaynakDosya, setKaynakDosya] = useState<string | null>(null);
  const [uretiliyor, setUretiliyor] = useState(false);
  const [hiz, setHiz] = useState(1);
  const [sesDuzey, setSesDuzey] = useState(1);
  const [pitch, setPitch] = useState(0);
  const [ayarAcik, setAyarAcik] = useState(false);

  const [mobilModelAcik, setMobilModelAcik] = useState(false);
  const [sesModalAcik, setSesModalAcik] = useState(false);
  // ── ÖZEL SES / "Add Voice" (m22): Higgsfield birebir — Name + Yükle/Kaydet +
  //    örnek metin + Sesi Klonla (40 kredi). Ayrı bir modal olarak açılır.
  const [ozelSesFormu, setOzelSesFormu] = useState(false);
  const [ozelSesAd, setOzelSesAd] = useState("");
  const [ozelSesCinsiyet, setOzelSesCinsiyet] = useState<"Kadın" | "Erkek">("Kadın");
  const [ozelSesDosya, setOzelSesDosya] = useState<string | null>(null); // yüklenen örnek ses adı
  const [ozelSesKayit, setOzelSesKayit] = useState(false); // kayıt modu aktif mi
  const [ozelSesKayitSn, setOzelSesKayitSn] = useState(0); // kayıt süresi (sn)
  const ozelSesDosyaRef = useRef<HTMLInputElement>(null);
  const kayitliSesler = useMuzik((s) => s.sesler);
  const sesKaydet = useMuzik((s) => s.sesKaydet);
  /** Kaydedilmiş özel sesler → ses seçicide gösterilebilir SesModel'e çevrilir. */
  const ozelSesModelleri = useMemo<SesModel[]>(
    () => kayitliSesler.map((s) => ({
      ad: s.ad,
      cinsiyet: s.cinsiyet === "Erkek" ? "Erkek" : "Kadın",
      renk: "#55d6fd",
      dil: "Türkçe",
    })),
    [kayitliSesler],
  );
  /** m22: GERÇEK klonlama — Higgsfield "Clone Voice" akışı: ad + örnek (yükleme
      VEYA kayıt) gerekli; 40 kredi düşer; useMuzik'e kalıcı yazar ve seçili yapar. */
  const ozelSesOlustur = () => {
    const ad = ozelSesAd.trim();
    if (ad.length < 2) { toast.error("Sese bir ad ver."); return; }
    if (!ozelSesDosya && ozelSesKayitSn < 3) {
      toast.error("Örnek ses gerekli", { description: "Bir ses dosyası yükle ya da en az 3 sn kaydet." });
      return;
    }
    if (kayitliSesler.some((s) => s.ad.toLocaleLowerCase("tr") === ad.toLocaleLowerCase("tr"))) {
      toast.error("Bu adda bir özel ses zaten var"); return;
    }
    sesKaydet({ ad, cinsiyet: ozelSesCinsiyet, tohum: "ozel-" + ad.toLocaleLowerCase("tr"), kaydedilmis: true });
    setSes({ ad, cinsiyet: ozelSesCinsiyet, renk: "#55d6fd", dil: "Türkçe" });
    setOzelSesAd(""); setOzelSesDosya(null); setOzelSesKayit(false); setOzelSesKayitSn(0);
    setOzelSesFormu(false); setSesModalAcik(false);
    toast.success(`${ad} sesi klonlandı 🎙`, { description: "Artık ses kütüphanende ve seçili. · 40 kredi" });
  };
  const [dilModalAcik, setDilModalAcik] = useState(false);
  const [acikDetay, setAcikDetay] = useState<string | null>(null);
  const [oynayan, setOynayan] = useState<string | null>(null);

  // m22: kayıt modu aktifken saniye sayacı (max 120sn — higgs "up to 2 minutes").
  useEffect(() => {
    if (!ozelSesKayit) return;
    const t = setInterval(() => setOzelSesKayitSn((s) => (s >= 120 ? 120 : s + 1)), 1000);
    return () => clearInterval(t);
  }, [ozelSesKayit]);

  const [solPanel, setSolPanel] = useState(true);
  const [gorunum, setGorunum] = useState<"grid" | "list">("grid");
  const [filtre, setFiltre] = useState<"tumu" | "favori">("tumu");
  const dosyaRef = useRef<HTMLInputElement>(null);

  /* ── Sol panel genişliği — /panel/sinema StudyoSidebar gibi kontrol edilebilir.
     Sağ kenardan sürükle → 180..360px. NOT: genişlik useState'te; dışarıdan
     (useTercih) persist bağlanabilmesi için ham state olarak tutuluyor. */
  const PANEL_MIN = 180, PANEL_MAKS = 360;
  const [panelGen, setPanelGen] = useState(260);
  const panelSurukluyor = useRef(false);
  const panelSurukle = (e: React.PointerEvent) => {
    e.preventDefault();
    panelSurukluyor.current = true;
    const tasi = (ev: PointerEvent) => {
      const g = Math.round(ev.clientX);
      // Yeterince sola çekilirse paneli tamamen daralt (rail moduna geç).
      if (g < PANEL_MIN - 30) { setSolPanel(false); return; }
      setSolPanel(true);
      setPanelGen(Math.max(PANEL_MIN, Math.min(PANEL_MAKS, g)));
    };
    const birak = () => {
      panelSurukluyor.current = false;
      window.removeEventListener("pointermove", tasi);
      window.removeEventListener("pointerup", birak);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", tasi);
    window.addEventListener("pointerup", birak);
  };
  // Composer textarea büyütme tutamağı (görsel sayfasıyla aynı mantık).
  const [metinYuk, setMetinYuk] = useState<number | null>(null);
  const metinRef = useRef<HTMLTextAreaElement | null>(null);
  const metinSurukle = (e: React.PointerEvent) => {
    e.preventDefault();
    const ta = metinRef.current;
    const baslaY = e.clientY;
    const baslaH = ta ? ta.getBoundingClientRect().height : (metinYuk ?? 48);
    const tasi = (ev: PointerEvent) => setMetinYuk(Math.max(44, Math.min(300, baslaH + (baslaY - ev.clientY))));
    const birak = () => { window.removeEventListener("pointermove", tasi); window.removeEventListener("pointerup", birak); };
    window.addEventListener("pointermove", tasi);
    window.addEventListener("pointerup", birak);
  };

  const kredi = mod === "ceviri" ? 12 : mod === "sesdegistir" ? 1 : 0.15;

  const sesUretimler = useMemo(() =>
    /* SÜREN ÜRETİMLER DE LİSTEDE (kullanıcı isteği 2026-07-31: "bu sayfada
       üretiliyor kutusu yok"). Önce yalnız `tamam`/`hata` geçiyordu, bu yüzden
       üret'e basınca ekranda hiçbir şey olmuyor, 10-15 sn sonra sonuç birden
       beliriyordu. Artık kuyruk/işleniyor da görünür ve ilerleme akar. */
    uretimler.filter((u) => u.tur === "ses" && (filtre === "tumu" || u.favori)),
    [uretimler, filtre]);
  // Higgsfield birebir: üretimler TARİHE göre gruplanır ("Bugün" / "Dün" / "14 Temmuz 2026").
  const sesGruplar = useMemo(() => {
    const gruplar: { etiket: string; oge: typeof sesUretimler }[] = [];
    const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
    const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const etiketle = (t: number) => {
      const f = Math.floor((bugun.getTime() - new Date(t).setHours(0, 0, 0, 0)) / 86400000);
      if (f <= 0) return "Bugün";
      if (f === 1) return "Dün";
      const d = new Date(t);
      return `${d.getDate()} ${AYLAR[d.getMonth()]} ${d.getFullYear()}`;
    };
    for (const u of sesUretimler) {
      const et = etiketle(u.olusturma);
      const son = gruplar[gruplar.length - 1];
      if (son && son.etiket === et) son.oge.push(u);
      else gruplar.push({ etiket: et, oge: [u] });
    }
    return gruplar;
  }, [sesUretimler]);

  const acik = acikDetay ? sesUretimler.find((u) => u.id === acikDetay) : null;
  useScrollKilit(sesModalAcik || dilModalAcik || ozelSesFormu);
  useEscKapat(ozelSesFormu, () => setOzelSesFormu(false));
  useEscKapat(sesModalAcik && !ozelSesFormu, () => setSesModalAcik(false));
  useEscKapat(dilModalAcik, () => setDilModalAcik(false));
  useEscKapat(acikDetay !== null, () => setAcikDetay(null));

  const dosyaSecildi = (f: FileList | null) => {
    if (!f?.length) return;
    setKaynakDosya(f[0].name);
    toast.success("Kaynak ses yüklendi 🎙️", { description: f[0].name });
  };

  const uret = () => {
    if (mod === "seslendirme" && metin.trim().length < 2) return toast.error("Seslendirilecek metni yaz.");
    if (mod !== "seslendirme" && !kaynakDosya) return toast.error("Önce kaynak sesi yükle.");
    setUretiliyor(true);
    const baslik = mod === "seslendirme" ? metin.slice(0, 40) : mod === "sesdegistir" ? `${ses.ad} sesine dönüştür` : `${dil.ad} çeviri`;
    const prompt = mod === "seslendirme" ? `${metin} · ${ses.ad} sesi · ${model}` : mod === "sesdegistir" ? `${kaynakDosya} → ${ses.ad} sesi` : `${kaynakDosya} → ${dil.ad}`;
    const sonuc = uretimBaslat({
      baslik: baslik || "Ses", tur: "ses", model, prompt, kredi: Math.ceil(kredi) || 1,
      arac: "Ses Stüdyosu", projeId: aktifProjeId ?? undefined, meta: { ses: ses.ad, sure: "0:08" },
    });
    if (!sonuc.ok) { setUretiliyor(false); return uretimHataToast(sonuc); }
    toast.success("Ses üretiliyor ✦", { description: `${ses.ad} · ${model}` });
    setTimeout(() => { setUretiliyor(false); if (mod === "seslendirme") setMetin(""); }, 1600);
  };

  const yeniProje = () => { projeOlustur("Yeni ses projesi", "Genel", { kaynakStudyo: "Ses" }); toast.success("Proje oluşturuldu"); };
  const bosMu = sesUretimler.length === 0;

  /* ── MOBİL COMPOSER ──
     Referansta ses composer: metin kutusu (içinde model satırı) + ses preset +
     dil satırı + Üret. Masaüstündeki panelli düzen mobilde gizli. */
  const mobilSesModeller: SeciciOge[] = SES_URETIM_MODELLERI.map((m) => ({ id: m.ad, ad: m.ad, ozet: m.ozet }));

  return (
    <>
    <div className="sinema-kapsam sm:hidden">
      <MobilComposerKabuk
        baslik="Ses Üret"
        modId="ses"
        onKapat={() => router.push("/panel")}
        altCipler={
          <>
            {/* Ses/Dil çipleri her modda; Hız yalnız seslendirmede */}
            <MobilCip baslik="Ses" deger={ses.ad} secenekler={SESLER.map((s) => s.ad)} onSec={(v) => setSes(SESLER.find((s) => s.ad === v) ?? ses)} />
            <MobilCip baslik="Dil" deger={dil.ad} secenekler={DILLER.map((d) => d.ad)} onSec={(v) => setDil(DILLER.find((d) => d.ad === v) ?? dil)} />
            {mod === "seslendirme" && (
              <MobilCip baslik="Hız" deger={`${hiz}×`} secenekler={["0.5×", "1×", "1.5×", "2×"]} onSec={(v) => setHiz(Number(v.replace("×", "")))} />
            )}
            <MobilAltCip tip="kalite" deger={`Ayarlar`} secenekler={["Ayarlar"]} onSec={() => setAyarAcik(true)} />
          </>
        }
        uretButonu={<MobilUretButonu kredi={Math.ceil(kredi) || 1}
          onTikla={uret}
          devreDisi={mod === "seslendirme" ? !metin.trim() : !kaynakDosya} />}
      >
        {/* ── SES MODU ŞERİDİ (Seslendirme / Ses Değiştir / Çeviri) ── */}
        <div className="flex gap-5 overflow-x-auto border-b border-white/[0.07] pb-2 gizli-scroll">
          {SES_MODLARI.map((m) => (
            <button key={m.id} onClick={() => setMod(m.id)}
              className={cn("shrink-0 whitespace-nowrap border-b-2 pb-1.5 pt-1 text-[15px] font-medium transition-colors",
                mod === m.id ? "border-aksan text-white" : "border-transparent text-metin-2")}>
              {m.ad}
            </button>
          ))}
        </div>

        {mod === "seslendirme" ? (
          <MobilIstemKutusu deger={metin} onDegis={setMetin} yerTutucu="Seslendirilecek metni yaz…"
            modelAdi={model} onModelTikla={() => setMobilModelAcik(true)} satir={6} />
        ) : (
          /* Ses Değiştir / Çeviri: kaynak dosya yükleme */
          <>
            {kaynakDosya ? (
              <div className="flex items-center gap-3 rounded-[14px] bg-yuzey-2 p-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-white/[0.06] text-aksan"><AudioLines className="h-5 w-5" /></span>
                <span className="flex-1 text-[15px] font-medium text-white">Kaynak dosya yüklendi</span>
                <button onClick={() => setKaynakDosya(null)} aria-label="Kaldır" className="text-metin-2"><X className="h-[18px] w-[18px]" /></button>
              </div>
            ) : (
              <label className="flex h-[140px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[14px] bg-yuzey-2">
                <input type="file" accept="audio/*,video/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setKaynakDosya(String(r.result)); r.readAsDataURL(f); } e.target.value = ""; }} />
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.07] text-metin-2"><AudioLines className="h-5 w-5" /></span>
                <span className="text-[14px] text-metin-2">{mod === "sesdegistir" ? "Dönüştürülecek sesi yükle" : "Çevrilecek video/ses yükle"}</span>
              </label>
            )}
            <button onClick={() => setMobilModelAcik(true)}
              className="flex w-full items-center justify-between rounded-[14px] bg-yuzey-2 px-4 py-3.5 text-left">
              <span className="text-[15px] text-metin-2">Model</span>
              <span className="text-[15px] font-medium text-white">{model} ⌄</span>
            </button>
          </>
        )}
      </MobilComposerKabuk>

      {/* Gelişmiş ayarlar: ses düzeyi + perde */}
      <MobilAyarCekmecesi acik={ayarAcik} onKapat={() => setAyarAcik(false)} baslik="Gelişmiş ayarlar"
        onSifirla={() => { setSesDuzey(1); setPitch(0); }} onKaydet={() => setAyarAcik(false)}>
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[14px]"><span className="text-white">Ses düzeyi</span><span className="text-metin-2">{sesDuzey.toFixed(1)}×</span></div>
          <input type="range" min={0} max={2} step={0.1} value={sesDuzey} onChange={(e) => setSesDuzey(Number(e.target.value))} className="h-1.5 w-full cursor-pointer accent-aksan" />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[14px]"><span className="text-white">Perde</span><span className="text-metin-2">{pitch > 0 ? "+" : ""}{pitch}</span></div>
          <input type="range" min={-12} max={12} step={1} value={pitch} onChange={(e) => setPitch(Number(e.target.value))} className="h-1.5 w-full cursor-pointer accent-aksan" />
        </div>
      </MobilAyarCekmecesi>

      <MobilSecici acik={mobilModelAcik} onKapat={() => setMobilModelAcik(false)}
        ogeler={mobilSesModeller} seciliId={model} onSec={(o) => setModel(o.id)} aramaYerTutucu="Model ara…" />
    </div>

    {/* Gömülüyken kendi zemini YOK — proje sayfasının zemini görünsün
        (kullanıcı: "ses sayfasındayken arka plan oluyo", 2026-08-02). */}
    <div className={cn("sinema-kapsam overflow-hidden text-[var(--sn-metin)]",
      gomulu ? "flex bg-transparent" : "hidden h-[calc(100vh-3rem)] bg-[var(--sn-zemin)] sm:flex")}>
      <input ref={dosyaRef} type="file" accept="audio/*,video/*" hidden onChange={(e) => { dosyaSecildi(e.target.files); e.target.value = ""; }} />

      {/* SOL PANEL kaldırıldı — ses sayfasında sidebar gereksiz (madde 26). */}

      {/* ═══ ORTA — GALERİ ═══ */}
      <main className="relative flex min-w-0 flex-1 flex-col">
        <div className={cn("items-center gap-2 border-b border-[var(--sn-kenar)] px-5 py-3", gomulu ? "hidden" : "flex")}>
          <div className="flex gap-1">
            <button onClick={() => setFiltre("tumu")} className={cn("rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors", filtre === "tumu" ? "glass-cip-aktif text-metin" : "glass-cip text-metin-2 hover:text-metin")}>Tümü</button>
            <button onClick={() => setFiltre("favori")} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors", filtre === "favori" ? "glass-cip-aktif text-metin" : "glass-cip text-metin-2 hover:text-metin")}><Heart className="h-3.5 w-3.5" /> Beğenilenler</button>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={() => setGorunum("list")} className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-colors", gorunum === "list" ? "glass-cip-aktif text-metin" : "text-metin-3 hover:text-metin")} aria-label="Liste"><List className="h-4 w-4" /></button>
            <button onClick={() => setGorunum("grid")} className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-colors", gorunum === "grid" ? "glass-cip-aktif text-metin" : "text-metin-3 hover:text-metin")} aria-label="Izgara"><LayoutGrid className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Gömülüyken galeri + boş-durum kahramanı YOK: proje sekmesi
            üretimleri kendi ızgarasında gösteriyor (2026-08-02). */}
        <div className={cn("overflow-y-auto px-5 pt-5", gomulu ? "hidden" : "flex-1 pb-48")}>
          {bosMu ? (
            /* BOŞ DURUM — Higgsfield "Ready to give your scene a voice?" birebir:
               ortada "SES" etiketi + köşe kesim çizgileriyle çerçevelenmiş dev
               gradient başlık, en altta ekranı boydan boya kaplayan soluk waveform. */
            <div className="relative flex h-full flex-col items-center justify-center overflow-hidden text-center">
              <div className="relative px-8 py-6">
                {/* köşe kesim çizgileri (4 köşe) */}
                <span className="pointer-events-none absolute left-0 top-0 h-5 w-5 border-l border-t border-white/25" />
                <span className="pointer-events-none absolute right-0 top-0 h-5 w-5 border-r border-t border-white/25" />
                <span className="pointer-events-none absolute bottom-0 left-0 h-5 w-5 border-b border-l border-white/25" />
                <span className="pointer-events-none absolute bottom-0 right-0 h-5 w-5 border-b border-r border-white/25" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-metin-3">SES</span>
                <h2 className="mt-3 max-w-lg bg-gradient-to-r from-aksan via-amber-300 to-aksan bg-clip-text text-4xl font-black leading-tight text-transparent sm:text-5xl">
                  Sahnene bir ses<br />vermeye hazır mısın?
                </h2>
              </div>
              {/* alt boydan boya soluk waveform */}
              <span className="pointer-events-none absolute inset-x-0 bottom-0 flex h-40 items-end justify-center gap-[3px] opacity-[0.12]">
                {dalga("bos-ses-ekrani", 120).map((b, i) => (
                  <span key={i} className="w-1.5 rounded-t bg-white" style={{ height: `${b * 2.2}px` }} />
                ))}
              </span>
            </div>
          ) : (
            <div className="space-y-6">
              {sesGruplar.map((grup) => {
                const grupIdler = grup.oge.map((u) => u.id);
                const hepsiSecili = grupIdler.length > 0 && grupIdler.every((id) => secililer.includes(id));
                const grupSecToggle = () => {
                  if (hepsiSecili) grupIdler.forEach((id) => { if (secililer.includes(id)) secimToggle(id); });
                  else grupIdler.forEach((id) => { if (!secililer.includes(id)) secimToggle(id); });
                };
                return (
                <div key={grup.etiket}>
                  {/* Tarih başlığı — sol checkbox tüm grubu seçer (video birebir) */}
                  <button onClick={grupSecToggle} className="mb-2.5 flex items-center gap-2.5">
                    <span className={cn("flex h-4.5 w-4.5 items-center justify-center rounded-[5px] border-2 transition-all",
                      hepsiSecili ? "border-aksan bg-aksan text-zemin" : "border-white/30 hover:border-white/60")}>
                      {hepsiSecili && <Check className="h-3 w-3" strokeWidth={3.5} />}
                    </span>
                    <span className="text-[15px] font-semibold text-metin">{grup.etiket}</span>
                  </button>
                  <div className={cn(gorunum === "grid" ? "grid grid-cols-2 gap-4 xl:grid-cols-3" : "space-y-5")}>
                    {grup.oge.map((u) => (
                      <SesKart key={u.id} u={u} gorunum={gorunum} secili={secililer.includes(u.id)} onSec={() => secimToggle(u.id)}
                        oynayan={oynayan} setOynayan={setOynayan}
                        // Detay açılırken composer'ın açık popover'larını da kapat —
                        // yoksa panel gizlenince ekranda sahipsiz bir popover kalıyor.
                        onAc={() => { setAcikDetay(u.id); setSesModalAcik(false); setDilModalAcik(false); setAyarAcik(false); setModelAcik(false); }}
                        onFavori={() => favoriToggle(u.id)}
                        onKopya={() => { void kopyala(u.prompt || u.baslik, "İstem kopyalandı"); }} onIndir={() => uretimIndir(u)} onSil={() => { silUretim(u.id); if (acikDetay === u.id) setAcikDetay(null); toast.success("Silindi"); }}
                        onYenidenCalistir={() => yenidenCalistir(u)} />
                    ))}
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ═══ YÜZEN COMPOSER — Apple buzlu-cam (kabarık, üst ışık + arka bulanıklık) ═══
            Bir üretimin detayı açıkken GİZLENİR: o an odak o üretimde, üretme paneli
            arkada asılı kalmamalı (görsel/video sayfalarında lightbox tam ekran olduğu
            için composer'ı zaten örtüyor; buradaki detay yan drawer olduğundan elle
            gizliyoruz). Aşağı kayıp solarak çıkar. */}
        <motion.div
          initial={false}
          animate={(acikDetay || secililer.length > 0) ? { opacity: 0, y: 24 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            // Detay açıkken VEYA çoklu seçim yapılırken gizlenir (seçim çubuğu ile
            // üst üste binmesin — görsel sayfasındaki mantığın aynısı).
            // Hafif üst fade: sadece composer'a girişte yumuşak geçiş. Composer'ın
            // KENDİSİ (.ses-composer + iç glass-cip) tam opak + z-10 izole olduğu için
            // arkadaki içerik zaten sızmıyor — agresif koyu katmana gerek yok.
            "pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-4 pb-5 pt-4",
            (acikDetay || secililer.length > 0) && "invisible",
          )}
          /* Arka gradyan KALDIRILDI (kullanıcı isteği 2026-07-31: "kutunun
             şeridinde bi arkada blur efekti oluyor ... onu kaldır agam saçma").
             Composer'ın kendi cam yüzeyi zaten okunurluğu sağlıyor; üstteki
             16 birimlik gradyan bant içerik üstünde gri bir şerit bırakıyordu. */
          >
          {/* items-stretch: mod seçici kutusu, composer ile AYNI yüksekliğe
              uzasın (2026-08-01). Sağdaki çipler kendi `self-end`'i ile
              eskisi gibi alta yaslı kalır. */}
          <div className="pointer-events-auto relative z-10 flex w-full max-w-4xl items-stretch gap-2.5">
          {/* MOD SEÇİCİ — composer'ın SOLUNDA ayrı kutu, üç ÇEYREK DAİRE
              (kullanıcı isteği 2026-07-31; /panel/sinema'daki yan seçici deseni).
              Önce composer'ın İÇİNDE düz dikey liste olarak duruyordu. */}
          {/* self-stretch + justify-between: kutu, yanındaki üretim kutusuyla
              AYNI YÜKSEKLİKTE olur (kullanıcı isteği 2026-08-01). Önce
              `self-end` ile kendi doğal yüksekliğinde kalıyor, composer
              büyüdükçe kısa görünüyordu. */}
          <div className="ses-mod-kutu flex shrink-0 flex-col justify-between gap-2 self-stretch rounded-[22px] p-2">
            {SES_MODLARI.map((m) => {
              const Ikon = m.id === "seslendirme" ? Mic : m.id === "sesdegistir" ? Repeat : Languages;
              const aktif = mod === m.id;
              return (
                <Tooltip key={m.id} label={m.ad} side="left">
                  <button onClick={() => setMod(m.id)} aria-label={m.ad} aria-pressed={aktif}
                    className={cn("ses-dilim flex h-[52px] w-[52px] items-center justify-center",
                      aktif && "ses-dilim-aktif")}>
                    <Ikon className="h-[19px] w-[19px]" strokeWidth={2.1} />
                  </button>
                </Tooltip>
              );
            })}
          </div>
          <div className="ses-composer relative flex min-w-0 flex-1 items-end gap-2 rounded-[22px] p-2.5" style={{ isolation: "isolate" }}>
            {/* Boyut tutamağı — composer'ın en tepesinde, ortada (görsel sayfasıyla
                aynı). Yukarı çek = büyüt, aşağı = küçült. Yalnız seslendirme modunda. */}
            {mod === "seslendirme" && (
              <div onPointerDown={metinSurukle}
                className="group/tut absolute -top-1.5 left-1/2 z-20 flex h-5 w-24 -translate-x-1/2 cursor-ns-resize items-center justify-center"
                aria-label="Kutu boyutunu ayarla">
                {/* LIME tutamak — diğer stüdyolarla aynı. */}
                <span className="h-[5px] w-12 rounded-full transition-all group-hover/tut:h-[6px] group-hover/tut:w-14"
                  style={{ background: "#55d6fd", opacity: 0.75 }} />
              </div>
            )}
            {/* giriş */}
            <div className="glass-cip flex min-w-0 flex-1 flex-col justify-center rounded-2xl px-3 py-2">
              {mod === "seslendirme" ? (
                <>
                  <textarea ref={metinRef} value={metin} onChange={(e) => setMetin(e.target.value)} rows={2} placeholder="Seslendirilecek metni yaz…"
                    style={metinYuk !== null ? { height: metinYuk, overflowY: "auto" } : undefined}
                    className="prompt-alan w-full resize-none bg-transparent text-[15px] leading-relaxed text-metin outline-none placeholder:text-metin-3" />
                  <div className="relative mt-1.5 flex items-center gap-2">
                    <button onClick={() => setModelAcik((v) => !v)} className="hf-btn glass-cip flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-metin"><Pause className="h-3.5 w-3.5" /> {model} <ChevronDown className="h-3 w-3 text-metin-3" /></button>
                    <button onClick={() => setAyarAcik((v) => !v)} className="hf-btn glass-cip rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-metin-2 hover:text-metin">Gelişmiş</button>
                    <AnimatePresence>
                      {modelAcik && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setModelAcik(false)} />
                          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="menu-surface absolute bottom-full left-0 z-40 mb-2 w-72 rounded-xl p-1.5">
                            {SES_URETIM_MODELLERI.map((m) => (
                              <button key={m.ad} onClick={() => { setModel(m.ad); setModelAcik(false); }}
                                className={cn("flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/8", model === m.ad && "bg-white/[0.06]")}>
                                <span className="glass-ikon mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"><AudioLines className={cn("h-3.5 w-3.5", model === m.ad ? "text-aksan" : "text-metin-2")} /></span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-[13px] font-medium text-metin">{m.ad}</span>
                                  <span className="block text-[11px] leading-snug text-metin-3">{m.ozet}</span>
                                </span>
                                {model === m.ad && <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-aksan" />}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <button onClick={() => dosyaRef.current?.click()} className="flex h-full min-h-[64px] w-full items-center gap-3 rounded-xl border border-dashed border-white/15 px-3 text-left transition-colors hover:border-aksan/40">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg glass-ikon glass-ikon-lime"><Upload className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-metin">{kaynakDosya ?? "Kaynak sesi yükle"}</span>
                    <span className="block text-[11px] text-metin-3">{mod === "sesdegistir" ? "Dönüştürülecek ses/video" : "Çevrilecek video sesi"}</span>
                  </span>
                  {kaynakDosya && <span onClick={(e) => { e.stopPropagation(); setKaynakDosya(null); }} className="cursor-pointer text-metin-3 hover:text-metin"><X className="h-4 w-4" /></span>}
                </button>
              )}
            </div>

            {/* Ses Ön-ayarı / Dil — dot-matrix ekran. self-end: prompt büyürken ALTA
                yapışık kalır (üstte boşlukta asılı kalmaz). */}
            {/* SEÇİLİ ROZET (kullanıcı isteği 2026-07-31): dil modunda seçilen
                DİLİN BAYRAĞI, ses modunda seçilen SESİN renk/baş-harf kabı
                butonun içinde görünür. Önce yalnız ad yazıyordu. */}
            <button onClick={() => mod === "ceviri" ? setDilModalAcik(true) : setSesModalAcik(true)}
              className="hf-btn glass-cip flex w-[210px] shrink-0 flex-col justify-center self-end rounded-2xl px-4 py-3 text-left">
              <span className="text-[11px] tracking-wide text-metin-3">{mod === "ceviri" ? "Dil" : "Ses Ön-ayarı"}</span>
              <span className="mt-1 flex items-center gap-2">
                {mod === "ceviri" ? (
                  <span className="text-[20px] leading-none">{dil.bayrak}</span>
                ) : (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[12px] font-black text-black/40"
                    style={{ background: `linear-gradient(135deg, ${ses.renk}, ${ses.renk}66)` }}>
                    {ses.ad.slice(0, 1)}
                  </span>
                )}
                {/* `.hf-led` KULLANILMADI: o sınıf `color:transparent` +
                    `-webkit-text-fill-color:transparent` ile dot-matrix efekti
                    yapıyor ve bu kutuda ad TAMAMEN GÖRÜNMEZ oluyordu (ölçüldü).
                    Okunurluk imzadan önce gelir — mono+uppercase yeterli. */}
                <span className="min-w-0 flex-1 truncate font-mono text-[17px] font-bold uppercase tracking-wide text-aksan">{mod === "ceviri" ? dil.ad : ses.ad}</span>
              </span>
              <Waveform tohum={mod === "ceviri" ? dil.ad : ses.ad} n={44} className="mt-2 h-5" aktif />
            </button>

            {/* Üret — self-end + sabit yükseklik: prompt kutusu büyüyünce ÜRET
                UZAMAZ, Ses Ön-ayarı ile aynı boyda kompakt kalır (alta yapışık). */}
            <button onClick={uret} disabled={uretiliyor} className="hf-uret flex h-[92px] shrink-0 items-center justify-center gap-2 self-end rounded-2xl px-6 disabled:opacity-60">
              {uretiliyor ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span className="text-[15px] font-black tracking-wide">ÜRET</span>
                  <span className="flex items-center gap-1 rounded-full bg-black/15 px-2 py-0.5 text-[12px] font-bold"><Sparkles className="h-3 w-3" /> {kredi}</span>
                </>
              )}
            </button>
          </div>
          </div>
        </motion.div>

        {/* gelişmiş ayarlar popover */}
        <AnimatePresence>
          {ayarAcik && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setAyarAcik(false)} />
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="menu-surface absolute bottom-28 left-1/2 z-40 w-72 -translate-x-1/2 rounded-2xl p-4">
                <p className="mb-3 text-[13px] font-semibold">Gelişmiş ayarlar</p>
                <AyarSlider ad="Hız" v={hiz} min={0.5} max={2} step={0.1} onChange={setHiz} birim="×" />
                <AyarSlider ad="Ses Düzeyi" v={sesDuzey} min={0} max={2} step={0.1} onChange={setSesDuzey} birim="×" />
                <AyarSlider ad="Perde" v={pitch} min={-12} max={12} step={1} onChange={setPitch} birim="" />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>

      {/* ═══ SES SEÇİCİ — composer üstünde popover (Higgsfield birebir) ═══ */}
      <AnimatePresence>
        {sesModalAcik && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center px-4 pb-[104px]">
            {/* şeffaf tık-kapatma katmanı (galeri kararmaz) */}
            <div className="absolute inset-0" onClick={() => setSesModalAcik(false)} />
            <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} transition={{ duration: 0.16 }}
              className="hf-kart relative w-full max-w-3xl overflow-hidden bg-[#0f1113] shadow-2xl shadow-black/60">
              <div className="flex items-start justify-between border-b border-[var(--sn-kenar)] p-5">
                <div><h3 className="text-xl font-black text-metin">BİR SES SEÇ VEYA EKLE</h3><p className="mt-1 text-[13px] text-metin-2">Hazır seslerden seç, kendi sesini kaydet ya da bir ses yükle.</p></div>
                <button onClick={() => setSesModalAcik(false)} className="hf-btn glass-ikon flex h-8 w-8 items-center justify-center rounded-full text-metin-2" aria-label="Kapat"><X className="h-5 w-5" /></button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-5">
                {/* m22: "Ses ekle" — Higgsfield "Add Voice" modalını açar (Name + Yükle/Kaydet
                    + örnek metin + Sesi Klonla). Basit inline form KALDIRILDI. */}
                <button onClick={() => { setOzelSesFormu(true); setOzelSesDosya(null); setOzelSesKayit(false); setOzelSesKayitSn(0); }}
                  className="mb-4 flex items-center gap-2 rounded-xl bg-aksan px-4 py-2.5 text-[13px] font-bold text-zemin transition-transform hover:scale-[1.02]"><Mic className="h-4 w-4" /> Ses ekle</button>
                {ozelSesModelleri.length > 0 && (
                  <>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-metin-3">Özel seslerin</p>
                    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {ozelSesModelleri.map((s) => {
                        const secili = ses.ad === s.ad;
                        return (
                          <button key={s.ad} onClick={() => { setSes(s); setSesModalAcik(false); toast.success(`${s.ad} sesi seçildi`); }}
                            className={cn("group flex flex-col overflow-hidden rounded-xl border text-left transition-all", secili ? "border-aksan ring-2 ring-aksan/30" : "border-[var(--sn-kenar)] hover:border-[var(--sn-kenar-2)]")}>
                            <div className="h-16 w-full" style={{ background: `linear-gradient(135deg, ${s.renk}, ${s.renk}66)` }} />
                            <div className="p-2.5">
                              <span className="text-[10px] text-metin-3">{s.cinsiyet} · Özel</span>
                              <div className="hf-led mt-0.5 text-metin" style={{ fontSize: 15 }}>{s.ad}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-metin-3">Hazır sesler</p>
                  </>
                )}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {SESLER.map((s) => {
                    const secili = ses.ad === s.ad;
                    const oyn = oynayan === "ses-" + s.ad;
                    return (
                      <button key={s.ad} onClick={() => { setSes(s); setSesModalAcik(false); toast.success(`${s.ad} sesi seçildi`); }} className={cn("group flex flex-col overflow-hidden rounded-xl border text-left transition-all", secili ? "border-aksan ring-2 ring-aksan/30" : "border-[var(--sn-kenar)] hover:border-[var(--sn-kenar-2)]")}>
                        <div className="relative h-24 w-full overflow-hidden" style={{ background: `linear-gradient(135deg, ${s.renk}, ${s.renk}66)` }}>
                          <img src={sesGorsel(s.ad)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        </div>
                        <div className="p-2.5">
                          <span className="text-[10px] text-metin-3">{s.cinsiyet} · {s.dil}</span>
                          <div className="hf-led mt-0.5 text-metin" style={{ fontSize: 15 }}>{s.ad}</div>
                          <div className="mt-1.5 flex items-center gap-2">
                            <span onClick={(e) => { e.stopPropagation(); setOynayan(oyn ? null : "ses-" + s.ad); }} className="glass-ikon flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-metin">{oyn ? <Pause className="h-3 w-3" /> : <Play className="ml-0.5 h-3 w-3 fill-current" />}</span>
                            <Waveform tohum={s.ad} n={16} className="h-4 flex-1" aktif={oyn} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ SES EKLE / "Add Voice" — Higgsfield birebir (m22) ═══
          Name + Yükle/Kaydet + örnek metin + Sesi Klonla (40 kredi). */}
      <AnimatePresence>
        {ozelSesFormu && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOzelSesFormu(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 360, damping: 30 }}
              className="hf-kart relative w-full max-w-2xl overflow-hidden bg-[#0f1113] shadow-2xl shadow-black/60"
            >
              <input ref={ozelSesDosyaRef} type="file" accept="audio/*" className="hidden"
                onChange={(e) => {
                  const d = e.target.files?.[0]; e.target.value = "";
                  if (!d) return;
                  if (d.size > 11 * 1024 * 1024) { toast.error("Dosya çok büyük", { description: "En fazla 11MB (MP3/WAV)." }); return; }
                  setOzelSesDosya(d.name); setOzelSesKayit(false); setOzelSesKayitSn(0);
                  toast.success("Örnek ses yüklendi 🎧", { description: d.name });
                }} />
              {/* Başlık */}
              <div className="flex items-start justify-between border-b border-[var(--sn-kenar)] p-5">
                <div>
                  <h3 className="text-[20px] font-bold text-metin">Ses ekle</h3>
                  <p className="mt-1 text-[13px] text-metin-2">Klonlamak için bir ses örneği kaydet ya da yükle.</p>
                </div>
                <button onClick={() => setOzelSesFormu(false)} className="hf-btn glass-ikon flex h-8 w-8 items-center justify-center rounded-full text-metin-2" aria-label="Kapat"><X className="h-5 w-5" /></button>
              </div>

              <div className="max-h-[64vh] space-y-5 overflow-y-auto p-5">
                {/* İsim */}
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-metin"><span className="text-rose-400">*</span> İsim</label>
                  <input value={ozelSesAd} onChange={(e) => setOzelSesAd(e.target.value)}
                    placeholder="Sesini adlandır" autoFocus
                    className="h-11 w-full rounded-xl border border-[var(--sn-kenar)] bg-zemin px-3.5 text-[14px] text-metin outline-none focus:border-aksan/60" />
                  {/* cinsiyet — küçük yardımcı */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[12px] text-metin-3">Ton:</span>
                    {(["Kadın", "Erkek"] as const).map((c) => (
                      <button key={c} onClick={() => setOzelSesCinsiyet(c)}
                        className={cn("rounded-full px-3 py-1 text-[12px] font-semibold transition-colors", ozelSesCinsiyet === c ? "bg-aksan text-zemin" : "border border-[var(--sn-kenar)] text-metin-2 hover:text-metin")}>{c}</button>
                    ))}
                  </div>
                </div>

                {/* Yükle | Kaydet — iki sütun */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* Yükle */}
                  <button onClick={() => ozelSesDosyaRef.current?.click()}
                    className={cn("flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
                      ozelSesDosya ? "border-aksan/60 bg-aksan/[0.06]" : "border-[var(--sn-kenar)] hover:border-[var(--sn-kenar-2)]")}>
                    <Upload className={cn("h-7 w-7", ozelSesDosya ? "text-aksan" : "text-metin-2")} />
                    <span className="text-[14px] font-semibold text-metin">{ozelSesDosya ? "Örnek yüklendi ✓" : "Sürükle bırak veya tıkla"}</span>
                    <span className="text-[12px] text-metin-3">{ozelSesDosya ? ozelSesDosya : "MP3 veya WAV, en fazla 11MB"}</span>
                  </button>

                  {/* Kaydet */}
                  <div className={cn("flex flex-col items-center justify-center gap-2.5 rounded-2xl border p-6 text-center transition-colors",
                    ozelSesKayit ? "border-rose-400/60 bg-rose-500/[0.06]" : "border-[var(--sn-kenar)]")}>
                    <button onClick={() => { setOzelSesKayit((v) => !v); if (!ozelSesKayit) { setOzelSesDosya(null); setOzelSesKayitSn(0); } }}
                      className={cn("flex h-11 items-center gap-2 rounded-full px-5 text-[14px] font-bold transition-transform hover:scale-[1.03]",
                        ozelSesKayit ? "bg-rose-500 text-white" : "bg-white/8 text-metin hover:bg-white/12")}>
                      <span className={cn("h-2.5 w-2.5 rounded-full", ozelSesKayit ? "animate-pulse bg-white" : "bg-rose-500")} />
                      {ozelSesKayit ? `Kaydediliyor ${Math.floor(ozelSesKayitSn / 60)}:${String(ozelSesKayitSn % 60).padStart(2, "0")}` : "Kaydı başlat"}
                    </button>
                    <span className="text-[14px] font-semibold text-metin">Kendi sesini oluştur</span>
                    <span className="text-[12px] text-metin-3">{ozelSesKayit ? "Örnek metni oku, bitince tekrar bas" : "'Kaydet'e bas ve 2 dakikaya kadar net konuş"}</span>
                  </div>
                </div>

                {/* Örnek metin */}
                <div className="rounded-2xl border border-[var(--sn-kenar)] bg-yuzey p-4">
                  <p className="text-[13px] font-semibold text-metin">Örnek metin</p>
                  <p className="mt-1 text-[12px] text-metin-3">En iyi klon için kayıt sırasında bunu sesli oku</p>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-metin-2">
                    En iyi fikirler tam biçimlenmiş gelmez. Küçük bir sezgi olarak başlar — peşini bırakmayan bir şey.
                    Taslağını çıkarır, tartışır, yarısını atar ve kalanı yeniden kurarsın. Süreç budur; dağınık,
                    sinir bozucu ve arada bir muhteşem. Ben hep hızın kusursuzluktan önemli olduğuna inandım.
                  </p>
                </div>
              </div>

              {/* Alt aksiyon */}
              <div className="flex items-center justify-end gap-2 border-t border-[var(--sn-kenar)] p-4">
                <button onClick={() => setOzelSesFormu(false)} className="rounded-xl px-4 py-2.5 text-[13px] font-medium text-metin-2 hover:text-metin">İptal</button>
                <button onClick={ozelSesOlustur}
                  className="flex items-center gap-2 rounded-xl bg-aksan px-5 py-2.5 text-[13px] font-bold text-zemin transition-transform hover:scale-[1.02]">
                  <Sparkles className="h-4 w-4" /> Sesi klonla <span className="opacity-70">· 40</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ DİL SEÇİCİ — composer üstünde popover (Higgsfield birebir) ═══ */}
      <AnimatePresence>
        {dilModalAcik && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center px-4 pb-[104px]">
            <div className="absolute inset-0" onClick={() => setDilModalAcik(false)} />
            <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} transition={{ duration: 0.16 }}
              className="hf-kart relative w-full max-w-2xl overflow-hidden bg-[#0f1113] shadow-2xl shadow-black/60">
              <div className="flex items-start justify-between border-b border-[var(--sn-kenar)] p-5">
                <div><h3 className="text-xl font-black text-metin">DİL SEÇ</h3><p className="mt-1 text-[13px] text-metin-2">Videonun sesinin çevrileceği dili seç.</p></div>
                <button onClick={() => setDilModalAcik(false)} className="hf-btn glass-ikon flex h-8 w-8 items-center justify-center rounded-full text-metin-2" aria-label="Kapat"><X className="h-5 w-5" /></button>
              </div>
              <div className="max-h-[55vh] overflow-y-auto p-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {DILLER.map((d) => {
                    const secili = dil.ad === d.ad;
                    // m22: bayrak ORTADA ve BÜYÜK (higgs birebir)
                    return (
                      <button key={d.ad} onClick={() => { setDil(d); setDilModalAcik(false); toast.success(`${d.ad} seçildi`); }} className={cn("flex flex-col items-center justify-center gap-2 rounded-xl border py-5 transition-all", secili ? "border-aksan ring-2 ring-aksan/30" : "border-[var(--sn-kenar)] hover:border-[var(--sn-kenar-2)]")}>
                        <span className="text-5xl leading-none">{d.bayrak}</span>
                        <span className="hf-led text-metin" style={{ fontSize: 13 }}>{d.ad}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ ÇIKTI DETAY DRAWER ═══ */}
      <AnimatePresence>
        {acik && <SesDetayDrawer u={acik} onKapat={() => setAcikDetay(null)} onFavori={() => favoriToggle(acik.id)} onSil={() => { silUretim(acik.id); setAcikDetay(null); toast.success("Silindi"); }} oynayan={oynayan} setOynayan={setOynayan} />}
      </AnimatePresence>

      {/* Toplu seçim çubuğu — video/görsel birebir ("N seçili") */}
      <SecimToolbar />
    </div>
    </>
  );
}

function SesKart({ u, gorunum, secili, onSec, oynayan, setOynayan, onAc, onFavori, onKopya, onIndir, onSil, onYenidenCalistir }: {
  u: Uretim; gorunum: "grid" | "list"; secili: boolean; onSec: () => void; oynayan: string | null; setOynayan: (v: string | null) => void;
  onAc: () => void; onFavori: () => void; onKopya: () => void; onIndir: () => void; onSil: () => void;
  onYenidenCalistir: () => void;
}) {
  const oyn = oynayan === u.id;
  const metin = u.prompt || u.baslik;
  /* GERÇEK oynatma motoru (kullanıcı isteği 2026-07-31): ▶ artık sesi
     gerçekten çalar, ⟲10/10⟳ konumu değiştirir, süre ses dosyasından okunur
     ve ilerleme çubuğu canlı akar. Öncesi tamamen görseldi. */
  const { an, toplam, gercek, atla, konumaGit, oran } = useSesOynat({
    sesUrl: u.sesUrl,
    varsayilanSure: sureCoz(u.meta?.sure),
    aktif: oyn,
    onBitti: () => setOynayan(null),
  });
  const sure = sureBicim(toplam);
  const suruyor = u.durum === "kuyrukta" || u.durum === "isleniyor";

  /* Kullanılan ses ve dil — liste görünümündeki mod rozetinin hover kartında
     gösterilir (kullanıcı isteği: "kullanılan ses ve dil kartı çıksın"). */
  const meta = (u.meta ?? {}) as Record<string, unknown>;
  const modAd = (meta.mod as string) || "Seslendirme";
  const kullanilanSes = (meta.ses as string) || u.model || "—";
  const kullanilanDil = (meta.dil as string) || "Türkçe";

  if (gorunum === "list") {
    return (
      <div className="group/sk grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* SOL: siyah kutu + GERÇEK transport kontrolleri */}
        <div className={cn("relative flex aspect-[16/10] flex-col items-center justify-center overflow-hidden rounded-2xl border bg-[#0d0d0e] px-8",
          secili ? "border-aksan/60" : "border-[var(--sn-kenar)]")}>
          <button onClick={onAc} className="absolute inset-0" aria-label="Sesi aç" />
          <span onClick={(e) => { e.stopPropagation(); onSec(); }}
            className={cn("absolute left-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded-[5px] border-2 backdrop-blur-sm transition-all",
              secili ? "border-aksan bg-aksan text-zemin opacity-100" : "border-white/70 opacity-0 group-hover/sk:opacity-100")}>
            {secili && <Check className="h-3 w-3" strokeWidth={3.5} />}
          </span>
          {/* KALICI BEĞENİ ROZETİ — sağ üstte, hover gerekmez (görsel/video ile aynı) */}
          {u.favori && (
            <span aria-hidden className="kart-begeni pointer-events-none absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-opacity group-hover/sk:opacity-0">
              <Heart className="h-[18px] w-[18px] fill-rose-400 text-rose-400" />
            </span>
          )}
          <Waveform tohum={u.id} n={120} className="pointer-events-none z-0 h-[30%] w-full justify-center" aktif={oyn || suruyor} />
          {/* ÜRETİLİYOR — transport yerine ilerleme göstergesi (kullanıcı isteği) */}
          {suruyor ? (
            <div className="relative z-10 mt-5 flex flex-col items-center gap-2.5">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-aksan" />
              <span className="text-[13px] font-medium text-white">
                {u.durum === "kuyrukta" ? "Kuyrukta…" : `Üretiliyor · %${u.ilerleme}`}
              </span>
              <span className="h-1.5 w-40 overflow-hidden rounded-full bg-white/12">
                <span className="block h-full rounded-full bg-aksan transition-[width] duration-300" style={{ width: `${u.ilerleme}%` }} />
              </span>
              <span className="text-[11px] text-metin-3">{u.model}</span>
            </div>
          ) : (
          <div className="relative z-10 mt-5 flex items-center gap-5">
            <button onClick={(e) => { e.stopPropagation(); atla(-10); }} aria-label="10 saniye geri"
              className="flex flex-col items-center text-metin-2 transition-colors hover:text-metin">
              <RotateCcw className="h-6 w-6" /><span className="-mt-4 text-[9px] font-bold">10</span></button>
            <button onClick={(e) => { e.stopPropagation(); setOynayan(oyn ? null : u.id); }}
              aria-label={oyn ? "Duraklat" : "Oynat"}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-zemin shadow-xl transition-transform hover:scale-105">
              {oyn ? <Pause className="h-6 w-6" /> : <Play className="ml-1 h-6 w-6 fill-current" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); atla(10); }} aria-label="10 saniye ileri"
              className="flex flex-col items-center text-metin-2 transition-colors hover:text-metin">
              <RotateCw className="h-6 w-6" /><span className="-mt-4 text-[9px] font-bold">10</span></button>
          </div>
          )}
          {/* İLERLEME ÇUBUĞU — tıklanabilir (konuma atlar). Önce hiç yoktu. */}
          <div onClick={(e) => {
              e.stopPropagation();
              const r = e.currentTarget.getBoundingClientRect();
              konumaGit((e.clientX - r.left) / r.width);
            }}
            className={cn("absolute inset-x-6 bottom-9 z-10 h-1.5 cursor-pointer rounded-full bg-white/12", suruyor && "hidden")}>
            <span className="block h-full rounded-full bg-aksan transition-[width] duration-100"
              style={{ width: `${Math.round(oran * 100)}%` }} />
          </div>
          <span className="absolute bottom-3 left-6 z-10 text-[12px] tabular-nums text-metin-2">{sureBicim(an)}</span>
          <span className="absolute bottom-3 right-6 z-10 flex items-center gap-1.5 text-[12px] tabular-nums text-metin-2">
            {!gercek && <span className="rounded bg-white/10 px-1 py-0.5 text-[9px] font-medium text-metin-3">demo</span>}
            {sure}
          </span>
        </div>

        {/* SAĞ: prompt kutusu — mod rozeti (hover'da ses/dil kartı) + prompt + araçlar */}
        <div className={cn("flex flex-col rounded-2xl border bg-[var(--sn-panel,#131517)] p-5", secili ? "border-aksan/60" : "border-[var(--sn-kenar)]")}>
          {/* MOD ROZETİ — hover'da kullanılan ses + dil kartı açılır
              (kullanıcı isteği 2026-07-31). Önce yalnız etiketti. */}
          <span className="group/rz relative mb-3 inline-flex w-fit cursor-default items-center gap-1.5 rounded-full border border-[var(--sn-kenar)] px-2.5 py-1 text-[12px] font-medium text-metin">
            <AudioLines className="h-3.5 w-3.5 text-aksan" /> {modAd}
            <span className="pointer-events-none absolute bottom-full left-0 z-30 mb-2 w-56 rounded-xl border border-white/10 bg-[#1c1c1f] p-3 opacity-0 shadow-2xl transition-opacity group-hover/rz:opacity-100">
              <span className="mb-2 block text-[10.5px] font-semibold uppercase tracking-wide text-metin-3">Bu üretimde kullanıldı</span>
              <span className="mb-1.5 flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-aksan/15 text-[11px] font-black text-aksan">{kullanilanSes.slice(0, 1)}</span>
                <span className="min-w-0">
                  <span className="block text-[9.5px] uppercase tracking-wide text-metin-3">Ses</span>
                  <span className="block truncate text-[13px] font-semibold text-white">{kullanilanSes}</span>
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] text-[13px]">
                  {DILLER.find((d) => d.ad.toLocaleLowerCase("tr") === kullanilanDil.toLocaleLowerCase("tr"))?.bayrak ?? "🌐"}
                </span>
                <span className="min-w-0">
                  <span className="block text-[9.5px] uppercase tracking-wide text-metin-3">Dil</span>
                  <span className="block truncate text-[13px] font-semibold text-white">{kullanilanDil}</span>
                </span>
              </span>
            </span>
          </span>
          <p onClick={(e) => { e.stopPropagation(); void kopyala(metin, "İstem kopyalandı"); }}
            title="Tıkla — kopyala"
            className="cursor-copy select-text rounded-md text-[14px] leading-relaxed text-metin transition-colors selection:bg-aksan/30 hover:bg-white/[0.04]">{metin}</p>
          <div className="mt-auto flex items-center justify-between pt-4">
            {/* GERÇEK yeniden çalıştırma — önce yalnız toast basıyordu */}
            <button onClick={(e) => { e.stopPropagation(); onYenidenCalistir(); }}
              className="flex items-center gap-1.5 rounded-lg text-[13px] text-metin-2 transition-colors hover:text-metin"><RotateCcw className="h-4 w-4" /> Yeniden çalıştır</button>
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); onFavori(); }} aria-label="Beğen"
                className={cn("hf-btn flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/8", u.favori ? "text-rose-400" : "text-metin-2 hover:text-metin")}>
                <Heart className={cn("h-4 w-4", u.favori && "fill-current")} /></button>
              <button onClick={(e) => { e.stopPropagation(); onKopya(); }} aria-label="Kopyala" className="hf-btn flex h-8 w-8 items-center justify-center rounded-lg text-metin-2 transition-colors hover:bg-white/8 hover:text-metin"><Copy className="h-4 w-4" /></button>
              <button onClick={(e) => { e.stopPropagation(); onIndir(); }} aria-label="İndir" className="hf-btn flex h-8 w-8 items-center justify-center rounded-lg text-metin-2 transition-colors hover:bg-white/8 hover:text-metin"><Download className="h-4 w-4" /></button>
              <button onClick={(e) => { e.stopPropagation(); onSil(); }} aria-label="Sil" className="flex h-8 w-8 items-center justify-center rounded-lg text-metin-2 transition-colors hover:bg-rose-500/15 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // IZGARA — koyu kutu; üstte prompt, ortada waveform, altta ses adı + süre.
  const sesAdi = (u.model || u.arac || "ROMAN").toUpperCase();
  return (
    <div className="group/sk">
      {/* KÖK <div> (buton DEĞİL): içeride hover araç butonları var ve
          button-in-button geçersiz HTML → hydration hatası veriyordu (ölçüldü).
          Tıklama/klavye erişimi role+tabIndex ile korunur. */}
      <div onClick={onAc} role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onAc(); } }}
        className={cn("relative flex aspect-[16/10] w-full cursor-pointer flex-col overflow-hidden rounded-xl border bg-[#0e0e0f] p-4 text-left transition-colors",
          secili ? "border-aksan/60" : "border-[var(--sn-kenar)] hover:border-[var(--sn-kenar-2)]")}>
        <p className="line-clamp-1 pr-20 text-left text-[13px] text-metin-2">{metin}</p>

        <span className="flex flex-1 items-center justify-center">
          <Waveform tohum={u.id} n={110} className="h-[42%] w-full justify-center" aktif={oyn} />
        </span>

        {/* Aynı `.hf-led` tuzağı — bkz. yukarıdaki not. */}
        <span className="text-left font-mono text-[14px] font-bold uppercase tracking-wide text-metin">{sesAdi}</span>

        <span onClick={(e) => { e.stopPropagation(); onSec(); }}
          className={cn("absolute left-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded-[5px] border-2 backdrop-blur-sm transition-all",
            secili ? "border-aksan bg-aksan text-zemin opacity-100" : "border-white/70 opacity-0 group-hover/sk:opacity-100")}>
          {secili && <Check className="h-3 w-3" strokeWidth={3.5} />}
        </span>

        {/* KALICI BEĞENİ ROZETİ — hover olmadan da görünür (görsel/video ile aynı
            davranış, kullanıcı isteği 2026-07-31). Hover'da ray kalbine yer bırakır. */}
        {u.favori && (
          <span aria-hidden className="kart-begeni pointer-events-none absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full transition-opacity group-hover/sk:opacity-0">
            <Heart className="h-[18px] w-[18px] fill-rose-400 text-rose-400" />
          </span>
        )}

        {/* ÜRETİLİYOR katmanı — ızgara kartında (kullanıcı isteği) */}
        {suruyor ? (
          <span className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-[#0e0e0f]/75 backdrop-blur-sm">
            <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-aksan" />
            <span className="text-[12.5px] font-medium text-white">
              {u.durum === "kuyrukta" ? "Kuyrukta…" : `Üretiliyor · %${u.ilerleme}`}
            </span>
            <span className="h-1 w-28 overflow-hidden rounded-full bg-white/12">
              <span className="block h-full rounded-full bg-aksan transition-[width] duration-300" style={{ width: `${u.ilerleme}%` }} />
            </span>
          </span>
        ) : (
        <span onClick={(e) => { e.stopPropagation(); setOynayan(oyn ? null : u.id); }}
          className={cn("absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white text-zemin shadow-xl transition-all hover:scale-110",
            oyn ? "opacity-100" : "opacity-0 group-hover/sk:opacity-100")}>
          {oyn ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
        </span>
        )}

        {/* Sağ-üst hover araçları — boyut bir tık büyütüldü (28 → 36px,
            ikon 14 → 17px; kullanıcı isteği 2026-07-31). */}
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-2 opacity-0 transition-opacity group-hover/sk:opacity-100">
          {([[Heart, onFavori, !!u.favori], [Download, onIndir, false], [Copy, onKopya, false]] as const).map(([Ik, fn, aktif], i) => (
            <button key={i} onClick={(e) => { e.stopPropagation(); fn(); }}
              className={cn("flex h-9 w-9 items-center justify-center rounded-full glass-ikon transition-colors", aktif ? "text-rose-400" : "text-white/85 hover:text-white")}>
              <Ik className={cn("h-[17px] w-[17px]", aktif && "fill-current")} />
            </button>
          ))}
        </div>

        {/* Çalarken ince ilerleme çubuğu — kartın en altında */}
        {oyn && (
          <span className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
            <span className="block h-full bg-aksan transition-[width] duration-100" style={{ width: `${Math.round(oran * 100)}%` }} />
          </span>
        )}

        <span className="absolute bottom-4 right-4 text-[12px] tabular-nums text-metin-2">{oyn ? sureBicim(an) : sure}</span>
      </div>
    </div>
  );
}

const HIZLAR = [0.5, 1, 1.25, 1.5, 2] as const;
function sesSure(u: Uretim): number {
  // meta.sure "3:24" veya "8.7sn" biçiminde olabilir; ikisini de çöz.
  const s = u.meta?.sure ?? "";
  if (s.includes(":")) { const [d, sn] = s.split(":").map(Number); return (d || 0) * 60 + (sn || 0); }
  const n = parseFloat(s.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 8.7;
}
function zmn(t: number): string {
  const d = Math.floor(t / 60), sn = Math.floor(t % 60);
  return `${d}:${String(sn).padStart(2, "0")}`;
}

function SesOynatici({ u, oyn, onOyn }: { u: Uretim; oyn: boolean; onOyn: (v: boolean) => void }) {
  const sure = useMemo(() => sesSure(u), [u]);
  const bars = useMemo(() => dalga(u.id, 200), [u.id]);
  const [konum, setKonum] = useState(0);
  const [hiz, setHiz] = useState(1);
  const [sesDuzey, setSesDuzey] = useState(1);
  const [hizAcik, setHizAcik] = useState(false);

  // Deterministik ilerleme motoru — çalarken konumu hızla ilerlet.
  useEffect(() => {
    if (!oyn) return;
    const t = setInterval(() => {
      setKonum((k) => {
        const yeni = k + 0.1 * hiz;
        if (yeni >= sure) { onOyn(false); return sure; }
        return yeni;
      });
    }, 100);
    return () => clearInterval(t);
  }, [oyn, hiz, sure, onOyn]);

  const basaSar = () => setKonum((k) => Math.max(0, k - 10));
  const ileriSar = () => setKonum((k) => Math.min(sure, k + 10));
  const oynatDurdur = () => {
    // Sona gelmişse baştan başlat.
    if (!oyn && konum >= sure) setKonum(0);
    onOyn(!oyn);
  };
  const cubugaTikla = (e: React.MouseEvent) => {
    // e.currentTarget: tıklanan öğe (waveform VEYA seek bar) — kendi genişliğine göre hesapla.
    const r = e.currentTarget.getBoundingClientRect();
    setKonum(Math.max(0, Math.min(sure, ((e.clientX - r.left) / r.width) * sure)));
  };
  const oran = sure ? konum / sure : 0;
  const sessiz = sesDuzey === 0;

  return (
    <div className="flex w-full max-w-3xl flex-col items-center">
      {/* Waveform — çalınan kısım lime, kalan gri; tıkla → o konuma atla */}
      <div onClick={cubugaTikla}
        className="flex h-32 w-full cursor-pointer items-center justify-center gap-[2px]" aria-label="Konuma atla" role="slider"
        aria-valuemin={0} aria-valuemax={Math.round(sure)} aria-valuenow={Math.round(konum)}>
        {bars.map((b, i) => (
          <span key={i} className="w-[3px] shrink-0 rounded-full transition-colors"
            style={{ height: `${b}%`, background: i / bars.length <= oran ? "var(--sn-lime)" : "#3a3a3a" }} />
        ))}
      </div>

      {/* Seek bar — ince tıklanabilir progress + zaman göstergesi */}
      <div className="mt-6 flex w-full max-w-xl items-center gap-3">
        <span className="w-11 shrink-0 text-right text-[12px] tabular-nums text-metin-2">{zmn(konum)}</span>
        <button onClick={cubugaTikla} aria-label="Konuma atla"
          className="group/sk relative h-2 min-w-0 flex-1 cursor-pointer rounded-full bg-white/12">
          <span className="absolute inset-y-0 left-0 rounded-full bg-aksan" style={{ width: `${oran * 100}%` }} />
          <span className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-aksan opacity-0 shadow transition-opacity group-hover/sk:opacity-100" style={{ left: `${oran * 100}%` }} />
        </button>
        <span className="w-11 shrink-0 text-[12px] tabular-nums text-metin-2">{zmn(sure)}</span>
      </div>

      {/* Transport: hız · ⟲10 · play/pause · 10⟳ · ses */}
      <div className="mt-6 flex items-center gap-6">
        {/* oynatma hızı */}
        <div className="relative">
          <button onClick={() => setHizAcik((v) => !v)} aria-label="Oynatma hızı"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-metin-2 transition-colors hover:bg-white/8 hover:text-metin">
            <Gauge className="h-4 w-4" /> {hiz}×
          </button>
          <AnimatePresence>
            {hizAcik && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setHizAcik(false)} />
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  className="menu-surface absolute bottom-full left-1/2 z-40 mb-2 w-28 -translate-x-1/2 rounded-xl p-1.5">
                  {HIZLAR.map((h) => (
                    <button key={h} onClick={() => { setHiz(h); setHizAcik(false); }}
                      className={cn("flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[13px] transition-colors hover:bg-white/8",
                        hiz === h ? "text-aksan" : "text-metin")}>
                      {h}× {hiz === h && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <button onClick={basaSar} aria-label="10 saniye geri"
          className="flex flex-col items-center text-metin-2 transition-colors hover:text-metin">
          <Rewind className="h-6 w-6" /><span className="-mt-1 text-[9px] font-bold">10</span>
        </button>
        <button onClick={oynatDurdur} aria-label={oyn ? "Duraklat" : "Oynat"}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-zemin shadow-2xl transition-transform hover:scale-105">
          {oyn ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7 fill-current" />}
        </button>
        <button onClick={ileriSar} aria-label="10 saniye ileri"
          className="flex flex-col items-center text-metin-2 transition-colors hover:text-metin">
          <FastForward className="h-6 w-6" /><span className="-mt-1 text-[9px] font-bold">10</span>
        </button>

        {/* ses seviyesi */}
        <div className="flex items-center gap-2">
          <button onClick={() => setSesDuzey((v) => (v === 0 ? 1 : 0))} aria-label="Sesi aç/kapat"
            className="text-metin-2 transition-colors hover:text-metin">
            {sessiz ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
          <input type="range" min={0} max={1} step={0.05} value={sesDuzey}
            onChange={(e) => setSesDuzey(Number(e.target.value))} aria-label="Ses seviyesi"
            className="h-1.5 w-20 cursor-pointer accent-aksan" />
        </div>
      </div>
    </div>
  );
}

/* Paylaşım hedefleri — kart menüsündeki setle AYNI (tek yerde tanımlı). */
const PAYLAS_HEDEFLERI: { ad: string; ikon: typeof Share2; fn: (u: Uretim) => void }[] = [
  { ad: "Bağlantıyı kopyala", ikon: Link2, fn: (u) => { void baglantiyiKopyala(`/panel/ses?u=${u.id}`, "Bağlantı kopyalandı"); } },
  { ad: "X'te paylaş", ikon: XIkon, fn: (u) => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(u.baslik)}`, "_blank") },
  { ad: "WhatsApp'ta paylaş", ikon: MessageCircle, fn: (u) => window.open(`https://wa.me/?text=${encodeURIComponent(u.baslik)}`, "_blank") },
  { ad: "LinkedIn'de paylaş", ikon: Briefcase, fn: () => window.open("https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(typeof location !== "undefined" ? location.href : ""), "_blank") },
];

function SesDetayDrawer({ u, onKapat, onFavori, onSil, oynayan, setOynayan }: {
  u: Uretim; onKapat: () => void; onFavori: () => void; onSil: () => void; oynayan: string | null; setOynayan: (v: string | null) => void;
}) {
  const [sekme, setSekme] = useState<"bilgi" | "yorum">("bilgi");
  const oyn = oynayan === u.id;
  /* AD DÜZENLEME — indirme dosya adı da bu olur (kullanıcı isteği 2026-07-31). */
  const guncelleUretim = useProjeler((s) => s.guncelle);
  const [adDuzenleniyor, setAdDuzenleniyor] = useState(false);
  const [adTaslak, setAdTaslak] = useState("");
  const [paylasAcik, setPaylasAcik] = useState(false);
  /** İndirme — kullanıcının verdiği AD dosya adı olur. */
  const sesIndir = () => {
    const ad = (u.baslik.replace(/[^\wğüşiöçİĞÜŞÖÇ -]/gi, "").trim().slice(0, 60) || "vayra-ses");
    if (u.sesUrl) {
      const a = document.createElement("a");
      a.href = u.sesUrl; a.download = `${ad}.mp3`;
      document.body.appendChild(a); a.click(); a.remove();
      toast.success("Ses indiriliyor 🎧", { description: `${ad}.mp3` });
      return;
    }
    uretimIndir(u);
  };
  const adKaydet = () => {
    const yeni = adTaslak.trim();
    setAdDuzenleniyor(false);
    if (!yeni || yeni === u.baslik) return;
    guncelleUretim(u.id, { baslik: yeni });
    toast.success("Ad güncellendi", { description: `${yeni}.mp3 olarak inecek` });
  };
  // m23: GERÇEK yorumlar (useYorumlar) — kalıcı, emoji, göreli zaman.
  const [yorumMetin, setYorumMetin] = useState("");
  const [sesEmojiAcik, setSesEmojiAcik] = useState(false);
  const yorumEkle = useYorumlar((s) => s.ekle);
  const yorumBegeni = useYorumlar((s) => s.begeniToggle);
  const yorumSilStore = useYorumlar((s) => s.sil);
  const tumYorumlar = useYorumlar((s) => s.yorumlar);
  const yorumlar = useMemo(() => tumYorumlar.filter((y) => y.konuId === u.id).sort((a, b) => b.zaman - a.zaman), [tumYorumlar, u.id]);
  const SES_EMOJI = ["❤️", "🔥", "😍", "👏", "🤩", "💯", "🎧", "🎉"];
  const olusturma = useMemo(() => { const d = new Date(u.olusturma); const AY = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]; return `${d.getDate()} ${AY[d.getMonth()]} ${d.getFullYear()}`; }, [u.olusturma]);
  // Higgsfield DETAILS birebir sırası.
  const detaylar: [string, string][] = [
    ["Ses Ön-ayarı", u.meta?.ses ?? "Roman"], ["Model", u.model], ["Süre", "8.7sn"], ["Hız", "1.0×"],
    ["Ses Düzeyi", "1.0×"], ["Perde", "0"], ["Biçim", "WAV"], ["Örnekleme Hızı", "24000 Hz"], ["Oluşturuldu", olusturma],
  ];
  /* Yeniden Üret — GERÇEK üretim (kredi düşer, kuyruğa girer, kitaplığa yazılır). */
  const yenidenUret = () => {
    const sonuc = uretimBaslatHam({
      baslik: u.baslik, tur: u.tur, model: u.model,
      prompt: u.prompt || u.baslik, kredi: u.kredi || 1,
      arac: u.arac ?? "Ses Stüdyosu", meta: u.meta,
    });
    if (!sonuc.ok) return uretimHataToast(sonuc);
    toast.success("Yeniden üretiliyor ✦", { description: `${u.baslik} · ${u.kredi || 1} kredi` });
    onKapat();
  };
  return (
    // Higgsfield /audio detay BİREBİR: TAM EKRAN split — SOL büyük ses alanı
    // (boydan boya waveform + merkez play), SAĞ ~400px panel (Bilgi/Yorumlar,
    // PROMPT kutusu, DETAYLAR, altta Yeniden Üret + İndir + ♡/paylaş/⋯).
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[65] bg-black/80 backdrop-blur-xl" onClick={onKapat} />
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2 }} onClick={(e) => e.stopPropagation()}
        className="fixed inset-0 z-[66] flex">
        {/* SOL: büyük ses sahnesi + GERÇEK oynatıcı */}
        <div className="relative flex min-w-0 flex-1 flex-col items-center justify-center overflow-hidden p-8">
          <SesOynatici u={u} oyn={oyn} onOyn={(v) => setOynayan(v ? u.id : null)} />
        </div>

        {/* SAĞ: panel */}
        <aside className="flex h-full w-[400px] max-w-full shrink-0 flex-col border-l border-[var(--sn-kenar)] bg-yuzey">
          {/* BAŞLIK — üretimin ADI, kalemle düzenlenir ve İNDİRME DOSYA ADI da
              bu olur (görsel sayfasıyla aynı; kullanıcı isteği 2026-07-31).
              Eskiden "Sen / Üretici" yazıyordu — hiçbir bilgi taşımıyordu. */}
          <div className="flex items-center gap-2 border-b border-[var(--sn-kenar)] px-4 py-3.5">
            {adDuzenleniyor ? (
              <input autoFocus value={adTaslak} onChange={(e) => setAdTaslak(e.target.value)}
                onBlur={adKaydet}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); adKaydet(); }
                  if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setAdDuzenleniyor(false); }
                }}
                aria-label="Üretim adı"
                className="min-w-0 flex-1 rounded-lg bg-white/8 px-2.5 py-1.5 text-[15px] font-semibold text-white outline-none ring-1 ring-aksan/50" />
            ) : (
              <button onClick={() => { setAdTaslak(u.baslik); setAdDuzenleniyor(true); }}
                className="group/ad flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-white/6"
                title="Adı düzenle">
                <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-metin">{u.baslik}</span>
                <Pencil className="h-3.5 w-3.5 shrink-0 text-metin-3 transition-colors group-hover/ad:text-aksan" />
              </button>
            )}
            <button onClick={onKapat} className="hf-btn glass-ikon flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-metin-2" aria-label="Kapat"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex items-center gap-1.5 px-4 py-3">
            {([["bilgi", "Bilgi", InfoIcon], ["yorum", "Yorumlar", MessageCircle]] as const).map(([id, ad, Ik]) => (
              <button key={id} onClick={() => setSekme(id)} className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-medium transition-colors", sekme === id ? "glass-cip-aktif text-white" : "glass-cip text-metin-2 hover:text-metin")}><Ik className="h-3.5 w-3.5" />{ad}</button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-4">
            {sekme === "bilgi" ? (
              <div className="space-y-5">
                {/* İSTEM — lime dalga ikonu + kutu içinde prompt + Kopyala (Higgsfield birebir) */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold tracking-wide text-metin-3">İSTEM</span>
                    <button onClick={() => { void kopyala(u.prompt || u.baslik, "İstem kopyalandı"); }} className="flex items-center gap-1 text-[12px] text-metin-2 hover:text-metin"><Copy className="h-3.5 w-3.5" />Kopyala</button>
                  </div>
                  <div className="panel-ic rounded-xl p-3">
                    <span className="mb-2.5 flex h-11 w-11 items-center justify-center rounded-lg glass-ikon glass-ikon-lime"><AudioLines className="h-5 w-5" /></span>
                    <p className="text-[13.5px] leading-relaxed text-metin-2">{u.prompt || u.baslik}</p>
                  </div>
                </div>
                {/* DETAYLAR */}
                <div>
                  <span className="mb-2 block text-[11px] font-semibold tracking-wide text-metin-3">DETAYLAR</span>
                  <div className="panel-ic space-y-2 rounded-xl p-3 text-[13.5px]">
                    {detaylar.map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between gap-3">
                        <span className="text-metin-3">{k}</span>
                        {k === "Ses Ön-ayarı"
                          ? <span className="flex items-center gap-2 font-medium text-metin">{v}<span className="h-5 w-5 rounded bg-gradient-to-br from-violet-500 to-violet-700" /></span>
                          : <span className="truncate text-right font-medium text-metin">{v}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* m23: GERÇEK yorumlar — higgs birebir görünüm (avatar + zaman + emoji büyük) */
              yorumlar.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center"><div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full glass-ikon"><MessageCircle className="h-6 w-6 text-metin-3" /></div><p className="text-sm text-metin-2">Henüz yorum yok</p><p className="mt-1 text-[12px] text-metin-3">İlk yorumu sen yaz</p></div>
              ) : (
                <div className="space-y-3 py-3">
                  {yorumlar.map((y) => {
                    const saltEmoji = /^(\p{Extended_Pictographic}|️|‍|\s){1,8}$/u.test(y.metin);
                    return (
                      <div key={y.id} className="group/y flex gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-aksan to-amber-400 text-[11px] font-bold text-zemin">{y.yazar.charAt(0).toLocaleUpperCase("tr")}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2"><span className="text-[13px] font-medium text-metin">{y.yazar}</span><span className="text-[11px] text-metin-3">{goreliZaman(y.zaman)}</span></div>
                          <p className={cn("mt-0.5 break-words text-metin-2", saltEmoji ? "text-3xl leading-tight" : "text-[13px]")}>{y.metin}</p>
                          <div className="mt-1 flex items-center gap-3">
                            <button onClick={() => yorumBegeni(y.id)} className={cn("flex items-center gap-1 text-[11px] transition-colors", y.begendim ? "text-rose-400" : "text-metin-3 hover:text-metin")}><Heart className={cn("h-3 w-3", y.begendim && "fill-current")} />{y.begeniler > 0 && y.begeniler}</button>
                            <button onClick={() => yorumSilStore(y.id)} className="text-[11px] text-metin-3 opacity-0 transition-all hover:text-rose-400 group-hover/y:opacity-100">Sil</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>

          {/* m23: yorum sekmesi giriş kutusu — panel dibinde sabit */}
          {sekme === "yorum" && (
            <div className="border-t border-[var(--sn-kenar)] p-3">
              <div className="mb-2 flex flex-wrap gap-0.5">
                {SES_EMOJI.map((e) => (
                  <button key={e} onClick={() => yorumEkle(u.id, e, "Sen")} className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-white/8">{e}</button>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white/[0.05] p-2">
                <input value={yorumMetin} onChange={(e) => setYorumMetin(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && yorumMetin.trim()) { yorumEkle(u.id, yorumMetin.trim(), "Sen"); setYorumMetin(""); } }}
                  placeholder="Yorum ekle…" className="h-8 flex-1 bg-transparent px-2 text-sm text-metin outline-none placeholder:text-metin-3" />
                <button onClick={() => { if (yorumMetin.trim()) { yorumEkle(u.id, yorumMetin.trim(), "Sen"); setYorumMetin(""); } }}
                  disabled={!yorumMetin.trim()} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-aksan text-zemin transition-transform hover:scale-105 disabled:opacity-40" aria-label="Gönder"><ChevronDown className="h-4 w-4 -rotate-90" /></button>
              </div>
            </div>
          )}
          {sekme === "bilgi" && (
            <div className="border-t border-[var(--sn-kenar)] p-4">
              <div className="mb-2 grid grid-cols-2 gap-2">
                <button onClick={yenidenUret} className="flex items-center justify-center gap-2 rounded-xl bg-aksan py-2.5 text-[14px] font-semibold text-zemin transition-transform hover:scale-[1.02]"><RefreshCw className="h-4 w-4" />Yeniden Üret</button>
                <button onClick={sesIndir} className="hf-btn glass-cip flex items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-medium text-metin"><Download className="h-4 w-4" />İndir</button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onFavori} className={cn("hf-btn glass-cip flex h-11 flex-1 items-center justify-center rounded-xl", u.favori && "text-rose-400")}><Heart className={cn("h-4 w-4", u.favori && "fill-current")} /></button>
                {/* PAYLAŞ — tek eylem yerine GERÇEK paylaşım menüsü
                    (bağlantı + X + WhatsApp + LinkedIn); kart menüsüyle aynı set. */}
                <div className="relative flex-1">
                  <button onClick={() => setPaylasAcik((v) => !v)}
                    className="hf-btn glass-cip flex h-11 w-full items-center justify-center rounded-xl text-metin" aria-label="Paylaş"><Share2 className="h-4 w-4" /></button>
                  <AnimatePresence>
                    {paylasAcik && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setPaylasAcik(false)} />
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                          className="menu-surface absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-xl p-1.5">
                          {PAYLAS_HEDEFLERI.map((h) => (
                            <button key={h.ad} onClick={() => { h.fn(u); setPaylasAcik(false); }}
                              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-metin transition-colors hover:bg-white/8">
                              <h.ikon className="h-4 w-4 text-metin-2" /> {h.ad}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
                <button onClick={onSil} className="hf-btn glass-cip flex h-11 flex-1 items-center justify-center rounded-xl text-metin transition-colors hover:text-rose-400" aria-label="Sil"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </aside>
      </motion.div>
    </>
  );
}

function AyarSlider({ ad, v, min, max, step, onChange, birim }: { ad: string; v: number; min: number; max: number; step: number; onChange: (n: number) => void; birim: string }) {
  return (
    <div className="mb-3">
      <div className="mb-1.5 flex items-center justify-between text-[13px]"><span className="text-metin-2">{ad}</span><span className="hf-led text-aksan" style={{ fontSize: 12 }}>{v}{birim}</span></div>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => onChange(Number(e.target.value))} className="h-1 w-full cursor-pointer accent-aksan" />
    </div>
  );
}
