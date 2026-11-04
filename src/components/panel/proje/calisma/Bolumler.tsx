"use client";

/** Proje çalışma alanı bölümleri: Brif (Notion editörü), Elementler, Canvas, AI Yönetmen (sohbet + storyboard). */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGroup, motion } from "framer-motion";
import { ArrowRight, AtSign, Check, FileText, Loader2, MapPin, Package, Plus, Sparkles, Trash2, Workflow, X } from "lucide-react";
import { useProje, type Proje } from "@/store/useSinema";
import { useElements } from "@/store/useElements";
import { useTuval } from "@/store/useTuval";
import { SABLONLAR, tarifKur, type Tarif } from "@/lib/tuval/kurucu";
import { BrifEditor } from "./BrifEditor";
import { YonetmenMasasi } from "./YonetmenMasasi";
import { toast } from "@/lib/toast";
import { gorece } from "@/components/panel/projeler/projeVeri";
import { ALT, BEYAZ, BRIF_BOLUMLERI, GRI, Hap, KART, SERIT, brifCoz, brifYaz, ease, yay } from "./ortak";
import { BosSatir, Kart } from "./Pano";
import { cn } from "@/lib/utils";

/* ── Brif: Notion dili blok editörü ── */
export function Brif({ p }: { p: Proje }) {
  return <BrifEditor key={p.id} p={p} />;
}

/* ── Elementler: projenin kadrosu ── */
const TUR: [string, string][] = [["hepsi", "Tümü"], ["karakter", "Karakter"], ["mekan", "Mekân"], ["obje", "Nesne"], ["stil", "Stil"]];
const turAd = (t: string) => (t === "mekan" ? "Mekân" : t === "obje" || t === "prop" ? "Nesne" : t === "stil" ? "Stil" : "Karakter");
export function Elementler({ p, onEkle }: { p: Proje; onEkle: () => void }) {
  const tum = useElements((s) => s.elementler);
  const [tur, setTur] = useState("hepsi");
  const liste = useMemo(() => {
    const ad = new Set((p.elementler ?? []).map((e) => e.ad.toLocaleLowerCase("tr")));
    const eslesen = tum.filter((e) => e.projeId === p.id || ad.has(e.ad.toLocaleLowerCase("tr")));
    /* Kitaplıkta karşılığı olmayan eski proje elementleri de kadroda görünür (görselsiz). */
    const yetim = (p.elementler ?? []).filter((e) => !eslesen.some((x) => x.ad.toLocaleLowerCase("tr") === e.ad.toLocaleLowerCase("tr")))
      .map((e) => ({ id: e.id, ad: e.ad, tur: e.tur === "prop" ? "obje" : e.tur, aciklama: e.aciklama ?? "", tohum: e.tohum, gorseller: [] as string[] } as (typeof tum)[number]));
    return [...eslesen, ...yetim];
  }, [tum, p]);
  const kitaplik = useMemo(() => tum.filter((e) => !liste.includes(e) && e.gorseller.length).slice(0, 8), [tum, liste]);
  const gorunen = liste.filter((e) => tur === "hepsi" || e.tur === tur);
  const sahneSayisi = (ad: string) => {
    const k = ad.toLocaleLowerCase("tr");
    return p.cekimler.filter((c) => (c.elementler ?? []).some((x) => x.toLocaleLowerCase("tr") === k) || c.istem.toLocaleLowerCase("tr").includes(`@${k}`)).length;
  };
  const cikar = (id: string, ad: string) => {
    const pe = (p.elementler ?? []).find((x) => x.ad.toLocaleLowerCase("tr") === ad.toLocaleLowerCase("tr"));
    if (pe) useProje.getState().elementSil(p.id, pe.id);
    const el = tum.find((x) => x.id === id);
    if (el?.projeId === p.id) useElements.getState().guncelle(id, { projeId: undefined });
    toast(`@${ad} projeden çıkarıldı`, { description: "Element kitaplığında durmaya devam ediyor." });
  };
  const ekleKitapliktan = (e: (typeof tum)[number]) => {
    useProje.getState().elementEkle(p.id, { ad: e.ad, tur: e.tur === "mekan" ? "mekan" : e.tur === "obje" ? "prop" : "karakter", tohum: e.tohum });
    toast.success(`@${e.ad} projeye eklendi`, { description: "İstemde @ yazınca ve AI Yönetmen'de görünür." });
  };
  const kopyala = (ad: string) => { void navigator.clipboard?.writeText(`@${ad}`); toast.success(`@${ad} kopyalandı`, { description: "Üretim kutusuna ya da sahne istemine yapıştırabilirsin." }); };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-1 flex items-center gap-2 text-[22px] font-semibold tracking-[-0.02em] text-white">Elementler{liste.length > 0 && <Hap>{liste.length}</Hap>}</h1>
        {liste.length > 0 && (
          <LayoutGroup id="el-tur">
            <div className="gizli-scroll flex gap-0.5 overflow-x-auto rounded-full bg-white/[0.05] p-1 ring-1 ring-inset ring-white/[0.06]">
              {TUR.filter(([t]) => t === "hepsi" || liste.some((e) => e.tur === t)).map(([t, ad]) => (
                <button key={t} onClick={() => setTur(t)} className={cn("relative flex h-8 shrink-0 items-center rounded-full px-3.5 text-[13px] font-medium", tur === t ? "text-black" : "text-white/75 hover:text-white")}>
                  {tur === t && <motion.span layoutId="el-tur-z" className="absolute inset-0 rounded-full bg-white" transition={yay} />}<span className="relative">{ad}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>
        )}
        <span className="flex-1" />
        {liste.length > 0 && <><Link href="/panel/element" className={GRI}>Element kitaplığı</Link><button onClick={onEkle} className={BEYAZ}><Plus className="h-4 w-4" />Element ekle</button></>}
      </div>

      {liste.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {gorunen.map((e, i) => {
            const n = sahneSayisi(e.ad);
            return (
              <motion.article key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, duration: 0.4, ease }} className="group overflow-hidden rounded-[18px] bg-[#111214] ring-1 ring-inset ring-white/[0.07]">
                <div className="relative grid aspect-[4/3] grid-cols-[2fr_1fr] grid-rows-2 gap-[2px] overflow-hidden bg-white/[0.03]">
                  {e.gorseller.length === 0 ? (() => { const I = e.tur === "mekan" ? MapPin : e.tur === "obje" ? Package : Sparkles; return (
                    <Link href="/panel/element" className="col-span-2 row-span-2 flex flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_50%_40%,rgba(85,214,253,0.10),transparent_65%)] text-center transition hover:bg-white/[0.03]">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-inset ring-white/10"><I className="h-5 w-5 text-white/75" /></span>
                      <span className="text-[12.5px] text-white/60">Referans görseli yok</span>
                      <span className="flex h-7 items-center gap-1 rounded-full bg-white/[0.08] px-2.5 text-[12px] font-medium text-white/90"><Plus className="h-3 w-3" />Görsel ekle</span>
                    </Link>
                  ); })()
                    : [0, 1, 2].filter((j) => j === 0 || e.gorseller[1]).map((j) => (
                      <span key={j} className={cn("relative overflow-hidden bg-white/[0.04]", j === 0 && "row-span-2", !e.gorseller[1] && "col-span-2")}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {e.gorseller[j] && <img src={e.gorseller[j]} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
                      </span>
                    ))}
                  <span className="absolute inset-x-0 bottom-0 flex translate-y-1 justify-end gap-1.5 bg-gradient-to-t from-black/70 to-transparent p-2 pt-8 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                    <button onClick={() => kopyala(e.ad)} className="flex h-8 items-center gap-1 rounded-full bg-white px-3 text-[12px] font-semibold text-black"><AtSign className="h-3.5 w-3.5" />Kopyala</button>
                    <button onClick={() => cikar(e.id, e.ad)} aria-label={`@${e.ad} elementini projeden çıkar`} title="Projeden çıkar" className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-rose-500/70"><Trash2 className="h-3.5 w-3.5" /></button>
                  </span>
                </div>
                <div className="px-3 py-2.5">
                  <p className="truncate text-[14px] font-semibold text-white">@{e.ad}</p>
                  <p className="mt-0.5 truncate text-[12px] text-white/55">{turAd(e.tur)} · {e.gorseller.length} referans · {n ? `${n} sahnede` : "Sahnede yok"}</p>
                </div>
              </motion.article>
            );
          })}
          <button onClick={onEkle} className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-[18px] bg-white/[0.025] text-white/60 ring-1 ring-inset ring-white/[0.07] transition hover:bg-white/[0.05] hover:text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.07]"><Plus className="h-[18px] w-[18px]" /></span><span className="text-[13px] font-medium">Element ekle</span>
          </button>
        </div>
      ) : (
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }}
          className={cn(KART, "flex flex-col items-center px-6 py-14 text-center sm:py-20")}>
          {/* Kitaplıktaki ilk üç elementin yüzü yelpaze gibi; kitaplık boşsa tek simge */}
          <div className="relative flex h-24 items-center justify-center">
            {kitaplik.length ? kitaplik.slice(0, 3).map((e, i, l) => {
              const orta = (l.length - 1) / 2, k = i - orta;
              return (
                <motion.span key={e.id} initial={{ opacity: 0, y: 10, rotate: 0 }} animate={{ opacity: 1, y: Math.abs(k) * 6, rotate: k * 9 }} transition={{ delay: 0.08 + i * 0.07, type: "spring", stiffness: 260, damping: 22 }}
                  className="relative -mx-3 block h-[84px] w-[84px] overflow-hidden rounded-[22px] ring-[3px] ring-[#111214]" style={{ zIndex: 10 - Math.abs(k) }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={e.gorseller[0]} alt="" className="h-full w-full object-cover" />
                </motion.span>
              );
            }) : <span className="flex h-20 w-20 items-center justify-center rounded-[22px] bg-white/[0.06] ring-1 ring-inset ring-white/10"><AtSign className="h-8 w-8 text-white/80" /></span>}
          </div>
          <h2 className="mt-7 text-[22px] font-semibold tracking-[-0.02em] text-white">Kadroyu kur</h2>
          <p className="mt-2 max-w-[440px] text-[14px] leading-relaxed text-white/60">Karakterlerini ve mekânlarını bir kez tanımla. İstemde <span className="rounded-[5px] bg-[#55d6fd]/15 px-1 text-[#8be4ff]">@ad</span> yazınca her sahnede aynı görünürler.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <motion.button whileTap={{ scale: 0.96 }} onClick={onEkle} className="flex h-11 items-center gap-1.5 rounded-full bg-white px-5 text-[14px] font-semibold text-black transition hover:bg-white/90"><Plus className="h-4 w-4" />Element ekle</motion.button>
            <Link href="/panel/element" className="flex h-11 items-center rounded-full px-4 text-[13.5px] font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white">Yeni element oluştur</Link>
          </div>
        </motion.section>
      )}
    </div>
  );
}

/* ── Canvas: projeye bağlı tuvaller ── */
export function Canvas({ p }: { p: Proje }) {
  const router = useRouter();
  const tuvaller = useTuval((s) => s.tuvaller);
  const bagli = (p.boardIdler ?? []).map((id) => tuvaller.find((t) => t.id === id)).filter(Boolean) as typeof tuvaller;
  const ac = (ad: string, kur?: Tarif) => {
    const id = useTuval.getState().olustur({ ad, ...(kur ? tarifKur(kur) : {}) });
    useProje.getState().boardBagla(p.id, id);
    useProje.getState().etkinlikEkle(p.id, kur ? `"${ad}" şablonuyla tuval açtı` : "Yeni bir tuval açtı", "proje");
    router.push(`/panel/canvas/${id}`);
  };
  const yeni = () => ac(`${p.ad} tuvali`);
  const [tumu, setTumu] = useState(false);
  return (
    <div className="space-y-4">
      <Kart ikon={Workflow} baslik="Tuvaller" hap={bagli.length ? String(bagli.length) : undefined} sag={<button onClick={yeni} className={BEYAZ}><Plus className="h-4 w-4" />Yeni tuval</button>}>
        <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3">
          {bagli.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.35, ease }}>
              <Link href={`/panel/canvas/${t.id}`} className="group block overflow-hidden rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] transition hover:bg-white/[0.05] hover:ring-white/[0.12]">
                <TuvalHaritasi t={t} />
                <span className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-4 py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-[14.5px] font-semibold text-white">{t.ad}</span>
                    <span className="block truncate text-[12.5px] text-white/55">{t.dugumler.length ? `${t.dugumler.length} düğüm` : "Boş tuval"} · {gorece(t.guncelleme) || "az önce"}</span>
                  </span>
                  <span className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-white/[0.07] px-3 text-[12.5px] font-medium text-white/85 transition group-hover:bg-white group-hover:text-black">Aç<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
                </span>
              </Link>
            </motion.div>
          ))}
          <motion.button onClick={yeni} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: bagli.length * 0.04, duration: 0.35, ease }}
            className={cn("group flex flex-col items-center justify-center gap-2.5 rounded-[18px] border border-dashed border-white/[0.14] p-6 text-center transition hover:border-white/25 hover:bg-white/[0.03]", bagli.length ? "min-h-[220px]" : "min-h-[150px] sm:col-span-2 xl:col-span-3")}>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.07] text-white transition group-hover:bg-white group-hover:text-black"><Plus className="h-5 w-5" /></span>
            <span className="text-[14px] font-semibold text-white">Boş tuval</span>
            <span className="max-w-[240px] text-[12.5px] leading-snug text-white/55">İstem, görsel, video ve ses düğümlerini bağlayıp kendi akışını kur.</span>
          </motion.button>
        </div>
      </Kart>

      <section className={KART}>
        <header className={SERIT}>
          <div><h2 className="text-[16px] font-semibold text-white">Şablonlar</h2><p className="mt-0.5 text-[13px] text-white/55">Hazır bir akışla aç; düğümleri ve istemleri sonra değiştirirsin.</p></div>
          {SABLONLAR.length > 6 && <button onClick={() => setTumu((v) => !v)} className={GRI}>{tumu ? "Daha az göster" : `Tümünü göster (${SABLONLAR.length})`}</button>}
        </header>
        <div className="grid gap-1 p-2 sm:grid-cols-2 xl:grid-cols-3">
          {(tumu ? SABLONLAR : SABLONLAR.slice(0, 6)).map((s, i) => (
            <motion.button key={s.id} onClick={() => ac(s.ad, s.tarif)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03, duration: 0.3, ease }}
              className="group flex items-center gap-3.5 rounded-[14px] p-2 text-left transition hover:bg-white/[0.04]">
              <span className="relative h-[58px] w-[92px] shrink-0 overflow-hidden rounded-[10px] bg-white/[0.04] ring-1 ring-inset ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.kapak} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium text-white">{s.ad}</span>
                <span className="mt-0.5 block truncate text-[12.5px] text-white/50">{s.alt.replace(/ → /g, ", ")}</span>
                <span className="mt-0.5 block text-[11.5px] text-white/35">{s.tarif.dugumler.length} düğüm · {s.sure.replace(/^yaklaşık /, "")}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 -translate-x-1 text-white/0 transition group-hover:translate-x-0 group-hover:text-white/70" />
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  );
}

/** Tuvalin küçük haritası: düğümler gerçek konumlarında, bağlantılar eğri; görsel çıktısı olan düğüm karesini gösterir. */
function TuvalHaritasi({ t }: { t: ReturnType<typeof useTuval.getState>["tuvaller"][number] }) {
  const d = t.dugumler;
  if (!d.length) return (
    <span className="flex h-40 flex-col items-center justify-center gap-2 bg-[radial-gradient(circle,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:14px_14px] text-white/45">
      <Workflow className="h-5 w-5" /><span className="text-[12.5px]">Henüz düğüm yok</span>
    </span>
  );
  const G = 280, Y = 170;
  const minX = Math.min(...d.map((n) => n.x)), minY = Math.min(...d.map((n) => n.y));
  const maxX = Math.max(...d.map((n) => n.x + G)), maxY = Math.max(...d.map((n) => n.y + Y));
  const pay = 60, w = maxX - minX + pay * 2, h = maxY - minY + pay * 2;
  const konum = new Map(d.map((n) => [n.id, n]));
  return (
    <span className="block h-40 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:14px_14px]">
      <svg viewBox={`${minX - pay} ${minY - pay} ${w} ${h}`} preserveAspectRatio="xMidYMid meet" className="h-full w-full">
        {t.kenarlar.map((k) => {
          const a = konum.get(k.kaynak), b = konum.get(k.hedef);
          if (!a || !b) return null;
          const x1 = a.x + G, y1 = a.y + Y / 2, x2 = b.x, y2 = b.y + Y / 2, m = (x1 + x2) / 2;
          return <path key={k.id} d={`M${x1} ${y1} C${m} ${y1} ${m} ${y2} ${x2} ${y2}`} fill="none" stroke="rgba(85,214,253,0.45)" strokeWidth={Math.max(4, w / 220)} />;
        })}
        {d.map((n) => {
          const s = n.surumler[n.aktif] ?? n.surumler[0];
          const gorsel = s?.tip === "gorsel" ? s.url : s?.poster;
          return (
            <g key={n.id}>
              <rect x={n.x} y={n.y} width={G} height={Y} rx={22} fill="#1c1d20" stroke="rgba(255,255,255,0.14)" strokeWidth={Math.max(3, w / 300)} />
              {gorsel ? <image href={gorsel} x={n.x + 8} y={n.y + 8} width={G - 16} height={Y - 16} preserveAspectRatio="xMidYMid slice" style={{ clipPath: "inset(0 round 16px)" }} />
                : <rect x={n.x + 24} y={n.y + 30} width={G * 0.55} height={18} rx={9} fill="rgba(255,255,255,0.16)" />}
            </g>
          );
        })}
      </svg>
    </span>
  );
}

/* ── AI Yönetmen: sohbet + canlı storyboard ── */
export function Yonetmen({ p, onSahne }: { p: Proje; onSahne: (id: string) => void }) {
  return <YonetmenMasasi p={p} onSahne={onSahne} />;
}
