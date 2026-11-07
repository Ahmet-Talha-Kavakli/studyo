"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, ArchiveRestore, Bot, Brain, CalendarClock, CheckSquare, FolderInput, FolderMinus, Ghost, Import, Layers, Loader2, MessageSquare, MoreHorizontal, Pencil, Pin, PinOff, Plus, Search, Trash2, Users, X, Lock } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { SaglayiciLogo } from "@/components/build/ModelSecici";
import { studyoYenile } from "@/components/build/kabuk/useStudyo";
import { api, gorece } from "@/lib/build/istemci";
import { modelBul } from "@/lib/build/modeller";
import { tarihGrubu, TARIH_GRUPLARI } from "@/lib/build/sohbetYol";
import { cn } from "@/lib/utils";
import { katla } from "@/lib/build/sohbetTipler";
import { IceAktarPaneli, KaynakSimge } from "./IceAktar";
import { Acilir, MenuSatir, useAcilir, Secici } from "./ortak";
import type { Baglam, SohbetOzet } from "./tipler";

type Filtre = "tumu" | "sabit" | "arsiv";

/** Satır menüsü: adlandır, sabitle, klasöre taşı, arşivle, sil. */
export function SohbetMenusu({ o, klasorler, degisti, adlandir, klasorsuz }: { o: SohbetOzet; klasorler: Baglam["klasorler"]; degisti: (silindi?: boolean) => void; adlandir: () => void; klasorsuz?: boolean }) {
  const a = useAcilir(240);
  const [klasorMenu, setKlasorMenu] = useState(false);
  const [silOnay, setSilOnay] = useState(false);
  useEffect(() => { if (!a.acik) { setKlasorMenu(false); setSilOnay(false); } }, [a.acik]);
  const yama = async (g: Record<string, unknown>) => { a.setAcik(false); await api(`/api/build/sohbet/${o.id}`, { method: "PATCH", govde: g }).catch(() => {}); degisti(); studyoYenile(); };
  return (
    <div ref={a.kok} className="relative z-[2]">
      <button type="button" onClick={(e) => { e.preventDefault(); a.setAcik(!a.acik); }} aria-label="Sohbet menüsü" className={cn("flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-opacity hover:bg-white/[0.08] hover:text-white", a.acik ? "opacity-100" : "opacity-0 group-hover/satir:opacity-100 max-sm:opacity-100")}><MoreHorizontal className="h-4 w-4" /></button>
      <Acilir a={a}>
        {klasorMenu ? (
          <>
            <p className="px-2.5 pb-1 pt-1.5 text-[11.5px] font-medium text-white/45">Klasöre taşı</p>
            {klasorler.map((k) => <MenuSatir key={k.id} ikon={<span className="h-3 w-3 rounded-[4px]" style={{ background: k.renk }} />} ad={k.ad} secili={k.id === o.klasor} onClick={() => yama({ klasor: k.id })} />)}
            {!klasorler.length && <p className="px-2.5 py-2 text-[12.5px] text-white/50">Henüz klasör yok.</p>}
            {o.klasor && <MenuSatir ikon={<FolderMinus className="h-4 w-4" />} ad="Klasörden çıkar" onClick={() => yama({ klasor: null })} />}
          </>
        ) : (
          <>
            <MenuSatir ikon={<Pencil className="h-4 w-4" />} ad="Adlandır" onClick={() => { a.setAcik(false); adlandir(); }} />
            {!o.arsiv && <MenuSatir ikon={o.sabit ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />} ad={o.sabit ? "Sabitlemeyi kaldır" : "Sabitle"} onClick={() => yama({ sabit: !o.sabit })} />}
            {!o.ajanId && !klasorsuz && <MenuSatir ikon={<FolderInput className="h-4 w-4" />} ad="Klasöre taşı" onClick={() => setKlasorMenu(true)} />}
            <MenuSatir ikon={o.arsiv ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />} ad={o.arsiv ? "Arşivden çıkar" : "Arşivle"} onClick={() => yama({ arsiv: !o.arsiv })} />
            <div className="my-1 h-px bg-white/[0.07]" />
            <MenuSatir tehlike secili={silOnay} ikon={<Trash2 className="h-4 w-4" />} ad={silOnay ? "Silmek için tekrar tıkla" : "Sil"} onClick={async () => { if (!silOnay) { setSilOnay(true); return; } a.setAcik(false); await api(`/api/build/sohbet/${o.id}`, { method: "DELETE" }).catch(() => {}); degisti(true); studyoYenile(); }} />
          </>
        )}
      </Acilir>
    </div>
  );
}

/** Sohbet satırı: model logosu, başlık, son yanıt ya da arama eşleşmesi, klasör, zaman, menü. */
export function SohbetSatiri({ o, klasorler, degisti, ara, secim }: { o: SohbetOzet; klasorler: Baglam["klasorler"]; degisti: () => void; ara?: string; secim?: { secili: boolean; degistir: () => void } }) {
  const [ad, setAd] = useState<string | null>(null);
  const k = klasorler.find((x) => x.id === o.klasor);
  const m = modelBul(o.model);
  // Vurgu: sorgudaki her kelime (Türkçe karakter ve büyük harf duyarsız; "tam ifade" ve -hariç ayıklanır).
  const vurgu = (t: string) => {
    const terimler = (ara ?? "").replace(/"([^"]+)"/g, " $1 ").split(/\s+/).filter((x) => x.length > 1 && !x.startsWith("-")).map(katla);
    if (!terimler.length) return t;
    const k = katla(t);
    const isaret = new Array(t.length).fill(false);
    for (const x of terimler) { let i = k.indexOf(x); while (i >= 0) { for (let j = i; j < i + x.length && j < t.length; j++) isaret[j] = true; i = k.indexOf(x, i + x.length); } }
    const o2: React.ReactNode[] = [];
    let bas = 0;
    for (let i = 1; i <= t.length; i++) if (i === t.length || isaret[i] !== isaret[bas]) { const p = t.slice(bas, i); o2.push(isaret[bas] ? <mark key={bas} className="rounded-[3px] bg-[#55d6fd]/25 px-0.5 text-white">{p}</mark> : p); bas = i; }
    return <>{o2}</>;
  };
  const eslesmeler = (o as SohbetOzet & { eslesmeler?: { mesajId: string; rol: string; parca: string }[] }).eslesmeler;
  return (
    <motion.li layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="group/satir relative flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-white/[0.035] sm:px-4">
      {secim ? <button type="button" onClick={secim.degistir} className="absolute inset-0 z-[1]" aria-label={`${o.baslik} seç`} aria-pressed={secim.secili} />
        : <Link href={`/panel/build/sohbet/${o.id}`} className="absolute inset-0 z-[1]" aria-label={o.baslik} />}
      {secim && <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-2 transition-colors", secim.secili ? "ring-white" : "ring-white/25")}>{secim.secili && <span className="h-2.5 w-2.5 rounded-full bg-white" />}</span>}
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
        {o.ajanId ? <Users className="h-4 w-4 text-white/70" /> : o.kaynak ? <KaynakSimge k={o.kaynak} boyut={18} /> : <SaglayiciLogo m={m} boyut={18} />}
        {o.calisiyor && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#55d6fd] ring-2 ring-[#121315]" />}
      </span>
      <span className="min-w-0 flex-1">
        {ad !== null ? (
          <form className="relative z-[2]" onSubmit={async (e) => { e.preventDefault(); const b = ad.trim(); setAd(null); if (b && b !== o.baslik) { await api(`/api/build/sohbet/${o.id}`, { method: "PATCH", govde: { baslik: b } }).catch(() => {}); degisti(); studyoYenile(); } }}>
            <input autoFocus value={ad} onChange={(e) => setAd(e.target.value)} onBlur={(e) => e.currentTarget.form?.requestSubmit()} maxLength={80} className="h-8 w-full max-w-[420px] rounded-[9px] bg-white/[0.06] px-2.5 text-[14px] text-white outline-none ring-1 ring-inset ring-[#55d6fd]/50" />
          </form>
        ) : (
          <span className="flex items-center gap-1.5">
            {o.sabit && <Pin className="h-3.5 w-3.5 shrink-0 text-[#55d6fd]" />}
            {o.kilitli && <Lock className="h-3.5 w-3.5 shrink-0 text-white/50" aria-label="Kilitli" />}
            <span className="truncate text-[14px] font-medium text-white">{vurgu(o.baslik)}</span>
            {k && <span className="hidden shrink-0 items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11.5px] text-white/60 sm:flex"><span className="h-2 w-2 rounded-[3px]" style={{ background: k.renk }} />{k.ad}</span>}
            {o.kaynak && <span className="hidden shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11.5px] text-white/55 sm:inline">{o.kaynak === "chatgpt" ? "ChatGPT'den" : o.kaynak === "claude" ? "Claude'dan" : "İçe aktarıldı"}</span>}
          </span>
        )}
        {eslesmeler?.length ? (
          <span className="mt-0.5 flex flex-col gap-0.5">
            {eslesmeler.map((x) => <Link key={x.mesajId} href={`/panel/build/sohbet/${o.id}?m=${x.mesajId}`} className="relative z-[2] block truncate rounded-[6px] text-[12.5px] text-white/50 hover:text-white/85"><span className="mr-1.5 text-white/30">{x.rol === "kullanici" ? "Sen" : "Vayra"}</span>{vurgu(x.parca)}</Link>)}
          </span>
        ) : <span className="block truncate text-[12.5px] text-white/45">{o.parca ? vurgu(o.parca) : o.ozet || "Yanıt yok"}</span>}
      </span>
      <span className="shrink-0 text-[12px] tabular-nums text-white/40 max-sm:hidden">{gorece(o.guncelleme)}</span>
      {!secim && <SohbetMenusu o={o} klasorler={klasorler} degisti={degisti} adlandir={() => setAd(o.baslik)} />}
    </motion.li>
  );
}

const BASLANGICLAR = [
  { metin: "Bu hafta yapay zekâda neler oldu? Kaynaklarıyla özetle", istek: { arastirma: true } },
  { metin: "Kahve markam için 4 logo fikri üret", istek: { arac: "gorsel_uret" } },
  { metin: "Bir e-posta taslağını daha net ve kibar hale getir" },
  { metin: "Python ile CSV dosyasındaki satışları aylara göre topla" },
];

/** Telefonda başlık kartının ikincil bağlantıları tek menüde (başlık sıkışmasın). */
function MobilMenu({ iceAc }: { iceAc: () => void }) {
  const a = useAcilir(240);
  const router = useRouter();
  const git = (y: string) => { a.setAcik(false); router.push(y); };
  return (
    <div ref={a.kok} className="sm:hidden">
      <button type="button" onClick={() => a.setAcik(!a.acik)} aria-label="Diğer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-white/85"><MoreHorizontal className="h-4 w-4" /></button>
      <Acilir a={a}>
        <MenuSatir ikon={<Bot className="h-4 w-4" />} ad="Asistanlar" onClick={() => git("/panel/build/sohbet/asistanlar")} />
        <MenuSatir ikon={<CalendarClock className="h-4 w-4" />} ad="Görevler" onClick={() => git("/panel/build/sohbet/gorevler")} />
        <MenuSatir ikon={<Layers className="h-4 w-4" />} ad="Çıktılar" onClick={() => git("/panel/build/sohbet/ciktilar")} />
        <MenuSatir ikon={<Import className="h-4 w-4" />} ad="İçe aktar" onClick={() => { a.setAcik(false); iceAc(); }} />
        <MenuSatir ikon={<Brain className="h-4 w-4" />} ad="Bellek" onClick={() => git("/panel/build/sohbet/bellek")} />
      </Acilir>
    </div>
  );
}

/** Sohbetler sayfası: arama (bütün dallarda), Tümü / Sabitlenenler / Arşiv, tarih grupları, satır menüsü. */
export function SohbetListesi() {
  const router = useRouter();
  const [l, setL] = useState<SohbetOzet[] | null>(null);
  const [arsiv, setArsiv] = useState<SohbetOzet[] | null>(null);
  const [filtre, setFiltre] = useState<Filtre>("tumu");
  const [ara, setAra] = useState("");
  const [sonuc, setSonuc] = useState<SohbetOzet[] | null>(null);
  const [araniyor, setAraniyor] = useState(false);
  const [klasorler, setKlasorler] = useState<Baglam["klasorler"]>([]);
  const [bellek, setBellek] = useState<Baglam["bellek"] | null>(null);
  const [iceAcik, setIceAcik] = useState(false);
  const [gun, setGun] = useState(0);
  const [tur, setTur] = useState<"" | "dosya" | "gorsel" | "kod" | "tuval">("");
  const [arsivDahil, setArsivDahil] = useState(false);
  const [secimModu, setSecimModu] = useState(false);
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [topluGidiyor, setTopluGidiyor] = useState("");
  const [klasorMenu, setKlasorMenu] = useState(false);
  const toplu = async (islem: string, klasor?: string | null) => {
    setTopluGidiyor(islem);
    await api("/api/build/sohbet/toplu", { govde: { kimlikler: [...secili], islem, klasor } }).catch(() => {});
    setTopluGidiyor(""); setSecili(new Set()); setSecimModu(false); setKlasorMenu(false); yenile(); studyoYenile();
  };
  const yenile = () => {
    api<{ sohbetler: SohbetOzet[] }>("/api/build/sohbet").then((v) => setL(v.sohbetler)).catch(() => setL([]));
    api<{ sohbetler: SohbetOzet[] }>("/api/build/sohbet?arsiv=1").then((v) => setArsiv(v.sohbetler)).catch(() => setArsiv([]));
  };
  useEffect(() => { yenile(); api<Baglam>("/api/build/sohbet/baglam").then((v) => { setKlasorler(v.klasorler); setBellek(v.bellek); }).catch(() => {}); }, []);
  const suzgec = !!(gun || tur);
  useEffect(() => {
    const q = ara.trim();
    if (!q && !suzgec) { setSonuc(null); return; }
    setAraniyor(true);
    const p = new URLSearchParams({ q, ...(gun ? { gun: String(gun) } : {}), ...(tur ? { tur } : {}), ...(arsivDahil ? { arsiv: "1" } : {}) });
    const t = setTimeout(() => api<{ sonuclar: SohbetOzet[] }>(`/api/build/sohbet/ara?${p}`).then((v) => setSonuc(v.sonuclar)).catch(() => setSonuc([])).finally(() => setAraniyor(false)), 220);
    return () => clearTimeout(t);
  }, [ara, gun, tur, arsivDahil, suzgec]);
  const kaynak = sonuc ?? (filtre === "arsiv" ? arsiv : filtre === "sabit" ? l?.filter((x) => x.sabit) ?? null : l);
  const gruplar = useMemo(() => {
    if (!kaynak) return [];
    if (sonuc) return [["Sonuçlar", kaynak] as const];
    const sabit = filtre === "tumu" ? kaynak.filter((x) => x.sabit) : [];
    const kalan = filtre === "tumu" ? kaynak.filter((x) => !x.sabit) : kaynak;
    const g: [string, SohbetOzet[]][] = sabit.length ? [["Sabitlenenler", sabit]] : [];
    for (const ad of TARIH_GRUPLARI) { const x = kalan.filter((o) => tarihGrubu(o.guncelleme) === ad); if (x.length) g.push([ad, x]); }
    return g;
  }, [kaynak, sonuc, filtre]);
  const toplam = l?.length ?? 0;

  return (
    <div className="mx-auto max-w-[1100px] space-y-5 px-4 pb-24 pt-16 sm:px-6 md:pt-8">
      <Kart ikon={MessageSquare} baslik="Sohbetler" alt={l ? `${toplam} sohbet${arsiv?.length ? ` · ${arsiv.length} arşivde` : ""}` : "Yükleniyor"} govde=""
        sag={<>
          <Link href="/panel/build/sohbet/asistanlar" title="Hazır asistanlar" className="max-sm:hidden inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[13px] text-white/85 hover:bg-white/[0.12] max-lg:w-9 max-lg:justify-center max-lg:px-0"><Bot className="h-4 w-4" /><span className="max-lg:hidden">Asistanlar</span></Link>
          <Link href="/panel/build/sohbet/gorevler" title="Zamanlanmış görevler" className="max-sm:hidden inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[13px] text-white/85 hover:bg-white/[0.12] max-lg:w-9 max-lg:justify-center max-lg:px-0"><CalendarClock className="h-4 w-4" /><span className="max-lg:hidden">Görevler</span></Link>
          <Link href="/panel/build/sohbet/ciktilar" title="Çıktılar: sohbetlerde üretilen dosyalar, görseller ve sayfalar" className="max-sm:hidden inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[13px] text-white/85 hover:bg-white/[0.12] max-md:w-9 max-md:justify-center max-md:px-0"><Layers className="h-4 w-4" /><span className="max-md:hidden">Çıktılar</span></Link>
          <button type="button" onClick={() => setIceAcik(true)} title="ChatGPT ya da Claude'dan sohbet ve hafıza getir" className="max-sm:hidden inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[13px] text-white/85 hover:bg-white/[0.12] max-md:w-9 max-md:justify-center max-md:px-0"><Import className="h-4 w-4" /><span className="max-md:hidden">İçe aktar</span></button>
          <Link href="/panel/build/sohbet/bellek" title="Bellek" className="max-sm:hidden inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[13px] text-white/85 hover:bg-white/[0.12] max-md:w-9 max-md:justify-center max-md:px-0"><Brain className="h-4 w-4" /><span className="max-md:hidden">Bellek</span>{bellek && !bellek.acik && <span className="rounded-full bg-amber-400/15 px-1.5 text-[11px] text-amber-200 max-md:hidden">duraklatıldı</span>}</Link>
          <MobilMenu iceAc={() => setIceAcik(true)} />
          <Link href="/panel/build/sohbet/yeni" title="Yeni sohbet" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black max-sm:w-9 max-sm:justify-center max-sm:px-0"><Plus className="h-4 w-4" /><span className="max-sm:hidden">Yeni sohbet</span></Link>
        </>}>
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-3 py-3 sm:px-4">
          <label className="flex h-10 w-full min-w-0 items-center gap-2 rounded-[14px] bg-white/[0.05] px-3.5 text-white/45 ring-1 ring-inset ring-white/[0.07] focus-within:ring-white/25 sm:w-auto sm:min-w-[280px] sm:flex-1">
            {araniyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Sohbetlerde ara: kelimeler, &quot;tam ifade&quot;, -hariç" className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/40" />
            {(ara || suzgec) && <button type="button" onClick={() => { setAra(""); setGun(0); setTur(""); }} aria-label="Aramayı temizle" className="flex h-6 w-6 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.08] hover:text-white"><X className="h-3.5 w-3.5" /></button>}
            <span className="flex gap-1 text-[11px] max-sm:hidden"><kbd>Ctrl</kbd><kbd>K</kbd></span>
          </label>
          {!sonuc && <Secici id="sohbet-filtre" deger={filtre} set={setFiltre} l={[{ id: "tumu", ad: "Tümü" }, { id: "sabit", ad: "Sabitlenenler" }, { id: "arsiv", ad: `Arşiv${arsiv?.length ? ` ${arsiv.length}` : ""}` }]} />}
          <button type="button" onClick={() => { setSecimModu((x) => !x); setSecili(new Set()); }} aria-pressed={secimModu} className={cn("inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] transition-colors", secimModu ? "bg-white text-black" : "bg-white/[0.06] text-white/75 hover:text-white")}><CheckSquare className="h-4 w-4" />{secimModu ? "Seçimi bitir" : "Seç"}</button>
          <div className="flex w-full items-center gap-1.5 overflow-x-auto [scrollbar-width:none] sm:flex-wrap [&>*]:shrink-0">
            {[{ v: 0, ad: "Her zaman" }, { v: 1, ad: "Bugün" }, { v: 7, ad: "7 gün" }, { v: 30, ad: "30 gün" }].map((x) => <button key={x.v} type="button" onClick={() => setGun(x.v)} className={cn("h-8 rounded-full px-3 text-[12.5px] transition-colors", gun === x.v ? "bg-white/[0.14] text-white ring-1 ring-inset ring-white/60" : "bg-white/[0.04] text-white/60 hover:text-white")}>{x.ad}</button>)}
            <span className="mx-1 h-4 w-px bg-white/[0.1]" />
            {([["", "Her tür"], ["dosya", "Dosyalı"], ["gorsel", "Görselli"], ["kod", "Kodlu"], ["tuval", "Tuvalli"]] as const).map(([v, ad]) => <button key={v} type="button" onClick={() => setTur(v)} className={cn("h-8 rounded-full px-3 text-[12.5px] transition-colors", tur === v ? "bg-white/[0.14] text-white ring-1 ring-inset ring-white/60" : "bg-white/[0.04] text-white/60 hover:text-white")}>{ad}</button>)}
            {sonuc && <button type="button" onClick={() => setArsivDahil((x) => !x)} aria-pressed={arsivDahil} className={cn("ml-auto inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] transition-colors", arsivDahil ? "bg-white/[0.14] text-white ring-1 ring-inset ring-white/60" : "bg-white/[0.04] text-white/60 hover:text-white")}><Archive className="h-3.5 w-3.5" />Arşiv dahil</button>}
          </div>
        </div>
        {kaynak === null ? (
          <div className="space-y-2 p-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-[14px] bg-white/[0.03]" />)}</div>
        ) : !kaynak.length ? (
          sonuc ? <p className="px-5 py-8 text-center text-[13.5px] text-white/50">&quot;{ara.trim()}&quot; geçen bir sohbet yok.</p>
            : filtre === "arsiv" ? <p className="px-5 py-8 text-center text-[13.5px] text-white/50">Arşivde sohbet yok. Bir sohbeti menüsünden arşivleyebilirsin.</p>
              : filtre === "sabit" ? <p className="px-5 py-8 text-center text-[13.5px] text-white/50">Sabitlenen sohbet yok. Sık döndüğün sohbetleri menüden sabitle.</p>
                : (
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-3 rounded-[18px] bg-white/[0.035] p-4 ring-1 ring-inset ring-white/[0.06]">
                      <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><MessageSquare className="h-5 w-5" /></span>
                      <span className="min-w-[200px] flex-1"><span className="block text-[14.5px] font-semibold text-white">Henüz sohbet yok</span><span className="block text-[13px] text-white/55">Sor, araştırt, dosya yükle ya da görsel ve video ürettir.</span></span>
                      <Link href="/panel/build/sohbet/yeni?gecici=1" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] text-white hover:bg-white/[0.13]"><Ghost className="h-4 w-4" />Geçici sohbet</Link>
                      <Link href="/panel/build/sohbet/yeni" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><Plus className="h-4 w-4" />Yeni sohbet</Link>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {BASLANGICLAR.map((b) => <button key={b.metin} type="button" onClick={() => { try { sessionStorage.setItem("vayra-sohbet-taslak", JSON.stringify(b)); } catch { /* yok */ } router.push("/panel/build/sohbet/yeni"); }} className="rounded-[16px] bg-white/[0.035] px-3.5 py-3 text-left text-[13.5px] text-white/75 ring-1 ring-inset ring-white/[0.06] transition-colors hover:bg-white/[0.07] hover:text-white">{b.metin}</button>)}
                    </div>
                  </div>
                )
        ) : (
          <div className="pb-2">
            {gruplar.map(([ad, x]) => (
              <section key={ad}>
                <p className="flex items-center gap-2 px-4 pb-1 pt-3.5 text-[12px] font-medium text-white/45 sm:px-5">{ad}<span className="rounded-full bg-white/[0.06] px-1.5 text-[11px] text-white/45">{x.length}</span></p>
                <ul className="divide-y divide-white/[0.04]"><AnimatePresence initial={false}>{x.map((o) => <SohbetSatiri key={o.id} o={o} klasorler={klasorler} degisti={yenile} ara={sonuc ? ara : undefined} secim={secimModu ? { secili: secili.has(o.id), degistir: () => setSecili((l) => { const y = new Set(l); if (y.has(o.id)) y.delete(o.id); else y.add(o.id); return y; }) } : undefined} />)}</AnimatePresence></ul>
              </section>
            ))}
          </div>
        )}
      </Kart>
      <AnimatePresence>
        {secimModu && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="cam-istemci fixed bottom-4 left-1/2 z-40 flex w-[min(680px,calc(100vw-24px))] -translate-x-1/2 flex-wrap items-center gap-1.5 rounded-[22px] p-2">
            <span className="px-2 text-[13px] text-white/80"><b className="font-semibold text-white">{secili.size}</b> seçili</span>
            <button type="button" onClick={() => setSecili(new Set((kaynak ?? []).map((x) => x.id)))} className="h-9 rounded-full px-3 text-[12.5px] text-white/70 hover:bg-white/[0.07]">Hepsini seç</button>
            <span className="ml-auto" />
            {klasorMenu ? (
              <>
                {klasorler.map((k) => <button key={k.id} type="button" disabled={!secili.size || !!topluGidiyor} onClick={() => toplu("klasor", k.id)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-white disabled:opacity-40"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: k.renk }} />{k.ad}</button>)}
                {!klasorler.length && <span className="text-[12.5px] text-white/50">Henüz klasör yok</span>}
                <button type="button" onClick={() => setKlasorMenu(false)} aria-label="Geri" className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07]"><X className="h-4 w-4" /></button>
              </>
            ) : (
              <>
                <button type="button" disabled={!secili.size || !!topluGidiyor} onClick={() => setKlasorMenu(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-white disabled:opacity-40"><FolderInput className="h-4 w-4" /><span className="max-sm:hidden">Klasöre taşı</span></button>
                <button type="button" disabled={!secili.size || !!topluGidiyor} onClick={() => toplu(filtre === "arsiv" ? "arsivdenCikar" : "arsivle")} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-white disabled:opacity-40">{topluGidiyor === "arsivle" || topluGidiyor === "arsivdenCikar" ? <Loader2 className="h-4 w-4 animate-spin" /> : filtre === "arsiv" ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}<span className="max-sm:hidden">{filtre === "arsiv" ? "Arşivden çıkar" : "Arşivle"}</span></button>
                <button type="button" disabled={!secili.size || !!topluGidiyor} onClick={() => toplu("sil")} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-rose-500/[0.12] px-3 text-[12.5px] text-rose-200 disabled:opacity-40">{topluGidiyor === "sil" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Sil</button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <IceAktarPaneli acik={iceAcik} kapat={() => setIceAcik(false)} bitti={yenile} />
    </div>
  );
}
