"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { AtSign, Camera, Check, Clapperboard, Copy, GripVertical, ImageIcon, Loader2, Palette, Plus, Sparkles, Sun, Trash2, Video } from "lucide-react";
import { useProje, type Cekim, type Proje } from "@/store/useSinema";
import { useProjeler } from "@/store/useProjeler";
import { useElements } from "@/store/useElements";
import { MODELLER } from "@/lib/catalog";
import { sahneUret } from "./sahneUret";
import { toast } from "@/lib/toast";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { KrediJeton } from "@/components/ui/KrediHap";
import { gorece } from "@/components/panel/projeler/projeVeri";
import { ALT, BEYAZ, GRI, Hap, KART, Medya, SERIT, ease, yay, sahneDurumu } from "./ortak";
import { cn } from "@/lib/utils";

const HAREKET = ["Statik", "Yavaş takip", "Yaklaş", "Uzaklaş", "Kaydırma", "Yörünge", "Vinç yukarı", "Drone", "Omuz üstü", "El kamerası"];
const ISIK = ["Doğal gün ışığı", "Altın saat", "Gece, neon", "Ters ışık", "Stüdyo, yumuşak", "Karanlık, tek kaynak"];
const SURE = [3, 4, 5, 6, 8, 10];
const VIDEO = MODELLER.filter((m) => m.tur === "video").slice(0, 8);
const GORSEL = MODELLER.filter((m) => m.tur === "gorsel").slice(0, 8);

/** Boş storyboard için hazır akışlar: tıklayınca taslak sahneler eklenir (kareler örnek). */
const HAZIR_AKISLAR = [
  { ad: "Kısa film açılışı", kareler: ["/gercek/kesfet/neon-sehir-turuveo-3-1.webp", "/gercek/kesfet/cyberpunk-sokak-yagmurusora-2.webp", "/gercek/element/kael-portre.webp"],
    sahneler: [{ baslik: "Açılış", istem: "Gece şehrin geniş planı, ince yağmur, ışıklar ıslak zeminde yansıyor", kamera: "Drone", sure: 6 }, { baslik: "Karakter girişi", istem: "Karakter kalabalığın içinden kameraya doğru yürür", kamera: "Takip", sure: 5 }, { baslik: "Yakın plan", istem: "Karakterin yüzü yakın plan, gözlerinde yansımalar", kamera: "Dolly in", sure: 4 }] },
  { ad: "Ürün reklamı", kareler: ["/gercek/galeri/urun3.webp", "/gercek/galeri/urun1.webp", "/gercek/galeri/urun5.webp"],
    sahneler: [{ baslik: "Kanca", istem: "Ürün karanlıktan ışığa çıkar, yavaş dönüş", kamera: "Orbit", sure: 4 }, { baslik: "Detay", istem: "Ürünün dokusu makro çekimde, yumuşak ışık", kamera: "Makro", sure: 4 }, { baslik: "Kullanım", istem: "Ürün günlük bir anda kullanılıyor, doğal ışık", kamera: "Omuz kamerası", sure: 5 }, { baslik: "Kapanış", istem: "Ürün sade zeminde, marka alanı boş bırakılmış", kamera: "Statik", sure: 3 }] },
  { ad: "Müzik klibi", kareler: ["/gercek/sinema/ps-concert.webp", "/gercek/sinema/ps-rapflex.webp", "/gercek/muzik/ms-amp.webp"],
    sahneler: [{ baslik: "Sahne ışıkları", istem: "Sanatçı sahnede, arkadan güçlü spot ışıklar, duman", kamera: "Vinç", sure: 5 }, { baslik: "Performans", istem: "Sanatçı kameraya doğru şarkı söylüyor, ritimli hareket", kamera: "El kamerası", sure: 4 }, { baslik: "Vuruş", istem: "Nakaratta bas vuruşu, amfiden kıvılcımlar, ani yakınlaşma", kamera: "Crash zoom", sure: 3 }, { baslik: "Final", istem: "Sanatçı silüeti, kalabalık ve ışıklar, geniş plan", kamera: "Drone", sure: 6 }] },
];

export function Storyboard({ p, secili, onSec }: { p: Proje; secili?: string; onSec: (id?: string) => void }) {
  const { cekimEkle, cekimSil, cekimSirala, cekimGuncelle, uretimBagla, etkinlikEkle } = useProje.getState();
  const uretimler = useProjeler((s) => s.uretimler);
  const [surukle, setSurukle] = useState<string | null>(null);
  const aktif = p.cekimler.find((c) => c.id === secili) ?? p.cekimler[0];
  const toplam = p.cekimler.reduce((a, c) => a + (c.sure || 0), 0);
  const biten = p.cekimler.filter((c) => sahneDurumu(c) === "tamam").length;

  const ekle = () => { const id = cekimEkle(p.id, { sure: 5, hareket: "Statik" }); onSec(id); };
  const birak = (hedef: string) => {
    if (!surukle || surukle === hedef) return;
    const ids = p.cekimler.map((c) => c.id).filter((x) => x !== surukle);
    ids.splice(ids.indexOf(hedef), 0, surukle);
    cekimSirala(p.id, ids);
    setSurukle(null);
  };

  return (
    <div className="space-y-4">
      <section className={KART}>
        <header className={SERIT}>
          <h2 className="flex items-center gap-2 text-[16px] font-semibold text-white"><Clapperboard className="h-4 w-4 text-white/60" />Storyboard
            {p.cekimler.length > 0 && <Hap>{p.cekimler.length} sahne · {toplam} sn · {biten} bitti</Hap>}</h2>
          <button onClick={ekle} className={BEYAZ}><Plus className="h-4 w-4" />Sahne ekle</button>
        </header>
        {p.cekimler.length ? (
          <div className="p-3 sm:p-4">
            <LayoutGroup id="sahne-serit">
              <div className="gizli-scroll flex gap-2 overflow-x-auto pb-1">
                {p.cekimler.map((c, i) => (
                  <motion.button key={c.id} onClick={() => onSec(c.id)} draggable onDragStart={() => setSurukle(c.id)} onDragEnd={() => setSurukle(null)}
                    onDragOver={(e) => e.preventDefault()} onDrop={() => birak(c.id)} transition={yay}
                    className={cn("group w-[176px] shrink-0 overflow-hidden rounded-[16px] bg-white/[0.03] text-left outline outline-2 -outline-offset-2 ring-1 ring-inset ring-white/[0.06] transition-[outline-color,opacity]",
                      c.id === aktif?.id ? "outline-white" : "outline-transparent", surukle === c.id && "opacity-40")}>
                    <span className="relative block aspect-video overflow-hidden bg-white/[0.04]">
                      {c.gorselUrl || c.videoUrl ? <Medya gorsel={c.gorselUrl} video={c.videoUrl} className="h-full w-full object-cover" /> : <span className="absolute inset-0 flex items-center justify-center text-[12px] text-white/45">Henüz üretilmedi</span>}
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white backdrop-blur">{i + 1}</span>
                      <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[11px] tabular-nums text-white backdrop-blur">{c.sure} sn</span>
                      <GripVertical className="absolute right-1.5 top-1.5 h-4 w-4 text-white/70 opacity-0 transition group-hover:opacity-100" />
                      {sahneDurumu(c) === "uretiliyor" && <span className="absolute inset-0 flex items-center justify-center bg-black/45"><Loader2 className="h-6 w-6 animate-spin text-[#55d6fd]" /></span>}
                    </span>
                    <span className="block px-2.5 py-2">
                      <span className="block truncate text-[13px] font-medium text-white">{c.baslik}</span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-white/55">{sahneDurumu(c) === "tamam" ? <><Check className="h-3 w-3" />Bitti</> : sahneDurumu(c) === "uretiliyor" ? "Üretiliyor" : "Taslak"}<span className="text-white/30">·</span><span className="truncate">{c.hareket}</span></span>
                    </span>
                  </motion.button>
                ))}
                <button onClick={ekle} className="flex w-[120px] shrink-0 flex-col items-center justify-center gap-2 rounded-[16px] bg-white/[0.02] text-[12.5px] text-white/70 ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.05]"><Plus className="h-5 w-5" />Sahne ekle</button>
              </div>
            </LayoutGroup>
            <div className="mt-3 flex h-8 items-stretch gap-[3px] overflow-hidden rounded-[10px]">
              {p.cekimler.map((c, i) => (
                <button key={c.id} onClick={() => onSec(c.id)} style={{ flex: Math.max(1, c.sure) }} title={c.baslik}
                  className={cn("min-w-0 truncate px-1 text-[11.5px] tabular-nums transition", c.id === aktif?.id ? "bg-white text-black" : sahneDurumu(c) === "tamam" ? "bg-white/[0.14] text-white/80" : sahneDurumu(c) === "uretiliyor" ? "bg-[#55d6fd]/25 text-white" : "bg-white/[0.05] text-white/50")}>
                  {i + 1} · {c.sure} sn
                </button>
              ))}
            </div>
            <p className="mt-2 px-0.5 text-[12px] text-white/45">Sırayı değiştirmek için sahneyi sürükleyip başka bir sahnenin üstüne bırak.</p>
          </div>
        ) : (
          <div>
            <div className="grid gap-2 p-3 sm:grid-cols-3 sm:p-4">
              {HAZIR_AKISLAR.map((a, i) => (
                <motion.button key={a.ad} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => { let ilk: string | undefined; for (const s of a.sahneler) { const id = cekimEkle(p.id, { baslik: s.baslik, istem: s.istem, hareket: s.kamera, sure: s.sure }); ilk ??= id; } onSec(ilk); toast.success(`${a.sahneler.length} taslak sahne eklendi`, { description: "İstemleri düzenleyip tek tek üretebilirsin." }); }}
                  className="group overflow-hidden rounded-[18px] bg-white/[0.03] text-left ring-1 ring-inset ring-white/[0.07] transition hover:bg-white/[0.06]">
                  <span className="grid grid-cols-3 gap-[2px]">
                    {a.kareler.map((k) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={k} src={k} alt="" className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:brightness-110" />
                    ))}
                  </span>
                  <span className="flex items-end justify-between gap-2 p-3">
                    <span><span className="block text-[14px] font-semibold text-white">{a.ad}</span><span className="block text-[12.5px] text-white/55">{a.sahneler.map((s) => s.baslik).join(", ")}</span></span>
                    <span className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black transition group-hover:translate-x-0.5"><Plus className="h-3.5 w-3.5" />{a.sahneler.length} sahne</span>
                  </span>
                </motion.button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] px-4 py-3 sm:px-5">
              <p className="min-w-0 flex-1 text-[12.5px] text-white/55">Kareler örnek. Hazır akış taslak sahneler ekler; boş bir sahneyle de başlayabilir ya da planı yönetmene bırakabilirsin.</p>
              <Link href={`/panel/projeler/${p.id}?s=yonetmen`} className={GRI}><Sparkles className="h-4 w-4" />Yönetmenden plan iste</Link>
              <button onClick={ekle} className={BEYAZ}><Plus className="h-4 w-4" />Boş sahne</button>
            </div>
          </div>
        )}
      </section>

      <AnimatePresence mode="wait">
        {aktif && (
          <SahneEditoru key={aktif.id} p={p} c={aktif} sira={p.cekimler.indexOf(aktif) + 1}
            onSil={() => { const kalan = p.cekimler.filter((x) => x.id !== aktif.id); cekimSil(p.id, aktif.id); onSec(kalan[0]?.id); toast(`"${aktif.baslik}" silindi`); }}
            onCogalt={() => { const id = cekimEkle(p.id, { baslik: `${aktif.baslik} (kopya)`, istem: aktif.istem, sure: aktif.sure, hareket: aktif.hareket, isik: aktif.isik, palet: aktif.palet, model: aktif.model, elementler: aktif.elementler }); onSec(id); }}
            onUret={(tur, model) => { sahneUret(p, aktif, tur, model); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

function SahneEditoru({ p, c, sira, onSil, onCogalt, onUret }: { p: Proje; c: Cekim; sira: number; onSil: () => void; onCogalt: () => void; onUret: (tur: "video" | "gorsel", model: string) => void }) {
  const guncelle = (patch: Partial<Cekim>) => useProje.getState().cekimGuncelle(p.id, c.id, patch);
  const elementler = useElements((s) => s.elementler);
  const projeEl = useMemo(() => {
    const ad = new Set((p.elementler ?? []).map((e) => e.ad.toLocaleLowerCase("tr")));
    const l = elementler.filter((e) => e.projeId === p.id || ad.has(e.ad.toLocaleLowerCase("tr")));
    return l.length ? l : elementler.slice(0, 6);
  }, [elementler, p]);
  const varsayilanTur: "video" | "gorsel" = c.model && MODELLER.find((m) => m.id === c.model)?.tur === "gorsel" ? "gorsel" : "video";
  const [tur, setTur] = useState<"video" | "gorsel">(varsayilanTur);
  const liste = tur === "video" ? VIDEO : GORSEL;
  const [model, setModel] = useState(c.model && liste.some((m) => m.id === c.model) ? c.model : liste[0]?.id);
  useEffect(() => { if (!liste.some((m) => m.id === model)) setModel(liste[0]?.id); }, [tur, liste, model]);
  const m = MODELLER.find((x) => x.id === model);
  const istemRef = useRef<HTMLTextAreaElement>(null);
  const [gosterilen, setGosterilen] = useState(0);
  const surumler = (c.surumler ?? []).filter((s) => s.gorselUrl || s.videoUrl);
  const sec = surumler[gosterilen];
  const gorsel = sec?.gorselUrl ?? c.gorselUrl;
  const video = sec?.videoUrl ?? c.videoUrl;
  const elEkle = (ad: string) => {
    const t = `@${ad} `;
    const el = istemRef.current;
    const pos = el?.selectionStart ?? c.istem.length;
    const yeni = c.istem.slice(0, pos) + (pos && !/\s$/.test(c.istem.slice(0, pos)) ? " " : "") + t + c.istem.slice(pos);
    guncelle({ istem: yeni, elementler: Array.from(new Set([...(c.elementler ?? []), ad])) });
    requestAnimationFrame(() => el?.focus());
  };

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease }} className={cn(KART, "grid xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]")}>
      <div className="relative min-h-[300px] bg-white/[0.03] xl:min-h-[520px]">
        {video ? <video key={video} src={video} poster={gorsel} controls={false} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
          // eslint-disable-next-line @next/next/no-img-element
          : gorsel ? <img src={gorsel} alt="" className="absolute inset-0 h-full w-full object-cover" />
          : (
            /* Taslak: boş kutu yerine sahnenin kendisi (istem, kamera, süre) bir senaryo kartında + üret düğmesi */
            <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(85,214,253,0.08),transparent_60%)] p-5">
              <div className="w-full max-w-[440px] overflow-hidden rounded-[20px] bg-[#141517] ring-1 ring-inset ring-white/[0.08]">
                <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
                  <span className="flex items-center gap-2 text-[13px] font-medium text-white"><Clapperboard className="h-4 w-4 text-white/60" />Taslak sahne</span>
                  <span className="text-[12px] text-white/50">{c.hareket || "Kamera seçilmedi"} · {c.sure} sn</span>
                </div>
                <p className={cn("line-clamp-5 px-4 py-3.5 text-[14.5px] leading-relaxed", c.istem.trim() ? "text-white/90" : "text-white/45")}>{c.istem.trim() || "İstem boş. Sağdaki alana sahnede ne olacağını yaz."}</p>
                <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] px-4 py-2.5">
                  <span className="flex min-w-0 items-center gap-1.5 truncate text-[12px] text-white/55">{m && <ModelLogo ad={m.ad} boyut={12} />}{m?.ad}</span>
                  <span className="shrink-0 text-[12px] text-white/50">Henüz üretilmedi</span>
                </div>
              </div>
            </div>
          )}
        {sahneDurumu(c) === "uretiliyor" && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 backdrop-blur-sm"><Loader2 className="h-7 w-7 animate-spin text-[#55d6fd]" /><p className="text-[13.5px] text-white">Sahne üretiliyor</p><p className="text-[12px] text-white/60">Bitince yeni sürüm olarak eklenir; bu sayfadan ayrılabilirsin.</p></div>}
        <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[11.5px] font-medium text-white ring-1 ring-inset ring-white/15 backdrop-blur-xl">Sahne {sira} · {c.sure} sn</span>
        {surumler.length > 0 && (
          <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-1.5">
            <LayoutGroup id={`surum-${c.id}`}>
              {surumler.map((s, i) => (
                <button key={s.id} onClick={() => setGosterilen(i)} title={gorece(s.zaman) || "az önce"}
                  className={cn("relative rounded-full px-2.5 py-1 text-[12px] font-medium backdrop-blur-xl", gosterilen === i ? "text-black" : "bg-black/45 text-white ring-1 ring-inset ring-white/15")}>
                  {gosterilen === i && <motion.span layoutId={`surum-z-${c.id}`} className="absolute inset-0 rounded-full bg-white" transition={yay} />}
                  <span className="relative">v{surumler.length - i}</span>
                </button>
              ))}
            </LayoutGroup>
            {gosterilen > 0 && sec && <button onClick={() => { guncelle({ gorselUrl: sec.gorselUrl, videoUrl: sec.videoUrl }); toast.success(`v${surumler.length - gosterilen} sahnenin ana sürümü yapıldı`); }} className="ml-auto rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-black">Bunu kullan</button>}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col">
        <header className={SERIT}>
          <input value={c.baslik} onChange={(e) => guncelle({ baslik: e.target.value.slice(0, 60) })} aria-label="Sahne adı"
            className="min-w-0 flex-1 rounded-[10px] bg-transparent px-1 py-0.5 text-[17px] font-semibold text-white outline-none transition focus:bg-white/[0.05]" />
          <div className="flex gap-1">
            <button onClick={onCogalt} aria-label="Sahneyi çoğalt" title="Çoğalt" className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/[0.07] hover:text-white"><Copy className="h-4 w-4" /></button>
            <button onClick={onSil} aria-label="Sahneyi sil" title="Sil" className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:bg-rose-500/15 hover:text-rose-200"><Trash2 className="h-4 w-4" /></button>
          </div>
        </header>
        <div className="flex-1 space-y-3 p-4 sm:p-5">
          <div className="rounded-[16px] bg-[#0d0e10] ring-1 ring-inset ring-white/[0.06] focus-within:ring-white/20">
            <textarea ref={istemRef} value={c.istem} onChange={(e) => guncelle({ istem: e.target.value })} rows={4} placeholder="Bu sahnede ne oluyor? Örneğin: @Kael yağmurlu sokakta kameraya doğru yürür"
              className="w-full resize-none bg-transparent px-3.5 pt-3 text-[14px] leading-relaxed text-white outline-none placeholder:text-white/40" />
            <div className="gizli-scroll flex gap-1.5 overflow-x-auto px-2.5 pb-2.5">
              {projeEl.map((e) => (
                <button key={e.id} onClick={() => elEkle(e.ad)} className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.06] pl-1 pr-3 text-[12.5px] text-white/85 transition hover:bg-white/[0.1]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {e.gorseller[0] ? <img src={e.gorseller[0]} alt="" className="h-6 w-6 rounded-full object-cover" /> : <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.08]"><AtSign className="h-3 w-3" /></span>}@{e.ad}
                </button>
              ))}
            </div>
          </div>
          <Secim ikon={Camera} ad="Kamera" deger={c.hareket} secenek={HAREKET} onSec={(v) => guncelle({ hareket: v })} />
          <Secim ikon={Sun} ad="Işık" deger={c.isik} secenek={ISIK} onSec={(v) => guncelle({ isik: v })} />
          <label className="flex items-center gap-3 rounded-[14px] px-3.5 py-2.5 ring-1 ring-inset ring-white/[0.06]">
            <span className="flex w-24 shrink-0 items-center gap-2 text-[13px] text-white/60"><Palette className="h-4 w-4" />Renk</span>
            <input value={c.palet ?? ""} onChange={(e) => guncelle({ palet: e.target.value.slice(0, 60) })} placeholder="Örneğin: neon camgöbeği ve macenta" className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/35" />
          </label>
          <div className="flex items-center gap-3 rounded-[14px] px-3.5 py-2.5 ring-1 ring-inset ring-white/[0.06]">
            <span className="w-24 shrink-0 text-[13px] text-white/60">Süre</span>
            <LayoutGroup id={`sure-${c.id}`}>
              <div className="flex flex-wrap gap-1">
                {SURE.map((s) => (
                  <button key={s} onClick={() => guncelle({ sure: s })} className={cn("relative h-8 rounded-full px-3 text-[12.5px] tabular-nums", c.sure === s ? "text-black" : "text-white/70 hover:text-white")}>
                    {c.sure === s && <motion.span layoutId={`sure-z-${c.id}`} className="absolute inset-0 rounded-full bg-white" transition={yay} />}<span className="relative">{s} sn</span>
                  </button>
                ))}
              </div>
            </LayoutGroup>
          </div>
          <div className="rounded-[14px] p-1 ring-1 ring-inset ring-white/[0.06]">
            <div className="flex gap-1 p-1">
              {([["video", "Video", Video], ["gorsel", "Görsel", ImageIcon]] as const).map(([k, ad, I]) => (
                <button key={k} onClick={() => setTur(k)} className={cn("flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full text-[12.5px] font-medium transition", tur === k ? "bg-white text-black" : "text-white/70 hover:bg-white/[0.05]")}><I className="h-3.5 w-3.5" />{ad}</button>
              ))}
            </div>
            <div className="gizli-scroll flex gap-1.5 overflow-x-auto p-1 pr-6 [mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)]">
              {liste.map((x) => (
                <button key={x.id} onClick={() => setModel(x.id)} className={cn("flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] transition", model === x.id ? "bg-white/[0.14] text-white ring-1 ring-inset ring-white/40" : "bg-white/[0.04] text-white/75 hover:bg-white/[0.08]")}>
                  <ModelLogo ad={x.ad} boyut={14} />{x.ad}<span className="tabular-nums text-white/45">{x.kredi}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <footer className={ALT}>
          <span className="text-[12.5px] text-white/55">{c.istem.trim() ? "Sonuç bu sahneye yeni sürüm olarak eklenir" : "Üretmek için önce sahnede ne olduğunu yaz"}</span>
          <button disabled={!c.istem.trim() || sahneDurumu(c) === "uretiliyor" || !m} onClick={() => m && onUret(tur, m.id)} className={cn(BEYAZ, "h-10 px-4 text-[13.5px]")}>
            {sahneDurumu(c) === "uretiliyor" ? <Loader2 className="h-4 w-4 animate-spin" /> : <KrediJeton boyut={13} />}{m?.kredi ?? 0} · {c.surumler?.length ? "Yeniden üret" : "Sahneyi üret"}
          </button>
        </footer>
      </div>
    </motion.section>
  );
}

function Secim({ ikon: I, ad, deger, secenek, onSec }: { ikon: React.ElementType; ad: string; deger?: string; secenek: string[]; onSec: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] px-3.5 py-2 ring-1 ring-inset ring-white/[0.06]">
      <span className="flex w-24 shrink-0 items-center gap-2 text-[13px] text-white/60"><I className="h-4 w-4" />{ad}</span>
      <div className="gizli-scroll flex min-w-0 flex-1 gap-1 overflow-x-auto pr-6 [mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)]">
        {secenek.map((s) => (
          <button key={s} onClick={() => onSec(s)} className={cn("h-8 shrink-0 rounded-full px-3 text-[12.5px] transition", deger === s ? "bg-white font-medium text-black" : "bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white")}>{s}</button>
        ))}
      </div>
    </div>
  );
}

