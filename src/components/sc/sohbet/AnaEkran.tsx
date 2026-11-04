"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { AppWindow, BookOpen, Code2, Gamepad2, Globe, ImageIcon, LayoutTemplate, MessageCircleDashed, PenLine, Play, Search, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/useAuth";
import { toast } from "@/lib/toast";
import { useHafiza } from "@/store/useHafiza";
import { useScTercih } from "@/store/useScTercih";
import { Tanisma } from "./Tanisma";
import { BaglantiUyarisi, KrediUyarisi, useCevrimici } from "./Baglanti";
import { useSupercomputer } from "@/store/useSupercomputer";
import { baslikUret, scBekleyen } from "@/lib/scSohbet";
import { SCLogoCanli } from "@/components/kabuk/sc/SCLogoCanli";
import { SCBetaRozet } from "@/components/kabuk/sc/SCBetaUyari";
import { calisanBul, HAZIR_CALISANLAR, useScCalisan } from "@/lib/scCalisan";
import { Avatar } from "../sayfalar/Calisanlar";
import Link from "next/link";
import { Composer, VARSAYILAN_AYAR, varsayilanAyar, type ScAyar, type ScEk } from "./Composer";

/**
 * Usta boş ekranı — selamlama, büyük komut kutusu ve kategori sekmeli görev galerisi.
 * Site/uygulama/oyun kartları şablon motorunun gerçek çıktısını küçültülmüş canlı önizlemeyle gösterir
 * (eski ayrı Uygulamalar/Oyunlar sayfaları buraya, sohbetin içine taşındı); karta tıklayınca istem kutuya
 * yazılır, "Başlat" doğrudan sohbeti açar ve ajan çalışan sürümü kurar.
 */
type Kategori = "tumu" | "site" | "uygulama" | "oyun" | "gorsel" | "arastirma" | "yazi";
type Gorev = { kat: Exclude<Kategori, "tumu">; ad: string; istem: string; etiket: string; ayar: Partial<ScAyar>; gorsel?: string; belge?: string[];
  /** "Tümü" sekmesinde görünsün mü (vitrin seçkisi). */
  vitrin?: boolean };

const GOREVLER: Gorev[] = [
  { kat: "site", vitrin: true, ad: "Kahve dükkânı sitesi", etiket: "Site", gorsel: "/gercek/sc-galeri/kahve.webp", istem: "\"Demlik\" adında butik bir kahve dükkânı için menülü, sıcak tonlu bir açılış sayfası yap", ayar: { niyet: "site" } },
  { kat: "gorsel", vitrin: true, ad: "Ürün fotoğrafı", etiket: "Görsel", gorsel: "/gercek/panel/gal-pazarlama-1.webp", istem: "Krem rengi saten üzerinde altın kapaklı serum şişeleri, yumuşak stüdyo ışığı, ürün fotoğrafı üret", ayar: { niyet: "gorsel" } },
  { kat: "oyun", vitrin: true, ad: "Neon yılan oyunu", etiket: "Oyun", gorsel: "/gercek/sc-galeri/yilan.webp", istem: "Neon renklerde, puan tutan bir yılan oyunu yap", ayar: { niyet: "site" } },
  { kat: "arastirma", vitrin: true, ad: "Pazar araştırması", etiket: "Araştırma", istem: "2026'da Türkiye'de e-ticaret trendlerini araştır, kaynaklarıyla özetle ve 5 fırsat öner", ayar: { arastir: true },
    belge: ["Türkiye e-ticaret 2026", "1. Mobil pazar yerleri büyüyor", "2. Sosyal ticaret ve canlı yayın", "3. Hızlı teslimat beklentisi", "Kaynaklar · 8 site"] },
  { kat: "uygulama", vitrin: true, ad: "Satış paneli", etiket: "Panel", gorsel: "/gercek/sc-galeri/satis-paneli.webp", istem: "Aylık gelir, sipariş ve dönüşüm grafikleri olan bir satış dashboard'u kur", ayar: { niyet: "site" } },
  { kat: "gorsel", vitrin: true, ad: "Sinematik portre", etiket: "Görsel", gorsel: "/gercek/panel/gal-soul2-2.webp", istem: "Yağmurlu neon bir şehirde, sinematik ışıkla yakın plan portre üret", ayar: { niyet: "gorsel" } },
  { kat: "yazi", vitrin: true, ad: "Lansman e-postaları", etiket: "Yazı", istem: "Yeni çıkan kablosuz kulaklığım için 3 farklı tonda lansman e-postası yaz", ayar: {},
    belge: ["Konu: Sessizliği yeniden keşfet", "Merhaba Ayşe,", "Yeni Aura Pro ile gürültü engelleme…", "— Ton: samimi · 120 kelime"] },
  { kat: "yazi", vitrin: true, ad: "CSV'den grafik", etiket: "Kod", istem: "Python ile bir CSV dosyasını okuyup aylık satış grafiği çizen bir betik yaz ve adım adım açıkla", ayar: {},
    belge: ["import pandas as pd", "import matplotlib.pyplot as plt", "df = pd.read_csv(\"satis.csv\")", "df.groupby(\"ay\")[\"tutar\"].sum().plot()"] },
  { kat: "uygulama", ad: "Yapılacaklar", etiket: "Uygulama", gorsel: "/gercek/sc-galeri/yapilacaklar.webp", istem: "Filtreli ve kayıt tutan bir yapılacaklar listesi uygulaması yap", ayar: { niyet: "site" } },
  { kat: "uygulama", ad: "Bütçe takibi", etiket: "Uygulama", gorsel: "/gercek/sc-galeri/butce.webp", istem: "Gelir ve giderleri kategoriye göre gösteren bir bütçe takip uygulaması yap", ayar: { niyet: "site" } },
  { kat: "uygulama", ad: "Odak zamanlayıcı", etiket: "Uygulama", gorsel: "/gercek/sc-galeri/odak.webp", istem: "Halka göstergeli bir pomodoro odak zamanlayıcısı yap", ayar: { niyet: "site" } },
  { kat: "oyun", ad: "Tuğla kır", etiket: "Oyun", gorsel: "/gercek/sc-galeri/tugla.webp", istem: "Raket ve topla oynanan, canlı ve skorlu bir tuğla kırma oyunu yap", ayar: { niyet: "site" } },
  { kat: "oyun", ad: "Kanat", etiket: "Oyun", gorsel: "/gercek/sc-galeri/kanat.webp", istem: "Dokununca uçan kuşla borular arasından geçilen bir kanat oyunu yap", ayar: { niyet: "site" } },
  { kat: "oyun", ad: "Hafıza kartları", etiket: "Oyun", gorsel: "/gercek/sc-galeri/hafiza.webp", istem: "Emojili kartlarla hamle ve süre tutan bir hafıza eşleştirme oyunu yap", ayar: { niyet: "site" } },
  { kat: "site", ad: "Portfolyo", etiket: "Site", gorsel: "/gercek/sc-galeri/portfolyo.webp", istem: "Bir ürün tasarımcısı için projeleri ve iletişimi olan bir portfolyo sitesi yap", ayar: { niyet: "site" } },
];
const KATEGORILER: [Kategori, string, typeof Globe][] = [["tumu", "Tümü", LayoutTemplate], ["site", "Site", Globe], ["uygulama", "Uygulama", AppWindow], ["oyun", "Oyun", Gamepad2], ["gorsel", "Görsel", ImageIcon], ["arastirma", "Araştırma", Search], ["yazi", "Yazı ve kod", PenLine]];
const GECERLI_KAT = new Set(KATEGORILER.map(([k]) => k));
const YAY = { type: "spring", stiffness: 380, damping: 32 } as const;

function Belge({ g }: { g: Gorev }) {
  const kod = g.etiket === "Kod";
  return (
    <span className={cn("absolute inset-x-4 top-4 bottom-0 overflow-hidden rounded-t-[10px] px-3.5 pt-3 shadow-[0_-1px_0_rgba(255,255,255,0.06)] transition-transform duration-500 group-hover:-translate-y-1", kod ? "sc-kod bg-[#0a0d12] ring-1 ring-inset ring-white/[0.07]" : "bg-[#f5f4ef]")}>
      {kod && <span className="mb-2 flex gap-1">{[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 rounded-full bg-white/20" />)}</span>}
      {g.belge?.map((t, i) => (
        <span key={i} className={cn("block truncate", kod ? cn("text-[10.5px] leading-[1.75]", i < 2 ? "text-[#c792ea]" : i === 2 ? "text-[#9fd3a7]" : "text-[#dfe6ee]")
          : i === 0 ? "mb-1.5 !whitespace-normal line-clamp-2 text-[12.5px] font-semibold leading-snug text-[#111113]" : "text-[10.5px] leading-[1.65] text-[#55534e]")}>{t}</span>
      ))}
      {!kod && <><span className="mt-2 block h-1.5 w-11/12 rounded-full bg-[#131315]/[0.08]" /><span className="mt-1.5 block h-1.5 w-2/3 rounded-full bg-[#131315]/[0.08]" /></>}
    </span>
  );
}

function GorevKarti({ g, onSec, onCalistir }: { g: Gorev; onSec: () => void; onCalistir: () => void }) {
  const I = g.kat === "site" ? Globe : g.kat === "uygulama" ? (g.etiket === "Panel" ? LayoutTemplate : AppWindow) : g.kat === "oyun" ? Gamepad2 : g.kat === "gorsel" ? ImageIcon : g.kat === "arastirma" ? BookOpen : g.etiket === "Kod" ? Code2 : PenLine;
  return (
    <div className="group relative flex flex-col rounded-[18px] bg-black/20 p-1.5 ring-1 ring-inset ring-white/[0.07] transition-[box-shadow,background-color] duration-200 hover:bg-white/[0.035] hover:ring-white/[0.16]">
      <button onClick={onSec} className="flex flex-1 flex-col text-left" aria-label={`${g.ad}: istemi kutuya yaz`}>
        <span className={cn("relative block aspect-[16/10] w-full overflow-hidden rounded-[13px]", g.belge ? (g.etiket === "Kod" ? "bg-[#14161a]" : "bg-[#1c1c1f]") : "bg-[#131315]")}>
          {/* Site/uygulama/oyun kartları şablonun önceden çekilmiş görüntüsünü gösterir (canlı iframe'ler galeriyi kasıyordu). */}
          {g.gorsel ? <img src={g.gorsel} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.04]" /> /* eslint-disable-line @next/next/no-img-element */
            : <Belge g={g} />}
          <span className="pointer-events-none absolute inset-0 rounded-[13px] ring-1 ring-inset ring-white/[0.06]" />
          <span className="absolute bottom-2 left-2 flex h-6 items-center gap-1 rounded-full bg-black/60 px-2 text-[11.5px] font-medium text-white backdrop-blur-md"><I className="h-3 w-3" />{g.etiket}</span>
        </span>
        <span className="flex flex-1 flex-col px-2 pb-2 pt-2.5">
          <span className="block text-[14px] font-semibold leading-snug text-[var(--sc-metin)]">{g.ad}</span>
          <span className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-[var(--sc-metin-3)]">{g.istem.replace(/"/g, "")}</span>
        </span>
      </button>
      <button onClick={onCalistir} aria-label={`${g.ad}: hemen başlat`}
        className="absolute right-3 top-3 flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-semibold text-[#0b0b0c] opacity-0 transition-[opacity,transform] duration-200 hover:bg-white/90 focus-visible:opacity-100 active:scale-95 group-hover:opacity-100 max-md:w-8 max-md:justify-center max-md:px-0 max-md:opacity-100">
        <Play className="h-3 w-3 shrink-0 fill-current" /><span className="max-md:sr-only">Başlat</span>
      </button>
    </div>
  );
}

export function AnaEkran() {
  const router = useRouter();
  const sp = useSearchParams();
  const hesapAd = (useAuth((s) => s.kullanici?.ad) ?? "").split(" ")[0];
  const hitap = useHafiza((s) => s.profil?.hitap?.trim());
  const ad = hitap || hesapAd;
  const tanismaGoruldu = useScTercih((s) => s.tanisma);
  const [tanisma, setTanisma] = useState(false);
  const cevrimici = useCevrimici();
  const [metin, setMetin] = useState("");
  const [ekler, setEkler] = useState<ScEk[]>([]);
  const [ayar, setAyarHam] = useState<ScAyar>(VARSAYILAN_AYAR);
  useEffect(() => { setAyarHam(varsayilanAyar()); }, []); // tercihler istemcide yüklenir (SSR uyumu)
  const setAyar = (f: (a: ScAyar) => ScAyar) => setAyarHam(f);
  const [kat, setKat] = useState<Kategori>("tumu");
  const [selam, setSelam] = useState("Merhaba");
  const [gecici, setGecici] = useState(false);
  /* Çalışan modu: ?calisan=<id> — selamlama yerine çalışan, galeri yerine başlangıç soruları. */
  const calisanOzel = useScCalisan((s) => s.ozel);
  const sabitler = useScCalisan((s) => s.sabitler);
  const [calisanId, setCalisanId] = useState<string | null>(null);
  const [hazir, setHazir] = useState(false);
  useEffect(() => { setHazir(true); }, []);
  /* İlk açılış: kişisel bilgi yoksa kısa tanışma (bir kez). */
  useEffect(() => {
    if (!hazir || tanismaGoruldu) return;
    const p = useHafiza.getState().profil;
    if (!p || !(p.hitap.trim() || p.is.trim() || p.tercih.trim())) setTanisma(true);
    else useScTercih.getState().ayarla({ tanisma: true });
  }, [hazir, tanismaGoruldu]);
  useEffect(() => { setCalisanId(sp.get("calisan")); }, [sp]);
  /* Remix: yayınlanmış bir uygulamanın kopyasıyla yeni sohbet (/y/<id> rozetinden gelinir). */
  const remixYapildi = useRef(false);
  useEffect(() => {
    const rid = sp.get("remix"); if (!rid || remixYapildi.current) return;
    remixYapildi.current = true;
    void (async () => {
      try {
        const r = await fetch(`/api/sc/yayin?id=${encodeURIComponent(rid)}`);
        const j = (await r.json()) as { ok: boolean; ad?: string; html?: string; tur?: string; hata?: string };
        if (!j.ok || !j.html) { toast.error("Remix açılamadı", { description: `${j.hata ?? "Yayın bulunamadı."} Bağlantıyı kontrol edip yeniden dene.` }); return; }
        const sc = useSupercomputer.getState();
        const ad = `${j.ad ?? "Uygulama"} (remix)`;
        const id = sc.sohbetAc(ad);
        const tur = (["site", "oyun", "dashboard", "uygulama"].includes(j.tur ?? "") ? j.tur : "site") as "site";
        const ck = `ck-${Date.now().toString(36)}`;
        sc.mesajEkle(id, { rol: "kullanici", metin: `"${j.ad ?? "Uygulama"}" uygulamasını remixle` });
        sc.mesajEkle(id, { rol: "ajan", metin: "Yayınlanmış uygulamanın kopyası hazır. Sağdaki panelde öğe seçip değiştirebilir, metinleri düzenleyebilir ya da ne istediğini yazabilirsin.", ciktilar: [{ id: ck, tur, ad, html: j.html, durum: "tamam" }] });
        router.replace(`/panel/supercomputer/${id}?cikti=${ck}`);
      } catch { toast.error("Remix açılamadı", { description: "Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip yeniden dene." }); }
    })();
  }, [sp, router]);
  const calisan = calisanId ? calisanBul(calisanId) : undefined;

  useEffect(() => {
    if (!calisan) return;
    setAyarHam((a) => ({ ...a, model: calisan.model ?? a.model, web: !!calisan.araclar.web, dusun: !!calisan.araclar.dusun, arastir: !!calisan.araclar.arastir }));
  }, [calisan?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const kisayollar = sabitler.map((id) => [...calisanOzel, ...HAZIR_CALISANLAR].find((c) => c.id === id)).filter(Boolean).slice(0, 6) as typeof HAZIR_CALISANLAR;
  /* Karttan gelen mod (Site kur, Görsel, Derin araştırma…): kutu boşaltılırsa sıfırlanır.
     Yoksa karta tıklayıp metni silip "sa" yazan kişi istemeden site kurdurur. */
  const kartModu = useRef(false);
  useEffect(() => {
    if (kartModu.current && !metin.trim()) { kartModu.current = false; setAyarHam((a) => ({ ...a, niyet: "oto", web: false, dusun: false, arastir: false })); }
  }, [metin]);
  useEffect(() => { const s = new Date().getHours(); setSelam(s < 6 ? "İyi geceler" : s < 12 ? "Günaydın" : s < 18 ? "İyi günler" : "İyi akşamlar"); }, []);
  useEffect(() => { const i = sp.get("istem"); if (i) setMetin((m) => m || i); }, [sp]);
  /* Eski Uygulamalar/Oyunlar sayfalarından gelen ?kat=uygulama|oyun ilgili sekmeyi açar. */
  useEffect(() => {
    const k = sp.get("kat") as Kategori | null;
    if (k && GECERLI_KAT.has(k)) { setKat(k); setTimeout(() => document.getElementById("sc-galeri")?.scrollIntoView({ behavior: "smooth", block: "start" }), 300); }
  }, [sp]);

  const baslat = (t: string, e: ScEk[], a: ScAyar, baslik?: string) => {
    if (!t.trim() && !e.length) return;
    if (!navigator.onLine) { toast.error("Bağlantı yok", { description: "Yazdıkların kutuda duruyor. Bağlantı gelince yeniden gönder." }); return; }
    const sc = useSupercomputer.getState();
    const id = sc.sohbetAc(baslik ?? baslikUret(t || e[0]?.ad || "Yeni sohbet"));
    sc.sohbetGuncelle(id, { ayar: a, ...(gecici ? { gecici: true } : {}), ...(calisan ? { calisanId: calisan.id } : {}) });
    scBekleyen.set(id, { metin: t.trim(), ekler: e });
    router.push(`/panel/supercomputer/${id}`);
  };
  const sec = (g: Gorev) => { kartModu.current = true; setMetin(g.istem); setAyarHam((a) => ({ ...a, niyet: "oto", web: false, dusun: false, arastir: false, ...g.ayar })); document.querySelector<HTMLTextAreaElement>("[aria-label=Mesaj]")?.focus(); };
  const liste = GOREVLER.filter((g) => (kat === "tumu" ? g.vitrin : g.kat === kat));

  return (
    <MotionConfig reducedMotion="user">
      <div className="sc-kapsam relative min-h-screen bg-[var(--sc-zemin)] text-[var(--sc-metin)]">
        {/* Geçici sohbet (ChatGPT / Claude "gizli" sohbet gibi): geçmişe yazılmaz. */}
        <button onClick={() => setGecici((v) => !v)} aria-pressed={gecici} title={gecici ? "Geçici sohbeti kapat" : "Geçici sohbet: geçmişe kaydedilmez"}
          className={cn("absolute right-4 top-3 z-10 flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors max-sm:w-9 max-sm:justify-center max-sm:px-0",
            gecici ? "bg-[var(--sc-aksan)]/15 text-[var(--sc-aksan)] ring-1 ring-inset ring-[var(--sc-aksan)]/30" : "text-[var(--sc-metin-2)] hover:bg-white/[0.06] hover:text-[var(--sc-metin)]")}>
          <MessageCircleDashed className="h-4 w-4" /><span className="max-sm:hidden">Geçici sohbet</span>
        </button>
        <div className="mx-auto w-full max-w-[860px] px-6 pb-16 pt-[14vh] max-md:pt-20 max-sm:px-4">
          {calisan ? (
            <motion.div key={calisan.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={YAY} className="mb-7 flex flex-col items-center text-center">
              <Avatar c={calisan} boyut={72} />
              <h1 className="mt-3 text-[clamp(24px,3vw,32px)] font-normal tracking-[-0.02em]">{calisan.ad}</h1>
              <p className="mt-1 max-w-[520px] text-[14.5px] text-[var(--sc-metin-2)]">{calisan.aciklama}</p>
              <button onClick={() => router.push("/panel/supercomputer")} className="mt-2 text-[12.5px] text-[var(--sc-metin-3)] hover:text-[var(--sc-metin)] hover:underline">Çalışandan çık</button>
            </motion.div>
          ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={YAY} className="mb-7 flex items-center justify-center gap-3.5">
            <SCLogoCanli boyut={60} calisiyor />
            <h1 className="text-[clamp(28px,3.4vw,38px)] font-normal tracking-[-0.02em] text-[var(--sc-metin)]">{gecici ? "Geçici sohbet" : <>{selam}{ad && <>, {ad}</>}</>}</h1>
            {!gecici && <SCBetaRozet />}
          </motion.div>
          )}
          <AnimatePresence initial={false}>
            {gecici && (
              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="-mt-3 mb-6 text-center text-[14px] text-[var(--sc-metin-2)]">
                Bu sohbet geçmişinde görünmez ve kaydedilmez; sayfadan çıkınca silinir.
              </motion.p>
            )}
          </AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...YAY, delay: 0.05 }}>
            <BaglantiUyarisi cevrimici={cevrimici} />
              <KrediUyarisi />
            <Composer buyuk metin={metin} setMetin={setMetin} ekler={ekler} setEkler={setEkler} ayar={ayar} setAyar={setAyar}
              onGonder={() => baslat(metin, ekler, ayar)} taslakAnahtari={calisan ? `calisan:${calisan.id}` : "ana"} yerTutucu={calisan ? `${calisan.ad} ile konuş` : "Bugün ne yapalım? Soru sor, site kur, görsel üret, araştır…"} />
          </motion.div>

          {/* Sabitlenen çalışanlar: tek dokunuşla o çalışanla başla */}
          {hazir && !calisan && kisayollar.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...YAY, delay: 0.12 }}
              className="mx-auto mt-4 flex max-w-[760px] items-center gap-1.5 rounded-[22px] bg-white/[0.035] p-1.5 ring-1 ring-inset ring-white/[0.07]">
              <span className="shrink-0 px-2.5 text-[12.5px] font-semibold text-[var(--sc-metin-2)] max-sm:hidden">Çalışanla başla</span>
              <div className="gizli-scroll flex min-w-0 flex-1 gap-1 overflow-x-auto">
                {kisayollar.map((c) => (
                  <Link key={c.id} href={`/panel/supercomputer?calisan=${c.id}`} title={c.aciklama}
                    className="group/c flex h-10 shrink-0 items-center gap-2 rounded-full pl-1 pr-3.5 transition-colors hover:bg-white/[0.065] active:scale-[0.98]">
                    <Avatar c={c} boyut={30} />
                    <span className="whitespace-nowrap text-[13px] font-semibold text-[var(--sc-metin)]">{c.ad}</span>
                  </Link>
                ))}
              </div>
              <Link href="/panel/supercomputer/calisanlar" aria-label="Tüm çalışanlar" title="Tüm çalışanlar" className="flex h-9 shrink-0 items-center gap-1 rounded-full bg-white/[0.085] px-3 text-[12.5px] font-medium text-[var(--sc-metin)] ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.12] active:scale-95">Tümü<ChevronRight className="h-3.5 w-3.5" /></Link>
            </motion.div>
          )}

          {calisan ? (
            <div className="mx-auto mt-8 grid max-w-[720px] grid-cols-2 gap-2.5 max-sm:grid-cols-1">
              {calisan.baslaticilar.map((b) => (
                <button key={b} onClick={() => baslat(b, [], ayar, b.slice(0, 44))} className="rounded-[16px] bg-white/[0.03] px-4 py-3.5 text-left text-[14px] leading-snug text-[var(--sc-metin-2)] ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.06] hover:text-[var(--sc-metin)]">{b}</button>
              ))}
            </div>
          ) : (
          <motion.section id="sc-galeri" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.4 }} className="mt-10 scroll-mt-6 overflow-hidden rounded-[24px] bg-[#18181b] ring-1 ring-inset ring-white/[0.07]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/[0.06] px-4 py-3">
              <span className="flex items-center gap-2"><span className="text-[15px] font-semibold text-[var(--sc-metin)]">Bir işle başla</span><span className="rounded-full bg-white/[0.085] px-2 text-[11.5px] tabular-nums leading-5 text-[var(--sc-metin-3)]">{liste.length}</span></span>
            <div role="tablist" aria-label="Görev türü" className="gizli-scroll -mr-2 flex min-w-0 flex-1 gap-0.5 overflow-x-auto [scrollbar-width:none] sm:justify-end">
              {KATEGORILER.map(([id, ad2, I]) => (
                <button key={id} role="tab" aria-selected={kat === id} onClick={() => setKat(id)}
                  className={cn("relative flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors", kat === id ? "text-[#0b0b0c]" : "text-[var(--sc-metin-2)] hover:text-[var(--sc-metin)]")}>
                  {kat === id && <motion.span layoutId="sc-ana-kat" transition={YAY} className="absolute inset-0 rounded-full bg-white" />}
                  <I className="relative h-4 w-4" /><span className="relative">{ad2}</span>
                </button>
              ))}
            </div>
            </div>
            {/* Sekme değişince yalnız ızgara kısa bir solmayla değişir (kart başına yay/yerleşim animasyonu kasma yapıyordu). */}
            <motion.div key={kat} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.16 }} className="grid grid-cols-4 gap-2.5 p-3 max-lg:grid-cols-3 max-md:grid-cols-2 sm:p-4">
              {liste.map((g) => <GorevKarti key={g.ad} g={g} onSec={() => sec(g)} onCalistir={() => baslat(g.istem, [], { ...VARSAYILAN_AYAR, ...g.ayar, model: ayar.model }, g.ad)} />)}
            </motion.div>
          </motion.section>
          )}
          <p className="mt-8 text-center text-[12px] text-[var(--sc-metin-3)]">Usta hata yapabilir. Görsel üretimi kredi harcar; önce onayını ister.</p>
        </div>
        {tanisma && <Tanisma varsayilanAd={hesapAd} onBitti={() => setTanisma(false)} />}
      </div>
    </MotionConfig>
  );
}
