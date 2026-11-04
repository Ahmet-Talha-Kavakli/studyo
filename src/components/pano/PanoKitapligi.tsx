"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Layers, Sparkles, MoreHorizontal, Pencil, Copy, Trash2, Search, X, Info, Moon, Film, Shirt, Building2, Star, Flower2, Trees, LayoutGrid, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useMasaustu } from "@/hooks/useMasaustu";
import { Yuzen } from "@/components/ui/Yuzen";
import { usePanolar, type Pano } from "@/store/usePanolar";
import { HAZIR_PANOLAR_TAM, PANO_KATEGORILERI, type PanoKategori, type HazirPano } from "@/lib/panoVeri";
import { goreliZamanKisa } from "@/store/useElements";

const KAT_IKON: Record<PanoKategori, typeof Moon> = { Karanlık: Moon, Film: Film, Editöryel: Shirt, Sokak: Building2, Y2K: Star, Pastel: Flower2, Doğa: Trees };
const POP = "rounded-[18px] border border-white/[0.09] bg-[#1b1c1f]";
const YAY = { type: "spring", stiffness: 480, damping: 38 } as const;
type Sekme = "tumu" | "benim" | PanoKategori;

/** Pano kapağı: 1 görselde tam, 2'de yan yana, 3+ görselde büyük + iki küçük. */
export function PanoMozaik({ gorseller, className }: { gorseller: string[]; className?: string }) {
  const l = gorseller.filter(Boolean).slice(0, 3);
  if (!l.length) return <span className={cn("flex items-center justify-center bg-white/[0.03]", className)}><Layers className="h-7 w-7 text-metin-3" /></span>;
  return (
    <span className={cn("grid gap-[3px] overflow-hidden bg-[#0b0b0c]", l.length === 2 && "grid-cols-2", l.length === 3 && "grid-cols-[1.6fr_1fr] grid-rows-2", className)}>
      {l.map((g, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={g + i} src={g} alt="" loading="lazy" className={cn("h-full w-full object-cover", l.length === 3 && i === 0 && "row-span-2")} />
      ))}
    </span>
  );
}

/**
 * Ruh panoları (moodboard): Higgsfield düzeninde vitrin. Üstte panoların yelpaze kareleri, tek beyaz
 * "Pano oluştur"; altında kayan sekmelerle (Tümü, Panolarım, kategoriler) büyük kare pano kartları.
 */
export function PanoKitapligi() {
  const router = useRouter();
  const masaustu = useMasaustu();
  const panolar = usePanolar((s) => s.panolar);
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  const [sekme, setSekme] = useState<Sekme>("tumu");
  const [ara, setAra] = useState("");
  const benimler = hazir ? panolar : [];

  const q = ara.trim().toLocaleLowerCase("tr");
  const eslesir = (ad: string, not = "") => !q || `${ad} ${not}`.toLocaleLowerCase("tr").includes(q);
  const benimGorunen = sekme === "tumu" || sekme === "benim" ? benimler.filter((p) => eslesir(p.ad, p.tarif)) : [];
  const hazirGorunen = sekme === "benim" ? [] : HAZIR_PANOLAR_TAM.filter((p) => (sekme === "tumu" || p.kat === sekme) && eslesir(p.ad, p.not));
  const bos = !benimGorunen.length && !hazirGorunen.length;

  const hazirKopyala = (p: HazirPano) => {
    const id = usePanolar.getState().panoEkle(p.ad, p.gorseller);
    toast.success(`“${p.ad}” panolarına eklendi`, { description: "Kendi görsellerinle genişletebilirsin." });
    router.push(`/panel/moodboard/${id}`);
  };
  // Vitrin yelpazesi: yalnız seçilmiş hazır panolar (kullanıcının ekran görüntüsü gibi görselleri vitrine çıkmaz).
  const yelpaze = useMemo(() => ["karanlik-couture", "sicak-ambiyans", "teatral-isik", "y2k-renk", "doga-isigi"]
    .map((id) => HAZIR_PANOLAR_TAM.find((h) => h.id === id)).filter((x): x is HazirPano => !!x && x.gorseller.length > 0)
    .map((h) => ({ ad: h.ad, gorseller: h.gorseller.slice(0, 3) })), []);

  const sekmeler: [Sekme, string, typeof Moon, number][] = [
    ["tumu", "Tümü", LayoutGrid, benimler.length + HAZIR_PANOLAR_TAM.length],
    ...(benimler.length ? [["benim", "Panolarım", User, benimler.length] as [Sekme, string, typeof Moon, number]] : []),
    ...PANO_KATEGORILERI.map((k) => [k, k, KAT_IKON[k], HAZIR_PANOLAR_TAM.filter((p) => p.kat === k).length] as [Sekme, string, typeof Moon, number]),
  ];

  return (
    <div className="min-h-[calc(100dvh-var(--ust-nav))] overflow-x-clip bg-[#0b0b0c] bg-[radial-gradient(ellipse_at_50%_0%,#1b1c20_0%,#0b0b0c_55%)]">
      <div className="mx-auto max-w-[1400px] px-4 pb-20 sm:px-6">
        {/* ── Vitrin ── */}
        <section className="pt-8 text-center sm:pt-10">
          <Yelpaze l={yelpaze} buyuk={masaustu} />
          <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={cn("font-semibold tracking-[-0.035em] text-metin", masaustu ? "mt-8 text-[46px] leading-[1.02]" : "mt-6 text-[30px] leading-[1.05]")}>Görsel dilini bir kez kur</motion.h1>
          <p className="mx-auto mt-3 max-w-[560px] text-[15px] text-metin-2">Referanslarını bir panoda topla. Işık, renk ve doku her üretimde aynı kalır; görsellerdeki kişi ve nesneler kopyalanmaz.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/panel/moodboard/yeni" className="flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-black transition active:scale-95"><Plus className="h-4 w-4" />Pano oluştur</Link>
          </div>
          <p className="mx-auto mt-3 flex w-fit items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1 text-[12px] text-metin-2"><Info className="h-3.5 w-3.5" />Pano oluşturmak ücretsiz; panolar yalnız sana görünür</p>
        </section>

        {/* ── Araç çubuğu ── */}
        <div className="sticky top-[var(--ust-nav)] z-20 -mx-4 mt-10 flex items-center gap-2 px-4 py-3 sm:-mx-6 sm:px-6">
          <div role="tablist" aria-label="Panolar" className="gizli-scroll flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
            <div className="isolate flex shrink-0 gap-0.5 rounded-full bg-white/[0.06] p-[3px]">
              {sekmeler.map(([id, ad, I, n]) => (
                <button key={id} role="tab" aria-selected={sekme === id} onClick={() => setSekme(id)}
                  className={cn("relative flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors", sekme === id ? "text-black" : "text-metin-2 hover:text-metin")}>
                  {sekme === id && <motion.span layoutId="pano-sekme" transition={YAY} className="absolute inset-0 -z-10 rounded-full bg-white" />}
                  <I className="h-3.5 w-3.5" />{ad}<span className={cn("tabular-nums", sekme === id ? "text-black/50" : "text-metin-3")}>{n}</span>
                </button>
              ))}
            </div>
          </div>
          <label className={cn("flex h-10 shrink-0 items-center gap-2 rounded-full bg-white/[0.06] px-3.5 outline outline-1 -outline-offset-1 outline-transparent transition-[width] focus-within:outline-white/30", masaustu ? "w-[240px]" : "w-10 focus-within:w-[180px]")}>
            <Search className="h-4 w-4 shrink-0 text-metin-2" />
            <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Pano ara" aria-label="Pano ara" className="min-w-0 flex-1 bg-transparent text-[13.5px] text-metin outline-none placeholder:text-metin-2" />
            {ara && <button onClick={() => setAra("")} aria-label="Aramayı temizle" className="text-metin-2 hover:text-metin"><X className="h-3.5 w-3.5" /></button>}
          </label>
        </div>

        {/* ── Izgara ── */}
        <motion.div key={sekme} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mt-3 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {(sekme === "tumu" || sekme === "benim") && !q && (
            <Link href="/panel/moodboard/yeni" className="group flex aspect-square flex-col items-center justify-center gap-3 rounded-[22px] border border-dashed max-[479px]:aspect-[5/2] border-white/15 text-center transition hover:border-white/35 hover:bg-white/[0.03] active:scale-[0.99]">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black transition-transform group-hover:scale-105"><Plus className="h-6 w-6" /></span>
              <span className="text-[15px] font-semibold text-metin">Yeni pano</span>
              <span className="-mt-2 text-[12.5px] text-metin-2">Görsel topla, stilini çıkar</span>
            </Link>
          )}
          <AnimatePresence initial={false}>
            {benimGorunen.map((p) => <BenimKart key={p.id} p={p} />)}
            {hazirGorunen.map((p) => <HazirKart key={p.id} p={p} katGizle={sekme !== "tumu"} onUret={() => router.push(`/panel/gorsel?pano=${encodeURIComponent(`hazir:${p.id}`)}`)} onKopyala={() => hazirKopyala(p)} />)}
          </AnimatePresence>
        </motion.div>
        {bos && (
          <div className="mt-6 flex justify-center">
            <p className="flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-[13px] text-metin-2">“{ara}” ile eşleşen pano yok<button onClick={() => setAra("")} className="rounded-full bg-white/[0.1] px-2.5 py-0.5 text-[12px] text-metin">Temizle</button></p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Higgsfield usulü yelpaze: eğik, üst üste binen kareler. */
function Yelpaze({ l, buyuk }: { l: { ad: string; gorseller: string[] }[]; buyuk?: boolean }) {
  const n = l.length;
  const w = buyuk ? 184 : 112, h = buyuk ? 236 : 146, ara = buyuk ? 138 : 64;
  return (
    <div className="relative mx-auto" style={{ height: h + 36 }} aria-hidden>
      {l.map((p, i) => {
        const d = i - (n - 1) / 2;
        return (
          <motion.span key={p.ad} initial={{ opacity: 0, y: 28, rotate: 0 }} animate={{ opacity: 1, y: Math.abs(d) * 12, rotate: d * 6 }} transition={{ delay: 0.08 + i * 0.07, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-0 overflow-hidden rounded-[24px] bg-[#141416] p-[5px] ring-1 ring-white/[0.12]"
            style={{ width: w, height: h, left: `calc(50% + ${d * ara}px - ${w / 2}px)`, zIndex: 10 - Math.abs(Math.round(d)) }}>
            <PanoMozaik gorseller={p.gorseller} className="h-full w-full rounded-[19px]" />
            <span className="absolute inset-x-[5px] bottom-[5px] h-1/3 rounded-b-[19px] bg-gradient-to-t from-black/80 to-transparent" />
            {buyuk && <span className="absolute inset-x-3 bottom-3 truncate text-left text-[13px] font-semibold text-white">{p.ad}</span>}
          </motion.span>
        );
      })}
    </div>
  );
}

/** Kare pano kapağı: üzerine gelince panonun diğer görseline yumuşak geçiş. */
function Kapak({ gorseller }: { gorseller: string[] }) {
  const l = gorseller.filter(Boolean);
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {l[0] ? <img src={l[0]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" /> : <span className="absolute inset-0 flex items-center justify-center bg-white/[0.03]"><Layers className="h-8 w-8 text-metin-3" /></span>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {l[1] && <img src={l[1]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 group-hover:scale-[1.04] group-hover:opacity-100" />}
      <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
    </>
  );
}

function HazirKart({ p, onUret, onKopyala, katGizle }: { p: HazirPano; onUret: () => void; onKopyala: () => void; katGizle?: boolean }) {
  const I = KAT_IKON[p.kat];
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="group relative aspect-square overflow-hidden rounded-[22px] bg-white/[0.04]">
      <Kapak gorseller={p.gorseller} />
      {!katGizle && <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[11.5px] text-white/90 backdrop-blur"><I className="h-3 w-3" />{p.kat}</span>}
      {p.gorseller.length > 1 && <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-[11.5px] tabular-nums text-white/90 backdrop-blur">{p.gorseller.length} görsel</span>}
      <span className="absolute inset-x-3.5 bottom-3.5 transition-transform duration-300 group-hover:-translate-y-12 [@media(hover:none)]:-translate-y-12">
        <span className="block truncate text-[16px] font-semibold text-white">{p.ad}</span>
        <span className="block truncate text-[12.5px] text-white/65">{p.not}</span>
      </span>
      <span className="absolute inset-x-3 bottom-3 flex translate-y-2 gap-1.5 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100">
        <button onClick={onUret} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-semibold text-black transition active:scale-95"><Sparkles className="h-4 w-4" />Üret</button>
        <button onClick={onKopyala} title="Panolarına kopyala ve düzenle" className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-black/50 px-3.5 text-[13px] font-medium text-white ring-1 ring-inset ring-white/20 backdrop-blur transition hover:bg-black/70 active:scale-95"><Copy className="h-4 w-4" />Kopyala</button>
      </span>
    </motion.div>
  );
}

function BenimKart({ p }: { p: Pano }) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const st = usePanolar.getState;
  const sil = () => { const yedek = p; st().panoSil(p.id); toast(`“${p.ad}” silindi`, { action: { label: "Geri al", onClick: () => st().panoGeriYukle(yedek) } }); };
  const ogeler: [typeof Pencil, string, () => void, boolean?][] = [
    [Pencil, "Düzenle", () => router.push(`/panel/moodboard/${p.id}`)],
    [Copy, "Çoğalt", () => { if (st().panoCogalt(p.id)) toast.success("Pano çoğaltıldı"); }],
    [Trash2, "Sil", sil, true],
  ];
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="group relative aspect-square overflow-hidden rounded-[22px] bg-white/[0.04]">
      <Link href={`/panel/moodboard/${p.id}`} aria-label={`${p.ad} panosunu aç`} className="absolute inset-0"><Kapak gorseller={p.gorseller} /></Link>
      <span className="pointer-events-none absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11.5px] font-medium text-black"><User className="h-3 w-3" />Senin</span>
      <div className="absolute right-2.5 top-2.5">
        <button onClick={() => setMenu((v) => !v)} aria-label={`${p.ad} seçenekleri`} aria-expanded={menu} className={cn("flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70 active:scale-90", menu ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100")}><MoreHorizontal className="h-4 w-4" /></button>
        <Yuzen acik={menu} onKapat={() => setMenu(false)} yerlesim="alt-sag" bosluk={6} etiket="Pano seçenekleri" kaydirmadaKapat className={cn("w-52 p-1.5", POP)}>
          {ogeler.map(([I, a, f, t]) => (
            <div key={a}>
              {t && <span className="mx-2 my-1 block h-px bg-white/[0.06]" />}
              <button role="menuitem" onClick={() => { setMenu(false); f(); }} className={cn("flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] transition-colors", t ? "text-rose-300 hover:bg-rose-400/[0.08]" : "text-metin hover:bg-white/[0.06]")}><I className="h-4 w-4 shrink-0" />{a}</button>
            </div>
          ))}
        </Yuzen>
      </div>
      <span className="pointer-events-none absolute inset-x-3.5 bottom-3.5 transition-transform duration-300 group-hover:-translate-y-12 [@media(hover:none)]:-translate-y-12">
        {p.renkler?.length ? <span className="mb-2 flex h-1.5 w-24 overflow-hidden rounded-full">{p.renkler.slice(0, 6).map((r) => <span key={r} className="flex-1" style={{ background: r }} />)}</span> : null}
        <span className="block truncate text-[16px] font-semibold text-white">{p.ad}</span>
        <span className="block truncate text-[12.5px] tabular-nums text-white/65">{p.gorseller.length} görsel · {goreliZamanKisa(p.guncelleme ?? p.olusturma)}</span>
      </span>
      <span className="absolute inset-x-3 bottom-3 flex translate-y-2 gap-1.5 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100">
        <button onClick={() => router.push(`/panel/gorsel?pano=${p.id}`)} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-semibold text-black transition active:scale-95"><Sparkles className="h-4 w-4" />Üret</button>
        <button onClick={() => router.push(`/panel/moodboard/${p.id}`)} className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-black/50 px-3.5 text-[13px] font-medium text-white ring-1 ring-inset ring-white/20 backdrop-blur transition hover:bg-black/70 active:scale-95"><Pencil className="h-4 w-4" />Düzenle</button>
      </span>
    </motion.div>
  );
}
