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
        className={cn("fixed inset-0", yan ? "bg-black/45" : "bg-black/70 backdrop-blur-sm")} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: yan ? 0 : 12, x: yan ? -8 : 0 }}
        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }} exit={{ opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 360, damping: 30 }}
        style={yan
          ? { zIndex: zIndex + 1, width: `min(94vw, ${genislik}px)`, position: "fixed", top: yan.top, left: yan.left }
          : { zIndex: zIndex + 1, width: `min(94vw, ${genislik}px)` }}
        className={cn("flex max-h-[88vh] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#0f1113] shadow-2xl shadow-black/60",
          yan ? "" : "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2")}>
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--sn-kenar)] p-5">
          <div className="min-w-0">
            <h3 className="text-[20px] font-black text-metin">{baslik}</h3>
            {ozet && <p className="mt-1 text-[13px] text-metin-2">{ozet}</p>}
          </div>
          <button onClick={onKapat} aria-label="Kapat"
            className="hf-btn glass-ikon flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-metin-2">
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
  seciliAd, onSec, onKapat, baslik = "BİR SES SEÇ VEYA EKLE", yan,
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
  const suz = (l: SesModel[]) => (q ? l.filter((s) => s.ad.toLocaleLowerCase("tr").includes(q)) : l);
  const ozelSuzulen = suz(ozelSesler);
  const hazirSuzulen = suz(SESLER);

  const SesKarti = (s: SesModel, ozel: boolean) => {
    const secili = seciliAd === s.ad;
    const oyn = oynayan === s.ad;
    return (
      <button key={(ozel ? "o-" : "h-") + s.ad}
        onClick={() => { onSec(s); onKapat(); }}
        className={cn("group flex flex-col overflow-hidden rounded-xl border text-left transition-all",
          secili ? "border-aksan ring-2 ring-aksan/30" : "border-[var(--sn-kenar)] hover:border-[var(--sn-kenar-2)]")}>
        {/* Portre görselleri (public/gercek/ses/*.webp) HENÜZ ÜRETİLMEDİ —
            dizin yok. Her kart için 404 atmak yerine (ölçüm: bir açılışta 40
            başarısız istek) gradyan + baş harf kapağı gösteriyoruz. Görseller
            eklendiğinde `SES_GORSEL_VAR` true yapılır. */}
        <div className="relative flex h-24 w-full items-center justify-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${s.renk}, ${s.renk}66)` }}>
          {SES_GORSEL_VAR && !ozel ? (
            <img src={sesGorsel(s.ad)} alt="" loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
              onError={(e) => { e.currentTarget.style.display = "none"; }} />
          ) : (
            <span className="text-[30px] font-black text-black/25">{s.ad.slice(0, 1)}</span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {secili && (
            <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-aksan text-zemin">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
          )}
        </div>
        <div className="p-2.5">
          <span className="text-[10px] text-metin-3">{s.cinsiyet} · {ozel ? "Özel" : s.dil}</span>
          {/* `.hf-led` (dot-matrix) KULLANILMADI: o sınıf `color: transparent` +
              `background-clip: text` ile çalışıyor ve dotları `currentColor`dan
              alıyor — bu kartta ad tamamen görünmez oluyordu (ölçüldü). Seçici
              ekranında okunurluk imzadan önce gelir. */}
          <div className="mt-0.5 truncate font-mono text-[15px] font-bold uppercase tracking-wide text-white">{s.ad}</div>
          <div className="mt-1.5 flex items-center gap-2">
            <span onClick={(e) => { e.stopPropagation(); setOynayan(oyn ? null : s.ad); }}
              className="glass-ikon flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-metin">
              {oyn ? <Pause className="h-3 w-3" /> : <Play className="ml-0.5 h-3 w-3 fill-current" />}
            </span>
            <SesDalga tohum={s.ad} aktif={oyn} />
          </div>
        </div>
      </button>
    );
  };

  return (
    <>
      <ModalKabuk baslik={baslik} ozet="Hazır seslerden seç, kendi sesini kaydet ya da bir ses yükle." onKapat={onKapat}
        yan={yan} genislik={yan ? 720 : 860}>
        {/* Ara + Ses ekle */}
        <div className="flex shrink-0 items-center gap-3 border-b border-[var(--sn-kenar)] px-5 py-3.5">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--sn-kenar)] bg-black/30 px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-metin-3" />
            <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Ses ara" autoFocus
              className="w-full bg-transparent text-[14px] text-metin outline-none placeholder:text-metin-3" />
          </div>
          <button onClick={() => setSesEkle(true)}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-aksan px-4 py-2.5 text-[13px] font-bold text-zemin transition-transform hover:scale-[1.02]">
            <Mic className="h-4 w-4" /> Ses ekle
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {ozelSuzulen.length > 0 && (
            <>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-metin-3">Özel seslerin</p>
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {ozelSuzulen.map((s) => SesKarti(s, true))}
              </div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-metin-3">Hazır sesler</p>
            </>
          )}
          {hazirSuzulen.length === 0 && ozelSuzulen.length === 0 ? (
            <p className="py-16 text-center text-[13px] text-metin-3">"{ara}" ile eşleşen ses yok.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
    if (temiz.length < 2) { toast.error("Sese bir ad ver."); return; }
    if (!dosya && kayitSn < 3) {
      toast.error("Örnek ses gerekli", { description: "Bir ses dosyası yükle ya da en az 3 sn kaydet." });
      return;
    }
    if (kayitliSesler.some((s) => s.ad.toLocaleLowerCase("tr") === temiz.toLocaleLowerCase("tr"))) {
      toast.error("Bu adda bir özel ses zaten var"); return;
    }
    kayitDurdur();
    sesKaydet({ ad: temiz, cinsiyet, tohum: "ozel-" + temiz.toLocaleLowerCase("tr"), kaydedilmis: true });
    toast.success(`${temiz} sesi klonlandı 🎙`, { description: "Artık ses seçicide görünüyor." });
    onOlustu?.({ ad: temiz, cinsiyet, renk: "#55d6fd", dil: "Türkçe" });
    onKapat();
  };

  return (
    <ModalKabuk baslik="Ses ekle" ozet="Klonlamak için bir ses örneği kaydet ya da yükle." onKapat={() => { kayitDurdur(); onKapat(); }} genislik={620} zIndex={250}>
      <input ref={dosyaRef} type="file" accept="audio/*" className="hidden"
        onChange={(e) => {
          const d = e.target.files?.[0]; e.target.value = "";
          if (!d) return;
          if (d.size > 11 * 1024 * 1024) { toast.error("Dosya çok büyük", { description: "En fazla 11MB (MP3/WAV)." }); return; }
          kayitDurdur(); setKayitSn(0); setDosya(d.name);
          toast.success("Örnek ses yüklendi 🎧", { description: d.name });
        }} />

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-metin"><span className="text-rose-400">*</span> İsim</label>
          <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Sesini adlandır" autoFocus
            className="h-11 w-full rounded-xl border border-[var(--sn-kenar)] bg-zemin px-3.5 text-[14px] text-metin outline-none focus:border-aksan/60" />
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[12px] text-metin-3">Ton:</span>
            {(["Kadın", "Erkek"] as const).map((c) => (
              <button key={c} onClick={() => setCinsiyet(c)}
                className={cn("rounded-full px-3 py-1 text-[12px] font-semibold transition-colors",
                  cinsiyet === c ? "bg-aksan text-zemin" : "border border-[var(--sn-kenar)] text-metin-2 hover:text-metin")}>{c}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button onClick={() => dosyaRef.current?.click()}
            className={cn("flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-7 transition-colors",
              dosya ? "border-aksan/60 bg-aksan/[0.06]" : "border-[var(--sn-kenar)] hover:bg-white/[0.03]")}>
            <Upload className="h-6 w-6 text-metin-2" />
            <span className="text-[13px] font-medium text-metin">{dosya ? "Örnek yüklendi" : "Ses yükle"}</span>
            <span className="max-w-full truncate text-[11px] text-metin-3">{dosya ?? "MP3 / WAV · en fazla 11MB"}</span>
          </button>
          <button onClick={() => (kayit ? kayitDurdur() : kayitBaslat())}
            className={cn("flex flex-col items-center justify-center gap-2 rounded-xl border px-4 py-7 transition-colors",
              kayit ? "border-rose-400/60 bg-rose-500/[0.08]" : kayitSn >= 3 ? "border-aksan/60 bg-aksan/[0.06]" : "border-[var(--sn-kenar)] hover:bg-white/[0.03]")}>
            {kayit ? <Square className="h-6 w-6 fill-rose-400 text-rose-400" /> : <Mic className="h-6 w-6 text-metin-2" />}
            <span className="text-[13px] font-medium text-metin">{kayit ? "Kaydı durdur" : kayitSn >= 3 ? "Kayıt hazır" : "Kendi sesini kaydet"}</span>
            <span className="text-[11px] tabular-nums text-metin-3">
              {kayit || kayitSn > 0 ? `${Math.floor(kayitSn / 60)}:${String(kayitSn % 60).padStart(2, "0")}` : "en az 3 sn"}
            </span>
          </button>
        </div>

        <div className="rounded-xl border border-[var(--sn-kenar)] bg-black/25 p-4">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-metin-3">Örnek metin</p>
          <p className="text-[13.5px] leading-relaxed text-metin-2">
            "Bugün hava çok güzel. Sabah erkenden kalkıp sahil boyunca yürüdüm; martıların sesi
            ve dalgaların ritmi bana eşlik etti."
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-4">
        <span className="text-[12px] text-metin-3">Klonlama 40 kredi</span>
        <div className="flex items-center gap-2.5">
          <button onClick={() => { kayitDurdur(); onKapat(); }}
            className="rounded-xl border border-white/12 px-5 py-2.5 text-[14px] font-medium text-white hover:bg-white/[0.06]">İptal</button>
          <button onClick={olustur}
            className="rounded-xl bg-white px-6 py-2.5 text-[14px] font-bold text-black transition-transform hover:scale-[1.02]">Sesi Klonla</button>
        </div>
      </div>
    </ModalKabuk>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/* 3) DİL SEÇİCİ — "Çevir" için (bayrak + dil adı ızgarası)                   */
/* ══════════════════════════════════════════════════════════════════════════ */
export function DilSeciciModal({
  seciliAd, onSec, onKapat, baslik = "HEDEF DİLİ SEÇ", ozet = "Videonun dublajı ve altyazısı bu dile çevrilecek.",
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
