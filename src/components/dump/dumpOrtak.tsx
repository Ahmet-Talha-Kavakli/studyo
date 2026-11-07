"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, Loader2, Plus, LayoutGrid, GalleryHorizontal, RefreshCw, Download, ChevronLeft, ChevronRight, ScanFace, Camera,
  Search, Heart, MessageCircle, Send, Bookmark, Copy, Shuffle, Trash2, Star, Grid3x3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { uretimBaslat, uretimHataToast, uretimIptal, uretimSirasi } from "@/lib/uretimMotoru";
import { KrediYildiz } from "@/components/ui/KrediHap";
import { UretimYukleniyor } from "@/components/studyo/UretimYukleniyor";
import { GorunumAyari } from "@/components/galeri/GorunumAyari";
import { useAlanGenisligi, useGorunum } from "@/components/galeri/useGorunum";
import { kartOrani, sutunSayisi as gorunumSutun } from "@/lib/galeri/gorunum";
import { mesaj } from "@/lib/mesaj";
import { SonucKarti, SonucGoruntuleyici, useAracUretimleri, useGorselBaglanti, gorselModelBul, modelKredi, krediYaz, uretimGorseli, topluIndir } from "@/components/arac/kit";

/**
 * Instadump ve Photodump'ın ortak parçaları: kayan sekmeler, sağ yan panel, Instagram gönderi ve
 * profil önizlemeleri, set görünümü (ızgara, gönderi, profil, ZIP, kapak, kare yenileme, set silme).
 */
const KART = "overflow-hidden rounded-[20px] bg-white/[0.035] ring-1 ring-inset ring-white/[0.07]";
const SERIT = "flex min-h-[52px] items-center gap-2 border-b border-white/[0.07] px-4 py-2.5";
const HAP = "inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] font-medium text-metin-2";

/** Kayan beyaz seçim zeminiyle sekme grubu. */
export function Kayan<T extends string | number>({ id, deger, onDeger, secenekler, buyuk, etiket, serbest, tam }: {
  id: string; deger: T; onDeger: (v: T) => void; secenekler: { v: T; a: React.ReactNode; n?: number }[]; buyuk?: boolean; etiket: string;
  /** Telefonda kapsayıcı kutu olmadan ayrı haplar (yatay kaydırmada kenar kesilmesin). */ serbest?: boolean;
  /** Tam genişlik, eşit sütunlar. */ tam?: boolean;
}) {
  return (
    <div role="tablist" aria-label={etiket} style={tam ? { gridTemplateColumns: `repeat(${secenekler.length}, minmax(0, 1fr))` } : undefined} className={cn(tam ? "grid w-full" : "inline-flex max-w-full", "shrink-0 items-center gap-0.5 rounded-full bg-white/[0.05] p-0.5 ring-1 ring-inset ring-white/[0.07]", serbest && "max-sm:gap-1.5 max-sm:bg-transparent max-sm:p-0 max-sm:ring-0")}>
      {secenekler.map((s) => {
        const sec = s.v === deger;
        return (
          <button key={String(s.v)} role="tab" aria-selected={sec} onClick={(e) => { onDeger(s.v); e.currentTarget.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); }}
            className={cn("relative isolate flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-medium transition-colors duration-200 active:scale-[0.97]",
              buyuk ? "h-9 px-4 text-[13px]" : "h-8 px-3.5 text-[12.5px]", sec ? "text-[#0a0a0b]" : "text-metin-3 hover:text-metin", serbest && !sec && "max-sm:bg-white/[0.05] max-sm:ring-1 max-sm:ring-inset max-sm:ring-white/[0.07]")}>
            {sec && <motion.span layoutId={`kayan-${id}`} className="absolute inset-0 -z-10 rounded-full bg-white" transition={{ type: "spring", stiffness: 520, damping: 40 }} />}
            {s.a}{s.n != null && <span className={cn("tabular-nums", sec ? "text-black/50" : "text-metin-3")}>{s.n}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Sağdan açılan yan panel. */
export function YanPanel({ acik, onKapat, baslik, children, alt }: { acik: boolean; onKapat: () => void; baslik: React.ReactNode; children: React.ReactNode; alt?: React.ReactNode }) {
  useEffect(() => {
    if (!acik) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [acik, onKapat]);
  return (
    <AnimatePresence>
      {acik && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onKapat} className="fixed inset-0 z-[300] bg-black/50" />
          <motion.aside role="dialog" aria-label={typeof baslik === "string" ? baslik : "Panel"} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 40 }}
            className="fixed bottom-0 right-0 top-0 z-[310] flex w-full max-w-[460px] flex-col border-l border-white/[0.08] bg-[#121214]">
            <div className="flex h-14 shrink-0 items-center gap-2 border-b border-white/[0.07] px-4">
              <div className="min-w-0 flex-1 text-[15px] font-semibold text-metin">{baslik}</div>
              <button onClick={onKapat} aria-label="Kapat" className="flex h-9 w-9 items-center justify-center rounded-full text-metin-2 hover:bg-white/[0.07] hover:text-metin active:scale-95"><X className="h-4 w-4" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-width:thin]">{children}</div>
            {alt && <div className="shrink-0 border-t border-white/[0.07] p-4">{alt}</div>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═════════════ Instagram önizlemeleri ═════════════ */
function IgBaslik({ avatar }: { avatar: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-3">
      <span className="rounded-full bg-gradient-to-tr from-amber-300 via-rose-500 to-fuchsia-600 p-[2px]"><span className="block rounded-full bg-black p-[2px]"><span className="block h-8 w-8 overflow-hidden rounded-full bg-white/10">{avatar}</span></span></span>
      <span className="text-[13px] font-semibold text-white">hesabın</span>
    </div>
  );
}

export function IgGonderi({ liste, avatar, metin, onAc }: { liste: Uretim[]; avatar: React.ReactNode; metin: string; onAc: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const git = (n: number) => { const el = ref.current; if (!el) return; const k = Math.max(0, Math.min(liste.length - 1, n)); el.scrollTo({ left: k * el.clientWidth, behavior: "smooth" }); };
  return (
    <div className="mx-auto w-full max-w-[440px] overflow-hidden rounded-[22px] bg-black ring-1 ring-white/10">
      <IgBaslik avatar={avatar} />
      <div className="group relative">
        <div ref={ref} onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))} className="gizli-scroll flex snap-x snap-mandatory overflow-x-auto">
          {liste.map((u) => <div key={u.id} className="w-full shrink-0 snap-center [&_.hf-kart]:!rounded-none [&_.hf-kart]:!ring-0"><SonucKarti u={u} onAc={() => onAc(u.id)} demoGizle eylemsiz /></div>)}
        </div>
        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[11.5px] font-medium tabular-nums text-white">{i + 1}/{liste.length}</span>
        {([[ChevronLeft, -1, "Önceki kare", "left-2.5"], [ChevronRight, 1, "Sonraki kare", "right-2.5"]] as const).map(([I, d, a, yer]) => {
          const kapali = d < 0 ? i === 0 : i >= liste.length - 1;
          return !kapali && (
            <button key={a} onClick={() => git(i + d)} aria-label={a} className={cn("absolute top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-black opacity-0 transition-opacity group-hover:opacity-100 active:scale-95 max-md:opacity-100", yer)}><I className="h-4 w-4" /></button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 px-3.5 pb-1 pt-3 text-white">
        <Heart className="h-[22px] w-[22px]" /><MessageCircle className="h-[22px] w-[22px]" /><Send className="h-[22px] w-[22px]" />
        <span className="mx-auto flex items-center gap-1">{liste.map((u, k) => <span key={u.id} className={cn("h-1.5 w-1.5 rounded-full transition-colors", k === i ? "bg-white" : "bg-white/30")} />)}</span>
        <Bookmark className="h-[22px] w-[22px]" />
      </div>
      <p className="whitespace-pre-line px-3.5 pb-4 pt-2 text-[13px] leading-snug text-white/90"><b className="font-semibold">hesabın</b> {metin}</p>
    </div>
  );
}

export function IgProfil({ liste, avatar, baslik, onAc }: { liste: Uretim[]; avatar: React.ReactNode; baslik: string; onAc: (id: string) => void }) {
  return (
    <div className="mx-auto w-full max-w-[400px] rounded-[46px] bg-[#1a1a1d] p-[10px] ring-1 ring-white/[0.12]">
      <div className="relative flex h-[min(760px,calc(100dvh-220px))] min-h-[560px] flex-col overflow-hidden rounded-[37px] bg-black">
        {/* Durum çubuğu */}
        <div className="flex h-11 shrink-0 items-center justify-between px-7 text-[13px] font-semibold text-white">
          <span className="tabular-nums">9:41</span>
          <span className="absolute left-1/2 top-2.5 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-[#1a1a1d]" aria-hidden />
          <span className="flex items-center gap-1"><span className="h-2.5 w-4 rounded-[3px] border border-white/80" /></span>
        </div>
        {/* Üst başlık */}
        <div className="flex shrink-0 items-center justify-between px-4 pb-2">
          <span className="text-[17px] font-bold text-white">hesabın</span>
          <span className="flex items-center gap-4 text-white"><Plus className="h-5 w-5" /><span className="flex flex-col gap-[3px]"><span className="h-[2px] w-[18px] rounded bg-white" /><span className="h-[2px] w-[18px] rounded bg-white" /><span className="h-[2px] w-[18px] rounded bg-white" /></span></span>
        </div>
        <div className="gizli-scroll min-h-0 flex-1 overflow-y-auto">
          {/* Profil üstü */}
          <div className="flex items-center gap-4 px-4 pt-2">
            <span className="rounded-full bg-gradient-to-tr from-amber-300 via-rose-500 to-fuchsia-600 p-[2.5px]"><span className="block rounded-full bg-black p-[2.5px]"><span className="block h-[76px] w-[76px] overflow-hidden rounded-full bg-white/10">{avatar}</span></span></span>
            <div className="min-w-0 flex-1 text-white">
              <p className="truncate text-[14px] font-semibold">Senin adın</p>
              <p className="mt-0.5 text-[13px] tabular-nums text-white/90"><b className="font-semibold">{liste.length}</b> gönderi</p>
            </div>
          </div>
          <p className="px-4 pt-3 text-[13px] leading-snug text-white/90">{baslik} · yeni döküm</p>
          <div className="flex gap-1.5 px-4 pt-3">
            {["Profili düzenle", "Profili paylaş"].map((t) => <span key={t} className="flex h-8 flex-1 items-center justify-center rounded-[8px] bg-white/[0.12] text-[13px] font-semibold text-white">{t}</span>)}
          </div>
          {/* Sekmeler */}
          <div className="mt-4 flex border-b border-white/10 text-white">
            <span className="flex flex-1 justify-center border-b-[1.5px] border-white pb-2.5"><Grid3x3 className="h-[22px] w-[22px]" /></span>
            <span className="flex flex-1 justify-center pb-2.5 text-white/40"><GalleryHorizontal className="h-[22px] w-[22px]" /></span>
            <span className="flex flex-1 justify-center pb-2.5 text-white/40"><ScanFace className="h-[22px] w-[22px]" /></span>
          </div>
          {/* Izgara */}
          <div className="grid grid-cols-3 gap-[2px] pt-[2px]">
            {liste.map((u, i) => {
              const g = uretimGorseli(u);
              return (
                <button key={u.id} onClick={() => u.durum === "tamam" && onAc(u.id)} className="group relative aspect-[3/4] overflow-hidden bg-white/[0.06]">
                  {u.durum === "tamam" && g ? <img src={g} alt={u.baslik} className="absolute inset-0 h-full w-full object-cover transition-opacity group-hover:opacity-85" />
                    : <span className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-white/50" /></span>}
                  {i === 0 && u.durum === "tamam" && <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-black"><Star className="h-3 w-3" /></span>}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex h-12 shrink-0 items-center justify-around border-t border-white/10 text-white/80">
          {[LayoutGrid, Search, Plus, GalleryHorizontal].map((I, i) => <I key={i} className="h-5 w-5" />)}
          <span className="h-6 w-6 overflow-hidden rounded-full ring-1 ring-white">{avatar}</span>
        </div>
      </div>
    </div>
  );
}


export type DumpSet = { id: string; l: Uretim[] };

/** Aracın üretimlerini set (grupId) bazında gruplar; en yeni set başta. */
export function useDumpSetleri(arac: string) {
  const sonuclar = useAracUretimleri(arac);
  const setler = useMemo(() => {
    const h = new Map<string, Uretim[]>();
    for (const u of sonuclar) { const k = u.meta?.grupId ?? u.id; h.set(k, [...(h.get(k) ?? []), u]); }
    return [...h.entries()].map(([id, l]) => ({ id, l: [...l].sort((a, c) => (a.meta?.sira ?? 0) - (c.meta?.sira ?? 0) || a.olusturma - c.olusturma) }))
      .sort((a, c) => Math.max(...c.l.map((u) => u.olusturma)) - Math.max(...a.l.map((u) => u.olusturma)));
  }, [sonuclar]);
  const surenSayi = sonuclar.filter((u) => u.durum === "kuyrukta" || u.durum === "isleniyor").length;
  return { setler, surenSayi };
}

/** Bir setin tam görünümü + önceki setler + kare görüntüleyici. */
export function DumpSetleri({ arac, setler, aktifId, onAktif, onSilindi, avatarYedek, metinler, etiketler, sosyal = true, ekEylem, kapakEtiket = "Kapak", oncekiBaslik = "Önceki setler" }: {
  arac: string; setler: DumpSet[]; aktifId: string; onAktif: (id: string) => void; onSilindi: () => void;
  avatarYedek?: React.ReactNode | null; metinler: string[]; etiketler: string[];
  /** false: Gönderi/Profil (Instagram) görünümleri gizlenir; yalnız ızgara. */ sosyal?: boolean;
  /** Görüntüleyicide araca özel ek eylem (ör. ürünü giydir). */ ekEylem?: (u: Uretim, kapat: () => void) => React.ReactNode;
  kapakEtiket?: string; oncekiBaslik?: string;
}) {
  const b = useGorselBaglanti();
  const uretimSil = useProjeler((s) => s.sil);
  const uretimGuncelle = useProjeler((s) => s.guncelle);
  const [gorunum, setGorunum] = useState<"izgara" | "gonderi" | "profil">("izgara");
  const galeriSayfa = arac.toLocaleLowerCase("tr");
  const [galeri] = useGorunum(galeriSayfa);
  const [alanRef, alanEn] = useAlanGenisligi<HTMLDivElement>(1000);
  const [secili, setSecili] = useState<string | null>(null);
  const [metinNo, setMetinNo] = useState(0);
  const [silOnay, setSilOnay] = useState(false);
  const aktif = setler.find((s) => s.id === aktifId) ?? setler[0];
  useEffect(() => { setSilOnay(false); setMetinNo(0); }, [aktif?.id]);
  const ilkRef = useRef(aktif?.id);
  useEffect(() => { if (ilkRef.current !== aktif?.id) { ilkRef.current = aktif?.id; setGorunum("izgara"); } }, [aktif?.id]);
  if (!aktif) return null;
  const hazirSayi = aktif.l.filter((u) => u.durum === "tamam").length;
  const aktifDemo = aktif.l.some((u) => u.gercek === false);
  const gonderiMetni = `${metinler[metinNo % metinler.length]}\n${etiketler.map((e) => `#${e}`).join(" ")}`;

  const setAvatar = (u?: Uretim) => {
    const r = u?.meta?.referanslar?.[0];
    return r ? <img src={r} alt="" className="h-full w-full object-cover" /> : avatarYedek ?? <span className="flex h-full w-full items-center justify-center text-white/60"><Camera className="h-4 w-4" /></span>;
  };
  const kareYenile = (u: Uretim) => {
    const um = gorselModelBul(u.model);
    const s = uretimBaslat({ baslik: u.baslik, tur: "gorsel", model: u.model, prompt: u.prompt, kredi: b.bagli(um) === false ? 0 : modelKredi(um), arac, meta: { ...u.meta } });
    if (!s.ok) return uretimHataToast(s);
    toast.success("Kare yeniden üretiliyor", { description: u.baslik });
    setSecili(null);
  };
  const kapakYap = (u: Uretim) => {
    const en = Math.min(...aktif.l.map((x) => x.meta?.sira ?? 0));
    uretimGuncelle(u.id, { meta: { ...u.meta, sira: en - 1 } });
    toast.success("Kapak karesi değişti", { description: "Karusel ve profilde ilk sırada." });
  };
  const setiSil = () => {
    if (!silOnay) return setSilOnay(true);
    aktif.l.forEach((u) => { if (u.durum === "kuyrukta" || u.durum === "isleniyor") uretimIptal(u.id); uretimSil(u.id); });
    setSilOnay(false); onSilindi();
    toast.success("Set silindi");
  };
  const metniKopyala = async () => {
    try { await navigator.clipboard.writeText(gonderiMetni); toast.success("Gönderi metni kopyalandı"); } catch { toast.error("Kopyalanamadı"); }
  };
  const kareKutusu = (u: Uretim, i: number) => {
    const suruyor = u.durum === "kuyrukta" || u.durum === "isleniyor";
    const [w, h] = String(u.meta?.oran ?? "4:5").split(":").map(Number);
    const kadraj = String(u.baslik).split(" · ")[1] ?? "";
    return (
      <motion.div key={u.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25, delay: Math.min(i, 10) * 0.02 }} className="relative">
        {suruyor ? (
          <div className="relative overflow-hidden rounded-[16px] bg-[#121214] ring-1 ring-inset ring-white/[0.08]" style={{ aspectRatio: String(kartOrani(galeri, (w || 4) / (h || 5))) }}>
            <UretimYukleniyor u={u} siraNo={uretimSirasi(u.id) || undefined} onIptal={() => uretimIptal(u.id)} etiket={`${String(i + 1).padStart(2, "0")} · ${kadraj}`} ozet="" />
          </div>
        ) : <SonucKarti u={u} onAc={() => setSecili(u.id)} demoGizle oran={galeri.yerlesim === "ozgun" ? undefined : kartOrani(galeri, 1)}
          onSil={() => { uretimSil(u.id); mesaj.silindi("Kare", () => useProjeler.setState((s) => ({ uretimler: [u, ...s.uretimler] }))); }} />}
        {!suruyor && <span className="pointer-events-none absolute left-2 top-2 z-10 rounded-full bg-black/60 px-2 py-0.5"><span className="text-[11px] font-semibold tabular-nums text-white/90">{String(i + 1).padStart(2, "0")}{kadraj && ` · ${kadraj}`}</span></span>}
        {i === 0 && u.durum === "tamam" && <span className="pointer-events-none absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#0a0a0b]"><Star className="h-3 w-3" />{kapakEtiket}</span>}
      </motion.div>
    );
  };


  return (
    <>
    <div>
      <section className={KART}>
        <div className={cn(SERIT, "flex-wrap gap-3 py-3")}>
          <span className="h-11 w-11 shrink-0 overflow-hidden rounded-[12px] bg-white/10 ring-1 ring-white/15">{(() => { const g0 = aktif.l.map(uretimGorseli).find(Boolean); return g0 ? <img src={g0} alt="" className="h-full w-full object-cover" /> : setAvatar(aktif.l[0]); })()}</span>
          <div className="min-w-0 flex-1 max-sm:basis-[calc(100%-3.25rem)]">
            <p className="truncate text-[16px] font-semibold text-metin">{aktif.l[0].meta?.pano ?? aktif.l[0].baslik.split(" · ")[0]}</p>
            <p className="truncate text-[12.5px] text-metin-3">{aktif.l.length} kare · {aktif.l[0].model} · {new Date(aktif.l[0].olusturma).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          {hazirSayi < aktif.l.length ? (
            <span className={cn(HAP, "gap-2")} aria-live="polite"><Loader2 className="h-3.5 w-3.5 animate-spin" />{hazirSayi}/{aktif.l.length} hazır
              <span className="h-1 w-16 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-white transition-[width] duration-500" style={{ width: `${(hazirSayi / aktif.l.length) * 100}%` }} /></span>
            </span>
          ) : null}
          {sosyal && <Kayan id="gorunum" etiket="Görünüm" deger={gorunum} onDeger={setGorunum} secenekler={[
            { v: "izgara", a: <><LayoutGrid className="h-3.5 w-3.5" />Izgara</> }, { v: "gonderi", a: <><GalleryHorizontal className="h-3.5 w-3.5" />Gönderi</> }, { v: "profil", a: <><Grid3x3 className="h-3.5 w-3.5" />Profil</> },
          ]} />}
          {gorunum === "izgara" && <GorunumAyari sayfa={galeriSayfa} istemVar={false} siralamaVar={false} />}
          <button onClick={() => void topluIndir(`vayra-${arac.toLocaleLowerCase("tr")}`, aktif.l)} disabled={!hazirSayi}
            className="flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-[#0a0a0b] transition-colors active:scale-[0.97] disabled:bg-white/[0.06] disabled:text-metin-3 disabled:ring-1 disabled:ring-inset disabled:ring-white/[0.08]"><Download className="h-4 w-4" />ZIP indir</button>
          <button onClick={setiSil} onBlur={() => setSilOnay(false)} title="Seti sil"
            className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors active:scale-[0.97]", silOnay ? "bg-rose-500/15 text-rose-200 ring-1 ring-inset ring-rose-400/40" : "text-metin-3 hover:bg-white/[0.06] hover:text-metin")}>
            <Trash2 className="h-4 w-4" />{silOnay ? "Emin misin?" : <span className="sr-only">Seti sil</span>}
          </button>
        </div>
        <div className="p-4" ref={alanRef}>
          {gorunum === "izgara" ? (
            aktif.l.length <= 4 ? (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className={cn("grid gap-3", aktif.l.length === 1 ? "grid-cols-1 sm:max-w-[420px]" : aktif.l.length === 2 ? "grid-cols-2" : aktif.l.length === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 md:grid-cols-4")}><AnimatePresence initial={false}>{aktif.l.map(kareKutusu)}</AnimatePresence></div>
                <aside className="space-y-2 self-start rounded-[18px] bg-white/[0.025] p-2.5 ring-1 ring-inset ring-white/[0.07] lg:sticky lg:top-4">
                  <p className="px-1 pb-0.5 pt-1 text-[13px] font-semibold text-metin">Set özeti</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {([["Kare", `${aktif.l.length}`], ["Hazır", `${hazirSayi}/${aktif.l.length}`], ["Model", aktif.l[0].model], ["Oran", String(aktif.l[0].meta?.oran ?? "3:4")]] as const).map(([e, v]) => (
                      <span key={e} className="rounded-[12px] bg-white/[0.03] px-3 py-2 leading-tight ring-1 ring-inset ring-white/[0.05]"><span className="block text-[11px] text-metin-3">{e}</span><span className="mt-0.5 block truncate text-[13px] font-semibold tabular-nums text-metin">{v}</span></span>
                    ))}
                  </div>
                  <p className="rounded-[12px] bg-white/[0.03] px-3 py-2.5 text-[12px] leading-snug text-metin-2 ring-1 ring-inset ring-white/[0.05]">Bir kareyi açıp {kapakEtiket.toLocaleLowerCase("tr")} yapabilir, yeniden üretebilir ya da videoya çevirebilirsin.</p>
                </aside>
              </div>
            ) : (
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${gorunumSutun(alanEn, galeri)}, minmax(0, 1fr))` }}><AnimatePresence initial={false}>{aktif.l.map(kareKutusu)}</AnimatePresence></div>
            )
          ) : (
            <div className="grid items-start justify-center gap-6 lg:grid-cols-[minmax(0,440px)_320px]">
              {gorunum === "gonderi"
                ? <IgGonderi liste={aktif.l} avatar={setAvatar(aktif.l[0])} metin={gonderiMetni} onAc={setSecili} />
                : <IgProfil liste={aktif.l} avatar={setAvatar(aktif.l[0])} baslik={aktif.l[0].meta?.pano ?? arac} onAc={setSecili} />}
              {gorunum === "gonderi" ? (
              <div className="rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] lg:sticky lg:top-4">
                <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-3">
                  <h3 className="text-[13.5px] font-semibold text-metin">Gönderi metni</h3>
                  <span className="ml-auto rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-metin-3">Hazır öneri</span>
                </div>
                <div className="p-4">
                  <p className="text-[12.5px] leading-snug text-metin-3">Önizlemedeki metin pakete göre önerildi. Beğenmezsen başka öneri al.</p>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => setMetinNo((n) => n + 1)} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-white/[0.07] text-[13px] font-medium text-metin ring-1 ring-inset ring-white/[0.1] hover:bg-white/[0.11] active:scale-[0.97]"><Shuffle className="h-3.5 w-3.5" />Başka öneri</button>
                    <button onClick={() => void metniKopyala()} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-semibold text-[#0a0a0b] active:scale-[0.97]"><Copy className="h-3.5 w-3.5" />Kopyala</button>
                  </div>
                  <p className="mt-3 text-[12px] leading-snug text-metin-3">Karusel sırası ızgaradaki sıradır. Bir kareyi açıp “Kapak yap” ile ilk sıraya al.</p>
                </div>
              </div>
              ) : (
              <div className="rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] lg:sticky lg:top-4">
                <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-3">
                  <h3 className="text-[13.5px] font-semibold text-metin">Profilin üst satırı</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-[2px] overflow-hidden rounded-[10px]">
                    {aktif.l.slice(0, 3).map((u) => { const g = uretimGorseli(u); return <span key={u.id} className="relative aspect-[3/4] bg-white/[0.06]">{g && u.durum === "tamam" && <img src={g} alt="" className="absolute inset-0 h-full w-full object-cover" />}</span>; })}
                  </div>
                  <p className="mt-3 text-[12.5px] leading-snug text-metin-3">Profile girenin ilk gördüğü 3 kare. Yıldızlı kare kapak; bir kareyi açıp “Kapak yap” ile değiştir.</p>
                  <button onClick={() => setGorunum("gonderi")} className="mt-4 flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-white/[0.07] text-[13px] font-medium text-metin ring-1 ring-inset ring-white/[0.1] hover:bg-white/[0.11] active:scale-[0.97]"><GalleryHorizontal className="h-3.5 w-3.5" />Gönderi olarak gör</button>
                </div>
              </div>
              )}
            </div>
          )}
        </div>
      </section>

      {setler.length > 1 && (
        <section className={cn(KART, "mt-4")}>
          <div className={SERIT}><h2 className="text-[14px] font-semibold text-metin">{oncekiBaslik}</h2><span className="tabular-nums text-[12.5px] text-metin-3">{setler.length - 1}</span></div>
          <div className="grid gap-2.5 p-3 sm:grid-cols-2 xl:grid-cols-3">
            {setler.filter((s) => s.id !== aktif.id).map((s, j) => {
              const g = s.l.map(uretimGorseli).filter(Boolean) as string[];
              const ad = String(s.l[0].meta?.pano ?? s.l[0].baslik.split(" · ")[0]);
              const fazla = Math.max(0, g.length - 5);
              return (
                <motion.button key={s.id} onClick={() => onAktif(s.id)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * j }}
                  className="group flex flex-col gap-3 rounded-[18px] bg-white/[0.025] p-2.5 text-left ring-1 ring-inset ring-white/[0.07] transition-[background-color,box-shadow] hover:bg-white/[0.05] hover:ring-white/25 active:scale-[0.99]">
                  <span className="grid grid-cols-5 gap-1">
                    {g.slice(0, 5).map((x, i) => (
                      <span key={i} className="relative block aspect-[3/4] overflow-hidden rounded-[10px] bg-white/[0.04]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={x} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                        {i === 4 && fazla > 0 && <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-[13px] font-semibold tabular-nums text-white">+{fazla}</span>}
                      </span>
                    ))}
                  </span>
                  <span className="flex items-center gap-3 px-1 pb-0.5">
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-[14px] font-semibold text-metin">{ad}</span>
                      <span className="mt-0.5 block text-[12px] tabular-nums text-metin-3">{s.l.length} kare · {new Date(s.l[0].olusturma).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}</span>
                    </span>
                    <span className="flex h-8 shrink-0 items-center rounded-full bg-white/[0.07] px-3 text-[12px] font-medium text-metin transition-colors group-hover:bg-white group-hover:text-black">Aç</span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        </section>
      )}
    </div>

      <AnimatePresence>{secili && <SonucGoruntuleyici liste={aktif.l.filter((u) => u.durum === "tamam" || u.durum === "hata")} id={secili} onSec={setSecili} onKapat={() => setSecili(null)}
        ekEylem={(u) => (
          <div className="space-y-1.5" data-goruntuleyici>
            {ekEylem?.(u, () => setSecili(null))}
            <button onClick={() => kapakYap(u)} className="flex w-full items-center gap-3 rounded-[14px] bg-white/[0.03] p-2.5 text-left ring-1 ring-inset ring-white/[0.06] transition hover:bg-white/[0.07] active:scale-[0.99] disabled:opacity-40">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-metin-2"><Star className="h-4 w-4" /></span><span className="flex-1 text-[13px] font-semibold text-metin">{kapakEtiket} yap</span>
            </button>
            <button onClick={() => kareYenile(u)} className="flex w-full items-center gap-3 rounded-[14px] bg-white/[0.03] p-2.5 text-left ring-1 ring-inset ring-white/[0.06] transition hover:bg-white/[0.07] active:scale-[0.99] disabled:opacity-40">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-metin-2"><RefreshCw className="h-4 w-4" /></span><span className="flex-1 text-[13px] font-semibold text-metin">Bu kareyi yeniden üret</span>
              {b.bagli(gorselModelBul(u.model)) !== false && <span className="flex items-center gap-1 text-[12px] tabular-nums text-metin-3"><KrediYildiz className="h-3 w-3" />{krediYaz(modelKredi(gorselModelBul(u.model)))}</span>}
            </button>
          </div>
        )} />}</AnimatePresence>
    </>
  );
}
