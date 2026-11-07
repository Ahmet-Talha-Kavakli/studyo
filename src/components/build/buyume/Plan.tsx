"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight, CalendarCheck, Gamepad2, Mail, Megaphone, PenLine, Plus, RefreshCcw, RotateCcw, ShoppingBag, Smartphone, Target, Trash2, TrendingUp, UserRound, Users, Wand2,
} from "lucide-react";
import { api, gorece } from "@/lib/build/istemci";
import {
  butceToplami, HEDEFLER, hedefAdi, ICERIK_KANALLARI, kimlik, planKanali, PLAN_KANALLARI, PLANDAN_ICERIGE, tarihEkle,
  type BuyumePlan, type Gorev, type HedefId, type IcerikKanalId, type Metrik, type OlcumId, type Oncelik, type Persona, type PlanKanal, type PlanKanalId,
} from "@/lib/build/buyumeTipler";
import type { FormGonderimi, Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import {
  alan, birincil, Etiket, Halka, HataSatiri, ikincil, Kart, KanalLogo, ModelYokKart, Rozet, SecenekMenusu, Cip, simgeDugme, Suruyor, tl, turkceTarih, YanPanel, SatirSecici } from "./ortak";
import { ModelYokHatasi, type BuyumeKanca } from "./useBuyume";
import type { Git } from "./BuyumeSekme";

const HEDEF_IKON: Record<HedefId, typeof Target> = { "ilk-100": Users, rezervasyon: CalendarCheck, ziyaretci: TrendingUp, satis: ShoppingBag, bilinirlik: Megaphone, eposta: Mail, indirme: Smartphone, oyuncu: Gamepad2, ozel: PenLine };
const ONCELIK: Record<Oncelik, { ad: string; ton: "aksan" | "notr" | "soluk" }> = { yuksek: { ad: "Yüksek öncelik", ton: "aksan" }, orta: { ad: "Orta öncelik", ton: "notr" }, dusuk: { ad: "Düşük öncelik", ton: "soluk" } };
const OLCUM: { id: OlcumId; ad: string; alt: string }[] = [
  { id: "ziyaretci", ad: "Ziyaretçi", alt: "Vayra Analitik, tekil ziyaretçi" }, { id: "sosyal", ad: "Sosyal medyadan gelen", alt: "Vayra Analitik, sosyal kanal" },
  { id: "ucretli", ad: "Reklamdan gelen", alt: "Vayra Analitik, ücretli kanal" }, { id: "eposta", ad: "E-postadan gelen", alt: "Vayra Analitik, e-posta kanalı" },
  { id: "arama", ad: "Aramadan gelen", alt: "Vayra Analitik, arama motorları" }, { id: "form", ad: "Form gönderimi", alt: "Bulut gelen kutusu" },
];
/** Proje türüne göre önce gösterilecek hedefler. */
const TUR_HEDEF: Record<Proje["tur"], HedefId[]> = { site: ["ilk-100", "rezervasyon", "ziyaretci", "satis", "bilinirlik", "eposta"], uygulama: ["ilk-100", "ziyaretci", "eposta", "satis", "bilinirlik", "indirme"], oyun: ["oyuncu", "ziyaretci", "bilinirlik", "eposta", "ilk-100", "satis"], mobil: ["indirme", "ilk-100", "bilinirlik", "eposta", "ziyaretci", "satis"] };

type Olcumler = { yayinda: boolean; degerler: Partial<Record<OlcumId, number>>; kampanyalar: { ad: string; adet: number }[] } | null;

/** Plan oluşturma formu: hedef, bütçe sınırı, not. Boş durumda ve "Hedefi değiştir" panelinde kullanılır. */
function PlanFormu({ p, plan, gonder, suruyor, dar }: { p: Proje; plan: BuyumePlan | null; gonder: (g: { hedef: HedefId; hedefOzel?: string; butceSiniri?: number; not?: string }) => void; suruyor: boolean; dar?: boolean }) {
  const [hedef, setHedef] = useState<HedefId>(plan?.hedef ?? TUR_HEDEF[p.tur][0]);
  const [ozel, setOzel] = useState(plan?.hedefOzel ?? "");
  const [butce, setButce] = useState(plan?.butceSiniri ? String(plan.butceSiniri) : "");
  const [not, setNot] = useState(plan?.not ?? "");
  const hedefler = [...TUR_HEDEF[p.tur], "ozel" as const].map((id) => HEDEFLER.find((h) => h.id === id)!);
  const gecerli = hedef !== "ozel" || ozel.trim().length >= 3;
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[12.5px] text-white/60">Bu ay neyi büyütmek istiyorsun?</p>
        <div className={cn("grid gap-2", dar ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3")}>
          {hedefler.map((h) => {
            const I = HEDEF_IKON[h.id];
            return (
              <button key={h.id} type="button" onClick={() => setHedef(h.id)} className={cn("flex items-center gap-3 rounded-[14px] p-3 text-left transition-[box-shadow,background-color]", hedef === h.id ? "bg-white/[0.07] ring-2 ring-inset ring-white" : "bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.06]")}>
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]", hedef === h.id ? "bg-[#55d6fd]/[0.14]" : "bg-white/[0.06]")}><I className={cn("h-4 w-4", hedef === h.id ? "text-[#8be6ff]" : "text-white/70")} /></span>
                <span className="min-w-0"><span className="block text-[13.5px] font-medium text-white">{h.ad}</span><span className="line-clamp-2 text-[12px] leading-snug text-white/50">{h.alt}</span></span>
              </button>
            );
          })}
        </div>
        <AnimatePresence initial={false}>
          {hedef === "ozel" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <input autoFocus value={ozel} onChange={(e) => setOzel(e.target.value)} maxLength={160} placeholder="Hedefini yaz: kurumsal toplantı paketlerine 20 şirket bulmak" className={cn(alan, "mt-2 h-10")} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className={cn("grid grid-cols-1 gap-3", !dar && "sm:grid-cols-[200px_minmax(0,1fr)]")}>
        <Etiket ad="Aylık bütçe sınırı">
          <span className="flex h-10 items-center rounded-[12px] bg-white/[0.05] ring-1 ring-inset ring-white/[0.08] focus-within:ring-white/30">
            <input inputMode="numeric" value={butce} onChange={(e) => setButce(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="Ajan önersin" className="h-full min-w-0 flex-1 bg-transparent pl-3.5 text-[13.5px] text-white outline-none placeholder:text-white/35" />
            <span className="pr-3.5 text-[13px] text-white/45">TL</span>
          </span>
        </Etiket>
        <Etiket ad="Ajanın bilmesi gerekenler">
          <input value={not} onChange={(e) => setNot(e.target.value)} maxLength={600} placeholder="Hafta içi sabahları sakin geçiyor, öğrencilere indirim var" className={cn(alan, "h-10")} />
        </Etiket>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={!gecerli || suruyor} onClick={() => gonder({ hedef, hedefOzel: hedef === "ozel" ? ozel.trim() : undefined, butceSiniri: Number(butce) || undefined, not: not.trim() || undefined })} className={cn(birincil, "h-10 px-5")}>
          <Wand2 className="h-4 w-4" />{plan ? "Planı yeniden oluştur" : "Planı oluştur"}
        </button>
        <p className="text-[12px] text-white/45">Ajan projenin {Object.keys(p.dosyalar).filter((y) => y.endsWith(".html")).length} sayfasını, türünü ve arama bilgisini okur.</p>
      </div>
    </div>
  );
}

/** Boş durum: ne üretileceğini gösteren şerit ve form. */
function BosPlan({ p, gonder, suruyor }: { p: Proje; gonder: Parameters<typeof PlanFormu>[0]["gonder"]; suruyor: boolean }) {
  const sayfalar = Object.keys(p.dosyalar).filter((y) => y.endsWith(".html"));
  return (
    <Kart>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-white">{p.ad} için büyüme planı</h3>
          <p className="mt-1 max-w-[520px] text-[13px] leading-relaxed text-white/60">Pazarlama ajanı siteni okur; kime, hangi kanalda, ne zaman ve ne kadar bütçeyle anlatacağını çıkarır. Sonra gönderileri, görselleri ve reklam metinlerini Vayra stüdyolarıyla hazırlar.</p>
        </div>
        {/* Mekanizma: proje okunur, dört parça çıkar */}
        <div className="flex items-center gap-2">
          <span className="relative h-[72px] w-[104px] shrink-0 overflow-hidden rounded-[12px] bg-white/[0.05] ring-1 ring-inset ring-white/[0.1]">
            {p.kapak && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.kapak} alt="" className="h-full w-full object-cover object-top" />}
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-1 pt-4 text-[10.5px] font-medium text-white/85">{sayfalar.length} sayfa</span>
          </span>
          <span className="h-px w-5 bg-gradient-to-r from-white/10 to-[#55d6fd]/60" />
          <div className="grid grid-cols-2 gap-1.5">
            {[[Users, "Kitle"], [Target, "Kanallar"], [CalendarCheck, "30 gün"], [TrendingUp, "Bütçe"]].map(([I, a]) => { const Ikon = I as typeof Users; return <span key={a as string} className="flex h-[33px] items-center gap-1.5 rounded-[10px] bg-white/[0.05] px-2.5 text-[11.5px] text-white/75 ring-1 ring-inset ring-white/[0.07]"><Ikon className="h-3.5 w-3.5 text-[#8be6ff]" />{a as string}</span>; })}
          </div>
        </div>
      </div>
      <div className="mt-5 border-t border-white/[0.06] pt-5"><PlanFormu p={p} plan={null} gonder={gonder} suruyor={suruyor} /></div>
    </Kart>
  );
}

/** 30 günlük takvimin küçük görünümü: haftaya hizalı hücreler, her hücrede kanal logoları. */
function MiniTakvim({ plan, git }: { plan: BuyumePlan; git: Git }) {
  const ilkGunHafta = (new Date(plan.baslangic + "T12:00:00Z").getUTCDay() + 6) % 7;
  const gunler = Array.from({ length: 30 }, (_, i) => i + 1);
  const bugun = new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);
  return (
    <div>
      <div className="mb-1.5 grid grid-cols-7 gap-1 text-center text-[11px] text-white/40">{["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((g) => <span key={g}>{g}</span>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: ilkGunHafta }, (_, i) => <span key={`b${i}`} />)}
        {gunler.map((g) => {
          const ogeler = plan.takvim.filter((o) => o.gun === g);
          const tarih = tarihEkle(plan.baslangic, g - 1);
          return (
            <button key={g} type="button" onClick={() => git("takvim")} title={ogeler.map((o) => o.baslik).join(", ") || `Gün ${g}`}
              className={cn("flex h-[46px] flex-col justify-between rounded-[10px] p-1.5 text-left transition-colors", ogeler.length ? "bg-white/[0.05] hover:bg-white/[0.09]" : "bg-white/[0.02] hover:bg-white/[0.05]", tarih === bugun && "ring-1 ring-inset ring-[#55d6fd]/60")}>
              <span className="text-[10.5px] tabular-nums text-white/45">{Number(tarih.slice(8))}</span>
              <span className="flex gap-0.5">{ogeler.slice(0, 2).map((o) => <KanalLogo key={o.id} kanal={o.kanal} boyut={16} className="rounded-[5px]" />)}{ogeler.length > 2 && <span className="text-[10px] text-white/45">+{ogeler.length - 2}</span>}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Bütçe dağılımı: tek renk çubuklar (büyüklük), satırda kanal logosu ve tutar. */
function ButceCubuklari({ plan }: { plan: BuyumePlan }) {
  const [ust, setUst] = useState<string | null>(null);
  const toplam = butceToplami(plan);
  const en = Math.max(1, ...plan.butce.kalemler.map((k) => k.tutar));
  if (!plan.butce.kalemler.length) return <p className="text-[12.5px] text-white/50">Bütçe kalemi yok; bütün kanallar organik.</p>;
  return (
    <ul className="space-y-2.5" onMouseLeave={() => setUst(null)}>
      {plan.butce.kalemler.map((k) => (
        <li key={k.id} onMouseEnter={() => setUst(k.id)} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 sm:grid-cols-[180px_minmax(0,1fr)_auto]">
          <span className="flex min-w-0 items-center gap-2">{k.kanal ? <KanalLogo kanal={k.kanal} boyut={22} className="rounded-[7px]" /> : <span className="h-[22px] w-[22px] shrink-0 rounded-[7px] bg-white/[0.06]" />}<span className="truncate text-[13px] text-white/85" title={k.not}>{k.ad}</span></span>
          <span className="relative col-span-2 h-2.5 rounded-full bg-white/[0.04] sm:col-span-1 sm:row-start-1 sm:col-start-2">
            <motion.span initial={{ width: 0 }} animate={{ width: `${(k.tutar / en) * 100}%` }} transition={{ duration: 0.5, ease: "easeOut" }} className="absolute inset-y-0 left-0 rounded-full transition-colors" style={{ background: ust === k.id ? "#55d6fd" : "#1e9fcf" }} />
            {ust === k.id && <span className="absolute -top-8 left-0 z-10 whitespace-nowrap rounded-[8px] bg-[#1d1e22] px-2 py-1 text-[11.5px] text-white ring-1 ring-inset ring-white/10">{k.ad}: {tl(k.tutar)}, payı yüzde {toplam ? Math.round((k.tutar / toplam) * 100) : 0}{k.not ? ` · ${k.not}` : ""}</span>}
          </span>
          <span className="row-start-1 text-right text-[13px] font-medium tabular-nums text-white sm:col-start-3">{tl(k.tutar)}</span>
        </li>
      ))}
    </ul>
  );
}

type Duzen = { tur: "persona" | "kanal" | "metrik" | "butce" | "gorev"; id?: string } | null;

export function PlanBolumu({ p, b, git, ajanaGonder }: { p: Proje; b: BuyumeKanca; git: Git; ajanaGonder?: (m: string) => void }) {
  const plan = b.veri?.plan ?? null;
  const [hata, setHata] = useState("");
  const [modelYok, setModelYok] = useState(false);
  const [hedefPanel, setHedefPanel] = useState(false);
  const [duzen, setDuzen] = useState<Duzen>(null);
  const [konumDuzen, setKonumDuzen] = useState<string | null>(null);
  const [olcum, setOlcum] = useState<Olcumler>(null);
  const suruyor = b.suruyor("plan");

  useEffect(() => {
    let iptal = false;
    (async () => {
      const a = await api<{ toplam: { ziyaretci: number }; kanallar: { ad: string; adet: number }[]; kampanyalar: { ad: string; adet: number }[] }>(`/api/build/analitik/${p.id}?gun=30`).catch(() => null);
      const f = await api<{ gonderimler: FormGonderimi[] }>(`/api/build/form/${p.id}`).catch(() => null);
      if (iptal) return;
      const kanal = (ad: string) => a?.kanallar.find((k) => k.ad === ad)?.adet ?? 0;
      setOlcum({ yayinda: !!p.yayin, degerler: a ? { ziyaretci: a.toplam.ziyaretci, sosyal: kanal("Sosyal"), ucretli: kanal("Ücretli"), eposta: kanal("E-posta"), arama: kanal("Arama"), form: f ? f.gonderimler.filter((x) => Date.now() - x.zaman < 30 * 864e5).length : undefined } : {}, kampanyalar: (a?.kampanyalar ?? []).filter((k) => k.ad.includes("vayra-buyume")) });
    })();
    return () => { iptal = true; };
  }, [p.id, p.yayin]);

  const olustur = async (g: { hedef: HedefId; hedefOzel?: string; butceSiniri?: number; not?: string }) => {
    setHata(""); setModelYok(false); setHedefPanel(false);
    try { await b.uret("plan", g); } catch (e) { if (e instanceof ModelYokHatasi) setModelYok(true); else setHata(e instanceof Error ? e.message : "Plan oluşturulamadı."); }
  };
  const planDegistir = (f: (pl: BuyumePlan) => void) => {
    if (!plan) return;
    const y = structuredClone(plan); f(y);
    b.degistir((v) => { v.plan = y; }, { plan: y });
  };

  const ustBilgi = (
    <>
      <AnimatePresence>{hata && <div className="mb-3"><HataSatiri mesaj={hata} kapat={() => setHata("")} /></div>}</AnimatePresence>
      {modelYok && <div className="mb-3"><ModelYokKart tekrar={() => { setModelYok(false); b.yukle(); }} /></div>}
    </>
  );

  if (!plan) {
    return (
      <div className="space-y-4">
        {ustBilgi}
        {suruyor ? <PlanHazirlaniyor p={p} /> : <BosPlan p={p} gonder={olustur} suruyor={suruyor} />}
      </div>
    );
  }

  const takvimSayisi = plan.takvim.length;
  const sonGun = tarihEkle(plan.baslangic, 29);
  return (
    <div className="space-y-4">
      {ustBilgi}
      {suruyor && <PlanHazirlaniyor p={p} yeniden />}

      {/* Özet */}
      <Kart
        baslik={<span className="flex flex-wrap items-center gap-2">Büyüme planı<Rozet ton="aksan"><Target className="h-3 w-3" />{hedefAdi(plan)}</Rozet></span>}
        aciklama={`${turkceTarih(plan.baslangic, { day: "numeric", month: "long" })} ile ${turkceTarih(sonGun, { day: "numeric", month: "long" })} arası · ${plan.model ? `${plan.model} ile ` : ""}${gorece(plan.olusturma)} hazırlandı`}
        sag={<>
          {b.veri?.oncekiPlan && <button type="button" onClick={() => b.degistir((v) => { const o = v.plan; v.plan = v.oncekiPlan ?? null; v.oncekiPlan = o; }, { oncekiPlanaDon: true })} className={cn(ikincil, "h-8 px-3 text-[12.5px]")} title="Yeniden oluşturmadan önceki plana dön"><RotateCcw className="h-3.5 w-3.5" />Önceki plan</button>}
          <button type="button" onClick={() => setHedefPanel(true)} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><Target className="h-3.5 w-3.5" />Hedefi değiştir</button>
          <button type="button" disabled={suruyor} onClick={() => olustur({ hedef: plan.hedef, hedefOzel: plan.hedefOzel, butceSiniri: plan.butceSiniri, not: plan.not })} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><RefreshCcw className="h-3.5 w-3.5" />Yeniden oluştur</button>
        </>}>
        {plan.ozet && <p className="text-[13.5px] leading-relaxed text-white/75">{plan.ozet}</p>}
        <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[14px] bg-white/[0.06] ring-1 ring-inset ring-white/[0.06] sm:grid-cols-4">
          {[["Hedef kitle", `${plan.personalar.length} persona`], ["Kanal", `${plan.kanallar.length} kanal`], ["Takvim", `${takvimSayisi} adım`], ["Aylık bütçe", tl(butceToplami(plan))]].map(([a, d]) => (
            <div key={a} className="bg-[#141518] px-3.5 py-3"><dt className="text-[11.5px] text-white/45">{a}</dt><dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-white">{d}</dd></div>
          ))}
        </dl>
      </Kart>

      {/* Konumlandırma */}
      <Kart baslik="Konumlandırma" aciklama="Bütün gönderilerin ve reklamların çıktığı tek cümle."
        sag={konumDuzen === null ? <button type="button" onClick={() => setKonumDuzen(plan.konumlandirma)} className={simgeDugme} aria-label="Konumlandırmayı düzenle" title="Düzenle"><PenLine className="h-4 w-4" /></button> : undefined}>
        {konumDuzen === null ? (
          <p className="border-l-2 border-[#55d6fd]/70 pl-3.5 text-[16px] font-medium leading-relaxed tracking-[-0.01em] text-white">{plan.konumlandirma}</p>
        ) : (
          <div>
            <textarea autoFocus value={konumDuzen} onChange={(e) => setKonumDuzen(e.target.value)} rows={3} maxLength={400} className={cn(alan, "resize-none py-2.5 text-[14.5px] leading-relaxed")} />
            <div className="mt-2 flex gap-2"><button type="button" onClick={() => { planDegistir((pl) => { pl.konumlandirma = konumDuzen.trim() || pl.konumlandirma; }); setKonumDuzen(null); }} className={cn(birincil, "h-8")}>Kaydet</button><button type="button" onClick={() => setKonumDuzen(null)} className={cn(ikincil, "h-8")}>Vazgeç</button></div>
          </div>
        )}
      </Kart>

      {/* Hedef kitle */}
      <Kart baslik="Hedef kitle" aciklama="Gönderiler ve reklamlar bu kişilere göre yazılır."
        sag={plan.personalar.length < 4 ? <button type="button" onClick={() => setDuzen({ tur: "persona" })} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><Plus className="h-3.5 w-3.5" />Kitle ekle</button> : undefined}>
        <div className="grid gap-2.5 md:grid-cols-2 2xl:grid-cols-3">
          {plan.personalar.map((x) => (
            <button key={x.id} type="button" onClick={() => setDuzen({ tur: "persona", id: x.id })} className="group rounded-[16px] bg-white/[0.03] p-3.5 text-left ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.055]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#55d6fd]/[0.1] ring-1 ring-inset ring-[#55d6fd]/20"><UserRound className="h-4 w-4 text-[#8be6ff]" /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-semibold text-white">{x.ad}</span>{x.yas && <span className="block text-[12px] text-white/50">{x.yas} yaş</span>}</span>
                <PenLine className="h-3.5 w-3.5 shrink-0 text-white/0 transition-colors group-hover:text-white/50" />
              </div>
              {x.tanim && <p className="mt-2.5 text-[12.5px] leading-relaxed text-white/65">{x.tanim}</p>}
              {!!x.ihtiyaclar.length && <ul className="mt-2 space-y-1">{x.ihtiyaclar.map((i) => <li key={i} className="flex gap-2 text-[12.5px] text-white/75"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#55d6fd]" />{i}</li>)}</ul>}
              {!!x.kanallar.length && <div className="mt-2.5 flex flex-wrap gap-1">{x.kanallar.map((k) => <Rozet key={k} ton="soluk">{k}</Rozet>)}</div>}
            </button>
          ))}
        </div>
      </Kart>

      {/* Kanallar */}
      <Kart baslik="Kanallar" aciklama="Neden bu kanal, ne sıklıkla ve ne kadar bütçeyle."
        sag={<button type="button" onClick={() => setDuzen({ tur: "kanal" })} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><Plus className="h-3.5 w-3.5" />Kanal ekle</button>}>
        <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
          {[...plan.kanallar].sort((a, c) => ["yuksek", "orta", "dusuk"].indexOf(a.oncelik) - ["yuksek", "orta", "dusuk"].indexOf(c.oncelik)).map((k) => {
            const tanim = planKanali(k.kanal);
            const icerik = PLANDAN_ICERIGE[k.kanal];
            return (
              <li key={k.id} className="flex flex-wrap items-start gap-3 px-3.5 py-3 sm:flex-nowrap">
                <KanalLogo kanal={k.kanal} boyut={34} className="mt-0.5 rounded-[10px]" />
                <div className="min-w-0 flex-1 basis-[200px]">
                  <div className="flex flex-wrap items-center gap-2"><span className="text-[13.5px] font-semibold text-white">{k.kanal === "ozel" ? k.ozelAd : tanim.ad}</span><Rozet ton={ONCELIK[k.oncelik].ton}>{ONCELIK[k.oncelik].ad}</Rozet></div>
                  {k.neden && <p className="mt-1 text-[12.5px] leading-relaxed text-white/65">{k.neden}</p>}
                  <p className="mt-1 text-[12px] text-white/45">{[k.siklik, k.butce ? `aylık ${tl(k.butce)}` : "bütçesiz, organik"].filter(Boolean).join(" · ")}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1 max-sm:ml-[46px]">
                  {icerik && <button type="button" onClick={() => git("icerik", { kanal: k.kanal === "meta" ? "instagram" : icerik })} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>Gönderi üret</button>}
                  {(k.kanal === "google-ads" || k.kanal === "meta") && <button type="button" onClick={() => git("reklam")} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>Reklam metni</button>}
                  {k.kanal === "seo" && <button type="button" onClick={() => git("blog")} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>Blog konuları</button>}
                  <button type="button" onClick={() => setDuzen({ tur: "kanal", id: k.id })} className={simgeDugme} aria-label="Kanalı düzenle" title="Düzenle"><PenLine className="h-3.5 w-3.5" /></button>
                </div>
              </li>
            );
          })}
        </ul>
      </Kart>

      {/* Takvim önizleme ve bütçe */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Kart baslik="30 günlük takvim" aciklama={`${takvimSayisi} adım, ${turkceTarih(plan.baslangic, { day: "numeric", month: "long" })} başlangıç`}
          sag={<button type="button" onClick={() => git("takvim")} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>Takvimi aç<ArrowUpRight className="h-3.5 w-3.5" /></button>}>
          <MiniTakvim plan={plan} git={git} />
        </Kart>
        <Kart baslik={<span className="flex items-center gap-2">Aylık bütçe<Rozet>{tl(butceToplami(plan))}</Rozet></span>} aciklama={plan.butceSiniri ? `Sınırın ${tl(plan.butceSiniri)}` : "Ajanın önerisi; istediğin gibi değiştir."}
          sag={<button type="button" onClick={() => setDuzen({ tur: "butce" })} className={simgeDugme} aria-label="Bütçeyi düzenle" title="Düzenle"><PenLine className="h-3.5 w-3.5" /></button>}>
          <ButceCubuklari plan={plan} />
          {plan.butce.not && <p className="mt-3.5 rounded-[12px] bg-white/[0.03] px-3 py-2 text-[12.5px] leading-relaxed text-white/60">{plan.butce.not}</p>}
        </Kart>
      </div>

      {/* Metrikler */}
      <Kart baslik="Ölçülecek metrikler" aciklama={olcum?.yayinda ? "Şu anki değerler son 30 günün Vayra Analitik ve gelen kutusu verisidir." : "Site yayında değil; ölçüm yayından sonra kendiliğinden başlar."}
        sag={<button type="button" onClick={() => setDuzen({ tur: "metrik" })} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><Plus className="h-3.5 w-3.5" />Metrik ekle</button>}>
        <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
          {plan.metrikler.map((m) => {
            const deger = m.olcum !== "yok" ? olcum?.degerler[m.olcum] : undefined;
            return (
              <li key={m.id}>
                <button type="button" onClick={() => setDuzen({ tur: "metrik", id: m.id })} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-white/[0.03] sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_110px]">
                  <span className="min-w-0"><span className="block text-[13.5px] text-white">{m.ad}</span>{m.neden && <span className="block truncate text-[12px] text-white/45">{m.neden}</span>}</span>
                  <span className="text-[13px] text-white/80 max-sm:hidden">{m.hedef}</span>
                  <span className="text-right">
                    {deger !== undefined ? <><span className="block text-[15px] font-semibold tabular-nums text-white">{deger.toLocaleString("tr-TR")}</span><span className="block text-[11px] text-white/40">şu an</span></> : <span className="text-[12px] text-white/40">{m.olcum === "yok" ? "Elle takip" : olcum?.yayinda ? "Veri yok" : "Yayında değil"}</span>}
                    <span className="mt-0.5 block text-[12px] text-white/60 sm:hidden">{m.hedef}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {!!olcum?.kampanyalar.length && (
          <div className="mt-3 rounded-[12px] bg-white/[0.03] px-3.5 py-2.5 ring-1 ring-inset ring-white/[0.06]">
            <p className="text-[12px] text-white/50">Gönderi bağlantılarından gelenler</p>
            <ul className="mt-1.5 space-y-1">{olcum.kampanyalar.map((k) => <li key={k.ad} className="flex justify-between gap-3 text-[12.5px] text-white/80"><span className="truncate">{k.ad.split(" / ")[0]}</span><span className="tabular-nums">{k.adet.toLocaleString("tr-TR")} ziyaret</span></li>)}</ul>
          </div>
        )}
      </Kart>

      {/* Yapılacaklar */}
      <Kart baslik={<span className="flex items-center gap-2">Yapılacaklar<Rozet>{plan.gorevler.filter((g) => g.bitti).length} / {plan.gorevler.length}</Rozet></span>} aciklama="Ajanın önerdiği işler. Siteye dair olanları tek tıkla Build ajanına gönder."
        sag={<button type="button" onClick={() => setDuzen({ tur: "gorev" })} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}><Plus className="h-3.5 w-3.5" />Görev ekle</button>}>
        <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.07]">
          {plan.gorevler.map((g) => (
            <li key={g.id} className="flex flex-wrap items-center gap-3 px-3.5 py-3 sm:flex-nowrap">
              <button type="button" role="checkbox" aria-checked={g.bitti} aria-label={g.bitti ? "Yapılmadı olarak işaretle" : "Yapıldı olarak işaretle"} onClick={() => planDegistir((pl) => { const x = pl.gorevler.find((y) => y.id === g.id); if (x) x.bitti = !x.bitti; })} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/[0.06]"><Halka dolu={g.bitti} /></button>
              <button type="button" onClick={() => setDuzen({ tur: "gorev", id: g.id })} className="min-w-0 flex-1 basis-[200px] text-left">
                <span className={cn("block text-[13.5px] transition-colors", g.bitti ? "text-white/45 line-through decoration-white/25" : "text-white")}>{g.baslik}</span>
                {g.aciklama && <span className="block text-[12px] leading-relaxed text-white/45">{g.aciklama}</span>}
              </button>
              <span className="shrink-0 max-sm:ml-11">
                {g.tur === "site" && ajanaGonder && <button type="button" disabled={g.bitti} onClick={() => { ajanaGonder(g.ajanIstemi || g.baslik); planDegistir((pl) => { const x = pl.gorevler.find((y) => y.id === g.id); if (x) x.bitti = true; }); }} className={cn(birincil, "h-8 px-3 text-[12.5px]")}>Ajana gönder</button>}
                {g.tur === "icerik" && <button type="button" onClick={() => git("icerik", { kanal: g.kanal })} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>Gönderi üret</button>}
                {g.tur === "reklam" && <button type="button" onClick={() => git("reklam")} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>Reklam metinleri</button>}
                {g.tur === "blog" && <button type="button" onClick={() => git("blog")} className={cn(ikincil, "h-8 px-3 text-[12.5px]")}>Blog konuları</button>}
              </span>
            </li>
          ))}
          {!plan.gorevler.length && <li className="px-3.5 py-3 text-[12.5px] text-white/50">Görev yok.</li>}
        </ul>
      </Kart>

      <YanPanel acik={hedefPanel} kapat={() => setHedefPanel(false)} baslik="Hedefi değiştir" alt="Ajan planı yeni hedefe göre baştan yazar; şimdiki planı Önceki plan ile geri getirebilirsin." genis>
        <PlanFormu p={p} plan={plan} gonder={olustur} suruyor={suruyor} dar />
      </YanPanel>
      <PlanPaneli plan={plan} duzen={duzen} kapat={() => setDuzen(null)} kaydet={(f) => { planDegistir(f); setDuzen(null); }} />
    </div>
  );
}

function PlanHazirlaniyor({ p, yeniden }: { p: Proje; yeniden?: boolean }) {
  const sayfalar = Object.keys(p.dosyalar).filter((y) => y.endsWith(".html"));
  return (
    <Suruyor metin={yeniden ? "Plan yeniden yazılıyor" : "Büyüme planı hazırlanıyor"} alt={<>Okunanlar: {sayfalar.slice(0, 5).join(", ")}{sayfalar.length > 5 ? ` ve ${sayfalar.length - 5} sayfa daha` : ""}, proje türü, arama başlığı ve açıklaması{p.ayarlar.talimat.trim() ? ", marka talimatların" : ""}. Bitince burada açılır; sekmeden çıkabilirsin.</>} />
  );
}

/** Plan parçalarını düzenleme paneli (kitle, kanal, metrik, bütçe, görev). */
function PlanPaneli({ plan, duzen, kapat, kaydet }: { plan: BuyumePlan; duzen: Duzen; kapat: () => void; kaydet: (f: (pl: BuyumePlan) => void) => void }) {
  const [p, setP] = useState<Persona | null>(null);
  const [k, setK] = useState<PlanKanal | null>(null);
  const [m, setM] = useState<Metrik | null>(null);
  const [g, setG] = useState<Gorev | null>(null);
  const [bt, setBt] = useState<BuyumePlan["butce"] | null>(null);
  useEffect(() => {
    if (!duzen) return;
    if (duzen.tur === "persona") setP(structuredClone(plan.personalar.find((x) => x.id === duzen.id) ?? { id: kimlik(), ad: "", yas: "", tanim: "", ihtiyaclar: [], kanallar: [] }));
    if (duzen.tur === "kanal") setK(structuredClone(plan.kanallar.find((x) => x.id === duzen.id) ?? { id: kimlik(), kanal: "instagram", oncelik: "orta", neden: "", siklik: "", butce: 0 }));
    if (duzen.tur === "metrik") setM(structuredClone(plan.metrikler.find((x) => x.id === duzen.id) ?? { id: kimlik(), ad: "", hedef: "", neden: "", olcum: "ziyaretci" }));
    if (duzen.tur === "gorev") setG(structuredClone(plan.gorevler.find((x) => x.id === duzen.id) ?? { id: kimlik(), baslik: "", aciklama: "", tur: "elle", bitti: false }));
    if (duzen.tur === "butce") setBt(structuredClone(plan.butce));
  }, [duzen, plan]);
  const var_ = !!duzen?.id;
  const ust = <T extends { id: string }>(l: T[], x: T) => (l.some((y) => y.id === x.id) ? l.map((y) => (y.id === x.id ? x : y)) : [...l, x]);
  const sil = (f: (pl: BuyumePlan) => void) => <button type="button" onClick={() => kaydet(f)} className="mr-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" />Sil</button>;
  const tur = duzen?.tur;
  const baslik = tur === "persona" ? (var_ ? "Kitleyi düzenle" : "Kitle ekle") : tur === "kanal" ? (var_ ? "Kanalı düzenle" : "Kanal ekle") : tur === "metrik" ? (var_ ? "Metriği düzenle" : "Metrik ekle") : tur === "gorev" ? (var_ ? "Görevi düzenle" : "Görev ekle") : "Bütçeyi düzenle";
  const kaydetF = () => {
    if (tur === "persona" && p) kaydet((pl) => { pl.personalar = ust(pl.personalar, { ...p, ad: p.ad.trim() || "Kitle", ihtiyaclar: p.ihtiyaclar.map((x) => x.trim()).filter(Boolean), kanallar: p.kanallar.map((x) => x.trim()).filter(Boolean) }); });
    if (tur === "kanal" && k) kaydet((pl) => { pl.kanallar = ust(pl.kanallar, k); });
    if (tur === "metrik" && m) kaydet((pl) => { pl.metrikler = ust(pl.metrikler, { ...m, ad: m.ad.trim() || "Metrik" }); });
    if (tur === "gorev" && g) kaydet((pl) => { pl.gorevler = ust(pl.gorevler, { ...g, baslik: g.baslik.trim() || "Görev" }); });
    if (tur === "butce" && bt) kaydet((pl) => { pl.butce = { ...bt, kalemler: bt.kalemler.filter((x) => x.ad.trim() || x.tutar) }; });
  };
  const altlik = (
    <>
      {var_ && tur === "persona" && sil((pl) => { pl.personalar = pl.personalar.filter((x) => x.id !== duzen?.id); })}
      {var_ && tur === "kanal" && sil((pl) => { pl.kanallar = pl.kanallar.filter((x) => x.id !== duzen?.id); })}
      {var_ && tur === "metrik" && sil((pl) => { pl.metrikler = pl.metrikler.filter((x) => x.id !== duzen?.id); })}
      {var_ && tur === "gorev" && sil((pl) => { pl.gorevler = pl.gorevler.filter((x) => x.id !== duzen?.id); })}
      <button type="button" onClick={kapat} className={cn(ikincil, !var_ && "ml-auto")}>Vazgeç</button>
      <button type="button" onClick={kaydetF} className={birincil}>Kaydet</button>
    </>
  );
  return (
    <YanPanel acik={!!duzen} kapat={kapat} baslik={baslik} alt2={altlik}>
      {tur === "persona" && p && (
        <div className="space-y-3.5">
          <Etiket ad="Ad"><input value={p.ad} onChange={(e) => setP({ ...p, ad: e.target.value })} maxLength={80} placeholder="Sabah koşturan profesyonel" className={cn(alan, "h-10")} /></Etiket>
          <Etiket ad="Yaş aralığı"><input value={p.yas} onChange={(e) => setP({ ...p, yas: e.target.value })} maxLength={40} placeholder="25-34" className={cn(alan, "h-10")} /></Etiket>
          <Etiket ad="Kısa tanım"><textarea value={p.tanim} onChange={(e) => setP({ ...p, tanim: e.target.value })} rows={3} maxLength={400} className={cn(alan, "resize-none py-2.5")} /></Etiket>
          <Etiket ad="İhtiyaçları" sag={<span className="text-[11.5px] text-white/35">her satıra bir tane</span>}><textarea value={p.ihtiyaclar.join("\n")} onChange={(e) => setP({ ...p, ihtiyaclar: e.target.value.split("\n").slice(0, 5) })} rows={4} className={cn(alan, "resize-none py-2.5")} /></Etiket>
          <Etiket ad="Vakit geçirdiği yerler" sag={<span className="text-[11.5px] text-white/35">virgülle ayır</span>}><input value={p.kanallar.join(", ")} onChange={(e) => setP({ ...p, kanallar: e.target.value.split(",").map((x) => x.trimStart()).slice(0, 6) })} placeholder="Instagram, Google Haritalar" className={cn(alan, "h-10")} /></Etiket>
        </div>
      )}
      {tur === "kanal" && k && (
        <div className="space-y-3.5">
          <Etiket ad="Kanal">
            <SecenekMenusu genislik={340} deger={k.kanal} sec={(id) => setK({ ...k, kanal: id as PlanKanalId })} l={PLAN_KANALLARI.filter((x) => x.id !== "ozel").map((x) => ({ id: x.id, ad: x.ad, alt: x.alt, logo: <KanalLogo kanal={x.id} boyut={28} /> }))}
              ozel={{ deger: k.ozelAd ?? "", set: (v) => setK({ ...k, kanal: "ozel", ozelAd: v }), yer: "Kanalın adı: Pinterest, YouTube, yerel dergi", alt: "Listede olmayan bir kanal" }}
              tetik={(ac, acik) => <Cip onClick={ac} acik={acik} className="h-10 w-full justify-between pl-2"><span className="flex min-w-0 items-center gap-2"><KanalLogo kanal={k.kanal} boyut={26} /><span className="truncate text-[13.5px]">{k.kanal === "ozel" ? k.ozelAd || "Özel kanal" : planKanali(k.kanal).ad}</span></span></Cip>} />
          </Etiket>
          <div><p className="mb-1.5 text-[12.5px] text-white/60">Öncelik</p><SatirSecici id="buyume-oncelik" deger={k.oncelik} set={(v) => setK({ ...k, oncelik: v })} l={[{ id: "yuksek" as const, ad: "Yüksek" }, { id: "orta" as const, ad: "Orta" }, { id: "dusuk" as const, ad: "Düşük" }]} /></div>
          <Etiket ad="Neden bu kanal"><textarea value={k.neden} onChange={(e) => setK({ ...k, neden: e.target.value })} rows={3} maxLength={400} className={cn(alan, "resize-none py-2.5")} /></Etiket>
          <div className="grid grid-cols-2 gap-3">
            <Etiket ad="Sıklık"><input value={k.siklik} onChange={(e) => setK({ ...k, siklik: e.target.value })} maxLength={80} placeholder="Haftada 3 gönderi" className={cn(alan, "h-10")} /></Etiket>
            <Etiket ad="Aylık bütçe"><span className="flex h-10 items-center rounded-[12px] bg-white/[0.05] ring-1 ring-inset ring-white/[0.08] focus-within:ring-white/30"><input inputMode="numeric" value={k.butce || ""} onChange={(e) => setK({ ...k, butce: Number(e.target.value.replace(/\D/g, "").slice(0, 8)) || 0 })} placeholder="0" className="h-full min-w-0 flex-1 bg-transparent pl-3.5 text-[13.5px] text-white outline-none" /><span className="pr-3.5 text-[13px] text-white/45">TL</span></span></Etiket>
          </div>
          <p className="text-[12px] leading-relaxed text-white/45">Kanal bütçesi bilgi amaçlıdır; toplam bütçeyi Aylık bütçe kartındaki kalemler belirler.</p>
        </div>
      )}
      {tur === "metrik" && m && (
        <div className="space-y-3.5">
          <Etiket ad="Metrik"><input value={m.ad} onChange={(e) => setM({ ...m, ad: e.target.value })} maxLength={80} placeholder="Rezervasyon formu" className={cn(alan, "h-10")} /></Etiket>
          <Etiket ad="Hedef"><input value={m.hedef} onChange={(e) => setM({ ...m, hedef: e.target.value })} maxLength={80} placeholder="Ayda 60 rezervasyon" className={cn(alan, "h-10")} /></Etiket>
          <Etiket ad="Neden önemli"><textarea value={m.neden} onChange={(e) => setM({ ...m, neden: e.target.value })} rows={2} maxLength={300} className={cn(alan, "resize-none py-2.5")} /></Etiket>
          <Etiket ad="Nereden ölçülür">
            <SecenekMenusu genislik={340} deger={m.olcum === "yok" ? "ozel" : m.olcum} sec={(id) => setM({ ...m, olcum: (id === "ozel" ? "yok" : id) as OlcumId })} l={OLCUM.map((o) => ({ id: o.id, ad: o.ad, alt: o.alt }))}
              ozel={{ deger: "", set: () => {}, yer: "Bu metriği kendin takip edeceksin", alt: "Kendim ölçerim" }}
              tetik={(ac, acik) => <Cip onClick={ac} acik={acik} className="h-10 w-full justify-between pl-3.5"><span className="truncate text-[13.5px]">{m.olcum === "yok" ? "Özel: kendim ölçerim" : OLCUM.find((o) => o.id === m.olcum)?.ad}</span></Cip>} />
          </Etiket>
        </div>
      )}
      {tur === "gorev" && g && (
        <div className="space-y-3.5">
          <Etiket ad="Görev"><input value={g.baslik} onChange={(e) => setG({ ...g, baslik: e.target.value })} maxLength={140} className={cn(alan, "h-10")} /></Etiket>
          <Etiket ad="Açıklama"><textarea value={g.aciklama} onChange={(e) => setG({ ...g, aciklama: e.target.value })} rows={2} maxLength={500} className={cn(alan, "resize-none py-2.5")} /></Etiket>
          <div><p className="mb-1.5 text-[12.5px] text-white/60">Türü</p><SatirSecici id="buyume-gorev-tur" kucuk deger={g.tur} set={(v) => setG({ ...g, tur: v, kanal: v === "icerik" ? g.kanal ?? "instagram" : undefined })} l={[{ id: "site" as const, ad: "Site" }, { id: "icerik" as const, ad: "İçerik" }, { id: "reklam" as const, ad: "Reklam" }, { id: "blog" as const, ad: "Blog" }, { id: "elle" as const, ad: "Elle" }]} /></div>
          {g.tur === "site" && <Etiket ad="Build ajanına gidecek istek"><textarea value={g.ajanIstemi ?? ""} onChange={(e) => setG({ ...g, ajanIstemi: e.target.value })} rows={4} maxLength={1200} placeholder="Ana sayfaya bülten kayıt formu ekle" className={cn(alan, "resize-none py-2.5")} /></Etiket>}
          {g.tur === "icerik" && (
            <Etiket ad="Kanal">
              <SecenekMenusu genislik={320} deger={g.kanal ?? "instagram"} sec={(id) => setG({ ...g, kanal: id as IcerikKanalId })} l={ICERIK_KANALLARI.filter((x) => x.id !== "ozel").map((x) => ({ id: x.id, ad: x.ad, alt: `${x.sinir.toLocaleString("tr-TR")} karakter, ${x.oranAd}`, logo: <KanalLogo kanal={x.plan} boyut={28} /> }))}
                ozel={{ deger: "", set: () => {}, yer: "Özel kanalı İçerik bölümünde tanımlarsın", alt: "Kendi kanalın" }}
                tetik={(ac, acik) => <Cip onClick={ac} acik={acik} className="h-10 w-full justify-between pl-2"><span className="flex items-center gap-2"><KanalLogo kanal={ICERIK_KANALLARI.find((x) => x.id === g.kanal)?.plan ?? "instagram"} boyut={26} /><span className="text-[13.5px]">{ICERIK_KANALLARI.find((x) => x.id === g.kanal)?.ad ?? "Instagram gönderisi"}</span></span></Cip>} />
            </Etiket>
          )}
        </div>
      )}
      {tur === "butce" && bt && (
        <div className="space-y-3">
          {bt.kalemler.map((x, i) => (
            <div key={x.id} className="rounded-[14px] bg-white/[0.03] p-2.5 ring-1 ring-inset ring-white/[0.07]">
              <div className="flex items-center gap-2">
                <input value={x.ad} onChange={(e) => setBt({ ...bt, kalemler: bt.kalemler.map((y, j) => (j === i ? { ...y, ad: e.target.value } : y)) })} maxLength={80} placeholder="Kalem" className={cn(alan, "h-9 min-w-0 flex-1")} />
                <span className="flex h-9 w-[124px] shrink-0 items-center rounded-[12px] bg-white/[0.05] ring-1 ring-inset ring-white/[0.08] focus-within:ring-white/30"><input inputMode="numeric" value={x.tutar || ""} onChange={(e) => setBt({ ...bt, kalemler: bt.kalemler.map((y, j) => (j === i ? { ...y, tutar: Number(e.target.value.replace(/\D/g, "").slice(0, 8)) || 0 } : y)) })} placeholder="0" className="h-full min-w-0 flex-1 bg-transparent pl-3 text-[13.5px] tabular-nums text-white outline-none" /><span className="pr-3 text-[12.5px] text-white/45">TL</span></span>
                <button type="button" onClick={() => setBt({ ...bt, kalemler: bt.kalemler.filter((_, j) => j !== i) })} aria-label="Kalemi sil" className={simgeDugme}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              <input value={x.not ?? ""} onChange={(e) => setBt({ ...bt, kalemler: bt.kalemler.map((y, j) => (j === i ? { ...y, not: e.target.value } : y)) })} maxLength={200} placeholder="Not: günde 80 TL, perşembe ve cuma" className={cn(alan, "mt-2 h-8 text-[12.5px]")} />
            </div>
          ))}
          <button type="button" onClick={() => setBt({ ...bt, kalemler: [...bt.kalemler, { id: kimlik(), ad: "", tutar: 0 }] })} className={cn(ikincil, "h-8")}><Plus className="h-3.5 w-3.5" />Kalem ekle</button>
          <div className="flex items-center justify-between rounded-[12px] bg-white/[0.04] px-3.5 py-2.5"><span className="text-[13px] text-white/60">Toplam</span><span className="text-[15px] font-semibold tabular-nums text-white">{tl(bt.kalemler.reduce((t, x) => t + x.tutar, 0))}</span></div>
          <Etiket ad="Bütçe notu"><textarea value={bt.not} onChange={(e) => setBt({ ...bt, not: e.target.value })} rows={2} maxLength={500} className={cn(alan, "resize-none py-2.5")} /></Etiket>
        </div>
      )}
    </YanPanel>
  );
}

