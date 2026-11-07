"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion, MotionConfig } from "framer-motion";
import { ArrowRight, Check, Code2, Copy, Eye, FileCode2, FileJson, FileText, GitFork, Gamepad2, Globe, Image as ImageIcon, Info, LayoutDashboard, Loader2, Lock, Smartphone, SquareArrowOutUpRight, UserRound } from "lucide-react";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { vurgula } from "@/components/build/calisma/vurgula";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { yazarAdi, type PaylasimGorunumu } from "@/lib/build/paylasimOrtak";
import type { ProjeTur } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { CihazSecici, OnizlemeCercevesi, sayiYaz, yay, type Cihaz } from "./ortak";

const TUR_IKON: Record<ProjeTur, typeof Globe> = { site: Globe, uygulama: LayoutDashboard, oyun: Gamepad2, mobil: Smartphone };
const TUR_AD: Record<ProjeTur, string> = { site: "Web sitesi", uygulama: "Web uygulaması", oyun: "Oyun", mobil: "Mobil uygulama" };

function dosyaIkonu(yol: string) {
  if (/\.(json|webmanifest)$/.test(yol)) return FileJson;
  if (/\.(svg|png|jpe?g|webp)$/.test(yol)) return ImageIcon;
  if (/\.(md|txt)$/.test(yol)) return FileText;
  return FileCode2;
}
const boyutYaz = (n: number) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(n < 10240 ? 1 : 0).replace(".", ",")} KB`);

/** Salt okunur kod görünümü: solda dosyalar, sağda satır numaralı renklendirilmiş kod. */
function KodGorunumu({ id }: { id: string }) {
  const [dosyalar, setDosyalar] = useState<Record<string, string> | null>(null);
  const [hata, setHata] = useState("");
  const [secili, setSecili] = useState("index.html");
  const [kopya, setKopya] = useState(false);
  useEffect(() => {
    api<{ dosyalar: Record<string, string> }>(`/api/build/paylasim/${id}/dosyalar`).then((v) => { setDosyalar(v.dosyalar); setSecili((s) => (s in v.dosyalar ? s : Object.keys(v.dosyalar)[0] ?? "")); })
      .catch((e) => setHata(e instanceof ApiHatasi ? e.message : "Dosyalar yüklenemedi."));
  }, [id]);
  const yollar = useMemo(() => Object.keys(dosyalar ?? {}).sort((a, b) => (a === "index.html" ? -1 : b === "index.html" ? 1 : a.split("/").length - b.split("/").length || a.localeCompare(b))), [dosyalar]);
  const kod = dosyalar?.[secili] ?? "";
  const html = useMemo(() => vurgula(kod, secili), [kod, secili]);
  const satir = kod.split("\n").length;
  if (hata) return <div className="flex h-full items-center justify-center p-6 text-[13px] text-white/55">{hata}</div>;
  if (!dosyalar) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/35" /></div>;
  return (
    <div className="flex h-full min-h-0 max-md:flex-col">
      <nav className="shrink-0 overflow-auto border-white/[0.06] p-2 [scrollbar-width:thin] md:w-[250px] md:border-r max-md:flex max-md:gap-1 max-md:border-b">
        <p className="px-2 pb-1.5 pt-1 text-[12px] text-white/45 max-md:hidden">{yollar.length} dosya</p>
        {yollar.map((y) => {
          const I = dosyaIkonu(y);
          const klasor = y.includes("/") ? y.slice(0, y.lastIndexOf("/") + 1) : "";
          return (
            <button key={y} type="button" onClick={() => setSecili(y)} className={cn("flex items-center gap-2 rounded-[9px] px-2 py-1.5 text-left text-[12.5px] transition-colors md:w-full max-md:shrink-0", secili === y ? "bg-white/[0.08] text-white ring-1 ring-inset ring-white/50" : "text-white/65 hover:bg-white/[0.04] hover:text-white")}>
              <I className="h-3.5 w-3.5 shrink-0 text-white/40" /><span className="min-w-0 truncate"><span className="text-white/40">{klasor}</span>{y.slice(klasor.length)}</span>
            </button>
          );
        })}
      </nav>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-white/[0.06] px-3">
          <span className="min-w-0 truncate text-[13px] font-medium text-white">{secili}</span>
          <span className="shrink-0 text-[12px] tabular-nums text-white/40">{satir} satır · {boyutYaz(new Blob([kod]).size)}</span>
          <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] text-white/55"><Lock className="h-3 w-3" />Salt okunur</span>
          <button type="button" onClick={() => { navigator.clipboard?.writeText(kod).catch(() => {}); setKopya(true); setTimeout(() => setKopya(false), 1400); }} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.13]">
            {kopya ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}<span className="max-sm:hidden">{kopya ? "Kopyalandı" : "Kopyala"}</span>
          </button>
        </div>
        <div className="kod-renk sc-kod flex min-h-0 flex-1 overflow-auto bg-[#0c0d0f] text-[12.5px] leading-[1.65] [scrollbar-width:thin]">
          <div aria-hidden className="sticky left-0 shrink-0 select-none bg-[#0c0d0f] py-3 pl-3 pr-3 text-right tabular-nums text-white/25">{Array.from({ length: satir }, (_, i) => <div key={i}>{i + 1}</div>)}</div>
          <pre className="min-w-0 flex-1 py-3 pr-4 text-white/85"><code dangerouslySetInnerHTML={{ __html: html }} /></pre>
        </div>
      </div>
    </div>
  );
}

/**
 * Herkese açık paylaşım sayfası (/p/b/<id>): sade Vayra başlığı, kahraman olarak canlı önizleme (masaüstü ve telefon),
 * sahibin izin verdiği kadar salt okunur kod, remix ve "Vayra Build ile yap".
 */
export function PaylasilanProje({ v }: { v: PaylasimGorunumu }) {
  const router = useRouter();
  const [sekme, setSekme] = useState<"onizleme" | "kod">("onizleme");
  const [cihaz, setCihaz] = useState<Cihaz>(v.tur === "mobil" ? "telefon" : "masaustu");
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  const [goruntulenme, setGoruntulenme] = useState(v.goruntulenme);
  const onizleme = `/api/build/paylasim/${v.id}/onizleme`;
  const TurIkon = TUR_IKON[v.tur];
  const yazar = yazarAdi(v.yazar);

  /* Görüntülenme: sekme başına bir kez; sahibin anahtarı varsa sunucu saymaz. */
  useEffect(() => {
    const k = `vayra-p-gor-${v.id}`;
    try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, "1"); } catch { /* yok */ }
    let anahtar = "";
    try { anahtar = localStorage.getItem("vayra-build-sahip") ?? ""; } catch { /* yok */ }
    fetch(`/api/build/paylasim/${v.id}/goruntule`, { method: "POST", headers: anahtar ? { "x-build-sahip": anahtar } : {} }).then((r) => r.json()).then((j) => { if (typeof j.goruntulenme === "number") setGoruntulenme(j.goruntulenme); }).catch(() => {});
  }, [v.id]);

  const remix = async () => {
    setGidiyor(true); setHata("");
    try { const x = await api<{ id: string }>(`/api/build/paylasim/${v.id}/remix`, { govde: {} }); router.push(`/panel/build/${x.id}`); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Remix yapılamadı."); setGidiyor(false); }
  };
  const RemixDugmesi = ({ buyuk }: { buyuk?: boolean }) => (
    <button type="button" onClick={remix} disabled={gidiyor} className={cn("inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-white font-semibold text-black transition active:scale-[0.97] disabled:opacity-60", buyuk ? "h-11 px-6 text-[14px]" : "h-9 px-4 text-[13px]")}>
      {gidiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitFork className="h-4 w-4" />}{gidiyor ? "Kopyalanıyor" : "Remix"}
    </button>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#0b0b0c] text-white">
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0b0b0c]/85 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-[1640px] items-center gap-3 px-4 lg:px-6">
            <Link href="/panel/build" className="flex items-center gap-2"><VayraIsaret size={22} /><span className="text-[15px] font-semibold tracking-[-0.02em]">Vayra <span className="hero-isilti">Build</span></span></Link>
            <span className="ml-auto" />
            <Link href="/panel/build" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] font-medium text-white transition-colors hover:bg-white/[0.13] max-sm:hidden">Vayra Build ile yap<ArrowRight className="h-3.5 w-3.5" /></Link>
            {v.remix && <RemixDugmesi />}
          </div>
        </header>

        <main className="mx-auto max-w-[1640px] px-3 pb-16 pt-4 sm:px-4 lg:px-6">
          {/* başlık kartı + kahraman önizleme */}
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="overflow-hidden rounded-[26px] bg-[#121315] ring-1 ring-inset ring-white/[0.07]">
            <header className="flex flex-wrap items-center gap-x-3 gap-y-2.5 border-b border-white/[0.06] px-3 py-3 sm:px-4">
              {v.kapak ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={v.kapak} alt="" className="h-11 w-[70px] shrink-0 rounded-[10px] object-cover object-top ring-1 ring-inset ring-white/[0.1]" />
                : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.07] text-white/75"><TurIkon className="h-5 w-5" /></span>}
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[17px] font-semibold tracking-[-0.02em] text-white sm:text-[19px]">{v.ad}</h1>
                <p className="flex min-w-0 items-center gap-1.5 truncate text-[12.5px] text-white/50">
                  <UserRound className="h-3.5 w-3.5 shrink-0" /><span className="truncate text-white/70">{yazar}</span>
                  <span className="text-white/25">·</span><span className="shrink-0">{TUR_AD[v.tur]}</span>
                  <span className="text-white/25 max-sm:hidden">·</span><span className="shrink-0 max-sm:hidden">Sürüm {v.surumNo}{v.sabit ? "" : `, ${gorece(v.surumZaman)}`}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 max-sm:w-full">
                {v.kod && (
                  <LayoutGroup id="pp-sekme">
                    <div className="flex rounded-full bg-white/[0.08] p-0.5">
                      {([["onizleme", Eye, "Önizleme"], ["kod", Code2, "Kod"]] as const).map(([s, I, ad]) => (
                        <button key={s} type="button" onClick={() => setSekme(s)} className={cn("relative flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-medium transition-colors", sekme === s ? "text-black" : "text-white/60 hover:text-white")}>
                          {sekme === s && <motion.span layoutId="pp-sekme-z" transition={yay} className="absolute inset-0 rounded-full bg-white" />}<I className="relative h-3.5 w-3.5" /><span className="relative">{ad}</span>
                        </button>
                      ))}
                    </div>
                  </LayoutGroup>
                )}
                <AnimatePresence initial={false}>{sekme === "onizleme" && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden max-sm:hidden"><CihazSecici id="pp-cihaz" deger={cihaz} set={setCihaz} /></motion.span>}</AnimatePresence>
                <span className="flex-1 sm:hidden" />
                <a href={onizleme} target="_blank" rel="noopener noreferrer" title="Yeni sekmede aç" aria-label="Yeni sekmede aç" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white/70 transition-colors hover:bg-white/[0.13] hover:text-white"><SquareArrowOutUpRight className="h-4 w-4" /></a>
              </div>
            </header>
            <div className="h-[calc(100svh-150px)] min-h-[520px] max-sm:h-[72svh] max-sm:min-h-[460px]">
              {sekme === "kod" && v.kod ? <KodGorunumu id={v.id} /> : <OnizlemeCercevesi src={onizleme} baslik={v.ad} cihaz={cihaz} />}
            </div>
          </motion.section>

          {/* hakkında + remix */}
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
            <section className="overflow-hidden rounded-[26px] bg-[#121315] ring-1 ring-inset ring-white/[0.07]">
              <header className="flex min-h-[58px] items-center gap-3 border-b border-white/[0.06] px-4 py-2.5 sm:px-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.07] text-white"><Info className="h-[18px] w-[18px]" /></span>
                <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-white">Proje hakkında</h2>
              </header>
              <div className="p-4 sm:p-5">
                <p className={cn("whitespace-pre-line text-[14px] leading-relaxed", v.aciklama ? "text-white/80" : "text-white/45")}>{v.aciklama || `${yazar} bu proje için bir açıklama yazmadı. Önizlemeyi gezebilir${v.kod ? ", kodunu inceleyebilir" : ""}${v.remix ? " ya da remix edip kendine uyarlayabilirsin" : ""}.`}</p>
                <dl className="mt-4 grid grid-cols-4 divide-x divide-white/[0.06] rounded-[16px] bg-white/[0.03] py-3 text-center ring-1 ring-inset ring-white/[0.06] max-sm:grid-cols-2 max-sm:divide-x-0 max-sm:gap-y-3">
                  {([["Görüntülenme", sayiYaz(goruntulenme)], ["Remix", sayiYaz(v.remixSayisi)], ["Sayfa", sayiYaz(v.sayfaSayisi)], ["Dosya", sayiYaz(v.dosyaSayisi)]] as const).map(([a, d]) => (
                    <div key={a}><dt className="text-[12px] text-white/45">{a}</dt><dd className="mt-0.5 text-[18px] font-semibold tabular-nums tracking-[-0.02em] text-white">{d}</dd></div>
                  ))}
                </dl>
                {v.sunucuGerekli && <p className="mt-3 flex items-start gap-2 rounded-[14px] bg-amber-300/[0.06] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-amber-100/80 ring-1 ring-inset ring-amber-300/15"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Bu projenin veritabanı, üyelik ya da sunucu fonksiyonu kullanan bölümleri paylaşım önizlemesinde kapalıdır. Remix ettiğinde kodu gelir; sahibinin verileri gelmez.</p>}
                <p className="mt-3 text-[12px] text-white/40">Paylaşıldı: {new Date(v.olusturma).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}{v.sabit ? ` · sürüm ${v.surumNo} sabit` : " · her zaman son sürüm"}</p>
              </div>
            </section>

            <section className="flex flex-col overflow-hidden rounded-[26px] bg-[#121315] ring-1 ring-inset ring-white/[0.07]">
              <header className="flex min-h-[58px] items-center gap-3 border-b border-white/[0.06] px-4 py-2.5 sm:px-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#55d6fd]/[0.12] text-[#7fe0ff]"><GitFork className="h-[18px] w-[18px]" /></span>
                <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-white">{v.remix ? "Kendi kopyanı yap" : "Sen de yap"}</h2>
              </header>
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <p className="text-[13.5px] leading-relaxed text-white/65">{v.remix
                  ? "Remix, bu sürümün dosyalarını kendi projelerine kopyalar. Sohbetle istediğin gibi değiştirir, kendi adresinde yayınlarsın; asıl proje etkilenmez."
                  : "Sahibi bu projenin remix edilmesini kapattı. Benzerini anlatarak sıfırdan yapabilirsin."}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  {v.remix && <RemixDugmesi buyuk />}
                  <Link href="/panel/build" className={cn("inline-flex h-11 items-center gap-1.5 rounded-full px-5 text-[14px] font-medium transition-colors", v.remix ? "bg-white/[0.08] text-white hover:bg-white/[0.13]" : "bg-white font-semibold text-black")}>Vayra Build ile yap<ArrowRight className="h-4 w-4" /></Link>
                </div>
                <AnimatePresence>{hata && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3 text-[12.5px] text-rose-300">{hata}</motion.p>}</AnimatePresence>
              </div>
            </section>
          </div>
        </main>
      </div>
    </MotionConfig>
  );
}

/** Bağlantı kaldırılmış ya da hiç yoksa. */
export function PaylasimYok() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0b0b0c] text-white">
      <header className="border-b border-white/[0.06]">
        <div className="mx-auto flex h-14 max-w-[1640px] items-center px-4 lg:px-6">
          <Link href="/panel/build" className="flex items-center gap-2"><VayraIsaret size={22} /><span className="text-[15px] font-semibold tracking-[-0.02em]">Vayra <span className="hero-isilti">Build</span></span></Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4">
        <section className="w-full max-w-[460px] overflow-hidden rounded-[26px] bg-[#121315] text-center ring-1 ring-inset ring-white/[0.07]">
          <header className="border-b border-white/[0.06] px-5 py-4"><h1 className="text-[17px] font-semibold tracking-[-0.02em]">Bu bağlantı çalışmıyor</h1></header>
          <div className="px-6 py-7">
            <p className="text-[13.5px] leading-relaxed text-white/60">Sahibi paylaşımı kaldırmış, proje silinmiş ya da adres eksik yazılmış olabilir.</p>
            <Link href="/panel/build" className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black">Vayra Build ile yap<ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </main>
    </div>
  );
}
