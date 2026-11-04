"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AtSign, Check, ChevronDown, Copy, Download, Folder, MoreHorizontal, Pencil, Pin, PinOff, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Yuzen } from "@/components/ui/Yuzen";
import { useElements, type ElementTur, type VElement } from "@/store/useElements";
import { useSinema } from "@/store/useSinema";
import { useProjeler } from "@/store/useProjeler";
import { TUR_META, TUR_SIRA, SIRALAMALAR, sirala, ElementKapak, TurRozeti, elementiCogalt, elementiIndir, elementiSil, type Siralama } from "./elementMeta";

export type Kapsam = { tip: "tumu" } | { tip: "sabit" } | { tip: "tur"; tur: ElementTur } | { tip: "proje"; projeId: string };

/**
 * Element kütüphanesi — /panel/element sayfası ve seçici pencere aynı bileşeni kullanır.
 *  • sayfa: karta tıklayınca detay; "Kullan" bir stüdyoya götürür.
 *  • secici: kartlar seçilir (çoklu), alttaki çubuktan istemde kullanılır.
 */
export function ElementKutuphanesi({ mod, onDetay, onYeni, onDuzenle, onKullan, secili, onSecimDegis }: {
  mod: "sayfa" | "secici";
  onDetay: (e: VElement) => void;
  onYeni: (kapsam: Kapsam) => void;
  onDuzenle: (e: VElement) => void;
  onKullan?: (e: VElement) => void;
  secili?: string[];
  onSecimDegis?: (idler: string[]) => void;
}) {
  const elementler = useElements((s) => s.elementler);
  const guncelle = useElements((s) => s.guncelle);
  const projeler = useSinema((s) => s.projeler);
  const [kapsam, setKapsam] = useState<Kapsam>({ tip: "tumu" });
  const [ara, setAra] = useState("");
  const [siralama, setSiralama] = useState<Siralama>("olusturma");
  const [siraAcik, setSiraAcik] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const projeKapsamlari = useMemo(() => {
    const say = new Map<string, number>();
    for (const e of elementler) if (e.projeId) say.set(e.projeId, (say.get(e.projeId) ?? 0) + 1);
    return projeler.filter((p) => say.has(p.id)).map((p) => ({ id: p.id, ad: p.ad, n: say.get(p.id)! }));
  }, [elementler, projeler]);

  const gorunen = useMemo(() => {
    const q = ara.trim().toLocaleLowerCase("tr");
    const l = elementler.filter((e) =>
      (kapsam.tip === "tumu" || (kapsam.tip === "sabit" && e.sabitli) || (kapsam.tip === "tur" && e.tur === kapsam.tur) || (kapsam.tip === "proje" && e.projeId === kapsam.projeId))
      && (!q || `${e.ad} ${e.aciklama} ${TUR_META[e.tur].ad}`.toLocaleLowerCase("tr").includes(q)));
    return sirala(l, siralama);
  }, [elementler, kapsam, ara, siralama]);

  const kapsamAdi = kapsam.tip === "tumu" ? "Tüm elementler" : kapsam.tip === "sabit" ? "Sabitlenenler" : kapsam.tip === "tur" ? TUR_META[kapsam.tur].cogul : projeKapsamlari.find((p) => p.id === kapsam.projeId)?.ad ?? "Proje";
  const seciliMi = (id: string) => !!secili?.includes(id);
  const sec = (id: string) => onSecimDegis?.(seciliMi(id) ? secili!.filter((x) => x !== id) : [...(secili ?? []), id]);

  const kenar = (id: string, I: typeof Folder, ad: string, n: number, aktif: boolean, fn: () => void, _renk?: string) => (
    <button key={id} onClick={fn} aria-current={aktif || undefined}
      className={cn("relative isolate flex h-10 w-full items-center gap-2.5 rounded-[12px] px-2.5 text-left text-[13.5px] font-medium transition-colors active:scale-[0.99]", aktif ? "text-metin" : "text-metin-2 hover:bg-white/[0.04] hover:text-metin")}>
      {aktif && <motion.span layoutId={`el-kenar-${mod}`} className="absolute inset-0 -z-10 rounded-[12px] bg-white/[0.08] ring-1 ring-inset ring-white/[0.08]" transition={{ type: "spring", stiffness: 480, damping: 40 }} />}
      <I className={cn("h-4 w-4 shrink-0", aktif ? "text-metin" : "text-metin-3")} />
      <span className="min-w-0 flex-1 truncate">{ad}</span>
      {n > 0 && <span className={cn("rounded-full px-2 py-0.5 text-[11.5px] font-semibold tabular-nums", aktif ? "bg-white text-[#0a0a0b]" : "bg-white/[0.06] text-metin-3")}>{n}</span>}
    </button>
  );

  // Hiç element yokken: türleri tanıtan rehber.
  if (!elementler.length) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.1]"><AtSign className="h-7 w-7 text-metin" /></span>
        <h3 className="mt-5 text-[22px] font-bold tracking-[-0.02em] text-metin">İlk elementini oluştur</h3>
        <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-metin-2">Bir karakteri, mekânı, objeyi ya da stili bir kez tanımla; sonra her üretimde <b className="rounded-md bg-white/[0.08] px-1 font-semibold text-metin">@ad</b> yazarak çağır. Görseller destekleyen modellere referans olarak gider, böylece her sahnede aynı kalır.</p>
        <div className="mt-7 grid w-full gap-2.5 sm:grid-cols-4">
          {TUR_SIRA.map((t) => {
            const m = TUR_META[t]; const I = m.ikon;
            return (
              <button key={t} onClick={() => onYeni({ tip: "tur", tur: t })}
                className="group flex flex-col items-start gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-left transition-colors hover:border-white/[0.16] hover:bg-white/[0.045]">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${m.hex}22` }}><I className="h-[18px] w-[18px]" style={{ color: m.hex }} /></span>
                <span className="text-[14px] font-semibold text-metin">{m.ad}</span>
                <span className="text-[12px] leading-relaxed text-metin-3">{m.yuvalar.slice(0, 3).join(" · ")}</span>
                <span className="mt-1 flex items-center gap-1 text-[12px] font-medium text-metin opacity-0 transition-opacity group-hover:opacity-100">Oluştur <Plus className="h-3.5 w-3.5" /></span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1">
      {/* Kenar */}
      <nav className="hidden w-[220px] shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-white/[0.06] p-2.5 md:flex" aria-label="Element kapsamı">
        {kenar("tumu", AtSign, "Tüm elementler", elementler.length, kapsam.tip === "tumu", () => setKapsam({ tip: "tumu" }), "#6d6bff")}
        {kenar("sabit", Pin, "Sabitlenenler", elementler.filter((e) => e.sabitli).length, kapsam.tip === "sabit", () => setKapsam({ tip: "sabit" }))}
        <p className="mb-1.5 mt-4 border-t border-white/[0.06] px-2.5 pt-4 text-[12px] font-medium text-metin-3">Türler</p>
        {TUR_SIRA.map((t) => kenar(t, TUR_META[t].ikon, TUR_META[t].cogul, elementler.filter((e) => e.tur === t).length, kapsam.tip === "tur" && kapsam.tur === t, () => setKapsam({ tip: "tur", tur: t }), TUR_META[t].hex))}
        {projeKapsamlari.length > 0 && <p className="mb-1 mt-4 px-2.5 text-[12px] font-medium text-metin-3">Projeler</p>}
        {projeKapsamlari.map((p) => kenar(p.id, Folder, p.ad, p.n, kapsam.tip === "proje" && kapsam.projeId === p.id, () => setKapsam({ tip: "proje", projeId: p.id })))}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Üst çubuk */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] py-4 pl-6 pr-4 max-md:px-3 max-md:py-3">
          <h3 className="mr-auto flex min-w-0 items-center gap-2.5 text-[20px] font-semibold tracking-[-0.02em] text-metin max-md:text-[17px]">{kapsamAdi}{gorunen.length > 0 && <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11.5px] font-semibold tabular-nums text-metin-2">{gorunen.length}</span>}</h3>
          {/* Mobilde kapsam */}
          <select value={kapsam.tip === "tur" ? kapsam.tur : kapsam.tip} onChange={(e) => { const v = e.target.value; setKapsam(v === "tumu" || v === "sabit" ? { tip: v } : { tip: "tur", tur: v as ElementTur }); }}
            aria-label="Kapsam" className="glass-cip h-9 rounded-full bg-transparent px-3 text-[12.5px] text-metin outline-none md:hidden [&>option]:bg-yuzey">
            <option value="tumu">Tümü</option><option value="sabit">Sabitlenenler</option>
            {TUR_SIRA.map((t) => <option key={t} value={t}>{TUR_META[t].cogul}</option>)}
          </select>
          <label className="flex h-10 w-[240px] items-center gap-2 rounded-full bg-white/[0.06] px-3.5 transition-colors focus-within:bg-white/[0.09] focus-within:ring-1 focus-within:ring-inset focus-within:ring-white/20 max-md:order-last max-md:w-full">
            <Search className="h-4 w-4 shrink-0 text-metin-3" />
            <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Element ara" aria-label="Element ara" className="w-full min-w-0 bg-transparent text-[13.5px] text-metin outline-none placeholder:text-metin-3" />
            {ara && <button onClick={() => setAra("")} aria-label="Aramayı temizle"><X className="h-3.5 w-3.5 text-metin-3" /></button>}
          </label>
          <div className="relative">
            <button onClick={() => setSiraAcik((v) => !v)} aria-expanded={siraAcik} className="flex h-10 items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 text-[13px] font-medium text-metin-2 transition-colors hover:bg-white/[0.1] hover:text-metin">
              {SIRALAMALAR.find((s) => s.id === siralama)!.ad} <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <AnimatePresence>
              <Yuzen acik={siraAcik} onKapat={() => setSiraAcik(false)} ust="tam" sag={0} bosluk={6} etiket="Sıralama" className="menu-surface w-[180px] rounded-[12px] p-1">
                {SIRALAMALAR.map((s) => (
                  <button key={s.id} onClick={() => { setSiralama(s.id); setSiraAcik(false); }} className={cn("flex w-full items-center justify-between rounded-[9px] px-2.5 py-2 text-left text-[13px] hover:bg-white/6", siralama === s.id ? "font-semibold text-metin" : "text-metin-2")}>
                    {s.ad}{siralama === s.id && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </Yuzen>
            </AnimatePresence>
          </div>
          <button onClick={() => onYeni(kapsam)} className="flex h-10 items-center gap-1.5 rounded-full bg-white pl-3.5 pr-4 text-[13.5px] font-semibold text-[#0a0a0b] transition-transform active:scale-[0.97]">
            <Plus className="h-4 w-4" /> Yeni element
          </button>
        </div>

        {/* Izgara */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-width:thin]">
          {gorunen.length === 0 ? (
            <div className="py-16 text-center">
              <Search className="mx-auto h-6 w-6 text-metin-3" />
              <p className="mt-3 text-[14px] font-semibold text-metin">{ara ? `"${ara}" için element yok` : "Bu bölümde element yok"}</p>
              <div className="mt-3 flex justify-center gap-2">
                {ara && <button onClick={() => setAra("")} className="glass-cip rounded-full px-3 py-1.5 text-[12.5px] text-metin-2 hover:text-metin">Aramayı temizle</button>}
                <button onClick={() => onYeni(kapsam)} className="rounded-full bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-[#0a0a0b] active:scale-[0.97]">Yeni element</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {gorunen.map((e) => {
                const s = seciliMi(e.id);
                return (
                  <div key={e.id} className="group relative min-w-0" onMouseEnter={() => setHover(e.id)} onMouseLeave={() => setHover((h) => (h === e.id ? null : h))}>
                    <div className={cn("relative overflow-hidden rounded-[18px] ring-1 ring-inset transition-shadow", s ? "outline outline-2 -outline-offset-2 outline-white ring-transparent" : "ring-white/[0.07] group-hover:ring-white/20")}>
                      <button onClick={() => (mod === "secici" ? sec(e.id) : onDetay(e))} aria-pressed={mod === "secici" ? s : undefined}
                        aria-label={mod === "secici" ? `@${e.ad} ${s ? "seçimden çıkar" : "seç"}` : `@${e.ad} ayrıntı`} className="block w-full">
                        {e.gorseller.some(Boolean)
                          ? <ElementKapak e={e} oynat={hover === e.id} className="aspect-[4/5] w-full transition-transform duration-500 group-hover:scale-[1.03]" />
                          : (() => { const I = TUR_META[e.tur].ikon; return (
                            <span className="relative flex aspect-[4/5] w-full flex-col items-center justify-center gap-2.5 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.07),transparent_65%),#141416]">
                              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] text-metin-2 ring-1 ring-inset ring-white/[0.1]"><I className="h-5 w-5" /></span>
                              {mod === "sayfa" && <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] font-medium text-metin-3">Görsel yok</span>}
                            </span>
                          ); })()}
                        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                        <span className="pointer-events-none absolute inset-x-3 bottom-2.5 text-left">
                          <span className="block truncate text-[14.5px] font-semibold text-white">@{e.ad}</span>
                          <span className="block truncate text-[11.5px] text-white/65">{e.kullanim ? `${e.kullanim} üretimde kullanıldı` : e.aciklama || `${TUR_META[e.tur].ad} · ${e.gorseller.filter(Boolean).length} görsel`}</span>
                        </span>
                      </button>
                      {kapsam.tip !== "tur" && <span className="pointer-events-none absolute left-2 top-2"><TurRozeti tur={e.tur} kucuk /></span>}
                      {mod === "secici" ? (
                        <span className={cn("pointer-events-none absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors", s ? "border-white bg-white text-[#0a0a0b]" : "border-white/70 bg-black/30")}>
                          {s && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                        </span>
                      ) : (
                        <button onClick={() => guncelle(e.id, { sabitli: !e.sabitli })} aria-label={e.sabitli ? "Sabitlemeyi kaldır" : "Sabitle"} aria-pressed={!!e.sabitli}
                          className={cn("absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition-opacity hover:bg-black/70", e.sabitli ? "opacity-100" : "opacity-0 focus:opacity-100 group-hover:opacity-100")}>
                          {e.sabitli ? <Pin className="h-3.5 w-3.5 fill-current" /> : <Pin className="h-3.5 w-3.5" />}
                        </button>
                      )}
                      {mod === "secici" && (
                        <button onClick={() => onDetay(e)} className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/75 focus:opacity-100 group-hover:opacity-100">Ayrıntı</button>
                      )}
                    </div>
                    <div className={cn("flex items-center gap-1.5", mod === "secici" ? "absolute bottom-2 right-2 z-10" : "mt-2")}>
                      {mod === "sayfa" && onKullan && (
                        <button onClick={() => onKullan(e)} className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full bg-white/[0.07] text-[12.5px] font-semibold text-metin ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white hover:text-[#0a0a0b] active:scale-[0.98]"><AtSign className="h-3.5 w-3.5" />İstemde kullan</button>
                      )}
                      {mod !== "sayfa" && mod !== "secici" && <span className="flex-1" />}
                      <div className="relative shrink-0">
                        <button onClick={() => setMenu((m) => (m === e.id ? null : e.id))} aria-label={`@${e.ad} eylemleri`} aria-expanded={menu === e.id}
                          className={cn("flex items-center justify-center rounded-full transition", mod === "secici" ? "h-7 w-7 bg-black/55 text-white opacity-0 backdrop-blur hover:bg-black/75 focus-visible:opacity-100 group-hover:opacity-100 aria-expanded:opacity-100 [@media(hover:none)]:opacity-100" : "h-8 w-8 text-metin-3 hover:bg-white/8 hover:text-metin")}><MoreHorizontal className="h-4 w-4" /></button>
                        <AnimatePresence>
                          <Yuzen acik={menu === e.id} onKapat={() => setMenu(null)} ust="tam" sag={0} bosluk={4} etiket="Element eylemleri" className="menu-surface w-[190px] rounded-[12px] p-1">
                            {([
                              [Pencil, "Düzenle", () => onDuzenle(e)],
                              [e.sabitli ? PinOff : Pin, e.sabitli ? "Sabitlemeyi kaldır" : "Sabitle", () => guncelle(e.id, { sabitli: !e.sabitli })],
                              [Copy, "Çoğalt", () => elementiCogalt(e)],
                              [Download, "İndir", () => elementiIndir(e)],
                            ] as const).map(([I, ad, fn]) => (
                              <button key={ad} onClick={() => { setMenu(null); fn(); }} className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[13px] text-metin hover:bg-white/6"><I className="h-4 w-4 text-metin-2" />{ad}</button>
                            ))}
                            <div className="my-1 h-px bg-white/8" />
                            <button onClick={() => { setMenu(null); onSecimDegis?.((secili ?? []).filter((x) => x !== e.id)); elementiSil(e); }} className="flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[13px] text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" />Sil</button>
                          </Yuzen>
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Detay çekmecesi: görseller, tarif, modele giden metin, bu elementle yapılan üretimler. */
export function ElementDetay({ e, onKapat, onDuzenle, onKullan }: { e: VElement; onKapat: () => void; onDuzenle: () => void; onKullan?: () => void }) {
  const [i, setI] = useState(0);
  const g = e.gorseller.filter(Boolean);
  const m = TUR_META[e.tur];
  const uretimler = useProjeler((s) => s.uretimler);
  const ileYapilan = useMemo(() => uretimler.filter((u) => u.durum !== "hata" && (u.meta?.elementler as { ad: string }[] | undefined)?.some((x) => x.ad.toLocaleLowerCase("tr") === e.ad.toLocaleLowerCase("tr"))).slice(0, 12), [uretimler, e.ad]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}
      className="perde fixed inset-0 z-[250] flex justify-end bg-black/60 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label={`@${e.ad}`} onClick={onKapat}>
      <motion.aside initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0, transition: { duration: 0.15 } }} transition={{ type: "spring", stiffness: 380, damping: 36 }}
        onClick={(ev) => ev.stopPropagation()} className="flex h-full w-full max-w-[460px] flex-col overflow-hidden border-l border-white/[0.08] bg-yuzey">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5"><h3 className="truncate text-[19px] font-bold text-metin">@{e.ad}</h3><TurRozeti tur={e.tur} /></div>
          <button onClick={onKapat} aria-label="Kapat" className="glass-ikon flex h-8 w-8 items-center justify-center rounded-full text-metin-2"><X className="h-4 w-4" /></button>
        </div>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-6 [scrollbar-width:thin]">
          <div>
            {g.length ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={g[Math.min(i, g.length - 1)]} alt={m.yuvalar[i] ?? ""} className="aspect-[4/5] w-full rounded-2xl object-cover" />
            ) : <ElementKapak e={e} className="aspect-[4/5] w-full rounded-2xl" ikonBoyut={56} />}
            {g.length > 1 && (
              <div className="mt-2 grid grid-cols-4 gap-2">
                {g.map((src, k) => (
                  <button key={src + k} onClick={() => setI(k)} className={cn("relative aspect-square overflow-hidden rounded-xl ring-2", k === i ? "ring-white" : "ring-transparent")} aria-label={m.yuvalar[k]}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center text-[10px] text-white/90">{m.yuvalar[k]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {e.aciklama ? <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-metin">{e.aciklama}</p> : <p className="text-[13px] text-metin-3">Tarif yok — düzenleyip ekleyebilirsin.</p>}
          <dl className="grid grid-cols-3 gap-2">
            {[["Kullanım", e.kullanim ? `${e.kullanim} üretim` : "Henüz yok"], ["Görsel", `${g.length}/4`], ["Oluşturma", new Date(e.olusturma).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })]].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-white/[0.035] px-3 py-2.5"><dt className="text-[11px] text-metin-3">{k}</dt><dd className="mt-0.5 text-[13px] font-semibold text-metin">{v}</dd></div>
            ))}
          </dl>
          {ileYapilan.length > 0 && (
            <div>
              <p className="mb-2 text-[12.5px] font-semibold text-metin">Bu elementle üretilenler <span className="font-normal text-metin-3">{ileYapilan.length}</span></p>
              <div className="grid grid-cols-3 gap-2">
                {ileYapilan.map((u) => (
                  <a key={u.id} href={`/panel/kitaplik?u=${u.id}`} title={u.baslik} className="relative block aspect-square overflow-hidden rounded-xl bg-white/[0.04]">
                    {u.gorselUrl && /^(\/|data:image|https?:)/.test(u.gorselUrl) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.gorselUrl} alt="" className="h-full w-full object-cover" />
                    ) : <span className="absolute inset-0" style={{ background: u.gorselUrl ?? "#1a1b1f" }} />}
                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[9.5px] text-white/85">{u.tur === "video" ? "Video" : u.tur === "gorsel" ? "Görsel" : u.tur}</span>
                    {u.durum !== "tamam" && <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-[10.5px] font-medium text-white">İşleniyor</span>}
                  </a>
                ))}
              </div>
            </div>
          )}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-[12.5px] leading-relaxed text-metin-2">
            <p className="mb-1 text-[12px] font-medium text-metin-3">İstemde nasıl kullanılır</p>
            <span className="text-metin"><b className="rounded-md bg-white/[0.08] px-1 font-semibold text-metin">@{e.ad}</b> yağmurlu bir sokakta yürüyor</span> yazdığında model, {m.ad.toLocaleLowerCase("tr")} tarifini{g.length ? " ve görsellerini (destekleyen modellerde)" : ""} birlikte alır.
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-white/[0.07] p-4">
          <button onClick={() => { elementiSil(e); onKapat(); }} aria-label="Sil" className="flex h-10 w-10 items-center justify-center rounded-xl text-metin-2 hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
          <button onClick={() => elementiCogalt(e)} aria-label="Çoğalt" className="flex h-10 w-10 items-center justify-center rounded-xl text-metin-2 hover:bg-white/8 hover:text-metin"><Copy className="h-4 w-4" /></button>
          <button onClick={onDuzenle} className="ml-auto flex h-10 items-center gap-1.5 rounded-xl bg-white/[0.08] px-4 text-[13px] font-semibold text-metin hover:bg-white/[0.13]"><Pencil className="h-4 w-4" /> Düzenle</button>
          {onKullan && <button onClick={onKullan} className="flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-[13px] font-bold text-zemin"><Sparkles className="h-4 w-4" /> Kullan</button>}
        </div>
      </motion.aside>
    </motion.div>
  );
}
