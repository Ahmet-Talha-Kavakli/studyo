"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Boxes, Download, ExternalLink, FolderPlus, Globe, ImagePlus, Loader2, Music2, Trash2, Unlink } from "lucide-react";
import { AlanSayfa, type AlanSayfaBaglam } from "@/components/alan/AlanSayfa";
import { goreliZaman, sayiYaz } from "@/components/alan/ortak";
import { Grup, Hap, Pencere, Segment, dugme } from "@/components/ayarlar/ui";
import * as A from "@/lib/alan/istemci";
import type { AlanKitaplikOgesi, AlanProjeBilgisi } from "@/lib/alan/tipler";
import { ROL_SIRA } from "@/lib/alan/tipler";
import { useProjeler } from "@/store/useProjeler";
import { alanDegisinceDinle } from "@/store/useAlan";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { Uretim } from "@/store/useProjeler";
import { GorunumAyari } from "@/components/galeri/GorunumAyari";
import { useAlanGenisligi, useGorunum } from "@/components/galeri/useGorunum";
import { kartOrani, sutunSayisi } from "@/lib/galeri/gorunum";
import { SuzgecCubugu, suzgecUygula, useSuzgec } from "@/components/galeri/SuzgecCubugu";
import { IndirDugmesi } from "@/components/galeri/IndirMenusu";
import { FavoriDugmesi, FavoriRozeti, eylemDugmesi } from "@/components/galeri/KartEylemleri";

/** Ortak varlıklar: alana bağlı Build projeleri ve alan kitaplığı (alanda üretilenler ve üyelerin eklediği çıktılar). */
export default function AlanVarliklar() {
  const [sekme, setSekme] = useState<"build" | "kitaplik">("build");
  return (
    <AlanSayfa baslik="Ortak varlıklar" aciklama="Alanın Build projeleri ve kitaplığı bütün üyelere açık. Üyeler düzenler, izleyiciler görür.">
      {(b) => (
        <>
          <Segment kayit={false} deger={sekme} onSec={setSekme} secenekler={[{ deger: "build", ad: `Build projeleri ${b.alan.projeSayisi ? `(${b.alan.projeSayisi})` : ""}`.trim() }, { deger: "kitaplik", ad: `Kitaplık ${b.alan.kitaplikSayisi ? `(${b.alan.kitaplikSayisi})` : ""}`.trim() }]} className="w-fit" />
          <AnimatePresence mode="wait">
            <motion.div key={sekme} initial="gizli" animate="acik" exit={{ opacity: 0 }} variants={{ gizli: { opacity: 0, y: 6 }, acik: { opacity: 1, y: 0, transition: { duration: 0.2, staggerChildren: 0.05 } } }} className="space-y-6">
              {sekme === "build" ? <Projeler {...b} /> : <Kitaplik {...b} />}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </AlanSayfa>
  );
}

const TUR_AD: Record<string, string> = { site: "Web sitesi", uygulama: "Uygulama", oyun: "Oyun", mobil: "Mobil uygulama" };

function Projeler({ alan, yonetici, yenile }: AlanSayfaBaglam) {
  const [l, setL] = useState<AlanProjeBilgisi[] | null>(null);
  const [ekle, setEkle] = useState(false);
  const getir = useCallback(async () => { const r = await A.projelerGetir(alan.id); setL(r.ok ? r.projeler : []); }, [alan.id]);
  useEffect(() => { void getir(); }, [getir]);
  useEffect(() => alanDegisinceDinle(() => void getir()), [getir]);
  const cikar = async (p: AlanProjeBilgisi) => {
    const r = await A.projeCikar(alan.id, p.id);
    if (!r.ok) return toast.error("Çıkarılamadı", { description: r.hata });
    toast.success(`${p.ad} alandan çıkarıldı`, { description: "Proje silinmedi; sahibinin kişisel projesi olarak kaldı." });
    void getir(); void yenile();
  };
  return (
    <Grup baslik="Build projeleri" aciklama={alan.ayar.yeniProjeAlana ? "Bu alandayken açtığın yeni Build projeleri kendiliğinden buraya eklenir. Proje sahipliği değişmez." : "Yeni projeler kişisel kalır; kendi projeni elle ekleyebilirsin."}
      sag={alan.rol !== "izleyici" ? <button type="button" onClick={() => setEkle(true)} className={dugme.ikincil}><FolderPlus className="h-4 w-4" />Proje ekle</button> : undefined} govde>
      {!l ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div> : !l.length ? (
        <div className="flex flex-col items-start gap-3 rounded-[14px] bg-white/[0.03] p-5 ring-1 ring-inset ring-white/[0.06] sm:flex-row sm:items-center">
          <Boxes className="h-8 w-8 shrink-0 text-[#a78bfa]" strokeWidth={1.6} />
          <p className="min-w-0 flex-1 text-[13.5px] leading-relaxed text-white/60">Alanda henüz Build projesi yok. Bu alandayken Vayra Build'de yeni proje aç ya da kendi projeni ekle.</p>
          <Link href="/panel/build" className={dugme.birincil}>Build'i aç</Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {l.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="group overflow-hidden rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.05]">
              <div className="relative aspect-[16/10] overflow-hidden bg-[linear-gradient(135deg,#1d1d22,#121214)]">
                {p.kapak ? <img src={p.kapak} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : <span className="absolute inset-0 flex items-center justify-center text-[40px] font-semibold text-white/10">{p.ad.slice(0, 1)}</span>}
                {p.yayinda && <span className="absolute left-2.5 top-2.5"><Hap ton="yesil"><Globe className="h-3 w-3" />Yayında</Hap></span>}
                <div className="absolute inset-x-2.5 bottom-2.5 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  <Link href={`/panel/build/${p.id}`} className="flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black"><ExternalLink className="h-3.5 w-3.5" />Aç</Link>
                  {(p.benim || yonetici) && <button type="button" onClick={() => void cikar(p)} className="flex h-8 items-center gap-1.5 rounded-full bg-black/60 px-3 text-[12.5px] font-medium text-white backdrop-blur"><Unlink className="h-3.5 w-3.5" />Alandan çıkar</button>}
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="truncate text-[14px] font-semibold text-white">{p.ad}</p>
                <p className="mt-0.5 truncate text-[12.5px] text-white/45">{TUR_AD[p.tur] ?? p.tur} · {p.benim ? "senin" : p.sahipAd} · {goreliZaman(p.guncelleme)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <ProjeEklePenceresi acik={ekle} onKapat={() => setEkle(false)} alanId={alan.id} onEklendi={() => { void getir(); void yenile(); }} />
    </Grup>
  );
}

function ProjeEklePenceresi({ acik, onKapat, alanId, onEklendi }: { acik: boolean; onKapat: () => void; alanId: string; onEklendi: () => void }) {
  const [l, setL] = useState<{ id: string; ad: string; tur: string; kapak?: string; guncelleme: number }[] | null>(null);
  useEffect(() => { if (acik) { setL(null); void A.projeAdaylari(alanId).then((r) => setL(r.ok ? r.projeler : [])); } }, [acik, alanId]);
  const ekle = async (id: string, ad: string) => {
    const r = await A.projeEkle(alanId, id);
    if (!r.ok) return toast.error("Eklenemedi", { description: r.hata });
    setL((x) => x?.filter((p) => p.id !== id) ?? null);
    toast.success(`${ad} alana eklendi`);
    onEklendi();
  };
  return (
    <Pencere acik={acik} onKapat={onKapat} baslik="Projeni alana ekle" aciklama="Sahibi olduğun Build projeleri. Eklenen projeyi alanın üyeleri düzenler, izleyiciler görür; sahipliği sende kalır.">
      {!l ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div> : !l.length ? <p className="text-[13.5px] text-white/50">Eklenebilecek kişisel projen yok.</p> : (
        <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.06]">
          {l.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
              <span className="h-11 w-16 shrink-0 overflow-hidden rounded-[8px] bg-white/[0.06]">{p.kapak && <img src={p.kapak} alt="" className="h-full w-full object-cover" />}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-white">{p.ad}</span><span className="block text-[12px] text-white/45">{TUR_AD[p.tur] ?? p.tur} · {goreliZaman(p.guncelleme)}</span></span>
              <button type="button" onClick={() => void ekle(p.id, p.ad)} className={cn(dugme.ikincil, "h-8 text-[12.5px]")}>Ekle</button>
            </li>
          ))}
        </ul>
      )}
    </Pencere>
  );
}

/* ── Kitaplık ── */

type Oge = AlanKitaplikOgesi & { benim: boolean };
/** Alan öğesini galeri bileşenlerinin (indir menüsü, süzgeç) beklediği üretim biçimine çevirir. */
function uretimBenzeri(o: Oge, favori: boolean): Uretim {
  return {
    id: o.id, baslik: o.istem.slice(0, 60) || o.model || "Alan çıktısı", tur: o.tur, model: o.model || "Model", prompt: o.istem, durum: "tamam", ilerleme: 100,
    olusturma: o.zaman, kredi: o.kredi ?? 0, favori, gercek: true, thumbnailUrl: o.kapak,
    ...(o.tur === "gorsel" ? { gorselUrl: o.url } : o.tur === "video" ? { videoUrl: o.url, gorselUrl: o.kapak } : o.tur === "3d" ? { glbUrl: o.url, gorselUrl: o.kapak } : { sesUrl: o.url, gorselUrl: o.kapak }),
  };
}

/** Alan öğelerinin favorileri kişiseldir: bu cihazda, alan başına tutulur. */
function useAlanFavori(alanId: string): [Set<string>, (id: string) => void] {
  const anahtar = `vayra-alan-favori:${alanId}`;
  const [s, setS] = useState<Set<string>>(new Set());
  useEffect(() => { try { setS(new Set(JSON.parse(localStorage.getItem(anahtar) ?? "[]") as string[])); } catch { setS(new Set()); } }, [anahtar]);
  const degistir = (id: string) => setS((x) => {
    const y = new Set(x); if (y.has(id)) y.delete(id); else y.add(id);
    try { localStorage.setItem(anahtar, JSON.stringify([...y])); } catch { /* depolama kapalı */ }
    return y;
  });
  return [s, degistir];
}

function Kitaplik({ alan }: AlanSayfaBaglam) {
  const [l, setL] = useState<Oge[] | null>(null);
  const [sz, szAyarla] = useSuzgec();
  const [g] = useGorunum("alan-kitaplik");
  const [alanRef, en] = useAlanGenisligi<HTMLDivElement>(900);
  const [favoriler, favoriDegistir] = useAlanFavori(alan.id);
  const [ekle, setEkle] = useState(false);
  const [bak, setBak] = useState<Oge | null>(null);
  const yonetici = ROL_SIRA[alan.rol] >= ROL_SIRA.yonetici;
  const getir = useCallback(async () => { const r = await A.kitaplikGetir(alan.id); setL(r.ok ? r.ogeler : []); }, [alan.id]);
  useEffect(() => { void getir(); }, [getir]);
  useEffect(() => alanDegisinceDinle(() => void getir()), [getir]);
  const sil = async (o: Oge) => {
    const r = await A.kitaplikSil(alan.id, o.id);
    if (!r.ok) return toast.error("Kaldırılamadı", { description: r.hata });
    setBak(null); void getir(); toast.success("Kitaplıktan kaldırıldı");
  };
  const ogeler = useMemo(() => (l ?? []).map((o) => ({ o, u: uretimBenzeri(o, favoriler.has(o.id)) })), [l, favoriler]);
  const harita = useMemo(() => new Map(ogeler.map((x) => [x.u.id, x.o])), [ogeler]);
  const gorunen = useMemo(() => suzgecUygula(ogeler.map((x) => x.u), sz, null), [ogeler, sz]);
  const sayilar = useMemo(() => { const m: Record<string, number> = {}; for (const x of ogeler) m[x.u.tur] = (m[x.u.tur] ?? 0) + 1; return m; }, [ogeler]);
  const sutun = sutunSayisi(en, g, { enCok: 8 });
  return (
    <Grup baslik="Alan kitaplığı" aciklama="Bu alandayken üretilen gerçek çıktılar kendiliğinden buraya düşer. Kişisel kitaplığından da çıktı ekleyebilirsin."
      sag={alan.rol !== "izleyici" ? <button type="button" onClick={() => setEkle(true)} className={dugme.ikincil}><ImagePlus className="h-4 w-4" />Kitaplığımdan ekle</button> : undefined} govde>
      {!!l?.length && <SuzgecCubugu d={sz} ayarla={szAyarla} sayilar={sayilar} klasorVar={false} className="mb-4 pb-0.5" sonucSayisi={gorunen.length} sag={<GorunumAyari sayfa="alan-kitaplik" istemVar={false} siralamaVar={false} />} />}
      {!l ? <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div> : !l.length ? (
        <p className="rounded-[14px] bg-white/[0.03] p-5 text-[13.5px] leading-relaxed text-white/55 ring-1 ring-inset ring-white/[0.06]">Kitaplık boş. Alan seçicide bu alan seçiliyken bir stüdyoda üret; biten çıktı burada görünür.</p>
      ) : !gorunen.length ? (
        <div className="flex flex-wrap items-center gap-3 rounded-[14px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.06]">
          <p className="min-w-0 flex-1 text-[13.5px] text-white/65">Bu süzgeçlere uyan çıktı yok.</p>
          <button type="button" onClick={() => szAyarla({ favori: false, tur: null, tarih: {} })} className={dugme.ikincil}>Süzgeçleri temizle</button>
        </div>
      ) : (
        <div ref={alanRef} className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${sutun}, minmax(0, 1fr))` }}>
          {gorunen.map((u, i) => {
            const o = harita.get(u.id)!;
            return (
              <motion.div key={o.id} layout role="button" tabIndex={0} onClick={() => setBak(o)} onKeyDown={(e) => { if (e.key === "Enter") setBak(o); }}
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(i, 12) * 0.02, layout: { type: "spring", stiffness: 420, damping: 38 } }}
                className="group relative cursor-pointer overflow-hidden rounded-[14px] bg-white/[0.04] text-left ring-1 ring-inset ring-white/[0.06]" style={{ aspectRatio: String(kartOrani(g, 1)) }}>
                <Onizleme o={o} />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2.5 pt-8">
                  <span className="block truncate text-[12.5px] font-medium text-white">{o.istem || o.model}</span>
                  <span className="block truncate text-[11.5px] text-white/60">{o.ad} · {goreliZaman(o.zaman)}</span>
                </span>
                {u.favori && <FavoriRozeti boyut="kucuk" className="right-2 top-2" />}
                <div onClick={(e) => e.stopPropagation()} className="pointer-events-none absolute right-2 top-2 z-20 flex gap-1.5 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 max-sm:pointer-events-auto max-sm:opacity-100">
                  <FavoriDugmesi favori={!!u.favori} onClick={() => favoriDegistir(o.id)} boyut="kucuk" side="bottom" />
                  <IndirDugmesi u={u} className={eylemDugmesi("kucuk")} ikonSinif="h-3.5 w-3.5" side="bottom" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      <Pencere acik={!!bak} onKapat={() => setBak(null)} baslik={bak?.model || "Çıktı"} aciklama={bak ? `${bak.ad} · ${goreliZaman(bak.zaman)}${bak.kredi ? ` · ${sayiYaz(bak.kredi)} kredi` : ""}` : undefined} genislik={560}
        alt={bak && <>
          {(bak.benim || yonetici) && <button type="button" onClick={() => void sil(bak)} className={dugme.tehlike}><Trash2 className="h-4 w-4" />Kaldır</button>}
          <IndirDugmesi u={uretimBenzeri(bak, favoriler.has(bak.id))} yerlesim="ust-sag" side="top" className={dugme.birincil}><Download className="h-4 w-4" />İndir</IndirDugmesi>
        </>}>
        {bak && (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[16px] bg-black/40">
              {bak.tur === "video" ? <video src={bak.url} controls playsInline className="max-h-[60vh] w-full" /> : bak.tur === "ses" || bak.tur === "muzik" ? <div className="p-5"><audio src={bak.url} controls className="w-full" /></div>
                : bak.tur === "3d" ? <div className="p-5 text-[13px] text-white/55">3D model dosyası. İndirip 3D stüdyosunda açabilirsin.</div> : <img src={bak.url} alt="" className="max-h-[60vh] w-full object-contain" />}
            </div>
            {bak.istem && <p className="rounded-[14px] bg-white/[0.03] p-4 text-[13.5px] leading-relaxed text-white/75 ring-1 ring-inset ring-white/[0.06]">{bak.istem}</p>}
          </div>
        )}
      </Pencere>
      <KitaplikEklePenceresi acik={ekle} onKapat={() => setEkle(false)} alanId={alan.id} onEklendi={() => void getir()} />
    </Grup>
  );
}

function Onizleme({ o }: { o: Oge }) {
  if (o.tur === "video") return <video src={o.url} muted playsInline preload="metadata" className="h-full w-full object-cover" onMouseEnter={(e) => void e.currentTarget.play().catch(() => {})} onMouseLeave={(e) => e.currentTarget.pause()} />;
  if (o.tur === "ses" || o.tur === "muzik") return <span className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#2a1d33,#121214)]"><Music2 className="h-9 w-9 text-[#f472b6]" strokeWidth={1.5} /></span>;
  if (o.tur === "3d") return o.kapak ? <img src={o.kapak} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center"><Boxes className="h-9 w-9 text-[#34d399]" strokeWidth={1.5} /></span>;
  return <img src={o.kapak ?? o.url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />;
}

/** Kişisel kitaplıktan seçim: yalnız sunucuda kalıcı adresi olan gerçek çıktılar alana eklenebilir. */
function KitaplikEklePenceresi({ acik, onKapat, alanId, onEklendi }: { acik: boolean; onKapat: () => void; alanId: string; onEklendi: () => void }) {
  const uretimler = useProjeler((s) => s.uretimler);
  const [secim, setSecim] = useState<Set<string>>(new Set());
  const [bekle, setBekle] = useState(false);
  useEffect(() => { if (acik) setSecim(new Set()); }, [acik]);
  const adaylar = useMemo(() => uretimler.filter((u) => u.durum === "tamam" && u.gercek !== false).map((u) => {
    const url = u.videoUrl ?? u.glbUrl ?? u.sesUrl ?? u.gorselUrl;
    const tur = u.tur === "muzik" ? "muzik" : u.tur === "3d" ? "3d" : u.tur === "video" ? "video" : u.tur === "ses" ? "ses" : "gorsel";
    return { u, url, tur, kapak: u.thumbnailUrl ?? u.muzik?.kapak ?? (tur === "gorsel" ? url : undefined) };
  }).filter((x) => !!x.url && (/^\/(?!\/)/.test(x.url) || /^https:\/\//.test(x.url))).slice(0, 120), [uretimler]);
  const ekle = async () => {
    const l = adaylar.filter((x) => secim.has(x.u.id)).map((x) => ({ tur: x.tur, model: x.u.model, istem: x.u.meta?.hamIstem ?? x.u.prompt, url: x.url!, ...(x.kapak && /^(\/(?!\/)|https:)/.test(x.kapak) ? { kapak: x.kapak } : {}) }));
    if (!l.length) return;
    setBekle(true);
    const r = await A.kitaplikEkle(alanId, l);
    setBekle(false);
    if (!r.ok) return toast.error("Eklenemedi", { description: r.hata });
    toast.success(`${r.eklenen} çıktı alana eklendi`);
    onEklendi(); onKapat();
  };
  return (
    <Pencere acik={acik} onKapat={onKapat} baslik="Kitaplığından ekle" aciklama="Seçtiğin çıktılar alanın kitaplığında bütün üyelere görünür. Bu tarayıcıdaki kişisel kitaplığın listelenir." genislik={560}
      alt={<><button type="button" onClick={onKapat} className={dugme.hayalet}>Vazgeç</button><button type="button" disabled={!secim.size || bekle} onClick={() => void ekle()} className={dugme.birincil}>{bekle ? "Ekleniyor" : secim.size ? `${secim.size} çıktıyı ekle` : "Çıktı seç"}</button></>}>
      {!adaylar.length ? <p className="text-[13.5px] leading-relaxed text-white/55">Kitaplığında alana eklenebilecek gerçek çıktı yok. Yalnız sunucuda kalıcı adresi olan görsel, video, ses, şarkı ve 3D çıktıları eklenebilir.</p> : (
        <div className="grid grid-cols-3 gap-2">
          {adaylar.map((x) => {
            const sec = secim.has(x.u.id);
            return (
              <button key={x.u.id} type="button" onClick={() => setSecim((s) => { const y = new Set(s); if (y.has(x.u.id)) y.delete(x.u.id); else y.add(x.u.id); return y; })}
                className={cn("relative aspect-square overflow-hidden rounded-[12px] bg-white/[0.05]", sec && "outline outline-2 -outline-offset-2 outline-white")}>
                {x.kapak ? <img src={x.kapak} alt="" className={cn("h-full w-full object-cover transition-opacity", sec ? "opacity-100" : "opacity-80")} /> : x.tur === "video" ? <video src={x.url} muted preload="metadata" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center"><Music2 className="h-7 w-7 text-white/40" /></span>}
                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 px-2 pb-1.5 pt-5 text-left text-[11px] text-white/85">{x.u.baslik || x.u.model}</span>
              </button>
            );
          })}
        </div>
      )}
    </Pencere>
  );
}
