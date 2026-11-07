"use client";

/**
 * /panel/api genel bakış — "Komuta güvertesi" (2026-10-29, onaylanan A, ikinci işçilik turu):
 * sakin cam komuta kartı (üstte nötr ortam seçici; anahtar, bakiye, çubuklu API nabzı),
 * tek zaman seçicinin sürdüğü degrade yığılmış grafik + KPI satırı, hata grupları,
 * etkinlik halkalarıyla sağlık, gerçek çıktılardan film şeridi, son istekler, logolu modeller.
 * Hiç isteği olmayan hesapta: başlangıç adımları + mini oyun alanı + "Örnek görünüm" pano önizlemesi.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, animate, motion, useMotionValue, useTransform } from "framer-motion";
import {
  AlertTriangle, ArrowRight, ArrowUp, AudioLines, BookOpen, Box, Check, CheckCircle2, ChevronDown, ChevronRight, Copy, KeyRound, Loader2, Play, Plus, Terminal,
} from "lucide-react";
import { MODELLER } from "@/lib/catalog";
import { useApiAnahtar, anahtarMaske, type AnahtarOrtam, type ApiUretim } from "@/store/useApiAnahtar";
import { useAuth } from "@/store/useAuth";
import { apiIstek, apiTaban, uretimIzle } from "@/lib/api/istemci";
import { modelKapak } from "@/lib/api/gorsel";
import { Yuzen } from "@/components/ui/Yuzen";
import { KrediJeton } from "@/components/ui/KrediHap";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { DurumRozet, KodEditor, OrtamSecici, panoyaKopyala, sureMetin, tarihSaat, goreli } from "@/components/api/ui";
import { ozet, useHazir, yuzdelik } from "@/components/api/veri";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const HIZLI_MODELLER = ["nano-banana-pro", "seedream-5", "flux-2", "gpt-image-2", "kling-3", "eleven-tts"];
const POPULER = ["nano-banana-pro", "kling-3", "veo-31", "seedance-2", "eleven-tts", "vayra-muse-2"];
const SAAT = 3_600_000;
const GUN = 86_400_000;
const yay = { type: "spring" as const, stiffness: 420, damping: 34 };

/** Tür renkleri: durum renkleri (yeşil/kırmızı) ile çakışmaz. */
const TURLER: { id: string; ad: string; renk: string }[] = [
  { id: "video", ad: "Video", renk: "#55d6fd" },
  { id: "image", ad: "Görsel", renk: "#a78bfa" },
  { id: "audio", ad: "Ses", renk: "#fde047" },
  { id: "music", ad: "Müzik", renk: "#f472b6" },
  { id: "3d", ad: "3D", renk: "#fb923c" },
];
const turRenk = (t: string) => TURLER.find((x) => x.id === t)?.renk ?? "#ffffff";

type Aralik = "24s" | "7g" | "30g";
const ARALIK: { id: Aralik; ad: string; uzun: string; ms: number }[] = [
  { id: "24s", ad: "24 saat", uzun: "son 24 saat", ms: GUN },
  { id: "7g", ad: "7 gün", uzun: "son 7 gün", ms: 7 * GUN },
  { id: "30g", ad: "30 gün", uzun: "son 30 gün", ms: 30 * GUN },
];
const API_ORTAM = (o: AnahtarOrtam) => (o === "canli" ? "live" : "test");
const zamani = (u: ApiUretim) => Date.parse(u.created_at);
const sayi = (n: number) => n.toLocaleString("tr-TR");
const modelAd = (id: string) => MODELLER.find((m) => m.id === id)?.ad ?? id;
const logoAd = (id: string) => { const m = MODELLER.find((x) => x.id === id); return m ? `${m.ad} ${m.saglayici} ${m.id}` : id; };
const kart = "rounded-[26px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] ring-1 ring-white/[0.08]";

/* ── Küçük parçalar ── */

function Sayac({ deger, className }: { deger: number; className?: string }) {
  const mv = useMotionValue(0);
  const metin = useTransform(mv, (v) => sayi(Math.round(v)));
  useEffect(() => { const c = animate(mv, deger, { duration: 0.9, ease: [0.22, 1, 0.36, 1] }); return () => c.stop(); }, [deger, mv]);
  return <motion.span className={className}>{metin}</motion.span>;
}

function Segment<T extends string>({ id, secenek, deger, set, renk }: { id: string; secenek: { id: T; ad: string }[]; deger: T; set: (v: T) => void; renk?: (v: T) => string }) {
  return (
    <LayoutGroup id={id}>
      <div role="radiogroup" className="flex rounded-full bg-black/30 p-1 ring-1 ring-white/[0.09] backdrop-blur">
        {secenek.map((s) => (
          <button key={s.id} role="radio" aria-checked={deger === s.id} onClick={() => set(s.id)} className="relative h-8 rounded-full px-3.5 text-[13px] font-medium transition active:scale-[0.96]">
            {deger === s.id && <motion.span layoutId={id + "-z"} className={cn("absolute inset-0 rounded-full", renk?.(s.id) ?? "bg-white")} transition={yay} />}
            <span className={cn("relative transition-colors", deger === s.id ? "text-[#06090b]" : "text-white/70 hover:text-white")}>{s.ad}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}

/** Canlı nabız: her ölçüm bir çubuk (yükseklik = süre), en yenisi sağda ve parlak; başarısız ölçüm kırmızı. */
function Nabiz({ olcumler, renk }: { olcumler: { ms: number; ok: boolean }[]; renk: string }) {
  const [ust, setUst] = useState<number | null>(null);
  const n = olcumler.length;
  if (n < 2) return <div className="flex h-[52px] items-center text-[12.5px] text-white/50">Ölçüm birikiyor</div>;
  const max = Math.max(...olcumler.map((o) => o.ms));
  const secili = ust === null ? null : olcumler[ust];
  const once = ust === null ? 0 : n - 1 - ust;
  return (
    <div>
      <div className="flex h-[52px] items-end gap-[3px]" onMouseLeave={() => setUst(null)}>
        {Array.from({ length: Math.max(0, 28 - n) }, (_, i) => <span key={"b" + i} className="block h-[12%] flex-1 rounded-[3px] bg-white/[0.06]" />)}
        {olcumler.map((o, i) => {
          const son = i === n - 1;
          return (
            <div key={i} className="flex h-full flex-1 items-end" onMouseEnter={() => setUst(i)}>
              <motion.span initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.018, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="block w-full origin-bottom rounded-[3px] transition-opacity duration-200"
                style={{ height: `${Math.max(12, (o.ms / max) * 100)}%`, background: o.ok ? renk : "#fb7185", opacity: ust === null ? (son ? 1 : 0.3 + (i / n) * 0.4) : ust === i ? 1 : 0.25 }} />
            </div>
          );
        })}
      </div>
      <p className="mt-2 h-4 text-[12px] tabular-nums text-white/50">
        {secili ? <><span className="text-white">{secili.ms} ms</span>{secili.ok ? "" : " · ulaşılamadı"} · {once === 0 ? "son ölçüm" : `${once} dakika önce`}</> : `Son ${n} ölçüm · dakikada bir`}
      </p>
    </div>
  );
}

/* ── Sayfa ── */

export default function ApiGenelBakis() {
  const hazir = useHazir();
  const anahtarlar = useApiAnahtar((s) => s.anahtarlar);
  const webhooklar = useApiAnahtar((s) => s.webhooklar);
  const uretimler = useApiAnahtar((s) => s.uretimler);
  const ortam = useApiAnahtar((s) => s.varsayilanOrtam);
  const kullanici = useAuth((s) => s.kullanici);
  const [aralik, setAralik] = useState<Aralik>("7g");

  if (!hazir) return <div className="h-[60vh]" />;

  const env = API_ORTAM(ortam);
  const ortamdaki = uretimler.filter((u) => u.environment === env);
  const yeniHesap = uretimler.length === 0;
  const saat = new Date().getHours();
  const selam = saat < 6 ? "İyi geceler" : saat < 12 ? "Günaydın" : saat < 18 ? "İyi günler" : "İyi akşamlar";

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[30px] font-semibold tracking-[-0.035em] text-white sm:text-[36px]">{kullanici ? `${selam}, ${kullanici.ad.split(" ")[0]}` : "Vayra API"}</h1>
          <p className="mt-1 text-[15px] text-white/65">{MODELLER.length} görsel, video, ses, müzik ve 3D modeli; tek uç nokta, tek kredi bakiyesi.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/panel/api/dokuman" className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-medium text-white ring-1 ring-white/[0.12] transition hover:bg-white/[0.06] active:scale-[0.97]"><BookOpen className="h-4 w-4" />Doküman</Link>
          <Link href="/panel/api/konsol" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97]"><Terminal className="h-4 w-4" />Konsol</Link>
        </div>
      </header>

      <KomutaKarti uretimler={uretimler} anahtarlar={anahtarlar} />

      {yeniHesap ? (
        <Baslangic anahtarVar={anahtarlar.length > 0} webhookVar={webhooklar.length > 0} />
      ) : (
        <Pano liste={ortamdaki} aralik={aralik} setAralik={setAralik} canli={ortam === "canli"} />
      )}
    </>
  );
}

function Pano({ liste, aralik, setAralik, canli, ornek }: { liste: ApiUretim[]; aralik: Aralik; setAralik: (a: Aralik) => void; canli: boolean; ornek?: boolean }) {
  return (
    <>
      <div className="mt-9 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-[21px] font-semibold tracking-[-0.02em] text-white">
          Genel bakış
          <span className={cn("rounded-full px-2.5 py-0.5 text-[12.5px] font-medium", canli ? "bg-[#55d6fd]/12 text-[#8fe6ff]" : "bg-amber-300/12 text-amber-200")}>{canli ? "Canlı" : "Test"}</span>
        </h2>
        <Segment id={ornek ? "api-aralik-o" : "api-aralik"} secenek={ARALIK} deger={aralik} set={setAralik} />
      </div>
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] items-start gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <TurGrafigi liste={liste} aralik={aralik} canli={canli} genislet={() => setAralik("30g")} />
        <div className="grid min-w-0 gap-4">
          <HataGruplari liste={liste} aralik={aralik} />
          <Saglik liste={liste} aralik={aralik} />
        </div>
      </div>
      <SonCiktilar liste={liste} />
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] items-start gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <SonIstekler liste={liste} canli={canli} />
        <Modellerin liste={liste} aralik={aralik} />
      </div>
    </>
  );
}

/* ── Komuta kartı ── */

function KomutaKarti({ uretimler, anahtarlar }: { uretimler: ApiUretim[]; anahtarlar: ReturnType<typeof useApiAnahtar.getState>["anahtarlar"] }) {
  const ortam = useApiAnahtar((s) => s.varsayilanOrtam);
  const olustur = useApiAnahtar((s) => s.anahtarOlustur);
  const olcumler = useApiAnahtar((s) => s.olcumler);
  const krediler = useAuth((s) => s.kullanici?.krediler ?? 0);
  const [ok, setOk] = useState(false);
  const test = ortam === "test";
  const renk = test ? "#fcd34d" : "#55d6fd";
  const ortamAnahtarlari = anahtarlar.filter((a) => a.ortam === ortam);
  const anahtar = ortamAnahtarlari[0];
  const gunluk = useMemo(() => {
    const t0 = Date.now() - 7 * GUN;
    return uretimler.filter((u) => u.environment === "live" && u.status === "succeeded" && zamani(u) >= t0).reduce((t, u) => t + u.credits, 0) / 7;
  }, [uretimler]);
  const yeter = gunluk > 0 ? Math.floor(krediler / gunluk) : null;
  const nabiz = olcumler.slice(0, 28).reverse();
  const sonMs = olcumler[0]?.ms;
  const ayakta = olcumler.length ? olcumler.slice(0, 60).filter((o) => o.ok).length / Math.min(60, olcumler.length) : null;

  return (
    <section className="relative mt-6 overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] ring-1 ring-white/[0.08]">
      {/* Ortamın rengiyle hafif nefes alan ışık */}
      <span className="pointer-events-none absolute -top-28 left-[18%] h-52 w-[64%] rounded-full blur-[90px] transition-colors duration-700 [animation:gp-leke-1_16s_ease-in-out_infinite]" style={{ background: test ? "rgba(252,211,77,0.07)" : "rgba(85,214,253,0.1)" }} aria-hidden />

      <div className="relative flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-white/[0.06] px-5 py-3.5 sm:px-6">
        <OrtamSecici id="api-ortam" className="hidden lg:grid" />
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={ortam} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }} className="text-[13px] text-white/60">
            {test ? "Test: kredi harcamaz, örnek çıktı döner" : "Canlı: her başarılı istek kredi harcar"}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="relative grid lg:grid-cols-3">
        {/* Etkin anahtar */}
        <div className="p-5 sm:p-6">
          <p className="text-[13px] text-white/60">Etkin anahtar</p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={ortam + (anahtar?.id ?? "")} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              {anahtar ? (
                <div className="mt-3 flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.06] ring-1 ring-white/[0.08]"><KeyRound className="h-4 w-4 transition-colors duration-500" style={{ color: renk }} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[14px] text-white">{anahtarMaske(anahtar.tam)}</p>
                    <p className="truncate text-[12px] text-white/50">{anahtar.ad}</p>
                  </div>
                  <button onClick={async () => { if (await panoyaKopyala(anahtar.tam)) { setOk(true); setTimeout(() => setOk(false), 1500); } }} aria-label="Anahtarı kopyala" title="Anahtarı kopyala"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/70 transition hover:bg-white/[0.08] hover:text-white active:scale-90">
                    <AnimatePresence mode="wait" initial={false}>{ok ? <motion.span key="o" initial={{ scale: 0.4 }} animate={{ scale: 1 }}><Check className="h-3.5 w-3.5 text-emerald-300" strokeWidth={3} /></motion.span> : <motion.span key="c" initial={{ scale: 0.4 }} animate={{ scale: 1 }}><Copy className="h-3.5 w-3.5" /></motion.span>}</AnimatePresence>
                  </button>
                </div>
              ) : test ? (
                <button onClick={async () => { await olustur({ ad: "Test anahtarı", ortam: "test" }); toast.success("Test anahtarı oluşturuldu", { description: "Kredi harcamaz; örnek çıktı döndürür." }); }}
                  className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97]"><Plus className="h-4 w-4" />Test anahtarı oluştur</button>
              ) : (
                <Link href="/panel/api/anahtarlar?yeni=1" className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97]"><Plus className="h-4 w-4" />Canlı anahtar oluştur</Link>
              )}
              <Link href="/panel/api/anahtarlar" className="mt-4 flex w-max items-center gap-1 text-[12.5px] font-medium text-white/60 transition hover:text-white">
                {ortamAnahtarlari.length > 1 ? `${ortamAnahtarlari.length} ${test ? "test" : "canlı"} anahtarı` : "Anahtarları yönet"}<ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bakiye */}
        <div className="border-t border-white/[0.06] p-5 sm:p-6 lg:border-l lg:border-t-0">
          <p className="flex items-center gap-1.5 text-[13px] text-white/60"><KrediJeton boyut={14} />Bakiye</p>
          <p className="mt-2 flex items-baseline gap-1.5">
            <Sayac deger={krediler} className="text-[40px] font-semibold leading-none tabular-nums tracking-[-0.04em] text-white" />
            <span className="text-[13px] text-white/50">kredi</span>
          </p>
          <p className="mt-2 text-[12.5px] text-white/55">{yeter === null ? "Canlı harcama yok; bakiye sabit." : yeter > 365 ? "Canlı harcama hızıyla 1 yıldan uzun yeter." : <>Canlı harcama hızıyla <span className="font-medium text-white">{yeter} gün</span> yeter.</>}</p>
          <div className="mt-4 flex gap-2">
            <Link href="/panel/kredi" className="inline-flex h-9 items-center rounded-full bg-white px-3.5 text-[13px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97]">Kredi yükle</Link>
            <Link href="/panel/api/faturalama" className="inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-medium text-white ring-1 ring-white/[0.12] transition hover:bg-white/[0.06] active:scale-[0.97]">Faturalama</Link>
          </div>
        </div>

        {/* Canlı nabız */}
        <div className="border-t border-white/[0.06] p-5 sm:p-6 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-white/60">API nabzı</p>
            <span className="text-[12.5px] tabular-nums text-white/50">{ayakta === null ? "ölçülüyor" : `yüzde ${Math.round(ayakta * 100)} erişilebilir`}</span>
          </div>
          <p className="mt-2 flex items-baseline gap-1"><span className="text-[28px] font-semibold leading-none tabular-nums tracking-[-0.03em] text-white">{sonMs ?? "…"}</span><span className="text-[12.5px] text-white/50">ms</span></p>
          <div className="mt-3"><Nabiz olcumler={nabiz} renk="#55d6fd" /></div>
        </div>
      </div>
    </section>
  );
}

/* ── Türe göre degrade yığılmış grafik + KPI ── */

function kovalar(aralik: Aralik) {
  const simdi = Date.now();
  if (aralik === "24s") {
    const son = Math.floor(simdi / SAAT) * SAAT + SAAT;
    return Array.from({ length: 24 }, (_, i) => {
      const bas = son - (24 - i) * SAAT;
      const d = new Date(bas);
      return { bas, bit: bas + SAAT, etiket: i % 4 === 0 ? `${String(d.getHours()).padStart(2, "0")}:00` : "", uzun: `${d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} · ${String(d.getHours()).padStart(2, "0")}:00` };
    });
  }
  const n = aralik === "7g" ? 7 : 30;
  const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(bugun.getTime() - (n - 1 - i) * GUN);
    const bas = d.getTime();
    const etiket = n === 7 ? (i === n - 1 ? "Bugün" : d.toLocaleDateString("tr-TR", { weekday: "short" })) : i % 5 === 4 || i === n - 1 ? String(d.getDate()) : "";
    return { bas, bit: bas + GUN, etiket, uzun: d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" }) };
  });
}

function TurGrafigi({ liste, aralik, canli, genislet }: { liste: ApiUretim[]; aralik: Aralik; canli: boolean; genislet: () => void }) {
  const [olcu, setOlcu] = useState<"istek" | "kredi">(canli ? "kredi" : "istek");
  useEffect(() => setOlcu(canli ? "kredi" : "istek"), [canli]);
  const [ust, setUst] = useState<number | null>(null);
  const a = ARALIK.find((x) => x.id === aralik)!;
  const deger = (u: ApiUretim) => (olcu === "kredi" ? (u.environment === "live" && u.status === "succeeded" ? u.credits : 0) : 1);

  const v = useMemo(() => {
    const k = kovalar(aralik);
    const cubuklar = k.map((b) => {
      const g = liste.filter((u) => { const t = zamani(u); return t >= b.bas && t < b.bit; });
      const parca = TURLER.map((t) => ({ ...t, d: g.filter((u) => u.type === t.id).reduce((s, u) => s + deger(u), 0) }));
      return { ...b, parca, top: parca.reduce((s, p) => s + p.d, 0) };
    });
    const simdi = Date.now();
    const aradaki = (bas: number, bit: number) => liste.filter((u) => { const t = zamani(u); return t >= bas && t < bit; });
    const buL = aradaki(simdi - a.ms, simdi + 1);
    const bu = buL.reduce((s, u) => s + deger(u), 0), onceki = aradaki(simdi - 2 * a.ms, simdi - a.ms).reduce((s, u) => s + deger(u), 0);
    const kullanilan = TURLER.filter((t) => cubuklar.some((c) => c.parca.find((p) => p.id === t.id)!.d > 0));
    return { cubuklar, bu, onceki, max: Math.max(1, ...cubuklar.map((c) => c.top)), kullanilan, oz: ozet(buL) };
  }, [liste, aralik, olcu]); // eslint-disable-line react-hooks/exhaustive-deps

  const fark = v.onceki ? Math.round(((v.bu - v.onceki) / v.onceki) * 100) : null;
  const bos = v.bu === 0;
  const kpi: [string, string, string?][] = [
    ["Başarı oranı", v.oz.oran === null ? "Veri yok" : `yüzde ${(v.oz.oran * 100).toFixed(1).replace(".", ",").replace(",0", "")}`],
    ["Medyan süre", v.oz.p50 === null ? "Veri yok" : sureMetin(v.oz.p50)],
    ["p95 süre", v.oz.p95 === null ? "Veri yok" : sureMetin(v.oz.p95)],
    ["Başarısız", sayi(v.oz.basarisiz), v.oz.basarisiz ? "text-rose-300" : undefined],
  ];

  return (
    <section className={cn(kart, "overflow-hidden")}>
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[13px] text-white/65">{olcu === "kredi" ? "Harcanan kredi" : "İstek"} · {a.uzun}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-3">
              <Sayac deger={v.bu} className="text-[44px] font-semibold leading-none tabular-nums tracking-[-0.04em] text-white" />
              {fark !== null && fark !== 0 && <span className={cn("rounded-full px-2.5 py-1 text-[12.5px] font-medium tabular-nums", fark > 0 ? "bg-white/[0.08] text-white" : "bg-white/[0.05] text-white/70")}>{fark > 0 ? "▲" : "▼"} yüzde {Math.abs(fark)} önceki döneme göre</span>}
              {v.onceki === 0 && v.bu > 0 && <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[12.5px] text-white/70">İlk dönem</span>}
            </div>
          </div>
          <Segment id="api-olcu" secenek={[{ id: "istek" as const, ad: "İstek" }, { id: "kredi" as const, ad: "Kredi" }]} deger={olcu} set={setOlcu} />
        </div>

        {bos ? (
          <div className="relative mt-6 flex h-[220px] flex-col items-center justify-center gap-2 overflow-hidden rounded-[20px] text-center">
            <div className="absolute inset-0 flex items-end gap-1.5 px-2 opacity-[0.18]" aria-hidden>{Array.from({ length: 14 }, (_, i) => <span key={i} className="flex-1 rounded-t-[6px] bg-gradient-to-t from-white/40 to-white/5" style={{ height: `${25 + ((i * 37) % 60)}%` }} />)}</div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c0e] via-[#0b0c0e]/70 to-transparent" />
            <p className="relative text-[15px] font-semibold text-white">{olcu === "kredi" && !canli ? "Test istekleri kredi harcamaz" : `${a.ad} içinde ${olcu === "kredi" ? "harcama" : "istek"} yok`}</p>
            <p className="relative max-w-[380px] text-[13px] text-white/65">{olcu === "kredi" && !canli ? "Harcamayı görmek için Canlı ortama geç ya da İstek ölçüsüne dön." : "Daha uzun bir aralık seç ya da konsoldan yeni bir istek gönder."}</p>
            <div className="relative mt-2 flex flex-wrap justify-center gap-2">
              {aralik !== "30g" && <button onClick={genislet} className="inline-flex h-9 items-center rounded-full bg-white px-4 text-[13px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97]">30 güne genişlet</button>}
              <Link href="/panel/api/konsol" className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium text-white ring-1 ring-white/[0.14] transition hover:bg-white/[0.06] active:scale-[0.97]"><Terminal className="h-3.5 w-3.5" />Konsolda dene</Link>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <div className="relative flex h-[220px] items-end gap-[3px] sm:gap-1.5" onMouseLeave={() => setUst(null)}>
              {[0.25, 0.5, 0.75, 1].map((f) => (
                <span key={f} className="pointer-events-none absolute inset-x-0 flex items-center border-t border-white/[0.05]" style={{ bottom: `${f * 100}%` }}>
                  {(f === 0.5 || f === 1) && <span className="absolute -top-[15px] left-0 text-[10.5px] tabular-nums text-white/35">{sayi(Math.round(v.max * f))}</span>}
                </span>
              ))}
              {v.cubuklar.map((c, i) => (
                <div key={c.bas} onMouseEnter={() => setUst(i)} className="relative flex h-full min-w-0 flex-1 flex-col justify-end">
                  <span className={cn("pointer-events-none absolute inset-x-[-2px] inset-y-0 rounded-[8px] bg-white/[0.035] opacity-0 transition-opacity", ust === i && "opacity-100")} />
                  {c.top > 0 ? (
                    <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(3, (c.top / v.max) * 100)}%` }} transition={{ delay: i * (aralik === "7g" ? 0.045 : 0.012), duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className={cn("relative mx-auto flex w-full max-w-[46px] flex-col-reverse gap-[2px] transition-[opacity,filter] duration-200", ust !== null && ust !== i && "opacity-35 saturate-50")}>
                      {c.parca.filter((p) => p.d > 0).map((p, j, arr) => (
                        <span key={p.id} style={{ flexGrow: p.d, background: `linear-gradient(180deg, ${p.renk}, ${p.renk}b3)`, boxShadow: ust === i ? `0 0 18px ${p.renk}55` : undefined }}
                          className={cn("min-h-[3px]", j === arr.length - 1 && "rounded-t-[7px]", j === 0 && "rounded-b-[3px]")} />
                      ))}
                    </motion.div>
                  ) : <span className="mx-auto h-[3px] w-full max-w-[46px] rounded-full bg-white/[0.07]" />}
                  <AnimatePresence>
                    {ust === i && (
                      <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }}
                        className={cn("pointer-events-none absolute bottom-full z-20 mb-2 w-[188px] rounded-[16px] bg-[#17181c]/95 p-3 text-[12.5px] ring-1 ring-white/[0.12] backdrop-blur-xl",
                          i < 3 ? "left-0" : i > v.cubuklar.length - 4 ? "right-0" : "left-1/2 -translate-x-1/2")}>
                        <p className="text-white/60">{c.uzun}</p>
                        <p className="mt-0.5 text-[15px] font-semibold text-white">{sayi(c.top)} {olcu === "kredi" ? "kredi" : "istek"}</p>
                        <div className="mt-2 space-y-1">
                          {c.parca.filter((p) => p.d > 0).map((p) => (
                            <p key={p.id} className="flex items-center gap-2 text-white/75"><span className="h-2 w-2 rounded-[3px]" style={{ background: p.renk }} />{p.ad}<span className="ml-auto tabular-nums text-white">{sayi(p.d)}</span></p>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
            <div className="mt-2.5 flex gap-[3px] sm:gap-1.5">{v.cubuklar.map((c, i) => <span key={c.bas} className={cn("min-w-0 flex-1 whitespace-nowrap text-center text-[11.5px] transition-colors", ust === i ? "text-white" : "text-white/50")}>{c.etiket}</span>)}</div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
              {v.kullanilan.map((t) => <span key={t.id} className="flex items-center gap-1.5 text-[12.5px] text-white/75"><span className="h-2 w-2 rounded-[3px]" style={{ background: t.renk }} />{t.ad}</span>)}
            </div>
          </div>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-px border-t border-white/[0.07] bg-white/[0.06] sm:grid-cols-4">
        {kpi.map(([e, d, r]) => (
          <div key={e} className="bg-[#0c0d0f] px-5 py-3.5">
            <dt className="text-[12px] text-white/55">{e}</dt>
            <dd className={cn("mt-0.5 text-[17px] font-semibold tabular-nums tracking-tight", d === "Veri yok" ? "text-white/35" : r ?? "text-white")}>{d}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ── Hata grupları ── */

const HATA_AD: Record<string, string> = {
  content_policy: "İçerik politikası", rate_limited: "Hız sınırı", insufficient_credits: "Yetersiz kredi", invalid_input: "Geçersiz girdi",
  provider_error: "Sağlayıcı hatası", internal_error: "Sunucu hatası", timeout: "Zaman aşımı", canceled: "İptal edildi",
};

function HataGruplari({ liste, aralik }: { liste: ApiUretim[]; aralik: Aralik }) {
  const a = ARALIK.find((x) => x.id === aralik)!;
  const gruplar = useMemo(() => {
    const t0 = Date.now() - a.ms;
    const m = new Map<string, { kod: string; sayi: number; son: ApiUretim }>();
    for (const u of liste) {
      if (u.status !== "failed" || zamani(u) < t0) continue;
      const kod = u.error?.code ?? "bilinmiyor";
      const g = m.get(kod);
      if (g) { g.sayi++; if (zamani(u) > zamani(g.son)) g.son = u; } else m.set(kod, { kod, sayi: 1, son: u });
    }
    return Array.from(m.values()).sort((x, y) => y.sayi - x.sayi);
  }, [liste, a.ms]);
  const toplam = gruplar.reduce((t, g) => t + g.sayi, 0);

  return (
    <section className={cn(kart, "p-5")}>
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-white">Hata grupları</h3>
        {toplam > 0 && <span className="rounded-full bg-rose-400/12 px-2.5 py-0.5 text-[12px] font-medium tabular-nums text-rose-300">{toplam} hata</span>}
      </div>
      {gruplar.length === 0 ? (
        <div className="mt-3 flex items-center gap-3 rounded-[18px] bg-emerald-400/[0.06] px-3.5 py-3 ring-1 ring-emerald-400/15">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/15"><CheckCircle2 className="h-4.5 w-4.5 text-emerald-300" /></span>
          <div><p className="text-[13.5px] font-medium text-white">Temiz</p><p className="text-[12.5px] text-white/60">{a.ad} içinde başarısız istek yok.</p></div>
        </div>
      ) : (
        <ul className="-mx-2 mt-2">
          {gruplar.slice(0, 4).map((g) => (
            <li key={g.kod}>
              <Link href={`/panel/api/istekler?id=${g.son.id}`} title={g.son.error?.message ?? ""} className="group flex items-center gap-3 rounded-[14px] px-2 py-2 transition hover:bg-white/[0.04]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-400/10 text-rose-300"><AlertTriangle className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] text-white">{HATA_AD[g.kod] ?? g.kod}</span>
                  <span className="block truncate text-[12px] text-white/55"><span className="font-mono">{g.kod}</span> · son {goreli(g.son.created_at)}</span>
                </span>
                <span className="text-[14px] font-semibold tabular-nums text-white">{g.sayi}</span>
                <ChevronRight className="h-4 w-4 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ── Sağlık: durum sayfası dilinde zaman dilimi çubukları ── */

type Dilim = { ok: number; hata: number; uzun: string };
const dilimRenk = (d: Dilim) => (!d.ok && !d.hata ? "bg-white/[0.07]" : !d.hata ? "bg-emerald-400" : d.hata > d.ok ? "bg-rose-400" : "bg-amber-300");

function DilimCubugu({ dilimler }: { dilimler: Dilim[] }) {
  const [ust, setUst] = useState<number | null>(null);
  return (
    <div className="relative mt-2 flex h-7 items-stretch gap-[2px]" onMouseLeave={() => setUst(null)}>
      {dilimler.map((d, i) => (
        <motion.span key={i} onMouseEnter={() => setUst(i)} initial={{ scaleY: 0.3, opacity: 0 }} animate={{ scaleY: 1, opacity: 1 }} transition={{ delay: i * 0.012, duration: 0.3 }}
          className={cn("min-w-0 flex-1 origin-bottom rounded-[3px] transition-[filter,opacity]", dilimRenk(d), ust !== null && ust !== i && "opacity-50")} />
      ))}
      <AnimatePresence>
        {ust !== null && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
            className="pointer-events-none absolute bottom-full z-20 mb-2 rounded-[12px] bg-[#17181c]/95 px-3 py-2 text-[12px] ring-1 ring-white/[0.12] backdrop-blur-xl"
            style={{ left: `clamp(0px, calc(${((ust + 0.5) / dilimler.length) * 100}% - 70px), calc(100% - 150px))` }}>
            <p className="whitespace-nowrap text-white/60">{dilimler[ust].uzun}</p>
            <p className="mt-0.5 whitespace-nowrap font-medium text-white">{!dilimler[ust].ok && !dilimler[ust].hata ? "Veri yok" : `${dilimler[ust].ok} başarılı · ${dilimler[ust].hata} hata`}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Saglik({ liste, aralik }: { liste: ApiUretim[]; aralik: Aralik }) {
  const teslimler = useApiAnahtar((s) => s.teslimler);
  const olcumler = useApiAnahtar((s) => s.olcumler);
  const d = useMemo(() => {
    const k = kovalar(aralik);
    const t0 = k[0].bas;
    const kova = <T,>(l: T[], zaman: (x: T) => number, iyi: (x: T) => boolean | null): Dilim[] => k.map((b) => {
      const g = l.filter((x) => { const t = zaman(x); return t >= b.bas && t < b.bit; }).map(iyi).filter((x): x is boolean => x !== null);
      return { ok: g.filter(Boolean).length, hata: g.filter((x) => !x).length, uzun: b.uzun };
    });
    const oran = (dl: Dilim[]) => { const ok = dl.reduce((t, x) => t + x.ok, 0), h = dl.reduce((t, x) => t + x.hata, 0); return ok + h ? ok / (ok + h) : null; };
    const uretim = kova(liste, zamani, (u) => (u.status === "succeeded" ? true : u.status === "failed" ? false : null));
    const teslim = kova(teslimler, (t) => Date.parse(t.created_at), (t) => (t.state === "succeeded" ? true : t.state === "failed" ? false : null));
    const api = kova(olcumler, (o) => o.zaman, (o) => o.ok);
    const sure = (tur: string) => yuzdelik(liste.filter((u) => u.type === tur && u.status === "succeeded" && zamani(u) >= t0).map((u) => u.metrics.run_ms).filter((x): x is number => typeof x === "number"), 50);
    return { satirlar: [{ ad: "Üretim başarısı", dilim: uretim, oran: oran(uretim) }, { ad: "Webhook teslimi", dilim: teslim, oran: oran(teslim) }, { ad: "API erişimi", dilim: api, oran: oran(api) }], gorsel: sure("image"), video: sure("video") };
  }, [liste, teslimler, olcumler, aralik]);
  const yuzde = (x: number | null) => (x === null ? "Veri yok" : `yüzde ${(x * 100).toFixed(x === 1 ? 0 : 1).replace(".", ",")}`);
  return (
    <section className={cn(kart, "p-5")}>
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-white">Sağlık</h3>
        <Link href="/panel/api/durum" className="inline-flex items-center gap-0.5 text-[12.5px] font-medium text-white/60 transition hover:text-white">Durum<ChevronRight className="h-3.5 w-3.5" /></Link>
      </div>
      <div className="mt-3 space-y-4">
        {d.satirlar.map((r) => (
          <div key={r.ad}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] text-white/75">{r.ad}</span>
              <span className={cn("text-[13.5px] font-semibold tabular-nums", r.oran === null ? "text-white/35" : r.oran >= 0.99 ? "text-emerald-300" : r.oran >= 0.9 ? "text-amber-200" : "text-rose-300")}>{yuzde(r.oran)}</span>
            </div>
            <DilimCubugu dilimler={r.dilim} />
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {[["Görsel p50", d.gorsel], ["Video p50", d.video]].map(([e, v]) => (
          <div key={e as string} className="rounded-[14px] bg-white/[0.035] px-3.5 py-2.5 ring-1 ring-white/[0.05]">
            <p className="text-[12px] text-white/55">{e}</p>
            <p className={cn("text-[16px] font-semibold tabular-nums", v === null ? "text-white/35" : "text-white")}>{v === null ? "Veri yok" : sureMetin(v as number)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Son çıktılar: gerçek çıktılardan film şeridi ── */

function CiktiKarti({ u, i }: { u: ApiUretim; i: number }) {
  const [ust, setUst] = useState(false);
  const url = u.output?.urls[0];
  const tip = u.output?.content_type ?? "";
  const video = !!url && tip.startsWith("video");
  const gorsel = !!url && tip.startsWith("image");
  const poster = video ? url!.replace(/(\/gercek\/video-hareket\/[^/?#]+)\.mp4.*$/, "$1-poster.webp") : null;
  const kapak = gorsel ? url! : poster && poster !== url ? poster : modelKapak(u.model);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, ...yay }} className="w-[230px] shrink-0 snap-start sm:w-[250px]">
      <Link href={`/panel/api/istekler?id=${u.id}`} onMouseEnter={() => setUst(true)} onMouseLeave={() => setUst(false)}
        className="group relative block aspect-[4/5] overflow-hidden rounded-[22px] ring-1 ring-white/[0.09] transition hover:ring-white/[0.22]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={kapak} alt="" loading="lazy" className={cn("absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]", u.status === "failed" && "opacity-40 grayscale")} />
        {video && ust && <video src={url} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.45),transparent_30%,transparent_50%,rgba(0,0,0,0.9))]" />
        <div className="absolute inset-x-3 top-3 flex items-center justify-between">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 ring-1 ring-white/[0.12] backdrop-blur"><ModelLogo ad={logoAd(u.model)} boyut={16} /></span>
          <span className="flex items-center gap-1.5">
            {video && <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/45 backdrop-blur"><Play className="h-3 w-3 fill-white text-white" /></span>}
            {u.type === "audio" || u.type === "music" ? <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/45 backdrop-blur"><AudioLines className="h-3.5 w-3.5 text-white" /></span> : null}
            {u.type === "3d" && <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/45 backdrop-blur"><Box className="h-3.5 w-3.5 text-white" /></span>}
          </span>
        </div>
        <div className="absolute inset-x-3.5 bottom-3.5">
          <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-white">{String(u.input.prompt ?? u.input.text ?? modelAd(u.model))}</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-white/75">
            <span className={cn("h-1.5 w-1.5 rounded-full", u.status === "failed" ? "bg-rose-400" : u.status === "succeeded" ? "bg-emerald-400" : "bg-amber-300")} />
            {modelAd(u.model)} · {u.status === "failed" ? "başarısız" : sureMetin(u.metrics.run_ms)}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

function SonCiktilar({ liste }: { liste: ApiUretim[] }) {
  const sira = liste.filter((u) => u.status !== "canceled").slice(0, 10);
  const ref = useRef<HTMLDivElement>(null);
  if (!sira.length) return null;
  const kaydir = (y: number) => ref.current?.scrollBy({ left: y * 520, behavior: "smooth" });
  return (
    <section className="mt-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-white">Son çıktılar</h3>
        <div className="flex items-center gap-1.5">
          <Link href="/panel/api/istekler" className="mr-1 text-[13px] font-medium text-white/60 transition hover:text-white">Tümü</Link>
          {sira.length > 4 && [-1, 1].map((y) => (
            <button key={y} onClick={() => kaydir(y)} aria-label={y < 0 ? "Geri" : "İleri"} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/80 ring-1 ring-white/[0.08] transition hover:bg-white/[0.12] hover:text-white active:scale-90">
              <ChevronRight className={cn("h-4 w-4", y < 0 && "rotate-180")} />
            </button>
          ))}
        </div>
      </div>
      <div ref={ref} className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
        {sira.map((u, i) => <CiktiKarti key={u.id} u={u} i={i} />)}
      </div>
    </section>
  );
}

/* ── Son istekler ── */

function SonIstekler({ liste, canli }: { liste: ApiUretim[]; canli: boolean }) {
  return (
    <section className={cn(kart, "overflow-hidden")}>
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
        <h3 className="text-[15px] font-semibold text-white">Son istekler</h3>
        <Link href="/panel/api/istekler" className="flex items-center gap-1 text-[13px] font-medium text-white/60 transition hover:text-white">İstek günlüğü<ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>
      {liste.length === 0 ? (
        <p className="px-5 py-6 text-[13.5px] text-white/60">{canli ? "Canlı ortamda henüz istek yok. Canlı anahtarınla ilk isteğini gönderdiğinde burada görünür." : "Test ortamında henüz istek yok."}</p>
      ) : (
        <ul>
          {liste.slice(0, 6).map((u, i) => (
            <motion.li key={u.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="border-b border-white/[0.05] last:border-0">
              <Link href={`/panel/api/istekler?id=${u.id}`} className="group grid grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-3 px-5 py-2.5 transition-colors hover:bg-white/[0.025] sm:grid-cols-[38px_minmax(0,1fr)_auto_72px_56px]">
                <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/[0.07] transition group-hover:scale-105"><ModelLogo ad={logoAd(u.model)} boyut={18} /></span>
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] text-white">{String(u.input.prompt ?? u.input.text ?? u.model)}</span>
                  <span className="flex items-center gap-1.5 truncate text-[12px] text-white/55">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-[2px]" style={{ background: turRenk(u.type) }} />
                    {modelAd(u.model)} · <span title={tarihSaat(u.created_at)}>{goreli(u.created_at)}</span>
                  </span>
                </span>
                <DurumRozet durum={u.status} />
                <span className="hidden text-right text-[12.5px] tabular-nums text-white/60 sm:block">{sureMetin(u.metrics.run_ms)}</span>
                <span className="hidden text-right text-[12.5px] tabular-nums text-white/85 sm:block">{u.environment === "test" ? <span className="text-amber-200/80" title="Test istekleri kredi harcamaz">Test</span> : u.status === "succeeded" ? `${u.credits} kr` : "0 kr"}</span>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ── Modellerin ── */

function Modellerin({ liste, aralik }: { liste: ApiUretim[]; aralik: Aralik }) {
  const a = ARALIK.find((x) => x.id === aralik)!;
  const enCok = useMemo(() => {
    const t0 = Date.now() - a.ms;
    const m = new Map<string, number>();
    for (const u of liste) if (zamani(u) >= t0) m.set(u.model, (m.get(u.model) ?? 0) + 1);
    return Array.from(m.entries()).sort((x, y) => y[1] - x[1]).slice(0, 5);
  }, [liste, a.ms]);
  const top = enCok.reduce((t, [, n]) => t + n, 0);

  return (
    <section className={cn(kart, "p-5")}>
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-white">{enCok.length ? "En çok kullandığın modeller" : "Popüler modeller"}</h3>
        <Link href="/panel/api/modeller" className="text-[12.5px] font-medium text-white/60 transition hover:text-white">Tümü ({MODELLER.length})</Link>
      </div>
      {enCok.length ? (
        <ul className="mt-3.5 space-y-3.5">
          {enCok.map(([id, n], i) => {
            const m = MODELLER.find((x) => x.id === id);
            return (
              <li key={id}>
                <Link href={`/panel/api/modeller/${id}`} className="group flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/[0.08] transition group-hover:scale-105"><ModelLogo ad={logoAd(id)} boyut={20} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13.5px] font-medium text-white">{m?.ad ?? id}</span>
                      <span className="shrink-0 text-[12.5px] tabular-nums text-white/65">{n} istek · yüzde {Math.round((n / top) * 100)}</span>
                    </span>
                    <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <motion.span initial={{ width: 0 }} animate={{ width: `${(n / top) * 100}%` }} transition={{ delay: i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="block h-full rounded-full" style={{ background: `linear-gradient(90deg, ${turRenk(liste.find((u) => u.model === id)?.type ?? "")}99, ${turRenk(liste.find((u) => u.model === id)?.type ?? "")})` }} />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {POPULER.map((id) => MODELLER.find((m) => m.id === id)).filter(Boolean).map((m) => (
            <Link key={m!.id} href={`/panel/api/modeller/${m!.id}`} className="group relative block aspect-square overflow-hidden rounded-[16px] ring-1 ring-white/[0.08]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={modelKapak(m!.id)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
              <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/45 backdrop-blur"><ModelLogo ad={logoAd(m!.id)} boyut={13} /></span>
              <span className="absolute inset-x-2 bottom-1.5"><span className="block truncate text-[12px] font-medium text-white">{m!.ad}</span><span className="text-[11px] text-white/65">{m!.kredi} kredi</span></span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Hiç isteği olmayan hesap ── */

const ORNEK_CIKTI: [string, string, string, string][] = [
  ["veo-31", "video", "Cam parfüm şişesi, lüks reklam", "/gercek/video-hareket/commercial.mp4|/gercek/video-hareket/commercial-poster.webp"],
  ["nano-banana-pro", "image", "Kahve ürün çekimi, sıcak ışık", "/gercek/paz/urun-kahve.webp"],
  ["kling-3", "video", "Kırmızı spor araba yörünge çekimi", "/gercek/video-hareket/orbit-left.mp4|/gercek/video-hareket/orbit-left-poster.webp"],
  ["seedream-5", "image", "Kozmik bahçe", modelKapak("seedream-5")],
  ["sora-2", "video", "Karlı zirvede drone çekimi", "/gercek/video-hareket/drone-orbit.mp4|/gercek/video-hareket/drone-orbit-poster.webp"],
  ["meshy-gorsel3d", "3d", "Bilim kurgu kask", modelKapak("meshy-gorsel3d")],
];

function ornekVeri(): ApiUretim[] {
  const simdi = Date.now();
  const l: ApiUretim[] = [];
  const gunluk = [3, 5, 2, 1, 7, 6, 4];
  let n = 0;
  gunluk.forEach((adet, g) => {
    for (let k = 0; k < adet; k++) {
      const [model, type, prompt, medya] = ORNEK_CIKTI[n % ORNEK_CIKTI.length];
      const [url] = medya.split("|");
      const t = simdi - (6 - g) * GUN - k * 2.2 * SAAT - 600_000;
      const basarisiz = n % 11 === 7;
      l.push({
        id: `ornek_${n}`, model, type, status: basarisiz ? "failed" : "succeeded", input: { prompt }, environment: "live", simulated: true, provider: null, metadata: {}, webhook_url: null,
        output: basarisiz ? null : { urls: [url], content_type: type === "video" ? "video/mp4" : type === "3d" ? "model/gltf-binary" : "image/webp" },
        error: basarisiz ? { code: "content_policy", message: "İçerik politikası" } : null, credits: MODELLER.find((m) => m.id === model)?.kredi ?? 5,
        created_at: new Date(t).toISOString(), started_at: null, completed_at: null, metrics: { queue_ms: 400, run_ms: type === "video" ? 52_000 + (n % 5) * 4000 : 5_200 + (n % 4) * 700 }, anahtarId: "ornek",
      });
      n++;
    }
  });
  return l.sort((x, y) => y.created_at.localeCompare(x.created_at));
}

function Baslangic({ anahtarVar, webhookVar }: { anahtarVar: boolean; webhookVar: boolean }) {
  const [aralik, setAralik] = useState<Aralik>("7g");
  const ornek = useMemo(ornekVeri, []);
  const adimlar = [
    { ad: "Anahtar oluştur", tamam: anahtarVar, href: "/panel/api/anahtarlar" },
    { ad: "İlk isteği gönder", tamam: false, href: "#ilk-istek" },
    { ad: "Webhook ekle", tamam: webhookVar, href: "/panel/api/webhooklar" },
    { ad: "Canlıya geç", tamam: false, href: "/panel/api/anahtarlar?yeni=1" },
  ];
  return (
    <>
      <div className="mt-9 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[21px] font-semibold tracking-[-0.02em] text-white">Başlarken</h2>
        <div className="flex flex-wrap gap-2">
          {adimlar.map((a, i) => (
            <Link key={a.ad} href={a.href} className={cn("group flex h-9 items-center gap-2 rounded-full pl-1 pr-3.5 text-[13px] ring-1 transition active:scale-[0.97]", a.tamam ? "text-white ring-white/[0.1]" : "text-white/70 ring-white/[0.08] hover:text-white hover:ring-white/[0.16]")}>
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[11.5px] font-semibold", a.tamam ? "bg-[#55d6fd] text-[#06222b]" : "bg-white/[0.07]")}>{a.tamam ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}</span>
              {a.ad}
            </Link>
          ))}
        </div>
      </div>
      <div id="ilk-istek" className="mt-4 scroll-mt-24"><HizliCalistir /></div>

      {/* Örnek görünüm: ilk istekten sonra dolacak pano */}
      <div className="relative mt-10">
        <div className="pointer-events-none select-none opacity-60 [mask-image:linear-gradient(180deg,black_35%,transparent_95%)]" aria-hidden>
          <Pano liste={ornek} aralik={aralik} setAralik={setAralik} canli ornek />
        </div>
        <div className="absolute inset-x-0 top-24 flex justify-center">
          <div className="mx-4 max-w-[440px] rounded-[24px] bg-[#121316]/90 p-5 text-center ring-1 ring-white/[0.12] backdrop-blur-xl">
            <span className="rounded-full bg-amber-300/12 px-2.5 py-1 text-[12px] font-medium text-amber-200">Örnek görünüm</span>
            <p className="mt-3 text-[17px] font-semibold text-white">İlk isteğinden sonra pano kendi verinle dolar</p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/65">Türe göre harcama, hata grupları, sağlık halkaları ve çıktıların burada görünür.</p>
            <a href="#ilk-istek" className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97]">İlk isteği gönder<ArrowUp className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Mini oyun alanı: gerçek POST /v1/generations ── */
function HizliCalistir() {
  const anahtarlar = useApiAnahtar((s) => s.anahtarlar);
  const olustur = useApiAnahtar((s) => s.anahtarOlustur);
  const [modelId, setModelId] = useState("nano-banana-pro");
  const [istem, setIstem] = useState("Kapadokya üzerinde gün doğumunda sıcak hava balonları, 35mm film");
  const [menu, setMenu] = useState(false);
  const [sonuc, setSonuc] = useState<ApiUretim | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const [gecen, setGecen] = useState(0);
  const iptal = useRef({ durdur: false });
  const m = MODELLER.find((x) => x.id === modelId)!;
  const input = m.tur === "ses" ? { text: istem } : { prompt: istem };
  const kod = `curl -X POST ${apiTaban()}/generations \\\n  -H "Authorization: Bearer $VAYRA_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify({ model: modelId, input })}'`;

  const calistir = async () => {
    if (calisiyor || !istem.trim()) return;
    setCalisiyor(true); setSonuc(null); setGecen(0);
    const bas = Date.now();
    const sayac = setInterval(() => setGecen(Date.now() - bas), 100);
    try {
      let a = anahtarlar.find((x) => x.ortam === "test");
      if (!a) { a = await olustur({ ad: "Test anahtarı", ortam: "test" }); toast.success("Test anahtarı oluşturuldu", { description: "İsteğin bu anahtarla gönderildi; kredi harcamaz." }); }
      const r = await apiIstek<ApiUretim>(a.tam, "POST", "/generations", { govde: { model: modelId, input }, anahtarId: a.id, kaynak: "panel" });
      if (r.durum >= 300) { toast.error("Üretim isteği reddedildi", { description: (r.govde as unknown as { error?: { message?: string } })?.error?.message ?? "Sunucu isteği kabul etmedi. Girdileri kontrol edip yeniden dene." }); return; }
      setSonuc({ ...r.govde, anahtarId: a.id });
      iptal.current = { durdur: false };
      const son = await uretimIzle(a.tam, a.id, r.govde.id, (u) => setSonuc(u), iptal.current);
      if (son) setSonuc(son);
    } finally { clearInterval(sayac); setCalisiyor(false); }
  };

  const url = sonuc?.output?.urls[0];
  const tip = sonuc?.output?.content_type ?? "";
  return (
    <section className="grid overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] ring-1 ring-white/[0.08] md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="min-w-0 p-5">
        <div className="flex items-start justify-between gap-3">
          <div><h2 className="text-[15.5px] font-medium text-white">İlk isteğini buradan gönder</h2><p className="mt-0.5 text-[13px] text-white/60">Test anahtarıyla gider; kredi harcamaz.</p></div>
          <Link href={`/panel/api/modeller/${modelId}`} className="shrink-0 text-[13px] text-white/60 transition hover:text-white">Tam oyun alanı</Link>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-full bg-white/[0.05] py-1 pl-1 pr-1 ring-1 ring-white/[0.09] transition focus-within:ring-[#55d6fd]/50">
          <div className="relative shrink-0">
            <button onClick={() => setMenu((v) => !v)} aria-expanded={menu} className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] pl-1 pr-2 text-[12.5px] text-white transition hover:bg-white/[0.1]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={modelKapak(modelId)} alt="" className="h-6 w-6 rounded-full object-cover" /><span className="hidden max-w-[120px] truncate sm:inline">{m.ad}</span><ChevronDown className="h-3 w-3 text-white/60" />
            </button>
            <Yuzen acik={menu} onKapat={() => setMenu(false)} sol={0} alt="tam" bosluk={6} className="w-[260px] rounded-[16px] bg-[#17181b] p-1.5 ring-1 ring-white/[0.1]">
              {HIZLI_MODELLER.map((id) => { const x = MODELLER.find((y) => y.id === id); if (!x) return null; return (
                <button key={id} onClick={() => { setModelId(id); setMenu(false); setSonuc(null); }} className="flex w-full items-center gap-2.5 rounded-[11px] px-2 py-1.5 text-left hover:bg-white/[0.06]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={modelKapak(id)} alt="" className="h-8 w-8 rounded-[8px] object-cover" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{x.ad}</span><span className="text-[11.5px] text-white/60">{x.tur} · {x.kredi} kredi</span></span>
                  {id === modelId && <Check className="h-3.5 w-3.5 text-[#55d6fd]" />}
                </button>
              ); })}
            </Yuzen>
          </div>
          <input value={istem} onChange={(e) => setIstem(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void calistir()} aria-label="İstem"
            className="h-8 min-w-0 flex-1 bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/60" placeholder="Ne üretilsin?" />
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => void calistir()} disabled={calisiyor || !istem.trim()} aria-label="Gönder" title="Gönder (Enter)"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#55d6fd] text-[#06222b] transition hover:brightness-110 disabled:opacity-50">
            {calisiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </motion.button>
        </div>
        <div className="mt-4"><KodEditor kod={kod} dil="bash" satirNo={false} maxH={160} dosyaAdi="cURL" sag={<Link href={`/panel/api/konsol?uc=uretim-olustur&govde=${encodeURIComponent(JSON.stringify({ model: modelId, input }))}`} className="mr-1 inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[12px] text-[#a9b1d6] hover:bg-white/[0.08] hover:text-white"><Terminal className="h-3.5 w-3.5" />Konsolda aç</Link>} /></div>
      </div>
      <div className="relative min-h-[260px] border-t border-white/[0.07] md:border-l md:border-t-0">
        <AnimatePresence mode="wait">
          {!sonuc && !calisiyor && (
            <motion.div key="bos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-3 overflow-hidden rounded-[16px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={modelKapak(modelId)} alt="" className="h-full w-full object-cover opacity-25 blur-[2px]" />
              <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-[13.5px] text-white/80">Gönder&apos;e bas; yanıt ve çıktı burada açılsın</p>
            </motion.div>
          )}
          {(calisiyor && (!sonuc || sonuc.status === "queued" || sonuc.status === "processing")) && (
            <motion.div key="calisiyor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-3 overflow-hidden rounded-[16px] bg-gradient-to-br from-[#55d6fd]/10 via-white/[0.02] to-transparent">
              <motion.span animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              <span className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-[12px] text-white backdrop-blur-md"><DurumRozet durum={sonuc?.status ?? "queued"} /><span className="tabular-nums">{(gecen / 1000).toFixed(1)} sn</span></span>
            </motion.div>
          )}
          {sonuc && sonuc.status !== "queued" && sonuc.status !== "processing" && (
            <motion.div key="sonuc" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-3 flex flex-col overflow-hidden rounded-[16px] bg-black/30">
              <div className="relative min-h-0 flex-1">
                {sonuc.status === "failed" ? <p className="flex h-full items-center justify-center px-6 text-center text-[13.5px] text-rose-300">{sonuc.error?.message ?? "Üretim başarısız"}</p>
                  : url && tip.startsWith("video") ? <video src={url} autoPlay muted loop playsInline className="h-full w-full object-cover" />
                  : url && tip.startsWith("audio") ? <div className="flex h-full items-center justify-center p-4"><audio src={url} controls className="w-full" /></div>
                  // eslint-disable-next-line @next/next/no-img-element
                  : url ? <img src={url} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] px-3 py-2 text-[12px] text-white/60">
                <DurumRozet durum={sonuc.status} /><span className="tabular-nums">{sureMetin(sonuc.metrics.run_ms)}</span>
                {sonuc.simulated && <span className="rounded-full bg-amber-400/12 px-2 py-0.5 text-amber-200" title="Sağlayıcı anahtarı tanımlı olmadığı için örnek çıktı döndü">Örnek çıktı</span>}
                <Link href={`/panel/api/istekler?id=${sonuc.id}`} className="ml-auto flex items-center gap-1 text-white/80 transition hover:text-white">İsteği aç<ArrowRight className="h-3 w-3" /></Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

