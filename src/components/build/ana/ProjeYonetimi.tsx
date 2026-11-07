"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CopDugmesi, CopPaneli, GeriAlBildirimi, useCop } from "./CopKutusu";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  Cloud, Copy, ExternalLink, Folder, GitBranch, Gamepad2, Globe, LayoutDashboard, Smartphone, FolderInput, FolderOpen, LayoutGrid, List, Loader2, LogOut, MoreHorizontal, PenLine, Plus, Search, Share2, Star, Trash2, Users, X,
} from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { api, gorece, projeOlustur, yayinAdresi } from "@/lib/build/istemci";
import { PROJE_TURLERI, type ProjeOzet, type ProjeTur } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { PaylasPaneli } from "@/components/build/paylasim/PaylasPaneli";
import { ToplulugaEklePaneli } from "@/components/build/paylasim/ToplulugaEklePaneli";
import { PaylasiliyorHapi, usePaylasimDurumu } from "@/components/build/paylasim/ortak";
import { ProjeKapagi } from "./Bolumler";
import { RolHapi } from "@/components/build/ekip/ortak";

const yay = { type: "spring" as const, stiffness: 460, damping: 38 };
const TUR_IKON: Record<ProjeTur, typeof Globe> = { site: Globe, uygulama: LayoutDashboard, oyun: Gamepad2, mobil: Smartphone };
const TUR_AD: Record<ProjeTur, string> = { site: "Web sitesi", uygulama: "Web uygulaması", oyun: "Oyun", mobil: "Mobil uygulama" };
type Durum = "hepsi" | "yildizli" | "yayinda" | "taslak" | "paylasilan";
type Sira = "duzenleme" | "ad" | "olusturma";
const goruntuAnahtari = "vayra-build-proje-gorunum";

function SecimKutusu({ secili, degis }: { secili: boolean; degis: () => void }) {
  return (
    <button type="button" role="checkbox" aria-checked={secili} aria-label="Projeyi seç" onClick={(e) => { e.stopPropagation(); degis(); }}
      className={cn("flex h-6 w-6 items-center justify-center rounded-[8px] backdrop-blur transition-colors", secili ? "bg-white/[0.2] ring-2 ring-inset ring-white" : "bg-black/50 ring-1 ring-inset ring-white/40 hover:ring-white/70")}>
      {secili && <span className="h-2.5 w-2.5 rounded-[3px] bg-white" />}
    </button>
  );
}

/** Proje menüsü: aç, Bulut, yayın adresi, paylaş, topluluğa ekle, yıldız, klasöre taşı, adlandır, kopyala, sil. */
function Menu({ p, klasorler, kapat, yenile, adlandir, guncelle, panelAc, silindi }: { p: ProjeOzet; klasorler: string[]; kapat: () => void; yenile: () => void; adlandir: () => void; silindi: (ids: string[], ad: string) => void; guncelle: (g: { yildiz?: boolean; klasor?: string }) => Promise<void>; panelAc: (t: "paylas" | "topluluk") => void }) {
  const router = useRouter();
  const paylasiliyor = usePaylasimDurumu((d) => !!d.paylasilan[p.id]);
  const toplulukta = usePaylasimDurumu((d) => !!d.toplulukta[p.id]);
  const [ekran, setEkran] = useState<"ana" | "klasor" | "sil" | "ayril">("ana");
  const paylasilan = !!p.ekipRol, izleyici = p.ekipRol === "izleyici";
  const [yeniKlasor, setYeniKlasor] = useState("");
  const [is, setIs] = useState(false);
  const satir = "flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] text-white/80 hover:bg-white/[0.06] hover:text-white";
  return (
    <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4 }} transition={yay}
      onClick={(e) => e.stopPropagation()} className="bd-panel absolute right-2 top-11 z-30 w-[236px] rounded-[16px] p-1.5">
      {ekran === "ayril" ? (
        <div className="p-2">
          <p className="text-[13px] font-semibold text-white">Projeden ayrılınsın mı?</p>
          <p className="mt-0.5 text-[12px] leading-snug text-white/50">Listenden çıkar; yeniden katılmak için yeni bir davet gerekir.</p>
          <div className="mt-2.5 flex gap-1.5">
            <button type="button" disabled={is} onClick={async () => { setIs(true); await api(`/api/build/proje/${p.id}/ekip`, { govde: { islem: "ayril" } }).catch(() => {}); kapat(); yenile(); }} className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-full bg-rose-500 text-[12.5px] font-semibold text-white">{is && <Loader2 className="h-3 w-3 animate-spin" />}Ayrıl</button>
            <button type="button" onClick={() => setEkran("ana")} className="h-8 flex-1 rounded-full bg-white/[0.08] text-[12.5px] text-white">Vazgeç</button>
          </div>
        </div>
      ) : ekran === "sil" ? (
        <div className="p-2">
          <p className="text-[13px] font-semibold text-white">Çöp kutusuna taşınsın mı?</p>
          <p className="mt-0.5 text-[12px] leading-snug text-white/50">Yayındaki site hemen kapanır. 30 gün içinde veritabanı, dosyalar ve sohbetiyle geri alabilirsin.</p>
          <div className="mt-2.5 flex gap-1.5">
            <button type="button" disabled={is} onClick={async () => { setIs(true); const ok = await api(`/api/build/proje/${p.id}`, { method: "DELETE" }).then(() => true).catch(() => false); kapat(); yenile(); if (ok) silindi([p.id], p.ad); }} className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-full bg-rose-500 text-[12.5px] font-semibold text-white">{is && <Loader2 className="h-3 w-3 animate-spin" />}Çöpe taşı</button>
            <button type="button" onClick={() => setEkran("ana")} className="h-8 flex-1 rounded-full bg-white/[0.08] text-[12.5px] text-white">Vazgeç</button>
          </div>
        </div>
      ) : ekran === "klasor" ? (
        <div>
          <p className="px-2.5 pb-1 pt-1.5 text-[12px] text-white/45">Klasöre taşı</p>
          {p.klasor && <button type="button" onClick={async () => { await guncelle({ klasor: "" }); kapat(); }} className={satir}><X className="h-4 w-4 opacity-60" />Klasörden çıkar</button>}
          {klasorler.filter((k) => k !== p.klasor).map((k) => <button key={k} type="button" onClick={async () => { await guncelle({ klasor: k }); kapat(); }} className={satir}><Folder className="h-4 w-4 opacity-60" /><span className="truncate">{k}</span></button>)}
          <form onSubmit={async (e) => { e.preventDefault(); if (yeniKlasor.trim()) { await guncelle({ klasor: yeniKlasor.trim() }); kapat(); } }} className="mt-1 flex gap-1 border-t border-white/[0.06] p-1 pt-2">
            <input autoFocus value={yeniKlasor} onChange={(e) => setYeniKlasor(e.target.value)} maxLength={40} placeholder="Yeni klasör adı" className="h-8 min-w-0 flex-1 rounded-[9px] bg-white/[0.06] px-2.5 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/30 focus:ring-white/30" />
            <button disabled={!yeniKlasor.trim()} className="h-8 rounded-full bg-white px-3 text-[12px] font-semibold text-black disabled:opacity-35">Taşı</button>
          </form>
        </div>
      ) : (
        <>
          <button type="button" onClick={() => router.push(`/panel/build/${p.id}`)} className={satir}><ExternalLink className="h-4 w-4 opacity-60" />Aç</button>
          <button type="button" onClick={() => router.push(`/panel/build/bulut/${p.id}`)} className={satir}><Cloud className="h-4 w-4 opacity-60" />Bulut konsolu</button>
          {p.yayin && <a href={yayinAdresi(p.altAlan).tam} target="_blank" rel="noopener noreferrer" className={satir}><ExternalLink className="h-4 w-4 opacity-60" />Yayındaki siteyi aç</a>}
          {!paylasilan && <>
          <div className="my-1 h-px bg-white/[0.06]" />
          <button type="button" onClick={() => { panelAc("paylas"); kapat(); }} className={satir}><Share2 className="h-4 w-4 opacity-60" />Paylaş{paylasiliyor && <span className="ml-auto flex items-center gap-1 text-[11.5px] text-[#a8ecff]"><span className="h-1.5 w-1.5 rounded-full bg-[#55d6fd]" />Açık</span>}</button>
          <button type="button" onClick={() => { panelAc("topluluk"); kapat(); }} className={satir}><Users className="h-4 w-4 opacity-60" />Topluluğa ekle{toplulukta && <span className="ml-auto text-[11.5px] text-[#a8ecff]">Toplulukta</span>}</button>
          <div className="my-1 h-px bg-white/[0.06]" />
          <button type="button" onClick={async () => { await guncelle({ yildiz: !p.yildiz }); kapat(); }} className={satir}><Star className={cn("h-4 w-4", p.yildiz ? "fill-amber-300 text-amber-300" : "opacity-60")} />{p.yildiz ? "Yıldızı kaldır" : "Yıldızla"}</button>
          <button type="button" onClick={() => setEkran("klasor")} className={satir}><FolderInput className="h-4 w-4 opacity-60" />Klasöre taşı</button>
          </>}
          {paylasilan && <div className="my-1 h-px bg-white/[0.06]" />}
          {!p.taslak && !izleyici && <button type="button" onClick={async () => { setIs(true); try { const v = await api<{ id: string }>("/api/build/proje", { govde: { kopya: p.id, taslak: true } }); router.push(`/panel/build/${v.id}`); } catch { setIs(false); } }} className={satir}><GitBranch className="h-4 w-4 opacity-60" />Deneme dalı aç</button>}
          {!izleyici && <button type="button" onClick={() => { adlandir(); kapat(); }} className={satir}><PenLine className="h-4 w-4 opacity-60" />Yeniden adlandır</button>}
          <button type="button" onClick={async () => { setIs(true); await projeOlustur({ kopya: p.id }).catch(() => {}); kapat(); yenile(); }} className={satir}><Copy className="h-4 w-4 opacity-60" />Kopyasını oluştur{is && <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin" />}</button>
          <div className="my-1 h-px bg-white/[0.06]" />
          {paylasilan
            ? <button type="button" onClick={() => setEkran("ayril")} className={cn(satir, "text-rose-300 hover:text-rose-200")}><LogOut className="h-4 w-4 opacity-70" />Projeden ayrıl</button>
            : <button type="button" onClick={() => setEkran("sil")} className={cn(satir, "text-rose-300 hover:text-rose-200")}><Trash2 className="h-4 w-4 opacity-70" />Sil</button>}
        </>
      )}
    </motion.div>
  );
}

function Durumlar({ p }: { p: ProjeOzet }) {
  const degisti = !!p.yayin && p.sonSurumNo > p.yayin.surumNo;
  const paylasiliyor = usePaylasimDurumu((d) => !!d.paylasilan[p.id]);
  return (
    <span className="flex flex-wrap-reverse items-center gap-1.5 whitespace-nowrap">
      {p.taslak && <span className="flex h-6 items-center gap-1 rounded-full bg-[#0e2a33]/90 px-2.5 text-[11.5px] font-medium text-[#a8ecff] backdrop-blur"><GitBranch className="h-3 w-3" />Deneme dalı</span>}
      {p.taslak ? null : p.yayin ? <span className="flex h-6 items-center gap-1.5 rounded-full bg-black/60 px-2.5 text-[11.5px] font-medium text-white backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-[#55d6fd]" />Yayında</span>
        : <span className="flex h-6 items-center rounded-full bg-black/55 px-2.5 text-[11.5px] text-white/75 backdrop-blur">Taslak</span>}
      {degisti && <span className="flex h-6 items-center rounded-full bg-black/60 px-2.5 text-[11.5px] text-amber-100 backdrop-blur">Yayınlanmamış değişiklik</span>}
      {paylasiliyor && <PaylasiliyorHapi />}
      {p.ekipRol ? <RolHapi rol={p.ekipRol} koyu /> : !!p.uyeSayisi && <span className="flex h-6 items-center gap-1 whitespace-nowrap rounded-full bg-black/60 px-2.5 text-[11.5px] font-medium text-white/90 backdrop-blur"><Users className="h-3 w-3" />{p.uyeSayisi + 1} kişi</span>}
    </span>
  );
}

/** Bütün projeler: klasörler, yıldızlı, durum ve tür süzgeci, sıralama, ızgara ya da liste, çoklu seçimle toplu işlem. */
export function ProjeYonetimi({ projeler, yenile, yeni }: { projeler: ProjeOzet[] | null; yenile: () => void; yeni: () => void }) {
  const router = useRouter();
  const [ara, setAra] = useState("");
  const [durum, setDurum] = useState<Durum>("hepsi");
  const [tur, setTur] = useState<"hepsi" | ProjeTur>("hepsi");
  const [klasor, setKlasor] = useState<string | null>(null);
  const [sira, setSira] = useState<Sira>("duzenleme");
  const [gorunum, setGorunum] = useState<"izgara" | "liste">("izgara");
  const [secim, setSecim] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState<string | null>(null);
  const [adlandir, setAdlandir] = useState<{ id: string; ad: string } | null>(null);
  const [topluKlasor, setTopluKlasor] = useState<string | null>(null);
  const [silOnay, setSilOnay] = useState(false);
  const cop = useCop();
  const [copAcik, setCopAcik] = useState(false);
  const [geriAl, setGeriAl] = useState<{ ids: string[]; ad: string; anahtar: number } | null>(null);
  const silindi = (ids: string[], ad: string) => { setGeriAl({ ids, ad, anahtar: Date.now() }); cop.yukle(); };
  const [isleniyor, setIsleniyor] = useState(false);
  const [panel, setPanel] = useState<{ tur: "paylas" | "topluluk"; id: string } | null>(null);
  const paylasilan = usePaylasimDurumu((d) => d.paylasilan);
  const durumYukle = usePaylasimDurumu((d) => d.yukle);
  useEffect(() => { if (projeler?.length) durumYukle(); }, [projeler, durumYukle]);
  const araKutu = useRef<HTMLInputElement>(null);
  useEffect(() => { try { const g = localStorage.getItem(goruntuAnahtari); if (g === "liste" || g === "izgara") setGorunum(g); } catch { /* yok */ } }, []);
  useEffect(() => { if (!menu) return; const k = () => setMenu(null); const t = setTimeout(() => addEventListener("click", k), 0); return () => { clearTimeout(t); removeEventListener("click", k); }; }, [menu]);
  useEffect(() => {
    const t = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); araKutu.current?.focus(); } if (e.key === "Escape") { setSecim(new Set()); setSilOnay(false); } };
    addEventListener("keydown", t); return () => removeEventListener("keydown", t);
  }, []);

  const tum = projeler ?? [];
  const klasorler = useMemo(() => [...new Set(tum.map((p) => p.klasor).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "tr")), [tum]);
  const l = useMemo(() => {
    const q = ara.trim().toLocaleLowerCase("tr");
    const x = tum.filter((p) => (klasor === null || p.klasor === klasor) && (tur === "hepsi" || p.tur === tur)
      && (durum === "hepsi" || (durum === "yildizli" && p.yildiz) || (durum === "yayinda" && p.yayin) || (durum === "taslak" && !p.yayin) || (durum === "paylasilan" && p.ekipRol))
      && (!q || p.ad.toLocaleLowerCase("tr").includes(q) || p.altAlan.includes(q)));
    const s = [...x].sort((a, b) => sira === "ad" ? a.ad.localeCompare(b.ad, "tr") : sira === "olusturma" ? b.olusturma - a.olusturma : b.guncelleme - a.guncelleme);
    return [...s.filter((p) => p.yildiz), ...s.filter((p) => !p.yildiz)];
  }, [tum, ara, durum, tur, klasor, sira]);
  const turler = PROJE_TURLERI.filter((t) => tum.some((p) => p.tur === t.id));
  const paylasilanSayi = tum.filter((p) => p.ekipRol).length;
  /** Toplu işlemler yalnız kendi projelerine uygulanır (paylaşılanlarda yıldız, klasör ve silme sahibin). */
  const kendi = (ids: string[]) => ids.filter((id) => !tum.find((p) => p.id === id)?.ekipRol);

  const guncelle = async (ids: string[], g: { yildiz?: boolean; klasor?: string }) => {
    await Promise.all(kendi(ids).map((id) => api(`/api/build/proje/${id}`, { method: "PATCH", govde: g }).catch(() => {})));
    yenile();
  };
  const topluSil = async () => {
    setIsleniyor(true);
    const ids = kendi([...secim]);
    const silinen = (await Promise.all(ids.map((id) => api(`/api/build/proje/${id}`, { method: "DELETE" }).then(() => id).catch(() => null)))).filter((x): x is string => !!x);
    setIsleniyor(false); setSecim(new Set()); setSilOnay(false); yenile();
    if (silinen.length) silindi(silinen, tum.find((p) => p.id === silinen[0])?.ad ?? "Proje");
  };
  const sec = (id: string) => setSecim((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const adKaydet = async () => { if (adlandir && adlandir.ad.trim()) await api(`/api/build/proje/${adlandir.id}`, { method: "PATCH", govde: { ad: adlandir.ad.trim() } }).catch(() => {}); setAdlandir(null); yenile(); };
  const gorunumSec = (g: "izgara" | "liste") => { setGorunum(g); try { localStorage.setItem(goruntuAnahtari, g); } catch { /* yok */ } };

  const Ad = ({ p }: { p: ProjeOzet }) => adlandir?.id === p.id
    ? <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); adKaydet(); }}><input autoFocus value={adlandir.ad} maxLength={60} onChange={(e) => setAdlandir({ id: p.id, ad: e.target.value })} onBlur={adKaydet} onKeyDown={(e) => e.key === "Escape" && setAdlandir(null)} className="h-8 w-full rounded-[9px] bg-white/[0.08] px-2 text-[14px] text-white outline-none ring-1 ring-inset ring-white/25" /></form>
    : <span className="flex min-w-0 items-center gap-1.5"><span className="truncate text-[14.5px] font-medium text-white">{p.ad}</span>{p.yildiz && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-300 text-amber-300" />}</span>;

  return (
    <div className="space-y-4">
      <Kart ikon={FolderOpen} baslik="Projelerin" alt={projeler === null ? "Yükleniyor" : `${tum.length} proje${klasorler.length ? ` · ${klasorler.length} klasör` : ""}`}
        sag={<span className="flex items-center gap-2">{!!cop.l?.length && <CopDugmesi ac={() => { setGeriAl(null); setCopAcik(true); }} sayi={cop.l.length} />}<button type="button" onClick={yeni} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><Plus className="h-4 w-4" />Yeni proje</button></span>}
        govde="space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-9 min-w-[200px] flex-1 items-center gap-2 rounded-full bg-white/[0.06] px-3 text-white/45 ring-1 ring-inset ring-white/[0.06] focus-within:ring-white/25 sm:max-w-[320px]">
            <Search className="h-3.5 w-3.5 shrink-0" /><input ref={araKutu} value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Projelerde ara" className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/35" />
            <span className="hidden sm:inline"><kbd className="rounded-[5px] bg-white/[0.07] px-1.5 text-[10.5px] text-white/40">Ctrl K</kbd></span>
          </label>
          <LayoutGroup id="proje-durum">
            <div className="flex max-w-full overflow-x-auto rounded-full bg-white/[0.06] p-0.5 [scrollbar-width:none]">
              {([["hepsi", "Hepsi"], ["yildizli", "Yıldızlı"], ["yayinda", "Yayında"], ["taslak", "Taslak"], ["paylasilan", "Benimle paylaşılan"]] as [Durum, string][]).map(([id, ad]) => (
                <button key={id} type="button" onClick={() => setDurum(id)} className={cn("relative flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[12.5px] font-medium transition-colors", durum === id ? "text-black" : "text-white/60 hover:text-white")}>
                  {durum === id && <motion.span layoutId="proje-durum-z" transition={yay} className="absolute inset-0 rounded-full bg-white" />}<span className="relative">{ad}</span>
                  {id === "paylasilan" && paylasilanSayi > 0 && <span className={cn("relative tabular-nums", durum === id ? "text-black/50" : "text-white/35")}>{paylasilanSayi}</span>}
                </button>
              ))}
            </div>
          </LayoutGroup>
          <span className="flex-1" />
          <div className="flex rounded-full bg-white/[0.06] p-0.5 text-[12.5px]">
            {([["duzenleme", "Son düzenlenen"], ["olusturma", "Yeni"], ["ad", "Ad"]] as [Sira, string][]).map(([id, ad]) => <button key={id} type="button" onClick={() => setSira(id)} className={cn("h-8 rounded-full px-3 transition-colors", sira === id ? "bg-white/[0.1] text-white ring-1 ring-inset ring-white/60" : "text-white/55 hover:text-white")}>{ad}</button>)}
          </div>
          <div className="flex rounded-full bg-white/[0.06] p-0.5">
            <button type="button" aria-label="Izgara" onClick={() => gorunumSec("izgara")} className={cn("flex h-8 w-9 items-center justify-center rounded-full", gorunum === "izgara" ? "bg-white text-black" : "text-white/55 hover:text-white")}><LayoutGrid className="h-3.5 w-3.5" /></button>
            <button type="button" aria-label="Liste" onClick={() => gorunumSec("liste")} className={cn("flex h-8 w-9 items-center justify-center rounded-full", gorunum === "liste" ? "bg-white text-black" : "text-white/55 hover:text-white")}><List className="h-3.5 w-3.5" /></button>
          </div>
        </div>
        {(klasorler.length > 0 || turler.length > 1) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {klasorler.length > 0 && (
              <>
                <button type="button" onClick={() => setKlasor(null)} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] transition-colors", klasor === null ? "bg-white/[0.1] text-white ring-1 ring-inset ring-white/60" : "bg-white/[0.04] text-white/60 hover:text-white")}><FolderOpen className="h-3.5 w-3.5" />Tüm klasörler</button>
                {klasorler.map((k) => <button key={k} type="button" onClick={() => setKlasor(k)} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] transition-colors", klasor === k ? "bg-white/[0.1] text-white ring-1 ring-inset ring-white/60" : "bg-white/[0.04] text-white/60 hover:text-white")}><Folder className="h-3.5 w-3.5" />{k}<span className="tabular-nums text-white/40">{tum.filter((p) => p.klasor === k).length}</span></button>)}
                {turler.length > 1 && <span className="mx-1 h-5 w-px bg-white/[0.08]" />}
              </>
            )}
            {turler.length > 1 && [{ id: "hepsi" as const, ad: "Her tür" }, ...turler.map((t) => ({ id: t.id, ad: t.ad }))].map((t) => (
              <button key={t.id} type="button" onClick={() => setTur(t.id)} className={cn("h-8 rounded-full px-3 text-[12.5px] transition-colors", tur === t.id ? "bg-white/[0.1] text-white ring-1 ring-inset ring-white/60" : "bg-white/[0.04] text-white/60 hover:text-white")}>{t.ad}</button>
            ))}
          </div>
        )}
      </Kart>

      {projeler === null ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[16/12] animate-pulse rounded-[20px] bg-white/[0.04]" />)}</div>
      ) : !l.length ? (
        <div className="rounded-[22px] bg-white/[0.02] px-6 py-14 text-center ring-1 ring-inset ring-white/[0.06]">
          <p className="text-[15px] font-medium text-white">{durum === "paylasilan" && !paylasilanSayi ? "Seninle paylaşılan proje yok" : tum.length ? "Bu süzgece uyan proje yok" : "Henüz proje yok"}</p>
          <p className="mx-auto mt-1 max-w-[440px] text-[13px] text-white/50">{durum === "paylasilan" && !paylasilanSayi ? "Biri seni ekibine davet edince proje burada görünür. Davet bağlantısını açıp Projeye katıl demen yeterli." : tum.length ? "Aramayı ya da süzgeçleri değiştir." : "Ne yapmak istediğini yaz; ilk projen saniyeler içinde hazır."}</p>
          {!tum.length && <button type="button" onClick={yeni} className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black"><Plus className="h-4 w-4" />Yeni proje</button>}
        </div>
      ) : gorunum === "izgara" ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 max-[420px]:grid-cols-1">
          {l.map((p) => {
            const I = TUR_IKON[p.tur];
            const secili = secim.has(p.id);
            return (
              <div key={p.id} role="link" tabIndex={0} onClick={() => (secim.size ? sec(p.id) : adlandir?.id !== p.id && router.push(`/panel/build/${p.id}`))} onKeyDown={(e) => { if (e.key === "Enter") router.push(`/panel/build/${p.id}`); }}
                className={cn("group relative cursor-pointer rounded-[20px] bg-white/[0.03] text-left ring-inset transition-[background-color,box-shadow] hover:bg-white/[0.05]", secili ? "ring-2 ring-white" : "ring-1 ring-white/[0.07] hover:ring-white/[0.16]")}>
                <div className="relative aspect-[16/10] overflow-hidden rounded-t-[20px] bg-[#16171a]">
                  <ProjeKapagi p={p} />
                  <span className={cn("absolute left-2.5 top-2.5 transition-opacity", secili || secim.size ? "opacity-100" : "opacity-0 group-hover:opacity-100 max-md:opacity-100")}><SecimKutusu secili={secili} degis={() => sec(p.id)} /></span>
                  <span className={cn("absolute bottom-2.5 left-2.5 right-2.5", secim.size && "opacity-0")}><Durumlar p={p} /></span>
                  <button type="button" aria-label="Proje menüsü" onClick={(e) => { e.stopPropagation(); setMenu(menu === p.id ? null : p.id); }}
                    className={cn("absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition-opacity hover:bg-black/75", menu === p.id ? "opacity-100" : "opacity-0 group-hover:opacity-100 max-md:opacity-100")}><MoreHorizontal className="h-4 w-4" /></button>
                </div>
                <AnimatePresence>{menu === p.id && <Menu p={p} klasorler={klasorler} kapat={() => setMenu(null)} yenile={yenile} adlandir={() => setAdlandir({ id: p.id, ad: p.ad })} guncelle={(g) => guncelle([p.id], g)} panelAc={(t) => setPanel({ tur: t, id: p.id })} silindi={silindi} />}</AnimatePresence>
                <div className="flex items-center gap-3 p-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.07] text-white/75"><I className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <Ad p={p} />
                    <span className="block truncate text-[12px] text-white/45">{p.ekipRol ? `${p.sahipAd || "Sahibi"} paylaştı` : p.taslak ? `${p.taslak.anaAd} dalı` : TUR_AD[p.tur]} · {gorece(p.guncelleme)}{p.klasor ? ` · ${p.klasor}` : ""}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[22px] bg-white/[0.02] ring-1 ring-inset ring-white/[0.07]">
          <div className="grid grid-cols-[28px_minmax(0,1fr)_120px_150px_110px_40px] items-center gap-3 border-b border-white/[0.06] px-4 py-2.5 text-[12px] text-white/45 max-md:hidden">
            <SecimKutusu secili={!!l.length && l.every((p) => secim.has(p.id))} degis={() => setSecim(l.every((p) => secim.has(p.id)) ? new Set() : new Set(l.map((p) => p.id)))} />
            <span>Proje</span><span>Durum</span><span>Son düzenleme</span><span>Sürüm</span><span />
          </div>
          {l.map((p) => {
            const secili = secim.has(p.id);
            return (
              <div key={p.id} onClick={() => (secim.size ? sec(p.id) : adlandir?.id !== p.id && router.push(`/panel/build/${p.id}`))} className={cn("group relative grid cursor-pointer grid-cols-[28px_minmax(0,1fr)_120px_150px_110px_40px] items-center gap-3 border-b border-white/[0.04] px-4 py-2.5 last:rounded-b-[22px] last:border-b-0 max-md:grid-cols-[28px_minmax(0,1fr)_40px]", secili ? "bg-white/[0.05]" : "hover:bg-white/[0.03]")}>
                <SecimKutusu secili={secili} degis={() => sec(p.id)} />
                <span className="flex min-w-0 items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <ProjeKapagi p={p} kucuk />
                  <span className="min-w-0"><Ad p={p} /><span className="block truncate text-[12px] text-white/45">{p.ekipRol ? `${p.sahipAd || "Sahibi"} paylaştı` : TUR_AD[p.tur]}{p.klasor ? ` · ${p.klasor}` : ""}</span></span>
                </span>
                <span className="flex flex-col max-md:hidden">{p.yayin ? <span className="inline-flex items-center gap-1.5 text-[12.5px] text-white/80"><span className="h-1.5 w-1.5 rounded-full bg-[#55d6fd]" />Yayında{p.sonSurumNo > p.yayin.surumNo && <span className="text-amber-200/80"> · değişti</span>}</span> : <span className="text-[12.5px] text-white/45">Taslak</span>}{paylasilan[p.id] && <span className="text-[11.5px] text-[#a8ecff]/80">Paylaşılıyor</span>}{p.ekipRol && <span className="text-[11.5px] text-white/50">{p.ekipRol === "izleyici" ? "İzleyici" : "Düzenleyici"}</span>}</span>
                <span className="text-[12.5px] text-white/55 max-md:hidden">{gorece(p.guncelleme)}</span>
                <span className="text-[12.5px] tabular-nums text-white/55 max-md:hidden">{p.surumSayisi}</span>
                <button type="button" aria-label="Proje menüsü" onClick={(e) => { e.stopPropagation(); setMenu(menu === p.id ? null : p.id); }} className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.07] hover:text-white"><MoreHorizontal className="h-4 w-4" /></button>
                <AnimatePresence>{menu === p.id && <Menu p={p} klasorler={klasorler} kapat={() => setMenu(null)} yenile={yenile} adlandir={() => setAdlandir({ id: p.id, ad: p.ad })} guncelle={(g) => guncelle([p.id], g)} panelAc={(t) => setPanel({ tur: t, id: p.id })} silindi={silindi} />}</AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* toplu işlem çubuğu */}
      <AnimatePresence>
        {secim.size > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={yay} className="cam-istemci fixed bottom-5 left-1/2 z-50 flex w-[min(720px,calc(100vw-24px))] -translate-x-1/2 flex-wrap items-center gap-2 rounded-[22px] px-3 py-2.5">
            <span className="px-1.5 text-[13px] font-medium text-white">{secim.size} proje seçili</span>
            <span className="flex-1" />
            {topluKlasor !== null ? (
              <form onSubmit={async (e) => { e.preventDefault(); await guncelle([...secim], { klasor: topluKlasor }); setTopluKlasor(null); setSecim(new Set()); }} className="flex items-center gap-1.5">
                <input autoFocus list="klasor-listesi" value={topluKlasor} onChange={(e) => setTopluKlasor(e.target.value)} maxLength={40} placeholder="Klasör adı" className="h-9 w-[160px] rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/15 placeholder:text-white/35 focus:ring-white/40" />
                <datalist id="klasor-listesi">{klasorler.map((k) => <option key={k} value={k} />)}</datalist>
                <button className="h-9 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black">Taşı</button>
                <button type="button" onClick={() => setTopluKlasor(null)} className="h-9 rounded-full px-3 text-[12.5px] text-white/60 hover:text-white">Vazgeç</button>
              </form>
            ) : silOnay ? (
              <>
                <span className="text-[12.5px] text-rose-100/80">Çöp kutusuna taşınır, 30 gün geri alınabilir</span>
                <button type="button" disabled={isleniyor} onClick={topluSil} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-rose-500 px-4 text-[12.5px] font-semibold text-white">{isleniyor && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{secim.size} projeyi çöpe taşı</button>
                <button type="button" onClick={() => setSilOnay(false)} className="h-9 rounded-full px-3 text-[12.5px] text-white/60 hover:text-white">Vazgeç</button>
              </>
            ) : (
              <>
                <button type="button" onClick={async () => { await guncelle([...secim], { yildiz: true }); setSecim(new Set()); }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white hover:bg-white/[0.13]"><Star className="h-3.5 w-3.5" />Yıldızla</button>
                <button type="button" onClick={() => setTopluKlasor("")} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white hover:bg-white/[0.13]"><FolderInput className="h-3.5 w-3.5" />Klasöre taşı</button>
                <button type="button" onClick={() => setSilOnay(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-rose-200 hover:bg-rose-500/15"><Trash2 className="h-3.5 w-3.5" />Sil</button>
                <button type="button" onClick={() => setSecim(new Set())} aria-label="Seçimi kaldır" className="flex h-9 w-9 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <PaylasPaneli projeId={panel?.tur === "paylas" ? panel.id : null} acik={panel?.tur === "paylas"} kapat={() => setPanel(null)} toplulugaEkle={() => setPanel((x) => (x ? { tur: "topluluk", id: x.id } : x))} />
      <ToplulugaEklePaneli projeId={panel?.tur === "topluluk" ? panel.id : null} acik={panel?.tur === "topluluk"} kapat={() => setPanel(null)} />
      <CopPaneli acik={copAcik} kapat={() => setCopAcik(false)} cop={cop} yenile={yenile} />
      <GeriAlBildirimi olay={geriAl} kapat={() => setGeriAl(null)} yenile={() => { yenile(); cop.yukle(); }} />
    </div>
  );
}
