"use client";

/**
 * SesSeciciModal + DilSeciciModal + SesEkleModal
 * ────────────────────────────────────────────────────────────────────────────
 * /panel/ses sayfasındaki ses seçme, ses ekleme ve dil seçme ekranlarının
 * ORTAK, her yerden çağrılabilir hâli.
 *
 * Neden ayrı dosya: kart menüsündeki "Sesi Değiştir" ve "Çevir" eylemleri
 * yalnız toast basıyordu (kullanıcı: "fake"). Aynı ekranı /panel/ses içinde
 * kopyalamak yerine buraya taşıdık; iki yer de aynı bileşeni kullanır.
 *
 * Tümü ekranın ORTASINDA açılır (kullanıcı isteği) — /panel/ses'teki
 * composer-üstü popover yerleşimi burada geçerli değil, çünkü çağıran taraf
 * bir kart menüsü; bağlı olduğu bir composer yok.
 */

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Mic, Play, Pause, Check, Search, Upload, Square } from "lucide-react";
import { SESLER, DILLER, sesGorsel, type SesModel } from "@/lib/sesVeri";
import { useMuzik } from "@/store/useMuzik";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { cn } from "@/lib/utils";

/* Ses portre görselleri henüz üretilmedi (public/gercek/ses/ dizini yok).
   Görseller eklenince BURAYI true yap — kod hazır. */
const SES_GORSEL_VAR = false;

/** Bir tetikleyici elemanın SAĞINA açılacak konum (yandan açılan mod). */
export type YanKonum = { top: number; left: number };

/** Ortak modal kabuğu — karartma + ortalanmış kutu (portal ile body'ye).
    `yan` verilirse ortalamak yerine o koordinata oturur: /panel/explainer'da
    ses seçici composer kutusunun SAĞINDA açılıyor (kullanıcı isteği). */
function ModalKabuk({
  baslik, ozet, onKapat, genislik = 860, children, zIndex = 240, yan,
}: {
  baslik: string; ozet?: string; onKapat: () => void;
  genislik?: number; children: React.ReactNode; zIndex?: number;
  yan?: YanKonum | null;
}) {
  useScrollKilit(true);
  useEscKapat(true, onKapat);
  if (typeof document === "undefined") return null;
  return createPortal(
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onKapat} style={{ zIndex }}
        className={cn("fixed inset-0", yan ? "bg-black/45" : "perde bg-black/70 backdrop-blur-sm")} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: yan ? 0 : 12, x: yan ? -8 : 0 }}
        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }} exit={{ opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 360, damping: 30 }}
        style={yan
          ? { zIndex: zIndex + 1, width: `min(94vw, ${genislik}px)`, position: "fixed", top: yan.top, left: yan.left }
          : { zIndex: zIndex + 1, width: `min(94vw, ${genislik}px)` }}
        className={cn("flex max-h-[88vh] flex-col overflow-hidden rounded-[22px] border border-white/[0.09] bg-[#1b1c1f]",
          yan ? "" : "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2")}>
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--sn-kenar)] p-5">
          <div className="min-w-0">
            <h3 className="text-[19px] font-semibold tracking-[-0.01em] text-metin">{baslik}</h3>
            {ozet && <p className="mt-1 text-[13px] text-metin-2">{ozet}</p>}
          </div>
          <button onClick={onKapat} aria-label="Kapat"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-white/[0.07] hover:text-metin">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </>,
    document.body,
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* 1) SES SEÇİCİ — hazır sesler + özel sesler + "Ses ekle"                    */
/* ══════════════════════════════════════════════════════════════════════════ */
export function SesSeciciModal({
  seciliAd, onSec, onKapat, baslik = "Ses seç ya da ekle", yan,
}: {
  seciliAd?: string;
  onSec: (s: SesModel) => void;
  onKapat: () => void;
  baslik?: string;
  /** Verilirse ortalanmaz — bu koordinata (tetikleyicinin sağına) oturur. */
  yan?: YanKonum | null;
}) {
  const kayitliSesler = useMuzik((s) => s.sesler);
  const [ara, setAra] = useState("");
  const [oynayan, setOynayan] = useState<string | null>(null);
  const [sesEkle, setSesEkle] = useState(false);
  const [cins, setCins] = useState<"hepsi" | "Kadın" | "Erkek">("hepsi");

  const ozelSesler = useMemo<SesModel[]>(
    () => kayitliSesler.map((s) => ({
      ad: s.ad,
      cinsiyet: s.cinsiyet === "Erkek" ? "Erkek" : "Kadın",
      renk: "#55d6fd",
      dil: "Türkçe",
    })),
    [kayitliSesler],
  );

  const q = ara.toLocaleLowerCase("tr");
  const suz = (l: SesModel[]) => l.filter((s) => (!q || s.ad.toLocaleLowerCase("tr").includes(q)) && (cins === "hepsi" || s.cinsiyet === cins));
  const ozelSuzulen = suz(ozelSesler);
  const hazirSuzulen = suz(SESLER);

  const SesKarti = (s: SesModel, ozel: boolean) => {
    const secili = seciliAd === s.ad;
    const oyn = oynayan === s.ad;
    return (
      <button key={(ozel ? "o-" : "h-") + s.ad}
        onClick={() => { onSec(s); onKapat(); }}
        className={cn("group flex items-center gap-3 rounded-[14px] p-2.5 text-left ring-1 ring-inset transition-colors",
          secili ? "bg-aksan/[0.08] ring-aksan/60" : "bg-white/[0.03] ring-white/[0.07] hover:bg-white/[0.06]")}>
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-[16px] font-semibold text-white/90" style={{ background: `linear-gradient(140deg, ${s.renk}, ${s.renk}55)` }}>
          {SES_GORSEL_VAR && !ozel ? <img src={sesGorsel(s.ad)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : s.ad.slice(0, 1)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5"><span className="truncate text-[14.5px] font-semibold text-metin">{s.ad}</span>{secili && <Check className="h-3.5 w-3.5 shrink-0 text-aksan" strokeWidth={3} />}</span>
          <span className="mt-0.5 block truncate text-[12px] text-metin-3">{s.cinsiyet} · {ozel ? "Özel ses" : s.dil}</span>
          <span className="mt-1 block"><SesDalga tohum={s.ad} aktif={oyn} /></span>
        </span>
        <span onClick={(e) => { e.stopPropagation(); setOynayan(oyn ? null : s.ad); }} role="button" aria-label={oyn ? "Durdur" : "Dinle"}
          className={cn("flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors", oyn ? "bg-white text-[#0b0c0e]" : "bg-white/[0.07] text-metin hover:bg-white/[0.12]")}>
          {oyn ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />}
        </span>
      </button>
    );
  };

  return (
    <>
      <ModalKabuk baslik={baslik} ozet="Hazır seslerden seç, kendi sesini kaydet ya da bir ses yükle." onKapat={onKapat}
        yan={yan} genislik={yan ? 720 : 860}>
        {/* Ara + Ses ekle */}
        <div className="flex shrink-0 items-center gap-3 border-b border-[var(--sn-kenar)] px-5 py-3.5">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white/[0.05] px-3.5 py-2.5 ring-1 ring-inset ring-white/[0.08] focus-within:ring-aksan/50">
            <Search className="h-4 w-4 shrink-0 text-metin-3" />
            <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ses ara" autoFocus
              className="w-full bg-transparent text-[14px] text-metin outline-none placeholder:text-metin-2" />
          </div>
          <div className="hidden shrink-0 gap-0.5 rounded-full bg-white/[0.04] p-[3px] ring-1 ring-inset ring-white/[0.06] sm:flex">
            {(["hepsi", "Kadın", "Erkek"] as const).map((c) => <button key={c} onClick={() => setCins(c)} aria-pressed={cins === c} className={cn("h-8 rounded-full px-3 text-[12.5px] font-medium transition-colors", cins === c ? "bg-white/[0.12] text-metin" : "text-metin-2 hover:text-metin")}>{c === "hepsi" ? "Tümü" : c}</button>)}
          </div>
          <button onClick={() => setSesEkle(true)}
            className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-semibold text-[#0b0c0e] transition-opacity hover:opacity-90">
            <Mic className="h-4 w-4" /> Ses ekle
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {ozelSuzulen.length > 0 && (
            <>
              <p className="mb-2.5 text-[13px] font-semibold text-metin">Özel seslerin</p>
              <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {ozelSuzulen.map((s) => SesKarti(s, true))}
              </div>
              <p className="mb-2.5 text-[13px] font-semibold text-metin">Hazır sesler</p>
            </>
          )}
          {hazirSuzulen.length === 0 && ozelSuzulen.length === 0 ? (
            <p className="py-16 text-center text-[13px] text-metin-3">"{ara}" ile eşleşen ses yok.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {hazirSuzulen.map((s) => SesKarti(s, false))}
            </div>
          )}
        </div>
      </ModalKabuk>

      {sesEkle && (
        <SesEkleModal
          onKapat={() => setSesEkle(false)}
          onOlustu={(s) => { setSesEkle(false); onSec(s); onKapat(); }}
        />
      )}
    </>
  );
}

/** Küçük dekoratif dalga — deterministik (SSR güvenli). */
function SesDalga({ tohum, aktif }: { tohum: string; aktif: boolean }) {
  const barlar = useMemo(() => {
    let h = 0;
    for (let i = 0; i < tohum.length; i++) h = (h * 31 + tohum.charCodeAt(i)) >>> 0;
    return Array.from({ length: 16 }, (_, i) => {
      h = (h * 1103515245 + 12345) >>> 0;
      return 25 + ((h >>> 8) % 70);
    });
  }, [tohum]);
  return (
    <span className="flex h-4 flex-1 items-center gap-[2px]">
      {barlar.map((b, i) => (
        <span key={i} className={cn("w-[2px] rounded-full transition-colors", aktif ? "bg-aksan" : "bg-white/25")}
          style={{ height: `${b}%` }} />
      ))}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* 2) SES EKLE — Higgsfield "Add Voice" (ad + örnek yükle/kaydet + klonla)     */
/* ══════════════════════════════════════════════════════════════════════════ */
export function SesEkleModal({ onKapat, onOlustu }: {
  onKapat: () => void;
  onOlustu?: (s: SesModel) => void;
}) {
  const kayitliSesler = useMuzik((s) => s.sesler);
  const sesKaydet = useMuzik((s) => s.sesKaydet);
  const [ad, setAd] = useState("");
  const [cinsiyet, setCinsiyet] = useState<"Kadın" | "Erkek">("Kadın");
  const [dosya, setDosya] = useState<string | null>(null);
  const [kayit, setKayit] = useState(false);
  const [kayitSn, setKayitSn] = useState(0);
  const [kaynak, setKaynak] = useState<"kaydet" | "yukle">("kaydet");
  const dosyaRef = useRef<HTMLInputElement>(null);
  const sayacRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const kayitBaslat = () => {
    setDosya(null); setKayitSn(0); setKayit(true);
    sayacRef.current = setInterval(() => setKayitSn((n) => n + 1), 1000);
  };
  const kayitDurdur = () => {
    setKayit(false);
    if (sayacRef.current) { clearInterval(sayacRef.current); sayacRef.current = null; }
  };

  const olustur = () => {
    const temiz = ad.trim();
    if (temiz.length < 2) { toast.error("Ses adı eksik", { description: "En az 2 karakterlik bir ad yaz." }); return; }
    if (!dosya && kayitSn < 3) {
      toast.error("Örnek ses eksik", { description: "Bir ses dosyası yükle ya da en az 3 saniye kaydet." });
      return;
    }
    if (kayitliSesler.some((s) => s.ad.toLocaleLowerCase("tr") === temiz.toLocaleLowerCase("tr"))) {
      toast.error("Bu ad kullanımda", { description: `${temiz} adında bir özel ses zaten var. Başka bir ad seç.` }); return;
    }
    kayitDurdur();
    sesKaydet({ ad: temiz, cinsiyet, tohum: "ozel-" + temiz.toLocaleLowerCase("tr"), kaydedilmis: true });
    toast.success(`${temiz} sesi eklendi`, { description: "Artık ses seçicide görünüyor." });
    onOlustu?.({ ad: temiz, cinsiyet, renk: "#55d6fd", dil: "Türkçe" });
    onKapat();
  };

  return (
    <ModalKabuk baslik="Ses ekle" ozet="Klonlamak için bir ses örneği kaydet ya da yükle." onKapat={() => { kayitDurdur(); onKapat(); }} genislik={620} zIndex={250}>
      <input ref={dosyaRef} type="file" accept="audio/*" className="hidden"
        onChange={(e) => {
          const d = e.target.files?.[0]; e.target.value = "";
          if (!d) return;
          if (d.size > 11 * 1024 * 1024) { mesaj.dosyaCokBuyuk(11); return; }
          kayitDurdur(); setKayitSn(0); setDosya(d.name);
          toast.success("Örnek ses yüklendi", { description: d.name });
        }} />

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-metin-2">Sesin adı</span>
            <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Örn. Benim sesim" autoFocus
              className="h-11 w-full rounded-[12px] bg-white/[0.05] px-3.5 text-[14.5px] text-metin outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-metin-2 focus:ring-aksan/50" />
          </label>
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-metin-2">Ton</span>
            <div className="flex h-11 gap-0.5 rounded-[12px] bg-white/[0.04] p-[3px] ring-1 ring-inset ring-white/[0.06]">
              {(["Kadın", "Erkek"] as const).map((c) => (
                <button key={c} onClick={() => setCinsiyet(c)} aria-pressed={cinsiyet === c}
                  className={cn("rounded-[9px] px-4 text-[13px] font-medium transition-colors", cinsiyet === c ? "bg-white/[0.12] text-metin" : "text-metin-2 hover:text-metin")}>{c}</button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex gap-0.5 rounded-full bg-white/[0.04] p-[3px] ring-1 ring-inset ring-white/[0.06]">
            {([["kaydet", "Kendi sesini kaydet", Mic], ["yukle", "Dosya yükle", Upload]] as const).map(([id, a, I]) => (
              <button key={id} onClick={() => { if (id === "yukle") kayitDurdur(); setKaynak(id); }} aria-pressed={kaynak === id}
                className={cn("flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] font-medium transition-colors", kaynak === id ? "bg-white/[0.12] text-metin" : "text-metin-2 hover:text-metin")}>
                <I className="h-4 w-4" />{a}
              </button>
            ))}
          </div>
          {kaynak === "kaydet" ? (
            <div className="rounded-[18px] bg-white/[0.03] p-5 ring-1 ring-inset ring-white/[0.07]">
              <p className="text-[12.5px] font-medium text-metin-2">Bu metni doğal bir tonla oku</p>
              <p className="mt-2 text-[16px] leading-relaxed text-metin">Bugün hava çok güzel. Sabah erkenden kalkıp sahil boyunca yürüdüm; martıların sesi ve dalgaların ritmi bana eşlik etti.</p>
              <div className="mt-5 flex items-center gap-4">
                <button onClick={() => (kayit ? kayitDurdur() : kayitBaslat())} aria-label={kayit ? "Kaydı durdur" : "Kaydı başlat"}
                  className={cn("relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-colors", kayit ? "bg-rose-500 text-white" : "bg-white text-[#0b0c0e] hover:opacity-90")}>
                  {kayit && <span className="absolute inset-0 animate-ping rounded-full bg-rose-500/40" />}
                  {kayit ? <Square className="relative h-5 w-5 fill-current" /> : <Mic className="h-6 w-6" />}
                </button>
                <div className="flex h-10 min-w-0 flex-1 items-center gap-[3px]">
                  {Array.from({ length: 36 }, (_, i) => (
                    <span key={i} className={cn("flex-1 rounded-full transition-all duration-300", kayit ? "bg-rose-300/80" : kayitSn >= 3 ? "bg-aksan/70" : "bg-white/15")}
                      style={{ height: `${kayit || kayitSn ? 20 + Math.abs(Math.sin((i + kayitSn * 3) * 0.9)) * 80 : 18}%` }} />
                  ))}
                </div>
                <span className="w-14 text-right text-[15px] font-semibold tabular-nums text-metin">{Math.floor(kayitSn / 60)}:{String(kayitSn % 60).padStart(2, "0")}</span>
              </div>
              <p className="mt-3 text-[12.5px] text-metin-3">{kayit ? "Kaydediliyor, bitince durdur." : kayitSn >= 3 ? "Kayıt hazır. Yeniden kaydetmek için mikrofona bas." : "Mikrofona bas, en az 3 sn konuş. 10–30 sn en iyi sonucu verir."}</p>
            </div>
          ) : (
            <button onClick={() => dosyaRef.current?.click()}
              className={cn("flex w-full flex-col items-center justify-center gap-2.5 rounded-[18px] border border-dashed px-4 py-10 transition-colors",
                dosya ? "border-aksan/60 bg-aksan/[0.05]" : "border-white/[0.16] hover:border-white/30 hover:bg-white/[0.02]")}>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.07] text-metin">{dosya ? <Check className="h-5 w-5 text-aksan" /> : <Upload className="h-5 w-5" />}</span>
              <span className="text-[15px] font-semibold text-metin">{dosya ? "Örnek yüklendi" : "Ses dosyası seç"}</span>
              <span className="max-w-full truncate text-[12.5px] text-metin-2">{dosya ?? "MP3 ya da WAV · en fazla 11 MB · tek konuşmacı"}</span>
            </button>
          )}
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12.5px] text-metin-3">
          {["Sessiz bir ortam", "Tek konuşmacı", "Müzik ya da efekt yok"].map((x) => <li key={x} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" />{x}</li>)}
        </ul>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-4">
        <span className="text-[12.5px] text-metin-3">Klonlama 40 kredi</span>
        <div className="flex items-center gap-2">
          <button onClick={() => { kayitDurdur(); onKapat(); }}
            className="h-10 rounded-full px-4 text-[13.5px] font-medium text-metin-2 transition-colors hover:bg-white/[0.06] hover:text-metin">İptal</button>
          <button onClick={olustur}
            className="hf-cta h-10 rounded-full px-5 text-[13.5px] font-semibold">Sesi klonla</button>
        </div>
      </div>
    </ModalKabuk>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* 3) DİL SEÇİCİ — "Çevir" için (bayrak + dil adı ızgarası)                   */
/* ══════════════════════════════════════════════════════════════════════════ */
export function DilSeciciModal({
  seciliAd, onSec, onKapat, baslik = "Hedef dili seç", ozet = "Videonun dublajı ve altyazısı bu dile çevrilecek.",
}: {
  seciliAd?: string;
  onSec: (d: { ad: string; bayrak: string }) => void;
  onKapat: () => void;
  baslik?: string;
  ozet?: string;
}) {
  const [ara, setAra] = useState("");
  const q = ara.toLocaleLowerCase("tr");
  const liste = q ? DILLER.filter((d) => d.ad.toLocaleLowerCase("tr").includes(q)) : DILLER;

  return (
    <ModalKabuk baslik={baslik} ozet={ozet} onKapat={onKapat} genislik={720}>
      <div className="shrink-0 border-b border-[var(--sn-kenar)] px-5 py-3.5">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--sn-kenar)] bg-black/30 px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-metin-3" />
          <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Dil ara" autoFocus
            className="w-full bg-transparent text-[14px] text-metin outline-none placeholder:text-metin-3" />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {liste.length === 0 ? (
          <p className="py-16 text-center text-[13px] text-metin-3">"{ara}" ile eşleşen dil yok.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {liste.map((d) => {
              const secili = seciliAd === d.ad;
              return (
                <button key={d.ad} onClick={() => { onSec(d); onKapat(); }}
                  className={cn("flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all",
                    secili ? "border-aksan bg-aksan/[0.08] ring-1 ring-aksan/30" : "border-[var(--sn-kenar)] hover:border-[var(--sn-kenar-2)] hover:bg-white/[0.03]")}>
                  <span className="text-[22px] leading-none">{d.bayrak}</span>
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-metin">{d.ad}</span>
                  {secili && <Check className="h-4 w-4 shrink-0 text-aksan" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </ModalKabuk>
  );
}
