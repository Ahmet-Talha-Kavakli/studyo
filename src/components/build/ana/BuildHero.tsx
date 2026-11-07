"use client";

import { memo, useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { CreditCard, Database, Paintbrush, Gamepad2, Globe, Inbox, Languages, LayoutDashboard, Loader2, MapPin, MessageCircle, Minus, Newspaper, Plus, Shuffle, Smartphone, Sparkles, Undo2, UserRound, Wand2 } from "lucide-react";
import { Komut, type KomutEki } from "@/components/build/Komut";
import type { AjanMod } from "@/lib/build/ajan";
import { BUILD_MODELLERI, SAGLAYICILAR, type BuildSaglayici } from "@/lib/build/modeller";
import { duvarSiralari, type DuvarKaro } from "@/lib/build/vitrin";
import type { ProjeTur } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { api } from "@/lib/build/istemci";
import { buildKrediUygula } from "@/lib/build/istemciKredi";
import { IstemSorulari, yanitlariEkle, type IstemSorusu } from "./IstemSorulari";

const yay = { type: "spring" as const, stiffness: 460, damping: 38 };
const giris = (gecikme: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.75, delay: gecikme, ease: [0.22, 1, 0.36, 1] as const } });

/** Hero'daki seçim: dört proje türü ya da genel sohbet. */
export type HeroTur = ProjeTur | "sohbet";

export const TURLER: { id: HeroTur; ad: string; kisa: string; kelime: string; alt: string; ikon: typeof Globe; gorsel: string; yer: string }[] = [
  { id: "site", ad: "Web sitesi", kisa: "Site", kelime: "Siten", alt: "Tanıtım, form", ikon: Globe, gorsel: "/gercek/build/sablon/kahve.webp", yer: "Nasıl bir site? Kimin için, hangi sayfalar olsun?" },
  { id: "uygulama", ad: "Web uygulaması", kisa: "Uygulama", kelime: "Uygulaman", alt: "Panel, araç", ikon: LayoutDashboard, gorsel: "/gercek/build/sablon/satis-paneli.webp", yer: "Uygulama ne yapacak? Hangi ekranlar olsun?" },
  { id: "oyun", ad: "Oyun", kisa: "Oyun", kelime: "Oyunun", alt: "Tarayıcıda", ikon: Gamepad2, gorsel: "/gercek/build/sablon/neon-kosu.webp", yer: "Nasıl bir oyun? Tür, karakter, kurallar, görünüş…" },
  { id: "mobil", ad: "Mobil uygulama", kisa: "Mobil", kelime: "Mobil uygulaman", alt: "iOS, Android", ikon: Smartphone, gorsel: "/gercek/build/sablon/evcil-dostum.webp", yer: "Uygulama ne yapacak? Kimler kullanacak?" },
  { id: "sohbet", ad: "Sohbet", kisa: "Sohbet", kelime: "Cevabın", alt: "Sor, araştır", ikon: MessageCircle, gorsel: "/gercek/arac/gorsel-ilham-manzara.webp", yer: "Bir şey sor, web'de araştırt, kod yazdır ya da görsel, video, müzik ürettir…" },
];

export const ORNEKLER: Record<HeroTur, string[]> = {
  site: ["Kadıköy'de üçüncü dalga bir kahveci için menülü, rezervasyonlu site", "Düğün davetiyesi ve LCV sayfası", "Karanlık temalı fotoğrafçı portfolyosu", "Diş kliniği için randevu formlu site"],
  uygulama: ["Grafikli antrenman takip uygulaması", "Ekip için sürükle bırak görev panosu", "Kategorili kişisel bütçe takipçisi", "Kitap okuma listesi ve notları"],
  oyun: ["Neon şehirde robotla sonsuz koşu oyunu", "Arkadaşlarla oynanan kelime tahmin oyunu", "Uzay gemisiyle asteroit vurma oyunu", "Piksel sanatlı platform oyunu, 3 bölüm"],
  mobil: ["Evcil hayvan bakım uygulaması: yürüyüş, mama, aşı", "Su içme hatırlatıcısı", "Tarif defteri ve alışveriş listesi", "Günlük ruh hâli günlüğü"],
  sohbet: ["Bu hafta yapay zekâda neler oldu? Kaynaklarıyla özetle", "Kahve markam için 4 logo fikri üret", "Bu CSV'yi analiz edip grafiğini çiz", "Instagram için 15 saniyelik ürün videosu yap"],
};

/* ── Akan duvar: Vayra Build'de yapılmış gerçek projelerin ekranları ── */
function Karo({ k, onSec }: { k: DuvarKaro; onSec: (k: DuvarKaro) => void }) {
  const [yuklendi, setYuklendi] = useState(false);
  return (
    <button type="button" tabIndex={-1} onClick={() => onSec(k)} aria-label={`${k.ad} fikrini kullan`}
      className={cn("group/karo relative shrink-0 overflow-hidden rounded-[18px] bg-[#16171a] text-left ring-1 ring-white/[0.08] transition-[filter,transform] duration-500 hover:z-10 hover:scale-[1.035] hover:brightness-110", k.telefon ? "h-[236px] w-[118px] rounded-[24px]" : "h-[236px] w-[340px]")}>
      {!k.telefon && (
        <span className="absolute inset-x-0 top-0 z-10 flex h-[26px] items-center gap-1.5 bg-[#1b1c1f] px-2.5">
          <span className="h-[7px] w-[7px] rounded-full bg-white/20" /><span className="h-[7px] w-[7px] rounded-full bg-white/20" /><span className="h-[7px] w-[7px] rounded-full bg-white/20" />
          <span className="ml-2 truncate rounded-full bg-white/[0.07] px-2.5 py-[2px] text-[10.5px] text-white/50">{k.ad}</span>
        </span>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={k.g} alt="" loading="lazy" decoding="async" onLoad={() => setYuklendi(true)}
        className={cn("absolute inset-x-0 bottom-0 w-full object-cover object-top transition-opacity duration-700", k.telefon ? "top-0 h-full" : "top-[26px] h-[calc(100%-26px)]", yuklendi ? "opacity-100" : "opacity-0")} />
      <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover/karo:opacity-100" />
      <span className="absolute inset-x-2.5 bottom-2.5 flex translate-y-2 items-center gap-1.5 opacity-0 transition-all duration-300 group-hover/karo:translate-y-0 group-hover/karo:opacity-100">
        {!k.telefon && <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-white">{k.ad}</span>}
        <span className={cn("flex h-7 shrink-0 items-center gap-1 rounded-full bg-white px-2.5 text-[12px] font-semibold text-black", k.telefon && "mx-auto")}><Wand2 className="h-3 w-3" />Kullan</span>
      </span>
    </button>
  );
}

const Duvar = memo(function Duvar({ onSec }: { onSec: (k: DuvarKaro) => void }) {
  const azHareket = useReducedMotion();
  const mx = useMotionValue(0), my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 40, damping: 18 }), y = useSpring(my, { stiffness: 40, damping: 18 });
  useEffect(() => {
    if (azHareket) return;
    const f = (e: PointerEvent) => { mx.set((e.clientX / innerWidth - 0.5) * -26); my.set((e.clientY / innerHeight - 0.5) * -16); };
    addEventListener("pointermove", f);
    return () => removeEventListener("pointermove", f);
  }, [azHareket, mx, my]);
  // Karolar sıralara dağıtılır; her sıra farklı hızda ve yönde akar.
  const siralar = duvarSiralari(5, 8);
  return (
    <motion.div style={{ x, y }} initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      className="absolute left-1/2 top-1/2 -ml-[1700px] -mt-[680px] h-[1360px] w-[3400px]">
      <div className="flex h-full rotate-[-8deg] flex-col justify-center gap-4">
        {siralar.map((s, i) => (
          <div key={i} className={cn("flex w-max gap-4 pr-4 hover:[animation-play-state:paused]", i % 2 ? "kesfet-kay-ters" : "kesfet-kay")}
            style={{ animationDuration: `${120 + i * 19}s`, marginLeft: `${(i % 3) * -140}px` }}>
            {[...s, ...s].map((x, j) => <Karo key={j} k={x} onSec={onSec} />)}
          </div>
        ))}
      </div>
    </motion.div>
  );
});

function DonenKelime({ metin }: { metin: string }) {
  return (
    <motion.span layout transition={{ type: "spring", stiffness: 260, damping: 30 }} className="relative inline-flex overflow-hidden pb-[0.12em] align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={metin} initial={{ y: "85%", opacity: 0, filter: "blur(12px)" }} animate={{ y: 0, opacity: 1, filter: "blur(0px)" }} exit={{ y: "-85%", opacity: 0, filter: "blur(12px)" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="hero-isilti whitespace-nowrap">{metin}</motion.span>
      </AnimatePresence>
    </motion.span>
  );
}

/** Duyuru hapı: dönen camgöbeği kenar; içinde sağlayıcı logoları yığını. Tıklayınca model seçici açılır. */
function ModelHap({ ac }: { ac: () => void }) {
  const logolar: BuildSaglayici[] = ["anthropic", "openai", "google", "moonshot", "deepseek", "xai"];
  return (
    <button type="button" onClick={ac} className="kredi-isilti group inline-flex rounded-full p-px transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]">
      <span className="flex h-11 items-center gap-2.5 rounded-full bg-[#141416] pl-1.5 pr-4">
        <span className="flex h-8 items-center gap-2 rounded-full bg-[#55d6fd]/[0.14] px-3 text-[13px] font-semibold text-[#8be6ff]">
          <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#55d6fd] opacity-75" /><span className="relative h-1.5 w-1.5 rounded-full bg-[#55d6fd]" /></span>
          Yeni
        </span>
        <span className="flex -space-x-1.5">
          {logolar.map((s) => (
            <span key={s} className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1d1e22] ring-2 ring-[#141416]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={SAGLAYICILAR[s].logo} alt="" className={cn("h-3.5 w-3.5", SAGLAYICILAR[s].tek && "build-logo-tek")} />
            </span>
          ))}
        </span>
        <span className="whitespace-nowrap text-[14.5px] font-medium tracking-[-0.01em] text-white">{BUILD_MODELLERI.length} model<span className="text-white/60 max-[420px]:hidden">, istediğini seç</span></span>
      </span>
    </button>
  );
}

/** Sağlayıcı şeridi (ana sayfadaki laboratuvar şeridiyle aynı dil). */
export function SaglayiciSeridi() {
  const l = (Object.keys(SAGLAYICILAR) as BuildSaglayici[]).map((k) => SAGLAYICILAR[k]);
  return (
    <div className="kesfet-serit-maske group flex overflow-hidden">
      <div className="kesfet-kay flex shrink-0 items-center gap-12 pr-12 [animation-duration:55s] group-hover:[animation-play-state:paused] sm:gap-16 sm:pr-16">
        {[...l, ...l].map((s, i) => (
          <span key={i} aria-hidden={i >= l.length} className="flex shrink-0 items-center gap-2.5 text-[16px] font-semibold tracking-[-0.02em] text-white/60 transition-colors duration-300 hover:text-white sm:text-[19px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.logo} alt="" className={cn("h-6 w-6 sm:h-7 sm:w-7", s.tek && "build-logo-tek")} />{s.ad}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Vayra Build hero'su — ana sayfa (/panel) dili: Build'de yapılmış projelerden eğik akan duvar, radyal karartma,
 * dönen kelimeli başlık, ortada .cam-istemci komut kutusu ve görselli tür kartları.
 */
export function BuildHero(g: {
  tur: HeroTur; setTur: (t: HeroTur) => void; deger: string; setDeger: (s: string) => void; gonder: () => void;
  mod: AjanMod; setMod: (m: AjanMod) => void; model: string; setModel: (m: string) => void; baglantilar?: Record<string, string | null>;
  ekler: KomutEki[]; setEkler: (e: KomutEki[]) => void; gidiyor: boolean; hata: string; kutuRef: React.RefObject<HTMLDivElement | null>;
  tasarimIste?: boolean; setTasarimIste?: (v: boolean) => void;
}) {
  const bolum = useRef<HTMLElement>(null);
  const azHareket = useReducedMotion();
  const [dokundu, setDokundu] = useState(false);
  const { scrollYProgress: cikis } = useScroll({ target: bolum, offset: ["start start", "end start"] });
  const icY = useTransform(cikis, [0, 1], [0, -110]);
  const icOp = useTransform(cikis, [0, 0.65], [1, 0]);
  const t = TURLER.find((x) => x.id === g.tur)!;

  // Kullanıcı dokunana dek başlıktaki kelime türler arasında döner (tür seçimi değişmez).
  const [gosterilen, setGosterilen] = useState(0);
  useEffect(() => {
    if (dokundu || azHareket) return;
    const z = setInterval(() => setGosterilen((n) => (n + 1) % TURLER.length), 3200);
    return () => clearInterval(z);
  }, [dokundu, azHareket]);
  const kelime = dokundu ? t.kelime : TURLER[gosterilen].kelime;

  const karoSec = (k: DuvarKaro) => {
    setDokundu(true);
    g.setTur(k.tur);
    g.setDeger(k.istem);
    const r = g.kutuRef.current?.getBoundingClientRect();
    if (r && (r.top < 80 || r.bottom > innerHeight - 20)) scrollTo({ top: scrollY + r.top - (innerHeight - r.height) / 2, behavior: "smooth" });
    setTimeout(() => g.kutuRef.current?.querySelector("textarea")?.focus({ preventScroll: true }), 300);
  };

  return (
    <section ref={bolum} id="olustur" className="relative isolate overflow-clip" onPointerDown={() => setDokundu(true)}>
      <div aria-hidden className="absolute inset-0 -z-10 bg-[#0b0b0c]">
        <Duvar onSec={karoSec} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_58%_62%_at_50%_48%,rgba(11,11,12,0.96)_0%,rgba(11,11,12,0.88)_40%,rgba(11,11,12,0.5)_74%,rgba(11,11,12,0.2)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#0b0b0c] via-[#0b0b0c]/80 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#0b0b0c]/85 to-transparent" />
      </div>

      <motion.div style={{ y: icY, opacity: icOp }} className="pointer-events-none mx-auto flex min-h-[min(1000px,100svh)] max-w-[1100px] flex-col items-center justify-center px-4 pb-10 pt-20 text-center sm:px-8 sm:pb-40 sm:pt-16 [&>*]:pointer-events-auto">
        <motion.div {...giris(0)}><ModelHap ac={() => g.kutuRef.current?.querySelector<HTMLButtonElement>("[data-model-cip]")?.click()} /></motion.div>
        <h1 className="mt-7 text-[38px] font-semibold leading-[1.04] tracking-[-0.045em] text-white min-[400px]:text-[42px] sm:text-[78px] sm:leading-[1.02]">
          {["Bir", "cümle", "yaz."].map((w, i) => (
            <motion.span key={w} className="inline-block" initial={{ opacity: 0, y: 26, filter: "blur(12px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.9, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}>{w}</motion.span>
          )).flatMap((x, i) => (i < 2 ? [x, " "] : [x]))}
          <br />
          <motion.span className="inline-block" initial={{ opacity: 0, y: 26, filter: "blur(12px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.9, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}>
            <DonenKelime metin={kelime} /> hazır.
          </motion.span>
        </h1>
        <motion.p {...giris(0.12)} className="mt-5 max-w-[600px] text-pretty text-[16px] leading-relaxed text-white/65 sm:text-[17.5px]">
          Web sitesi, uygulama, oyun, mobil uygulama ya da bir soru. Vayra kodunu yazar, görsellerini üretir, araştırır ve yayına alır.
        </motion.p>

        <motion.div ref={g.kutuRef} {...giris(0.5)} className="relative mt-9 w-full max-w-[920px] text-left">
          <span aria-hidden className="hero-aura pointer-events-none absolute -inset-x-16 -inset-y-12 -z-10" />
          <LayoutGroup id="build-tur">
            <div className="mb-3 grid grid-cols-5 gap-2 max-lg:grid-cols-3 max-sm:grid-cols-2 max-sm:[&>*:last-child]:col-span-2">
              {TURLER.map((x) => (
                <button key={x.id} type="button" onClick={() => { setDokundu(true); g.setTur(x.id); }} aria-pressed={g.tur === x.id}
                  className={cn("group relative flex items-center gap-2.5 overflow-hidden rounded-[18px] p-1.5 pr-3 text-left ring-1 ring-inset backdrop-blur-xl transition-[background-color,box-shadow]", g.tur === x.id ? "bg-white/[0.1] ring-white/80" : "bg-[#141416]/70 ring-white/[0.08] hover:bg-white/[0.07]")}>
                  <span className="relative h-11 w-12 shrink-0 overflow-hidden rounded-[12px] bg-white/[0.06]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={x.gorsel} alt="" className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-110" />
                    <span className="absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 backdrop-blur"><x.ikon className="h-3 w-3 text-white" /></span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-semibold text-white"><span className="max-sm:hidden">{x.ad}</span><span className="sm:hidden">{x.kisa}</span></span>
                    <span className="block truncate text-[11.5px] text-white/50 max-lg:hidden">{x.alt}</span>
                  </span>
                </button>
              ))}
            </div>
          </LayoutGroup>
          <Komut genis otomatikOdak deger={g.deger} setDeger={(s) => { setDokundu(true); g.setDeger(s); }} gonder={g.gonder} mod={g.mod} setMod={g.setMod} model={g.model} setModel={g.setModel}
            baglantilar={g.baglantilar} ekler={g.ekler} setEkler={g.setEkler} calisiyor={g.gidiyor} kilit={g.gidiyor ? (g.tur === "sohbet" ? "Sohbet açılıyor" : "Proje açılıyor") : undefined} yer={t.yer} modsuz={g.tur === "sohbet"} />
          {g.tur !== "sohbet" && <YetenekCipleri deger={g.deger} setDeger={(x) => { setDokundu(true); g.setDeger(x); }} tur={g.tur} tasarim={g.tasarimIste} setTasarim={g.setTasarimIste} />}
          <AnimatePresence>{g.hata && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 text-center text-[13px] text-rose-300">{g.hata}</motion.p>}</AnimatePresence>
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {ORNEKLER[g.tur].map((o) => (
              <button key={o} type="button" onClick={() => { setDokundu(true); g.setDeger(o); }} className="rounded-full bg-[#141416]/60 px-3.5 py-1.5 text-[13px] text-white/60 ring-1 ring-inset ring-white/[0.08] backdrop-blur transition-colors hover:bg-white/[0.08] hover:text-white">{o}</button>
            ))}
            <button type="button" title="Rastgele fikir" aria-label="Rastgele fikir" onClick={() => { setDokundu(true); const r = TURLER[Math.floor(Math.random() * TURLER.length)].id; g.setTur(r); g.setDeger(ORNEKLER[r][Math.floor(Math.random() * 4)]); }}
              className="flex h-[31px] w-[31px] items-center justify-center rounded-full bg-[#141416]/60 text-white/55 ring-1 ring-inset ring-white/[0.08] backdrop-blur hover:text-white"><Shuffle className="h-3.5 w-3.5" /></button>
          </div>
        </motion.div>
      </motion.div>

      <motion.div {...giris(0.7)} className="pb-16 sm:absolute sm:inset-x-0 sm:bottom-10 sm:pb-0">
        <p className="mb-5 text-center text-[13.5px] text-white/45">Claude, GPT, Gemini, Kimi ve fazlası; her istekte istediğin modeli seç</p>
        <SaglayiciSeridi />
      </motion.div>
    </section>
  );
}

/** Tek tıkla isteğe eklenen yetenekler (eklenen cümle istemde görünür, tekrar tıklayınca çıkar). */
const YETENEKLER: { ad: string; ikon: typeof Database; cumle: string }[] = [
  { ad: "Veritabanı", ikon: Database, cumle: "Veriler veritabanında tutulsun; tabloları türlü sütunlar ve doğru erişim kurallarıyla kur." },
  { ad: "Üyelik", ikon: UserRound, cumle: "Kullanıcılar e-postayla kayıt olup giriş yapabilsin; herkes kendi verisini görsün." },
  { ad: "Yapay zekâ", ikon: Sparkles, cumle: "Sitede yapay zekâ asistanı olsun (vayra.ai ile, anahtar gerekmeden)." },
  { ad: "Ödeme", ikon: CreditCard, cumle: "Ödeme alınsın: sepet ve ödeme adımı, ödeme işlemi sunucu fonksiyonunda." },
  { ad: "Form", ikon: Inbox, cumle: "İletişim formu olsun; gönderimler gelen kutusuna düşsün." },
  { ad: "Çok dil", ikon: Languages, cumle: "Türkçe ve İngilizce dil seçeneği olsun." },
  { ad: "Harita", ikon: MapPin, cumle: "Konum haritada gösterilsin, yol tarifi bağlantısı olsun." },
  { ad: "Blog", ikon: Newspaper, cumle: "Yazıları veritabanından gelen bir blog bölümü olsun." },
];
function YetenekCipleri({ deger, setDeger, tur, tasarim, setTasarim }: { deger: string; setDeger: (s: string) => void; tur: string; tasarim?: boolean; setTasarim?: (v: boolean) => void }) {
  const [gelisiyor, setGelisiyor] = useState(false);
  const [onceki, setOnceki] = useState<string | null>(null);
  const [hata, setHata] = useState("");
  const degistir = (c: string) => {
    if (deger.includes(c)) setDeger(deger.replace(c, "").replace(/\n{3,}/g, "\n\n").trim());
    else setDeger(`${deger.trim()}${deger.trim() ? "\n" : ""}${c}`);
  };
  const [sorular, setSorular] = useState<IstemSorusu[] | null>(null);
  const gelistir = async (metin = deger) => {
    setGelisiyor(true); setHata("");
    try { const v = await api<{ istem: string }>("/api/build/gelistir", { govde: { istem: metin, tur } }); setOnceki(deger); setDeger(v.istem); }
    catch (e) { setHata(e instanceof Error ? e.message : "Geliştirilemedi."); }
    finally { setGelisiyor(false); }
  };
  /** Önce belirsizlik için soru sorar (2-4 seçmeli); istek netse doğrudan geliştirir. */
  const sor = async () => {
    setGelisiyor(true); setHata("");
    try {
      const v = await api<{ sorular: IstemSorusu[]; net: boolean; bakiye?: number }>("/api/build/gelistir", { govde: { istem: deger, tur, islem: "sorular" } });
      buildKrediUygula(v);
      if (v.sorular.length) { setSorular(v.sorular); setGelisiyor(false); return; }
    } catch (e) { setHata(e instanceof Error ? e.message : "Sorular alınamadı."); setGelisiyor(false); return; }
    await gelistir();
  };
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
      {onceki !== null ? (
        <button type="button" onClick={() => { setDeger(onceki); setOnceki(null); }} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.1] px-3 text-[12.5px] text-white ring-1 ring-inset ring-white/50 backdrop-blur"><Undo2 className="h-3.5 w-3.5" />Eski istemi geri al</button>
      ) : (
        <button type="button" disabled={gelisiyor || deger.trim().length < 3} onClick={sor} title="Belirsizse birkaç kısa soru sorar, sonra kısa isteğini ayrıntılı bir tarife çevirir" className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#0e2a33]/90 px-3 text-[12.5px] font-medium text-[#a8ecff] ring-1 ring-inset ring-[#55d6fd]/35 backdrop-blur transition-colors hover:bg-[#123744] disabled:opacity-50">{gelisiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}İstemi geliştir</button>
      )}
      {setTasarim && <button type="button" aria-pressed={!!tasarim} onClick={() => setTasarim(!tasarim)} title="Ajan kod yazmadan önce 3 farklı tasarım önizlemesi sunar, sen seçersin" className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] backdrop-blur transition-colors", tasarim ? "bg-white/[0.1] text-white ring-1 ring-inset ring-white/80" : "bg-[#141416]/60 text-white/60 ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.08] hover:text-white")}><Paintbrush className="h-3.5 w-3.5 opacity-70" />Önce 3 tasarım göster</button>}
      <span className="mx-1 h-5 w-px bg-white/[0.1]" />
      {YETENEKLER.map((y) => {
        const acik = deger.includes(y.cumle);
        return (
          <button key={y.ad} type="button" onClick={() => degistir(y.cumle)} title={y.cumle} aria-pressed={acik}
            className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] backdrop-blur transition-colors", acik ? "bg-white/[0.1] text-white ring-1 ring-inset ring-white/80" : "bg-[#141416]/60 text-white/60 ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.08] hover:text-white")}>
            {acik ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}<y.ikon className="h-3.5 w-3.5 opacity-70" />{y.ad}
          </button>
        );
      })}
      {hata && <p className="w-full text-center text-[12.5px] text-rose-300">{hata}</p>}
      <AnimatePresence>
        {sorular && <div className="w-full"><IstemSorulari sorular={sorular} gidiyor={gelisiyor} kapat={() => setSorular(null)} ekle={(c, gel) => { const yeni = yanitlariEkle(deger, sorular, c); setSorular(null); if (gel) { const eski = deger; setDeger(yeni); gelistir(yeni).then(() => setOnceki(eski)); } else { setOnceki(deger); setDeger(yeni); } }} /></div>}
      </AnimatePresence>
    </div>
  );
}

export { yay };
