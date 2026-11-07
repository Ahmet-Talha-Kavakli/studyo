"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Ghost, GraduationCap, PanelRight, Telescope, Users, X } from "lucide-react";
import { HAZIR_ASISTANLAR, asistanBul } from "@/lib/build/sohbetAsistan";
import { AsistanKarti, AsistanPaneli } from "./Asistanlar";
import { IstemKitapligi } from "./IstemKitapligi";
import { GorevPaneli } from "./Gorevler";
import { DokumPaneli } from "./Dokum";
import { SagPanel } from "./ortak";
import type { KayitliIstemOzeti } from "./Besteci";
import { useAuth } from "@/store/useAuth";
import { api, ApiHatasi } from "@/lib/build/istemci";
import { VARSAYILAN_MODEL } from "@/lib/build/modeller";
import { cn } from "@/lib/utils";
import { Besteci, VAYRA_ARACLARI, type Efor, type Kip } from "./Besteci";
import { KurulPaneli } from "./Kurul";
import { sohbetBaslat } from "./SohbetEkrani";
import type { Baglam, Sohbet, TurIstegi } from "./tipler";

function oku<T>(k: string, v: T): T { try { const x = localStorage.getItem(k); return x ? (JSON.parse(x) as T) : v; } catch { return v; } }
const selam = () => { const s = new Date().getHours(); return s < 5 ? "İyi geceler" : s < 12 ? "Günaydın" : s < 18 ? "İyi günler" : "İyi akşamlar"; };

const ONERILER: { metin: string; istek?: TurIstegi; ikon: "arastirma" | "gorsel" | "kurul" | "yaz" }[] = [
  { metin: "Türkiye'de elektrikli araç pazarını kaynaklarıyla araştır", istek: { arastirma: true }, ikon: "arastirma" },
  { metin: "Kahve markam için 4 logo fikri üret", istek: { arac: "gorsel_uret" }, ikon: "gorsel" },
  { metin: "Bir girişim fikrini güçlü ve zayıf yönleriyle değerlendir", ikon: "kurul" },
  { metin: "Bu metni daha akıcı ve kısa hale getir", ikon: "yaz" },
];

/**
 * Yeni sohbet ekranı (Claude'un boş sohbeti gibi): selam, cam komut kutusu (bütün araçlarıyla), geçici sohbet
 * anahtarı, klasör bağlamı, öneriler. İlk mesajla sohbet açılır ve sohbet ekranına geçilir.
 */
export function YeniSohbet() {
  const router = useRouter();
  const ara = useSearchParams();
  const [dokum, setDokum] = useState<{ id?: string } | null>(null);
  useEffect(() => { const d = ara.get("dokum"); if (d) setDokum({ id: d }); }, [ara]);
  const kullanici = useAuth((x) => x.kullanici);
  const [deger, setDeger] = useState("");
  const [model, setModel] = useState(VARSAYILAN_MODEL);
  const [efor, setEfor] = useState<Efor>("medium");
  const [kip, setKip] = useState<Kip>({});
  const [gecici, setGecici] = useState(false);
  const [ayar, setAyar] = useState<Partial<Sohbet>>({});
  const [baglam, setBaglam] = useState<Baglam | null>(null);
  const [modelBaglantilari, setModelBaglantilari] = useState<Record<string, string | null>>();
  const [kurulAcik, setKurulAcik] = useState(false);
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  const [asistan, setAsistan] = useState<string | null>(null);
  const [ogrenme, setOgrenme] = useState(false);
  const [asistanSec, setAsistanSec] = useState(false);
  const [asistanAyrinti, setAsistanAyrinti] = useState<string | null>(null);
  const [istemAcik, setIstemAcik] = useState(false);
  const [istemler, setIstemler] = useState<KayitliIstemOzeti[]>([]);
  const [gorevPanel, setGorevPanel] = useState<string | null>(null);
  const as = asistanBul(asistan);
  const istemleriYukle = () => api<{ istemler: KayitliIstemOzeti[] }>("/api/build/sohbet/istemler").then((v) => setIstemler(v.istemler)).catch(() => {});
  const klasorId = ara.get("klasor") ?? undefined;
  const klasor = baglam?.klasorler.find((k) => k.id === klasorId);

  useEffect(() => {
    setModel(oku("vayra-build-model", VARSAYILAN_MODEL));
    setEfor(oku<Efor>("vayra-sohbet-efor", "medium"));
    if (ara.get("gecici") === "1") setGecici(true);
    try { const t = sessionStorage.getItem("vayra-sohbet-taslak"); if (t) { sessionStorage.removeItem("vayra-sohbet-taslak"); const v = JSON.parse(t) as { metin: string; istek?: TurIstegi; asistan?: string }; setDeger(v.metin); if (v.istek) setKip({ arastirma: v.istek.arastirma, arac: v.istek.arac }); if (v.asistan && asistanBul(v.asistan)) { setAsistan(v.asistan); setOgrenme(!!asistanBul(v.asistan)?.kip?.ogrenme); } } } catch { /* yok */ }
    if (ara.get("asistan") && asistanBul(ara.get("asistan"))) { setAsistan(ara.get("asistan")); setOgrenme(!!asistanBul(ara.get("asistan"))?.kip?.ogrenme); }
    istemleriYukle();
    api<Baglam>("/api/build/sohbet/baglam").then(setBaglam).catch(() => {});
    fetch("/api/build/modeller").then((r) => r.json()).then((v) => setModelBaglantilari(v.baglantilar)).catch(() => {});
  }, [ara]);

  const basla = async (g: { metin: string; ekler: import("./tipler").Ek[]; istek?: TurIstegi }) => {
    if (gidiyor) return;
    setGidiyor(true); setHata("");
    try {
      const istek = as?.kip?.tuval && !g.ekler.length ? { ...g.istek, tuval: true } : g.istek;
      const id = await sohbetBaslat(g.metin, g.ekler, model, { klasor: klasorId, gecici: gecici && !klasorId, istek, efor, izinModu: ayar.izinModu });
      const yama: Record<string, unknown> = {};
      if (ayar.baglantiSecimi) yama.baglantiSecimi = ayar.baglantiSecimi;
      if (ayar.kapaliYetenekler) yama.kapaliYetenekler = ayar.kapaliYetenekler;
      if (ayar.bellekKapali) yama.bellekKapali = true;
      if (efor !== "medium") yama.efor = efor;
      if (asistan) yama.asistan = asistan;
      if (ogrenme) yama.ogrenme = true;
      if (Object.keys(yama).length) await api(`/api/build/sohbet/${id}`, { method: "PATCH", govde: yama }).catch(() => {});
      router.push(`/panel/build/sohbet/${id}`);
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Sohbet açılamadı. Bağlantını kontrol et."); setGidiyor(false); }
  };

  return (
    <div className="relative flex min-h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 px-4 pl-16 md:pl-4">
        {klasor && <Link href={`/panel/build/sohbet/klasor/${klasor.id}`} className="flex h-9 items-center gap-2 rounded-[10px] px-2.5 text-[13.5px] text-white/75 hover:bg-white/[0.06] hover:text-white"><span className="h-2.5 w-2.5 rounded-[4px]" style={{ background: klasor.renk }} />{klasor.ad}</Link>}
        <span className="ml-auto" />
        <button type="button" onClick={() => setAsistanSec(true)} className={cn("flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] transition-colors", as ? "bg-white/[0.1] text-white" : "bg-white/[0.06] text-white/75 hover:bg-white/[0.1] hover:text-white")}><Bot className="h-4 w-4" /><span className="max-sm:hidden">{as ? as.ad : "Asistanlar"}</span></button>
        {!klasorId && (
          <button type="button" onClick={() => setGecici((x) => !x)} aria-pressed={gecici} title="Geçici sohbet: geçmişe ve belleğe kaydedilmez"
            className={cn("flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] transition-colors", gecici ? "bg-white text-black" : "bg-white/[0.06] text-white/75 hover:bg-white/[0.1] hover:text-white")}>
            <Ghost className="h-4 w-4" />Geçici sohbet
          </button>
        )}
      </header>
      <div className="mx-auto flex w-full max-w-[780px] flex-1 flex-col justify-center px-4 pb-16">
        <AnimatePresence mode="wait">
          <motion.div key={gecici ? "g" : "n"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="mb-7 text-center">
            {as && !gecici ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={as.kapak} alt="" className="mx-auto mb-4 h-16 w-16 rounded-[20px] object-cover ring-1 ring-inset ring-white/10" />
                <h1 className="flex items-center justify-center gap-2 text-[26px] font-semibold tracking-[-0.03em] text-white sm:text-[32px]">{as.ad}<button type="button" onClick={() => { setAsistan(null); setOgrenme(false); }} title="Asistanı kaldır" aria-label="Asistanı kaldır" className="flex h-8 w-8 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.07] hover:text-white"><X className="h-4 w-4" /></button></h1>
                <p className="mx-auto mt-2 max-w-[520px] text-[14px] leading-relaxed text-white/60">{as.karsilama}</p>
              </>
            ) : gecici ? (
              <>
                <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[15px] bg-white/[0.07] text-white"><Ghost className="h-6 w-6" /></span>
                <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-white sm:text-[34px]">Geçici sohbet</h1>
                <p className="mx-auto mt-2 max-w-[460px] text-[14px] leading-relaxed text-white/55">Bu sohbet geçmişinde görünmez, belleğe yazılmaz ve bellek kullanmaz. Ayrılınca silinir.</p>
              </>
            ) : (
              <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-white sm:text-[36px]">{selam()}{kullanici?.ad ? `, ${kullanici.ad}` : ""}. <span className="bg-gradient-to-r from-[#55d6fd] to-[#b9f0ff] bg-clip-text text-transparent">Bugün ne yapalım?</span></h1>
            )}
            {klasor && !gecici && <p className="mt-2 text-[14px] text-white/55">Bu sohbet <span className="text-white/85">{klasor.ad}</span> klasörünün talimatını ve dosyalarını kullanır.</p>}
          </motion.div>
        </AnimatePresence>
        <Besteci deger={deger} setDeger={setDeger} model={model} setModel={(m) => { setModel(m); try { localStorage.setItem("vayra-build-model", JSON.stringify(m)); } catch { /* yok */ } }}
          efor={efor} setEfor={(e) => { setEfor(e); try { localStorage.setItem("vayra-sohbet-efor", JSON.stringify(e)); } catch { /* yok */ } }}
          modelBaglantilari={modelBaglantilari} calisiyor={gidiyor} durdur={() => {}} baglam={baglam} s={{ ...ayar, gecici }} ayarDegis={(p) => setAyar((x) => ({ ...x, ...p }))}
          kip={kip} setKip={setKip} kurulAc={() => setKurulAcik(true)} otomatikOdak
          ogrenme={ogrenme} ogrenmeDegis={setOgrenme} istemAc={() => setIstemAcik(true)} istemler={istemler} zamanla={gecici ? undefined : (m) => setGorevPanel(m)} dokumAc={() => setDokum({})}
          yer={kip.arastirma ? "Ne araştırılsın? Önce bir plan çıkarılır…" : kip.kurul ? "Kurula ne sorulsun?" : gecici ? "Geçici sohbete yaz…" : "Vayra'ya yaz, / ile komut, @ ile bahset"}
          gonder={basla} />
        <DokumPaneli acik={!!dokum} kapat={() => setDokum(null)} ilkId={dokum?.id} model={model} />
        {hata && <p className="mt-2 text-center text-[13px] text-rose-300">{hata}</p>}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => setKip({ ...kip, arastirma: !kip.arastirma, kurul: undefined })} className={cn("flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] ring-1 ring-inset transition-colors", kip.arastirma ? "bg-[#55d6fd]/[0.12] text-[#8be6ff] ring-[#55d6fd]/30" : "bg-white/[0.04] text-white/70 ring-white/[0.08] hover:bg-white/[0.08] hover:text-white")}><Telescope className="h-4 w-4" />Araştırma</button>
          {VAYRA_ARACLARI.slice(0, 2).map((a) => (
            <button key={a.id} type="button" onClick={() => setKip({ ...kip, arac: kip.arac === a.id ? undefined : a.id })} className={cn("flex h-9 items-center gap-1.5 rounded-full pl-1.5 pr-3.5 text-[13px] ring-1 ring-inset transition-colors", kip.arac === a.id ? "bg-[#55d6fd]/[0.12] text-[#8be6ff] ring-[#55d6fd]/30" : "bg-white/[0.04] text-white/70 ring-white/[0.08] hover:bg-white/[0.08] hover:text-white")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.gorsel} alt="" className="h-6 w-6 rounded-full object-cover" />{a.ad}
            </button>
          ))}
          <button type="button" onClick={() => setKurulAcik(true)} className={cn("flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] ring-1 ring-inset transition-colors", kip.kurul ? "bg-[#55d6fd]/[0.12] text-[#8be6ff] ring-[#55d6fd]/30" : "bg-white/[0.04] text-white/70 ring-white/[0.08] hover:bg-white/[0.08] hover:text-white")}><Users className="h-4 w-4" />Model kurulu</button>
          <button type="button" onClick={() => setOgrenme((x) => !x)} aria-pressed={ogrenme} className={cn("flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] ring-1 ring-inset transition-colors", ogrenme ? "bg-[#55d6fd]/[0.12] text-[#8be6ff] ring-[#55d6fd]/30" : "bg-white/[0.04] text-white/70 ring-white/[0.08] hover:bg-white/[0.08] hover:text-white")}><GraduationCap className="h-4 w-4" />Öğrenme</button>
          <button type="button" onClick={() => setKip({ ...kip, tuval: !kip.tuval })} aria-pressed={!!kip.tuval} className={cn("flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] ring-1 ring-inset transition-colors", kip.tuval ? "bg-[#55d6fd]/[0.12] text-[#8be6ff] ring-[#55d6fd]/30" : "bg-white/[0.04] text-white/70 ring-white/[0.08] hover:bg-white/[0.08] hover:text-white")}><PanelRight className="h-4 w-4" />Tuval</button>
        </div>
        {!deger && as && !gecici && (
          <div className="mx-auto mt-6 grid w-full max-w-[620px] gap-2 sm:grid-cols-2">
            {as.baslangiclar.map((b) => <button key={b} type="button" onClick={() => setDeger(b)} className="rounded-[16px] bg-white/[0.035] px-3.5 py-3 text-left text-[13.5px] leading-snug text-white/70 ring-1 ring-inset ring-white/[0.06] transition-colors hover:bg-white/[0.07] hover:text-white">{b}</button>)}
          </div>
        )}
        {!deger && !as && (
          <div className="mx-auto mt-6 grid w-full max-w-[620px] gap-2 sm:grid-cols-2">
            {ONERILER.map((o) => (
              <button key={o.metin} type="button" onClick={() => { setDeger(o.metin); if (o.istek) setKip({ ...kip, arastirma: o.istek.arastirma, arac: o.istek.arac }); }}
                className="rounded-[16px] bg-white/[0.035] px-3.5 py-3 text-left text-[13.5px] leading-snug text-white/70 ring-1 ring-inset ring-white/[0.06] transition-colors hover:bg-white/[0.07] hover:text-white">{o.metin}</button>
            ))}
          </div>
        )}
      </div>
      <SagPanel acik={asistanSec} kapat={() => setAsistanSec(false)} baslik="Asistan seç" alt="Sohbet bu asistanın talimatıyla başlar" ikon={<Bot className="h-[18px] w-[18px]" />} genislik={680}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {HAZIR_ASISTANLAR.map((a) => (
            <div key={a.id} className="relative">
              <AsistanKarti a={a} sec={() => { setAsistan(a.id); setOgrenme(!!a.kip?.ogrenme); setKip((k) => ({ ...k, tuval: undefined })); setAsistanSec(false); }} />
              {asistan === a.id && <span className="pointer-events-none absolute inset-0 rounded-[18px] ring-2 ring-inset ring-white" />}
              <button type="button" onClick={() => setAsistanAyrinti(a.id)} className="absolute right-2 top-2 h-7 rounded-full bg-black/45 px-2.5 text-[11.5px] text-white/85 backdrop-blur hover:bg-black/60">Ayrıntı</button>
            </div>
          ))}
        </div>
      </SagPanel>
      <AsistanPaneli a={asistanBul(asistanAyrinti)} kapat={() => setAsistanAyrinti(null)} baslat={(a, ilk) => { setAsistan(a.id); setOgrenme(!!a.kip?.ogrenme); setAsistanAyrinti(null); setAsistanSec(false); if (ilk) setDeger(ilk); }} />
      <IstemKitapligi acik={istemAcik} kapat={() => setIstemAcik(false)} taslak={deger} istemler={istemler} yenile={istemleriYukle}
        kullan={(metin, k) => { setDeger(metin); if (k === "tuval") setKip({ ...kip, tuval: true }); else if (k === "arastirma") setKip({ ...kip, arastirma: true }); else if (k === "gorsel") setKip({ ...kip, arac: "gorsel_uret" }); else if (k === "ogrenme") setOgrenme(true); }} />
      <GorevPaneli acik={gorevPanel !== null} kapat={() => setGorevPanel(null)} ilk={gorevPanel !== null ? { istem: gorevPanel, ad: gorevPanel.slice(0, 40) } : undefined} model={model} bitti={(g) => router.push(`/panel/build/sohbet/${g.sohbet}`)} />
      <KurulPaneli acik={kurulAcik} kapat={() => setKurulAcik(false)} deger={kip.kurul} kur={(k) => setKip({ ...kip, kurul: k, arastirma: k ? false : kip.arastirma })} baglantilar={modelBaglantilari} />
    </div>
  );
}
